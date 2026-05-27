import React, { useState } from 'react';
import { Box, Stack, TextField, MenuItem, Button, Chip, Tabs, Tab,
  Table, TableHead, TableBody, TableRow, TableCell, Checkbox } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import MockShell from '../../_shared/MockShell';

// PLANNEL DM 기본 마스터 — Item/Customer/Site/Location/Workcenter/Resource/Supplier 7개
// 공통 레이아웃: 검색조건 + 그리드 + 우측 toolbar (Add/Save/Delete)

const SAMPLE_ROWS = [
  { CD: 'ITM-A100', NM: 'LED Module 60W',      TYPE: 'FG',  UOM: 'EA', STATUS: 'ACTIVE',   USE_YN: 'Y' },
  { CD: 'ITM-A101', NM: 'LED Module 80W',      TYPE: 'FG',  UOM: 'EA', STATUS: 'ACTIVE',   USE_YN: 'Y' },
  { CD: 'ITM-B205', NM: 'PCB Board Rev.3',     TYPE: 'SF',  UOM: 'EA', STATUS: 'ACTIVE',   USE_YN: 'Y' },
  { CD: 'ITM-B206', NM: 'PCB Board Rev.4',     TYPE: 'SF',  UOM: 'EA', STATUS: 'PHASEOUT', USE_YN: 'Y' },
  { CD: 'ITM-C310', NM: 'Aluminum Heatsink',   TYPE: 'RM',  UOM: 'KG', STATUS: 'ACTIVE',   USE_YN: 'Y' },
  { CD: 'ITM-C311', NM: 'Copper Wire 1.5mm',   TYPE: 'RM',  UOM: 'KG', STATUS: 'ACTIVE',   USE_YN: 'Y' },
  { CD: 'ITM-D420', NM: 'Plastic Housing',     TYPE: 'RM',  UOM: 'EA', STATUS: 'ACTIVE',   USE_YN: 'N' },
  { CD: 'ITM-D421', NM: 'Glass Cover',         TYPE: 'RM',  UOM: 'EA', STATUS: 'ACTIVE',   USE_YN: 'Y' },
];

export default function DmMasterBasicMockup() {
  const [tab, setTab] = useState(0);
  return (
    <MockShell
      patternCode="plannel_dm_master_basic"
      patternLabel="PlaNEL — DM 기본 마스터 (Item / Customer / Site / Location / Workcenter / Resource / Supplier)"
      layoutCategory="LAYOUT_SINGLE"
      description="기본 마스터 CRUD — 단일 BaseGrid + 검색조건 + Add/Save/Delete 버튼. 7개 마스터 공통 layout."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <TextField label="코드" size="small" value="" placeholder="CD/NM 검색" sx={{ width: 200 }} />
          <TextField label="Type" size="small" select value="ALL" sx={{ width: 130 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="FG">완제품 (FG)</MenuItem>
            <MenuItem value="SF">반제품 (SF)</MenuItem>
            <MenuItem value="RM">원자재 (RM)</MenuItem>
          </TextField>
          <TextField label="USE_YN" size="small" select value="Y" sx={{ width: 100 }}>
            <MenuItem value="">전체</MenuItem>
            <MenuItem value="Y">사용</MenuItem>
            <MenuItem value="N">미사용</MenuItem>
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
        </Stack>
      </Box>

      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Item Master" />
          <Tab label="Customer / Site / Location / Workcenter / Resource / Supplier" disabled />
        </Tabs>
        <Box sx={{ flexGrow: 1 }} />
        <Stack direction="row" spacing={0.75} sx={{ pr: 1 }}>
          <Button size="small" startIcon={<AddIcon />}>추가</Button>
          <Button size="small" startIcon={<DeleteIcon />} color="error">삭제</Button>
          <Button size="small" startIcon={<SaveIcon />} variant="contained">저장</Button>
        </Stack>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.100' }}>
              <TableCell padding="checkbox"><Checkbox size="small" /></TableCell>
              <TableCell sx={{ fontWeight: 700 }}>코드</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>명칭</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>UOM</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>USE_YN</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {SAMPLE_ROWS.map((r) => (
              <TableRow key={r.CD} hover>
                <TableCell padding="checkbox"><Checkbox size="small" /></TableCell>
                <TableCell sx={{ fontFamily: 'monospace' }}>{r.CD}</TableCell>
                <TableCell>{r.NM}</TableCell>
                <TableCell><Chip label={r.TYPE} size="small" variant="outlined" /></TableCell>
                <TableCell>{r.UOM}</TableCell>
                <TableCell>
                  <Chip label={r.STATUS} size="small"
                    color={r.STATUS === 'ACTIVE' ? 'success' : 'warning'} />
                </TableCell>
                <TableCell>{r.USE_YN}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </MockShell>
  );
}
