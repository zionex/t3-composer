import React from 'react';
import { Box, Card, CardContent, Typography, Stack, Chip, Grid, Select, MenuItem, FormControl, InputLabel, Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material';

import MockShell from '../_shared/MockShell';

const INBOUND = [
  { item: 'IT-A001 LED Module 60W', qty: 2400, eta: '2026-04-14', status: 'ON-TIME' },
  { item: 'IT-B001 Camera IMX-700', qty: 1800, eta: '2026-04-15', status: 'DELAYED' },
  { item: 'IT-C001 Battery 18650',   qty: 4500, eta: '2026-04-14', status: 'ON-TIME' },
  { item: 'IT-M001 PCB Substrate',   qty: 12000, eta: '2026-04-16', status: 'ON-TIME' },
];
const OUTBOUND = [
  { so: 'SO-2026-0042', cust: 'Samsung Display', qty: 1200, due: '2026-04-14', status: 'SHIPPED' },
  { so: 'SO-2026-0043', cust: 'LG Innotek',      qty: 800,  due: '2026-04-15', status: 'PICKING' },
  { so: 'SO-2026-0044', cust: 'Sony Corp.',       qty: 600,  due: '2026-04-15', status: 'PICKING' },
  { so: 'SO-2026-0045', cust: 'BOE Technology', qty: 2400, due: '2026-04-16', status: 'PLANNED' },
];
const WIP = [
  { wo: 'WO-2026-7771', line: 'LINE-A1', item: 'LED 60W',      qty: 1200, progress: 78 },
  { wo: 'WO-2026-7772', line: 'LINE-A2', item: 'LED 80W',      qty: 800,  progress: 45 },
  { wo: 'WO-2026-7773', line: 'LINE-B1', item: 'Camera IMX',   qty: 600,  progress: 92 },
  { wo: 'WO-2026-7774', line: 'LINE-C1', item: 'Battery 18650', qty: 4200, progress: 31 },
];

const STATUS_COLOR = {
  'ON-TIME': 'success', DELAYED: 'error',
  SHIPPED: 'success', PICKING: 'warning', PLANNED: 'default',
};

export default function DashInOutStatusMockup() {
  return (
    <MockShell
      patternCode="dash_inout_status"
      patternLabel="In/Out Status — 입출하 현황"
      layoutCategory="LAYOUT_DASHBOARD"
      description="경로 필터 + 입출하/WIP/출하상태 4데이터셋 (UI_FP_IN_OUT_STATUS_DASHBOARD)"
    >
      <Box sx={{ p: 2 }}>
        {/* Filter Bar */}
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent sx={{ '&:last-child': { pb: 1.5 } }}>
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>경로 그룹</InputLabel>
                <Select label="경로 그룹" value="KR-VN-CN" onChange={() => {}}>
                  <MenuItem value="KR-VN-CN">KR → VN/CN 우선</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>거점</InputLabel>
                <Select label="거점" value="ALL" onChange={() => {}}>
                  <MenuItem value="ALL">전체</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>기간</InputLabel>
                <Select label="기간" value="3d" onChange={() => {}}>
                  <MenuItem value="3d">최근 3일</MenuItem>
                </Select>
              </FormControl>
              <Chip label="실시간 (5초)" color="info" size="small" sx={{ ml: 1 }} />
              <Box sx={{ flex: 1 }} />
              <Typography variant="caption" color="text.secondary">갱신: 2026-04-13 17:42:18</Typography>
            </Stack>
          </CardContent>
        </Card>

        {/* KPI 4종 */}
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          <Grid item xs={6} md={3}>
            <Card variant="outlined"><CardContent sx={{ '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary">금일 입고</Typography>
              <Typography sx={{ fontSize: 28, fontWeight: 700 }}>20,700 EA</Typography>
              <Typography variant="caption" color="success.main">정시 입고율 92%</Typography>
            </CardContent></Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card variant="outlined"><CardContent sx={{ '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary">금일 출하</Typography>
              <Typography sx={{ fontSize: 28, fontWeight: 700 }}>5,000 EA</Typography>
              <Typography variant="caption" color="warning.main">목표 6,000 대비 83%</Typography>
            </CardContent></Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card variant="outlined"><CardContent sx={{ '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary">진행 중 WO</Typography>
              <Typography sx={{ fontSize: 28, fontWeight: 700 }}>4건</Typography>
              <Typography variant="caption" color="text.secondary">평균 진척 61%</Typography>
            </CardContent></Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card variant="outlined"><CardContent sx={{ '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary">지연 건</Typography>
              <Typography sx={{ fontSize: 28, fontWeight: 700, color: 'error.main' }}>2건</Typography>
              <Typography variant="caption" color="text.secondary">입고 1 / 출하 1</Typography>
            </CardContent></Card>
          </Grid>
        </Grid>

        {/* 4 데이터셋 */}
        <Grid container spacing={1.5}>
          {[
            { title: '입고 (Inbound)',  rows: INBOUND,  cols: ['품목', '수량', 'ETA', '상태'],
              cellExtract: (r) => [r.item, r.qty.toLocaleString(), r.eta, r.status] },
            { title: '출하 (Outbound)', rows: OUTBOUND, cols: ['SO', '고객', '수량', '납기', '상태'],
              cellExtract: (r) => [r.so, r.cust, r.qty.toLocaleString(), r.due, r.status] },
            { title: 'WIP (진행 중 WO)', rows: WIP, cols: ['WO', '라인', '품목', '수량', '진척'],
              cellExtract: (r) => [r.wo, r.line, r.item, r.qty.toLocaleString(), `${r.progress}%`],
              isWip: true },
            { title: '출하 상태 요약',   rows: null, isSummary: true },
          ].map((panel, idx) => (
            <Grid item xs={12} md={6} key={idx}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>{panel.title}</Typography>
                  {panel.isSummary ? (
                    <Stack spacing={1}>
                      {[
                        { label: 'SHIPPED',  count: 1, color: '#10b981' },
                        { label: 'PICKING',  count: 2, color: '#f59e0b' },
                        { label: 'PLANNED',  count: 1, color: '#94a3b8' },
                        { label: 'DELAYED',  count: 0, color: '#ef4444' },
                      ].map((s) => (
                        <Stack key={s.label} direction="row" alignItems="center" spacing={1.5}>
                          <Box sx={{ width: 12, height: 12, bgcolor: s.color, borderRadius: 0.25 }} />
                          <Typography variant="body2" sx={{ flex: 1 }}>{s.label}</Typography>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{s.count}건</Typography>
                          <Box sx={{ width: 80, height: 8, bgcolor: 'grey.100', borderRadius: 0.5, position: 'relative' }}>
                            <Box sx={{ position: 'absolute', inset: 0, width: `${(s.count / 4) * 100}%`, bgcolor: s.color, borderRadius: 0.5 }} />
                          </Box>
                        </Stack>
                      ))}
                    </Stack>
                  ) : (
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'grey.50' }}>
                          {panel.cols.map((c) => <TableCell key={c} sx={{ fontWeight: 600, fontSize: 12 }}>{c}</TableCell>)}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {panel.rows.map((r, i) => {
                          const cells = panel.cellExtract(r);
                          return (
                            <TableRow key={i}>
                              {cells.map((c, j) => {
                                const isStatus = panel.cols[j] === '상태';
                                const isProg   = panel.cols[j] === '진척';
                                if (isStatus) {
                                  return <TableCell key={j}><Chip size="small" label={c} color={STATUS_COLOR[c] || 'default'} sx={{ height: 18, fontSize: 10 }} /></TableCell>;
                                }
                                if (isProg) {
                                  const pct = r.progress;
                                  return (
                                    <TableCell key={j}>
                                      <Stack direction="row" alignItems="center" spacing={0.5}>
                                        <Box sx={{ width: 50, height: 6, bgcolor: 'grey.100', borderRadius: 0.5, position: 'relative' }}>
                                          <Box sx={{ position: 'absolute', inset: 0, width: `${pct}%`, bgcolor: pct > 80 ? '#10b981' : pct > 50 ? '#f59e0b' : '#5281b3', borderRadius: 0.5 }} />
                                        </Box>
                                        <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{pct}%</Typography>
                                      </Stack>
                                    </TableCell>
                                  );
                                }
                                return <TableCell key={j} sx={{ fontSize: 12, fontFamily: j === 0 ? 'monospace' : undefined }}>{c}</TableCell>;
                              })}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </MockShell>
  );
}
