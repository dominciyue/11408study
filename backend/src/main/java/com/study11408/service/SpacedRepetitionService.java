package com.study11408.service;

import com.study11408.entity.StudyProgress;
import com.study11408.repository.StudyProgressRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class SpacedRepetitionService {

    private final StudyProgressRepository studyProgressRepository;

    /**
     * SM-2 algorithm (Piotr Wozniak, 1990).
     *
     * <p>rating: 0-5 where 0 = complete blackout, 5 = perfect recall.
     *
     * <p>Interval schedule (when rating &gt;= 3):
     * <ul>
     *   <li>n = 1: I(1) = 1 day</li>
     *   <li>n = 2: I(2) = 6 days</li>
     *   <li>n &gt;= 3: I(n) = round(I(n-1) * EF)</li>
     * </ul>
     * If rating &lt; 3 the card is reset (repetition = 0, interval = 1) but EF
     * is still updated by the formula below.
     *
     * <p>EF update (every review): EF += (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
     * with a hard floor of 1.3.
     */
    @Transactional
    public StudyProgress processFeedback(StudyProgress progress, int rating) {
        if (rating < 0 || rating > 5) {
            throw new IllegalArgumentException("rating must be in [0, 5]");
        }

        int repetition = progress.getRepetitionCount() == null ? 0 : progress.getRepetitionCount();
        double ef = progress.getEaseFactor() == null ? 2.5 : progress.getEaseFactor();
        int prevInterval = progress.getIntervalDays() == null ? 0 : progress.getIntervalDays();

        int newRepetition;
        int newInterval;
        if (rating < 3) {
            // Failure: reset the repetition counter, schedule for tomorrow.
            newRepetition = 0;
            newInterval = 1;
        } else {
            newRepetition = repetition + 1;
            if (newRepetition == 1) {
                newInterval = 1;
            } else if (newRepetition == 2) {
                newInterval = 6;
            } else {
                // I(n) = I(n-1) * EF (uses the previously persisted interval,
                // not the repetition count — that was the P0-04 bug).
                newInterval = (int) Math.round(prevInterval * ef);
                if (newInterval < 1) {
                    newInterval = 1;
                }
            }
        }

        // EF update happens regardless of rating, with floor 1.3.
        double newEf = ef + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));
        if (newEf < 1.3) {
            newEf = 1.3;
        }

        LocalDateTime now = LocalDateTime.now();
        int masteryLevel = calculateMasteryLevel(rating, newRepetition, newEf);

        progress.setEaseFactor(newEf);
        progress.setRepetitionCount(newRepetition);
        progress.setIntervalDays(newInterval);
        progress.setMasteryLevel(masteryLevel);
        progress.setLastReview(now);
        progress.setNextReview(now.plusDays(newInterval));

        return studyProgressRepository.save(progress);
    }

    private int calculateMasteryLevel(int rating, int repetitionCount, double easeFactor) {
        double score = (rating / 5.0) * 40
                + Math.min(repetitionCount / 10.0, 1.0) * 30
                + ((easeFactor - 1.3) / 1.2) * 30;
        return (int) Math.min(Math.max(score, 0), 100);
    }
}
