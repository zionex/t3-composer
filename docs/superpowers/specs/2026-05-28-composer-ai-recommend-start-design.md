# AI 추천으로 화면 시작 — 설계

- **날짜**: 2026-05-28
- **영역**: T3Composer 단계별 화면 생성 (`frontend/src/view/util/t3composer/`)
- **상태**: 승인됨 (브레인스토밍 완료, 구현 계획 작성 대기)

## 1. 배경 · 목적

현재 단계별 화면 생성(`ModeNewStep`)의 진입 화면은 시작 골격을 고르는 카드 3개
(SCM UI Mockup / T3MES UI Pattern / 빈 캔버스)를 제공하고, 모두 `ComposerWizard`
4단계(① Layout · ② 데이터·검색조건 · ③ 메타·메뉴 · ④ 생성)로 들어간다.

사용자가 "어떤 mockup으로 시작할지" 직접 찾아 고르는 대신, **자연어로 의도를 적으면
관련 SCM UI Mockup을 AI가 추천**하고, 고른 템플릿 기준으로 **4단계 Wizard를 AI가 자동
prefill**하는 진입점을 추가한다.

예: "수요계획 입력 화면을 만들고 싶어. 월별로 판매계획을 입력하고 실적과 비교했으면 좋겠어."
→ 판매계획 관련 mockup 상위 3개 추천 → 선택 → Layout/검색조건/메타 자동 채움.

## 2. 사용자 흐름

```
패턴 선택 화면(ModeNewStep)
  └─ [✨ AI 추천] 카드 (4번째) 클릭
       ↓ stage 'AI_RECOMMEND'
  AiRecommendPanel
    좌: 자연어 입력 + 예시 칩 + [✨ 추천 템플릿 찾기]
    우: 추천 템플릿 3장 (큰 썸네일 + 관련도% + 매칭 메뉴 + [이 템플릿으로 시작 →])
       ↓ "찾기"  → POST /composer/recommend-mockups
       ↓ "시작"  → POST /composer/prefill-from-mockup
  ComposerWizard (initialSpec = specFromMockup ⊕ AI(filter+meta))
    ① Layout ② 데이터·검색조건 ③ 메타·메뉴 ④ 생성
       (사용자가 Data Source 탐색에서 실제 테이블 확정 → Generate)
```

prefill은 "이 템플릿으로 시작 →" 클릭 시 **자동 실행**(로딩 표시 후 Wizard 진입). Wizard
모든 단계는 진입 후 자유 수정 가능.

## 3. 화면 설계 (확정 — B안)

