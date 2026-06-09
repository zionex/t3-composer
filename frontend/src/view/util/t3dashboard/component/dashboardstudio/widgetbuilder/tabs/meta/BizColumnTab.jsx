import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TableCell,
  TableRow,
  TextField,
  Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';

import { MODULE_LIST } from '../direct/steps/wizardConstants';
import {
  getBizColumns,
  patchBizColumn,
} from '../../../../../restapi/widgetBuilder';
import { compactColumnType } from './metaUtils';
import BizGrid from './BizGrid';

const COL_ROLE_OPTIONS = ['time', 'id', 'dimension', 'measure', 'no_use'];
const COL_AGG_OPTIONS = ['', 'SUM', 'AVG', 'COUNT', 'MAX', 'MIN'];

export default function BizColumnTab({ bizTables }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [tableFilter, setTableFilter] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editVals, setEditVals] = useState({});
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  const load = useCallback((tid) => {
    setLoading(true);
    getBizColumns(tid || null).then((data) => setRows(Array.isArray(data) ? data : [])).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(tableFilter); }, [tableFilter, load]);

  const tableMetaById = useMemo(
    () => Object.fromEntries((bizTables || []).map((table) => [table.id, table])),
    [bizTables],
  );

  const moduleOptions = useMemo(() => {
    const modules = new Set((bizTables || []).map((table) => table.module).filter(Boolean));
    return MODULE_LIST.filter((module) => modules.has(module));
  }, [bizTables]);

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    return rows.filter((row) => {
      const tableMeta = tableMetaById[row.table_id];
      if (moduleFilter && tableMeta?.module !== moduleFilter) return false;
      if (!kw) return true;
      return [row.name, row.col_role, row.col_type, row.col_comment, tableMeta?.name, tableMeta?.module]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(kw);
    });
  }, [moduleFilter, rows, search, tableMetaById]);

  const startEdit = (row) => { setEditingId(row.id); setEditVals({ col_role: row.col_role || '', col_agg: row.col_agg || '' }); };
  const cancelEdit = () => { setEditingId(null); setEditVals({}); };

  const saveEdit = async (row) => {
    setSaving(true);
    try {
      const updated = await patchBizColumn(row.id, editVals);
      setRows((prev) => prev.map((r) => r.id === row.id ? { ...r, ...updated } : r));
      setSnack({ open: true, msg: `${row.name} 저장 완료`, severity: 'success' });
      setEditingId(null);
    } catch (err) {
      setSnack({ open: true, msg: '저장 실패: ' + (err?.message || String(err)), severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const roleColor = (role) => {
    if (role === 'measure') return '#dcfce7';
  if (role === 'time') return '#dbeafe';
  if (role === 'dimension') return '#fef9c3';
  if (role === 'id') return '#f3e8ff';
  if (role === 'no_use') return '#e5e7eb';
  return '#f1f5f9';
};

  const cols = [
    { key: 'name', label: '컬럼명' },
    { key: 'col_type', label: '타입' },
    { key: 'col_role', label: 'Role' },
    { key: 'col_agg', label: 'Agg' },
    { key: 'col_pk', label: 'PK' },
    { key: 'col_comment', label: '설명' },
    { key: '_edit', label: '', sortable: false },
  ];

  const tableOptions = useMemo(() => {
    const sourceTables = (bizTables || []).filter((table) => !moduleFilter || table.module === moduleFilter);
    if (sourceTables.length > 0) {
      return sourceTables
        .map((table) => ({ id: table.id, name: table.name, module: table.module }))
        .sort((a, b) => a.name.localeCompare(b.name));
    }
    const seen = new Set();
    return rows
      .filter((r) => r.table_id && !seen.has(r.table_id) && seen.add(r.table_id))
      .map((r) => ({ id: r.table_id, name: tableMetaById[r.table_id]?.name || r.table_id, module: tableMetaById[r.table_id]?.module || '' }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [bizTables, moduleFilter, rows, tableMetaById]);

  useEffect(() => {
    if (!tableFilter || tableOptions.some((table) => table.id === tableFilter)) return;
    setTableFilter('');
  }, [tableFilter, tableOptions]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1, minHeight: 0 }}>
      <Stack direction="row" spacing={0.75}>
        <FormControl size="small" sx={{ minWidth: 110 }}>
          <InputLabel>모듈</InputLabel>
          <Select value={moduleFilter} label="모듈" onChange={(e) => setModuleFilter(e.target.value)}>
            <MenuItem value="">전체</MenuItem>
            {moduleOptions.map((module) => <MenuItem key={module} value={module}>{module}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel>테이블</InputLabel>
          <Select value={tableFilter} label="테이블" onChange={(e) => setTableFilter(e.target.value)}>
            <MenuItem value="">전체</MenuItem>
            {tableOptions.map((t) => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField size="small" fullWidth value={search} onChange={(e) => setSearch(e.target.value)} placeholder="컬럼명, role, 설명 검색"
          InputProps={{ startAdornment: <SearchIcon sx={{ fontSize: 18, color: '#94a3b8', mr: 0.75 }} /> }} />
      </Stack>
      <BizGrid
        rows={filtered} loading={loading} columns={cols}
        emptyText="biz_column이 없습니다. 데이터 관리를 먼저 실행하세요"
        renderRow={(row) => (
          <TableRow key={row.id} hover>
            <TableCell sx={{ fontSize: 11, fontWeight: 700 }}>{row.name}</TableCell>
            <TableCell sx={{ fontSize: 11 }}>{compactColumnType(row.col_type)}</TableCell>
            <TableCell sx={{ fontSize: 11, minWidth: 130 }}>
              {editingId === row.id ? (
                <Select size="small" value={editVals.col_role} onChange={(e) => setEditVals((v) => ({ ...v, col_role: e.target.value }))} sx={{ fontSize: 11, minWidth: 110 }}>
                  {COL_ROLE_OPTIONS.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                </Select>
              ) : (
                <Chip size="small" label={row.col_role || '-'} sx={{ height: 18, fontSize: 10, bgcolor: roleColor(row.col_role) }} />
              )}
            </TableCell>
            <TableCell sx={{ fontSize: 11, minWidth: 100 }}>
              {editingId === row.id ? (
                <Select size="small" value={editVals.col_agg} onChange={(e) => setEditVals((v) => ({ ...v, col_agg: e.target.value }))} sx={{ fontSize: 11, minWidth: 90 }}>
                  {COL_AGG_OPTIONS.map((a) => <MenuItem key={a} value={a}>{a || '없음'}</MenuItem>)}
                </Select>
              ) : (
                row.col_agg || '-'
              )}
            </TableCell>
            <TableCell sx={{ fontSize: 11 }}>{row.col_pk ? 'Y' : ''}</TableCell>
            <TableCell sx={{ fontSize: 11, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <Tooltip title={row.col_comment || ''} placement="top-start"><span>{row.col_comment || '-'}</span></Tooltip>
            </TableCell>
            <TableCell sx={{ fontSize: 11, whiteSpace: 'nowrap', pr: 0.5 }}>
              {editingId === row.id ? (
                <Stack direction="row" spacing={0.5}>
                  <Button size="small" variant="contained" disabled={saving} onClick={() => saveEdit(row)} sx={{ fontSize: 10, py: 0, minWidth: 40 }}>저장</Button>
                  <Button size="small" onClick={cancelEdit} sx={{ fontSize: 10, py: 0, minWidth: 40 }}>취소</Button>
                </Stack>
              ) : (
                <IconButton size="small" onClick={() => startEdit(row)}><EditIcon sx={{ fontSize: 14 }} /></IconButton>
              )}
            </TableCell>
          </TableRow>
        )}
      />
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
