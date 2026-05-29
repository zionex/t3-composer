# PlanNEL Rules Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite 7 core PlanNEL rule files in `.claude-plannel/rules/` to accurately reflect the saas-plannel source stack (Spring `t3series.saas.*` / AG-Grid / Redux Toolkit / i18next / react-pro-sidebar / craco) so that Composer NEW_GENERAL sessions with target=PLANNEL produce PlanNEL-conformant artifacts instead of wingui-flavored ones.

**Architecture:** Two-phase content authoring — Phase 1 (Backend pack: 41b-composer-java, 30-data-access, 40-database-schema) → user verification → Phase 2 (Frontend pack: 21-components, 20-screen-development, 41-composer-generation, 99a-composer-anti-patterns) → user verification. Each rule file is authored as one task by analyzing the saas-plannel source, then saved to `.claude-plannel/rules/<rule-code>.md`. Phase boundaries trigger DB re-import via `POST /composer/targets/PLANNEL/import-claude` (upsert — versions auto-increment, no DELETE needed since rules already in correct shape from prior re-import).

**Tech Stack:**
- Source under analysis: `/Users/hej/work/projects/saas-plannel/{saas-application,saas-web}`
- Target files: `/Users/hej/work/projects/t3-composer/.claude-plannel/rules/*.md`
- DB: composer-db (PostgreSQL) — `dbo.tb_cmp_target_rule`
- Re-import API: `POST http://localhost:8090/composer/targets/PLANNEL/import-claude` with body `{"claudeRoot":"/workspace/plannel-claude"}`
- Reference template structure: `.claude/rules/*.md` (T3SERIES) — same numbering · same heading pattern

**Reference spec:** [2026-05-29-plannel-rules-rewrite-design.md](../specs/2026-05-29-plannel-rules-rewrite-design.md)

---

## File Plan

### Files to be replaced (7 rule files)

All under `/Users/hej/work/projects/t3-composer/.claude-plannel/rules/`:

| File | Responsibility |
|---|---|
| `41b-composer-java.md` | Spring entity/service/controller patterns in `t3series.saas.*` packages — import whitelist, no `@ExecPermission`, no wingui `BaseEntity`. Replaces wingui-copy. |
| `30-data-access.md` | axios HTTP conventions + Spring REST controller mapping + Redux Toolkit `createAsyncThunk` integration |
| `40-database-schema.md` | PlanNEL DB table prefix dictionary + multi-tenancy column convention + DDL upgrade folder location |
| `21-components.md` | AG-Grid + MUI + Redux Toolkit + i18next + react-pro-sidebar component inventory. Replaces wingui-copy (no RealGrid2, no Zustand, no transLangKey). |
| `20-screen-development.md` | PlanNEL screen scaffolding — file layout under `saas-web/src/pages/`, menu registration in `TabMenuList.js`, routing via `react-router-dom v6` |
| `41-composer-generation.md` | NEW_GENERAL Composer flow targeting PlanNEL — artifact file paths, MENU_CD shape, MENU_FILE_PATH convention. Replaces wingui-copy. |
| `99a-composer-anti-patterns.md` | Composer-specific anti-patterns for PlanNEL artifacts — wingui-pattern blockers (`@wingui/*` imports, `useViewStore`, `RealGrid2`, etc.) |

### Files referenced read-only

| Source | Purpose |
|---|---|
| `/Users/hej/work/projects/saas-plannel/saas-application/pom.xml` | Spring Boot version, dependencies |
| `/Users/hej/work/projects/saas-plannel/saas-application/src/main/java/t3series/saas/**` | Package structure, sample classes |
| `/Users/hej/work/projects/saas-plannel/saas-application/src/main/resources/*.yaml` | DataSource config, profiles |
| `/Users/hej/work/projects/saas-plannel/saas-web/package.json` | Frontend deps + scripts |
| `/Users/hej/work/projects/saas-plannel/saas-web/src/App.js` | Routing entry |
| `/Users/hej/work/projects/saas-plannel/saas-web/src/pages/**` | Representative pages — AG-Grid + Redux usage |
| `/Users/hej/work/projects/saas-plannel/saas-web/src/redux/**` | createSlice / createAsyncThunk patterns |
| `/Users/hej/work/projects/saas-plannel/saas-web/src/assets/data/l10n/translation.ko-kr.json` | i18n key shape |
| `/Users/hej/work/projects/saas-plannel/saas-web/src/pages/TabMenuList.js` | Menu registration |
| `/Users/hej/work/projects/t3-composer/.claude/rules/<rule>.md` | wingui rule used as structural template for the same `<rule>` |

---

## Task 1: Write `.claude-plannel/rules/41b-composer-java.md`

**Files:**
- Replace: `/Users/hej/work/projects/t3-composer/.claude-plannel/rules/41b-composer-java.md`
- Read-only: `/Users/hej/work/projects/saas-plannel/saas-application/pom.xml`, `/Users/hej/work/projects/saas-plannel/saas-application/src/main/java/t3series/saas/**`, `/Users/hej/work/projects/t3-composer/.claude/rules/41b-composer-java.md` (wingui template)

- [ ] **Step 1: Survey saas-plannel backend top-level structure**

Run these commands and read the output:

```bash
# Package tree (depth 3)
find /Users/hej/work/projects/saas-plannel/saas-application/src/main/java -maxdepth 4 -type d | sort

# Spring Boot version + key deps
grep -A1 'spring-boot.version\|<spring-boot\|<artifactId>spring-boot-' \
  /Users/hej/work/projects/saas-plannel/saas-application/pom.xml | head -40

# All Java entry points (Application classes)
grep -rln "@SpringBootApplication" /Users/hej/work/projects/saas-plannel/saas-application/src/main/java
```

Record:
- Spring Boot version (e.g., 3.x or 2.x)
- Java root package (e.g., `t3series.saas`)
- Sub-package layout (does it have `domain/<module>/<feature>/` like wingui, or different?)

- [ ] **Step 2: Pick one representative Entity + Service + Controller triple**

```bash
# Find all @Entity / @Service / @RestController classes
grep -rln "@Entity\|@Service\|@RestController" /Users/hej/work/projects/saas-plannel/saas-application/src/main/java | head -30
```

Pick a triple where the same feature has Entity + Service + Controller. Open all three files. Record:
- Their full package paths
- Import lists (especially: jakarta.* vs javax.*, JPA annotations source, Lombok usage, security annotations)
- Constructor injection style (`@RequiredArgsConstructor` or `@Autowired`)
- Whether `extends BaseEntity` is used (and which BaseEntity — saas-plannel has its own)
- HTTP method conventions (`@GetMapping` only? `@PostMapping` for everything? mixed?)
- RequestBody binding (`@RequestBody List<Map>` vs typed DTO vs multipart)

- [ ] **Step 3: Check ORM and SQL access patterns**

```bash
# JPA presence
grep -rln "@Entity\|JpaRepository\|JpaSpecificationExecutor" /Users/hej/work/projects/saas-plannel/saas-application/src/main/java | head -10

# MyBatis / iBatis presence
grep -rln "@Mapper\|@Select\|@Update\|SqlSessionTemplate" /Users/hej/work/projects/saas-plannel/saas-application/src/main/java | head -10

# JdbcTemplate usage
grep -rln "JdbcTemplate\|NamedParameterJdbcTemplate" /Users/hej/work/projects/saas-plannel/saas-application/src/main/java | head -10
```

