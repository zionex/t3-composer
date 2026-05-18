# PlanNEL Architecture Pack

> PlanNEL 솔루션 (`saas-plannel/saas-application` + `saas-plannel/saas-web`) 용 rule pack.
> T3Series wingui 와는 **완전히 다른** React + Spring Boot 2.4 스택 — Composer / LLM 이 PLANNEL target 으로 산출물을 만들 때 wingui 컨벤션이 자동 적용되지 않도록 분리된 prompt rule 집합.

## 폴더 구조

```
.claude-plannel/
├── README.md                        ← 이 파일 (인덱스)
├── rules/                           ← 8개 markdown rule
│   ├── 10-overview.md               기술 스택 + 모노레포 구조 + 모듈별 역할
│   ├── 20-screen-development.md     신규 화면 추가 절차 (10 단계)
│   ├── 21-components.md             공용 컴포넌트 인벤토리 (AG-Grid, FilterContainer, ActionIconButton, ...)
│   ├── 30-data-access.md            REST API + axios + JPA Repository + QueryDSL + MyBatis
│   ├── 31-multi-tenancy.md          TenantContext + schema 라우팅 + Quartz Job
│   ├── 32-security.md               JWT (jjwt 0.9.1) + WebSecurityConfig + @PreAuthorize role 매트릭스
│   ├── 40-database-schema.md        PostgreSQL z_* prefix + Liquibase + Instagram-style ID
│   ├── 50-ai-modules.md             saas-ai (Forecasting) + saas-ai-agent (Bedrock Claude 챗봇/시나리오)
│   └── 99-anti-patterns.md          wingui 환각 + Spring Boot 2/3 혼동 + PlanNEL 자체 함정
└── hooks/                           ← 자동 검증 hook (placeholder, 채택 시 작성)
    ├── README.md                    hook 작성 계획
    └── validators/
        └── README.md                개별 validator 작성 계획
```

## 작성 우선순위 (사용 흐름)

| 단계 | 파일 |
|---|---|
| 1. **전체 그림 파악** | `10-overview.md` (5분) |
| 2. **신규 화면 만들 때** | `20-screen-development.md` 부터 시작 → 필요 시 `21-components.md`, `30-data-access.md` 참조 |
| 3. **백엔드 4종 세트** | `30-data-access.md §3~7` (Controller / Entity / Repository / Service) + `40-database-schema.md` |
| 4. **권한 / 보안** | `32-security.md` (모듈별 role + @PreAuthorize 패턴) |
| 5. **AI 통합** | `50-ai-modules.md` (saas-ai 결과 표시 / 챗봇 / 시나리오 추천) |
| 6. **체크리스트 / 함정** | `99-anti-patterns.md` (출력 직전 self-check) |

## 핵심 차이 요약 (vs T3Series wingui)

| 영역 | PlanNEL | T3Series |
|---|---|---|
| 그리드 | **AG-Grid Enterprise 30.2.1** | RealGrid2 |
| 상태관리 | **Redux Toolkit 2.0 + redux-persist** | Zustand |
| 폼 | **`useState` + `useRef`** (react-hook-form 미사용) | react-hook-form |
| Spring Boot | **2.4.13** (`javax.persistence.*`) | 3.0.13 (`jakarta.persistence.*`) |
| 메뉴 | **TabMenuList.js** (JS object 트리) | DB `TB_AD_MENU` |
| DB | **PostgreSQL** (`z_*` prefix, 멀티테넌트 schema) | MSSQL (`TB_<DOMAIN>_*`) |
| URL | **`/api/<plural-resource>`** | `/composer/...` · `/util/...` |
| Stored Procedure | **사용 안 함** (JPA + QueryDSL) | `SP_UI_<DOMAIN>_<NO>_<ACTION>` 필수 |
| 인증 | **JWT (jjwt 0.9.1) + Multi-tenant** (`x-tenant-id` 헤더) | Spring Security session |

상세 차이 매트릭스는 [`rules/10-overview.md §0`](./rules/10-overview.md).

## 참고 소스 위치

- **Backend**: `/Users/hej/work/projects/saas-plannel/saas-application/src/main/java/t3series/saas/`
- **Frontend**: `/Users/hej/work/projects/saas-plannel/saas-web/src/`
- **메뉴 정의**: `saas-web/src/pages/TabMenuList.js`
- **표준 화면 원본**:
  - `saas-web/src/pages/data-management/CustomerMaster.js` (마스터 CRUD)
  - `saas-web/src/pages/data-management/ItemMaster.js` (속성 컬럼 + 더 많은 필터)
  - `saas-web/src/pages/inventory-plan/inventory-simulation/TargetInventorySimulation.js` (복잡한 시뮬레이션)
- **표준 controller 원본**:
  - `saas-application/src/main/java/t3series/saas/controller/CompanyController.java` (단순 CRUD)
  - `saas-application/src/main/java/t3series/saas/controller/WorkcenterController.java` (페이징 + Sort + AdvancedFilter)

## 모노레포의 다른 모듈 (참고)

| 모듈 | 역할 |
|---|---|
| `saas-common` | 공통 라이브러리 (TenantContext / Tenant / Utils) |
| `saas-application` | 메인 Spring Boot 백엔드 (REST API 본체) |
| `saas-mp` | Master Production Planning 엔진 (독립 배포) |
| `saas-rp` | Replenishment Planning 엔진 (독립 배포) |
| `saas-supplyserver` | 공급망 서버 |
| `saas-admin` | Next.js 15 + TypeScript 관리자 콘솔 |
| `saas-ai` | Python + Spark + Apache Hop 수요 예측 엔진 |
| `saas-ai-agent` | Python + FastAPI + Bedrock Claude 시나리오 추천 |
| `saas-web` | React 18 + AG-Grid + Redux Toolkit 프론트엔드 |

## 비고

- `hooks/` 는 현재 plan 만 작성 — 실제 자동 검증 스크립트는 PlanNEL 에 Composer/LLM 적용 본격화 시 작성
- `99-anti-patterns.md §8` 은 빈 채로 두어 사용 중 발견되는 패턴을 누적
- 모든 markdown 은 한국어 + 인용 코드 영어 (T3Series rules 와 동일 톤)
