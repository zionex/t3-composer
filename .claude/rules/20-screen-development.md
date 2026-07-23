---
description: 화면(.jsx) 신규/수정 시 골격 규칙. 파일 경로·네이밍·메뉴 등록만 다룬다. 코드 표면은 sub-rules 가 권위.
globs:
  - "**/view/**/*.jsx"
  - "**/view/**/*.tsx"
alwaysApply: false
---

# 20. 화면 개발 골격 규칙

> 본 문서 = **파일 배치 · 네이밍 · 메뉴 등록** 만.
> JSX/Java 코드 표면 (BaseGrid prop · zAxios · showMessage · store 매핑 등) 은 sub-rules 가 단일 진실:
>
> | 주제 | 정답지 |
> |---|---|
> | JSX 표준 | `.claude/rules/41a-composer-jsx.md` |
> | Java 백엔드 | `.claude/rules/41b-composer-java.md` |
> | 위젯 / Cascade / POPUP / 공통코드 | `.claude/rules/41c-composer-widgets.md` |
> | 4-Step Wizard | `.claude/rules/41d-composer-wizard.md` |
> | SP DDL | `.claude/rules/31-stored-procedures.md` |
> | DB 스키마 사전 검증 | `.claude/rules/32-sql-schema-verification.md` |
> | 안티패턴 | `.claude/rules/99-anti-patterns.md` · `99a-composer-anti-patterns.md` |

---

## 1. 결정 플로우

```
요구사항
  ↓
업무 유형 식별 (마스터 CRUD · 리포트 · 입력 · 대시보드)
  ↓
패턴 선정 (P01 위젯대시보드 / P02 검색+그리드 / P03 검색+탭 / P04 M-D 스플릿 / P06 크로스탭)
  ↓
유사 원본 화면 Read (Composer 의 경우 sourceBundle) → 복제 + 변경분만 수정
  ↓
백엔드 4종 (Entity · Service · Controller [+ Repository]) + SP_UI_*.sql (CRUD 액션마다)
  ↓
메뉴 등록 (TB_AD_MENU + TB_AD_LANG_PACK 4언어 + TB_AD_PERMISSION_GROUP) · 라우팅 자동
```

## 2. 파일 배치 규칙 (강제)

> `<wingui-root>` = Target 별 wingui 소스 루트. 하드코딩 금지 — Target 마다 다른 경로.

### JSX
```
<wingui-root>/src/view/<module>[/<category>]/<lowercase-name>/<PascalName>.jsx
```

### Java
```
<wingui-root>/src/main/java/<package>/domain/<module>/<feature>/
  <Feature>.java                 @Entity
  <Feature>Service.java          @Service (JdbcTemplate + EXEC SP)
  <Feature>Controller.java       @RestController
  <Feature>Repository.java       (선택)
```

> `<Feature>` = MENU_FILE_PATH 의 마지막 PascalCase segment **그대로** (축약·확장·번역 금지) — 상세 `41b §5.6.0`.
> `<lowercase-name>` = `LOWER(<Feature>)` — contentStore 라우팅 규약. 단일 lowercase 토큰, 하이픈/언더스코어 금지.

### 위젯 (대시보드용)
```
<wingui-root>/src/view/<module>/widgets/<widget-name>/<WidgetName>.jsx
```
ContentInner 래퍼 없이 직접 차트/그리드 렌더.

### ⛔ utility 도메인 — `util/` 단 하나뿐, `ut/` 절대 금지

| ✅ | ❌ |
|---|---|
| `view/util/*` · `domain/util/*` · `/util/*` URL · `zAxios.get('util/*')` | 어떤 표면이든 `ut/` 사용 (Hook block) |

상세는 `99-anti-patterns.md §0`.

---

## 3. 필수 구조 (모든 화면 공통)

다음 7개 표면은 sub-rules 의 정답지를 그대로 따른다 — 본 문서는 카탈로그만:

| 표면 | 정답지 |
|---|---|
| `<ContentInner>` 래퍼 / 레이아웃 컴포넌트 | `21-components.md §1~2` |
| Import 블록 (`@wingui/common/imports` 단일) | `41a §4.1` |
| 그리드 컬럼 정의 (`gridItems` 컴포넌트 밖 + `dataType` 필수) | `41a §4.3` · `21 §4.2` |
| 글로벌 버튼 (`setViewInfo` + `{name, action}`) | `41a §4.6` |
| 그리드 객체 (`afterGridCreate` 콜백 + 문자열 `id`) | `41a §4.2` · `4.4` |
| `useForm({defaultValues})` 타입별 초기값 (datetime → null) | `21 §3.1.0` |
| Store 매핑 (`activeViewId` ← `useContentStore` · `setViewInfo` ← `useViewStore`) | `41a §4.6` |

