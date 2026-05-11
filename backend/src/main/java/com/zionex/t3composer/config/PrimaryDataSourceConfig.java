package com.zionex.t3composer.config;

import javax.sql.DataSource;

import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import org.springframework.jdbc.core.JdbcTemplate;

import com.zaxxer.hikari.HikariDataSource;

import lombok.extern.slf4j.Slf4j;

/**
 * Primary DataSource — Composer 메타 DB (PostgreSQL).
 *
 * <p>별도 {@link TargetDataSourceConfig#targetDataSource()} bean 이 존재하면
 * Spring Boot 의 {@code DataSourceAutoConfiguration} 이 비활성화되므로
 * (@ConditionalOnMissingBean), 이 클래스가 spring.datasource.* 프로퍼티를 읽어
 * Primary 빈을 직접 등록한다. JPA EntityManager / TransactionManager 는
 * 자동으로 Primary 를 잡아 사용한다.
 */
@Slf4j
@Configuration
public class PrimaryDataSourceConfig {

    @Bean
    @Primary
    @ConfigurationProperties("spring.datasource")
    public DataSourceProperties primaryDataSourceProperties() {
        return new DataSourceProperties();
    }

    @Bean(name = "dataSource", destroyMethod = "close")
    @Primary
    @ConfigurationProperties("spring.datasource.hikari")
    public HikariDataSource primaryDataSource(DataSourceProperties properties) {
        HikariDataSource ds = (HikariDataSource) DataSourceBuilder.create()
                .type(HikariDataSource.class)
                .driverClassName(properties.getDriverClassName())
                .url(properties.getUrl())
                .username(properties.getUsername())
                .password(properties.getPassword())
                .build();
        ds.setPoolName("composer-pool");
        log.info("primaryDataSource initialized (PG): url={}", properties.getUrl());
        return ds;
    }

    /**
     * composer-db (PG) 전용 JdbcTemplate.
     * Spring Boot 의 auto-config JdbcTemplate 은 다른 DataSource bean (target-mssql) 이 함께
     * 등록되면서 어느 쪽이 wired 될지 불확실해지므로, 메타 DB 용 명시 bean 으로 분리.
     */
    @Bean(name = "composerJdbcTemplate")
    @Primary
    public JdbcTemplate composerJdbcTemplate(@org.springframework.beans.factory.annotation.Qualifier("dataSource") HikariDataSource ds) {
        return new JdbcTemplate(ds);
    }
}
