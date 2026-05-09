# 02 — 优化路线图

**审查日期：** 2026-05-09
**项目 commit 基线：** `0f08c91 ds version`
**目标场景：** 10K 总注册用户（DAU 1-2K，峰值并发约 100，单 VPS 4C8G）
**前置文档：** `01-architecture-audit.md`（94 条问题、Top 5 真 bug）、`05-local-validation.md`
**优先级定义：**
- **P0** — 上线必修（安全致命、影响功能、影响数据完整性）
- **P1** — 上线后第一个迭代（性能、可观测、可扩展）
- **P2** — 持续优化（技术债、UX、PWA 完整性）

---

## 1. 阶段总览

| 阶段 | 范围 | 估工作量 | 推荐周期 |
|---|---|---|---|
| M1 已完成 | 本地跑通 + 6 份审查文档 | （本审查 30+ 人时） | 已完成 |
| M2 上线候选 | 修完 P0（约 13 项） | 80-120 人时 | 1-2 周 |
| M3 正式上线 | 修完 P1（约 12 项） | 100-160 人时 | 1-2 周 |
| M4 持续迭代 | 修 P2 + 真实负载测试 + 备份演练 | 持续 | 季度迭代 |

**总目标：** 4-6 周内完成上线候选 + 正式上线，进入 M4 后逐步消化 P2 与基于真实流量的二次优化。

执行原则：
1. **先功能 bug、后安全加固、再监控扩展**——P0 中的 P0-01/02/04/05 是"已上线即坏"的真 bug，应**最先做**且**必须配 unit test**。
2. **每条任务都要可验收**：修完跑一条 curl / SQL / e2e 即可证明，否则视同未完成。
3. **小步合并**：P0 至少拆 4-5 个 PR（功能 bug、Secret/HTTPS、actuator/CORS、AI timeout、前端 token），不要堆成一个大改。

---

## 2. P0 任务清单（上线必修）

> 共 13 条，约 41 人时（不含每条的 review/合并周期）。每条结构：问题 / 位置 / 根因 / 方案 / 工作量 / 验收 / 依赖。
> 顺序按"先 4 条真功能 bug → 安全加固 → 部署面"排列，便于切 PR。

### [P0-01] 修 JWT userId claim 缺失
- **问题：** `AuthService` 注册/登录/refresh 三处用不带 userId 的 `generateToken` 重载，所有 token 缺 `userId` claim；下游 `NoteController` 拿到 null userId，list 全表扫返 0、create 直接 NPE → 500。
- **位置：** `backend/src/main/java/.../service/AuthService.java:45,62,81-82`；`security/JwtTokenProvider.java:35-58`。
- **根因：** AuthService 选错重载；带 userId 的 `generateToken(String, Long)` 重载从未被调用。
- **方案：** 三处改 `generateToken(user.getUsername(), user.getId())`；登录路径先 `userRepository.findByUsername(...)` 再生成；不带 userId 的重载标 `@Deprecated` 或删除防回归。
- **工作量：** 2 小时（含 AuthServiceTest 4 条用例）。
- **验收：** 注册后 decode access token 可见 `userId` claim；`GET /api/notes` 不再 500。
- **依赖：** 无。

### [P0-02] 修拓扑排序大小写不匹配
- **问题：** `StudyPathService` 用 `equals("prerequisite")` 比较，V2 seed 全部为大写 `'PREREQUISITE'`，**74 条前置依赖边全部识别失败**，学习路径退化为按 nodeId 排序，"已上线即坏"。
- **位置：** `backend/src/main/java/.../service/StudyPathService.java:49`；`backend/src/main/resources/db/migration/V2__seed_408_knowledge.sql:99-176`。
- **根因：** 大小写约定未统一，缺 unit test。
- **方案：** 改 `equalsIgnoreCase("prerequisite")` 或抽常量 `RelationType.PREREQUISITE`；加 `StudyPathServiceTest#topoSortRespectsPrereqEdges`，用真实种子断言"操作系统先于网络"等已知边正确出现在 sortedPath 中。
- **工作量：** 3 小时（含 unit test）。
- **验收：** `GET /api/study-path?subjectId=4` 返回顺序与 V2 seed 中 `PREREQUISITE` 边一致。
- **依赖：** 无。

