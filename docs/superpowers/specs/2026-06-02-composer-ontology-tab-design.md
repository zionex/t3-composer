# Composer Ontology Tab — Design (v1)

> **목적**: insight-neo 가 가진 풍부한 온톨로지 자산(`tb_is_*` 5종 + V2 wiki/envelope)을 Composer 안에서 **참조·주입 (phase 1) + 일부 편집 (phase 2)** 두 갈래로 활용한다. v1 은 *얇은 슬라이스* — Q&A · Entity 만 CRUD, 나머지(View/Process) 는 메타 읽기 전용.

- 작성일: 2026-06-02
- 작성자: youngeun_park (브레인스토밍 합의)
- 상태: Draft (사용자 검토 대기)
- 후속: `docs/superpowers/plans/` 의 구현 plan

---

## 1. 컨텍스트 / 동기

### 1.1 현재 상태

Composer 는 자연어 화면 생성(NEW_NL) 시 사용자가 Target DB 의 테이블/SP/Ontology 를 `DataSourcePickerDialog` 의 별자리 맵에서 직접 선택해 prompt 에 권위 있게 주입한다. Ontology 탭은 이미 3섹션 (Q&A · 화면 의도 · UI 사용 SP) 존재.

문제 둘:

1. **얕은 주입** — picker 가 Claude prompt 에 ontology 항목의 *제목·subtitle* 만 보낸다. Answer 본문, Paraphrases, 연관 Entity 설명은 누락 (`ModeNewGeneral.jsx:576-598`). 사용자가 Q&A 를 골라도 Claude 는 핵심 SQL/패턴을 못 본 채 자체 추론 → 환각 위험.
2. **편집 도구 부재** — 새로 발견한 도메인 지식(Q&A/Entity)을 Composer 안에서 추가/수정할 수단이 없다. wingui 의 `tb_is_*` CRUD 화면을 따로 띄워 입력해야 함.

### 1.2 insight-neo 가 가진 자산

`C:\vs_project\t3series-insight-neo\packages` 분석:

- **insight-llm** — FastAPI 백엔드. `/ontology-v2/data/*` 와 `/ontology/*` 두 API blueprint 가 V1 (DB) / V2 (file corpus) 양쪽을 다룬다.
- **V2 corpus 모델** (`{cwd}/.insight_code/ontology_v2/`) — L1 jsonl + L2 envelope(view_manuals · screen_contracts · query_dsls · semantic_datasets · ontology_entity) + wiki markdown. 출처 추적, provenance, reports/ dump.
- **OntologyBuildWizard** — `webapps/insight-front/src/component/ontology/`. doc_type 별 폼 (query_dsl 4-tab · entity RJSF schema · paraphrases StringListEditor · TablesDatasetsBlock + ER 다이어그램 + SQL 자동 합성).

### 1.3 결정 — V1 schema 직접 + 확장은 side-table

- v1 은 **insight-neo 런타임 의존 0** — Composer 가 Target DB 의 `tb_is_*` 를 JdbcTemplate 으로 직접 읽고 쓴다 (V2 corpus / FastAPI 호출 안 함).
- V2 가 가진 확장 필드(paraphrases · related_entity_ids · sql_examples) 는 V1 schema 에 컬럼이 없다. 두 갈래 중 **B** 채택:
  - A) Target DB 의 `TB_IS_QAPATTERN` 에 `EXTENSION_JSON NVARCHAR(MAX)` 컬럼 추가 — *침습적. 운영 wingui DDL 영향*. ❌
  - **B) composer-db (PG) 에 side table `tb_cmp_ontology_ext` 신설** — Target 별 (target_cd) 격리, kind+ref_id 로 join. 운영 schema 무손상. ✅
- 후속(v2) 의 schema 진화 자유도 보존: V2 envelope 로 옮기고 싶을 때 side-table 만 export 하면 됨.

---

