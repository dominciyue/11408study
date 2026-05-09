# 11408study 架构审查与优化方案 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在本地用 `docker compose` 跑通 11408study 全栈（基于 commit `0f08c91 ds version`），并产出 6 份审查文档存放于 `docs/audit/`。

**Architecture:** 先验证后审查后输出。先用 docker-compose 起 6 个服务（postgres/redis/minio/backend/ai/frontend）+ Nginx，验证基本健康；过程中边读代码边记笔记；最后集中写 6 份 markdown 文档并提交。仅修阻塞本地跑通的 blocker，不做大规模重构。

**Tech Stack:** Docker Compose · PostgreSQL 15 · Spring Boot 3 · Next.js 16 · FastAPI · Nginx

**Spec 引用：** `docs/superpowers/specs/2026-05-09-architecture-audit-design.md`

**已知现成资源：**
- `docker-compose.yml`（端口 18081）
- `docker-compose.dev.yml`（旧 dev 版，仅用作参考）
- `nginx/nginx.conf`
- `backend/Dockerfile`（多阶段 Maven 构建）
- `frontend/Dockerfile`（Next.js standalone）
- `ai-service/Dockerfile`

**已知约束：**
- 本机 ClickHouse 容器占用端口 9000（与 MinIO 冲突）—— Task 1 处理
- 本机 Java 18 / Node 22 / Python 3.10，Docker 24 + Compose v2 可用
- 本机 Maven 已装，但首选用 Docker 构建保证一致性

---

## File Structure

**新创建（仅 docs）：**
- `docs/audit/00-overview.md` — 执行摘要
- `docs/audit/01-architecture-audit.md` — 架构审查报告
- `docs/audit/02-optimization-roadmap.md` — 优化路线图
- `docs/audit/03-production-deployment.md` — 生产部署方案
- `docs/audit/04-llm-adapter-cn.md` — 国产 LLM 适配方案
- `docs/audit/05-local-validation.md` — 本地跑通验证报告

**可能修改（仅在阻塞本地跑通时）：**
- `docker-compose.yml` — 端口冲突时改 MinIO 端口映射
- `backend/pom.xml` — 若 `${lombok.version}` 缺失导致编译失败，加 properties

**禁止改动：** 业务代码、控制器、实体、服务、前端页面 —— 任何业务问题写入审查报告，不在本计划修复。

---

## Task 1: 环境准备与端口冲突解决

**Files:**
- Modify (可能): `docker-compose.yml`

- [ ] **Step 1.1: 检查端口占用情况**

Run:
```bash
ss -ltn | grep -E ':(80|3000|5432|6379|8000|8080|9000|9001|18081)\b' 2>&1
```

Expected: 至少 `:9000` 被占用（ClickHouse）。其他端口理想情况下都空闲。

- [ ] **Step 1.2: 检查现有容器情况，决定是否需要停 ClickHouse**

Run:
```bash
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Ports}}' | grep -E '(clickhouse|node-exporter|prometheus)'
```

如果 ClickHouse 容器名 = `clickhouse-recovered`，**两种方案二选一：**
- **方案 A（临时）**：`docker stop clickhouse-recovered` —— 跑完审查后 `docker start` 恢复
- **方案 B（持久）**：在 `docker-compose.yml` 中把 MinIO 的 `9000:9000` 改成 `19000:9000`（同时还要改 `9001:9001` 为 `19001:9001` 避免控制台冲突），并提示前端代码若直接用 9000 需要相应调整

**默认采用方案 A**（最小破坏现有 compose 文件）。如果用户后续要长期同时跑两套，再切方案 B。

执行：`docker stop clickhouse-recovered`

- [ ] **Step 1.3: 预拉常用基础镜像（并行后台执行）**

Run（后台执行，节省时间）：
```bash
docker pull postgres:15-alpine &
docker pull redis:7-alpine &
docker pull minio/minio:latest &
docker pull nginx:alpine &
docker pull node:18-alpine &
docker pull eclipse-temurin:17-jdk-jammy &
docker pull python:3.11-slim &
wait
echo "All base images pulled"
```