Record dominant data access pattern (JPA / MyBatis / JdbcTemplate / mixed).

- [ ] **Step 4: Check DataSource and DB driver**

```bash
ls /Users/hej/work/projects/saas-plannel/saas-application/src/main/resources/*.yaml 2>/dev/null
ls /Users/hej/work/projects/saas-plannel/saas-application/src/main/resources/*.properties 2>/dev/null
grep -A3 "datasource\|spring\.datasource" \
  /Users/hej/work/projects/saas-plannel/saas-application/src/main/resources/*.yaml 2>/dev/null | head -30

# DB driver in pom
grep -B1 -A1 "mssql\|sqlserver\|postgresql\|mysql\|oracle\|mariadb" \
  /Users/hej/work/projects/saas-plannel/saas-application/pom.xml | head -20
```

Record: DB engine (MSSQL / PostgreSQL / etc.), driver coordinates.

- [ ] **Step 5: Read the wingui template for structural reference**

Read `/Users/hej/work/projects/t3-composer/.claude/rules/41b-composer-java.md` fully. Note its sections:
- §5.1 정책 차단 조건
- §5.2 모드별 DDL 정책
- §5.3 SP 정책
- §5.4 Java 4종 세트
- §5.5 import 화이트리스트 (Spring Boot 3.x)
- §5.6 Java 클래스 네이밍
- §5.7 코드 템플릿
- §5.8 자기 검증

Plan to **reuse the same section structure** but replace every wingui-specific element with the saas-plannel equivalent identified in Steps 1-4.

- [ ] **Step 6: Write the file**

Replace `/Users/hej/work/projects/t3-composer/.claude-plannel/rules/41b-composer-java.md` with PlanNEL-specific content following the wingui template structure. Target ~7KB.

Each section must include:
- §5.1 (정책 차단) — does PlanNEL Composer require Java artifacts? If yes, which are mandatory; if no, mark as optional. Document anti-pattern of mixing wingui-style 4-set.
- §5.5 (import whitelist) — actual PlanNEL imports from Step 2 + Step 3 (e.g., `import t3series.saas.dto.*;`, JPA imports from the actual artifact). Explicit ban on `com.zionex.t3series.web.*` imports (wingui contamination).
- §5.6 (네이밍) — derived from Step 2 packages. Class name vs file path vs MENU_FILE_PATH relationship if any.
- §5.7 (코드 템플릿) — real Entity/Service/Controller skeleton derived from the representative triple in Step 2. Use ACTUAL imports observed, not hypothetical.
- §5.8 (자기 검증) — checklist tailored to PlanNEL anti-patterns.

If a wingui-template section has no PlanNEL equivalent (e.g., wingui §5.3 SP 정책 but PlanNEL has no stored procedures), explicitly say "PlanNEL 은 SP 사용 안 함 — Java service 안에서 직접 처리" and skip that section.

The file MUST NOT contain:
- `@Qualifier("targetJdbcTemplate")` (wingui-specific Composer preview shim)
- `com.zionex.t3series.web.util.audit.BaseEntity` (wingui only)
- `com.zionex.t3series.web.util.data.ResponseMessage` (wingui only)
- `EXEC SP_UI_*` (wingui SP convention)
- Reference to `composer-jsx.sh` or other wingui hooks

- [ ] **Step 7: Sanity-check the file**

```bash
# File must be 5-10KB (target ~7KB)
wc -c /Users/hej/work/projects/t3-composer/.claude-plannel/rules/41b-composer-java.md

# Must NOT contain wingui-specific markers
grep -E "@wingui|wingui-core|zionex\.t3series\.web\.util\.audit|@Qualifier\(\"targetJdbcTemplate\"\)|SP_UI_" \
  /Users/hej/work/projects/t3-composer/.claude-plannel/rules/41b-composer-java.md && echo "❌ wingui contamination" || echo "✅ clean"

# Markdown structure check
head -1 /Users/hej/work/projects/t3-composer/.claude-plannel/rules/41b-composer-java.md
```

Expected: file size 5000-10000 bytes, "✅ clean" output, first line starts with `# 41b.` or similar header.

- [ ] **Step 8: Commit**

```bash
cd /Users/hej/work/projects/t3-composer
git add .claude-plannel/rules/41b-composer-java.md
git commit -m "$(cat <<'EOF'
docs(plannel): rewrite 41b-composer-java for saas-plannel Spring stack

Replaces wingui-copy content. Now documents:
- t3series.saas.* package convention (vs com.zionex.t3series.web.*)
- saas-plannel's actual Entity/Service/Controller pattern
- Import whitelist with explicit ban on wingui imports
- DB access pattern (JPA / MyBatis / JdbcTemplate per Steps 3-4)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Write `.claude-plannel/rules/30-data-access.md`

**Files:**
- Replace: `/Users/hej/work/projects/t3-composer/.claude-plannel/rules/30-data-access.md`
- Read-only: saas-plannel/saas-application Controller files, saas-plannel/saas-web/src axios usage, `/Users/hej/work/projects/t3-composer/.claude/rules/30-database-schema.md` (wingui equivalent — different file but similar purpose)

Note: wingui has `30-database-schema.md` (DB-centric). saas-plannel's `30-data-access.md` is HTTP-centric. Don't use the wingui-30 as a strict template — instead, derive structure from PlanNEL's actual data-access stack.

- [ ] **Step 1: Survey backend HTTP entry points**

```bash
# All @RequestMapping/@*Mapping locations
grep -rln "@RequestMapping\|@PostMapping\|@GetMapping" \
  /Users/hej/work/projects/saas-plannel/saas-application/src/main/java | head -20

# Sample one controller — show all mappings + auth annotations
find /Users/hej/work/projects/saas-plannel/saas-application/src/main/java -name "*Controller.java" | head -3 | while read f; do
  echo "=== $f ==="; grep -E "@.*Mapping|@PreAuthorize|@Secured" "$f" | head -10
done
```

Record:
- URL prefix conventions (e.g., `/api/v1/`, `/saas/`, etc.)
- Auth annotation presence (Spring Security `@PreAuthorize`, custom annotations)
- Response shape (raw object vs `ResponseEntity<>` vs custom wrapper)

- [ ] **Step 2: Survey frontend axios usage**

```bash
# Find axios import + base config
grep -rln "from 'axios'\|require('axios')" \
  /Users/hej/work/projects/saas-plannel/saas-web/src | head -10

# Look for wrapper module
find /Users/hej/work/projects/saas-plannel/saas-web/src -name "*api*.js" -o -name "*axios*.js" -o -name "*client*.js" | head -10

# Sample how a page makes a HTTP request
grep -rln "axios\.\(get\|post\|put\|delete\)" \
  /Users/hej/work/projects/saas-plannel/saas-web/src | head -5
```

Record:
- Wrapper module location (e.g., `src/api/index.js`)
- Base URL config (env var, hard-coded, redux store)
- Auth token handling (interceptor injecting JWT, etc.)
- Error handling pattern (axios interceptor, per-call try/catch, redux middleware)

- [ ] **Step 3: Survey Redux Toolkit async pattern**

```bash
# createAsyncThunk usage
grep -rln "createAsyncThunk\|createSlice" \
  /Users/hej/work/projects/saas-plannel/saas-web/src | head -10

