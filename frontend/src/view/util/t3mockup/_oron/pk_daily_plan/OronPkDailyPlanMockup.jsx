import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Typography, Paper, Chip, Button, ButtonGroup, IconButton,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SaveIcon from '@mui/icons-material/Save';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import MockShell from '../../_shared/MockShell';

// ORON — PK 일일/주간 생산계획
// 대표 화면: UI_PK_ORN_PACK_DAILY_PLAN "일일 생산계획 관리" (OrnPackDailyPlan)
//   SearchArea: 일자, 라인, 포장재 타입
//   Grid: LINE × 시간(8h-shift 단위) — 어떤 PACK 이 어떤 시간대에 가동되는지 (Gantt-like 형태)
//
// 같이 묶인 메뉴: 주간 의뢰서/배송 계획/타공장 배송/일별 자재 소요량 명세

// 일일 생산 라인별 가동 셀 — 시간(0~24h) × 라인
const HOURS = ['00', '02', '04', '06', '08', '10', '12', '14', '16', '18', '20', '22'];

const LINES = [
  {
    code: 'LN-PRT-01', name: '인쇄1 라인',
    blocks: [
      { startH: 8,  endH: 16, pack: 'PK-MK-001-T', label: '비건마스크5매 (T)', color: '#3b82f6', qty: 8000 },
      { startH: 16, endH: 24, pack: 'PK-MK-010-T', label: '비건마스크10매 (T)', color: '#3b82f6', qty: 3500 },
    ],
  },
  {
    code: 'LN-PRT-02', name: '인쇄2 라인',
    blocks: [
      { startH: 8,  endH: 24, pack: 'PK-SR-30', label: '오론 세럼 30ml', color: '#10b981', qty: 4500 },
    ],
  },
  {
    code: 'LN-OEM-01', name: 'OEM 라인',
    blocks: [
      { startH: 9,  endH: 24, pack: 'PK-OEM-SUN', label: 'OEM 선크림', color: '#f59e0b', qty: 8500 },
    ],
  },
  {
    code: 'LN-PRC-01', name: '가공1 라인',
    blocks: [
      { startH: 0, endH: 8, pack: 'PK-MK-001-T', label: '비건마스크5매 (T)', color: '#3b82f6', qty: 8000 },
    ],
  },
  {
    code: 'LN-CUT-01', name: '분단1 라인',
    blocks: [],
  },
];

const DAILY_SUMMARY = [
  { PACK_CD: 'PK-MK-001-T', PACK_NM: '오론 비건마스크 5매 - TUBE',  PLAN_QTY: 8000, ACT_QTY: 0,    LINE: 'LN-PRT-01 + LN-PRC-01', STATUS: 'PLANNED' },
  { PACK_CD: 'PK-MK-010-T', PACK_NM: '오론 비건마스크 10매 - TUBE', PLAN_QTY: 3500, ACT_QTY: 0,    LINE: 'LN-PRT-01',             STATUS: 'PLANNED' },
  { PACK_CD: 'PK-SR-30',    PACK_NM: '오론 세럼 30ml',              PLAN_QTY: 4500, ACT_QTY: 0,    LINE: 'LN-PRT-02',             STATUS: 'PLANNED' },
  { PACK_CD: 'PK-OEM-SUN',  PACK_NM: 'OEM 선크림 SPF50+ - PUMP',    PLAN_QTY: 8500, ACT_QTY: 0,    LINE: 'LN-OEM-01',             STATUS: 'PLANNED' },
];