Expected: 全部 pull 完成，无错误。如果有镜像源问题，记录到 doc 5。

- [ ] **Step 1.4: 提交本步骤的产物（如有 compose 修改）**

如果有改 `docker-compose.yml`：
```bash
git add docker-compose.yml
git -c user.email=audit@local -c user.name=Claude commit -m "chore(compose): remap MinIO ports to avoid local ClickHouse conflict"
```

如未改任何文件，跳过提交。

---

## Task 2: 启动基础设施层并验证 Flyway

**Files:** 仅运行命令，不改文件

- [ ] **Step 2.1: 启动 postgres / redis / minio**

Run：
```bash
cd /home/ygwang/11408study && docker compose up -d postgres redis minio 2>&1 | tail -20
```

Expected: 三个容器启动，无错误。

- [ ] **Step 2.2: 等待 postgres 就绪**

Run：
```bash
for i in {1..30}; do
  if docker exec $(docker compose ps -q postgres) pg_isready -U study11408 -d study11408 >/dev/null 2>&1; then
    echo "postgres ready after ${i}s"; break
  fi
  sleep 1
done
```

Expected: `postgres ready after Ns`（一般 5-15 秒）。

- [ ] **Step 2.3: 验证 redis 连通性**

Run：
```bash
docker exec $(docker compose ps -q redis) redis-cli ping
```

Expected: `PONG`

- [ ] **Step 2.4: 验证 MinIO 控制台可访问**

Run：
```bash
curl -sf http://localhost:9001/minio/health/live -o /dev/null && echo "minio live" || echo "minio unhealthy"
```

Expected: `minio live`

- [ ] **Step 2.5: 记录基础设施层启动状态到工作笔记**

把上述各步骤的输出汇总，写入 `/tmp/audit-notes.md` 中的 "基础设施" 章节，后续会喂入 doc 5。这一步用 Bash 直接 `cat >>` 即可。

---

## Task 3: 构建并启动 backend，验证 Swagger 与健康检查

**Files:** 仅运行命令；如遇 pom 问题可能修 `backend/pom.xml`

- [ ] **Step 3.1: 构建 backend 镜像**

Run（后台执行，因为时间长 10-15 分钟）：
```bash
cd /home/ygwang/11408study && docker compose build backend 2>&1 | tail -30
```

Expected: BUILD SUCCESS。
如失败：常见原因 = `${lombok.version}` 未定义 —— 此时在 `backend/pom.xml` 的 `<properties>` 中加 `<lombok.version>1.18.32</lombok.version>`。

- [ ] **Step 3.2: 启动 backend**

Run：
```bash
docker compose up -d backend 2>&1 | tail -10
```

- [ ] **Step 3.3: 等待 backend 启动并验证 Flyway 跑通**

Run：
```bash
for i in {1..60}; do
  if curl -sf http://localhost:8080/api/swagger-ui/index.html -o /dev/null 2>/dev/null; then
    echo "backend ready after ${i}s"; break
  fi
  sleep 2
done
docker compose logs backend 2>&1 | grep -E '(Flyway|migration|Started Study11408|ERROR)' | tail -20
```

Expected: `backend ready after Ns`，日志中出现 "Successfully applied 3 migrations"（V1, V2, V3）和 "Started Study11408Application"。

⚠️ Backend 因为 `application.yml` 默认 `localhost`，但 Docker 内连不到 host postgres。已通过 `SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/study11408` 在 compose 中覆盖，应该正常。如果 backend 报 connection refused，验证 compose env 是否生效。

- [ ] **Step 3.4: 验证后端关键 endpoint**

Run：
```bash
echo "--- /api/v3/api-docs ---"
curl -s http://localhost:8080/api/v3/api-docs | head -c 200
echo ""
echo "--- /api/auth/register (smoke) ---"
curl -s -X POST http://localhost:8080/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"username":"audituser","email":"audit@test.local","password":"password123"}' | head -c 500
echo ""
```

