# Ontology Tab — DB 단일 진실 + Filesystem Seed Package

**일자**: 2026-06-08
**상태**: Design

---

## 배경

T3Composer 의 Ontology Tab 은 자연어 질의용 base 데이터(Q&A · Entity · View · Process)를 화면에 노출하고 사용자 편집을 받는 화면이다. 이 데이터는 두 곳에 존재할 수 있다:

| 출처 | 위치 | 누가 채움 |
|---|---|---|
| **Target DB** (TB_IS_QAPATTERN · tb_is_ontlgy_entity · tb_is_vwbusnss_ontlgy · tb_is_prcss_ontlgy) | 운영 MSSQL | `t3series-bfserver` (Python · GraphRAG 자동 추출, `LLM_PHASE1/PHASE2`) |
| **Filesystem snapshot** (`<project_root>/.insight_code/ontology_v2/L1/qa_patterns/*.json` 등) | Target 프로젝트 루트 | 같은 bfserver 가 DB → JSON 으로 dump |

신규 프로젝트에 Composer 를 배포할 때:
- bfserver 가 함께 운영 → Target DB 채워짐 (가장 흔한 케이스)
- bfserver 미운영 + git 의 `ontology_v2/` 만 보유 → DB 비어있음, FS 만 존재
- 둘 다 없음 → 빈 상태에서 Composer UI 로 직접 입력

## 결정

**Target DB 가 단일 진실 저장소.** Filesystem 의 `ontology_v2/` 는 seed package — DB 가 비어있을 때 1회 채워 넣는 데만 사용.

| 시나리오 | 동작 |
|---|---|
| DB 채워짐 (bfserver 운영) | Composer 는 그대로 DB 읽음. FS 무관. |
| DB 비어있음 + FS 있음 | 사용자가 UI 의 [📥 파일에서 Import] 1회 클릭 → DB 채워짐 → 평상 동작 |
| 둘 다 없음 | 빈 상태로 시작. 사용자가 UI 로 직접 추가. |

근거:
- 운영 시스템(다른 서비스)도 같이 읽는 Target DB 를 진실로 두면 일관성 확보
- 사용자 편집(UI 의 Q&A 추가/수정)이 운영 환경 전반에 즉시 반영
- 이중 source (DB + FS) merge 의 복잡성 회피 — mental model 단순

## 컴포넌트

### `OntologyService` (Backend — 기존)
모든 Ontology Tab 의 read/write 가 Target DB 직접 SELECT/INSERT/UPDATE/DELETE.
- Target DB 라우팅: `TargetDataSourceRegistry` 가 세션 `targetCd` 의 live JdbcTemplate. 미등록/실패 시 정적 `targetJdbcTemplate` 폴백.
- composer-db 의 `tb_cmp_ontology_ext` 와 `(target_cd, kind, ref_id)` 키로 JOIN — Target DB schema 에 없는 확장 필드 (paraphrases/relatedEntityIds/notes) 를 별도 보관.

### `OntologyFilesystemReader` (Backend — 신규)
`<project_root>/.insight_code/ontology_v2/` 의 JSON 파일을 lazy 스캔해 in-memory 캐시. Per-Target 영속 캐시 (JVM 생존 동안 유지), `invalidate()` API 로 수동 폐기. **Import endpoint 전용** — 일반 read 경로에서 사용 안 함.

경로 해석 후보 (순서대로 시도, 첫 매칭 사용):
1. `/workspace/targets/<CD>/project` — Per-Target 프로젝트 루트 마운트 (`TARGET_<CD>_PROJECT_PATH`)
2. `TargetPathResolver.resolveSourcePath()` 결과부터 최대 5단계 위로 walk-up
3. `/workspace/targets/<CD>/wingui` — 평탄 구조 Target (wingui = project root) 호환

파일 → DTO 매핑:
- QA: `L1/qa_patterns/<id>.json` → `QaDto`
- Entity: `L2/ontology_entity/<entity_type>/<id>.json` (OntologyProcess 제외) → `EntityDto`
- View: `L2/screen_contracts/<menu_cd>.json` → `ViewMetaDto`
- Process: `L2/ontology_entity/OntologyProcess/<id>.json` → `ProcessMetaDto`

### `OntologyImportService` (Backend — 신규)
`OntologyFilesystemReader` 가 캐시한 base 데이터를 받아 Target DB 로 batch INSERT.

