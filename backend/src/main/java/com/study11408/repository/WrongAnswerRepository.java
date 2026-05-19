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

    /**
     * 同上 + FETCH JOIN 把 question→node→topic→subject 一次性拉回，
     * 避免 listGroupedByNode 时的 N+1 lazy proxy（每条触发 4 次额外 query）。
     */
    @Query("""
            SELECT w FROM WrongAnswer w
            LEFT JOIN FETCH w.question q
            LEFT JOIN FETCH q.node n
            LEFT JOIN FETCH n.topic t
            LEFT JOIN FETCH t.subject s
            WHERE w.userId = :userId AND w.resolved = false
            """)
    List<WrongAnswer> findOpenWithGraph(@Param("userId") Long userId);

    List<WrongAnswer> findByUserId(Long userId);

    Optional<WrongAnswer> findByIdAndUserId(Long id, Long userId);

    /** 同题尚未入队的未解决错误次数 — 用于决定是否触发入复习队列 */
    long countByUserIdAndQuestionIdAndResolvedFalseAndEnqueuedAtIsNull(Long userId, Long questionId);

    /** 错题本列表 / 分页 — 按答错时间倒序 */
    Page<WrongAnswer> findByUserIdAndResolvedFalseOrderByAnsweredAtDesc(Long userId, Pageable pageable);

    /** 拉未归类的未解决错题 Top3 — 用于 /wrong-answers/classify-pending 同步归类。
     *  Top3 是 Spring Data 的 first-N 语法,生成 LIMIT 3。带 question fetch 避免 toDto N+1。 */
    @Query("""
            SELECT w FROM WrongAnswer w
            LEFT JOIN FETCH w.question q
            LEFT JOIN FETCH q.node n
            LEFT JOIN FETCH n.topic t
            WHERE w.userId = :userId
              AND w.resolved = false
              AND w.errorCategory IS NULL
            ORDER BY w.answeredAt DESC
            """)
    List<WrongAnswer> findUnclassifiedTop(@Param("userId") Long userId, Pageable pageable);

    /** 简化版 — controller 不用关心 Pageable,直接拿固定 3 条。 */
    default List<WrongAnswer>
    findTop3ByUserIdAndResolvedFalseAndErrorCategoryIsNullOrderByAnsweredAtDesc(Long userId) {
        return findUnclassifiedTop(userId, org.springframework.data.domain.PageRequest.of(0, 3));
    }

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
