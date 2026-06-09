import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';
import CloseIcon from '@mui/icons-material/Close';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import InsightsIcon from '@mui/icons-material/Insights';
import SchemaIcon from '@mui/icons-material/Schema';
import SearchIcon from '@mui/icons-material/Search';
import SendIcon from '@mui/icons-material/Send';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import SpeedIcon from '@mui/icons-material/Speed';
import StorageIcon from '@mui/icons-material/Storage';
import TableChartIcon from '@mui/icons-material/TableChart';
import TuneIcon from '@mui/icons-material/Tune';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import WidgetThumbnail from '../../../core/WidgetThumbnail';
import { useDbMetadataSource } from '../browse/hooks/useDbMetadataSource';
import { useBusinessTreeSource } from '../browse/hooks/useBusinessTreeSource';
import { suggestWidget } from '../../../../../restapi/widgetBuilder';

const VIZ_LABELS = {
  bar: '막대 차트',
  bar_h: '가로 막대',
  bar_stacked: '누적 막대',
  line: '라인 차트',
  area: '영역 차트',
  pie: '파이 차트',
  doughnut: '도넛 차트',
  table: '테이블',
  kpi: 'KPI',
};

const VIZ_ICONS = {
  bar: BarChartIcon,
  bar_h: BarChartIcon,
  bar_stacked: BarChartIcon,
  line: ShowChartIcon,
  area: ShowChartIcon,
  pie: InsightsIcon,
  doughnut: InsightsIcon,
  table: TableChartIcon,
  kpi: SpeedIcon,
};

function buildCatalogSummary(sources) {
  return sources.map(s => ({
    id: s.id || s.name,
    name: s.name,
    module: s.module || '',
    sourceType: s.table_type || 'TABLE',
    description: s.comment || s.description || s.name,
    business_domain: s.business_domain,
    category: s.category,
    returnType: 'MIXED',
    params: [],
  }));
}

function asList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (typeof value === 'object') {
    return Object.entries(value)
      .filter(([, item]) => item !== undefined && item !== null && item !== '')
      .map(([key, item]) => `${key}: ${item}`);
  }
  return [String(value)];
}

function firstValue(...values) {
  return values.flatMap(asList).find(Boolean) || '';
}

function getDataSources(suggestResult) {
  if (suggestResult?.dataSources?.length) return suggestResult.dataSources;
  if (suggestResult?.dataSource) return [suggestResult.dataSource];
  return [];
}

function inferMetric(prompt) {
  if (/가동률/.test(prompt)) return '가동률';
  if (/회의/.test(prompt)) return '회의 건수';
  if (/주문/.test(prompt)) return '주문 수량';
  if (/계획.*대비|대비.*생산/.test(prompt)) return '계획 대비 생산';
  if (/잔여/.test(prompt)) return '잔여 수량';
  if (/생산/.test(prompt)) return '생산 수량';
  return '추천 지표';
}

function inferDimensions(prompt) {
  const dimensions = [];
  if (/자원/.test(prompt)) dimensions.push('자원별');
  if (/공장/.test(prompt)) dimensions.push('공장별');
  if (/품목/.test(prompt)) dimensions.push('품목별');
  if (/고객/.test(prompt)) dimensions.push('고객별');
  if (/회의/.test(prompt)) dimensions.push('주최자별');
  if (/월별|월간/.test(prompt)) dimensions.push('월별');
  return dimensions.length ? dimensions : ['자원별', '공장별'];
}

function inferCondition(prompt) {
  if (/최근\s*3개월/.test(prompt)) return '최근 3개월';
  if (/최근\s*6개월/.test(prompt)) return '최근 6개월';
  if (/월별|월간/.test(prompt)) return '월별';
  return '전체 기간';
}

function inferVizType(prompt) {
  if (/라인|추이/.test(prompt)) return 'line';
  if (/표|테이블/.test(prompt)) return 'table';
  if (/KPI|지표만/.test(prompt)) return 'kpi';
  if (/파이|비중/.test(prompt)) return 'pie';
  return 'bar';
}

function buildInferredSpec(prompt) {
  const vizType = inferVizType(prompt);
  return {
    widgetTitle: prompt,
    widgetType: vizType,
    visualConfig: { type: vizType },
    aiDraftReview: {
      metric: inferMetric(prompt),
      dimensions: inferDimensions(prompt),
      condition: inferCondition(prompt),
      inferred: true,
    },
  };
}

