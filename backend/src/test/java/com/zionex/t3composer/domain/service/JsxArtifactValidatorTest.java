package com.zionex.t3composer.domain.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

class JsxArtifactValidatorTest {

    private final JsxArtifactValidator validator = new JsxArtifactValidator();

    @Test
    void flagsPerFieldOptionEndpoint() {
        String jsx = String.join("\n",
                "function Foo() {",
                "  useEffect(() => {",
                "    zAxios.get('setting/testscreen/options/testcode')",
                "      .then((res) => setTestCodeOptions(res.data));",
                "  }, []);",
                "}");

        List<String> violations = validator.validate(jsx);

        assertThat(violations).isNotEmpty();
        assertThat(violations.toString()).contains("options/");
        // 메시지는 실행 가능 — loadCombos / common/data 표준을 가리켜야 LLM 이 고친다
        assertThat(violations.toString()).contains("loadCombos");
    }

    @Test
    void passesStandardLoadCombos() {
        // 표준 콤보 로딩 (common/data + PROCEDURE_NAME) — 위반 없음
        String jsx = String.join("\n",
                "const loadCombos = async () => {",
                "  const res = await zAxios({ method: 'post', url: baseURI() + 'common/data',",
                "    data: { PROCEDURE_NAME: 'SP_UI_MP_LX_3020_VER_LIST' } });",
                "  setVersionOptions(res.data.map((r) => ({ value: r.VER_ID, label: r.VER_ID })));",
                "};");

        List<String> violations = validator.validate(jsx);

        assertThat(violations).isEmpty();
    }

    @Test
    void doesNotFlagNormalQueryOrCommonCodeGets() {
        // 정상 조회·공통코드 fetch 는 options/ 패턴이 아니므로 오탐 금지
        String jsx = String.join("\n",
                "zAxios.get('demandplan/dplx1050/q1', { params });",
                "zAxios.get('/system/common/codes', { params: { 'group-cd': 'USE_YN' } });");

        List<String> violations = validator.validate(jsx);

        assertThat(violations).isEmpty();
    }
}
