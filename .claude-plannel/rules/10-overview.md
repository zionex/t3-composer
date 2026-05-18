# 10. PlanNEL — 기술 스택 & 프로젝트 구조

> **PlanNEL = SaaS 형태의 SCM 솔루션** (DP/IP/RP/MP/BF). T3Series wingui 와는 **완전히 다른** 프론트·백엔드 스택. Composer 가 PLANNEL target 으로 산출물을 만들 때 **wingui 컨벤션이 자동 적용되지 않도록** 별개 규약 집합.

## 0. 핵심 차이 (vs T3Series wingui)

| 영역 | PlanNEL | T3Series |
|---|---|---|
| 프론트 그리드 | **AG-Grid Enterprise 30.2.1** (community + enterprise) | RealGrid2 |
| 프론트 상태관리 | **Redux Toolkit 2.0 + redux-persist** | Zustand |
| 프론트 form | **`useState` + `useRef`** (react-hook-form 미사용) | react-hook-form (`useForm`) |
| 메뉴 | `src/pages/TabMenuList.js` (JS object 트리) | DB `TB_AD_MENU` |
| Spring Boot | **2.4.13** | 3.0.13 |
| Java import | **`javax.persistence.*`** · **`javax.validation.*`** | `jakarta.persistence.*` |
| Java | 17 | 17 |
| DB | **PostgreSQL 42.7.2** + 멀티테넌트 schema | MSSQL `T3SMARTSCM` |
| ORM | JPA/Hibernate + **QueryDSL 4.4.0** + MyBatis 3.5.15 (혼용) | JPA + JdbcTemplate(SP) |
| 테이블 prefix | **`z_*`** (예: `z_customer`, `z_item`) | `TB_<DOMAIN>_*` |
| 패키지 | **`t3series.saas.*`** | `com.zionex.t3series.web.domain.*` |
| URL prefix | **`/api/<plural-resource>`** | `/composer/...` · `/util/...` |
| Service 호출 (FE) | **Service 객체 메서드** (`customerService.getAll(params)`) | `zAxios.get('util/...')` |
| 인증 | **JWT (jjwt 0.9.1) + Multi-tenant** (`x-tenant-id` 헤더) | Spring Security session |
| Stored Procedure | **사용 안 함** (JPA Repository + QueryDSL/MyBatis) | `SP_UI_<DOMAIN>_<NO>_<ACTION>` 필수 |
| Audit BaseEntity | `t3series.saas.multi_tenancy.model.BaseEntity` (`@MappedSuperclass`, `@Version` Optimistic Locking) | `com.zionex.t3series.web.util.audit.BaseEntity` |
| Boolean 변환 | **`@Convert(converter=BooleanToYNConverter.class)`** (`Y`/`N` ↔ boolean) | `'Y'/'N'` 수동 처리 |
| i18n | **`react-i18next` 6언어** (en/ko/ja/zh-TW/zh-CN/vi) | `transLangKey()` (ko/en/ja/zh) |

**T3Series 의 어떤 컨벤션도 자동 적용되지 않습니다.** (`SP_UI_*` / `TB_AD_*` / `@wingui/common/imports` / `BaseGrid` / `useViewStore` / `setViewInfo` / `globalButtons` / `Pop*` / `useFieldCascade` / `applyGridCascade` / `CommonCodeSelect` 일체 금지)

---

## 1. 모노레포 구조

```
saas-plannel/
├── pom.xml                    ← 부모 (spring-boot-starter-parent 2.4.13, packaging=pom)
├── saas-common/               ← 공통 라이브러리 (TenantContext / Tenant / Utils)
├── saas-application/          ← 메인 Spring Boot 백엔드 (REST API 본체)
├── saas-mp/                   ← Master Production Planning 엔진 (독립 배포 가능)
├── saas-rp/                   ← Replenishment Planning 엔진 (독립 배포 가능)
├── saas-supplyserver/         ← 공급망 서버 (공급/거래처 관리)
├── saas-admin/                ← Next.js 15 + TypeScript 관리자 콘솔 (테넌트 KPI/관리)
├── saas-ai/                   ← Python + Spark + Apache Hop 수요 예측 엔진 (BF)
├── saas-ai-agent/             ← Python + FastAPI + AWS Bedrock Claude 시나리오 추천
├── saas-web/                  ← React 18 + AG-Grid + Redux Toolkit 프론트엔드
├── docker/                    ← Docker compose / 배포 스크립트
├── docs/                      ← 운영 문서
└── work/                      ← 작업 자료
```

