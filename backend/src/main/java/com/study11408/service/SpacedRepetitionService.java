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
     * SM-2 algorithm implementation.
     * rating: 0-5 where 0=complete blackout, 5=perfect recall
     */
    @Transactional
    public StudyProgress processFeedback(StudyProgress progress, int rating) {
        double easeFactor = progress.getEaseFactor();
        int repetitionCount = progress.getRepetitionCount();
        int interval;

        if (rating < 3) {
            repetitionCount = 0;
            interval = 1;
        } else {
            if (repetitionCount == 0) {
                interval = 1;
            } else if (repetitionCount == 1) {
                interval = 6;
            } else {
                interval = (int) Math.round((repetitionCount - 1) * easeFactor);
            }
            repetitionCount++;
        }

        easeFactor = easeFactor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));
        if (easeFactor < 1.3) {
            easeFactor = 1.3;
        }

        int masteryLevel = calculateMasteryLevel(rating, repetitionCount, easeFactor);

        progress.setEaseFactor(easeFactor);
        progress.setRepetitionCount(repetitionCount);
        progress.setMasteryLevel(masteryLevel);
        progress.setLastReview(LocalDateTime.now());
        progress.setNextReview(LocalDateTime.now().plusDays(interval));

        return studyProgressRepository.save(progress);
    }

    private int calculateMasteryLevel(int rating, int repetitionCount, double easeFactor) {
        double score = (rating / 5.0) * 40 + Math.min(repetitionCount / 10.0, 1.0) * 30 + ((easeFactor - 1.3) / 1.2) * 30;
        return (int) Math.min(Math.max(score, 0), 100);
    }
}
