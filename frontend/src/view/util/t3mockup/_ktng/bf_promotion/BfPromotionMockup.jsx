import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Typography, Paper, Chip, Tabs, Tab, Button, ButtonGroup, IconButton, Checkbox,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import MockShell from '../../_shared/MockShell';

// KTNG — BF 프로모션 계획
//  Tab 1: UI_BF_KTNG_01 한국 프로모션 계획   → BfKtng01.jsx (639 lines)
//  Tab 2: UI_BF_KTNG_02 해외 프로모션 계획   → BfKtng02.jsx (동일 구조)
//
// SearchArea: SALES_ORG, ACCOUNT, ITEM_LV3, START_DT, END_DT
// 좌측 ButtonArea: Excel Export/Import
// 우측 ButtonArea: APPLY_BF_FACTOR + Add/Delete/Save
// Grid (그룹 헤더):
//   ORG (SALES_ORG)
//   ACCOUNT (CHANNEL/BUYER/ACCOUNT_CD/ACCOUNT_NM)
//   ITEM_LV (ITEM_LV3_CD with action btn, NM, LV2_NM, LV1_NM)
//   START_DT, END_DT (date)
//   PROMOTION_TYPE (TYPE_CD/TYPE_NM/DISCOUNT_RATE — D=Discount 만 RATE 편집)
//   DESCRIPTION
//   audit: CREATE_BY/DTTM, MODIFY_BY/DTTM

const ROWS_KR = [
  { SALES_ORG: '국내영업본부', CHANNEL: '편의점', BUYER: 'BGF리테일', ACCOUNT_CD: 'BGF-001',  ACCOUNT_NM: 'CU',         ITEM_LV3_CD: 'ITM-ESSE',  ITEM_LV3_NM: '에쎄',     ITEM_LV2_NM: '저타르',   ITEM_LV1_NM: '담배',     START_DT: '2026-06-01', END_DT: '2026-06-30', PROMO_TP: 'D', PROMO_NM: '할인',   RATE: 5.00, DESC: '편의점 1+1 프로모션',     CREATE_BY: 'kim.youngsu', CREATE_DTTM: '2026-05-25' },
  { SALES_ORG: '국내영업본부', CHANNEL: '편의점', BUYER: 'GS리테일',  ACCOUNT_CD: 'GS25-001', ACCOUNT_NM: 'GS25',       ITEM_LV3_CD: 'ITM-ESSE',  ITEM_LV3_NM: '에쎄',     ITEM_LV2_NM: '저타르',   ITEM_LV1_NM: '담배',     START_DT: '2026-06-01', END_DT: '2026-06-30', PROMO_TP: 'D', PROMO_NM: '할인',   RATE: 4.50, DESC: 'GS25 매장 행사',         CREATE_BY: 'kim.youngsu', CREATE_DTTM: '2026-05-25' },
  { SALES_ORG: '국내영업본부', CHANNEL: '슈퍼',   BUYER: '이마트',    ACCOUNT_CD: 'EMT-001',  ACCOUNT_NM: '이마트 본점', ITEM_LV3_CD: 'ITM-DIS',   ITEM_LV3_NM: '디스',     ITEM_LV2_NM: '프리미엄', ITEM_LV1_NM: '담배',     START_DT: '2026-06-15', END_DT: '2026-07-15', PROMO_TP: 'P', PROMO_NM: '증정',   RATE: 0,    DESC: '구매 시 일회용 라이터 증정', CREATE_BY: 'lee.jihoon',  CREATE_DTTM: '2026-05-28' },
  { SALES_ORG: '국내영업본부', CHANNEL: '슈퍼',   BUYER: '롯데마트',  ACCOUNT_CD: 'LMT-001',  ACCOUNT_NM: '롯데마트',    ITEM_LV3_CD: 'ITM-1MG',   ITEM_LV3_NM: '더원',     ITEM_LV2_NM: '프리미엄', ITEM_LV1_NM: '담배',     START_DT: '2026-07-01', END_DT: '2026-07-31', PROMO_TP: 'B', PROMO_NM: '묶음',   RATE: 0,    DESC: '2갑 묶음 패키지',          CREATE_BY: 'lee.jihoon',  CREATE_DTTM: '2026-06-01' },
  { SALES_ORG: '국내영업본부', CHANNEL: '편의점', BUYER: '코리아세븐', ACCOUNT_CD: 'SVN-001',  ACCOUNT_NM: '7-Eleven',   ITEM_LV3_CD: 'ITM-ESSE',  ITEM_LV3_NM: '에쎄',     ITEM_LV2_NM: '저타르',   ITEM_LV1_NM: '담배',     START_DT: '2026-08-01', END_DT: '2026-08-31', PROMO_TP: 'X', PROMO_NM: '기타',   RATE: 0,    DESC: '신제품 런칭 캠페인',       CREATE_BY: 'park.sumin',  CREATE_DTTM: '2026-06-05' },
];

