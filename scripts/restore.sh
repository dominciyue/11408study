#!/usr/bin/env bash
# scripts/restore.sh
# 11408study 数据恢复脚本 — 灾难恢复 / 备份演练用。
#
# 用法：
#   ./restore.sh latest                          # 最新一份 PG dump
#   ./restore.sh 2026-05-18_143015               # 指定时间戳
#   ./restore.sh /path/to/pg-2026-05-18.dump     # 指定文件
#   ./restore.sh latest --target test_db          # 恢复到另一个 DB（演练用，强烈推荐）
#
# 注意：
#   - 默认 target 是 study11408 — 会先 DROP SCHEMA public CASCADE，**用 --target=test_db 演练**
#   - MinIO 暂只支持手动 mc mirror BACKUP_DIR/minio → minio bucket，参见 README

set -uo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/11408study}"
PG_CONTAINER="${PG_CONTAINER:-11408study-postgres-1}"
POSTGRES_USER="${POSTGRES_USER:-study11408}"
POSTGRES_DB="${POSTGRES_DB:-study11408}"
PGPASSWORD="${PGPASSWORD:-${POSTGRES_PASSWORD:-study11408_dev}}"

# ---- 参数解析 ----
DUMP_ARG="${1:-}"
TARGET_DB="$POSTGRES_DB"
if [[ "${2:-}" == "--target" && -n "${3:-}" ]]; then
    TARGET_DB="$3"
fi

if [[ -z "$DUMP_ARG" ]]; then
    echo "Usage: $0 <latest|TIMESTAMP|FILE> [--target DB]"
    echo "  latest      恢复最新的 pg dump"
    echo "  TIMESTAMP   形如 2026-05-18_143015"
    echo "  FILE        完整路径"
    echo "  --target DB 恢复到另一个数据库（演练强烈推荐，默认 $POSTGRES_DB）"
    exit 1
fi

# ---- 解析 DUMP_FILE ----
if [[ "$DUMP_ARG" == "latest" ]]; then
    DUMP_FILE=$(ls -1t "$BACKUP_DIR/pg/"pg-*.dump 2>/dev/null | head -1)
    if [[ -z "$DUMP_FILE" ]]; then
        echo "✗ no dump found in $BACKUP_DIR/pg/"
        exit 1
    fi
elif [[ -f "$DUMP_ARG" ]]; then
    DUMP_FILE="$DUMP_ARG"
else
    DUMP_FILE="$BACKUP_DIR/pg/pg-$DUMP_ARG.dump"
    if [[ ! -f "$DUMP_FILE" ]]; then
        echo "✗ dump file not found: $DUMP_FILE"
        exit 1
    fi
fi

SIZE=$(du -h "$DUMP_FILE" | cut -f1)
echo "============================================================"
echo " RESTORE"
echo "============================================================"
echo " dump file : $DUMP_FILE  ($SIZE)"
echo " target db : $TARGET_DB"
echo " container : $PG_CONTAINER"
echo

# ---- 安全门：恢复到生产 DB 时强制确认 ----
if [[ "$TARGET_DB" == "$POSTGRES_DB" ]]; then
    echo "⚠ 将恢复到默认数据库 $POSTGRES_DB（破坏性！）"
    echo "  如要演练请用：$0 ... --target test_${POSTGRES_DB}"
    read -p "  确认覆盖？输 YES_OVERWRITE 才继续：" ans
    if [[ "$ans" != "YES_OVERWRITE" ]]; then
        echo "取消。"
        exit 0
    fi
fi

# ---- 1. 创建目标 DB（如不存在） ----
echo "[1/3] ensure target DB $TARGET_DB exists"
docker exec -e PGPASSWORD="$PGPASSWORD" "$PG_CONTAINER" \
    psql -U "$POSTGRES_USER" -d postgres -tc \
    "SELECT 1 FROM pg_database WHERE datname='$TARGET_DB';" 2>/dev/null | grep -q 1 \
    || docker exec -e PGPASSWORD="$PGPASSWORD" "$PG_CONTAINER" \
       psql -U "$POSTGRES_USER" -d postgres -c "CREATE DATABASE $TARGET_DB;"

# ---- 2. DROP SCHEMA public 后 restore ----
echo "[2/3] drop schema public + pg_restore"
docker exec -e PGPASSWORD="$PGPASSWORD" "$PG_CONTAINER" \
    psql -U "$POSTGRES_USER" -d "$TARGET_DB" -c "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;"

# 把 dump 塞到容器再 restore（避免 stdin 在大文件时丢数据）
TMPNAME="/tmp/restore_$(date +%s).dump"
docker cp "$DUMP_FILE" "$PG_CONTAINER:$TMPNAME"
docker exec -e PGPASSWORD="$PGPASSWORD" "$PG_CONTAINER" \
    pg_restore -U "$POSTGRES_USER" -d "$TARGET_DB" --clean --if-exists --no-owner --no-privileges "$TMPNAME"
RESTORE_RC=$?
docker exec "$PG_CONTAINER" rm -f "$TMPNAME"

# ---- 3. 烟测 ----
echo "[3/3] smoke check"
docker exec -e PGPASSWORD="$PGPASSWORD" "$PG_CONTAINER" \
    psql -U "$POSTGRES_USER" -d "$TARGET_DB" -c "
        SELECT 'users' AS t, COUNT(*) FROM users
        UNION ALL SELECT 'subjects', COUNT(*) FROM subjects
        UNION ALL SELECT 'knowledge_nodes', COUNT(*) FROM knowledge_nodes
        UNION ALL SELECT 'quiz_questions', COUNT(*) FROM quiz_questions
        UNION ALL SELECT 'wrong_answers', COUNT(*) FROM wrong_answers
        UNION ALL SELECT 'study_progress', COUNT(*) FROM study_progress;
    "

echo
if [[ $RESTORE_RC -eq 0 ]]; then
    echo "✓ restore complete to $TARGET_DB"
else
    echo "✗ pg_restore returned $RESTORE_RC (see output above)"
fi

exit $RESTORE_RC
