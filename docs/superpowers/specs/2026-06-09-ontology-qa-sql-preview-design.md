# Ontology Q&A — Answer SQL Preview (Inline Runner Panel)

- **Date**: 2026-06-09
- **Status**: Implemented (single PR)
- **Scope**: Q&A 편집기 (`QaEditor.jsx`) 안에서 Answer 의 SQL 을 Target DB 에 안전 실행해 결과를 미리보기. 패널은 재사용 가능한 단일 컴포넌트로 추출.
- **Out of scope**: Entity / Process / View 편집기로의 확장, 실행 이력 영구 저장, 결과 export(CSV/Excel) — 향후 작업.

---

## §1. 배경

`tb_is_qapattern` 의 Q&A 한 행은 `question` (자연어) + `answer` (SQL) 쌍으로 구성된다. Composer 의 `OntologyPage` 에서 사용자는 100+ 개 Q&A 를 편집하며 Answer 의 SQL 이 운영 DB(T3SERIES MSSQL)에서 의도대로 동작하는지 검증해야 한다. 지금까지는:

1. 사용자가 Answer textarea 에서 SQL 작성/수정
2. 별도 SSMS/Azure Data Studio 를 열어 운영 DB 에 접속
3. SQL 붙여넣어 실행 → 결과 확인 → 다시 Composer 로 돌아와 저장

매번 외부 도구 왕복이 불필요. Composer 가 이미 `TargetDataSourceRegistry` 로 Target 별 HikariDataSource 캐시를 보유하고 있으므로, 같은 컨텍스트에서 안전한 미리보기를 제공하면 작업 흐름이 한 화면 안에서 닫힌다.

## §2. 목표 / 비목표

**목표**
- Q&A Answer textarea 바로 아래 인라인 패널에서 [SQL 실행] 한 번으로 Target DB 결과 확인
- 운영 DB 보호: SELECT/WITH 만 허용 (DML/DDL/EXEC 거부)
- 사용자가 자기 쿼리의 행 수를 직접 제어 (자동 TOP 주입 없음)
- 운영 DB 측 상태성 오류(tempdb 부족 등)와 사용자/SQL 오류를 시각적으로 구분
- 재사용 컴포넌트로 추출 — 향후 Entity/Process 편집기에서 동일 패널 mount

**비목표**
- DML/DDL/EXEC SP 미리보기 (운영 DB write 보호 우선)
- 실행 결과 영구 저장/감사 로그 DB 테이블 (서버 INFO 로깅만)
- 결과 CSV/Excel export (TSV 클립보드 복사로 임시 대응)
- 다중 statement (세미콜론 분리) 지원

## §3. 아키텍처

4-layer 단방향 호출. 신규 컴포넌트만 분리:

```
[UI]   QaEditor.jsx
         └─ <SqlRunnerPanel sql={dto.answer} targetCd dbType />     ← 신규
[API]  api.js · previewOntologySql(sql, targetCd, dbType)            ← 신규
[REST] POST /composer/ontology/sql/preview
[CTL]  OntologySqlPreviewController                                  ← 신규
[SVC]  OntologySqlPreviewService                                     ← 신규
         ├─ SqlGuard.check(rawSql)            (정적 검증)
         ├─ TargetDataSourceRegistry.getDataSource(targetCd)
         └─ Connection / PreparedStatement / ResultSetExtractor
```

기존 자산 재사용:
- `TargetDataSourceRegistry` — Target 별 Hikari pool 캐시 (db_url 등록된 Target 만)
- `AuthenticationProvider` — 감사 로그용 userId

신규 컴포넌트는 모두 도메인 `ontology` 하위에 배치 (격리 명확):
- `domain.ontology.service.OntologySqlPreviewService` (`SqlGuard` 도 같은 파일의 inner class)
- `domain.ontology.controller.OntologySqlPreviewController`
- `view/util/t3composer/ontology/SqlRunnerPanel.jsx`

## §4. 안전 정책 (SqlGuard)

