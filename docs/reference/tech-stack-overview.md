# T3 Series 기술스택 (Tech Stack)

> 프로젝트 전반과 모듈별 기술스택 정리. 각 모듈별 상세 문서로 링크됩니다.

## 목차

- [1. 프로젝트 개요](#1-프로젝트-개요)
- [2. 모듈 구성](#2-모듈-구성)
- [3. 공통 기술스택 (전체)](#3-공통-기술스택-전체)
- [4. 공통 BOM · dependencyManagement](#4-공통-bom--dependencymanagement)
- [5. 코드 품질 · 정적 분석](#5-코드-품질--정적-분석)
- [6. CI/CD · 인프라](#6-cicd--인프라)
- [7. 모듈 간 차이점 종합](#7-모듈-간-차이점-종합)
- [8. 모듈별 문서 링크](#8-모듈별-문서-링크)

---

## 1. 프로젝트 개요

| 항목 | 값 |
|------|-----|
| 조직 | Zionex Inc. |
| 최상위 artifactId | `t3series-parent` |
| 버전 | `26.0.0-SNAPSHOT` |
| 빌드 | Maven (Spring Boot parent `3.0.13`) |
| 구성 | Maven 멀티모듈(7개) + Python ML 서버(비Maven) + DB 스크립트(비Maven) |
| 배포 | GitHub Packages (`maven.pkg.github.com/zionex/t3series`) |
| 라이선스 | Private (Zionex) |

## 2. 모듈 구성

### 2.1 Maven 모듈 (`<modules>` 등록 — 7개)

| 모듈 | 패키징 | 역할 | Main Class |
|------|--------|------|-----------|
| [`t3series-common`](./t3series-common.md) | jar | 공통 라이브러리 | (없음) |
| [`t3series-dpserver`](./t3series-dpserver.md) | jar | DP 백엔드(최소 구성) | `com.zionex.t3series.dp.T3SeriesDP` |
| [`t3series-mp`](./t3series-mp.md) | jar | MP Swing 라이브러리 | (없음) |
| [`t3series-mpserver`](./t3series-mpserver.md) | jar | MP 백엔드 | `com.zionex.t3series.mp.T3SeriesMP` |
| [`t3series-fpserver`](./t3series-fpserver.md) | jar | FP 백엔드 | `com.zionex.t3series.fp.T3SeriesFP` |
| [`t3series-fp`](./t3series-fp.md) | jar | FP Swing 데스크톱 | `com.zionex.T3SeriesFPCS` |
| [`t3series-wingui`](./t3series-wingui.md) | **war** | 웹앱(Spring Boot + React) | WAR 배포 |

### 2.2 비 Maven 모듈

| 모듈 | 타입 | 문서 |
|------|------|------|
| `t3series-bfserver` | Python / Flask ML 서버 | [→ 상세](./t3series-bfserver.md) |
| `t3series-database` | SQL 스크립트 (MSSQL/Oracle) | [→ 상세](./t3series-database.md) |

### 2.3 모듈 의존 관계

```
t3series-common  (공통 라이브러리)
    │
    ├───► t3series-dpserver
    │
    ├───► t3series-mp  ───►  t3series-mpserver
    │
    ├───► t3series-fpserver ───►  t3series-fp (+ common 직접 의존)
    │
    └───► t3series-wingui
```

- `fp` 는 `fpserver` 와 `common` 을 모두 직접 의존 (임베디드 서버 구조)
- `mp` 는 라이브러리, `mpserver` 가 `mp` + `common` 을 의존
- `dpserver`, `wingui` 는 `common` 만 의존
- `t3series-bfserver`, `t3series-database` 는 독립 (Java 모듈과 의존 관계 없음)

## 3. 공통 기술스택 (전체)

### 3.1 런타임 · 빌드
- **Java**: 17 (source/target)
- **Spring Boot**: `3.0.13` (parent)
- **Maven**: Apache Maven (멀티모듈)
- **JVM argLine**: `--add-exports java.desktop/com.sun.java.swing.plaf.windows=ALL-UNNAMED` (Swing 모듈용)
- **`maven.test.skip`**: `true` (기본값)
- **빌드 타임스탬프 포맷**: `yyyy-MM-dd`

### 3.2 어노테이션 프로세서 (모든 모듈 공통)
- MapStruct `1.5.5.Final` (`-Amapstruct.defaultComponentModel=spring`)
- Lombok `1.18.32` + `lombok-mapstruct-binding 0.2.0`
- QueryDSL APT `5.0.0` (classifier `jakarta`)
- Jakarta Persistence API `3.1.0`

### 3.3 핵심 런타임 라이브러리 (BOM 관리 버전)
| 카테고리 | 라이브러리 | 버전 |
|---------|-----------|------|
| ORM | Hibernate | `5.6.4.Final` |
| ConnectionPool | HikariCP | `4.0.3` |
| JSON | Jackson Databind | `2.12.3` |
| JSON | Gson | `2.10.1` |
| YAML | SnakeYAML | `2.0` |
| 네트워킹 | Netty | `4.1.127.Final` |
| 로깅 | SLF4J API | `2.0.9` |
| 컬렉션 | Guava | `31.1-jre` |
| 암호화 | BouncyCastle `bcprov-jdk15on` | `1.70` |
| 암호화 | Jasypt | `1.9.3` |
| Excel | Apache POI | `3.15` (wingui만 `4.1.2`) |
| Swing | JIDE Suite | `3.4.3` |
| 스크립팅 | Jython | `2.7.3` |
| UUID | java-uuid-generator | `5.2.0` |

### 3.4 DB 드라이버 (BOM 관리 버전)
| DBMS | artifactId | 버전 |
|------|-----------|------|
| MS SQL Server | `mssql-jdbc` | `9.2.0.jre8` |
| Oracle (11g) | `ojdbc6` | `11.2.0.4.0` |
| Oracle (8+) | `ojdbc8` | `19.23.0.0.0` |
| Oracle (10+) | `ojdbc10` | `19.23.0.0.0` ← 실제 사용 |
| PostgreSQL | `postgresql` | `42.7.9` |
| EDB | `edb-jdbc` | `42.7.3.2` |
| SQLite | `sqlite-jdbc` | `3.36.0.2` |
| H2 | (Spring Boot BOM 관리) | — |
| HSQLDB | `hsqldb` | `1.8.0.10` |
| HXTT Excel | `excel-hxtt` | `4.1` |

## 4. 공통 BOM · dependencyManagement

루트 `pom.xml` 의 `<dependencyManagement>` 에서 **약 75개** 의 의존성 버전을 고정. 주요 그룹:

- Spring Boot / Spring Cloud (Boot parent 상속)
- Apache Commons (`lang3`, `collections4`, `configuration2`, `dbcp2`, `dbutils`, `exec`, `io`)
- 메시징: ActiveMQ 5.16.4 (+ `activeio-core 3.1.4`)
- 데스크톱: JIDE 7종, JGraph 5.8.3.1, jcalendar 1.4, iText 2.1.7, Monarch mcharts/mgraph, miglayout, DJNativeSwing, esptoolbar, mx4j-tools, colorchooser
- 문서: POI 3.15, xmlbeans 2.6.0, JDOM2 2.0.6.1, json-simple 1.1.1
- 스크립팅/유틸: Jython 2.7.3, jsqlserverbulkinsert 4.0.1, sqlbuilder 2.1.6
- 테스트: JUnit 4.12, JUnit Jupiter 5.9.0
- DB 드라이버: 위 3.4 절 참조

## 5. 코드 품질 · 정적 분석

루트 `pom.xml` 의 `pluginManagement` + `reporting` 섹션에 설정.

| 도구 | 버전 | 설정 파일 | 실패 시 중단 |
|------|------|----------|-------------|
| **SpotBugs** | `4.7.3.0` | `spotbugs-security-include.xml` / `-exclude.xml` | ✅ `failOnError` |
| Find-Sec-Bugs 플러그인 | `1.12.0` | (SpotBugs plugin) | — |
| **PMD** | `3.19.0` | `pmd-rulesets-default.xml` | ✅ `failOnViolation` |
| **Checkstyle** | `3.2.0` (Checkstyle `10.4`) | `checkstyle-google.xml` | ✅ `failsOnError` |
| **DeepSource** | — | `.deepsource.toml` | CI 레벨 |

DeepSource 활성 애널라이저: Java, Python 3.x, JavaScript(+ React plugin).

## 6. CI/CD · 인프라

### GitHub Actions 워크플로우 (`.github/workflows/`)
| 파일 | 역할 |
|------|------|
| `build-and-deploy.yaml` | 빌드 및 배포 |
| `release.yaml` | 정식 릴리스 |
| `release-nightly.yaml` | 야간 빌드 |
| `patch.yaml` | 패치 릴리스 |
| `help.yaml` | 도움말/문서 워크플로우 |

### 로컬 실행 설정
- `.vscode/launch.json` — VS Code Spring Boot debug 설정 (`t3series-wingui`)
- `.env` 파일 루트에서 환경변수 주입

### 번들 Kafka
- 루트 `kafka/` 디렉터리에 **Kafka 바이너리 전체** 포함 (`bin/`, `config/`, `libs/`, `site-docs/`)
- Docker 기반이 아니라 **Standalone 배포 방식**

### 문서
- 루트 `docs/` — GitBook 형식 추정. 하위: `case-study`, `css`, `developer-guide`, `education`, `feature`, `getting-started`, `manual`, `reference`, `troubleshooting`, `tutorial`
- 버전별 릴리스 노트: v22.0.0 ~ v22.3.0

---

## 7. 모듈 간 차이점 종합

### 7.1 Spring Boot Starter 매트릭스

| Starter | common | fpserver | fp | mpserver | mp | dpserver | wingui |
|---------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| web | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ |
| webflux | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ |
| data-jpa | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ |
| jdbc | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |
| quartz | ✓ | ✓ | ✗ | ✓ | ✗ | ✓ | ✓ |
| test | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| devtools | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ |
| **batch** | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | **✓** |
| **security** | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | **✓** |
| **thymeleaf** | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | **✓** |
| **websocket** | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | **✓** |
| **mail** | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | **✓** |
| tomcat (provided) | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |
| configuration-processor | ✓ | ✗ | ✗ | ✓ | ✗ | ✓ | ✓ |

> `wingui` 가 Batch/Security/Thymeleaf/WebSocket/Mail 을 독점. `mp` 는 Spring Boot Starter 자체가 없는 순수 Swing 라이브러리.

### 7.2 데이터베이스 드라이버 매트릭스

| 모듈 | MSSQL | Oracle | PostgreSQL | EDB | SQLite | H2 | HXTT Excel |
|------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| common   | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ |
| fpserver | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ |
| fp       | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ |
| mpserver | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| mp       | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| **dpserver** | ✓ | ✓ | **✗** | **✗** | ✗ | ✗ | ✗ |
| wingui   | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ |

> **`dpserver`** 는 **MSSQL + Oracle 만** 지원 (특수 배포 환경 한정). **`wingui`** 는 EDB 드라이버 미포함.

### 7.3 메시징 · 실시간 통신

| 모듈 | 메시징 스택 |
|------|------------|
| `wingui` (유일) | **Spring Kafka** + WebSocket + STOMP (Spring Messaging) |
| `fp` (유일)     | **ActiveMQ 5.16.4** (broker + client + kahadb-store + activeio-core) |
| 기타            | 메시징 의존성 없음 |

프론트엔드(`wingui/packages/wingui`): Socket.io-client, SockJS, react-stomp.

### 7.4 보안 / 인증

| 모듈 | 스택 |
|------|------|
| `wingui` (유일) | **Spring Security + JWT (jjwt 0.12.6)** + Jasypt + BouncyCastle |
| 기타            | Jasypt / BouncyCastle (암호화 라이브러리만 — 웹 보안 스택 없음) |
| `common`        | `jasypt-spring-boot-starter 3.0.4` (공통 복호화 엔트리포인트) |

### 7.5 UI / 프레젠테이션 레이어

| 모듈 | UI 스택 |
|------|--------|
| `fp`, `mp` | **Swing**: JIDE 3.4.3 (7종), JGraph 5.8.3.1, jcalendar, IDW 1.0, miglayout |
| `fp` 전용 | iText 2.1.7(PDF), mcharts/mgraph, mx4j, colorchooser |
| `mp` 전용 | **DJNativeSwing + SWT**(브라우저 임베딩), esptoolbar, JDOM2 |
| `wingui`  | **React 18.3.1** + Kendo React 5.8.0 + MUI 5.11.0 + Webpack 5 모노레포 |
| 기타 서버 | UI 없음 (REST 전용) |

### 7.6 ORM / Query 조립

| 기술 | 사용 모듈 |
|------|----------|
| Spring Data JPA + Hibernate | common, fpserver, fp, mpserver, dpserver, wingui |
| QueryDSL (Jakarta) 5.0.0    | common, fpserver, wingui |
| MapStruct (직접 의존)        | common, fp |
| MapStruct (루트 APT만)       | fpserver (주석처리), mpserver, dpserver, wingui |
| `sqlbuilder 2.1.6`          | dpserver (유일) |
| `commons-dbutils`           | common, fp, mp, dpserver, wingui |
| `commons-dbcp2`             | common, dpserver (보조 풀) |

### 7.7 POI / XMLBeans 버전 Override

- 루트 BOM: `poi 3.15`, `xmlbeans 2.6.0`
- **`wingui` 만** `poi 4.1.2` + `xmlbeans 3.1.0` 으로 **override**

### 7.8 배포 단위

| 모듈 | 산출물 |
|------|--------|
| common, fp, fpserver, mpserver, mp, dpserver | `jar` |
| wingui | **war** |
| bfserver | Python 패키지 (`zionex-bf 1.0`) + wheel |
| database | SQL 파일 집합 |

### 7.9 Profile 전략

| 모듈 | Maven Profile | 설정 Profile |
|------|--------------|-------------|
| wingui | `local` (default), `dev`, `prod` → 리소스 폴더 전환 | Spring `mssql` (default) / `postgresql` |
| 기타 서버 | 없음 (외부에서 application 주입) | 각 배포 시 지정 |

### 7.10 코드 스타일 특이점

- **패키지 네이밍**:
  - 서버 모듈(`fpserver`, `mpserver`, `dpserver`): `com.zionex.t3series.*`
  - 데스크톱(`fp`, `mp`): `com.zionex.*` (상위 레벨)
  - common: `com.zionex.t3series.*` 기반 공통 유틸

- **로깅 설정(logback.xml) 존재 여부**:
  - 보유: fpserver, fp, mp, dpserver
  - 미보유: common, mpserver, wingui (외부 의존)

### 7.11 기타 특이 의존성

| 의존성 | 사용 모듈 | 특이점 |
|--------|----------|--------|
| `avalon-framework 4.1.3` | common | POI 3.15 전이 의존 보완용 |
| `spring-retry` | common | 재시도 공통 지원 |
| `jasypt-spring-boot-starter 3.0.4` | common | 공통 property 복호화 |
| `httpclient5 5.2.1` | wingui | 프로젝트 유일 HTTP5 클라이언트 |
| `jsoup 1.16.1` | wingui | HTML 파싱 |
| `jsqlparser 3.2` | wingui | SQL 구문 파싱 |
| `aspectjweaver` | wingui | AOP 위빙 |
| `tomcat-embed-jasper` (provided) | wingui | JSP 렌더링 |
| `json-simple 1.1.1` | wingui | 레거시 JSON 처리 |
| `jjwt 0.12.6` (api/impl/jackson) | wingui | JWT |

---

## 8. 모듈별 문서 링크

### Java / Maven 모듈
- [t3series-common](./t3series-common.md)
- [t3series-fpserver](./t3series-fpserver.md)
- [t3series-fp](./t3series-fp.md)
- [t3series-mpserver](./t3series-mpserver.md)
- [t3series-mp](./t3series-mp.md)
- [t3series-dpserver](./t3series-dpserver.md)
- [t3series-wingui](./t3series-wingui.md)

### 비 Maven 모듈
- [t3series-bfserver](./t3series-bfserver.md) — Python ML 서버
- [t3series-database](./t3series-database.md) — MSSQL/Oracle 스크립트

---

## 부록: 주요 버전 레퍼런스 카드

```
Java              17
Spring Boot       3.0.13
Hibernate         5.6.4.Final
HikariCP          4.0.3
QueryDSL          5.0.0  (jakarta)
MapStruct         1.5.5.Final
Lombok            1.18.32
Jackson           2.12.3
BouncyCastle      1.70
Jasypt            1.9.3
JIDE              3.4.3
POI (기본)        3.15     (wingui만 4.1.2)
Kafka (wingui)   Spring Kafka (Spring Boot 3.0.13 전이)
JWT (wingui)     jjwt      0.12.6
React (wingui)    18.3.1
Webpack          5.x (16GB heap)
Kendo React      5.8.0
MUI              5.11.0
Python (bf)       3.9
Flask (bf)        3.0.0
LightGBM (bf)     3.3.5
```