function getResultSummary(suggestResult, fallbackPrompt) {
  const vc = suggestResult?.visualConfig || {};
  const review = suggestResult?.aiDraftReview || {};
  const widgetType = suggestResult?.widgetType || vc.type || inferVizType(fallbackPrompt);
  const metric = firstValue(
    review.metric,
    suggestResult?.measure,
    suggestResult?.measures,
    suggestResult?.metrics,
    vc.yFields,
    vc.valueField,
  ) || inferMetric(fallbackPrompt);
  const dimensions = [
    ...asList(review.dimensions),
    ...asList(review.dimension),
    ...asList(suggestResult?.dimension),
    ...asList(suggestResult?.dimensions),
    ...asList(vc.xField),
    ...asList(vc.labelField),
  ].filter(Boolean);
  const condition = firstValue(
    review.condition,
    suggestResult?.condition,
    suggestResult?.conditions,
    suggestResult?.filters,
    suggestResult?.paramBindings,
  ) || inferCondition(fallbackPrompt);

  return {
    title: suggestResult?.widgetTitle || fallbackPrompt,
    metric,
    dimensions: dimensions.length ? [...new Set(dimensions)].slice(0, 3) : inferDimensions(fallbackPrompt),
    condition,
    vizType: widgetType,
    dataSources: getDataSources(suggestResult),
    inferred: Boolean(review.inferred),
  };
}

function getPrimaryDataSource(suggestResult, selectedModule) {
  const dataSources = getDataSources(suggestResult);
  const firstSource = dataSources[0] || {};
  return {
    id: firstSource.id || 'ai_source_1',
    type: firstSource.type || firstSource.sourceType || 'TABLE',
    name: firstSource.name || firstSource.sourceName || 'AI_WIDGET_SOURCE',
    sourceName: firstSource.sourceName || firstSource.name || 'AI_WIDGET_SOURCE',
    module: firstSource.module || selectedModule || 'AI',
    schema: firstSource.schema || 'dbo',
    mockData: firstSource.mockData || [],
  };
}

function buildFallbackData(visualConfig, summary) {
  const xField = visualConfig.xField || visualConfig.labelField || 'CATEGORY';
  const yField = visualConfig.valueField || visualConfig.yFields?.[0] || 'VALUE';

  if (visualConfig.type === 'kpi') {
    return [{ [yField]: 82, delta: 7 }];
  }
  if (visualConfig.type === 'table') {
    return [
      { CATEGORY: 'A', VALUE: 120, STATUS: '정상' },
      { CATEGORY: 'B', VALUE: 96, STATUS: '주의' },
      { CATEGORY: 'C', VALUE: 138, STATUS: '정상' },
    ];
  }
  return ['1월', '2월', '3월', '4월', '5월', '6월'].map((label, index) => ({
    [xField]: label,
    [yField]: [32, 46, 41, 58, 52, 67][index],
    metric: summary.metric,
  }));
}

function normalizePreviewVisualConfig(suggestResult, summary) {
  const type = summary.vizType || 'bar';
  const visualConfig = { type, ...(suggestResult?.visualConfig || {}) };
  const dimensionName = summary.dimensions?.[0]?.replace(/별$/, '') || 'CATEGORY';
  const metricName = summary.metric || 'VALUE';

  if (['bar', 'bar_h', 'bar_stacked', 'line', 'area'].includes(type)) {
    return {
      ...visualConfig,
      xField: visualConfig.xField || dimensionName,
      yFields: visualConfig.yFields?.length ? visualConfig.yFields : [metricName],
      labels: visualConfig.labels?.length ? visualConfig.labels : [metricName],
    };
  }
  if (['pie', 'doughnut'].includes(type)) {
    return {
      ...visualConfig,
      labelField: visualConfig.labelField || dimensionName,
      valueField: visualConfig.valueField || metricName,
    };
  }
  if (type === 'table') {
    return {
      ...visualConfig,
      columns: visualConfig.columns?.length ? visualConfig.columns : [
        { field: dimensionName, headerText: dimensionName },
        { field: metricName, headerText: metricName },
      ],
    };
  }
  if (type === 'kpi') {
    return {
      ...visualConfig,
      valueField: visualConfig.valueField || metricName,
      deltaField: visualConfig.deltaField || 'delta',
    };
  }
  return visualConfig;
}

