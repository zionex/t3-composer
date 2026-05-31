# 99a. Composer 화면 생성 안티패턴 카탈로그 (PlanNEL)

> **PlanNEL 전용** — wingui(T3SmartSCM) 와의 오염 차단이 핵심 목적.
> 이 카탈로그의 모든 ❌ 항목은 wingui 컨벤션이 PlanNEL 산출물에 그대로 흘러들어올 때 발생하는 패턴이다.
> 전체 규약: `41-composer-generation.md` + `41b-composer-java.md` + 자매 규칙 참조.

---

## A. 참조 방식

| # | ❌ wingui/잘못된 패턴 | ✅ PlanNEL 표준 | 참조 |
|---|---|---|---|
| A1 | 유사 원본 없이 자유 창작 | 가장 비슷한 기존 페이지/slice/Controller 1개 이상 Read 후 복제 | 41 §0 |
| A2 | 출력 맨 앞 4줄 선언 누락 (`참조 원본:` / `원본 import 리스트` / `치환 매핑` / `신규 추가: 없음`) | 4줄 선언 필수 — 산출물 최초 라인부터 명시 | 41 §0.1 |
| A3 | 참조 원본으로 wingui `view/system/usermgmt/Users.jsx` 를 지목 | `saas-plannel` 의 실제 기존 페이지/컨트롤러 파일 지목 | 41 §0.2 |

---

## B. 페이지 / 메뉴 / 라우팅

| # | ❌ wingui/잘못된 패턴 | ✅ PlanNEL 표준 | 참조 |
|---|---|---|---|
| B1 | `UI_<DOMAIN>_<NAME>` MENU_CD 발행 | `TabMenuList.js` lv3 entry + i18n menu 키 6개 언어 갱신 | 20 §4-5 |
| B2 | `MENU_FILE_PATH = "/<module>/<File>"` 형식 경로 산출 | `src/pages/<domain-kebab>/<PascalName>.js` 파일 경로 | 20 §2 |
| B3 | `TB_AD_MENU INSERT` SQL 산출 | `TabMenuList.js` 항목 추가 (코드 변경) | 20 §4 |
| B4 | `TB_AD_LANG_PACK INSERT` SQL 산출 | `translation.<locale>.json` 6개 갱신 | 20 §5 |
| B5 | `MENU_PATH ≠ LOWER(MENU_FILE_PATH)` | 해당 없음 — PlanNEL 은 react-router-dom v6 경로 직접 관리 | 20 §3 |
| B6 | `App.js` 에 `<Route path="/scm/..." element={<Page />} />` 직접 추가 | `TabMenuList.js` 에 lv3 항목 추가만 — App.js 라우트 자동 연동 | 20 §3 |
| B7 | `menus.js` 또는 `DB` 없이 라우트 파일 수정 | `TabMenuList.js` + i18n 파일 2곳만 | 20 §4 |
| B8 | 폴더명 PascalCase (`src/pages/InventoryPlan/`) | kebab-case 필수 (`src/pages/inventory-plan/`) | 20 §2 |

---

## C. JSX 표면 API

