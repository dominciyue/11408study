package com.study11408.repository;

import com.study11408.entity.StudyPathWeek;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudyPathWeekRepository extends JpaRepository<StudyPathWeek, Long> {

    /** 详情页拉某条路径的所有周次，按 weekNo 升序。 */
    List<StudyPathWeek> findByPathIdOrderByWeekNoAsc(Long pathId);
}
