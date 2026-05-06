package com.zionex.t3composer.domain.dto;

import lombok.Data;

/**
 * 사용자 → Claude 채팅 요청.
 */
@Data
public class ChatRequest {

    /** 사용자 입력 메시지 */
    private String message;

    /** 첨부 아티팩트 ID 목록 (예: 업로드한 설계서, 수집된 소스 번들) */
    private java.util.List<String> attachmentArtifactIds;
}
