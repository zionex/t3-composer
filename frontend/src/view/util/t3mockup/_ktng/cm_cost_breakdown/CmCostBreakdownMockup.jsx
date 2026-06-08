import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Typography, Paper, Chip, Tabs, Tab, Button,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CalculateIcon from '@mui/icons-material/Calculate';
import MockShell from '../../_shared/MockShell';

// KTNG — CM 비용 내역 (7종)
// 대표 화면: UI_CM_KTNG_02 재료비 → CmKtng02.jsx
//   SearchArea: 기준월, PROD_CNTRY, CC_NGP, ITEM, ITEM_GRP 등
//   상단: grid1 (재료비 상세) - BASE_YM × PROD_ITEM × SIM_ITEM × FINAL_MAT_COST × CATEGORY × ITEM_GRP × LAST_ISSUE_COST × CORP_RATIO%
//   하단: grid2 (마스터 카테고리) - BASE_YM × CC_NGP × ITEM_GRP × ITEM_ATTR
// 같이 묶인 메뉴: 03 마킹비, 04 하이퍼인플레이션, 05 물류비, 06 관세, 07 정상자재, 08 원화가

const TABS = [
  { code: '02', label: '재료비',          menu: 'UI_CM_KTNG_02' },
  { code: '03', label: '마킹비',          menu: 'UI_CM_KTNG_03' },
  { code: '04', label: '하이퍼인플레이션', menu: 'UI_CM_KTNG_04' },
  { code: '05', label: '물류비',          menu: 'UI_CM_KTNG_05' },
  { code: '06', label: '관세',            menu: 'UI_CM_KTNG_06' },
  { code: '07', label: '정상자재',        menu: 'UI_CM_KTNG_07' },
  { code: '08', label: '원화가',          menu: 'UI_CM_KTNG_08' },
];

const G1_ROWS = [
  { BASE_YM: '2026-06', CC_NGP: 'CC', PROD_CNTRY: '한국',      PROD_ITEM_CD: 'ITM-ESSE-INTL', PROD_ITEM_NM: 'ESSE Asian',  SIM_CNTRY: '한국',     SIM_ITEM_CD: 'ITM-ESSE-INTL', SIM_ITEM_NM: 'ESSE Asian',  FINAL_SUM: 977.5,  CATEGORY: 'TOBACCO',    ITEM_GRP_NM: '잎담배',     ATTR_NM: 'KS 일반',  CURCY_NM: 'KRW', LAST_ISSUE: 832.0, CORP_RATIO: 117.5, FINAL_MAT: 977.5,  REF_YYYYMM: '2026-05' },
  { BASE_YM: '2026-06', CC_NGP: 'CC', PROD_CNTRY: '한국',      PROD_ITEM_CD: 'ITM-ESSE-INTL', PROD_ITEM_NM: 'ESSE Asian',  SIM_CNTRY: '한국',     SIM_ITEM_CD: 'ITM-ESSE-INTL', SIM_ITEM_NM: 'ESSE Asian',  FINAL_SUM: 977.5,  CATEGORY: 'FILTER',     ITEM_GRP_NM: '필터',       ATTR_NM: 'CA',       CURCY_NM: 'KRW', LAST_ISSUE: 95.0,  CORP_RATIO: 100.0, FINAL_MAT: 95.0,   REF_YYYYMM: '2026-05' },
  { BASE_YM: '2026-06', CC_NGP: 'CC', PROD_CNTRY: '한국',      PROD_ITEM_CD: 'ITM-ESSE-INTL', PROD_ITEM_NM: 'ESSE Asian',  SIM_CNTRY: '한국',     SIM_ITEM_CD: 'ITM-ESSE-INTL', SIM_ITEM_NM: 'ESSE Asian',  FINAL_SUM: 977.5,  CATEGORY: 'PACKAGING',  ITEM_GRP_NM: '포장재',     ATTR_NM: '하드팩',   CURCY_NM: 'KRW', LAST_ISSUE: 50.5,  CORP_RATIO: 100.0, FINAL_MAT: 50.5,   REF_YYYYMM: '2026-05' },
  { BASE_YM: '2026-06', CC_NGP: 'CC', PROD_CNTRY: '카자흐스탄', PROD_ITEM_CD: 'ITM-TIME-INTL', PROD_ITEM_NM: 'TIME',        SIM_CNTRY: '카자흐',    SIM_ITEM_CD: 'ITM-TIME-INTL', SIM_ITEM_NM: 'TIME',        FINAL_SUM: 914.5,  CATEGORY: 'TOBACCO',    ITEM_GRP_NM: '잎담배',     ATTR_NM: 'KS 일반',  CURCY_NM: 'KZT', LAST_ISSUE: 580.0, CORP_RATIO: 125.0, FINAL_MAT: 725.0,  REF_YYYYMM: '2026-05' },
  { BASE_YM: '2026-06', CC_NGP: 'NGP', PROD_CNTRY: '한국',     PROD_ITEM_CD: 'ITM-LIL-001',   PROD_ITEM_NM: '릴 (스틱)',    SIM_CNTRY: '한국',     SIM_ITEM_CD: 'ITM-LIL-001',   SIM_ITEM_NM: '릴 (스틱)',    FINAL_SUM: 1235.0, CATEGORY: 'HEET',       ITEM_GRP_NM: 'HEET 스틱',  ATTR_NM: 'NGP-A',    CURCY_NM: 'KRW', LAST_ISSUE: 1180.0,CORP_RATIO: 104.7, FINAL_MAT: 1235.0, REF_YYYYMM: '2026-05' },
];

