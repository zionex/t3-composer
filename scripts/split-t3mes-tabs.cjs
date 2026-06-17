#!/usr/bin/env node
/**
 * T3MES UI Pattern HTML — TabPage 추출 & 물리적 파일 분리
 *
 * 입력 : frontend/public/t3mes/*.html  (UI 패턴 퍼블리싱 산출물 30개)
 *
 * 산출 :
 *   1) frontend/src/view/util/t3composerpatterns/_data/t3mes-tabs.json
 *      — 파일별 TabPage 메타 + full/lite 분리 파일 경로
 *   2) frontend/public/t3mes-split/full/<stem>/<NN>_<label>.html
 *      — 독립 실행 HTML (원본 스타일+스크립트 포함, tab-nav 제거, 해당 탭 자동 활성화)
 *      — iframe 화면 표시용
 *   3) frontend/public/t3mes-split/lite/<stem>/<NN>_<label>.html
 *      — 경량 마크업 조각 (해당 panel HTML 만, script 제외)
 *      — AI 참조용 (토큰 최소)
 *
 * TabPage 인식 패턴 4종:
 *   A) 정적 <button class="tab-btn" onclick="switchTab(N)">라벨<span class="tab-num">..</span>
 *   B) JS 단순 배열   const tabNames = ["라벨", ...]
 *   C) JS 객체 배열   const TABS    = [{n:'라벨', ...}, ...]
 *   D) JS 그룹 배열   const tabGroups = [{c:.., n:['라벨1','라벨2']}, ...]
 */
const fs   = require('fs');
const path = require('path');

const HTML_DIR   = path.resolve(__dirname, '..', 'frontend', 'public', 't3mes');
const SPLIT_DIR  = path.resolve(__dirname, '..', 'frontend', 'public', 't3mes-split');
const OUT_FILE   = path.resolve(__dirname, '..', 'frontend', 'src', 'view', 'util',
                                't3composerpatterns', '_data', 't3mes-tabs.json');

// ──────────────────────────────────────────────────────────────
// TabPage 라벨 추출
// ──────────────────────────────────────────────────────────────
const TAB_BTN_RE = /<button[^>]*class="tab-btn[^"]*"[^>]*onclick="switchTab\((\d+)\)"[^>]*>([\s\S]*?)<\/button>/g;

const TAB_VAR_NAMES = [
  'tabNames', 'tabLabels', 'TAB_NAMES', 'TAB_LABELS',
  'tabDefs',  'TAB_DEFS',  'tabs',      'TABS',
  'tabFlat',  'tabGroups', 'TAB_GROUPS',
];
const TAB_VAR_RE = new RegExp(
  '(?:const|let|var)\\s+(?:' + TAB_VAR_NAMES.join('|') + ')\\s*=\\s*\\[([\\s\\S]*?)\\]\\s*;',
);

function htmlToText(html) {
  let s = html.replace(/<span\s+class="tab-num">[\s\S]*?<\/span>/g, '');
  s = s.replace(/<[^>]+>/g, '');
  s = s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
       .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  return s.trim().replace(/\s+/g, ' ');
}

function unescapeJsString(s) {
  return s.replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\\\/g, '\\');
}

