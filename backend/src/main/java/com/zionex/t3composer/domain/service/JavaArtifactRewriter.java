package com.zionex.t3composer.domain.service;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Component;

/**
 * Phase 2b — Composer 산출물의 Java 코드를 t3composer 백엔드 패키지에서 컴파일 가능하도록 변환.
 *
 * 핵심 매핑:
 *   - package 선언 → `com.zionex.t3composer.preview.s<sid8>.<feature>`
 *   - import 의 wingui 전용 클래스 → t3composer 의 동일 기능 클래스
 *
 * 변환 후 결과는 host 의 `./backend/src/main/java/com/zionex/t3composer/preview/s<sid8>/<feature>/...`
 * 에 쓰여지고 mvn compile + DevTools restart 로 spring context 에 로드된다.
 *
 * 매핑 표에 없는 import 가 등장하면 변환을 건너뛰고 unknownImports 에 기록 — 컴파일 실패 시
 * 사용자에게 정확한 원인 표시.
 */
@Component
public class JavaArtifactRewriter {

    /**
     * wingui → t3composer 패키지 매핑.
     * 키는 wingui FQN (정확 매칭), 값은 t3composer FQN.
     * 와일드카드 import (`*`) 는 prefix 매칭으로 별도 처리.
     */
    private static final Map<String, String> EXACT_IMPORT_MAP = new LinkedHashMap<>();
    static {
        EXACT_IMPORT_MAP.put("com.zionex.t3series.web.util.audit.BaseEntity",
                             "com.zionex.t3composer.shared.audit.BaseEntity");
        EXACT_IMPORT_MAP.put("com.zionex.t3series.web.util.data.ResponseMessage",
                             "com.zionex.t3composer.shared.data.ResponseMessage");
        EXACT_IMPORT_MAP.put("com.zionex.t3series.web.constant.ServiceConstants",
                             "com.zionex.t3composer.shared.constant.ServiceConstants");
        EXACT_IMPORT_MAP.put("com.zionex.t3series.web.security.authentication.AuthenticationInfo",
                             "com.zionex.t3composer.shared.auth.AuthenticationInfo");
        EXACT_IMPORT_MAP.put("com.zionex.t3series.web.security.authentication.AuthenticationProvider",
                             "com.zionex.t3composer.shared.auth.AuthenticationProvider");
        EXACT_IMPORT_MAP.put("com.zionex.t3series.util.SecurityUtils",
                             "com.zionex.t3composer.shared.util.SecurityUtils");
        EXACT_IMPORT_MAP.put("com.zionex.t3series.ApplicationProperties",
                             "com.zionex.t3composer.config.ApplicationProperties");
    }

    /** 정규식: 자기 패키지 자체가 wingui 도메인 — 산출물 java 파일은 모두 이 prefix */
    private static final Pattern PACKAGE_LINE = Pattern.compile(
            "^\\s*package\\s+(com\\.zionex\\.t3series\\.web\\.domain\\.[A-Za-z0-9_.]+)\\s*;",
            Pattern.MULTILINE);

    private static final Pattern IMPORT_LINE = Pattern.compile(
            "^\\s*import\\s+(static\\s+)?(com\\.zionex\\.t3series\\.[A-Za-z0-9_.*]+)\\s*;",
            Pattern.MULTILINE);

    /**
     * JdbcTemplate 필드 검출 — 산출물은 composer-db (PG) 가 아닌 target-db (MSSQL 등) 로
     * 라우팅되어야 SP 호출이 동작하므로 {@code @Qualifier("targetJdbcTemplate")} 를 자동 주입.
     * 매칭 그룹: 1=indent, 2=visibility, 3=final?, 4=variable name.
     */
    private static final Pattern JDBC_TEMPLATE_FIELD = Pattern.compile(
            "(?m)^([ \\t]*)((?:private|protected|public)\\s+)?(final\\s+)?JdbcTemplate\\s+(\\w+)\\s*;");

    /** JdbcTemplate import — Qualifier import 삽입 위치 결정 시 사용 */
    private static final Pattern JDBC_TEMPLATE_IMPORT = Pattern.compile(
            "(?m)^\\s*import\\s+org\\.springframework\\.jdbc\\.core\\.JdbcTemplate\\s*;");

    private static final String QUALIFIER_IMPORT_LINE =
            "import org.springframework.beans.factory.annotation.Qualifier;";

    private static final String QUALIFIER_ANNOTATION = "@Qualifier(\"targetJdbcTemplate\")";

    public static class RewriteResult {
        public String content;            // 변환된 java 소스
        public String previewPackage;     // 새 package FQN
        public java.util.List<String> unknownImports = new java.util.ArrayList<>();
        public boolean changed;
    }

