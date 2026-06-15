# 45. 검색조건 도메인 컴포넌트 + SP 옵션 로딩 표준 (T3SERIES / lxma)

> **2026-06 추가** — 실제 lxma 운영 화면(`view/lxma/**`, 24개+ 화면) 의 검증된 패턴.
> Composer 가 검색조건(SearchArea)·콤보(dropdown/multiSelect/radio·그리드 셀 콤보)를
> 생성할 때 **이 표준을 따른다**. 현재 가장 흔한 산출물 결함 2가지를 직접 차단:
>   1. 도메인 검색컴포넌트(품목·거래처·플랜스코프 등)를 import 경로를 몰라 일반 `<InputField>` 로 열화
>   2. SP 옵션 로딩을 필드마다 `zAxios.get('.../options/field_xxx')` 로 흩뿌림 (lxma 엔 이런 endpoint 0건)

---

## §1. 검색조건 도메인 컴포넌트 — 이름 ⇄ import 경로 (필수)

검색조건이 아래 업무 의미면 **일반 `<InputField>` 가 아니라 도메인 컴포넌트**를 쓴다.
컴포넌트마다 import 경로가 정해져 있다 — 경로를 몰라 InputField 로 후퇴하지 말 것.

| 검색조건 의미 | 컴포넌트 | import 경로 |
|---|---|---|
| 품목 단건 | `ItemSearchInput` | `@wingui/view/supplychainmodel/common/ItemSearchInput` |
| 품목 복수 | `ItemMultiSearchBox` | `@wingui/view/supplychainmodel/common/ItemMultiSearchBox` |
| 거래처 단건 | `AccountSearchInput` | `@wingui/view/supplychainmodel/common/AccountSearchInput` |
| 거래처 복수 | `AccountMultiSearchBox` | `@wingui/view/supplychainmodel/common/AccountMultiSearchBox` |
| 거점 복수 | `LocationMultiSearchBox` | `@wingui/view/supplychainmodel/common/LocationMultiSearchBox` |
| 자원 복수 | `ResourceMultiSearchBox` | `@wingui/view/supplychainmodel/common/ResourceMultiSearchBox` |
| 플랜 스코프 | `PlanScope` | `@wingui/view/supplychainmodel/common/PlanScope` |
| 사용자 입력 | `UserInputField` | `@wingui/view/demandplan/common/UserInputField` |
| 사용자 선택 팝업 | `PopSelectUser` | `@wingui/view/demandplan/common/PopSelectUser` |

```jsx
// 예 — 실제 lxma (FpLx4000MgmtUrgent.jsx · MpPilotOrder.jsx)
import ItemMultiSearchBox    from '@wingui/view/supplychainmodel/common/ItemMultiSearchBox';
import AccountMultiSearchBox from '@wingui/view/supplychainmodel/common/AccountMultiSearchBox';
import LocationMultiSearchBox from '@wingui/view/supplychainmodel/common/LocationMultiSearchBox';
import PlanScope             from '@wingui/view/supplychainmodel/common/PlanScope';
import UserInputField        from '@wingui/view/demandplan/common/UserInputField';
```

규칙:
- 위 표의 의미에 해당하면 **해당 컴포넌트 + 정확한 경로**로 import (자유 텍스트 `<InputField>` 금지).
- 표에 없는 단순 코드/명칭/숫자/일자/Y·N 은 일반 `<InputField>` (rules/21 §3 · 41a).
- 경로가 의심되면 추측 금지 — 위 표의 경로를 그대로 사용 (이 경로들은 검증된 실측값).

### §1.1 ⛔ 도메인 검색컴포넌트는 **ref 기반 API** — `control`/`name` 아님 (필수)

이 컴포넌트들은 일반 `<InputField>` 와 **API 가 다르다**. `control`/`name` 으로 react-hook-form
에 묶지 말고, **`ref` + `submit` prop** 으로 쓰고 **`ref.current` 의 메서드로 값을 꺼낸다**.
(현재 공용 룰 21/41c 가 이들을 InputField 처럼 묘사하는 부분이 있으나, lxma 실측은 ref 방식)

