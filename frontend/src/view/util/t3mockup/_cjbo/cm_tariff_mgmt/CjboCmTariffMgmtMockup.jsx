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
import FileUploadIcon from '@mui/icons-material/FileUpload';
import RefreshIcon from '@mui/icons-material/Refresh';
import MockShell from '../../_shared/MockShell';

// CJBO — Tariff 관리 등록 (CmTariffMgmt.jsx)
// 소스 기반 재작성. 절대 추측 없음.
// path: view/demandplan/service/cmtariffmgmt/CmTariffMgmt.jsx
// 데이터 SP: POST demandplan/cmtariffmgmt/{q1,s1,d1}
// 콤보 SP: SP_CUSTOM_SRH_COMBO_LIST_Q (DP_SALES_AREA · CB_DP_SALES_GRP · CB_CM_TARIFF_GBN · DP_CURRENCY · CB_CM_TARIFF_UNIT)

// 화면에 사용되는 i18n key + 추론 한글 라벨 (소스의 i18n key는 monospace 캡션 처리)
const L = {
  SALES_AREA_CD:   { ko: '판매지역',     key: 'SALES_AREA_CD' },
  SALES_AREA_NM:   { ko: '판매지역명',   key: 'UI_CM_TARIFF_MGMT_SALES_AREA_NM' },
  SALES_GRP_CD:    { ko: '사업담당',     key: 'SALES_GRP_CD' },
  ITEM_LVL_CD:     { ko: '품목 레벨',    key: 'UI_CM_TARIFF_MGMT_ITEM_LVL_CD' },
  ITEM_LVL_NM:     { ko: '품목 레벨명',  key: 'UI_CM_TARIFF_MGMT_ITEM_LVL_NM' },
  ITEM_MGMT_CD:    { ko: '관리코드',     key: 'UI_CM_TARIFF_MGMT_ITEM_MGMT_CD' },
  SML_GRP_NM:      { ko: '소분류명',     key: 'UI_CM_TARIFF_MGMT_SML_GRP_NM' },
  HS_CD:           { ko: 'HS코드',       key: 'UI_CM_TARIFF_MGMT_HS_CD' },
  TARIFF_GBN_CD:   { ko: '관세구분',     key: 'UI_CM_TARIFF_MGMT_TARIFF_GBN_CD' },
  TARIFF_GBN_NM:   { ko: '관세구분명',   key: 'UI_CM_TARIFF_MGMT_TARIFF_GBN_NM' },
  FROM_DT:         { ko: '시작일',       key: 'UI_CM_TARIFF_MGMT_FROM_DT' },
  TO_DT:           { ko: '종료일',       key: 'UI_CM_TARIFF_MGMT_TO_DT' },
  AMT_TITLE:       { ko: '금액기준',     key: 'UI_CM_TARIFF_MGMT_AMT_TITLE' },
  AMT_APPLY_RTO:   { ko: '적용율(%)',    key: 'UI_CM_TARIFF_MGMT_AMT_APPLY_RTO' },
  AMT_TOT_RTO:     { ko: '총 적용율',    key: 'UI_CM_TARIFF_MGMT_AMT_TOT_RTO' },
  QTY_TITLE:       { ko: '수량기준',     key: 'UI_CM_TARIFF_MGMT_QTY_TITLE' },
  QTY_APPLY_AMT:   { ko: '적용금액',     key: 'UI_CM_TARIFF_MGMT_QTY_APPLY_AMT' },
  QTY_CUR_CD:      { ko: '통화',         key: 'UI_CM_TARIFF_MGMT_QTY_APPLY_CUR_CD' },
  QTY_APPLY_WT:    { ko: '적용중량',     key: 'UI_CM_TARIFF_MGMT_QTY_APPLY_WT' },
  QTY_UNIT_CD:     { ko: '중량단위',     key: 'UI_CM_TARIFF_MGMT_QTY_APPLY_UNIT_CD' },
  STND_DATE:       { ko: '기준일자',     key: 'STND_DATE' },
};

