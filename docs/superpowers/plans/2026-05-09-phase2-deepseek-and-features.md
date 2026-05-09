# Phase 2 — DeepSeek 接入 + 竞品调研 + 新功能 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** 把 ai-service 真正跑通（有真实 LLM key 了），抽象 Provider 层支持 DeepSeek/OpenAI/Anthropic 切换；同时基于竞品调研选 1-2 个高价值新功能落地。

**Architecture:**
- ai-service 增加 `LLMProvider` 接口 + 工厂，DeepSeek 走 OpenAI-compat 接口
- 凭证通过 `ai-service/.env`（gitignored）注入，docker-compose 用 `env_file` 装载
- 新功能通过 backend → ai-service 调用链落地（保持现有架构）

**Tech Stack:** FastAPI + Pydantic Settings + httpx (or openai SDK), Spring Boot RestTemplate 客户端，Next.js 前端

---

## 起点状态

- 上一会话 26 commits 已推送（本地 origin/main = HEAD = 395e5bf）
- 7 容器运行中
- DeepSeek API key 已可用（环境内，未入仓）
- GitHub PAT 已可用（push 操作）
- /home 40 GB 可用

## 范围

### ✅ 本会话执行
- Phase A: DeepSeek 配置 + 启动验证 + ai-service 端到端调用
- Phase B-1: 竞品调研（subagent 并行）
- Phase B-2: LLMProvider 抽象 + DeepSeek 适配
- Phase C: 1-2 个新功能（基于 Phase B-1 选定）
- Phase D: 测试 + push + 日志 + 清理

### ⏸️ 跳过
- 部署相关 P0（07-12）：仍按上次决策跳
- 监控/备份/CI 强化：留下次

---

## Phase A — DeepSeek 配置 + 启动验证

### Task A1: 创建 ai-service/.env（gitignored）

**Files:**
- Create: `ai-service/.env`

- [ ] **Step 1: 写 .env 文件**

```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=<DEEPSEEK_KEY_HERE>
OPENAI_BASE_URL=https://api.deepseek.com/v1
OPENAI_MODEL=deepseek-chat
ALLOW_MISSING_LLM_KEY=false
```

- [ ] **Step 2: 验证 .gitignore 命中**

Run: `git check-ignore -v ai-service/.env`
Expected: 命中 `.env` 规则

### Task A2: docker-compose 使用 env_file

**Files:**
- Modify: `docker-compose.yml:56-63`

- [ ] **Step 1: 加 env_file**

```yaml
ai-service:
  build:
    context: ./ai-service
    dockerfile: Dockerfile
  env_file:
    - ./ai-service/.env
  environment:
    DEBUG: "false"
  ports:
    - "8000:8000"
```

- [ ] **Step 2: 重启 ai-service**

Run: `docker compose up -d --no-deps ai-service`
Expected: ai-service Up，启动日志显示 `LLM provider validated`（或类似）

- [ ] **Step 3: 校验启动**

Run: `curl -s http://localhost:8000/health`
Expected: `{"status":"ok",...}`

### Task A3: DeepSeek 直连冒烟测试

- [ ] **Step 1: 直接 curl DeepSeek**

```bash
curl -s https://api.deepseek.com/v1/chat/completions \
  -H "Authorization: Bearer $DEEPSEEK_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-chat","messages":[{"role":"user","content":"你好"}],"max_tokens":50}'
```
Expected: 返回带 `choices[0].message.content` 的 JSON

- [ ] **Step 2: 通过 ai-service 测**

Run: `curl -s -X POST http://localhost:18081/ai/extract -H "Content-Type: application/json" -d '{"text":"知识点：栈的应用包括括号匹配、表达式求值、函数调用。"}'`
Expected: 200 + JSON 含 LLM 抽取出的知识点

---

## Phase B-1 — 竞品调研（subagent 并行）

### Task B1: 派 general-purpose subagent

