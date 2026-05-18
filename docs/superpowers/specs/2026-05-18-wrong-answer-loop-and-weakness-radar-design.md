# 错题闭环 + 弱点画像 设计文档

**日期：** 2026-05-18
**作者：** Claude（多轮 brainstorming 后定稿，用户授权自主推进）
**前置：** `docs/research/competitive-analysis.md` Top-1/Top-2 差距、`docs/audit/02-optimization-roadmap.md` 未做项
**关联 commit 基线：** `9dfeca4 fix: 十轮审计 — 路由守卫/loadUser/error boundary/dialog history 截断`

---

## 1. 目标

让"答错"成为有效学习信号：
1. **错题闭环**：答错≥2 次自动滚动到 SM-2 复习队列；错题本提供"相似题"一键练习
2. **弱点画像**：dashboard 一眼看到 4 学科的能力雷达图，下钻 Top 10 弱 Topic
3. **今日靶向**：dashboard 新增"今日 5 道靶向题"卡，直接复用 `QuizService.adaptiveGenerate`

直接对应用户原话"更好的学习效果"。

## 2. 非目标 / 边界

- **不动 SM-2 核心算法**（FSRS-5 是下一个 spec 的范围）
- **不重构 dashboard / quiz 已有页面布局**，只新增组件和增强 2 个已有页（错题本 + 仪表盘）
- **不引入新的 LLM 调用模式**：相似题命中现有题库就返回，命中不足才调 DeepSeek 兜底，且必经 `AiRateLimiter`
- **不污染题库**：LLM 兜底生成的相似题仅前端展示，不入 `quiz_questions`

## 3. 关键决策（brainstorming 收敛结果）

| 议题 | 决策 |
|---|---|
| 相似题来源 | 检索优先（同 node → 同 topic → 同 subject），不足 limit 才 LLM 兜底 |
| 错题入队时机 | 同题答错累计 ≥2 次才入队（避免单次手误污染 due 队列） |
| 弱点画像粒度 | 双层：Subject 雷达图（4 轴）+ 点击下钻 Top 10 弱 Topic 表 |
| 新能力放哪 | 错题本独立页（`/quiz/wrong` 增强）+ 仪表盘新增 2 张卡，**不替换原有卡片** |
| 今日靶向选题器 | 复用现有 `QuizService.adaptiveGenerate(uid, null, 5)`，无新算法 |

## 4. 数据流

### Flow A — 答错 → 累计 → 入队
```
QuizService.submitAnswer(uid, qid, userAnswer)
  ├─ 判 correct
  ├─ if !correct:
  │    INSERT wrong_answers(user_id, question_id, user_answer, answered_at, resolved=false)
  │    int n = wrongAnswerRepository.countByUserIdAndQuestionIdAndResolvedFalseAndEnqueuedAtIsNull(uid, qid)
  │    if n >= 2:
  │       spacedRepetitionService.enqueueWrongQuestion(uid, question.getNodeId())
  │       UPDATE wrong_answers SET enqueued_at = NOW()
  │         WHERE user_id=? AND question_id=? AND resolved=false AND enqueued_at IS NULL
  │       // 同批所有未入队的 wrong_answers 一次性 mark，避免下次再触发
  └─ ...原有 progress 更新逻辑保持不变
```
关键：`enqueued_at` 是新增列，作"已入队标记"，无需额外表。

### Flow B — 相似题（检索 + LLM 兜底）
```
GET /api/wrong-answers/{id}/similar?limit=5
  └─ wa = findByIdAndUserId(id, uid)            // 越权 → 403
     nodeId = wa.question.nodeId
     diff = wa.question.difficulty
     # 1. 同 node + 难度 ±1
     pool = questionRepo.findByNodeIdAndDifficultyBetween(nodeId, diff-1, diff+1)
     pool.removeIf(q.id == wa.questionId)
     if pool.size >= limit: return shuffleAndPick(pool, limit, source="DB_NODE")
     # 2. 同 topic 扩
     topicId = wa.question.node.topicId
     pool.addAll(questionRepo.findByNodeTopicId(topicId))
     去重去本题
     if pool.size >= limit: return shuffleAndPick(pool, limit, source="DB_TOPIC")
     # 3. 仍不足 → LLM 兜底
     aiRateLimiter.check(uid)
     try:
        ai = aiClient.generateQuiz({nodeId, count: limit - pool.size, difficulty})
        combined = pool + ai (ai 标 source="AI_GENERATED", id=null)
        return combined.take(limit)
     except:
        return pool   // 不阻断，前端显示"AI 兜底失败，仅 X 道"
```

