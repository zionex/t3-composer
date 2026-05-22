# 30. KTNG 데이터 접근 (HTTP · QueryHandler · SP)

> KTNG 백엔드는 **얇은 Controller 계층 + SP 직접 호출** 패턴. JPA Entity/Repository/Service 분리는 거의 사용하지 않는다.

## 1. 전체 흐름

```
[브라우저]                              [Spring Boot]                    [MSSQL]
JSX 화면
  │
  zAxios({                                @PostMapping              QueryHandler
    method:'post',                  ───►  @ExecPermission       ──► getList("SP_UI_BF_KTNG_01_Q1", params)
    url: baseURI() + '<m>/<feature>/q1',   QueryHandler              ──► EXEC SP_UI_BF_KTNG_01_Q1 ...
    data: param                          })                            ◄── List<Map<String,Object>>
  })                                     return List<Map<...>>;
                                                                       (또는 .save() → SP_UI_*_S1/_D1)
```

## 2. zAxios 호출 패턴

### 2.1 조회
```jsx
zAxios({
  method: 'post',
  headers: { 'content-type': 'application/json' },
  url: baseURI() + 'baselineforecast/master/bfktng01/q1',
  data: param,
})
.then(res => {
  if (res.status === HTTP_STATUS.SUCCESS) {
    grid1.dataProvider.fillJsonData(res.data);
  }
})
.catch(err => console.log(err));
```

### 2.2 저장 (changeRowData 배열 JSON body)
```jsx
zAxios({
  method: 'post',
  headers: { 'content-type': 'application/json' },
  url: baseURI() + 'baselineforecast/master/bfktng01/s1',
  data: changeRowData,        // List<Map> 형태로 직렬화됨
})
```

### 2.3 삭제 (deleteRows 배열)
```jsx
zAxios({
  method: 'post',
  headers: { 'content-type': 'application/json' },
  url: baseURI() + 'baselineforecast/master/bfktng01/d1',
  data: deleteRows,
})
```

## 3. URL 규약

```
baseURI()  + <module>/<category>/<feature>/<action>
           ↑                                ↑
           (보통 '/api/' 또는 빈 문자열)     q1/s1/d1/popq1/codeq1
```

- 모듈명: `baselineforecast`, `contributionmargin`, `demandplan`, `inventoryplan`, `masterplan`, `report`
- 카테고리: `master`, `report`, `entry`, `analysis`, `simulation`, `common`, `monitoring`
- feature: lowercase concat (예: `bfktng01`, `cmktng07`)
- action: `q1` `q2` (조회) · `s1` `s2` (저장) · `d1` `d2` (삭제) · `popq1` (팝업) · `codeq1` (공통코드)

## 4. Spring Controller 패턴

### 4.1 표준 골격
```java
@RestController
@AllArgsConstructor
public class BfKtng01Controller {

    private final UserService userService;

    @Autowired
    QueryHandler queryHandler;

    @ExecPermission(menuCd = "UI_BF_KTNG_01", type = ServiceConstants.PERMISSION_TYPE_READ)
    @PostMapping("/baselineforecast/master/bfktng01/q1")
    public List<Map<String, Object>> getData1(
        @RequestBody Map<String, Object> params,
        HttpServletRequest request) throws Exception {
        return queryHandler.getList("SP_UI_BF_KTNG_01_Q1", params);
    }
}
```

### 4.2 권한 어노테이션
| type | 의미 | TB_AD_PERMISSION_GROUP.PERMISSION_TP |
|---|---|---|
| `PERMISSION_TYPE_READ` | 조회 | `READ` |
| `PERMISSION_TYPE_UPDATE` | 저장/추가 | `UPDATE` |
| `PERMISSION_TYPE_DELETE` | 삭제 | `DELETE` |
| `PERMISSION_TYPE_EXECUTE` | 실행 (배치 등) | `EXECUTE` |

> KTNG 의 대부분 SAVE/DELETE 엔드포인트가 `UPDATE` 권한 하나로 처리 — DELETE 엔드포인트도 `UPDATE` 인 경우가 흔함.

### 4.3 저장 — 파라미터 빌드 패턴
```java
@ExecPermission(menuCd = "UI_BF_KTNG_01", type = ServiceConstants.PERMISSION_TYPE_UPDATE)
@PostMapping("/baselineforecast/master/bfktng01/s1")
public Map<String, Object> saveData1(
    @RequestBody List<Map<String, Object>> changes,
    HttpServletRequest request) throws Exception {

    String username = userService.getUserDetails().getUsername();
    Map<String, Object> resultMap = new HashMap<>();

    for (Map<String, Object> params : changes) {
        Map<String, Object> param = new HashMap<>();
        param.put("P_ACCOUNT_CD", new Object[] { params.get("ACCOUNT_CD"), String.class, ParameterMode.IN });
        param.put("P_ITEM_LV_3_CD", new Object[] { params.get("ITEM_LV3_CD"), String.class, ParameterMode.IN });
        param.put("P_START_DT", new Object[] { params.get("START_DT"), String.class, ParameterMode.IN });

        // BigDecimal 변환 — null 안전
        Object rateVal = params.get("DISCOUNT_RATE");
        BigDecimal rate = (rateVal != null && !rateVal.toString().isEmpty())
            ? new BigDecimal(rateVal.toString()) : null;
        param.put("P_DISCOUNT_RATE", new Object[] { rate, BigDecimal.class, ParameterMode.IN });

        param.put("P_USER_ID", new Object[] { username, String.class, ParameterMode.IN });

        Map<String, Object> result = queryHandler.save("SP_UI_BF_KTNG_01_S1", param);
        resultMap.putAll(result);
    }
    return resultMap;
}
```

