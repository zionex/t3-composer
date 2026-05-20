# 41. Composer 화면 생성 규칙 (Screen Generation Contract)

> **Composer 모든 모드** (`new_general` · `new_nl` · `new_step` · `new_from_design` · `new_from_copy` · `existing_modify`) 에 **예외 없이** 적용되는 단일 계약서.
>
> Composer 만의 새 prefix·URL·래퍼·관례 생성 금지. 기존 `Users` / `IssueMgmt` / `UserInfoMgmt` 와 **완전히 동일한 방식**으로 구현.
>
> **3단계 강제 체계**
> 1. **LLM** — `ComposerPromptBuilder.INVARIANTS` 가 모든 mode prompt 의 앞·뒤에 삽입
> 2. **저장** — `pre-tool-use-validator.sh` 가 Write/Edit 직전에 산출물 검증 (위반 block / warn)
> 3. **적용** — `ArtifactApplyService.checkWinguiNativePolicy` 가 apply 직전에 정책 검증 (실패 시 `policyBlocked:true`)

---

## 분리된 sub-rule 목차

| 파일 | 다루는 섹션 |
|---|---|
| **`41-composer-generation.md`** (이 문서) | §0 참조 원본 · §1 런타임 · §2 MENU_CD · §3 PARENT_MENU_CD · §10 MENU_SQL · §11 그리드 정렬/포맷 · §12 체크리스트 · §13 엔진 경유 예외 · §14 Anti-patterns |
| **`41a-composer-jsx.md`** | §4 JSX 표준 (Imports / BaseGrid / 그리드 컬럼 / 버튼 / zAxios / showMessage) + §0.6 레이아웃 변경 prop 명세 |
| **`41b-composer-java.md`** | §5 Java 백엔드 (정책 차단 / DDL·SP 정책 / import 화이트리스트 / 4종 세트 코드 템플릿 / 자기 검증) |
| **`41c-composer-widgets.md`** | §6 위젯 카탈로그 · §7 필드 주종관계 Cascade · §8 표준 POPUP 양식 · §9 공통코드 Dropdown 정책 |
| **`41d-composer-wizard.md`** | §15 세션 상태 전이 (COMPLETED 자동) · §16 통합 9-Step Wizard (NEW_STEP / NEW_FROM_COPY / NEW_FROM_DESIGN) |

---

## §0. 유사 화면 참조 (필수 첫 단계 · 생략 시 작업 거부)

### §0.1 기본 원칙 — "복제 + 치환" 이지 "LLM 재구성" 이 아니다

신규 화면, 특히 `NEW_FROM_COPY` 는 **원본 파일을 기계적으로 복제한 뒤 네이밍만 치환**하는 작업이다. LLM 이 "더 좋은 레이아웃" 을 상상해 새 wrapper/컴포넌트/prop 을 추가하는 것은 전부 금지. 유지보수자가 "원본과 복사본이 같은 사람이 만든 파일" 로 느껴야 한다.

작업 시작 전 **반드시** 유사 원본 2~3개를 `Read` 로 확인하고, 출력 맨 앞에 다음 블록을 명시한다:

```
참조 원본: <Original.jsx>, <OriginalService.java>, <OriginalController.java>, <OriginalEntity.java>
원본 import 리스트 (그대로 유지): @wingui/common/imports 의 X, Y, Z + @wingui/view/common/PopA, PopB
치환 매핑: UserInfoMgmt → <NewName>, user-infos → <new-url>, userInfoGrid → <newGridId>
원본에 없는 새 컴포넌트·wrapper·prop 추가 예정: 없음
```

### §0.2 표준 원본 (2026-04-27 SP 정책 전환 — 두 트랙으로 분리)

#### 트랙 A — 레이아웃 / cascade / 팝업 / 그리드 패턴 참조 (JSX 표면)
SCM 도메인의 실제 운영 화면들. 신규 화면 작성 시 layout / cascade / popup / 검색폼 등 **JSX 패턴**을 여기서 가져옴.
**단, 데이터 호출 부분은 트랙 B 의 새 표준으로 변환**.

| 카테고리 | 표준 원본 (우선순위) |
|---|---|
| 마스터 CRUD (단순) | `view/system/usermgmt/users/Users.jsx` · `view/util/issuemgmt/IssueMgmt.jsx` |
| 검색+주종관계 cascade | `view/baselineforecast/master/actualsales/ActualSales.jsx` |
| 컨트롤보드 (BF/DP — SP 기반 운영 화면) | `view/baselineforecast/version/controlboard/ControlBoard.jsx` · `view/demandplan/version/controlboard/BaseControlBoard.jsx` · `view/baselineforecast/version/iscontrolboard/IsControlBoard.jsx` |
| 검색+그리드 + 알림 (DP) | `view/demandplan/entry/entrynotify/EntryNotify.jsx` · `view/demandplan/setting/controlboardmaster/BaseControlBoardMaster.jsx` |
| 리포트 (DP) | `view/demandplan/report/compareverprogress/CompareVerProgress.jsx` |
| 변환·가공 (SO) | `view/supplyorder/sotransform/SoTransform.jsx` |
| 공용 팝업 | `view/common/PopSelectItem.jsx` (기준) · `PopDepartment` · `PopPosition` · `PopAccountMulti` |
| 크로스탭/마스터-디테일/대시보드 | `rules/20-screen-development.md §9 패턴별 스켈레톤` |

