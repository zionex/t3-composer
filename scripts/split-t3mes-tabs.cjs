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

  // 1) tab-nav 숨김 CSS 를 <head> 에 주입
  const hideStyle =
    '<style>/* T3MES split — hide tab navigation */' +
    '.tab-nav,#tab-nav{display:none !important;}</style>';
  if (/<\/head>/i.test(out)) {
    out = out.replace(/<\/head>/i, hideStyle + '\n</head>');
  } else {
    out = hideStyle + '\n' + out;
  }

  // 2) 해당 탭 자동 활성화 부트 스크립트를 </body> 직전에 주입
  //
  //  ⚠️ switchTab(i, btnEl) 시그니처 주의 —
  //     동적 탭 파일의 switchTab 은 두 번째 인자 btnEl 로 `btnEl.classList.add('active')`
  //     를 수행한다. 과거엔 switchTab(N, null) 을 주입했는데, btnEl=null →
  //     `null.classList` TypeError 가 패널 토글 코드 *이전* 에서 던져지고
  //     try/catch 로 조용히 삼켜져 → 패널 전환이 안 되고 항상 0번 패널만 표시됐다.
  //     해결: ① 실제 .tab-btn[N] 요소를 찾아 넘긴다 (switchTab 정상 동작)
  //          ② switchTab 이 실패하더라도 .panel/.tab-btn 의 active 클래스를
  //             직접 토글하는 fallback 을 둔다.
  const bootScript =
    '\n<script>/* T3MES split — auto-activate TabPage #' + tabIndex + ' */\n' +
    '(function(){var I=' + tabIndex + ';\n' +
    'function activate(){\n' +
    '  var btns=document.querySelectorAll(".tab-btn");\n' +
    '  var btn=btns[I]||null;\n' +
    '  if(typeof switchTab==="function"){try{switchTab(I,btn);}catch(e){}}\n' +
    '  var panels=document.querySelectorAll(".panel");\n' +
    '  if(panels.length){\n' +
    '    panels.forEach(function(p,idx){p.classList.toggle("active",idx===I);});\n' +
    '    btns.forEach(function(b,idx){b.classList.toggle("active",idx===I);});\n' +
    '  }\n' +
    '}\n' +
    'function go(){try{activate();}catch(e){}}\n' +
    'if(document.readyState==="complete")setTimeout(go,120);' +
    'else window.addEventListener("load",function(){setTimeout(go,120);});})();\n</script>\n';
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
      writeFileEnsured(path.join(SPLIT_DIR, 'lite', stem, fname),
                       buildLiteHtml(panelHtml, liteSource,
                                     { label: t.label, index: t.index, stem, srcFile: f }));
      totalLite++;

      tabMetas.push({ index: t.index, label: t.label, full: fullRel, lite: liteRel });
    }

    out[f] = tabMetas;
    totalTabs += tabMetas.length;
    console.log(`  ${f.padEnd(48)} — ${String(tabMetas.length).padStart(3)} tabs`);
  }

  writeFileEnsured(OUT_FILE, JSON.stringify(out, null, 2));

  console.log(`\n파일: ${files.length}  ·  TabPage: ${totalTabs}`);
  console.log(`분리 산출: full ${totalFull}개, lite ${totalLite}개`);
  console.log(`  lite 내역: 정적추출 ${liteStatic}  ·  동적템플릿 ${liteTemplate}  ·  placeholder ${liteNone}`);
  console.log(`tabs json : ${OUT_FILE}`);
  console.log(`split dir : ${SPLIT_DIR}`);
}

main();
