package com.zionex.t3composer.domain.dto;

import java.util.List;
import java.util.Map;
import lombok.Data;

@Data
public class RecommendMockupRequest {
    private String nl;
    private List<Map<String, Object>> candidates;
    /**
     * If true (or null — treat null as true), the service should also try to propose
     * synthesized mockups by recombining candidate layers. If false, the service
     * returns the existing-only response shape (synthesized: []). Used for rollback.
     */
    private Boolean synthesize;
}
