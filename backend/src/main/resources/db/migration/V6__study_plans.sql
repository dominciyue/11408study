-- AI 学习计划入库 v2 — 把前端 localStorage 的周计划替换为服务端持久化，
-- 支持跨设备同步 + 历史多份计划。
--
-- plan_json 直接存 JSON 字符串（TEXT），由后端用 ObjectMapper.writeValueAsString
-- 把 ai-service 返回的 plan: WeekPlan[] 序列化进去，前端读出后 JSON.parse 渲染。
-- 不用 JSONB 的原因：plan 完全由 LLM 决定结构、不会做 server-side query／index，
-- 用 TEXT 保持迁移最简单。
CREATE TABLE IF NOT EXISTS study_plans (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id BIGINT REFERENCES subjects(id) ON DELETE SET NULL,
    weeks INTEGER NOT NULL CHECK (weeks BETWEEN 1 AND 52),
    goal TEXT NOT NULL,
    summary TEXT,
    plan_json TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 列表页主查询：按用户拉历史，最新在前。
CREATE INDEX IF NOT EXISTS idx_study_plans_user ON study_plans(user_id, created_at DESC);