### [P0-03] ImportController 加鉴权 + Material 归属校验
- **问题：** 整个 `ImportController` 无鉴权，任何登录用户可对任意 materialId 触发 `parsePdf`、对任意文本 `extract`，刷 LLM 费用零成本，他人 PDF 解析内容可被任意读取。
- **位置：** `backend/src/main/java/.../controller/ImportController.java:29-62, 65-91`。
- **根因：** controller 漏写 `getUserId(request)`，service 漏写归属校验。
- **方案：** 入口加 `Long userId = getUserId(request)`；`materialRepository.findById(id)` 后校验 `material.getUploaderId().equals(userId)`，否则抛 `BusinessException(FORBIDDEN, "无权访问该资料")`；`extract` 同样要鉴权 + 限制 `text.length() <= 100_000`。
- **工作量：** 3 小时（含 IT 测试 2 条：自己/他人 materialId）。
- **验收：** 用户 A 上传 material=10 后，用户 B 调 `parse-pdf/10` 返回 403；A 调返回 200。
- **依赖：** P0-01（鉴权链需 userId claim 可用）。

### [P0-04] 修 SM-2 算法 + 加 interval_days 字段 + @Version 乐观锁
- **问题：** SM-2 公式错（用 `(repetitionCount-1)*EF` 而非 `prevInterval*EF`），间隔无法指数增长；并发打分 lost update。
- **位置：** `service/SpacedRepetitionService.java:36`；`entity/StudyProgress.java`；`db/migration/V1__init.sql:75-89`。
- **根因：** 实现照抄 LeetCode 不读论文，entity 无字段存上次 interval；`processFeedback` 缺 `@Transactional` + `@Version`。
- **方案：**
  1. Flyway V4 加 `ALTER TABLE study_progress ADD COLUMN interval_days INTEGER NOT NULL DEFAULT 1, ADD COLUMN version BIGINT NOT NULL DEFAULT 0;` 与回填脚本；
  2. entity 加 `intervalDays` + `@Version private Long version;`；
  3. 算法改 `int prev = Math.max(1, prog.getIntervalDays()); int next = repetitionCount<=1 ? 1 : repetitionCount==2 ? 6 : (int)Math.round(prev*ef);`；
  4. 加 `@Transactional`；
  5. `SpacedRepetitionServiceTest` 覆盖 rating=5×10 指数曲线、rating=0 重置、并发 OptimisticLockException。
- **工作量：** 8 小时。
- **验收：** test 通过；连打 5 分 10 次 next_review 间隔接近论文曲线（约 1, 6, 15, 38, 95 天 ...）。
- **依赖：** 无。

### [P0-05] 前端导入向导加 Authorization header
- **问题：** `materials/import/[id]/page.tsx` 的 `postJson` 是裸 `fetch`，未带 token；目前能跑只是因 P0-03 未修，互相掩盖。
- **位置：** `frontend/src/app/materials/import/[id]/page.tsx:40-60`（postJson）、`:50`（调用点）。
- **根因：** 当时图省事没用 `apiClient`。
- **方案：** `postJson` 改用项目现成的 `apiClient.post(...)`，或在 fetch 前 `headers['Authorization'] = 'Bearer ' + getToken()`；同步把 node 创建路径也走 `apiClient`。
- **工作量：** 1 小时（含 Playwright 一条断言）。
- **验收：** P0-03 修复后导入流程仍能正常完成；e2e 通过。
- **依赖：** P0-03（与之同 PR，避免互相掩盖期间任意一个先 merge 把流程打断）。

### [P0-06] AiClientService 加 timeout
- **问题：** `RestTemplate` 默认无超时，AI 服务卡死时所有 Tomcat 工作线程级联挂起，整个 backend 不可用。
- **位置：** `backend/src/main/java/.../service/AiClientService.java:21`。
- **根因：** 直接 `new RestTemplate()`，未走 `RestTemplateBuilder`。
- **方案：** `@Bean RestTemplate aiRestTemplate(RestTemplateBuilder b)` 配 `setConnectTimeout(5s).setReadTimeout(30s)`；构造注入；catch 区分 `ResourceAccessException`（超时）与 `HttpStatusCodeException`（4xx/5xx）分别返回不同 error message。
- **工作量：** 4 小时（含 mock 超时测试）。
- **验收：** mock AI sleep 60s，backend 30s 内返回 `{"error":"AI服务超时"}`，主线程不被卡。
- **依赖：** 无。

