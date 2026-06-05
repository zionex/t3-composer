import React, { useState } from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography, Paper, Chip, Avatar, Tabs, Tab, LinearProgress,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import StorefrontIcon from '@mui/icons-material/Storefront';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import MockShell from '../../_shared/MockShell';

// CJBO — Top 판매 거래처/품목/품목군 (Google Maps · 리스트 · 트렌드 차트)
// DpTopSalesAccount (P_VIEW1=WI_DP_TOP_SALES_ACCOUNT — Google Maps)
// DpTopSalesItem    (P_VIEW1=WI_DP_TOP_SALES_ITEM — 슬라이더 리스트)
// DpTopSalesItemgrp (P_VIEW1=WI_DP_TOP_SALES_ITEMGRP — Chart.js 트렌드)

const MARKERS = [
  { lat: 37.5, lng: 126.9, name: '서울 본사',   amt: 285, color: '#1976d2', size: 'lg' },
  { lat: 37.4, lng: 127.1, name: '경기 광주',   amt: 162, color: '#1976d2', size: 'md' },
  { lat: 35.1, lng: 129.0, name: '부산항',       amt:  98, color: '#1976d2', size: 'md' },
  { lat: 21.0, lng:106.0,  name: '베트남 호치민',amt: 180, color: '#e91e63', size: 'lg' },
  { lat: -6.2, lng:106.8,  name: '인도네시아',   amt: 142, color: '#e91e63', size: 'md' },
  { lat:  3.1, lng:101.6,  name: '말레이시아',   amt:  68, color: '#e91e63', size: 'sm' },
  { lat: 14.5, lng:121.0,  name: '필리핀',       amt:  45, color: '#e91e63', size: 'sm' },
  { lat: 35.6, lng:139.7,  name: '일본 도쿄',    amt: 125, color: '#ff9800', size: 'md' },
  { lat: 31.2, lng:121.4,  name: '중국 상하이',  amt: 218, color: '#ff9800', size: 'lg' },
  { lat: 34.0, lng:-118.2, name: '미국 LA',      amt:  82, color: '#9c27b0', size: 'sm' },
];

const TOP_CUST = [
  { rank: 1, name: '롯데마트',          channel: '오프라인', amt: 285, color: '#1976d2', share: 18.5 },
  { rank: 2, name: '쿠팡',              channel: '온라인',   amt: 250, color: '#1976d2', share: 16.2 },
  { rank: 3, name: '베트남 KGS',        channel: '수출',     amt: 218, color: '#e91e63', share: 14.1 },
  { rank: 4, name: '인니 INDOMA',       channel: '수출',     amt: 180, color: '#e91e63', share: 11.7 },
  { rank: 5, name: '올리브영',          channel: '오프라인', amt: 162, color: '#1976d2', share: 10.5 },
  { rank: 6, name: '중국 상하이 SCM',   channel: '수출',     amt: 125, color: '#ff9800', share:  8.1 },
  { rank: 7, name: '일본 SCM',          channel: '수출',     amt:  98, color: '#ff9800', share:  6.4 },
  { rank: 8, name: '네이버스토어',      channel: '온라인',   amt:  82, color: '#1976d2', share:  5.3 },
];

const TOP_ITEMS = [
  { rank: 1, name: 'illuvia 비건마스크 5매',     brand: 'illuvia',  qty: 78500, amt: 195, color: '#1976d2', growth: +8.5 },
  { rank: 2, name: 'CJ Brand Korea KING-RED',    brand: 'CJ Brand', qty: 65200, amt: 182, color: '#1976d2', growth: -3.2 },
  { rank: 3, name: 'illuvia 토너 200ml',          brand: 'illuvia',  qty: 52100, amt: 142, color: '#1976d2', growth:+12.4 },
  { rank: 4, name: 'illuvia 크림 50g',            brand: 'illuvia',  qty: 41800, amt: 125, color: '#1976d2', growth: +5.8 },
  { rank: 5, name: 'CJ Brand Korea SLIM',         brand: 'CJ Brand', qty: 38500, amt:  98, color: '#9c27b0', growth: +2.1 },
  { rank: 6, name: 'illuvia MASK',                brand: 'illuvia',  qty: 32800, amt:  82, color: '#9c27b0', growth: +8.2 },
  { rank: 7, name: 'illuvia 에센스 30ml',         brand: 'illuvia',  qty: 28200, amt:  68, color: '#9c27b0', growth:+15.6 },
  { rank: 8, name: 'NGP Device #01',              brand: 'NGP',      qty: 18500, amt:  45, color: '#ff9800', growth:-12.5 },
];

