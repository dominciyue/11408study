#!/usr/bin/env bash
# scripts/seed-llm-questions.sh
# 后台调 DeepSeek 批量为缺题节点生成 inline 题。
#
# 策略：
#   - 按学科优先级（英语一 > 数学一 > 408 > 政治；后两个本就比较够）
#   - 每节点目标 ≥3 道完整题（已有则跳过）
#   - 复用现有 POST /quiz/nodes/{id}/generate-questions（已限流 30/min）
#   - 每次调用后 sleep AVOID_RATE，避开 429
#
# 用法：
#   API_BASE=http://localhost:18081 USERNAME=audit2 PASSWORD=auditpass123 \
#     bash scripts/seed-llm-questions.sh english 3
#
# 参数：
#   $1 = subject keyword (politics / english / math / cs408 / all)
#   $2 = target inline qs per node (default 3)
#
# 退出码：
#   0 完成；非 0 失败次数

set -uo pipefail

API_BASE="${API_BASE:-http://localhost:18081}"
USERNAME="${USERNAME:-audit2}"
PASSWORD="${PASSWORD:-auditpass123}"
DB_CONTAINER="${DB_CONTAINER:-11408study-postgres-1}"
DB_USER="${DB_USER:-study11408}"
DB_NAME="${DB_NAME:-study11408}"
AVOID_RATE="${AVOID_RATE:-3}"
COUNT_PER_NODE="${2:-3}"

SUBJECT_FILTER="${1:-english}"
case "$SUBJECT_FILTER" in
  politics) SUBJECT_ID=1 ;;
  english)  SUBJECT_ID=2 ;;
  math)     SUBJECT_ID=3 ;;
  cs408)    SUBJECT_ID=4 ;;
  all)      SUBJECT_ID=0 ;;
  *) echo "未知学科：$SUBJECT_FILTER（politics|english|math|cs408|all）"; exit 1 ;;
esac

echo "============================================================"
echo "  LLM 批量补题"
echo "============================================================"
echo "  API:           $API_BASE"
echo "  subject:       $SUBJECT_FILTER (id=$SUBJECT_ID)"
echo "  target/node:   $COUNT_PER_NODE 道"
echo "  rate-sleep:    ${AVOID_RATE}s"
echo

TOKEN=$(curl --noproxy '*' -s -X POST "$API_BASE/api/auth/login" \
    -H 'Content-Type: application/json' \
    -d "{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}" \
    | python3 -c 'import json,sys;d=json.load(sys.stdin)["data"];print(d["token"])' 2>/dev/null)

if [[ -z "$TOKEN" ]]; then
    echo "✗ 登录失败 ($USERNAME)"
    exit 1
fi
echo "✓ token (len=${#TOKEN})"

SUBJECT_WHERE=""
if [[ $SUBJECT_ID -gt 0 ]]; then
    SUBJECT_WHERE="AND t.subject_id=$SUBJECT_ID"
fi

PENDING=$(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -tA -c "
    SELECT n.id, COALESCE(c.inline_qs, 0) AS have
    FROM knowledge_nodes n
    JOIN topics t ON t.id = n.topic_id
    LEFT JOIN (
        SELECT node_id,
               SUM(CASE WHEN external_url IS NULL OR external_url='' THEN 1 ELSE 0 END) AS inline_qs
        FROM quiz_questions
        WHERE node_id IS NOT NULL
        GROUP BY node_id
    ) c ON c.node_id = n.id
    WHERE COALESCE(c.inline_qs, 0) < $COUNT_PER_NODE
    $SUBJECT_WHERE
    ORDER BY have ASC, n.id ASC;
")

TOTAL=$(echo "$PENDING" | wc -l)
echo "✓ 待补节点：$TOTAL"
echo

OK=0
FAIL=0
START=$(date +%s)
i=0

while IFS='|' read -r NODE_ID HAVE; do
    NODE_ID=$(echo "$NODE_ID" | tr -d ' ')
    HAVE=$(echo "$HAVE" | tr -d ' ')
    [[ -z "$NODE_ID" ]] && continue
    i=$((i+1))
    NEED=$((COUNT_PER_NODE - HAVE))

    printf "[%3d/%3d] node=%-5s have=%s need=%s  " "$i" "$TOTAL" "$NODE_ID" "$HAVE" "$NEED"
    RESP=$(curl --noproxy '*' -s -X POST "$API_BASE/api/quiz/nodes/$NODE_ID/generate-questions?count=$NEED&type=CHOICE" \
        -H "Authorization: Bearer $TOKEN" \
        --max-time 90)
    GEN=$(echo "$RESP" | python3 -c '
import json, sys
try:
    d = json.load(sys.stdin)
    if d.get("success"):
        print(d["data"].get("generated", 0))
    else:
        msg = (d.get("message") or "?")[:30]
        print("ERR:" + msg)
except Exception as e:
    print("PARSE:" + str(e)[:30])
')

    if [[ "$GEN" =~ ^[0-9]+$ ]] && [[ $GEN -gt 0 ]]; then
        printf "→ +%s ✓\n" "$GEN"
        OK=$((OK + GEN))
    else
        printf "→ %s ✗\n" "$GEN"
        FAIL=$((FAIL + 1))
        if [[ "$GEN" == *"429"* ]]; then
            echo "    rate-limited, sleep 15s"
            sleep 15
        fi
    fi

    sleep "$AVOID_RATE"
done <<< "$PENDING"

ELAPSED=$(( $(date +%s) - START ))
echo
echo "============================================================"
echo "  生成完成"
echo "============================================================"
echo "  新增题数：$OK"
echo "  失败节点：$FAIL"
echo "  耗时：    ${ELAPSED}s"
exit $FAIL
