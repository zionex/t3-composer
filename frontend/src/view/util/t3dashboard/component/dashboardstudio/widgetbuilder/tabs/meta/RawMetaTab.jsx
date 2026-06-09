import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import StorageIcon from '@mui/icons-material/Storage';

import { MODULE_LIST } from '../direct/steps/wizardConstants';
import { descriptionOf, filterRows, loadMetadata, moduleOf } from './metaUtils';

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
        <Typography sx={{ fontSize: 13, color: '#64748b' }}>테이블을 선택하세요</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', border: '1px solid #e5eaf2', borderRadius: '8px', bgcolor: '#fff', minWidth: 0 }}>
      <Box sx={{ p: 1.5 }}>
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.75 }}>
          <StorageIcon sx={{ fontSize: 18, color: '#2563eb' }} />
          <Typography sx={{ fontSize: 15, fontWeight: 900, color: '#0f172a', minWidth: 0 }} noWrap>{row?.name || '-'}</Typography>
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
          flex: 1, m: 0, p: 1.5, overflow: 'auto',
          fontFamily: 'Consolas, Monaco, monospace',
          fontSize: 12, lineHeight: 1.5, color: '#1e293b',
          bgcolor: '#f8fafc', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}
      >
        {JSON.stringify(row, null, 2)}
      </Box>
    </Box>
  );
}

export default function RawMetaTab({ enabled }) {
  const [metadata, setMetadata] = useState(() => ({ tables: [] }));
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);

  const refresh = useCallback(async (force = true) => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadMetadata(force);
      setMetadata(data);
      setSelectedId((current) => current || data.tables[0]?.id || '');
    } catch (err) {
      setError(err);
      setMetadata({ tables: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    setLoading(true);
    setError(null);
    loadMetadata(false)
      .then((data) => {
        if (cancelled) return;
        setMetadata(data);
        setSelectedId((current) => current || data.tables[0]?.id || '');
      })
      .catch((err) => { if (!cancelled) { setError(err); setMetadata({ tables: [] }); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [enabled]);

  const rows = metadata.tables;
  const moduleOptions = useMemo(() => {
    const discovered = new Set();
    rows.forEach((row) => { const m = moduleOf(row); if (m) discovered.add(m); });
    return MODULE_LIST.filter((m) => discovered.has(m));
  }, [rows]);
  const filteredRows = useMemo(() => filterRows(rows, search, moduleFilter), [rows, search, moduleFilter]);
  const selectedRow = useMemo(() => filteredRows.find((r) => r?.id === selectedId) ?? filteredRows[0] ?? null, [filteredRows, selectedId]);

  useEffect(() => {
    if (!selectedRow) setSelectedId('');
    else if (selectedRow.id !== selectedId) setSelectedId(selectedRow.id);
  }, [selectedRow, selectedId]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1, minHeight: 0 }}>
      <Stack direction="row" spacing={0.75} alignItems="center" justifyContent="space-between">
        <Stack direction="row" spacing={0.75} flex={1}>
          <FormControl size="small" sx={{ minWidth: 118 }}>
            <InputLabel>모듈</InputLabel>
            <Select value={moduleFilter} label="모듈" onChange={(e) => setModuleFilter(e.target.value)}>
              <MenuItem value="">전체</MenuItem>
              {moduleOptions.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField
            size="small" fullWidth value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="이름, 컬럼, 설명 검색"
            InputProps={{ startAdornment: <SearchIcon sx={{ fontSize: 18, color: '#94a3b8', mr: 0.75 }} /> }}
          />
        </Stack>
        <IconButton size="small" onClick={() => refresh(true)} disabled={loading}>
          {loading ? <CircularProgress size={18} /> : <RefreshIcon fontSize="small" />}
        </IconButton>
      </Stack>
      {error && <Alert severity="error">원시 메타 로드 실패: {error?.message || ''}</Alert>}
      <Box sx={{ display: 'grid', gridTemplateColumns: '390px 1fr', gap: 1.25, minHeight: 0, flex: 1 }}>
        <Box sx={{ minHeight: 0, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 0.75, pr: 0.25 }}>
          {loading ? (
            <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 220 }}><CircularProgress size={24} /></Box>
          ) : filteredRows.length === 0 ? (
            <Box sx={{ p: 2, border: '1px dashed #cbd5e1', borderRadius: '8px', bgcolor: '#fff' }}>
              <Typography sx={{ fontSize: 13, color: '#64748b' }}>표시필 원시 데이터가 없습니다.</Typography>
            </Box>
          ) : filteredRows.map((row) => (
            <MetadataRow key={row?.id || row?.name} row={row} active={selectedRow?.id === row?.id} onClick={() => setSelectedId(row?.id || '')} />
          ))}
        </Box>
        <Box sx={{ minHeight: 0 }}><MetadataDetail row={selectedRow} /></Box>
      </Box>
    </Box>
  );
}