#### 트랙 B — 백엔드 SP 호출 패턴 (코드 템플릿 — 코드베이스에 기존 사례 없음)
2026-04-27 정책 전환으로 **wingui 단독 SP 호출** 패턴은 새로 도입됨. 코드베이스에 표준 원본이 없으므로 LLM 은 prompt 의 코드 템플릿을 따른다.

```java
// <Feature>Service.java — 새 표준 (B안)
@Service
@RequiredArgsConstructor
public class FeatureService {
    private final JdbcTemplate jdbcTemplate;
    private static final String SP_QUERY = "EXEC SP_UI_<DOMAIN>_<NO>_Q1 ?, ?";

    public List<Feature> search(String p1, String p2) {
        return jdbcTemplate.query(SP_QUERY,
            new BeanPropertyRowMapper<>(Feature.class), p1, p2);
    }
}
```

#### 트랙 C — JSX 데이터 호출 변환 규칙 (원본 → 신규)
원본의 데이터 호출 패턴이 무엇이든 신규 화면은 항상 트랙 B 로 변환:

| 원본 패턴 | 신규 패턴 |
|---|---|
| `zAxios.get('<url>', ...)` + JpaRepository (마스터 CRUD) | `zAxios.get('<NEW_url>', ...)` + Service.JdbcTemplate(`EXEC SP_UI_<NEW>_Q1`) |
| `callService('SRV_GET_SP_UI_<NO>_Q1', ...)` (BF/DP 엔진 경유) | `zAxios.get('<NEW_url>', ...)` + Service.JdbcTemplate(`EXEC SP_UI_<NEW>_Q1`) |
| `callService('SRV_UI_<NO>_<...>', ...)` (MP/CM/IM 엔진 경유) | `zAxios.get('<NEW_url>', ...)` + Service.JdbcTemplate(`EXEC SP_UI_<NEW>_<...>`) |

원본의 **callService 는 신규 화면에서 항상 제거** — wingui 단독 구동을 위해 RestController + JdbcTemplate 으로 변환. 단 원본의 SP 비즈니스 로직 (조회 컬럼, 저장 트랜잭션 등) 은 새 SP_UI_<NEW>_Q1/S1/D1 에 그대로 복제.

### §0.3 복제 7-Step 절차 (NEW_FROM_COPY 모드 필수)

1. **계획 선언** — 출력 맨 앞에 §0.1 블록 4줄 명시
2. **JSX 복제** — 원본 import 블록을 그대로 복사. 원본에 없는 심볼 추가 금지. gridItems 각 컬럼에 `fieldName` 필수, `textAlignment` 사용(textAlign 아님).
   - **예외**: 사용자 요구사항에 **명시적** 레이아웃 변경이 있을 때만 `41a §0.6` 절차를 따라 공용 컴포넌트 도입
3. **Entity 복제** — 기존 테이블 재사용이면 원본 Entity 의 모든 `@Column` 을 누락·추가 없이 복사 후 클래스명만 교체. 테이블에 없는 컬럼 추측 추가 절대 금지
4. **산출물** — JSX + MENU_SQL 만. DDL · Java 4종 세트 생성 금지 (기존 Controller URL 재사용)
5. **메뉴 SQL** — TB_AD_MENU + TB_AD_LANG_PACK(4언어) + TB_AD_PERMISSION_GROUP 형제 메뉴 복사
6. **자기 대조** — `§12.1` 의 "NEW_FROM_COPY 체크리스트" 전 항목 체크 후 명시
7. **변경 반영** — 사용자 '요구사항' 에 명시된 것만. 변경 지점 먼저 요약

### §0.4 금지 (NEW_FROM_COPY 에 추가 강제)

- 유사 원본을 읽지 않고 바로 작성 (자유 창작)
- 원본과 다른 파일 구조·import·네이밍
- 기존 공용 컴포넌트 (Pop\* / useFieldCascade) 재사용 안 하고 중복 구현
- 원본에 있는 요소를 '간소화' 라며 누락
- **원본에 없는 wrapper 추가** (`SplitPanel` / `GroupBox` / `FormArea` / `FormRow` / `FormItem` / `HLayoutBox` / `VLayoutBox` 임의 도입)
- **허구 prop 이름** (`initialSizes` · `minSizes` · `textAlign` 등 — 실제 API 가 아닌 이름 추측)
- **Entity 에 실제 테이블에 없는 컬럼** 추가 (예: `TB_UT_USER_INFO` 에 `EMP_NO`)
- **===FILE: 헤더 path 의 확장자를 underscore 로 작성** (`UI_UT_USER_INFO_MENU_sql`) — 정규 확장자는 dot (`.sql` / `.jsx` / `.java`). underscore 는 ArtifactExtractor 가 분류 실패해 MENU_SQL 아티팩트를 못 찾음. Hook (`composer-artifact-path.sh`) 자동 차단

### §0.5 케이스 스터디 — UserInfoMgmtV2 사고 (2026-04-24)