흐름 (카테고리별 트랜잭션 분리):
```
1. reader.listAll<Category>(targetCd) → in-memory base DTO 목록
2. Target DB 의 PK 일괄 조회:
   - QA:      SELECT id FROM TB_IS_QAPATTERN  WHERE id IN (...batch...)
   - ENTITY:  SELECT id FROM tb_is_ontlgy_entity ...
   - VIEW:    SELECT menu_cd FROM tb_is_vwbusnss_ontlgy ...
   - PROCESS: SELECT process_cd FROM tb_is_prcss_ontlgy ...
   IN 절은 1000개 단위 chunk 로 분할 (MSSQL 파라미터 한도 회피).
3. existingIds set 으로 reader 결과 필터 → 신규 row 만 추출
4. 카테고리별 batch INSERT (JdbcTemplate.batchUpdate, 500 row chunk)
5. 응답: { added, skipped, available } 카테고리별 카운트
```

**충돌 정책: skip-existing** — 이미 있는 id 는 update 하지 않고 skip. 파일이 이전 스냅샷이고 DB 가 더 최신인 경우를 보호.

INSERT 컬럼 매핑 (각 테이블의 NOT NULL · default 값 고려):
- **TB_IS_QAPATTERN**: `id · question · answer · db_type · business_domain · description='' (NOT NULL) · use_yn='Y' · create_by='composer-import' · create_dttm=GETDATE() · modify_by · modify_dttm`
- **tb_is_ontlgy_entity**: `id · version · name · entity_type · description · status='CONFIRMED' · importance_score · terms · use_yn='Y' · created_by · created_at · updated_by · updated_at`
- **tb_is_vwbusnss_ontlgy**: `id (UUID 자동) · menu_cd · version · use_yn='Y' · audit`
- **tb_is_prcss_ontlgy**: `id (UUID 자동) · process_cd · process_name · process_overview · module · status · version · use_yn='Y' · audit`

테이블 부재 시 (`SQLException: Invalid object name`) 해당 카테고리만 skip 하고 응답에 `skippedReason: "table absent"` 표시.

### Import endpoint
```
POST /composer/ontology/import-from-fs?targetCd=T3SERIES

Response 200 (정상):
{
  "targetCd": "T3SERIES",
  "ontologyRoot": "/workspace/targets/T3SERIES/project/.insight_code/ontology_v2",
  "hasFolder": true,
  "qa":      { "added": 1,    "skipped": 100,   "available": 101,  "skippedReason": null },
  "entity":  { "added": 4560, "skipped": 1449,  "available": 6009, "skippedReason": null },
  "view":    { "added": 3,    "skipped": 0,     "available": 3,    "skippedReason": null },
  "process": { "added": 1193, "skipped": 0,     "available": 1193, "skippedReason": null }
}

Response 200 (폴더 부재 시):
{
  "targetCd": "T3SERIES",
  "ontologyRoot": null,
  "hasFolder": false,
  "qa": {"added":0,"skipped":0,"available":0,"skippedReason":null},
  ...
}
```

### Refresh endpoint
```
POST /composer/ontology/refresh?targetCd=T3SERIES
```
Reader 의 Target 별 in-memory 캐시 폐기 + 즉시 워밍. 응답: `{ targetCd, ontologyRoot, hasFolder, qa, entity, view, process }` (카운트는 숫자). 사용자가 ontology_v2 폴더 파일을 수동으로 갱신했거나, Import 다이얼로그 진입 직전 fresh 카운트를 보고 싶을 때 호출.

### UI — Ontology Tab 헤더 [📥 Import] 버튼 (Frontend — 신규)
좌측 트리 toolbar 우측 끝에 download 아이콘 버튼.

Click 시 `OntologyImportDialog`:
```
┌─ 파일에서 Ontology Import ─────────────────────┐
│                                                │
│ 폴더: /workspace/targets/T3SERIES/project/    │
│       .insight_code/ontology_v2                │
│                                                │
│ 발견된 데이터:                                 │
│   Q&A      101                                 │
│   Entity   6,009                               │
│   View     3                                   │
│   Process  1,193                               │
│                                                │
│ ⚠️ 이미 DB 에 있는 id 는 skip 합니다.         │
│                                                │
│           [ 취소 ]    [ Import 실행 ]         │
└────────────────────────────────────────────────┘
```

진입 시 `refresh` endpoint 호출 → 카운트 미리보기. `[Import 실행]` → `import-from-fs` 호출 → 결과 토스트 + 좌측 트리 자동 reload.

폴더가 없으면 (`hasFolder: false`) 다이얼로그 본문에 안내 alert:
```
ontology_v2 폴더가 마운트되어 있지 않습니다.
.env 의 TARGET_<CD>_PROJECT_PATH 설정을 확인하고 backend 를 재기동하세요.
```

Import 실행 후 토스트:
```
✓ Import 완료 — Q&A 신규 1 (skip 100) · Entity 신규 4560 (skip 1449) · View 신규 3 · Process 신규 1193
```

