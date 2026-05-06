package com.zionex.t3composer.domain.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;

import com.zionex.t3composer.domain.entity.ComposerArtifact;

import lombok.extern.slf4j.Slf4j;

/**
 * Composer 아티팩트의 자주 발생하는 오류를 적용 직전에 자동 보정한다.
 *
 * 보정 대상 (안전 변경만 — 의미 동등):
 *  - JSX  : textAlignment 'near' → 'left' (RealGrid2 동등)
 *           BaseGrid `columns=` → `items=`, `afterCreate=` → `afterGridCreate=`
 *           showMessage('confirm', ...) → showMessage('확인', ...)
 *  - JAVA : javax.persistence.* → jakarta.persistence.* (Spring Boot 3 호환)
 *           javax.servlet.*     → jakarta.servlet.*
 *           javax.validation.*  → jakarta.validation.*
 *           javax.annotation.*  → jakarta.annotation.*
 *           com.zionex.t3series.web.domain.BaseEntity → com.zionex.t3composer.shared.audit.BaseEntity
 *  - SQL  : TB_AD_LANG_PACK 의 UPDATE_BY/UPDATE_DTTM → MODIFY_BY/MODIFY_DTTM (실제 컬럼명)
 *
 * 의미가 바뀌거나 사람이 판단해야 하는 변경 (예: SP DDL 의 ORDER BY 누락, 허구 테이블 컬럼)
 * 은 여기서 보정하지 않고 별도 검증/경고로 남긴다.
 */
@Slf4j
@Service
public class ArtifactNormalizer {

    public NormalizationResult normalize(List<ComposerArtifact> artifacts) {
        NormalizationResult out = new NormalizationResult();
        if (artifacts == null) return out;
        for (ComposerArtifact a : artifacts) {
            String content = a.getContent();
            if (content == null || content.isBlank()) continue;
            String type = a.getArtifactType();
            String fixed = content;
            List<Fix> fixes = new ArrayList<>();
            if (type == null) continue;

            switch (type) {
                case ComposerArtifact.TYPE_SCREEN_JSX:
                    fixed = normalizeJsx(fixed, fixes);
                    break;
                case ComposerArtifact.TYPE_JAVA_ENTITY:
                case ComposerArtifact.TYPE_JAVA_SERVICE:
                case ComposerArtifact.TYPE_JAVA_CONTROLLER:
                case ComposerArtifact.TYPE_JAVA_REPOSITORY:
                    fixed = normalizeJava(fixed, fixes);
                    break;
                case ComposerArtifact.TYPE_MENU_SQL:
                case ComposerArtifact.TYPE_SQL_DDL:
                case ComposerArtifact.TYPE_SQL_SP:
                    fixed = normalizeSql(fixed, fixes);
                    break;
                default:
                    break;
            }

            if (!fixes.isEmpty()) {
                FileNormalization fn = new FileNormalization();
                fn.artifactId = a.getId();
                fn.artifactType = type;
                fn.filePath = a.getFilePath();
                fn.originalContent = content;
                fn.normalizedContent = fixed;
                fn.fixes = fixes;
                out.fileNormalizations.add(fn);
                out.totalFixCount += fixes.size();
                a.setContent(fixed);
            }
        }
        return out;
    }

    // ---- JSX ----
    private static final Pattern JSX_TEXT_ALIGN_NEAR = Pattern.compile(
            "textAlignment\\s*:\\s*['\"]near['\"]");
    private static final Pattern JSX_BASEGRID_COLUMNS = Pattern.compile(
            "<(BaseGrid|TreeGrid)\\b([^>]*?)\\bcolumns\\s*=", Pattern.DOTALL);
    private static final Pattern JSX_BASEGRID_AFTER_CREATE = Pattern.compile(
            "<(BaseGrid|TreeGrid)\\b([^>]*?)\\bafterCreate\\s*=", Pattern.DOTALL);
    private static final Pattern JSX_SHOWMESSAGE_CONFIRM = Pattern.compile(
            "showMessage\\s*\\(\\s*['\"]confirm['\"]");

