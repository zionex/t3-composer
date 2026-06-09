import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Button, Chip, IconButton, MenuItem, Stack, TextField, Tooltip,
  Step, StepLabel, Stepper, Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import Step2_ParamMapping from './steps/Step2_ParamMapping';
import Step3_TestAndMapping from './steps/Step3_TestAndMapping';
import StepMapping from './steps/StepMapping';
import Step4_VisualAndPreview from './steps/Step4_VisualAndPreview';
import StepConfirm from './steps/StepConfirm';
import { useMultiTestQuery } from './steps/useMultiTestQuery';
import {
  defaultVisualConfig,
  getVisualTargets,
  getVisualTargetTitle,
  MERGED_DATA_SOURCE_ID,
  MODULE_LIST,
  moduleColor,
} from './steps/wizardConstants';
import { normalizeParameterMappings } from '../../../generic/widgetSpecAdapter';
import { ensureVisualShape } from '../../../dashboardbuilder/dialogs/WidgetSettingsDialog';
import DirectSourcePanel, { SourceTypeChip } from './DirectSourcePanel';
import dashboardConfig from '../../../core/dashboardConfig';

function migrateMergeConfig(mc) {
  if (!mc) return null;
  // Old format used `conditions: [{ left, right }]` — migrate to relationships
  if (mc.conditions && !mc.relationships) {
    return {
      ...mc,
      relationships: mc.conditions.map((c) => ({ leftCol: c.left ?? '', rightCol: c.right ?? '' })),
    };
  }
  return mc;
}

function initDraft(widget) {
  const wo = widget?.widgetOptions;
  if (wo?.dataSources) {
    const dataSources = wo.dataSources ?? [];
    return {
      dataSourceMode:    'MULTIPLE',
      dataSources,
      parameterMappings: normalizeParameterMappings(wo.parameterMappings ?? [], dataSources),
      columnMappings:    wo.columnMappings ?? {},
      mergeConfig:       migrateMergeConfig(wo.mergeConfig) ?? { enabled: false, type: dashboardConfig.defaultMergeType, relationships: [] },
      visualConfigs:     wo.visualConfigs ?? {},
    };
  }
  return {
    dataSourceMode:    'MULTIPLE',
    dataSources:       [],
    parameterMappings: [],
    columnMappings:    {},
    mergeConfig:       { enabled: false, type: dashboardConfig.defaultMergeType, relationships: [], individualSourceIds: [] },
    visualConfigs:     {},
  };
}

function filterResultToColumns(result, columns = []) {
  if (!result || columns.length === 0) return result;
  return {
    ...result,
    columns,
    rows: (result.rows ?? []).map((row) => {
      if (!row || typeof row !== 'object' || Array.isArray(row)) return row;
      return Object.fromEntries(columns.map((column) => [column, row[column]]));
    }),
  };
}

function resultMatchesColumns(result, columns = []) {
  if (!result?.executed || columns.length === 0) return Boolean(result?.executed);
  const resultColumns = result.columns ?? [];
  return resultColumns.length === columns.length
    && resultColumns.every((column, index) => column === columns[index]);
}

function CompactAiSourceConfig({ dataSource, widget, onWidgetChange, allModules, paramCount }) {
  const modules = allModules ?? MODULE_LIST;
  const hasParams = paramCount > 0;

  return (
    <Box
      sx={{
        border: '1px solid #e5eaf2',
        borderRadius: '8px',
        backgroundColor: '#fff',
        px: 1.25,
        py: 1,
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'minmax(300px, 1fr) 140px minmax(260px, 1.2fr) 150px',
          },
          gap: 1,
          alignItems: 'center',
        }}
      >
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0 }}>
          <SourceTypeChip value={dataSource?.sourceType} />
          <Typography sx={{ fontSize: 13, fontWeight: 800, color: '#1e293b' }} noWrap>
            {dataSource?.sourceName ?? '-'}
          </Typography>
        </Stack>

        <TextField
          select
          label="모듈"
          size="small"
          value={widget?.module ?? dataSource?.module ?? MODULE_LIST[0]}
          onChange={(e) => onWidgetChange({ module: e.target.value })}
          sx={{ '& .MuiInputBase-input': { fontSize: 12, py: 0.75 }, '& .MuiInputLabel-root': { fontSize: 11 } }}
        >
          {modules.map((m) => (
            <MenuItem key={m} value={m}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: moduleColor(m), flexShrink: 0 }} />
                <span>{m}</span>
              </Stack>
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="위젯 제목"
          size="small"
          value={widget?.title ?? ''}
          onChange={(e) => onWidgetChange({ title: e.target.value })}
          sx={{ '& .MuiInputBase-input': { fontSize: 12, py: 0.75 }, '& .MuiInputLabel-root': { fontSize: 11 } }}
        />

        <Stack direction="row" spacing={0.75} alignItems="center" justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
          <Chip
            size="small"
            label={hasParams ? `파라미터 ${paramCount}` : '입력값 없음'}
            sx={{
              height: 24,
              fontSize: 11,
              fontWeight: 700,
              bgcolor: hasParams ? '#fff7ed' : '#f0fdf4',
              color: hasParams ? '#ea580c' : '#16a34a',
            }}
          />
        </Stack>
      </Box>
    </Box>
  );
}