const ROWS_FOREIGN = [
  { SALES_ORG: '수출본부', CHANNEL: 'INTL_DUTY', BUYER: 'KT&G USA',     ACCOUNT_CD: 'US-001',  ACCOUNT_NM: 'USA Duty Free',   ITEM_LV3_CD: 'ITM-ESSE-INTL', ITEM_LV3_NM: 'ESSE Asian',   ITEM_LV2_NM: 'LOW_TAR',  ITEM_LV1_NM: 'CIGAR', START_DT: '2026-06-01', END_DT: '2026-07-31', PROMO_TP: 'D', PROMO_NM: 'DISCOUNT', RATE: 8.00, DESC: 'Summer Duty-Free Sale',    CREATE_BY: 'choi.minji', CREATE_DTTM: '2026-05-20' },
  { SALES_ORG: '수출본부', CHANNEL: 'INTL_DIST', BUYER: 'TKK Global',   ACCOUNT_CD: 'TW-001',  ACCOUNT_NM: 'Taiwan Dist.',     ITEM_LV3_CD: 'ITM-ESSE-INTL', ITEM_LV3_NM: 'ESSE Asian',   ITEM_LV2_NM: 'LOW_TAR',  ITEM_LV1_NM: 'CIGAR', START_DT: '2026-06-15', END_DT: '2026-08-15', PROMO_TP: 'B', PROMO_NM: 'BUNDLE',   RATE: 0,    DESC: '10-Pack bundle for retailer', CREATE_BY: 'choi.minji', CREATE_DTTM: '2026-05-22' },
  { SALES_ORG: '수출본부', CHANNEL: 'INTL_DUTY', BUYER: 'Heinemann',    ACCOUNT_CD: 'DE-001',  ACCOUNT_NM: 'Heinemann EU',     ITEM_LV3_CD: 'ITM-1MG-INTL',  ITEM_LV3_NM: 'THE ONE',     ITEM_LV2_NM: 'PREMIUM',  ITEM_LV1_NM: 'CIGAR', START_DT: '2026-07-01', END_DT: '2026-09-30', PROMO_TP: 'X', PROMO_NM: 'OTHER',    RATE: 0,    DESC: 'New product launch EU',     CREATE_BY: 'jang.minho', CREATE_DTTM: '2026-06-01' },
];

const PROMO_COLOR = { D: '#f59e0b', P: '#3b82f6', B: '#8b5cf6', X: '#9ca3af' };

