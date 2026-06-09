import React from 'react';
import { Box, Chip, Stack, Typography } from '@mui/material';
import { getVisualTargets, getVisualTargetTitle, MERGED_DATA_SOURCE_ID } from './wizardConstants';
import KpiRenderer from '../../../../generic/renderers/KpiRenderer';
import ChartRenderer from '../../../../generic/renderers/ChartRenderer';
import TableRenderer from '../../../../generic/renderers/TableRenderer';

const CHART_LABEL = {
  kpi: 'KPI',
  bar: '막대',
  bar_stacked: '누적 막대',
  bar_h: '가로 막대',
  line: '선형',
  area: '면적',
  bar_line: '복합',
  pie: '파이',
  doughnut: '도넛',
  table: '테이블',
};

const SOURCE_TYPE_LABEL = {
  VIEW: 'VIEW',
  TABLE: 'TABLE',
  SQL: 'SQL',
};

const MERGE_TYPE_LABEL = {
  LEFT_JOIN: 'LEFT JOIN',
  INNER_JOIN: 'INNER JOIN',
  UNION: 'UNION',
  SEPARATE: '개별 표시',
};

function displayField(field) {
  if (field == null) return '';
  if (typeof field === 'string' || typeof field === 'number') return String(field);
  if (typeof field === 'object') {
    return String(field.headerText || field.label || field.name || field.field || '');
  }
  return String(field);
}

function vcFields(vc) {
  if (!vc?.type) return [];
  if (vc.type === 'kpi') return [vc.valueField].map(displayField).filter(Boolean);
  if (['bar', 'bar_stacked', 'bar_h', 'line', 'area'].includes(vc.type)) {
    return [vc.xField, ...(vc.yFields ?? [])].map(displayField).filter(Boolean);
  }
  if (vc.type === 'bar_line') {
    return [vc.xField, ...(vc.series ?? []).map((s) => s.field)].map(displayField).filter(Boolean);
  }
  if (['pie', 'doughnut'].includes(vc.type)) {
    return [vc.labelField, vc.valueField].map(displayField).filter(Boolean);
  }
  if (vc.type === 'table') return (vc.columns ?? []).map(displayField).filter(Boolean);
  return [];
}

function vcSummary(vc) {
  const fields = vcFields(vc);
  if (!vc?.type) return '시각화 미설정';
  if (!fields.length) return '컬럼 미설정';
  return fields.join(' / ');
}

function sourceIdsForMapping(mapping) {
  if (Array.isArray(mapping?.sources) && mapping.sources.length > 0) return mapping.sources.map(String);
  if (Array.isArray(mapping?.sourceIds) && mapping.sourceIds.length > 0) return mapping.sourceIds.map(String);
  if (Array.isArray(mapping?.dataSourceIds) && mapping.dataSourceIds.length > 0) return mapping.dataSourceIds.map(String);
  if (mapping?.dataSourceId) return [String(mapping.dataSourceId)];
  return [];
}

function mappingAppliesToSource(mapping, sourceId) {
  const mappingSourceIds = sourceIdsForMapping(mapping);
  return mappingSourceIds.length > 0 && mappingSourceIds.includes(String(sourceId));
}

function paramValue(mapping) {
  const value = mapping?.testValue ?? mapping?.value ?? mapping?.defaultValue;
  if (value === undefined || value === null || String(value).trim() === '') return '미입력';
  return String(value);
}

function relationshipText(rel, sourceNameById) {
  const leftName = sourceNameById[rel.leftDsId] ?? '왼쪽 소스';
  const rightName = sourceNameById[rel.rightDsId] ?? '오른쪽 소스';
  return `${leftName}.${rel.leftCol || '-'} = ${rightName}.${rel.rightCol || '-'}`;
}

function whereText(condition) {
  const column = condition.column || condition.paramName || '-';
  const operator = condition.operator ?? '=';
  let value = '';

  if (condition.mappingType === 'FIXED_VALUE') {
    value = condition.fixedValue ?? condition.value ?? '';
  } else if (condition.mappingType && condition.mappingType !== 'UNUSED') {
    value = condition.paramName || condition.fixedValue || '';
  }

  return `${column} ${operator} ${value || '(값 미설정)'}`;
}

