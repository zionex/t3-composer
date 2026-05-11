package com.zionex.t3composer.config;

import java.sql.Connection;
import java.util.concurrent.ConcurrentHashMap;

import javax.sql.DataSource;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import com.zaxxer.hikari.HikariDataSource;
import com.zionex.t3composer.domain.entity.TargetSystem;
import com.zionex.t3composer.domain.repository.TargetSystemRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Target 별 on-demand 운영 DB 연결 캐시.
 *
 * NEW_FROM_COPY / EXISTING_MODIFY 모드에서 menu/langpack/SP DDL 을 운영 DB 에서
 * 직접 조회하기 위한 진입점. tb_cmp_target_system 의 db_url/user/pass 가 채워져 있어야 한다.
 *
 * 캐시 정책:
 *   - target_cd 별 HikariDataSource 1개 (poolSize=3)
 *   - first access 시 connection test 실패하면 cache 안 함 → 매 호출마다 재시도 가능
 *   - DB 정보 수정 시 controller 에서 invalidate(targetCd) 호출 필요
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class TargetDataSourceRegistry {

    private final TargetSystemRepository targetRepo;
    private final ConcurrentHashMap<String, HikariDataSource> cache = new ConcurrentHashMap<>();

    /** Target 의 JdbcTemplate. null → 미설정 또는 연결 실패 (호출자가 폴백 결정). */
    public JdbcTemplate getJdbcTemplate(String targetCd) {
        DataSource ds = getDataSource(targetCd);
        return ds == null ? null : new JdbcTemplate(ds);
    }

    public DataSource getDataSource(String targetCd) {
        if (targetCd == null || targetCd.isBlank()) return null;
        HikariDataSource cached = cache.get(targetCd);
        if (cached != null && !cached.isClosed()) return cached;

        TargetSystem t = targetRepo.findById(targetCd).orElse(null);
        if (t == null) {
            log.warn("Target 미존재: {}", targetCd);
            return null;
        }
        String url = t.getDbUrl();
        if (url == null || url.isBlank()) {
            log.debug("Target {} 의 db_url 미설정 — 직접 접근 비활성", targetCd);
            return null;
        }

        HikariDataSource ds = new HikariDataSource();
        ds.setJdbcUrl(url);
        ds.setUsername(t.getDbUsername());
        ds.setPassword(t.getDbPassword() == null ? "" : t.getDbPassword());
        if (t.getDbDriverClass() != null && !t.getDbDriverClass().isBlank()) {
            ds.setDriverClassName(t.getDbDriverClass());
        }
        ds.setMaximumPoolSize(3);
        ds.setConnectionTimeout(15_000);
        ds.setIdleTimeout(60_000);
        ds.setPoolName("target-pool-" + targetCd);

        // 첫 connection 테스트
        try (Connection c = ds.getConnection()) {
            log.info("Target {} DB 연결 성공: {}", targetCd, maskUrl(url));
        } catch (Exception e) {
            log.warn("Target {} DB 연결 실패: {}", targetCd, e.getMessage());
            ds.close();
            return null;
        }

        cache.put(targetCd, ds);
        return ds;
    }

    /** DB 정보 변경 후 호출 — 캐시된 pool 닫고 제거. */
    public void invalidate(String targetCd) {
        if (targetCd == null) return;
        HikariDataSource ds = cache.remove(targetCd);
        if (ds != null) {
            try { ds.close(); } catch (Exception ignored) {}
            log.info("Target {} DataSource 캐시 무효화", targetCd);
        }
    }

    /** 활성 여부 확인 (사용자 진단용) */
    public boolean isConnected(String targetCd) {
        HikariDataSource ds = cache.get(targetCd);
        return ds != null && !ds.isClosed();
    }

    private static String maskUrl(String u) {
        return u == null ? "(null)" : u.replaceAll("password=[^;&]*", "password=***");
    }
}
