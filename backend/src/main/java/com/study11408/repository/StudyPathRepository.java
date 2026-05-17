package com.study11408.repository;

import com.study11408.entity.StudyPath;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudyPathRepository extends JpaRepository<StudyPath, Long> {

    /** 列表页全量查询：先按 sortOrder 升序，再按 id 升序兜底（保证稳定排序）。 */
    List<StudyPath> findAllByOrderBySortOrderAscIdAsc();

    /** 学科筛选：subjectId 精确匹配；null 值由 Service 层走 {@link #findAllByOrderBySortOrderAscIdAsc} 分支。 */
    List<StudyPath> findBySubjectIdOrderBySortOrderAscIdAsc(Long subjectId);

    /** 按业务码查找；保留给后续按 code 注入/升级幂等使用。 */
    Optional<StudyPath> findByCode(String code);
}
