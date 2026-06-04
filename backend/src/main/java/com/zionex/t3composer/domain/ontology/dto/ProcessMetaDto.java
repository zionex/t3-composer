package com.zionex.t3composer.domain.ontology.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProcessMetaDto {
    private String id;
    private String processCd;
    private String processName;
    private String processOverview;
    private String module;
    private String status;
    private String version;
}
