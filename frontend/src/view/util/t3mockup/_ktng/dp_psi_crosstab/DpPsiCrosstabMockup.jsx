import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Typography, Paper, Chip, Tabs, Tab, Button, ButtonGroup, IconButton,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SaveIcon from '@mui/icons-material/Save';
import DownloadIcon from '@mui/icons-material/Download';
import PersonIcon from '@mui/icons-material/Person';
import MockShell from '../../_shared/MockShell';

// KTNG — DP 판매계획 PSI (4 segment)
//  Tab 1: UI_DP_KTNG_05 직수출 유통 O → DpKtng05.jsx
//  Tab 2: UI_DP_KTNG_06 직수출 유통 X → DpKtng06.jsx
//  Tab 3: UI_DP_KTNG_07 판매법인       → DpKtng07.jsx
//  Tab 4: UI_DP_KTNG_09 CC/NGP 내수    → DpKtng09.jsx
//
// 동일 BaseEntry-style PSI 크로스탭: dimensionItems(60 풀) + CATEGORY(Measure) + DATE iteration

const DATE_COLS = ['2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11', '2026-12'];

const TAB_DATA = {
  EXP_DIST_O: { // 직수출 유통 O
    menu: 'UI_DP_KTNG_05', label: '직수출 유통 O',
    dims: ['SALES_ORG', 'CNTRY', 'DIST_CHN', 'ITEM_NM'],
    rows: [
      { dims: ['수출본부', '대만',   'TKK Global',  'ESSE Asian'],     cat: 'SI_QTY',  vals: [4500, 4800, 5000, 5200, 5300, 5400, 5500] },
      { dims: ['수출본부', '대만',   'TKK Global',  'ESSE Asian'],     cat: 'SO_QTY',  vals: [4200, 4500, 4700, 4900, null, null, null], locked: true },
      { dims: ['수출본부', '일본',   'Nippon Dist.', 'THIS'],          cat: 'SI_QTY',  vals: [2800, 2900, 3000, 3100, 3200, 3300, 3400] },
      { dims: ['수출본부', '유럽',   'Heinemann',   'THE ONE'],        cat: 'SI_QTY',  vals: [1800, 1900, 2000, 2100, 2200, 2300, 2400] },
    ],
  },
  EXP_DIST_X: { // 직수출 유통 X (Duty Free 등)
    menu: 'UI_DP_KTNG_06', label: '직수출 유통 X',
    dims: ['SALES_ORG', 'CNTRY', 'CHANNEL', 'ITEM_NM'],
    rows: [
      { dims: ['수출본부', '미국',     'Duty Free', 'ESSE Asian'],      cat: 'SI_QTY',  vals: [3500, 3700, 4000, 4200, 4500, 4800, 5000] },
      { dims: ['수출본부', '미국',     'Duty Free', 'ESSE Asian'],      cat: 'SO_QTY',  vals: [3300, 3550, 3850, null, null, null, null], locked: true },
      { dims: ['수출본부', '독일',     'Heinemann EU','THE ONE'],       cat: 'SI_QTY',  vals: [1500, 1600, 1700, 1800, 1900, 2000, 2100] },
    ],
  },
  SALES_CORP: { // 판매법인
    menu: 'UI_DP_KTNG_07', label: '판매법인',
    dims: ['CORP', 'CNTRY', 'ACCOUNT', 'ITEM_NM'],
    rows: [
      { dims: ['KT&G USA',     '미국',     'USA Retail',     'ESSE Asian'], cat: 'SI_QTY',  vals: [2500, 2700, 2900, 3100, 3300, 3500, 3700] },
      { dims: ['KT&G USA',     '미국',     'USA Retail',     'ESSE Asian'], cat: 'SO_QTY',  vals: [2400, 2600, 2750, null, null, null, null], locked: true },
      { dims: ['KT&G RUSSIA',  '러시아',   'Moscow Dist.',   'TIME'],       cat: 'SI_QTY',  vals: [5500, 5800, 6000, 6200, 6500, 6800, 7000] },
      { dims: ['KT&G INDONESIA','인도네시아','Jakarta Dist.', 'LAISON'],     cat: 'SI_QTY',  vals: [3800, 4000, 4200, 4500, 4800, 5000, 5200] },
    ],
  },
  CC_NGP_DOM: { // CC/NGP 내수
    menu: 'UI_DP_KTNG_09', label: 'CC/NGP 내수',
    dims: ['CC_NGP', 'CHANNEL', 'BUYER', 'ITEM_NM'],
    rows: [
      { dims: ['CC',  '편의점', 'BGF리테일',  '에쎄 스페셜 골드 1mg'], cat: 'SI_QTY',  vals: [125000, 128000, 132000, 130000, 128000, 130000, 135000] },
      { dims: ['CC',  '편의점', 'BGF리테일',  '에쎄 스페셜 골드 1mg'], cat: 'SO_QTY',  vals: [118200, 121000, 125500, null,   null,   null,   null], locked: true },
      { dims: ['CC',  '편의점', 'GS리테일',   '에쎄 스페셜 골드 1mg'], cat: 'SI_QTY',  vals: [96800,  98000,  100000, 99000,  98000,  100000, 102000] },
      { dims: ['CC',  '슈퍼',   '이마트',     '디스 플러스'],          cat: 'SI_QTY',  vals: [32500,  33000,  34000,  33500,  33000,  34000,  35000] },
      { dims: ['NGP', '편의점', 'BGF리테일',  '릴 에이스 (스틱)'],     cat: 'SI_QTY',  vals: [85000,  90000,  95000,  100000, 105000, 110000, 115000] },
    ],
  },
};