### 1.1 모듈별 역할

| 모듈 | 기술 | 역할 |
|---|---|---|
| **saas-common** | Spring Context + MyBatis 3.5.13 + PostgreSQL JDBC | TenantContext (ThreadLocal 기반) · Tenant · DbUtils — 모든 모듈이 의존 |
| **saas-application** | Spring Boot 2.4.13 풀스택 | 웹 UI 의 메인 REST API (`/api/**`). saas-common + saas-mp + saas-supplyserver 의존. Quartz scheduler clustering, Elasticsearch, AWS (S3/SES/DynamoDB/QuickSight/Bedrock) 통합. Liquibase 마이그레이션 |
| **saas-mp** | Spring Boot (lib/ 폴더 구성, 독립 배포) | MRP/APS 알고리즘. CPU/메모리 무거운 작업 |
| **saas-rp** | Spring Boot (lib/ 폴더 구성, 독립 배포) | 보충(발주) 최적화 |
| **saas-supplyserver** | Spring Boot (lib/ 폴더 구성, 독립 배포) | 공급망 마스터 데이터 |
| **saas-admin** | Next.js 15 + TypeScript | 테넌트 KPI 대시보드 · 테넌트 생성/관리 · 사용량 분석. Google Workspace OIDC. 페이지/API 미들웨어 보호 |
| **saas-ai** | Python 3.9 + Spark + Apache Hop + Terraform | 수요 예측. saas-application 이 REST 로 요청 → BF 가 Terraform 으로 AWS EC2 instance 동적 생성 → Hop pipeline 실행 → `z_bf_result` / `z_bf_leaderboard` 저장 → instance 자동 종료 |
| **saas-ai-agent** | Python + FastAPI + Bedrock Claude 3.5 + AgentCore | 챗봇 AI 분석 · IP/DP/RP/MP 시나리오 자동 추천 + 엔진 시뮬레이션 + AI 순위. Prompt Caching · AgentCore Memory SessionManager |
| **saas-web** | React 18 + AG-Grid 30 + Redux Toolkit 2.0 + MUI 5 | 사용자 웹 UI |

---

## 2. 프론트엔드 (saas-web)

### 2.1 디렉토리 구조

```
saas-web/
├── package.json
├── craco.config.js              ← webpack alias: "@plannel" → src/
├── public/locales/<lang>/...
└── src/
    ├── pages/
    │   ├── TabMenuList.js                    ← 메뉴 정의 (lv1/lv2/lv3MenuList, MENU_GROUP)
    │   ├── dashboard/                        ← 4 dashboard types
    │   ├── data-management/                  ← 44 마스터 데이터 화면
    │   ├── data-load/                        ← CSV import / validation
    │   ├── inventory-plan/                   ← IP 화면
    │   ├── demand-plan/                      ← DP / BF 화면
    │   ├── replenishment-plan/               ← RP 화면
    │   ├── master-plan/                      ← MP 화면
    │   ├── system/                           ← 관리자 / 설정
    │   ├── quicksight/                       ← BI 대시보드 (Amazon QuickSight 임베드)
    │   └── utils/                            ← 페이지 단위 util (code-util 등)
    ├── components/                           ← 공용 (43 단일 파일 + 6 서브폴더)
    │   ├── aggrid/                           ← AG-Grid 헬퍼 (12 파일 — DefaultGridSetting / DataState / GridUtils / NumericEditor / ...)
    │   ├── filter/                           ← 검색조건 (16 파일 — CustomerAutocomplete / ItemAutocomplete / PeriodFilter / IpVersionFilter / AdvancedFilter / ...)
    │   ├── layout/                           ← 3 파일 (FilterContainer / ComparisonContainer / DashboardComponent)
    │   ├── modal/                            ← 20 파일 (AttributeConfigModal / CreateVersionModal / CalendarModal / ...)
    │   ├── flow/                             ← workflow / diagram
    │   ├── rechart/                          ← Recharts wrapper
    │   └── (단일 파일들) ActionIconButton / Dialog / Snackbar / ExcelExportButton / PaginationContainer / TabContainer / SplitterContainer / Navbar / Sidebar / ...
    ├── services/
    │   ├── utils/rest-api.js                 ← axios 인스턴스 + JWT + tenant header
    │   ├── data/                             ← 마스터 (54 파일 — customer-service / item-service / ...)
    │   ├── dp/  ip/  mp/  rp/                ← 모듈별 API
    │   ├── system/                           ← auth-service / quicksight-service / p13n-service
    │   └── dashboard/
    ├── redux/modules/                        ← store.js / viewStates.js / TabState.js / HistoryState.js
    ├── utils/                                ← redux-util / i18n / date-util / debug-util / code-util / axios-bigint / ...
    ├── hooks/                                ← Custom React hooks
    ├── assets/data/l10n/                     ← 6언어 i18n JSON (en-US / ko-KR / ja-JP / zh-TW / zh-CN / vi-VN)
    └── scss/                                 ← 글로벌 스타일 (ag-grid / components / material-ui)
```

