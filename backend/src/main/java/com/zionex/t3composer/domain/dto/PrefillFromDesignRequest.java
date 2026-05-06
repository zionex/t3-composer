package com.zionex.t3composer.domain.dto;

import java.util.Map;

import lombok.Data;

/**
 * NEW_FROM_DESIGN 모드의 wizard 진입 직전 — Excel 설계서를 분석해
 * 9단계 spec JSON 을 prefill 하기 위한 요청 DTO.
 *
 *   parsedDesign : { sheetNames, sheets:[{ name, rowCount, preview, rawRows }, ...], layout, overview }
 *                  (frontend ModeNewFromDesign.jsx 에서 SheetJS 로 파싱한 결과 그대로)
 *   fileName     : 업로드된 Excel 파일명 (참조용)
 *   newMenuCd    : 신규 메뉴 코드 (UI_<DOMAIN>_<NAME>) — 사용자가 화면에서 입력하지 않은 경우 빈 문자열
 *   newTitle     : 신규 화면 제목 (선택)
 *   moduleCode   : 모듈 코드 (선택 — 없으면 menuCd 또는 overview 에서 추론)
 */
@Data
public class PrefillFromDesignRequest {
    private Map<String, Object> parsedDesign;
    private String fileName;
    private String newMenuCd;
    private String newTitle;
    private String moduleCode;
}
