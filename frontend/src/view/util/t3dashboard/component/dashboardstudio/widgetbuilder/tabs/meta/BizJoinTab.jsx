import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

import {
  addBizJoin,
  deleteBizJoin,
  getBizJoins,
} from '../../../../../restapi/widgetBuilder';
import BizGrid from './BizGrid';

export default function BizJoinTab({ bizTables }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableFilter, setTableFilter] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ table_id: '', col_name: '', ref_table: '', ref_col: '' });
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  const load = useCallback((tid) => {
    setLoading(true);
    getBizJoins(tid || null).then((data) => setRows(Array.isArray(data) ? data : [])).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(tableFilter); }, [tableFilter, load]);

  const tableOptions = bizTables || [];
  const tableNameById = useMemo(() => Object.fromEntries(tableOptions.map((t) => [t.id, t.name])), [tableOptions]);
  const tableIdByName = useMemo(() => Object.fromEntries(tableOptions.map((t) => [t.name, t.id])), [tableOptions]);
  const gridRows = useMemo(
    () => rows.map((row) => ({ ...row, table: tableNameById[row.table_id] || row.table_id })),
    [rows, tableNameById],
  );

  const handleAdd = async () => {
    if (!addForm.table_id || !addForm.col_name || !addForm.ref_table || !addForm.ref_col) return;
    setSaving(true);
    try {
      await addBizJoin(addForm);
      setSnack({ open: true, msg: 'JOIN 추가 완료', severity: 'success' });
      setAddOpen(false);
      setAddForm({ table_id: '', col_name: '', ref_table: '', ref_col: '' });
      load(tableFilter);
    } catch (err) {
      setSnack({ open: true, msg: '추가 실패: ' + (err?.message || String(err)), severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    try {
      await deleteBizJoin({ table_id: row.table_id, col_name: row.col_name, ref_table: row.ref_table, ref_col: row.ref_col });
      setRows((prev) => prev.filter((r) => !(r.table_id === row.table_id && r.col_name === row.col_name && r.ref_table === row.ref_table && r.ref_col === row.ref_col)));
      setSnack({ open: true, msg: '삭제 완료', severity: 'success' });
    } catch (err) {
      setSnack({ open: true, msg: '삭제 실패: ' + (err?.message || String(err)), severity: 'error' });
    }
  };

  const cols = [
    { key: 'table', label: '테이블' },
    { key: 'col_name', label: '컬럼' },
    { key: 'ref_table', label: '참조 테이블' },
    { key: 'ref_col', label: '참조 컬럼' },
    { key: '_del', label: '', sortable: false },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1, minHeight: 0 }}>
      <Stack direction="row" spacing={0.75} alignItems="center">
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel>테이블</InputLabel>
          <Select value={tableFilter} label="테이블" onChange={(e) => setTableFilter(e.target.value)}>
            <MenuItem value="">전체</MenuItem>
            {tableOptions.map((t) => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
          </Select>
        </FormControl>
        <Box flex={1} />
        <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>JOIN 추가</Button>
      </Stack>

      <BizGrid
        rows={gridRows} loading={loading} columns={cols}
        emptyText="biz_join이 없습니다."
        renderRow={(row) => (
          <TableRow key={`${row.table_id}-${row.col_name}-${row.ref_table}-${row.ref_col}`} hover>
            <TableCell sx={{ fontSize: 11 }}>{row.table}</TableCell>
            <TableCell sx={{ fontSize: 11, fontWeight: 700 }}>{row.col_name}</TableCell>
            <TableCell sx={{ fontSize: 11 }}>{row.ref_table}</TableCell>
            <TableCell sx={{ fontSize: 11 }}>{row.ref_col}</TableCell>
            <TableCell sx={{ fontSize: 11, width: 40 }}>
              <IconButton size="small" color="error" onClick={() => handleDelete(row)}><DeleteIcon sx={{ fontSize: 14 }} /></IconButton>
            </TableCell>
          </TableRow>
        )}
      />

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontSize: 14, fontWeight: 700 }}>JOIN 관계 추가</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: '12px !important' }}>
          <FormControl size="small" fullWidth>
            <InputLabel>테이블</InputLabel>
            <Select value={addForm.table_id} label="테이블" onChange={(e) => setAddForm((f) => ({ ...f, table_id: e.target.value }))}>
              {tableOptions.map((t) => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField size="small" fullWidth label="컬럼명" value={addForm.col_name} onChange={(e) => setAddForm((f) => ({ ...f, col_name: e.target.value }))} />
          <TextField size="small" fullWidth label="참조 테이블명" value={addForm.ref_table} onChange={(e) => setAddForm((f) => ({ ...f, ref_table: e.target.value }))} />
          <TextField size="small" fullWidth label="참조 컬럼명" value={addForm.ref_col} onChange={(e) => setAddForm((f) => ({ ...f, ref_col: e.target.value }))} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>취소</Button>
          <Button variant="contained" disabled={saving || !addForm.table_id || !addForm.col_name || !addForm.ref_table || !addForm.ref_col} onClick={handleAdd}>추가</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
