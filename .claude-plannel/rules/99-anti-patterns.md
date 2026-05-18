# 99. Anti-patterns (PlanNEL)

> PlanNEL 화면을 만들면서 LLM 이 자주 틀리는 패턴을 누적하는 문서. **초기 분류**: T3Series wingui 환각 + PlanNEL 자체 함정 + Spring Boot 2.x ↔ 3.x 혼동. 사용 중 추가 패턴은 사용자가 누적.

---

## 1. T3Series wingui 컨벤션을 PlanNEL 에 적용 (가장 흔한 환각)

PlanNEL 은 T3Series 와 **모든** 표면이 다릅니다. LLM 이 T3Series 학습 데이터에 익숙해서 자동으로 다음과 같이 잘못 출력하기 쉬움:

| # | ❌ wingui 환각 | ✅ PlanNEL 표준 |
|---|---|---|
| W1 | `import { ... } from "@wingui/common/imports"` | `@plannel/components/*` alias |
| W2 | `<BaseGrid items={...} afterGridCreate={fn}>` | `<AgGridReact columnDefs={...} rowData={...} ref={gridRef} {...defaultGridMemo}>` |
| W3 | `grid.dataProvider.fillJsonData(rows)` | `setRows(rows)` (state 변경 → AG-Grid 자동 리렌더) |
| W4 | `grid.dataProvider.getAllStateRows()` | `DataState.getStateData(api, "created")` + `"updated"` 분리 |
| W5 | `useViewStore` / `useContentStore` | `reduxUtil.getViewState(viewName)` + `useDispatch` |
| W6 | `useFieldCascade` / `applyGridCascade` | (PlanNEL 동등 헬퍼 없음 — 화면별 cascade 수동 구현) |
| W7 | `<PopSelectItem>` / `<PopSelectAccount>` | `<ItemAutocomplete>` / `<CustomerAutocomplete>` (`@plannel/components/filter/...`) |
| W8 | `<CommonCodeSelect groupCd="USE_YN">` | MUI `<Select>` + `<MenuItem>` + 자체 lookup service 또는 `getLookup()` 호출 |
| W9 | `setViewInfo(activeViewId, 'globalButtons', [{name, action}])` | 로컬 JSX 에 직접 버튼 (`<AddButton>` / `<SaveButton>` / `<RemoveButton>` 등 ActionIconButton) |
| W10 | `showMessage('확인', '메시지', cb)` | `<Dialog open content onHandler />` + `<Snackbar open severity content />` |
| W11 | `zAxios.get('util/user-infos')` | `customerService.getAll(params)` (service 레이어 경유) — URL 직접 작성 금지 |
| W12 | `MENU_CD = "UI_<DOMAIN>_<NAME>"` 형식 | PlanNEL 은 MENU_CD 개념 없음 — TabMenuList.js 의 `reduxKey` 가 그 역할 (UPPER_SNAKE) |
| W13 | TB_AD_MENU INSERT | TabMenuList.js 의 `lv3MenuList` 객체에 entry 추가 + i18n 키 6언어 등록 |
| W14 | `SP_UI_<DOMAIN>_<NO>_Q1` Stored Procedure 생성 | JPA Repository + (필요 시) QueryDSL / MyBatis mapper |
| W15 | `JdbcTemplate.queryForList("EXEC SP_UI_... ?", ...)` | `repository.findBy<X>(...)` 또는 `customerService.findAll(...)` (Service → Repository) |
| W16 | `import javax.persistence.*` 가 PlanNEL 에서도 `jakarta.*` 일거라 가정 | **`javax.persistence.*`** (Spring Boot 2.4.13) — `30-data-access.md` |
| W17 | `com.zionex.t3series.web.util.audit.BaseEntity` | `t3series.saas.multi_tenancy.model.BaseEntity` (경로 자체 다름) |
| W18 | `@JsonIgnoreProperties(ignoreUnknown=true)` 필수 가정 | PlanNEL Entity 는 `@JsonIgnore` 를 관계 필드별로 명시 (`@JsonIgnore` on `@ManyToOne` 등) |
| W19 | Controller URL `/composer/<m>/<fs>` | `/api/<plural-resource>` |
| W20 | `@RequestMapping("/api/customer")` 단수형 | `/api/customers` 복수형 (kebab-case OK: `/api/new-items`, `/api/work-centers`) |
| W21 | Controller `save(HttpServletRequest)` + `request.getParameter("changes")` multipart | `@PostMapping("/api/x/save") public ... save(@RequestBody List<XDto> rows)` |
| W22 | 한글 라벨 하드코딩 (`headerName: "거래처코드"`) | i18n key (`headerName: "customerCd"`) — AG-Grid + i18next 가 자동 번역 |
| W23 | `useFieldCascade({control, setValue, getValues})` (react-hook-form) | PlanNEL 은 `useState` + `useRef` — **react-hook-form 미사용** |
| W24 | `getAllStateRows()` / `getJsonRow()` | AG-Grid: `gridRef.current.api.forEachNode(...)` · `getSelectedRows()` · `DataState.getStateData(api, "created"|"updated")` |
| W25 | 화면 진입 시 `setViewInfo` 로 글로벌 search 버튼 등록 | 로컬 JSX 의 `FilterContainer` 안에 `<SaveButton onClick={...}>` 직접 배치 |
| W26 | T3Series 도메인 코드 (`UI_UT_*` / `UI_DP_*` 등) | PlanNEL 모듈 prefix 없음 — `reduxKey` 가 자유로운 UPPER_SNAKE (예: `INPUT_HRCHY_CONFIG`, `IP_PLAN`, `TARGET_INV_SIMULATION`) |
| W27 | `MENU_FILE_PATH = '/<module>/<PascalName>'` | PlanNEL 은 file path 가 `component:` 의 JSX 컴포넌트 import 로 자동 결정 — DB 에 저장 안 함 |
| W28 | RealGrid 컬럼 `{ name, headerText, dataType, textAlignment, editor }` | AG-Grid `{ field, headerName, type:["rightAligned"], filterType, cellClass, cellEditor }` |
| W29 | `useFieldCascade` 의 cascade 컬럼 정의 | (PlanNEL 미보유) — 마스터-디테일 cascade 는 화면별로 useState + useEffect 로 직접 구현 |
| W30 | `BooleanToYNConverter` 가 wingui 도 적용된다고 가정 | wingui 는 `Y/N` 수동 처리 — PlanNEL 만 `@Convert(converter = BooleanToYNConverter.class)` |
| W31 | `MENU_CD V2 distinction` (메뉴만 분기) | PlanNEL 은 `reduxKey` 만 변경 — backend 는 단일 자원 공유 (`ITEM` vs `ITEM_V2` 둘 다 `customerService` 호출) |
| W32 | wingui 의 `@Qualifier("targetJdbcTemplate")` 자동 주입 | PlanNEL 은 단일 datasource (멀티테넌트 schema 라우팅으로 분리) — qualifier 불필요 |
| W33 | wingui 의 `Pop*` 양식 (`PopupDialog` + `<SearchArea><WorkArea>`) | PlanNEL 은 MUI `<Dialog>` 또는 `@plannel/components/modal/<X>Modal` 양식 |

