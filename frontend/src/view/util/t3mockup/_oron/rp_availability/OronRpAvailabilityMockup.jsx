import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Typography, Paper, Chip, ButtonGroup, IconButton, Button,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SaveIcon from '@mui/icons-material/Save';
import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';
import MockShell from '../../_shared/MockShell';

// ORON — RP 분배 가용량
// 대표 화면: UI_RP_ORN_02 "분배 가용량 생성" (OrnAvailAdj)
//   SearchArea: PlanScope, Version, 거점, 품목, 기간
//   Grid: 거점 × 품목 × DATE(동적) — 가용량/안전재고/분배가능량 (또는 measure 행)
//
// 묶인 메뉴: UI_RP_ORN_03 가용량 입력, UI_RP_ORN_22 검사중재고 보정, UI_RP_ORN_21 공장재고검토,
//          UI_RP_ORN_PLAN_ADJ 분배계획 시뮬레이션, UI_RP_ORN_04 분배결과 조회

const DATE_COLS = ['06-08', '06-09', '06-10', '06-11', '06-12', '06-13', '06-14'];

const ROWS = [
  { LOCAT: 'DC-SEL', LOCAT_NM: '서울 물류센터', ITEM_CD: 'ORN-MK-001', ITEM_NM: '오론 비건마스크 5매', cat: 'AVAIL_QTY',  vals: [3200, 3500, 3800, 4000, 4200, 4500, 4800] },
  { LOCAT: 'DC-SEL', LOCAT_NM: '서울 물류센터', ITEM_CD: 'ORN-MK-001', ITEM_NM: '오론 비건마스크 5매', cat: 'SAFETY_QTY', vals: [2000, 2000, 2000, 2000, 2000, 2000, 2000] },
  { LOCAT: 'DC-SEL', LOCAT_NM: '서울 물류센터', ITEM_CD: 'ORN-MK-001', ITEM_NM: '오론 비건마스크 5매', cat: 'NET_AVAIL',  vals: [1200, 1500, 1800, 2000, 2200, 2500, 2800], highlight: true },
  { LOCAT: 'DC-BSN', LOCAT_NM: '부산 물류센터', ITEM_CD: 'ORN-MK-001', ITEM_NM: '오론 비건마스크 5매', cat: 'AVAIL_QTY',  vals: [1800, 1900, 2100, 2200, 2300, 2400, 2500] },
  { LOCAT: 'DC-BSN', LOCAT_NM: '부산 물류센터', ITEM_CD: 'ORN-MK-001', ITEM_NM: '오론 비건마스크 5매', cat: 'SAFETY_QTY', vals: [1200, 1200, 1200, 1200, 1200, 1200, 1200] },
  { LOCAT: 'DC-BSN', LOCAT_NM: '부산 물류센터', ITEM_CD: 'ORN-MK-001', ITEM_NM: '오론 비건마스크 5매', cat: 'NET_AVAIL',  vals: [600,  700,  900,  1000, 1100, 1200, 1300], highlight: true },
  { LOCAT: 'DC-JJU', LOCAT_NM: '제주 물류센터', ITEM_CD: 'ORN-MK-001', ITEM_NM: '오론 비건마스크 5매', cat: 'AVAIL_QTY',  vals: [800,  850,  900,  950,  1000, 1100, 1200] },
  { LOCAT: 'DC-JJU', LOCAT_NM: '제주 물류센터', ITEM_CD: 'ORN-MK-001', ITEM_NM: '오론 비건마스크 5매', cat: 'SAFETY_QTY', vals: [600,  600,  600,  600,  600,  600,  600] },
  { LOCAT: 'DC-JJU', LOCAT_NM: '제주 물류센터', ITEM_CD: 'ORN-MK-001', ITEM_NM: '오론 비건마스크 5매', cat: 'NET_AVAIL',  vals: [200,  250,  300,  350,  400,  500,  600], highlight: true, warning: true },
];

const CAT_COLOR = {
  AVAIL_QTY:  '#1565c0',
  SAFETY_QTY: '#6b7280',
  NET_AVAIL:  '#10b981',
};

