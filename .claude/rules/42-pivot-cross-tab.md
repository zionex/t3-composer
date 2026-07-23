# 42. Composer — 크로스탭 · 피벗 그리드 (P06)

> 시간 버킷·측정지표를 열로 펼치는 화면 (마스터플랜 주별 계획 · 원부자재 발주요청 · PSI · 크로스탭 입력) 의 단일 진실 저장소.
> 프론트·백엔드·데이터 shape 이 서로 얽혀 있어 rules/20/41a/41b 어디에도 온전히 안 들어가는 도메인 → 별도 문서.

> **상위 규칙**: `41-composer-generation.md` (메인) + sub `41a` (JSX 표면) + T3SERIES overlay `41b` (Java 표면) + `20 §9 P06` (카탈로그 링크).

---

## §0. 판별 기준 — "이 화면은 P06 이다"

다음 중 **하나라도 해당** 하면 크로스탭 · 피벗 화면:

- 시간 버킷 (일/주/월) 이 **열** 로 펼쳐진다 — 조회 조건의 기간 선택에 따라 컬럼 개수·이름이 바뀜
- 지표(measure) 여러 개가 행 확장으로 표현된다 (예: 기초재고/출고예정/입고예정/기말재고)
- 정적 dimension 컬럼 + 동적 bucket 컬럼이 공존
- 사용자가 셀 편집 후 저장 시 payload 가 **row 가 아니라 셀 단위** (변경 셀만 unpivot)

**Wizard 진입 시 자동 판별 신호** — `layer.subtype ∈ { 'GRID_PIVOT', 'GRID_CROSSTAB' }` (mockup entry / user 선택). `wizardState.specToInitialPrompt` 가 subtype 감지 시 이 문서 참조 힌트를 프롬프트에 주입.

---

## §1. 3계약 모델 — 왜 이렇게 나누는가

피벗을 "BaseGrid 로 만든다" 처럼 컴포넌트 하나로 정리하면 계속 헷갈리기 쉬움. **3개 계약** 으로 분리:

| 계약 | 결정하는 것 | 표현 |
|---|---|---|
| **① 의도 계약: PivotSpec** | 시간 버킷 크로스탭인가 / D·M·P·V 피벗인가 / editable 계획 입력인가 | `§2` 의 spec 객체 |
| **② 데이터 계약: Procedure Output Shape** | 프로시저가 데이터를 어떤 모양으로 반환하는가 | `sourceShape: 'PIVOT_UTIL_OUTPUT'` |
| **③ 렌더 계약: Grid Rendering** | 프론트가 어떻게 그리는가 (동적 컬럼 · 컬럼 재세팅 API · 저장 unpivot) | `renderMode: 'BASEGRID_DYNAMIC'` |

각 계약이 독립적으로 갈아끼워질 수 있어야 산출물이 결정론적으로 나옴.

---

## §2. PivotSpec v2 — 단일 표준 스키마

**모든 크로스탭 화면 산출물은 다음 spec 을 채워 그것에서 도출**. LLM 이 자연어 요청을 이 spec 으로 먼저 변환한 뒤 SP·JSX 로 확장.

```js
pivotSpec: {
  renderMode: 'BASEGRID_DYNAMIC',        // (미래에 'PIVOT_TABLE' 추가 여지)

  // ── ② 데이터 계약 (PivotUtil 파라미터명과 1:1 정렬) ──
  // ★ sourceShape 은 응답 shape 을 정의하는 계약이지 구현 방법이 아님.
  //   §3.1 PivotUtil.pivotData(...) 가 이 shape 을 만드는 표준 경로지만,
  //   §3.6 처럼 수동 stream 구현·SP wide 반환 후 재조립 등으로도 만들 수 있음.
  //   구현이 무엇이든 응답이 이 shape 을 지키면 프론트 §4 코드는 그대로 재사용.
  sourceShape: 'PIVOT_UTIL_OUTPUT',      // 응답 = { header, headerMap?, data }
                                         //  data[i].QTY 는 header 순서와 맞는 배열
  groupCds:      ['PLANT_ID','DEMAND_ID','ROUTE_CODE','RESOURCE_CODE'],  // 정적 dimensions
  headerColumn:  'PLAN_DATE',            // 열로 펼칠 컬럼
  dataColumns:   ['QTY'],                // 값 컬럼 (복수 가능: ['QTY','HOLIDAY_YN'])
  measureNms:    [],                     // 지표 분리 시 다국어 코드 배열
                                         //  예: ['기초재고','출고예정','입고예정','기말재고']
  additionalHeaderColumns: [],           // multi-tier 헤더용
                                         //  예: ['PLAN_DATE','WEEK','MONTH']

  // ── ③ 렌더 계약 ──
  dynamicProp:   true,                   // <BaseGrid dynamic={true} />
  columnResetApi:'addGridItems',         // grid.addGridItems(static.concat(dynamic), true)
  dynamicColSpec:{ dataType:'number', width:80, editable:true, numberFormat:'#,##0.###' },
  measureDisplayCallback: true,          // measureNms 있으면 displayCallback: transLangKey

  // ── 저장 계약 ──
  editable:      true,
  saveMode:      'UNPIVOT_CHANGED_CELLS_SINGLE',
                 //   SINGLE     — dataColumns 1개 · measureNms 없음 (기본)
                 //   MULTI_COLS — dataColumns N개 · measureNms 없음
                 //   MEASURE    — measureNms 있음
  saveEndpoint:  'SP_UI_..._S1',
  saveKeyField:  'BASE_DATE',            // 헤더 컬럼값 저장 필드 (예: BASE_DATE / PLAN_DT)
  saveValueField:'QTY',                  // SINGLE
  saveValueFields:['QTY','HOLIDAY_YN'],  // MULTI_COLS
  measureField:  'QTY_TYPE',             // MEASURE (measure 이름 저장 필드)
}
```