| # | ❌ wingui/잘못된 패턴 | ✅ PlanNEL 표준 | 참조 |
|---|---|---|---|
| C1 | `import { BaseGrid } from '@wingui/common/imports'` | `import { AgGridReact } from "@ag-grid-community/react"` | 21 §6 AP-1 |
| C2 | `import { ContentInner, SearchArea, InputField } from '@wingui/common/imports'` | MUI `Box`, `FilterContainer`, `TextField` 직접 사용 | 21 §6 AP-2 |
| C3 | `import { SplitPanel } from '@zionex/wingui-core'` | MUI `Box` flex 레이아웃 직접 구성 | 21 §6 AP-13 |
| C4 | `import { TabContainer } from '@zionex/wingui-core'` | MUI `Tabs` + `Tab` 직접 구성 | 21 §6 AP-14 |
| C5 | `import { useViewStore, useContentStore } from '@wingui/common/imports'` | `useDispatch()` + `dispatch(updateViewState({viewName,...}))` | 21 §4 AP-3 |
| C6 | `setViewInfo(activeViewId, 'globalButtons', [...])` | `reduxDispatch(updateViewState({ viewName, ...uiState }))` | 21 §4 AP-4 |
| C7 | `transLangKey('KEY')` | `const { t } = useTranslation(); t('menu.key')` | 21 §5 AP-5 |
| C8 | `<BaseGrid items={colDefs} afterGridCreate={fn} />` | `<AgGridReact ref={gridRef} columnDefs={colDefs} onGridReady={fn} />` | 21 §6 AP-7 |
| C9 | `grid.dataProvider.fillJsonData(rows)` | `setRowData(rows)` (React state 직접) | 21 §6 AP-8 |
| C10 | `grid.dataProvider.getAllStateRows()` | `DataState.getAllStateData(gridRef.current?.api)` → flat array | 21 §6 AP-9 |
| C11 | `applyGridCascade` / `useFieldCascade` 사용 | AG-Grid `onCellValueChanged` + 직접 필드 연동 로직 | 21 §6 AP-12 |
| C12 | `gridItems` / `columnDefs` 를 컴포넌트 함수 내부에 선언 (매 렌더마다 재생성) | 컴포넌트 밖 또는 `useMemo(() => DefaultGridSetting({...}), [])` | 21 §6 AP-17 |
| C13 | 그리드 컨테이너에 `minHeight: 0` 누락 — 0px collapse | `sx={{ flex: 1, minHeight: 0 }}` 부모 체인 전체 필수 | 21 §6 AP-15 |
| C14 | `className` 없이 `<AgGridReact />` 렌더 | 부모 `Box` 에 `className="ag-theme-balham"` 필수 | 21 §6 AP-16 |
| C15 | `export default withTranslation()` HOC 누락 | `export default withTranslation()(MyPage)` — t prop 미주입 시 번역 불가 | 21 §6 AP-21 |
| C16 | `headerName` 에 한글 하드코딩 | i18n 키 + `GridUtils.gridValueL10N(t)` | 21 §6 AP-19 |
| C17 | 데이터 로드 후 `DataState.initialize` 생략 — 더티 상태 누적 | `.finally(() => DataState.initialize(gridRef.current?.api))` | 21 §6 AP-18 |
| C18 | `window.location.href = '/some/path'` | `navigate(RouteList.SomePage.path)` | 21 §2 |

---

## D. 서버 통신

| # | ❌ wingui/잘못된 패턴 | ✅ PlanNEL 표준 | 참조 |
|---|---|---|---|
| D1 | `zAxios.get('/util/...')` 직접 호출 | `@plannel/services/<area>/<name>-service.js` 안에 wrapping 후 호출 | 30 §12 |
| D2 | `zAxios.post(url, body, composerReq())` | PlanNEL axios 래퍼(`restApi`/`restApiDP`/`restApiIP`/`restApiRP`/`restApiMP`) | 30 §2 |
| D3 | `multipart/form-data` + `'changes'` key POST | JSON body — Controller 에서 `@RequestBody List<FeatureDto>` 수신 | 21 AP-10, 41b §5.7 |
| D4 | `callService(serviceId, paramMap, target)` 엔진 라우팅 호출 | 해당 없음 — PlanNEL 은 단독 Spring Boot 서비스 | 41 §6 |
| D5 | `createAsyncThunk` 로 API 호출 결과를 Redux store 에 저장 | `useState` + axios `.then()/.catch()` 직접 처리, Redux 는 UI 상태만 | 30 §10-11 AP-11 |
| D6 | URL 경로 `/composer/...` 또는 `/util/...` (wingui 컨벤션) | `/api/<plural-resource>` — kebab-case 복수형 | 30 §12 |
| D7 | `GET /api/customers?filter=...` (검색조건이 긴 GET) | `POST /api/customers` + JSON body `SearchDto` | 30 §12 |
| D8 | `@RequestMapping("/customers")` 클래스 레벨에 단수/전체 경로 선언 | 클래스 레벨 `/api` 고정 + 메서드 레벨에 `/customers/...` | 30 §3, 41b §5.7 |
| D9 | 응답으로 `List<T>` 직접 반환 | `PaginationUtil.getPageResponse(...)` 또는 `getAllPageResponse(...)` | 30 §12 |
| D10 | `@Transactional` 을 Controller 에 부착 | Service 레벨에만 `@Transactional` | 30 §12 |

---

## E. Java 백엔드