---

## 2. Spring Boot 2.4 ↔ 3.x 혼동 (LLM 학습 데이터 기준)

LLM 은 최신 Spring Boot 3.x (`jakarta.*`) 에 익숙. PlanNEL 은 **2.4.13 (`javax.*`)** 사용 — 모든 import 가 다름.

| # | ❌ Spring Boot 3.x 환각 | ✅ Spring Boot 2.4.13 |
|---|---|---|
| SB1 | `import jakarta.persistence.*` | `import javax.persistence.*` |
| SB2 | `import jakarta.persistence.Entity` | `import javax.persistence.Entity` |
| SB3 | `import jakarta.persistence.Table` | `import javax.persistence.Table` |
| SB4 | `import jakarta.persistence.Id` | `import javax.persistence.Id` |
| SB5 | `import jakarta.persistence.GeneratedValue` | `import javax.persistence.GeneratedValue` |
| SB6 | `import jakarta.persistence.Column` | `import javax.persistence.Column` |
| SB7 | `import jakarta.persistence.ManyToOne` | `import javax.persistence.ManyToOne` |
| SB8 | `import jakarta.persistence.JoinColumn` | `import javax.persistence.JoinColumn` |
| SB9 | `import jakarta.persistence.MappedSuperclass` | `import javax.persistence.MappedSuperclass` |
| SB10 | `import jakarta.persistence.Convert` | `import javax.persistence.Convert` |
| SB11 | `import jakarta.persistence.AttributeConverter` | `import javax.persistence.AttributeConverter` |
| SB12 | `import jakarta.persistence.Version` | `import javax.persistence.Version` |
| SB13 | `import jakarta.persistence.EntityListeners` | `import javax.persistence.EntityListeners` |
| SB14 | `import jakarta.persistence.Transient` | `import javax.persistence.Transient` |
| SB15 | `import jakarta.validation.constraints.NotBlank` | `import javax.validation.constraints.NotBlank` |
| SB16 | `import jakarta.validation.Valid` | `import javax.validation.Valid` |
| SB17 | `import jakarta.servlet.http.HttpServletRequest` | `import javax.servlet.http.HttpServletRequest` |
| SB18 | `import jakarta.servlet.Filter` | `import javax.servlet.Filter` |
| SB19 | Security: `extends WebSecurityConfigurerAdapter` 가 deprecated 가정 후 `SecurityFilterChain` bean 패턴 | `extends WebSecurityConfigurerAdapter` 정상 사용 (PlanNEL 의 `WebSecurityConfig` 확인) |
| SB20 | `Jwts.parserBuilder().setSigningKey(...).build().parseClaimsJws(...)` (jjwt 0.11+) | `Jwts.parser().setSigningKey(...).parseClaimsJws(...)` (jjwt 0.9.1 legacy API) |

