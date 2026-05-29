# PlanNEL Rules — Rewrite to Match saas-plannel Source

날짜: 2026-05-29
관련:
- 직전 PR (merge `bbeb6eb`): Composer AI mockup synthesis
- 직전 작업: `tb_cmp_target_rule WHERE target_cd='PLANNEL'` hard-delete + re-import from `/workspace/plannel-claude` (현재 13 rules · use_yn='Y' · version=1 상태)

## 1. 배경 · 동기

Composer 가 target=PLANNEL 세션을 만들 때, SystemPromptComposer 는 `tb_cmp_target_rule WHERE target_cd='PLANNEL' AND use_yn='Y'` 의 모든 rule 본문을 priority 순으로 system prompt 에 주입한다. 그래서 PLANNEL 세션의 생성 품질은 이 13개 rule 의 콘텐츠가 saas-plannel 의 실제 코드 컨벤션을 얼마나 정확히 반영하느냐에 직접 좌우된다.

현재 `.claude-plannel/rules/` 의 13개 파일 중 7개는 wingui(T3SERIES) 본문과 byte-identical · 나머지 6개는 PlanNEL 전용 콘텐츠. 즉 화면 생성에 직격하는 영역(컴포넌트 · 백엔드 · DB) 은 여전히 wingui 컨벤션을 가르치고 있어, PLANNEL 세션이 wingui 문법을 생성한다. 사용자가 직접 확인.

본 작업은 saas-plannel 실제 소스를 분석해 **핵심 7개 rule 을 wingui 동등 수준 (5~10KB 본문, 실제 시그니처/import/anti-pattern 포함) 으로 재작성**하고, DB 에 재import 한다.

## 2. saas-plannel 스택 (현재 환경)

| 영역 | wingui (T3SERIES) | saas-plannel (PLANNEL) |
|---|---|---|
| Backend 패키지 | `com.zionex.t3series.web.*` | `t3series.saas.*` |
| Backend 진입점 | `T3ApplicationProperties` 등 | `T3SeriesSaasApplication` / `T3SeriesSaasApplicationProperties` |
| Build | Maven (pom.xml) | Maven (pom.xml) — 별도 child pom |
| Backend 위치 | `wingui/src/main/java/com/zionex/t3series/web/domain/<module>/<feature>/` | `saas-application/src/main/java/t3series/saas/...` (구조 확인 필요) |
| Frontend lib | React 18 + RealGrid2 + Zustand + Webpack | React 18 + **AG-Grid** + **@reduxjs/toolkit** + **react-pro-sidebar** + **i18next** + **craco (CRA)** |
| i18n | `transLangKey('KEY')` + `TB_AD_LANG_PACK` | `react-i18next` `useTranslation()` + `src/assets/data/l10n/translation.<locale>.json` (ko/en/ja/vi/zh) |
| Grid | RealGrid2 GridView/LocalDataProvider | **AG-Grid** (`@ag-grid-community/react`) + `ag-charts-react` |
| 검색폼 | wingui `<SearchArea>` + `<InputField>` + react-hook-form | MUI native + Redux state (확인 필요) |
| 메뉴 | DB `TB_AD_MENU` + `contentStore.activeViewId` 자동 라우팅 | **`src/pages/TabMenuList.js`** 정적 등록 (확인) |
| Router | wingui-core 내장 | `react-router-dom v6` |
| HTTP 클라이언트 | `zAxios` wrapper | `axios ~1.7.9` (보조 wrapper 확인 필요) |

→ Frontend 의 라이브러리 자체가 wingui 와 다르므로 21-components · 41-composer-generation · 20-screen-development · 99a 는 본질적으로 wingui 와 호환 불가.

## 3. Scope

### In scope (이번 spec)

**핵심 7개 rule 재작성** — 모두 `.claude-plannel/rules/` 의 동일 파일명 유지 (rule_code 보존):

| rule_code | 다루는 영역 | 추정 본문 크기 |
|---|---|---|
| `20-screen-development` | PlanNEL 화면 골격·파일 배치·등록 절차·라우팅 (`TabMenuList.js`) | ~6KB |
| `21-components` | AG-Grid · MUI · Redux Toolkit · i18next · 표준 검색폼/팝업/버튼 인벤토리 | ~10KB |
| `30-data-access` | axios 호출 표준·REST 컨벤션·Redux Toolkit `createAsyncThunk`/`createSlice` | ~7KB |
| `40-database-schema` | PlanNEL DB 접두어 사전·핵심 뷰·multi-tenancy 컬럼 규약 | ~6KB |
| `41-composer-generation` | NEW_GENERAL/NL Composer 흐름·산출물 파일 경로·MENU_CD·MENU_FILE_PATH 컨벤션 | ~8KB |
| `41b-composer-java` | Spring Boot Entity/Service/Controller — `t3series.saas.*` 패키지·import 화이트리스트 | ~7KB |
| `99a-composer-anti-patterns` | Composer 산출물 anti-patterns — wingui 패턴 사용 차단 | ~6KB |

