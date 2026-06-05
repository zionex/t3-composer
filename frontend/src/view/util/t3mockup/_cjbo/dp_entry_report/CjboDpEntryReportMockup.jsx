import React, { useState } from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography, Paper, Tabs, Tab, Chip, Switch, FormControlLabel,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import RefreshIcon from '@mui/icons-material/Refresh';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonIcon from '@mui/icons-material/Person';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import MockShell from '../../_shared/MockShell';

// CJBO — OP/TP 계획 조회 (DpEntryReport / DpEntryScmReport / DpEntryTPReport / DpEntryScmTPReport)
// 소스 기반 재작성. 4-variant matrix (소스 SET 3 분석).
//
// path: view/demandplan/service/{dpentryreport,dpentryscmreport,dpentrytpreport,dpentryscmtpreport}/*.jsx
// 모두 동일 shell: ContentInner → SearchArea→SearchRow → ButtonArea → ResultArea→Box→BaseGrid → PopPersonalize (+ PopSelectUser for OP)
// 동적 크로스탭 컬럼: makeCrossTabFieldsAndColumns
//
// 4-variant 차이 (소스 그대로):
//   ┌─────────┬───────────────┬──────────┬──────────────┬───────────────┬───────────────┬──────────┐
//   │ variant │ UserInputField│ auth     │ EMP_NO/NM    │ Approve btn   │ salesmanFlag  │ P_ATTR1  │
//   ├─────────┼───────────────┼──────────┼──────────────┼───────────────┼───────────────┼──────────┤
//   │ DpEntryReport      │ yes │ authTp  │ yes (있음)   │ yes           │ wrap          │ 'O' (OP) │
//   │ DpEntryScmReport   │ no  │ authCd  │ yes (있음)   │ no            │ -             │ 'O' (OP) │
//   │ DpEntryTPReport    │ yes │ authTp  │ NO (없음)    │ yes           │ no wrap       │ 'T' (TP) │
//   │ DpEntryScmTPReport │ no  │ authCd  │ NO (없음)    │ no            │ -             │ 'T' (TP) │
//   └─────────┴───────────────┴──────────┴──────────────┴───────────────┴───────────────┴──────────┘

const PERIODS = ['2026-06','2026-07','2026-08'];

const ROWS = [
  { BIG_AREA_NM: 'Animal Nutrition', SALES_AREA_NM: '베트남',     TRADE_TYPE_NM: '수출', LOCATION_CD: 'VN-HCM', CUST_NM: 'Jakarta Corp.',     SALES_GRP_CD: 'AN',  BIG_GRP_NM: 'Lysine',     MID_GRP_NM: '78% 액상',   SML_GRP_NM: 'L-Lysine 78%',           ITEM_NM: 'L-LYS-78L · 1MT',     EMP_NO: 'EMP-001', EMP_NM: '담당자 A', P1:1480, P2:1620, P3:1700 },
  { BIG_AREA_NM: 'Animal Nutrition', SALES_AREA_NM: '인도네시아', TRADE_TYPE_NM: '수출', LOCATION_CD: 'ID-JKT', CUST_NM: 'Sao Paulo Corp.',   SALES_GRP_CD: 'AN',  BIG_GRP_NM: 'Tryptophan', MID_GRP_NM: '98% 분말',   SML_GRP_NM: 'L-Tryptophan 98%',       ITEM_NM: 'L-TRP-98 · 1MT',      EMP_NO: 'EMP-001', EMP_NM: '담당자 A', P1: 900, P2: 870, P3: 920 },
  { BIG_AREA_NM: 'Animal Nutrition', SALES_AREA_NM: '미국',       TRADE_TYPE_NM: '수출', LOCATION_CD: 'US-LAX', CUST_NM: 'New York Corp.',    SALES_GRP_CD: 'AN',  BIG_GRP_NM: 'Methionine', MID_GRP_NM: '99% 분말',   SML_GRP_NM: 'L-Methionine 99%',       ITEM_NM: 'L-MET-99 · 1MT',      EMP_NO: 'EMP-002', EMP_NM: '담당자 B', P1:1800, P2:1750, P3:1820 },
  { BIG_AREA_NM: 'BMS',              SALES_AREA_NM: '브라질',     TRADE_TYPE_NM: '수출', LOCATION_CD: 'BR-SSA', CUST_NM: 'Vancouver Corp.',   SALES_GRP_CD: 'BMS', BIG_GRP_NM: 'Threonine',  MID_GRP_NM: '98.5% 분말', SML_GRP_NM: 'L-Threonine 98.5%',      ITEM_NM: 'L-THR-985 · 1MT',     EMP_NO: 'EMP-002', EMP_NM: '담당자 B', P1: 520, P2: 540, P3: 530 },
  { BIG_AREA_NM: 'Animal Nutrition', SALES_AREA_NM: '중국',       TRADE_TYPE_NM: '수출', LOCATION_CD: 'CN-SH',  CUST_NM: 'Mexico City Corp.', SALES_GRP_CD: 'AN',  BIG_GRP_NM: 'Valine',     MID_GRP_NM: '96.5% 분말', SML_GRP_NM: 'L-Valine 96.5%',         ITEM_NM: 'L-VAL-96 · 1MT',      EMP_NO: 'EMP-003', EMP_NM: '담당자 C', P1: 310, P2: 340, P3: 360 },
  { BIG_AREA_NM: 'Animal Nutrition', SALES_AREA_NM: '필리핀',     TRADE_TYPE_NM: '수출', LOCATION_CD: 'PH-MNL', CUST_NM: 'Roma Corp.',        SALES_GRP_CD: 'AN',  BIG_GRP_NM: 'Lysine',     MID_GRP_NM: '78% 액상',   SML_GRP_NM: 'L-Lysine 78%',           ITEM_NM: 'L-LYS-78L · 1MT',     EMP_NO: 'EMP-001', EMP_NM: '담당자 A', P1: 690, P2: 740, P3: 770 },
];

