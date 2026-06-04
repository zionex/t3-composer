package com.zionex.t3composer.domain.ontology.dto;

import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EntityDto {
    private String id;                       // tb_is_ontlgy_entity.id
    private String version;                  // (id, version) 복합 키 — 1.0 기본
    private String name;
    private String entityType;
    private String description;
    private List<String> terms;              // 검색 별칭
    private String status;                   // CANDIDATE/REVIEWING/CONFIRMED
    private Double importanceScore;
    private List<String> relatedTableNames;  // 확장 — tb_cmp_ontology_ext.extension
    private String notes;
    private LocalDateTime modifyDttm;
}