**사용자 요청**: `UserInfoMgmt` 복사해서 `UserInfoMgmtV2` 생성 (동일 테이블 재사용)

**LLM 실수 (5종 동시 발생)**:
1. 원본에 없는 `SplitPanel` + `initialSizes`/`minSizes` (허구 prop) 도입 → React DOM warning
2. BaseGrid 컬럼에 `fieldName` 누락 · `textAlign`(오탈) 사용 → `toUpperCase() of undefined` 500
3. Entity 에 테이블에 없는 `EMP_NO` 컬럼 추가 · 실존 컬럼 `USER_EMAIL/USER_TEL/USER_TP/JOIN_DT` 누락 → "Invalid column name" 500
4. Master 필드 (`PopDepartment`/`PopPosition` 등) 미사용 (자유 text) · `useFieldCascade`/`applyGridCascade` 누락
5. Service 에 실존하지 않는 `SpecificationBuilder`/`StringUtils.hasText` 사용 → 컴파일·런타임 오류

**근본 원인**: LLM 이 "참조 원본: UserInfoMgmt.jsx" 헤더만 적고 실제로는 원본을 복사하지 않음. "재구성" 을 시도.

**재발 방지**:
- LLM: `newStepGuide(StepGuideMode.COPY)` 의 복제 STEP A~H 절차화 + §0.1 계획 선언 블록 강제 (`41d §16.4.1`)
- Hook: SplitPanel 허구 prop / textAlign / fieldName 누락 / TB_UT_USER_INFO 허구 컬럼 감지 block
- 체크리스트: §12.1 에 "원본 import 리스트와 1:1 일치 확인" 체크박스

> **§0.6 레이아웃 변경 서브플로우는 `41a-composer-jsx.md` 로 이동** (NEW_FROM_COPY + 사용자 명시 요구 시 허용 공용 컴포넌트 prop 명세).

---

## §1. 런타임 구조

> **★ Target 런타임 환경 패리티** — 산출물(신규생성·복사·수정 모두)이 단독 환경 [화면 실행]
> 미리보기에서 동작하려면 `rules/50 §13.0` (Target 런타임 환경 패리티)를 따른다. 미리보기
> 환경(shim·registry·ambient·store)은 Target(wingui) 표면의 superset 으로 유지되며,
> 산출물은 그 표면(특히 `@wingui/common/imports` 의 실제 export — §13.1) 안에서만 작성한다.

### §1.1 wingui 단독 구동 + SP 기반 CRUD (2026-04-27 정책 전환)
- `wingui` = Tomcat + Spring Boot + JPA + REST Controller + **JdbcTemplate (SP 호출)**
- 외부 엔진 (mpserver/dpserver/fpserver) 기동 없이 모든 신규 화면이 동작해야 함
- **신규 화면은 SP 기반 CRUD 필수** — `SP_UI_<DOMAIN>_<NO>_<ACTION>` (Q1/S1/D1) DDL 생성 + RestController 가 JdbcTemplate 으로 SP 직접 호출
- 엔진 경유 (`callService` + `*_service.xml`) 는 BF/DP/MP/FP **계산 화면 수정** 전용 (§13). 신규 화면은 callService 사용 금지.

#### §1.1.1 NEW_FROM_COPY 예외 — JSX-only 복제 허용 (2026-04-29 추가)

`NEW_FROM_COPY` 모드는 본질적으로 "기존 화면 + 기존 backend 재사용" 케이스가 자연스러우므로 다른 신규 모드와 구분하여 다룬다:

| 시나리오 | 백엔드 4종 (Entity/Service/Controller/SP) | 정책 |
|---|---|---|
| **JSX-only 복제 (기존 endpoint 재사용)** | 모두 누락 OK | ✅ apply 허용 (`ArtifactApplyService` 정책 통과) |
| 새 SCREEN_NO 의 SP 가 필요한 복제 | Composer 가 함께 생성 권장 | ✅ 함께 생성 시 정상 apply |
| 부분 생성 (예: SP 만 있고 Service 없음) | 일부만 누락 | ⚠️ apply 진행하되 WARN 로그 (사용자 후속 채팅으로 보강) |

**판단 기준**: 사용자가 새 화면을 만들 때 원본 화면과 동일한 backend endpoint (예: `util/user-infos`) 를 호출하는 게 의도라면 JSX-only 가 정답. Composer 가 이걸 자동 판단하기 어려우므로 정책은 **NEW_FROM_COPY 모드에서 SP 누락을 차단하지 않음**. 새 SP 가 필요하면 사용자가 "SP 도 만들어줘" 라고 후속 채팅 요청.

다른 신규 모드 (`NEW_GENERAL`/`NEW_NL`/`NEW_STEP`/`NEW_FROM_DESIGN`) 는 SP_UI_*.sql 필수 차단 정책 그대로 유지.

### §1.2 메뉴 트리 로딩
| 출처 | 사용 시점 |
|---|---|
| **DB `TB_AD_MENU`** + `TB_AD_LANG_PACK` | 프로덕션 (`uiSettings.mode !== 'develop'`) |
| `packages/wingui/src/data/menus.js` | develop 모드 |

→ Composer 는 **TB_AD_MENU INSERT** 가 필수, `menus.js` 는 선택.

