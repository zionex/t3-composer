package com.zionex.t3composer.domain.client;

import lombok.Getter;

/**
 * CLI 백엔드 호출 실패. {@link #getStatusCode()} 가 컨트롤러 레이어에서
 * HTTP status code 로 변환된다 (예외 핸들러 매핑).
 *
 * <p>Fail-hard 정책: API fallback 없음. 사용자가 직접 호스트에서 조치
 * (claude /login 또는 5시간 window 대기) 해야 한다.
 */
@Getter
public class LlmCliException extends RuntimeException {

    private final int statusCode;

    public LlmCliException(int statusCode, String message) {
        super(message);
        this.statusCode = statusCode;
    }

    /**
     * subprocess exit code + stderr 텍스트로부터 적절한 HTTP status 자동 매핑.
     * <ul>
     *   <li>stderr 에 "login" 포함 → 401 (구독 로그인 필요)</li>
     *   <li>stderr 에 "rate limit" 또는 "quota" 포함 → 429 (구독 한도)</li>
     *   <li>그 외 exit != 0 → 503 + stderr 마지막 200자</li>
     * </ul>
     */
    public static LlmCliException fromStderr(int exitCode, String stderr) {
        String lower = stderr == null ? "" : stderr.toLowerCase();
        if (lower.contains("login")) {
            return new LlmCliException(401,
                    "구독 로그인 필요 — 호스트에서 `claude /login` 실행 후 backend 재기동");
        }
        if (lower.contains("rate limit") || lower.contains("quota")) {
            return new LlmCliException(429,
                    "구독 한도 도달 — 5시간 window 종료 또는 plan upgrade 대기");
        }
        String tail = stderr == null ? "" :
                stderr.substring(Math.max(0, stderr.length() - 200));
        return new LlmCliException(503,
                String.format("CLI 실패 (exit=%d): %s", exitCode, tail));
    }
}
