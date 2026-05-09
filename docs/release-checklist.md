# 上架/发布检查清单（持续完善）

## 1) 配置与环境变量

- 前端
  - `NEXT_PUBLIC_API_BASE_URL`（建议通过 Nginx 统一入口，生产下为 `http(s)://<domain>/api`）
- 后端
  - `APP_JWT_SECRET`：必须替换为生产密钥
  - `SPRING_DATASOURCE_*`：生产数据库
  - `APP_MINIO_*`：对象存储（建议区分 internal/public endpoint）
  - `APP_AI_SERVICE_URL`
- AI
  - `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`（如启用）

## 2) 安全

- 关闭 debug 日志、禁用过宽 CORS（生产环境改为白名单）
- JWT Secret 不能提交到仓库；生产用环境变量覆盖
- 上传文件类型/大小校验（后端 + Nginx）
- MinIO Bucket 权限策略：避免公开写入

## 3) 稳定性

- 关键链路的集成测试（backend Testcontainers）
- 关键页面 E2E（Playwright）
- AI 服务降级：无 API Key 时返回可读错误，不影响核心功能

## 4) 跨平台封装策略

- PWA（优先）
  - `manifest.webmanifest`（已加入）
  - 后续：icons、service worker、离线策略、缓存策略
- 桌面端
  - Electron：打包前端静态资源 + 指向本地/远程后端
- 移动端
  - Capacitor：同源 API（推荐 Nginx 统一域名）

## 5) 上线步骤（建议）

- 先上云部署：Nginx + backend + ai-service + db/redis/minio
- 再做前端域名/HTTPS
- 再做 PWA 安装体验与推送能力（可选）

