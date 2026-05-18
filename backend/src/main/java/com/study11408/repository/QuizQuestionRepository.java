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

    @Query(value = "SELECT * FROM quiz_questions WHERE node_id IN :nodeIds ORDER BY RANDOM() LIMIT :limit",
           nativeQuery = true)
    List<QuizQuestion> findRandomByNodeIds(@Param("nodeIds") List<Long> nodeIds,
                                           @Param("limit") int limit);

    /**
     * 相似题第二档：同 topic 下所有节点的题
     * (第一档就是已有的 findByNodeId)
     */
    @Query("SELECT q FROM QuizQuestion q WHERE q.node.topic.id = :topicId")
    List<QuizQuestion> findByNodeTopicId(@Param("topicId") Long topicId);

    /** 相似题第三档：同 subject 下所有题 */
    @Query("SELECT q FROM QuizQuestion q WHERE q.node.topic.subject.id = :subjectId")
    List<QuizQuestion> findByNodeTopicSubjectId(@Param("subjectId") Long subjectId);
}
