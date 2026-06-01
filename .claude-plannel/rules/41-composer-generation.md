# 41. PlanNEL Composer 화면 생성 규칙 (Artifact Contract)

> PlanNEL(saas-plannel) 전용 — wingui/T3SmartSCM 과 **완전히 다른** 생성 계약.
> 모든 모드 (`new_general` · `new_nl` · `new_step` · `new_from_design` · `new_from_copy` · `existing_modify`) 공통.
>
> **Sub-rule 참조 우선 순위** (이 파일 ↔ 하위 규칙 충돌 시 하위 규칙 우선):
>
> | 파일 | 다루는 영역 |
> |---|---|
> | `20-screen-development.md` | 파일 배치 / TabMenuList / 6-lang i18n / App.js 라우팅 |
> | `21-components.md` | AG-Grid / MUI / Redux / i18next / 컴포넌트 네이밍 |
> | `30-data-access.md` | axios restApi 인스턴스 / service 패턴 / useState 데이터 흐름 / Redux UI-only |
> | `40-database-schema.md` | z_* 테이블 / audit 컬럼 / ver_num / schema-per-tenant |
> | `41b-composer-java.md` | Spring `t3series.saas.*` / javax.* / 3-ORM 선택 / §5.1 정책 / §5.2 모드별 DDL |

---

## §0. 유사 화면 참조 (필수 첫 단계)

Composer NEW_GENERAL 으로 PlanNEL 화면 생성 시:

1. 가장 비슷한 기존 `src/pages/<domain-kebab>/<Feature>.js` 페이지 1-3개를 **반드시 Read** 한다 (경로는 `TARGET_PLANNEL_WINGUI_PATH` 기준 — §3.0).
2. 유사 서비스 파일 (`src/services/<domain>/<Name>.js`) 도 함께 Read.
3. 산출물 맨 앞에 4줄 선언 필수:

```
참조 원본: src/pages/data-management/CustomerMaster.js, src/services/data/customer-service.js
원본 import 리스트 (그대로 유지): AgGridReact, MUI Box/Button, withTranslation, restApi
치환 매핑: Customer → Item / customerService → itemService / /api/customers → /api/items
원본에 없는 신규 추가: 없음
```

### §0.1 기본 원칙 — "복제 + 치환" 이지 "재구성" 이 아니다

원본의 상태 관리 방식·axios 호출 패턴·AG-Grid 설정·MUI 레이아웃을 그대로 가져오고, 도메인 이름만 치환한다. LLM 이 "더 나은 구조"를 상상해 Redux createAsyncThunk 나 자체 axios interceptor 를 추가 금지.

### §0.2 원본 선택 기준

| 화면 유형 | 참조할 원본 예시 |
|---|---|
| 마스터 CRUD | `src/pages/data-management/CustomerMaster.js` |
| 조회 리포트 | `src/pages/inventory-plan/IpAnalysis.js` |
| 설정 입력 | `src/pages/inventory-plan/IpSettings.js` |
| 대시보드 / 요약 | `src/pages/demand-plan/DpDashboard.js` |

---

## §1. 런타임 구조

### §1.1 PlanNEL 단독 구동

외부 엔진(mp/dp/bf/fp server) 기동 없이 동작. SP 없음. 모든 데이터 처리는 Java Service 내부에서 직접 처리.

### §1.2 프론트엔드 스택

| 레이어 | 기술 | 비고 |
|---|---|---|
| UI 프레임워크 | React 18 | 파일 확장자 `.js` (`.jsx` 금지) |
| 그리드 | AG-Grid (`@ag-grid-community/react`) | BaseGrid 아님 |
| UI 컴포넌트 | MUI v5 | SearchArea/InputField 아님 |
| 상태 관리 | Redux Toolkit (`createSlice`) | UI 상태만 (필터/탭/페이지) |
| i18n | react-i18next (`withTranslation()` HOC) | `transLangKey` 아님 |
| 사이드바 | react-pro-sidebar | 21 참조 |
| HTTP | axios — `restApi` / `restApiDP` / `restApiIP` / `restApiRP` / `restApiMP` | 30 §2 |

**핵심 금지 사항**: `createAsyncThunk` 로 API 호출 금지 — API 결과는 컴포넌트의 `useState` 가 보유하고, `axios.then()` 체인으로 처리 (30 §10-11 참조).

### §1.3 백엔드 스택

