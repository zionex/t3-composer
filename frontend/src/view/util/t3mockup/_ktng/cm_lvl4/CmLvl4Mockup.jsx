import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Typography, Paper, Chip, Tabs, Tab, Button, ButtonGroup, IconButton,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import DownloadIcon from '@mui/icons-material/Download';
import MockShell from '../../_shared/MockShell';

// KTNG — CM Lvl4 (3 메뉴)
//  Tab 1: UI_CM_KTNG_09 Lvl 4 코드 & 속성 관리 → CmKtng09.jsx
//  Tab 2: UI_CM_KTNG_10 Lvl 4 생산지별 공헌이익 → CmKtng10.jsx
//  Tab 3: UI_CM_KTNG_11 Lvl 4 Unmapping 리스트 → CmKtng11.jsx

const TAB1_ROWS = [
  { LV4_CD: 'L4-ESSE-001', LV4_NM: '에쎄 스페셜 골드',     ATTR_CTG: 'TASTE',  ATTR_VAL: '저타르 1mg', ITEM_GRP: '잎담배', SHAPE: 'KS', USE_YN: 'Y' },
  { LV4_CD: 'L4-ESSE-002', LV4_NM: '에쎄 라이트',         ATTR_CTG: 'TASTE',  ATTR_VAL: '저타르 3mg', ITEM_GRP: '잎담배', SHAPE: 'KS', USE_YN: 'Y' },
  { LV4_CD: 'L4-DIS-001',  LV4_NM: '디스 플러스',         ATTR_CTG: 'TASTE',  ATTR_VAL: '6mg',         ITEM_GRP: '잎담배', SHAPE: 'KS', USE_YN: 'Y' },
  { LV4_CD: 'L4-1MG-001',  LV4_NM: '더원 오렌지 1mg',     ATTR_CTG: 'TASTE',  ATTR_VAL: '1mg 캡슐',     ITEM_GRP: '잎담배', SHAPE: 'PREMIUM', USE_YN: 'Y' },
  { LV4_CD: 'L4-TIME-001', LV4_NM: 'TIME Original',       ATTR_CTG: 'EXPORT', ATTR_VAL: '러시아 향',    ITEM_GRP: '잎담배', SHAPE: 'KS', USE_YN: 'Y' },
  { LV4_CD: 'L4-LIL-001',  LV4_NM: '릴 에이스 (LIL Aces)', ATTR_CTG: 'NGP',    ATTR_VAL: 'HEET 스틱',     ITEM_GRP: 'HEET 스틱', SHAPE: 'NGP', USE_YN: 'Y' },
];

const TAB2_ROWS = [
  { LV4_CD: 'L4-ESSE-001', LV4_NM: '에쎄 스페셜 골드',  PROD_CNTRY: '한국',      MAT_COST: 950,  CM_AMT: 1850, CM_RATE: 66.1 },
  { LV4_CD: 'L4-ESSE-001', LV4_NM: '에쎄 스페셜 골드',  PROD_CNTRY: '카자흐스탄', MAT_COST: 780,  CM_AMT: 1380, CM_RATE: 63.9 },
  { LV4_CD: 'L4-DIS-001',  LV4_NM: '디스 플러스',      PROD_CNTRY: '한국',      MAT_COST: 880,  CM_AMT: 1925, CM_RATE: 68.6 },
  { LV4_CD: 'L4-1MG-001',  LV4_NM: '더원 오렌지 1mg',  PROD_CNTRY: '한국',      MAT_COST: 1020, CM_AMT: 2180, CM_RATE: 68.1 },
  { LV4_CD: 'L4-TIME-001', LV4_NM: 'TIME Original',    PROD_CNTRY: '카자흐스탄', MAT_COST: 620,  CM_AMT: 808,  CM_RATE: 43.7 },
  { LV4_CD: 'L4-LIL-001',  LV4_NM: '릴 에이스 NGP',    PROD_CNTRY: '한국',      MAT_COST: 1180, CM_AMT: 2450, CM_RATE: 67.5 },
];

