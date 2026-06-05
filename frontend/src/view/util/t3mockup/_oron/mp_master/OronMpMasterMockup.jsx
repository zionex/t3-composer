import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography, Chip, Tabs, Tab,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Paper,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import MockShell from '../../_shared/MockShell';
import { cellSx } from '../../_shared/styleCallback';

// OronMp01 — 기준정보 마스터 (완제품/반제품/원부자재/자원/제품그룹)
// 운영 화면: UI_MP_ITEM, UI_MP_ORN_HALB_ITEM, UI_MP_ORN_MRP_ITEM, UI_MP_ORN_RESOURCE, UI_MP_ORN_ITEM_GRP
// 패턴: SearchArea + TabContainer + BaseGrid (마스터 CRUD 표준)

const TABS = [
  { key: 'fert', label: '완제품 (FERT)',     count: 1284 },
  { key: 'halb', label: '반제품 (HALB)',     count: 532 },
  { key: 'mrp',  label: '원부자재 (ROH)',    count: 2147 },
  { key: 'res',  label: '생산라인',          count: 24 },
  { key: 'grp',  label: '제품그룹',          count: 68 },
];

const COLS = [
  { name: 'ITEM_CD',     label: '품목코드',      width: 120, align: 'center' },
  { name: 'ITEM_NM',     label: '품목명',        width: 200, align: 'left' },
  { name: 'ITEM_TP',     label: '품목유형',      width: 90,  align: 'center' },
  { name: 'BRAND_NM',    label: '브랜드',        width: 110, align: 'center' },
  { name: 'FLAV_NM',     label: '향',            width: 80,  align: 'center' },
  { name: 'ITEM_LV3',    label: 'Lvl3',          width: 90,  align: 'center' },
  { name: 'EA_BOX',      label: 'EA/BOX',        width: 80,  align: 'right' },
  { name: 'UOM',         label: 'UOM',           width: 70,  align: 'center' },
  { name: 'STATUS',      label: '상태',          width: 80,  align: 'center' },
  { name: 'LIFE_CYCL',   label: 'PLC',           width: 80,  align: 'center' },
  { name: 'ACTV_DT',     label: '활성일',        width: 100, align: 'center' },
];

const ROWS = [
  { ITEM_CD: 'F01001', ITEM_NM: '오론 비건마스크 시그니처 5매',    ITEM_TP: 'FERT', BRAND_NM: 'ORON',     FLAV_NM: '기본',  ITEM_LV3: 'MASK',  EA_BOX: 40,  UOM: 'EA', STATUS: 'ACTV', LIFE_CYCL: 'GROWTH', ACTV_DT: '2024-03-01' },
  { ITEM_CD: 'F01002', ITEM_NM: '오론 세럼 아쿠아 30ml',           ITEM_TP: 'FERT', BRAND_NM: 'ORON',     FLAV_NM: '아쿠아', ITEM_LV3: 'SERUM', EA_BOX: 24,  UOM: 'EA', STATUS: 'ACTV', LIFE_CYCL: 'MATURE', ACTV_DT: '2023-09-15' },
  { ITEM_CD: 'F01003', ITEM_NM: '오론 토너 카밍 200ml',            ITEM_TP: 'FERT', BRAND_NM: 'ORON',     FLAV_NM: '카밍',   ITEM_LV3: 'TONER', EA_BOX: 12,  UOM: 'EA', STATUS: 'ACTV', LIFE_CYCL: 'GROWTH', ACTV_DT: '2024-06-20' },
  { ITEM_CD: 'F02001', ITEM_NM: '오론 클렌징폼 마일드 150g',       ITEM_TP: 'FERT', BRAND_NM: 'ORON',     FLAV_NM: '마일드', ITEM_LV3: 'CLEAN', EA_BOX: 36,  UOM: 'EA', STATUS: 'ACTV', LIFE_CYCL: 'MATURE', ACTV_DT: '2022-11-01' },
  { ITEM_CD: 'F03001', ITEM_NM: 'OEM 선크림 SPF50+ 50ml',          ITEM_TP: 'FERT', BRAND_NM: 'CLIENT-A', FLAV_NM: '기본',  ITEM_LV3: 'SUN',   EA_BOX: 48,  UOM: 'EA', STATUS: 'ACTV', LIFE_CYCL: 'GROWTH', ACTV_DT: '2025-01-10' },
  { ITEM_CD: 'F03002', ITEM_NM: 'OEM 립밤 모이스처 5g',            ITEM_TP: 'FERT', BRAND_NM: 'CLIENT-B', FLAV_NM: '모이스처', ITEM_LV3: 'LIP', EA_BOX: 120, UOM: 'EA', STATUS: 'EOP',  LIFE_CYCL: 'DECLINE',ACTV_DT: '2021-05-12' },
  { ITEM_CD: 'F04001', ITEM_NM: '오론 마스크팩 시트 1매',           ITEM_TP: 'FERT', BRAND_NM: 'ORON',     FLAV_NM: '기본',  ITEM_LV3: 'MASK',  EA_BOX: 200, UOM: 'EA', STATUS: 'ACTV', LIFE_CYCL: 'INTRO',  ACTV_DT: '2026-02-01' },
  { ITEM_CD: 'F04002', ITEM_NM: '오론 슬리핑팩 50ml',              ITEM_TP: 'FERT', BRAND_NM: 'ORON',     FLAV_NM: '나이트', ITEM_LV3: 'CREAM', EA_BOX: 30,  UOM: 'EA', STATUS: 'ACTV', LIFE_CYCL: 'GROWTH', ACTV_DT: '2025-08-20' },
  { ITEM_CD: 'F05001', ITEM_NM: '리테일 화장솜 100매',              ITEM_TP: 'FERT', BRAND_NM: 'PRIVATE', FLAV_NM: '-',     ITEM_LV3: 'PAD',   EA_BOX: 60,  UOM: 'EA', STATUS: 'ACTV', LIFE_CYCL: 'MATURE', ACTV_DT: '2023-04-01' },
  { ITEM_CD: 'F05002', ITEM_NM: '리테일 면봉 200P',                 ITEM_TP: 'FERT', BRAND_NM: 'PRIVATE', FLAV_NM: '-',     ITEM_LV3: 'STICK', EA_BOX: 120, UOM: 'EA', STATUS: 'STOP', LIFE_CYCL: 'EOL',     ACTV_DT: '2020-07-15' },
];

