import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography, Paper, Chip, Avatar,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import StorefrontIcon from '@mui/icons-material/Storefront';
import MockShell from '../../_shared/MockShell';
import { cellSx, deltaStatus } from '../../_shared/styleCallback';

// CJBO — 판매 실적 (DpSalesAct)
// UI_DP_SALES_ACT — 일자/주별 판매 실적 + 전년동기 비교 + 채널/거래처별 집계

const KPIS = [
  { label: '이번 달 실적', value: '142.5억', delta: '+8.2% YoY',  color: 'success' },
  { label: '누계 실적',    value: '821.3억', delta: '+5.7% YoY',  color: 'success' },
  { label: '온라인 비중',  value: '47.3%',   delta: '+3.1%p YoY', color: 'info'    },
  { label: '신규 거래처',  value: '12',      delta: '+5 vs 전월', color: 'highlight' },
];

const ROWS = [
  { CHANNEL: '온라인', CUST: '쿠팡',          ITEM_NM: 'illuvia 비건마스크 5매',   AMT: 12500, QTY:  2800, YOY:  +8.5 },
  { CHANNEL: '온라인', CUST: '네이버스토어', ITEM_NM: 'illuvia 토너 200ml',        AMT:  8200, QTY:  1850, YOY: +12.3 },
  { CHANNEL: '온라인', CUST: '11번가',        ITEM_NM: 'illuvia 크림 50g',          AMT:  6500, QTY:  1450, YOY:  +5.8 },
  { CHANNEL: '오프라인', CUST: '롯데마트',    ITEM_NM: 'illuvia 비건마스크 5매',   AMT: 18900, QTY:  4200, YOY:  +6.2 },
  { CHANNEL: '오프라인', CUST: '올리브영',    ITEM_NM: 'illuvia 토너 200ml',        AMT: 11200, QTY:  2530, YOY:  -2.1 },
  { CHANNEL: '오프라인', CUST: 'GS25',         ITEM_NM: 'illuvia 크림 50g',          AMT:  4800, QTY:  1080, YOY:  +1.5 },
  { CHANNEL: '수출',     CUST: '베트남 KGS',  ITEM_NM: 'CJ Brand Korea KING-RED',   AMT: 22400, QTY:  5500, YOY: -15.2 },
  { CHANNEL: '수출',     CUST: '인니 INDOMA', ITEM_NM: 'illuvia MASK',              AMT: 18500, QTY:  5090, YOY:  +3.7 },
  { CHANNEL: '수출',     CUST: '말레이 SCH',  ITEM_NM: 'NGP Device #01',             AMT:  3200, QTY:  1370, YOY: -28.5 },
];

