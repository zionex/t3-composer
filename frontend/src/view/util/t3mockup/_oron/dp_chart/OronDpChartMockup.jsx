import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Typography, Paper, Chip, Tabs, Tab,
  Switch, FormControlLabel, Checkbox, Button,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import DownloadIcon from '@mui/icons-material/Download';
import MockShell from '../../_shared/MockShell';

// ORON — DP 판매계획 차트/리포트
//  Tab 1: UI_DP_95_CHART  EntryChart       → BaseEntry hasChart=true
//  Tab 2: UI_DP_96        AllReport        → BaseAllReport hasChart=false isOnlyCloseVer=false
//  Tab 3: UI_DP_96_CHART  AllReportChart   → BaseAllReport hasChart=true
//
// 그리드 컬럼셋 = dimensionItems(60) + BUCK_TP/ITEM/ACCOUNT/SALES(hidden) + CATEGORY(Measure) + DATE(iteration prefix=DATE_) + COMMENT
// 차트 (hasChart=true) 는 ResultArea sizes=[30,70] vertical — 상단 차트 + 하단 그리드

const DATE_COLS = ['2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11', '2026-12'];

const DIM_HEADERS = [
  { name: 'DIMENSION_01', shown: 'BRAND',    width: 110 },
  { name: 'DIMENSION_02', shown: 'CHANNEL',  width: 110 },
  { name: 'DIMENSION_03', shown: 'ITEM_LV3', width: 90 },
  { name: 'DIMENSION_04', shown: 'ITEM_NM',  width: 200 },
];

const ROWS = [
  { dims: ['ORON', '온라인', 'MASK', '오론 비건마스크 5매'], cat: 'DP_QTY',  vals: [12000, 13500, 14000, 13500, 13000, 13500, 14500] },
  { dims: ['ORON', '온라인', 'MASK', '오론 비건마스크 5매'], cat: 'ACT_QTY', vals: [11500, 12800, 13200, null,  null,  null,  null],  locked: true },
  { dims: ['ORON', '오프라인', 'SERUM', '오론 세럼 30ml'],    cat: 'DP_QTY',  vals: [4500,  5000,  5500,  5800,  6000,  6500,  7000] },
  { dims: ['ORON', '오프라인', 'SERUM', '오론 세럼 30ml'],    cat: 'ACT_QTY', vals: [4400,  4800,  null,  null,  null,  null,  null],  locked: true },
  { dims: ['OEM-CLIENT-A', 'OEM', 'SUN', 'OEM 선크림 SPF50+'], cat: 'DP_QTY',  vals: [8500,  9000,  9500,  9500,  9000,  8500,  9000] },
];

const fmtN = (n) => (n == null ? '-' : n.toLocaleString());

// 간단한 SVG 라인 차트 (DP_QTY vs ACT_QTY 합계) — mockup 시각화용
function MockChart() {
  const w = 900, h = 140, pad = { l: 40, r: 20, t: 16, b: 22 };
  const plotW = w - pad.l - pad.r;
  const plotH = h - pad.t - pad.b;
  const series = [
    { name: 'DP_QTY (계획)',  color: '#1565c0', vals: [25000, 27500, 29000, 28800, 28000, 28500, 30500] },
    { name: 'ACT_QTY (실적)', color: '#6b7280', vals: [24100, 26400, 13200, null,  null,  null,  null],  dashed: true },
  ];
  const maxV = 32000;
  const x = (i) => pad.l + (plotW * i) / (DATE_COLS.length - 1);
  const y = (v) => pad.t + plotH - (plotH * v) / maxV;
  return (
    <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#fcfdff' }}>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 0.5 }}>
        <Typography sx={{ fontSize: 12, fontWeight: 700 }}>판매계획 vs 실적 추이 (집계)</Typography>
        {series.map((s) => (
          <Stack key={s.name} direction="row" spacing={0.5} alignItems="center">
            <Box sx={{ width: 14, height: 2, bgcolor: s.color, ...(s.dashed && { borderBottom: `2px dashed ${s.color}`, bgcolor: 'transparent' }) }} />
            <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>{s.name}</Typography>
          </Stack>
        ))}
      </Stack>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 150 }}>
        {[0, 0.25, 0.5, 0.75, 1].map((r, i) => (
          <line key={i} x1={pad.l} x2={w - pad.r} y1={pad.t + plotH * r} y2={pad.t + plotH * r} stroke="#e5e7eb" strokeWidth="1" />
        ))}
        {[0, 0.5, 1].map((r, i) => (
          <text key={i} x={pad.l - 6} y={pad.t + plotH * (1 - r) + 4} fontSize="9" fill="#9ca3af" textAnchor="end">{Math.round(maxV * r / 1000)}K</text>
        ))}
        {DATE_COLS.map((d, i) => (
          <text key={d} x={x(i)} y={h - 6} fontSize="9" fill="#6b7280" textAnchor="middle">{d.slice(2)}</text>
        ))}
        {series.map((s) => {
          const pts = s.vals.map((v, i) => v == null ? null : `${x(i)},${y(v)}`).filter(Boolean).join(' ');
          return <polyline key={s.name} fill="none" stroke={s.color} strokeWidth="2" points={pts} strokeDasharray={s.dashed ? '4 3' : 'none'} />;
        })}
        {series.flatMap((s) => s.vals.map((v, i) => v == null ? null : (
          <circle key={`${s.name}-${i}`} cx={x(i)} cy={y(v)} r="3" fill={s.color} />
        )))}
      </svg>
    </Box>
  );
}

