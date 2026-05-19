package com.study11408.repository;

import com.study11408.entity.QuizQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizQuestionRepository extends JpaRepository<QuizQuestion, Long> {

    List<QuizQuestion> findByNodeId(Long nodeId);

    List<QuizQuestion> findByQuestionType(String questionType);

    /**
     * 旧版本：保留以兼容现有调用。新代码请用 {@link #findRandomInlineByNodeIds}。
     * 会返回 link-based 占位题（external_url NOT NULL，content 只是"[请前往外部页面…]"），
     * 这些题不能作答，仅在"外部资源"独立 tab 展示。
     */
    @Query(value = "SELECT * FROM quiz_questions WHERE node_id IN :nodeIds ORDER BY RANDOM() LIMIT :limit",
           nativeQuery = true)
    List<QuizQuestion> findRandomByNodeIds(@Param("nodeIds") List<Long> nodeIds,
                                           @Param("limit") int limit);

    /**
     * 答题主流程专用：随机取 inline（完整题面）题，排除 link-based 占位题。
     * link-based 题 content 是固定的"[请前往外部页面查看完整题面与选项]"，
     * options 通常为 NULL，answer 是 EXT_CORRECT，根本无法 in-app 作答。
     */
    @Query(value = "SELECT * FROM quiz_questions " +
                   "WHERE node_id IN :nodeIds " +
                   "  AND (external_url IS NULL OR external_url = '') " +
                   "ORDER BY RANDOM() LIMIT :limit",
           nativeQuery = true)
    List<QuizQuestion> findRandomInlineByNodeIds(@Param("nodeIds") List<Long> nodeIds,
                                                  @Param("limit") int limit);

    /**
     * 相似题第二档：同 topic 下所有节点的题（已排除 link-based）
     * (第一档就是已有的 findByNodeId — 在 Service 层手动 filter)
     */
    @Query("SELECT q FROM QuizQuestion q WHERE q.node.topic.id = :topicId " +
           "AND (q.externalUrl IS NULL OR q.externalUrl = '')")
    List<QuizQuestion> findByNodeTopicId(@Param("topicId") Long topicId);

    /** 相似题第三档：同 subject 下所有题（已排除 link-based） */
    @Query("SELECT q FROM QuizQuestion q WHERE q.node.topic.subject.id = :subjectId " +
           "AND (q.externalUrl IS NULL OR q.externalUrl = '')")
    List<QuizQuestion> findByNodeTopicSubjectId(@Param("subjectId") Long subjectId);

    /** 外部资源页用：返回 link-based 题（独立 tab 展示，不进入答题流） */
    @Query("SELECT q FROM QuizQuestion q WHERE q.node.topic.subject.id = :subjectId " +
           "AND q.externalUrl IS NOT NULL AND q.externalUrl <> ''")
    List<QuizQuestion> findExternalLinkBySubject(@Param("subjectId") Long subjectId);
}
