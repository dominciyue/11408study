-- ============================================================================
-- V12: link-based 真题题库批量种子（2010-2024 共 15 年 × 4 学科）
-- 政治 570 + 英语一 750 + 数学一 345 + 408 615 ≈ 2280 道
-- external_url 指向 B 站搜索页（按"老师 + 年份 + 题号"动态拼接），
-- content 仅含人类可读题面摘要，options=NULL，answer 固定 'EXT_CORRECT'。
-- 前端 practice 页根据 external_url 非空走"外链 + 自评"分支。
-- node_id 通过运行时查询 knowledge_nodes 表，按学科轮转分配，
-- 不硬编码 ID，确保外键引用始终成立。
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 政治：2010-2024 × 38 题/年 = 570 道
-- 题号 1-16 单选 / 17-33 多选 / 34-38 分析题（统一按 CHOICE / MULTI_CHOICE 落库）
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    pol_nodes BIGINT[];
    pol_len INT;
    n BIGINT;
    yr INT;
    qno INT;
    url TEXT;
    ext_src TEXT;
    q_type VARCHAR(30);
    content_txt TEXT;
    keyword_enc TEXT;
BEGIN
    SELECT array_agg(kn.id ORDER BY kn.id)
      INTO pol_nodes
      FROM knowledge_nodes kn
      JOIN topics t ON kn.topic_id = t.id
      WHERE t.subject_id = 1;
    IF pol_nodes IS NULL OR array_length(pol_nodes, 1) = 0 THEN
        RAISE NOTICE 'V12 politics nodes empty, skip politics seed';
        RETURN;
    END IF;
    pol_len := array_length(pol_nodes, 1);
    FOR yr IN 2010..2024 LOOP
        FOR qno IN 1..38 LOOP
            n := pol_nodes[1 + ((yr * 100 + qno) % pol_len)];
            -- 关键词：肖秀荣 YYYY 政治真题 第N题
            keyword_enc := '%E8%82%96%E7%A7%80%E8%8D%A3%20'
                           || yr::text
                           || '%20%E6%94%BF%E6%B2%BB%E7%9C%9F%E9%A2%98%20%E7%AC%AC'
                           || qno::text
                           || '%E9%A2%98';
            url := 'https://search.bilibili.com/all?keyword=' || keyword_enc;
            ext_src := yr::text || ' 政治真题 · 肖秀荣解析';
            IF qno BETWEEN 17 AND 33 THEN
                q_type := 'MULTI_CHOICE';
                content_txt := yr::text || ' 考研政治真题 · 第 ' || qno::text
                               || ' 题（多选）：[多选题，请前往外部页面查看完整题面与选项]';
            ELSE
                q_type := 'CHOICE';
                content_txt := yr::text || ' 考研政治真题 · 第 ' || qno::text
                               || ' 题：[请前往外部页面查看完整题面与选项]';
            END IF;
            INSERT INTO quiz_questions (
                node_id, question_type, content, options, answer, explanation,
                source, external_url, external_source, year, question_number, created_at
            ) VALUES (
                n, q_type, content_txt, NULL, 'EXT_CORRECT',
                '详见外部解析视频/文章。',
                'real-exam-link', url, ext_src, yr, qno, CURRENT_TIMESTAMP
            );
        END LOOP;
    END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 英语一：2010-2024 × 50 题/年 = 750 道
-- 完形 1-20 / 阅读 21-40 / 新题型 41-45 / 翻译 46-50
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    eng_nodes BIGINT[];
    eng_len INT;
    n BIGINT;
    yr INT;
    qno INT;
    url TEXT;
    ext_src TEXT;
    content_txt TEXT;
    keyword_enc TEXT;
    section_label TEXT;
BEGIN
    SELECT array_agg(kn.id ORDER BY kn.id)
      INTO eng_nodes
      FROM knowledge_nodes kn
      JOIN topics t ON kn.topic_id = t.id
      WHERE t.subject_id = 2;
    IF eng_nodes IS NULL OR array_length(eng_nodes, 1) = 0 THEN
        RAISE NOTICE 'V12 english nodes empty, skip english seed';
        RETURN;
    END IF;
    eng_len := array_length(eng_nodes, 1);
    FOR yr IN 2010..2024 LOOP
        FOR qno IN 1..50 LOOP
            n := eng_nodes[1 + ((yr * 100 + qno) % eng_len)];
            -- 关键词：唐迟 YYYY 英语一 真题 第N题
            keyword_enc := '%E5%94%90%E8%BF%9F%20'
                           || yr::text
                           || '%20%E8%8B%B1%E8%AF%AD%E4%B8%80%20%E7%9C%9F%E9%A2%98%20%E7%AC%AC'
                           || qno::text
                           || '%E9%A2%98';
            url := 'https://search.bilibili.com/all?keyword=' || keyword_enc;
            ext_src := yr::text || ' 英语一真题 · 唐迟解析';
            IF qno BETWEEN 1 AND 20 THEN
                section_label := '完形填空';
            ELSIF qno BETWEEN 21 AND 40 THEN
                section_label := '阅读理解';
            ELSIF qno BETWEEN 41 AND 45 THEN
                section_label := '新题型';
            ELSE
                section_label := '翻译';
            END IF;
            content_txt := yr::text || ' 考研英语一真题 · 第 ' || qno::text
                           || ' 题（' || section_label
                           || '）：[请前往外部页面查看完整题面与选项]';
            INSERT INTO quiz_questions (
                node_id, question_type, content, options, answer, explanation,
                source, external_url, external_source, year, question_number, created_at
            ) VALUES (
                n, 'CHOICE', content_txt, NULL, 'EXT_CORRECT',
                '详见外部解析视频/文章。',
                'real-exam-link', url, ext_src, yr, qno, CURRENT_TIMESTAMP
            );
        END LOOP;
    END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 数学一：2010-2024 × 23 题/年 = 345 道
