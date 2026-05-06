# t3series-fpserver

> FP(Factory Planning) 백엔드 서버 — Spring Boot REST/WebFlux 애플리케이션.

## 1. 모듈 개요

| 항목 | 값 |
|------|-----|
| artifactId | `t3series-fpserver` |
| packaging | `jar` |
| Main Class | `com.zionex.t3series.fp.T3SeriesFP` |
| 내부 의존 | `t3series-common` |
| 실행 | `spring-boot-maven-plugin` |

## 2. 기술 스택 요약

- **런타임**: Java 17 · Spring Boot 3.0.13
- **웹**: Spring MVC + WebFlux
- **영속성**: Spring Data JPA · Hibernate · QueryDSL (Jakarta) · HikariCP
- **스케줄링**: Spring Boot Quartz
- **DB 드라이버**: MSSQL, Oracle(ojdbc10), PostgreSQL, EDB, **H2**
- **문서/직렬화**: Apache POI 3.15 + poi-ooxml, Gson 2.10.1, Jackson
- **개발편의**: Spring Boot Devtools, Lombok, Jython
- **테스트**: JUnit BOM 5.9.0, JUnit Jupiter, `spring-boot-starter-test`

## 3. 의존성 전체 목록

### 프로젝트 내부
```
t3series:t3series-common:26.0.0-SNAPSHOT
```

### Spring Boot Starters
```
org.springframework.boot:spring-boot-starter-web
org.springframework.boot:spring-boot-starter-data-jpa
org.springframework.boot:spring-boot-starter-webflux
org.springframework.boot:spring-boot-starter-quartz
org.springframework.boot:spring-boot-starter-test
```

### Spring Framework 부가
```
org.springframework.boot:spring-boot-devtools (runtime)
```

### ORM / Query
```
com.querydsl:querydsl-apt:5.0.0  (classifier: jakarta, provided)
com.querydsl:querydsl-jpa:5.0.0  (classifier: jakarta)
```

### 데이터베이스 드라이버
```
com.microsoft.sqlserver:mssql-jdbc
com.oracle.database.jdbc:ojdbc10
org.postgresql:postgresql
com.enterprisedb:edb-jdbc
com.h2database:h2                   ← fpserver 고유 (공통 미포함)
de.bytefish:jsqlserverbulkinsert
```

### 유틸/문서
```
org.apache.commons:commons-collections4
org.apache.commons:commons-lang3
com.google.code.gson:gson
org.python:jython
org.projectlombok:lombok
org.apache.poi:poi
org.apache.poi:poi-ooxml
```

### 테스트
```
org.junit.jupiter:junit-jupiter      (scope: test)
```

### dependencyManagement
```
org.junit:junit-bom:5.9.0 (import)
```

### 주석처리된 의존성
```xml
<!-- <dependency><groupId>org.mapstruct</groupId><artifactId>mapstruct</artifactId><version>1.5.5.Final</version></dependency> -->
```
> MapStruct 의존성은 주석처리되어 있으나, **루트 `annotationProcessorPaths` 에서는 여전히 활성** — APT 수준의 코드 생성은 가능하나 런타임 `@Mapper` 인터페이스 사용 시 의도한 동작과 괴리가 있을 수 있음. (검토 필요)

## 4. 빌드 설정 특이점

- `spring-boot-maven-plugin` 에서 `mainClass` 를 명시적으로 지정: `com.zionex.t3series.fp.T3SeriesFP`
- `build-helper-maven-plugin 3.2.0` — `generated-sources/annotations` 를 소스 추가
- `maven-source-plugin` — 소스 JAR 배포 (GitHub Packages 용)

## 5. 설정 파일

- `src/main/resources/banner.txt` — 시작 시 표시 배너
- `src/main/resources/logback.xml` — 로깅 설정 (fpserver 전용)
- `application.yaml` / `application.properties` — 별도 저장소/외부 환경에서 주입 (모듈에 포함되지 않음)

## 6. 소스 구조

```
src/main/java/com/zionex/t3series/...
src/main/java/com/zionex/T3SeriesFP.java   ← Spring Boot 진입점
```

## 7. 타 모듈과의 차이 / 특이점

- **H2 포함**: 다른 서버(mpserver/dpserver)에는 없는 임베디드 DB 지원 (개발/테스트·임베디드 시나리오 대응 추정).
- **Gson 사용**: common 은 Jackson만, fpserver 는 Gson 도 함께 사용 — 기존 코드베이스 호환성 목적.
- **POI 3.15 + poi-ooxml**: wingui(4.1.2)와 달리 루트 BOM 버전을 그대로 사용.
- **MapStruct 주석처리** 특이사항 — 빌드 성공하더라도 신규 기능에서 MapStruct 매퍼 추가 시 런타임 문제 가능성 확인 필요.
- **JUnit BOM 5.9.0** 을 모듈 레벨에서 import — 타 서버 모듈과 달리 JUnit 5 전용 버전 고정.
