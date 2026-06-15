package com.zionex.t3composer.domain.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class JsxArtifactRewriterTest {

    private final JsxArtifactRewriter rewriter = new JsxArtifactRewriter();

    @Test
    void rewritesReactI18nextTransLangKeyToWinguiCore() {
        String jsx = String.join("\n",
                "import { useTranslation } from 'react-i18next';",
                "import { ContentInner } from '@wingui/common/imports';",
                "const { t: transLangKey } = useTranslation();",
                "function Foo() { return transLangKey('HELLO'); }");

        JsxArtifactRewriter.RewriteResult result = rewriter.rewriteImports(jsx);

        assertThat(result.changed).isTrue();
        assertThat(result.content).doesNotContain("react-i18next");
        assertThat(result.content).doesNotContain("useTranslation");
        assertThat(result.content).contains("import { transLangKey } from '@zionex/wingui-core';");
        // 사용처는 보존
        assertThat(result.content).contains("transLangKey('HELLO')");
    }

    @Test
    void removesBaseUriImportBecauseItIsAmbient() {
        String jsx = String.join("\n",
                "import { baseURI } from '@wingui/utils/common';",
                "import { ContentInner } from '@wingui/common/imports';",
                "function Foo() { return baseURI() + 'common/data'; }");

        JsxArtifactRewriter.RewriteResult result = rewriter.rewriteImports(jsx);

        assertThat(result.changed).isTrue();
        assertThat(result.content).doesNotContain("import { baseURI }");
        // 사용처(baseURI()) 는 보존 — ambient 라 import 만 제거
        assertThat(result.content).contains("baseURI() + 'common/data'");
        assertThat(result.content).contains("import { ContentInner }");
    }

    @Test
    void movesUseFormFromWinguiImportsToReactHookForm() {
        String jsx = String.join("\n",
                "import {",
                "  ContentInner,",
                "  useForm,",
                "} from '@wingui/common/imports';",
                "function Foo() { const { control } = useForm(); }");

        JsxArtifactRewriter.RewriteResult result = rewriter.rewriteImports(jsx);

        assertThat(result.changed).isTrue();
        // react-hook-form 에서 import 추가
        assertThat(result.content).contains("import { useForm } from 'react-hook-form';");
        // wingui 목록의 다른 심볼은 보존
        assertThat(result.content).contains("ContentInner");
        // useForm 사용처 보존
        assertThat(result.content).contains("useForm()");
        // ★ react-hook-form import 줄을 빼면, useForm 의 list-member 형태(`useForm,`)가 남아선 안 됨
        //   (= wingui 목록에서 제거됨). 포맷에 무관한 검증.
        String withoutRhf = result.content.replace("import { useForm } from 'react-hook-form';", "");
        assertThat(withoutRhf).doesNotContain("useForm,");
    }

    @Test
    void fixesAllThreeHallucinationsTogether() {
        // 사용자가 실제로 본 산출물 (3개 환각 동시)
        String jsx = String.join("\n",
                "import { useTranslation } from 'react-i18next';",
                "import { baseURI } from '@wingui/utils/common';",
                "import {",
                "  ContentInner,",
                "  useForm,",
                "} from '@wingui/common/imports';",
                "const { t: transLangKey } = useTranslation();",
                "function Foo() { const { control } = useForm(); return transLangKey('X') + baseURI(); }");

        JsxArtifactRewriter.RewriteResult result = rewriter.rewriteImports(jsx);

        assertThat(result.changed).isTrue();
        assertThat(result.content).doesNotContain("react-i18next");
        assertThat(result.content).doesNotContain("useTranslation");
        assertThat(result.content).doesNotContain("import { baseURI }");
        assertThat(result.content).contains("import { transLangKey } from '@zionex/wingui-core';");
        assertThat(result.content).contains("import { useForm } from 'react-hook-form';");
        // 사용처 전부 보존
        assertThat(result.content).contains("transLangKey('X')");
        assertThat(result.content).contains("baseURI()");
        assertThat(result.content).contains("useForm()");
        assertThat(result.content).contains("ContentInner");
    }

    @Test
    void leavesCleanJsxUnchanged() {
        // 안티패턴 없는 정상 JSX → no-op (PLANNEL 등 비-wingui 안전성)
        String jsx = String.join("\n",
                "import { useForm } from 'react-hook-form';",
                "import { transLangKey } from '@zionex/wingui-core';",
                "import { ContentInner, BaseGrid } from '@wingui/common/imports';",
                "function Foo() { const { control } = useForm(); return transLangKey('X') + baseURI(); }");

        JsxArtifactRewriter.RewriteResult result = rewriter.rewriteImports(jsx);

        assertThat(result.changed).isFalse();
        assertThat(result.content).isEqualTo(jsx);
    }
}