export default function OronPkDailyPlanMockup() {
  return (
    <MockShell
      patternCode="oron_pk_daily_plan"
      patternLabel="ORON — PK 일일 생산계획 (간트 + 요약)"
      layoutCategory="LAYOUT_SINGLE"
      description="대표 화면 = 일일 생산계획 관리 (UI_PK_ORN_PACK_DAILY_PLAN). 상단 = 라인별 시간 간트 (24시간 × 5라인 — 인쇄/가공/분단/OEM), 하단 = 일자 요약 그리드 (포장재별 계획수량/실적/라인). 같이 묶인 메뉴: 주간 의뢰서/배송 계획(자공장+타공장)/일별 자재 소요량 명세."
    >
      {/* SearchArea */}
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="기준일" size="small" value="2026-06-08" sx={{ width: 150 }} />
          <TextField label="LINE_TYPE" size="small" select value="ALL" sx={{ width: 130 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="PRT">인쇄</MenuItem>
            <MenuItem value="PRC">가공</MenuItem>
            <MenuItem value="CUT">분단</MenuItem>
            <MenuItem value="OEM">OEM</MenuItem>
          </TextField>
          <TextField label="PACK_TP" size="small" select value="ALL" sx={{ width: 130 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="TUBE">TUBE</MenuItem>
            <MenuItem value="BOTTLE">BOTTLE</MenuItem>
          </TextField>
          <TextField label="MAIN_VER" size="small" select value="V2026-06" sx={{ width: 140 }}>
            <MenuItem value="V2026-06">V2026-06</MenuItem>
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          <Button size="small" variant="outlined" startIcon={<PrintIcon />}>인쇄</Button>
          <Button size="small" variant="outlined" startIcon={<DownloadIcon />}>Excel</Button>
          <ButtonGroup variant="outlined" size="small">
            <IconButton size="small" title="GridSaveButton" color="primary"><SaveIcon fontSize="small" /></IconButton>
          </ButtonGroup>
        </Stack>
      </Box>

      <Box sx={{ p: 1.5, flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5, minHeight: 0, overflow: 'auto' }}>
        {/* 상단 — 간트 차트 */}
        <Paper variant="outlined" sx={{ p: 1.5 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1 }}>일일 가동 간트 — 2026-06-08</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 0.5 }}>
            {/* 시간 축 헤더 */}
            <Box />
            <Box sx={{ position: 'relative', height: 18, borderBottom: '1px solid', borderColor: 'divider' }}>
              {HOURS.map((h, i) => (
                <Typography key={h} sx={{ position: 'absolute', left: `${(i / HOURS.length) * 100}%`, fontSize: 10, color: 'text.secondary', fontFamily: 'monospace' }}>
                  {h}:00
                </Typography>
              ))}
            </Box>
            {/* 라인 행 */}
            {LINES.map((ln) => (
              <React.Fragment key={ln.code}>
                <Box sx={{ pr: 1, display: 'flex', alignItems: 'center' }}>
                  <Stack>
                    <Typography sx={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700 }}>{ln.code}</Typography>
                    <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>{ln.name}</Typography>
                  </Stack>
                </Box>
                <Box sx={{ position: 'relative', height: 28, bgcolor: '#f9fafb', borderRadius: 0.5, border: '1px solid #e5e7eb' }}>
                  {/* 2시간 grid 라인 */}
                  {HOURS.map((_h, i) => (
                    <Box key={i} sx={{ position: 'absolute', left: `${(i / 12) * 100}%`, top: 0, bottom: 0, borderLeft: i === 0 ? 'none' : '1px solid #f3f4f6' }} />
                  ))}
                  {/* 블록 */}
                  {ln.blocks.map((b, i) => {
                    const left = (b.startH / 24) * 100;
                    const width = ((b.endH - b.startH) / 24) * 100;
                    return (
                      <Box key={i} sx={{
                        position: 'absolute', left: `${left}%`, width: `${width}%`,
                        top: 3, bottom: 3,
                        bgcolor: b.color, opacity: 0.85, borderRadius: 0.5,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', px: 0.5,
                        overflow: 'hidden', whiteSpace: 'nowrap',
                      }}>
                        <Typography sx={{ fontSize: 10, color: 'white', fontWeight: 600, textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                          {b.label} · {b.qty.toLocaleString()}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </React.Fragment>
            ))}
          </Box>
        </Paper>

        {/* 하단 — 요약 그리드 */}
        <Paper variant="outlined" sx={{ display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ px: 1.5, py: 0.7, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700 }}>일일 생산 요약</Typography>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, fontFamily: 'monospace' }}>PACK_CD</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12 }}>PACK_NM</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12 }}>LINE</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, fontFamily: 'monospace', textAlign: 'right' }}>PLAN_QTY</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, fontFamily: 'monospace', textAlign: 'right' }}>ACT_QTY</TableCell>
                  <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, textAlign: 'center' }}>STATUS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {DAILY_SUMMARY.map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={{ fontSize: 12, fontFamily: 'monospace' }}>{r.PACK_CD}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{r.PACK_NM}</TableCell>
                    <TableCell sx={{ fontSize: 12, fontFamily: 'monospace' }}>{r.LINE}</TableCell>
                    <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', textAlign: 'right' }}>{r.PLAN_QTY.toLocaleString()}</TableCell>
                    <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', textAlign: 'right', color: '#d1d5db' }}>{r.ACT_QTY.toLocaleString()}</TableCell>
                    <TableCell sx={{ fontSize: 12, textAlign: 'center', fontWeight: 600, color: '#9ca3af' }}>{r.STATUS}</TableCell>
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
