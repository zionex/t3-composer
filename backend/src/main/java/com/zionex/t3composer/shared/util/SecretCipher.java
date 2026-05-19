package com.zionex.t3composer.shared.util;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Target 스냅샷의 시크릿(.env 의 API 키·비밀번호, db_password) 암호화/복호화.
 *
 * {@link SecurityUtils} 의 PBE(AES) 암호화를 위임 호출하되, 마스터키를 환경변수
 * 'COMPOSER_SNAPSHOT_SECRET_KEY' (= app.snapshot.secret-key) 로 강제한다.
 * SecurityUtils 는 key=null 이면 하드코딩 "mypassword" 로 fallback 하므로,
 * 이 wrapper 는 키 미설정 시 명확히 예외를 던져 그 위험을 차단한다.
 *
 * 저장 형식: 시크릿 값은 'ENC(&lt;base64암호문&gt;)' 로 래핑되어 복원 시 식별된다.
 * 마스터키 자체(COMPOSER_SNAPSHOT_SECRET_KEY)는 절대 스냅샷에 저장하지 않는다 —
 * 복원 시 백엔드가 메모리에 보유한 키를 .env 에 다시 기록한다.
 */
@Component
public class SecretCipher {

    private static final String ENC_PREFIX = "ENC(";
    private static final String ENC_SUFFIX = ")";

    private final String masterKey;

    public SecretCipher(@Value("${app.snapshot.secret-key:}") String masterKey) {
        this.masterKey = masterKey;
    }

    /** 마스터키가 설정되어 있는지. */
    public boolean isConfigured() {
        return masterKey != null && !masterKey.isBlank();
    }

    /** 백엔드가 보유한 마스터키 (복원 시 .env 의 COMPOSER_SNAPSHOT_SECRET_KEY 라인 재기록용). */
    public String getMasterKey() {
        return masterKey;
    }

    private void requireKey() {
        if (!isConfigured()) {
            throw new IllegalStateException(
                "COMPOSER_SNAPSHOT_SECRET_KEY 가 설정되지 않았습니다. "
                + "스냅샷 시크릿 암호화/복호화를 할 수 없습니다. "
                + ".env 와 docker-compose 의 COMPOSER_SNAPSHOT_SECRET_KEY 를 설정 후 백엔드를 재기동하세요.");
        }
    }

    /** 평문 → 'ENC(...)' 래핑 암호문. */
    public String wrapEncrypt(String plain) {
        requireKey();
        return ENC_PREFIX + SecurityUtils.encrypt(plain, masterKey) + ENC_SUFFIX;
    }

    /** 'ENC(...)' 래핑 여부. */
    public boolean isWrapped(String s) {
        return s != null && s.startsWith(ENC_PREFIX) && s.endsWith(ENC_SUFFIX);
    }

    /** 'ENC(...)' 래핑 암호문 → 평문. 래핑이 아니면 그대로 반환. */
    public String unwrapDecrypt(String value) {
        if (!isWrapped(value)) {
            return value;
        }
        requireKey();
        String cipher = value.substring(ENC_PREFIX.length(), value.length() - ENC_SUFFIX.length());
        return SecurityUtils.decrypt(cipher, masterKey);
    }
}