| 레이어 | 기술 |
|---|---|
| 프레임워크 | Spring Boot **2.4.13** (javax.*) |
| Java | 17 |
| ORM | JPA / QueryDSL / MyBatis — 41b §5.2b 선택 기준 |
| DB | PostgreSQL (schema-per-tenant — 40 §1.1) |
| 루트 패키지 | `t3series.saas` |
| 테이블 접두어 | `z_` (예: `z_customer`) |

---

## §2. 화면 식별 — TabMenuList + i18n + 파일 경로 3종 세트

PlanNEL 은 wingui 의 `MENU_CD` / `MENU_FILE_PATH` 같은 DB 등록 ID 가 없다. 화면 식별은 다음 3종으로 이루어진다.

| 식별자 | 위치 | 예시 |
|---|---|---|
| `reduxKey` | `TabMenuList.js` lv3 항목 | `"IP_SETTINGS"` |
| 파일 경로 | `src/pages/<domain-kebab>/<PascalName>.js` | `pages/inventory-plan/IpSettings.js` |
| i18n 키 | `translation.*.json` `"menu"` 섹션 | `"menuIpSettings"` |

Composer 산출물은 이 **3종을 모두 함께 생성**해야 한다.

### §2.1 viewName / reduxKey 결정 규약

- **viewName**: UPPER_SNAKE_CASE (예: `IP_SETTINGS`, `CUSTOMER_MASTER`, `DEMAND_PLAN_MONTHLY`)
- **reduxKey**: viewName 과 **반드시 동일** (20 §4.4 참조)
- 두 값이 다르면 Redux viewState 격리가 깨진다

```js
// ✅ 올바름 — viewName == reduxKey
lv3MenuList["SUBMENU_IP_SETTINGS"] = [
  {
    reduxKey: "IP_SETTINGS",         // reduxKey
    component: <IpSettings viewName={"IP_SETTINGS"} ... />  // viewName = reduxKey
  }
];

// ❌ 금지 — 불일치
{ reduxKey: "IP_SETTINGS", component: <IpSettings viewName={"ip-settings"} ... /> }
```

---

## §3. 산출물 세트 — Composer 의무 생성 목록

### §3.0 경로 매핑 — `.env` 변수 ↔ 산출물 경로

Composer 가 생성한 파일이 실제로 쓰이는 위치는 host 의 디렉토리이고, 컨테이너 내부에서는 마운트된 경로로 보인다. 본 rule 의 `saas-application/...` · `saas-web/...` 접두어는 다음 매핑을 가진다:

| Rule 표기 | `.env` 변수 | host 경로 (`.env` 값) | composer-backend 컨테이너 마운트 |
|---|---|---|---|
| `saas-application/...` | `TARGET_PLANNEL_BACKEND_PATH` | 예: `/Users/<user>/work/projects/saas-plannel/saas-application` | `/workspace/targets/PLANNEL/backend/...` |
| `saas-web/...` | `TARGET_PLANNEL_WINGUI_PATH` ※ | 예: `/Users/<user>/work/projects/saas-plannel/saas-web` | `/workspace/targets/PLANNEL/wingui/...` |
| (DDL/migration) | `TARGET_PLANNEL_DATABASE_PATH` | 예: `/Users/<user>/work/projects/saas-plannel/saas-application/src/main/resources/db/changelog` (혹은 별도) | `/workspace/targets/PLANNEL/database/...` |

※ `TARGET_PLANNEL_WINGUI_PATH` 의 이름은 T3SERIES wingui 컨벤션의 잔재 — PlanNEL 에서는 React 프런트엔드 (`saas-web/`) 를 가리킨다.

산출물 생성 시 LLM 은 가독성을 위해 `saas-application/...` · `saas-web/...` 접두어를 그대로 사용한다. Composer 의 apply 단계가 위 매핑으로 자동 변환해 실제 파일을 쓴다.

### §3.1 Frontend (saas-web/ = TARGET_PLANNEL_WINGUI_PATH — §3.0 참조)

★ 본 표의 경로는 모두 **`TARGET_PLANNEL_WINGUI_PATH` 기준 상대 경로** — 즉 `TARGET_PLANNEL_WINGUI_PATH/src/pages/...` 가 실제 host 경로 (§3.0).