# Sample one slice file — read it fully
ls /Users/hej/work/projects/saas-plannel/saas-web/src/redux/ 2>&1 | head -20
```

Pick one slice file. Record:
- Slice file location (e.g., `src/redux/slices/<feature>Slice.js`)
- `createAsyncThunk(typePrefix, asyncFn)` shape — does asyncFn call axios directly or use the API wrapper?
- Reducer pattern (`builder.addCase(thunk.fulfilled, ...)` vs short form)
- Where the slice is registered (root reducer / store config)

- [ ] **Step 4: Write the file**

Replace `/Users/hej/work/projects/t3-composer/.claude-plannel/rules/30-data-access.md` with content covering (target ~7KB):

1. **개요** — saas-plannel 의 HTTP 데이터 흐름: View → Redux Toolkit slice (createAsyncThunk) → axios wrapper → Spring Controller → Service → DB
2. **Backend HTTP 컨벤션** — URL prefix, auth annotation, response shape (from Step 1)
3. **Frontend axios 사용 표준** — wrapper module path, base URL config, interceptor (from Step 2). 예시 코드 블록은 실제 saas-plannel 패턴 1:1.
4. **Redux Toolkit createAsyncThunk 통합** — slice 파일 위치, asyncFn 시그니처, reducer 처리 표준 (from Step 3). 실제 패턴 코드 블록.
5. **Anti-patterns** — wingui 의 `zAxios.post('composer/foo', body, composerReq())` 같은 패턴 사용 금지, `multipart/form-data`+`'changes'` key 의 wingui REST 컨벤션 금지, 직접 fetch() 호출 금지 (Redux 경유 권장).
6. **체크리스트** — Java Controller 작성 시 / 프런트 axios 호출 추가 시.

- [ ] **Step 5: Sanity-check**

```bash
wc -c /Users/hej/work/projects/t3-composer/.claude-plannel/rules/30-data-access.md
grep -E "zAxios|composerReq\(\)|multipart/form-data.*changes|@wingui|wingui-core" \
  /Users/hej/work/projects/t3-composer/.claude-plannel/rules/30-data-access.md && echo "❌ wingui contamination" || echo "✅ clean"
head -1 /Users/hej/work/projects/t3-composer/.claude-plannel/rules/30-data-access.md
```

Expected: 5000-10000 bytes, "✅ clean", first line is the rule header.

- [ ] **Step 6: Commit**

```bash
cd /Users/hej/work/projects/t3-composer
git add .claude-plannel/rules/30-data-access.md
git commit -m "$(cat <<'EOF'
docs(plannel): rewrite 30-data-access for saas-plannel HTTP + Redux Toolkit

Documents PlanNEL's actual stack:
- axios wrapper (location and config per Steps 1-2)
- Redux Toolkit createAsyncThunk pattern with the slice file convention
- Spring Controller HTTP conventions (URL prefix, response shape, auth)
- Explicit anti-patterns blocking wingui zAxios / composerReq() / multipart-changes

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Write `.claude-plannel/rules/40-database-schema.md`

**Files:**
- Replace: `/Users/hej/work/projects/t3-composer/.claude-plannel/rules/40-database-schema.md`
- Read-only: saas-plannel DDL/SQL files, Entity classes, `application.yaml`

- [ ] **Step 1: Locate DDL / SQL files**

```bash
# Common DDL locations
find /Users/hej/work/projects/saas-plannel -name "*.sql" -not -path "*/node_modules/*" -not -path "*/target/*" 2>/dev/null | head -30

# Liquibase/Flyway
find /Users/hej/work/projects/saas-plannel -name "changelog*.yaml" -o -name "V*__*.sql" 2>/dev/null | head -10

# Entity files for table name introspection
grep -rln "@Table\|@Entity" /Users/hej/work/projects/saas-plannel/saas-application/src/main/java | head -20
```

Record:
- DDL folder location (if any)
- Migration framework (Liquibase / Flyway / manual / Hibernate ddl-auto)
- Sample 3-5 table names from `@Table(name=...)` annotations

- [ ] **Step 2: Identify table name prefix convention**

From the sampled table names in Step 1, derive the prefix dictionary. saas-plannel likely uses prefixes (e.g., `T_*`, `TB_*`, `SAAS_*`, plain names).

```bash
# Pull all @Table(name=...) values across Java
grep -rhE '@Table\s*\(\s*name\s*=\s*"[^"]+"' \
  /Users/hej/work/projects/saas-plannel/saas-application/src/main/java | \
  sed -E 's/.*name\s*=\s*"([^"]+)".*/\1/' | sort -u | head -40
```

Group by prefix. Record prefix → domain mapping if discernible.

- [ ] **Step 3: Check for multi-tenancy columns**

```bash
# Common multi-tenancy column names
grep -rhE "@Column\s*\(\s*name\s*=\s*\"(TENANT_ID|TENANT_CD|COMPANY_ID|COMPANY_CD|ORG_ID|ORG_CD|CORP_CD|CUSTOMER_ID)\"" \
  /Users/hej/work/projects/saas-plannel/saas-application/src/main/java | head -20
```

Record which multi-tenancy column convention saas-plannel uses (if any). PlanNEL is a SaaS, so almost certainly has one.

- [ ] **Step 4: Check audit columns**

```bash
grep -rhE "@Column\s*\(\s*name\s*=\s*\"(CREATE_BY|CREATED_BY|REG_USER|REG_DT|UPDATE_BY|UPDATED_BY|MODIFY_BY|MODIFY_DTTM|MODIFIED_DT)\"" \
  /Users/hej/work/projects/saas-plannel/saas-application/src/main/java | head -15
```

Record the audit column naming (wingui uses `CREATE_BY`/`MODIFY_BY`/etc.; PlanNEL might use `REG_USER`/`UPD_USER` or different).

- [ ] **Step 5: Write the file**

Replace `/Users/hej/work/projects/t3-composer/.claude-plannel/rules/40-database-schema.md` (target ~6KB):

1. **개요** — saas-plannel 의 DB 엔진(Step 1) · 마이그레이션 도구 · DDL 폴더 위치
2. **테이블 접두어 사전** — Step 2 의 prefix 분류 표
3. **Multi-tenancy 컬럼 규약** — Step 3 의 컬럼명 + 모든 운영 테이블에 필수인지 여부
4. **Audit 컬럼 규약** — Step 4 의 컬럼명 (정확한 컬럼명 명시)
5. **신규 테이블 작성 절차** — DDL 위치 · 네이밍 · 멀티테넌시 / audit 컬럼 의무 사항
6. **자주 혼동되는 컬럼 함정 표** — wingui 의 `MODIFY_BY` 가 PlanNEL 에서 다른 이름이면 명시. 단, 안티 패턴 표에서 wingui 가 아닌 PlanNEL 의 실제 함정 패턴만 (예: tenant_cd 누락 → 다른 회사 데이터 노출 등).
7. **SQL 작성 체크리스트**

- [ ] **Step 6: Sanity-check**

```bash
wc -c /Users/hej/work/projects/t3-composer/.claude-plannel/rules/40-database-schema.md
grep -E "TB_AD_MENU|TB_AD_LANG_PACK|TB_CM_|TB_DP_|TB_MP_|TB_FP_|MODIFY_BY|MODIFY_DTTM|SP_UI_|TB_UT_USER_INFO" \
  /Users/hej/work/projects/t3-composer/.claude-plannel/rules/40-database-schema.md && \
  echo "⚠️ check whether these wingui names actually apply to PlanNEL" || echo "✅ no obvious wingui table names"
head -1 /Users/hej/work/projects/t3-composer/.claude-plannel/rules/40-database-schema.md
```

