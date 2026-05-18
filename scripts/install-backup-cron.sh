#!/usr/bin/env bash
# scripts/install-backup-cron.sh
# 把 backup.sh 注册到 host cron — 每天凌晨 2:15 跑。
#
# 幂等：重复执行不会重复注册（基于 marker comment 去重）。
# 卸载：./install-backup-cron.sh --uninstall

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MARKER="# 11408study-backup"
CRON_LINE="15 2 * * * BACKUP_DIR=/var/backups/11408study $SCRIPT_DIR/backup.sh $MARKER"

case "${1:-}" in
    --uninstall)
        crontab -l 2>/dev/null | grep -v "$MARKER" | crontab -
        echo "✓ uninstalled cron entry"
        exit 0
        ;;
esac

# 已存在则跳过
if crontab -l 2>/dev/null | grep -qF "$MARKER"; then
    echo "→ cron entry already installed:"
    crontab -l | grep "$MARKER"
    exit 0
fi

# 追加
(crontab -l 2>/dev/null; echo "$CRON_LINE") | crontab -
echo "✓ installed cron entry:"
crontab -l | grep "$MARKER"

# 确认备份目录可写
sudo mkdir -p /var/backups/11408study 2>/dev/null || mkdir -p /var/backups/11408study 2>/dev/null \
    || { echo "✗ cannot create /var/backups/11408study — please run: sudo mkdir -p /var/backups/11408study && sudo chown \$USER /var/backups/11408study"; exit 1; }
echo "✓ backup dir: /var/backups/11408study"
echo ""
echo "Next: run scripts/backup.sh once to smoke test."