## 2. 결정 사항 요약 (브레인스토밍 합의)

| 항목 | 결정 |
|---|---|
| 사용 목적 | phase 1 참조·주입 + phase 2 일부 편집 (둘 다) |
| 가져올 ontology 타입 | Q&A · Query DSL 흔적 · Entity (Q&A · Entity 만 v1 편집) |
| 데이터 소스 | Target DB 직접 (`tb_is_*` JdbcTemplate) |
| UX 진입점 | 상단 Tab `[Ontology]` 신설 (옵션 B) |
| v1 편집 범위 | Q&A + Entity CRUD · View/Process 메타 읽기 전용 |
| AI 어시스트 | 필드별 `✨ AI 제안` 버튼 1개 (Single-button) |
| 확장 필드 저장 | composer-db `tb_cmp_ontology_ext` side-table |
| Picker 강화 | 같은 데이터 공유 + prompt 주입 *본문까지* (Answer + Paraphrases + Entity desc) |

---

## 3. 아키텍처

### 3.1 모듈 구성

**프런트** (`frontend/src/view/util/t3composer/ontology/`):

```
ontology/
├── OntologyPage.jsx          상단 Tab 진입점 — App.jsx MENU_ITEMS 가 mount
├── OntologyTree.jsx          좌측 카테고리 트리 (240px 고정)
├── editors/
│   ├── QaEditor.jsx          Q&A CRUD 폼
│   ├── EntityEditor.jsx      Entity CRUD 폼
│   ├── ViewReadOnly.jsx      View 메타 패널 (readOnly)
│   └── ProcessReadOnly.jsx   Process 메타 패널 (readOnly)
├── AiSuggestButton.jsx       ✨ 공용 — 모달로 diff 미리보기
├── ontologyStore.js          (선택) Zustand — 트리 카운트 / 현재 선택
└── api.js                    zAxios 래퍼 — /composer/ontology/*
```

- `App.jsx` 의 `MENU_ITEMS` 에 `{ key:'ontology', label:'Ontology', component: OntologyPage }` 한 줄 추가 (History·Mockup·Pattern·Gallery 와 같은 패턴).
- 기존 `DataSourcePickerDialog` 안의 `OntologyTab.jsx` 는 유지 — 단 api.js 를 같은 endpoint 로 통일.

**백엔드** (`backend/src/main/java/com/zionex/t3composer/domain/ontology/`):

```
ontology/
├── OntologyController.java         REST endpoints (/composer/ontology/*)
├── OntologyService.java            Target DB 읽기/쓰기 + 확장 join
├── OntologyExtensionService.java   composer-db side-table CRUD
├── OntologySuggestController.java  POST /composer/ontology/suggest (Claude 1회 호출)
├── OntologySuggestService.java     prompt 조립 + Anthropic API
├── dto/
│   ├── QaDto.java
│   ├── EntityDto.java
│   ├── ViewMetaDto.java
│   ├── ProcessMetaDto.java
│   ├── TreeNodeDto.java
│   └── SuggestRequest.java / SuggestResponse.java
└── entity/
    └── OntologyExtension.java      @Entity → composer-db tb_cmp_ontology_ext
```

- 기존 `ComposerMetaService.listOntology*` (read-only list) 는 *보존* — picker 의 기존 사용처와 호환. 새 `OntologyService` 는 단건 조회·CUD 까지 확장.
- ★ rules/41b — Target DB JdbcTemplate 에 `@Qualifier("targetJdbcTemplate")` · composer-db JdbcTemplate 에 `@Qualifier("composerJdbcTemplate")` 명시.

### 3.2 DB

**Target DB (MSSQL — 무손상 사용)**:
- `TB_IS_QAPATTERN` — id, question, answer, db_type, business_domain, use_yn, create_*/modify_*
- `tb_is_ontlgy_entity` — id, version, name, entity_type, description, status, importance_score, terms, use_yn
- `tb_is_vwbusnss_ontlgy` — id, menu_cd, status, published_version, ...
- `tb_is_prcss_ontlgy` — id, process_cd, process_name, module, status, version
- (스키마 변경 0)

