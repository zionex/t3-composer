import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography, Paper, Chip,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import LayersIcon from '@mui/icons-material/Layers';
import MockShell from '../../_shared/MockShell';
import { cellSx } from '../../_shared/styleCallback';

// OronMp08 — 번들작업 + 번들반제품 계획 + OEM 생산요청 + 생산계획 대비 실적 조회
// UI_MP_ORN_BUNDLE_REQ, BUNDLE_PLAN, OEM_PROD_REQ, PLAN_ACT_INQ

const BUNDLE_HEADER = [
  { BUNDLE_NO: 'BD-2026-0035', BUNDLE_NM: '오론 시그니처 3종 세트', QTY: 2500, START: '2026-06-03', END: '2026-06-08', STATUS: 'PLANNED' },
  { BUNDLE_NO: 'BD-2026-0036', BUNDLE_NM: '여행용 미니 키트 5종',    QTY: 1500, START: '2026-06-10', END: '2026-06-14', STATUS: 'CONFIRMED' },
  { BUNDLE_NO: 'BD-2026-0037', BUNDLE_NM: 'OEM A사 선크림+립밤 세트', QTY: 5000, START: '2026-06-15', END: '2026-06-22', STATUS: 'IN_PROGRESS' },
];

const BUNDLE_DETAIL = [
  // BD-2026-0035
  { BUNDLE_NO: 'BD-2026-0035', ITEM_CD: 'F01001', ITEM_NM: '오론 비건마스크 5매',    UNIT_QTY: 1, TOTAL: 2500, STOCK: 1800, SHORT: 700 },
  { BUNDLE_NO: 'BD-2026-0035', ITEM_CD: 'F01002', ITEM_NM: '오론 세럼 30ml',         UNIT_QTY: 1, TOTAL: 2500, STOCK: 2600, SHORT: 0 },
  { BUNDLE_NO: 'BD-2026-0035', ITEM_CD: 'F01003', ITEM_NM: '오론 토너 200ml',        UNIT_QTY: 1, TOTAL: 2500, STOCK: 1200, SHORT: 1300 },
];

const PLAN_ACT = [
  { LINE_CD: 'L-001', ITEM_CD: 'F01001', PLAN_QTY: 5200, ACT_QTY: 5050, GAP: -150, GAP_PCT: -2.9, REASON: '품질이슈' },
  { LINE_CD: 'L-001', ITEM_CD: 'F01002', PLAN_QTY: 2500, ACT_QTY: 2580, GAP:  80, GAP_PCT:  3.2, REASON: '추가생산' },
  { LINE_CD: 'L-002', ITEM_CD: 'F02001', PLAN_QTY: 4000, ACT_QTY: 4000, GAP:   0, GAP_PCT:  0.0, REASON: '-' },
  { LINE_CD: 'L-003', ITEM_CD: 'F01003', PLAN_QTY: 2000, ACT_QTY: 1820, GAP:-180, GAP_PCT: -9.0, REASON: '원료 부족' },
  { LINE_CD: 'L-004', ITEM_CD: 'F03001', PLAN_QTY: 6200, ACT_QTY: 6150, GAP: -50, GAP_PCT: -0.8, REASON: '-' },
];

const STATUS_COLOR = { PLANNED: 'default', CONFIRMED: 'primary', IN_PROGRESS: 'info', DONE: 'success' };