function orderText(order) {
  return `${order.column || '-'} ${order.direction || 'ASC'}`;
}

function InfoCard({ title, primary, secondary }) {
  return (
    <Box sx={{ border: '1px solid #e5eaf2', borderRadius: '8px', p: 1.25, bgcolor: '#fafbfc', minWidth: 0 }}>
      <Typography sx={{ mb: 0.75, fontSize: 11, fontWeight: 800, color: '#64748b' }}>
        {title}
      </Typography>
      <Typography sx={{ fontSize: 12, fontWeight: 800, color: '#1e293b' }} noWrap title={primary}>
        {primary || '-'}
      </Typography>
      {secondary && (
        <Typography sx={{ mt: 0.5, fontSize: 11, color: '#64748b' }} noWrap title={secondary}>
          {secondary}
        </Typography>
      )}
    </Box>
  );
}

function ChipList({ items, emptyText = '설정된 값이 없습니다.' }) {
  const values = items.filter(Boolean);
  if (!values.length) {
    return <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>{emptyText}</Typography>;
  }
  return (
    <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
      {values.map((item, index) => (
        <Chip
          key={`${item}-${index}`}
          size="small"
          label={item}
          sx={{ height: 22, fontSize: 10, fontWeight: 700, bgcolor: '#f1f5f9', color: '#475569' }}
        />
      ))}
    </Stack>
  );
}

function SectionCard({ title, children }) {
  return (
    <Box sx={{ mt: 1, border: '1px solid #e5eaf2', borderRadius: '8px', overflow: 'hidden', bgcolor: '#fff' }}>
      <Box sx={{ px: 1, py: 0.75, borderBottom: '1px solid #edf2f7', bgcolor: '#f8fafc' }}>
        <Typography sx={{ fontSize: 12, fontWeight: 800, color: '#334155' }}>{title}</Typography>
      </Box>
      <Box sx={{ p: 1 }}>{children}</Box>
    </Box>
  );
}

function PreviewWidget({ visualConfig, data }) {
  const type = visualConfig?.type;
  if (type === 'kpi') return <KpiRenderer data={data} config={visualConfig} />;
  if (type === 'table') return <TableRenderer data={data} config={visualConfig} />;
  return <ChartRenderer data={data} config={visualConfig} />;
}

function VisualizationPreview({ widget }) {
  const type = widget?.vc?.type;
  const isKpi = type === 'kpi';
  const isTable = type === 'table';

  return (
    <SectionCard title="시각화 미리보기">
      <Box
        sx={{
          height: isKpi ? 132 : isTable ? 300 : 260,
          minHeight: isKpi ? 120 : 220,
          border: '1px solid #e5eaf2',
          borderRadius: '8px',
          overflow: 'hidden',
          bgcolor: '#fff',
        }}
      >
        <PreviewWidget visualConfig={widget?.vc} data={widget?.previewData ?? []} />
      </Box>
    </SectionCard>
  );
}

function SourceParameterSummary({ sources, parameterMappings }) {
  const querySources = sources.filter((source) =>
    parameterMappings.some((mapping) => mappingAppliesToSource(mapping, source.id))
  );

  if (!querySources.length) {
    return <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>표시할 조회 파라미터가 없습니다.</Typography>;
  }

  return (
    <Stack spacing={0.75}>
      {querySources.map((source) => {
        const params = parameterMappings.filter((mapping) => mappingAppliesToSource(mapping, source.id));
        return (
          <Box key={source.id} sx={{ border: '1px solid #e2e8f0', borderRadius: '8px', bgcolor: '#fff', p: 1 }}>
            <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.75 }}>
              <Chip
                size="small"
                label={SOURCE_TYPE_LABEL[source.sourceType] ?? source.sourceType ?? 'TABLE'}
                sx={{ height: 18, fontSize: 10, bgcolor: '#dbeafe', color: '#2563eb', fontWeight: 800 }}
              />
              <Typography sx={{ fontSize: 12, fontWeight: 900, color: '#1e293b' }} noWrap title={source.sourceName}>
                {source.sourceName}
              </Typography>
            </Stack>
            <ChipList
              items={params.map((mapping) => `${mapping.paramName || mapping.key || mapping.name}: ${paramValue(mapping)}`)}
              emptyText="설정된 파라미터가 없습니다."
            />
          </Box>
        );
      })}
    </Stack>
  );
}

