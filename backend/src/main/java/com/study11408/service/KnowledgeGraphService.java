package com.study11408.service;

import com.study11408.dto.*;
import com.study11408.entity.KnowledgeEdge;
import com.study11408.entity.KnowledgeNode;
import com.study11408.entity.Topic;
import com.study11408.exception.BusinessException;
import com.study11408.repository.KnowledgeEdgeRepository;
import com.study11408.repository.KnowledgeNodeRepository;
import com.study11408.repository.StudyProgressRepository;
import com.study11408.repository.TopicRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class KnowledgeGraphService {

    private static final java.util.Set<String> ALLOWED_ENHANCE_TYPES =
            java.util.Set.of("EXPLAIN", "MNEMONIC", "ANALOGY");

    private final KnowledgeNodeRepository nodeRepository;
    private final KnowledgeEdgeRepository edgeRepository;
    private final TopicRepository topicRepository;
    private final AiClientService aiClientService;
    private final StudyProgressRepository progressRepository;

    public Page<KnowledgeNodeDTO> getNodes(Long topicId, Long subjectId, String keyword, Pageable pageable) {
        String normalizedKeyword = keyword == null ? null : keyword.trim();
        Page<KnowledgeNode> nodes = (normalizedKeyword == null || normalizedKeyword.isEmpty())
                ? nodeRepository.findFiltered(topicId, subjectId, pageable)
                : nodeRepository.findFilteredByKeyword(topicId, subjectId, normalizedKeyword, pageable);
        return nodes
                .map(this::toNodeDTO);
    }

    public KnowledgeNodeDTO getNodeById(Long id) {
        KnowledgeNode node = nodeRepository.findById(id)
                .orElseThrow(() -> new BusinessException("知识节点不存在", HttpStatus.NOT_FOUND));
        return toNodeDTO(node);
    }

    /**
     * 调用 AI 对节点做深入解读。enhance_type ∈ {EXPLAIN, MNEMONIC, ANALOGY}。
     * 返回 ai-service 原始 map（含 enhanced_content + enhance_type，或 error）。
     */
    public Map<String, Object> aiEnhanceNode(Long nodeId, String enhanceType) {
        String upperType = enhanceType == null ? "EXPLAIN" : enhanceType.toUpperCase();
        if (!ALLOWED_ENHANCE_TYPES.contains(upperType)) {
            throw new BusinessException(
                    "enhanceType 必须是 EXPLAIN / MNEMONIC / ANALOGY",
                    HttpStatus.BAD_REQUEST);
        }
        KnowledgeNode node = nodeRepository.findById(nodeId)
                .orElseThrow(() -> new BusinessException("知识节点不存在", HttpStatus.NOT_FOUND));
        String content = node.getContent() != null ? node.getContent() : "";
        return aiClientService.enhanceContent(node.getTitle(), content, upperType);
    }

    @Transactional
    public KnowledgeNodeDTO createNode(CreateNodeRequest request) {
        Topic topic = topicRepository.findById(request.getTopicId())
                .orElseThrow(() -> new BusinessException("主题不存在", HttpStatus.NOT_FOUND));

        KnowledgeNode node = KnowledgeNode.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .difficulty(request.getDifficulty())
                .metadata(request.getMetadata())
                .topic(topic)
                .build();

        node = nodeRepository.save(node);
        return toNodeDTO(node);
    }

    @Transactional
    public KnowledgeNodeDTO updateNode(Long id, CreateNodeRequest request) {
        KnowledgeNode node = nodeRepository.findById(id)
                .orElseThrow(() -> new BusinessException("知识节点不存在", HttpStatus.NOT_FOUND));

        node.setTitle(request.getTitle());
        node.setContent(request.getContent());
        node.setDifficulty(request.getDifficulty());
        node.setMetadata(request.getMetadata());

        if (request.getTopicId() != null) {
            Topic topic = topicRepository.findById(request.getTopicId())
                    .orElseThrow(() -> new BusinessException("主题不存在", HttpStatus.NOT_FOUND));
            node.setTopic(topic);
        }

        node = nodeRepository.save(node);
        return toNodeDTO(node);
    }

    @Transactional
    public void deleteNode(Long id) {
        if (!nodeRepository.existsById(id)) {
            throw new BusinessException("知识节点不存在", HttpStatus.NOT_FOUND);
        }
        List<KnowledgeEdge> relatedEdges = edgeRepository.findBySourceIdOrTargetId(id, id);
        edgeRepository.deleteAll(relatedEdges);
        nodeRepository.deleteById(id);
    }

    public List<KnowledgeEdgeDTO> getEdgesByNodeId(Long nodeId) {
        return edgeRepository.findBySourceIdOrTargetId(nodeId, nodeId).stream()
                .map(this::toEdgeDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public KnowledgeEdgeDTO createEdge(CreateEdgeRequest request) {
        KnowledgeNode source = nodeRepository.findById(request.getSourceId())
                .orElseThrow(() -> new BusinessException("源节点不存在", HttpStatus.NOT_FOUND));
        KnowledgeNode target = nodeRepository.findById(request.getTargetId())
                .orElseThrow(() -> new BusinessException("目标节点不存在", HttpStatus.NOT_FOUND));

        KnowledgeEdge edge = KnowledgeEdge.builder()
                .source(source)
                .target(target)
                .relationType(request.getRelationType() != null
                        ? request.getRelationType().toUpperCase()
                        : null)
                .weight(request.getWeight() != null ? request.getWeight() : 1.0)
                .description(request.getDescription())
                .build();

        edge = edgeRepository.save(edge);
        return toEdgeDTO(edge);
    }

    @Transactional
    public void deleteEdge(Long id) {
        if (!edgeRepository.existsById(id)) {
            throw new BusinessException("知识边不存在", HttpStatus.NOT_FOUND);
        }
        edgeRepository.deleteById(id);
    }

    public GraphDataDTO getGraphData(Long subjectId) {
        return getGraphData(subjectId, null);
    }

    /**
     * 当 userId 非空时，给每个节点 DTO 注入该用户的 masteryLevel；
     * 前端 graph 页的"按掌握度过滤"和星级依赖这个字段。
     */
    public GraphDataDTO getGraphData(Long subjectId, Long userId) {
        List<KnowledgeNode> nodes = nodeRepository.findByTopicSubjectId(subjectId);
        Set<Long> nodeIds = nodes.stream().map(KnowledgeNode::getId).collect(Collectors.toSet());

        List<KnowledgeEdge> allEdges = new ArrayList<>();
        for (Long nodeId : nodeIds) {
            allEdges.addAll(edgeRepository.findBySourceIdOrTargetId(nodeId, nodeId));
        }

        List<KnowledgeEdge> filteredEdges = allEdges.stream()
                .filter(e -> nodeIds.contains(e.getSourceId()) && nodeIds.contains(e.getTargetId()))
                .distinct()
                .collect(Collectors.toList());

        java.util.Map<Long, Integer> masteryByNode = buildMasteryMap(userId);

        return GraphDataDTO.builder()
                .nodes(nodes.stream().map(n -> toNodeDTO(n, masteryByNode)).collect(Collectors.toList()))
                .edges(filteredEdges.stream().map(this::toEdgeDTO).collect(Collectors.toList()))
                .build();
    }

    /** userId 为 null 时返回空 map（toNodeDTO 跳过 mastery 注入）。 */
    private java.util.Map<Long, Integer> buildMasteryMap(Long userId) {
        if (userId == null) return null;
        return progressRepository.findByUserId(userId).stream()
                .filter(p -> p.getNodeId() != null && p.getMasteryLevel() != null)
                .collect(java.util.stream.Collectors.toMap(
                        com.study11408.entity.StudyProgress::getNodeId,
                        com.study11408.entity.StudyProgress::getMasteryLevel,
                        (a, b) -> a));
    }

    public GraphDataDTO getFocusGraph(Long nodeId, int depth) {
        Set<Long> visitedIds = new HashSet<>();
        Queue<Long> queue = new LinkedList<>();
        queue.add(nodeId);
        visitedIds.add(nodeId);

        int currentDepth = 0;
        while (!queue.isEmpty() && currentDepth < depth) {
            int size = queue.size();
            for (int i = 0; i < size; i++) {
                Long currentId = queue.poll();
                List<KnowledgeEdge> edges = edgeRepository.findBySourceIdOrTargetId(currentId, currentId);
                for (KnowledgeEdge edge : edges) {
                    Long neighborId = edge.getSourceId().equals(currentId) ? edge.getTargetId() : edge.getSourceId();
                    if (visitedIds.add(neighborId)) {
                        queue.add(neighborId);
                    }
                }
            }
            currentDepth++;
        }

        List<KnowledgeNode> nodes = nodeRepository.findAllById(visitedIds);
        List<KnowledgeEdge> edges = new ArrayList<>();
        for (Long id : visitedIds) {
            edges.addAll(edgeRepository.findBySourceIdOrTargetId(id, id));
        }

        List<KnowledgeEdge> filteredEdges = edges.stream()
                .filter(e -> visitedIds.contains(e.getSourceId()) && visitedIds.contains(e.getTargetId()))
                .distinct()
                .collect(Collectors.toList());

        return GraphDataDTO.builder()
                .nodes(nodes.stream().map(this::toNodeDTO).collect(Collectors.toList()))
                .edges(filteredEdges.stream().map(this::toEdgeDTO).collect(Collectors.toList()))
                .build();
    }

    public Page<KnowledgeNodeDTO> searchNodes(String keyword, Pageable pageable) {
        return nodeRepository.searchByTitle(keyword, pageable).map(this::toNodeDTO);
    }

    private KnowledgeNodeDTO toNodeDTO(KnowledgeNode node) {
        return toNodeDTO(node, null);
    }

    /**
     * mastery 来自 study_progress 表，需要当前用户上下文。
     * masteryByNode == null 时跳过 mastery 注入（unauthed / 不关心 mastery 的端点）。
     */
    private KnowledgeNodeDTO toNodeDTO(KnowledgeNode node, java.util.Map<Long, Integer> masteryByNode) {
        Long subjectId = (node.getTopic() != null && node.getTopic().getSubject() != null)
                ? node.getTopic().getSubject().getId() : null;
        Integer mastery = (masteryByNode != null) ? masteryByNode.get(node.getId()) : null;
        return KnowledgeNodeDTO.builder()
                .id(node.getId())
                .title(node.getTitle())
                .content(node.getContent())
                .difficulty(node.getDifficulty())
                .topicId(node.getTopicId())
                .topicName(node.getTopic() != null ? node.getTopic().getName() : null)
                .subjectId(subjectId)
                .subjectName(node.getTopic() != null && node.getTopic().getSubject() != null
                        ? node.getTopic().getSubject().getName() : null)
                .mastery(mastery)
                .metadata(node.getMetadata())
                .createdAt(node.getCreatedAt())
                .build();
    }

    private KnowledgeEdgeDTO toEdgeDTO(KnowledgeEdge edge) {
        return KnowledgeEdgeDTO.builder()
                .id(edge.getId())
                .sourceId(edge.getSourceId())
                .targetId(edge.getTargetId())
                .sourceTitle(edge.getSource() != null ? edge.getSource().getTitle() : null)
                .targetTitle(edge.getTarget() != null ? edge.getTarget().getTitle() : null)
                .relationType(edge.getRelationType())
                .weight(edge.getWeight())
                .description(edge.getDescription())
                .build();
    }
}
