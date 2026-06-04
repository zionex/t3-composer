package com.zionex.t3composer.domain.client;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.List;
import java.util.concurrent.TimeUnit;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Production {@link LlmCliInvoker} — {@link ProcessBuilder} 로 실제 subprocess 시작.
 * CLI 모드 ({@code llm.backend=cli}) 일 때만 빈으로 등록.
 */
@Component
@ConditionalOnProperty(name = "llm.backend", havingValue = "cli")
public class ProcessBuilderInvoker implements LlmCliInvoker {

    @Override
    public LlmCliProcess start(List<String> command) throws IOException {
        Process p = new ProcessBuilder(command)
                .redirectErrorStream(false)
                .start();
        return new ProcessAdapter(p);
    }

    private static final class ProcessAdapter implements LlmCliProcess {
        private final Process p;

        ProcessAdapter(Process p) { this.p = p; }

        @Override public OutputStream stdin()  { return p.getOutputStream(); }
        @Override public InputStream  stdout() { return p.getInputStream();  }
        @Override public InputStream  stderr() { return p.getErrorStream();  }

        @Override
        public boolean waitFor(long timeout, TimeUnit unit) throws InterruptedException {
            return p.waitFor(timeout, unit);
        }

        @Override public int     exitValue()       { return p.exitValue(); }
        @Override public boolean isAlive()         { return p.isAlive();   }
        @Override public void    destroyForcibly() { p.destroyForcibly();  }
    }
}