function buildPreviewWidget({ suggestResult, summary, prompt, selectedModule, userId }) {
  if (!suggestResult) return null;

  const dataSource = getPrimaryDataSource(suggestResult, selectedModule);
  const visualConfig = normalizePreviewVisualConfig(suggestResult, summary);
  const fallbackData = suggestResult?.dataConfig?.fallbackData?.length
    ? suggestResult.dataConfig.fallbackData
    : buildFallbackData(visualConfig, summary);
  const spec = {
    ...suggestResult,
    widgetTitle: summary.title,
    widgetType: summary.vizType,
    dataSource: {
      ...dataSource,
      sourceType: dataSource.type,
    },
    dataConfig: {
      ...(suggestResult?.dataConfig || {}),
      sourceType: dataSource.type,
      sourceName: dataSource.sourceName,
      schema: dataSource.schema,
      tableConfig: suggestResult?.dataConfig?.tableConfig || {},
      fallbackData,
      timeout: suggestResult?.dataConfig?.timeout ?? 0,
    },
    visualConfig,
    mockData: fallbackData,
  };

  return {
    id: `ai_preview_${Date.now()}`,
    title: summary.title || prompt || 'AI 생성 위젯',
    description: suggestResult?.aiDraftReview?.purpose || prompt || '',
    widget_type: summary.vizType,
    module: dataSource.module,
    spec_json: spec,
    created_by: userId || 'AI',
    create_dttm: new Date().toISOString(),
  };
}

function getFieldRows(visualConfig, summary) {
  if (!visualConfig) return [];
  const type = visualConfig.type;
  if (['bar', 'bar_h', 'bar_stacked', 'line', 'area'].includes(type)) {
    return [
      { label: 'X축', value: visualConfig.xField || summary.dimensions?.[0] || '-' },
      { label: 'Y축', value: (visualConfig.yFields || []).join(', ') || summary.metric || '-' },
    ];
  }
  if (['pie', 'doughnut'].includes(type)) {
    return [
      { label: '라벨', value: visualConfig.labelField || summary.dimensions?.[0] || '-' },
      { label: '값', value: visualConfig.valueField || summary.metric || '-' },
    ];
  }
  if (type === 'table') {
    const columns = (visualConfig.columns || [])
      .map((column) => column.headerText || column.field || column.name || column)
      .filter(Boolean);
    return [
      { label: '표시 컬럼', value: columns.join(', ') || [summary.dimensions?.[0], summary.metric].filter(Boolean).join(', ') || '-' },
    ];
  }
  if (type === 'kpi') {
    return [
      { label: '값', value: visualConfig.valueField || summary.metric || '-' },
      { label: '증감', value: visualConfig.deltaField || '-' },
    ];
  }
  return [];
}

function InfoPanel({ icon, title, children }) {
  return (
    <Box sx={{ border: '1px solid #e5eaf2', borderRadius: '8px', bgcolor: '#fff', overflow: 'hidden' }}>
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.75}
        sx={{ px: 1, py: 0.65, borderBottom: '1px solid #edf2f7', bgcolor: '#f8fafc' }}
      >
        {icon}
        <Typography sx={{ fontSize: 12, fontWeight: 900, color: '#334155' }}>
          {title}
        </Typography>
      </Stack>
      <Box sx={{ p: 1, minWidth: 0 }}>
        {children}
      </Box>
    </Box>
  );
}

function DetailRow({ label, value }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: '70px minmax(0, 1fr)', gap: 1, alignItems: 'start' }}>
      <Typography sx={{ fontSize: 11, fontWeight: 800, color: '#94a3b8' }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 12, fontWeight: 800, color: '#1e293b', wordBreak: 'break-word' }}>
        {value || '-'}
      </Typography>
    </Box>
  );
}

function GeneratingView() {
  return (
    <Stack alignItems="center" spacing={1.5} sx={{ textAlign: 'center', color: '#0f172a', mt: -6 }}>
      <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#111827' }}>
        위젯을 생성하고 있습니다
      </Typography>
      <Typography sx={{ fontSize: 15, color: '#6B7280' }}>
        입력한 자연어와 모듈 정보를 바탕으로 위젯 구성을 정리하는 중입니다
      </Typography>
      <Stack direction="row" spacing={1} sx={{ pt: 0.5 }}>
        {[0, 1, 2].map((index) => (
          <Box
            key={index}
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              bgcolor: index === 0 ? '#2563eb' : index === 1 ? '#7c3aed' : '#111827',
              animation: 'aiGeneratingDot 0.9s ease-in-out infinite',
              animationDelay: `${index * 0.14}s`,
              '@keyframes aiGeneratingDot': {
                '0%, 80%, 100%': { transform: 'translateY(0)', opacity: 0.45 },
                '40%': { transform: 'translateY(-7px)', opacity: 1 },
              },
            }}
          />
        ))}
      </Stack>
    </Stack>
  );
}

