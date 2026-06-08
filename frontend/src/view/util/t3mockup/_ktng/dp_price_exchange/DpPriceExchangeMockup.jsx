import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Typography, Paper, Chip, Tabs, Tab, ButtonGroup, IconButton, Button,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import DownloadIcon from '@mui/icons-material/Download';
import MockShell from '../../_shared/MockShell';

// KTNG — DP 판가 / 환율
//  Tab 1: UI_DP_KTNG_02 판가 관리 → DpKtng02.jsx
//  Tab 2: UI_DP_KTNG_19 환율      → DpKtng19.jsx

const PRICE_ROWS = [
  { BASE_YM: '2026-06', SALES_CNTRY: '한국',   CURCY_CD: 'KRW', ITEM_CD: 'ITM-ESSE-001', ITEM_NM: '에쎄 스페셜 골드 1mg', NET_UTPIC: 4500,  PRICE_TP: 'NET',  USE_YN: 'Y' },
  { BASE_YM: '2026-06', SALES_CNTRY: '한국',   CURCY_CD: 'KRW', ITEM_CD: 'ITM-DIS-001',  ITEM_NM: '디스 플러스',          NET_UTPIC: 4500,  PRICE_TP: 'NET',  USE_YN: 'Y' },
  { BASE_YM: '2026-06', SALES_CNTRY: '한국',   CURCY_CD: 'KRW', ITEM_CD: 'ITM-1MG-001',  ITEM_NM: '더원 오렌지 1mg',      NET_UTPIC: 5000,  PRICE_TP: 'NET',  USE_YN: 'Y' },
  { BASE_YM: '2026-06', SALES_CNTRY: '대만',   CURCY_CD: 'TWD', ITEM_CD: 'ITM-ESSE-INTL', ITEM_NM: 'ESSE Asian',           NET_UTPIC: 95.5,  PRICE_TP: 'NET',  USE_YN: 'Y' },
  { BASE_YM: '2026-06', SALES_CNTRY: '미국',   CURCY_CD: 'USD', ITEM_CD: 'ITM-ESSE-INTL', ITEM_NM: 'ESSE Asian',           NET_UTPIC: 3.20,  PRICE_TP: 'NET',  USE_YN: 'Y' },
  { BASE_YM: '2026-06', SALES_CNTRY: '러시아', CURCY_CD: 'RUB', ITEM_CD: 'ITM-TIME-INTL', ITEM_NM: 'TIME',                  NET_UTPIC: 185.0, PRICE_TP: 'NET',  USE_YN: 'Y' },
];

const FX_ROWS = [
  { BASE_YM: '2026-06', FROM_CURCY: 'USD', TO_CURCY: 'KRW', RATE: 1383.50, FX_TP: 'AVG',   SOURCE: 'KEB' },
  { BASE_YM: '2026-06', FROM_CURCY: 'EUR', TO_CURCY: 'KRW', RATE: 1502.20, FX_TP: 'AVG',   SOURCE: 'KEB' },
  { BASE_YM: '2026-06', FROM_CURCY: 'JPY', TO_CURCY: 'KRW', RATE: 8.85,    FX_TP: 'AVG',   SOURCE: 'KEB' },
  { BASE_YM: '2026-06', FROM_CURCY: 'TWD', TO_CURCY: 'KRW', RATE: 42.85,   FX_TP: 'AVG',   SOURCE: 'KEB' },
  { BASE_YM: '2026-06', FROM_CURCY: 'RUB', TO_CURCY: 'KRW', RATE: 15.75,   FX_TP: 'AVG',   SOURCE: 'KEB' },
  { BASE_YM: '2026-06', FROM_CURCY: 'KZT', TO_CURCY: 'KRW', RATE: 3.05,    FX_TP: 'AVG',   SOURCE: 'KEB' },
  { BASE_YM: '2026-06', FROM_CURCY: 'IDR', TO_CURCY: 'KRW', RATE: 0.0849,  FX_TP: 'AVG',   SOURCE: 'KEB' },
];

