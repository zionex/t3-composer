package com.zionex.t3composer.shared.auth;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

/**
 * 부모 wingui 의 /auth 엔드포인트와 동일 시그니처. 단독 dev 환경에서는 항상 true.
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationProvider authenticationProvider;

    @GetMapping("/validate")
    public boolean validate() {
        return authenticationProvider.isValidAuthentication();
    }
}
