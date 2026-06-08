import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Typography, Paper, Chip, Button, ButtonGroup, IconButton,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SaveIcon from '@mui/icons-material/Save';
import DownloadIcon from '@mui/icons-material/Download';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import MockShell from '../../_shared/MockShell';

// ORON — PK 자재 소요량
// 대표 화면: UI_PK_ORN_PACK_MAT_REQ_CRT "자재 소요량 생성" (OrnMatReqCrt)
//   SearchArea: 기준일, 자재 타입(잉크/원단/지관), 라인, 발주처
//   Grid: 자재 코드 × 일자 — 필요량 / 재고 / 발주량 / 분배 후 잔량
// 같이 묶인 메뉴 7개: 잉크/원단/지관 소요량 생성·분배, 자재 발주내역, 임가공 발주서

const DATE_COLS = ['06-08', '06-09', '06-10', '06-11', '06-12', '06-13', '06-14'];

const ROWS = [
  // 잉크
  { MAT_TP: '잉크', MAT_CD: 'INK-CYAN-01',   MAT_NM: '시안 잉크 (CYAN)',     UOM: 'KG', cat: 'REQ_QTY',  vals: [120, 130, 145, 150, 140, 135, 130] },
  { MAT_TP: '잉크', MAT_CD: 'INK-CYAN-01',   MAT_NM: '시안 잉크 (CYAN)',     UOM: 'KG', cat: 'STOCK',    vals: [500, 380, 250, 105, 0,   0,   0  ] },
  { MAT_TP: '잉크', MAT_CD: 'INK-CYAN-01',   MAT_NM: '시안 잉크 (CYAN)',     UOM: 'KG', cat: 'ORDER',    vals: [0,   0,   0,   200, 200, 0,   0  ], highlight: true },
  // 원단
  { MAT_TP: '원단', MAT_CD: 'FILM-PE-30',    MAT_NM: 'PE 필름 30㎛',         UOM: 'M',  cat: 'REQ_QTY',  vals: [800, 850, 900, 920, 880, 870, 850] },
  { MAT_TP: '원단', MAT_CD: 'FILM-PE-30',    MAT_NM: 'PE 필름 30㎛',         UOM: 'M',  cat: 'STOCK',    vals: [3000,2200,1350,450, 0,   0,   0  ] },
  { MAT_TP: '원단', MAT_CD: 'FILM-PE-30',    MAT_NM: 'PE 필름 30㎛',         UOM: 'M',  cat: 'ORDER',    vals: [0,   0,   0,   1500,0,   0,   0  ], highlight: true },
  // 지관
  { MAT_TP: '지관', MAT_CD: 'TUBE-PAPER-3', MAT_NM: '종이 지관 3인치',      UOM: 'EA', cat: 'REQ_QTY',  vals: [50,  55,  60,  62,  58,  55,  52 ] },
  { MAT_TP: '지관', MAT_CD: 'TUBE-PAPER-3', MAT_NM: '종이 지관 3인치',      UOM: 'EA', cat: 'STOCK',    vals: [200, 150, 95,  35,  0,   0,   0  ] },
  { MAT_TP: '지관', MAT_CD: 'TUBE-PAPER-3', MAT_NM: '종이 지관 3인치',      UOM: 'EA', cat: 'ORDER',    vals: [0,   0,   0,   200, 0,   0,   0  ], highlight: true },
];

const CAT_COLOR = {
  REQ_QTY: '#1565c0',
  STOCK:   '#6b7280',
  ORDER:   '#10b981',
};

