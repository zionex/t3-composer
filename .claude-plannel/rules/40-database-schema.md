# 40. PostgreSQL 스키마 컨벤션 (PlanNEL)

> PlanNEL DB = **단일 PostgreSQL 인스턴스 + 다수 schema (테넌트별 격리)**. 모든 비즈니스 테이블은 **`z_*` prefix**, 마스터 / 시스템 테이블은 `public.*`.
>
> 마이그레이션은 **Liquibase**. 신규 테이블 추가 시 changelog 파일에 기록 + 모든 active tenant schema 에 적용.

## 1. Schema 구조

```
postgres
├── public                            ← 마스터 / 시스템 (모든 테넌트 공유)
│   ├── tenant                        ← 테넌트 메타 (tenant_id, schema, name, ...)
│   ├── role                          ← 시스템 role 마스터 (ROLE_ADMIN / ROLE_APP_DP / ...)
│   ├── QRTZ_*                        ← Quartz Scheduler (JDBC JobStore)
│   └── ...
├── zionex                            ← Tenant 1 schema (기본)
│   ├── z_customer
│   ├── z_item
│   └── ... (z_* 비즈니스 테이블 전체)
├── tenant2                           ← Tenant 2 schema
│   ├── z_customer
│   └── ...
└── ...
```

각 테넌트 schema 는 **z_* 테이블 전체 set 동일 구조**로 보유.

## 1.1 Multi-tenancy 핵심 원칙 (SaaS 핵심)

> ★ **schema-per-tenant 격리** — `tenant_id` 컬럼이 비즈니스 테이블에 **존재하지 않는다**. 격리는 PostgreSQL schema level 에서만 이루어짐.

| 항목 | T3Series(wingui) | PlanNEL(SaaS) |
|---|---|---|
| 격리 방식 | `PLAN_SCOPE` 컬럼 필터 | PostgreSQL schema 분리 |
| 연결 전환 | 없음 (단일 DB) | `connection.setSchema(tenantSchema)` 자동 |
| 테넌트 식별 컬럼 | 비즈니스 테이블에 존재 | **비즈니스 테이블에 없음** |
| 테넌트 메타 | — | `public.tenant` (tenant_id, schema, name) |

**구현**: `SchemaBasedMultiTenantConnectionProvider` 가 Hibernate `CurrentTenantIdentifierResolver` 와 연동 → 요청마다 올바른 schema 로 `connection.setSchema()` 호출. Entity 는 `@Table(name = "z_customer")` 만 적으면 됨 — schema prefix 하드코딩 금지.

```java
// ❌ 금지 — schema 하드코딩
@Table(name = "zionex.z_customer")

// ✅ 올바름 — schema 는 Hibernate 가 search_path 로 자동 주입
@Table(name = "z_customer")
```

쿼리에서도 schema prefix 없이 작성:
```sql
-- ❌ 금지 — schema 하드코딩
SELECT * FROM zionex.z_customer WHERE active_flg = 'Y';

-- ✅ 올바름 — search_path 가 자동으로 올바른 테넌트 schema 로 resolve
SELECT * FROM z_customer WHERE active_flg = 'Y';
```

## 2. 테이블명 컨벤션

### 2.1 prefix `z_*`

모든 비즈니스 테이블은 **`z_<lowercase_snake>`** 형식.

```
z_customer · z_item · z_location · z_supplier · z_company
z_bod · z_bod_item · z_customer_hrchy · z_item_hrchy
z_bf_result · z_bf_leaderboard
z_dp_version · z_dp_workbench · z_dp_process
z_ip_settings · z_ip_evaluation · z_ip_scenario · z_ip_classification
z_mp_workcenter · z_mp_demand · z_mp_review
z_rp_run_history · z_rp_review · z_rp_target
z_user · z_user_role · z_user_setting
z_p13n · z_lang_pack · z_audit_log
```

### 2.2 도메인 prefix (z_ 다음)

| prefix | 도메인 |
|---|---|
| `z_` (도메인 없음) | 마스터 / 공통 (`z_customer`, `z_item`, `z_location`) |
| `z_bf_` | Baseline Forecasting |
| `z_dp_` | Demand Plan |
| `z_ip_` | Inventory Plan |
| `z_rp_` | Replenishment Plan |
| `z_mp_` | Master Plan |
| `z_user_` | 사용자 관련 |

### 2.3 ❌ 절대 사용 금지

