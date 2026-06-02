package com.zionex.t3composer.domain.client;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class LlmCliExceptionTest {

    @Test
    void preservesStatusAndMessage() {
        LlmCliException ex = new LlmCliException(503, "stderr tail");
        assertThat(ex.getStatusCode()).isEqualTo(503);
        assertThat(ex.getMessage()).isEqualTo("stderr tail");
    }

    @Test
    void fromStderrMapsLoginExpiredTo401() {
        LlmCliException ex = LlmCliException.fromStderr(1,
                "Error: Please run claude /login to authenticate.");
        assertThat(ex.getStatusCode()).isEqualTo(401);
        assertThat(ex.getMessage()).contains("구독 로그인");
    }

    @Test
    void fromStderrMapsRateLimitTo429() {
        LlmCliException ex = LlmCliException.fromStderr(1,
                "Error: You have hit the rate limit. Try again later.");
        assertThat(ex.getStatusCode()).isEqualTo(429);
        assertThat(ex.getMessage()).contains("구독 한도");
    }

    @Test
    void fromStderrMapsQuotaTo429() {
        LlmCliException ex = LlmCliException.fromStderr(1,
                "Error: Monthly quota exceeded for your plan.");
        assertThat(ex.getStatusCode()).isEqualTo(429);
        assertThat(ex.getMessage()).contains("구독 한도");
    }

    @Test
    void fromStderrDefaultsTo503WithStderrTail() {
        String stderr = "boom".repeat(100);  // 400 chars
        LlmCliException ex = LlmCliException.fromStderr(7, stderr);
        assertThat(ex.getStatusCode()).isEqualTo(503);
        // exit code + last 200 chars in message
        assertThat(ex.getMessage()).contains("exit=7");
        assertThat(ex.getMessage().length()).isLessThanOrEqualTo(250);
    }
}
