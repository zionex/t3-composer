package com.zionex.t3composer.domain.dto;

import lombok.Data;

/**
 * Composer 세션 생성 요청.
 */
@Data
public class CreateSessionRequest {

    /** NEW_GENERAL | NEW_FROM_DESIGN | EXISTING_MODIFY */
    private String mode;

    /** EXISTING_MODIFY 일 때 대상 메뉴 코드 */
    private String targetMenuCd;

    /** 세션 제목 (미지정 시 자동 생성) */
    private String title;

    /** 사용 모델 (미지정 시 서버 기본값) */
    private String modelName;
}