| 파일 | 필수 | 설명 |
|---|---|---|
| `src/pages/TabMenuList.js` (모디파이) | ✅ | **2가지 변경 모두 필수**: ① 파일 상단에 `import <Feature> from "./<domain-kebab>/<Feature>";` static import 추가 ② 소속 lv2 의 `lv3MenuList` 배열에 새 항목 추가. 자세히는 20 §4.5 |
| `src/pages/<domain-kebab>/<Feature>.js` | ✅ | React 컴포넌트 — `withTranslation()` HOC 권장 (21 §5) |
| `src/services/<domain>/<feature>Service.js` | ✅ | axios wrapper — 도메인별 인스턴스 사용 (30 §2.1) |
| `src/redux/slices/<feature>Slice.js` | 조건부 | UI 상태만 (필터/탭/페이지). API 결과는 useState |
| **`src/assets/data/l10n/translation.<locale>.json` 6개 언어** | ✅ | en-us / ja-jp / ko-kr / vi-vn / zh-cn / zh-tw — 20 §5 |

#### 도메인별 axios 인스턴스 선택

```js
// DP (Demand Plan)        → restApiDP
import { restApiDP } from "@plannel/services/utils/rest-api";
restApiDP.post("/api/dp-versions", body);

// IP (Inventory Plan)     → restApiIP
// RP (Replenishment Plan) → restApiRP
// MP (Master Plan)        → restApiMP
// 마스터 / 일반            → restApi (default)
import restApi from "@plannel/services/utils/rest-api";
restApi.post("/api/customers", body);
```

#### React 컴포넌트 기본 골격

```js
// src/pages/<domain-kebab>/<Feature>.js
import React, { Component } from "react";
import { withTranslation } from "react-i18next";
import { Box, Button } from "@mui/material";
import { AgGridReact } from "@ag-grid-community/react";
import featureService from "../../services/<domain>/featureService";

class Feature extends Component {
  constructor(props) {
    super(props);
    this.state = {
      rowData: [],
      loading: false,
    };
  }

  componentDidMount() {
    this.loadData();
  }

  loadData = () => {
    const { viewName } = this.props;
    this.setState({ loading: true });
    featureService.getAll({})
      .then((res) => {
        this.setState({ rowData: res.data?.results || [] });
      })
      .catch((err) => console.error(err))
      .finally(() => this.setState({ loading: false }));
  };

  render() {
    const { t, title } = this.props;
    const { rowData } = this.state;
    return (
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <Box sx={{ p: 1 }}>
          <Button variant="contained" onClick={this.loadData}>{t("btnSearch")}</Button>
        </Box>
        <Box className="ag-theme-balham" sx={{ flex: 1 }}>
          <AgGridReact rowData={rowData} columnDefs={columnDefs} />
        </Box>
      </Box>
    );
  }
}

export default withTranslation()(Feature);
```

### §3.2 Backend (saas-application/ = TARGET_PLANNEL_BACKEND_PATH — §3.0 참조)

★ 본 표의 경로는 모두 **`TARGET_PLANNEL_BACKEND_PATH` 기준 상대 경로** — 즉 `TARGET_PLANNEL_BACKEND_PATH/src/main/java/...` 가 실제 host 경로 (§3.0).

> 위 표 경로 = `src/main/java/<package as path>/<File>.java` 형식으로 표기.

| 파일 경로 | 필수 | 설명 |
|---|---|---|
| `src/main/java/t3series/saas/model/<Feature>.java` | ✅ | Entity — `@Table(name="z_<feature>")`, BaseEntity 상속 |
| `src/main/java/t3series/saas/dto/<Feature>Dto.java` | ✅ | 컨트롤러 ↔ 서비스 DTO (Entity 직접 노출 금지) |
| `src/main/java/t3series/saas/service/<Feature>Service.java` | ✅ | `@Service` + 트랜잭션 |
| `src/main/java/t3series/saas/controller/<Feature>Controller.java` | ✅ | `@RestController` + `@RequestMapping("/api")` |
| `src/main/java/t3series/saas/repository/<Feature>Repository.java` | 선택 | `JpaRepository` — 단순 PK 조회/저장 |
| `src/main/java/t3series/saas/repository/<Feature>QueryRepository.java` | 선택 | `JPAQueryFactory` — 조건부 단일 조회 |
| `src/main/java/t3series/saas/mapper/<subdomain>/<Feature>Mapper.java` | 선택 | MyBatis Mapper interface (`@Mapper` 어노테이션) — 페이지네이션 / 벌크 처리 |
| `src/main/resources/mapper/<subdomain>/<Feature>Mapper.xml` | 선택 (Mapper.java 와 쌍) | MyBatis XML SQL — `<subdomain>` 폴더가 java 측과 동일하게 (master/dp/ip/mp/rp/notification 등) |