---

## 3. PlanNEL 자체 함정 (frontend)

| # | ❌ | ✅ |
|---|---|---|
| FE1 | `viewName` 이 reduxKey 와 일치 안 함 → `reduxUtil.getViewState` 가 항상 undefined → 새로고침 시 페이지 상태 사라짐 | TabMenuList.js 의 reduxKey 와 컴포넌트의 `viewName` prop 정확히 일치 |
| FE2 | `DataState.initialize(params.api)` 누락 (onGridReady 에서) | onGridReady 안에서 첫 줄에 호출 — 미호출 시 저장 시 created/updated 추적 불가 |
| FE3 | 컬럼 정의에 `filterType` 누락 → AdvancedFilter 가 컬럼 인식 못함 | 모든 컬럼에 `filterType: 'string'` / `'number'` / `'boolean'` / `'timestamp'` |
| FE4 | `type:["booleanColumn"]` 누락 → boolean 셀이 `true`/`false` 텍스트로 표시 | Y/N flag 컬럼은 `type: ["booleanColumn"]` 명시 |
| FE5 | `currentPage = 0` 으로 backend 전송 (frontend 가 1-base 인데 0 보내면 backend 에서 다시 -1 처리해 음수) | backend 는 0-base — `page: currentPage - 1` 변환 |
| FE6 | `gridRef.current.api` 호출을 onGridReady 전에 시도 → null reference | `gridLoading` state 로 ready 신호 받은 후만 호출 |
| FE7 | 한글 라벨 하드코딩 — `headerName: "거래처코드"` | i18n key — `headerName: "customerCd"` (i18next 가 자동 번역) |
| FE8 | `import { ... } from "../../../components/..."` (상대 경로) | `import { ... } from "@plannel/components/..."` alias |
| FE9 | TabMenuList.js 의 i18n 키 6언어 중 일부 누락 → 해당 언어 사용자에게 raw key 노출 | en-US/ko-KR/ja-JP/zh-TW/zh-CN/vi-VN 모두 추가 |
| FE10 | `lv3MenuList` 의 key 가 다른 entry 와 중복 → React key 경고 + 메뉴 sort 불안정 | 도메인별 번호 범위 (data-mgmt 100~199, IP 1000~1999, ...) 안에서 unique |
| FE11 | `axios` 직접 import 후 호출 | `restApi` (`@plannel/services/utils/rest-api`) 또는 service 레이어만 |
| FE12 | `localStorage` 의 user 정보 직접 조작 | 로그인/로그아웃 service 통해서만 (auth-service.js) |
| FE13 | BigInt ID 를 number 로 변환해 정밀도 손실 | `json-bigint` 그대로 사용 (axios-bigint transformer) |
| FE14 | `useState` 안 객체 mutation (`obj.x = 1; setObj(obj)`) | spread (`setObj({...obj, x: 1})`) — React 가 변경 감지 |
| FE15 | `useMemo` deps 에 `gridItems` 변수 포함 → 매 렌더 재생성 | 컬럼 정의를 컴포넌트 밖으로 빼거나 useMemo deps 비움 (`[]`) |
| FE16 | i18n key 와 일반 string 혼용 (`headerName: t("customerCd")`) | i18n key 만 (`headerName: "customerCd"`) — GridUtils.gridValueL10N 이 자동 변환 |

---

## 4. PlanNEL 자체 함정 (backend)

