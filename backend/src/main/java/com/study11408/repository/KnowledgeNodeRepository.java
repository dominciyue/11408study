package com.study11408.repository;

import com.study11408.entity.KnowledgeNode;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KnowledgeNodeRepository extends JpaRepository<KnowledgeNode, Long> {

    List<KnowledgeNode> findByTopicId(Long topicId);

    Page<KnowledgeNode> findByTopicId(Long topicId, Pageable pageable);

    @Query("SELECT n FROM KnowledgeNode n WHERE LOWER(n.title) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<KnowledgeNode> searchByTitle(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT n FROM KnowledgeNode n WHERE n.topic.subject.id = :subjectId")
    List<KnowledgeNode> findByTopicSubjectId(@Param("subjectId") Long subjectId);

    @Query("SELECT COUNT(n) FROM KnowledgeNode n WHERE n.topic.subject.id = :subjectId")
    long countByTopicSubjectId(@Param("subjectId") Long subjectId);

    @Query("SELECT n FROM KnowledgeNode n WHERE " +
           "(:topicId IS NULL OR n.topic.id = :topicId) AND " +
           "(:subjectId IS NULL OR n.topic.subject.id = :subjectId) AND " +
           "(:keyword IS NULL OR LOWER(n.title) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<KnowledgeNode> findFiltered(@Param("topicId") Long topicId,
                                     @Param("subjectId") Long subjectId,
                                     @Param("keyword") String keyword,
                                     Pageable pageable);
}
