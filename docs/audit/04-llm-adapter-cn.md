# 04 — 国产 LLM 适配方案

**审查日期：** 2026-05-09
**项目 commit 基线：** `0f08c91 ds version`
**适配目标：** DeepSeek（主用） + 通义千问（PDF 长文本备用） + 智谱 GLM（备用）
**目标场景：** 10K 总注册（DAU 1.5K、活跃用户每日约 10 次 AI 请求）
**当前状态：** ai-service 仅支持 OpenAI / Anthropic 双分支硬编码，无国产模型适配
**前置文档：** `01-architecture-audit.md` §2.3、§4.4 ai-service 节；`02-optimization-roadmap.md` P1-03/04/09
**对应路线图条目：** P1-03（Provider 抽象，16h）、P1-04（Prompt Redis 缓存，8h）、P1-09（用户级 AI 配额，4h）

---

## 1. 现状分析

### 1.1 当前 LLM 调用代码点

**Python 侧（ai-service）：**

- `app/services/llm_service.py:13-115` — `LLMService.generate(prompt, system_prompt, temperature)` 是**全部 5 个 router 的唯一 LLM 入口**。
  - 内部 if 分支：`settings.llm_provider == "anthropic"` → `_generate_anthropic`，否则 `_generate_openai`（第 55-62 行）。
  - 第 50-73 行重试 3 次，指数退避（2/4/8s），`except Exception` 一刀切。
  - 第 102-106 行 `max_tokens=4096` 硬编码、`temperature` 由调用方传。
- `app/config.py:8-15` — Settings 字段：`openai_api_key/base_url/model`、`anthropic_api_key/model`、`llm_provider`，未配置时默认空串、启动不报错。
- `app/main.py:24-29` — lifespan 仅 log 一行 `LLM 提供商: %s`，**没有任何启动时校验**。
- 5 个 router 调用模式完全一致（`knowledge_extract.py`、`quiz_generate.py`、`relation_suggest.py`、`content_enhance.py`、`pdf_parse.py`）：`get_knowledge_service()` → `await service.xxx(...)` → 内部走 `LLMService.generate`。`ValueError` 映射 503，其他 `Exception` 映射 500。

**Java 侧（backend）：**

- `backend/src/main/java/com/study11408/service/AiClientService.java:15-101` — 5 个方法 `extractKnowledge / suggestRelations / generateQuiz / enhanceContent / parsePdf` 直连 ai-service `/ai/extract`、`/ai/suggest-relations` 等。
- **不直接调 LLM**，全部通过 ai-service。这意味着所有国产 LLM 适配都集中在 Python 侧，Java 侧零改动。
- 已知问题：`new RestTemplate()` 无 timeout（详见 `01-architecture-audit.md` §4.2 AiClientService 节，🔴），AI 服务卡死会传染整个 backend 线程池——这与 LLM 适配相邻但是 backend P0 范畴，不在本文档展开。

### 1.2 已识别的 LLM 相关问题（cross-ref `01-architecture-audit.md`）

| 编号 | 严重 | 问题 | 位置 |
|---|---|---|---|
| #1 | 🟠 | API key 启动不校验，第一次调用才 ValueError | `ai-service/app/config.py:8,12` |
| #2 | 🟠 | 重试 3 次 + 退避 14s 浪费用户等待 | `app/services/llm_service.py:50-73` |
| #3 | 🟠 | `except Exception` 不区分异常，401/400/quota 也重试 | 同上 |
| #4 | 🟠 | docker-compose.yml ai-service 仅注 `DEBUG=false`，未注入任何 LLM key | `docker-compose.yml`（line 62 附近） |
| #5 | 🟡 | `max_tokens=4096` 硬编码 | `llm_service.py:103-115` |

**本地 curl 实测错误返回原文**（来自 `05-local-validation.md` §4.5）：

```
HTTP 500
{"detail":"知识点提取失败: LLM 调用在 3 次尝试后仍然失败: OpenAI API key 未配置。请在 .env 文件中设置 OPENAI_API_KEY。"}
```

调用耗时 14 秒。任何一次 4xx 类业务错误（key 错、配额超）都会被退避 14s 才告诉用户——这是国产 LLM 适配前必须先解决的体验问题。

---

