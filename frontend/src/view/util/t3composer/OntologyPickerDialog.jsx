import React, { useEffect, useMemo, useState } from 'react';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Chip,
  Box,
  Paper,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import HubIcon from '@mui/icons-material/Hub';
import ViewAgendaIcon from '@mui/icons-material/ViewAgenda';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import BubbleChartIcon from '@mui/icons-material/BubbleChart';

import {
  listOntologyView,
  listOntologyQa,
  listOntologyProcess,
  listOntologyEntity,
} from './api';
import OntologyList from './OntologyList';

const CATEGORIES = [
  { key: 'VIEW',    label: 'View',    icon: ViewAgendaIcon,     color: '#5281b3',
    description: 'menu_cd 단위의 화면 온톨로지 (tb_is_vwbusnss_ontlgy)',
    fetcher: listOntologyView },
  { key: 'QA',      label: 'Q&A',     icon: QuestionAnswerIcon, color: '#2a9d8f',
    description: '정형화된 질문-답변 패턴 (TB_IS_QAPATTERN)',
    fetcher: listOntologyQa },
  { key: 'PROCESS', label: 'Process', icon: AccountTreeIcon,    color: '#fa7d5b',
    description: '업무 프로세스 온톨로지 (tb_is_prcss_ontlgy)',
    fetcher: listOntologyProcess },
  { key: 'ENTITY',  label: 'Entity',  icon: BubbleChartIcon,    color: '#ffb100',
    description: '엔티티 온톨로지 (tb_is_ontlgy_entity)',
    fetcher: listOntologyEntity },
];

/**
 * 온톨로지 선택 팝업 — 4 카테고리 탭 + 검색 + 다중 선택.
 *
 * props:
 *   open
 *   onClose
 *   onSelect(refs[])  — 선택된 참조 배열 [{ category, key, title, subtitle, ... }]
 */
function OntologyPickerDialog({ open, onClose, onSelect }) {
  const [tab, setTab] = useState(0);
  const [query, setQuery] = useState('');
  const [data, setData] = useState({ VIEW: null, QA: null, PROCESS: null, ENTITY: null });
  const [loading, setLoading] = useState({ VIEW: false, QA: false, PROCESS: false, ENTITY: false });
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState([]);  // [{ category, key, title, ... }]

  useEffect(() => {
    if (!open) return;
    setTab(0);
    setQuery('');
    setSelected([]);
    setError(null);
    loadCategory(0, '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const loadCategory = async (tabIdx, q) => {
    const cat = CATEGORIES[tabIdx];
    if (!cat) return;
    setLoading((l) => ({ ...l, [cat.key]: true }));
    try {
      const res = await cat.fetcher(q || null, 500);
      setData((d) => ({ ...d, [cat.key]: Array.isArray(res.data) ? res.data : [] }));
      setError(null);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || '온톨로지 조회 실패');
      setData((d) => ({ ...d, [cat.key]: [] }));
    } finally {
      setLoading((l) => ({ ...l, [cat.key]: false }));
    }
  };

  const handleTabChange = (_, newVal) => {
    setTab(newVal);
    const cat = CATEGORIES[newVal];
    if (data[cat.key] === null) loadCategory(newVal, query);
  };

  // 로컬 필터
  const currentCat = CATEGORIES[tab];
  const currentItems = data[currentCat.key] || [];
  const filtered = useMemo(() => {
    if (!query.trim()) return currentItems;
    const q = query.toLowerCase();
    return currentItems.filter(
      (it) =>
        (it.title || '').toLowerCase().includes(q) ||
        (it.subtitle || '').toLowerCase().includes(q) ||
        (it.key || '').toString().toLowerCase().includes(q)
    );
  }, [currentItems, query]);

  const isSelected = (cat, key) =>
    selected.some((s) => s.category === cat && String(s.key) === String(key));

  const toggle = (item) => {
    const sig = (s) => s.category === item.category && String(s.key) === String(item.key);
    setSelected((prev) => (prev.some(sig) ? prev.filter((s) => !sig(s)) : [...prev, item]));
  };

  const removeSelected = (item) => {
    const sig = (s) => s.category === item.category && String(s.key) === String(item.key);
    setSelected((prev) => prev.filter((s) => !sig(s)));
  };

  const handleConfirm = () => {
    onSelect(selected);
    onClose();
  };

  const IconComp = currentCat.icon;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <HubIcon color="primary" />
        온톨로지 선택
        {selected.length > 0 && (
          <Chip label={`${selected.length}개 선택됨`} size="small" color="primary" sx={{ ml: 1 }} />
        )}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ height: 520 }}>
          {/* 카테고리 탭 */}
          <Tabs
            value={tab}
            onChange={handleTabChange}
            variant="fullWidth"
            textColor="primary"
            indicatorColor="primary"
          >
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              return (
                <Tab
                  key={c.key}
                  label={
                    <Stack direction="row" spacing={0.8} alignItems="center">
                      <Icon fontSize="small" sx={{ color: c.color }} />
                      <span>{c.label}</span>
                    </Stack>
                  }
                  sx={{ textTransform: 'none' }}
                />
              );
            })}
          </Tabs>

          <Typography variant="caption" color="text.secondary">
            <IconComp fontSize="small" sx={{ verticalAlign: 'middle', color: currentCat.color, mr: 0.5 }} />
            {currentCat.description}
          </Typography>

          <TextField
            size="small"
            placeholder={`${currentCat.label} 검색...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          <Stack direction="row" spacing={2} sx={{ flex: 1, minHeight: 0 }}>
            {/* 목록 */}
            <OntologyList
              items={filtered}
              totalCount={currentItems.length}
              loading={loading[currentCat.key]}
              error={error}
              isSelected={(it) => isSelected(it.category, it.key)}
              onToggle={toggle}
              emptyText="등록된 온톨로지가 없습니다."
            />

            {/* 선택 패널 */}
            <Paper variant="outlined" sx={{ width: 300, p: 1.5, overflow: 'auto' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.8 }}>
                선택됨 ({selected.length})
              </Typography>
              <Stack spacing={0.5}>
                {selected.length === 0 && (
                  <Typography variant="caption" color="text.secondary">
                    좌측 목록에서 항목을 체크하세요.
                  </Typography>
                )}
                {selected.map((s) => {
                  const cat = CATEGORIES.find((c) => c.key === s.category);
                  return (
                    <Chip
                      key={`${s.category}_${s.key}`}
                      label={
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <Chip
                            label={cat?.label || s.category}
                            size="small"
                            sx={{
                              height: 14,
                              fontSize: 9,
                              bgcolor: `${cat?.color || '#888'}22`,
                              color: cat?.color || '#888',
                            }}
                          />
                          <span style={{ fontSize: 11 }}>{s.title}</span>
                        </Stack>
                      }
                      onDelete={() => removeSelected(s)}
                      size="small"
                      sx={{ height: 'auto', py: 0.3, justifyContent: 'flex-start', '& .MuiChip-label': { whiteSpace: 'normal' } }}
                    />
                  );
                })}
              </Stack>
            </Paper>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>취소</Button>
        <Button variant="contained" onClick={handleConfirm} disabled={selected.length === 0}>
          {selected.length}개 선택
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default OntologyPickerDialog;
