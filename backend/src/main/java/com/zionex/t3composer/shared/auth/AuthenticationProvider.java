package com.zionex.t3composer.shared.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * 부모 wingui 의 AuthenticationProvider 와 동일 시그니처 + dev 우회 mock 사용자.
 *
 * 단독 환경에서는 항상 'composer-dev' 사용자 반환. wingui 로 sync 후엔
 * 부모 클래스가 대체되어 실제 JWT 인증된 사용자 정보 반환.
 */
@Component
public class AuthenticationProvider {

    @Value("${composer-dev.mock-user.user-id:user0000000000000000000000000001}")
    private String mockUserId;

    @Value("${composer-dev.mock-user.username:composer-dev}")
    private String mockUsername;

    @Value("${composer-dev.mock-user.display-name:Composer Dev}")
    private String mockDisplayName;

    public AuthenticationInfo getAuthenticationInfo() {
        return AuthenticationInfo.builder()
            .userId(mockUserId)
            .username(mockUsername)
            .displayName(mockDisplayName)
            .uniqueValue(mockUserId)
            .systemAdmin(true)
            .passwordExpired(false)
            .build();
    }

    public boolean isValidAuthentication() {
        return true;
    }
}
