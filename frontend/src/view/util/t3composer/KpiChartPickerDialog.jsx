import React from 'react';

import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, IconButton, Box, Typography, Stack, Chip,
  Tabs, Tab, TextField, InputAdornment, CircularProgress,
  Checkbox, Tooltip,
} from '@mui/material';
import CloseIcon  from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';

import { listKpis, listChartTypes } from '../t3composerdict/api';

/**
 * Chart / Dashboard 류 패턴 선택 시 표시되는 KPI / Chart 사전 다중 선택 POPUP.
 *
 * - 두 탭: KPI · Chart Types
 * - 활성(USE_YN='Y') 항목만 표시
 * - 검색 필터 + 카테고리 chip
 * - 다중 체크박스 선택 + 선택된 코드 chip 으로 상단 표시
 *
 * 데이터 (백엔드):
 *   GET /composer/dictionary/kpis?activeOnly=true
 *   GET /composer/dictionary/chart-types?activeOnly=true
 *
 * props:
 *   open                       boolean
 *   onClose()                  취소
 *   initialKpiCodes[]          이미 선택된 KPI code 배열
 *   initialChartCodes[]        이미 선택된 Chart Type code 배열
 *   onConfirm({ kpis:[{code,name}], charts:[{code,name}] })
 */
function KpiChartPickerDialog({
  open, onClose,
  initialKpiCodes = [], initialChartCodes = [],
  onConfirm,
}) {
  const [tab, setTab] = React.useState(0);
  const [kpis, setKpis]     = React.useState([]);
  const [charts, setCharts] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [query, setQuery]     = React.useState('');
  const [selKpis, setSelKpis]     = React.useState(new Set(initialKpiCodes));
  const [selCharts, setSelCharts] = React.useState(new Set(initialChartCodes));

  // open 시점에만 사전 로드 + selection 동기화
  React.useEffect(() => {
    if (!open) return;
    setSelKpis(new Set(initialKpiCodes));
    setSelCharts(new Set(initialChartCodes));
    setQuery('');
    setLoading(true);
    Promise.all([listKpis(true), listChartTypes(true)])
      .then(([rk, rc]) => {
        setKpis(Array.isArray(rk?.data) ? rk.data : []);
        setCharts(Array.isArray(rc?.data) ? rc.data : []);
      })
      .catch(() => {
        setKpis([]);
        setCharts([]);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const filterByQuery = (list) => {
    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter((it) => {
      const name = (it.name || '').toLowerCase();
      const code = (it.code || '').toLowerCase();
      const desc = (it.description || '').toLowerCase();
      const cat  = (it.category || it.categoryName || '').toLowerCase();
      return name.includes(q) || code.includes(q) || desc.includes(q) || cat.includes(q);
    });
  };

  const filteredKpis   = filterByQuery(kpis);
  const filteredCharts = filterByQuery(charts);

  const toggleKpi = (code) => {
    const next = new Set(selKpis);
    if (next.has(code)) next.delete(code); else next.add(code);
    setSelKpis(next);
  };
  const toggleChart = (code) => {
    const next = new Set(selCharts);
    if (next.has(code)) next.delete(code); else next.add(code);
    setSelCharts(next);
  };

  const confirm = () => {
    const k = kpis.filter((it) => selKpis.has(it.code))
                  .map((it) => ({ code: it.code, name: it.name, category: it.categoryName || it.category }));
    const c = charts.filter((it) => selCharts.has(it.code))
                    .map((it) => ({ code: it.code, name: it.name, category: it.category }));
    onConfirm({ kpis: k, charts: c });
  };

  const totalSel = selKpis.size + selCharts.size;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { height: '80vh', borderRadius: 2 } }}
    >
      <DialogTitle sx={{ pr: 6 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>KPI / Chart 사전 항목 선택</Typography>
          {totalSel > 0 && (
            <Chip
              label={`${selKpis.size} KPI · ${selCharts.size} Chart`}
              size="small" color="primary"
            />
          )}
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          선택한 항목들이 Claude 의 prompt 에 자동 첨부되어 화면 위젯·차트 구성에 반영됩니다.
        </Typography>
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
          <Tab label={`KPI 사전 (${filteredKpis.length}/${kpis.length})`} />
          <Tab label={`Chart Type 사전 (${filteredCharts.length}/${charts.length})`} />
        </Tabs>

        <Box sx={{ p: 2, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <TextField
            fullWidth size="small" placeholder="이름 · 코드 · 카테고리 검색..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
            }}
          />
        </Box>

        <Box sx={{ flex: 1, overflow: 'auto', p: 1.5 }}>
          {loading && (
            <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress size={26} /></Box>
          )}
          {!loading && tab === 0 && (
            <DictList
              items={filteredKpis}
              selected={selKpis}
              onToggle={toggleKpi}
              emptyMsg="KPI 사전이 비어있습니다."
              kindLabel="KPI"
            />
          )}
          {!loading && tab === 1 && (
            <DictList
              items={filteredCharts}
              selected={selCharts}
              onToggle={toggleChart}
              emptyMsg="Chart Type 사전이 비어있습니다."
              kindLabel="Chart"
            />
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Box sx={{ flex: 1 }}>
          {totalSel > 0
            ? <Typography variant="caption" color="text.secondary">
                선택: KPI {selKpis.size}개 · Chart {selCharts.size}개
              </Typography>
            : <Typography variant="caption" color="text.disabled">
                항목을 선택하지 않아도 진행 가능합니다
              </Typography>}
        </Box>
        <Button
          onClick={() => { setSelKpis(new Set()); setSelCharts(new Set()); }}
          disabled={totalSel === 0}
          color="inherit" size="small"
        >
          모두 해제
        </Button>
        <Button onClick={onClose} color="inherit">취소</Button>
        <Button onClick={confirm} variant="contained">확인</Button>
      </DialogActions>
    </Dialog>
  );
}

function DictList({ items, selected, onToggle, emptyMsg, kindLabel }) {
  if (!items || items.length === 0) {
    return <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>{emptyMsg}</Typography>;
  }
  return (
    <Stack spacing={0.5}>
      {items.map((it) => {
        const isOn = selected.has(it.code);
        const cat  = it.categoryName || it.category;
        return (
          <Box
            key={it.code}
            onClick={() => onToggle(it.code)}
            sx={{
              p: 1, borderRadius: 1, cursor: 'pointer',
              border: '1px solid', borderColor: isOn ? 'primary.main' : 'rgba(0,0,0,0.08)',
              bgcolor: isOn ? 'rgba(40,135,215,0.05)' : 'transparent',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.03)' },
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <Checkbox checked={isOn} size="small" sx={{ p: 0.5 }} />
              <Chip label={it.code} size="small" sx={{ height: 18, fontSize: 10, fontFamily: 'monospace' }} />
              {cat && <Chip label={cat} size="small" variant="outlined" sx={{ height: 18, fontSize: 10 }} />}
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {it.name || it.code}
              </Typography>
              {kindLabel === 'KPI' && it.formula && (
                <Tooltip title={it.formula}>
                  <Chip label="공식" size="small" variant="outlined"
                        sx={{ height: 18, fontSize: 10, ml: 'auto' }} />
                </Tooltip>
              )}
            </Stack>
            {it.description && (
              <Typography variant="caption" color="text.secondary"
                          sx={{ display: 'block', pl: 4, lineHeight: 1.3 }}>
                {it.description}
              </Typography>
            )}
          </Box>
        );
      })}
    </Stack>
  );
}

export default KpiChartPickerDialog;
