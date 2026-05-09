# 自主开发会话 — 2026-05-09

**会话起点：** commit `eea1285`（架构审查 M1 完成 + 自审修订）
**会话目标：** 修完 doc 2 中影响"本地跑通"的核心 P0，让产品功能真正可用
**用户约束：**
- 优先跑通本地，暂不关注部署
- 自主规划与执行（不询问）
- 工作留痕（本日志 + commit）
- 多用 subagent + 自动调用 skill
- 及时 commit 上传 git
- **空间敏感**：home 空间宝贵，及时清理 docker build cache 等

---

## 范围决策（基于 doc 2）

按"是否影响本地跑通"二分：

### ✅ 本会话执行（影响功能或可观测性）
| ID | 任务 | 理由 |
|---|---|---|
| P0-01 | 修 JWT userId claim | 笔记/资料接口本地实际不可用 |
| P0-02 | 修拓扑排序大小写不匹配 | 学习路径功能本地不工作 |
| P0-03 | ImportController 加鉴权 + Material 归属校验 | 安全 + 解锁 P0-05 |
| P0-04 | 修 SM-2 算法 + 加 interval_days 字段 + @Version | 复习功能算法错误 |
| P0-05 | 前端导入向导加 Authorization header | 与 P0-03 互锁 |
| P0-06 | AiClientService 加 timeout | 防 AI 故障级联拖垮 backend（local 可见） |
| P0-13 | AI 服务启动校验 LLM key 配置 | 减少首次调用 14s 失败浪费（local 可见） |

**估总工作量：** 约 24-32 人时（subagent 加速后实际墙钟时间 4-7 小时）

### ⏸️ 本会话跳过（部署/HTTPS 范畴）
- P0-07/08（JWT secret / DB 密码外部化）— local dev 不需要强密码
- P0-09（HTTPS）— 部署事项
- P0-10（CORS 白名单）— local dev 通配 OK
- P0-11（Actuator 收紧）— local dev 不暴露公网
- P0-12（Swagger 关闭）— local 仍需用 Swagger 调试
- 全部 P1（监控/备份/AI Provider 抽象）— 部署事项 + 需 LLM API key

---

## 执行原则

1. **TDD 优先**：每个 fix 先写测试看 fail → 再 implement → 看 pass
2. **Subagent 派发**：每个 P0 派一个独立 subagent，主对话 review
3. **小步提交**：每个 P0 一个 commit（含测试）
4. **持续验证**：本地 7 个服务保持 Up，关键路径用 curl 验证
5. **空间保持**：每完成 2-3 个 P0 后 `docker buildx prune -f`
6. **日志即记忆**：本文件每个 P0 完成后追加一节，避免 context 丢失

---

## 进度追踪

### Phase 0：准备 ✅
- [x] 释放 docker build cache（3.7GB）
- [x] 创建本会话日志
- [x] 创建 TodoWrite 任务清单（7 P0 + 1 wrap-up）

### Phase 1：4 个真功能 Bug ✅
- [x] **P0-01** JWT userId claim — commit `0469a1d`（含意外发现的测试基础设施修复 `ba2e77e`）
- [x] **P0-02** 拓扑排序大小写 — commit `c14e392`
- [x] **P0-03 + P0-05** ImportController 鉴权 + 前端 Authorization header — commit `cff01d0`
- [x] **P0-04** SM-2 算法 + interval_days + @Version — commit `a2f6872`

### Phase 2：可用性增强 ✅
- [x] **P0-06** AiClientService timeout — commit `3617db1`
- [x] **P0-13** AI 启动校验 LLM key — commit `eb62a2b`

### Phase 3：测试基础设施 + 清理 ✅
- [x] 修 IT 测试 URL 错位（去掉 /api 前缀）
- [x] 修 KnowledgeNode/QuizQuestion JSONB 类型映射
- [x] 加 Spring Security 401 entry point（替换默认 403）
- [x] 测试基础设施修复 commit `49396d0`
- [x] 全套 22 unit + 9 IT + 12 pytest 全绿
- [x] 清理 docker build cache（3.7GB → 170MB）
- [x] 清理 host-side build artifacts（frontend/node_modules + .next + backend/target = 600MB+）
- [x] 写 final summary（见下方）
- [ ] git push（**等用户授权 — 24+ commits 待 push**）

