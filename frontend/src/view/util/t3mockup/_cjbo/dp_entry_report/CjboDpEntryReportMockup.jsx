import React, { useState } from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography, Paper, Tabs, Tab, Chip,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CheckIcon from '@mui/icons-material/Check';
import MockShell from '../../_shared/MockShell';
import { cellSx, percentStatus } from '../../_shared/styleCallback';

// CJBO — OP/TP 계획 조회 (DpEntryReport / DpEntryScmReport / DpEntryTPReport / DpEntryScmTPReport)
// 차이점:
//   - OP vs TP — TP 화면은 EMP_NO/EMP_NM 컬럼 없음
//   - 담당 vs 관리자(SCM) — 관리자는 read-only (저장/승인 버튼 없음, AccountSearchInput defaultLv='S2')
//                          담당자는 'engine/dp/Approve' / 'engine/dp/ApproveTp' 승인 호출

const MONTHS = ['06월','07월','08월','09월','10월','11월','12월'];

// OP 행 (EMP 포함)
const ROWS_OP = [
  { BIG_AREA: '국내', CUST: '롯데마트',     ITEM: 'illuvia 비건마스크 5매',   EMP: '김민수',  TY: 35200, m: [4800, 5100, 5300, 5000, 4900, 5050, 5050], achieve: 102.5 },
  { BIG_AREA: '국내', CUST: '쿠팡',         ITEM: 'illuvia 비건마스크 5매',   EMP: '이정훈',  TY: 28800, m: [3800, 4200, 4300, 4100, 4100, 4150, 4150], achieve:  98.7 },
  { BIG_AREA: '국내', CUST: '올리브영',     ITEM: 'illuvia 토너 200ml',        EMP: '박서연',  TY: 18500, m: [2500, 2700, 2800, 2700, 2600, 2600, 2600], achieve: 105.4 },
  { BIG_AREA: '해외', CUST: '베트남 KGS',   ITEM: 'CJ Brand Korea KING-RED',  EMP: '박글로벌',TY: 42000, m: [5800, 6100, 6300, 6000, 5900, 5950, 5950], achieve:  88.3 },
  { BIG_AREA: '해외', CUST: '인니 INDOMA',  ITEM: 'illuvia MASK',              EMP: '박글로벌',TY: 35800, m: [4900, 5200, 5400, 5100, 5000, 5100, 5100], achieve:  94.2 },
  { BIG_AREA: '해외', CUST: '말레이 SCH',   ITEM: 'NGP Device #01',            EMP: '정재현',  TY: 12500, m: [1700, 1900, 1900, 1800, 1700, 1750, 1750], achieve:  72.1 },
  { BIG_AREA: '국내', CUST: 'GS25',         ITEM: 'illuvia 크림 50g',          EMP: '송하늘',  TY: 15200, m: [2000, 2200, 2300, 2200, 2100, 2200, 2200], achieve: 110.3 },
  { TOTAL: true, BIG_AREA: '합계', ITEM: '7개 거래처', EMP: '-',                  TY:188000, m: [25500, 27400, 28300, 26900, 26300, 26800, 26800], achieve:  95.8 },
];