export default function OronRpAvailabilityMockup() {
  return (
    <MockShell
      patternCode="oron_rp_availability"
      patternLabel="ORON — RP 분배 가용량 (생성/입력/검토/시뮬레이션)"
      layoutCategory="LAYOUT_SINGLE"
      description="대표 화면 = 분배 가용량 생성 (UI_RP_ORN_02). 거점 × 품목 × 기간(동적) 크로스탭 — measure 행: AVAIL_QTY(총 가용량) / SAFETY_QTY(안전재고) / NET_AVAIL(분배가능량 = 가용량 - 안전재고). 같이 묶인 메뉴 5개 (가용량 입력/검사중재고 보정/공장재고검토/분배계획 시뮬레이션/분배결과 조회) 도 같은 패턴."
    >
      {/* SearchArea */}
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="PLAN_SCOPE" size="small" select value="ORN_RP" sx={{ width: 130 }}>
            <MenuItem value="ORN_RP">ORN_RP</MenuItem>
          </TextField>
          <TextField label="MAIN_VER" size="small" select value="V2026-06" sx={{ width: 140 }}>
            <MenuItem value="V2026-06">V2026-06</MenuItem>
          </TextField>
          <TextField label="LOCAT" size="small" value="전체 (DC)" sx={{ width: 180 }}
            InputProps={{ endAdornment: <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} /> }} />
          <TextField label="ITEM" size="small" value="MASK / 비건마스크 5매" sx={{ width: 220 }}
            InputProps={{ endAdornment: <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} /> }} />
          <TextField label="기간" size="small" value="2026-06-08 ~ 06-14" sx={{ width: 200 }} />
          <TextField label="BUCKET" size="small" select value="DAY" sx={{ width: 100 }}>
            <MenuItem value="DAY">DAY</MenuItem>
            <MenuItem value="WEEK">WEEK</MenuItem>
          </TextField>
        </Stack>
      </Box>

      {/* ButtonArea + Grid */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <Box sx={{ px: 1.5, py: 0.7, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1 }}>
          <Button size="small" variant="outlined" startIcon={<RefreshIcon />}>가용량 재생성</Button>
          <Button size="small" variant="outlined" startIcon={<DownloadIcon />}>Excel</Button>
          <ButtonGroup variant="outlined" size="small">
            <IconButton size="small" title="GridSaveButton" color="primary"><SaveIcon fontSize="small" /></IconButton>
          </ButtonGroup>
        </Box>

        <Box sx={{ p: 1.5, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <Paper variant="outlined" sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <TableContainer sx={{ flex: 1 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, width: 110, textAlign: 'center', fontSize: 12, fontFamily: 'monospace' }}>LOCAT</TableCell>
                    <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, width: 140, textAlign: 'left', fontSize: 12 }}>LOCAT_NM</TableCell>
                    <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, width: 130, textAlign: 'center', fontSize: 12, fontFamily: 'monospace' }}>ITEM_CD</TableCell>
                    <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, width: 200, textAlign: 'left', fontSize: 12 }}>ITEM_NM</TableCell>
                    <TableCell sx={{ bgcolor: '#fffbe6', fontWeight: 700, width: 110, textAlign: 'center', fontSize: 12 }}>Measure</TableCell>
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
                        <TableCell sx={{ fontSize: 12, textAlign: 'center', fontFamily: 'monospace' }}>{isFirstOfBlock ? r.LOCAT : ''}</TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{isFirstOfBlock ? r.LOCAT_NM : ''}</TableCell>
                        <TableCell sx={{ fontSize: 12, textAlign: 'center', fontFamily: 'monospace' }}>{isFirstOfBlock ? r.ITEM_CD : ''}</TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{isFirstOfBlock ? r.ITEM_NM : ''}</TableCell>
                        <TableCell sx={{ textAlign: 'center', fontWeight: 600, fontFamily: 'monospace', fontSize: 12, color: CAT_COLOR[r.cat] }}>
                          {r.cat}
                        </TableCell>
                        {r.vals.map((v, j) => (
                          <TableCell key={j} sx={{
                            textAlign: 'right', fontFamily: 'monospace', fontSize: 12,
                            fontWeight: r.cat === 'NET_AVAIL' ? 700 : 400,
                            color: r.cat === 'NET_AVAIL'
                              ? (r.warning && v < 300 ? '#ef4444' : '#10b981')
                              : '#374151',
                          }}>{v.toLocaleString()}</TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      </Box>
    </MockShell>
  );
}
