import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Typography, Paper, Chip, Button, ButtonGroup, IconButton,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import MockShell from '../../_shared/MockShell';

// KTNG — DP 판매 실적 / 재고 Upload
// UI_DP_KTNG_01 → DpKtng01.jsx
//   SearchArea: R_BASE_YM(yearMonth), R_TYPE, SALES_ORG, ACCOUNT(popup), ITEM(popup)
//   좌측 버튼: Excel Export(grid2), Excel Import(grid1, preProcessData)
//   우측 버튼: [CREATE_DP_HIERARCHY_INFO] + Add/Delete/Save
//   Grid: BASE_YM + R_TYPE(CD/NM) + SALES_ORG(CD/NM) + ACCOUNT(CD/NM, action btn) + ITEM(CD/NM, action btn) + QTY_PCS + ITEM_LV1~4_NM + audit

const ROWS = [
  { BASE_YM: '2026-06', R_TYPE_CD: 'SELL_IN',  R_TYPE_NM: '판매실적 (Sell-In)',  SALES_ORG_CD: 'SO-KR-DOM', SALES_ORG_NM: '국내영업본부', ACCOUNT_CD: 'BGF-001',  ACCOUNT_NM: 'CU',           ITEM_CD: 'ITM-ESSE-001', ITEM_NM: '에쎄 스페셜 골드 1mg', QTY: 125000.000, LV1: '담배', LV2: '저타르', LV3: '에쎄', LV4: '스페셜 골드' },
  { BASE_YM: '2026-06', R_TYPE_CD: 'SELL_IN',  R_TYPE_NM: '판매실적 (Sell-In)',  SALES_ORG_CD: 'SO-KR-DOM', SALES_ORG_NM: '국내영업본부', ACCOUNT_CD: 'GS25-001', ACCOUNT_NM: 'GS25',         ITEM_CD: 'ITM-ESSE-001', ITEM_NM: '에쎄 스페셜 골드 1mg', QTY: 96800.000,  LV1: '담배', LV2: '저타르', LV3: '에쎄', LV4: '스페셜 골드' },
  { BASE_YM: '2026-06', R_TYPE_CD: 'SELL_OUT', R_TYPE_NM: '판매실적 (Sell-Out)', SALES_ORG_CD: 'SO-KR-DOM', SALES_ORG_NM: '국내영업본부', ACCOUNT_CD: 'BGF-001',  ACCOUNT_NM: 'CU',           ITEM_CD: 'ITM-ESSE-001', ITEM_NM: '에쎄 스페셜 골드 1mg', QTY: 118200.000, LV1: '담배', LV2: '저타르', LV3: '에쎄', LV4: '스페셜 골드' },
  { BASE_YM: '2026-06', R_TYPE_CD: 'STOCK',    R_TYPE_NM: '재고',                SALES_ORG_CD: 'SO-KR-DOM', SALES_ORG_NM: '국내영업본부', ACCOUNT_CD: 'BGF-001',  ACCOUNT_NM: 'CU',           ITEM_CD: 'ITM-ESSE-001', ITEM_NM: '에쎄 스페셜 골드 1mg', QTY: 8500.000,   LV1: '담배', LV2: '저타르', LV3: '에쎄', LV4: '스페셜 골드' },
  { BASE_YM: '2026-06', R_TYPE_CD: 'SELL_IN',  R_TYPE_NM: '판매실적 (Sell-In)',  SALES_ORG_CD: 'SO-KR-DOM', SALES_ORG_NM: '국내영업본부', ACCOUNT_CD: 'EMT-001',  ACCOUNT_NM: '이마트',       ITEM_CD: 'ITM-DIS-001',  ITEM_NM: '디스 플러스',          QTY: 32500.000,  LV1: '담배', LV2: '프리미엄', LV3: '디스', LV4: '디스 플러스' },
  { BASE_YM: '2026-06', R_TYPE_CD: 'SELL_IN',  R_TYPE_NM: '판매실적 (Sell-In)',  SALES_ORG_CD: 'SO-EXP',    SALES_ORG_NM: '수출본부',     ACCOUNT_CD: 'US-001',   ACCOUNT_NM: 'USA Duty Free', ITEM_CD: 'ITM-ESSE-INTL', ITEM_NM: 'ESSE Asian',          QTY: 42500.000,  LV1: 'CIGAR', LV2: 'LOW_TAR', LV3: 'ESSE', LV4: 'Asian' },
];

