# t3series-fp

> FP 데스크톱 클라이언트 — Swing 기반 리치 클라이언트(FPCS: Factory Planning Client System).

## 1. 모듈 개요

| 항목 | 값 |
|------|-----|
| artifactId | `t3series-fp` |
| packaging | `jar` |
| Main Class | `com.zionex.T3SeriesFPCS` |
| 내부 의존 | `t3series-common`, `t3series-fpserver` |
| 역할 | FP 서버를 백엔드로 활용하는 Swing 데스크톱 애플리케이션 (JIDE 기반 리치 UI, ActiveMQ 로컬 브로커 내장) |

## 2. 기술 스택 요약

- **런타임**: Java 17 · Spring Boot 3.0.13 (Boot 컨테이너 내부에서 Swing UI 구동)
- **데스크톱 UI**: JIDE Software 3.4.3 (7종), JGraph 5.8.3.1, jcalendar 1.4, IDW 1.0 (docking), iText 2.1.7 (PDF), Monarch mcharts/mgraph, jxl, swingmiglayout15
- **메시징**: ActiveMQ 5.16.4 (broker/client/kahadb-store) + activeio-core 3.1.4 — **내장 메시지 브로커**
- **영속성**: Spring Data JPA (common 을 통해 간접 사용)
- **DB 드라이버**: MSSQL, Oracle(ojdbc10), PostgreSQL, EDB, SQLite, HXTT Excel
- **암호화**: BouncyCastle, Jasypt
- **매핑/코드생성**: MapStruct, Lombok
- **테스트**: JUnit Jupiter Params

## 3. 의존성 전체 목록

### 프로젝트 내부
```
t3series:t3series-common:26.0.0-SNAPSHOT
t3series:t3series-fpserver:26.0.0-SNAPSHOT
```

### Spring Boot Starters
```
org.springframework.boot:spring-boot-starter-web
org.springframework.boot:spring-boot-starter-data-jpa
org.springframework.boot:spring-boot-starter-test
org.springframework.boot:spring-boot-devtools (runtime)
```

### 메시징 (JMS/Broker)
```
org.apache.activemq:activeio-core     (BOM 3.1.4)
org.apache.activemq:activemq-broker   (BOM 5.16.4)
org.apache.activemq:activemq-client   (BOM 5.16.4)
org.apache.activemq:activemq-kahadb-store (BOM 5.16.4)
```

### Swing / 데스크톱 UI
```
com.jidesoft:jide-common      (BOM 3.4.3)
com.jidesoft:jide-components  (BOM 3.4.3)
com.jidesoft:jide-data        (BOM 3.4.3)
com.jidesoft:jide-editor      (BOM 3.4.3)
com.jidesoft:jide-grids       (BOM 3.4.3)
com.jidesoft:jide-pivot       (BOM 3.4.3)
com.jidesoft:jide-shortcut    (BOM 3.4.3)
jgraph:jgraph                 (BOM 5.8.3.1)
com.toedter:jcalendar         (BOM 1.4)
net.infonode:idw              (BOM 1.0)
com.lowagie:itext             (BOM 2.1.7)
lt.monarch:mcharts            (BOM 2.0)
lt.monarch:mgraph             (BOM 1.0)
net.java.dev:colorchooser     (BOM 1.0)
miginfocom:swingmiglayout15   (BOM 1.0)
mx4j:mx4j-tools               (BOM 3.0.1)
```

### 암호화/보안/유틸
```
org.bouncycastle:bcprov-jdk15on
org.jasypt:jasypt
org.apache.commons:commons-collections4
org.apache.commons:commons-configuration2
commons-dbutils:commons-dbutils
org.apache.commons:commons-lang3
org.projectlombok:lombok
org.mapstruct:mapstruct
org.python:jython
net.sourceforge.jexcelapi:jxl
```

### 문서
```
org.apache.poi:poi            (BOM 3.15)
org.apache.poi:poi-ooxml      (BOM 3.15)
```

### 데이터베이스 드라이버
```
com.hxtt:excel-hxtt
com.hxtt:excel-hxtt-hibernate
com.microsoft.sqlserver:mssql-jdbc
com.oracle.database.jdbc:ojdbc10
org.postgresql:postgresql
com.enterprisedb:edb-jdbc
org.xerial:sqlite-jdbc         (BOM 3.36.0.2)
```

### 테스트
```
org.junit.jupiter:junit-jupiter-params
```

## 4. 빌드 설정 특이점

- `spring-boot-maven-plugin` mainClass = `com.zionex.T3SeriesFPCS` (서버 모듈들과 달리 `com.zionex` 최상위 패키지)
- Swing 구동을 위해 루트 `argLine` 필수: `--add-exports java.desktop/com.sun.java.swing.plaf.windows=ALL-UNNAMED`
- `maven-source-plugin` 활성화

## 5. 설정 파일

- `src/main/resources/banner.txt`
- `src/main/resources/logback.xml`
- `src/main/resources/com/...` — JIDE/Swing 리소스(이미지, 국제화 메시지 등)

## 6. 소스 구조

```
src/main/java/com/zionex/
├── T3SeriesFPCS.java          ← 진입점
├── T3SeriesFPCSInfo.java      ← 버전 정보 홀더
├── fpjms/                     ← ActiveMQ JMS 연동
└── fpmui/                     ← Multi-Instance/Multi-UI 구성
```

## 7. 타 모듈과의 차이 / 특이점

- **ActiveMQ 내장** — 프로젝트 내 유일하게 메시지 브로커 + 클라이언트를 모두 포함 (로컬 메시지 큐잉/이벤트 버스 용도).
- **mx4j-tools** — JMX 기반 모니터링 지원(레거시).
- **`com.zionex` 루트 패키지** — 서버 모듈들은 `com.zionex.t3series.*` 인 반면 FP 클라이언트는 상위 패키지에 진입점을 둠.
- **SQLite 포함** — 로컬 캐시/오프라인 데이터 저장용.
- **데스크톱 UI 풀세트** — mp 모듈이 라이브러리로 제공하는 UI 스택과 유사하나 FP 전용으로 mcharts/mgraph + iText(PDF) + mx4j 조합.
- `fpserver` 를 직접 의존 — 서버 로직을 임베디드로 재사용하는 하이브리드 구조.
