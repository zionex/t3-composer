package com.zionex.t3composer.config.insight;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import lombok.Data;

@Data
@Component
@ConfigurationProperties(prefix = "insight")
public class InsightProperties {
    private Target target = new Target();
    private long connectionTimeout = 30_000;
    private long readTimeout = 1_800_000;  // 30분 — SSE 장시간 연결

    @Data
    public static class Target {
        private String baseUrl = "http://localhost:9160";
    }
}
