#!/usr/bin/env bash
# scripts/backup.sh
# 11408study 数据备份脚本 — 每天凌晨 2:15 由 host cron 调用。
#
# 备份对象：
#   1. PostgreSQL: pg_dump -Fc（自定义二进制格式，体积小、可并行 restore）
#   2. MinIO: mc mirror 同步整个 study11408 bucket 到本地 backup dir
#
# 保留策略：
#   - PostgreSQL: 14 天滚动（>14 天自动删）
#   - MinIO: 保留 mirror 当前状态，依赖 ZFS / 文件系统自身去重
#
# 输出位置：默认 $BACKUP_DIR (=/var/backups/11408study)；可通过环境变量覆盖。
#
# 用法：
#   ./backup.sh                    # 走默认配置
#   BACKUP_DIR=/data/backup ./backup.sh
#
# 退出码：0 全部成功；1 PG 失败；2 MinIO 失败；3 同时失败

set -u  # 未定义变量即失败；-e 单独控制每步是否吞错

# ---- 配置（可被环境变量覆盖） ----
BACKUP_DIR="${BACKUP_DIR:-/var/backups/11408study}"
PG_RETENTION_DAYS="${PG_RETENTION_DAYS:-14}"

POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_DB="${POSTGRES_DB:-study11408}"
POSTGRES_USER="${POSTGRES_USER:-study11408}"
# 密码：必须通过 PGPASSWORD 或 ~/.pgpass 传入，**不要写明文进脚本**

PG_CONTAINER="${PG_CONTAINER:-11408study-postgres-1}"
MINIO_CONTAINER="${MINIO_CONTAINER:-11408study-minio-1}"
MINIO_ALIAS="${MINIO_ALIAS:-local}"
MINIO_ENDPOINT="${MINIO_ENDPOINT:-http://localhost:19000}"
MINIO_ACCESS_KEY="${MINIO_ACCESS_KEY:-minioadmin}"
MINIO_SECRET_KEY="${MINIO_SECRET_KEY:-minioadmin123}"
MINIO_BUCKET="${MINIO_BUCKET:-study11408}"

# ---- 衍生变量 ----
DATE="$(date +%F)"     # 2026-05-18
TS="$(date +%F_%H%M%S)" # 2026-05-18_143015
LOG="$BACKUP_DIR/backup-$DATE.log"
PG_OUT="$BACKUP_DIR/pg/pg-$TS.dump"
MINIO_OUT="$BACKUP_DIR/minio"

mkdir -p "$BACKUP_DIR/pg" "$MINIO_OUT"
exec > >(tee -a "$LOG") 2>&1

echo "==============================================================="
echo " 11408study backup — $(date '+%F %T')"
echo "==============================================================="
echo " backup dir: $BACKUP_DIR"
echo " retention : $PG_RETENTION_DAYS days (PG)"
echo

# ---- 1. PostgreSQL pg_dump ----
echo "[1/3] PostgreSQL → $PG_OUT"
PG_RC=0
if docker ps --format '{{.Names}}' | grep -q "^${PG_CONTAINER}$"; then
    # 容器内跑 pg_dump，避免 host 安装 client；密码用容器 env 默认
    if docker exec -e PGPASSWORD="${POSTGRES_PASSWORD:-study11408_dev}" \
        "$PG_CONTAINER" \
        pg_dump -Fc -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
        > "$PG_OUT" 2>>"$LOG"; then
        SIZE=$(du -h "$PG_OUT" | cut -f1)
        echo "    ✓ ok  ($SIZE)"
    else
        echo "    ✗ pg_dump failed (see log)"
        PG_RC=1
    fi
else
    echo "    ⚠ container $PG_CONTAINER not running, skip"
    PG_RC=1
fi

# ---- 2. PostgreSQL 清理过期备份 ----
echo "[2/3] cleanup PG backups older than ${PG_RETENTION_DAYS}d"
if [[ -d "$BACKUP_DIR/pg" ]]; then
    BEFORE=$(ls "$BACKUP_DIR/pg/" | wc -l)
    find "$BACKUP_DIR/pg" -name 'pg-*.dump' -mtime "+${PG_RETENTION_DAYS}" -delete
    AFTER=$(ls "$BACKUP_DIR/pg/" | wc -l)
    echo "    ✓ removed $((BEFORE - AFTER)) old dumps; $AFTER remaining"
fi

# ---- 3. MinIO mirror ----
echo "[3/3] MinIO bucket $MINIO_BUCKET → $MINIO_OUT"
MINIO_RC=0
if docker ps --format '{{.Names}}' | grep -q "^${MINIO_CONTAINER}$"; then
    # 用 host mc（若装了）；否则用容器内 mc
    if command -v mc >/dev/null 2>&1; then
        mc alias set "$MINIO_ALIAS" "$MINIO_ENDPOINT" "$MINIO_ACCESS_KEY" "$MINIO_SECRET_KEY" >/dev/null
        if mc mirror --overwrite --remove "$MINIO_ALIAS/$MINIO_BUCKET" "$MINIO_OUT" 2>>"$LOG"; then
            FCOUNT=$(find "$MINIO_OUT" -type f 2>/dev/null | wc -l)
            FSIZE=$(du -sh "$MINIO_OUT" 2>/dev/null | cut -f1)
            echo "    ✓ ok ($FCOUNT files, $FSIZE)"
        else
            echo "    ✗ mc mirror failed"
            MINIO_RC=2
        fi
    else
        # mc 不在 host：用容器内置的 mc，先把 MinIO 整 data dir cp 出来
        echo "    ⚠ host mc not installed, falling back to docker cp data dir"
        if docker cp "$MINIO_CONTAINER:/data" "$MINIO_OUT/_docker_cp_data_$TS" 2>>"$LOG"; then
            echo "    ✓ raw data copy ok (recommend installing mc for incremental)"
        else
            echo "    ✗ docker cp failed"
            MINIO_RC=2
        fi
    fi
else
    echo "    ⚠ container $MINIO_CONTAINER not running, skip"
    MINIO_RC=2
fi

echo
echo "==============================================================="
echo " summary: pg=$PG_RC minio=$MINIO_RC  total_disk=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)"
echo " log:    $LOG"
echo "==============================================================="

# 总退出码：bit0=PG, bit1=MinIO
exit $((PG_RC + MINIO_RC))
