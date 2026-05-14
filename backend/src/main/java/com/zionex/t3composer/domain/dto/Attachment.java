package com.zionex.t3composer.domain.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * 사용자가 채팅 prompt 에 D&D 로 첨부한 binary 파일 (이미지 / PDF 등).
 *
 * Anthropic Messages API 의 content block 으로 변환되어 vision/document 모드로 전송:
 *   image  → { type:"image",    source:{ type:"base64", media_type, data } }
 *   pdf    → { type:"document", source:{ type:"base64", media_type, data } }
 *
 * 텍스트 파일은 frontend 에서 prompt 본문에 inline 합쳐지므로 여기로 오지 않음.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Attachment {
    /** 파일 이름 (예: design.pdf) */
    private String name;

    /** MIME type (예: image/png, application/pdf) */
    private String mediaType;

    /** 파일 내용 — base64 (data URL prefix 없는 순수 base64 only) */
    private String base64;
}
