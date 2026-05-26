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
import React, { useMemo } from 'react';
import {
  Box, TextField, Select, MenuItem, FormControl, IconButton,
  Chip, Stack, Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/DeleteOutline';

// type 이 select-like 일 때만 옵션 영역 노출
const TYPES_WITH_OPTIONS = new Set([
  'DROPDOWN', 'SELECT', 'MULTISELECT', 'RADIO', 'CHECKBOX', 'AUTOCOMPLETE',
]);

// type 별 defaultValue placeholder — rules/21 §3.1.0 권장 초기값 그대로
//   datetime → null (★ '' 금지: Invalid Date), dateRange → [null, null]
//   number → null, check → false, multiselect → []
const DEFAULT_PLACEHOLDER = {
  TEXT:                "'' (또는 'foo' · @session.userId)",
  NUMBER:              'null (또는 0 · @now-1)',
  DATE:                'null (또는 @now · @now-1month · 2026-01-01)',
  DATETIME:            'null (또는 @now)',
  DATE_RANGE:          '[null, null] (또는 [@now-1month, @now])',
  DROPDOWN:            "'' (또는 'Y' · @first_option)",
  SELECT:              "'' (또는 'Y' · @first_option)",
  MULTISELECT:         '[] (또는 ["Y","N"] · @all_options)',
  RADIO:               "'' (또는 'Y' · @first_option)",
  CHECKBOX:            'false (또는 true)',
  POPUP:               'null',
  AUTOCOMPLETE:        '[] 또는 null',
  DOMAIN_PLAN_SCOPE:   'null (또는 @session.planScope)',
  DOMAIN_ITEM_SINGLE:  'null',
  DOMAIN_ITEM_MULTI:   '[]',
  DOMAIN_ACCOUNT_SINGLE:'null',
  DOMAIN_ACCOUNT_MULTI:'[]',
  DOMAIN_LOCATION_MULTI:'[]',
  DOMAIN_RESOURCE_MULTI:'[]',
  DOMAIN_USER:         'null (또는 @session.userId)',
  DOMAIN_VERSION:      'null (또는 @latest)',
};

// inline 옵션 ⇄ "value=label" 줄 단위 텍스트 변환
function parseInlineOptions(text) {
  return (text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const eq = line.indexOf('=');
      if (eq < 0) return { value: line, label: line };
      return { value: line.slice(0, eq).trim(), label: line.slice(eq + 1).trim() };
    });
}
function stringifyInlineOptions(arr) {
  return (arr || []).map((o) => `${o.value}=${o.label}`).join('\n');
}

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
  { value: 'DROPDOWN',             label: 'DROPDOWN — 단일 선택 (공통코드/인라인)' },
  { value: 'MULTISELECT',          label: 'MULTISELECT — 다중 선택' },
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
  const isOptioned = TYPES_WITH_OPTIONS.has(field.type);
  const options = field.options || {};
  const source = options.source || 'inline';
  const inlineText = useMemo(
    () => stringifyInlineOptions(options.inline),
    [options.inline],
  );

  // 옵션 source/값 변경 helper — options 객체 통째로 patch
  const patchOptions = (patch) => {
    onUpdate({ options: { ...options, ...patch } });
  };

  return (
    <Box sx={{
      bgcolor: '#fff', border: '1px solid #e2e8f0', borderRadius: 1,
      p: 1, display: 'flex', flexDirection: 'column', gap: 0.7,
    }}>
      {/* 1행: label (라벨 prefix 명시) + 삭제 — 다른 행과 시각 일관 */}
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <Typography variant="caption" sx={{
          fontSize: 10, color: '#6E7E96', fontWeight: 700, minWidth: 60,
        }}>
          라벨
        </Typography>
        <TextField
          value={field.label || ''}
          onChange={(e) => onUpdate({ label: e.target.value })}
          placeholder="예: 사용여부 · 거래처명"
          size="small" variant="standard" fullWidth
          inputProps={{ style: { fontSize: 12, fontWeight: 700, color: '#3A4A63' } }}
        />
        <IconButton size="small" onClick={onRemove} sx={{ p: 0.3 }}>
          <DeleteIcon fontSize="small" sx={{ color: '#E0989A' }} />
        </IconButton>
      </Stack>

      {/* 2행: type — '타입' prefix 명시 */}
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <Typography variant="caption" sx={{
          fontSize: 10, color: '#6E7E96', fontWeight: 700, minWidth: 60,
        }}>
          타입
        </Typography>
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
      </Stack>

      {/* 2.5행: select-like type 일 때만 옵션 source 입력 */}
      {isOptioned && (
        <Box sx={{
          bgcolor: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 1,
          p: 0.7, display: 'flex', flexDirection: 'column', gap: 0.5,
        }}>
          <Stack direction="row" alignItems="center" spacing={0.4}>
            <Typography variant="caption" sx={{ fontSize: 10, color: '#6E7E96', mr: 0.3, fontWeight: 700 }}>
              옵션
            </Typography>
            <Chip
              size="small" label="inline"
              onClick={() => patchOptions({ source: 'inline' })}
              sx={{
                fontSize: 9.5, height: 18, cursor: 'pointer',
                bgcolor: source === 'inline' ? '#7CA7E0' : '#fff',
                color:   source === 'inline' ? '#fff' : '#6E7E96',
                border: source === 'inline' ? 'none' : '1px solid #cbd5e1',
                fontWeight: 700,
              }}
            />
            <Chip
              size="small" label="common_code"
              onClick={() => patchOptions({ source: 'common_code' })}
              sx={{
                fontSize: 9.5, height: 18, cursor: 'pointer',
                bgcolor: source === 'common_code' ? '#7CA7E0' : '#fff',
                color:   source === 'common_code' ? '#fff' : '#6E7E96',
                border: source === 'common_code' ? 'none' : '1px solid #cbd5e1',
                fontWeight: 700,
              }}
            />
            <Chip
              size="small" label="sp"
              onClick={() => patchOptions({ source: 'sp' })}
              sx={{
                fontSize: 9.5, height: 18, cursor: 'pointer',
                bgcolor: source === 'sp' ? '#7CA7E0' : '#fff',
                color:   source === 'sp' ? '#fff' : '#6E7E96',
                border: source === 'sp' ? 'none' : '1px solid #cbd5e1',
                fontWeight: 700,
              }}
            />
            <Chip
              size="small" label="sql"
              onClick={() => patchOptions({ source: 'sql' })}
              sx={{
                fontSize: 9.5, height: 18, cursor: 'pointer',
                bgcolor: source === 'sql' ? '#7CA7E0' : '#fff',
                color:   source === 'sql' ? '#fff' : '#6E7E96',
                border: source === 'sql' ? 'none' : '1px solid #cbd5e1',
                fontWeight: 700,
              }}
            />
          </Stack>

          {source === 'inline' && (
            <TextField
              multiline minRows={2} maxRows={6}
              placeholder={'value=label 형식 한 줄씩\n예:\nY=사용\nN=미사용'}
              value={inlineText}
              onChange={(e) => patchOptions({ inline: parseInlineOptions(e.target.value) })}
              size="small" variant="outlined"
              inputProps={{ style: { fontSize: 11, fontFamily: 'monospace', color: '#3A4A63' } }}
              sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fff' } }}
            />
          )}

          {source === 'common_code' && (
            <TextField
              size="small" variant="outlined"
              placeholder="GRP_CD (예: USE_YN · STATUS_CD)"
              value={options.commonCode?.groupCd || ''}
              onChange={(e) => patchOptions({
                commonCode: { groupCd: e.target.value.toUpperCase().trim() },
              })}
              inputProps={{ style: { fontSize: 11, fontFamily: 'monospace', color: '#3A4A63' } }}
              sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fff' } }}
            />
          )}

          {source === 'sp' && (
            <Stack spacing={0.5}>
              <TextField
                size="small" variant="outlined"
                placeholder="SP 이름 (예: SP_UI_CM_50_POP_Q1)"
                value={options.sp?.name || ''}
                onChange={(e) => patchOptions({
                  sp: { ...(options.sp || {}), name: e.target.value.toUpperCase().trim() },
                })}
                inputProps={{ style: { fontSize: 11, fontFamily: 'monospace', color: '#3A4A63' } }}
                sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fff' } }}
              />
              <TextField
                multiline minRows={2} maxRows={5}
                placeholder={'파라미터 JSON (선택)\n예: { "planScope": "PS01", "useYn": "Y" }'}
                value={options.sp?.paramsJson || ''}
                onChange={(e) => patchOptions({
                  sp: { ...(options.sp || {}), paramsJson: e.target.value },
                })}
                size="small" variant="outlined"
                inputProps={{ style: { fontSize: 11, fontFamily: 'monospace', color: '#3A4A63' } }}
                sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fff' } }}
              />
              <Typography sx={{ fontSize: 9.5, color: '#94a3b8' }}>
                결과 첫 컬럼=value, 두번째=label 가정. 산출 백엔드에 옵션 endpoint 자동 생성됨.
              </Typography>
            </Stack>
          )}

          {source === 'sql' && (
            <Stack spacing={0.5}>
              <TextField
                multiline minRows={3} maxRows={10}
                placeholder={'SELECT VAL, LBL FROM TB_... WHERE ...\n첫 컬럼=value · 두번째=label'}
                value={options.sql?.query || ''}
                onChange={(e) => patchOptions({
                  sql: { ...(options.sql || {}), query: e.target.value },
                })}
                size="small" variant="outlined"
                inputProps={{ style: { fontSize: 11, fontFamily: 'monospace', color: '#3A4A63' } }}
                sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fff' } }}
              />
              <Typography sx={{ fontSize: 9.5, color: '#94a3b8' }}>
                MSSQL 방언. 산출 백엔드 Controller 에 JdbcTemplate.query 옵션 endpoint 자동 생성됨.
              </Typography>
            </Stack>
          )}
        </Box>
      )}

      {/* 2.8행: defaultValue (기본값) — 모든 type 노출.
                정적 값 (예: 'Y', 0, true, []) 또는 expression (예: @now,
                @session.userId, @first_option) 자유 입력. 비우면 rules/21
                §3.1.0 의 type 별 권장 초기값을 LLM 이 자동 사용. */}
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <Typography variant="caption" sx={{
          fontSize: 10, color: '#6E7E96', fontWeight: 700, minWidth: 60,
        }}>
          기본값
        </Typography>
        <TextField
          value={field.defaultValue || ''}
          onChange={(e) => onUpdate({ defaultValue: e.target.value })}
          placeholder={DEFAULT_PLACEHOLDER[field.type] || '비워두면 type 별 권장값 사용'}
          size="small" variant="standard" fullWidth
          inputProps={{
            style: { fontSize: 11, fontFamily: 'monospace', color: '#3A4A63' },
          }}
        />
      </Stack>

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