---

## 决策日志（不断追加）

### 2026-05-09 12:30 — 会话启动
- 选择 7 个 P0 作为本会话范围（4 真 bug + 2 可用性增强 + 1 安全联动）
- 跳过部署相关 P0（用户明确要求）
- 不接 LLM API（无 key）— P0-13 仅做"校验逻辑改进"，不真实调用 LLM 验证

### 2026-05-09 12:30 — Subagent 模式
- 每个 P0 派一个 general-purpose subagent
- 主对话只做：派发 + 验收 + commit + 日志更新
- 不做完整的 spec/plan/review 流程（已在 audit 阶段做过，本会话直接执行）

---

---

## 决策日志（continuated）

### 2026-05-09 13:30 — 测试基础设施意外发现
P0-01 实施时子代理发现 `application-test.yml:17` 的 JWT secret 解码后只有 24 字节（192 bits），HS256 要求 ≥256 bits，所有 IT 测试 ApplicationContext 启动失败。修复为 67 字节 secret（commit ba2e77e），CI 也一并解锁。

### 2026-05-09 13:45 — 解锁 IT 后又发现 3 个 latent bug
WeakKey 修了之后跑 IT，又发现：
1. **IT 测试 URL 用了 /api 前缀**：MockMvc 不走 servlet context-path，导致 NoResourceFoundException。批量去前缀。
2. **JSONB 类型映射缺失**：KnowledgeNode.metadata + QuizQuestion.options 用 String + jsonb 列，需要 `@JdbcTypeCode(SqlTypes.JSON)`。
3. **Spring Security 默认 403 不是 401**：不符合 REST 语义。加 HttpStatusEntryPoint(UNAUTHORIZED)。

三个修复合一个 commit 49396d0。

---

## 最终汇报

### 总成果
本次自主开发会话完成了 doc 2 中 7 个 P0 修复 + 4 个 pre-existing bug 修复，共 **9 个 commit**，所有变更都在本地通过测试验证。

### Commit 清单（按时间序）

| # | commit | 说明 | 行变化 |
|---|---|---|---|
| 1 | `740414a` | 创建本会话日志（spec） | +90 |
| 2 | `0469a1d` | **P0-01** JWT userId claim 修复 + 测试 | +131 / -8 |
| 3 | `ba2e77e` | 测试基础设施：JWT secret 加长 | +3 / -2 |
| 4 | `c14e392` | **P0-02** 拓扑排序 case-insensitive + 测试 | +100 / -4 |
| 5 | `cff01d0` | **P0-03+05** ImportController 鉴权 + 前端 Auth header + 测试 | +273 / -32 |
| 6 | `a2f6872` | **P0-04** SM-2 算法 + V4 migration + 测试 | +222 / -22 |
| 7 | `3617db1` | **P0-06** RestTemplate timeout + 测试 | +138 / -10 |
| 8 | `eb62a2b` | **P0-13** AI 启动校验 + 不可重试快速失败 + 测试 | +191 / -1 |
| 9 | `49396d0` | 测试基础设施修复（URL 前缀 / JSONB / 401 entry point） | +30 / -13 |

**净变化：约 1178 行新增、92 行删除。**

### 测试覆盖

| 套件 | 数量 | 状态 |
|---|---|---|
| Backend Unit (Mockito) | 22 | ✅ ALL PASS |
| Backend IT (Testcontainers) | 9 | ✅ ALL PASS |
| AI Service pytest | 12 | ✅ ALL PASS |
| **Total** | **43** | **100% green** |

### 端到端验证（curl 经 nginx :18081）