**composer-db (PG — 신설 1테이블)**:

다음 마이그레이션 번호: `33` (기존 마지막 `32_preview_mockup_cache.sql`).

```sql
-- docker/db/init-pg/33_ontology_extension.sql  (멱등 — IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS dbo.tb_cmp_ontology_ext (
    id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    target_cd     varchar(50)   NOT NULL,    -- 'T3SERIES' 등
    kind          varchar(20)   NOT NULL,    -- 'QA' | 'ENTITY'
    ref_id        varchar(64)   NOT NULL,    -- Target DB 의 id (TB_IS_QAPATTERN.id 등)
    extension     jsonb         NOT NULL,    -- { paraphrases:[..], relatedEntityIds:[..], notes:'..' }
    create_by     varchar(50),
    create_dttm   timestamp     DEFAULT now(),
    modify_by     varchar(50),
    modify_dttm   timestamp     DEFAULT now(),
    UNIQUE (target_cd, kind, ref_id)
);

CREATE INDEX IF NOT EXISTS ix_ontology_ext_lookup
    ON dbo.tb_cmp_ontology_ext (target_cd, kind, ref_id);
```

### 3.3 Endpoint 카탈로그

| Method | Path | 용도 |
|---|---|---|
| GET | `/composer/ontology/tree?targetCd=&q=` | 좌 트리 + 카테고리별 카운트 |
| GET | `/composer/ontology/qa/{id}?targetCd=` | Q&A 1건 (extension join) |
| GET | `/composer/ontology/qa/bulk?ids=&targetCd=` | Q&A 다건 (Picker 주입용 — Answer + extension 포함) |
| POST | `/composer/ontology/qa?targetCd=` | 새 Q&A 생성 |
| PUT | `/composer/ontology/qa/{id}?targetCd=` | Q&A 수정 (If-Match: modify_dttm) |
| DELETE | `/composer/ontology/qa/{id}?targetCd=` | Q&A soft delete (use_yn='N') |
| GET | `/composer/ontology/entity/{id}?targetCd=` | Entity 1건 |
| GET | `/composer/ontology/entity/bulk?ids=&targetCd=` | Entity 다건 |
| POST | `/composer/ontology/entity?targetCd=` | 새 Entity 생성 |
| PUT | `/composer/ontology/entity/{id}?targetCd=` | Entity 수정 |
| DELETE | `/composer/ontology/entity/{id}?targetCd=` | Entity soft delete |
| GET | `/composer/ontology/view/{menuCd}?targetCd=` | View 메타 (read-only) |
| GET | `/composer/ontology/process/{processCd}?targetCd=` | Process 메타 (read-only) |
| POST | `/composer/ontology/suggest` | ✨ AI 제안 (1 필드 = 1 제안) |

`targetCd` 는 `useTargetStore.currentTargetCd` 에서 자동 전달 (rules/50 §6 패턴 따름).

---

## 4. 화면 구조

### 4.1 진입점

`App.jsx` 상단 메뉴: `T3Composer · History · SCM UI Mockup · UI Pattern · Gallery · ★ Ontology`.

### 4.2 페이지 레이아웃

