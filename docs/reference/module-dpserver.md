# t3series-dpserver

> DP(Demand Planning) 백엔드 서버 — **가장 경량한** Spring Boot REST 서버.

## 1. 모듈 개요

| 항목 | 값 |
|------|-----|
| artifactId | `t3series-dpserver` |
| packaging | `jar` |
| Main Class | `com.zionex.t3series.dp.T3SeriesDP` |
| 내부 의존 | `t3series-common` (유일) |
| 역할 | DP 업무 백엔드 — DB에 직접 대규모 SQL을 조립·실행하여 수요 계획 연산을 수행 |

## 2. 기술 스택 요약

- **런타임**: Java 17 · Spring Boot 3.0.13
- **웹**: Spring MVC
- **영속성**: Spring Data JPA (Hibernate + HikariCP) + JDBC
- **스케줄링**: Spring Boot Quartz
- **SQL Builder**: `com.healthmarketscience.sqlbuilder 2.1.6` — 동적 SQL 조립용
- **DB 드라이버**: **MSSQL, Oracle(ojdbc10) — 2종만**
- **유틸**: commons-dbcp2, commons-dbutils, commons-lang3, jdom2, jsqlserverbulkinsert, Lombok

## 3. 의존성 전체 목록

### 프로젝트 내부
```
t3series:t3series-common:26.0.0-SNAPSHOT
```

### Spring Boot Starters
```
org.springframework.boot:spring-boot-starter-web
org.springframework.boot:spring-boot-starter-quartz
org.springframework.boot:spring-boot-starter-data-jpa
org.springframework.boot:spring-boot-configuration-processor (optional)
```

### SQL/유틸
```
com.healthmarketscience.sqlbuilder:sqlbuilder   (BOM 2.1.6)
org.apache.commons:commons-dbcp2
commons-dbutils:commons-dbutils
org.apache.commons:commons-lang3
org.jdom:jdom2
de.bytefish:jsqlserverbulkinsert
org.projectlombok:lombok
```

### 데이터베이스 드라이버
```
com.microsoft.sqlserver:mssql-jdbc
com.oracle.database.jdbc:ojdbc10
```

## 4. 빌드 설정 특이점

- `spring-boot-maven-plugin` mainClass = `com.zionex.t3series.dp.T3SeriesDP`
- `maven-source-plugin` 미설정 (서버 모듈 중 유일)
- `build-helper-maven-plugin` 없음 — QueryDSL 미사용을 반영

## 5. 설정 파일

- `src/main/resources/banner.txt`
- `src/main/resources/logback.xml` — 로깅 설정
- `application.yaml` 미포함 — 외부에서 주입

## 6. 소스 구조

```
src/main/java/com/zionex/t3series/...
  └── dp/
      └── T3SeriesDP.java      ← Spring Boot 진입점
```

## 7. 타 모듈과의 차이 / 특이점

- **DB 지원 범위가 좁음**: 프로젝트 내 유일하게 **MSSQL + Oracle 만** 지원. PostgreSQL/EDB/H2/SQLite 전부 제외 — 특정 고객사/엔터프라이즈 환경 한정 배포로 추정.
- **sqlbuilder 2.1.6** 사용 — 다른 서버들은 JPA/QueryDSL 로만 쿼리를 조립하는 반면 DP 는 `sqlbuilder` 로 **프로그래매틱 SQL** 을 별도 조립.
- **commons-dbcp2 직접 사용** — 타 모듈은 HikariCP만 사용하는 반면 DP는 보조 커넥션 풀로 dbcp2를 활용 가능.
- **MapStruct/QueryDSL 의존성 선언 없음** — 코드 매핑을 수동/간단한 방식으로 처리.
- **WebFlux, H2, Gson, POI, 테스트 프레임워크 모두 없음** — 서버 모듈 중 의존성이 가장 적음 (pom.xml ~102 라인).
- **Quartz 포함** — 배치형 일정 수요 예측 작업 실행용.
