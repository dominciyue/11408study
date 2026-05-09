# 11408study 架构审查与优化方案 — 设计文档

**日期：** 2026-05-09
**项目：** dominciyue/11408study
**作者：** Claude (Opus 4.7) + 用户协作

---

## 1. 背景与目标

### 1.1 项目背景
11408study 是一个面向考研 408（计算机专业基础综合）+ 政治/英语一/数学一的交互式学习平台。
当前已完成 6 周开发计划中的第 1-2 周（137 个源文件），三端骨架完整，知识图谱核心引擎可用。

### 1.2 用户目标（已确认）
- **首要目标：** 全面架构审查 + 优化方案（不立即实施大规模改造）
- **部署条件：** 暂无服务器，需要本地跑通 + 完整生产部署文档
- **AI 策略：** 适配国产模型（DeepSeek / 通义千问 / 智谱 GLM）
- **容量基线：** 10K 总注册用户（DAU 1-2K，峰值并发 ~100）— 轻量场景

### 1.3 非目标
- 不实施大规模代码重构（仅修阻塞本地跑通的 blocker）
- 不写新的业务功能（如 SM-2、Quiz 引擎等遵循原 6 周计划，本次不做）
- 不真实部署到云端（只产出可执行的部署方案）

---

## 2. 交付物

共 **6 份文档**，统一存放于 `docs/audit/`：

| 序号 | 文件 | 内容 | 估字数 |
|---|---|---|---|
| 0 | `00-overview.md` | 执行摘要、Top 5 风险、推荐路径 | 500 |
| 1 | `01-architecture-audit.md` | 架构审查报告（按层 + 横切 + 代码级 + DB schema） | 4000-6000 |
| 2 | `02-optimization-roadmap.md` | P0/P1/P2 路线图（每条含问题/方案/工作量/验收） | 3000-4000 |
| 3 | `03-production-deployment.md` | 10K 用户生产部署方案（架构图、prod compose、Nginx、监控、备份、成本） | 4000-5000 |
| 4 | `04-llm-adapter-cn.md` | 国产 LLM 适配方案（接口设计、三家对比、缓存、成本） | 2000-3000 |
| 5 | `05-local-validation.md` | 本地跑通验证报告（步骤、blocker、修复、状态） | 1500-2500 |

**总计约 15K-21K 字。**

---

## 3. 工作流程

```
1. 本地环境验证          → 边跑边记录 → 喂养 doc 5
2. 跑通后做代码 review    → 喂养 doc 1, 2
3. 撰写部署与适配方案     → 产出 doc 3, 4
4. 最后写 overview        → 产出 doc 0
5. 一次性提交整个 docs/audit/ 目录
```

**关键原则：** 审查报告中的所有问题必须有出处（文件路径 + 行号），所有优化建议必须给出预估工作量与验收标准。

---

## 4. 各文档详细范围

### 4.1 doc 0 — 执行摘要
- 项目当前能力综述（一段话）
- Top 5 必须解决的风险（含安全/部署/成本三类）
- 推荐分阶段实施路径（3 个里程碑：M1 本地完整跑通，M2 P0 修复 + 上线候选，M3 P1 修复 + 正式上线）

### 4.2 doc 1 — 架构审查报告
**按层评估：**
- 前端（Next.js 16）：路由设计、状态管理、API 调用、错误边界、可访问性、SSR/CSR 选择、bundle 体积
- 后端（Spring Boot 3）：分层、事务、JPA 用法、缓存、安全过滤链、异常处理
- AI 服务（FastAPI）：路由、模型调用、错误传递、超时、并发模型
- 数据层：PostgreSQL schema 设计（索引、字段类型、约束）、Redis 用法、MinIO

**横切关注点：**
- 安全：JWT 实现、密码存储、CORS、CSRF、SQL 注入、XSS、Secret 管理
- 性能：数据库 N+1、缓存命中率、前端加载性能、AI 调用并发
- 可扩展性：单点、状态共享、横向扩展障碍
- 可观测性：日志、指标、追踪、健康检查
- 可维护性：测试覆盖、代码风格、文档、依赖管理

**代码级深度审查（抽样）：**
- `JwtAuthenticationFilter` + `AuthService` — 认证链
- `KnowledgeGraphService` 的 BFS / 全文搜索查询
- `SpacedRepetitionService` 的 SM-2 实现
- `AiClientService` 的 AI 调用封装
- 任意 1-2 个 Controller 的输入校验

**严重等级标签：** 🔴 阻塞 / 🟠 高 / 🟡 中 / 🟢 低

