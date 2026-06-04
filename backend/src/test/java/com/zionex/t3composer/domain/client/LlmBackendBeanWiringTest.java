package com.zionex.t3composer.domain.client;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.web.reactive.function.client.WebClient;

import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Verifies {@link org.springframework.boot.autoconfigure.condition.ConditionalOnProperty}
 * 가 {@code llm.backend} 값에 따라 올바른 {@link LlmClient} 구현을 빈으로 선택하는지 확인.
 *
 * <ul>
 *   <li>미설정 → {@link ApiLlmClient} (matchIfMissing=true)</li>
 *   <li>{@code llm.backend=api} → {@link ApiLlmClient}</li>
 *   <li>{@code llm.backend=cli} → {@link CliLlmClient}</li>
 * </ul>
 *
 * 두 백엔드 빈이 동시에 활성되지 않음을 {@code hasSingleBean(LlmClient.class)} 로 보증.
 */
class LlmBackendBeanWiringTest {

    @Configuration
    static class TestConfig {
        @Bean WebClient.Builder webClientBuilder() { return WebClient.builder(); }
        @Bean ObjectMapper objectMapper()          { return new ObjectMapper(); }
    }

    @Configuration
    @Import({
            ApiLlmClient.class,
            CliLlmClient.class,
            ProcessBuilderInvoker.class
    })
    @EnableConfigurationProperties(LlmCliProperties.class)
    static class LlmBackendImportConfig {}

    @Test
    void defaultsToApiBackend() {
        new ApplicationContextRunner()
                .withConfiguration(AutoConfigurations.of())
                .withUserConfiguration(TestConfig.class, LlmBackendImportConfig.class)
                .run(ctx -> {
                    assertThat(ctx).hasSingleBean(LlmClient.class);
                    assertThat(ctx.getBean(LlmClient.class)).isInstanceOf(ApiLlmClient.class);
                });
    }

    @Test
    void cliBackendActivatesCliLlmClient() {
        new ApplicationContextRunner()
                .withConfiguration(AutoConfigurations.of())
                .withUserConfiguration(TestConfig.class, LlmBackendImportConfig.class)
                .withPropertyValues("llm.backend=cli")
                .run(ctx -> {
                    assertThat(ctx).hasSingleBean(LlmClient.class);
                    assertThat(ctx.getBean(LlmClient.class)).isInstanceOf(CliLlmClient.class);
                });
    }

    @Test
    void apiBackendExplicitActivatesApiLlmClient() {
        new ApplicationContextRunner()
                .withConfiguration(AutoConfigurations.of())
                .withUserConfiguration(TestConfig.class, LlmBackendImportConfig.class)
                .withPropertyValues("llm.backend=api")
                .run(ctx -> {
                    assertThat(ctx).hasSingleBean(LlmClient.class);
                    assertThat(ctx.getBean(LlmClient.class)).isInstanceOf(ApiLlmClient.class);
                });
    }
}