### §2.1 필드 enum

| 필드 | 허용값 | 비고 |
|---|---|---|
| `renderMode` | `'BASEGRID_DYNAMIC'` | 유일 정본. 미래에 `'PIVOT_TABLE'` 확장 여지 |
| `sourceShape` | `'PIVOT_UTIL_OUTPUT'` | 유일 정본. `WIDE`/`LONG`/`META_ROWS` 는 정본 아님 (§부록) |
| `saveMode` | `'UNPIVOT_CHANGED_CELLS_SINGLE'` · `'UNPIVOT_CHANGED_CELLS_MULTI_COLS'` · `'UNPIVOT_CHANGED_CELLS_MEASURE'` | dataColumns · measureNms 조합에 따라 결정 |

---

## §3. 백엔드 파이프라인 — `PivotUtil.pivotData(...)` 표준 경로

> ⛔ **이 절 전체는 백엔드 Java Service 코드 전용**.
> - `PivotUtil` 은 **wingui-core 의 Java 유틸** (`com.zionex.t3series.web.util.data.PivotUtil`).
>   프론트 JSX 안에 `const PivotUtil = { pivotData: ..., generateMonthColumns: ... }`
>   같은 객체를 정의하는 것이 아님 — **§7 CT11 위반**.
> - pivot 변환은 반드시 **백엔드 Service 안에서 완료**. §3.6 fallback (수동 stream) 도
>   백엔드 Service 안에서 실행. 프론트로 옮기지 않는다.
> - 백엔드가 SP 결과를 raw (`List<Entity>` · `List<Map>`) 로 그대로 반환하고 프론트에서
>   pivot 하도록 위임하는 것도 금지 — **§7 CT12 위반**. 항상 `{header, data}` shape
>   반환 (§3.6.2 shape 계약).
> - Entity 필드는 반드시 **SP 실제 결과 컬럼과 1:1 매핑**. 자체 상상으로 `brand`·`year`·
>   `month`·`value` 같은 소수의 필드로 축약하면 SP 결과 매핑 실패 — **§7 CT13 위반**.
>   `TB_UT_*` 같은 허구 테이블에 `@Table` 매핑도 금지 (rules/50 §13.6).

### §3.1 표준 코드 골격

```java
package com.zionex.t3series.web.domain.masterplan.matmgmt.mrpordreq;

import com.zionex.t3series.web.util.data.PivotUtil;     // ★ 유일 import 경로
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
// ...

@Service
@RequiredArgsConstructor
public class MrpOrdReqService {

    @Qualifier("targetJdbcTemplate")
    private final JdbcTemplate jdbcTemplate;

    public Map<String, Object> getMrpOrdReqs(Map<String, Object> params) {
        // 1) SP 조회 — LONG rows 반환
        List<Map<String, Object>> dataList = jdbcTemplate.queryForList(
            "EXEC SP_UI_MP_ORN_01_Q1 ?, ?, ?",
            params.get("planScope"), params.get("verCd"), params.get("plantCd")
        );

        // 2) PivotUtil 호출 — 파라미터 5개는 PivotSpec 필드와 1:1 매핑
        String   headerColumn = "PLAN_DATE";
        String[] groupCds     = { "PLANT_ID", "DEMAND_ID", "ROUTE_CODE", "RESOURCE_CODE" };
        String[] dataColumns  = { "QTY", "HOLIDAY_YN" };
        String[] measureNms   = { };
        String[] additionalHeaderColumns = { };

        return PivotUtil.pivotData(
            dataList, headerColumn, groupCds, dataColumns, measureNms, additionalHeaderColumns
        );
    }
}
```

**Controller**:
```java
@PostMapping("/masterplan/mrp-ord-reqs/search")
public Map<String, Object> search(@RequestBody Map<String, Object> params) {
    return service.getMrpOrdReqs(params);
}
```

응답 shape (`PIVOT_UTIL_OUTPUT`):
```json
{
  "header": ["2026-01-01", "2026-01-02", "2026-01-03"],
  "data": [
    { "PLANT_ID":"1100", "DEMAND_ID":"F001", ...,
      "QTY":       [100, 200, 300],
      "HOLIDAY_YN":["N","N","Y"] }
  ]
}
```