- [ ] **Step 1: dispatch with brief**
  - 让 subagent WebSearch 5+ 个考研/智能学习平台
  - 每个站点 WebFetch 关键页面，提取功能特性
  - 输出 `docs/research/competitive-analysis.md`，含：站点 → 核心功能 → 对 11408study 的可借鉴度（高/中/低）+ 落地复杂度估
  - 限 800 字，重点突出"我们没有但显著有用的"功能

- [ ] **Step 2: 主对话不等待，继续 Phase B-2**

---

## Phase B-2 — LLMProvider 抽象（TDD）

### Task B2-1: 写抽象接口与失败测试

**Files:**
- Create: `ai-service/app/llm/__init__.py`
- Create: `ai-service/app/llm/provider.py` — 抽象基类
- Create: `ai-service/tests/test_llm_provider.py`

- [ ] **Step 1: 写抽象**

```python
# ai-service/app/llm/provider.py
from abc import ABC, abstractmethod

class LLMProvider(ABC):
    @abstractmethod
    def chat(self, messages: list[dict], **kwargs) -> str: ...

    @abstractmethod
    def name(self) -> str: ...
```

- [ ] **Step 2: 写失败测试**

```python
# ai-service/tests/test_llm_provider.py
def test_provider_factory_returns_openai_for_openai_setting():
    from app.llm import get_provider
    p = get_provider(provider="openai", api_key="x", base_url="y", model="z")
    assert p.name() == "openai"

def test_provider_factory_returns_deepseek_for_deepseek_setting():
    from app.llm import get_provider
    p = get_provider(provider="deepseek", api_key="x", base_url="y", model="z")
    assert p.name() == "deepseek"

def test_provider_factory_unknown_raises():
    from app.llm import get_provider
    import pytest
    with pytest.raises(ValueError):
        get_provider(provider="grok", api_key="x", base_url="y", model="z")
```

- [ ] **Step 3: pytest 看 fail**

Run: `cd ai-service && python -m pytest tests/test_llm_provider.py -v`
Expected: FAIL（模块不存在）

### Task B2-2: 实现 OpenAI/DeepSeek/Mock provider

**Files:**
- Create: `ai-service/app/llm/openai_provider.py`
- Create: `ai-service/app/llm/deepseek_provider.py`
- Create: `ai-service/app/llm/factory.py`
- Modify: `ai-service/app/llm/__init__.py`

- [ ] **Step 1: 实现 OpenAI provider（用 openai SDK 已在 requirements）**

```python
# openai_provider.py
from openai import OpenAI
from .provider import LLMProvider

class OpenAIProvider(LLMProvider):
    def __init__(self, api_key, base_url, model):
        self.client = OpenAI(api_key=api_key, base_url=base_url)
        self.model = model
    def name(self): return "openai"
    def chat(self, messages, **kwargs):
        resp = self.client.chat.completions.create(
            model=self.model, messages=messages, **kwargs)
        return resp.choices[0].message.content or ""
```

- [ ] **Step 2: DeepSeek 复用 OpenAI（API 兼容）**

```python
# deepseek_provider.py
from .openai_provider import OpenAIProvider
class DeepSeekProvider(OpenAIProvider):
    def name(self): return "deepseek"
```

- [ ] **Step 3: factory**

```python
# factory.py
from .openai_provider import OpenAIProvider
from .deepseek_provider import DeepSeekProvider

def get_provider(provider, api_key, base_url, model):
    p = (provider or "").lower()
    if p == "openai": return OpenAIProvider(api_key, base_url, model)
    if p == "deepseek": return DeepSeekProvider(api_key, base_url, model)
    raise ValueError(f"unknown provider: {provider!r}")
```

- [ ] **Step 4: pytest 看 pass**

Run: `cd ai-service && python -m pytest tests/test_llm_provider.py -v`
Expected: 3/3 PASS

### Task B2-3: 把 llm_service.py 切到 Provider

**Files:**
- Modify: `ai-service/app/services/llm_service.py`

