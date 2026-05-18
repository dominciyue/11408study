package com.study11408;

import com.study11408.dto.WeeklyReportDTO;
import com.study11408.entity.KnowledgeNode;
import com.study11408.entity.StudyProgress;
import com.study11408.entity.StudySession;
import com.study11408.entity.Topic;
import com.study11408.repository.StudyProgressRepository;
import com.study11408.repository.StudySessionRepository;
import com.study11408.repository.SubjectRepository;
import com.study11408.repository.WrongAnswerRepository;
import com.study11408.service.WeeklyReportService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

/**
 * Unit test for {@link WeeklyReportService#build} — 本周学习周报派生逻辑。
 *
 * <p>断言要点：
 * <ul>
 *   <li>新用户（无 sessions / progress / wrongs）→ 全 0 / 空数组、daysActive=0</li>
 *   <li>窗口=过去 7 天滚动；dailyMinutes 长度恒为 7</li>
 *   <li>窗口外的 session 不计入</li>
 *   <li>daysActive 按"窗口内有任何活动的天数"统计</li>
 *   <li>topWeakTopics 按 mastery&lt;50 的 topic 出现次数 desc 排序，限 5</li>
 *   <li>streakDays 从今天连续往前数到第一天没学就 break</li>
 *   <li>weekStart = 今天 - 6, weekEnd = 今天</li>
 * </ul>
 *
 * <p>风格参考 {@code StudyPathServiceAiPlanUnitTest}：纯 Mockito + AssertJ，无 DB。
 */
@ExtendWith(MockitoExtension.class)
class WeeklyReportServiceUnitTest {

    @Mock private StudySessionRepository sessionRepository;
    @Mock private StudyProgressRepository progressRepository;
    @Mock private WrongAnswerRepository wrongAnswerRepository;
    @Mock private SubjectRepository subjectRepository;

    @InjectMocks private WeeklyReportService service;

    private static final LocalDate TODAY = LocalDate.now(ZoneId.systemDefault());

    /** 构造一个落在指定日期的、固定时长的 session。 */
    private static StudySession session(LocalDate day, int minutes, int studied, int reviewed) {
        LocalDateTime start = day.atTime(10, 0);
        return StudySession.builder()
                .startTime(start)
                .endTime(minutes >= 0 ? start.plusMinutes(minutes) : null)
                .studiedNodes(studied)
                .reviewedNodes(reviewed)
                .build();
    }

    /** 构造 mastery<50 的 progress（绑定一个 topic name）。 */
    private static StudyProgress weakProgress(String topicName, int mastery) {
        Topic topic = Topic.builder().id(1L).name(topicName).build();
        KnowledgeNode node = KnowledgeNode.builder().id(1L).title("n").topic(topic).build();
        return StudyProgress.builder()
                .masteryLevel(mastery)
                .node(node)
                .build();
    }

    @Test
    void brand_new_user_returns_all_zero_and_window_dates() {
        when(sessionRepository.findByUserIdOrderByStartTimeDesc(1L)).thenReturn(Collections.emptyList());
        when(progressRepository.findByUserIdWithNodeSubject(1L)).thenReturn(Collections.emptyList());

        WeeklyReportDTO r = service.build(1L);

        assertThat(r.getWeekStart()).isEqualTo(TODAY.minusDays(6));
        assertThat(r.getWeekEnd()).isEqualTo(TODAY);
        assertThat(r.getTotalMinutes()).isEqualTo(0L);
        assertThat(r.getDaysActive()).isEqualTo(0);
        assertThat(r.getStudiedNodesThisWeek()).isEqualTo(0L);
        assertThat(r.getReviewedNodesThisWeek()).isEqualTo(0L);
        assertThat(r.getDailyMinutes()).hasSize(7).allSatisfy(m -> assertThat(m).isEqualTo(0L));
        assertThat(r.getStreakDays()).isEqualTo(0);
        assertThat(r.getTopWeakTopics()).isEmpty();
        assertThat(r.getEarnedBadges()).isEqualTo(0);
    }

