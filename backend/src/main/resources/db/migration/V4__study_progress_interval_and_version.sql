-- P0-04: SM-2 算法修复需要持久化"上次 interval"和加乐观锁
ALTER TABLE study_progress
    ADD COLUMN IF NOT EXISTS interval_days INTEGER DEFAULT 0;

ALTER TABLE study_progress
    ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 0 NOT NULL;

-- 已有数据回填：根据 repetition_count 反推一个合理的 interval（粗略；用户实际复习时会重新计算）
UPDATE study_progress
SET interval_days = CASE
    WHEN repetition_count = 0 THEN 0
    WHEN repetition_count = 1 THEN 1
    WHEN repetition_count = 2 THEN 6
    ELSE LEAST(GREATEST(ROUND(POWER(ease_factor, repetition_count - 2) * 6)::INTEGER, 1), 365)
END
WHERE interval_days IS NULL OR interval_days = 0;