| 验证 | 修复前 | 修复后 |
|---|---|---|
| Register/Login token 含 userId claim | ❌ null | ✅ `userId:N` |
| GET /api/notes 带 token | ❌ 500 NPE | ✅ 200 |
| GET /api/notes 无 token | ❌ 403 | ✅ **401** |
| 拓扑排序识别 PREREQUISITE | ❌ 失效 | ✅ "线性表概述" 排首 |
| ImportController 跨用户访问 | ❌ 200（任意访问） | ✅ **403** |
| ImportController 无 token | ❌ 200 | ✅ **401** |
| SM-2 间隔（连续 5 次 rating=5） | ❌ 1→1→2→2→3（线性）| ✅ **1→6→16→45→131**（指数） |
| AI extract 无 key 响应时间 | ❌ 14000ms | ✅ **10ms（1400x）** |

### 容器状态
所有 7 个服务在本地 docker compose 运行健康（postgres/redis/minio 3+ 小时；backend/ai-service 重建后健康）。访问入口：
- 前端：http://localhost:18081/
- 后端 Swagger：http://localhost:18081/api/swagger-ui/index.html
- AI Health：http://localhost:18081/ai/health

### 空间占用（结束时）
- 仓库：~2 MB（清理了 frontend/node_modules + .next + backend/target）
- Docker 镜像：3 GB（必须保留运行中容器的镜像）
- Docker build cache：170 MB（已两次清理）
- /home 可用：40 GB（57% 已用，会话开始 41 GB 可用）

### 未完成事项
1. **git push 待用户授权**：24+ commits 待 push 到 origin/main，需要用户提供 GitHub 凭证（SSH key 不在此账户名下，HTTPS 需用户密码/PAT）
2. **跳过的 P0**（部署相关，与"本地跑通"目标不冲突）：
   - P0-07/08 Secret 外部化（local dev 接受硬编码）
   - P0-09 HTTPS（部署事项）
   - P0-10 CORS 白名单（local dev 通配 OK）
   - P0-11 Actuator 收紧（local dev 不暴露公网）
   - P0-12 Swagger 关闭（local 仍需调试用）
3. **P1 任务全部跳过**（监控/备份/AI Provider 抽象等部署/优化范畴）

### 下一会话建议
1. **会话 A — git push + 验收**：用户提供 GitHub 凭证，push 24 commits；然后浏览器人工验证 UI 流程（注册→登录→dashboard→图谱→学习路径→测验→笔记→资料导入）
2. **会话 B — Phase 2 安全加固**（按本会话留下的 P0 列表 + doc 2 P0-07~12）
3. **会话 C — DeepSeek 接入**（按 doc 4 §2 快通道，配 .env 即可）

### 关键经验
- **TDD + subagent 组合非常高效**：每个 P0 平均 30-90 分钟（含写测试 + e2e 验证），一晚上能完成 7 个 P0
- **Pre-existing bug 暴露集中**：修第一个 P0 时把测试基础设施 unblock，连带暴露了 3 个 latent bug；好处是一次性都修了
- **空间管理重要**：node_modules 600MB 默默吃掉空间，每个 docker build 留下 cache。建议每完成 2-3 个 fix 就 prune 一次

---

## 第二批：续会话（2026-05-09 16:00–？）

### 上下文转交

第一批结束后用户 push 了 24 commits + 重新进入会话。新增资源：DeepSeek API key + GitHub PAT。
新指令：自行规划开发优化、参考竞品取长补短、优先本地、留痕、commit + push、空间敏感。

### Phase A — DeepSeek 接入与冒烟（commit `bfb27e1` 包含此 phase 输出物之一）

- `ai-service/.env` 新建（gitignored 已验证），写入 LLM_PROVIDER=openai + OPENAI_BASE_URL=https://api.deepseek.com/v1 + OPENAI_API_KEY + ALLOW_MISSING_LLM_KEY=false
- `docker-compose.yml` ai-service block 加 `env_file: ./ai-service/.env`
- 重启后启动日志显示 `[OK] LLM 配置校验通过 (provider=openai)`
- 直连 DeepSeek + 经 ai-service `/ai/extract` + 经 nginx + 经 backend `/quiz/{id}/ai-explain` 全链路通

### Phase B-1 — 竞品调研（subagent 并行）

