# 11408study 架构审查与优化方案 — 设计文档

**日期：** 2026-05-09
**项目：** dominciyue/11408study
**作者：** Claude (Opus 4.7) + 用户协作
**版本：** v2（基于 commit `0f08c91 ds version` 的"6 周冲刺已完成"基线）

---

## 0. 版本说明

本 spec 经过一次重写。原 v1 基于 commit `1e7e634`（仅完成第 1-2 周计划），但用户随后 push 了 `0f08c91`（一次性补完第 3-6 周内容，含 75 个文件 / 3197 行新增）。本 v2 基于新基线重新定义审查范围与重点。

---

## 1. 背景与目标

### 1.1 项目背景
11408study 是一个面向考研 408（计算机专业基础综合）+ 政治/英语一/数学一的交互式学习平台。
当前已完成原计划全部 6 周内容：知识图谱、SM-2 间隔重复、Quiz 引擎、错题本、笔记 CRUD、PDF 导入闭环、生产 docker-compose、Nginx 网关、CI、集成测试、E2E、PWA manifest。

### 1.2 用户目标（已确认）
- **首要目标：** 全面架构审查 + 优化方案（不立即实施大规模改造）
- **部署条件：** 暂无服务器，需要本地跑通 + 完整生产部署文档
- **AI 策略：** 适配国产模型（DeepSeek / 通义千问 / 智谱 GLM）
- **容量基线：** 10K 总注册用户（DAU 1-2K，峰值并发 ~100）— 轻量场景

### 1.3 非目标
- 不实施大规模代码重构（仅修阻塞本地跑通的 blocker）
- 不写新的业务功能
- 不真实部署到云端（只产出可执行的部署方案）

---

## 2. 当前代码基线快照

### 2.1 已完成（不再是审查"缺口"）
| 维度 | 落地 | 文件 |
|---|---|---|
| 生产 Docker 编排 | 单文件一键启动 6 个服务 + Nginx 网关 | `docker-compose.yml`，端口 18081 |
| 前端容器化 | Next.js standalone 多阶段构建 | `frontend/Dockerfile` |
| 后端测试镜像 | 容器内跑 mvn test | `backend/Dockerfile.test` |
| CI 流水线 | GitHub Actions 三任务（backend/frontend/ai） | `.github/workflows/ci.yml` |
| 集成测试 | Testcontainers + 3 个 IT 类（Import/Note/Quiz） | `backend/src/test/.../*IT.java` |
| E2E 测试 | Playwright smoke（注册→登录→dashboard） | `frontend/tests/smoke.spec.ts` |
| AI 测试 | pytest（health + pdf parser） | `ai-service/tests/` |
| Maven Wrapper | 不依赖本机 mvn | `backend/mvnw`, `.mvn/wrapper/` |
| PWA manifest | 已加 metadata.manifest 声明 | `frontend/public/manifest.webmanifest` |
| 笔记 CRUD | 含权限校验（只能操作自己的） | `NoteController/Service/DTO` |
| 资料导入闭环 | 上传→PDF 解析→提取→选 Topic→批量建节点 | `ImportController` + `materials/import/[id]/page.tsx` |
| Stats 真实实现 | DTO 化、含趋势 7 天数据 | `StatsService` + `StatsOverviewDTO` |
| 学习会话追踪 | V3 迁移加 subject/mode 字段 | `V3__study_sessions_mode_subject.sql` |
| Quiz 练习/错题本 | 双页面 + 后端 DTO 化 | `quiz/practice`, `quiz/wrong` + `WrongAnswerDTO` |
| Flyway 多版本迁移 | V1/V2/V3 三个迁移文件 | `db/migration/` |
| API 文档 | SpringDoc Swagger 已挂载 | `application.yml` |

