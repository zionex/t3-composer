import React from 'react';
import { Box, Typography, Stack, Chip, Card } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import MoreVertIcon from '@mui/icons-material/MoreVert';

/**
 * DashboardPanel + widget grid 시각화 helper.
 *
 * 원본 wingui `DashboardPanel` 의 widgets[] (data-grid {w,h,x,y}) 를 12-col CSS grid 로 옮긴다.
 *
 * widgets[i] 형태:
 *   { key, title, widgetId, dataGrid: {w,h,x,y}, showTitleBar?, render?: () => ReactNode }
 *
 * render 가 없으면 widgetId 만 표시한 placeholder 카드.
 *
 * Props:
 *   rowHeight    — 절대 row 픽셀 (기본 28). fitToParent=true 일 때는 minRowHeight 로 사용.
 *   gap          — row/col gap 픽셀 (기본 8).
 *   fitToParent  — true 면 부모 컨테이너 height 100% 채움. 모든 row 가 균등 비율(1fr) 로 분할.
 *                  viewport 가 minRowHeight 미만이면 scroll 발생.
 */
export default function DashboardPanelMock({ widgets, rowHeight = 28, gap = 8, fitToParent = false }) {
  const maxY = widgets.reduce((m, w) => Math.max(m, w.dataGrid.y + w.dataGrid.h), 0);

  const baseSx = {
    position: 'relative',
    display: 'grid',
    gridTemplateColumns: 'repeat(12, 1fr)',
    gap: `${gap}px`,
    p: 1.5,
    bgcolor: '#f4f6f9',
  };

  const fitSx = fitToParent
    ? {
        height: '100%',
        // ★ minHeight 미지정 — 부모 viewport 에 100% fit. row 비율로 분할.
        gridTemplateRows: `repeat(${maxY}, minmax(0, 1fr))`,
      }
    : {
        gridAutoRows: `${rowHeight}px`,
        minHeight: maxY * (rowHeight + gap),
      };

  return (
    <Box sx={{ ...baseSx, ...fitSx }}>
      {widgets.map((w) => (
        <DashboardWidget key={w.key} widget={w} />
      ))}
    </Box>
  );
}

function DashboardWidget({ widget }) {
  const { title, widgetId, dataGrid, showTitleBar = true, render, headerRight } = widget;
  // 12-col grid 에 x/y/w/h 매핑. h 는 row 갯수, w 는 col 갯수.
  const colStart = Math.floor(dataGrid.x) + 1;
  const colSpan = Math.max(1, Math.round(dataGrid.w));
  const rowStart = Math.floor(dataGrid.y) + 1;
  const rowSpan = Math.max(1, Math.round(dataGrid.h));

  return (
    <Card
      variant="outlined"
      sx={{
        gridColumn: `${colStart} / span ${colSpan}`,
        gridRow: `${rowStart} / span ${rowSpan}`,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#ffffff',
        overflow: 'hidden',
      }}
    >
      {showTitleBar && (
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{
            px: 1.25,
            py: 0.75,
            borderBottom: '1px solid #e3e8ef',
            bgcolor: '#fafbfc',
            flexShrink: 0,
          }}
        >
          <Typography sx={{ fontSize: 12.5, fontWeight: 600, flex: 1, color: '#1f2937' }} noWrap>
            {title}
          </Typography>
          {headerRight}
          <Chip
            label={widgetId}
            size="small"
            sx={{
              height: 16,
              fontSize: 9,
              fontFamily: 'monospace',
              bgcolor: '#eef2f7',
              color: '#475569',
            }}
          />
          <OpenInNewIcon sx={{ fontSize: 13, color: '#94a3b8' }} />
          <MoreVertIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
        </Stack>
      )}
      <Box sx={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>
        {render ? render() : <WidgetPlaceholder widgetId={widgetId} title={title} />}
      </Box>
    </Card>
  );
}

function WidgetPlaceholder({ widgetId, title }) {
  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      spacing={0.5}
      sx={{ height: '100%', color: 'text.secondary', p: 1 }}
    >
      <Typography sx={{ fontSize: 11, fontWeight: 500, opacity: 0.6 }}>{title}</Typography>
      <Typography sx={{ fontSize: 10, fontFamily: 'monospace', opacity: 0.4 }}>{widgetId}</Typography>
    </Stack>
  );
}

// ─────────────────────────────────────────────────────────────────
// Mini chart / KPI / list primitives — widget 내부 컨텐츠에 재사용
// ─────────────────────────────────────────────────────────────────

export function MiniLine({ data, color = '#5281b3', height = '100%', fill = false }) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 100;
  const h = 100;
  const dx = w / (data.length - 1 || 1);
  const points = data.map((v, i) =>
    `${(i * dx).toFixed(2)},${(h - ((v - min) / range) * (h - 10) - 5).toFixed(2)}`
  ).join(' ');
  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      style={{ display: 'block' }}
    >
      {fill && (
        <polygon
          points={`0,${h} ${points} ${w},${h}`}
          fill={color}
          fillOpacity={0.18}
        />
      )}
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} />
    </svg>
  );
}

