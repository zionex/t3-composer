import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import StorageIcon from '@mui/icons-material/Storage';

import { MODULE_LIST } from '../../popup/steps/wizardConstants';
import { exportBusinesstree, getSourceMetadata } from '../../../../restapi/widgetBuilder';

let cachedMetadata = null;
let inflightMetadata = null;

async function loadMetadata(force = false) {
  if (!force && cachedMetadata) return cachedMetadata;
  if (!force && inflightMetadata) return inflightMetadata;

  inflightMetadata = getSourceMetadata()
    .then((data) => {
      cachedMetadata = {
        tables: Array.isArray(data?.tables) ? data.tables : [],
      };
      return cachedMetadata;
    })
    .finally(() => {
      inflightMetadata = null;
    });

  return inflightMetadata;
}

function descriptionOf(row) {
  return row?.description || row?.comment || '';
}

const DOMAIN_MODULE_MAP = {
  sales: 'SA',
  sales_analysis: 'SA',
  demand_planning: 'DP',
  demand_plan: 'DP',
  business_forecast: 'BF',
  forecast: 'BF',
  master_planning: 'MP',
  inventory_management: 'IM',
  inventory: 'IM',
  replenishment: 'RP',
  sales_operations: 'SO',
  constraint_management: 'CM',
  factory_planning: 'FP',
  factory_plan: 'FP',
  factory_operation: 'FO',
  snop: 'SNOP',
};

function normalizeModule(value) {
  const module = String(value || '').trim().toUpperCase();
  return MODULE_LIST.includes(module) ? module : '';
}

function moduleOf(row) {
  const direct = normalizeModule(row?.module || row?.module_cd || row?.moduleCode);
  if (direct) return direct;

  const name = String(row?.name || '').toUpperCase();
  const matched = name.match(/^(?:TB|VIEW|VW)_([A-Z]{2,4})(?:_|$)/);
  const inferred = normalizeModule(matched?.[1]);
  if (inferred) return inferred;

  const domain = String(row?.business_domain || row?.domain || '').trim().toLowerCase();
  return DOMAIN_MODULE_MAP[domain] || '';
}

function filterRows(rows, search, moduleFilter) {
  const keyword = search.trim().toLowerCase();
  return rows.filter((row) => {
    if (moduleFilter && moduleOf(row) !== moduleFilter) return false;
    if (!keyword) return true;
    const haystack = [
      row?.name,
      descriptionOf(row),
      moduleOf(row),
      row?.business_domain,
      row?.category,
      row?.sub_category,
      row?.table_type,
    ].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(keyword);
  });
}

function SummaryStat({ label, value }) {
  return (
    <Box sx={{ px: 1.25, py: 0.75, border: '1px solid #e5eaf2', borderRadius: '8px', bgcolor: '#fff', minWidth: 96 }}>
      <Typography sx={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>{label}</Typography>
      <Typography sx={{ fontSize: 18, color: '#0f172a', fontWeight: 900, lineHeight: 1.2 }}>{value}</Typography>
    </Box>
  );
}

function MetadataRow({ row, active, onClick }) {
  const name = row?.name || '-';
  const description = descriptionOf(row);
  const columns = Array.isArray(row?.columns) ? row.columns.length : 0;
  const foreignKeys = Array.isArray(row?.foreign_keys) ? row.foreign_keys.length : 0;

  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
      sx={{
        px: 1.25,
        py: 1,
        border: '1px solid',
        borderColor: active ? 'primary.main' : '#e5eaf2',
        borderRadius: '8px',
        bgcolor: active ? '#eff6ff' : '#fff',
        cursor: 'pointer',
        '&:hover': { borderColor: 'primary.light', bgcolor: '#f8fbff' },
      }}
    >
      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.45, minWidth: 0 }}>
        <StorageIcon sx={{ fontSize: 16, color: '#2563eb' }} />
        <Typography sx={{ fontSize: 13, fontWeight: 900, color: '#1e293b', minWidth: 0 }} noWrap>
          {name}
        </Typography>
      </Stack>
      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mb: description ? 0.5 : 0 }}>
        {row?.business_domain && <Chip size="small" label={row.business_domain} sx={{ height: 20, fontSize: 10, borderRadius: '6px', fontWeight: 800 }} />}
        {row?.table_type && <Chip size="small" label={row.table_type} sx={{ height: 20, fontSize: 10, borderRadius: '6px' }} />}
        <Chip size="small" label={`컬럼 ${columns}`} sx={{ height: 20, fontSize: 10, borderRadius: '6px' }} />
        {foreignKeys > 0 && <Chip size="small" label={`FK ${foreignKeys}`} sx={{ height: 20, fontSize: 10, borderRadius: '6px' }} />}
      </Stack>
      {description && (
        <Typography sx={{ fontSize: 11, color: '#64748b' }} noWrap>
          {description}
        </Typography>
      )}
    </Box>
  );
}