### Flow C — 弱点画像
```
GET /api/stats/weakness
  └─ // 单条 GROUP BY 拿到 4 学科聚合，绝不 N+1
     SELECT s.id, s.name, s.code,
            COALESCE(AVG(p.mastery_level), 0) AS mastery,
            COUNT(DISTINCT n.id) AS nodes,
            COUNT(DISTINCT p.id) AS studied
       FROM subjects s
       LEFT JOIN topics t  ON t.subject_id = s.id
       LEFT JOIN knowledge_nodes n ON n.topic_id = t.id
       LEFT JOIN study_progress p ON p.node_id = n.id AND p.user_id = :uid
      GROUP BY s.id ORDER BY s.id
     // + 第二条单查询：Top 10 弱 topic
     SELECT t.id, t.name, s.name AS subjectName,
            COALESCE(AVG(p.mastery_level), 0) AS mastery,
            COUNT(DISTINCT n.id) AS nodes
       FROM topics t
       JOIN subjects s ON s.id = t.subject_id
       JOIN knowledge_nodes n ON n.topic_id = t.id
       LEFT JOIN study_progress p ON p.node_id = n.id AND p.user_id = :uid
      WHERE EXISTS (SELECT 1 FROM study_progress p2
                    WHERE p2.user_id = :uid AND p2.node_id IN (SELECT id FROM knowledge_nodes WHERE topic_id = t.id))
      GROUP BY t.id, s.name
      ORDER BY mastery ASC
      LIMIT 10
```

### Flow D — 今日靶向题
前端直接 `GET /api/quiz/adaptive?count=5`（已存在），渲染 `<TodayTargetedCard/>`。

### Flow E — 错题本聚合
```
GET /api/wrong-answers?groupBy=node&page=0&size=20
  └─ // 按 node_id 聚合：每个 node 一条，含 wrongCount, latestAnsweredAt, sample questions
     // 实现：先按用户拉所有未解决错题，再 stream().collect(groupingBy)
     // 数据量小（普通用户 < 500 行），不引入 N+1
```

## 5. 数据模型变更

唯一迁移文件 `V14__wrong_answers_enqueue_tracking.sql`：
```sql
ALTER TABLE wrong_answers ADD COLUMN enqueued_at TIMESTAMP;
COMMENT ON COLUMN wrong_answers.enqueued_at IS '该错题被纳入复习队列的时刻，NULL 表示尚未入队';

CREATE INDEX IF NOT EXISTS idx_wa_user_question_enqueue
  ON wrong_answers(user_id, question_id) WHERE resolved = false;

CREATE INDEX IF NOT EXISTS idx_wa_user_resolved_answered
  ON wrong_answers(user_id, resolved, answered_at DESC);
```

**不动表**：subjects / topics / knowledge_nodes / study_progress / quiz_questions / users。

## 6. 接口契约

### `GET /api/wrong-answers`
Query: `?groupBy=node|none&page=0&size=20&resolved=false`
- `groupBy=node`: 返回 `{groups: [{nodeId, nodeName, topicName, subjectName, wrongCount, latestAnsweredAt, samples:[Question]}]}`
- `groupBy=none`: 返回 `Page<WrongAnswerDTO>`

### `GET /api/wrong-answers/{id}/similar?limit=5`
Resp:
```json
{
  "source": "DB_NODE | DB_TOPIC | DB_SUBJECT | AI_FALLBACK | MIXED",
  "items": [
    { "id": 123, "title": "...", "options": [...], "answer": "B",
      "difficulty": 3, "generated": false },
    { "id": null, "title": "...", "options": [...], "answer": "C",
      "difficulty": 3, "generated": true }
  ],
  "aiAvailable": true,    // 若 LLM 兜底失败这里为 false
  "totalFromDb": 3,
  "totalGenerated": 2
}
```