### §1.3 라우팅 변환식 (`contentStore.js:569`)
```js
filepath = view.filePath.toLowerCase() + view.filePath.slice(view.filePath.lastIndexOf('/'))
React.lazy(() => import('@wingui/view' + filepath))
```

---

## §2. MENU_CD / MENU_FILE_PATH / MENU_PATH 규약

### §2.1 MENU_CD (leaf 메뉴)
```
MENU_CD = UI_<DOMAIN>_<SCREEN_NAME>
정규식: ^UI_(AD|BF|CM|DP|DPD|FO|FP|IM|MP|RP|SA|SALES|SO|UT)_[A-Z][A-Z0-9_]*$
```
- 그룹 노드는 `MENU_<DOMAIN>` (Composer 가 신규 생성 금지)

### §2.2 MENU_FILE_PATH
```
/<module>[/<category>]/<PascalComponentName>
```
- 마지막 직전 세그먼트 ≠ `lowercase(마지막)` (자동 추가 폴더와 이중화 금지)
- `.jsx` 확장자 포함 금지

| 예 | 결과 JSX |
|---|---|
| `/util/UserInfoMgmt` | `view/util/userinfomgmt/UserInfoMgmt.jsx` |
| `/snop/dashboard/ExecutiveDashboard` | `view/snop/dashboard/executivedashboard/ExecutiveDashboard.jsx` |
| ❌ `/util/userinfomgmt/UserInfoMgmt` | 자동 추가 폴더와 이중화 → `view/util/userinfomgmt/userinfomgmt/UserInfoMgmt.jsx` (없음) |

### §2.3 MENU_PATH
```
MENU_PATH = LOWER(MENU_FILE_PATH)
```
- 모두 lowercase, `/` 로 시작, 한 URL = 한 MENU_CD (1:1)

---

## §3. 부모 메뉴 코드 (PARENT_MENU_CD)

| 모듈 | parent MENU_CD |
|---|---|
| util | `MENU_UTIL` (❌ `MENU_UT` 아님) |
| demandplan | `MENU_DP` |
| masterplan | `MENU_MP` |
| factoryplan | `MENU_FP` |
| baselineforecast | `MENU_BF` |
| inventory | `MENU_IM` |
| replenishmentplan | `MENU_RP` |
| sales | `MENU_SA` |
| system | `MENU_AD` |

---

## §4~§9 (분리됨)

| 섹션 | 파일 |
|---|---|
| §4 JSX 표준 (wingui 네이티브) · §0.6 레이아웃 변경 prop 명세 | **`41a-composer-jsx.md`** |
| §5 Java 백엔드 표준 · DDL/SP 정책 · import 화이트리스트 | **`41b-composer-java.md`** |
| §6 위젯 카탈로그 · §7 Cascade · §8 POPUP 양식 · §9 공통코드 Dropdown 정책 | **`41c-composer-widgets.md`** |

---

## §10. MENU_SQL 템플릿

```sql
-- (1) 메뉴 등록
INSERT INTO TB_AD_MENU (
    ID, PARENT_ID, MENU_CD, MENU_PATH, MENU_SEQ, MENU_FILE_PATH, USE_YN, CREATE_BY, CREATE_DTTM
)
SELECT LOWER(REPLACE(NEWID(), '-', '')),
       (SELECT ID FROM TB_AD_MENU WHERE MENU_CD = 'MENU_UTIL'),     -- 실제 부모 (§3)
       'UI_UT_USER_INFO_MGMT',                                       -- §2.1 형식
       N'유틸리티 > 사용자정보 관리',
       110,
       '/util/UserInfoMgmt',                                          -- §2.2 단일 세그먼트 + PascalCase
       'Y', 'composer', GETDATE()
WHERE NOT EXISTS (SELECT 1 FROM TB_AD_MENU WHERE MENU_CD = 'UI_UT_USER_INFO_MGMT');

-- (2) 다국어 라벨 (ko/en/ja/zh 4개)
INSERT INTO TB_AD_LANG_PACK (LANG_CD, LANG_KEY, LANG_VALUE, CREATE_BY, CREATE_DTTM)
SELECT 'ko', 'UI_UT_USER_INFO_MGMT', N'사용자정보 관리', 'composer', GETDATE()
 WHERE NOT EXISTS (SELECT 1 FROM TB_AD_LANG_PACK WHERE LANG_CD='ko' AND LANG_KEY='UI_UT_USER_INFO_MGMT');
-- (en/ja/zh 동일)

-- (3) 권한 — 형제 메뉴 복사
DECLARE @SRC CHAR(32) = (SELECT ID FROM TB_AD_MENU WHERE MENU_CD = 'UI_UT_ISSUE_MGMT');
DECLARE @NEW CHAR(32) = (SELECT ID FROM TB_AD_MENU WHERE MENU_CD = 'UI_UT_USER_INFO_MGMT');

INSERT INTO TB_AD_PERMISSION_GROUP (ID, GRP_ID, MENU_ID, PERMISSION_TP, USABILITY, CREATE_BY, CREATE_DTTM)
SELECT REPLACE(NEWID(),'-',''), p.GRP_ID, @NEW, p.PERMISSION_TP, p.USABILITY, 'composer', GETDATE()
  FROM TB_AD_PERMISSION_GROUP p
 WHERE p.MENU_ID = @SRC
   AND NOT EXISTS (SELECT 1 FROM TB_AD_PERMISSION_GROUP x
                    WHERE x.MENU_ID = @NEW AND x.GRP_ID = p.GRP_ID AND x.PERMISSION_TP = p.PERMISSION_TP);
```

