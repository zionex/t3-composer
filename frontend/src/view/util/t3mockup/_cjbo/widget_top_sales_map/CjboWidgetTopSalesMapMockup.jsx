import React, { useState } from 'react';
import {
  Box, Stack, Typography, Paper, Tabs, Tab, Chip, Button, ToggleButton, ToggleButtonGroup,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import PlaceIcon from '@mui/icons-material/Place';
import MockShell from '../../_shared/MockShell';

// CJBO — Top Sales 위젯 3종 (DpTopSalesAccount/Item/ItemGrp)
// 소스 기반 재작성.
// path: view/demandplan/widgets/dptopsales{account,item,itemgrp}/*.jsx
// 모두 common/data POST { PROCEDURE_NAME: 'SP_UI_SA_SALES_DP', P_VIEW1: ... }
//
// 1. DpTopSalesAccount   P_VIEW1='WI_DP_TOP_SALES_ACCOUNT'
//    → WidgetContent + ResultArea sizes={[45,55]} vertical
//      Top 45%: Google Maps (@react-google-maps/api) — Marker per CATEGORY2/3/4 (name/lat/lng), MarkerClusterer, OverlayView
//      Bottom 55%: scrolling list (rank/name | pill amount | percentage | qty)
//    Sample data fields: CATEGORY2(name), CATEGORY3(lat), CATEGORY4(lng), VALUE1(qty), VALUE2(amt), VALUE4(share%)
//    Currency: $
//
// 2. DpTopSalesItem      P_VIEW1='WI_DP_TOP_SALES_ITEM'
//    → WidgetContent + WidgetButton(toggle, AMT/QTY) + list of Box rows
//    Row: "{index+1}. {CATEGORY2}" + pill value (rank 0=yellow/red, 1=blue, 2=green)
//
// 3. DpTopSalesItemgrp   P_VIEW1='WI_DP_TOP_SALES_ITEMGRP'
//    → ChartComponent (stacked line, fill:true) + ButtonArea (AMT/QTY toggle, W/M toggle)
//    Data: DATE3(month), DATE4(week), CATEGORY2(group), VALUE1(qty), VALUE2(amt)

const ACCOUNT_DATA = [
  { rank: 1, CATEGORY2: 'New York Corp.',     lat:  40.71, lng:  -74.0,  VALUE1:  2820, VALUE2: 4250, VALUE4: 18.5 },
  { rank: 2, CATEGORY2: 'Sao Paulo Corp.',    lat: -23.55, lng:  -46.6,  VALUE1:  2350, VALUE2: 3680, VALUE4: 16.0 },
  { rank: 3, CATEGORY2: 'Jakarta Corp.',      lat:  -6.20, lng:  106.8,  VALUE1:  1980, VALUE2: 2920, VALUE4: 12.7 },
  { rank: 4, CATEGORY2: 'Mexico City Corp.',  lat:  19.43, lng:  -99.1,  VALUE1:  1750, VALUE2: 2480, VALUE4: 10.8 },
  { rank: 5, CATEGORY2: 'Vancouver Corp.',    lat:  49.28, lng: -123.1,  VALUE1:  1420, VALUE2: 2150, VALUE4:  9.3 },
  { rank: 6, CATEGORY2: 'Sydney Corp.',       lat: -33.86, lng:  151.2,  VALUE1:  1180, VALUE2: 1820, VALUE4:  7.9 },
  { rank: 7, CATEGORY2: 'Roma Corp.',         lat:  41.90, lng:   12.5,  VALUE1:   980, VALUE2: 1510, VALUE4:  6.5 },
  { rank: 8, CATEGORY2: 'London Corp.',       lat:  51.50, lng:   -0.1,  VALUE1:   820, VALUE2: 1240, VALUE4:  5.4 },
];

const ITEM_DATA = [
  { rank: 1, CATEGORY2: 'L-Lysine HCl 98%',    VALUE1: 18500, VALUE2: 27750 },
  { rank: 2, CATEGORY2: 'L-Methionine 99%',    VALUE1: 15200, VALUE2: 30400 },
  { rank: 3, CATEGORY2: 'L-Lysine 78% (액상)', VALUE1: 12800, VALUE2: 16000 },
  { rank: 4, CATEGORY2: 'L-Tryptophan 98%',    VALUE1:  8200, VALUE2: 16400 },
  { rank: 5, CATEGORY2: 'L-Threonine 98.5%',   VALUE1:  5400, VALUE2:  8640 },
  { rank: 6, CATEGORY2: 'L-Valine 96.5%',      VALUE1:  3100, VALUE2:  6200 },
  { rank: 7, CATEGORY2: 'L-Arginine 99%',      VALUE1:  1850, VALUE2:  3700 },
];

const ITEMGRP_LABELS = ['2026-01','2026-02','2026-03','2026-04','2026-05'];
const ITEMGRP_DATA = [
  { CATEGORY2: 'Lysine',     color: '#1976d2', vals: [12500, 13200, 14100, 14800, 15500] },
  { CATEGORY2: 'Methionine', color: '#10b981', vals: [10800, 11200, 11800, 12500, 13200] },
  { CATEGORY2: 'Tryptophan', color: '#f59e0b', vals: [ 6500,  6800,  7200,  7800,  8200] },
  { CATEGORY2: 'Threonine',  color: '#ef4444', vals: [ 4200,  4500,  4800,  5100,  5400] },
  { CATEGORY2: 'Valine',     color: '#8b5cf6', vals: [ 2400,  2600,  2900,  3000,  3100] },
];

function FakeGoogleMap() {
  return (
    <Box sx={{ position: 'relative', height: '100%',
      backgroundImage: 'linear-gradient(135deg, #d3e6f3 0%, #c5d1d3 100%)', overflow: 'hidden' }}>
      <Box sx={{ position: 'absolute', top: 8, left: 8, zIndex: 2 }}>
        <Chip size="small" label="@react-google-maps/api · disableDefaultUI" sx={{ height: 18, fontSize: 9, fontFamily: 'monospace', backgroundColor: 'rgba(255,255,255,0.9)' }} />
      </Box>
      <svg viewBox="0 0 800 250" style={{ width: '100%', height: '100%' }}>
        <path d="M 80 100 L 140 80 L 200 100 L 240 140 L 200 180 L 120 180 L 80 140 Z"
              fill="rgba(255,255,255,0.5)" stroke="rgba(0,0,0,0.1)" strokeWidth="0.5" />
        <path d="M 300 130 L 380 110 L 460 140 L 480 200 L 380 220 L 320 200 Z"
              fill="rgba(255,255,255,0.5)" stroke="rgba(0,0,0,0.1)" strokeWidth="0.5" />
        <path d="M 520 60 L 600 50 L 680 80 L 720 130 L 660 180 L 580 170 L 540 130 Z"
              fill="rgba(255,255,255,0.5)" stroke="rgba(0,0,0,0.1)" strokeWidth="0.5" />

        {ACCOUNT_DATA.map((d) => {
          const x = 80 + (d.lng + 130) * 2.6;
          const y = 50 + (60 - d.lat) * 1.5;
          return (
            <g key={d.rank}>
              <PlaceIcon />
              <circle cx={x} cy={y} r="14" fill="#d32f2f" opacity="0.85" stroke="white" strokeWidth="2" />
              <text x={x} y={y + 4} fill="white" fontSize="11" fontWeight="700" textAnchor="middle">{d.rank}</text>
              <text x={x} y={y + 26} fill="#222" fontSize="9" fontWeight="600" textAnchor="middle">{d.CATEGORY2}</text>
            </g>
          );
        })}
      </svg>
      <Box sx={{ position: 'absolute', bottom: 4, right: 8, backgroundColor: 'rgba(255,255,255,0.9)', px: 0.75, py: 0.25, borderRadius: 0.5, fontSize: 9, fontFamily: 'monospace' }}>
        Google Maps
      </Box>
    </Box>
  );
}

function StackedLineChart() {
  const W = 800, H = 280, P = 35;
  const xStep = (W - P * 2) / ITEMGRP_LABELS.length;
  // Stacked sums
  const stackTotals = ITEMGRP_LABELS.map((_, i) => ITEMGRP_DATA.reduce((s, d) => s + d.vals[i], 0));
  const yMax = Math.ceil(Math.max(...stackTotals) / 5000) * 5000;
  const yScale = (v) => H - P - (v / yMax) * (H - P * 2);
  // For each i, stack from bottom up
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%' }}>
      {[0, yMax / 2, yMax].map((y) => (
        <g key={y}>
          <line x1={P} y1={yScale(y)} x2={W - P} y2={yScale(y)} stroke="#e5e7eb" strokeWidth="0.5" />
          <text x={P - 5} y={yScale(y)} fill="#9ca3af" fontSize="10" textAnchor="end" dy="3">{(y / 1000).toFixed(0)}k</text>
        </g>
      ))}
      {ITEMGRP_LABELS.map((m, i) => (
        <text key={m} x={P + xStep * i + xStep / 2} y={H - 8} fill="#6b7280" fontSize="10" textAnchor="middle">{m.slice(5)}월</text>
      ))}
      {ITEMGRP_DATA.map((d, di) => {
        let pts = '';
        for (let i = 0; i < d.vals.length; i++) {
          const stackedFromBottom = ITEMGRP_DATA.slice(0, di + 1).reduce((s, dd) => s + dd.vals[i], 0);
          pts += `${i === 0 ? 'M' : 'L'} ${P + xStep * i + xStep / 2} ${yScale(stackedFromBottom)} `;
        }
        let prevPts = '';
        for (let i = d.vals.length - 1; i >= 0; i--) {
          const prevStacked = ITEMGRP_DATA.slice(0, di).reduce((s, dd) => s + dd.vals[i], 0);
          prevPts += `L ${P + xStep * i + xStep / 2} ${yScale(prevStacked)} `;
        }
        return (
          <path key={d.CATEGORY2} d={pts + prevPts + 'Z'} fill={d.color} fillOpacity="0.6" stroke={d.color} strokeWidth="1.5" />
        );
      })}
    </svg>
  );
}

