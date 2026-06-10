package com.zionex.t3composer.config.insight;

import io.netty.channel.ChannelOption;
import io.netty.handler.timeout.ReadTimeoutHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;
import java.util.concurrent.TimeUnit;

@Configuration
public class InsightWebClientConfig {

    private final InsightProperties props;

    public InsightWebClientConfig(InsightProperties props) {
        this.props = props;
    }

    /** 일반 REST 호출 — 30초 타임아웃 */
    @Bean("insightWebClient")
    public WebClient insightWebClient() {
        return buildWebClient(props.getConnectionTimeout());
    }

    /** SSE 스트리밍 — 30분 타임아웃, 버퍼링 없음 */
    @Bean("sseWebClient")
    public WebClient sseWebClient() {
        return buildWebClient(props.getReadTimeout());
    }

    private WebClient buildWebClient(long readTimeoutMs) {
        HttpClient httpClient = HttpClient.create()
            .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, (int) props.getConnectionTimeout())
            .doOnConnected(conn ->
                conn.addHandlerLast(new ReadTimeoutHandler(readTimeoutMs, TimeUnit.MILLISECONDS)));
        return WebClient.builder()
            .baseUrl(props.getTarget().getBaseUrl())
            .clientConnector(new ReactorClientHttpConnector(httpClient))
            .build();
    }
}
