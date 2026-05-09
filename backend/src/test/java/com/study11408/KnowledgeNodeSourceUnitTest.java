package com.study11408;

import com.study11408.entity.KnowledgeNode;
import com.study11408.entity.KnowledgeNodeSource;
import com.study11408.repository.KnowledgeNodeSourceRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * "PDF 出处定位"基础设施测试：
 * <ul>
 *   <li>{@link KnowledgeNodeSource} 实体的 builder + lombok 字段映射</li>
 *   <li>{@link KnowledgeNodeSourceRepository#findByNodeId(Long)} 接口契约</li>
 * </ul>
 *
 * <p>不开 SpringBootTest，纯 mock，避免依赖数据库。Repository 真实查询走 IT 测试。
 */
@ExtendWith(MockitoExtension.class)
class KnowledgeNodeSourceUnitTest {

    @Mock private KnowledgeNodeSourceRepository repository;

    @Test
    void builder_should_populate_all_fields() {
        LocalDateTime now = LocalDateTime.now();
        KnowledgeNodeSource src = KnowledgeNodeSource.builder()
                .id(7L)
                .nodeId(1L)
                .materialId(42L)
                .pageNumber(15)
                .excerpt("栈是一种后进先出的线性表。")
                .createdAt(now)
                .build();

        assertThat(src.getId()).isEqualTo(7L);
        assertThat(src.getNodeId()).isEqualTo(1L);
        assertThat(src.getMaterialId()).isEqualTo(42L);
        assertThat(src.getPageNumber()).isEqualTo(15);
        assertThat(src.getExcerpt()).isEqualTo("栈是一种后进先出的线性表。");
        assertThat(src.getCreatedAt()).isEqualTo(now);
    }

    @Test
    void builder_should_allow_optional_material_and_page() {
        // material_id / page_number 在 V5 schema 中可空（excerpt 可来自非 PDF 资料或老导入）
        KnowledgeNodeSource src = KnowledgeNodeSource.builder()
                .nodeId(1L)
                .excerpt("无来源资料的兜底原文片段")
                .build();

        assertThat(src.getMaterialId()).isNull();
        assertThat(src.getPageNumber()).isNull();
        assertThat(src.getExcerpt()).isEqualTo("无来源资料的兜底原文片段");
    }

    @Test
    void node_relation_field_setter_works() {
        // node 字段是 LAZY @ManyToOne；写入端直接 setNode(...) 也应正常工作
        KnowledgeNode node = KnowledgeNode.builder().id(1L).title("栈").build();
        KnowledgeNodeSource src = new KnowledgeNodeSource();
        src.setNode(node);

        assertThat(src.getNode()).isSameAs(node);
        assertThat(src.getNode().getTitle()).isEqualTo("栈");
    }

    @Test
    void repository_findByNodeId_returns_mocked_list() {
        KnowledgeNodeSource s1 = KnowledgeNodeSource.builder()
                .id(1L).nodeId(99L).materialId(10L).pageNumber(3)
                .excerpt("片段一").build();
        KnowledgeNodeSource s2 = KnowledgeNodeSource.builder()
                .id(2L).nodeId(99L).materialId(10L).pageNumber(7)
                .excerpt("片段二").build();
        when(repository.findByNodeId(99L)).thenReturn(List.of(s1, s2));

        List<KnowledgeNodeSource> result = repository.findByNodeId(99L);

        assertThat(result).hasSize(2);
        assertThat(result).extracting(KnowledgeNodeSource::getExcerpt)
                .containsExactly("片段一", "片段二");
        verify(repository).findByNodeId(99L);
    }
}
