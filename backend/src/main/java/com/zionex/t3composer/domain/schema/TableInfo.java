package com.zionex.t3composer.domain.schema;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 테이블 한 개의 메타데이터 — Composer NEW_NL 모드의 테이블 lookup 응답.
 * exists=false 면 columns/tableSchema 는 비어있을 수 있음 (LLM 이 새 DDL 생성 신호).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TableInfo {

    /** 사용자가 입력한 테이블명 (대문자 정규화 후) */
    private String tableName;

    /** 스키마명 (MSSQL 기본 'dbo'). 존재하지 않으면 null. */
    private String tableSchema;

    /** 테이블 존재 여부 */
    private boolean exists;

    /** 컬럼 리스트 (순서대로 · exists=false 면 빈 배열) */
    private List<ColumnInfo> columns;

    /** PK 컬럼명 리스트 (없으면 빈 배열) */
    private List<String> primaryKeyColumns;

    /** 행 수 추정 (MSSQL sys.partitions · 큰 테이블 식별용 · 정확하지 않음). 실패 시 null. */
    private Long approximateRowCount;
}
