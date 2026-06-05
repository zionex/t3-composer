import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography, Paper, Chip, Checkbox,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import MockShell from '../../_shared/MockShell';

const CHK_COLS = ['CHK_STATUS','CHK_BOOKING','CHK_BOOKING_CONFI','CHK_INSPECTION','CHK_CNTR','CHK_STUFFING','CHK_DO','CHK_SHIPMENT','CHK_BILLING','CHK_CONDITION','CHK_HOLD','CHK_NF_ISSUE','CHK_REV','CHK_COMBINED','CHK_PRIORTY','CHK_NOTE'];

const STUFFING_ROWS = [
  { STATUS_FLAG: 'OPEN',     STUFFING_ID: 'STF-2026062501', STUFFING_ITEM: 1, STUFFING_SEQ: 1, PROD_PLANT_CD: 'KR-PLT1', PROD_PLANT_NM: '한국 사업장1', PROD_LOCAT_CD: 'KR-BSN', PROD_LOCAT_NM: '부산항',   SALES_CORP_CD: 'CJBO-VN', SALES_PLANT_CD: 'VN-HCM',   ODR_SALES_MONTH: '2026-06', ODR_STUFFING_DATE: '06-15-2026', ODR_ORDER_TYPE: 'STD',     ODR_BILLING_DOC: 'B-2026-0042',
    chk: { CHK_STATUS: true,  CHK_BOOKING: true,  CHK_BOOKING_CONFI: true,  CHK_INSPECTION: true,  CHK_CNTR: true,  CHK_STUFFING: true,  CHK_DO: false, CHK_SHIPMENT: false, CHK_BILLING: false, CHK_CONDITION: false, CHK_HOLD: false, CHK_NF_ISSUE: false, CHK_REV: false, CHK_COMBINED: false, CHK_PRIORTY: false, CHK_NOTE: false } },
  { STATUS_FLAG: 'PENDING',  STUFFING_ID: 'STF-2026062502', STUFFING_ITEM: 1, STUFFING_SEQ: 1, PROD_PLANT_CD: 'KR-PLT1', PROD_PLANT_NM: '한국 사업장1', PROD_LOCAT_CD: 'KR-GY',  PROD_LOCAT_NM: '광양항',   SALES_CORP_CD: 'CJBO-ID', SALES_PLANT_CD: 'ID-JKT',   ODR_SALES_MONTH: '2026-06', ODR_STUFFING_DATE: '06-18-2026', ODR_ORDER_TYPE: 'PROMO',   ODR_BILLING_DOC: 'B-2026-0028',
    chk: { CHK_STATUS: true,  CHK_BOOKING: true,  CHK_BOOKING_CONFI: false, CHK_INSPECTION: false, CHK_CNTR: false, CHK_STUFFING: false, CHK_DO: false, CHK_SHIPMENT: false, CHK_BILLING: false, CHK_CONDITION: false, CHK_HOLD: false, CHK_NF_ISSUE: false, CHK_REV: false, CHK_COMBINED: false, CHK_PRIORTY: true,  CHK_NOTE: false } },
  { STATUS_FLAG: 'COMPLETE', STUFFING_ID: 'STF-2026060103', STUFFING_ITEM: 2, STUFFING_SEQ: 1, PROD_PLANT_CD: 'VN-PLT1', PROD_PLANT_NM: 'Bio-VN',       PROD_LOCAT_CD: 'VN-HPH', PROD_LOCAT_NM: '하이퐁항', SALES_CORP_CD: 'CJBO-US', SALES_PLANT_CD: 'US-LAX',   ODR_SALES_MONTH: '2026-06', ODR_STUFFING_DATE: '06-01-2026', ODR_ORDER_TYPE: 'STD',     ODR_BILLING_DOC: 'B-2026-0015',
    chk: { CHK_STATUS: true,  CHK_BOOKING: true,  CHK_BOOKING_CONFI: true,  CHK_INSPECTION: true,  CHK_CNTR: true,  CHK_STUFFING: true,  CHK_DO: true,  CHK_SHIPMENT: true,  CHK_BILLING: true,  CHK_CONDITION: false, CHK_HOLD: false, CHK_NF_ISSUE: false, CHK_REV: false, CHK_COMBINED: false, CHK_PRIORTY: false, CHK_NOTE: false } },
];

