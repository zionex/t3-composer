# T3Series FilterBar JSON Schema

> T3Composer / ScreenSpec 체계에서 **FilterBar(조회 조건 영역)** Block 을 정의하는 표준 JSON Schema.

## 개요

이 스키마는 모든 화면의 조회 조건 영역을 선언적으로 정의할 수 있게 해줍니다. 한 번 이 스펙을 따라 JSON 을 작성하면:

- `@rjsf/mui` 로 **편집기 UI 자동 생성**
- 런타임 렌더러가 **실제 React 컴포넌트로 변환**
- 유효성 검증 · 필드 의존성 · 상호 검증 · 출력 변수 매핑이 **일관되게 동작**
- 다국어(`i18n`) 키 · 권한(`permission`) · 온톨로지 연계가 **자동 처리**

## 파일 구성

| 파일 | 용도 |
|---|---|
| `filter-bar.schema.json` | 메인 스키마 (JSON Schema Draft 2020-12) |
| `sample-dp-monthly.json` | DP 월별 계획 조회 샘플 (PlanScope · 기간 · 복수 DROPDOWN 등 7개 필드) |
| `sample-common-code.json` | 공통코드 마스터 조회 샘플 (TEXT · AUTOCOMPLETE · POPUP · NUMBER · 멀티 CHECKBOX 6개) |
| `README.md` | 이 문서 |

## 지원 필드 타입 (19개)

### 기본 입력
| 타입 | 용도 |
|---|---|
| `TEXT` | 텍스트 입력. single_line · multi_line · password 모드 |
| `NUMBER` | 숫자. 포맷·단위·범위·스피너 |
| `DATE` | 단일 일자. granularity: day · week · month · quarter · year |
| `DATE_RANGE` | 일자 기간. 프리셋 · max_range 제한 |
| `DROPDOWN` | 단일/복수 선택. 전체 옵션 자동 삽입 |
| `RADIO` | 라디오 버튼. segmented/tabs/chips 스타일 |
| `CHECKBOX` | 단일 boolean / 복수 선택 |
| `POPUP` | 팝업 검색 선택 |
| `AUTOCOMPLETE` | 자동완성 |
| `HIDDEN` | 숨김 필드 (고정값 주입용) |

### SCM 도메인 특화
| 타입 | 대응 컴포넌트 |
|---|---|
| `DOMAIN_PLAN_SCOPE` | `PlanScope` |
| `DOMAIN_ITEM_SINGLE` / `DOMAIN_ITEM_MULTI` | `ItemSearchInput` / `ItemMultiSearchBox` |
| `DOMAIN_ACCOUNT_SINGLE` / `DOMAIN_ACCOUNT_MULTI` | `AccountSearchInput` / `PopAccountMulti` |
| `DOMAIN_LOCATION_MULTI` | `LocationMultiSearchBox` |
| `DOMAIN_RESOURCE_MULTI` | `ResourceMultiSearchBox` |
| `DOMAIN_USER` | `UserInputField` |
| `DOMAIN_VERSION` | `PopSimulationVersion` |

## 핵심 개념

### 1. output_variable — 변수 전달의 표준

모든 필드는 자기 값을 다른 블록(Grid · Chart 등)에 전달하기 위한 `output_variable` 을 **필수** 로 갖습니다:

```json
{
  "field_id": "ITEM_CD",
  "output_variable": {
    "name": "itemCd",
    "data_type": "string",
    "null_when_empty": true
  }
}
```

다른 블록은 이렇게 참조합니다:
```json
{
  "params": { "ITEM_CD": "@form.filter_main.itemCd" }
}
```

### 2. flatten — 객체를 스칼라로 펼치기

`DATE_RANGE` · `PLAN_SCOPE` 처럼 객체 값이 나오는 필드는 SP 호출 편의를 위해 자동 펼침을 지원합니다:

```json
{
  "output_variable": {
    "name": "planPeriod",
    "data_type": "object",
    "flatten": {
      "enabled": true,
      "from_name": "planPeriodFrom",
      "to_name":   "planPeriodTo"
    }
  }
}
```

→ SP 호출 시 자동으로 `planPeriodFrom`, `planPeriodTo` 두 스칼라로 분해됩니다.

### 3. 표현식 네임스페이스

