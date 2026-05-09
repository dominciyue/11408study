package com.study11408;

import com.study11408.service.MasteryLevel;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 掌握度 → 1-5 星映射单测。锁住分桶边界（0/20/21/40/41/60/61/80/81/100）+
 * null + 负数 + 越界 + isUntouched 语义。
 */
class MasteryLevelUnitTest {

    @Test
    void boundary_at_each_bucket_top() {
        assertThat(MasteryLevel.starsOf(20)).isEqualTo(1);
        assertThat(MasteryLevel.starsOf(40)).isEqualTo(2);
        assertThat(MasteryLevel.starsOf(60)).isEqualTo(3);
        assertThat(MasteryLevel.starsOf(80)).isEqualTo(4);
        assertThat(MasteryLevel.starsOf(100)).isEqualTo(5);
    }

    @Test
    void boundary_one_above_each_bucket_top() {
        assertThat(MasteryLevel.starsOf(21)).isEqualTo(2);
        assertThat(MasteryLevel.starsOf(41)).isEqualTo(3);
        assertThat(MasteryLevel.starsOf(61)).isEqualTo(4);
        assertThat(MasteryLevel.starsOf(81)).isEqualTo(5);
    }

    @Test
    void zero_and_null_default_to_one_star() {
        assertThat(MasteryLevel.starsOf(0)).isEqualTo(1);
        assertThat(MasteryLevel.starsOf(null)).isEqualTo(1);
    }

    @Test
    void negative_clamps_to_zero() {
        assertThat(MasteryLevel.starsOf(-5)).isEqualTo(1);
        assertThat(MasteryLevel.starsOf(-100)).isEqualTo(1);
    }

    @Test
    void above_hundred_clamps_to_hundred() {
        assertThat(MasteryLevel.starsOf(150)).isEqualTo(5);
        assertThat(MasteryLevel.starsOf(101)).isEqualTo(5);
    }

    @Test
    void isUntouched_true_for_null_and_zero_and_negative() {
        assertThat(MasteryLevel.isUntouched(null)).isTrue();
        assertThat(MasteryLevel.isUntouched(0)).isTrue();
        assertThat(MasteryLevel.isUntouched(-1)).isTrue();
    }

    @Test
    void isUntouched_false_for_positive() {
        assertThat(MasteryLevel.isUntouched(1)).isFalse();
        assertThat(MasteryLevel.isUntouched(50)).isFalse();
        assertThat(MasteryLevel.isUntouched(100)).isFalse();
    }
}