각 rule 작성 시:
1. saas-plannel 소스 grep 으로 실제 패턴 채집 (실제 import / 클래스 시그니처 / 메서드 시그니처 / 디렉토리 구조)
2. 동일 영역의 wingui rule 파일을 구조 템플릿으로 사용 — 헤더 · 절 구성 패턴 유지
3. 모든 wingui-specific 시그니처 (예: `import { BaseGrid, SearchArea } from '@wingui/common/imports'`, `zAxios.get(...)`) 를 PlanNEL 등가물로 치환
4. PlanNEL 만의 패턴 (예: AG-Grid `cellRenderer`, `useTranslation()`) 은 추가 절로 작성
5. 본문 끝의 anti-pattern 표에 *"wingui 패턴 → 차단 사유 → PlanNEL 등가물"* 행 1개 이상

### Out of scope (이번 spec — 나중 phase)

- 나머지 6개 rule: `00-output-format-and-conversion` · `10-overview` · `31-multi-tenancy` · `32-security` · `50-ai-modules` · `99-anti-patterns`
- `.claude-plannel/hooks/` 정비
- `tb_cmp_target_system` 의 PLANNEL 메타 변경 (database_ref_path / source_ref_path 등)
- mockup gallery 의 PlanNEL 카드 콘텐츠 (별도 영역)
- saas-plannel 측 소스 수정 (우리는 *읽기 전용* 으로만 분석)

## 4. 작업 흐름 — 2 Phase

### Phase 1: Backend pack (3 rules)

대상: `41b-composer-java` · `30-data-access` · `40-database-schema`

작업 순서:
1. saas-plannel/saas-application/src/main/java 트리 분석 — 패키지 구조 · 대표 Entity/Service/Controller 한 쌍 pick
2. `saas-application/src/main/resources/*.yaml` · `*.xml` · `pom.xml` 분석 — DataSource 설정 · DB 접속 · Spring profile
3. 핵심 DDL/SQL 위치 추적 (Maven 빌드 산출물 또는 별도 SQL 폴더)
4. 위 3개 rule 본문 작성 — `.claude-plannel/rules/*.md` 교체
5. DB 갱신:
   ```sql
   DELETE FROM dbo.tb_cmp_target_rule
    WHERE target_cd='PLANNEL'
      AND rule_code IN ('41b-composer-java', '30-data-access', '40-database-schema');
   ```
   그 뒤 `POST /composer/targets/PLANNEL/import-claude` (전체 재import — 멱등)
6. 사용자가 새 PLANNEL 세션 1개 만들어서 검증 NL:
   > "고객 마스터 CRUD 화면을 만들어줘 — 고객 ID, 고객명, 사업자번호, 연락처, 주소"
   - 백엔드 산출물의 패키지가 `t3series.saas.*` 인가?
   - import 가 PlanNEL 컨벤션 (axios 직접 또는 wrapper · @ExecPermission 없음 · Entity 없거나 Map 사용) 따르는가?
   - SQL/DDL 이 PlanNEL DB 접두어/multi-tenancy 컬럼 규약 따르는가?
7. 검증 통과 → Phase 2 로

### Phase 2: Frontend pack (4 rules)

대상: `21-components` · `20-screen-development` · `41-composer-generation` · `99a-composer-anti-patterns`

작업 순서:
1. saas-plannel/saas-web/src 트리 분석 — 디렉토리 구조 · 라우팅 (`App.js`/`pages/`) · `TabMenuList.js` 패턴
2. 대표 페이지 한두 개 pick — AG-Grid + MUI + Redux 흐름 한 사이클 추출
3. `src/redux/` 분석 — `createSlice` · `createAsyncThunk` · `Provider` 셋업
4. `src/assets/data/l10n/translation.ko-kr.json` 형식 확인 — i18n key naming
5. 위 4개 rule 본문 작성 — `.claude-plannel/rules/*.md` 교체
6. DB 갱신 (Phase 1 과 동일 절차, rule_codes 변경)
7. 사용자가 같은 NL 로 새 PLANNEL 세션 만들어서 검증:
   - JSX 가 AG-Grid (`@ag-grid-community/react` 의 `AgGridReact`) 사용?
   - Redux Toolkit (`useSelector` · `useDispatch` · slice 호출) 사용?
   - i18next `useTranslation` 으로 다국어 처리?
   - `BaseGrid` · `SearchArea` · `transLangKey` · `useViewStore` 등 wingui 시그니처 등장 안 함?
   - 파일 경로가 saas-web/src/pages 또는 그에 준하는 구조?
8. 검증 통과 → 완료

## 5. 산출물 / 영향 범위