const G2_ROWS = [
  { BASE_YM: '2026-06', CC_NGP: 'CC',  ITEM_GRP_CD: 'GRP-TOB',  ITEM_GRP_NM: '잎담배 (TOBACCO)', ITEM_ATTR_NM: 'KS 일반' },
  { BASE_YM: '2026-06', CC_NGP: 'CC',  ITEM_GRP_CD: 'GRP-TOB',  ITEM_GRP_NM: '잎담배 (TOBACCO)', ITEM_ATTR_NM: 'KS 프리미엄' },
  { BASE_YM: '2026-06', CC_NGP: 'CC',  ITEM_GRP_CD: 'GRP-FLT',  ITEM_GRP_NM: '필터',             ITEM_ATTR_NM: 'CA' },
  { BASE_YM: '2026-06', CC_NGP: 'CC',  ITEM_GRP_CD: 'GRP-PKG',  ITEM_GRP_NM: '포장재',           ITEM_ATTR_NM: '하드팩' },
  { BASE_YM: '2026-06', CC_NGP: 'NGP', ITEM_GRP_CD: 'GRP-HEET', ITEM_GRP_NM: 'HEET 스틱',        ITEM_ATTR_NM: 'NGP-A' },
];

export default function KtngCmCostBreakdownMockup() {
  const [tab, setTab] = React.useState(0);
  return (
    <MockShell
      patternCode="ktng_cm_cost_breakdown"
      patternLabel="KTNG — CM 비용 내역 (재료비/마킹비/하이퍼/물류비/관세/정상자재/원화가)"
      layoutCategory="LAYOUT_SINGLE"
      description="7개 비용 카테고리 (UI_CM_KTNG_02~08) 의 동일 구조 비용 분해 화면. 대표 = 재료비 (CmKtng02.jsx). 상하 2분할: 상단 grid1 (BASE_YM × 생산품목 × SIM품목 × FINAL_MAT_COST × CATEGORY × ITEM_GRP × LAST_ISSUE_COST × CORP_RATIO%) + 하단 grid2 (BASE_YM × CC_NGP × ITEM_GRP × ATTR 마스터 카테고리). 셀 데이터는 KTNG 도메인 (잎담배/필터/포장재 + ESSE/TIME/릴 NGP)."
    >
      {/* Sub tabs */}
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 1.5 }}>
        <Tabs value={tab} onChange={(_e, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
          {TABS.map((t, i) => (
            <Tab key={t.code} label={
              <Stack direction="row" spacing={1} alignItems="center">
                <span>{t.label}</span>
                <Chip label={t.menu} size="small" variant="outlined" sx={{ height: 18, fontSize: 10, fontFamily: 'monospace' }} />
              </Stack>
            } />
          ))}
        </Tabs>
      </Box>

      {/* SearchArea */}
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="BASE_YM" size="small" select value="2026-06" sx={{ width: 130 }}>
            <MenuItem value="2026-06">2026-06</MenuItem>
          </TextField>
          <TextField label="PROD_CNTRY" size="small" select value="ALL" sx={{ width: 160 }}>
            <MenuItem value="ALL">전체</MenuItem>
          </TextField>
          <TextField label="CC_NGP" size="small" select value="ALL" sx={{ width: 110 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="CC">CC</MenuItem>
            <MenuItem value="NGP">NGP</MenuItem>
          </TextField>
          <TextField label="ITEM_GRP" size="small" select value="ALL" sx={{ width: 160 }}>
            <MenuItem value="ALL">전체</MenuItem>
          </TextField>
          <TextField label="ITEM" size="small" value="" placeholder="품목 검색"
            InputProps={{ endAdornment: <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} /> }}
            sx={{ width: 200 }} />
          <Box sx={{ flexGrow: 1 }} />
          <Button size="small" variant="contained" color="primary" startIcon={<CalculateIcon />}>CALC_{TABS[tab].label}</Button>
        </Stack>
      </Box>

      {/* 본문 상하 2분할 */}
      <Box sx={{ p: 1.5, flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5, minHeight: 0, overflow: 'auto' }}>
        {/* 상단 grid1 — 상세 */}
        <Paper variant="outlined" sx={{ flex: 1, minHeight: 280, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ px: 1.5, py: 0.7, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{TABS[tab].label} 상세</Typography>
          </Box>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11 }}>BASE_YM</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11 }}>CC_NGP</TableCell>
                  <TableCell sx={{ bgcolor: '#dbeafe', fontWeight: 700, fontSize: 11 }} colSpan={3}>PROD_ITEM_INFO</TableCell>
                  <TableCell sx={{ bgcolor: '#fef3c7', fontWeight: 700, fontSize: 11 }} colSpan={3}>SIM_ITEM_INFO</TableCell>
                  <TableCell sx={{ bgcolor: '#dcfce7', fontWeight: 700, fontSize: 11, textAlign: 'right' }}>FINAL_SUM</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11 }}>CATEGORY</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11 }}>ITEM_GRP</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11 }}>ATTR</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11 }}>CURCY</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, textAlign: 'right' }}>LAST_ISSUE</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, textAlign: 'right' }}>CORP_RATIO</TableCell>
                  <TableCell sx={{ bgcolor: '#dcfce7', fontWeight: 700, fontSize: 11, textAlign: 'right' }}>FINAL_MAT</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11 }}>REF_YYYYMM</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {G1_ROWS.map((r, i) => {
                  const showMerged = i === 0 || G1_ROWS[i - 1].PROD_ITEM_CD !== r.PROD_ITEM_CD;
                  return (
                    <TableRow key={i} hover>
                      <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'center' }}>{showMerged ? r.BASE_YM : ''}</TableCell>
                      <TableCell sx={{ fontSize: 11, textAlign: 'center', fontWeight: 600, color: r.CC_NGP === 'NGP' ? '#8b5cf6' : '#1565c0' }}>{showMerged ? r.CC_NGP : ''}</TableCell>
                      <TableCell sx={{ fontSize: 11, textAlign: 'center' }}>{showMerged ? r.PROD_CNTRY : ''}</TableCell>
                      <TableCell sx={{ fontSize: 11, fontFamily: 'monospace' }}>{showMerged ? r.PROD_ITEM_CD : ''}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{showMerged ? r.PROD_ITEM_NM : ''}</TableCell>
                      <TableCell sx={{ fontSize: 11, textAlign: 'center' }}>{showMerged ? r.SIM_CNTRY : ''}</TableCell>
                      <TableCell sx={{ fontSize: 11, fontFamily: 'monospace' }}>{showMerged ? r.SIM_ITEM_CD : ''}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{showMerged ? r.SIM_ITEM_NM : ''}</TableCell>
                      <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right', fontWeight: 700, bgcolor: '#f0fdf4' }}>{showMerged ? r.FINAL_SUM.toFixed(1) : ''}</TableCell>
                      <TableCell sx={{ fontSize: 11, textAlign: 'center' }}>{r.CATEGORY}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{r.ITEM_GRP_NM}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{r.ATTR_NM}</TableCell>
                      <TableCell sx={{ fontSize: 11, textAlign: 'center' }}>{r.CURCY_NM}</TableCell>
                      <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right' }}>{r.LAST_ISSUE.toLocaleString()}</TableCell>
                      <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right', color: r.CORP_RATIO > 110 ? '#f59e0b' : '#374151' }}>{r.CORP_RATIO.toFixed(1)}%</TableCell>
                      <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right', fontWeight: 600 }}>{r.FINAL_MAT.toLocaleString()}</TableCell>
                      <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'center', color: 'text.secondary' }}>{r.REF_YYYYMM}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* 하단 grid2 — 마스터 카테고리 */}
        <Paper variant="outlined" sx={{ flex: 1, minHeight: 180, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ px: 1.5, py: 0.7, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography sx={{ fontSize: 12, fontWeight: 700 }}>마스터 카테고리</Typography>
          </Box>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, width: 100 }}>BASE_YM</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, width: 80 }}>CC_NGP</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, width: 120, fontFamily: 'monospace' }}>ITEM_GRP_CD</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11 }}>ITEM_GRP_NM</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11 }}>ITEM_ATTR_NM</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {G2_ROWS.map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'center' }}>{r.BASE_YM}</TableCell>
                    <TableCell sx={{ fontSize: 11, textAlign: 'center' }}>{r.CC_NGP}</TableCell>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace' }}>{r.ITEM_GRP_CD}</TableCell>
                    <TableCell sx={{ fontSize: 11 }}>{r.ITEM_GRP_NM}</TableCell>
                    <TableCell sx={{ fontSize: 11 }}>{r.ITEM_ATTR_NM}</TableCell>
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
