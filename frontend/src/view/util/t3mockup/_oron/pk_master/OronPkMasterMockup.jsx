import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Typography, Paper, Chip, ButtonGroup, IconButton, Button, Checkbox,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import DownloadIcon from '@mui/icons-material/Download';
import MockShell from '../../_shared/MockShell';

// ORON — PK 포장재 마스터
// 대표 화면: UI_PK_ORN_PACK_MGMT "포장재 제품 관리" (OrnPkMgmt)
//   표준 마스터 CRUD — SearchArea + 우측 ButtonArea (Add/Delete/Save/Excel) + 그리드 + GridCnt
// 같이 묶인 메뉴 9개: 반제품/원부자재/공정-라인/라인-생산능력/포장재 BOM/자원캘린더/근무시간/기준정보 검증/재고현황

const GRID_HEADERS = [
  { name: 'PACK_CD',     width: 130, align: 'center', mono: true },
  { name: 'PACK_NM',     width: 220, align: 'left' },
  { name: 'PACK_TP',     width: 100, align: 'center' },
  { name: 'UOM',         width: 70,  align: 'center' },
  { name: 'PROC_LINE',   width: 110, align: 'center', mono: true },
  { name: 'STD_LT_DAY',  width: 90,  align: 'right',  mono: true, num: true },
  { name: 'STD_CYCLE',   width: 90,  align: 'right',  mono: true, num: true },
  { name: 'SAFETY_QTY',  width: 100, align: 'right',  mono: true, num: true },
  { name: 'OEM_YN',      width: 70,  align: 'center', bool: true },
  { name: 'ACTV_YN',     width: 70,  align: 'center', bool: true },
  { name: 'CREATE_BY',   width: 90,  align: 'center' },
  { name: 'CREATE_DTTM', width: 150, align: 'center', mono: true },
];

const ROWS = [
  { PACK_CD: 'PK-MK-001-T', PACK_NM: '오론 비건마스크 5매 - TUBE',  PACK_TP: 'TUBE',  UOM: 'EA', PROC_LINE: 'LN-PRT-01', STD_LT_DAY: 3, STD_CYCLE: 7,  SAFETY_QTY: 5000, OEM_YN: false, ACTV_YN: true,  CREATE_BY: 'admin',      CREATE_DTTM: '2026-01-10 09:11' },
  { PACK_CD: 'PK-MK-001-P', PACK_NM: '오론 비건마스크 5매 - POUCH', PACK_TP: 'POUCH', UOM: 'EA', PROC_LINE: 'LN-PRT-01', STD_LT_DAY: 3, STD_CYCLE: 7,  SAFETY_QTY: 5000, OEM_YN: false, ACTV_YN: true,  CREATE_BY: 'admin',      CREATE_DTTM: '2026-01-10 09:13' },
  { PACK_CD: 'PK-MK-010-T', PACK_NM: '오론 비건마스크 10매 - TUBE', PACK_TP: 'TUBE',  UOM: 'EA', PROC_LINE: 'LN-PRT-01', STD_LT_DAY: 3, STD_CYCLE: 7,  SAFETY_QTY: 2500, OEM_YN: false, ACTV_YN: true,  CREATE_BY: 'admin',      CREATE_DTTM: '2026-01-10 09:15' },
  { PACK_CD: 'PK-SR-30',    PACK_NM: '오론 세럼 30ml',              PACK_TP: 'BOTTLE', UOM: 'EA', PROC_LINE: 'LN-PRT-02', STD_LT_DAY: 5, STD_CYCLE: 10, SAFETY_QTY: 1500, OEM_YN: false, ACTV_YN: true,  CREATE_BY: 'admin',      CREATE_DTTM: '2026-02-05 10:22' },
  { PACK_CD: 'PK-SR-50',    PACK_NM: '오론 세럼 50ml',              PACK_TP: 'BOTTLE', UOM: 'EA', PROC_LINE: 'LN-PRT-02', STD_LT_DAY: 5, STD_CYCLE: 10, SAFETY_QTY: 1200, OEM_YN: false, ACTV_YN: false, CREATE_BY: 'admin',      CREATE_DTTM: '2026-02-05 10:24' },
  { PACK_CD: 'PK-OEM-SUN',  PACK_NM: 'OEM 선크림 SPF50+ - PUMP',    PACK_TP: 'PUMP',  UOM: 'EA', PROC_LINE: 'LN-OEM-01', STD_LT_DAY: 7, STD_CYCLE: 14, SAFETY_QTY: 3000, OEM_YN: true,  ACTV_YN: true,  CREATE_BY: 'park.sumin', CREATE_DTTM: '2026-03-12 11:10' },
];

