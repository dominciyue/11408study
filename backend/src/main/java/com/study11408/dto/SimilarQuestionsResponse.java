package com.study11408.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * GET /api/wrong-answers/{id}/similar 的响应体。
 *
 * <p>source 表示这批相似题主要从哪里来：
 * <ul>
 *   <li>DB_NODE — 全部来自同 node</li>
 *   <li>DB_TOPIC — 不足时扩到同 topic</li>
 *   <li>DB_SUBJECT — 不足时再扩到同 subject</li>
 *   <li>MIXED — 库内 + LLM 兜底混合</li>
 *   <li>AI_FALLBACK — 库内 0 道，全部 LLM 生成</li>
 * </ul>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SimilarQuestionsResponse {

    /** 数据来源标签，前端用于呈现"AI 生成"徽章 */
    private String source;

    /** 相似题列表（含库内 + 兜底生成） */
    private List<SimilarItem> items;

    /** 兜底 LLM 是否被调用且成功；前端展示失败时降级提示 */
    private boolean aiAvailable;

    /** 库内召回数 */
    private int totalFromDb;

    /** LLM 兜底生成数 */
    private int totalGenerated;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SimilarItem {
        /** 题库 ID；LLM 生成的为 null */
        private Long id;

        /** 题目文本 */
        private String content;

        /** 选项 JSON 字符串（与 quiz_questions.options 一致） */
        private String options;

        /** 正确答案 */
        private String answer;

        /** 解析 */
        private String explanation;

        /** 题型 CHOICE / TRUE_FALSE / FILL_BLANK */
        private String questionType;

        /** true = LLM 兜底生成，前端打"AI 生成"徽章 */
        private boolean generated;
    }
}