```
┌─────────────────────────────────────────────────────────────┐
│ Ontology 페이지                                              │
│ ┌─ 좌 (240px) ──────────┐ ┌─ 우 (flex:1) ───────────────┐  │
│ │ 🔍 검색…              │ │ <카테고리별 Editor>          │  │
│ │                       │ │   - QaEditor                 │  │
│ │ Q&A (124)             │ │   - EntityEditor             │  │
│ │   ├ DP (38)           │ │   - ViewReadOnly             │  │
│ │   └ BF (26)           │ │   - ProcessReadOnly          │  │
│ │ Entity (210)          │ │                              │  │
│ │ View (54)  [readonly] │ │                              │  │
│ │ Process (38)[readonly]│ │                              │  │
│ │                       │ │                              │  │
│ │ [+ 새 Q&A] [+ 새 Entity]                                  │  │
│ └───────────────────────┘ └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

- 좌 트리: 카테고리 → 도메인(BF/DP/…) → row. 검색은 모든 카테고리 통합 fuzzy.
- 우 편집 폼: 선택된 row 의 category 에 따라 컴포넌트 swap.
- 폼 padding `p:1.5` · 라벨 12px · 입력 14px · 파스텔 테마 (rules/50 §14.6 패스텔 글래스).

### 4.3 QaEditor 폼 필드

| 필드 | 출처 | UI | AI 제안 |
|---|---|---|---|
| Question | `TB_IS_QAPATTERN.question` | text | ✨ |
| Answer | `TB_IS_QAPATTERN.answer` | textarea (8행) | ✨ |
| Domain | `business_domain` | text (BF/DP/MP/…) | ✨ |
| DB Type | `db_type` | select (mssql/oracle/postgresql) | — |
| Paraphrases | `tb_cmp_ontology_ext.extension.paraphrases` | string list (add/×) | ✨ 자동 3개 |
| 연관 Entity | `tb_cmp_ontology_ext.extension.relatedEntityIds` | chip list + [+] (Entity picker 모달) | ✨ 자동 추천 |
| use_yn | (메타) | 폼 X — 삭제 = N |

### 4.4 EntityEditor 폼 필드

| 필드 | 출처 | UI |
|---|---|---|
| name | `tb_is_ontlgy_entity.name` | text |
| entity_type | `entity_type` | text |
| description | `description` | textarea |
| terms | `terms` | string list (검색 가능 별칭) |
| status | `status` | select (CANDIDATE/REVIEWING/CONFIRMED) — 기본 CONFIRMED |
| importance_score | `importance_score` | number (0-1) |
| 연관 Table | `tb_cmp_ontology_ext.extension.relatedTables` | chip list |

(version 은 트리에서 row 선택 시 결정 — 기본 최신, 다중 버전은 v2.)

### 4.5 규약

- **저장 직후** 트리 자동 refresh + 선택 row 유지
- **삭제** = soft delete (`use_yn='N'`, modify_dttm 갱신)
- **타이포** 화면 제목 14px/700 · 본문 13px · 캡션 11px (rules/50 §13.3)
- **다국어** 라벨 한글 hard-code (Ontology 자체가 NL 자산이라 i18n 불필요)
- **권한** v1 은 무인증 (composer-dev mock 사용자 그대로) — 향후 SecurityConfig 와 연계

---

## 5. 데이터 흐름

### 5.1 Tab 편집 흐름

```
사용자 → [Ontology Tab]
   ↓
GET /composer/ontology/tree?targetCd=T3SERIES&q=
   → OntologyService.tree() — Target DB count + side-table 메타
   ↓ (Q&A 1건 클릭)
GET /composer/ontology/qa/{id}?targetCd=T3SERIES
   → 1) Target DB SELECT (TB_IS_QAPATTERN)
     2) composer-db SELECT (tb_cmp_ontology_ext WHERE kind='QA' AND ref_id=id)
     3) merge → QaDto { ..., paraphrases, relatedEntityIds }
   ↓ (편집 + 저장)
PUT /composer/ontology/qa/{id}?targetCd=T3SERIES
  Headers: If-Match: <modify_dttm ISO>
  Body:    { question, answer, dbType, domain,
             paraphrases:[...], relatedEntityIds:[...] }
   → 1) Target DB UPDATE TB_IS_QAPATTERN (question/answer/db_type/business_domain
                                          + modify_by/modify_dttm)
     2) composer-db UPSERT tb_cmp_ontology_ext (extension JSON)
   ↓
