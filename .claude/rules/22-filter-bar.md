---
description: FilterBar(조회 조건 영역) Block 을 정의·생성·수정할 때 반드시 참조. `.claude/schemas/filter-bar.schema.json` 을 단일 진실 저장소(single source of truth)로 삼는다.
globs:
  - "**/filter/**/*.json"
  - "**/filters/**/*.json"
  - "**/*filter*.json"
  - "**/*-filter.*.json"
  - "packages/wingui/src/view/**/*Filter*.jsx"
  - "packages/wingui/src/view/**/SearchArea*.jsx"
alwaysApply: false
---

# 22. FilterBar Block 규칙 (Filter/Search Area)

> T3Composer / ScreenSpec 체계에서 **조회 조건 영역(FilterBar)** 을 정의할 때의 **단일 기준**. 모든 FilterBar JSON 은 이 규칙에 따라 작성되고, 정적 검증을 통과해야 한다.

## 1. 골든 룰

### 1.1 스키마 권위

- **단일 진실 저장소**: `.claude/schemas/filter-bar.schema.json`
- 이 스키마에 정의되지 않은 속성을 임의로 추가하지 말 것
- 의심되면 스키마부터 확인 (`view .claude/schemas/filter-bar.schema.json`)
- 스키마 변경 필요 시 별도 PR 로 먼저 수정 → 파급 효과 검토 후 FilterBar 작성

### 1.2 Few-shot 참조

FilterBar 를 **새로 생성** 할 때는 반드시 아래 두 샘플 중 유사한 것부터 **복사해서 수정**하는 방식으로 시작한다. 맨땅에서 작성 금지.

- `.claude/schemas/examples/sample-dp-monthly.json` — 복잡 사례 (PlanScope · DateRange · 의존성 · 상호검증)
- `.claude/schemas/examples/sample-common-code.json` — 단순 사례 (TEXT · AUTOCOMPLETE · POPUP)

### 1.3 네이밍 규약 (스키마가 강제)

| 대상 | 규약 | 예 |
|---|---|---|
| `block_id` | `^[a-z][a-z0-9_]*$` (snake_case) | `filter_main`, `filter_dp_monthly` |
| `field_id` | `^[A-Z][A-Z0-9_]*$` (UPPER_SNAKE) | `PLAN_SCOPE`, `ITEM_CD` |
| `output_variable.name` | `^[a-z][a-zA-Z0-9]*$` (camelCase) | `planScope`, `itemCd` |
| `rule_id` | `^[a-z][a-z0-9_]*$` | `large_range_warning` |

**이유**: field_id 는 DB 컬럼·SP 파라미터 관례(대문자), output_variable 은 JS 관례(camel)에 맞춤. 섞이면 곤란하므로 스키마가 원천 차단.

## 2. 필드 타입 선택 가이드

### 기본 타입 (9종)

| 상황 | 쓸 타입 |
|---|---|
| 코드·키워드 입력 | `TEXT` |
| 수치 입력 (최소·최대 등) | `NUMBER` |
| 단일 일자 (기준일 등) | `DATE` with `granularity: day/month/year` |
| 기간 (시작~종료) | `DATE_RANGE` with `granularity`, **`flatten` 필수** |
| 공통코드·소량 옵션 | `DROPDOWN` with `common_code` |
| 두세 개 중 하나 (단위·모드 전환) | `RADIO` with `button_style: segmented` |
| 단일 boolean (포함/제외) | `CHECKBOX` mode=single |
| 여러 코드 선택 (상태·카테고리) | `CHECKBOX` mode=multi |
| 큰 마스터에서 하나 고르기 | `POPUP` |
| 타이핑하며 찾기 (서버 검색) | `AUTOCOMPLETE` |

### 도메인 타입 (9종) — 가장 먼저 검토

**T3Series SCM 도메인 필드는 반드시 도메인 타입 사용**. `DROPDOWN` 으로 직접 구현 금지.

| 도메인 | 쓸 타입 |
|---|---|
| 플랜 스코프 (PlanScope + Version) | `DOMAIN_PLAN_SCOPE` |
| 품목 단건 | `DOMAIN_ITEM_SINGLE` |
| 품목 복수 | `DOMAIN_ITEM_MULTI` |
| 거래처 단건 | `DOMAIN_ACCOUNT_SINGLE` |
| 거래처 복수 | `DOMAIN_ACCOUNT_MULTI` |
| 거점 복수 | `DOMAIN_LOCATION_MULTI` |
| 자원 복수 | `DOMAIN_RESOURCE_MULTI` |
| 사용자 | `DOMAIN_USER` |
| 시뮬레이션 버전 | `DOMAIN_VERSION` |

## 3. output_variable — 설계 규칙

모든 필드의 `output_variable` 은 **다른 블록(Grid/Chart/KPI)이 참조할 인터페이스 계약** 이다.

### 3.1 기본 규칙

- `null_when_empty: true` 를 **기본값** 으로 쓴다 (SP 의 `IS NULL OR ...` 패턴 호환)
- 문자열 필드는 `trim: true` 유지 (공백 오염 방지)
- `data_type` 은 실제 SP 가 받는 타입과 일치해야 함 (숫자 필드를 string 으로 받지 말 것)

