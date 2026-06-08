import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Typography, Paper, Chip, Button,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import MockShell from '../../_shared/MockShell';

// ORON — RP 분배 실적
// 대표 화면: UI_RP_ORN_PLAN_ACTUAL "분배 계획/실적" (OrnPlanActual)
//   SearchArea: PlanScope, Version, 출발거점, 도착거점, 품목, 기간
//   Grid: 거점-품목별 PLAN_QTY vs ACT_QTY vs ACHV_RATE
// 같이 묶인 메뉴: UI_RP_ORN_77 출하실적 조회, UI_RP_ORN_91 OSLS 수신

const GRID_HEADERS = [
  { name: 'FROM_LOCAT_NM', width: 130, align: 'left' },
  { name: 'TO_LOCAT_NM',   width: 130, align: 'left' },
  { name: 'ITEM_CD',       width: 130, align: 'center', mono: true },
  { name: 'ITEM_NM',       width: 200, align: 'left' },
  { name: 'PLAN_QTY',      width: 100, align: 'right',  mono: true, num: true },
  { name: 'ACT_QTY',       width: 100, align: 'right',  mono: true, num: true },
  { name: 'DIFF_QTY',      width: 100, align: 'right',  mono: true, num: true },
  { name: 'ACHV_RATE',     width: 100, align: 'right',  mono: true, pct: true },
  { name: 'STATUS',        width: 100, align: 'center' },
];

const ROWS = [
  { FROM_LOCAT_NM: '익산공장', TO_LOCAT_NM: '서울 물류센터', ITEM_CD: 'ORN-MK-001', ITEM_NM: '오론 비건마스크 5매', PLAN_QTY: 12000, ACT_QTY: 11800, DIFF_QTY: -200,  ACHV_RATE: 98.3, STATUS: 'NORMAL' },
  { FROM_LOCAT_NM: '익산공장', TO_LOCAT_NM: '부산 물류센터', ITEM_CD: 'ORN-MK-001', ITEM_NM: '오론 비건마스크 5매', PLAN_QTY: 6500,  ACT_QTY: 6500,  DIFF_QTY: 0,     ACHV_RATE: 100.0, STATUS: 'NORMAL' },
  { FROM_LOCAT_NM: '익산공장', TO_LOCAT_NM: '제주 물류센터', ITEM_CD: 'ORN-MK-001', ITEM_NM: '오론 비건마스크 5매', PLAN_QTY: 2200,  ACT_QTY: 1800,  DIFF_QTY: -400,  ACHV_RATE: 81.8, STATUS: 'SHORT' },
  { FROM_LOCAT_NM: '익산공장', TO_LOCAT_NM: '서울 물류센터', ITEM_CD: 'ORN-SR-101', ITEM_NM: '오론 세럼 30ml',       PLAN_QTY: 4500,  ACT_QTY: 4500,  DIFF_QTY: 0,     ACHV_RATE: 100.0, STATUS: 'NORMAL' },
  { FROM_LOCAT_NM: '익산공장', TO_LOCAT_NM: '대구 영업소',   ITEM_CD: 'ORN-SR-101', ITEM_NM: '오론 세럼 30ml',       PLAN_QTY: 1800,  ACT_QTY: 2000,  DIFF_QTY: 200,   ACHV_RATE: 111.1, STATUS: 'OVER' },
  { FROM_LOCAT_NM: 'OEM 공장', TO_LOCAT_NM: 'OEM 직송',     ITEM_CD: 'OEM-SUN-50', ITEM_NM: 'OEM 선크림 SPF50+',   PLAN_QTY: 8500,  ACT_QTY: 8200,  DIFF_QTY: -300,  ACHV_RATE: 96.5, STATUS: 'NORMAL' },
];

const STATUS_COLOR = {
  NORMAL: '#10b981',
  OVER:   '#3b82f6',
  SHORT:  '#ef4444',
};

const summary = ROWS.reduce(
  (acc, r) => ({
    plan: acc.plan + r.PLAN_QTY,
    act:  acc.act  + r.ACT_QTY,
  }),
  { plan: 0, act: 0 }
);
const summaryRate = ((summary.act / summary.plan) * 100).toFixed(1);

export default function OronRpActualMockup() {
  return (
    <MockShell
      patternCode="oron_rp_actual"
      patternLabel="ORON — RP 분배 계획/실적 (실적 리포트)"
      layoutCategory="LAYOUT_SINGLE"
      description="대표 화면 = 분배 계획/실적 (UI_RP_ORN_PLAN_ACTUAL). 거점-품목 단위 PLAN_QTY vs ACT_QTY 비교 + 차이/달성률 + 상태(NORMAL/OVER/SHORT). 같이 묶인 메뉴 = UI_RP_ORN_77 출하실적 조회, UI_RP_ORN_91 OSLS 수신."
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
          <TextField label="FROM_LOCAT" size="small" value="전체" sx={{ width: 150 }}
            InputProps={{ endAdornment: <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} /> }} />
          <TextField label="TO_LOCAT" size="small" value="전체" sx={{ width: 150 }}
            InputProps={{ endAdornment: <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} /> }} />
          <TextField label="ITEM" size="small" value="" sx={{ width: 200 }}
            InputProps={{ endAdornment: <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} /> }} />
          <TextField label="기간" size="small" value="2026-06-01 ~ 06-07" sx={{ width: 200 }} />
        </Stack>
      </Box>

      {/* Summary chips + Excel button */}
      <Box sx={{ px: 1.5, py: 0.7, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip label={`PLAN ${summary.plan.toLocaleString()}`} size="small" variant="outlined" sx={{ fontFamily: 'monospace' }} />
        <Chip label={`ACT ${summary.act.toLocaleString()}`}   size="small" variant="outlined" sx={{ fontFamily: 'monospace' }} />
        <Chip label={`달성률 ${summaryRate}%`} size="small" color="success" variant="outlined" sx={{ fontFamily: 'monospace' }} />
        <Box sx={{ flexGrow: 1 }} />
        <Button size="small" variant="outlined" startIcon={<DownloadIcon />}>Excel</Button>
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
                      if (c.name === 'STATUS') {
                        return (
                          <TableCell key={c.name} sx={{ fontSize: 12, textAlign: 'center', fontWeight: 600, color: STATUS_COLOR[v] }}>{v}</TableCell>
                        );
                      }
                      if (c.name === 'DIFF_QTY') {
                        return (
                          <TableCell key={c.name} sx={{ fontSize: 12, textAlign: 'right', fontFamily: 'monospace', color: v < 0 ? '#ef4444' : v > 0 ? '#3b82f6' : '#374151' }}>
                            {v > 0 ? '+' : ''}{v.toLocaleString()}
                          </TableCell>
                        );
                      }
                      if (c.name === 'ACHV_RATE') {
                        return (
                          <TableCell key={c.name} sx={{ fontSize: 12, textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: v >= 95 && v <= 105 ? '#10b981' : v < 95 ? '#ef4444' : '#3b82f6' }}>
                            {v.toFixed(1)}%
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