export default function OronMpBundleMockup() {
  return (
    <MockShell
      patternCode="oron_mp_bundle"
      patternLabel="ORON — 번들작업 + OEM 요청 + 생산실적 대비"
      layoutCategory="LAYOUT_V2"
      description="상단: 번들 작업 헤더 + 상세 (구성 품목별 재고/부족) — 하단: 라인×품목 계획 대비 실적 (GAP/REASON)."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="공장" size="small" select value="ALL" sx={{ width: 110 }}>
            <MenuItem value="ALL">전체</MenuItem>
          </TextField>
          <TextField label="번들/OEM" size="small" select value="ALL" sx={{ width: 130 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="BUNDLE">번들</MenuItem>
            <MenuItem value="OEM">OEM</MenuItem>
          </TextField>
          <TextField label="기간" size="small" value="2026-06" sx={{ width: 140 }} />
          <Box sx={{ flexGrow: 1 }} />
          <Button size="small" variant="outlined" startIcon={<AddIcon />}>번들 생성</Button>
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
          <Button variant="contained" size="small" startIcon={<SaveIcon />}>저장</Button>
        </Stack>
      </Box>

      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5, height: '100%' }}>
        {/* Top — 번들 헤더 + 상세 */}
        <Stack direction="row" spacing={1.5} sx={{ height: 230 }}>
          <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <LayersIcon fontSize="small" color="primary" />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>번들 작업 헤더</Typography>
              </Stack>
            </Box>
            <TableContainer sx={{ flex: 1 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 130, textAlign: 'center' }}>번들번호</TableCell>
                    <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700 }}>번들명</TableCell>
                    <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 80, textAlign: 'right' }}>수량</TableCell>
                    <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 100, textAlign: 'center' }}>시작</TableCell>
                    <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 100, textAlign: 'center' }}>완료</TableCell>
                    <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 100, textAlign: 'center' }}>상태</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {BUNDLE_HEADER.map((r, i) => (
                    <TableRow key={i} hover selected={i === 0}>
                      <TableCell sx={cellSx('info', { align: 'center', mono: true })}>{r.BUNDLE_NO}</TableCell>
                      <TableCell>{r.BUNDLE_NM}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.QTY.toLocaleString()}</TableCell>
                      <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace' }}>{r.START}</TableCell>
                      <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace' }}>{r.END}</TableCell>
                      <TableCell sx={{ textAlign: 'center' }}><Chip label={r.STATUS} size="small" color={STATUS_COLOR[r.STATUS] || 'default'} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>번들 구성 품목 (BD-2026-0035 — 2,500 세트)</Typography>
            </Box>
            <TableContainer sx={{ flex: 1 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 90, textAlign: 'center' }}>품목</TableCell>
                    <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700 }}>품목명</TableCell>
                    <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 70, textAlign: 'right' }}>단가</TableCell>
                    <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 80, textAlign: 'right' }}>총소요</TableCell>
                    <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 80, textAlign: 'right' }}>재고</TableCell>
                    <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 80, textAlign: 'right' }}>부족</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {BUNDLE_DETAIL.map((r, i) => (
                    <TableRow key={i} hover>
                      <TableCell sx={cellSx('info', { align: 'center', mono: true })}>{r.ITEM_CD}</TableCell>
                      <TableCell>{r.ITEM_NM}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.UNIT_QTY}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.TOTAL.toLocaleString()}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.STOCK.toLocaleString()}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: r.SHORT > 0 ? '#c62828' : '#10b981', bgcolor: r.SHORT > 0 ? '#ffebee' : 'transparent' }}>
                        {r.SHORT > 0 ? `▲ ${r.SHORT.toLocaleString()}` : '✓ 충족'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Stack>

        {/* Bottom — 생산계획 대비 실적 */}
        <Paper variant="outlined" sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>생산계획 대비 실적 (2026-05-28 기준)</Typography>
          </Box>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 90, textAlign: 'center' }}>라인</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 100, textAlign: 'center' }}>품목</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 100, textAlign: 'right' }}>계획</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 100, textAlign: 'right' }}>실적</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 100, textAlign: 'right' }}>GAP</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 100, textAlign: 'right' }}>GAP %</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700 }}>사유</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {PLAN_ACT.map((r, i) => {
                  const isLow = r.GAP_PCT < -5;
                  const isMed = r.GAP_PCT < -1;
                  const isPos = r.GAP_PCT > 1;
                  return (
                    <TableRow key={i} hover>
                      <TableCell sx={cellSx('info', { align: 'center', mono: true })}>{r.LINE_CD}</TableCell>
                      <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace' }}>{r.ITEM_CD}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.PLAN_QTY.toLocaleString()}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>{r.ACT_QTY.toLocaleString()}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: isLow ? '#c62828' : isMed ? '#e65100' : isPos ? '#1565c0' : '#374151' }}>
                        {r.GAP > 0 ? `+${r.GAP.toLocaleString()}` : r.GAP.toLocaleString()}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: isLow ? '#c62828' : isMed ? '#e65100' : isPos ? '#1565c0' : '#10b981' }}>
                        {r.GAP_PCT > 0 ? '+' : ''}{r.GAP_PCT.toFixed(1)}%
                      </TableCell>
                      <TableCell sx={{ color: '#6b7280', fontSize: 12 }}>{r.REASON}</TableCell>
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
