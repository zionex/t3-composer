# t3series-common

> 모든 서버/클라이언트 모듈이 의존하는 공통 라이브러리.

## 1. 모듈 개요

| 항목 | 값 |
|------|-----|
| artifactId | `t3series-common` |
| groupId | `t3series` |
| version | `26.0.0-SNAPSHOT` |
| packaging | `jar` |
| Main Class | 없음 (라이브러리) |
| 부모 | `t3series-parent 26.0.0-SNAPSHOT` (Spring Boot `3.0.13`) |
| 역할 | 전 모듈 공통 유틸, 데이터 액세스 기반, 인증/암호화, REST/WebFlux/Quartz 공통 설정 |

## 2. 기술 스택 요약

- **런타임**: Java 17 · Spring Boot 3.0.13
- **웹**: Spring MVC (`starter-web`) + Reactive (`starter-webflux`)
- **영속성**: Spring Data JPA (Hibernate 5.6.4.Final, HikariCP 4.0.3), JDBC, QueryDSL 5.0.0 (Jakarta)
- **스케줄링**: Spring Boot Quartz Starter
- **직렬화/매핑**: Jackson Databind 2.12.3, MapStruct 1.5.5.Final, Lombok 1.18.32
- **암호화/보안**: Jasypt 1.9.3 + `jasypt-spring-boot-starter 3.0.4`, BouncyCastle `bcprov-jdk15on 1.70`
- **유틸**: Apache Commons (lang3, collections4를 제외한 commons-dbcp2/dbutils/exec/configuration2), Guava 31.1-jre, Jython 2.7.3, JDOM2 2.0.6.1, JXL 2.6.12, POI 3.15
- **DB 드라이버**: MSSQL, Oracle(ojdbc10), PostgreSQL, EDB, HXTT Excel
- **테스트**: `spring-boot-starter-test`, JUnit 4.12

## 3. 의존성 전체 목록 (pom.xml 기준)

### Spring Boot Starters
```
org.springframework.boot:spring-boot-starter-web
org.springframework.boot:spring-boot-starter-webflux
org.springframework.boot:spring-boot-starter-data-jpa
org.springframework.boot:spring-boot-starter-quartz
org.springframework.boot:spring-boot-starter-jdbc
org.springframework.boot:spring-boot-starter-test
```

### Spring Framework 부가
```
org.springframework.boot:spring-boot-configuration-processor (optional)
org.springframework.retry:spring-retry
com.github.ulisesbocchio:jasypt-spring-boot-starter:3.0.4
```

### 데이터베이스 드라이버
```
com.microsoft.sqlserver:mssql-jdbc             (BOM 9.2.0.jre8)
com.oracle.database.jdbc:ojdbc10               (BOM 19.23.0.0.0)
org.postgresql:postgresql                      (BOM 42.7.9)
com.enterprisedb:edb-jdbc                      (BOM 42.7.3.2)
com.hxtt:excel-hxtt                            (BOM 4.1)
com.hxtt:excel-hxtt-hibernate                  (BOM 1.0)
```
> 주의: SQLite는 dependencyManagement에만 있고 common 에서는 선언하지 않음.

### ORM / Query
```
com.querydsl:querydsl-apt:5.0.0   (classifier: jakarta, provided)
com.querydsl:querydsl-jpa:5.0.0   (classifier: jakarta)
```

### 데이터/매핑/유틸
```
org.jasypt:jasypt                        (BOM 1.9.3)
org.bouncycastle:bcprov-jdk15on          (BOM 1.70)
com.fasterxml.jackson.core:jackson-databind (BOM 2.12.3)
com.fasterxml.uuid:java-uuid-generator   (BOM 5.2.0)
com.google.guava:guava                   (BOM 31.1-jre)
com.zaxxer:HikariCP                      (BOM 4.0.3)
org.projectlombok:lombok                 (BOM 1.18.32)
org.mapstruct:mapstruct:1.5.5.Final
org.slf4j:slf4j-api                      (BOM 2.0.9)
```

### Apache Commons
```
org.apache.commons:commons-configuration2   (BOM 2.8.0)
org.apache.commons:commons-dbcp2            (BOM 2.1)
commons-dbutils:commons-dbutils             (BOM 1.6)
org.apache.commons:commons-exec             (BOM 1.3)
org.apache.commons:commons-lang3            (BOM 3.12.0)
```

### 엑셀/문서/스크립팅
```
org.apache.poi:poi              (BOM 3.15)
org.jdom:jdom2                  (BOM 2.0.6.1)
net.sourceforge.jexcelapi:jxl   (BOM 2.6.12)
org.python:jython               (BOM 2.7.3)
```

### 기타
```
avalon-framework:avalon-framework:4.1.3    (compile scope 명시)
de.bytefish:jsqlserverbulkinsert           (BOM 4.0.1)
junit:junit                                (BOM 4.12)
```

## 4. 빌드 설정 특이점

- `build-helper-maven-plugin 3.2.0` — `target/generated-sources/annotations` 를 소스 디렉터리로 추가 (QueryDSL Q타입, MapStruct 구현체 처리용)
- 루트에서 상속: MapStruct/Lombok/lombok-mapstruct-binding/QueryDSL APT/Jakarta Persistence 어노테이션 프로세서 자동 연결
- `project-parent-dir = ${project.basedir}/..` — 정적 분석 설정 파일 경로 기준

## 5. 설정 파일

- `src/main/resources/` — 비어 있음 (라이브러리 모듈 특성상 `application.yaml` 없음)
- 로깅 설정은 이 모듈에서 제공하지 않고 각 서버 모듈에 맡김

## 6. 소스 구조

```
src/main/java/com/zionex/t3series/...
```

라이브러리 성격상 공통 패키지 체계로 구성되며, 각 서버 모듈(fpserver/mpserver/dpserver/wingui)이 이 패키지 하위의 util, persistence, security 클래스를 재사용.

## 7. 타 모듈과의 차이 / 특이점

- **유일하게 `jasypt-spring-boot-starter`를 직접 선언** — Property 복호화 설정의 진입점.
- **유일하게 `spring-retry` 선언** — 재시도 정책 공통 지원.
- **`commons-configuration2` 사용** — fp/wingui 외 서버에서는 미사용.
- **`commons-exec`, `jython`, `jdom2`, `jxl` 동시 보유** — 스크립팅/외부 프로세스/레거시 Excel/XML 파싱을 위한 전방위 유틸 모듈.
- `avalon-framework 4.1.3` 이 **compile** 스코프로 명시 — POI 3.15의 일부 의존성 충족용으로 추정.