응답 { ok:true, row, modifyDttm } → 좌 트리 refresh
```

### 5.2 Picker 참조·주입 흐름

```
사용자 → NEW_NL [Data Source 선택] → Ontology 탭 → Q&A 바스켓 추가
   ↓ (사용자가 더 추가하다가 [생성하기] 클릭)
GET /composer/ontology/qa/bulk?ids=7c3a,abcd,…&targetCd=T3SERIES
   → 모든 row 본문 + extension 한 번에 (N+1 회피)
   ↓
ModeNewGeneral.systemContext 조립:
   === 데이터 소스 ===
   …(기존 DB Entity / SP 블록)…
   [온톨로지 — Q&A · 권위 있는 지정]
   ── 7c3a 수요예측 이용률은? ───────
   Q: 수요예측 이용률은?
   A: SELECT … FROM VW_BF_FORECAST_USAGE …
   Paraphrases: 수요예측 이용률 · BF 정확도는? · 예측 적중률
   Domain: BF · DB: mssql
   연관 Entity:
     · RTF — 수요 충족률 (Request To Fulfill)
     · BF_FCST_CYC — 예측 주기
   ────────────────────────
   ↓
Claude prompt 에 권위 있게 주입 → 생성 결과의 SQL/용어가 기존 자산 재사용
```

`ModeNewGeneral.jsx:576-598` 의 ONTOLOGY_QA / ONTOLOGY_INTENT / ONTOLOGY_SP 블록을 위 형식으로 교체. 상한 토큰: Answer body 8K자 (rules/50 §16.2 패턴 따라 잘리진 않음 — ontology 는 환각 방지 핵심 페이로드).

### 5.3 Picker 우측 미리보기 (선택 사항)

bulk endpoint 가 본문을 가지고 있으므로, Picker 의 우측 패널이 hover/선택 row 의 Answer 일부 + Paraphrases + 연관 Entity 를 미리 보여줄 수 있다. 구현 가벼움. v1 에 포함 권장.

---

## 6. AI 제안 (Single-button)

### 6.1 흐름

```
필드 옆 [✨] 클릭 → 버튼 spinner
   ↓
POST /composer/ontology/suggest
  body: { field:'answer', kind:'QA', targetCd:'T3SERIES',
          row:{question, answer, domain, dbType,
               paraphrases, relatedEntityIds} }
   ↓ 백엔드 — OntologySuggestService
1. row + Target DB 컨텍스트 조립:
   - 같은 domain 의 다른 Q&A 5개 (예시)
   - 연관 Entity description (extension 에 ID 있으면)
   - INFORMATION_SCHEMA 의 VW_* 뷰 컬럼 메타
2. Anthropic Claude 1회 호출
   model:  Composer 의 기존 AutoSuggestService 와 동일 (현재 'claude-sonnet-4-5').
           AnthropicApiKey 등록 흐름은 기존과 공유.
   system: <필드별 prompt — 6.2 참조>
   user:   <row + 컨텍스트 직렬화>
   cache_control 부착 (rules/50 §16.1)
3. 응답 텍스트 정제 → SuggestResponse
   ↓ 프런트
[✨ 결과 미리보기] 모달 표시:
   - 현재값 / 제안값 diff (split)
   - [수락] → setValue, [거부] → 닫기
