/**
 * FilterFieldCard — FilterBar 의 개별 필드 카드 (inline 편집).
 *   상위 FilterBarInlinePanel 이 controlled props 로 호출.
 *
 *   props:
 *     field           {key, label, type}  spec.filterBar.items[i]
 *     layers          spec.layers (chip 노출용)
 *     affectsForField { [layerKey]: boolean }  이 필드가 영향 주는 layer 매핑
 *     onUpdate(patch) field 의 label/type 변경
 *     onRemove()      이 필드 삭제
 *     onToggleAffect(layerKey)  영향 토글
 *
 *   Plan: docs/superpowers/plans/2026-05-22-composer-canvas-phase2e2.md (Task 1)
 *   Spec: docs/superpowers/specs/2026-05-22-composer-canvas-phase2e2-filterbar-inline-design.md
 */
import React from 'react';
import {
  Box, TextField, Select, MenuItem, FormControl, IconButton,
  Chip, Stack, Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/DeleteOutline';

// filter-bar.schema.json 표준 + InputField 의 datetime 보강.
// 기본 10종 (TEXT/NUMBER/DATE/DATETIME/DATE_RANGE/DROPDOWN/RADIO/CHECKBOX/POPUP/AUTOCOMPLETE)
// + 도메인 9종 (DOMAIN_PLAN_SCOPE 외) = 19종. Step7FilterBar 와 동기 유지.
// SELECT 는 옛 별칭이지만 기존 데이터 호환 위해 같은 의미로 첫 자리에 유지.
export const FILTER_TYPES = [
  { value: 'TEXT',                 label: 'TEXT — 자유 텍스트' },
  { value: 'NUMBER',               label: 'NUMBER — 숫자' },
  { value: 'DATE',                 label: 'DATE — 단일 일자' },
  { value: 'DATETIME',             label: 'DATETIME — 일시' },
  { value: 'DATE_RANGE',           label: 'DATE_RANGE — 기간 (flatten 자동)' },
  { value: 'DROPDOWN',             label: 'DROPDOWN — 공통코드/인라인' },
  { value: 'SELECT',               label: 'SELECT — (DROPDOWN 별칭, 호환 유지)' },
  { value: 'RADIO',                label: 'RADIO — segmented' },
  { value: 'CHECKBOX',             label: 'CHECKBOX — Y/N 또는 다중' },
  { value: 'POPUP',                label: 'POPUP — 마스터 단건' },
  { value: 'AUTOCOMPLETE',         label: 'AUTOCOMPLETE' },
  { value: 'DOMAIN_PLAN_SCOPE',    label: 'DOMAIN_PLAN_SCOPE (flatten 자동)' },
  { value: 'DOMAIN_ITEM_SINGLE',   label: 'DOMAIN_ITEM_SINGLE' },
  { value: 'DOMAIN_ITEM_MULTI',    label: 'DOMAIN_ITEM_MULTI' },
  { value: 'DOMAIN_ACCOUNT_SINGLE',label: 'DOMAIN_ACCOUNT_SINGLE' },
  { value: 'DOMAIN_ACCOUNT_MULTI', label: 'DOMAIN_ACCOUNT_MULTI' },
  { value: 'DOMAIN_LOCATION_MULTI',label: 'DOMAIN_LOCATION_MULTI' },
  { value: 'DOMAIN_RESOURCE_MULTI',label: 'DOMAIN_RESOURCE_MULTI' },
  { value: 'DOMAIN_USER',          label: 'DOMAIN_USER' },
  { value: 'DOMAIN_VERSION',       label: 'DOMAIN_VERSION (flatten 자동)' },
];

function FilterFieldCard({ field, layers, affectsForField, onUpdate, onRemove, onToggleAffect }) {
  return (
    <Box sx={{
      bgcolor: '#fff', border: '1px solid #e2e8f0', borderRadius: 1,
      p: 1, display: 'flex', flexDirection: 'column', gap: 0.7,
    }}>
      {/* 1행: label + 삭제 */}
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <TextField
          value={field.label || ''}
          onChange={(e) => onUpdate({ label: e.target.value })}
          placeholder="라벨"
          size="small" variant="standard" fullWidth
          inputProps={{ style: { fontSize: 12, fontWeight: 700, color: '#3A4A63' } }}
        />
        <IconButton size="small" onClick={onRemove} sx={{ p: 0.3 }}>
          <DeleteIcon fontSize="small" sx={{ color: '#E0989A' }} />
        </IconButton>
      </Stack>

      {/* 2행: type */}
      <FormControl size="small" variant="standard" fullWidth>
        <Select
          value={field.type || 'TEXT'}
          onChange={(e) => onUpdate({ type: e.target.value })}
          sx={{ fontSize: 11, fontFamily: 'monospace', color: '#6E7E96' }}
        >
          {FILTER_TYPES.map((t) => (
            <MenuItem key={t.value} value={t.value} sx={{ fontSize: 11, fontFamily: 'monospace' }}>
              {t.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* 3행: 영향 chip 들 */}
      {layers.length > 0 && (
        <Box sx={{ mt: 0.3 }}>
          <Typography variant="caption" sx={{ fontSize: 10, color: '#6E7E96', mr: 0.5 }}>
            영향:
          </Typography>
          <Stack direction="row" spacing={0.3} flexWrap="wrap" useFlexGap sx={{ mt: 0.3 }}>
            {layers.map((l) => {
              const checked = !!affectsForField[l.key];
              return (
                <Chip
                  key={l.key}
                  label={l.title || l.key}
                  size="small"
                  onClick={() => onToggleAffect(l.key)}
                  sx={{
                    fontSize: 10, height: 18, cursor: 'pointer',
                    bgcolor: checked ? '#8FC4D4' : '#f1f5f9',
                    color: checked ? '#fff' : '#6E7E96',
                    border: checked ? 'none' : '1px dashed #cbd5e1',
                    fontWeight: 700,
                    '&:hover': {
                      bgcolor: checked ? '#7AB3C5' : '#e2e8f0',
                    },
                  }}
                />
              );
            })}
          </Stack>
        </Box>
      )}
    </Box>
  );
}

export default FilterFieldCard;
