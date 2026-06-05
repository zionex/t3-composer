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
import RefreshIcon from '@mui/icons-material/Refresh';
import MockShell from '../../_shared/MockShell';

// CJBO — PM 거래처-품목 등록 (DpPmAccount.jsx)
// 소스 기반 재작성.
// path: view/demandplan/service/dppmaccount/DpPmAccount.jsx
// 데이터 SP: POST demandplan/dppmaccount/{q1,s1,d1}
// 콤보 SP: SP_CUSTOM_SRH_COMBO_LIST_Q (DP_SALES_AREA · CB_DP_SALES_GRP · CB_DP_TRADE_TYPE · DP_ITEM_CD)
// authTpData hardcoded UUID: AB4E09E4FEF842EEA07B6933FB178AB4 (PM level)

// styleCallback 규칙 (소스):
//   - PM_ADD_YN='N' → SALES_AREA_CD/TRADE_TYPE_CD/ITEM_CD = Back_White + 편집불가 + 버튼 숨김
//   - PM_ADD_YN='Y' → 동일 컬럼 Back_Yellow + 버튼 표시
//   - row.ERROR_COLS 포함 fieldName → Back_RED04

const L = {
  SALES_AREA_CD: { ko: '판매지역',     key: 'UI_DP_REPORT_SALES_AREA_CD' },
  SALES_AREA_NM: { ko: '판매지역명',   key: 'UI_DP_REPORT_SALES_AREA_NM' },
  TRADE_TYPE_CD: { ko: '거래유형',     key: 'UI_DP_REPORT_TRADE_TYPE_CD' },
  TRADE_TYPE_NM: { ko: '거래유형명',   key: 'UI_DP_REPORT_TRADE_TYPE_NM' },
  ITEM_CD:       { ko: '품목코드',     key: 'UI_DP_REPORT_ITEM_CD' },
  ITEM_NM:       { ko: '품목명',       key: 'UI_DP_REPORT_ITEM_NM' },
  SALES_GRP_CD:  { ko: '사업담당',     key: 'UI_DP_REPORT_SALES_GRP_CD' },
  SML_GRP_NM:    { ko: '소분류',       key: 'UI_DP_REPORT_SML_GRP_NM' },
  PM_ADD_YN:     { ko: '추가구분',     key: 'UI_DP_REPORT_PM_ADD_YN' },
};

