# t3series-database

> DDL · Stored Procedure · 업그레이드 스크립트 저장소. **MSSQL** 과 **Oracle** 을 **병행 지원**. Maven 모듈 아님(루트 `<modules>` 미포함).
>
> **데이터베이스 상세 분석**: [../database/README.md](../database/README.md) — 674개 테이블 · 18개 뷰 · 965개 SP/Function 의 도메인별 카탈로그 (MSSQL 2026-04-22 스냅샷 기준)

## 1. 모듈 개요

| 항목 | 값 |
|------|-----|
| 루트 경로 | `C:\Project\t3series\t3series-database\` |
| 타입 | SQL 스크립트 저장소 (DDL + Stored Procedure + 업그레이드) |
| 지원 DBMS | Microsoft SQL Server (T-SQL), Oracle Database (PL/SQL) |
| 마이그레이션 도구 | **없음** (Flyway/Liquibase 미사용) — 자체 버전 폴더 방식 |

## 2. 디렉터리 구조

```
t3series-database/
├── mssql/
│   ├── ddl/                  ← 모듈별 테이블/초기 DDL (6개 파일)
│   ├── procedures/           ← 함수·프로시저 (~1,023개)
│   └── upgrade/
│       ├── v22.0.0-YYYYMMDD/
│       ├── v22.1.0-YYYYMMDD/
│       ├── ... (13개 버전 폴더)
│       └── v25.2.0-YYYYMMDD/
└── oracle/
    ├── ddl/                  ← 동일 구조 (6개 파일)
    ├── procedures/           ← 함수·프로시저 (~834개)
    └── upgrade/
        ├── v22.0.0-YYYYMMDD/
        ├── ... (12~13개 버전 폴더)
        └── v25.2.0-YYYYMMDD/
```

## 3. 파일 수 통계

| 카테고리 | MSSQL | Oracle |
|---------|-------|--------|
| `ddl/`          | 6     | 6 |
| `procedures/`   | 1,023 | 834 |
| `upgrade/` (총) | 2,493 | 1,836 |

## 4. DDL 파일 네이밍 (모듈별)

| 파일명 | 담당 모듈 |
|--------|-----------|
| `cm-ddl.sql`    | Common |
| `fp-ddl.sql`    | Factory Planning |
| `mp-ddl.sql`    | Master Planning |
| `mp-ddl-cs.sql` | MP 클라이언트(추정) |
| `qrtz-ddl.sql`  | Quartz 스케줄러 테이블 |
| `ui-ddl.sql`    | UI / wingui |

## 5. Stored Procedure 네이밍 규약

| 접두어 | 의미 |
|--------|------|
| `FN_*` | Function |
| `SP_*` | Stored Procedure |

예:
- `FN_BF_ACCT_FILTER.sql` (Oracle, PL/SQL function)
- `SP_UI_BF_05_Q1.sql` (MSSQL, T-SQL procedure)
- `DynamicPivot.sql` (MSSQL 동적 피벗 유틸)

## 6. 업그레이드 폴더 구조

```
upgrade/vX.Y.Z-YYYYMMDD/
├── procedures/    (선택)
├── tables/        (선택)
├── functions/     (선택)
└── views/         (선택)
```

- 각 릴리스 버전마다 날짜 스탬프가 붙은 폴더 (예: `v22.0.0-20221031`)
- **22.0.0 ~ 25.2.0** 범위의 버전 폴더가 누적 보관됨 (신규 설치가 아닌 **증분 업그레이드** 지원 용도)
- Flyway 의 `V1__` 접두어, Liquibase 의 XML/YAML 메타데이터 모두 **미사용**

## 7. SQL 방언 확인

### MSSQL (T-SQL) — `cm-ddl.sql` 확인
- `NEWID()` — UUID 생성
- `NVARCHAR` / `NVARCHAR(MAX)`
- `GETDATE()` — 현재 시각
- `GO` — 배치 구분자
- `SET ANSI_NULLS`, `SET QUOTED_IDENTIFIER`

### Oracle (PL/SQL) — `cm-ddl.sql` 확인
- `SYS_GUID()` — UUID 생성
- `NVARCHAR2`
- `SYSTIMESTAMP` — 현재 시각
- `CREATE OR REPLACE FUNCTION ... IS ... BEGIN ... END`
- `JSON_TABLE` 사용 (Oracle 12c+ 기능)
- 배치 구분자 없음 (슬래시 기반)
- 스키마 수식자: `T3SMARTSCM.FN_*`

> 두 DB 모두 Korean 주석 포함 — 한국어 설명/로직 문서화가 SQL 내부에 존재.

## 8. DDL / DML 분포

- `ddl/` — DDL only (`CREATE TABLE` 등)
- `procedures/` — 함수·프로시저 (일부 Seed 데이터는 포함될 수 있음)
- `upgrade/v*/` — DDL (CREATE/ALTER TABLE) 과 DML(프로시저/함수 변경) 혼재
- **전용 seed 데이터 디렉터리 없음**

## 9. 문서화

- 최상위 및 각 하위 폴더에 **README 없음**.
- 버전 폴더의 날짜 스탬프가 사실상 유일한 변경 이력 소스.

## 10. 운영상 고려사항

- **중앙 집중 마이그레이션 도구 부재** → 수동 실행/순서 관리 필요 (`wingui` application.yaml 에 `spring.sql.init.mode: never` 설정으로 Spring 의 자동 초기화 차단).
- 프로시저 파일 수가 많아(1,800개+) 일괄 적용 시 무결성·순서 관리용 별도 스크립트(`bin/` 등)가 필요함.
- MSSQL 프로시저 수(1,023)가 Oracle(834)보다 ~200개 많음 → MSSQL 환경에서만 존재하는 최적화/유틸 프로시저가 일부 있을 가능성.
- 수요 시 Flyway/Liquibase 도입을 고려할 수 있으나, 기존 `vX.Y.Z-YYYYMMDD` 네이밍을 유지하려면 커스텀 네이밍 패턴 설정이 필요함.

## 11. 관련 애플리케이션 모듈

| 모듈 | DDL 관련성 |
|------|-----------|
| `t3series-common` | `cm-ddl.sql` (공통 인프라 테이블) |
| `t3series-fp` / `fpserver` | `fp-ddl.sql` |
| `t3series-mp` / `mpserver` | `mp-ddl.sql`, `mp-ddl-cs.sql` |
| `t3series-wingui` | `ui-ddl.sql`, `qrtz-ddl.sql` (Quartz JDBC 스토어) |
| `t3series-dpserver` | (전용 DDL 없음 — fp/mp 테이블 공유 추정) |
| `t3series-bfserver` | Python 측에서 `pyodbc`/`cx-Oracle`로 직접 접근 |
