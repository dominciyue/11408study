package com.study11408.service;

import com.study11408.dto.CreateNoteRequest;
import com.study11408.dto.NoteDTO;
import com.study11408.dto.UpdateNoteRequest;
import com.study11408.entity.KnowledgeNode;
import com.study11408.entity.Note;
import com.study11408.entity.User;
import com.study11408.exception.BusinessException;
import com.study11408.repository.KnowledgeNodeRepository;
import com.study11408.repository.NoteRepository;
import com.study11408.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NoteService {

    private final NoteRepository noteRepository;
    private final UserRepository userRepository;
    private final KnowledgeNodeRepository nodeRepository;

    public List<NoteDTO> list(Long userId, Long nodeId) {
        List<Note> notes;
        if (nodeId != null) {
            notes = noteRepository.findByUserIdAndNodeId(userId, nodeId);
        } else {
            notes = noteRepository.findByUserId(userId);
        }

        return notes.stream().map(this::toDTO).toList();
    }

    @Transactional
    public NoteDTO create(Long userId, CreateNoteRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("用户不存在", HttpStatus.NOT_FOUND));

        KnowledgeNode node = null;
        if (req.getNodeId() != null) {
            node = nodeRepository.findById(req.getNodeId())
                    .orElseThrow(() -> new BusinessException("知识节点不存在", HttpStatus.NOT_FOUND));
        }

        Note note = Note.builder()
                .user(user)
                .node(node)
                .title(req.getTitle())
                .content(req.getContent())
                .build();

        return toDTO(noteRepository.save(note));
    }

    @Transactional
    public NoteDTO update(Long userId, Long noteId, UpdateNoteRequest req) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new BusinessException("笔记不存在", HttpStatus.NOT_FOUND));

        if (note.getUserId() == null || !note.getUserId().equals(userId)) {
            throw new BusinessException("无权操作该笔记", HttpStatus.FORBIDDEN);
        }

        note.setTitle(req.getTitle());
        note.setContent(req.getContent());
        return toDTO(noteRepository.save(note));
    }

    @Transactional
    public void delete(Long userId, Long noteId) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new BusinessException("笔记不存在", HttpStatus.NOT_FOUND));

        if (note.getUserId() == null || !note.getUserId().equals(userId)) {
            throw new BusinessException("无权操作该笔记", HttpStatus.FORBIDDEN);
        }

        noteRepository.delete(note);
    }

    private NoteDTO toDTO(Note note) {
        KnowledgeNode node = note.getNode();
        // node_id 列 insertable=false → 新建后 entity 内存中字段尚未刷新；
        // 优先从 ManyToOne 关联取真实 id，fallback 到 read-only 字段。
        Long resolvedNodeId = node != null ? node.getId() : note.getNodeId();
        return NoteDTO.builder()
                .id(note.getId())
                .nodeId(resolvedNodeId)
                .nodeTitle(node != null ? node.getTitle() : null)
                .topicName(node != null && node.getTopic() != null ? node.getTopic().getName() : null)
                .subjectName(node != null && node.getTopic() != null && node.getTopic().getSubject() != null
                        ? node.getTopic().getSubject().getName()
                        : null)
                .title(note.getTitle())
                .content(note.getContent())
                .createdAt(note.getCreatedAt())
                .updatedAt(note.getUpdatedAt())
                .build();
    }
}

