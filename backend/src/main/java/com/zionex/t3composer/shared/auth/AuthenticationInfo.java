package com.zionex.t3composer.shared.auth;

import com.fasterxml.jackson.annotation.JsonIgnore;

import lombok.Builder;
import lombok.Data;

/**
 * 부모 wingui 의 com.zionex.t3composer.shared.auth.AuthenticationInfo
 * 와 동일 시그니처. sync 시 패키지 rename 만으로 wingui 호환.
 */
@Data
@Builder
public class AuthenticationInfo {

    private String token;

    @JsonIgnore
    private String userId;

    private String username;

    private String displayName;

    private String uniqueValue;

    private boolean systemAdmin;

    private boolean passwordExpired;
}
