import React, { useCallback, useEffect, useState } from 'react';
import {
  Box, Stack, TextField, Button, MenuItem, Typography, Alert, Chip, Divider,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';

import { fetchEntity, createEntity, updateEntity, deleteEntity } from '../../api';

const STATUSES = ['CANDIDATE', 'REVIEWING', 'CONFIRMED'];

function EntityEditor({ id, targetCd, onSaved, onDeleted, onCancelNew }) {
  const isNew = id == null;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [dto, setDto] = useState({
    id: null, version: '1.0', name: '', entityType: '', description: '',
    terms: [], status: 'CONFIRMED', importanceScore: 0.5,
    relatedTableNames: [], notes: '',
  });

  const reload = useCallback(async () => {
    if (isNew) {
      setDto({ id: null, version: '1.0', name: '', entityType: '', description: '',
               terms: [], status: 'CONFIRMED', importanceScore: 0.5,
               relatedTableNames: [], notes: '' });
      return;
    }
    setLoading(true); setError(null);
    try {
      const r = await fetchEntity(id, targetCd);
      setDto({ ...(r.data || {}),
        terms: r.data?.terms || [],
        relatedTableNames: r.data?.relatedTableNames || [] });
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || '조회 실패');
    } finally { setLoading(false); }
  }, [id, targetCd, isNew]);

  useEffect(() => { reload(); }, [reload]);

  const setField = (k) => (e) => setDto((d) => ({ ...d, [k]: e?.target ? e.target.value : e }));
  const setValue = (k, v) => setDto((d) => ({ ...d, [k]: v }));

  const validate = () => {
    if (!dto.name?.trim()) return 'Name 은 필수입니다.';
    if (!dto.entityType?.trim()) return 'Entity Type 은 필수입니다.';
    return null;
  };

  const handleSave = async () => {
    const v = validate();
    if (v) { setError(v); return; }
    setSaving(true); setError(null); setInfo(null);
    try {
      const r = isNew
        ? await createEntity(dto, targetCd)
        : await updateEntity(id, dto, targetCd);
      setInfo(isNew ? '신규 저장 완료' : '저장 완료');
      onSaved?.(r.data);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || '저장 실패');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (isNew) return;
    if (!window.confirm('정말 삭제하시겠습니까? (soft delete)')) return;
    setSaving(true);
    try {
      await deleteEntity(id, targetCd);
      onDeleted?.();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || '삭제 실패');
    } finally { setSaving(false); }
  };

  const addChip = (key) => () => {
    const text = window.prompt(`새 ${key} 항목`);
    if (text == null || !text.trim()) return;
    setDto((d) => ({ ...d, [key]: [...(d[key] || []), text.trim()] }));
  };
  const removeChip = (key, idx) =>
    setDto((d) => ({ ...d, [key]: (d[key] || []).filter((_, i) => i !== idx) }));

  if (loading) return <Typography>로딩…</Typography>;

  return (
    <Box>
      <Typography sx={{ fontSize: 14, fontWeight: 700, mb: 1 }}>
        {isNew ? '✚ 새 Entity' : `Entity · ${dto.name || dto.id}`}
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
      {info && <Alert severity="success" sx={{ mb: 1 }}>{info}</Alert>}

      <Stack spacing={2}>
        <Stack direction="row" spacing={2}>
          <TextField label="Name" size="small" required sx={{ flex: 1 }}
            value={dto.name || ''} onChange={setField('name')} />
          <TextField label="Entity Type" size="small" required sx={{ flex: 1 }}
            value={dto.entityType || ''} onChange={setField('entityType')} />
        </Stack>

        <TextField label="Description" size="small" multiline rows={3} fullWidth
          value={dto.description || ''} onChange={setField('description')} />

        <Stack direction="row" spacing={2}>
          <TextField select label="Status" size="small" sx={{ width: 180 }}
            value={dto.status || 'CONFIRMED'} onChange={setField('status')}>
            {STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
          <TextField label="Importance Score (0-1)" size="small" type="number"
            inputProps={{ min: 0, max: 1, step: 0.05 }}
            value={dto.importanceScore ?? ''}
            onChange={(e) => setValue('importanceScore',
              e.target.value === '' ? null : Number(e.target.value))} />
        </Stack>

        <Box>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography sx={{ fontSize: 12, fontWeight: 700 }}>Terms (검색 별칭)</Typography>
            <Button size="small" startIcon={<AddIcon />} onClick={addChip('terms')}>추가</Button>
          </Stack>
          <Box sx={{ mt: 0.5 }}>
            {(dto.terms || []).map((p, i) => (
              <Chip key={i} label={p} size="small" sx={{ mr: 0.5, mb: 0.5 }}
                onDelete={() => removeChip('terms', i)} deleteIcon={<CloseIcon />} />
            ))}
          </Box>
        </Box>

        <Box>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography sx={{ fontSize: 12, fontWeight: 700 }}>연관 Table</Typography>
            <Button size="small" startIcon={<AddIcon />} onClick={addChip('relatedTableNames')}>추가</Button>
          </Stack>
          <Box sx={{ mt: 0.5 }}>
            {(dto.relatedTableNames || []).map((p, i) => (
              <Chip key={i} label={p} size="small" sx={{ mr: 0.5, mb: 0.5, fontFamily: 'monospace' }}
                onDelete={() => removeChip('relatedTableNames', i)} deleteIcon={<CloseIcon />} />
            ))}
          </Box>
        </Box>

        <Divider />

        <Stack direction="row" spacing={1}>
          <Button variant="contained" startIcon={<SaveIcon />} disabled={saving}
            onClick={handleSave} sx={{ bgcolor: '#86C7A8', '&:hover': { bgcolor: '#73b596' } }}>
            저장
          </Button>
          <Button variant="outlined" onClick={isNew ? onCancelNew : reload} disabled={saving}>
            {isNew ? '취소' : '다시 불러오기'}
          </Button>
          <Box sx={{ flex: 1 }} />
          {!isNew && (
            <Button variant="outlined" color="error" startIcon={<DeleteOutlineIcon />}
              disabled={saving} onClick={handleDelete}>삭제 (soft)</Button>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}

export default EntityEditor;
