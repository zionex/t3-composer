package com.zionex.t3composer.domain.dto;

import java.util.Map;

import lombok.Data;

/**
 * NEW_FROM_COPY 모드의 wizard 진입 직전 — sourceBundle 을 LLM 으로 분석해
 * 9단계 spec JSON 을 prefill 하기 위한 요청 DTO.
 *
 *   sourceBundle : ViewSourceBundleService.collectSourceBundle 의 응답 그대로
 *   newMenuCd    : 신규 메뉴 코드 (UI_<DOMAIN>_<NAME>)
 *   newTitle     : 신규 화면 제목 (선택)
 *   moduleCode   : 모듈 코드 (선택 — 없으면 sourceMenuCd 에서 추론)
 *   sourceMenuCd : 원본 메뉴 코드 (참조용)
 */
@Data
public class PrefillFromSourceRequest {
    private Map<String, Object> sourceBundle;
    private String newMenuCd;
    private String newTitle;
    private String moduleCode;
    private String sourceMenuCd;
}
