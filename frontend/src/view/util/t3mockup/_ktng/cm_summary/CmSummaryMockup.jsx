import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography, Paper, Chip,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import MockShell from '../../_shared/MockShell';

// KTNG 공헌이익 — CmKtng01~11. Summary + 비용 항목 breakdown (재료비/마킹비/하이퍼/물류비/관세/원화가 등)

const KPI_TOP = [
  { label: '매출 (Revenue)',       value: '482.5M', delta: '+5.2%', color: 'primary' },
  { label: '공헌이익 (CM)',         value: '156.3M', delta: '+3.1%', color: 'success' },
  { label: '공헌이익율 (CM%)',     value: '32.4%',  delta: '-0.6pp', color: 'info'    },
  { label: '재료비율 (Material%)', value: '41.2%',  delta: '+1.2pp', color: 'warning' },
];

// 생산지별 공헌이익 (Lvl 4)
const PRODUCTION_SITES = [
  { site: '신탄진 공장',  revenue: 180.5, cm: 65.2, cmPct: 36.1, material: 70.5, marking: 12.5, logistics: 8.2, tariff: 2.5, normalMat: 10.5, fx: 11.1 },
  { site: '대전 공장',    revenue: 145.2, cm: 48.8, cmPct: 33.6, material: 62.8, marking: 11.2, logistics: 7.1, tariff: 2.1, normalMat:  8.8, fx:  4.4 },
  { site: '광주 공장',    revenue:  98.4, cm: 28.7, cmPct: 29.2, material: 44.8, marking:  8.2, logistics: 6.8, tariff: 1.8, normalMat:  5.9, fx:  2.2 },
  { site: '글로벌 인도네시아', revenue: 58.4,  cm: 13.6, cmPct: 23.3, material: 28.1, marking:  4.8, logistics: 8.5, tariff: 1.8, normalMat:  1.0, fx:  0.6 },
];

const SITE_COLUMNS = [
  { name: 'site',       label: '생산지',         width: 150, align: 'left' },
  { name: 'revenue',    label: '매출',            width: 90,  align: 'right', fmt: 'm' },
  { name: 'material',   label: '재료비',           width: 90,  align: 'right', fmt: 'm' },
  { name: 'marking',    label: '마킹비',           width: 80,  align: 'right', fmt: 'm' },
  { name: 'logistics',  label: '물류비',           width: 80,  align: 'right', fmt: 'm' },
  { name: 'tariff',     label: '관세',             width: 70,  align: 'right', fmt: 'm' },
  { name: 'normalMat',  label: '정상자재',         width: 80,  align: 'right', fmt: 'm' },
  { name: 'fx',         label: '환산 (FX)',        width: 90,  align: 'right', fmt: 'm' },
  { name: 'cm',         label: '공헌이익 (CM)',   width: 110, align: 'right', fmt: 'm', emphasize: true },
  { name: 'cmPct',      label: 'CM%',             width: 80,  align: 'right', fmt: 'pct', emphasize: true },
];

const fmt = (v, type) => {
  if (type === 'm') return v.toFixed(1) + 'M';
  if (type === 'pct') return v.toFixed(1) + '%';
  return v;
};

// 부문별 CM 차지
const CM_BREAKDOWN = [
  { cat: '재료비',     amt: 206.2, color: '#f59e0b' },
  { cat: '마킹비',     amt:  36.7, color: '#8b5cf6' },
  { cat: '물류비',     amt:  30.6, color: '#ef4444' },
  { cat: '관세',       amt:   8.2, color: '#06b6d4' },
  { cat: '정상자재',   amt:  26.2, color: '#10b981' },
  { cat: 'FX',         amt:  18.3, color: '#3b82f6' },
];
const totalCost = CM_BREAKDOWN.reduce((s, x) => s + x.amt, 0);

function KpiCard({ label, value, delta, color }) {
  return (
    <Paper variant="outlined" sx={{ p: 1.5, flex: 1, minWidth: 0 }}>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{label}</Typography>
      <Typography variant="h5" sx={{ fontWeight: 700, color: `${color}.main`, mt: 0.5 }}>{value}</Typography>
      <Typography variant="caption" sx={{ color: delta.startsWith('-') ? 'error.main' : 'success.main', fontWeight: 600 }}>
        {delta} vs 전월
      </Typography>
    </Paper>
  );
}

