import React from 'react';
import { Box, Grid } from '@mui/material';

import MockShell from '../_shared/MockShell';
import BoardWidgetTile from '../_shared/BoardWidgetTile';

const WIDGETS = [
  { title: '총 재고 (EA)',         value: '11,280', unit: 'EA',    trend: 'down', delta: '−2.5%',   isReverseGood: false, sparkline: [12450,12320,12180,12000,11780,11520,11280], color: '#5281b3' },
  { title: '재고 회전율',          value: '11.3',   unit: 'x',     trend: 'down', delta: '−0.7x',   isReverseGood: false, sparkline: [12.2,12.0,11.8,11.6,11.5,11.4,11.3], color: '#fa7d5b' },
  { title: '회전일수 (DOH)',       value: '28.4',   unit: 'days',  trend: 'down', delta: '−1.6',    isReverseGood: true, sparkline: [32.0,31.0,30.2,29.5,29.0,28.7,28.4], color: '#10b981' },
  { title: '안전재고 미달',         value: '7',      unit: 'SKU',   trend: 'down', delta: '−3',      isReverseGood: true, badge: 'CRIT', badgeColor: 'error', sparkline: [12,11,10,9,8,7,7], color: '#ef4444' },
  { title: 'ABC-A 비중',           value: '68.5',   unit: '%',     trend: 'up',   delta: '+1.2pt',  sparkline: [66.0,66.5,67.2,67.8,68.0,68.3,68.5], color: '#8b5cf6' },
  { title: '결품률',               value: '1.2',    unit: '%',     trend: 'down', delta: '−0.4pt',  isReverseGood: true, sparkline: [1.8,1.7,1.5,1.4,1.3,1.2,1.2], color: '#06b6d4' },
];

export default function DashInvenBoardMockup() {
  return (
    <MockShell
      patternCode="dash_inven_board"
      patternLabel="Inventory Board — 재고 요약"
      layoutCategory="LAYOUT_DASHBOARD"
      description="재고 turnover + ABC/XYZ + 결품 4-6 위젯 (UI_DASH_INVENTORY_BOARD)"
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