Expected: api-docs 返回 OpenAPI JSON，register 返回成功（含 token）或 400（用户已存在），不应是 500。

- [ ] **Step 3.5: 记录到工作笔记**

把 backend 启动情况、Flyway 输出、curl 验证结果追加到 `/tmp/audit-notes.md` 的 "后端" 章节。

⚠️ **不在本任务跑 IT 测试** —— Testcontainers 会再拉镜像、跑很久，且需要 Docker socket 挂载。验证基础启动即可。如果用户后续要求跑 IT，单独做。

---

## Task 4: 构建并启动 ai-service

**Files:** 仅运行命令

- [ ] **Step 4.1: 构建 ai-service 镜像**

Run：
```bash
cd /home/ygwang/11408study && docker compose build ai-service 2>&1 | tail -20
```

Expected: BUILD SUCCESS（首次约 3-5 分钟）。

- [ ] **Step 4.2: 启动 ai-service**

Run：
```bash
docker compose up -d ai-service 2>&1 | tail -5
```

- [ ] **Step 4.3: 验证健康检查**

Run：
```bash
for i in {1..30}; do
  if curl -sf http://localhost:8000/health 2>/dev/null; then
    echo "ai-service ready after ${i}s"; break
  fi
  sleep 1
done
echo ""
echo "--- ai-service openapi ---"
curl -s http://localhost:8000/openapi.json | head -c 300
echo ""
```

Expected: `{"status":"ok"}` 或类似响应；openapi.json 列出 `/ai/extract` 等路径。

- [ ] **Step 4.4: 验证未配 API key 时的失败行为（重要：审查素材）**

Run（无需 key 也应能调通到错误返回点）：
```bash
curl -s -X POST http://localhost:8000/ai/extract \
  -H 'Content-Type: application/json' \
  -d '{"text":"test","subject":"408","topic":"数据结构"}' | head -c 500
echo ""
```

Expected: 报错（"OpenAI API key 未配置"或 RuntimeError），**记录此响应作为 doc 4 的素材**。

- [ ] **Step 4.5: 记录到工作笔记**

追加到 `/tmp/audit-notes.md` 的 "AI 服务" 章节。

---

## Task 5: 构建并启动 frontend + nginx，验证端到端

**Files:** 仅运行命令

- [ ] **Step 5.1: 构建 frontend 镜像**

Run（后台执行，时间长 3-5 分钟）：
```bash
cd /home/ygwang/11408study && docker compose build frontend 2>&1 | tail -20
```

Expected: BUILD SUCCESS。
如失败常见原因：Next.js 16 + Node 18 兼容问题 —— 若如此，把 `frontend/Dockerfile` 中的 `node:18-alpine` 改为 `node:20-alpine`。**此为允许的 blocker 修复。**

- [ ] **Step 5.2: 启动 frontend + nginx**

Run：
```bash
docker compose up -d frontend nginx 2>&1 | tail -10
```

- [ ] **Step 5.3: 验证 nginx 路由**

Run：
```bash
sleep 5
echo "--- frontend via nginx ---"
curl -sI http://localhost:18081/ | head -5
echo ""
echo "--- /api via nginx ---"
curl -sI http://localhost:18081/api/v3/api-docs | head -5
echo ""
echo "--- /ai via nginx ---"
curl -sI http://localhost:18081/ai/openapi.json | head -5
echo ""
```

Expected: 三处都返回 200 状态。

- [ ] **Step 5.4: 验证全栈状态**

Run：
```bash
docker compose ps
```

Expected: 6 个服务全部 `Up` 或 `running` 状态。

- [ ] **Step 5.5: 记录到工作笔记 + 截图占位**

追加到 `/tmp/audit-notes.md` 的 "前端 + 网关" 章节。**不试图截图**（无浏览器自动化）；doc 5 中标注"建议人工验证 http://localhost:18081/"。

---

## Task 6: 写 doc 5 — 本地跑通验证报告

**Files:**
- Create: `docs/audit/05-local-validation.md`

- [ ] **Step 6.1: 起草 doc 5**

