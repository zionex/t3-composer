import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Box, Button } from '@mui/material';

import WidgetInfoDialog from '../../../dialogs/WidgetInfoDialog';
import { defaultVisualConfig } from '../../direct/steps/wizardConstants';
import { useMultiTestQuery } from '../../direct/steps/useMultiTestQuery';
import { useBusinessTreeSource, deriveWidgetSuggestions, isNoUseColumn } from '../hooks/useBusinessTreeSource';
import { getBusinessTreeCandidates, saveWidgetToLibrary } from '../../../../../../restapi/widgetBuilder';

import {
  summarizeDescription,
  pickVisibleSuggestions,
  relatedTableMatchScore,
  deriveVirtualMeasures,
  groupDimensions,
  mergeCodeNamePairs,
  buildPrefillFields,
} from './domainBrowseUtils';
import { StepIndicator, CandidateSourceDialog } from './DomainBrowseShared';
import NavBar from './NavBar';
import Step1Panel from './Step1Panel';
import Step2Panel from './Step2Panel';
import Step3Panel from './Step3Panel';
import Step4Panel from './Step4Panel';

const VISIBLE_SUGGESTION_COUNT = 12;
const MAX_SUGGESTION_COUNT = 80;
const DOMAIN_SOURCE_PREFIX = 'domain_source_';

function filterCandidateColumns(columns) {
  if (!Array.isArray(columns)) return columns;
  return columns.filter((column) => typeof column === 'string' || (column?.name && !isNoUseColumn(column)));
}

function sanitizeBusinessCandidate(candidate) {
  if (!candidate) return candidate;
  return {
    ...candidate,
    columns: filterCandidateColumns(candidate.columns),
    matched_columns: filterCandidateColumns(candidate.matched_columns),
    required_columns: filterCandidateColumns(candidate.required_columns),
    optional_columns: filterCandidateColumns(candidate.optional_columns),
  };
}

