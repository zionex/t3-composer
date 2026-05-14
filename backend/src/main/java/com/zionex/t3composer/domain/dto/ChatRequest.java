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

    /**
     * D&D 로 첨부된 binary 파일 (이미지/PDF). Anthropic vision/document content block 으로 전송.
     * 텍스트 파일은 frontend 에서 message 본문에 inline 합쳐지므로 여기에는 binary 만 포함.
     */
    private java.util.List<Attachment> attachments;
}
