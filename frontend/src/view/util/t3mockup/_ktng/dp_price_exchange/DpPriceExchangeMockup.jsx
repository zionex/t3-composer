import React, { useState } from 'react';
import { Box, Stack, TextField, MenuItem, Button, Chip, Tabs, Tab,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Paper, Checkbox } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import MockShell from '../../_shared/MockShell';

// DpKtng02 (판가 관리), DpKtng19 (환율) — 단순 마스터 그리드 with tabs

const PRICE_ROWS = [
  { ITEM_LV3_CD: 'KING-RED', ITEM_NM: '레드 시리즈', SALES_ORG: 'KT&G', CHANNEL: '편의점', START_DT: '2026-05-01', END_DT: '2026-12-31', PRICE: 4500, CURR: 'KRW', status: 'normal' },
  { ITEM_LV3_CD: 'KING-BLU', ITEM_NM: '블루 시리즈', SALES_ORG: 'KT&G', CHANNEL: '편의점', START_DT: '2026-05-01', END_DT: '2026-12-31', PRICE: 4500, CURR: 'KRW', status: 'normal' },
  { ITEM_LV3_CD: 'NGP-DEV',  ITEM_NM: 'illuvia DEV', SALES_ORG: 'KT&G', CHANNEL: '온라인', START_DT: '2026-06-01', END_DT: '2026-12-31', PRICE: 35000,CURR: 'KRW', status: 'info' },
  { ITEM_LV3_CD: 'EXPORT-K', ITEM_NM: '수출 KING',   SALES_ORG: 'GLOBAL', CHANNEL: '인도',  START_DT: '2026-04-01', END_DT: '2026-12-31', PRICE:  2.85, CURR: 'USD', status: 'normal' },
  { ITEM_LV3_CD: 'EXPORT-K', ITEM_NM: '수출 KING',   SALES_ORG: 'GLOBAL', CHANNEL: '몽골',  START_DT: '2026-04-01', END_DT: '2026-12-31', PRICE:  2.95, CURR: 'USD', status: 'normal' },
];

const FX_ROWS = [
  { CURR: 'USD', PERIOD: '2026-05', RATE: 1342.50, RATE_PREV: 1338.20, DIFF: '+0.32%' },
  { CURR: 'EUR', PERIOD: '2026-05', RATE: 1465.80, RATE_PREV: 1455.10, DIFF: '+0.74%' },
  { CURR: 'JPY', PERIOD: '2026-05', RATE:    9.15, RATE_PREV:    9.05, DIFF: '+1.10%' },
  { CURR: 'CNY', PERIOD: '2026-05', RATE:  185.30, RATE_PREV:  183.50, DIFF: '+0.98%' },
  { CURR: 'IDR', PERIOD: '2026-05', RATE:    0.085,RATE_PREV:    0.087,DIFF: '-2.30%' },
  { CURR: 'MNT', PERIOD: '2026-05', RATE:    0.385,RATE_PREV:    0.392,DIFF: '-1.79%' },
];

export default function DpPriceExchangeMockup() {
  const [tab, setTab] = useState(0);
  return (
    <MockShell patternCode="ktng_dp_price_exchange" patternLabel="KTNG — 판가 / 환율 관리 (DpKtng02/19)"
      layoutCategory="LAYOUT_SINGLE" description="판가 마스터 + 환율 마스터 — 탭으로 전환. 기간·통화·거래처 채널별 단가 관리.">
      {/* Search */}
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <TextField label="적용 연월" size="small" value="2026-05" sx={{ width: 130 }} />
          <TextField label="법인" size="small" select value="ALL" sx={{ width: 130 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="KT&G">국내</MenuItem>
            <MenuItem value="GLOBAL">GLOBAL</MenuItem>
          </TextField>
          <TextField label="통화" size="small" select value="ALL" sx={{ width: 100 }}>
            <MenuItem value="ALL">전체</MenuItem><MenuItem value="KRW">KRW</MenuItem><MenuItem value="USD">USD</MenuItem>
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
        </Stack>
      </Box>

      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="판가 (DpKtng02)" />
          <Tab label="환율 (DpKtng19)" />
        </Tabs>
        <Box sx={{ flexGrow: 1 }} />
        <Stack direction="row" spacing={0.75} sx={{ pr: 1 }}>
          <Button size="small" startIcon={<AddIcon />}>추가</Button>
          <Button size="small" startIcon={<DeleteOutlineIcon />} color="error">삭제</Button>
          <Button size="small" startIcon={<SaveIcon />} color="primary" variant="contained">저장</Button>
        </Stack>
      </Box>

      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 1 }}>
        {/* Price grid */}
        {tab === 0 && (
        <TableContainer component={Paper} variant="outlined" sx={{ mb: 1.5 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" sx={{ backgroundColor: 'grey.100' }}><Checkbox size="small" disabled /></TableCell>
                {['ITEM_LV3_CD','ITEM_NM','SALES_ORG','CHANNEL','START_DT','END_DT','PRICE','CURR'].map((c) => (
                  <TableCell key={c} sx={{ backgroundColor: 'grey.100', fontWeight: 700, textAlign: c === 'PRICE' ? 'right' : (c === 'CURR' ? 'center' : 'left') }}>{c}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {PRICE_ROWS.map((r, i) => (
                <TableRow key={i} hover>
                  <TableCell padding="checkbox"><Checkbox size="small" disabled /></TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{r.ITEM_LV3_CD}</TableCell>
                  <TableCell>{r.ITEM_NM}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{r.SALES_ORG}</TableCell>
                  <TableCell>{r.CHANNEL}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{r.START_DT}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{r.END_DT}</TableCell>
                  <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>{r.PRICE.toLocaleString()}</TableCell>
                  <TableCell sx={{ textAlign: 'center' }}><Chip size="small" label={r.CURR} variant="outlined" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        )}

        {/* FX — tab 0: 참고 / tab 1: 메인 */}
        <Paper variant="outlined">
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', fontWeight: 700, fontSize: 13 }}>{tab === 1 ? '환율 (DpKtng19)' : '참고 — 환율 (DpKtng19) 미리보기'}</Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {['통화','적용월','환율 (vs KRW)','전월 환율','전월대비'].map((c) => (
                    <TableCell key={c} sx={{ backgroundColor: 'grey.50', fontWeight: 700, fontSize: 12 }}>{c}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {FX_ROWS.map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell><Chip size="small" label={r.CURR} /></TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{r.PERIOD}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{r.RATE}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>{r.RATE_PREV}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.DIFF}</TableCell>
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