function PromotionGrid({ rows }) {
  return (
    <Paper variant="outlined" sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <TableContainer sx={{ flex: 1 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            {/* 그룹 헤더 행 */}
            <TableRow>
              <TableCell colSpan={1} sx={{ bgcolor: '#e0f2fe', fontWeight: 700, fontSize: 11, textAlign: 'center' }}>ORG</TableCell>
              <TableCell colSpan={4} sx={{ bgcolor: '#fef3c7', fontWeight: 700, fontSize: 11, textAlign: 'center' }}>ACCOUNT</TableCell>
              <TableCell colSpan={4} sx={{ bgcolor: '#dcfce7', fontWeight: 700, fontSize: 11, textAlign: 'center' }}>ITEM_LV</TableCell>
              <TableCell colSpan={2} sx={{ bgcolor: '#e5e7eb', fontWeight: 700, fontSize: 11, textAlign: 'center' }}>PERIOD</TableCell>
              <TableCell colSpan={3} sx={{ bgcolor: '#fce7f3', fontWeight: 700, fontSize: 11, textAlign: 'center' }}>PROMOTION_TYPE</TableCell>
              <TableCell colSpan={3} sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, textAlign: 'center' }}>AUDIT</TableCell>
            </TableRow>
            {/* 컬럼 헤더 행 */}
            <TableRow>
              <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, textAlign: 'center', width: 110 }}>SALES_ORG</TableCell>
              <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, textAlign: 'center', width: 80 }}>CHANNEL</TableCell>
              <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, textAlign: 'center', width: 100 }}>BUYER</TableCell>
              <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, textAlign: 'center', width: 100 }}>ACCOUNT_CD</TableCell>
              <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, textAlign: 'left', width: 140 }}>ACCOUNT_NM</TableCell>
              <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, textAlign: 'center', width: 130 }}>ITEM_LV3_CD</TableCell>
              <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, textAlign: 'center', width: 90 }}>ITEM_LV3_NM</TableCell>
              <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, textAlign: 'center', width: 90 }}>ITEM_LV2_NM</TableCell>
              <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, textAlign: 'center', width: 80 }}>ITEM_LV1_NM</TableCell>
              <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, textAlign: 'center', width: 100 }}>START_DT</TableCell>
              <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, textAlign: 'center', width: 100 }}>END_DT</TableCell>
              <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, textAlign: 'center', width: 70 }}>TYPE_CD</TableCell>
              <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, textAlign: 'center', width: 80 }}>TYPE_NM</TableCell>
              <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, textAlign: 'right', width: 90 }}>DISCOUNT_RATE</TableCell>
              <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, textAlign: 'left', width: 200 }}>DESCRIPTION</TableCell>
              <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, textAlign: 'center', width: 100 }}>CREATE_BY</TableCell>
              <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, textAlign: 'center', width: 110 }}>CREATE_DTTM</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={i} hover>
                <TableCell sx={{ fontSize: 12, textAlign: 'center' }}>{r.SALES_ORG}</TableCell>
                <TableCell sx={{ fontSize: 12, textAlign: 'center' }}>{r.CHANNEL}</TableCell>
                <TableCell sx={{ fontSize: 12 }}>{r.BUYER}</TableCell>
                <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', textAlign: 'center' }}>{r.ACCOUNT_CD}</TableCell>
                <TableCell sx={{ fontSize: 12 }}>{r.ACCOUNT_NM}</TableCell>
                <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', textAlign: 'center' }}>{r.ITEM_LV3_CD}</TableCell>
                <TableCell sx={{ fontSize: 12, textAlign: 'center' }}>{r.ITEM_LV3_NM}</TableCell>
                <TableCell sx={{ fontSize: 12, textAlign: 'center' }}>{r.ITEM_LV2_NM}</TableCell>
                <TableCell sx={{ fontSize: 12, textAlign: 'center' }}>{r.ITEM_LV1_NM}</TableCell>
                <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', textAlign: 'center' }}>{r.START_DT}</TableCell>
                <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', textAlign: 'center' }}>{r.END_DT}</TableCell>
                <TableCell sx={{ fontSize: 12, textAlign: 'center', fontWeight: 700, color: PROMO_COLOR[r.PROMO_TP] }}>{r.PROMO_TP}</TableCell>
                <TableCell sx={{ fontSize: 12, textAlign: 'center' }}>{r.PROMO_NM}</TableCell>
                <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', textAlign: 'right', color: r.PROMO_TP === 'D' ? '#374151' : '#d1d5db' }}>
                  {r.PROMO_TP === 'D' ? `${r.RATE.toFixed(2)}%` : '-'}
                </TableCell>
                <TableCell sx={{ fontSize: 12, color: 'text.secondary' }}>{r.DESC}</TableCell>
                <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', textAlign: 'center' }}>{r.CREATE_BY}</TableCell>
                <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', textAlign: 'center' }}>{r.CREATE_DTTM}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