- **상단 바**: `← 뒤로 │ ✨ AI 추천으로 화면 시작 [Beta]` + 우측 `Target: <cd>` (보라 accent #7C3AED)
- **좌측 패널 (~32%)**:
  - 헤딩 "무엇을 만들까요?"
  - 자연어 `textarea` (height ≈ 130)
  - 예시 칩 (클릭 시 textarea 채움): "거래처별 단가 관리" · "공급계획 시뮬레이션" · "재고 현황 조회"
  - `✨ 추천 템플릿 찾기` 버튼
  - 검색 결과 요약 박스 (검색된 mockup 수 · 추출 키워드 · `mode: ai|fallback` 표시)
- **우측 (가로 3장 카드)**:
  - **큰 썸네일(카드 상단, 높이 충분히 — 카드 세로 여백을 채울 만큼)** — 해당 mockup 컴포넌트를
    `MockupPickerDialog`와 동일한 lazy + `transform: scale()` 방식으로 축소 렌더
  - 하단: 관련도 배지(%) · 제목 · 1줄 설명 · 매칭 운영 메뉴(menuNm·menuId) · `이 템플릿으로 시작 →`
  - 1위 카드는 보라 테두리 강조
  - **썸네일 꾹 누르기(mousedown/touchstart) → 확대 오버레이**, 떼면(mouseup/leave) 닫힘 —
    오버레이 안에 mockup 컴포넌트를 더 큰 scale로 렌더
- 데이터 출처: 기존 `MOCKUP_ENTRIES`(`view/util/t3mockup`)의 모든 필드 재사용
  (patternCode·patternLabel·description·category·productLine·layoutCategory·menus·layers·component)

## 4. 추천 엔진 — `POST /composer/recommend-mockups`

- **입력**: `{ nl: string, candidates: [{ patternCode, label, description, category, productLine, menuNames: string[] }] }`
  - 프런트가 `MOCKUP_ENTRIES`를 키워드로 **1차 압축**(예: 상위 ~12개)한 후보만 전달 → 토큰 절약
- **처리**: Anthropic 호출 (Sonnet) — NL과 후보 카탈로그를 비교해 상위 3개를 관련도·이유와 함께 반환
- **출력**: `{ items: [{ patternCode, relevance: number(0~100), reason: string }], mode: 'ai', model }`
- **폴백**: API 키 없음 / 호출 실패 → 키워드 점수순 상위 3개 + `mode: 'fallback'`
  (관련도는 키워드 점수 정규화, reason 생략 또는 "키워드 매칭")
- 키워드 폴백 스코어러는 프런트·백엔드 공용 로직(가능하면 프런트 유틸 1곳)으로 두어
  1차 압축과 폴백 정렬이 동일 기준을 쓰게 한다.

## 5. AI 자동 prefill — `POST /composer/prefill-from-mockup`

- **입력**: `{ nl, mockupPatternCode, mockupMeta: { patternLabel, description, layers, menus }, moduleCode?, targetCd? }`
- **처리**: Anthropic 호출 — NL + 선택 mockup 메타로 다음 **부분 spec**만 생성:
  - `filterBar.items[]` — 검색조건 필드 (예: 기간 DATE_RANGE, 브랜드/채널 select, PLAN_SCOPE 등)
  - `meta` — `{ title, menuCd, parentMenuCd }` 추론 (menuCd는 제안값)
- **데이터바인딩(실제 테이블/SP)은 생성하지 않는다** — layer별 `dataSource.mode='NL'` +
  자연어 힌트 유지(=`specFromMockup` 기본값). 실제 테이블은 사용자가 Data Source 탐색에서 확정.
  → 규칙 §13.6/§13.7 (테이블·컬럼 환각 방지) 일치.
- **출력**: `{ spec: { filterBar?, meta? }, model }`
- **머지**: 프런트가 `specFromMockup(entry, baseMeta)` 베이스라인에 AI 부분을
  `mergeAiSpecIntoBaseSpec` 패턴으로 합침 (AI 값 우선, 알맹이 없으면 베이스 유지).
- **폴백**: 키 없음 / 실패 → `specFromMockup`만으로 Wizard 진입 (filter/meta 빈 채로, 절대 안 깨짐).

## 6. 백엔드 구현 방식 (확정)

**전용 엔드포인트 2개 신규** (`recommend-mockups`, `prefill-from-mockup`).
- 입력 구조가 기존 `prefill-from-source`(source bundle) / `prefill-from-design`(Excel)과 달라
  기존에 mode를 끼워넣으면 분기가 지저분 → 분리.
- 재사용: `PrefillFromSourceService`의 Anthropic 호출·프롬프트 캐싱·JSON 파싱·SP 오분류 방어
  패턴을 차용 (새 Service 2개 또는 1개 Service의 2 메서드).

## 7. 영향 받는 파일

**Frontend (신규/수정)**
- `ModeNewStep.jsx` — 4번째 카드 추가 + stage `'AI_RECOMMEND'` 분기
- `AiRecommendPanel.jsx` (신규) — 좌 NL 입력 / 우 3카드 + 꾹눌러 확대
- `api.js` — `recommendMockups({nl, candidates})`, `prefillFromMockup({...})` 추가
- `wizardState.js` — (필요 시) mockup 키워드 스코어러 유틸 + AI 부분 머지 헬퍼 보강
- 썸네일/확대 렌더는 `MockupPickerDialog`의 scale 패턴 참조(공용 추출 가능)

**Backend (신규)**
- `domain/controller/ComposerController.java` — 2개 엔드포인트 매핑
- `domain/service/RecommendMockupService.java` (신규)
- `domain/service/PrefillFromMockupService.java` (신규)
- `domain/dto/` — 요청/응답 DTO

## 8. 폴백 · 에러 처리

- API 키 미등록 / Anthropic 401·429·5xx / 타임아웃 → 두 엔드포인트 모두 **폴백 경로**로
  graceful degradation (추천: 키워드 정렬, prefill: specFromMockup만). 사용자에게 차단
  오류 대신 `mode:'fallback'` 안내.
- 후보 0개(키워드 매칭 실패) → 빈 결과 + "전체 mockup에서 직접 고르기"로 기존 MockupPicker 안내.

## 9. 범위 경계 (YAGNI)

- 신규 mockup 생성 없음.
- `ComposerWizard` 4단계 내부 로직 변경 없음 (initialSpec만 더 채워서 진입).
- 추천 결과 영속 저장 없음 (stateless 호출).
- 데이터바인딩 AI 자동 확정 없음 (NL 힌트까지만).
- 추천 대상은 `MOCKUP_ENTRIES` 전체(전 productLine). Target 연동 운영 메뉴 매칭은 menus 메타로 충분.

## 10. 성공 기준

- 패턴 선택 화면에 "AI 추천" 카드가 보이고, 클릭 시 B안 화면으로 전환된다.
- 자연어 입력 + "찾기" → 관련 mockup 3개가 관련도·매칭메뉴와 함께 표시된다.
- 썸네일 꾹 누르면 확대 오버레이가 뜨고 떼면 닫힌다.
- "이 템플릿으로 시작 →" → 자동 prefill 후 ComposerWizard 진입, ① Layout(mockup 구조) ·
  ② 검색조건 · ③ 메타가 채워져 있다(데이터바인딩은 NL 힌트).
- API 키 없이도 폴백으로 추천·진입이 끊기지 않는다.