- `TB_*` (T3Series 컨벤션)
- `tbl_*` / `table_*` 접두어
- 대문자 / camelCase (`zCustomer`)
- 단수/복수 혼용 (테이블은 보통 단수: `z_customer` — 복수형 `z_customers` 금지)

## 3. 컬럼 네이밍 컨벤션

### 3.1 접미사

| 접미사 | 의미 | 예 |
|---|---|---|
| `_cd` | 코드 (UNIQUE 식별자) | `customer_cd`, `item_cd`, `currency_cd`, `loc_cd` |
| `_id` | FK (BIGINT) | `hrchy_id`, `bod_id`, `item_id` |
| (이름 / 자유 텍스트) | 명칭 | `name`, `desc_txt` |
| `_flg` | boolean (`Y/N` 1자) | `active_flg`, `del_flg`, `ip_fixed_flg` |
| `_ts` | timestamp | `created_ts`, `updated_ts` |
| `_dt` | date (날짜만) | `ship_rel_aprvl_dt`, `end_of_prod_dt`, `join_dt` |
| `_by` | 사용자 ID (BIGINT) | `created_by`, `updated_by` |
| `_num` | 숫자 (정수/수치) | `qty_num`, `ver_num`, `seq_num` |
| `_txt` | 긴 텍스트 (TEXT 컬럼) | `desc_txt`, `remark_txt` |
| `attr01..attr20` | 유연한 사용자 정의 속성 | (Customer/Item 등에 20개씩) |

### 3.2 Audit 컬럼 (모든 z_* 테이블 공통 — `BaseEntity` 상속)

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | BIGINT | PK (Instagram-style ID) |
| `created_ts` | TIMESTAMP NOT NULL | 생성 시각 (Hibernate 자동) |
| `created_by` | BIGINT | 생성자 user ID |
| `updated_ts` | TIMESTAMP NOT NULL | 수정 시각 (Hibernate 자동) |
| `updated_by` | BIGINT | 수정자 user ID |
| `ver_num` | INTEGER | Optimistic Locking version |

→ Java `BaseEntity` (`t3series.saas.model.BaseEntity`) 상속하면 자동 매핑.

## 4. 기본키 — Instagram-style ID

```sql
CREATE OR REPLACE FUNCTION zionex.next_unique_id() RETURNS BIGINT AS $$
DECLARE
    shard_id INT := 1;
    epoch DATE := '2021-01-01';
    epoch_ms BIGINT;
    now_ms BIGINT;
    next_id BIGINT;
BEGIN
    epoch_ms := floor(extract(EPOCH FROM epoch) * 1000);
    now_ms := floor(extract(EPOCH FROM clock_timestamp()) * 1000);
    next_id := (now_ms - epoch_ms) << 23
        | (shard_id << 16)
        | (nextval('zionex.table_id_seq') % 65536);
    RETURN next_id;
END;
$$ LANGUAGE plpgsql;
```

테이블 정의:
```sql
CREATE TABLE zionex.z_customer (
    id BIGINT NOT NULL DEFAULT zionex.next_unique_id(),
    customer_cd VARCHAR NOT NULL,
    name VARCHAR NOT NULL,
    -- ...
    created_ts TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT NOT NULL DEFAULT 0,
    updated_ts TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT NOT NULL DEFAULT 0,
    ver_num INTEGER NOT NULL DEFAULT 0,
    UNIQUE (customer_cd),
    PRIMARY KEY (id)
);
```

→ JPA `@Id @GeneratedValue(strategy = GenerationType.IDENTITY)` 가 이 default 값을 받음.

★ ID 가 BIGINT (53-bit number 한계 초과 가능) → frontend 에서 `json-bigint` 처리 필수 (`axios-bigint.js`).

## 5. 핵심 테이블 카테고리

### 5.1 마스터

| 테이블 | 역할 |
|---|---|
| `z_customer` | 거래처 |
| `z_customer_hrchy` | 거래처 계층 (5단계까지: customer_hrchy01..05) |
| `z_item` | 품목 |
| `z_item_hrchy` | 품목 계층 |
| `z_location` | 거점 |
| `z_supplier` | 공급처 |
| `z_supplier_item` | 공급처-품목 매핑 (LT 등) |
| `z_company` | 회사 정보 |
| `z_currency` | 통화 |
| `z_calendar` | 캘린더 |
| `z_calendar_group` | 캘린더 그룹 |
| `z_resource` | 자원 |
| `z_workcenter` | 작업장 |

### 5.2 모듈별