    @Test
    void days_active_counts_distinct_days_with_activity_in_window() {
        // 7 天窗口里挑 3 天有 session（且 endTime 非空），其余 4 天无活动。
        // 注意：commit ab28263 之后 studiedNodesThisWeek / reviewedNodesThisWeek
        // 改为基于 StudyProgress.lastReview 计算（StudySession.studiedNodes 字段
        // 从未被递增过，永远是 0）。本用例 progressList 为空 → 该两项应为 0。
        // 真正的 studied/reviewed 计数交给 progress 维度的另一个用例验证。
        List<StudySession> sessions = List.of(
                session(TODAY, 30, 1, 0),
                session(TODAY.minusDays(1), 45, 2, 1),
                session(TODAY.minusDays(3), 20, 0, 3)
        );
        when(sessionRepository.findByUserIdOrderByStartTimeDesc(1L)).thenReturn(sessions);
        when(progressRepository.findByUserIdWithNodeSubject(1L)).thenReturn(Collections.emptyList());

        WeeklyReportDTO r = service.build(1L);

        assertThat(r.getDaysActive()).isEqualTo(3);
        assertThat(r.getTotalMinutes()).isEqualTo(95L);
        assertThat(r.getStudiedNodesThisWeek()).isEqualTo(0L);
        assertThat(r.getReviewedNodesThisWeek()).isEqualTo(0L);
    }

    @Test
    void daily_minutes_always_has_length_seven_and_indexed_from_oldest() {
        // 只在最早的一天（today-6）和今天有数据
        List<StudySession> sessions = List.of(
                session(TODAY.minusDays(6), 60, 0, 0),
                session(TODAY, 15, 0, 0)
        );
        when(sessionRepository.findByUserIdOrderByStartTimeDesc(1L)).thenReturn(sessions);
        when(progressRepository.findByUserIdWithNodeSubject(1L)).thenReturn(Collections.emptyList());

        WeeklyReportDTO r = service.build(1L);

        assertThat(r.getDailyMinutes()).hasSize(7);
        assertThat(r.getDailyMinutes().get(0)).isEqualTo(60L); // window start
        assertThat(r.getDailyMinutes().get(6)).isEqualTo(15L); // today
        // 中间 5 天都是 0
        for (int i = 1; i <= 5; i++) {
            assertThat(r.getDailyMinutes().get(i)).isEqualTo(0L);
        }
    }

    @Test
    void sessions_outside_window_are_ignored() {
        // 8 天前 + 30 天前的 session 都不应计入
        List<StudySession> sessions = List.of(
                session(TODAY.minusDays(8), 999, 99, 99),
                session(TODAY.minusDays(30), 999, 99, 99)
        );
        when(sessionRepository.findByUserIdOrderByStartTimeDesc(1L)).thenReturn(sessions);
        when(progressRepository.findByUserIdWithNodeSubject(1L)).thenReturn(Collections.emptyList());

        WeeklyReportDTO r = service.build(1L);

        assertThat(r.getTotalMinutes()).isEqualTo(0L);
        assertThat(r.getDaysActive()).isEqualTo(0);
        assertThat(r.getStudiedNodesThisWeek()).isEqualTo(0L);
        assertThat(r.getReviewedNodesThisWeek()).isEqualTo(0L);
    }