// 샘플 데이터 — 컬럼 구조는 소스 그대로. 값은 placeholder (운영 SP 가 채움).
// styleCallback 규칙:
//   - TARIFF_GBN_CD='S' (소스 line 24-31) → TO_DT 배경 흰색 + 편집 불가
//   - row.ERROR_COLS 에 fieldName 포함 → 해당 셀 Back_RED04
const ROWS = [
  { SALES_AREA_CD: 'KR',  SALES_AREA_NM: '한국',         ITEM_LVL_CD: 'PH3-LYS', ITEM_LVL_NM: '라이신 (Lysine)',     ITEM_MGMT_CD: 'LYS',  SALES_GRP_CD: 'AN',  SML_GRP_NM: 'L-Lysine 78% (액상)',     HS_CD: '2922.41', TARIFF_GBN_CD: 'S', TARIFF_GBN_NM: '국제관세',   FROM_DT: '2026-01-01', TO_DT: '2026-12-31', AMT_APPLY_RTO:  8.0, AMT_TOT_RTO:  8.0, QTY_APPLY_AMT: null,  QTY_CUR_CD: '',    QTY_APPLY_WT: null, QTY_UNIT_CD: '', errorCols: [] },
  { SALES_AREA_CD: 'VN',  SALES_AREA_NM: '베트남',       ITEM_LVL_CD: 'PH3-LYS', ITEM_LVL_NM: '라이신 (Lysine)',     ITEM_MGMT_CD: 'LYS',  SALES_GRP_CD: 'AN',  SML_GRP_NM: 'L-Lysine HCl 98% (분말)', HS_CD: '2922.41', TARIFF_GBN_CD: 'F', TARIFF_GBN_NM: 'FTA협정',    FROM_DT: '2026-01-01', TO_DT: '9999-12-31', AMT_APPLY_RTO:  0.0, AMT_TOT_RTO:  0.0, QTY_APPLY_AMT: null,  QTY_CUR_CD: '',    QTY_APPLY_WT: null, QTY_UNIT_CD: '', errorCols: [] },
  { SALES_AREA_CD: 'ID',  SALES_AREA_NM: '인도네시아',   ITEM_LVL_CD: 'PH3-TRP', ITEM_LVL_NM: '트립토판 (Tryptophan)',ITEM_MGMT_CD: 'TRP',  SALES_GRP_CD: 'AN',  SML_GRP_NM: 'L-Tryptophan 98% (분말)', HS_CD: '2933.99', TARIFF_GBN_CD: 'N', TARIFF_GBN_NM: '국가관세',   FROM_DT: '2026-04-01', TO_DT: '2026-12-31', AMT_APPLY_RTO:  5.0, AMT_TOT_RTO:  5.0, QTY_APPLY_AMT: null,  QTY_CUR_CD: '',    QTY_APPLY_WT: null, QTY_UNIT_CD: '', errorCols: [] },
  { SALES_AREA_CD: 'US',  SALES_AREA_NM: '미국',         ITEM_LVL_CD: 'PH3-MET', ITEM_LVL_NM: '메티오닌 (Methionine)',ITEM_MGMT_CD: 'MET',  SALES_GRP_CD: 'AN',  SML_GRP_NM: 'L-Methionine 99% (분말)', HS_CD: '2930.40', TARIFF_GBN_CD: 'N', TARIFF_GBN_NM: '국가관세',   FROM_DT: '2026-01-01', TO_DT: '2026-12-31', AMT_APPLY_RTO:  6.4, AMT_TOT_RTO:  6.4, QTY_APPLY_AMT: null,  QTY_CUR_CD: '',    QTY_APPLY_WT: null, QTY_UNIT_CD: '', errorCols: [] },
  { SALES_AREA_CD: 'BR',  SALES_AREA_NM: '브라질',       ITEM_LVL_CD: 'PH3-THR', ITEM_LVL_NM: '트레오닌 (Threonine)', ITEM_MGMT_CD: 'THR',  SALES_GRP_CD: 'AN',  SML_GRP_NM: 'L-Threonine 98.5% (분말)',HS_CD: '2922.50', TARIFF_GBN_CD: 'Q', TARIFF_GBN_NM: '수량기준',   FROM_DT: '2026-01-01', TO_DT: '2026-12-31', AMT_APPLY_RTO: null, AMT_TOT_RTO: null, QTY_APPLY_AMT: 0.085, QTY_CUR_CD: 'USD', QTY_APPLY_WT:1.0,   QTY_UNIT_CD: 'KG', errorCols: [] },
  { SALES_AREA_CD: 'CN',  SALES_AREA_NM: '중국',         ITEM_LVL_CD: 'PH3-VAL', ITEM_LVL_NM: '발린 (Valine)',        ITEM_MGMT_CD: 'VAL',  SALES_GRP_CD: 'AN',  SML_GRP_NM: 'L-Valine 96.5% (분말)',   HS_CD: '2922.49', TARIFF_GBN_CD: 'N', TARIFF_GBN_NM: '국가관세',   FROM_DT: '2026-01-01', TO_DT: '9999-12-31', AMT_APPLY_RTO: 12.0, AMT_TOT_RTO: 12.0, QTY_APPLY_AMT: null,  QTY_CUR_CD: '',    QTY_APPLY_WT: null, QTY_UNIT_CD: '', errorCols: ['HS_CD'] },
  { SALES_AREA_CD: 'PH',  SALES_AREA_NM: '필리핀',       ITEM_LVL_CD: 'PH3-LYS', ITEM_LVL_NM: '라이신 (Lysine)',     ITEM_MGMT_CD: 'LYS',  SALES_GRP_CD: 'AN',  SML_GRP_NM: 'L-Lysine 78% (액상)',     HS_CD: '2922.41', TARIFF_GBN_CD: 'F', TARIFF_GBN_NM: 'FTA협정',    FROM_DT: '2026-06-01', TO_DT: '2026-12-31', AMT_APPLY_RTO:  3.0, AMT_TOT_RTO:  3.0, QTY_APPLY_AMT: null,  QTY_CUR_CD: '',    QTY_APPLY_WT: null, QTY_UNIT_CD: '', errorCols: [] },
  { SALES_AREA_CD: 'JP',  SALES_AREA_NM: '일본',         ITEM_LVL_CD: 'PH3-MET', ITEM_LVL_NM: '메티오닌 (Methionine)',ITEM_MGMT_CD: 'MET',  SALES_GRP_CD: 'AN',  SML_GRP_NM: 'L-Methionine 99% (분말)', HS_CD: '2930.40', TARIFF_GBN_CD: 'S', TARIFF_GBN_NM: '국제관세',   FROM_DT: '2026-01-01', TO_DT: '9999-12-31', AMT_APPLY_RTO:  3.2, AMT_TOT_RTO:  3.2, QTY_APPLY_AMT: null,  QTY_CUR_CD: '',    QTY_APPLY_WT: null, QTY_UNIT_CD: '', errorCols: [] },
];