| prefix | 테이블 예 |
|---|---|
| `z_bf_` | `z_bf_result`, `z_bf_leaderboard`, `z_bf_features_date`, `z_bf_model` |
| `z_dp_` | `z_dp_version`, `z_dp_workbench`, `z_dp_process_mgmt`, `z_dp_finance_plan` |
| `z_ip_` | `z_ip_settings`, `z_ip_evaluation`, `z_ip_scenario`, `z_ip_classification`, `z_ip_target_simulation` |
| `z_rp_` | `z_rp_run_history`, `z_rp_review`, `z_rp_target` |
| `z_mp_` | `z_mp_workcenter`, `z_mp_demand`, `z_mp_review`, `z_mp_bod`, `z_mp_bod_item` |

### 5.3 관계 / Junction 테이블

```
z_bod                     ← BOD (Bill of Distribution)
z_bod_item                ← BOD-품목 매핑
z_customer_item           ← 거래처-품목 매핑
z_location_item           ← 거점-품목 매핑
z_route                   ← 라우팅
```

`UNIQUE` 제약 패턴:
```sql
CREATE TABLE zionex.z_bod_item (
    id BIGINT NOT NULL DEFAULT zionex.next_unique_id(),
    bod_id BIGINT,
    item_id BIGINT,
    -- ...
    PRIMARY KEY (id),
    UNIQUE (bod_id, item_id)                    -- ★ junction 의 자연 키
);
```

### 5.4 시스템 / 사용자

| 테이블 | 역할 |
|---|---|
| `z_user` | 사용자 |
| `z_user_role` | 사용자-Role 매핑 (M:N) |
| `z_user_setting` | 사용자별 설정 |
| `z_p13n` | 화면별 개인화 (column 표시/순서/필터 등) |
| `z_lang_pack` | 다국어 (필요 시) |
| `z_audit_log` | 감사 로그 (Hibernate Interceptor) |

### 5.5 마스터 (`public.*`)

| 테이블 | 역할 |
|---|---|
| `public.tenant` | 테넌트 메타 (tenant_id, schema, name, plan_type, ...) |
| `public.role` | Role 마스터 (`ROLE_ADMIN`, `ROLE_APP_DP`, `ROLE_DP_MGR`, ...) |
| `public.QRTZ_*` | Quartz Scheduler 테이블 (스케줄링 공유) |

## 6. JPA Entity ↔ Table 매핑

```java
@Entity
@Table(name = "z_customer")
public class Customer extends BaseEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;                                                     // → id

    @NotBlank
    private String customerCd;                                           // → customer_cd (Hibernate 자동 snake_case 변환)

    @Column(name = "desc_txt")                                           // ★ 자동 변환과 다른 컬럼명
    private String descTxt;

    @ManyToOne
    @JoinColumn(name = "hrchy_id")                                       // → hrchy_id FK
    @JsonIgnore
    private CustomerHrchy customerHrchy;

    @Convert(converter = BooleanToYNConverter.class)
    private boolean activeFlg;                                           // → active_flg (CHAR(1) Y/N)

    private String name;                                                 // → name
    private String currencyCd;                                           // → currency_cd
}
```

### 6.1 컬럼 자동 매핑 규칙

- camelCase Java field → snake_case DB column (Hibernate `SpringPhysicalNamingStrategy`)
  - `customerCd` → `customer_cd`
  - `activeFlg` → `active_flg`
  - `createdTs` → `created_ts` (BaseEntity)
- 다르면 명시: `@Column(name = "desc_txt")`

## 7. Migration (Liquibase)

위치: `saas-application/src/main/resources/db/changelog/`

```
db/changelog/
├── db.changelog-tenant.yaml                    ← 마스터 changelog (모든 sub 포함)
├── db.changelog-tenant-ddl-1.0.yaml            ← DDL (CREATE TABLE / ALTER TABLE)
├── db.changelog-tenant-dml-1.0.yaml            ← DML (INSERT 시드 데이터)
├── liquibase.properties
└── sql/
    └── tenant_seed_data_user_role.sql          ← Role 시드
```

원본 SQL:
```
saas-application/src/main/sql/
├── postgres-ddl-public.sql                     ← public schema 시스템 테이블
├── postgres-ddl-tenant.sql                     ← 테넌트 schema 의 z_* 테이블 전체
├── postgres-ddl-provisioning.sql               ← 프로비저닝
├── postgres-sample-data.sql                    ← 샘플 데이터
└── postgres-seed-data.sql                      ← 신규 테넌트 초기 데이터
```