⛔ 가장 빈번한 위반: store swap · `gridItems` 컴포넌트 내부 선언 · `dataType` 누락 (`41a §4.3` — 화면 즉시 크래시) · datetime defaultValue `''` (Invalid Date) · `useViewStore` 에서 `activeViewId` 추출.

---

## 4. 서버 통신 = REST (zAxios) 가 기본

신규 화면 4-tier: **zAxios → RestController → JdbcTemplate → SP_UI_***

```jsx
// 조회
zAxios.get('<module>/<features>', { params: getValues() })
  .then((res) => grid?.dataProvider.fillJsonData(res.data));

// 저장 (GridSaveButton onSave 콜백)
const onSave = (g, rows) => {
  const fd = new FormData();
  fd.append('changes', JSON.stringify(rows));
  return zAxios({ method:'post', url:'<module>/<features>',
    headers:{'content-type':'multipart/form-data'}, data: fd });
};
```

상세 (multipart 포맷 · Y/N↔Boolean 변환 · 삭제) — `41a §4.5`.

❌ 신규 화면이 `callService(...)` / 엔진 service XML 사용 금지 (`41a §4.5`). 기존 BF/DP/MP/FP 계산 화면 수정만 예외.

---

## 5. 라우팅 · 메뉴 등록

### 5.1 메뉴 등록 SQL

`TB_AD_MENU` · `TB_AD_LANG_PACK` (ko/en/ja/zh) · `TB_AD_PERMISSION_GROUP` 3종 세트.
실제 컬럼 + 표준 INSERT 패턴은 `30-database-schema.md §5` · `32-sql-schema-verification.md` 참조.

핵심 (자주 틀리는 부분):
- TB_AD_MENU 컬럼: `ID · PARENT_ID · MENU_CD · MENU_PATH · MENU_SEQ · MENU_FILE_PATH · USE_YN` + BaseEntity. ❌ `MENU_NM · PARENT_MENU_CD · URL · DEPTH · SORT_ORDER` 미존재
- TB_AD_LANG_PACK audit: `MODIFY_BY · MODIFY_DTTM` (❌ `UPDATE_BY` 아님)
- parent lookup: `(SELECT ID FROM TB_AD_MENU WHERE MENU_CD='MENU_<DOMAIN>')` — `MENU_AD` / `MENU_UTIL` / `MENU_DP` 등
- MENU_FILE_PATH 형식: `/<module>[/<category>]/<PascalName>` (확장자 X · 마지막 직전 ≠ lowercase(마지막))
- MENU_PATH = `LOWER(MENU_FILE_PATH)` (URL slug)
- DDL 방언: MSSQL only (`NEWID()` / `GETDATE()`. Oracle `SYSDATE` / `SYS_GUID` 금지)

### 5.2 프런트엔드 라우트

`contentStore.js` 의 자동 변환식:
```js
filepath = view.filePath.toLowerCase() + view.filePath.slice(lastIndexOf('/'))
```
MENU_FILE_PATH `/util/UserInfoMgmt` → `view/util/userinfomgmt/UserInfoMgmt.jsx` 자동 로드. **별도 라우트 코드 불필요**.

---

## 6. 백엔드 4종 세트

상세 코드 템플릿 / import 화이트리스트 / 정책 차단 조건 → **`41b-composer-java.md` §5**.

핵심:
- `jakarta.persistence/servlet/validation/...` (❌ `javax.*` Spring Boot 3.x 에서 제거)
- `BaseEntity` 경로: `<package>.web.util.audit.BaseEntity` (❌ 허구 `web.domain.BaseEntity`)
- Service = JdbcTemplate + EXEC SP (❌ JpaRepository / Specification)
- Controller 저장: `HttpServletRequest` + `request.getParameter(ServiceConstants.PARAMETER_KEY_DATA)` + ObjectMapper

---

## 7. SP_UI_*.sql DDL

상세 → **`31-stored-procedures.md`**.

핵심:
- 네이밍 `SP_UI_<DOMAIN>_<NO>_<ACTION>` (Q1/S1/D1/POP_Q1/CHART_Q1/BATCH)
- 배치: `t3series-database/mssql/upgrade/vX.Y.Z-YYYYMMDD/procedures/` (Target 별 경로는 환경 변수)
- MSSQL 방언만
- 조회 SP 결정론적 `ORDER BY` 필수 (§9 우선순위)
- 컬럼 사용 전 Entity / 카탈로그 사전 검증 (`32-sql-schema-verification.md`)

