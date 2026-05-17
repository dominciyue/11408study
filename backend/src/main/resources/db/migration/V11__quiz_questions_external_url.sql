-- V11: link-based 题目支持
-- 增加 4 个 NULLable 列用于挂载外部题目 URL（视频解析 / 公开课 / 真题 PDF 等）。
-- 既有行保持 NULL，向后兼容；practice 页根据 external_url 是否为空切换渲染分支。
ALTER TABLE quiz_questions ADD COLUMN external_url VARCHAR(1000);
ALTER TABLE quiz_questions ADD COLUMN external_source VARCHAR(200);
ALTER TABLE quiz_questions ADD COLUMN year INTEGER;
ALTER TABLE quiz_questions ADD COLUMN question_number INTEGER;
CREATE INDEX idx_quiz_questions_year ON quiz_questions(year);
