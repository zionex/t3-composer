# Composer Canvas Phase 2E-4 — Data Step Accordion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ② 데이터·검색조건 단계 좌측을 컴팩트 list + inline accordion 으로 재설계. DataMiniDialog 본문을 DataInlineEditor 로 추출하고 양쪽 (accordion + popup) 에서 재사용.

**Architecture:** 신규 `DataInlineEditor` (controlled props). DataAndFilterStep 좌측은 layer-row + (펼친 상태) DataInlineEditor 직접 mount. DataMiniDialog 는 thin wrapper 로 단순화.

**Tech Stack:** React 18 + MUI 5.

**Spec:** `docs/superpowers/specs/2026-05-25-composer-canvas-phase2e4-data-accordion-design.md`
**전제:** Phase 2D-2a 완료 (commit `23cd72f`).
**Dev 환경**: composer-frontend port 5173.

---

## File Structure

| 파일 | 변경 | 책임 |
|---|---|---|
| `frontend/src/view/util/t3composer/DataInlineEditor.jsx` | **신규** | 데이터 편집 본문 (자연어 + 참조 + SQL). controlled props (`dataSource`/`onChange`). |
| `frontend/src/view/util/t3composer/DataMiniDialog.jsx` | **수정** | DialogContent 안 inline 코드를 `<DataInlineEditor>` 호출로 단순화. local buffer 유지 (popup [적용] 호환). |
| `frontend/src/view/util/t3composer/DataAndFilterStep.jsx` | **수정** | 좌측 카드 → 컴팩트 row + 단일 펼침 accordion. DataMiniDialog import/render 제거. |

---

## Task 1: DataInlineEditor — 데이터 편집 본문 추출

**Files:**
- Create: `frontend/src/view/util/t3composer/DataInlineEditor.jsx`

- [ ] **Step 1: 신규 파일 작성**

`frontend/src/view/util/t3composer/DataInlineEditor.jsx`:

```jsx
/**
 * DataInlineEditor — layer.dataSource 의 controlled 편집기.
 *   DataMiniDialog (popup) 와 DataAndFilterStep accordion 두 곳에서 재사용.
 *
 *   props:
 *     dataSource     { mode, naturalText, references, sqlBlocks }
 *     onChange(next) dataSource 부분/전체 갱신 — 즉시 호출 (controlled)
 *     targetCd       Table/SP autocomplete 옵션 fetch
 *     onOpenDataSourcePicker?  optional — 풀스크린 별자리 탐색
 *
 *   Plan: docs/superpowers/plans/2026-05-25-composer-canvas-phase2e4.md (Task 1)
 *   Spec: docs/superpowers/specs/2026-05-25-composer-canvas-phase2e4-data-accordion-design.md
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  TextField, Button, Box, Chip, Typography, IconButton, Stack, Autocomplete, CircularProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';

import { listSchemaTables, listSchemaProcedures } from './api';

const REF_KINDS = [
  { kind: 'TABLE',  label: 'Table',      color: '#3b82f6' },
  { kind: 'SP',     label: 'SP',         color: '#8b5cf6' },
  { kind: 'ENTITY', label: 'JPA Entity', color: '#10b981' },
];

function inferMode(references, sqlBlocks) {
  if (references.length > 0 && sqlBlocks.length > 0) return 'MIXED';
  if (sqlBlocks.length > 0) return 'SQL';
  if (references.length === 1) return references[0].kind;
  if (references.length > 1) return 'MIXED';
  return 'NL';
}

function DataInlineEditor({ dataSource, onChange, targetCd, onOpenDataSourcePicker }) {
  const ds = dataSource || { mode: 'NL', naturalText: '', references: [], sqlBlocks: [] };
  const naturalText = ds.naturalText || '';
  const references  = ds.references  || [];
  const sqlBlocks   = ds.sqlBlocks   || [];

  // 추가 UI 상태 — local (어느 종류를 추가하는 중인지)
  const [addKind, setAddKind] = useState(null);  // 'TABLE'|'SP'|'ENTITY'|'SQL'|null
  const [addName, setAddName] = useState('');
  const [addSql, setAddSql]   = useState('');

  // Table/SP 옵션 fetch
  const [tableOptions, setTableOptions] = useState([]);
  const [spOptions, setSpOptions]       = useState([]);
  const [tablesConnected, setTablesConn] = useState(false);
  const [spsConnected, setSpsConn]       = useState(false);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [spsLoading, setSpsLoading]       = useState(false);

  useEffect(() => {
    let alive = true;
    setTablesLoading(true);
    listSchemaTables(targetCd)
      .then((res) => {
        if (!alive) return;
        const data = res?.data || {};
        setTablesConn(!!data.connected);
        setTableOptions(Array.isArray(data.tables) ? data.tables : []);
      })
      .catch(() => { if (alive) { setTablesConn(false); setTableOptions([]); } })
      .finally(() => { if (alive) setTablesLoading(false); });
    return () => { alive = false; };
  }, [targetCd]);

  useEffect(() => {
    let alive = true;
    setSpsLoading(true);
    listSchemaProcedures(targetCd)
      .then((res) => {
        if (!alive) return;
        const data = res?.data || {};
        setSpsConn(!!data.connected);
        setSpOptions(Array.isArray(data.procedures) ? data.procedures : []);
      })
      .catch(() => { if (alive) { setSpsConn(false); setSpOptions([]); } })
      .finally(() => { if (alive) setSpsLoading(false); });
    return () => { alive = false; };
  }, [targetCd]);

  const tableOptionStrings = useMemo(
    () => tableOptions.map((t) => t.tableName || t.name).filter(Boolean),
    [tableOptions]
  );
  const spOptionStrings = useMemo(
    () => spOptions.map((s) => s.procedureName || s.name).filter(Boolean),
    [spOptions]
  );

  const patch = (next) => {
    const nextDs = { ...ds, ...next };
    // mode 자동 추론
    nextDs.mode = inferMode(nextDs.references || [], nextDs.sqlBlocks || []);
    onChange(nextDs);
  };

  const handleNaturalText = (v) => patch({ naturalText: v });

  const handleAddRef = () => {
    if (!addKind || !addName.trim()) return;
    patch({ references: [...references, { kind: addKind, name: addName.trim() }] });
    setAddKind(null);
    setAddName('');
  };
  const handleRemoveRef = (idx) => {
    patch({ references: references.filter((_, i) => i !== idx) });
  };

  const handleAddSql = () => {
    if (!addSql.trim()) return;
    patch({ sqlBlocks: [...sqlBlocks, addSql.trim()] });
    setAddKind(null);
    setAddSql('');
  };
  const handleRemoveSql = (idx) => {
    patch({ sqlBlocks: sqlBlocks.filter((_, i) => i !== idx) });
  };
  const handleUpdateSql = (idx, next) => {
    patch({ sqlBlocks: sqlBlocks.map((s, i) => (i === idx ? next : s)) });
  };

  let addOptions = [];
  if (addKind === 'TABLE') addOptions = tableOptionStrings;
  else if (addKind === 'SP') addOptions = spOptionStrings;
  const isFetchingForAdd = (addKind === 'TABLE' && tablesLoading)
                        || (addKind === 'SP'    && spsLoading);

  return (
    <Box>
      {/* 자연어 */}
      <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
        💬 화면 설명 (자연어)
      </Typography>
      <TextField
        value={naturalText}
        onChange={(e) => handleNaturalText(e.target.value)}
        fullWidth multiline minRows={2} maxRows={6}
        placeholder='예: "사용자 마스터. ID·USERNAME·DISPLAY_NAME·ENABLED 컬럼."'
        sx={{ mt: 0.5, mb: 1.5,
              '& .MuiOutlinedInput-root': { fontSize: 12, bgcolor: '#fff' } }}
      />

      {/* 참조 chips */}
      <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
        🔗 데이터 객체 참조 (선택)
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6, mt: 0.7, mb: 1 }}>
        {references.map((ref, idx) => {
          const meta = REF_KINDS.find((k) => k.kind === ref.kind);
          return (
            <Chip
              key={`${ref.kind}-${ref.name}-${idx}`}
              label={`${meta?.label || ref.kind}: ${ref.name}`}
              onDelete={() => handleRemoveRef(idx)}
              size="small"
              sx={{ bgcolor: `${meta?.color || '#64748b'}22`,
                    color: meta?.color || '#64748b', fontWeight: 700, fontSize: 11 }}
            />
          );
        })}
      </Box>

      {/* + 참조 추가 버튼들 */}
      {addKind === null && (
        <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
          {REF_KINDS.map((k) => (
            <Button key={k.kind} size="small" variant="outlined"
                    onClick={() => { setAddKind(k.kind); setAddName(''); }}
                    sx={{ fontSize: 11, py: 0.3, borderColor: k.color, color: k.color }}>
              + {k.label}
            </Button>
          ))}
          <Button size="small" variant="outlined"
                  onClick={() => { setAddKind('SQL'); setAddSql(''); }}
                  sx={{ fontSize: 11, py: 0.3, borderColor: '#0ea5e9', color: '#0369a1' }}>
            + SQL
          </Button>
          {onOpenDataSourcePicker && (
            <Button size="small" variant="outlined" startIcon={<SearchIcon fontSize="small" />}
                    onClick={onOpenDataSourcePicker}
                    sx={{ fontSize: 11, py: 0.3, borderColor: '#facc15', color: '#713f12' }}>
              Data Source 탐색
            </Button>
          )}
        </Stack>
      )}

      {/* Table/SP autocomplete */}
      {(addKind === 'TABLE' || addKind === 'SP') && (
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="caption" sx={{ fontWeight: 700,
                                               color: REF_KINDS.find((k) => k.kind === addKind)?.color, minWidth: 60 }}>
            + {REF_KINDS.find((k) => k.kind === addKind)?.label}:
          </Typography>
          <Autocomplete
            freeSolo
            options={addOptions}
            loading={isFetchingForAdd}
            value={addName}
            onInputChange={(_e, v) => setAddName(v || '')}
            onChange={(_e, v) => setAddName(v || '')}
            sx={{ flex: 1 }}
            renderInput={(params) => (
              <TextField {...params} size="small" autoFocus
                placeholder={addKind === 'TABLE' ? 'TB_AD_USER' : 'SP_UI_AD_01_Q1'}
                helperText={
                  isFetchingForAdd ? '목록 조회 중...' :
                  (addKind === 'TABLE'
                    ? (tablesConnected
                        ? `${tableOptionStrings.length}개 Table 조회됨`
                        : 'DB 미연결 — 자유 텍스트 입력 가능')
                    : (spsConnected
                        ? `${spOptionStrings.length}개 SP 조회됨`
                        : 'DB 미연결 — 자유 텍스트 입력 가능'))
                }
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (<>
                    {isFetchingForAdd ? <CircularProgress size={14} /> : null}
                    {params.InputProps.endAdornment}
                  </>),
                  sx: { fontSize: 12, fontFamily: 'monospace' },
                }}
                FormHelperTextProps={{ sx: { fontSize: 10, ml: 0 } }}
              />
            )}
          />
          <Button size="small" variant="contained" onClick={handleAddRef}
                  disabled={!addName.trim()}>추가</Button>
          <Button size="small" onClick={() => { setAddKind(null); setAddName(''); }}>취소</Button>
        </Stack>
      )}

      {/* Entity 자유 텍스트 */}
      {addKind === 'ENTITY' && (
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#10b981', minWidth: 60 }}>
            + JPA Entity:
          </Typography>
          <TextField
            value={addName} onChange={(e) => setAddName(e.target.value)}
            size="small" autoFocus
            placeholder='User · UserInfo · DashboardKpi 등'
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddRef(); }}
            sx={{ flex: 1, '& .MuiOutlinedInput-input': { fontSize: 12, fontFamily: 'monospace' } }}
          />
          <Button size="small" variant="contained" onClick={handleAddRef}
                  disabled={!addName.trim()}>추가</Button>
          <Button size="small" onClick={() => { setAddKind(null); setAddName(''); }}>취소</Button>
        </Stack>
      )}

      {/* SQL 추가 */}
      {addKind === 'SQL' && (
        <Box>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#0369a1' }}>
            + Inline SQL — 직접 입력
          </Typography>
          <TextField
            value={addSql} onChange={(e) => setAddSql(e.target.value)}
            fullWidth multiline minRows={3} maxRows={10}
            placeholder='SELECT ID, USERNAME, DISPLAY_NAME FROM TB_AD_USER WHERE ENABLED = 1'
            sx={{ mt: 0.5,
                  '& .MuiOutlinedInput-root': { fontSize: 11, fontFamily: 'monospace', bgcolor: '#0f172a',
                                                 color: '#e2e8f0' } }}
          />
          <Stack direction="row" spacing={1} sx={{ mt: 0.7 }}>
            <Button size="small" variant="contained" onClick={handleAddSql}
                    disabled={!addSql.trim()}>SQL 추가</Button>
            <Button size="small" onClick={() => { setAddKind(null); setAddSql(''); }}>취소</Button>
          </Stack>
        </Box>
      )}

      {/* 등록된 SQL 목록 */}
      {sqlBlocks.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#0369a1' }}>
            📄 등록된 Inline SQL ({sqlBlocks.length})
          </Typography>
          <Stack spacing={1} sx={{ mt: 0.5 }}>
            {sqlBlocks.map((sql, idx) => (
              <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                <TextField
                  value={sql} onChange={(e) => handleUpdateSql(idx, e.target.value)}
                  fullWidth multiline minRows={2} maxRows={6}
                  label={`SQL #${idx + 1}`}
                  sx={{ '& .MuiOutlinedInput-root': { fontSize: 11, fontFamily: 'monospace',
                                                       bgcolor: '#0f172a', color: '#e2e8f0' },
                        '& .MuiInputLabel-root': { color: '#0369a1', fontWeight: 700 } }}
                  InputLabelProps={{ shrink: true }}
                />
                <IconButton size="small" onClick={() => handleRemoveSql(idx)}>
                  <DeleteIcon fontSize="small" sx={{ color: '#ef4444' }} />
                </IconButton>
              </Box>
            ))}
            <Button size="small" startIcon={<AddIcon />} variant="outlined"
                    onClick={() => { setAddKind('SQL'); setAddSql(''); }}
                    sx={{ alignSelf: 'flex-start', fontSize: 11, py: 0.3,
                          borderColor: '#0ea5e9', color: '#0369a1' }}>
              SQL 추가
            </Button>
          </Stack>
        </Box>
      )}
    </Box>
  );
}