| # | ❌ | ✅ |
|---|---|---|
| BE1 | `@JsonIgnore` 누락한 `@ManyToOne` → JSON 직렬화 시 무한 순환 → StackOverflow | 양방향 관계의 한쪽에 `@JsonIgnore` (보통 `@ManyToOne` 쪽) |
| BE2 | `@Convert(BooleanToYNConverter)` 누락 → DB 의 `Y/N` 가 boolean 으로 매핑 안 됨 → 항상 false | 모든 boolean 필드에 `@Convert(converter = BooleanToYNConverter.class)` |
| BE3 | `@PreAuthorize` 누락한 controller → 인증 후 모든 사용자 접근 가능 (보안 위험) | 모든 controller 에 명시 — 마스터: `hasAnyRole('APP_DP', 'APP_IP', 'APP_RP', 'APP_MP')` |
| BE4 | `@PreAuthorize("hasRole('ROLE_ADMIN')")` (prefix 포함) | `@PreAuthorize("hasRole('ADMIN')")` (prefix 없이 — Spring 이 자동 부착) |
| BE5 | Service 안 N+1 쿼리 (관계 필드 lazy fetching 후 loop 안 호출) | QueryDSL `JOIN FETCH` 또는 `@EntityGraph` 또는 `Projections.fields()` 사용 |
| BE6 | `Page<X>` 의 `getContent()` 를 호출 안 하고 직접 응답 | `PaginationUtil.getPageResponse(page, page.getContent())` 표준 |
| BE7 | `@Transactional` 을 Controller 에 부착 | Service 레벨에만 — Controller 는 비즈니스 트랜잭션 경계 아님 |
| BE8 | Native SQL 안에 schema 하드코딩 (`zionex.z_customer`) | schema 미지정 — Hibernate 가 search_path 자동 적용 |
| BE9 | 마스터 DB (`public.tenant`) 에 일반 JpaRepository 로 접근 | `TenantRepository` (별도 DataSource 라우팅) |
| BE10 | Tenant 컨텍스트 무시한 raw `JdbcTemplate` 호출 | JPA / QueryDSL / MyBatis 통한 자동 schema 라우팅 |
| BE11 | `@Async` 메서드 안에서 DB 호출 시 TenantContext 비어있음 | `AsyncConfig` 에 `TenantAwareTaskDecorator` 등록 (이미 적용됨 — 삭제 금지) |
| BE12 | Controller 에서 try/catch 누락 → 500 응답 시 사용자에게 stacktrace 노출 | `try/catch (Exception e) { log.error(e.getMessage()); return ... INTERNAL_SERVER_ERROR; }` |
| BE13 | `@RequestBody List<XDto>` 인데 frontend 가 `Map` 형태로 전송 | 양쪽 컨벤션 정렬 — 보통 List 표준 |
| BE14 | DB 컬럼명을 `@Column` 없이 자동 매핑 의존하다 매핑 실수 (`descTxt` → `desc_txt` 가 아닌 다른 이름) | `@Column(name = "desc_txt")` 명시 |
| BE15 | `BaseEntity` 의 `@Version verNum` 무시한 동시 update → OptimisticLockException | 클라이언트가 받은 verNum 을 그대로 다시 보내야 함 (DTO 에 포함) |
| BE16 | 응답 DTO 에 `password` / `accessToken` 필드 노출 | `@JsonIgnore` 또는 별도 DTO |
| BE17 | 로그에 JWT / 비밀번호 / 개인정보 출력 | log 에 절대 출력 안 함 (`log.info("user logged in")` 만, token 값 X) |
| BE18 | 신규 테이블에 audit 컬럼 (created_ts/created_by/updated_ts/updated_by/ver_num) 누락 | `BaseEntity` 상속 시 자동 + DDL 에도 6컬럼 명시 |

---

## 5. PlanNEL 자체 함정 (멀티테넌트 / 보안)

| # | ❌ | ✅ |
|---|---|---|
| MT1 | Cross-tenant 조회 후 `TenantContext.clear()` 누락 → 다음 요청에 영향 | `try/finally` 로 반드시 원복 |
| MT2 | Quartz Job 안에서 테넌트 컨텍스트 누락 → 잘못된 schema 조회 | `JobDataMap.put("tenantId", ...)` + 실행 시 복원 |
| MT3 | `tenantId` 를 URL path 에 노출 (`/api/tenants/abc/customers`) | header 로만 (`x-tenant-id`) 전달 |
| MT4 | 로그인 응답에 `tenantId` 누락 → frontend 가 후속 요청에 헤더 못 붙임 | 로그인 응답 표준: `{ accessToken, type, tenantId, roles, ... }` |
| MT5 | `WebSecurityConfig.accessAllUrl` 에 비즈니스 endpoint 추가 (`/api/customers/**` 등) | `permitAll()` 화이트리스트는 시스템 only (`/api/auth/**`, `/swagger-ui/**`) |
| MT6 | JWT secret 하드코딩 | `application.yml` + `JWT_SECRET_KEY` 환경변수 |

