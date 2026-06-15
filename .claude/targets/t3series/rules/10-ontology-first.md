---
description: 자연어 질의·채팅·Insight·chatbot 기능을 설계·구현·수정할 때 반드시 참조. 온톨로지 5종 테이블을 통해서만 비즈니스 의미를 해석한다.
globs:
  - "**/insight/**"
  - "**/chat/**"
  - "**/nlquery/**"
  - "**/*Ontology*.java"
  - "**/tb_is_*.sql"
  - "**/TB_IS_*.sql"
  - "**/bfserver/**/*.py"
alwaysApply: false
---

# 10. Ontology-first Rule (온톨로지 우선 규칙)

> **T3SmartSCM 프로젝트 설계 규칙**: 자연어 질의(NL Query) 를 처리하는 **모든** 기능·답변·설계는 **반드시 온톨로지 테이블 5종을 먼저 참조**해야 한다. 테이블명·컬럼명·SP 이름만으로 업무 의미를 역추측하는 것은 **금지**.

## 1. 참조 대상 온톨로지 테이블 (5종)

| # | 역할 | 테이블 | 입자 | 키 |
|---|---|---|---|---|
| 1 | **View 온톨로지** | `tb_is_vwbusnss_ontlgy` | 화면(Screen) | `menu_cd` |
| 2 | **Process 온톨로지** | `tb_is_prcss_ontlgy` | 업무 프로세스 | `process_cd` (UNIQUE), `module` |
| 3 | **Q&A 패턴** | `TB_IS_QAPATTERN` | Q&A 페어 | `id` (UUID) + `business_domain` |
| 4 | **Entity** | `tb_is_ontlgy_entity` | 개별 엔티티 | `(id, version)` |
| 5 | **Entity 관계** | `tb_is_ontlgy_entity_relation` | 엔티티 쌍 | `(version, source, target, relation_type)` |

전부 `T3SMARTSCM.dbo` 스키마. **`wingui` 백엔드 / `bfserver` Python 양쪽**에서 참조.

## 2. 5-Step 참조 순서 (반드시 이 순서로)

```
사용자 질의
  ↓
Step 1. TB_IS_QAPATTERN 캐시 적중 확인
        → db_type=<현재DB> AND use_yn='Y' AND question 유사도
        → 적중 → answer 반환 (끝)
  ↓ (미적중)
Step 2. 화면 컨텍스트 (menu_cd 알려진 경우)
        → tb_is_vwbusnss_ontlgy
          WHERE menu_cd=? AND status='UPTODATE'
                AND published_version IS NOT NULL
        → screen_contract, intent_list, querydsl_list 획득
  ↓
Step 3. 프로세스 컨텍스트
        → tb_is_prcss_ontlgy
          WHERE module=? AND status='UPTODATE'
        → business_rules, data_sources, querydsl_list
  ↓
Step 4. 관련 엔티티 탐색
        → tb_is_ontlgy_entity
          WHERE status='CONFIRMED'
            AND (name LIKE ? OR terms LIKE ?)
          ORDER BY importance_score DESC, usage_count DESC
  ↓
Step 5. 엔티티 관계 그래프
        → tb_is_ontlgy_entity_relation
          WHERE (source_entity_id IN ? OR target_entity_id IN ?)
            AND use_yn='Y' AND weight >= 0.5
          ORDER BY weight DESC
  ↓
(위 결과를 LLM 프롬프트에 병합 → SQL/답변 생성)
  ↓
(검증된 답변이면 TB_IS_QAPATTERN 에 캐싱)
```

## 3. 상태·버전 규칙 (엄격히 준수)

### View·Process 온톨로지
| 상태 | 의미 | 사용 가능? |
|---|---|---|
| `UPTODATE` + `published_version` 있음 | 권위 있는 값 | ✅ 프로덕션 사용 |
| `STALE` | 마스터 변경으로 LLM 재추론 필요 | ⚠️ 사용 전 경고, 재추론 트리거 |
| `DRAFT` | 작업 중 | ❌ 사용자 답변 금지 |

`base_llm_version ≠ 현재 llm_version` 이면 구버전 기반 편집본 → 재확인 필요.

### Entity
- `CONFIRMED` → 프로덕션 사용 ✅
- `CANDIDATE`, `REVIEWING` → 검토 대기 ❌
- `MERGED`, `DEPRECATED` → **반드시** `duplicate_of` 따라가 정식 엔티티 대체

### Entity Relation
- `use_yn='Y'` + `weight >= 0.5` 만 사용 (임계치는 도메인별 조정 가능)

### Q&A Pattern
- `use_yn='Y'` 만 사용
- **`db_type`** 반드시 현재 접속 DB 와 일치 (MSSQL 답을 PostgreSQL 에 사용 금지)

## 4. LLM vs User-edited 이중 필드 — 우선순위

| LLM 추론 | 사용자 편집본 |
|---|---|
| `llm_infrrd` | `business_ontlgy` |
| `llm_screen_contract` | `screen_contract` |
| `llm_intent_list` | `intent_list` |
| `llm_querydsl_list` | `querydsl_list` |
| `llm_semantic_datasets` | `semantic_datasets` |
| `llm_process_contract` | `process_contract` |

### 선택 규칙 (우선순위 순)
```
1. published_version 있음 AND status=UPTODATE
   → 사용자 편집본 사용 (권위)

2. published_version IS NULL
   → LLM 추론본(llm_*) 사용

3. status=STALE
   → 재추론 트리거 필요. 기존 값 사용 가능하나 경고 표시

4. published_version 있으나 status=DRAFT
   → 이전 published_version 값 사용, DRAFT 는 무시
```