기본값 · 의존성 · 검증 · 파라미터 매핑에서 쓸 수 있는 표현식:

| 접두어 | 출처 | 예 |
|---|---|---|
| `@form.*` | 현재 폼의 다른 필드 값 | `@form.itemType` |
| `@session.*` | 로그인 세션 | `@session.user.id` |
| `@global.*` | 전역 상태 | `@global.planCd` |
| `@now` / `@now-30d` / `@now.month_start` | 시간 표현 | `@now-12m` |
| `@this_field.value` | 트리거 필드 자신의 값 (dependency) | |
| `@selected.<col>` | POPUP/AUTOCOMPLETE 선택 행 | `@selected.ACCT_NM` |

### 4. options_source — 옵션 공급원 6가지

| `type` | 설명 |
|---|---|
| `common_code` | `TB_AD_COMN_CODE` 공통코드 |
| `inline` | 정적 값 배열 |
| `sp` | `SP_*` 호출 결과 |
| `kpi_dictionary` | `TB_AD_KPI_DICT` |
| `ontology_entity` | 온톨로지 엔티티 |
| `api` | 임의 REST 엔드포인트 |

### 5. 의존성 (dependencies)

"ITEM_TYPE 변경 → ITEM_GRP 재조회" 같은 연쇄 규칙:

```json
{
  "dependencies": [
    {
      "when_field": "ITEM_TYPE",
      "when_event": "value_changed",
      "affect_field": "ITEM_GRP",
      "action": "reload_options",
      "pass_params": { "PARENT_TYPE": "@this_field.value" },
      "also_clear": true
    }
  ]
}
```

### 6. 상호 검증 (cross_field_rules)

```json
{
  "validation": {
    "cross_field_rules": [
      {
        "rule_id": "large_range_warning",
        "expression": "months_between(form.planPeriodFrom, form.planPeriodTo) <= 12",
        "message_key": "validation.range.over_12_months",
        "severity": "warning"
      }
    ]
  }
}
```

`severity: "warning"` 은 경고창으로 확인받고 제출 허용, `"error"` 는 제출 차단.

## 검증 방법

### Python (jsonschema)
```bash
pip install jsonschema
```

```python
import json
from jsonschema import Draft202012Validator

with open('filter-bar.schema.json') as f:
    schema = json.load(f)
with open('my-filter.json') as f:
    data = json.load(f)

errors = list(Draft202012Validator(schema).iter_errors(data))
if errors:
    for e in errors:
        print(f"[{'.'.join(str(p) for p in e.absolute_path)}] {e.message}")
else:
    print("✅ 통과")
```

### Node.js (ajv)
```bash
npm install ajv ajv-formats
```

```js
const Ajv = require('ajv/dist/2020');
const addFormats = require('ajv-formats');

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const schema = require('./filter-bar.schema.json');
const data   = require('./my-filter.json');

const validate = ajv.compile(schema);
if (!validate(data)) {
  console.log(validate.errors);
} else {
  console.log('✅ 통과');
}
```

## 네이밍 규약 (스키마가 강제)

| 대상 | 규약 | 예 |
|---|---|---|
| `block_id` | `^[a-z][a-z0-9_]*$` | `filter_dp_monthly` |
| `field_id` | `^[A-Z][A-Z0-9_]*$` | `PLAN_SCOPE`, `ITEM_CD` |
| `output_variable.name` | `^[a-z][a-zA-Z0-9]*$` | `planScope`, `itemCd` |
| `rule_id` | `^[a-z][a-z0-9_]*$` | `large_range_warning` |

이유: field_id 는 DB 컬럼/SP 파라미터 네이밍과 맞추고(UPPER_SNAKE_CASE), output_variable 은 JS 관례(camelCase)를 따름. 스키마 위반 시 즉시 차단됩니다.

## 다음 단계

- **B. FilterBarRuntime.jsx** — JSON 을 받아 실제 React 트리를 생성하는 런타임 컴포넌트
- **C. FilterBarEditor** — `@rjsf/mui` 기반 속성 편집 UI
- **D. 기존 T3Series 화면 역변환** — 현재 `UserMgmt`, `CommonCode` 등의 JSX 에서 FilterBar 를 JSON 으로 추출하는 도구
