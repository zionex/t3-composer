import React, { useEffect, useMemo, useRef, useState } from 'react';

import {
  Box, Stack, Paper, Typography, Chip, IconButton, Tooltip,
  Button, TextField, MenuItem, Select, Menu, ListItemIcon, ListItemText, Divider,
  ListSubheader, Drawer, Tabs, Tab, Checkbox, FormControlLabel, Autocomplete,
  InputAdornment,
} from '@mui/material';
import DragIndicatorIcon   from '@mui/icons-material/DragIndicator';
import FilterListIcon      from '@mui/icons-material/FilterList';
import AddIcon             from '@mui/icons-material/Add';
import CloseIcon           from '@mui/icons-material/Close';
import DeleteIcon          from '@mui/icons-material/Delete';
import VerticalSplitIcon   from '@mui/icons-material/VerticalSplit';
import HorizontalSplitIcon from '@mui/icons-material/HorizontalSplit';
import ViewModuleIcon      from '@mui/icons-material/ViewModule';
import SettingsIcon        from '@mui/icons-material/Settings';
import TuneIcon            from '@mui/icons-material/Tune';
import StorageIcon         from '@mui/icons-material/Storage';
import FlashOnIcon         from '@mui/icons-material/FlashOn';

import ReactGridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import {
  COMPONENT_CATALOG, COMPONENT_INDEX,
  DEFAULT_COMPONENT_CODE, normalizeComponentCode,
  DATA_SOURCES, WRITE_DATA_SOURCES, normalizeDataSource,
  EVENT_TYPES, EVENT_ACTIONS,
  INITIAL_FIRE_TARGETS, PAYLOAD_BINDING_SUGGESTIONS,
  isGridComponentCode, withGridDefaultProps, GRID_DEFAULT_PROPS,
} from './constants';

/**
 * Composer 설계서 기반 생성 단계의 Layout 정리용 편집기 (Controlled).
 *
 * Props
 *   value         : layoutConfig 객체 — { filterBar:{h, items[]}, layers:[{key,x,y,w,h,title,componentType}], cols, rowHeight }
 *   onChange(next): 변경된 layoutConfig 반환
 *   readOnly      : true 면 모든 편집 비활성
 *
 * 특징
 *   · Layer 는 항상 화면 전체를 채움 (잔여 여백 없음)
 *   · rowHeight 는 canvas 실제 높이에서 동적으로 계산 → 수직 스크롤 없음
 *   · Layer 사이 edge 를 split bar 처럼 드래그하여 크기 조절
 *   · D&D 이동·삭제·추가 후 normalizeLayers 로 잔여 공간 자동 채움
 *   · 우상단 "Layer 추가" 1개 버튼 (가장 큰 Layer 를 반으로 나눠 삽입)
 */

const ROWS_DEFAULT = 12;
const COLS_DEFAULT = 12;
const RGL_PADDING = [4, 4];
const RGL_MARGIN_X = 6;
// 세로 margin 은 밀도에 따라 축소 → rows 많을 때 margin 이 높이를 먹어치우는 것 방지
const computeMarginY = (rows) => {
  if (rows > 24) return 1;
  if (rows > 16) return 2;
  if (rows > 10) return 4;
  return 6;
};
// 최저 rowHeight — 여기까지는 일반 화면 가독성 유지
const MIN_ROW_HEIGHT = 2;

function deepClone(o) { return JSON.parse(JSON.stringify(o)); }

function nextLayerKey(layers) {
  const used = new Set(layers.map(l => l.key));
  for (let i = 1; i < 999; i += 1) {
    const k = `L${i}`;
    if (!used.has(k)) return k;
  }
  return `L${Date.now()}`;
}

function nextFilterKey(items) {
  const used = new Set(items.map(it => it.key));
  for (let i = 1; i < 999; i += 1) {
    const k = `f${i}`;
    if (!used.has(k)) return k;
  }
  return `f${Date.now()}`;
}

function ensureConfig(cfg) {
  const out = cfg ? deepClone(cfg) : {};
  if (!out.cols)      out.cols      = COLS_DEFAULT;
  if (!out.rowHeight) out.rowHeight = 30;
  if (!Array.isArray(out.layers)) out.layers = [];
  if (!out.filterBar || typeof out.filterBar !== 'object') out.filterBar = { h: 2, items: [] };
  if (!Array.isArray(out.filterBar.items)) out.filterBar.items = [];
  return out;
}

function getTotalRows(layers, minRows = ROWS_DEFAULT) {
  if (!layers.length) return minRows;
  const maxY = Math.max(...layers.map(l => (l.y || 0) + (l.h || 1)));
  return Math.max(minRows, maxY);
}

// ============================================================================
//  normalizeLayers — 잔여 여백을 채우는 레이아웃 밸런서
//   · 오른쪽/왼쪽/위쪽/아래쪽 4방향으로 각 layer 를 확장해 이웃 또는 경계에 닿게 함
//   · 수렴할 때까지 반복 (최대 5 pass)
//   · 겹침은 발생시키지 않음 (이웃 경계 이전에만 확장)
//   · skipKey 가 주어지면 해당 layer 는 확장 대상에서 제외 → 방금 resize 한 layer 의 의도 보존
//     (예: A 를 좁혔을 때 A 가 다시 벌어지지 않고 이웃 B 가 그 빈 공간을 채움)
// ============================================================================
function normalizeLayers(layers, cols, totalRows, skipKey = null) {
  if (!layers.length) return layers;
  const out = layers.map(l => ({ ...l }));
  const yOverlap = (a, b) => !(a.y + a.h <= b.y || b.y + b.h <= a.y);
  const xOverlap = (a, b) => !(a.x + a.w <= b.x || b.x + b.w <= a.x);

  for (let pass = 0; pass < 5; pass += 1) {
    let changed = false;

    // Leftward 확장 먼저 — skipKey 의 우·하단을 이웃이 먼저 메꾸도록
    for (const l of out) {
      if (l.key === skipKey) continue;
      if (l.x <= 0) continue;
      let leftBlock = 0;
      for (const o of out) {
        if (o === l) continue;
        if (o.x + o.w > l.x) continue;
        if (!yOverlap(l, o)) continue;
        if (o.x + o.w > leftBlock) leftBlock = o.x + o.w;
      }
      if (leftBlock < l.x) {
        l.w += l.x - leftBlock;
        l.x = leftBlock;
        changed = true;
      }
    }

    // Upward 확장
    for (const l of out) {
      if (l.key === skipKey) continue;
      if (l.y <= 0) continue;
      let topBlock = 0;
      for (const o of out) {
        if (o === l) continue;
        if (o.y + o.h > l.y) continue;
        if (!xOverlap(l, o)) continue;
        if (o.y + o.h > topBlock) topBlock = o.y + o.h;
      }
      if (topBlock < l.y) {
        l.h += l.y - topBlock;
        l.y = topBlock;
        changed = true;
      }
    }

    // Rightward 확장
    for (const l of out) {
      if (l.key === skipKey) continue;
      if (l.x + l.w >= cols) continue;
      let rightBlock = cols;
      for (const o of out) {
        if (o === l) continue;
        if (o.x < l.x + l.w) continue;
        if (!yOverlap(l, o)) continue;
        if (o.x < rightBlock) rightBlock = o.x;
      }
      if (rightBlock > l.x + l.w) {
        l.w = rightBlock - l.x;
        changed = true;
      }
    }

    // Downward 확장 — totalRows 경계까지
    for (const l of out) {
      if (l.key === skipKey) continue;
      if (l.y + l.h >= totalRows) continue;
      let bottomBlock = totalRows;
      for (const o of out) {
        if (o === l) continue;
        if (o.y < l.y + l.h) continue;
        if (!xOverlap(l, o)) continue;
        if (o.y < bottomBlock) bottomBlock = o.y;
      }
      if (bottomBlock > l.y + l.h) {
        l.h = bottomBlock - l.y;
        changed = true;
      }
    }

    if (!changed) break;
  }

  // skipKey 주변을 메꾼 뒤에도 여전히 가장자리에 여백이 남을 수 있음 — skipKey 없이 한 번 더 pass
  if (skipKey != null) {
    return normalizeLayers(out, cols, totalRows, null);
  }
  return out;
}

// ============================================================================
//  ComponentTypeSelect — 카탈로그 그룹 드롭다운 (layer header · 탭 페이지 공용)
// ============================================================================
function ComponentTypeSelect({
  value, onChange, disabled, excludeCodes = [],
  size = 'normal',   // 'normal' | 'mini'
  minWidth,
}) {
  const info = COMPONENT_INDEX[value];
  const isMini = size === 'mini';
  return (
    <Select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onMouseDown={(e) => e.stopPropagation()}
      variant="standard"
      disableUnderline
      size="small"
      disabled={disabled}
      renderValue={(v) => {
        const i = COMPONENT_INDEX[v];
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5,
                     maxWidth: isMini ? 100 : 150, overflow: 'hidden' }}>
            <Box sx={{ width: 6, height: 6, borderRadius: '50%',
                       bgcolor: i?.groupColor || '#64748b', flexShrink: 0 }} />
            <Box sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {i?.label || v}
            </Box>
          </Box>
        );
      }}
      MenuProps={{ PaperProps: { sx: { maxHeight: 420, minWidth: 240 } } }}
      sx={{
        fontSize: isMini ? 9 : 10, fontWeight: 700,
        color: '#334155', bgcolor: '#e2e8f0', borderRadius: 0.5,
        px: 0.5, minWidth: minWidth ?? (isMini ? 90 : 120),
        '& .MuiSelect-select': { py: 0.2, pr: '18px !important' },
      }}
    >
      {COMPONENT_CATALOG.groups.flatMap(g => {
        const items = g.items.filter(it => !excludeCodes.includes(it.code));
        if (!items.length) return [];
        return [
          <ListSubheader key={`h-${g.code}`}
            sx={{ fontSize: 11, fontWeight: 800, lineHeight: '26px',
                  color: g.color, bgcolor: '#f8fafc',
                  borderLeft: `3px solid ${g.color}`, pl: 1.2 }}>
            {g.label}
          </ListSubheader>,
          ...items.map(it => (
            <MenuItem key={it.code} value={it.code}
              sx={{ fontSize: 12, pl: 2.5, py: 0.6,
                    display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%',
                         bgcolor: g.color, flexShrink: 0 }} />
              <Box sx={{ flex: 1 }}>{it.label}</Box>
              {it.status === 'NEW' && (
                <Chip label="NEW" size="small"
                  sx={{ height: 14, fontSize: 9, fontWeight: 800,
                        bgcolor: '#fef3c7', color: '#92400e',
                        '& .MuiChip-label': { px: 0.6 } }} />
              )}
              {it.multi_instance && (
                <Chip label="×n" size="small"
                  sx={{ height: 14, fontSize: 9, fontWeight: 700,
                        bgcolor: '#e0f2fe', color: '#0369a1',
                        '& .MuiChip-label': { px: 0.5 } }} />
              )}
            </MenuItem>
          )),
        ];
      })}
    </Select>
  );
  // eslint-disable-next-line no-unused-vars
  void info;
}

// ============================================================================
//  Tab container 초기화 · 헬퍼
// ============================================================================
let _tabIdCounter = 0;
function makeTabId() {
  _tabIdCounter += 1;
  return `t${Date.now().toString(36)}${_tabIdCounter}`;
}

// 탭 이름 props 키: TAB1.TABPAGE<n>.NAME  (n = 1-based 탭 인덱스)
const TAB_NAME_PROP_RE = /^TAB1\.TABPAGE\d+\.NAME$/;

/**
 * layer.props 안의 TAB1.TABPAGE*.NAME 항목을 현재 tabs 배열과 일치하도록 재구성.
 *   · tabs 개수에 맞춰 TABPAGE 번호(1..N) 를 재부여 — 삭제·추가·순서 변경 시 자동 재계산
 *   · TAB1.TABPAGE*.NAME 이외의 사용자 prop 은 그대로 유지
 */
function syncTabProps(props, tabs) {
  const next = {};
  Object.entries(props || {}).forEach(([k, v]) => {
    if (!TAB_NAME_PROP_RE.test(k)) next[k] = v;
  });
  (tabs || []).forEach((t, i) => {
    next[`TAB1.TABPAGE${i + 1}.NAME`] = t.label || '';
  });
  return next;
}

function initTabsIfNeeded(layer) {
  if (layer.componentType !== 'CONTAINER_TAB') return layer;
  if (Array.isArray(layer.tabs) && layer.tabs.length > 0) return layer;
  const tabs = [{ id: makeTabId(), label: '탭 1', componentType: 'GRID_BASE' }];
  return {
    ...layer,
    tabs,
    props: syncTabProps(layer.props, tabs),
    activeTabIdx: 0,
  };
}

