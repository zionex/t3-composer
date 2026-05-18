import React from 'react';
import { Box, Grid } from '@mui/material';

import MockShell from '../_shared/MockShell';
import BoardWidgetTile from '../_shared/BoardWidgetTile';

const WIDGETS = [
  { title: '생산 (P)',            value: '12,820', unit: 'EA',    trend: 'up',   delta: '+3.8%',  sparkline: [11200,11500,11900,12100,12400,12650,12820], color: '#5281b3' },
  { title: '판매 (S)',            value: '12,500', unit: 'EA',    trend: 'up',   delta: '+4.5%',  sparkline: [11200,11400,11800,12000,12150,12300,12500], color: '#2a9d8f' },
  { title: '재고 (I)',            value: '11,280', unit: 'EA',    trend: 'down', delta: '−2.5%',  isReverseGood: false, sparkline: [12450,12180,12100,11850,11650,11420,11280], color: '#fa7d5b' },
  { title: 'PSI 균형 (P-S)',      value: '+320',   unit: 'EA',    trend: 'up',   delta: '재고 증가', sparkline: [50,80,120,180,220,280,320], color: '#10b981' },
  { title: '재고 변동 알람',      value: '4',      unit: 'SKU',   trend: null,                     badge: 'WATCH', badgeColor: 'warning', sparkline: [3,3,3,4,4,4,4], color: '#f59e0b' },
  { title: 'PSI 일치율',          value: '92.7',   unit: '%',     trend: 'up',   delta: '+1.5pt',  sparkline: [89.0,90.0,90.8,91.5,92.0,92.4,92.7], color: '#06b6d4' },
];

export default function DashPsiBoardMockup() {
  return (
    <MockShell
      patternCode="dash_psi_board"
      patternLabel="PSI Board — 생산·재고·판매"
      layoutCategory="LAYOUT_DASHBOARD"
      description="PSI 균형 + 변동 alert 6-위젯 (UI_DASH_PSI_BOARD)"
    >
      <Box sx={{ p: 2 }}>
        <Grid container spacing={1.5}>
          {WIDGETS.map((w) => (
            <Grid item xs={12} sm={6} md={4} key={w.title}>
              <BoardWidgetTile {...w} />
            </Grid>
          ))}
        </Grid>
      </Box>
    </MockShell>
  );
}
