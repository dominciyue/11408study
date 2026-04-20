CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nickname VARCHAR(50),
    avatar VARCHAR(500),
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subjects (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    icon VARCHAR(50),
    color VARCHAR(20),
    description TEXT,
    sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS topics (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    subject_id BIGINT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE
);
CREATE INDEX idx_topics_subject_id ON topics(subject_id);

CREATE TABLE IF NOT EXISTS knowledge_nodes (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    content TEXT,
    difficulty VARCHAR(20),
    metadata JSONB,
    topic_id BIGINT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_knowledge_nodes_topic_id ON knowledge_nodes(topic_id);
CREATE INDEX idx_knowledge_nodes_title ON knowledge_nodes(title);

CREATE TABLE IF NOT EXISTS knowledge_edges (
    id BIGSERIAL PRIMARY KEY,
    source_id BIGINT NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    target_id BIGINT NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    relation_type VARCHAR(50) NOT NULL,
    weight DOUBLE PRECISION DEFAULT 1.0,
    description VARCHAR(500)
);
CREATE INDEX idx_knowledge_edges_source ON knowledge_edges(source_id);
CREATE INDEX idx_knowledge_edges_target ON knowledge_edges(target_id);
CREATE INDEX idx_knowledge_edges_relation_type ON knowledge_edges(relation_type);

CREATE TABLE IF NOT EXISTS materials (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(300),
    type VARCHAR(100),
    file_url VARCHAR(1000),
    original_name VARCHAR(500),
    file_size BIGINT,
    node_id BIGINT REFERENCES knowledge_nodes(id) ON DELETE SET NULL,
    uploader_id BIGINT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_materials_node_id ON materials(node_id);
CREATE INDEX idx_materials_uploader_id ON materials(uploader_id);

CREATE TABLE IF NOT EXISTS study_progress (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    node_id BIGINT NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    mastery_level INTEGER DEFAULT 0,
    last_review TIMESTAMP,
    next_review TIMESTAMP,
    repetition_count INTEGER DEFAULT 0,
    ease_factor DOUBLE PRECISION DEFAULT 2.5,
    UNIQUE(user_id, node_id)
);
CREATE INDEX idx_study_progress_user_id ON study_progress(user_id);
CREATE INDEX idx_study_progress_next_review ON study_progress(next_review);

CREATE TABLE IF NOT EXISTS quiz_questions (
    id BIGSERIAL PRIMARY KEY,
    node_id BIGINT REFERENCES knowledge_nodes(id) ON DELETE SET NULL,
    question_type VARCHAR(30) NOT NULL,
    content TEXT NOT NULL,
    options JSONB,
    answer VARCHAR(500) NOT NULL,
    explanation TEXT,
    source VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_quiz_questions_node_id ON quiz_questions(node_id);
CREATE INDEX idx_quiz_questions_type ON quiz_questions(question_type);

CREATE TABLE IF NOT EXISTS wrong_answers (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id BIGINT NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    user_answer VARCHAR(500),
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved BOOLEAN DEFAULT FALSE
);
CREATE INDEX idx_wrong_answers_user_id ON wrong_answers(user_id);

CREATE TABLE IF NOT EXISTS notes (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    node_id BIGINT REFERENCES knowledge_nodes(id) ON DELETE SET NULL,
    title VARCHAR(300),
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_node_id ON notes(node_id);

CREATE TABLE IF NOT EXISTS study_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    studied_nodes INTEGER DEFAULT 0,
    reviewed_nodes INTEGER DEFAULT 0
);
CREATE INDEX idx_study_sessions_user_id ON study_sessions(user_id);

-- Seed initial subjects
INSERT INTO subjects (name, code, icon, color, description, sort_order) VALUES
('政治', 'politics', 'BookOpen', '#ef4444', '马克思主义基本原理、毛中特、近代史、思修法基、形势与政策', 1),
('英语一', 'english', 'Languages', '#3b82f6', '阅读理解、完形填空、翻译、写作', 2),
('数学一', 'math', 'Calculator', '#22c55e', '高等数学、线性代数、概率论与数理统计', 3),
('408计算机专业基础', 'cs408', 'Cpu', '#a855f7', '数据结构、计算机组成原理、操作系统、计算机网络', 4);

-- Seed topics for each subject
INSERT INTO topics (name, description, sort_order, subject_id) VALUES
('马克思主义基本原理', '马克思主义哲学、政治经济学、科学社会主义', 1, 1),
('毛泽东思想和中国特色社会主义理论体系', '毛泽东思想、邓小平理论、三个代表、科学发展观、习近平新时代中国特色社会主义思想', 2, 1),
('中国近现代史纲要', '从鸦片战争到新时代的历史进程', 3, 1),
('思想道德修养与法律基础', '思想道德修养和法治教育', 4, 1),
('形势与政策', '当年度国内外重大时事政策', 5, 1),
('阅读理解', '英语一阅读理解技巧与训练', 1, 2),
('完形填空', '英语一完形填空技巧与训练', 2, 2),
('翻译', '英汉互译技巧与训练', 3, 2),
('写作', '小作文与大作文技巧训练', 4, 2),
('核心词汇', '考研英语核心词汇5500', 5, 2),
('高等数学', '函数、极限、连续、微分、积分、级数、微分方程', 1, 3),
('线性代数', '行列式、矩阵、向量、线性方程组、特征值', 2, 3),
('概率论与数理统计', '随机事件、随机变量、数字特征、大数定律、统计量', 3, 3),
('数据结构', '线性表、栈、队列、树、图、排序、查找', 1, 4),
('计算机组成原理', '计算机系统概述、数据表示、运算器、存储器、指令系统、CPU、总线、I/O', 2, 4),
('操作系统', '进程管理、内存管理、文件系统、I/O管理', 3, 4),
('计算机网络', '体系结构、物理层、数据链路层、网络层、传输层、应用层', 4, 4);