派 general-purpose subagent (`agent-ae5108a2aca7ec0de`) 完成：
- 8 个平台覆盖：粉笔考研、知能行考研数学、考研帮、小猿 AI、StudyX、Quizlet、Anki/FSRS、多邻国/扇贝
- 输出 `docs/research/competitive-analysis.md` (~1450 中文字)
- Top 5 候选（按价值×成本排序）：AI 讲题闭环 / 能力等级量化 / PDF 出处定位 / 游戏化打卡 / 番茄钟周报

### Phase B-2 — Provider 抽象（**降级跳过**）

原计划做 LLMProvider 抽象基类，调研后判断 YAGNI：
- 现有 `llm_service.py` 已通过 `llm_provider` 字段 + base_url 自动支持 DeepSeek/Moonshot 等 OpenAI-compat
- DeepSeek E2E 已通，无新需求驱动抽象
- 转而把这部分时间投入 Phase C 用户可见功能

### Phase C — AI 启发式讲题（commit `bfb27e1`）

落地 Top 候选 #1。三层完整链路：

**ai-service**
- 新 `/ai/explain-question` 端点 + `quiz_explain_service.py` + `quiz_explain.py` 路由
- 启发式 SYSTEM_PROMPT：先肯定→指出选项问题→引导推理→鼓励追问
- `LLMService.chat(messages, ...)` 新增以支持多轮 OpenAI-style messages，`generate()` 委托
- 8 个 pytest（prompt 构造、首轮 vs 多轮分流、HTTP 200/400）

**backend**
- `POST /quiz/{id}/ai-explain`（auth 必需）
- `AiClientService.explainQuestion(question, userAnswer, node, history)`
- `QuizService.explainWithAi` 装配题目+选项+正确答案+知识点上下文
- 7 个 Mockito 单测

**frontend**
- `AiExplainDialog` 复用 shadcn Dialog，自动首轮 + 多轮 textarea + Ctrl/Enter 发送
- 集成到 `quiz/practice` 答题结果区与 `quiz/wrong` 错题列表
- `quizApi.aiExplain`（90s timeout 兜住 LLM 调用）

**E2E 真实 DeepSeek 调用：**
- 单轮：`{userAnswer:"A"}` → 10s → 启发式回复（叠盘子/排队类比）
- 多轮：history 含 3 条 → 10s → 详细栈应用场景（函数调用/Ctrl-Z/括号匹配/表达式求值）

### 测试覆盖（截至本节）

| 套件 | 数量 | 状态 |
|---|---|---|
| Backend Unit | **29** (+7) | ✅ ALL PASS |
| Backend IT | 9 | ✅ ALL PASS |
| AI Service pytest | **20** (+8) | ✅ ALL PASS |
| **Total** | **58** (+15) | **100% green** |

### Commit 清单（本批）

| # | commit | 说明 |
|---|---|---|
| 1 | `bfb27e1` | **C-α** AI 启发式讲题 + 多轮追问（DeepSeek 真接入） |

### 关键决策

- 跳过 LLMProvider 抽象（YAGNI）— 现有结构已支持 DeepSeek
- 选 #1 而非 #4（streak）— 更能展示 DeepSeek 价值
- 多轮 history 由客户端管理，无服务端持久化（v1）— 简化数据库 schema
- 用 Dialog 而非 Sheet（shadcn Sheet 未安装），max-w-2xl 容纳对话

### 风险与缓解

| 风险 | 表现 | 缓解 |
|---|---|---|
| LLM 调用慢 | 5-15s | 90s 客户端 timeout + loading spinner |
| 多轮 history 在客户端易篡改 | 可能注入 prompt | 仅作 UX 提示，权威 prompt 由服务端构造 |
| DeepSeek 限速 | 失败 | 已有 `_is_retryable` 区分 4xx 不重试，5xx 重试 3 次 |

---

## 第三批：续会话（2026-05-09 16:45–？）

### 目标
基于上一批末尾的"下一会话候选"清单，落地 2 个新功能：
1. **AI 节点深入解读**（候选#1）— 复用现有 ai-service `/ai/enhance`，在 graph 节点详情面板加按钮，弹 Dialog 展示 详解/口诀/类比
2. **徽章 + 每日任务**（候选#4）— 基于既有 streakDays/studiedToday 等数据派生 9 枚徽章 + 3 个每日任务，dashboard 卡片展示

