package com.study11408.service;

import com.study11408.dto.*;
import com.study11408.entity.KnowledgeEdge;
import com.study11408.entity.KnowledgeNode;
import com.study11408.entity.Topic;
import com.study11408.exception.BusinessException;
import com.study11408.repository.KnowledgeEdgeRepository;
import com.study11408.repository.KnowledgeNodeRepository;
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

    private final KnowledgeNodeRepository nodeRepository;
    private final KnowledgeEdgeRepository edgeRepository;
    private final TopicRepository topicRepository;

    public Page<KnowledgeNodeDTO> getNodes(Long topicId, Long subjectId, String keyword, Pageable pageable) {
        return nodeRepository.findFiltered(topicId, subjectId, keyword, pageable)
                .map(this::toNodeDTO);
    }

    public KnowledgeNodeDTO getNodeById(Long id) {
        KnowledgeNode node = nodeRepository.findById(id)
                .orElseThrow(() -> new BusinessException("知识节点不存在", HttpStatus.NOT_FOUND));
        return toNodeDTO(node);
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
                .relationType(request.getRelationType())
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

        return GraphDataDTO.builder()
                .nodes(nodes.stream().map(this::toNodeDTO).collect(Collectors.toList()))
                .edges(filteredEdges.stream().map(this::toEdgeDTO).collect(Collectors.toList()))
                .build();
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
