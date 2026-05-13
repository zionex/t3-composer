package com.zionex.t3composer.domain.schema;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Stored Procedure 한 파라미터의 메타 — sys.parameters + sys.types 조인 결과 한 행.
 *
 * NEW_NL 모드가 LLM 에 "이 SP 는 이미 존재함 + 시그니처는 이렇다" 를 알려 화면 코드의
 * @Param 호출부를 정확히 만들 수 있게 한다.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProcedureParameter {

    /** '@P_ITEM_CD' 같은 파라미터명 (선행 @ 포함) */
    private String name;

    /** 'NVARCHAR' / 'INT' / 'DATETIME2' 등 */
    private String dataType;

    /** 문자형 최대 길이 (-1 = MAX), 그 외 null */
    private Integer maxLength;

    /** 숫자형 정밀도 (NUMERIC/DECIMAL) */
    private Integer precision;

    /** 숫자형 소수 자리 (NUMERIC/DECIMAL) */
    private Integer scale;

    /** OUTPUT 파라미터 여부 */
    private boolean output;

    /** 1-based 순서 */
    private Integer ordinalPosition;
}