export default function KtngDpPriceExchangeMockup() {
  const [tab, setTab] = React.useState(0);
  return (
    <MockShell
      patternCode="ktng_dp_price_exchange"
      patternLabel="KTNG — DP 판가 / 환율"
      layoutCategory="LAYOUT_SINGLE"
      description="UI_DP_KTNG_02 판가 관리 + UI_DP_KTNG_19 환율 — 2개 마스터 묶음. 판가: 기준월×판매국×품목×NET_UTPIC. 환율: 기준월×FROM/TO 통화×AVG_RATE×SOURCE."
    >
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 1.5 }}>
        <Tabs value={tab} onChange={(_e, v) => setTab(v)}>
          <Tab label={<Stack direction="row" spacing={1} alignItems="center"><span>판가 관리</span><Chip label="UI_DP_KTNG_02" size="small" variant="outlined" sx={{ height: 18, fontSize: 10, fontFamily: 'monospace' }} /></Stack>} />
          <Tab label={<Stack direction="row" spacing={1} alignItems="center"><span>환율</span><Chip label="UI_DP_KTNG_19" size="small" variant="outlined" sx={{ height: 18, fontSize: 10, fontFamily: 'monospace' }} /></Stack>} />
        </Tabs>
      </Box>

      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="BASE_YM" size="small" select value="2026-06" sx={{ width: 130 }}>
            <MenuItem value="2026-06">2026-06</MenuItem>
          </TextField>
          {tab === 0 ? (
            <>
              <TextField label="SALES_CNTRY" size="small" select value="ALL" sx={{ width: 160 }}>
                <MenuItem value="ALL">전체</MenuItem>
              </TextField>
              <TextField label="ITEM" size="small" value="" placeholder="품목 검색"
                InputProps={{ endAdornment: <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} /> }}
                sx={{ width: 220 }} />
            </>
          ) : (
            <>
              <TextField label="FROM_CURCY" size="small" select value="ALL" sx={{ width: 130 }}>
                <MenuItem value="ALL">전체</MenuItem>
              </TextField>
              <TextField label="TO_CURCY" size="small" select value="KRW" sx={{ width: 130 }}>
                <MenuItem value="KRW">KRW</MenuItem>
              </TextField>
            </>
          )}
        </Stack>
      </Box>

      <Box sx={{ px: 1.5, py: 0.7, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        <Button size="small" variant="outlined" startIcon={<DownloadIcon />}>Excel</Button>
        <ButtonGroup variant="outlined" size="small">
          <IconButton size="small"><AddIcon fontSize="small" /></IconButton>
          <IconButton size="small"><DeleteIcon fontSize="small" /></IconButton>
          <IconButton size="small" color="primary"><SaveIcon fontSize="small" /></IconButton>
        </ButtonGroup>
      </Box>

      <Box sx={{ p: 1.5, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Paper variant="outlined" sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              {tab === 0 ? (
                <>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, fontFamily: 'monospace' }}>BASE_YM</TableCell>
                      <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12 }}>SALES_CNTRY</TableCell>
                      <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, fontFamily: 'monospace' }}>CURCY</TableCell>
                      <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, fontFamily: 'monospace' }}>ITEM_CD</TableCell>
                      <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12 }}>ITEM_NM</TableCell>
                      <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, textAlign: 'right' }}>NET_UTPIC</TableCell>
                      <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, textAlign: 'center' }}>PRICE_TP</TableCell>
                      <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, textAlign: 'center' }}>USE_YN</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {PRICE_ROWS.map((r, i) => (
                      <TableRow key={i} hover>
                        <TableCell sx={{ fontSize: 12, fontFamily: 'monospace' }}>{r.BASE_YM}</TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{r.SALES_CNTRY}</TableCell>
                        <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', textAlign: 'center' }}>{r.CURCY_CD}</TableCell>
                        <TableCell sx={{ fontSize: 12, fontFamily: 'monospace' }}>{r.ITEM_CD}</TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{r.ITEM_NM}</TableCell>
                        <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', textAlign: 'right', fontWeight: 600 }}>{r.NET_UTPIC.toLocaleString()}</TableCell>
                        <TableCell sx={{ fontSize: 12, textAlign: 'center' }}><Chip label={r.PRICE_TP} size="small" variant="outlined" sx={{ height: 18, fontSize: 10 }} /></TableCell>
                        <TableCell sx={{ fontSize: 12, textAlign: 'center', color: '#10b981', fontWeight: 600 }}>{r.USE_YN}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </>
              ) : (
                <>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, fontFamily: 'monospace' }}>BASE_YM</TableCell>
                      <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, fontFamily: 'monospace', textAlign: 'center' }}>FROM_CURCY</TableCell>
                      <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, fontFamily: 'monospace', textAlign: 'center' }}>TO_CURCY</TableCell>
                      <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, textAlign: 'right' }}>RATE</TableCell>
                      <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, textAlign: 'center' }}>FX_TP</TableCell>
                      <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12 }}>SOURCE</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {FX_ROWS.map((r, i) => (
                      <TableRow key={i} hover>
                        <TableCell sx={{ fontSize: 12, fontFamily: 'monospace' }}>{r.BASE_YM}</TableCell>
                        <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', textAlign: 'center', fontWeight: 600 }}>{r.FROM_CURCY}</TableCell>
                        <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', textAlign: 'center', fontWeight: 600 }}>{r.TO_CURCY}</TableCell>
                        <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', textAlign: 'right', fontWeight: 600 }}>{r.RATE.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell sx={{ fontSize: 12, textAlign: 'center' }}><Chip label={r.FX_TP} size="small" variant="outlined" sx={{ height: 18, fontSize: 10 }} /></TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{r.SOURCE}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </>
              )}
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </MockShell>
  );
}
