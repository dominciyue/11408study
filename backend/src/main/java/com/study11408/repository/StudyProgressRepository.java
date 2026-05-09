package com.study11408.repository;

import com.study11408.entity.StudyProgress;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface StudyProgressRepository extends JpaRepository<StudyProgress, Long> {

    List<StudyProgress> findByUserId(Long userId);

    @Query("""
            SELECT p FROM StudyProgress p
            JOIN FETCH p.node n
            JOIN FETCH n.topic t
            JOIN FETCH t.subject s
            WHERE p.userId = :userId
            """)
    List<StudyProgress> findByUserIdWithNodeSubject(@Param("userId") Long userId);

    Optional<StudyProgress> findByUserIdAndNodeId(Long userId, Long nodeId);

    List<StudyProgress> findByUserIdAndNextReviewBefore(Long userId, LocalDateTime before);
}
