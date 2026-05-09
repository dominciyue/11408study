# 11408 交互式考研学习平台 — 第三周工作总结

## 本周目标（计划对照）

- **学习路径引擎（Java）**：按知识图谱 `PREREQUISITE` 依赖生成学习顺序（拓扑排序）
- **间隔重复系统（SM-2）**：复习队列 + 反馈更新（掌握度/复习间隔）
- **学习模式页面**：从“展示页”升级为可用功能入口
- **数据仪表盘**：对接真实统计 API，并展示图表

---

## 后端（Spring Boot）进展

### 学习路径与复习队列（已可用）

- **学习路径**：`StudyPathService.generatePath(subjectId)` 使用 Kahn 拓扑排序，按 `relationType = "prerequisite"` 生成学习顺序。
- **复习队列**：`StudyPathService.getReviewQueue(userId)` 基于 `study_progress.next_review <= now()` 返回今日到期复习节点。
- **学习反馈**：`StudyController POST /study/feedback` 调用 `SpacedRepetitionService.processFeedback(...)`，写入/更新 `StudyProgress`（SM-2）。

相关文件：
- `backend/src/main/java/com/study11408/service/StudyPathService.java`
- `backend/src/main/java/com/study11408/service/SpacedRepetitionService.java`
- `backend/src/main/java/com/study11408/controller/StudyController.java`

### 学习会话（Session）接口补齐（供统计使用）

为支持趋势统计，本周补齐了学习会话接口，并为表结构增加字段：

- **Flyway 迁移**：新增 `study_sessions.subject_id` 与 `study_sessions.mode`
  - `backend/src/main/resources/db/migration/V3__study_sessions_mode_subject.sql`
- **实体扩展**：`StudySession` 增加 `subject`/`subjectId` 与 `mode`
  - `backend/src/main/java/com/study11408/entity/StudySession.java`
- **会话服务**：`StudySessionService.startSession/endSession`
  - `backend/src/main/java/com/study11408/service/StudySessionService.java`
- **接口**：
  - `POST /study/sessions`：开始会话（`subjectId` 可选，`mode` 必填）
  - `PUT /study/sessions/{sessionId}/end`：结束会话

### 统计概览 DTO 化（对齐前端需求）

将 `/stats/overview` 从返回 Map 升级为返回 DTO，便于前端直接渲染：

- 新增 DTO：
  - `StatsOverviewDTO`
  - `SubjectProgressDTO`
- 统计内容（overview）包含：
  - 总节点、已学习节点、已掌握节点、平均掌握度、总学习分钟数
  - 今日学习数/复习数/学习分钟数
  - 连续学习天数（streak）
  - 最近 7 天学习分钟数数组（用于图表）
  - 学科维度进度（subjectProgress）

相关文件：
- `backend/src/main/java/com/study11408/service/StatsService.java`
- `backend/src/main/java/com/study11408/controller/StatsController.java`
- `backend/src/main/java/com/study11408/dto/StatsOverviewDTO.java`
- `backend/src/main/java/com/study11408/dto/SubjectProgressDTO.java`

### Repository 增强

- `KnowledgeNodeRepository`：新增 `countByTopicSubjectId(subjectId)` 用于学科进度统计
- `StudyProgressRepository`：新增 `findByUserIdWithNodeSubject(userId)`（fetch join）避免统计阶段的懒加载问题

---

## 前端（Next.js）进展

### Dashboard：接入真实统计并加上图表

- `dashboard/page.tsx`
  - 从 `statsApi.overview()` 拉取数据
  - “今日数据”面板改为真实：已学习、待复习、学习时长、连续天数
  - “学科进度”卡片改为由后端 `subjectProgress` 驱动
  - “学习趋势”加入 **Recharts 柱状图**（最近 7 天学习分钟数）

相关文件：
- `frontend/src/app/dashboard/page.tsx`
- `frontend/src/lib/api.ts`（新增 `statsApi.daily/weakness`）
- `frontend/src/types/index.ts`（更新 `StatsOverview` 类型）

### 学习模式页：从静态展示变为可导航功能入口

- `study/page.tsx`
  - 页面顶部 “今日已学/已学知识点” 改为基于 `/stats/overview` 的真实数据
  - “复习队列”徽标展示基于 `/study/review-queue` 的真实数量
  - 点击卡片可进入对应功能页

相关文件：
- `frontend/src/app/study/page.tsx`

### 新增可用功能页

- **复习队列页**：`/study/review`
  - 拉取 `/study/review-queue`
  - 对每个知识点提供 `0..5` 评分按钮，调用 `/study/feedback`（SM-2）
- **学习路径页**：`/study/path`
  - 拉取 `/subjects` 获取学科列表
  - 按选择学科请求 `/study/path/{subjectId}`，展示拓扑排序后的路径列表

相关文件：
- `frontend/src/app/study/review/page.tsx`
- `frontend/src/app/study/path/page.tsx`

---

## 运行与验证

- **前端构建**：`frontend` 已通过 `npm run build`。
- **后端构建提示**：当前环境缺少 `mvn`（Maven），如需本机编译后端请安装 Maven 或后续补入 Maven Wrapper（`mvnw`）。

---

## 下周（第四周）建议切入点

- 将 AI 微服务（PDF 解析/知识提取/关系推荐）与后端 `AiClientService` 和前端资料导入流程做端到端联调
- 资料上传后：触发 PDF 分块解析 → LLM 提取知识点候选 → 提交到图谱（节点/边创建）
- 笔记系统落地：对 `Note` 的 CRUD（当前前端已预置页面，后端需补齐 `NotesController` 等）

