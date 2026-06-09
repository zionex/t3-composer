import React, { useEffect, useRef, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent,
  Box, Button, Typography, Chip, IconButton, Stack,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import BarChartIcon from '@mui/icons-material/BarChart';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SchemaIcon from '@mui/icons-material/Schema';
import StorageIcon from '@mui/icons-material/Storage';
import TuneIcon from '@mui/icons-material/Tune';

import { MODULE_COLORS } from '../tabs/direct/steps/wizardConstants';
import { parseWidgetSpec, toWidgetDataConfig, toWidgetVisualConfig } from '../../generic/widgetSpecAdapter';
import GenericWidget from '../../generic/GenericWidget';
import WidgetEditPanel from '../tabs/widgetedit/WidgetEditPanel';

export const VISUAL_TYPE_LABELS = {
  bar: '막대',
  bar_stacked: '누적 막대',
  bar_h: '가로 막대',
  line: '선형',
  area: '면적',
  bar_line: '복합',
  pie: '파이',
  doughnut: '도넛',
  table: '테이블',
  kpi: 'KPI',
};

const SOURCE_TYPE_LABELS = {
  STORED_PROCEDURE: 'SP',
  PROCEDURE: 'SP',
  SP: 'SP',
  TABLE: 'TABLE',
  VIEW: 'VIEW',
  MERGED: 'MERGED',
};

export function getVisualTypeLabel(type) {
  return VISUAL_TYPE_LABELS[type] ?? type ?? '';
}

function getSelectedMergeSources(spec) {
  const dataSources = spec?.dataSources ?? [];
  const mc = spec?.mergeConfig;
  if (!mc?.enabled || !mc?.type || mc.type === 'SEPARATE') return [];

  const selectedIds = Array.isArray(mc.sourceIds) && mc.sourceIds.length > 0
    ? mc.sourceIds
    : dataSources.map((ds) => ds.id);
  const selectedIdSet = new Set(selectedIds.map(String));
  return dataSources.filter((ds) => selectedIdSet.has(String(ds.id)));
}

export function getSpecSourceDisplayName(spec) {
  const mergeSources = getSelectedMergeSources(spec);
  if (mergeSources.length > 0) {
    return mergeSources.map((ds) => ds.sourceName).filter(Boolean).join(' + ');
  }

  const dataSource = spec?.dataSource ?? {};
  const dataConfig = spec?.dataConfig ?? {};
  const firstSource = (spec?.dataSources ?? [])[0] ?? {};
  return dataSource.name ||
    dataSource.sourceName ||
    dataConfig.procedureName ||
    dataConfig.sourceName ||
    firstSource.sourceName ||
    '';
}

function DetailRow({ label, value }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: '76px minmax(0, 1fr)', gap: 1, alignItems: 'start', minWidth: 0 }}>
      <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', minWidth: 0 }}>{label}</Typography>
      <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#1e293b', wordBreak: 'break-word' }}>{value || '-'}</Typography>
    </Box>
  );
}

