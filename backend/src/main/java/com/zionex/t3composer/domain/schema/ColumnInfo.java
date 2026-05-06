package com.zionex.t3composer.domain.schema;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 테이블 한 컬럼의 메타데이터 — INFORMATION_SCHEMA.COLUMNS 한 행.
 * Composer 의 NEW_NL 모드가 사용자가 입력한 테이블의 실제 컬럼을 받아 Entity 를 prefill 한다.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ColumnInfo {

    /** 컬럼명 (대소문자 그대로 — TB_AD_USER 의 USERNAME 등) */
    private String name;

    /** SQL 타입 (NVARCHAR / INT / DATETIME2 / NUMERIC / BIT 등) */
    private String dataType;

    /** 문자형 길이 (NVARCHAR/VARCHAR 일 때만 · -1 = MAX) */
    private Integer characterMaximumLength;

    /** 숫자형 정밀도 (NUMERIC/DECIMAL 일 때) */
    private Integer numericPrecision;

    /** 숫자형 소수 자리 (NUMERIC/DECIMAL 일 때) */
    private Integer numericScale;

    /** 'YES' or 'NO' — IS_NULLABLE */
    private String isNullable;

    /** 컬럼 기본값 (DEFAULT 절) — 없으면 null */
    private String columnDefault;

    /** 1-based 컬럼 순서 */
    private Integer ordinalPosition;

    /** PK 여부 (PK 결합 시 채움 — 단일 컬럼만 우선 지원) */
    private boolean primaryKey;
}