### 2.2 仍是审查重点（确认存在的缺口）
| 维度 | 现状 | 优先级 |
|---|---|---|
| **HTTPS/TLS** | nginx 仅 80 端口、无 cert | 🔴 上线必须 |
| **Secret 管理** | JWT secret base64 写死在 `application.yml`、生产 compose 仍用开发密码 | 🔴 上线必须 |
| **CORS 策略** | 当前未审查（怀疑过宽） | 🔴 上线必须 |
| **限流** | 全无 API 限流 | 🟠 高 |
| **AI 配额** | 无用户级配额、无 token 计费 | 🟠 高 |
| **可观测性** | 无 actuator metrics 暴露、无 Prometheus exporter、无日志聚合 | 🟠 高 |
| **数据库备份** | 无 pg_dump 定时、无 MinIO 同步 | 🟠 高 |
| **LLM Provider 抽象** | 仅 OpenAI/Anthropic 双分支硬编码（DeepSeek 可借 base_url，但 Qwen/GLM 需正式抽象） | 🟠 高 |
| **Prompt 缓存** | 无 Redis 缓存层、无离线预生成 | 🟠 高 |
| **健康检查** | docker-compose 无 healthcheck，K8s 探针缺失 | 🟡 中 |
| **资源限制** | 容器无 cpu/memory limits | 🟡 中 |
| **数据库连接池调优** | HikariCP 默认配置（max=20）未针对 prod 调整 | 🟡 中 |
| **新代码质量隐患** | `@SuppressWarnings("unchecked")` 滥用、AI 错误以 Map 返回弱化类型 | 🟡 中 |
| **测试覆盖** | Auth/Knowledge/Stats/Study 关键链路无测试 | 🟡 中 |
| **PWA 完整性** | 仅 manifest，无 service worker、无离线策略、无图标集 | 🟢 低 |
| **国际化/无障碍** | 未审查 | 🟢 低 |
| **SEO/Open Graph** | 未审查 | 🟢 低 |
| **Pom 隐患** | `${lombok.version}` 在 maven-compiler-plugin 中引用但未在 properties 显式定义（依赖 spring-boot-parent 默认） | 🟡 中 |

### 2.3 待验证（本地跑通时确认）
- 三端在新 compose 下是否真能一键起来
- Flyway 三个迁移是否能干净执行
- 新增的 IT 测试是否真能通过（Testcontainers 拉容器）
- 前端到后端到 AI 的端到端调用链是否通畅

---

## 3. 交付物

共 **6 份文档**，统一存放于 `docs/audit/`：

| 序号 | 文件 | 内容（基于 v2 基线调整） | 估字数 |
|---|---|---|---|
| 0 | `00-overview.md` | 执行摘要、Top 5 上线前必修风险、3 阶段路径（M1 当前→M2 上线候选→M3 优化迭代） | 500 |
| 1 | `01-architecture-audit.md` | 架构审查报告：**评估新增代码的质量** + 横切关注点 + 代码级 review；标注 🔴🟠🟡🟢 等级 | 4000-6000 |
| 2 | `02-optimization-roadmap.md` | P0/P1/P2 优化路线图，**重点是上线前必修的剩余 P0**（HTTPS、Secret、CORS、限流） | 3000-4000 |
| 3 | `03-production-deployment.md` | 在现有 `docker-compose.yml` 基础上的**加固方案**（HTTPS、env 化、监控、备份、容量、成本） | 4000-5000 |
| 4 | `04-llm-adapter-cn.md` | **现状：DeepSeek 可借 OpenAI base_url，已提供"快通道"** + **正式 Provider 抽象层设计**（Qwen/GLM）+ Prompt 缓存策略 | 2000-3000 |
| 5 | `05-local-validation.md` | 用 `docker compose up` 跑通新基线的验证报告 | 1500-2500 |

**总计约 15K-21K 字。**

---

## 4. 工作流程（v2 调整）

```
1. 本地跑通验证（用新 docker-compose.yml）
   - 起 6 个服务 + Nginx
   - 跑后端 IT 测试（验证 Testcontainers 正常）
   - 跑前端 build 验证
   - 仅修阻塞本地跑通的 blocker
   - 成果 → doc 5
2. 代码质量审查（重点：新增代码）
   - ImportController, NoteService, StatsService 这三个新模块的 review
   - AiClientService 的错误处理与类型安全
   - 新 docker-compose.yml 的安全性
   - 成果 → doc 1
3. 路线图与部署方案
   - 基于 doc 1 的发现，输出 P0/P1/P2
   - 加固现有 prod compose（不重写，给增量方案）
   - 成果 → doc 2, 3
4. LLM 适配方案
   - 现状评估 + 双轨方案（快通道 + 正式抽象）
   - 成果 → doc 4
5. 执行摘要
   - 最后写 doc 0
```

