import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  IconButton,
  Snackbar,
  Stack,
  TableCell,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';

import {
  getBizCategories,
  patchBizCategory,
} from '../../../../../restapi/widgetBuilder';
import BizGrid from './BizGrid';

export default function BizCategoryTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState(null);
  const [editCatName, setEditCatName] = useState('');
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  useEffect(() => {
    setLoading(true);
    getBizCategories().then((data) => setRows(Array.isArray(data) ? data : [])).finally(() => setLoading(false));
  }, []);

  const startEdit = (row) => { setEditingKey(row.category); setEditCatName(row.category_name || ''); };
  const cancelEdit = () => { setEditingKey(null); setEditCatName(''); };

  const saveEdit = async (row) => {
    setSaving(true);
    try {
      const updated = await patchBizCategory(row.category, { category_name: editCatName });
      setRows((prev) => prev.map((r) => r.category === row.category ? { ...r, category_name: updated?.category_name ?? editCatName } : r));
      setSnack({ open: true, msg: `"${row.category}" 이름 저장 완료`, severity: 'success' });
      setEditingKey(null);
    } catch (err) {
      setSnack({ open: true, msg: '저장 실패: ' + (err?.message || String(err)), severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const cols = [
    { key: 'category', label: '카테고리 (코드)' },
    { key: 'category_name', label: '카테고리명' },
    { key: '_edit', label: '', sortable: false },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1, minHeight: 0 }}>
      <BizGrid
        rows={rows} loading={loading} columns={cols}
        emptyText="biz_category가 없습니다. 데이터 정리를 먼저 실행하세요."
        renderRow={(row) => (
          <TableRow key={row.category} hover>
            <TableCell sx={{ fontSize: 11, fontWeight: 700 }}>{row.category}</TableCell>
            <TableCell sx={{ fontSize: 11, minWidth: 200 }}>
              {editingKey === row.category ? (
                <TextField
                  size="small" value={editCatName} autoFocus
                  onChange={(e) => setEditCatName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(row); if (e.key === 'Escape') cancelEdit(); }}
                  sx={{ fontSize: 11 }}
                />
              ) : (
                <Typography sx={{ fontSize: 11, color: row.category_name ? '#0f172a' : '#94a3b8' }}>
                  {row.category_name || '미입력'}
                </Typography>
              )}
            </TableCell>
            <TableCell sx={{ fontSize: 11, whiteSpace: 'nowrap', width: 80 }}>
              {editingKey === row.category ? (
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