### [P0-07] JWT secret 外部化
- **问题：** `application.yml:43` JWT secret base64 硬编码且 git 公开，任何人可签发任意身份 token。
- **位置：** `backend/src/main/resources/application.yml:43`；`application-prod.yml`（缺覆盖）。
- **根因：** 早期占位未替换。
- **方案：** 改 `app.jwt.secret: ${JWT_SECRET:change-me-in-prod}`；`openssl rand -base64 64` 生成新值；`docker-compose.yml` 加 `env_file: .env.prod`；`.env.prod` 入 `.gitignore`，提供 `.env.prod.example`；`@PostConstruct` 检测 secret 长度 < 64 抛异常。
- **工作量：** 3 小时。
- **验收：** `git grep -n "secure-key-for-study11408"` 无结果；不设 JWT_SECRET 启动 fail；旧 token 全失效。
- **依赖：** 与 P0-08 一同发版。

### [P0-08] DB / MinIO / Redis 密码外部化与端口收回
- **问题：** `study11408_dev` / `minioadmin123` git 公开；Redis 无密码；所有服务端口直暴宿主。
- **位置：** `docker-compose.yml:7,24,40,45,9,16,26-27,49,63`；`application.yml:8-11,48-50`。
- **根因：** 同 P0-07，开发期占位。
- **方案：** 全部改 `${POSTGRES_PASSWORD}` / `${MINIO_ROOT_PASSWORD}` / `${REDIS_PASSWORD}`；各自 `openssl rand -base64 32`；Redis 启动加 `--requirepass`；compose 把 5432/6379/9000/9001/8080/8000/3000 全部从 `ports:` 改 `expose:`，仅 nginx 留 `ports: ["80:80","443:443"]`。
- **工作量：** 4 小时。
- **验收：** `nmap -p 5432,6379,9000 <宿主IP>` 全部 closed；服务内网联通正常。
- **依赖：** 与 P0-07 同 PR。

### [P0-09] HTTPS / Let's Encrypt 接入
- **问题：** `nginx.conf:14` 仅 `listen 80;`，无证书；明文传 token、密码。
- **位置：** `nginx/nginx.conf:14`。
- **根因：** 未做生产 nginx 模板。
- **方案：** 准备 `nginx/nginx.prod.conf`：`listen 443 ssl http2`，`ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem`，`ssl_protocols TLSv1.2 TLSv1.3`；80 端口 `return 301 https://...`；compose 加 `certbot` sidecar，初次 `certbot certonly --webroot`；crontab `0 3 * * *` 自动 renew + nginx reload。
- **工作量：** 6 小时（含域名解析、首次签发、自动续期）。
- **验收：** `curl -I https://${DOMAIN}` 返回 200；SSL Labs 评级 ≥ A；80 端口 301 跳 443。
- **依赖：** 域名 DNS 已指向 VPS；80/443 防火墙开放。

### [P0-10] CORS 白名单
- **问题：** 后端 `CorsConfig.setAllowedOriginPatterns("*")` + `allowCredentials(true)`；ai-service `allow_origins=["*"]` 同毛病。
- **位置：** `backend/src/main/java/.../config/CorsConfig.java:17,20`；`ai-service/app/main.py:41-44`。
- **根因：** 开发期开放，未上线收紧。
- **方案：** `CorsConfig` 改 `setAllowedOrigins(List.of("https://${DOMAIN}"))`，域名抽 `app.cors.allowed-origins` 配置项 + env 注入；ai-service 同步从 env 读取。
- **工作量：** 2 小时。
- **验收：** 跨域从 `attacker.example.com` 请求被浏览器拦截；从 `${DOMAIN}` 正常。
- **依赖：** P0-09。

### [P0-11] 收紧 actuator 暴露
- **问题：** `SecurityConfig:37` actuator 全开 + `permitAll`，任何人可读 `/actuator/env`（含 DB/JWT secret）、拖 `/actuator/heapdump`。
- **位置：** `backend/src/main/java/.../config/SecurityConfig.java:37`；`application.yml:30-35`。
- **根因：** 未细分端点。
- **方案：** `application-prod.yml` 加 `management.endpoints.web.exposure.include: health,info,prometheus`；`SecurityConfig` 改 `requestMatchers("/actuator/health","/actuator/info").permitAll(); requestMatchers("/actuator/**").hasRole("ADMIN");`；加 `info.app.version` 便于运维识别。
- **工作量：** 2 小时。
- **验收：** `/actuator/health` 200；`/actuator/env` 401。
- **依赖：** 无。