### Phase A — Feature 1: AI 节点深入解读

**backend：**
- 修复 `AiClientService.enhanceContent` 签名：`String content` → `(String title, String content, String enhanceType)`（之前少传 title/enhance_type，调用 ai-service 必失败 — 实际无 caller，是死代码）
- `KnowledgeGraphService.aiEnhanceNode(nodeId, type)`：white-list 检查 EXPLAIN/MNEMONIC/ANALOGY，404 / 400 分支齐全
- `POST /knowledge/nodes/{id}/ai-enhance?type=EXPLAIN`（通过 Spring Security `.anyRequest().authenticated()` 强制 auth）
- 6 个 Mockito 单测覆盖：bad type / 节点不存在 / 大小写规整 / 缺省 EXPLAIN / null content / 三种 type 全过

**frontend：**
- `knowledgeApi.aiEnhance(nodeId, type)`（90s timeout）
- `AiEnhanceDialog`：3 tab 切换（详解/口诀/类比）+ 客户端缓存避免重复 LLM 调用
- `node-detail-panel.tsx` 在 "开始学习" 按钮旁加 `AI 解读` 紫色按钮

**E2E 真实 DeepSeek 调用：**
- type=MNEMONIC → 10s → 返回结构化 4 段（口诀/联想记忆法/关键词串联法/公式记忆技巧）
- 校验路径：bad type 400 ✅ / 不存在节点 404 ✅ / 无 auth 401 ✅

### Phase B — Feature 2: 徽章 + 每日任务

零新表，纯数据派生：

**徽章（9 枚）：**
- 🔥 破冰：streak ≥ 1
- 🔥🔥 坚持一周：streak ≥ 7
- 🔥🔥🔥 钢铁意志：streak ≥ 30
- 📚 入门学习者：累计学习节点 ≥ 10
- 📖 知识探索者：累计学习节点 ≥ 50
- 🎯 考研学霸：累计学习节点 ≥ 100
- ⏰ 今日专注：今日学习满 60 分钟
- 🧠 复习达人：今日复习 ≥ 10 个
- 💯 精通：平均掌握度 ≥ 80%

**每日任务（3 件套）：**
- 学习 5 个新节点
- 复习 10 个节点
- 专注学习 30 分钟

**实现：**
- 新增 DTO：`BadgeDTO` + `DailyTaskDTO`，挂在 `StatsOverviewDTO.badges/dailyTasks`（保持单端点单往返）
- `StatsService.computeBadges/computeDailyTasks` 静态纯函数
- 8 个单测：阈值边界（=与<）/ avgMastery 四舍五入 / 负数 clamp / 全部解锁 / 全部未解锁
- `BadgesCard` + `DailyTasksCard` React 组件，dashboard 第二行展示

**E2E：**
- `/api/stats/overview` 返回新字段：9 badges + 3 dailyTasks（新用户全为 0/未解锁，符合预期）

### 测试覆盖（截至本节）

| 套件 | 数量 | 状态 |
|---|---|---|
| Backend Unit | **43** (+14) | ✅ ALL PASS |
| Backend IT | 9 | ✅ ALL PASS |
| AI Service pytest | 20 | ✅ ALL PASS |
| **Total** | **72** (+14) | **100% green** |

### Commit 清单（本批）

| # | commit | 说明 |
|---|---|---|
| 1 | (待) | feat: AI 节点深入解读 + 徽章/每日任务 dashboard |

### 关键决策

- **修复 enhanceContent 死代码** 顺手做了（仅 1 处 callsite，全是新代码）
- **Feature 2 走 overview 单端点**（vs 单独 /badges + /daily-tasks）— 减少前端往返，DTO 字段为可选不破坏旧 client
- **静态纯函数**（computeBadges/computeDailyTasks）— 无 DB 依赖，无 mock 开销，单测最快
- **frontend 客户端缓存 AI 输出**（每 type 一份）— 切换 tab 不重新 LLM 调用，节省成本

