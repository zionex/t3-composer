import React from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import BarChartIcon from '@mui/icons-material/BarChart';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PieChartIcon from '@mui/icons-material/PieChart';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import SpeedIcon from '@mui/icons-material/Speed';
import TableChartIcon from '@mui/icons-material/TableChart';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import { parseWidgetSpec } from '../../../../generic/widgetSpecAdapter';
import {
  getSpecSourceDisplayName,
  getVisualTypeLabel,
} from '../../../dialogs/WidgetInfoDialog';
import { MODULE_COLORS } from '../../direct/steps/wizardConstants';
import WidgetThumbnail from '../../../../core/WidgetThumbnail';
import { buildTableWidgetSql, formatLabel, getSelectedDimensionItems } from './domainBrowseUtils';

const STEP_LABELS = ['카테고리', '지표/기준', '데이터 후보', '시각화'];

const TABLE_ROLE_LABELS = {
  FACT:    { label: 'FACT',    friendlyLabel: '핵심 데이터',   color: '#1e40af', bg: '#dbeafe' },
  MASTER:  { label: 'MASTER',  friendlyLabel: '보조 데이터',   color: '#166534', bg: '#dcfce7' },
  VIEW:    { label: 'VIEW',    friendlyLabel: '조회용 데이터', color: '#7c3aed', bg: '#ede9fe' },
  MAPPING: { label: 'MAPPING', friendlyLabel: '연결 데이터',   color: '#9a3412', bg: '#ffedd5' },
  CONFIG:  { label: 'CONFIG',  friendlyLabel: '확인 필요',     color: '#374151', bg: '#f3f4f6' },
  LOG:     { label: 'LOG',     friendlyLabel: '확인 필요',     color: '#6b7280', bg: '#f9fafb' },
  CALENDAR:{ label: 'CAL',     friendlyLabel: '기간 데이터',   color: '#0369a1', bg: '#e0f2fe' },
};

const WIDGET_TYPE_ICONS = {
  bar: BarChartIcon, bar_stacked: BarChartIcon, bar_h: BarChartIcon,
  line: ShowChartIcon, area: ShowChartIcon, bar_line: ShowChartIcon,
  pie: PieChartIcon, doughnut: PieChartIcon,
  table: TableChartIcon,
  kpi: SpeedIcon,
};

export function SectionTitle({ title, count }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.25 }}>
      <Typography sx={{ fontSize: 15, fontWeight: 800, color: '#1e293b' }}>
        {title}
      </Typography>
      {count !== undefined && (
        <Chip
          size="small"
          label={count}
          sx={{ height: 22, fontSize: 12, fontWeight: 800, bgcolor: '#eff6ff', color: '#2563eb' }}
        />
      )}
    </Stack>
  );
}

export function CategoryTooltipContent({ label, description }) {
  return (
    <Box sx={{ maxWidth: 420 }}>
      <Typography sx={{ fontSize: 12, fontWeight: 900, lineHeight: 1.35, color: '#fff' }}>
        {label}
      </Typography>
      {description && (
        <>
          <Divider sx={{ my: 0.75, borderColor: 'rgba(255,255,255,0.24)' }} />
          <Typography sx={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.72)', mb: 0.35 }}>
            설명
          </Typography>
          <Typography sx={{ fontSize: 12, lineHeight: 1.55, color: '#fff', whiteSpace: 'normal' }}>
            {description}
          </Typography>
        </>
      )}
    </Box>
  );
}

