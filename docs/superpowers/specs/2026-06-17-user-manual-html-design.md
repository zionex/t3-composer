# T3Composer 사용자 가이드 — HTML 시각화 매뉴얼 (Design)

## 배경

`docs/` 폴더에 분석 결과 (UI-ANALYSIS-OVERVIEW, ui-patterns-auto, ui-inventory,
pattern-coverage, reference 카탈로그) 와 PPT outline (feature/composer-ppt-outline)
이 산재해 있고, frontend 의 7개 메인 메뉴는 각 화면 컴포넌트 안에 docstring 으로만
설명돼 있다. 신규 사용자가 T3Composer 의 설치·전체 사용 흐름·각 메뉴 역할을
한 번에 파악하려면 외부 매뉴얼이 필요. PPT outline 은 발표 용도라 흐름 위주이고,
인벤토리 .md 들은 데이터 위주라 그대로 매뉴얼이 되기는 부족.

## 목표

- T3Composer 의 **설치 → 첫 실행 → 7개 메뉴 사용법** 을 단일 HTML 한 파일로 한눈에 정리
- 더블클릭 한 번으로 오프라인 열람 가능 (외부 CDN/웹폰트 의존성 0)
- frontend 의 파스텔 글래스 룩을 매뉴얼 자체에도 적용 — 실제 화면과 매뉴얼이 시각적으로 일관

## 산출물

| 경로 | 내용 |
|---|---|
| `docs/manual/T3Composer-User-Guide.html` | 단일 HTML — 좌측 ToC + 우측 컨텐츠 |
| `docs/manual/README.md` | 폴더 인덱스 — HTML 열람 방법 한두 문단 |

## 매뉴얼 구조 (10개 섹션)

| # | 섹션 | 1차 source | 시각화 요소 |
|---|---|---|---|
| 0 | **설치** | `.env.example` · `docker-compose.yml` · CLAUDE.md §1.2 | 4-step 흐름 다이어그램 (clone → .env → docker up → localhost:5173) |
| 1 | 시작하기 | `frontend/src/App.jsx` MENU_ITEMS | 사이드바 mock (7개 메뉴 아이콘 + 라벨) |
| 2 | Composer (메인) — 모드 선택 | `T3Composer.jsx` NEW_MODE_OPTIONS / MODIFY_MODE_OPTIONS | 2 카테고리 + 5 모드 카드 grid |
| 2-1 | 자연어 생성 (NEW_NL) | `ModeNewGeneral.jsx` | 프롬프트 입력 + D&D 첨부 + 옵션 picker 영역 |
| 2-2 | 단계별 생성 (NEW_STEP) | `ModeNewStep.jsx` + `AiRecommendPanel.jsx` + `ComposerWizard.jsx` | AI 추천 카드 grid (image-derived 카드 포함) + 4-step Wizard flow |
| 2-3 | 기존 화면 복사 (NEW_FROM_COPY) | `ModeNewFromCopy.jsx` | 원본 메뉴 선택 + sourceBundle prefill |
| 2-4 | 자연어 수정 / 단계별 수정 (EXISTING_MODIFY) | `ModeExistingModify.jsx` | NL Modify vs Step Modify 선택 |
| 3 | History | `T3ComposerHistory.jsx` | 세션 목록 + 이어하기 |
| 4 | SCM UI Mockup | `T3Mockup` `index.js` MOCKUP_ENTRIES | 카테고리 5종 + 검색 + 매핑 메뉴 |
| 5 | UI Pattern | `T3mesPatternCatalog.jsx` | 섹션 → 그룹 → 파일 → TabPage 트리 |
| 6 | Gallery | `T3ComposerDict.jsx` (Grid/Chart/KPI 사전) | 3개 탭 |
| 7 | Ontology | `OntologyPage.jsx` (Q&A · Entity · View · Process) | 4개 영역 |
| 8 | Dashboard | `T3Dashboard.jsx` | 위젯 빌더 개요 |
| 9 | 부록 | `targetStore.js` · `ApiKeyDialog.jsx` · `TargetDbConnectionDialog.jsx` · CLAUDE.md | Target 전환 / API 키 / Target DB 연결 / 단축키 |

## 시각 디자인

