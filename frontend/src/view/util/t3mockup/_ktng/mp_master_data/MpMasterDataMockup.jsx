import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Typography, Paper, Chip, Tabs, Tab, Button, ButtonGroup, IconButton, Checkbox,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import DownloadIcon from '@mui/icons-material/Download';
import MockShell from '../../_shared/MockShell';

// KTNG — MP 기준정보 / 자재 마스터
//  Tab 1: UI_MP_KTNG_01 기준정보 마스터 → MpKtng01.jsx
//  Tab 2: UI_MP_KTNG_09 자재 마스터     → MpKtng09.jsx

const ITEM_ROWS = [
  { ITEM_CD: 'ITM-ESSE-001', ITEM_NM: '에쎄 스페셜 골드 1mg', ITEM_TYPE: 'FERT',  PROD_CNTRY: '한국',      ITEM_LV1: '담배',  ITEM_LV3: '에쎄', UOM: 'EA', LT_DAYS: 14, USE_YN: true },
  { ITEM_CD: 'ITM-DIS-001',  ITEM_NM: '디스 플러스',          ITEM_TYPE: 'FERT',  PROD_CNTRY: '한국',      ITEM_LV1: '담배',  ITEM_LV3: '디스', UOM: 'EA', LT_DAYS: 14, USE_YN: true },
  { ITEM_CD: 'ITM-1MG-001',  ITEM_NM: '더원 오렌지 1mg',      ITEM_TYPE: 'FERT',  PROD_CNTRY: '한국',      ITEM_LV1: '담배',  ITEM_LV3: '더원', UOM: 'EA', LT_DAYS: 21, USE_YN: true },
  { ITEM_CD: 'ITM-TIME-INTL', ITEM_NM: 'TIME',                ITEM_TYPE: 'FERT',  PROD_CNTRY: '카자흐스탄', ITEM_LV1: 'CIGAR', ITEM_LV3: 'TIME', UOM: 'EA', LT_DAYS: 28, USE_YN: true },
  { ITEM_CD: 'ITM-LIL-001',  ITEM_NM: '릴 에이스 NGP',        ITEM_TYPE: 'FERT',  PROD_CNTRY: '한국',      ITEM_LV1: '담배',  ITEM_LV3: '릴',   UOM: 'EA', LT_DAYS: 14, USE_YN: true },
];

const MAT_ROWS = [
  { MAT_CD: 'MAT-LEAF-001', MAT_NM: '버지니아 잎담배',     MAT_TYPE: 'ROH',  UOM: 'KG',   SAFETY_QTY: 50000,  LT_DAYS: 60, SUPPLIER: 'Virginia Leaf Co.',  USE_YN: true },
  { MAT_CD: 'MAT-LEAF-002', MAT_NM: '버얼리 잎담배',       MAT_TYPE: 'ROH',  UOM: 'KG',   SAFETY_QTY: 35000,  LT_DAYS: 60, SUPPLIER: 'Burley Trading',     USE_YN: true },
  { MAT_CD: 'MAT-FILT-CA',  MAT_NM: 'CA 필터',             MAT_TYPE: 'HALB', UOM: 'EA',   SAFETY_QTY: 2000000, LT_DAYS: 14, SUPPLIER: '대신화학',            USE_YN: true },
  { MAT_CD: 'MAT-PACK-HARD', MAT_NM: '하드팩 포장재',      MAT_TYPE: 'HALB', UOM: 'EA',   SAFETY_QTY: 1500000, LT_DAYS: 21, SUPPLIER: '한솔포장',            USE_YN: true },
  { MAT_CD: 'MAT-INK-CYAN', MAT_NM: '시안 잉크',           MAT_TYPE: 'ROH',  UOM: 'KG',   SAFETY_QTY: 5000,    LT_DAYS: 30, SUPPLIER: 'DIC Korea',           USE_YN: true },
  { MAT_CD: 'MAT-FOIL-001', MAT_NM: '알루미늄 호일',       MAT_TYPE: 'ROH',  UOM: 'M',    SAFETY_QTY: 800000,  LT_DAYS: 14, SUPPLIER: '대한제관',            USE_YN: true },
];

