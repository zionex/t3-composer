package com.zionex.t3composer.domain.service;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

import org.springframework.stereotype.Component;

/**
 * 산출물 JSX 가 룰을 따랐는지 채점한다 (2-B — 측정 레이어).
 *
 * ★ raw assistant 메시지(1a JsxArtifactRewriter 적용 *전*)를 채점해야 "LLM 이 룰을 따랐나"를
 *   측정할 수 있다. 저장본은 1a 가 이미 import 를 고쳐놔 환각이 안 보인다.
 *
 * 디텍터는 1a(rewriter 정규식)·1b(validator)를 *감지용*으로 재사용 — 이미 정밀도 검증됨.
 * 채점은 위반 개수 + 체크별 내역. 여러 세션에 돌리면 "LLM 이 어느 룰을 어기나" 집계.
 */
@Component
public class JsxConformanceScorer {

    private final JsxArtifactValidator validator;

    public JsxConformanceScorer(JsxArtifactValidator validator) {
        this.validator = validator;
    }

    /** 룰 준수 채점 결과. */
    public static class Report {
        public int violationCount;
        public List<CheckResult> checks = new ArrayList<>();

        public List<String> violatedCheckNames() {
            List<String> names = new ArrayList<>();
            for (CheckResult c : checks) {
                if (c.violated) names.add(c.name);
            }
            return names;
        }
    }

    public static class CheckResult {
        public String name;
        public boolean violated;
        public String detail;

        CheckResult(String name, boolean violated, String detail) {
            this.name = name;
            this.violated = violated;
            this.detail = detail;
        }
    }

    /** 세션 단위 집계 — assistant 메시지 여러 턴의 위반을 합산 + union. */
    public static class SessionReport {
        public int messageCount;
        public int totalViolations;
        public List<Report> perMessage = new ArrayList<>();

        /** 세션 전체에서 한 번이라도 위반된 체크 이름 (union, 중복 제거). */
        public List<String> violatedChecks() {
            java.util.LinkedHashSet<String> set = new java.util.LinkedHashSet<>();
            for (Report r : perMessage) set.addAll(r.violatedCheckNames());
            return new ArrayList<>(set);
        }
    }

    /** assistant 메시지(raw content) 리스트를 채점해 세션 집계 반환. */
    public SessionReport scoreMessages(List<String> assistantContents) {
        SessionReport session = new SessionReport();
        if (assistantContents == null) return session;
        for (String content : assistantContents) {
            Report r = scoreContent(content);
            session.perMessage.add(r);
            session.messageCount++;
            session.totalViolations += r.violationCount;
        }
        return session;
    }

    // ── 디텍터 (rules/45 §3.5 + §2 — lxma 실측 0건의 안티패턴) ──
    private static final Pattern D1_REACT_I18NEXT = Pattern.compile(
            "from\\s*['\"]react-i18next['\"]");
    private static final Pattern D2_BASEURI_IMPORT = Pattern.compile(
            "(?m)^\\s*import\\s*\\{\\s*baseURI\\s*\\}\\s*from");
    private static final Pattern D3_USEFORM_WINGUI = Pattern.compile(
            "import\\s*\\{([^}]*\\buseForm\\b[^}]*)\\}\\s*from\\s*['\"]@wingui/common/imports['\"]");
    private static final Pattern D4_OPTIONS_ENDPOINT = Pattern.compile(
            "zAxios\\s*\\.\\s*get\\s*\\(\\s*['\"][^'\"]*options/[^'\"]+['\"]");

    public Report scoreContent(String jsxContent) {
        Report report = new Report();
        String c = jsxContent == null ? "" : jsxContent;

        check(report, "react-i18next-translangkey", D1_REACT_I18NEXT.matcher(c).find(),
                "transLangKey 를 react-i18next/useTranslation 으로 가져옴 — @zionex/wingui-core 사용 (rules/45 §3.5)");
        check(report, "baseuri-import", D2_BASEURI_IMPORT.matcher(c).find(),
                "baseURI 를 import 함 — ambient 전역이라 import 불필요 (rules/45 §3.5)");
        check(report, "useform-wingui-import", D3_USEFORM_WINGUI.matcher(c).find(),
                "useForm 을 @wingui/common/imports 에서 가져옴 — react-hook-form 사용 (rules/45 §3.5)");
        // D4 는 1b validator 재사용 (콤보 per-field endpoint)
        boolean d4 = D4_OPTIONS_ENDPOINT.matcher(c).find() || !validator.validate(c).isEmpty();
        check(report, "combo-per-field-endpoint", d4,
                "콤보 옵션을 필드별 커스텀 endpoint 로 로드 — loadCombos()+common/data 표준 (rules/45 §2)");

        return report;
    }

    private void check(Report report, String name, boolean violated, String detail) {
        report.checks.add(new CheckResult(name, violated, detail));
        if (violated) report.violationCount++;
    }
}