Expected: 4000-8000 bytes. The grep is a warning, not a blocker — if PlanNEL legitimately uses these names, leave them. If only wingui carryover, replace with PlanNEL equivalents.

- [ ] **Step 7: Commit**

```bash
cd /Users/hej/work/projects/t3-composer
git add .claude-plannel/rules/40-database-schema.md
git commit -m "$(cat <<'EOF'
docs(plannel): rewrite 40-database-schema for saas-plannel DB conventions

Documents:
- DB engine + migration tool (per Step 1)
- Table prefix dictionary (derived from actual @Table names per Step 2)
- Multi-tenancy column convention (per Step 3 — SaaS-critical)
- Audit column naming (per Step 4 — diverges from wingui MODIFY_*)
- DDL location and new-table procedure

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Phase 1 re-import + user verification

**Files:**
- DB: `dbo.tb_cmp_target_rule WHERE target_cd='PLANNEL' AND rule_code IN ('41b-composer-java', '30-data-access', '40-database-schema')`
- API: `POST http://localhost:8090/composer/targets/PLANNEL/import-claude`

- [ ] **Step 1: Verify containers up**

```bash
docker compose ps --format "table {{.Name}}\t{{.Status}}" | head -6
```

Expected: composer-backend / composer-db / composer-frontend all "Up". If not, stop and report.

- [ ] **Step 2: Snapshot current PLANNEL rule versions (before re-import)**

```bash
docker compose exec -T composer-db psql -U composer -d t3composer -c "
SELECT rule_code, rule_version, LENGTH(content) AS len, MD5(content) AS md5
FROM dbo.tb_cmp_target_rule
WHERE target_cd='PLANNEL'
  AND rule_code IN ('41b-composer-java', '30-data-access', '40-database-schema')
ORDER BY rule_code;
"
```

Record output. Three rows expected.

- [ ] **Step 3: Trigger re-import**

```bash
curl -s -X POST http://localhost:8090/composer/targets/PLANNEL/import-claude \
  -H 'Content-Type: application/json' \
  -d '{"claudeRoot":"/workspace/plannel-claude"}' | python3 -m json.tool
```

Expected JSON keys: `targetCd: "PLANNEL"`, `ruleImported`/`ruleUpdated` ≥ 3, `totalRuleRows: 13` (existing rules preserved). If `ruleSkipped` is high, that's fine for files we didn't change.

- [ ] **Step 4: Verify the 3 Phase-1 rules have new versions / content**

```bash
docker compose exec -T composer-db psql -U composer -d t3composer -c "
SELECT rule_code, rule_version, LENGTH(content) AS len, MD5(content) AS md5
FROM dbo.tb_cmp_target_rule
WHERE target_cd='PLANNEL'
  AND rule_code IN ('41b-composer-java', '30-data-access', '40-database-schema')
ORDER BY rule_code;
"
```

Compare to Step 2 output. The 3 rules should have either:
- Same version + same md5 (no change picked up — investigate why)
- New version OR different md5 (changes picked up — proceed)

If versions/md5 unchanged, check: did the file save in Step 6 of Tasks 1-3 actually write to `.claude-plannel/rules/`? Re-run import after fixing.

- [ ] **Step 5: User verification — create a Composer session**

Hand off to the user with this exact script (paste into the conversation as the "Report"):

> Phase 1 (Backend) rule import complete. Please verify in the browser:
>
> 1. Open http://localhost:5173 → Composer → 새 세션
> 2. Mode = NEW_GENERAL or NEW_NL
> 3. **Target System = PLANNEL** (critical)
> 4. NL: `고객 마스터 CRUD 화면을 만들어줘 — 고객 ID, 고객명, 사업자번호, 연락처, 주소`
> 5. 생성된 산출물 확인 — Java Entity / Service / Controller / 가능하면 SQL DDL
>
> Check these Pass/Fail signals on the generated artifacts:
> - [ ] Java `package` declaration starts with `t3series.saas.*` (NOT `com.zionex.t3series.web.*`)
> - [ ] Java imports contain NO `com.zionex.t3series.web.*` references
> - [ ] No `@ExecPermission`, no `@Qualifier("targetJdbcTemplate")`, no `BaseEntity` from `web.util.audit`
> - [ ] No `ResponseMessage.ok()` / `ofSuccess()` calls (wingui-specific)
> - [ ] Entity (if any) uses the audit column names documented in 40-database-schema (verify naming matches Task 3 Step 4)
> - [ ] SQL DDL (if any) follows the table prefix from 40-database-schema (Task 3 Step 2)
>
> If all green → reply "Phase 1 OK" to proceed to Phase 2.
> If any red flag → reply with which rule needs fix and we iterate.

- [ ] **Step 6: Commit a phase-checkpoint marker (empty)**

```bash
cd /Users/hej/work/projects/t3-composer
git commit --allow-empty -m "$(cat <<'EOF'
chore(plannel): Phase 1 (backend rules) rewrite complete

Re-imported 41b-composer-java, 30-data-access, 40-database-schema to
tb_cmp_target_rule WHERE target_cd='PLANNEL' via /composer/targets/PLANNEL/import-claude.
User verification pending in browser per task 4 step 5 script.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Write `.claude-plannel/rules/21-components.md`

**Files:**
- Replace: `/Users/hej/work/projects/t3-composer/.claude-plannel/rules/21-components.md`
- Read-only: saas-plannel/saas-web/src/pages/**, src/components/**, package.json, wingui template `/Users/hej/work/projects/t3-composer/.claude/rules/21-components.md`

- [ ] **Step 1: Inventory saas-plannel frontend components**

```bash
# Top-level src tree
ls /Users/hej/work/projects/saas-plannel/saas-web/src
find /Users/hej/work/projects/saas-plannel/saas-web/src/components -maxdepth 2 -type d 2>/dev/null | head -20

# All page files
ls /Users/hej/work/projects/saas-plannel/saas-web/src/pages | head -30