**TB_AD_MENU 실제 컬럼만 사용**: `ID · PARENT_ID · MENU_CD · MENU_PATH · MENU_SEQ · MENU_FILE_PATH · USE_YN + BaseEntity`. ❌ `MENU_NM · PARENT_MENU_CD · URL · DEPTH · SORT_ORDER` 존재 안 함 (메뉴 표시명은 TB_AD_LANG_PACK).

**TB_AD_LANG_PACK 실제 컬럼**: `LANG_CD · LANG_KEY · LANG_VALUE · CREATE_BY · CREATE_DTTM · MODIFY_BY · MODIFY_DTTM`. ❌ `UPDATE_BY · UPDATE_DTTM` 존재 안 함.

---

## §11. 그리드 정렬 / 편집기 / 날짜 포맷

### §11.1 정렬 규약
- **LEFT (기본)**: 이름·이메일·주소·자유 텍스트 (`textAlignment` 생략)
- **CENTER**: 코드·날짜·boolean·선택 enum·등록자·일시
- **RIGHT (`'far'`)**: 숫자

### §11.2 편집기 매트릭스 (editable:true 컬럼은 의미별 editor 필수)

| 데이터 | 편집기 |
|---|---|
| 자유 텍스트 | (기본) |
| 숫자 | `editor:{type:'number'}` + `numberFormat` |
| 코드+명 enum | **`useDropdown:true` + `lookupDisplay:true` + `values+labels`** (셋 누락 시 자유 text) |
| 동적 dropdown | `useDropdown:true` + `setColumnProperty(name,'values',...)` + `('labels',...)` |
| Y/N boolean | `dataType:'boolean'` (자동 CheckBox) |
| 단일 일자 | `dataType:'datetime'` + `displayType:'date'` + `editor:{type:'date', datetimeFormat:'yyyy-MM-dd'}` |
| 마스터 코드 | `applyGridCascade` 자동 주입 (`41c §7`) |

**일관성 강제**: 검색조건이 dropdown 인데 그리드는 자유 text = 가장 흔한 누락. 출력 직전 모든 `editable:true` 컬럼 1개씩 점검.

### §11.3 날짜 포맷 (전역)
- 단일 일자: **`yyyy-MM-dd`**
- 일시: **`yyyy-MM-dd HH:mm:ss`**
- 검색 form: `getDateInputProps()` 헬퍼 사용
- 그리드 편집: `editor:{type:'date', datetimeFormat:'yyyy-MM-dd'}`
- 기간 선택: `<InputField type="dateRange" displayType="date">`

---

## §12. 작업 산출물 체크리스트

### §12.1 파일

**공통 (모든 케이스에 반드시 필요)**
- [ ] **JSX**: `packages/wingui/src/view/<module>/<lowercase>/<PascalCase>.jsx`
- [ ] **MENU_SQL**: TB_AD_MENU + TB_AD_LANG_PACK + TB_AD_PERMISSION_GROUP 등록
- [ ] **SP_UI_\*.sql DDL (필수)** — `t3series-database/mssql/upgrade/vX.Y.Z-YYYYMMDD/procedures/`
  - CRUD 액션마다 1개씩: `SP_UI_<DOMAIN>_<NO>_Q1` (조회) · `_S1` (저장) · `_D1` (삭제)
  - read-only 화면은 `_Q1` 만으로도 OK
  - **MSSQL 방언만 작성** (memory 의 "MSSQL only" 규칙 — Oracle 폴더 생성 금지)
  - 조회 SP 는 결정론적 `ORDER BY` 필수 (`rules/31 §9`)
- [ ] **RestController + Service**: `JdbcTemplate.queryForList("EXEC SP_UI_<...> ?, ?", params)` 패턴
- [ ] **JPA Entity**: 응답 매핑용 (`@Entity` extends BaseEntity) — 스키마 매핑만, Repository 는 선택

**NEW_FROM_DESIGN / NEW_FROM_COPY / NEW_STEP — 기존 Table/View 재사용 (원칙)**
- [ ] 새 테이블 DDL (`SQL_DDL` 아티팩트) **생성 금지** (`41b §5.1` 정책 C 차단)
- [ ] Entity 는 기존 것 재사용 · 새 SP 는 모든 모드에서 생성 가능 (위 공통 항목)
- [ ] 새 도메인·새 스키마가 꼭 필요하면 [가정] 태그로 NL 모드 전환을 안내

**NEW_NL / NEW_GENERAL — 자유 도메인 (새 테이블 DDL 허용)**
- [ ] 새 테이블이 명확히 필요한 경우 DDL + SP_UI_\*.sql + RestController 함께 생성
- [ ] **테이블 DDL**: `t3series-database/mssql/upgrade/vX.Y.Z-YYYYMMDD/tables/<TABLE>.sql`
- [ ] **SP DDL**: 동일 폴더의 `procedures/SP_UI_<...>.sql`

