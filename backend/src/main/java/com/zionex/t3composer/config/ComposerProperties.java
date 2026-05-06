package com.zionex.t3composer.config;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Data;

/**
 * 부모 wingui 의 ApplicationProperties.Composer 와 동일 구조.
 * 단독 환경에서는 'app.composer' prefix 가 직접 이 클래스에 매핑.
 *
 * 추가 필드 (단독 환경 전용):
 * - apply-mode: staging | direct
 * - wingui-ref-path: 부모 wingui 폴더 read-only 경로
 * - database-ref-path: 부모 t3series-database 폴더 경로
 */
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
}