# Key dependencies (already collected once but record again for the rule)
node -e "const p=require('/Users/hej/work/projects/saas-plannel/saas-web/package.json'); for(const k of Object.keys(p.dependencies||{}).sort()) console.log(k, p.dependencies[k]);" | head -40
```

Record:
- Top-level src folders (components, pages, redux, hooks, utils, etc.)
- Top 5-10 most-imported components from `src/components/`
- Library versions of: `@mui/material`, `@ag-grid-community/react`, `@reduxjs/toolkit`, `react-router-dom`, `i18next`, `react-i18next`, `react-pro-sidebar`, `axios`

- [ ] **Step 2: Pick one representative page that uses AG-Grid + Redux + i18next**

```bash
# Pages importing AG-Grid (these will be the richest examples)
grep -rln "ag-grid-community\|AgGridReact" /Users/hej/work/projects/saas-plannel/saas-web/src/pages | head -5
```

Pick one. Read the entire file. Record:
- Full set of imports (component library, redux hooks, i18n hooks, utility helpers)
- How AG-Grid is configured (`columnDefs`, `defaultColDef`, `rowData`, `onGridReady`, `cellRenderer` if any)
- How Redux state flows in (`useSelector` / `useDispatch` / which slices)
- How i18n flows in (`useTranslation()` / `t('key.path')`)
- Layout wrapper (does it use react-pro-sidebar? a layout component?)

- [ ] **Step 3: Find a Redux slice file used by that page**

```bash
# Find the slice referenced by the page from Step 2 — usually src/redux/slices/<feature>Slice.js
ls /Users/hej/work/projects/saas-plannel/saas-web/src/redux/ 2>&1
# If subdirs:
find /Users/hej/work/projects/saas-plannel/saas-web/src/redux -name "*.js" | head -10
```

Pick one slice. Read it. Record:
- `createSlice` shape — `name`, `initialState`, `reducers`, `extraReducers`
- `createAsyncThunk` shape — typePrefix naming, payloadCreator return value
- Selectors used by page in Step 2

- [ ] **Step 4: Read i18n key file**

```bash
head -50 /Users/hej/work/projects/saas-plannel/saas-web/src/assets/data/l10n/translation.ko-kr.json
```

Record: top-level key shape (flat vs nested), example key paths (`common.button.save` vs `COMMON_BUTTON_SAVE` etc.)

- [ ] **Step 5: Read wingui template for structural reference**

Read `/Users/hej/work/projects/t3-composer/.claude/rules/21-components.md` fully. Note its sections:
- 1. 최상위 레이아웃
- 2. 레이아웃 분할
- 3. 입력 필드 (InputField · SCM 도메인 특화)
- 4. 그리드 (RealGrid2)
- 5. 차트
- 6. 다이어그램 · 특수
- 7. Zustand 스토어
- 8. 공통 팝업
- 9. 공용 유틸 · 서비스
- 10. 네이밍 규약
- 11. Anti-patterns

Plan to reuse this **outline** but every section content becomes PlanNEL-specific.

- [ ] **Step 6: Write the file**

Replace `/Users/hej/work/projects/t3-composer/.claude-plannel/rules/21-components.md` (target ~10KB):

1. **최상위 레이아웃** — saas-plannel's app shell from `App.js` — react-pro-sidebar + MUI ThemeProvider + Redux Provider + i18n Provider wrapper structure (actual import + JSX from Step 2).
2. **라우팅** — react-router-dom v6 `<Routes>` / `<Route>` pattern as used in saas-plannel (from `App.js` reading in Step 2 prep).
3. **그리드 — AG-Grid** — `AgGridReact` API, `columnDefs`/`defaultColDef`/`rowData` props, real example from Step 2. **★ Critical section — PlanNEL 화면 생성 품질 직격.**
4. **입력 필드 — MUI** — `TextField`/`Select`/`DatePicker` (`react-datepicker` per package.json) usage in PlanNEL. Real example.
5. **국제화 — react-i18next** — `useTranslation()` import path, `t('key.path')` shape from Step 4 JSON shape. Critical anti-pattern: NOT `transLangKey` (wingui-specific).
6. **Redux Toolkit** — `useSelector`/`useDispatch` standard, slice file location convention (from Step 3), `createAsyncThunk` integration. Critical anti-pattern: NOT `useViewStore`/`useContentStore` (wingui Zustand).
7. **차트** — `ag-charts-react` usage if found, real example. (If not used in the picked page, document availability via package.json + minimal API skeleton.)
8. **사이드바·메뉴** — react-pro-sidebar conventions (from package.json + App.js).
9. **공용 유틸·서비스** — axios wrapper from Task 2 Step 2.
10. **네이밍 규약** — file/folder/component naming as observed in saas-plannel pages.
11. **Anti-patterns** — Table format covering wingui patterns to block:
    - `import { BaseGrid } from '@wingui/common/imports'` → block, use `AgGridReact`
    - `useViewStore` / `useContentStore` / `setViewInfo` → block, use Redux Toolkit `useSelector`/`useDispatch`
    - `transLangKey('KEY')` → block, use `t('key.path')` from `useTranslation()`
    - `zAxios.post(...)` → block, use axios wrapper from §9
    - `<SearchArea>` / `<ContentInner>` / `<InputField>` from wingui → block, use MUI direct
    - `multipart/form-data` + `'changes'` key → block, use JSON body

The file MUST NOT contain:
- `@wingui/common/imports`
- `@zionex/wingui-core`
- `useViewStore` / `useContentStore` / `setViewInfo` / `transLangKey` (except in anti-pattern table as `❌`)
- `RealGrid` / `BaseGrid` (wingui)
- `applyGridCascade` / `useFieldCascade` (wingui)

- [ ] **Step 7: Sanity-check**

```bash
wc -c /Users/hej/work/projects/t3-composer/.claude-plannel/rules/21-components.md
# Look for wingui patterns OUTSIDE anti-pattern table — heuristic: count occurrences, must be small (only in ❌ markers)
total_wingui=$(grep -cE "useViewStore|transLangKey|BaseGrid|@wingui|wingui-core" \
  /Users/hej/work/projects/t3-composer/.claude-plannel/rules/21-components.md)
anti_marker=$(grep -cE "❌.*useViewStore|❌.*transLangKey|❌.*BaseGrid|❌.*wingui" \
  /Users/hej/work/projects/t3-composer/.claude-plannel/rules/21-components.md)
echo "wingui mentions: $total_wingui  · anti-pattern markers: $anti_marker"
# Reasonable: total_wingui ≈ anti_marker (wingui terms only appear in anti-pattern table)
head -1 /Users/hej/work/projects/t3-composer/.claude-plannel/rules/21-components.md
```

Expected: 8000-12000 bytes; wingui mentions are confined to anti-pattern context.

- [ ] **Step 8: Commit**

```bash
cd /Users/hej/work/projects/t3-composer
git add .claude-plannel/rules/21-components.md
git commit -m "$(cat <<'EOF'
docs(plannel): rewrite 21-components for AG-Grid / MUI / Redux Toolkit / i18next

Replaces wingui-copy. Documents PlanNEL's actual stack:
- AG-Grid via @ag-grid-community/react (vs RealGrid2)
- MUI components direct (vs wingui SearchArea/ContentInner wrappers)
- Redux Toolkit useSelector/useDispatch (vs Zustand useViewStore)
- react-i18next useTranslation() (vs transLangKey)
- react-pro-sidebar shell
- Anti-patterns explicitly block wingui imports/store/i18n shims

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Write `.claude-plannel/rules/20-screen-development.md`

**Files:**
- Replace: `/Users/hej/work/projects/t3-composer/.claude-plannel/rules/20-screen-development.md`
- Read-only: saas-plannel/saas-web/src/App.js, src/pages/TabMenuList.js, src/redux/store config, wingui `.claude/rules/20-screen-development.md`

- [ ] **Step 1: Read App.js for routing**

```bash
cat /Users/hej/work/projects/saas-plannel/saas-web/src/App.js | head -80
```

Record:
- `react-router-dom v6` `<Routes>` structure
- Route → component file mapping pattern (e.g., lazy import vs direct)
- Auth wrapper / layout wrapper
- Redux Provider position

- [ ] **Step 2: Read TabMenuList.js**

```bash
cat /Users/hej/work/projects/saas-plannel/saas-web/src/pages/TabMenuList.js
```

Record:
- Data shape (array of menu objects? grouped? lazy import handles?)
- Field names (label / path / icon / group / etc.)
- How a new menu entry is added (push to array, register in router, both?)
- Relationship to backend (is the menu list also fetched from API, or purely static?)

