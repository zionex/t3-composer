/**
 * DataInlineEditor — layer.dataSource 의 controlled 편집기.
 *   DataMiniDialog (popup) 와 DataAndFilterStep accordion 두 곳에서 재사용.
 *
 *   props:
 *     dataSource     { mode, naturalText, references, sqlBlocks }
 *     onChange(next) dataSource 부분/전체 갱신 — 즉시 호출 (controlled)
 *     targetCd       Table/SP autocomplete 옵션 fetch
 *     onOpenDataSourcePicker?  optional — 풀스크린 별자리 탐색
 *
 *   Plan: docs/superpowers/plans/2026-05-25-composer-canvas-phase2e4.md (Task 1)
 *   Spec: docs/superpowers/specs/2026-05-25-composer-canvas-phase2e4-data-accordion-design.md
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  TextField, Button, Box, Chip, Typography, IconButton, Stack, Autocomplete, CircularProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';

import { listSchemaTables, listSchemaProcedures } from './api';

const REF_KINDS = [
  { kind: 'TABLE',  label: 'Table',      color: '#3b82f6' },
  { kind: 'SP',     label: 'SP',         color: '#8b5cf6' },
  { kind: 'ENTITY', label: 'JPA Entity', color: '#10b981' },
];

function inferMode(references, sqlBlocks) {
  if (references.length > 0 && sqlBlocks.length > 0) return 'MIXED';
  if (sqlBlocks.length > 0) return 'SQL';
  if (references.length === 1) return references[0].kind;
  if (references.length > 1) return 'MIXED';
  return 'NL';
}

function DataInlineEditor({ dataSource, onChange, targetCd, onOpenDataSourcePicker }) {
  const ds = dataSource || { mode: 'NL', naturalText: '', references: [], sqlBlocks: [] };
  const naturalText = ds.naturalText || '';
  const references  = ds.references  || [];
  const sqlBlocks   = ds.sqlBlocks   || [];

  const [addKind, setAddKind] = useState(null);
  const [addName, setAddName] = useState('');
  const [addSql, setAddSql]   = useState('');

  const [tableOptions, setTableOptions] = useState([]);
  const [spOptions, setSpOptions]       = useState([]);
  const [tablesConnected, setTablesConn] = useState(false);
  const [spsConnected, setSpsConn]       = useState(false);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [spsLoading, setSpsLoading]       = useState(false);

  useEffect(() => {
    let alive = true;
    setTablesLoading(true);
    listSchemaTables(targetCd)
      .then((res) => {
        if (!alive) return;
        const data = res?.data || {};
        setTablesConn(!!data.connected);
        setTableOptions(Array.isArray(data.tables) ? data.tables : []);
      })
      .catch(() => { if (alive) { setTablesConn(false); setTableOptions([]); } })
      .finally(() => { if (alive) setTablesLoading(false); });
    return () => { alive = false; };
  }, [targetCd]);

  useEffect(() => {
    let alive = true;
    setSpsLoading(true);
    listSchemaProcedures(targetCd)
      .then((res) => {
        if (!alive) return;
        const data = res?.data || {};
        setSpsConn(!!data.connected);
        setSpOptions(Array.isArray(data.procedures) ? data.procedures : []);
      })
      .catch(() => { if (alive) { setSpsConn(false); setSpOptions([]); } })
      .finally(() => { if (alive) setSpsLoading(false); });
    return () => { alive = false; };
  }, [targetCd]);

  const tableOptionStrings = useMemo(
    () => tableOptions.map((t) => t.tableName || t.name).filter(Boolean),
    [tableOptions]
  );
  const spOptionStrings = useMemo(
    () => spOptions.map((s) => s.procedureName || s.name).filter(Boolean),
    [spOptions]
  );

  const patch = (next) => {
    const nextDs = { ...ds, ...next };
    nextDs.mode = inferMode(nextDs.references || [], nextDs.sqlBlocks || []);
    onChange(nextDs);
  };

  const handleNaturalText = (v) => patch({ naturalText: v });

  const handleAddRef = () => {
    if (!addKind || !addName.trim()) return;
    patch({ references: [...references, { kind: addKind, name: addName.trim() }] });
    setAddKind(null);
    setAddName('');
  };
  const handleRemoveRef = (idx) => {
    patch({ references: references.filter((_, i) => i !== idx) });
  };

  const handleAddSql = () => {
    if (!addSql.trim()) return;
    patch({ sqlBlocks: [...sqlBlocks, addSql.trim()] });
    setAddKind(null);
    setAddSql('');
  };
  const handleRemoveSql = (idx) => {
    patch({ sqlBlocks: sqlBlocks.filter((_, i) => i !== idx) });
  };
  const handleUpdateSql = (idx, next) => {
    patch({ sqlBlocks: sqlBlocks.map((s, i) => (i === idx ? next : s)) });
  };

  let addOptions = [];
  if (addKind === 'TABLE') addOptions = tableOptionStrings;
  else if (addKind === 'SP') addOptions = spOptionStrings;
  const isFetchingForAdd = (addKind === 'TABLE' && tablesLoading)
                        || (addKind === 'SP'    && spsLoading);

  return (
    <Box>
      <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
        💬 화면 설명 (자연어)
      </Typography>
      <TextField
        value={naturalText}
        onChange={(e) => handleNaturalText(e.target.value)}
        fullWidth multiline minRows={2} maxRows={6}
        placeholder='예: "사용자 마스터. ID·USERNAME·DISPLAY_NAME·ENABLED 컬럼."'
        sx={{ mt: 0.5, mb: 1.5,
              '& .MuiOutlinedInput-root': { fontSize: 12, bgcolor: '#fff' } }}
      />

      <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
        🔗 데이터 객체 참조 (선택)
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6, mt: 0.7, mb: 1 }}>
        {references.map((ref, idx) => {
          const meta = REF_KINDS.find((k) => k.kind === ref.kind);
          return (
            <Chip
              key={`${ref.kind}-${ref.name}-${idx}`}
              label={`${meta?.label || ref.kind}: ${ref.name}`}
              onDelete={() => handleRemoveRef(idx)}
              size="small"
              sx={{ bgcolor: `${meta?.color || '#64748b'}22`,
                    color: meta?.color || '#64748b', fontWeight: 700, fontSize: 11 }}
            />
          );
        })}
      </Box>

      {addKind === null && (
        <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
          {REF_KINDS.map((k) => (
            <Button key={k.kind} size="small" variant="outlined"
                    onClick={() => { setAddKind(k.kind); setAddName(''); }}
                    sx={{ fontSize: 11, py: 0.3, borderColor: k.color, color: k.color }}>
              + {k.label}
            </Button>
          ))}
          <Button size="small" variant="outlined"
                  onClick={() => { setAddKind('SQL'); setAddSql(''); }}
                  sx={{ fontSize: 11, py: 0.3, borderColor: '#0ea5e9', color: '#0369a1' }}>
            + SQL
          </Button>
          {onOpenDataSourcePicker && (
            <Button size="small" variant="outlined" startIcon={<SearchIcon fontSize="small" />}
                    onClick={onOpenDataSourcePicker}
                    sx={{ fontSize: 11, py: 0.3, borderColor: '#facc15', color: '#713f12' }}>
              Data Source 탐색
            </Button>
          )}
        </Stack>
      )}

      {(addKind === 'TABLE' || addKind === 'SP') && (
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="caption" sx={{ fontWeight: 700,
                                               color: REF_KINDS.find((k) => k.kind === addKind)?.color, minWidth: 60 }}>
            + {REF_KINDS.find((k) => k.kind === addKind)?.label}:
          </Typography>
          <Autocomplete
            freeSolo
            options={addOptions}
            loading={isFetchingForAdd}
            value={addName}
            onInputChange={(_e, v) => setAddName(v || '')}
            onChange={(_e, v) => setAddName(v || '')}
            sx={{ flex: 1 }}
            renderInput={(params) => (
              <TextField {...params} size="small" autoFocus
                placeholder={addKind === 'TABLE' ? 'TB_AD_USER' : 'SP_UI_AD_01_Q1'}
                helperText={
                  isFetchingForAdd ? '목록 조회 중...' :
                  (addKind === 'TABLE'
                    ? (tablesConnected
                        ? `${tableOptionStrings.length}개 Table 조회됨`
                        : 'DB 미연결 — 자유 텍스트 입력 가능')
                    : (spsConnected
                        ? `${spOptionStrings.length}개 SP 조회됨`
                        : 'DB 미연결 — 자유 텍스트 입력 가능'))
                }
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (<>
                    {isFetchingForAdd ? <CircularProgress size={14} /> : null}
                    {params.InputProps.endAdornment}
                  </>),
                  sx: { fontSize: 12, fontFamily: 'monospace' },
                }}
                FormHelperTextProps={{ sx: { fontSize: 10, ml: 0 } }}
              />
            )}
          />
          <Button size="small" variant="contained" onClick={handleAddRef}
                  disabled={!addName.trim()}>추가</Button>
          <Button size="small" onClick={() => { setAddKind(null); setAddName(''); }}>취소</Button>
        </Stack>
      )}

      {addKind === 'ENTITY' && (
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#10b981', minWidth: 60 }}>
            + JPA Entity:
          </Typography>
          <TextField
            value={addName} onChange={(e) => setAddName(e.target.value)}
            size="small" autoFocus
            placeholder='User · UserInfo · DashboardKpi 등'
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddRef(); }}
            sx={{ flex: 1, '& .MuiOutlinedInput-input': { fontSize: 12, fontFamily: 'monospace' } }}
          />
          <Button size="small" variant="contained" onClick={handleAddRef}
                  disabled={!addName.trim()}>추가</Button>
          <Button size="small" onClick={() => { setAddKind(null); setAddName(''); }}>취소</Button>
        </Stack>
      )}

      {addKind === 'SQL' && (
        <Box>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#0369a1' }}>
            + Inline SQL — 직접 입력
          </Typography>
          <TextField
            value={addSql} onChange={(e) => setAddSql(e.target.value)}
            fullWidth multiline minRows={3} maxRows={10}
            placeholder='SELECT ID, USERNAME, DISPLAY_NAME FROM TB_AD_USER WHERE ENABLED = 1'
            sx={{ mt: 0.5,
                  '& .MuiOutlinedInput-root': { fontSize: 11, fontFamily: 'monospace', bgcolor: '#0f172a',
                                                 color: '#e2e8f0' } }}
          />
          <Stack direction="row" spacing={1} sx={{ mt: 0.7 }}>
            <Button size="small" variant="contained" onClick={handleAddSql}
                    disabled={!addSql.trim()}>SQL 추가</Button>
            <Button size="small" onClick={() => { setAddKind(null); setAddSql(''); }}>취소</Button>
          </Stack>
        </Box>
      )}

      {sqlBlocks.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#0369a1' }}>
            📄 등록된 Inline SQL ({sqlBlocks.length})
          </Typography>
          <Stack spacing={1} sx={{ mt: 0.5 }}>
            {sqlBlocks.map((sql, idx) => (
              <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                <TextField
                  value={sql} onChange={(e) => handleUpdateSql(idx, e.target.value)}
                  fullWidth multiline minRows={2} maxRows={6}
                  label={`SQL #${idx + 1}`}
                  sx={{ '& .MuiOutlinedInput-root': { fontSize: 11, fontFamily: 'monospace',
                                                       bgcolor: '#0f172a', color: '#e2e8f0' },
                        '& .MuiInputLabel-root': { color: '#0369a1', fontWeight: 700 } }}
                  InputLabelProps={{ shrink: true }}
                />
                <IconButton size="small" onClick={() => handleRemoveSql(idx)}>
                  <DeleteIcon fontSize="small" sx={{ color: '#ef4444' }} />
                </IconButton>
              </Box>
            ))}
            <Button size="small" startIcon={<AddIcon />} variant="outlined"
                    onClick={() => { setAddKind('SQL'); setAddSql(''); }}
                    sx={{ alignSelf: 'flex-start', fontSize: 11, py: 0.3,
                          borderColor: '#0ea5e9', color: '#0369a1' }}>
              SQL 추가
            </Button>
          </Stack>
        </Box>
      )}
    </Box>
  );
}

export default DataInlineEditor;
