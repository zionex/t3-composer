import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography, Paper, Chip, Tabs, Tab,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SaveIcon from '@mui/icons-material/Save';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import MockShell from '../../_shared/MockShell';
import { cellSx } from '../../_shared/styleCallback';

// OronMp05 — 완제품/반제품 생산계획 편성·수정·조회 + 버전 비교
// UI_MP_ORN_PLAN_RST_ADJ, UI_MP_ORN_HALB_RST_ADJ, UI_MP_ORN_PLAN_RST_SRC, UI_MP_ORN_HALB_RST_SRC,
// UI_MP_ORN_PROD_AVAIL, UI_MP_ORN_SIMUL_COMPARE

const WEEK_BUCKETS = ['W22','W23','W24','W25','W26','W27','W28','W29','W30'];

const PLAN_ROWS = [
  { LINE_CD: 'L-001', ITEM_CD: 'F01001', ITEM_NM: '오론 비건마스크 5매',     vals: [4500, 4800, 5200, 5500, 5800, 6000, 6200, 6400, 6500], dmd: [4200, 4700, 5100, 5400, 5600, 5800, 6000, 6200, 6400] },
  { LINE_CD: 'L-001', ITEM_CD: 'F01002', ITEM_NM: '오론 세럼 아쿠아 30ml',   vals: [2200, 2300, 2500, 2600, 2700, 2800, 2900, 3000, 3100], dmd: [2100, 2250, 2400, 2550, 2650, 2750, 2850, 2950, 3050] },
  { LINE_CD: 'L-002', ITEM_CD: 'F02001', ITEM_NM: '오론 클렌징폼 150g',      vals: [3800, 3900, 4000, 4100, 4200, 4300, 4400, 4500, 4600], dmd: [3700, 3850, 4000, 4100, 4200, 4250, 4350, 4450, 4500] },
  { LINE_CD: 'L-003', ITEM_CD: 'F01003', ITEM_NM: '오론 토너 카밍 200ml',    vals: [1800, 1900, 2000, 2100, 2200, 2300, 2400, 2500, 2600], dmd: [1750, 1850, 2000, 2050, 2100, 2200, 2300, 2400, 2500] },
  { LINE_CD: 'L-004', ITEM_CD: 'F03001', ITEM_NM: 'OEM 선크림 SPF50+',       vals: [5800, 6000, 6200, 6400, 6600, 6800, 7000, 7200, 7400], dmd: [5700, 5950, 6150, 6350, 6550, 6750, 6950, 7150, 7350] },
];

function PlanGrid({ title }) {
  return (
    <Paper variant="outlined" sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{title}</Typography>
          <Chip label="9주 (W22~W30)" size="small" variant="outlined" />
          <Box sx={{ flexGrow: 1 }} />
          <Button size="small" variant="contained" startIcon={<SaveIcon />}>편성 저장</Button>
        </Stack>
      </Box>
      <TableContainer sx={{ flex: 1 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 90, textAlign: 'center' }}>라인</TableCell>
              <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 100, textAlign: 'center' }}>품목</TableCell>
              <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 180 }}>품목명</TableCell>
              <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 70, textAlign: 'center' }}>구분</TableCell>
              {WEEK_BUCKETS.map((w) => (
                <TableCell key={w} sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 75, textAlign: 'right' }}>{w}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {PLAN_ROWS.map((r, i) => (
              <React.Fragment key={i}>
                <TableRow hover>
                  <TableCell sx={cellSx('info', { align: 'center', mono: true })} rowSpan={2}>{r.LINE_CD}</TableCell>
                  <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace' }} rowSpan={2}>{r.ITEM_CD}</TableCell>
                  <TableCell rowSpan={2}>{r.ITEM_NM}</TableCell>
                  <TableCell sx={{ textAlign: 'center' }}><Chip label="수요" size="small" variant="outlined" /></TableCell>
                  {r.dmd.map((v, j) => (
                    <TableCell key={j} sx={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 11, color: '#6b7280' }}>{v.toLocaleString()}</TableCell>
                  ))}
                </TableRow>
                <TableRow hover>
                  <TableCell sx={{ textAlign: 'center' }}><Chip label="계획" size="small" color="primary" /></TableCell>
                  {r.vals.map((v, j) => {
                    const diff = v - r.dmd[j];
                    const color = diff < -100 ? '#c62828' : diff > 200 ? '#1565c0' : '#374151';
                    return (
                      <TableCell key={j} sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color, bgcolor: diff < -100 ? '#ffebee' : diff > 200 ? '#e3f2fd' : 'transparent' }}>
                        {v.toLocaleString()}
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
  );
}

export default function OronMpPlanAdjMockup() {
  const [tab, setTab] = React.useState(0);
  return (
    <MockShell
      patternCode="oron_mp_plan_adj"
      patternLabel="ORON — 완제품/반제품 생산계획 편성·수정"
      layoutCategory="LAYOUT_SINGLE"
      description="라인×품목 주별 크로스탭. 수요 vs 계획 비교 — 차이 음수(빨강)/양수(파랑) 시각화 + 편성 저장. UI_MP_ORN_PLAN_RST_ADJ/HALB_RST_ADJ/PROD_AVAIL/SIMUL_COMPARE."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="PLAN_SCOPE" size="small" select value="ORN_MP" sx={{ width: 140 }}>
            <MenuItem value="ORN_MP">ORN_MP</MenuItem>
          </TextField>
          <TextField label="MAIN_VER" size="small" select value="V2026-05" sx={{ width: 140 }}>
            <MenuItem value="V2026-05">V2026-05</MenuItem>
          </TextField>
          <TextField label="SIMUL_VER" size="small" select value="MAIN" sx={{ width: 140 }}>
            <MenuItem value="MAIN">MAIN</MenuItem>
            <MenuItem value="SIM_001">SIM_001</MenuItem>
          </TextField>
          <TextField label="라인" size="small" select value="ALL" sx={{ width: 110 }}>
            <MenuItem value="ALL">전체</MenuItem>
          </TextField>
          <TextField label="기간" size="small" value="2026-W22 ~ W30" sx={{ width: 180 }} />
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="outlined" size="small" startIcon={<CompareArrowsIcon />}>버전 비교</Button>
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
        </Stack>
      </Box>
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 1.5 }}>
        <Tabs value={tab} onChange={(_e, v) => setTab(v)}>
          <Tab label="완제품 편성/수정" />
          <Tab label="반제품 편성/수정" />
          <Tab label="공급 가용 결과" />
          <Tab label="완제품 계획 조회" />
        </Tabs>
      </Box>
      <Box sx={{ p: 1.5, height: '100%' }}>
        <PlanGrid title={['완제품 생산계획 편성/수정', '반제품 생산계획 편성/수정', '공급 가용 결과 조회', '완제품 생산계획 조회'][tab]} />
      </Box>
    </MockShell>
  );
}