把 `/tmp/audit-notes.md` 整理为正式文档，结构如下：

```markdown
# 本地跑通验证报告

## 1. 环境信息
- OS / Docker / Java / Node / Python 版本（已检查）

## 2. 端口冲突与解决
- ClickHouse 容器占 9000 → 临时 stop（或重映射）

## 3. 启动顺序与命令
- `docker compose up -d postgres redis minio`
- `docker compose up -d --build backend`
- `docker compose up -d --build ai-service`
- `docker compose up -d --build frontend nginx`

## 4. 各服务验证结果
（postgres/redis/minio/backend/ai/frontend/nginx 逐个，含 curl 输出关键片段）

## 5. 已知 blocker 与修复
- 列出本次修了什么（理想情况：0 个）

## 6. 未验证项 / 留待人工
- 浏览器实际访问 / 注册流程 / 知识图谱可视化
- IT 测试 / Playwright E2E

## 7. 建议下一步操作
- 若计划在本机演示：`docker compose up -d`，访问 http://localhost:18081/
- 若要恢复 ClickHouse：`docker start clickhouse-recovered`
```

预计 1500-2500 字。

- [ ] **Step 6.2: 提交 doc 5**

Run：
```bash
cd /home/ygwang/11408study
git add docs/audit/05-local-validation.md
git -c user.email=audit@local -c user.name=Claude commit -m "docs(audit): add 05-local-validation report"
```

---

## Task 7: 后端代码质量审查（读 + 记笔记）

**Files:** 仅读代码 + 写到 `/tmp/audit-notes.md` 的"代码审查"章节

⚠️ 不修代码。所有问题用 `文件:行号` 标注，等级 🔴🟠🟡🟢。

- [ ] **Step 7.1: 审 ImportController.java**

读 `backend/src/main/java/com/study11408/controller/ImportController.java` 全文。

检查项：
- 类型转换 `(List<Map<String, Object>>) raw.get("chunks")` 的安全性
- AI 错误传播（`Map.of("error", ...)` → throw `BusinessException`）是否合适
- 输入校验：`materialId` 是否做权限检查（用户能否解析别人的资料？）
- 大 PDF 长耗时同步阻塞 RestTemplate 是否合理

输出问题清单（每条一行：`[等级][文件:行号] 问题描述`）。

- [ ] **Step 7.2: 审 NoteController + NoteService**

读 `backend/src/main/java/com/study11408/controller/NoteController.java` 和 `backend/src/main/java/com/study11408/service/NoteService.java`。

检查项：
- 权限校验（"只能操作自己的笔记"）是否在每个写入/删除路径都覆盖
- DTO 转换是否暴露非授权字段
- 列表查询是否支持分页（避免单用户 N 万笔记一次拉全）

- [ ] **Step 7.3: 审 StatsService.java**

读 `backend/src/main/java/com/study11408/service/StatsService.java`。

检查项：
- fetch join 是否充分（避免 N+1）
- 复杂统计是否考虑缓存（Redis @Cacheable 用了吗？）
- subject 维度查询是否会随学科数线性增长

- [ ] **Step 7.4: 审 AiClientService.java**

读 `backend/src/main/java/com/study11408/service/AiClientService.java`。

检查项：
- RestTemplate 无 timeout（网络挂会无限等）
- `Map.of("error", ...)` 兜底破坏类型，下游强转 cast 风险
- 无连接池、无重试、无熔断
- 5 个方法重复代码可抽 helper

- [ ] **Step 7.5: 审 SecurityConfig.java**

读 `backend/src/main/java/com/study11408/config/SecurityConfig.java`。

检查项：
- `actuator/**` permitAll 风险（暴露 /actuator/env 会泄密）
- CSRF disable 对 JWT 是合适的，但要写入"已知"
- CORS 配置在哪？需要单独读 `CorsConfig.java`

- [ ] **Step 7.6: 审 application.yml + JWT secret**

读 `backend/src/main/resources/application.yml`。

