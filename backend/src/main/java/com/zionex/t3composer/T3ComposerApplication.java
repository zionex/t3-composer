package com.zionex.t3composer;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * T3Composer 단독 백엔드 진입점.
 *
 * 부모 wingui 의 InsightApplication 에서 Composer 패키지만 분리.
 * - 단독 Spring Boot 앱 (port 8090)
 * - 자체 MSSQL 인스턴스 (composer-db)
 * - dev 우회 인증 (mock 사용자 composer-dev)
 */
@SpringBootApplication
@EnableJpaAuditing
public class T3ComposerApplication {

    public static void main(String[] args) {
        SpringApplication.run(T3ComposerApplication.class, args);
    }
}