function MetadataDetail({ row }) {
  if (!row) {
    return (
      <Box sx={{ height: '100%', display: 'grid', placeItems: 'center', border: '1px dashed #cbd5e1', borderRadius: '8px', bgcolor: '#fff' }}>
        <Typography sx={{ fontSize: 13, color: '#64748b' }}>왼쪽에서 메타 항목을 선택하세요.</Typography>
      </Box>
    );
  }

  const name = row?.name || '-';
  const jsonText = JSON.stringify(row, null, 2);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', border: '1px solid #e5eaf2', borderRadius: '8px', bgcolor: '#fff', minWidth: 0 }}>
      <Box sx={{ p: 1.5 }}>
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.75 }}>
          <StorageIcon sx={{ fontSize: 18, color: '#2563eb' }} />
          <Typography sx={{ fontSize: 15, fontWeight: 900, color: '#0f172a', minWidth: 0 }} noWrap>{name}</Typography>
        </Stack>
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
          <Chip size="small" label="TABLE META" sx={{ height: 22, borderRadius: '6px', fontWeight: 800 }} />
          {row?.business_domain && <Chip size="small" label={row.business_domain} sx={{ height: 22, borderRadius: '6px', fontWeight: 800 }} />}
          {Array.isArray(row?.columns) && <Chip size="small" label={`columns ${row.columns.length}`} sx={{ height: 22, borderRadius: '6px' }} />}
        </Stack>
      </Box>
      <Divider />
      <Box
        component="pre"
        sx={{
          flex: 1,
          m: 0,
          p: 1.5,
          overflow: 'auto',
          fontFamily: 'Consolas, Monaco, monospace',
          fontSize: 12,
          lineHeight: 1.5,
          color: '#1e293b',
          bgcolor: '#f8fafc',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {jsonText}
      </Box>
    </Box>
  );
}