**关键原则：**
- 所有审查问题必须有 `文件:行号` 引用
- 所有优化建议必须给出预估工作量与验收标准
- 区分"已实现 X 但有缺陷"与"完全缺失 Y"

---

## 5. 各文档详细范围

### 5.1 doc 0 — 执行摘要（v2 调整）
- 项目当前能力综述：**基本功能闭环已完成**，距上线主要差三件事（HTTPS / Secret / 限流）
- Top 5 上线前必修风险
- 3 阶段路径建议：
  - M1（当前）→ 本地跑通 + 完成本审查
  - M2（上线候选）→ 修完 P0（约 1-2 周）
  - M3（迭代优化）→ 修 P1/P2 + 真实负载测试

### 5.2 doc 1 — 架构审查报告（v2 调整）
**逐层评估（不变）：**
- 前端、后端、AI 服务、数据层

**横切关注点（不变）：**
- 安全、性能、可扩展性、可观测性、可维护性

**代码级深度审查（重点放在新增代码）：**
- `ImportController.java` — 类型转换安全、错误传播、AI 错误兜底
- `NoteController` + `NoteService` — 权限校验严密度、N+1 风险
- `StatsService.java` — 复杂统计查询的性能（fetch join 是否充分）
- `AiClientService.java` — RestTemplate 是否需要 timeout、连接池
- `SecurityConfig.java` — `actuator/**` 完全 permitAll 的风险
- `docker-compose.yml` — 密码、网络、healthcheck、资源限制
- `nginx/nginx.conf` — 安全 header、限流、HTTPS 准备

**严重等级标签：** 🔴 阻塞 / 🟠 高 / 🟡 中 / 🟢 低

### 5.3 doc 2 — 优化路线图（v2 调整）
按 P0/P1/P2 三级，每条结构同 v1。

**P0（上线必须，约 8-12 项，1-2 周工作量）：**
- HTTPS / Let's Encrypt 接入
- JWT secret 外部化（env / docker secret）
- DB / MinIO / Redis 密码外部化与强化
- CORS 白名单
- 基础限流（Nginx limit_req）
- AI 错误处理升级（不要 silently 返回 Map）

**P1（上线后第一个迭代，约 6-10 项）：**
- 监控栈（Prometheus + Grafana + Loki）
- 数据库备份脚本 + 测试恢复
- Actuator metrics 暴露 + 鉴权
- AI Provider 抽象层（Qwen/GLM 适配）
- Prompt 缓存
- 数据库连接池调优
- Healthcheck + restart policy

**P2（持续优化）：**
- 测试覆盖补齐
- 代码质量（去掉 unchecked 警告）
- PWA 完整性
- 国际化、无障碍

### 5.4 doc 3 — 生产部署方案（v2 调整）
**起点：** 现有 `docker-compose.yml`
**目标：** 加固为可上线的版本，输出 `docker-compose.prod.yml` 设计 + 配套配置

**内容：**
1. 推荐架构图（mermaid，单 VPS 4C8G 场景）
2. **`docker-compose.prod.yml` 增量改动清单**（基于现有文件）：
   - 加 healthcheck
   - 加 resource limits
   - 加 restart policy
   - 加 env 文件引用（`.env.prod`）
   - 加 logging driver 配置
3. Nginx 生产配置：HTTPS（Let's Encrypt + certbot）、gzip、限流、安全 header
4. PostgreSQL 调优参数
5. 备份脚本（pg_dump + MinIO sync + cron）
6. 监控栈接入步骤（同机部署）
7. CI/CD 建议（用现有 GitHub Actions 扩展为部署流水线）
8. 环境变量与 secret 管理（`.env.prod` 模板）
9. 容量预估与扩容路径
10. 月度成本估算（阿里云 / 腾讯云价格）

