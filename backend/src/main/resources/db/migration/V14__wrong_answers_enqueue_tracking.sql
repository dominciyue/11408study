-- V14: 错题闭环 — 加入"已入队"标记列与配套索引
-- 设计文档：docs/superpowers/specs/2026-05-18-wrong-answer-loop-and-weakness-radar-design.md
--
-- 字段语义：
--   enqueued_at IS NULL  → 错题尚未触发"入复习队列"
--   enqueued_at NOT NULL → 已经把对应 node 的 next_review 拨到了近期
-- 策略：同一题累计 >= 2 次错误后入队一次，避免重复触发。

ALTER TABLE wrong_answers ADD COLUMN IF NOT EXISTS enqueued_at TIMESTAMP;
COMMENT ON COLUMN wrong_answers.enqueued_at IS '该错题被纳入复习队列的时刻，NULL 表示尚未入队';

-- 支持 countByUserIdAndQuestionIdAndResolvedFalseAndEnqueuedAtIsNull 高效计数
CREATE INDEX IF NOT EXISTS idx_wa_user_question_open
  ON wrong_answers (user_id, question_id)
  WHERE resolved = false AND enqueued_at IS NULL;

-- 支持错题本列表分页 + groupBy=node 聚合
CREATE INDEX IF NOT EXISTS idx_wa_user_resolved_answered
  ON wrong_answers (user_id, resolved, answered_at DESC);