**정적 검증 (실행 전)**:
1. **문자열·주석 마스킹**: 검증 단계에서만 `'...'`/`"..."`/`[...]` 안 내용을 `X` 로, `--`/`/*...*/` 주석을 공백으로 치환. 키워드 검사가 문자열·주석 내부를 잘못 매칭하지 않게.
2. **세미콜론 검사**: 마스킹된 SQL 의 trim 후 끝 `;` 1개만 허용. 그 외 위치에 `;` 있으면 `MULTI_STATEMENT` 거부.
3. **첫 키워드 화이트리스트**: `SELECT` · `WITH` 만 통과. `INSERT/UPDATE/DELETE/MERGE/TRUNCATE/DROP/ALTER/CREATE/GRANT/REVOKE/EXEC/EXECUTE/CALL/XP_CMDSHELL/OPENROWSET/OPENQUERY/BULK` 어느 키워드든 토큰 경계로 등장하면 `BLOCKED_KEYWORD`.
4. **`SELECT INTO` 별도 차단**: 결과를 새 테이블에 쓰는 변형 (`BLOCKED_INTO`).

**실행 가드**:
- `JdbcTemplate.setQueryTimeout(10)` 초 — UI hang 방지
- `setFetchSize(MAX_ROWS + 1)` — fetch 효율
- ResultSet 루프에서 `MAX_ROWS` 도달 시 break → `truncated: true`

**상한값**:
| 항목 | 값 | 의도 |
|---|---|---|
| `MAX_ROWS` | **5000** | 절대 안전망 (사용자가 TOP/WHERE 안 쓸 때만 발화) |
| `QUERY_TIMEOUT_SEC` | 10 | UI hang 방지 |
| `MAX_COLUMNS` | 200 | 메모리 보호 |
| `MAX_CELL_CHARS` | 1024 | 큰 nvarchar 잘림 표시 |

**자동 SQL 변환 없음**: 초기 설계에는 MSSQL 에 `TOP 100` 자동 주입이 있었으나, 사용자 피드백 (`tempdb` 에러 진단 과정) 으로 제거. 행 수는 사용자가 자기 쿼리의 `TOP N` / `WHERE` 로 직접 제어하는 것이 일관성 있고 예측 가능. `MAX_ROWS = 5000` 은 사용자가 행 수 제어를 깜빡 했을 때의 백엔드 OOM 방지용 안전망.

**Target connection 폴백 금지**: `getDataSource(targetCd)` 가 `null` 이면 정적 `targetDataSource` 폴백 없이 `TARGET_NOT_CONFIGURED` 로 즉시 거부 (`§13.7` 데이터 소스 표류 방지 원칙).

**감사 로그**: `log.info("[OntologySqlPreview] target={} user={} dbType={} sql=<prefix 200자>")` — DB 테이블 미사용.

## §5. UX — 인라인 패널

**배치**: `QaEditor.jsx` 의 Answer textarea 바로 아래 `<SqlRunnerPanel sql={dto.answer} targetCd dbType />`. dto.answer 가 prop 으로 매번 최신 → 저장 없이 편집 중 SQL 실행 가능.

**패널 헤더** (한 줄):
```
[▶ SQL 실행]  [▲▼]  결과 미리보기  ·  N행 · 23ms  ·  [잘림(5000행 상한)?]  ········  [📋]
```
- `[▶ SQL 실행]` — 실행 중에는 spinner + 비활성
- `[▲▼]` — 결과 영역 toggle (초기 펼침)
- 메타: 행 수 · 실행 시간 · (`truncated` 시) "잘림 (5000행 상한)" 칩
- `[📋]` — 결과 TSV 클립보드 복사

**결과 영역** (펼침 시):
- `max-height: 360px` + 가로 스크롤 허용. RealGrid 미사용 (가벼운 `<table>` + sticky header — 디버그 용도)
- 셀: monospace 11px, null → `(null)` 회색, boolean → ✓/✗, datetime → ISO 문자열
- 숫자는 우측 정렬

**오류 영역** (결과 영역 자리에):
- MUI `Alert` — DBA 이슈 패턴 감지 시 `severity="warning"`, 그 외 `error`
- 코드 + (있으면) SQLState + 한국어 힌트 + 원본 메시지

**DBA 이슈 패턴 감지** (`classifyDbaIssue`):
| 메시지 패턴 | 분류 | 안내 |
|---|---|---|
| `tempdb` + (`filegroup is full` \| `could not allocate`) | tempdb 부족 | 운영팀 디스크 확장/autogrowth/SQL Server 재시작 + 쿼리 가볍게 만들기 |
| `transaction log ... full` | tx log 가득 | 트랜잭션 로그 백업/축소 |
| `out of memory` / `insufficient memory` | 메모리 부족 | 쿼리 단순화 |
| `database ... in transition` | 일시 전이 | 잠시 후 재시도 |