    private String normalizeJsx(String src, List<Fix> fixes) {
        String s = src;
        s = applyReplace(s, JSX_TEXT_ALIGN_NEAR, "textAlignment: 'left'", fixes,
                "JSX-textAlign-near", "textAlignment 'near' → 'left' (MUI Select 호환)");
        s = applyReplaceCallback(s, JSX_BASEGRID_COLUMNS, m ->
                "<" + m.group(1) + m.group(2) + "items=", fixes,
                "JSX-baseGrid-columns", "<BaseGrid columns=...> → items=...");
        s = applyReplaceCallback(s, JSX_BASEGRID_AFTER_CREATE, m ->
                "<" + m.group(1) + m.group(2) + "afterGridCreate=", fixes,
                "JSX-baseGrid-afterCreate", "<BaseGrid afterCreate=...> → afterGridCreate=...");
        s = applyReplace(s, JSX_SHOWMESSAGE_CONFIRM, "showMessage('확인'", fixes,
                "JSX-showMessage-confirm", "showMessage('confirm', ...) → '확인'");
        return s;
    }

    // ---- Java ----
    private static final Pattern JAVA_JAVAX = Pattern.compile(
            "\\bimport\\s+javax\\.(persistence|servlet|validation|annotation)\\.");
    private static final Pattern JAVA_BASE_ENTITY_OLD = Pattern.compile(
            "\\bcom\\.zionex\\.t3series\\.web\\.domain\\.BaseEntity\\b");

    private String normalizeJava(String src, List<Fix> fixes) {
        String s = src;
        Matcher m = JAVA_JAVAX.matcher(s);
        if (m.find()) {
            String beforeSnippet = snippet(s, m.start(), m.end());
            s = m.replaceAll("import jakarta.$1.");
            fixes.add(new Fix("JAVA-javax-to-jakarta",
                    "javax.* → jakarta.* (Spring Boot 3)", beforeSnippet,
                    beforeSnippet.replaceFirst("javax\\.", "jakarta.")));
        }
        Matcher mb = JAVA_BASE_ENTITY_OLD.matcher(s);
        if (mb.find()) {
            String beforeSnippet = snippet(s, mb.start(), mb.end());
            s = mb.replaceAll("com.zionex.t3composer.shared.audit.BaseEntity");
            fixes.add(new Fix("JAVA-baseEntity-path",
                    "허구 BaseEntity 경로 → util.audit.BaseEntity", beforeSnippet,
                    "com.zionex.t3composer.shared.audit.BaseEntity"));
        }
        return s;
    }