---

## 6. PlanNEL 자체 함정 (DB / Liquibase)

| # | ❌ | ✅ |
|---|---|---|
| DB1 | Liquibase 우회한 ALTER TABLE 직접 실행 (psql 로) | 모든 schema 변경은 `db.changelog-tenant-ddl-1.0.yaml` 에 changeset 추가 후 적용 |
| DB2 | 테이블명 `TB_*` 또는 대문자 / camelCase | `z_<lowercase_snake>` |
| DB3 | 컬럼명 대문자 / camelCase | 소문자 + snake_case |
| DB4 | boolean 컬럼을 `BOOLEAN` 으로 정의 | `CHAR(1)` + `Y/N` (BooleanToYNConverter 호환) |
| DB5 | ID 를 `SERIAL` / `IDENTITY` 로 | `BIGINT DEFAULT zionex.next_unique_id()` (Instagram-style) |
| DB6 | 신규 테이블에 audit 6컬럼 (id/created_ts/created_by/updated_ts/updated_by/ver_num) 누락 | 모든 z_* 테이블 필수 |
| DB7 | `public.*` 에 비즈니스 테이블 추가 | `public` 은 시스템 only — 비즈니스는 테넌트 schema |
| DB8 | FK 컬럼에 인덱스 누락 (PostgreSQL 자동 안 만듦) | `CREATE INDEX idx_<table>_<col>` 명시 |
| DB9 | UNIQUE 자연 키 누락 (예: customer_cd) | 모든 마스터에 `UNIQUE (xxx_cd)` 정의 |
| DB10 | 새 모듈 prefix 임의 사용 (`z_xx_*`) | 정의된 5종 (`z_bf_/dp_/ip_/rp_/mp_`) 또는 마스터 (`z_*`) 안에서 |

---

## 7. 검증 우선순위

LLM 출력 직전 self-check (5분 이내 빠른 점검):

### 7.1 Frontend
- [ ] **`javax.persistence.*`** 사용? (jakarta 아님)
- [ ] 모든 import 가 `@plannel/*` 또는 `@mui/*` 또는 `@ag-grid-*` 또는 외부 lib? (`@wingui/*` 일체 없음)
- [ ] **`<AgGridReact>`** 사용? (`<BaseGrid>` 없음)
- [ ] `useDispatch` / `reduxUtil` 사용? (`useViewStore` / `useContentStore` 없음)
- [ ] Controller URL 이 `/api/<resource>` 시작? (`/composer/` 나 `/util/` 없음)
- [ ] Entity `@Table(name = "z_...")`? (`TB_*` 없음)
- [ ] `@PreAuthorize` 명시? (PlanNEL 모듈 role: APP_DP / APP_IP / APP_RP / APP_MP / ADMIN)
- [ ] 응답이 `PaginationUtil` 헬퍼 결과? (직접 List 반환 X)
- [ ] 한글 라벨 없음 — i18n key 사용?
- [ ] TabMenuList.js entry + i18n key 6언어 등록 포함?

### 7.2 Backend
- [ ] Entity `extends BaseEntity` (`t3series.saas.multi_tenancy.model.BaseEntity`) 상속?
- [ ] boolean 필드에 `@Convert(converter = BooleanToYNConverter.class)`?
- [ ] `@ManyToOne` 관계 필드에 `@JsonIgnore`?
- [ ] Controller `try/catch` + `log.error`?
- [ ] Service `@Transactional(readOnly=true)` (조회) / `@Transactional` (변경)?
- [ ] `@PreAuthorize` 의 role 이 prefix 없이 (`'APP_DP'`)?
- [ ] DTO 에 `toEntity()` / `toDto()` 메서드?

### 7.3 메뉴 / 권한
- [ ] TabMenuList.js 의 `appRoles` / `userRoles` 가 `ROLE_` prefix 포함?
- [ ] `@PreAuthorize` 의 role 은 prefix 없이?
- [ ] DB seed 의 role 이름은 `ROLE_` prefix 포함?

---

## 8. 추가 누적 (사용 중 발견되는 패턴)

> 이 섹션은 PlanNEL 화면을 실제로 만들면서 발견되는 새로운 안티패턴을 사용자가 추가합니다. 발견 시 다음 형식으로 누적:

```
| <num> | <안티패턴 설명> | <올바른 방법> | (발견 일자, 영향 화면) |
```

(현재 비어있음 — 사용 중 채워나갈 예정)
