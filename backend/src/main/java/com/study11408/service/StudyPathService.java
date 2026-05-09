package com.study11408.service;

import com.study11408.dto.KnowledgeNodeDTO;
import com.study11408.dto.StudyPlanRequest;
import com.study11408.entity.KnowledgeEdge;
import com.study11408.entity.KnowledgeNode;
import com.study11408.entity.StudyProgress;
import com.study11408.entity.Subject;
import com.study11408.entity.User;
import com.study11408.entity.WrongAnswer;
import com.study11408.exception.BusinessException;
import com.study11408.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class StudyPathService {

    private final KnowledgeNodeRepository nodeRepository;
    private final KnowledgeEdgeRepository edgeRepository;
    private final StudyProgressRepository progressRepository;
    private final UserRepository userRepository;
    private final SpacedRepetitionService spacedRepetitionService;
    private final SubjectRepository subjectRepository;
    private final WrongAnswerRepository wrongAnswerRepository;
    private final AiClientService aiClientService;

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
                if ("PREREQUISITE".equalsIgnoreCase(edge.getRelationType()) && nodeIds.contains(edge.getTargetId())) {
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

    public StudyProgress getNodeProgress(Long userId, Long nodeId) {
        return progressRepository.findByUserIdAndNodeId(userId, nodeId)
                .orElseThrow(() -> new BusinessException("学习进度不存在", HttpStatus.NOT_FOUND));
    }

    /**
     * 生成 AI 学习计划：
     * <ol>
     *   <li>校验用户存在 + weeks 在 [1, 52]（controller 层 @Valid 兜底，
     *       service 层防御式再校验一次以便单测覆盖）</li>
     *   <li>统计已学知识点 / 总知识点（用于让 LLM 估计基础水平）</li>
     *   <li>挑出薄弱主题 top 3-5（按错题节点出现频次 desc，
     *       fallback 到 mastery&lt;50 的节点）</li>
     *   <li>若 subjectId 给定，查 SubjectRepository 拿名字注入 prompt</li>
     *   <li>调用 AiClientService.generateStudyPlan，返回原始 map</li>
     * </ol>
     *
     * <p>非阻断式：subject/weakTopics 缺失时仍能产出通用计划，由 LLM 兜底。
     */
    @Transactional(readOnly = true)
    public Map<String, Object> generateAiPlan(Long userId, StudyPlanRequest req) {
        if (req == null) {
            throw new BusinessException("请求体不能为空", HttpStatus.BAD_REQUEST);
        }
        if (req.getGoal() == null || req.getGoal().isBlank()) {
            throw new BusinessException("goal 不能为空", HttpStatus.BAD_REQUEST);
        }
        if (req.getWeeks() < 1 || req.getWeeks() > 52) {
            throw new BusinessException("weeks 必须在 1-52 之间", HttpStatus.BAD_REQUEST);
        }
        if (!userRepository.existsById(userId)) {
            throw new BusinessException("用户不存在", HttpStatus.NOT_FOUND);
        }

        // —— 进度统计 ——
        long totalNodes = nodeRepository.count();
        long studiedNodes = progressRepository.findByUserId(userId).size();

        // —— 学科名（subjectId 可空）——
        String subjectName = null;
        if (req.getSubjectId() != null) {
            Subject subject = subjectRepository.findById(req.getSubjectId())
                    .orElseThrow(() -> new BusinessException(
                            "学科不存在", HttpStatus.NOT_FOUND));
            subjectName = subject.getName();
        }

        // —— 薄弱主题：按错题节点频次 desc，取 topic 名字 ——
        List<String> weakTopics = computeWeakTopics(userId, 5);

        log.info(
                "AI 学习计划生成 userId={} subject={} weeks={} goal={} weakTopics={} progress={}/{}",
                userId,
                subjectName,
                req.getWeeks(),
                req.getGoal(),
                weakTopics.size(),
                studiedNodes,
                totalNodes);

        return aiClientService.generateStudyPlan(
                req.getGoal(),
                req.getWeeks(),
                subjectName,
                weakTopics,
                studiedNodes,
                totalNodes);
    }

    /**
     * 计算用户薄弱主题：
     * <ol>
     *   <li>主源：错题节点频次 desc，取对应 topic name</li>
     *   <li>补足：低 mastery (&lt;50) 的节点 topic name</li>
     *   <li>去重 + 截断到 limit</li>
     * </ol>
     * 全部为派生数据，无新表。
     */
    private List<String> computeWeakTopics(Long userId, int limit) {
        // 主源：错题节点 → topic name
        List<WrongAnswer> wrongAnswers = wrongAnswerRepository.findByUserId(userId);
        Map<Long, Long> wrongCountByNode = wrongAnswers.stream()
                .filter(w -> w.getQuestion() != null && w.getQuestion().getNodeId() != null)
                .collect(Collectors.groupingBy(
                        w -> w.getQuestion().getNodeId(),
                        Collectors.counting()));

        LinkedHashSet<String> topics = new LinkedHashSet<>();
        wrongCountByNode.entrySet().stream()
                .sorted(Map.Entry.<Long, Long>comparingByValue().reversed())
                .forEach(entry -> {
                    if (topics.size() >= limit) return;
                    nodeRepository.findById(entry.getKey()).ifPresent(node -> {
                        String topicName = node.getTopic() != null ? node.getTopic().getName() : null;
                        if (topicName != null && !topicName.isBlank()) {
                            topics.add(topicName);
                        }
                    });
                });

        // 补足：低 mastery 节点
        if (topics.size() < limit) {
            List<StudyProgress> lowMastery = progressRepository.findByUserId(userId).stream()
                    .filter(p -> p.getMasteryLevel() != null && p.getMasteryLevel() < 50)
                    .sorted(Comparator.comparingInt(StudyProgress::getMasteryLevel))
                    .collect(Collectors.toList());
            for (StudyProgress p : lowMastery) {
                if (topics.size() >= limit) break;
                if (p.getNode() != null && p.getNode().getTopic() != null) {
                    String name = p.getNode().getTopic().getName();
                    if (name != null && !name.isBlank()) {
                        topics.add(name);
                    }
                }
            }
        }

        return new ArrayList<>(topics);
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
