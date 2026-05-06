# 41c. Composer — 위젯 / Cascade / POPUP / CommonCodeSelect

> **상위 규칙**: `41-composer-generation.md` 의 §6~§9 분리.
> Composer 모든 모드에서 사용하는 공용 위젯 / 필드 주종관계 / 표준 팝업 양식 / 공통코드 드롭다운의 단일 진실 저장소.

---

## §6.0 ⛔ 사전 검증 — 존재하지 않는 Pop\* 컴포넌트 import 절대 금지

> **2026-04-29 사고**: Composer 가 `UserInfo.jsx` 에 `import PopDepartment from
> '@wingui/view/common/PopDepartment'` 를 작성했지만 해당 파일을 만들지 않아 webpack
> "Module not found" 로 빌드 깨짐. 사용자 강력 차단 요청.

§6.1 의 위젯 매트릭스 와 §8 의 Pop 인벤토리 표는 **이름 카탈로그** 이지 **존재 보장** 이 아니다.
"Rule 에 적혀 있으니까 사용 가능" 이라는 가정은 절대 금지.

### §6.0.1 JSX 출력 직전 의무 검증

모든 `import X from '@wingui/view/common/Y'` 에 대해:

```bash
# Y.jsx 가 실제로 존재하는지 확인 (LLM 은 Glob/Read 로 검증)
ls t3series-wingui/packages/wingui/src/view/common/Y.jsx
```

부재 시 **두 갈래로만** 진행:

| 케이스 | 처리 |
|---|---|
| 사용자 요청이 단순 화면 / 최소 구현 / "popup 빼줘" 등 | 일반 `<InputField>` 텍스트 입력으로 대체 — 부재 컴포넌트 import 라인·상태·콜백·렌더 모두 제거 |
| Master 필드라 popup 이 필수 (부서/직위/품목/거래처 등) | Pop\* 파일 (`view/common/Pop<X>.jsx`) 도 산출물 세트에 함께 포함 — `PopSelectItem.jsx` 양식 그대로 복제 (§8) + 백엔드 옵션 endpoint 추가 |

### §6.0.2 절대 금지

- 부재 파일을 import 한 채로 산출물 마감
- "표준 양식이니까 있을 것" 이라는 추측 (특히 PopDepartment/PopPosition)
- 산출물 마감 직전 import 리스트 점검 누락

### §6.0.3 현재 (2026-04-29 기준) `view/common/` 실재 Pop\* 파일

✅ 존재 — 자유롭게 import 가능:
- `PopSelectItem` · `PopItemMulti` · `PopSelectAccount` · `PopAccountMulti`
- `PopSelectLvlAndAcct` · `PopSelectLvlAndItem`
- `PopLocatMst` · `PopLocatTp` · `PopLocatTpMulti`
- `PopResourceMulti` · `PopRouteMulti`
- `PopPersonalize` · `PopPersonalizeDp` · `PopKpiWeightConfig`
- `LogPopup`

❌ 미존재 — 사용 시 반드시 같이 생성하거나 일반 input 으로 대체:
- `PopDepartment` · `PopPosition` (§6.1·§8 표에 있지만 실제 파일은 없음)
- 그 외 §6.1 표에 적혀 있어도 위 ✅ 리스트에 없는 모든 항목

> 새로 Pop\* 파일을 만든 경우 이 리스트에 추가하는 PR 권장.

---

## §6. 공용 위젯 카탈로그

### §6.1 위젯 매트릭스 (필드 의미별 필수 적용)