```

### 6.2 필드별 prompt

| field | system prompt 골자 | 출력 형식 |
|---|---|---|
| `question` | "Answer 본문에서 사용자 의도를 1줄 자연어 질문으로 추출" | 1줄 텍스트 |
| `answer` | "Question + domain + 연관 Entity description + VW_* 컬럼 메타로 SQL 또는 가이드 생성" | 본문 (SQL 권장) |
| `paraphrases` | "Question 의 의미 동일 변형 3개. 한국어." | JSON array (3개) |
| `relatedEntityIds` | "Question/Answer 의 키워드를 Target DB 의 tb_is_ontlgy_entity 와 매칭. status='CONFIRMED' importance_score 우선 5개" | JSON array (id) |
| `domain` | "Question/Answer 키워드 → BF/DP/MP/FP/IM/RP/SA/CM 중 1개 분류" | 단어 1개 |

### 6.3 안전 규칙

- 1회 호출 = 1 필드 = 1 제안. 비용 명확.
- `cache_control: ephemeral` breakpoint 부착 — 후속 호출에 cache_read 적용.
- 응답이 미리보기 모달을 거치므로 필드에 직접 쓰이지 않음 — LLM 환각 방어.
- Claude 오류·타임아웃 → 스낵바 + 필드 값 유지. 자동 재시도 X.

---

## 7. 에러 처리

| 상황 | 처리 |
|---|---|
| Target DB 미연결 | 좌 트리 자리에 "Target DB 연결을 확인하세요" 카드 + `TargetDbConnectionDialog` (rules/50 §6) 안내 |
| `TB_IS_QAPATTERN` 부재 | 카테고리 카운트 0 + 빈 트리 (`ComposerMetaService.ontologyList` 의 폴백 패턴 — throw 안 함) |
| 동시 편집 충돌 | PUT 시 `If-Match: <modify_dttm>` → 412 → "다른 사용자가 수정했습니다. 다시 불러올까요?" 모달 |
| AI 제안 실패 | 스낵바 `✨ AI 제안 실패: <message>` · 필드 값 유지 · 자동 재시도 X |
| 필수 필드 빈 값 | 프런트 validate — question·answer 필수. 빨간 보더 + 헬퍼 텍스트 |
| Picker bulk fetch — 일부 row 부재 | 있는 것만 반환 + `missing:[ids…]` 응답 · 프런트 바스켓에서 제거 |
| composer-db side-table 부재 (마이그레이션 미적용) | side-table SELECT 가 SQLException → extension 만 빈 객체로 폴백 · base row 는 정상 반환 |

---

## 8. 테스트

### 8.1 백엔드 (JUnit 5 + Testcontainers + WireMock)

```
OntologyServiceTest
  · listTree() 카테고리 카운트 정확
  · getQa() Target SELECT + composer-db extension JOIN
  · saveQa() 신규/수정 양 경로 + UPSERT extension
  · saveQa() If-Match 충돌 → 412
  · deleteQa() soft delete (use_yn='N', modify_dttm 갱신)
  · listBulkQa() 일부 missing 처리

OntologySuggestServiceTest
  · prompt 조립 — 같은 domain Q&A 5건 + Entity desc 포함
  · WireMock Claude mock 1회 호출 + cache_control 부착 검증
  · 응답 정제 (JSON / 텍스트 자동 판별)
  · 타임아웃 → 502 변환
```

### 8.2 프런트 (Vitest + React Testing Library)

```
OntologyPage.test
  · 카테고리 클릭 → 우 패널 컴포넌트 swap
  · Q&A row 클릭 → form 채워짐
  · 저장 → API mock 호출 + 트리 refresh + 선택 유지
  · ✨ 클릭 → suggest 호출 + 모달 표시
  · 모달 [수락] → setValue · [거부] → 변화 없음
  · If-Match 충돌 412 → 다시불러오기 모달

PickerInjection.test
  · 바스켓 Q&A 1건 → systemContext 에 Answer + Paraphrases + Entity desc 포함
  · bulk endpoint 1회만 호출 (N+1 회피)
