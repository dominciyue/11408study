package com.study11408;

import com.study11408.entity.StudyProgress;
import com.study11408.repository.StudyProgressRepository;
import com.study11408.service.SpacedRepetitionService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * Unit test for {@link SpacedRepetitionService} — guards against P0-04
 * (SM-2 algorithm uses repetition count instead of previous interval,
 * preventing exponential interval growth and breaking the entire spaced
 * repetition schedule).
 *
 * <p>Reference: Piotr Wozniak, "SM-2 Algorithm" (1990).
 */
@ExtendWith(MockitoExtension.class)
class SpacedRepetitionServiceUnitTest {

    @Mock private StudyProgressRepository repo;
    @InjectMocks private SpacedRepetitionService service;

    @Test
    void first_review_with_good_rating_should_set_interval_1_day() {
        StudyProgress p = newProgress();
        when(repo.save(any())).thenAnswer(i -> i.getArgument(0));

        StudyProgress result = service.processFeedback(p, 4);

        assertThat(result.getRepetitionCount()).isEqualTo(1);
        assertThat(result.getIntervalDays()).isEqualTo(1);
    }

    @Test
    void second_review_should_set_interval_6_days() {
        StudyProgress p = newProgress();
        p.setRepetitionCount(1);
        p.setIntervalDays(1);
        when(repo.save(any())).thenAnswer(i -> i.getArgument(0));

        StudyProgress result = service.processFeedback(p, 4);

        assertThat(result.getRepetitionCount()).isEqualTo(2);
        assertThat(result.getIntervalDays()).isEqualTo(6);
    }

    @Test
    void third_review_should_use_prev_interval_times_ef() {
        // I(3) = round(I(2) * EF) = round(6 * 2.5) = 15
        StudyProgress p = newProgress();
        p.setRepetitionCount(2);
        p.setIntervalDays(6);
        p.setEaseFactor(2.5);
        when(repo.save(any())).thenAnswer(i -> i.getArgument(0));

        StudyProgress result = service.processFeedback(p, 5);

        assertThat(result.getRepetitionCount()).isEqualTo(3);
        assertThat(result.getIntervalDays()).isEqualTo(15);
    }

    @Test
    void interval_should_grow_exponentially_over_many_reviews() {
        // 10 consecutive perfect (rating=5) reviews: interval must grow each
        // step once we're past the n=1, n=2 seed values, and the final value
        // must clearly reflect exponential growth (not linear).
        StudyProgress p = newProgress();
        when(repo.save(any())).thenAnswer(i -> i.getArgument(0));

        int prevInterval = 0;
        for (int i = 0; i < 10; i++) {
            p = service.processFeedback(p, 5);
            if (i >= 2) {
                assertThat(p.getIntervalDays())
                        .as("review #%d interval should be > previous %d", i + 1, prevInterval)
                        .isGreaterThan(prevInterval);
            }
            prevInterval = p.getIntervalDays();
        }
        // After 10 perfect reviews the interval should be far above 50 days.
        // (For comparison: the buggy formula `(rep-1)*EF` would yield only
        // ~30-ish days even after 10 reviews — clearly linear, not exponential.)
        assertThat(p.getIntervalDays()).isGreaterThan(50);
    }

    @Test
    void low_rating_should_reset_repetition_and_interval() {
        StudyProgress p = newProgress();
        p.setRepetitionCount(5);
        p.setIntervalDays(60);
        p.setEaseFactor(2.5);
        when(repo.save(any())).thenAnswer(i -> i.getArgument(0));

        StudyProgress result = service.processFeedback(p, 1);

        assertThat(result.getRepetitionCount()).isEqualTo(0);
        assertThat(result.getIntervalDays()).isEqualTo(1);
        // EF should drop (low rating penalty) but never below 1.3.
        assertThat(result.getEaseFactor()).isLessThan(2.5);
        assertThat(result.getEaseFactor()).isGreaterThanOrEqualTo(1.3);
    }

    @Test
    void ease_factor_should_not_go_below_1_3() {
        StudyProgress p = newProgress();
        p.setEaseFactor(1.4);
        when(repo.save(any())).thenAnswer(i -> i.getArgument(0));

        // Hammer with rating=0 to push EF down hard.
        for (int i = 0; i < 20; i++) {
            p = service.processFeedback(p, 0);
        }

        assertThat(p.getEaseFactor()).isGreaterThanOrEqualTo(1.3);
    }

    @Test
    void rating_out_of_range_should_throw() {
        StudyProgress p = newProgress();

        assertThatThrownBy(() -> service.processFeedback(p, -1))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.processFeedback(p, 6))
                .isInstanceOf(IllegalArgumentException.class);
    }

    private StudyProgress newProgress() {
        StudyProgress p = new StudyProgress();
        p.setUserId(1L);
        p.setNodeId(1L);
        p.setRepetitionCount(0);
        p.setIntervalDays(0);
        p.setEaseFactor(2.5);
        p.setMasteryLevel(0);
        return p;
    }
}
