package com.study11408;

import com.study11408.dto.WeaknessRadarResponse;
import com.study11408.entity.KnowledgeNode;
import com.study11408.entity.StudyProgress;
import com.study11408.entity.Subject;
import com.study11408.entity.Topic;
import com.study11408.repository.KnowledgeNodeRepository;
import com.study11408.repository.StudyProgressRepository;
import com.study11408.repository.StudySessionRepository;
import com.study11408.repository.SubjectRepository;
import com.study11408.repository.TopicRepository;
import com.study11408.repository.WrongAnswerRepository;
import com.study11408.service.StatsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

/**
 * StatsService.getWeaknessRadar 单测：
 * <ul>
 *   <li>无进度用户 → 4 学科 mastery=0，weakTopics 空</li>
 *   <li>有进度 → mastery 计算正确（subject 维度均值）</li>
 *   <li>weakTopics 按 mastery ASC 排序，最多 10 条</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class StatsServiceWeaknessRadarUnitTest {

    @Mock private StudyProgressRepository progressRepository;
    @Mock private StudySessionRepository sessionRepository;
    @Mock private WrongAnswerRepository wrongAnswerRepository;
    @Mock private KnowledgeNodeRepository nodeRepository;
    @Mock private SubjectRepository subjectRepository;
    @Mock private TopicRepository topicRepository;

    private StatsService service;
    private static final long USER_ID = 1L;

    @BeforeEach
    void setup() {
        service = new StatsService(progressRepository, sessionRepository,
                wrongAnswerRepository, nodeRepository, subjectRepository, topicRepository);
    }

    private static Subject subj(long id, String name, int order) {
        Subject s = new Subject();
        s.setId(id); s.setName(name); s.setCode(name); s.setSortOrder(order);
        return s;
    }

    private static Topic topic(long id, Subject s, String name) {
        Topic t = new Topic();
        t.setId(id); t.setName(name); t.setSubject(s);
        return t;
    }

    private static KnowledgeNode node(long id, Topic t, String title) {
        return KnowledgeNode.builder().id(id).title(title).topic(t).build();
    }

    private static StudyProgress progress(KnowledgeNode n, int mastery) {
        StudyProgress p = StudyProgress.builder().node(n).masteryLevel(mastery).build();
        p.setNodeId(n.getId());
        return p;
    }

    @Test
    void empty_user_returns_all_subjects_zero_mastery() {
        Subject s1 = subj(1L, "政治", 1);
        Subject s2 = subj(2L, "英语一", 2);
        when(subjectRepository.findAllByOrderBySortOrderAsc()).thenReturn(List.of(s1, s2));
        when(progressRepository.findByUserIdWithNodeSubject(USER_ID)).thenReturn(List.of());
        when(nodeRepository.findAll()).thenReturn(List.of());

        WeaknessRadarResponse resp = service.getWeaknessRadar(USER_ID);

        assertThat(resp.getSubjects()).hasSize(2);
        assertThat(resp.getSubjects().get(0).getMastery()).isEqualTo(0.0);
        assertThat(resp.getSubjects().get(0).getStudied()).isEqualTo(0);
        assertThat(resp.getWeakTopics()).isEmpty();
    }

    @Test
    void mastery_is_averaged_per_subject() {
        Subject sP = subj(1L, "政治", 1);
        Topic tA = topic(10L, sP, "马原");
        KnowledgeNode n1 = node(100L, tA, "唯物论");
        KnowledgeNode n2 = node(101L, tA, "辩证法");

        when(subjectRepository.findAllByOrderBySortOrderAsc()).thenReturn(List.of(sP));
        when(progressRepository.findByUserIdWithNodeSubject(USER_ID))
                .thenReturn(List.of(progress(n1, 80), progress(n2, 40)));
        when(nodeRepository.findAll()).thenReturn(List.of(n1, n2));

        WeaknessRadarResponse resp = service.getWeaknessRadar(USER_ID);

        assertThat(resp.getSubjects()).hasSize(1);
        assertThat(resp.getSubjects().get(0).getMastery()).isEqualTo(60.0); // (80+40)/2
        assertThat(resp.getSubjects().get(0).getStudied()).isEqualTo(2);
        assertThat(resp.getSubjects().get(0).getNodes()).isEqualTo(2);
    }

    @Test
    void weak_topics_sorted_by_mastery_ascending_and_limited_to_10() {
        Subject s = subj(1L, "数学一", 1);
        List<Topic> topics = new java.util.ArrayList<>();
        List<KnowledgeNode> allNodes = new java.util.ArrayList<>();
        List<StudyProgress> allProgress = new java.util.ArrayList<>();

        // 12 个 topic，mastery 从 10 到 120 step 10
        for (int i = 1; i <= 12; i++) {
            Topic t = topic(100L + i, s, "topic" + i);
            topics.add(t);
            KnowledgeNode n = node(1000L + i, t, "n" + i);
            allNodes.add(n);
            allProgress.add(progress(n, i * 10));  // mastery: 10, 20, ..., 120
        }
        when(subjectRepository.findAllByOrderBySortOrderAsc()).thenReturn(List.of(s));
        when(progressRepository.findByUserIdWithNodeSubject(USER_ID)).thenReturn(allProgress);
        when(nodeRepository.findAll()).thenReturn(allNodes);

        WeaknessRadarResponse resp = service.getWeaknessRadar(USER_ID);

        assertThat(resp.getWeakTopics()).hasSize(10);  // 限 10 条
        // 第一个应该是 mastery=10 的 topic1，最后一个是 mastery=100 的 topic10
        assertThat(resp.getWeakTopics().get(0).getMastery()).isEqualTo(10.0);
        assertThat(resp.getWeakTopics().get(9).getMastery()).isEqualTo(100.0);
        // 排序：升序
        for (int i = 1; i < resp.getWeakTopics().size(); i++) {
            assertThat(resp.getWeakTopics().get(i).getMastery())
                    .isGreaterThanOrEqualTo(resp.getWeakTopics().get(i - 1).getMastery());
        }
    }
}