## 5. QueryHandler API

| 메서드 | 시그니처 | 용도 |
|---|---|---|
| `getList(String spName, Map<String,Object> params)` | `→ List<Map<String,Object>>` | 조회 (SP_UI_*_Q*) |
| `save(String spName, Map<String,Object> params)` | `→ Map<String,Object>` | 저장/삭제 (SP_UI_*_S/D*) |

### 5.1 파라미터 직렬화 규칙
- 조회: `Map<String,Object>` 그대로 SP 파라미터로 전달
  - 키 이름 = SP 의 `@PARAM_NAME` 그대로 (예: `P_SALES_ORG_CD`)
  - JSX 에서도 `param.P_SALES_ORG_CD = ...` 형태로 보냄
- 저장: `Map<String,Object>` 값 = `Object[]{ value, Type.class, ParameterMode.IN }`
  - Type 후보: `String.class` · `BigDecimal.class` · `Integer.class` · `java.sql.Date.class` · `java.sql.Timestamp.class`

### 5.2 흔한 함정
- ❌ Controller 에서 `JdbcTemplate` 직접 사용 → KTNG 표준 깨짐
- ❌ Service 계층 분리 시도 (`@Service` 새로 만들기) → KTNG 패턴과 어긋남
- ❌ Entity / Repository 추가 → 사용 안 함. Map 그대로

## 6. 응답 데이터 변환 (JSX 측)

KTNG SP 가 반환하는 컬럼명은 대문자 SNAKE (예: `SALES_ORG_CD`, `START_DT`) — JSX 의 `gridItems.name` 도 그대로 대문자 SNAKE 사용.

### 6.1 일자 변환 패턴
```jsx
// 조회 응답 — YYYYMMDD 문자열 → YYYY-MM-DD (그리드 datetime 표시용)
resultData.forEach(rowData => {
  ['START_DT', 'END_DT'].forEach(key => {
    if (rowData[key]) {
      rowData[key] = rowData[key].substr(0, 4) + '-' +
                     rowData[key].substr(4, 2) + '-' +
                     rowData[key].substr(6, 2);
    }
  });
});

// 저장 직전 — YYYY-MM-DD → YYYYMMDD
changeRowData.forEach(rowData => {
  ['START_DT', 'END_DT'].forEach(key => {
    if (rowData[key]) {
      rowData[key] = rowData[key].format('yyyyMMdd');
    }
  });
});
```

### 6.2 Y/N ↔ boolean
RealGrid 의 `getOutputRow({booleanFormat: 'N:Y'}, row)` 옵션으로 자동 변환.

## 7. 공통 코드 콤보 로드

```jsx
const loadCombo = async () => {
  const list = await loadComboList({
    PROCEDURE_NAME: "SP_COMM_KTNG_COMBO_LIST",
    URL: "common/data",
    CODE_KEY: "CD",
    CODE_VALUE: "CD_NM",
    ALLFLAG: false,
    PARAM: { P_TYPE: "SALES_ORG_DO" },
  });
  if (list.length > 0) {
    setSalesOrgOptions(list);
    setValue("salesOrg", list[0].value);
  }
};
```

- `URL: "common/data"` → 백엔드의 공통 컴보 endpoint
- `PROCEDURE_NAME: "SP_COMM_KTNG_COMBO_LIST"` — KTNG 전용 공통 SP
- `PARAM.P_TYPE` 으로 코드 그룹 구분 (예: `SALES_ORG_DO`, `PROMOTION_TYPE`)

## 8. Anti-patterns

| ❌ | ✅ |
|---|---|
| Controller 에 `JdbcTemplate` 직접 인젝션 | `QueryHandler` 사용 |
| `@GetMapping` 조회 + `@PostMapping` 저장 분리 | 모두 `@PostMapping` 일관 |
| `multipart/form-data` + `getParameter("changes")` | `@RequestBody List<Map<String,Object>> changes` (JSON body) |
| Entity/Repository/Service 4종 세트 신규 작성 | Controller + SP 만 |
| URL kebab-case plural (`/user-infos`) | lowercase concat (`/bfktng01`) |
| `@ExecPermission` 누락 | 모든 엔드포인트에 명시 |
| `zAxios.get('...')` 신규 화면 | 모두 `zAxios({method:'post', ...})` |
| zAxios URL 이 Controller `@PostMapping` 과 불일치 | 1:1 정확히 |
| baseURI() 누락 → 절대 경로 사용 | `url: baseURI() + '<m>/<feature>/q1'` |