## 5. 설계·구현 체크리스트

- [ ] Q&A 캐시(`TB_IS_QAPATTERN`) 조회를 **첫 단계**로 두었는가?
- [ ] `db_type` 필터를 적용해 DB 간 섞임을 방지했는가?
- [ ] `menu_cd` 가 있을 때 `tb_is_vwbusnss_ontlgy` 를 우선 조회하는가?
- [ ] `status='UPTODATE'` 만 신뢰하고 `STALE`/`DRAFT` 는 경고 처리했는가?
- [ ] Entity 검색: `status='CONFIRMED'` + `importance_score` · `usage_count` 정렬?
- [ ] LLM 필드보다 사용자 편집 필드 우선 규칙 준수?
- [ ] 검증된 신규 Q&A 를 `TB_IS_QAPATTERN` 에 캐싱하는가?
- [ ] 엔티티 관계: `use_yn='Y'` + `weight >= 0.5` 필터 적용?
- [ ] 변경 이력(`_hist` 테이블)에 `change_type` 정확히 기록?
- [ ] `TB_IS_ONTLGY_VERSION.is_current='Y'` 와 일관된 값 사용?

## 6. Anti-patterns (절대 금지)

| ❌ 안티패턴 | ✅ 올바른 접근 |
|---|---|
| 테이블명 역추측 ("TB_FP_DEMAND 있으니까 수요 질의는 여기") | 온톨로지 경유로만 도메인 해석 |
| LLM 에 674개 DDL 덤프 | 온톨로지가 선별한 엔티티만 컨텍스트 |
| `DRAFT` 값으로 답변 | `UPTODATE` + `published_version` 만 |
| `db_type` 무시한 Q&A 사용 | 현재 DB 와 매칭되는 답변만 |
| `llm_*` + 사용자편집 동시 병합 | 하나만 선택 (사용자편집 우선) |
| `MERGED`/`DEPRECATED` 직접 사용 | `duplicate_of` 따라가 정식 엔티티 |
| 모든 Entity Relation 동등 취급 | `weight` 임계치 (>= 0.5) 적용 |

## 7. 예시 시나리오

### 시나리오 A — "재고 회전율이 낮은 품목 알려줘"
1. Q&A 캐시: `db_type='mssql' AND business_domain LIKE '%IM%' AND question LIKE '%재고 회전율%'`
2. 미적중 → Process 온톨로지: `module='IM' AND process_name LIKE '%재고%'` → `business_rules`, `data_sources`
3. Entity 탐색: `terms LIKE '%재고%회전%' AND status='CONFIRMED' ORDER BY importance_score DESC`
   - 후보: `INV_TURNOVER`, `ABCXYZ_ANALYSIS`
4. Relation: 위 엔티티로부터 관련 테이블/뷰 매핑 → `VW_INVENTORY_PLAN_CONFIRMED`
5. SQL → `VW_SLOWMOVING_STOCK` 또는 `VW_INVENTORY_PLAN_CONFIRMED` 조회
6. 성공 시 Q&A 캐시 업데이트

### 시나리오 B — 화면 `DP_MONTHLY_PLAN` 에서 "작년 대비 증감률이 큰 계정"
1. View 온톨로지: `menu_cd='DP_MONTHLY_PLAN' AND status='UPTODATE'`
   - `intent_list` 에서 "YOY 비교" 의도 확인
   - `querydsl_list` 에서 의도별 쿼리 템플릿 획득
2. Entity: `intent_list` 에 나온 엔티티 → `YOY_QTY`, `ANNUAL_QTY` (→ `VW_DEMAND_PLAN`)
3. 템플릿 + 엔티티로 SQL 조립 실행

### 시나리오 C — 화면 ID 모르고 "공급 충족률 RTF 알려줘"
1. Q&A 캐시 우선 (RTF 는 정형 질의 가능성 높음)
2. Entity: `terms LIKE '%RTF%' OR name LIKE '%공급 충족%'`
3. 엔티티의 `sql_node_id` 또는 `tables` JSON 확인 → `VW_MASTER_PLAN_ORD_TRACKING_LATEST`

## 8. 관련 애플리케이션 모듈

| 모듈 | 기능 |
|---|---|
| `t3series-wingui` | 온톨로지 CRUD UI, 채팅/Insight 프런트, Insight REST API |
| `t3series-bfserver` (Python) | GraphRAG 기반 온톨로지 자동 추출(LLM_PHASE1/PHASE2), 임베딩 관리, `tb_is_graphrag_*` / `tb_is_llm_*` |
| `t3series-common` | 공통 온톨로지 조회 repository (JPA) |

## 9. 보조 테이블 (필요시 함께 참조)

| 테이블 | 역할 |
|---|---|
| `tb_is_business_ontology` | 범용 비즈니스 온톨로지 — Agent 행동 규약, 사용자 의도 |
| `tb_is_vwbusnss_ontlgy_hist` · `tb_is_prcss_ontlgy_hist` | 변경 이력 (스냅샷 JSON) |
| `TB_IS_ONTLGY_VERSION` | 전체 버전 마스터 (`is_current`, `status`) |
| `TB_IS_ONTLGY_STAGE` | 스테이지 정의 |
| `TB_IS_ONTLGY_PROCESS` / `_ENTITY` | 프로세스 마스터 + 엔티티 매핑 |
| `TB_IS_PROMPTTPL` | 프롬프트 템플릿 |
| `TB_IS_META_*` | 기술 메타데이터 (테이블/컬럼/조인룰/FK) |