export default function KtngBfPromotionMockup() {
  const [tab, setTab] = React.useState(0);
  const rows = tab === 0 ? ROWS_KR : ROWS_FOREIGN;
  return (
    <MockShell
      patternCode="ktng_bf_promotion"
      patternLabel="KTNG — BF 프로모션 계획 (한국/해외)"
      layoutCategory="LAYOUT_SINGLE"
      description="UI_BF_KTNG_01 (한국 프로모션 계획) + UI_BF_KTNG_02 (해외 프로모션 계획) — 동일 BfKtng 패턴의 한국/해외 variant. SearchArea (SALES_ORG/ACCOUNT/ITEM_LV3/기간) + 좌측 Excel Import·Export + 우측 [APPLY_BF_FACTOR]/Add/Delete/Save + 그룹 헤더 그리드 (ORG / ACCOUNT / ITEM_LV / PERIOD / PROMOTION_TYPE / AUDIT). 셀 데이터는 KTNG 도메인 (에쎄/디스/더원 × 편의점/슈퍼 × 할인/증정/묶음)."
    >
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 1.5 }}>
        <Tabs value={tab} onChange={(_e, v) => setTab(v)}>
          <Tab label={<Stack direction="row" spacing={1} alignItems="center"><span>한국 프로모션 계획</span><Chip label="UI_BF_KTNG_01" size="small" variant="outlined" sx={{ height: 18, fontSize: 10, fontFamily: 'monospace' }} /></Stack>} />
          <Tab label={<Stack direction="row" spacing={1} alignItems="center"><span>해외 프로모션 계획</span><Chip label="UI_BF_KTNG_02" size="small" variant="outlined" sx={{ height: 18, fontSize: 10, fontFamily: 'monospace' }} /></Stack>} />
        </Tabs>
      </Box>

      {/* SearchArea */}
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="SALES_ORG" size="small" select value={tab === 0 ? '국내영업본부' : '수출본부'} sx={{ width: 160 }}>
            <MenuItem value="국내영업본부">국내영업본부</MenuItem>
            <MenuItem value="수출본부">수출본부</MenuItem>
          </TextField>
          <TextField label="ACCOUNT" size="small" select value="ALL" sx={{ width: 160 }}>
            <MenuItem value="ALL">전체</MenuItem>
          </TextField>
          <TextField label="ITEM_LV3" size="small" value="" placeholder="브랜드 검색"
            InputProps={{ endAdornment: <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} /> }}
            sx={{ width: 180 }} />
          <TextField label="START_DT" size="small" value="2026-05-01" sx={{ width: 130 }} />
          <TextField label="END_DT" size="small" value="2027-02-28" sx={{ width: 130 }} />
        </Stack>
      </Box>

      {/* ButtonArea */}
      <Box sx={{ px: 1.5, py: 0.7, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
        <ButtonGroup variant="outlined" size="small">
          <IconButton size="small" title="Excel Export"><DownloadIcon fontSize="small" /></IconButton>
          <IconButton size="small" title="Excel Import"><UploadIcon fontSize="small" /></IconButton>
        </ButtonGroup>
        <Box sx={{ flexGrow: 1 }} />
        <Button size="small" variant="outlined">APPLY_BF_FACTOR</Button>
        <ButtonGroup variant="outlined" size="small">
          <IconButton size="small" title="GridAddRowButton"><AddIcon fontSize="small" /></IconButton>
          <IconButton size="small" title="GridDeleteRowButton"><DeleteIcon fontSize="small" /></IconButton>
          <IconButton size="small" title="GridSaveButton" color="primary"><SaveIcon fontSize="small" /></IconButton>
        </ButtonGroup>
      </Box>

      {/* Grid */}
      <Box sx={{ p: 1.5, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <PromotionGrid rows={rows} />
      </Box>
    </MockShell>
  );
}