```

### 8.3 수동 검증

- Composer 단독 환경에서 [Ontology Tab] 진입 → Q&A 1건 신규 생성 → NEW_NL 로 그 Q&A 를 바스켓에 담아 새 화면 생성 → Claude 응답이 그 Answer/SQL 을 재사용하는지 확인

---

## 9. 스코프 밖 (v2 이후 후보)

- View / Process CRUD (지금은 메타 read-only)
- insight-neo V2 wiki 빌드 트리거 / agent-invoke 연동 (`/ontology-v2/data/build-corpus`)
- Query DSL 독립 편집 — 현재는 querydsl_list 안 nested. V2 envelope 의 4-tab wizard (`OntologyBuildWizardForm`) 이식
- Status 워크플로 (DRAFT → REVIEWING → CONFIRMED → PUBLISHED) + published_version pin
- Entity Relation 그래프 시각화 (`tb_is_ontlgy_entity_relation`)
- Q&A bulk import (CSV/JSON)
- 다중 사용자 권한 / 변경 이력 (`_hist` 테이블 연계)

---

## 10. 변경 위치 요약

| 종류 | 위치 | 변경 |
|---|---|---|
| 신규 프런트 | `frontend/src/view/util/t3composer/ontology/*` | 6개 .jsx + api.js + (옵션) ontologyStore.js |
| 프런트 수정 | `App.jsx` `MENU_ITEMS` | Ontology Tab 1줄 추가 |
| 프런트 수정 | `view/util/t3composer/ModeNewGeneral.jsx:576-598` | systemContext 의 ONTOLOGY_* 블록을 본문까지 직렬화 |
| 프런트 수정 | `view/util/t3composer/OntologyTab.jsx` (Picker 내) | api.js 새 endpoint 로 통일 + 우측 미리보기 패널 |
| 신규 백엔드 | `backend/.../domain/ontology/*` | Controller + Service + Suggest + DTO + Entity |
| 백엔드 보존 | `ComposerMetaService.listOntology*` | 변경 없음 (read-only 호환) |
| DB 마이그레이션 | `docker/db/init-pg/NN_ontology_extension.sql` | `tb_cmp_ontology_ext` 1개 (멱등) |
| 테스트 | `backend/src/test/.../ontology/*` · `frontend/src/.../ontology/*.test.jsx` | 신규 |
| 문서 | `docs/superpowers/specs/` (이 파일) + `docs/superpowers/plans/` (다음 단계) | 신규 |

---

## 11. 마이그레이션 / 적용

- composer-db 신규 마이그레이션 `docker/db/init-pg/33_ontology_extension.sql` — 기존 DB 볼륨에는 자동 미적용 (rules/50 §10). 동기화 후 수동 적용: `docker compose exec -T composer-db psql -U composer -d T3SMARTSCM -v ON_ERROR_STOP=1 < docker/db/init-pg/33_ontology_extension.sql`
- Target DB 변경 없음.
- Anthropic API 키 등록은 기존 `/composer/apikey/diag` 흐름 그대로.

---

## 12. 위험 / Open Issues

1. **Target DB 의 `extension_json` 부재 — side-table 분리가 옳은가?** 결정: side-table. 다만 Target DB 의 row 가 직접 삭제될 경우 ref_id 가 orphan 화. → 주기적 cleanup (v2). v1 은 매 GET 시 base row 존재 검증으로 충분.
2. **bulk endpoint 토큰 폭주** — Q&A 가 10건 이상 담기면 systemContext 가 커짐. 환각 방지가 더 중요하다는 §1.1 결론에 따라 자르지 않음. 단 picker UI 가 바스켓 한도 (예: 8건) 경고.
3. **AI 제안 비용** — 사용자가 ✨ 를 연타하면 호출 비용 누적. cache_control 로 후속 호출은 cache_read 할인 — 그래도 throttle 권장 (3초 내 같은 필드 재호출 차단).
4. **저장 충돌 정책** — If-Match 412 처리 모달이 사용자 혼란을 일으킬 가능성. 첫 버전은 단순 alert + "다시 불러오기".
5. **카테고리 트리 카운트 성능** — `SELECT COUNT(*) FROM TB_IS_QAPATTERN` 등 4개 카테고리 카운트가 매번. 30초 캐시 (`SchemaMetaCache` 패턴 재사용).