## 2. 快通道：DeepSeek 立即接入（0 代码改动）

### 2.1 原理

DeepSeek API 完全兼容 OpenAI Chat Completions schema（同 endpoint 路径 `/chat/completions`、同 request body、同 response 结构）。当前 `LLMService._generate_openai` 用 `AsyncOpenAI(api_key=..., base_url=...)` 构造 client，仅需把 `base_url` 指向 DeepSeek、`model` 改为 `deepseek-chat` 即可，**零代码修改**。

### 2.2 操作

在 `docker-compose.yml` 的 `ai-service.environment` 块下增补三行（替换现有仅 `DEBUG=false` 的写法）：

```yaml
ai-service:
  environment:
    DEBUG: "false"
    LLM_PROVIDER: openai
    OPENAI_API_KEY: ${DEEPSEEK_API_KEY}
    OPENAI_BASE_URL: https://api.deepseek.com/v1
    OPENAI_MODEL: deepseek-chat       # 或 deepseek-reasoner
```

宿主侧 `.env`：

```bash
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

`docker compose up -d ai-service` 重启即生效。

### 2.3 验证

```bash
curl -X POST http://localhost:18081/ai/extract \
  -H 'Content-Type: application/json' \
  -d '{"text":"二叉树是一种重要的非线性数据结构,每个节点至多有两个子节点...","subject":"408","topic":"数据结构"}'
# 期望：返回 {"knowledge_points":[...]} 且耗时 1-3 秒
```

健康检查：`curl http://localhost:18081/ai/health` 返回 `"llm_provider":"openai"`，但实际指向 DeepSeek。日志 `LLM 提供商: openai` 行不变。

### 2.4 局限

1. 只能接 OpenAI 兼容 API（DeepSeek、Moonshot Kimi、Together、智谱 GLM-4 OpenAI compatible 模式、本地 vLLM 等）。
2. 切不同 provider 要重启服务（环境变量绑定）。
3. **无法 A/B 多家**：所有 router 共用同一个 client。
4. 计费/限流统一记在一个 OpenAI key 上，多 provider 场景下日志难拆。
5. 健康检查 `/ai/health` 仍报 `openai`，给运维错觉。
6. 不解决 §1.2 #1 #2 #3 #4 任何一个问题——key 仍可能漏配、仍重试 14s、仍不区分异常。

**结论：** 适合 M2 上线候选阶段先跑起来；正式抽象层（§3）应在 M3 前完成。

---

## 3. 正式 Provider 抽象层设计（P1-03）

### 3.1 目标

- 同时支持 OpenAI / DeepSeek / Moonshot 等 OpenAI 兼容、通义千问 DashScope、智谱 ZhipuAI。
- 运行时按 `LLM_PROVIDER` 环境变量切换。
- 后续支持每个 router 独立选 provider（如 PDF 解析用 Qwen-Long 1M context、出题用 DeepSeek-Chat）。
- 启动时一次性校验 key 与连通性（修 §1.2 #1）。
- 区分可重试异常与业务异常（修 §1.2 #3）。

### 3.2 接口定义

```python
# ai-service/app/services/llm/base.py
from abc import ABC, abstractmethod
from typing import Optional

class LLMProvider(ABC):
    @abstractmethod
    async def chat(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> str:
        """统一对话接口，返回助手消息文本。"""

    @abstractmethod
    def name(self) -> str:
        """返回 provider 名（用于日志、缓存 key、计费区分）。"""

    def estimate_tokens(self, text: str) -> int:
        # 粗估：英文 4 chars/token、中文 1.5 chars/token；
        # 真实计费以 provider 返回 usage 为准。
        cn = sum(1 for c in text if "一" <= c <= "鿿")
        return int(cn / 1.5 + (len(text) - cn) / 4)
```

### 3.3 实现 1：OpenAI 兼容（OpenAI / DeepSeek / Moonshot / Together）

```python
# ai-service/app/services/llm/openai_compat.py
from openai import AsyncOpenAI
from app.services.llm.base import LLMProvider

class OpenAICompatProvider(LLMProvider):
    def __init__(self, api_key: str, base_url: str, model: str, name: str = "openai-compat"):
        self.client = AsyncOpenAI(api_key=api_key, base_url=base_url)
        self.model = model
        self._name = name

    def name(self) -> str:
        return self._name

    async def chat(self, prompt, system_prompt=None, temperature=0.7, max_tokens=4096):
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        resp = await self.client.chat.completions.create(
            model=self.model, messages=messages,
            temperature=temperature, max_tokens=max_tokens,
        )
        return resp.choices[0].message.content or ""
```

