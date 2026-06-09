# Business Tree DuckDB 정규화 스키마 설계

대상 파일(백엔드): `C:\PJT\t3series-insight-neo\packages\insight-llm\src\server\blueprints\dashboard\_widget_builder.py`
대상 DB: `C:\PJT\t3series-insight-neo\packages\insight-llm\src\t3_modules\utils\bussiness_tree\business_tree.duckdb`

## 1. Context

현재 `business_tree.duckdb`는 단일 flat 테이블(15컬럼)로 모든 메타정보를 관리한다. 이로 인해 발생하는 문제:

| 문제 | 원인 | 영향 |
|------|------|------|
| 지표 없음(수치 컬럼 없음) 케이스 과다 | `_infer_col_role`에서 type 체크가 name 체크보다 먼저 실행 → `WORK_ORDER_SEQ BIGINT` 같은 ID 컬럼이 "measure"로 분류됨 | Step 2에서 가짜 measure 컬럼 표시 or 반대로 실제 measure가 없는 경우 혼동 |
| 키워드 단일화 손실 | `_organize_for_businesstree`가 `category` 하나만 keyword로 저장; source metadata의 `keywords` 배열 전체 무시 | 목적 목록에서 테이블이 하나의 키워드로만 노출 |
| LLM 메타 저장 안 됨 | `confidence`, `rationale`, `sub_category` 등 source JSON 필드가 DuckDB에 미보존 | 메타 정보 관리 탭에서 품질 기반 필터링 불가 |
| JOIN 정보 미저장 | 현재 joins는 `_organize_for_businesstree`에서 파싱되나 `_write_business_tree_db`에서 저장 안 됨 | 후보 scoring의 `join_score`가 0으로 고정 |

## 2. 신규 DDL

```sql
-- 1. 테이블 기본 메타 (source JSON 구조 그대로 보존)
CREATE TABLE biz_table (
    id              VARCHAR PRIMARY KEY,
    ds_name         VARCHAR,
    name            VARCHAR NOT NULL,
    comment         VARCHAR,
    use_yn          VARCHAR DEFAULT 'Y',
    table_type      VARCHAR,
    grain           TEXT,
    business_domain VARCHAR,
    category        VARCHAR,
    sub_category    VARCHAR,
    description     TEXT,
    table_role      VARCHAR,   -- FACT / MASTER / VIEW / MAPPING / CONFIG / LOG / CALENDAR
    confidence      DOUBLE,
    rationale       TEXT,
    module          VARCHAR,
    create_by       VARCHAR,
    create_dttm     TIMESTAMP,
    modify_by       VARCHAR,
    modify_dttm     TIMESTAMP
);

-- 2. 컬럼 메타 (1행 = 1컬럼)
CREATE TABLE biz_column (
    id              VARCHAR PRIMARY KEY,
    table_id        VARCHAR NOT NULL,
    name            VARCHAR NOT NULL,
    col_type        VARCHAR,
    col_pk          BOOLEAN DEFAULT FALSE,
    col_comment     TEXT,
    col_indexed     BOOLEAN DEFAULT FALSE,
    col_role        VARCHAR,   -- time / measure / dimension / id
    col_agg         VARCHAR,   -- SUM / AVG / COUNT / MAX / MIN
    col_allowed_ops VARCHAR
);

-- 3. 키워드 (테이블당 N개, 모듈당 M개 가능)
CREATE TABLE biz_keyword (
    table_id   VARCHAR NOT NULL,
    module     VARCHAR NOT NULL,
    keyword    VARCHAR NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (table_id, module, keyword)
);

-- 4. 조인 관계 (FK 기반, 후보 scoring용)
CREATE TABLE biz_join (
    table_id  VARCHAR NOT NULL,
    col_name  VARCHAR NOT NULL,
    ref_table VARCHAR NOT NULL,
    ref_col   VARCHAR NOT NULL,
    PRIMARY KEY (table_id, col_name, ref_table, ref_col)
);
```

## 3. 테이블별 역할

| 테이블 | 역할 | 핵심 추가 정보 |
|--------|------|----------------|
| `biz_table` | 테이블 기본 메타 | `confidence`, `rationale`, `sub_category`, `category` 보존 |
| `biz_column` | 컬럼별 semantic 메타 | 컬럼 id, role(수정된 infer), agg, allowed_ops |
| `biz_keyword` | 테이블당 다중 키워드 | `is_primary` 플래그로 주 키워드 구분 |
| `biz_join` | FK/조인 관계 | 후보 scoring의 join_score 활성화 |

## 4. 활용 방법 (API 흐름)

### 4.1 Export — `POST /insight/widget-builder/export-businesstree`