> 정책 차단 조건 3가지는 `41b §5.1` 참조.

### §12.2 신규 화면에 **불필요** (생성 금지)
- [ ] ❌ `config/<DOMAIN>/UI_*_service.xml` 엔진 XML — wingui 단독 구동 위반
- [ ] ❌ 외부 엔진 서버 (mpserver/dpserver) 기동 의존
- [ ] ❌ `callService(...)` 엔진 경유 호출 — BF/DP/MP/FP 계산 화면 수정 전용

### §12.3 자체 검증 (Composer 출력 직전)
- [ ] 출력 맨 앞에 `참조 원본: <파일1>, <파일2>` 명시
- [ ] MENU_CD = `UI_<DOMAIN>_<NAME>` · MENU_FILE_PATH 단일/카테고리 세그먼트 · MENU_PATH = LOWER
- [ ] BaseGrid: `items={...} afterGridCreate={...} id="<str>"` (columns/afterCreate 아님) (`41a §4.2`)
- [ ] **모든 그리드 컬럼에 `dataType` 명시** (text/number/datetime/boolean/group) — 누락 시 화면 즉시 크래시 (`41a §4.3`)
- [ ] **Zustand store 매핑 정확** — `activeViewId` ← `useContentStore` · `setViewInfo` ← `useViewStore` (`41a §4.6`)
- [ ] 그리드 버튼: `grid="<string-id>"` (객체 X) (`41a §4.4`)
- [ ] Java 4종 세트 모두 포함 (NEW_NL 모드만 — `41b §5.4`)
- [ ] 검색 조건 모든 필드에 의미별 위젯 적용 (자유 text 남발 X) (`41c §6.1`)
- [ ] **그리드 모든 editable:true 컬럼에 의미별 editor 명시** (가장 빈번한 누락) (§11.2)
- [ ] **`useForm({ defaultValues })` 의 datetime 필드는 `null`** (`''` 금지 — Invalid Date 발생). number→null·check→false·multiSelect/autocomplete-multi→[]·dateRange→[null,null] (`21-components.md §3.1.0`)
- [ ] 정렬: LEFT/CENTER/far 명시 (§11.1)
- [ ] 날짜: `datetimeFormat:'yyyy-MM-dd'` 또는 `'yyyy-MM-dd HH:mm:ss'` (§11.3)
- [ ] Master 필드는 Pop\* 연결 (자유 text 금지) (`41c §6.1`)
- [ ] 공통코드는 `<InputField type="select" options=[...]>` (산출물에 `CommonCodeSelect` import 금지 — preview shim 전용, `41c §9`)
- [ ] useForm 있으면 `useFieldCascade` · 그리드면 `applyGridCascade` 호출 (`41c §7.2`)

---

## §13. 예외 — 엔진 경유 화면 (BF/DP/MP/FP 계산 기반)

기존 화면이 이미 `engine/<target>/<service>` 방식으로 동작하는 경우:
- 수정 범위 내에서 **기존 방식 유지**
- 신규 SP/XML 은 **명시적 사용자 요청** 시에만 작성
- target: `mp` | `dp` | `bf` | `fp` (PlatformService.Module enum 4개만)
- callService 시그니처: `callService(serviceId, paramMap, target)`

**도메인-서버 매핑** (수정 시 참고):
- BF/DP → dpserver (`SRV_GET_SP_UI_*` / `SRV_SET_SP_UI_*`)
- MP/CM/IM/RP/SO → mpserver (`SRV_UI_<DOMAIN>_<NO>_<ACTION>`)
- FP → fpserver

---

## §14. Anti-patterns (Hook 차단 대상)

> 각 항목의 ✅ 정답·세부 코드는 sub-rule 참조.

