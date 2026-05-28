import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography, Paper, Chip, Tabs, Tab,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import MockShell from '../../_shared/MockShell';
import { cellSx } from '../../_shared/styleCallback';

// OronPk06 — 생산실적 + 이슈 + 전송 + 기간별 발주
// UI_PK_ORN_PACK_PLAN_ACT, PROD_ACT_OVRL, PACK_RMK_SRC, PACK_TRANS, ORD_RST

const PLAN_VS_ACT = [
  { LINE_CD: 'L-PRINT-01', ITEM_CD: 'PK10001', PLAN: 25000, ACT: 24850, GAP: -150, RATE: 99.4, ISSUE: '-' },
  { LINE_CD: 'L-PRINT-02', ITEM_CD: 'PK20001', PLAN: 50000, ACT: 47500, GAP: -2500, RATE: 95.0, ISSUE: '잉크 색상 재조정 — 30분 지연' },
  { LINE_CD: 'L-PROC-01',  ITEM_CD: 'PK20001', PLAN: 48000, ACT: 48200, GAP: 200, RATE: 100.4, ISSUE: '-' },
  { LINE_CD: 'L-PROC-02',  ITEM_CD: 'PK30001', PLAN: 12000, ACT: 11200, GAP: -800, RATE: 93.3, ISSUE: '튜브 압출기 고장' },
  { LINE_CD: 'L-CUT-01',   ITEM_CD: 'PK10001', PLAN: 24500, ACT: 24500, GAP: 0,   RATE: 100.0, ISSUE: '-' },
  { LINE_CD: 'L-CUT-02',   ITEM_CD: 'PK40001', PLAN: 4500,  ACT: 4500,  GAP: 0,   RATE: 100.0, ISSUE: '-' },
];

const ISSUES = [
  { DT: '2026-06-04 14:23', LINE_CD: 'L-PROC-02', LEVEL: 'CRITICAL', NM: '튜브 압출기 #2 모터 과열',  ACTION: '점검 후 재가동 — 1시간 지연',     BY: '박철수' },
  { DT: '2026-06-03 09:45', LINE_CD: 'L-PRINT-02', LEVEL: 'WARN',    NM: '잉크 색상 LAB 차이 발견',   ACTION: '재조색 + 색상 검수',              BY: '김기자' },
  { DT: '2026-06-04 11:15', LINE_CD: 'L-CUT-01',   LEVEL: 'INFO',    NM: '분단 칼날 교체',           ACTION: '정기 점검에 따른 교체',          BY: '이수민' },
  { DT: '2026-06-04 16:30', LINE_CD: 'L-PROC-01',  LEVEL: 'WARN',    NM: '컨베이어 벨트 마모',       ACTION: '주말 정비 일정 등록',            BY: '박철수' },
];

const LVL_COLOR = { CRITICAL: 'error', WARN: 'warning', INFO: 'info', PASS: 'success' };

