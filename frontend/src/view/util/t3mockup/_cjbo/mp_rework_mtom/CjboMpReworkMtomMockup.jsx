import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Paper, Chip, Checkbox,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import MockShell from '../../_shared/MockShell';

const REWORK_ROWS = [
  { LOCAT_TP_NM: '제조', LOCAT_CD: 'KR-PLT1', LOCAT_NM: '한국 사업장1',  MP_DMND_TYPE: 'REWORK', MP_DMND_TYPE_DTL: 'REPACK', RES_CD: 'P-DRUM-01', RES_DESCRIP: 'Drum 1000L',     REMARK: '용기 변경', FROM_PH3: '78L', FROM_ITEM_CD: 'L-LYS-78L',   FROM_ITEM_NM: 'L-Lysine 78% (액상)',  TO_PH3: '78D',  TO_ITEM_CD: 'L-LYS-78D',  TO_ITEM_NM: 'L-Lysine 78% (Drum)',     QTY: 5.400, TOT_QTY: 162.0, STRT_DATE: '2026-07-01', END_DATE: '2026-07-31', ACTV_YN: true  },
  { LOCAT_TP_NM: '제조', LOCAT_CD: 'KR-PLT1', LOCAT_NM: '한국 사업장1',  MP_DMND_TYPE: 'MTOM',   MP_DMND_TYPE_DTL: 'MIX',    RES_CD: 'R-CRY-01',  RES_DESCRIP: 'Crystallizer #1',REMARK: '결정화 처리', FROM_PH3: '99P', FROM_ITEM_CD: 'L-MET-99B',   FROM_ITEM_NM: 'L-Methionine 99% (벌크)',TO_PH3: '99R',  TO_ITEM_CD: 'L-MET-99R',  TO_ITEM_NM: 'L-Methionine 99% (Retail)',QTY: 2.800, TOT_QTY:  84.0, STRT_DATE: '2026-07-15', END_DATE: '2026-08-31', ACTV_YN: true  },
  { LOCAT_TP_NM: '제조', LOCAT_CD: 'VN-PLT1', LOCAT_NM: 'Bio-VN',         MP_DMND_TYPE: 'REWORK', MP_DMND_TYPE_DTL: 'QC',     RES_CD: 'R-CRY-02',  RES_DESCRIP: 'Crystallizer #2',REMARK: '품질 재처리',FROM_PH3: '98P', FROM_ITEM_CD: 'L-TRP-98',    FROM_ITEM_NM: 'L-Tryptophan 98% (분말)',TO_PH3: '99P',  TO_ITEM_CD: 'L-TRP-99',   TO_ITEM_NM: 'L-Tryptophan 99% (분말)',  QTY: 1.500, TOT_QTY:  30.0, STRT_DATE: '2026-08-01', END_DATE: '2026-09-30', ACTV_YN: true  },
];

export default function CjboMpReworkMtomMockup() {
  return (
    <MockShell patternCode="cjbo_mp_rework_mtom"
      patternLabel="CJBO — 재처리, M to M 계획"
      layoutCategory="LAYOUT_SINGLE"
      description="REWORK/MTOM 유형 × 거점 × 자원 × FROM 품목 → TO 품목 변환 계획. 기간별 QTY/TOT_QTY + 활성 여부.">

      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <TextField label="버전" size="small" select value="V2026-06" sx={{ width: 130 }}>
            <MenuItem value="V2026-06">V2026-06</MenuItem>
          </TextField>
          <TextField label="조회기간" size="small" value="2026-06-01 ~ 2026-09-30" sx={{ width: 230 }} />
          <TextField label="자원" size="small" select value="ALL" sx={{ width: 130 }}><MenuItem value="ALL">전체</MenuItem></TextField>
          <TextField label="PH1" size="small" select value="ALL" sx={{ width: 130 }}><MenuItem value="ALL">전체</MenuItem></TextField>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
        </Stack>
      </Box>
      <Box sx={{ px: 1.5, py: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', gap: 1, alignItems: 'center' }}>
        <Box sx={{ flexGrow: 1 }} />
        <Button size="small" startIcon={<AddIcon />} variant="outlined">행 추가</Button>
        <Button size="small" startIcon={<SaveIcon />} variant="contained">저장</Button>
      </Box>
      <Box sx={{ p: 1.5, flex: 1, overflow: 'hidden' }}>
        <Paper variant="outlined" sx={{ height: '100%' }}>
          <TableContainer sx={{ height: '100%' }}>
            <Table size="small" stickyHeader sx={{ '& th, & td': { fontSize: 11, py: 0.5 } }}>
              <TableHead>
                <TableRow>
                  <TableCell colSpan={4} sx={{ backgroundColor: '#e3f2fd', textAlign: 'center', fontWeight: 700 }}>거점</TableCell>
                  <TableCell colSpan={2} sx={{ backgroundColor: '#fff9c4', textAlign: 'center', fontWeight: 700 }}>수요 유형</TableCell>
                  <TableCell colSpan={3} sx={{ backgroundColor: '#dcedc8', textAlign: 'center', fontWeight: 700 }}>자원</TableCell>
                  <TableCell colSpan={3} sx={{ backgroundColor: '#ffe0b2', textAlign: 'center', fontWeight: 700 }}>FROM 품목</TableCell>
                  <TableCell colSpan={3} sx={{ backgroundColor: '#fce4ec', textAlign: 'center', fontWeight: 700 }}>TO 품목</TableCell>
                  <TableCell colSpan={5} sx={{ backgroundColor: 'grey.200', textAlign: 'center', fontWeight: 700 }}>수량 / 일정 / 활성</TableCell>
                </TableRow>
                <TableRow>
                  {['거점구분','거점코드','거점명','-','수요유형','상세유형','자원코드','자원설명','비고','PH3','품목코드','품목명','PH3','품목코드','품목명','일 수량','총 수량','시작일','종료일','활성'].map((c, i) => (
                    <TableCell key={`${c}-${i}`} sx={{ backgroundColor: 'grey.100', fontWeight: 700, fontSize: 10, py: 0.5,
                      textAlign: ['일 수량','총 수량','시작일','종료일','활성'].includes(c) ? 'center' : 'left' }}>{c}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {REWORK_ROWS.map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell>{r.LOCAT_TP_NM}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{r.LOCAT_CD}</TableCell>
                    <TableCell>{r.LOCAT_NM}</TableCell>
                    <TableCell sx={{ color: 'text.disabled' }}>-</TableCell>
                    <TableCell><Chip size="small" label={r.MP_DMND_TYPE} variant="outlined" color={r.MP_DMND_TYPE === 'REWORK' ? 'warning' : 'info'} /></TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 10 }}>{r.MP_DMND_TYPE_DTL}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{r.RES_CD}</TableCell>
                    <TableCell>{r.RES_DESCRIP}</TableCell>
                    <TableCell>{r.REMARK}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{r.FROM_PH3}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{r.FROM_ITEM_CD}</TableCell>
                    <TableCell>{r.FROM_ITEM_NM}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{r.TO_PH3}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', color: 'success.main', fontWeight: 600 }}>{r.TO_ITEM_CD}</TableCell>
                    <TableCell sx={{ color: 'success.main' }}>{r.TO_ITEM_NM}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.QTY.toFixed(3)}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{r.TOT_QTY.toFixed(1)}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 11 }}>{r.STRT_DATE}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 11 }}>{r.END_DATE}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}><Checkbox size="small" checked={r.ACTV_YN} disabled sx={{ p: 0 }} /></TableCell>
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