const VARIANTS = [
  { idx: 0, name: 'DpEntryReport',      role: 'OP 담당',   hasUser: true,  authField: 'authTp', hasEmp: true,  hasApprove: true,  approveWrap: true,  p_attr1: 'O' },
  { idx: 1, name: 'DpEntryScmReport',   role: 'OP 관리자', hasUser: false, authField: 'authCd', hasEmp: true,  hasApprove: false, approveWrap: false, p_attr1: 'O' },
  { idx: 2, name: 'DpEntryTPReport',    role: 'TP 담당',   hasUser: true,  authField: 'authTp', hasEmp: false, hasApprove: true,  approveWrap: false, p_attr1: 'T' },
  { idx: 3, name: 'DpEntryScmTPReport', role: 'TP 관리자', hasUser: false, authField: 'authCd', hasEmp: false, hasApprove: false, approveWrap: false, p_attr1: 'T' },
];

export default function CjboDpEntryReportMockup() {
  const [tab, setTab] = useState(0);
  const v = VARIANTS[tab];

  return (
    <MockShell patternCode="cjbo_dp_entry_report"
      patternLabel="CJBO — OP/TP 계획 조회 4종 (DpEntryReport*)"
      layoutCategory="LAYOUT_SINGLE"
      description="4 variants (OP/TP × 담당/관리자). 모두 동일 shell + 동적 크로스탭. 차이: UserInputField · authTp/authCd · EMP_NO/NM 컬럼 · APPROVE 버튼 (소스 SET 3). POST demandplan/dpentry{,scm,tp,scmtp}report/q2 → /q1.">

      {/* Tabs — variant selector */}
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}>
        <Tabs value={tab} onChange={(_, val) => setTab(val)} variant="scrollable" sx={{ minHeight: 38 }}>
          {VARIANTS.map((x) => (
            <Tab key={x.idx} label={`${x.name} (${x.role})`} sx={{ minHeight: 38 }} />
          ))}
        </Tabs>
      </Box>

      {/* SearchArea */}
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <Chip size="small" label={`PLAN_TP (hidden, '${v.p_attr1}')`} variant="outlined" sx={{ height: 18, fontSize: 10, fontFamily: 'monospace' }} />
          {v.hasUser && (
            <TextField label="UserInputField" size="small" value="admin / 김민수" sx={{ width: 180 }}
              InputProps={{ startAdornment: <PersonIcon fontSize="small" sx={{ mr: 0.5, color: 'action.active' }} /> }} />
          )}
          <TextField label="VERSION_ID" size="small" select value="V2026-06" sx={{ width: 130 }}>
            <MenuItem value="V2026-06">V2026-06</MenuItem>
          </TextField>
          <TextField label={v.authField === 'authTp' ? 'AUTH_TP_NM' : 'authCd (DP_AUTH)'} size="small" select value="ALL" sx={{ width: 150 }}>
            <MenuItem value="ALL">전체</MenuItem>
          </TextField>
          <TextField label="SALES_GRP_CD (multi)" size="small" select value="ALL" sx={{ width: 150 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="AN">AN</MenuItem><MenuItem value="TN">TN</MenuItem><MenuItem value="BMS">BMS</MenuItem>
          </TextField>
          <TextField label="ItemSearchInput forEntry" size="small" value="전체" sx={{ width: 180 }}
            InputProps={{ endAdornment: <Box sx={{ width: 24, textAlign: 'center', color: 'text.secondary' }}>🔍</Box> }} />
          <TextField label="AccountSearchInput defaultLv=S2" size="small" value="전체" sx={{ width: 180 }}
            InputProps={{ endAdornment: <Box sx={{ width: 24, textAlign: 'center', color: 'text.secondary' }}>🔍</Box> }} />
          <TextField label="DAY_TYPE_CD" size="small" select value="M" sx={{ width: 100 }}>
            <MenuItem value="M">월</MenuItem><MenuItem value="W">주</MenuItem>
          </TextField>
          <TextField label="QTY_AMT_TYPE" size="small" select value="ALL" sx={{ width: 110 }}>
            <MenuItem value="ALL">ALL</MenuItem><MenuItem value="QTY">QTY</MenuItem><MenuItem value="AMT">AMT</MenuItem>
          </TextField>
          <TextField label="AMT_UNIT" size="small" select value="USD" sx={{ width: 100 }}>
            <MenuItem value="USD">USD</MenuItem><MenuItem value="KRW">KRW</MenuItem>
          </TextField>
          <TextField label="SOLID_GBN_CD" size="small" select value="ALL" sx={{ width: 110 }}>
            <MenuItem value="ALL">전체</MenuItem><MenuItem value="L">L 액상</MenuItem><MenuItem value="S">S 분말</MenuItem>
          </TextField>
          <TextField label="DP_SUM_YN" size="small" select value="Y" sx={{ width: 90 }}>
            <MenuItem value="Y">Y</MenuItem><MenuItem value="N">N</MenuItem>
          </TextField>
          <TextField label="FROM_DATE" size="small" type="month" value="2026-06" sx={{ width: 130 }} InputLabelProps={{ shrink: true }} />
          <TextField label="TO_DATE" size="small" type="month" value="2026-08" sx={{ width: 130 }} InputLabelProps={{ shrink: true }} />
          <FormControlLabel control={<Switch size="small" />} label={<Typography variant="caption">IM_SWITCH_NUM_FORMAT</Typography>} sx={{ ml: 0 }} />
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
          <Button variant="outlined" size="small" startIcon={<RefreshIcon />}>새로고침</Button>
        </Stack>
      </Box>

      {/* ButtonArea */}
      <Box sx={{ px: 1.5, py: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Button size="small" startIcon={<FileDownloadIcon />} variant="outlined">엑셀 다운로드 (headerDepth=3)</Button>
        <Box sx={{ flexGrow: 1 }} />
        <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>SELECT_QTY_SUM: <b>0</b></Typography>
        <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>USD · 천</Typography>
        <Chip size="small" label="STATUS: OPEN" color="info" sx={{ height: 20, fontSize: 10, fontFamily: 'monospace' }} />
        {v.hasApprove && (
          <>
            <Chip size="small" label={v.approveWrap ? 'salesmanFlag wrap' : '항상 표시'} variant="outlined" sx={{ height: 18, fontSize: 9 }} />
            <Button size="small" startIcon={<CheckIcon />} variant="contained" color="success">APPROVE</Button>
            <Button size="small" startIcon={<CloseIcon />} variant="outlined" color="warning">CANCELAPPROVE</Button>
          </>
        )}
        <Button size="small" startIcon={<SettingsIcon />} variant="outlined">개인화</Button>
      </Box>

      {/* ResultArea */}
      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
        <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>BaseGrid id=&quot;grid1{v.name}&quot;</Typography>
            {v.hasEmp ? <Chip size="small" label="EMP_NO + EMP_NM 컬럼 표시" color="info" variant="outlined" sx={{ height: 18, fontSize: 10 }} />
              : <Chip size="small" label="EMP 컬럼 숨김 (TP 변형)" variant="outlined" sx={{ height: 18, fontSize: 10 }} />}
          </Box>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader sx={{ '& th, & td': { whiteSpace: 'nowrap', fontSize: 11, py: 0.5 } }}>
              <TableHead>
                <TableRow>
                  {['대지역','판매지역','거래유형','거점','거래처','사업담당','대분류','중분류','소분류','품목명',
                    ...(v.hasEmp ? ['EMP_NO','EMP_NM'] : []),
                  ].map((c) => (
                    <TableCell key={c} rowSpan={2} sx={{ backgroundColor: 'grey.100', fontWeight: 700 }}>{c}</TableCell>
                  ))}
                  {PERIODS.map((p) => (
                    <TableCell key={p} sx={{ backgroundColor: '#e3f2fd', textAlign: 'center', fontWeight: 700, fontSize: 11 }}>{p}</TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  {PERIODS.map((p) => (
                    <TableCell key={p+'q'} sx={{ backgroundColor: '#e3f2fd', textAlign: 'right', fontSize: 10, fontWeight: 600 }}>QTY</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {ROWS.map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell>{r.BIG_AREA_NM}</TableCell>
                    <TableCell>{r.SALES_AREA_NM}</TableCell>
                    <TableCell>{r.TRADE_TYPE_NM}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{r.LOCATION_CD}</TableCell>
                    <TableCell>{r.CUST_NM}</TableCell>
                    <TableCell><Chip size="small" label={r.SALES_GRP_CD} variant="outlined" sx={{ height: 16, fontSize: 9 }} /></TableCell>
                    <TableCell>{r.BIG_GRP_NM}</TableCell>
                    <TableCell>{r.MID_GRP_NM}</TableCell>
                    <TableCell>{r.SML_GRP_NM}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{r.ITEM_NM}</TableCell>
                    {v.hasEmp && <TableCell sx={{ fontFamily: 'monospace' }}>{r.EMP_NO}</TableCell>}
                    {v.hasEmp && <TableCell>{r.EMP_NM}</TableCell>}
                    {['P1','P2','P3'].map((pk) => (
                      <TableCell key={pk} sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r[pk].toLocaleString()}</TableCell>
                    ))}
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
