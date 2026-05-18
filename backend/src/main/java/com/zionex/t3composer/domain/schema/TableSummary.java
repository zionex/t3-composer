package com.zionex.t3composer.domain.schema;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 테이블/뷰 한 개의 경량 요약 — Data Source 별자리 맵의 노드 목록용.
 * 컬럼 등 상세는 {@link TableInfo} (개별 lookup) 로 별도 조회.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TableSummary {

    /** 테이블/뷰 이름 */
    private String tableName;

    /** 스키마명 (MSSQL 기본 'dbo') */
    private String tableSchema;

    /** 'TABLE' | 'VIEW' */
    private String tableType;

    /** 도메인 키 ({@link SchemaNaming#domainOf}) — 별자리 맵 은하 그룹핑 */
    private String domain;
}