const STATUS_COLOR = {
  ACTV:  'success',
  EOP:   'warning',
  STOP:  'error',
};
const LC_COLOR = {
  INTRO:   'info',
  GROWTH:  'success',
  MATURE:  'primary',
  DECLINE: 'warning',
  EOL:     'default',
};

export default function OronMpMasterMockup() {
  const [tab, setTab] = React.useState(0);
  return (
    <MockShell
      patternCode="oron_mp_master"
      patternLabel="ORON — MP 기준정보 마스터 (완제품/반제품/자재/자원/그룹)"
      layoutCategory="LAYOUT_SINGLE"
      description="공급 계획 기준정보 마스터. 5개 탭 (완제품·반제품·원부자재·생산라인·제품그룹) 통합 CRUD."
    >
      {/* SearchArea */}
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="PLAN_SCOPE" size="small" select value="ORN_MP" sx={{ width: 150 }}>
            <MenuItem value="ORN_MP">ORN_MP</MenuItem>
          </TextField>
          <TextField label="브랜드" size="small" select value="ALL" sx={{ width: 130 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="ORON">ORON</MenuItem>
            <MenuItem value="OEM">OEM</MenuItem>
          </TextField>
          <TextField label="품목코드" size="small" placeholder="F01001" sx={{ width: 130 }} />
          <TextField label="품목명" size="small" placeholder="검색어 입력" sx={{ width: 180 }} />
          <TextField label="상태" size="small" select value="ALL" sx={{ width: 110 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="ACTV">ACTV</MenuItem>
            <MenuItem value="EOP">EOP</MenuItem>
            <MenuItem value="STOP">STOP</MenuItem>
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
        </Stack>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 1.5 }}>
        <Tabs value={tab} onChange={(_e, v) => setTab(v)} variant="scrollable">
          {TABS.map((t) => (
            <Tab
              key={t.key}
              label={
                <Stack direction="row" alignItems="center" spacing={0.8}>
                  <span>{t.label}</span>
                  <Chip size="small" label={t.count.toLocaleString()} variant="outlined" />
                </Stack>
              }
            />
          ))}
        </Tabs>
      </Box>

      {/* WorkArea */}
      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', height: '100%', gap: 1 }}>
        {/* ButtonArea */}
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {TABS[tab].label} — 10건 (총 {TABS[tab].count.toLocaleString()}건 중)
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="outlined" size="small" startIcon={<AddIcon />}>행 추가</Button>
          <Button variant="outlined" size="small" startIcon={<DeleteIcon />} color="error">행 삭제</Button>
          <Button variant="contained" size="small" startIcon={<SaveIcon />}>저장</Button>
          <Button variant="outlined" size="small" startIcon={<DownloadIcon />}>Excel</Button>
        </Stack>

        {/* Grid */}
        <Paper variant="outlined" sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" sx={{ backgroundColor: 'grey.100' }}> </TableCell>
                  {COLS.map((c) => (
                    <TableCell key={c.name} sx={{ backgroundColor: 'grey.100', width: c.width, fontWeight: 700, textAlign: c.align }}>
                      {c.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {ROWS.map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell padding="checkbox"> </TableCell>
                    {COLS.map((c) => {
                      const v = r[c.name];
                      if (c.name === 'ITEM_CD') {
                        return <TableCell key={c.name} sx={cellSx('info', { align: c.align, mono: true })}>{v}</TableCell>;
                      }
                      if (c.name === 'STATUS') {
                        return (
                          <TableCell key={c.name} sx={{ textAlign: c.align }}>
                            <Chip label={v} size="small" color={STATUS_COLOR[v] || 'default'} variant="outlined" />
                          </TableCell>
                        );
                      }
                      if (c.name === 'LIFE_CYCL') {
                        return (
                          <TableCell key={c.name} sx={{ textAlign: c.align }}>
                            <Chip label={v} size="small" color={LC_COLOR[v] || 'default'} variant="outlined" />
                          </TableCell>
                        );
                      }
                      return (
                        <TableCell key={c.name} sx={{ textAlign: c.align, fontFamily: c.align === 'right' ? 'monospace' : undefined }}>
                          {c.align === 'right' && typeof v === 'number' ? v.toLocaleString() : v}
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
