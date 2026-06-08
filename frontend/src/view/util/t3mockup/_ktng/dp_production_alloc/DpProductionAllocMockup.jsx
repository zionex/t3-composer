import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Typography, Paper, Chip, ButtonGroup, IconButton, Button,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SaveIcon from '@mui/icons-material/Save';
import DownloadIcon from '@mui/icons-material/Download';
import MockShell from '../../_shared/MockShell';

// KTNG — DP 생산계획 할당 Rule
// UI_DP_KTNG_03 → DpKtng03.jsx
//   SearchArea: ITEM_LV1, ITEM_LV3, ITEM_LV4
//   Grid: ITEM_LV1/LV3/LV4(merge) + ATTR_06 + PROD_COUNTRY + STOCK_GRADE + ITEM_CD/NM + RTS/EOD/RTP/EOP × ADJ/ACT_DD + LV4_SKU_CNT

const ROWS = [
  { LV1: '담배', LV3: '에쎄', LV4: '스페셜 골드', ATTR: 'KS',      PROD_CNTRY: '한국',      GRADE: 'A', ITEM_CD: 'ITM-ESSE-001', ITEM_NM: '에쎄 스페셜 골드 1mg', RTS_ADJ: '2026-06-15', RTS_ACT: '2026-06-15', EOD_ADJ: '-',           EOP_ADJ: '-',           SKU_CNT: 12 },
  { LV1: '담배', LV3: '에쎄', LV4: '라이트',     ATTR: 'KS',      PROD_CNTRY: '한국',      GRADE: 'A', ITEM_CD: 'ITM-ESSE-002', ITEM_NM: '에쎄 라이트 3mg',      RTS_ADJ: '2026-06-15', RTS_ACT: '2026-06-15', EOD_ADJ: '-',           EOP_ADJ: '-',           SKU_CNT: 8  },
  { LV1: '담배', LV3: '디스', LV4: '플러스',     ATTR: 'KS',      PROD_CNTRY: '한국',      GRADE: 'B', ITEM_CD: 'ITM-DIS-001',  ITEM_NM: '디스 플러스',          RTS_ADJ: '2026-06-20', RTS_ACT: '2026-06-22', EOD_ADJ: '-',           EOP_ADJ: '-',           SKU_CNT: 5  },
  { LV1: '담배', LV3: '더원', LV4: '오렌지',     ATTR: 'PREMIUM', PROD_CNTRY: '한국',      GRADE: 'A', ITEM_CD: 'ITM-1MG-001',  ITEM_NM: '더원 오렌지 1mg',      RTS_ADJ: '2026-07-01', RTS_ACT: '2026-07-01', EOD_ADJ: '-',           EOP_ADJ: '-',           SKU_CNT: 6  },
  { LV1: '담배', LV3: 'TIME', LV4: 'Original',  ATTR: 'EXPORT',  PROD_CNTRY: '카자흐스탄', GRADE: 'B', ITEM_CD: 'ITM-TIME-INTL', ITEM_NM: 'TIME (해외향)',         RTS_ADJ: '2026-06-18', RTS_ACT: '2026-06-20', EOD_ADJ: '-',           EOP_ADJ: '-',           SKU_CNT: 10 },
  { LV1: '담배', LV3: '레종', LV4: '구형',       ATTR: 'KS',      PROD_CNTRY: '한국',      GRADE: 'C', ITEM_CD: 'ITM-LSN-OLD',  ITEM_NM: '레종 (구형, 단종)',     RTS_ADJ: '2025-12-31', RTS_ACT: '2025-12-31', EOD_ADJ: '2025-12-31',  EOP_ADJ: '2026-03-31',  SKU_CNT: 0  },
];