### 5.5 doc 4 — 国产 LLM 适配方案（v2 调整）
**核心结论先行：**
- **快通道**：DeepSeek API 与 OpenAI SDK 完全兼容，仅需在 `.env` 中设置 `OPENAI_BASE_URL=https://api.deepseek.com/v1` 和 `OPENAI_MODEL=deepseek-chat`，**0 代码改动即可切换**。
- **正式抽象**：为了支持非 OpenAI-兼容的 Qwen DashScope SDK 和 智谱 GLM ZhipuAI SDK，需要 Provider 抽象层。

**内容：**
1. 现状代码分析（`AiClientService.java`、`llm_service.py` 中的硬编码点 + 配置点）
2. **DeepSeek 快通道**：完整的 `.env.production` 模板 + 一键切换说明
3. **Provider 抽象层设计：**
   - Python abstract class `LLMProvider` + 4 个实现（OpenAI / DeepSeek / Qwen / GLM）
   - 接口签名与示例代码（Python pseudo）
4. **三家对比表**：API 兼容性、上下文长度、价格（截至 2025）、QPS 限制、合规、推荐用法
5. **缓存策略：**
   - 应用层：Redis 缓存 prompt SHA → response（TTL 7 天）
   - 离线预生成：高频内容（固定知识点解释、常考题）批量生成入 PostgreSQL
6. **限流策略：** 用户日配额、模型级 QPS 限制
7. **成本估算：** 10K 注册场景下三家 + 不同缓存命中率的成本对比

### 5.6 doc 5 — 本地跑通验证报告（v2 调整）
- 环境信息（Docker / Java / Node / Python 版本）
- 操作步骤（按顺序：`docker compose up -d --build` → 等服务起来 → curl 健康检查 → 浏览器访问）
- 遇到的 blocker 与修复（含 commit/diff）
- 端口冲突解决记录（已知：MinIO 9000 与 ClickHouse 冲突）
- 各服务启动后的验证结果：
  - PostgreSQL：连接 + 三个迁移版本
  - Backend：actuator/health + Swagger UI
  - AI Service：`/health` + 一个简单调用
  - Frontend：首页加载
  - Nginx：通过 `http://localhost:18081/` 访问
- 后端 IT 测试是否能跑通（`mvn test`）
- 已知未修复问题清单

---

## 6. 风险与权衡

### 6.1 已知风险
- **本地跑通可能比预期慢：** 第一次拉镜像 + Maven 依赖下载估计 10-20 分钟。**缓解：** 后端依赖镜像可先 docker pull 各 base，前端依赖可先 npm ci 热缓存。
- **新代码可能存在隐藏 bug：** "ds version" 一次性合并大量内容，可能没在所有路径上验证过。**缓解：** 尝试跑测试 + 端到端访问，问题写入 doc 5。
- **国产 LLM API 文档可能更新：** 知识截至 2026 年初，API 细节以官方文档为准。**缓解：** 设计层面给方案，具体调用细节由实施时核对。
- **MinIO 9000 端口与本机 ClickHouse 冲突：** 已识别。**缓解：** 临时停 ClickHouse 或改 compose 端口映射。

### 6.2 范围外
- 不实施 P0 修复（仅给方案）
- 不接通真实 LLM API（仅给适配方案）
- 不真实部署到云
- 不补测试覆盖（仅指出缺口）

---

## 7. 验收标准

- ✅ 6 份文档全部产出，total 15K+ 字
- ✅ 后端、AI 服务、前端在本地至少能启动到健康检查通过
- ✅ 所有审查问题有 `文件:行号` 引用
- ✅ 所有优化项有工作量与验收标准
- ✅ 部署方案可被一个有 Linux/Docker 基础的工程师按步执行
- ✅ 国产 LLM 适配方案给出可直接 implement 的接口签名 + 即时可用的 DeepSeek 快通道

---

## 8. 后续

完成本设计后：
1. 进入 writing-plans 阶段，把"本地跑通 + 撰写 6 份文档"拆成有序的实施步骤
2. 用户 review 后开始执行
3. 完成后由用户决定是否进入"按路线图实际改代码"的下一阶段（独立会话）