### §3.2 시나리오 A — 일반 pivot (measureNms = [])

- dimension 1개당 row 1개
- 값 컬럼 (`dataColumns`) 마다 별도 배열
- **가장 흔한 케이스** — 시간 버킷 단일 지표

### §3.3 시나리오 B — Measure 확장 (measureNms 있음)

같은 그룹키가 measureNms 개수만큼 **행으로 확장**. 각 행에 `QTY_TYPE` 필드 (measure 이름 = 다국어 코드).

```java
String[] dataColumns = { "BOH_QTY", "GI_QTY", "GR_QTY", "EOH_QTY" };
String[] measureNms  = { "기초재고", "출고예정", "입고예정", "기말재고" };
```

응답:
```json
{
  "header": ["2026-01-01","2026-01-02","2026-01-03"],
  "data": [
    { "ITEM_CD":"D00001", "QTY_TYPE":"기초재고", "QTY":[1000,2000,3000] },
    { "ITEM_CD":"D00001", "QTY_TYPE":"출고예정", "QTY":[   1,   2,   3] },
    { "ITEM_CD":"D00001", "QTY_TYPE":"입고예정", "QTY":[   0,   0,   0] },
    { "ITEM_CD":"D00001", "QTY_TYPE":"기말재고", "QTY":[ 999,1998,2997] }
  ]
}
```

**다국어 처리**: `measureNms` 에 다국어 코드값을 넣고 프론트 `displayCallback: (grid, idx, val) => transLangKey(val)` 로 라벨 변환 (§4.6).

### §3.4 시나리오 C — Multi-tier 헤더 (additionalHeaderColumns 있음)

`additionalHeaderColumns` 에 헤더 추가 정보 컬럼을 지정하면 응답의 `headerMap` (또는 그와 유사한 부가 필드) 에 tier 정보 포함. 상위 그룹 헤더 (`WEEK` / `MONTH`) + 하위 (`PLAN_DATE`).

```java
String[] additionalHeaderColumns = { "PLAN_DATE", "WEEK", "MONTH" };
```

프론트에서는 `dataType:'group'` 컬럼을 상위 tier 로 사용.

### §3.5 저장 SP 계약 — saveMode 별 payload

프론트가 unpivot 해서 넘겨준 **변경 셀 배열** 을 받아 처리. SP 는 배치 UPSERT 로 구현 (`SP_UI_..._S1`).

| saveMode | 프론트 payload row shape |
|---|---|
| `SINGLE` | `{ ...dims, BASE_DATE, QTY }` |
| `MULTI_COLS` | `{ ...dims, BASE_DATE, QTY, HOLIDAY_YN }` |
| `MEASURE` | `{ ...dims, BASE_DATE, QTY_TYPE, QTY }` |

SP 시그니처 예 (SINGLE):
```sql
CREATE PROCEDURE SP_UI_MP_ORN_01_S1
    @CHANGES NVARCHAR(MAX)   -- JSON array
AS
BEGIN
    -- JSON 파싱 → dbo.TB_MP_ORN_MRP UPSERT
    -- MERGE ... USING (SELECT ... FROM OPENJSON(@CHANGES) ...) ON ...
END
```

Controller 저장:
```java
@PostMapping("/masterplan/mrp-ord-reqs")
public ResponseMessage save(HttpServletRequest request) throws Exception {
    String changes = request.getParameter(ServiceConstants.PARAMETER_KEY_DATA);
    service.saveMrpOrdReqs(changes);
    return new ResponseMessage(HttpStatus.OK.value(), "saved");
}
```

### §3.6 Fallback 경로 — 수동 stream 구현 (`PivotUtil` 미제공/미대응 시)

`PivotUtil.pivotData(...)` 가 §3.1 처럼 즉시 사용 가능한 상황이 대부분이지만, 다음 두 경우엔 수동 구현이 **정당한 fallback** 이다. 이 경로도 응답 shape 은 §2 의 `PIVOT_UTIL_OUTPUT` 을 그대로 유지 → **프론트 코드 (§4) 는 손대지 않음**.

#### §3.6.1 언제 fallback 이 필요한가

| 케이스 | 예 |
|---|---|
| **PivotUtil 미제공 Target** | T3SERIES 외 Target (PLANNEL 등) 은 wingui-core 유틸이 다르거나 미제공. Target overlay 에 대체 유틸이 있으면 그것 우선, 없으면 수동 |
| **PivotUtil 파라미터로 표현 불가** | 계산된 dimension (예: 두 컬럼 concat 후 group), 그룹키 내부 조건별 서브 pivot, 다층 nested pivot, dimension 이 컬럼 자체가 아니라 파생값, 값 배열 배치 규칙이 headerColumn 정렬과 다름 (예: FY 시작월 기준 회계연도 정렬) 등 |
| **SP 자체가 이미 wide** | SP 가 `PIVOT` 절이나 dynamic SQL 로 이미 wide 로 반환하는 경우 — 프론트 shape 을 맞추기 위해 backend 에서 최소 변환만 필요 |

