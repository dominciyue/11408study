# 实施 plan — 错题闭环 + 弱点画像

**对应 spec：** `docs/superpowers/specs/2026-05-18-wrong-answer-loop-and-weakness-radar-design.md`
**基线 commit：** `63f1d08 docs(spec): 错题闭环 + 弱点画像 设计文档`
**执行窗口：** 2026-05-18 北京时间 ~12:00 – ~13:45（自主推进）

## Phase 列表与依赖

```
P1 schema迁移+entity改  ──┐
P2 SM-2 入队方法         ──┤
P3 WrongAnswerService    ──┤───→ P5 后端编译+test
P4 StatsService weakness ──┤
P5 后端单元测试           ──┤
        │
        ▼
P6 前端 api+types ─────┐
P7 前端组件(并行)      ├──→ P9 联调+启动
P8 错题本/practice 改  ┘
        │
        ▼
P10 自查+补 bug → P11 归档+push
```

## P1 — 数据库迁移 + entity / repository
- `V14__wrong_answers_enqueue_tracking.sql`：加 `enqueued_at` 列 + 2 索引
- `WrongAnswer.java` 加字段 `enqueuedAt`
- `WrongAnswerRepository.java` 加 3 方法
- `QuizQuestionRepository.java` 加 2 方法
- **验证**：`mvn -q -DskipTests compile`

## P2 — SM-2 入队
- `SpacedRepetitionService.enqueueWrongQuestion(uid, nodeId)`：findOrCreate StudyProgress，rating=0 → processFeedback
- `QuizService.submitAnswer` 答错分支：递增计数 + 触发入队
- **验证**：编译通过

## P3 — WrongAnswerService（新）
- 方法：`listGroupedByNode(uid)`、`findSimilar(uid, waId, limit)`、`resolve(uid, waId)`、`recordAndMaybeEnqueue(uid, question, userAnswer)`
- 越权 → BusinessException(FORBIDDEN)
- 相似题 LLM 兜底 try/catch，失败降级返回库内
- DTO：`SimilarQuestionsResponse`、`WrongAnswerGroupDTO`
- **验证**：编译通过

## P4 — StatsService.getWeaknessRadar
- 2 条聚合 SQL（subjects 维度 + 弱 topic Top10）
- DTO：`WeaknessRadarResponse`
- **验证**：手跑 SQL on docker 容器

## P5 — Controller + 单元测试
- `WrongAnswerController` 新建 3 端点
- `StatsController` 加 `/weakness`
- 单元测试：`WrongAnswerServiceTest`（4 用例）、`StatsServiceTest.weakness`（2 用例）
- **验证**：`mvn test` 全绿
- **commit**：feat(backend): 错题闭环 + 弱点画像 接口与服务

## P6 — 前端 api 层 + types
- `lib/api.ts` 加 `wrongAnswersApi` + `statsApi.getWeakness`
- `types/index.ts` 加 3 类型

## P7 — 前端组件（并行 3 个 subagent 或自做）
- `WeaknessRadarCard.tsx`（recharts RadarChart）
- `TodayTargetedCard.tsx`（拉 /quiz/adaptive 渲 5 道）
- `SimilarQuestionsDrawer.tsx`（拉 /similar 渲 list + AI 徽章）

## P8 — 页面编辑
- `app/dashboard/page.tsx` grid 加 2 卡
- `app/quiz/wrong/page.tsx` 重构：按 node 折叠 + 3 按钮
- `app/quiz/practice/page.tsx` 支持 `?ids=`
- **验证**：`npm run build`
- **commit**：feat(frontend): 错题本 / 雷达图 / 今日靶向卡

## P9 — 联调（docker compose up）
- 启动 docker compose（postgres/redis/minio/ai-service）
- 后端 `mvn spring-boot:run`
- 前端 `npm run start`（不 dev，更接近生产）
- 手测 4 验收点
- **commit**：fix(联调): 任何修复

## P10 — 自查
- 启动 5 个 Explore subagent 并行扫：
  1. 新增代码是否有 NPE / 越权 / N+1
  2. 既有页面剩余坏按钮 / 死链
  3. 前后端接口签名是否对齐
  4. 数据库迁移幂等性
  5. 类型 / lint warning
- 修复发现的问题
- **commit**：fix: 自查修复

## P11 — 归档 + push
- 写 `docs/dev-log/2026-05-18-autonomous-session.md` 记录本次工作
- 更新 `docs/audit/02-optimization-roadmap.md` 标记已完成项
- `git push` 到 GitHub
