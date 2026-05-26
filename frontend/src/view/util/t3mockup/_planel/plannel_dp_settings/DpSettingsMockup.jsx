import React from 'react';
import { Box, Stack, TextField, MenuItem, Button, Chip, Typography, Tabs, Tab,
  Switch, FormControlLabel, Divider } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import MockShell from '../../_shared/MockShell';

// PLANNEL DP 설정 — DpSettings / BfSettings / TargetItemSelection / PlanHorizonSelect 4개
// LAYOUT_SINGLE — 좌측 카테고리 list + 우측 설정 폼

const CATEGORIES = [
  { key: 'dp_main',     label: 'DP 기본 설정',  active: true },
  { key: 'bf_main',     label: 'BF 예측 설정',  active: false },
  { key: 'target_item', label: 'Target Item',   active: false },
  { key: 'plan_horizon',label: 'Plan Horizon',  active: false },
];

export default function DpSettingsMockup() {
  return (
    <MockShell
      patternCode="plannel_dp_settings"
      patternLabel="PlaNEL — DP 설정 (DP Settings / BF Settings / Target Item Selection / Plan Horizon Select)"
      layoutCategory="LAYOUT_SINGLE"
      description="좌측 설정 카테고리 list + 우측 설정 폼. 4개 DP 정책/설정 통합 화면."
    >
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Box sx={{ width: 240, borderRight: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
          <Typography variant="overline" sx={{ p: 1.5, display: 'block', color: 'text.secondary', fontWeight: 700 }}>설정 카테고리</Typography>
          {CATEGORIES.map((c) => (
            <Box key={c.key} sx={{
              p: 1.5, cursor: 'pointer',
              backgroundColor: c.active ? 'primary.50' : 'transparent',
              borderLeft: c.active ? '3px solid' : '3px solid transparent',
              borderLeftColor: c.active ? 'primary.main' : 'transparent',
            }}>
              <Typography variant="body2" sx={{ fontWeight: c.active ? 700 : 400 }}>{c.label}</Typography>
            </Box>
          ))}
        </Box>

        <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
          <Stack direction="row" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>DP 기본 설정</Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Chip label="V2026.05 적용" color="success" size="small" />
            <Button size="small" startIcon={<SaveIcon />} variant="contained" sx={{ ml: 1 }}>저장</Button>
          </Stack>
          <Divider sx={{ mb: 2 }} />

          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: 'primary.main' }}>1. 계획 주기</Typography>
          <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
            <TextField label="계획 주기" select size="small" value="MONTH" sx={{ width: 180 }}>
              <MenuItem value="WEEK">주간</MenuItem>
              <MenuItem value="MONTH">월간</MenuItem>
              <MenuItem value="QUARTER">분기</MenuItem>
            </TextField>
            <TextField label="버킷 단위" select size="small" value="WEEK" sx={{ width: 180 }}>
              <MenuItem value="DAY">일</MenuItem>
              <MenuItem value="WEEK">주</MenuItem>
              <MenuItem value="MONTH">월</MenuItem>
            </TextField>
            <TextField label="Horizon (개월)" type="number" size="small" value={18} sx={{ width: 140 }} />
          </Stack>

          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: 'primary.main' }}>2. 검토/승인 흐름</Typography>
          <Stack spacing={1} sx={{ mb: 3 }}>
            <FormControlLabel control={<Switch defaultChecked />} label="2단계 결재 활성" />
            <FormControlLabel control={<Switch defaultChecked />} label="이상치 자동 알림 (변동률 ±20% 초과)" />
            <FormControlLabel control={<Switch />} label="자동 확정 (검토 후 N일 미응답 시)" />
          </Stack>

          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: 'primary.main' }}>3. 검증 규칙</Typography>
          <Stack direction="row" spacing={2}>
            <TextField label="최소 수량 (EA)" type="number" size="small" value={0} sx={{ width: 160 }} />
            <TextField label="최대 변동률 (%)" type="number" size="small" value={50} sx={{ width: 160 }} />
            <TextField label="이상치 기준 (σ)" type="number" size="small" value={2} sx={{ width: 160 }} />
          </Stack>
        </Box>
      </Box>
    </MockShell>
  );
}
