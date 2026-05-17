package com.study11408.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.study11408.dto.KnowledgeNodeDTO;
import com.study11408.dto.StudyPlanRequest;
import com.study11408.entity.KnowledgeEdge;
import com.study11408.entity.KnowledgeNode;
import com.study11408.entity.StudyPlan;
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
    private final StudyPlanRepository studyPlanRepository;
    private final ObjectMapper objectMapper;

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
     * 用户首次"接触"知识点时调用：若进度未存在，建一条 mastery=0 的初始记录；
     * 若已存在则 no-op。让 dashboard "已学" 指标真实增长。
     *
     * <p>幂等：同一 (userId, nodeId) 多次调用只会创建一次。
     */
    @Transactional
    public StudyProgress touchProgress(Long userId, Long nodeId) {
        var existing = progressRepository.findByUserIdAndNodeId(userId, nodeId);
        if (existing.isPresent()) {
            return existing.get();
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("用户不存在", HttpStatus.NOT_FOUND));
        KnowledgeNode node = nodeRepository.findById(nodeId)
                .orElseThrow(() -> new BusinessException("知识节点不存在", HttpStatus.NOT_FOUND));
        StudyProgress fresh = StudyProgress.builder()
                .user(user)
                .node(node)
                .masteryLevel(0)
                .repetitionCount(0)
                .easeFactor(2.5)
                .intervalDays(0)
                .build();
        try {
            return progressRepository.save(fresh);
        } catch (org.springframework.dao.DataIntegrityViolationException race) {
            // unique(user_id, node_id) race：另一并发请求同时新建。
            // 回退到 find，确保幂等不抛 500。
            return progressRepository.findByUserIdAndNodeId(userId, nodeId)
                    .orElseThrow(() -> race);
        }
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
     *   <li>调用 AiClientService.generateStudyPlan</li>
     *   <li><b>v2:</b> 若 ai-service 返回非 error 且 plan 数组非空，序列化整个
     *       plan 数组到 plan_json，落库一条 StudyPlan，并把生成的 planId
     *       注入返回 map，让前端跨设备取回完整计划。</li>
     * </ol>
     *
     * <p>非阻断式：subject/weakTopics 缺失时仍能产出通用计划，由 LLM 兜底。
     * 持久化失败（JSON 序列化异常 / DB 异常）也不阻断生成 —— 只 log 警告，
     * 返回 map 不带 planId 即视为本次未入库。
     */
    @Transactional
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

        Map<String, Object> aiResp = aiClientService.generateStudyPlan(
                req.getGoal(),
                req.getWeeks(),
                subjectName,
                weakTopics,
                studiedNodes,
                totalNodes);

        // —— v2: 若生成成功就落库 + 注入 planId ——
        // 用可变 wrapper 让我们能往里塞 planId（aiResp 可能是 Map.of(...) 不可变实现）。
        Map<String, Object> result = new HashMap<>(aiResp != null ? aiResp : Map.of());
        Object planObj = result.get("plan");
        if (planObj instanceof List<?> planList && !planList.isEmpty() && !result.containsKey("error")) {
            try {
                String planJson = objectMapper.writeValueAsString(planList);
                String summary = result.get("summary") instanceof String s ? s : null;
                User userRef = userRepository.getReferenceById(userId);
                StudyPlan saved = studyPlanRepository.save(StudyPlan.builder()
                        .user(userRef)
                        .subjectId(req.getSubjectId())
                        .weeks(req.getWeeks())
                        .goal(req.getGoal())
                        .summary(summary)
                        .planJson(planJson)
                        .build());
                result.put("planId", saved.getId());
                log.info("AI 学习计划已入库 userId={} planId={} weeks={}",
                        userId, saved.getId(), req.getWeeks());
            } catch (JsonProcessingException e) {
                log.warn("AI 学习计划序列化失败 userId={}: {}", userId, e.getMessage());
            } catch (RuntimeException e) {
                log.warn("AI 学习计划入库失败 userId={}: {}", userId, e.getMessage());
            }
        }

        return result;
    }

    /** 列表：用户的所有保存的 AI 计划，最新在前。 */
    @Transactional(readOnly = true)
    public List<StudyPlan> listUserPlans(Long userId) {
        return studyPlanRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    /**
     * 详情：拿单份计划。带 ownership 校验，避免越权读其他用户的计划。
     * @throws BusinessException(NOT_FOUND) 如果 planId 不存在或不属于 userId
     */
    @Transactional(readOnly = true)
    public StudyPlan getUserPlan(Long userId, Long planId) {
        return studyPlanRepository.findByIdAndUserId(planId, userId)
                .orElseThrow(() -> new BusinessException(
                        "学习计划不存在", HttpStatus.NOT_FOUND));
    }

    /**
     * 删除：同样需 ownership 校验。
     * @throws BusinessException(NOT_FOUND) 如果 planId 不存在或不属于 userId
     */
    @Transactional
    public void deleteUserPlan(Long userId, Long planId) {
        StudyPlan plan = studyPlanRepository.findByIdAndUserId(planId, userId)
                .orElseThrow(() -> new BusinessException(
                        "学习计划不存在", HttpStatus.NOT_FOUND));
        studyPlanRepository.delete(plan);
        log.info("AI 学习计划已删除 userId={} planId={}", userId, planId);
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
