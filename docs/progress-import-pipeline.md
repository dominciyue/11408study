# 资料导入闭环（进行中）

## 已实现（最小可用版本）

- **后端导入 API**
  - `POST /import/materials/{materialId}/parse-pdf`：调用 AI `/ai/parse-pdf`，返回 chunks（content/page/section）
  - `POST /import/extract`：调用 AI `/ai/extract`，返回知识点候选（title/content/difficulty）

- **前端导入向导**
  - 新增页面：`/materials/import/[id]`
  - 流程：选择 chunk → AI 提取 → 勾选候选知识点 → 选择 Topic → 批量创建知识节点（写入图谱）
  - 入口：资料库列表新增跳转按钮到导入向导

## 下一步（强化为可上架能力）

- **导入任务/可恢复**
  - 引入 ImportJob 表：记录解析/提取状态、错误、进度，可断点续跑
  - 大文件异步化：后台任务队列（或简单 `@Async` + 轮询）

- **去重与合并**
  - 同 Topic 下 title 相似度去重（简易：lowercase+trim；高级：embedding）
  - 合并策略：同名节点追加内容/metadata

- **边关系导入**
  - 使用 AI `suggest_relations` 将候选点之间生成边
  - 前端提供边预览与勾选确认

- **测试**
  - 后端：Mock AI 返回，集成测试验证“导入→创建节点”闭环
  - 前端：Playwright 覆盖上传→进入导入页→提取→导入