| 컴포넌트 | 실제 props | 값 추출 (onSubmit 에서) |
|---|---|---|
| `ItemMultiSearchBox` | `ref={itemSearchBoxRef} submit={onSubmit} fields={['itemCode']}` | `ref.current.inputTextToChip(); ref.current.getItemCode()` |
| `ItemSearchInput` | `ref submit isLevelUnique authTypeId userId hasAttr isName` | `ref.current.getItemCode()` |
| `AccountMultiSearchBox` | `ref submit planScope={getPlanScope()}` | `ref.current.inputTextToChip(); ref.current.getAccountCode()/getAccountName()` |
| `AccountSearchInput` | `ref submit isLevelUnique authTypeId userId hasAttr isName` | `ref.current.getAccountCode()` |
| `LocationMultiSearchBox` | `ref submit planScope="DEFAULT"` | `ref.current` 의 getter |
| `PlanScope` | `ref={planScopeRef} onChange={onPlanScopeChange} onInitialized={...}` | `getPlanScope()` 헬퍼 / `planScopeRef.current` |
| `UserInputField` | `userId={watch('USER_ID')} empNm={watch('EMP_NM')} onClickFunc={...}` | `watch('USER_ID')` |

```jsx
// 실제 lxma (FpLx4000MgmtUrgent.jsx)
const itemSearchBoxRef    = useRef();
const accountSearchBoxRef = useRef();

<SearchRow>
  <ItemMultiSearchBox    ref={itemSearchBoxRef}    submit={onSubmit} fields={['itemCode']} />
  <AccountMultiSearchBox ref={accountSearchBoxRef} submit={onSubmit} />
  <InputField name='fromDate' type='datetime' label={transLangKey('DUE_DATE')+' (From)'} dateformat='yyyy-MM-dd' control={control} />
</SearchRow>

const onSubmit = () => {
  itemSearchBoxRef.current.inputTextToChip();          // 입력 중 텍스트를 chip 으로 확정
  accountSearchBoxRef.current.inputTextToChip();
  const itemCd    = itemSearchBoxRef.current.getItemCode();
  const accountCd = accountSearchBoxRef.current.getAccountCode();
  const params = { PROCEDURE_NAME: 'SP_UI_...', P_ITEM_CD: itemCd, P_ACCOUNT_CD: accountCd };
  // ... 조회
};
```

### §1.1.1 ⚠️ `useForm({ defaultValues })` 는 lxma 가 생략해도 **AI 산출물은 유지** (가드레일)

lxma 운영 화면은 `defaultValues` 를 대부분 생략한다(46개 중 7개만 명시). 사람은 어떤 필드가
`undefined` 로 시작해도 안전한지 암묵지로 알기 때문이다. **그러나 AI 산출물은 생략하지 말 것** —
가장 흔한 폼 초기화 크래시(`datetime` defaultValue `''` → Invalid Date → 매 keystroke RangeError,
rules/21 §3.1.0)를 막는 가드레일이다.

→ lxma 패턴을 따르되 **`defaultValues` 만은 rules/21 §3.1.0 의 타입별 초기값**을 유지:
`datetime→null` · `dateRange→[null,null]` · `number→null` · `check→false` · `multiSelect→[]` · `text→''`.
("lxma 가 생략하니 나도 생략" 금지 — 이 한 가지는 사람 관습보다 엄격하게.)

### §1.2 ⛔ lxma 는 `useFieldCascade`/`applyGridCascade`/`buildPopupFilterProps` 안 씀 (필수)

공용 룰 41c §7 의 `FIELD_CASCADE_REGISTRY` + `useFieldCascade` + `applyGridCascade` +
`buildPopupFilterProps` 메커니즘은 **lxma 화면에서 사용 빈도 0**. lxma 산출물에는 생성하지 말 것.

종속(주종) 관계는 lxma 방식으로:
- 상위값을 하위 컴포넌트에 **prop 직접 전달** — 예: `<AccountMultiSearchBox planScope={getPlanScope()} />`,
  `<LocationMultiSearchBox planScope="DEFAULT" />`
- 반응형 의존은 `watch('<field>')` 로 상위값 구독 — 예: `<UserInputField userId={watch('USER_ID')} />`
- `PlanScope` 는 `onChange`/`onInitialized` 콜백으로 변경 전파

---

## §2. SP 기반 옵션 로딩 — `loadCombos()` / `loadGridCombos()` 표준 (필수)

select/multiSelect/radio 의 옵션이나 그리드 셀 콤보를 **SP 로 로드**할 때, 필드마다
개별 `useEffect`+`zAxios.get` 으로 흩뿌리지 말고 **두 표준 함수**로 모은다.

### §2.1 표준 endpoint — `common/data` + `PROCEDURE_NAME`

