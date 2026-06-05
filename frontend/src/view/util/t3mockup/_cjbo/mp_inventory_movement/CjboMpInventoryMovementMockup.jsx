import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography, Paper, Chip, Checkbox,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MockShell from '../../_shared/MockShell';

const MOVE_ROWS = [
  { PH1_CD: 'AN', PH1_NM: 'Animal Nutrition',  PH2_CD: 'LYS', PH2_NM: 'Lysine',     PH3_CD: '78L', PH3_NM: '78% 액상',  ITEM_CD: 'L-LYS-78L',   ITEM_NM: 'L-Lysine 78% (액상)',     LOCAT_DIV_CD: 'P',  FROM_LOCAT_CD: 'KR-PLT1', FROM_LOCAT_NM: '한국 사업장1', TO_LOCAT_CD: 'KR-DC1',  TO_LOCAT_NM: '한국 DC1',     QTY:  45.0, STRT_DATE: '2026-06-10', END_DATE: '2026-06-11', ACTV_YN: true,  REMARK: '내수 이송' },
  { PH1_CD: 'AN', PH1_NM: 'Animal Nutrition',  PH2_CD: 'LYS', PH2_NM: 'Lysine',     PH3_CD: '78L', PH3_NM: '78% 액상',  ITEM_CD: 'L-LYS-78L',   ITEM_NM: 'L-Lysine 78% (액상)',     LOCAT_DIV_CD: 'S',  FROM_LOCAT_CD: 'KR-PLT1', FROM_LOCAT_NM: '한국 사업장1', TO_LOCAT_CD: 'VN-HCM',  TO_LOCAT_NM: '베트남 호치민',QTY: 120.0, STRT_DATE: '2026-06-15', END_DATE: '2026-06-22', ACTV_YN: true,  REMARK: '베트남 수출' },
  { PH1_CD: 'AN', PH1_NM: 'Animal Nutrition',  PH2_CD: 'MET', PH2_NM: 'Methionine', PH3_CD: '99P', PH3_NM: '99% 분말',  ITEM_CD: 'L-MET-99',    ITEM_NM: 'L-Methionine 99% (분말)',  LOCAT_DIV_CD: 'S',  FROM_LOCAT_CD: 'KR-PLT1', FROM_LOCAT_NM: '한국 사업장1', TO_LOCAT_CD: 'US-LAX',  TO_LOCAT_NM: '미국 LA',      QTY:  85.0, STRT_DATE: '2026-06-18', END_DATE: '2026-06-28', ACTV_YN: true,  REMARK: '미국 수출' },
];

export default function CjboMpInventoryMovementMockup() {
  return (
    <MockShell patternCode="cjbo_mp_inventory_movement"
      patternLabel="CJBO — 거점 간 재고이동 계획"
      layoutCategory="LAYOUT_SINGLE"
      description="내수(P)/수출(S) 구분 × 품목 × FROM 거점 → TO 거점 이동 계획. 출발일/도착일 + 수량.">

      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <TextField label="버전" size="small" select value="V2026-06" sx={{ width: 130 }}><MenuItem value="V2026-06">V2026-06</MenuItem></TextField>
          <TextField label="내수/수출 구분" size="small" select value="ALL" sx={{ width: 160 }}>
            <MenuItem value="ALL">전체</MenuItem><MenuItem value="P">P 내수</MenuItem><MenuItem value="S">S 수출</MenuItem>
          </TextField>
          <TextField label="FROM 거점" size="small" value="전체" sx={{ width: 180 }}
            InputProps={{ endAdornment: <Box sx={{ width: 24, textAlign: 'center', color: 'text.secondary' }}>🔍</Box> }} />
          <TextField label="TO 거점" size="small" value="전체" sx={{ width: 180 }}
            InputProps={{ endAdornment: <Box sx={{ width: 24, textAlign: 'center', color: 'text.secondary' }}>🔍</Box> }} />
          <TextField label="PH1/2/3" size="small" select value="ALL" sx={{ width: 130 }}><MenuItem value="ALL">전체</MenuItem></TextField>
          <Checkbox size="small" /><Typography variant="caption">활성만</Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
        </Stack>
      </Box>
      <Box sx={{ p: 1.5, flex: 1, overflow: 'hidden' }}>
        <Paper variant="outlined" sx={{ height: '100%' }}>
          <TableContainer sx={{ height: '100%' }}>
            <Table size="small" stickyHeader sx={{ '& th, & td': { fontSize: 11, py: 0.5 } }}>
              <TableHead>
                <TableRow>
                  <TableCell colSpan={8} sx={{ backgroundColor: '#fce4ec', textAlign: 'center', fontWeight: 700 }}>품목군</TableCell>
                  <TableCell rowSpan={2} sx={{ backgroundColor: 'grey.100', fontWeight: 700 }}>구분</TableCell>
                  <TableCell colSpan={2} sx={{ backgroundColor: '#e3f2fd', textAlign: 'center', fontWeight: 700 }}>FROM 거점</TableCell>
                  <TableCell colSpan={2} sx={{ backgroundColor: '#e8f5e9', textAlign: 'center', fontWeight: 700 }}>TO 거점</TableCell>
                  <TableCell colSpan={5} sx={{ backgroundColor: 'grey.200', textAlign: 'center', fontWeight: 700 }}>수량 · 일정 · 활성 · 비고</TableCell>
                </TableRow>
                <TableRow>
                  {['PH1','PH1 명','PH2','PH2 명','PH3','PH3 명','품목 코드','품목 명','거점 코드','거점 명','거점 코드','거점 명','수량(MT)','출발일','도착일','활성','비고'].map((c, i) => (
                    <TableCell key={`${c}-${i}`} sx={{ backgroundColor: 'grey.100', fontWeight: 700, fontSize: 10, py: 0.5 }}>{c}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {MOVE_ROWS.map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{r.PH1_CD}</TableCell>
                    <TableCell>{r.PH1_NM}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{r.PH2_CD}</TableCell>
                    <TableCell>{r.PH2_NM}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{r.PH3_CD}</TableCell>
                    <TableCell>{r.PH3_NM}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{r.ITEM_CD}</TableCell>
                    <TableCell>{r.ITEM_NM}</TableCell>
                    <TableCell><Chip size="small" label={r.LOCAT_DIV_CD === 'S' ? '수출' : '내수'} variant="outlined" color={r.LOCAT_DIV_CD === 'S' ? 'warning' : 'info'} /></TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{r.FROM_LOCAT_CD}</TableCell>
                    <TableCell>{r.FROM_LOCAT_NM}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', color: 'success.main' }}>{r.TO_LOCAT_CD}</TableCell>
                    <TableCell sx={{ color: 'success.main' }}>{r.TO_LOCAT_NM}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{r.QTY.toFixed(1)}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 11 }}>{r.STRT_DATE}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 11 }}>{r.END_DATE}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}><Checkbox size="small" checked={r.ACTV_YN} disabled sx={{ p: 0 }} /></TableCell>
                    <TableCell sx={{ fontSize: 11 }}>{r.REMARK}</TableCell>
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
