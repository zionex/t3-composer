import React from 'react';
import { Box, Stack, TextField, MenuItem, Button, Chip, Typography,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Paper } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import MockShell from '../../_shared/MockShell';

// DpKtng03 — 생산계획 할당 Rule. 품목·거점·우선순위·비율 매핑.

const ROWS = [
  { ITEM_LV3_CD: 'KING-RED', ITEM_NM: '레드 시리즈', PROD_SITE: '신탄진 공장', PRIORITY: 1, RATIO: 60.0, EFFECTIVE: '2026-01-01 ~ ' },
  { ITEM_LV3_CD: 'KING-RED', ITEM_NM: '레드 시리즈', PROD_SITE: '대전 공장',   PRIORITY: 2, RATIO: 40.0, EFFECTIVE: '2026-01-01 ~ ' },
  { ITEM_LV3_CD: 'KING-BLU', ITEM_NM: '블루 시리즈', PROD_SITE: '신탄진 공장', PRIORITY: 1, RATIO: 50.0, EFFECTIVE: '2026-01-01 ~ ' },
  { ITEM_LV3_CD: 'KING-BLU', ITEM_NM: '블루 시리즈', PROD_SITE: '광주 공장',   PRIORITY: 2, RATIO: 50.0, EFFECTIVE: '2026-01-01 ~ ' },
  { ITEM_LV3_CD: 'NGP-DEV',  ITEM_NM: 'illuvia DEV', PROD_SITE: '대전 공장',   PRIORITY: 1, RATIO: 100.0, EFFECTIVE: '2026-03-01 ~ ' },
  { ITEM_LV3_CD: 'EXPORT-K', ITEM_NM: '수출 KING',   PROD_SITE: '인도네시아',   PRIORITY: 1, RATIO: 80.0, EFFECTIVE: '2026-01-01 ~ ' },
  { ITEM_LV3_CD: 'EXPORT-K', ITEM_NM: '수출 KING',   PROD_SITE: '신탄진 공장', PRIORITY: 2, RATIO: 20.0, EFFECTIVE: '2026-01-01 ~ ' },
];

const RATIO_BY_ITEM = {};
ROWS.forEach((r) => { RATIO_BY_ITEM[r.ITEM_LV3_CD] = (RATIO_BY_ITEM[r.ITEM_LV3_CD] || 0) + r.RATIO; });

export default function DpProductionAllocMockup() {
  return (
    <MockShell patternCode="ktng_dp_production_alloc" patternLabel="KTNG — 생산계획 할당 Rule (DpKtng03)"
      layoutCategory="LAYOUT_SINGLE" description="품목별 생산지 할당 우선순위와 비율 — 합계 100% 검증.">
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <TextField label="ITEM_LV3" size="small" value="" placeholder="품목 코드" sx={{ width: 160 }} />
          <TextField label="PROD_SITE" size="small" select value="ALL" sx={{ width: 160 }}>
            <MenuItem value="ALL">전체</MenuItem><MenuItem value="SH">신탄진</MenuItem><MenuItem value="DJ">대전</MenuItem><MenuItem value="GJ">광주</MenuItem>
          </TextField>
          <TextField label="유효일" size="small" type="date" value="2026-05-22" InputLabelProps={{ shrink: true }} sx={{ width: 160 }} />
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
        </Stack>
      </Box>

      <Box sx={{ px: 1.5, py: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>{ROWS.length}개 룰 · {Object.keys(RATIO_BY_ITEM).length}개 품목</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Stack direction="row" spacing={0.75}>
          <Button size="small" startIcon={<AddIcon />}>룰 추가</Button>
          <Button size="small" startIcon={<SaveIcon />} variant="contained">저장</Button>
        </Stack>
      </Box>

      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 1 }}>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {['ITEM_LV3_CD','ITEM_NM','PROD_SITE','PRIORITY','RATIO (%)','EFFECTIVE','검증'].map((c) => (
                  <TableCell key={c} sx={{ backgroundColor: 'grey.100', fontWeight: 700, textAlign: c.includes('RATIO') || c === 'PRIORITY' ? 'right' : (c === '검증' ? 'center' : 'left') }}>{c}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {ROWS.map((r, i) => {
                const total = RATIO_BY_ITEM[r.ITEM_LV3_CD];
                const isFirst = ROWS.findIndex((x) => x.ITEM_LV3_CD === r.ITEM_LV3_CD) === i;
                const groupStatus = total === 100 ? 'success' : 'danger';
                return (
                  <TableRow key={i} hover>
                    <TableCell sx={{ fontFamily: 'monospace', fontWeight: isFirst ? 700 : 400 }}>{r.ITEM_LV3_CD}</TableCell>
                    <TableCell>{r.ITEM_NM}</TableCell>
                    <TableCell>{r.PROD_SITE}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}><Chip size="small" label={r.PRIORITY} color={r.PRIORITY === 1 ? 'primary' : 'default'} variant="outlined" /></TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.RATIO.toFixed(1)}%</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{r.EFFECTIVE}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      {isFirst && <Chip size="small" label={`합계 ${total}%`} color={groupStatus === 'success' ? 'success' : 'error'} />}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </MockShell>
  );
}