export default DataInlineEditor;
```

- [ ] **Step 2: 컴파일 확인**

Run: `docker compose logs --tail=30 composer-frontend 2>&1 | grep -iE "ERROR in|SyntaxError" | head -5`
Expected: 0건.

---

## Task 2: DataMiniDialog — DialogContent 본문을 DataInlineEditor 로 위임

**Files:**
- Modify: `frontend/src/view/util/t3composer/DataMiniDialog.jsx`

- [ ] **Step 1: import 정리 + 본문 교체**

기존 import 의 다수 (Autocomplete/CircularProgress/AddIcon/SearchIcon/DeleteIcon 등) 가 DataInlineEditor 로 이전. DataMiniDialog 는 Dialog wrapper + DataInlineEditor 만 필요.

기존 파일 전체를 다음으로 교체:

```jsx
/**
 * DataMiniDialog — layer 의 dataSource 편집 popup (ComposerCanvas 의 layer 클릭 시 사용).
 *
 *   Phase 2E-4 이후: 본문은 DataInlineEditor (controlled) 로 위임. 본 Dialog 는 local
 *   buffer 유지 — [적용] 버튼 클릭 시 onApply 호출. DataAndFilterStep accordion 은
 *   DataInlineEditor 를 직접 사용 (popup 미경유).
 *
 *   props:
 *     open      : boolean
 *     onClose   : () => void
 *     layer     : ComposerSpec.layers[i]
 *     onApply   : (nextLayer) => void
 *     targetCd? : string
 *     onOpenDataSourcePicker?: () => void
 */
