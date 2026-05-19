-- 错题"病因"AI 归类:为每条错题标记 5 类标签之一,解锁"本周 60% 错题是审题偏差"洞察。
-- nullable:旧错题、AI 暂未归类、AI 失败的条目都保持 NULL,前端按 NULL 显示"未归类"。
-- 字符集 50 给点余量,实际固定枚举:
--   CONCEPT_UNCLEAR / CALCULATION_ERROR / MISREAD_QUESTION / KNOWLEDGE_GAP / UNFAMILIAR_TYPE
ALTER TABLE wrong_answers ADD COLUMN error_category VARCHAR(50);

-- 过滤分析的索引(partial):只对未解决且已归类的条目建,体积小。
CREATE INDEX idx_wrong_answers_user_category_open
    ON wrong_answers(user_id, error_category)
    WHERE resolved = FALSE AND error_category IS NOT NULL;
