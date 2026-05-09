package com.study11408.service;

/**
 * 掌握度 0-100 → 1-5 星位映射，用于前端展示能力等级。
 *
 * <p>分桶规则（与知能行考研 1-5 级对齐）：
 * <ul>
 *   <li>1 星: 0-20</li>
 *   <li>2 星: 21-40</li>
 *   <li>3 星: 41-60</li>
 *   <li>4 星: 61-80</li>
 *   <li>5 星: 81-100</li>
 * </ul>
 *
 * <p>边界：负数/null 视为 0；>100 截断为 100。
 */
public final class MasteryLevel {

    private MasteryLevel() {}

    public static int starsOf(Integer mastery100) {
        int m = mastery100 == null ? 0 : Math.max(0, Math.min(100, mastery100));
        if (m <= 20) return 1;
        if (m <= 40) return 2;
        if (m <= 60) return 3;
        if (m <= 80) return 4;
        return 5;
    }

    /** "未学" 的语义判定（无进度记录或 mastery=0）。 */
    public static boolean isUntouched(Integer mastery100) {
        return mastery100 == null || mastery100 <= 0;
    }
}