function MiniBarChart() {
  const W = 800, H = 180, P = 30;
  const days = ['1일','5일','10일','15일','20일','25일','30일'];
  const sales = [4.2, 4.8, 5.5, 5.2, 4.9, 5.8, 6.1]; // 일별 실적 (억)
  const target = 5.0;
  const xStep = (W - P * 2) / days.length;
  const yMax = 8;
  const yScale = (v) => H - P - (v / yMax) * (H - P * 2);
  return (
    <Paper variant="outlined" sx={{ p: 1.5, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 220 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>일별 판매 실적 (단위: 억 KRW) — 2026-06</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Stack direction="row" spacing={1}>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Box sx={{ width: 12, height: 10, backgroundColor: '#3b82f6' }} />
            <Typography variant="caption">실적</Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Box sx={{ width: 12, height: 2, backgroundColor: '#ef4444' }} />
            <Typography variant="caption">목표</Typography>
          </Stack>
        </Stack>
      </Stack>
      <Box sx={{ flexGrow: 1, minHeight: 0 }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%' }}>
          {[0, 2, 4, 6, 8].map((y) => (
            <g key={y}>
              <line x1={P} y1={yScale(y)} x2={W - P} y2={yScale(y)} stroke="#e5e7eb" strokeWidth="0.5" />
              <text x={P - 5} y={yScale(y)} fill="#9ca3af" fontSize="10" textAnchor="end" dy="3">{y}</text>
            </g>
          ))}
          <line x1={P} y1={yScale(target)} x2={W - P} y2={yScale(target)} stroke="#ef4444" strokeWidth="1.5" strokeDasharray="5 3" />
          {sales.map((v, i) => {
            const x = P + xStep * i + xStep / 2 - 18;
            return (
              <g key={i}>
                <rect x={x} y={yScale(v)} width={36} height={yScale(0) - yScale(v)} fill={v >= target ? '#3b82f6' : '#fbbf24'} rx={2} />
                <text x={P + xStep * i + xStep / 2} y={H - 8} fill="#6b7280" fontSize="10" textAnchor="middle">{days[i]}</text>
                <text x={P + xStep * i + xStep / 2} y={yScale(v) - 4} fill="#1e293b" fontSize="10" textAnchor="middle" fontWeight="600">{v.toFixed(1)}</text>
              </g>
            );
          })}
        </svg>
      </Box>
    </Paper>
  );
}

export default function CjboDpSalesActMockup() {
  return (
    <MockShell patternCode="cjbo_dp_sales_act" patternLabel="CJBO — 판매 실적 (DpSalesAct)"
      layoutCategory="LAYOUT_SINGLE"
      description="채널 × 거래처 × 품목별 판매 실적 + 전년동기 (YoY) 비교 + 일별 추이. UI_DP_SALES_ACT.">
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="조회월" size="small" value="2026-06" sx={{ width: 130 }} />
          <TextField label="채널" size="small" select value="ALL" sx={{ width: 130 }}>
            <MenuItem value="ALL">전체</MenuItem><MenuItem value="ONLINE">온라인</MenuItem>
            <MenuItem value="OFFLINE">오프라인</MenuItem><MenuItem value="EXPORT">수출</MenuItem>
          </TextField>
          <TextField label="브랜드" size="small" select value="ALL" sx={{ width: 130 }}>
            <MenuItem value="ALL">전체</MenuItem><MenuItem value="illuvia">illuvia</MenuItem>
            <MenuItem value="CJBK">CJ Brand Korea</MenuItem>
          </TextField>
          <TextField label="거래처" size="small" value="" placeholder="[🔍]" sx={{ width: 160 }} />
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
          <Button variant="outlined" size="small" startIcon={<FileDownloadIcon />}>엑셀</Button>
        </Stack>
      </Box>

      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5, flexGrow: 1, overflow: 'auto' }}>
        <Stack direction="row" spacing={1.5}>
          {KPIS.map((k) => (
            <Paper key={k.label} variant="outlined" sx={{ p: 1.5, flex: 1 }}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Avatar sx={{ backgroundColor: `${k.color}.light`, color: `${k.color}.dark`, width: 40, height: 40 }}>
                  <StorefrontIcon />
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary">{k.label}</Typography>
                  <Stack direction="row" alignItems="baseline" spacing={0.5}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: `${k.color}.main` }}>{k.value}</Typography>
                  </Stack>
                  <Typography variant="caption" sx={{ color: k.delta.includes('+') ? 'success.main' : 'error.main', fontWeight: 600 }}>
                    {k.delta}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          ))}
        </Stack>

        <MiniBarChart />

        <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 220 }}>
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>거래처-품목별 실적</Typography>
          </Box>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {['채널','거래처','품목','금액 (만원)','수량','YoY (%)'].map((c) => (
                    <TableCell key={c} sx={{ backgroundColor: 'grey.100', fontWeight: 700,
                      textAlign: ['금액 (만원)','수량','YoY (%)'].includes(c) ? 'right' : (c === '채널' ? 'center' : 'left') }}>{c}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {ROWS.map((r, i) => {
                  const tone = deltaStatus(r.YOY);
                  return (
                    <TableRow key={i} hover>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Chip size="small" label={r.CHANNEL}
                          color={r.CHANNEL === '온라인' ? 'info' : r.CHANNEL === '수출' ? 'warning' : 'default'}
                          variant="outlined" />
                      </TableCell>
                      <TableCell>{r.CUST}</TableCell>
                      <TableCell>{r.ITEM_NM}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>{r.AMT.toLocaleString()}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.QTY.toLocaleString()}</TableCell>
                      <TableCell sx={cellSx(tone, { align: 'right', mono: true })}>{r.YOY > 0 ? `+${r.YOY.toFixed(1)}` : r.YOY.toFixed(1)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </MockShell>
  );
}
