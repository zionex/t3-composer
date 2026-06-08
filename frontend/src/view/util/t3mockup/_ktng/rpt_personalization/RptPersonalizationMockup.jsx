import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Typography, Paper, Chip, Button, ButtonGroup, IconButton, Checkbox,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import DownloadIcon from '@mui/icons-material/Download';
import StarIcon from '@mui/icons-material/Star';
import PersonIcon from '@mui/icons-material/Person';
import MockShell from '../../_shared/MockShell';

// KTNG — RPT 개인화 버전 관리
// UI_RPT_KTNG_00 → RptKtng00.jsx
//   사용자별 개인화 리포트 버전 (필터/컬럼 선호 설정 저장)

const ROWS = [
  { VER_NM: '나의 기본 (Sell-In 전체)', USER_ID: 'kim.youngsu', USER_NM: '김영수', SCOPE: '편의점 전체', LV1: '담배', SAVED_DT: '2026-05-15 14:22', IS_DEFAULT: true, SHARE: false, COLS: 18 },
  { VER_NM: '에쎄 집중 모니터링',        USER_ID: 'kim.youngsu', USER_NM: '김영수', SCOPE: 'BGF리테일',  LV1: '담배', SAVED_DT: '2026-06-01 09:30', IS_DEFAULT: false, SHARE: true,  COLS: 14 },
  { VER_NM: 'CU 주간 점검',              USER_ID: 'lee.jihoon',  USER_NM: '이지훈', SCOPE: 'CU',         LV1: '담배', SAVED_DT: '2026-05-28 16:45', IS_DEFAULT: true, SHARE: false, COLS: 12 },
  { VER_NM: '해외 수출 dashboard',       USER_ID: 'choi.minji',  USER_NM: '최민지', SCOPE: '수출본부',   LV1: 'CIGAR', SAVED_DT: '2026-05-20 11:15', IS_DEFAULT: true, SHARE: true,  COLS: 22 },
  { VER_NM: 'NGP 신제품 추적',           USER_ID: 'park.sumin',  USER_NM: '박수민', SCOPE: '편의점 NGP', LV1: 'HEET',  SAVED_DT: '2026-06-05 10:00', IS_DEFAULT: false, SHARE: true,  COLS: 16 },
  { VER_NM: 'PM 종합 검토',              USER_ID: 'kim.dahye',   USER_NM: '김다혜', SCOPE: '전사',       LV1: 'ALL',   SAVED_DT: '2026-06-08 08:30', IS_DEFAULT: true, SHARE: true,  COLS: 24 },
];

export default function KtngRptPersonalizationMockup() {
  return (
    <MockShell
      patternCode="ktng_rpt_personalization"
      patternLabel="KTNG — RPT 개인화 버전 관리"
      layoutCategory="LAYOUT_SINGLE"
      description="UI_RPT_KTNG_00 → RptKtng00.jsx. 사용자별 리포트 개인화 설정 (필터/컬럼/Scope) 저장 및 공유 관리. 기본 버전 설정 + 공유 가능."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="USER" size="small" value="kim.youngsu (김영수)" sx={{ width: 240 }}
            InputProps={{ startAdornment: <PersonIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} /> }} />
          <TextField label="SHARE" size="small" select value="ALL" sx={{ width: 120 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="MINE">내것만</MenuItem>
            <MenuItem value="SHARED">공유받은것</MenuItem>
          </TextField>
        </Stack>
      </Box>

      <Box sx={{ px: 1.5, py: 0.7, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        <Button size="small" variant="outlined" startIcon={<DownloadIcon />}>Excel</Button>
        <ButtonGroup variant="outlined" size="small">
          <IconButton size="small"><AddIcon fontSize="small" /></IconButton>
          <IconButton size="small"><DeleteIcon fontSize="small" /></IconButton>
          <IconButton size="small" color="primary"><SaveIcon fontSize="small" /></IconButton>
        </ButtonGroup>
      </Box>

      <Box sx={{ p: 1.5, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Paper variant="outlined" sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead><TableRow>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, width: 40 }}></TableCell>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12 }}>VER_NM</TableCell>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, fontFamily: 'monospace' }}>USER_ID</TableCell>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12 }}>USER_NM</TableCell>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12 }}>SCOPE</TableCell>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12 }}>ITEM_LV1</TableCell>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, textAlign: 'right' }}>COLS</TableCell>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, textAlign: 'center' }}>공유</TableCell>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, fontFamily: 'monospace', textAlign: 'center' }}>SAVED_DT</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {ROWS.map((r, i) => (
                  <TableRow key={i} hover sx={{ bgcolor: r.IS_DEFAULT ? '#fffbeb' : 'transparent' }}>
                    <TableCell sx={{ textAlign: 'center' }}>
                      {r.IS_DEFAULT && <StarIcon sx={{ fontSize: 16, color: '#f59e0b' }} />}
                    </TableCell>
                    <TableCell sx={{ fontSize: 11, fontWeight: r.IS_DEFAULT ? 700 : 400 }}>{r.VER_NM}</TableCell>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace' }}>{r.USER_ID}</TableCell>
                    <TableCell sx={{ fontSize: 11 }}>{r.USER_NM}</TableCell>
                    <TableCell sx={{ fontSize: 11 }}>{r.SCOPE}</TableCell>
                    <TableCell sx={{ fontSize: 11 }}>
                      <Chip label={r.LV1} size="small" variant="outlined" sx={{ height: 18, fontSize: 10, color: r.LV1 === 'HEET' ? '#8b5cf6' : r.LV1 === 'CIGAR' ? '#ff7043' : '#1565c0' }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right' }}>{r.COLS}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Checkbox size="small" checked={r.SHARE} disabled sx={{ p: 0.25 }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'center', color: 'text.secondary' }}>{r.SAVED_DT}</TableCell>
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