const TYPE_COLOR = { SELL_IN: '#1565c0', SELL_OUT: '#10b981', STOCK: '#f59e0b' };
const totalQty = ROWS.reduce((s, r) => s + r.QTY, 0);

export default function KtngDpUploadMockup() {
  return (
    <MockShell
      patternCode="ktng_dp_upload"
      patternLabel="KTNG — DP 판매 실적 / 재고 Upload"
      layoutCategory="LAYOUT_SINGLE"
      description="UI_DP_KTNG_01 → DpKtng01.jsx. SearchArea (R_BASE_YM yearMonth · R_TYPE · SALES_ORG · ACCOUNT popup · ITEM popup) + 좌측 Excel Export/Import(preProcessData) + 우측 [CREATE_DP_HIERARCHY_INFO]/Add/Delete/Save + 그리드 (R_TYPE=Sell-In/Sell-Out/Stock × SALES_ORG × ACCOUNT × ITEM × QTY_PCS · footer:sum + ITEM_LV1~4_NM + audit). 셀 데이터는 KTNG 도메인 (에쎄/디스 + CU/GS25/이마트/USA Duty Free)."
    >
      {/* SearchArea */}
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="R_BASE_YM" size="small" select value="2026-06" sx={{ width: 130 }}>
            <MenuItem value="2026-06">2026-06</MenuItem>
          </TextField>
          <TextField label="R_TYPE" size="small" select value="ALL" sx={{ width: 180 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="SELL_IN">Sell-In</MenuItem>
            <MenuItem value="SELL_OUT">Sell-Out</MenuItem>
            <MenuItem value="STOCK">재고</MenuItem>
          </TextField>
          <TextField label="SALES_ORG" size="small" select value="ALL" sx={{ width: 160 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="SO-KR-DOM">국내영업본부</MenuItem>
            <MenuItem value="SO-EXP">수출본부</MenuItem>
          </TextField>
          <TextField label="ACCOUNT" size="small" value="" placeholder="거래처 검색"
            InputProps={{ endAdornment: <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} /> }}
            sx={{ width: 180 }} />
          <TextField label="ITEM" size="small" value="" placeholder="품목 검색"
            InputProps={{ endAdornment: <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} /> }}
            sx={{ width: 180 }} />
        </Stack>
      </Box>

      {/* ButtonArea */}
      <Box sx={{ px: 1.5, py: 0.7, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
        <ButtonGroup variant="outlined" size="small">
          <IconButton size="small" title="Excel Export"><DownloadIcon fontSize="small" /></IconButton>
          <IconButton size="small" title="Excel Import (preProcessData)" color="primary"><UploadIcon fontSize="small" /></IconButton>
        </ButtonGroup>
        <Box sx={{ flexGrow: 1 }} />
        <Button size="small" variant="outlined" startIcon={<AccountTreeIcon />}>CREATE_DP_HIERARCHY_INFO</Button>
        <ButtonGroup variant="outlined" size="small">
          <IconButton size="small"><AddIcon fontSize="small" /></IconButton>
          <IconButton size="small"><DeleteIcon fontSize="small" /></IconButton>
          <IconButton size="small" color="primary"><SaveIcon fontSize="small" /></IconButton>
        </ButtonGroup>
      </Box>

      {/* Grid */}
      <Box sx={{ p: 1.5, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Paper variant="outlined" sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, textAlign: 'center', width: 90 }}>BASE_YM</TableCell>
                  <TableCell sx={{ bgcolor: '#dbeafe', fontWeight: 700, fontSize: 11, textAlign: 'center' }} colSpan={2}>R_TYPE</TableCell>
                  <TableCell sx={{ bgcolor: '#dcfce7', fontWeight: 700, fontSize: 11, textAlign: 'center' }} colSpan={2}>SALES_ORG</TableCell>
                  <TableCell sx={{ bgcolor: '#fef3c7', fontWeight: 700, fontSize: 11, textAlign: 'center' }} colSpan={2}>ACCOUNT</TableCell>
                  <TableCell sx={{ bgcolor: '#fce7f3', fontWeight: 700, fontSize: 11, textAlign: 'center' }} colSpan={2}>ITEM</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, textAlign: 'right', width: 110 }}>QTY_PCS</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, textAlign: 'center' }} colSpan={4}>ITEM 계층</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ bgcolor: 'grey.50' }}></TableCell>
                  <TableCell sx={{ bgcolor: 'grey.50', fontWeight: 700, fontSize: 10, textAlign: 'center', fontFamily: 'monospace', width: 90 }}>R_TYPE_CD</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.50', fontWeight: 700, fontSize: 10, width: 150 }}>R_TYPE_NM</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.50', fontWeight: 700, fontSize: 10, fontFamily: 'monospace', width: 110 }}>SALES_ORG_CD</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.50', fontWeight: 700, fontSize: 10, width: 130 }}>SALES_ORG_NM</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.50', fontWeight: 700, fontSize: 10, fontFamily: 'monospace', width: 100 }}>ACCOUNT_CD</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.50', fontWeight: 700, fontSize: 10, width: 150 }}>ACCOUNT_NM</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.50', fontWeight: 700, fontSize: 10, fontFamily: 'monospace', width: 130 }}>ITEM_CD</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.50', fontWeight: 700, fontSize: 10, width: 180 }}>ITEM_NM</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.50' }}></TableCell>
                  <TableCell sx={{ bgcolor: 'grey.50', fontWeight: 700, fontSize: 10 }}>LV1</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.50', fontWeight: 700, fontSize: 10 }}>LV2</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.50', fontWeight: 700, fontSize: 10 }}>LV3</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.50', fontWeight: 700, fontSize: 10 }}>LV4</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ROWS.map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'center' }}>{r.BASE_YM}</TableCell>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'center', fontWeight: 700, color: TYPE_COLOR[r.R_TYPE_CD] }}>{r.R_TYPE_CD}</TableCell>
                    <TableCell sx={{ fontSize: 11 }}>{r.R_TYPE_NM}</TableCell>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'center' }}>{r.SALES_ORG_CD}</TableCell>
                    <TableCell sx={{ fontSize: 11 }}>{r.SALES_ORG_NM}</TableCell>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'center' }}>{r.ACCOUNT_CD}</TableCell>
                    <TableCell sx={{ fontSize: 11 }}>{r.ACCOUNT_NM}</TableCell>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace' }}>{r.ITEM_CD}</TableCell>
                    <TableCell sx={{ fontSize: 11 }}>{r.ITEM_NM}</TableCell>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right', fontWeight: 600, bgcolor: '#f9fafb' }}>{r.QTY.toLocaleString(undefined, { minimumFractionDigits: 3 })}</TableCell>
                    <TableCell sx={{ fontSize: 11, color: 'text.secondary' }}>{r.LV1}</TableCell>
                    <TableCell sx={{ fontSize: 11, color: 'text.secondary' }}>{r.LV2}</TableCell>
                    <TableCell sx={{ fontSize: 11, color: 'text.secondary' }}>{r.LV3}</TableCell>
                    <TableCell sx={{ fontSize: 11, color: 'text.secondary' }}>{r.LV4}</TableCell>
                  </TableRow>
                ))}
                {/* footer sum row */}
                <TableRow sx={{ bgcolor: '#f3f4f6' }}>
                  <TableCell sx={{ fontSize: 11, fontWeight: 700, textAlign: 'right' }} colSpan={9}>TOTAL</TableCell>
                  <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right', fontWeight: 700, bgcolor: '#bae6fd' }}>{totalQty.toLocaleString(undefined, { minimumFractionDigits: 3 })}</TableCell>
                  <TableCell colSpan={4} />
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </MockShell>
  );
}
