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
 * - wingui-ref-path: 부모 wingui 폴더 read-only 경로
 * - database-ref-path: 부모 t3series-database 폴더 경로
 */
@Slf4j
@Data
@Component
@ConfigurationProperties(prefix = "app.composer")
public class ComposerProperties {

    private boolean autoApplyEnabled = false;

    /** staging | direct */
    private String applyMode = "staging";

    /** Files.write 의 base 경로. staging mode 일 때 staging dir, direct mode 일 때 wingui dir */
    private String projectRoot;

    /** 부모 wingui 폴더 (NEW_FROM_COPY 의 sourceBundle 수집용 read-only) */
    private String winguiRefPath;

    /** 부모 t3series-database 폴더 */
    private String databaseRefPath;

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
        "**/oracle/upgrade/**"
    );

    public boolean isStagingMode() {
        return "staging".equalsIgnoreCase(applyMode);
    }

    public boolean isDirectMode() {
        return "direct".equalsIgnoreCase(applyMode);
    }

    /**
     * apply-mode 가 'direct' 면 startup 시 projectRoot 를 winguiRefPath 로 자동 전환.
     * 이로써 ArtifactApplyService 등 기존 코드 (props.getComposer().getProjectRoot()) 는 변경 없이
     * staging/direct 두 모드 모두 정상 동작.
     */
    @PostConstruct
    void resolveEffectiveProjectRoot() {
        if (isDirectMode()) {
            if (winguiRefPath != null && !winguiRefPath.isBlank()) {
                String prev = projectRoot;
                this.projectRoot = winguiRefPath;
                log.info("Composer apply-mode=direct → projectRoot 전환: {} → {}", prev, projectRoot);
            } else {
                log.warn("Composer apply-mode=direct 인데 winguiRefPath 가 비어있어 staging 으로 fallback");
                this.applyMode = "staging";
            }
        } else {
            log.info("Composer apply-mode=staging, projectRoot={}", projectRoot);
        }
    }
}