-- 选择 1-8 / 填空 9-14 / 解答 15-23
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    math_nodes BIGINT[];
    math_len INT;
    n BIGINT;
    yr INT;
    qno INT;
    url TEXT;
    ext_src TEXT;
    content_txt TEXT;
    keyword_enc TEXT;
    section_label TEXT;
BEGIN
    SELECT array_agg(kn.id ORDER BY kn.id)
      INTO math_nodes
      FROM knowledge_nodes kn
      JOIN topics t ON kn.topic_id = t.id
      WHERE t.subject_id = 3;
    IF math_nodes IS NULL OR array_length(math_nodes, 1) = 0 THEN
        RAISE NOTICE 'V12 math nodes empty, skip math seed';
        RETURN;
    END IF;
    math_len := array_length(math_nodes, 1);
    FOR yr IN 2010..2024 LOOP
        FOR qno IN 1..23 LOOP
            n := math_nodes[1 + ((yr * 100 + qno) % math_len)];
            -- 关键词：张宇 YYYY 数学一 真题 第N题
            keyword_enc := '%E5%BC%A0%E5%AE%87%20'
                           || yr::text
                           || '%20%E6%95%B0%E5%AD%A6%E4%B8%80%20%E7%9C%9F%E9%A2%98%20%E7%AC%AC'
                           || qno::text
                           || '%E9%A2%98';
            url := 'https://search.bilibili.com/all?keyword=' || keyword_enc;
            ext_src := yr::text || ' 数学一真题 · 张宇解析';
            IF qno BETWEEN 1 AND 8 THEN
                section_label := '选择题';
            ELSIF qno BETWEEN 9 AND 14 THEN
                section_label := '填空题';
            ELSE
                section_label := '解答题';
            END IF;
            content_txt := yr::text || ' 考研数学一真题 · 第 ' || qno::text
                           || ' 题（' || section_label
                           || '）：[请前往外部页面查看完整题面与解题过程]';
            INSERT INTO quiz_questions (
                node_id, question_type, content, options, answer, explanation,
                source, external_url, external_source, year, question_number, created_at
            ) VALUES (
                n, 'CHOICE', content_txt, NULL, 'EXT_CORRECT',
                '详见外部解析视频/文章。',
                'real-exam-link', url, ext_src, yr, qno, CURRENT_TIMESTAMP
            );
        END LOOP;
    END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 408：2010-2024 × 41 题/年 = 615 道
-- 单选 1-40 / 综合应用 41-44（按题号占位，统一 CHOICE）
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    cs_nodes BIGINT[];
    cs_len INT;
    n BIGINT;
    yr INT;
    qno INT;
    url TEXT;
    ext_src TEXT;
    content_txt TEXT;
    keyword_enc TEXT;
    section_label TEXT;
BEGIN
    SELECT array_agg(kn.id ORDER BY kn.id)
      INTO cs_nodes
      FROM knowledge_nodes kn
      JOIN topics t ON kn.topic_id = t.id
      WHERE t.subject_id = 4;
    IF cs_nodes IS NULL OR array_length(cs_nodes, 1) = 0 THEN
        RAISE NOTICE 'V12 408 nodes empty, skip 408 seed';
        RETURN;
    END IF;
    cs_len := array_length(cs_nodes, 1);
    FOR yr IN 2010..2024 LOOP
        FOR qno IN 1..41 LOOP
            n := cs_nodes[1 + ((yr * 100 + qno) % cs_len)];
            -- 关键词：王道 YYYY 408 真题 第N题
            keyword_enc := '%E7%8E%8B%E9%81%93%20'
                           || yr::text
                           || '%20408%20%E7%9C%9F%E9%A2%98%20%E7%AC%AC'
                           || qno::text
                           || '%E9%A2%98';
            url := 'https://search.bilibili.com/all?keyword=' || keyword_enc;
            ext_src := yr::text || ' 408 真题 · 王道解析';
            IF qno BETWEEN 1 AND 40 THEN
                section_label := '单选题';
            ELSE
                section_label := '综合应用题';
            END IF;
            content_txt := yr::text || ' 考研 408 真题 · 第 ' || qno::text
                           || ' 题（' || section_label
                           || '）：[请前往外部页面查看完整题面与解题过程]';
            INSERT INTO quiz_questions (
                node_id, question_type, content, options, answer, explanation,
                source, external_url, external_source, year, question_number, created_at
            ) VALUES (
                n, 'CHOICE', content_txt, NULL, 'EXT_CORRECT',
                '详见外部解析视频/文章。',
                'real-exam-link', url, ext_src, yr, qno, CURRENT_TIMESTAMP
            );
        END LOOP;
    END LOOP;
END $$;

-- V12 共插入 ~2280 道 link-based 真题（政治 570 + 英一 750 + 数一 345 + 408 615）