export default function OronPkMatReqMockup() {
  return (
    <MockShell
      patternCode="oron_pk_mat_req"
      patternLabel="ORON — PK 자재 소요량 (잉크/원단/지관/임가공)"
      layoutCategory="LAYOUT_SINGLE"
      description="대표 화면 = 자재 소요량 생성 (UI_PK_ORN_PACK_MAT_REQ_CRT). 자재 타입(잉크/원단/지관) × 일자(동적) 크로스탭 — measure 행 REQ_QTY(필요량) / STOCK(재고) / ORDER(발주량). 같이 묶인 메뉴 7개 (잉크/원단/지관 분배/지관 관리/임가공 발주서/자재 발주내역) 도 동일 패턴."
    >
      {/* SearchArea */}
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="기준일" size="small" value="2026-06-08" sx={{ width: 140 }} />
          <TextField label="MAT_TP" size="small" select value="ALL" sx={{ width: 130 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="INK">잉크</MenuItem>
            <MenuItem value="FILM">원단</MenuItem>
            <MenuItem value="TUBE">지관</MenuItem>
          </TextField>
          <TextField label="LINE" size="small" select value="ALL" sx={{ width: 150 }}>
            <MenuItem value="ALL">전체</MenuItem>
          </TextField>
          <TextField label="발주처" size="small" value="" sx={{ width: 180 }}
            InputProps={{ endAdornment: <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} /> }} />
          <TextField label="기간" size="small" value="2026-06-08 ~ 06-14" sx={{ width: 200 }} />
        </Stack>
      </Box>

      {/* ButtonArea */}
      <Box sx={{ px: 1.5, py: 0.7, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1 }}>
        <Button size="small" variant="contained" color="primary" startIcon={<AutoFixHighIcon />}>소요량 일괄 생성</Button>
        <Button size="small" variant="outlined" startIcon={<DownloadIcon />}>Excel</Button>
        <ButtonGroup variant="outlined" size="small">
          <IconButton size="small" title="GridSaveButton" color="primary"><SaveIcon fontSize="small" /></IconButton>
        </ButtonGroup>
      </Box>

      {/* Grid */}
      <Box sx={{ p: 1.5, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Paper variant="outlined" sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, width: 80, textAlign: 'center', fontSize: 12 }}>MAT_TP</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, width: 150, textAlign: 'center', fontSize: 12, fontFamily: 'monospace' }}>MAT_CD</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, width: 180, textAlign: 'left', fontSize: 12 }}>MAT_NM</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, width: 60, textAlign: 'center', fontSize: 12 }}>UOM</TableCell>
                  <TableCell sx={{ bgcolor: '#fffbe6', fontWeight: 700, width: 100, textAlign: 'center', fontSize: 12 }}>Measure</TableCell>
                  {DATE_COLS.map((d) => (
                    <TableCell key={d} sx={{ bgcolor: 'grey.100', fontWeight: 700, width: 80, textAlign: 'right', fontSize: 12, fontFamily: 'monospace' }}>{d}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {ROWS.map((r, i) => {
                  const isFirstOfBlock = i % 3 === 0;
                  return (
                    <TableRow key={i} hover sx={{
                      bgcolor: r.highlight ? '#f0fdf4' : 'transparent',
                      borderTop: isFirstOfBlock ? '2px solid #d1d5db' : undefined,
                    }}>
                      <TableCell sx={{ fontSize: 12, textAlign: 'center' }}>{isFirstOfBlock ? r.MAT_TP : ''}</TableCell>
                      <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', textAlign: 'center' }}>{isFirstOfBlock ? r.MAT_CD : ''}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{isFirstOfBlock ? r.MAT_NM : ''}</TableCell>
                      <TableCell sx={{ fontSize: 12, textAlign: 'center' }}>{isFirstOfBlock ? r.UOM : ''}</TableCell>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 600, fontFamily: 'monospace', fontSize: 12, color: CAT_COLOR[r.cat] }}>
                        {r.cat}
                      </TableCell>
                      {r.vals.map((v, j) => {
                        const isStockZero = r.cat === 'STOCK' && v === 0;
                        return (
                          <TableCell key={j} sx={{
                            textAlign: 'right', fontFamily: 'monospace', fontSize: 12,
                            fontWeight: r.cat === 'ORDER' && v > 0 ? 700 : 400,
                            color: r.cat === 'ORDER' && v > 0
                              ? '#10b981'
                              : isStockZero ? '#ef4444' : '#374151',
                            bgcolor: r.cat === 'ORDER' && v > 0 ? '#dcfce7' : 'transparent',
                          }}>{v.toLocaleString()}</TableCell>
                        );
                      })}
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