检查项：
- JWT secret 硬编码 base64 字符串（🔴 必修）
- DB 密码 `study11408_dev` 硬编码
- `show-sql: true` 在生产不应开启（已通过 `application-prod.yml` 覆盖，OK）

- [ ] **Step 7.7: 审 CorsConfig.java + JwtAuthenticationFilter**

读 `backend/src/main/java/com/study11408/config/CorsConfig.java` 和 `backend/src/main/java/com/study11408/security/JwtAuthenticationFilter.java`。

检查项：
- CORS allowed origins 是否过宽（`*` 是 🔴）
- JWT 解析的异常路径（无效 token、过期 token、缺失 claim）

- [ ] **Step 7.8: 把审查清单整理到工作笔记**

汇总到 `/tmp/audit-notes.md` 的 "后端代码审查" 章节。

---

## Task 8: 基础设施 / 配置审查

**Files:** 仅读 + 笔记

- [ ] **Step 8.1: 审 docker-compose.yml**

读 `docker-compose.yml`（已有上下文，复审）。

检查项：
- Postgres / MinIO / Redis 密码硬编码（🔴）
- 无 healthcheck（🟡）
- 无 resource limits（🟡）
- 无 restart policy（🟡）
- 无 logging driver / size 控制（🟡）
- frontend env `NEXT_PUBLIC_API_BASE_URL=http://localhost:18081/api` 与生产域名不匹配（部署到云时需修改）

- [ ] **Step 8.2: 审 nginx/nginx.conf**

读 `nginx/nginx.conf`。

检查项：
- 仅 listen 80（无 HTTPS） — 🔴
- 无安全 header（X-Frame-Options, CSP, HSTS） — 🟠
- 无 gzip — 🟡
- `client_max_body_size 100M` OK 但需 backend / FastAPI 也对齐
- 无 limit_req — 🟠
- 静态资源无 cache header — 🟡

- [ ] **Step 8.3: 审 V1/V2/V3 SQL 迁移**

读 `backend/src/main/resources/db/migration/V1__init.sql`、`V2__seed_408_knowledge.sql`、`V3__study_sessions_mode_subject.sql`。

检查项：
- 索引覆盖度（哪些查询路径无索引？）
- 字段类型选择（VARCHAR 长度）
- 约束完整性（哪些 NULL/UNIQUE 应加未加）
- 时区处理（TIMESTAMP without TIMEZONE 在国际化场景的隐患）

- [ ] **Step 8.4: 审 ai-service 的 Dockerfile + config**

读 `ai-service/Dockerfile`、`ai-service/app/config.py`。

检查项：
- 镜像无健康检查
- 无 worker 数配置（uvicorn 默认单 worker，并发受限）
- API key 通过 env 但 docker-compose.yml 中没有传递 → 启动时会报 ValueError

- [ ] **Step 8.5: 审 frontend Dockerfile + manifest**

读 `frontend/Dockerfile`、`frontend/public/manifest.webmanifest`。

检查项：
- Node 18 与 Next.js 16 兼容性（如果 Step 5.1 已修过，记入"已修"）
- Manifest 缺 icons（PWA 不能装）
- 无 service worker（PWA 不能离线）

- [ ] **Step 8.6: 把笔记追加到 /tmp/audit-notes.md**

---

## Task 9: 前端代码审查（轻量抽查）

**Files:** 仅读 + 笔记

- [ ] **Step 9.1: 审 lib/api.ts 和 lib/auth.ts**

读 `frontend/src/lib/api.ts`、`frontend/src/lib/auth.ts`。

检查项：
- token 存储位置（localStorage 易受 XSS — 🟠）
- axios baseURL 切换逻辑
- 401 拦截器是否自动登出

- [ ] **Step 9.2: 抽查 dashboard / quiz/practice / materials/import 三个新页面**

读 `frontend/src/app/dashboard/page.tsx`、`frontend/src/app/quiz/practice/page.tsx`、`frontend/src/app/materials/import/[id]/page.tsx`。

检查项：
- 错误状态显示
- loading 状态
- 表单输入校验
- 大文件 / 长列表性能（virtualization？）

