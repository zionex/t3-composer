import React, { useState } from 'react';
import { Box, Stack, TextField, MenuItem, Button, Chip, Tabs, Tab, Typography, Paper,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MockShell from '../../_shared/MockShell';
import { cellSx, percentStatus, deltaStatus } from '../../_shared/styleCallback';

// DpKtng15 (수출 수요 적정성 점검), DpKtng17 (내수 수요 적정성 점검)
// 적정성 룰별 점검 결과 + 위반 항목 그리드

const RULES = [
  { rule: '전년 동월 대비 ±30% 초과', pass: 142, fail: 8,  pct: 94.7 },
  { rule: '전월 대비 ±50% 초과',      pass: 138, fail: 12, pct: 92.0 },
  { rule: '안전재고 미달 예상',        pass: 135, fail: 15, pct: 90.0 },
  { rule: 'PSI 음수 발생',             pass: 148, fail: 2,  pct: 98.7 },
  { rule: 'EOP 후 입력값 존재',        pass: 150, fail: 0,  pct: 100  },
];

const VIOLATIONS = [
  { ITEM_CD: 'TL-RD-001', ACCOUNT: 'CU',      PERIOD: '2026-06', PLAN: 12500000, REF: 18500000, DIFF: -32.4, RULE: '전년 ±30%',   SEVERITY: 'high' },
  { ITEM_CD: 'TL-BL-005', ACCOUNT: 'GS25',    PERIOD: '2026-06', PLAN:  8800000, REF: 14000000, DIFF: -37.1, RULE: '전년 ±30%',   SEVERITY: 'high' },
  { ITEM_CD: 'NGP-DEV',   ACCOUNT: 'SEVEN',   PERIOD: '2026-07', PLAN:  9500000, REF:  5800000, DIFF: +63.8, RULE: '전월 ±50%',   SEVERITY: 'high' },
  { ITEM_CD: 'TL-RD-002', ACCOUNT: 'EMART',   PERIOD: '2026-08', PLAN:  4200000, REF:  3500000, DIFF: -8.5,  RULE: '안전재고',     SEVERITY: 'mid' },
  { ITEM_CD: 'TL-EX-512', ACCOUNT: '인도네시아', PERIOD: '2026-09', PLAN: 18000000, REF: 22000000, DIFF: -18.2, RULE: '안전재고',     SEVERITY: 'mid' },
  { ITEM_CD: 'TL-MN-901', ACCOUNT: '몽골',     PERIOD: '2026-07', PLAN:        0, REF:  2500000, DIFF: -100, RULE: 'PSI 음수',     SEVERITY: 'low' },
];

const SEV_COLOR = { high: 'error', mid: 'warning', low: 'info' };
const SEV_TONE  = { high: 'danger', mid: 'warning', low: 'info' };

const VAL_TAB_LABELS = ['수출 (DpKtng15)', '내수 (DpKtng17)'];

export default function DpDemandValidationMockup() {
  const [tab, setTab] = useState(0);
  return (
    <MockShell patternCode="ktng_dp_demand_validation" patternLabel="KTNG — 수요 적정성 점검 (DpKtng15/17)"
      layoutCategory="LAYOUT_SINGLE" description="수출/내수 수요 계획의 적정성 룰별 통과/실패 + 위반 품목 상세 리스트.">
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <TextField label="버전" size="small" select value="V2026-05" sx={{ width: 140 }}>
            <MenuItem value="V2026-05">V2026-05</MenuItem><MenuItem value="V2026-04">V2026-04</MenuItem>
          </TextField>
          <TextField label="SALES_ORG" size="small" select value="KT&G" sx={{ width: 140 }}>
            <MenuItem value="KT&G">국내</MenuItem><MenuItem value="GLOBAL">GLOBAL</MenuItem>
          </TextField>
          <TextField label="기간" size="small" value="2026-06 ~ 2026-12" sx={{ width: 180 }} />
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>점검 실행</Button>
        </Stack>
      </Box>

      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          {VAL_TAB_LABELS.map((l) => <Tab key={l} label={l} />)}
        </Tabs>
      </Box>

      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5, flexGrow: 1, overflow: 'auto' }}>
        {/* Summary */}
        <Stack direction="row" spacing={1.5}>
          <Paper variant="outlined" sx={{ p: 1.5, flex: 1, textAlign: 'center', backgroundColor: 'success.50' }}>
            <CheckCircleIcon color="success" sx={{ fontSize: 36 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main' }}>713</Typography>
            <Typography variant="caption">통과 (95.1%)</Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 1.5, flex: 1, textAlign: 'center', backgroundColor: 'error.50' }}>
            <WarningAmberIcon color="error" sx={{ fontSize: 36 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'error.main' }}>37</Typography>
            <Typography variant="caption">실패 (4.9%)</Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 1.5, flex: 2 }}>
            <Typography variant="caption" color="text.secondary">룰별 통과율</Typography>
            {RULES.map((r) => {
              const pctTone = percentStatus(r.pct);
              return (
                <Stack key={r.rule} direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                  <Typography variant="caption" sx={{ minWidth: 180 }}>{r.rule}</Typography>
                  <Box sx={{ flex: 1, height: 8, backgroundColor: 'grey.200', borderRadius: 1, overflow: 'hidden' }}>
                    <Box sx={{ width: `${r.pct}%`, height: '100%', backgroundColor: r.pct >= 95 ? '#10b981' : r.pct >= 90 ? '#f59e0b' : '#ef4444' }} />
                  </Box>
                  <Box component="span" sx={{ ...cellSx(pctTone, { mono: true, align: 'right' }), display: 'inline-block', minWidth: 50, px: 0.5, borderRadius: 0.5, fontSize: 12 }}>{r.pct}%</Box>
                </Stack>
              );
            })}
          </Paper>
        </Stack>

        {/* Violations */}
        <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 220 }}>
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>위반 항목 상세 ({VIOLATIONS.length}건) — {VAL_TAB_LABELS[tab]}</Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Stack direction="row" spacing={0.5}>
              <Chip size="small" label={`HIGH ${VIOLATIONS.filter(v=>v.SEVERITY==='high').length}`} color="error" />
              <Chip size="small" label={`MID ${VIOLATIONS.filter(v=>v.SEVERITY==='mid').length}`} color="warning" />
              <Chip size="small" label={`LOW ${VIOLATIONS.filter(v=>v.SEVERITY==='low').length}`} color="info" />
            </Stack>
          </Box>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {['ITEM_CD','ACCOUNT','PERIOD','PLAN 수량','참조값','차이 (%)','위반 룰','심각도'].map((c) => (
                    <TableCell key={c} sx={{ backgroundColor: 'grey.100', fontWeight: 700, textAlign: c.includes('수량') || c.includes('참조') || c.includes('차이') ? 'right' : (c === '심각도' ? 'center' : 'left') }}>{c}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {VIOLATIONS.map((v, i) => {
                  const tone = SEV_TONE[v.SEVERITY];
                  const diffTone = deltaStatus(v.DIFF);
                  return (
                    <TableRow key={i} hover>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{v.ITEM_CD}</TableCell>
                      <TableCell>{v.ACCOUNT}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{v.PERIOD}</TableCell>
                      <TableCell sx={cellSx(tone, { mono: true, align: 'right' })}>{v.PLAN.toLocaleString()}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', color: 'text.secondary' }}>{v.REF.toLocaleString()}</TableCell>
                      <TableCell sx={cellSx(diffTone, { mono: true, align: 'right' })}>
                        {v.DIFF > 0 ? '+' : ''}{v.DIFF.toFixed(1)}%
                      </TableCell>
                      <TableCell sx={{ fontSize: 12 }}><Chip size="small" label={v.RULE} variant="outlined" /></TableCell>
                      <TableCell sx={{ textAlign: 'center' }}><Chip size="small" label={v.SEVERITY.toUpperCase()} color={SEV_COLOR[v.SEVERITY]} /></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </MockShell>
  );
}
