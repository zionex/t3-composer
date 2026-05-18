import React, { useRef, useState } from 'react';

import {
  Box,
  Button,
  Typography,
  Stack,
  Paper,
  Alert,
  LinearProgress,
  CircularProgress,
  Chip,
  Divider,
  IconButton,
  Avatar,
  TextField,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import ArrowBackIcon         from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon      from '@mui/icons-material/ArrowForward';
import DescriptionIcon       from '@mui/icons-material/Description';
import CloudUploadIcon       from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon   from '@mui/icons-material/InsertDriveFile';
import CheckCircleIcon       from '@mui/icons-material/CheckCircle';
import RefreshIcon           from '@mui/icons-material/Refresh';
import TableChartIcon        from '@mui/icons-material/TableChart';
import StorageIcon           from '@mui/icons-material/Storage';
import CodeIcon              from '@mui/icons-material/Code';
import ListAltIcon           from '@mui/icons-material/ListAlt';
import DashboardIcon         from '@mui/icons-material/Dashboard';
import VerticalSplitIcon     from '@mui/icons-material/VerticalSplit';
import HorizontalSplitIcon   from '@mui/icons-material/HorizontalSplit';
import RestartAltIcon        from '@mui/icons-material/RestartAlt';

import { read as xlsxRead, utils as xlsxUtils } from 'xlsx';

import { prefillFromDesign } from './api';
import { withGridDefaultProps } from './constants';
import StepByStepWizard from './StepByStepWizard';
import { createInitialSpecFromDesign, mergeAiSpecIntoBaseSpec } from './wizardState';

const ACCENT = '#2563eb';
const ACCENT_GRAD = 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';

// =====================================================================
// Excel 파싱 결과(parsed + layoutSizes) → LayoutDesigner 의 layoutConfig 로 변환
//   · Query 시트를 우선 파싱해 grid 별 SP 이름을 정확히 매핑
//   · 누락분은 전체 시트 스캔 + grid 번호 매칭으로 fallback
// =====================================================================
const COLS_DEFAULT = 12;
const BASE_H       = 10;

// SP 네이밍 — SP_UI_* 뿐 아니라 SP_EPA_*, SP_COMM_*, SP_<프로젝트별>_* 을 폭넓게 매칭
//   · "SP_" + 알파벳 그룹 + "_" + 알파벳/숫자/_ 조합
//   · 괄호/공백/[] 등에서도 `\b` 로 자연스럽게 경계 인식
const SP_PATTERN = /\bSP_[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+\b/g;

// 액션 키워드 맵 (Query TAB 에서 조회/저장/수정/삭제 열·셀 식별용)
const ACTION_KEYWORDS = {
  read:   ['조회', '쿼리', 'query', 'select', 'read'],
  create: ['저장', '입력', '생성', '등록', 'save', 'insert', 'create'],
  update: ['수정', '변경', '갱신', 'update', 'modify'],
  delete: ['삭제', 'delete', 'remove'],
};

// Parameters 컬럼 식별용 키워드 (Excel 이 파라미터 열을 포함할 때 사용)
const PARAM_KEYWORDS = ['파라미터', 'parameter', 'parameters', 'params', '인자', 'argument'];

// 액션별 기본 Parameters 템플릿 (Excel 에 Parameters 가 없을 때 fallback)
const DEFAULT_PARAMS_BY_ACTION = {
  read:   '{\n  "planScope": ":planScope"\n}',
  create: '{\n  "rows": ":changes"\n}',
  update: '{\n  "rows": ":changes"\n}',
  delete: '{\n  "rows": ":selected"\n}',
};

function detectAction(text) {
  const s = String(text || '').toLowerCase().trim();
  if (!s || s.length > 30) return null;
  for (const [action, kws] of Object.entries(ACTION_KEYWORDS)) {
    for (const kw of kws) {
      const kwLower = kw.toLowerCase();
      if (/^[가-힣]/.test(kwLower)) {
        if (s.includes(kwLower)) return action;
      } else {
        if (new RegExp(`\\b${kwLower}\\b`).test(s)) return action;
      }
    }
  }
  return null;
}

function detectGridNum(text) {
  const s = String(text || '').trim();
  if (!s || s.length > 20) return null;
  const m1 = s.match(/(?:그리드|grid|^g)\s*[:]?\s*(\d+)/i);
  if (m1) return parseInt(m1[1], 10);
  const m2 = s.match(/^(\d{1,2})$/);
  if (m2) {
    const n = parseInt(m2[1], 10);
    if (n >= 1 && n <= 99) return n;
  }
  return null;
}

// 1) Query TAB 전용 파서 — 헤더 가로 배열 / 세로 배열 양쪽 지원
function findQuerySheet(sheets) {
  if (!Array.isArray(sheets)) return null;
  // Query / 쿼리 / SP / Procedure 등 이름 후보
  return sheets.find(s => /^(query|queries|쿼리|procedure|sp|sp[-_ ]?list)$/i.test(s?.name || ''))
      || sheets.find(s => /query|쿼리|procedure/i.test(s?.name || ''))
      || null;
}

// Parameters 후보 셀에서 JSON 블록 또는 { … } 텍스트 추출
function cleanParamsCell(raw) {
  const s = String(raw || '').trim();
  if (!s) return null;
  const jsonMatch = s.match(/\{[\s\S]*\}/);
  if (jsonMatch) return jsonMatch[0].trim();
  return s.length > 0 ? s : null;
}

// "조회 파라미터", "Query Parameters" 처럼 action+params 혼합 헤더 감지
function detectActionParamHeader(text) {
  const s = String(text || '').toLowerCase();
  if (!s) return null;
  const action = detectAction(s);
  if (!action) return null;
  const hasParam = PARAM_KEYWORDS.some(k => s.includes(k.toLowerCase()));
  return hasParam ? action : null;
}

function parseQuerySheet(sheet, layoutGrids) {
  if (!sheet || !Array.isArray(sheet.rawRows)) return {};
  const rows = sheet.rawRows;
  const result = {}; // { gridNum: { read, create, update, delete, readParams, ... } }

  // ---- (A) 열(column) 기반 헤더 감지 ----
  //   예: | Grid | 조회 | 조회 파라미터 | 저장 | 저장 파라미터 | ... |
  let headerRowIdx = -1;
  const colMap = {};       // { action: col }  — SP 이름 열
  const paramColMap = {};  // { action: col }  — Parameters 열
  let gridCol = -1;
  for (let r = 0; r < Math.min(rows.length, 30); r += 1) {
    const row = rows[r];
    if (!Array.isArray(row)) continue;
    const found = {};
    const foundParam = {};
    let localGridCol = -1;
    // 1-pass: "조회 파라미터" 같은 혼합 헤더 먼저 표시
    row.forEach((cell, c) => {
      const combo = detectActionParamHeader(cell);
      if (combo && foundParam[combo] === undefined) foundParam[combo] = c;
    });
    // 2-pass: 일반 action 헤더 (이미 param 헤더로 잡힌 열은 제외)
    row.forEach((cell, c) => {
      if (Object.values(foundParam).includes(c)) return;
      const action = detectAction(cell);
      if (action && found[action] === undefined) found[action] = c;
      if (localGridCol === -1 && /(그리드|grid)/i.test(String(cell || ''))) {
        localGridCol = c;
      }
    });
    if (Object.keys(found).length >= 2) {
      headerRowIdx = r;
      Object.assign(colMap, found);
      Object.assign(paramColMap, foundParam);
      gridCol = localGridCol;
      break;
    }
  }

  if (headerRowIdx >= 0) {
    for (let r = headerRowIdx + 1; r < rows.length; r += 1) {
      const row = rows[r];
      if (!Array.isArray(row)) continue;
      let gridNum = gridCol >= 0 ? detectGridNum(row[gridCol]) : null;
      if (gridNum === null && row[0] !== undefined) gridNum = detectGridNum(row[0]);
      if (gridNum === null || gridNum < 1 || gridNum > 99) continue;
      const entry = result[gridNum] || {};
      Object.entries(colMap).forEach(([action, col]) => {
        const cellText = String(row[col] || '');
        const m = cellText.match(SP_PATTERN);
        if (m && m[0]) entry[action] = m[0].toUpperCase();
      });
      Object.entries(paramColMap).forEach(([action, col]) => {
        const raw = cleanParamsCell(row[col]);
        if (raw) entry[`${action}Params`] = raw;
      });
      if (Object.keys(entry).length) result[gridNum] = entry;
    }
    if (Object.keys(result).length) return result;
  }

  // ---- (B) 행(row) 기반 state-machine 파싱 ----
  //   · 각 행에서 grid 마커 / action 마커 / SP 를 감지
  //   · 현재 "grid context" 와 "action context" 를 유지
  //   · "공통코드", "코드마스터" 같은 reference 섹션 진입 시 해당 섹션의 SP 는 모두 스킵
  //   · Reference 성 SP 이름(COMM/CODE_LIST/REF 등) 은 추가로 필터링
  //   · Grid 가 1개인 layout 은 모든 SP 를 그 grid 에 자동 배정
  //   · 다중 grid 에서 grid context 가 결정되지 않은 SP 는 배정하지 않음 (오배정 방지)
  let currentGrid   = null;
  let currentAction = null;
  let inReference   = false;

  // grid 가 1개뿐이면 자동 default 컨텍스트
  const singleGridDefault = (Array.isArray(layoutGrids) && layoutGrids.length === 1)
    ? (layoutGrids[0]?.n || 1) : null;

  const isRefSp = (sp) => REFERENCE_SP_RE.test(sp);

  for (const row of rows) {
    if (!Array.isArray(row)) continue;
    const cellStrs = row.map(c => String(c || '').trim());
    const rowText  = cellStrs.join(' | ');
    if (!rowText.trim()) continue;

    // 1) Reference 섹션 진입/이탈 판별
    const hitsRefLabel = cellStrs.some(s => REFERENCE_LABEL_RE.test(s));
    if (hitsRefLabel) {
      inReference = true;
      // reference 섹션 진입 시 grid context 는 초기화 (뒤따르는 SP 가 ref 로 편입되지 않게)
      currentGrid = null;
    }

    // 2) Grid 마커 감지 (명시적 번호 / 위치 / sheet ID)
    const detectedGrid = detectGridFromRow(row, layoutGrids);
    if (detectedGrid !== null) {
      currentGrid = detectedGrid;
      inReference = false;  // grid 섹션으로 들어옴
    }

    // 3) Action 마커 감지
    const rowAction = cellStrs.map(detectAction).find(a => a);
    if (rowAction) currentAction = rowAction;

    // 4) SP 이름
    const matches = rowText.match(SP_PATTERN);
    if (!matches) continue;

    // 5) Parameters 후보 셀 (JSON 모양)
    let rowParams = null;
    for (const cell of row) {
      const cleaned = cleanParamsCell(cell);
      if (cleaned && cleaned.startsWith('{') && !cleaned.match(SP_PATTERN)) {
        rowParams = cleaned; break;
      }
    }

    // 6) Reference 섹션이면 grid 배정에서 제외
    if (inReference) continue;
    // 7) Action 이 없으면 스킵
    if (!currentAction) continue;
    // 8) Grid context 없음 — 1-grid layout 이면 default 로 보강, 아니면 스킵
    if (currentGrid === null) {
      if (singleGridDefault !== null) currentGrid = singleGridDefault;
      else continue;
    }

    const entry = result[currentGrid] || {};
    for (const sp of matches) {
      const spUpper = sp.toUpperCase();
      if (isRefSp(spUpper)) continue;
      const a = currentAction;
      if (a === 'create' && entry.create && !entry.update) {
        entry.update = spUpper;
        if (rowParams) entry.updateParams = rowParams;
      } else if (!entry[a]) {
        entry[a] = spUpper;
        if (rowParams) entry[`${a}Params`] = rowParams;
      }
    }
    result[currentGrid] = entry;
  }
  return result;
}

// Excel 전체 시트에서 SP_UI_* 네이밍 패턴을 긁어 모음 (fallback 용)
function collectAllSps(sheets) {
  const all = [];
  for (const sheet of sheets || []) {
    if (!Array.isArray(sheet?.rawRows)) continue;
    for (const row of sheet.rawRows) {
      if (!Array.isArray(row)) continue;
      for (const cell of row) {
        if (typeof cell !== 'string') continue;
        const matches = cell.match(SP_PATTERN);
        if (matches) matches.forEach(m => {
          const u = m.toUpperCase();
          if (!all.includes(u)) all.push(u);
        });
      }
    }
  }
  return all;
}

// ─ Reference(참조 데이터) 섹션 / SP 감지 ─
//   "공통코드", "코드마스터" 같은 label 구간의 SP 는 grid 의 메인 CRUD 가 아니라 드롭다운·옵션용
//   자동 배정 대상에서 제외해야 함
const REFERENCE_LABEL_RE = /공통\s*코드|코드\s*마스터|코드\s*목록|공통\s*조회|공통|참조|lookup|reference|code\s*master|common\s*code/i;
// SP 이름에 전형적인 reference 접미어
const REFERENCE_SP_RE = /(?:^|_)(COMM|COMMON|CODE_LIST|CODE_LST|REF|REFERENCE|LOOKUP)(?:_|$)/i;

// 행 텍스트에서 grid 번호를 더 풍부하게 감지
//   명시: "그리드1", "Grid 1", "G1"
//   위치: "좌", "우", "상", "하", "좌상", "우상", ...
//   sheet/id 참조: layoutGrids 메타를 사용해 "grid-1" 같은 값을 grid 번호로 변환
function detectGridFromRow(row, layoutGrids) {
  const cellStrs = row.map(c => String(c || '').trim());
  const joined = cellStrs.join(' | ').toLowerCase();

  for (const s of cellStrs) {
    if (!s) continue;
    const n = detectGridNum(s);
    if (n !== null) return n;
  }

  // layout 메타와 매칭
  for (const s of cellStrs) {
    if (!s) continue;
    const low = s.toLowerCase();
    const hit = (layoutGrids || []).find(g =>
      (g.id && low === String(g.id).toLowerCase()) ||
      (g.sheetName && low === String(g.sheetName).toLowerCase()) ||
      (g.id && low.includes(String(g.id).toLowerCase()))
    );
    if (hit?.n) return hit.n;
  }

  // 위치 키워드 기반 (layout orientation 참고)
  const orient = _currentOrientation;
  const hasLabel = (re) => cellStrs.some(s => re.test(s));
  if (orient === 'H') {
    if (hasLabel(/^좌\b|왼쪽|left(?!\s*join)/i))  return 1;
    if (hasLabel(/^우\b|오른쪽|right\b/i))         return 2;
  }
  if (orient === 'V') {
    if (hasLabel(/^상\b|위쪽|top\b/i))     return 1;
    if (hasLabel(/^하\b|아래쪽|bottom\b/i)) return 2;
  }
  if (orient === 'G') {
    if (/좌\s*상|top[- ]?left/i.test(joined))    return 1;
    if (/우\s*상|top[- ]?right/i.test(joined))   return 2;
    if (/좌\s*하|bottom[- ]?left/i.test(joined)) return 3;
    if (/우\s*하|bottom[- ]?right/i.test(joined)) return 4;
  }
  return null;
}

// parseQuerySheet 에 layoutGrids 를 넘기기 위한 module-level 컨텍스트
let _currentOrientation = null;

// 감지된 SP 이름/Params 를 dataBinding 구조로 변환
//   sps = { read, create, update, delete, readParams?, createParams?, updateParams?, deleteParams? }
function spsToBinding(sps) {
  const binding = {};
  if (sps.read) {
    binding.source = 'sp';
    binding.spName = sps.read;
    binding.params = sps.readParams || DEFAULT_PARAMS_BY_ACTION.read;
  }
  if (sps.create) binding.create = {
    source: 'sp', spName: sps.create,
    params: sps.createParams || DEFAULT_PARAMS_BY_ACTION.create,
  };
  if (sps.update) binding.update = {
    source: 'sp', spName: sps.update,
    params: sps.updateParams || DEFAULT_PARAMS_BY_ACTION.update,
  };
  if (sps.delete) binding.delete = {
    source: 'sp', spName: sps.delete,
    params: sps.deleteParams || DEFAULT_PARAMS_BY_ACTION.delete,
  };
  return binding;
}

// (이전: analyzeQueryWithAI / handleAIReanalyze 는 Step3 Layout 정리에서만 사용됨.
//   2026-04 단순화로 Step3 가 제거되어 이 함수도 함께 제거. wizard 진입 시 호출되는
//   prefillFromDesign 가 9단계 전체를 LLM 한 번 호출로 prefill.)

// grid 의 SP/Params 해석 — Query TAB 의 컨텍스트 기반 parsing 결과만 사용
//   · 위치/섹션 마커가 명확할 때만 grid 에 배정됨 (잘못된 자동 배정 방지)
//   · Q1/Q2 같은 접미어 숫자로 grid 를 유추하지 않음
function resolveSpsForGrid(queryMap, _allSps, grid) {
  const n = grid?.n || null;
  if (!n) return { read: null, create: null, update: null, delete: null,
                   readParams: null, createParams: null, updateParams: null, deleteParams: null };
  const byLabel = queryMap[n] || {};
  return {
    read:         byLabel.read   || null,
    create:       byLabel.create || null,
    update:       byLabel.update || null,
    delete:       byLabel.delete || null,
    readParams:   byLabel.readParams   || null,
    createParams: byLabel.createParams || null,
    updateParams: byLabel.updateParams || null,
    deleteParams: byLabel.deleteParams || null,
  };
}

function parsedToLayoutConfig(parsed, sizes) {
  const parsedLayout = parsed?.layout;
  if (!parsedLayout || !Array.isArray(parsedLayout.grids) || parsedLayout.grids.length === 0) {
    return defaultMainConfig();
  }
  const grids = parsedLayout.grids;
  const orientation = parsedLayout.orientation;
  const layers = [];
  const querySheet = findQuerySheet(parsed?.sheets);
  // parser 가 orientation 을 보고 위치 라벨(좌/우/상/하)을 해석할 수 있도록 module-level 에 전달
  _currentOrientation = orientation;
  const queryMap   = querySheet ? parseQuerySheet(querySheet, grids) : {};
  _currentOrientation = null;
  const allSps     = collectAllSps(parsed?.sheets);

  const titleOf = (g) => {
    const tabsCnt = g.tabs?.length || 0;
    const base = `${g.id}${g.position ? ` (${g.position})` : ''}`;
    return tabsCnt >= 2 ? `${base} · TAB ${tabsCnt}` : base;
  };

  // 공통 layer 생성 헬퍼 — Query TAB + fallback 으로 SP 자동 연결.
  // grid 에 tabs 가 2개 이상이면 CONTAINER_TAB 으로 표현 (각 tab 은 GRID_BASE 자식).
  // 동일 grid 시트의 컬럼 명세는 dataBinding.gridColumns 에 함께 부착해 wizard Step1 LayoutDesigner 가 그대로 활용 가능.
  const buildLayer = (key, pos, g) => {
    const sps = resolveSpsForGrid(queryMap, allSps, g);
    const binding = spsToBinding(sps);
    const gridSheet = (parsed?.sheets || []).find((s) => s.name === g.sheetName);
    const gridColInfo = gridSheet ? parseGridColumns(gridSheet) : null;
    if (Array.isArray(gridColInfo?.rows) && gridColInfo.rows.length > 0) {
      binding.gridColumns = gridColInfo.rows;
    }

    const tabsCount = Array.isArray(g.tabs) ? g.tabs.length : 0;
    const isTabContainer = tabsCount >= 2;
    const componentType = isTabContainer ? 'CONTAINER_TAB' : 'GRID_BASE';

    const layer = {
      key, ...pos, title: titleOf(g), componentType,
    };
    if (Object.keys(binding).length) layer.dataBinding = binding;
    if (isTabContainer) {
      layer.tabs = g.tabs.map((t, i) => ({
        id: `tab_${key}_${i + 1}`,
        label: t.label || `탭 ${i + 1}`,
        componentType: 'GRID_BASE',
      }));
    }
    layer.props = withGridDefaultProps(layer.componentType, layer.props);
    return layer;
  };

  if (orientation === 'H') {
    const sizeArr = Array.isArray(sizes) && sizes.length === grids.length
      ? sizes : grids.map(() => 100 / grids.length);
    let cumX = 0;
    grids.forEach((g, i) => {
      const isLast = i === grids.length - 1;
      const w = isLast ? Math.max(1, COLS_DEFAULT - cumX)
                       : Math.max(1, Math.round((sizeArr[i] / 100) * COLS_DEFAULT));
      layers.push(buildLayer(`L${i + 1}`, { x: cumX, y: 0, w, h: BASE_H }, g));
      cumX += w;
    });
  } else if (orientation === 'V') {
    const sizeArr = Array.isArray(sizes) && sizes.length === grids.length
      ? sizes : grids.map(() => 100 / grids.length);
    let cumY = 0;
    grids.forEach((g, i) => {
      const isLast = i === grids.length - 1;
      const h = isLast ? Math.max(2, BASE_H - cumY)
                       : Math.max(2, Math.round((sizeArr[i] / 100) * BASE_H));
      layers.push(buildLayer(`L${i + 1}`, { x: 0, y: cumY, w: COLS_DEFAULT, h }, g));
      cumY += h;
    });
  } else if (orientation === 'G') {
    const rs = sizes?.rows || [50, 50];
    const cs = sizes?.cols || [50, 50];
    const r1 = Math.max(2, Math.round((rs[0] / 100) * BASE_H));
    const r2 = Math.max(2, BASE_H - r1);
    const c1 = Math.max(1, Math.round((cs[0] / 100) * COLS_DEFAULT));
    const c2 = Math.max(1, COLS_DEFAULT - c1);
    const positions = [
      { x: 0,  y: 0,  w: c1, h: r1 },
      { x: c1, y: 0,  w: c2, h: r1 },
      { x: 0,  y: r1, w: c1, h: r2 },
      { x: c1, y: r1, w: c2, h: r2 },
    ];
    grids.slice(0, 4).forEach((g, i) => {
      layers.push(buildLayer(`L${i + 1}`, positions[i], g));
    });
  } else {
    layers.push({ key: 'L1', x: 0, y: 0, w: COLS_DEFAULT, h: BASE_H,
                  title: 'Main Grid', componentType: 'GRID_BASE',
                  props: withGridDefaultProps('GRID_BASE') });
  }

  return {
    filterBar: { h: 2, items: [] },
    layers,
    cols: COLS_DEFAULT,
    rowHeight: 30,
  };
}

function defaultMainConfig() {
  return {
    filterBar: { h: 2, items: [] },
    layers: [{ key: 'L1', x: 0, y: 0, w: COLS_DEFAULT, h: BASE_H,
               title: 'Main Grid', componentType: 'GRID',
               props: withGridDefaultProps('GRID') }],
    cols: COLS_DEFAULT,
    rowHeight: 30,
  };
}

/** layoutConfig → LLM 프롬프트용 사람-읽기 가능 텍스트 */
function layoutConfigToPrompt(label, cfg) {
  if (!cfg || !Array.isArray(cfg.layers)) return '';
  const items = cfg.filterBar?.items || [];
  const out = [];
  out.push(`[${label}]`);
  if (items.length > 0) {
    out.push(`- FilterBar 항목 (${items.length}): ${items.map(it => it.label || it.key).join(', ')}`);
  } else {
    out.push('- FilterBar: 표시 안함 (filter 항목 없음)');
  }
  out.push(`- Layer 구성 (${cfg.layers.length}개, cols=${cfg.cols || 12}):`);
  cfg.layers.forEach(l => {
    out.push(`    · ${l.key} [${l.componentType || 'GRID'}] x=${l.x},y=${l.y},w=${l.w},h=${l.h}  "${l.title || ''}"`);
    const propEntries = Object.entries(l.props || {});
    if (propEntries.length > 0) {
      const propStr = propEntries.map(([k, v]) => `${k}=${v}`).join(', ');
      out.push(`        - Props: ${propStr}`);
    }
    const gridCols = Array.isArray(l.dataBinding?.gridColumns) ? l.dataBinding.gridColumns : [];
    if (gridCols.length > 0) {
      out.push(`        - GridColumns (${gridCols.length}):`);
      gridCols.forEach((c, i) => {
        const fmt = c.format === 'string' ? 'text' : (c.format || 'text');
        const base = `${i + 1}. ${c.column || '?'} · "${c.name || ''}"`
          + (c.i18nKey ? ` · i18n=${c.i18nKey}` : '')
          + ` · align=${c.align || 'left'}`
          + ` · order=${c.order ?? i + 1}`
          + ` · visible=${c.visible !== false}`
          + ` · dataType=${c.dataType || 'text'}`
          + ` · size=${c.size ?? 120}`
          + ` · format=${fmt}`;
        if (fmt === 'dropdown') {
          if (c.dropdownSource === 'sp') {
            out.push(`            · ${base} · src=SP(${c.dropdownSpName || '?'})`
                     + ` value=${c.dropdownValueField || '?'}`
                     + ` display=${c.dropdownDisplayField || '?'}`);
          } else {
            const items = Array.isArray(c.dropdownItems) ? c.dropdownItems : [];
            const preview = items.slice(0, 5).map(it => `${it.value || '?'}=${it.display || '?'}`).join(', ');
            out.push(`            · ${base} · src=manual items=[${preview}${items.length > 5 ? ', ...' : ''}]`);
          }
        } else {
          out.push(`            · ${base}`);
        }
      });
    }
  });
  return out.join('\n');
}

/** 재사용 입체 보더 (화면 구성기 Landing 과 통일된 스타일) */
function embossedPaper(accent, hovered = false) {
  return {
    position: 'relative',
    borderRadius: 3,
    bgcolor: '#fff',
    border: '1px solid rgba(15,23,42,0.08)',
    boxShadow: hovered
      ? [
          `0 0 0 4px ${accent}18`,
          `0 18px 48px -12px ${accent}55`,
          `0 1px 0 rgba(255,255,255,0.9) inset`,
          `0 -1px 0 rgba(15,23,42,0.06) inset`,
        ].join(', ')
      : [
          `0 1px 0 rgba(255,255,255,0.9) inset`,
          `0 -1px 0 rgba(15,23,42,0.04) inset`,
          `0 6px 16px -6px rgba(15,23,42,0.12)`,
          `0 14px 36px -16px rgba(15,23,42,0.18)`,
        ].join(', '),
    transition: 'all 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
  };
}

const STEPS = [
  { n: 1, title: '설계서 업로드', sub: 'Upload Excel Design Doc' },
  { n: 2, title: '시트 검토',     sub: 'Review Parsed Sheets · 9-Step Wizard 진입' },
];

function ModeNewFromDesign({ onBack }) {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState(null);
  const [title, setTitle] = useState('');
  // 9단계 Wizard 진입 상태 — STEPS 4 의 "다음" 클릭 시 prefilledSpec 빌드 후 전환
  const [wizardEntered, setWizardEntered] = useState(false);
  const [prefilledSpec, setPrefilledSpec] = useState(null);

  // AI 자동 분석 — wizard 진입 직전 LLM 한 번 호출로 9단계 prefill 보강 (default ON)
  const [useAiPrefill, setUseAiPrefill] = useState(true);
  const [aiPrefilling, setAiPrefilling] = useState(false);
  const [aiInfo, setAiInfo]             = useState(null);
  // 레이아웃 각 Layer 의 사이즈 비율 (사용자가 SplitPanel 로 조정)
  // H/V: [size1, size2, ...]  · G(격자): { rows: [r1, r2], cols: [c1, c2] }
  const [layoutSizes, setLayoutSizes] = useState(null);


  const inputRef = useRef(null);

  const handleFileSelect = async (f) => {
    if (!f) return;
    if (!/\.xlsx?$/i.test(f.name)) {
      setError('엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.');
      return;
    }
    setError(null);
    setFile(f);
    setTitle(`설계서 기반 — ${f.name.replace(/\.xlsx?$/i, '')}`);
    setParsing(true);
    try {
      if (typeof xlsxRead !== 'function') {
        throw new Error('xlsx 모듈이 올바르게 로드되지 않았습니다 (read is ' + typeof xlsxRead + '). 브라우저 하드 새로고침(Ctrl+Shift+R) 또는 dev 서버 재시작이 필요할 수 있습니다.');
      }
      const data = await f.arrayBuffer();
      const wb = xlsxRead(data, { type: 'array' });
      const sheetSummaries = wb.SheetNames.map((name) => {
        const sheet = wb.Sheets[name];
        // 모든 행을 로딩 (미리보기는 50행, 프롬프트용 rawRows 는 전체 유지)
        const rows = xlsxUtils.sheet_to_json(sheet, { header: 1, defval: '' });
        return {
          name,
          rowCount: rows.length,
          preview: rows.slice(0, Math.min(rows.length, 50)),
          rawRows: rows,
        };
      });
      const parsedDoc = { sheetNames: wb.SheetNames, sheets: sheetSummaries };
      parsedDoc.layout   = analyzeLayout(parsedDoc);
      parsedDoc.overview = extractOverview(parsedDoc);
      setParsed(parsedDoc);

      // 기본 사이즈 초기화 — Excel 레이아웃 시트의 비율을 먼저 시도, 실패 시 균등 분배
      if (parsedDoc.layout) {
        const L = parsedDoc.layout;
        const extracted = extractSizeRatiosFromSheet(parsedDoc, L);
        parsedDoc.layout.excelSizes = extracted; // UI 에서 "Excel 기준" 표시용

        if (L.orientation === 'G') {
          // 격자: row/col 별도 비율이 있으면 그대로, 아니면 50:50
          if (extracted && extracted.rows && extracted.cols) {
            setLayoutSizes({ rows: extracted.rows, cols: extracted.cols });
          } else {
            setLayoutSizes({ rows: [50, 50], cols: [50, 50] });
          }
        } else {
          // 좌우/상하: 감지된 비율 우선, 없으면 균등 분배
          if (Array.isArray(extracted) && extracted.length === L.grids.length) {
            setLayoutSizes(extracted);
          } else {
            const n = L.grids.length || 2;
            setLayoutSizes(new Array(n).fill(100 / n));
          }
        }
      } else {
        setLayoutSizes(null);
      }
    } catch (e) {
      setError('엑셀 파싱 실패: ' + (e?.message || ''));
    } finally {
      setParsing(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer?.files?.[0];
    if (f) handleFileSelect(f);
  };

  /**
   * 4-step UI (업로드 → 검토 → Layout 정리 → 확인) 마지막 단계의 "다음" 버튼.
   * 통합 (2026-04): 직접 createSession 하지 않고 9단계 Wizard 로 위임.
   *   - parsed 결과 + layoutSizes + mainLayoutConfig 를 createInitialSpecFromDesign 로
   *     변환해 prefilledSpec 생성
   *   - StepByStepWizard 가 mode='NEW_FROM_DESIGN' + prefilledSpec 으로 진입
   *   - Wizard 의 Step9 Generate 버튼이 최종 createSession + LLM 호출 수행
   */
  const handleStart = async () => {
    if (!file || !parsed) return;
    setError(null);

    // 1) Step3 (Layout 정리) 가 생략되었으므로 layoutConfig 를 parsed → 자동 변환.
    //    parsedToLayoutConfig 가 SP→layer dataBinding 까지 채움 (Query 시트 분석 결과).
    const autoMainConfig = parsedToLayoutConfig(parsed, layoutSizes);

    // 2) 정규식 기반 baseline prefill — 항상 실행 (안전망). Step1/2/3/5 까지 자동 채움.
    const baseSpec = createInitialSpecFromDesign({
      parsed,
      fileName: file.name,
      layoutSizes,
      mainLayoutConfig: autoMainConfig,
    });
    console.info('[Composer/Design] baseline step1.areas:',
      JSON.stringify((baseSpec.step1_layout?.areas || []).map((a) => ({ id: a?.id, kind: a?.kind, title: a?.title }))));
    console.info('[Composer/Design] baseline step4 keys:', Object.keys(baseSpec.step4_dataBinding || {}));

    // 2) AI prefill (선택) — Step4 (dataBinding · SP 매핑) / Step6 / Step7 / Step8 까지 채움.
    let finalSpec = baseSpec;
    if (useAiPrefill) {
      setAiPrefilling(true);
      setAiInfo(null);
      try {
        const res = await prefillFromDesign({
          parsedDesign: parsed,
          fileName: file.name,
          newMenuCd: baseSpec.step2_overview?.menuCd || '',
          newTitle:  baseSpec.step2_overview?.screenName || '',
          moduleCode: baseSpec.moduleCode,
        });
        const aiSpec = res?.data?.spec;
        if (aiSpec && typeof aiSpec === 'object') {
          console.info('[Composer/Design] AI step4 entries:',
            JSON.stringify(Object.fromEntries(Object.entries(aiSpec.step4_dataBinding || {}).map(([k, v]) => [
              k, { source: v?.source, spName: v?.spName, allSpNamesCount: Array.isArray(v?.allSpNames) ? v.allSpNames.length : 0 }
            ]))));
          console.info('[Composer/Design] AI step7 fields count:',
            Array.isArray(aiSpec.step7_filter?.fields) ? aiSpec.step7_filter.fields.length : 0);
          finalSpec = mergeAiSpecIntoBaseSpec(baseSpec, aiSpec);
          setAiInfo({
            modelName: res?.data?.modelName,
            stepCount: ['step1_layout','step2_overview','step3_components','step4_dataBinding',
                        'step5_columns','step6_cascade','step7_filter','step8_filterCascade']
                       .filter((k) => aiSpec[k] && Object.keys(aiSpec[k]).length > 0).length,
          });
        }
      } catch (e) {
        const msg = e?.response?.data?.message || e?.message || 'AI 분석 실패';
        console.warn('[Composer/Design] AI prefill 실패 — 정규식 결과로 진행:', msg);
        setError(`AI 분석 실패 (정규식 결과로 진행): ${msg}`);
      } finally {
        setAiPrefilling(false);
      }
    }

    setPrefilledSpec(finalSpec);
    setWizardEntered(true);
  };

  const reset = () => {
    setFile(null);
    setParsed(null);
    setLayoutSizes(null);
    setError(null);
    setTitle('');
    setStep(1);
    setWizardEntered(false);
    setPrefilledSpec(null);
    setAiPrefilling(false);
    setAiInfo(null);
  };

  // 9단계 Wizard 진입 — StepByStepWizard 에 NEW_FROM_DESIGN 모드로 위임
  if (wizardEntered && prefilledSpec) {
    return (
      <StepByStepWizard
        mode="NEW_FROM_DESIGN"
        prefilledSpec={prefilledSpec}
        initialModuleCode={prefilledSpec.moduleCode}
        onBack={() => setWizardEntered(false)}
      />
    );
  }

  const canNext = step === 1 ? !!parsed && !parsing : !!parsed;

  return (
    <Box sx={{
      flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0,
      bgcolor: '#f1f5f9',
      backgroundImage: 'radial-gradient(circle at 20% 0%, rgba(37,99,235,0.08), transparent 55%), radial-gradient(circle at 80% 100%, rgba(29,78,216,0.06), transparent 50%)',
      p: 2, gap: 2, overflow: 'hidden',
    }}>

      {/* ===== Wizard Header ===== */}
      <Paper elevation={0} sx={{ ...embossedPaper(ACCENT), px: 2.5, py: 1.5, flexShrink: 0 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <IconButton onClick={onBack} size="small"
                      sx={{ bgcolor: '#f1f5f9', border: '1px solid #e2e8f0',
                            boxShadow: '0 1px 2px rgba(15,23,42,0.08), 0 1px 0 rgba(255,255,255,0.8) inset' }}>
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Avatar sx={{
            width: 40, height: 40,
            background: ACCENT_GRAD, color: '#fff',
            boxShadow: `0 4px 12px ${ACCENT}55, 0 1px 0 rgba(255,255,255,0.3) inset`,
          }}>
            <DescriptionIcon sx={{ fontSize: 22 }} />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
              설계서 기반 생성
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              {STEPS[step - 1].sub} · Step {step} / {STEPS.length}
            </Typography>
          </Box>
          {file && (
            <Chip
              icon={<InsertDriveFileIcon sx={{ fontSize: 14 }} />}
              label={file.name}
              size="small"
              onDelete={step === 1 ? undefined : reset}
              sx={{
                bgcolor: `${ACCENT}14`, color: ACCENT, fontWeight: 700,
                fontFamily: 'monospace', border: `1px solid ${ACCENT}44`,
              }}
            />
          )}
        </Stack>

        {/* Progress Stepper */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1.5 }}>
          {STEPS.map((s, i) => {
            const isActive = s.n === step;
            const isDone   = s.n <  step;
            return (
              <React.Fragment key={s.n}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 'none' }}>
                  <Avatar sx={{
                    width: 28, height: 28, fontSize: 13, fontWeight: 800,
                    bgcolor: isDone ? '#10b981' : isActive ? ACCENT : '#e2e8f0',
                    color: (isDone || isActive) ? '#fff' : '#94a3b8',
                    boxShadow: isActive
                      ? `0 0 0 4px ${ACCENT}22, 0 2px 6px ${ACCENT}55, 0 1px 0 rgba(255,255,255,0.3) inset`
                      : isDone
                        ? `0 0 0 3px #10b98122, 0 1px 0 rgba(255,255,255,0.3) inset`
                        : `0 1px 0 rgba(255,255,255,0.8) inset, 0 -1px 0 rgba(15,23,42,0.05) inset`,
                    transition: 'all 0.25s',
                  }}>
                    {isDone ? '✓' : s.n}
                  </Avatar>
                  <Box>
                    <Typography variant="caption" sx={{
                      fontWeight: isActive ? 800 : 600,
                      color: isActive ? '#0f172a' : isDone ? '#0f766e' : '#94a3b8',
                      display: 'block', lineHeight: 1.1,
                    }}>
                      {s.title}
                    </Typography>
                  </Box>
                </Stack>
                {i < STEPS.length - 1 && (
                  <Box sx={{
                    flex: 1, height: 2, mx: 1,
                    bgcolor: isDone ? '#10b981' : '#e2e8f0',
                    borderRadius: 1,
                    transition: 'all 0.25s',
                  }} />
                )}
              </React.Fragment>
            );
          })}
        </Box>
      </Paper>

      {/* ===== Wizard Body ===== */}
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        {step === 1 && (
          <StepUpload
            file={file}
            parsed={parsed}
            parsing={parsing}
            dragOver={dragOver}
            setDragOver={setDragOver}
            inputRef={inputRef}
            handleFileSelect={handleFileSelect}
            handleDrop={handleDrop}
            onReset={reset}
            error={error}
          />
        )}
        {step === 2 && <StepReview file={file} parsed={parsed} />}
      </Box>

      {/* ===== Wizard Footer ===== */}
      <Paper elevation={0} sx={{ ...embossedPaper(ACCENT), px: 2.5, py: 1.2, flexShrink: 0 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon fontSize="small" />}
            disabled={step === 1}
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            sx={{
              borderColor: '#cbd5e1', color: '#475569',
              boxShadow: '0 1px 0 rgba(255,255,255,0.9) inset, 0 1px 2px rgba(15,23,42,0.08)',
              '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' },
            }}
          >
            이전
          </Button>
          <Box sx={{ flex: 1, textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
              {STEPS[step - 1].title}
              <Box component="span" sx={{ color: '#94a3b8', ml: 0.5 }}>
                ({step}/{STEPS.length})
              </Box>
            </Typography>
          </Box>
          {step < STEPS.length ? (
            <Button
              variant="contained"
              disableElevation
              endIcon={<ArrowForwardIcon />}
              disabled={!canNext}
              onClick={() => setStep((s) => Math.min(STEPS.length, s + 1))}
              sx={{
                bgcolor: ACCENT, px: 3, fontWeight: 700,
                boxShadow: `0 4px 14px ${ACCENT}55, 0 1px 0 rgba(255,255,255,0.5) inset`,
                '&:hover': { bgcolor: ACCENT, filter: 'brightness(1.1)' },
              }}
            >
              다음
            </Button>
          ) : (
            <Stack direction="row" spacing={1.5} alignItems="center">
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={useAiPrefill}
                    disabled={aiPrefilling}
                    onChange={(e) => setUseAiPrefill(e.target.checked)}
                  />
                }
                label={
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    AI 자동 분석 (9단계 prefill)
                  </Typography>
                }
                sx={{ mr: 1 }}
              />
              {aiInfo && (
                <Chip size="small" color="success" variant="outlined"
                      label={`AI ${aiInfo.stepCount || 0}/8 step 보강`} />
              )}
              <Button
                variant="contained"
                disableElevation
                endIcon={aiPrefilling ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <ArrowForwardIcon />}
                disabled={!file || !parsed || aiPrefilling}
                onClick={handleStart}
                sx={{
                  background: ACCENT_GRAD, px: 3, fontWeight: 700,
                  boxShadow: `0 4px 14px ${ACCENT}88, 0 1px 0 rgba(255,255,255,0.5) inset`,
                  '&:hover': { filter: 'brightness(1.1)' },
                }}
              >
                {aiPrefilling ? 'AI 분석 중...' : '9단계 Wizard 진입'}
              </Button>
            </Stack>
          )}
        </Stack>
      </Paper>
    </Box>
  );
}

// =====================================================================
// Step 1: 파일 업로드
// =====================================================================
function StepUpload({ file, parsed, parsing, dragOver, setDragOver, inputRef, handleFileSelect, handleDrop, onReset, error }) {
  return (
    <Paper elevation={0} sx={{
      ...embossedPaper(ACCENT),
      height: '100%',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header strip */}
      <Box sx={{
        px: 3, py: 1.5,
        background: `linear-gradient(90deg, ${ACCENT}11 0%, ${ACCENT}04 100%)`,
        borderBottom: '1px solid #e2e8f0',
      }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
          ① 설계서 엑셀 파일을 업로드하세요
        </Typography>
        <Typography variant="caption" sx={{ color: '#64748b' }}>
          개요 · 레이아웃 · Grid · Table · Query 시트를 포함한 .xlsx 파일
        </Typography>
      </Box>

      {/* Drop zone */}
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3, minHeight: 0, overflow: 'auto' }}>
        <Paper
          elevation={0}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          sx={{
            width: '100%', maxWidth: 560,
            p: 5,
            cursor: 'pointer',
            borderRadius: 3,
            bgcolor: dragOver ? `${ACCENT}0c` : '#fafbfc',
            border: `2px dashed ${dragOver ? ACCENT : '#cbd5e1'}`,
            boxShadow: dragOver
              ? `0 0 0 6px ${ACCENT}22, 0 20px 40px -16px ${ACCENT}66, 0 1px 0 rgba(255,255,255,0.9) inset`
              : `0 1px 0 rgba(255,255,255,0.9) inset, 0 -1px 0 rgba(15,23,42,0.03) inset, 0 4px 12px -4px rgba(15,23,42,0.08)`,
            transition: 'all 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
            textAlign: 'center',
            '&:hover': {
              bgcolor: `${ACCENT}0a`,
              borderColor: ACCENT,
              transform: 'translateY(-2px)',
              boxShadow: `0 0 0 4px ${ACCENT}14, 0 12px 28px -10px ${ACCENT}44, 0 1px 0 rgba(255,255,255,0.9) inset`,
            },
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
            onChange={(e) => handleFileSelect(e.target.files?.[0])}
          />

          {!file ? (
            <>
              {/* Icon with glow */}
              <Avatar sx={{
                width: 96, height: 96, mx: 'auto', mb: 2,
                background: ACCENT_GRAD,
                color: '#fff',
                boxShadow: `
                  0 0 0 8px ${ACCENT}11,
                  0 0 0 16px ${ACCENT}08,
                  0 14px 32px ${ACCENT}55,
                  0 1px 0 rgba(255,255,255,0.3) inset
                `,
                animation: dragOver ? 'pulse 1.2s ease infinite' : 'none',
                '@keyframes pulse': {
                  '0%, 100%': { transform: 'scale(1)' },
                  '50%':      { transform: 'scale(1.05)' },
                },
              }}>
                <CloudUploadIcon sx={{ fontSize: 52 }} />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.5 }}>
                {dragOver ? '여기에 놓으세요' : '파일을 드래그하거나 클릭'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', mb: 1.5 }}>
                엑셀 화면설계서 (.xlsx, .xls) · 최대 20MB
              </Typography>
              <Stack direction="row" spacing={0.5} justifyContent="center" useFlexGap flexWrap="wrap">
                {['개요', '레이아웃', 'Grid', 'Table', 'Query'].map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    sx={{
                      height: 22, fontSize: 11, fontWeight: 700,
                      bgcolor: `${ACCENT}14`, color: ACCENT,
                      border: `1px solid ${ACCENT}33`,
                    }}
                  />
                ))}
              </Stack>
            </>
          ) : parsing ? (
            <>
              <Avatar sx={{
                width: 96, height: 96, mx: 'auto', mb: 2,
                bgcolor: '#fef3c7', color: '#b45309',
                boxShadow: `0 0 0 8px #fef3c744, 0 8px 20px #f59e0b55`,
              }}>
                <InsertDriveFileIcon sx={{ fontSize: 48 }} />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', mb: 1 }}>
                파싱 중...
              </Typography>
              <LinearProgress sx={{
                mt: 1, borderRadius: 2, height: 6,
                bgcolor: '#f1f5f9',
                '& .MuiLinearProgress-bar': { background: ACCENT_GRAD },
              }} />
            </>
          ) : parsed ? (
            <>
              <Avatar sx={{
                width: 96, height: 96, mx: 'auto', mb: 2,
                background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
                color: '#fff',
                boxShadow: `0 0 0 8px #10b98111, 0 14px 32px #10b98155, 0 1px 0 rgba(255,255,255,0.3) inset`,
              }}>
                <CheckCircleIcon sx={{ fontSize: 56 }} />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.3 }}>
                업로드 완료
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', fontFamily: 'monospace', mb: 1.5 }}>
                {file.name}
              </Typography>
              <Stack direction="row" spacing={0.5} justifyContent="center" flexWrap="wrap" useFlexGap>
                <Chip label={`${(file.size / 1024).toFixed(1)} KB`} size="small"
                      sx={{ height: 22, fontFamily: 'monospace', bgcolor: '#f1f5f9' }} />
                <Chip label={`시트 ${parsed.sheetNames.length}개`} size="small"
                      sx={{ height: 22, fontWeight: 700, bgcolor: `${ACCENT}14`, color: ACCENT }} />
              </Stack>
              <Button
                size="small" startIcon={<RefreshIcon fontSize="small" />}
                onClick={(e) => { e.stopPropagation(); onReset(); }}
                sx={{ mt: 2, color: '#64748b' }}
              >
                다른 파일 선택
              </Button>
            </>
          ) : null}
        </Paper>
      </Box>

      {error && (
        <Alert severity="error" sx={{ m: 2, boxShadow: '0 1px 0 rgba(255,255,255,0.9) inset' }}>
          {error}
        </Alert>
      )}
    </Paper>
  );
}

// =====================================================================
// Step 2: 시트 검토
// =====================================================================
function StepReview({ file, parsed }) {
  const [activeSheet, setActiveSheet] = useState(0);

  if (!parsed) return null;

  // 상단: Excel 파일 정보 + 화면 메타 정보 카드
  const ov = parsed.overview || {};
  const metaItems = [
    { key: 'screenId',   label: '화면 ID',   icon: '🏷', value: ov.screenId,   color: '#2563eb' },
    { key: 'screenName', label: '화면명',    icon: '📛', value: ov.screenName, color: '#7c3aed' },
    { key: 'menuPath',   label: '메뉴 위치', icon: '📂', value: ov.menuPath,   color: '#059669' },
  ].filter((m) => m.value);

  const fileInfoCard = (
    <Paper elevation={0} sx={{
      ...embossedPaper(ACCENT),
      flexShrink: 0,
      background: `linear-gradient(135deg, ${ACCENT}11 0%, ${ACCENT}04 100%)`,
      borderColor: `${ACCENT}44`,
      overflow: 'hidden',
    }}>
      {/* 파일 정보 라인 */}
      <Box sx={{
        px: 2, py: 1.2,
        display: 'flex', alignItems: 'center', gap: 1.5,
        borderBottom: metaItems.length > 0 ? `1px solid ${ACCENT}22` : 'none',
      }}>
        <Avatar sx={{
          width: 42, height: 42,
          background: ACCENT_GRAD, color: '#fff',
          boxShadow: `0 4px 12px ${ACCENT}55, 0 1px 0 rgba(255,255,255,0.3) inset`,
        }}>
          <InsertDriveFileIcon />
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: 1,
                                               color: ACCENT, textTransform: 'uppercase', display: 'block', lineHeight: 1 }}>
            설계서 파일
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.3,
                                                 fontFamily: 'monospace',
                                                 whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                      title={file?.name}>
            {file?.name || '(파일 없음)'}
          </Typography>
        </Box>
        <Stack direction="row" spacing={0.5}>
          <Chip label={`${(file?.size / 1024 || 0).toFixed(1)} KB`} size="small"
                sx={{ height: 22, fontSize: 11, fontFamily: 'monospace',
                      bgcolor: '#fff', border: '1px solid #e2e8f0' }} />
          <Chip label={`시트 ${parsed.sheetNames.length}`} size="small"
                sx={{ height: 22, fontSize: 11, fontWeight: 700,
                      bgcolor: ACCENT, color: '#fff' }} />
          {parsed.layout && (
            <Chip label={parsed.layout.typeLabel} size="small"
                  sx={{ height: 22, fontSize: 11, fontWeight: 700,
                        bgcolor: `${ACCENT}22`, color: ACCENT,
                        border: `1px solid ${ACCENT}55` }} />
          )}
        </Stack>
      </Box>

      {/* 메타 정보 라인 — 화면 ID / 화면명 / 메뉴 위치 */}
      {metaItems.length > 0 && (
        <Box sx={{
          px: 2, py: 0.9,
          display: 'grid',
          gridTemplateColumns: `repeat(${metaItems.length}, minmax(0, 1fr))`,
          gap: 1.5,
          bgcolor: '#ffffff88',
        }}>
          {metaItems.map((m) => (
            <Box key={m.key} sx={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <Box sx={{
                width: 28, height: 28, borderRadius: 1.2,
                bgcolor: `${m.color}14`, color: m.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14,
                border: `1px solid ${m.color}33`,
                boxShadow: '0 1px 0 rgba(255,255,255,0.9) inset',
                flexShrink: 0,
              }}>
                {m.icon}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="caption" sx={{
                  color: m.color, fontWeight: 800, letterSpacing: 0.5,
                  display: 'block', lineHeight: 1, fontSize: 10,
                }}>
                  {m.label}
                </Typography>
                <Typography variant="body2" sx={{
                  color: '#0f172a', fontWeight: 700, lineHeight: 1.2,
                  fontFamily: m.key === 'screenId' ? 'monospace' : undefined,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }} title={m.value}>
                  {m.value}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );

  const inferSheetType = (name) => {
    const lower = name.toLowerCase();
    if (/개요|overview|summary|요약/.test(name))      return { label: '개요',    color: '#7c3aed', icon: <ListAltIcon /> };
    if (/레이아웃|layout/.test(lower))                 return { label: '레이아웃', color: '#0891b2', icon: <CodeIcon /> };
    if (/grid|그리드/.test(lower))                      return { label: 'Grid',    color: '#059669', icon: <TableChartIcon /> };
    if (/table|테이블|스키마|schema/.test(lower))        return { label: 'Table',   color: '#ea580c', icon: <StorageIcon /> };
    if (/query|쿼리|procedure|sp_/.test(lower))          return { label: 'Query',   color: '#dc2626', icon: <CodeIcon /> };
    return { label: '기타', color: '#64748b', icon: <InsertDriveFileIcon /> };
  };

  const active = parsed.sheets[activeSheet];

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 1.5, minHeight: 0 }}>
      {fileInfoCard}
      <Box sx={{ flex: 1, display: 'flex', gap: 2, minHeight: 0 }}>
      {/* Left: sheet list */}
      <Paper elevation={0} sx={{ ...embossedPaper(ACCENT), width: 320, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{
          px: 2, py: 1.2,
          background: `linear-gradient(90deg, ${ACCENT}11 0%, ${ACCENT}04 100%)`,
          borderBottom: '1px solid #e2e8f0',
        }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
            ② 파싱된 시트 ({parsed.sheets.length})
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b' }}>
            각 시트를 클릭하여 미리보기 확인
          </Typography>
        </Box>
        <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
          <Stack spacing={0.6}>
            {parsed.sheets.map((s, i) => {
              const meta = inferSheetType(s.name);
              const isActive = i === activeSheet;
              return (
                <Paper
                  key={i}
                  elevation={0}
                  onClick={() => setActiveSheet(i)}
                  sx={{
                    p: 1.2, cursor: 'pointer', borderRadius: 1.5,
                    bgcolor: isActive ? `${meta.color}14` : '#fff',
                    border: `1px solid ${isActive ? meta.color : '#e2e8f0'}`,
                    borderLeft: `3px solid ${meta.color}`,
                    boxShadow: isActive
                      ? `0 4px 12px ${meta.color}33, 0 1px 0 rgba(255,255,255,0.8) inset`
                      : `0 1px 2px rgba(15,23,42,0.06), 0 1px 0 rgba(255,255,255,0.8) inset`,
                    transition: 'all 0.2s',
                    '&:hover': !isActive && {
                      bgcolor: `${meta.color}08`,
                      borderColor: meta.color,
                      transform: 'translateX(2px)',
                    },
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Avatar sx={{
                      width: 32, height: 32,
                      bgcolor: `${meta.color}22`, color: meta.color,
                      '& svg': { fontSize: 18 },
                    }}>
                      {meta.icon}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }} noWrap>
                        {s.name}
                      </Typography>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Chip label={meta.label} size="small"
                              sx={{ height: 16, fontSize: 9, fontWeight: 700,
                                    bgcolor: `${meta.color}22`, color: meta.color }} />
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontFamily: 'monospace' }}>
                          {s.rowCount} rows
                        </Typography>
                      </Stack>
                    </Box>
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        </Box>
      </Paper>

      {/* Right: preview */}
      <Paper elevation={0} sx={{ ...embossedPaper(ACCENT), flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {active && (() => {
          const sheetType = inferSheetType(active.name);
          return (
          <>
            <Box sx={{
              px: 2.5, py: 1.5,
              background: `linear-gradient(90deg, ${sheetType.color}14 0%, ${ACCENT}04 100%)`,
              borderBottom: `1px solid #e2e8f0`,
            }}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Avatar sx={{
                  width: 36, height: 36,
                  bgcolor: `${sheetType.color}22`,
                  color: sheetType.color,
                  boxShadow: `0 2px 6px ${sheetType.color}33`,
                }}>
                  {sheetType.icon}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                    {active.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    타입: {sheetType.label} · {active.rowCount} rows · 상위 50행 미리보기
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <Box sx={{ flex: 1, overflow: 'auto', p: 1.5 }}>
              {/* 모든 시트(레이아웃/그리드 포함) Excel 원본 그대로 raw rows 로 표시 */}
              {active.preview.length === 0 ? (
                <Typography variant="body2" sx={{ color: '#94a3b8', textAlign: 'center', py: 4 }}>
                  빈 시트입니다.
                </Typography>
              ) : (
                <Box sx={{
                  border: '1px solid #e2e8f0', borderRadius: 1.5, overflow: 'auto',
                  bgcolor: '#fff',
                  boxShadow: '0 1px 0 rgba(255,255,255,0.9) inset',
                }}>
                  <Box component="table" sx={{
                    width: '100%', borderCollapse: 'collapse',
                    fontSize: 12, fontFamily: 'monospace',
                  }}>
                    <Box component="thead">
                      <Box component="tr" sx={{ bgcolor: '#f8fafc' }}>
                        {(active.preview[0] || []).map((_, ci) => (
                          <Box
                            key={ci}
                            component="th"
                            sx={{
                              px: 1, py: 0.6, textAlign: 'left',
                              color: '#64748b', fontWeight: 700, fontSize: 11,
                              borderBottom: '2px solid #e2e8f0',
                              borderRight: ci < (active.preview[0] || []).length - 1 ? '1px solid #e2e8f0' : 'none',
                              position: 'sticky', top: 0, bgcolor: '#f8fafc', zIndex: 2,
                            }}
                          >
                            {String.fromCharCode(65 + ci)}
                          </Box>
                        ))}
                      </Box>
                    </Box>
                    <Box component="tbody">
                      {active.preview.map((row, ri) => (
                        <Box
                          key={ri}
                          component="tr"
                          sx={{
                            bgcolor: ri === 0 ? `${ACCENT}08` : ri % 2 ? '#fafbfc' : '#fff',
                            '&:hover td': { bgcolor: `${ACCENT}08 !important` },
                          }}
                        >
                          {(Array.isArray(row) ? row : []).map((c, ci) => (
                            <Box
                              key={ci}
                              component="td"
                              sx={{
                                px: 1, py: 0.5,
                                borderBottom: '1px solid #f1f5f9',
                                borderRight: '1px solid #f1f5f9',
                                color: ri === 0 ? ACCENT : '#334155',
                                fontWeight: ri === 0 ? 700 : 400,
                                whiteSpace: 'nowrap',
                                maxWidth: 280,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                              title={String(c ?? '')}
                            >
                              {String(c ?? '')}
                            </Box>
                          ))}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>
          </>
          );
        })()}
      </Paper>
      </Box>
    </Box>
  );
}

// =====================================================================
// Step 3: 확인 및 시작
// =====================================================================
function StepConfirm({ file, parsed, title, setTitle, error, layoutSizes }) {
  if (!file || !parsed) return null;

  // layoutSizes 요약 문자열 생성
  let sizesSummary = null;
  if (parsed.layout && layoutSizes) {
    if (parsed.layout.orientation === 'G' && layoutSizes.rows && layoutSizes.cols) {
      sizesSummary = `row ${layoutSizes.rows.map((v) => v.toFixed(0) + '%').join(' / ')} · col ${layoutSizes.cols.map((v) => v.toFixed(0) + '%').join(' / ')}`;
    } else if (Array.isArray(layoutSizes)) {
      sizesSummary = layoutSizes.map((v) => v.toFixed(0) + '%').join(' / ');
    }
  }

  const summary = [
    { icon: <CodeIcon       sx={{ fontSize: 18 }} />, label: 'JSX 화면',           desc: 'React + MUI 화면 컴포넌트',       color: '#2563eb' },
    { icon: <CodeIcon       sx={{ fontSize: 18 }} />, label: 'Controller/Service', desc: 'Spring Boot REST + 비즈니스 로직', color: '#7c3aed' },
    { icon: <StorageIcon    sx={{ fontSize: 18 }} />, label: 'Table DDL',          desc: 'MSSQL CREATE TABLE + PK',         color: '#ea580c' },
    { icon: <CodeIcon       sx={{ fontSize: 18 }} />, label: 'Stored Procedure',    desc: 'SP_UI_* 네이밍 (Q/S/D)',         color: '#dc2626' },
    { icon: <ListAltIcon    sx={{ fontSize: 18 }} />, label: '메뉴 등록 SQL',       desc: 'TB_AD_MENU + 다국어 4개국',       color: '#059669' },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, height: '100%', minHeight: 0 }}>
      {/* 레이아웃 분석 요약 + 조정된 사이즈 */}
      {parsed.layout && (
        <Box sx={{ flexShrink: 0 }}>
          <LayoutAnalysisCard layout={parsed.layout} compact />
          {sizesSummary && (
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.8 }}>
              <Chip
                label={`📐 조정된 Layer 사이즈: ${sizesSummary}`}
                size="small"
                sx={{
                  height: 24, fontSize: 12, fontWeight: 700,
                  bgcolor: `${ACCENT}14`, color: ACCENT,
                  border: `1px solid ${ACCENT}55`,
                  fontFamily: 'monospace',
                  boxShadow: `0 1px 0 rgba(255,255,255,0.8) inset, 0 2px 4px ${ACCENT}14`,
                }}
              />
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                (Step 2에서 조정된 비율이 그대로 JSX SplitPanel 로 반영됩니다)
              </Typography>
            </Stack>
          )}
        </Box>
      )}
      <Box sx={{ flex: 1, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, minHeight: 0 }}>
      {/* Left: Summary */}
      <Paper elevation={0} sx={{ ...embossedPaper(ACCENT), display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{
          px: 2.5, py: 1.5,
          background: `linear-gradient(90deg, ${ACCENT}11 0%, ${ACCENT}04 100%)`,
          borderBottom: '1px solid #e2e8f0',
        }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
            ③ 입력 확인
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b' }}>
            세션 생성 후 Claude 에게 전달될 내용
          </Typography>
        </Box>

        <Box sx={{ flex: 1, overflow: 'auto', p: 2.5 }}>
          {/* File card */}
          <Paper elevation={0} sx={{
            p: 2, mb: 2, borderRadius: 2,
            bgcolor: `${ACCENT}08`,
            border: `1px solid ${ACCENT}33`,
            boxShadow: `0 1px 0 rgba(255,255,255,0.8) inset, 0 4px 12px ${ACCENT}11`,
          }}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Avatar sx={{
                width: 46, height: 46,
                background: ACCENT_GRAD, color: '#fff',
                boxShadow: `0 4px 12px ${ACCENT}55, 0 1px 0 rgba(255,255,255,0.3) inset`,
              }}>
                <InsertDriveFileIcon />
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }} noWrap>
                  {file.name}
                </Typography>
                <Stack direction="row" spacing={0.5} sx={{ mt: 0.3 }}>
                  <Chip label={`${(file.size / 1024).toFixed(1)} KB`}  size="small" sx={{ height: 18, fontSize: 10, fontFamily: 'monospace', bgcolor: '#fff' }} />
                  <Chip label={`시트 ${parsed.sheetNames.length}`}     size="small" sx={{ height: 18, fontSize: 10, fontWeight: 700, bgcolor: ACCENT, color: '#fff' }} />
                </Stack>
              </Box>
            </Stack>

            {/* 화면 메타 정보 — 화면ID / 화면명 / 메뉴 위치 */}
            {parsed.overview && (
              <Box sx={{
                mt: 1.5, pt: 1.2, borderTop: `1px dashed ${ACCENT}33`,
                display: 'flex', flexDirection: 'column', gap: 0.6,
              }}>
                {[
                  { key: 'screenId',   label: '화면 ID',    icon: '🏷', color: '#2563eb' },
                  { key: 'screenName', label: '화면명',     icon: '📛', color: '#7c3aed' },
                  { key: 'menuPath',   label: '메뉴 위치',  icon: '📂', color: '#059669' },
                ].filter((m) => parsed.overview[m.key]).map((m) => (
                  <Stack key={m.key} direction="row" spacing={0.8} alignItems="center">
                    <Box sx={{
                      width: 22, height: 22, borderRadius: 0.8,
                      bgcolor: `${m.color}14`, color: m.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, border: `1px solid ${m.color}33`, flexShrink: 0,
                    }}>
                      {m.icon}
                    </Box>
                    <Typography variant="caption" sx={{
                      color: m.color, fontWeight: 700, width: 60, flexShrink: 0,
                    }}>
                      {m.label}
                    </Typography>
                    <Typography variant="body2" sx={{
                      fontWeight: 600, color: '#0f172a', flex: 1,
                      fontFamily: m.key === 'screenId' ? 'monospace' : undefined,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }} title={parsed.overview[m.key]}>
                      {parsed.overview[m.key]}
                    </Typography>
                  </Stack>
                ))}
              </Box>
            )}
          </Paper>

          {/* Title input */}
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', display: 'block', mb: 0.5 }}>
            세션 제목
          </Typography>
          <TextField
            fullWidth
            size="small"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="세션 이름 (사용 이력에 표시됨)"
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: '#fff',
                boxShadow: '0 1px 0 rgba(255,255,255,0.9) inset, 0 1px 2px rgba(15,23,42,0.06)',
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: ACCENT },
              },
            }}
          />

          {/* Sheet list summary */}
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', display: 'block', mt: 2, mb: 0.8 }}>
            포함된 시트
          </Typography>
          <Stack spacing={0.4}>
            {parsed.sheets.map((s, i) => (
              <Stack key={i} direction="row" alignItems="center" spacing={0.8}
                     sx={{ py: 0.3, px: 1, borderRadius: 0.8,
                           bgcolor: i % 2 ? '#f8fafc' : 'transparent' }}>
                <CheckCircleIcon sx={{ fontSize: 14, color: '#10b981' }} />
                <Typography variant="caption" sx={{ flex: 1, fontFamily: 'monospace', color: '#475569' }} noWrap>
                  {s.name}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontFamily: 'monospace' }}>
                  {s.rowCount}
                </Typography>
              </Stack>
            ))}
          </Stack>

          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </Box>
      </Paper>

      {/* Right: Output preview */}
      <Paper elevation={0} sx={{ ...embossedPaper('#10b981'), display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{
          px: 2.5, py: 1.5,
          background: 'linear-gradient(90deg, #10b98111 0%, #10b98104 100%)',
          borderBottom: '1px solid #d1fae5',
        }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
            🚀 예상 산출물
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b' }}>
            Claude 가 생성할 파일 · SQL · 산출물
          </Typography>
        </Box>

        <Box sx={{ flex: 1, overflow: 'auto', p: 2.5 }}>
          <Stack spacing={1.2}>
            {summary.map((s, i) => (
              <Paper key={i} elevation={0} sx={{
                p: 1.5, borderRadius: 1.5,
                bgcolor: '#fff',
                border: `1px solid ${s.color}33`,
                borderLeft: `3px solid ${s.color}`,
                boxShadow: `0 1px 0 rgba(255,255,255,0.9) inset, 0 2px 6px rgba(15,23,42,0.06)`,
              }}>
                <Stack direction="row" alignItems="center" spacing={1.2}>
                  <Avatar sx={{
                    width: 38, height: 38,
                    bgcolor: `${s.color}14`, color: s.color,
                    boxShadow: `0 1px 0 rgba(255,255,255,0.8) inset, 0 2px 6px ${s.color}22`,
                  }}>
                    {s.icon}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                      {s.label}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      {s.desc}
                    </Typography>
                  </Box>
                  <Chip label="auto" size="small"
                        sx={{ height: 18, fontSize: 10, fontFamily: 'monospace',
                              bgcolor: `${s.color}14`, color: s.color, fontWeight: 700 }} />
                </Stack>
              </Paper>
            ))}
          </Stack>

          <Box sx={{
            mt: 2.5, p: 2, borderRadius: 1.5,
            background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
            border: '1px solid #a7f3d0',
            boxShadow: '0 1px 0 rgba(255,255,255,0.9) inset',
          }}>
            <Stack direction="row" alignItems="flex-start" spacing={1}>
              <Box sx={{ fontSize: 20 }}>💡</Box>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#065f46', display: 'block' }}>
                  다음 단계에서 일어날 일
                </Typography>
                <Typography variant="caption" sx={{ color: '#047857' }}>
                  세션이 생성되고 Composer Workspace 로 전환됩니다. Claude 가 설계서를 해석한 결과와 산출물 파일이 우측 산출물 패널에 순차적으로 표시됩니다.
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Box>
      </Paper>
      </Box>
    </Box>
  );
}

// =====================================================================
// 레이아웃 시트에서 Layer 사이즈 비율 자동 감지
// =====================================================================
// 지원 패턴:
//   1) "좌측그리드: 60%" / "좌측 60%" / "좌 60%"
//   2) "60:40" / "6:4" (비율 표기)
//   3) "width: 60%" 를 위치 컨텍스트와 조합
// 반환: H/V 분할 → 정규화된 배열 [size1, size2, ...] %
//       G 분할   → { rows, cols }
//       실패    → null
// =====================================================================
function extractSizeRatiosFromSheet(parsed, layout) {
  if (!parsed || !layout) return null;

  const layoutSheet = parsed.sheets.find((s) => /레이아웃|layout|화면구성|screen.?layout/i.test(s.name));
  if (!layoutSheet) return null;

  const rows = layoutSheet.rawRows || layoutSheet.preview || [];

  // 위치별 사이즈 맵 수집
  const positionSize = {}; // { '좌': 60, '우': 40, ... }

  // (1) 문장 내 "좌측 그리드 60%" / "좌측: 60%" 패턴
  const sentencePatterns = [
    { re: /(좌[측\s]*(?:그리드|패널)?|왼쪽|^좌\s|left)[^\w%]{0,6}(\d+(?:\.\d+)?)\s*%/i,      pos: '좌' },
    { re: /(우[측\s]*(?:그리드|패널)?|오른쪽|^우\s|right)[^\w%]{0,6}(\d+(?:\.\d+)?)\s*%/i,  pos: '우' },
    { re: /(상[단\s]*(?:그리드|패널)?|위쪽|^상\s|top|upper)[^\w%]{0,6}(\d+(?:\.\d+)?)\s*%/i, pos: '상' },
    { re: /(하[단\s]*(?:그리드|패널)?|아래쪽|^하\s|bottom|lower)[^\w%]{0,6}(\d+(?:\.\d+)?)\s*%/i, pos: '하' },
    { re: /(좌상|top.?left)[^\w%]{0,6}(\d+(?:\.\d+)?)\s*%/i,  pos: '좌상' },
    { re: /(우상|top.?right)[^\w%]{0,6}(\d+(?:\.\d+)?)\s*%/i, pos: '우상' },
    { re: /(좌하|bottom.?left)[^\w%]{0,6}(\d+(?:\.\d+)?)\s*%/i,  pos: '좌하' },
    { re: /(우하|bottom.?right)[^\w%]{0,6}(\d+(?:\.\d+)?)\s*%/i, pos: '우하' },
  ];

  const allText = rows.flatMap((r) => (Array.isArray(r) ? r : []))
    .map((c) => String(c ?? '').trim()).filter(Boolean).join(' ');

  for (const { re, pos } of sentencePatterns) {
    const m = allText.match(re);
    if (m && !positionSize[pos]) {
      const v = parseFloat(m[2]);
      if (v > 0 && v <= 100) positionSize[pos] = v;
    }
  }

  // (2) 같은 행 내 label-value 쌍
  for (const row of rows.slice(0, 80)) {
    if (!Array.isArray(row)) continue;
    const cells = row.map((c) => String(c ?? '').trim());
    for (let j = 0; j < cells.length - 1; j++) {
      const label = cells[j];
      if (!label || label.length > 20) continue;
      let pos = null;
      if (/^좌[측\s]*(그리드|패널)?$|^왼쪽$|^Left/i.test(label) && !/우/.test(label))    pos = '좌';
      else if (/^우[측\s]*(그리드|패널)?$|^오른쪽$|^Right/i.test(label))                  pos = '우';
      else if (/^상[단\s]*(그리드|패널)?$|^위쪽$|^Top/i.test(label))                      pos = '상';
      else if (/^하[단\s]*(그리드|패널)?$|^아래쪽$|^Bottom/i.test(label))                  pos = '하';
      else if (/^좌상|좌상단|top.?left/i.test(label))  pos = '좌상';
      else if (/^우상|우상단|top.?right/i.test(label)) pos = '우상';
      else if (/^좌하|좌하단|bottom.?left/i.test(label))  pos = '좌하';
      else if (/^우하|우하단|bottom.?right/i.test(label)) pos = '우하';
      if (!pos || positionSize[pos] != null) continue;

      // 같은 행에서 다음 셀들 중 % 나 숫자 감지
      for (let k = j + 1; k < Math.min(cells.length, j + 5); k++) {
        const vm = cells[k].match(/^(\d+(?:\.\d+)?)\s*%?$/);
        if (vm) {
          const v = parseFloat(vm[1]);
          if (v > 0 && v <= 100) { positionSize[pos] = v; break; }
        }
      }
    }
  }

  // (3) 비율 표기 "60:40" 단독 패턴 (2-그리드용 fallback)
  let ratioPair = null;
  const rm = allText.match(/\b(\d{1,3}(?:\.\d+)?)\s*:\s*(\d{1,3}(?:\.\d+)?)\b/);
  if (rm) {
    const a = parseFloat(rm[1]);
    const b = parseFloat(rm[2]);
    if (a > 0 && b > 0 && a <= 100 && b <= 100) {
      const total = a + b;
      ratioPair = [(a / total) * 100, (b / total) * 100];
    }
  }

  const normalize = (arr) => {
    const sum = arr.reduce((a, b) => a + (b || 0), 0);
    if (sum <= 0) return null;
    return arr.map((v) => ((v || 0) / sum) * 100);
  };

  // (4) 격자(G) 처리: row/col 별도 추출
  if (layout.orientation === 'G') {
    const topSize    = positionSize['상'] ?? positionSize['좌상'] ?? positionSize['우상'];
    const bottomSize = positionSize['하'] ?? positionSize['좌하'] ?? positionSize['우하'];
    const leftSize   = positionSize['좌'] ?? positionSize['좌상'] ?? positionSize['좌하'];
    const rightSize  = positionSize['우'] ?? positionSize['우상'] ?? positionSize['우하'];

    let rows = null, cols = null;
    if (topSize != null && bottomSize != null) {
      rows = normalize([topSize, bottomSize]);
    }
    if (leftSize != null && rightSize != null) {
      cols = normalize([leftSize, rightSize]);
    }
    if (rows || cols) {
      return {
        rows: rows || [50, 50],
        cols: cols || [50, 50],
      };
    }
    return null;
  }

  // (5) H/V 처리: layout.grids 순서대로 추출
  const sizes = layout.grids.map((g) => positionSize[g.position]);
  const known = sizes.filter((v) => v != null).length;

  if (known === layout.grids.length) {
    return normalize(sizes);
  }
  // 부분 감지 + 2-그리드 + ratio 있으면 ratio 사용
  if (layout.grids.length === 2 && ratioPair) {
    return ratioPair;
  }
  return null;
}

// =====================================================================
// 개요 시트에서 메타 정보 추출 — 화면ID · 화면명 · 메뉴 위치 등
// =====================================================================
function extractOverview(parsed) {
  if (!parsed || !parsed.sheets) return null;

  const overviewSheet = parsed.sheets.find((s) => /개요|overview|summary|요약|cover/i.test(s.name))
                       || parsed.sheets[0];
  if (!overviewSheet) return null;

  const rows = overviewSheet.rawRows || overviewSheet.preview || [];
  const data = {};

  const patterns = {
    screenId:   /(화면\s*id|화면\s*코드|screen\s*id|ui\s*id|menu\s*cd|메뉴\s*코드|메뉴\s*id)\s*[:：]?$/i,
    screenName: /(화면\s*명칭|화면\s*이름|화면\s*명|screen\s*name|menu\s*name|메뉴\s*명|메뉴\s*이름|title|제목)\s*[:：]?$/i,
    menuPath:   /(메뉴\s*위치|메뉴\s*경로|메뉴\s*path|menu\s*path|menu\s*location|메뉴\s*구조|메뉴\s*트리)\s*[:：]?$/i,
    category:   /(분류|카테고리|category|모듈|module|도메인)\s*[:：]?$/i,
    author:     /(작성자|담당자|author|개발자|설계자)\s*[:：]?$/i,
    version:    /(^버전$|version|v\.|revision|리비전)\s*[:：]?$/i,
    createdAt:  /(작성\s*일|작성\s*일시|최종\s*수정|수정\s*일|개발\s*일|date|created|updated)\s*[:：]?$/i,
    description:/(설명|비고|description|note|remark|설계\s*목적|주요\s*기능|목적)\s*[:：]?$/i,
  };

  // (1) 일반 패턴: label / value 쌍 추출 (같은 행 또는 다음 열)
  for (let i = 0; i < Math.min(rows.length, 100); i++) {
    const row = rows[i];
    if (!Array.isArray(row)) continue;
    const cells = row.map((c) => String(c ?? '').trim());

    for (let j = 0; j < cells.length; j++) {
      const label = cells[j];
      if (!label || label.length > 20) continue;

      for (const [key, re] of Object.entries(patterns)) {
        if (!re.test(label) || data[key]) continue;
        // value = 같은 행의 다음 non-empty 셀
        for (let k = j + 1; k < cells.length; k++) {
          if (cells[k]) {
            data[key] = cells[k];
            break;
          }
        }
      }
    }
  }

  // (2) 메뉴 위치 2차 시도 — "메뉴" 단독 label 이 있는 경우
  if (!data.menuPath) {
    for (const row of rows.slice(0, 100)) {
      if (!Array.isArray(row)) continue;
      const cells = row.map((c) => String(c ?? '').trim());
      for (let j = 0; j < cells.length - 1; j++) {
        if (/^메뉴$|^menu$/i.test(cells[j]) && cells[j + 1] && cells[j + 1].length < 80) {
          data.menuPath = cells[j + 1];
          break;
        }
      }
      if (data.menuPath) break;
    }
  }

  return Object.keys(data).length > 0 ? data : null;
}

// =====================================================================
// Grid 시트 컬럼 파서 — 설계서 Grid 시트에서 컬럼 정의를 추출
// =====================================================================
// 전형적인 설계서 Grid 시트 구조:
//   [상단 N 행: 메타/헤더 영역]
//   ...
//   [헤더 행: No | 컬럼ID | 한글명 | 영문명 | 타입 | 너비 | 편집 | ...]
//   [데이터 행 1]
//   [데이터 행 2]
//   ...
// =====================================================================
function parseGridColumns(sheet) {
  if (!sheet || !sheet.rawRows) return null;
  const rows = sheet.rawRows;

  // 헤더 행 키워드
  const headerKeywordsRe = /^(번호|no|순번|컬럼\s*id|column|필드|name|한글|한글명|영문|영문명|컬럼\s*명|header|title|type|타입|데이터\s*타입|width|너비|길이|편집|editable|정렬|align|필수|required|format|포맷|merge|visible|표시|default)$/i;

  // 1) 헤더 행 탐지 (첫 80행 내에서 키워드 3개 이상 매칭)
  let headerIdx = -1;
  let headerCols = null;
  for (let i = 0; i < Math.min(rows.length, 80); i++) {
    const row = rows[i];
    if (!Array.isArray(row)) continue;
    const cells = row.map((c) => String(c ?? '').trim());
    const hits = cells.filter((c) => c && headerKeywordsRe.test(c)).length;
    if (hits >= 3) {
      headerIdx = i;
      headerCols = cells;
      break;
    }
  }
  if (headerIdx === -1) return null;

  // 유효 컬럼 (빈 헤더 제거)
  const validColIdx = headerCols.map((c, i) => c ? i : -1).filter((i) => i >= 0);
  if (validColIdx.length < 2) return null;

  // 2) 데이터 행 추출 — 헤더 이후 연속 블록, 공백 행은 건너뛰되 연속 공백 3행 이상이면 종료
  const dataRows = [];
  let blankStreak = 0;
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!Array.isArray(row)) { blankStreak++; if (blankStreak >= 3) break; continue; }
    const cells = row.map((c) => String(c ?? '').trim());
    const nonEmpty = cells.filter((c) => c).length;
    if (nonEmpty === 0) {
      blankStreak++;
      if (blankStreak >= 3 && dataRows.length > 0) break;
      continue;
    }
    blankStreak = 0;
    if (nonEmpty < 2) continue; // 단일 셀(제목 등) skip

    // 첫 번째 유효 컬럼이 순번 또는 컬럼ID 같은 값인지 확인
    const first = cells[validColIdx[0]] || '';
    // 완전히 빈 (의미 없는) 행 skip
    if (!first && !cells[validColIdx[1]]) continue;

    dataRows.push(cells);
  }

  // 3) 헤더 매핑 분류 (UI 표시용)
  const classifyHeader = (h) => {
    const s = h.toLowerCase();
    if (/^(번호|no|순번|#)/i.test(h))                return { type: 'no',       short: 'No' };
    if (/컬럼\s*id|column\s*id|field|필드/i.test(h)) return { type: 'id',       short: 'ID' };
    if (/한글|kr|korean/i.test(h))                   return { type: 'name-ko',  short: '한글명' };
    if (/영문|en|english/i.test(h))                  return { type: 'name-en',  short: '영문명' };
    if (/컬럼\s*명|name|header|title/i.test(h))      return { type: 'name',     short: '이름' };
    if (/타입|type|데이터.*타입/i.test(h))            return { type: 'type',     short: '타입' };
    if (/너비|width|길이|length/i.test(h))             return { type: 'width',    short: 'W' };
    if (/편집|editable/i.test(h))                     return { type: 'edit',     short: '편집' };
    if (/정렬|align/i.test(h))                        return { type: 'align',    short: '정렬' };
    if (/필수|required|not.null/i.test(h))            return { type: 'required', short: '필수' };
    if (/포맷|format/i.test(h))                       return { type: 'format',   short: '포맷' };
    if (/visible|표시|숨김|hidden/i.test(h))          return { type: 'visible',  short: '표시' };
    if (/merge|병합/i.test(h))                        return { type: 'merge',    short: '병합' };
    if (/default|기본값/i.test(h))                    return { type: 'default',  short: 'Default' };
    if (/비고|설명|remark|note|description/i.test(h)) return { type: 'note',     short: '비고' };
    return { type: 'other', short: h.length > 8 ? h.slice(0, 8) + '…' : h };
  };

  const classifiedHeaders = validColIdx.map((ci) => ({
    idx: ci,
    raw: headerCols[ci],
    ...classifyHeader(headerCols[ci]),
  }));

  return {
    headerIdx,
    headers: classifiedHeaders,
    rows: dataRows,
    rawHeaders: headerCols,
  };
}

// =====================================================================
// Grid 컬럼 뷰 — 파싱된 컬럼 정의를 보기 좋게 테이블로 표시
// =====================================================================
function GridColumnView({ cols, color = ACCENT }) {
  if (!cols || !cols.headers || cols.rows.length === 0) return null;

  // 셀 타입별 스타일 결정자
  const cellStyle = (type, val) => {
    const s = (val || '').toLowerCase();
    if (type === 'edit') {
      if (/^(y|true|o|1|편집|editable)/.test(s)) return { bg: '#dcfce7', color: '#15803d', label: 'Y' };
      if (/^(n|false|x|0|읽기)/.test(s))          return { bg: '#f1f5f9', color: '#64748b', label: 'N' };
    }
    if (type === 'required') {
      if (/^(y|true|o|1|필수)/.test(s))           return { bg: '#fee2e2', color: '#b91c1c', label: 'Y' };
      if (/^(n|false|x|0)/.test(s))                return { bg: '#f1f5f9', color: '#64748b', label: 'N' };
    }
    if (type === 'visible') {
      if (/^(n|false|x|0|숨김|hidden)/.test(s))   return { bg: '#fef3c7', color: '#b45309', label: 'Hide' };
      if (/^(y|true|o|1)/.test(s))                 return { bg: '#dcfce7', color: '#15803d', label: 'Y' };
    }
    if (type === 'type') {
      return { bg: `${color}14`, color, fontFamily: 'monospace', fontWeight: 700 };
    }
    if (type === 'align') {
      return { bg: '#f1f5f9', color: '#475569', fontFamily: 'monospace' };
    }
    if (type === 'id' || type === 'name-en') {
      return { color: '#0f172a', fontFamily: 'monospace', fontWeight: 700 };
    }
    if (type === 'name-ko' || type === 'name') {
      return { color: '#0f172a', fontWeight: 600 };
    }
    if (type === 'no') {
      return { color: '#94a3b8', fontFamily: 'monospace', textAlign: 'center', width: 36 };
    }
    if (type === 'width') {
      return { color: '#0891b2', fontFamily: 'monospace', textAlign: 'right', width: 60 };
    }
    return {};
  };

  return (
    <Box sx={{
      border: `1px solid ${color}33`, borderRadius: 1.5, overflow: 'auto',
      bgcolor: '#fff',
      boxShadow: `0 1px 0 rgba(255,255,255,0.9) inset, 0 2px 6px ${color}14`,
    }}>
      <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <Box component="thead">
          <Box component="tr" sx={{
            position: 'sticky', top: 0, zIndex: 2,
            background: `linear-gradient(180deg, ${color}22 0%, ${color}14 100%)`,
          }}>
            {cols.headers.map((h, i) => (
              <Box
                key={i}
                component="th"
                title={h.raw}
                sx={{
                  px: 1, py: 0.8, textAlign: 'left',
                  fontSize: 11, fontWeight: 800,
                  color: color,
                  borderBottom: `2px solid ${color}55`,
                  borderRight: i < cols.headers.length - 1 ? `1px solid ${color}22` : 'none',
                  whiteSpace: 'nowrap',
                  position: 'sticky', top: 0,
                  background: 'inherit',
                }}
              >
                {h.short}
              </Box>
            ))}
          </Box>
        </Box>
        <Box component="tbody">
          {cols.rows.map((row, ri) => (
            <Box
              key={ri}
              component="tr"
              sx={{
                bgcolor: ri % 2 ? '#fafbfc' : '#fff',
                '&:hover td': { bgcolor: `${color}08 !important` },
              }}
            >
              {cols.headers.map((h, i) => {
                const val = row[h.idx] || '';
                const st  = cellStyle(h.type, val);
                const isChip = st.label !== undefined;
                return (
                  <Box
                    key={i}
                    component="td"
                    sx={{
                      px: 1, py: 0.55,
                      borderBottom: '1px solid #f1f5f9',
                      borderRight: i < cols.headers.length - 1 ? '1px solid #f1f5f9' : 'none',
                      whiteSpace: 'nowrap', maxWidth: 260,
                      overflow: 'hidden', textOverflow: 'ellipsis',
                      fontSize: 11,
                      color: st.color || '#334155',
                      fontFamily: st.fontFamily,
                      fontWeight: st.fontWeight,
                      textAlign: st.textAlign,
                      width: st.width,
                    }}
                    title={val}
                  >
                    {isChip && val ? (
                      <Box component="span" sx={{
                        display: 'inline-block',
                        px: 0.6, py: 0.1, borderRadius: 0.5,
                        bgcolor: st.bg, color: st.color,
                        fontWeight: 700, fontSize: 10, fontFamily: 'monospace',
                        border: `1px solid ${st.color}33`,
                      }}>
                        {st.label}
                      </Box>
                    ) : val}
                  </Box>
                );
              })}
            </Box>
          ))}
        </Box>
      </Box>

      {/* Footer: 컬럼 개수 */}
      <Box sx={{
        px: 1.5, py: 0.8,
        borderTop: `1px solid ${color}22`,
        bgcolor: `${color}08`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <Typography variant="caption" sx={{ color: color, fontWeight: 700 }}>
          📋 총 {cols.rows.length}개 컬럼 감지
        </Typography>
        <Typography variant="caption" sx={{ color: '#94a3b8', fontFamily: 'monospace' }}>
          헤더 행: {cols.headerIdx + 1} / 매핑 컬럼: {cols.headers.length}개
        </Typography>
      </Box>
    </Box>
  );
}

// =====================================================================
// 레이아웃 분석
// =====================================================================
// 시트명 기반 감지 우선 (한글 설계서 호환):
//   - '좌측그리드' / '우측그리드' / '상단그리드' / '하단그리드'
//   - 'grid-1' / 'grid1' / 'Grid 1'
//   - '좌측/왼쪽/Left'· '우측/오른쪽/Right'· '상단/위/Top'· '하단/아래/Bottom'
// Fallback: 레이아웃 시트 본문에서 분할 키워드 ('좌우 2분할' 등) 파싱
// =====================================================================
function analyzeLayout(parsed) {
  if (!parsed || !parsed.sheets) return null;

  // ---- 위치 추출 헬퍼 ----
  const inferPosition = (name) => {
    if (/(좌상|왼쪽\s*위|top.?left)/i.test(name)) return '좌상';
    if (/(우상|오른쪽\s*위|top.?right)/i.test(name)) return '우상';
    if (/(좌하|왼쪽\s*아래|bottom.?left)/i.test(name)) return '좌하';
    if (/(우하|오른쪽\s*아래|bottom.?right)/i.test(name)) return '우하';
    if (/(좌측|왼쪽|왼편|^좌|left)/i.test(name))     return '좌';
    if (/(우측|오른쪽|우편|^우|right)/i.test(name))  return '우';
    if (/(상단|위쪽|위편|^상|top|upper)/i.test(name))  return '상';
    if (/(하단|아래쪽|밑|^하|bottom|lower)/i.test(name)) return '하';
    if (/(중앙|가운데|중간|center|middle)/i.test(name)) return '중';
    return null;
  };

  // ---- 시트가 "그리드 시트"인지 판정 ----
  // T3Composer 의 export 가 만드는 요약 시트("그리드 목록" 등) 는 제외해야 함
  // — 요약은 grid 메타만 있고 실제 컬럼은 없으므로 grid 후보에 잡히면 안 된다.
  const SUMMARY_SHEET_NAMES = /^(그리드\s*(목록|일람|요약|인덱스)|grid\s*(list|index|summary|catalog)s?)$/i;
  const isGridSheet = (name) => {
    if (!name) return false;
    // 요약 / 인덱스 / 카탈로그 시트는 제외
    if (SUMMARY_SHEET_NAMES.test(name.trim())) return false;
    // grid / 그리드 keyword
    if (/grid|그리드/i.test(name)) return true;
    // 좌측그리드 / 우측그리드 등은 위에서 걸리므로 추가 검사 불필요
    return false;
  };

  // ---- 시트명에서 명시적 grid 번호 추출 ----
  const extractGridNum = (name) => {
    const m = name.match(/grid[-\s_]?(\d+)/i) || name.match(/그리드\s*(\d+)/);
    return m ? parseInt(m[1], 10) : null;
  };

  // 1) 그리드 시트 후보 수집
  const candidates = [];
  for (const s of parsed.sheets) {
    if (!isGridSheet(s.name)) continue;
    const position = inferPosition(s.name);
    const gridNum  = extractGridNum(s.name);
    candidates.push({ sheet: s, position, gridNum });
  }

  // 2) 방향 판정
  let orientation = null;
  const positions = candidates.map((c) => c.position).filter(Boolean);
  const hasHoriz = positions.some((p) => /좌|우/.test(p)) && !positions.some((p) => /상|하/.test(p));
  const hasVert  = positions.some((p) => /상|하/.test(p)) && !positions.some((p) => /좌|우/.test(p));
  const hasGrid  = positions.some((p) => /좌상|우상|좌하|우하/.test(p));

  if (hasGrid)        orientation = 'G';
  else if (hasHoriz)  orientation = 'H';
  else if (hasVert)   orientation = 'V';

  // 3) 레이아웃 시트 본문에서도 분할 힌트 추출 (fallback + 보강)
  const layoutSheet = parsed.sheets.find((s) => /레이아웃|layout|화면구성|screen.?layout/i.test(s.name));
  const layoutText = (layoutSheet?.rawRows || layoutSheet?.preview || [])
    .flatMap((r) => (Array.isArray(r) ? r : []))
    .map((c) => String(c ?? '').trim())
    .filter(Boolean)
    .join(' ');

  if (!orientation && layoutText) {
    if (/좌우\s*(2|두|양)|horizontal\s*split|수평\s*분할/i.test(layoutText))  orientation = 'H';
    else if (/상하\s*(2|두|양)|vertical\s*split|수직\s*분할/i.test(layoutText)) orientation = 'V';
    else if (/사분면|quadrant|2\s*x\s*2|4\s*분할/i.test(layoutText))              orientation = 'G';
  }

  // 단일 그리드 힌트 — 명시적으로 layout 시트가 단일 그리드를 가리키면 후보를 1개로 줄임
  // (export 의 "분할 형태: 단일 그리드" 또는 "BaseGrid 수: 1" 케이스).
  const isSingleGridHint = layoutText
    ? (/단일\s*그리드|single\s*grid/i.test(layoutText)
       || /BaseGrid\s*[수개]\s*[:：]?\s*1\b/i.test(layoutText))
    : false;

  // 4) 후보가 없으면 null 반환 (화면에 표시 안함)
  if (candidates.length === 0) {
    // 그래도 레이아웃 시트에서 분할 힌트가 있으면 최소 정보로 리턴
    if (orientation) {
      return {
        typeLabel: orientation === 'H' ? '좌우 2분할' : orientation === 'V' ? '상하 2분할' : '4분할',
        orientation,
        gridCount: orientation === 'G' ? 4 : 2,
        grids: [],
        sheetName: layoutSheet?.name || null,
        rawRows: (layoutSheet?.preview || []).slice(0, 30),
        hint: '그리드 시트 미발견 (레이아웃 시트 텍스트 기준 추정)',
      };
    }
    return null;
  }

  // 4-2) 단일 그리드 명시 힌트가 있고 후보가 2개 이상이면 — 첫 grid-N 패턴 한 개만 남긴다
  if (isSingleGridHint && candidates.length > 1) {
    const primary = candidates.find((c) => /^grid[-\s_]?\d*$/i.test(c.sheet.name.trim()))
                  || candidates[0];
    candidates.length = 0;
    candidates.push(primary);
  }

  // 5) 방향 미확정 시 후보 개수로 추정 — 단일 후보면 orientation 은 null 로 둔다
  if (!orientation) {
    if (candidates.length === 1) orientation = null;          // 단일 그리드
    else if (candidates.length === 2) orientation = 'H';
    else if (candidates.length === 4) orientation = 'G';
    else orientation = 'H';
  }

  // 6) 정렬 순서: 위치 기준 (좌상→우상→좌→중→우→좌하→우하→상→중→하)
  const posOrder = {
    '좌상': 1, '상': 2, '우상': 3,
    '좌':   4, '중': 5, '우':   6,
    '좌하': 7, '하': 8, '우하': 9,
  };
  const sortFn = (a, b) => {
    const oa = a.position ? (posOrder[a.position] ?? 50) : 50;
    const ob = b.position ? (posOrder[b.position] ?? 50) : 50;
    if (oa !== ob) return oa - ob;
    const na = a.gridNum ?? 99;
    const nb = b.gridNum ?? 99;
    return na - nb;
  };
  candidates.sort(sortFn);

  // 7) 최종 grid 목록 생성 + 각 grid 별 TAB 감지
  const grids = candidates.map((c, idx) => {
    const tabs = detectTabsForGrid(c.sheet, parsed);
    return {
      id: c.gridNum ? `grid-${c.gridNum}` : `grid-${idx + 1}`,
      n: c.gridNum || (idx + 1),
      position: c.position
              || (candidates.length === 1 ? null
                : orientation === 'H' ? (idx === 0 ? '좌' : idx === candidates.length - 1 ? '우' : '중')
                : orientation === 'V' ? (idx === 0 ? '상' : idx === candidates.length - 1 ? '하' : '중')
                : ['좌상', '우상', '좌하', '우하'][idx] || `#${idx + 1}`),
      sheetName: c.sheet.name,
      rowCount: c.sheet.rowCount,
      tabs, // [{ n, label, sheetName? }]
    };
  });

  // 8) 스크린 전체 TAB 감지 (레이아웃 시트 + 메인 시트들에서)
  const screenTabs = detectScreenLevelTabs(parsed, grids);

  const gridCount = grids.length;
  let typeLabel;
  if (gridCount === 1)           typeLabel = '단일 그리드';
  else if (orientation === 'H')  typeLabel = `좌우 ${gridCount}분할`;
  else if (orientation === 'V')  typeLabel = `상하 ${gridCount}분할`;
  else                           typeLabel = `${gridCount}분할 (격자)`;

  // TAB 표기 정책: TAB 이 2개 이상일 때만 typeLabel 에 표기 (1개는 의미상 단일 화면이라 생략).
  const tabTotalCount = grids.reduce((acc, g) => acc + (g.tabs?.length || 0), 0) + screenTabs.length;
  if (tabTotalCount >= 2) {
    typeLabel += ` + TAB ${tabTotalCount}`;
  }

  return {
    typeLabel,
    orientation,
    gridCount,
    grids,
    screenTabs,
    sheetName: layoutSheet?.name || null,
    rawRows: (layoutSheet?.preview || []).slice(0, 30),
  };
}

// ---- 개별 그리드 시트 내부의 TAB 감지 ----
function detectTabsForGrid(sheet, parsed) {
  if (!sheet) return [];
  const tabMap = new Map(); // key → { n, label }

  // (A) 동일 그리드를 가리키는 별도 탭 시트 (예: '좌측그리드_Tab1', 'grid-1-Tab2')
  const baseName = sheet.name.replace(/그리드$/, '').replace(/grid[-\s_]?\d*/i, '').replace(/[_\s-]+$/, '').trim();
  for (const s of parsed.sheets) {
    if (s === sheet) continue;
    if (baseName && s.name.includes(baseName)) {
      const tm = s.name.match(/(?:tab|탭)\s*[-_]?\s*(\d+)/i);
      if (tm) {
        const n = parseInt(tm[1], 10);
        tabMap.set(`S${n}`, { n, label: s.name, sheetName: s.name });
      }
    }
  }

  // (B) 시트 본문에서 TAB 마커 스캔 (첫 200행)
  const rows = sheet.rawRows || sheet.preview || [];
  const limit = Math.min(rows.length, 200);
  for (let i = 0; i < limit; i++) {
    const row = rows[i];
    if (!Array.isArray(row)) continue;
    for (const cell of row) {
      const text = String(cell ?? '').trim();
      if (!text || text.length > 40) continue;

      // 'Tab1' / 'tab-1' / '탭1' / '탭 1' / 'TabPage 1' 등 번호 있는 패턴
      const m = text.match(/^(?:tab[-\s]?page|tab|탭)[-\s_]*(\d+)\b(.*)$/i);
      if (m) {
        const n = parseInt(m[1], 10);
        const rest = (m[2] || '').trim().replace(/^[\s:.·-]+/, '').replace(/[\s:.·-]+$/, '');
        if (!tabMap.has(`T${n}`) || (rest && !tabMap.get(`T${n}`).label.includes(rest))) {
          tabMap.set(`T${n}`, { n, label: rest ? `Tab ${n} · ${rest}` : `Tab ${n}` });
        }
        continue;
      }
      // 숫자 없는 'Tab' 키워드 — 단순 헤더일 수 있음 (무시)
    }
  }

  // (C) 시트 본문에서 '탭 N개' / 'N개 탭' 같은 총개수 표현
  const joined = rows.slice(0, 200).flatMap((r) => (Array.isArray(r) ? r : [])).map((c) => String(c ?? '').trim()).filter(Boolean).join(' ');
  const countMatch = joined.match(/(?:탭|tab)\s*(\d+)\s*개|(\d+)\s*개\s*(?:의\s*)?(?:탭|tab)/i);
  if (countMatch) {
    const cnt = parseInt(countMatch[1] || countMatch[2], 10);
    if (cnt > 0 && tabMap.size === 0) {
      for (let i = 1; i <= cnt; i++) tabMap.set(`C${i}`, { n: i, label: `Tab ${i}` });
    }
  }

  return Array.from(tabMap.values()).sort((a, b) => a.n - b.n);
}

// ---- 스크린 전체 레벨의 TAB 감지 (레이아웃/개요 시트 기준) ----
function detectScreenLevelTabs(parsed, grids) {
  if (!parsed) return [];
  // 그리드 시트가 아닌 곳 중 '탭' 키워드 시트
  const tabSheets = parsed.sheets.filter((s) => {
    if (grids.some((g) => g.sheetName === s.name)) return false;
    if (!/(^tab|탭\s*(페이지|page)?|tab[-\s]?page)/i.test(s.name)) return false;
    return true;
  });
  return tabSheets.map((s, i) => {
    const m = s.name.match(/(\d+)/);
    return {
      n: m ? parseInt(m[1], 10) : (i + 1),
      label: s.name,
      sheetName: s.name,
    };
  });
}

/** 분할 시각화 SVG/Box */
function LayoutDiagram({ layout, size = 'md' }) {
  if (!layout) return null;
  const { orientation, grids } = layout;
  const W = size === 'lg' ? 320 : 240;
  const H = size === 'lg' ? 160 : 120;
  const PAD = 6;

  const cells = [];
  if (orientation === 'H') {
    const cellW = (W - PAD * (grids.length + 1)) / grids.length;
    grids.forEach((g, i) => {
      cells.push({
        x: PAD + i * (cellW + PAD),
        y: PAD,
        w: cellW,
        h: H - PAD * 2,
        label: g.id,
        pos: g.position,
      });
    });
  } else if (orientation === 'V') {
    const cellH = (H - PAD * (grids.length + 1)) / grids.length;
    grids.forEach((g, i) => {
      cells.push({
        x: PAD,
        y: PAD + i * (cellH + PAD),
        w: W - PAD * 2,
        h: cellH,
        label: g.id,
        pos: g.position,
      });
    });
  } else {
    // 2x2 격자
    const cellW = (W - PAD * 3) / 2;
    const cellH = (H - PAD * 3) / 2;
    grids.slice(0, 4).forEach((g, i) => {
      cells.push({
        x: PAD + (i % 2) * (cellW + PAD),
        y: PAD + Math.floor(i / 2) * (cellH + PAD),
        w: cellW,
        h: cellH,
        label: g.id,
        pos: g.position,
      });
    });
  }

  const colors = [ACCENT, '#059669', '#7c3aed', '#ea580c', '#dc2626', '#0891b2'];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      {/* 바깥 프레임 */}
      <rect x="1" y="1" width={W - 2} height={H - 2} rx="6"
            fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
      {cells.map((c, i) => {
        const color = colors[i % colors.length];
        const grid  = grids[i];
        const tabs  = grid?.tabs || [];
        // TAB 이 2개 이상일 때만 시각적 TAB 스트립 표시 (1개는 표기 생략 정책).
        const hasTabs = tabs.length >= 2;
        const TAB_H = 8;
        const contentY = hasTabs ? c.y + TAB_H + 1 : c.y;
        const contentH = hasTabs ? c.h - TAB_H - 1 : c.h;
        return (
          <g key={i}>
            {/* 그리드 프레임 */}
            <rect x={c.x} y={c.y} width={c.w} height={c.h} rx="4"
                  fill={`${color}14`} stroke={color} strokeWidth="1.5" />

            {/* TAB 스트립 (있는 경우) */}
            {hasTabs && (
              <>
                <rect x={c.x} y={c.y} width={c.w} height={TAB_H}
                      fill={`${color}28`} stroke="none" />
                {tabs.slice(0, Math.min(tabs.length, 5)).map((t, ti, arr) => {
                  const segW = (c.w - 2) / arr.length;
                  const tx = c.x + 1 + ti * segW;
                  const active = ti === 0;
                  return (
                    <g key={ti}>
                      <rect x={tx} y={c.y + 1} width={segW - 1} height={TAB_H - 1} rx="1.5"
                            fill={active ? '#fff' : `${color}33`}
                            stroke={color} strokeWidth="0.4" />
                      <text x={tx + segW / 2} y={c.y + 6.5}
                            textAnchor="middle" fontSize="4.2"
                            fontWeight="700" fill={active ? color : `${color}cc`}>
                        T{t.n}
                      </text>
                    </g>
                  );
                })}
                {tabs.length > 5 && (
                  <text x={c.x + c.w - 4} y={c.y + 6.5}
                        textAnchor="end" fontSize="4"
                        fill={color} fontWeight="700">
                    +{tabs.length - 5}
                  </text>
                )}
              </>
            )}

            {/* 그리드 라벨 */}
            <text x={c.x + c.w / 2} y={contentY + contentH / 2 - 4}
                  textAnchor="middle" fontSize="13" fontWeight="800" fill={color}
                  fontFamily="monospace">
              {c.label}
            </text>
            <text x={c.x + c.w / 2} y={contentY + contentH / 2 + 12}
                  textAnchor="middle" fontSize="10" fill={color} fontWeight="600">
              ({c.pos}{hasTabs ? ` · ${tabs.length} 탭` : ''})
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** 레이아웃 분석 결과 카드 — Step 2/3 에서 사용 */
// =====================================================================
// 레이아웃 전용 뷰 — 정적 flex/grid 로 감지 비율 표시 (Split bar 제거)
//   · Step 2 (시트 검토) 는 레이아웃 확인용 — 크기 조절은 Step 3 (Layout 정리) 에서 수행
//   · sizes 는 Excel 에서 감지된 비율 그대로 반영 (정적 표시)
//   · "균등 분배" 버튼으로 Excel 비율을 동일 비율로 리셋 가능
// =====================================================================
const GRID_COLORS = ['#2563eb', '#059669', '#7c3aed', '#ea580c', '#dc2626', '#0891b2'];

function GridLayerPanel({ grid, idx, sizeValue, total }) {
  const color = GRID_COLORS[idx % GRID_COLORS.length];
  const percent = total ? (sizeValue / total) * 100 : sizeValue;
  return (
    <Box sx={{
      height: '100%', width: '100%', minWidth: 0, minHeight: 0,
      p: 1.2, borderRadius: 1.5,
      background: `linear-gradient(135deg, ${color}14 0%, ${color}22 100%)`,
      border: `2px solid ${color}`,
      boxShadow: `
        0 1px 0 rgba(255,255,255,0.9) inset,
        0 -1px 0 rgba(0,0,0,0.05) inset,
        0 8px 20px -10px ${color}55
      `,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
      transition: 'all 0.15s',
    }}>
      {/* Decoration */}
      <Box sx={{ position: 'absolute', top: -30, right: -30, width: 80, height: 80,
                 borderRadius: '50%', bgcolor: `${color}11` }} />

      <Typography sx={{
        fontSize: 24, fontWeight: 900, fontFamily: 'monospace',
        color, letterSpacing: -0.5, lineHeight: 1,
        textShadow: `0 1px 0 rgba(255,255,255,0.6)`,
      }}>
        {grid.id}
      </Typography>
      <Typography sx={{ fontSize: 12, color, fontWeight: 700, mt: 0.3 }}>
        ({grid.position})
      </Typography>
      <Box sx={{
        mt: 1, px: 1.2, py: 0.3,
        bgcolor: '#fff', borderRadius: 5,
        border: `1px solid ${color}66`,
        boxShadow: `0 1px 2px ${color}33, 0 1px 0 rgba(255,255,255,0.9) inset`,
      }}>
        <Typography sx={{
          fontFamily: 'monospace', fontWeight: 800,
          color, fontSize: 14,
        }}>
          {percent.toFixed(1)}%
        </Typography>
      </Box>
      {grid.rowCount && (
        <Typography sx={{ fontSize: 10, color: `${color}cc`, mt: 0.3, fontWeight: 600 }}>
          {grid.rowCount} rows
        </Typography>
      )}
    </Box>
  );
}

function LayoutOnlyView({ layout, sizes, onChangeSizes }) {
  if (!layout) {
    return (
      <Box sx={{ textAlign: 'center', py: 6, color: '#94a3b8' }}>
        <Typography variant="body2">레이아웃 정보가 감지되지 않았습니다.</Typography>
      </Box>
    );
  }

  const { orientation, grids } = layout;
  const isGrid2x2 = orientation === 'G';

  // 초기 사이즈 보정
  const safeArraySizes = () => {
    if (Array.isArray(sizes) && sizes.length === grids.length) return sizes;
    return new Array(grids.length || 2).fill(100 / (grids.length || 2));
  };
  const safeGridSizes = () => {
    if (sizes && sizes.rows && sizes.cols) return sizes;
    return { rows: [50, 50], cols: [50, 50] };
  };

  const handleResetSizes = () => {
    if (isGrid2x2) {
      onChangeSizes?.({ rows: [50, 50], cols: [50, 50] });
    } else {
      const n = grids.length || 2;
      onChangeSizes?.(new Array(n).fill(100 / n));
    }
  };

  return (
    <Box sx={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center',
      p: 3, gap: 2, height: '100%', minHeight: 0,
    }}>
      {/* 상단 라벨 + 리셋 버튼 */}
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ width: '100%', maxWidth: 900 }}>
        <Box sx={{ flex: 1 }}>
          <Stack direction="row" alignItems="center" spacing={0.8}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700,
                                                 letterSpacing: 1.5, textTransform: 'uppercase' }}>
              감지된 화면 분할 · 비율 미리보기
            </Typography>
            {layout.excelSizes ? (
              <Chip
                label="📊 Excel 기준 적용"
                size="small"
                sx={{
                  height: 20, fontSize: 10, fontWeight: 800,
                  bgcolor: '#dcfce7', color: '#15803d',
                  border: '1px solid #86efac',
                  boxShadow: '0 1px 0 rgba(255,255,255,0.8) inset',
                }}
              />
            ) : (
              <Chip
                label="⚖ 균등 분배 (기본값)"
                size="small"
                sx={{
                  height: 20, fontSize: 10, fontWeight: 800,
                  bgcolor: '#f1f5f9', color: '#475569',
                  border: '1px solid #cbd5e1',
                }}
              />
            )}
          </Stack>
          <Typography variant="h4" sx={{ fontWeight: 900, color: '#0f172a',
                                          letterSpacing: -0.3, lineHeight: 1.1 }}>
            {layout.typeLabel}
          </Typography>
        </Box>
        <Button
          size="small"
          variant="outlined"
          startIcon={<RestartAltIcon />}
          onClick={handleResetSizes}
          sx={{
            borderColor: `${ACCENT}44`, color: ACCENT, fontWeight: 700,
            boxShadow: '0 1px 0 rgba(255,255,255,0.9) inset, 0 1px 2px rgba(15,23,42,0.06)',
            '&:hover': { borderColor: ACCENT, bgcolor: `${ACCENT}08` },
          }}
        >
          균등 분배
        </Button>
      </Stack>

      {/* 비율 미리보기 — 정적 flex/grid (split bar 없음) */}
      <Box sx={{
        width: '100%', maxWidth: 900,
        flex: 1, minHeight: 260,
        p: 2, borderRadius: 3,
        bgcolor: '#fff',
        border: `1px solid ${ACCENT}33`,
        boxShadow: `
          0 1px 0 rgba(255,255,255,0.9) inset,
          0 -1px 0 rgba(15,23,42,0.04) inset,
          0 8px 24px -10px ${ACCENT}44
        `,
        display: 'flex',
      }}>
        {isGrid2x2 ? (
          <Grid2x2LayoutView
            layout={layout}
            sizes={safeGridSizes()}
          />
        ) : (
          <Box sx={{
            width: '100%', height: '100%', minHeight: 240,
            display: 'flex',
            flexDirection: orientation === 'V' ? 'column' : 'row',
            gap: 1.2,
          }}>
            {grids.map((g, i) => {
              const sz = safeArraySizes()[i] || (100 / grids.length);
              return (
                <Box key={g.id} sx={{ flex: sz, minWidth: 0, minHeight: 0, display: 'flex' }}>
                  <GridLayerPanel grid={g} idx={i} sizeValue={sz} total={100} />
                </Box>
              );
            })}
          </Box>
        )}
      </Box>

      {/* 안내 */}
      <Paper elevation={0} sx={{
        width: '100%', maxWidth: 900,
        p: 1.2, borderRadius: 1.5,
        bgcolor: '#f0f9ff',
        border: '1px solid #bae6fd',
        display: 'flex', alignItems: 'center', gap: 1,
        boxShadow: '0 1px 0 rgba(255,255,255,0.9) inset',
      }}>
        <Box sx={{ fontSize: 18 }}>💡</Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#075985', display: 'block' }}>
            감지된 사이즈 비율이 실제 화면 코드에 반영됩니다
          </Typography>
          <Typography variant="caption" sx={{ color: '#0c4a6e', fontSize: 11 }}>
            SplitPanel sizes={`{[${safeArraySizes ? (isGrid2x2 ? `${safeGridSizes().cols.join(', ')}` : safeArraySizes().map((s) => s.toFixed(0)).join(', ')) : '50, 50'}]}`}
            로 생성 단계에서 JSX 에 전달됩니다. 크기 조절은 다음 단계 [Layout 정리] 에서 수행하세요.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}

/** 2x2 격자 레이아웃 — 정적 CSS Grid (split bar 없음) */
function Grid2x2LayoutView({ layout, sizes }) {
  const { grids } = layout;
  // sizes: { rows: [r1, r2], cols: [c1, c2] } — 행/열 감지 비율 (정적)
  const rowSizes = sizes?.rows || [50, 50];
  const colSizes = sizes?.cols || [50, 50];

  // 4 grids 가정: [좌상, 우상, 좌하, 우하]
  const cells = [0, 1, 2, 3].map(i => grids[i] || { id: `grid-${i + 1}`, position: '-' });
  const sizeValueFor = (i) => {
    // 좌/우 배치는 colSizes, 상/하 배치는 rowSizes 기준으로 size 값 전달
    const col = i % 2;
    return colSizes[col];
  };

  return (
    <Box sx={{
      width: '100%', height: '100%', minHeight: 240,
      display: 'grid',
      gridTemplateRows: `${rowSizes[0]}fr ${rowSizes[1]}fr`,
      gridTemplateColumns: `${colSizes[0]}fr ${colSizes[1]}fr`,
      gap: 1.2,
    }}>
      {cells.map((g, i) => (
        <GridLayerPanel key={g.id || i} grid={g} idx={i} sizeValue={sizeValueFor(i)} total={100} />
      ))}
    </Box>
  );
}

function LayoutAnalysisCard({ layout, compact = false, onSelectGrid }) {
  if (!layout) return null;
  const Icon = layout.orientation === 'V' ? HorizontalSplitIcon
             : layout.orientation === 'G' ? DashboardIcon
             : VerticalSplitIcon;
  return (
    <Paper elevation={0} sx={{
      p: compact ? 1.5 : 2,
      borderRadius: 2,
      background: `linear-gradient(135deg, ${ACCENT}0c 0%, ${ACCENT}04 100%)`,
      border: `1px solid ${ACCENT}44`,
      boxShadow: `0 1px 0 rgba(255,255,255,0.9) inset, 0 4px 12px ${ACCENT}14`,
    }}>
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <Avatar sx={{
          width: compact ? 40 : 48, height: compact ? 40 : 48,
          background: ACCENT_GRAD, color: '#fff',
          boxShadow: `0 4px 12px ${ACCENT}55, 0 1px 0 rgba(255,255,255,0.3) inset`,
        }}>
          <Icon />
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={0.6} sx={{ mb: 0.3 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: 1,
                                                 color: ACCENT, textTransform: 'uppercase' }}>
              레이아웃 감지
            </Typography>
            {layout.sheetName && (
              <Chip label={`@ ${layout.sheetName}`} size="small"
                    sx={{ height: 16, fontSize: 10, fontFamily: 'monospace',
                          bgcolor: `${ACCENT}22`, color: ACCENT }} />
            )}
          </Stack>
          <Typography variant={compact ? 'subtitle2' : 'h6'} sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
            {layout.typeLabel}
          </Typography>
          <Stack spacing={0.4} sx={{ mt: 0.5 }}>
            {layout.grids.map((g) => (
              <Box key={g.id}>
                <Stack direction="row" spacing={0.5} alignItems="center" useFlexGap flexWrap="wrap">
                  <Chip
                    size="small"
                    onClick={onSelectGrid && g.sheetName ? () => onSelectGrid(g.sheetName) : undefined}
                    label={`${g.id} · ${g.position}${g.rowCount ? ` · ${g.rowCount}행` : ''}`}
                    sx={{
                      height: 22, fontSize: 11, fontWeight: 700,
                      bgcolor: '#fff',
                      border: `1px solid ${ACCENT}55`,
                      color: ACCENT,
                      fontFamily: 'monospace',
                      cursor: onSelectGrid && g.sheetName ? 'pointer' : 'default',
                      '&:hover': onSelectGrid && g.sheetName ? { bgcolor: `${ACCENT}14`, borderColor: ACCENT } : {},
                    }}
                  />
                  {g.tabs && g.tabs.length >= 2 && (
                    <Chip
                      size="small"
                      label={`📑 TAB ${g.tabs.length}`}
                      sx={{
                        height: 20, fontSize: 11, fontWeight: 700,
                        bgcolor: '#fef3c7', color: '#b45309',
                        border: '1px solid #fcd34d',
                        fontFamily: 'monospace',
                      }}
                    />
                  )}
                </Stack>
                {g.tabs && g.tabs.length >= 2 && (
                  <Stack direction="row" spacing={0.3} sx={{ mt: 0.3, ml: 1.3, flexWrap: 'wrap' }} useFlexGap>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: 10 }}>
                      ├─
                    </Typography>
                    {g.tabs.slice(0, 6).map((t, ti) => (
                      <Chip
                        key={ti}
                        size="small"
                        label={t.label}
                        sx={{
                          height: 18, fontSize: 10, fontWeight: 600,
                          bgcolor: '#fffbeb', color: '#92400e',
                          border: '1px solid #fde68a',
                          fontFamily: 'monospace',
                          maxWidth: 180,
                          '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' },
                        }}
                      />
                    ))}
                    {g.tabs.length > 6 && (
                      <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: 10 }}>
                        외 {g.tabs.length - 6}개
                      </Typography>
                    )}
                  </Stack>
                )}
              </Box>
            ))}
            {layout.screenTabs && layout.screenTabs.length >= 2 && (
              <Box>
                <Stack direction="row" spacing={0.5} alignItems="center" useFlexGap flexWrap="wrap">
                  <Chip
                    size="small"
                    label={`📑 스크린 TAB ${layout.screenTabs.length}`}
                    sx={{
                      height: 20, fontSize: 11, fontWeight: 700,
                      bgcolor: '#dcfce7', color: '#15803d',
                      border: '1px solid #86efac',
                      fontFamily: 'monospace',
                    }}
                  />
                  {layout.screenTabs.slice(0, 6).map((t, ti) => (
                    <Chip
                      key={ti}
                      size="small"
                      label={t.label}
                      sx={{
                        height: 18, fontSize: 10, fontWeight: 600,
                        bgcolor: '#f0fdf4', color: '#166534',
                        border: '1px solid #bbf7d0',
                        fontFamily: 'monospace',
                        maxWidth: 180,
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            )}
          </Stack>
        </Box>
        {/* Diagram */}
        <Box sx={{ width: compact ? 160 : 220, flexShrink: 0 }}>
          <LayoutDiagram layout={layout} size={compact ? 'md' : 'lg'} />
        </Box>
      </Stack>
    </Paper>
  );
}

function formatParsedDocForPrompt(fileName, parsed, layoutSizes) {
  if (!parsed) return '(파싱 결과 없음)';
  const out = [`[파일명] ${fileName}`];

  // 개요 정보 (화면ID / 화면명 / 메뉴 위치) 최상단에 명시
  if (parsed.overview) {
    out.push('');
    out.push('=== [화면 메타 정보] ===');
    if (parsed.overview.screenId)   out.push(`- 화면 ID: ${parsed.overview.screenId}`);
    if (parsed.overview.screenName) out.push(`- 화면명: ${parsed.overview.screenName}`);
    if (parsed.overview.menuPath)   out.push(`- 메뉴 위치: ${parsed.overview.menuPath}`);
    if (parsed.overview.category)   out.push(`- 분류: ${parsed.overview.category}`);
    if (parsed.overview.author)     out.push(`- 작성자: ${parsed.overview.author}`);
    if (parsed.overview.version)    out.push(`- 버전: ${parsed.overview.version}`);
    out.push('※ 위 메타 정보는 반드시 그대로 반영:');
    out.push('  - TB_AD_MENU 의 MENU_CD = 화면 ID');
    out.push('  - TB_AD_LANG_PACK 의 LANG_VALUE (ko) = 화면명');
    out.push('  - 메뉴 계층(PARENT_ID) = 메뉴 위치 경로');
  }

  // 레이아웃 분석 결과를 프롬프트 최상단에 명시
  if (parsed.layout) {
    const L = parsed.layout;
    out.push('');
    out.push('=== [레이아웃 분석 결과] ===');
    out.push(`- 분할 타입: ${L.typeLabel}`);
    out.push(`- 방향: ${L.orientation === 'H' ? '수평(좌우)' : L.orientation === 'V' ? '수직(상하)' : '격자'}`);
    out.push(`- Grid 개수: ${L.gridCount}`);
    for (const g of L.grids) {
      out.push(`  · ${g.id} (${g.position})${g.sheetName ? ' → 시트: ' + g.sheetName : ''}${g.rowCount ? ' (' + g.rowCount + '행)' : ''}`);
      // TAB 표기 정책: 2개 이상일 때만 LLM 에 TAB 정보를 전달 (1개는 단일 화면이라 생략).
      if (g.tabs && g.tabs.length >= 2) {
        out.push(`     └─ TAB ${g.tabs.length}개:`);
        for (const t of g.tabs) {
          out.push(`        · ${t.label}${t.sheetName ? ' (시트: ' + t.sheetName + ')' : ''}`);
        }
      }
    }
    if (L.screenTabs && L.screenTabs.length >= 2) {
      out.push(`- 스크린 전체 TAB: ${L.screenTabs.length}개`);
      for (const t of L.screenTabs) {
        out.push(`  · ${t.label}${t.sheetName ? ' (시트: ' + t.sheetName + ')' : ''}`);
      }
    }
    // 사용자 조정 사이즈 비율 (필수 반영)
    if (layoutSizes) {
      out.push('');
      out.push('=== [Layer 사이즈 비율 — 반드시 반영] ===');
      out.push(L.excelSizes ? '- 출처: Excel 설계서 레이아웃 시트 기준값' : '- 출처: 사용자 조정값 또는 균등 분배 기본값');
      if (L.orientation === 'G' && layoutSizes.rows && layoutSizes.cols) {
        out.push(`- 행 분할:   [${layoutSizes.rows.map((v) => v.toFixed(1)).join(', ')}] %`);
        out.push(`- 열 분할:   [${layoutSizes.cols.map((v) => v.toFixed(1)).join(', ')}] %`);
        out.push('  코드 예:');
        out.push('    <SplitPanel direction="vertical"   sizes={' + JSON.stringify(layoutSizes.rows.map((v) => +v.toFixed(1))) + '} minSize={80}>');
        out.push('      <SplitPanel direction="horizontal" sizes={' + JSON.stringify(layoutSizes.cols.map((v) => +v.toFixed(1))) + '} minSize={60}>');
        out.push('        <BaseGrid .../> <BaseGrid .../>');
        out.push('      </SplitPanel>');
        out.push('      <SplitPanel direction="horizontal" sizes={' + JSON.stringify(layoutSizes.cols.map((v) => +v.toFixed(1))) + '} minSize={60}>');
        out.push('        <BaseGrid .../> <BaseGrid .../>');
        out.push('      </SplitPanel>');
        out.push('    </SplitPanel>');
      } else if (Array.isArray(layoutSizes)) {
        out.push(`- 사이즈:   [${layoutSizes.map((v) => v.toFixed(1)).join(', ')}] %`);
        const sizeArr = JSON.stringify(layoutSizes.map((v) => +v.toFixed(1)));
        const dir = L.orientation === 'V' ? 'vertical' : 'horizontal';
        out.push('  코드 예:');
        out.push(`    <SplitPanel direction="${dir}" sizes={${sizeArr}} minSize={60}>`);
        L.grids.forEach((g) => {
          out.push(`      <BaseGrid /* ${g.id} (${g.position}) */ .../>`);
        });
        out.push('    </SplitPanel>');
      }
    }
    out.push('');
    out.push('※ 화면 생성 시 위 분할 구조 및 TAB 구성을 반드시 반영하세요.');
    out.push('  - 좌우/상하 분할: <SplitPanel direction="horizontal|vertical" sizes={...}> ... </SplitPanel>');
    out.push('    sizes 배열은 위에 명시된 사용자 조정값을 그대로 사용 (기본 50/50 대체 금지)');
    out.push('  - 각 영역은 위에 나열된 grid-N 매핑을 따라 BaseGrid 로 구현');
    out.push('  - TAB 이 있는 Grid 영역: <TabContainer value={tab} onChange={...} tabs={[...]}>');
    out.push('      TAB 별로 BaseGrid 를 conditional 렌더 (tab === "tab1" && <BaseGrid ... />)');
    out.push('  - 스크린 TAB: 최상위 TabContainer 로 전체 화면을 탭으로 분리');
  }

  for (const s of parsed.sheets) {
    out.push(`\n=== 시트: ${s.name} (${s.rowCount}행) ===`);
    for (const row of (s.rawRows || s.preview || [])) {
      const line = (Array.isArray(row) ? row : []).map((c) => String(c ?? '').trim()).join(' | ');
      if (line) out.push(line);
    }
  }
  return out.join('\n');
}

export default ModeNewFromDesign;