// 샘플 데이터 — PM_ADD_YN 으로 행 스타일 분기 (소스 styleCallback 그대로)
const ROWS = [
  { SALES_AREA_CD: 'KR',  SALES_AREA_NM: '한국',         TRADE_TYPE_CD: 'D', TRADE_TYPE_NM: '내수',   ITEM_CD: 'L-LYS-78L',   ITEM_NM: 'L-Lysine 78% (액상)',         SALES_GRP_CD: 'AN',  SML_GRP_NM: '라이신 (액상)', PM_ADD_YN: 'N', errorCols: [] },
  { SALES_AREA_CD: 'VN',  SALES_AREA_NM: '베트남',       TRADE_TYPE_CD: 'E', TRADE_TYPE_NM: '수출',   ITEM_CD: 'L-LYS-HCL98', ITEM_NM: 'L-Lysine HCl 98% (분말)',      SALES_GRP_CD: 'AN',  SML_GRP_NM: '라이신 (분말)', PM_ADD_YN: 'N', errorCols: [] },
  { SALES_AREA_CD: 'ID',  SALES_AREA_NM: '인도네시아',   TRADE_TYPE_CD: 'E', TRADE_TYPE_NM: '수출',   ITEM_CD: 'L-TRP-98',    ITEM_NM: 'L-Tryptophan 98% (분말)',      SALES_GRP_CD: 'AN',  SML_GRP_NM: '트립토판',     PM_ADD_YN: 'Y', errorCols: [] },
  { SALES_AREA_CD: 'US',  SALES_AREA_NM: '미국',         TRADE_TYPE_CD: 'E', TRADE_TYPE_NM: '수출',   ITEM_CD: 'L-MET-99',    ITEM_NM: 'L-Methionine 99% (분말)',      SALES_GRP_CD: 'AN',  SML_GRP_NM: '메티오닌',     PM_ADD_YN: 'N', errorCols: [] },
  { SALES_AREA_CD: 'BR',  SALES_AREA_NM: '브라질',       TRADE_TYPE_CD: 'E', TRADE_TYPE_NM: '수출',   ITEM_CD: 'L-THR-985',   ITEM_NM: 'L-Threonine 98.5% (분말)',     SALES_GRP_CD: 'AN',  SML_GRP_NM: '트레오닌',     PM_ADD_YN: 'Y', errorCols: ['ITEM_CD'] },
  { SALES_AREA_CD: 'CN',  SALES_AREA_NM: '중국',         TRADE_TYPE_CD: 'E', TRADE_TYPE_NM: '수출',   ITEM_CD: 'L-VAL-96',    ITEM_NM: 'L-Valine 96.5% (분말)',        SALES_GRP_CD: 'AN',  SML_GRP_NM: '발린',         PM_ADD_YN: 'N', errorCols: [] },
  { SALES_AREA_CD: 'PH',  SALES_AREA_NM: '필리핀',       TRADE_TYPE_CD: 'E', TRADE_TYPE_NM: '수출',   ITEM_CD: 'L-LYS-78L',   ITEM_NM: 'L-Lysine 78% (액상)',         SALES_GRP_CD: 'AN',  SML_GRP_NM: '라이신 (액상)', PM_ADD_YN: 'Y', errorCols: [] },
  { SALES_AREA_CD: 'JP',  SALES_AREA_NM: '일본',         TRADE_TYPE_CD: 'E', TRADE_TYPE_NM: '수출',   ITEM_CD: 'L-MET-99',    ITEM_NM: 'L-Methionine 99% (분말)',      SALES_GRP_CD: 'AN',  SML_GRP_NM: '메티오닌',     PM_ADD_YN: 'N', errorCols: [] },
  { SALES_AREA_CD: 'KR',  SALES_AREA_NM: '한국',         TRADE_TYPE_CD: 'D', TRADE_TYPE_NM: '내수',   ITEM_CD: 'L-ARG-99',    ITEM_NM: 'L-Arginine 99% (분말)',        SALES_GRP_CD: 'BMS', SML_GRP_NM: '아르기닌',     PM_ADD_YN: 'Y', errorCols: [] },
];

function pmStyle(row, field) {
  if (row.errorCols && row.errorCols.includes(field)) {
    return { backgroundColor: '#ffcdd2', color: '#b71c1c', fontWeight: 700 };
  }
  if (['SALES_AREA_CD','TRADE_TYPE_CD','ITEM_CD'].includes(field)) {
    if (row.PM_ADD_YN === 'N') return { backgroundColor: '#ffffff', color: '#999999' };
    if (row.PM_ADD_YN === 'Y') return { backgroundColor: '#fff9c4' };
  }
  return {};
}

