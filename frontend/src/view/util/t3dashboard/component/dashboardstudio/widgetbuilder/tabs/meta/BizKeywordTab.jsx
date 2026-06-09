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
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';

import { MODULE_LIST } from '../direct/steps/wizardConstants';
import {
  getBizKeywords,
  patchBizKeyword,
} from '../../../../../restapi/widgetBuilder';
import BizGrid from './BizGrid';

export default function BizKeywordTab({ bizTables }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [tableFilter, setTableFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [editingKey, setEditingKey] = useState(null); // "table_id|module|keyword"
  const [editKwName, setEditKwName] = useState('');
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  const load = useCallback((tid) => {
    setLoading(true);
    getBizKeywords(tid || null).then((data) => setRows(Array.isArray(data) ? data : [])).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(tableFilter); }, [tableFilter, load]);

  const moduleOptions = useMemo(() => {
    const s = new Set(rows.map((r) => r.module).filter(Boolean));
    return MODULE_LIST.filter((m) => s.has(m));
  }, [rows]);

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (moduleFilter && r.module !== moduleFilter) return false;
      if (!kw) return true;
      return [r.keyword, r.keyword_name, r.module].filter(Boolean).join(' ').toLowerCase().includes(kw);
    });
  }, [rows, search, moduleFilter]);

  const tableOptions = bizTables || [];
  const tableNameById = useMemo(() => Object.fromEntries(tableOptions.map((t) => [t.id, t.name])), [tableOptions]);
  const gridRows = useMemo(
    () => filtered.map((row) => ({ ...row, table: tableNameById[row.table_id] || row.table_id })),
    [filtered, tableNameById],
  );

  const rowKey = (row) => `${row.table_id}|${row.module}|${row.keyword}`;
  const startEdit = (row) => { setEditingKey(rowKey(row)); setEditKwName(row.keyword_name || ''); };
  const cancelEdit = () => { setEditingKey(null); setEditKwName(''); };

  const saveEdit = async (row) => {
    setSaving(true);
    try {
      const updated = await patchBizKeyword(row.table_id, row.module, row.keyword, { keyword_name: editKwName });
      setRows((prev) => prev.map((r) => rowKey(r) === rowKey(row) ? { ...r, keyword_name: updated.keyword_name } : r));
      setSnack({ open: true, msg: `"${row.keyword}" 이름 변경 완료`, severity: 'success' });
      setEditingKey(null);
    } catch (err) {
      setSnack({ open: true, msg: '저장 실패: ' + (err?.message || String(err)), severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const cols = [
    { key: 'table', label: '테이블' },
    { key: 'module', label: '모듈' },
    { key: 'keyword', label: '키워드(원본)' },
    { key: 'keyword_name', label: '키워드명' },
    { key: 'is_primary', label: '주요' },
    { key: '_edit', label: '' },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1, minHeight: 0 }}>
      <Stack direction="row" spacing={0.75}>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel>모듈</InputLabel>
          <Select value={moduleFilter} label="모듈" onChange={(e) => setModuleFilter(e.target.value)}>
            <MenuItem value="">전체</MenuItem>
            {moduleOptions.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel>테이블</InputLabel>
          <Select value={tableFilter} label="테이블" onChange={(e) => setTableFilter(e.target.value)}>
            <MenuItem value="">전체</MenuItem>
            {tableOptions.map((t) => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField size="small" fullWidth value={search} onChange={(e) => setSearch(e.target.value)} placeholder="키워드, 이름 검색"
          InputProps={{ startAdornment: <SearchIcon sx={{ fontSize: 18, color: '#94a3b8', mr: 0.75 }} /> }} />
      </Stack>
      <BizGrid
        rows={gridRows} loading={loading} columns={cols}
        emptyText="biz_keyword가 없습니다. 데이터 관리에서 분석을 실행하세요"
        renderRow={(row) => (
          <TableRow key={rowKey(row)} hover>
            <TableCell sx={{ fontSize: 11 }}>{row.table}</TableCell>
            <TableCell sx={{ fontSize: 11 }}>{row.module}</TableCell>
            <TableCell sx={{ fontSize: 11, fontWeight: 700 }}>{row.keyword}</TableCell>
            <TableCell sx={{ fontSize: 11, minWidth: 160 }}>
              {editingKey === rowKey(row) ? (
                <TextField
                  size="small" value={editKwName} autoFocus
                  onChange={(e) => setEditKwName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(row); if (e.key === 'Escape') cancelEdit(); }}
                  sx={{ fontSize: 11 }}
                />
              ) : (
                <Typography sx={{ fontSize: 11, color: row.keyword_name ? '#0f172a' : '#94a3b8' }}>
                  {row.keyword_name || '미설정'}
                </Typography>
              )}
            </TableCell>
            <TableCell sx={{ fontSize: 11 }}>
              {row.is_primary ? <Chip size="small" label="주요" color="primary" sx={{ height: 18, fontSize: 10 }} /> : ''}
            </TableCell>
            <TableCell sx={{ fontSize: 11, whiteSpace: 'nowrap', width: 80 }}>
              {editingKey === rowKey(row) ? (
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
