import React from 'react';
import { Box, Stack, TextField, MenuItem, Button, Chip, Typography, Switch, FormControlLabel, Divider } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import MockShell from '../../_shared/MockShell';

// PLANNEL IP 설정 — IpSettings 1개
// LAYOUT_SINGLE — 재고 정책 설정 폼

export default function IpSettingsMockup() {
  return (
    <MockShell
      patternCode="plannel_ip_settings"
      patternLabel="PlaNEL — IP 설정 (IP Settings)"
      layoutCategory="LAYOUT_SINGLE"
      description="재고 정책 / 서비스 레벨 / 동적 안전재고 설정. IP 운영의 모든 글로벌 정책."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" alignItems="center">
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Inventory Plan Settings</Typography>
          <Chip label="ACTIVE" color="success" size="small" sx={{ ml: 1 }} />
          <Box sx={{ flexGrow: 1 }} />
          <Button size="small" startIcon={<SaveIcon />} variant="contained">저장</Button>
        </Stack>
      </Box>

      <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: 'primary.main' }}>1. 서비스 레벨 정책</Typography>
        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <TextField label="Tier A (Critical)" type="number" size="small" value={99} InputProps={{ endAdornment: '%' }} sx={{ flex: 1 }} />
          <TextField label="Tier B (Important)" type="number" size="small" value={95} InputProps={{ endAdornment: '%' }} sx={{ flex: 1 }} />
          <TextField label="Tier C (Normal)" type="number" size="small" value={90} InputProps={{ endAdornment: '%' }} sx={{ flex: 1 }} />
          <TextField label="Tier D (Low)" type="number" size="small" value={85} InputProps={{ endAdornment: '%' }} sx={{ flex: 1 }} />
        </Stack>

        <Divider sx={{ mb: 3 }} />

        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: 'primary.main' }}>2. 동적 안전재고</Typography>
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <TextField label="계산 방식" select size="small" value="STD_DEV" sx={{ flex: 1 }}>
            <MenuItem value="STD_DEV">표준편차 × Service Level</MenuItem>
            <MenuItem value="MEAN_ABS">평균 절대 편차</MenuItem>
            <MenuItem value="QUANTILE">Quantile 회귀</MenuItem>
          </TextField>
          <TextField label="조정 주기 (주)" type="number" size="small" value={4} sx={{ flex: 1 }} />
          <TextField label="최소 일수" type="number" size="small" value={7} sx={{ flex: 1 }} />
          <TextField label="최대 일수" type="number" size="small" value={45} sx={{ flex: 1 }} />
        </Stack>
        <Stack direction="row" spacing={3} sx={{ mb: 3 }}>
          <FormControlLabel control={<Switch defaultChecked />} label="ABC-XYZ 자동 분류" />
          <FormControlLabel control={<Switch defaultChecked />} label="계절성 적용" />
          <FormControlLabel control={<Switch />} label="외부 변수 (날씨/경기) 포함" />
        </Stack>

        <Divider sx={{ mb: 3 }} />

        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: 'primary.main' }}>3. Slow Moving / Obsolete</Typography>
        <Stack direction="row" spacing={2}>
          <TextField label="Slow 경계 (회전/년)" type="number" size="small" value={2} sx={{ flex: 1 }} />
          <TextField label="Obsolete 경계 (일)" type="number" size="small" value={180} sx={{ flex: 1 }} />
          <TextField label="Aging 단계" select size="small" value="4" sx={{ flex: 1 }}>
            <MenuItem value="3">3 단계 (90/180/360일)</MenuItem>
            <MenuItem value="4">4 단계 (30/60/90/180일)</MenuItem>
          </TextField>
        </Stack>
      </Box>
    </MockShell>
  );
}
