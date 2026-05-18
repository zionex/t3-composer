import React from 'react';
import { Box, Card, CardContent, Typography, Stack, Chip, Grid, Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import MockShell from '../_shared/MockShell';

const PROBLEM_KPI = [
  { name: '총 문제 건수',     value: 38,  unit: '건', color: 'warning' },
  { name: '결품 위험',         value: 7,   unit: 'SKU', color: 'error' },
  { name: '리드타임 초과',     value: 12,  unit: '건', color: 'warning' },
  { name: '용량 부족',         value: 3,   unit: '거점', color: 'error' },
];

const PROBLEM_TYPES = [
  { type: '지연 (Delay)',     count: 12, color: '#f59e0b', icon: WarningAmberIcon },
  { type: '부족 (Shortage)',   count: 7,  color: '#ef4444', icon: ErrorOutlineIcon },
  { type: '용량 (Capacity)',   count: 3,  color: '#ef4444', icon: ErrorOutlineIcon },
  { type: '기타 (Other)',      count: 16, color: '#94a3b8', icon: InfoOutlinedIcon },
];

const PROBLEM_DETAILS = [
  { id: 'PRB-001', severity: 'CRITICAL', type: '부족',     item: 'IT-D002 Display 55"',   plant: 'KR-Suwon',  desc: '안전재고 30% 미달 — 2주 내 결품 예상',         action: '긴급 발주' },
  { id: 'PRB-002', severity: 'HIGH',     type: '지연',     item: 'IT-B001 Camera IMX-700', plant: 'CN-Wuxi',   desc: 'PO-2026-0045 입고 지연 (예정 4/12 → 실제 4/15)', action: '대체 공급원' },
  { id: 'PRB-003', severity: 'HIGH',     type: '용량',     item: '-',                       plant: 'VN-HCMC',  desc: 'Line-B 용량 부족 (수요 12,000 vs 가용 10,500)',    action: '잔업 / 외주' },
  { id: 'PRB-004', severity: 'MEDIUM',   type: '지연',     item: 'IT-C001 Battery 18650', plant: 'CN-Suzhou', desc: 'WO-2026-7774 진척 31% (계획 50%)',                  action: '라인 재배치' },
  { id: 'PRB-005', severity: 'MEDIUM',   type: '부족',     item: 'IT-A003 LED 100W',       plant: 'KR-Asan',  desc: '리드타임 +3일 — 안전재고 임계 도달',                 action: '재고 이송' },
  { id: 'PRB-006', severity: 'LOW',      type: '기타',     item: 'IT-D001 Display 32"',    plant: 'KR-Suwon',  desc: 'BOM 변경 후 첫 생산 — 품질 모니터링 필요',           action: 'QA 강화' },
];

const SEV_COLOR = { CRITICAL: 'error', HIGH: 'warning', MEDIUM: 'info', LOW: 'default' };

export default function DashPlanProblemMockup() {
  return (
    <MockShell
      patternCode="dash_plan_problem"
      patternLabel="Plan Problem — 문제 현황"
      layoutCategory="LAYOUT_DASHBOARD"
      description="KPI + 문제유형(지연/부족/기타) + 상세표 3계층 (UI_FP_PLAN_PROBLEM_DASHBOARD)"
    >
      <Box sx={{ p: 2 }}>
        {/* L1. KPI 4종 */}
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          {PROBLEM_KPI.map((k) => (
            <Grid item xs={6} md={3} key={k.name}>
              <Card variant="outlined" sx={{ borderLeft: '4px solid', borderLeftColor: `${k.color}.main` }}>
                <CardContent sx={{ '&:last-child': { pb: 1.5 } }}>
                  <Typography variant="caption" color="text.secondary">{k.name}</Typography>
                  <Stack direction="row" alignItems="baseline" spacing={0.5}>
                    <Typography sx={{ fontSize: 36, fontWeight: 700, color: `${k.color}.main` }}>{k.value}</Typography>
                    <Typography variant="caption" color="text.secondary">{k.unit}</Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* L2. 문제 유형 분포 */}
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>문제 유형별 분포</Typography>
            <Grid container spacing={2}>
              {PROBLEM_TYPES.map((t) => {
                const Icon = t.icon;
                const total = PROBLEM_TYPES.reduce((s, x) => s + x.count, 0);
                const ratio = (t.count / total) * 100;
                return (
                  <Grid item xs={6} md={3} key={t.type}>
                    <Box>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                        <Icon sx={{ color: t.color, fontSize: 18 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>{t.type}</Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{t.count}</Typography>
                      </Stack>
                      <Box sx={{ position: 'relative', height: 8, bgcolor: 'grey.100', borderRadius: 0.5 }}>
                        <Box sx={{ position: 'absolute', inset: 0, width: `${ratio}%`, bgcolor: t.color, borderRadius: 0.5 }} />
                      </Box>
                      <Typography variant="caption" color="text.secondary">{ratio.toFixed(1)}% 점유</Typography>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          </CardContent>
        </Card>

        {/* L3. 상세표 */}
        <Card variant="outlined">
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, flex: 1 }}>문제 상세 (Top 6)</Typography>
              <Chip size="small" label={`Top ${PROBLEM_DETAILS.length} of 38`} variant="outlined" />
            </Stack>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>심각도</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>유형</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>품목</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>거점</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>설명</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>조치</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {PROBLEM_DETAILS.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{p.id}</TableCell>
                    <TableCell><Chip size="small" label={p.severity} color={SEV_COLOR[p.severity]} sx={{ height: 18, fontSize: 10, fontWeight: 700 }} /></TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{p.type}</TableCell>
                    <TableCell sx={{ fontSize: 12, fontFamily: 'monospace' }}>{p.item}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{p.plant}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{p.desc}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}><Chip size="small" label={p.action} variant="outlined" sx={{ height: 18, fontSize: 10 }} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Box>
    </MockShell>
  );
}