### 3.4 实现 2：通义千问（DashScope SDK）

```python
# ai-service/app/services/llm/qwen.py
import asyncio
import dashscope
from dashscope import Generation
from app.services.llm.base import LLMProvider

class QwenProvider(LLMProvider):
    def __init__(self, api_key: str, model: str = "qwen-turbo"):
        dashscope.api_key = api_key
        self.model = model

    def name(self) -> str:
        return "qwen"

    async def chat(self, prompt, system_prompt=None, temperature=0.7, max_tokens=4096):
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        # DashScope 是同步 SDK，用 asyncio.to_thread 包装避免阻塞 event loop
        resp = await asyncio.to_thread(
            Generation.call,
            model=self.model, messages=messages,
            temperature=temperature, max_tokens=max_tokens,
            result_format="message",
        )
        if resp.status_code != 200:
            raise RuntimeError(f"Qwen 调用失败: {resp.code} {resp.message}")
        return resp.output.choices[0].message.content
```

### 3.5 实现 3：智谱 GLM（ZhipuAI SDK）

```python
# ai-service/app/services/llm/glm.py
import asyncio
from zhipuai import ZhipuAI
from app.services.llm.base import LLMProvider

class GLMProvider(LLMProvider):
    def __init__(self, api_key: str, model: str = "glm-4"):
        self.client = ZhipuAI(api_key=api_key)
        self.model = model

    def name(self) -> str:
        return "glm"

    async def chat(self, prompt, system_prompt=None, temperature=0.7, max_tokens=4096):
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        resp = await asyncio.to_thread(
            self.client.chat.completions.create,
            model=self.model, messages=messages,
            temperature=temperature, max_tokens=max_tokens,
        )
        return resp.choices[0].message.content
```

### 3.6 工厂与配置

`app/config.py` 新增字段：

```python
# 国产 provider
deepseek_api_key: str = ""
deepseek_model: str = "deepseek-chat"
moonshot_api_key: str = ""
moonshot_model: str = "moonshot-v1-8k"
qwen_api_key: str = ""
qwen_model: str = "qwen-turbo"
glm_api_key: str = ""
glm_model: str = "glm-4-air"
```

工厂：

```python
# ai-service/app/services/llm/factory.py
from app.config import Settings
from app.services.llm.base import LLMProvider
from app.services.llm.openai_compat import OpenAICompatProvider
from app.services.llm.qwen import QwenProvider
from app.services.llm.glm import GLMProvider

PROVIDER_BUILDERS = {
    "openai":   lambda s: OpenAICompatProvider(s.openai_api_key,   s.openai_base_url or "https://api.openai.com/v1", s.openai_model,   "openai"),
    "deepseek": lambda s: OpenAICompatProvider(s.deepseek_api_key, "https://api.deepseek.com/v1",                    s.deepseek_model, "deepseek"),
    "moonshot": lambda s: OpenAICompatProvider(s.moonshot_api_key, "https://api.moonshot.cn/v1",                     s.moonshot_model, "moonshot"),
    "qwen":     lambda s: QwenProvider(s.qwen_api_key, s.qwen_model),
    "glm":      lambda s: GLMProvider(s.glm_api_key, s.glm_model),
}

def get_provider(settings: Settings) -> LLMProvider:
    p = settings.llm_provider.lower()
    if p not in PROVIDER_BUILDERS:
        raise ValueError(f"未知 provider: {p}; 可选 {list(PROVIDER_BUILDERS)}")
    return PROVIDER_BUILDERS[p](settings)
```

### 3.7 启动时校验（修 §1.2 #1 #2）

```python
# 改 ai-service/app/main.py 的 lifespan
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("=== %s 启动 ===", settings.app_name)
    provider = get_provider(settings)
    try:
        await asyncio.wait_for(provider.chat("ping", max_tokens=8), timeout=10.0)
        logger.info("LLM provider %s 校验通过", provider.name())
    except Exception as e:
        logger.error("LLM provider %s 校验失败: %s", provider.name(), e)
        raise   # 强约束：key 不通直接拒绝启动；如需弱约束改 logger.warning
    yield
    logger.info("=== %s 关闭 ===", settings.app_name)
```

