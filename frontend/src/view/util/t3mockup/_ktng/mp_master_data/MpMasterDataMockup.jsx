import React, { useState } from 'react';
import { Box, Stack, TextField, MenuItem, Button, Chip, Tabs, Tab, Paper, Typography,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Checkbox } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import UploadIcon from '@mui/icons-material/Upload';
import MockShell from '../../_shared/MockShell';

// MpKtng01 (기준정보 마스터), MpKtng09 (자재 마스터) — 통합 마스터 그리드 (탭 전환)

const BASE_ROWS = [
  { ITEM_CD: 'TL-RD-001', ITEM_NM: '레드 클래식', PLANT: '신탄진', LOT_SIZE: 50000, CYCLE: 72, CAPA: 850000, USE_YN: 'Y' },
  { ITEM_CD: 'TL-RD-002', ITEM_NM: '레드 라이트', PLANT: '신탄진', LOT_SIZE: 50000, CYCLE: 72, CAPA: 720000, USE_YN: 'Y' },
  { ITEM_CD: 'TL-BL-005', ITEM_NM: '블루 멘솔',   PLANT: '대전',   LOT_SIZE: 40000, CYCLE: 60, CAPA: 580000, USE_YN: 'Y' },
  { ITEM_CD: 'TL-BL-006', ITEM_NM: '블루 슬림',   PLANT: '대전',   LOT_SIZE: 30000, CYCLE: 60, CAPA: 420000, USE_YN: 'Y' },
  { ITEM_CD: 'EQ-IL-101', ITEM_NM: 'illuvia V3',  PLANT: '광주',   LOT_SIZE:  5000, CYCLE: 24, CAPA:  80000, USE_YN: 'Y' },
  { ITEM_CD: 'EQ-IL-105', ITEM_NM: 'illuvia 스틱',PLANT: '광주',   LOT_SIZE: 20000, CYCLE: 24, CAPA: 240000, USE_YN: 'Y' },
];

const MAT_ROWS = [
  { MAT_CD: 'MT-FT-301',  MAT_NM: '필터 표준',       UOM: 'KG', SAFETY: 5000,  REORDER: 3000,  LEAD_DAYS: 7,  STATUS: 'normal' },
  { MAT_CD: 'MT-TB-410',  MAT_NM: 'Tobacco Blend A',  UOM: 'KG', SAFETY: 25000, REORDER: 12000, LEAD_DAYS: 21, STATUS: 'normal' },
  { MAT_CD: 'MT-TB-411',  MAT_NM: 'Tobacco Blend B',  UOM: 'KG', SAFETY: 18000, REORDER:  8000, LEAD_DAYS: 21, STATUS: 'normal' },
  { MAT_CD: 'MT-PP-512',  MAT_NM: '포장 KING-SIZE',   UOM: 'EA', SAFETY: 200000,REORDER:120000, LEAD_DAYS: 14, STATUS: 'short' },
  { MAT_CD: 'MT-MN-722',  MAT_NM: '멘솔 향료',         UOM: 'L',  SAFETY:  1500, REORDER:   800, LEAD_DAYS: 30, STATUS: 'short' },
  { MAT_CD: 'MT-LB-880',  MAT_NM: '라벨 필름',         UOM: 'KG', SAFETY:  8000, REORDER:  4500, LEAD_DAYS: 10, STATUS: 'normal' },
];

