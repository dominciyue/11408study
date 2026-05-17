package com.study11408.repository;

import com.study11408.entity.Material;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MaterialRepository extends JpaRepository<Material, Long> {

    List<Material> findByNodeId(Long nodeId);

    List<Material> findByUploaderId(Long uploaderId);

    /** 按学科联合 node→topic→subject 过滤；MaterialService 负责按 type 做内存二次过滤
     *  以避开 PostgreSQL "function lower(bytea) does not exist"（JPQL 在 :type 为 null 时
     *  推断不出参数类型）。 */
    @Query("""
            SELECT m FROM Material m
            LEFT JOIN m.node n
            LEFT JOIN n.topic t
            WHERE t.subject.id = :subjectId
            ORDER BY m.createdAt DESC
            """)
    List<Material> findBySubjectId(@Param("subjectId") Long subjectId);
}