### 2.2 주요 dependencies (`package.json`)

```json
"react": "^18.2.0",
"@reduxjs/toolkit": "^2.0.1",
"react-redux": "^9.1.0",
"redux-persist": "^6.0.0",
"@ag-grid-community/react": "^30.2.1",
"@ag-grid-enterprise/excel-export": "^30.2.1",
"@ag-grid-enterprise/row-grouping": "^30.2.1",
"@ag-grid-enterprise/master-detail": "^30.2.1",
"@ag-grid-enterprise/side-bar": "^30.2.1",
"@mui/material": "^5.15.5",
"@mui/icons-material": "^5.15.5",
"@mui/x-date-pickers": "^6.19.0",
"i18next": "^23.7.16",
"react-i18next": "^14.0.0",
"axios": "~1.7.9",
"qs": "^6.11.2",
"json-bigint": "^1.0.0",
"recharts": "~2.11.0",
"ag-charts-react": "^8.1.0",
"react-router-dom": "^6.21.2",
"lodash": "^4.17.21",
"date-fns": "^3.2.0",
"moment": "^2.30.1",
"xlsx": "^0.18.5",
"amazon-quicksight-embedding-sdk": "^2.11.2",
"sass": "^1.69.7",
"styled-components": "^6.1.8"
```

빌드: `craco start` / `craco build` / `craco test` / `cypress open`. 개발 proxy = `https://localhost:8443`.

### 2.3 webpack alias (`craco.config.js`)

```js
module.exports = {
  webpack: {
    alias: {
      "@plannel": path.resolve(__dirname, 'src/')
    }
  }
};
```

- 모든 cross-folder import 는 **`@plannel/*` alias** 사용 — 상대 경로 `../../` 금지
- `eslintConfig.globals` 에 `ZDate`, `BigInt` 등록 (커스텀 Date, BigInt 처리)

### 2.4 화면 컴포넌트 표준 signature

```jsx
import { withTranslation } from "react-i18next";

const CustomerMaster = ({ t, viewName, title }) => {
  // t        — withTranslation 으로 주입된 i18n 함수
  // viewName — 화면 식별자 (TabMenuList.js 의 reduxKey 와 일치)
  // title    — 화면 제목 (TabMenuList.js 의 title 그대로)
  // ...
};

export default withTranslation()(CustomerMaster);
```

- `withTranslation()` HOC 가 표준 (functional 안에서 `useTranslation()` 도 가능하나 기존 코드 위주 HOC)
- 파일 확장자는 **`.js`** (jsx 아님)
- viewName / title 은 **TabMenuList.js 에서 명시적으로 prop 으로 주입** (`<CustomerMaster viewName={"INPUT_CUS"} title="customer" />`)

### 2.5 viewName 의 역할

