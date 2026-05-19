package com.study11408.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.study11408.dto.SimilarQuestionsResponse;
import com.study11408.dto.SimilarQuestionsResponse.SimilarItem;
import com.study11408.dto.WrongAnswerDTO;
import com.study11408.dto.WrongAnswerGroupDTO;
import com.study11408.entity.KnowledgeNode;
import com.study11408.entity.QuizQuestion;
import com.study11408.entity.User;
import com.study11408.entity.WrongAnswer;
import com.study11408.exception.BusinessException;
import com.study11408.repository.QuizQuestionRepository;
import com.study11408.repository.WrongAnswerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 错题闭环核心服务。
 *
 * 职责：
 * 1. 记录错题并在累计 >= 2 次时触发 SM-2 入队（{@link #recordAndMaybeEnqueue}）
 * 2. 按 node 聚合返回错题本（{@link #listGroupedByNode}）
 * 3. 提供相似题查询（{@link #findSimilar}）：检索优先 → 同 topic → 同 subject → LLM 兜底
 * 4. 标记已掌握（{@link #resolve}）
 *
 * 越权：findById... 一律走 findByIdAndUserId；不在白名单则 BusinessException(FORBIDDEN)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WrongAnswerService {

    /** 同题答错累计达到此次数时入复习队列；< 该值仅记录不入队 */
    private static final int ENQUEUE_THRESHOLD = 2;

    /** 相似题 LLM 兜底返回的题型固定为 CHOICE，与 ai-service 默认一致 */
    private static final String DEFAULT_AI_QUIZ_TYPE = "CHOICE";

    private final WrongAnswerRepository wrongAnswerRepository;
    private final QuizQuestionRepository quizQuestionRepository;
    private final SpacedRepetitionService spacedRepetitionService;
    private final AiClientService aiClientService;
    private final AiRateLimiter aiRateLimiter;
    private final ObjectMapper objectMapper;

    /**
     * 答错后调用：累计错误次数，达阈值则把对应 node 入复习队列并 mark enqueued_at。
     * <p>幂等：同题同次答错只入队一次；如果已经入过队，仅记录新的 wrong_answers 行不再触发入队。
     */
    @Transactional
    public void recordAndMaybeEnqueue(User user, QuizQuestion question, String userAnswer) {
        if (user == null || question == null) {
            log.warn("recordAndMaybeEnqueue called with null user/question");
            return;
        }

        WrongAnswer entry = WrongAnswer.builder()
                .user(user)
                .question(question)
                .userAnswer(userAnswer)
                .answeredAt(LocalDateTime.now())
                .resolved(false)
                .build();
        wrongAnswerRepository.save(entry);

        long openWrongCount = wrongAnswerRepository
                .countByUserIdAndQuestionIdAndResolvedFalseAndEnqueuedAtIsNull(
                        user.getId(), question.getId());

        if (openWrongCount >= ENQUEUE_THRESHOLD && question.getNodeId() != null) {
            try {
                spacedRepetitionService.enqueueWrongQuestion(user.getId(), question.getNodeId());
                int marked = wrongAnswerRepository.markEnqueued(
                        user.getId(), question.getId(), LocalDateTime.now());
                log.info("Wrong-answer enqueued: uid={} qid={} node={} marked={} rows",
                        user.getId(), question.getId(), question.getNodeId(), marked);
            } catch (Exception e) {
                // 入队失败仅 warn，不阻断答题主流程
                log.warn("enqueue wrong answer failed uid={} qid={} err={}",
                        user.getId(), question.getId(), e.getMessage());
            }
        }
    }

    /** 错题本：按 node 聚合，含错误次数、最近答错时间、是否已入队。 */
    @Transactional(readOnly = true)
    public List<WrongAnswerGroupDTO> listGroupedByNode(Long userId) {
        // FETCH JOIN 一次性拉 question + node + topic + subject，避免后续 stream 中
        // 每条 w.getQuestion().getNode()... 触发 N+1
        List<WrongAnswer> open = wrongAnswerRepository.findOpenWithGraph(userId);
        if (open.isEmpty()) return List.of();

        // 按 nodeId 分组（无 nodeId 的题归入 -1L 桶）
        var groups = open.stream()
                .collect(Collectors.groupingBy(w -> {
                    KnowledgeNode n = w.getQuestion() != null ? w.getQuestion().getNode() : null;
                    return n != null ? n.getId() : -1L;
                }));

        List<WrongAnswerGroupDTO> result = new ArrayList<>(groups.size());
        for (var entry : groups.entrySet()) {
            List<WrongAnswer> items = entry.getValue();
            LocalDateTime latest = items.stream()
                    .map(WrongAnswer::getAnsweredAt)
                    .filter(java.util.Objects::nonNull)
                    .max(Comparator.naturalOrder())
                    .orElse(null);
            boolean anyEnqueued = items.stream()
                    .anyMatch(w -> w.getEnqueuedAt() != null);

            KnowledgeNode node = items.get(0).getQuestion() != null
                    ? items.get(0).getQuestion().getNode()
                    : null;

            result.add(WrongAnswerGroupDTO.builder()
                    .nodeId(node != null ? node.getId() : null)
                    .nodeTitle(node != null ? node.getTitle() : "未关联节点")
                    .topicName(node != null && node.getTopic() != null ? node.getTopic().getName() : null)
                    .subjectName(node != null && node.getTopic() != null && node.getTopic().getSubject() != null
                            ? node.getTopic().getSubject().getName() : null)
                    .wrongCount(items.size())
                    .latestAt(latest)
                    .enqueued(anyEnqueued)
                    .items(items.stream().map(this::toDto).toList())
                    .build());
        }

        result.sort(Comparator
                .comparing(WrongAnswerGroupDTO::getLatestAt,
                        Comparator.nullsLast(Comparator.reverseOrder())));
        return result;
    }

    /**
     * 相似题三档检索 + LLM 兜底。
     */
    @Transactional(readOnly = true)
    public SimilarQuestionsResponse findSimilar(Long userId, Long wrongAnswerId, int limit) {
        if (limit <= 0) limit = 5;
        if (limit > 20) limit = 20;  // 上限保护

        WrongAnswer wa = wrongAnswerRepository.findByIdAndUserId(wrongAnswerId, userId)
                .orElseThrow(() -> new BusinessException("错题不存在或无权限", HttpStatus.NOT_FOUND));

        QuizQuestion srcQuestion = wa.getQuestion();
        if (srcQuestion == null || srcQuestion.getNode() == null) {
            return SimilarQuestionsResponse.builder()
                    .source("EMPTY")
                    .items(List.of())
                    .aiAvailable(false)
                    .totalFromDb(0)
                    .totalGenerated(0)
                    .build();
        }
        KnowledgeNode node = srcQuestion.getNode();
        Long topicId = node.getTopic() != null ? node.getTopic().getId() : null;
        Long subjectId = node.getTopic() != null && node.getTopic().getSubject() != null
                ? node.getTopic().getSubject().getId() : null;
        Set<Long> excludeIds = new HashSet<>();
        excludeIds.add(srcQuestion.getId());

        // bucket 与 bucketIds 同步维护，把第 2/3 档的 O(N²) noneMatch 降到 O(1) Set 查询
        List<QuizQuestion> bucket = new ArrayList<>();
        Set<Long> bucketIds = new HashSet<>();
        for (QuizQuestion q : quizQuestionRepository.findByNodeId(node.getId())) {
            if (excludeIds.contains(q.getId())) continue;
            if (bucketIds.add(q.getId())) bucket.add(q);
        }
        String source = "DB_NODE";

        // 第 2 档：同 topic
        if (bucket.size() < limit && topicId != null) {
            for (QuizQuestion q : quizQuestionRepository.findByNodeTopicId(topicId)) {
                if (excludeIds.contains(q.getId())) continue;
                if (bucketIds.add(q.getId())) {
                    bucket.add(q);
                    if (bucket.size() >= limit * 2) break;
                }
            }
            if (!bucket.isEmpty()) source = "DB_TOPIC";
        }

        // 第 3 档：同 subject
        if (bucket.size() < limit && subjectId != null) {
            for (QuizQuestion q : quizQuestionRepository.findByNodeTopicSubjectId(subjectId)) {
                if (excludeIds.contains(q.getId())) continue;
                if (bucketIds.add(q.getId())) {
                    bucket.add(q);
                    if (bucket.size() >= limit * 2) break;
                }
            }
            if (!bucket.isEmpty()) source = "DB_SUBJECT";
        }

        // 库内打乱后取前 limit
        Collections.shuffle(bucket);
        List<QuizQuestion> dbPicked = bucket.size() > limit ? bucket.subList(0, limit) : bucket;

        List<SimilarItem> items = new ArrayList<>(dbPicked.size());
        for (QuizQuestion q : dbPicked) {
            items.add(SimilarItem.builder()
                    .id(q.getId())
                    .content(q.getContent())
                    .options(q.getOptions())
                    .answer(q.getAnswer())
                    .explanation(q.getExplanation())
                    .questionType(q.getQuestionType())
                    .generated(false)
                    .build());
        }

        int totalFromDb = items.size();
        int needed = limit - totalFromDb;
        boolean aiAvailable = true;
        int totalGenerated = 0;

        // 第 4 档：LLM 兜底
        if (needed > 0) {
            try {
                aiRateLimiter.check(userId);
                String diff = node.getDifficulty();
                Map<String, Object> aiResp = aiClientService.generateQuiz(
                        node.getTitle(),
                        node.getContent() != null ? node.getContent() : "",
                        DEFAULT_AI_QUIZ_TYPE,
                        needed,
                        diff);
                if (aiResp == null || aiResp.containsKey("error")) {
                    aiAvailable = false;
                    log.info("Similar AI fallback returned error: {}", aiResp);
                } else {
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> raw = (List<Map<String, Object>>) aiResp.get("questions");
                    if (raw != null) {
                        for (Map<String, Object> q : raw) {
                            try {
                                SimilarItem ai = toAiItem(q);
                                if (ai != null) {
                                    items.add(ai);
                                    totalGenerated++;
                                }
                            } catch (Exception e) {
                                log.debug("similar AI item skip: {}", e.getMessage());
                            }
                            if (items.size() >= limit) break;
                        }
                    }
                }
            } catch (BusinessException be) {
                // 429 限流：透传给前端
                throw be;
            } catch (Exception e) {
                log.warn("Similar AI fallback failed: {}", e.getMessage());
                aiAvailable = false;
            }
        }

        if (totalGenerated > 0 && totalFromDb > 0) source = "MIXED";
        else if (totalGenerated > 0) source = "AI_FALLBACK";

        return SimilarQuestionsResponse.builder()
                .source(source)
                .items(items)
                .aiAvailable(aiAvailable)
                .totalFromDb(totalFromDb)
                .totalGenerated(totalGenerated)
                .build();
    }

    /** 标记错题已掌握。 */
    @Transactional
    public WrongAnswerDTO resolve(Long userId, Long wrongAnswerId) {
        WrongAnswer w = wrongAnswerRepository.findByIdAndUserId(wrongAnswerId, userId)
                .orElseThrow(() -> new BusinessException("错题不存在或无权限", HttpStatus.NOT_FOUND));
        if (!Boolean.TRUE.equals(w.getResolved())) {
            w.setResolved(true);
            wrongAnswerRepository.save(w);
        }
        return toDto(w);
    }

    // --- helpers ---

    private SimilarItem toAiItem(Map<String, Object> q) {
        String questionText = strOrEmpty(q.get("question"));
        if (questionText.isEmpty()) return null;
        String type = strOrEmpty(q.get("question_type"));
        if (type.isEmpty()) type = DEFAULT_AI_QUIZ_TYPE;
        String answer = strOrEmpty(q.get("answer"));
        if (answer.isEmpty()) return null;

        String optionsJson = null;
        Object optsObj = q.get("options");
        if (optsObj instanceof List<?> optList && !optList.isEmpty()) {
            try {
                optionsJson = objectMapper.writeValueAsString(optList);
            } catch (Exception e) {
                optionsJson = null;
            }
        }
        return SimilarItem.builder()
                .id(null)
                .content(questionText)
                .options(optionsJson)
                .answer(answer)
                .explanation(strOrEmpty(q.get("explanation")))
                .questionType(type)
                .generated(true)
                .build();
    }

    private String strOrEmpty(Object v) {
        return v == null ? "" : String.valueOf(v).trim();
    }

    private WrongAnswerDTO toDto(WrongAnswer w) {
        QuizQuestion q = w.getQuestion();
        KnowledgeNode node = q != null ? q.getNode() : null;
        return WrongAnswerDTO.builder()
                .id(w.getId())
                .questionId(q != null ? q.getId() : null)
                .nodeId(node != null ? node.getId() : null)
                .questionText(q != null ? q.getContent() : null)
                .userAnswer(w.getUserAnswer())
                .correctAnswer(q != null ? q.getAnswer() : null)
                .explanation(q != null ? q.getExplanation() : null)
                .answeredAt(w.getAnsweredAt())
                .resolved(w.getResolved())
                .topicName(node != null && node.getTopic() != null ? node.getTopic().getName() : null)
                .nodeTitle(node != null ? node.getTitle() : null)
                .errorCategory(w.getErrorCategory())
                .build();
    }

    /** 同步处理上限,防止一次性把 AI 服务打挂 */
    private static final int CLASSIFY_BATCH_MAX = 3;

    /**
     * 给当前用户未归类的未解决错题打 AI 病因标签。每次最多处理 CLASSIFY_BATCH_MAX 条,
     * 保持响应延迟在 5-10 秒内。
     * <p>幂等:已归类(errorCategory NOT NULL)的条目跳过。
     * <p>best-effort:AI 失败时该条目保持 null,下次调用还会再试。
     *
     * @return 本次实际归类的条目数
     */
    @Transactional
    public int classifyPendingForUser(Long userId) {
        if (userId == null) return 0;
        List<WrongAnswer> pending = wrongAnswerRepository
                .findTop3ByUserIdAndResolvedFalseAndErrorCategoryIsNullOrderByAnsweredAtDesc(userId);
        if (pending.isEmpty()) return 0;
        int classified = 0;
        for (WrongAnswer w : pending) {
            String cat = classifyOne(w);
            if (cat != null) {
                w.setErrorCategory(cat);
                wrongAnswerRepository.save(w);
                classified++;
            }
            if (classified >= CLASSIFY_BATCH_MAX) break;
        }
        log.info("classifyPendingForUser uid={} classified={}/{}", userId, classified, pending.size());
        return classified;
    }

    /**
     * 调用 AI 对单条错题归类。返回 null 表示 AI 不可用或解析失败,调用方应保留 null 让下次重试。
     */
    private String classifyOne(WrongAnswer w) {
        if (w == null || w.getQuestion() == null) return null;
        QuizQuestion q = w.getQuestion();
        List<String> opts = parseOptions(q.getOptions());
        Map<String, Object> resp = aiClientService.classifyWrongAnswer(
                strOrEmpty(q.getContent()),
                opts,
                strOrEmpty(q.getAnswer()),
                strOrEmpty(w.getUserAnswer()),
                q.getExplanation());
        if (resp == null || resp.containsKey("error")) return null;
        Object cat = resp.get("category");
        if (!(cat instanceof String s) || s.isBlank()) return null;
        // 白名单防御 — 即便 AI 输出乱来也不会写脏数据
        Set<String> allowed = Set.of(
                "CONCEPT_UNCLEAR", "CALCULATION_ERROR",
                "MISREAD_QUESTION", "KNOWLEDGE_GAP", "UNFAMILIAR_TYPE");
        return allowed.contains(s) ? s : null;
    }

    /** 把 jsonb options 字段解析成 List<String>;为空 / 解析失败返回空 list。 */
    private List<String> parseOptions(String optionsJson) {
        if (optionsJson == null || optionsJson.isBlank()) return Collections.emptyList();
        try {
            return objectMapper.readValue(
                    optionsJson, objectMapper.getTypeFactory().constructCollectionType(List.class, String.class));
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }
}