패키지 배치 (41b §5.5.1):
```
t3series.saas.model      → Entity
t3series.saas.dto        → DTO
t3series.saas.service    → Service
t3series.saas.controller → Controller
t3series.saas.repository → JpaRepository / QueryDSL
t3series.saas.mapper.<subdomain> → MyBatis Mapper
```

### §3.3 DB (PostgreSQL)

신규 `z_*` 테이블 DDL 생성 여부는 모드에 따라 다름 (41b §5.2):

| 모드 | 신규 테이블 DDL |
|---|---|
| NEW_NL / NEW_GENERAL | ✅ 허용 — Liquibase changelog 포함 필수 |
| NEW_FROM_DESIGN | ❌ 금지 |
| NEW_FROM_COPY | ❌ 금지 |
| NEW_STEP | ❌ 금지 |
| EXISTING_MODIFY | ALTER 만 허용 |

DDL 작성 시 40 §11 신규 테이블 체크리스트 필수 적용.

---

## §4. i18n 키 등록 — 6개 언어 동시 갱신 필수

```
src/assets/data/l10n/
├── translation.en-us.json
├── translation.ja-jp.json
├── translation.ko-kr.json
├── translation.vi-vn.json
├── translation.zh-cn.json
└── translation.zh-tw.json
```

- **6개 모두 갱신** 안 하면 해당 언어 사용자 화면에 키 문자열 그대로 노출
- 키 형식: flat camelCase — `keySeparator: false` 이므로 점 표기 금지
- 메뉴 표시명: `"menu"` 섹션 안의 `"menu<PascalScreenName>"` 키
- 그리드 컬럼 헤더: `"grid"` 섹션 (또는 별도 기능 섹션)

```json
{
  "menu": {
    "menuCustomerMaster": "거래처 마스터",
    "menuIpSettings": "재고계획 설정"
  },
  "grid": {
    "customerCd": "거래처코드",
    "customerNm": "거래처명"
  }
}
```

---

## §5. 산출물 체크리스트 — PR 직전 검증

### §5.1 공통 (모든 모드)

- [ ] §0 참조 원본 4줄 선언이 산출물 메타에 있는가?
- [ ] `viewName` == `reduxKey` 인가?
- [ ] axios wrapper 가 도메인별 인스턴스 (`restApiDP`/`IP`/`RP`/`MP`/기본) 를 사용하는가?
- [ ] API 결과를 `useState` 로 관리 (`createAsyncThunk` 사용하지 않음)?
- [ ] 컴포넌트 파일 확장자가 `.js` (`.jsx` 아님)?
- [ ] Java import 가 `javax.*` (`jakarta.*` 아님)?
- [ ] 패키지가 `t3series.saas.*` (`com.zionex.t3series.web.*` 아님)?

### §5.2 Frontend 산출물

- [ ] 페이지 파일 경로: `src/pages/<domain-kebab>/<PascalName>.js`?
- [ ] 서비스 파일 경로: `src/services/<domain>/<featureName>Service.js`?
- [ ] TabMenuList.js: ① 파일 상단 static import 추가 AND ② lv3 항목 추가 — 둘 다 필수?
- [ ] i18n 6개 언어 `translation.*.json` 모두 갱신?

### §5.3 Backend 산출물

- [ ] Entity: `@Table(name="z_<feature>")` — schema prefix 하드코딩 없음?
- [ ] Entity: `BaseEntity` 상속 (`t3series.saas.model.BaseEntity`)?
- [ ] DTO 분리: 컨트롤러에서 Entity 직접 반환하지 않음?
- [ ] Controller: `@PreAuthorize` 적용?
- [ ] MyBatis UPDATE: `ver_num = ver_num + 1` + `WHERE ver_num = #{verNum}` 낙관적 잠금?

### §5.4 wingui 시그니처 0건 (모든 모드 필수)

아래 항목이 산출물에 나타나면 즉시 제거:

| ❌ wingui 시그니처 | 설명 |
|---|---|
| `UI_<DOMAIN>_<NAME>` 형식 MENU_CD 상수 | — |
| `MENU_FILE_PATH = "/<module>/..."` | — |
| `TB_AD_MENU`, `TB_AD_LANG_PACK` SQL | — |
| `SP_UI_*` 또는 `EXEC SP_` | — |
| `MODIFY_BY` / `MODIFY_DTTM` 컬럼 | — |
| `jakarta.persistence.*` / `jakarta.servlet.*` | Spring Boot 2.x 에 없음 |
| `com.zionex.t3series.web.*` 패키지 | wingui 전용 |
| `useViewStore` / `setViewInfo` / `transLangKey` | wingui 전용 |
| `BaseGrid` / `SearchArea` / `InputField` 컴포넌트 | wingui 전용 |

