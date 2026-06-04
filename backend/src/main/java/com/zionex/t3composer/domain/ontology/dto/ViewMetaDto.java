package com.zionex.t3composer.domain.ontology.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ViewMetaDto {
    private String id;
    private String menuCd;
    private String status;
    private String publishedVersion;
}