| 필드 의미 | 검색 조건 (form) | 그리드 컬럼 (cell) |
|---|---|---|
| 코드 PK (USER_ID 등) | `<InputField type="text">` | `dataType:'text'` + `textAlignment:'center'` + 신규행만 editable (styleCallback) |
| 이름·자유 텍스트 | `<InputField type="text">` | `dataType:'text'` (LEFT 기본) |
| 코드형 식별자/전화번호 | `<InputField type="text">` | `dataType:'text'` + `textAlignment:'center'` |
| 숫자 (수량·금액) | `<InputField type="number">` | `dataType:'number'` + `textAlignment:'far'` + `numberFormat` |
| Y/N boolean | `<CommonCodeSelect groupCd="USE_YN">` (또는 `type="check"`) | `dataType:'boolean'` + `textAlignment:'center'` (자동 CheckBox) + `toBool/toYN` |
| 코드 + 명 (소량 enum) | `<CommonCodeSelect groupCd="...">` | `useDropdown:true` + `lookupDisplay:true` + `values:[...]` + `labels:[...]` + `textAlignment:'center'` |
| 단일 일자 | `<InputField type="datetime" displayType="date" {...getDateInputProps()}>` | `dataType:'datetime'` + `displayType:'date'` + `datetimeFormat:'yyyy-MM-dd'` + `editor:{type:'date'}` + `textAlignment:'center'` |
| 일시 (CREATE_DTTM 등) | (보통 검색 X) | `dataType:'datetime'` + `datetimeFormat:'yyyy-MM-dd HH:mm:ss'` + `textAlignment:'center'` |
| 기간 FROM~TO | `<InputField type="dateRange" displayType="date">` | (그리드는 단일 일자 컬럼 2개) |
| **부서 / 조직** | `<InputField type="action" readonly={true} onClick={openPop}><SearchIcon/></InputField>` + `<PopDepartment>` | 셀 더블클릭/액션버튼 → `PopDepartment` (applyGridCascade 자동 wiring) |
| **직위** | 동일 | `<PopPosition>` |
| 품목 단/다건 | `PopSelectItem` / `PopItemMulti` | 동일 |
| 거래처 단/다건 | `PopSelectAccount` / `PopAccountMulti` | 동일 |
| 거점 단/다건 | `PopLocatMst` / `PopLocatTpMulti` | 동일 |
| 자원 / 라우트 복수 | `PopResourceMulti` / `PopRouteMulti` | — |
| 사용자 / PlanScope / 시뮬버전 | `UserInputField` / `PlanScope` / `loadRecentSimulationVersion()` | — |

**원칙**:
- Master 로 관리되는 모든 필드는 **기본 POPUP** (자유 text 입력 금지)
- 신규 마스터 팝업은 **PopSelectItem 양식** 그대로 복제 (§8 표준 양식)

### §6.2 검색조건 팝업 트리거 (`type="action"` + children 필수)
```jsx
import SearchIcon from '@mui/icons-material/Search';

<InputField
  control={control} type="action" name="deptNm" label="부서" title="부서 검색"
  readonly={true}                              // ★ readOnly(camel) 가 아닌 readonly(lowercase)
  onClick={() => setDeptPopupOpen(true)}
>
  <SearchIcon fontSize="small" />              // ★ children 필수 (없으면 빈 버튼)
</InputField>
```
- `<InputField type="action" .../>` 자기닫힘 = 빈 버튼 (금지)
- `InputProps.endAdornment` = 미동작 (금지)

### §6.3 그리드 셀 팝업 트리거 (자동)
컬럼 정의에 `button:'action'` / `buttonVisibility:'always'` **수동 지정 금지** — `applyGridCascade` (§7) 가 레지스트리의 `popup` 정의된 컬럼에 자동 주입.

---

## §7. 필드 주종관계 Cascade — Column-Name 기반 자동

### §7.1 단일 진실 저장소
**`packages/wingui/src/common/fieldCascade.js` (`FIELD_CASCADE_REGISTRY`)**

