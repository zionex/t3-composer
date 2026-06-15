package com.zionex.t3composer.domain.service;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Component;

/**
 * 산출물 JSX 의 결정론적 import 환각을 교정한다 (1a — LLM 호출 없는 순수 변환).
 *
 * 룰 45 §3.5 (표준 심볼 출처) 를 기계적으로 집행:
 *   T1. react-i18next / useTranslation → transLangKey from @zionex/wingui-core
 *   T2. import { baseURI } from ... → 제거 (ambient 전역)
 *   T3. useForm 이 @wingui/common/imports 목록 안 → react-hook-form 으로 분리
 *
 * 변환은 패턴-특정이므로, 해당 안티패턴이 없는 JSX (PLANNEL 등) 에는 no-op.
 */
@Component
public class JsxArtifactRewriter {

    private static final String WINGUI_CORE = "@zionex/wingui-core";

    public static class RewriteResult {
        public String content;
        public boolean changed;
        public List<String> notes = new ArrayList<>();
    }

    // T1: import { ...useTranslation... } from 'react-i18next';  (작은/큰따옴표)
    private static final Pattern REACT_I18NEXT_IMPORT = Pattern.compile(
            "(?m)^\\s*import\\s*\\{[^}]*\\}\\s*from\\s*['\"]react-i18next['\"]\\s*;?\\s*$\\n?");

    // T1: const { t: transLangKey } = useTranslation();  (공백 변형 허용)
    private static final Pattern USE_TRANSLATION_DESTRUCTURE = Pattern.compile(
            "(?m)^\\s*const\\s*\\{\\s*t\\s*:\\s*transLangKey\\s*\\}\\s*=\\s*useTranslation\\s*\\(\\s*\\)\\s*;?\\s*$\\n?");

    // T2: import { baseURI } from '...';  (baseURI 단독 import — ambient 전역이라 불필요)
    private static final Pattern BASE_URI_SOLE_IMPORT = Pattern.compile(
            "(?m)^\\s*import\\s*\\{\\s*baseURI\\s*\\}\\s*from\\s*['\"][^'\"]+['\"]\\s*;?\\s*$\\n?");

    // T3: import { ... } from '@wingui/common/imports';  (multi-line 가능 — 안의 useForm 제거 대상)
    //   ★ inner 는 [^}]* — 다른 import 의 } 를 넘지 못하게 해 여러 import 를 가로지르는 오매칭 방지.
    private static final Pattern WINGUI_IMPORT_BLOCK = Pattern.compile(
            "import\\s*\\{([^}]*?)\\}\\s*from\\s*['\"]@wingui/common/imports['\"]\\s*;?");

    public RewriteResult rewriteImports(String jsxContent) {
        RewriteResult r = new RewriteResult();
        if (jsxContent == null) {
            r.content = null;
            return r;
        }
        String content = jsxContent;

        // ── T1. react-i18next transLangKey → wingui-core ──
        boolean hadReactI18next = REACT_I18NEXT_IMPORT.matcher(content).find();
        if (hadReactI18next) {
            content = REACT_I18NEXT_IMPORT.matcher(content).replaceAll("");
            content = USE_TRANSLATION_DESTRUCTURE.matcher(content).replaceAll("");
            // transLangKey 가 여전히 쓰이면 wingui-core 에서 import 보강
            if (content.contains("transLangKey") && !alreadyImportsTransLangKey(content)) {
                content = prependImport(content,
                        "import { transLangKey } from '" + WINGUI_CORE + "';");
            }
            r.changed = true;
            r.notes.add("T1: react-i18next transLangKey → " + WINGUI_CORE);
        }

        // ── T2. import { baseURI } → 제거 (ambient 전역) ──
        if (BASE_URI_SOLE_IMPORT.matcher(content).find()) {
            content = BASE_URI_SOLE_IMPORT.matcher(content).replaceAll("");
            r.changed = true;
            r.notes.add("T2: import { baseURI } 제거 (ambient)");
        }

        // ── T3. useForm 이 @wingui/common/imports 목록 안 → react-hook-form 으로 분리 ──
        content = extractUseFormToReactHookForm(content, r);

        r.content = content;
        return r;
    }

    /**
     * `import { ... } from '@wingui/common/imports'` 목록에서 useForm 을 빼고,
     * `import { useForm } from 'react-hook-form'` 을 추가. (목록 포맷은 보존)
     */
    private String extractUseFormToReactHookForm(String content, RewriteResult r) {
        Matcher m = WINGUI_IMPORT_BLOCK.matcher(content);
        if (!m.find()) return content;
        String inner = m.group(1);
        if (!Pattern.compile("\\buseForm\\b").matcher(inner).find()) return content;

        // 목록에서 useForm 토큰 제거 (앞/뒤 콤마 + 그 줄 공백 정리)
        String cleaned = inner
                .replaceAll("(?m)^\\s*useForm\\s*,?\\s*$\\n?", "")   // 단독 줄
                .replaceAll(",\\s*useForm\\b", "")                     // 인라인 후행
                .replaceAll("\\buseForm\\s*,\\s*", "");                // 인라인 선행
        String newBlock = "import {" + cleaned + "} from '@wingui/common/imports';";
        content = content.substring(0, m.start()) + newBlock + content.substring(m.end());

        if (!content.contains("from 'react-hook-form'")) {
            content = prependImport(content, "import { useForm } from 'react-hook-form';");
        }
        r.changed = true;
        r.notes.add("T3: useForm @wingui/common/imports → react-hook-form");
        return content;
    }

    private boolean alreadyImportsTransLangKey(String content) {
        return Pattern.compile(
                "(?m)^\\s*import\\s*\\{[^}]*\\btransLangKey\\b[^}]*\\}\\s*from\\s*['\"]"
                        + Pattern.quote(WINGUI_CORE) + "['\"]")
                .matcher(content).find();
    }

    /** 첫 import 줄 앞에 새 import 한 줄을 삽입 (없으면 파일 맨 앞). */
    private String prependImport(String content, String importLine) {
        Matcher m = Pattern.compile("(?m)^\\s*import\\s").matcher(content);
        if (m.find()) {
            int idx = m.start();
            return content.substring(0, idx) + importLine + "\n" + content.substring(idx);
        }
        return importLine + "\n" + content;
    }
}
