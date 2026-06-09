# `biz_column.col_role` 분류 기준

`_infer_col_role`(`_widget_builder.py`)이 `biz_column.col_role`을 결정합니다. `비즈니스트리_DuckDB_정규화_스키마_설계.md` §5의 수정안 기준으로 분류 우선순위는 다음과 같습니다.

## 1. 우선순위 (위에서 아래로, 먼저 매치된 것이 채택)

| 순위 | 분류 | 판정 기준 | 예시 |
|---|---|---|---|
| 1 | **`time`** | `col_type`이 `DATE / DATETIME / TIMESTAMP`로 시작 | `CREATE_DTTM TIMESTAMP`, `WORK_DT DATE` |
| 2 | **`id`** | `col_name` 대문자가 `_ID / _KEY / _SEQ / _NO`로 끝남 (**타입 무관**) | `WORK_ORDER_SEQ BIGINT`, `USER_ID VARCHAR` |
| 3 | **`dimension`** (이름 기반) | `col_name`이 `_CD / _NM / _TYPE / _STATUS / _FLAG / _YN / _GB`로 끝남 | `STATUS_CD`, `ACTIV_YN`, `LINE_NM` |
| 4 | **`measure`** | 위 어디에도 안 걸리고 `col_type`이 `DECIMAL / FLOAT / DOUBLE / INT / BIGINT / NUMERIC / NUMBER`로 시작 | `PLAN_QTY DECIMAL`, `ACTUAL_AMT NUMERIC` |
| 5 | **`dimension`** (fallback) | 그 외 모두 (대표적으로 `VARCHAR / NVARCHAR / TEXT` 설명·코멘트 컬럼) | `DESCRIPTION`, `REMARK` |

## 2. 핵심 포인트

- **이름이 타입을 이긴다**: `BIGINT`라도 이름이 `_SEQ`면 `id`. 이전 버그(타입을 먼저 봤음)는 이걸 못 잡아 `measure`로 잘못 분류했습니다.
- **`time`은 타입으로만**: 컬럼명이 `_DT`여도 타입이 `DATE*`/`TIMESTAMP`가 아니면 `time`이 아닙니다(이름이 `_NO`로 끝나는 식이 아니라면 fallback `dimension`).
- **`id`는 PK 여부와 무관**: PK인지는 `biz_column.col_pk`(BOOLEAN)에 별도로 저장됩니다. `col_role='id'`는 단지 "조인/식별용 키 컬럼"을 의미합니다.
- **`measure`는 "수치 + 비-식별자 이름"의 교집합**: DECIMAL이면서 이름이 `_ID/_SEQ/_NO/_KEY`로 끝나지 않을 때만 진짜 measure로 인정.
- **fallback이 `dimension`**: `VARCHAR DESCRIPTION` 같은 컬럼은 `dimension`으로 들어갑니다(분석 기준에 노출 가능하다는 뜻).

## 3. 프론트 사용처에서 어떻게 갈리는지

- `measures` (`DomainBrowseTab.jsx:639`) = `role==='measure'` → Step 2 "측정값"
- `dimensions` (`:640`) = `role ∈ {dimension, time, id}` → Step 2 "분석 기준"
  - 그 안에서 `groupDimensions`(`:151`)가 다시 `time → 시간 기준`, `id → 고급 기준(advanced)`, `_YN/여부/상태 → 상태 기준`, 나머지 → `항목/코드 기준`으로 나눔
- `filterCols` (`:644`) = `allowed_ops` 기반 + `role==='time' || 'id'`

즉 **`col_role` 1개 값이 Step 2의 좌/우 패널 구성, advanced 접힘, filter 후보 등을 동시에 결정**합니다.

## 4. 확인 SQL

```sql
SELECT col_role, COUNT(*) FROM biz_column GROUP BY col_role;

SELECT name, col_type, col_role FROM biz_column
WHERE name LIKE '%_SEQ' OR name LIKE '%_ID' OR name LIKE '%_NO'
ORDER BY col_role, name LIMIT 30;
```

`_SEQ/_ID/_NO`가 전부 `id`로 나오면 fix가 반영된 상태, 일부라도 `measure`로 남아 있으면 export 미실행 또는 `_infer_col_role` 미수정입니다.

## 5. 참고 코드

수정된 `_infer_col_role` 시그니처 (백엔드 `_widget_builder.py`):

```python
def _infer_col_role(name: str, col_type: str) -> str:
    n = name.upper()
    t = col_type.upper()
    # 1. 시간 타입 우선
    if any(t.startswith(p) for p in ("DATE", "DATETIME", "TIMESTAMP")):
        return "time"
    # 2. ID/시퀀스 이름 패턴 (숫자 타입이어도 ID는 measure 아님)
    if n.endswith(("_ID", "_KEY", "_SEQ", "_NO")):
        return "id"
    # 3. 코드/명칭/상태 이름 패턴
    if n.endswith(("_CD", "_NM", "_TYPE", "_STATUS", "_FLAG", "_YN", "_GB")):
        return "dimension"
    # 4. 실제 수치 타입
    if any(t.startswith(p) for p in ("DECIMAL", "FLOAT", "DOUBLE", "INT", "BIGINT", "NUMERIC", "NUMBER")):
        return "measure"
    return "dimension"
```
