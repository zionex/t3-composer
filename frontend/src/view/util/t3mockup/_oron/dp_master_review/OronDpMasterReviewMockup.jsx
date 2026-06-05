import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography, Paper, Chip, Tabs, Tab,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import StarIcon from '@mui/icons-material/Star';
import MockShell from '../../_shared/MockShell';
import { cellSx } from '../../_shared/styleCallback';

// OronDp03 — 판매계획 기준정보 + 검토 + 적중률
// UI_DP_ORN_USER_DP_ACC_MAP, ORN_SHPP_PRICE, ORN_STRAT_BRAND_MGMT, ORN_DMND_ACC_ITEM_MAP_PFRSTLT,
// ORN_DP_ENTRY_SUMMARY, ORN_SALES_PLAN_REPORT_01

const USER_MAP = [
  { USER_ID: 'kim.j', USER_NM: '김지영', BRAND: 'ORON',     CHANNEL: '온라인',  ITEM_LV3: 'MASK',  REGION: '전국' },
  { USER_ID: 'park.c', USER_NM: '박철수', BRAND: 'ORON',    CHANNEL: '오프라인', ITEM_LV3: 'SERUM', REGION: '수도권' },
  { USER_ID: 'lee.s',  USER_NM: '이수민', BRAND: 'CLIENT-A',CHANNEL: 'OEM',     ITEM_LV3: 'SUN',   REGION: '전국' },
  { USER_ID: 'choi.k', USER_NM: '최경호', BRAND: 'ORON',    CHANNEL: '오프라인', ITEM_LV3: 'TONER', REGION: '영남' },
];

const BRAND_ROWS = [
  { BRAND: 'ORON',     PRIO: 1, STRAT: 'GROWTH',   GP_TGT: 38.5, PROMO_BUDGET: '12억', NM: '주력 브랜드' },
  { BRAND: 'CLIENT-A', PRIO: 2, STRAT: 'OEM_FIX',  GP_TGT: 12.0, PROMO_BUDGET: '0',    NM: 'OEM 고정 마진' },
  { BRAND: 'CLIENT-B', PRIO: 3, STRAT: 'MAINTAIN', GP_TGT: 15.0, PROMO_BUDGET: '1억',  NM: 'OEM 유지' },
  { BRAND: 'PRIVATE',  PRIO: 4, STRAT: 'TEST',     GP_TGT: 22.0, PROMO_BUDGET: '5천',  NM: 'PB 테스트' },
];

const ACCURACY = [
  { USER_ID: 'kim.j',  USER_NM: '김지영',  PLAN: 38500, ACT: 37800, GAP_PCT: -1.8, ACC_M1: 96.5, ACC_M3: 92.2, GRADE: 'A' },
  { USER_ID: 'park.c', USER_NM: '박철수',  PLAN: 12500, ACT: 13200, GAP_PCT:  5.6, ACC_M1: 94.4, ACC_M3: 88.5, GRADE: 'B' },
  { USER_ID: 'lee.s',  USER_NM: '이수민',  PLAN: 18500, ACT: 17200, GAP_PCT: -7.0, ACC_M1: 92.0, ACC_M3: 85.8, GRADE: 'B' },
  { USER_ID: 'choi.k', USER_NM: '최경호',  PLAN:  8500, ACT:  7200, GAP_PCT:-15.3, ACC_M1: 84.7, ACC_M3: 80.2, GRADE: 'C' },
];

const GRADE_COLOR = { A: 'success', B: 'primary', C: 'warning', D: 'error' };

