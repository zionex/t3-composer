package com.zionex.t3composer.domain.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class JsxConformanceScorerTest {

    private final JsxConformanceScorer scorer = new JsxConformanceScorer(new JsxArtifactValidator());

    @Test
    void detectsAllFourAntiPatternsInRawOutput() {
        // LLM raw 출력 (1a rewriter 적용 전) — 4개 안티패턴 동시
        String jsx = String.join("\n",
                "import { useTranslation } from 'react-i18next';",            // D1
                "import { baseURI } from '@wingui/utils/common';",            // D2
                "import {",
                "  ContentInner,",
                "  useForm,",                                                  // D3
                "} from '@wingui/common/imports';",
                "const { t: transLangKey } = useTranslation();",
                "function Foo() {",
                "  useEffect(() => {",
                "    zAxios.get('setting/testscreen/options/testcode');",      // D4
                "  }, []);",
                "}");

        JsxConformanceScorer.Report report = scorer.scoreContent(jsx);

        assertThat(report.violationCount).isEqualTo(4);
        assertThat(report.violatedCheckNames()).containsExactlyInAnyOrder(
                "react-i18next-translangkey", "baseuri-import", "useform-wingui-import", "combo-per-field-endpoint");
    }

    @Test
    void cleanLxmaStyleOutputScoresZeroViolations() {
        // 표준 lxma 스타일 — 위반 0
        String jsx = String.join("\n",
                "import { useForm } from 'react-hook-form';",
                "import { transLangKey } from '@zionex/wingui-core';",
                "import { ContentInner, BaseGrid } from '@wingui/common/imports';",
                "const loadCombos = async () => {",
                "  const res = await zAxios({ method: 'post', url: baseURI() + 'common/data',",
                "    data: { PROCEDURE_NAME: 'SP_UI_MP_LX_3020_VER_LIST' } });",
                "};");

        JsxConformanceScorer.Report report = scorer.scoreContent(jsx);

        assertThat(report.violationCount).isZero();
        assertThat(report.violatedCheckNames()).isEmpty();
    }

    @Test
    void aggregatesAcrossMultipleAssistantMessages() {
        // 여러 assistant 턴 — 턴마다 다른 위반. 세션 집계는 union + 총합.
        java.util.List<String> messages = java.util.List.of(
                "import { useTranslation } from 'react-i18next';",          // D1
                "import { baseURI } from '@wingui/utils/common';",          // D2
                "import { ContentInner } from '@wingui/common/imports';");   // 깨끗

        JsxConformanceScorer.SessionReport session = scorer.scoreMessages(messages);

        assertThat(session.messageCount).isEqualTo(3);
        assertThat(session.totalViolations).isEqualTo(2);
        assertThat(session.violatedChecks()).containsExactlyInAnyOrder(
                "react-i18next-translangkey", "baseuri-import");
    }
}