// styleCallback 모사
function cellStyle(row, field) {
  // ERROR_COLS 우선 (소스 line 32-34)
  if (row.errorCols && row.errorCols.includes(field)) {
    return { backgroundColor: '#ffcdd2', color: '#b71c1c', fontWeight: 700 };
  }
  // TO_DT + TARIFF_GBN_CD='S' → Back_White + 편집불가 (소스 line 24-31)
  if (field === 'TO_DT' && row.TARIFF_GBN_CD === 'S') {
    return { backgroundColor: '#ffffff', color: '#999999' };
  }
  return {};
}

function HeaderCell({ children, sx, ...rest }) {
  return <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, fontSize: 11, py: 0.5, ...sx }} {...rest}>{children}</TableCell>;
}

export default function CjboCmTariffMgmtMockup() {
  return (
    <MockShell patternCode="cjbo_cm_tariff_mgmt"
      patternLabel="CJBO — Tariff 관리 등록 (CmTariffMgmt)"
      layoutCategory="LAYOUT_SINGLE"
      description="UI_CM_TARIFF_MGMT — 판매지역 × 품목 LV × HS코드 × 관세구분(국제/국가/FTA/수량기준) 기간별 관세 마스터. 28컬럼(13 hidden) + 금액기준/수량기준 group header. POST demandplan/cmtariffmgmt/q1,s1,d1.">
      {/* ─── SearchArea (소스 그대로) ─────────────────────────────────── */}
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label={`${L.SALES_AREA_CD.ko} (multiSelect)`} size="small" select value="ALL" sx={{ width: 170 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="KR">한국</MenuItem><MenuItem value="VN">베트남</MenuItem>
            <MenuItem value="ID">인도네시아</MenuItem><MenuItem value="US">미국</MenuItem>
          </TextField>
          <TextField label={`${L.SALES_GRP_CD.ko} (multiSelect)`} size="small" select value="ALL" sx={{ width: 170 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="AN">AN</MenuItem><MenuItem value="TN">TN</MenuItem><MenuItem value="BMS">BMS</MenuItem>
          </TextField>
          <TextField label="ItemSearchInput (PH1)" size="small" value="전체" sx={{ width: 220 }}
            InputProps={{ endAdornment: <Box sx={{ width: 24, textAlign: 'center', color: 'text.secondary' }}>🔍</Box> }} />
          <TextField label={L.HS_CD.ko} size="small" placeholder="2922.41" sx={{ width: 140 }} />
          <TextField label={L.STND_DATE.ko} size="small" type="date" value="2026-06-04" sx={{ width: 160 }} InputLabelProps={{ shrink: true }} />
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
          <Button variant="outlined" size="small" startIcon={<RefreshIcon />}>새로고침</Button>
        </Stack>
      </Box>

      {/* ─── ButtonArea (Left/Right, 소스 그대로) ───────────────────────── */}
      <Box sx={{ px: 1.5, py: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
        {/* LeftButtonArea */}
        <Button size="small" startIcon={<FileDownloadIcon />} variant="outlined">엑셀 다운로드</Button>
        <Button size="small" startIcon={<FileUploadIcon />} variant="outlined">엑셀 업로드</Button>
        <Box sx={{ flexGrow: 1 }} />
        {/* RightButtonArea */}
        <Button size="small" startIcon={<AddIcon />} variant="outlined">행 추가</Button>
        <Button size="small" startIcon={<DeleteIcon />} variant="outlined" color="error">행 삭제</Button>
        <Button size="small" startIcon={<SaveIcon />} variant="contained" color="primary">저장</Button>
      </Box>

      {/* ─── ResultArea : BaseGrid id="grid1" ────────────────────────── */}
      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
        <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                {/* 1단 헤더 — 그룹 표시 */}
                <TableRow>
                  <HeaderCell rowSpan={2}>{L.SALES_AREA_CD.ko}</HeaderCell>
                  <HeaderCell rowSpan={2}>{L.SALES_AREA_NM.ko}</HeaderCell>
                  <HeaderCell rowSpan={2}>{L.ITEM_LVL_CD.ko}</HeaderCell>
                  <HeaderCell rowSpan={2}>{L.ITEM_LVL_NM.ko}</HeaderCell>
                  <HeaderCell rowSpan={2}>{L.ITEM_MGMT_CD.ko}</HeaderCell>
                  <HeaderCell rowSpan={2}>{L.SALES_GRP_CD.ko}</HeaderCell>
                  <HeaderCell rowSpan={2}>{L.SML_GRP_NM.ko}</HeaderCell>
                  <HeaderCell rowSpan={2}>{L.HS_CD.ko}</HeaderCell>
                  <HeaderCell rowSpan={2}>{L.TARIFF_GBN_CD.ko}</HeaderCell>
                  <HeaderCell rowSpan={2}>{L.TARIFF_GBN_NM.ko}</HeaderCell>
                  <HeaderCell rowSpan={2} sx={{ textAlign: 'center' }}>{L.FROM_DT.ko}</HeaderCell>
                  <HeaderCell rowSpan={2} sx={{ textAlign: 'center' }}>{L.TO_DT.ko}</HeaderCell>
                  <HeaderCell colSpan={2} sx={{ backgroundColor: '#e3f2fd', textAlign: 'center' }}>
                    {L.AMT_TITLE.ko}
                    <Typography variant="caption" sx={{ display: 'block', fontFamily: 'monospace', color: 'text.secondary', fontSize: 9, lineHeight: 1 }}>group: QTY_TITLE</Typography>
                  </HeaderCell>
                  <HeaderCell colSpan={4} sx={{ backgroundColor: '#fff3e0', textAlign: 'center' }}>
                    {L.QTY_TITLE.ko}
                    <Typography variant="caption" sx={{ display: 'block', fontFamily: 'monospace', color: 'text.secondary', fontSize: 9, lineHeight: 1 }}>group: QTY_TITLE</Typography>
                  </HeaderCell>
                  <HeaderCell rowSpan={2}>CREATE_BY</HeaderCell>
                  <HeaderCell rowSpan={2}>MODIFY_BY</HeaderCell>
                </TableRow>
                {/* 2단 헤더 — 그룹 child */}
                <TableRow>
                  <HeaderCell sx={{ backgroundColor: '#e3f2fd', textAlign: 'right' }}>{L.AMT_APPLY_RTO.ko}</HeaderCell>
                  <HeaderCell sx={{ backgroundColor: '#e3f2fd', textAlign: 'right' }}>{L.AMT_TOT_RTO.ko}</HeaderCell>
                  <HeaderCell sx={{ backgroundColor: '#fff3e0', textAlign: 'right' }}>{L.QTY_APPLY_AMT.ko}</HeaderCell>
                  <HeaderCell sx={{ backgroundColor: '#fff3e0', textAlign: 'center' }}>{L.QTY_CUR_CD.ko}</HeaderCell>
                  <HeaderCell sx={{ backgroundColor: '#fff3e0', textAlign: 'right' }}>{L.QTY_APPLY_WT.ko}</HeaderCell>
                  <HeaderCell sx={{ backgroundColor: '#fff3e0', textAlign: 'center' }}>{L.QTY_UNIT_CD.ko}</HeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ROWS.map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={cellStyle(r, 'SALES_AREA_CD')}>{r.SALES_AREA_CD}</TableCell>
                    <TableCell>{r.SALES_AREA_NM}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', ...cellStyle(r, 'ITEM_LVL_CD') }}>{r.ITEM_LVL_CD}</TableCell>
                    <TableCell>{r.ITEM_LVL_NM}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{r.ITEM_MGMT_CD}</TableCell>
                    <TableCell>
                      <Chip size="small" label={r.SALES_GRP_CD} variant="outlined" sx={{ height: 18, fontSize: 10 }} />
                    </TableCell>
                    <TableCell>{r.SML_GRP_NM}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', ...cellStyle(r, 'HS_CD') }}>{r.HS_CD}</TableCell>
                    <TableCell sx={cellStyle(r, 'TARIFF_GBN_CD')}>
                      <Chip size="small" label={r.TARIFF_GBN_CD} sx={{ height: 18, fontSize: 10 }}
                        color={r.TARIFF_GBN_CD === 'F' ? 'success' : r.TARIFF_GBN_CD === 'S' ? 'info' : r.TARIFF_GBN_CD === 'Q' ? 'warning' : 'default'} />
                    </TableCell>
                    <TableCell>{r.TARIFF_GBN_NM}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 12 }}>{r.FROM_DT}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 12, ...cellStyle(r, 'TO_DT') }}>{r.TO_DT}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.AMT_APPLY_RTO != null ? r.AMT_APPLY_RTO.toFixed(1) : '-'}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', color: 'text.secondary' }}>{r.AMT_TOT_RTO != null ? r.AMT_TOT_RTO.toFixed(1) : '-'}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.QTY_APPLY_AMT != null ? r.QTY_APPLY_AMT.toFixed(3) : '-'}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 12 }}>{r.QTY_CUR_CD || '-'}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.QTY_APPLY_WT != null ? r.QTY_APPLY_WT.toFixed(1) : '-'}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 12 }}>{r.QTY_UNIT_CD || '-'}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', color: 'text.secondary', fontSize: 12 }}>admin</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', color: 'text.secondary', fontSize: 12 }}>admin</TableCell>
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