const PILL_COLORS = ['#ef4444', '#1976d2', '#10b981', '#9ca3af', '#9ca3af', '#9ca3af', '#9ca3af'];

export default function CjboWidgetTopSalesMapMockup() {
  const [tab, setTab] = useState(0);
  const [unit, setUnit] = useState('AMT');
  const [period, setPeriod] = useState('M');

  return (
    <MockShell patternCode="cjbo_widget_top_sales_map"
      patternLabel="CJBO — Top Sales 위젯 3종 (DpTopSalesAccount/Item/ItemGrp)"
      layoutCategory="LAYOUT_SINGLE"
      description="공통 SP: common/data { PROCEDURE_NAME:'SP_UI_SA_SALES_DP', P_VIEW1:... }. Account=Google Maps + 리스트 · Item=pill 리스트 · ItemGrp=Chart.js stacked line.">

      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" sx={{ minHeight: 38 }}>
          <Tab label="DpTopSalesAccount (P_VIEW1=WI_DP_TOP_SALES_ACCOUNT)" sx={{ minHeight: 38 }} />
          <Tab label="DpTopSalesItem (P_VIEW1=WI_DP_TOP_SALES_ITEM)" sx={{ minHeight: 38 }} />
          <Tab label="DpTopSalesItemgrp (P_VIEW1=WI_DP_TOP_SALES_ITEMGRP)" sx={{ minHeight: 38 }} />
        </Tabs>
      </Box>

      {/* ───── DpTopSalesAccount ───── */}
      {tab === 0 && (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* 45% Map */}
          <Box sx={{ flex: '0 0 45%' }}><FakeGoogleMap /></Box>
          {/* 55% List */}
          <Box sx={{ flex: 1, p: 1.5, overflow: 'auto', backgroundColor: '#f5f5f5' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, mb: 1, display: 'block' }}>Top 8 Accounts (Currency: $)</Typography>
            <Stack spacing={0.5}>
              {ACCOUNT_DATA.map((d) => (
                <Paper key={d.rank} variant="outlined" sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 24 }}>#{d.rank}</Typography>
                  <Typography variant="body2" sx={{ flex: 1 }}>{d.CATEGORY2}</Typography>
                  <Chip size="small" label={`$${d.VALUE2.toLocaleString()}`} color="error" sx={{ height: 22, fontFamily: 'monospace', fontWeight: 700 }} />
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', minWidth: 50 }}>{d.VALUE4.toFixed(1)}%</Typography>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary', minWidth: 70, textAlign: 'right' }}>{d.VALUE1.toLocaleString()} MT</Typography>
                </Paper>
              ))}
            </Stack>
          </Box>
        </Box>
      )}

      {/* ───── DpTopSalesItem ───── */}
      {tab === 1 && (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* WidgetButton AMT/QTY */}
          <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 700 }}>WidgetContent — Top Items</Typography>
            <Box sx={{ flexGrow: 1 }} />
            <ToggleButtonGroup value={unit} exclusive onChange={(_, v) => v && setUnit(v)} size="small">
              <ToggleButton value="AMT">AMT</ToggleButton>
              <ToggleButton value="QTY">QTY</ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
            <Stack spacing={1}>
              {ITEM_DATA.map((d, i) => (
                <Box key={d.rank} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Typography variant="body1" sx={{ fontWeight: 700, minWidth: 30, color: i < 3 ? 'error.main' : 'text.primary' }}>{i + 1}.</Typography>
                  <Typography variant="body2" sx={{ flex: 1 }}>{d.CATEGORY2}</Typography>
                  <Chip
                    label={unit === 'AMT' ? `$${d.VALUE2.toLocaleString()}` : `${d.VALUE1.toLocaleString()} MT`}
                    sx={{
                      backgroundColor: PILL_COLORS[i] || '#9ca3af',
                      color: 'white', fontWeight: 700, fontFamily: 'monospace',
                      minWidth: 140, justifyContent: 'flex-end',
                    }}
                  />
                </Box>
              ))}
            </Stack>
          </Box>
        </Box>
      )}

      {/* ───── DpTopSalesItemgrp ───── */}
      {tab === 2 && (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 700 }}>ChartComponent (stacked line, fill:true)</Typography>
            <Box sx={{ flexGrow: 1 }} />
            {ITEMGRP_DATA.map((d) => (
              <Stack key={d.CATEGORY2} direction="row" alignItems="center" spacing={0.3}>
                <Box sx={{ width: 12, height: 8, backgroundColor: d.color, borderRadius: 0.5 }} />
                <Typography variant="caption" sx={{ fontSize: 10 }}>{d.CATEGORY2}</Typography>
              </Stack>
            ))}
          </Box>
          <Box sx={{ px: 1.5, py: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
            <ToggleButtonGroup value={unit} exclusive onChange={(_, v) => v && setUnit(v)} size="small">
              <ToggleButton value="AMT">AMT</ToggleButton>
              <ToggleButton value="QTY">QTY</ToggleButton>
            </ToggleButtonGroup>
            <Box sx={{ flexGrow: 1 }} />
            <ToggleButtonGroup value={period} exclusive onChange={(_, v) => v && setPeriod(v)} size="small">
              <ToggleButton value="W">W (DATE4)</ToggleButton>
              <ToggleButton value="M">M (DATE3)</ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <Box sx={{ flex: 1, p: 2 }}><StackedLineChart /></Box>
        </Box>
      )}
    </MockShell>
  );
}