### `POST /api/wrong-answers/{id}/resolve`
请求体空，响应 `{ok: true}`。标 `resolved=true`。

### `GET /api/stats/weakness`
Resp:
```json
{
  "subjects": [
    {"id":1,"name":"政治","code":"POLITICS","mastery":68.2,"nodes":80,"studied":45},
    {"id":2,"name":"英语一","code":"ENGLISH_I","mastery":55.0,"nodes":76,"studied":30},
    ...
  ],
  "weakTopics": [
    {"id":12,"name":"高等数学-极限","subjectName":"数学一","mastery":32.0,"nodes":8},
    ...10 条
  ]
}
```

## 7. 后端组件清单

| 文件 | 操作 | 关键变更 |
|---|---|---|
| `entity/WrongAnswer.java` | edit | `+ LocalDateTime enqueuedAt` |
| `repository/WrongAnswerRepository.java` | edit | `+ countByUserIdAndQuestionIdAndResolvedFalseAndEnqueuedAtIsNull`; `+ markEnqueued(@Modifying @Query)`; `+ findByUserIdAndResolvedFalseOrderByAnsweredAtDesc(uid, Pageable)`; `+ findByIdAndUserId(id, uid)` (已有) |
| `repository/QuizQuestionRepository.java` | edit | `+ findByNodeIdAndDifficultyBetween(nodeId, lo, hi)`；`+ findByNodeTopicId(topicId)` |
| `service/SpacedRepetitionService.java` | edit | `+ enqueueWrongQuestion(uid, nodeId)`：找/建 StudyProgress，调 processFeedback(rating=0) |
| `service/WrongAnswerService.java` | new | 封装 listGrouped / findSimilar / resolve 逻辑 + 越权校验 |
| `service/QuizService.java` (submitAnswer 分支) | edit | 答错后调 wrongAnswerService.recordAndMaybeEnqueue(uid, question) |
| `service/StatsService.java` | edit | `+ getWeaknessRadar(uid)` 返回 SubjectMasteryDTO + WeakTopicDTO |
| `controller/WrongAnswerController.java` | new | 3 端点 |
| `controller/StatsController.java` | edit | `+ GET /weakness` |
| `dto/SimilarQuestionsResponse.java` | new | source / items / aiAvailable |
| `dto/WeaknessRadarResponse.java` | new | subjects + weakTopics |
| `db/migration/V14__wrong_answers_enqueue_tracking.sql` | new | 见 §5 |

## 8. 前端组件清单

| 文件 | 操作 | 关键变更 |
|---|---|---|
| `frontend/src/app/quiz/wrong/page.tsx` | edit | 按 node 折叠组；每条加"错 N 次"徽章 / "看相似题" / "我已掌握" 按钮 |
| `frontend/src/components/wrong/SimilarQuestionsDrawer.tsx` | new | 拉 `/similar?limit=5`，前端做一次性练习；显示 "AI 生成" 徽章 |
| `frontend/src/components/dashboard/WeaknessRadarCard.tsx` | new | recharts `<RadarChart>` 4 学科；点击学科切换"详情"视图（Top 10 弱 Topic）|
| `frontend/src/components/dashboard/TodayTargetedCard.tsx` | new | 拉 `/api/quiz/adaptive?count=5`，5 条题预览；"开练"跳 `/quiz/practice?ids=1,2,3,4,5` |
| `frontend/src/app/dashboard/page.tsx` | edit | 顶部 grid 加 `<WeaknessRadarCard/>` + `<TodayTargetedCard/>` |
| `frontend/src/lib/api.ts` | edit | `+ wrongAnswersApi { list, similar, resolve }`；`+ statsApi.getWeakness` |
| `frontend/src/app/quiz/practice/page.tsx` | edit | 支持 URL `?ids=1,2,3` prefill 题目列表（不重新随机） |
| `frontend/src/types/index.ts` | edit | `+ SimilarQuestionsResponse / WeaknessRadarResponse / WrongAnswerGroup` 类型 |

