import React, { useState } from 'react';
import { Box, Stack, TextField, MenuItem, Button, Chip, Typography, Paper, Tabs, Tab,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import MockShell from '../../_shared/MockShell';

// RptKtng01 (Sell Out 예측 정확도), 02 (유통재고 정확도-판매), 03 (유통재고-재고),
// 04 (수요입력 현황), 05 (수요예측 정확도-전사), 06 (수요예측 정확도-6개월)

const KPI = [
  { label: 'Sell Out 정확도',      value: '82.4%', delta: '+1.2pp', target: 80, color: 'success' },
  { label: '유통재고 정확도',       value: '88.5%', delta: '+0.8pp', target: 85, color: 'primary' },
  { label: '수요예측 정확도 (전사)', value: '85.7%', delta: '+1.5pp', target: 85, color: 'success' },
  { label: '수요입력 완료율',       value: '94.2%', delta: '-2.1pp', target: 95, color: 'warning' },
];

const ROWS = [
  { ORG: '국내영업1팀', ITEM_LV2: '레드 시리즈', PLAN: 25800, ACTUAL: 24100, ACCURACY: 93.4, MAPE: 6.6, BIAS: -1700, TREND: '+', BAND: 'green' },
  { ORG: '국내영업1팀', ITEM_LV2: '블루 시리즈', PLAN: 18500, ACTUAL: 19200, ACCURACY: 96.3, MAPE: 3.8, BIAS:  +700, TREND: '+', BAND: 'green' },
  { ORG: '국내영업2팀', ITEM_LV2: '슬림 시리즈', PLAN: 12400, ACTUAL: 10800, ACCURACY: 87.1, MAPE: 12.9, BIAS: -1600, TREND: '-', BAND: 'yellow' },
  { ORG: 'NGP사업팀',  ITEM_LV2: 'illuvia',     PLAN:  8500, ACTUAL:  7200, ACCURACY: 84.7, MAPE: 15.3, BIAS: -1300, TREND: '-', BAND: 'yellow' },
  { ORG: 'NGP사업팀',  ITEM_LV2: 'NGP-STICK',   PLAN:  4200, ACTUAL:  3100, ACCURACY: 73.8, MAPE: 26.2, BIAS: -1100, TREND: '-', BAND: 'red' },
  { ORG: '글로벌영업팀',ITEM_LV2: '수출 KING',   PLAN: 32500, ACTUAL: 31800, ACCURACY: 97.8, MAPE: 2.2, BIAS:  -700, TREND: '0', BAND: 'green' },
  { ORG: '글로벌영업팀',ITEM_LV2: '수출 BLU',    PLAN: 14200, ACTUAL: 12500, ACCURACY: 88.0, MAPE: 12.0, BIAS: -1700, TREND: '-', BAND: 'yellow' },
];

const BAND_COLOR = { green: 'success', yellow: 'warning', red: 'error' };

const ACC_TAB_LABELS = ['Sell Out 정확도 (01)', '유통재고 판매 (02)', '유통재고 재고 (03)', '수요입력 현황 (04)', '수요예측 전사 (05)', '수요예측 6개월 (06)'];

export default function RptAccuracyMockup() {
  const [tab, setTab] = useState(0);
  return (
    <MockShell patternCode="ktng_rpt_accuracy" patternLabel="KTNG — 예측 정확도 리포트 (RptKtng01~06)"
      layoutCategory="LAYOUT_SINGLE" description="Sell Out / 유통재고 / 수요예측 / 수요입력 등 6개 KTNG 정확도 리포트 — 탭 전환 + 조직·품목군별 그리드.">
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <TextField label="기간" size="small" value="2026-05" sx={{ width: 130 }} />
          <TextField label="조직" size="small" select value="ALL" sx={{ width: 140 }}>
            <MenuItem value="ALL">전체</MenuItem><MenuItem value="domestic">국내</MenuItem><MenuItem value="global">GLOBAL</MenuItem>
          </TextField>
          <TextField label="품목 그룹" size="small" select value="ALL" sx={{ width: 140 }}>
            <MenuItem value="ALL">전체</MenuItem><MenuItem value="TC">담배</MenuItem><MenuItem value="NGP">NGP</MenuItem>
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
          <Button variant="outlined" size="small" startIcon={<DownloadIcon />}>Excel</Button>
        </Stack>
      </Box>

      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable">
          {ACC_TAB_LABELS.map((l) => <Tab key={l} label={l} />)}
        </Tabs>
      </Box>

      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5, flexGrow: 1, overflow: 'auto' }}>
        <Stack direction="row" spacing={1.5}>
          {KPI.map((k) => (
            <Paper key={k.label} variant="outlined" sx={{ p: 1.5, flex: 1 }}>
              <Typography variant="caption" color="text.secondary">{k.label}</Typography>
              <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mt: 0.5 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: `${k.color}.main` }}>{k.value}</Typography>
                <Typography variant="caption" color="text.secondary">목표 {k.target}%</Typography>
              </Stack>
              <Typography variant="caption" sx={{ color: k.delta.startsWith('-') ? 'error.main' : 'success.main', fontWeight: 600 }}>{k.delta} vs 전월</Typography>
            </Paper>
          ))}
        </Stack>

        <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 240 }}>
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>조직 · 품목군별 정확도 상세 — {ACC_TAB_LABELS[tab]}</Typography>
          </Box>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {['조직','품목군','계획','실적','정확도','MAPE','BIAS','추세','등급'].map((c) => (
                    <TableCell key={c} sx={{ backgroundColor: 'grey.100', fontWeight: 700,
                      textAlign: ['계획','실적','정확도','MAPE','BIAS'].includes(c) ? 'right' : (c === '추세' || c === '등급' ? 'center' : 'left') }}>{c}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {ROWS.map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell>{r.ORG}</TableCell>
                    <TableCell>{r.ITEM_LV2}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.PLAN.toLocaleString()}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.ACTUAL.toLocaleString()}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.ACCURACY.toFixed(1)}%</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.MAPE.toFixed(1)}%</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>
                      {r.BIAS > 0 ? '+' : ''}{r.BIAS.toLocaleString()}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace' }}>
                      {r.TREND === '+' ? '↑' : r.TREND === '-' ? '↓' : '→'}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Chip size="small" label={r.BAND === 'green' ? 'A' : r.BAND === 'yellow' ? 'B' : 'C'} color={BAND_COLOR[r.BAND]} />
                    </TableCell>
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
