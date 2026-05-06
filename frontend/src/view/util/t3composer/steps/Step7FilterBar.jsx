import React from 'react';
import {
  Box, Typography, Paper, Stack, TextField, MenuItem, Button, IconButton, Checkbox, FormControlLabel, Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/DeleteOutline';

import StepDataInspector from '../StepDataInspector';

const FIELD_TYPES = [
  { value: 'TEXT',                 label: 'TEXT — 자유 텍스트' },
  { value: 'NUMBER',               label: 'NUMBER — 숫자' },
  { value: 'DATE',                 label: 'DATE — 단일 일자' },
  { value: 'DATE_RANGE',           label: 'DATE_RANGE — 기간 (flatten 자동)' },
  { value: 'DROPDOWN',             label: 'DROPDOWN — 공통코드/인라인' },
  { value: 'CHECKBOX',             label: 'CHECKBOX' },
  { value: 'RADIO',                label: 'RADIO (segmented)' },
  { value: 'POPUP',                label: 'POPUP — 마스터 단건' },
  { value: 'AUTOCOMPLETE',         label: 'AUTOCOMPLETE' },
  { value: 'DOMAIN_PLAN_SCOPE',    label: 'DOMAIN_PLAN_SCOPE (flatten 자동)' },
  { value: 'DOMAIN_ITEM_SINGLE',   label: 'DOMAIN_ITEM_SINGLE' },
  { value: 'DOMAIN_ITEM_MULTI',   label: 'DOMAIN_ITEM_MULTI' },
  { value: 'DOMAIN_ACCOUNT_SINGLE',label: 'DOMAIN_ACCOUNT_SINGLE' },
  { value: 'DOMAIN_ACCOUNT_MULTI', label: 'DOMAIN_ACCOUNT_MULTI' },
  { value: 'DOMAIN_LOCATION_MULTI',label: 'DOMAIN_LOCATION_MULTI' },
  { value: 'DOMAIN_RESOURCE_MULTI',label: 'DOMAIN_RESOURCE_MULTI' },
  { value: 'DOMAIN_USER',          label: 'DOMAIN_USER' },
  { value: 'DOMAIN_VERSION',       label: 'DOMAIN_VERSION (flatten 자동)' },
];

const DATA_TYPES = [
  { value: 'string',  label: 'string' },
  { value: 'number',  label: 'number' },
  { value: 'boolean', label: 'boolean' },
  { value: 'array',   label: 'array' },
];

/**
 * Step7 — FilterBar 항목 추가.
 * 각 필드의 fieldId(대문자) · varName(camelCase) · type · data_type · null_when_empty 설정.
 * 출력은 filter-bar.schema.json 과 호환되는 JSON 으로 serialize.
 */
function Step7FilterBar({ value, onChange }) {
  const setFields = (fields) => onChange({ ...value, fields });

  const addField = () => {
    const n = value.fields.length + 1;
    setFields([
      ...value.fields,
      {
        fieldId: `FIELD_${n}`,
        varName: `field${n}`,
        type: 'TEXT',
        label: `필드 ${n}`,
        dataType: 'string',
        nullWhenEmpty: true,
        required: false,
        defaultValue: '',
      },
    ]);
  };

  const updateField = (idx, patch) => {
    setFields(value.fields.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
  };

  const removeField = (idx) => {
    setFields(value.fields.filter((_, i) => i !== idx));
  };

  return (
    <Box>
      <StepDataInspector
        title="Step 7 — FilterBar 전체 데이터 (AI 분석 결과 · 모든 필드 속성 포함)"
        data={value}
        summary={[
          { label: `block: ${value?.blockId || 'filter_main'}` },
          { label: `${(value?.fields || []).length} fields` },
        ]}
      />
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        FilterBar(조회 조건)에 배치할 필드를 구성합니다. SCM 도메인(품목·거래처·거점 등)은 반드시 <b>DOMAIN_*</b> 타입을 사용.
        <code>DATE_RANGE</code>·<code>DOMAIN_PLAN_SCOPE</code>·<code>DOMAIN_VERSION</code> 은 자동으로 flatten 되어 스칼라 파라미터로 SP 전달.
        <br/>UI 에 노출되지 않는 속성(<code>options_source / dependencies</code> 등)은 위 패널을 펼쳐 raw JSON 으로 확인.
      </Typography>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <Stack direction="row" alignItems="center" sx={{ mb: 1.5 }}>
          <Chip label={value.blockId} size="small" color="primary" />
          <Typography variant="caption" color="text.secondary" sx={{ ml: 1, flex: 1 }}>
            block_id — 다른 블록이 @form.<b>{value.blockId}</b>.&lt;varName&gt; 으로 참조
          </Typography>
          <Button size="small" startIcon={<AddIcon fontSize="small" />} onClick={addField}>
            필드 추가
          </Button>
        </Stack>

        {value.fields.length === 0 && (
          <Typography variant="caption" color="text.secondary">
            FilterBar 에 필드가 없습니다. 검색이 필요 없는 대시보드형 화면이면 이 단계를 건너뛰세요.
          </Typography>
        )}

        <Stack spacing={1}>
          {value.fields.map((f, idx) => (
            <Paper key={idx} variant="outlined" sx={{ p: 1.2 }}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <TextField size="small" label="fieldId (UPPER_SNAKE)"
                  value={f.fieldId}
                  onChange={(e) => updateField(idx, { fieldId: e.target.value.toUpperCase() })}
                  sx={{ width: 180 }}
                />
                <TextField size="small" label="varName (camel)"
                  value={f.varName}
                  onChange={(e) => updateField(idx, { varName: e.target.value })}
                  sx={{ width: 160 }}
                />
                <TextField size="small" select label="type" value={f.type}
                  onChange={(e) => updateField(idx, { type: e.target.value })}
                  sx={{ width: 280 }}
                >
                  {FIELD_TYPES.map((t) => (
                    <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                  ))}
                </TextField>
                <TextField size="small" label="label" value={f.label}
                  onChange={(e) => updateField(idx, { label: e.target.value })}
                  sx={{ flex: 1, minWidth: 160 }}
                />
                <TextField size="small" select label="dataType" value={f.dataType}
                  onChange={(e) => updateField(idx, { dataType: e.target.value })}
                  sx={{ width: 140 }}
                >
                  {DATA_TYPES.map((t) => (
                    <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                  ))}
                </TextField>
                <FormControlLabel
                  control={<Checkbox size="small" checked={f.nullWhenEmpty}
                    onChange={(e) => updateField(idx, { nullWhenEmpty: e.target.checked })}
                  />}
                  label={<Typography variant="caption">null_when_empty</Typography>}
                />
                <FormControlLabel
                  control={<Checkbox size="small" checked={f.required}
                    onChange={(e) => updateField(idx, { required: e.target.checked })}
                  />}
                  label={<Typography variant="caption">required</Typography>}
                />
                <IconButton size="small" onClick={() => removeField(idx)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
              {/* 2행 — 보조 속성 (defaultValue, placeholder, options 공급원) */}
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 0.8 }}>
                <TextField size="small" label="defaultValue"
                  value={f.defaultValue ?? ''}
                  onChange={(e) => updateField(idx, { defaultValue: e.target.value })}
                  sx={{ width: 160 }}
                />
                <TextField size="small" label="placeholder"
                  value={f.placeholder || ''}
                  onChange={(e) => updateField(idx, { placeholder: e.target.value })}
                  sx={{ width: 200 }}
                />
                {(f.type === 'DROPDOWN' || f.type === 'CHECKBOX' || f.type === 'RADIO') && (
                  <TextField size="small" label="groupCd (공통코드)"
                    value={f.groupCd || ''}
                    onChange={(e) => updateField(idx, { groupCd: e.target.value })}
                    placeholder="USE_YN, USER_TP 등"
                    sx={{ width: 220 }}
                  />
                )}
                <FormControlLabel
                  control={<Checkbox size="small" checked={!!f.includeAll}
                    onChange={(e) => updateField(idx, { includeAll: e.target.checked })}
                  />}
                  label={<Typography variant="caption">전체 옵션 포함</Typography>}
                />
              </Stack>
            </Paper>
          ))}
        </Stack>
      </Paper>
    </Box>
  );
}

export default Step7FilterBar;