## 9. 错误处理 / 降级

| 场景 | 行为 |
|---|---|
| 相似题 LLM 兜底超时 / 5xx | 不抛 500；返回库内已有部分 + `aiAvailable: false`，前端 toast "AI 生成失败，仅展示 X 道" |
| 入队遇 `OptimisticLockException` | 重试 1 次；仍失败仅 `log.warn`，不影响答题主流程 |
| 越权（A 看 B 错题） | 已有 GlobalExceptionHandler 兜 BusinessException(FORBIDDEN) → 403 |
| 雷达图新用户全 0 mastery | 前端显示 "开始几道题就能看到画像了"，不渲染空 chart |
| adaptiveGenerate 返回空 | TodayTargetedCard 显示 "今天先随便练几道，明天就有靶向推荐"  + 跳学科入口 |

## 10. 测试

**后端单元 / 集成测试（Testcontainers + Postgres）**
- `WrongAnswerServiceTest`
  - 答错 1 次 → enqueued_at IS NULL；StudyProgress.next_review 不变
  - 答错 2 次 → enqueued_at NOT NULL；StudyProgress.next_review = 明天
  - 答错 5 次 → enqueueWrongQuestion 只被调用 1 次（mock 验证）
  - findSimilar 库内 ≥5 道 → 不调 AiClient（mock 验证 0 interactions）
  - findSimilar 库内 2 道 → 调 AiClient 1 次拿 3 道
- `StatsServiceTest.getWeaknessRadar`
  - 4 学科空数据 → mastery 全 0
  - mock 数据 1 学科 100、其他 50 → 返回排序正确
- `WrongAnswerControllerIT`
  - A 用户访问 B 用户错题 ID → 403
  - groupBy=node 返回结构断言

**前端手测 / Playwright（如时间允许）**
- E2E 三条 golden path
- 雷达图 chart 渲染 + hover tooltip
- "看相似题" Drawer 弹出 + AI 徽章显示

## 11. 验收清单

- [ ] 一个新用户答错同一题 2 次后，StudyProgress.next_review 被推到 +1 天
- [ ] 错题本默认 groupBy=node 显示，每个 node 块顶有"错 N 次"徽章
- [ ] 点"看相似题"出 Drawer 含 5 道题，其中 LLM 兜底题有 "AI 生成" 徽章
- [ ] dashboard 顶部 2 张卡：雷达图（4 轴可见数字）+ 今日靶向 5 道题
- [ ] 雷达图点击学科切换到"详情"视图，显示该学科 Top 10 弱 Topic 表
- [ ] 今日靶向 "开练" 跳 quiz/practice 且 prefill 5 道（不随机重洗）
- [ ] `mvn test` 通过；后端 `WrongAnswerServiceTest` / `StatsServiceTest` 新增用例全绿
- [ ] `npm run build` 通过；无新增 ts/eslint error
- [ ] 越权测试：用户 A token 访问 `/wrong-answers/<B 的 id>` → 403
- [ ] N+1 检查：`/api/stats/weakness` 通过 hibernate.show_sql 验证只产生 2 条 SQL

## 12. 不在本 spec 范围（下一轮）

- FSRS-5 算法替换（独立 spec）
- 复习队列日历视图 / 艾宾浩斯曲线"小黄点"
- 错题导出 / 错题分享卡片
- 智能学习路径 v2（基于 mastery 重新生成路径）

## 13. 工作量自估

| 阶段 | 人时 |
|---|---|
| 后端：迁移 + entity/repo + 3 service 方法 + 2 controller + DTO + 测试 | 12 |
| 前端：4 组件新增 + 2 页编辑 + api + types | 14 |
| 联调 + 自查 | 4 |
| **合计** | **30 人时** |

按 1 人专注 = 3-4 天；自主推进 + subagent 并行 = ≈ 2-2.5 小时（本次窗口目标）。
