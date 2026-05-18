package com.study11408.repository;

import com.study11408.entity.WrongAnswer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface WrongAnswerRepository extends JpaRepository<WrongAnswer, Long> {

    List<WrongAnswer> findByUserIdAndResolvedFalse(Long userId);

    List<WrongAnswer> findByUserId(Long userId);

    Optional<WrongAnswer> findByIdAndUserId(Long id, Long userId);

    /** 同题尚未入队的未解决错误次数 — 用于决定是否触发入复习队列 */
    long countByUserIdAndQuestionIdAndResolvedFalseAndEnqueuedAtIsNull(Long userId, Long questionId);

    /** 错题本列表 / 分页 — 按答错时间倒序 */
    Page<WrongAnswer> findByUserIdAndResolvedFalseOrderByAnsweredAtDesc(Long userId, Pageable pageable);

    /**
     * 一次性把"已记录但还没入队"的同题错误全部 mark 上时间戳，
     * 避免后续答错再触发入队。
     */
    @Modifying
    @Query("UPDATE WrongAnswer w SET w.enqueuedAt = :ts " +
           "WHERE w.userId = :uid AND w.questionId = :qid " +
           "AND w.resolved = false AND w.enqueuedAt IS NULL")
    int markEnqueued(@Param("uid") Long userId,
                     @Param("qid") Long questionId,
                     @Param("ts") LocalDateTime timestamp);
}
