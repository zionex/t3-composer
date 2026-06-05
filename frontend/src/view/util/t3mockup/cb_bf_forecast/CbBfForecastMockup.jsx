import React from 'react';
import { Box, Card, CardContent, Typography, Stack, Chip, Grid, Button, Divider, Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import RefreshIcon from '@mui/icons-material/Refresh';
import HistoryIcon from '@mui/icons-material/History';

import MockShell from '../_shared/MockShell';
import CbStepper from '../_shared/CbStepper';
import CbLogPane from '../_shared/CbLogPane';

const STEPS = [
  { label: '데이터 검증',   status: 'done',    detail: '2s' },
  { label: '예측 모델',     status: 'done',    detail: '4m 12s' },
  { label: '마스터 계획',   status: 'running', detail: 'ETA 2m' },
  { label: '재고/보충',     status: 'pending' },
  { label: '확정 처리',     status: 'pending' },
];

const KPI = [
  { name: 'MAPE',          value: '8.7%',  status: 'GOOD' },
  { name: 'Bias',          value: '−1.2%', status: 'GOOD' },
  { name: '신뢰구간',       value: '92%',   status: 'GOOD' },
  { name: '커버리지',       value: '187 SKU / 8 plants', status: 'OK' },
];

const LOGS = [
  { time: '14:22:18', level: 'INFO',  message: 'BF engine started — version=BF_V20260413_A, scope=KR+VN+CN' },
  { time: '14:22:19', level: 'INFO',  message: 'Loaded 187 SKUs, 24 months history' },
  { time: '14:22:21', level: 'INFO',  message: 'Data validation passed (2.1s)' },
  { time: '14:22:23', level: 'INFO',  message: 'Stage 2: Forecasting started' },
  { time: '14:23:45', level: 'DEBUG', message: 'Model selection: ARIMA(3,1,2) for 124 SKUs, Prophet for 63' },
  { time: '14:26:35', level: 'INFO',  message: 'Forecasting completed — MAPE 8.7%, Bias −1.2%' },
  { time: '14:26:36', level: 'INFO',  message: 'Stage 3: Master plan generation started' },
  { time: '14:27:02', level: 'WARN',  message: 'IT-D002 demand exceeds 1.5σ — escalation flagged' },
  { time: '14:28:14', level: 'INFO',  message: 'Master plan: 89.4% RTF achieved' },
];

const RESULT = [
  { itemCd: 'IT-A001', itemNm: 'LED Module 60W',      forecast: 12500, base: 11800, conf: 0.94 },
  { itemCd: 'IT-A002', itemNm: 'LED Module 80W',      forecast: 8200,  base: 7800,  conf: 0.92 },
  { itemCd: 'IT-B001', itemNm: 'Camera IMX-700',     forecast: 5600,  base: 5400,  conf: 0.88 },
  { itemCd: 'IT-C001', itemNm: 'Battery 18650',      forecast: 18400, base: 17900, conf: 0.95 },
  { itemCd: 'IT-D002', itemNm: 'Display Panel 55"',  forecast: 2100,  base: 1800,  conf: 0.79 },
];

export default function CbBfForecastMockup() {
  return (
    <MockShell
      patternCode="cb_bf_forecast"
      patternLabel="CB — BF 예측 엔진"
      layoutCategory="LAYOUT_CONTROLBOARD"
      description="버전 + 5단계 Stepper + KPI + 로그 + 결과 그리드"
    >
      <Box sx={{ p: 2 }}>
        {/* 헤더 */}
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent sx={{ '&:last-child': { pb: 1.5 } }}>
            <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
              <Typography variant="subtitle1" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>BF_V20260413_A</Typography>
              <Chip size="small" label="RUNNING" color="primary" />
              <Chip size="small" label="시작: 14:22:18" variant="outlined" />
              <Chip size="small" label="경과 6m 42s" variant="outlined" />
              <Box sx={{ flex: 1 }} />
              <Button size="small" variant="outlined" startIcon={<HistoryIcon />}>이력</Button>
              <Button size="small" variant="outlined" color="error" startIcon={<StopIcon />}>중단</Button>
              <Button size="small" variant="contained" startIcon={<RefreshIcon />}>재실행</Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Stepper */}
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>실행 진행</Typography>
            <CbStepper steps={STEPS} />
          </CardContent>
        </Card>

        {/* KPI */}
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          {KPI.map((k) => (
            <Grid item xs={6} md={3} key={k.name}>
              <Card variant="outlined">
                <CardContent sx={{ '&:last-child': { pb: 1.5 } }}>
                  <Typography variant="caption" color="text.secondary">{k.name}</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.25 }}>{k.value}</Typography>
                  <Chip size="small" label={k.status} color={k.status === 'GOOD' ? 'success' : 'default'} sx={{ height: 16, fontSize: 10, mt: 0.25 }} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Log + Result */}
        <Grid container spacing={1.5}>
          <Grid item xs={12} md={6}>
            <CbLogPane lines={LOGS} height={280} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>예측 결과 (Top 5)</Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell sx={{ fontWeight: 600 }}>품목</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>예측</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>전월</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>신뢰</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {RESULT.map((r) => (
                      <TableRow key={r.itemCd}>
                        <TableCell sx={{ fontSize: 12 }}>
                          <Typography variant="caption" sx={{ fontFamily: 'monospace', display: 'block' }}>{r.itemCd}</Typography>
                          <Typography variant="caption" color="text.secondary">{r.itemNm}</Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{r.forecast.toLocaleString()}</TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>{r.base.toLocaleString()}</TableCell>
                        <TableCell align="right">
                          <Chip size="small" label={`${(r.conf * 100).toFixed(0)}%`}
                                color={r.conf > 0.9 ? 'success' : r.conf > 0.85 ? 'warning' : 'error'}
                                sx={{ height: 18, fontSize: 10 }} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </MockShell>
  );
}
