package com.zionex.t3composer.domain.service;

import java.util.UUID;

import jakarta.annotation.PostConstruct;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Composer 가 화면 실행으로 만든 객체 (TABLE / INDEX / VIEW) 추적.
 *
 * 사용자 요구사항 (2026-05-14):
 *   "신규생성 DDL 작성 시 객체가 존재하면 삭제하는 명령을 넣어도 좋다.
 *    단 동일 Composer 에 의해서 생성된 객체만 삭제 가능하다 — 기존 객체는 건드리지 말 것."
 *
 * 따라서 ArtifactApplyService 가 DDL 실행 직전 이 registry 조회:
 *   - isOwned(name, type) == true → CREATE 전에 DROP 안전하게 시도
 *   - isOwned(name, type) == false → 외부 객체 — DROP 금지, "이미 존재" 면 skip
 *
 * 저장 위치: composer-db (PG) `dbo.tb_cmp_composer_objects`. 객체 자체는 target-mssql 에 있지만
 *   소유권 메타정보만 별도 PG 로 분리해 충돌 회피.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class ComposerObjectsRegistry {

    private final @Qualifier("composerJdbcTemplate") JdbcTemplate composerJdbc;

    @PostConstruct
    public void init() {
        try {
            composerJdbc.execute(
                "CREATE TABLE IF NOT EXISTS dbo.tb_cmp_composer_objects (" +
                "  id           varchar(32)  NOT NULL PRIMARY KEY, " +
                "  object_name  varchar(200) NOT NULL, " +
                "  object_type  varchar(20)  NOT NULL, " +
                "  schema_name  varchar(50)  NOT NULL DEFAULT 'dbo', " +
                "  sid8         varchar(8), " +
                "  created_dttm timestamp DEFAULT now()" +
                ")"
            );
            composerJdbc.execute(
                "CREATE UNIQUE INDEX IF NOT EXISTS ix_cmp_obj_uniq " +
                "ON dbo.tb_cmp_composer_objects (upper(object_name), upper(object_type), upper(schema_name))"
            );
            log.info("ComposerObjectsRegistry initialized");
        } catch (Exception e) {
            log.warn("ComposerObjectsRegistry init failed: {}", e.getMessage());
        }
    }

    public boolean isOwned(String name, String type) {
        if (name == null || type == null) return false;
        try {
            Integer cnt = composerJdbc.queryForObject(
                "SELECT COUNT(*) FROM dbo.tb_cmp_composer_objects " +
                "WHERE upper(object_name) = upper(?) AND upper(object_type) = upper(?)",
                Integer.class, name, type);
            return cnt != null && cnt > 0;
        } catch (Exception e) {
            log.warn("isOwned lookup failed name={} type={}: {}", name, type, e.getMessage());
            return false;
        }
    }

    public void register(String name, String type, String sid8) {
        if (name == null || type == null) return;
        try {
            // upsert — 같은 객체 다시 만들면 sid8 갱신
            composerJdbc.update(
                "INSERT INTO dbo.tb_cmp_composer_objects (id, object_name, object_type, schema_name, sid8, created_dttm) " +
                "SELECT ?, ?, ?, 'dbo', ?, now() " +
                "WHERE NOT EXISTS (" +
                "  SELECT 1 FROM dbo.tb_cmp_composer_objects " +
                "  WHERE upper(object_name) = upper(?) AND upper(object_type) = upper(?)" +
                ")",
                UUID.randomUUID().toString().replace("-", ""), name, type, sid8, name, type);
            // 이미 있는 경우 sid8 갱신
            composerJdbc.update(
                "UPDATE dbo.tb_cmp_composer_objects SET sid8 = ?, created_dttm = now() " +
                "WHERE upper(object_name) = upper(?) AND upper(object_type) = upper(?)",
                sid8, name, type);
        } catch (Exception e) {
            log.warn("register object failed name={} type={}: {}", name, type, e.getMessage());
        }
    }
}