// TP 행 (EMP 컬럼 없음, 더 긴 호라이즌)
const ROWS_TP = [
  { BIG_AREA: '국내', CUST: '롯데마트',     ITEM: 'illuvia 비건마스크 5매',   TY: 38500, m: [5200, 5400, 5500, 5400, 5300, 5350, 5350], achieve: 100.8 },
  { BIG_AREA: '국내', CUST: '쿠팡',         ITEM: 'illuvia 비건마스크 5매',   TY: 31200, m: [4100, 4400, 4500, 4400, 4400, 4450, 4450], achieve:  97.4 },
  { BIG_AREA: '국내', CUST: '올리브영',     ITEM: 'illuvia 토너 200ml',        TY: 19800, m: [2700, 2850, 2900, 2850, 2750, 2750, 2750], achieve: 103.2 },
  { BIG_AREA: '해외', CUST: '베트남 KGS',   ITEM: 'CJ Brand Korea KING-RED',  TY: 48500, m: [6500, 6900, 7100, 6800, 6700, 6750, 6750], achieve:  92.4 },
  { BIG_AREA: '해외', CUST: '인니 INDOMA',  ITEM: 'illuvia MASK',              TY: 39200, m: [5300, 5650, 5800, 5600, 5500, 5650, 5700], achieve:  96.8 },
  { BIG_AREA: '해외', CUST: '말레이 SCH',   ITEM: 'NGP Device #01',            TY: 18500, m: [2500, 2700, 2700, 2650, 2600, 2650, 2700], achieve:  85.2 },
  { BIG_AREA: '국내', CUST: 'GS25',         ITEM: 'illuvia 크림 50g',          TY: 17500, m: [2300, 2500, 2550, 2500, 2400, 2500, 2500], achieve: 108.5 },
  { TOTAL: true, BIG_AREA: '합계', ITEM: '7개 거래처',                          TY:213200, m: [28600, 30400, 31050, 30200, 29650, 30100, 30200], achieve:  97.8 },
];

