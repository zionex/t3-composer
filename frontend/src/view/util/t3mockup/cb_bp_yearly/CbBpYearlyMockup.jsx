import React from 'react';
import { Box, Card, CardContent, Typography, Stack, Chip, Grid, Button, Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import HistoryIcon from '@mui/icons-material/History';

import MockShell from '../_shared/MockShell';
import CbStepper from '../_shared/CbStepper';

const STEPS = [
  { label: '연간 수요',    status: 'done', detail: '12s' },
  { label: 'AOP 매핑',     status: 'done', detail: '4s' },
  { label: '월별 분할',    status: 'done', detail: '8s' },
  { label: '확정 처리',    status: 'done', detail: '2s' },
];

const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

const YEAR_PLAN = [
  { product: 'LED', monthly: [820,840,855,870,910,945,980,1010,1040,1075,1100,1130], total: 11575, aop: 11200, color: '#5281b3' },
  { product: 'CAMERA', monthly: [320,335,348,365,380,395,412,425,440,455,468,485], total: 4928, aop: 4800, color: '#2a9d8f' },
  { product: 'BATTERY', monthly: [340,355,368,380,395,408,420,432,445,458,470,482], total: 4953, aop: 5100, color: '#fa7d5b' },
  { product: 'DISPLAY', monthly: [245,255,262,270,278,285,292,300,308,316,322,328], total: 3461, aop: 3300, color: '#8b5cf6' },
];

function MonthlyBar({ monthly, color, max }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', height: 50, gap: 0.4, mt: 0.5 }}>
      {monthly.map((v, i) => (
        <Stack key={i} flex={1} alignItems="center" justifyContent="flex-end" spacing={0.25}>
          <Box sx={{ width: '80%', height: `${(v / max) * 100}%`, bgcolor: color, borderRadius: 0.4 }} />
        </Stack>
      ))}
    </Box>
  );
}

export default function CbBpYearlyMockup() {
  const max = Math.max(...YEAR_PLAN.flatMap((p) => p.monthly));

  return (
    <MockShell
      patternCode="cb_bp_yearly"
      patternLabel="CB — BP 년간계획"
      layoutCategory="LAYOUT_CONTROLBOARD"
      description="년간 시계열 + Stepper + 결과 (UI_BP_93)"
    >
      <Box sx={{ p: 2 }}>
        {/* 헤더 */}
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent sx={{ '&:last-child': { pb: 1.5 } }}>
            <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
              <Typography variant="subtitle1" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>BP_2027_V20260413_A</Typography>
              <Chip size="small" label="CONFIRMED" color="success" />
              <Chip size="small" label="대상: FY2027" variant="outlined" />
              <Chip size="small" label="총 24,917 EA / yr" variant="outlined" />
              <Box sx={{ flex: 1 }} />
              <Button size="small" variant="outlined" startIcon={<HistoryIcon />}>이력</Button>
              <Button size="small" variant="contained" color="success" startIcon={<CheckIcon />}>최종 확정</Button>
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
            { name: 'AOP 총량',  value: '24,400 EA',  delta: 'baseline' },
            { name: '계획 총량', value: '24,917 EA',   delta: '+2.1% vs AOP' },
            { name: '월 평균',   value: '2,076 EA',    delta: 'σ 6.8%' },
            { name: '최대 월',   value: '12월 2,425',  delta: '계절성' },
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

        {/* 년간 시계열 */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>제품군별 12개월 계획 (EA 단위)</Typography>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 600 }}>제품군</TableCell>
                  {MONTHS.map((m) => (
                    <TableCell key={m} align="right" sx={{ fontWeight: 600, fontSize: 11 }}>{m}</TableCell>
                  ))}
                  <TableCell align="right" sx={{ fontWeight: 600 }}>합계</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>AOP</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {YEAR_PLAN.map((row) => {
                  const gap = ((row.total - row.aop) / row.aop * 100).toFixed(1);
                  const gapPositive = parseFloat(gap) > 0;
                  return (
                    <TableRow key={row.product}>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Box sx={{ width: 10, height: 10, bgcolor: row.color, borderRadius: 0.25 }} />
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.product}</Typography>
                        </Stack>
                      </TableCell>
                      {row.monthly.map((v, i) => (
                        <TableCell key={i} align="right" sx={{ fontSize: 11, fontFamily: 'monospace' }}>{v}</TableCell>
                      ))}
                      <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{row.total.toLocaleString()}</TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', color: gapPositive ? 'success.main' : 'warning.main', fontWeight: 600 }}>
                        {row.aop.toLocaleString()} ({gapPositive ? '+' : ''}{gap}%)
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* 미니 시계열 바 (시각화) */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary">시각화 (월별 분포)</Typography>
              {YEAR_PLAN.map((row) => (
                <Stack key={row.product} direction="row" alignItems="center" spacing={1.5} sx={{ mt: 0.75 }}>
                  <Typography variant="caption" sx={{ width: 80, fontWeight: 600 }}>{row.product}</Typography>
                  <Box sx={{ flex: 1 }}>
                    <MonthlyBar monthly={row.monthly} color={row.color} max={max} />
                  </Box>
                </Stack>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </MockShell>
  );
}
