package com.study11408.repository;

import com.study11408.entity.KnowledgeNodeSource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KnowledgeNodeSourceRepository extends JpaRepository<KnowledgeNodeSource, Long> {

    /**
     * 按知识点 ID 列出所有出处。前端"出处定位"展示用。
     */
    List<KnowledgeNodeSource> findByNodeId(Long nodeId);
}