export default function OronPkMasterMockup() {
  return (
    <MockShell
      patternCode="oron_pk_master"
      patternLabel="ORON — PK 포장재 마스터 (제품/반제품/원부자재/라인/BOM/캘린더)"
      layoutCategory="LAYOUT_SINGLE"
      description="대표 화면 = 포장재 제품 관리 (UI_PK_ORN_PACK_MGMT). 표준 마스터 CRUD — SearchArea (포장 타입/공정 라인/OEM 여부/활성 여부) + 우측 ButtonArea + 그리드 + GridCnt. 같이 묶인 메뉴 9개 (반제품/원부자재/공정 라인/라인 생산능력/BOM/자원 캘린더/근무시간/기준정보 검증/재고현황) 도 동일 패턴 — 컬럼셋만 다름."
    >
      {/* SearchArea */}
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="PACK_TP" size="small" select value="ALL" sx={{ width: 130 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="TUBE">TUBE</MenuItem>
            <MenuItem value="POUCH">POUCH</MenuItem>
            <MenuItem value="BOTTLE">BOTTLE</MenuItem>
            <MenuItem value="PUMP">PUMP</MenuItem>
          </TextField>
          <TextField label="PROC_LINE" size="small" select value="ALL" sx={{ width: 140 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="LN-PRT-01">LN-PRT-01 (인쇄1)</MenuItem>
            <MenuItem value="LN-PRT-02">LN-PRT-02 (인쇄2)</MenuItem>
            <MenuItem value="LN-OEM-01">LN-OEM-01 (OEM)</MenuItem>
          </TextField>
          <TextField label="OEM_YN" size="small" select value="ALL" sx={{ width: 100 }}>
            <MenuItem value="ALL">ALL</MenuItem>
            <MenuItem value="Y">Y</MenuItem>
            <MenuItem value="N">N</MenuItem>
          </TextField>
          <TextField label="ACTV_YN" size="small" select value="Y" sx={{ width: 100 }}>
            <MenuItem value="ALL">ALL</MenuItem>
            <MenuItem value="Y">Y</MenuItem>
            <MenuItem value="N">N</MenuItem>
          </TextField>
          <TextField label="PACK_NM" size="small" value="" sx={{ width: 200 }}
            placeholder="포장재명 검색"
            InputProps={{ endAdornment: <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} /> }} />
        </Stack>
      </Box>

      {/* ButtonArea */}
      <Box sx={{ px: 1.5, py: 0.7, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1 }}>
        <Button size="small" variant="outlined" startIcon={<DownloadIcon />}>Excel</Button>
        <ButtonGroup variant="outlined" size="small">
          <IconButton size="small" title="GridAddRowButton"><AddIcon fontSize="small" /></IconButton>
          <IconButton size="small" title="GridDeleteRowButton"><DeleteIcon fontSize="small" /></IconButton>
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
                      if (c.bool) {
                        return (
                          <TableCell key={c.name} sx={{ textAlign: 'center' }}>
                            <Checkbox size="small" checked={v} disabled sx={{ p: 0.25 }} />
                          </TableCell>
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
        </Paper>
      </Box>
    </MockShell>
  );
}
