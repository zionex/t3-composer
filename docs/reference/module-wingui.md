# t3series-wingui

> T3 Series의 **웹 애플리케이션 플랫폼** — Spring Boot 백엔드 + React 18 SPA 프론트엔드. 배포 단위는 **WAR**.

## 1. 모듈 개요

| 항목 | 값 |
|------|-----|
| artifactId | `t3series-wingui` |
| packaging | **war** (서버 모듈 중 유일) |
| 내부 의존 | `t3series-common` |
| 역할 | 사용자 접근 웹 애플리케이션. REST/WebSocket/Kafka 포함 종합 백엔드 + React 기반 SPA 프론트엔드 |
| 환경 프로파일 | `local` (기본), `dev`, `prod` |

## 2. 백엔드 기술 스택 요약

- **런타임**: Java 17 · Spring Boot 3.0.13
- **서블릿 컨테이너**: Tomcat (provided — WAR 외부 배포)
- **웹**: Spring MVC + WebFlux + WebSocket + Messaging
- **뷰**: Thymeleaf + Tomcat Embed Jasper(JSP, provided)
- **보안**: Spring Security + JWT(`jjwt 0.12.6`) — 프로젝트 내 유일
- **배치**: Spring Boot Batch — 프로젝트 내 유일
- **메시징**: Spring Kafka — 프로젝트 내 유일
- **메일**: Spring Mail (SMTP)
- **영속성**: Spring Data JPA + QueryDSL (Jakarta) + HikariCP
- **스케줄링**: Spring Boot Quartz (JDBC 스토어)
- **AOP**: spring-aop + aspectjweaver
- **HTTP 클라이언트**: `httpclient5 5.2.1` + `httpcore 4.4.16`
- **문서/파싱**: POI 4.1.2 + poi-ooxml 4.1.2 + XMLBeans 3.1.0 (루트 BOM override), jsoup 1.16.1, jsqlparser 3.2, jdom2, json-simple
- **DB 드라이버**: MSSQL, Oracle(ojdbc10), PostgreSQL, H2
- **암호화**: Jasypt + BouncyCastle

## 3. 백엔드 의존성 전체 목록

### 프로젝트 내부
```
t3series:t3series-common:26.0.0-SNAPSHOT
```

### Spring Boot Starters
```
spring-boot-starter-batch
spring-boot-starter-data-jpa
spring-boot-starter-jdbc
spring-boot-starter-security
spring-boot-starter-thymeleaf
spring-boot-starter-tomcat            (provided)
spring-boot-starter-web
spring-boot-starter-quartz
spring-boot-starter-webflux
spring-boot-starter-websocket
spring-boot-starter-mail
```

### Spring Framework 부가
```
org.springframework:spring-aop                  (compile)
org.springframework.boot:spring-boot-configuration-processor (optional)
org.springframework.boot:spring-boot-devtools   (runtime)
org.springframework:spring-websocket
org.springframework:spring-messaging
org.springframework.kafka:spring-kafka
```

### JWT / 인증
```
io.jsonwebtoken:jjwt-api:0.12.6
io.jsonwebtoken:jjwt-impl:0.12.6
io.jsonwebtoken:jjwt-jackson:0.12.6
```

### HTTP 클라이언트
```
org.apache.httpcomponents.client5:httpclient5:5.2.1
org.apache.httpcomponents:httpcore:4.4.16
```

### 문서/파서
```
org.apache.poi:poi:4.1.2            ← 루트 BOM override
org.apache.poi:poi-ooxml:4.1.2      ← 루트 BOM override
org.apache.xmlbeans:xmlbeans:3.1.0  ← 루트 BOM override (원래 2.6.0)
org.jsoup:jsoup:1.16.1
com.github.jsqlparser:jsqlparser:3.2
org.jdom:jdom2
com.googlecode.json-simple:json-simple
```

### ORM / Query
```
com.querydsl:querydsl-apt:5.0.0  (jakarta, provided)
com.querydsl:querydsl-jpa:5.0.0  (jakarta)
```

### JSP / 서블릿
```
org.apache.tomcat.embed:tomcat-embed-jasper  (provided)
```

### AOP
```
org.aspectj:aspectjweaver  (compile)
```