### [P0-12] 关闭 Swagger / api-docs 在生产暴露
- **问题：** `nginx.conf:34,39` `/swagger-ui/` 与 `/v3/api-docs` 生产对外暴露 API 形状。
- **位置：** `nginx/nginx.conf:34,39`；`application.yml`（springdoc 配置）。
- **根因：** 没区分 dev/prod nginx。
- **方案：** `nginx.prod.conf` 删除两个 location（或加 IP 白名单 `allow 10.0.0.0/8; deny all;`）；`application-prod.yml` 加 `springdoc.api-docs.enabled: false; springdoc.swagger-ui.enabled: false` 从根本关闭。
- **工作量：** 1 小时。
- **验收：** `curl https://${DOMAIN}/swagger-ui/index.html` 返回 404 或 403。
- **依赖：** P0-09。

### [P0-13] AI 服务启动校验 LLM key 配置
- **问题：** `ai-service/app/config.py` API key 默认空串，启动正常，第一次调用走满 3 次重试 + 14 秒退避才告诉用户"key 未配置"（05 §4.5 实测）。
- **位置：** `ai-service/app/config.py:8,12`；`ai-service/app/main.py`（startup hook）。
- **根因：** 没在 startup 校验。
- **方案：** `main.py` 加 `@app.on_event("startup")`：根据 `settings.llm_provider` 校验对应 key 非空，否则 `raise RuntimeError`；docker-compose ai-service 加 `env_file: .env.prod` 注入 key。
- **工作量：** 2 小时。
- **验收：** 不设 key 启动 ai-service 容器立即 Exited，日志含明确报错。
- **依赖：** 无。

**P0 小计：** 13 条，约 41 小时（含测试）。重点不仅是修 bug，更是把 AuthService/StudyPath/SpacedRepetition/AiClient 核心 unit test 兜起来，避免下次回归。

---

## 3. P1 任务清单（上线后第一迭代）

> 共 12 条，约 98 人时。在 P0 上线 1-2 周内完成，目标是把"能跑"提升为"能监控、能扩展、能省钱"。

### [P1-01] 接入监控栈（Prometheus + Grafana + Loki + Promtail）
- **问题：** 全栈 0 metrics、0 trace、0 集中日志，生产出问题只能 `docker logs` 翻。
- **位置：** 新增 `monitoring/` 目录与 compose 片段；`backend/pom.xml` 加 `micrometer-registry-prometheus`；`application-prod.yml` 暴露 `/actuator/prometheus`（受 ADMIN 保护，Prometheus 内网拉）。
- **方案：** 同机起 Prometheus（scrape 30s，retention 15d）+ Grafana（默认 dashboard：JVM、HTTP RT、AI 调用 RT/QPS/错误率）+ Loki + Promtail（采集所有容器 stdout）。
- **工作量：** 16 小时（含 dashboard 调试）。
- **验收：** Grafana 有 backend JVM heap、`/api/auth/login` p95 RT、AI 错误率三块面板；Loki 可按 traceId 检索。
- **依赖：** P0-11（避免 expose 监控端口又踩 actuator 暴露）。

### [P1-02] 数据库备份脚本 + 恢复演练
- **问题：** 无任何备份，DB 损坏即丢全部用户数据；MinIO 资料同样。
- **位置：** 新增 `scripts/backup.sh` + `scripts/restore.sh` + crontab。
- **方案：** `pg_dump -Fc` 每日凌晨 2:15 入 `/backup/pg_$(date +%F).dump`，保留 14 天；MinIO 用 `mc mirror` 同步到第二台机器或对象存储；写 `restore.sh` 并**至少做一次完整恢复演练**入 release-checklist。
- **工作量：** 8 小时。
- **验收：** 第一次手工跑 backup 产出 .dump；restore 在测试环境恢复后 `psql` 能查到全部用户。
- **依赖：** P0-08。

### [P1-03] AI Provider 抽象层（Qwen/GLM 适配）
- **问题：** 当前仅 OpenAI/Anthropic 两分支硬编码，无法快速切 DeepSeek/Qwen/GLM；账号一封整站 AI 失能。
- **位置：** `ai-service/app/services/llm_service.py`；新增 `ai-service/app/services/providers/`。
- **方案：** 抽象 `class LLMProvider(ABC)`，4 个实现（OpenAI、DeepSeek、Qwen DashScope、GLM ZhipuAI）；`LLM_PROVIDER` 改为工厂选择。**详细设计见 doc 4 `04-llm-adapter-cn.md`**。
- **工作量：** 16 小时（4 provider × 测试）。
- **验收：** `LLM_PROVIDER=deepseek` 调通 `/ai/extract`；`qwen` 同样调通；mock provider e2e 通过。
- **依赖：** P0-13；与 doc 4 强相关。