⛔ 반대로 다음 이유는 fallback 정당화 안 됨: "수동이 더 깔끔해 보임" · "PivotUtil 배우기 귀찮음" · "한번 써봤는데 되긴 하는데 마음에 안 듦". PivotUtil 이 커버하는 케이스는 반드시 PivotUtil.

#### §3.6.2 필수 원칙 — 응답 shape 유지

수동 구현이어도 응답은 **`{ header:[...], data:[{ ...dims, QTY:[values...] }] }`** shape 그대로. 특히:

- `data[i].QTY` (또는 다른 dataColumn) 는 **`header` 순서와 맞는 배열**
- 그룹 순서는 첫 관측 순서 보존 (LinkedHashMap)
- `header` 는 정렬된 unique 시간 버킷

**shape 을 바꾸지 말 것** — 예를 들어 `data[i]['2026-01-01']: 100` 처럼 backend 에서 이미 컬럼으로 spread 해 보내면 프론트 `setCrossTabGridData` (§4.4) 의 QTY 배열 언패킹 로직이 무의미해지고, 컬럼 이름 규약이 backend/frontend 사이에 이중으로 관리되어야 함. **shape 은 계약** — 구현 방법이 바뀌어도 계약은 유지.

#### §3.6.3 표준 골격 (SINGLE 케이스)

pivotBackend.md 방법 A 를 정리한 것:

```java
public Map<String, Object> getPivotDataManual(List<Map<String, Object>> dataList) {
    // 1) 그룹핑 키 정의 — dimension 컬럼들의 문자열 concat (계산된 dimension 가능)
    Function<Map<String, Object>, String> pivotKey = row ->
        row.get("PLANT_ID") + "|" + row.get("DEMAND_ID") + "|"
        + row.get("ROUTE_CODE") + "|" + row.get("RESOURCE_CODE");

    // ★ LinkedHashMap 필수 — 그룹 순서 보존 (HashMap 은 순서 무보장 → 그리드 row 순서 불안정)
    Collection<List<Map<String, Object>>> groupedList = dataList.stream()
        .collect(Collectors.groupingBy(pivotKey, LinkedHashMap::new, Collectors.toList()))
        .values();

    // 2) 헤더 추출 (TreeSet 으로 중복 제거 + 정렬)
    //    ★ 정렬 가능한 포맷으로 SP 가 반환해야 (예: 'yyyy-MM-dd' 는 문자열 정렬로 시간 순서와 일치)
    Set<String> header = new TreeSet<>();
    for (Map<String, Object> row : dataList) {
        header.add((String) row.get("PLAN_DATE"));
    }

    // 3) 각 그룹에 QTY 배열 배치
    List<Map<String, Object>> data = new ArrayList<>();
    if (!header.isEmpty()) {
        String[] headerArr = header.toArray(new String[0]);
        List<String> headerList = Arrays.asList(headerArr);

        for (List<Map<String, Object>> group : groupedList) {
            Object[] qty = new Object[headerArr.length];
            boolean valid = false;

            for (Map<String, Object> row : group) {
                int idx = headerList.indexOf(row.get("PLAN_DATE"));
                if (idx < 0) continue;       // header 에 없는 값 (드문 케이스) 무시
                qty[idx] = row.get("QTY");
                valid = true;
            }

            if (valid) {
                Map<String, Object> first = new LinkedHashMap<>(group.get(0));
                first.put("QTY", Arrays.asList(qty));
                //   ↑ 첫 row 를 대표로 dimensions 유지 + QTY 만 배열로 교체
                data.add(first);
            }
        }
    }

    Map<String, Object> result = new LinkedHashMap<>();
    result.put("header", header);      // TreeSet 도 순서 있음 (오름차순)
    result.put("data", data);
    return result;
}
```

#### §3.6.4 다중 dataColumns / measureNms 확장

`dataColumns = ['QTY','HOLIDAY_YN']` 이면 각 dataColumn 마다 배열 배치 반복:

```java
Object[] qtyArr        = new Object[headerArr.length];
Object[] holidayYnArr  = new Object[headerArr.length];
for (Map<String, Object> row : group) {
    int idx = headerList.indexOf(row.get("PLAN_DATE"));
    if (idx < 0) continue;
    qtyArr[idx]       = row.get("QTY");
    holidayYnArr[idx] = row.get("HOLIDAY_YN");
    valid = true;
}
first.put("QTY",        Arrays.asList(qtyArr));
first.put("HOLIDAY_YN", Arrays.asList(holidayYnArr));
```

`measureNms` (MEASURE 모드) 는 group by 키에 `QTY_TYPE` 을 포함하지 않고, 대신 결과 row 를 measureNms 개수만큼 확장 생성 — 로직 복잡도 급증. **이 케이스는 PivotUtil 사용을 강력 권장**, 수동 구현 시 별도 helper 로 분리.

#### §3.6.5 SP 가 이미 wide 반환하는 경우

극단적으로 SP 가 `PIVOT` 절 또는 dynamic SQL 로 이미 wide 형태 `{ITEM_CD, ITEM_NM, '2026-01-01':100, '2026-01-02':200, ...}` 로 반환하면, backend 에서 header 추출만 하고 QTY 배열로 재조립:

