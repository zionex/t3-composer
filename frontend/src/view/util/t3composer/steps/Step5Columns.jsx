import React from 'react';
import {
  Box, Typography, Paper, Stack, TextField, MenuItem, Button, IconButton, Chip, Checkbox, FormControlLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/DeleteOutline';

import StepDataInspector from '../StepDataInspector';

const DATA_TYPES = [
  { value: 'text',     label: 'text — 자유 텍스트' },
  { value: 'number',   label: 'number — 숫자' },
  { value: 'boolean',  label: 'boolean — Y/N (체크박스)' },
  { value: 'datetime', label: 'datetime — 일자/시각' },
];

const WIDGETS = [
  { value: '',                    label: '(기본 - dataType 에 맞춤)' },
  { value: 'CommonCodeSelect',    label: 'CommonCodeSelect — 공통코드 dropdown' },
  { value: 'PopSelectItem',       label: 'PopSelectItem — 품목' },
  { value: 'PopSelectAccount',    label: 'PopSelectAccount — 거래처' },
  { value: 'PopLocatMst',         label: 'PopLocatMst — 거점' },
  { value: 'PopDepartment',       label: 'PopDepartment — 부서' },
  { value: 'PopPosition',         label: 'PopPosition — 직위' },
  { value: 'useDropdown',         label: 'useDropdown (enum values+labels)' },
];

const ALIGN = [
  { value: '',          label: '(기본 — text=left/code=center/num=far)' },
  { value: 'left',      label: 'left' },
  { value: 'center',    label: 'center' },
  { value: 'far',       label: 'far (right · 숫자용)' },
];

/**
 * Step5 — 각 Area 의 Column 상세 정보.
 * Step4 에서 연결된 Entity/SP 의 컬럼을 바탕으로 사용자가 구체 속성을 지정.
 */
function Step5Columns({ areas, dataBinding, value, onChange }) {
  const setArea = (areaId, patch) => {
    onChange({ ...value, [areaId]: { ...(value[areaId] || { columns: [] }), ...patch } });
  };

  const addColumn = (areaId) => {
    const current = value[areaId] || { columns: [] };
    const idx = current.columns.length + 1;
    setArea(areaId, {
      columns: [...current.columns, {
        name: `col${idx}`, fieldName: `col${idx}`, headerText: `컬럼 ${idx}`,
        dataType: 'text', width: 120, editable: true,
        textAlignment: '', widget: '', validRules: [], defaultValue: '',
      }],
    });
  };

  const updateColumn = (areaId, idx, patch) => {
    const current = value[areaId] || { columns: [] };
    const next = current.columns.map((c, i) => (i === idx ? { ...c, ...patch } : c));
    setArea(areaId, { columns: next });
  };

  const removeColumn = (areaId, idx) => {
    const current = value[areaId] || { columns: [] };
    setArea(areaId, { columns: current.columns.filter((_, i) => i !== idx) });
  };

  const dataAreas = areas.filter((a) => ['grid', 'tree', 'pivot'].includes(a.kind));

  return (
    <Box>
      <StepDataInspector
        title="Step 5 — Columns 전체 데이터 (AI 분석 결과 · 모든 컬럼 속성 포함)"
        data={value}
        summary={[
          { label: `${Object.keys(value || {}).length} grids` },
          { label: `총 ${Object.values(value || {}).reduce((n, v) => n + (v?.columns?.length || 0), 0)} 컬럼` },
        ]}
      />
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        각 컬럼의 <b>dataType · 위젯 · 정렬 · validation · defaultValue</b> 를 지정합니다.
        모든 컬럼에 <code>fieldName</code> 필수 (BaseGrid 런타임 에러 방지).
        <br/>UI 에 노출되지 않는 속성(<code>displayType / datetimeFormat / values+labels / numberFormat</code> 등)은
        위 패널을 펼쳐 raw JSON 으로 확인하실 수 있습니다.
      </Typography>

      <Stack spacing={2}>
        {dataAreas.map((a) => {
          const areaState = value[a.id] || { columns: [] };
          const bind = dataBinding[a.id];
          return (
            <Paper key={a.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                <Chip label={a.kind} size="small" color="primary" />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{a.id}</Typography>
                {bind?.source === 'JPA_ENTITY' && bind.entity && (
                  <Chip label={`Entity: ${bind.entity}`} size="small" variant="outlined" />
                )}
                {bind?.source === 'SP' && bind.spName && (
                  <Chip label={`SP: ${bind.spName}`} size="small" variant="outlined" />
                )}
                <Box sx={{ flex: 1 }} />
                <Button size="small" startIcon={<AddIcon fontSize="small" />} onClick={() => addColumn(a.id)}>
                  컬럼 추가
                </Button>
              </Stack>

              <Stack spacing={1}>
                {areaState.columns.map((c, idx) => (
                  <Paper key={idx} variant="outlined" sx={{ p: 1, bgcolor: '#fafafa' }}>
                    {/* 1행 — 핵심 속성 */}
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                      <TextField size="small" label="name" value={c.name || ''}
                        onChange={(e) => updateColumn(a.id, idx, { name: e.target.value, fieldName: e.target.value })}
                        sx={{ width: 130 }}
                      />
                      <TextField size="small" label="header" value={c.headerText || ''}
                        onChange={(e) => updateColumn(a.id, idx, { headerText: e.target.value })}
                        sx={{ width: 150 }}
                      />
                      <TextField size="small" select label="dataType" value={c.dataType || 'text'}
                        onChange={(e) => updateColumn(a.id, idx, { dataType: e.target.value })}
                        sx={{ width: 180 }}
                      >
                        {DATA_TYPES.map((t) => (
                          <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                        ))}
                      </TextField>
                      <TextField size="small" label="width" type="number" value={c.width || ''}
                        onChange={(e) => updateColumn(a.id, idx, { width: Number(e.target.value) || 0 })}
                        sx={{ width: 80 }}
                      />
                      <TextField size="small" select label="widget" value={c.widget || ''}
                        onChange={(e) => updateColumn(a.id, idx, { widget: e.target.value })}
                        sx={{ width: 240 }}
                      >
                        {WIDGETS.map((w) => (
                          <MenuItem key={w.value} value={w.value}>{w.label}</MenuItem>
                        ))}
                      </TextField>
                      <TextField size="small" select label="정렬"
                        value={c.textAlignment === 'near' ? 'left' : (c.textAlignment || '')}
                        onChange={(e) => updateColumn(a.id, idx, { textAlignment: e.target.value })}
                        sx={{ width: 200 }}
                      >
                        {ALIGN.map((w) => (
                          <MenuItem key={w.value} value={w.value}>{w.label}</MenuItem>
                        ))}
                      </TextField>
                      <FormControlLabel
                        control={<Checkbox size="small" checked={!!c.editable} onChange={(e) => updateColumn(a.id, idx, { editable: e.target.checked })} />}
                        label={<Typography variant="caption">editable</Typography>}
                      />
                      <FormControlLabel
                        control={<Checkbox size="small" checked={c.visible !== false} onChange={(e) => updateColumn(a.id, idx, { visible: e.target.checked })} />}
                        label={<Typography variant="caption">visible</Typography>}
                      />
                      <FormControlLabel
                        control={<Checkbox size="small" checked={(c.validRules || []).some((r) => r === 'required' || r?.criteria === 'required')}
                          onChange={(e) => updateColumn(a.id, idx, {
                            validRules: e.target.checked ? [{ criteria: 'required' }] : []
                          })}
                        />}
                        label={<Typography variant="caption">required</Typography>}
                      />
                      <IconButton size="small" onClick={() => removeColumn(a.id, idx)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                    {/* 2행 — 보조 속성 (datetime/dropdown/숫자 포맷) */}
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 0.8 }}>
                      <TextField size="small" label="defaultValue" value={c.defaultValue ?? ''}
                        onChange={(e) => updateColumn(a.id, idx, { defaultValue: e.target.value })}
                        sx={{ width: 140 }}
                      />
                      {c.dataType === 'datetime' && (
                        <>
                          <TextField size="small" label="displayType" value={c.displayType || ''}
                            onChange={(e) => updateColumn(a.id, idx, { displayType: e.target.value })}
                            placeholder="date"
                            sx={{ width: 120 }}
                          />
                          <TextField size="small" label="datetimeFormat" value={c.datetimeFormat || ''}
                            onChange={(e) => updateColumn(a.id, idx, { datetimeFormat: e.target.value })}
                            placeholder="yyyy-MM-dd"
                            sx={{ width: 180 }}
                          />
                        </>
                      )}
                      {c.dataType === 'number' && (
                        <TextField size="small" label="numberFormat" value={c.numberFormat || ''}
                          onChange={(e) => updateColumn(a.id, idx, { numberFormat: e.target.value })}
                          placeholder="#,##0.00"
                          sx={{ width: 160 }}
                        />
                      )}
                      {c.widget === 'CommonCodeSelect' && (
                        <TextField size="small" label="groupCd" value={c.groupCd || ''}
                          onChange={(e) => updateColumn(a.id, idx, { groupCd: e.target.value })}
                          placeholder="USE_YN"
                          sx={{ width: 160 }}
                        />
                      )}
                      {c.widget === 'useDropdown' && (
                        <TextField size="small" label="values (CSV)"
                          value={Array.isArray(c.values) ? c.values.join(',') : (c.values || '')}
                          onChange={(e) => updateColumn(a.id, idx, {
                            values: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                          })}
                          sx={{ width: 220 }}
                        />
                      )}
                    </Stack>
                  </Paper>
                ))}
                {areaState.columns.length === 0 && (
                  <Typography variant="caption" color="text.secondary">
                    컬럼이 없습니다. "컬럼 추가" 버튼으로 시작하세요.
                  </Typography>
                )}
              </Stack>
            </Paper>
          );
        })}
        {dataAreas.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            grid/tree/pivot Area 가 없어 컬럼을 정의할 필요가 없습니다.
          </Typography>
        )}
      </Stack>
    </Box>
  );
}

export default Step5Columns;