### 유틸
```
org.bouncycastle:bcprov-jdk15on
org.jasypt:jasypt
org.apache.commons:commons-collections4
commons-dbutils:commons-dbutils
org.apache.commons:commons-exec
commons-io:commons-io
org.apache.commons:commons-lang3
org.projectlombok:lombok            (optional)
```

### 데이터베이스 드라이버
```
com.microsoft.sqlserver:mssql-jdbc
com.oracle.database.jdbc:ojdbc10
org.postgresql:postgresql
com.h2database:h2
```
> EDB, SQLite, HXTT Excel 드라이버는 **미포함**.

## 4. 빌드 설정 특이점

### 프로파일 (Maven)
```xml
<profile id="local"  activeByDefault="true">  env = local     </profile>
<profile id="dev">                              env = develop   </profile>
<profile id="prod">                             env = production</profile>
```

### 리소스 필터링
- `src/main/resources` — 루트 리소스(단, `profile/**` 제외)
- `src/main/resources/profile/${env}` — 활성 프로파일 폴더만 포함 (`static/license/license.*` 제외)
- `maven-resources-plugin 3.3.0` — 빌드 시 `profile/${env}/static/license/license.*` 를 `${finalName}/license` 로 별도 복사

### 플러그인
- `maven-war-plugin 3.3.2`
- `build-helper-maven-plugin 3.2.0` — `target/generated-sources/java` 추가
- `maven-resources-plugin 3.3.0` — 라이선스 복사 전용 execution

## 5. 설정 파일

### `src/main/resources/profile/local/application.yaml` 핵심 값

| 영역 | 설정 |
|------|------|
| 활성 DB 프로파일 | `mssql` (기본) |
| 대체 DB 프로파일 | `postgresql` |
| MSSQL URL | `jdbc:sqlserver://192.168.3.28:1433;database=T3SMARTSCM` |
| PostgreSQL URL | `jdbc:postgresql://192.168.3.22:5432/T3SMARTSCM` |
| Hibernate Dialect (MSSQL) | `org.hibernate.dialect.SQLServer2012Dialect` |
| Hibernate Dialect (PG) | `org.hibernate.dialect.PostgreSQLDialect` |
| HikariCP 풀 최대 | 150 |
| Quartz | JDBC 스토어, `auto-startup: false`, timezone `Asia/Seoul` |
| 서버 포트 | `8080` |
| 세션 쿠키 | `T3SESSIONID` |
| 업로드 최대 | `1024MB` |
| Jasypt | `enabled: false` |
| 언어 | `en, ja, ko, zh` |
| 로그인 URL | `login` · 기본 홈 `home` |
| 시스템 관리자 | `syszio25` |
| 초기 비밀번호 | `T3SmartSCM!` |
| 파일 외부 경로 | `C:/Wingui/` |
| 메일 SMTP | `smtp.gmail.com:587` (`release@zionex.com`) |
| Insight 연동 | `http://localhost:9160` (Socket.io `/ws/socket.io`) |
| 세션 유효 | 43,200초 (12h) / idle 3,600초 |
| 비밀번호 정책 | min 8 · 영문대소/숫자/특수 각 1 · 연속 3자 금지 |

### 기타 리소스
- `banner.txt` — 시작 배너
- `tables/` — 테이블 메타데이터 (추정)
- `templates/` — Thymeleaf 템플릿
- `profile/{local,dev,prod}/` — 프로파일별 설정 및 정적 자원

## 6. 소스 구조

```
t3series-wingui/
├── src/main/java/com/zionex/t3series/...   ← 백엔드 코드
├── src/main/resources/
│   ├── banner.txt
│   ├── profile/{local,dev,prod}/
│   ├── tables/
│   └── templates/
├── packages/                                ← 프론트엔드 모노레포
│   ├── package.json                         ← npm workspaces 루트
│   ├── package-lock.json
│   ├── wingui/                              ← @zionex/wingui (메인 SPA)
│   └── wingui-core/                         ← @zionex/wingui-core (공용 라이브러리)
└── pom.xml
```

---

## 7. 프론트엔드 기술 스택 (packages/)

### 구조
- **모노레포**: npm workspaces (`packages/package.json` 에서 `wingui`, `wingui-core` 워크스페이스 선언)
- **패키지 매니저**: npm (`package-lock.json`)