```java
// 첫 row 의 key 에서 dimension 이 아닌 것 = header 시간 버킷
Set<String> dims = Set.of("PLANT_ID","DEMAND_ID","ROUTE_CODE","RESOURCE_CODE","ITEM_CD","ITEM_NM");
Set<String> header = new TreeSet<>(dataList.get(0).keySet());
header.removeAll(dims);

// 각 row 를 순회하며 wide 컬럼값을 QTY 배열로 재조립
List<Map<String, Object>> data = new ArrayList<>();
String[] headerArr = header.toArray(new String[0]);
for (Map<String, Object> row : dataList) {
    Object[] qty = new Object[headerArr.length];
    for (int i = 0; i < headerArr.length; i++) qty[i] = row.get(headerArr[i]);
    Map<String, Object> out = new LinkedHashMap<>();
    for (String d : dims) if (row.containsKey(d)) out.put(d, row.get(d));
    out.put("QTY", Arrays.asList(qty));
    data.add(out);
}
```

⛔ **wide 상태 그대로 프론트로 보내지 말 것** — §3.6.2 shape 계약 위반. 프론트 코드 (§4.4 QTY 배열 언패킹) 가 안 돌아감.

#### §3.6.6 META_ROWS (정본 아님)

컬럼 메타 result set + 데이터 result set 을 SP 가 따로 반환하는 방식 — T3SERIES 정본 아님. 프론트 표준 코드 없음. 도입 필요 시 별도 rule 개정 우선.

---

## §4. 프론트 파이프라인 (4단계)

> ⛔ **이 절 전체는 프론트가 §2 의 응답 shape (`{header, data with QTY:[values...]}`) 을
> 수신한 뒤의 처리**. 프론트는 pivot 하지 않는다.
> - 백엔드 응답이 **flatRows (`[{brand, year, month, value}, ...]`) 로 왔다면 그건
>   백엔드가 §3 을 위반한 것** — 프론트에서 자체 `PivotUtil` 객체를 만들거나
>   `useMemo` 로 grouping·pivot 하는 우회 로직을 넣지 말고 **백엔드를 고친다**.
> - 프론트 역할: `res.data.header` 로 컬럼 재세팅 (§4.3) → `res.data.data` 의 QTY 배열
>   언패킹 (§4.4) → 셀 편집 시 `getUpdatedCells` 로 변경 셀만 unpivot 저장 (§4.5).
> - **이 4단계 순서는 변경 금지**. 응답 구조나 `PivotUtil` 이라는 도구 자체를 프론트에서
>   재현/에뮬레이션하지 않는다.

### §4.1 BaseGrid 표면 — `dynamic={true}` 필수

```jsx
<BaseGrid
  id="mainGrid"
  items={grid1Items}                       // 정적 컬럼만 · 동적은 addGridItems 로 확장
  afterGridCreate={afterGrid1Create}
  dynamic={true}                           // ★ 필수 — Context Menu 레이아웃 저장/삭제 비활성화
/>
```

`dynamic={true}` 없으면 Context Menu 의 레이아웃 저장 기능이 동적 컬럼을 못 잡고 오작동.

### §4.2 `loadData` — 조회 + 파이프라인 트리거

```jsx
const loadData = () => {
  zAxios({
    method: 'post',
    url:    'masterplan/mrp-ord-reqs/search',
    data:   getValues(),
  }).then((res) => {
    if (res.status !== HTTP_STATUS.SUCCESS) return;
    makeCrossTabFieldsAndColumns(res.data.header);   // §4.3
    setCrossTabGridData(res.data.header, res.data.data); // §4.4
  });
};
```

### §4.3 `makeCrossTabFieldsAndColumns` — 동적 컬럼 생성

```jsx
function makeCrossTabFieldsAndColumns(dateHeaders) {
  const dynamicCols = dateHeaders.map((h) => ({
    name:      h,
    dataType:  'number',
    headerText: formatHeader(h),            // 'yyyy-MM-dd' → '2026/01/01' 등
    visible:   true,
    editable:  true,
    width:     80,
    textAlignment: 'far',
    numberFormat: '#,##0.###',
  }));
  grid1.addGridItems(grid1Items.concat(dynamicCols), true);
  //     ↑ ★ 컬럼 재세팅 표준 API — 정적 + 동적 concat 후 replaceAll=true
}
```

**정적 gridItems** (컴포넌트 밖 선언 · rules/41a §4.3):
```jsx
let grid1Items = [
  { name:'PLANT_ID',  dataType:'text', headerText:'공장', width:100, textAlignment:'center' },
  { name:'DEMAND_ID', dataType:'text', headerText:'수요', width:130, textAlignment:'center' },
  { name:'ITEM_CD',   dataType:'text', headerText:'품목코드', width:130 },
  { name:'ITEM_NM',   dataType:'text', headerText:'품목명',   width:220 },
  // ← 동적 시간 버킷 컬럼은 makeCrossTabFieldsAndColumns 에서 뒤에 concat
];
```