function matchAllStrings(text) {
  const re = /(["'`])((?:\\.|(?!\1)[^\\])*)\1/g;
  const out = [];
  let m;
  while ((m = re.exec(text)) !== null) out.push(unescapeJsString(m[2]));
  return out;
}

function extractLabelsFromArray(body) {
  const cleaned = body.replace(/\/\/[^\n\r]*/g, '');
  // (a) 그룹화 — n:['..','..']
  const GROUP_RE = /\b(?:n|name|label|labels)\s*:\s*\[([\s\S]*?)\]/g;
  const groups = [];
  let gm;
  while ((gm = GROUP_RE.exec(cleaned)) !== null) groups.push(matchAllStrings(gm[1]));
  if (groups.length > 0) return [].concat(...groups);
  // (b) 객체 배열 단일 라벨 — {n:'..'} / {name:'..'} / {label:'..'}
  const OBJ_LABEL_RE = /\b(?:n|name|label)\s*:\s*(["'`])((?:\\.|(?!\1)[^\\])*)\1/g;
  const objLabels = [];
  let om;
  while ((om = OBJ_LABEL_RE.exec(cleaned)) !== null) objLabels.push(unescapeJsString(om[2]));
  if (objLabels.length > 0) return objLabels;
  // (c) 단순 문자열 배열
  return matchAllStrings(cleaned);
}

function extractTabs(html) {
  const tabs = [];
  let m;
  TAB_BTN_RE.lastIndex = 0;
  while ((m = TAB_BTN_RE.exec(html)) !== null) {
    const index = parseInt(m[1], 10);
    const label = htmlToText(m[2]);
    if (label) tabs.push({ index, label });
  }
  if (tabs.length > 0) {
    const seen = new Set();
    return tabs.filter((t) => {
      if (seen.has(t.index)) return false;
      seen.add(t.index); return true;
    }).sort((a, b) => a.index - b.index);
  }
  // 패턴 B/C/D — JS 배열
  let arrLabels = null;
  const m2 = TAB_VAR_RE.exec(html);
  if (m2) arrLabels = extractLabelsFromArray(m2[1]);

  // 추출된 라벨이 유효하면 채택
  if (arrLabels && isValidLabels(arrLabels)) {
    return arrLabels.map((label, index) => ({ index, label }));
  }
  // 패턴 E — panel <div id="pN"> 안 첫 <h3> 텍스트가 실제 라벨
  //   (scm_mp_3 처럼 TABS 배열엔 class 만 있고 라벨은 panel h3 에 있는 케이스)
  const h3Tabs = extractTabsFromPanelH3(html);
  if (h3Tabs.length > 0) return h3Tabs;

  // 최후 — 무효라도 배열 라벨이 있으면 사용
  if (arrLabels && arrLabels.length > 0) {
    return arrLabels.map((label, index) => ({ index, label }));
  }
  return [];
}

// 추출 라벨이 실제 의미있는 텍스트인지 검증.
//   class 토큰(t-b, t-r ...) · 1~2자 단편이 절반 이상이면 무효.
function looksLikeClassToken(s) {
  return /^[.#]?[a-z]{1,3}[-_][a-z0-9]+$/i.test(s) || s.trim().length <= 2;
}
function isValidLabels(labels) {
  if (!labels || labels.length === 0) return false;
  const bad = labels.filter(looksLikeClassToken).length;
  return bad < labels.length * 0.5;
}

// 패턴 E — 정적 panel 들의 첫 <h3> 텍스트를 라벨로 추출.
//   번호 prefix("1. ", "① ") 는 제거.
function extractTabsFromPanelH3(html) {
  const out = [];
  for (let i = 0; ; i++) {
    const panel = extractPanel(html, i);
    if (!panel) break;
    const m = /<h3[^>]*>([\s\S]*?)<\/h3>/.exec(panel);
    let label = m ? htmlToText(m[1]) : '';
    label = label.replace(
      /^\s*(?:\d+\s*[.)]|[①-⓿㉑-㊿])\s*/, '',
    ).trim();
    out.push({ index: i, label: label || `Tab ${i + 1}` });
    if (i > 200) break;  // 안전 한계
  }
  return out;
}

// ──────────────────────────────────────────────────────────────
// 파일 분리 헬퍼
// ──────────────────────────────────────────────────────────────

// "mes_sales_1_order_ui_patterns.html" → "mes_sales_1_order"
function stemOf(fileName) {
  return fileName
    .replace(/\.html$/i, '')
    .replace(/_ui_patterns$/i, '')
    .replace(/_patterns$/i, '');
}

// 파일명에 못 쓰는 문자 제거 — 한글/원문자(①)는 유지
//   ⚠️ %, # 은 URL 의 퍼센트 인코딩 이스케이프 / fragment 문자라
//      파일명에 남으면 iframe src 로딩이 깨진다 (예: 10_%_비율_보정.html →
//      브라우저가 "%_비" 를 잘못된 퍼센트 인코딩으로 해석 → 404).
//      → 공백으로 치환 후 underscore 정리 (제거하면 인접 토큰이 붙어버림).
function sanitizeLabel(label) {
  return label
    .replace(/[\/\\:*?"<>|]/g, '')   // OS 금지 문자
    .replace(/[%#]/g, ' ')           // URL escape/fragment 문자 (%, #) → 공백
    .replace(/\s+/g, '_')
    .replace(/^_+|_+$/g, '')         // 앞뒤 underscore 정리
    .trim()
    .slice(0, 40) || 'tab';
}

// id="pN" 인 <div> 블록을 div depth 카운팅으로 정확히 추출.
//   정적 panel 만 매칭됨 (동적 생성 panel 은 id="p${i}" 라 정규 텍스트 없음 → null).
function extractPanel(html, panelIndex) {
  const startRe = new RegExp('<div[^>]*\\bid="p' + panelIndex + '"[^>]*>', 'g');
  const m = startRe.exec(html);
  if (!m) return null;
  const startIdx    = m.index;
  const afterOpen   = m.index + m[0].length;
  let depth = 1;
  const tagRe = /<\/?div\b[^>]*?>/g;
  tagRe.lastIndex = afterOpen;
  let t;
  while ((t = tagRe.exec(html)) !== null) {
    const tag = t[0];
    if (tag.startsWith('</')) {
      depth--;
    } else if (!tag.endsWith('/>')) {
      depth++;
    }
    if (depth === 0) {
      return html.slice(startIdx, t.index + tag.length);
    }
  }
  return null;
}

// 동적 panel 파일 fallback — `panel.innerHTML = `<TEMPLATE>`` 의 template literal 추출.
//   panel 박스를 JS 가 생성하는 monitoring 류 파일 대응.
//   보간 ${n}/${i}/${i+1} 은 해당 TabPage 값으로 치환, 그 외 보간은 그대로 둠.
function extractPanelTemplate(html, index, label) {
  const re = /\bpanel\.innerHTML\s*=\s*`([\s\S]*?)`/;
  const m = re.exec(html);
  if (!m) return null;
  return m[1]
    .replace(/\$\{\s*i\s*\+\s*1\s*\}/g, String(index + 1))
    .replace(/\$\{\s*i\s*\}/g, String(index))
    .replace(/\$\{\s*n\s*\}/g, label);
}

// full 독립 HTML — 원본 + tab-nav CSS 숨김 + 해당 탭 자동 활성화 스크립트
//
//  ⚠️ tab-nav 를 DOM 에서 제거하면 안 된다.
//     동적 탭 파일(tabNames/TABS/tabGroups 패턴)의 initTabs() 가
//     `document.getElementById('tab-nav')` 로 nav 를 찾아 버튼을 붙이면서
//     같은 루프에서 panel 도 생성한다. div 를 지우면 nav 가 null → 에러 →
//     panel 생성까지 중단 → 화면이 텅 빈다.
//     따라서 div 는 그대로 두고 CSS(display:none) 로만 숨긴다.
function buildFullHtml(html, tabIndex) {
  let out = html;

  // 1) tab-nav 숨김 + 깜빡임 방지 CSS — <head> 에 주입.
  //    panel 초기 visibility:hidden → 부트스트랩이 target panel 에만
  //    .t3split-target 부여하면 그것만 visible. 0번 panel 의 잠시 노출 방지.
  //    안전망: html.t3split-fallback 가 붙으면 .panel.active 도 visible →
  //    부트스트랩이 1.5초 내 활성화 실패해도 원본 default 라도 보이게 보장.
  const hideStyle =
    '<style>/* T3MES split — hide tab nav + no-flash panel activation */' +
    '.tab-nav,#tab-nav{display:none !important;}' +
    '.panel{visibility:hidden;}' +
    '.panel.t3split-target{visibility:visible;}' +
    'html.t3split-fallback .panel.active{visibility:visible;}' +
    '</style>';
  if (/<\/head>/i.test(out)) {
    out = out.replace(/<\/head>/i, hideStyle + '\n</head>');
  } else {
    out = hideStyle + '\n' + out;
  }

  // 2) 해당 탭 자동 활성화 부트 스크립트 — </body> 직전 주입.
  //
  //  ⚠️ switchTab(i, btnEl) 시그니처 — 동적 탭 파일의 switchTab 은 두 번째 인자
  //     btnEl 로 `btnEl.classList.add('active')` 를 수행. 과거엔 switchTab(N, null)
  //     주입으로 TypeError → 항상 0번 panel 표시 사고. 해결: ① 실제 .tab-btn[N]
  //     을 찾아 넘김 ② switchTab 실패해도 .panel/.tab-btn active 직접 토글.
  //
  //  ⚠️ 깜빡임 방지 (no-flash) — 다중 retry 로 가능한 빠르게 활성화.
  //     정적 panel: DOMContentLoaded 즉시 성공. 동적 panel: initTabs() 가 panel
  //     생성 후 load + 60/200ms 재시도에서 성공. 첫 성공 시 done=true 로
  //     중복 실행 차단. 1.5초 fallback timer 가 영원히 hidden 인 상태 방지.
  const bootScript =
    '\n<script>/* T3MES split — auto-activate TabPage #' + tabIndex + ' (no-flash) */\n' +
    '(function(){var I=' + tabIndex + ',done=false;\n' +
    'function activate(){\n' +
    '  var panels=document.querySelectorAll(".panel");\n' +
    '  if(!panels.length)return false;\n' +
    '  var btns=document.querySelectorAll(".tab-btn");\n' +
    '  var btn=btns[I]||null;\n' +
    '  if(typeof switchTab==="function"){try{switchTab(I,btn);}catch(e){}}\n' +
    '  panels.forEach(function(p,idx){\n' +
    '    p.classList.toggle("active",idx===I);\n' +
    '    p.classList.toggle("t3split-target",idx===I);\n' +
    '  });\n' +
    '  btns.forEach(function(b,idx){b.classList.toggle("active",idx===I);});\n' +
    '  done=true;return true;\n' +
    '}\n' +
    'function tick(){if(done)return;try{activate();}catch(e){}}\n' +
    'if(document.readyState!=="loading")tick();\n' +
    'document.addEventListener("DOMContentLoaded",tick);\n' +
    'window.addEventListener("load",function(){\n' +
    '  tick();setTimeout(tick,60);setTimeout(tick,200);setTimeout(tick,500);\n' +
    '});\n' +
    'setTimeout(function(){\n' +
    '  if(!done)document.documentElement.classList.add("t3split-fallback");\n' +
    '},1500);\n' +
    '})();\n</script>\n';
  if (/<\/body>/i.test(out)) {
    out = out.replace(/<\/body>/i, bootScript + '</body>');
  } else {
    out += bootScript;
  }
  return out;
}

// lite 경량 조각 — 해당 panel 마크업만 (script/style 제외)
//   source: 'static'  — 정적 panel div 추출 성공
//           'template' — 동적 panel 의 innerHTML 템플릿 추출
//           'none'     — 추출 불가 (placeholder)
function buildLiteHtml(panelHtml, source, meta) {
  const header =
    '<!DOCTYPE html>\n<meta charset="UTF-8">\n' +
    '<title>' + meta.label + '</title>\n' +
    '<!-- T3MES UI Pattern · ' + meta.stem + ' · TabPage #' + (meta.index + 1) +
    ': ' + meta.label + ' -->\n' +
    '<!-- 경량 마크업 조각 (AI 참조용) — 스타일/스크립트 제외, panel 레이아웃 구조만 -->\n';
  if (source === 'static' && panelHtml) {
    return header + panelHtml + '\n';
  }
  if (source === 'template' && panelHtml) {
    return header +
      '<!-- 이 TabPage 는 원본 스크립트가 동적 생성합니다. 아래는 panel innerHTML 템플릿 -->\n' +
      '<div class="panel active" id="p' + meta.index + '">\n' + panelHtml + '\n</div>\n';
  }
  // 추출 불가 — placeholder
  return header +
    '<div data-t3mes-dynamic="true">\n' +
    '  <!-- 이 TabPage 는 원본 HTML 의 스크립트가 런타임에 DOM 을 생성합니다.\n' +
    '       정적 마크업 조각을 추출할 수 없어 골격만 제공합니다.\n' +
    '       전체 동작은 full 버전(t3mes-split/full/' + meta.stem + '/) 또는\n' +
    '       원본(t3mes/' + meta.srcFile + ')을 참조하세요. -->\n' +
    '</div>\n';
}

function writeFileEnsured(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

// ──────────────────────────────────────────────────────────────
// main
// ──────────────────────────────────────────────────────────────
function main() {
  if (!fs.existsSync(HTML_DIR)) {
    console.error('HTML dir not found:', HTML_DIR);
    process.exit(1);
  }
  // split 출력 폴더 초기화 (재실행 안전)
  if (fs.existsSync(SPLIT_DIR)) {
    fs.rmSync(SPLIT_DIR, { recursive: true, force: true });
  }

  const files = fs.readdirSync(HTML_DIR)
    .filter((f) => f.endsWith('.html') && f !== 'index.html')
    .sort();

  const out = {};
  let totalTabs = 0, totalFull = 0, totalLite = 0;
  let liteStatic = 0, liteTemplate = 0, liteNone = 0;
  let totalLayersExtracted = 0, totalLayersNone = 0;

  for (const f of files) {
    const full = path.join(HTML_DIR, f);
    const html = fs.readFileSync(full, 'utf8');
    const tabs = extractTabs(html);
    const stem = stemOf(f);

    const tabMetas = [];
    for (const t of tabs) {
      const nn        = String(t.index + 1).padStart(2, '0');
      const safeLabel = sanitizeLabel(t.label);
      const fname     = `${nn}_${safeLabel}.html`;

      // full
      const fullRel  = `t3mes-split/full/${stem}/${fname}`;
      writeFileEnsured(path.join(SPLIT_DIR, 'full', stem, fname),
                       buildFullHtml(html, t.index));
      totalFull++;

      // lite — 정적 panel 우선, 없으면 동적 템플릿 fallback
      let panelHtml = extractPanel(html, t.index);
      let liteSource = 'static';
      if (!panelHtml) {
        panelHtml = extractPanelTemplate(html, t.index, t.label);
        liteSource = panelHtml ? 'template' : 'none';
      }
      if (liteSource === 'static')        liteStatic++;
      else if (liteSource === 'template') liteTemplate++;
      else                                liteNone++;
      const liteRel  = `t3mes-split/lite/${stem}/${fname}`;
      const liteContent = buildLiteHtml(panelHtml, liteSource,
                                       { label: t.label, index: t.index, stem, srcFile: f });
      writeFileEnsured(path.join(SPLIT_DIR, 'lite', stem, fname), liteContent);
      totalLite++;

      // ★ layers 추출 — panel HTML (정적/템플릿) 에서 직접 파싱
      //   panelHtml 이 null 이면 (liteSource='none') 추출 시도 불가 → layers 미주입
      const layers = panelHtml ? extractLayers(panelHtml) : [];
      if (layers.length > 0) totalLayersExtracted++;
      else                   totalLayersNone++;

      const tabMeta = { index: t.index, label: t.label, full: fullRel, lite: liteRel };
      if (layers.length > 0) tabMeta.layers = layers;
      tabMetas.push(tabMeta);
    }

    out[f] = tabMetas;
    totalTabs += tabMetas.length;
    console.log(`  ${f.padEnd(48)} — ${String(tabMetas.length).padStart(3)} tabs`);
  }

  writeFileEnsured(OUT_FILE, JSON.stringify(out, null, 2));

  console.log(`\n파일: ${files.length}  ·  TabPage: ${totalTabs}`);
  console.log(`분리 산출: full ${totalFull}개, lite ${totalLite}개`);
  console.log(`  lite 내역: 정적추출 ${liteStatic}  ·  동적템플릿 ${liteTemplate}  ·  placeholder ${liteNone}`);
  console.log(`layers   : 추출 ${totalLayersExtracted}  ·  미추출 ${totalLayersNone}` +
              ` (${Math.round(totalLayersExtracted / totalTabs * 100)}%)`);
  console.log(`tabs json : ${OUT_FILE}`);
  console.log(`split dir : ${SPLIT_DIR}`);
}

// ──────────────────────────────────────────────────────────────
// Layer 추출 — lite HTML → ComposerSpec.layers 12-col RGL 좌표
//
// 인식 시그니처 (spec §3.2 + 2026-06 broaden):
//   <table class="tbl"> · <div class="tbl-wrap">          → GRID (GRID_BASE)
//   <canvas> · class="chart" / class="chart-card" · <svg> → CHART (CHART_LINE)
//   <div class="kpi-grid"> · <div class="kpi-row"> + 자식  → KPI 영역 1개 (KPI_CARD)
//   <div class="form-row"> 다수 · <input>/<select> 다수    → CONTAINER (FORM)
//   <div|ul class="org-tree|tree-view|treegrid|tree">     → GRID (GRID_TREE)
//   <div class="card"> ≥3개 (card-hdr/title 제외)         → CONTAINER (CARD_LIST)
//   <div|ol|ul class="steps|stepper|step-list">           → CHART (STEPPER)
//   <div class="kanban">                                  → CONTAINER (CARD_LIST)
//   <div class="cal-grid">                                → CHART (CALENDAR)
//   <div class="mobile-frame">                            → CONTAINER (MOBILE_PREVIEW)
//
// 좌표 신호:
//   class="grid2" 또는 grid-template-columns 2-col → 좌우 분할 (w 분배)
//   class="grid3" 또는 grid-template-columns 3-col → 좌우 3분할
//   그 외 (기본) → 상하 분할 (h 분배)
// ──────────────────────────────────────────────────────────────
const MAX_LAYERS = 6;

function extractLayers(html) {
  if (!html || typeof html !== 'string') return [];

  // 시그니처는 모두 panel 안의 자식 요소를 가리키므로 panel wrapper 자체엔 매칭되지 않음 →
  // 별도 추출 없이 전체 html 을 그대로 스캔 (truncated lite 대응).
  const inner = html;

  // 좌우 분할 신호 — panel 안에 grid2/grid3 가 있으면 자식들을 좌우 layer 로 본다
  const gridSplit = /<div[^>]*class="[^"]*\bgrid([23])\b/i.exec(inner);
  const splitCols = gridSplit ? parseInt(gridSplit[1], 10) : null;

  // 시그니처 카운트 (panel 안 전체 기준 — 1레벨 중첩 무시)
  const matchCount = (re) => (inner.match(re) || []).length;
  const counts = {
    grid:  Math.max(matchCount(/<table[^>]*class="[^"]*\btbl\b/gi),
                    matchCount(/<div[^>]*class="[^"]*\btbl-wrap\b/gi)),
    chart: Math.max(matchCount(/<canvas\b/gi),
                    matchCount(/<div[^>]*class="[^"]*\bchart(-card)?\b/gi),
                    // SVG 만 인식 — 큰 다이어그램 (icon 제외)
                    //  ① width="200+" 또는 width="1000+"
                    //  ② viewBox="x y W H" 에서 W·H 가 3자리 이상
                    //  ③ chart/diagram/flow/bpmn 클래스 wrapper 안의 SVG
                    matchCount(/<svg[^>]*\bwidth="(?:[2-9]\d{2}|\d{4,})\b/gi)
                      + matchCount(/<svg[^>]*\bviewBox="[^"]*\s\d{3,}\s\d{3,}"/gi)
                      + matchCount(/<div[^>]*class="[^"]*\b(?:chart|diagram|flow|bpmn|svg-wrap)\b[^"]*"[\s\S]{0,500}?<svg/gi)),
    // grid4/grid5/grid6 = KPI strip (4~6 KPI 카드 가로 배치, 동적 JS 채움 케이스 포함)
    kpi:   (/<div[^>]*class="[^"]*\bkpi-(grid|row)\b/i.test(inner)
             || matchCount(/<div[^>]*class="[^"]*\bkpi-card\b/gi) >= 2
             || /<div[^>]*class="[^"]*\bgrid[4-6]\b/i.test(inner)) ? 1 : 0,
    form:  (matchCount(/<div[^>]*class="[^"]*\bform-row\b/gi) >= 2
             || matchCount(/<input\b/gi) + matchCount(/<select\b/gi) >= 3) ? 1 : 0,
    tree:  (/<(div|ul)[^>]*class="[^"]*\b(org-tree|tree-view|treegrid|tree)\b/i.test(inner)) ? 1 : 0,
    cards: (matchCount(/<div[^>]*class="(?:[^"]*\s)?card(?:\s[^"]*)?"/gi) >= 3
             || /<div[^>]*class="[^"]*\bkanban\b/i.test(inner)) ? 1 : 0,
    stepper: (/<(div|ol|ul)[^>]*class="[^"]*\b(steps|stepper|step-list)\b/i.test(inner)) ? 1 : 0,
    calendar: (/<div[^>]*class="[^"]*\bcal-grid\b/i.test(inner)) ? 1 : 0,
    mobile: (/<div[^>]*class="[^"]*\bmobile-frame\b/i.test(inner)) ? 1 : 0,
    // card-title 카운트 — 2개 이상이면 다중 컨텐츠 영역 (대시보드 패턴)
    //   각 card-title 은 distinct 한 시각적 region 을 표시
    cardSections: matchCount(/<div[^>]*class="[^"]*\bcard-title\b/gi),
  };

  // Dedup — cards 가 grid/chart 와 함께 잡히면 cards 는 wrapper 일 가능성 높음 (실제 layer 는 inner)
  if (counts.cards && (counts.grid > 0 || counts.chart > 0)) {
    counts.cards = 0;
  }

  // 슬롯 순서 (Mockup ControlBoard 관례):
  //   stepper(상단) → KPI → tree → grids → charts → cards → form
  //   cards 는 inner content 가 있을 때 제외 (Issue 2 dedup 참고)
  // subtype 은 frontend constants.js 의 COMPONENT_INDEX 가 인식하는 token 만 사용.
  //   FORM / STEPPER / MOBILE_PREVIEW → COMPONENT_INDEX 미보유 → 안전 폴백 GRID_BASE
  //   CALENDAR → CALENDAR_MONTH (DATA_DISPLAY 그룹 실제 코드)
  const META = {
    GRID:     { type: 'GRID',      subtype: 'GRID_BASE',       titlePrefix: '그리드' },
    CHART:    { type: 'CHART',     subtype: 'CHART_LINE',      titlePrefix: '차트' },
    KPI:      { type: 'CHART',     subtype: 'KPI_CARD',        titlePrefix: 'KPI' },
    FORM:     { type: 'CONTAINER', subtype: 'GRID_BASE',       titlePrefix: '입력 폼' },
    TREE:     { type: 'GRID',      subtype: 'GRID_TREE',       titlePrefix: '트리' },
    CARDS:    { type: 'CONTAINER', subtype: 'CARD_LIST',       titlePrefix: '카드 리스트' },
    STEPPER:  { type: 'CHART',     subtype: 'GRID_BASE',       titlePrefix: '단계' },
    CALENDAR: { type: 'CHART',     subtype: 'CALENDAR_MONTH',  titlePrefix: '달력' },
    MOBILE:   { type: 'CONTAINER', subtype: 'GRID_BASE',       titlePrefix: '모바일' },
    // card-title 가 발견된 컨텐츠 카드 영역 (대시보드 패턴 — 각 card-title = distinct region)
    CARD_REGION: { type: 'CONTAINER', subtype: 'CARD_LIST',    titlePrefix: '카드 영역' },
  };
  const slots = [];
  if (counts.stepper)  slots.push({ ...META.STEPPER,  slot: 'stepper' });
  if (counts.kpi)      slots.push({ ...META.KPI,      slot: 'kpi' });
  if (counts.tree)     slots.push({ ...META.TREE,     slot: 'tree' });
  for (let i = 0; i < counts.grid;  i++) slots.push({ ...META.GRID,  slot: 'grid' });
  for (let i = 0; i < counts.chart; i++) slots.push({ ...META.CHART, slot: 'chart' });
  if (counts.calendar) slots.push({ ...META.CALENDAR, slot: 'calendar' });
  if (counts.mobile)   slots.push({ ...META.MOBILE,   slot: 'mobile' });
  if (counts.cards)    slots.push({ ...META.CARDS,    slot: 'cards' });
  if (counts.form)     slots.push({ ...META.FORM,     slot: 'form' });

  // 다중 카드 영역 — card-title 가 2+ 이면 슬롯 부족분만큼 generic card 영역 추가
  //   (이미 잡힌 grid/chart/form 카운트와 cardSections 차이만큼 추가).
  //   예: 대시보드 — grid4 KPI strip + chart + 알림 panel → kpi=1, chart=1, cardSections=2
  //       → explicitSlots(chart=1) 보다 cardSections(2) 크므로 1개 card region 추가.
  const explicitSlots = (counts.grid + counts.chart + (counts.form || 0));
  if (counts.cardSections >= 2 && counts.cardSections > explicitSlots) {
    const missing = counts.cardSections - explicitSlots;
    for (let i = 0; i < missing; i++) {
      slots.push({ ...META.CARD_REGION, slot: 'card' });
    }
  }

  if (slots.length === 0) return [];

  // 7개 이상 → 첫 6개만 + warn
  if (slots.length > MAX_LAYERS) {
    console.warn(
      `[extractLayers] layer 6+ 개 인식 — 첫 ${MAX_LAYERS}개만 유지 (총 ${slots.length}개)`,
    );
    slots.length = MAX_LAYERS;
  }

  // 좌표 분배
  const N = slots.length;
  const positions = [];
  if (splitCols && N >= 2) {
    // 좌우 분배 — 나머지는 마지막 layer 가 흡수
    const w = Math.floor(12 / N);
    let x = 0;
    for (let i = 0; i < N; i++) {
      const widthW = (i === N - 1) ? (12 - x) : w;
      positions.push({ x, y: 0, w: widthW, h: 12 });
      x += widthW;
    }
  } else {
    // 상하 분배 (기본)
    const h = Math.floor(12 / N);
    let y = 0;
    for (let i = 0; i < N; i++) {
      const heightH = (i === N - 1) ? (12 - y) : h;
      positions.push({ x: 0, y, w: 12, h: heightH });
      y += heightH;
    }
  }

  // key/title 부여 (slot 별 인덱스)
  const counters = {
    kpi: 0, grid: 0, chart: 0, form: 0, tree: 0, cards: 0, stepper: 0, calendar: 0, mobile: 0,
    card: 0,
  };
  const SINGLETON_TITLES = {
    kpi: 'KPI 영역', form: '입력 폼', tree: '트리', cards: '카드 리스트', stepper: '단계',
    calendar: '달력', mobile: '모바일',
    // card 는 인덱스 (card1/card2/...) 로 — 다중 카드 영역 케이스
  };
  return slots.map((s, i) => {
    counters[s.slot] += 1;
    const n = counters[s.slot];
    return {
      key:   `${s.slot}${n}`,
      title: SINGLETON_TITLES[s.slot] || `${s.titlePrefix} ${n}`,
      type: s.type,
      subtype: s.subtype,
      position: positions[i],
    };
  });
}

module.exports = { extractLayers };

if (require.main === module) main();