import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import DataInlineEditor from './DataInlineEditor';

function DataMiniDialog({ open, onClose, layer, onApply, targetCd, onOpenDataSourcePicker }) {
  // Popup 의 local buffer — [적용] 클릭 시에만 spec 갱신.
  const [bufferDs, setBufferDs] = useState(null);

  useEffect(() => {
    if (!open) return;
    setBufferDs(layer?.dataSource || { mode: 'NL', naturalText: '', references: [], sqlBlocks: [] });
  }, [open, layer]);

  const handleApply = () => {
    onApply({ ...layer, dataSource: bufferDs });
    onClose();
  };

  if (!layer) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h6" sx={{ color: '#1e40af', fontWeight: 800 }}>
            📊 {layer.title || layer.key} · 데이터
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b' }}>
            type: {layer.type} {layer.subtype ? `· ${layer.subtype}` : ''}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <DataInlineEditor
          dataSource={bufferDs}
          onChange={setBufferDs}
          targetCd={targetCd}
          onOpenDataSourcePicker={onOpenDataSourcePicker}
        />
      </DialogContent>

      <DialogActions sx={{ px: 2, py: 1 }}>
        <Button onClick={onClose}>취소</Button>
        <Button onClick={handleApply} variant="contained">적용</Button>
      </DialogActions>
    </Dialog>
  );
}