### 风险与缓解

| 风险 | 缓解 |
|---|---|
| 新 DTO 字段可能破坏旧 client | 用可选字段 `badges?` / `dailyTasks?`，旧前端忽略不会出错 |
| Feature 2 三件套阈值难调（5/10/30 太松或太严） | 后续可移到配置化，v1 先固定 |
| 徽章 perfectionist 用 avgMastery 四舍五入边界（79.5→80） | 单测显式锁住行为 |

---

## 第四批：续会话（2026-05-09 17:00–？）

### 目标
继续基于 Top 5 候选清单：
1. **能力等级 1-5 stars + 自适应推题端点**（候选 #2 的轻量版）
2. **Pomodoro 浮动番茄钟**（候选 #5 的前端实现）

### Phase A — Feature 3: 能力等级 + 自适应推题

**backend：**
- 新 utility 类 `MasteryLevel`：mastery_level 0-100 → 1-5 星映射，与知能行考研对齐
  - 分桶：1星(0-20)/2星(21-40)/3星(41-60)/4星(61-80)/5星(81-100)
  - 边界处理：null/负数→1，>100→5
  - 7 个单测覆盖每个桶顶 + 1 越界
- `QuizService.adaptiveGenerate(userId, subjectId, count)`：
  - Bucket A：应复习（next_review ≤ now，按到期最早排前）
  - Bucket B：低掌握（< 50，不在 A 中，按掌握度升序）
  - Bucket C：未学新节点（仅 subjectId 给定时填充）
  - 三桶合并去重，保留前 N（N×3 上限保护防 SQL IN 列表爆炸）
- `POST /quiz/adaptive-generate?subjectId=N&count=10`（auth 必需）
- 7 个 Mockito 单测：404/count≤0/A 优于 B/C 仅在 subject 给定时填充/学科过滤/最早到期排前

**frontend：**
- `node-detail-panel.tsx`：mastery 进度条改 5 个 lucide Star（filled/empty）+ 显示 "N 星 · M%"
- `quizApi.adaptiveGenerate(subjectId, count)` helper（API 路径已加）
- `quiz/practice/page.tsx`：优先调 adaptive-generate，失败/空回退到旧 `quizApi.generate`（用户无感升级）

**E2E 验证（待）：**

### Phase B — Feature 4: Pomodoro 浮动番茄钟（subagent 并行）

派 general-purpose subagent 完成（仅前端，3 个新文件 + 1 个 layout 修改）：
- `src/stores/pomodoro-store.ts`：zustand state（mode/secondsLeft/isRunning/completedFocusCycles/flashKey）
- `src/hooks/use-pomodoro-tick.ts`：setInterval tick + Notification API + 切模式
- `src/components/pomodoro/pomodoro-fab.tsx`：圆形浮动 FAB + Dialog 控制面板（25min focus / 5min break）
- `src/components/layout/app-layout.tsx`：挂载 `<PomodoroFab />`

约束：不安装新包、不写测试（前端无测试基础设施）、不破坏现有 layout。

### 测试覆盖（截至本节）

| 套件 | 数量 | 增量 |
|---|---|---|
| Backend Unit | **57** (+14) | 7 MasteryLevel + 7 QuizServiceAdaptive |
| Backend IT | 9 | — |
| AI Service pytest | 20 | — |
| **Total** | **86** (+14) | **100% green** |

### Commit 清单（本批）

| # | commit | 说明 |
|---|---|---|
| 1 | (待) | feat: 能力等级 1-5 stars + 自适应推题 + Pomodoro |

### 关键决策

- **MasteryLevel 是 utility 类**（非 enum）— 因为分桶函数需要参数化输入（int），enum 不适合
- **adaptive-generate 用单端点 + bucketed selection** — 而非"先调 review-queue，再调 lowest-mastery"两次 API
- **Practice 页隐式升级**（fallback 到旧 generate）— 用户已登录则自动用 adaptive，无 token 仍能用
- **Pomodoro 用 subagent 并行**（与 backend mvn 编译同步）— 节省墙钟时间
- **不持久化 Pomodoro 状态**（in-memory）— 切页面会重置，v1 简化；v2 可加 zustand persist

