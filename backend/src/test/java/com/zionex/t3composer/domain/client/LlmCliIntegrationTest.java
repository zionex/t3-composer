package com.zionex.t3composer.domain.client;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;

/**
 * Real subprocess smoke test. CI 에서는 항상 skip.
 *
 * <p>로컬에서 수동 실행:
 * <pre>
 *   docker compose exec -T -e LLM_CLI_INTEGRATION_TEST=true composer-backend \
 *       mvn -B -q test -Dtest=LlmCliIntegrationTest \
 *       -DskipTests=false -Dmaven.test.skip=false -Dsurefire.skip=false
 * </pre>
 *
 * <p>사전 조건: 컨테이너 안에 claude CLI 설치 (Dockerfile 의 npm install -g 단계).
 * 호스트 ~/.claude 마운트 + 'claude /login' 은 LLM 호출 테스트에는 필요하지만
 * 이 테스트 (`claude --version`) 만으로는 불필요.
 */
@EnabledIfEnvironmentVariable(named = "LLM_CLI_INTEGRATION_TEST", matches = "true")
class LlmCliIntegrationTest {

    @Test
    void realCliVersionResponds() throws Exception {
        ProcessBuilder pb = new ProcessBuilder("claude", "--version");
        Process p = pb.start();
        int exit = p.waitFor();
        assertThat(exit).isEqualTo(0);
    }
}