function ReportGrid({ tab }) {
  const isTP = tab >= 2;
  const isAdmin = tab === 1 || tab === 3;
  const rows = isTP ? ROWS_TP : ROWS_OP;
  const showEmp = !isTP;  // TP는 EMP 컬럼 없음
  const colCnt = (showEmp ? 5 : 4) + MONTHS.length + 1; // 기본 + 월 + 달성률
  return (
    <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 280 }}>
      <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          {isTP ? 'TP' : 'OP'} 계획 조회 · {isAdmin ? 'SCM 관리자 (전체 + Read-only)' : '담당 본인 (편집 + 승인 가능)'}
        </Typography>
        <Chip size="small" label="단위: 수량" color="info" variant="outlined" />
        <Box sx={{ flexGrow: 1 }} />
        <Chip size="small" label={`평균 달성률 ${rows[rows.length - 1].achieve.toFixed(1)}%`} color="warning" />
      </Box>
      <TableContainer sx={{ flex: 1 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell rowSpan={2} sx={{ backgroundColor: 'grey.100', fontWeight: 700 }}>대분류</TableCell>
              <TableCell rowSpan={2} sx={{ backgroundColor: 'grey.100', fontWeight: 700 }}>거래처</TableCell>
              <TableCell rowSpan={2} sx={{ backgroundColor: 'grey.100', fontWeight: 700 }}>품목</TableCell>
              {showEmp && <TableCell rowSpan={2} sx={{ backgroundColor: 'grey.100', fontWeight: 700 }}>영업담당</TableCell>}
              <TableCell rowSpan={2} sx={{ backgroundColor: 'grey.100', fontWeight: 700, textAlign: 'right' }}>연 계획</TableCell>
              <TableCell colSpan={MONTHS.length} sx={{ backgroundColor: '#e3f2fd', fontWeight: 700, textAlign: 'center' }}>월별 (2026)</TableCell>
              <TableCell rowSpan={2} sx={{ backgroundColor: 'grey.100', fontWeight: 700, textAlign: 'center' }}>달성률</TableCell>
            </TableRow>
            <TableRow>
              {MONTHS.map((m) => (
                <TableCell key={m} sx={{ backgroundColor: '#e3f2fd', fontWeight: 700, textAlign: 'right', fontSize: 11 }}>{m}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r, i) => {
              const ach = percentStatus(r.achieve);
              return (
                <TableRow key={i} hover sx={{ backgroundColor: r.TOTAL ? '#e1bee7' : undefined }}>
                  <TableCell sx={{ fontWeight: r.TOTAL ? 700 : undefined }}>{r.BIG_AREA}</TableCell>
                  <TableCell>{r.CUST || '-'}</TableCell>
                  <TableCell>{r.ITEM}</TableCell>
                  {showEmp && <TableCell>{r.EMP}</TableCell>}
                  <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{r.TY.toLocaleString()}</TableCell>
                  {r.m.map((v, j) => (
                    <TableCell key={j} sx={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 12,
                      backgroundColor: !isAdmin && !r.TOTAL ? '#fffde7' : undefined }}>{v.toLocaleString()}</TableCell>
                  ))}
                  <TableCell sx={cellSx(ach, { align: 'center', mono: true })}>{r.achieve.toFixed(1)}%</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

export default function CjboDpEntryReportMockup() {
  const [tab, setTab] = useState(0);
  // 0=OP 담당 · 1=OP 관리자 · 2=TP 담당 · 3=TP 관리자
  const isTP = tab >= 2;
  const isAdmin = tab === 1 || tab === 3;
  const approveUrl = isTP ? 'engine/dp/ApproveTp' : 'engine/dp/Approve';

  return (
    <MockShell patternCode="cjbo_dp_entry_report" patternLabel="CJBO — OP/TP 계획 조회 통합 (DpEntryReport*)"
      layoutCategory="LAYOUT_SINGLE"
      description="OP/TP × 담당/관리자 4종 — TP 화면은 영업담당 컬럼 없음 / 관리자는 read-only. UI_DP_ENTRY_REPORT/SCM_REPORT/TP_REPORT/SCM_TP_REPORT.">
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="계획구분" size="small" value={isTP ? 'TP' : 'OP'} sx={{ width: 130 }} />
          <TextField label="조회 권한" size="small" value={isAdmin ? 'SCM 관리자' : '담당 본인'} sx={{ width: 150 }} />
          <TextField label="버전" size="small" value="V2026-06" sx={{ width: 130 }} />
          <TextField label="기간" size="small" value={isTP ? '2026-06 ~ 2027-05' : '2026-06 ~ 2026-12'} sx={{ width: 200 }} />
          <TextField label="대분류" size="small" select value="ALL" sx={{ width: 130 }}>
            <MenuItem value="ALL">전체</MenuItem><MenuItem value="국내">국내</MenuItem><MenuItem value="해외">해외</MenuItem>
          </TextField>
          <TextField label="단위" size="small" select value="QTY" sx={{ width: 120 }}>
            <MenuItem value="QTY">수량</MenuItem><MenuItem value="AMT">금액</MenuItem>
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
          <Button variant="outlined" size="small" startIcon={<FileDownloadIcon />}>엑셀</Button>
          {!isAdmin && (
            <Button variant="contained" size="small" color="success" startIcon={<CheckIcon />}>
              승인 요청
            </Button>
          )}
        </Stack>
      </Box>

      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" sx={{ minHeight: 38 }}>
          <Tab label="OP 계획 조회 (담당) — DpEntryReport" sx={{ minHeight: 38 }} />
          <Tab label="OP 계획 조회 (관리자) — DpEntryScmReport" sx={{ minHeight: 38 }} />
          <Tab label="TP 계획 조회 (담당) — DpEntryTPReport" sx={{ minHeight: 38 }} />
          <Tab label="TP 계획 조회 (관리자) — DpEntryScmTPReport" sx={{ minHeight: 38 }} />
        </Tabs>
      </Box>

      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1, flexGrow: 1, overflow: 'auto' }}>
        <Paper variant="outlined" sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Chip size="small" label={isTP ? 'TP (Target / 12개월)' : 'OP (Operation / 6개월)'} color={isTP ? 'primary' : 'info'} sx={{ fontWeight: 700 }} />
          <Chip size="small" label={isAdmin ? '관리자 (전체 조회 · 편집 X)' : '담당자 (본인 데이터 · 편집 O)'}
            color={isAdmin ? 'warning' : 'success'} variant="outlined" />
          {!isTP && <Chip size="small" label="EMP_NO / EMP_NM 컬럼 표시" variant="outlined" />}
          {isTP && <Chip size="small" label="EMP 컬럼 숨김 (TP 전용)" variant="outlined" />}
          <Box sx={{ flexGrow: 1 }} />
          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
            승인 API: {approveUrl}
          </Typography>
        </Paper>

        <ReportGrid tab={tab} />
      </Box>
    </MockShell>
  );
}