| # | ❌ wingui/잘못된 패턴 | ✅ PlanNEL 표준 | 참조 |
|---|---|---|---|
| E1 | `package com.zionex.t3series.web.*` | `package t3series.saas.<feature>` | 41b §5.5 |
| E2 | `import com.zionex.t3series.web.util.audit.BaseEntity` | `import t3series.saas.model.BaseEntity` | 41b §5.4 |
| E3 | `import com.zionex.t3series.web.util.data.ResponseMessage` | `import t3series.saas.response.ResponseMessage` | 41b §5.4 |
| E4 | `import jakarta.persistence.*` / `jakarta.validation.*` (Spring Boot 3 가정) | `import javax.persistence.*` / `javax.validation.*` (Spring Boot 2.4) | 41b §5.4 |
| E5 | `@Qualifier("targetJdbcTemplate")` — Composer preview 전용 qualifier | 해당 없음 (PlanNEL 은 단일 PostgreSQL 데이터소스) | 41b §5.11 |
| E6 | `@RequestMapping("/util/<feature>")` 또는 `/composer/...` class 레벨 | `@RequestMapping("/api")` class 레벨 + 메서드에 구체 경로 | 41b §5.7 |
| E7 | `Integer verNum` (Wrapper) | `int verNum` (primitive) — BaseEntity 규약 | 41b §5.6 |
| E8 | Entity 와 DTO 를 같은 클래스로 사용 | Entity(`<Feature>.java`) 와 DTO(`<Feature>Dto.java`) 반드시 분리 | 41b §5.1a |
| E9 | `ResponseMessage.builder().message(...).build()` (Lombok @Builder 가정) | `ResponseMessage.ok()` / `error(msg)` — 정적 팩토리 메서드 | 41b §5.8 |
| E10 | `HttpServletRequest` + `request.getParameter("changes")` + ObjectMapper 패턴 | `@RequestBody <FeatureDto>` 또는 `@RequestBody List<FeatureDto>` JSON 직접 수신 | 41b §5.7 |
| E11 | `@PreAuthorize` 누락 — 미인증 endpoint | `@PreAuthorize("hasAnyRole('ADMIN', 'APP_DP', 'APP_IP', ...)")` 필수 | 41b §5.0 |
| E12 | `LoggedUserContext` 없이 현재 사용자 ID 하드코딩 | `LoggedUserContext.get()` 으로 현재 사용자 ID 획득 | 41b §5.11 |
| E13 | `OptimisticLockingFailureException` 처리 누락 | catch 후 `HttpStatus.CONFLICT`(409) 반환 | 41b §5.10 |
| E14 | `BeanPropertyRowMapper` + `jdbcTemplate.query("EXEC ...")` (SP 호출) | QueryDSL / MyBatis XML / JPA Repository (SP 없음) | 41b §5.3 |

---

## F. SQL / DB

| # | ❌ wingui/잘못된 패턴 | ✅ PlanNEL 표준 | 참조 |
|---|---|---|---|
| F1 | `SP_UI_<DOMAIN>_<NO>_<ACTION>` SP 작성 또는 `SP_UI_*.sql` 산출 | 해당 없음 — 모든 로직을 Java Service 안에서 처리 | 41b §5.3 |
| F2 | 테이블명 `TB_*` / `TB_AD_*` / `TB_UT_*` | `z_<lowercase_snake>` (예: `z_customer`, `z_ip_settings`) | 40 §2 |
| F3 | 테이블명 또는 컬럼명 대문자 / CamelCase | 소문자 + snake_case 필수 | 40 §13 |
| F4 | audit 컬럼 `MODIFY_BY` / `MODIFY_DTTM` (T3Series 명칭) | `updated_by` (BIGINT) / `updated_ts` (TIMESTAMP) | 40 §10 |
| F5 | audit 컬럼 `CREATE_BY` / `CREATE_DTTM` (T3Series 명칭) | `created_by` (BIGINT) / `created_ts` (TIMESTAMP) | 40 §10 |
| F6 | `CREATE TABLE TB_<domain>_*` — wingui 컨벤션 테이블 신규 생성 | `CREATE TABLE z_<feature>` (PostgreSQL, lowercase snake) | 40 §2 |
| F7 | 비즈니스 테이블에 `tenant_id` / `PLAN_SCOPE` 컬럼 추가 | schema-per-tenant — 컬럼 없음 (connection-level schema 라우팅) | 40 §1.1 |
| F8 | SQL / Entity 에 schema prefix 하드코딩 (`zionex.z_customer`) | `z_customer` 만 — search_path 자동 적용 | 40 §1.1 |
| F9 | `USE_YN` 컬럼명 | `active_flg` (`CHAR(1)`, Y/N, `BooleanToYNConverter`) | 40 §10 |
| F10 | boolean 컬럼을 DB `BOOLEAN` 타입으로 | `CHAR(1)` + Y/N + `@Convert(converter = BooleanToYNConverter.class)` | 40 §13 |
| F11 | ID 를 `SERIAL` / `IDENTITY` / `nextval(seq)` 로 | `BIGINT DEFAULT zionex.next_unique_id()` (Instagram-style) | 40 §13 |
| F12 | 신규 테이블에 audit 컬럼 누락 | 6컬럼 필수: `id, created_ts, created_by, updated_ts, updated_by, ver_num` | 40 §13 |
| F13 | Liquibase 우회한 ALTER TABLE 직접 실행 | 모든 schema 변경은 Liquibase changelog 통해 | 40 §13 |
| F14 | `@Column(name=...)` 누락 — 자동 변환에 의존 | 명시 필수 (예: `@Column(name = "desc_txt")` for `descTxt`) | 40 §13 |
| F15 | FK 컬럼에 인덱스 누락 | `CREATE INDEX idx_<table>_<col>` 명시 | 40 §13 |

