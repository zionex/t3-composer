import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography, Paper, Chip,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import MockShell from '../../_shared/MockShell';
import { cellSx } from '../../_shared/styleCallback';

// CJBO — 관세기준 관리 (CmTariffMgmt)
// UI_CM_TARIFF_MGMT — 판매지역 × 품목 레벨 × HS코드 × 관세구분 (S/N) 기간별 관세율 관리

const ROWS = [
  { SALES_AREA_NM: '베트남',    ITEM_LVL_NM: 'CJ Brand Korea',  HS_CD: '2106.90', TARIFF_GBN_NM: '국제관세',     TARIFF_RATE: 10.0, FROM_DT: '2026-01-01', TO_DT: '2026-12-31', SAVE_USER: '김민수',  status: 'normal' },
  { SALES_AREA_NM: '베트남',    ITEM_LVL_NM: 'CJ Brand Korea',  HS_CD: '2106.90', TARIFF_GBN_NM: '국가관세',     TARIFF_RATE:  8.5, FROM_DT: '2026-01-01', TO_DT: '2026-12-31', SAVE_USER: '김민수',  status: 'normal' },
  { SALES_AREA_NM: '인도네시아', ITEM_LVL_NM: 'illuvia',          HS_CD: '3304.99', TARIFF_GBN_NM: 'FTA협정관세',  TARIFF_RATE:  0.0, FROM_DT: '2026-01-01', TO_DT: '9999-12-31', SAVE_USER: '박글로벌', status: 'success' },
  { SALES_AREA_NM: '미국',      ITEM_LVL_NM: 'SLIM',             HS_CD: '2106.90', TARIFF_GBN_NM: '국가관세',     TARIFF_RATE:  6.4, FROM_DT: '2026-04-01', TO_DT: '2026-12-31', SAVE_USER: '정재현',  status: 'normal' },
  { SALES_AREA_NM: '필리핀',    ITEM_LVL_NM: 'KING-RED',         HS_CD: '2106.90', TARIFF_GBN_NM: '국가관세',     TARIFF_RATE: 12.0, FROM_DT: '2026-06-01', TO_DT: '2026-12-31', SAVE_USER: '이정훈',  status: 'warning' },
  { SALES_AREA_NM: '말레이시아', ITEM_LVL_NM: 'NGP 전체',         HS_CD: '8543.40', TARIFF_GBN_NM: 'FTA협정관세',  TARIFF_RATE:  5.0, FROM_DT: '2026-01-01', TO_DT: '2026-06-30', SAVE_USER: '송하늘',  status: 'danger' },
  { SALES_AREA_NM: '일본',      ITEM_LVL_NM: 'illuvia MASK',     HS_CD: '3304.99', TARIFF_GBN_NM: '국제관세',     TARIFF_RATE:  3.2, FROM_DT: '2026-01-01', TO_DT: '9999-12-31', SAVE_USER: '박글로벌', status: 'normal' },
  { SALES_AREA_NM: '중국',      ITEM_LVL_NM: 'CJ Brand Korea',  HS_CD: '2106.90', TARIFF_GBN_NM: '국가관세',     TARIFF_RATE: 15.0, FROM_DT: '2026-01-01', TO_DT: '9999-12-31', SAVE_USER: '김민수',  status: 'highlight' },
];

export default function CjboCmTariffMgmtMockup() {
  return (
    <MockShell patternCode="cjbo_cm_tariff_mgmt" patternLabel="CJBO — 관세기준 관리 (CmTariffMgmt)"
      layoutCategory="LAYOUT_SINGLE"
      description="판매지역 × 품목 LV × HS코드 × 관세구분(국제/국가/FTA) 기간별 관세율. UI_CM_TARIFF_MGMT.">
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="판매지역" size="small" select value="ALL" sx={{ width: 140 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="VN">베트남</MenuItem>
            <MenuItem value="ID">인도네시아</MenuItem>
            <MenuItem value="US">미국</MenuItem>
          </TextField>
          <TextField label="품목 LV" size="small" value="" placeholder="검색 [🔍]" sx={{ width: 200 }} />
          <TextField label="HS 코드" size="small" value="" placeholder="2106.90" sx={{ width: 140 }} />
          <TextField label="관세구분" size="small" select value="ALL" sx={{ width: 140 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="S">국제관세</MenuItem>
            <MenuItem value="N">국가관세</MenuItem>
            <MenuItem value="F">FTA협정관세</MenuItem>
          </TextField>
          <TextField label="적용일" size="small" value="2026-06-04" sx={{ width: 160 }} />
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
        </Stack>
      </Box>

      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1, flexGrow: 1, overflow: 'auto' }}>
        <Paper variant="outlined" sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" color="text.secondary">총 <b>{ROWS.length}</b> 건</Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Button size="small" startIcon={<AddIcon />} variant="outlined">행 추가</Button>
          <Button size="small" startIcon={<DeleteIcon />} variant="outlined" color="error">행 삭제</Button>
          <Button size="small" startIcon={<SaveIcon />} variant="contained" color="primary">저장</Button>
          <Button size="small" startIcon={<FileDownloadIcon />} variant="outlined">엑셀</Button>
        </Paper>

        <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 280 }}>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {['판매지역','품목 LV','HS코드','관세구분','관세율(%)','시작일','종료일','등록자'].map((c) => (
                    <TableCell key={c} sx={{ backgroundColor: 'grey.100', fontWeight: 700,
                      textAlign: c === '관세율(%)' ? 'right' : (['시작일','종료일'].includes(c) ? 'center' : 'left') }}>{c}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {ROWS.map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell>{r.SALES_AREA_NM}</TableCell>
                    <TableCell>{r.ITEM_LVL_NM}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{r.HS_CD}</TableCell>
                    <TableCell>
                      <Chip size="small" label={r.TARIFF_GBN_NM} variant="outlined"
                        color={r.TARIFF_GBN_NM === 'FTA협정관세' ? 'success' : r.TARIFF_GBN_NM === '국제관세' ? 'info' : 'default'} />
                    </TableCell>
                    <TableCell sx={cellSx(r.status, { align: 'right', mono: true })}>{r.TARIFF_RATE.toFixed(1)}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 12 }}>{r.FROM_DT}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 12 }}>{r.TO_DT}</TableCell>
                    <TableCell>{r.SAVE_USER}</TableCell>
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
