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
}
