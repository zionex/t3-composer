import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography, Paper, Chip, LinearProgress,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SearchIcon from '@mui/icons-material/Search';
import CalculateIcon from '@mui/icons-material/Calculate';
import MockShell from '../../_shared/MockShell';
import CbStepper from '../../_shared/CbStepper';
import { cellSx } from '../../_shared/styleCallback';

// OronRp02 — 분배 가용량 생성/입력/보정 + 시뮬레이션 + 결과
// UI_RP_ORN_02, 03, 22, 21, PLAN_ADJ, 04

const STEPS = [
  { label: '주문 수집', status: 'done',    detail: '주문 24건' },
  { label: '재고 검토', status: 'done',    detail: '공장 5건' },
  { label: '가용량 산정', status: 'done',  detail: '품목별' },
  { label: '분배 엔진', status: 'running', detail: '67%' },
  { label: '결과 확정', status: 'pending', detail: '대기' },
];

const AVAIL_ROWS = [
  { ITEM_CD: 'F01001', ITEM_NM: '오론 비건마스크 5매',  WH_STOCK: 8500,  INSPECT: 1200, AVAIL: 7300,  REQ: 5500, ALLOC: 5500,  REMAIN: 1800 },
  { ITEM_CD: 'F01002', ITEM_NM: '오론 세럼 30ml',       WH_STOCK: 3200,  INSPECT:  400, AVAIL: 2800,  REQ: 2500, ALLOC: 2500,  REMAIN:  300 },
  { ITEM_CD: 'F01003', ITEM_NM: '오론 토너 200ml',      WH_STOCK: 2100,  INSPECT:    0, AVAIL: 2100,  REQ: 1800, ALLOC: 1800,  REMAIN:  300 },
  { ITEM_CD: 'F02001', ITEM_NM: '오론 클렌징폼 150g',   WH_STOCK: 1500,  INSPECT:  200, AVAIL: 1300,  REQ: 1700, ALLOC: 1300,  REMAIN:    0, SHORT: 400 },
  { ITEM_CD: 'F03001', ITEM_NM: 'OEM 선크림 SPF50+',    WH_STOCK: 6500,  INSPECT:  500, AVAIL: 6000,  REQ: 8000, ALLOC: 6000,  REMAIN:    0, SHORT: 2000 },
  { ITEM_CD: 'F04002', ITEM_NM: '오론 슬리핑팩 50ml',   WH_STOCK: 1200,  INSPECT:    0, AVAIL: 1200,  REQ:  600, ALLOC:  600,  REMAIN:  600 },
];

const ALLOC_ROWS = [
  { ORD_NO: 'OR-2026-1024', CENTER: '대전물류센터', ITEM_CD: 'F01001', REQ: 2500, ALLOC: 2500, RATE: 100, ETA: '2026-06-04' },
  { ORD_NO: 'OR-2026-1025', CENTER: '광주영업소',   ITEM_CD: 'F01002', REQ:  800, ALLOC:  800, RATE: 100, ETA: '2026-06-04' },
  { ORD_NO: 'OR-2026-1026', CENTER: '부산영업소',   ITEM_CD: 'F01001', REQ: 1500, ALLOC: 1500, RATE: 100, ETA: '2026-06-05' },
  { ORD_NO: 'OR-2026-1027', CENTER: '제주영업소',   ITEM_CD: 'F02001', REQ:  500, ALLOC:  500, RATE: 100, ETA: '2026-06-06' },
  { ORD_NO: 'OR-2026-1028', CENTER: '익산물류',     ITEM_CD: 'F03001', REQ: 3000, ALLOC: 2250, RATE:  75, ETA: '2026-06-05' },
  { ORD_NO: 'OR-2026-1029', CENTER: '대전물류센터', ITEM_CD: 'F01003', REQ: 1200, ALLOC: 1200, RATE: 100, ETA: '2026-06-07' },
];