function CostBreakdownChart() {
  return (
    <Paper variant="outlined" sx={{ p: 1.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>비용 항목별 비중 (전체 매출 대비)</Typography>
      {/* Horizontal stacked bar */}
      <Box sx={{ display: 'flex', height: 36, borderRadius: 1, overflow: 'hidden', border: '1px solid', borderColor: 'divider', mb: 1.5 }}>
        {CM_BREAKDOWN.map((c) => {
          const pct = (c.amt / totalCost) * 100;
          return (
            <Box key={c.cat} sx={{ width: `${pct}%`, backgroundColor: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="caption" sx={{ color: '#fff', fontWeight: 700, fontFamily: 'monospace', fontSize: 11 }}>
                {pct.toFixed(0)}%
              </Typography>
            </Box>
          );
        })}
      </Box>
      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ rowGap: 0.5 }}>
        {CM_BREAKDOWN.map((c) => (
          <Stack key={c.cat} direction="row" alignItems="center" spacing={0.5}>
            <Box sx={{ width: 10, height: 10, backgroundColor: c.color, borderRadius: 0.5 }} />
            <Typography variant="caption">{c.cat}</Typography>
            <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>{c.amt.toFixed(1)}M</Typography>
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
}

export default function ContributionMarginMockup() {
  return (
    <MockShell
      patternCode="ktng_contribution_margin"
      patternLabel="KTNG — 공헌이익 (Contribution Margin)"
      layoutCategory="LAYOUT_SINGLE"
      description="KTNG 공헌이익 화면 CmKtng01~11 공통 패턴. Summary KPI + 비용 항목별 breakdown(재료비/마킹비/물류비/관세/정상자재/FX) + 생산지별 Lvl 4 그리드."
    >
      {/* SearchArea */}
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="회계 연월" size="small" value="2026-05" sx={{ width: 130 }} />
          <TextField label="법인" size="small" select value="KR" sx={{ width: 130 }}>
            <MenuItem value="KR">KT&G 국내</MenuItem>
            <MenuItem value="GLOBAL">KT&G GLOBAL</MenuItem>
            <MenuItem value="ALL">전체</MenuItem>
          </TextField>
          <TextField label="생산지 (Lvl 4)" size="small" select value="ALL" sx={{ width: 160 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="SH">신탄진 공장</MenuItem>
            <MenuItem value="DJ">대전 공장</MenuItem>
            <MenuItem value="GJ">광주 공장</MenuItem>
          </TextField>
          <TextField label="품목 그룹" size="small" select value="ALL" sx={{ width: 140 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="TC">담배</MenuItem>
            <MenuItem value="NGP">NGP</MenuItem>
          </TextField>
          <TextField label="통화" size="small" select value="KRW" sx={{ width: 100 }}>
            <MenuItem value="KRW">KRW</MenuItem>
            <MenuItem value="USD">USD</MenuItem>
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
        </Stack>
      </Box>

      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5, height: '100%', overflow: 'auto' }}>
        {/* Top KPI */}
        <Stack direction="row" spacing={1.5}>
          {KPI_TOP.map((k) => <KpiCard key={k.label} {...k} />)}
        </Stack>

        {/* Cost breakdown chart */}
        <Box sx={{ height: 150 }}>
          <CostBreakdownChart />
        </Box>

        {/* 생산지별 Lvl 4 그리드 */}
        <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 200 }}>
          <Box sx={{ p: 1, display: 'flex', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>생산지별 (Lvl 4) 공헌이익</Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Chip size="small" label={`${PRODUCTION_SITES.length} sites`} />
            <Button size="small" startIcon={<DownloadIcon />} sx={{ ml: 1 }}>Excel</Button>
          </Box>
          <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {SITE_COLUMNS.map((c) => (
                    <TableCell key={c.name}
                      sx={{ backgroundColor: c.emphasize ? 'success.light' : 'grey.100', width: c.width, fontWeight: 700, textAlign: c.align }}>
                      {c.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {PRODUCTION_SITES.map((row) => (
                  <TableRow key={row.site} hover>
                    {SITE_COLUMNS.map((c) => {
                      const v = row[c.name];
                      const display = c.fmt ? fmt(v, c.fmt) : v;
                      let color = c.emphasize ? 'success.dark' : 'inherit';
                      if (c.name === 'cmPct' && v < 30) color = 'warning.main';
                      return (
                        <TableCell key={c.name}
                          sx={{ textAlign: c.align, fontFamily: c.fmt ? 'monospace' : 'inherit',
                                fontWeight: c.emphasize ? 700 : 400, color }}>
                          {display}
                        </TableCell>
                      );
                    })}
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
