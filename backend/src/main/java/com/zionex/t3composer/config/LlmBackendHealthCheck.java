package com.zionex.t3composer.config;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

/**
 * Startup 시점에 LLM 백엔드 설정을 검증.
 * <ul>
 *   <li>{@code llm.backend=api}: 검증 없음 (호출 시점에 ANTHROPIC_API_KEY 확인)</li>
 *   <li>{@code llm.backend=cli}: claude 바이너리 존재 + 실행 권한 확인.
 *       없으면 RuntimeException 으로 backend startup 실패 (fail-fast).</li>
 * </ul>
 */
@Slf4j
@Component
public class LlmBackendHealthCheck {

    @Value("${llm.backend:api}")
    private String backend;

    @Value("${llm.cli.binary:/usr/bin/claude}")
    private String cliBinary;

    @EventListener(ApplicationReadyEvent.class)
    public void check() {
        if (!"cli".equalsIgnoreCase(backend)) {
            log.info("LLM backend = api (HTTP API mode)");
            return;
        }

        Path bin = Paths.get(cliBinary);
        if (!Files.isExecutable(bin)) {
            throw new IllegalStateException(
                    "LLM_BACKEND=cli 인데 claude 바이너리를 찾을 수 없거나 실행 불가: " + cliBinary
                    + ". Dockerfile 의 npm install -g @anthropic-ai/claude-code 확인.");
        }

        Path home = Paths.get("/root/.claude");
        if (!Files.isDirectory(home)) {
            log.warn("LLM backend = cli; /root/.claude 디렉토리 없음 — 호스트 ~/.claude 마운트 확인");
        } else {
            log.info("LLM backend = cli (binary={}, ~/.claude mounted)", cliBinary);
        }
    }
}