export default function MetaManagementPanel({ enabled = true }) {
  const [metadata, setMetadata] = useState(() => cachedMetadata ?? { tables: [] });
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(enabled && !cachedMetadata);
  const [error, setError] = useState(null);
  const [organizing, setOrganizing] = useState(false);
  const [organizeProgress, setOrganizeProgress] = useState(0);
  const [organizeSnack, setOrganizeSnack] = useState({ open: false, severity: 'success', message: '' });

  useEffect(() => {
    if (!organizing) { setOrganizeProgress(0); return; }
    const interval = setInterval(() => {
      setOrganizeProgress((prev) => prev >= 90 ? prev : Math.min(90, prev + (90 - prev) * 0.08 + 0.5));
    }, 150);
    return () => clearInterval(interval);
  }, [organizing]);

  const handleOrganize = useCallback(async () => {
    setOrganizeProgress(0);
    setOrganizing(true);
    try {
      const result = await exportBusinesstree();
      setOrganizeSnack({ open: true, severity: 'success', message: `${result.count}개 모듈 keyword JSON이 서버에 저장되었습니다.` });
    } catch (err) {
      setOrganizeSnack({ open: true, severity: 'error', message: '저장 실패: ' + (err?.message || String(err)) });
    } finally {
      setOrganizeProgress(100);
      setTimeout(() => setOrganizing(false), 600);
    }
  }, []);

  const refresh = useCallback(async (force = true) => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadMetadata(force);
      setMetadata(data);
      setSelectedId((current) => current || data.tables[0]?.id || '');
      return data;
    } catch (err) {
      setError(err);
      setMetadata({ tables: [] });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    setLoading(!cachedMetadata);
    setError(null);
    loadMetadata(false)
      .then((data) => {
        if (cancelled) return;
        setMetadata(data);
        setSelectedId((current) => current || data.tables[0]?.id || '');
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err);
          setMetadata({ tables: [] });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const rows = metadata.tables;
  const moduleOptions = useMemo(() => {
    const discovered = new Set();
    rows.forEach((row) => {
      const module = moduleOf(row);
      if (module) discovered.add(module);
    });
    return MODULE_LIST.filter((module) => discovered.has(module));
  }, [rows]);
  const filteredRows = useMemo(() => filterRows(rows, search, moduleFilter), [rows, search, moduleFilter]);
  const selectedRow = useMemo(() => {
    return filteredRows.find((row) => row?.id === selectedId) ?? filteredRows[0] ?? null;
  }, [filteredRows, selectedId]);

  useEffect(() => {
    if (!selectedRow) {
      setSelectedId('');
    } else if (selectedRow.id !== selectedId) {
      setSelectedId(selectedRow.id);
    }
  }, [selectedRow, selectedId]);

  return (
    <Box sx={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} gap={1}>
        <Box>
          <Typography sx={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>Meta 정보 관리</Typography>
          <Typography sx={{ fontSize: 12, color: '#64748b' }}>
            Build Console에서 수집된 table raw metadata를 조회합니다.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <SummaryStat label="Tables" value={metadata.tables.length} />
          <Tooltip title="서버 bussiness_tree/ 폴더에 모듈별 JSON 저장">
            <span>
              <Button
                size="small"
                variant="outlined"
                onClick={handleOrganize}
                disabled={organizing || loading}
                startIcon={<DownloadIcon />}
              >
                데이터 정리
              </Button>
            </span>
          </Tooltip>
          <Tooltip title="메타데이터 새로고침">
            <span>
              <IconButton size="small" onClick={() => refresh(true)} disabled={loading}>
                {loading ? <CircularProgress size={18} /> : <RefreshIcon fontSize="small" />}
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>

      {organizing && (
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#2563eb', textAlign: 'right' }}>
          데이터 정리 중... {Math.round(organizeProgress)}%
        </Typography>
      )}

      {error && (
        <Alert severity="error">
          메타데이터를 불러오지 못했습니다. {error?.message || ''}
        </Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '390px 1fr' }, gap: 1.25, minHeight: 0, flex: 1 }}>
        <Box sx={{ minHeight: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Stack direction="row" spacing={0.75}>
            <FormControl size="small" sx={{ minWidth: 118 }}>
              <InputLabel>모듈</InputLabel>
              <Select
                value={moduleFilter}
                label="모듈"
                onChange={(event) => setModuleFilter(event.target.value)}
              >
                <MenuItem value="">전체</MenuItem>
                {moduleOptions.map((module) => (
                  <MenuItem key={module} value={module}>{module}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              size="small"
              fullWidth
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="이름, 도메인, 설명 검색"
              InputProps={{
                startAdornment: <SearchIcon sx={{ fontSize: 18, color: '#94a3b8', mr: 0.75 }} />,
              }}
            />
          </Stack>
          <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 0.75, pr: 0.25 }}>
            {loading ? (
              <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 220 }}>
                <CircularProgress size={24} />
              </Box>
            ) : filteredRows.length === 0 ? (
              <Box sx={{ p: 2, border: '1px dashed #cbd5e1', borderRadius: '8px', bgcolor: '#fff' }}>
                <Typography sx={{ fontSize: 13, color: '#64748b' }}>
                  표시할 메타데이터가 없습니다. Build Console에서 DDL 스키마 정보 가져오기를 실행하세요.
                </Typography>
              </Box>
            ) : (
              filteredRows.map((row) => (
                <MetadataRow
                  key={row?.id || row?.name}
                  row={row}
                  active={selectedRow?.id === row?.id}
                  onClick={() => setSelectedId(row?.id || '')}
                />
              ))
            )}
          </Box>
        </Box>

        <Box sx={{ minHeight: 0 }}>
          <MetadataDetail row={selectedRow} />
        </Box>
      </Box>

      <Snackbar
        open={organizeSnack.open}
        autoHideDuration={3000}
        onClose={() => setOrganizeSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={organizeSnack.severity} onClose={() => setOrganizeSnack((s) => ({ ...s, open: false }))}>
          {organizeSnack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