### 루트 `packages/package.json` — 빌드 스크립트
```json
"build":      "cd ./wingui && npm run build"
"build:prod": "cd ./wingui && npm run build:prod"
"build:demo": "cd ./wingui && npm run build:demo"
"build:ag":   "cd ./wingui && npm run build:ag"
"start":      "cd ./wingui && npm run start"
```

### `@zionex/wingui` (메인 SPA, `packages/wingui/`)
- **버전**: `26.0.0`
- **Node 옵션**: `--max-old-space-size=16384` (16GB 힙)
- **빌드**: 개발(`webpack.dev.config.js`, watch), 프로덕션(`webpack.config.js`), 데모(`webpack.demo.config.js`), AG 전용(`webpack.ag.config.js`)

#### 핵심 프레임워크
```
react                 18.3.1
react-dom             18.3.1
react-router-dom      ^5.2.0          (구버전 major)
zustand               4.4.7           (상태 관리)
```

#### UI 컴포넌트 (Kendo React 5.8.0 · MUI 5.11 혼용)
```
@progress/kendo-react-*        5.8.0 (buttons, dateinputs, dialogs, dropdowns, form,
                                      inputs, intl, labels, layout, popup, progressbars,
                                      scheduler, treeview)
@progress/kendo-theme-default  5.8.0
@progress/kendo-drawing        ^1.9.3
@progress/kendo-licensing      ^1.2.2
@mui/material                  ^5.11.0
@mui/icons-material            5.11.0
@mui/lab                       ^5.0.0-alpha.173
@mui/styles                    ^5.11.0
@mui/x-date-pickers            6.19.0
@emotion/react                 11.9.0
@emotion/styled                11.8.1
styled-components              6.1.11
realgrid                       2.8.8
```

#### 데이터 시각화 / 차트
```
chart.js                             3.9.1
react-chartjs-2                      4.3.1
chartjs-plugin-{annotation,datalabels,dragdata}
@sgratzl/chartjs-chart-boxplot       3.9.1
d3                                   7.9.0
d3-tip                               0.9.1
react-google-charts                  4.0.1
datatables.net-bs4                   1.13.11
datatables.net-buttons-bs4           1.6.5
datatables.net-responsive-bs4        2.2.6
jsvectormap                          1.1.4
```

#### 플로우 / 다이어그램 / 그리드
```
reactflow                       11.7.4
@xyflow/react                   ^12.4.3
@reactflow/controls             11.1.15
@reactflow/minimap              11.5.4
@reactflow/node-resizer         2.1.1
@reactflow/node-toolbar         1.2.3
dagre                           0.8.5
react-grid-layout               1.3.4
react-resizable                 3.0.4
react-split                     2.0.14
```

#### 드래그 앤 드롭
```
@dnd-kit/{accessibility,core,modifiers,sortable,utilities}
@hello-pangea/dnd               16.6.0
react-dnd                       ^16.0.1
react-dnd-html5-backend         ^16.0.1
dragula                         3.7.3
sortablejs                      1.15.0
react-sortablejs                6.1.4
```

#### 에디터 / 마크다운
```
@monaco-editor/react            ^4.6.0
@toast-ui/react-editor          ^3.2.3
@toast-ui/editor-plugin-color-syntax  3.1.0
tui-editor-plugin-font-size     ^1.0.4
react-markdown                  ^9.1.0
@uiw/react-markdown-preview     5.0.7
remark-gfm                      ^4.0.1
rehype-highlight                ^7.0.1
rehype-raw                      6.1.1
react-syntax-highlighter        ^15.6.1
lowlight                        3.1.0
```

#### 폼 / JSON Schema
```
react-hook-form                 7.27.1
@rjsf/core                      ^5.22.2
@rjsf/mui                       ^5.22.2
@rjsf/utils                     ^5.22.4
@rjsf/validator-ajv8            ^5.22.2
react-input-mask                2.0.4
inputmask                       5.0.5
flatpickr                       4.6.6
react-flatpickr                 3.10.9
react-datepicker                4.16.0
fullcalendar                    5.3.2
react-big-calendar              1.6.3
```

#### 날짜 / i18n
```
date-fns                        2.28.0
dayjs                           1.11.10
moment-timezone                 ^0.5.45
timezone-js                     ^0.4.13
tzdata                          ^1.0.40
@date-io/date-fns               1.3.13
i18next                         22.4.15
react-i18next                   11.18.6
cldr-core / cldr-dates-full / cldr-numbers-full   41.0.0
```

