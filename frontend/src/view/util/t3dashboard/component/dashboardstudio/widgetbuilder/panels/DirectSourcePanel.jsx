import React, { useMemo, useRef, useState } from 'react';
import {
  Accordion, AccordionDetails, AccordionSummary,
  Box, Chip, CircularProgress, Divider,
  IconButton, InputAdornment, MenuItem, Paper, Stack,
  TextField, Typography,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import StorageIcon from '@mui/icons-material/Storage';
import TuneIcon from '@mui/icons-material/Tune';

import useDashboardSourceCatalog from '../hooks/useDashboardSourceCatalog';
import { fetchStoredProcedureParams } from '../../popup/steps/spDataApi';
import {
  FIELD_SX,
  MODULE_COLORS,
  MODULE_LIST,
  SOURCE_TYPES,
} from '../../popup/steps/wizardConstants';
import dashboardConfig from '../../dashboardConfig';

const SOURCE_TYPE_LABELS = {
  STORED_PROCEDURE: 'SP',
  VIEW: 'VIEW',
  TABLE: 'Table',
};

const RETURN_TYPE_LABELS = {
  SINGLE_KPI: 'KPI',
  LIST_DATA: '목록',
  TIME_SERIES: '시계열',
  MIXED: '복합',
};

function sourceTypeColor(value) {
  return SOURCE_TYPES.find((type) => type.value === value)?.color ?? '#64748b';
}

/**
 * SOURCE_TYPES 색상표를 기준으로 소스 유형을 표시하는 공유 Chip.
 * SP → 파랑(#3b82f6), VIEW → 초록(#10b981), TABLE → 주황(#f59e0b)
 *
 * @param {{ value: 'STORED_PROCEDURE'|'VIEW'|'TABLE' }} props
 */
export function SourceTypeChip({ value }) {
  const color = sourceTypeColor(value);
  return (
    <Chip
      size="small"
      label={SOURCE_TYPE_LABELS[value] ?? value}
      sx={{ height: 18, borderRadius: '5px', bgcolor: `${color}1f`, color, fontSize: 10, fontWeight: 700 }}
    />
  );
}

/**
 * MODULE_COLORS 색상표를 기준으로 모듈을 표시하는 공유 Chip.
 * 알 수 없는 모듈은 회색(#94a3b8) 폴백.
 *
 * @param {{ value: string }} props  예: 'SA' | 'DP' | 'CM' | ...
 */
export function ModuleChip({ value }) {
  const color = MODULE_COLORS[value] ?? '#94a3b8';
  return (
    <Chip
      size="small"
      label={value || '-'}
      sx={{ height: 18, borderRadius: '5px', bgcolor: `${color}20`, color, fontSize: 10, fontWeight: 700 }}
    />
  );
}

function ModuleSelectLabel({ value }) {
  const isAll = value === 'ALL';
  const color = MODULE_COLORS[value] ?? '#94a3b8';
  return (
    <Stack component="span" direction="row" alignItems="center" spacing={1}>
      {!isAll && (
        <Box
          component="span"
          sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, flexShrink: 0 }}
        />
      )}
      <Box component="span">{isAll ? '전체 모듈' : value}</Box>
    </Stack>
  );
}

function ReturnChip({ value }) {
  return (
    <Chip
      size="small"
      label={RETURN_TYPE_LABELS[value] ?? value ?? '데이터'}
      sx={{ height: 18, borderRadius: '5px', bgcolor: '#f1f5f9', color: '#64748b', fontSize: 10 }}
    />
  );
}

