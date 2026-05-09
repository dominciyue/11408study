# 11408 交互式考研学习平台 — 第四周工作总结

## 本周目标（计划对照）

- **Python AI 微服务联调**：为后端提供可调用的 AI 能力（PDF 解析 / 知识提取 / 关系推荐 / 内容增强 / 出题）
- **资料导入**：资料上传与管理，作为后续“解析→提取→导入图谱”的入口
- **笔记系统**：笔记 CRUD，支持与知识点关联

> 说明：本周优先打通“资料管理 + 笔记 CRUD + AI 调用链路修正”，为后续自动导入图谱与推荐能力做铺垫。

---

## 后端（Spring Boot）进展

### 1) 笔记系统（完整 CRUD）

新增后端笔记模块，使前端 `notesApi` 能落地到真实数据：

- **新增 Controller**：`/notes`
  - `GET /notes?nodeId=`：获取当前用户笔记列表（可按 nodeId 过滤）
  - `POST /notes`：创建笔记
  - `PUT /notes/{id}`：更新笔记
  - `DELETE /notes/{id}`：删除笔记
- **新增 Service**：权限校验（仅允许操作自己的笔记）
- **新增 DTO**：避免直接返回带 LAZY 关联的 JPA Entity
  - `NoteDTO`：包含 `nodeTitle/topicName/subjectName` 等展示字段
  - `CreateNoteRequest` / `UpdateNoteRequest`
- **Repository 修正**：防止“按 nodeId 查询到别人的笔记”
  - `NoteRepository.findByUserIdAndNodeId(userId, nodeId)`

相关文件：
- `backend/src/main/java/com/study11408/controller/NoteController.java`
- `backend/src/main/java/com/study11408/service/NoteService.java`
- `backend/src/main/java/com/study11408/dto/NoteDTO.java`
- `backend/src/main/java/com/study11408/dto/CreateNoteRequest.java`
- `backend/src/main/java/com/study11408/dto/UpdateNoteRequest.java`
- `backend/src/main/java/com/study11408/repository/NoteRepository.java`

### 2) AI Client 调用链路修正（对齐 FastAPI 路由）

本周修正 `AiClientService` 的请求路径/字段，使其与 FastAPI 实际路由对齐（FastAPI 路由统一 prefix 为 `/ai`）：

- `extractKnowledge(...)` → `POST {ai}/ai/extract`
- `suggestRelations(...)` → `POST {ai}/ai/suggest-relations`
- `generateQuiz(...)` → `POST {ai}/ai/generate-quiz`
- `enhanceContent(...)` → `POST {ai}/ai/enhance`
- 新增 `parsePdf(fileUrl)` → `POST {ai}/ai/parse-pdf`

相关文件：
- `backend/src/main/java/com/study11408/service/AiClientService.java`

---

## 前端（Next.js）进展

### 1) 资料库页面从“假数据”升级为真实 API

- **列表**：对接 `GET /materials` 展示真实上传记录
- **上传**：对接 `POST /materials/upload`（multipart），支持：
  - 右上角“添加资料”按钮选择文件
  - 拖拽区域 Drop 上传
- **删除**：对接 `DELETE /materials/{id}`
- **打开文件**：使用后端返回的 `fileUrl` 直接打开

相关文件：
- `frontend/src/app/materials/page.tsx`
- `frontend/src/types/index.ts`（Material 类型调整为 `fileUrl/fileSize/...`）

### 2) 笔记页面对接真实后端

- **列表**：对接 `GET /notes`，支持搜索过滤
- **新建**：提供最小可用的创建流程（浏览器 prompt），调用 `POST /notes`

相关文件：
- `frontend/src/app/notes/page.tsx`
- `frontend/src/types/index.ts`（Note 类型调整为与 `NoteDTO` 对齐）

---

## 运行与验证

- **前端构建**：`frontend` 已通过 `npm run build`。

---

## 下一步（第五周前的衔接建议）

- **资料→图谱导入闭环**（建议作为第五周开头或第四周加餐）：
  - 上传资料（已完成）
  - 调用 AI `/ai/parse-pdf` 分块（已补齐 Java 客户端调用）
  - 针对 chunk 调用 `/ai/extract` 得到知识点候选
  - 前端提供“确认导入”交互：选择 subject/topic → 批量创建 `KnowledgeNode` + `KnowledgeEdge`
- **笔记编辑体验升级**：
  - 用现有的 `Dialog` + 富文本编辑器（Tiptap）替换 prompt
  - 支持从图谱节点详情面板“一键创建关联笔记”

