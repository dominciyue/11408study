package com.study11408.repository;

import com.study11408.entity.KnowledgeEdge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KnowledgeEdgeRepository extends JpaRepository<KnowledgeEdge, Long> {

    List<KnowledgeEdge> findBySourceId(Long sourceId);

    List<KnowledgeEdge> findByTargetId(Long targetId);

    List<KnowledgeEdge> findBySourceIdOrTargetId(Long sourceId, Long targetId);

    List<KnowledgeEdge> findByRelationType(String relationType);
}