---

## G. 아티팩트 파일 경로

| # | ❌ wingui/잘못된 패턴 | ✅ PlanNEL 표준 | 참조 |
|---|---|---|---|
| G1 | `===FILE:` path 끝 `_js`/`_java`/`_sql` (underscore 확장자) | 정규 dot 확장자 `.js` / `.java` / `.sql` | 41 §5 |
| G2 | JSX 파일명 PascalCase 폴더 (`src/pages/InventoryPlan/`) | 폴더는 kebab-case, 파일만 PascalCase (`src/pages/inventory-plan/IpSettings.js`) | 20 §2 |
| G3 | Java 파일 클래스명 축약 (`Customer*.java` for `/customers/CustomerMgmt`) | `<Feature>` = 경로 마지막 segment 1:1 (`CustomerMgmt*.java`) | 41b §5.6 |
| G4 | Java 패키지 디렉토리에 하이픈/언더스코어 (`customer-mgmt`) | 단일 소문자 concat (`customermgmt`) | 41b §5.6 |

---

## H. 생성 모드별 추가 제약

| # | 모드 | ❌ 잘못된 패턴 | ✅ 올바른 처리 |
|---|---|---|---|
| H1 | NEW_FROM_COPY | 기존 Entity/Repository 두고 새 `z_*` 테이블 DDL 생성 | 원본 Entity 재사용 — 새 DDL 생성 금지 |
| H2 | NEW_FROM_COPY | 백엔드 Controller/Service 전부 fork (별도 파일 생성) | 동일 backend 재사용 기본 — `TabMenuList.js` + i18n 만 추가 |
| H3 | NEW_FROM_DESIGN | 설계서 필드를 새 `z_*` 테이블로 매핑 | 기존 테이블 컬럼 범위 내에서 DTO 설계 (40 §10 컬럼 검증 절차) |
| H4 | 모든 모드 | `SP_UI_*.sql` 산출 시도 | 해당 없음 — PostgreSQL + JPA 환경 (41b §5.3) |
| H5 | 모든 모드 | wingui 엔진 service XML (`*_service.xml`) 산출 | 해당 없음 |
| H6 | EXISTING_MODIFY | `DROP TABLE` / 컬럼 이름 변경 DDL 산출 | `ALTER TABLE ... ADD COLUMN` 만 허용 (Liquibase changelog) |

---

## 빠른 자기 검증 (출력 직전)

산출물에 아래 패턴이 있으면 즉시 수정:

```
❌ 아래 중 하나라도 있으면 PlanNEL 이 아닌 wingui 산출물이다
---------------------------------------------------------
import ... from '@wingui/common/imports'
import ... from '@zionex/wingui-core'
useViewStore / useContentStore / setViewInfo
transLangKey(
zAxios.get / zAxios.post
callService(
multipart/form-data + 'changes'
com.zionex.t3series.web
jakarta.persistence / jakarta.validation
@Qualifier("targetJdbcTemplate")
TB_AD_MENU / TB_AD_LANG_PACK / TB_UT_* / TB_AD_*
SP_UI_ / EXEC SP_UI_
MODIFY_BY / MODIFY_DTTM / CREATE_BY / CREATE_DTTM
createAsyncThunk (API 결과 저장 목적)
```

모두 없어야 PlanNEL 산출물이다.