### 3.2 flatten — 필수 상황

아래 경우엔 **반드시 `flatten.enabled: true`**:

- `DATE_RANGE` → `flatten.from_name`, `flatten.to_name` 으로 `dateFrom`/`dateTo` 분해
- `DOMAIN_PLAN_SCOPE` → `flatten.enabled: true` 로 `planCd`/`mainVerCd`/`simulVerCd` 분해
- `DOMAIN_VERSION` → 동일

**이유**: SP 는 스칼라 파라미터를 여러 개 받는 게 관례. 객체 그대로 넘기면 각 화면마다 풀어쓰는 코드 중복.

### 3.3 배열 타입 — delimiter_for_sp

`data_type: array` 필드는 **반드시** `delimiter_for_sp: ","` 명시 → `FN_SPLIT_NVARCHAR_TO_TABLE` 호환:

```json
{
  "output_variable": {
    "name": "itemGrps",
    "data_type": "array",
    "element_type": "string",
    "delimiter_for_sp": ","
  }
}
```

### 3.4 "전체" 처리 — transform_when_all

`include_all.enabled: true` 인 DROPDOWN/RADIO 는 반드시 `transform_when_all` 명시:

- **`send_null`** (기본 · 권장): SP 쪽에서 `WHERE (@USE_YN IS NULL OR USE_YN = @USE_YN)` 패턴
- `send_all`: "ALL" 문자열 그대로 보냄 (SP 쪽 처리 필요)
- `send_empty_array`: 배열 타입 전용
- `keep_as_is`: 그대로 전달

## 4. 다른 블록에서 참조하는 방법

FilterBar 의 값은 `@form.<form_id>.<output_variable.name>` 으로 참조한다:

```json
{
  "block_id": "grid_main",
  "data_source": {
    "type": "sp",
    "binding": { "service_id": "SP_UI_DP_MONTHLY_Q1" },
    "params": {
      "PLAN_CD":     "@form.filter_dp_monthly.planCd",
      "VERSION_CD":  "@form.filter_dp_monthly.mainVerCd",
      "DATE_FROM":   "@form.filter_dp_monthly.planPeriodFrom",
      "DATE_TO":     "@form.filter_dp_monthly.planPeriodTo",
      "ITEM_GRPS":   "@form.filter_dp_monthly.itemGrps"
    },
    "refresh": {
      "on_event": ["on_filter_submit"]
    }
  }
}
```

**정확한 변수명은 `flatten` 설정에 따라 달라진다**: 객체가 아니라 펼쳐진 스칼라 이름을 써야 함.

## 5. 옵션 공급원 (options_source) 선택 기준

| 상황 | `type` | 비고 |
|---|---|---|
| Y/N, 단위 코드 등 | `common_code` | `TB_AD_COMN_CODE` · `cache.ttl_seconds: 3600` |
| 라디오 같은 소량 고정값 | `inline` | 스키마 안에 직접 |
| 상위 필드에 의존하는 동적 옵션 | `sp` | `params` 로 상위 값 전달 + dependency 규칙 필수 |
| KPI 선택 | `kpi_dictionary` | `TB_AD_KPI_DICT` |
| 업무 엔티티 선택 | `ontology_entity` | `status: CONFIRMED` 고정 |

### 5.1 SP 옵션 소스의 caching

공통 검색 SP (`SP_COMM_SRH_*`) 는 대부분 30분~1시간 캐시 가능:
```json
"cache": { "enabled": true, "ttl_seconds": 1800 }
```

품목·거래처처럼 변동 잦은 마스터는 **캐시 off** 또는 5분 이내.

## 6. 의존성 (dependencies) 작성 패턴

### 6.1 계층 드롭다운 (대분류 → 중분류)

```json
{
  "dependencies": [
    {
      "when_field": "ITEM_TYPE",
      "when_event": "value_changed",
      "affect_field": "ITEM_GRP",
      "action": "reload_options",
      "pass_params": { "PARENT_TYPE": "@this_field.value" },
      "also_clear": true,
      "also_clear_if_no_match": true
    }
  ]
}
```

### 6.2 PlanScope 변경 시 연관 필드 초기화

```json
{
  "when_field": "PLAN_SCOPE",
  "when_event": "value_changed",
  "affect_field": "ITEM",
  "action": "clear_value"
}
```

### 6.3 조건부 노출

```json
{
  "when_field": "VIEW_MODE",
  "when_event": "value_changed",
  "affect_field": "DETAIL_OPTION",
  "action": "set_visibility",
  "condition": "@this_field.value === 'DETAIL'"
}
```

## 7. 검증 (validation) 전략

### 7.1 필드 자체

- `required: true` 는 **실제 SP 가 null 을 허용하지 않는 파라미터** 에만 부여
- `regex` 는 `TEXT` 에만 (NUMBER 는 `min`/`max` 사용)
- 도메인 타입은 별도 검증 불필요 (내부 컴포넌트가 처리)

### 7.2 상호 검증 (cross_field_rules)