const STATUS_INFO = { OPEN: { color: 'info' }, PENDING: { color: 'warning' }, COMPLETE: { color: 'success' } };

export default function CjboMpStuffingFileMockup() {
  return (
    <MockShell patternCode="cjbo_mp_stuffing_file"
      patternLabel="CJBO — Stuffing File"
      layoutCategory="LAYOUT_SINGLE"
      description="생산법인 + 일반정보(16개 CHK_* boolean 세로 헤더) + 일자정보 + 주문정보. 행 추가/수정/저장.">

      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="인터페이스" size="small" disabled value="STF-2026-06" sx={{ width: 160 }} />
          <TextField label="법인" size="small" select value="CJBO" sx={{ width: 150 }}>
            <MenuItem value="CJBO">CJBO</MenuItem>
          </TextField>
          <TextField label="유통 채널" size="small" select value="EXP" sx={{ width: 120 }}>
            <MenuItem value="EXP">수출</MenuItem><MenuItem value="DOM">내수</MenuItem>
          </TextField>
          <TextField label="인보이스 번호" size="small" sx={{ width: 150 }} />
          <TextField label="판매 월" size="small" select value="2026-06" sx={{ width: 150 }}>
            <MenuItem value="2026-06">2026-06</MenuItem>
          </TextField>
          <TextField label="일자 기준" size="small" select value="STUFFING" sx={{ width: 140 }}>
            <MenuItem value="STUFFING">Stuffing 일</MenuItem>
          </TextField>
          <TextField label="Stuffing 기간" size="small" value="06-01-2026 ~ 06-30-2026" sx={{ width: 230 }} />
          <TextField label="지역" size="small" select value="ALL" sx={{ width: 160 }}>
            <MenuItem value="ALL">전체</MenuItem>
          </TextField>
          <TextField label="국가" size="small" select value="ALL" sx={{ width: 170 }}>
            <MenuItem value="ALL">전체</MenuItem>
          </TextField>
          <TextField label="PH1" size="small" select value="ALL" sx={{ width: 110 }}><MenuItem value="ALL">전체</MenuItem></TextField>
          <TextField label="주문 상태" size="small" select value="ALL" sx={{ width: 150 }}><MenuItem value="ALL">전체</MenuItem></TextField>
          <Checkbox size="small" /><Typography variant="caption">Dummy</Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
        </Stack>
      </Box>
      <Box sx={{ px: 1.5, py: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', gap: 0.5, alignItems: 'center', flexWrap: 'wrap' }}>
        <Button size="small" startIcon={<FileDownloadIcon />} variant="outlined">엑셀 다운로드</Button>
        <Button size="small" startIcon={<FileUploadIcon />} variant="outlined">엑셀 업로드</Button>
        <Button size="small" variant="outlined">전체 펼침/접기</Button>
        <Button size="small" variant="outlined">선박</Button>
        <Button size="small" variant="outlined">담당자</Button>
        <Button size="small" variant="outlined">데이터 검증</Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button size="small" startIcon={<AddIcon />} variant="outlined">Dummy 추가</Button>
        <Button size="small" startIcon={<AddIcon />} variant="outlined">생산 추가</Button>
        <Button size="small" startIcon={<DeleteIcon />} variant="outlined" color="error">삭제</Button>
        <Button size="small" startIcon={<SaveIcon />} variant="contained">저장</Button>
      </Box>
      <Box sx={{ p: 1.5, flex: 1, overflow: 'hidden' }}>
        <Paper variant="outlined" sx={{ height: '100%' }}>
          <TableContainer sx={{ height: '100%' }}>
            <Table size="small" stickyHeader sx={{ '& th, & td': { fontSize: 10, py: 0.5, whiteSpace: 'nowrap' } }}>
              <TableHead>
                <TableRow>
                  <TableCell rowSpan={2} sx={{ backgroundColor: 'grey.100', fontWeight: 700 }}>상태</TableCell>
                  <TableCell rowSpan={2} sx={{ backgroundColor: 'grey.100', fontWeight: 700 }}>Stuffing ID / Item / Seq</TableCell>
                  <TableCell colSpan={5} sx={{ backgroundColor: '#e3f2fd', textAlign: 'center', fontWeight: 700 }}>생산 법인</TableCell>
                  <TableCell colSpan={CHK_COLS.length} sx={{ backgroundColor: '#fff9c4', textAlign: 'center', fontWeight: 700 }}>일반 정보</TableCell>
                  <TableCell colSpan={2} sx={{ backgroundColor: '#dcedc8', textAlign: 'center', fontWeight: 700 }}>일자 정보</TableCell>
                  <TableCell colSpan={2} sx={{ backgroundColor: '#ffe0b2', textAlign: 'center', fontWeight: 700 }}>주문 정보</TableCell>
                </TableRow>
                <TableRow>
                  {['생산공장 코드','생산공장 명','생산지점 코드','생산지점 명','판매법인 코드'].map((c) => (
                    <TableCell key={c} sx={{ backgroundColor: '#e3f2fd', fontWeight: 700, fontSize: 9 }}>{c}</TableCell>
                  ))}
                  {CHK_COLS.map((c) => (
                    <TableCell key={c} sx={{ backgroundColor: '#fff9c4', fontWeight: 700, fontSize: 8,
                      writingMode: 'vertical-rl', textOrientation: 'mixed', minWidth: 24, maxWidth: 26, p: 0.5, textAlign: 'center' }}>{c.replace('CHK_', '')}</TableCell>
                  ))}
                  <TableCell sx={{ backgroundColor: '#dcedc8', fontWeight: 700, fontSize: 9 }}>판매 월</TableCell>
                  <TableCell sx={{ backgroundColor: '#dcedc8', fontWeight: 700, fontSize: 9 }}>Stuffing 일</TableCell>
                  <TableCell sx={{ backgroundColor: '#ffe0b2', fontWeight: 700, fontSize: 9 }}>주문 유형</TableCell>
                  <TableCell sx={{ backgroundColor: '#ffe0b2', fontWeight: 700, fontSize: 9 }}>청구 번호</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {STUFFING_ROWS.map((r, i) => {
                  const sInfo = STATUS_INFO[r.STATUS_FLAG] || { color: 'default' };
                  return (
                    <TableRow key={i} hover>
                      <TableCell><Chip size="small" label={r.STATUS_FLAG} color={sInfo.color} sx={{ height: 18, fontSize: 9 }} /></TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{r.STUFFING_ID} / {r.STUFFING_ITEM} / {r.STUFFING_SEQ}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{r.PROD_PLANT_CD}</TableCell>
                      <TableCell>{r.PROD_PLANT_NM}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{r.PROD_LOCAT_CD}</TableCell>
                      <TableCell>{r.PROD_LOCAT_NM}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{r.SALES_CORP_CD}</TableCell>
                      {CHK_COLS.map((c) => (
                        <TableCell key={c} sx={{ textAlign: 'center', p: 0.25 }}>
                          <Checkbox size="small" checked={r.chk[c]} sx={{ p: 0 }} />
                        </TableCell>
                      ))}
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: 10 }}>{r.ODR_SALES_MONTH}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: 10 }}>{r.ODR_STUFFING_DATE}</TableCell>
                      <TableCell><Chip size="small" label={r.ODR_ORDER_TYPE} variant="outlined" sx={{ height: 16, fontSize: 9 }} /></TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{r.ODR_BILLING_DOC}</TableCell>
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