    // ---- SQL ----
    private static final Pattern SQL_LANG_PACK_UPDATE_BY = Pattern.compile(
            "\\bUPDATE_BY\\b(?=[^\\n;]*?TB_AD_LANG_PACK)|TB_AD_LANG_PACK[^\\n;]*?\\bUPDATE_BY\\b",
            Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
    private static final Pattern SQL_LANG_PACK_UPDATE_DTTM = Pattern.compile(
            "\\bUPDATE_DTTM\\b(?=[^\\n;]*?TB_AD_LANG_PACK)|TB_AD_LANG_PACK[^\\n;]*?\\bUPDATE_DTTM\\b",
            Pattern.CASE_INSENSITIVE | Pattern.DOTALL);

    private String normalizeSql(String src, List<Fix> fixes) {
        String s = src;
        // TB_AD_LANG_PACK 컨텍스트 안에서만 UPDATE_BY → MODIFY_BY (다른 테이블에는 정말 UPDATE_BY 가 있는 경우가 있어 보수적으로 적용)
        if (s.contains("TB_AD_LANG_PACK")) {
            String before = s;
            s = s.replaceAll("(?i)(TB_AD_LANG_PACK[^;]*?)\\bUPDATE_BY\\b", "$1MODIFY_BY");
            s = s.replaceAll("(?i)(TB_AD_LANG_PACK[^;]*?)\\bUPDATE_DTTM\\b", "$1MODIFY_DTTM");
            // 거꾸로도 잡기 (UPDATE TB_AD_LANG_PACK SET UPDATE_BY=... 형태)
            s = s.replaceAll("(?i)\\bUPDATE_BY\\b([^;]*?TB_AD_LANG_PACK)", "MODIFY_BY$1");
            s = s.replaceAll("(?i)\\bUPDATE_DTTM\\b([^;]*?TB_AD_LANG_PACK)", "MODIFY_DTTM$1");
            if (!s.equals(before)) {
                fixes.add(new Fix("SQL-langPack-update-modify",
                        "TB_AD_LANG_PACK UPDATE_BY/UPDATE_DTTM → MODIFY_BY/MODIFY_DTTM (실제 컬럼)",
                        "...UPDATE_BY/UPDATE_DTTM...", "...MODIFY_BY/MODIFY_DTTM..."));
            }
        }
        return s;
    }

    // ---- Helpers ----

    private String applyReplace(String src, Pattern p, String replacement,
                                 List<Fix> fixes, String rule, String desc) {
        Matcher m = p.matcher(src);
        int matchCount = 0;
        StringBuilder sb = new StringBuilder();
        String firstBefore = null;
        while (m.find()) {
            if (firstBefore == null) firstBefore = src.substring(m.start(), m.end());
            m.appendReplacement(sb, Matcher.quoteReplacement(replacement));
            matchCount++;
        }
        m.appendTail(sb);
        if (matchCount > 0) {
            fixes.add(new Fix(rule, desc + (matchCount > 1 ? " (×" + matchCount + ")" : ""),
                    firstBefore == null ? "" : firstBefore, replacement));
            return sb.toString();
        }
        return src;
    }

    private String applyReplaceCallback(String src, Pattern p,
                                          java.util.function.Function<Matcher, String> replFn,
                                          List<Fix> fixes, String rule, String desc) {
        Matcher m = p.matcher(src);
        int matchCount = 0;
        StringBuilder sb = new StringBuilder();
        String firstBefore = null;
        while (m.find()) {
            if (firstBefore == null) firstBefore = src.substring(m.start(), m.end());
            String r = replFn.apply(m);
            m.appendReplacement(sb, Matcher.quoteReplacement(r));
            matchCount++;
        }
        m.appendTail(sb);
        if (matchCount > 0) {
            fixes.add(new Fix(rule, desc + (matchCount > 1 ? " (×" + matchCount + ")" : ""),
                    firstBefore == null ? "" : firstBefore, "(보정됨)"));
            return sb.toString();
        }
        return src;
    }

    private String snippet(String src, int start, int end) {
        int s = Math.max(0, start);
        int e = Math.min(src.length(), end);
        return src.substring(s, e);
    }

    // ---- DTO ----

    public static class NormalizationResult {
        public List<FileNormalization> fileNormalizations = new ArrayList<>();
        public int totalFixCount = 0;

        public Map<String, Object> toResponseMap() {
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("totalFixCount", totalFixCount);
            out.put("fileCount", fileNormalizations.size());
            List<Map<String, Object>> files = new ArrayList<>();
            for (FileNormalization fn : fileNormalizations) {
                Map<String, Object> fmap = new LinkedHashMap<>();
                fmap.put("artifactId", fn.artifactId);
                fmap.put("artifactType", fn.artifactType);
                fmap.put("filePath", fn.filePath);
                List<Map<String, Object>> fixList = new ArrayList<>();
                for (Fix fx : fn.fixes) {
                    Map<String, Object> fxm = new LinkedHashMap<>();
                    fxm.put("rule", fx.rule);
                    fxm.put("description", fx.description);
                    fxm.put("before", fx.before);
                    fxm.put("after", fx.after);
                    fixList.add(fxm);
                }
                fmap.put("fixes", fixList);
                files.add(fmap);
            }
            out.put("files", files);
            return out;
        }
    }

    public static class FileNormalization {
        public String artifactId;
        public String artifactType;
        public String filePath;
        public String originalContent;
        public String normalizedContent;
        public List<Fix> fixes = new ArrayList<>();
    }

    public static class Fix {
        public final String rule;
        public final String description;
        public final String before;
        public final String after;

        public Fix(String rule, String description, String before, String after) {
            this.rule = rule;
            this.description = description;
            this.before = before;
            this.after = after;
        }
    }
}
