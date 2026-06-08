import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Typography, Paper, Chip, ButtonGroup, IconButton, Button,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import DownloadIcon from '@mui/icons-material/Download';
import MockShell from '../../_shared/MockShell';

// ORON — RP 주문 입력/조회
// 대표 화면: UI_RP_ORN_01 "물류센터/영업소 주문 입력"
//   소스: replenishmentplan/preanalysis/ornreforderadj/OrnRefOrderAdj.jsx
//        (ORON repo 동일 경로 미존재 — 같은 RP 마스터 CRUD 패턴으로 1:1)
//   SearchArea: PlanScope, 출발거점(TP+CD), 도착거점(TP+CD), 품목, 기간
//   Grid columns: FROM_LOCAT_CD/NM, TO_LOCAT_CD/NM, ITEM_CD/NM, ORD_DT, ETD, ETA, ORD_QTY, STATUS, REMARK
//   우측 버튼: GridAddRow / GridDeleteRow / GridSave / Excel
//
// 같이 묶인 메뉴 (대표 1개만 본문 표시):
//   - UI_RP_ORN_05  물류센터/영업소 주문조회 (OrnRefOrderView)
//   - UI_RP_ORN_06  특정 분배 요청 (OrnSalesOrder)
//   - UI_RP_ORN_07  특정 분배 요청 조회/확정 (OrnSalesOrderCnf)
//   - UI_RP_ORN_08  추가의뢰 조회/수정 (OrnTransferOrderEdit)
//   - UI_RP_ORN_09  추가의뢰 요청 (OrnTransferOrderAsk)
//   - UI_RP_ORN_10  거점 기준정보 설정 (OrnLocatMapping)
//   - UI_RP_ORN_11  물류센터 분배 입력(익산-제주) (OrnCenterAdj)

const GRID_HEADERS = [
  { name: 'FROM_LOCAT_CD', width: 100, align: 'center', mono: true },
  { name: 'FROM_LOCAT_NM', width: 140, align: 'left' },
  { name: 'TO_LOCAT_CD',   width: 100, align: 'center', mono: true },
  { name: 'TO_LOCAT_NM',   width: 140, align: 'left' },
  { name: 'ITEM_CD',       width: 130, align: 'center', mono: true },
  { name: 'ITEM_NM',       width: 200, align: 'left' },
  { name: 'ORD_DT',        width: 100, align: 'center', mono: true },
  { name: 'ETD',           width: 100, align: 'center', mono: true },
  { name: 'ETA',           width: 100, align: 'center', mono: true },
  { name: 'ORD_QTY',       width: 90,  align: 'right',  mono: true, num: true },
  { name: 'STATUS',        width: 110, align: 'center' },
  { name: 'REMARK',        width: 180, align: 'left' },
];

const ROWS = [
  { FROM_LOCAT_CD: 'PL-IKS', FROM_LOCAT_NM: '익산공장',   TO_LOCAT_CD: 'DC-SEL', TO_LOCAT_NM: '서울 물류센터', ITEM_CD: 'ORN-MK-001',  ITEM_NM: '오론 비건마스크 5매',   ORD_DT: '2026-06-05', ETD: '2026-06-08', ETA: '2026-06-10', ORD_QTY: 12000, STATUS: 'CONFIRMED', REMARK: '온라인 대응 1차 분배' },
  { FROM_LOCAT_CD: 'PL-IKS', FROM_LOCAT_NM: '익산공장',   TO_LOCAT_CD: 'DC-BSN', TO_LOCAT_NM: '부산 물류센터', ITEM_CD: 'ORN-MK-001',  ITEM_NM: '오론 비건마스크 5매',   ORD_DT: '2026-06-05', ETD: '2026-06-08', ETA: '2026-06-11', ORD_QTY: 6500,  STATUS: 'CONFIRMED', REMARK: '' },
  { FROM_LOCAT_CD: 'PL-IKS', FROM_LOCAT_NM: '익산공장',   TO_LOCAT_CD: 'DC-JJU', TO_LOCAT_NM: '제주 물류센터', ITEM_CD: 'ORN-MK-001',  ITEM_NM: '오론 비건마스크 5매',   ORD_DT: '2026-06-05', ETD: '2026-06-09', ETA: '2026-06-15', ORD_QTY: 2200,  STATUS: 'PENDING',   REMARK: '제주 추가 의뢰' },
  { FROM_LOCAT_CD: 'PL-IKS', FROM_LOCAT_NM: '익산공장',   TO_LOCAT_CD: 'DC-SEL', TO_LOCAT_NM: '서울 물류센터', ITEM_CD: 'ORN-SR-101',  ITEM_NM: '오론 세럼 30ml',         ORD_DT: '2026-06-05', ETD: '2026-06-08', ETA: '2026-06-10', ORD_QTY: 4500,  STATUS: 'CONFIRMED', REMARK: '' },
  { FROM_LOCAT_CD: 'PL-IKS', FROM_LOCAT_NM: '익산공장',   TO_LOCAT_CD: 'DC-DGU', TO_LOCAT_NM: '대구 영업소',   ITEM_CD: 'ORN-SR-101',  ITEM_NM: '오론 세럼 30ml',         ORD_DT: '2026-06-05', ETD: '2026-06-08', ETA: '2026-06-11', ORD_QTY: 1800,  STATUS: 'DRAFT',     REMARK: '' },
  { FROM_LOCAT_CD: 'PL-OEM', FROM_LOCAT_NM: 'OEM 공장',   TO_LOCAT_CD: 'DC-OEM', TO_LOCAT_NM: 'OEM 직송',     ITEM_CD: 'OEM-SUN-50',  ITEM_NM: 'OEM 선크림 SPF50+',     ORD_DT: '2026-06-06', ETD: '2026-06-10', ETA: '2026-06-12', ORD_QTY: 8500,  STATUS: 'CONFIRMED', REMARK: 'CLIENT-A 발주' },
];