- **레이아웃**: 좌측 280px 고정 ToC (sticky) + 우측 flex 컨텐츠. 모바일 시 ToC 가 상단 collapse.
- **색상 팔레트** (frontend `theme.js` 와 동일):
  - primary `#7CA7E0` · 강조 `#9D8FD4` · 성공 `#86C7A8` · 주의 `#E6C079`
  - 본문 `#3A4A63` · 보조 `#6E7E96` · 보더 `rgba(124,167,224,0.28)`
  - 배경 그라데이션 `linear-gradient(135deg, #f8fbff, #fff7ed)`
- **타이포**: system-ui (한글: -apple-system, "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif). 본문 14px / 제목 18-28px / 캡션 12px.
- **카드/위젯**: frontend `glassPanel` 의 backdrop-filter + 흰 반투명 보더 + inset 하이라이트 패턴 재현.

## 시각화 요소 — inline 구현 방식

- **사이드바 mock** — HTML/CSS 로 실제 사이드바를 1:1 재현. 메뉴 항목은 svg path 아이콘 + 라벨.
- **모드 카드 grid** — CSS grid 2x3, 각 카드는 `glassPanel` 룩.
- **4-step Wizard flow** — 가로 stepper, 각 step 박스 + 화살표 (CSS::before).
- **AI 추천 결과 grid mock** — 6 카드 grid (image-derived 카드 1개 + existing 4 + synth 1), 작은 wireframe 미니어처.
- **D&D 첨부 영역 mock** — dashed border + CloudUpload 아이콘 + chip 예시.
- **설치 flow diagram** — 4단계 카드 + 화살표.

## 기술 결정

| 항목 | 선택 | 이유 |
|---|---|---|
| 파일 수 | 단일 HTML | 더블클릭 열람·공유·인쇄 모두 단순. 200~300KB 예상 — 단일로 충분 |
| 외부 의존성 | 없음 (CSS·JS·아이콘 모두 inline) | 오프라인 / 사내망 환경 보장 |
| 자바스크립트 | ToC active 하이라이트 1개만 (~30줄) | YAGNI — 검색·테마전환·인쇄최적화 후순위 |
| 아이콘 | Material Icons SVG path inline (10개 이내 — Composer·History·Mockup·Pattern·Gallery·Ontology·Dashboard + CloudUpload·Settings·ArrowForward) | 외부 폰트/CDN 불필요 |
| 다국어 | 한국어만 | 사용자가 한국어 작성 선호 |
| 인쇄 최적화 | 후순위 (별도 작업) | 스크린 우선 |

## §0 설치 섹션 — 내용 골자

1. **사전 요구사항**: Docker Desktop · Anthropic API 키 (https://console.anthropic.com/)
2. **소스 받기**: `git clone <repo>` + `.env` 작성 (`cp .env.example .env` → ANTHROPIC_API_KEY 채움)
3. **컨테이너 기동**: `docker compose up -d` — 4개 서비스 (composer-db · target-mssql · composer-backend · composer-frontend) 자동 기동, db-init 가 멱등 초기화
4. **첫 접속**: http://localhost:5173 — 좌측 사이드바의 Composer 클릭하여 시작
5. **Insight LLM (선택)**: 호스트 port 9160 에 별도 기동 시 Insight 기능 활성 — 미기동 시 'upstream error' 표시 (정상)
6. **Target System 연결** (선택): 운영 wingui DB 가 있으면 `.env` 의 `TARGET_T3SERIES_DB_*` 설정 + backend 재기동 (`docker compose up -d --force-recreate composer-backend`)

## 안티패턴 (안 하는 것)

- 인터랙티브 데모/playground — 정적 시각화만
- 화면 실제 스크린샷 PNG 첨부 — 코드 변경 시 매뉴얼이 stale 됨. CSS mock 으로 1:1 재현
- 다국어 — 한국어만
- API/엔드포인트 reference — 사용자 가이드 범위 외 (`docs/reference/` 가 담당)
- 인쇄용 별도 CSS — 후순위
- 자체 검색 기능 — 브라우저 Ctrl+F 로 충분

## 검증

1. 단일 HTML 파일 열기 — Chrome/Edge/Safari 정상 렌더
2. 외부 네트워크 차단 상태에서 정상 렌더 (CDN 의존성 0 확인)
3. 좌측 ToC 클릭 → 해당 섹션으로 스크롤, active 하이라이트 동작
4. 좁은 폭 (768px 이하) 에서도 깨지지 않음

## 후속 작업 (이 spec 범위 외)

- 화면 변경 시 매뉴얼 동기화 책임자/타이밍 (별도 협의)
- 매뉴얼 사이트 호스팅 (현재는 git repo 안 정적 파일)
- 인쇄 PDF 변환 가이드
