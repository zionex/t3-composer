import React from 'react';
import {
  Box, Typography, Paper, Stack, TextField, MenuItem, Button, IconButton, Checkbox, FormControlLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/DeleteOutline';

import StepDataInspector from '../StepDataInspector';

const ACTIONS = [
  { value: 'reload_options',  label: 'reload_options — 하위 옵션 재조회' },
  { value: 'clear_value',     label: 'clear_value — 값 초기화' },
  { value: 'set_visibility',  label: 'set_visibility — 표시/숨김 토글' },
];

/**
 * Step8 — FilterBar 필드 간 주종관계 (dependencies) · cross-field 검증.
 */
function Step8FilterCascade({ filterFields, value, onChange }) {
  const setDeps = (dependencies) => onChange({ ...value, dependencies });
  const setRules = (crossFieldRules) => onChange({ ...value, crossFieldRules });

  const addDep = () => setDeps([
    ...value.dependencies,
    { whenField: '', whenEvent: 'value_changed', affectField: '', action: 'reload_options', passParams: {}, alsoClear: true },
  ]);

  const updateDep = (idx, patch) => {
    setDeps(value.dependencies.map((d, i) => (i === idx ? { ...d, ...patch } : d)));
  };

  const removeDep = (idx) => {
    setDeps(value.dependencies.filter((_, i) => i !== idx));
  };

  const addRule = () => setRules([
    ...value.crossFieldRules,
    { ruleId: `rule_${value.crossFieldRules.length + 1}`, severity: 'error', expression: '', message: '' },
  ]);

  const updateRule = (idx, patch) => {
    setRules(value.crossFieldRules.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const removeRule = (idx) => {
    setRules(value.crossFieldRules.filter((_, i) => i !== idx));
  };

  const fieldOptions = [
    { value: '', label: '(선택)' },
    ...filterFields.map((f) => ({ value: f.fieldId, label: `${f.fieldId} — ${f.label}` })),
  ];

  return (
    <Box>
      <StepDataInspector
        title="Step 8 — FilterCascade 전체 데이터 (AI 분석 결과)"
        data={value}
        summary={[
          { label: `${(value?.dependencies || []).length} deps` },
          { label: `${(value?.crossFieldRules || []).length} rules` },
        ]}
      />
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        FilterBar 필드 간 <b>의존성</b> (상위 변경 → 하위 옵션 재조회/초기화) 과 <b>상호 검증</b> (기간 순서 등) 을 설정합니다.
        주종관계 없으면 이 단계를 건너뛰세요.
      </Typography>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2 }}>
        <Stack direction="row" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, flex: 1 }}>
            의존성 (dependencies)
          </Typography>
          <Button size="small" startIcon={<AddIcon fontSize="small" />} onClick={addDep}>
            의존성 추가
          </Button>
        </Stack>

        {value.dependencies.length === 0 ? (
          <Typography variant="caption" color="text.secondary">의존성 없음.</Typography>
        ) : (
          <Stack spacing={1}>
            {value.dependencies.map((d, idx) => (
              <Stack key={idx} direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <TextField size="small" select label="when_field" value={d.whenField}
                  onChange={(e) => updateDep(idx, { whenField: e.target.value })}
                  sx={{ width: 220 }}
                >
                  {fieldOptions.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                </TextField>
                <TextField size="small" select label="affect_field" value={d.affectField}
                  onChange={(e) => updateDep(idx, { affectField: e.target.value })}
                  sx={{ width: 220 }}
                >
                  {fieldOptions.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                </TextField>
                <TextField size="small" select label="action" value={d.action}
                  onChange={(e) => updateDep(idx, { action: e.target.value })}
                  sx={{ width: 240 }}
                >
                  {ACTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                </TextField>
                <FormControlLabel
                  control={<Checkbox size="small" checked={d.alsoClear}
                    onChange={(e) => updateDep(idx, { alsoClear: e.target.checked })}
                  />}
                  label={<Typography variant="caption">also_clear</Typography>}
                />
                <IconButton size="small" onClick={() => removeDep(idx)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}
          </Stack>
        )}
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <Stack direction="row" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, flex: 1 }}>
            상호 검증 (cross_field_rules)
          </Typography>
          <Button size="small" startIcon={<AddIcon fontSize="small" />} onClick={addRule}>
            규칙 추가
          </Button>
        </Stack>

        {value.crossFieldRules.length === 0 ? (
          <Typography variant="caption" color="text.secondary">검증 규칙 없음.</Typography>
        ) : (
          <Stack spacing={1}>
            {value.crossFieldRules.map((r, idx) => (
              <Stack key={idx} direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <TextField size="small" label="rule_id" value={r.ruleId}
                  onChange={(e) => updateRule(idx, { ruleId: e.target.value })}
                  sx={{ width: 180 }}
                />
                <TextField size="small" select label="severity" value={r.severity}
                  onChange={(e) => updateRule(idx, { severity: e.target.value })}
                  sx={{ width: 120 }}
                >
                  <MenuItem value="error">error</MenuItem>
                  <MenuItem value="warning">warning</MenuItem>
                </TextField>
                <TextField size="small" label="expression" value={r.expression}
                  onChange={(e) => updateRule(idx, { expression: e.target.value })}
                  placeholder="form.dateFrom <= form.dateTo"
                  sx={{ flex: 1, minWidth: 280 }}
                />
                <TextField size="small" label="message" value={r.message}
                  onChange={(e) => updateRule(idx, { message: e.target.value })}
                  sx={{ flex: 1, minWidth: 200 }}
                />
                <IconButton size="small" onClick={() => removeRule(idx)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}
          </Stack>
        )}
      </Paper>
    </Box>
  );
}

export default Step8FilterCascade;
