import React from 'react';
import {
  Box, Typography, Paper, Stack, TextField, MenuItem, Button, IconButton, Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/DeleteOutline';

import StepDataInspector from '../StepDataInspector';

/**
 * Area Kind 별 기본 컴포넌트 후보.
 * 사용자는 각 Area 에 어떤 공용 컴포넌트를 배치할지 선택한다.
 */
const COMPONENT_OPTIONS_BY_KIND = {
  search: [
    { value: 'SearchArea',   label: 'SearchArea — 표준 검색 영역' },
    { value: 'FilterBar',    label: 'FilterBar — 고급 필터 (DOMAIN_* 지원)' },
  ],
  grid: [
    { value: 'BaseGrid',     label: 'BaseGrid — RealGrid2 기본' },
    { value: 'TreeGrid',     label: 'TreeGrid — 트리 그리드' },
  ],
  pivot: [
    { value: 'PivotTable',   label: 'PivotTable — D/M/P/V 피벗' },
    { value: 'BaseGrid',     label: 'BaseGrid (iteration 동적 컬럼)' },
  ],
  chart: [
    { value: 'ChartComponent', label: 'ChartComponent — Chart.js 래퍼' },
    { value: 'EqualizerBarChart', label: 'EqualizerBarChart — 커스텀' },
  ],
  tree: [
    { value: 'TreeGrid', label: 'TreeGrid — 계층형 그리드' },
  ],
  form: [
    { value: 'GroupBox + InputField', label: 'GroupBox + InputField 조합' },
  ],
  dashboard: [
    { value: 'DashboardPanel', label: 'DashboardPanel — 위젯 캔버스' },
  ],
};

/**
 * Grid 류 Area 는 기본 버튼(추가/삭제/저장/엑셀) 을 포함. 사용자가 체크박스로 on/off.
 */
const GRID_BUTTONS = [
  { key: 'add',    label: '+ 행 추가 (GridAddRowButton)' },
  { key: 'delete', label: '- 행 삭제 (GridDeleteRowButton)' },
  { key: 'save',   label: '💾 저장 (GridSaveButton)' },
  { key: 'excel',  label: '⬇ 엑셀 내보내기' },
  { key: 'import', label: '⬆ 엑셀 업로드' },
];

/**
 * Step3 — 각 Area 에 컴포넌트와 기본 속성 설정.
 */
function Step3Components({ areas, value, onChange }) {
  const setArea = (areaId, patch) => {
    onChange({
      ...value,
      [areaId]: { ...(value[areaId] || { components: [], buttons: [] }), ...patch },
    });
  };

  const addComponent = (areaId) => {
    const current = value[areaId] || { components: [], buttons: [] };
    const defaults = COMPONENT_OPTIONS_BY_KIND[areaKindOf(areas, areaId)] || [];
    const kind = defaults[0]?.value || 'BaseGrid';
    setArea(areaId, {
      components: [...current.components, { kind, id: `${areaId}Component${current.components.length + 1}`, title: '' }],
    });
  };

  const updateComponent = (areaId, idx, patch) => {
    const current = value[areaId] || { components: [] };
    const next = current.components.map((c, i) => (i === idx ? { ...c, ...patch } : c));
    setArea(areaId, { components: next });
  };

  const removeComponent = (areaId, idx) => {
    const current = value[areaId] || { components: [] };
    setArea(areaId, { components: current.components.filter((_, i) => i !== idx) });
  };

  /**
   * buttons 는 두 형태를 모두 지원:
   *   · string 배열  ['add', 'save', ...]   ← 기존 사용자 토글
   *   · 객체 배열    [{kind:'GridSaveButton', grid:'userGrid'}, ...]  ← AI prefill
   * 토글 시 어떤 형태든 string key 의 set 으로 변환해 비교.
   */
  const buttonKindToKey = (kind) => {
    const s = String(kind || '').toLowerCase();
    if (s.includes('addrow')) return 'add';
    if (s.includes('deleterow') || s.includes('delrow')) return 'delete';
    if (s.includes('save')) return 'save';
    if (s.includes('excelimport')) return 'import';
    if (s.includes('excel')) return 'excel';
    return null;
  };
  const buttonsToKeySet = (buttons) => {
    if (!Array.isArray(buttons)) return new Set();
    const out = new Set();
    for (const b of buttons) {
      if (typeof b === 'string') out.add(b);
      else if (b && typeof b === 'object') {
        const k = buttonKindToKey(b.kind);
        if (k) out.add(k);
      }
    }
    return out;
  };
  const isButtonOn = (areaState, key) => buttonsToKeySet(areaState.buttons).has(key);

  const toggleButton = (areaId, key) => {
    const current = value[areaId] || { components: [], buttons: [] };
    const set = buttonsToKeySet(current.buttons);
    if (set.has(key)) set.delete(key);
    else set.add(key);
    // 항상 string 배열로 정규화 (이후 LLM payload 가 사용)
    setArea(areaId, { buttons: Array.from(set) });
  };

  return (
    <Box>
      <StepDataInspector
        title="Step 3 — Components 전체 데이터 (AI 분석 결과)"
        data={value}
        summary={[
          { label: `${areas.length} areas` },
          { label: `${Object.keys(value || {}).length} entries` },
        ]}
      />
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        각 Area 에 배치할 공용 컴포넌트를 선택하고 기본 속성을 설정합니다.
        Grid 류 Area 는 표준 버튼 세트(추가·삭제·저장·엑셀) 를 체크박스로 on/off.
      </Typography>

      <Stack spacing={2}>
        {areas.map((a) => {
          const areaState = value[a.id] || { components: [], buttons: [] };
          const componentOptions = COMPONENT_OPTIONS_BY_KIND[a.kind] || [];
          const isGridLike = ['grid', 'tree', 'pivot'].includes(a.kind);

          return (
            <Paper key={a.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <Chip label={a.kind} size="small" color="primary" />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{a.id}</Typography>
                <Typography variant="caption" color="text.secondary">— {a.title || '(무제)'}</Typography>
              </Stack>

              {/* 컴포넌트 리스트 */}
              <Stack spacing={1} sx={{ mb: 1.5 }}>
                {areaState.components.map((c, idx) => (
                  <Stack key={idx} direction="row" spacing={1} alignItems="center">
                    <TextField
                      size="small" select label="컴포넌트"
                      value={c.kind}
                      onChange={(e) => updateComponent(a.id, idx, { kind: e.target.value })}
                      sx={{ width: 280 }}
                    >
                      {componentOptions.map((o) => (
                        <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      size="small" label="ID"
                      value={c.id}
                      onChange={(e) => updateComponent(a.id, idx, { id: e.target.value })}
                      sx={{ width: 180 }}
                    />
                    <TextField
                      size="small" label="Title"
                      value={c.title || ''}
                      onChange={(e) => updateComponent(a.id, idx, { title: e.target.value })}
                      sx={{ flex: 1 }}
                    />
                    <IconButton size="small" onClick={() => removeComponent(a.id, idx)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                ))}
                <Button
                  size="small" startIcon={<AddIcon fontSize="small" />}
                  onClick={() => addComponent(a.id)}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  컴포넌트 추가
                </Button>
              </Stack>

              {/* Grid 류 버튼 세트 */}
              {isGridLike && (
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    표준 버튼 세트
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {GRID_BUTTONS.map((b) => {
                      const on = isButtonOn(areaState, b.key);
                      return (
                        <Chip
                          key={b.key} label={b.label}
                          onClick={() => toggleButton(a.id, b.key)}
                          variant={on ? 'filled' : 'outlined'}
                          color={on ? 'primary' : 'default'}
                          size="small"
                          sx={{ cursor: 'pointer' }}
                        />
                      );
                    })}
                  </Stack>
                </Box>
              )}
            </Paper>
          );
        })}
      </Stack>
    </Box>
  );
}

function areaKindOf(areas, id) {
  return areas.find((a) => a.id === id)?.kind || 'grid';
}

export default Step3Components;
