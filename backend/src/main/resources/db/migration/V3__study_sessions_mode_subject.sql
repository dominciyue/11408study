ALTER TABLE study_sessions
    ADD COLUMN IF NOT EXISTS subject_id BIGINT REFERENCES subjects(id) ON DELETE SET NULL;

ALTER TABLE study_sessions
    ADD COLUMN IF NOT EXISTS mode VARCHAR(50) DEFAULT 'free';

CREATE INDEX IF NOT EXISTS idx_study_sessions_subject_id ON study_sessions(subject_id);