启动失败的 stderr 立刻显示问题，不再是用户调用 14 秒后才知道。

### 3.8 重试改进（修 §1.2 #3）

```python
# 替换 llm_service.py:50-73 的循环
import httpx
from openai import APIConnectionError, APITimeoutError, InternalServerError

RETRYABLE = (
    APIConnectionError, APITimeoutError, InternalServerError,
    httpx.ConnectError, httpx.TimeoutException, asyncio.TimeoutError,
)

for attempt in range(1, max_retries + 1):
    try:
        return await provider.chat(prompt, system_prompt=system_prompt,
                                   temperature=temperature)
    except RETRYABLE as e:
        last_error = e
        logger.warning("LLM 可重试错误 (第 %d/%d): %s", attempt, max_retries, e)
        if attempt < max_retries:
            await asyncio.sleep(2 ** attempt)
    except Exception:
        # 不可重试（认证、参数错、配额超）立即抛
        raise

raise RuntimeError(f"LLM 调用在 {max_retries} 次尝试后仍然失败: {last_error}")
```

效果：业务错误 1 次失败立即返回；网络抖动按原退避策略重试。

---

## 4. 三家 Provider 对比

| 维度 | DeepSeek | 通义千问 | 智谱 GLM |
|---|---|---|---|
| **OpenAI SDK 兼容** | 完全兼容 | 部分（DashScope SDK 为主，亦提供 OpenAI compatible 模式但功能受限） | 部分（ZhipuAI SDK 为主，v4 提供 OpenAI 兼容模式） |
| **代表模型** | deepseek-chat / deepseek-reasoner | qwen-turbo / qwen-plus / qwen-long / qwen-max | glm-4 / glm-4-air / glm-4-flash |
| **上下文长度** | 128K | 8K - 1M（qwen-long 1M） | 128K |
| **价格输入（¥/M tokens，截至 2025）** | chat 约 ¥1 / reasoner 约 ¥4 | turbo 约 ¥0.3 / plus 约 ¥4 / long 约 ¥0.5 | glm-4 约 ¥10 / air 约 ¥1 / flash 免费 |
| **价格输出（¥/M tokens，截至 2025）** | chat 约 ¥2 / reasoner 约 ¥16 | turbo 约 ¥0.6 / plus 约 ¥12 / long 约 ¥2 | glm-4 约 ¥10 / air 约 ¥1 / flash 免费 |
| **国内默认 QPS（Tier1）** | 60 RPM | 阶梯式（实名+消费提阶） | 阶梯式（实名+消费提阶） |
| **合规** | 国内 | 国内 | 国内 |
| **典型用途** | 出题、知识解释、关系推荐（性价比最高） | PDF 长文本（qwen-long 1M context）、中文场景 | 兜底备选；glm-4-flash 灰度免费验证 |

**推荐策略：**

- **主用：DeepSeek-Chat**——覆盖 4/5 router（`/ai/extract`、`/ai/generate-quiz`、`/ai/suggest-relations`、`/ai/enhance`），性价比最高、SDK 零摩擦。
- **PDF 解析：通义千问 qwen-long**——`/ai/parse-pdf` 切给 Qwen，1M 上下文能直接吃整本教材切片，¥0.5/M 输入超便宜。
- **备用 / 灰度：智谱 glm-4-flash**——免费层做新功能 A/B、降级兜底。

> 价格信息为公开报价，截至 2025 年；正式接入前以官方计费页为准。

---

## 5. Prompt 缓存策略（P1-04）

### 5.1 应用层缓存（Redis）

- **Key**：`llm:` + `sha256(provider_name : model : system_prompt : user_prompt)`
- **Value**：序列化的 LLM 响应文本（直接 string，无需 JSON）
- **TTL**：7 天（教学内容更新缓慢）
- **失效策略**：管理员手动 `redis-cli DEL` 或 key 中带版本号 `v=1` 滚动失效

