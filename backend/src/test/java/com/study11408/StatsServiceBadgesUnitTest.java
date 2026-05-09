package com.study11408;

import com.study11408.dto.BadgeDTO;
import com.study11408.dto.DailyTaskDTO;
import com.study11408.service.StatsService;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Pure-function tests for {@link StatsService#computeBadges} +
 * {@link StatsService#computeDailyTasks} — no DB / mocks needed since the
 * methods are package-private static helpers.
 *
 * <p>断言要点：阈值边界、未登记不抛、avgMastery 取整后比较、负数当 0。
 */
class StatsServiceBadgesUnitTest {

    private static Map<String, BadgeDTO> byCode(List<BadgeDTO> badges) {
        return badges.stream().collect(Collectors.toMap(BadgeDTO::getCode, b -> b));
    }

    private static Map<String, DailyTaskDTO> byCodeT(List<DailyTaskDTO> tasks) {
        return tasks.stream().collect(Collectors.toMap(DailyTaskDTO::getCode, t -> t));
    }

    @Test
    void brand_new_user_earns_no_badges() {
        Map<String, BadgeDTO> b = byCode(StatsService.computeBadges(0, 0, 0, 0, 0.0));
        assertThat(b.values()).allSatisfy(badge -> assertThat(badge.getEarned()).isFalse());
        assertThat(b).hasSize(9);
    }

    @Test
    void streak_thresholds_unlock_progressively() {
        Map<String, BadgeDTO> b = byCode(StatsService.computeBadges(7, 0, 0, 0, 0));
        assertThat(b.get("firstStep").getEarned()).isTrue();
        assertThat(b.get("weekHero").getEarned()).isTrue();
        assertThat(b.get("monthIron").getEarned()).isFalse();
    }

    @Test
    void boundary_exactly_at_threshold_unlocks() {
        Map<String, BadgeDTO> b = byCode(StatsService.computeBadges(0, 10, 60, 10, 80.0));
        assertThat(b.get("starter").getEarned()).isTrue();
        assertThat(b.get("focused").getEarned()).isTrue();
        assertThat(b.get("reviewer").getEarned()).isTrue();
        assertThat(b.get("perfectionist").getEarned()).isTrue();
    }

    @Test
    void boundary_one_below_threshold_does_not_unlock() {
        Map<String, BadgeDTO> b = byCode(StatsService.computeBadges(6, 9, 59, 9, 79.4));
        assertThat(b.get("weekHero").getEarned()).isFalse();
        assertThat(b.get("starter").getEarned()).isFalse();
        assertThat(b.get("focused").getEarned()).isFalse();
        assertThat(b.get("reviewer").getEarned()).isFalse();
        assertThat(b.get("perfectionist").getEarned()).isFalse();
    }

    @Test
    void avgMastery_rounds_half_up_for_perfectionist() {
        // 79.5 应四舍五入为 80
        Map<String, BadgeDTO> b = byCode(StatsService.computeBadges(0, 0, 0, 0, 79.5));
        assertThat(b.get("perfectionist").getEarned()).isTrue();
        // 79.4 应是 79
        b = byCode(StatsService.computeBadges(0, 0, 0, 0, 79.4));
        assertThat(b.get("perfectionist").getEarned()).isFalse();
    }

    @Test
    void daily_tasks_complete_when_meet_target() {
        Map<String, DailyTaskDTO> t = byCodeT(StatsService.computeDailyTasks(5, 10, 30));
        assertThat(t.get("learn5new").getCompleted()).isTrue();
        assertThat(t.get("review10").getCompleted()).isTrue();
        assertThat(t.get("focus30min").getCompleted()).isTrue();
    }

    @Test
    void daily_tasks_show_progress_when_partial() {
        Map<String, DailyTaskDTO> t = byCodeT(StatsService.computeDailyTasks(3, 0, 15));
        assertThat(t.get("learn5new").getCurrent()).isEqualTo(3);
        assertThat(t.get("learn5new").getCompleted()).isFalse();
        assertThat(t.get("review10").getCurrent()).isEqualTo(0);
        assertThat(t.get("focus30min").getCurrent()).isEqualTo(15);
    }

    @Test
    void negative_inputs_clamped_to_zero() {
        Map<String, BadgeDTO> b = byCode(StatsService.computeBadges(-3, -10, -5, -1, -1.0));
        assertThat(b.values()).allSatisfy(badge -> {
            assertThat(badge.getCurrent()).isGreaterThanOrEqualTo(0L);
            assertThat(badge.getEarned()).isFalse();
        });
        Map<String, DailyTaskDTO> t = byCodeT(StatsService.computeDailyTasks(-3, -1, -10));
        assertThat(t.values()).allSatisfy(task ->
                assertThat(task.getCurrent()).isGreaterThanOrEqualTo(0L));
    }
}
