import React from 'react';
import { Card, CardContent, Typography, Stack, Box, Chip } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

/**
 * Dashboard 요약 Board (SalesBoard/DemandBoard/SupplyBoard/PsiBoard/InvenBoard) 의 공통 위젯 타일.
 *
 * Props:
 *   title       — 위젯 제목
 *   value       — 메인 수치 (string 또는 number)
 *   unit        — 단위
 *   trend       — 'up' | 'down' | null
 *   delta       — 변동량 라벨 (예: '+2.4pt')
 *   isReverseGood — 'down' 이 좋은 KPI 인지 (결품률 등)
 *   sparkline   — 숫자 배열 (10개 권장) — 미니 라인차트
 *   color       — sparkline 색상
 *   children    — 추가 컨텐츠 (커스텀)
 */
export default function BoardWidgetTile({
  title, value, unit, trend, delta, isReverseGood = false,
  sparkline, color = '#5281b3', badge, badgeColor = 'default',
  children,
}) {
  const isGood = trend ? (isReverseGood ? trend === 'down' : trend === 'up') : null;
  const deltaColor = isGood === null ? 'text.secondary' : (isGood ? 'success.main' : 'error.main');
  const Icon = trend === 'up' ? TrendingUpIcon : trend === 'down' ? TrendingDownIcon : null;

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent sx={{ '&:last-child': { pb: 1.5 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>{title}</Typography>
          {badge && <Chip size="small" label={badge} color={badgeColor} sx={{ height: 18, fontSize: 10, fontWeight: 600 }} />}
        </Stack>

        {value != null && (
          <Stack direction="row" alignItems="baseline" spacing={0.5} sx={{ mt: 0.25 }}>
            <Typography sx={{ fontSize: 26, fontWeight: 700, lineHeight: 1.1 }}>{value}</Typography>
            {unit && <Typography variant="caption" color="text.secondary">{unit}</Typography>}
          </Stack>
        )}

        {(Icon || delta) && (
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.5 }}>
            {Icon && <Icon fontSize="small" sx={{ color: deltaColor, fontSize: 14 }} />}
            {delta && <Typography variant="caption" sx={{ color: deltaColor, fontWeight: 600 }}>{delta}</Typography>}
          </Stack>
        )}

        {sparkline && sparkline.length > 1 && (
          <Box sx={{ mt: 0.75 }}>
            <Sparkline data={sparkline} color={color} />
          </Box>
        )}

        {children}
      </CardContent>
    </Card>
  );
}

function Sparkline({ data, color, width = 200, height = 36 }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const dx = width / (data.length - 1 || 1);
  const points = data.map((v, i) =>
    `${(i * dx).toFixed(1)},${(height - ((v - min) / range) * (height - 8) - 4).toFixed(1)}`
  ).join(' ');
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke={color} strokeWidth={2} />
    </svg>
  );
}
