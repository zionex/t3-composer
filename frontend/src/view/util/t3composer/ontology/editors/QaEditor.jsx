import React, { useCallback, useEffect, useState } from 'react';
import {
  Box, Stack, TextField, Button, MenuItem, Typography, Alert, Chip, Divider,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';

import { fetchQa, createQa, updateQa, deleteQa } from '../../api';
import AiSuggestButton from '../AiSuggestButton';

const DB_TYPES = ['mssql', 'oracle', 'postgresql'];

/**
 * Q&A 편집 폼. CRUD.
 * Props: id (null=신규) · targetCd · onSaved(dto) · onDeleted() · onCancelNew()
 */
function QaEditor({ id, targetCd, onSaved, onDeleted, onCancelNew }) {
  const isNew = id == null;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [dto, setDto] = useState({
    id: null, question: '', answer: '', dbType: 'mssql', domain: '',
    paraphrases: [], relatedEntityIds: [], notes: '', modifyDttm: null,
  });

  const reload = useCallback(async () => {
    if (isNew) {
      setDto({ id: null, question: '', answer: '', dbType: 'mssql', domain: '',
               paraphrases: [], relatedEntityIds: [], notes: '', modifyDttm: null });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = await fetchQa(id, targetCd);
      setDto({ ...(r.data || {}),
        paraphrases: r.data?.paraphrases || [],
        relatedEntityIds: r.data?.relatedEntityIds || [] });
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || '조회 실패');
    } finally {
      setLoading(false);
    }
  }, [id, targetCd, isNew]);

  useEffect(() => { reload(); }, [reload]);

  const setField = (k) => (e) => setDto((d) => ({ ...d, [k]: e?.target ? e.target.value : e }));
  const setValue = (k, v) => setDto((d) => ({ ...d, [k]: v }));

  const validate = () => {
    if (!dto.question?.trim()) return 'Question 은 필수입니다.';
    if (!dto.answer?.trim())   return 'Answer 는 필수입니다.';
    return null;
  };

  const handleSave = async () => {
    const v = validate();
    if (v) { setError(v); return; }
    setSaving(true); setError(null); setInfo(null);
    try {
      const r = isNew
        ? await createQa(dto, targetCd)
        : await updateQa(id, dto, dto.modifyDttm, targetCd);
      setInfo(isNew ? '신규 저장 완료' : '저장 완료');
      onSaved?.(r.data);
    } catch (e) {
      if (e?.response?.status === 412) {
        setError('다른 사용자가 이미 수정했습니다. [다시 불러오기] 를 눌러주세요.');
      } else {
        setError(e?.response?.data?.message || e?.message || '저장 실패');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isNew) return;
    if (!window.confirm('정말 삭제하시겠습니까? (soft delete — use_yn=N)')) return;
    setSaving(true);
    try {
      await deleteQa(id, targetCd);
      onDeleted?.();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || '삭제 실패');
    } finally {
      setSaving(false);
    }
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
        {isNew ? '✚ 새 Q&A' : 'Q&A 편집'}
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
      {info && <Alert severity="success" sx={{ mb: 1 }}>{info}</Alert>}

      <Stack spacing={2}>
        <Stack direction="row" alignItems="flex-end" spacing={0.5}>
          <TextField label="Question" fullWidth size="small" required
            value={dto.question || ''} onChange={setField('question')} />
          <AiSuggestButton field="question" kind="QA" targetCd={targetCd}
            currentValue={dto.question} row={dto}
            onAccept={(v) => setValue('question', String(v))} />
        </Stack>

        <Stack direction="row" alignItems="flex-end" spacing={0.5}>
          <TextField label="Answer" fullWidth size="small" required multiline minRows={16} maxRows={22}
            value={dto.answer || ''} onChange={setField('answer')}
            sx={{ '& textarea': { resize: 'vertical', fontFamily: 'ui-monospace, Menlo, Consolas, monospace', fontSize: 12 } }} />
          <AiSuggestButton field="answer" kind="QA" targetCd={targetCd}
            currentValue={dto.answer} row={dto}
            onAccept={(v) => setValue('answer', String(v))} />
        </Stack>

        <Stack direction="row" spacing={2}>
          <Stack direction="row" alignItems="flex-end" spacing={0.5} sx={{ flex: 1 }}>
            <TextField label="Domain" size="small" fullWidth
              value={dto.domain || ''} onChange={setField('domain')} />
            <AiSuggestButton field="domain" kind="QA" targetCd={targetCd}
              currentValue={dto.domain} row={dto}
              onAccept={(v) => setValue('domain', String(v))} />
          </Stack>
          <TextField select label="DB Type" size="small" sx={{ width: 160 }}
            value={dto.dbType || 'mssql'} onChange={setField('dbType')}>
            {DB_TYPES.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
          </TextField>
        </Stack>

        <Box>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography sx={{ fontSize: 12, fontWeight: 700 }}>Paraphrases</Typography>
            <Button size="small" startIcon={<AddIcon />} onClick={addChip('paraphrases')}>추가</Button>
            <AiSuggestButton field="paraphrases" kind="QA" targetCd={targetCd}
              currentValue={dto.paraphrases} row={dto}
              onAccept={(v) => setValue('paraphrases', Array.isArray(v) ? v : [String(v)])} />
          </Stack>
          <Box sx={{ mt: 0.5 }}>
            {(dto.paraphrases || []).map((p, i) => (
              <Chip key={i} label={p} size="small" sx={{ mr: 0.5, mb: 0.5 }}
                onDelete={() => removeChip('paraphrases', i)} deleteIcon={<CloseIcon />} />
            ))}
            {(dto.paraphrases || []).length === 0 &&
              <Typography sx={{ fontSize: 11, color: '#6E7E96' }}>(없음)</Typography>}
          </Box>
        </Box>

        <Box>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography sx={{ fontSize: 12, fontWeight: 700 }}>연관 Entity (id)</Typography>
            <Button size="small" startIcon={<AddIcon />} onClick={addChip('relatedEntityIds')}>추가</Button>
            <AiSuggestButton field="relatedEntityIds" kind="QA" targetCd={targetCd}
              currentValue={dto.relatedEntityIds} row={dto}
              onAccept={(v) => setValue('relatedEntityIds', Array.isArray(v) ? v : [String(v)])} />
          </Stack>
          <Box sx={{ mt: 0.5 }}>
            {(dto.relatedEntityIds || []).map((p, i) => (
              <Chip key={i} label={p} size="small" sx={{ mr: 0.5, mb: 0.5, fontFamily: 'monospace' }}
                onDelete={() => removeChip('relatedEntityIds', i)} deleteIcon={<CloseIcon />} />
            ))}
            {(dto.relatedEntityIds || []).length === 0 &&
              <Typography sx={{ fontSize: 11, color: '#6E7E96' }}>(없음)</Typography>}
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

export default QaEditor;
