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
        ProcessBuilder pb = new ProcessBuilder(command).redirectErrorStream(false);
        // ★ CLI 모드는 호스트 ~/.claude OAuth (구독) 사용이 의도. backend 컨테이너 환경에
        // ANTHROPIC_API_KEY 가 있으면 claude CLI 가 그걸 우선 사용 ("apiKeySource":"ANTHROPIC_API_KEY")
        // → OAuth 무시 + 401 → exit=1. CLI subprocess 환경에서만 제거 (API 모드는 그대로 사용).
        pb.environment().remove("ANTHROPIC_API_KEY");
        pb.environment().remove("ANTHROPIC_AUTH_TOKEN");
        return new ProcessAdapter(pb.start());
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