const TAB_KEYS = ['EXP_DIST_O', 'EXP_DIST_X', 'SALES_CORP', 'CC_NGP_DOM'];

const fmtN = (n) => (n == null ? '-' : n.toLocaleString());

export default function KtngDpPsiCrosstabMockup() {
  const [tab, setTab] = React.useState(0);
  const data = TAB_DATA[TAB_KEYS[tab]];
  return (
    <MockShell
      patternCode="ktng_dp_psi_crosstab"
      patternLabel="KTNG — DP 판매계획 PSI (4 segment)"
      layoutCategory="LAYOUT_SINGLE"
      description="동일 BaseEntry PSI 크로스탭의 4 segment variant. 직수출 유통 O/X · 판매법인 · CC/NGP 내수. 그리드 컬럼: dimensionItems(60 풀 — segment 별 visible) + CATEGORY(Sell-In Qty/Sell-Out Qty) + DATE(iteration prefix=DATE_, 7개월). 셀 데이터는 KTNG 도메인 (CU/GS25/이마트 + 대만/미국/유럽/일본 수출 + KT&G USA/RUSSIA/INDONESIA 법인 + 릴 NGP)."
    >
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 1.5 }}>
        <Tabs value={tab} onChange={(_e, v) => setTab(v)}>
          {TAB_KEYS.map((k) => (
            <Tab key={k} label={
              <Stack direction="row" spacing={1} alignItems="center">
                <span>{TAB_DATA[k].label}</span>
                <Chip label={TAB_DATA[k].menu} size="small" variant="outlined" sx={{ height: 18, fontSize: 10, fontFamily: 'monospace' }} />
              </Stack>
            } />
          ))}
        </Tabs>
      </Box>

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
          <TextField label="ITEM" size="small" value="" placeholder="(level + attr + name)"
            InputProps={{ endAdornment: <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} /> }}
            sx={{ width: 200 }} />
          <TextField label="ACCOUNT" size="small" value="" placeholder="(level + attr + name)"
            InputProps={{ endAdornment: <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} /> }}
            sx={{ width: 200 }} />
          <TextField label="BUCKET" size="small" select value="MONTH" sx={{ width: 100 }}>
            <MenuItem value="MONTH">MONTH</MenuItem>
          </TextField>
        </Stack>
      </Box>

      <Box sx={{ px: 1.5, py: 0.7, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        <Button size="small" variant="outlined" startIcon={<DownloadIcon />}>Excel</Button>
        <ButtonGroup variant="outlined" size="small">
          <IconButton size="small" color="primary"><SaveIcon fontSize="small" /></IconButton>
        </ButtonGroup>
      </Box>

      <Box sx={{ p: 1.5, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Paper variant="outlined" sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {data.dims.map((d, j) => (
                    <TableCell key={d} sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, textAlign: 'center', width: j === 3 ? 200 : 130 }}>
                      {d}
                      <Typography component="span" sx={{ ml: 0.5, fontSize: 9, color: 'text.disabled', fontFamily: 'monospace' }}>(DIMENSION_0{j + 1})</Typography>
                    </TableCell>
                  ))}
                  <TableCell sx={{ bgcolor: '#fffbe6', fontWeight: 700, fontSize: 11, width: 100, textAlign: 'center' }}>CATEGORY</TableCell>
                  {DATE_COLS.map((d) => (
                    <TableCell key={d} sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, width: 85, textAlign: 'right', fontFamily: 'monospace' }}>{d.slice(2)}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.rows.map((r, i) => (
                  <TableRow key={i} hover sx={{ bgcolor: r.locked ? '#fafafa' : 'transparent' }}>
                    {r.dims.map((v, j) => (
                      <TableCell key={j} sx={{ fontSize: 11, textAlign: j === 3 ? 'left' : 'center' }}>{v}</TableCell>
                    ))}
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 600, textAlign: 'center', color: r.cat === 'SI_QTY' ? '#1565c0' : '#6b7280' }}>{r.cat}</TableCell>
                    {r.vals.map((v, j) => (
                      <TableCell key={j} sx={{
                        fontSize: 11, fontFamily: 'monospace', textAlign: 'right',
                        color: v == null ? '#d1d5db' : r.locked ? '#6b7280' : '#374151',
                        fontWeight: r.cat === 'SI_QTY' ? 600 : 400,
                        bgcolor: r.locked ? '#f3f4f6' : 'transparent',
                      }}>{fmtN(v)}</TableCell>
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