- [ ] **Step 9.3: 笔记追加**

---

## Task 10: 写 doc 1 — 架构审查报告

**Files:**
- Create: `docs/audit/01-architecture-audit.md`

- [ ] **Step 10.1: 起草 doc 1**

按 spec §5.2 的结构写：
1. 当前架构图（mermaid）
2. 逐层评估：前端 / 后端 / AI 服务 / 数据层
3. 横切关注点：安全 / 性能 / 可扩展 / 可观测 / 可维护
4. 代码级深度审查（基于 Task 7-9 的笔记，按文件组织）
5. 严重等级汇总表

预计 4000-6000 字。

- [ ] **Step 10.2: 提交 doc 1**

Run：
```bash
git add docs/audit/01-architecture-audit.md
git -c user.email=audit@local -c user.name=Claude commit -m "docs(audit): add 01-architecture-audit report"
```

---

## Task 11: 写 doc 2 — 优化路线图

**Files:**
- Create: `docs/audit/02-optimization-roadmap.md`

- [ ] **Step 11.1: 起草 doc 2**

按 spec §5.3 的结构写。每条 P0/P1/P2 含：问题、位置、根因、方案（带伪代码或配置示例）、工作量、验收、依赖。

P0 列表（约 8-12 项）：
- HTTPS / Let's Encrypt 接入
- JWT secret 外部化（env / docker secret）
- DB / MinIO / Redis 密码外部化与强化
- CORS 白名单
- Nginx 基础限流
- AI 错误处理升级
- RestTemplate 加 timeout
- 关键 endpoint 鉴权审查
- actuator 暴露面收紧

P1 列表（约 6-10 项）：
- 监控栈（Prometheus + Grafana + Loki）
- 数据库备份脚本 + 测试恢复
- AI Provider 抽象层（Qwen/GLM 适配）
- Prompt 缓存层
- 数据库连接池调优
- Healthcheck + restart policy
- Docker 资源限制
- Nginx 安全 header

P2 列表（约 6-10 项）：
- 测试覆盖补齐（Auth/Knowledge/Stats/Study）
- 代码质量（去掉 unchecked 警告）
- PWA 完整性
- API 分页
- N+1 优化

预计 3000-4000 字。

- [ ] **Step 11.2: 提交 doc 2**

Run：
```bash
git add docs/audit/02-optimization-roadmap.md
git -c user.email=audit@local -c user.name=Claude commit -m "docs(audit): add 02-optimization-roadmap"
```

---

## Task 12: 写 doc 3 — 生产部署方案

**Files:**
- Create: `docs/audit/03-production-deployment.md`

- [ ] **Step 12.1: 起草 doc 3**

按 spec §5.4 的结构写。

关键内容：
1. 推荐架构图（mermaid，单 VPS 4C8G）
2. **`docker-compose.prod.yml` 增量改动清单**（基于现有 docker-compose.yml）：
   - 完整的 prod compose 草稿（healthcheck / resource limits / restart policy / env_file / logging）
3. `.env.prod.example` 模板
4. Nginx 生产配置完整草稿（HTTPS + Let's Encrypt + 安全 header + 限流 + gzip）
5. PostgreSQL 调优参数（`postgresql.conf` 关键项）
6. 备份脚本（pg_dump + MinIO sync）
7. 监控栈接入（同机部署 Prometheus + Grafana + Loki）
8. CI/CD 扩展建议（基于现有 GitHub Actions 加部署 job）
9. 容量预估表（10K 注册 / 1.5K DAU / 100 并发）+ 扩容路径
10. 月度成本估算（阿里云 / 腾讯云）

预计 4000-5000 字。

- [ ] **Step 12.2: 提交 doc 3**

Run：
```bash
git add docs/audit/03-production-deployment.md
git -c user.email=audit@local -c user.name=Claude commit -m "docs(audit): add 03-production-deployment"
```

---

## Task 13: 写 doc 4 — 国产 LLM 适配方案

**Files:**
- Create: `docs/audit/04-llm-adapter-cn.md`

- [ ] **Step 13.1: 起草 doc 4**