모든 옵션/콤보 SP 호출은 **단일 endpoint** `baseURI() + 'common/data'` 에 POST 하고,
body 의 `PROCEDURE_NAME` 으로 SP 를 지정한다 (lxma 46개 호출이 이 형식).

```jsx
const res = await zAxios({
  method: 'post',
  headers: { 'content-type': 'application/json' },
  url: baseURI() + 'common/data',
  data: { PROCEDURE_NAME: 'SP_UI_<MODULE>_LX_<SCREEN>_<NAME>', /* P_파라미터... */ }
});
// res.data = [{ ...row }, ...]
```

### §2.2 `loadCombos()` — 검색조건(SearchArea) 콤보 옵션 일괄 로드

검색조건의 모든 select/multiSelect/radio 옵션을 **한 함수에서** 로드 →
`{value, label}` 배열로 매핑 → options state → `<InputField options={...}>` → 첫 값 auto-select.

```jsx
const [versionOptions, setVersionOptions] = useState([]);
const [isCombosLoaded, setIsCombosLoaded] = useState(false);

const loadCombos = async () => {
  try {
    const res = await zAxios({
      method: 'post',
      headers: { 'content-type': 'application/json' },
      url: baseURI() + 'common/data',
      data: { PROCEDURE_NAME: 'SP_UI_MP_LX_3020_MMA_BALANCE_VER_LIST' }
    });
    if (res && res.data) {
      const codeList = res.data.map((row) => ({ value: row.VER_ID, label: row.VER_ID }));
      setVersionOptions(codeList);
      setValue('verId', codeList.length > 0 ? codeList[0].value : '');   // 첫 값 자동 선택
    }
    setIsCombosLoaded(true);
  } catch (error) {
    console.error('Error loading combo data:', error);
    setIsCombosLoaded(false);
  }
};

// 초기화 시 1회 호출
useEffect(() => { loadCombos(); }, []);

// 검색조건에서 사용
<InputField control={control} type="select" name="verId" options={versionOptions} />
```

옵션이 여러 개면 `loadCombos()` **한 함수 안에서** 여러 SP 를 호출(또는 `Promise.all`)해
각 options state 를 채운다 — 필드마다 별도 useEffect 로 쪼개지 말 것.

### §2.3 `loadGridCombos()` — 그리드 셀 콤보/룩업 로드

그리드 셀 dropdown 은 검색조건과 **분리된** `loadGridCombos()` 에서 로드한다.

- **단순 enum 콤보**: `common/data` SP 결과를 `{value,label}`(또는 `values[]`/`labels[]`)로 매핑해
  컬럼에 적용 (컬럼 정의의 `useDropdown:true + values + labels`, rules/41a §4.3).
- **종속/룩업 콤보** (상위값에 따라 하위 옵션 달라짐): RealGrid `setLookups` +
  `setColumnProperty(col, 'lookupSourceId'/'lookupKeyFields', ...)` 사용.

```jsx
const loadGridCombos = () => {
  const param = { PROCEDURE_NAME: 'SP_UI_<MODULE>_LX_<SCREEN>_COMBO_Q', /* P_파라미터... */ };
  return zAxios({ method: 'post', url: baseURI() + 'common/data', data: param })
    .then((res) => {
      if (res.status === HTTP_STATUS.SUCCESS) {
        // res.data → 컬럼 values/labels 세팅 또는 setLookups
      }
    })
    .catch(console.log);
};
```

`loadGridCombos()` 는 그리드 생성 완료(`afterGridCreate` 로 grid 객체 확보) 후 호출.

---

## §3. ❌ 안티패턴 (Composer 가 자주 잘못 생성 — 차단)

| ❌ 잘못된 생성 | ✅ 표준 |
|---|---|
| 필드마다 `zAxios.get('setting/test-screens/options/field_xxx')` 개별 호출 (lxma 엔 이런 endpoint 0건) | `loadCombos()` 한 함수 + `baseURI()+'common/data'` + `PROCEDURE_NAME` |
| 옵션 로드를 필드별 `useEffect(() => {...}, [setValue])` 로 흩뿌림 | 검색조건 옵션은 `loadCombos()` 1곳, 그리드 콤보는 `loadGridCombos()` 1곳 |
| `zAxios.get(커스텀URL)` 으로 옵션 조회 | `zAxios({method:'post', url:baseURI()+'common/data', data:{PROCEDURE_NAME}})` |
| 검색조건 옵션 SP 와 그리드 콤보 SP 를 한 함수에 뒤섞음 | `loadCombos()`(검색조건) / `loadGridCombos()`(그리드) 분리 |
| 품목·거래처·플랜스코프 검색을 일반 `<InputField type="text">` 로 | §1 의 도메인 컴포넌트 + 정확한 import 경로 |
| 첫 옵션 auto-select 누락 (빈 선택으로 시작) | `setValue('<field>', list[0]?.value ?? '')` |

