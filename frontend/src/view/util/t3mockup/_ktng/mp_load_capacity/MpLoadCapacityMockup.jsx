import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Typography, Paper, Chip, Tabs, Tab, Button, LinearProgress,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import MockShell from '../../_shared/MockShell';

// KTNG — MP 공장/설비 부하 (가동조건)
//  Tab 1: UI_MP_KTNG_05 공장 부하/가동조건 → MpKtng05.jsx
//  Tab 2: UI_MP_KTNG_07 설비 부하/가동조건 → MpKtng07.jsx

const DATE_COLS = ['2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11'];

const PLANT_ROWS = [
  { PLANT: '신탄진공장',  CAPACITY: 800000, loads: [620000, 680000, 720000, 750000, 740000, 720000] },
  { PLANT: '청주공장',    CAPACITY: 600000, loads: [480000, 510000, 540000, 560000, 550000, 540000] },
  { PLANT: '광주공장',    CAPACITY: 500000, loads: [380000, 420000, 450000, 470000, 460000, 450000] },
  { PLANT: 'Almaty공장',  CAPACITY: 350000, loads: [280000, 295000, 310000, 320000, 315000, 310000] },
  { PLANT: 'Jakarta공장', CAPACITY: 280000, loads: [220000, 235000, 250000, 260000, 255000, 250000] },
];

const RESOURCE_ROWS = [
  { RESOURCE: 'MAKER-01 (신탄진)',  TYPE: '제조기', CAPACITY: 250000, loads: [195000, 215000, 230000, 240000, 235000, 230000] },
  { RESOURCE: 'MAKER-02 (신탄진)',  TYPE: '제조기', CAPACITY: 250000, loads: [205000, 220000, 235000, 245000, 240000, 235000] },
  { RESOURCE: 'PACKER-01 (신탄진)', TYPE: '포장기', CAPACITY: 300000, loads: [220000, 245000, 260000, 275000, 270000, 260000] },
  { RESOURCE: 'PACKER-02 (신탄진)', TYPE: '포장기', CAPACITY: 300000, loads: [240000, 260000, 275000, 290000, 285000, 275000] },
  { RESOURCE: 'OVEN-01 (청주)',     TYPE: '오븐',   CAPACITY: 180000, loads: [145000, 158000, 165000, 172000, 168000, 165000] },
];

function LoadCell({ load, cap }) {
  const pct = (load / cap) * 100;
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <LinearProgress variant="determinate" value={Math.min(pct, 100)} sx={{ flex: 1, height: 6, borderRadius: 1, bgcolor: '#e5e7eb', '& .MuiLinearProgress-bar': { bgcolor: pct >= 90 ? '#ef4444' : pct >= 75 ? '#f59e0b' : '#10b981' } }} />
      <Typography sx={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color: pct >= 90 ? '#ef4444' : pct >= 75 ? '#f59e0b' : '#10b981', width: 35, textAlign: 'right' }}>{pct.toFixed(0)}%</Typography>
    </Stack>
  );
}

export default function KtngMpLoadCapacityMockup() {
  const [tab, setTab] = React.useState(0);
  const rows = tab === 0 ? PLANT_ROWS : RESOURCE_ROWS;
  return (
    <MockShell
      patternCode="ktng_mp_load_capacity"
      patternLabel="KTNG — MP 공장/설비 부하 (가동조건)"
      layoutCategory="LAYOUT_SINGLE"
      description="UI_MP_KTNG_05 공장 부하 + UI_MP_KTNG_07 설비 부하. 월별 가동 부하율 (LOAD / CAPACITY) 시각화 — 녹색 &lt;75%, 주황 75-90%, 빨강 ≥90%."
    >
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 1.5 }}>
        <Tabs value={tab} onChange={(_e, v) => setTab(v)}>
          <Tab label={<Stack direction="row" spacing={1} alignItems="center"><span>공장 부하</span><Chip label="UI_MP_KTNG_05" size="small" variant="outlined" sx={{ height: 18, fontSize: 10, fontFamily: 'monospace' }} /></Stack>} />
          <Tab label={<Stack direction="row" spacing={1} alignItems="center"><span>설비 부하</span><Chip label="UI_MP_KTNG_07" size="small" variant="outlined" sx={{ height: 18, fontSize: 10, fontFamily: 'monospace' }} /></Stack>} />
        </Tabs>
      </Box>

      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="MAIN_VER" size="small" select value="V2026-06" sx={{ width: 140 }}><MenuItem value="V2026-06">V2026-06</MenuItem></TextField>
          <TextField label={tab === 0 ? 'PLANT' : 'RESOURCE'} size="small" select value="ALL" sx={{ width: 160 }}><MenuItem value="ALL">전체</MenuItem></TextField>
          <TextField label="기간" size="small" value="2026-06 ~ 11" sx={{ width: 160 }} />
        </Stack>
      </Box>

      <Box sx={{ px: 1.5, py: 0.7, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'flex-end' }}>
        <Button size="small" variant="outlined" startIcon={<DownloadIcon />}>Excel</Button>
      </Box>

      <Box sx={{ p: 1.5, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Paper variant="outlined" sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead><TableRow>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, width: 180 }}>{tab === 0 ? 'PLANT' : 'RESOURCE'}</TableCell>
                {tab === 1 && <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, width: 100 }}>TYPE</TableCell>}
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, fontFamily: 'monospace', textAlign: 'right', width: 110 }}>CAPACITY</TableCell>
                {DATE_COLS.map((d) => (
                  <TableCell key={d} sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, fontFamily: 'monospace', textAlign: 'center', width: 130 }}>{d.slice(2)}</TableCell>
                ))}
              </TableRow></TableHead>
              <TableBody>
                {rows.map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={{ fontSize: 11 }}>{tab === 0 ? r.PLANT : r.RESOURCE}</TableCell>
                    {tab === 1 && <TableCell sx={{ fontSize: 11 }}><Chip label={r.TYPE} size="small" variant="outlined" sx={{ height: 18, fontSize: 10 }} /></TableCell>}
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right', fontWeight: 600 }}>{r.CAPACITY.toLocaleString()}</TableCell>
                    {r.loads.map((v, j) => (
                      <TableCell key={j} sx={{ p: 0.5 }}>
                        <LoadCell load={v} cap={r.CAPACITY} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </MockShell>
  );
}
