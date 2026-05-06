package com.zionex.t3composer.domain.dto;

import lombok.Data;

/**
 * Anthropic API 키 저장 요청.
 */
@Data
public class ApiKeyRequest {

    /** 평문 API 키 (sk-ant-...) — 서버에서 SecurityUtils 로 암호화 저장 */
    private String apiKey;

    /** 사용자 설명 (예: "Personal key") */
    private String description;
}