---

## §6. Anti-patterns (wingui → PlanNEL 대응 표)

| ❌ wingui 패턴 | ✅ PlanNEL 등가 | 참조 |
|---|---|---|
| `UI_<DOMAIN>_<NAME>` MENU_CD 발행 | `TabMenuList.js` lv3 entry + i18n menu 키 | 20 §4-5 |
| `MENU_FILE_PATH = "/<module>/<File>"` | `src/pages/<domain-kebab>/<PascalName>.js` 파일 경로 | 20 §2 |
| `TB_AD_MENU INSERT` SQL 산출 | `TabMenuList.js` 항목 추가 (코드 변경) | 20 §4 |
| `TB_AD_LANG_PACK INSERT` 산출 | `translation.*.json` 6개 갱신 | 20 §5 |
| `SP_UI_<DOMAIN>_<NO>_<ACTION>` SP 작성 | Java Service 안에서 직접 처리 | 41b §5.3 |
| `EXEC SP_UI_*` JdbcTemplate 호출 | QueryDSL / MyBatis XML | 41b §5.2b |
| `jakarta.*` import (Spring Boot 3 가정) | `javax.*` (Spring Boot 2.4.13) | 41b §5.4 |
| `com.zionex.t3series.web.*` 패키지 | `t3series.saas.*` | 41b §5.5 |
| `MODIFY_BY` / `MODIFY_DTTM` audit 컬럼 | `updated_by` / `updated_ts` | 40 §10 |
| `TB_*` 테이블명 | `z_*` (PostgreSQL) | 40 §2 |
| `useViewStore` / `setViewInfo` / `transLangKey` | Redux Toolkit + react-i18next | 21 §4-5 |
| `createAsyncThunk` for API 호출 | `useState` + axios `.then()` | 30 §10-11 |
| `BaseGrid` / `<SearchArea>` / `InputField` 컴포넌트 | `AgGridReact` + MUI 직접 | 21 §1 §6 |
| `callService(serviceId, paramMap, target)` | `restApiDP.post("/api/...", body)` | 30 §2.1 |
| `menus.js` / DB 없이 라우트 파일 수정 | `TabMenuList.js` + `App.js` 라우트 수정 없음 | 20 §3 |
| `@RequestMapping` 이 컨트롤러 클래스 + 메서드 이중 선언 | 클래스는 `/api` 고정, 메서드에 구체 경로 | 30 §3 |
| `PLAN_SCOPE` 컬럼 필터로 테넌트 격리 | schema-per-tenant — `tenant_id` 컬럼 없음 | 40 §1.1 |
| `@Column(name = "TB_...")`에 schema prefix | `@Table(name = "z_customer")` schema prefix 없음 | 40 §1.1 |
| `composer-jsx.sh` / wingui hook 참조 | 해당 없음 (PlanNEL Composer 전용 hook 사용) | — |

---

## §7. 생성 모드별 추가 제약

### NEW_FROM_COPY

- 원본 화면과 동일한 axios 인스턴스 사용 (도메인 변경 금지)
- 원본 Entity / Repository 재사용 — 새 `z_*` 테이블 DDL 생성 금지 (41b §5.2)
- TabMenuList.js 에 새 lv3 entry 추가 + i18n 키 추가만 산출

### NEW_FROM_DESIGN

- 설계서에 명시된 필드를 기존 `z_*` 테이블 컬럼에 매핑 (40 §10 컬럼 검증 절차)
- 새 테이블 DDL 금지 — 기존 테이블 컬럼 범위 내에서 DTO 설계

### EXISTING_MODIFY

- 기존 `z_*` 테이블 ALTER 만 허용 (DROP/TRUNCATE/CREATE 금지)
- 기존 Java 클래스명/패키지 경로 변경 금지

---

## 관련 파일

- `20-screen-development.md` — 파일 배치 / TabMenuList / i18n / App.js 라우팅
- `21-components.md` — AG-Grid / MUI / Redux / i18next
- `30-data-access.md` — axios 인스턴스 / service 패턴 / useState 데이터 흐름
- `40-database-schema.md` — z_* 테이블 / audit 컬럼 / ver_num / multi-tenancy
- `41b-composer-java.md` — Spring Boot 2.4.13 / javax.* / 3-ORM / 코드 템플릿
