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

### Phase 0：准备（~10 分钟）
- [x] 释放 docker build cache（3.7GB）
- [x] 创建本会话日志
- [ ] 创建 TodoWrite 任务清单

### Phase 1：4 个真功能 Bug（~3 小时）
- [ ] **P0-01** JWT userId claim
- [ ] **P0-02** 拓扑排序大小写
- [ ] **P0-03 + P0-05** ImportController 鉴权 + 前端 Authorization header
- [ ] **P0-04** SM-2 算法

### Phase 2：可用性增强（~1.5 小时）
- [ ] **P0-06** AiClientService timeout
- [ ] **P0-13** AI 启动校验 LLM key

### Phase 3：清理与汇报（~30 分钟）
- [ ] 跑全套 IT 测试验证无回归
- [ ] 清理 docker 资源
- [ ] 写 final summary 到本日志末尾
- [ ] 最终 commit + git push

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
