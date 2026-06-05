import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography, Paper, Chip, Checkbox,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import RefreshIcon from '@mui/icons-material/Refresh';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import MockShell from '../../_shared/MockShell';

// CJBO — 거점 변경 관리 (DpLocChange.jsx)
// 소스 기반 재작성.
// path: view/demandplan/service/dplocchange/DpLocChange.jsx
// 데이터 SP: POST demandplan/dplocchange/{q1,s1,d1,locchange}
// 콤보 SP: SP_CUSTOM_SRH_COMBO_LIST_Q (DP_SALES_AREA · CB_DP_LOC_CHANGE · DP_CHANGE_LOCAT_CD)
// styleCallback: P_ID 있는 row (기존) → CHANGE_TYPE/SALES_AREA/FROM_LOC/TO_LOC 셀 Back_White + 편집 불가
// 18 cols (8 hidden). GridDeleteRowButton 없음. DP_BTN_LOC_CHANGE 배치 버튼 있음.

const L = {
  CHANGE_TYPE_CD:  { ko: '변경구분',     key: 'UI_DP_REPORT_CHANGE_TYPE_CD' },
  SALES_AREA_CD:   { ko: '판매지역',     key: 'UI_DP_REPORT_SALES_AREA_CD' },
  SALES_AREA_NM:   { ko: '판매지역명',   key: 'UI_DP_REPORT_SALES_AREA_NM' },
  CHANGE_YM:       { ko: '변경 년월',    key: 'UI_DP_REPORT_CHANGE_YM' },
  FROM_LOC_CD:     { ko: '변경전 거점',  key: 'UI_DP_REPORT_FROM_LOC_CD' },
  FROM_LOC_NM:     { ko: '변경전 거점명',key: 'UI_DP_REPORT_FROM_LOC_NM' },
  TO_LOC_CD:       { ko: '변경후 거점',  key: 'UI_DP_REPORT_TO_LOC_CD' },
  TO_LOC_NM:       { ko: '변경후 거점명',key: 'UI_DP_REPORT_TO_LOC_NM' },
  ACTV_YN:         { ko: '활성',         key: 'ACTV_YN' },
  APPLY_DT:        { ko: '적용일',       key: 'UI_DP_REPORT_CHG_APPLY_DT' },
};

// CB_DP_LOC_CHANGE 코드: R = Rep(대표 변경), N = Normal(일반)
const ROWS = [
  { P_ID: 'EXISTING-1', CHANGE_TYPE_CD: 'N', SALES_AREA_CD: 'VN',  SALES_AREA_NM: '베트남',       CHANGE_YM: '2026-07', FROM_LOC_CD: 'CN-SH', FROM_LOC_NM: '중국 상하이 창고',  TO_LOC_CD: 'VN-HCM', TO_LOC_NM: '베트남 호치민 창고',   ACTV_YN: true,  APPLY_DT: '2026-07-01' },
  { P_ID: 'EXISTING-2', CHANGE_TYPE_CD: 'N', SALES_AREA_CD: 'ID',  SALES_AREA_NM: '인도네시아',   CHANGE_YM: '2026-07', FROM_LOC_CD: 'KR-IC', FROM_LOC_NM: '한국 인천항 GLC',   TO_LOC_CD: 'ID-JKT', TO_LOC_NM: '인니 자카르타 창고',   ACTV_YN: true,  APPLY_DT: '2026-07-01' },
  { P_ID: 'EXISTING-3', CHANGE_TYPE_CD: 'R', SALES_AREA_CD: 'US',  SALES_AREA_NM: '미국',         CHANGE_YM: '2026-08', FROM_LOC_CD: 'KR-BSN',FROM_LOC_NM: '한국 부산항 BPA',   TO_LOC_CD: 'US-LAX', TO_LOC_NM: '미국 LA 통합 거점',   ACTV_YN: true,  APPLY_DT: '2026-08-01' },
  { P_ID: null,         CHANGE_TYPE_CD: 'N', SALES_AREA_CD: 'BR',  SALES_AREA_NM: '브라질',       CHANGE_YM: '2026-09', FROM_LOC_CD: 'KR-BSN',FROM_LOC_NM: '한국 부산항 BPA',   TO_LOC_CD: 'BR-SSA', TO_LOC_NM: '브라질 살바도르 창고', ACTV_YN: true,  APPLY_DT: '2026-09-01' },
  { P_ID: null,         CHANGE_TYPE_CD: 'N', SALES_AREA_CD: 'PH',  SALES_AREA_NM: '필리핀',       CHANGE_YM: '2026-08', FROM_LOC_CD: 'KR-GY', FROM_LOC_NM: '한국 광양항 GPA',   TO_LOC_CD: 'PH-MNL', TO_LOC_NM: '필리핀 마닐라 창고',   ACTV_YN: false, APPLY_DT: '' },
  { P_ID: 'EXISTING-4', CHANGE_TYPE_CD: 'R', SALES_AREA_CD: 'CN',  SALES_AREA_NM: '중국',         CHANGE_YM: '2026-07', FROM_LOC_CD: 'CN-SH', FROM_LOC_NM: '중국 상하이 창고',  TO_LOC_CD: 'CN-TJ',  TO_LOC_NM: '중국 톈진 창고',        ACTV_YN: true,  APPLY_DT: '2026-07-01' },
];

