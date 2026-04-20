package com.study11408.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GraphDataDTO {

    private List<KnowledgeNodeDTO> nodes;
    private List<KnowledgeEdgeDTO> edges;
}
