import React from 'react';
import { Box, Grid } from '@mui/material';

import MockShell from '../_shared/MockShell';
import BoardWidgetTile from '../_shared/BoardWidgetTile';

const WIDGETS = [
  { title: '공급 충족율',         value: '96.4',   unit: '%',     trend: 'up',   delta: '+1.4pt',  sparkline: [93.0,93.8,94.5,95.2,95.7,96.1,96.4], color: '#5281b3' },
  { title: '확정 PO',             value: '142',    unit: '건',    trend: 'up',   delta: '+12',     sparkline: [115,120,124,128,132,138,142], color: '#2a9d8f' },
  { title: '발주 대기',           value: '8',      unit: '건',    trend: 'down', delta: '−4',      isReverseGood: true, badge: 'PENDING', badgeColor: 'warning', sparkline: [18,16,14,12,10,9,8], color: '#f59e0b' },
  { title: '자원 가용 (Capa %)',  value: '87.2',   unit: '%',     trend: 'up',   delta: '+2.5pt',  sparkline: [82.0,83.5,84.2,85.0,85.8,86.5,87.2], color: '#10b981' },
  { title: '공급 리스크',         value: '3',      unit: 'SKU',   trend: 'up',   delta: '+1',      badge: 'CRIT', badgeColor: 'error', sparkline: [1,1,2,2,2,3,3], color: '#ef4444' },
  { title: 'PO 평균 LT',          value: '14.2',   unit: 'days',  trend: 'up',   delta: '+0.2',    isReverseGood: true, sparkline: [13.8,13.9,14.0,14.0,14.1,14.2,14.2], color: '#fa7d5b' },
];

export default function DashSupplyBoardMockup() {
  return (
    <MockShell
      patternCode="dash_supply_board"
      patternLabel="Supply Board — 공급 요약"
      layoutCategory="LAYOUT_DASHBOARD"
      description="공급 충족율 + 자원 가용성 + 리스크 6-위젯 (UI_DASH_SUPPLY_BOARD)"
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