export default function OronDpMasterReviewMockup() {
  const [tab, setTab] = React.useState(0);
  return (
    <MockShell
      patternCode="oron_dp_master_review"
      patternLabel="ORON — 판매계획 기준정보 + 검토 + 적중률"
      layoutCategory="LAYOUT_SINGLE"
      description="입력 담당자 관리 · 전략 브랜드 · 출고가 · 거래처-품목 매핑 · 계획 검토 · 적중률 보고서 통합."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="MAIN_VER" size="small" value="V2026-05" sx={{ width: 140 }} />
          <TextField label="브랜드" size="small" select value="ALL" sx={{ width: 130 }}>
            <MenuItem value="ALL">전체</MenuItem>
          </TextField>
          <TextField label="기간" size="small" value="2026-06 ~ 12" sx={{ width: 150 }} />
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
        </Stack>
      </Box>

      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 1.5 }}>
        <Tabs value={tab} onChange={(_e, v) => setTab(v)} variant="scrollable">
          <Tab label="담당자 관리" />
          <Tab label="전략 브랜드" />
          <Tab label="출고가" />
          <Tab label="거래처-품목 매핑" />
          <Tab label="계획 검토" />
          <Tab label="적중률 리포트" />
        </Tabs>
      </Box>

      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5, height: '100%' }}>
        {/* 담당자 관리 */}
        <Paper variant="outlined" sx={{ flex: 0.9, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>판매계획 입력 담당자 ↔ 영역 매핑</Typography>
          </Box>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 100, textAlign: 'center' }}>USER_ID</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 110 }}>담당자</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 120, textAlign: 'center' }}>브랜드</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 110, textAlign: 'center' }}>채널</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 110, textAlign: 'center' }}>Lvl3</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 110, textAlign: 'center' }}>지역</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {USER_MAP.map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={cellSx('info', { align: 'center', mono: true })}>{r.USER_ID}</TableCell>
                    <TableCell>{r.USER_NM}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{r.BRAND}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{r.CHANNEL}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace' }}>{r.ITEM_LV3}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{r.REGION}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* 전략 브랜드 */}
        <Paper variant="outlined" sx={{ flex: 0.9, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <StarIcon fontSize="small" color="warning" />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>전략 브랜드 관리 — GP 목표/프로모션 예산</Typography>
            </Stack>
          </Box>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 120, textAlign: 'center' }}>브랜드</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 80, textAlign: 'center' }}>우선순위</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 130, textAlign: 'center' }}>전략 코드</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 100, textAlign: 'right' }}>GP 목표</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 120, textAlign: 'right' }}>프로모션 예산</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700 }}>설명</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {BRAND_ROWS.map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={cellSx('info', { align: 'center', mono: true })}>{r.BRAND}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}><Chip label={`P${r.PRIO}`} size="small" color={r.PRIO === 1 ? 'success' : 'default'} variant="outlined" /></TableCell>
                    <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace' }}>{r.STRAT}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 600, color: r.GP_TGT >= 30 ? '#10b981' : r.GP_TGT >= 20 ? '#1565c0' : '#e65100' }}>{r.GP_TGT.toFixed(1)}%</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.PROMO_BUDGET}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{r.NM}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* 적중률 */}
        <Paper variant="outlined" sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>판매계획 적중률 보고서 (담당자별)</Typography>
          </Box>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 100, textAlign: 'center' }}>USER_ID</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 110 }}>담당자</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 110, textAlign: 'right' }}>계획 합계</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 110, textAlign: 'right' }}>실적 합계</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 110, textAlign: 'right' }}>GAP %</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 110, textAlign: 'right' }}>M-1 정확도</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 110, textAlign: 'right' }}>M-3 정확도</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 90, textAlign: 'center' }}>등급</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ACCURACY.map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={cellSx('info', { align: 'center', mono: true })}>{r.USER_ID}</TableCell>
                    <TableCell>{r.USER_NM}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.PLAN.toLocaleString()}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.ACT.toLocaleString()}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: Math.abs(r.GAP_PCT) <= 3 ? '#10b981' : Math.abs(r.GAP_PCT) <= 8 ? '#e65100' : '#c62828' }}>
                      {r.GAP_PCT > 0 ? '+' : ''}{r.GAP_PCT.toFixed(1)}%
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>{r.ACC_M1.toFixed(1)}%</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>{r.ACC_M3.toFixed(1)}%</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}><Chip label={r.GRADE} size="small" color={GRADE_COLOR[r.GRADE] || 'default'} /></TableCell>
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