| # | ❌ | ✅ | 참조 |
|---|---|---|---|
| **참조** | 유사 원본 안 읽고 자유 창작 | Read 2~3개 후 출력 맨 앞 `참조 원본:` 명시 | §0.1 |
| **⛔ ut/ 패키지·URL** | `web/domain/ut/userinfo/` 패키지 · `@RequestMapping("/ut/...")` · `zAxios.get('ut/...')` · `view/ut/...` JSX 경로 — 그 어떤 표면에서도 절대 금지 (2026-04-29 강력 차단) | utility 도메인은 **`util/` 단 하나**. 패키지=`web/domain/util/<feature>/` · URL=`/util/...` · zAxios=`'util/...'` · JSX=`view/util/<lowercase>/` · MENU_FILE_PATH=`/util/<PascalName>` (예외: MENU_CD prefix `UI_UT_*` 만 정상) | `CLAUDE.md §1.-1` · `99-anti-patterns.md §0` · hook `path-convention.sh` |
| **MENU_CD** | `UT_USER_INFO_MGMT` (UI_ 누락) · `MENU_UT_*` (그룹 prefix) · 소문자/하이픈 | `UI_UT_USER_INFO_MGMT` | §2.1 |
| **MENU_FILE_PATH** | `/util/userinfomgmt/UserInfoMgmt` (이중) · `.jsx` 확장자 · 마지막 lowercase | `/util/UserInfoMgmt` | §2.2 |
| **===FILE: 확장자 환각** | `UI_UT_USER_INFO_MENU_sql` (underscore) → ArtifactExtractor 가 TYPE_OTHER 로 분류 → "MENU_SQL 아티팩트가 없습니다" 에러로 메뉴 등록 불가 | 정규 확장자 dot — `.sql` / `.jsx` / `.java` / `.tsx` | hook H (`composer-artifact-path.sh`) · `99a §G CG-G1` |
| **parent** | `MENU_UT` | `MENU_UTIL` | §3 |
| **BaseGrid** | `columns={...} afterCreate={...}` | `items={...} afterGridCreate={...}` | `41a §4.2` |
| **컬럼 key** | `field:` · `type:'combo', items:[]` | `name:` · `useDropdown:true + lookupDisplay + values + labels` | `41a §4.3` |
| **컬럼 dataType 누락** | `{ name:'X', headerText:'..' }` (dataType 없음) → BaseGrid.jsx:1016 `toLowerCase()` TypeError 즉시 크래시 | 모든 컬럼에 `dataType: 'text'\|'number'\|'datetime'\|'boolean'\|'group'` | `41a §4.3` |
| **defaultValues datetime ''** | `useForm({ defaultValues: { regDt: '' } })` → datetime picker 가 `new Date('')` → Invalid Date → 매 keystroke RHF validator throw + RangeError | `datetime → null` · `dateRange → [null,null]` · `number → null` · `check → false` · `multiSelect → []` · text 만 `''` | `21-components §3.1.0` · `99a CG-C13` |
| **그리드 enum 편집** | `lookupDisplay:true` 만 (useDropdown 누락) | 4개 모두 | §11.2 |
| **Store swap** | `activeViewId` ← `useViewStore` / `setViewInfo` ← `useContentStore` (selector undefined → `setViewInfo is not a function`) | `activeViewId` ← `useContentStore` · `setViewInfo` ← `useViewStore` | `41a §4.6` |
| **callService** | `callService({url,params})` · target='common' · `'SP_UI_*'` 첫인자 | `callService(serviceId, paramMap, target)` (BF/DP/MP/FP 계산 화면 전용) | §13 |
| **신규 화면 통신** | callService / engine 경유 | `zAxios.get('<m>/<fs>')` REST → RestController + JdbcTemplate SP 호출 | `41a §4.5` |
| **MENU_CD V-접미어 URL 전파** | MENU_CD `_V2` 라서 zAxios URL 도 `'util/dept-mgmt-v2'` 로 환각 → Controller `@RequestMapping("/util/dept-mgmt")` 와 불일치 → 404 (2026-04-30 DeptMgmt V2 사고) | V2 distinction 은 메뉴 코드 한정. zAxios URL 은 항상 Controller `@RequestMapping` 과 1:1 일치. 백엔드는 단일 자원 공유가 기본 | `41a §4.5.1` · hook `CG-URL-VSFX` |
| **신규 화면 SP 누락** | SP_UI_\*.sql 없이 JPA Repository 만으로 CRUD | **SP_UI_<DOMAIN>_<NO>_Q1/S1/D1 필수 생성** + RestController 가 JdbcTemplate 으로 호출 | `41b §5.1` |
| **신규 화면 엔진 XML** | `mp/dp/bf/fp server/config/*_service.xml` 생성 | wingui 단독 구동 — RestController 가 직접 SP 호출 | `41b §5.1` |
| **showMessage** | `showMessage('confirm', msg, cb)` | `showMessage('확인', msg, cb)` (제목은 문자열) | `41a §4.6` |
| **grid API** | `grid.setData / getChangedData / getChanges` | `grid.dataProvider.fillJsonData / getAllStateRows / getJsonRow` | `41a §4.2` |
| **Grid 버튼 prop** | `grid={gridStateRef}` | `grid="userInfoGrid"` | `41a §4.4` |
| **globalButtons** | `{code, onClick}` | `{name, action}` | `41a §4.6` |
| **import 경로** | `@wingui/common/store/*` · `@zionex/wingui-core/*` 직접 | `@wingui/common/imports` 단일 | `41a §4.1` |
| **Master 필드** | 자유 text 입력 | Pop* (PopSelectItem/PopDepartment 등) | `41c §6.1` |
| **부재 Pop\* import** | `import PopDepartment from '@wingui/view/common/PopDepartment'` 처럼 실재 파일 검증 없이 import → webpack "Module not found" 빌드 깨짐 (2026-04-29 사고) | JSX 출력 직전 모든 `view/common/X` import 의 파일 존재 확인. 부재 시 ① 일반 InputField 대체 ② Pop\* 파일도 산출물에 함께 포함 | `41c §6.0` |
| **공통코드** | 산출물에 `import CommonCodeSelect from '@wingui/view/common/CommonCodeSelect'` (preview shim 전용, wingui 본 환경에 없음) | `<InputField type="select" options=[{value,label},...]>` — 동적이면 onMount 에 `zAxios.get('/system/common/codes',{params:{'group-cd':...}})` | `41c §9` |
| **type="action"** | `<InputField type="action" .../>` (자기닫힘 = 빈 버튼) · `InputProps.endAdornment` | `<InputField type="action" readonly={true} ...><SearchIcon/></InputField>` | `41c §6.2` |
| **그리드 button 수동** | 컬럼에 `button:'action', buttonVisibility:'always'` 직접 | `applyGridCascade` 가 자동 주입 | `41c §6.3` |
| **Cascade** | parent 잘못 모델링 (예: `deptCd → positionCd`) | 독립 마스터는 popup-only | `41c §7.5` |
| **POPUP confirm** | 단건 객체 반환 가정 | 항상 배열 · `firstOf()` 추출 | `41c §8.4` |
| **외부 엔진 의존** | 신규 화면이 mpserver/dpserver 기동 필요 | wingui 단독 구동 | §1.1 |
| **javax import (Spring Boot 3)** | `import javax.persistence.*` · `javax.servlet.*` · `javax.validation.*` | `jakarta.persistence.*` · `jakarta.servlet.*` · `jakarta.validation.*` | `41b §5.5.1` |
| **허구 BaseEntity** | `com.zionex.t3series.web.domain.BaseEntity` | `com.zionex.t3series.web.util.audit.BaseEntity` | `41b §5.5` |
| **허구 유틸 import** | `SpecificationBuilder` · `QueryDslBuilder` 등 프로젝트에 없는 클래스 import | Criteria API (`cb.like`/`cb.equal`) 직접 작성 | `41b §5.5` |
| **MultipartHttpServletRequest** | Controller 저장에서 `MultipartHttpServletRequest request` 파라미터 | `HttpServletRequest` + `request.getParameter(ServiceConstants.PARAMETER_KEY_DATA)` | `41b §5.6.3` |
| **세션 자동전이** | LLM/클라이언트가 세션 status 를 직접 `COMPLETED` 로 세팅 | 서버 자동 전이에 맡김 (메뉴등록 + 아티팩트 적용 모두 FINAL) | `41d §15.5` |
| **Wizard 단일호출** | `ModeNewFromCopy/Design` 가 `createSession` 직접 호출 | `prefilledSpec` + `mode` prop 으로 `StepByStepWizard` 위임 | `41d §16.6` |
| **AI prefill 환각** | AI 가 `source='SP'` 라며 spName/crudSp/allSpNames 모두 빈 string → 화면 빈 칸 | `mergeAiSpecIntoBaseSpec` step4 특수 처리 — baseline 우선 | `41d §16.4.2` |
| **Step3 buttons 호환** | `buttons.includes('save')` (string 배열만 가정) → AI 객체 배열 prefill 시 미인식 | `buttonsToKeySet` 로 객체 배열도 호환 | `41d §16.6` |
| **Step4 default source** | 모든 모듈에서 `JPA_ENTITY` default | `defaultSourceFor(moduleCode)` — BF/DP/MP/FP→SP, 그 외→JPA_ENTITY | `41d §16.4.2` |
| **invalidateDownstream stepIndex 매핑 오류** | `case 1` 이 stepIndex=1(Step2) 에 매칭 → Step2 진입만 해도 step3~6 리셋 | `case 0` (Step1 Layout) + areaId 보존 로직 | `41d §16.6` |
| **areaId mismatch** | BaseGrid 추출 실패 시 layer.key='mainGrid' 인데 step3/4 키는 BaseGrid id | `reconcileStep3WithAreas` / `reconcileStep4WithAreas` 강제 정합화 | `41d §16.4.2` |
| **SP grep 누락** | callService 패턴 한 가지에만 의존 → 변수 경유/XML/JdbcTemplate SP 미인식 | `grepSpNamesFromBundle` — sourceBundle 모든 텍스트 grep + suffix CRUD 분류 | `41d §16.4.2` |

