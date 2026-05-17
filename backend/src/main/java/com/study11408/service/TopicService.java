package com.study11408.service;

import com.study11408.dto.TopicDTO;
import com.study11408.entity.Subject;
import com.study11408.entity.Topic;
import com.study11408.exception.BusinessException;
import com.study11408.repository.SubjectRepository;
import com.study11408.repository.TopicRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TopicService {

    private final TopicRepository topicRepository;
    private final SubjectRepository subjectRepository;

    public List<TopicDTO> getTopicsBySubject(Long subjectId) {
        return topicRepository.findBySubjectIdOrderBySortOrderAsc(subjectId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public TopicDTO getTopic(Long id) {
        Topic topic = topicRepository.findById(id)
                .orElseThrow(() -> new BusinessException("主题不存在", HttpStatus.NOT_FOUND));
        return toDTO(topic);
    }

    @Transactional
    public TopicDTO createTopic(TopicDTO dto) {
        Subject subject = subjectRepository.findById(dto.getSubjectId())
                .orElseThrow(() -> new BusinessException("科目不存在", HttpStatus.NOT_FOUND));

        Topic topic = Topic.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .sortOrder(dto.getSortOrder())
                .subject(subject)
                .build();

        topic = topicRepository.save(topic);
        return toDTO(topic);
    }

    @Transactional
    public TopicDTO updateTopic(Long id, TopicDTO dto) {
        Topic topic = topicRepository.findById(id)
                .orElseThrow(() -> new BusinessException("主题不存在", HttpStatus.NOT_FOUND));

        topic.setName(dto.getName());
        topic.setDescription(dto.getDescription());
        topic.setSortOrder(dto.getSortOrder());

        if (dto.getSubjectId() != null) {
            Subject subject = subjectRepository.findById(dto.getSubjectId())
                    .orElseThrow(() -> new BusinessException("科目不存在", HttpStatus.NOT_FOUND));
            topic.setSubject(subject);
        }

        topic = topicRepository.save(topic);
        return toDTO(topic);
    }

    private TopicDTO toDTO(Topic topic) {
        return TopicDTO.builder()
                .id(topic.getId())
                .name(topic.getName())
                .description(topic.getDescription())
                .sortOrder(topic.getSortOrder())
                .subjectId(topic.getSubject().getId())
                .subjectName(topic.getSubject().getName())
                .build();
    }
}
