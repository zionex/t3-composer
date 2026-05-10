package com.zionex.t3composer.shared.data;

import org.springframework.http.HttpStatus;

/**
 * 부모 wingui 의 com.zionex.t3series.web.util.data.ResponseMessage 와 동일 시그니처.
 *
 * 두 호출 패턴 모두 지원:
 *   - 정적 팩토리:   ResponseMessage.ok() · ResponseMessage.error("msg") · of(httpStatus[, msg]) · of(int, String)
 *   - 직접 생성자 1: new ResponseMessage(int status, String message)         — t3composer 내부 표준
 *   - 직접 생성자 2: new ResponseMessage(String code, String message, int rowCount)  — wingui 산출물 표준
 */
public class ResponseMessage {

    /** HTTP-like 상태 코드 (200, 500 …). 신규 생성자에서는 0 으로 초기화 가능. */
    private int status;
    /** "OK" / "ERROR" 같은 비즈니스 코드 (선택). */
    private String code;
    private String message;
    /** wingui 산출물 호환 — 처리 행수 등 숫자 메타. */
    private int rowCount;

    public ResponseMessage(int status, String message) {
        this.status = status;
        this.code = null;
        this.message = message;
        this.rowCount = 0;
    }

    public ResponseMessage(String code, String message, int rowCount) {
        this.status = 0;
        this.code = code;
        this.message = message;
        this.rowCount = rowCount;
    }

    public int    getStatus()   { return status; }
    public String getCode()     { return code; }
    public String getMessage()  { return message; }
    public int    getRowCount() { return rowCount; }

    public void setStatus(int status)        { this.status = status; }
    public void setCode(String code)         { this.code = code; }
    public void setMessage(String message)   { this.message = message; }
    public void setRowCount(int rowCount)    { this.rowCount = rowCount; }

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