const STATUS_COLOR = {
  CONFIRMED: '#10b981',
  PENDING:   '#f59e0b',
  DRAFT:     '#9ca3af',
};

export default function OronRpRequestMockup() {
  return (
    <MockShell
      patternCode="oron_rp_request"
      patternLabel="ORON — RP 주문 입력/조회 (물류센터/영업소/거점 주문)"
      layoutCategory="LAYOUT_SINGLE"
      description="대표 화면 = 물류센터/영업소 주문 입력 (UI_RP_ORN_01). 표준 RP 마스터 CRUD — SearchArea (PlanScope/출발거점/도착거점/품목/기간) + 우측 ButtonArea (Add/Delete/Save/Excel) + 단일 그리드 + GridCnt. 같이 묶인 메뉴 7개 (주문조회/특정분배/추가의뢰/거점 매핑/익산-제주 분배) 도 같은 패턴."
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
          <TextField label="FROM_LOCAT" size="small" value="익산공장 (PL-IKS)" sx={{ width: 200 }}
            InputProps={{ endAdornment: <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} /> }} />
          <TextField label="TO_LOCAT" size="small" value="전체" sx={{ width: 160 }}
            InputProps={{ endAdornment: <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} /> }} />
          <TextField label="ITEM" size="small" value="" sx={{ width: 200 }}
            InputProps={{ endAdornment: <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} /> }} />
          <TextField label="기간" size="small" value="2026-06-01 ~ 06-30" sx={{ width: 200 }} />
        </Stack>
      </Box>

      {/* ButtonArea + Grid */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <Box sx={{ px: 1.5, py: 0.7, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1 }}>
          <Button size="small" variant="outlined" startIcon={<DownloadIcon />}>Excel</Button>
          <ButtonGroup variant="outlined" size="small">
            <IconButton size="small" title="GridAddRowButton"><AddIcon fontSize="small" /></IconButton>
            <IconButton size="small" title="GridDeleteRowButton"><DeleteIcon fontSize="small" /></IconButton>
            <IconButton size="small" title="GridSaveButton" color="primary"><SaveIcon fontSize="small" /></IconButton>
          </ButtonGroup>
        </Box>

        <Box sx={{ p: 1.5, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <Paper variant="outlined" sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <TableContainer sx={{ flex: 1 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {GRID_HEADERS.map((c) => (
                      <TableCell key={c.name} sx={{ bgcolor: 'grey.100', fontWeight: 700, width: c.width, textAlign: c.align, fontSize: 12, fontFamily: c.mono ? 'monospace' : 'inherit' }}>{c.name}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ROWS.map((r, i) => (
                    <TableRow key={i} hover>
                      {GRID_HEADERS.map((c) => {
                        const v = r[c.name];
                        if (c.name === 'STATUS') {
                          return (
                            <TableCell key={c.name} sx={{ fontSize: 12, textAlign: 'center', fontWeight: 600, color: STATUS_COLOR[v] }}>{v}</TableCell>
                          );
                        }
                        return (
                          <TableCell key={c.name} sx={{ fontSize: 12, textAlign: c.align, fontFamily: c.mono ? 'monospace' : 'inherit' }}>
                            {c.num && typeof v === 'number' ? v.toLocaleString() : v}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ borderTop: '1px solid', borderColor: 'divider', px: 1.5, py: 0.5, bgcolor: 'grey.50' }}>
              <Typography sx={{ fontSize: 11, fontFamily: 'monospace', color: 'text.secondary' }}>
                GridCnt grid="grid1" — {ROWS.length} CASES MSG_0010
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Box>
    </MockShell>
  );
}
