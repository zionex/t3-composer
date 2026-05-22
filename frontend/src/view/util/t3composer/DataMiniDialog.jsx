/**
 * DataMiniDialog — ComposerCanvas 에서 layer 박스를 클릭했을 때 뜨는 MUI Dialog.
 *
 *   props:
 *     open      : boolean
 *     onClose   : () => void
 *     layer     : ComposerSpec.layers[i]  (편집 대상)
 *     onApply   : (nextLayer) => void     (수정된 layer 전달)
 *     targetCd? : string  (활성 Target DB code — Table/SP autocomplete 옵션 fetch 용)
 *     onOpenDataSourcePicker?: () => void (풀스크린 별자리 탐색 진입, optional)
 *
 *   디자인: docs/superpowers/specs/2026-05-22-pattern-driven-composer-redesign-design.md
 *           "Mini Dialog 디자인" 섹션
 *   Plan: docs/superpowers/plans/2026-05-22-composer-canvas-phase1.md (Task 3 + Task 8 강화)
 *
 *   Phase 1 강화 (Task 8):
 *     - + Table / + SP 입력을 자유 텍스트 대신 Autocomplete (운영 DB 실제 목록)
 *     - SQL 직접 입력 (sqlBlocks 배열)
 *     - JPA Entity 는 frontend 에서 lookup 어려움 → 자유 텍스트 유지
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, Chip, Typography, IconButton, Stack, Autocomplete, CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';

import { listSchemaTables, listSchemaProcedures } from './api';

const REF_KINDS = [
  { kind: 'TABLE',  label: 'Table',  color: '#3b82f6' },
  { kind: 'SP',     label: 'SP',     color: '#8b5cf6' },
  { kind: 'ENTITY', label: 'JPA Entity', color: '#10b981' },
];

function DataMiniDialog({ open, onClose, layer, onApply, targetCd, onOpenDataSourcePicker }) {
  const [naturalText, setNaturalText] = useState('');
  const [references, setReferences]   = useState([]);   // [{kind, name}]
  const [sqlBlocks, setSqlBlocks]     = useState([]);   // [string]
  const [addKind, setAddKind]         = useState(null); // 'TABLE'|'SP'|'ENTITY'|'SQL'
  const [addName, setAddName]         = useState('');
  const [addSql, setAddSql]           = useState('');

  // Table / SP 옵션 fetch (open 시 1회)
  const [tableOptions, setTableOptions] = useState([]);   // [{name, schema, type, domain}]
  const [spOptions, setSpOptions]       = useState([]);
  const [tablesConnected, setTablesConn] = useState(false);
  const [spsConnected, setSpsConn]       = useState(false);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [spsLoading, setSpsLoading]       = useState(false);

  // open + hydrate
  useEffect(() => {
    if (!open) return;
    setNaturalText(layer?.dataSource?.naturalText || '');
    setReferences(layer?.dataSource?.references || []);
    setSqlBlocks(layer?.dataSource?.sqlBlocks || []);
    setAddKind(null);
    setAddName('');
    setAddSql('');
  }, [open, layer]);

  // Table 목록 fetch
  useEffect(() => {
    if (!open) return;
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
  }, [open, targetCd]);

  // SP 목록 fetch
  useEffect(() => {
    if (!open) return;
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
  }, [open, targetCd]);

  // Autocomplete option label 추출
  const tableOptionStrings = useMemo(
    () => tableOptions.map(t => t.tableName || t.name).filter(Boolean),
    [tableOptions]
  );
  const spOptionStrings = useMemo(
    () => spOptions.map(s => s.procedureName || s.name).filter(Boolean),
    [spOptions]
  );

  const handleAddRef = () => {
    if (!addKind || !addName.trim()) return;
    setReferences([...references, { kind: addKind, name: addName.trim() }]);
    setAddKind(null);
    setAddName('');
  };
  const handleRemoveRef = (idx) => {
    setReferences(references.filter((_, i) => i !== idx));
  };

  const handleAddSql = () => {
    if (!addSql.trim()) return;
    setSqlBlocks([...sqlBlocks, addSql.trim()]);
    setAddKind(null);
    setAddSql('');
  };
  const handleRemoveSql = (idx) => {
    setSqlBlocks(sqlBlocks.filter((_, i) => i !== idx));
  };
  const handleUpdateSql = (idx, next) => {
    setSqlBlocks(sqlBlocks.map((s, i) => (i === idx ? next : s)));
  };

  const handleApply = () => {
    // mode 추론: 우선순위 SQL > references kind > NL
    let inferredMode = 'NL';
    if (references.length > 0 && sqlBlocks.length > 0) inferredMode = 'MIXED';
    else if (sqlBlocks.length > 0)                      inferredMode = 'SQL';
    else if (references.length === 1)                   inferredMode = references[0].kind;
    else if (references.length > 1)                     inferredMode = 'MIXED';

    onApply({
      ...layer,
      dataSource: {
        ...(layer?.dataSource || {}),
        mode: inferredMode,
        naturalText,
        references,
        sqlBlocks,
      },
    });
    onClose();
  };

  if (!layer) return null;

  // 현재 add 흐름의 옵션
  let addOptions = [];
  if (addKind === 'TABLE') addOptions = tableOptionStrings;
  else if (addKind === 'SP') addOptions = spOptionStrings;

  const isFetchingForAdd = (addKind === 'TABLE' && tablesLoading)
                        || (addKind === 'SP'    && spsLoading);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h6" sx={{ color: '#1e40af', fontWeight: 800 }}>
            📊 {layer.title || layer.key} · 데이터
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b' }}>
            type: {layer.type} {layer.subtype ? `· ${layer.subtype}` : ''}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* ───── 자연어 ───── */}
        <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
          💬 화면 설명 (자연어)
        </Typography>
        <TextField
          value={naturalText}
          onChange={(e) => setNaturalText(e.target.value)}
          fullWidth multiline minRows={3} maxRows={8}
          placeholder='예: "사용자 마스터. ID·USERNAME·DISPLAY_NAME·ENABLED 컬럼."'
          sx={{ mt: 0.5, mb: 1.5,
                '& .MuiOutlinedInput-root': { fontSize: 13, bgcolor: '#f8fafc' } }}
        />

        {/* ───── Data 참조 (Table/SP/Entity) ───── */}
        <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
          🔗 데이터 객체 참조 (선택) — 정확한 Table/SP/Entity 명시
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6, mt: 0.7, mb: 1 }}>
          {references.map((ref, idx) => {
            const meta = REF_KINDS.find(k => k.kind === ref.kind);
            return (
              <Chip
                key={`${ref.kind}-${ref.name}-${idx}`}
                label={`${meta?.label || ref.kind}: ${ref.name}`}
                onDelete={() => handleRemoveRef(idx)}
                size="small"
                sx={{ bgcolor: `${meta?.color || '#64748b'}22`,
                      color: meta?.color || '#64748b', fontWeight: 700 }}
              />
            );
          })}
        </Box>

        {/* ───── + 참조 추가 ───── */}
        {addKind === null && (
          <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
            {REF_KINDS.map(k => (
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

        {/* Table / SP autocomplete 추가 UI */}
        {(addKind === 'TABLE' || addKind === 'SP') && (
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="caption" sx={{ fontWeight: 700,
                                                 color: REF_KINDS.find(k => k.kind === addKind)?.color, minWidth: 80 }}>
              + {REF_KINDS.find(k => k.kind === addKind)?.label}:
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
                          : 'DB 미연결 — 자유 텍스트로 입력 가능')
                      : (spsConnected
                          ? `${spOptionStrings.length}개 SP/Function 조회됨`
                          : 'DB 미연결 — 자유 텍스트로 입력 가능'))
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

        {/* Entity 자유 텍스트 추가 */}
        {addKind === 'ENTITY' && (
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#10b981', minWidth: 80 }}>
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

        {/* SQL 추가 */}
        {addKind === 'SQL' && (
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#0369a1' }}>
              + Inline SQL — 직접 입력
            </Typography>
            <TextField
              value={addSql} onChange={(e) => setAddSql(e.target.value)}
              fullWidth multiline minRows={4} maxRows={12}
              placeholder='SELECT ID, USERNAME, DISPLAY_NAME FROM TB_AD_USER WHERE ENABLED = 1'
              sx={{ mt: 0.5,
                    '& .MuiOutlinedInput-root': { fontSize: 12, fontFamily: 'monospace', bgcolor: '#0f172a',
                                                   color: '#e2e8f0' } }}
            />
            <Stack direction="row" spacing={1} sx={{ mt: 0.7 }}>
              <Button size="small" variant="contained" onClick={handleAddSql}
                      disabled={!addSql.trim()}>SQL 추가</Button>
              <Button size="small" onClick={() => { setAddKind(null); setAddSql(''); }}>취소</Button>
            </Stack>
          </Box>
        )}

        {/* ───── 등록된 SQL 블록 목록 ───── */}
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
      </DialogContent>

      <DialogActions sx={{ px: 2, py: 1 }}>
        <Button onClick={onClose}>취소</Button>
        <Button onClick={handleApply} variant="contained">적용</Button>
      </DialogActions>
    </Dialog>
  );
}

export default DataMiniDialog;
