import React, { useState, useCallback } from 'react';

import {
  Box, Stack, TextField, Typography, Button, Chip, CircularProgress, Alert,
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import CodeIcon from '@mui/icons-material/Code';

import { extractAndLookupTables } from './api';

const HOLO = '#38bdf8';

/**
 * DataSourcePickerDialog 의 "Query Inline" 탭 — SQL 직접 입력/붙여넣기.
 *   - 쿼리에서 테이블 추출 → 실제 컬럼 존재 검증 (환각 컬럼 방지)
 *   - "데이터 소스에 추가" → 바스켓에 INLINE_QUERY 로 담김
 *
 * props: targetCd · basket · addToBasket(item) · removeFromBasket(kind,key)
 */
function QueryInlineTab({ targetCd, basket, addToBasket, removeFromBasket }) {
  const [sql, setSql] = useState('');
  const [extracted, setExtracted] = useState(null);   // { extractedNames, results }
  const [extracting, setExtracting] = useState(false);
  const [err, setErr] = useState(null);

  const queryItems = (basket || []).filter((b) => b.kind === 'INLINE_QUERY');

  const handleExtract = useCallback(async () => {
    if (!sql.trim()) return;
    setExtracting(true);
    setErr(null);
    try {
      const res = await extractAndLookupTables(sql, targetCd);
      setExtracted({
        extractedNames: res?.data?.extractedNames || [],
        results: res?.data?.results || {},
      });
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || '테이블 추출 실패');
    } finally {
      setExtracting(false);
    }
  }, [sql, targetCd]);

  const handleAdd = useCallback(() => {
    const text = sql.trim();
    if (!text) return;
    const tables = extracted ? extracted.extractedNames : [];
    const n = queryItems.length + 1;
    addToBasket({
      kind: 'INLINE_QUERY',
      key: `inline-${Date.now()}`,
      label: `쿼리 ${n} — ${text.slice(0, 36).replace(/\s+/g, ' ')}${text.length > 36 ? '…' : ''}`,
      meta: { sql: text, extractedTables: tables },
    });
    setSql('');
    setExtracted(null);
  }, [sql, extracted, queryItems.length, addToBasket]);

  return (
    <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', p: 2, gap: 1.5,
               overflowY: 'auto' }}>
      <Typography sx={{ fontSize: 12, color: '#9fc7d8' }}>
        화면이 사용할 SQL 을 직접 입력하거나 붙여넣으세요. 추가하면 Claude 가 이 쿼리를 데이터 소스로 참조합니다.
      </Typography>

      <TextField
        multiline minRows={8} maxRows={16}
        placeholder={'예)\nSELECT WO_NO, ITEM_CD, QTY, PLAN_DATE\n  FROM TB_FP_WO WITH (NOLOCK)\n WHERE PLAN_DATE BETWEEN @FROM AND @TO\n ORDER BY PLAN_DATE'}
        value={sql}
        onChange={(e) => setSql(e.target.value)}
        InputProps={{ sx: { fontFamily: 'monospace', fontSize: 12.5, color: '#dffaff',
                            bgcolor: 'rgba(5,8,15,0.7)', alignItems: 'flex-start' } }}
        sx={{ '& fieldset': { borderColor: 'rgba(56,189,248,0.3)' } }}
      />

      <Stack direction="row" spacing={1}>
        <Button
          size="small" startIcon={extracting ? <CircularProgress size={14} /> : <TravelExploreIcon />}
          disabled={!sql.trim() || extracting}
          onClick={handleExtract}
          sx={{ color: HOLO, border: `1px solid ${HOLO}55` }}
        >
          쿼리에서 테이블 추출 · 컬럼 검증
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button
          size="small" variant="contained" startIcon={<AddCircleIcon />}
          disabled={!sql.trim()}
          onClick={handleAdd}
          sx={{ bgcolor: HOLO, color: '#04141f', fontWeight: 800, '&:hover': { bgcolor: '#7dd3fc' } }}
        >
          데이터 소스에 추가
        </Button>
      </Stack>

      {err && <Alert severity="warning">{err}</Alert>}

      {/* 추출된 테이블 — 존재 검증 결과 */}
      {extracted && (
        <Box sx={{ border: '1px solid rgba(56,189,248,0.25)', borderRadius: 1, p: 1.2,
                   bgcolor: 'rgba(9,20,38,0.55)' }}>
          <Typography sx={{ fontSize: 11, color: '#9fc7d8', fontWeight: 700, mb: 0.6 }}>
            감지된 테이블 {extracted.extractedNames.length}개
          </Typography>
          {extracted.extractedNames.length === 0 && (
            <Typography sx={{ fontSize: 11, color: '#5b7a92' }}>
              쿼리에서 TB_* 패턴을 찾지 못했습니다.
            </Typography>
          )}
          <Stack spacing={0.4}>
            {extracted.extractedNames.map((name) => {
              const info = extracted.results[name.toUpperCase()] || {};
              const exists = info.exists;
              return (
                <Stack key={name} direction="row" spacing={0.7} alignItems="center">
                  {exists
                    ? <CheckCircleIcon sx={{ fontSize: 15, color: '#86C7A8' }} />
                    : <HighlightOffIcon sx={{ fontSize: 15, color: '#E6C079' }} />}
                  <Typography sx={{ fontSize: 11.5, fontFamily: 'monospace', color: '#dffaff' }}>
                    {name}
                  </Typography>
                  {exists && (
                    <Chip label={`${(info.columns || []).length} cols`} size="small"
                          sx={{ height: 15, fontSize: 9, bgcolor: 'rgba(56,189,248,0.18)', color: HOLO }} />
                  )}
                  {!exists && (
                    <Typography sx={{ fontSize: 10.5, color: '#E6C079' }}>미존재</Typography>
                  )}
                </Stack>
              );
            })}
          </Stack>
        </Box>
      )}

      {/* 담긴 인라인 쿼리 */}
      {queryItems.length > 0 && (
        <Box>
          <Typography sx={{ fontSize: 11, color: '#9fc7d8', fontWeight: 700, mb: 0.6 }}>
            담긴 쿼리 {queryItems.length}개
          </Typography>
          <Stack spacing={0.6}>
            {queryItems.map((q) => (
              <Box key={q.key} sx={{ border: '1px solid rgba(56,189,248,0.22)', borderRadius: 1,
                                     p: 1, bgcolor: 'rgba(5,8,15,0.6)' }}>
                <Stack direction="row" alignItems="center" spacing={0.7} sx={{ mb: 0.4 }}>
                  <CodeIcon sx={{ fontSize: 15, color: HOLO }} />
                  <Typography sx={{ fontSize: 11.5, color: '#dffaff', fontWeight: 600, flex: 1 }}>
                    {q.label}
                  </Typography>
                  <Chip label="제거" size="small" onClick={() => removeFromBasket('INLINE_QUERY', q.key)}
                        sx={{ height: 18, fontSize: 9.5, color: '#9fc7d8',
                              bgcolor: 'rgba(56,189,248,0.12)', cursor: 'pointer' }} />
                </Stack>
                <Typography component="pre" sx={{ fontSize: 10.5, fontFamily: 'monospace',
                            color: '#7fa8c0', m: 0, whiteSpace: 'pre-wrap', maxHeight: 70,
                            overflow: 'hidden' }}>
                  {q.meta?.sql}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
}

export default QueryInlineTab;