    /**
     * @param sourceContent  원본 Java 소스
     * @param sid8           preview 격리용 8자리 sessionId prefix
     */
    public RewriteResult rewrite(String sourceContent, String sid8) {
        RewriteResult r = new RewriteResult();
        if (sourceContent == null || sourceContent.isBlank()) {
            r.content = sourceContent;
            return r;
        }

        // 1) package 선언 변환
        String previewPkg = "com.zionex.t3composer.preview.s" + sid8;
        Matcher pkgM = PACKAGE_LINE.matcher(sourceContent);
        StringBuilder buf = new StringBuilder();
        if (pkgM.find()) {
            String[] parts = pkgM.group(1).split("\\.");
            String leaf = parts[parts.length - 1];
            previewPkg = previewPkg + "." + leaf;
            pkgM.appendReplacement(buf, Matcher.quoteReplacement("package " + previewPkg + ";"));
            r.changed = true;
        }
        pkgM.appendTail(buf);
        String afterPkg = buf.toString();
        r.previewPackage = previewPkg;

        // 2) import 변환
        Matcher impM = IMPORT_LINE.matcher(afterPkg);
        StringBuilder buf2 = new StringBuilder();
        while (impM.find()) {
            String staticKw = impM.group(1) == null ? "" : impM.group(1);
            String fqn = impM.group(2);
            String mapped = mapImport(fqn, sid8);
            if (mapped != null) {
                impM.appendReplacement(buf2,
                    Matcher.quoteReplacement("import " + staticKw + mapped + ";"));
                r.changed = true;
            } else {
                r.unknownImports.add(fqn);
                impM.appendReplacement(buf2, Matcher.quoteReplacement(impM.group(0)));
            }
        }
        impM.appendTail(buf2);

        // 3) JdbcTemplate 필드에 @Qualifier("targetJdbcTemplate") 자동 주입
        r.content = injectTargetJdbcTemplateQualifier(buf2.toString(), r);

        return r;
    }

    /**
     * 산출물 Service 가 주입받는 {@code JdbcTemplate} 은 기본 Primary (composer-db PG) 가 아닌
     * {@code targetJdbcTemplate} (target-db, MSSQL 등) 으로 라우팅되어야 한다.
     *
     * 변환:
     *   {@code private final JdbcTemplate jdbcTemplate;}
     *   →
     *   {@code @Qualifier("targetJdbcTemplate")}
     *   {@code private final JdbcTemplate jdbcTemplate;}
     *
     * Qualifier import 도 함께 보장. 이미 {@code @Qualifier} 가 붙어있거나 변수명이
     * {@code targetJdbcTemplate} 이면 건너뜀.
     *
     * 주의: {@code @RequiredArgsConstructor} 가 생성하는 생성자 파라미터로 {@code @Qualifier}
     * 가 복사되려면 프로젝트 {@code lombok.config} 에 다음 설정 필요:
     *   {@code lombok.copyableAnnotations += org.springframework.beans.factory.annotation.Qualifier}
     */
    private String injectTargetJdbcTemplateQualifier(String source, RewriteResult r) {
        Matcher fm = JDBC_TEMPLATE_FIELD.matcher(source);
        StringBuilder out = new StringBuilder();
        boolean anyInjected = false;

        while (fm.find()) {
            String matched = fm.group();
            String indent = fm.group(1) == null ? "" : fm.group(1);
            String varName = fm.group(4);

            // 이미 명시적으로 targetJdbcTemplate 을 사용 → 건너뜀
            if ("targetJdbcTemplate".equals(varName)) {
                fm.appendReplacement(out, Matcher.quoteReplacement(matched));
                continue;
            }

            // 직전에 이미 @Qualifier 가 붙어있는지 — 매치 시작 직전 200자 검사
            int regionStart = Math.max(0, fm.start() - 200);
            String preceding = source.substring(regionStart, fm.start());
            if (preceding.contains("@Qualifier")) {
                fm.appendReplacement(out, Matcher.quoteReplacement(matched));
                continue;
            }

            String replacement = indent + QUALIFIER_ANNOTATION + "\n" + matched;
            fm.appendReplacement(out, Matcher.quoteReplacement(replacement));
            anyInjected = true;
        }
        fm.appendTail(out);

        if (!anyInjected) {
            return source;
        }

        r.changed = true;
        String result = out.toString();

        // Qualifier import 보장
        if (!result.contains("org.springframework.beans.factory.annotation.Qualifier")) {
            Matcher jt = JDBC_TEMPLATE_IMPORT.matcher(result);
            if (jt.find()) {
                int insertAt = jt.end();
                result = result.substring(0, insertAt) + "\n" + QUALIFIER_IMPORT_LINE
                       + result.substring(insertAt);
            } else {
                // fallback: package 선언 뒤
                Matcher pkg = PACKAGE_LINE.matcher(result);
                if (pkg.find()) {
                    int insertAt = pkg.end();
                    result = result.substring(0, insertAt) + "\n\n" + QUALIFIER_IMPORT_LINE
                           + result.substring(insertAt);
                }
            }
        }

        return result;
    }

    private String mapImport(String fqn, String sid8) {
        String exact = EXACT_IMPORT_MAP.get(fqn);
        if (exact != null) return exact;
        // 자기 도메인 산출물 cross-reference:
        //   `com.zionex.t3series.web.domain.<module>.<feature>.<Class>` 또는 와일드카드
        //   → `com.zionex.t3composer.preview.s<sid8>.<feature>.<Class>` (leaf 보존)
        Pattern p = Pattern.compile(
                "^com\\.zionex\\.t3series\\.web\\.domain\\.[A-Za-z0-9_]+\\.([A-Za-z0-9_]+)\\.([A-Za-z0-9_]+|\\*)$");
        Matcher m = p.matcher(fqn);
        if (m.matches()) {
            String feature = m.group(1);
            String tail    = m.group(2);
            return "com.zionex.t3composer.preview.s" + sid8 + "." + feature + "." + tail;
        }
        // `com.zionex.t3series.web.domain.<module>.<feature>` (Class 누락 — 보통 패키지 import 만)
        Pattern p2 = Pattern.compile(
                "^com\\.zionex\\.t3series\\.web\\.domain\\.[A-Za-z0-9_]+\\.([A-Za-z0-9_]+)$");
        Matcher m2 = p2.matcher(fqn);
        if (m2.matches()) {
            String feature = m2.group(1);
            return "com.zionex.t3composer.preview.s" + sid8 + "." + feature;
        }
        return null;
    }
}
