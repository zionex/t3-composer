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
public class QaDto {
    private String id;                        // TB_IS_QAPATTERN.id (UUID 형 string)
    private String question;
    private String answer;
    private String dbType;                    // mssql/oracle/postgresql
    private String domain;                    // business_domain (BF/DP/MP/...)
    private List<String> paraphrases;         // 확장 — tb_cmp_ontology_ext.extension
    private List<String> relatedEntityIds;    // 확장
    private String notes;                     // 확장
    private LocalDateTime modifyDttm;         // optimistic lock 용
}