## 데이터 모델

### Target DB (변경 없음)
4개 기존 테이블 — `TB_IS_QAPATTERN` · `tb_is_ontlgy_entity` · `tb_is_vwbusnss_ontlgy` · `tb_is_prcss_ontlgy`. Composer 는 이 테이블들의 정의된 컬럼만 사용. Import 가 INSERT 하는 컬럼도 정확히 이 컬럼만.

### composer-db `tb_cmp_ontology_ext`
Target DB schema 에 없는 확장 필드 저장:
```
id           uuid PK
target_cd    varchar(50)
kind         varchar(20)     -- 'QA' | 'ENTITY'
ref_id       varchar(64)
extension    jsonb           -- { paraphrases, relatedEntityIds, relatedTableNames, notes }
audit 컬럼들
UNIQUE (target_cd, kind, ref_id)
```
마이그레이션 `33_ontology_extension.sql` 이 정의 (기존). View / Process 카테고리는 사용자 편집 스코프 밖 — 본 overlay 비사용.

## 운영 절차

### 신규 Target 프로젝트 배포 (사용자 가이드)
1. `.env` 에 `TARGET_<CD>_PATH` (소스 root) + `TARGET_<CD>_PROJECT_PATH` (프로젝트 루트, `.insight_code/ontology_v2` 보유) 설정
2. `docker compose up -d --force-recreate composer-backend composer-frontend`
3. UI 에서 Target 선택 → Ontology Tab → [📥 파일에서 Import] 클릭
4. 다이얼로그 카운트 검토 → [Import 실행]
5. 이후 평상 동작 — DB 만 읽고 씀

### bfserver 운영 중인 프로젝트
1. `TARGET_<CD>_PROJECT_PATH` 미설정 가능 (Import 안 함)
2. Composer 는 bfserver 가 채운 DB 를 그대로 사용

## 에러 처리

| 상황 | 처리 |
|---|---|
| Target DB 연결 실패 | OntologyService 가 `fallbackTarget` (정적 targetJdbcTemplate) 사용. Import endpoint 는 500 + 에러 메시지. |
| Ontology folder 부재 | `hasFolder: false` 응답. UI 는 안내 alert. |
| JSON parse 실패 (특정 파일) | 해당 파일 skip + log warn. 전체 import 는 계속. 응답의 카운트는 성공한 것만. |
| INSERT 중 UNIQUE 위반 (race) | batchUpdate 가 부분 실패 시 row-by-row 폴백 — 그 row 만 skip. |
| 테이블 부재 (`Invalid object name`) | 해당 카테고리만 skip, `skippedReason: "table absent"`. 다른 카테고리는 계속. |

## 테스트 시나리오 (사용자 수동)

1. **dev T3SERIES — DB 채워진 환경** — `.env` 의 `TARGET_T3SERIES_PROJECT_PATH` 설정 후 Import 클릭. 다이얼로그에 폴더 카운트 표시. 실행 → Q&A 대부분 skip (이미 있음). Entity/Process 는 추가됨.
2. **Import 멱등** — 같은 Target 에 [Import 실행] 두 번 — 두 번째는 모든 카테고리 added=0.
3. **폴더 부재** — `TARGET_<CD>_PROJECT_PATH` 빈 상태. Import 버튼 클릭 → 다이얼로그에 "폴더 마운트 안 됨" 안내. [Import 실행] disabled.
4. **운영 데이터 보존** — Import 전후 기존 row 의 수정일시·내용 비교 → 변화 없음.
5. **사용자 추가 Q&A 영속화** — UI 로 새 Q&A 추가 → Target DB `TB_IS_QAPATTERN` 에 직접 row 추가 확인.

## YAGNI — 의도적 제외

- Auto-import on first refresh — 사용자가 수동 버튼 선택. 명시적 동의 없는 운영 DB 변경 회피.
- Upsert / force-overwrite 옵션 — skip-existing 만. 추후 필요 시 다이얼로그에 옵션 추가 가능.
- Import 진행률 SSE/Websocket — 7k row 도 batch INSERT 라 1초 내 완료. 진행 표시 불필요.
- Import 결과 영속 로그 테이블 — 응답 토스트 + backend INFO log 로 충분.

## 향후 확장 여지

- Import dialog 에 "특정 카테고리만 import" 체크박스 (기본은 전부)
- bfserver 가 ontology_v2 파일 갱신 시 git diff 알림 → "새 데이터 있음, Import?" 토스트
- `force-overwrite` 옵션 (현재 skip-existing 만)
- 카테고리별 import 진행률 SSE