```
DBMetaDataHandler.find_all(include_columns=True, include_foreign_keys=True)
  ↓ _organize_for_businesstree (수정: keywords 배열 전체 보존, rich meta 보존)
  ↓ _write_business_tree_db (교체: 4개 테이블에 분산 INSERT)
  → biz_table + biz_column + biz_keyword + biz_join
```

### 4.2 Query — `GET /insight/widget-builder/business-tree?module=FP`

```sql
SELECT k.module, k.keyword, k.is_primary,
       t.*, c.*, j.*
FROM biz_keyword k
JOIN biz_table t ON k.table_id = t.id
LEFT JOIN biz_column c ON c.table_id = t.id
LEFT JOIN biz_join j ON j.table_id = t.id
WHERE (k.module = ? OR ? IS NULL)
ORDER BY k.module, k.keyword, t.name, c.name
```

응답 포맷은 기존과 동일:
```json
[{
  "module": "FP",
  "keyword": "production",
  "tables": [{
    "name": "TB_FP_WIP",
    "description": "...",
    "grain": "...",
    "table_type": "table",
    "table_role": "FACT",
    "columns": [{"name": "PLAN_QTY", "type": "DECIMAL", "role": "measure", ...}],
    "joins": [{"col": "WORK_ORDER_ID", "ref": "TB_FP_WORK_ORDER.ID"}]
  }]
}]
```

### 4.3 후보 scoring — `POST /insight/widget-builder/business-tree/candidates`

- 로직 변경 없음
- `biz_join`이 채워지면서 `join_score`가 정상 작동 (기존엔 항상 0)

### 4.4 메타 정보 관리 탭 — `GET /insight/widget-builder/source-metadata`

- 이 탭은 DuckDB가 아닌 source DB(SQLAlchemy)에서 직접 읽으므로 변경 없음
- 단, 향후 `confidence`/`sub_category` 기반 필터링을 `/business-tree` API에 추가 가능

## 5. `_infer_col_role` 버그 수정

### 현재 (버그)
```python
if numeric_type:        # DECIMAL, INT, BIGINT ...
    return "measure"    # ← 여기서 return → name 체크 미실행
if name.endswith(("_ID", "_SEQ", "_NO")):
    return "id"         # ← 도달 불가 (numeric type 컬럼)
```

`WORK_ORDER_SEQ BIGINT` → "measure"로 잘못 분류됨.

### 수정 후
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

## 6. 프론트엔드 영향

`DomainBrowseTab.jsx`의 입장에서 보면:

| 영역 | 변화 |
|------|------|
| `getBusinessTreeModules()` 응답 | 그대로 (`List[str]`) |
| `getBusinessTree(module)` 응답 | 그대로 (포맷 유지). 단 키워드별로 더 많은 테이블이 노출됨 |
| `getBusinessTreeCandidates(...)` 응답 | 그대로. `join_score`가 활성화되어 점수가 더 정확 |
| Step 1 목적 목록 | source의 `keywords` 배열 전체 사용 → 목적 수 증가 가능 |
| Step 2 측정값 표시 | `_ID/_SEQ/_NO` 숫자 컬럼이 measure에서 제외 → "수치 컬럼 없음" 케이스가 진짜 MASTER/CONFIG에만 발생 |

API 호출 시그니처와 응답 스키마는 동일하므로 프론트엔드 코드 변경 불필요.

## 7. 검증 방법

### 7.1 스키마 확인
```python
import duckdb
con = duckdb.connect(r"...\business_tree.duckdb", read_only=True)
con.execute("SHOW TABLES").fetchall()
# → [('biz_table',), ('biz_column',), ('biz_keyword',), ('biz_join',)]
```

### 7.2 다중 키워드 보존 확인
```sql
SELECT t.name, COUNT(k.keyword) AS kw_count
FROM biz_table t JOIN biz_keyword k ON k.table_id = t.id
GROUP BY t.name ORDER BY kw_count DESC LIMIT 10;
-- → 테이블당 1개 이상의 키워드
```

### 7.3 measure role 수정 확인
```sql
SELECT name, col_type, col_role FROM biz_column
WHERE name LIKE '%_SEQ' OR name LIKE '%_NO' OR name LIKE '%_ID'
LIMIT 20;
-- → col_role이 'id'여야 함 (이전에는 'measure')
```

### 7.4 프론트 동작
- DashboardStudio → Widget Builder → 비즈니스 탐색 탭
- factory_planning 모듈 선택 → 목적 선택
- Step 2: 수치 컬럼 없음 케이스가 MASTER/CONFIG 테이블에만 표시
- FACT 테이블 선택 시 실제 measure 컬럼(PLAN_QTY, ACTUAL_QTY 등) 표시
