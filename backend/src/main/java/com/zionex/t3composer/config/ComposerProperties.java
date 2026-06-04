package com.zionex.t3composer.config;

import java.util.List;

import jakarta.annotation.PostConstruct;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Data;
import lombok.extern.slf4j.Slf4j;

/**
 * 부모 wingui 의 ApplicationProperties.Composer 와 동일 구조.
 * 단독 환경에서는 'app.composer' prefix 가 직접 이 클래스에 매핑.
 *
 * 추가 필드 (단독 환경 전용):
 * - apply-mode: staging | direct
 *
 * (2026-05-28) 글로벌 wingui-ref-path / database-ref-path 필드 폐기.
 *   대신 Per-Target (`tb_cmp_target_system.source_ref_path` 또는 `/workspace/targets/<CD>/wingui`)
 *   만 사용. TargetPathResolver 가 우선순위 처리.
 */
@Slf4j
@Data
@Component
@ConfigurationProperties(prefix = "app.composer")
public class ComposerProperties {

    private boolean autoApplyEnabled = false;

    /** staging | direct */
    private String applyMode = "staging";

    /**
     * Files.write 의 base 경로. staging mode (글로벌 fallback).
     *   (2026-05-28) Per-Target routing 도입 후엔 ArtifactApplyService 가
     *   TargetPathResolver.resolveSourcePath(targetCd) 우선 사용, 못 찾을 때만 이 path 로 fallback.
     */
    private String projectRoot;

    /** DDL/SP 파일을 upgrade 폴더에 저장할 때 사용할 버전 폴더명 */
    private String upgradeVersion;

    /**
     * Phase 2a (JSX preview) — JSX 산출물을 frontend webpack-dev-server 가 watch 하는
     * `frontend/src/view/_preview/<sid8>/...` 위치에 쓰기 위한 컨테이너 내부 절대 경로.
     * docker-compose 의 `./frontend/src/view/_preview:/workspace/preview/frontend` 마운트와 매칭.
     */
    private String previewFrontendRoot;

    /**
     * Phase 2b (Java preview) — Java 산출물을 backend devtools 가 watch 하는 컨테이너 내부 src 경로.
     * docker-compose 의 `./backend:/app` 마운트가 적용된 상태에서 `/app/src/main/java/com/zionex/t3composer/preview/s<sid8>/` 에 쓴다.
     */
    private String previewJavaRoot;

    /**
     * Phase 2b — mvn 실행 작업 디렉토리. 보통 `/app` (backend 컨테이너 안의 host-mounted ./backend).
     */
    private String previewMvnWorkdir;

    /** 쓰기 허용 경로 패턴 (glob) */
    private List<String> allowWritePatterns = List.of(
        "**/view/**",
        "**/data/menus.js",
        "**/data/menus.js.patch",
        "**/main/java/**",
        "**/mssql/procedures/**",
        "**/mssql/upgrade/**",
        "**/oracle/procedures/**",
        "**/oracle/upgrade/**",
        // PlanNEL — saas-web/ (TARGET_PLANNEL_PATH)
        // Both **/src/.../** and src/.../** are needed: Java PathMatcher with leading **/ does
        // not reliably match paths where the mount-point prefix was already stripped, leaving
        // the path starting directly with src/ (no leading segment for ** to absorb).
        "**/src/pages/**",
        "src/pages/**",
        "**/src/services/**",
        "src/services/**",
        "**/src/components/**",
        "src/components/**",
        "**/src/redux/**",
        "src/redux/**",
        "**/src/utils/**",
        "src/utils/**",
        "**/src/hooks/**",
        "src/hooks/**",
        "**/src/assets/data/l10n/**",
        "src/assets/data/l10n/**",
        // PlanNEL — saas-application/ (TARGET_PLANNEL_BACKEND_PATH)
        "**/src/main/resources/mapper/**",
        "src/main/resources/mapper/**",
        // PlanNEL — Liquibase changelog YAML files
        "**/src/main/resources/db/changelog/**",
        "src/main/resources/db/changelog/**"
    );

    public boolean isStagingMode() {
        return "staging".equalsIgnoreCase(applyMode);
    }

    public boolean isDirectMode() {
        return "direct".equalsIgnoreCase(applyMode);
    }

    /**
     * (2026-05-28) apply-mode 의 direct 자동 전환 로직 폐기 —
     *   Per-Target routing (TargetPathResolver) 가 ArtifactApplyService 에 도입된 이후,
     *   글로벌 winguiRefPath 기반의 direct 전환은 더 이상 의미 없음. apply-mode 는
     *   staging fallback 의 base path 결정 용도로만 유지.
     *   direct 시도 시 경고만 남기고 staging 으로 fallback (호환성).
     */
    @PostConstruct
    void resolveEffectiveProjectRoot() {
        if (isDirectMode()) {
            log.warn("Composer apply-mode=direct 는 폐기됨 — Per-Target source 경로 (TARGET_<CD>_PATH) "
                  + "가 자동으로 사용됨. staging fallback 으로 전환.");
            this.applyMode = "staging";
        }
        log.info("Composer apply-mode=staging, projectRoot={} (Per-Target 미해석 시 fallback)", projectRoot);
    }
}