// ============================================================================
//  TabContainerBody — 탭 컨테이너 본문 미리보기 (인터랙티브)
//    · 탭 바: 라벨 클릭 시 활성 탭 전환, 더블클릭 시 inline 이름 편집, × 버튼 삭제, + 버튼 추가
//    · 활성 탭 본문: ComponentTypeSelect 로 내부 컴포넌트 선택 + 미니 미리보기
// ============================================================================
function TabContainerBody({ layer, accent, readOnly, onUpdateLayer, onOpenTabSettings }) {
  const tabs = Array.isArray(layer.tabs) ? layer.tabs : [];
  const activeIdx = Math.max(0, Math.min(tabs.length - 1, layer.activeTabIdx || 0));
  const active = tabs[activeIdx];
  const [editingIdx, setEditingIdx] = React.useState(null);

  // tabs 변경 시 layer.props 의 TAB1.TABPAGE*.NAME 항목도 함께 갱신
  //   · 추가: TAB1.TABPAGE<new>.NAME 엔트리 생성
  //   · 삭제: 해당 엔트리 제거 + 이후 번호 재부여
  //   · 이름 변경: 해당 엔트리 value 갱신
  const updateTabs = (next, extra = {}) => {
    onUpdateLayer({
      tabs: next,
      props: syncTabProps(layer.props, next),
      ...extra,
    });
  };

  const handleAddTab = () => {
    const next = [...tabs, { id: makeTabId(), label: `탭 ${tabs.length + 1}`, componentType: 'GRID_BASE' }];
    updateTabs(next, { activeTabIdx: next.length - 1 });
  };
  const handleRemoveTab = (idx) => {
    if (tabs.length <= 1) return;
    const next = tabs.filter((_, i) => i !== idx);
    const nextActive = Math.max(0, Math.min(next.length - 1, activeIdx >= idx ? activeIdx - 1 : activeIdx));
    updateTabs(next, { activeTabIdx: nextActive });
  };
  const handleRenameTab = (idx, label) => {
    const next = tabs.map((t, i) => i === idx ? { ...t, label } : t);
    updateTabs(next);
  };
  const handleChangeTabComponent = (idx, componentType) => {
    const next = tabs.map((t, i) => i === idx ? { ...t, componentType } : t);
    updateTabs(next);
  };
  const handleActivateTab = (idx) => {
    onUpdateLayer({ activeTabIdx: idx });
  };

  const innerInfo = active ? COMPONENT_INDEX[normalizeComponentCode(active.componentType)] : null;

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column',
               minHeight: 0, overflow: 'hidden' }}>
      {/* 탭 바 */}
      <Box sx={{
        display: 'flex', alignItems: 'flex-end', gap: 0.3,
        px: 0.5, pt: 0.5, bgcolor: '#f8fafc',
        borderBottom: `1px solid ${accent}55`,
        flexShrink: 0, minHeight: 22,
        overflowX: 'auto',
      }}>
        {tabs.map((t, i) => {
          const isActive = i === activeIdx;
          const isEditing = editingIdx === i;
          return (
            <Box key={t.id} onClick={() => !isEditing && handleActivateTab(i)}
              sx={{
                display: 'flex', alignItems: 'center', gap: 0.3,
                px: 0.7, py: 0.2,
                fontSize: 9, fontWeight: 700,
                color: isActive ? '#fff' : '#64748b',
                bgcolor: isActive ? accent : '#f1f5f9',
                borderRadius: '3px 3px 0 0',
                border: '1px solid #e2e8f0',
                borderBottom: isActive ? `1px solid ${accent}` : 'none',
                cursor: readOnly ? 'default' : 'pointer',
                whiteSpace: 'nowrap',
                '&:hover': readOnly ? {} : { filter: 'brightness(1.2)' },
              }}>
              {isEditing ? (
                <TextField
                  value={t.label}
                  autoFocus
                  onChange={(e) => handleRenameTab(i, e.target.value)}
                  onBlur={() => setEditingIdx(null)}
                  onKeyDown={(e) => { if (e.key === 'Enter') setEditingIdx(null); }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  variant="standard"
                  size="small"
                  InputProps={{ disableUnderline: true,
                                sx: { fontSize: 9, fontWeight: 700, color: '#fff',
                                      width: 48, py: 0 } }}
                />
              ) : (
                <Box onDoubleClick={(e) => {
                       if (readOnly) return;
                       e.stopPropagation();
                       setEditingIdx(i);
                     }}>
                  {t.label}
                </Box>
              )}
              {!readOnly && tabs.length > 1 && (
                <CloseIcon
                  onClick={(e) => { e.stopPropagation(); handleRemoveTab(i); }}
                  sx={{ fontSize: 11, opacity: 0.7, '&:hover': { opacity: 1 } }}
                />
              )}
            </Box>
          );
        })}
        {!readOnly && (
          <IconButton size="small" onClick={handleAddTab}
            onMouseDown={(e) => e.stopPropagation()}
            sx={{ p: 0.2, ml: 0.3, color: '#64748b',
                  '&:hover': { color: accent, bgcolor: `${accent}22` } }}>
            <AddIcon sx={{ fontSize: 12 }} />
          </IconButton>
        )}
      </Box>

      {/* 활성 탭 본문 */}
      <Box sx={{ flex: 1, minHeight: 0, p: 0.5,
                 display: 'flex', flexDirection: 'column', gap: 0.4,
                 overflow: 'hidden' }}>
        {active && (
          <>
            {/* 탭 페이지 헤더: 좌측 라벨 + 우측 드롭다운 + ⚙️ (일반 layer header 와 동일 규격) */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
              <Typography sx={{ fontSize: 9, fontWeight: 700, color: '#64748b' }}>
                컴포넌트
              </Typography>
              <Box sx={{ flex: 1 }} />
              <ComponentTypeSelect
                value={normalizeComponentCode(active.componentType)}
                onChange={(v) => handleChangeTabComponent(activeIdx, v)}
                disabled={readOnly}
                excludeCodes={['CONTAINER_TAB']}  // 탭 안에 탭 중첩 방지
                size="mini"
              />
              {!readOnly && (
                <Tooltip title="이 탭 컴포넌트의 Props · Data · Events 편집">
                  <IconButton size="small"
                              sx={{ color: '#64748b', p: 0.2,
                                    '&:hover': { color: '#3b82f6' } }}
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={() => onOpenTabSettings?.(active.id)}>
                    <SettingsIcon sx={{ fontSize: 13 }} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            {/* 탭 내부 컴포넌트 미리보기 — 일반 layer 와 동일한 mock 재사용 */}
            <Box sx={{
              flex: 1, minHeight: 0,
              border: `1px dashed ${innerInfo?.groupColor || '#e2e8f0'}55`,
              borderRadius: 0.5,
              bgcolor: '#f8fafc',
              overflow: 'hidden',
              display: 'flex', flexDirection: 'column',
            }}>
              <LayerBodyPreview
                layer={{ componentType: active.componentType }}
                group={innerInfo?.groupCode}
                code={normalizeComponentCode(active.componentType)}
                label={innerInfo?.label || active.componentType}
                accent={innerInfo?.groupColor || '#64748b'}
                readOnly={readOnly}
                onUpdateLayer={() => {}}
                nested
              />
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}

// ============================================================================
//  WriteOpForm — C / U / D 공용 폼 (SP or In-Line SQL 2가지만)
// ============================================================================
function WriteOpForm({ label, op, opDefaults, onChange }) {
  const src = op.source || 'sp';
  return (
    <Stack spacing={1} sx={{ p: 1.2, borderRadius: 1.5, border: '1px solid #e2e8f0',
                              bgcolor: '#fafbff' }}>
      <Typography variant="caption" sx={{ fontWeight: 800, color: '#0f172a',
                                           letterSpacing: 0.5 }}>
        {label}
      </Typography>
      <TextField select label="Source Type" size="small"
        value={src}
        onChange={(e) => onChange({ ...opDefaults, ...op, source: e.target.value })}>
        {WRITE_DATA_SOURCES.map(s => (
          <MenuItem key={s.code} value={s.code}>{s.label}</MenuItem>
        ))}
      </TextField>
      {src === 'sp' && (
        <>
          <TextField label="SP Name" size="small"
            placeholder="SP_UI_CM_50_S1"
            value={op.spName || ''}
            onChange={(e) => onChange({ ...op, spName: e.target.value })} />
          <TextField label="Parameters (JSON)" size="small" multiline rows={2}
            placeholder={'{ "rows": ":changes" }'}
            value={op.params || ''}
            onChange={(e) => onChange({ ...op, params: e.target.value })} />
        </>
      )}
      {src === 'inline_sql' && (
        <>
          <TextField label="SQL" size="small" multiline rows={4}
            placeholder={'INSERT INTO TB_CM_ITEM_MST (ITEM_CD, ITEM_NM) VALUES (:itemCd, :itemNm)'}
            value={op.sqlText || ''}
            onChange={(e) => onChange({ ...op, sqlText: e.target.value })}
            InputProps={{ sx: { fontFamily: 'monospace', fontSize: 12 } }} />
          <TextField label="Parameters (JSON)" size="small" multiline rows={2}
            placeholder={'{ "itemCd": ":itemCd", "itemNm": ":itemNm" }'}
            value={op.params || ''}
            onChange={(e) => onChange({ ...op, params: e.target.value })} />
        </>
      )}
    </Stack>
  );
}

// ============================================================================
//  DataBindingEditor — R / C / U / D 서브탭으로 구성된 Data 편집기
//    · R (Read): 7종 source type (SP / Ontology / DB Entity / KPI&DB / CodeMaster / Direct / Other Layer)
//    · C/U/D    : SP 또는 In-Line SQL 2종만
// ============================================================================

// Grid layer 의 Read 결과에 대응되는 컬럼 정의 옵션 (전역 상수) — 모든 라벨 영문 고정
const GRID_COLUMN_ALIGNS = [
  { code: 'left',   label: 'Left'   },
  { code: 'center', label: 'Center' },
  { code: 'right',  label: 'Right'  },
];

// RealGrid2 네이티브 dataType (저장·파싱 단위)
const GRID_COLUMN_DATA_TYPES = [
  { code: 'text',     label: 'Text'     },
  { code: 'number',   label: 'Number'   },
  { code: 'date',     label: 'Date'     },
  { code: 'datetime', label: 'DateTime' },
  { code: 'boolean',  label: 'Boolean'  },
];

// 셀 표현 방식 (RealGrid2 렌더러/에디터 포괄)
const GRID_COLUMN_FORMATS = [
  { code: 'text',      label: 'Text'      },
  { code: 'number',    label: 'Number'    },
  { code: 'currency',  label: 'Currency'  },
  { code: 'percent',   label: 'Percent'   },
  { code: 'date',      label: 'Date'      },
  { code: 'datetime',  label: 'DateTime'  },
  { code: 'time',      label: 'Time'      },
  { code: 'boolean',   label: 'Boolean'   },
  { code: 'checkbox',  label: 'CheckBox'  },
  { code: 'radio',     label: 'Radio'     },
  { code: 'dropdown',  label: 'Dropdown'  },
  { code: 'lookup',    label: 'Lookup'    },
  { code: 'multiline', label: 'Multiline' },
  { code: 'progress',  label: 'Progress'  },
  { code: 'image',     label: 'Image'     },
  { code: 'icon',      label: 'Icon'      },
  { code: 'button',    label: 'Button'    },
  { code: 'link',      label: 'Link'      },
  { code: 'html',      label: 'HTML'      },
  { code: 'color',     label: 'Color'     },
  { code: 'file',      label: 'File'      },
];

// 레거시 format 값 매핑 (이전 'string' → 'text')
const normalizeColumnFormat = (f) => (f === 'string' ? 'text' : (f || 'text'));

const makeEmptyGridColumn = (order = 1) => ({
  column: '',
  name: '',
  i18nKey: '',
  align: 'left',
  order,
  visible: true,
  dataType: 'text',
  size: 120,
  format: 'text',
  // format === 'dropdown' 전용 필드
  dropdownSource: 'manual',          // 'manual' | 'sp'
  dropdownItems: [],                 // [{ value, display }]
  dropdownSpName: '',
  dropdownValueField: '',
  dropdownDisplayField: '',
});

// SELECT ... FROM 블록에서 컬럼 alias/이름 추출 (best-effort)
//   - `COL_A`, `X.COL_A`, `X.COL_A AS alias`, `expr AS alias` 지원
//   - `SELECT *` 또는 비표준 문법은 스킵
const extractColumnsFromSelectSql = (sqlText) => {
  if (!sqlText || typeof sqlText !== 'string') return [];
  const m = /SELECT\s+(DISTINCT\s+|TOP\s+\d+\s+)?([\s\S]+?)\s+FROM\s/i.exec(sqlText);
  if (!m) return [];
  const selectList = m[2];
  if (selectList.trim() === '*') return [];
  // 괄호 보호하면서 comma split
  const parts = [];
  let depth = 0;
  let buf = '';
  for (const ch of selectList) {
    if (ch === '(') depth += 1;
    else if (ch === ')') depth = Math.max(0, depth - 1);
    if (ch === ',' && depth === 0) { parts.push(buf); buf = ''; continue; }
    buf += ch;
  }
  if (buf.trim()) parts.push(buf);
  const cols = [];
  parts.forEach(raw => {
    let p = raw.trim();
    if (!p) return;
    // "expr AS alias" 또는 끝단어를 컬럼명으로
    const asMatch = /\s+AS\s+[`"\[]?([A-Za-z_][\w]*)[`"\]]?\s*$/i.exec(p);
    let colName = null;
    if (asMatch) {
      colName = asMatch[1];
    } else {
      const tailMatch = /([A-Za-z_][\w]*)\s*$/.exec(p.replace(/[`"\[\]]/g, ''));
      if (tailMatch) colName = tailMatch[1];
    }
    if (colName && !cols.includes(colName)) cols.push(colName);
  });
  return cols;
};

function ColumnDefinitionGrid({ columns, onChange, readSqlText }) {
  const [extractOpen, setExtractOpen] = React.useState(false);
  const [extractText, setExtractText] = React.useState('');
  const safeColumns = Array.isArray(columns) ? columns : [];

  const emit = (next) => onChange(next);

  const handleAdd = () => {
    const order = safeColumns.length + 1;
    emit([...safeColumns, makeEmptyGridColumn(order)]);
  };
  const handleRemove = (idx) => {
    const next = safeColumns.filter((_, i) => i !== idx)
      .map((c, i) => ({ ...c, order: i + 1 }));
    emit(next);
  };
  const handleChangeField = (idx, patch) => {
    emit(safeColumns.map((c, i) => i === idx ? { ...c, ...patch } : c));
  };
  const handleMove = (idx, dir) => {
    const j = idx + dir;
    if (j < 0 || j >= safeColumns.length) return;
    const next = [...safeColumns];
    [next[idx], next[j]] = [next[j], next[idx]];
    emit(next.map((c, i) => ({ ...c, order: i + 1 })));
  };

  const handleExtract = () => {
    const source = extractText || readSqlText || '';
    const names = extractColumnsFromSelectSql(source);
    if (!names.length) {
      // 노이즈 경고: 알림창 대신 extractText 에 힌트만 남김
      setExtractText(
        (source || '') + '\n-- (파싱 실패: SELECT ... FROM 블록과 컬럼 alias 를 확인하세요)'
      );
      return;
    }
    const existingKeys = new Set(safeColumns.map(c => (c.column || '').toUpperCase()));
    const appended = [...safeColumns];
    names.forEach((n) => {
      if (!existingKeys.has(n.toUpperCase())) {
        appended.push({
          ...makeEmptyGridColumn(appended.length + 1),
          column: n,
          name: n,
        });
      }
    });
    emit(appended);
    setExtractOpen(false);
    setExtractText('');
  };

  return (
    <Paper variant="outlined" sx={{ p: 1.2, borderRadius: 1.5, mt: 1, bgcolor: '#fafbff' }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.8 }}>
        <Typography variant="caption" sx={{ fontWeight: 800, color: '#0f172a',
                                             letterSpacing: 0.5, fontSize: 11 }}>
          Column Grid
        </Typography>
        <Typography variant="caption" sx={{ color: '#64748b', fontSize: 10 }}>
          · Column definitions for Read SQL result ({safeColumns.length})
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Button size="small" variant="text"
                onClick={() => { setExtractText(readSqlText || ''); setExtractOpen(o => !o); }}
                sx={{ fontSize: 11, minWidth: 0, px: 1 }}>
          Extract from SQL
        </Button>
        <Button size="small" variant="outlined" startIcon={<AddIcon />}
                onClick={handleAdd}
                sx={{ fontSize: 11 }}>
          Add Column
        </Button>
      </Stack>

      {extractOpen && (
        <Box sx={{ mb: 1, p: 1, border: '1px dashed #cbd5e1', borderRadius: 1, bgcolor: '#fff' }}>
          <Typography variant="caption" sx={{ color: '#475569', fontSize: 10, display: 'block', mb: 0.5 }}>
            Paste the full SELECT ... FROM ... statement to auto-extract columns / aliases.
          </Typography>
          <TextField size="small" multiline rows={4} fullWidth
            placeholder={'SELECT ITEM_CD, ITEM_NM AS name, ON_HAND_QTY FROM TB_CM_ITEM_MST ...'}
            value={extractText}
            onChange={(e) => setExtractText(e.target.value)}
            InputProps={{ sx: { fontFamily: 'monospace', fontSize: 11 } }}
          />
          <Stack direction="row" justifyContent="flex-end" spacing={0.5} sx={{ mt: 0.6 }}>
            <Button size="small" onClick={() => { setExtractOpen(false); setExtractText(''); }}
                    sx={{ fontSize: 11 }}>
              Cancel
            </Button>
            <Button size="small" variant="contained" onClick={handleExtract}
                    sx={{ fontSize: 11 }}>
              Extract
            </Button>
          </Stack>
        </Box>
      )}

      {safeColumns.length === 0 && (
        <Box sx={{ p: 1.5, textAlign: 'center', color: '#94a3b8', fontSize: 11,
                   border: '1px dashed #cbd5e1', borderRadius: 1 }}>
          No columns defined. Click &quot;Add Column&quot; or &quot;Extract from SQL&quot;.
        </Box>
      )}

      {safeColumns.length > 0 && (
        <Box sx={{ overflowX: 'auto' }}>
          {/* Header */}
          <Stack direction="row" spacing={0.5} alignItems="center"
                 sx={{ fontSize: 10, fontWeight: 800, color: '#475569',
                       bgcolor: '#f1f5f9', p: 0.5, borderRadius: 0.5,
                       minWidth: 1020 }}>
            <Box sx={{ width: 28,  textAlign: 'center' }}>No</Box>
            <Box sx={{ width: 130 }}>Column</Box>
            <Box sx={{ width: 130 }}>Name</Box>
            <Box sx={{ width: 140 }}>i18n Key</Box>
            <Box sx={{ width: 72  }}>Align</Box>
            <Box sx={{ width: 56  }}>Order</Box>
            <Box sx={{ width: 60,  textAlign: 'center' }}>Visible</Box>
            <Box sx={{ width: 92  }}>DataType</Box>
            <Box sx={{ width: 56  }}>Size</Box>
            <Box sx={{ width: 118 }}>Format</Box>
            <Box sx={{ width: 56  }} />
          </Stack>

          {/* Rows */}
          {safeColumns.map((c, i) => {
            const normalizedFormat = normalizeColumnFormat(c.format);
            const isDropdown = normalizedFormat === 'dropdown';
            return (
              <Box key={i} sx={{ borderBottom: '1px solid #e2e8f0', py: 0.6 }}>
                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 1020 }}>
                  <Box sx={{ width: 28, textAlign: 'center', fontSize: 11, color: '#64748b' }}>
                    {i + 1}
                  </Box>
                  <TextField size="small" variant="standard"
                    value={c.column || ''}
                    onChange={(e) => handleChangeField(i, { column: e.target.value })}
                    placeholder="COL_CD"
                    sx={{ width: 130 }}
                    InputProps={{ sx: { fontFamily: 'monospace', fontSize: 11 } }} />
                  <TextField size="small" variant="standard"
                    value={c.name || ''}
                    onChange={(e) => handleChangeField(i, { name: e.target.value })}
                    placeholder="Name"
                    sx={{ width: 130 }}
                    InputProps={{ sx: { fontSize: 11 } }} />
                  <TextField size="small" variant="standard"
                    value={c.i18nKey || ''}
                    onChange={(e) => handleChangeField(i, { i18nKey: e.target.value })}
                    placeholder="LABEL_ITEM_CD"
                    sx={{ width: 140 }}
                    InputProps={{ sx: { fontFamily: 'monospace', fontSize: 11 } }} />
                  <TextField select size="small" variant="standard"
                    value={c.align || 'left'}
                    onChange={(e) => handleChangeField(i, { align: e.target.value })}
                    sx={{ width: 72 }}
                    SelectProps={{ sx: { fontSize: 11 } }}>
                    {GRID_COLUMN_ALIGNS.map(a => (
                      <MenuItem key={a.code} value={a.code} sx={{ fontSize: 11 }}>{a.label}</MenuItem>
                    ))}
                  </TextField>
                  <TextField size="small" type="number" variant="standard"
                    value={c.order ?? i + 1}
                    onChange={(e) => handleChangeField(i, { order: Number(e.target.value) || 0 })}
                    sx={{ width: 56 }}
                    InputProps={{ sx: { fontSize: 11 } }} />
                  <Box sx={{ width: 60, textAlign: 'center' }}>
                    <Checkbox size="small" checked={!!c.visible}
                              onChange={(e) => handleChangeField(i, { visible: e.target.checked })}
                              sx={{ p: 0.3 }} />
                  </Box>
                  <TextField select size="small" variant="standard"
                    value={c.dataType || 'text'}
                    onChange={(e) => handleChangeField(i, { dataType: e.target.value })}
                    sx={{ width: 92 }}
                    SelectProps={{ sx: { fontSize: 11 } }}>
                    {GRID_COLUMN_DATA_TYPES.map(t => (
                      <MenuItem key={t.code} value={t.code} sx={{ fontSize: 11 }}>{t.label}</MenuItem>
                    ))}
                  </TextField>
                  <TextField size="small" type="number" variant="standard"
                    value={c.size ?? 120}
                    onChange={(e) => handleChangeField(i, { size: Number(e.target.value) || 0 })}
                    sx={{ width: 56 }}
                    InputProps={{ sx: { fontSize: 11 } }} />
                  <TextField select size="small" variant="standard"
                    value={normalizedFormat}
                    onChange={(e) => handleChangeField(i, { format: e.target.value })}
                    sx={{ width: 118 }}
                    SelectProps={{ sx: { fontSize: 11 } }}>
                    {GRID_COLUMN_FORMATS.map(f => (
                      <MenuItem key={f.code} value={f.code} sx={{ fontSize: 11 }}>{f.label}</MenuItem>
                    ))}
                  </TextField>
                  <Box sx={{ width: 56, display: 'flex', justifyContent: 'flex-end' }}>
                    <IconButton size="small" onClick={() => handleMove(i, -1)} sx={{ p: 0.2 }}
                                disabled={i === 0}>
                      <Box sx={{ fontSize: 10, fontWeight: 800 }}>▲</Box>
                    </IconButton>
                    <IconButton size="small" onClick={() => handleMove(i, 1)} sx={{ p: 0.2 }}
                                disabled={i === safeColumns.length - 1}>
                      <Box sx={{ fontSize: 10, fontWeight: 800 }}>▼</Box>
                    </IconButton>
                    <IconButton size="small" onClick={() => handleRemove(i)} sx={{ p: 0.2 }}>
                      <DeleteIcon sx={{ fontSize: 14, color: '#ef4444' }} />
                    </IconButton>
                  </Box>
                </Stack>

                {/* Dropdown 전용 서브 편집기 */}
                {isDropdown && (
                  <DropdownColumnSubEditor
                    col={c}
                    onChange={(patch) => handleChangeField(i, patch)}
                  />
                )}
              </Box>
            );
          })}
        </Box>
      )}
    </Paper>
  );
}

// format === 'dropdown' 인 컬럼의 옵션 공급 방식(데이터 직접 입력 vs SP) + value/display 설정
function DropdownColumnSubEditor({ col, onChange }) {
  const items = Array.isArray(col.dropdownItems) ? col.dropdownItems : [];
  const source = col.dropdownSource || 'manual';

  const handleAddItem = () => onChange({ dropdownItems: [...items, { value: '', display: '' }] });
  const handleChangeItem = (i, patch) =>
    onChange({ dropdownItems: items.map((it, idx) => idx === i ? { ...it, ...patch } : it) });
  const handleRemoveItem = (i) =>
    onChange({ dropdownItems: items.filter((_, idx) => idx !== i) });

  return (
    <Box sx={{ ml: 4, mt: 0.6, p: 1, border: '1px dashed #cbd5e1', borderRadius: 1,
                bgcolor: '#f8fafc', minWidth: 780 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.6 }}>
        <Typography variant="caption" sx={{ fontSize: 10, fontWeight: 800, color: '#475569' }}>
          Dropdown Options
        </Typography>
        <TextField select size="small" variant="standard"
          value={source}
          onChange={(e) => onChange({ dropdownSource: e.target.value })}
          SelectProps={{ sx: { fontSize: 11 } }}
          sx={{ width: 160 }}>
          <MenuItem value="manual" sx={{ fontSize: 11 }}>Manual Items</MenuItem>
          <MenuItem value="sp"     sx={{ fontSize: 11 }}>Dropdown SP</MenuItem>
        </TextField>
      </Stack>

      {source === 'manual' && (
        <Stack spacing={0.4}>
          {items.length === 0 && (
            <Typography variant="caption" sx={{ fontSize: 10, color: '#94a3b8' }}>
              Enter value / display pairs directly.
            </Typography>
          )}
          {items.map((it, idx) => (
            <Stack key={idx} direction="row" spacing={0.5} alignItems="center">
              <TextField size="small" variant="standard" placeholder="value"
                value={it.value || ''}
                onChange={(e) => handleChangeItem(idx, { value: e.target.value })}
                sx={{ width: 160 }}
                InputProps={{ sx: { fontFamily: 'monospace', fontSize: 11 } }} />
              <TextField size="small" variant="standard" placeholder="display"
                value={it.display || ''}
                onChange={(e) => handleChangeItem(idx, { display: e.target.value })}
                sx={{ width: 200 }}
                InputProps={{ sx: { fontSize: 11 } }} />
              <IconButton size="small" onClick={() => handleRemoveItem(idx)} sx={{ p: 0.2 }}>
                <DeleteIcon sx={{ fontSize: 13, color: '#ef4444' }} />
              </IconButton>
            </Stack>
          ))}
          <Button size="small" variant="text" startIcon={<AddIcon />}
                  onClick={handleAddItem}
                  sx={{ alignSelf: 'flex-start', fontSize: 11 }}>
            Add Item
          </Button>
        </Stack>
      )}

      {source === 'sp' && (
        <Stack direction="row" spacing={1}>
          <TextField size="small" variant="standard" label="SP Name"
            placeholder="SP_COMM_SRH_*"
            value={col.dropdownSpName || ''}
            onChange={(e) => onChange({ dropdownSpName: e.target.value })}
            sx={{ width: 220 }}
            InputProps={{ sx: { fontFamily: 'monospace', fontSize: 11 } }} />
          <TextField size="small" variant="standard" label="Value Field"
            placeholder="CODE"
            value={col.dropdownValueField || ''}
            onChange={(e) => onChange({ dropdownValueField: e.target.value })}
            sx={{ width: 130 }}
            InputProps={{ sx: { fontFamily: 'monospace', fontSize: 11 } }} />
          <TextField size="small" variant="standard" label="Display Field"
            placeholder="NAME"
            value={col.dropdownDisplayField || ''}
            onChange={(e) => onChange({ dropdownDisplayField: e.target.value })}
            sx={{ width: 130 }}
            InputProps={{ sx: { fontFamily: 'monospace', fontSize: 11 } }} />
        </Stack>
      )}
    </Box>
  );
}

function DataBindingEditor({ dataBinding, allLayers, layerKey, isGridLayer, onChange }) {
  const [op, setOp] = React.useState('R');

  const src = normalizeDataSource(dataBinding.source);
  const createOp = dataBinding.create || {};
  const updateOp = dataBinding.update || {};
  const deleteOp = dataBinding.delete || {};

  const setCreate = (next) => onChange({ ...dataBinding, create: next });
  const setUpdate = (next) => onChange({ ...dataBinding, update: next });
  const setDelete = (next) => onChange({ ...dataBinding, delete: next });

  // R 영역 핸들러 (현재 dataBinding 루트 필드 수정)
  const setRead = (patch) => onChange({ ...dataBinding, ...patch });

  return (
    <Box>
      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700,
                                            display: 'block', mb: 1 }}>
        Where does the data come from, and how are CRUD operations wired?
      </Typography>
      <Tabs value={op} onChange={(_e, v) => setOp(v)} variant="fullWidth"
            sx={{ borderBottom: '1px solid #e2e8f0', minHeight: 32, mb: 1.5 }}>
        <Tab value="R" label={<Box sx={{ fontSize: 11, fontWeight: 800 }}>R · Read</Box>}
             sx={{ minHeight: 32, textTransform: 'none' }} />
        <Tab value="C" label={<Box sx={{ fontSize: 11, fontWeight: 800 }}>C · Create</Box>}
             sx={{ minHeight: 32, textTransform: 'none' }} />
        <Tab value="U" label={<Box sx={{ fontSize: 11, fontWeight: 800 }}>U · Update</Box>}
             sx={{ minHeight: 32, textTransform: 'none' }} />
        <Tab value="D" label={<Box sx={{ fontSize: 11, fontWeight: 800 }}>D · Delete</Box>}
             sx={{ minHeight: 32, textTransform: 'none' }} />
      </Tabs>

      {/* R — 기존 7종 source */}
      {op === 'R' && (
        <Stack spacing={1.5}>
          <TextField select label="Source Type" size="small"
            value={src}
            onChange={(e) => setRead({ source: e.target.value })}>
            {DATA_SOURCES.map(s => (
              <MenuItem key={s.code} value={s.code}>{s.label}</MenuItem>
            ))}
          </TextField>
          {/* 1) SP */}
          {src === 'sp' && (
            <>
              <TextField label="SP Name" size="small"
                placeholder="SP_UI_CM_50_Q1"
                value={dataBinding.spName || ''}
                onChange={(e) => setRead({ spName: e.target.value })} />
              <TextField label="Parameters (JSON)" size="small" multiline rows={3}
                placeholder={'{ "planScope": "S1", "locCd": "..." }'}
                value={dataBinding.params || ''}
                onChange={(e) => setRead({ params: e.target.value })} />
            </>
          )}
          {/* 2) Ontology */}
          {src === 'ontology' && (
            <>
              <TextField label="Ontology Entity" size="small"
                placeholder="INV_TURNOVER / ABCXYZ_ANALYSIS"
                value={dataBinding.ontologyEntity || ''}
                onChange={(e) => setRead({ ontologyEntity: e.target.value })} />
              <TextField label="Version" size="small"
                placeholder="v1 (default: current published)"
                value={dataBinding.ontologyVersion || ''}
                onChange={(e) => setRead({ ontologyVersion: e.target.value })} />
              <TextField label="Intent / Query ID" size="small"
                placeholder="slow_moving / yoy_growth"
                value={dataBinding.ontologyIntent || ''}
                onChange={(e) => setRead({ ontologyIntent: e.target.value })} />
            </>
          )}
          {/* 3) DB Entity */}
          {src === 'db_entity' && (
            <>
              <TextField select label="Entity Type" size="small"
                value={dataBinding.entityType || 'table'}
                onChange={(e) => setRead({ entityType: e.target.value })}>
                <MenuItem value="table">Table</MenuItem>
                <MenuItem value="view">View</MenuItem>
              </TextField>
              <TextField label="Entity Name" size="small"
                placeholder="TB_CM_ITEM_MST / VW_INVENTORY_PLAN_CONFIRMED"
                value={dataBinding.entityName || ''}
                onChange={(e) => setRead({ entityName: e.target.value })} />
              <TextField label="Columns" size="small"
                placeholder="ITEM_CD, ITEM_NM, ON_HAND_QTY"
                value={dataBinding.columns || ''}
                onChange={(e) => setRead({ columns: e.target.value })} />
              <TextField label="Filter (WHERE clause)" size="small" multiline rows={2}
                placeholder="USE_YN = 'Y' AND PLAN_SCOPE = :planScope"
                value={dataBinding.filter || ''}
                onChange={(e) => setRead({ filter: e.target.value })} />
            </>
          )}
          {/* 4) KPI Dictionary & DB Entity */}
          {src === 'kpi_db' && (
            <>
              <TextField label="KPI Code" size="small"
                placeholder="DP01 / BF14 / SA07"
                value={dataBinding.kpiCode || ''}
                onChange={(e) => setRead({ kpiCode: e.target.value })} />
              <TextField label="Linked DB Entity" size="small"
                placeholder="VW_DEMAND_PLAN / TB_BF_RT"
                value={dataBinding.entityName || ''}
                onChange={(e) => setRead({ entityName: e.target.value })} />
              <TextField label="Measure Column" size="small"
                placeholder="QTY / FCST_QTY"
                value={dataBinding.measureColumn || ''}
                onChange={(e) => setRead({ measureColumn: e.target.value })} />
              <TextField label="Filter (WHERE clause)" size="small" multiline rows={2}
                placeholder="CUTOFF_DATE = (SELECT MAX(CUTOFF_DATE) FROM ...)"
                value={dataBinding.filter || ''}
                onChange={(e) => setRead({ filter: e.target.value })} />
            </>
          )}
          {/* 5) Code Master */}
          {src === 'code_master' && (
            <>
              <TextField label="Code Group" size="small"
                placeholder="UOM / LOCATION_TYPE / ITEM_CLASS"
                value={dataBinding.codeGroup || ''}
                onChange={(e) => setRead({ codeGroup: e.target.value })} />
              <TextField select label="Language" size="small"
                value={dataBinding.langCd || 'ko'}
                onChange={(e) => setRead({ langCd: e.target.value })}>
                <MenuItem value="ko">Korean (ko)</MenuItem>
                <MenuItem value="en">English (en)</MenuItem>
                <MenuItem value="ja">Japanese (ja)</MenuItem>
                <MenuItem value="zh">Chinese (zh)</MenuItem>
              </TextField>
              <TextField label="Include Inactive" size="small"
                placeholder="false"
                value={dataBinding.includeInactive || ''}
                onChange={(e) => setRead({ includeInactive: e.target.value })} />
            </>
          )}
          {/* 6) Direct Input */}
          {src === 'manual' && (
            <TextField label="Static Value (JSON)" size="small" multiline rows={5}
              placeholder={'[{ "x": "Jan", "y": 100 }, { "x": "Feb", "y": 120 }]'}
              value={dataBinding.staticValue || ''}
              onChange={(e) => setRead({ staticValue: e.target.value })} />
          )}
          {/* 7) Other Layer Data */}
          {src === 'block' && (
            <>
              <TextField select label="Source Block" size="small"
                value={dataBinding.sourceKey || ''}
                onChange={(e) => setRead({ sourceKey: e.target.value })}>
                <MenuItem value="">— Select —</MenuItem>
                {allLayers.filter(l => l.key !== layerKey).map(l => (
                  <MenuItem key={l.key} value={l.key}>
                    {l.key} · {l.title || '(no title)'}
                  </MenuItem>
                ))}
              </TextField>
              <TextField label="Mapping (JSON path / expression)" size="small"
                placeholder="$.selectedRow.itemCd"
                value={dataBinding.mapping || ''}
                onChange={(e) => setRead({ mapping: e.target.value })} />
            </>
          )}

          {/* Grid layer 전용 — Read SQL 결과 컬럼 정의 */}
          {isGridLayer && (
            <ColumnDefinitionGrid
              columns={dataBinding.gridColumns || []}
              readSqlText={
                dataBinding.sqlText
                || dataBinding.filter
                || dataBinding.params
                || ''
              }
              onChange={(next) => setRead({ gridColumns: next })}
            />
          )}
        </Stack>
      )}

      {op === 'C' && (
        <WriteOpForm label="Create (INSERT)" op={createOp}
                     opDefaults={{ source: 'sp' }} onChange={setCreate} />
      )}
      {op === 'U' && (
        <WriteOpForm label="Update (UPDATE)" op={updateOp}
                     opDefaults={{ source: 'sp' }} onChange={setUpdate} />
      )}
      {op === 'D' && (
        <WriteOpForm label="Delete (DELETE)" op={deleteOp}
                     opDefaults={{ source: 'sp' }} onChange={setDelete} />
      )}
    </Box>
  );
}

// ============================================================================
//  EventCard — 하나의 Event trigger 카드 (Events 탭에서 여러 개 나열)
//    구성: 이벤트 / 대상 Block / 액션 / 초기 발사 / 가드 / Payload 매핑 / 디바운스
// ============================================================================
function SectionHeader({ title, right }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1,
               mt: 1.5, mb: 0.5 }}>
      <Box sx={{ fontSize: 11, fontWeight: 800, color: '#475569',
                 letterSpacing: 0.5, textTransform: 'uppercase',
                 whiteSpace: 'nowrap' }}>
        ─ {title}
      </Box>
      <Box sx={{ flex: 1, height: 1, bgcolor: '#e2e8f0' }} />
      {right}
    </Box>
  );
}

function EventCard({ ev, idx, allLayers, currentLayerKey, onChange, onRemove, onAutoDetect }) {
  const eventMeta  = EVENT_TYPES.find(e => e.code === ev.event);
  const actionMeta = EVENT_ACTIONS.find(a => a.code === ev.action);
  const targetLayer = allLayers.find(l => l.key === ev.targetKey);
  const initialFire  = ev.initialFire  || { enabled: false, target: 'firstRow', skipIfEmpty: true };
  const guard        = ev.guard        || { checkUnsavedChanges: false, messageKey: 'msg.unsaved_changes' };
  const payloadMap   = Array.isArray(ev.payloadMapping) ? ev.payloadMapping : [];
  const debounceMs   = ev.debounceMs;

  const patch = (p) => onChange({ ...ev, ...p });
  const patchInitialFire = (p) => patch({ initialFire: { ...initialFire, ...p } });
  const patchGuard       = (p) => patch({ guard: { ...guard, ...p } });
  const setPayloadMap    = (next) => patch({ payloadMapping: next });

  const handleAddParam = () => {
    setPayloadMap([...payloadMap, { paramKey: '', binding: '' }]);
  };
  const handleUpdateParam = (i, p) => {
    setPayloadMap(payloadMap.map((m, mi) => mi === i ? { ...m, ...p } : m));
  };
  const handleRemoveParam = (i) => {
    setPayloadMap(payloadMap.filter((_, mi) => mi !== i));
  };

  return (
    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.5 }}>
      {/* 헤더 */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <Chip label={`#${idx + 1}`} size="small"
              sx={{ height: 20, fontSize: 11, fontWeight: 800,
                    bgcolor: '#eff6ff', color: '#1d4ed8' }} />
        <Box sx={{ flex: 1 }} />
        <IconButton size="small" onClick={onRemove}>
          <DeleteIcon fontSize="small" sx={{ color: '#ef4444' }} />
        </IconButton>
      </Stack>

      {/* 이벤트 */}
      <TextField select label="이벤트" size="small" fullWidth
        value={ev.event || ''}
        onChange={(e) => patch({ event: e.target.value })}>
        {EVENT_TYPES.map(et => (
          <MenuItem key={et.code} value={et.code}>{et.label}</MenuItem>
        ))}
      </TextField>
      {eventMeta?.description && (
        <Typography variant="caption" sx={{ display: 'block', color: '#64748b', mt: 0.3, pl: 0.5 }}>
          ↳ 발생 시점: {eventMeta.description}
        </Typography>
      )}

      {/* 대상 Block */}
      <TextField select label="대상 Block" size="small" fullWidth sx={{ mt: 1.2 }}
        value={ev.targetKey || ''}
        onChange={(e) => patch({ targetKey: e.target.value })}>
        <MenuItem value="">— 선택 —</MenuItem>
        {allLayers.filter(l => l.key !== currentLayerKey).map(l => {
          const info = COMPONENT_INDEX[normalizeComponentCode(l.componentType)];
          return (
            <MenuItem key={l.key} value={l.key}>
              {l.key} · {l.title || '(no title)'}{info ? ` · ${info.label}` : ''}
            </MenuItem>
          );
        })}
      </TextField>

      {/* 액션 */}
      <TextField select label="액션" size="small" fullWidth sx={{ mt: 1.2 }}
        value={ev.action || ''}
        onChange={(e) => patch({ action: e.target.value })}>
        {EVENT_ACTIONS.map(a => (
          <MenuItem key={a.code} value={a.code}>{a.label}</MenuItem>
        ))}
      </TextField>
      {actionMeta?.description && (
        <Typography variant="caption" sx={{ display: 'block', color: '#64748b', mt: 0.3, pl: 0.5 }}>
          ↳ {targetLayer ? `${targetLayer.key} 의 ` : '대상의 '}{actionMeta.description}
        </Typography>
      )}

      {/* 초기 발사 */}
      <SectionHeader title="초기 발사" />
      <Stack spacing={0.5}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <FormControlLabel
            control={<Checkbox size="small"
              checked={!!initialFire.enabled}
              onChange={(e) => patchInitialFire({ enabled: e.target.checked })} />}
            label={<Typography variant="body2">조회 완료 직후</Typography>}
            sx={{ mr: 0.5 }}
          />
          <Select size="small" variant="outlined"
            disabled={!initialFire.enabled}
            value={initialFire.target || 'firstRow'}
            onChange={(e) => patchInitialFire({ target: e.target.value })}
            sx={{ fontSize: 12, minWidth: 110, '& .MuiSelect-select': { py: 0.5 } }}>
            {INITIAL_FIRE_TARGETS.map(t => (
              <MenuItem key={t.code} value={t.code}>{t.label}</MenuItem>
            ))}
          </Select>
          <Typography variant="body2" sx={{ color: '#64748b' }}>으로 자동 발사</Typography>
          {initialFire.target === 'specificIdx' && (
            <TextField size="small" type="number" label="idx"
              disabled={!initialFire.enabled}
              value={initialFire.specificIdx ?? 0}
              onChange={(e) => patchInitialFire({ specificIdx: Number(e.target.value) })}
              sx={{ width: 80 }} />
          )}
        </Box>
        <FormControlLabel
          control={<Checkbox size="small"
            checked={!!initialFire.skipIfEmpty}
            disabled={!initialFire.enabled}
            onChange={(e) => patchInitialFire({ skipIfEmpty: e.target.checked })} />}
          label={<Typography variant="body2">행이 없으면 발사 생략</Typography>}
        />
      </Stack>

      {/* 가드 */}
      <SectionHeader title="가드 (선택사항)" />
      <Stack spacing={0.5}>
        <FormControlLabel
          control={<Checkbox size="small"
            checked={!!guard.checkUnsavedChanges}
            onChange={(e) => patchGuard({ checkUnsavedChanges: e.target.checked })} />}
          label={<Typography variant="body2">대상 블록에 미저장 변경이 있으면 확인 메시지</Typography>}
        />
        {guard.checkUnsavedChanges && (
          <TextField size="small" label="메시지 키"
            value={guard.messageKey || ''}
            onChange={(e) => patchGuard({ messageKey: e.target.value })}
            placeholder="msg.unsaved_changes"
            sx={{ ml: 4, maxWidth: 360 }}
          />
        )}
      </Stack>

      {/* Payload 매핑 */}
      <SectionHeader title="Payload 매핑" right={
        <Button size="small" variant="outlined"
                onClick={() => onAutoDetect?.(idx)}
                sx={{ fontSize: 11, py: 0.2, minWidth: 80 }}>
          자동 감지
        </Button>
      } />
      <Paper variant="outlined" sx={{ p: 0, borderRadius: 1, overflow: 'hidden' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '140px 1fr 40px',
                   bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0',
                   px: 1, py: 0.5, fontSize: 11, fontWeight: 800, color: '#475569' }}>
          <Box>파라미터</Box>
          <Box>바인딩</Box>
          <Box />
        </Box>
        {payloadMap.length === 0 && (
          <Box sx={{ p: 1.2, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
            등록된 파라미터가 없습니다.
          </Box>
        )}
        {payloadMap.map((m, i) => (
          <Box key={i} sx={{ display: 'grid', gridTemplateColumns: '140px 1fr 40px',
                              px: 1, py: 0.5, gap: 0.5,
                              borderBottom: '1px solid #f1f5f9',
                              alignItems: 'center' }}>
            <TextField size="small" variant="standard"
              value={m.paramKey || ''}
              onChange={(e) => handleUpdateParam(i, { paramKey: e.target.value })}
              placeholder="ITEM_CD"
              InputProps={{ disableUnderline: true, sx: { fontSize: 12,
                                                          fontFamily: 'monospace' } }}
            />
            <Autocomplete freeSolo size="small"
              options={PAYLOAD_BINDING_SUGGESTIONS}
              value={m.binding || ''}
              onInputChange={(_e, v) => handleUpdateParam(i, { binding: v })}
              renderInput={(params) => (
                <TextField {...params} variant="standard"
                  placeholder="@current_row.ITEM_CD"
                  InputProps={{
                    ...params.InputProps,
                    disableUnderline: true,
                    sx: { fontSize: 12, fontFamily: 'monospace' },
                  }}
                />
              )}
            />
            <IconButton size="small" onClick={() => handleRemoveParam(i)}>
              <DeleteIcon fontSize="small" sx={{ fontSize: 16, color: '#ef4444' }} />
            </IconButton>
          </Box>
        ))}
        <Box sx={{ p: 0.5, borderTop: '1px solid #f1f5f9' }}>
          <Button size="small" variant="text" startIcon={<AddIcon />}
                  onClick={handleAddParam} fullWidth
                  sx={{ fontSize: 11, justifyContent: 'flex-start' }}>
            파라미터 추가
          </Button>
        </Box>
      </Paper>

      {/* 디바운스/스로틀 */}
      <SectionHeader title="디바운스/스로틀 (선택)" />
      <TextField size="small" type="number" label="연속 이벤트 병합"
        value={debounceMs ?? ''}
        onChange={(e) => patch({ debounceMs: e.target.value === '' ? null : Number(e.target.value) })}
        placeholder="예: 150"
        InputProps={{ endAdornment: <InputAdornment position="end">ms</InputAdornment> }}
        sx={{ maxWidth: 180 }}
      />
    </Paper>
  );
}

// ============================================================================
//  LayerPropertiesEditor — Props · Data · Events 편집 drawer 본문
//    Layer A: Props schema (정적 속성)
//    Layer B: 데이터 바인딩 모델
//    Layer C: Block 간 연결 (Event triggers)
// ============================================================================
function LayerPropertiesEditor({ layer, allLayers, onChange, onClose }) {
  const [tab, setTab] = React.useState(0);
  const info = COMPONENT_INDEX[normalizeComponentCode(layer.componentType)];
  const accent = info?.groupColor || '#64748b';

  const isGridLayer = isGridComponentCode(layer.componentType);
  const props       = layer.props || {};
  const dataBinding = layer.dataBinding || { source: 'manual' };
  const events      = Array.isArray(layer.events) ? layer.events : [];

  const setProps       = (next) => onChange({ props: next });
  const setDataBinding = (next) => onChange({ dataBinding: next });
  const setEvents      = (next) => onChange({ events: next });

  // Grid 계열 layer 는 Drawer 진입 시 기본 Props 4종이 누락된 경우 자동 보강
  const gridDefaultsApplied = React.useRef(false);
  React.useEffect(() => {
    if (gridDefaultsApplied.current) return;
    if (!isGridLayer) return;
    const merged = withGridDefaultProps(layer.componentType, props);
    const changed = Object.keys(merged).length !== Object.keys(props).length
      || Object.entries(merged).some(([k, v]) => props[k] !== v);
    if (changed) setProps(merged);
    gridDefaultsApplied.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGridLayer, layer.componentType]);

  // --- Props 핸들러 ---
  const handleAddProp = () => {
    const keys = Object.keys(props);
    let i = 1;
    while (keys.includes(`prop${i}`)) i += 1;
    setProps({ ...props, [`prop${i}`]: '' });
  };
  const handleRenameProp = (oldKey, newKey) => {
    if (!newKey || newKey === oldKey) return;
    const next = {};
    Object.entries(props).forEach(([k, v]) => {
      next[k === oldKey ? newKey : k] = v;
    });
    setProps(next);
  };
  const handleChangePropValue = (key, value) => {
    setProps({ ...props, [key]: value });
  };
  const handleRemoveProp = (key) => {
    const next = { ...props };
    delete next[key];
    setProps(next);
  };

  // --- Events 핸들러 ---
  const handleAddEvent = () => {
    setEvents([...events, {
      event: 'selectionChange', targetKey: '', action: 'refresh',
      initialFire: { enabled: false, target: 'firstRow', skipIfEmpty: true },
      guard: { checkUnsavedChanges: false, messageKey: 'msg.unsaved_changes' },
      payloadMapping: [],
      debounceMs: null,
    }]);
  };
  const handleChangeEvent = (idx, nextEv) => {
    setEvents(events.map((e, i) => i === idx ? nextEv : e));
  };
  const handleRemoveEvent = (idx) => {
    setEvents(events.filter((_, i) => i !== idx));
  };
  // Payload 자동 감지 — 대상 Block 의 R (SP params JSON) 에서 키 추출 → 행 바인딩 기본값 제안
  const handleAutoDetectPayload = (idx) => {
    const ev = events[idx];
    if (!ev?.targetKey) return;
    const target = allLayers.find(l => l.key === ev.targetKey);
    const params = target?.dataBinding?.params;
    if (!params) return;
    let parsed = null;
    try { parsed = JSON.parse(params); } catch (_e) { parsed = null; }
    if (!parsed || typeof parsed !== 'object') return;
    const detected = Object.keys(parsed).map(k => ({
      paramKey: k.toUpperCase(),
      binding: `@current_row.${k.toUpperCase()}`,
    }));
    if (!detected.length) return;
    // 기존 항목 중 동일 paramKey 는 유지, 없는 것만 추가
    const existing = new Set((ev.payloadMapping || []).map(m => m.paramKey));
    const merged = [
      ...(ev.payloadMapping || []),
      ...detected.filter(d => !existing.has(d.paramKey)),
    ];
    handleChangeEvent(idx, { ...ev, payloadMapping: merged });
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#fff' }}>
      {/* Header */}
      <Box sx={{
        px: 2, py: 1.5,
        borderBottom: '1px solid #e2e8f0',
        bgcolor: `${accent}11`,
        display: 'flex', alignItems: 'center', gap: 1,
      }}>
        <Chip label={layer.key} size="small"
              sx={{ height: 20, fontSize: 11, fontFamily: 'monospace',
                    bgcolor: accent, color: '#fff', fontWeight: 800 }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700,
                                                letterSpacing: 0.5, textTransform: 'uppercase' }}>
            Layer 속성
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
            {layer.title || layer.key} · {info?.label || layer.componentType}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Tabs */}
      <Tabs value={tab} onChange={(_e, v) => setTab(v)} variant="fullWidth"
            sx={{ borderBottom: '1px solid #e2e8f0', minHeight: 36 }}>
        <Tab icon={<TuneIcon sx={{ fontSize: 16 }} />} iconPosition="start"
             label={<Box sx={{ fontSize: 12, fontWeight: 700 }}>A. Props</Box>}
             sx={{ minHeight: 36, textTransform: 'none' }} />
        <Tab icon={<StorageIcon sx={{ fontSize: 16 }} />} iconPosition="start"
             label={<Box sx={{ fontSize: 12, fontWeight: 700 }}>B. Data</Box>}
             sx={{ minHeight: 36, textTransform: 'none' }} />
        <Tab icon={<FlashOnIcon sx={{ fontSize: 16 }} />} iconPosition="start"
             label={<Box sx={{ fontSize: 12, fontWeight: 700 }}>C. Events</Box>}
             sx={{ minHeight: 36, textTransform: 'none' }} />
      </Tabs>

      {/* Body */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {/* A. Props */}
        {tab === 0 && (
          <Stack spacing={1.2}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
              각 UI Block 이 필요로 하는 설정 항목 (정적 속성)
            </Typography>
            {Object.keys(props).length === 0 && (
              <Box sx={{ p: 2, textAlign: 'center', color: '#94a3b8',
                         bgcolor: '#f8fafc', borderRadius: 1, border: '1px dashed #cbd5e1' }}>
                <Typography variant="body2">아직 등록된 Prop 이 없습니다.</Typography>
              </Box>
            )}
            {Object.entries(props).map(([k, v]) => {
              const isBoolProp = isGridLayer
                && Object.prototype.hasOwnProperty.call(GRID_DEFAULT_PROPS, k);
              return (
                <Stack key={k} direction="row" spacing={1} alignItems="center">
                  <TextField size="small" label="key" defaultValue={k}
                    onBlur={(e) => handleRenameProp(k, e.target.value)}
                    sx={{ flex: 1 }} />
                  {isBoolProp ? (
                    <TextField select size="small" label="value"
                      value={String(v) === 'true' ? 'true' : 'false'}
                      onChange={(e) => handleChangePropValue(k, e.target.value)}
                      sx={{ flex: 2 }}>
                      <MenuItem value="true">true</MenuItem>
                      <MenuItem value="false">false</MenuItem>
                    </TextField>
                  ) : (
                    <TextField size="small" label="value" value={v}
                      onChange={(e) => handleChangePropValue(k, e.target.value)}
                      sx={{ flex: 2 }} />
                  )}
                  <IconButton size="small" onClick={() => handleRemoveProp(k)}>
                    <DeleteIcon fontSize="small" sx={{ color: '#ef4444' }} />
                  </IconButton>
                </Stack>
              );
            })}
            <Button size="small" variant="outlined" startIcon={<AddIcon />}
                    onClick={handleAddProp}>
              Prop 추가
            </Button>
          </Stack>
        )}

        {/* B. Data Binding — R / C / U / D 서브탭 */}
        {tab === 1 && (
          <DataBindingEditor
            dataBinding={dataBinding}
            allLayers={allLayers}
            layerKey={layer.key}
            isGridLayer={isGridLayer}
            onChange={setDataBinding}
          />
        )}

        {/* C. Events */}
        {tab === 2 && (
          <Stack spacing={1.5}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
              이 Block 의 이벤트가 다른 Block 에 어떻게 전달되는가?
            </Typography>
            {events.length === 0 && (
              <Box sx={{ p: 2, textAlign: 'center', color: '#94a3b8',
                         bgcolor: '#f8fafc', borderRadius: 1, border: '1px dashed #cbd5e1' }}>
                <Typography variant="body2">아직 등록된 Event 가 없습니다.</Typography>
              </Box>
            )}
            {events.map((ev, idx) => (
              <EventCard
                key={idx}
                ev={ev}
                idx={idx}
                allLayers={allLayers}
                currentLayerKey={layer.key}
                onChange={(nextEv) => handleChangeEvent(idx, nextEv)}
                onRemove={() => handleRemoveEvent(idx)}
                onAutoDetect={handleAutoDetectPayload}
              />
            ))}
            <Button size="small" variant="outlined" startIcon={<AddIcon />}
                    onClick={handleAddEvent}>
              Event 추가
            </Button>
          </Stack>
        )}
      </Box>
    </Box>
  );
}

// ============================================================================
//  LayerBodyPreview — accent 색 박스 + 가운데 타이틀 한 줄로 통일
//    이전엔 10개 카테고리(DATA_DISPLAY/CHART/INPUT/...)별로 가짜 mock 을 그렸으나
//    "Code/Name/Qty/Status" 같은 가짜 컬럼이 실제 컬럼으로 오해되는 사고가 있어
//    단순 placeholder 로 정리. 카테고리 구분은 accent 색 + 상단 헤더 chip 으로.
//    탭 컨테이너만 인터랙티브 본문(TabContainerBody) 유지.
// ============================================================================
function LayerBodyPreview({ layer, group, code, label, accent, readOnly,
                             onUpdateLayer, onOpenTabSettings, nested = false }) {
  if (!nested && group === 'CONTAINER' && code === 'CONTAINER_TAB') {
    return (
      <TabContainerBody layer={layer} accent={accent}
                        readOnly={readOnly}
                        onUpdateLayer={onUpdateLayer}
                        onOpenTabSettings={onOpenTabSettings} />
    );
  }

  const title = layer?.title || label || code || '';
  const bg = accent || '#64748b';
  return (
    <Box sx={{
      flex: 1,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      bgcolor: bg,
      overflow: 'hidden',
      p: 1.5,
    }}>
      <Typography sx={{
        color: '#fff', fontSize: 14, fontWeight: 600,
        textAlign: 'center',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        maxWidth: '100%',
        textShadow: '0 1px 2px rgba(0,0,0,0.15)',
      }}>
        {title}
      </Typography>
    </Box>
  );
}

function LayoutDesigner({ value, onChange, readOnly = false }) {
  const config = useMemo(() => ensureConfig(value), [value]);
  const [containerW, setContainerW] = useState(800);
  const [gridH, setGridH]           = useState(360);
  const [ctxMenu, setCtxMenu]       = useState(null); // { mouseX, mouseY, layerKey }
  // D&D drop-hint 상태 — 현재 드래그 중인 layer + 마우스가 걸쳐 있는 target 의 가장 가까운 edge
  const [draggingKey, setDraggingKey] = useState(null);
  const [dropHint, setDropHint]       = useState(null); // { targetKey, edge: 'top'|'bottom'|'left'|'right' }
  const gridBoxRef                  = useRef(null);
  // 드래그 시작 시점의 layer 스냅샷 — 드롭 위치 계산용 (드래그 중 RGL 이 다른 layer 를 밀쳐도 고정)
  const dragStartLayersRef          = useRef(null);
  // Split-bar 드래그 상태 — Layer 사이 경계를 잡아서 상/하/좌/우/좌우상하 동시 조정
  const [dragSplit, setDragSplit]   = useState(null);
  // { hSplit?, vSplit?, startX, startY, initialLayers }
  // Props / Data / Events 편집 drawer 타겟
  //   { layerKey }                    → layer 자체 편집
  //   { layerKey, tabId }              → CONTAINER_TAB 내부 특정 tab 의 컴포넌트 편집
  const [propsDrawerTarget, setPropsDrawerTarget] = useState(null);

  // canvas 폭·높이 측정 — 동적 rowHeight 계산용
  useEffect(() => {
    if (!gridBoxRef.current) return undefined;
    const el = gridBoxRef.current;
    const ro = new ResizeObserver(() => {
      setContainerW(el.clientWidth  || 800);
      setGridH(el.clientHeight || 360);
    });
    ro.observe(el);
    setContainerW(el.clientWidth  || 800);
    setGridH(el.clientHeight || 360);
    return () => ro.disconnect();
  }, []);

  const emit = (nextCfg) => onChange?.(nextCfg);

  // 외부에서 들어온 value 가 정규화 안돼 있으면 자동 normalize
  //   · 최초 마운트 / 탭 전환(main ↔ popup) / Excel 재파싱 시 잔여 여백 즉시 제거
  useEffect(() => {
    if (readOnly) return;
    if (!config.layers.length) return;
    const cols = config.cols || COLS_DEFAULT;
    const rows = getTotalRows(config.layers);
    const normalized = normalizeLayers(config.layers, cols, rows);
    const isSame = normalized.length === config.layers.length && normalized.every((l, i) => {
      const o = config.layers[i];
      return o && o.x === l.x && o.y === l.y && o.w === l.w && o.h === l.h;
    });
    if (!isSame) onChange?.({ ...config, layers: normalized });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // 실시간 rowHeight — Layer 가 아무리 많아져도 항상 canvas 에 전부 들어가도록 축소
  //   · RGL 의 공식: containerH = padding*2 + rowHeight*rows + marginY*(rows-1)
  //   · 역산: rowHeight = (containerH - padding*2 - marginY*(rows-1)) / rows
  //   · rows 가 많아질수록 marginY 도 함께 줄여서 여백 비중이 과해지지 않게
  const totalRows = useMemo(() => getTotalRows(config.layers), [config.layers]);
  const marginY   = useMemo(() => computeMarginY(totalRows), [totalRows]);
  const rowHeight = useMemo(() => {
    const rows    = Math.max(1, totalRows);
    const usable  = gridH - RGL_PADDING[1] * 2 - marginY * Math.max(0, rows - 1);
    return Math.max(MIN_ROW_HEIGHT, Math.floor(usable / rows));
  }, [gridH, totalRows, marginY]);

  const layouts = useMemo(() => config.layers.map(l => ({
    i: l.key,
    x: l.x || 0, y: l.y || 0,
    w: l.w || 4, h: l.h || 3,
    minW: 1, minH: 2,
  })), [config]);

  // ============================================================================
  //  Drop-hint (상·하·좌·우 표시)
  //    · 드래그 시작 시점의 layer 위치를 기준으로 hit-test → 드래그 중에도 target 이 흔들리지 않음
  //    · 마우스가 target layer 의 경계 안에 있으면, 4개 edge 중 가장 가까운 쪽을 dropHint 로 저장
  //    · Drop 시 dragged layer 를 target 의 해당 half 에 삽입 (target 은 반으로 줄어듦)
  // ============================================================================
  const cols = config.cols || COLS_DEFAULT;
  const colWidth = useMemo(() => {
    const c = Math.max(1, cols);
    return (containerW - RGL_PADDING[0] * 2 - RGL_MARGIN_X * (c - 1)) / c;
  }, [containerW, cols]);

  const getLayerPixelBounds = (layer) => {
    const px = (colWidth + RGL_MARGIN_X)   * (layer.x || 0) + RGL_PADDING[0];
    const py = (rowHeight + marginY)       * (layer.y || 0) + RGL_PADDING[1];
    const pw = colWidth * (layer.w || 1) + Math.max(0, (layer.w || 1) - 1) * RGL_MARGIN_X;
    const ph = rowHeight * (layer.h || 1) + Math.max(0, (layer.h || 1) - 1) * marginY;
    return { px, py, pw, ph };
  };

  // 그리드 좌표 → 픽셀 좌표 (split bar 전용 헬퍼)
  const gridXToPx = (gx) => gx * (colWidth + RGL_MARGIN_X) + RGL_PADDING[0];
  const gridYToPx = (gy) => gy * (rowHeight + marginY)    + RGL_PADDING[1];

  // ============================================================================
  //  Split Bar 계산
  //    · 인접한 layer 사이의 공통 edge 를 찾아 가로·세로 split 세그먼트로 반환
  //    · 한 drag 로 "top group h +=Δ / bottom group y+=Δ, h-=Δ" (수평 bar)
  //    · 한 drag 로 "left group w +=Δ / right group x+=Δ, w-=Δ" (수직 bar)
  //    · H·V 세그먼트가 한 지점에서 교차하면 corner 로 양축 동시 조정
  // ============================================================================
  const splits = useMemo(() => {
    const hSplits = [];
    const vSplits = [];
    const layers  = config.layers;
    const totalCols = cols;
    const totalY    = totalRows;
    if (!layers.length) return { hSplits, vSplits, corners: [] };

    // --- 수평 split (상/하 사이의 bar) ---
    const ys = new Set();
    layers.forEach(l => { if ((l.y || 0) > 0) ys.add(l.y); });
    ys.forEach(y => {
      const topGroup    = layers.filter(l => (l.y || 0) + (l.h || 1) === y);
      const bottomGroup = layers.filter(l => (l.y || 0) === y);
      if (!topGroup.length || !bottomGroup.length) return;
      const topMask = new Array(totalCols).fill(false);
      topGroup.forEach(l => {
        for (let i = l.x || 0; i < (l.x || 0) + (l.w || 0); i += 1) topMask[i] = true;
      });
      const botMask = new Array(totalCols).fill(false);
      bottomGroup.forEach(l => {
        for (let i = l.x || 0; i < (l.x || 0) + (l.w || 0); i += 1) botMask[i] = true;
      });
      let start = -1;
      for (let i = 0; i <= totalCols; i += 1) {
        const ok = i < totalCols && topMask[i] && botMask[i];
        if (ok && start === -1) start = i;
        if (!ok && start !== -1) {
          const x1 = start;
          const x2 = i;
          const tops = topGroup.filter(l => !((l.x + l.w) <= x1 || l.x >= x2));
          const bots = bottomGroup.filter(l => !((l.x + l.w) <= x1 || l.x >= x2));
          hSplits.push({
            y, x1, x2,
            topKeys:    tops.map(l => l.key),
            bottomKeys: bots.map(l => l.key),
          });
          start = -1;
        }
      }
    });

    // --- 수직 split (좌/우 사이의 bar) ---
    const xs = new Set();
    layers.forEach(l => { if ((l.x || 0) > 0) xs.add(l.x); });
    xs.forEach(x => {
      const leftGroup  = layers.filter(l => (l.x || 0) + (l.w || 0) === x);
      const rightGroup = layers.filter(l => (l.x || 0) === x);
      if (!leftGroup.length || !rightGroup.length) return;
      const leftMask = new Array(totalY).fill(false);
      leftGroup.forEach(l => {
        for (let i = l.y || 0; i < (l.y || 0) + (l.h || 0); i += 1) leftMask[i] = true;
      });
      const rightMask = new Array(totalY).fill(false);
      rightGroup.forEach(l => {
        for (let i = l.y || 0; i < (l.y || 0) + (l.h || 0); i += 1) rightMask[i] = true;
      });
      let start = -1;
      for (let i = 0; i <= totalY; i += 1) {
        const ok = i < totalY && leftMask[i] && rightMask[i];
        if (ok && start === -1) start = i;
        if (!ok && start !== -1) {
          const y1 = start;
          const y2 = i;
          const lefts  = leftGroup.filter(l => !((l.y + l.h) <= y1 || l.y >= y2));
          const rights = rightGroup.filter(l => !((l.y + l.h) <= y1 || l.y >= y2));
          vSplits.push({
            x, y1, y2,
            leftKeys:  lefts.map(l => l.key),
            rightKeys: rights.map(l => l.key),
          });
          start = -1;
        }
      }
    });

    // --- Corner (H·V 교차점) ---
    const corners = [];
    hSplits.forEach(h => {
      vSplits.forEach(v => {
        if (v.x > h.x1 && v.x < h.x2 && h.y > v.y1 && h.y < v.y2) {
          corners.push({ x: v.x, y: h.y, hSplit: h, vSplit: v });
        }
      });
    });

    return { hSplits, vSplits, corners };
  }, [config.layers, cols, totalRows]);

  // Split bar 드래그 시작
  const startSplitDrag = (e, hSplit, vSplit) => {
    if (readOnly) return;
    if (!hSplit && !vSplit) return;
    e.preventDefault();
    e.stopPropagation();
    setDragSplit({
      hSplit, vSplit,
      startX: e.clientX,
      startY: e.clientY,
      initialLayers: config.layers.map(l => ({ ...l })),
    });
  };

  // Split bar 드래그 진행 — global mouse listener
  useEffect(() => {
    if (!dragSplit) return undefined;
    const cellW = colWidth + RGL_MARGIN_X;
    const cellH = rowHeight + marginY;

    const handleMove = (e) => {
      const { startX, startY, initialLayers, hSplit, vSplit } = dragSplit;
      let deltaCols = Math.round((e.clientX - startX) / Math.max(1, cellW));
      let deltaRows = Math.round((e.clientY - startY) / Math.max(1, cellH));
      const next = initialLayers.map(l => ({ ...l }));
      const find = (k) => next.find(l => l.key === k);

      // 수평 split — topGroup.h += dRows / bottomGroup.y+=dRows, h-=dRows
      if (hSplit) {
        const topHs = hSplit.topKeys.map(k => find(k)?.h ?? 99);
        const botHs = hSplit.bottomKeys.map(k => find(k)?.h ?? 99);
        const minTop = Math.min(...topHs);
        const minBot = Math.min(...botHs);
        const maxUp   = minTop - 2;   // 올릴 수 있는 최대 (top 이 2 이상 유지)
        const maxDown = minBot - 2;   // 내릴 수 있는 최대
        deltaRows = Math.max(-maxUp, Math.min(maxDown, deltaRows));
        hSplit.topKeys.forEach(k => { const l = find(k); if (l) l.h += deltaRows; });
        hSplit.bottomKeys.forEach(k => {
          const l = find(k);
          if (l) { l.y += deltaRows; l.h -= deltaRows; }
        });
      }

      // 수직 split — leftGroup.w += dCols / rightGroup.x+=dCols, w-=dCols
      if (vSplit) {
        const leftWs  = vSplit.leftKeys.map(k  => find(k)?.w ?? 99);
        const rightWs = vSplit.rightKeys.map(k => find(k)?.w ?? 99);
        const minLeft  = Math.min(...leftWs);
        const minRight = Math.min(...rightWs);
        const maxLeft  = minLeft  - 1;
        const maxRight = minRight - 1;
        deltaCols = Math.max(-maxLeft, Math.min(maxRight, deltaCols));
        vSplit.leftKeys.forEach(k => { const l = find(k); if (l) l.w += deltaCols; });
        vSplit.rightKeys.forEach(k => {
          const l = find(k);
          if (l) { l.x += deltaCols; l.w -= deltaCols; }
        });
      }

      onChange?.({ ...config, layers: next });
    };

    const handleUp = () => setDragSplit(null);

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup',   handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup',   handleUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragSplit, colWidth, rowHeight, marginY]);

  // 드래그 중에만 전역 mousemove 리스너 부착
  useEffect(() => {
    if (!draggingKey) return undefined;
    const handleMove = (e) => {
      const el = gridBoxRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      if (mx < 0 || my < 0 || mx > rect.width || my > rect.height) {
        setDropHint(null);
        return;
      }
      const baseLayers = dragStartLayersRef.current || config.layers;
      let found = null;
      for (const l of baseLayers) {
        if (l.key === draggingKey) continue;
        const { px, py, pw, ph } = getLayerPixelBounds(l);
        if (mx < px || mx > px + pw || my < py || my > py + ph) continue;
        const rx = (mx - px) / Math.max(1, pw); // 0..1
        const ry = (my - py) / Math.max(1, ph); // 0..1
        const distT = ry;
        const distB = 1 - ry;
        const distL = rx;
        const distR = 1 - rx;
        const min = Math.min(distT, distB, distL, distR);
        let edge;
        if (min === distT)      edge = 'top';
        else if (min === distB) edge = 'bottom';
        else if (min === distL) edge = 'left';
        else                    edge = 'right';
        found = { targetKey: l.key, edge };
        break;
      }
      setDropHint(prev => {
        if (!found && !prev) return prev;
        if (found && prev && prev.targetKey === found.targetKey && prev.edge === found.edge) return prev;
        return found;
      });
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draggingKey, colWidth, rowHeight, marginY]);

  const filterItems = config.filterBar.items;
  const filterVisible = filterItems.length > 0;

  // normalize 후 emit 하는 helper — skipKey 는 "방금 조작한 layer" (확장에서 제외)
  const emitNormalized = (nextLayers, baseCfg = config, skipKey = null) => {
    const cols = baseCfg.cols || COLS_DEFAULT;
    const rows = getTotalRows(nextLayers);
    const normalized = normalizeLayers(nextLayers, cols, rows, skipKey);
    emit({ ...baseCfg, layers: normalized });
  };

  // ---- react-grid-layout 변경 ----
  //   드래그 중에는 emit 하지 않음 → 다른 layer 가 화면상 흔들리지 않아 drop-hint hit test 가 정확
  //   split-bar 조작 중에도 RGL 경유 emit 을 막아 우리가 직접 쓰는 값이 덮어써지지 않게 함
  //   최종 배치는 onDragStop 에서 확정
  const handleLayoutChange = (next) => {
    if (readOnly) return;
    if (draggingKey) return;
    if (dragSplit)   return;
    const map = {};
    next.forEach(n => { map[n.i] = n; });
    const updated = config.layers.map(l => {
      const n = map[l.key];
      return n ? { ...l, x: n.x, y: n.y, w: n.w, h: n.h } : l;
    });
    const changed = updated.some((l, i) => {
      const o = config.layers[i];
      return o.x !== l.x || o.y !== l.y || o.w !== l.w || o.h !== l.h;
    });
    if (!changed) return;
    emit({ ...config, layers: updated });
  };

  // 드래그 시작 — target 위치 snapshot + draggingKey 설정
  const handleDragStart = (_layout, oldItem) => {
    if (readOnly) return;
    dragStartLayersRef.current = config.layers.map(l => ({ ...l }));
    setDraggingKey(oldItem?.i || null);
    setDropHint(null);
  };

  // 드래그 종료 — dropHint 가 있으면 INSERT → SPLIT → SWAP 순으로 배치
  //
  //   1) INSERT: target 의 edge 쪽 "빈 공간" 이 있으면 dragged 가 그 공간을 채움 (target 크기 보존)
  //      · 사용자가 L6 을 L3 하단에 drop → L3 바로 아래가 비어있으면 L6 이 그 공간 차지
  //      · L6 의 원래 위치는 normalize 가 이웃 layer 로 채움
  //   2) SPLIT: 빈 공간이 없으면 target 을 반으로 나눠 한쪽을 dragged 로 교체
  //   3) SWAP: target 이 너무 작아 split 도 불가 → 위치 교환
  const handleDragStop = (layout, _oldItem, newItem) => {
    const hint       = dropHint;
    const baseLayers = dragStartLayersRef.current || config.layers;
    const draggedKey = draggingKey || newItem?.i || null;
    setDraggingKey(null);
    setDropHint(null);
    dragStartLayersRef.current = null;
    if (readOnly) return;

    if (hint && draggedKey && hint.targetKey !== draggedKey) {
      const target  = baseLayers.find(l => l.key === hint.targetKey);
      const dragged = baseLayers.find(l => l.key === draggedKey);
      if (target && dragged) {
        const totalC = config.cols || COLS_DEFAULT;
        const totalR = getTotalRows(baseLayers);
        const tx1 = target.x || 0, tx2 = (target.x || 0) + (target.w || 0);
        const ty1 = target.y || 0, ty2 = (target.y || 0) + (target.h || 0);

        // -------- 1) INSERT 시도 --------
        // dragged 를 제외한 layer 들 중에서 target 의 해당 edge 방향 가장 가까운 layer 를 찾아
        // 사이 빈 공간(>=2 rows 또는 >=1 col) 을 dragged 로 채움
        let insertTarget = null;
        let insertDragged = null;
        if (hint.edge === 'bottom') {
          let nearestY = totalR;
          for (const o of baseLayers) {
            if (o.key === target.key || o.key === dragged.key) continue;
            const xOv = !((o.x || 0) + (o.w || 0) <= tx1 || (o.x || 0) >= tx2);
            if (!xOv || (o.y || 0) < ty2) continue;
            if ((o.y || 0) < nearestY) nearestY = o.y;
          }
          const availH = nearestY - ty2;
          if (availH >= 2) {
            insertTarget  = target;
            insertDragged = { ...dragged, x: tx1, y: ty2, w: target.w, h: availH };
          }
        } else if (hint.edge === 'top') {
          let nearestY = 0;
          for (const o of baseLayers) {
            if (o.key === target.key || o.key === dragged.key) continue;
            const xOv = !((o.x || 0) + (o.w || 0) <= tx1 || (o.x || 0) >= tx2);
            if (!xOv || (o.y || 0) + (o.h || 0) > ty1) continue;
            const oBot = (o.y || 0) + (o.h || 0);
            if (oBot > nearestY) nearestY = oBot;
          }
          const availH = ty1 - nearestY;
          if (availH >= 2) {
            insertTarget  = target;
            insertDragged = { ...dragged, x: tx1, y: nearestY, w: target.w, h: availH };
          }
        } else if (hint.edge === 'right') {
          let nearestX = totalC;
          for (const o of baseLayers) {
            if (o.key === target.key || o.key === dragged.key) continue;
            const yOv = !((o.y || 0) + (o.h || 0) <= ty1 || (o.y || 0) >= ty2);
            if (!yOv || (o.x || 0) < tx2) continue;
            if ((o.x || 0) < nearestX) nearestX = o.x;
          }
          const availW = nearestX - tx2;
          if (availW >= 1) {
            insertTarget  = target;
            insertDragged = { ...dragged, x: tx2, y: ty1, w: availW, h: target.h };
          }
        } else if (hint.edge === 'left') {
          let nearestX = 0;
          for (const o of baseLayers) {
            if (o.key === target.key || o.key === dragged.key) continue;
            const yOv = !((o.y || 0) + (o.h || 0) <= ty1 || (o.y || 0) >= ty2);
            if (!yOv || (o.x || 0) + (o.w || 0) > tx1) continue;
            const oRight = (o.x || 0) + (o.w || 0);
            if (oRight > nearestX) nearestX = oRight;
          }
          const availW = tx1 - nearestX;
          if (availW >= 1) {
            insertTarget  = target;
            insertDragged = { ...dragged, x: nearestX, y: ty1, w: availW, h: target.h };
          }
        }

        if (insertTarget && insertDragged) {
          const nextLayers = baseLayers.map(l => {
            if (l.key === insertTarget.key)  return insertTarget;
            if (l.key === insertDragged.key) return insertDragged;
            return l;
          });
          emitNormalized(nextLayers, config, draggedKey);
          return;
        }

        // -------- 2) SPLIT 시도 --------
        const isHoriz = hint.edge === 'left' || hint.edge === 'right';
        const canSplit = isHoriz
          ? (target.w || 0) >= 2
          : (target.h || 0) >= 4;    // minH=2, 두 쪽 다 >= 2 확보

        if (canSplit) {
          let newTarget;
          let newDragged;
          if (hint.edge === 'top') {
            const h1 = Math.max(2, Math.floor((target.h || 4) / 2));
            const h2 = Math.max(2, (target.h || 4) - h1);
            newDragged = { ...dragged, x: target.x, y: target.y,       w: target.w, h: h1 };
            newTarget  = { ...target,                y: target.y + h1, h: h2 };
          } else if (hint.edge === 'bottom') {
            const h1 = Math.max(2, Math.floor((target.h || 4) / 2));
            const h2 = Math.max(2, (target.h || 4) - h1);
            newTarget  = { ...target,  h: h1 };
            newDragged = { ...dragged, x: target.x, y: target.y + h1, w: target.w, h: h2 };
          } else if (hint.edge === 'left') {
            const w1 = Math.max(1, Math.floor((target.w || 2) / 2));
            const w2 = Math.max(1, (target.w || 2) - w1);
            newDragged = { ...dragged, x: target.x,       y: target.y, w: w1, h: target.h };
            newTarget  = { ...target,  x: target.x + w1,                w: w2 };
          } else { // right
            const w1 = Math.max(1, Math.floor((target.w || 2) / 2));
            const w2 = Math.max(1, (target.w || 2) - w1);
            newTarget  = { ...target,  w: w1 };
            newDragged = { ...dragged, x: target.x + w1, y: target.y, w: w2, h: target.h };
          }
          const nextLayers = baseLayers.map(l => {
            if (l.key === target.key)  return newTarget;
            if (l.key === dragged.key) return newDragged;
            return l;
          });
          emitNormalized(nextLayers, config, draggedKey);
          return;
        }

        // -------- 3) SWAP 대체 --------
        const nextLayers = baseLayers.map(l => {
          if (l.key === target.key)   return { ...target,  x: dragged.x, y: dragged.y, w: dragged.w, h: dragged.h };
          if (l.key === dragged.key)  return { ...dragged, x: target.x,  y: target.y,  w: target.w,  h: target.h  };
          return l;
        });
        emitNormalized(nextLayers, config, draggedKey);
        return;
      }
    }

    // dropHint 없음 → RGL 이 계산한 최종 layout 사용
    const map = {};
    layout.forEach(n => { map[n.i] = n; });
    const updated = config.layers.map(l => {
      const n = map[l.key];
      return n ? { ...l, x: n.x, y: n.y, w: n.w, h: n.h } : l;
    });
    emitNormalized(updated, config, draggedKey);
  };

  // (Resize 종료 핸들러는 제거 — RGL 자체 resize 를 쓰지 않고 split bar 로 대체)

  // ---- FilterBar 항목 ----
  const handleAddFilterItem = () => {
    const items = [...filterItems];
    const key = nextFilterKey(items);
    items.push({ key, label: `필터 ${items.length + 1}` });
    emit({ ...config, filterBar: { ...config.filterBar, items } });
  };

  const handleRemoveFilterItem = (key) => {
    const items = filterItems.filter(it => it.key !== key);
    emit({ ...config, filterBar: { ...config.filterBar, items } });
  };

  const handleRenameFilterItem = (key, label) => {
    const items = filterItems.map(it => it.key === key ? { ...it, label } : it);
    emit({ ...config, filterBar: { ...config.filterBar, items } });
  };

  // ---- Layer 추가 ----
  //   · 최초 → Layer 1개가 cols × ROWS_DEFAULT 전체 차지
  //   · 이후 → 가장 큰 Layer 를 반으로 분할 (가로로 더 길면 좌우, 세로로 더 길면 상하)
  const handleAddLayer = () => {
    const key = nextLayerKey(config.layers);
    const cols = config.cols || COLS_DEFAULT;

    if (config.layers.length === 0) {
      const layer = {
        key, x: 0, y: 0, w: cols, h: ROWS_DEFAULT,
        title: `Layer ${key.replace('L', '')}`,
        componentType: DEFAULT_COMPONENT_CODE,
      };
      emit({ ...config, layers: [layer] });
      return;
    }

    const largest = config.layers.reduce(
      (a, b) => ((a.w || 0) * (a.h || 0) >= (b.w || 0) * (b.h || 0) ? a : b)
    );
    const splitH = (largest.w || 0) >= (largest.h || 0);
    let updatedTarget;
    let newLayer;
    if (splitH) {
      const w1 = Math.max(1, Math.floor((largest.w || 2) / 2));
      const w2 = Math.max(1, (largest.w || 2) - w1);
      updatedTarget = { ...largest, w: w1 };
      newLayer = {
        ...largest, key,
        x: (largest.x || 0) + w1, w: w2,
        title: `Layer ${key.replace('L', '')}`,
        componentType: DEFAULT_COMPONENT_CODE,
      };
    } else {
      const h1 = Math.max(2, Math.floor((largest.h || 4) / 2));
      const h2 = Math.max(2, (largest.h || 4) - h1);
      updatedTarget = { ...largest, h: h1 };
      newLayer = {
        ...largest, key,
        y: (largest.y || 0) + h1, h: h2,
        title: `Layer ${key.replace('L', '')}`,
        componentType: DEFAULT_COMPONENT_CODE,
      };
    }
    const layers = config.layers.map(l => l.key === largest.key ? updatedTarget : l);
    layers.push(newLayer);
    emitNormalized(layers);
  };

  const handleRemoveLayer = (key) => {
    if (config.layers.length <= 1) return;
    const next = config.layers.filter(l => l.key !== key);
    emitNormalized(next);
  };

  const handleRenameLayer = (key, title) => {
    emit({ ...config, layers: config.layers.map(l => l.key === key ? { ...l, title } : l) });
  };

  const handleChangeComponentType = (key, componentType) => {
    emit({
      ...config,
      layers: config.layers.map(l => {
        if (l.key !== key) return l;
        const next = { ...l, componentType };
        // CONTAINER_TAB 으로 바뀌면 기본 탭 페이지 1개 자동 생성
        if (componentType === 'CONTAINER_TAB') {
          return initTabsIfNeeded(next);
        }
        // Grid 계열로 전환 시 기본 Props 4종 보강 (기존 값 보존)
        if (isGridComponentCode(componentType)) {
          next.props = withGridDefaultProps(componentType, next.props);
        }
        return next;
      }),
    });
  };

  // 일반 layer patch (Props/Data/Events/tabs 등 수정 시 사용)
  const handleUpdateLayer = (key, patch) => {
    emit({
      ...config,
      layers: config.layers.map(l => l.key === key ? { ...l, ...patch } : l),
    });
  };

  // ---- 분할 (좌우 / 상하) ----
  const splitLayer = (key, direction /* 'H' | 'V' */) => {
    const target = config.layers.find(l => l.key === key);
    if (!target) return;
    const newKey = nextLayerKey(config.layers);
    let updatedTarget;
    let newLayer;

    if (direction === 'H') {
      const w1 = Math.max(1, Math.floor((target.w || 2) / 2));
      const w2 = Math.max(1, (target.w || 2) - w1);
      updatedTarget = { ...target, w: w1 };
      newLayer = { ...target, key: newKey, x: (target.x || 0) + w1, w: w2,
                   title: `${target.title || newKey}-2` };
    } else {
      const h1 = Math.max(2, Math.floor((target.h || 4) / 2));
      const h2 = Math.max(2, (target.h || 4) - h1);
      updatedTarget = { ...target, h: h1 };
      newLayer = { ...target, key: newKey, y: (target.y || 0) + h1, h: h2,
                   title: `${target.title || newKey}-2` };
    }

    const layers = config.layers.map(l => l.key === key ? updatedTarget : l);
    layers.push(newLayer);
    emitNormalized(layers);
  };

  // ---- 우클릭 컨텍스트 메뉴 ----
  const handleOpenContextMenu = (e, layerKey) => {
    if (readOnly) return;
    e.preventDefault();
    e.stopPropagation();
    setCtxMenu({ mouseX: e.clientX + 2, mouseY: e.clientY - 6, layerKey });
  };

  const handleCloseContextMenu = () => setCtxMenu(null);

  const handleCtxAction = (action) => {
    if (!ctxMenu) return;
    const { layerKey } = ctxMenu;
    if (action === 'split-h') splitLayer(layerKey, 'H');
    else if (action === 'split-v') splitLayer(layerKey, 'V');
    else if (action === 'delete')  handleRemoveLayer(layerKey);
    handleCloseContextMenu();
  };

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, gap: 1 }}>

      {/* ========= FilterBar 항목 관리 ========= */}
      <Paper variant="outlined" sx={{
        p: 1.2, borderRadius: 2, flexShrink: 0,
        bgcolor: filterVisible ? 'rgba(59,130,246,0.05)' : 'rgba(0,0,0,0.02)',
      }}>
        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
          <FilterListIcon fontSize="small" sx={{ color: filterVisible ? '#3b82f6' : '#94a3b8' }} />
          <Typography variant="caption" sx={{ fontWeight: 700,
                                                color: filterVisible ? '#1e40af' : '#64748b' }}>
            FilterBar 항목 ({filterItems.length}{filterVisible ? '' : ' · 자동 숨김'})
          </Typography>

          {filterItems.map(it => (
            <Chip
              key={it.key}
              label={
                <TextField
                  value={it.label || ''}
                  onChange={(e) => handleRenameFilterItem(it.key, e.target.value)}
                  variant="standard"
                  size="small"
                  disabled={readOnly}
                  InputProps={{ disableUnderline: true,
                                sx: { fontSize: 12, fontWeight: 700, color: '#1e40af', minWidth: 60 } }}
                />
              }
              onDelete={readOnly ? undefined : () => handleRemoveFilterItem(it.key)}
              deleteIcon={<CloseIcon sx={{ fontSize: 14 }} />}
              size="small"
              sx={{ bgcolor: '#dbeafe', color: '#1e40af',
                    border: '1px solid #93c5fd',
                    '& .MuiChip-label': { py: 0.2 } }}
            />
          ))}

          {!readOnly && (
            <Button size="small" variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={handleAddFilterItem}>
              필터 항목 추가
            </Button>
          )}
        </Stack>
      </Paper>

      {/* ========= Layer Toolbar ========= */}
      {!readOnly && (
        <Paper variant="outlined" sx={{ p: 1, borderRadius: 2, flexShrink: 0 }}>
          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
              ▶ Layer Header 드래그로 상/하/좌/우 Edge 에 Drop → 해당 half 로 분할 삽입.
              Layer 사이 <Box component="span" sx={{ color: '#3b82f6', fontWeight: 800 }}>파란 Split Bar</Box> 드래그로 좌우·상하,
              모서리 <Box component="span" sx={{ color: '#3b82f6', fontWeight: 800 }}>원형 핸들</Box> 로 좌우상하 동시 조정. 우클릭: 분할/삭제.
            </Typography>
            <Box sx={{ flex: 1 }} />
            <Button size="small" variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddLayer}
                    sx={{ bgcolor: '#2563eb', fontWeight: 700,
                          '&:hover': { bgcolor: '#1d4ed8' } }}>
              Layer 추가
            </Button>
          </Stack>
        </Paper>
      )}

      {/* ========= Editor Canvas — 스크롤 없이 전체 화면 채움 ========= */}
      <Paper variant="outlined" sx={{
        flex: 1, minHeight: 0, p: 1, borderRadius: 2,
        bgcolor: '#f1f5f9',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* FilterBar preview */}
        {filterVisible && (
          <Box sx={{
            mx: 1, mb: 1,
            p: 1, borderRadius: 1,
            bgcolor: 'rgba(59, 130, 246, 0.18)',
            border: '1px dashed #3b82f6',
            display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap',
            flexShrink: 0,
          }}>
            <FilterListIcon sx={{ fontSize: 16, color: '#3b82f6' }} />
            <Typography variant="caption" sx={{ color: '#475569', fontWeight: 700 }}>
              FilterBar
            </Typography>
            {filterItems.map(it => (
              <Box key={it.key} sx={{
                flex: '1 1 90px',
                minWidth: 90,
                height: 22, borderRadius: 0.7,
                bgcolor: '#ffffff', border: '1px solid #cbd5e1',
                display: 'flex', alignItems: 'center',
                px: 0.7,
                fontSize: 10, color: '#475569',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {it.label || it.key}
              </Box>
            ))}
          </Box>
        )}

        <Box ref={gridBoxRef} sx={{ flex: 1, minHeight: 0, width: '100%', overflow: 'hidden',
                                     position: 'relative' }}>
          {config.layers.length === 0 ? (
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex',
                       alignItems: 'center', justifyContent: 'center',
                       flexDirection: 'column', gap: 1, color: '#64748b' }}>
              <ViewModuleIcon sx={{ fontSize: 40, color: '#475569' }} />
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                배치된 Layer 가 없습니다. 우측 상단 [Layer 추가] 로 시작하세요.
              </Typography>
            </Box>
          ) : (
            <ReactGridLayout
              className="composer-layout-designer"
              cols={config.cols || COLS_DEFAULT}
              rowHeight={rowHeight}
              width={containerW}
              margin={[RGL_MARGIN_X, marginY]}
              containerPadding={RGL_PADDING}
              layout={layouts}
              onLayoutChange={handleLayoutChange}
              onDragStart={handleDragStart}
              onDragStop={handleDragStop}
              isDraggable={!readOnly}
              isResizable={false}
              draggableHandle=".cl-layer-header"
              compactType="vertical"
              preventCollision={false}
            >
              {config.layers.map(l => {
                const ctCode  = normalizeComponentCode(l.componentType);
                const ctInfo  = COMPONENT_INDEX[ctCode];
                const accent  = ctInfo?.groupColor || '#64748b';
                const ctLabel = ctInfo?.label || ctCode;
                const ctGroup = ctInfo?.groupCode || null;

                return (
                  <Box key={l.key} sx={{
                    bgcolor: '#ffffff',
                    border: `1px solid ${accent}66`,
                    borderRadius: 1,
                    display: 'flex', flexDirection: 'column',
                    overflow: 'hidden',
                  }}>
                    {/* Layer Header (drag handle + 우클릭 메뉴 영역) */}
                    <Box className="cl-layer-header"
                         onContextMenu={(e) => handleOpenContextMenu(e, l.key)}
                         sx={{
                           px: 1, py: 0.6,
                           bgcolor: '#f8fafc',
                           borderBottom: `1px solid ${accent}55`,
                           display: 'flex', alignItems: 'center', gap: 0.5,
                           cursor: readOnly ? 'default' : 'move',
                           userSelect: 'none',
                           flexShrink: 0,
                           '&:hover': { bgcolor: '#eef2f7' },
                         }}>
                      <DragIndicatorIcon sx={{ fontSize: 14, color: '#64748b' }} />
                      <Chip label={l.key} size="small"
                            sx={{ height: 18, fontSize: 10, fontFamily: 'monospace',
                                  bgcolor: accent, color: '#fff', fontWeight: 800 }} />
                      <TextField
                        value={l.title || ''}
                        onChange={(e) => handleRenameLayer(l.key, e.target.value)}
                        onMouseDown={(e) => e.stopPropagation()}
                        onContextMenu={(e) => e.stopPropagation()}
                        placeholder="Head 정보 입력 (예: 마스터, 헤더, 디테일)"
                        variant="standard"
                        size="small"
                        disabled={readOnly}
                        InputProps={{
                          disableUnderline: true,
                          sx: { fontSize: 12, fontWeight: 700, color: '#0f172a', px: 0.5 },
                        }}
                        sx={{ flex: 1 }}
                      />
                      <ComponentTypeSelect
                        value={ctCode}
                        onChange={(v) => handleChangeComponentType(l.key, v)}
                        disabled={readOnly}
                      />
                      {!readOnly && (
                        <Tooltip title="Props · Data · Events 편집">
                          <IconButton size="small"
                                      sx={{ color: '#64748b', p: 0.3,
                                            '&:hover': { color: '#3b82f6' } }}
                                      onMouseDown={(e) => e.stopPropagation()}
                                      onClick={() => setPropsDrawerTarget({ layerKey: l.key })}>
                            <SettingsIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                      {!readOnly && (
                        <Tooltip title={config.layers.length <= 1 ? '마지막 Layer 는 삭제할 수 없습니다' : '이 Layer 삭제'}>
                          <span>
                            <IconButton size="small"
                                        sx={{ color: config.layers.length <= 1 ? '#475569' : '#f87171', p: 0.3 }}
                                        disabled={config.layers.length <= 1}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onClick={() => handleRemoveLayer(l.key)}>
                              <CloseIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}
                    </Box>

                    {/* Layer Body — 카테고리별 미리보기 */}
                    <LayerBodyPreview
                      layer={l}
                      group={ctGroup} code={ctCode} label={ctLabel} accent={accent}
                      readOnly={readOnly}
                      onUpdateLayer={(patch) => handleUpdateLayer(l.key, patch)}
                      onOpenTabSettings={(tabId) => setPropsDrawerTarget({ layerKey: l.key, tabId })}
                    />
                  </Box>
                );
              })}
            </ReactGridLayout>
          )}

          {/* ===== Split Bars — Layer 사이의 경계를 잡아 상/하·좌/우·좌우상하 동시 조정 ===== */}
          {!readOnly && !draggingKey && config.layers.length > 1 && (
            <>
              {/* 수평 bar (상하 resize) */}
              {splits.hSplits.map((h, idx) => {
                const left   = gridXToPx(h.x1);
                const right  = gridXToPx(h.x2) - RGL_MARGIN_X;
                const centerY = gridYToPx(h.y) - marginY / 2;
                const THICK  = 10;
                const isActive = dragSplit?.hSplit === h;
                return (
                  <Box
                    key={`hs-${h.y}-${h.x1}-${idx}`}
                    onMouseDown={(e) => startSplitDrag(e, h, null)}
                    sx={{
                      position: 'absolute',
                      left, top: centerY - THICK / 2,
                      width: right - left, height: THICK,
                      cursor: 'ns-resize',
                      zIndex: 60,
                      display: 'flex', alignItems: 'center',
                      '&:hover > .sb-line': {
                        bgcolor: '#3b82f6', boxShadow: '0 0 0 1px #3b82f655',
                      },
                    }}
                  >
                    <Box className="sb-line" sx={{
                      flex: 1,
                      height: 3, borderRadius: 1.5,
                      bgcolor: isActive ? '#3b82f6' : 'rgba(59,130,246,0.35)',
                      transition: 'background-color 0.1s',
                    }} />
                  </Box>
                );
              })}
              {/* 수직 bar (좌우 resize) */}
              {splits.vSplits.map((v, idx) => {
                const top    = gridYToPx(v.y1);
                const bottom = gridYToPx(v.y2) - marginY;
                const centerX = gridXToPx(v.x) - RGL_MARGIN_X / 2;
                const THICK  = 10;
                const isActive = dragSplit?.vSplit === v;
                return (
                  <Box
                    key={`vs-${v.x}-${v.y1}-${idx}`}
                    onMouseDown={(e) => startSplitDrag(e, null, v)}
                    sx={{
                      position: 'absolute',
                      left: centerX - THICK / 2, top,
                      width: THICK, height: bottom - top,
                      cursor: 'ew-resize',
                      zIndex: 60,
                      display: 'flex', justifyContent: 'center',
                      '&:hover > .sb-line': {
                        bgcolor: '#3b82f6', boxShadow: '0 0 0 1px #3b82f655',
                      },
                    }}
                  >
                    <Box className="sb-line" sx={{
                      flex: 1,
                      width: 3, borderRadius: 1.5,
                      bgcolor: isActive ? '#3b82f6' : 'rgba(59,130,246,0.35)',
                      transition: 'background-color 0.1s',
                    }} />
                  </Box>
                );
              })}
              {/* Corner (좌우상하 동시 resize) */}
              {splits.corners.map((c, idx) => {
                const cx = gridXToPx(c.x) - RGL_MARGIN_X / 2;
                const cy = gridYToPx(c.y) - marginY / 2;
                const SIZE = 14;
                const isActive = dragSplit?.hSplit === c.hSplit && dragSplit?.vSplit === c.vSplit;
                return (
                  <Box
                    key={`cn-${c.x}-${c.y}-${idx}`}
                    onMouseDown={(e) => startSplitDrag(e, c.hSplit, c.vSplit)}
                    sx={{
                      position: 'absolute',
                      left: cx - SIZE / 2, top: cy - SIZE / 2,
                      width: SIZE, height: SIZE,
                      borderRadius: '50%',
                      cursor: 'nwse-resize',
                      zIndex: 62,
                      bgcolor: isActive ? '#3b82f6' : 'rgba(255,255,255,0.9)',
                      border: `2px solid ${isActive ? '#1d4ed8' : '#3b82f6'}`,
                      boxShadow: '0 2px 6px rgba(59,130,246,0.4)',
                      transition: 'all 0.12s',
                      '&:hover': {
                        bgcolor: '#3b82f6',
                        transform: 'scale(1.15)',
                      },
                    }}
                  />
                );
              })}
            </>
          )}

          {/* ===== Drop Hint Overlay — 드래그 중, target layer 의 상/하/좌/우 half 를 하이라이트 ===== */}
          {draggingKey && dropHint && (() => {
            const baseLayers = dragStartLayersRef.current || config.layers;
            const target = baseLayers.find(l => l.key === dropHint.targetKey);
            if (!target) return null;
            const { px, py, pw, ph } = getLayerPixelBounds(target);
            let half;
            let label;
            if (dropHint.edge === 'top') {
              half  = { left: px,            top: py,            width: pw,     height: ph / 2 };
              label = '▲ 상단에 삽입';
            } else if (dropHint.edge === 'bottom') {
              half  = { left: px,            top: py + ph / 2,   width: pw,     height: ph / 2 };
              label = '▼ 하단에 삽입';
            } else if (dropHint.edge === 'left') {
              half  = { left: px,            top: py,            width: pw / 2, height: ph };
              label = '◀ 좌측에 삽입';
            } else {
              half  = { left: px + pw / 2,   top: py,            width: pw / 2, height: ph };
              label = '▶ 우측에 삽입';
            }
            return (
              <>
                {/* target 전체에 옅은 border */}
                <Box sx={{
                  position: 'absolute',
                  left: px, top: py, width: pw, height: ph,
                  border: '1.5px dashed #3b82f6',
                  borderRadius: 0.8,
                  pointerEvents: 'none',
                  zIndex: 90,
                }} />
                {/* half 영역 강조 */}
                <Box sx={{
                  position: 'absolute',
                  left: half.left, top: half.top, width: half.width, height: half.height,
                  bgcolor: 'rgba(59, 130, 246, 0.35)',
                  border: '2px solid #3b82f6',
                  borderRadius: 0.8,
                  pointerEvents: 'none',
                  zIndex: 91,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'left 0.07s, top 0.07s, width 0.07s, height 0.07s',
                  boxShadow: '0 0 0 1px rgba(255,255,255,0.35) inset, 0 4px 16px rgba(59,130,246,0.35)',
                }}>
                  <Box sx={{
                    px: 1, py: 0.25,
                    bgcolor: 'rgba(37, 99, 235, 0.95)',
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: 0.3,
                    borderRadius: 0.5,
                    textShadow: '0 1px 2px rgba(0,0,0,0.55)',
                    whiteSpace: 'nowrap',
                  }}>
                    {label}
                  </Box>
                </Box>
              </>
            );
          })()}
        </Box>
      </Paper>

      {/* ========= 우클릭 컨텍스트 메뉴 ========= */}
      <Menu
        open={!!ctxMenu}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={ctxMenu ? { top: ctxMenu.mouseY, left: ctxMenu.mouseX } : undefined}
      >
        <MenuItem onClick={() => handleCtxAction('split-h')}>
          <ListItemIcon><VerticalSplitIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="좌우 분할" secondary="이 Layer 를 좌우 두 개로 분할" />
        </MenuItem>
        <MenuItem onClick={() => handleCtxAction('split-v')}>
          <ListItemIcon><HorizontalSplitIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="상하 분할" secondary="이 Layer 를 상하 두 개로 분할" />
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => handleCtxAction('delete')}
          disabled={config.layers.length <= 1}
          sx={{ color: config.layers.length <= 1 ? 'text.disabled' : '#dc2626' }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" sx={{ color: config.layers.length <= 1 ? 'inherit' : '#dc2626' }} />
          </ListItemIcon>
          <ListItemText primary="이 Layer 삭제"
                        secondary={config.layers.length <= 1 ? '마지막 Layer 는 삭제 불가' : '잔여 공간은 자동으로 채워짐'} />
        </MenuItem>
      </Menu>

      {/* ========= Props · Data · Events 편집 Drawer =========
           target: { layerKey } → layer 자체
           target: { layerKey, tabId } → 해당 탭 내부 컴포넌트 */}
      <Drawer
        anchor="right"
        open={!!propsDrawerTarget}
        onClose={() => setPropsDrawerTarget(null)}
        PaperProps={{ sx: { width: '40vw', minWidth: 440 } }}
      >
        {propsDrawerTarget && (() => {
          const { layerKey, tabId } = propsDrawerTarget;
          const layer = config.layers.find(l => l.key === layerKey);
          if (!layer) return null;

          // 1) layer 자체 편집
          if (!tabId) {
            return (
              <LayerPropertiesEditor
                layer={layer}
                allLayers={config.layers}
                onChange={(patch) => handleUpdateLayer(layerKey, patch)}
                onClose={() => setPropsDrawerTarget(null)}
              />
            );
          }

          // 2) TAB 내부 컴포넌트 편집 — pseudo-layer 로 래핑, patch 는 tabs 배열에 반영
          const tab = (layer.tabs || []).find(t => t.id === tabId);
          if (!tab) return null;
          const pseudoLayer = {
            key: `${layer.key} · ${tab.label}`,
            title: tab.label,
            componentType: tab.componentType,
            props:       tab.props       || {},
            dataBinding: tab.dataBinding || { source: 'manual' },
            events:      tab.events      || [],
          };
          const handleTabPatch = (patch) => {
            const tabs = (layer.tabs || []).map(t => t.id === tabId ? { ...t, ...patch } : t);
            handleUpdateLayer(layerKey, { tabs });
          };
          return (
            <LayerPropertiesEditor
              layer={pseudoLayer}
              allLayers={config.layers}
              onChange={handleTabPatch}
              onClose={() => setPropsDrawerTarget(null)}
            />
          );
        })()}
      </Drawer>
    </Box>
  );
}

export default LayoutDesigner;
