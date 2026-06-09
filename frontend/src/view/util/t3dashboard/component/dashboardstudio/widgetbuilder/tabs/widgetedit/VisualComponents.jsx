import React from 'react';
import {
  Box,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import { FIELD_SX, ColumnSelect, MultiColumnSelect } from './WidgetEditShared';
import dashboardConfig from '../../../core/dashboardConfig';
import {
  isSingleYChartType,
  isMultiYChartType,
} from '../../../dashboardbuilder/dialogs/WidgetSettingsDialog';
import ChartRenderer from '../../../generic/renderers/ChartRenderer';
import KpiRenderer from '../../../generic/renderers/KpiRenderer';
import TableRenderer from '../../../generic/renderers/TableRenderer';

const FORMAT_OPTIONS = [
  { value: '', label: '기본' },
  { value: 'compact', label: 'K/M 단위' },
  { value: 'integer', label: '정수' },
  { value: 'percent', label: '%' },
  { value: 'currency', label: '통화' },
];

function PreviewWidget({ visualConfig, data }) {
  if (!data?.length) return null;
  const type = visualConfig?.type ?? 'kpi';

  if (type === 'kpi') return <KpiRenderer data={data} config={visualConfig} />;
  if (['bar', 'bar_stacked', 'bar_h', 'line', 'area', 'bar_line', 'pie', 'doughnut'].includes(type)) {
    return <ChartRenderer data={data} config={visualConfig} />;
  }
  if (type === 'table') return <TableRenderer data={data} config={visualConfig} />;
  return null;
}

function KpiMapping({ vc, columns, onChange }) {
  return (
    <Stack spacing={1.25}>
      <ColumnSelect label="값 컬럼" value={vc.valueField} columns={columns} onChange={(valueField) => onChange({ ...vc, valueField })} />
      <ColumnSelect label="증감 컬럼" value={vc.deltaField} columns={columns} onChange={(deltaField) => onChange({ ...vc, deltaField })} />
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
        <TextField size="small" label="단위" value={vc.unit ?? ''} onChange={(event) => onChange({ ...vc, unit: event.target.value })} sx={FIELD_SX} />
        <TextField select size="small" label="포맷" value={vc.format ?? ''} onChange={(event) => onChange({ ...vc, format: event.target.value })} sx={FIELD_SX}>
          {FORMAT_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value} sx={{ fontSize: 12 }}>{option.label}</MenuItem>
          ))}
        </TextField>
      </Box>
    </Stack>
  );
}

function BasicSeriesMapping({ vc, columns, valueColumns = columns, onChange }) {
  if (isSingleYChartType(vc.type ?? 'bar')) {
    const selectedYField = (vc.yFields ?? [])[0] ?? '';
    return (
      <Stack spacing={1.25}>
        <ColumnSelect
          label={vc.type === 'bar_h' ? 'Y축 컬럼' : 'X축 컬럼'}
          value={vc.xField}
          columns={columns}
          onChange={(xField) => onChange({ ...vc, xField })}
        />
        <ColumnSelect
          label={vc.type === 'bar_h' ? 'X축 컬럼' : 'Y축 컬럼'}
          value={selectedYField}
          columns={valueColumns}
          onChange={(yField) => onChange({
            ...vc,
            yFields: yField ? [yField] : [],
            labels: yField ? [yField] : [],
          })}
        />
      </Stack>
    );
  }

  return (
    <Stack spacing={1.25}>
      <ColumnSelect label="X축 컬럼" value={vc.xField} columns={columns} onChange={(xField) => onChange({ ...vc, xField })} />
      <MultiColumnSelect
        label="Y축 컬럼"
        value={vc.yFields ?? []}
        columns={valueColumns}
        onChange={(yFields) => {
          const previousLabelsByField = new Map((vc.yFields ?? []).map((field, i) => [field, vc.labels?.[i] ?? field]));
          onChange({ ...vc, yFields, labels: yFields.map((field) => previousLabelsByField.get(field) ?? field) });
        }}
      />
    </Stack>
  );
}

function MixedSeriesMapping({ vc, columns, valueColumns = columns, onChange }) {
  const series = vc.series ?? [];
  return (
    <Stack spacing={1.25}>
      <ColumnSelect label="X축 컬럼" value={vc.xField} columns={columns} onChange={(xField) => onChange({ ...vc, xField })} />
      <MultiColumnSelect
        label="시리즈 컬럼"
        value={series.map((item) => item.field)}
        columns={valueColumns}
        onChange={(fields) => onChange({
          ...vc,
          series: fields.map((field, index) => (
            series.find((item) => item.field === field) ?? { field, label: field, chartType: index === 0 ? 'bar' : 'line' }
          )),
        })}
      />
      {series.map((item) => (
        <Box key={item.field} sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 150px minmax(0, 1fr)', gap: 1, alignItems: 'center' }}>
          <Typography sx={{ fontSize: 12, fontWeight: 800, color: '#475569', wordBreak: 'break-all' }}>{item.field}</Typography>
          <TextField
            select
            size="small"
            label="표현"
            value={item.chartType ?? 'bar'}
            onChange={(event) => onChange({
              ...vc,
              series: series.map((seriesItem) => seriesItem.field === item.field ? { ...seriesItem, chartType: event.target.value } : seriesItem),
            })}
            sx={FIELD_SX}
          >
            <MenuItem value="bar" sx={{ fontSize: 12 }}>막대</MenuItem>
            <MenuItem value="line" sx={{ fontSize: 12 }}>선형</MenuItem>
          </TextField>
          <TextField
            size="small"
            label="표시명"
            value={item.label ?? item.field}
            onChange={(event) => onChange({
              ...vc,
              series: series.map((seriesItem) => seriesItem.field === item.field ? { ...seriesItem, label: event.target.value } : seriesItem),
            })}
            sx={FIELD_SX}
          />
        </Box>
      ))}
    </Stack>
  );
}

