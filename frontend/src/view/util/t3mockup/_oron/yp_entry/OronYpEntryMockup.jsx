import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography, Paper, Chip, Tabs, Tab,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SaveIcon from '@mui/icons-material/Save';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import MockShell from '../../_shared/MockShell';
import { cellSx } from '../../_shared/styleCallback';

// OronYp02 — 연간계획 입력 (마케팅/영업/원료감자) + 비교
// UI_YP_ORN_MKT_YP_PLAN, SALES_MAN_PLAN, PTT_REQ_PLAN, BP_95, BP_95_CHART, BP_96, BP_96_CHART, YP_PLAN_COMPARE

const TABS = [
  { key: 'mkt',   label: '마케팅 연간계획' },
  { key: 'sales', label: '영업팀 연간계획' },
  { key: 'ptt',   label: '원료감자 계획' },
  { key: 'cmp',   label: '연간계획 비교' },
];

const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

const ENTRY_ROWS = [
  { BRAND: 'ORON', ITEM_LV3: 'MASK',  vals: [180, 165, 195, 210, 225, 240, 255, 250, 235, 220, 210, 230] },
  { BRAND: 'ORON', ITEM_LV3: 'SERUM', vals: [85,  82,  90,  95,  100, 105, 110, 108, 102, 98,  95,  102] },
  { BRAND: 'ORON', ITEM_LV3: 'TONER', vals: [60,  58,  62,  65,  68,  70,  72,  71,  68,  65,  63,  68 ] },
  { BRAND: 'ORON', ITEM_LV3: 'CLEAN', vals: [110, 105, 115, 118, 120, 122, 125, 124, 120, 116, 113, 120] },
  { BRAND: 'OEM',  ITEM_LV3: 'SUN',   vals: [150, 140, 180, 220, 280, 350, 380, 360, 280, 200, 160, 150] },
];

const COMPARE_ROWS = [
  { BRAND: 'ORON', ITEM_LV3: 'MASK',  Y2026: 2280, Y2027: 2615, GROWTH: 14.7, TGT: 2600, GAP: 15 },
  { BRAND: 'ORON', ITEM_LV3: 'SERUM', Y2026: 1080, Y2027: 1167, GROWTH:  8.1, TGT: 1200, GAP: -33 },
  { BRAND: 'ORON', ITEM_LV3: 'TONER', Y2026: 745,  Y2027: 790,  GROWTH:  6.0, TGT: 800,  GAP: -10 },
  { BRAND: 'ORON', ITEM_LV3: 'CLEAN', Y2026: 1380, Y2027: 1418, GROWTH:  2.8, TGT: 1450, GAP: -32 },
  { BRAND: 'OEM',  ITEM_LV3: 'SUN',   Y2026: 2450, Y2027: 2850, GROWTH: 16.3, TGT: 2800, GAP: 50 },
];

export default function OronYpEntryMockup() {
  const [tab, setTab] = React.useState(0);
  return (
    <MockShell
      patternCode="oron_yp_entry"
      patternLabel="ORON — 연간계획 입력 (마케팅/영업/원료) + 비교"
      layoutCategory="LAYOUT_V2"
      description="브랜드×Lvl3 12개월 크로스탭 입력 (마케팅/영업팀/원료감자) + 전년 대비 성장률/목표 비교. UI_YP_ORN_MKT_YP_PLAN, SALES_MAN_PLAN, PTT_REQ_PLAN, BP_95~96, YP_PLAN_COMPARE."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="계획연도" size="small" select value="2027" sx={{ width: 120 }}>
            <MenuItem value="2027">2027년</MenuItem>
          </TextField>
          <TextField label="버전" size="small" value="YP_2027_DRAFT_03" sx={{ width: 170 }} />
          <TextField label="브랜드" size="small" select value="ALL" sx={{ width: 120 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="ORON">ORON</MenuItem>
            <MenuItem value="OEM">OEM</MenuItem>
          </TextField>
          <TextField label="단위" size="small" select value="K_EA" sx={{ width: 120 }}>
            <MenuItem value="K_EA">천 EA</MenuItem>
            <MenuItem value="KRW">매출(억)</MenuItem>
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="outlined" size="small" startIcon={<CompareArrowsIcon />}>전년 비교</Button>
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
          <Button variant="contained" size="small" color="success" startIcon={<SaveIcon />}>저장</Button>
        </Stack>
      </Box>

      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 1.5 }}>
        <Tabs value={tab} onChange={(_e, v) => setTab(v)}>
          {TABS.map((t) => <Tab key={t.key} label={t.label} />)}
        </Tabs>
      </Box>

      <Box sx={{ p: 1.5, height: '100%' }}>
        {tab === 3 ? (
          <Paper variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>연간계획 비교 — 2026 vs 2027 (목표 대비)</Typography>
            </Box>
            <TableContainer sx={{ flex: 1 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 120, textAlign: 'center' }}>브랜드</TableCell>
                    <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 120, textAlign: 'center' }}>Lvl3</TableCell>
                    <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 130, textAlign: 'right' }}>2026 (천 EA)</TableCell>
                    <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 130, textAlign: 'right' }}>2027 (천 EA)</TableCell>
                    <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 130, textAlign: 'right' }}>성장률</TableCell>
                    <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 130, textAlign: 'right' }}>목표</TableCell>
                    <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 130, textAlign: 'right' }}>목표 GAP</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {COMPARE_ROWS.map((r, i) => (
                    <TableRow key={i} hover>
                      <TableCell sx={cellSx('info', { align: 'center', mono: true })}>{r.BRAND}</TableCell>
                      <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace' }}>{r.ITEM_LV3}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', color: '#6b7280' }}>{r.Y2026.toLocaleString()}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{r.Y2027.toLocaleString()}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: r.GROWTH >= 10 ? '#10b981' : r.GROWTH >= 5 ? '#1565c0' : '#e65100' }}>
                        +{r.GROWTH.toFixed(1)}%
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.TGT.toLocaleString()}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: r.GAP >= 0 ? '#10b981' : '#c62828', bgcolor: r.GAP >= 0 ? '#e8f5e9' : '#ffebee' }}>
                        {r.GAP > 0 ? `+${r.GAP}` : r.GAP}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        ) : (
          <Paper variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{TABS[tab].label} 입력 — 브랜드×Lvl3 × 12개월 (천 EA)</Typography>
            </Box>
            <TableContainer sx={{ flex: 1 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 100, textAlign: 'center' }}>브랜드</TableCell>
                    <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 100, textAlign: 'center' }}>Lvl3</TableCell>
                    {MONTHS.map((m) => (
                      <TableCell key={m} sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 65, textAlign: 'right' }}>{m}</TableCell>
                    ))}
                    <TableCell sx={{ backgroundColor: 'grey.200', fontWeight: 700, width: 80, textAlign: 'right' }}>합계</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ENTRY_ROWS.map((r, i) => {
                    const total = r.vals.reduce((a, b) => a + b, 0);
                    return (
                      <TableRow key={i} hover>
                        <TableCell sx={cellSx('info', { align: 'center', mono: true })}>{r.BRAND}</TableCell>
                        <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace' }}>{r.ITEM_LV3}</TableCell>
                        {r.vals.map((v, j) => (
                          <TableCell key={j} sx={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 11 }}>{v}</TableCell>
                        ))}
                        <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, bgcolor: '#f3f4f6' }}>{total.toLocaleString()}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
      </Box>
    </MockShell>
  );
}