/**
 * Inline (non-Dialog) wizard for configuring and saving a widget.
 *
 * Props
 *   widget            – current widget object (title / module live here)
 *   onChange          – (widget) => void  — called on every title/module change and on finish
 *   allModules        – string[]
 *   onFinish          – (finalWidget) => void
 *   onBack            – () => void  — when provided, shows a back-link at step 0
 *   finishButtonLabel – string  (default '완료')
 *   skipSourceStep    – bool    (default false)
 *                       false → 5 steps: [소스 & 기본 정보, 테스트 실행, 데이터/파라미터 매핑, 시각화, 최종 확인]
 *                       true  → 4 steps: [테스트 실행, 데이터/파라미터 매핑, 시각화, 최종 확인]
 */
export default function DirectConfigWizard({
  widget,
  onChange,
  allModules,
  onFinish,
  onBack,
  backLabel,
  finishButtonLabel = '완료',
  skipSourceStep = false,
}) {
  const STEP_LABELS = skipSourceStep
    ? ['테스트 실행', '데이터/파라미터 매핑', '시각화', '최종 확인']
    : ['소스 & 기본 정보', '테스트 실행', '데이터/파라미터 매핑', '시각화', '최종 확인'];

  const SOURCE_IDX  = skipSourceStep ? -1 : 0;
  const TEST_IDX    = skipSourceStep ? 0 : 1;
  const MAPPING_IDX = skipSourceStep ? 1 : 2;
  const VISUAL_IDX  = skipSourceStep ? 2 : 3;
  const CONFIRM_IDX = skipSourceStep ? 3 : 4;

  const [activeStep, setActiveStep] = useState(0);
  const [draft, setDraft] = useState(() => initDraft(widget));
  const [testParamsCollapsed, setTestParamsCollapsed] = useState(false);

  const { results: testResults, runTest, runAll, runMerged } = useMultiTestQuery();

  const visualTestResults = useMemo(() => {
    const next = { ...testResults };
    draft.dataSources.forEach((ds) => {
      if (!['TABLE', 'VIEW'].includes(ds.sourceType)) return;
      const selectedColumns = ds.tableConfig?.columns ?? [];
      if (selectedColumns.length === 0) return;
      next[ds.id] = filterResultToColumns(next[ds.id], selectedColumns);
    });
    return next;
  }, [draft.dataSources, testResults]);

  useEffect(() => {
    if (activeStep !== VISUAL_IDX) return;
    draft.dataSources
      .filter((ds) => ['TABLE', 'VIEW'].includes(ds.sourceType))
      .filter((ds) => {
        const selectedColumns = ds.tableConfig?.columns ?? [];
        return selectedColumns.length > 0 && !resultMatchesColumns(testResults[ds.id], selectedColumns);
      })
      .forEach((ds) => runTest(ds, draft.parameterMappings));
  // testResults is intentionally excluded to avoid rerunning after runTest updates state.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStep, draft.dataSources, draft.parameterMappings]);

  function patchDraft(patch) {
    setDraft((prev) => ({ ...prev, ...patch }));
  }

  function handleWidgetChange(patch) {
    onChange((prevWidget) => ({ ...(prevWidget ?? widget), ...patch }));
  }

  function syncWidgetDraft(patch) {
    onChange((prevWidget) => {
      const base = prevWidget ?? widget;
      const primaryModule = patch.dataSources?.[0]?.module;
      return {
        ...base,
        ...(primaryModule && primaryModule !== 'CUSTOM' ? { module: primaryModule } : {}),
        widgetOptions: {
          ...(base?.widgetOptions ?? {}),
          ...patch,
        },
      };
    });
  }

  function handleDraftChange(patch) {
    patchDraft(patch);
    syncWidgetDraft(patch);
  }

  function handleRunTest(ds)  { runTest(ds, draft.parameterMappings); }
  function handleRunAll()     { runAll(draft.dataSources, draft.parameterMappings); }
  function handleRunMerged(mergeConfig = draft.mergeConfig, resultId = MERGED_DATA_SOURCE_ID) {
    runMerged(draft.dataSources, draft.parameterMappings, mergeConfig, resultId);
  }

  function goToStep(nextStep) {
    setActiveStep(nextStep);
  }

  function canNavigateToStep(nextStep) {
    return nextStep >= 0 && nextStep < STEP_LABELS.length;
  }

  function handleStepClick(nextStep) {
    if (!canNavigateToStep(nextStep)) return;
    goToStep(nextStep);
  }

  function handleNextStep() {
    const nextStep = Math.min(activeStep + 1, STEP_LABELS.length - 1);
    if (!canNavigateToStep(nextStep)) return;
    goToStep(nextStep);
  }

  function handleFinish() {
    if (!stepValid.every(Boolean)) return;

    const parameterMappings = normalizeParameterMappings(draft.parameterMappings, draft.dataSources);
    const isMerged = draft.mergeConfig?.enabled && draft.mergeConfig?.type !== 'SEPARATE';
    const visualTargets = getVisualTargets(draft);
    const primaryTarget = visualTargets[0];
    const primaryDs = primaryTarget?.kind === 'source'
      ? primaryTarget.dataSource
      : (primaryTarget?.dataSources?.[0] ?? draft.dataSources[0]);
    const normalizedVisualConfigs = Object.fromEntries(
      Object.entries(draft.visualConfigs ?? {}).map(([targetId, config]) => [
        targetId,
        ensureVisualShape(config?.type ?? 'kpi', config ?? {}),
      ]),
    );
    const primaryVc = (primaryTarget && normalizedVisualConfigs[primaryTarget.id]) ?? defaultVisualConfig('kpi');
    const mergedVc = primaryTarget?.kind === 'merged'
      ? primaryVc
      : normalizedVisualConfigs[MERGED_DATA_SOURCE_ID];
    const resolvedTitle = (skipSourceStep ? widget?.title?.trim() : '') ||
      (primaryTarget ? getVisualTargetTitle(primaryTarget, draft.visualConfigs) : '') ||
      primaryDs?.sourceName ||
      '새 위젯';
    const resolvedModule = primaryDs?.module && primaryDs.module !== 'CUSTOM'
      ? primaryDs.module
      : (widget?.module ?? MODULE_LIST[0]);
    const primaryGroup = primaryTarget?.kind === 'merged'
      ? (draft.mergeConfig?.mergeGroups ?? []).find((group) => group.id === primaryTarget.id)
      : null;

    const finalWidget = {
      ...widget,
      title: resolvedTitle,
      module: resolvedModule,
      widgetOptions: {
        dataSourceMode:    'MULTIPLE',
        dataSources:       draft.dataSources,
        parameterMappings,
        columnMappings:    draft.columnMappings,
        mergeConfig:       isMerged
          ? { ...draft.mergeConfig, ...(primaryGroup ?? {}), visualConfig: mergedVc }
          : draft.mergeConfig,
        visualConfigs:     normalizedVisualConfigs,
        visualConfig:      primaryVc,
        dataConfig: ['TABLE', 'VIEW'].includes(primaryDs?.sourceType) ? {
          dataSourceId: primaryDs?.id,
          sourceType: primaryDs?.sourceType,
          sourceName: primaryDs.sourceName,
          schema: primaryDs.schema ?? 'dbo',
          tableConfig: primaryDs.tableConfig ?? {},
          params: [],
          fallbackData: [],
          timeout: 0,
        } : null,
      },
    };
    onChange(finalWidget);
    onFinish?.(finalWidget);
  }

  // ─── Validation ──────────────────────────────────────────────────────────

  const stepValid = useMemo(() => {
    const vSource = draft.dataSources.length > 0
      && draft.dataSources.every((ds) => ds.sourceType && ds.sourceName?.trim());

    const visualTargets = getVisualTargets(draft);
    const hasAnyData = draft.dataSources.some((ds) => (visualTestResults[ds.id]?.rows ?? []).length > 0)
      || visualTargets.some((target) =>
        target.kind === 'merged' &&
        ((visualTestResults[target.id] ?? visualTestResults[MERGED_DATA_SOURCE_ID])?.rows ?? []).length > 0
      );
    const vTest = hasAnyData;

    function isVcValid(vc) {
      if (!vc) return false;
      const t = vc.type;
      if (t === 'kpi') return Boolean(vc.valueField);
      if (['bar', 'bar_stacked', 'bar_h', 'line', 'area'].includes(t))
        return Boolean(vc.xField) && (vc.yFields?.length ?? 0) > 0;
      if (t === 'bar_line') return Boolean(vc.xField) && (vc.series?.length ?? 0) > 0;
      if (['pie', 'doughnut'].includes(t)) return Boolean(vc.labelField) && Boolean(vc.valueField);
      if (t === 'table') return (vc.columns?.length ?? 0) > 0;
      return false;
    }
    const vVisual = hasAnyData && visualTargets.every((target) => {
      const rows = target.kind === 'merged'
        ? ((visualTestResults[target.id] ?? visualTestResults[MERGED_DATA_SOURCE_ID])?.rows ?? [])
        : (visualTestResults[target.id]?.rows ?? []);
      return rows.length > 0 ? isVcValid(draft.visualConfigs?.[target.id]) : true;
    });
    const vMapping = visualTargets.length > 0;

    return skipSourceStep
      ? [vTest, true, vVisual, true]
      : [vSource, vTest, vMapping, vVisual, true];
  }, [widget, draft, visualTestResults, skipSourceStep]);

  const isLast        = activeStep === STEP_LABELS.length - 1;
  const isConfirmStep = activeStep === CONFIRM_IDX;
  const isSourceStep  = activeStep === SOURCE_IDX;
  const isTestStep    = activeStep === TEST_IDX;
  const isMappingStep = activeStep === MAPPING_IDX;
  const isVisualStep  = activeStep === VISUAL_IDX;
  const showBackBtn   = activeStep > 0 || Boolean(onBack);
  const nonTableSourceIds = new Set(
    draft.dataSources.filter((ds) => ds.sourceType !== 'TABLE').map((ds) => ds.id)
  );
  const testParamCount = draft.parameterMappings.filter((pm) =>
    nonTableSourceIds.has(pm.dataSourceId)
  ).length;
  const hasTestParamInputs = testParamCount > 0 || draft.dataSources.some((ds) =>
    ds.sourceType !== 'TABLE' && (ds.params ?? []).length > 0
  );
  const showTestParamsPanel = hasTestParamInputs && !testParamsCollapsed;
  const canFinish = stepValid.every(Boolean);


  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Stepper header ──────────────────────────────────────────────── */}
      <Box sx={{ px: 2, pt: skipSourceStep ? 1 : 2, pb: skipSourceStep ? 0.75 : 1, borderBottom: '1px solid #e2e8f0' }}>
        <Stepper activeStep={activeStep} nonLinear alternativeLabel={!skipSourceStep}>
          {STEP_LABELS.map((label, index) => (
            <Step key={label}>
              <StepLabel
                onClick={() => handleStepClick(index)}
                aria-disabled={!canNavigateToStep(index)}
                sx={{
                  cursor: activeStep === index
                    ? 'default'
                    : 'pointer',
                  opacity: 1,
                  '& .MuiStepLabel-label': { fontSize: 11, fontWeight: 600, mt: 0.5 },
                }}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* ── Step content ────────────────────────────────────────────────── */}
      <Box sx={{ flex: 1, minHeight: 0, overflow: isSourceStep || isTestStep || isMappingStep || isVisualStep || isConfirmStep ? 'hidden' : 'auto', p: isSourceStep ? 0 : skipSourceStep ? 1.25 : 2 }}>

        {/* Step SOURCE_IDX: 소스 & 기본 정보 */}
        {isSourceStep && (
          <DirectSourcePanel
            draft={draft}
            onDraftChange={handleDraftChange}
          />
        )}

        {/* Step TEST_IDX: 테스트 실행 */}
        {isTestStep && (
          <Box
            sx={{
              height: '100%',
              minHeight: 0,
              display: 'grid',
              gridTemplateColumns: showTestParamsPanel
                ? { xs: '1fr', xl: '520px minmax(0, 1fr)' }
                : '1fr',
              gap: 1.25,
              overflow: 'hidden',
            }}
          >
            {showTestParamsPanel && (
              <Box sx={{ minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 1 }}>
                {skipSourceStep && (
                  <CompactAiSourceConfig
                    dataSource={draft.dataSources[0]}
                    widget={widget}
                    onWidgetChange={handleWidgetChange}
                    allModules={allModules ?? MODULE_LIST}
                    paramCount={testParamCount}
                  />
                )}
                <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', border: '1px solid #e5eaf2', borderRadius: '8px', bgcolor: '#fbfcfe', display: 'flex', flexDirection: 'column' }}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ px: 1.25, py: 0.75, borderBottom: '1px solid #e5eaf2', bgcolor: '#fff' }}
                  >
                    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontSize: 12, fontWeight: 900, color: '#334155' }}>
                        파라미터
                      </Typography>
                      <Chip
                        size="small"
                        label={`${testParamCount}개`}
                        sx={{ height: 20, fontSize: 10, bgcolor: '#eff6ff', color: '#2563eb', fontWeight: 800 }}
                      />
                    </Stack>
                    <Tooltip title="파라미터 영역 접기">
                      <IconButton
                        size="small"
                        onClick={() => setTestParamsCollapsed(true)}
                        sx={{ width: 26, height: 26, color: '#475569' }}
                      >
                        <KeyboardDoubleArrowLeftIcon sx={{ width: 18, height: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                  <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', p: 1 }}>
                    <Step2_ParamMapping
                      draft={draft}
                      onDraftChange={handleDraftChange}
                      compact
                      hideEmpty
                      mode="test"
                    />
                  </Box>
                </Box>
              </Box>
            )}

            <Box sx={{ minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: testParamsCollapsed && hasTestParamInputs ? 1 : 0 }}>
              {testParamsCollapsed && hasTestParamInputs && (
                <Box
                  sx={{
                    border: '1px solid #dbe6f3',
                    borderRadius: '8px',
                    bgcolor: '#f8fbff',
                    px: 1,
                    py: 0.75,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                  }}
                >
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<KeyboardDoubleArrowRightIcon sx={{ width: 16, height: 16 }} />}
                    onClick={() => setTestParamsCollapsed(false)}
                    sx={{ fontSize: 11, fontWeight: 800, textTransform: 'none', borderRadius: '6px', py: 0.25 }}
                  >
                    파라미터 펼치기
                  </Button>
                </Box>
              )}
              <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                <Step3_TestAndMapping
                  draft={draft}
                  onDraftChange={handleDraftChange}
                  testResults={testResults}
                  onRunTest={handleRunTest}
                  onRunAll={handleRunAll}
                  onRunMerged={handleRunMerged}
                  compact={skipSourceStep}
                  section="test"
                />
              </Box>
            </Box>
          </Box>
        )}

        {/* Step MAPPING_IDX: 데이터/파라미터 매핑 */}
        {isMappingStep && (
          <StepMapping
            draft={draft}
            onDraftChange={handleDraftChange}
            compact={skipSourceStep}
            testResults={testResults}
            onRunTest={handleRunTest}
            onRunMerged={handleRunMerged}
          />
        )}

        {/* Step VISUAL_IDX: 시각화 */}
        {isVisualStep && (
          <Box sx={{ height: '100%', minHeight: 0, overflow: 'hidden' }}>
            <Step4_VisualAndPreview
              draft={draft}
              onDraftChange={handleDraftChange}
              testResults={visualTestResults}
            />
          </Box>
        )}

        {/* Step CONFIRM_IDX: 최종 확인 */}
        {isConfirmStep && (
          <StepConfirm draft={draft} testResults={visualTestResults} />
        )}
      </Box>

      {/* ── Bottom navigation ───────────────────────────────────────────── */}
      <Box sx={{ px: 2, pt: 1.5, pb: 2, borderTop: '1px solid #e2e8f0' }}>
        <Stack direction="row" justifyContent={showBackBtn ? 'space-between' : 'flex-end'}>
          {showBackBtn && (
            <Button
              variant="outlined"
              size="small"
              startIcon={activeStep === 0 && onBack ? <ArrowBackIcon sx={{ fontSize: 14 }} /> : undefined}
              onClick={() => activeStep > 0 ? goToStep(activeStep - 1) : onBack?.()}
              sx={{
                fontSize: 12,
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: '6px',
                color: '#1976d2',
                borderColor: '#90caf9',
                bgcolor: '#f8fbff',
                '&:hover': { borderColor: '#1976d2', bgcolor: '#eff6ff' },
              }}
            >
              {activeStep === 0 && onBack ? (backLabel ?? 'AI 분석으로 돌아가기') : '이전'}
            </Button>
          )}
          {isLast ? (
            <Button
              variant="contained" size="small" disableElevation
              onClick={handleFinish}
              disabled={!canFinish}
              sx={{ fontSize: 12, textTransform: 'none', fontWeight: 700, borderRadius: '6px', px: 2 }}
            >
              {finishButtonLabel}
            </Button>
          ) : (
            <Button
              variant="contained" size="small" disableElevation
              onClick={handleNextStep}
              sx={{ fontSize: 12, textTransform: 'none', fontWeight: 600, borderRadius: '6px' }}
            >
              다음
            </Button>
          )}
        </Stack>
      </Box>
    </Box>
  );
}