function InfoTile({ label, value, tone = '#2563eb' }) {
  return (
    <Box sx={{ minWidth: 0, border: '1px solid #e5eaf2', borderRadius: '8px', bgcolor: '#fff', p: 1.25, borderLeft: `3px solid ${tone}` }}>
      <Typography sx={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', mb: 0.4 }}>{label}</Typography>
      <Typography sx={{ fontSize: 13, fontWeight: 800, color: '#1e293b', wordBreak: 'break-word' }}>{value || '-'}</Typography>
    </Box>
  );
}

function InfoSection({ icon, title, children }) {
  return (
    <Box sx={{ border: '1px solid #e5eaf2', borderRadius: '8px', bgcolor: '#fff', overflow: 'hidden' }}>
      <Stack direction="row" alignItems="center" spacing={0.75}
        sx={{ px: 1.25, py: 0.9, borderBottom: '1px solid #edf2f7', bgcolor: '#f8fafc' }}>
        {icon}
        <Typography sx={{ fontSize: 12, fontWeight: 800, color: '#334155' }}>{title}</Typography>
      </Stack>
      <Box sx={{ p: 1.25, minWidth: 0 }}>{children}</Box>
    </Box>
  );
}

const DETAIL_GRID_SX = {
  display: 'grid',
  gridTemplateColumns: '76px minmax(0, 1fr)',
  gap: 1,
  alignItems: 'start',
  minWidth: 0,
};

function FieldChip({ label }) {
  if (!label) return null;
  return (
    <Chip size="small" label={label}
      sx={{ height: 22, borderRadius: '6px', fontSize: 10, fontWeight: 700, bgcolor: '#f1f5f9', color: '#475569' }} />
  );
}

function MergeTypeChip({ type }) {
  const COLOR = { UNION: '#10b981', LEFT_JOIN: '#3b82f6', INNER_JOIN: '#8b5cf6' };
  const LABEL = { UNION: 'UNION', LEFT_JOIN: 'LEFT JOIN', INNER_JOIN: 'INNER JOIN' };
  const color = COLOR[type] ?? '#64748b';
  return (
    <Chip size="small" label={LABEL[type] ?? type}
      sx={{ height: 20, bgcolor: `${color}22`, color, fontWeight: 800, fontSize: 10 }} />
  );
}

function DataSourceDetails({ spec, sourceType, sourceName, moduleName }) {
  const mc = spec.mergeConfig;
  const mergeSources = getSelectedMergeSources(spec);
  const isMerged = mc?.enabled && mc?.type && mc.type !== 'SEPARATE';

  if (isMerged) {
    const relationships = mc.relationships ?? [];
    return (
      <Stack spacing={0.75}>
        <DetailRow label="유형" value="MERGED" />
        <Box sx={{ ...DETAIL_GRID_SX, alignItems: 'center' }}>
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>병합 방식</Typography>
          <MergeTypeChip type={mc.type} />
        </Box>
        {mergeSources.length > 0 && (
          <Box sx={DETAIL_GRID_SX}>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>소스</Typography>
            <Stack spacing={0.5} sx={{ minWidth: 0 }}>
              {mergeSources.map((ds) => (
                <Box key={ds.id} sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75, minWidth: 0 }}>
                  <Chip size="small"
                    label={SOURCE_TYPE_LABELS[ds.sourceType] ?? ds.sourceType ?? 'SP'}
                    sx={{ height: 18, fontSize: 9, fontWeight: 800, borderRadius: '4px', bgcolor: '#f1f5f9', color: '#475569', flexShrink: 0 }} />
                  <Typography title={ds.sourceName} sx={{ minWidth: 0, fontSize: 11, color: '#334155', fontWeight: 700, overflowWrap: 'anywhere', lineHeight: 1.35 }}>
                    {ds.sourceName}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        )}
        {mc.type !== 'UNION' && relationships.length > 0 && (
          <Box sx={DETAIL_GRID_SX}>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>조인 조건</Typography>
            <Stack spacing={0.4} sx={{ minWidth: 0 }}>
              {relationships.map((rel, i) => {
                const lds = (spec.dataSources ?? []).find((d) => d.id === rel.leftDsId);
                const rds = (spec.dataSources ?? []).find((d) => d.id === rel.rightDsId);
                return (
                  <Typography key={i} sx={{ fontSize: 11, color: '#475569', fontFamily: 'monospace', overflowWrap: 'anywhere' }}>
                    {`${lds?.sourceName ?? rel.leftDsId}.${rel.leftCol} = ${rds?.sourceName ?? rel.rightDsId}.${rel.rightCol}`}
                  </Typography>
                );
              })}
            </Stack>
          </Box>
        )}
        <DetailRow label="모듈" value={moduleName} />
      </Stack>
    );
  }

  const ds = (spec.dataSources ?? [])[0] ?? {};
  const isTable = sourceType === 'TABLE' || ds.sourceType === 'TABLE';
  const tableConfig = ds.tableConfig ?? spec.dataConfig?.tableConfig ?? {};
  const whereConditions = (tableConfig.whereConditions ?? []).filter((c) => c.column);
  const orderBy = tableConfig.orderBy ?? [];

  return (
    <Stack spacing={0.75}>
      <DetailRow label="유형" value={SOURCE_TYPE_LABELS[sourceType] ?? sourceType} />
      <DetailRow label="이름" value={sourceName} />
      <DetailRow label="모듈" value={moduleName} />
      {isTable && whereConditions.length > 0 && (
        <Box sx={DETAIL_GRID_SX}>
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>WHERE</Typography>
          <Stack spacing={0.4} sx={{ minWidth: 0 }}>
            {whereConditions.map((c, i) => (
              <Typography key={i} sx={{ fontSize: 11, color: '#475569', fontFamily: 'monospace', overflowWrap: 'anywhere' }}>
                {`${c.column} ${c.operator ?? '='} '${c.fixedValue ?? c.value}'`}
              </Typography>
            ))}
          </Stack>
        </Box>
      )}
      {isTable && orderBy.length > 0 && (
        <Box sx={DETAIL_GRID_SX}>
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>ORDER BY</Typography>
          <Stack spacing={0.4} sx={{ minWidth: 0 }}>
            {orderBy.map((o, i) => (
              <Typography key={i} sx={{ fontSize: 11, color: '#475569', fontFamily: 'monospace', overflowWrap: 'anywhere' }}>
                {`${o.column} ${o.direction ?? 'ASC'}`}
              </Typography>
            ))}
          </Stack>
        </Box>
      )}
    </Stack>
  );
}

function formatDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

function visualFields(visualConfig) {
  return [
    visualConfig.xField && `X: ${visualConfig.xField}`,
    visualConfig.yFields?.length && `Y: ${visualConfig.yFields.join(', ')}`,
    visualConfig.series?.length && `Series: ${visualConfig.series.join(', ')}`,
    visualConfig.labelField && `Label: ${visualConfig.labelField}`,
    visualConfig.valueField && `Value: ${visualConfig.valueField}`,
    visualConfig.columns?.length && `Columns: ${visualConfig.columns.length}`,
  ].filter(Boolean);
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function WidgetInfoDialog({
  widget,
  onClose,
  onSaveEdit,
  onSelect,
  isDraft,
  onSaveToLibrary,
  savingLibrary,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const editPanelRef = useRef(null);

  useEffect(() => {
    if (widget?.id) setIsEditing(false);
  }, [widget?.id]);

  if (!widget) return null;

  const spec = parseWidgetSpec(widget?.spec_json);
  const dataSource = spec.dataSource || {};
  const dataConfig = spec.dataConfig || {};
  const visualConfig = toWidgetVisualConfig(spec, widget?.widget_type);
  const dataRuntimeConfig = toWidgetDataConfig(spec);
  const paramBindings = Array.isArray(spec.paramBindings)
    ? spec.paramBindings
    : Object.entries(dataConfig.params ?? {}).map(([key, value]) => ({ key, value }));
  const sourceType = dataConfig.sourceType || dataSource.type || dataRuntimeConfig.sourceType;
  const sourceName = getSpecSourceDisplayName(spec) || dataRuntimeConfig.procedureName || dataRuntimeConfig.sourceName;
  const mergeSources = getSelectedMergeSources(spec);
  const moduleName = widget?.module ||
    dataSource.module ||
    [...new Set(mergeSources.map((ds) => ds.module).filter(Boolean))].join(', ');
  const visualType = visualConfig.type || widget?.widget_type || spec.widgetType;
  const typeLabel = getVisualTypeLabel(visualType);
  const fieldBadges = visualFields(visualConfig);

  const handleInternalSave = async (payload) => {
    setSaving(true);
    try {
      await onSaveEdit?.(payload);
      onClose();
    } catch (_) {
      // keep dialog open on error
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={!!widget}
      onClose={isEditing ? undefined : onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { height: '88vh', maxHeight: '900px' } }}
    >
      {/* ── DialogTitle ──────────────────────────────────────────────────── */}
      <DialogTitle sx={{ py: 1.25, px: 2, borderBottom: isEditing ? '1px solid #fed7aa' : undefined, bgcolor: isEditing ? '#fff7ed' : undefined }}>
        {isEditing ? (
          /* edit mode header */
          <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
            <Stack direction="row" spacing={1} alignItems="center">
              <EditIcon sx={{ fontSize: 16, color: '#ea580c' }} />
              <Typography sx={{ fontSize: 15, fontWeight: 800, color: '#ea580c' }}>편집</Typography>
              <Typography sx={{ fontSize: 13, color: '#9a3412' }}>— {widget?.title}</Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Button size="small" variant="outlined" onClick={() => setIsEditing(false)}
                sx={{ fontSize: 11, height: 28, borderColor: '#fdba74', color: '#ea580c', '&:hover': { borderColor: '#ea580c' } }}>
                취소
              </Button>
              <Button size="small" variant="contained" disableElevation
                disabled={saving}
                onClick={() => editPanelRef.current?.handleSave()}
                sx={{ fontSize: 11, height: 28, bgcolor: '#ea580c', '&:hover': { bgcolor: '#c2410c' } }}>
                {saving ? '저장 중...' : '위젯 업데이트'}
              </Button>
              <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
            </Stack>
          </Stack>
        ) : (
          /* info mode header */
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: 18, fontWeight: 800, color: '#111827' }} noWrap>
                {widget?.title || spec.widgetTitle || '위젯 정보'}
              </Typography>
              <Stack direction="row" spacing={0.5} sx={{ mt: 0.75, flexWrap: 'wrap', rowGap: 0.5 }}>
                <Chip size="small" label={typeLabel || '-'} title={visualType || ''}
                  sx={{ height: 24, bgcolor: '#eff6ff', color: '#2563eb', fontWeight: 800 }} />
                {moduleName && (
                  <Chip size="small" label={moduleName}
                    sx={{ height: 24, bgcolor: MODULE_COLORS[moduleName] || '#f1f5f9', color: MODULE_COLORS[moduleName] ? 'white' : '#475569', fontWeight: 800 }} />
                )}
              </Stack>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center', flexShrink: 0, ml: 1 }}>
              {onSaveEdit && (
                <Button size="small" variant="outlined"
                  startIcon={<EditIcon sx={{ fontSize: 14 }} />}
                  onClick={() => setIsEditing(true)}
                  sx={{ fontSize: 11, height: 28, minWidth: 0, px: 1.25 }}>
                  편집
                </Button>
              )}
              {isDraft && onSaveToLibrary && (
                <Button size="small" variant="contained" disableElevation
                  startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                  disabled={savingLibrary}
                  onClick={() => onSaveToLibrary(widget)}
                  sx={{ fontSize: 11, height: 28, minWidth: 0, px: 1.25 }}>
                  {savingLibrary ? '저장 중...' : '저장'}
                </Button>
              )}
              {!isDraft && onSelect && (
                <Button size="small" variant="contained" disableElevation
                  startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                  onClick={() => onSelect(widget)}
                  sx={{ fontSize: 11, height: 28, minWidth: 0, px: 1.25 }}>
                  대시보드에 추가
                </Button>
              )}
              <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
            </Box>
          </Box>
        )}
      </DialogTitle>

      {/* ── DialogContent ────────────────────────────────────────────────── */}
      <DialogContent dividers sx={{ p: 0, bgcolor: '#f8fafc', overflow: 'auto' }}>
        {isEditing ? (
          <WidgetEditPanel
            ref={editPanelRef}
            widget={widget}
            onSave={handleInternalSave}
            saving={saving}
            hideHeader
          />
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.35fr) 340px' }, minHeight: '100%' }}>
            {/* 왼쪽: 미리보기 + 필드 구성 */}
            <Box sx={{ p: 2, minWidth: 0 }}>
              <InfoSection icon={<BarChartIcon sx={{ width: 16, height: 16, color: '#2563eb' }} />} title="미리보기">
                <Box sx={{ height: 300, border: '1px solid #e5eaf2', borderRadius: '8px', bgcolor: '#fbfcfe', p: 1.25, overflow: 'hidden' }}>
                  <GenericWidget dataConfig={dataRuntimeConfig} visualConfig={visualConfig} />
                </Box>
              </InfoSection>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 1, mt: 1.25 }}>
                <InfoTile label="Source" value={sourceName} tone="#10b981" />
                <InfoTile label="Visual" value={typeLabel} tone="#2563eb" />
                <InfoTile label="Module" value={moduleName} tone={MODULE_COLORS[moduleName] || '#64748b'} />
              </Box>

              <Box sx={{ mt: 1.25 }}>
                <InfoSection icon={<SchemaIcon sx={{ width: 16, height: 16, color: '#7c3aed' }} />} title="필드 구성">
                  {fieldBadges.length ? (
                    <Stack direction="row" gap={0.75} flexWrap="wrap">
                      {fieldBadges.map((field) => <FieldChip key={field} label={field} />)}
                    </Stack>
                  ) : (
                    <Box sx={{ height: 24 }} />
                  )}
                </InfoSection>
              </Box>
            </Box>

            {/* 오른쪽: 데이터 소스 + 파라미터 + 기본 정보 */}
            <Box sx={{ p: 2, borderLeft: { md: '1px solid #e2e8f0' }, bgcolor: '#fff' }}>
              <Stack spacing={1.25}>
                <InfoSection icon={<StorageIcon sx={{ width: 16, height: 16, color: '#059669' }} />} title="데이터 소스">
                  <DataSourceDetails
                    spec={spec}
                    sourceType={sourceType}
                    sourceName={sourceName}
                    moduleName={moduleName}
                  />
                </InfoSection>

                <InfoSection icon={<TuneIcon sx={{ width: 16, height: 16, color: '#475569' }} />} title="파라미터">
                  {paramBindings.length ? (
                    <Stack direction="row" gap={0.75} flexWrap="wrap">
                      {paramBindings.map((param, index) => {
                        const name = param.key || param.paramName || param.name || `param-${index + 1}`;
                        const value = param.value ?? param.testValue ?? param.defaultValue;
                        return <FieldChip key={`${name}-${index}`} label={value ? `${name}: ${value}` : name} />;
                      })}
                    </Stack>
                  ) : (
                    <Box sx={{ height: 24 }} />
                  )}
                </InfoSection>

                <InfoSection icon={<InfoOutlinedIcon sx={{ width: 16, height: 16, color: '#64748b' }} />} title="기본 정보">
                  <Stack spacing={0.75}>
                    <DetailRow label="설명" value={widget?.description} />
                    <DetailRow label="생성자" value={widget?.created_by} />
                    <DetailRow label="생성일" value={formatDateTime(widget?.create_dttm)} />
                  </Stack>
                </InfoSection>
              </Stack>
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
