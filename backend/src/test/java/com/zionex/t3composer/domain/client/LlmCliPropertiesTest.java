package com.zionex.t3composer.domain.client;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.boot.context.properties.source.ConfigurationPropertySource;
import org.springframework.boot.context.properties.source.MapConfigurationPropertySource;

import java.util.Map;

class LlmCliPropertiesTest {

    @Test
    void bindsAllFieldsFromMap() {
        Map<String, Object> source = Map.of(
                "llm.cli.binary",          "/usr/local/bin/claude",
                "llm.cli.timeout-minutes", "30",
                "llm.cli.max-concurrent",  "8"
        );
        ConfigurationPropertySource props = new MapConfigurationPropertySource(source);

        LlmCliProperties bound = new Binder(props).bind("llm.cli", LlmCliProperties.class).get();

        assertThat(bound.getBinary()).isEqualTo("/usr/local/bin/claude");
        assertThat(bound.getTimeoutMinutes()).isEqualTo(30);
        assertThat(bound.getMaxConcurrent()).isEqualTo(8);
    }

    @Test
    void defaultsApplyWhenAbsent() {
        ConfigurationPropertySource empty = new MapConfigurationPropertySource(Map.of());

        LlmCliProperties bound = new Binder(empty).bind("llm.cli", LlmCliProperties.class)
                .orElseGet(LlmCliProperties::new);

        assertThat(bound.getBinary()).isEqualTo("/usr/local/bin/claude");
        assertThat(bound.getTimeoutMinutes()).isEqualTo(40);
        assertThat(bound.getMaxConcurrent()).isEqualTo(4);
    }
}
