import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Typography, Paper, Chip, Button, ButtonGroup, IconButton,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import DownloadIcon from '@mui/icons-material/Download';
import MockShell from '../../_shared/MockShell';

// KTNG — MP 공급망 라우팅
// UI_MP_KTNG_03 → MpKtng03.jsx
//   생산지/판매지/제품 단위 라우팅 (운송 모드/LT/Priority/Cost)

const ROWS = [
  { ITEM_LV3: '에쎄', FROM_PLANT: '신탄진공장',  TO_LOCAT: '국내 DC (서울)',  MODE: 'TRUCK', LT_DAYS: 1, PRIORITY: 1, COST_RATIO: 100, USE_YN: true },
  { ITEM_LV3: '에쎄', FROM_PLANT: '신탄진공장',  TO_LOCAT: '국내 DC (부산)',  MODE: 'TRUCK', LT_DAYS: 1, PRIORITY: 1, COST_RATIO: 100, USE_YN: true },
  { ITEM_LV3: 'ESSE Asian', FROM_PLANT: '신탄진공장',  TO_LOCAT: '대만 (KAO)',     MODE: 'SEA',   LT_DAYS: 7,  PRIORITY: 1, COST_RATIO: 100, USE_YN: true },
  { ITEM_LV3: 'ESSE Asian', FROM_PLANT: '신탄진공장',  TO_LOCAT: '미국 (LAX)',     MODE: 'SEA',   LT_DAYS: 18, PRIORITY: 1, COST_RATIO: 100, USE_YN: true },
  { ITEM_LV3: 'ESSE Asian', FROM_PLANT: '신탄진공장',  TO_LOCAT: '미국 (LAX)',     MODE: 'AIR',   LT_DAYS: 3,  PRIORITY: 2, COST_RATIO: 380, USE_YN: true },
  { ITEM_LV3: 'TIME',       FROM_PLANT: 'Almaty공장',  TO_LOCAT: '러시아 (모스크바)', MODE: 'TRUCK', LT_DAYS: 5,  PRIORITY: 1, COST_RATIO: 100, USE_YN: true },
  { ITEM_LV3: 'LAISON',     FROM_PLANT: 'Jakarta공장', TO_LOCAT: '베트남 (호치민)',   MODE: 'SEA',   LT_DAYS: 4,  PRIORITY: 1, COST_RATIO: 100, USE_YN: true },
  { ITEM_LV3: '릴 NGP',     FROM_PLANT: '신탄진공장',  TO_LOCAT: '국내 DC (서울)',  MODE: 'TRUCK', LT_DAYS: 1, PRIORITY: 1, COST_RATIO: 100, USE_YN: true },
];

const MODE_COLOR = { TRUCK: '#3b82f6', SEA: '#10b981', AIR: '#f59e0b', RAIL: '#8b5cf6' };

export default function KtngMpRoutingMockup() {
  return (
    <MockShell
      patternCode="ktng_mp_routing"
      patternLabel="KTNG — MP 공급망 라우팅"
      layoutCategory="LAYOUT_SINGLE"
      description="UI_MP_KTNG_03 → MpKtng03.jsx. 생산공장 → 판매거점 경로 마스터 (TRUCK/SEA/AIR/RAIL × LT_DAYS × Priority × Cost Ratio)."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="ITEM_LV3" size="small" value="" placeholder="브랜드"
            InputProps={{ endAdornment: <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} /> }}
            sx={{ width: 180 }} />
          <TextField label="FROM_PLANT" size="small" select value="ALL" sx={{ width: 160 }}><MenuItem value="ALL">전체</MenuItem></TextField>
          <TextField label="TO_LOCAT" size="small" select value="ALL" sx={{ width: 160 }}><MenuItem value="ALL">전체</MenuItem></TextField>
          <TextField label="MODE" size="small" select value="ALL" sx={{ width: 110 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="TRUCK">TRUCK</MenuItem>
            <MenuItem value="SEA">SEA</MenuItem>
            <MenuItem value="AIR">AIR</MenuItem>
          </TextField>
        </Stack>
      </Box>

      <Box sx={{ px: 1.5, py: 0.7, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        <Button size="small" variant="outlined" startIcon={<DownloadIcon />}>Excel</Button>
        <ButtonGroup variant="outlined" size="small">
          <IconButton size="small"><AddIcon fontSize="small" /></IconButton>
          <IconButton size="small"><DeleteIcon fontSize="small" /></IconButton>
          <IconButton size="small" color="primary"><SaveIcon fontSize="small" /></IconButton>
        </ButtonGroup>
      </Box>

      <Box sx={{ p: 1.5, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Paper variant="outlined" sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead><TableRow>
                {['ITEM_LV3', 'FROM_PLANT', 'TO_LOCAT', 'MODE', 'LT_DAYS', 'PRIORITY', 'COST_RATIO', 'USE_YN'].map((h) => (
                  <TableCell key={h} sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, textAlign: ['MODE', 'LT_DAYS', 'PRIORITY', 'COST_RATIO', 'USE_YN'].includes(h) ? 'center' : 'inherit' }}>{h}</TableCell>
                ))}
              </TableRow></TableHead>
              <TableBody>
                {ROWS.map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={{ fontSize: 11 }}>{r.ITEM_LV3}</TableCell>
                    <TableCell sx={{ fontSize: 11 }}>{r.FROM_PLANT}</TableCell>
                    <TableCell sx={{ fontSize: 11 }}>{r.TO_LOCAT}</TableCell>
                    <TableCell sx={{ fontSize: 11, textAlign: 'center' }}><Chip label={r.MODE} size="small" sx={{ height: 18, fontSize: 10, bgcolor: MODE_COLOR[r.MODE], color: 'white', fontWeight: 600 }} /></TableCell>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'center' }}>{r.LT_DAYS}일</TableCell>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'center', fontWeight: r.PRIORITY === 1 ? 700 : 400, color: r.PRIORITY === 1 ? '#1565c0' : '#9ca3af' }}>{r.PRIORITY}</TableCell>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'center', color: r.COST_RATIO > 200 ? '#ef4444' : '#374151' }}>{r.COST_RATIO}%</TableCell>
                    <TableCell sx={{ fontSize: 11, textAlign: 'center', color: '#10b981', fontWeight: 600 }}>{r.USE_YN ? 'Y' : 'N'}</TableCell>
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
