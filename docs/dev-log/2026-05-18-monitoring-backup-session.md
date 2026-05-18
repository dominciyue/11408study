# 自主开发会话 — 2026-05-18 下午（监控 + 备份）

**起点 commit：** `8658770 feat(P2): WeakTopic 可点击跳学科页 + listGroupedByNode FETCH JOIN`
**目标：** P1-01 监控栈 + P1-02 备份脚本（audit roadmap 全套实施）
**用户约束：** 全套（Prometheus + Grafana + Loki + Promtail）；自主推进；归档记录

---

## 实施成果

### Phase 1-2：备份（commit `f5498e5`）
- `scripts/backup.sh` — pg_dump -Fc + 14 天滚动保留 + MinIO mc mirror（host 无 mc 时降级 docker cp）
- `scripts/restore.sh` — 支持 latest / TIMESTAMP / FILE；--target 演练；YES_OVERWRITE 二次确认防误炸；内置 6 表 count 烟测
- `scripts/install-backup-cron.sh` — 幂等注册 host cron `15 2 * * *`；--uninstall 卸载

**烟测**：pg dump 396K → restore 到 `test_study11408`：3 users / 4 subjects / 432 nodes / 2948 questions / 7 wrong_answers / 4 progress 全部回来 ✓

### Phase 3-7：监控栈（commit `86ac0a5`）
| 组件 | 端口 | 配置 |
|---|---|---|
| Prometheus | host 19091 (避 clash 19090) | scrape 30s / retention 15d / 3 jobs（backend + ai-service + 自监控） |
| Grafana | host 13000 | admin / admin（`GRAFANA_ADMIN_PASSWORD` env 可改）；自动 provision datasource + dashboard |
| Loki | host 13100 | filesystem 存储 15d；单实例 |
| Promtail | 容器内 | docker_sd_configs 自动发现；标签：container_name / stream / compose_service |

**Backend metrics 改动**：
- `pom.xml` + spring-boot-starter-actuator + micrometer-registry-prometheus
- `application.yml`: management.endpoints.web.exposure.include=health,info,prometheus,metrics + tags.application=11408study-backend
- `application-prod.yml`: 生产只 health/info/prometheus；health 不带 details；info.env 关闭
- `SecurityConfig`: P0-11 顺手收紧 `/actuator/health|info|prometheus` permitAll，其他 `/actuator/**` denyAll 双保险

**ai-service metrics 改动**：
- `requirements.txt` + prometheus-fastapi-instrumentator==7.0.0
- `main.py`: Instrumentator(should_group_status_codes=True, should_respect_env_var=True).instrument(app).expose(app, "/metrics")

**Dashboard**：
- `monitoring/grafana/dashboards/11408study-overview.json` — 10 个面板
  - Backend HTTP RPS / p95 / 4xx / 5xx
  - JVM heap / GC pause / 线程
  - ai-service RPS / p95 / 5xx
  - 30s 刷新；默认 from=now-1h

**Compose profile 隔离**：默认 dev workflow 不变；`docker compose --profile monitoring up -d` 才拉监控 4 件套。

### Phase 8：e2e 验证
- backend `/api/actuator/prometheus` 返 JVM/GC/Hikari/JDBC/spring_security 全套，带 `application="11408study-backend"` 标签
- Prometheus 19091 / Grafana 13000 / Loki 13100 端口监听正常（302/302/503，loki 还在 warmup）
- docker compose backend / ai-service 镜像 rebuild 中（含新依赖）
- 备份恢复演练已通过（见 Phase 1-2）

---

## 启停指引

```bash
# 1. 平时只跑业务栈
docker compose up -d postgres redis minio ai-service backend frontend nginx

# 2. 想看监控时追加
docker compose --profile monitoring up -d
# → 访问 http://localhost:13000  admin/admin  → 11408study/11408study Overview

# 3. 备份（手动）
BACKUP_DIR=/var/backups/11408study PGPASSWORD=$POSTGRES_PASSWORD scripts/backup.sh

# 4. 备份（自动 cron）
scripts/install-backup-cron.sh

# 5. 恢复演练（强烈建议先到 test 库）
BACKUP_DIR=/var/backups/11408study scripts/restore.sh latest --target test_study11408
```

---

## 已知遗留 / 下一会话

1. **docker compose backend/ai-service 镜像旧** — 本会话末已触发 rebuild；用户首次 pull 后需 `docker compose build backend ai-service` 一次（或 `docker compose up -d --build`）
2. **Loki 单实例无 HA** — ≤10K 用户够用；上量后改 S3 后端
3. **未配 alertmanager** — 当前只能"看 dashboard"，没主动告警。下次加 5 条核心 alert rule（5xx > 1/s、p95 > 2s、JVM heap > 80%、AI 错误率 > 5%、备份 cron 失败）
4. **未集成 postgres-exporter / redis-exporter** — DB/Redis 内部指标暂未上 Prometheus。Phase 9 候选。
5. **traceId/MDC 还没接** — 关键路径报错时无法用 traceId 串前端 → backend → ai-service 日志。Loki 已可按 container_name 过滤，但缺统一 traceId

---

## 度量

| 指标 | 数值 |
|---|---|
| commit 数 | 2（备份 + 监控） |
| 已 push | ✓ `86ac0a5` |
| 新代码行 | scripts/ 279 + monitoring/ 配置 ~250 + compose 60 + java/yaml 改动 ~30 = ~620 行 |
| 备份恢复演练 | ✓ 已通过 |
| Prometheus 端点 | host 19091 |
| Grafana 端点 | host 13000（admin/admin） |
| Loki 端点 | host 13100 |