export default function CjboDpPmAccountMockup() {
  return (
    <MockShell patternCode="cjbo_dp_pm_account"
      patternLabel="CJBO — PM 거래처-품목 등록 (DpPmAccount)"
      layoutCategory="LAYOUT_SINGLE"
      description="PM 거래처 — 사용자(PM)가 담당하는 판매지역×거래유형×품목 매핑 관리.">

      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <TextField label={`${L.SALES_AREA_CD.ko} (multiSelect)`} size="small" select value="ALL" sx={{ width: 170 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="KR">한국</MenuItem><MenuItem value="VN">베트남</MenuItem>
            <MenuItem value="ID">인도네시아</MenuItem>
          </TextField>
          <TextField label={`${L.SALES_GRP_CD.ko} (multiSelect)`} size="small" select value="ALL" sx={{ width: 170 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="AN">AN</MenuItem><MenuItem value="TN">TN</MenuItem><MenuItem value="BMS">BMS</MenuItem>
          </TextField>
          <TextField label="ItemSearchInput (PH1)" size="small" value="전체" sx={{ width: 220 }}
            InputProps={{ endAdornment: <Box sx={{ width: 24, textAlign: 'center', color: 'text.secondary' }}>🔍</Box> }} />
          <TextField label={`${L.PM_ADD_YN.ko} (DP_PM_ADD_YN)`} size="small" select value="ALL" sx={{ width: 140 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="Y">Y</MenuItem><MenuItem value="N">N</MenuItem>
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
          <Button variant="outlined" size="small" startIcon={<RefreshIcon />}>새로고침</Button>
        </Stack>
      </Box>

      <Box sx={{ px: 1.5, py: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Button size="small" startIcon={<FileDownloadIcon />} variant="outlined">엑셀 다운로드</Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button size="small" startIcon={<AddIcon />} variant="outlined" color="primary">행 추가 (PM_ADD_YN='Y')</Button>
        <Button size="small" startIcon={<DeleteIcon />} variant="outlined" color="error">행 삭제</Button>
        <Button size="small" startIcon={<SaveIcon />} variant="contained" color="primary">저장</Button>
      </Box>

      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
        <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', gap: 1, alignItems: 'center' }}>
            <Box sx={{ flexGrow: 1 }} />
            <Chip size="small" label={`PM 추가 ${ROWS.filter(r => r.PM_ADD_YN === 'Y').length}건`} sx={{ backgroundColor: '#fff9c4', height: 18, fontSize: 10 }} />
            <Chip size="small" label={`기본 ${ROWS.filter(r => r.PM_ADD_YN === 'N').length}건`} variant="outlined" sx={{ height: 18, fontSize: 10 }} />
          </Box>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {[
                    L.SALES_AREA_CD.ko, L.SALES_AREA_NM.ko, L.TRADE_TYPE_CD.ko, L.TRADE_TYPE_NM.ko,
                    L.ITEM_CD.ko, L.ITEM_NM.ko, L.SALES_GRP_CD.ko, L.SML_GRP_NM.ko, L.PM_ADD_YN.ko,
                    'CREATE_BY', 'CREATE_DTTM', 'MODIFY_BY', 'MODIFY_DTTM',
                  ].map((c) => (
                    <TableCell key={c} sx={{ backgroundColor: 'grey.100', fontWeight: 700, fontSize: 11, py: 0.5,
                      textAlign: c === L.PM_ADD_YN.ko ? 'center' : 'left' }}>{c}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {ROWS.map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={pmStyle(r, 'SALES_AREA_CD')}>{r.SALES_AREA_CD}</TableCell>
                    <TableCell>{r.SALES_AREA_NM}</TableCell>
                    <TableCell sx={pmStyle(r, 'TRADE_TYPE_CD')}>{r.TRADE_TYPE_CD}</TableCell>
                    <TableCell>{r.TRADE_TYPE_NM}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', ...pmStyle(r, 'ITEM_CD') }}>{r.ITEM_CD}</TableCell>
                    <TableCell>{r.ITEM_NM}</TableCell>
                    <TableCell>
                      <Chip size="small" label={r.SALES_GRP_CD} variant="outlined" sx={{ height: 18, fontSize: 10 }} />
                    </TableCell>
                    <TableCell>{r.SML_GRP_NM}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Chip size="small" label={r.PM_ADD_YN}
                        sx={{ height: 18, fontSize: 10, fontWeight: 700,
                          backgroundColor: r.PM_ADD_YN === 'Y' ? '#fff9c4' : '#eeeeee',
                          color: r.PM_ADD_YN === 'Y' ? '#e65100' : '#666' }} />
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', color: 'text.secondary', fontSize: 12 }}>admin</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', color: 'text.secondary', fontSize: 11 }}>2026-06-04 09:30:18</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', color: 'text.secondary', fontSize: 12 }}>{r.PM_ADD_YN === 'Y' ? 'pm_user' : 'admin'}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', color: 'text.secondary', fontSize: 11 }}>2026-06-04 14:22:08</TableCell>
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
