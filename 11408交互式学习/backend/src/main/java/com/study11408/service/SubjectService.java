package com.study11408.service;

import com.study11408.dto.SubjectDTO;
import com.study11408.entity.Subject;
import com.study11408.exception.BusinessException;
import com.study11408.repository.SubjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubjectService {

    private final SubjectRepository subjectRepository;

    public List<SubjectDTO> getAllSubjects() {
        return subjectRepository.findAllByOrderBySortOrderAsc().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public SubjectDTO getSubjectById(Long id) {
        Subject subject = subjectRepository.findById(id)
                .orElseThrow(() -> new BusinessException("科目不存在", HttpStatus.NOT_FOUND));
        return toDTO(subject);
    }

    @Transactional
    public SubjectDTO createSubject(SubjectDTO dto) {
        Subject subject = Subject.builder()
                .name(dto.getName())
                .code(dto.getCode())
                .icon(dto.getIcon())
                .color(dto.getColor())
                .description(dto.getDescription())
                .sortOrder(dto.getSortOrder())
                .build();
        subject = subjectRepository.save(subject);
        return toDTO(subject);
    }

    @Transactional
    public SubjectDTO updateSubject(Long id, SubjectDTO dto) {
        Subject subject = subjectRepository.findById(id)
                .orElseThrow(() -> new BusinessException("科目不存在", HttpStatus.NOT_FOUND));

        subject.setName(dto.getName());
        subject.setCode(dto.getCode());
        subject.setIcon(dto.getIcon());
        subject.setColor(dto.getColor());
        subject.setDescription(dto.getDescription());
        subject.setSortOrder(dto.getSortOrder());

        subject = subjectRepository.save(subject);
        return toDTO(subject);
    }

    private SubjectDTO toDTO(Subject subject) {
        return SubjectDTO.builder()
                .id(subject.getId())
                .name(subject.getName())
                .code(subject.getCode())
                .icon(subject.getIcon())
                .color(subject.getColor())
                .description(subject.getDescription())
                .sortOrder(subject.getSortOrder())
                .build();
    }
}
