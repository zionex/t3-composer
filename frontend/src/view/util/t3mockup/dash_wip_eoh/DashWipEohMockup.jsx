import React from 'react';
import { Box, Card, CardContent, Typography, Stack, Chip, Grid, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

import MockShell from '../_shared/MockShell';

// 14일 WIP 추이 (3 라우팅 그룹)
const DAYS = Array.from({ length: 14 }, (_, i) => `4/${(i + 1).toString().padStart(2, '0')}`);
const WIP_RG1 = [380, 412, 405, 435, 478, 460, 495, 510, 488, 522, 535, 510, 548, 562];
const WIP_RG2 = [240, 258, 270, 285, 290, 310, 305, 318, 332, 340, 355, 348, 362, 375];
const EOH_TS  = [12450, 12320, 12180, 12250, 12100, 11920, 11850, 12000, 11780, 11650, 11520, 11650, 11420, 11280];

// 공장별 WIP / EOH
const PLANT_DATA = [
  { plant: 'KR-Suwon',  wip: 562, eoh: 4280, target: 4500, color: '#5281b3' },
  { plant: 'VN-HCMC',   wip: 375, eoh: 3120, target: 3000, color: '#2a9d8f' },
  { plant: 'CN-Suzhou', wip: 488, eoh: 2880, target: 3200, color: '#fa7d5b' },
  { plant: 'MX-Tijuana', wip: 220, eoh: 1000, target: 1500, color: '#8b5cf6' },
];

function TripleLine({ a, b, c, width = 800, height = 220 }) {
  const all = [...a, ...b, ...c];
  const max = Math.max(...all);
  const min = Math.min(...all) * 0.9;
  const range = max - min || 1;
  const dx = width / (a.length - 1 || 1);
  const toPts = (data) =>
    data.map((v, i) => `${(i * dx).toFixed(1)},${(height - ((v - min) / range) * (height - 30) - 15).toFixed(1)}`).join(' ');
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <polyline points={toPts(a)} fill="none" stroke="#5281b3" strokeWidth={2.5} />
      <polyline points={toPts(b)} fill="none" stroke="#2a9d8f" strokeWidth={2.5} />
      <polyline points={toPts(c)} fill="none" stroke="#94a3b8" strokeWidth={2} strokeDasharray="4,4" />
    </svg>
  );
}

export default function DashWipEohMockup() {
  return (
    <MockShell
      patternCode="dash_wip_eoh"
      patternLabel="WIP / EOH — 재공 투입 생산"
      layoutCategory="LAYOUT_DASHBOARD"
      description="공장별 라우팅 필터 + WIP/EOH 출하 차트 (UI_FP_WIP_EOH_OUT_DASHBOARD)"
    >
      <Box sx={{ p: 2 }}>
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent sx={{ '&:last-child': { pb: 1.5 } }}>
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>공장</InputLabel>
                <Select label="공장" value="KR-Suwon" onChange={() => {}}>
                  <MenuItem value="KR-Suwon">KR-Suwon Plant</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>라우팅 그룹</InputLabel>
                <Select label="라우팅 그룹" value="RG-A" onChange={() => {}}>
                  <MenuItem value="RG-A">RG-A LED Assy</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>기간</InputLabel>
                <Select label="기간" value="14d" onChange={() => {}}>
                  <MenuItem value="14d">최근 14일</MenuItem>
                </Select>
              </FormControl>
              <Box sx={{ flex: 1 }} />
              <Chip label="갱신 5분 전" size="small" variant="outlined" />
            </Stack>
          </CardContent>
        </Card>

        {/* KPI 4종 */}
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          <Grid item xs={6} md={3}>
            <Card variant="outlined"><CardContent sx={{ '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary">현재 WIP</Typography>
              <Typography sx={{ fontSize: 28, fontWeight: 700 }}>1,645 EA</Typography>
              <Typography variant="caption" color="warning.main">14일 +47%</Typography>
            </CardContent></Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card variant="outlined"><CardContent sx={{ '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary">현재 EOH</Typography>
              <Typography sx={{ fontSize: 28, fontWeight: 700 }}>11,280 EA</Typography>
              <Typography variant="caption" color="error.main">−9.4% (감소)</Typography>
            </CardContent></Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card variant="outlined"><CardContent sx={{ '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary">금일 투입</Typography>
              <Typography sx={{ fontSize: 28, fontWeight: 700 }}>2,820 EA</Typography>
              <Typography variant="caption" color="success.main">목표 2,700 달성</Typography>
            </CardContent></Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card variant="outlined"><CardContent sx={{ '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary">금일 출고</Typography>
              <Typography sx={{ fontSize: 28, fontWeight: 700 }}>2,650 EA</Typography>
              <Typography variant="caption" color="text.secondary">net −170 EA</Typography>
            </CardContent></Card>
          </Grid>
        </Grid>

        {/* 차트 */}
        <Grid container spacing={1.5}>
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>WIP / EOH 추이 (14일)</Typography>
                  <Stack direction="row" spacing={1}>
                    <Chip size="small" label="RG-A WIP" sx={{ bgcolor: '#5281b3', color: 'white', fontSize: 10 }} />
                    <Chip size="small" label="RG-B WIP" sx={{ bgcolor: '#2a9d8f', color: 'white', fontSize: 10 }} />
                    <Chip size="small" label="EOH" variant="outlined" sx={{ fontSize: 10 }} />
                  </Stack>
                </Stack>
                <TripleLine a={WIP_RG1} b={WIP_RG2} c={EOH_TS.map((v) => v / 25)} />
                <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
                  {DAYS.filter((_, i) => i % 2 === 0).map((d) => (
                    <Typography key={d} sx={{ fontSize: 10, color: 'text.secondary' }}>{d}</Typography>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>공장별 WIP / EOH</Typography>
                <Grid container spacing={2}>
                  {PLANT_DATA.map((p) => {
                    const eohRatio = (p.eoh / p.target) * 100;
                    return (
                      <Grid item xs={12} md={3} key={p.plant}>
                        <Stack spacing={0.75}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Box sx={{ width: 10, height: 10, bgcolor: p.color, borderRadius: 0.25 }} />
                            <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>{p.plant}</Typography>
                          </Stack>
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="caption" color="text.secondary">WIP</Typography>
                            <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{p.wip.toLocaleString()} EA</Typography>
                          </Stack>
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="caption" color="text.secondary">EOH</Typography>
                            <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{p.eoh.toLocaleString()} EA</Typography>
                          </Stack>
                          <Box sx={{ position: 'relative', height: 6, bgcolor: 'grey.100', borderRadius: 0.5 }}>
                            <Box sx={{ position: 'absolute', inset: 0, width: `${Math.min(eohRatio, 110)}%`, bgcolor: eohRatio > 100 ? '#f59e0b' : p.color, borderRadius: 0.5 }} />
                          </Box>
                          <Typography variant="caption" color="text.secondary">목표 {p.target.toLocaleString()} ({eohRatio.toFixed(0)}%)</Typography>
                        </Stack>
                      </Grid>
                    );
                  })}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </MockShell>
  );
}
