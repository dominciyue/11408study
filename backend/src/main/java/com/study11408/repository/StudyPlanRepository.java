package com.study11408.repository;

import com.study11408.entity.StudyPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudyPlanRepository extends JpaRepository<StudyPlan, Long> {

    /** 列表页主查询：用户的所有计划，按创建时间倒序（最新在前）。 */
    List<StudyPlan> findByUserIdOrderByCreatedAtDesc(Long userId);

    /** 详情/删除前的 ownership 校验：必须同时匹配 planId + userId 才能拿到。 */
    Optional<StudyPlan> findByIdAndUserId(Long id, Long userId);
}