### [P1-04] Prompt 缓存层（Redis）
- **问题：** 同一段 prompt 反复调 LLM 全部重算；10K 用户场景 80% 是重复 prompt（408 知识点固定），账单大头。
- **位置：** `ai-service/app/services/llm_service.py`；新增 `cache.py`。
- **方案：** `sha256(prompt + model + temperature)` 作 key，结果存 Redis TTL 7 天；命中率走 Prometheus 计数；`?no_cache=true` 强制绕过；缓存仅对 `temperature=0` 启用。
- **工作量：** 8 小时。
- **验收：** 同 prompt 第二次调用 RT < 50ms；`llm_cache_hit_total{result="hit"}` > 0。
- **依赖：** P0-08。

### [P1-05] 数据库连接池调优 + 索引补齐
- **问题：** Hikari `max=20` 偏小；`wrong_answers (user_id, resolved)`、`notes (user_id, node_id)`、`study_progress (user_id, next_review)` 缺复合索引。
- **位置：** `application.yml:13-14`；新增 V5 迁移 `V5__compound_indexes.sql`。
- **方案：** `application-prod.yml` 设 `hikari.maximum-pool-size: 30, minimum-idle: 5, leak-detection-threshold: 60000`；V5 加 3 条复合索引。
- **工作量：** 6 小时（含 EXPLAIN ANALYZE 验证）。
- **验收：** `EXPLAIN ANALYZE SELECT * FROM wrong_answers WHERE user_id=1 AND resolved=false;` 走 Index Scan。
- **依赖：** 无。

### [P1-06] Healthcheck + restart policy + 资源限制
- **问题：** compose 全文件无 healthcheck、无 restart、无资源 limits，ai-service 跑 LLM 可吃满内存把整机拖垮。
- **位置：** `docker-compose.yml`（统一加 healthcheck/restart/deploy.resources）。
- **方案：** 每服务加 healthcheck（postgres `pg_isready`、redis `ping`、minio `mc ready`、backend `/actuator/health`、ai-service `/ai/health`）；统一 `restart: unless-stopped`；按 4C8G 分配：postgres 2G/1C、redis 512M/0.5C、minio 1G/0.5C、backend 2G/1C、ai-service 2G/1C、frontend 512M/0.5C、nginx 256M/0.25C。
- **工作量：** 6 小时。
- **验收：** `docker compose ps` 全部 Healthy；kill backend 30s 内自动重启。
- **依赖：** P0-08（一并改 compose）。

### [P1-07] Docker 日志限流
- **问题：** 全文件无 logging driver 限制，日志会撑爆磁盘。
- **位置：** `docker-compose.yml`（顶层 `x-logging` anchor + 每服务引用）。
- **方案：** `x-logging: &default-logging { driver: json-file, options: { max-size: "50m", max-file: "5" } }`；每个 service 引用。
- **工作量：** 2 小时。
- **验收：** `docker inspect backend | jq '.[0].HostConfig.LogConfig'` 显示 max-size=50m。
- **依赖：** 与 P1-06 同 PR。

### [P1-08] Nginx 安全 header
- **问题：** 无 HSTS / CSP / X-Frame-Options / X-Content-Type-Options / Referrer-Policy 等任何安全头。
- **位置：** `nginx/nginx.prod.conf` server 块顶部。
- **方案：** 加 `Strict-Transport-Security "max-age=31536000; includeSubDomains" always;` `X-Content-Type-Options "nosniff"` `X-Frame-Options "DENY"` `Referrer-Policy "strict-origin-when-cross-origin"` `Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https://${DOMAIN};"`。
- **工作量：** 4 小时（含 CSP 调试，前端可能需改 inline style）。
- **验收：** `securityheaders.com` 评级 ≥ A。
- **依赖：** P0-09。

### [P1-09] Nginx 限流 + 用户级 AI 配额
- **问题：** 登录、注册、AI 调用、PDF 导入零限流；暴力破解和刷 LLM 费用零防护。
- **位置：** `nginx/nginx.prod.conf` http 块；后端新增 `service/QuotaService`。
- **方案：** nginx `limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;` 在 `/api/auth/` 用 `limit_req zone=login burst=10 nodelay`；AI `rate=30r/m`；后端 Bucket4j 实现"每用户每天 100 次 AI 调用"配额表 `ai_quota_daily(user_id, date, count)`，超限 429。
- **工作量：** 12 小时。
- **验收：** 1 分钟内 `/api/auth/login` 50 次后 429；同用户当日 AI 第 101 次 429。
- **依赖：** P0-09。

