package com.zionex.t3composer.domain.dto;

import java.util.List;
import lombok.Data;

/**
 * AI 추천 흐름의 "내 설계 그대로 만들기" 카드 요청.
 * 사용자가 첨부한 설계 이미지(들) 을 Claude vision 으로 분석해 ComposerSpec.layers 추론.
 *
 * 응답 shape (SpecFromImageService): { spec: { layers, filterBar? }, mode, model }
 *   - prefillFromMockup 응답과 호환 — frontend 가 같은 mergeAiPrefillIntoSpec 으로 처리.
 */
@Data
public class SpecFromImageRequest {
    /** 자연어 컨텍스트 (optional) — 이미지만 보고 모호한 경우 보조 단서 */
    private String nl;

    /** module 코드 (optional) */
    private String moduleCode;

    /** 활성 Target — 향후 confluence/도메인별 prompt 분기 용 */
    private String targetCd;

    /** image/* mime type 의 binary 첨부 — 필수 (최소 1개). */
    private List<Attachment> binaryAttachments;
}