const TAB3_ROWS = [
  { ITEM_CD: 'ITM-NEW-X101', ITEM_NM: '에쎄 신제품 X101',   ITEM_GRP: '잎담배',  REASON: 'Lvl4 미할당',        REG_DT: '2026-06-05' },
  { ITEM_CD: 'ITM-NEW-Y202', ITEM_NM: '디스 한정판',         ITEM_GRP: '잎담배',  REASON: 'Lvl4 미할당',        REG_DT: '2026-06-07' },
  { ITEM_CD: 'ITM-HEET-NEW', ITEM_NM: '릴 신제품 (NGP)',    ITEM_GRP: 'HEET',    REASON: '속성 매핑 누락',     REG_DT: '2026-06-01' },
  { ITEM_CD: 'ITM-EXPT-001', ITEM_NM: 'TIME 해외향 (시제품)', ITEM_GRP: '잎담배', REASON: '생산지 매핑 누락',   REG_DT: '2026-06-03' },
];

export default function KtngCmLvl4Mockup() {
  const [tab, setTab] = React.useState(0);
  return (
    <MockShell
      patternCode="ktng_cm_lvl4"
      patternLabel="KTNG — CM Lvl 4 관리 (코드/생산지별 CM/Unmapping)"
      layoutCategory="LAYOUT_SINGLE"
      description="3개 Lvl4 관리 화면 묶음 (UI_CM_KTNG_09/10/11). Tab 1: 코드 & 속성 마스터 CRUD, Tab 2: 생산지별 공헌이익 조회, Tab 3: Unmapping 리스트 (속성/생산지 미할당 신제품 점검)."
    >
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 1.5 }}>
        <Tabs value={tab} onChange={(_e, v) => setTab(v)}>
          <Tab label={<Stack direction="row" spacing={1} alignItems="center"><span>Lvl4 코드 & 속성</span><Chip label="UI_CM_KTNG_09" size="small" variant="outlined" sx={{ height: 18, fontSize: 10, fontFamily: 'monospace' }} /></Stack>} />
          <Tab label={<Stack direction="row" spacing={1} alignItems="center"><span>생산지별 공헌이익</span><Chip label="UI_CM_KTNG_10" size="small" variant="outlined" sx={{ height: 18, fontSize: 10, fontFamily: 'monospace' }} /></Stack>} />
          <Tab label={<Stack direction="row" spacing={1} alignItems="center"><span>Unmapping 리스트</span><Chip label="UI_CM_KTNG_11" size="small" variant="outlined" sx={{ height: 18, fontSize: 10, fontFamily: 'monospace' }} /></Stack>} />
        </Tabs>
      </Box>

      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="ITEM_GRP" size="small" select value="ALL" sx={{ width: 140 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="TOBACCO">잎담배</MenuItem>
            <MenuItem value="HEET">HEET (NGP)</MenuItem>
          </TextField>
          <TextField label="ATTR_CTG" size="small" select value="ALL" sx={{ width: 130 }}>
            <MenuItem value="ALL">전체</MenuItem>
          </TextField>
          <TextField label="검색" size="small" value="" placeholder="LV4_CD / LV4_NM"
            InputProps={{ endAdornment: <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} /> }}
            sx={{ width: 220 }} />
        </Stack>
      </Box>

      <Box sx={{ px: 1.5, py: 0.7, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        <Button size="small" variant="outlined" startIcon={<DownloadIcon />}>Excel</Button>
        {tab === 0 && (
          <ButtonGroup variant="outlined" size="small">
            <IconButton size="small"><AddIcon fontSize="small" /></IconButton>
            <IconButton size="small" color="primary"><SaveIcon fontSize="small" /></IconButton>
          </ButtonGroup>
        )}
      </Box>

      <Box sx={{ p: 1.5, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Paper variant="outlined" sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                {tab === 0 && (
                  <TableRow>
                    <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, fontFamily: 'monospace' }}>LV4_CD</TableCell>
                    <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12 }}>LV4_NM</TableCell>
                    <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12 }}>ATTR_CTG</TableCell>
                    <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12 }}>ATTR_VAL</TableCell>
                    <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12 }}>ITEM_GRP</TableCell>
                    <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12 }}>SHAPE</TableCell>
                    <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, textAlign: 'center' }}>USE_YN</TableCell>
                  </TableRow>
                )}
                {tab === 1 && (
                  <TableRow>
                    <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, fontFamily: 'monospace' }}>LV4_CD</TableCell>
                    <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12 }}>LV4_NM</TableCell>
                    <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, textAlign: 'center' }}>PROD_CNTRY</TableCell>
                    <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, fontFamily: 'monospace', textAlign: 'right' }}>MAT_COST</TableCell>
                    <TableCell sx={{ bgcolor: '#dcfce7', fontWeight: 700, fontSize: 12, fontFamily: 'monospace', textAlign: 'right' }}>CM_AMT</TableCell>
                    <TableCell sx={{ bgcolor: '#dcfce7', fontWeight: 700, fontSize: 12, fontFamily: 'monospace', textAlign: 'right' }}>CM_RATE</TableCell>
                  </TableRow>
                )}
                {tab === 2 && (
                  <TableRow>
                    <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, fontFamily: 'monospace' }}>ITEM_CD</TableCell>
                    <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12 }}>ITEM_NM</TableCell>
                    <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12 }}>ITEM_GRP</TableCell>
                    <TableCell sx={{ bgcolor: '#fee2e2', fontWeight: 700, fontSize: 12 }}>UNMAP_REASON</TableCell>
                    <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, fontFamily: 'monospace', textAlign: 'center' }}>REG_DT</TableCell>
                  </TableRow>
                )}
              </TableHead>
              <TableBody>
                {tab === 0 && TAB1_ROWS.map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace' }}>{r.LV4_CD}</TableCell>
                    <TableCell sx={{ fontSize: 11 }}>{r.LV4_NM}</TableCell>
                    <TableCell sx={{ fontSize: 11, textAlign: 'center' }}>
                      <Chip label={r.ATTR_CTG} size="small" variant="outlined" sx={{ height: 18, fontSize: 10, color: r.ATTR_CTG === 'NGP' ? '#8b5cf6' : r.ATTR_CTG === 'EXPORT' ? '#ff7043' : '#1565c0' }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: 11 }}>{r.ATTR_VAL}</TableCell>
                    <TableCell sx={{ fontSize: 11 }}>{r.ITEM_GRP}</TableCell>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace' }}>{r.SHAPE}</TableCell>
                    <TableCell sx={{ fontSize: 11, textAlign: 'center', color: r.USE_YN === 'Y' ? '#10b981' : '#9ca3af' }}>{r.USE_YN}</TableCell>
                  </TableRow>
                ))}
                {tab === 1 && TAB2_ROWS.map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace' }}>{r.LV4_CD}</TableCell>
                    <TableCell sx={{ fontSize: 11 }}>{r.LV4_NM}</TableCell>
                    <TableCell sx={{ fontSize: 11, textAlign: 'center' }}>{r.PROD_CNTRY}</TableCell>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right' }}>{r.MAT_COST.toLocaleString()}</TableCell>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right', fontWeight: 700, bgcolor: '#f0fdf4' }}>{r.CM_AMT.toLocaleString()}</TableCell>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right', fontWeight: 700, bgcolor: '#f0fdf4', color: r.CM_RATE >= 50 ? '#10b981' : '#f59e0b' }}>{r.CM_RATE.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
                {tab === 2 && TAB3_ROWS.map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace' }}>{r.ITEM_CD}</TableCell>
                    <TableCell sx={{ fontSize: 11 }}>{r.ITEM_NM}</TableCell>
                    <TableCell sx={{ fontSize: 11 }}>{r.ITEM_GRP}</TableCell>
                    <TableCell sx={{ fontSize: 11, color: '#ef4444', fontWeight: 600 }}>{r.REASON}</TableCell>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'center' }}>{r.REG_DT}</TableCell>
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
