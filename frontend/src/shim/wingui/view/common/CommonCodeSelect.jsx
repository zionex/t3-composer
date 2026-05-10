import React from 'react';
import { Controller } from 'react-hook-form';
import { Box, Select, MenuItem } from '@mui/material';

/**
 * CommonCodeSelect — wingui InputField wrapBox 룩 (좌측 라벨 + 우측 select)
 * 단독 환경에서는 TB_AD_COMN_CODE 를 호출하지 않고 includeAll 만 표시.
 */
const WG_INPUT_HEIGHT = 32;
const WG_INPUT_WIDTH  = 200;
const WG_LABEL_WIDTH  = 78;
const WG_LABEL_BG     = '#eef1f5';
const WG_BORDER       = '#cfd6e0';

const wrapBoxSx = {
  display: 'inline-flex',
  alignItems: 'stretch',
  height: WG_INPUT_HEIGHT,
  border: `1px solid ${WG_BORDER}`,
  borderRadius: '4px',
  bgcolor: '#fff',
  overflow: 'hidden',
};
const labelBoxSx = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  minWidth: WG_LABEL_WIDTH, px: 1,
  bgcolor: WG_LABEL_BG, color: '#334155',
  fontSize: 12, fontWeight: 600,
  borderRight: `1px solid ${WG_BORDER}`,
};
const selectBaseSx = {
  width: WG_INPUT_WIDTH,
  height: WG_INPUT_HEIGHT,
  fontSize: 12,
  borderRadius: 0,
  '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
  '& .MuiSelect-select': { py: 0.6, px: 0.8 },
};

function CommonCodeSelect({ control, name, label, groupCd, includeAll, options, mode, ...rest }) {
  const opts = Array.isArray(options) ? options
              : includeAll ? [{ value: '', label: '전체' }] : [{ value: '', label: '전체' }];

  const renderSelect = (value, onChange) => (
    <Select
      value={value ?? ''}
      onChange={onChange}
      size="small"
      displayEmpty
      sx={selectBaseSx}
    >
      {opts.map((o, i) => (
        <MenuItem key={i} value={o.value ?? o.code ?? ''}>
          {o.label || o.name || o.value || '전체'}
        </MenuItem>
      ))}
    </Select>
  );

  return (
    <Box sx={{ ...wrapBoxSx, ...(rest.sx || {}) }}>
      {(label || groupCd) && <Box sx={labelBoxSx}>{label || groupCd}</Box>}
      <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
        {control && name ? (
          <Controller
            control={control} name={name} defaultValue=""
            render={({ field }) => renderSelect(field.value, field.onChange)}
          />
        ) : renderSelect('', () => {})}
      </Box>
    </Box>
  );
}

export default CommonCodeSelect;
