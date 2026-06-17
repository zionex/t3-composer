package com.zionex.t3composer.domain.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * 사용자가 채팅 prompt 에 D&D 로 첨부한 텍스트 파일 (SQL/JSON/MD/SVG 등).
 * 백엔드는 본문을 user prompt 끝에 inline 합쳐 Claude 에 전달 (multimodal 아님).
 *
 * AiRecommendPanel 의 D&D 영역이 텍스트 파일을 이 shape 로 직렬화해서 보낸다.
 * 바이너리 (이미지/PDF) 는 {@link Attachment} 로 받아 multimodal content blocks 로 변환.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TextAttachmentDto {
    /** 파일 이름 (예: design.sql) */
    private String name;

    /** 소문자 확장자 — markdown fence language hint 로 사용 (예: "sql", "json") */
    private String lang;

    /** 파일 본문 — Claude 가 그대로 읽음. 백엔드에서 12K자 cap 적용. */
    private String text;

    /** KB 단위 크기 — 로그 진단용 (필수 아님) */
    private Integer sizeKb;
}
