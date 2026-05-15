import React from 'react';
import { Box, Card, CardContent, Typography, Stack, Chip, Grid, Button, Divider, Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import SendIcon from '@mui/icons-material/Send';
import HistoryIcon from '@mui/icons-material/History';

import MockShell from '../_shared/MockShell';
import CbStepper from '../_shared/CbStepper';
import CbLogPane from '../_shared/CbLogPane';

const STEPS = [
  { label: '검증',        status: 'done', detail: '2s' },
  { label: '집계',        status: 'done', detail: '8s' },
  { label: '예측 분배',   status: 'done', detail: '24s' },
  { label: '계획 생성',   status: 'done', detail: '1m 12s' },
  { label: '승인 대기',   status: 'running', detail: 'pending' },
];

const LOGS = [
  { time: '15:02:14', level: 'INFO', message: 'DP engine started — version=DP_V20260413_C, scope=KR+VN+CN' },
  { time: '15:02:16', level: 'INFO', message: 'Validation passed (187 SKUs, 6 plants)' },
  { time: '15:02:24', level: 'INFO', message: 'Aggregation done — 4 channel × 12 month' },
  { time: '15:02:48', level: 'INFO', message: 'Predict allocation: 124 SKUs L0, 63 SKUs L1' },
  { time: '15:04:00', level: 'INFO', message: 'Plan generated — RTF 96.4%, total 152,400 EA' },
  { time: '15:04:01', level: 'INFO', message: 'Status: WAITING_APPROVAL — assigned to kim.smk' },
];

const PLAN_ROWS = [
  { itemNm: 'LED Module 60W',  ch: 'OEM', plan: 12500, prev: 11800, gap: '+5.9%', editable: true },
  { itemNm: 'LED Module 80W',  ch: 'OEM', plan: 8200,  prev: 7800,  gap: '+5.1%', editable: true },
  { itemNm: 'Camera IMX-700',  ch: 'B2B', plan: 5600,  prev: 5400,  gap: '+3.7%', editable: true },
  { itemNm: 'Battery 18650',   ch: 'B2C', plan: 18400, prev: 17900, gap: '+2.8%', editable: true },
  { itemNm: 'Display Panel 55"', ch: 'OEM', plan: 2100,  prev: 1800, gap: '+16.7%', editable: true },
];

export default function CbDpDemandMockup() {
  return (
    <MockShell
      patternCode="cb_dp_demand"
      patternLabel="CB — DP 수요계획 엔진"
      layoutCategory="LAYOUT_CONTROLBOARD"
      description="버전 + Stepper + 승인/릴리즈 + 결과 그리드(편집) (UI_DP_93)"
    >
      <Box sx={{ p: 2 }}>
        {/* 헤더 */}
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent sx={{ '&:last-child': { pb: 1.5 } }}>
            <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
              <Typography variant="subtitle1" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>DP_V20260413_C</Typography>
              <Chip size="small" label="WAITING_APPROVAL" color="warning" />
              <Chip size="small" label="생성: 14:04 by kim.smk" variant="outlined" />
              <Chip size="small" label="RTF 96.4%" color="success" />
              <Box sx={{ flex: 1 }} />
              <Button size="small" variant="outlined" startIcon={<HistoryIcon />}>이력</Button>
              <Button size="small" variant="outlined" color="success" startIcon={<CheckIcon />}>승인</Button>
              <Button size="small" variant="contained" color="primary" startIcon={<SendIcon />}>릴리즈</Button>
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
          {[
            { name: '총 계획량',    value: '152,400 EA', delta: '+8.2% vs 전월' },
            { name: 'RTF',          value: '96.4%',       delta: '+1.4pt' },
            { name: 'Bias',          value: '−0.8%',       delta: '안정' },
            { name: '커버리지',     value: '187 SKU',     delta: '8 plants' },
          ].map((k) => (
            <Grid item xs={6} md={3} key={k.name}>
              <Card variant="outlined">
                <CardContent sx={{ '&:last-child': { pb: 1.5 } }}>
                  <Typography variant="caption" color="text.secondary">{k.name}</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.25 }}>{k.value}</Typography>
                  <Typography variant="caption" color="text.secondary">{k.delta}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Log + 편집 가능 결과 그리드 */}
        <Grid container spacing={1.5}>
          <Grid item xs={12} md={5}>
            <CbLogPane lines={LOGS} height={300} />
          </Grid>
          <Grid item xs={12} md={7}>
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, flex: 1 }}>계획 결과 (편집 가능)</Typography>
                  <Chip size="small" label="DRAFT" color="warning" sx={{ height: 18, fontSize: 10 }} />
                </Stack>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell sx={{ fontWeight: 600 }}>품목</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>채널</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>계획</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>전월</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>변동</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {PLAN_ROWS.map((r, i) => (
                      <TableRow key={i} sx={{ '& td input': { fontFamily: 'monospace', textAlign: 'right', border: '1px solid', borderColor: 'divider', borderRadius: 0.5, px: 0.5, py: 0.25, width: 80 } }}>
                        <TableCell sx={{ fontSize: 12 }}>{r.itemNm}</TableCell>
                        <TableCell sx={{ fontSize: 12 }}><Chip size="small" label={r.ch} variant="outlined" sx={{ height: 18, fontSize: 10 }} /></TableCell>
                        <TableCell align="right">
                          <input type="text" defaultValue={r.plan.toLocaleString()} />
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>{r.prev.toLocaleString()}</TableCell>
                        <TableCell align="right" sx={{ color: r.gap.startsWith('+1') ? 'warning.main' : 'success.main', fontWeight: 600 }}>{r.gap}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Divider sx={{ my: 1.5 }} />
                <Typography variant="caption" color="text.secondary">
                  편집 후 저장 — 변경 사항은 새 버전 생성 시점에 반영
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </MockShell>
  );
}