function SummaryLine({ icon: Icon, label, value }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
      <Icon sx={{ fontSize: 17, color: '#64748b', flexShrink: 0 }} />
      <Typography sx={{ width: 72, flexShrink: 0, fontSize: 12, fontWeight: 800, color: '#94a3b8' }}>
        {label}
      </Typography>
      <Typography sx={{ minWidth: 0, fontSize: 13, fontWeight: 800, color: '#0f172a' }} noWrap>
        {value}
      </Typography>
    </Stack>
  );
}

export default function AiRecommendTab({
  userId,
  onEditDraft,
  editActionLabel = '수정',
}) {
  const { sources } = useDbMetadataSource();
  const { availableModules } = useBusinessTreeSource();

  const [prompt, setPrompt] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [selectedModule, setSelectedModule] = useState('');
  const [suggesting, setSuggesting] = useState(false);
  const [suggestResult, setSuggestResult] = useState(null);
  const [notice, setNotice] = useState('');

  const moduleOptions = useMemo(() => {
    const fromMeta = [...new Set(sources.map(s => s.module).filter(Boolean))];
    return (availableModules.length > 0 ? availableModules : fromMeta).filter(Boolean);
  }, [availableModules, sources]);

  const selectedModuleLabel = selectedModule || '자동 선택';

  const filteredSources = useMemo(
    () => (selectedModule ? sources.filter(s => s.module === selectedModule) : sources),
    [selectedModule, sources],
  );

  const resultSummary = useMemo(
    () => getResultSummary(suggestResult, prompt),
    [suggestResult, prompt],
  );

  const draftPayload = useMemo(() => (suggestResult ? {
    suggestResult: {
      ...suggestResult,
      widgetTitle: resultSummary.title,
      widgetType: resultSummary.vizType,
      visualConfig: {
        ...(suggestResult.visualConfig || {}),
        type: resultSummary.vizType,
      },
      aiDraftReview: {
        ...(suggestResult.aiDraftReview || {}),
        metric: resultSummary.metric,
        dimensions: resultSummary.dimensions,
        condition: resultSummary.condition,
      },
    },
    prompt,
    moduleFilter: selectedModule,
    domainFilter: selectedModule,
  } : null), [prompt, resultSummary, selectedModule, suggestResult]);

  const previewWidget = useMemo(
    () => buildPreviewWidget({
      suggestResult: draftPayload?.suggestResult,
      summary: resultSummary,
      prompt,
      selectedModule,
      userId,
    }),
    [draftPayload, prompt, resultSummary, selectedModule, userId],
  );

  const handleSuggest = async () => {
    if (!prompt.trim()) return;
    setSuggesting(true);
    setSuggestResult(null);
    setNotice('');
    try {
      const res = await suggestWidget({
        user_id: userId || 'guest',
        prompt,
        catalog_summary: buildCatalogSummary(filteredSources),
        module_filter: selectedModule || null,
      }, {
        waitOn: false,
      });
      const widgetSpec = res.widget_spec || buildInferredSpec(prompt);
      setSuggestResult(widgetSpec);
      if (!res.widget_spec) {
        setNotice('일부 항목은 추천값으로 채웠습니다.');
      }
    } catch (e) {
      setSuggestResult(buildInferredSpec(prompt));
      setNotice('일부 항목은 추천값으로 채웠습니다.');
    } finally {
      setSuggesting(false);
    }
  };

  const handleExampleClick = (text) => {
    setPrompt(text);
    setSuggestResult(null);
    setNotice('');
  };

  const handleReset = () => {
    setPrompt('');
    setSuggestResult(null);
    setNotice('');
  };

  const handleEditDraft = () => {
    onEditDraft?.(draftPayload);
  };

  const hasPrompt = Boolean(prompt.trim());
  const showRefineChoices = suggestResult && (resultSummary.inferred || resultSummary.metric === '추천 지표');
  const ResultChartIcon = VIZ_ICONS[resultSummary.vizType] || BarChartIcon;
  const previewSpec = previewWidget?.spec_json || {};
  const previewDataSource = previewSpec.dataSource || {};
  const previewDataConfig = previewSpec.dataConfig || {};
  const previewVisualConfig = previewSpec.visualConfig || {};
  const previewFieldRows = getFieldRows(previewVisualConfig, resultSummary);

  return (
    <Box
      sx={{
        width: '100%',
        height: 'calc(92vh - 142px)',
        minHeight: 560,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#fff',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2,
          pb: 2,
          overflow: 'auto',
        }}
      >
        {suggesting ? (
          <GeneratingView />
        ) : !suggestResult ? (
          <Stack alignItems="center" spacing={1.25} sx={{ textAlign: 'center', color: '#0f172a', mt: -6 }}>
            <Typography sx={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>
              원하는 위젯을 AI를 활용해 자연어로 구성해보세요
            </Typography>
            <Typography sx={{ mt: 1, fontSize: 16, fontWeight: 400, color: '#6B7280' }}>
              만들고 싶은 위젯을 설명하면 AI가 지표, 기준, 조건을 정리해드립니다
            </Typography>
          </Stack>
        ) : (
          <Card
            variant="outlined"
            sx={{
              width: 'min(1240px, 100%)',
              borderRadius: '8px',
              borderColor: '#e5eaf2',
              boxShadow: '0 14px 34px rgba(15, 23, 42, 0.08)',
            }}
          >
            <CardContent sx={{ p: 1.25, pb: 1 }}>
              <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1 }}>
                <Box
                  sx={{
                    width: 34,
                    height: 34,
                    borderRadius: '8px',
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: '#eff6ff',
                    color: '#2563eb',
                    flexShrink: 0,
                  }}
                >
                  <ResultChartIcon sx={{ fontSize: 22 }} />
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 800, color: '#2563eb', mb: 0.25 }}>
                    AI가 생성한 위젯
                  </Typography>
                  <Typography sx={{ fontSize: 18, fontWeight: 900, color: '#0f172a', lineHeight: 1.25 }} noWrap>
                    {resultSummary.title}
                  </Typography>
                </Box>
                <Chip
                  size="small"
                  label={selectedModuleLabel}
                  sx={{ height: 24, borderRadius: '6px', fontWeight: 800, bgcolor: '#f8fafc', color: '#475569' }}
                />
              </Stack>

              {notice && (
                <Alert severity="info" sx={{ mb: 1.25, py: 0.25, '& .MuiAlert-message': { fontSize: 12, fontWeight: 700 } }}>
                  {notice}
                </Alert>
              )}

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 300px' }, gap: 1 }}>
                <Stack spacing={1} sx={{ minWidth: 0 }}>
                  <InfoPanel icon={<BarChartIcon sx={{ width: 16, height: 16, color: '#2563eb' }} />} title="미리보기">
                    <WidgetThumbnail
                      type={resultSummary.vizType}
                      height={300}
                      scale={3.5}
                      marginBottom={0}
                      showTypeLabel={false}
                    />
                  </InfoPanel>

                  <InfoPanel icon={<SchemaIcon sx={{ width: 16, height: 16, color: '#7c3aed' }} />} title="필드 구성">
                    <Stack spacing={0.65}>
                      {previewFieldRows.map((row) => (
                        <DetailRow key={row.label} label={row.label} value={row.value} />
                      ))}
                    </Stack>
                  </InfoPanel>
                </Stack>

                <Stack spacing={1} sx={{ minWidth: 0 }}>
                  <InfoPanel icon={<StorageIcon sx={{ width: 16, height: 16, color: '#059669' }} />} title="데이터 소스">
                    <Stack spacing={0.65}>
                      <DetailRow label="유형" value={previewDataConfig.sourceType || previewDataSource.type || 'TABLE'} />
                      <DetailRow label="이름" value={previewDataConfig.sourceName || previewDataSource.sourceName || previewDataSource.name} />
                      <DetailRow label="모듈" value={previewDataSource.module || selectedModuleLabel} />
                    </Stack>
                  </InfoPanel>

                  <InfoPanel icon={<InfoOutlinedIcon sx={{ width: 16, height: 16, color: '#64748b' }} />} title="기본 정보">
                    <Stack spacing={0.65}>
                      <DetailRow label="시각화" value={VIZ_LABELS[resultSummary.vizType] || resultSummary.vizType} />
                      <DetailRow label="설명" value={previewWidget?.description || resultSummary.title} />
                      <DetailRow label="생성자" value={previewWidget?.created_by || 'AI'} />
                    </Stack>
                  </InfoPanel>
                </Stack>
              </Box>

              <Box sx={{ mt: 1 }}>
                <InfoPanel icon={<InsightsIcon sx={{ width: 16, height: 16, color: '#2563eb' }} />} title="AI 해석 정보">
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 0.75 }}>
                    <SummaryLine icon={InsightsIcon} label="지표" value={resultSummary.metric} />
                    <SummaryLine icon={ViewColumnIcon} label="분석 기준" value={resultSummary.dimensions.join(', ')} />
                    <SummaryLine icon={FilterAltIcon} label="조건" value={resultSummary.condition} />
                    <SummaryLine icon={ResultChartIcon} label="시각화" value={VIZ_LABELS[resultSummary.vizType] || resultSummary.vizType} />
                  </Box>
                </InfoPanel>
              </Box>

              {showRefineChoices && (
                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
                  {['자원별', '공장별', '최근 3개월', '월별'].map(choice => (
                    <Chip
                      key={choice}
                      size="small"
                      label={choice}
                      onClick={() => setPrompt(prev => `${prev} ${choice}`.trim())}
                      sx={{ borderRadius: '6px', bgcolor: '#f8fafc', fontWeight: 700 }}
                    />
                  ))}
                </Stack>
              )}
            </CardContent>
            <CardActions sx={{ px: 2, pt: 0, pb: 1.5, gap: 1, justifyContent: 'flex-end' }}>
              <Button size="small" variant="text" onClick={handleReset}>
                다시 입력
              </Button>
              <Button size="small" variant="outlined" startIcon={<TuneIcon />} onClick={handleEditDraft} sx={{ borderRadius: '7px', fontWeight: 800 }}>
                {editActionLabel}
              </Button>
            </CardActions>
          </Card>
        )}
      </Box>

      <Box sx={{ px: 3, pb: 2.25, flexShrink: 0 }}>
        <Box
          sx={{
            maxWidth: 920,
            mx: 'auto',
          }}
        >
          <Box sx={{ mb: 0.75 }}>
            <FormControl size="small" sx={{ width: 178 }}>
              <InputLabel>모듈</InputLabel>
              <Select value={selectedModule} label="모듈"
                onChange={e => {
                  setSelectedModule(e.target.value);
                  setSuggestResult(null);
                  setNotice('');
                }}
                sx={{
                  height: 34,
                  bgcolor: '#fff',
                  borderRadius: '6px',
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                <MenuItem value="">자동 선택</MenuItem>
                {moduleOptions.map(module => (
                  <MenuItem key={module} value={module}>{module}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box
            sx={{
              position: 'relative',
            }}
          >
            <TextField
              fullWidth
              multiline
              minRows={2}
              maxRows={5}
              value={prompt}
              onChange={e => {
                setPrompt(e.target.value);
                setNotice('');
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSuggest();
                }
              }}
              disabled={suggesting}
              sx={{
                '& .MuiOutlinedInput-root': {
                  alignItems: 'flex-start',
                  bgcolor: '#fff',
                  borderRadius: '8px',
                  fontSize: 14,
                  p: '13px 84px 13px 16px',
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#e5eaf2',
                },
                '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#cbd5e1',
                },
                '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#1976d2',
                  borderWidth: 1,
                },
                '& textarea': { fontWeight: 600 },
              }}
            />
            {prompt && (
              <Tooltip title="입력 지우기">
                <IconButton
                  size="small"
                  onClick={() => setPrompt('')}
                  disabled={suggesting}
                  sx={{ position: 'absolute', right: 44, bottom: 8, width: 30, height: 30, color: '#64748b' }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="위젯 생성">
              <span>
                <IconButton
                  color="primary"
                  onClick={handleSuggest}
                  disabled={suggesting || !hasPrompt}
                  sx={{ position: 'absolute', right: 8, bottom: 8, width: 30, height: 30 }}
                >
                  {suggesting ? <CircularProgress size={18} /> : <SendIcon />}
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
