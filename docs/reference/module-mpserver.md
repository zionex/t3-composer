# t3series-mpserver

> MP(Master Planning) 백엔드 서버 — 최소 구성의 Spring Boot REST 애플리케이션.

## 1. 모듈 개요

| 항목 | 값 |
|------|-----|
| artifactId | `t3series-mpserver` |
| packaging | `jar` |
| Main Class | `com.zionex.t3series.mp.T3SeriesMP` |
| 내부 의존 | `t3series-common`, `t3series-mp` |
| 역할 | MP 업무 백엔드 API 제공 (MP 라이브러리 기반) |

## 2. 기술 스택 요약

- **런타임**: Java 17 · Spring Boot 3.0.13
- **웹**: Spring MVC (`starter-web`) — WebFlux 없음
- **영속성**: Spring Data JPA (Hibernate + HikariCP — common 과 mp 를 통해 제공)
- **스케줄링**: Spring Boot Quartz
- **DB 드라이버**: MSSQL, Oracle(ojdbc10), PostgreSQL, EDB
- **유틸**: Apache Commons (collections4, lang3), Jython, Lombok
- **Bulk Insert**: `jsqlserverbulkinsert 4.0.1`
- **테스트**: JUnit 4.12 (BOM)

## 3. 의존성 전체 목록

### 프로젝트 내부
```
t3series:t3series-common:26.0.0-SNAPSHOT
t3series:t3series-mp:26.0.0-SNAPSHOT
```

### Spring Boot Starters
```
org.springframework.boot:spring-boot-starter-web
org.springframework.boot:spring-boot-starter-data-jpa
org.springframework.boot:spring-boot-starter-quartz
org.springframework.boot:spring-boot-configuration-processor (optional)
```

### 데이터베이스 드라이버
```
com.microsoft.sqlserver:mssql-jdbc
com.oracle.database.jdbc:ojdbc10
org.postgresql:postgresql
com.enterprisedb:edb-jdbc
```

### 유틸
```
org.apache.commons:commons-collections4
org.apache.commons:commons-lang3
de.bytefish:jsqlserverbulkinsert
org.python:jython
org.projectlombok:lombok
```

### 테스트
```
junit:junit
```

## 4. 빌드 설정 특이점

- `spring-boot-maven-plugin` mainClass = `com.zionex.t3series.mp.T3SeriesMP`
- `maven-source-plugin` 활성화
- **`build-helper-maven-plugin` 미사용** — fpserver/wingui/common 과 달리 annotation 생성 소스 디렉터리를 별도로 추가하지 않음 (QueryDSL Q타입이 필요한 구조라면 리뷰 필요)

## 5. 설정 파일

- `src/main/resources/banner.txt`
- **`logback.xml` 없음** — 로깅 설정을 외부 또는 기본값에 의존
- `application.yaml` 미포함 — 외부/배포환경에서 주입

## 6. 소스 구조

```
src/main/java/com/zionex/t3series/...
  └── mp/
      └── T3SeriesMP.java       ← Spring Boot 진입점
```

## 7. 타 모듈과의 차이 / 특이점

- **가장 미니멀한 서버 모듈** (pom.xml ~115 라인):
  - WebFlux 없음 / H2 없음 / POI 없음 / Gson 없음
  - Devtools 없음
  - MapStruct/QueryDSL 의존성을 pom에서 직접 선언하지 않음 (필요 시 common 을 통해 전이)
- **logback.xml 부재** — fpserver/fp/dpserver/wingui 와 달리 모듈 자체 로깅 설정 없음.
- **t3series-mp 라이브러리와 페어** 구조: UI 리소스와 데스크톱 의존성은 전부 `t3series-mp` 에 있고, 서버 측은 MP 라이브러리의 비-UI 로직만 활용.
- Bulk insert 필요성이 고정적임 (대량 계획 데이터 적재 가정).