- [ ] **Step 1: 替换内部逻辑**

让 LLMService 在初始化时 `self.provider = get_provider(...)`，然后所有 chat 调用走 `self.provider.chat(...)`。删掉直接 instantiating openai client 的代码。

- [ ] **Step 2: 跑现有 12 个 pytest**

Run: `cd ai-service && python -m pytest -v`
Expected: 12+ pass（含新加的 3 个）

- [ ] **Step 3: 重启 ai-service 端到端再测一次 /extract**

Expected: 与 Phase A Task A3 Step 2 一致

### Task B2-4: commit

```bash
git add ai-service/
git commit -m "feat(ai-service): introduce LLMProvider abstraction with DeepSeek support"
```

---

## Phase C — 基于调研选 1-2 个高价值新功能

**待 Phase B-1 完成后展开。** 候选清单（按当前应用缺口排序）：

### 候选 C-α: AI 答疑助手（聊天式问答）
- 场景：用户在某个知识点页问"这道题为什么选 B"
- 后端：新建 `ChatController`，存 `chat_messages` 表，转发到 ai-service `/chat`
- 前端：Drawer/Sheet 浮窗
- 估时：3-4 h

### 候选 C-β: 错题本（错题集 + 复习推送）
- 场景：测验答错的题自动入"错题本"，与 SM-2 复习引擎挂钩
- 后端：用现有 `study_progress` + `quiz_questions` 关系，新建 `wrong_question_book` 视图
- 前端：错题本页面 + dashboard 卡片
- 估时：4-6 h

### 候选 C-γ: AI 学习计划生成
- 场景：用户填目标（科目 + 周数）→ AI 生成每周学习计划
- 后端：`/study-plan/generate` 调 DeepSeek
- 前端：表单 + 结果页
- 估时：3-5 h

### 选择标准
1. 是否真用上 DeepSeek（用了就有显示价值）
2. 是否解决"学习平台"核心痛点
3. 复杂度可控（4-6h 内能做完）

---

## Phase D — 收尾

### Task D1: 跑全套测试

Run:
```bash
cd backend && mvn test -Dtest='*UnitTest'
cd backend && mvn verify -DskipUnitTests -Dtest='*IT'  # IT 套
cd ai-service && python -m pytest
```
Expected: 全绿

### Task D2: commit + push

```bash
git status
git log --oneline origin/main..HEAD
# 用 PAT push（凭证不入仓）
git push origin main
```

### Task D3: 更新 dev-log

Append to `docs/dev-log/2026-05-09-autonomous-session.md`:
- 新增 Phase E（本次的 A/B/C/D）
- commit 列表
- 测试覆盖
- 端到端验证结果（DeepSeek 真实调用）

### Task D4: 空间清理

```bash
docker buildx prune -f
docker image prune -f
# host: 检查并清理 frontend/.next, backend/target 等若产生
```

Expected: /home 可用 ≥ 35 GB

---

## 自我评审

- 覆盖度：A→D 闭环；C 留缺口待 B-1 决定，写明候选与选择标准
- 占位符：除 Phase C 具体任务外，A/B/D 都有完整代码 + 命令
- 类型一致：`LLMProvider.chat(messages, **kwargs) -> str` 在所有 Task 里一致
- 凭证安全：DeepSeek key 通过 .env（gitignored），PAT 通过临时 URL 不入仓

---

## 风险与回退

| 风险 | 概率 | 影响 | 缓解 |
|---|---|---|---|
| DeepSeek API 限速/不稳 | 中 | 调用 fail | 已有 timeout + 不可重试快速失败（P0-06/13）|
| Provider 抽象引入 regression | 低 | AI 端点 5xx | TDD 全程，B2-3 后必跑 e2e |
| 新功能涉及前端样式跑偏 | 中 | UI 难看 | 每个 Phase C 任务完后浏览器 cURL 截屏存档 |
| 空间不足 | 低 | 构建失败 | D4 主动清理 + 中途 docker buildx prune |