#### 지도
```
@react-google-maps/api          2.18.1
@googlemaps/react-wrapper       1.1.35
@googlemaps/markerclustererplus 1.2.10
```

#### 네트워크 / 실시간
```
axios                           1.7.7
socket.io-client                ^4.8.1
sockjs                          0.3.24
react-stomp                     5.1.0
event-source-polyfill           1.0.31
url-polyfill                    1.1.8
```

#### 문서 처리
```
jspdf                           ^2.5.1
html2canvas                     1.4.1
html-to-image                   1.11.11
react-pdf                       ^9.0.0
xlsx                            0.18.5
file-saver                      2.0.5
jszip                           3.10.1
@cyntler/react-doc-viewer       1.17.0
```

#### 보안 / 기타
```
crypto-js                       4.2.0
dompurify                       ^3.2.4
sanitize-html                   ^2.13.0
@msgpack/msgpack                ^3.1.2
json5                           ^2.2.3
jsonpath                        1.1.1
hot-formula-parser              4.0.0
ansi-to-html                    ^0.7.2
html-react-parser               4.0.0
react-speech-recognition        ^4.0.1
react-text-to-speech            ^5.1.3
```

#### 가상화 / 대용량
```
react-virtualized               9.22.5
react-virtualized-auto-sizer    1.0.24
react-window                    1.8.10
react-tiny-virtual-list         ^2.2.0
@tanstack/react-virtual         ^3.13.12
@tanstack/react-table           ^8.21.3
react-table                     ^7.8.0
```

#### 빌드 도구 (devDependencies)
```
webpack                         ^5.64.0
webpack-cli                     ^4.10.0
webpack-dev-server              ^5.1.0
babel-loader                    9.1.3
css-loader                      5.2.0
sass-loader                     12.6.0
postcss-loader                  6.1.0
autoprefixer                    10.0.0
css-minimizer-webpack-plugin    ^7.0.0
style-loader                    1.3.0
url-loader                      4.1.1
file-loader                     6.2.0
script-loader                   0.7.2
resolve-url-loader              ^5.0.0
ignore-loader                   0.1.2
eslint                          ^7.13.0
cross-env                       7.0.2
@testing-library/react          14.1.2
```

### `@zionex/wingui-core`
- `wingui` 에서 공용 사용되는 재사용 컴포넌트 / 유틸리티 라이브러리
- `wingui` 의존성의 부분 집합 (차트/플로우/수식 파서 등은 미포함)

## 8. 타 모듈과의 차이 / 특이점

| 영역 | wingui 고유 요소 |
|------|----------------|
| 배포 | 유일한 **WAR** 패키징 |
| 메시징 | 유일한 **Spring Kafka** 사용 |
| 보안 | 유일한 **Spring Security + JWT** |
| 배치 | 유일한 **Spring Batch** |
| 템플릿 | 유일한 **Thymeleaf + JSP** |
| 실시간 | 유일한 **WebSocket + STOMP** (서버), **Socket.io + SockJS + react-stomp** (클라이언트) |
| 메일 | 유일한 **Spring Mail** |
| HTTP 클라 | 유일한 **httpclient5 5.2.1** |
| 문서 | POI **4.1.2 / XMLBeans 3.1.0** (루트 BOM 3.15/2.6.0 override) |
| 파싱 | **jsoup, jsqlparser** 유일 |
| 프로파일 | Maven Profile(local/dev/prod) + YAML profile(mssql/postgresql) 이중 구조 |
| 프론트엔드 | 프로젝트 내 유일. React 18 + Kendo + MUI + Webpack 5 모노레포 |
| 라이선스 관리 | 빌드 시 `static/license/license.*` 를 별도 경로로 복사하는 전용 execution |
| 외부 연동 | Insight (Socket.io 기반) 연동 설정 포함 |

### 주의사항 (문서화 과정에서 발견)
- `application.yaml` 에 **DB 자격 증명이 평문**으로 저장되어 있음(`sa` / `Vivazio2025!`). Jasypt 가 `enabled: false` 상태. 운영 배포 시 반드시 암호화 또는 외부화 필요.
- SMTP 비밀번호도 평문으로 포함(`zqrkddjznganomal` — Gmail 앱 패스워드).
- 초기 관리자 비밀번호(`T3SmartSCM!`) 가 yaml 에 명시 — 최초 로그인 후 변경 정책 필요.