/** 카탈로그 항목 한 행. selected=true면 하이라이트, disabled=true면 클릭 무효. */
function DataSourceRow({ entry, selected, disabled, onAdd }) {
  return (
    <Paper
      variant="outlined"
      onClick={() => { if (!disabled) onAdd(entry); }}
      sx={{
        p: 1,
        borderRadius: 1,
        bgcolor: selected ? '#f0f7ff' : '#fff',
        borderColor: selected ? '#90caf9' : '#e5eaf2',
        cursor: disabled ? 'default' : 'pointer',
        transition: 'border-color 120ms ease, background-color 120ms ease',
        '&:hover': disabled ? {} : { borderColor: 'primary.light', bgcolor: '#f8fbff' },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1}>
        <StorageIcon sx={{ width: 18, height: 18, color: sourceTypeColor(entry.sourceType), flexShrink: 0 }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.35 }}>
            <SourceTypeChip value={entry.sourceType} />
            <ModuleChip value={entry.module} />
            <ReturnChip value={entry.returnType} />
          </Stack>
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }} noWrap>
            {entry.sourceName}
          </Typography>
          <Typography sx={{ fontSize: 11, color: '#64748b' }} noWrap>
            {entry.description || '-'}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

/** 선택된 소스 카드. active=true면 파란 테두리, loading=true면 SP 파라미터 로딩 스피너 표시. */
function SelectedSourceCard({ ds, idx, active, loading, onFocus, onRemove }) {
  return (
    <Paper
      variant="outlined"
      onClick={onFocus}
      sx={{
        p: 1,
        borderRadius: 1,
        cursor: 'pointer',
        borderColor: active ? 'primary.main' : '#e5eaf2',
        bgcolor: active ? '#f8fbff' : '#fff',
      }}
    >
      <Stack direction="row" spacing={1} alignItems="flex-start">
        <Typography sx={{ width: 22, pt: 0.1, fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>
          #{idx + 1}
        </Typography>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={0.5} sx={{ mb: 0.4 }}>
            <SourceTypeChip value={ds.sourceType} />
            <ModuleChip value={ds.module} />
            <ReturnChip value={ds.returnType} />
          </Stack>
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }} noWrap>
            {ds.sourceName}
          </Typography>
          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.75 }}>
            {loading && <CircularProgress size={14} />}
            {!loading && ds.sourceType === 'STORED_PROCEDURE' && (
              <Chip
                size="small"
                label={`파라미터 ${ds.params?.length ?? 0}`}
                sx={{ height: 20, fontSize: 10, bgcolor: '#eff6ff', color: '#2563eb' }}
              />
            )}
          </Stack>
        </Box>
        <IconButton
          size="small"
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
          sx={{ color: 'text.secondary' }}
        >
          <DeleteOutlineIcon fontSize="small" />
        </IconButton>
      </Stack>
    </Paper>
  );
}

/** 활성 소스 상세 패널. Step1에서는 선택한 소스의 기본 정보만 보여준다. */
function SourceDetail({ ds }) {
  if (!ds) {
    return (
      <Box sx={{
        height: '100%',
        minHeight: 180,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px dashed #d8e0ea',
        borderRadius: 1,
        color: 'text.secondary',
        bgcolor: '#fbfcfe',
      }} />
    );
  }

  return (
    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
      <Stack spacing={1.25}>
        <Box>
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.5 }}>
            <SourceTypeChip value={ds.sourceType} />
            <ModuleChip value={ds.module} />
            <ReturnChip value={ds.returnType} />
          </Stack>
          <Typography sx={{ fontSize: 14, fontWeight: 800, color: '#111827', wordBreak: 'break-all' }}>
            {ds.sourceName}
          </Typography>
          <Typography sx={{ fontSize: 12, color: '#64748b', mt: 0.25 }}>
            {ds.description || '설명이 없습니다.'}
          </Typography>
        </Box>

        <Divider />

        {ds.sourceType === 'STORED_PROCEDURE' && (
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#475569', mb: 0.75 }}>
              프로시저 파라미터
            </Typography>
            {(ds.params?.length ?? 0) > 0 && (
              <Stack direction="row" gap={0.5} flexWrap="wrap">
                {ds.params.map((param) => (
                  <Chip
                    key={param.paramName}
                    size="small"
                    label={param.paramName}
                    sx={{ height: 22, fontSize: 10, bgcolor: '#f1f5f9' }}
                  />
                ))}
              </Stack>
            )}
          </Box>
        )}

        {ds.sourceType === 'TABLE' && (
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#475569', mb: 0.75 }}>
              TABLE 정보
            </Typography>
            <Stack direction="row" gap={0.5} flexWrap="wrap">
              <Chip
                size="small"
                label={`Schema ${ds.schema ?? 'dbo'}`}
                sx={{ height: 22, fontSize: 10, bgcolor: '#f1f5f9' }}
              />
              <Chip
                size="small"
                label={`TOP ${ds.tableConfig?.topN ?? dashboardConfig.tableTopN}`}
                sx={{ height: 22, fontSize: 10, bgcolor: '#fff7ed', color: '#f59e0b' }}
              />
              <Chip
                size="small"
                label={ds.tableConfig?.columns?.length ? `${ds.tableConfig.columns.length} columns` : 'SELECT *'}
                sx={{ height: 22, fontSize: 10, bgcolor: '#f1f5f9' }}
              />
            </Stack>
          </Box>
        )}
      </Stack>
    </Paper>
  );
}

