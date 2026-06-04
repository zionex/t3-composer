package com.zionex.t3composer.domain.ontology.dto;

import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SuggestRequest {
    private String field;          // 'question' | 'answer' | 'paraphrases' | 'relatedEntityIds' | 'domain'
    private String kind;           // 'QA' | 'ENTITY'
    private String targetCd;
    private Map<String, Object> row;   // 현재 row state — Service 가 필요한 필드만 추출
}