export default function MpMasterDataMockup() {
  const [tab, setTab] = useState(0);
  return (
    <MockShell patternCode="ktng_mp_master_data" patternLabel="KTNG — MP 기준정보 / 자재 마스터 (MpKtng01/09)"
      layoutCategory="LAYOUT_SINGLE" description="MP 운영을 위한 기준정보 + 자재 마스터. 탭으로 전환.">
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <TextField label="ITEM/MAT" size="small" value="" placeholder="코드/명칭 검색" sx={{ width: 200 }} />
          <TextField label="공장" size="small" select value="ALL" sx={{ width: 130 }}>
            <MenuItem value="ALL">전체</MenuItem><MenuItem value="신탄진">신탄진</MenuItem><MenuItem value="대전">대전</MenuItem><MenuItem value="광주">광주</MenuItem>
          </TextField>
          <TextField label="USE_YN" size="small" select value="Y" sx={{ width: 100 }}>
            <MenuItem value="">전체</MenuItem><MenuItem value="Y">Y</MenuItem><MenuItem value="N">N</MenuItem>
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
        </Stack>
      </Box>

      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="기준정보 마스터 (MpKtng01)" />
          <Tab label="자재 마스터 (MpKtng09)" />
        </Tabs>
        <Box sx={{ flexGrow: 1 }} />
        <Stack direction="row" spacing={0.75} sx={{ pr: 1 }}>
          <Button size="small" startIcon={<UploadIcon />}>Excel 업로드</Button>
          <Button size="small" startIcon={<AddIcon />}>추가</Button>
          <Button size="small" startIcon={<SaveIcon />} variant="contained">저장</Button>
        </Stack>
      </Box>

      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {/* 기준정보 마스터 — MpKtng01 */}
        {tab === 0 && (
          <Paper variant="outlined" sx={{ flex: 1 }}>
            <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main' }}>기준정보 마스터 — {BASE_ROWS.length}건</Typography>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox" sx={{ backgroundColor: 'grey.100' }}><Checkbox size="small" disabled /></TableCell>
                    {['ITEM_CD','ITEM_NM','PLANT','LOT_SIZE','CYCLE (h)','CAPA (본/일)','USE_YN'].map((c) => (
                      <TableCell key={c} sx={{ backgroundColor: 'grey.100', fontWeight: 700, textAlign: c === 'USE_YN' ? 'center' : (c.includes('SIZE') || c.includes('CAPA') || c.includes('CYCLE') ? 'right' : 'left') }}>{c}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {BASE_ROWS.map((r, i) => (
                    <TableRow key={i} hover>
                      <TableCell padding="checkbox"><Checkbox size="small" disabled /></TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{r.ITEM_CD}</TableCell>
                      <TableCell>{r.ITEM_NM}</TableCell>
                      <TableCell>{r.PLANT}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.LOT_SIZE.toLocaleString()}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.CYCLE}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.CAPA.toLocaleString()}</TableCell>
                      <TableCell sx={{ textAlign: 'center' }}><Chip size="small" label={r.USE_YN} color="success" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/* 자재 마스터 — MpKtng09 */}
        {tab === 1 && (
          <Paper variant="outlined" sx={{ flex: 1 }}>
            <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'warning.main' }}>자재 마스터 — {MAT_ROWS.length}건 / Short {MAT_ROWS.filter(r=>r.STATUS==='short').length}건</Typography>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {['MAT_CD','자재명','UOM','SAFETY','REORDER','L/T (일)','상태'].map((c) => (
                      <TableCell key={c} sx={{ backgroundColor: 'grey.100', fontWeight: 700,
                        textAlign: ['SAFETY','REORDER','L/T (일)'].includes(c) ? 'right' : (c === '상태' || c === 'UOM' ? 'center' : 'left') }}>{c}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {MAT_ROWS.map((r, i) => (
                    <TableRow key={i} hover>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{r.MAT_CD}</TableCell>
                      <TableCell>{r.MAT_NM}</TableCell>
                      <TableCell sx={{ textAlign: 'center' }}><Chip size="small" label={r.UOM} variant="outlined" /></TableCell>
                      <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.SAFETY.toLocaleString()}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.REORDER.toLocaleString()}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.LEAD_DAYS}</TableCell>
                      <TableCell sx={{ textAlign: 'center' }}><Chip size="small" label={r.STATUS.toUpperCase()} color={r.STATUS === 'short' ? 'warning' : 'success'} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
      </Box>
    </MockShell>
  );
}