/**
 * 데이터 소스 선택·설정 패널.
 *
 * - draft + onDraftChange 전달 → Controlled 모드 (외부 상태 사용)
 * - 생략 → Uncontrolled 모드 (내부 internalDraft 사용)
 *
 * @param {{ dataSourceMode: string, dataSources: object[] }} [draft]
 * @param {(patch: object) => void} [onDraftChange]
 *
 * @see DirectSourcePanel.md  — 컴포넌트 구조·데이터 흐름 다이어그램
 */
export default function DirectSourcePanel({
  draft,
  onDraftChange,
}) {
  const { catalog, loading: catalogLoading } = useDashboardSourceCatalog();
  const [internalDraft, setInternalDraft] = useState({
    dataSourceMode: 'MULTIPLE',
    dataSources: [],
  });
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [searchText, setSearchText] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [directInput, setDirectInput] = useState({
    sourceType: 'STORED_PROCEDURE',
    sourceName: '',
    description: '',
  });
  const [loadingIds, setLoadingIds] = useState(new Set());
  const dsRef = useRef([]);

  const catalogModules = useMemo(() => [
    'ALL',
    ...Array.from(new Set(catalog.map((entry) => entry.module)))
      .filter((module) => MODULE_LIST.includes(module)),
  ], [catalog]);

  const effectiveDraft = draft ?? internalDraft;
  const emitDraftChange = typeof onDraftChange === 'function'
    ? onDraftChange
    : (patch) => setInternalDraft((prev) => ({ ...prev, ...patch }));

  const dataSources = effectiveDraft?.dataSources ?? [];
  dsRef.current = dataSources;

  const selectedIds = useMemo(() => new Set(dataSources.map((ds) => ds.id)), [dataSources]);

  const filteredCatalog = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return catalog.filter((entry) => {
      if (moduleFilter !== 'ALL' && entry.module !== moduleFilter) return false;
      if (typeFilter !== 'ALL' && entry.sourceType !== typeFilter) return false;
      if (!q) return true;
      const haystack = `${entry.sourceName} ${entry.description ?? ''} ${entry.module ?? ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [catalog, moduleFilter, typeFilter, searchText]);

  const maxDataSources = dashboardConfig.maxDataSources ?? Number.POSITIVE_INFINITY;
  const canAdd = dataSources.length < maxDataSources;
  const activeSource = dataSources[Math.min(activeIndex, Math.max(dataSources.length - 1, 0))] ?? null;

  function patchDataSources(nextDataSources, nextActiveIndex = activeIndex) {
    // dsRef를 state와 동시에 갱신 — fetchAndPatchParams 비동기 콜백에서 최신 배열을 참조하기 위함
    dsRef.current = nextDataSources;
    emitDraftChange({ dataSourceMode: 'MULTIPLE', dataSources: nextDataSources });
    setActiveIndex(Math.max(0, Math.min(nextActiveIndex, Math.max(nextDataSources.length - 1, 0))));
  }

  async function fetchAndPatchParams(entryId, sourceName, baseDataSources = dsRef.current) {
    setLoadingIds((prev) => new Set([...prev, entryId]));
    try {
      const params = await fetchStoredProcedureParams(sourceName);
      if (params.length) {
        const current = dsRef.current?.some((ds) => ds.id === entryId) ? dsRef.current : baseDataSources;
        const idx = current.findIndex((ds) => ds.id === entryId);
        if (idx >= 0) {
          patchDataSources(current.map((ds, i) => (i === idx ? { ...ds, params } : ds)), idx);
        }
      }
    } catch (_) {
      // keep existing params
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(entryId);
        return next;
      });
    }
  }

  function addSource(entry) {
    if (!canAdd && !selectedIds.has(entry.id)) return;
    if (selectedIds.has(entry.id)) {
      setActiveIndex(dataSources.findIndex((ds) => ds.id === entry.id));
      return;
    }

    const selected = {
      ...entry,
      tableConfig: entry.sourceType === 'TABLE'
        ? { columns: [], whereConditions: [], orderBy: [], topN: dashboardConfig.tableTopN }
        : entry.tableConfig,
    };
    const nextDataSources = [...dataSources, selected];
    patchDataSources(nextDataSources, nextDataSources.length - 1);

    if (entry.sourceType === 'STORED_PROCEDURE') {
      fetchAndPatchParams(entry.id, entry.sourceName, nextDataSources);
    }
  }

  function removeSource(idx) {
    patchDataSources(dataSources.filter((_, i) => i !== idx), Math.max(0, idx - 1));
  }

  function addDirectInput() {
    const sourceName = directInput.sourceName.trim();
    if (!sourceName) return;
    addSource({
      id: `custom_${Date.now()}`,
      module: 'CUSTOM',
      returnType: 'LIST_DATA',
      params: [],
      mockData: [],
      ...directInput,
      sourceName,
    });
    setDirectInput({ sourceType: 'STORED_PROCEDURE', sourceName: '', description: '' });
    setAdvancedOpen(false);
  }

  return (
    <Box sx={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Box sx={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '430px minmax(0, 1fr)', overflow: 'hidden' }}>

        {/* ── Left: catalog ─────────────────────────────────────────────── */}
        <Box sx={{ borderRight: 1, borderColor: 'divider', minHeight: 0, display: 'flex', flexDirection: 'column', bgcolor: '#f8fafc' }}>
          <Box sx={{ px: 1.5, py: 1.25, borderBottom: 1, borderColor: 'divider' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 800 }}>데이터 소스</Typography>
            </Stack>

            <TextField
              size="small"
              fullWidth
              placeholder="SP, VIEW, TABLE 검색"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ width: 17, height: 17, color: '#94a3b8' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ ...FIELD_SX, mb: 1 }}
            />

            <Stack direction="row" spacing={1}>
              <TextField
                select
                size="small"
                label="모듈"
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
                SelectProps={{ renderValue: (v) => <ModuleSelectLabel value={v} /> }}
                sx={{ ...FIELD_SX, flex: 1 }}
              >
                {catalogModules.map((m) => (
                  <MenuItem key={m} value={m}><ModuleSelectLabel value={m} /></MenuItem>
                ))}
              </TextField>
              <TextField
                select
                size="small"
                label="소스"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                sx={{ ...FIELD_SX, width: 132 }}
              >
                <MenuItem value="ALL">전체 소스</MenuItem>
                {SOURCE_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>{SOURCE_TYPE_LABELS[type.value]}</MenuItem>
                ))}
              </TextField>
            </Stack>
          </Box>

          <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', p: 1 }}>
            <Stack spacing={0.75}>
              {catalogLoading && (
                <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
                  <CircularProgress size={24} />
                </Box>
              )}
              {!catalogLoading && filteredCatalog.length === 0 && (
                <Typography sx={{ py: 4, textAlign: 'center', color: 'text.secondary', fontSize: 13 }}>
                  검색 결과가 없습니다.
                </Typography>
              )}
              {!catalogLoading && filteredCatalog.map((entry) => {
                const selected = selectedIds.has(entry.id);
                return (
                  <DataSourceRow
                    key={entry.id}
                    entry={entry}
                    selected={selected}
                    disabled={!canAdd && !selected}
                    onAdd={addSource}
                  />
                );
              })}
            </Stack>
          </Box>
        </Box>

        {/* ── Right: selected sources + detail ───────────────────────────── */}
        <Box sx={{ minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: '#fff' }}>
          {/* Selected sources (left sub-col) + source detail (right sub-col) */}
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              display: 'grid',
              gridTemplateColumns: 'minmax(320px, 38%) minmax(0, 1fr)',
              overflow: 'hidden',
              p: 1.5,
              bgcolor: '#f8fafc',
            }}
          >
            <Box
              sx={{
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                pr: 1.5,
                borderRight: '1px solid #fff',
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.75 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 800 }}>선택된 소스</Typography>
                <Chip
                  size="small"
                  label={`${dataSources.length}/${maxDataSources}개 선택`}
                  color={dataSources.length ? 'primary' : 'default'}
                  sx={{ height: 22, flexShrink: 0, fontSize: 11, fontWeight: 700 }}
                />
              </Stack>
              <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                <Stack spacing={0.75}>
                  {dataSources.length === 0 && (
                    <Box sx={{ py: 6, border: '1px dashed #d8e0ea', borderRadius: 1 }} />
                  )}
                  {dataSources.map((ds, index) => (
                    <SelectedSourceCard
                      key={ds.id ?? index}
                      ds={ds}
                      idx={index}
                      active={index === activeIndex}
                      loading={loadingIds.has(ds.id)}
                      onFocus={() => setActiveIndex(index)}
                      onRemove={() => removeSource(index)}
                    />
                  ))}
                </Stack>
              </Box>

              <Accordion
                expanded={advancedOpen}
                onChange={(_, expanded) => setAdvancedOpen(expanded)}
                disableGutters
                elevation={0}
                sx={{ mt: 1, border: '1px solid #e5eaf2', borderRadius: '6px !important', '&:before': { display: 'none' } }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon sx={{ width: 16, height: 16 }} />}
                  sx={{ minHeight: 34, '& .MuiAccordionSummary-content': { my: 0.4 } }}
                >
                  <Stack direction="row" alignItems="center" spacing={0.75}>
                    <TuneIcon sx={{ width: 15, height: 15, color: '#64748b' }} />
                    <Typography sx={{ fontSize: 12, color: '#475569' }}>직접 입력</Typography>
                  </Stack>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 1, pt: 0, pb: 1 }}>
                  <Stack spacing={1}>
                    <TextField
                      select size="small" label="소스 유형"
                      value={directInput.sourceType}
                      onChange={(e) => setDirectInput((p) => ({ ...p, sourceType: e.target.value }))}
                      sx={FIELD_SX}
                    >
                      {SOURCE_TYPES.map((type) => (
                        <MenuItem key={type.value} value={type.value}>{SOURCE_TYPE_LABELS[type.value]}</MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      size="small" label="소스명" placeholder="SP명 또는 VIEW/TABLE명"
                      value={directInput.sourceName}
                      onChange={(e) => setDirectInput((p) => ({ ...p, sourceName: e.target.value }))}
                      sx={FIELD_SX}
                    />
                    <TextField
                      size="small" label="설명"
                      value={directInput.description}
                      onChange={(e) => setDirectInput((p) => ({ ...p, description: e.target.value }))}
                      sx={FIELD_SX}
                    />
                    <Chip
                      label="+ 추가" size="small"
                      onClick={addDirectInput}
                      disabled={!directInput.sourceName.trim() || !canAdd}
                      sx={{
                        fontSize: 11, cursor: 'pointer', alignSelf: 'flex-start',
                        bgcolor: '#6366f1', color: '#fff',
                        '&:hover': { bgcolor: '#4f46e5' },
                        '&.Mui-disabled': { opacity: 0.4 },
                      }}
                    />
                  </Stack>
                </AccordionDetails>
              </Accordion>
            </Box>

            <Box sx={{ minHeight: 0, overflow: 'auto', pl: 1.5 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 800, mb: 0.75 }}>소스 정보</Typography>
              <SourceDetail ds={activeSource} />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
