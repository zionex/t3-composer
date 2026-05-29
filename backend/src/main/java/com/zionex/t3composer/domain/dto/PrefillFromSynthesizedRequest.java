package com.zionex.t3composer.domain.dto;

import java.util.Map;
import lombok.Data;

@Data
public class PrefillFromSynthesizedRequest {
    private String nl;
    /**
     * The synthesized mockup object echoed from the recommend-mockups response:
     * { label, description, reason, layers: [{key, title, type, subtype, position, sourceMockupCode}] }
     */
    private Map<String, Object> synthesized;
    private String moduleCode;
    // 예약 — 향후 Target 별 컨텍스트 prompting 용. 현재 prefill 로직에선 미사용.
    private String targetCd;
}
