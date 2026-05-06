# t3series-mp

> MP 데스크톱/클라이언트용 **라이브러리 모듈** — MP 업무 도메인 + Swing UI 컴포넌트 제공.

## 1. 모듈 개요

| 항목 | 값 |
|------|-----|
| artifactId | `t3series-mp` |
| packaging | `jar` |
| Main Class | 없음 (라이브러리) |
| 내부 의존 | `t3series-common` |
| 역할 | MP 데스크톱 및 서버(`mpserver`)가 공통 참조하는 라이브러리. JIDE 기반 Swing UI 컴포넌트와 DB 처리 로직 포함. |

## 2. 기술 스택 요약

- **런타임**: Java 17
- **데스크톱 UI**: JIDE 3.4.3 (7종), JGraph 5.8.3.1, jcalendar 1.4, IDW 1.0, miglayout-swing 4.2
- **브라우저 임베딩**: DJNativeSwing 1.0.0 + DJNativeSwing-SWT 1.0.0 (네이티브 브라우저 컨트롤)
- **툴바 확장**: esptoolbar 1.0
- **차트**: Monarch mcharts 2.0 / mgraph 1.0
- **암호화**: BouncyCastle `bcprov-jdk15on`
- **유틸**: Apache Commons (collections4/dbutils/lang3), JDOM2, Jython, Lombok
- **DB 드라이버**: MSSQL, Oracle(ojdbc10), PostgreSQL, EDB
- **Bulk Insert**: `jsqlserverbulkinsert`
- **테스트**: JUnit 4.12

> Spring Boot Starter는 **전혀 포함하지 않는** 순수 라이브러리 모듈.

## 3. 의존성 전체 목록

### 프로젝트 내부
```
t3series:t3series-common:26.0.0-SNAPSHOT
```

### Swing / UI
```
com.jidesoft:jide-common
com.jidesoft:jide-components
com.jidesoft:jide-data
com.jidesoft:jide-editor
com.jidesoft:jide-grids
com.jidesoft:jide-pivot
com.jidesoft:jide-shortcut
jgraph:jgraph
com.toedter:jcalendar
net.infonode:idw
com.miglayout:miglayout-swing     (BOM 4.2)
com.hynnet:DJNativeSwing          (BOM 1.0.0)
com.hynnet:DJNativeSwing-SWT      (BOM 1.0.0)
com.esp:esptoolbar                (BOM 1.0)
lt.monarch:mcharts
lt.monarch:mgraph
```

### 보안/유틸
```
org.bouncycastle:bcprov-jdk15on
org.apache.commons:commons-collections4
commons-dbutils:commons-dbutils
org.apache.commons:commons-lang3
org.jdom:jdom2
org.python:jython
org.projectlombok:lombok
```

### 데이터베이스
```
com.microsoft.sqlserver:mssql-jdbc
com.oracle.database.jdbc:ojdbc10
org.postgresql:postgresql
com.enterprisedb:edb-jdbc
de.bytefish:jsqlserverbulkinsert
```

### 테스트
```
junit:junit
```

## 4. 빌드 설정 특이점

- `maven-source-plugin` 만 활성화 (Spring Boot 플러그인 없음 — 실행 불가한 라이브러리 JAR)
- `build-helper-maven-plugin` 없음

## 5. 설정 파일

- `src/main/resources/com/...` — Swing UI용 리소스(아이콘/이미지/메시지 등)
- `src/main/resources/logback.xml` — 라이브러리에서 사용하는 기본 로깅 설정

## 6. 소스 구조

```
src/main/java/com/zionex/
├── ApplicationConstants.java
├── ApplicationHelper.java
├── ApplicationInfo.java
├── client/
├── controller/
├── data/
├── extension/
├── license/
├── model/
├── processor/
├── resource/
├── server/
├── service/
├── swing/
└── util/
```

> `com.zionex` 바로 하위에 도메인 패키지 14개. 서버 모듈들의 `com.zionex.t3series.*` 체계와 다르게 **`com.zionex` 루트**에 배치됨 — `t3series-fp` 와 같은 계열.

## 7. 타 모듈과의 차이 / 특이점

- **Spring Boot Starter 없음** — 순수 라이브러리. `mpserver` 가 서버 스택을 제공하고, 이 모듈은 도메인 로직 + Swing UI만 담당.
- **DJNativeSwing (+SWT)** — 프로젝트 내 유일. 네이티브 브라우저(Chromium/IE) 를 Swing 내부에 삽입하여 하이브리드 UI를 구현.
- **esptoolbar** — 프로젝트 내 유일. 툴바 커스터마이징용 레거시 라이브러리.
- **miglayout-swing** — fp는 `swingmiglayout15` (레거시), mp는 공식 `miglayout-swing 4.2` 를 사용 — 두 라이브러리가 병존.
- **iText/PDF, mx4j, activemq 부재** — fp 와 달리 PDF 생성/JMX/JMS 기능은 포함하지 않음.
- **BouncyCastle 포함** — fp 와 동일하게 클라이언트 측 암호화 처리 지원.
