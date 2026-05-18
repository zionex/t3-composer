#!/usr/bin/env node
/*
 * T3Series Pattern Coverage — Phase 3
 *
 * 3-way cross-check:
 *   (A) DB 시드 — t3series-database/mssql/upgrade/v26.0.0/db_update_script_composer_pattern*.sql
 *   (B) PatternPreview.jsx 의 RENDERERS 객체 키
 *   (C) Phase 1 분류 결과 (ui-inventory.json) 의 patternCode 빈도
 *
 * 출력: docs/reference/pattern-coverage.md
 *       docs/reference/pattern-coverage.json (programmatic)
 */

const fs = require('fs');
const path = require('path');

// t3series 입력 루트 결정 (env > 형제 폴더 > 부모 추정)
function resolveSeriesRoot() {
  if (process.env.T3SERIES_ROOT) {
    const r = path.resolve(process.env.T3SERIES_ROOT);
    if (fs.existsSync(path.join(r, 't3series-wingui'))) return r;
  }
  const candidates = [
    path.resolve(__dirname, '..', '..', 't3series'),
    path.resolve(__dirname, '..', 't3series'),
    path.resolve(__dirname, '..', '..', '..', '..'),
    path.resolve(__dirname, '..'),
  ];
  for (const c of candidates) if (fs.existsSync(path.join(c, 't3series-wingui'))) return c;
  throw new Error('t3series 루트를 찾을 수 없습니다. T3SERIES_ROOT 환경변수를 설정하거나 t3series 와 같은 형제 폴더에 두세요.');
}

const scriptParent = path.basename(path.resolve(__dirname, '..'));
const IS_COMPOSER  = scriptParent === 't3-composer';

const REPO_ROOT = resolveSeriesRoot();
const SEED_DIR  = path.join(REPO_ROOT, 't3series-database', 'mssql', 'upgrade', 'v26.0.0');
const PREVIEW   = path.join(REPO_ROOT, 't3series-wingui', 'packages', 'wingui', 'src', 'view', 'util', 't3composer', 'PatternPreview.jsx');
const INV_JSON  = IS_COMPOSER
  ? path.join(__dirname, '..', 'docs', 'ui-inventory', 'ui-inventory.json')
  : path.join(REPO_ROOT, 'docs', 'reference', 'ui-inventory.json');
const OUT_DIR_BASE = IS_COMPOSER
  ? path.join(__dirname, '..', 'docs', 'pattern-coverage')
  : path.join(REPO_ROOT, 'docs', 'reference');
const OUT_MD   = path.join(OUT_DIR_BASE, 'pattern-coverage.md');
const OUT_JSON = path.join(OUT_DIR_BASE, 'pattern-coverage.json');

// ─────────────────────────────────────────────
// (A) DB 시드 — INSERT 의 VALUES 트리플 (CODE, LAYOUT, CATEGORY)
// ─────────────────────────────────────────────
function loadDbSeeds() {
  const files = fs.readdirSync(SEED_DIR)
    .filter((f) => /composer_pattern.*\.sql$/i.test(f));
  const seeds = []; // { code, layout, category, file }
  const seen = new Map(); // CODE → 최초 등장 정보 (중복 검출용)
  for (const f of files) {
    const text = fs.readFileSync(path.join(SEED_DIR, f), 'utf8');
    const re = /VALUES\s*\(\s*REPLACE\(NEWID\(\)[^)]*\)\s*,\s*'([A-Z][A-Z0-9_]*)'\s*,\s*'([a-z][a-z0-9_]+)'\s*,\s*'([A-Z][A-Z0-9_]*)'/g;
    let m;
    while ((m = re.exec(text)) !== null) {
      const entry = { code: m[1], layout: m[2], category: m[3], file: f };
      if (seen.has(entry.code)) {
        entry.duplicate = true;
        entry.firstFile = seen.get(entry.code).file;
      } else {
        seen.set(entry.code, entry);
      }
      seeds.push(entry);
    }
  }
  return { seeds, files };
}

// ─────────────────────────────────────────────
// (B) PatternPreview.jsx — RENDERERS 객체 키
//     형식: '  <key>: () =>' 또는 '  <key>: function'
// ─────────────────────────────────────────────
function loadPreviewKeys() {
  const text = fs.readFileSync(PREVIEW, 'utf8');
  // RENDERERS 변수 선언 위치 이후 ~ Object.assign(RENDERERS, ...) 블록 포함
  // 들여쓰기 2~4 칸 안에 있는 'identifier: (' 패턴
  const re = /^[ \t]+([a-z][a-z0-9_]+)\s*:\s*(?:\(|function)/gm;
  const keys = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    keys.push(m[1]);
  }
  return [...new Set(keys)];
}