export default function DomainBrowseTab({
  library = [],
  libraryLoading = false,
  isAdmin = false,
  userId,
  onLibrarySaved,
  onSelect,
}) {
  const { loading, error, availableModules, loadModule, keywords, primaryKeywords, keywordNames, keywordDescriptions, tablesForKeyword, columnsForKeyword } = useBusinessTreeSource();

  const [step, setStep] = useState(1);
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedKeyword, setSelectedKeyword] = useState('');
  const [modulePanelOpen, setModulePanelOpen] = useState(true);
  const [keywordPanelOpen, setKeywordPanelOpen] = useState(true);
  const [dataPanelOpen, setDataPanelOpen] = useState(true);
  const [selectedMetrics, setSelectedMetrics] = useState(new Set());
  const [selectedDimensions, setSelectedDimensions] = useState(new Set());
  const [candidates, setCandidates] = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [candidatesError, setCandidatesError] = useState(null);
  const [selectedTables, setSelectedTables] = useState(new Set());
  const [step4Tab, setStep4Tab] = useState('candidates');
  const [chartType, setChartType] = useState('bar');
  const [widgetTitle, setWidgetTitle] = useState('');
  const [visualConfigs, setVisualConfigs] = useState({});
  const { results: visualTestResults, runAll: runAllTests } = useMultiTestQuery();
  const [infoWidget, setInfoWidget] = useState(null);
  const [draftInfoWidget, setDraftInfoWidget] = useState(null);
  const [savingDraftWidget, setSavingDraftWidget] = useState(false);
  const [suggestionRefreshSeed, setSuggestionRefreshSeed] = useState(0);
  const [sourceCandidate, setSourceCandidate] = useState(null);
  const [step2AdvancedOpen, setStep2AdvancedOpen] = useState(false);
  const [step2RawColsOpen, setStep2RawColsOpen] = useState(false);
  const [step2Tab, setStep2Tab] = useState('measure'); // 'measure' | 'dimension'

  const moduleOptions = availableModules;
  // const moduleOptions = availableModules.length > 0 ? availableModules : FALLBACK_MODULES;

  useEffect(() => {
    if (moduleOptions.length > 0 && !selectedModule) setSelectedModule(moduleOptions[0]);
  }, [moduleOptions, selectedModule]);

  useEffect(() => {
    if (selectedModule) loadModule(selectedModule);
  }, [selectedModule, loadModule]);

  const allColumns = useMemo(
    () => (selectedKeyword ? columnsForKeyword(selectedKeyword) : []),
    [selectedKeyword, columnsForKeyword],
  );
  const measures = useMemo(() => allColumns.filter((c) => c.role === 'measure'), [allColumns]);
  const dimensions = useMemo(
    () => allColumns.filter((c) => ['dimension', 'time', 'id'].includes(c.role)),
    [allColumns],
  );
  const hasMeasures = measures.length > 0;
  const virtualMeasures = useMemo(
    () => (hasMeasures ? [] : deriveVirtualMeasures(allColumns)),
    [allColumns, hasMeasures],
  );
  const rawDimGroups = useMemo(() => groupDimensions(dimensions), [dimensions]);
  const dimGroups = useMemo(
    () => rawDimGroups.map((g) => {
      if (hasMeasures && g.groupLabel === '항목/코드 기준') {
        return { ...g, cols: mergeCodeNamePairs(g.cols) };
      }
      return g;
    }),
    [hasMeasures, rawDimGroups],
  );
  const allMeasureDisplayItems = hasMeasures ? measures : virtualMeasures;
  const allDimDisplayItems = useMemo(() => dimGroups.flatMap((g) => g.cols), [dimGroups]);

  const tables = useMemo(() => tablesForKeyword(selectedKeyword), [selectedKeyword, tablesForKeyword]);
  const relatedWidgets = useMemo(() => {
    if (!selectedKeyword || tables.length === 0) return [];
    return (library || [])
      .map((w) => ({ widget: w, score: relatedTableMatchScore(w, tables) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score || String(a.widget.title ?? '').localeCompare(String(b.widget.title ?? '')))
      .map(({ widget }) => widget);
  }, [library, selectedKeyword, tables]);

  const suggestions = useMemo(
    () => {
      const label = keywordNames?.[selectedKeyword] || selectedKeyword;
      return selectedKeyword && tables.length > 0 ? deriveWidgetSuggestions(label, tables).slice(0, MAX_SUGGESTION_COUNT) : [];
    },
    [keywordNames, selectedKeyword, tables],
  );
  const visibleSuggestions = useMemo(() => {
    return pickVisibleSuggestions(suggestions, suggestionRefreshSeed, VISIBLE_SUGGESTION_COUNT);
  }, [suggestionRefreshSeed, suggestions]);
  const canRefreshSuggestions = suggestions.length > VISIBLE_SUGGESTION_COUNT;

  useEffect(() => {
    setSuggestionRefreshSeed(0);
  }, [selectedModule, selectedKeyword]);

  const tablesByRole = useMemo(() => {
    const groups = {};
    tables.forEach((t) => {
      const role = t.table_role || 'CONFIG';
      if (!groups[role]) groups[role] = [];
      groups[role].push(t);
    });
    return groups;
  }, [tables]);

  const visualSelectedColumns = useMemo(
    () => new Set([...selectedMetrics, ...selectedDimensions]),
    [selectedMetrics, selectedDimensions],
  );

  const visualDataSources = useMemo(() => {
    const tableByName = new Map(tables.map((t) => [t.name, t]));
    const selectedNames = [...selectedTables];
    const sourceTables = selectedNames
      .map((name) => tableByName.get(name) || candidates.find((c) => c.table_name === name))
      .filter(Boolean);

    // allColumns: 현 모듈/키워드의 전체 컬럼 메타 (role 포함). role lookup용 Map 구성.
    const colMetaByName = new Map(
      allColumns.map((c) => [c.name, { name: c.name, role: c.role || '', type: c.type || '' }]),
    );

    return sourceTables.map((table, index) => {
      const tableName = table.name || table.table_name || selectedNames[index];
      const hasKnownColumnList = Array.isArray(table.columns);
      const tableColumns = hasKnownColumnList ? table.columns : [];
      const candidateColumns = [
        ...(table.matched_columns || []),
        ...(table.required_columns || []),
        ...(table.optional_columns || []),
      ];
      const rawCols = (tableColumns.length > 0 ? tableColumns : candidateColumns)
        .filter((col) => col && col.name && !isNoUseColumn(col));
      const allColNames = rawCols.map((col) => col.name);

      // Step 2/3에서 선택한 컬럼만 노출. 선택 없으면 (방어적) 전체 컬럼 fallback.
      const filteredColumns = visualSelectedColumns.size > 0
        ? allColNames.filter((name) => visualSelectedColumns.has(name))
        : allColNames;
      const fallbackColumns = hasKnownColumnList ? [] : allColumns.map((col) => col.name).filter(Boolean);
      let finalColumns = visualSelectedColumns.size > 0
        ? filteredColumns
        : (allColNames.length > 0 ? allColNames : fallbackColumns);

      // measure만 남아 X축 후보가 없으면 rawCols에서 time→dimension→id 순으로 axis 1개 보충.
      // 이 컬럼은 X축 드롭다운에만 추가되며, 사용자 선택 컬럼(Y축)은 변경되지 않음.
      if (visualSelectedColumns.size > 0 && finalColumns.length > 0) {
        const finalColSet = new Set(finalColumns);
        const hasAxisCandidate = finalColumns.some((name) => {
          const role = colMetaByName.get(name)?.role
            || rawCols.find((c) => c.name === name)?.role || '';
          return !['measure', 'no_use'].includes(role);
        });
        if (!hasAxisCandidate) {
          const AXIS_ROLE_ORDER = { time: 0, dimension: 1, id: 2 };
          const bestAxis = rawCols.slice()
            .sort((a, b) => {
              const ar = colMetaByName.get(a.name)?.role || a.role || '';
              const br = colMetaByName.get(b.name)?.role || b.role || '';
              return (AXIS_ROLE_ORDER[ar] ?? 3) - (AXIS_ROLE_ORDER[br] ?? 3);
            })
            .find((c) => {
              const role = colMetaByName.get(c.name)?.role || c.role || '';
              return !finalColSet.has(c.name) && !['measure', 'no_use'].includes(role);
            });
          if (bestAxis) {
            finalColumns = [bestAxis.name, ...finalColumns];
          }
        }
      }

      // columnMeta: prefill role 판정용. allColumns에 있으면 그것, 없으면 row 자체에서 role 추론.
      const columnMeta = finalColumns.map((name) => {
        const fromAll = colMetaByName.get(name);
        if (fromAll) return fromAll;
        const fromRaw = rawCols.find((c) => c.name === name);
        return { name, role: fromRaw?.role || '', type: fromRaw?.type || '' };
      });

      const description = table.description || table.comment || '';
      return {
        id: `${DOMAIN_SOURCE_PREFIX}${tableName}`,
        sourceType: 'TABLE',
        sourceName: tableName,
        tableName,
        schema: table.schema || 'dbo',
        module: selectedModule,
        columns: finalColumns,
        columnMeta,
        mockData: [],
        displayLabel: summarizeDescription(description, tableName),
        tableConfig: {
          columns: finalColumns,
          whereConditions: [],
          orderBy: [],
        },
      };
    }).filter((ds) => visualSelectedColumns.size === 0 || ds.columns.length > 0);
  }, [allColumns, candidates, selectedModule, selectedTables, tables, visualSelectedColumns]);

  const visualDraft = useMemo(() => ({
    dataSourceMode: 'MULTIPLE',
    dataSources: visualDataSources,
    parameterMappings: [],
    columnMappings: {},
    mergeConfig: {
      enabled: false,
      type: 'SEPARATE',
      individualSourceIds: visualDataSources.map((ds) => ds.id),
    },
    visualConfigs,
  }), [visualDataSources, visualConfigs]);

  // Step 4 진입 시 각 datasource에 대해 실제 SELECT 자동 실행
  useEffect(() => {
    if (step !== 4) return;
    if (visualDataSources.length === 0) return;
    const needRun = visualDataSources.filter((ds) => {
      const result = visualTestResults[ds.id];
      const resultColumns = result?.columns ?? [];
      const selectedColumns = ds.columns ?? [];
      const sameColumns = resultColumns.length === selectedColumns.length
        && resultColumns.every((column, index) => column === selectedColumns[index]);
      return !result?.executed || !sameColumns;
    });
    if (needRun.length === 0) return;
    runAllTests(needRun, []);
    // visualTestResults는 deps에서 제외 (runAllTests가 setState 호출 → 무한 루프 방지)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, visualDataSources]);

  useEffect(() => {
    if (visualDataSources.length === 0) return;
    setVisualConfigs((prev) => {
      const nextIds = visualDataSources.map((ds) => ds.id);
      const next = {};
      visualDataSources.forEach((ds, index) => {
        if (prev[ds.id]) {
          next[ds.id] = prev[ds.id];
          return;
        }
        const chart = index === 0 ? chartType : 'table';
        const meta = ds.columnMeta || [];
        const prefill = buildPrefillFields(chart, meta, {
          metrics: selectedMetrics,
          dimensions: selectedDimensions,
          filters: selectedDimensions,
        });
        next[ds.id] = {
          ...defaultVisualConfig(chart),
          ...prefill,
          widgetTitle: ds.displayLabel || ds.sourceName,
        };
      });
      const prevIds = Object.keys(prev);
      const hasSameSources = prevIds.length === nextIds.length && nextIds.every((id) => prev[id]);
      return hasSameSources ? prev : next;
    });
  }, [chartType, selectedKeyword, selectedMetrics, selectedDimensions, visualDataSources, widgetTitle]);

  // 추천 차트 카드 클릭 → chartType 변경 + first datasource visualConfig 강제 갱신
  const handleSelectRecommendedChart = useCallback((nextChart) => {
    setChartType(nextChart);
    const firstDs = visualDataSources[0];
    if (!firstDs) return;
    const meta = firstDs.columnMeta || [];
    const prefill = buildPrefillFields(nextChart, meta, {
      metrics: selectedMetrics,
      dimensions: selectedDimensions,
      filters: selectedDimensions,
    });
    setVisualConfigs((prev) => ({
      ...prev,
      [firstDs.id]: {
        ...defaultVisualConfig(nextChart),
        ...prefill,
        widgetTitle: prev[firstDs.id]?.widgetTitle || firstDs.displayLabel || firstDs.sourceName,
      },
    }));
  }, [visualDataSources, selectedMetrics, selectedDimensions]);

  function resetWizard() {
    setStep(1);
    setSelectedKeyword('');
    setSelectedMetrics(new Set());
    setSelectedDimensions(new Set());
    setCandidates([]);
    setSelectedTables(new Set());
    setChartType('bar');
    setWidgetTitle('');
    setVisualConfigs({});
  }

  function handleModuleChange(mod) {
    if (mod === selectedModule) { if (error) loadModule(mod); return; }
    resetWizard();
    setSelectedModule(mod);
  }

  function toggleSet(setter, value) {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value); else next.add(value);
      return next;
    });
  }

  function handleDimToggle(item) {
    if (item.isMerged) {
      setSelectedDimensions((prev) => {
        const next = new Set(prev);
        if (next.has(item.name)) {
          next.delete(item.name);
          next.delete(item.pairedName);
        } else {
          next.add(item.name);
          next.add(item.pairedName);
        }
        return next;
      });
    } else {
      toggleSet(setSelectedDimensions, item.name);
    }
  }

  async function goToDataCandidates() {
    setCandidatesError(null);
    setCandidatesLoading(true);
    try {
      const data = await getBusinessTreeCandidates({
        module: selectedModule,
        keyword: selectedKeyword,
        selected_metrics: [...selectedMetrics],
        selected_dimensions: [...selectedDimensions],
        selected_filters: [],
      });
      const list = Array.isArray(data) ? data.map(sanitizeBusinessCandidate) : [];
      setCandidates(list);
      setSelectedTables(new Set(list.filter((c) => c.score > 0).filter((_, index) => index < 2).map((c) => c.table_name)));
    } catch (e) {
      setCandidatesError(e?.message || '후보 조회 실패');
    } finally {
      setCandidatesLoading(false);
    }
    setStep(3);
  }

  function openCandidateSource(candidate) {
    const tableName = candidate?.table_name || candidate?.name;
    const visualSource = visualDataSources.find((ds) => ds.tableName === tableName || ds.sourceName === tableName);
    setSourceCandidate({
      ...candidate,
      schema: visualSource?.schema || candidate?.schema,
      tableConfig: visualSource?.tableConfig || candidate?.tableConfig,
    });
  }

  function buildSuggestedWidgetPayload(suggestion) {
    const table = tables.find((t) => t.name === suggestion.tableName) || {};
    const tableName = suggestion.tableName || table.name || selectedKeyword;
    const schema = table.schema || 'dbo';
    const columns = Array.isArray(suggestion.columns) && suggestion.columns.length > 0
      ? suggestion.columns
      : (table.columns || []).map((col) => col.name).filter(Boolean);
    const columnMeta = columns
      .map((name) => (table.columns || []).find((col) => col.name === name))
      .filter(Boolean)
      .map((col) => ({
        name: col.name,
        type: col.type,
        role: col.role,
        comment: col.comment,
        description: col.description || col.comment,
      }));
    const visualConfig = {
      ...defaultVisualConfig(suggestion.type || 'table'),
      ...(suggestion.visualConfig || {}),
      type: suggestion.type || suggestion.visualConfig?.type || 'table',
      widgetTitle: suggestion.name,
    };
    if (visualConfig.type === 'table' && (!Array.isArray(visualConfig.columns) || visualConfig.columns.length === 0)) {
      visualConfig.columns = columns;
    }

    const sourceId = `${DOMAIN_SOURCE_PREFIX}${tableName}`;
    return {
      title: suggestion.name || tableName,
      description: table.description || table.comment || keywordDescriptions[selectedKeyword] || '',
      module: selectedModule,
      widget_type: visualConfig.type,
      spec_json: {
        widgetTitle: suggestion.name || tableName,
        widgetType: visualConfig.type,
        dataConfig: {
          sourceType: 'TABLE',
          sourceName: tableName,
          schema,
          columnMeta,
          tableConfig: {
            columns,
            columnMeta,
            whereConditions: [],
            orderBy: [],
          },
          params: {},
          fallbackData: [],
          timeout: 0,
        },
        dataSource: {
          id: sourceId,
          type: 'TABLE',
          name: tableName,
          sourceName: tableName,
          schema,
          module: selectedModule,
          columnMeta,
          mockData: [],
        },
        dataSources: [{
          id: sourceId,
          sourceType: 'TABLE',
          sourceName: tableName,
          schema,
          module: selectedModule,
          columns,
          columnMeta,
          tableConfig: {
            columns,
            columnMeta,
            whereConditions: [],
            orderBy: [],
          },
          mockData: [],
        }],
        paramBindings: [],
        visualConfig,
      },
    };
  }

  function handleOpenSuggestedWidgetDetail(suggestion) {
    if (!suggestion) return;
    setDraftInfoWidget(buildSuggestedWidgetPayload(suggestion));
  }

  async function handleSaveDraftWidget(widget) {
    if (!widget) return;
    setSavingDraftWidget(true);
    try {
      await saveWidgetToLibrary({
        ...widget,
        created_by: userId,
      });
      await onLibrarySaved?.();
      setDraftInfoWidget(null);
    } catch (e) {
      console.error(e);
      setCandidatesError('저장 실패: ' + (e?.message || ''));
    } finally {
      setSavingDraftWidget(false);
    }
  }

  function handleCreateWidget() {
    const primarySource = visualDataSources[0];
    const primaryVisualConfig = primarySource
      ? visualConfigs[primarySource.id] || defaultVisualConfig('table')
      : defaultVisualConfig('table');
    const selectedCategoryLabel = keywordNames?.[selectedKeyword] || selectedKeyword;
    const finalTitle = primaryVisualConfig.widgetTitle?.trim() || widgetTitle || selectedCategoryLabel;
    const spec = {
      widgetType: primaryVisualConfig.type || 'table',
      visualConfig: primaryVisualConfig,
      visualConfigs,
      dataSources: visualDataSources.map((ds) => ({
        id: ds.id,
        tableName: ds.tableName,
        sourceName: ds.sourceName,
        sourceType: ds.sourceType,
        columns: ds.columns,
      })),
      dataConfig: {
        metrics: [...selectedMetrics],
        dimensions: [...selectedDimensions],
        filters: [],
      },
    };
    onSelect?.({ title: finalTitle, widget_type: primaryVisualConfig.type || 'table', module: selectedModule, spec_json: spec });
  }

  // ── Layout ───────────────────────────────────────────────────────────────
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%', minHeight: 0, overflow: 'hidden' }}>
      <StepIndicator step={step} />

      <Box sx={{ display: 'flex', flex: '1 1 0%', minHeight: 0, flexDirection: 'column', overflow: 'hidden' }}>
        {step === 1 && (
          <Step1Panel
            modulePanelOpen={modulePanelOpen}
            setModulePanelOpen={setModulePanelOpen}
            keywordPanelOpen={keywordPanelOpen}
            setKeywordPanelOpen={setKeywordPanelOpen}
            dataPanelOpen={dataPanelOpen}
            setDataPanelOpen={setDataPanelOpen}
            isAdmin={isAdmin}
            selectedKeyword={selectedKeyword}
            setSelectedKeyword={setSelectedKeyword}
            moduleOptions={moduleOptions}
            selectedModule={selectedModule}
            loading={loading}
            error={error}
            keywords={keywords}
            keywordNames={keywordNames}
            keywordDescriptions={keywordDescriptions}
            tables={tables}
            tablesByRole={tablesByRole}
            visibleSuggestions={visibleSuggestions}
            canRefreshSuggestions={canRefreshSuggestions}
            setSuggestionRefreshSeed={setSuggestionRefreshSeed}
            handleModuleChange={handleModuleChange}
            handleOpenSuggestedWidgetDetail={handleOpenSuggestedWidgetDetail}
            primaryKeywords={primaryKeywords}
          />
        )}
        {step === 2 && (
          <Step2Panel
            hasMeasures={hasMeasures}
            measures={measures}
            virtualMeasures={virtualMeasures}
            dimGroups={dimGroups}
            dimensions={dimensions}
            allMeasureDisplayItems={allMeasureDisplayItems}
            allDimDisplayItems={allDimDisplayItems}
            selectedMetrics={selectedMetrics}
            setSelectedMetrics={setSelectedMetrics}
            selectedDimensions={selectedDimensions}
            step2Tab={step2Tab}
            setStep2Tab={setStep2Tab}
            step2AdvancedOpen={step2AdvancedOpen}
            setStep2AdvancedOpen={setStep2AdvancedOpen}
            step2RawColsOpen={step2RawColsOpen}
            setStep2RawColsOpen={setStep2RawColsOpen}
            chartType={chartType}
            handleSelectRecommendedChart={handleSelectRecommendedChart}
            toggleSet={toggleSet}
            handleDimToggle={handleDimToggle}
          />
        )}
        {step === 3 && (
          <Step3Panel
            step4Tab={step4Tab}
            setStep4Tab={setStep4Tab}
            candidates={candidates}
            candidatesLoading={candidatesLoading}
            candidatesError={candidatesError}
            selectedTables={selectedTables}
            setSelectedTables={setSelectedTables}
            isAdmin={isAdmin}
            openCandidateSource={openCandidateSource}
            libraryLoading={libraryLoading}
            relatedWidgets={relatedWidgets}
            onSelect={onSelect}
            setInfoWidget={setInfoWidget}
          />
        )}
        {step === 4 && (
          <Step4Panel
            visualDataSources={visualDataSources}
            selectedMetrics={selectedMetrics}
            visualDraft={visualDraft}
            setVisualConfigs={setVisualConfigs}
            visualTestResults={visualTestResults}
          />
        )}
      </Box>

      {step === 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 2, py: 1.25, borderTop: '1px solid #f1f5f9', bgcolor: '#fafafa', flexShrink: 0 }}>
          <Button size="medium" variant="contained" onClick={() => setStep(2)} disabled={!selectedKeyword}>
            다음
          </Button>
        </Box>
      )}
      {step === 2 && (
        <NavBar
          canNext={selectedMetrics.size > 0}
          nextLabel="데이터 후보 확인"
          onNext={goToDataCandidates}
          onBack={() => setStep((s) => s - 1)}
          onCreateWidget={handleCreateWidget}
        />
      )}
      {step === 3 && (
        <NavBar
          canNext={selectedTables.size > 0}
          nextLabel="시각화 설정"
          onNext={() => setStep(4)}
          onBack={() => setStep((s) => s - 1)}
          onCreateWidget={handleCreateWidget}
        />
      )}
      {step === 4 && (
        <NavBar
          showCreate
          canNext={visualDataSources.length > 0}
          onBack={() => setStep((s) => s - 1)}
          onCreateWidget={handleCreateWidget}
        />
      )}

      <WidgetInfoDialog
        widget={infoWidget || draftInfoWidget}
        isDraft={Boolean(draftInfoWidget)}
        savingLibrary={savingDraftWidget}
        onSaveToLibrary={handleSaveDraftWidget}
        onClose={() => { setInfoWidget(null); setDraftInfoWidget(null); }}
        onSelect={(widget) => { onSelect?.(widget); setInfoWidget(null); }}
      />
      <CandidateSourceDialog
        candidate={sourceCandidate}
        open={Boolean(sourceCandidate)}
        onClose={() => setSourceCandidate(null)}
      />
    </Box>
  );
}