export default DataMiniDialog;
```

- [ ] **Step 2: 컴파일 확인**

Run: `docker compose logs --tail=30 composer-frontend 2>&1 | grep -iE "ERROR in|SyntaxError" | head -5`
Expected: 0건.

---

## Task 3: DataAndFilterStep — 좌측 컴팩트 list + accordion

**Files:**
- Modify: `frontend/src/view/util/t3composer/DataAndFilterStep.jsx`

- [ ] **Step 1: import 갱신**

기존:
```jsx
import React, { useState } from 'react';
import { Box, Typography, Stack, Chip } from '@mui/material';

import DataMiniDialog from './DataMiniDialog';
import FilterBarInlinePanel from './FilterBarInlinePanel';
import LayerRelationsPanel from './LayerRelationsPanel';
```

→ 다음으로 교체 (DataMiniDialog 제거 · DataInlineEditor + ExpandMoreIcon 추가):
```jsx
import React, { useState } from 'react';
import { Box, Typography, Stack, Chip } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import DataInlineEditor from './DataInlineEditor';
import FilterBarInlinePanel from './FilterBarInlinePanel';
import LayerRelationsPanel from './LayerRelationsPanel';
```

- [ ] **Step 2: state 변수 변경**

기존:
```jsx
function DataAndFilterStep({ spec, onChange, targetCd }) {
  const [editingLayerKey, setEditingLayerKey] = useState(null);

  const layers = spec?.layers || [];
  const editingLayer = layers.find((l) => l.key === editingLayerKey) || null;

  const handleApplyLayer = (nextLayer) => {
    if (!nextLayer) return;
    onChange({
      ...spec,
      layers: layers.map((l) => (l.key === nextLayer.key ? nextLayer : l)),
    });
  };
```

→ 다음으로 교체:
```jsx
function DataAndFilterStep({ spec, onChange, targetCd }) {
  const [expandedLayerKey, setExpandedLayerKey] = useState(null);

  const layers = spec?.layers || [];

  const handleUpdateDataSource = (layerKey, nextDs) => {
    onChange({
      ...spec,
      layers: layers.map((l) => (l.key === layerKey ? { ...l, dataSource: nextDs } : l)),
    });
  };
```

- [ ] **Step 3: 좌측 layer 영역 통째 교체 + DataMiniDialog 호출 제거**

기존 좌측 + Dialog 블록:
```jsx
      {/* ── 좌측 70% : Body Layers ── */}
      <Box sx={{ flex: '1 1 auto', minWidth: 0, display: 'flex', flexDirection: 'column',
                  gap: 1, overflow: 'auto' }}>
        <Typography variant="caption" sx={{ fontWeight: 800, color: '#1e40af',
                                              flexShrink: 0 }}>
          📐 Body Layers — 클릭하여 데이터 편집
        </Typography>
        {layers.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center', color: '#94a3b8' }}>
            Layer 가 없습니다. ① Layout 단계에서 추가하세요.
          </Box>
        )}
        {layers.map((l) => {
          const hasData = !!(l.dataSource?.naturalText) || (l.dataSource?.references || []).length > 0;
          return (
            <Box
              key={l.key}
              onClick={() => setEditingLayerKey(l.key)}
              sx={{
                cursor: 'pointer', p: 1.5,
                bgcolor: '#fff', border: '1px solid #cbd5e1', borderRadius: 1.5,
                borderLeft: '4px solid #7CA7E0',
                transition: 'box-shadow 0.15s ease',
                '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 800, color: '#1e293b' }}>
                    {l.title || l.key}
                  </Typography>
                  <Typography sx={{ fontSize: 11, color: '#64748b' }}>
                    {l.type}{l.subtype ? ` · ${l.subtype}` : ''}
                    {l.parentKey ? ` · (자식: ⊂ ${l.parentKey})` : ''}
                  </Typography>
                </Box>
                <Chip
                  size="small"
                  label={hasData ? '✓ 설정됨' : '미설정'}
                  sx={{
                    bgcolor: hasData ? '#dcfce7' : '#fef3c7',
                    color:   hasData ? '#166534' : '#92400e',
                    fontWeight: 700,
                  }}
                />
              </Stack>
            </Box>
          );
        })}
      </Box>
```

→ 다음으로 교체:
```jsx
      {/* ── 좌측 : Body Layers (컴팩트 list + accordion) ── */}
      <Box sx={{ flex: '1 1 auto', minWidth: 0, display: 'flex', flexDirection: 'column',
                  gap: 0.5, overflow: 'auto' }}>
        <Typography variant="caption" sx={{ fontWeight: 800, color: '#1e40af',
                                              flexShrink: 0, mb: 0.5 }}>
          📐 Body Layers — 클릭하여 펼치고 데이터 편집
        </Typography>
        {layers.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center', color: '#94a3b8' }}>
            Layer 가 없습니다. ① Layout 단계에서 추가하세요.
          </Box>
        )}
        {layers.map((l) => {
          const hasData = !!(l.dataSource?.naturalText) || (l.dataSource?.references || []).length > 0
                      || (l.dataSource?.sqlBlocks || []).length > 0;
          const expanded = l.key === expandedLayerKey;
          return (
            <Box key={l.key}>
              {/* 컴팩트 layer-row (height 36px) */}
              <Box
                onClick={() => setExpandedLayerKey(expanded ? null : l.key)}
                sx={{
                  height: 36, display: 'flex', alignItems: 'center', px: 1, gap: 1,
                  bgcolor: expanded ? '#eff6ff' : '#fff',
                  border: '1px solid #cbd5e1',
                  borderLeft: '4px solid #7CA7E0',
                  borderRadius: expanded ? '4px 4px 0 0' : 1,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: expanded ? '#dbeafe' : '#f8fafc' },
                }}
              >
                <ExpandMoreIcon sx={{ fontSize: 16, color: '#64748b',
                                       transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                                       transition: 'transform 0.15s ease' }} />
                <Typography sx={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#1e293b',
                                   overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {l.title || l.key}
                  {l.parentKey && (
                    <Typography component="span" sx={{ fontSize: 10, color: '#94a3b8', ml: 0.5 }}>
                      ⊂ {l.parentKey}
                    </Typography>
                  )}
                </Typography>
                <Chip
                  size="small"
                  label={hasData ? '✓' : '미설정'}
                  sx={{
                    height: 18, fontSize: 10,
                    bgcolor: hasData ? '#dcfce7' : '#fef3c7',
                    color:   hasData ? '#166534' : '#92400e',
                    fontWeight: 700,
                  }}
                />
                <Typography sx={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>
                  {l.type}
                </Typography>
              </Box>

              {/* 펼친 상태: 인라인 편집기 */}
              {expanded && (
                <Box sx={{
                  p: 1.5,
                  border: '1px solid #cbd5e1', borderTop: 'none',
                  borderRadius: '0 0 4px 4px',
                  bgcolor: '#f8fafc',
                }}>
                  <DataInlineEditor
                    dataSource={l.dataSource}
                    onChange={(nextDs) => handleUpdateDataSource(l.key, nextDs)}
                    targetCd={targetCd}
                  />
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
```

- [ ] **Step 4: Dialogs 블록에서 DataMiniDialog 제거**

기존:
```jsx
      {/* ── Dialogs ── */}
      <DataMiniDialog
        open={!!editingLayer}
        layer={editingLayer}
        targetCd={targetCd}
        onClose={() => setEditingLayerKey(null)}
        onApply={handleApplyLayer}
      />
    </Box>
  );
}
```

→ 다음으로 단순화:
```jsx
    </Box>
  );
}
```

(편집은 accordion 으로 — popup 미사용)

- [ ] **Step 5: 컴파일 확인 + 시각 검증**

Run: `docker compose logs --tail=30 composer-frontend 2>&1 | grep -iE "ERROR in|SyntaxError" | head -5`
Expected: 0건.

`http://localhost:5173`:
1. 패턴 → Wizard → ② 단계 ✓
2. 좌측 layer 들이 컴팩트 한 줄 (36px) 로 노출 ✓
3. layer row 클릭 → 그 자리에서 펼침 + 자연어/참조/SQL 편집기 노출 ✓
4. 다른 layer 클릭 → 이전 닫히고 새 row 펼침 (단일 펼침) ✓
5. 자연어 텍스트 입력 / 참조 추가 / SQL 추가 모두 즉시 spec 반영 ✓
6. 우측 FilterBar / Relations 그대로 동작 ✓
7. ComposerCanvas (① Layout 단계) 에서 layer 클릭 → DataMiniDialog popup 정상 동작 (회귀 없음) ✓

---

## Task 4: 통합 commit + milestone

- [ ] **Step 1: healthcheck**

Run: `docker compose logs --tail=80 composer-frontend 2>&1 | grep -iE "ERROR in|Module not found|SyntaxError|Failed to compile" | head -10`
Expected: 0건.

- [ ] **Step 2: 통합 커밋 (Task 1·2·3)**

```bash
git add frontend/src/view/util/t3composer/DataInlineEditor.jsx \
        frontend/src/view/util/t3composer/DataMiniDialog.jsx \
        frontend/src/view/util/t3composer/DataAndFilterStep.jsx \
        docs/superpowers/specs/2026-05-25-composer-canvas-phase2e4-data-accordion-design.md \
        docs/superpowers/plans/2026-05-25-composer-canvas-phase2e4.md
git commit -m "$(cat <<'EOF'
feat(composer): Phase 2E-4 — Data Step 컴팩트 list + inline accordion

DataAndFilterStep 좌측을 컴팩트 list (height 36px 한 줄) + 클릭 시
accordion 으로 펼침 (inline 편집) 으로 재설계. popup 호출 제거.

[신규]
- DataInlineEditor — layer.dataSource 의 controlled 편집기.
  자연어 TextField + 참조 chips + + Table/SP/Entity/SQL 추가 UI +
  등록된 SQL 목록. 모든 변경 즉시 onChange 호출 (controlled).
  DataMiniDialog popup 과 DataAndFilterStep accordion 두 곳에서 재사용.
  mode 자동 추론 (SQL/MIXED/<kind>/NL).

[수정]
- DataMiniDialog — DialogContent 안 inline 코드 (~180 줄) 를
  '<DataInlineEditor ...>' 로 단순화. local buffer state + [적용] 버튼 유지
  (popup 호환). ComposerCanvas 의 layer 클릭 popup 그대로 동작.
- DataAndFilterStep:
  - 좌측 카드 → 컴팩트 row (height 36px): ExpandMoreIcon + title +
    ✓/미설정 chip + type chip.
  - 클릭 시 expandedLayerKey 토글 — 단일 펼침 (한 번에 하나).
  - 펼친 row 아래 DataInlineEditor 인라인 mount.
  - DataMiniDialog import/state/render 제거 (accordion 대체).

[효과]
- popup 호출 0 — 좌우 모두 inline UX 일관성.
- 좌측 정보 밀도 향상 — 70-80px 카드 → 36px row.
- 데이터 의도/참조/SQL 본문이 한 눈에 보임 — 펼침으로 즉시 접근.
- popup 4-step 행동 (열기 → 편집 → 적용 → 닫기) 제거.

Spec: docs/superpowers/specs/2026-05-25-composer-canvas-phase2e4-data-accordion-design.md
Plan: docs/superpowers/plans/2026-05-25-composer-canvas-phase2e4.md
EOF
)"
```

- [ ] **Step 3: milestone**

```bash
git commit --allow-empty -m "$(cat <<'EOF'
milestone(composer): Phase 2E-4 complete — Data Step accordion UX

좌측 컴팩트 list + inline accordion. popup 0 — 좌우 일관된 inline UX.
DataInlineEditor 추출로 popup/accordion 양쪽 재사용.

[다음 후보]
- 2D-2b: LLM 산출 변환 (관계 → JSX onCellClick + zAxios refetch)
- 2D-2c: end-to-end 검증
- Phase 3b~3e: 다른 모드 (NEW_FROM_COPY 등) 마이그레이션
EOF
)"
```

---

## Self-Review

**1. Spec coverage:** DataInlineEditor (Task 1) · DataMiniDialog thin wrap (Task 2) · 좌측 컴팩트 list + accordion (Task 3 Step 3) · popup 제거 (Task 3 Step 4) · ComposerCanvas 호환성 (Task 2) — 모두 task 매핑. ✓

**2. Placeholder scan:** 0건. ✓

**3. Type consistency:** DataInlineEditor props (`dataSource`, `onChange`, `targetCd`, `onOpenDataSourcePicker`) ↔ DataMiniDialog 호출 (`dataSource={bufferDs}, onChange={setBufferDs}`) + DataAndFilterStep 호출 (`dataSource={l.dataSource}, onChange={(nextDs) => handleUpdateDataSource(l.key, nextDs)}`) 일치 ✓.
