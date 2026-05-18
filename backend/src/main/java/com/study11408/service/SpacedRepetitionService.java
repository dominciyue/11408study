package com.study11408.service;

import com.study11408.entity.KnowledgeNode;
import com.study11408.entity.StudyProgress;
import com.study11408.entity.User;
import com.study11408.exception.BusinessException;
import com.study11408.repository.KnowledgeNodeRepository;
import com.study11408.repository.StudyProgressRepository;
import com.study11408.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class SpacedRepetitionService {

    private final StudyProgressRepository studyProgressRepository;
    private final UserRepository userRepository;
    private final KnowledgeNodeRepository knowledgeNodeRepository;

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

    /**
     * 错题闭环 — 把指定 node 拨到 SM-2 复习队列。
     * <p>语义：等价于一次 rating=0 的反馈（"完全忘了"），next_review = 明天，
     * repetition_count 重置为 0；若 StudyProgress 还不存在则懒建。
     * <p>调用方应已校验 userId / nodeId 的合法性；本方法只做存在性容错。
     * <p>遇 OptimisticLockException 重试 1 次，再失败仅 log.warn 不抛——
     * 不能因为入队失败阻塞答题主流程。
     *
     * <p><b>REQUIRES_NEW</b>：必须开新事务。否则 enqueue 内部一旦抛 BusinessException
     * (RuntimeException 子类)，会把外层 QuizService.submitAnswer 的主事务标 rollback-only，
     * 即便 WrongAnswerService 在外层 catch 掉异常，提交时仍会 TxnAbort 失败，
     * 整个答题流程变成 500。
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void enqueueWrongQuestion(Long userId, Long nodeId) {
        if (userId == null || nodeId == null) {
            log.warn("enqueueWrongQuestion called with null param userId={} nodeId={}", userId, nodeId);
            return;
        }
        try {
            doEnqueue(userId, nodeId);
        } catch (ObjectOptimisticLockingFailureException e) {
            log.warn("enqueueWrongQuestion optimistic lock conflict, retry once. uid={} node={}", userId, nodeId);
            try {
                doEnqueue(userId, nodeId);
            } catch (Exception e2) {
                log.warn("enqueueWrongQuestion retry failed, give up. uid={} node={} err={}",
                        userId, nodeId, e2.getMessage());
            }
        }
    }

    private void doEnqueue(Long userId, Long nodeId) {
        StudyProgress progress = studyProgressRepository
                .findByUserIdAndNodeId(userId, nodeId)
                .orElseGet(() -> createProgressShell(userId, nodeId));
        processFeedback(progress, 0);  // rating=0 → next_review = 明天, repetition 重置
    }

    private StudyProgress createProgressShell(Long userId, Long nodeId) {
        // 用户/节点不存在时直接抛 — 不可恢复的脏数据，应该由上层 catch 后告警
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("用户不存在", HttpStatus.NOT_FOUND));
        KnowledgeNode node = knowledgeNodeRepository.findById(nodeId)
                .orElseThrow(() -> new BusinessException("节点不存在", HttpStatus.NOT_FOUND));
        return studyProgressRepository.save(StudyProgress.builder()
                .user(user)
                .node(node)
                .masteryLevel(0)
                .repetitionCount(0)
                .easeFactor(2.5)
                .intervalDays(0)
                .build());
    }
}