### 변경되는 것

- `.claude-plannel/rules/` 의 7개 .md 파일 교체 (git checkin 대상)
- `tb_cmp_target_rule WHERE target_cd='PLANNEL'` 의 7개 rule_code 항목 — content 갱신 + version 증가 (DB 데이터, git 비대상)
- `docs/superpowers/specs/2026-05-29-plannel-rules-rewrite-design.md` (본 문서)
- (작업 종료 후) `docs/superpowers/plans/2026-05-29-plannel-rules-rewrite.md`

### 영향 받지 않는 것

- T3SERIES rule 본문 (변경 없음)
- LGES_NEXTSCM rule 본문
- Hooks (`.claude-plannel/hooks/`)
- Composer 코드 (백엔드/프런트엔드)
- mockup 갤러리

## 6. Verification

자동 테스트 없음 (프로젝트 무 test runner). 검증은 phase 끝에 사용자가 브라우저에서:

1. http://localhost:5173 → Composer → 새 세션 (NEW_GENERAL/NL) · Target = PLANNEL
2. 위 §4 의 검증 NL 입력
3. 생성된 산출물 확인 — Phase 1 은 Java/SQL, Phase 2 는 JSX
4. 등장하면 안 되는 wingui 시그니처 grep (산출물 텍스트에서) — 0건이어야 함

체크리스트:

**Phase 1 (backend) 통과 기준:**
- [ ] Java import 라인에 `com.zionex.t3series.web.*` 등장 0건
- [ ] Java 클래스의 package 선언이 `t3series.saas.*` 로 시작
- [ ] `@ExecPermission` · `BaseEntity` (zionex 의) 등 wingui 어노테이션 등장 0건
- [ ] axios 호출 URL 이 PlanNEL 컨벤션 (확인된 prefix) 따름
- [ ] SQL DDL 이 PlanNEL DB 컨벤션 (테이블 접두어 · multi-tenancy 컬럼) 따름

**Phase 2 (frontend) 통과 기준:**
- [ ] JSX import 라인에 `@wingui/*` 또는 `@zionex/*` 등장 0건
- [ ] `BaseGrid` · `SearchArea` · `useViewStore` · `useContentStore` · `transLangKey` · `setViewInfo` 등장 0건
- [ ] AG-Grid (`AgGridReact`) 또는 MUI 의 `<DataGrid>` 등 PlanNEL 의 실제 grid 라이브러리 사용
- [ ] `useTranslation()` · `t('key')` 패턴 사용 (또는 `react-i18next` import)
- [ ] Redux Toolkit (`useSelector` · `useDispatch`) 사용

## 7. Risk · 가정

- **가정 1**: saas-plannel 의 직접 컴파일/실행은 안 함. 우리 환경은 `t3-composer` 만 docker-up. saas-plannel 은 *읽기 전용 분석 대상*. rule 의 정확성은 사용자의 시각 검증에 의존.
- **가정 2**: saas-plannel 디렉토리 구조와 컨벤션은 향후 6개월 단위로는 안정. 다음 phase (남은 6개 rule) 까지는 변동 없을 것으로 가정.
- **Risk**: saas-plannel 의 라이브러리(AG-Grid 등) 버전이 바뀌면 rule 의 시그니처 예시가 stale 됨. 본 spec 으로 만든 rule 본문에 *기준 버전* 을 명시(예: `@ag-grid-community/react ^30.2.1`) 하여 추적 가능하게.
- **Risk**: Phase 1 검증에서 백엔드 산출물이 wingui 컨벤션이 일부 남는다면 — backend rule pack 의 anti-pattern 표가 부족하다는 신호. 그 phase 안에서 anti-pattern 추가 작성 후 재import + 재검증.
- **Risk**: saas-plannel 의 Maven multi-module 구조에 따라 한 클래스가 여러 모듈에 걸쳐 있을 수 있음. rule 작성 시 대표 모듈만 다루고 나머지는 anti-pattern 으로 처리.

## 8. Open questions (구현 중 확인)

1. **saas-plannel 의 메뉴 등록 위치 정확성** — `TabMenuList.js` 가 단일 메뉴 정의 파일인지, 백엔드 DB 와 dual-source 인지. Phase 2 작성 시 확인.
2. **saas-plannel 의 axios wrapper** — `axios` 를 직접 쓰는지 별도 `apiClient.js` 가 있는지. Phase 1 작성 시 확인.
3. **saas-plannel 의 DB 접속 방식** — JPA Entity 사용하는지 MyBatis 등 다른 ORM 사용하는지. Phase 1 작성 시 확인.
4. **41-composer-generation 의 Phase 배정** — 백엔드/프런트엔드 통합 규칙이라 두 phase 모두에 영향. 본 spec 은 Phase 2 에 포함했지만 본문 작성 중 둘로 갈라야 할지 검토.