function lockedStyle(row) {
  // P_ID 있는 row 의 CHANGE_TYPE/SALES_AREA/FROM_LOC/TO_LOC 셀 → Back_White 편집불가
  if (row.P_ID) return { backgroundColor: '#f5f5f5', color: '#999999' };
  return {};
}

export default function CjboDpLocChangeMockup() {
  return (
    <MockShell patternCode="cjbo_dp_loc_change"
      patternLabel="CJBO — 거점 변경 관리 (DpLocChange)"
      layoutCategory="LAYOUT_SINGLE"
      description="거점 변경 — 변경구분(R/N) × 판매지역 × 변경년월 × FROM/TO 거점. 기존 행은 잠금. 거점 변경 버튼으로 일괄 적용.">

      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <TextField label={`${L.SALES_AREA_CD.ko} (multiSelect)`} size="small" select value="ALL" sx={{ width: 170 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="VN">베트남</MenuItem><MenuItem value="ID">인도네시아</MenuItem>
            <MenuItem value="US">미국</MenuItem><MenuItem value="BR">브라질</MenuItem>
          </TextField>
          <TextField label={L.FROM_LOC_NM.ko} size="small" placeholder="text" sx={{ width: 180 }} />
          <TextField label={L.TO_LOC_NM.ko} size="small" placeholder="text" sx={{ width: 180 }} />
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
          <Button variant="outlined" size="small" startIcon={<RefreshIcon />}>새로고침</Button>
        </Stack>
      </Box>

      <Box sx={{ px: 1.5, py: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Button size="small" startIcon={<FileDownloadIcon />} variant="outlined">엑셀 다운로드</Button>
        <Button size="small" startIcon={<FileUploadIcon />} variant="outlined">엑셀 업로드</Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button size="small" startIcon={<SwapHorizIcon />} variant="contained" color="warning">거점변경 일괄적용</Button>
        <Button size="small" startIcon={<AddIcon />} variant="outlined">행 추가</Button>
        <Button size="small" startIcon={<SaveIcon />} variant="contained" color="primary">저장</Button>
      </Box>

      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
        <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', gap: 1, alignItems: 'center' }}>
            <Box sx={{ flexGrow: 1 }} />
            <Chip size="small" label={`기존 ${ROWS.filter(r => r.P_ID).length}건 (잠금)`} sx={{ height: 18, fontSize: 10, backgroundColor: '#f5f5f5' }} />
            <Chip size="small" label={`신규 ${ROWS.filter(r => !r.P_ID).length}건`} color="primary" variant="outlined" sx={{ height: 18, fontSize: 10 }} />
          </Box>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {[
                    L.CHANGE_TYPE_CD.ko, L.SALES_AREA_CD.ko, L.SALES_AREA_NM.ko, L.CHANGE_YM.ko,
                    L.FROM_LOC_CD.ko, L.FROM_LOC_NM.ko, L.TO_LOC_CD.ko, L.TO_LOC_NM.ko,
                    L.ACTV_YN.ko, L.APPLY_DT.ko,
                    'CREATE_BY', 'CREATE_DTTM', 'MODIFY_BY', 'MODIFY_DTTM',
                  ].map((c) => (
                    <TableCell key={c} sx={{ backgroundColor: 'grey.100', fontWeight: 700, fontSize: 11, py: 0.5,
                      textAlign: [L.CHANGE_TYPE_CD.ko, L.ACTV_YN.ko, L.CHANGE_YM.ko, L.APPLY_DT.ko].includes(c) ? 'center' : 'left' }}>{c}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {ROWS.map((r, i) => {
                  const locked = lockedStyle(r);
                  return (
                    <TableRow key={i} hover>
                      <TableCell sx={{ textAlign: 'center', ...locked }}>
                        <Chip size="small" label={r.CHANGE_TYPE_CD} variant="outlined"
                          color={r.CHANGE_TYPE_CD === 'R' ? 'warning' : 'default'}
                          sx={{ height: 18, fontSize: 10, fontWeight: 700 }} />
                      </TableCell>
                      <TableCell sx={locked}>{r.SALES_AREA_CD}</TableCell>
                      <TableCell>{r.SALES_AREA_NM}</TableCell>
                      <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 12 }}>{r.CHANGE_YM}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', ...locked }}>{r.FROM_LOC_CD}</TableCell>
                      <TableCell>{r.FROM_LOC_NM}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', ...locked }}>{r.TO_LOC_CD}</TableCell>
                      <TableCell sx={{ color: r.P_ID ? undefined : 'success.main', fontWeight: r.P_ID ? undefined : 600 }}>{r.TO_LOC_NM}</TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Checkbox size="small" checked={r.ACTV_YN} disabled sx={{ p: 0 }} />
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 11, color: 'text.secondary' }}>{r.APPLY_DT || '-'}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: 12, color: 'text.secondary' }}>{r.P_ID ? 'admin' : ''}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: 11, color: 'text.secondary' }}>{r.P_ID ? '2026-05-20 10:15' : ''}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: 12, color: 'text.secondary' }}>{r.P_ID ? 'admin' : ''}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: 11, color: 'text.secondary' }}>{r.P_ID ? '2026-06-01 09:42' : ''}</TableCell>
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