```js
export const FIELD_CASCADE_REGISTRY = {
  // 주종관계 (parent + filterParam)
  itemLvCd:   { parent: 'planScope', filterParam: 'planScope', popup: 'PopSelectLvlAndItem' },
  itemCd:     { parent: 'itemLvCd',  filterParam: 'itemLvCd',  popup: 'PopSelectItem',      pairNameField: 'itemNm' },
  salesLvCd:  { parent: 'planScope', filterParam: 'planScope', popup: 'PopSelectLvlAndAcct' },
  accountCd:  { parent: 'salesLvCd', filterParam: 'salesLvCd', popup: 'PopSelectAccount',   pairNameField: 'accountNm' },
  locatCd:    { parent: 'locatTpCd', filterParam: 'locatTpCd', popup: 'PopLocatMst',        pairNameField: 'locatNm' },
  mainVerCd:  { parent: 'planScope', filterParam: 'planScope' },
  simulVerCd: { parent: 'mainVerCd', filterParam: 'mainVerCd' },

  // popup-only (parent 없음 · 단순 마스터 · 버튼만 자동 주입)
  deptCd:     { popup: 'PopDepartment', pairNameField: 'deptNm',
                optionsUrl: 'util/user-infos/departments' },
  positionCd: { popup: 'PopPosition',   pairNameField: 'positionNm',
                optionsUrl: 'util/user-infos/positions' },
};
```

### §7.2 사용법

**검색 form**:
```jsx
useFieldCascade({ control, setValue, getValues });   // 한 줄 = 레지스트리의 모든 관계 자동 적용

<PopPosition {...buildPopupFilterProps('positionCd', getValues)} />   // popup 필터 자동 전달
```

**그리드**:
```jsx
const afterGridCreate = useCallback((gridObj) => {
  setGrid(gridObj);
  applyGridCascade(gridObj, gridItems, {
    onCellPopupRequest: (rowIndex, columnName, parentValues) => {
      setGridPopupRow(rowIndex);
      setGridPopupFilter(parentValues);
      if (columnName === 'positionCd') setGridPosPopupOpen(true);
    },
  });
}, []);

<PopPosition open={open} confirm={onConfirm} {...gridPopupFilter} />
```

### §7.3 자동 동작
- 부모 값 변경 → 자식 + 짝 *Nm + 손자 자동 clear
- 자식 컬럼 셀 → action 버튼 + dblclick 핸들러 자동 wiring
- 팝업 호출 시 같은 row 부모값 자동 주입

### §7.4 새 관계 추가 절차
1. `fieldCascade.js` 의 `FIELD_CASCADE_REGISTRY` 에 엔트리 추가
2. 대응 Controller 의 옵션 GET 엔드포인트에 `@RequestParam <filterParam>` 추가 + Specification 반영
3. 대응 `Pop<Master>` 에 `props.<filterParam>` 받아 useEffect 재조회

→ 화면 코드는 손댈 필요 없음. 새 화면이 컬럼 이름만 맞추면 즉시 cascade 동작.

### §7.5 주종관계 판별 원칙
**잘못 등록하면 실무 혼란**. 다음 중 하나라도 해당하면 **popup-only** 로 등록:
- 자식이 독립 마스터 (예: 직책은 부서와 무관 — 전사 공통)
- 자식 값이 부모에 의해 의미상 제약되지 않음
- 도메인 담당자가 "독립" 이라고 확인

❌ 잘못된 예: `deptCd → positionCd` (직책은 부서 독립)
✅ 올바른 예: `planScope → itemLvCd → itemCd`, `locatTpCd → locatCd`

---

## §8. 표준 POPUP 양식

`PopSelectItem` 을 기준 원본으로 모든 `view/common/Pop*.jsx` 가 동일 구조를 따른다.

### §8.1 구조
```jsx
<PopupDialog
  open onClose onSubmit={handleSubmit(saveSubmit, onError)}
  title checks={[grid]} resizeHeight resizeWidth
>
  <SearchArea>
    <InputField control={control} name="xxxCd" label="코드"
      onKeyDown={(e) => { if (e.key === 'Enter') loadPopupData(); }} />
    <InputField control={control} name="xxxNm" label="명"
      onKeyDown={(e) => { if (e.key === 'Enter') loadPopupData(); }} />
  </SearchArea>
  <WorkArea>
    <ButtonArea title="도메인명">
      <RightButtonArea>
        <CommonButton title="검색" onClick={loadPopupData}>
          <SearchIcon fontSize="small" />
        </CommonButton>
      </RightButtonArea>
    </ButtonArea>
    <ResultArea>
      <BaseGrid id={`${props.id}_XxxGrid`} items={popupGrid1Items} />
    </ResultArea>
  </WorkArea>
</PopupDialog>
```

