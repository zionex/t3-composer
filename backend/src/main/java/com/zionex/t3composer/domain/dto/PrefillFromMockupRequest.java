package com.zionex.t3composer.domain.dto;

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
}