감지 시 노란 박스로 "⚠ Target DB 운영 상태 이슈 — Composer 가드/쿼리 문제가 아닙니다" + 원인 / 해결 / 임시 우회 3줄 안내. 원본 SQL Server 메시지도 그대로 노출 (운영팀에 그대로 전달 가능).

## §6. 부수 변경 — `AiSuggestButton` no-diff UX

별표 ✨ 클릭 시 Claude 가 현재값과 의미상 동일한 결과를 돌려주는 케이스가 잦았음. 같은 내용을 좌·우 박스에 나란히 보여주는 다이얼로그는 시각적 잡음 + 닫는 동작 1번 추가.

**변경**: AI 응답 직후 `isSameSuggestion(currentValue, suggestion)` 비교. 동일하면 다이얼로그 안 띄우고 화면 하단 중앙에 보라색 Snackbar `'<field>' — 이미 적절한 값입니다 (Claude 가 동일한 결과를 제안)` 3초 표시.

**동등성 규칙**:
- `===` 또는 trim 후 동일 → 같음
- `null` ↔ `''` ↔ `[]` → 모두 빈 값 동일 취급
- 배열 vs 배열 → 길이 동일 + 요소별 `String(...).trim()` 동일
- 한쪽이 배열이고 다른쪽이 문자열 → 다름

## §7. 변경 파일

**신규**:
- `backend/src/main/java/com/zionex/t3composer/domain/ontology/service/OntologySqlPreviewService.java`
- `backend/src/main/java/com/zionex/t3composer/domain/ontology/controller/OntologySqlPreviewController.java`
- `frontend/src/view/util/t3composer/ontology/SqlRunnerPanel.jsx`

**수정**:
- `frontend/src/view/util/t3composer/api.js` — `previewOntologySql()` 추가
- `frontend/src/view/util/t3composer/ontology/editors/QaEditor.jsx` — Answer 아래에 `<SqlRunnerPanel>` mount, `import` 추가
- `frontend/src/view/util/t3composer/ontology/AiSuggestButton.jsx` — `isSameSuggestion` + Snackbar

## §8. 결정 사항 / 트레이드오프

| 결정 | 대안 | 채택 이유 |
|---|---|---|
| 인라인 패널 (Answer 아래) | 모달 / 우측 split | SQL ↔ 결과 동시 시야, 닫는 동작 불필요, 변경 영향 작음 |
| SELECT/WITH 만 허용 | EXEC SP_* 까지 허용 | 운영 DB 보호 최우선. Q&A 안 SP 호출 케이스는 v2 검토 |
| TOP 자동 주입 ❌ | TOP 100 자동 | 일관성·예측 가능성. tempdb 진단 과정에서 사용자 요청으로 제거 |
| 절대 상한 5000행 | 무제한 | 사용자 실수로 큰 결과 받을 때 백엔드 OOM 방지 |
| Target connection 폴백 ❌ | 정적 targetDataSource 폴백 | §13.7 데이터 소스 표류 사고 방지 원칙 |
| 가벼운 `<table>` 사용 | RealGrid2 wrapper | 디버그 용도라 정렬·필터·페이지네이션 불필요. 의존성·렌더 비용 절감 |
| DBA 이슈 패턴 = warning | error | 운영 DB 책임. 사용자 잘못 아님을 시각적으로 분리 |
| Snackbar (no-diff) | 다이얼로그 변형 | 작업 흐름 안 끊김. 추가 액션 0번 |

## §9. 향후 작업 (v2 이후)

- Entity 편집기 (`tb_is_ontlgy_entity` 의 `sql_node_id` 매핑 쿼리 검증) 에 동일 `SqlRunnerPanel` mount
- Process 편집기 (`tb_is_prcss_ontlgy` 의 `querydsl_list`) 도 동일
- 실행 결과 CSV/Excel export 버튼
- 짧은 결과 (1행 1열) 의 경우 패널 헤더에 인라인 표시 (펼침 불필요)
- 운영 DB 의 tempdb 가용 공간 사전 ping (선택 — over-engineering 위험)