### [P1-10] AI 服务 multi-worker
- **问题：** `uvicorn --reload` 单 worker，CPU 密集 PyMuPDF 解析阻塞所有并发。
- **位置：** `ai-service/Dockerfile:14`。
- **方案：** 改 `gunicorn -k uvicorn.workers.UvicornWorker -w ${UVICORN_WORKERS:-2} -b 0.0.0.0:8000 app.main:app --timeout 120`；同步加 `USER appuser` 与 `HEALTHCHECK CMD curl -f http://localhost:8000/ai/health`。
- **工作量：** 4 小时。
- **验收：** `ps -ef | grep gunicorn` 看到 2 个 worker；并发 10 个 PDF 解析 RT 不再线性放大。
- **依赖：** 无。

### [P1-11] N+1 查询批量优化
- **问题：** StatsService 4 处、NoteService、StudyPathService 多处通过 LAZY 三层关联触发循环 SQL，DAU 上千后 DB 会被打满。
- **位置：** `service/StatsService.java:124-145, 191-219`、`NoteService.java:36, 86-101`、`StudyPathService.java:81-88`。
- **方案：** 关键查询改 `JOIN FETCH`（`SELECT n FROM Note n JOIN FETCH n.node nn JOIN FETCH nn.topic t JOIN FETCH t.subject WHERE n.userId=:uid`）；`subjectProgress` 改 `GROUP BY` 一次拿全；`getWeaknessAnalysis` 改 `findAllById(ids)`。
- **工作量：** 10 小时（含 EXPLAIN 验证、回归测试）。
- **验收：** `/notes` 列表请求只产 1 条 SQL；StatsService overview 接口 SQL 数从 ~15 降到 ≤ 5。
- **依赖：** P1-01（用 `hibernate_query_count` 量化）。

### [P1-12] 关键路径 @Cacheable
- **问题：** `spring.cache.type=redis` 已配但代码无任何缓存注解；subjects、stats overview、graph 这种读多写少接口每次直查 DB。
- **位置：** `SubjectService`、`StatsService.getOverviewV2`、`KnowledgeGraphService`、`StudyPathService`。
- **方案：** 加 `@Cacheable(value="subjects", key="'all'")`（TTL 1h）、`@Cacheable(value="stats:overview", key="#userId")`（TTL 5min）、`@Cacheable(value="graph", key="#subjectId")`（TTL 30min）；写操作处加 `@CacheEvict`；`spring.cache.redis.time-to-live: 300000`。
- **工作量：** 6 小时。
- **验收：** Redis `KEYS subjects::*` 看到 entry；第二次调 `/api/subjects` RT < 10ms（首次 ~100ms）。
- **依赖：** P0-08。

**P1 小计：** 12 条，约 98 小时。完成后系统具备：可监控、可备份、可省钱（缓存 + 国产 LLM 适配）、不易被打挂（限流 + 配额）。

---

## 4. P2 任务清单（持续优化）

> 共 10 条，约 103 人时。M3 上线后按业务节奏分批做，不阻塞上线。

### [P2-01] 测试覆盖补齐
- **问题：** 仅 3 个 IT 类，AuthService/SpacedRepetition/StudyPath/StatsService 全无单元测试，正是 4 条真 bug 没被自动捕获的根因。
- **方案：** P0 修 bug 时已带 4 条 test；P2 补全 KnowledgeGraph、Subject、Quiz、Material 单元测试，目标 service 层覆盖率 ≥ 70%；前端 Playwright 扩展覆盖图谱拖拽/学习路径/测验全流程；CI 加覆盖率门禁。
- **工作量：** 24 小时。
- **验收：** `mvn test` service 包行覆盖 ≥ 70%；CI 门禁不达标失败。
- **依赖：** P0 完成。

### [P2-02] 去掉所有 unchecked cast，引入 AiResult<T>
- **问题：** `AiClientService` 5 处 raw `ResponseEntity<Map>`、`ImportController` 3 处 `(List<Map<String,Object>>) raw.get("chunks")`，AI 返回结构变化即 ClassCastException 被吃掉成"系统内部错误"。
- **方案：** `class AiResult<T> { boolean success; T data; String errorCode; String errorMessage; }`；5 个方法返回强类型 `AiResult<ExtractData>` / `AiResult<QuizData>`；调用方 `if (result.isSuccess()) ...`。
- **工作量：** 8 小时。
- **验收：** `mvn compile` 0 unchecked warning；AI 错构 JSON 时调用方拿到具体错误码而非 500。
- **依赖：** 无。