function TableConditionSummary({ sources }) {
  const tableSources = sources.filter((source) => ['TABLE', 'VIEW'].includes(source.sourceType));
  if (!tableSources.length) {
    return <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>테이블 조회 조건이 없습니다.</Typography>;
  }

  return (
    <Stack spacing={0.75}>
      {tableSources.map((source) => {
        const cfg = source.tableConfig ?? {};
        const where = (cfg.whereConditions ?? []).filter((condition) => condition.mappingType !== 'UNUSED');
        const orderBy = cfg.orderBy ?? [];
        return (
          <Box key={source.id} sx={{ border: '1px solid #e2e8f0', borderRadius: '8px', bgcolor: '#fff', p: 1 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 900, color: '#1e293b', mb: 0.75 }} noWrap title={source.sourceName}>
              {source.sourceName}
            </Typography>
            <Stack spacing={0.75}>
              <Box>
                <Typography sx={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', mb: 0.35 }}>WHERE</Typography>
                <ChipList items={where.map(whereText)} emptyText="조건 없음" />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', mb: 0.35 }}>ORDER BY</Typography>
                <ChipList items={orderBy.map(orderText)} emptyText="정렬 없음" />
              </Box>
            </Stack>
          </Box>
        );
      })}
    </Stack>
  );
}

export default function StepConfirm({ draft, testResults = {} }) {
  const dataSources = draft?.dataSources ?? [];
  const parameterMappings = draft?.parameterMappings ?? [];
  const visualConfigs = draft?.visualConfigs ?? {};
  const mergeConfig = draft?.mergeConfig ?? {};
  const visualTargets = getVisualTargets({ dataSources, mergeConfig, visualConfigs });
  const sourceNameById = Object.fromEntries(dataSources.map((source) => [source.id, source.sourceName]));

  const widgets = visualTargets.map((target) => {
    const mergeType = mergeConfig?.type ?? 'SEPARATE';
    return {
      id: target.id,
      name: getVisualTargetTitle(target, visualConfigs),
      sourceSummary: target.kind === 'merged'
        ? `${target.dataSources.map((source) => source.sourceName).join(' + ')} (${MERGE_TYPE_LABEL[mergeType] ?? mergeType})`
        : SOURCE_TYPE_LABEL[target.dataSource?.sourceType] ?? target.dataSource?.sourceType,
      sourceNames: target.dataSources?.map((source) => source.sourceName) ?? [],
      sourceIds: target.sourceIds ?? [],
      dataSources: target.dataSources ?? [],
      modules: Array.from(new Set((target.dataSources ?? []).map((source) => source.module).filter(Boolean))),
      vc: visualConfigs[target.id],
      previewData: target.kind === 'merged'
        ? ((testResults[target.id] ?? testResults[MERGED_DATA_SOURCE_ID])?.rows ?? [])
        : (testResults[target.dataSource?.id]?.rows ?? []),
      isMerged: target.kind === 'merged',
      mergeConfig,
    };
  });

  const [activeId, setActiveId] = React.useState(widgets[0]?.id ?? null);
  const activeWidget = widgets.find((widget) => widget.id === activeId) ?? widgets[0];

  React.useEffect(() => {
    if (!widgets.length) {
      setActiveId(null);
      return;
    }
    if (!widgets.some((widget) => widget.id === activeId)) setActiveId(widgets[0].id);
  }, [activeId, widgets]);

  const activeChartLabel = CHART_LABEL[activeWidget?.vc?.type] ?? activeWidget?.vc?.type;
  const activeConfigured = Boolean(activeWidget?.vc?.type);
  const activeFields = vcFields(activeWidget?.vc);
  const activeMergeConfig = activeWidget?.mergeConfig;
  const activeMergeType = activeMergeConfig?.type ?? 'SEPARATE';
  const activeRelationships = activeMergeConfig?.relationships ?? [];
  const activeBaseSourceName = sourceNameById[activeMergeConfig?.baseSourceId] ?? activeWidget?.sourceNames?.[0] ?? '-';

  return (
    <Box sx={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>
          저장될 위젯
        </Typography>
        <Chip
          size="small"
          label={`${widgets.length}개`}
          sx={{ height: 20, fontSize: 11, fontWeight: 700, bgcolor: '#eff6ff', color: '#1d4ed8' }}
        />
        {widgets.some((widget) => widget.isMerged) && (
          <Chip
            size="small"
            label="병합"
            sx={{ height: 20, fontSize: 11, fontWeight: 700, bgcolor: '#eef2ff', color: '#4f46e5' }}
          />
        )}
      </Stack>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '360px minmax(0, 1fr)' },
          gap: 1,
        }}
      >
        <Box sx={{ border: '1px solid #e5eaf2', borderRadius: '8px', bgcolor: '#fff', overflow: 'hidden', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <Stack spacing={0} sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            {widgets.map((widget, index) => {
              const selected = widget.id === activeWidget?.id;
              return (
                <Box
                  key={widget.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveId(widget.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') setActiveId(widget.id);
                  }}
                  sx={{
                    px: 1.25,
                    py: 1.1,
                    borderBottom: index === widgets.length - 1 ? 0 : '1px solid #eef2f7',
                    borderLeft: selected ? '3px solid #1976d2' : '3px solid transparent',
                    bgcolor: selected ? '#f8fbff' : '#fff',
                    cursor: 'pointer',
                    outline: 'none',
                    '&:hover': { bgcolor: selected ? '#f8fbff' : '#fafbfc' },
                    '&:focus-visible': { boxShadow: 'inset 0 0 0 2px rgba(25, 118, 210, 0.35)' },
                  }}
                >
                  <Typography sx={{ fontSize: 12, fontWeight: 800, color: '#1e293b' }} noWrap title={widget.name}>
                    {widget.name}
                  </Typography>
                  <Typography sx={{ mt: 0.25, fontSize: 11, color: '#64748b' }} noWrap title={widget.sourceSummary}>
                    {widget.sourceSummary}
                  </Typography>
                </Box>
              );
            })}
          </Stack>
        </Box>

        <Box sx={{ border: '1px solid #e5eaf2', borderRadius: '8px', bgcolor: '#fff', overflow: 'hidden', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          {activeWidget ? (
            <>
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ px: 1.5, py: 1.25, borderBottom: '1px solid #e5eaf2', bgcolor: '#f8fafc' }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 800, color: '#1e293b' }} noWrap title={activeWidget.name}>
                    {activeWidget.name}
                  </Typography>
                  <Typography sx={{ mt: 0.25, fontSize: 11, color: '#64748b' }} noWrap title={activeWidget.sourceSummary}>
                    {activeWidget.sourceSummary}
                  </Typography>
                </Box>
                <Chip
                  size="small"
                  label={activeConfigured ? (activeChartLabel ?? activeWidget.vc.type) : '미설정'}
                  sx={{
                    height: 22,
                    fontSize: 11,
                    fontWeight: 800,
                    bgcolor: activeConfigured ? '#f0fdf4' : '#fef9c3',
                    color: activeConfigured ? '#15803d' : '#a16207',
                    flexShrink: 0,
                  }}
                />
              </Stack>

              <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', p: 1.5 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: 'repeat(3, minmax(0, 1fr))' }, gap: 1 }}>
                  <InfoCard
                    title="소스"
                    primary={activeWidget.isMerged ? '병합 위젯' : '단일 위젯'}
                    secondary={activeWidget.sourceNames.join(' + ') || '-'}
                  />
                  <InfoCard
                    title="시각화"
                    primary={activeConfigured ? (activeChartLabel ?? activeWidget.vc.type) : '미설정'}
                    secondary={vcSummary(activeWidget.vc)}
                  />
                  <InfoCard
                    title="모듈"
                    primary={activeWidget.modules.join(', ') || '-'}
                    secondary={`${activeFields.length}개 필드`}
                  />
                </Box>

                <VisualizationPreview widget={activeWidget} />

                {activeWidget.isMerged && (
                  <SectionCard title="병합 정보">
                    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ mb: 1 }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontSize: 10, fontWeight: 800, color: '#94a3b8' }}>병합 방식</Typography>
                        <Typography sx={{ mt: 0.35, fontSize: 12, fontWeight: 900, color: '#1e293b' }}>
                          {MERGE_TYPE_LABEL[activeMergeType] ?? activeMergeType}
                        </Typography>
                      </Box>
                      <Chip
                        size="small"
                        label={MERGE_TYPE_LABEL[activeMergeType] ?? activeMergeType}
                        sx={{ height: 22, borderRadius: '6px', fontSize: 10, fontWeight: 800, bgcolor: '#eef2ff', color: '#4f46e5' }}
                      />
                    </Stack>

                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '180px minmax(0, 1fr)' }, gap: 1 }}>
                      <Box>
                        <Typography sx={{ fontSize: 10, fontWeight: 800, color: '#94a3b8' }}>기준 소스</Typography>
                        <Typography sx={{ mt: 0.35, fontSize: 12, fontWeight: 800, color: '#1e293b' }} noWrap title={activeBaseSourceName}>
                          {activeBaseSourceName}
                        </Typography>
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontSize: 10, fontWeight: 800, color: '#94a3b8' }}>포함 소스</Typography>
                        <Box sx={{ mt: 0.5 }}>
                          <ChipList items={activeWidget.sourceNames} />
                        </Box>
                      </Box>
                    </Box>

                    <Box sx={{ mt: 1 }}>
                      <Typography sx={{ mb: 0.5, fontSize: 10, fontWeight: 800, color: '#94a3b8' }}>병합 조건</Typography>
                      {activeMergeType === 'UNION' ? (
                        <Typography sx={{ fontSize: 11, color: '#64748b' }}>
                          UNION은 연결 조건 없이 선택한 소스의 행을 수직으로 합칩니다.
                        </Typography>
                      ) : activeRelationships.length ? (
                        <Stack spacing={0.5}>
                          {activeRelationships.map((rel, index) => (
                            <Box key={`${rel.leftDsId}-${rel.rightDsId}-${index}`} sx={{ px: 1, py: 0.75, borderRadius: '6px', bgcolor: '#fff', border: '1px solid #e2e8f0' }}>
                              <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#334155' }} noWrap title={relationshipText(rel, sourceNameById)}>
                                {relationshipText(rel, sourceNameById)}
                              </Typography>
                            </Box>
                          ))}
                        </Stack>
                      ) : (
                        <Typography sx={{ fontSize: 11, color: '#f59e0b', fontWeight: 700 }}>
                          병합 조건이 아직 설정되지 않았습니다.
                        </Typography>
                      )}
                    </Box>
                  </SectionCard>
                )}

                <SectionCard title="조회 파라미터">
                  <SourceParameterSummary
                    sources={activeWidget.dataSources}
                    parameterMappings={parameterMappings}
                  />
                </SectionCard>

                <SectionCard title="테이블 조건">
                  <TableConditionSummary sources={activeWidget.dataSources} />
                </SectionCard>

                <SectionCard title="필드 구성">
                  <ChipList items={activeFields} emptyText="설정된 필드가 없습니다." />
                </SectionCard>
              </Box>
            </>
          ) : (
            <Box sx={{ flex: 1, minHeight: 180, border: '1px dashed #dbe3ef', m: 1.5, borderRadius: '8px' }} />
          )}
        </Box>
      </Box>
    </Box>
  );
}
