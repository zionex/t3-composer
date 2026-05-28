package com.zionex.t3composer.domain.dto;

import java.util.List;
import java.util.Map;
import lombok.Data;

@Data
public class RecommendMockupRequest {
    private String nl;
    private List<Map<String, Object>> candidates;
}
