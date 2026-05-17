package com.study11408.repository;

import com.study11408.entity.KnowledgeEdge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface KnowledgeEdgeRepository extends JpaRepository<KnowledgeEdge, Long> {

    List<KnowledgeEdge> findBySourceId(Long sourceId);

    List<KnowledgeEdge> findByTargetId(Long targetId);

    List<KnowledgeEdge> findBySourceIdOrTargetId(Long sourceId, Long targetId);

    /** 一次性查所有 sourceId / targetId 落在给定集合的边；替换循环里逐节点
     *  调用 findBySourceIdOrTargetId 的 N+1 模式（子图谱 357 节点 = 357 次 SELECT）。 */
    List<KnowledgeEdge> findBySourceIdInOrTargetIdIn(Collection<Long> sourceIds, Collection<Long> targetIds);

    List<KnowledgeEdge> findByRelationType(String relationType);
}