const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
const ITEM_GROUPS = [
  { grp: 'illuvia 마스크',  color: '#1976d2', data: [42, 45, 48, 52, 56, 58, 62, 65, 68, 72, 75, 78] },
  { grp: 'illuvia 토너/크림', color: '#10b981', data: [28, 30, 32, 35, 38, 42, 45, 48, 52, 56, 58, 62] },
  { grp: 'CJ Brand Korea',  color: '#e91e63', data: [55, 58, 56, 54, 52, 50, 48, 45, 42, 40, 38, 35] },
  { grp: 'NGP Devices',     color: '#ff9800', data: [18, 19, 22, 24, 22, 20, 18, 16, 14, 12, 11,  9] },
];

function MapView() {
  return (
    <Paper variant="outlined" sx={{ flex: 1, position: 'relative', minHeight: 360,
      backgroundImage: 'linear-gradient(135deg, #e3f2fd 0%, #f1f8e9 100%)', overflow: 'hidden' }}>
      <Box sx={{ position: 'absolute', top: 8, left: 8, zIndex: 2, display: 'flex', gap: 0.5 }}>
        <Chip size="small" label="국내" sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 700 }} />
        <Chip size="small" label="동남아" sx={{ backgroundColor: '#e91e63', color: 'white', fontWeight: 700 }} />
        <Chip size="small" label="동북아" sx={{ backgroundColor: '#ff9800', color: 'white', fontWeight: 700 }} />
        <Chip size="small" label="미주" sx={{ backgroundColor: '#9c27b0', color: 'white', fontWeight: 700 }} />
      </Box>
      <svg viewBox="0 0 800 360" style={{ width: '100%', height: '100%', display: 'block' }}>
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="800" height="360" fill="url(#grid)" />
        <path d="M 60 120 L 100 100 L 160 110 L 200 130 L 220 180 L 180 220 L 120 210 L 80 180 Z"
              fill="rgba(76,175,80,0.18)" stroke="rgba(76,175,80,0.4)" strokeWidth="1" />
        <path d="M 320 250 L 400 240 L 470 270 L 460 310 L 380 320 L 320 300 Z"
              fill="rgba(76,175,80,0.18)" stroke="rgba(76,175,80,0.4)" strokeWidth="1" />
        <path d="M 540 80  L 620 60  L 680 80 L 720 130 L 660 180 L 580 170 L 540 130 Z"
              fill="rgba(76,175,80,0.18)" stroke="rgba(76,175,80,0.4)" strokeWidth="1" />

        {MARKERS.map((m, i) => {
          const x = 60 + (m.lng + 130) * 1.8;
          const y = 80 + (60 - m.lat) * 2.5;
          const r = m.size === 'lg' ? 18 : m.size === 'md' ? 13 : 9;
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={r + 4} fill={m.color} opacity={0.2} />
              <circle cx={x} cy={y} r={r} fill={m.color} opacity={0.85} stroke="white" strokeWidth={2} />
              <text x={x} y={y + 4} fill="white" fontSize={10} fontWeight={700} textAnchor="middle">{m.amt}</text>
              <text x={x} y={y + r + 14} fill="#374151" fontSize={9} fontWeight={500} textAnchor="middle">{m.name}</text>
            </g>
          );
        })}
      </svg>
      <Box sx={{ position: 'absolute', bottom: 8, right: 8, zIndex: 2,
        backgroundColor: 'rgba(255,255,255,0.9)', px: 1, py: 0.5, borderRadius: 1, fontSize: 10, fontFamily: 'monospace' }}>
        powered by Google Maps · 단위: 억 KRW
      </Box>
    </Paper>
  );
}

