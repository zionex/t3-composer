package com.zionex.t3composer.config;

import javax.sql.DataSource;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

import com.zaxxer.hikari.HikariDataSource;

import lombok.extern.slf4j.Slf4j;

/**
 * Target Operational DataSource — 화면 실행 시 LLM 산출 SP/DDL 이 실행되는 별도 DB.
 *
 * 분리 이유:
 *   - composer-db (PG) = Composer 자체 메타 (세션·메시지·아티팩트·패턴 보관)
 *   - target-db  (MSSQL/Oracle/DB2) = Target System 의 운영 방언 SP/DDL 적용 대상
 *
 * 산출물의 dialect 와 적용 DB 의 dialect 가 일치해야 'CREATE OR ALTER PROCEDURE'
 * 같은 방언 구문이 정상 실행된다. T3SERIES/PLANNEL/LGES_NEXTSCM 모두 MSSQL 이라
 * 공유 컨테이너 1대. dialect 가 다른 Target 추가 시 별도 컨테이너 + bean 추가.
 *
 * Spring Boot 의 자동 DataSource (spring.datasource.*) 는 Primary (composer-db PG)
 * 로 유지. 이 클래스는 'targetDataSource' / 'targetJdbcTemplate' 보조 bean 만 제공.
 */
@Slf4j
@Configuration
public class TargetDataSourceConfig {

    @Value("${target.datasource.url:}")
    private String url;

    @Value("${target.datasource.username:sa}")
    private String username;

    @Value("${target.datasource.password:}")
    private String password;

    @Value("${target.datasource.driver-class-name:com.microsoft.sqlserver.jdbc.SQLServerDriver}")
    private String driverClassName;

    @Bean(name = "targetDataSource", destroyMethod = "close")
    public DataSource targetDataSource() {
        if (url == null || url.isBlank()) {
            log.warn("target.datasource.url 가 비어있음 — 화면 실행 시 SP/DDL 적용이 실패합니다.");
            // 빈 placeholder — bean 자체는 존재해야 JdbcTemplate 인젝션이 가능
        }
        HikariDataSource ds = DataSourceBuilder.create()
                .type(HikariDataSource.class)
                .driverClassName(driverClassName)
                .url(url)
                .username(username)
                .password(password)
                .build();
        ds.setMaximumPoolSize(5);
        ds.setConnectionTimeout(30_000);
        ds.setPoolName("target-pool");
        log.info("targetDataSource initialized: url={}", maskUrl(url));
        return ds;
    }

    @Bean(name = "targetJdbcTemplate")
    public JdbcTemplate targetJdbcTemplate() {
        return new JdbcTemplate(targetDataSource());
    }

    private String maskUrl(String u) {
        if (u == null) return "(null)";
        // password 가 url 안에 들어가는 환경 대비 (현재는 username/password 별도)
        return u.replaceAll("password=[^;&]*", "password=***");
    }
}
