package com.zionex.t3composer.domain.client;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Data;

/**
 * CLI 모드 ({@code llm.backend=cli}) 전용 설정.
 * .env 의 {@code LLM_CLI_*} 환경변수가 {@code application-dev.yaml} 의
 * {@code llm.cli.*} placeholder 로 주입된다.
 */
@Data
@ConfigurationProperties(prefix = "llm.cli")
public class LlmCliProperties {

    /** claude CLI 바이너리 절대 경로. 기본: {@code /usr/local/bin/claude} */
    private String binary = "/usr/local/bin/claude";

    /** subprocess 응답 timeout (분). 초과 시 destroyForcibly + 504. 기본 40. */
    private int timeoutMinutes = 40;

    /** 동시 CLI 호출 상한 (semaphore). 구독 rate-limit 보호. 기본 4. */
    private int maxConcurrent = 4;
}
