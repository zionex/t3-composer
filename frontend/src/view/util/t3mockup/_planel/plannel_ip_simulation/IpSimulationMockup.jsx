import React from 'react';
import { Box, Stack, Button, Chip, Typography, Paper, List, ListItem, ListItemText } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import MockShell from '../../_shared/MockShell';

// PLANNEL IP 시뮬레이션 — TargetInventorySimulation / Results / IpScenarioAiRecommend 3개
// LAYOUT_H2 — 좌측 시뮬레이션 입력 + AI 추천 / 우측 결과 비교

const SCENARIOS = [
  { id: 'S1', name: 'AI 추천 — Service Level +1%', tier: 'A: 99→99% / B: 95→96%', ai: true,  status: 'recommended' },
  { id: 'S2', name: 'AI 추천 — Safety Stock 동적', tier: '주간 재계산 (CV>0.5)',  ai: true,  status: 'recommended' },
  { id: 'S3', name: 'Manual — 안전재고 +20%',     tier: 'Static',                ai: false, status: 'draft' },
  { id: 'S4', name: 'Manual — Lead Time -2일',     tier: 'Static',                ai: false, status: 'draft' },
];

const RESULT_KPIS = [
  { label: 'Fill Rate',  current: 92.4, simulated: 96.8, delta: '+4.4%p', color: 'success' },
  { label: '재고 가치 (B)', current: 24.8, simulated: 23.1, delta: '-6.8%',  color: 'success' },
  { label: '회전율',     current: 8.4,  simulated: 9.6,  delta: '+1.2',   color: 'success' },
  { label: '결품 일수/년', current: 18,   simulated: 4,    delta: '-77%',   color: 'success' },
];

export default function IpSimulationMockup() {
  return (
    <MockShell
      patternCode="plannel_ip_simulation"
      patternLabel="PlaNEL — IP 시뮬레이션 (Target Inventory Simulation / Results / AI Recommend)"
      layoutCategory="LAYOUT_H2"
      description="좌측 시뮬레이션 시나리오 + AI 추천 / 우측 결과 비교 KPI. AI 기반 IP 최적화."
    >
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Box sx={{ width: '42%', borderRight: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column' }}>
          <Stack direction="row" alignItems="center" sx={{ p: 1.5, backgroundColor: 'primary.50', borderBottom: '1px solid', borderColor: 'divider' }}>
            <AutoAwesomeIcon color="primary" />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, ml: 1 }}>시뮬레이션 시나리오</Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Button size="small" startIcon={<PlayCircleIcon />} variant="contained">실행</Button>
          </Stack>
          <Box sx={{ flex: 1, overflow: 'auto', p: 1.5 }}>
            <Stack spacing={1.5}>
              {SCENARIOS.map((s) => (
                <Paper key={s.id} elevation={s.id === 'S1' ? 4 : 1} sx={{
                  p: 1.5,
                  border: s.id === 'S1' ? '2px solid' : '1px solid',
                  borderColor: s.id === 'S1' ? 'success.main' : 'divider',
                  backgroundColor: s.id === 'S1' ? 'success.50' : undefined,
                }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Chip label={s.id} size="small" sx={{ fontFamily: 'monospace', fontWeight: 700 }} />
                    {s.ai && <Chip label="🤖 AI" size="small" color="primary" />}
                    <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>{s.name}</Typography>
                    {s.status === 'recommended' && <Chip label="추천" size="small" color="success" />}
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>{s.tier}</Typography>
                </Paper>
              ))}
            </Stack>
            <Paper elevation={0} sx={{ p: 1.5, mt: 2, backgroundColor: 'primary.50', border: '1px dashed', borderColor: 'primary.main' }}>
              <Stack direction="row" alignItems="center">
                <AutoAwesomeIcon color="primary" sx={{ fontSize: 18 }} />
                <Typography variant="caption" sx={{ ml: 0.5, fontWeight: 700, color: 'primary.dark' }}>
                  AI Suggestion
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ mt: 0.5, fontSize: 12 }}>
                S1 + S2 조합 추천 — Fill Rate 96.8% 달성하면서 재고 가치 6.8% 절감.
              </Typography>
            </Paper>
          </Box>
        </Box>

        <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>시뮬 결과 — S1 + S2 적용 시</Typography>
          <Stack spacing={1.5}>
            {RESULT_KPIS.map((k) => (
              <Paper key={k.label} elevation={1} sx={{ p: 1.5 }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary">{k.label}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>현재 → 시뮬</Typography>
                  </Box>
                  <Stack alignItems="center" sx={{ minWidth: 80 }}>
                    <Typography variant="caption" color="text.secondary">현재</Typography>
                    <Typography variant="h5" sx={{ fontFamily: 'monospace' }}>{k.current}</Typography>
                  </Stack>
                  <Typography variant="h6" color="text.disabled">→</Typography>
                  <Stack alignItems="center" sx={{ minWidth: 80 }}>
                    <Typography variant="caption" color="success.main" sx={{ fontWeight: 700 }}>시뮬</Typography>
                    <Typography variant="h5" sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'success.main' }}>{k.simulated}</Typography>
                  </Stack>
                  <Chip label={k.delta} color={k.color} sx={{ minWidth: 80, fontWeight: 700 }} />
                </Stack>
              </Paper>
            ))}
          </Stack>
        </Box>
      </Box>
    </MockShell>
  );
}
