package com.study11408.repository;

import com.study11408.entity.WrongAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WrongAnswerRepository extends JpaRepository<WrongAnswer, Long> {

    List<WrongAnswer> findByUserIdAndResolvedFalse(Long userId);

    List<WrongAnswer> findByUserId(Long userId);
}
