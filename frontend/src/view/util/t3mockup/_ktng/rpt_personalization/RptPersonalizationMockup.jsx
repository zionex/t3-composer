import React from 'react';
import { Box, Stack, TextField, MenuItem, Button, Chip, Typography, Paper,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Avatar } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import StarIcon from '@mui/icons-material/Star';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import MockShell from '../../_shared/MockShell';

// RptKtng00 — 개인화 버전 관리 (사용자별 저장된 리포트 버전 관리)

const ROWS = [
  { CODE: 'V_BFM_001', NAME: '전사 정확도 (월간)',     USER: '김민수', SHARED: 'Y', FAV: true,  TARGET: 'RptKtng05',  PARAMS: '전사 / 2026-05 / 전월대비', CREATED: '2026-04-15', LAST_USED: '2026-05-22 09:14' },
  { CODE: 'V_INV_002', NAME: 'NGP 재고일수 추적',       USER: '정재현', SHARED: 'N', FAV: false, TARGET: 'RptKtng15',  PARAMS: 'NGP / 일별 / 60일+',         CREATED: '2026-04-22', LAST_USED: '2026-05-21 16:42' },
  { CODE: 'V_RTF_003', NAME: 'RTF 100% 미만 거래처',    USER: '박글로벌',SHARED: 'Y', FAV: true,  TARGET: 'RptKtng08',  PARAMS: 'GLOBAL / <100% / 주차별',     CREATED: '2026-03-10', LAST_USED: '2026-05-22 08:30' },
  { CODE: 'V_PSI_004', NAME: '공장별 PSI 주차 추이',     USER: '김민수', SHARED: 'Y', FAV: false, TARGET: 'RptKtng16',  PARAMS: '전체 공장 / W18~W25',         CREATED: '2026-02-08', LAST_USED: '2026-05-20 11:08' },
  { CODE: 'V_KPI_005', NAME: '경영 KPI 요약',           USER: 'admin',   SHARED: 'Y', FAV: true,  TARGET: 'RptKtng07',  PARAMS: '전사 / 월간 / 최근 6개월',    CREATED: '2026-01-05', LAST_USED: '2026-05-22 07:00' },
  { CODE: 'V_DAILY_06',NAME: '신탄진 일별 실적',         USER: '이정훈', SHARED: 'N', FAV: false, TARGET: 'RptKtng25',  PARAMS: '신탄진 / 최근 30일',          CREATED: '2026-04-30', LAST_USED: '2026-05-22 09:00' },
];

const STATS = [
  { label: '내 버전',     value: 12, color: 'primary' },
  { label: '공유 버전',   value: 28, color: 'success' },
  { label: '즐겨찾기',     value:  8, color: 'warning' },
  { label: '오늘 사용',   value: 24, color: 'info' },
];

export default function RptPersonalizationMockup() {
  return (
    <MockShell patternCode="ktng_rpt_personalization" patternLabel="KTNG — 개인화 버전 관리 (RptKtng00)"
      layoutCategory="LAYOUT_SINGLE" description="리포트별 저장된 개인화 버전(필터·파라미터 묶음). 공유/즐겨찾기/사본 만들기 지원.">
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <TextField label="대상 리포트" size="small" select value="ALL" sx={{ width: 160 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="RptKtng05">예측 정확도 (05)</MenuItem>
            <MenuItem value="RptKtng07">MP 실행율 (07)</MenuItem>
            <MenuItem value="RptKtng15">장기재고 (15)</MenuItem>
            <MenuItem value="RptKtng16">생산 PSI (16)</MenuItem>
          </TextField>
          <TextField label="작성자" size="small" value="" placeholder="USER_ID" sx={{ width: 140 }} />
          <TextField label="공유" size="small" select value="ALL" sx={{ width: 110 }}>
            <MenuItem value="ALL">전체</MenuItem><MenuItem value="Y">공유</MenuItem><MenuItem value="N">개인</MenuItem>
          </TextField>
          <TextField label="즐겨찾기만" size="small" select value="N" sx={{ width: 120 }}>
            <MenuItem value="Y">Y</MenuItem><MenuItem value="N">전체</MenuItem>
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
          <Button variant="outlined" size="small" startIcon={<AddIcon />}>새 버전</Button>
        </Stack>
      </Box>

      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5, flexGrow: 1, overflow: 'auto' }}>
        <Stack direction="row" spacing={1.5}>
          {STATS.map((s) => (
            <Paper key={s.label} variant="outlined" sx={{ p: 1.5, flex: 1, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">{s.label}</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: `${s.color}.main` }}>{s.value}</Typography>
            </Paper>
          ))}
        </Stack>

        <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 280 }}>
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>저장된 개인화 버전 ({ROWS.length})</Typography>
          </Box>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {['','코드','버전명','대상 리포트','파라미터','작성자','공유','생성일','최근 사용','액션'].map((c, i) => (
                    <TableCell key={c + i} sx={{ backgroundColor: 'grey.100', fontWeight: 700, textAlign: ['공유',''].includes(c) ? 'center' : 'left' }}>{c}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {ROWS.map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <StarIcon fontSize="small" sx={{ color: r.FAV ? '#f59e0b' : 'action.disabled' }} />
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{r.CODE}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{r.NAME}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}><Chip size="small" label={r.TARGET} variant="outlined" /></TableCell>
                    <TableCell sx={{ fontSize: 12, color: 'text.secondary' }}>{r.PARAMS}</TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Avatar sx={{ width: 22, height: 22, fontSize: 11 }}>{r.USER.charAt(0).toUpperCase()}</Avatar>
                        <Typography variant="body2" sx={{ fontSize: 12 }}>{r.USER}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{r.SHARED === 'Y' ? <Chip size="small" label="공유" color="success" /> : <Chip size="small" label="개인" />}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 11 }}>{r.CREATED}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 11 }}>{r.LAST_USED}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.3}>
                        <Button size="small" variant="outlined">열기</Button>
                        <Button size="small" variant="text" startIcon={<ContentCopyIcon fontSize="inherit" />}>복제</Button>
                      </Stack>
                    </TableCell>
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
