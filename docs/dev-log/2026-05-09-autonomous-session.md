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
