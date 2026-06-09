import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress,
  MenuItem, Stack, Step, StepLabel, Stepper, TextField, Typography,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Step4_VisualAndPreview from './steps/Step4_VisualAndPreview';
import StepConfirm from './steps/StepConfirm';
import { defaultVisualConfig, MODULE_LIST } from './steps/wizardConstants';
import dashboardConfig from '../../../core/dashboardConfig';
import { apiConfig } from '../../../../../restapi/apiconfig';

const SQL_DS_ID = 'sql_source';
const SQL_DIRECT_PREVIEW_LIMIT = 5000;
const STEP_LABELS = ['SQL 작성 및 데이터 설정', '시각화', '최종 확인'];

function detectSqlParams(sql) {
  const matches = [...sql.matchAll(/[:@]([A-Za-z_][A-Za-z0-9_]*)/g)];
  const names = [...new Set(matches.map((m) => m[1]))];
  return names.map((name) => ({ paramName: name, value: '' }));
}

async function executeSqlQuery(sql, params = {}) {
  const response = await apiConfig.makeRequest(
    'POST',
    '/common/execute-sql',
    { sql, params, limit: SQL_DIRECT_PREVIEW_LIMIT },
    { errorMessage: false },
  );
  const data = response?.data;
  if (Array.isArray(data)) {
    return { columns: data.length > 0 ? Object.keys(data[0]) : [], rows: data };
  }
  if (data?.columns && data?.rows) return data;
  return { columns: [], rows: [] };
}