- [ ] **Step 3: Identify the "create a new page" file layout**

```bash
# Look at a couple of pages — what do they share structurally?
ls /Users/hej/work/projects/saas-plannel/saas-web/src/pages | head -10
# Pick 2-3 page files of different sizes and read their imports
```

Record the standard page skeleton:
- File path convention (`src/pages/<FeatureName>.js` flat? `src/pages/<group>/<Feature>.js` nested?)
- Default export shape (function component, named, default)
- Standard wrapper hooks (`useTranslation`, `useDispatch`, `useSelector` ordering)

- [ ] **Step 4: Read wingui template for structural reference**

Read `/Users/hej/work/projects/t3-composer/.claude/rules/20-screen-development.md`. Note sections:
- 1. 결정 플로우
- 2. 파일 배치 규칙
- 3. 필수 구조 (모든 화면 공통)
- 4. 서버 통신
- 5. 라우팅 · 메뉴 등록
- 6. 백엔드 4종 세트
- 7. SP_UI_*.sql DDL
- 8. 온톨로지 등록
- 9. 패턴 카탈로그
- 10. 체크리스트
- 11. Anti-pattern 카탈로그

Use this as outline. Skip §7 (SP_UI) and §8 (온톨로지) — PlanNEL doesn't have these unless source analysis says otherwise. Skip §9 (패턴) — defer to Composer mockup patterns.

- [ ] **Step 5: Write the file**

Replace `/Users/hej/work/projects/t3-composer/.claude-plannel/rules/20-screen-development.md` (target ~6KB):

1. **결정 플로우** — saas-plannel 의 화면 추가 시 절차 (요구사항 → 파일 위치 → 라우팅 → 메뉴 등록).
2. **파일 배치 규칙** — Step 3 의 page 파일 위치 컨벤션, 슬라이스 파일 위치 (Task 5 Step 3 결과 재사용 OK).
3. **라우팅 등록** — App.js 의 `<Routes>` 에 추가 (Step 1 의 실제 패턴).
4. **메뉴 등록** — TabMenuList.js 에 항목 추가 (Step 2 의 실제 데이터 shape).
5. **i18n 키 등록** — 5개 언어 JSON 모두에 키 추가 (en-us, ja-jp, ko-kr, vi-vn, zh-cn).
6. **필수 표준 페이지 구조** — Step 3 의 standard skeleton 을 그대로 코드 블록으로.
7. **체크리스트** — 신규 화면 작성 직전 체크 (파일 위치 · 라우팅 · 메뉴 · i18n · Redux 등록).
8. **Anti-patterns** —
   - 파일 위치 컨벤션 위반 (실제 saas-plannel 의 위치와 다름)
   - 라우팅 추가했는데 메뉴 등록 누락
   - i18n 키를 일부 언어에만 등록
   - `transLangKey` 사용 (wingui 잔재)
   - `view/<module>/<lowercase>/<PascalName>.jsx` 시도 (wingui-specific)

- [ ] **Step 6: Sanity-check**

```bash
wc -c /Users/hej/work/projects/t3-composer/.claude-plannel/rules/20-screen-development.md
grep -E "TB_AD_MENU|TB_AD_LANG_PACK|menuFilePath|contentStore" \
  /Users/hej/work/projects/t3-composer/.claude-plannel/rules/20-screen-development.md && \
  echo "❌ wingui menu/DB references — should be TabMenuList.js / translation.json" || \
  echo "✅ no wingui menu/i18n shim references"
head -1 /Users/hej/work/projects/t3-composer/.claude-plannel/rules/20-screen-development.md
```

Expected: 5000-8000 bytes, "✅" output.

- [ ] **Step 7: Commit**

```bash
cd /Users/hej/work/projects/t3-composer
git add .claude-plannel/rules/20-screen-development.md
git commit -m "$(cat <<'EOF'
docs(plannel): rewrite 20-screen-development for saas-plannel routing/menu

Documents:
- src/pages/ file layout convention
- react-router-dom v6 routing in App.js
- TabMenuList.js menu registration
- 5-language i18n key registration (translation.{ko-kr,en-us,ja-jp,vi-vn,zh-cn}.json)
- Standard page skeleton with useTranslation + Redux hooks
- Anti-patterns blocking wingui TB_AD_MENU / contentStore / menuFilePath references

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Write `.claude-plannel/rules/41-composer-generation.md`

**Files:**
- Replace: `/Users/hej/work/projects/t3-composer/.claude-plannel/rules/41-composer-generation.md`
- Read-only: All Task 1-3, 5, 6 outputs (already in `.claude-plannel/rules/`); wingui template `/Users/hej/work/projects/t3-composer/.claude/rules/41-composer-generation.md`

- [ ] **Step 1: Read all already-rewritten PlanNEL rules**

```bash
ls -la /Users/hej/work/projects/t3-composer/.claude-plannel/rules/{21-components,20-screen-development,30-data-access,40-database-schema,41b-composer-java}.md
# Read each — these define the underlying conventions this rule must reference consistently
```

Record any cross-rule signatures introduced (axios wrapper name, redux slice location pattern, AG-Grid column convention, package paths).

- [ ] **Step 2: Read wingui template for structural reference**

Read `/Users/hej/work/projects/t3-composer/.claude/rules/41-composer-generation.md`. Note key sections:
- §0 유사 화면 참조
- §1 런타임 구조
- §2 MENU_CD / MENU_FILE_PATH / MENU_PATH
- §3 부모 메뉴 코드
- §10 MENU_SQL
- §11 그리드 정렬 / 편집기 / 날짜 포맷
- §12 산출물 체크리스트
- §13 예외 — 엔진 경유 화면
- §14 Anti-patterns

PlanNEL likely has no equivalent for §3 (parent menu code via DB), §10 (TB_AD_MENU INSERT SQL), §13 (engine routing). These should be REMOVED or replaced with PlanNEL equivalents (TabMenuList.js entry vs DB INSERT).

- [ ] **Step 3: Write the file**

Replace `/Users/hej/work/projects/t3-composer/.claude-plannel/rules/41-composer-generation.md` (target ~8KB):

1. **§0 유사 화면 참조** — Composer NEW_GENERAL 으로 PlanNEL 화면 생성 시, 가장 비슷한 기존 saas-plannel 페이지 파일을 1-3개 Read 한 뒤 그 import / hook 사용 패턴을 그대로 복제. 출력 맨 앞 4줄 선언 (`참조 원본:` · `원본 import 리스트` · `치환 매핑` · `원본에 없는 신규 추가`).
2. **§1 런타임 구조** — PlanNEL 단독 구동 (별도 엔진 서버 의존 없음). Redux Toolkit 기반 state · axios 기반 HTTP. SP 미사용 · Java service 직접 비즈니스 로직.
3. **§2 메뉴 ID / 파일 경로 컨벤션** — PlanNEL 의 MENU 식별 방식 (Task 6 Step 2 의 TabMenuList shape 기반). 파일 경로 (`src/pages/<Group>/<Feature>.js`).
4. **§3 산출물 세트** — JSX 페이지 · Redux slice 파일 · Java Controller · Java Service · Entity (선택적). DDL/SQL 은 PlanNEL 의 마이그레이션 컨벤션 (Task 3 Step 1 결과) 에 맞춰.
5. **§4 i18n 키 등록 산출물** — 5개 언어 translation.*.json 동시 갱신 필요.
6. **§5 산출물 체크리스트** — 작성·메뉴등록·i18n등록·라우팅 추가·redux 등록.
7. **§6 Anti-patterns** —
   - wingui MENU_CD (`UI_<DOMAIN>_<NAME>`) 사용 → PlanNEL menu shape (Task 6 Step 2) 사용
   - `MENU_FILE_PATH = "/<module>[/<category>]/<PascalName>"` 등장 → PlanNEL 의 `src/pages/...` 경로 사용
   - `TB_AD_MENU INSERT` SQL 산출 → TabMenuList.js 항목 추가 + i18n 키 등록
   - SP_UI_*.sql 산출 → PlanNEL 미사용 (Java service 안에서 처리)
   - wingui Composer hook (`composer-jsx.sh` 등) 참조 → 해당 없음

The file MUST NOT contain:
- `UI_<DOMAIN>_<NAME>` (wingui MENU_CD shape — except as ❌ anti-pattern)
- `MENU_FILE_PATH` (wingui — except as ❌)
- `TB_AD_MENU` (wingui DB table — except as ❌)
- `SP_UI_*` (wingui SP — except as ❌)
- `lang-packs/{lang}/reload` (wingui language reload — except as ❌)

- [ ] **Step 4: Sanity-check**

```bash
wc -c /Users/hej/work/projects/t3-composer/.claude-plannel/rules/41-composer-generation.md
total_wingui=$(grep -cE "TB_AD_MENU|SP_UI_|MENU_FILE_PATH|MENU_CD" \
  /Users/hej/work/projects/t3-composer/.claude-plannel/rules/41-composer-generation.md)