### [P2-03] PWA 完整性
- **问题：** `manifest.webmanifest:9` `icons: []` 空，安装提示不弹；无 service worker。
- **方案：** 设计 192/512/maskable 三档图标；接入 `next-pwa`；离线策略：静态资源缓存优先、API 网络优先 + 失败回退缓存。
- **工作量：** 12 小时（含图标设计协作）。
- **验收：** Lighthouse PWA 评分 ≥ 90；离线 dashboard 显示缓存数据 + "离线中"提示。
- **依赖：** 无。

### [P2-04] API 分页
- **问题：** `/api/notes`、`/api/study-sessions` 全量返回，重度用户上万条 session 一次返完。
- **方案：** Spring `Pageable` 接入：`@PageableDefault(size=20, sort="createdAt") Pageable pageable`；前端列表改无限滚动或分页器。
- **工作量：** 10 小时。
- **验收：** `/api/notes?page=0&size=20` 返回 PageDTO；前端能加载更多。
- **依赖：** 无。

### [P2-05] 时区统一为 Asia/Shanghai
- **问题：** `LocalDate.now(ZoneId.systemDefault())` 跨时区部署算错"今天"；DB 全 TIMESTAMP 无时区。
- **方案：** 后端启动 `TimeZone.setDefault(TimeZone.getTimeZone("Asia/Shanghai"))`；`spring.jackson.time-zone: Asia/Shanghai`；新表用 TIMESTAMPTZ（V6 迁移），旧表分批转。
- **工作量：** 6 小时。
- **验收：** UTC 跑测试，"今天"始终是中国时区当天。
- **依赖：** P1-05。

### [P2-06] 拓扑排序加循环检测
- **问题：** `StudyPathService` 拓扑未检测循环，环内节点静默丢弃。
- **方案：** sortedPath.size() != nodes.size() 时抛 `BusinessException("知识图存在循环依赖：...")`，返回环节点列表；加 unit test。
- **工作量：** 3 小时。
- **验收：** 故意造环，接口返回 409 + 环节点列表。
- **依赖：** P0-02。

### [P2-07] Refresh token 类型校验 + 吊销机制
- **问题：** access token 可当 refresh 用；token 泄漏后无吊销手段。
- **方案：** 生成时加 `claim("type", "access"/"refresh")`；refreshToken 校验 type=refresh；Redis 维护 `revoked_token:<jti>` 黑名单 TTL=token 剩余有效期；登出/改密入黑名单；JwtAuthenticationFilter 校验黑名单。
- **工作量：** 10 小时。
- **验收：** access token 调 `/api/auth/refresh` 返回 401；登出后旧 token 调任何受保护接口 401。
- **依赖：** P1-04。

### [P2-08] 密码强度策略 + 登录失败锁
- **问题：** 密码仅 ≥6 长度；登录无失败计数。
- **方案：** `RegisterRequest.password` 加正则 `@Pattern("^(?=.*[A-Za-z])(?=.*\\d).{8,}$")`；登录失败计数存 Redis `login_fail:<username>` TTL 15min，5 次锁 30min。
- **工作量：** 6 小时。
- **验收：** 弱密码注册 400；连续 5 次错登第 6 次 429 + "账户已锁定"。
- **依赖：** P1-04。

### [P2-09] traceId 接入
- **问题：** 错误响应缺 traceId，用户报错无法反查日志；跨服务无法串联。
- **方案：** 自实现 `MdcFilter` 在请求入口生成 UUID 入 MDC，logback pattern 加 `[%X{traceId}]`；GlobalExceptionHandler 把 traceId 写入 response header `X-Trace-Id` 与 body `meta.traceId`；前端 axios 拦截器把 header 注入到 toast；ai-service 接收 `X-Trace-Id` 透传。
- **工作量：** 8 小时。
- **验收：** Loki 按 `traceId=abc-123` 拉出全链路日志；toast 显示编号。
- **依赖：** P1-01。

### [P2-10] frontend i18n 框架接入
- **问题：** 文案中文硬编码，无法做英文版或一键切换。
- **方案：** `next-intl`；中文文案抽 `messages/zh-CN.json`；预留 `en-US.json`；header 加语言切换按钮。
- **工作量：** 16 小时（量大但无技术风险）。
- **验收：** 切英文 UI 全部翻译；中文回切无回归。
- **依赖：** 无。

**P2 小计：** 10 条，约 103 小时，可分若干迭代消化。

---

## 5. 横切建议