function SqlResultTable({ columns, rows }) {
  return (
    <Box sx={{ height: '100%', minHeight: 0, width: '100%', border: '1px solid #e5eaf2', borderRadius: '6px', overflow: 'auto', bgcolor: '#fff' }}>
      <table style={{ borderCollapse: 'collapse', width: 'max-content', minWidth: '100%', fontSize: 11 }}>
        <thead>
          <tr style={{ backgroundColor: '#f8fafc' }}>
            {columns.map((col) => (
              <th
                key={col}
                style={{
                  position: 'sticky', top: 0, zIndex: 1,
                  padding: '5px 8px', borderBottom: '1px solid #e5eaf2',
                  textAlign: 'left', color: '#475569', fontWeight: 700,
                  whiteSpace: 'nowrap', backgroundColor: '#f8fafc',
                }}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(rows ?? []).map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
              {columns.map((col) => (
                <td
                  key={col}
                  style={{
                    padding: '4px 8px', color: '#334155',
                    whiteSpace: 'nowrap', maxWidth: 160,
                    overflow: 'hidden', textOverflow: 'ellipsis',
                  }}
                >
                  {row[col] == null
                    ? <span style={{ color: '#94a3b8' }}>null</span>
                    : String(row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Box>
  );
}

/**
 * SQL 직접 작성 3단계 위젯 생성 마법사.
 *
 * Props:
 *   allModules        – string[]
 *   finishButtonLabel – string
 *   onFinish          – (finalWidget) => void
 *   onBack            – () => void  (생성 방식 선택 화면으로 복귀)
 */
export default function SqlDirectWizard({
  allModules,
  finishButtonLabel = '완료',
  onFinish,
  onBack,
}) {
  const modules = allModules ?? MODULE_LIST;

  const [activeStep, setActiveStep] = useState(0);
  const [sql, setSql] = useState('');
  const [sqlParams, setSqlParams] = useState([]);
  const [sqlRunning, setSqlRunning] = useState(false);
  const [sqlResult, setSqlResult] = useState(null);

  const [widgetTitle, setWidgetTitle] = useState('');
  const [widgetDescription, setWidgetDescription] = useState('');
  const [widgetModule, setWidgetModule] = useState(modules[0]);
  const [splitPercent, setSplitPercent] = useState(50);
  const splitContainerRef = useRef(null);

  const [draft, setDraft] = useState(() => ({
    dataSourceMode: 'MULTIPLE',
    dataSources: [],
    parameterMappings: [],
    columnMappings: {},
    mergeConfig: {
      enabled: false,
      type: dashboardConfig.defaultMergeType,
      relationships: [],
    },
    visualConfigs: {},
  }));

  const handleSplitResizeStart = useCallback((event) => {
    const container = splitContainerRef.current;
    if (!container) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);

    const rect = container.getBoundingClientRect();
    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const updateSplit = (clientX) => {
      const next = ((clientX - rect.left) / rect.width) * 100;
      setSplitPercent(Math.min(75, Math.max(25, next)));
    };

    const handlePointerMove = (moveEvent) => updateSplit(moveEvent.clientX);
    const handlePointerUp = () => {
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    updateSplit(event.clientX);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }, []);

  const handleSqlChange = useCallback((value) => {
    setSql(value);
    const detected = detectSqlParams(value);
    setSqlParams((prev) =>
      detected.map((p) => {
        const existing = prev.find((ep) => ep.paramName === p.paramName);
        return existing ? { ...p, value: existing.value } : p;
      })
    );
  }, []);

  const handleRunSql = useCallback(async () => {
    if (!sql.trim()) return;
    setSqlRunning(true);
    setSqlResult(null);
    try {
      const params = Object.fromEntries(sqlParams.map((p) => [p.paramName, p.value]));
      const result = await executeSqlQuery(sql, params);
      setSqlResult({ ...result, error: null });

      const virtualDs = {
        id: SQL_DS_ID,
        sourceType: 'SQL',
        sourceName: 'SQL 쿼리',
        module: widgetModule,
        params: sqlParams.map((p) => ({ paramName: p.paramName, dataType: 'STRING' })),
        sql,
        columns: result.columns,
        mockData: result.rows,
      };
      setDraft((prev) => ({
        ...prev,
        dataSources: [virtualDs],
        visualConfigs: { [SQL_DS_ID]: defaultVisualConfig('table') },
      }));
    } catch (err) {
      const detail = err?.response?.data?.detail || err?.message || 'SQL 실행 실패';
      setSqlResult({ columns: [], rows: [], error: detail });
    } finally {
      setSqlRunning(false);
    }
  }, [sql, sqlParams, widgetModule]);

  const testResults = useMemo(() => {
    if (!sqlResult || sqlResult.error) return {};
    return {
      [SQL_DS_ID]: {
        columns: sqlResult.columns,
        rows: sqlResult.rows,
        error: null,
        executed: true,
        loading: false,
        empty: sqlResult.rows.length === 0,
      },
    };
  }, [sqlResult]);

  function patchDraft(patch) {
    setDraft((prev) => ({ ...prev, ...patch }));
  }

  // Step 0 → 1 가능 조건: SQL 실행 성공 + 위젯명 입력
  const canProceed = Boolean(
    sqlResult && !sqlResult.error && sqlResult.columns.length > 0 && widgetTitle.trim()
  );
  const showWidgetTitleRequired = Boolean(
    sqlResult && !sqlResult.error && sqlResult.columns.length > 0 && !widgetTitle.trim()
  );

  // Step 2 (최종 확인) 완료 조건: 시각화 필드 설정 유효
  const canFinish = useMemo(() => {
    const vc = draft.visualConfigs?.[SQL_DS_ID];
    if (!vc) return false;
    const t = vc.type;
    if (t === 'kpi') return Boolean(vc.valueField);
    if (['bar', 'bar_stacked', 'bar_h', 'line', 'area'].includes(t))
      return Boolean(vc.xField) && (vc.yFields?.length ?? 0) > 0;
    if (t === 'bar_line') return Boolean(vc.xField) && (vc.series?.length ?? 0) > 0;
    if (['pie', 'doughnut'].includes(t)) return Boolean(vc.labelField) && Boolean(vc.valueField);
    if (t === 'table') return (vc.columns?.length ?? 0) > 0;
    return false;
  }, [draft.visualConfigs]);

  function handleFinish() {
    const vc = draft.visualConfigs?.[SQL_DS_ID] ?? defaultVisualConfig('table');
    // 최신 상태로 data source 재구성
    const currentVirtualDs = {
      id: SQL_DS_ID,
      sourceType: 'SQL',
      sourceName: 'SQL 쿼리',
      module: widgetModule,
      params: sqlParams.map((p) => ({ paramName: p.paramName, dataType: 'STRING' })),
      sql,
      columns: sqlResult?.columns ?? [],
      mockData: sqlResult?.rows ?? [],
    };
    const finalWidget = {
      key: `sql_${Date.now()}`,
      title: widgetTitle,
      description: widgetDescription,
      module: widgetModule,
      widgetOptions: {
        dataSourceMode: 'MULTIPLE',
        dataSources: [currentVirtualDs],
        parameterMappings: [],
        columnMappings: {},
        mergeConfig: draft.mergeConfig,
        visualConfigs: draft.visualConfigs,
        visualConfig: vc,
        dataConfig: {},
      },
    };
    onFinish?.(finalWidget);
  }

  const isLast = activeStep === STEP_LABELS.length - 1;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Stepper ─────────────────────────────────────────────────────────── */}
      <Box sx={{ px: 2, pt: 2, pb: 1, borderBottom: '1px solid #e2e8f0' }}>
        <Stepper activeStep={activeStep} nonLinear alternativeLabel>
          {STEP_LABELS.map((label, i) => (
            <Step key={label}>
              <StepLabel
                onClick={() => { if (i < activeStep) setActiveStep(i); }}
                sx={{
                  cursor: i < activeStep ? 'pointer' : 'default',
                  '& .MuiStepLabel-label': { fontSize: 11, fontWeight: 600, mt: 0.5 },
                }}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* ── Step 콘텐츠 ─────────────────────────────────────────────────────── */}
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', p: 2, display: 'flex', flexDirection: 'column' }}>

        {/* Step 0: SQL 작성 및 데이터 설정 */}
        {activeStep === 0 && (
          <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>

            {/* 위젯 기본 정보 */}
            <Box sx={{ flexShrink: 0, display: 'grid', gridTemplateColumns: '1fr 1fr 160px', gap: 1.5 }}>
              <TextField
                label="위젯명 *"
                size="small"
                value={widgetTitle}
                onChange={(e) => setWidgetTitle(e.target.value)}
                error={showWidgetTitleRequired}
                helperText={showWidgetTitleRequired ? '위젯명을 입력하세요.' : undefined}
              />
              <TextField
                label="설명"
                size="small"
                value={widgetDescription}
                onChange={(e) => setWidgetDescription(e.target.value)}
              />
              <TextField
                select
                label="모듈"
                size="small"
                value={widgetModule}
                onChange={(e) => setWidgetModule(e.target.value)}
              >
                {modules.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </TextField>
            </Box>

            {/* SQL 에디터(좌) + 실행 결과(우) */}
            <Box ref={splitContainerRef} sx={{ flex: 1, minHeight: 0, display: 'flex', gap: 0, alignItems: 'stretch' }}>

              {/* ── 왼쪽: SQL 에디터 + 파라미터 ── */}
              <Box sx={{ flex: `0 0 calc(${splitPercent}% - 8px)`, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1.5 }}>

                {/* SQL 에디터 */}
                <Box sx={{ flex: 1, minHeight: 0, border: '1px solid #e5eaf2', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ flexShrink: 0, px: 1.5, py: 0.875, backgroundColor: '#f8fafc', borderBottom: '1px solid #e5eaf2' }}
                  >
                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>SQL 에디터</Typography>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={sqlRunning ? <CircularProgress size={12} color="inherit" /> : <PlayArrowIcon />}
                      onClick={handleRunSql}
                      disabled={sqlRunning || !sql.trim()}
                      sx={{ fontSize: 11, fontWeight: 700, textTransform: 'none', borderRadius: '6px', py: 0.35, minWidth: 76 }}
                    >
                      {sqlRunning ? '실행 중' : '실행'}
                    </Button>
                  </Stack>
                  <Box sx={{ flex: 1, minHeight: 0, p: 1, display: 'flex', flexDirection: 'column' }}>
                    <TextField
                      multiline
                      fullWidth
                      size="small"
                      value={sql}
                      onChange={(e) => handleSqlChange(e.target.value)}
                      onKeyDown={(e) => { if (e.ctrlKey && e.key === 'Enter') handleRunSql(); }}
                      placeholder={'SELECT *\nFROM TB_EXAMPLE\nWHERE PLAN_VER_ID = :PLAN_VER_ID'}
                      sx={{
                        flex: 1,
                        '& .MuiOutlinedInput-root': {
                          height: '100%',
                          alignItems: 'flex-start',
                        },
                        '& .MuiInputBase-input': {
                          height: '100% !important',
                          overflow: 'auto !important',
                          fontFamily: '"Cascadia Code", "Fira Code", "Consolas", monospace',
                          fontSize: 12.5,
                          lineHeight: 1.7,
                          boxSizing: 'border-box',
                        },
                      }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, flexShrink: 0 }}>
                      Ctrl+Enter로 실행 &nbsp;·&nbsp; 파라미터: :변수명 또는 @변수명
                    </Typography>
                  </Box>
                </Box>

                {/* 감지된 파라미터 */}
                {sqlParams.length > 0 && (
                  <Box sx={{ flexShrink: 0, border: '1px solid #fed7aa', borderRadius: '8px', overflow: 'hidden' }}>
                    <Box sx={{ px: 1.5, py: 0.875, backgroundColor: '#fff7ed', borderBottom: '1px solid #fed7aa' }}>
                      <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#c2410c' }}>
                        파라미터 ({sqlParams.length}개)
                      </Typography>
                    </Box>
                    <Box sx={{ p: 1.5 }}>
                      <Stack direction="row" flexWrap="wrap" gap={1.5} alignItems="center">
                        {sqlParams.map((p, i) => (
                          <Stack key={p.paramName} direction="row" alignItems="center" spacing={0.75}>
                            <Chip
                              size="small"
                              label={`:${p.paramName}`}
                              sx={{ fontFamily: 'monospace', fontWeight: 700, bgcolor: '#fff7ed', color: '#c2410c', height: 24 }}
                            />
                            <TextField
                              size="small"
                              placeholder="테스트값"
                              value={p.value}
                              onChange={(e) => {
                                const next = [...sqlParams];
                                next[i] = { ...p, value: e.target.value };
                                setSqlParams(next);
                              }}
                              sx={{ width: 130, '& .MuiInputBase-input': { fontSize: 12, py: 0.5 } }}
                            />
                          </Stack>
                        ))}
                      </Stack>
                    </Box>
                  </Box>
                )}

              </Box>

              <Box
                role="separator"
                aria-orientation="vertical"
                aria-label="SQL 편집 영역과 실행 결과 영역 크기 조절"
                tabIndex={0}
                onPointerDown={handleSplitResizeStart}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    setSplitPercent((value) => Math.max(25, value - 5));
                  }
                  if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    setSplitPercent((value) => Math.min(75, value + 5));
                  }
                }}
                sx={{
                  flex: '0 0 16px',
                  cursor: 'col-resize',
                  display: 'flex',
                  alignItems: 'stretch',
                  justifyContent: 'center',
                  mx: 0.5,
                  outline: 'none',
                  '&::before': {
                    content: '""',
                    width: 3,
                    borderRadius: '999px',
                    backgroundColor: '#cbd5e1',
                    transition: 'background-color 0.15s ease, width 0.15s ease',
                  },
                  '&:hover::before, &:focus-visible::before': {
                    width: 4,
                    backgroundColor: '#3b82f6',
                  },
                }}
              />

              {/* ── 오른쪽: 실행 결과 ── */}
              <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                {!sqlResult ? (
                  <Box
                    sx={{
                      flex: 1,
                      border: '1px dashed #cbd5e1',
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#94a3b8',
                      gap: 1,
                    }}
                  >
                    <PlayArrowIcon sx={{ fontSize: 36, opacity: 0.35 }} />
                    <Typography sx={{ fontSize: 12 }}>SQL을 작성하고 실행하면</Typography>
                    <Typography sx={{ fontSize: 12 }}>결과가 여기에 표시됩니다.</Typography>
                  </Box>
                ) : sqlResult.error ? (
                  <Alert
                    severity="error"
                    sx={{ '& .MuiAlert-message': { fontSize: 12, fontFamily: 'monospace', whiteSpace: 'pre-wrap' } }}
                  >
                    {sqlResult.error}
                  </Alert>
                ) : (
                  <Box sx={{ flex: 1, minHeight: 0, border: '1px solid #bbf7d0', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1}
                      sx={{ flexShrink: 0, px: 1.5, py: 0.875, backgroundColor: '#f0fdf4', borderBottom: '1px solid #bbf7d0' }}
                    >
                      <Chip
                        size="small"
                        label="실행 완료"
                        sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 700, height: 22 }}
                      />
                      <Typography sx={{ fontSize: 12, color: '#166534' }}>
                        {sqlResult.rows.length}행 &nbsp;·&nbsp; {sqlResult.columns.length}개 컬럼
                      </Typography>
                    </Stack>
                    <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', p: 1 }}>
                      <SqlResultTable columns={sqlResult.columns} rows={sqlResult.rows} />
                    </Box>
                  </Box>
                )}
              </Box>

            </Box>

          </Box>
        )}

        {/* Step 1: 시각화 */}
        {activeStep === 1 && (
          <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <Step4_VisualAndPreview
              draft={draft}
              onDraftChange={patchDraft}
              testResults={testResults}
            />
          </Box>
        )}

        {/* Step 2: 최종 확인 */}
        {activeStep === 2 && (
          <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            <StepConfirm draft={draft} testResults={testResults} />
          </Box>
        )}

      </Box>

      {/* ── 하단 내비게이션 ─────────────────────────────────────────────────── */}
      <Box sx={{ px: 2, pt: 1.5, pb: 2, borderTop: '1px solid #e2e8f0' }}>
        <Stack direction="row" justifyContent="space-between">
          <Button
            variant="outlined"
            size="small"
            startIcon={activeStep === 0 ? <ArrowBackIcon sx={{ fontSize: 14 }} /> : undefined}
            onClick={() => activeStep > 0 ? setActiveStep((s) => s - 1) : onBack?.()}
            sx={{
              fontSize: 12, textTransform: 'none', fontWeight: 700, borderRadius: '6px',
              color: '#1976d2', borderColor: '#90caf9', bgcolor: '#f8fbff',
              '&:hover': { borderColor: '#1976d2', bgcolor: '#eff6ff' },
            }}
          >
            {activeStep === 0 ? '생성 방식 변경' : '이전'}
          </Button>

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
              onClick={() => setActiveStep((s) => s + 1)}
              disabled={activeStep === 0 && !canProceed}
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
