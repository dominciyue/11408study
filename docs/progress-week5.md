# 11408 交互式考研学习平台 — 第五周工作总结

## 本周目标（计划对照）

- **智能出题引擎（Java+Python 协作）**：以现有题库为主，预留 AI 生成入口
- **测验模式**：可真正进入练习、提交答案、查看解析
- **错题本**：展示未解决错题，形成闭环
- **高级图谱交互**：本周优先保证“测验闭环”，图谱高级交互留作下周增强

---

## 后端（Spring Boot）进展

### 1) 错题本 DTO 化，避免直接返回带 LAZY 关联的 Entity

- 新增 `WrongAnswerDTO`：包含题干、用户答案、正确答案、解析、时间等字段
- `GET /quiz/wrong-answers` 改为返回 `List<WrongAnswerDTO>`

相关文件：
- `backend/src/main/java/com/study11408/dto/WrongAnswerDTO.java`
- `backend/src/main/java/com/study11408/service/QuizService.java`
- `backend/src/main/java/com/study11408/controller/QuizController.java`

---

## 前端（Next.js）进展

### 1) API 对齐后端测验接口

对齐后端 `QuizController` 的实际路由与参数形态：

- `quizApi.generate(nodeIds, count)` → `POST /quiz/generate`（query params 传 `nodeIds` + `count`）
- `quizApi.submit({questionId, userAnswer})` → `POST /quiz/submit`
- `quizApi.getWrongAnswers()` → `GET /quiz/wrong-answers`

相关文件：
- `frontend/src/lib/api.ts`
- `frontend/src/types/index.ts`（QuizQuestion / WrongAnswer 类型对齐）

### 2) 新增“专项练习”可用页面

新增 `GET /quiz/practice` 页面（最小可用练习流程）：

- 先按 `subjectId` 拉取若干知识点（`/knowledge/nodes?subjectId=`）
- 取前 N 个 nodeId 作为出题范围，调用 `/quiz/generate`
- 支持选择答案 → 提交 → 展示对错与解析 → 下一题/上一题

相关文件：
- `frontend/src/app/quiz/practice/page.tsx`

### 3) 新增“错题本”页面

新增 `/quiz/wrong` 页面：

- 拉取 `/quiz/wrong-answers`
- 展示题干、你的答案、正确答案、解析

相关文件：
- `frontend/src/app/quiz/wrong/page.tsx`

### 4) 测验中心页面增加导航入口

`/quiz` 中点击：

- “专项练习” → `/quiz/practice?subjectId=4`（默认 408）
- “错题重练” → `/quiz/wrong`

相关文件：
- `frontend/src/app/quiz/page.tsx`

---

## 运行与验证

- **前端构建**：`frontend` 已通过 `npm run build`。

---

## 下一步（第六周建议落点）

- 生产化容器编排：补齐 `frontend` Dockerfile + 一键 `docker-compose up` 启动三端（含 Nginx）
- 跨平台：PWA manifest + service worker，后续再扩展 Capacitor/Electron
- 部署与上线：环境变量、CORS、鉴权、上传大小、反向代理路径统一