### 5.1 国内构建环境标准化
本审查已在 `backend/.mvn/settings.xml`、`ai-service/Dockerfile`、`frontend/Dockerfile` 落实 Aliyun Maven mirror、PyPI Aliyun mirror、Node 20 升级（commit `1640fe2` / `0b1b4d7` / `1cfb913`），但仓库 README 未提，新贡献者首次构建仍可能踩坑。建议在 `docs/` 增加"开发环境搭建"小节，列出 JDK 17、Node 20.9+、Python 3.11、Docker compose v2、国内镜像配置说明，作为 P2 文档任务一并完成。

### 5.2 测试自动化扩展
现有 GitHub Actions CI 仅 `mvn -B compile` 与前端 `npm ci && npm run build`，没跑测试。M3 上线前应在 CI 加：
- 后端 `mvn test`（含 Testcontainers IT，已有 3 个类，P2 补到 ≥ 8 个）；
- 前端 `npm run test:e2e`（Playwright headless）；
- ai-service `pytest tests/`（mock LLM provider，P2 一并补）。
未通过测试不允许 merge 到 main。

### 5.3 文档化与发布检查清单
`docs/release-checklist.md` 已存在但简略。建议在 doc 3（部署方案）落地时同步更新，至少包含：
- P0 全部 13 条已修 + 单元测试通过；
- `.env.prod` 已配且不在 git 中；
- HTTPS 证书已签发且有效期 > 30 天；
- 备份脚本已跑过一次且恢复演练成功；
- 监控面板能看到三大核心指标（JVM、HTTP RT、AI 错误率）。

---

## 6. 风险与依赖图

关键依赖（建议按此顺序合 PR）：

```
[P0-01 JWT userId] ──┬─→ [P0-03 ImportController 鉴权]
                     │
[P0-02 拓扑排序] ────┤
                     │
[P0-04 SM-2]   ──────┤
                     │
[P0-05 前端 header]──┤ (与 P0-03 同 PR)
                     │
[P0-06 AI timeout]───┘

[P0-07 JWT secret] ─┬─→ 一起合 (Secret PR)
[P0-08 DB/MinIO]   ─┘

[P0-09 HTTPS]    ─┬─→ [P0-10 CORS] [P0-12 关 Swagger]
[P0-11 actuator]─┘    [P1-08 安全 header] [P1-09 限流]

[P0-13 AI key] → [P1-03 Provider 抽象] (与 doc 4 强相关)

[P1-01 监控] → [P1-11 N+1] (用指标量化效果)

[P1-04 Prompt 缓存] / [P1-12 @Cacheable] 依赖 [P0-08 Redis 密码]
```

风险提示：
- **P0-04 SM-2 涉及 schema 迁移与数据回填**：建议先在测试库跑一次 V4 迁移，看 `interval_days` 默认值 1 是否合理（已学过的卡片实际间隔可能远 > 1 天，需评估是否一次性按 `next_review - last_review` 回填）。
- **P0-07/08 Secret 轮换会让所有现存 token 失效**：发布前需在 LoginPage 加"系统升级，请重新登录"提示。
- **P0-09 HTTPS 依赖域名 DNS 与防火墙**：业务方/运维**提前 1 周准备**，不要等到上线日才申请。
- **P1-03 Provider 抽象**与 doc 4 强相关：建议 doc 4 先评审通过再开工，避免接口设计返工。

---

## 7. 总结

- **总条数**：P0 13 / P1 12 / P2 10，合计 35 条。
- **总工作量**：P0 约 41 小时、P1 约 98 小时、P2 约 103 小时，合计 242 小时（约 6-8 周一人全职，或 2-3 人并行 3-4 周）。
- **推荐顺序**：
  1. **第 1 周**：P0-01/02/04/05/06 + 配套 unit test（功能 bug 周）；
  2. **第 2 周**：P0-07/08/09/10/11/12/13（安全加固周）；
  3. **第 3 周**：M2 上线 + P1-01/02/06/07/10（监控、备份、容器治理）；
  4. **第 4 周**：P1-03/04/05/08/09/11/12（Provider、缓存、限流、性能）；
  5. **第 5-8 周**：M3 正式上线 + P2 按业务节奏分批。
- **不可妥协项**：13 条 P0 全数完成，且每条都跑过验收命令产出可见证据——参见 `superpowers:verification-before-completion` 准则，证据先于断言。

> 本文档与 `01-architecture-audit.md` 对应。下一步由 `03-production-deployment.md` 给出 P0/P1 配置项的可执行 docker-compose.prod.yml 与 nginx.prod.conf 模板，由 `04-llm-adapter-cn.md` 详细展开 P1-03/04 的 Provider 抽象与成本估算。
