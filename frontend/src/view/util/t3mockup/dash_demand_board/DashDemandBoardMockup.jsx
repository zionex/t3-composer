import React from 'react';
import { Box, Grid } from '@mui/material';

import MockShell from '../_shared/MockShell';
import BoardWidgetTile from '../_shared/BoardWidgetTile';

const WIDGETS = [
  { title: '수요 예측 (월 합)',  value: '13,420', unit: 'EA',    trend: 'up',   delta: '+6.8%',   sparkline: [11200,11800,12100,12500,12800,13100,13420], color: '#5281b3' },
  { title: '계획 진행',           value: '92',     unit: '%',     trend: 'up',   delta: '+3pt',    badge: 'IN PROGRESS', badgeColor: 'info', sparkline: [82,85,87,89,90,91,92], color: '#06b6d4' },
  { title: '계획 정확도',         value: '94.2',   unit: '%',     trend: 'up',   delta: '+1.2pt',  sparkline: [91.5,92.0,92.8,93.2,93.6,94.0,94.2], color: '#10b981' },
  { title: '신규 수요 추가',      value: '24',     unit: '건',    trend: 'up',   delta: '+8',      sparkline: [12,14,16,18,20,22,24], color: '#8b5cf6' },
  { title: '계획 변경 횟수',      value: '6',      unit: '회',    trend: 'down', delta: '−2',      isReverseGood: true, sparkline: [10,9,8,7,7,6,6], color: '#f59e0b' },
  { title: '미승인 계획',         value: '3',      unit: '건',    trend: 'down', delta: '−5',      isReverseGood: true, badge: 'PENDING', badgeColor: 'warning', sparkline: [12,10,8,6,4,3,3], color: '#ef4444' },
  { title: '판매 vs 예측 (gap)',  value: '−4.2',   unit: '%',     trend: 'down', delta: '−1.8pt',  isReverseGood: true, sparkline: [-6.5,-6.0,-5.5,-5.0,-4.5,-4.2,-4.2], color: '#fa7d5b' },
  { title: '주요 고객 협업',      value: '18',     unit: '개',    trend: 'up',   delta: '+2',      sparkline: [14,15,16,16,17,18,18], color: '#2a9d8f' },
  { title: '평균 예측 LT',        value: '14',     unit: '주',    trend: null,                     sparkline: [14,14,14,14,14,14,14], color: '#94a3b8' },
];

export default function DashDemandBoardMockup() {
  return (
    <MockShell
      patternCode="dash_demand_board"
      patternLabel="Demand Board — 수요 계획 요약"
      layoutCategory="LAYOUT_DASHBOARD"
      description="계획 진행 + 상태 + KPI 9-위젯 (UI_DASH_DEMAND_PLAN_BOARD)"
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