export default function KtngDpProductionAllocMockup() {
  return (
    <MockShell
      patternCode="ktng_dp_production_alloc"
      patternLabel="KTNG — DP 생산계획 할당 Rule"
      layoutCategory="LAYOUT_SINGLE"
      description="UI_DP_KTNG_03 → DpKtng03.jsx. SearchArea (ITEM_LV1/LV3/LV4 text 검색) + 그리드 (ITEM_LV1/LV3/LV4 merge + ATTR_06 + PROD_COUNTRY + STOCK_GRADE + ITEM_CD/NM + RTS/EOD/RTP/EOP × ADJ/ACT_DD + LV4_SKU_CNT). 셀 데이터는 KTNG 도메인 (에쎄/디스/더원/TIME/레종 × 한국·카자흐스탄 생산 × A/B/C 등급 + EOD/EOP 단종일자)."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="ITEM_LV1" size="small" value="담배" sx={{ width: 130 }}
            InputProps={{ endAdornment: <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} /> }} />
          <TextField label="ITEM_LV3" size="small" value="" sx={{ width: 160 }}
            placeholder="브랜드 검색"
            InputProps={{ endAdornment: <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} /> }} />
          <TextField label="ITEM_LV4" size="small" value="" sx={{ width: 160 }}
            placeholder="제품군 검색"
            InputProps={{ endAdornment: <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} /> }} />
        </Stack>
      </Box>

      <Box sx={{ px: 1.5, py: 0.7, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        <Button size="small" variant="outlined" startIcon={<DownloadIcon />}>Excel</Button>
        <ButtonGroup variant="outlined" size="small">
          <IconButton size="small" color="primary" title="GridSaveButton"><SaveIcon fontSize="small" /></IconButton>
        </ButtonGroup>
      </Box>

      <Box sx={{ p: 1.5, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Paper variant="outlined" sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, textAlign: 'center' }}>ITEM_LV1</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, textAlign: 'center' }}>ITEM_LV3</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, textAlign: 'center' }}>ITEM_LV4</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, textAlign: 'center' }}>ATTR_06</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11 }}>PROD_COUNTRY</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, textAlign: 'center' }}>STOCK_GRADE</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, fontFamily: 'monospace' }}>ITEM_CD</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11 }}>ITEM_NM</TableCell>
                  <TableCell sx={{ bgcolor: '#dbeafe', fontWeight: 700, fontSize: 11, textAlign: 'center' }}>RTS_ADJ_DD</TableCell>
                  <TableCell sx={{ bgcolor: '#dbeafe', fontWeight: 700, fontSize: 11, textAlign: 'center' }}>RTS_ACT_DD</TableCell>
                  <TableCell sx={{ bgcolor: '#fee2e2', fontWeight: 700, fontSize: 11, textAlign: 'center' }}>EOD_ADJ</TableCell>
                  <TableCell sx={{ bgcolor: '#fee2e2', fontWeight: 700, fontSize: 11, textAlign: 'center' }}>EOP_ADJ</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, textAlign: 'right' }}>LV4_SKU_CNT</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ROWS.map((r, i) => {
                  const showLv1 = i === 0 || ROWS[i - 1].LV1 !== r.LV1;
                  const showLv3 = showLv1 || ROWS[i - 1].LV3 !== r.LV3;
                  const showLv4 = showLv3 || ROWS[i - 1].LV4 !== r.LV4;
                  const isEol = r.EOD_ADJ !== '-' || r.EOP_ADJ !== '-';
                  return (
                    <TableRow key={i} hover sx={{ bgcolor: isEol ? '#fef2f2' : 'transparent' }}>
                      <TableCell sx={{ fontSize: 11, textAlign: 'center', bgcolor: showLv1 ? '#f0fdf4' : undefined }}>{showLv1 ? r.LV1 : ''}</TableCell>
                      <TableCell sx={{ fontSize: 11, textAlign: 'center' }}>{showLv3 ? r.LV3 : ''}</TableCell>
                      <TableCell sx={{ fontSize: 11, textAlign: 'center' }}>{showLv4 ? r.LV4 : ''}</TableCell>
                      <TableCell sx={{ fontSize: 11, textAlign: 'center' }}><Chip label={r.ATTR} size="small" variant="outlined" sx={{ height: 18, fontSize: 10 }} /></TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{r.PROD_CNTRY}</TableCell>
                      <TableCell sx={{ fontSize: 11, textAlign: 'center', fontWeight: 700, color: r.GRADE === 'A' ? '#10b981' : r.GRADE === 'B' ? '#f59e0b' : '#ef4444' }}>{r.GRADE}</TableCell>
                      <TableCell sx={{ fontSize: 11, fontFamily: 'monospace' }}>{r.ITEM_CD}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{r.ITEM_NM}</TableCell>
                      <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'center' }}>{r.RTS_ADJ}</TableCell>
                      <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'center' }}>{r.RTS_ACT}</TableCell>
                      <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'center', color: r.EOD_ADJ !== '-' ? '#ef4444' : '#d1d5db', fontWeight: r.EOD_ADJ !== '-' ? 700 : 400 }}>{r.EOD_ADJ}</TableCell>
                      <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'center', color: r.EOP_ADJ !== '-' ? '#ef4444' : '#d1d5db', fontWeight: r.EOP_ADJ !== '-' ? 700 : 400 }}>{r.EOP_ADJ}</TableCell>
                      <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right', color: r.SKU_CNT === 0 ? '#d1d5db' : '#374151' }}>{r.SKU_CNT}</TableCell>
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
