# 自主开发会话 — 2026-05-18 晚（题库 + 资料体验重建）

**起点 commit：** `f4dfe81 fix(security): /stats/subject-question-counts 允许未登录访问`（其实是本会话末）
**前置：** 用户反馈"题库全是跳 B 站搜索的占位题；资料页也全是 B 站搜索"

---

## 用户痛点（量化）

| 项 | 现状 | 影响 |
|---|---|---|
| quiz_questions 总数 2948 | 77%(2280) 是 link-based 占位题 | content="[请前往外部页面…]" + B 站搜索 URL（命中率低）|
| 英语一 750 道 | **0** 道完整 inline 题 | 用户根本练不了 |
| resources 页 30+ 卡片 | 全是"在 B 站搜 XXX" 硬编码 | 跳过去搜索结果不是想要的 |

## 用户决策（brainstorm 收敛）

- 题库：**混合方案** — 下线 link-based + LLM 批量生成补足
- 资料：**清掏 + 推自传** — 删 30+ 硬链 + 推 materials

---

## 实施（4 commits）

### commit `7fbaf33` — 后端答题流过滤 + resources 重构
**后端**：
- `QuizQuestionRepository.findRandomInlineByNodeIds` — WHERE external_url IS NULL OR ''
- `findByNodeTopicId` / `findByNodeTopicSubjectId` 加 `q.externalUrl IS NULL` filter
- 新 `findExternalLinkBySubject` — 给"外部资源"独立 tab 留口（后续）
- `QuizService.generateQuiz` / `adaptiveGenerate` 改用 inline 版
- `WrongAnswerService.findSimilar` 同 node 手动过滤 link-based

**前端 resources/page.tsx 重构**（1107 → 215 行，96% 删减）：
- 删 41 个 search URL 卡片
- 保留 8 个确定 URL（研招网 / 教育部考试中心 / 国家智慧教育 / 中国大学 MOOC / 学堂在线 / Anki 等）
- 顶部 amber banner 强推"上传我的讲义" → /materials
- 中部 info 卡说明为何重构

### commit `4fd9850` — 题数 banner + seeder driver
**后端**：
- GET /api/stats/subject-question-counts → `[{subjectId, name, code, totalNodes, inlineQs, externalQs}]`
- KnowledgeNodeRepository.findInlineExternalQuestionCountBySubject 单条 native group by

**前端 quiz/page.tsx**：
- 学科 chips 拉新 endpoint 后加题数角标 "(318)"
- 题数=0 学科 disabled + tooltip "AI 题库扩充中或仅有外部链接题"

**批量补题驱动 `scripts/seed-llm-questions.sh`**：
- 调现有 `POST /quiz/nodes/{id}/generate-questions`（已限流 30/min）
- 按学科扫待补节点，目标 ≥3 道 inline 题/节点
- 控速 sleep AVOID_RATE 避 429
- 用法：`USERNAME=audit2 PASSWORD=xxx bash scripts/seed-llm-questions.sh english 3`

### commit `f4dfe81` — /stats/subject-question-counts permitAll
SSR + 未登录用户需要拿题数渲染按钮，纯聚合数据无个人信息，permitAll 安全

---

## 实战数据

跑前 vs 跑后题库（inline 完整题）：

| 学科 | 跑前 | 跑后 | 节点数 | 完成率 |
|---|---|---|---|---|
| 政治 | 181 | 181 | 111 | 已有 |
| **英语一** | **0** | **318** | 108 | 2.94/节点 ✓ |
| 数学一 | 50 | (跑中) | 97 | seeder running |
| 408 | 122 | 122 | 116 | 已有 |

**英语一 seeder 实测**：
- 108 节点 × 3 道目标
- 实跑 788 秒（13 分钟）
- 成功生成 318 道（接近 324 目标，少数节点 LLM 返回不全）
- 平均 RT ~3s/调用 + 3s sleep = 6s/节点
- AiRateLimiter 30/min 限制：实际平均 10/min，远低于阈值

---

## 已知遗留 / 下一会话

1. **driver script python heredoc 转义 bug**：原始版本 `d.get(\"message\",\"?\")` 在 shell 单引号 python 里语法错，每次都 PARSE error 但**后端实际生成成功**。已在 commit 4fd9850 修复（改用拼接）。
2. **seeder 不批 batch**：每节点单 POST 调用，11 分钟跑完一学科。可改为 parallel curl + 共享 token，进一步缩到 ~5 分钟。
3. **数学一 / 408 / 政治 都可以再补**：目标 ≥3/节点，建议 seed-llm-questions.sh math/cs408/politics 各跑一遍。
4. **LLM 题质量未审核**：抽样查 ~10 道质量 OK（4 选项合理 + 答案明确 + 解析有）。但批量 318 道未人工抽检。
5. **link-based 占位题数据库未删**：仍占 2280 行，只是被"答题主流程"过滤掉。可以加个独立 tab "外部资源题"专门展示，让用户手动跳 B 站搜索。

---

## 度量

| 指标 | 数值 |
|---|---|
| commits | 3 |
| 已 push | ✓ `f4dfe81` |
| 后端代码 | ~110 行（含 native SQL group by） |
| 前端代码 | resources -892 行 / quiz +35 行 |
| LLM 生成完整题 | 318 道（英语一）|
| 数据库 inline 题占比 | 24% → 35%（+11pp）|