export default function KtngMpMasterDataMockup() {
  const [tab, setTab] = React.useState(0);
  return (
    <MockShell
      patternCode="ktng_mp_master_data"
      patternLabel="KTNG — MP 기준정보 / 자재 마스터"
      layoutCategory="LAYOUT_SINGLE"
      description="UI_MP_KTNG_01 기준정보 마스터 + UI_MP_KTNG_09 자재 마스터. 표준 마스터 CRUD."
    >
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 1.5 }}>
        <Tabs value={tab} onChange={(_e, v) => setTab(v)}>
          <Tab label={<Stack direction="row" spacing={1} alignItems="center"><span>기준정보 마스터</span><Chip label="UI_MP_KTNG_01" size="small" variant="outlined" sx={{ height: 18, fontSize: 10, fontFamily: 'monospace' }} /></Stack>} />
          <Tab label={<Stack direction="row" spacing={1} alignItems="center"><span>자재 마스터</span><Chip label="UI_MP_KTNG_09" size="small" variant="outlined" sx={{ height: 18, fontSize: 10, fontFamily: 'monospace' }} /></Stack>} />
        </Tabs>
      </Box>

      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label={tab === 0 ? 'ITEM_TYPE' : 'MAT_TYPE'} size="small" select value="ALL" sx={{ width: 130 }}>
            <MenuItem value="ALL">전체</MenuItem>
            {tab === 0 ? [<MenuItem key="FERT" value="FERT">FERT (완제품)</MenuItem>, <MenuItem key="HALB" value="HALB">HALB (반제품)</MenuItem>]
                       : [<MenuItem key="ROH" value="ROH">ROH (원자재)</MenuItem>, <MenuItem key="HALB" value="HALB">HALB (반제품)</MenuItem>]}
          </TextField>
          <TextField label={tab === 0 ? 'PROD_CNTRY' : 'SUPPLIER'} size="small" select value="ALL" sx={{ width: 180 }}><MenuItem value="ALL">전체</MenuItem></TextField>
          <TextField label="USE_YN" size="small" select value="Y" sx={{ width: 100 }}>
            <MenuItem value="ALL">ALL</MenuItem>
            <MenuItem value="Y">Y</MenuItem>
            <MenuItem value="N">N</MenuItem>
          </TextField>
          <TextField label="검색" size="small" value="" placeholder={tab === 0 ? 'ITEM_NM/CD' : 'MAT_NM/CD'}
            InputProps={{ endAdornment: <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} /> }}
            sx={{ width: 200 }} />
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
              {tab === 0 ? (
                <>
                  <TableHead><TableRow>
                    {['ITEM_CD', 'ITEM_NM', 'ITEM_TYPE', 'PROD_CNTRY', 'ITEM_LV1', 'ITEM_LV3', 'UOM', 'LT_DAYS', 'USE_YN'].map((h) => (
                      <TableCell key={h} sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, fontFamily: ['ITEM_CD'].includes(h) ? 'monospace' : 'inherit', textAlign: ['LT_DAYS', 'USE_YN', 'UOM'].includes(h) ? 'center' : 'inherit' }}>{h}</TableCell>
                    ))}
                  </TableRow></TableHead>
                  <TableBody>
                    {ITEM_ROWS.map((r, i) => (
                      <TableRow key={i} hover>
                        <TableCell sx={{ fontSize: 11, fontFamily: 'monospace' }}>{r.ITEM_CD}</TableCell>
                        <TableCell sx={{ fontSize: 11 }}>{r.ITEM_NM}</TableCell>
                        <TableCell sx={{ fontSize: 11 }}><Chip label={r.ITEM_TYPE} size="small" variant="outlined" sx={{ height: 18, fontSize: 10 }} /></TableCell>
                        <TableCell sx={{ fontSize: 11 }}>{r.PROD_CNTRY}</TableCell>
                        <TableCell sx={{ fontSize: 11 }}>{r.ITEM_LV1}</TableCell>
                        <TableCell sx={{ fontSize: 11 }}>{r.ITEM_LV3}</TableCell>
                        <TableCell sx={{ fontSize: 11, textAlign: 'center' }}>{r.UOM}</TableCell>
                        <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'center' }}>{r.LT_DAYS}일</TableCell>
                        <TableCell sx={{ textAlign: 'center' }}><Checkbox size="small" checked={r.USE_YN} disabled sx={{ p: 0.25 }} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </>
              ) : (
                <>
                  <TableHead><TableRow>
                    {['MAT_CD', 'MAT_NM', 'MAT_TYPE', 'UOM', 'SAFETY_QTY', 'LT_DAYS', 'SUPPLIER', 'USE_YN'].map((h) => (
                      <TableCell key={h} sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, fontFamily: h === 'MAT_CD' ? 'monospace' : 'inherit', textAlign: ['UOM', 'SAFETY_QTY', 'LT_DAYS', 'USE_YN'].includes(h) ? (h === 'SAFETY_QTY' ? 'right' : 'center') : 'inherit' }}>{h}</TableCell>
                    ))}
                  </TableRow></TableHead>
                  <TableBody>
                    {MAT_ROWS.map((r, i) => (
                      <TableRow key={i} hover>
                        <TableCell sx={{ fontSize: 11, fontFamily: 'monospace' }}>{r.MAT_CD}</TableCell>
                        <TableCell sx={{ fontSize: 11 }}>{r.MAT_NM}</TableCell>
                        <TableCell sx={{ fontSize: 11 }}><Chip label={r.MAT_TYPE} size="small" variant="outlined" sx={{ height: 18, fontSize: 10, color: r.MAT_TYPE === 'ROH' ? '#f59e0b' : '#3b82f6' }} /></TableCell>
                        <TableCell sx={{ fontSize: 11, textAlign: 'center' }}>{r.UOM}</TableCell>
                        <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right' }}>{r.SAFETY_QTY.toLocaleString()}</TableCell>
                        <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'center' }}>{r.LT_DAYS}일</TableCell>
                        <TableCell sx={{ fontSize: 11 }}>{r.SUPPLIER}</TableCell>
                        <TableCell sx={{ textAlign: 'center' }}><Checkbox size="small" checked={r.USE_YN} disabled sx={{ p: 0.25 }} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </>
              )}
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </MockShell>
  );
}
