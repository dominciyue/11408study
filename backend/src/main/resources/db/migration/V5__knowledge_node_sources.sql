-- "PDF 出处定位"：每个知识点可关联多条原文出处（来自哪份资料 / 哪一页 / 原文片段）。
-- 本表先建好，便于后续把 ImportController.extract 的 source_excerpt 持久化；
-- 当前 extract 流程只回包给前端，不直接落库。
CREATE TABLE IF NOT EXISTS knowledge_node_sources (
    id BIGSERIAL PRIMARY KEY,
    node_id BIGINT NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    material_id BIGINT REFERENCES materials(id) ON DELETE SET NULL,
    page_number INTEGER,
    excerpt TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_kns_node ON knowledge_node_sources(node_id);
CREATE INDEX IF NOT EXISTS idx_kns_material ON knowledge_node_sources(material_id);