- TabMenuList.js 의 `reduxKey` 와 동일 (UPPER_SNAKE_CASE)
- `reduxUtil.getViewState(viewName)` 로 페이지 상태 (currentPage / pageSize / advancedFilters / 검색조건 등) 영속 조회
- AG-Grid 컬럼/필터 state 도 viewName 단위로 사용자별 영속

---

## 3. 백엔드 (saas-application)

### 3.1 스택

- **Spring Boot 2.4.13** (★ `javax.persistence.*` · `javax.validation.*` 사용)
- **Java 17**
- **JPA/Hibernate** + **QueryDSL 4.4.0** (Q클래스 자동 생성, `JPAQueryFactory` + `Projections.fields()`) + **MyBatis 3.5.15** 혼용
- **Spring Security** (`@PreAuthorize("hasAnyRole(...)"`)
- **JWT** (`jjwt 0.9.1`, HS512 알고리즘)
- **Multi-tenancy** (`x-tenant-id` 헤더 + ThreadLocal `TenantContext` + 테넌트 schema 라우팅)
- **PostgreSQL** (jdbc 42.7.2) — 기본 schema `zionex`
- **Quartz Scheduler 2.3.2** (클러스터링, JDBC JobStore)
- **Elasticsearch 7.17** (사용자별 인덱스 검색)
- **AWS SDK** (S3, SES, DynamoDB, QuickSight, Bedrock)
- **Springdoc OpenAPI UI 1.5.5** (Swagger)
- **Liquibase** 마이그레이션 (`db/changelog/db.changelog-tenant.yaml`)
- **Lombok 1.18.22**

### 3.2 패키지 구조 (`t3series.saas.*`)

| 패키지 | 파일 수 | 역할 |
|---|---|---|
| `controller/` | ~127 | `@RestController @RequestMapping("/api")` |
| `service/` | ~184 | 비즈니스 로직 (`@Service @RequiredArgsConstructor`) |
| `repository/` | ~169 | JpaRepository + Custom QueryRepository (`*QueryRepository`) |
| `dto/` | ~213 | DTO (`SearchDto`, `CustomerDto`, ...) |
| `model/` | ~122 | `@Entity` — `z_<table>` 매핑 |
| `mapper/` | ~60 | MyBatis SQL mapper interfaces |
| `multi_tenancy/` | ~18 | TenantContext / DataSource 라우팅 / Async config / Tenant entity |
| `security/` | ~17 | JWT (JwtUtils, AuthTokenFilter, AuthEntryPointJwt) + UserDetailsServiceImpl + WebSecurityConfig |
| `config/` | ~35 | AppConfig (CORS) / BooleanToYNConverter / AuditLogInterceptor / Hibernate / Quartz |
| `util/` | ~106 | PaginationUtil / ErrorMessageUtil / PlannelUtil / AdvancedFilterUtil / PlannelBatchUpdate / ... |

### 3.3 주요 의존성 라이브러리 (saas-application/pom.xml)

```xml
<!-- Spring Boot 2.4.13 -->
spring-boot-starter-web · spring-boot-starter-security · spring-boot-starter-data-jpa
spring-boot-starter-quartz · spring-boot-starter-data-elasticsearch

<!-- Persistence -->
hibernate-core · com.querydsl:querydsl-jpa:4.4.0
mybatis-spring-boot-starter:2.3.1 · mybatis:3.5.15
postgresql:42.7.2

<!-- Security -->
io.jsonwebtoken:jjwt:0.9.1

<!-- AWS -->
aws-java-sdk-bom (s3, ses, dynamodb, bedrock, quicksight)

<!-- Util -->
guava:32.0.0-jre · commons-lang3 · commons-io · commons-collections4
springdoc-openapi-ui:1.5.5
```

---

## 4. DB 컨벤션

### 4.1 테이블명 prefix `z_*` (PostgreSQL `zionex` schema)

```
z_customer · z_item · z_location · z_supplier · z_bod · z_bod_item
z_bf_result · z_bf_leaderboard · z_ip_settings · z_ip_evaluation
z_dp_version · z_mp_workcenter · z_rp_run_history · ...
```

### 4.2 컬럼 네이밍 컨벤션