application.yml:
```yaml
spring:
  jpa:
    properties:
      hibernate:
        ddl-auto: none                          # ★ Liquibase 가 schema 관리
        dialect: org.hibernate.dialect.PostgreSQLDialect
```

### 7.1 신규 테이블 추가 절차

1. `postgres-ddl-tenant.sql` 에 `CREATE TABLE zionex.z_<new_name>` 추가
2. Liquibase changelog 에 changeset 추가:

```yaml
# db.changelog-tenant-ddl-1.0.yaml
- changeSet:
    id: 2026-05-15-add-new-item
    author: <username>
    changes:
      - createTable:
          tableName: z_new_item
          columns:
            - column:
                name: id
                type: BIGINT
                constraints: { primaryKey: true, nullable: false }
                defaultValueComputed: zionex.next_unique_id()
            - column: { name: item_cd, type: VARCHAR, constraints: { nullable: false } }
            - column: { name: name, type: VARCHAR }
            - column: { name: active_flg, type: CHAR(1), defaultValue: 'Y' }
            - column: { name: created_ts, type: TIMESTAMP, defaultValueComputed: CURRENT_TIMESTAMP }
            - column: { name: created_by, type: BIGINT, defaultValue: 0 }
            - column: { name: updated_ts, type: TIMESTAMP, defaultValueComputed: CURRENT_TIMESTAMP }
            - column: { name: updated_by, type: BIGINT, defaultValue: 0 }
            - column: { name: ver_num, type: INTEGER, defaultValue: 0 }
      - addUniqueConstraint:
          tableName: z_new_item
          columnNames: item_cd
```

3. 모든 active tenant schema 에 적용 (Liquibase 가 자동 — schema 별 반복)

### 7.2 신규 컬럼 추가

```yaml
- changeSet:
    id: 2026-05-15-add-priority-to-customer
    author: <username>
    changes:
      - addColumn:
          tableName: z_customer
          columns:
            - column: { name: priority_num, type: INTEGER, defaultValue: 0 }
```

## 8. 인덱스 / 제약

### 8.1 표준 인덱스

```sql
-- UNIQUE 자연 키 (예: customer_cd)
CREATE UNIQUE INDEX uk_z_customer_customer_cd ON zionex.z_customer (customer_cd);

-- FK 컬럼에 인덱스 (PostgreSQL 은 FK 에 자동 인덱스 안 만듦)
CREATE INDEX idx_z_customer_hrchy_id ON zionex.z_customer (hrchy_id);

-- 자주 사용하는 검색 컬럼
CREATE INDEX idx_z_item_active_flg ON zionex.z_item (active_flg);
```

### 8.2 외래키 제약 (`FOREIGN KEY`)

PlanNEL 은 비즈니스 데이터 일관성을 위해 FK 활용:

```sql
ALTER TABLE zionex.z_customer
ADD CONSTRAINT fk_z_customer_hrchy_id
FOREIGN KEY (hrchy_id) REFERENCES zionex.z_customer_hrchy (id);
```

→ Entity 의 `@ManyToOne @JoinColumn(name="hrchy_id")` 와 1:1.

## 9. 자주 쓰는 쿼리 패턴

### 9.1 Active 만 조회 + 삭제 안 된 것
```sql
SELECT * FROM zionex.z_customer
 WHERE active_flg = 'Y' AND del_flg = 'N'
 ORDER BY customer_cd;
```

### 9.2 검색 + 페이징
```sql
SELECT * FROM zionex.z_customer
 WHERE active_flg = 'Y'
   AND (customer_cd ILIKE '%' || :keyword || '%' OR name ILIKE '%' || :keyword || '%')
 ORDER BY customer_cd
 LIMIT :pageSize OFFSET (:page * :pageSize);
```

### 9.3 계층 쿼리 (재귀 CTE)
```sql
WITH RECURSIVE hrchy AS (
    SELECT id, hrchy_cd, parent_id, 0 AS level
      FROM zionex.z_customer_hrchy WHERE parent_id IS NULL
    UNION ALL
    SELECT h.id, h.hrchy_cd, h.parent_id, p.level + 1
      FROM zionex.z_customer_hrchy h
      JOIN hrchy p ON h.parent_id = p.id
)
SELECT * FROM hrchy ORDER BY level, hrchy_cd;
```

### 9.4 Audit 누가 언제
```sql
SELECT c.customer_cd, c.name, c.updated_ts, u.username AS updated_user
  FROM zionex.z_customer c
  LEFT JOIN zionex.z_user u ON u.id = c.updated_by
 ORDER BY c.updated_ts DESC
 LIMIT 100;
```