### §4.4 `setCrossTabGridData` — QTY 배열 언패킹

응답의 `data[i].QTY` 는 header 순서와 맞는 배열. 프론트에서 각 배열 요소를 header 이름 필드로 전개.

```jsx
function setCrossTabGridData(dateHeaders, data) {
  const jsonData = data.map((row) => {
    const obj = { ...row };
    dateHeaders.forEach((h, idx) => {
      obj[h] = row['QTY'][idx];             // { ..., '2026-01-01': 100, '2026-01-02': 200 }
    });
    return obj;
  });
  grid1.dataProvider.fillJsonData(jsonData);
}
```

**Measure 확장 (시나리오 B)** 일 때는 `QTY_TYPE` 도 그대로 유지 → 컬럼 정의에 `displayCallback` 로 다국어 라벨 변환 (§4.6).

### §4.5 `saveData` — unpivot 변경 셀만

**핵심 API**: `grid.dataProvider.getUpdatedCells([row])` — 셀 단위 변경 감지. 변경된 셀의 `fieldName` = 원래 header 값.

#### SINGLE (기본)
```jsx
function saveData() {
  grid1.gridView.commit(true);
  showMessage('확인', transLangKey('MSG_SAVE'), (answer) => {
    if (!answer) return;
    const all = grid1.dataProvider.getAllStateRows();
    const changes = [...all.created, ...all.updated, ...all.deleted, ...all.createAndDeleted];
    if (changes.length === 0) {
      showMessage('확인', transLangKey('MSG_5039'), { close: false });
      return;
    }
    const payload = [];
    changes.forEach((rowIdx) => {
      const rowData      = grid1.dataProvider.getJsonRow(rowIdx);
      const updatedCells = grid1.dataProvider.getUpdatedCells([rowIdx]);
      const changedBuckets = [];
      updatedCells.forEach((cr) => cr.updatedCells.forEach((f) => {
        if (!changedBuckets.includes(f.fieldName)) changedBuckets.push(f.fieldName);
      }));
      changedBuckets.forEach((bucket) => payload.push({
        PLANT_ID:      rowData.PLANT_ID,
        DEMAND_ID:     rowData.DEMAND_ID,
        ROUTE_CODE:    rowData.ROUTE_CODE,
        RESOURCE_CODE: rowData.RESOURCE_CODE,
        BASE_DATE:     bucket,             // ← saveKeyField
        QTY:           rowData[bucket],    // ← saveValueField
      }));
    });
    const fd = new FormData();
    fd.append('changes', JSON.stringify(payload));
    zAxios({ method:'post', url:'masterplan/mrp-ord-reqs',
             headers:{'content-type':'multipart/form-data'}, data: fd })
      .then(loadData);
  });
}
```

#### MULTI_COLS (dataColumns N개)
`changedBuckets` 를 계산할 때 `saveValueFields` 전 컬럼값을 함께 payload 에 담음:
```jsx
changedBuckets.forEach((bucket) => payload.push({
  ...dims, BASE_DATE: bucket,
  QTY:        rowData[bucket],
  HOLIDAY_YN: rowData[bucket + '__HOLIDAY_YN'],   // MULTI_COLS 인 경우 필드명 규약 정의 필요
}));
```

#### MEASURE (measureNms 있음)
각 row 의 `QTY_TYPE` 이 measure 이름. 변경 셀 unpivot 시 `QTY_TYPE` 을 함께 전송:
```jsx
changedBuckets.forEach((bucket) => payload.push({
  ...dims, BASE_DATE: bucket,
  QTY_TYPE: rowData['QTY_TYPE'],          // ← measureField
  QTY:      rowData[bucket],
}));
```

### §4.6 Measure 다국어 displayCallback

시나리오 B (measureNms) 에서 `QTY_TYPE` 컬럼을 다국어 라벨로 표시:

```jsx
{
  name: 'QTY_TYPE', dataType: 'text', headerText: 'QTY_TYPE',
  width: 100, visible: true, editable: false, textAlignment: 'center',
  displayCallback: function (grid, index, val) {
    return transLangKey(val);              // '기초재고' 코드값 → 현재 언어 라벨
  },
},
```

---

## §5. ★ Composer 미리보기 (shim) 제약 — 산출물은 wingui, preview 는 미검증

**현 상태 (2026-07-07)**: `frontend/src/shim/wingui/common/BaseGrid.jsx` 에는 **`addGridItems` · `dynamic` 표면이 없음**. 산출물 JSX 가 위 규약대로 작성되면:

- ✅ **wingui 본 환경**: 정상 동작
- ⚠️ **Composer preview [화면 실행]**: `grid.addGridItems is not a function` → 크로스탭 컬럼 미갱신 또는 크래시

**정본 원칙**: 산출물 코드는 **wingui 표준 (§4) 그대로 작성**. preview 에서 확인 불가 를 이유로 규약을 낮추지 않는다.

