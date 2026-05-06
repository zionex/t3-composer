package com.zionex.t3composer.domain.client;

import org.springframework.http.HttpStatusCode;

/**
 * Anthropic Messages API 가 오류 응답을 반환했을 때 사용.
 * 원본 status 와 body 를 보존하여 상위에서 사용자 메시지로 변환 가능.
 */
public class AnthropicApiException extends RuntimeException {

    private final HttpStatusCode status;
    private final String body;

    public AnthropicApiException(HttpStatusCode status, String body) {
        super("Anthropic API error " + status + " : " + (body == null ? "" : body.substring(0, Math.min(body.length(), 500))));
        this.status = status;
        this.body = body;
    }

    public HttpStatusCode getStatus() { return status; }
    public String getBody() { return body; }

    public boolean isUnauthorized() {
        return status != null && status.value() == 401;
    }

    public boolean isRateLimited() {
        return status != null && status.value() == 429;
    }

    public String getUserMessage() {
        if (isUnauthorized()) {
            return "Anthropic API 키가 유효하지 않습니다. 올바른 sk-ant- 키를 설정 화면에서 다시 등록해 주세요.";
        }
        if (isRateLimited()) {
            return "Anthropic API 사용량 제한에 도달했습니다. 잠시 후 다시 시도해 주세요.";
        }
        if (status != null && status.is5xxServerError()) {
            return "Anthropic 서버 오류입니다. 잠시 후 다시 시도해 주세요. (" + status + ")";
        }
        return "Anthropic API 호출 실패: " + status + " — " + (body == null ? "" : body);
    }
}