---

## 8. 온톨로지 등록 (자연어 질의 대상 화면만)

`tb_is_vwbusnss_ontlgy` 에 `menu_cd` 등록 + 관련 엔티티 → 상세 `10-ontology-first.md`.

---

## 9. 패턴 카탈로그 (스켈레톤은 sub-rules / docs)

| 패턴 | 화면 유형 | 참조 |
|---|---|---|
| P01 | 위젯 대시보드 (`DashboardPanel` + react-grid-layout) | `21-components.md §6` |
| P02 | 검색 + 단일 그리드 (마스터 CRUD) | `41a` 전체 + Users.jsx 참조 |
| P03 | 검색 + 탭 (Summary/Detail) | `21 §2` TabContainer |
| P04 | 수평/수직 스플릿 마스터-디테일 | `21 §2` SplitPanel + `41a §4.2.1` flex chain |
| P06 | 크로스탭 피벗 입력 (시간 버킷 동적 컬럼 · 지표 measure 확장 · unpivot 저장) | **`42-pivot-cross-tab.md` 정본** (PivotSpec + `PivotUtil.pivotData` + `addGridItems` + `getUpdatedCells` unpivot). 참조 원본: `t3mockup/pivot_table/PivotTableMockup.jsx` · `t3mockup/_oron/mp_mrp_psi/OronMpMrpPsiMockup.jsx` |

⛔ 표 외 자유 패턴 작명 금지. 상세 코드 예시는 `t3series-wingui/packages/wingui/src/view/util/userinfomgmt/UserInfoMgmt.jsx` 같은 운영 화면을 Read 해서 복제.

---

## 10. 체크리스트 (배포 전 최종 점검)

### 기획
- [ ] 업무 유형 / 패턴 / 데이터 소스 (테이블·뷰·SP) 확정
- [ ] 조회 조건은 DOMAIN_* 타입 우선 (`22-filter-bar.md`)

### 구현
- [ ] sub-rules 의 `자기 검증` 항목 통과 (`41a` · `41b` 각 말미)
- [ ] 모든 utility 산출물이 `util/` (★ `ut/` 한 자리도 사용 안 함)
- [ ] 신규 화면이 zAxios + RestController + JdbcTemplate + SP 4-tier (callService 사용 X)

### 통합
- [ ] TB_AD_MENU + TB_AD_LANG_PACK ko/en/ja/zh + TB_AD_PERMISSION_GROUP 등록
- [ ] SP_UI_*.sql MSSQL upgrade 폴더 배치 + 조회 SP ORDER BY 결정론적
- [ ] (자연어 질의 대상) `tb_is_vwbusnss_ontlgy` 등록

### 테스트
- [ ] CRUD 플로우 · validRules required · 다국어 (ko/en/ja/zh) · 권한별 버튼 노출
- [ ] wingui 단독 기동 (mp/dp/bf/fp server 미기동) 으로 동작

---

## 11. Anti-pattern 카탈로그

상세 → `99-anti-patterns.md` · `99a-composer-anti-patterns.md`. 핵심만 표:

| 카테고리 | ❌ | ✅ | 검증 |
|---|---|---|---|
| 골격 | `ContentInner` 누락 · `gridItems` 컴포넌트 안 선언 | `21 §1` · `41a §4.3` | hook block |
| 컬럼 | `dataType` 누락 / `field:` / `textAlign:` | `name:` · `dataType:` · `textAlignment:` | hook block |
| Store | `useViewStore`에서 `activeViewId` 추출 | `useContentStore` | hook block |
| Form | datetime defaultValue `''` | `null` | LLM/L |
| 통신 | 신규 화면이 `callService` | `zAxios` REST | hook warn |
| 경로 | utility 도메인 `ut/` | `util/` | hook block |
| Java | `javax.*` import | `jakarta.*` | hook block |
| SQL | TB_AD_MENU 의 `MENU_NM`/`PARENT_MENU_CD` 등 허구 컬럼 | 실제 컬럼만 (`30 §5`) | hook block |
| 메뉴 | parent `MENU_UT` | `MENU_UTIL` | hook block |

---

## 관련 문서

- 컴포넌트 인벤토리: `21-components.md`
- FilterBar JSON: `22-filter-bar.md` + `.claude/schemas/filter-bar.schema.json`
- DB 스키마: `30-database-schema.md`
- SP: `31-stored-procedures.md`
- SQL 사전 검증: `32-sql-schema-verification.md`
- Composer 화면 생성: `41-composer-generation.md` + `41a/b/c/d`
- 안티패턴: `99-anti-patterns.md` + `99a-composer-anti-patterns.md`
