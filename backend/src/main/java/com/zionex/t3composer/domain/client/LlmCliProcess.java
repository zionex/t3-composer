package com.zionex.t3composer.domain.client;

import java.io.InputStream;
import java.io.OutputStream;
import java.util.concurrent.TimeUnit;

/**
 * subprocess 의 stdin/stdout/stderr + lifecycle 접근. 테스트 가능성을 위한
 * 추상화 — production 은 {@link ProcessBuilderInvoker} 가 {@link Process} 를
 * 감싸 반환, 테스트는 in-memory stream 으로 fake.
 */
public interface LlmCliProcess {

    OutputStream stdin();

    InputStream stdout();

    InputStream stderr();

    /** {@link Process#waitFor(long, TimeUnit)} 와 동일 시맨틱. */
    boolean waitFor(long timeout, TimeUnit unit) throws InterruptedException;

    int exitValue();

    boolean isAlive();

    void destroyForcibly();
}
