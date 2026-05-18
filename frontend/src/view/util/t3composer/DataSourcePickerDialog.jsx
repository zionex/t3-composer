import React, { useState, useEffect, useCallback } from 'react';

import {
  Dialog, Box, Typography, Stack, Chip, IconButton, Button, Tooltip, Tabs, Tab,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import HubIcon from '@mui/icons-material/Hub';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import PsychologyIcon from '@mui/icons-material/Psychology';
import CodeIcon from '@mui/icons-material/Code';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import DbEntityTab from './DbEntityTab';
import OntologyTab from './OntologyTab';
import QueryInlineTab from './QueryInlineTab';

const HOLO = '#38bdf8';
const RGBA = (a) => `rgba(56,189,248,${a})`;

const KIND_META = {
  TABLE:           { label: '테이블',  color: '#38bdf8' },
  SP:              { label: 'SP',      color: '#f59e0b' },
  ONTOLOGY_QA:     { label: 'Q&A',     color: '#86C7A8' },
  ONTOLOGY_INTENT: { label: '의도',    color: '#9D8FD4' },
  ONTOLOGY_SP:     { label: 'UI SP',   color: '#2dd4bf' },
  INLINE_QUERY:    { label: '쿼리',    color: '#7CA7E0' },
};

/**
 * Data Source 선택 — 3탭(DB Entity · Ontology · Query Inline) JARVIS 풀스크린 팝업.
 *
 * 선택 항목은 하단 바스켓에 누적되고, [적용] 시 onConfirm(basket) 으로 반환.
 * basket item: { kind, key, label, meta }
 *   kind ∈ TABLE | SP | ONTOLOGY_QA | ONTOLOGY_INTENT | ONTOLOGY_SP | INLINE_QUERY
 *
 * props:
 *   open · onClose() · currentValue(basket[]|null) · onConfirm(basket[]) · targetCd
 */
function DataSourcePickerDialog({ open, onClose, currentValue, onConfirm, targetCd }) {
  const [tab, setTab] = useState('DB');
  const [basket, setBasket] = useState([]);

  useEffect(() => {
    if (open) {
      setBasket(Array.isArray(currentValue) ? currentValue : []);
      setTab('DB');
    }
  }, [open, currentValue]);

  const addToBasket = useCallback((item) => {
    setBasket((prev) => (
      prev.some((b) => b.kind === item.kind && String(b.key) === String(item.key))
        ? prev
        : [...prev, item]
    ));
  }, []);

  const removeFromBasket = useCallback((kind, key) => {
    setBasket((prev) => prev.filter((b) => !(b.kind === kind && String(b.key) === String(key))));
  }, []);

  const tabProps = { targetCd, basket, addToBasket, removeFromBasket };

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { bgcolor: '#05080f', backgroundImage: 'none', overflow: 'hidden' } }}
    >
      {/* 배경 — 시안 글로우 + 홀로 그리드 */}
      <Box sx={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 30% 40%, rgba(56,189,248,0.16) 0%, rgba(5,8,15,0) 60%)',
      }} />
      <Box sx={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.45,
        backgroundImage: `linear-gradient(${RGBA(0.06)} 1px, transparent 1px),`
                       + `linear-gradient(90deg, ${RGBA(0.06)} 1px, transparent 1px)`,
        backgroundSize: '46px 46px',
      }} />

      {/* ── 헤더 ── */}
      <Box sx={{
        position: 'relative', zIndex: 5, flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.1,
        borderBottom: `1px solid ${RGBA(0.3)}`,
      }}>
        <HubIcon sx={{ color: HOLO, filter: `drop-shadow(0 0 6px ${RGBA(0.8)})` }} />
        <Typography sx={{ fontWeight: 800, color: '#dffaff', letterSpacing: 1,
                          textShadow: `0 0 12px ${RGBA(0.7)}` }}>
          Data Source 선택 — 뉴럴 별자리 맵
        </Typography>
        <Chip
          size="small"
          label={targetCd ? `Target · ${targetCd}` : 'Target 미선택'}
          sx={{ height: 20, fontSize: 10, color: HOLO, bgcolor: RGBA(0.1),
                border: `1px solid ${RGBA(0.4)}` }}
        />
        <Box sx={{ flex: 1 }} />
        <Tooltip title="닫기">
          <IconButton size="small" onClick={onClose} sx={{ color: '#9fc7d8' }}>
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* ── 탭 ── */}
      <Box sx={{ position: 'relative', zIndex: 5, flexShrink: 0, borderBottom: `1px solid ${RGBA(0.2)}` }}>
        <Tabs
          value={tab} onChange={(_, v) => setTab(v)}
          TabIndicatorProps={{ sx: { bgcolor: HOLO } }}
          sx={{ minHeight: 42, '& .MuiTab-root': { color: '#5b7a92', minHeight: 42, textTransform: 'none' },
                '& .Mui-selected': { color: `${HOLO} !important` } }}
        >
          <Tab value="DB"       icon={<AccountTreeIcon fontSize="small" />} iconPosition="start" label="DB Entity" />
          <Tab value="ONTOLOGY" icon={<PsychologyIcon fontSize="small" />}  iconPosition="start" label="Ontology" />
          <Tab value="QUERY"    icon={<CodeIcon fontSize="small" />}        iconPosition="start" label="Query Inline" />
        </Tabs>
      </Box>

      {/* ── 본문 ── */}
      <Box sx={{ position: 'relative', zIndex: 2, flex: 1, minHeight: 0, display: 'flex' }}>
        {tab === 'DB'       && <DbEntityTab {...tabProps} />}
        {tab === 'ONTOLOGY' && <OntologyTab {...tabProps} />}
        {tab === 'QUERY'    && <QueryInlineTab {...tabProps} />}
      </Box>

      {/* ── 하단 바스켓 바 ── */}
      <Box sx={{
        position: 'relative', zIndex: 6, flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.1,
        borderTop: `1px solid ${RGBA(0.3)}`, bgcolor: 'rgba(5,8,15,0.9)',
      }}>
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#9fc7d8', flexShrink: 0 }}>
          선택 {basket.length}
        </Typography>
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', gap: 0.6, flexWrap: 'nowrap',
                   overflowX: 'auto', py: 0.5 }}>
          {basket.length === 0 && (
            <Typography sx={{ fontSize: 11.5, color: '#5b7a92' }}>
              탭에서 테이블·SP·온톨로지·쿼리를 선택하면 여기에 담깁니다.
            </Typography>
          )}
          {basket.map((b) => {
            const m = KIND_META[b.kind] || { label: b.kind, color: '#9fc7d8' };
            return (
              <Chip
                key={`${b.kind}_${b.key}`}
                size="small"
                label={(
                  <span style={{ fontSize: 11 }}>
                    <span style={{ color: m.color, fontWeight: 700 }}>{m.label}</span>
                    {'  '}
                    <span style={{ color: '#dffaff' }}>{b.label}</span>
                  </span>
                )}
                onDelete={() => removeFromBasket(b.kind, b.key)}
                sx={{
                  flexShrink: 0, height: 22, bgcolor: 'rgba(9,20,38,0.95)',
                  border: `1px solid ${m.color}66`,
                  '& .MuiChip-deleteIcon': { color: '#9fc7d8', fontSize: 15 },
                }}
              />
            );
          })}
        </Box>
        {basket.length > 0 && (
          <Button size="small" onClick={() => setBasket([])} sx={{ color: '#9fc7d8', flexShrink: 0 }}>
            전체 해제
          </Button>
        )}
        <Button onClick={onClose} sx={{ color: '#9fc7d8', flexShrink: 0 }}>취소</Button>
        <Button
          variant="contained" startIcon={<CheckCircleIcon />}
          onClick={() => { onConfirm(basket); onClose(); }}
          sx={{ bgcolor: HOLO, color: '#04141f', fontWeight: 800, flexShrink: 0,
                '&:hover': { bgcolor: '#7dd3fc' } }}
        >
          적용 ({basket.length})
        </Button>
      </Box>
    </Dialog>
  );
}

export default DataSourcePickerDialog;
