package com.study11408.service;

import com.study11408.dto.KnowledgeNodeDTO;
import com.study11408.entity.KnowledgeEdge;
import com.study11408.entity.KnowledgeNode;
import com.study11408.entity.StudyProgress;
import com.study11408.entity.User;
import com.study11408.exception.BusinessException;
import com.study11408.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StudyPathService {

    private final KnowledgeNodeRepository nodeRepository;
    private final KnowledgeEdgeRepository edgeRepository;
    private final StudyProgressRepository progressRepository;
    private final UserRepository userRepository;
    private final SpacedRepetitionService spacedRepetitionService;

    public List<KnowledgeNodeDTO> generatePath(Long subjectId) {
        List<KnowledgeNode> nodes = nodeRepository.findByTopicSubjectId(subjectId);
        if (nodes.isEmpty()) {
            return Collections.emptyList();
        }

        Map<Long, KnowledgeNode> nodeMap = nodes.stream()
                .collect(Collectors.toMap(KnowledgeNode::getId, n -> n));
        Map<Long, List<Long>> adjacency = new HashMap<>();
        Map<Long, Integer> inDegree = new HashMap<>();

        for (KnowledgeNode node : nodes) {
            adjacency.put(node.getId(), new ArrayList<>());
            inDegree.put(node.getId(), 0);
        }

        Set<Long> nodeIds = nodeMap.keySet();
        for (Long nodeId : nodeIds) {
            List<KnowledgeEdge> edges = edgeRepository.findBySourceId(nodeId);
            for (KnowledgeEdge edge : edges) {
                if ("prerequisite".equals(edge.getRelationType()) && nodeIds.contains(edge.getTargetId())) {
                    adjacency.get(nodeId).add(edge.getTargetId());
                    inDegree.merge(edge.getTargetId(), 1, Integer::sum);
                }
            }
        }

        // Topological sort (Kahn's algorithm)
        Queue<Long> queue = new LinkedList<>();
        for (Map.Entry<Long, Integer> entry : inDegree.entrySet()) {
            if (entry.getValue() == 0) {
                queue.add(entry.getKey());
            }
        }

        List<KnowledgeNodeDTO> sortedPath = new ArrayList<>();
        while (!queue.isEmpty()) {
            Long current = queue.poll();
            KnowledgeNode node = nodeMap.get(current);
            sortedPath.add(toNodeDTO(node));

            for (Long neighbor : adjacency.getOrDefault(current, Collections.emptyList())) {
                inDegree.put(neighbor, inDegree.get(neighbor) - 1);
                if (inDegree.get(neighbor) == 0) {
                    queue.add(neighbor);
                }
            }
        }

        return sortedPath;
    }

    public List<KnowledgeNodeDTO> getReviewQueue(Long userId) {
        List<StudyProgress> dueForReview = progressRepository
                .findByUserIdAndNextReviewBefore(userId, LocalDateTime.now());

        return dueForReview.stream()
                .map(progress -> toNodeDTO(progress.getNode()))
                .collect(Collectors.toList());
    }

    @Transactional
    public void processFeedback(Long userId, Long nodeId, int rating) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("用户不存在", HttpStatus.NOT_FOUND));
        KnowledgeNode node = nodeRepository.findById(nodeId)
                .orElseThrow(() -> new BusinessException("知识节点不存在", HttpStatus.NOT_FOUND));

        StudyProgress progress = progressRepository.findByUserIdAndNodeId(userId, nodeId)
                .orElseGet(() -> StudyProgress.builder()
                        .user(user)
                        .node(node)
                        .masteryLevel(0)
                        .repetitionCount(0)
                        .easeFactor(2.5)
                        .build());

        spacedRepetitionService.processFeedback(progress, rating);
    }

    public List<StudyProgress> getUserProgress(Long userId) {
        return progressRepository.findByUserId(userId);
    }

    private KnowledgeNodeDTO toNodeDTO(KnowledgeNode node) {
        return KnowledgeNodeDTO.builder()
                .id(node.getId())
                .title(node.getTitle())
                .content(node.getContent())
                .difficulty(node.getDifficulty())
                .topicId(node.getTopicId())
                .topicName(node.getTopic() != null ? node.getTopic().getName() : null)
                .subjectName(node.getTopic() != null && node.getTopic().getSubject() != null
                        ? node.getTopic().getSubject().getName() : null)
                .metadata(node.getMetadata())
                .createdAt(node.getCreatedAt())
                .build();
    }
}