anti_marker=$(grep -cE "❌.*TB_AD_MENU|❌.*SP_UI_|❌.*MENU_FILE_PATH|❌.*MENU_CD" \
  /Users/hej/work/projects/t3-composer/.claude-plannel/rules/41-composer-generation.md)
echo "wingui mentions: $total_wingui · anti-pattern markers: $anti_marker"
head -1 /Users/hej/work/projects/t3-composer/.claude-plannel/rules/41-composer-generation.md
```

Expected: 6000-10000 bytes; wingui mentions confined to anti-pattern markers.

- [ ] **Step 5: Commit**

```bash
cd /Users/hej/work/projects/t3-composer
git add .claude-plannel/rules/41-composer-generation.md
git commit -m "$(cat <<'EOF'
docs(plannel): rewrite 41-composer-generation for saas-plannel artifact layout

PlanNEL Composer NEW_GENERAL flow now generates:
- src/pages/<Group>/<Feature>.js JSX with AG-Grid + MUI + Redux Toolkit hooks
- src/redux/slices/<feature>Slice.js with createAsyncThunk
- t3series.saas.* Spring Java (Controller + Service + Entity)
- TabMenuList.js entry + 5-language translation.json updates

No wingui MENU_CD / MENU_FILE_PATH / TB_AD_MENU / SP_UI_*.sql / lang-pack
shapes are generated. Anti-pattern section blocks each explicitly.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Write `.claude-plannel/rules/99a-composer-anti-patterns.md`

**Files:**
- Replace: `/Users/hej/work/projects/t3-composer/.claude-plannel/rules/99a-composer-anti-patterns.md`
- Read-only: All sister rules just written (41b/30/40/21/20/41), wingui `/Users/hej/work/projects/t3-composer/.claude/rules/99a-composer-anti-patterns.md`

This rule is the LLM's last line of defense — it lists Composer-output anti-patterns specifically for PlanNEL targets. Should reinforce the anti-pattern callouts in the rules already written.

- [ ] **Step 1: Inventory anti-patterns from sister rules**

```bash
# Pull all ❌ patterns from the already-rewritten rules
grep -hE "❌|Anti-pattern|anti-pattern" /Users/hej/work/projects/t3-composer/.claude-plannel/rules/{21-components,20-screen-development,30-data-access,40-database-schema,41-composer-generation,41b-composer-java}.md | head -50
```

Record the distinct wingui-pattern blockers across these files. Each row in this rule should consolidate.

- [ ] **Step 2: Read wingui template for structural reference**

Read `/Users/hej/work/projects/t3-composer/.claude/rules/99a-composer-anti-patterns.md`. Note categories (A. 참조방식 / B. MENU_CD / C. JSX 표면 API / D. 서버 통신 / E. Master/공통코드/Cascade / F. 9단계 Wizard / G. 파일경로 환각 / ...).

Adopt the same category framework but every concrete pattern row gets PlanNEL semantics. Categories irrelevant to PlanNEL (e.g., 9단계 Wizard with TB_AD_MENU) get dropped.

- [ ] **Step 3: Write the file**

Replace `/Users/hej/work/projects/t3-composer/.claude-plannel/rules/99a-composer-anti-patterns.md` (target ~6KB):

Categories to include (only those relevant to PlanNEL Composer outputs):

**A. 참조 방식** — 산출물 작성 시 saas-plannel 의 기존 페이지 / slice / Controller 1개 이상 Read 우선. 자유 창작 금지.

**B. 페이지 / 메뉴 / 라우팅**
- `import` 가 `@wingui/*` / `@zionex/wingui-core` → block
- `view/<module>/<lowercase>/<File>.jsx` 경로 → block, PlanNEL `src/pages/...`
- `TB_AD_MENU` SQL INSERT → block, TabMenuList.js 항목 + i18n JSON 5개 동시 갱신
- `transLangKey('KEY')` → block, `useTranslation()` + `t('key.path')`

**C. JSX 표면 API**
- `<BaseGrid>` / `<SearchArea>` / `<InputField>` / `<ContentInner>` → block, MUI 직접 + AgGridReact
- `useViewStore` / `useContentStore` / `setViewInfo` → block, Redux Toolkit `useSelector`/`useDispatch`
- `applyGridCascade` / `useFieldCascade` → block, AG-Grid `valueGetter` + Redux state-driven
- `gridItems = [...]` 컴포넌트 안 선언 → 산출물에 등장하면 안 됨 (wingui-specific 컴포넌트 호출)

**D. 서버 통신**
- `zAxios.post(url, body, composerReq())` → block, PlanNEL axios wrapper (Task 2)
- `multipart/form-data` + `'changes'` key body → block, JSON body
- `callService(...)` → block (엔진 라우팅 자체가 PlanNEL 에 없음)

**E. Java 백엔드**
- `package com.zionex.t3series.web.*` → block, `package t3series.saas.*`
- `import com.zionex.t3series.web.util.audit.BaseEntity` → block
- `import com.zionex.t3series.web.util.data.ResponseMessage` → block
- `@Qualifier("targetJdbcTemplate")` → block (wingui Composer preview shim)
- `@RequestMapping("/util/<feature>")` → block (wingui URL prefix), PlanNEL convention

**F. SQL / DB**
- `SP_UI_<DOMAIN>_<NO>_<ACTION>` SP 작성 → block (PlanNEL 미사용)
- `MODIFY_BY` / `MODIFY_DTTM` audit 컬럼 → block (PlanNEL audit 컬럼명 — Task 3 Step 4 결과)
- `CREATE TABLE TB_<wingui-domain>_*` → block, PlanNEL prefix (Task 3 Step 2 결과)

각 row 는 ❌ (wingui 패턴) · ✅ (PlanNEL 대체) · 검증 ([H]ook / [L]LM) 3개 컬럼.

- [ ] **Step 4: Sanity-check**