function GridArea({ showAmtUnit = false }) {
  return (
    <Paper variant="outlined" sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <TableContainer sx={{ flex: 1 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {DIM_HEADERS.map((d) => (
                <TableCell key={d.name} sx={{ bgcolor: 'grey.100', fontWeight: 700, width: d.width, textAlign: d.shown === 'ITEM_NM' ? 'left' : 'center', fontSize: 12 }}>
                  {d.shown}
                  <Typography component="span" sx={{ ml: 0.5, fontSize: 9, color: 'text.disabled', fontFamily: 'monospace' }}>({d.name})</Typography>
                </TableCell>
              ))}
              <TableCell sx={{ bgcolor: '#fffbe6', fontWeight: 700, width: 110, textAlign: 'center', fontSize: 12 }}>
                Measure {showAmtUnit && <Chip label="만원" size="small" sx={{ ml: 0.5, height: 14, fontSize: 9 }} />}
              </TableCell>
              {DATE_COLS.map((d) => (
                <TableCell key={d} sx={{ bgcolor: 'grey.100', fontWeight: 700, width: 90, textAlign: 'right', fontSize: 12, fontFamily: 'monospace' }}>{d.slice(2)}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {ROWS.map((r, i) => (
              <TableRow key={i} hover sx={{ bgcolor: r.locked ? '#fafafa' : 'transparent' }}>
                {r.dims.map((v, j) => (
                  <TableCell key={j} sx={{ fontSize: 12, textAlign: j === 3 ? 'left' : 'center' }}>{v}</TableCell>
                ))}
                <TableCell sx={{
                  textAlign: 'center', fontWeight: 600, fontFamily: 'monospace', fontSize: 12,
                  color: r.cat === 'DP_QTY' ? '#1565c0' : '#6b7280',
                }}>{r.cat}</TableCell>
                {r.vals.map((v, j) => (
                  <TableCell key={j} sx={{
                    textAlign: 'right', fontFamily: 'monospace', fontSize: 12,
                    color: v == null ? '#d1d5db' : r.locked ? '#6b7280' : '#374151',
                    bgcolor: r.locked ? '#f3f4f6' : 'transparent',
                  }}>{fmtN(v)}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

// === Tab 1 — EntryChart (BaseEntry hasChart=true) =====================
function EntryChartTab() {
  return (
    <>
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="USER_ID" size="small" value="kim.youngsu" sx={{ width: 160 }}
            InputProps={{ startAdornment: <PersonIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} /> }} />
          <TextField label="AUTH_TP_ID" size="small" select value="SALES" sx={{ width: 140, '& .MuiOutlinedInput-root': { backgroundColor: '#f7ffff' } }}>
            <MenuItem value="SALES">영업</MenuItem>
          </TextField>
          <TextField label="VERSION_ID" size="small" select value="V2026-06_SIM" sx={{ width: 170 }}>
            <MenuItem value="V2026-06_SIM">V2026-06_SIM</MenuItem>
          </TextField>
          <TextField label="ITEM" size="small" value="MASK / 비건마스크 5매" sx={{ width: 220 }}
            InputProps={{ endAdornment: <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} /> }} />
          <TextField label="ACCOUNT" size="small" value="온라인 채널" sx={{ width: 180 }}
            InputProps={{ endAdornment: <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} /> }} />
          <TextField label="BUCKET" size="small" select value="MONTH" sx={{ width: 100 }}>
            <MenuItem value="MONTH">MONTH</MenuItem>
          </TextField>
        </Stack>
      </Box>
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <MockChart />
        <Box sx={{ p: 1.5, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <GridArea />
        </Box>
      </Box>
    </>
  );
}

// === Tab 2 — AllReport / Tab 3 — AllReportChart (BaseAllReport) ========
function AllReportTab({ hasChart = false }) {
  const [allUserLoad, setAllUserLoad] = React.useState(false);
  return (
    <>
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="VERSION_ID" size="small" select value="V2026-06_SIM" sx={{ width: 170 }}>
            <MenuItem value="V2026-06_SIM">V2026-06_SIM</MenuItem>
          </TextField>
          <TextField label="ITEM" size="small" value="" sx={{ width: 200 }}
            InputProps={{ endAdornment: <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} /> }} />
          <TextField label="ACCOUNT" size="small" value="" sx={{ width: 180 }}
            InputProps={{ endAdornment: <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} /> }} />
          <TextField label="CURCY_CD" size="small" select value="KRW" sx={{ width: 110 }}>
            <MenuItem value="KRW">KRW</MenuItem>
            <MenuItem value="USD">USD</MenuItem>
          </TextField>
          <TextField label="BUCKET" size="small" select value="MONTH" sx={{ width: 100 }}>
            <MenuItem value="MONTH">MONTH</MenuItem>
          </TextField>
          <FormControlLabel control={<Checkbox size="small" defaultChecked />} label={<Typography sx={{ fontSize: 12 }}>만원 단위</Typography>} />
          <FormControlLabel
            control={<Switch size="small" checked={allUserLoad} onChange={(_e, v) => setAllUserLoad(v)} />}
            label={<Typography sx={{ fontSize: 12 }}>ALL_USER_LOAD</Typography>}
          />
          {!allUserLoad && (
            <>
              <TextField label="USER" size="small" value="kim.youngsu (김영수)" sx={{ width: 200 }}
                InputProps={{ endAdornment: <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} /> }} />
              <TextField label="AUTH_TP_ID" size="small" select value="SALES" sx={{ width: 140 }}>
                <MenuItem value="SALES">영업</MenuItem>
              </TextField>
            </>
          )}
        </Stack>
      </Box>
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {hasChart && <MockChart />}
        <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ px: 1.5, py: 0.7, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 700 }}>판매계획 보고서</Typography>
            <Button size="small" variant="outlined" startIcon={<DownloadIcon />}>Excel</Button>
            <FormControlLabel control={<Checkbox size="small" />} label={<Typography sx={{ fontSize: 11 }}>DP_ENTRY_ACT_SALES_YN</Typography>} sx={{ ml: 1 }} />
          </Box>
          <Box sx={{ p: 1.5, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <GridArea showAmtUnit />
          </Box>
        </Box>
      </Box>
    </>
  );
}

export default function OronDpChartMockup() {
  const [tab, setTab] = React.useState(0);
  const TABS_META = [
    { label: '판매계획 입력 (Chart)',  menu: 'UI_DP_95_CHART' },
    { label: '판매계획 보고서',         menu: 'UI_DP_96' },
    { label: '판매계획 보고서 (Chart)', menu: 'UI_DP_96_CHART' },
  ];

  return (
    <MockShell
      patternCode="oron_dp_chart"
      patternLabel="ORON — DP 판매계획 차트 + 리포트"
      layoutCategory="LAYOUT_SINGLE"
      description="EntryChart = BaseEntry hasChart=true, AllReport = BaseAllReport hasChart=false, AllReportChart = BaseAllReport hasChart=true. 차트는 ResultArea sizes=[30,70] 상단에 노출. 그리드 컬럼셋은 dimensionItems(60 풀) + CATEGORY(Measure) + DATE(iteration). 셀 데이터는 ORON 도메인 예시 (마스크/세럼/OEM 선크림)."
    >
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 1.5 }}>
        <Tabs value={tab} onChange={(_e, v) => setTab(v)}>
          {TABS_META.map((t) => (
            <Tab key={t.menu} label={
              <Stack direction="row" spacing={1} alignItems="center">
                <span>{t.label}</span>
                <Chip label={t.menu} size="small" variant="outlined" sx={{ height: 18, fontSize: 10, fontFamily: 'monospace' }} />
              </Stack>
            } />
          ))}
        </Tabs>
      </Box>
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {tab === 0 && <EntryChartTab />}
        {tab === 1 && <AllReportTab hasChart={false} />}
        {tab === 2 && <AllReportTab hasChart={true} />}
      </Box>
    </MockShell>
  );
}