export default function OronPkActualMockup() {
  const [tab, setTab] = React.useState(0);
  return (
    <MockShell
      patternCode="oron_pk_actual"
      patternLabel="ORON — 포장재 생산실적 + 이슈 + 전송"
      layoutCategory="LAYOUT_SINGLE"
      description="생산계획 대비 실적 + 라인별 이슈사항 + 배송/생산 전송 조회 + 기간별 발주/생산실적. UI_PK_ORN_PACK_PLAN_ACT, PROD_ACT_OVRL, PACK_RMK_SRC, PACK_TRANS, ORD_RST."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="공장" size="small" select value="ALL" sx={{ width: 110 }}>
            <MenuItem value="ALL">전체</MenuItem>
          </TextField>
          <TextField label="라인" size="small" select value="ALL" sx={{ width: 130 }}>
            <MenuItem value="ALL">전체</MenuItem>
          </TextField>
          <TextField label="기간" size="small" value="2026-06-03 ~ 06-09" sx={{ width: 200 }} />
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
          <Button variant="outlined" size="small" startIcon={<DownloadIcon />}>Excel</Button>
        </Stack>
      </Box>

      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 1.5 }}>
        <Tabs value={tab} onChange={(_e, v) => setTab(v)}>
          <Tab label="계획 대비 실적" />
          <Tab label="생산실적 종합" />
          <Tab label="이슈사항" />
          <Tab label="배송/생산 전송" />
          <Tab label="기간별 발주실적" />
        </Tabs>
      </Box>

      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5, height: '100%' }}>
        {/* KPI summary */}
        <Stack direction="row" spacing={1.5}>
          {[
            { label: '계획 합계', value: '164,000', detail: '단위: PCS', color: 'primary' },
            { label: '실적 합계', value: '160,750', detail: '+200 / -3,450', color: 'info' },
            { label: '달성률 (가중)', value: '98.0%', detail: '목표 99% 미달', color: 'warning' },
            { label: '이슈 건수', value: '4', detail: 'CRITICAL 1 / WARN 2', color: 'error' },
          ].map((k) => (
            <Paper key={k.label} variant="outlined" sx={{ p: 1.5, flex: 1 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>{k.label}</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: `${k.color}.main`, mt: 0.5 }}>{k.value}</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>{k.detail}</Typography>
            </Paper>
          ))}
        </Stack>

        {/* 계획 대비 실적 */}
        <Paper variant="outlined" sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>생산계획 대비 실적 (6주차)</Typography>
          </Box>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 130, textAlign: 'center' }}>라인</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 100, textAlign: 'center' }}>품목</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 100, textAlign: 'right' }}>계획</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 100, textAlign: 'right' }}>실적</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 90, textAlign: 'right' }}>GAP</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 100, textAlign: 'right' }}>달성률</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700 }}>이슈</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {PLAN_VS_ACT.map((r, i) => {
                  const ok = r.RATE >= 98;
                  return (
                    <TableRow key={i} hover>
                      <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace', fontWeight: 600 }}>{r.LINE_CD}</TableCell>
                      <TableCell sx={cellSx('info', { align: 'center', mono: true })}>{r.ITEM_CD}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.PLAN.toLocaleString()}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>{r.ACT.toLocaleString()}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: r.GAP < 0 ? '#c62828' : r.GAP > 0 ? '#1565c0' : '#374151' }}>
                        {r.GAP > 0 ? `+${r.GAP.toLocaleString()}` : r.GAP.toLocaleString()}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: ok ? '#10b981' : '#e65100' }}>
                        {r.RATE.toFixed(1)}%
                      </TableCell>
                      <TableCell sx={{ color: r.ISSUE === '-' ? '#9ca3af' : '#c62828', fontSize: 12 }}>{r.ISSUE}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* 이슈사항 */}
        <Paper variant="outlined" sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <ReportProblemIcon fontSize="small" color="error" />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>생산 이슈사항 조회</Typography>
              <Chip label="CRITICAL 1" size="small" color="error" />
              <Chip label="WARN 2" size="small" color="warning" variant="outlined" />
              <Chip label="INFO 1" size="small" color="info" variant="outlined" />
            </Stack>
          </Box>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 150, textAlign: 'center' }}>발생일시</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 130, textAlign: 'center' }}>라인</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 100, textAlign: 'center' }}>레벨</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 220 }}>제목</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700 }}>조치 사항</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 90, textAlign: 'center' }}>담당</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ISSUES.map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 11 }}>{r.DT}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace' }}>{r.LINE_CD}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}><Chip label={r.LEVEL} size="small" color={LVL_COLOR[r.LEVEL] || 'default'} /></TableCell>
                    <TableCell sx={{ fontSize: 13, fontWeight: 600 }}>{r.NM}</TableCell>
                    <TableCell sx={{ fontSize: 12, color: '#6b7280' }}>{r.ACTION}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontSize: 12 }}>{r.BY}</TableCell>
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