```bash
wc -c /Users/hej/work/projects/t3-composer/.claude-plannel/rules/99a-composer-anti-patterns.md
# Anti-pattern file IS expected to mention wingui terms — every row references them.
# Sanity check: there should be NO instructional/positive wingui content (only ❌ markers)
grep -E "^[^❌|]*(useViewStore|transLangKey|BaseGrid|@wingui|zAxios)" \
  /Users/hej/work/projects/t3-composer/.claude-plannel/rules/99a-composer-anti-patterns.md | \
  head -5 && echo "⚠️ wingui term outside ❌ marker — review manually" || \
  echo "✅ wingui terms only in ❌ context"
head -1 /Users/hej/work/projects/t3-composer/.claude-plannel/rules/99a-composer-anti-patterns.md
```

Expected: 5000-8000 bytes, "✅" or manageable warnings.

- [ ] **Step 5: Commit**

```bash
cd /Users/hej/work/projects/t3-composer
git add .claude-plannel/rules/99a-composer-anti-patterns.md
git commit -m "$(cat <<'EOF'
docs(plannel): rewrite 99a-composer-anti-patterns to block wingui contamination

Categorized blocker list for PlanNEL Composer outputs:
- A. 참조 방식 (실제 saas-plannel 페이지를 Read 후 복제)
- B. 페이지/메뉴/라우팅 (TabMenuList + react-router-dom v6 + i18next)
- C. JSX 표면 API (MUI + AgGridReact + Redux Toolkit, NOT wingui shims)
- D. 서버 통신 (axios wrapper, NOT zAxios/composerReq/multipart-changes)
- E. Java 백엔드 (t3series.saas.*, NOT com.zionex.t3series.web.*)
- F. SQL/DB (PlanNEL prefix + audit, NOT TB_AD_MENU / MODIFY_BY / SP_UI_)

Each row: ❌ wingui pattern · ✅ PlanNEL replacement · 검증 column.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Phase 2 re-import + user verification

**Files:**
- DB: `dbo.tb_cmp_target_rule WHERE target_cd='PLANNEL' AND rule_code IN ('21-components','20-screen-development','41-composer-generation','99a-composer-anti-patterns')`
- API: `POST http://localhost:8090/composer/targets/PLANNEL/import-claude`

- [ ] **Step 1: Snapshot Phase-2 rule versions**

```bash
docker compose exec -T composer-db psql -U composer -d t3composer -c "
SELECT rule_code, rule_version, LENGTH(content) AS len, MD5(content) AS md5
FROM dbo.tb_cmp_target_rule
WHERE target_cd='PLANNEL'
  AND rule_code IN ('21-components','20-screen-development','41-composer-generation','99a-composer-anti-patterns')
ORDER BY rule_code;
"
```

Record output. Four rows expected.

- [ ] **Step 2: Trigger re-import**

```bash
curl -s -X POST http://localhost:8090/composer/targets/PLANNEL/import-claude \
  -H 'Content-Type: application/json' \
  -d '{"claudeRoot":"/workspace/plannel-claude"}' | python3 -m json.tool
```

Expected: `targetCd: "PLANNEL"`, `ruleImported`/`ruleUpdated` ≥ 4, `totalRuleRows: 13`.

- [ ] **Step 3: Verify version/md5 bumped**

```bash
docker compose exec -T composer-db psql -U composer -d t3composer -c "
SELECT rule_code, rule_version, LENGTH(content) AS len, MD5(content) AS md5
FROM dbo.tb_cmp_target_rule
WHERE target_cd='PLANNEL'
  AND rule_code IN ('21-components','20-screen-development','41-composer-generation','99a-composer-anti-patterns')
ORDER BY rule_code;
"
```

Compare to Step 1. md5 MUST differ for each rule (or version bumped) — confirming content actually changed.

- [ ] **Step 4: User verification — frontend generation check**

Hand off with this exact script:

> Phase 2 (Frontend) rule import complete. Please verify in browser:
>
> 1. http://localhost:5173 → Composer → 새 세션
> 2. Mode = NEW_GENERAL or NEW_NL
> 3. **Target System = PLANNEL** (critical)
> 4. NL: `고객 마스터 CRUD 화면을 만들어줘 — 고객 ID, 고객명, 사업자번호, 연락처, 주소`
> 5. 생성된 JSX/JS 산출물 확인
>
> Pass/Fail signals on the generated JSX:
> - [ ] `import` 라인에 `@wingui/*` / `@zionex/wingui-core` 등장 0건
> - [ ] `BaseGrid` / `SearchArea` / `ContentInner` / `InputField` (wingui 컴포넌트) 등장 0건
> - [ ] `useViewStore` / `useContentStore` / `setViewInfo` 등장 0건
> - [ ] `transLangKey('...')` 등장 0건 → 대신 `useTranslation()` + `t('...')` 사용
> - [ ] `zAxios.*` / `composerReq()` 등장 0건 → axios wrapper 또는 redux thunk 사용
> - [ ] `<AgGridReact ... />` 또는 MUI `<DataGrid>` 등 PlanNEL grid 사용
> - [ ] `useSelector` / `useDispatch` / Redux slice 호출 사용
> - [ ] 파일 위치 권장이 `src/pages/...` 또는 동등 saas-plannel 경로
>
> 추가로 메뉴 등록 산출물 확인:
> - [ ] `TB_AD_MENU INSERT` SQL 등장 0건 → TabMenuList.js 항목 + i18n JSON 5개 갱신 산출
>
> 모두 OK → reply "Phase 2 OK" → 종료. Failures → reply 어느 anti-pattern 이 깨졌는지.

- [ ] **Step 5: Phase 2 checkpoint commit**

```bash
cd /Users/hej/work/projects/t3-composer
git commit --allow-empty -m "$(cat <<'EOF'
chore(plannel): Phase 2 (frontend rules) rewrite complete

Re-imported 21-components, 20-screen-development, 41-composer-generation,
99a-composer-anti-patterns to tb_cmp_target_rule WHERE target_cd='PLANNEL'.
Phase 2 verification pending in browser per Task 9 Step 4 script.

7 of 13 PlanNEL rules now reflect saas-plannel source stack. Remaining 6
(00-output-format, 10-overview, 31-multi-tenancy, 32-security, 50-ai-modules,
99-anti-patterns) are deferred to a follow-up spec.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Self-Review Checklist (for engineer before reporting done)

1. All 7 rule files (`.claude-plannel/rules/{20,21,30,40,41,41b,99a}*.md`) are committed and present at their final byte size range (4-12KB).
2. No file contains uncontextualized wingui terms (every `useViewStore` / `BaseGrid` / `transLangKey` / `zAxios` / `TB_AD_MENU` / `SP_UI_` / `com.zionex.t3series.web` etc. appears ONLY inside ❌ anti-pattern markers).
3. `tb_cmp_target_rule WHERE target_cd='PLANNEL'` still has exactly 13 rows (no orphans, no extras). All rows `use_yn='Y'`.
4. For the 7 rewritten rules, `rule_version >= 2` (proves the import upserted, content differs from prior).
5. User has verified Phase 1 (Task 4 Step 5) AND Phase 2 (Task 9 Step 4) browser checks. Both Pass.
6. No commits on main other than: rule file writes (Tasks 1-3, 5-8), two empty phase checkpoints (Tasks 4, 9).

If any check fails, fix before reporting done.