---

## 관련 파일

| 위치 | 역할 |
|---|---|
| `.claude/rules/41-composer-generation.md` | (이 문서) — 골든룰 + §0~§3 + §10~§14 |
| `.claude/rules/41a-composer-jsx.md` | §4 JSX 표준 + §0.6 prop 명세 |
| `.claude/rules/41b-composer-java.md` | §5 Java 백엔드 + DDL/SP 정책 |
| `.claude/rules/41c-composer-widgets.md` | §6~§9 위젯/Cascade/POPUP/CommonCode |
| `.claude/rules/41d-composer-wizard.md` | §15 세션 전이 + §16 9-Step Wizard |
| `.claude/rules/99-anti-patterns.md` | CG 시리즈 통합 안티패턴 |
| `.claude/hooks/pre-tool-use-validator.sh` | Write/Edit 시 자동 차단 |
| `.claude/hooks/user-prompt-context-injector.sh` | composer 키워드 감지 시 규약 주입 |
| `ComposerPromptBuilder.java` | LLM system prompt (INVARIANTS + mode guides) |
| `ArtifactApplyService.java` | 서버 적용 시 wingui 네이티브 정책 검증 |
| `packages/wingui/src/common/imports.js` | JSX import 단일 표면 |
| `packages/wingui/src/common/fieldCascade.js` | 주종관계 레지스트리 |
| `web/domain/admin/user/UserController.java` | wingui REST 관례 원본 |
| `web/domain/util/userinfo/` | 최신 Composer 산출물 |
