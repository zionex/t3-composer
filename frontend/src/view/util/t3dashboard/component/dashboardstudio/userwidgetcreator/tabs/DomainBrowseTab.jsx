import React, { useState } from 'react';
import {
  Box, Button, CircularProgress, Alert, Stack, Typography,
  Stepper, Step, StepLabel, Tab, Tabs,
  Chip, TextField, MenuItem,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { useDbMetadataSource } from '../hooks/useDbMetadataSource';
import { saveWidgetToLibrary } from '../../../../restapi/widgetBuilder';
import { ChartTypePicker, PalettePicker, DEFAULT_PALETTE } from '../../dashboardbuilder/dialogs/WidgetSettingsDialog';
import { defaultVisualConfig } from '../../popup/steps/wizardConstants';
import { useMultiTestQuery } from '../../popup/steps/useMultiTestQuery';
import KpiRenderer from '../../generic/renderers/KpiRenderer';
import ChartRenderer from '../../generic/renderers/ChartRenderer';
import TableRenderer from '../../generic/renderers/TableRenderer';

const MODULE_LIST = ['SA', 'DP', 'BF', 'MP', 'IM', 'RP', 'SO', 'CM', 'FP', 'FO', 'SNOP', 'CUSTOM'];

const STEP_LABELS = ['소스 탐색', '시각화 설정', '저장'];

function PreviewWidget({ visualConfig, data }) {
  if (!data?.length) return null;
  const type = visualConfig?.type;
  if (type === 'kpi') return <KpiRenderer data={data} config={visualConfig} />;
  if (['bar', 'bar_stacked', 'bar_h', 'line', 'area', 'bar_line', 'pie', 'doughnut'].includes(type))
    return <ChartRenderer data={data} config={visualConfig} />;
  if (type === 'table') return <TableRenderer data={data} config={visualConfig} />;
  return null;
}

export default function DomainBrowseTab({ onSaved, userId }) {
  const { loading, error, domains, categoriesForDomain, sourcesForCategory } = useDbMetadataSource();
  const { results, runTest } = useMultiTestQuery();

  // Step 1 state
  const [selectedDomain, setSelectedDomain] = useState('');
  const [catTab, setCatTab] = useState(0);         // Step1 카테고리 탭 (상위 state — 내부 컴포넌트 unmount 방지)
  const [selectedSource, setSelectedSource] = useState(null);

  // Step 2 state
  const [vizConfig, setVizConfig] = useState(defaultVisualConfig('bar'));
  const [vizTab, setVizTab] = useState(0);          // Step2 탭 0=차트설정, 1=데이터미리보기 (상위 state — 내부 컴포넌트 unmount 방지)
  const [previewParams, setPreviewParams] = useState({});

  // Step 3 state
  const [title, setTitle] = useState('');
  const [moduleOverride, setModuleOverride] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [activeStep, setActiveStep] = useState(0);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;

  const testResult = selectedSource ? results[selectedSource.id] : null;
  const testRows = testResult?.rows ?? [];
  const columns = testRows.length > 0 ? Object.keys(testRows[0]) : [];

  function handleSelectSource(source) {
    setSelectedSource(source);
    setTitle(source.description || source.comment || '');
    setModuleOverride(source.module || 'CUSTOM');
    setVizConfig(defaultVisualConfig('bar'));
    setVizTab(0);
    setPreviewParams({});
    setActiveStep(1);
  }

  function handleBack() {
    if (activeStep > 0) setActiveStep((s) => s - 1);
  }

  async function handleSave() {
    if (!selectedSource || !title.trim()) return;
    setSaving(true);
    setSaveError('');
    try {
      await saveWidgetToLibrary({
        title,
        description: selectedSource.description || selectedSource.comment || '',
        module: moduleOverride || selectedSource.module || 'CUSTOM',
        widget_type: vizConfig.type,
        spec_json: {
          widgetTitle: title,
          widgetType: vizConfig.type,
          dataConfig: {
            sourceType: selectedSource.sourceType || 'STORED_PROCEDURE',
            sourceName: selectedSource.name,
            schema: 'dbo',
            params: [],
            fallbackData: [],
            timeout: 0,
          },
          dataSource: {
            type: selectedSource.sourceType || 'STORED_PROCEDURE',
            name: selectedSource.name,
            module: moduleOverride || selectedSource.module || 'CUSTOM',
          },
          paramBindings: [],
          visualConfig: vizConfig,
        },
        created_by: userId,
      });
      if (onSaved) onSaved();
    } catch (e) {
      setSaveError('저장 실패: ' + (e?.message || ''));
    } finally {
      setSaving(false);
    }
  }

  function Step1_SourceBrowse() {
    const categories = selectedDomain ? categoriesForDomain(selectedDomain) : [];
    // catTab은 DomainBrowseTab 상위 state 사용 (여기서 useState 사용 금지 — 내부 컴포넌트는 리렌더 시 unmount/remount됨)
    const safeCatTab = catTab < categories.length ? catTab : 0;
    const activeCat = categories[safeCatTab] ?? '';
    const sources = selectedDomain && activeCat
      ? sourcesForCategory(selectedDomain, activeCat)
      : [];

    return (
      <Box sx={{ display: 'grid', gridTemplateColumns: '160px 1fr', height: '100%', gap: 0, overflow: 'hidden' }}>
        {/* 좌 사이드바: 도메인 */}
        <Box sx={{ borderRight: '1px solid #e5eaf2', overflowY: 'auto', py: 1 }}>
          <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', px: 1.5, mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            업무 영역
          </Typography>
          {domains.length === 0 && (
            <Typography variant="caption" sx={{ px: 1.5, color: 'text.disabled' }}>등록된 데이터 없음</Typography>
          )}
          {domains.map((domain) => (
            <Box
              key={domain}
              onClick={() => { setSelectedDomain(domain); setCatTab(0); setSelectedSource(null); }}
              sx={{
                px: 1.5, py: 0.75, cursor: 'pointer', fontSize: 13, fontWeight: selectedDomain === domain ? 700 : 400,
                color: selectedDomain === domain ? 'primary.main' : 'text.primary',
                bgcolor: selectedDomain === domain ? '#eff6ff' : 'transparent',
                borderRight: selectedDomain === domain ? '3px solid' : '3px solid transparent',
                borderColor: selectedDomain === domain ? 'primary.main' : 'transparent',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              {domain}
            </Box>
          ))}
        </Box>

        {/* 우: 카테고리 Tabs + 소스 카드 */}
        <Box sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {selectedDomain ? (
            <>
              <Tabs
                value={safeCatTab}
                onChange={(_, v) => setCatTab(v)}
                variant="scrollable" scrollButtons="auto"
                sx={{ borderBottom: '1px solid #e5eaf2', flexShrink: 0, minHeight: 36, '& .MuiTab-root': { minHeight: 36, fontSize: 12, fontWeight: 600 } }}
              >
                {categories.map((cat) => <Tab key={cat} label={cat} />)}
              </Tabs>
              <Box sx={{ flex: 1, overflowY: 'auto', p: 1.5 }}>
                {sources.length === 0 && (
                  <Alert severity="info" sx={{ fontSize: 12 }}>이 카테고리에 데이터가 없습니다.</Alert>
                )}
                <Stack spacing={1}>
                  {sources.map((source) => (
                    <Box
                      key={source.id || source.name}
                      onClick={() => handleSelectSource(source)}
                      sx={{
                        border: source.id === selectedSource?.id ? '1px solid' : '1px solid #e5eaf2',
                        borderColor: source.id === selectedSource?.id ? 'primary.main' : '#e5eaf2',
                        borderRadius: '8px', px: 2, py: 1.5,
                        cursor: 'pointer',
                        bgcolor: source.id === selectedSource?.id ? '#f0f7ff' : '#fff',
                        '&:hover': { borderColor: 'primary.light', bgcolor: '#f0f7ff' },
                      }}
                    >
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
                        {source.description || source.comment || '(설명 없음)'}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            </>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Typography color="text.secondary" sx={{ fontSize: 13 }}>왼쪽에서 업무 영역을 선택하세요.</Typography>
            </Box>
          )}
        </Box>
      </Box>
    );
  }

  function PreviewPanel() {
    if (!selectedSource) return null;
    const visibleParams = (selectedSource?.params ?? []).filter(
      (p) => Boolean(p.description || p.label)
    );
    const isRunning = results[selectedSource?.id]?.loading ?? false;
    const runError = results[selectedSource?.id]?.error ?? null;

    async function handleRun() {
      if (!selectedSource) return;
      const ds = {
        id: selectedSource.id,
        sourceType: selectedSource.sourceType || selectedSource.table_type || 'STORED_PROCEDURE',
        sourceName: selectedSource.name,
        params: (selectedSource.params ?? []).map((p) => ({
          paramName: p.paramName || p.name || p.key,
          defaultValue: previewParams[p.paramName || p.name || p.key] ?? p.defaultValue ?? '',
          dataType: p.dataType || 'STRING',
        })),
      };
      await runTest(ds, []);
    }

    return (
      <Box sx={{ display: 'grid', gridTemplateColumns: visibleParams.length > 0 ? '200px 1fr' : '1fr', height: '100%', overflow: 'hidden' }}>
        {/* 좌: 파라미터 (description 있는 것만) */}
        {visibleParams.length > 0 && (
          <Box sx={{ borderRight: '1px solid #e5eaf2', overflowY: 'auto', p: 1.5 }}>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#64748b', mb: 1 }}>파라미터</Typography>
            <Stack spacing={1.25}>
              {visibleParams.map((p) => {
                const key = p.paramName || p.name || p.key;
                return (
                  <TextField
                    key={key}
                    label={p.description || p.label || key}
                    size="small"
                    fullWidth
                    value={previewParams[key] ?? p.defaultValue ?? ''}
                    onChange={(e) => setPreviewParams((prev) => ({ ...prev, [key]: e.target.value }))}
                  />
                );
              })}
            </Stack>
            <Button
              variant="contained" size="small" sx={{ mt: 1.5 }}
              onClick={handleRun}
              disabled={isRunning}
              startIcon={isRunning ? <CircularProgress size={13} color="inherit" /> : undefined}
            >
              실행
            </Button>
          </Box>
        )}

        {/* 우: 미리보기 */}
        <Box sx={{ overflowY: 'auto', p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {visibleParams.length === 0 && (
            <Button
              variant="outlined" size="small" sx={{ alignSelf: 'flex-start' }}
              onClick={handleRun}
              disabled={isRunning}
              startIcon={isRunning ? <CircularProgress size={13} color="inherit" /> : undefined}
            >
              데이터 실행
            </Button>
          )}
          {runError && <Alert severity="error" sx={{ fontSize: 12 }}>{runError}</Alert>}
          {!runError && testRows.length === 0 && !isRunning && (
            testResult != null
              ? <Alert severity="info" sx={{ fontSize: 12 }}>쿼리 결과가 없습니다.</Alert>
              : <Typography color="text.secondary" sx={{ fontSize: 12 }}>실행 버튼을 눌러 데이터를 불러오세요.</Typography>
          )}
          {testRows.length > 0 && (
            <Box sx={{ border: '1px solid #e5eaf2', borderRadius: '8px', overflow: 'hidden', minHeight: 200 }}>
              <PreviewWidget visualConfig={vizConfig} data={testRows} />
            </Box>
          )}
        </Box>
      </Box>
    );
  }

  function ChartConfigPanel() {
    function patchViz(patch) {
      setVizConfig((prev) => ({ ...prev, ...patch }));
    }

    function handleTypeChange(type) {
      setVizConfig(defaultVisualConfig(type));
    }

    const colOptions = columns.length > 0
      ? columns
      : (selectedSource?.columns || []).map((c) => c.name || c);

    const hasColumns = colOptions.length > 0;
    const type = vizConfig.type;

    return (
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: '100%', overflow: 'hidden' }}>
        {/* 좌: 차트 타입 */}
        <Box sx={{ borderRight: '1px solid #e5eaf2', overflowY: 'auto', p: 1.5 }}>
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#64748b', mb: 1 }}>차트 타입</Typography>
          <ChartTypePicker
            value={vizConfig.type}
            palette={vizConfig.palette || DEFAULT_PALETTE}
            onChange={handleTypeChange}
            compact
          />
        </Box>

        {/* 우: 필드 매핑 */}
        <Box sx={{ overflowY: 'auto', p: 1.5 }}>
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#64748b', mb: 1 }}>필드 매핑</Typography>
          {!hasColumns && (
            <Alert severity="info" sx={{ fontSize: 11, mb: 1 }}>
              데이터 미리보기를 실행하면 필드를 선택할 수 있습니다.
            </Alert>
          )}

          <Stack spacing={1.5}>
            {/* KPI */}
            {type === 'kpi' && (
              <TextField select label="값 필드" size="small" fullWidth
                value={vizConfig.valueField || ''}
                onChange={(e) => patchViz({ valueField: e.target.value })}
                disabled={!hasColumns}
              >
                {colOptions.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </TextField>
            )}

            {/* bar / line / area / bar_stacked / bar_h / bar_line */}
            {['bar', 'bar_stacked', 'bar_h', 'line', 'area', 'bar_line'].includes(type) && (
              <>
                <TextField select label="X축" size="small" fullWidth
                  value={vizConfig.xField || ''}
                  onChange={(e) => patchViz({ xField: e.target.value })}
                  disabled={!hasColumns}
                >
                  {colOptions.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </TextField>
                <TextField select label="Y축" size="small" fullWidth
                  value={vizConfig.yFields?.[0] || ''}
                  onChange={(e) => patchViz({ yFields: [e.target.value] })}
                  disabled={!hasColumns}
                >
                  {colOptions.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </TextField>
              </>
            )}

            {/* pie / doughnut */}
            {['pie', 'doughnut'].includes(type) && (
              <>
                <TextField select label="레이블 필드" size="small" fullWidth
                  value={vizConfig.labelField || ''}
                  onChange={(e) => patchViz({ labelField: e.target.value })}
                  disabled={!hasColumns}
                >
                  {colOptions.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </TextField>
                <TextField select label="값 필드" size="small" fullWidth
                  value={vizConfig.valueField || ''}
                  onChange={(e) => patchViz({ valueField: e.target.value })}
                  disabled={!hasColumns}
                >
                  {colOptions.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </TextField>
              </>
            )}

            {/* table: 컬럼 선택 UI 생략, 전체 컬럼 사용 */}
            {type === 'table' && hasColumns && (
              <Alert severity="success" sx={{ fontSize: 11 }}>
                모든 컬럼({colOptions.length}개)이 테이블에 표시됩니다.
              </Alert>
            )}

            {/* 색상 팔레트 (table, kpi, bar_line 제외) */}
            {!['table', 'kpi', 'bar_line'].includes(type) && (
              <Box>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#64748b', mb: 0.75 }}>색상</Typography>
                <PalettePicker
                  value={vizConfig.palette || DEFAULT_PALETTE}
                  onChange={(p) => patchViz({ palette: p })}
                  compact
                />
              </Box>
            )}
          </Stack>
        </Box>
      </Box>
    );
  }

  function Step2_VisualConfig() {
    // vizTab, setVizTab은 DomainBrowseTab 상위 state 사용 (내부 컴포넌트 unmount 방지)

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {/* 선택 소스 요약 */}
        <Box sx={{ px: 2, py: 1, borderBottom: '1px solid #e5eaf2', flexShrink: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip size="small" label={selectedSource?.business_domain || selectedSource?.module || ''} sx={{ height: 22, fontWeight: 700, bgcolor: '#eff6ff', color: '#2563eb' }} />
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
              {selectedSource?.description || selectedSource?.comment || ''}
            </Typography>
          </Stack>
        </Box>

        {/* 탭: 차트 설정 / 데이터 미리보기 */}
        <Tabs value={vizTab} onChange={(_, v) => setVizTab(v)} sx={{ borderBottom: '1px solid #e5eaf2', flexShrink: 0, minHeight: 36, '& .MuiTab-root': { minHeight: 36, fontSize: 12 } }}>
          <Tab label="⚙ 차트 설정" />
          <Tab label="🔍 데이터 미리보기" />
        </Tabs>

        <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {vizTab === 0 && <ChartConfigPanel />}
          {vizTab === 1 && <PreviewPanel />}
        </Box>
      </Box>
    );
  }

  function Step3_Save() {
    const summaryItems = [
      { label: '데이터', value: selectedSource?.description || selectedSource?.comment || '-' },
      { label: '차트', value: vizConfig.type || '-' },
      ...(vizConfig.xField ? [{ label: 'X축', value: vizConfig.xField }] : []),
      ...(vizConfig.yFields?.length ? [{ label: 'Y축', value: vizConfig.yFields.join(', ') }] : []),
      ...(vizConfig.labelField ? [{ label: '레이블', value: vizConfig.labelField }] : []),
      ...(vizConfig.valueField ? [{ label: '값', value: vizConfig.valueField }] : []),
    ];

    return (
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: '100%', overflow: 'hidden', gap: 0 }}>
        {/* 좌: 설정 요약 */}
        <Box sx={{ borderRight: '1px solid #e5eaf2', p: 2.5, overflowY: 'auto' }}>
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#64748b', mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            설정 요약
          </Typography>
          <Stack spacing={1}>
            {summaryItems.map(({ label, value }, i) => (
              <Box key={`${label}-${i}`} sx={{ display: 'flex', gap: 1 }}>
                <Typography sx={{ fontSize: 12, color: '#94a3b8', minWidth: 48, fontWeight: 600 }}>{label}</Typography>
                <Typography sx={{ fontSize: 12, color: '#1e293b', fontWeight: 500 }}>{value}</Typography>
              </Box>
            ))}
          </Stack>
        </Box>

        {/* 우: 저장 폼 */}
        <Box sx={{ p: 2.5, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {saveError && <Alert severity="error" sx={{ fontSize: 12 }}>{saveError}</Alert>}
          <TextField
            label="위젯 제목"
            size="small"
            fullWidth
            value={title}
            onChange={(e) => { setSaveError(''); setTitle(e.target.value); }}
          />
          <TextField
            select label="업무 영역" size="small" fullWidth
            value={moduleOverride || selectedSource?.module || 'CUSTOM'}
            onChange={(e) => setModuleOverride(e.target.value)}
          >
            {MODULE_LIST.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
          </TextField>
          <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained" size="small"
              onClick={handleSave}
              disabled={saving || !title.trim()}
              startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <SaveIcon />}
            >
              라이브러리 저장
            </Button>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Stepper */}
      <Box sx={{ px: 2, pt: 2, pb: 1, borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {STEP_LABELS.map((label) => (
            <Step key={label}><StepLabel>{label}</StepLabel></Step>
          ))}
        </Stepper>
      </Box>

      {/* Step content — placeholder */}
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', p: 2 }}>
        {activeStep === 0 && <Step1_SourceBrowse />}
        {activeStep === 1 && <Step2_VisualConfig />}
        {activeStep === 2 && <Step3_Save />}
      </Box>

      {/* Bottom nav */}
      <Box sx={{ px: 2, py: 1.5, borderTop: '1px solid #e2e8f0', flexShrink: 0 }}>
        <Stack direction="row" justifyContent={activeStep > 0 ? 'space-between' : 'flex-end'}>
          {activeStep > 0 && (
            <Button size="small" onClick={handleBack}>이전</Button>
          )}
          {activeStep === 1 && (
            <Button variant="contained" size="small" onClick={() => setActiveStep(2)}>
              다음
            </Button>
          )}
        </Stack>
      </Box>
    </Box>
  );
}