**보류된 개선 (rules/50 §13.13 후보)**: shim BaseGrid 에 `addGridItems(items, replaceAll)` + `dynamic` prop 노출 → RealGrid GridView 의 `setColumns(...)` 재실행 + `buildColumns(items)` 재계산. 이 작업 완료 전까지 크로스탭 산출물의 preview 검증은 사용자 육안 (실행 화면 LIVE) 이 아닌 wingui sync 후 별도 확인.

---

## §6. 참조 원본

**Mockup (구조 참조)**:
- `frontend/src/view/util/t3mockup/pivot_table/PivotTableMockup.jsx` — 범용 P06 골격 (행 × 시간 버킷, FCST/ACT/GAP 다중 measure, sticky left)
- `frontend/src/view/util/t3mockup/_oron/mp_mrp_psi/OronMpMrpPsiMockup.jsx` — 실전 (원부자재 발주요청 + PSI · `DATE_COLS.map()` iteration · `src:` 로 wingui 원본 경로 명시)

**원본 소스 노트**:
- `docs/reference/pivot/pivot-backend.md` — PivotUtil 3 시나리오 상세 (수동 구현 + PivotUtil 사용)
- `docs/reference/pivot/pivot-frontend.md` — loadData / makeCrossTabFieldsAndColumns / setCrossTabGridData / saveData 4단계 상세

**wingui-core 유틸**:
- `com.zionex.t3series.web.util.data.PivotUtil` — 유일 표준 import 경로 (t3series-wingui)
- `grid.addGridItems(items, replaceAll)` — 컬럼 재세팅 표준 API
- `grid.dataProvider.getUpdatedCells([row])` — 셀 단위 변경 감지 API

---

## §7. Anti-patterns