按 spec §5.5 的结构写。

关键内容：

**Part A — DeepSeek 快通道（0 代码改动）：**
```env
# ai-service/.env.production
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
OPENAI_BASE_URL=https://api.deepseek.com/v1
OPENAI_MODEL=deepseek-chat
```

**Part B — 正式 Provider 抽象层设计：**

Python pseudo-code：
```python
# ai-service/app/services/llm/base.py
from abc import ABC, abstractmethod
from typing import Optional

class LLMProvider(ABC):
    @abstractmethod
    async def chat(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
    ) -> str:
        ...

# ai-service/app/services/llm/openai_compat.py
class OpenAICompatProvider(LLMProvider):
    """适用于 OpenAI / DeepSeek / Moonshot / Together 等 OpenAI 兼容 API"""
    def __init__(self, api_key, base_url, model):
        self.client = AsyncOpenAI(api_key=api_key, base_url=base_url)
        self.model = model

    async def chat(self, prompt, system_prompt=None, temperature=0.7):
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        resp = await self.client.chat.completions.create(
            model=self.model, messages=messages, temperature=temperature
        )
        return resp.choices[0].message.content or ""

# ai-service/app/services/llm/qwen.py
class QwenProvider(LLMProvider):
    """通义千问 DashScope SDK"""
    # ...

# ai-service/app/services/llm/glm.py
class GLMProvider(LLMProvider):
    """智谱 GLM ZhipuAI SDK"""
    # ...

# 工厂
def get_provider(settings: Settings) -> LLMProvider:
    p = settings.llm_provider
    if p in ("openai", "deepseek", "moonshot"):
        return OpenAICompatProvider(...)
    elif p == "qwen":
        return QwenProvider(...)
    elif p == "glm":
        return GLMProvider(...)
    raise ValueError(f"未知 provider: {p}")
```

**Part C — 三家对比表：**
| 维度 | DeepSeek | 通义千问 | 智谱 GLM-4 |
|---|---|---|---|
| OpenAI 兼容 | ✅ 完全 | ⚠️ 部分（DashScope 自有 SDK） | ⚠️ 部分（ZhipuAI 自有 SDK） |
| 上下文长度 | 128K | 1M（Long） | 128K |
| 价格/M tokens（输入） | ~¥1 | ~¥4 | ~¥5 |
| 价格/M tokens（输出） | ~¥2 | ~¥12 | ~¥10 |
| 推荐用途 | 主用（出题/解释） | 长 PDF 解析备用 | 备用 |

**Part D — Prompt 缓存策略：**
- 应用层：`cache_key = sha256(model + system + prompt)` → Redis（TTL 7 天）
- 离线预生成：74 个核心知识点 × {解释, 5 道选择题, 3 道简答} = 约 1000 条预生成入 PostgreSQL；用户调用时优先查 DB

**Part E — 限流与配额：**
- 用户级：每天 100 次 AI 请求（free），每月 30K tokens
- 模型级：QPS 限制（DeepSeek 60 RPM / Tier1）

**Part F — 成本估算（10K 注册）：**
- 假设 30% 月活，活跃用户每天 10 次 AI 请求，平均每次 1K tokens（输入）+ 500 tokens（输出）
- 月度调用：3000 × 30 × 10 = 90 万次；月度 tokens：900M 输入 + 450M 输出
- DeepSeek 月成本：900 × 1 + 450 × 2 = ¥1800
- 命中 50% 缓存后：¥900 / 月

预计 2000-3000 字。

- [ ] **Step 13.2: 提交 doc 4**

Run：
```bash
git add docs/audit/04-llm-adapter-cn.md
git -c user.email=audit@local -c user.name=Claude commit -m "docs(audit): add 04-llm-adapter-cn"
```

---

## Task 14: 写 doc 0 — 执行摘要

**Files:**
- Create: `docs/audit/00-overview.md`

- [ ] **Step 14.1: 起草 doc 0**

按 spec §5.1 的结构写。

