-- V13: 预置专家编排学习路径目录
-- =============================================================================
-- 区别于 V6 (study_plans，用户私有 AI 即时生成周计划) —— 这两张表的行由运营/教研
-- 侧维护（这里直接 seed），所有用户共享。code 字段唯一以便后续 by-code 幂等 upsert。
-- =============================================================================

CREATE TABLE IF NOT EXISTS study_paths (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    subject_id BIGINT REFERENCES subjects(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    duration_weeks INTEGER NOT NULL CHECK (duration_weeks BETWEEN 1 AND 52),
    difficulty VARCHAR(20),
    target_audience VARCHAR(200),
    total_hours INTEGER,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_study_paths_subject ON study_paths(subject_id);

CREATE TABLE IF NOT EXISTS study_path_weeks (
    id BIGSERIAL PRIMARY KEY,
    path_id BIGINT NOT NULL REFERENCES study_paths(id) ON DELETE CASCADE,
    week_no INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL,
    goal TEXT,
    daily_tasks JSONB,
    focus_topics JSONB,
    resource_hints JSONB,
    UNIQUE(path_id, week_no)
);
CREATE INDEX idx_study_path_weeks_path ON study_path_weeks(path_id);

-- =============================================================================
-- 6 条预置路径
-- subject_id 对应 V1 种入的: 1=政治, 2=英语一, 3=数学一, 4=408
-- =============================================================================
INSERT INTO study_paths (code, subject_id, title, description, duration_weeks, difficulty, target_audience, total_hours, sort_order) VALUES
('POLITICS_3M', 1, '政治 · 3 个月冲刺', '考前 3 个月集中突破，覆盖马原-毛中特-史纲-思修法基-时政五大板块，每周配套肖秀荣 1000 题与背诵手册。', 12, '基础', '9-12 月冲刺；有基础或在职考生', 144, 10),
('POLITICS_6M', 1, '政治 · 半年系统强化', '半年内吃透五大板块，从马原入手，搭配徐涛强化课 + 肖 1000 题二刷，最后留 4 周冲刺真题 / 背诵。', 24, '中等', '7-12 月正常推进；全日制脱产或在校生', 288, 11),
('ENGLISH_6M', 2, '英语一 · 半年真题精读', '以 2000-2024 年真题阅读为主线的半年路径，每周 1 套真题精读 + 单词高频复盘 + 长难句拆解 + 写作素材积累。', 24, '中等', '英语一目标 70+；基础词汇 5000 以上', 360, 20),
('MATH_12M', 3, '数学一 · 全年三阶段', '全年三阶段 36 周：基础（教材 + 同济）12 周、强化（660/880 + 张宇 36 讲）12 周、真题模拟（30 年真题 + 8 套模拟）12 周。', 36, '中等', '数学一目标 120+；全程跟班', 540, 30),
('CS408_12M', 4, '408 · 全年王道四件套', '一轮基础（12 周）+ 二轮强化与算法（12 周）+ 三轮真题模拟（12 周），严格对齐王道四件套章节与官方大纲。', 36, '中等', '408 目标 120+；零基础或跨考友好', 600, 40),
('CS408_6M', 4, '408 · 半年突击（有 CS 基础）', '半年 24 周：6 周一轮快速过书、12 周强化深挖、6 周真题与错题机制；面向已有 CS 课程基础的考生。', 24, '困难', '本科 CS 背景或科班基础；7-12 月备考', 432, 41)
ON CONFLICT (code) DO NOTHING;

-- =============================================================================
-- study_path_weeks seed
-- 用 DO 块 + path_id 子查询 (SELECT id FROM study_paths WHERE code=...) 解耦自增 id。
-- 每条 INSERT 一组 (week_no, title, goal, daily_tasks, focus_topics, resource_hints)。
-- =============================================================================

-- ─── 1. POLITICS_3M (12 周) ────────────────────────────────────────────────────
INSERT INTO study_path_weeks (path_id, week_no, title, goal, daily_tasks, focus_topics, resource_hints) VALUES
((SELECT id FROM study_paths WHERE code='POLITICS_3M'), 1, '马原 · 哲学唯物论与辩证法', '吃透物质与意识、对立统一规律两大核心考点', '["精听徐涛强化课马原第 1-3 讲", "肖 1000 题马原单选 30 道", "整理 5 个高频原理名词卡片"]'::jsonb, '["马克思主义基本原理"]'::jsonb, '["B 站搜索: 徐涛 强化班 马原", "肖秀荣 1000 题（精讲精练配套）"]'::jsonb),
((SELECT id FROM study_paths WHERE code='POLITICS_3M'), 2, '马原 · 认识论与历史唯物主义', '区分实践 / 真理 / 价值三对范畴，掌握社会基本矛盾', '["看徐涛强化课马原第 4-6 讲", "做 1000 题马原多选 + 错题回顾", "默写历史唯物主义思维导图"]'::jsonb, '["马克思主义基本原理"]'::jsonb, '["腿姐 30 天 70 分技巧课", "B 站: 张修齐 思维导图"]'::jsonb),
((SELECT id FROM study_paths WHERE code='POLITICS_3M'), 3, '马原 · 政治经济学与科社', '理清剩余价值理论、资本积累、垄断资本主义', '["徐涛强化课政经 + 科社 4 讲", "1000 题政经 / 科社合计 40 题", "用 A4 纸总结剩余价值生产公式"]'::jsonb, '["马克思主义基本原理"]'::jsonb, '["徐涛 核心考案", "知乎: 政经公式推导精讲"]'::jsonb),
((SELECT id FROM study_paths WHERE code='POLITICS_3M'), 4, '毛中特 · 新民主主义与社会主义改造', '掌握毛泽东思想活的灵魂与三大改造历史意义', '["精听腿姐技巧课毛中特上半部分", "1000 题毛中特 1-30 题", "对比新旧民主主义革命异同"]'::jsonb, '["毛泽东思想与中国特色社会主义"]'::jsonb, '["腿姐技巧班", "肖 1000 题精讲精练 PDF"]'::jsonb),
((SELECT id FROM study_paths WHERE code='POLITICS_3M'), 5, '毛中特 · 中国特色社会主义理论', '邓三科 + 新时代主线脉络全过', '["腿姐技巧课毛中特下半部分", "1000 题毛中特 31-60 题", "整理重要会议时间线"]'::jsonb, '["毛泽东思想与中国特色社会主义"]'::jsonb, '["B 站: 腿姐 冲刺背诵手册", "学习强国 App"]'::jsonb),
((SELECT id FROM study_paths WHERE code='POLITICS_3M'), 6, '史纲 · 近代史前 30 年', '鸦片战争-五四运动的主线与三次革命高潮', '["视频: 徐涛史纲第 1-5 讲", "1000 题史纲单选 30 题", "手绘近代史时间轴"]'::jsonb, '["近代史纲要"]'::jsonb, '["徐涛 强化班 史纲", "腿姐 史纲口诀"]'::jsonb),
((SELECT id FROM study_paths WHERE code='POLITICS_3M'), 7, '史纲 · 中共党史 + 改革开放', '建党到二十大党史主线，重点掌握重大会议', '["徐涛史纲第 6-10 讲", "1000 题史纲多选 + 大题素材积累", "整理党的代表大会表格"]'::jsonb, '["近代史纲要"]'::jsonb, '["B 站: 党史 100 年大事记", "肖秀荣 形势与政策"]'::jsonb),
((SELECT id FROM study_paths WHERE code='POLITICS_3M'), 8, '思修法基 + 法律基础', '社会主义核心价值观 + 宪法/民法常识考点', '["听徐涛思修法基全部", "1000 题思修法基整章", "整理常考法律条文卡片"]'::jsonb, '["思想道德与法治"]'::jsonb, '["徐涛 思修法基 PDF", "腿姐 法律基础速记"]'::jsonb),
((SELECT id FROM study_paths WHERE code='POLITICS_3M'), 9, '时政热点 1 / 2', '盘点近一年重大时政与领导人讲话', '["精读肖秀荣形势与政策小册子", "1000 题时政部分", "汇总 10 个高频热点关键词"]'::jsonb, '["形势与政策"]'::jsonb, '["肖秀荣 形势与政策", "学习强国 / 求是网"]'::jsonb),
((SELECT id FROM study_paths WHERE code='POLITICS_3M'), 10, '冲刺 · 肖四肖八选择题', '完整刷完肖八选择 + 肖四第一遍', '["每天 1 套肖八选择限时 30 分钟", "错题录入 Anki 或纸质本", "对比答案解析定位薄弱章节"]'::jsonb, '["马克思主义基本原理", "毛泽东思想与中国特色社会主义"]'::jsonb, '["肖秀荣 终极预测 8 套卷", "Anki 政治错题模板"]'::jsonb),
((SELECT id FROM study_paths WHERE code='POLITICS_3M'), 11, '冲刺 · 大题背诵第一轮', '肖四 + 腿姐 / 徐涛大题对照背', '["每天背 1 道肖四马原大题", "毛中特大题理清答题框架", "听腿姐冲刺押题课 1 小时"]'::jsonb, '["马克思主义基本原理", "毛泽东思想与中国特色社会主义"]'::jsonb, '["肖秀荣 终极预测 4 套卷", "腿姐 冲刺背诵手册"]'::jsonb),
((SELECT id FROM study_paths WHERE code='POLITICS_3M'), 12, '冲刺 · 模考与最后回顾', '上考场前的全真模考 + 心态调整', '["完整限时 3 小时模考肖四", "回顾错题本 + 大题模版", "整理万能金句 / 答题套话清单"]'::jsonb, '["近代史纲要", "形势与政策"]'::jsonb, '["肖四 / 腿四 终极预测", "B 站: 考场答题策略 30 分钟"]'::jsonb);

-- ─── 2. POLITICS_6M (24 周) ──────────────────────────────────────────────────
INSERT INTO study_path_weeks (path_id, week_no, title, goal, daily_tasks, focus_topics, resource_hints) VALUES
((SELECT id FROM study_paths WHERE code='POLITICS_6M'), 1, '入门 · 政治备考路线图', '了解题型 + 时间安排 + 教材取舍', '["听徐涛导学课 + 看大纲解析", "购齐核心考案 + 1000 题 + 肖八肖四", "制定每周打卡表"]'::jsonb, '["马克思主义基本原理"]'::jsonb, '["徐涛 导学课（B 站）", "考研政治大纲解析"]'::jsonb),
((SELECT id FROM study_paths WHERE code='POLITICS_6M'), 2, '马原 · 唯物论 + 辩证法 (上)', '理解物质 / 意识 / 实践三对范畴', '["徐涛强化课马原第 1-2 讲", "1000 题对应章节单选", "整理唯物论思维导图"]'::jsonb, '["马克思主义基本原理"]'::jsonb, '["徐涛 强化班", "B 站: 政治思维导图频道"]'::jsonb),
((SELECT id FROM study_paths WHERE code='POLITICS_6M'), 3, '马原 · 辩证法 (下) + 认识论', '掌握三大规律、五大范畴、真理与价值', '["徐涛强化课马原第 3-5 讲", "1000 题多选 30 题", "默写五大范畴思维卡片"]'::jsonb, '["马克思主义基本原理"]'::jsonb, '["腿姐 30 天 70 分", "Anki 哲学卡片"]'::jsonb),
((SELECT id FROM study_paths WHERE code='POLITICS_6M'), 4, '马原 · 历史唯物主义', '社会基本矛盾 + 人民群众的作用', '["徐涛强化课马原第 6-7 讲", "1000 题历唯部分 + 错题回顾", "归纳社会形态演进表"]'::jsonb, '["马克思主义基本原理"]'::jsonb, '["徐涛 核心考案", "肖 1000 题 PDF"]'::jsonb),
((SELECT id FROM study_paths WHERE code='POLITICS_6M'), 5, '马原 · 政治经济学', '剩余价值 + 资本运动 + 周转公式', '["徐涛政经 4 讲", "1000 题政经全部", "公式卡片：剩余价值 / 利润率 / 周转速度"]'::jsonb, '["马克思主义基本原理"]'::jsonb, '["知乎: 政经公式推导", "徐涛 强化班 政经"]'::jsonb),
((SELECT id FROM study_paths WHERE code='POLITICS_6M'), 6, '马原 · 科社 + 阶段复盘', '科社主线 + 马原 5 周回头看', '["徐涛科社 2 讲", "1000 题科社 + 马原错题集中回顾", "整张 A3 纸总结马原结构"]'::jsonb, '["马克思主义基本原理"]'::jsonb, '["腿姐 冲刺手册（马原）", "B 站搜索: 马原五分钟通关"]'::jsonb),
((SELECT id FROM study_paths WHERE code='POLITICS_6M'), 7, '毛中特 · 新民主主义革命', '党的指导思想形成史 + 三大法宝', '["徐涛毛中特 1-3 讲", "1000 题毛中特 1-30 题", "时间线：党的成立至 1949"]'::jsonb, '["毛泽东思想与中国特色社会主义"]'::jsonb, '["徐涛 强化班 毛中特", "学习强国 App"]'::jsonb),
((SELECT id FROM study_paths WHERE code='POLITICS_6M'), 8, '毛中特 · 社会主义改造与建设', '三大改造 + 探索时期理论成果', '["徐涛毛中特 4-6 讲", "1000 题毛中特 31-60 题", "对照《建国大业》补背景"]'::jsonb, '["毛泽东思想与中国特色社会主义"]'::jsonb, '["B 站: 党史百年纪录片", "腿姐 笔记"]'::jsonb),
((SELECT id FROM study_paths WHERE code='POLITICS_6M'), 9, '毛中特 · 邓三科', '邓 / 三个代表 / 科学发展观要点', '["徐涛毛中特 7-9 讲", "1000 题对应章节", "整理邓三科考点框架"]'::jsonb, '["毛泽东思想与中国特色社会主义"]'::jsonb, '["徐涛 强化班", "腿姐 技巧班"]'::jsonb),
((SELECT id FROM study_paths WHERE code='POLITICS_6M'), 10, '毛中特 · 新时代主线', '习思想十四个坚持 + 二十大报告', '["精读二十大报告全文 1 遍", "徐涛毛中特新时代部分", "1000 题对应章节"]'::jsonb, '["毛泽东思想与中国特色社会主义"]'::jsonb, '["求是网: 二十大报告", "学习强国"]'::jsonb),
((SELECT id FROM study_paths WHERE code='POLITICS_6M'), 11, '史纲 · 1840-1919 (旧民主主义)', '从鸦片战争到五四运动', '["徐涛史纲 1-5 讲", "1000 题史纲单选 30 题", "手绘旧民主主义时间轴"]'::jsonb, '["近代史纲要"]'::jsonb, '["徐涛 强化班 史纲", "B 站: 近代史 100 集"]'::jsonb),
((SELECT id FROM study_paths WHERE code='POLITICS_6M'), 12, '史纲 · 中共党史 (1921-1949)', '党的成立到建国前重大事件', '["徐涛史纲 6-9 讲", "1000 题史纲多选 + 错题集", "整理党的重大会议表"]'::jsonb, '["近代史纲要"]'::jsonb, '["党史 100 年", "腿姐 史纲口诀"]'::jsonb),
((SELECT id FROM study_paths WHERE code='POLITICS_6M'), 13, '史纲 · 建国后到改革开放', '过渡时期到改革开放 + 阶段复盘', '["徐涛史纲 10-12 讲", "1000 题史纲剩余题目", "默写建国后大事年表"]'::jsonb, '["近代史纲要"]'::jsonb, '["徐涛 史纲", "求是网"]'::jsonb),
((SELECT id FROM study_paths WHERE code='POLITICS_6M'), 14, '思修法基 · 道德观 + 价值观', '社会主义核心价值观 12 个关键词', '["徐涛思修法基 1-3 讲", "1000 题思修法基对应章", "整理核心价值观背诵卡"]'::jsonb, '["思想道德与法治"]'::jsonb, '["徐涛 思修法基 PDF", "学习强国"]'::jsonb),
((SELECT id FROM study_paths WHERE code='POLITICS_6M'), 15, '思修法基 · 法律基础', '宪法 + 民法 + 刑法常考条文', '["徐涛思修法基 4-6 讲", "1000 题法律部分", "条文卡片：罪刑法定 / 民事行为能力"]'::jsonb, '["思想道德与法治"]'::jsonb, '["腿姐 法律口诀", "宪法原文"]'::jsonb),
((SELECT id FROM study_paths WHERE code='POLITICS_6M'), 16, '当代世界经济与政治', '国际格局 + 大国博弈 + 中国外交', '["徐涛当代 2 讲", "1000 题当代部分", "汇总近 5 年外交重大事件"]'::jsonb, '["形势与政策"]'::jsonb, '["求是网: 大国关系专栏", "知乎: 国关入门"]'::jsonb),
((SELECT id FROM study_paths WHERE code='POLITICS_6M'), 17, '形势与政策 第一轮', '近一年时政速通', '["精读肖秀荣 形势与政策小册子", "汇总 10 个时政热词", "1000 题时政对应题目"]'::jsonb, '["形势与政策"]'::jsonb, '["肖秀荣 形势与政策", "学习强国"]'::jsonb),
((SELECT id FROM study_paths WHERE code='POLITICS_6M'), 18, '1000 题第二轮 · 马原 + 毛中特', '错题集中复盘 + 二刷正确率提升 15%', '["重做马原错题", "重做毛中特错题", "总结易错题型规律"]'::jsonb, '["马克思主义基本原理", "毛泽东思想与中国特色社会主义"]'::jsonb, '["1000 题二刷 Excel 模板", "Anki 政治牌组"]'::jsonb),
((SELECT id FROM study_paths WHERE code='POLITICS_6M'), 19, '1000 题第二轮 · 史纲 + 思修', '剩余两大块错题二刷', '["史纲错题重做", "思修法基错题重做", "对比正确率折线图"]'::jsonb, '["近代史纲要", "思想道德与法治"]'::jsonb, '["1000 题二刷", "B 站: 政治错题分析"]'::jsonb),
((SELECT id FROM study_paths WHERE code='POLITICS_6M'), 20, '冲刺 · 肖八选择题', '4 套肖八限时完成，错误率分析', '["每天 1 套肖八选择限时 30 分钟", "录入错题本 + Anki", "腿姐冲刺技巧课 1 小时"]'::jsonb, '["马克思主义基本原理"]'::jsonb, '["肖八", "腿姐 冲刺技巧班"]'::jsonb),
((SELECT id FROM study_paths WHERE code='POLITICS_6M'), 21, '冲刺 · 肖四选择 + 大题第一轮', '肖四选择全做 + 大题先理解再背', '["1 天 1 套肖四选择", "肖四大题马原 + 毛中特通读", "腿姐冲刺押题课"]'::jsonb, '["马克思主义基本原理", "毛泽东思想与中国特色社会主义"]'::jsonb, '["肖四", "腿姐 押题班"]'::jsonb),
((SELECT id FROM study_paths WHERE code='POLITICS_6M'), 22, '冲刺 · 大题第二轮背诵', '肖四史纲 + 思修 + 当代大题熟背', '["每天背 2 道肖四大题", "用艾宾浩斯曲线复习", "对比腿姐 / 徐涛预测大题"]'::jsonb, '["近代史纲要", "形势与政策"]'::jsonb, '["肖四 PDF", "腿姐 冲刺手册"]'::jsonb),
((SELECT id FROM study_paths WHERE code='POLITICS_6M'), 23, '冲刺 · 全真模考', '完整 3 小时模考 + 答题策略调整', '["限时模考肖四 1 套", "用答题卡按真题排版", "查漏补缺薄弱章节"]'::jsonb, '["马克思主义基本原理"]'::jsonb, '["真题答题卡 PDF", "B 站: 考场答题策略"]'::jsonb),
((SELECT id FROM study_paths WHERE code='POLITICS_6M'), 24, '冲刺 · 终极回顾 + 心态', '考前 7 天回顾错题 + 大题模板', '["错题本 + 大题模板回顾", "万能金句 / 套话清单", "调整作息 / 休息 1 天"]'::jsonb, '["形势与政策"]'::jsonb, '["腿姐 终极预测", "B 站: 考研心态调节"]'::jsonb);

-- ─── 3. ENGLISH_6M (24 周) ───────────────────────────────────────────────────
INSERT INTO study_path_weeks (path_id, week_no, title, goal, daily_tasks, focus_topics, resource_hints) VALUES
((SELECT id FROM study_paths WHERE code='ENGLISH_6M'), 1, '基础 · 词汇启动 + 长难句导论', '每日 100 词 + 5 句长难句拆解', '["背恋练有词 Unit 1-3", "刷 1 节田静长难句课", "整理 10 个高频词根"]'::jsonb, '["阅读理解"]'::jsonb, '["朱伟 恋练有词", "B 站: 田静 长难句"]'::jsonb),
((SELECT id FROM study_paths WHERE code='ENGLISH_6M'), 2, '基础 · 词汇 + 长难句 II', '巩固第 1 周词汇 + 阅读真题热身', '["背恋练有词 Unit 4-6", "做 1 篇 2005 年 Text 1 精读", "整理生词卡片"]'::jsonb, '["阅读理解"]'::jsonb, '["B 站: 唐迟 阅读思路课", "墨墨背单词"]'::jsonb),
((SELECT id FROM study_paths WHERE code='ENGLISH_6M'), 3, '真题精读 · 2005 年 Text 1-2', '精读 2 篇并整理出题模式', '["精读 Text 1 + 全文翻译", "精读 Text 2 + 题型分析", "总结出题点 (主旨 / 细节 / 推理)"]'::jsonb, '["阅读理解"]'::jsonb, '["唐迟 阅读真题精讲 (B 站)", "黄皮书 / 红宝书真题"]'::jsonb),
((SELECT id FROM study_paths WHERE code='ENGLISH_6M'), 4, '真题精读 · 2005 年 Text 3-4', '一周 2 篇精读 + 错题回顾', '["精读 Text 3-4", "复盘上周生词", "整理 5 个长难句模板"]'::jsonb, '["阅读理解"]'::jsonb, '["B 站: 唐迟 / 颉斌斌", "考研真相 / 黄皮书"]'::jsonb),
((SELECT id FROM study_paths WHERE code='ENGLISH_6M'), 5, '真题精读 · 2006 年阅读', '一周 4 篇 (2006) 精读', '["每天 1 篇 Text 精读 + 翻译", "整理生词卡片", "回看 1 节唐迟方法论"]'::jsonb, '["阅读理解"]'::jsonb, '["唐迟 阅读真题精讲", "墨墨背单词"]'::jsonb),
((SELECT id FROM study_paths WHERE code='ENGLISH_6M'), 6, '真题精读 · 2007 年阅读', '4 篇精读 + 题型规律总结', '["每天 1 篇 Text 精读", "汇总当年高频生词", "每篇做错题归因"]'::jsonb, '["阅读理解"]'::jsonb, '["黄皮书 PDF", "B 站: 颉斌斌"]'::jsonb),
((SELECT id FROM study_paths WHERE code='ENGLISH_6M'), 7, '真题精读 · 2008-2009 年阅读', '2 年 8 篇集中训练', '["每天 1 篇 Text 精读", "做 1 套完型 (2008/2009)", "整理同义替换词表"]'::jsonb, '["阅读理解", "完形填空"]'::jsonb, '["黄皮书", "B 站: 完型 易熙人"]'::jsonb),
((SELECT id FROM study_paths WHERE code='ENGLISH_6M'), 8, '真题精读 · 2010-2011 年阅读', '8 篇精读 + 写作热身', '["每天 1 篇 Text 精读", "看王江涛小作文导论", "整理 5 个万能句式"]'::jsonb, '["阅读理解", "写作"]'::jsonb, '["王江涛 小作文模板", "颉斌斌 写作课"]'::jsonb),
((SELECT id FROM study_paths WHERE code='ENGLISH_6M'), 9, '真题精读 · 2012-2013 年阅读', '完整 2 年阅读 + 翻译入门', '["每天 1 篇 Text 精读", "做 1 篇翻译 (2012)", "看唐静翻译方法 2 节"]'::jsonb, '["阅读理解", "翻译"]'::jsonb, '["唐静 翻译 (B 站)", "黄皮书"]'::jsonb),
((SELECT id FROM study_paths WHERE code='ENGLISH_6M'), 10, '真题精读 · 2014-2015 年阅读', '8 篇精读 + 翻译 2 篇', '["每天 1 篇 Text 精读", "翻译 2014/2015 长难句", "回顾近期错题"]'::jsonb, '["阅读理解", "翻译"]'::jsonb, '["唐静 翻译", "黄皮书"]'::jsonb),
((SELECT id FROM study_paths WHERE code='ENGLISH_6M'), 11, '真题精读 · 2016-2017 年阅读', '8 篇精读 + 完形精练', '["每天 1 篇 Text 精读", "做完形 2016/2017", "整理高频固定搭配"]'::jsonb, '["阅读理解", "完形填空"]'::jsonb, '["B 站: 易熙人 完形", "墨墨"]'::jsonb),
((SELECT id FROM study_paths WHERE code='ENGLISH_6M'), 12, '真题精读 · 2018-2019 年阅读', '近年真题质量更高，重点训练', '["每天 1 篇 Text 精读 + 全译", "整理 10 个长难句拆解", "梳理新题型解题套路"]'::jsonb, '["阅读理解", "新题型"]'::jsonb, '["唐迟 阅读 + 新题型", "黄皮书"]'::jsonb),
((SELECT id FROM study_paths WHERE code='ENGLISH_6M'), 13, '真题精读 · 2020-2021 年阅读', '近 2 年阅读 + 大作文起步', '["每天 1 篇 Text 精读", "看王江涛大作文 5 节", "背 1 段范文"]'::jsonb, '["阅读理解", "写作"]'::jsonb, '["王江涛 大作文模板", "颉斌斌 写作课"]'::jsonb),
((SELECT id FROM study_paths WHERE code='ENGLISH_6M'), 14, '真题精读 · 2022 年阅读 + 翻译', '近年阅读 + 翻译完整训练', '["精读 2022 阅读 4 篇", "做 2022 翻译", "整理近 3 年高频词"]'::jsonb, '["阅读理解", "翻译"]'::jsonb, '["黄皮书 2022 真题", "唐静 翻译"]'::jsonb),
((SELECT id FROM study_paths WHERE code='ENGLISH_6M'), 15, '真题精读 · 2023 年阅读 + 新题型', '完整 2023 年训练', '["精读 2023 阅读", "做 2023 新题型", "总结新题型解题模板"]'::jsonb, '["阅读理解", "新题型"]'::jsonb, '["唐迟 新题型", "黄皮书"]'::jsonb),
((SELECT id FROM study_paths WHERE code='ENGLISH_6M'), 16, '真题精读 · 2024 年阅读全卷', '最新 1 年真题全卷训练', '["完整 2024 真题限时 3 小时", "复盘所有错题", "整理本年生词清单"]'::jsonb, '["阅读理解", "完形填空", "翻译", "写作"]'::jsonb, '["黄皮书 2024", "B 站: 何凯文 / 唐迟"]'::jsonb),
((SELECT id FROM study_paths WHERE code='ENGLISH_6M'), 17, '阅读二刷 · 2010-2014 年', '近 10 年错题二刷', '["每天重做 1 篇近年 Text", "对比第一次答案 + 错因", "整理可复用模板句"]'::jsonb, '["阅读理解"]'::jsonb, '["错题 Excel 模板", "墨墨 / Anki"]'::jsonb),
((SELECT id FROM study_paths WHERE code='ENGLISH_6M'), 18, '阅读二刷 · 2015-2019 年', '继续二刷 + 完形二刷', '["每天 1 篇 Text 二刷", "完形二刷 2 套", "对比正确率折线"]'::jsonb, '["阅读理解", "完形填空"]'::jsonb, '["黄皮书", "B 站: 易熙人"]'::jsonb),
((SELECT id FROM study_paths WHERE code='ENGLISH_6M'), 19, '阅读二刷 · 2020-2024 + 新题型集训', '近 5 年 + 新题型专项', '["每天 1 篇 Text 二刷", "新题型 5 套限时训练", "整理新题型 5 种题型套路"]'::jsonb, '["阅读理解", "新题型"]'::jsonb, '["唐迟 新题型", "黄皮书"]'::jsonb),
((SELECT id FROM study_paths WHERE code='ENGLISH_6M'), 20, '写作专项 · 小作文 10 篇', '通知 / 建议 / 道歉 / 推荐信全覆盖', '["每天 1 篇小作文 (王江涛模板)", "对比标准范文修改", "背 1 段万能开头/结尾"]'::jsonb, '["写作"]'::jsonb, '["王江涛 满分写作", "颉斌斌 写作课"]'::jsonb),
((SELECT id FROM study_paths WHERE code='ENGLISH_6M'), 21, '写作专项 · 大作文 10 篇', '图画 / 图表 / 议论文模版打磨', '["每天 1 篇大作文限时 30 分钟", "整理 5 段万能模板", "对比往年高分范文"]'::jsonb, '["写作"]'::jsonb, '["王江涛 大作文", "颉斌斌 模板拆解"]'::jsonb),
((SELECT id FROM study_paths WHERE code='ENGLISH_6M'), 22, '翻译专项 + 完形冲刺', '翻译 10 句 + 完形 5 套', '["每天翻译 5 句长难句", "完形 5 套限时 18 分钟", "整理翻译高频固定搭配"]'::jsonb, '["翻译", "完形填空"]'::jsonb, '["唐静 翻译", "易熙人 完形"]'::jsonb),
((SELECT id FROM study_paths WHERE code='ENGLISH_6M'), 23, '全真模考 · 2 套真题', '完整 3 小时模考 + 复盘', '["1 天 1 套真题完整模考", "复盘所有错题 + 翻译润色", "整理终极写作模板"]'::jsonb, '["阅读理解", "写作", "翻译"]'::jsonb, '["黄皮书 真题", "B 站: 何凯文 押题"]'::jsonb),
((SELECT id FROM study_paths WHERE code='ENGLISH_6M'), 24, '考前回顾 + 心态调整', '生词 / 模板 / 解题套路终极回顾', '["生词清单整体复习", "写作模板 + 长难句库再读", "提前体验考场流程 + 心态调节"]'::jsonb, '["写作", "阅读理解"]'::jsonb, '["王江涛 押题作文", "B 站: 考研心态频道"]'::jsonb);

-- ─── 4. MATH_12M (36 周) ─────────────────────────────────────────────────────
INSERT INTO study_path_weeks (path_id, week_no, title, goal, daily_tasks, focus_topics, resource_hints) VALUES
((SELECT id FROM study_paths WHERE code='MATH_12M'), 1, '基础 · 极限与连续', '极限定义 / 无穷小 / 连续性', '["精读同济高数第 1 章", "看张宇基础 30 讲 Ch1", "做配套习题 30 题"]'::jsonb, '["高等数学"]'::jsonb, '["张宇 基础 30 讲", "同济高等数学 第七版"]'::jsonb),
((SELECT id FROM study_paths WHERE code='MATH_12M'), 2, '基础 · 导数与微分', '导数定义 / 求导法则 / 微分中值定理', '["同济高数 Ch2-3", "张宇 30 讲 Ch2", "做配套习题 40 题"]'::jsonb, '["高等数学"]'::jsonb, '["B 站: 张宇 基础课", "同济高数"]'::jsonb),
((SELECT id FROM study_paths WHERE code='MATH_12M'), 3, '基础 · 不定积分', '基本积分公式 + 三大方法 (换元 / 分部 / 有理式)', '["同济高数 Ch4", "张宇 30 讲 Ch3", "做不定积分 50 题"]'::jsonb, '["高等数学"]'::jsonb, '["张宇 30 讲", "汤家凤 1800 题"]'::jsonb),
((SELECT id FROM study_paths WHERE code='MATH_12M'), 4, '基础 · 定积分与反常积分', '定积分定义 + 牛顿-莱布尼茨 + 反常收敛', '["同济高数 Ch5", "30 讲 Ch4", "做 30 题定积分应用"]'::jsonb, '["高等数学"]'::jsonb, '["汤家凤 高数辅导讲义", "B 站 张宇"]'::jsonb),
((SELECT id FROM study_paths WHERE code='MATH_12M'), 5, '基础 · 微分方程', '一阶 / 高阶常系数线性方程通解', '["同济高数 Ch7", "张宇 30 讲 Ch6", "做微分方程 30 题"]'::jsonb, '["高等数学"]'::jsonb, '["张宇 基础 30 讲", "1800 题 基础部分"]'::jsonb),
((SELECT id FROM study_paths WHERE code='MATH_12M'), 6, '基础 · 多元函数微分', '偏导 / 全微分 / 多元复合 / 隐函数', '["同济下册 Ch9-10", "30 讲对应章节", "做 30 题综合"]'::jsonb, '["高等数学"]'::jsonb, '["同济高数 下册", "张宇 30 讲"]'::jsonb),
((SELECT id FROM study_paths WHERE code='MATH_12M'), 7, '基础 · 二重 / 三重积分 + 曲线曲面积分', '换序 / 极坐标 / 球面坐标 + 第一类积分', '["同济下册 Ch10-11", "张宇 30 讲", "做 40 题积分专项"]'::jsonb, '["高等数学"]'::jsonb, '["B 站: 张宇 30 讲", "1800 题"]'::jsonb),
((SELECT id FROM study_paths WHERE code='MATH_12M'), 8, '基础 · 无穷级数', '数项 / 幂级数 / 傅里叶 (数一)', '["同济下册 Ch12", "30 讲级数章节", "做幂级数 30 题"]'::jsonb, '["高等数学"]'::jsonb, '["张宇 基础 30 讲", "1800 题"]'::jsonb),
((SELECT id FROM study_paths WHERE code='MATH_12M'), 9, '基础 · 线代 (行列式 + 矩阵)', '行列式 / 矩阵运算 / 逆 / 秩', '["李永乐线代讲义 Ch1-2", "做矩阵 50 题", "整理行列式典型题型"]'::jsonb, '["线性代数"]'::jsonb, '["李永乐 线代讲义", "B 站 李永乐"]'::jsonb),
((SELECT id FROM study_paths WHERE code='MATH_12M'), 10, '基础 · 线代 (向量 + 方程组)', '线性相关 / 解结构 / 方程组通解', '["李永乐讲义 Ch3-4", "做方程组 40 题", "默写解结构定理"]'::jsonb, '["线性代数"]'::jsonb, '["李永乐 强化班 (B 站)", "1800 题 线代"]'::jsonb),
((SELECT id FROM study_paths WHERE code='MATH_12M'), 11, '基础 · 线代 (特征值 + 二次型)', '相似对角化 / 二次型化标准型', '["李永乐讲义 Ch5-6", "做特征值 30 题", "整理对角化条件"]'::jsonb, '["线性代数"]'::jsonb, '["李永乐 讲义", "B 站 李永乐"]'::jsonb),
((SELECT id FROM study_paths WHERE code='MATH_12M'), 12, '基础 · 概率论 + 第一阶段验收', '概率公理 / 古典 / 几何 + 阶段总复习', '["王式安概率讲义 Ch1-3", "做 30 题概率综合", "用一张表总结基础阶段"]'::jsonb, '["概率论与数理统计"]'::jsonb, '["王式安 概率 (B 站)", "1800 题"]'::jsonb),
((SELECT id FROM study_paths WHERE code='MATH_12M'), 13, '强化 · 高数 极限专题', '7 种未定式 + 等价无穷小综合应用', '["张宇 36 讲第 1 章", "做 660 题极限 50 题", "整理 10 种典型方法"]'::jsonb, '["高等数学"]'::jsonb, '["张宇 36 讲", "李林 660 题"]'::jsonb),
((SELECT id FROM study_paths WHERE code='MATH_12M'), 14, '强化 · 高数 导数 / 微分中值', '中值定理证明 + 单调性 / 凹凸性应用', '["张宇 36 讲 Ch2", "880 题导数 40 题", "中值定理证明 5 道"]'::jsonb, '["高等数学"]'::jsonb, '["张宇 36 讲", "李林 880 题"]'::jsonb),
((SELECT id FROM study_paths WHERE code='MATH_12M'), 15, '强化 · 高数 一元积分', '积分技巧 + 几何 / 物理应用', '["张宇 36 讲 Ch3", "880 题积分 40 题", "做 5 道经典应用题"]'::jsonb, '["高等数学"]'::jsonb, '["张宇 36 讲", "1800 题强化"]'::jsonb),
((SELECT id FROM study_paths WHERE code='MATH_12M'), 16, '强化 · 高数 多元微积分', '梯度 / 散度 / 旋度 (数一) + 多元极值', '["张宇 36 讲 Ch5", "880 题多元 40 题", "整理多元极值求法清单"]'::jsonb, '["高等数学"]'::jsonb, '["张宇 36 讲", "1800 题"]'::jsonb),
((SELECT id FROM study_paths WHERE code='MATH_12M'), 17, '强化 · 高数 级数 + 微分方程', '级数收敛性 + 微分方程综合', '["张宇 36 讲对应章", "880 题级数 + 微分方程", "整理级数判敛流程图"]'::jsonb, '["高等数学"]'::jsonb, '["B 站 张宇", "660 题"]'::jsonb),
((SELECT id FROM study_paths WHERE code='MATH_12M'), 18, '强化 · 线代 (李永乐强化班)', '矩阵 / 方程组综合大题', '["李永乐强化班线代上半", "880 题线代 50 题", "整理矩阵分块技巧"]'::jsonb, '["线性代数"]'::jsonb, '["李永乐 强化班 (B 站)", "880 题"]'::jsonb),
((SELECT id FROM study_paths WHERE code='MATH_12M'), 19, '强化 · 线代 (特征值 + 二次型)', '相似对角化 + 二次型综合大题', '["李永乐强化班线代下半", "880 题线代剩余", "整理二次型规范型 / 标准型对比"]'::jsonb, '["线性代数"]'::jsonb, '["李永乐 强化班", "880 题"]'::jsonb),
((SELECT id FROM study_paths WHERE code='MATH_12M'), 20, '强化 · 概率 (一元分布 + 数字特征)', '常见分布 + 期望 / 方差综合', '["王式安强化班概率上半", "880 题概率 30 题", "整理 6 大常见分布速查表"]'::jsonb, '["概率论与数理统计"]'::jsonb, '["王式安 强化班", "880 题"]'::jsonb),
((SELECT id FROM study_paths WHERE code='MATH_12M'), 21, '强化 · 概率 (多元分布 + 大数定律)', '边缘 / 条件分布 + 中心极限', '["王式安强化班概率下半", "880 题概率剩余", "整理参数估计 / 假设检验框架"]'::jsonb, '["概率论与数理统计"]'::jsonb, '["王式安 强化班", "1800 题"]'::jsonb),
((SELECT id FROM study_paths WHERE code='MATH_12M'), 22, '强化 · 660 / 880 综合冲刺 I', '660 题二刷 + 880 题查漏', '["每天 30 题 660 / 880 综合", "整理常考题型 Top 10", "复盘 5 道经典证明题"]'::jsonb, '["高等数学", "线性代数"]'::jsonb, '["660 题", "880 题"]'::jsonb),
((SELECT id FROM study_paths WHERE code='MATH_12M'), 23, '强化 · 660 / 880 综合冲刺 II', '继续二刷 + 错题深度归因', '["每天 30 题综合", "整理 Top 20 易错题", "重做近 5 年真题选 / 填"]'::jsonb, '["高等数学", "线性代数", "概率论与数理统计"]'::jsonb, '["660 题", "880 题"]'::jsonb),
((SELECT id FROM study_paths WHERE code='MATH_12M'), 24, '强化 · 阶段验收 + 第二轮总结', '强化阶段总复盘 + 真题热身', '["做 1 套 2010 年真题热身", "整理强化阶段笔记 1 本", "标记三轮重点章节"]'::jsonb, '["高等数学", "线性代数", "概率论与数理统计"]'::jsonb, '["历年真题分卷", "笔记整理 (notion / GoodNotes)"]'::jsonb),
((SELECT id FROM study_paths WHERE code='MATH_12M'), 25, '真题 · 1995-2000 年', '6 套老真题打基础', '["每天 1 套真题限时 3 小时", "全题精讲对照解析", "整理高频题型"]'::jsonb, '["高等数学"]'::jsonb, '["张宇 真题大全解", "汤家凤 真题"]'::jsonb),
((SELECT id FROM study_paths WHERE code='MATH_12M'), 26, '真题 · 2001-2005 年', '5 套真题 + 错题归因', '["1 天 1 套真题", "错题分类记录", "再听 1 节相关强化课"]'::jsonb, '["高等数学", "线性代数"]'::jsonb, '["真题大全解", "B 站 张宇"]'::jsonb),
((SELECT id FROM study_paths WHERE code='MATH_12M'), 27, '真题 · 2006-2010 年', '5 套真题 + 综合分析', '["1 天 1 套真题", "整理近年大题套路", "薄弱章节回炉"]'::jsonb, '["高等数学", "概率论与数理统计"]'::jsonb, '["真题分卷 PDF", "汤家凤 真题精讲"]'::jsonb),
((SELECT id FROM study_paths WHERE code='MATH_12M'), 28, '真题 · 2011-2015 年', '5 套真题 + 重点整理', '["1 天 1 套真题", "整理证明题模板", "整理选填易错点"]'::jsonb, '["高等数学", "线性代数"]'::jsonb, '["真题分卷 PDF", "B 站 张宇 真题班"]'::jsonb),
((SELECT id FROM study_paths WHERE code='MATH_12M'), 29, '真题 · 2016-2020 年', '近年真题难度上升集中训练', '["1 天 1 套真题", "整理近年热点题", "复盘 5 道高频证明题"]'::jsonb, '["高等数学", "线性代数", "概率论与数理统计"]'::jsonb, '["真题大全解", "汤家凤 真题精讲"]'::jsonb),
((SELECT id FROM study_paths WHERE code='MATH_12M'), 30, '真题 · 2021-2024 年', '最新 4 年真题精打细算', '["1 天 1 套真题", "整理 2021 / 2022 难题", "标记考点新趋势"]'::jsonb, '["高等数学", "线性代数", "概率论与数理统计"]'::jsonb, '["真题大全解", "B 站 何老师 / 武忠祥"]'::jsonb),
((SELECT id FROM study_paths WHERE code='MATH_12M'), 31, '模拟 · 张宇 4 套卷', '张宇 4 套卷限时模拟', '["1 天 1 套限时 3 小时", "对照解析复盘", "整理张宇典型陷阱题"]'::jsonb, '["高等数学"]'::jsonb, '["张宇 终极预测 8 套卷", "B 站 张宇"]'::jsonb),
((SELECT id FROM study_paths WHERE code='MATH_12M'), 32, '模拟 · 李林 6 + 4 套卷', '李林模拟 + 押题倾向分析', '["1 天 1 套李林限时模拟", "汇总李林常考点", "对比真题与模拟难度"]'::jsonb, '["高等数学", "概率论与数理统计"]'::jsonb, '["李林 6 套卷 / 4 套卷", "B 站 李林"]'::jsonb),
((SELECT id FROM study_paths WHERE code='MATH_12M'), 33, '模拟 · 合工大共创 + 超越', '高质量模拟卷强度训练', '["1 天 1 套合工大模拟", "整理高难度证明题", "查漏补缺薄弱知识点"]'::jsonb, '["高等数学", "线性代数"]'::jsonb, '["合工大共创 / 超越 5 套", "知乎: 数学模拟卷推荐"]'::jsonb),
((SELECT id FROM study_paths WHERE code='MATH_12M'), 34, '冲刺 · 错题集中复盘', '错题本 + 真题归类终极复习', '["分专题 (极限/线代/概率) 复盘错题", "重做 5 道经典证明题", "更新错题模板答题套路"]'::jsonb, '["高等数学", "线性代数", "概率论与数理统计"]'::jsonb, '["错题 Excel 模板", "Anki 数学卡片"]'::jsonb),
((SELECT id FROM study_paths WHERE code='MATH_12M'), 35, '冲刺 · 全真模考 (终极)', '完整 3 小时模考 + 时间分配训练', '["1 天 1 套终极模拟", "复盘解答步骤完整度", "调整答题时间分配"]'::jsonb, '["高等数学"]'::jsonb, '["合工大 / 张宇 / 李林", "B 站 数学冲刺押题"]'::jsonb),
((SELECT id FROM study_paths WHERE code='MATH_12M'), 36, '考前回顾 + 心态调整', '公式 / 错题 / 答题模版终极回顾', '["公式手册整体复习", "错题本最后一遍", "提前体验考场流程 + 心态调节"]'::jsonb, '["高等数学", "线性代数", "概率论与数理统计"]'::jsonb, '["公式速查手册", "B 站: 考研心态调节"]'::jsonb);

-- ─── 5. CS408_12M (36 周) ────────────────────────────────────────────────────
INSERT INTO study_path_weeks (path_id, week_no, title, goal, daily_tasks, focus_topics, resource_hints) VALUES
((SELECT id FROM study_paths WHERE code='CS408_12M'), 1, '一轮 · 数据结构 1 (绪论 + 线性表)', '数据结构基本概念 + 顺序表 / 链表', '["精读王道数据结构 Ch1-2", "做配套课后题 30 题", "看王道公开课第 1-3 讲"]'::jsonb, '["数据结构", "线性表"]'::jsonb, '["王道 数据结构 (2024 版)", "B 站搜索: 王道 数据结构"]'::jsonb),
((SELECT id FROM study_paths WHERE code='CS408_12M'), 2, '一轮 · 数据结构 2 (栈 + 队列 + 串)', '栈 / 队列实现 + 串模式匹配 KMP', '["王道数据结构 Ch3-4", "课后题 30 题", "手撕 KMP next 数组"]'::jsonb, '["数据结构", "栈和队列"]'::jsonb, '["B 站: 王道 王卓 数据结构", "MIT OCW 6.006"]'::jsonb),
((SELECT id FROM study_paths WHERE code='CS408_12M'), 3, '一轮 · 数据结构 3 (树与二叉树)', '二叉树遍历 + 线索 + 哈夫曼', '["王道 Ch5", "课后题 40 题", "C 语言手撕二叉树三种遍历"]'::jsonb, '["数据结构", "树与二叉树"]'::jsonb, '["浙大 MOOC 数据结构", "GitHub: CS-Notes"]'::jsonb),
((SELECT id FROM study_paths WHERE code='CS408_12M'), 4, '一轮 · 数据结构 4 (图)', '图存储 + DFS/BFS + 最短路 + 拓扑', '["王道 Ch6", "课后题 40 题", "Dijkstra + Floyd 手写代码"]'::jsonb, '["数据结构", "图"]'::jsonb, '["B 站: 王道 图", "GeeksforGeeks Graph"]'::jsonb),
((SELECT id FROM study_paths WHERE code='CS408_12M'), 5, '一轮 · 数据结构 5 (查找 + 排序)', '哈希 / 二叉排序树 + 八大排序', '["王道 Ch7-8", "课后题 50 题", "手撕快排 / 归并 / 堆排"]'::jsonb, '["数据结构", "查找", "排序"]'::jsonb, '["B 站: 王道 排序", "VisuAlgo 可视化"]'::jsonb),
((SELECT id FROM study_paths WHERE code='CS408_12M'), 6, '一轮 · 组成原理 1 (数据表示 + 运算器)', '原码 / 反码 / 补码 + 浮点 IEEE 754', '["王道组成原理 Ch1-2", "课后题 30 题", "整理浮点数表示卡片"]'::jsonb, '["计算机组成原理", "数据表示"]'::jsonb, '["B 站: 王道 组成原理", "唐朔飞 计组教材"]'::jsonb),
((SELECT id FROM study_paths WHERE code='CS408_12M'), 7, '一轮 · 组成原理 2 (存储系统)', '主存 / Cache / 虚存 + 局部性原理', '["王道组成 Ch3", "课后题 40 题", "整理 Cache 三种映射方式对比表"]'::jsonb, '["计算机组成原理", "存储系统"]'::jsonb, '["B 站: 王道 存储", "CSAPP Chapter 6"]'::jsonb),
((SELECT id FROM study_paths WHERE code='CS408_12M'), 8, '一轮 · 组成原理 3 (指令系统 + CPU)', '指令格式 + 寻址方式 + CPU 数据通路', '["王道组成 Ch4-5", "课后题 50 题", "整理流水线冒险与解决方案"]'::jsonb, '["计算机组成原理", "指令系统", "中央处理器"]'::jsonb, '["B 站: 王道", "Patterson & Hennessy 计组教材"]'::jsonb),
((SELECT id FROM study_paths WHERE code='CS408_12M'), 9, '一轮 · 操作系统 1 (进程 + 线程)', '进程状态 + PCB + 线程模型', '["王道操作系统 Ch1-2", "课后题 40 题", "整理进程通信 5 种方式"]'::jsonb, '["操作系统", "进程管理"]'::jsonb, '["B 站: 王道 操作系统", "MIT 6.S081"]'::jsonb),
((SELECT id FROM study_paths WHERE code='CS408_12M'), 10, '一轮 · 操作系统 2 (调度 + 同步)', 'PV 操作 + 经典同步问题 + 死锁', '["王道操作系统 Ch3", "课后题 50 题", "手写生产者消费者 / 读者写者"]'::jsonb, '["操作系统", "处理机调度"]'::jsonb, '["B 站: 王道", "OSTEP 中文版"]'::jsonb),
((SELECT id FROM study_paths WHERE code='CS408_12M'), 11, '一轮 · 操作系统 3 (内存 + 文件系统)', '分段 / 分页 + 虚存 + 文件目录', '["王道操作系统 Ch4-5", "课后题 50 题", "整理页面置换算法对比表"]'::jsonb, '["操作系统", "内存管理", "文件管理"]'::jsonb, '["B 站: 王道", "OSTEP 中文版"]'::jsonb),
((SELECT id FROM study_paths WHERE code='CS408_12M'), 12, '一轮 · 计网 4 层架构', '物理 / 数据链路 / 网络 / 传输 + 应用', '["王道计算机网络 Ch1-5", "课后题 60 题", "整理 TCP 三次握手 / 四次挥手图"]'::jsonb, '["计算机网络", "网络层", "传输层"]'::jsonb, '["B 站: 王道 计网", "谢希仁 计算机网络教材"]'::jsonb),
((SELECT id FROM study_paths WHERE code='CS408_12M'), 13, '二轮 · 数据结构 (线性 + 树)', '线性表 / 栈队列 / 树二轮强化', '["王道数据结构二轮 Ch1-5", "做强化题集 50 题", "总结链表 5 大类编程套路"]'::jsonb, '["数据结构", "线性表", "树与二叉树"]'::jsonb, '["王道 强化课", "天勤 数据结构"]'::jsonb),
((SELECT id FROM study_paths WHERE code='CS408_12M'), 14, '二轮 · 数据结构 (图 + 查找 + 排序)', '图算法 + 排序综合应用题', '["王道二轮 Ch6-8", "强化题集 50 题", "整理最小生成树 / 最短路径 / 排序对比表"]'::jsonb, '["数据结构", "图", "查找"]'::jsonb, '["王道 强化班", "天勤强化"]'::jsonb),
((SELECT id FROM study_paths WHERE code='CS408_12M'), 15, '二轮 · 数据结构算法专项 (C 编程)', '408 大题算法题 (C 实现) 集训', '["每天手写 2 道算法大题", "录入 GitHub 仓库", "对比答案 + 复盘时间复杂度"]'::jsonb, '["数据结构", "排序"]'::jsonb, '["GitHub: 408 算法题汇总", "LeetCode 算法面试"]'::jsonb),
((SELECT id FROM study_paths WHERE code='CS408_12M'), 16, '二轮 · 组成原理 (数据表示 + 存储)', '强化数据表示 + Cache 综合应用', '["王道组成二轮 Ch1-3", "强化题 50 题", "Cache 命中率综合题精练"]'::jsonb, '["计算机组成原理", "存储系统"]'::jsonb, '["王道 强化班", "唐朔飞 教材"]'::jsonb),
((SELECT id FROM study_paths WHERE code='CS408_12M'), 17, '二轮 · 组成原理 (CPU + 流水线 + IO)', 'CPU 数据通路 + 流水线 + IO 中断', '["王道组成二轮 Ch4-7", "强化题 60 题", "整理 IO 三种方式对比表"]'::jsonb, '["计算机组成原理", "指令系统", "中央处理器"]'::jsonb, '["王道 强化班", "B 站: 唐朔飞 计组"]'::jsonb),
((SELECT id FROM study_paths WHERE code='CS408_12M'), 18, '二轮 · 操作系统 (进程 + 同步)', '进程同步 + 死锁强化', '["王道操作系统二轮 Ch1-3", "强化题 60 题", "整理 PV 操作经典模板"]'::jsonb, '["操作系统", "进程管理"]'::jsonb, '["王道 强化班", "OSTEP 进程章节"]'::jsonb),
((SELECT id FROM study_paths WHERE code='CS408_12M'), 19, '二轮 · 操作系统 (内存 + 文件 + IO)', '虚存 + 文件 + 设备管理强化', '["王道操作系统二轮 Ch4-6", "强化题 60 题", "整理页面置换 / 文件结构对比"]'::jsonb, '["操作系统", "内存管理", "文件管理"]'::jsonb, '["王道 强化班", "OSTEP 内存 + 文件章节"]'::jsonb),
((SELECT id FROM study_paths WHERE code='CS408_12M'), 20, '二轮 · 计算机网络 (链路层 + 网络层)', 'CSMA/CD + IP 分片 + 路由协议', '["王道计网二轮 Ch3-4", "强化题 50 题", "整理 IPv4 分片 + RIP/OSPF 对比"]'::jsonb, '["计算机网络", "网络层"]'::jsonb, '["王道 计网强化", "谢希仁 教材 Ch3-4"]'::jsonb),
((SELECT id FROM study_paths WHERE code='CS408_12M'), 21, '二轮 · 计算机网络 (传输层 + 应用层)', 'TCP 拥塞控制 + HTTP / DNS', '["王道计网二轮 Ch5-6", "强化题 50 题", "整理 TCP 拥塞控制 4 个阶段"]'::jsonb, '["计算机网络", "传输层"]'::jsonb, '["B 站: 王道 计网", "CS61c (UCB)"]'::jsonb),
((SELECT id FROM study_paths WHERE code='CS408_12M'), 22, '二轮 · 综合大题专项 (数据结构)', '近 10 年数据结构大题精练', '["每天 1 道数据结构大题", "C 代码上机调试", "对比标准答案归纳得分点"]'::jsonb, '["数据结构", "图"]'::jsonb, '["408 真题大题汇总", "GitHub 408 仓库"]'::jsonb),
((SELECT id FROM study_paths WHERE code='CS408_12M'), 23, '二轮 · 综合大题专项 (组成 + OS)', '组成 + OS 综合大题集训', '["每天 1 道组成 / OS 综合题", "整理大题答题模板", "重做 5 道经典综合题"]'::jsonb, '["计算机组成原理", "操作系统"]'::jsonb, '["408 真题大题汇总", "王道 真题汇编"]'::jsonb),
((SELECT id FROM study_paths WHERE code='CS408_12M'), 24, '二轮 · 阶段验收 + 第三轮预热', '强化阶段总复盘 + 真题热身', '["做 1 套 2010 年 408 真题", "整理强化阶段错题本", "标记三轮重点章节"]'::jsonb, '["数据结构", "计算机组成原理", "操作系统", "计算机网络"]'::jsonb, '["408 真题分卷 PDF", "笔记整理工具"]'::jsonb),
((SELECT id FROM study_paths WHERE code='CS408_12M'), 25, '真题 · 2009-2011 年', '408 最早 3 年真题精练', '["1 天 1 套真题限时 3 小时", "对照解析全面复盘", "整理高频考点 Top 10"]'::jsonb, '["数据结构", "计算机组成原理"]'::jsonb, '["王道 真题汇编", "B 站: 王道 真题精讲"]'::jsonb),
((SELECT id FROM study_paths WHERE code='CS408_12M'), 26, '真题 · 2012-2014 年', '3 年真题 + 错题深度分析', '["1 天 1 套真题", "错题分类录入 Excel", "再听 1 节相关强化课"]'::jsonb, '["操作系统", "计算机网络"]'::jsonb, '["王道真题汇编", "B 站 王道"]'::jsonb),
((SELECT id FROM study_paths WHERE code='CS408_12M'), 27, '真题 · 2015-2017 年', '3 年真题 + 综合分析', '["1 天 1 套真题", "整理大题套路", "薄弱章节回炉"]'::jsonb, '["数据结构", "操作系统"]'::jsonb, '["408 真题 PDF", "知乎 408 真题专栏"]'::jsonb),
((SELECT id FROM study_paths WHERE code='CS408_12M'), 28, '真题 · 2018-2020 年', '3 年真题 + 难度升级训练', '["1 天 1 套真题", "整理近年大题套路", "重写 2019 算法大题"]'::jsonb, '["数据结构", "计算机组成原理"]'::jsonb, '["王道 真题汇编", "B 站 王道"]'::jsonb),
((SELECT id FROM study_paths WHERE code='CS408_12M'), 29, '真题 · 2021-2023 年', '近 3 年真题精打细算', '["1 天 1 套真题", "整理近年新考点", "标记考试趋势"]'::jsonb, '["计算机网络", "操作系统"]'::jsonb, '["王道 真题汇编", "B 站: 大雪菜 算法"]'::jsonb),
((SELECT id FROM study_paths WHERE code='CS408_12M'), 30, '真题 · 2024 + 错题二刷', '最新真题 + 历年错题二刷', '["完整 2024 真题模拟", "二刷历年错题 30 题", "整理算法大题 5 大套路"]'::jsonb, '["数据结构"]'::jsonb, '["王道 真题汇编 2025 版", "GitHub: 408 算法题汇总"]'::jsonb),
((SELECT id FROM study_paths WHERE code='CS408_12M'), 31, '模拟 · 王道 8 套模拟卷', '王道模拟卷限时训练', '["1 天 1 套王道模拟限时", "对照解析复盘", "整理王道典型陷阱题"]'::jsonb, '["数据结构", "计算机组成原理"]'::jsonb, '["王道 8 套模拟", "B 站: 王道 模拟卷讲解"]'::jsonb),
((SELECT id FROM study_paths WHERE code='CS408_12M'), 32, '模拟 · 天勤 + 海绵宝宝模拟', '其他高质量模拟卷强度训练', '["1 天 1 套模拟", "整理疑难大题", "查漏补缺薄弱知识点"]'::jsonb, '["操作系统", "计算机网络"]'::jsonb, '["天勤 模拟卷", "知乎: 408 模拟卷推荐"]'::jsonb),
((SELECT id FROM study_paths WHERE code='CS408_12M'), 33, '冲刺 · 算法大题专项', '近 10 年算法大题终极突击', '["每天 2 道算法大题", "代码完整调试", "对照得分点修改答案"]'::jsonb, '["数据结构"]'::jsonb, '["GitHub: 408 算法题汇总", "LeetCode 408 套题"]'::jsonb),
((SELECT id FROM study_paths WHERE code='CS408_12M'), 34, '冲刺 · 错题集中复盘', '错题本 + 真题归类终极复习', '["分专题复盘错题 (数据结构/OS/计组/计网)", "重做 5 道经典综合题", "更新错题模板答题套路"]'::jsonb, '["数据结构", "操作系统"]'::jsonb, '["错题 Excel 模板", "Anki 408 卡片"]'::jsonb),
((SELECT id FROM study_paths WHERE code='CS408_12M'), 35, '冲刺 · 全真模考 (终极)', '完整 3 小时模考 + 时间分配训练', '["1 天 1 套终极模拟卷", "复盘解答步骤完整度", "调整答题时间分配"]'::jsonb, '["计算机组成原理"]'::jsonb, '["王道 / 天勤 终极模拟", "B 站: 408 冲刺押题"]'::jsonb),
((SELECT id FROM study_paths WHERE code='CS408_12M'), 36, '考前回顾 + 心态调整', '公式 / 错题 / 答题模板终极回顾', '["公式手册整体复习", "算法模板最后一遍", "提前体验考场流程 + 心态调节"]'::jsonb, '["数据结构", "计算机组成原理", "操作系统", "计算机网络"]'::jsonb, '["王道速查手册", "B 站: 考研心态调节"]'::jsonb);

-- ─── 6. CS408_6M (24 周) ─────────────────────────────────────────────────────
INSERT INTO study_path_weeks (path_id, week_no, title, goal, daily_tasks, focus_topics, resource_hints) VALUES
((SELECT id FROM study_paths WHERE code='CS408_6M'), 1, '一轮加速 · 数据结构 (线性 + 树)', '快速过线性表 / 栈队列 / 树', '["王道数据结构 Ch1-5 速读", "每章末做 20 题", "整理一页纸思维导图"]'::jsonb, '["数据结构", "线性表", "树与二叉树"]'::jsonb, '["王道 数据结构", "B 站: 王道 数据结构"]'::jsonb),
((SELECT id FROM study_paths WHERE code='CS408_6M'), 2, '一轮加速 · 数据结构 (图 + 排序)', '图 + 查找 + 排序综合', '["王道数据结构 Ch6-8", "做 60 题课后题", "手撕快排 / 归并 / 堆排"]'::jsonb, '["数据结构", "图", "查找", "排序"]'::jsonb, '["B 站: 王道", "VisuAlgo 可视化"]'::jsonb),
((SELECT id FROM study_paths WHERE code='CS408_6M'), 3, '一轮加速 · 组成原理 (数据表示 + 存储)', '数据表示 + 存储系统 + Cache', '["王道组成原理 Ch1-3", "做 50 题课后题", "整理 Cache 命中率公式卡"]'::jsonb, '["计算机组成原理", "数据表示", "存储系统"]'::jsonb, '["王道 组成原理", "CSAPP Ch6"]'::jsonb),
((SELECT id FROM study_paths WHERE code='CS408_6M'), 4, '一轮加速 · 组成原理 (CPU + IO)', '指令系统 + CPU + IO 综合', '["王道组成 Ch4-7", "做 60 题课后题", "整理流水线冒险表"]'::jsonb, '["计算机组成原理", "指令系统", "中央处理器"]'::jsonb, '["B 站: 王道 组成", "Patterson 计组"]'::jsonb),
((SELECT id FROM study_paths WHERE code='CS408_6M'), 5, '一轮加速 · 操作系统', '进程 + 同步 + 内存 + 文件', '["王道操作系统 Ch1-6", "做 60 题课后题", "手写 PV 操作经典模板"]'::jsonb, '["操作系统", "进程管理", "内存管理"]'::jsonb, '["王道 操作系统", "OSTEP 中文版"]'::jsonb),
((SELECT id FROM study_paths WHERE code='CS408_6M'), 6, '一轮加速 · 计算机网络', '网络层 / 传输层 / 应用层综合', '["王道计网 Ch1-6", "做 60 题课后题", "整理 TCP / IP / HTTP 速查表"]'::jsonb, '["计算机网络", "网络层", "传输层"]'::jsonb, '["王道 计网", "谢希仁 计网教材"]'::jsonb),
((SELECT id FROM study_paths WHERE code='CS408_6M'), 7, '二轮 · 数据结构 (线性 + 树深挖)', '强化线性表 / 树 + 算法大题', '["王道数据结构强化 Ch1-5", "做强化题 50 题", "手写 2 道算法大题"]'::jsonb, '["数据结构", "线性表", "树与二叉树"]'::jsonb, '["王道 强化班", "天勤数据结构"]'::jsonb),
((SELECT id FROM study_paths WHERE code='CS408_6M'), 8, '二轮 · 数据结构 (图 + 排序)', '强化图 + 排序综合应用', '["王道数据结构强化 Ch6-8", "做强化题 60 题", "整理最小生成树 + 最短路径对比"]'::jsonb, '["数据结构", "图"]'::jsonb, '["B 站 王道强化", "天勤"]'::jsonb),
((SELECT id FROM study_paths WHERE code='CS408_6M'), 9, '二轮 · 数据结构算法专项', '近 10 年算法大题 (C 实现)', '["每天 2 道算法大题手写", "GitHub 仓库录入代码", "对比标准答案 + 复盘时间复杂度"]'::jsonb, '["数据结构", "排序"]'::jsonb, '["GitHub 408 算法题", "LeetCode 408 套题"]'::jsonb),
((SELECT id FROM study_paths WHERE code='CS408_6M'), 10, '二轮 · 组成原理 (数据 + 存储深挖)', '数据表示 + Cache 综合大题', '["王道组成强化 Ch1-3", "做强化题 50 题", "整理 Cache 综合大题模板"]'::jsonb, '["计算机组成原理", "存储系统"]'::jsonb, '["王道 强化班", "唐朔飞 计组"]'::jsonb),
((SELECT id FROM study_paths WHERE code='CS408_6M'), 11, '二轮 · 组成原理 (CPU + 流水线)', 'CPU 数据通路 + 流水线综合', '["王道组成强化 Ch4-7", "做强化题 60 题", "整理流水线 / IO 综合题"]'::jsonb, '["计算机组成原理", "指令系统", "中央处理器"]'::jsonb, '["王道 强化班", "B 站 唐朔飞"]'::jsonb),
((SELECT id FROM study_paths WHERE code='CS408_6M'), 12, '二轮 · 操作系统 (进程 + 同步)', '进程同步 + 死锁强化', '["王道操作系统强化 Ch1-3", "做强化题 60 题", "整理 PV 操作经典模板"]'::jsonb, '["操作系统", "进程管理"]'::jsonb, '["王道 强化班", "OSTEP 进程章节"]'::jsonb),
((SELECT id FROM study_paths WHERE code='CS408_6M'), 13, '二轮 · 操作系统 (内存 + 文件)', '虚存 + 文件 + 设备管理强化', '["王道操作系统强化 Ch4-6", "做强化题 60 题", "整理页面置换对比表"]'::jsonb, '["操作系统", "内存管理", "文件管理"]'::jsonb, '["王道 强化班", "OSTEP 内存 + 文件章节"]'::jsonb),
((SELECT id FROM study_paths WHERE code='CS408_6M'), 14, '二轮 · 计算机网络 (链路 + 网络层)', 'CSMA/CD + IP 分片 + 路由协议', '["王道计网强化 Ch3-4", "做强化题 50 题", "整理 IPv4 分片 + RIP/OSPF 对比"]'::jsonb, '["计算机网络", "网络层"]'::jsonb, '["王道 计网强化", "谢希仁 教材"]'::jsonb),
((SELECT id FROM study_paths WHERE code='CS408_6M'), 15, '二轮 · 计算机网络 (传输 + 应用)', 'TCP 拥塞控制 + HTTP / DNS', '["王道计网强化 Ch5-6", "做强化题 50 题", "整理 TCP 拥塞控制 4 阶段"]'::jsonb, '["计算机网络", "传输层"]'::jsonb, '["B 站 王道 计网", "CS61c (UCB)"]'::jsonb),
((SELECT id FROM study_paths WHERE code='CS408_6M'), 16, '二轮 · 综合大题专项', '近 10 年大题 + 答题模板', '["每天 2 道综合大题", "整理大题答题模板", "重做 5 道经典综合题"]'::jsonb, '["数据结构", "计算机组成原理"]'::jsonb, '["408 真题大题汇总", "王道 真题汇编"]'::jsonb),
((SELECT id FROM study_paths WHERE code='CS408_6M'), 17, '真题 · 2015-2018 年', '4 年真题精读 + 错题', '["1 天 1 套真题限时", "错题分类 Excel", "重听对应强化课"]'::jsonb, '["数据结构", "操作系统"]'::jsonb, '["王道 真题汇编", "B 站 王道 真题精讲"]'::jsonb),
((SELECT id FROM study_paths WHERE code='CS408_6M'), 18, '真题 · 2019-2021 年', '3 年真题 + 难度升级训练', '["1 天 1 套真题", "整理近年大题套路", "重写 2019 算法大题"]'::jsonb, '["数据结构", "计算机网络"]'::jsonb, '["王道 真题汇编", "知乎 408 专栏"]'::jsonb),
((SELECT id FROM study_paths WHERE code='CS408_6M'), 19, '真题 · 2022-2024 年', '近 3 年真题精打细算', '["1 天 1 套真题", "整理新考点", "标记考试趋势"]'::jsonb, '["计算机组成原理", "操作系统"]'::jsonb, '["王道 真题汇编 2025", "B 站: 大雪菜"]'::jsonb),
((SELECT id FROM study_paths WHERE code='CS408_6M'), 20, '模拟 · 王道 4 套模拟', '王道模拟卷限时', '["1 天 1 套王道模拟限时", "复盘错题模板", "整理王道典型陷阱"]'::jsonb, '["数据结构"]'::jsonb, '["王道 8 套模拟", "B 站: 王道 模拟卷讲解"]'::jsonb),
((SELECT id FROM study_paths WHERE code='CS408_6M'), 21, '模拟 · 天勤 + 海绵宝宝模拟', '其他高质量模拟卷强度训练', '["1 天 1 套模拟限时", "整理疑难大题", "查漏补缺薄弱知识点"]'::jsonb, '["操作系统", "计算机网络"]'::jsonb, '["天勤 模拟卷", "知乎: 408 模拟卷推荐"]'::jsonb),
((SELECT id FROM study_paths WHERE code='CS408_6M'), 22, '冲刺 · 算法大题终极突击', '近 10 年算法大题集中刷', '["每天 2 道算法大题", "代码完整调试", "对照得分点修改答案"]'::jsonb, '["数据结构"]'::jsonb, '["GitHub: 408 算法题", "LeetCode 408 套题"]'::jsonb),
((SELECT id FROM study_paths WHERE code='CS408_6M'), 23, '冲刺 · 错题集中复盘', '错题本 + 真题归类终极复习', '["分专题复盘错题 (数据结构/OS/计组/计网)", "重做 5 道经典综合题", "更新答题模板"]'::jsonb, '["数据结构", "操作系统"]'::jsonb, '["错题 Excel 模板", "Anki 408 卡片"]'::jsonb),
((SELECT id FROM study_paths WHERE code='CS408_6M'), 24, '考前回顾 + 心态调整', '公式 / 错题 / 答题模版终极回顾', '["公式手册整体复习", "算法模板最后一遍", "提前体验考场流程 + 心态调节"]'::jsonb, '["数据结构", "计算机组成原理", "操作系统", "计算机网络"]'::jsonb, '["王道速查手册", "B 站: 考研心态调节"]'::jsonb);