| # | ❌ | ✅ | 검증 |
|---|---|---|---|
| CT1 | `<BaseGrid dynamic={true}>` 누락 → Context Menu 오작동 (레이아웃 저장이 동적 컬럼 못 잡음) | 크로스탭 화면은 반드시 `dynamic={true}` | LLM |
| CT2 | 컬럼 재세팅에 `addGridItems` 대신 `<BaseGrid key={sig}>` remount 우회 → grid state·스크롤 위치 유실 | `grid.addGridItems(static.concat(dynamic), true)` | LLM |
| CT3 | `saveData` 에서 grid 의 전체 row 를 SP 로 저장 (변경 셀만이 아님) | `getUpdatedCells([row])` → 변경 bucket 만 unpivot payload | LLM |
| CT4 | **PivotUtil 이 커버하는 케이스인데** `Collectors.groupingBy` 수동 구현 선택 (취향/불편 이유) | `PivotUtil.pivotData(...)` 표준 경로 (§3.1). 단 §3.6.1 의 정당 fallback 케이스 (Target 미제공 · 파라미터 표현 불가 · SP 자체 wide) 는 예외 — §3.6 골격 따름 + shape 계약 유지 | LLM |
| CT5 | `measureNms` 에 한글 하드코딩 (예: `"기초재고"` 한 언어만) | 다국어 코드값 배열 + 프론트 `displayCallback: transLangKey` | LLM |
| CT6 | `sourceShape` 을 `WIDE` / `LONG` / `META_ROWS` 로 지정 후 그에 맞는 프론트 코드 (없음) 요구 | `PIVOT_UTIL_OUTPUT` 유일 정본. 다른 shape 필요 시 rule 개정 우선 | LLM |
| CT7 | (T3SERIES) `PivotUtil` import 를 자체 경로 (`t3series.util.PivotUtil` 등) 로 작성 | `com.zionex.t3series.web.util.data.PivotUtil` 유일 정본 (§3.1). PivotUtil 미제공 Target 은 아예 import 하지 않고 §3.6 수동 구현 | LLM |
| CT8 | `fillJsonData` 만 재호출하고 컬럼은 그대로 → 이전 조회의 시간 버킷 컬럼이 남음 | 조회할 때마다 `makeCrossTabFieldsAndColumns` 로 컬럼 먼저 재세팅 후 `fillJsonData` | LLM |
| CT9 | saveMode 를 `SINGLE` 인데 payload 에 `QTY_TYPE` 억지 삽입 (또는 반대) | dataColumns · measureNms 조합에 맞는 saveMode 선택 (§2.1) | LLM |
| CT10 | Composer preview 에서 안 돌아서 규약을 낮춤 (예: dynamic 제거, addGridItems 안 씀) | preview 는 shim 제약 (§5) — 산출물은 wingui 표준 유지 | LLM |
| CT11 | **프론트에서 pivot 로직을 직접 구현** — `const PivotUtil = { pivotData: ... }` 처럼 이름 붙여 정의하는 경우뿐 아니라, `rawData.forEach` + `Set` 추출 + `reduce`/그룹핑으로 **이름 없이 인라인**으로 동일한 그룹핑·시간버킷 추출·행→열 변환을 구현하는 것도 **똑같이 위반**. 특히 "백엔드 PivotUtil 시그니처가 확신 안 서서 일단 프론트에서 처리했다" 는 회피성 구현이 반복 관찰됨 (2026-07) | pivot 은 반드시 **백엔드 Java Service 안**. 시그니처가 불확실해도 §3.1 템플릿을 그대로 복사해 사용 — 확신 부족을 이유로 프론트 pivot 으로 대체 금지. §3.6 fallback 도 백엔드 안에서만. 프론트는 §4 응답 shape(`{header,data}`) 수신 + 언패킹만 | LLM |
| CT12 | **백엔드 Service 가 `return jdbcTemplate.query(SP_QUERY, rowMapper, ...)` 로 SP 결과를 그대로 반환** — `List<Entity>` (LONG rows) → 프론트가 pivot 하도록 위임 | 백엔드에서 `PivotUtil.pivotData(...)` (§3.1) 또는 §3.6 수동 stream 후 `{header, data with QTY:[values]}` shape 반환 필수. `List<Entity>` 반환 자체가 shape 계약 위반 | LLM |
| CT13 | **Entity 필드가 SP 실제 결과 컬럼과 매치 안 됨** (예: Entity `brand·year·month·value` 4개 · SP 실제 반환 `BRAND_CD·BRNAD_NM·FLAV_DIVS·SALES_YYYY·SALES_MM·TREND_QTY·TREND_BOX·...` 13개). 또는 사용자 자연어에 없는 허구 `TB_UT_*` 테이블에 `@Table` 매핑 | 사용자 지정 SP 는 자연어·첨부·이전 화면 컨텍스트에서 **결과 컬럼을 정확히 추론** · Entity 필드 = SP 결과 컬럼 1:1 매핑 (camelCase 관례). 새 테이블 `@Table` 생성 금지 — rules/50 §13.6. SP 이름도 사용자 명시 그대로 (`YP` → `UT` 변조 등 rules/50 §13.7 CG-M1 위반) | LLM |
| CT14 | **`PivotSpec` 을 실제 Java 클래스로 오해해 `import ...PivotSpec;` · `new PivotSpec()` · `spec.setRowKeys(...)` 처럼 존재하지 않는 builder 객체 API 를 지어냄**, 그리고 `PivotUtil.pivotData(raw, spec)` 처럼 인자 2개짜리 가짜 오버로드 호출. 또는 응답의 `header` 배열 원소를 `{fieldName,dataType,headerText,...}` 같은 객체로 오인 | `PivotSpec` 은 §2 의 **개념적 계약(사고 정리용 JSON)** 일 뿐 실제 클래스 아님 — 코드에 그 이름으로 import/인스턴스화 금지. `PivotUtil.pivotData(...)` 는 반드시 §3.1 의 **6개 개별 파라미터**(`dataList, headerColumn, groupCds, dataColumns, measureNms, additionalHeaderColumns`)를 그 순서·개수 그대로 직접 전달. `header` 배열의 각 원소는 **순수 문자열**(날짜/버킷 라벨) | LLM |
| CT15 | **`PivotUtil.pivotData(...)` 호출을 아예 생략하고 `return Map.of("header", List.of(), "data", rawData)` 처럼 겉모양만 `{header,data}` shape 를 갖춘 채 header 를 빈 배열로 두고 SP 원본 row(LONG 형태)를 그대로 통과** — 주석으로 "SP 가 이미 피벗 구조로 출력" · "실제 운영에서는 PivotUtil 호출" 이라며 실제 호출을 회피 (CT12 를 우회하는 신종 변형 — 2026-07). 신규 SP 라 실제 결과 컬럼을 확신할 수 없다는 것이 회피 이유가 되지 않음 | header 가 빈 배열이면 프론트 `addGridItems(header, true)` 가 항상 no-op → 동적 컬럼이 영원히 생성되지 않는 조용한 실패. **§3.1 템플릿의 `PivotUtil.pivotData(...)` 호출까지 반드시 작성 완료** — dataColumns/groupCds 이름을 실제로 확신 못 해도 자연어·참조 mockup 에서 합리적으로 추론한 이름을 채워 호출부를 완성한다. SP 가 정말 이미 wide 로 반환한다고 판단되면 §3.6.5 의 재조립 로직(dims 제외한 컬럼을 header 로 추출 + 각 row 를 QTY 배열로 재조립)을 **실제로 구현** — "이미 피벗 구조" 라는 주석만 달고 통과시키는 것은 금지 | LLM |

---

## 관련 문서

- `41-composer-generation.md` — 메인 (§0 참조 원본 · §14 Anti-patterns)
- `41a-composer-jsx.md` — JSX 표준 (BaseGrid `items`/`afterGridCreate` · gridItems 컴포넌트 밖 · dataType 필수)
- `.claude/targets/t3series/rules/41b-composer-java.md` — Java 표준 (Service · JdbcTemplate + `@Qualifier` · Controller `HttpServletRequest`)
- `31-stored-procedures.md` — SP 네이밍 · ORDER BY · 트랜잭션
- `20-screen-development.md` §9 — P06 카탈로그 (본 문서 링크 진입점)
- `50-composer-standalone-runtime.md` §13.13 (신설 예정) — shim BaseGrid `addGridItems`/`dynamic` 표면 보강 (rules/42 §5 의 정본 규약과 페어)
