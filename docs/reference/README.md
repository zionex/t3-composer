# T3Series Reference 인덱스

> 이 디렉토리(`docs/reference/`)는 Claude Code 작업 시 참조하는 **보조 자산**을 모아둔 곳입니다. 두 계층으로 나뉩니다:
>
> - **카탈로그**: 프로젝트의 기존 구조(테이블·뷰·SP·모듈)를 기록. Claude 가 필요 시 `grep` 으로 선별 조회.
> - **스키마**: 신규 산출물(FilterBar 등)을 생성할 때 따를 JSON Schema 표준. `.claude/schemas/` 의 사용 가이드.

## 목차

- [Part 1 · 대용량 카탈로그](#part-1--대용량-카탈로그)
  - [파일 구성](#파일-구성)
  - [Claude 활용 규칙](#claude-활용-규칙)
  - [데이터 스냅샷 기준](#데이터-스냅샷-기준)
- [Part 2 · JSON Schema 가이드](#part-2--json-schema-가이드)
  - [스키마 위치와 디렉토리 구조](#스키마-위치와-디렉토리-구조)
  - [FilterBar 스키마](#filterbar-스키마)
- [Part 3 · 디렉토리 전체 지도](#part-3--디렉토리-전체-지도)

---

# Part 1 · 대용량 카탈로그

674개 테이블, 965개 SP, 18개 뷰, 9개 모듈에 대한 카탈로그. **항상 컨텍스트에 주입하기에는 양이 많아** Claude 가 필요 시 `grep` 으로 선별 조회하도록 설계되었습니다.

## 파일 구성

| 파일 | 크기 | 내용 | 조회 예시 |
|---|---|---|---|
| `tables-catalog.md` | ~24KB | 674개 테이블 전체 카탈로그 (접두어별 그룹핑) | `grep -i "재고" tables-catalog.md` |
| `views-catalog.md` | ~12KB | 18개 View 상세 스펙 (소스 테이블·조인 조건·특이점) | `grep -A 20 "VW_INVENTORY_PLAN_CONFIRMED" views-catalog.md` |
| `sp-catalog.md` | ~15KB | 965개 SP/Function 카탈로그 (네이밍·도메인별·공통 유틸) | `grep "SP_UI_MP_06" sp-catalog.md` |
| `tech-stack-overview.md` | ~14KB | 프로젝트 전체 기술 스택 (BOM·버전·모듈 매트릭스) | `grep -B 2 -A 5 "Kafka" tech-stack-overview.md` |
| `module-wingui.md` | ~15KB | wingui 모듈 상세 (Spring Boot + React 18) | |
| `module-common.md` | ~5KB | common 공통 라이브러리 | |
| `module-database.md` | ~5KB | database SQL 저장소 구조 (upgrade 방식) | |
| `module-dpserver.md` | ~3KB | DP 백엔드 (최소 구성) | |
| `module-mpserver.md` | ~3KB | MP 백엔드 | |
| `module-fpserver.md` | ~4KB | FP 백엔드 + ActiveMQ | |
| `module-fp.md` | ~5KB | FP Swing 데스크톱 | |
| `module-mp.md` | ~4KB | MP Swing 라이브러리 | |
| `module-bfserver.md` | ~6KB | bfserver (Python Flask ML) | |

## Claude 활용 규칙

1. **먼저 `.claude/rules/` 에서 규칙부터 확인**. 규칙이 답하지 못하는 경우 여기를 조회.
2. 테이블 의미는 **온톨로지 경유로 해석** (`rules/10-ontology-first.md`). 테이블명 역추측 금지.
3. SP 네이밍 충돌 검사: `grep "SP_UI_CM_" sp-catalog.md | sort | uniq` 등으로 기존 화면 번호 확인.
4. 새 View 를 만들기 전 `views-catalog.md` 에서 유사 뷰가 있는지 먼저 검색.
5. 대용량 파일은 `view` 도구의 `view_range` 로 특정 구간만 읽기 권장.

## 데이터 스냅샷 기준

- **Table DDL**: `T3Series_20260422_Table_DDL.sql`
- **View DDL**: `T3Series_20260422_View_DDL.sql` (40KB)
- **SP DDL**: `T3Series_20260422_SP_DDL.sql` (4.7MB)
- **MSSQL 스키마**: `T3SMARTSCM.dbo`
- **Oracle 스키마**: `T3SMARTSCM`

---

# Part 2 · JSON Schema 가이드

T3Composer / ScreenSpec 체계에서 **신규 산출물을 선언적으로 정의**할 때 따르는 JSON Schema 들의 사용 가이드. 스키마 본체는 `.claude/schemas/` 에 있고, 이 섹션은 각 스키마의 **개념·샘플·검증 방법·활용 패턴**을 설명합니다.

## 스키마 위치와 디렉토리 구조

```
프로젝트 루트
├── .claude/
│   ├── rules/
│   │   ├── 22-filter-bar.md         ← FilterBar 생성 규칙
│   │   └── (추후) 23-grid-base.md, 24-chart.md, ...
│   └── schemas/
│       ├── filter-bar.schema.json   ← 스키마 본체 (권위)
│       ├── (추후) grid-base.schema.json, chart.schema.json, ...
│       └── examples/
│           ├── sample-dp-monthly.json
│           ├── sample-common-code.json
│           └── (추후) 각 스키마별 few-shot 샘플들
└── docs/reference/schemas/
    ├── FILTER-BAR-README.md          ← 이 문서의 상세 버전
    └── (추후) GRID-BASE-README.md, CHART-README.md, ...
```

**역할 분리 원칙**:
- `.claude/rules/` = Claude 가 따를 **작성 규칙**
- `.claude/schemas/` = 컴퓨터가 검증하는 **JSON Schema 본체**
- `.claude/schemas/examples/` = Claude 가 few-shot 으로 참고하는 **정답 샘플**
- `docs/reference/schemas/` = 사람이 읽는 **상세 가이드 문서**

---

## FilterBar 스키마

T3Composer / ScreenSpec 체계에서 **FilterBar(조회 조건 영역)** Block 을 정의하는 표준 JSON Schema.

### 개요

이 스키마는 모든 화면의 조회 조건 영역을 선언적으로 정의할 수 있게 해줍니다. 한 번 이 스펙을 따라 JSON 을 작성하면:

- `@rjsf/mui` 로 **편집기 UI 자동 생성**
- 런타임 렌더러가 **실제 React 컴포넌트로 변환**
- 유효성 검증 · 필드 의존성 · 상호 검증 · 출력 변수 매핑이 **일관되게 동작**
- 다국어(`i18n`) 키 · 권한(`permission`) · 온톨로지 연계가 **자동 처리**

### 관련 파일

| 파일 | 위치 | 용도 |
|---|---|---|
| `filter-bar.schema.json` | `.claude/schemas/` | 메인 스키마 (JSON Schema Draft 2020-12) |
| `sample-dp-monthly.json` | `.claude/schemas/examples/` | DP 월별 계획 샘플 (PlanScope · 기간 · 복수 DROPDOWN 등 7개 필드) |
| `sample-common-code.json` | `.claude/schemas/examples/` | 공통코드 마스터 샘플 (TEXT · AUTOCOMPLETE · POPUP · NUMBER · 멀티 CHECKBOX 6개) |
| `22-filter-bar.md` | `.claude/rules/` | Claude 작성 규칙 |
| `FILTER-BAR-README.md` | `docs/reference/schemas/` | 확장 가이드 (이 섹션의 상세판) |

### 지원 필드 타입 (19종)

#### 기본 입력

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

#### SCM 도메인 특화

| 타입 | 대응 컴포넌트 |
|---|---|
| `DOMAIN_PLAN_SCOPE` | `PlanScope` |
| `DOMAIN_ITEM_SINGLE` / `DOMAIN_ITEM_MULTI` | `ItemSearchInput` / `ItemMultiSearchBox` |
| `DOMAIN_ACCOUNT_SINGLE` / `DOMAIN_ACCOUNT_MULTI` | `AccountSearchInput` / `PopAccountMulti` |
| `DOMAIN_LOCATION_MULTI` | `LocationMultiSearchBox` |
| `DOMAIN_RESOURCE_MULTI` | `ResourceMultiSearchBox` |
| `DOMAIN_USER` | `UserInputField` |
| `DOMAIN_VERSION` | `PopSimulationVersion` |

### 핵심 개념

#### 1. `output_variable` — 변수 전달의 표준

모든 필드는 자기 값을 다른 블록(Grid · Chart 등)에 전달하기 위한 `output_variable` 을 **필수**로 갖습니다:

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

#### 2. `flatten` — 객체를 스칼라로 펼치기

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

#### 3. 표현식 네임스페이스

기본값 · 의존성 · 검증 · 파라미터 매핑에서 쓸 수 있는 표현식:

| 접두어 | 출처 | 예 |
|---|---|---|
| `@form.*` | 현재 폼의 다른 필드 값 | `@form.itemType` |
| `@session.*` | 로그인 세션 | `@session.user.id` |
| `@global.*` | 전역 상태 | `@global.planCd` |
| `@now` / `@now-30d` / `@now.month_start` | 시간 표현 | `@now-12m` |
| `@this_field.value` | 트리거 필드 자신의 값 (dependency) | |
| `@selected.<col>` | POPUP/AUTOCOMPLETE 선택 행 | `@selected.ACCT_NM` |

#### 4. `options_source` — 옵션 공급원 6가지

| `type` | 설명 |
|---|---|
| `common_code` | `TB_AD_COMN_CODE` 공통코드 |
| `inline` | 정적 값 배열 |
| `sp` | `SP_*` 호출 결과 |
| `kpi_dictionary` | `TB_AD_KPI_DICT` |
| `ontology_entity` | 온톨로지 엔티티 |
| `api` | 임의 REST 엔드포인트 |

#### 5. 의존성 (`dependencies`)

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

#### 6. 상호 검증 (`cross_field_rules`)

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

### 검증 방법

#### Python (jsonschema)

```bash
pip install jsonschema
```

```python
import json
from jsonschema import Draft202012Validator

with open('.claude/schemas/filter-bar.schema.json') as f:
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

#### Node.js (ajv)

```bash
npm install ajv ajv-formats
```

```js
const Ajv = require('ajv/dist/2020');
const addFormats = require('ajv-formats');

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const schema = require('./.claude/schemas/filter-bar.schema.json');
const data   = require('./my-filter.json');

const validate = ajv.compile(schema);
if (!validate(data)) {
  console.log(validate.errors);
} else {
  console.log('✅ 통과');
}
```

### 네이밍 규약 (스키마가 강제)

| 대상 | 규약 | 예 |
|---|---|---|
| `block_id` | `^[a-z][a-z0-9_]*$` | `filter_dp_monthly` |
| `field_id` | `^[A-Z][A-Z0-9_]*$` | `PLAN_SCOPE`, `ITEM_CD` |
| `output_variable.name` | `^[a-z][a-zA-Z0-9]*$` | `planScope`, `itemCd` |
| `rule_id` | `^[a-z][a-z0-9_]*$` | `large_range_warning` |

**이유**: `field_id` 는 DB 컬럼·SP 파라미터 네이밍과 맞추고(UPPER_SNAKE_CASE), `output_variable.name` 은 JS 관례(camelCase)를 따름. 스키마 위반 시 즉시 차단됩니다.

### 다음 단계 (미구현)

- **B. `FilterBarRuntime.jsx`** — JSON 을 받아 실제 React 트리를 생성하는 런타임 컴포넌트
- **C. `FilterBarEditor`** — `@rjsf/mui` 기반 속성 편집 UI
- **D. 기존 T3Series 화면 역변환** — 현재 `UserMgmt`, `CommonCode` 등의 JSX 에서 FilterBar 를 JSON 으로 추출하는 도구

---

## (추후 추가될 스키마 자리)

이 섹션에 `GRID_BASE` · `CHART_LINE` · `KPI_CARD` 등 다른 Block 스키마가 추가될 때마다 같은 형식으로 붙여 나갑니다.

---

# Part 3 · 디렉토리 전체 지도

본 `docs/reference/` 디렉토리의 전체 구조 및 관련 디렉토리와의 관계:

```
프로젝트 루트
│
├── CLAUDE.md                              ← 매 프롬프트 자동 주입 (헌법)
│
├── .claude/                               ← Claude Code 운영 디렉토리
│   ├── settings.json
│   ├── rules/                             ← 작성 규칙 (Claude 가 따름)
│   │   ├── 10-ontology-first.md
│   │   ├── 20-screen-development.md
│   │   ├── 21-components.md
│   │   ├── 22-filter-bar.md               ★ FilterBar 규칙
│   │   ├── 30-database-schema.md
│   │   ├── 31-stored-procedures.md
│   │   └── 99-anti-patterns.md
│   ├── hooks/                             ← 자동 검증·주입 스크립트
│   └── schemas/                           ← JSON Schema 본체
│       ├── filter-bar.schema.json         ★ 스키마 권위
│       └── examples/                      ← few-shot 샘플
│           ├── sample-dp-monthly.json
│           └── sample-common-code.json
│
└── docs/
    └── reference/                         ← 본 디렉토리 (사람용 가이드)
        ├── README.md                      ← 이 파일
        ├── tables-catalog.md              ┐
        ├── views-catalog.md               ├ Part 1 카탈로그
        ├── sp-catalog.md                  │
        ├── tech-stack-overview.md         │
        ├── module-*.md (9개 모듈)         ┘
        └── schemas/
            └── FILTER-BAR-README.md       ← Part 2 스키마 상세판
```

**자산군별 배치 원칙**:

| 자산 성격 | 배치 위치 | 접근 주체 |
|---|---|---|
| Claude 가 매번 참조할 **작성 규칙** | `.claude/rules/` | Claude (자동) |
| 컴퓨터가 검증하는 **JSON Schema** | `.claude/schemas/` | Ajv · jsonschema (자동) |
| Claude 가 few-shot 참조할 **정답 샘플** | `.claude/schemas/examples/` | Claude (필요 시) |
| 사람이 읽는 **대용량 카탈로그** | `docs/reference/*.md` | 개발자 + Claude (grep) |
| 사람이 읽는 **스키마 상세 가이드** | `docs/reference/schemas/*.md` | 개발자 |

---

**최종 업데이트**: 2026-04-23
**T3Series 버전**: 26.0.0-SNAPSHOT
