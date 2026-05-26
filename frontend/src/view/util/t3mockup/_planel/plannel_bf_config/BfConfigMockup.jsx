import React from 'react';
import { Box, Stack, TextField, MenuItem, Button, Chip, Typography, Paper, Slider, Divider } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import TuneIcon from '@mui/icons-material/Tune';
import MockShell from '../../_shared/MockShell';

// PLANNEL BF 알고리즘 설정 — BfAlgorithmSettings / BfTrainingAdjustment / AccessControlAdmin 3개
// LAYOUT_SINGLE — 알고리즘 카드 + 학습 파라미터 + 권한

const ALGORITHMS = [
  { name: 'ARIMA',         enabled: true,  weight: 30, color: 'primary' },
  { name: 'Exp. Smoothing',enabled: true,  weight: 25, color: 'info' },
  { name: 'LSTM',          enabled: true,  weight: 25, color: 'success' },
  { name: 'Prophet',       enabled: true,  weight: 20, color: 'warning' },
  { name: 'XGBoost',       enabled: false, weight:  0, color: 'default' },
];

export default function BfConfigMockup() {
  return (
    <MockShell
      patternCode="plannel_bf_config"
      patternLabel="PlaNEL — BF 알고리즘 설정 (BF Algorithm / BF Training Adjustment / Access Control Admin)"
      layoutCategory="LAYOUT_SINGLE"
      description="예측 앙상블 알고리즘 가중치 + 학습 파라미터 조정. 3개 BF 설정 통합."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <TuneIcon color="primary" />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>BF Ensemble Configuration</Typography>
          <Chip label="ACTIVE" color="success" size="small" />
          <Box sx={{ flexGrow: 1 }} />
          <Button size="small" startIcon={<SaveIcon />} variant="contained">저장 + 재학습</Button>
        </Stack>
      </Box>

      <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: 'primary.main' }}>
          1. 알고리즘 앙상블 가중치 (합계 = 100%)
        </Typography>
        <Stack spacing={1.5} sx={{ mb: 3 }}>
          {ALGORITHMS.map((a) => (
            <Paper key={a.name} elevation={0} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', opacity: a.enabled ? 1 : 0.5 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Chip label={a.name} size="small" color={a.color}
                  sx={{ minWidth: 130, fontWeight: 700, fontFamily: 'monospace' }} />
                <Slider value={a.weight} min={0} max={50}
                  sx={{ flex: 1 }} disabled={!a.enabled}
                  valueLabelDisplay="auto" />
                <TextField type="number" size="small" value={a.weight} disabled={!a.enabled}
                  sx={{ width: 80 }} InputProps={{ endAdornment: '%' }} />
                <Chip label={a.enabled ? 'ON' : 'OFF'} size="small"
                  color={a.enabled ? 'success' : 'default'} sx={{ minWidth: 60 }} />
              </Stack>
            </Paper>
          ))}
        </Stack>

        <Divider sx={{ mb: 2 }} />

        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: 'primary.main' }}>
          2. 학습 파라미터
        </Typography>
        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <TextField label="학습 기간 (개월)" type="number" size="small" value={24} sx={{ flex: 1 }} />
          <TextField label="재학습 주기" select size="small" value="WEEKLY" sx={{ flex: 1 }}>
            <MenuItem value="DAILY">매일</MenuItem>
            <MenuItem value="WEEKLY">매주</MenuItem>
            <MenuItem value="MONTHLY">매월</MenuItem>
          </TextField>
          <TextField label="검증 분할 (%)" type="number" size="small" value={20} sx={{ flex: 1 }} />
        </Stack>

        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: 'primary.main' }}>
          3. 권한 (Access Control)
        </Typography>
        <Stack direction="row" spacing={1}>
          <Chip label="Admin: PlanningTeam" color="primary" />
          <Chip label="Viewer: Sales / Operations" variant="outlined" />
          <Chip label="Editor: BF_Analyst (3명)" variant="outlined" />
        </Stack>
      </Box>
    </MockShell>
  );
}