### §8.2 props 인터페이스
- `id`: 고유 prefix
- `open`, `onClose`
- `confirm(rows: object[])` — **항상 배열** 반환 (호출자는 `firstOf()` 로 단건 추출)
- `multiple`: boolean (default false)
- 부모 cascade 가 있으면 `<parentField>: string` (예: `planScope`, `itemLvCd`)

### §8.3 setGridOptions
- `setFooters/setStateBar({visible:false})`
- `setEditOptions({insertable:false, appendable:false})`
- `setDisplayOptions({fitStyle:'evenFill'})`
- `setCheckBar({visible:true, exclusive:!multiple})`
- `onCellDblClicked` → 행 1개 [row] 배열로 confirm + close
- `onCellClicked` → single: `checkRow(idx,true,true)` / multi: 토글

### §8.4 호출자 표준 (배열 수신)
```jsx
const firstOf = (sel) => (Array.isArray(sel) ? sel[0] : sel);

const handleConfirm = (selected) => {
  const row = firstOf(selected);
  if (!row) return;
  setValue('xxxCd', row.xxxCd);
  setValue('xxxNm', row.xxxNm);
};
```

### §8.5 기존 Pop 인벤토리

| Popup | 마스터 | cascade parent |
|---|---|---|
| `PopSelectItem` / `PopItemMulti` | 품목 | planScope, itemLvCd |
| `PopSelectAccount` / `PopAccountMulti` | 거래처 | planScope, salesLvCd |
| `PopLocatMst` / `PopLocatTpMulti` | 거점 | planScope |
| `PopResourceMulti` / `PopRouteMulti` | 자원/라우트 | — |
| `PopSelectLvlAndItem` / `PopSelectLvlAndAcct` | 레벨+엔티티 | — |
| `PopDepartment` / `PopPosition` | 부서 / 직위 | — (독립 마스터) |

신규 추가 시 위 중 가장 유사한 것을 복제하여 컬럼/label/endpoint 만 교체.

---

## §9. 공통코드 (CommonCodeSelect) Dropdown 정책

`TB_AD_COMN_CODE` 기반 enum 성 코드 (USE_YN, USER_TP, STATUS_CD 등) 는 **항상 `CommonCodeSelect` Dropdown** 사용. 자유 text · hardcoded `options=[...]` 금지.

### §9.1 정책
- **기본**: Dropdown 전용 (UX 일관성)
- **예외**: 50개 초과 대량 코드 (국가/통화 등) 는 `mode="popup"` 명시 시만 POPUP 전환

### §9.2 사용
```jsx
import CommonCodeSelect from '@wingui/view/common/CommonCodeSelect';

<CommonCodeSelect
  groupCd="USE_YN" name="useYn" control={control}
  label="사용여부" includeAll                  // '전체' 옵션 prepend
/>

// 대량 예외
<CommonCodeSelect groupCd="COUNTRY_CD" name="countryCd" control={control}
                  label="국가" mode="popup" />
```

### §9.3 내부
- `GET /system/common/codes?group-cd=${groupCd}` 자동 로드
- 모듈 스코프 Map 캐시 (groupCd 당 1회 호출)
- `invalidateCommonCodeCache(groupCd?)` export — 코드 편집 후 호출

---

## 관련 파일

- `41-composer-generation.md` — 메인 (§14 Anti-patterns)
- `41a-composer-jsx.md` — JSX 표준 (BaseGrid 컬럼 정의)
- `41b-composer-java.md` — Java 백엔드 표준
- `21-components.md` — 공용 컴포넌트 인벤토리 전반
- `packages/wingui/src/common/fieldCascade.js` — 주종관계 레지스트리
- `packages/wingui/src/common/useFieldCascade.js` — form cascade hook
- `packages/wingui/src/common/gridCascade.js` — 그리드 cascade 헬퍼
- `packages/wingui/src/view/common/CommonCodeSelect.jsx` — 공통코드 Dropdown
- `packages/wingui/src/view/common/PopDepartment.jsx` · `PopPosition.jsx` — 표준 양식 참조