### 风险与缓解

| 风险 | 缓解 |
|---|---|
| adaptive-generate 性能：findByUserIdWithNodeSubject 拉全部进度可能慢 | 限定结果集大小 + log 监控；后续可加 cache |
| Pomodoro 浏览器通知权限被拒 | 静默降级（仅 visual flash），无错误 |
| Pomodoro state 切页面丢失 | 文档化为 v1 限制，v2 加 zustand persist |

---

## 第五批：续会话（2026-05-09 17:30–？）

### 目标
继续 Top 5 候选 + 上批留下的 polish：
1. **Feature 5 AI 学习计划生成**（之前候选 #4）— DeepSeek 输出个性化周计划
2. **Feature 6 React Flow 节点 mini stars** — 让 Feature 3 的能力等级在图谱视图也可见

### Phase A — Feature 6（前端 polish，inline）

`knowledge-node.tsx` 把原来的 1px 进度条改成 5 颗 lucide `Star`（w-2.5 h-2.5），filled 黄色 / empty 灰色，分桶规则与详情面板一致。`mastery` 数据已通过 `nodeData.mastery` 传入，无需后端改动。

### Phase B — Feature 5（subagent 并行 backend + 主对话前端）

**subagent 任务（ai-service + backend Java）：**
- ai-service: `POST /ai/study-plan` 接收 goal/weeks/subject_name/weak_topics/studied_nodes/total_nodes，返回 `WeekPlan[]` + summary
  - 新文件：`models/study_plan.py` + `services/study_plan_service.py` + `routers/study_plan.py`
  - 修改：`dependencies.py` + `main.py`
  - 5+ pytest（validation / mock LLM / 错误路径）
- backend: `POST /study/ai-plan` 接收 subjectId/weeks/goal，自动注入用户 weak_topics + studied/total，转发到 ai-service
  - 新 DTO `StudyPlanRequest`
  - `AiClientService.generateStudyPlan(...)`
  - `StudyPathService.generateAiPlan(...)`
  - `StudyController` 加端点
  - 5+ Mockito 单测

**主对话任务（前端，inline）：**
- 新页 `/study/plan/page.tsx`：
  - 表单：学科 select（可选）+ 周数 input（1-52）+ 目标 textarea
  - 提交 → 120s timeout LLM 调用 → loading
  - 周计划展示：每周一卡片（标题 + 本周目标 + 每日任务 + 重点复习）
  - localStorage 持久化（v1，下次打开恢复上一份）
- `studyApi.aiPlan` helper（120s timeout 给足 LLM）
- types: `WeekPlan` + `StudyPlanResponse`
- 修改 `/study/page.tsx`："智能推荐"卡片改名"AI 学习计划"，链接到 `/study/plan`

### 测试覆盖（截至本节）

待 subagent 完成后填充。预期：backend +5 unit + ai-service +5 pytest = +10。

### Commit 清单（本批）

| # | commit | 说明 |
|---|---|---|
| 1 | (待) | feat: AI 学习计划生成 + 图谱节点 mini stars |

### 关键决策

- **AI 学习计划用 localStorage v1**（不入库）— 避免新表，简化迭代；用户每次生成会覆盖上一份
- **Feature 5 用 subagent 拆分** — backend 后端工作量较大，subagent 专注一个清晰契约
- **Feature 6 完全前端**（mastery 已在 nodeData 中）— 无需 backend 改动
- **/study 页 "智能推荐" 卡片改名 "AI 学习计划"** — 明确入口，避免之前那个空链接到自身的循环

### 风险与缓解

| 风险 | 缓解 |
|---|---|
| LLM 周计划长输出可能格式跑偏 | service 用 `_parse_json_response` 兼容 markdown 包裹；非 JSON 返 ValueError → 400 |
| 12+ 周计划 token 数大、可能超时 | 客户端 timeout 120s；服务端 LLM 已有重试策略 |
| 用户切设备丢计划 | 文档化 v1：localStorage 只本机；v2 可入库 |