| 접미사 | 의미 | 예 |
|---|---|---|
| `_cd` | 코드 (UNIQUE 식별자) | `customer_cd`, `item_cd`, `currency_cd` |
| `_nm` / 명사 | 명칭 | `name` |
| `_flg` | boolean (`Y/N` 1자) | `active_flg`, `del_flg` |
| `_ts` | timestamp | `created_ts`, `updated_ts` |
| `_dt` | date | `ship_rel_aprvl_dt`, `end_of_prod_dt` |
| `_by` | 사용자 ID (BIGINT) | `created_by`, `updated_by` |
| `_id` | FK (BIGINT) | `hrchy_id`, `bod_id`, `item_id` |
| `attr01..attr20` | 유연한 속성 필드 (Customer/Item 등에 20개씩) | (사용자 정의 메타) |

### 4.3 기본키 — Instagram-style ID

```sql
CREATE OR REPLACE FUNCTION zionex.next_unique_id() RETURNS BIGINT AS $$
DECLARE
    shard_id INT := 1;
    epoch DATE := '2021-01-01';
    epoch_ms BIGINT;
    now_ms BIGINT;
    next_id BIGINT;
BEGIN
    epoch_ms := floor(extract(EPOCH FROM epoch) * 1000);
    now_ms := floor(extract(EPOCH FROM clock_timestamp()) * 1000);
    next_id := (now_ms - epoch_ms) << 23
        | (shard_id << 16)
        | (nextval('zionex.table_id_seq') % 65536);
    RETURN next_id;
END;
$$ LANGUAGE plpgsql;
```

→ Entity 의 `@Id @GeneratedValue(strategy = GenerationType.IDENTITY)` 가 이 함수의 default 값을 받음. BigInt 라 frontend 에서 `json-bigint` 처리 필요.

### 4.4 마이그레이션

- **Liquibase** (`saas-application/src/main/resources/db/changelog/`)
  - `db.changelog-tenant.yaml` (마스터)
  - `db.changelog-tenant-ddl-1.0.yaml` (DDL)
  - `db.changelog-tenant-dml-1.0.yaml` (DML / seed)
- 원본 DDL: `src/main/sql/postgres-ddl-{tenant,public,provisioning}.sql`
- Hibernate `ddl-auto: none` (마이그레이션 도구 우선)

---

## 5. 다국어 (i18n)

- 6언어: `en-US` · `ko-KR` · `ja-JP` · `zh-TW` · `zh-CN` · `vi-VN`
- 파일: `saas-web/src/assets/data/l10n/translation.<lang>.js`
- 섹션: `menu` · `msg` · `problem` · `notification` · `plannelAgent` · `grid` (별도)
- 사용: `t("KEY")` 또는 props `t`
- AG-Grid 컬럼 `headerName` 에 i18n key 그대로 넣으면 GridUtils.gridValueL10N 이 번역

```javascript
const { t } = useTranslation();
const label = t("customerName");
const message = t("saveSuccess");

// AG-Grid column
{ headerName: "customerCd", field: "customerCd", filterType: 'string' }
// → 화면에는 i18n 의 "customerCd" 키 값으로 자동 번역
```

---

## 6. 신규 화면 만들 때 참조 우선순위

1. **`saas-web/src/pages/data-management/CustomerMaster.js`** — 마스터 CRUD 표준 (검색 + AG-Grid + 저장 + 삭제 + 페이징 + AdvancedFilter)
2. **`saas-web/src/pages/data-management/ItemMaster.js`** — 더 많은 필터/속성 칼럼 (attr01~20) 패턴
3. **`saas-web/src/pages/inventory-plan/inventory-simulation/TargetInventorySimulation.js`** — 복잡한 시뮬레이션/시나리오 화면 (버전 + 시나리오 + 정책 다중 grid)
4. **`saas-application/src/main/java/t3series/saas/controller/CompanyController.java`** — 단순 controller
5. **`saas-application/src/main/java/t3series/saas/controller/WorkcenterController.java`** — POST 검색 + Pagination + Sort 표준 controller

상세 파일 배치·코드 템플릿은 `20-screen-development.md`.