export default function OronRpAvailabilityMockup() {
  return (
    <MockShell
      patternCode="oron_rp_availability"
      patternLabel="ORON — 분배 가용량 + 시뮬레이션 + 결과"
      layoutCategory="LAYOUT_CONTROLBOARD"
      description="분배 5단계 엔진 (주문→재고→가용량→분배엔진→확정) + 가용량 산정표 + 주문별 할당 결과. UI_RP_ORN_02/03/22/21/PLAN_ADJ/04."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="VERSION" size="small" value="RP_V2026_05_28" sx={{ width: 180 }} />
          <TextField label="대상 공장" size="small" select value="ALL" sx={{ width: 130 }}>
            <MenuItem value="ALL">전체</MenuItem>
          </TextField>
          <TextField label="기준일" size="small" value="2026-06-03" sx={{ width: 140 }} />
          <Box sx={{ flexGrow: 1 }} />
          <Chip icon={<PlayArrowIcon />} label="RUNNING" color="primary" />
          <Button variant="outlined" size="small" startIcon={<CalculateIcon />}>가용량 재계산</Button>
        </Stack>
      </Box>

      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5, height: '100%' }}>
        <Paper variant="outlined" sx={{ p: 1.5 }}>
          <CbStepper steps={STEPS} />
          <Box sx={{ mt: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="caption" sx={{ minWidth: 80 }}>분배 엔진</Typography>
              <Box sx={{ flexGrow: 1 }}>
                <LinearProgress variant="determinate" value={67} sx={{ height: 8, borderRadius: 1 }} />
              </Box>
              <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, minWidth: 50 }}>67%</Typography>
            </Stack>
          </Box>
        </Paper>

        <Stack direction="row" spacing={1.5}>
          {[
            { label: '주문 합계', value: '24건',  detail: '20,100 EA', color: 'primary' },
            { label: '가용량',   value: '20,700', detail: 'WH - 검사중', color: 'info' },
            { label: '할당 완료', value: '18,150', detail: '90.3%',     color: 'success' },
            { label: '부족 수량', value: '2,400',  detail: '2개 품목 결품 위험', color: 'error' },
          ].map((k) => (
            <Paper key={k.label} variant="outlined" sx={{ p: 1.5, flex: 1 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>{k.label}</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: `${k.color}.main`, mt: 0.5 }}>{k.value}</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>{k.detail}</Typography>
            </Paper>
          ))}
        </Stack>

        <Stack direction="row" spacing={1.5} sx={{ flex: 1, minHeight: 0 }}>
          {/* 가용량 산정 */}
          <Paper variant="outlined" sx={{ flex: 1.1, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>품목별 가용량 산정 (창고재고 - 검사중)</Typography>
            </Box>
            <TableContainer sx={{ flex: 1 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 90, textAlign: 'center' }}>품목</TableCell>
                    <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700 }}>품목명</TableCell>
                    <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 80, textAlign: 'right' }}>창고재고</TableCell>
                    <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 70, textAlign: 'right' }}>검사중</TableCell>
                    <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 80, textAlign: 'right' }}>가용량</TableCell>
                    <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 80, textAlign: 'right' }}>요청</TableCell>
                    <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 80, textAlign: 'right' }}>할당</TableCell>
                    <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 80, textAlign: 'right' }}>잔여/부족</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {AVAIL_ROWS.map((r, i) => (
                    <TableRow key={i} hover>
                      <TableCell sx={cellSx('info', { align: 'center', mono: true })}>{r.ITEM_CD}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{r.ITEM_NM}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.WH_STOCK.toLocaleString()}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', color: '#6b7280' }}>{r.INSPECT.toLocaleString()}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>{r.AVAIL.toLocaleString()}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.REQ.toLocaleString()}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', color: '#1565c0' }}>{r.ALLOC.toLocaleString()}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: r.SHORT ? '#c62828' : '#10b981', bgcolor: r.SHORT ? '#ffebee' : 'transparent' }}>
                        {r.SHORT ? `▲${r.SHORT.toLocaleString()}` : `+${r.REMAIN.toLocaleString()}`}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* 할당 결과 */}
          <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>주문별 할당 결과</Typography>
            </Box>
            <TableContainer sx={{ flex: 1 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 130, textAlign: 'center' }}>주문</TableCell>
                    <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700 }}>거점</TableCell>
                    <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 80, textAlign: 'center' }}>품목</TableCell>
                    <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 70, textAlign: 'right' }}>요청</TableCell>
                    <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 70, textAlign: 'right' }}>할당</TableCell>
                    <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 90, textAlign: 'right' }}>충족률</TableCell>
                    <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 100, textAlign: 'center' }}>도착예정</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ALLOC_ROWS.map((r, i) => (
                    <TableRow key={i} hover>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: 11, textAlign: 'center' }}>{r.ORD_NO}</TableCell>
                      <TableCell sx={{ fontSize: 11 }}>{r.CENTER}</TableCell>
                      <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace' }}>{r.ITEM_CD}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.REQ.toLocaleString()}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>{r.ALLOC.toLocaleString()}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: r.RATE === 100 ? '#10b981' : r.RATE >= 80 ? '#1565c0' : '#c62828' }}>
                        {r.RATE}%
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 11 }}>{r.ETA}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Stack>
      </Box>
    </MockShell>
  );
}
