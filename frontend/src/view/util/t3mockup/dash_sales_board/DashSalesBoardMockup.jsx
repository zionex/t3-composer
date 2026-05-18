import React from 'react';
import { Box, Grid } from '@mui/material';

import MockShell from '../_shared/MockShell';
import BoardWidgetTile from '../_shared/BoardWidgetTile';

const WIDGETS = [
  { title: '월 매출 (백만)',    value: '9,807',  unit: '₩',     trend: 'up',   delta: '+3.2%',  sparkline: [820,840,855,870,910,945,980,1010,1040,1075,1100,1130], color: '#5281b3' },
  { title: '주간 출하량',        value: '12,500', unit: 'EA',    trend: 'up',   delta: '+4.5%',  sparkline: [11200,11400,11800,12000,12150,12300,12500],                color: '#2a9d8f' },
  { title: '판매 정확도 (MAPE)', value: '8.7',    unit: '%',     trend: 'down', delta: '−1.3pt', isReverseGood: true, sparkline: [10.5,10.2,9.8,9.4,9.1,8.9,8.7], color: '#10b981' },
  { title: '신규 SO',            value: '142',    unit: '건',    trend: 'up',   delta: '+18',     sparkline: [98,110,118,122,128,135,142], color: '#8b5cf6' },
  { title: '판매 경보 (CRIT)',   value: '7',      unit: '건',    trend: 'down', delta: '−3',      isReverseGood: true, badge: 'WARN', badgeColor: 'warning', sparkline: [12,11,10,9,8,8,7], color: '#ef4444' },
  { title: '평균 단가 (₩)',       value: '64,800', unit: '₩',     trend: 'up',   delta: '+2.1%',   sparkline: [62100,62800,63500,63900,64200,64500,64800], color: '#f59e0b' },
  { title: '계획 진척',           value: '78',     unit: '%',     trend: 'up',   delta: '+5pt',    sparkline: [68,71,73,75,76,77,78], color: '#06b6d4' },
  { title: '주요 고객 OTD',       value: '96.4',   unit: '%',     trend: 'up',   delta: '+1.4pt',  sparkline: [93.5,94.0,94.8,95.2,95.6,96.0,96.4], color: '#5281b3' },
  { title: '잔여 SO (Backlog)',  value: '38',     unit: '건',    trend: 'down', delta: '−7',      isReverseGood: true, sparkline: [50,48,46,44,42,40,38], color: '#94a3b8' },
];

export default function DashSalesBoardMockup() {
  return (
    <MockShell
      patternCode="dash_sales_board"
      patternLabel="Sales Board — 판매 요약"
      layoutCategory="LAYOUT_DASHBOARD"
      description="판매 경보 + 정확도 + 진척 9-위젯 (UI_DASH_SALES_BOARD)"
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