    @Test
    void top_weak_topics_ordered_by_count_desc_limited_to_five() {
        // 6 个 topic，每个出现次数不同，期望 top 5 desc，缺 mastery>=50 的"强主题"
        List<StudyProgress> progress = new ArrayList<>();
        // ds: 5 次
        for (int i = 0; i < 5; i++) progress.add(weakProgress("数据结构", 30));
        // os: 4 次
        for (int i = 0; i < 4; i++) progress.add(weakProgress("操作系统", 20));
        // co: 3 次
        for (int i = 0; i < 3; i++) progress.add(weakProgress("组成原理", 10));
        // net: 2 次
        for (int i = 0; i < 2; i++) progress.add(weakProgress("计算机网络", 40));
        // math: 1 次
        progress.add(weakProgress("高数", 25));
        // english: 1 次（共 6 个 topic，超 5 应被截掉一个；这两个并列由 sort 稳定性决定）
        progress.add(weakProgress("英语", 35));
        // 强主题 mastery=80：不应出现
        progress.add(weakProgress("政治", 80));

        when(sessionRepository.findByUserIdOrderByStartTimeDesc(1L)).thenReturn(Collections.emptyList());
        when(progressRepository.findByUserIdWithNodeSubject(1L)).thenReturn(progress);

        WeeklyReportDTO r = service.build(1L);

        assertThat(r.getTopWeakTopics()).hasSize(5);
        assertThat(r.getTopWeakTopics().get(0)).isEqualTo("数据结构");
        assertThat(r.getTopWeakTopics().get(1)).isEqualTo("操作系统");
        assertThat(r.getTopWeakTopics().get(2)).isEqualTo("组成原理");
        assertThat(r.getTopWeakTopics().get(3)).isEqualTo("计算机网络");
        assertThat(r.getTopWeakTopics()).doesNotContain("政治");
    }

    @Test
    void streak_counts_consecutive_days_back_from_today() {
        // 今天、昨天、前天有学；4 天前没学 → streak=3
        List<StudySession> sessions = List.of(
                session(TODAY, 30, 1, 0),
                session(TODAY.minusDays(1), 30, 1, 0),
                session(TODAY.minusDays(2), 30, 1, 0)
                // 没有 minusDays(3) → 中断
        );
        when(sessionRepository.findByUserIdOrderByStartTimeDesc(1L)).thenReturn(sessions);
        when(progressRepository.findByUserIdWithNodeSubject(1L)).thenReturn(Collections.emptyList());

        WeeklyReportDTO r = service.build(1L);

        assertThat(r.getStreakDays()).isEqualTo(3);
    }

    @Test
    void earned_badges_count_uses_progress_total_and_today_metrics() {
        // 全局 studiedNodes=10 → 解锁 firstStep(streak1) + starter(10) 不达标因为 streak=0
        // 今天有 session 60 分钟 + reviewed=10 → 解锁 focused + reviewer + firstStep(streak=1)
        List<StudySession> sessions = List.of(
                session(TODAY, 60, 0, 10)
        );
        // 10 个 progress，平均 mastery=80（达 perfectionist 阈值）
        List<StudyProgress> progress = new ArrayList<>();
        for (int i = 0; i < 10; i++) progress.add(weakProgress("topic" + i, 80));

        when(sessionRepository.findByUserIdOrderByStartTimeDesc(1L)).thenReturn(sessions);
        when(progressRepository.findByUserIdWithNodeSubject(1L)).thenReturn(progress);

        WeeklyReportDTO r = service.build(1L);

        // 至少这些会解锁：firstStep / starter / focused / reviewer / perfectionist
        assertThat(r.getEarnedBadges()).isGreaterThanOrEqualTo(5);
        // 因为 mastery=80 不算 weak（阈值是 <50）
        assertThat(r.getTopWeakTopics()).isEmpty();
    }

    @Test
    void wrong_repo_and_subject_repo_are_injected_but_not_required_for_basic_build() {
        // 验证 wrongAnswerRepository / subjectRepository 即便从未被 stub 也不影响 build 不抛
        when(sessionRepository.findByUserIdOrderByStartTimeDesc(1L)).thenReturn(Collections.emptyList());
        when(progressRepository.findByUserIdWithNodeSubject(1L)).thenReturn(Collections.emptyList());
        // 用 lenient 显式声明这两个 mock 即使没被调到也不算 strict 模式失败
        lenient().when(wrongAnswerRepository.findByUserId(1L)).thenReturn(Collections.emptyList());

        WeeklyReportDTO r = service.build(1L);

        assertThat(r).isNotNull();
        assertThat(r.getWeekStart()).isEqualTo(TODAY.minusDays(6));
    }
}
