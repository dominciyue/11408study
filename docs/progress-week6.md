# 11408 交互式考研学习平台 — 第六周工作总结

## 本周目标（计划对照）

- **Docker 容器化部署**：一条命令启动前端/后端/AI/网关及依赖服务
- **跨平台适配**：优先落地 PWA 基础能力（manifest），为后续 Capacitor/Electron 做准备
- **上线准备**：统一反向代理入口，整理运行方式

---

## 容器化（Docker Compose）

### 1) 新增 `docker-compose.yml`（一键启动全栈）

新增生产化组合编排，包含：

- `postgres`（PostgreSQL 15）
- `redis`（Redis 7）
- `minio`（对象存储）
- `ai-service`（FastAPI）
- `backend`（Spring Boot）
- `frontend`（Next.js）
- `nginx`（统一入口反向代理）

入口统一为：
- 前端：`http://localhost/`
- Java API：`http://localhost/api/`
- AI：`http://localhost/ai/`

相关文件：
- `docker-compose.yml`
- `nginx/nginx.conf`（已存在，作为网关配置）

### 2) 前端 Dockerfile（Next.js standalone）

为前端新增多阶段构建 Dockerfile，并启用 Next.js `output: "standalone"`：

- `frontend/Dockerfile`
- `frontend/next.config.ts`（新增 `output: "standalone"`）

---

## 跨平台（PWA 基础）

新增 PWA Manifest，并在 Next metadata 中声明：

- `frontend/public/manifest.webmanifest`
- `frontend/src/app/layout.tsx`（`metadata.manifest`）

> 说明：本周先落地“可安装”的基础能力。后续如要完整 PWA（service worker、离线缓存、图标集），可继续补齐。

---

## 运行方式（建议）

### Docker 一键启动

在项目根目录执行：

```bash
docker compose up -d --build
```

然后访问：
- `http://localhost/`（前端）
- `http://localhost/swagger-ui.html`（后端 Swagger UI，经 Nginx 转发）

---

## 已知注意点

- 后端构建依赖 Maven：当前本机环境可能缺少 `mvn`，但 Docker 构建会在容器内完成编译。
- MinIO 的公开访问地址与容器内访问地址在真实上线时建议拆分（internal/public endpoint），以避免生成的 `fileUrl` 在浏览器侧不可达。

