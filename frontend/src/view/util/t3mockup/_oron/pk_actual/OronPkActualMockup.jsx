import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Typography, Paper, Chip, Button,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import MockShell from '../../_shared/MockShell';

// ORON — PK 생산실적
// 대표 화면: UI_PK_ORN_PACK_PLAN_ACT "생산계획 대비 실적" (OrnPlanAct)
//   SearchArea: 기간, 라인, 포장재, 결손원인
//   Grid: 라인 × 포장재 × PLAN_QTY vs ACT_QTY vs DIFF vs 달성률 vs 결손원인
// 같이 묶인 메뉴: UI_PK_ORN_PROD_ACT_OVRL 종합조회, UI_PK_ORN_PACK_RMK_SRC 이슈사항, UI_PK_ORN_PACK_TRANS 배송/생산 전송, UI_PK_ORN_ORD_RST 기간별 발주/실적

const GRID_HEADERS = [
  { name: 'PROD_DT',     width: 100, align: 'center', mono: true },
  { name: 'LINE',        width: 110, align: 'center', mono: true },
  { name: 'PACK_CD',     width: 130, align: 'center', mono: true },
  { name: 'PACK_NM',     width: 220, align: 'left' },
  { name: 'PLAN_QTY',    width: 100, align: 'right',  mono: true, num: true },
  { name: 'ACT_QTY',     width: 100, align: 'right',  mono: true, num: true },
  { name: 'DEFECT_QTY',  width: 100, align: 'right',  mono: true, num: true },
  { name: 'NET_OUT',     width: 100, align: 'right',  mono: true, num: true },
  { name: 'ACHV_RATE',   width: 100, align: 'right',  mono: true, pct: true },
  { name: 'DEFECT_RATE', width: 100, align: 'right',  mono: true, pct: true },
  { name: 'ISSUE_TP',    width: 130, align: 'center' },
  { name: 'REMARK',      width: 200, align: 'left' },
];

const ROWS = [
  { PROD_DT: '2026-06-07', LINE: 'LN-PRT-01', PACK_CD: 'PK-MK-001-T', PACK_NM: '오론 비건마스크 5매 - TUBE',  PLAN_QTY: 8000, ACT_QTY: 8200, DEFECT_QTY: 80,  NET_OUT: 8120, ACHV_RATE: 101.5, DEFECT_RATE: 0.98, ISSUE_TP: '-',          REMARK: '' },
  { PROD_DT: '2026-06-07', LINE: 'LN-PRT-01', PACK_CD: 'PK-MK-010-T', PACK_NM: '오론 비건마스크 10매 - TUBE', PLAN_QTY: 3500, ACT_QTY: 3500, DEFECT_QTY: 0,   NET_OUT: 3500, ACHV_RATE: 100.0, DEFECT_RATE: 0.00, ISSUE_TP: '-',          REMARK: '' },
  { PROD_DT: '2026-06-07', LINE: 'LN-PRT-02', PACK_CD: 'PK-SR-30',    PACK_NM: '오론 세럼 30ml',              PLAN_QTY: 4500, ACT_QTY: 4480, DEFECT_QTY: 60,  NET_OUT: 4420, ACHV_RATE: 99.6,  DEFECT_RATE: 1.34, ISSUE_TP: 'MAT_DEFECT', REMARK: '잉크 색상 미스 60개' },
  { PROD_DT: '2026-06-07', LINE: 'LN-OEM-01', PACK_CD: 'PK-OEM-SUN',  PACK_NM: 'OEM 선크림 SPF50+ - PUMP',    PLAN_QTY: 8500, ACT_QTY: 6800, DEFECT_QTY: 120, NET_OUT: 6680, ACHV_RATE: 80.0,  DEFECT_RATE: 1.76, ISSUE_TP: 'LINE_STOP',  REMARK: 'OEM 라인 2시간 정지 (장비 점검)' },
  { PROD_DT: '2026-06-06', LINE: 'LN-PRT-01', PACK_CD: 'PK-MK-001-T', PACK_NM: '오론 비건마스크 5매 - TUBE',  PLAN_QTY: 7500, ACT_QTY: 7600, DEFECT_QTY: 50,  NET_OUT: 7550, ACHV_RATE: 101.3, DEFECT_RATE: 0.66, ISSUE_TP: '-',          REMARK: '' },
  { PROD_DT: '2026-06-06', LINE: 'LN-PRT-02', PACK_CD: 'PK-SR-30',    PACK_NM: '오론 세럼 30ml',              PLAN_QTY: 4500, ACT_QTY: 4500, DEFECT_QTY: 30,  NET_OUT: 4470, ACHV_RATE: 100.0, DEFECT_RATE: 0.67, ISSUE_TP: '-',          REMARK: '' },
];