```python
# ai-service/app/services/llm/cache.py
import hashlib
from app.dependencies import get_redis      # 假设已存在 Redis client 工厂
from app.services.llm.base import LLMProvider

LLM_CACHE_TTL = 7 * 24 * 3600

async def cached_chat(provider: LLMProvider, prompt: str,
                      system_prompt: str | None = None, **kwargs) -> str:
    key = "llm:" + hashlib.sha256(
        f"{provider.name()}:{provider.__dict__.get('model','')}:"
        f"{system_prompt or ''}:{prompt}".encode("utf-8")
    ).hexdigest()
    redis = await get_redis()
    if (cached := await redis.get(key)) is not None:
        return cached.decode() if isinstance(cached, bytes) else cached
    result = await provider.chat(prompt, system_prompt=system_prompt, **kwargs)
    await redis.setex(key, LLM_CACHE_TTL, result)
    return result
```

> 注意：当前 ai-service 未引入 Redis 客户端（仅 backend 配了 Lettuce）。P1-04 须先把 `redis.asyncio.Redis` 加入 ai-service 依赖与 `dependencies.py` 工厂。

### 5.2 离线预生成（PostgreSQL）

- **场景**：4 学科 × 平均 18-20 节点 ≈ 74 核心知识点，每个 × {解释 1, 选择题 5, 简答题 3} = 约 660 条预生成内容（含分类多项 ≤ 1000 条）。
- **执行**：管理员脚本 / Flyway afterMigrate hook / 定时任务，离线一次性调 LLM 入库。
- **服务方调用**：先查 `pregenerated_content`，未命中再实时调 LLM（命中后立即缓存到 Redis）。
- **优点**：高频请求 0 token 成本、首屏即返结果。

新表（建议作为 V4 迁移加入 backend Flyway，AI 服务以只读访问；或单独存 ai-service 独立 schema）：

```sql
CREATE TABLE pregenerated_content (
    id              BIGSERIAL PRIMARY KEY,
    node_id         BIGINT NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    content_type    VARCHAR(50) NOT NULL,    -- 'explanation' / 'quiz_choice' / 'quiz_short'
    content         TEXT NOT NULL,
    metadata        JSONB,
    generated_by    VARCHAR(50) NOT NULL,    -- provider name
    model           VARCHAR(100) NOT NULL,
    generated_at    TIMESTAMPTZ DEFAULT now(),
    UNIQUE(node_id, content_type)
);
CREATE INDEX idx_pregen_node_type ON pregenerated_content(node_id, content_type);
```

---

## 6. 限流与配额（P1-09）

### 6.1 用户级配额

- 每用户每天 100 次 AI 请求（free tier）
- 每用户每月 30K tokens
- 超额返回 HTTP 429 + 友好提示

实现（前置：ai-service 引入 Redis）：

```python
from datetime import date, datetime
from fastapi import HTTPException

async def check_user_quota(user_id: int):
    redis = await get_redis()
    day_key = f"quota:user:{user_id}:{date.today().isoformat()}"
    count = await redis.incr(day_key)
    if count == 1:
        await redis.expire(day_key, 86400)
    if count > 100:
        raise HTTPException(429, "今日 AI 请求次数已达上限（100 次）")
```

调用链：backend `AiClientService` 在请求 header 加 `X-User-Id`（已知 backend 的 `JwtAuthenticationFilter` 能拿到 userId，但当前 `AiClientService` 5 个方法都没注入，配合 `01-architecture-audit.md` §4.2 一并改造）。ai-service 在每个 router 入口先 `check_user_quota`。

### 6.2 Provider 级 QPS 与降级

- 每个 provider 独立计数，避免单家 provider 被打挂拖累全局
- DeepSeek 60 RPM 用 Redis 滑动窗口限制；超限自动 fallback 到 qwen-turbo / glm-4-flash
- 简单 Token Bucket：

```python
async def acquire_provider_slot(provider_name: str, rpm_limit: int) -> bool:
    redis = await get_redis()
    bucket = f"provider:rpm:{provider_name}:{datetime.utcnow().minute}"
    used = await redis.incr(bucket)
    if used == 1:
        await redis.expire(bucket, 70)
    return used <= rpm_limit
```

调用方：先 `acquire_provider_slot("deepseek", 60)`，false 则切 fallback。

