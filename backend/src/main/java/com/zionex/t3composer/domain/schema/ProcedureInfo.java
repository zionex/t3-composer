package com.zionex.t3composer.domain.schema;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Stored Procedure 한 개의 메타 — Composer NEW_NL 모드의 SP lookup 응답.
 *
 * 정책: 사용자가 prompt 에 명시한 SP 가 운영 DB 에 이미 존재하면 LLM 은 그 시그니처/본문에
 * 맞춰 호출부만 작성한다. 새 CREATE PROCEDURE 를 생성하거나 사용자가 명시하지 않은
 * 추가 SP (예: 삭제) 를 임의로 만들지 않는다.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProcedureInfo {

    /** 사용자가 입력한 SP 명 (대문자 정규화 후) */
    private String procedureName;

    /** 스키마명 (MSSQL 기본 'dbo'). 미존재 시 null. */
    private String procedureSchema;

    /** 존재 여부 */
    private boolean exists;

    /** 파라미터 리스트 (순서대로 · 미존재 시 빈 배열) */
    private List<ProcedureParameter> parameters;

    /**
     * SP 본문 (CREATE PROCEDURE ...). OBJECT_DEFINITION 결과 — 매우 길 수 있어
     * formatter 가 prompt 첨부 시 적정 길이로 잘라낸다.
     */
    private String body;

    /** 마지막 수정 시각 (sys.objects.modify_date) — 사용자 진단용 */
    private String modifyDate;
}
