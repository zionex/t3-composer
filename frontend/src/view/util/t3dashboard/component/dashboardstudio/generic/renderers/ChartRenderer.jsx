import React, { useMemo } from 'react';
import { Box } from '@mui/material';
import ChartComponent from '../../../chart/ChartComponent';

const PALETTE = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
];

const AXIS_OPTIONS = {
  grid: { color: 'rgba(148, 163, 184, 0.18)', drawBorder: false },
  ticks: { color: '#64748b', font: { size: 11 }, maxTicksLimit: 6 },
};

const BASE_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'nearest', intersect: false },
  layout: { padding: { top: 8, right: 12, bottom: 4, left: 4 } },
  plugins: {
    datalabels: false,
    legend: {
      position: 'top',
      align: 'center',
      labels: {
        color: '#64748b',
        usePointStyle: true,
        boxWidth: 8,
        boxHeight: 8,
        padding: 14,
        font: { size: 11, weight: 600 },
      },
    },
    tooltip: {
      backgroundColor: 'rgba(15, 23, 42, 0.92)',
      padding: 10,
      titleFont: { size: 11, weight: 700 },
      bodyFont: { size: 11 },
    },
  },
};

function buildChartJsConfig(data, config) {
  if (!config || !data?.length) return null;
  const { type, labels, stacked } = config;
  const palette = config.palette?.length ? config.palette : PALETTE;
  const fields = new Set(Object.keys(data[0] ?? {}));
  const hasField = (field) => Boolean(field) && fields.has(field);
  const fieldNames = Object.keys(data[0] ?? {});
  const valuesFor = (field) => data.map((row) => row?.[field]).filter((value) => value !== null && value !== undefined && value !== '');
  const isNumericField = (field) => {
    const values = valuesFor(field);
    return values.length > 0 && values.every((value) => !Number.isNaN(Number(value)));
  };
  const isCategoryField = (field) => hasField(field) && !isNumericField(field);
  const firstCategoryField = fieldNames.find(isCategoryField);
  const numericFields = fieldNames.filter(isNumericField);
  const resolveXField = (candidate) => {
    if (isCategoryField(candidate)) return candidate;
    return firstCategoryField || (hasField(candidate) ? candidate : fieldNames[0]);
  };
  const resolveYFields = (candidates, resolvedXField) => {
    const normalized = (candidates ?? [])
      .filter((field) => field !== resolvedXField && isNumericField(field));
    return normalized.length ? normalized : numericFields.filter((field) => field !== resolvedXField).slice(0, 2);
  };

  // ── 파이 / 도넛 ──────────────────────────────────────────────────────────────
  if (type === 'pie' || type === 'doughnut') {
    const resolvedLabelField = isCategoryField(config.labelField) ? config.labelField : firstCategoryField;
    const resolvedValueField = isNumericField(config.valueField)
      ? config.valueField
      : numericFields.find((field) => field !== resolvedLabelField);
    if (!resolvedLabelField || !resolvedValueField) return null;
    const sliceLabels = data.map((r) => r[resolvedLabelField] ?? '');
    const values = data.map((r) => Number(r[resolvedValueField]) || 0);
    return {
      type,
      data: {
        labels: sliceLabels,
        datasets: [{ data: values, backgroundColor: palette.slice(0, values.length) }],
      },
      options: {
        ...BASE_OPTIONS,
        layout: { padding: 8 },
        plugins: {
          ...BASE_OPTIONS.plugins,
          legend: { ...BASE_OPTIONS.plugins.legend, position: 'bottom' },
        },
      },
    };
  }

  // ── 혼합 차트 (bar_line) ──────────────────────────────────────────────────────
  if (type === 'bar_line') {
    const xField = resolveXField(config.xField);
    const configuredSeries = config.series ?? [];
    const seriesFields = configuredSeries.map((s) => s.field);
    const usableFields = resolveYFields(seriesFields, xField);
    const seriesList = usableFields.map((field) => {
      const configured = configuredSeries.find((s) => s.field === field);
      return configured || { field, label: field, chartType: 'bar' };
    });
    if (!hasField(xField) || seriesList.length === 0) return null;
    const xLabels = [...new Set(data.map((r) => r[xField]))];
    return {
      type: 'bar',
      data: {
        labels: xLabels,
        datasets: seriesList.map((s, i) => ({
          type: s.chartType ?? 'bar',
          label: s.label ?? s.field,
          data: xLabels.map((x) =>
            data.filter((r) => r[xField] === x).reduce((sum, r) => sum + (Number(r[s.field]) || 0), 0)
          ),
          backgroundColor: palette[i % palette.length] + (s.chartType === 'line' ? '33' : 'cc'),
          borderColor: palette[i % palette.length],
          borderRadius: s.chartType === 'line' ? 0 : 4,
          maxBarThickness: 36,
          fill: false,
          tension: 0.3,
          borderWidth: 2,
          pointRadius: s.chartType === 'line' ? 2.5 : 0,
          pointHoverRadius: 4,
        })),
      },
      options: {
        ...BASE_OPTIONS,
        scales: {
          x: AXIS_OPTIONS,
          y: AXIS_OPTIONS,
        },
      },
    };
  }

  // ── bar / bar_stacked / bar_h / line / area ──────────────────────────────────
  const xField = resolveXField(config.xField);
  const yFields = resolveYFields(config.yFields, xField);
  if (!hasField(xField) || !yFields.length) return null;
  const xLabels = [...new Set(data.map((r) => r[xField]))];
  const actualType = (type === 'bar' || type === 'bar_stacked' || type === 'bar_h') ? 'bar' : 'line';
  const isStacked = type === 'bar_stacked' || stacked === true;
  const isHorizontal = type === 'bar_h';
  const isFill = type === 'area';

  return {
    type: actualType,
    data: {
      labels: xLabels,
      datasets: (yFields ?? []).map((field, i) => ({
        label: labels?.[i] ?? field,
        data: xLabels.map((x) =>
          data.filter((r) => r[xField] === x).reduce((sum, r) => sum + (Number(r[field]) || 0), 0)
        ),
        backgroundColor: palette[i % palette.length] + (actualType === 'line' && !isFill ? '33' : 'cc'),
        borderColor: palette[i % palette.length],
        borderRadius: actualType === 'bar' ? 4 : 0,
        maxBarThickness: 36,
        fill: isFill,
        tension: (actualType === 'line' || isFill) ? 0.3 : 0,
        borderWidth: 2,
        pointRadius: actualType === 'line' ? 2.5 : 0,
        pointHoverRadius: 4,
      })),
    },
    options: {
      ...BASE_OPTIONS,
      indexAxis: isHorizontal ? 'y' : 'x',
      plugins: {
        ...BASE_OPTIONS.plugins,
        dragData: false,
      },
      scales: {
        x: { ...AXIS_OPTIONS, stacked: isStacked },
        y: { ...AXIS_OPTIONS, stacked: isStacked },
      },
    },
  };
}

function ChartRenderer({ data, config }) {
  const chartConfig = useMemo(() => buildChartJsConfig(data, config), [data, config]);

  if (!chartConfig) {
    return <Box sx={{ height: '100%', width: '100%' }} />;
  }

  return (
    <Box sx={{ height: '100%', width: '100%', minHeight: 0, bgcolor: '#fff', borderRadius: '6px', p: 0.5, overflow: 'hidden' }}>
      <ChartComponent chartConfig={chartConfig} showToolbar={false} />
    </Box>
  );
}

export default ChartRenderer;