// ── Step indicator ──────────────────────────────────────────────────────────
export function StepIndicator({ step }) {
  return (
    <Box sx={{ px: 2.5, pt: 1.5, pb: 1, borderBottom: '1px solid #e2e8f0', flexShrink: 0, bgcolor: 'white' }}>
      <Stepper activeStep={step - 1} nonLinear alternativeLabel>
        {STEP_LABELS.map((label) => (
          <Step key={label}>
            <StepLabel
              sx={{
                '& .MuiStepLabel-label': { fontSize: 12, fontWeight: 800, mt: 0.5 },
                '& .MuiStepIcon-root': { fontSize: 22 },
              }}
            >
                {label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
}

// ── Column checkbox item ────────────────────────────────────────────────────
export function ColCheckItem({ col, selected, onToggle, badge, internalKey = false }) {
  const label = col.displayName || col.comment || col.name;
  const subText = col.formula || col.agg || null;
  return (
    <Box
      onClick={() => onToggle(col.name)}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        px: 1.5,
        py: 1,
        cursor: 'pointer',
        border: '1px solid',
        borderColor: selected ? '#93c5fd' : '#e5eaf2',
        borderRadius: '8px',
        bgcolor: selected ? '#eff6ff' : 'white',
        '&:hover': { borderColor: '#93c5fd', bgcolor: selected ? '#eff6ff' : '#f8fafc' },
      }}
    >
      {selected
        ? <CheckBoxIcon sx={{ fontSize: 20, color: 'primary.main', flexShrink: 0 }} />
        : <CheckBoxOutlineBlankIcon sx={{ fontSize: 20, color: '#cbd5e1', flexShrink: 0 }} />
      }
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography sx={{ fontSize: 14, fontWeight: selected ? 800 : 600, color: selected ? '#1e293b' : 'text.primary' }} noWrap>
          {label}
        </Typography>
        {subText && (
          <Typography sx={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }} noWrap>{subText}</Typography>
        )}
      </Box>
      {badge && (
        <Chip size="small" label={badge}
          sx={{ height: 18, fontSize: 10, fontWeight: 800, bgcolor: '#f0fdf4', color: '#15803d', flexShrink: 0 }} />
      )}
      {!badge && !col.isVirtual && col.name !== label && (
        <Typography sx={{ fontSize: 12, color: '#94a3b8', flexShrink: 0 }} noWrap>
          {internalKey ? `내부 기준: ${col.name}` : col.name}
        </Typography>
      )}
    </Box>
  );
}

// ── Candidate table card ────────────────────────────────────────────────────
export function CandidateCard({ candidate, selected, onToggle, isAdmin = false, onOpenSource }) {
  const roleInfo = TABLE_ROLE_LABELS[candidate.table_role] || TABLE_ROLE_LABELS.CONFIG;
  return (
    <Card
      variant="outlined"
      onClick={() => onToggle(candidate.table_name)}
      sx={{
        borderColor: selected ? 'primary.main' : '#e5eaf2',
        borderWidth: selected ? 2 : 1,
        borderRadius: '8px',
        cursor: 'pointer',
        height: '100%',
        bgcolor: selected ? '#f0f7ff' : 'white',
        '&:hover': { borderColor: 'primary.light', bgcolor: selected ? '#f0f7ff' : '#fafeff' },
      }}
    >
      <CardContent sx={{ p: 1.5, pb: '12px !important' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
          <Stack direction="row" alignItems="center" spacing={0.75} sx={{ flex: 1, minWidth: 0 }}>
            {selected
              ? <CheckBoxIcon sx={{ fontSize: 18, color: 'primary.main', flexShrink: 0 }} />
              : <CheckBoxOutlineBlankIcon sx={{ fontSize: 18, color: '#cbd5e1', flexShrink: 0 }} />
            }
            <Chip size="small" label={roleInfo.label}
              sx={{ height: 22, fontSize: 11, fontWeight: 800, bgcolor: roleInfo.bg, color: roleInfo.color }} />
            {candidate.rationale ? (
              <Tooltip title={candidate.rationale} arrow>
                <Chip size="small" label={`${candidate.score}점`}
                  sx={{ height: 22, fontSize: 11, fontWeight: 800, bgcolor: '#f0fdf4', color: '#15803d' }} />
              </Tooltip>
            ) : (
              <Chip size="small" label={`${candidate.score}점`}
                sx={{ height: 22, fontSize: 11, fontWeight: 800, bgcolor: '#f0fdf4', color: '#15803d' }} />
            )}
            {Array.isArray(candidate.joins) && candidate.joins.length > 0 && (
              <Tooltip title={candidate.joins.map((j) => `${j.col || j.col_name} → ${j.ref || `${j.ref_table}.${j.ref_col}`}`).join('\n')} arrow>
                <Chip size="small" label={`JOIN ${candidate.joins.length}`}
                  sx={{ height: 22, fontSize: 11, fontWeight: 800, bgcolor: '#ede9fe', color: '#6d28d9' }} />
              </Tooltip>
            )}
          </Stack>
          {isAdmin && (
            <Tooltip title="데이터 소스 보기" arrow>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenSource?.(candidate);
                }}
                sx={{ width: 26, height: 26, flexShrink: 0, color: '#64748b' }}
              >
                <InfoOutlinedIcon sx={{ fontSize: 17 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        <Tooltip title={candidate.table_name} arrow>
          <Typography sx={{ fontSize: 14, fontWeight: 800, color: '#1e293b' }} noWrap>
            {candidate.table_description || candidate.table_name}
          </Typography>
        </Tooltip>
        {candidate.grain && (
          <Typography sx={{ fontSize: 12, color: '#64748b', mt: 0.5 }} noWrap>
            단위: {candidate.grain}
          </Typography>
        )}
        {candidate.warnings?.length > 0 && (
          <Stack direction="row" alignItems="center" spacing={0.5} mt={0.75}>
            <WarningAmberIcon sx={{ fontSize: 13, color: '#f59e0b' }} />
            <Typography sx={{ fontSize: 12, color: '#b45309' }} noWrap>{candidate.warnings[0]}</Typography>
          </Stack>
        )}
        {candidate.matched_columns?.length > 0 && (
          <Stack direction="row" flexWrap="wrap" gap={0.5} mt={0.75}>
            {candidate.matched_columns.slice(0, 4).map((c) => (
              <Chip key={c.name} size="small" label={c.comment || c.name}
                sx={{ height: 22, fontSize: 11, bgcolor: '#eff6ff', color: '#2563eb' }} />
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

export function CandidateSourceDialog({ candidate, open, onClose }) {
  if (!candidate) return null;

  const roleInfo = TABLE_ROLE_LABELS[candidate.table_role] || TABLE_ROLE_LABELS.CONFIG;
  const widgetSql = buildTableWidgetSql(candidate, candidate.tableConfig);
  const columnGroups = [
    { label: '매칭 컬럼', columns: candidate.matched_columns },
    { label: '필수 컬럼', columns: candidate.required_columns },
    { label: '보조 컬럼', columns: candidate.optional_columns },
    { label: '전체 컬럼', columns: candidate.columns },
  ].filter((group) => Array.isArray(group.columns) && group.columns.length > 0);

  function renderInfo(label, value) {
    if (value === undefined || value === null || value === '') return null;
    return (
      <Stack key={label} direction="row" alignItems="flex-start" spacing={1.5}>
        <Typography sx={{ width: 78, flexShrink: 0, fontSize: 12, fontWeight: 800, color: '#94a3b8' }}>
          {label}
        </Typography>
        <Typography sx={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700, color: '#1e293b', wordBreak: 'break-all' }}>
          {value}
        </Typography>
      </Stack>
    );
  }

  function columnLabel(column) {
    if (typeof column === 'string') return column;
    const name = column?.name || column?.col_name || column?.column_name || '';
    const comment = column?.comment || column?.description || '';
    const rawType = column?.type || column?.col_type || '';
    const type = String(rawType).split(/\s+COLLATE\s+/i)[0].trim();
    const label = comment && name ? `${comment} (${name})` : (comment || name);
    return [label, type].filter(Boolean).join(' / ');
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Typography sx={{ fontSize: 18, fontWeight: 900, color: '#0f172a' }}>
          데이터 소스
        </Typography>
        <Typography sx={{ mt: 0.5, fontSize: 12, color: '#64748b', wordBreak: 'break-all' }}>
          {candidate.table_name}
        </Typography>
      </DialogTitle>
      <DialogContent dividers sx={{ bgcolor: '#fafafa' }}>
        <Stack spacing={2}>
          <Box sx={{ p: 1.5, border: '1px solid #e5eaf2', borderRadius: '8px', bgcolor: 'white' }}>
            <Stack direction="row" spacing={0.75} sx={{ mb: 1.25, flexWrap: 'wrap' }}>
              <Chip size="small" label={roleInfo.label}
                sx={{ height: 22, fontSize: 11, fontWeight: 800, bgcolor: roleInfo.bg, color: roleInfo.color }} />
              {candidate.score !== undefined && (
                <Chip size="small" label={`${candidate.score}점`}
                  sx={{ height: 22, fontSize: 11, fontWeight: 800, bgcolor: '#f0fdf4', color: '#15803d' }} />
              )}
            </Stack>
            <Stack spacing={0.9}>
              {renderInfo('스키마', candidate.schema || candidate.table_schema)}
              {renderInfo('테이블', candidate.table_name)}
              {renderInfo('표시명', candidate.table_description)}
              {renderInfo('단위', candidate.grain)}
              {renderInfo('근거', candidate.rationale)}
            </Stack>
          </Box>

          {Array.isArray(candidate.joins) && candidate.joins.length > 0 && (
            <Box sx={{ p: 1.5, border: '1px solid #e5eaf2', borderRadius: '8px', bgcolor: 'white' }}>
              <Typography sx={{ fontSize: 13, fontWeight: 900, color: '#0f172a', mb: 1 }}>JOIN</Typography>
              <Stack spacing={0.75}>
                {candidate.joins.map((join, index) => (
                  <Typography key={`${join.col || join.col_name || index}-${index}`} sx={{ fontSize: 12, color: '#334155', fontFamily: 'monospace' }}>
                    {join.col || join.col_name} → {join.ref || `${join.ref_table || ''}.${join.ref_col || ''}`}
                  </Typography>
                ))}
              </Stack>
            </Box>
          )}

          {columnGroups.map((group) => (
            <Box key={group.label} sx={{ p: 1.5, border: '1px solid #e5eaf2', borderRadius: '8px', bgcolor: 'white' }}>
              <Typography sx={{ fontSize: 13, fontWeight: 900, color: '#0f172a', mb: 1 }}>
                {group.label} ({group.columns.length})
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={0.5}>
                {group.columns.map((column, index) => (
                  <Chip
                    key={`${typeof column === 'string' ? column : column?.name || column?.col_name || index}-${index}`}
                    size="small"
                    label={columnLabel(column)}
                    sx={{ maxWidth: '100%', height: 24, fontSize: 11, bgcolor: '#eff6ff', color: '#2563eb' }}
                  />
                ))}
              </Stack>
            </Box>
          ))}

          {candidate.warnings?.length > 0 && (
            <Alert severity="warning">
              {candidate.warnings.join(' / ')}
            </Alert>
          )}

          {widgetSql && (
            <Box sx={{ p: 1.5, border: '1px solid #dbeafe', borderRadius: '8px', bgcolor: 'white' }}>
              <Typography sx={{ fontSize: 13, fontWeight: 900, color: '#0f172a', mb: 1 }}>
                위젯 사용 SQL
              </Typography>
              <Box
                component="pre"
                sx={{
                  m: 0,
                  p: 1.25,
                  maxHeight: 220,
                  overflow: 'auto',
                  borderRadius: '6px',
                  bgcolor: '#0f172a',
                  color: '#e2e8f0',
                  fontSize: 11,
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}
              >
                {widgetSql}
              </Box>
            </Box>
          )}

          <Box
            component="details"
            sx={{ p: 1.5, border: '1px solid #e5eaf2', borderRadius: '8px', bgcolor: 'white' }}
          >
            <Typography component="summary" sx={{ cursor: 'pointer', fontSize: 13, fontWeight: 900, color: '#0f172a' }}>
              원본 JSON
            </Typography>
            <Box
              component="pre"
              sx={{ mt: 1, m: 0, maxHeight: 240, overflow: 'auto', fontSize: 11, color: '#334155', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}
            >
              {JSON.stringify(candidate, null, 2)}
            </Box>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>닫기</Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Library widget card ─────────────────────────────────────────────────────
export function LibraryWidgetCard({ widget, onAdd, onInfo }) {
  const spec = parseWidgetSpec(widget.spec_json);
  const visualType = widget.widget_type || spec.visualConfig?.type || spec.widgetType;
  const Icon = WIDGET_TYPE_ICONS[visualType] || BarChartIcon;
  const sourceSummary = getSpecSourceDisplayName(spec);
  const visualLabel = getVisualTypeLabel(visualType) || visualType || 'widget';
  const moduleColor = MODULE_COLORS[widget.module] || '#94a3b8';

  return (
    <Card variant="outlined" sx={{ borderColor: '#e5eaf2', borderRadius: '8px', height: '100%' }}>
      <CardContent sx={{ pb: 1 }}>
        <WidgetThumbnail type={visualType} />
        <Stack direction="row" alignItems="center" spacing={0.75} sx={{ minWidth: 0 }}>
          <Icon sx={{ fontSize: 18, color: moduleColor, flexShrink: 0 }} />
          <Tooltip title={widget.title || ''} arrow>
            <Typography sx={{ fontSize: 13, fontWeight: 800, color: '#1e293b', minWidth: 0 }} noWrap>
              {widget.title}
            </Typography>
          </Tooltip>
        </Stack>
        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.75, flexWrap: 'wrap' }}>
          {visualLabel && (
            <Chip size="small" label={visualLabel} title={visualType}
              sx={{ height: 20, bgcolor: '#eff6ff', color: '#2563eb', fontWeight: 700 }} />
          )}
          {widget.module && (
            <Chip size="small" label={widget.module}
              sx={{ height: 20, bgcolor: MODULE_COLORS[widget.module] || '#f1f5f9', color: MODULE_COLORS[widget.module] ? 'white' : '#475569', fontWeight: 700 }} />
          )}
        </Box>
        {sourceSummary && (
          <Tooltip title={sourceSummary} arrow>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.75 }} noWrap>
              {sourceSummary}
            </Typography>
          </Tooltip>
        )}
        {widget.description && (
          <Tooltip title={widget.description} arrow>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.25 }} noWrap>
              {widget.description}
            </Typography>
          </Tooltip>
        )}
      </CardContent>
      <CardActions sx={{ pt: 0, px: 2, pb: 1.5, justifyContent: 'space-between', gap: 1 }}>
        <Tooltip title="위젯 정보">
          <IconButton size="small" onClick={() => onInfo(widget)}>
            <InfoOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => onAdd(widget)} sx={{ minWidth: 108 }}>
          위젯 추가
        </Button>
      </CardActions>
    </Card>
  );
}

// ── Step 2 right summary panel ──────────────────────────────────────────────
export function Step2SummaryPanel({
  selectedMetrics,
  selectedDimensions,
  allMeasureDisplayItems,
  allDimDisplayItems,
  rawColsOpen,
  onRawColsToggle,
  selectedChartType,
  onSelectChart,
}) {
  const selectedMetricItems = allMeasureDisplayItems.filter((c) => selectedMetrics.has(c.name));

  const uniqueSelectedDims = getSelectedDimensionItems(allDimDisplayItems, selectedDimensions);

  const metricCount = selectedMetrics.size;
  const visualDimCount = uniqueSelectedDims.length;
  const firstMetric = selectedMetricItems[0];
  const firstDim = uniqueSelectedDims[0];

  let recommendedCharts = [];
  if (metricCount > 0 && visualDimCount === 0) {
    recommendedCharts = [{ type: 'kpi', label: 'KPI 카드' }];
  } else if (metricCount > 0 && visualDimCount === 1) {
    recommendedCharts = [{ type: 'bar', label: '막대 차트' }, { type: 'pie', label: '파이/도넛' }];
  } else if (metricCount > 0 && visualDimCount >= 2) {
    recommendedCharts = [
      { type: 'bar',   label: '막대 차트' },
      { type: 'line',  label: '라인 차트' },
      { type: 'table', label: '테이블' },
    ];
  }

  const warnings = [];
  if (metricCount === 0) warnings.push('위젯 생성에는 최소 1개의 지표가 필요합니다.');
  if (visualDimCount >= 4) warnings.push('기준이 많으면 차트가 복잡해질 수 있습니다. 1~3개를 권장합니다.');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
      <Typography sx={{ fontSize: 13, fontWeight: 900, color: '#0f172a' }}>선택 요약</Typography>

      <Box>
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#475569', mb: 0.5 }}>지표</Typography>
        {selectedMetricItems.length === 0 ? (
          <Typography sx={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>선택 없음</Typography>
        ) : (
          <Stack direction="row" flexWrap="wrap" gap={0.5}>
            {selectedMetricItems.map((c) => (
              <Chip key={c.name} size="small"
                label={formatLabel(c)}
                sx={{ height: 22, fontSize: 11, fontWeight: 700, bgcolor: '#eff6ff', color: '#2563eb' }} />
            ))}
          </Stack>
        )}
      </Box>

      <Box>
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#475569', mb: 0.5 }}>기준</Typography>
        {uniqueSelectedDims.length === 0 ? (
          <Typography sx={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>선택 없음</Typography>
        ) : (
          <Stack direction="row" flexWrap="wrap" gap={0.5}>
            {uniqueSelectedDims.map((item) => (
              <Chip key={item.name} size="small"
                label={formatLabel(item)}
                sx={{ height: 22, fontSize: 11, fontWeight: 700, bgcolor: '#f0fdf4', color: '#15803d' }} />
            ))}
          </Stack>
        )}
      </Box>

      {firstMetric && firstDim && (
        <Box sx={{ p: 1.25, border: '1px solid #dbeafe', borderRadius: '8px', bgcolor: '#f0f7ff' }}>
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#64748b', mb: 0.25 }}>예시 위젯</Typography>
          <Typography sx={{ fontSize: 13, fontWeight: 800, color: '#1e293b', lineHeight: 1.4 }}>
            {`"${formatLabel(firstDim)}별 ${formatLabel(firstMetric)}"`}
          </Typography>
        </Box>
      )}

      {recommendedCharts.length > 0 && (
        <Box>
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#475569', mb: 0.75 }}>추천 시각화</Typography>
          <Stack spacing={0.5}>
            {recommendedCharts.map(({ type, label }, i) => {
              const Icon = WIDGET_TYPE_ICONS[type] || BarChartIcon;
              const active = selectedChartType === type;
              const clickable = typeof onSelectChart === 'function';
              return (
                <Stack
                  key={type}
                  direction="row"
                  alignItems="center"
                  spacing={0.75}
                  onClick={clickable ? () => onSelectChart(type) : undefined}
                  sx={{
                    cursor: clickable ? 'pointer' : 'default',
                    px: 0.75,
                    py: 0.5,
                    borderRadius: '6px',
                    border: active ? '1.5px solid #2563eb' : '1px solid transparent',
                    bgcolor: active ? '#eff6ff' : 'transparent',
                    '&:hover': clickable ? { bgcolor: active ? '#eff6ff' : '#f1f5f9' } : undefined,
                  }}
                >
                  <Typography sx={{ fontSize: 11, color: i === 0 ? '#f59e0b' : '#cbd5e1' }}>{i === 0 ? '★' : '☆'}</Typography>
                  <Icon sx={{ fontSize: 15, color: active ? '#2563eb' : '#64748b' }} />
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: active ? '#1d4ed8' : '#334155' }}>{label}</Typography>
                </Stack>
              );
            })}
          </Stack>
        </Box>
      )}

      {warnings.map((w) => (
        <Alert key={w} severity="warning" sx={{ py: 0.5, '& .MuiAlert-message': { fontSize: 12 } }}>{w}</Alert>
      ))}

      <Box>
        <Box onClick={onRawColsToggle} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }}>
          <ChevronRightIcon sx={{
            fontSize: 14, color: '#94a3b8',
            transform: rawColsOpen ? 'rotate(90deg)' : 'none',
            transition: 'transform 0.2s',
          }} />
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>원본 컬럼 보기</Typography>
        </Box>
        {rawColsOpen && (
          <Box sx={{ mt: 0.75, p: 1, bgcolor: 'white', borderRadius: '6px', border: '1px solid #e5eaf2' }}>
            {selectedMetrics.size === 0 && selectedDimensions.size === 0 ? (
              <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>선택된 항목 없음</Typography>
            ) : (
              <>
                {[...selectedMetrics].map((name) => (
                  <Typography key={name} sx={{ fontSize: 11, color: '#2563eb', fontFamily: 'monospace', lineHeight: 1.7 }}>
                    [M] {name}
                  </Typography>
                ))}
                {[...selectedDimensions].map((name) => (
                  <Typography key={name} sx={{ fontSize: 11, color: '#15803d', fontFamily: 'monospace', lineHeight: 1.7 }}>
                    [D] {name}
                  </Typography>
                ))}
              </>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}