function TopCustTable() {
  return (
    <Paper variant="outlined" sx={{ width: 360, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
        <StorefrontIcon fontSize="small" color="primary" />
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Top 8 거래처</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Chip size="small" label="2026-06" variant="outlined" />
      </Box>
      <TableContainer sx={{ flex: 1 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {['Rank','거래처','채널','매출 (억)','점유율'].map((c) => (
                <TableCell key={c} sx={{ backgroundColor: 'grey.100', fontWeight: 700,
                  textAlign: ['Rank','매출 (억)','점유율'].includes(c) ? (c === 'Rank' ? 'center' : 'right') : 'left' }}>{c}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {TOP_CUST.map((r) => (
              <TableRow key={r.rank} hover>
                <TableCell sx={{ textAlign: 'center' }}>
                  <Avatar sx={{ width: 24, height: 24, fontSize: 12, fontWeight: 700,
                    backgroundColor: r.rank <= 3 ? r.color : 'grey.300',
                    color: r.rank <= 3 ? 'white' : 'text.primary' }}>{r.rank}</Avatar>
                </TableCell>
                <TableCell sx={{ fontWeight: r.rank <= 3 ? 700 : 500 }}>{r.name}</TableCell>
                <TableCell>
                  <Chip size="small" label={r.channel} variant="outlined"
                    color={r.channel === '온라인' ? 'info' : r.channel === '수출' ? 'warning' : 'default'} />
                </TableCell>
                <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{r.amt}</TableCell>
                <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', color: 'text.secondary' }}>{r.share.toFixed(1)}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

function ItemListView() {
  const maxAmt = Math.max(...TOP_ITEMS.map((x) => x.amt));
  return (
    <Paper variant="outlined" sx={{ flex: 1, p: 1.5, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
        <EmojiEventsIcon fontSize="small" color="warning" />
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Top 8 품목 — 슬라이더 랭킹</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Chip size="small" label="단위: 억 KRW" variant="outlined" />
      </Stack>
      <Stack spacing={1.5}>
        {TOP_ITEMS.map((r) => {
          const widthPct = (r.amt / maxAmt) * 100;
          const medal = r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : null;
          return (
            <Box key={r.rank} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1, backgroundColor: r.rank <= 3 ? '#fffde7' : undefined }}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Box sx={{ width: 36, textAlign: 'center' }}>
                  {medal ? (
                    <Typography sx={{ fontSize: 22 }}>{medal}</Typography>
                  ) : (
                    <Avatar sx={{ width: 28, height: 28, fontSize: 12, fontWeight: 700, backgroundColor: 'grey.300', color: 'text.primary', mx: 'auto' }}>{r.rank}</Avatar>
                  )}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, flex: 1 }}>{r.name}</Typography>
                    <Chip size="small" label={r.brand} variant="outlined" sx={{ height: 18, fontSize: 10 }} />
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', color: r.growth >= 0 ? 'success.main' : 'error.main', fontWeight: 700 }}>
                      {r.growth > 0 ? '+' : ''}{r.growth.toFixed(1)}%
                    </Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <LinearProgress variant="determinate" value={widthPct}
                      sx={{ flex: 1, height: 10, borderRadius: 1, backgroundColor: '#e3f2fd',
                        '& .MuiLinearProgress-bar': { backgroundColor: r.color } }} />
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, minWidth: 80, textAlign: 'right' }}>
                      {r.amt}억 · {r.qty.toLocaleString()}개
                    </Typography>
                  </Stack>
                </Box>
              </Stack>
            </Box>
          );
        })}
      </Stack>
    </Paper>
  );
}

function ItemGrpChartView() {
  const W = 900, H = 380, P = 40;
  const xStep = (W - P * 2) / (MONTHS.length - 1);
  const yMax = 100;
  const yScale = (v) => H - P - (v / yMax) * (H - P * 2);
  return (
    <Paper variant="outlined" sx={{ flex: 1, p: 1.5, display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <ShowChartIcon fontSize="small" color="primary" />
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>품목군별 월별 판매 추이 — 2026 (Chart.js)</Typography>
        <Box sx={{ flexGrow: 1 }} />
        {ITEM_GROUPS.map((g) => (
          <Stack key={g.grp} direction="row" alignItems="center" spacing={0.5}>
            <Box sx={{ width: 14, height: 4, backgroundColor: g.color, borderRadius: 1 }} />
            <Typography variant="caption">{g.grp}</Typography>
          </Stack>
        ))}
      </Stack>
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%' }}>
          {[0, 25, 50, 75, 100].map((y) => (
            <g key={y}>
              <line x1={P} y1={yScale(y)} x2={W - P} y2={yScale(y)} stroke="#e5e7eb" strokeWidth="0.5" />
              <text x={P - 5} y={yScale(y)} fill="#9ca3af" fontSize="10" textAnchor="end" dy="3">{y}</text>
            </g>
          ))}
          {MONTHS.map((m, i) => (
            <text key={m} x={P + xStep * i} y={H - 12} fill="#6b7280" fontSize="10" textAnchor="middle">{m}</text>
          ))}
          {ITEM_GROUPS.map((g) => {
            const d = g.data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${P + xStep * i} ${yScale(v)}`).join(' ');
            return (
              <g key={g.grp}>
                <path d={d} fill="none" stroke={g.color} strokeWidth={2.5} />
                {g.data.map((v, i) => (
                  <circle key={i} cx={P + xStep * i} cy={yScale(v)} r={3} fill={g.color} />
                ))}
              </g>
            );
          })}
        </svg>
      </Box>
      <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
        {ITEM_GROUPS.map((g) => {
          const total = g.data.reduce((a, b) => a + b, 0);
          const trend = g.data[g.data.length - 1] - g.data[0];
          return (
            <Box key={g.grp} sx={{ flex: 1, p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: g.color }} />
                <Typography variant="caption" sx={{ fontWeight: 700, flex: 1, fontSize: 11 }}>{g.grp}</Typography>
              </Stack>
              <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: 12 }}>연 누계 {total}억</Typography>
              <Typography variant="caption" sx={{ display: 'block', fontFamily: 'monospace', fontSize: 11, color: trend >= 0 ? 'success.main' : 'error.main', fontWeight: 700 }}>
                추이 {trend >= 0 ? '+' : ''}{trend}억
              </Typography>
            </Box>
          );
        })}
      </Stack>
    </Paper>
  );
}

export default function CjboWidgetTopSalesMapMockup() {
  const [tab, setTab] = useState(0);
  return (
    <MockShell patternCode="cjbo_widget_top_sales_map" patternLabel="CJBO — Top 판매 거래처/품목 지도 위젯 (DpTopSalesAccount/Item/ItemGrp)"
      layoutCategory="LAYOUT_SINGLE"
      description="거래처=Google Maps · 품목=슬라이더 랭킹 · 품목군=Chart.js 트렌드. SP_UI_SA_SALES_DP + P_VIEW1.">
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <TextField label="조회월" size="small" value="2026-06" sx={{ width: 130 }} />
          <TextField label="범위" size="small" select value="GLOBAL" sx={{ width: 130 }}>
            <MenuItem value="GLOBAL">글로벌</MenuItem>
            <MenuItem value="DOMESTIC">국내</MenuItem>
            <MenuItem value="EXPORT">수출</MenuItem>
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
        </Stack>
      </Box>

      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" sx={{ minHeight: 38 }}>
          <Tab label="Top 거래처 (Google Maps)" sx={{ minHeight: 38 }} />
          <Tab label="Top 품목 (슬라이더 리스트)" sx={{ minHeight: 38 }} />
          <Tab label="Top 품목군 (Chart.js)" sx={{ minHeight: 38 }} />
        </Tabs>
      </Box>

      <Box sx={{ p: 1.5, display: 'flex', gap: 1.5, flexGrow: 1, overflow: 'hidden' }}>
        {tab === 0 && (
          <>
            <MapView />
            <TopCustTable />
          </>
        )}
        {tab === 1 && <ItemListView />}
        {tab === 2 && <ItemGrpChartView />}
      </Box>
    </MockShell>
  );
}