## 10. 신규 테이블 체크리스트

- [ ] 테이블명 = `z_<lowercase_snake>` ?
- [ ] PK = `id BIGINT` (DEFAULT `zionex.next_unique_id()`) ?
- [ ] Audit 6컬럼 (created_ts/created_by/updated_ts/updated_by/ver_num) 포함 ?
- [ ] UNIQUE 자연 키 (예: `customer_cd`) 정의 ?
- [ ] FK 컬럼 (`*_id`) 에 인덱스 ?
- [ ] boolean 컬럼은 `CHAR(1)` + DEFAULT `'N'` 또는 `'Y'` ?
- [ ] timestamp 컬럼은 `TIMESTAMP` + DEFAULT `CURRENT_TIMESTAMP` ?
- [ ] 자주 검색되는 컬럼 (예: `active_flg`) 인덱스 ?
- [ ] Liquibase changeset 추가 ?
- [ ] `postgres-ddl-tenant.sql` 에 동일 DDL 반영 (개발용 참고) ?
- [ ] Java Entity 작성 (`@Table(name="z_<...>") extends BaseEntity`) ?
- [ ] DTO + Repository + Service + Controller 4종 세트 작성 ?
- [ ] `@PreAuthorize` 명시 ?

## 11. Anti-patterns

| ❌ | ✅ |
|---|---|
| 테이블명 `TB_*` / `TB_AD_*` / `TB_UT_*` (T3Series 컨벤션) | `z_<lowercase_snake>` |
| 테이블명 대문자 / camelCase | 소문자 + snake_case |
| 컬럼명 `EMAIL` (대문자) | `email` (소문자) |
| 컬럼명 `userId` (camelCase) | `user_id` (snake_case) |
| audit 컬럼명 `MODIFY_BY` / `MODIFY_DTTM` (T3Series 명칭) | `updated_by` / `updated_ts` (PlanNEL BaseEntity 규약) |
| audit 컬럼명 `CREATE_BY` / `CREATE_DTTM` (T3Series 명칭) | `created_by` / `created_ts` |
| audit 컬럼명 `UPDATE_BY` / `UPDATE_DTTM` | `updated_by` / `updated_ts` |
| `BaseEntity` 경로 `t3series.saas.multi_tenancy.model.BaseEntity` | `t3series.saas.model.BaseEntity` |
| 비즈니스 테이블에 `tenant_id` 컬럼 추가 (T3Series `PLAN_SCOPE` 방식) | schema-per-tenant — 컬럼 없음 |
| SQL / Entity 에 schema prefix 하드코딩 (`zionex.z_customer`) | `z_customer` 만 — search_path 자동 |
| boolean 컬럼을 `BOOLEAN` 으로 | `CHAR(1)` + `Y/N` (BooleanToYNConverter 호환) |
| timestamp 를 `TIMESTAMP WITH TIME ZONE` | `TIMESTAMP` (컨벤션) |
| ID 를 `SERIAL` / `IDENTITY` 로 | `BIGINT DEFAULT zionex.next_unique_id()` (Instagram-style) |
| 시퀀스 직접 사용 (`nextval('seq')`) | `next_unique_id()` 함수 |
| 신규 테이블에 audit 컬럼 누락 | 6컬럼 (id/created_ts/created_by/updated_ts/updated_by/ver_num) 필수 |
| Liquibase 우회한 ALTER TABLE 직접 실행 | 모든 schema 변경은 changelog 통해 |
| `public.*` 비즈니스 테이블 추가 | `public` 은 시스템 only — 비즈니스는 테넌트 schema |
| Entity 의 `@Column(name=...)` 누락 — 자동 변환과 컬럼명 다름 | 명시 (예: `@Column(name = "desc_txt")` for `descTxt`) |
| FK 컬럼에 인덱스 누락 | `CREATE INDEX idx_<table>_<col>` 명시 |
| `attr01..attr20` 컬럼 추가하면서 의미 문서화 안 함 | 사용 패턴은 `z_p13n` 또는 별도 메타에 문서화 |
| 새 모듈 prefix 임의 사용 | `z_bf_` / `z_dp_` / `z_ip_` / `z_rp_` / `z_mp_` 5종 안에서 |
| SP 기반 CRUD (`SP_UI_*` / `callService`) | JPA Repository + Service (PostgreSQL 은 JdbcTemplate + SP 불필요) |
