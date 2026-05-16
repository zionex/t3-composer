package com.zionex.t3composer.domain.schema;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Stored Procedure / Function 한 개의 경량 요약 — Data Source 별자리 맵의 노드 목록용.
 * 파라미터/본문 등 상세는 {@link ProcedureInfo} (개별 lookup) 로 별도 조회.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProcedureSummary {

    /** SP / Function 이름 */
    private String procedureName;

    /** 스키마명 (MSSQL 기본 'dbo') */
    private String procedureSchema;

    /** 'P'(SP) | 'FN'(스칼라 함수) | 'TF'(테이블 함수) | 'IF'(인라인 TVF) */
    private String objectType;

    /** 도메인 키 ({@link SchemaNaming#domainOf}) — 별자리 맵 은하 그룹핑 */
    private String domain;
}
