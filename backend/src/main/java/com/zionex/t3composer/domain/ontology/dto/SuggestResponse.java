package com.zionex.t3composer.domain.ontology.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SuggestResponse {
    private boolean ok;
    private String message;
    private Object value;     // String / List / Map — 필드에 따라 다름
    private String modelName;
}