关键内容：
1. **项目当前能力综述**（一段话）：基本功能闭环已完成（知识图谱 + SM-2 + Quiz + 笔记 + 资料导入 + Stats + CI + 测试），距上线主要差三件事（HTTPS / Secret 外部化 / 限流）。
2. **Top 5 上线前必修风险**（每条 1-2 句）：
   - HTTPS 缺失
   - JWT secret 硬编码
   - 数据库与对象存储密码弱且明文
   - 无 API 限流（恶意脚本可耗尽 AI 配额）
   - CORS 策略未审查（如过宽则可被跨站 token 窃取）
3. **3 阶段路径**：
   - M1（已完成本次审查）→ 本地跑通 + 6 份审查文档
   - M2（上线候选，1-2 周）→ 修完 P0
   - M3（迭代优化，持续）→ 修 P1/P2 + 真实负载测试
4. **6 份文档导航**（每条一行，链到对应文件）
5. **建议的下一步会话**：用户决定要不要进入"按路线图实际改代码"的实施阶段（独立会话）

预计 500-800 字。

- [ ] **Step 14.2: 提交 doc 0**

Run：
```bash
git add docs/audit/00-overview.md
git -c user.email=audit@local -c user.name=Claude commit -m "docs(audit): add 00-overview executive summary"
```

---

## Task 15: 最终汇总与清理

**Files:** 无文件改动（除可能的清理）

- [ ] **Step 15.1: 验证 6 份文档全部存在且非空**

Run：
```bash
ls -la /home/ygwang/11408study/docs/audit/
wc -l /home/ygwang/11408study/docs/audit/*.md
```

Expected: 6 个文件，每个文件至少 30 行。

- [ ] **Step 15.2: 验证 git 历史完整**

Run：
```bash
cd /home/ygwang/11408study && git log --oneline -10
```

Expected: 看到本会话的所有 audit 提交。

- [ ] **Step 15.3: 关停所有审查容器（可选清理）**

Run（询问用户后再执行）：
```bash
# 询问后再跑
# docker compose down  # 停止所有服务但保留 volume
# docker start clickhouse-recovered  # 恢复 ClickHouse
```

- [ ] **Step 15.4: 给用户最终摘要**

向用户汇报：
- 6 份文档的路径与字数
- 本地验证最终状态（哪些跑通了）
- Top 5 风险（与 doc 0 一致）
- 推荐的下一步会话主题（如"按路线图修 P0"）

---

## Self-Review

**1. Spec 覆盖**：
- spec §5.1 doc 0 → Task 14 ✓
- spec §5.2 doc 1 → Task 7-10 ✓
- spec §5.3 doc 2 → Task 11 ✓
- spec §5.4 doc 3 → Task 12 ✓
- spec §5.5 doc 4 → Task 13 ✓
- spec §5.6 doc 5 → Task 1-6 ✓
- spec §3 工作流 → Task 顺序 ✓
- spec §6.1 风险（端口冲突）→ Task 1 处理 ✓
- spec §7 验收 → Task 15 验证 ✓

**2. Placeholder 扫描**：搜过没有 TBD/TODO/implement later。所有命令、路径、文件名都是实际可执行的。

**3. 类型一致性**：
- doc 编号 0/1/2/3/4/5 全程一致
- 笔记文件统一为 `/tmp/audit-notes.md`
- 工作目录统一 `/home/ygwang/11408study`
- git author 统一 `audit@local / Claude`

**已知边界：** 本计划是审查 + 文档型，TDD 不适用；"frequent commit" 通过每个 doc 完成时单独提交实现。

---

## 执行注意事项

1. **不要乱改代码** — 只在 Step 1.4、3.1、5.1 三处允许（端口/pom/Node 版本）的 blocker 修复，且必须单独提交并明确说明原因
2. **每个 Task 完成后再开始下一个** — 验证产出后再 mark complete
3. **遇到非阻塞问题写入审查报告，不在跑通流程中处理**
4. **任何 docker build 超时（>15 分钟）应中断并记录** — 不要无限等
5. **若用户随时打断要求改方向，停下并对齐**
