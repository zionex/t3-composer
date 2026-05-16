import React, { useEffect, useMemo, useState, useCallback } from 'react';

import {
  Box, Stack, TextField, InputAdornment, Typography,
  ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import PsychologyIcon from '@mui/icons-material/Psychology';
import FunctionsIcon from '@mui/icons-material/Functions';

import { listOntologyQa, listOntologyView, listSchemaProcedures } from './api';
import OntologyList from './OntologyList';

const HOLO = '#38bdf8';

const SECTIONS = [
  { id: 'QA',     label: 'Q&A',       icon: QuestionAnswerIcon, basketKind: 'ONTOLOGY_QA',
    desc: 'T3Insight Q&A 패턴 — 정형 질문/답변 (TB_IS_QAPATTERN)',
    emptyText: '등록된 Q&A 패턴이 없습니다.' },
  { id: 'INTENT', label: '화면 의도',  icon: PsychologyIcon,     basketKind: 'ONTOLOGY_INTENT',
    desc: 'View 온톨로지 — 화면별 의도(Intent) (tb_is_vwbusnss_ontlgy)',
    emptyText: '등록된 View 온톨로지가 없습니다.' },
  { id: 'UISP',   label: 'UI 사용 SP', icon: FunctionsIcon,      basketKind: 'ONTOLOGY_SP',
    desc: 'UI 화면에서 사용하는 SP — SP_UI_* 프로시저',
    emptyText: 'SP_UI_* 프로시저가 없습니다.' },
];

/**
 * DataSourcePickerDialog 의 "Ontology" 탭 — Q&A / 화면 의도 / UI SP 3섹션.
 * 각 항목 선택 시 바스켓에 ONTOLOGY_QA / ONTOLOGY_INTENT / ONTOLOGY_SP 로 담긴다.
 *
 * props: targetCd · basket · addToBasket(item) · removeFromBasket(kind,key)
 */
function OntologyTab({ targetCd, basket, addToBasket, removeFromBasket }) {
  const [tab, setTab] = useState('QA');
  const [search, setSearch] = useState('');
  const [data, setData] = useState({ QA: null, INTENT: null, UISP: null });
  const [loading, setLoading] = useState({});
  const [error, setError] = useState({});

  const section = SECTIONS.find((s) => s.id === tab);

  const loadSection = useCallback(async (id) => {
    setLoading((l) => ({ ...l, [id]: true }));
    setError((e) => ({ ...e, [id]: null }));
    try {
      let items = [];
      if (id === 'QA') {
        const r = await listOntologyQa('', 500);
        items = (Array.isArray(r.data) ? r.data : []).map((it) => ({
          category: 'QA', key: it.key, title: it.title, subtitle: it.subtitle,
        }));
      } else if (id === 'INTENT') {
        const r = await listOntologyView('', 500);
        items = (Array.isArray(r.data) ? r.data : []).map((it) => ({
          category: 'INTENT', key: it.key, title: it.title, subtitle: it.subtitle,
        }));
      } else {
        const r = await listSchemaProcedures(targetCd);
        const procs = Array.isArray(r?.data?.procedures) ? r.data.procedures : [];
        items = procs
          .filter((p) => /^SP_UI/i.test(p.procedureName || ''))
          .map((p) => ({
            category: 'UISP', key: p.procedureName, title: p.procedureName,
            subtitle: `${p.domain} · ${p.objectType}`,
          }));
      }
      setData((d) => ({ ...d, [id]: items }));
    } catch (e) {
      setError((er) => ({ ...er, [id]: e?.response?.data?.message || e?.message || '조회 실패' }));
      setData((d) => ({ ...d, [id]: [] }));
    } finally {
      setLoading((l) => ({ ...l, [id]: false }));
    }
  }, [targetCd]);

  useEffect(() => {
    if (data[tab] == null && !loading[tab]) loadSection(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const items = data[tab] || [];
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => (it.title || '').toLowerCase().includes(q)
                             || (it.subtitle || '').toLowerCase().includes(q));
  }, [items, search]);

  const isIn = useCallback(
    (kind, key) => (basket || []).some((b) => b.kind === kind && String(b.key) === String(key)),
    [basket],
  );

  const toggle = useCallback((it) => {
    const kind = section.basketKind;
    if (isIn(kind, it.key)) {
      removeFromBasket(kind, it.key);
    } else {
      addToBasket({
        kind, key: it.key, label: it.title,
        meta: { title: it.title, subtitle: it.subtitle },
      });
    }
  }, [section, isIn, addToBasket, removeFromBasket]);

  return (
    <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', p: 1.5 }}>
      <ToggleButtonGroup
        size="small" exclusive value={tab} fullWidth
        onChange={(_, v) => v && setTab(v)}
        sx={{ mb: 1 }}
      >
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          const cnt = (basket || []).filter((b) => b.kind === s.basketKind).length;
          return (
            <ToggleButton key={s.id} value={s.id}
                          sx={{ color: '#9fc7d8', textTransform: 'none',
                                borderColor: 'rgba(56,189,248,0.3)',
                                '&.Mui-selected': { color: HOLO, bgcolor: 'rgba(56,189,248,0.18)' } }}>
              <Icon fontSize="small" sx={{ mr: 0.6 }} />
              {s.label}{cnt > 0 ? ` (${cnt})` : ''}
            </ToggleButton>
          );
        })}
      </ToggleButtonGroup>

      <Typography sx={{ fontSize: 11, color: '#5b7a92', mb: 1 }}>{section.desc}</Typography>

      <TextField
        size="small" placeholder={`${section.label} 검색`}
        value={search} onChange={(e) => setSearch(e.target.value)}
        sx={{
          mb: 1,
          '& .MuiInputBase-root': { color: '#dffaff', bgcolor: 'rgba(9,20,38,0.7)' },
          '& fieldset': { borderColor: 'rgba(56,189,248,0.3)' },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" sx={{ color: HOLO }} />
            </InputAdornment>
          ),
        }}
      />

      <OntologyList
        dark
        items={filtered}
        totalCount={items.length}
        loading={!!loading[tab]}
        error={error[tab]}
        isSelected={(it) => isIn(section.basketKind, it.key)}
        onToggle={toggle}
        emptyText={section.emptyText}
      />
    </Box>
  );
}

export default OntologyTab;
