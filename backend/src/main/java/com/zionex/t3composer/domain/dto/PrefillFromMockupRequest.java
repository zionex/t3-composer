package com.zionex.t3composer.domain.dto;

import java.util.List;
import java.util.Map;
import lombok.Data;

@Data
public class PrefillFromMockupRequest {
    private String nl;
    private String mockupPatternCode;
    private Map<String, Object> mockupMeta;
    private String moduleCode;
    // 예약 — 향후 Target 별 컨텍스트 prompting 용. 현재 prefill 로직에선 미사용.
    private String targetCd;

    /** AiRecommendPanel D&D 텍스트 첨부 — user prompt 끝에 inline */
    private List<TextAttachmentDto> textAttachments;

    /** AiRecommendPanel D&D 바이너리 첨부 — Anthropic multimodal content blocks */
    private List<Attachment> binaryAttachments;
}
