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

## §4. 자기 검증 (검색조건/콤보 출력 직전)

- [ ] 품목/거래처/거점/자원/플랜스코프/사용자 검색은 §1 도메인 컴포넌트 + 정확한 경로로 import
- [ ] 옵션 SP 로딩은 `baseURI()+'common/data'` + `PROCEDURE_NAME` (per-field 커스텀 URL 없음)
- [ ] 검색조건 콤보는 `loadCombos()` 한 곳에서 로드 → options state → `<InputField options={}>`
- [ ] 그리드 셀 콤보는 `loadGridCombos()` 에서 로드 (검색조건과 분리)
- [ ] 첫 값 `setValue(...)` 로 auto-select
- [ ] `zAxios.get('.../options/field_...')` 같은 흩뿌린 옵션 호출 0건

---

## 관련 파일

- `21-components.md §3.2` (공용) — 검색조건 컴포넌트 이름 (경로는 본 룰 §1 이 권위)
- `41a-composer-jsx.md §4.3` (공용) — 그리드 컬럼 `useDropdown + values + labels`
- `41c-composer-widgets.md §6` (공용) — 위젯 매트릭스
- 실측 원본: `view/lxma/masterplan/mplx3020/MpLx3020.jsx` (loadCombos) ·
  `view/lxma/factoryplan/fplx4000mgmturgent/FpLx4000MgmtUrgent.jsx` (loadGridCombos)
