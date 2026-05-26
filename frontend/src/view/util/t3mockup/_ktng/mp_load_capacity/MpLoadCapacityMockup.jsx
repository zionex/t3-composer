import React from 'react';
import { Box, Stack, TextField, MenuItem, Button, Chip, Typography, Paper, Tabs, Tab,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer, LinearProgress } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SaveIcon from '@mui/icons-material/Save';
import MockShell from '../../_shared/MockShell';

// MpKtng05 (공장 부하/가동조건), MpKtng07 (설비 부하/가동조건)
// 공장/설비 단위 부하율 + 가동조건 (휴무일/교대/유효시간)

const PLANT_ROWS = [
  { PLANT: '신탄진 공장', LINE_CNT: 8,  CAPA_DAY: 850000,  PLAN_DAY: 720000,  LOAD: 84.7, SHIFTS: '3교대', OPER_HR: 22, HOLIDAY: 0 },
  { PLANT: '대전 공장',   LINE_CNT: 6,  CAPA_DAY: 580000,  PLAN_DAY: 520000,  LOAD: 89.7, SHIFTS: '3교대', OPER_HR: 22, HOLIDAY: 0 },
  { PLANT: '광주 공장',   LINE_CNT: 5,  CAPA_DAY: 420000,  PLAN_DAY: 340000,  LOAD: 81.0, SHIFTS: '2교대', OPER_HR: 16, HOLIDAY: 1 },
  { PLANT: '인도네시아',  LINE_CNT: 10, CAPA_DAY: 720000,  PLAN_DAY: 680000,  LOAD: 94.4, SHIFTS: '3교대', OPER_HR: 22, HOLIDAY: 0 },
];

const RES_ROWS = [
  { PLANT: '신탄진', RES_CD: 'L01-MK', RES_NM: 'M/K Line 01', CAPA_H: 35000, PLAN_H: 31500, LOAD: 90.0, JC_TIME: 30 },
  { PLANT: '신탄진', RES_CD: 'L02-MK', RES_NM: 'M/K Line 02', CAPA_H: 35000, PLAN_H: 28000, LOAD: 80.0, JC_TIME: 30 },
  { PLANT: '신탄진', RES_CD: 'L03-PK', RES_NM: 'PACK Line 03',CAPA_H: 40000, PLAN_H: 36000, LOAD: 90.0, JC_TIME: 20 },
  { PLANT: '대전',   RES_CD: 'L11-MK', RES_NM: 'M/K Line 11', CAPA_H: 30000, PLAN_H: 28500, LOAD: 95.0, JC_TIME: 35 },
  { PLANT: '대전',   RES_CD: 'L12-MK', RES_NM: 'M/K Line 12', CAPA_H: 30000, PLAN_H: 27000, LOAD: 90.0, JC_TIME: 35 },
  { PLANT: '광주',   RES_CD: 'L21-MK', RES_NM: 'M/K Line 21', CAPA_H: 28000, PLAN_H: 22400, LOAD: 80.0, JC_TIME: 40 },
  { PLANT: '광주',   RES_CD: 'L22-NGP',RES_NM: 'NGP Line 22', CAPA_H: 18000, PLAN_H: 14400, LOAD: 80.0, JC_TIME: 50 },
];

const loadColor = (l) => l >= 95 ? 'error' : l >= 85 ? 'warning' : 'success';

export default function MpLoadCapacityMockup() {
  return (
    <MockShell patternCode="ktng_mp_load_capacity" patternLabel="KTNG — 공장 / 설비 부하 · 가동조건 (MpKtng05/07)"
      layoutCategory="LAYOUT_SINGLE" description="공장 / 설비별 일평균 부하율 + 교대·가동시간 가동조건. 95% 초과는 위험.">
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <TextField label="버전" size="small" select value="V2026-05" sx={{ width: 140 }}>
            <MenuItem value="V2026-05">V2026-05</MenuItem>
          </TextField>
          <TextField label="PLANT" size="small" select value="ALL" sx={{ width: 140 }}>
            <MenuItem value="ALL">전체</MenuItem><MenuItem value="신탄진">신탄진</MenuItem><MenuItem value="대전">대전</MenuItem>
          </TextField>
          <TextField label="기간" size="small" value="2026-06 ~ 2026-08" sx={{ width: 180 }} />
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
          <Button variant="outlined" size="small" startIcon={<SaveIcon />}>가동조건 저장</Button>
        </Stack>
      </Box>

      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
        <Tabs value={0}>
          <Tab label="공장 단위 (MpKtng05)" />
          <Tab label="설비 단위 (MpKtng07)" />
        </Tabs>
      </Box>

      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5, flexGrow: 1, overflow: 'auto' }}>
        <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 200 }}>
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>공장별 부하 — {PLANT_ROWS.length}개</Typography>
          </Box>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {['공장','라인 수','일 CAPA','일 PLAN','부하율','시각화','교대','가동시간 (h)','휴무일'].map((c) => (
                    <TableCell key={c} sx={{ backgroundColor: 'grey.100', fontWeight: 700,
                      textAlign: ['라인 수','일 CAPA','일 PLAN','부하율','가동시간 (h)','휴무일'].includes(c) ? 'right' : (c === '교대' ? 'center' : 'left') }}>{c}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {PLANT_ROWS.map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{r.PLANT}</TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>{r.LINE_CNT}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.CAPA_DAY.toLocaleString()}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.PLAN_DAY.toLocaleString()}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: `${loadColor(r.LOAD)}.main` }}>{r.LOAD.toFixed(1)}%</TableCell>
                    <TableCell sx={{ minWidth: 130 }}>
                      <LinearProgress variant="determinate" value={Math.min(r.LOAD, 100)} color={loadColor(r.LOAD)} sx={{ height: 8, borderRadius: 1 }} />
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}><Chip size="small" label={r.SHIFTS} variant="outlined" /></TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.OPER_HR}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.HOLIDAY}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 200 }}>
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>설비별 부하 — {RES_ROWS.length}개 라인</Typography>
          </Box>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {['공장','RES_CD','설비명','시간당 CAPA','시간당 PLAN','부하율','교체시간 (분)'].map((c) => (
                    <TableCell key={c} sx={{ backgroundColor: 'grey.100', fontWeight: 700,
                      textAlign: c.includes('CAPA') || c.includes('PLAN') || c === '부하율' || c.includes('시간') ? 'right' : 'left' }}>{c}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {RES_ROWS.map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell>{r.PLANT}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{r.RES_CD}</TableCell>
                    <TableCell>{r.RES_NM}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.CAPA_H.toLocaleString()}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.PLAN_H.toLocaleString()}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: `${loadColor(r.LOAD)}.main` }}>{r.LOAD.toFixed(1)}%</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.JC_TIME}</TableCell>
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
