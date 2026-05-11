package com.zionex.t3composer.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * docker-compose / .env 의 TARGET_<TARGETCD>_DB_* 환경변수를 startup 시
 * tb_cmp_target_system 의 db_url/user/pass 컬럼에 반영.
 *
 * - 환경변수가 비어있으면 DB 값 유지 (덮어쓰지 않음)
 * - 환경변수가 채워져 있으면 DB row 갱신 + DataSource 캐시 invalidate
 *
 * 사용:
 *   .env 에
 *     TARGET_T3SERIES_DB_URL=jdbc:sqlserver://devhost:1433;databaseName=...
 *     TARGET_T3SERIES_DB_USERNAME=...
 *     TARGET_T3SERIES_DB_PASSWORD=...
 *   추가 후 `docker compose up -d composer-backend` 재기동.
 *
 * 향후 다른 Target (PLANNEL/LGES_NEXTSCM) 도 동일 패턴으로 환경변수 추가만으로 적용 가능.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class TargetDbConnectionEnvLoader {

    @Qualifier("composerJdbcTemplate")
    private final JdbcTemplate composerDbJdbc;

    private final TargetDataSourceRegistry dsRegistry;

    @Value("${target.seed.t3series.db-url:}")        private String t3seriesUrl;
    @Value("${target.seed.t3series.db-username:}")   private String t3seriesUser;
    @Value("${target.seed.t3series.db-password:}")   private String t3seriesPass;
    @Value("${target.seed.t3series.db-driver-class:}") private String t3seriesDriver;

    @EventListener(ApplicationReadyEvent.class)
    public void apply() {
        applyOne("T3SERIES", t3seriesUrl, t3seriesUser, t3seriesPass, t3seriesDriver);
        // 추후 PLANNEL/LGES_NEXTSCM 도 추가:
        //   applyOne("PLANNEL", plannelUrl, ...);
    }

    private void applyOne(String targetCd, String url, String user, String pass, String driver) {
        if (url == null || url.isBlank()) {
            log.info("Target {} 환경변수 db_url 미설정 — DB 값 유지", targetCd);
            return;
        }
        boolean changed = false;
        if (pass != null && !pass.isEmpty()) {
            int rows = composerDbJdbc.update(
                "UPDATE dbo.tb_cmp_target_system SET db_url=?, db_username=?, db_password=?, " +
                "db_driver_class=COALESCE(NULLIF(?, ''), db_driver_class), " +
                "db_last_error=NULL, modify_by='env-loader', modify_dttm=now() WHERE target_cd=?",
                url, user, pass, driver, targetCd);
            changed = rows > 0;
        } else {
            int rows = composerDbJdbc.update(
                "UPDATE dbo.tb_cmp_target_system SET db_url=?, db_username=?, " +
                "db_driver_class=COALESCE(NULLIF(?, ''), db_driver_class), " +
                "db_last_error=NULL, modify_by='env-loader', modify_dttm=now() WHERE target_cd=?",
                url, user, driver, targetCd);
            changed = rows > 0;
        }
        if (changed) {
            dsRegistry.invalidate(targetCd);
            log.info("Target {} db_url 환경변수 적용: {}", targetCd, maskUrl(url));
        } else {
            log.warn("Target {} 환경변수 적용 실패 — tb_cmp_target_system row 없음", targetCd);
        }
    }

    private static String maskUrl(String u) {
        return u == null ? "(null)" : u.replaceAll("password=[^;&]*", "password=***");
    }
}