---

## 7. 10K 用户成本估算

### 7.1 假设

- 总注册：10K
- 月活 30%：3K MAU
- 活跃用户每天 10 次 AI 请求 → 月人均 300 次
- 总月调用：3000 × 300 = 90 万次
- 平均每次：1K tokens 输入 + 500 tokens 输出
- 总月 tokens：900M 输入 + 450M 输出

### 7.2 三种方案成本对比

| 方案 | 输入成本 | 输出成本 | 月度合计 |
|---|---|---|---|
| **DeepSeek-Chat（无缓存）** | 900M × ¥1 = ¥900 | 450M × ¥2 = ¥900 | **约 ¥1800** |
| **DeepSeek + 50% Redis 缓存命中** | 450M × ¥1 = ¥450 | 225M × ¥2 = ¥450 | **约 ¥900** |
| **DeepSeek + 50% Redis + 80% 高频预生成** | 90M × ¥1 = ¥90 | 45M × ¥2 = ¥90 | **约 ¥180** |
| **混合：DeepSeek 80% + Qwen-Long 15%（PDF） + GLM-Flash 5%** | 复合估算 | 复合估算 | **约 ¥1100（无缓存）/ 约 ¥250（含缓存+预生成）** |

### 7.3 推荐分阶段方案

- **第一阶段（M2 上线候选）**：DeepSeek + Redis 缓存 → 月度约 ¥900。
- **第二阶段（M3 正式上线）**：加入预生成 + 高频内容入库 → 月度降至 ¥180-300。
- **第三阶段（M4+ 流量增长）**：多 Provider 路由 + 自动降级 + 用户配额收紧 → 抗 provider 风险，可控在 ¥500/月以内。

> 国产 provider 普遍提供新用户免费额度（DeepSeek 注册赠 ¥10 / Qwen 上线赠 100 万 tokens / GLM 注册赠 100 万 tokens），M1-M2 阶段实际现金支出可接近 0。

---

## 8. 集成路线图（cross-ref `02-optimization-roadmap.md`）

| 优先级 | 任务 | 对应路线条 | 预估 |
|---|---|---|---|
| P0（含在快通道） | docker-compose env 注入 DeepSeek key、改 LLM_PROVIDER | P0-13 | 1h |
| P0 | 启动时 LLM 校验 + 重试区分异常 | P0-13 延伸 | 2h |
| P1-03 | Provider 抽象层（OpenAI 兼容 / Qwen / GLM 三实现 + factory） | P1-03 | 16h |
| P1-04 | Prompt Redis 缓存层 + ai-service 引入 redis 客户端 | P1-04 | 8h |
| P1-09 | 用户级 AI 配额（每日 100 次、每月 30K tokens） | P1-09 | 4h |
| P2 | 离线预生成脚本 + `pregenerated_content` 表 + 优先查 DB 逻辑 | 新增 P2 | 16h |
| P2 | 多 Provider 路由 + 自动降级（QPS 滑窗 + fallback） | 新增 P2 | 16h |

总工作量约 63h；M2-M3 周期内由 1 名后端工程师可完成 P0 + P1-03/04/09。

---

## 9. 收口

- **快通道**：今天就能用 DeepSeek（0 代码、改 docker-compose env），M2 上线候选可立即接通生产。
- **正式抽象**：M3 上线前完成 Provider 抽象 + Redis 缓存 + 用户配额，覆盖 DeepSeek/Qwen/GLM 三家，启动时校验消除 §1.2 #1 #2 #4。
- **成本可控**：10K 用户场景在 ¥180-1800/月区间，依缓存策略与预生成覆盖率而定，远低于 OpenAI 等价方案（同等 token 量约 $5K-10K/月 ≈ ¥35K-70K/月）。
- **后续验证**：DashScope / ZhipuAI 同步 SDK 在 `asyncio.to_thread` 包装下的实际并发性能，需在 M3 前用 `locust` 或 `wrk` 做 50 并发压测，必要时引入第三方 async wrapper 或自研 httpx-based client。
- **未覆盖项**：本方案未涉及 embedding 模型适配（当前项目无向量检索需求）；如后续引入 RAG，建议追加 BGE-M3 / Qwen3-Embedding 等开源 embedding 适配文档。