| 상황 | severity |
|---|---|
| 날짜 순서 (from > to) | `error` |
| 둘 다 있거나 둘 다 없거나 | `error` |
| 기간이 너무 김 (3개월 초과 등) | `warning` (사용자 확인 후 제출 허용) |
| 미래 기간 + 시뮬레이션 버전 없음 | `error` |

### 7.3 표현식 가능 컨텍스트

`expression` 필드에서 접근 가능한 것들:

- `form.<var_name>` — 다른 필드의 현재 값
- `session.*` — 로그인 사용자
- `global.*` — 전역 상태
- `@now` — 현재 시각
- 헬퍼 함수: `days_between`, `months_between`, `is_business_day`

## 8. FilterBar 작성 워크플로 (반드시 이 순서)

```
1. 샘플 선택 (.claude/schemas/examples/ 에서 유사 사례 복사)
      ↓
2. block_id 설정 (snake_case)
      ↓
3. bar 옵션 설정 (layout, 버튼 라벨)
      ↓
4. fields 작성
   ├─ 도메인 타입이 있는가? → 우선 DOMAIN_* 사용
   ├─ 각 필드의 output_variable 정의
   ├─ flatten / delimiter_for_sp / transform_when_all 검토
   └─ 기본값 (default_value_expression) 지정
      ↓
5. dependencies 작성 (필드 간 연쇄)
      ↓
6. cross_field_rules 작성 (상호 검증)
      ↓
7. output.form_id 정의 (다른 블록이 참조할 키)
      ↓
8. 스키마 검증 (JSON Schema validation)
      ↓
9. 참조 블록의 params 매핑 작성 (@form.<form_id>.<name>)
```

## 9. 체크리스트 (작성 완료 전)

- [ ] `block_type: "FILTER_BAR"` 정확히 입력됨
- [ ] `block_id` 가 snake_case
- [ ] 모든 `field_id` 가 UPPER_SNAKE_CASE
- [ ] 모든 `output_variable.name` 이 camelCase
- [ ] SCM 도메인은 `DOMAIN_*` 타입 사용 (일반 DROPDOWN 남용 X)
- [ ] `DATE_RANGE` 에 `flatten` 명시
- [ ] `DOMAIN_PLAN_SCOPE` 에 `flatten.enabled: true`
- [ ] `data_type: array` 에 `delimiter_for_sp: ","`
- [ ] `include_all.enabled: true` 면 `transform_when_all: "send_null"`
- [ ] `options_source.type: common_code` 에 `group_cd` 지정
- [ ] `options_source.type: sp` 에 `service_id` 가 `SP_` 접두어
- [ ] 계층 드롭다운에 `dependencies` 정의
- [ ] `output.form_id` 유니크하게 지정
- [ ] `emit_event` 가 `on_filter_submit` (관례)
- [ ] 모든 `label` 에 i18n 키 대응 (`label_i18n_key`)
- [ ] 다국어 키를 `TB_AD_LANG_PACK` 에 등록

## 10. Anti-patterns (금지)

| ❌ | ✅ |
|---|---|
| 스키마에 없는 속성 임의 추가 | 스키마 수정 PR 먼저 |
| `DROPDOWN` 으로 PlanScope 흉내 | `DOMAIN_PLAN_SCOPE` 사용 |
| `DATE_RANGE` 에 flatten 없이 SP 호출 | `flatten.from_name` + `flatten.to_name` |
| 배열을 그대로 SP 에 넘김 | `delimiter_for_sp` 로 문자열 변환 |
| 빈 문자열을 SP 로 전송 | `null_when_empty: true` |
| 전체 선택을 "ALL" 문자열로 전달 | `transform_when_all: "send_null"` |
| 계층 드롭다운에 dependency 없이 옵션 정적 고정 | `reload_options` + `pass_params` |
| 한글 라벨 하드코딩 | `label_i18n_key` + `TB_AD_LANG_PACK` |
| 매 렌더마다 SP 재호출 (캐시 off) | 안정 옵션은 `cache.ttl_seconds: 1800` |
| 여러 화면에 같은 FilterBar 복붙 | 공통 FilterBar 는 `view/common/filters/` 에 템플릿화 |

## 11. 편집기·런타임과의 연동

- **편집기** (`@rjsf/mui`): 이 스키마를 그대로 prop 으로 받아 속성 편집 UI 자동 생성
- **런타임** (`FilterBarRuntime.jsx`): 이 스키마 따르는 JSON 을 입력으로 받아 React 트리 생성
- **검증**:
  - 프런트: `ajv` 로 저장 전 체크
  - 백엔드: `networknt/json-schema-validator` (Java) 로 API 진입점 체크
- **CI**: 모든 `*.filter.json` 파일을 이 스키마로 자동 검증 (pre-commit hook 권장)

## 12. 샘플 참조 경로

```
.claude/schemas/
├── filter-bar.schema.json               (권위)
└── examples/
    ├── sample-dp-monthly.json           (복잡: 도메인·기간·의존성)
    └── sample-common-code.json          (단순: TEXT·AUTOCOMPLETE·POPUP)
```

사람용 상세 가이드: `docs/reference/schemas/FILTER-BAR-README.md`
