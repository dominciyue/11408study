package com.study11408.service;

import com.study11408.dto.StartStudySessionRequest;
import com.study11408.entity.StudySession;
import com.study11408.entity.Subject;
import com.study11408.entity.User;
import com.study11408.exception.BusinessException;
import com.study11408.repository.StudySessionRepository;
import com.study11408.repository.SubjectRepository;
import com.study11408.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class StudySessionService {

    private final StudySessionRepository studySessionRepository;
    private final UserRepository userRepository;
    private final SubjectRepository subjectRepository;

    @Transactional
    public StudySession startSession(Long userId, StartStudySessionRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("用户不存在", HttpStatus.NOT_FOUND));

        Subject subject = null;
        if (request.getSubjectId() != null) {
            subject = subjectRepository.findById(request.getSubjectId())
                    .orElseThrow(() -> new BusinessException("学科不存在", HttpStatus.NOT_FOUND));
        }

        StudySession session = StudySession.builder()
                .user(user)
                .subject(subject)
                .mode(request.getMode())
                .startTime(LocalDateTime.now())
                .endTime(null)
                .studiedNodes(0)
                .reviewedNodes(0)
                .build();

        return studySessionRepository.save(session);
    }

    @Transactional
    public StudySession endSession(Long userId, Long sessionId) {
        StudySession session = studySessionRepository.findById(sessionId)
                .orElseThrow(() -> new BusinessException("学习会话不存在", HttpStatus.NOT_FOUND));

        if (session.getUserId() == null || !session.getUserId().equals(userId)) {
            throw new BusinessException("无权操作该学习会话", HttpStatus.FORBIDDEN);
        }

        if (session.getEndTime() == null) {
            session.setEndTime(LocalDateTime.now());
        }

        return studySessionRepository.save(session);
    }
}