// ─────────────────────────────────────────────
// (C) Phase 1 결과의 patternCode 빈도
// ─────────────────────────────────────────────
function loadPhase1Usage() {
  const rows = JSON.parse(fs.readFileSync(INV_JSON, 'utf8'));
  const usage = {};
  const byPatternToScreens = {};
  for (const r of rows) {
    const pc = r.patternCode || 'unknown';
    usage[pc] = (usage[pc] || 0) + 1;
    if (!byPatternToScreens[pc]) byPatternToScreens[pc] = [];
    byPatternToScreens[pc].push({
      module: r.moduleCode,
      screen: r.screenName,
      menuCd: r.menuCd,
      confidence: r.confidence,
    });
  }
  return { usage, byPatternToScreens, totalRows: rows.length };
}

// ─────────────────────────────────────────────
// 메인 분석
// ─────────────────────────────────────────────
function main() {
  console.log('[pattern-coverage] start');
  const { seeds, files: seedFiles } = loadDbSeeds();
  const previewKeys = loadPreviewKeys();
  const { usage, byPatternToScreens, totalRows } = loadPhase1Usage();

  // 시드 — 중복 정리 후 유니크 CODE 셋
  const uniqueSeedCodes = new Map(); // CODE → first entry
  const seedDuplicates = [];
  for (const s of seeds) {
    if (s.duplicate) {
      seedDuplicates.push(s);
    } else {
      uniqueSeedCodes.set(s.code, s);
    }
  }
  // LAYOUT (= renderer key) 셋 — seed 의 LAYOUT 컬럼이 PatternPreview 렌더러 키와 1:1 매칭
  const seedLayouts = new Set([...uniqueSeedCodes.values()].map((s) => s.layout));

  // PatternPreview 렌더러 키
  const previewSet = new Set(previewKeys);

  // Phase 1 의 patternCode 셋
  const phase1Set = new Set(Object.keys(usage));

  // 3-way 교집합
  const dbAndPreview = [...seedLayouts].filter((k) => previewSet.has(k));
  const dbOnly       = [...seedLayouts].filter((k) => !previewSet.has(k));
  const previewOnly  = [...previewSet].filter((k) => !seedLayouts.has(k));

  // Phase 1 patternCode vs DB/Preview
  // 우리 분류기는 PatternPreview 의 layout key 와 같지 않은 추가 코드들을 사용
  // 정규화: phase1 patternCode 가 PatternPreview key 와 일치하면 매칭
  const phase1NotInPreview = [...phase1Set].filter((k) => !previewSet.has(k));
  const phase1InPreview    = [...phase1Set].filter((k) => previewSet.has(k));

  // 미사용 렌더러 — PatternPreview 에 있는데 Phase 1 결과에 0번 등장
  const unusedPreviewKeys = [...previewSet].filter((k) => (usage[k] || 0) === 0);

  // 사용량 0 인 DB 시드 — DB 시드의 LAYOUT 키가 Phase 1 에서 한 번도 안 쓰임
  const unusedDbSeeds = [...uniqueSeedCodes.values()].filter((s) => (usage[s.layout] || 0) === 0);

  // 분류기 신규 코드 (DB·Preview 양쪽에 없음) — DB 시드 추가 후보
  const newPhase1Codes = [...phase1NotInPreview].filter((k) => !seedLayouts.has(k));

  // ─── 결과 JSON ───
  const result = {
    summary: {
      dbSeedFiles: seedFiles.length,
      dbSeedRows: seeds.length,
      dbSeedUniqueCodes: uniqueSeedCodes.size,
      dbSeedDuplicates: seedDuplicates.length,
      dbSeedUniqueLayouts: seedLayouts.size,
      previewRenderers: previewSet.size,
      phase1Patterns: phase1Set.size,
      phase1Screens: totalRows,
    },
    intersections: {
      dbAndPreview: { count: dbAndPreview.length, keys: dbAndPreview.sort() },
      dbOnly:       { count: dbOnly.length, keys: dbOnly.sort() },
      previewOnly:  { count: previewOnly.length, keys: previewOnly.sort() },
      phase1InPreview:    { count: phase1InPreview.length, keys: phase1InPreview.sort() },
      phase1NotInPreview: { count: phase1NotInPreview.length, keys: phase1NotInPreview.sort() },
      newPhase1Codes:     { count: newPhase1Codes.length, keys: newPhase1Codes.sort() },
    },
    unusedPreviewKeys: { count: unusedPreviewKeys.length, keys: unusedPreviewKeys.sort() },
    unusedDbSeeds: {
      count: unusedDbSeeds.length,
      list: unusedDbSeeds.sort((a, b) => a.code.localeCompare(b.code)).map((s) => ({
        code: s.code, layout: s.layout, category: s.category, file: s.file,
      })),
    },
    duplicateSeeds: {
      count: seedDuplicates.length,
      list: seedDuplicates.map((s) => ({ code: s.code, layout: s.layout, file: s.file, firstFile: s.firstFile })),
    },
    patternUsage: Object.entries(usage)
      .sort((a, b) => b[1] - a[1])
      .map(([k, n]) => ({
        patternCode: k,
        usage: n,
        inDbSeed: seedLayouts.has(k),
        inPreview: previewSet.has(k),
      })),
  };

  if (!fs.existsSync(OUT_DIR_BASE)) fs.mkdirSync(OUT_DIR_BASE, { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(result, null, 2), 'utf8');

  // ─── Markdown 보고서 ───
  const lines = [];
  lines.push('# T3Series UI Pattern Coverage — Phase 3 결과');
  lines.push('');
  lines.push('> 3-way cross-check: **DB 시드 ↔ PatternPreview 렌더러 ↔ Phase 1 자동 분류 결과**');
  lines.push('> 생성: `node t3series-wingui/packages/wingui/scripts/pattern-coverage.cjs`');
  lines.push('');

  lines.push('## 1. 요약');
  lines.push('');
  lines.push('| 항목 | 값 |');
  lines.push('|---|---:|');
  lines.push(`| DB 시드 파일 | ${seedFiles.length}개 |`);
  lines.push(`| DB 시드 INSERT 행 | ${seeds.length} |`);
  lines.push(`| DB 시드 유니크 CODE | ${uniqueSeedCodes.size} |`);
  lines.push(`| DB 시드 유니크 LAYOUT (= 렌더러 키) | ${seedLayouts.size} |`);
  lines.push(`| DB 시드 중복 CODE | ${seedDuplicates.length} ${seedDuplicates.length ? '⚠️' : ''} |`);
  lines.push(`| PatternPreview 렌더러 | ${previewSet.size} |`);
  lines.push(`| Phase 1 사용된 patternCode | ${phase1Set.size} |`);
  lines.push(`| Phase 1 분류된 화면 | ${totalRows} |`);
  lines.push('');

  lines.push('## 2. 교집합 / 차집합');
  lines.push('');
  lines.push('| 분류 | 개수 | 의미 |');
  lines.push('|---|---:|---|');
  lines.push(`| DB ∩ Preview | ${dbAndPreview.length} | DB 시드 + 미리보기 모두 존재 (정상) |`);
  lines.push(`| DB only | ${dbOnly.length} | DB 시드는 있는데 미리보기 렌더러 없음 — **렌더러 보강 필요** |`);
  lines.push(`| Preview only | ${previewOnly.length} | 미리보기는 있는데 DB 시드 없음 — **시드 추가 검토** |`);
  lines.push(`| Phase 1 ∈ Preview | ${phase1InPreview.length} | 분류기 코드 중 PatternPreview 에 렌더러 있는 것 |`);
  lines.push(`| Phase 1 ∉ Preview | ${phase1NotInPreview.length} | 분류기 코드 중 PatternPreview 에 렌더러 없는 것 |`);
  lines.push(`| Phase 1 신규 코드 (DB·Preview 모두 X) | ${newPhase1Codes.length} | 분류기가 새로 도입한 코드 — DB·Preview 양쪽에 추가 검토 |`);
  lines.push('');

  if (newPhase1Codes.length) {
    lines.push('### 2.1 Phase 1 분류기가 도입한 신규 코드 (DB·Preview 양쪽에 없음)');
    lines.push('');
    lines.push('| patternCode | Phase 1 사용 화면 수 | 권장 조치 |');
    lines.push('|---|---:|---|');
    for (const code of newPhase1Codes.sort()) {
      const n = usage[code] || 0;
      let action = '';
      if (n >= 50)      action = '⭐ DB 시드 + 렌더러 즉시 추가';
      else if (n >= 20) action = '✅ DB 시드 + 렌더러 추가 권장';
      else if (n >= 5)  action = '🟡 빈도 보통 — 렌더러 추가 검토';
      else              action = '🔹 빈도 낮음 — 분류기 정규화 검토';
      lines.push(`| \`${code}\` | ${n} | ${action} |`);
    }
    lines.push('');
  }

  if (previewOnly.length) {
    lines.push('### 2.2 PatternPreview 만 있고 DB 시드 없음 — DB 시드 추가 후보');
    lines.push('');
    lines.push('| renderer key | Phase 1 사용 |');
    lines.push('|---|---:|');
    for (const k of previewOnly.sort()) {
      const n = usage[k] || 0;
      lines.push(`| \`${k}\` | ${n} |`);
    }
    lines.push('');
  }

  if (dbOnly.length) {
    lines.push('### 2.3 DB 시드만 있고 PatternPreview 렌더러 없음 — 렌더러 보강 후보');
    lines.push('');
    lines.push('| renderer key (= seed LAYOUT) | Phase 1 사용 |');
    lines.push('|---|---:|');
    for (const k of dbOnly.sort()) {
      const n = usage[k] || 0;
      lines.push(`| \`${k}\` | ${n} |`);
    }
    lines.push('');
  }

  lines.push('## 3. 미사용 패턴 — `USE_YN=\'N\'` 후보');
  lines.push('');
  lines.push('### 3.1 미사용 PatternPreview 렌더러');
  lines.push('');
  lines.push(`Phase 1 분류 결과에서 단 한 번도 매칭되지 않은 렌더러 (총 ${unusedPreviewKeys.length}개)`);
  lines.push('');
  if (unusedPreviewKeys.length) {
    lines.push('<details><summary>전체 보기</summary>');
    lines.push('');
    lines.push('```');
    let line = '';
    for (const k of unusedPreviewKeys.sort()) {
      if (line.length + k.length + 2 > 100) { lines.push(line); line = ''; }
      line += (line ? ', ' : '') + k;
    }
    if (line) lines.push(line);
    lines.push('```');
    lines.push('');
    lines.push('</details>');
    lines.push('');
  }

  lines.push('### 3.2 미사용 DB 시드 (USE_YN=\'N\' 후보)');
  lines.push('');
  lines.push(`Phase 1 분류 결과에서 단 한 번도 매칭되지 않은 시드 CODE (총 ${unusedDbSeeds.length}개)`);
  lines.push('');
  if (unusedDbSeeds.length) {
    lines.push('| CODE | LAYOUT | CATEGORY | 시드 파일 |');
    lines.push('|---|---|---|---|');
    for (const s of unusedDbSeeds.sort((a, b) => a.code.localeCompare(b.code))) {
      lines.push(`| \`${s.code}\` | \`${s.layout}\` | ${s.category} | ${s.file.replace('db_update_script_composer_pattern','...')} |`);
    }
    lines.push('');
  }

  if (seedDuplicates.length) {
    lines.push('## 4. 중복 시드 CODE — 정리 필요');
    lines.push('');
    lines.push('| CODE | LAYOUT | 중복 파일 | 최초 파일 |');
    lines.push('|---|---|---|---|');
    for (const s of seedDuplicates) {
      lines.push(`| \`${s.code}\` | \`${s.layout}\` | ${s.file.replace('db_update_script_composer_pattern','...')} | ${s.firstFile.replace('db_update_script_composer_pattern','...')} |`);
    }
    lines.push('');
  }

  // 사용량 Top
  lines.push('## 5. 패턴 사용 빈도 Top 30 (Phase 1)');
  lines.push('');
  lines.push('| patternCode | Phase 1 사용 | DB 시드 | PatternPreview |');
  lines.push('|---|---:|:-:|:-:|');
  for (const u of result.patternUsage.slice(0, 30)) {
    lines.push(`| \`${u.patternCode}\` | ${u.usage} | ${u.inDbSeed ? '✅' : '❌'} | ${u.inPreview ? '✅' : '❌'} |`);
  }
  lines.push('');

  // 권장 조치
  lines.push('## 6. 권장 조치');
  lines.push('');
  lines.push('### 6.1 즉시 DB 시드 추가 권장 (Phase 1 사용 빈도 ≥ 20)');
  lines.push('');
  const hotMissing = result.patternUsage.filter((u) => u.usage >= 20 && !u.inDbSeed && !u.inPreview);
  if (hotMissing.length === 0) {
    lines.push('_없음 — 빈도 높은 분류기 코드는 모두 DB 또는 PatternPreview 에 이미 존재._');
  } else {
    lines.push('| patternCode | Phase 1 사용 | LAYOUT (제안) | CATEGORY (제안) |');
    lines.push('|---|---:|---|---|');
    for (const u of hotMissing) {
      // 휴리스틱 제안
      let cat = 'GRID';
      if (/^widget_/.test(u.patternCode)) cat = 'WIDGET';
      else if (/^subcomp|free_form|base_wrapper|popup/.test(u.patternCode)) cat = 'SPECIAL';
      else if (/^P01|dashboard/.test(u.patternCode)) cat = 'DASHBOARD';
      else if (/^cb_/.test(u.patternCode)) cat = 'LAYOUT_CONTROLBOARD';
      else if (/^pe_/.test(u.patternCode)) cat = 'LAYOUT_PLANEDIT';
      else if (/^mn_/.test(u.patternCode)) cat = 'LAYOUT_MONITORING';
      else if (/^rl_/.test(u.patternCode)) cat = 'LAYOUT_ROUTELAYOUT';
      lines.push(`| \`${u.patternCode}\` | ${u.usage} | \`${u.patternCode}\` | ${cat} |`);
    }
  }
  lines.push('');

  lines.push('### 6.2 비활성화(USE_YN=\'N\') 검토');
  lines.push('');
  lines.push(`미사용 DB 시드 ${unusedDbSeeds.length}개 중 향후 활용 가능성이 낮은 것은 \`USE_YN='N'\` 으로 비활성화 후보. 단, T3Composer Wizard 의 패턴 선택 화면에서 사용자가 직접 고를 수 있는 항목이므로 도메인 담당자 검토 필요.`);
  lines.push('');

  lines.push('### 6.3 Phase 4 (Full mockup) 우선순위');
  lines.push('');
  lines.push('Phase 4 에서 패턴별 1개 대표 목업 50~80개 생성 시 우선순위:');
  lines.push('');
  lines.push('1. **Top 10 패턴 (Phase 1 사용 빈도 기준)** — 가장 흔한 화면 형식이므로 LLM 학습 효과 최대');
  lines.push('2. **DB 시드 ∩ Preview ∩ Phase 1 사용 ≥ 5** — 3-way 매칭되는 검증된 패턴');
  lines.push('3. **신규 분류기 코드 (§2.1)** — 분류기는 검출했으나 DB·Preview 둘 다 없음 — 우선 정규화 후 시드 추가');
  lines.push('');

  // 끝
  lines.push('---');
  lines.push('');
  lines.push(`*JSON 산출물: \`docs/reference/pattern-coverage.json\`*`);
  lines.push(`*Phase 1 입력: \`docs/reference/ui-inventory.json\`*`);

  fs.writeFileSync(OUT_MD, lines.join('\n'), 'utf8');

  // ─── stdout 요약 ───
  console.log('\n[pattern-coverage] ===== 요약 =====');
  console.log(`DB 시드 파일: ${seedFiles.length} · INSERT 행: ${seeds.length} · 유니크 CODE: ${uniqueSeedCodes.size} · 유니크 LAYOUT: ${seedLayouts.size}`);
  console.log(`PatternPreview 렌더러: ${previewSet.size}`);
  console.log(`Phase 1 사용된 patternCode: ${phase1Set.size}`);
  console.log('');
  console.log(`교집합:`);
  console.log(`  DB ∩ Preview                : ${dbAndPreview.length}`);
  console.log(`  DB only (렌더러 없음)        : ${dbOnly.length}`);
  console.log(`  Preview only (DB 시드 없음)  : ${previewOnly.length}`);
  console.log(`  Phase 1 ∉ Preview            : ${phase1NotInPreview.length}`);
  console.log(`  Phase 1 신규 (양쪽 모두 없음): ${newPhase1Codes.length}`);
  console.log('');
  console.log(`미사용:`);
  console.log(`  미사용 PatternPreview 렌더러 : ${unusedPreviewKeys.length}`);
  console.log(`  미사용 DB 시드 (USE_YN=N 후보): ${unusedDbSeeds.length}`);
  console.log(`  중복 시드 CODE                : ${seedDuplicates.length}`);
  console.log('');
  console.log(`출력:`);
  console.log(`  ${OUT_MD}`);
  console.log(`  ${OUT_JSON}`);
}

main();
