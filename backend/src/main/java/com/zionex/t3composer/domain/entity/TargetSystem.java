package com.zionex.t3composer.domain.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Composer 가 지원하는 Target System (프로젝트 환경) 메타.
 * 다른 프로젝트 (다른 회사 SCM/ERP 등) 추가 시 row 만 늘리면 됨.
 *
 * 산출물 (JSX/Java/SP) 의 방언은 {@link #dbType} 을 따라간다.
 * Composer 자체 운영 DB (PostgreSQL) 와 무관.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "TB_CMP_TARGET_SYSTEM")
public class TargetSystem {

    /** target 식별자 — 'T3SERIES_MSSQL', 'XYZ_ORACLE' 등 */
    @Id
    @Column(name = "target_cd", length = 50)
    private String targetCd;

    @Column(name = "target_name", length = 200, nullable = false)
    private String targetName;

    @Column(name = "description", columnDefinition = "text")
    private String description;

    /** 'MSSQL' | 'ORACLE' | 'DB2' | 'POSTGRESQL' — 산출물 SP 방언 결정 */
    @Column(name = "db_type", length = 20, nullable = false)
    private String dbType;

    @Column(name = "db_dialect_class", length = 200)
    private String dbDialectClass;

    @Column(name = "frontend_stack", length = 50, nullable = false)
    private String frontendStack;

    @Column(name = "grid_library", length = 50, nullable = false)
    private String gridLibrary;

    @Column(name = "css_framework", length = 50, nullable = false)
    private String cssFramework;

    /** jsonb — JPA 매핑 단순화 위해 raw string. 필요 시 jackson 으로 파싱. */
    @Column(name = "module_codes", columnDefinition = "jsonb")
    private String moduleCodesJson;

    @Column(name = "ref_paths", columnDefinition = "jsonb")
    private String refPathsJson;

    @Column(name = "artifact_naming", columnDefinition = "jsonb")
    private String artifactNamingJson;

    @Column(name = "is_active", length = 1)
    private String isActive;

    @Column(name = "sort_order")
    private Integer sortOrder;

    // ─── Target 운영 DB 접속 (NEW_FROM_COPY / EXISTING_MODIFY 직접 조회용) ─────
    /** JDBC URL — 비어있으면 직접 접근 비활성, target-mssql synced 데이터 폴백 */
    @Column(name = "db_url", length = 500)
    private String dbUrl;

    @Column(name = "db_username", length = 100)
    private String dbUsername;

    /** ※ TODO: Jasypt 암호화 적용 (현재 plain) */
    @Column(name = "db_password", length = 500)
    private String dbPassword;

    @Column(name = "db_driver_class", length = 200)
    private String dbDriverClass;

    @Column(name = "db_connected_at")
    private LocalDateTime dbConnectedAt;

    @Column(name = "db_last_error", columnDefinition = "text")
    private String dbLastError;

    // ─── Target 별 소스 폴더 경로 (컨테이너 안 절대경로) ───────────────────────
    /** Target 의 frontend/jsx 소스 폴더 — 비어있으면 app.composer.wingui-ref-path 글로벌 fallback */
    @Column(name = "source_ref_path", length = 500)
    private String sourceRefPath;

    /** database upgrade 폴더 — 비어있으면 app.composer.database-ref-path 글로벌 fallback */
    @Column(name = "database_ref_path", length = 500)
    private String databaseRefPath;

    /**
     * backend 소스 루트 (monorepo 가 아닌 Target 용 — frontend 와 backend 가 별도 디렉토리).
     * 비어있으면 source_ref_path 기준 monorepo 가정 (`<source>/src/main/java`) 으로 fallback.
     * 예: PLANNEL = `/workspace/targets/PLANNEL/backend` (host 의 saas-application).
     */
    @Column(name = "backend_ref_path", length = 500)
    private String backendRefPath;

    /** 메뉴 트리 소스: DB (TB_AD_MENU 조회) | JS_FILE (TabMenuList.js 파싱) — 기본 DB */
    @Column(name = "menu_source", length = 20)
    private String menuSource;

    @CreatedBy
    @Column(name = "create_by", length = 100)
    private String createBy;

    @CreatedDate
    @Column(name = "create_dttm")
    private LocalDateTime createDttm;

    @LastModifiedBy
    @Column(name = "modify_by", length = 100)
    private String modifyBy;

    @LastModifiedDate
    @Column(name = "modify_dttm")
    private LocalDateTime modifyDttm;
}