function PieMapping({ vc, columns, onChange }) {
  return (
    <Stack spacing={1.25}>
      <ColumnSelect label="라벨 컬럼" value={vc.labelField} columns={columns} onChange={(labelField) => onChange({ ...vc, labelField })} />
      <ColumnSelect label="값 컬럼" value={vc.valueField} columns={columns} onChange={(valueField) => onChange({ ...vc, valueField })} />
    </Stack>
  );
}

function TableMapping({ vc, columns, onChange }) {
  const selected = (vc.columns ?? []).map((item) => item.field ?? item);
  const existingByField = new Map((vc.columns ?? []).map((item) => [item.field ?? item, item]));

  return (
    <Stack spacing={1.25}>
      <MultiColumnSelect
        label="표시 컬럼"
        value={selected}
        columns={columns}
        onChange={(fields) => onChange({
          ...vc,
          columns: fields.map((field) => {
            const prev = existingByField.get(field);
            return typeof prev === 'object'
              ? prev
              : { field, headerText: field, align: dashboardConfig.defaultTableColumnAlign, width: dashboardConfig.defaultTableColumnWidth };
          }),
        })}
      />
      {(vc.columns ?? []).map((column) => {
        const field = column.field ?? column;
        return (
          <Box key={field} sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 120px 120px', gap: 1, alignItems: 'center' }}>
            <TextField
              size="small"
              label={field}
              value={column.headerText ?? field}
              onChange={(event) => onChange({
                ...vc,
                columns: (vc.columns ?? []).map((item) => (item.field ?? item) === field ? { ...item, field, headerText: event.target.value } : item),
              })}
              sx={FIELD_SX}
            />
            <TextField
              select
              size="small"
              label="정렬"
              value={column.align ?? dashboardConfig.defaultTableColumnAlign}
              onChange={(event) => onChange({
                ...vc,
                columns: (vc.columns ?? []).map((item) => (item.field ?? item) === field ? { ...item, field, align: event.target.value } : item),
              })}
              sx={FIELD_SX}
            >
              {['left', 'center', 'right'].map((align) => <MenuItem key={align} value={align} sx={{ fontSize: 12 }}>{align}</MenuItem>)}
            </TextField>
            <TextField
              size="small"
              type="number"
              label="너비"
              value={column.width ?? dashboardConfig.defaultTableColumnWidth}
              onChange={(event) => onChange({
                ...vc,
                columns: (vc.columns ?? []).map((item) => (item.field ?? item) === field ? { ...item, field, width: Number(event.target.value) || dashboardConfig.defaultTableColumnWidth } : item),
              })}
              sx={FIELD_SX}
            />
          </Box>
        );
      })}
    </Stack>
  );
}

function VisualMapping({ vc, columns, valueColumns = columns, onChange }) {
  const type = vc.type ?? 'kpi';

  if (!columns.length) {
    return (
      <Box sx={{ border: '1px dashed #cbd5e1', borderRadius: '8px', p: 1.5, bgcolor: '#f8fafc' }}>
        <Typography sx={{ fontSize: 12, color: '#64748b' }}>
          선택 가능한 컬럼 정보가 없습니다. 실행된 미리보기 데이터나 테이블 컬럼 정보를 확인해 주세요.
        </Typography>
      </Box>
    );
  }

  if (type === 'kpi') return <KpiMapping vc={vc} columns={columns} onChange={onChange} />;
  if (isSingleYChartType(type) || isMultiYChartType(type)) return <BasicSeriesMapping vc={vc} columns={columns} valueColumns={valueColumns} onChange={onChange} />;
  if (type === 'bar_line') return <MixedSeriesMapping vc={vc} columns={columns} valueColumns={valueColumns} onChange={onChange} />;
  if (['pie', 'doughnut'].includes(type)) return <PieMapping vc={vc} columns={columns} onChange={onChange} />;
  if (type === 'table') return <TableMapping vc={vc} columns={columns} onChange={onChange} />;
  return null;
}

export { PreviewWidget, KpiMapping, BasicSeriesMapping, MixedSeriesMapping, PieMapping, TableMapping, VisualMapping };
