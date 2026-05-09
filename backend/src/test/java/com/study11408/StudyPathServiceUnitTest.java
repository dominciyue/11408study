package com.study11408;

import com.study11408.dto.KnowledgeNodeDTO;
import com.study11408.entity.KnowledgeEdge;
import com.study11408.entity.KnowledgeNode;
import com.study11408.repository.KnowledgeEdgeRepository;
import com.study11408.repository.KnowledgeNodeRepository;
import com.study11408.repository.StudyProgressRepository;
import com.study11408.repository.UserRepository;
import com.study11408.service.SpacedRepetitionService;
import com.study11408.service.StudyPathService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

/**
 * Unit test for StudyPathService.generatePath — guards against P0-02
 * (relationType case mismatch). V2 seed inserts 'PREREQUISITE' (uppercase),
 * but the topo-sort previously compared lowercase 'prerequisite', causing
 * all prerequisite edges to be ignored and the path to fall back to
 * insertion-id order.
 */
@ExtendWith(MockitoExtension.class)
class StudyPathServiceUnitTest {

    @Mock private KnowledgeNodeRepository nodeRepository;
    @Mock private KnowledgeEdgeRepository edgeRepository;
    @Mock private StudyProgressRepository progressRepository;
    @Mock private UserRepository userRepository;
    @Mock private SpacedRepetitionService spacedRepetitionService;

    @InjectMocks private StudyPathService studyPathService;

    private KnowledgeNode nodeA;
    private KnowledgeNode nodeB;
    private KnowledgeNode nodeC;

    @BeforeEach
    void setUp() {
        // IDs intentionally chosen so HashMap iteration order (used inside Kahn
        // for the in-degree map) is NOT [A,B,C]. With these IDs the HashMap
        // would yield [C(19), A(7), B(13)] if all in-degrees were 0 — i.e.
        // the bug state where prerequisite edges are ignored. This guards
        // against false-pass where the topo order accidentally matches the
        // map iteration order.
        nodeA = KnowledgeNode.builder().id(7L).title("A").build();
        nodeB = KnowledgeNode.builder().id(13L).title("B").build();
        nodeC = KnowledgeNode.builder().id(19L).title("C").build();
    }

    @Test
    void generatePath_should_recognize_uppercase_PREREQUISITE() {
        // Build A -> B -> C with uppercase PREREQUISITE (matches V2 seed).
        when(nodeRepository.findByTopicSubjectId(1L))
                .thenReturn(Arrays.asList(nodeC, nodeB, nodeA));

        KnowledgeEdge ab = edge(7L, 13L, "PREREQUISITE");
        KnowledgeEdge bc = edge(13L, 19L, "PREREQUISITE");

        lenient().when(edgeRepository.findBySourceId(7L)).thenReturn(List.of(ab));
        lenient().when(edgeRepository.findBySourceId(13L)).thenReturn(List.of(bc));
        lenient().when(edgeRepository.findBySourceId(19L)).thenReturn(Collections.emptyList());

        List<KnowledgeNodeDTO> path = studyPathService.generatePath(1L);

        assertThat(path).extracting(KnowledgeNodeDTO::getTitle)
                .containsExactly("A", "B", "C");
    }

    @Test
    void generatePath_should_recognize_lowercase_prerequisite_too() {
        // Same topology, but with lowercase relation type — proves the
        // comparison is case-insensitive (defensive against manual edge
        // creation with mixed casing).
        when(nodeRepository.findByTopicSubjectId(1L))
                .thenReturn(Arrays.asList(nodeC, nodeB, nodeA));

        KnowledgeEdge ab = edge(7L, 13L, "prerequisite");
        KnowledgeEdge bc = edge(13L, 19L, "prerequisite");

        lenient().when(edgeRepository.findBySourceId(7L)).thenReturn(List.of(ab));
        lenient().when(edgeRepository.findBySourceId(13L)).thenReturn(List.of(bc));
        lenient().when(edgeRepository.findBySourceId(19L)).thenReturn(Collections.emptyList());

        List<KnowledgeNodeDTO> path = studyPathService.generatePath(1L);

        assertThat(path).extracting(KnowledgeNodeDTO::getTitle)
                .containsExactly("A", "B", "C");
    }

    @Test
    void generatePath_should_ignore_non_prerequisite_edges() {
        // EXTENDS / RELATED edges must NOT contribute to topo ordering.
        // With only an EXTENDS edge, all 3 nodes have in-degree 0 and any
        // ordering is acceptable (we only assert size + content).
        when(nodeRepository.findByTopicSubjectId(1L))
                .thenReturn(Arrays.asList(nodeA, nodeB, nodeC));

        KnowledgeEdge ab = edge(7L, 13L, "EXTENDS");

        lenient().when(edgeRepository.findBySourceId(anyLong()))
                .thenReturn(Collections.emptyList());
        lenient().when(edgeRepository.findBySourceId(7L)).thenReturn(List.of(ab));

        List<KnowledgeNodeDTO> path = studyPathService.generatePath(1L);

        assertThat(path).hasSize(3);
        assertThat(path).extracting(KnowledgeNodeDTO::getTitle)
                .containsExactlyInAnyOrder("A", "B", "C");
    }

    @Test
    void generatePath_should_return_empty_for_subject_with_no_nodes() {
        when(nodeRepository.findByTopicSubjectId(99L)).thenReturn(Collections.emptyList());

        List<KnowledgeNodeDTO> path = studyPathService.generatePath(99L);

        assertThat(path).isEmpty();
    }

    private KnowledgeEdge edge(Long sourceId, Long targetId, String type) {
        KnowledgeEdge e = new KnowledgeEdge();
        e.setSourceId(sourceId);
        e.setTargetId(targetId);
        e.setRelationType(type);
        e.setWeight(1.0);
        return e;
    }
}