### 4.3 doc 2 — 优化路线图
按 P0/P1/P2 三级排序，每条结构：
```
### [P0-001] 标题
- **问题：** 描述与影响
- **位置：** 文件:行号
- **根因：** 为什么会这样
- **方案：** 怎么改（伪代码/配置示例）
- **工作量：** X 小时
- **验收：** 怎么验证修好了
- **依赖：** 是否依赖其他任务
```

P0 = 阻塞上线（安全、数据丢失、起不来）
P1 = 上线前必修（性能、可观测、可扩展）
P2 = 上线后第一个迭代（优化、UX、技术债）

### 4.4 doc 3 — 生产部署方案
**针对 10K 总注册（轻量场景）的目标架构：**
- 单 VPS（4C8G）+ docker-compose 起所有服务
- Nginx 反代 + Let's Encrypt HTTPS + 限流
- PostgreSQL 单机 + 每日 pg_dump 备份到对象存储
- Redis 单机
- MinIO 单机 + bucket 版本化
- 监控：Prometheus + Grafana + Loki（同机）

**内容：**
1. 推荐架构图（mermaid）
2. `docker-compose.prod.yml` 完整草稿（含 healthcheck、resource limits、network、volume）
3. Nginx 生产配置（HTTPS、gzip、限流、缓存、安全 header）
4. PostgreSQL 调优参数
5. 备份脚本（pg_dump + MinIO sync + 定时）
6. 监控栈接入步骤
7. CI/CD 建议（GitHub Actions / GitLab CI 选型）
8. 环境变量与 secret 管理
9. 容量预估与扩容路径（何时升级到 8C16G、何时引入 k8s）
10. 月度成本估算（阿里云 / 腾讯云价格）

### 4.5 doc 4 — 国产 LLM 适配方案
1. 现状代码分析（`AiClientService.java`、`llm_service.py` 中的硬编码点）
2. **Provider 接口抽象设计：**
   - Python 侧 abstract class `LLMProvider` + `OpenAIProvider` / `DeepSeekProvider` / `QwenProvider` / `GLMProvider` 实现
   - 统一接口：`async def chat(messages, model, **kwargs) -> response`
3. **三家对比表：** API 兼容性、上下文长度、价格、QPS、合规、推荐用法
4. **推荐：** DeepSeek-Chat 主用 + Qwen-Long 备用（PDF 长文档场景）
5. **缓存策略：**
   - 应用层：Redis 缓存 prompt hash → response（TTL 7 天）
   - 离线预生成：高频内容（如固定知识点解释）批量预生成入 PostgreSQL
6. **限流策略：** 用户日配额、模型级 QPS 限制
7. **成本估算：** 10K 注册 × 假设场景的 token 消耗（出题/解释/PDF 提取分别估算）

### 4.6 doc 5 — 本地跑通验证报告
- 环境信息（Docker / Java / Node / Python 版本）
- 操作步骤（按顺序：启 dep、启后端、启 AI、启前端）
- 遇到的 blocker 与修复（含 commit/diff）
- 端口冲突解决（已知：MinIO 9000 与 ClickHouse 冲突）
- 各端启动后的验证结果（接口、首页、DB 数据）
- 已知未修复问题清单

---

## 5. 风险与权衡

### 5.1 已知风险
- **本地跑通可能比预期慢：** 第一次起 Spring Boot 大型项目，依赖下载 + Flyway migration 估计 5-10 分钟；如果遇到代码 bug 需要现场修。**缓解：** 严格只修阻塞 blocker，其他问题写入审查报告。
- **代码量大无法逐文件审查：** 137 个源文件难以全部细读。**缓解：** 抽样 + 按类别（auth、graph、AI、最近改动）覆盖。
- **国产 LLM API 文档可能过时：** Anthropic SDK 知识截止 2026 年初。**缓解：** 设计层面给出适配方案，具体 API 调用细节由实施时核对官方文档。

### 5.2 范围外
- 不写实际的 SM-2/Quiz 业务逻辑
- 不接通真实 LLM API（仅给适配方案）
- 不真实部署到云

---

## 6. 验收标准

- ✅ 6 份文档全部产出，total 15K+ 字
- ✅ 后端、AI 服务、前端在本地至少能启动到健康检查通过
- ✅ 所有审查问题有文件:行号引用
- ✅ 所有优化项有工作量与验收标准
- ✅ 部署方案可被一个有 Linux/Docker 基础的工程师按步执行
- ✅ 国产 LLM 适配方案给出可直接 implement 的接口签名

---

## 7. 后续

完成本设计后：
1. 进入 writing-plans 阶段，把"本地跑通 + 撰写 6 份文档"拆成有序的实施步骤
2. 用户 review 后开始执行
3. 完成后由用户决定是否进入"按路线图实际改代码"的下一阶段（独立会话）
