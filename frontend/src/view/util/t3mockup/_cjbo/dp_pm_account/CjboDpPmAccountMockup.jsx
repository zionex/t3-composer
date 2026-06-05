import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography, Paper, Chip,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import MockShell from '../../_shared/MockShell';

// CJBO — 품목-거래처 관계 (PM)
// UI_DP_PM_ACCOUNT (DpPmAccount)

const MASTER = [
  { ITEM_CD: 'F01001', ITEM_NM: 'illuvia 비건마스크 5매',    MAIN_CUST_CNT: 12, USE_YN: 'Y', sel: true },
  { ITEM_CD: 'F01002', ITEM_NM: 'illuvia 토너 200ml',         MAIN_CUST_CNT:  8, USE_YN: 'Y' },
  { ITEM_CD: 'F01003', ITEM_NM: 'illuvia 크림 50g',           MAIN_CUST_CNT: 10, USE_YN: 'Y' },
  { ITEM_CD: 'F02001', ITEM_NM: 'CJ Brand Korea KING-RED',   MAIN_CUST_CNT: 25, USE_YN: 'Y' },
  { ITEM_CD: 'F02002', ITEM_NM: 'CJ Brand Korea SLIM',       MAIN_CUST_CNT: 18, USE_YN: 'Y' },
  { ITEM_CD: 'F03001', ITEM_NM: 'NGP Device #01',             MAIN_CUST_CNT:  5, USE_YN: 'N' },
];

const DETAIL = [
  { CUST_CD: 'C001', CUST_NM: '롯데마트',     CHANNEL: 'OFFLINE', RATIO: 28.0, START_DT: '2026-01-01', END_DT: '9999-12-31' },
  { CUST_CD: 'C002', CUST_NM: '쿠팡',         CHANNEL: 'ONLINE',  RATIO: 22.5, START_DT: '2026-01-01', END_DT: '9999-12-31' },
  { CUST_CD: 'C003', CUST_NM: '올리브영',     CHANNEL: 'OFFLINE', RATIO: 18.0, START_DT: '2026-01-01', END_DT: '9999-12-31' },
  { CUST_CD: 'C004', CUST_NM: 'GS25',         CHANNEL: 'OFFLINE', RATIO: 12.0, START_DT: '2026-01-01', END_DT: '9999-12-31' },
  { CUST_CD: 'C005', CUST_NM: '네이버스토어', CHANNEL: 'ONLINE',  RATIO: 10.5, START_DT: '2026-01-01', END_DT: '9999-12-31' },
  { CUST_CD: 'C006', CUST_NM: '11번가',       CHANNEL: 'ONLINE',  RATIO:  9.0, START_DT: '2026-01-01', END_DT: '9999-12-31' },
];

export default function CjboDpPmAccountMockup() {
  return (
    <MockShell patternCode="cjbo_dp_pm_account" patternLabel="CJBO — 품목-거래처 관계 (PM) (DpPmAccount)"
      layoutCategory="LAYOUT_V2"
      description="상단 품목 마스터 + 하단 매핑 거래처 (채널·비율·기간). UI_DP_PM_ACCOUNT.">
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <TextField label="브랜드" size="small" select value="ALL" sx={{ width: 140 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="illuvia">illuvia</MenuItem>
            <MenuItem value="CJ Brand Korea">CJ Brand Korea</MenuItem>
            <MenuItem value="NGP">NGP</MenuItem>
          </TextField>
          <TextField label="품목" size="small" value="" placeholder="품목명 또는 코드 [🔍]" sx={{ width: 220 }} />
          <TextField label="사용여부" size="small" select value="Y" sx={{ width: 120 }}>
            <MenuItem value="Y">사용</MenuItem><MenuItem value="N">미사용</MenuItem>
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
          <Button variant="contained" size="small" color="success" startIcon={<SaveIcon />}>저장</Button>
        </Stack>
      </Box>

      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5, flexGrow: 1, overflow: 'hidden' }}>
        <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 200 }}>
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>품목 마스터</Typography>
            <Chip size="small" label={`${MASTER.length} 건`} variant="outlined" />
            <Box sx={{ flexGrow: 1 }} />
            <Button size="small" startIcon={<AddIcon />} variant="outlined">행 추가</Button>
          </Box>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {['품목 코드','품목명','주거래처 수','사용여부'].map((c) => (
                    <TableCell key={c} sx={{ backgroundColor: 'grey.100', fontWeight: 700,
                      textAlign: ['주거래처 수','사용여부'].includes(c) ? 'center' : 'left' }}>{c}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {MASTER.map((r, i) => (
                  <TableRow key={i} hover selected={r.sel} sx={{ cursor: 'pointer', '&.Mui-selected': { backgroundColor: '#bbdefb' } }}>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{r.ITEM_CD}</TableCell>
                    <TableCell sx={{ fontWeight: r.sel ? 700 : undefined }}>{r.ITEM_NM}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace' }}>{r.MAIN_CUST_CNT}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Chip size="small" label={r.USE_YN === 'Y' ? '사용' : '미사용'} color={r.USE_YN === 'Y' ? 'success' : 'default'} variant={r.USE_YN === 'Y' ? 'filled' : 'outlined'} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 200 }}>
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>매핑 거래처 — illuvia 비건마스크 5매</Typography>
            <Chip size="small" label={`합계 ${DETAIL.reduce((a, b) => a + b.RATIO, 0).toFixed(1)}%`} color="info" variant="outlined" />
            <Box sx={{ flexGrow: 1 }} />
            <Button size="small" startIcon={<AddIcon />} variant="outlined">거래처 추가</Button>
          </Box>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {['거래처 코드','거래처명','채널','비율(%)','시작일','종료일'].map((c) => (
                    <TableCell key={c} sx={{ backgroundColor: 'grey.100', fontWeight: 700,
                      textAlign: c === '비율(%)' ? 'right' : (['시작일','종료일','채널'].includes(c) ? 'center' : 'left') }}>{c}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {DETAIL.map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{r.CUST_CD}</TableCell>
                    <TableCell>{r.CUST_NM}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Chip size="small" label={r.CHANNEL} variant="outlined" color={r.CHANNEL === 'ONLINE' ? 'info' : 'default'} />
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{r.RATIO.toFixed(1)}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 12 }}>{r.START_DT}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 12 }}>{r.END_DT}</TableCell>
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