const ISSUE_COLOR = {
  '-':          '#9ca3af',
  'MAT_DEFECT': '#f59e0b',
  'LINE_STOP':  '#ef4444',
  'STAFF':      '#3b82f6',
};

const summary = ROWS.reduce(
  (acc, r) => ({
    plan: acc.plan + r.PLAN_QTY,
    act:  acc.act  + r.ACT_QTY,
    defect: acc.defect + r.DEFECT_QTY,
  }),
  { plan: 0, act: 0, defect: 0 }
);
const summaryAchv = ((summary.act / summary.plan) * 100).toFixed(1);
const summaryDefect = ((summary.defect / summary.act) * 100).toFixed(2);

export default function OronPkActualMockup() {
  return (
    <MockShell
      patternCode="oron_pk_actual"
      patternLabel="ORON — PK 생산실적 조회"
      layoutCategory="LAYOUT_SINGLE"
      description="대표 화면 = 생산계획 대비 실적 (UI_PK_ORN_PACK_PLAN_ACT). 일자×라인×포장재 단위 PLAN_QTY vs ACT_QTY + 불량량/순출고량 + 달성률/불량률 + 이슈 원인 (MAT_DEFECT/LINE_STOP/STAFF). 같이 묶인 메뉴 4개 (종합 실적/이슈사항/배송 전송/기간별 발주실적) 도 동일 패턴."
    >
      {/* SearchArea */}
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="기간" size="small" value="2026-06-01 ~ 06-07" sx={{ width: 200 }} />
          <TextField label="LINE" size="small" select value="ALL" sx={{ width: 150 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="LN-PRT-01">LN-PRT-01</MenuItem>
            <MenuItem value="LN-PRT-02">LN-PRT-02</MenuItem>
            <MenuItem value="LN-OEM-01">LN-OEM-01</MenuItem>
          </TextField>
          <TextField label="PACK_CD" size="small" value="" sx={{ width: 180 }}
            InputProps={{ endAdornment: <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} /> }} />
          <TextField label="ISSUE_TP" size="small" select value="ALL" sx={{ width: 160 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="MAT_DEFECT">자재 불량</MenuItem>
            <MenuItem value="LINE_STOP">라인 정지</MenuItem>
            <MenuItem value="STAFF">인력</MenuItem>
          </TextField>
        </Stack>
      </Box>

      {/* Summary chips */}
      <Box sx={{ px: 1.5, py: 0.7, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip label={`PLAN ${summary.plan.toLocaleString()}`} size="small" variant="outlined" sx={{ fontFamily: 'monospace' }} />
        <Chip label={`ACT ${summary.act.toLocaleString()}`}   size="small" variant="outlined" sx={{ fontFamily: 'monospace' }} />
        <Chip label={`DEFECT ${summary.defect.toLocaleString()}`} size="small" variant="outlined" sx={{ fontFamily: 'monospace', color: '#f59e0b' }} icon={<WarningAmberIcon sx={{ fontSize: 14 }} />} />
        <Chip label={`달성률 ${summaryAchv}%`}   size="small" color="success" variant="outlined" sx={{ fontFamily: 'monospace' }} />
        <Chip label={`불량률 ${summaryDefect}%`} size="small" color="warning" variant="outlined" sx={{ fontFamily: 'monospace' }} />
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
                      if (c.name === 'ISSUE_TP') {
                        return (
                          <TableCell key={c.name} sx={{ fontSize: 12, textAlign: 'center', fontWeight: 600, color: ISSUE_COLOR[v] || '#374151' }}>{v}</TableCell>
                        );
                      }
                      if (c.name === 'ACHV_RATE') {
                        return (
                          <TableCell key={c.name} sx={{ fontSize: 12, textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: v >= 95 && v <= 105 ? '#10b981' : v < 95 ? '#ef4444' : '#3b82f6' }}>{v.toFixed(1)}%</TableCell>
                        );
                      }
                      if (c.name === 'DEFECT_RATE') {
                        return (
                          <TableCell key={c.name} sx={{ fontSize: 12, textAlign: 'right', fontFamily: 'monospace', color: v > 1.5 ? '#ef4444' : v > 1.0 ? '#f59e0b' : '#10b981' }}>{v.toFixed(2)}%</TableCell>
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
