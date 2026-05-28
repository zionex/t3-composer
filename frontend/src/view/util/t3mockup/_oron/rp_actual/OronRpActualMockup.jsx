import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography, Paper, Chip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import SyncIcon from '@mui/icons-material/Sync';
import {
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import MockShell from '../../_shared/MockShell';
import { cellSx } from '../../_shared/styleCallback';

// OronRp03 — 분배 계획/실적 + 출하실적 + OSLS 수신
// UI_RP_ORN_PLAN_ACTUAL, 77, 91

const WEEKS = ['W22','W23','W24','W25','W26','W27'];
const PLAN_ACT = [
  { CENTER: '대전물류센터', planV: [12500, 13000, 13500, 13000, 12800, 13200], actV: [12200, 12850, 13300, null, null, null] },
  { CENTER: '부산영업소',   planV: [8500,  8800,  9000,  9200,  9000,  9100], actV: [8300,  8700,  8950,  null, null, null] },
  { CENTER: '광주영업소',   planV: [5200,  5400,  5600,  5500,  5300,  5400], actV: [5100,  5350,  5550,  null, null, null] },
  { CENTER: '익산물류',     planV: [9800, 10000, 10200, 10100, 10000, 10300], actV: [9500,  9900, 10100,  null, null, null] },
];

const OSLS_LOG = [
  { DT: '2026-05-28 06:00', TYPE: 'OSLS_IN',  CNT: 1245, STATUS: 'SUCCESS', MSG: '익일 출하 지시 수신 완료' },
  { DT: '2026-05-28 06:05', TYPE: 'STOCK_IN', CNT: 842,  STATUS: 'SUCCESS', MSG: '센터 재고 동기화' },
  { DT: '2026-05-27 06:00', TYPE: 'OSLS_IN',  CNT: 1188, STATUS: 'SUCCESS', MSG: '익일 출하 지시 수신 완료' },
  { DT: '2026-05-27 06:05', TYPE: 'STOCK_IN', CNT: 0,    STATUS: 'WARN',    MSG: '제주 센터 재고 미수신 (재시도 예약)' },
  { DT: '2026-05-26 06:00', TYPE: 'OSLS_IN',  CNT: 1302, STATUS: 'SUCCESS', MSG: '익일 출하 지시 수신 완료' },
];

const OSLS_COLOR = { SUCCESS: 'success', WARN: 'warning', FAIL: 'error' };

export default function OronRpActualMockup() {
  return (
    <MockShell
      patternCode="oron_rp_actual"
      patternLabel="ORON — 분배 계획/실적 + 출하 + OSLS 수신"
      layoutCategory="LAYOUT_V2"
      description="상단: 거점별 분배 계획 vs 실적 주별 크로스탭, 하단: OSLS 인터페이스 수신 이력. UI_RP_ORN_PLAN_ACTUAL, 77(출하실적), 91(OSLS)."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="물류센터" size="small" select value="ALL" sx={{ width: 150 }}>
            <MenuItem value="ALL">전체</MenuItem>
          </TextField>
          <TextField label="품목군" size="small" select value="ALL" sx={{ width: 130 }}>
            <MenuItem value="ALL">전체</MenuItem>
          </TextField>
          <TextField label="기간" size="small" value="2026-W22 ~ W27" sx={{ width: 170 }} />
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
          <Button variant="outlined" size="small" startIcon={<SyncIcon />}>OSLS 재수신</Button>
          <Button variant="outlined" size="small" startIcon={<DownloadIcon />}>Excel</Button>
        </Stack>
      </Box>

      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5, height: '100%' }}>
        {/* 분배 계획/실적 */}
        <Paper variant="outlined" sx={{ flex: 1.3, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>거점별 분배 계획 vs 실적 (주별)</Typography>
              <Chip label="실적 = 굵게 / 계획 = 회색" size="small" variant="outlined" />
            </Stack>
          </Box>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 150, textAlign: 'center' }}>거점</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 80, textAlign: 'center' }}>구분</TableCell>
                  {WEEKS.map((w) => (
                    <TableCell key={w} sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 90, textAlign: 'right' }}>{w}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {PLAN_ACT.map((r, i) => (
                  <React.Fragment key={i}>
                    <TableRow hover>
                      <TableCell sx={cellSx('info', { align: 'center' })} rowSpan={2}>{r.CENTER}</TableCell>
                      <TableCell sx={{ textAlign: 'center' }}><Chip label="계획" size="small" variant="outlined" /></TableCell>
                      {r.planV.map((v, j) => (
                        <TableCell key={j} sx={{ textAlign: 'right', fontFamily: 'monospace', color: '#6b7280' }}>{v.toLocaleString()}</TableCell>
                      ))}
                    </TableRow>
                    <TableRow hover>
                      <TableCell sx={{ textAlign: 'center' }}><Chip label="실적" size="small" color="success" /></TableCell>
                      {r.actV.map((v, j) => {
                        const plan = r.planV[j];
                        const ratio = v == null ? null : (v / plan) * 100;
                        return (
                          <TableCell key={j} sx={{
                            textAlign: 'right', fontFamily: 'monospace', fontWeight: 700,
                            color: v == null ? '#d1d5db' : ratio >= 98 ? '#10b981' : ratio >= 95 ? '#374151' : '#c62828',
                          }}>
                            {v == null ? '-' : v.toLocaleString()}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* OSLS 수신 */}
        <Paper variant="outlined" sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <SyncIcon fontSize="small" color="primary" />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>OSLS 인터페이스 수신 이력</Typography>
              <Chip label="SUCCESS 4 / WARN 1" size="small" variant="outlined" />
            </Stack>
          </Box>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 150, textAlign: 'center' }}>수신일시</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 110, textAlign: 'center' }}>유형</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 90, textAlign: 'right' }}>건수</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 100, textAlign: 'center' }}>결과</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700 }}>메시지</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {OSLS_LOG.map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 11 }}>{r.DT}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace' }}>{r.TYPE}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>{r.CNT.toLocaleString()}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}><Chip label={r.STATUS} size="small" color={OSLS_COLOR[r.STATUS] || 'default'} variant={r.STATUS === 'SUCCESS' ? 'outlined' : 'filled'} /></TableCell>
                    <TableCell sx={{ fontSize: 12, color: r.STATUS === 'WARN' ? '#e65100' : '#6b7280' }}>{r.MSG}</TableCell>
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
