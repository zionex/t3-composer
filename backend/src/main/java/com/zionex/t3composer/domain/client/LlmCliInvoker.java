package com.zionex.t3composer.domain.client;

import java.io.IOException;
import java.util.List;

/**
 * subprocess 시작을 추상화. 단위 테스트는 in-memory fake invoker 를 주입해
 * stdout 내용을 시뮬레이트.
 */
public interface LlmCliInvoker {

    LlmCliProcess start(List<String> command) throws IOException;
}