export function MiniBar({ data, colors, height = '100%' }) {
  const max = Math.max(...data, 1);
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', height, gap: 0.5, px: 0.5, pb: 0.5 }}>
      {data.map((v, i) => {
        const colorList = Array.isArray(colors) ? colors : null;
        const color = colorList ? colorList[i % colorList.length] : (colors || '#5281b3');
        return (
          <Box
            key={i}
            sx={{
              flex: 1,
              height: `${(v / max) * 100}%`,
              bgcolor: color,
              borderRadius: '2px 2px 0 0',
              minHeight: 2,
            }}
          />
        );
      })}
    </Box>
  );
}

export function MiniStackedBar({ datasets, labels, height = '100%' }) {
  // datasets: [{ label, data: number[], color }]
  const totals = labels.map((_, i) => datasets.reduce((s, d) => s + (d.data[i] || 0), 0));
  const max = Math.max(...totals, 1);
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', height, gap: 0.5, px: 0.5, pb: 0.5 }}>
      {labels.map((lbl, i) => (
        <Stack key={i} flex={1} sx={{ height: '100%', justifyContent: 'flex-end', gap: 0 }}>
          {datasets.map((d) => (
            <Box
              key={d.label}
              sx={{
                height: `${((d.data[i] || 0) / max) * 100}%`,
                bgcolor: d.color,
                minHeight: d.data[i] > 0 ? 1 : 0,
              }}
            />
          ))}
        </Stack>
      ))}
    </Box>
  );
}

export function MiniPie({ data, size = 80 }) {
  // data: [{ label, value, color }]
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let cumulative = 0;
  const r = size / 2 - 4;
  const cx = size / 2;
  const cy = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {data.map((d, i) => {
        const startAngle = (cumulative / total) * Math.PI * 2 - Math.PI / 2;
        cumulative += d.value;
        const endAngle = (cumulative / total) * Math.PI * 2 - Math.PI / 2;
        const x1 = cx + r * Math.cos(startAngle);
        const y1 = cy + r * Math.sin(startAngle);
        const x2 = cx + r * Math.cos(endAngle);
        const y2 = cy + r * Math.sin(endAngle);
        const largeArc = (d.value / total) > 0.5 ? 1 : 0;
        return (
          <path
            key={i}
            d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`}
            fill={d.color}
            stroke="#fff"
            strokeWidth={1}
          />
        );
      })}
    </svg>
  );
}

export function MiniGrid({ columns, rows, fontSize = 11, minRowPx = 26 }) {
  const justifyOf = (align) =>
    align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start';

  return (
    <Box sx={{ height: '100%', overflow: 'auto', display: 'flex' }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: columns.map((c) => c.width || '1fr').join(' '),
          gridTemplateRows: rows.length
            ? `auto repeat(${rows.length}, minmax(${minRowPx}px, 1fr))`
            : 'auto',
          width: '100%',
          minHeight: '100%',
          fontSize,
          minWidth: '100%',
        }}
      >
        {/* Header */}
        {columns.map((c) => (
          <Box
            key={c.field}
            sx={{
              px: 0.75,
              py: 0.5,
              bgcolor: '#eef2f7',
              borderBottom: '1px solid #d1d5db',
              fontWeight: 600,
              fontSize: fontSize - 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: justifyOf(c.align),
              position: 'sticky',
              top: 0,
              zIndex: 1,
            }}
          >
            {c.header}
          </Box>
        ))}
        {/* Rows */}
        {rows.map((row, ri) =>
          columns.map((c) => (
            <Box
              key={`${ri}-${c.field}`}
              sx={{
                px: 0.75,
                py: 0.4,
                borderBottom: '1px solid #f1f5f9',
                bgcolor: ri % 2 === 0 ? '#ffffff' : '#fafbfc',
                fontFamily: c.mono ? 'monospace' : 'inherit',
                color: c.color || '#1f2937',
                display: 'flex',
                alignItems: 'center',
                justifyContent: justifyOf(c.align),
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {c.format ? c.format(row[c.field], row) : row[c.field]}
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
}

export function KpiBig({ label, value, unit, sub, trend, color = '#2563eb' }) {
  const trendColor = trend?.up === true ? '#10b981' : trend?.up === false ? '#ef4444' : '#94a3b8';
  return (
    <Stack alignItems="center" justifyContent="center" sx={{ height: '100%', p: 1 }} spacing={0.25}>
      <Typography sx={{ fontSize: 11, color: 'text.secondary', textAlign: 'center' }}>{label}</Typography>
      <Stack direction="row" alignItems="baseline" spacing={0.5}>
        <Typography sx={{ fontSize: 24, fontWeight: 700, lineHeight: 1, color }}>{value}</Typography>
        {unit && <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{unit}</Typography>}
      </Stack>
      {sub && (
        <Typography sx={{ fontSize: 10, color: trendColor, fontWeight: 600 }}>
          {sub}
        </Typography>
      )}
    </Stack>
  );
}

export function LegendChips({ items }) {
  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ px: 1, pt: 0.5 }}>
      {items.map((it) => (
        <Stack key={it.label} direction="row" alignItems="center" spacing={0.5}>
          <Box sx={{ width: 8, height: 8, bgcolor: it.color, borderRadius: '2px' }} />
          <Typography sx={{ fontSize: 10, color: '#475569' }}>{it.label}</Typography>
        </Stack>
      ))}
    </Stack>
  );
}