---

## §3.5 표준 심볼 출처 — 환각 import 금지 (필수)

생성 코드가 자주 쓰는 표준 심볼(`baseURI`·`transLangKey` 등)을 **잘못된 라이브러리에서
import** 하는 환각이 빈번하다. 실제 lxma 기준 출처:

| 심볼 | 올바른 출처 | ❌ LLM 환각 |
|---|---|---|
| `baseURI` | **ambient — import 하지 말 것** (lxma 35개 화면 사용, import 0건) | `import { baseURI } from '@wingui/utils/common'` |
| `transLangKey` | `import { transLangKey } from '@zionex/wingui-core'` (또는 ambient) | `import { useTranslation } from 'react-i18next'; const { t: transLangKey } = useTranslation();` |
| `getActiveViewId` | `@zionex/wingui-core` (또는 ambient) | 임의 store 경로 |
| `onErrorInput` | `import { onErrorInput } from '@zionex/wingui-core/utils/common'` | 자체 구현 |
| `HTTP_STATUS` | `@zionex/wingui-core` (또는 ambient) | 숫자 200 하드코딩 |
| `loadComboList` | `@zionex/wingui-core` | — |

```jsx
// ❌ 환각 (lxma 엔 react-i18next 쓰는 화면 0개)
import { useTranslation } from 'react-i18next';
import { baseURI } from '@wingui/utils/common';
const { t: transLangKey } = useTranslation();

// ✅ 표준 — baseURI 는 import 없이 ambient, transLangKey 는 wingui-core
import { transLangKey } from '@zionex/wingui-core';
// baseURI() 는 그냥 사용 (import 불필요)
```

규칙:
- **`react-i18next` / `useTranslation` 절대 사용 금지** — i18n 은 `transLangKey()` (wingui-core).
- **`baseURI` 는 import 하지 말 것** — ambient 전역. `import {baseURI} from '...'` 모두 환각.
- 위 표의 심볼은 import 가 필요하면 `@zionex/wingui-core` (또는 그 하위) 에서만.

---

## §4. 자기 검증 (검색조건/콤보 출력 직전)

- [ ] 품목/거래처/거점/자원/플랜스코프/사용자 검색은 §1 도메인 컴포넌트 + 정확한 경로로 import
- [ ] 도메인 검색컴포넌트는 `ref`+`submit` prop, 값은 `ref.current.get*()` 로 추출 (§1.1) — `control`/`name` 아님
- [ ] `useFieldCascade`/`applyGridCascade`/`buildPopupFilterProps` 생성 안 함 (§1.2) — 종속은 prop 직접 전달 + `watch()`
- [ ] `useForm({defaultValues})` 타입별 초기값 유지 (§1.1.1) — lxma 가 생략해도 AI 산출물은 datetime→null 등 명시
- [ ] 옵션 SP 로딩은 `baseURI()+'common/data'` + `PROCEDURE_NAME` (per-field 커스텀 URL 없음)
- [ ] 검색조건 콤보는 `loadCombos()` 한 곳에서 로드 → options state → `<InputField options={}>`
- [ ] 그리드 셀 콤보는 `loadGridCombos()` 에서 로드 (검색조건과 분리)
- [ ] 첫 값 `setValue(...)` 로 auto-select
- [ ] `zAxios.get('.../options/field_...')` 같은 흩뿌린 옵션 호출 0건
- [ ] `baseURI` import 안 함 (ambient), `transLangKey` 는 `@zionex/wingui-core` (§3.5)
- [ ] `react-i18next`/`useTranslation` 사용 0건 (§3.5)

---

## 관련 파일

- `21-components.md §3.2` (공용) — 검색조건 컴포넌트 이름 (경로는 본 룰 §1 이 권위)
- `41a-composer-jsx.md §4.3` (공용) — 그리드 컬럼 `useDropdown + values + labels`
- `41c-composer-widgets.md §6` (공용) — 위젯 매트릭스
- 실측 원본: `view/lxma/masterplan/mplx3020/MpLx3020.jsx` (loadCombos) ·
  `view/lxma/factoryplan/fplx4000mgmturgent/FpLx4000MgmtUrgent.jsx` (loadGridCombos)
