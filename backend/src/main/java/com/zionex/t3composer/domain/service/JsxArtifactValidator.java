package com.zionex.t3composer.domain.service;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

import org.springframework.stereotype.Component;

/**
 * 산출물 JSX 의 비결정론 안티패턴을 감지한다 (1b — 정밀도 높은 것만 block).
 *
 * 1a(JsxArtifactRewriter)가 결정론적으로 *고치는* 반면, 여기서는 *고칠 수 없고 맥락 의존*인
 * 안티패턴을 감지만 한다. 위반은 apply 단계에서 success=false + 실행가능 메시지로 반환되어
 * 기존 자동보완 루프(§14)가 LLM 에게 재생성을 시킨다.
 *
 * 정밀도 원칙: 오탐(정상 화면 block)이 없도록 lxma 실측에 0건인 패턴만 추가한다.
 */
@Component
public class JsxArtifactValidator {

    // 콤보/옵션을 필드마다 커스텀 endpoint 로 흩뿌리는 안티패턴 (rules/45 §2 위반).
    //   lxma 실측 0건. 표준은 loadCombos() + baseURI()+'common/data' + PROCEDURE_NAME.
    private static final Pattern PER_FIELD_OPTION_ENDPOINT = Pattern.compile(
            "zAxios\\s*\\.\\s*get\\s*\\(\\s*['\"][^'\"]*options/[^'\"]+['\"]");

    public List<String> validate(String jsxContent) {
        List<String> violations = new ArrayList<>();
        if (jsxContent == null || jsxContent.isBlank()) {
            return violations;
        }

        if (PER_FIELD_OPTION_ENDPOINT.matcher(jsxContent).find()) {
            violations.add(
                    "콤보/옵션을 필드별 커스텀 endpoint(zAxios.get('.../options/...'))로 로드하고 있습니다. "
                    + "표준은 loadCombos() 한 함수에서 baseURI()+'common/data' + {PROCEDURE_NAME} 으로 일괄 로드한 뒤 "
                    + "{value,label} 매핑 → InputField options → 첫 값 setValue 입니다 (rules/45 §2). "
                    + "per-field /options/ endpoint 와 zAxios.get(커스텀URL) 을 loadCombos 표준으로 교체하세요.");
        }

        return violations;
    }
}
