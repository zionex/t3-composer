package com.zionex.t3composer.shared.data;

import org.springframework.http.HttpStatus;

import lombok.Data;

/**
 * 부모 wingui 의 com.zionex.t3composer.shared.data.ResponseMessage 와 동일 시그니처.
 * Composer 가 LLM 으로 생성하는 RestController 들이 ResponseMessage.of(...) 형식 사용.
 */
@Data
public class ResponseMessage {

    private final int status;
    private final String message;

    public ResponseMessage(int status, String message) {
        this.status = status;
        this.message = message;
    }

    public static ResponseMessage of(HttpStatus httpStatus) {
        return new ResponseMessage(httpStatus.value(), httpStatus.getReasonPhrase());
    }

    public static ResponseMessage of(HttpStatus httpStatus, String message) {
        return new ResponseMessage(httpStatus.value(), message);
    }

    public static ResponseMessage of(int status, String message) {
        return new ResponseMessage(status, message);
    }

    public static ResponseMessage ok() {
        return of(HttpStatus.OK);
    }

    public static ResponseMessage ok(String message) {
        return of(HttpStatus.OK, message);
    }

    public static ResponseMessage error(String message) {
        return of(HttpStatus.INTERNAL_SERVER_ERROR, message);
    }
}
