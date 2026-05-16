import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';

import {
  Box, Stack, TextField, InputAdornment, Typography, Chip, Button,
  CircularProgress, Alert, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import BubbleChartIcon from '@mui/icons-material/BubbleChart';
import ViewListIcon from '@mui/icons-material/ViewList';
import StorageIcon from '@mui/icons-material/Storage';
import RefreshIcon from '@mui/icons-material/Refresh';
import TableChartIcon from '@mui/icons-material/TableChart';
import FunctionsIcon from '@mui/icons-material/Functions';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import { useDataSourceStore } from './dataSourceStore';
import { getTableInfo, lookupProcedures } from './api';
import DataConstellation from './DataConstellation';
import OntologyList from './OntologyList';

const HOLO = '#38bdf8';
const LIST_CAP = 400;

const kindOfType = (type) => (type === 'SP' || type === 'FN' ? 'SP' : 'TABLE');

/**
 * DataSourcePickerDialog 의 "DB Entity" 탭.
 *   - 별자리 맵(DataConstellation) ↔ 목록 보기 토글
 *   - 우측 상세 패널 — hover/선택 노드의 컬럼/파라미터
 *   - 노드 선택 시 실제 메타(컬럼/파라미터)를 fetch 해 바스켓 item.meta 로 전달
 *
 * props:
 *   targetCd
 *   basket            — 전체 바스켓 [{kind,key,label,meta}]
 *   addToBasket(item) · removeFromBasket(kind,key)
 */
function DbEntityTab({ targetCd, basket, addToBasket, removeFromBasket }) {
  const loadCatalog = useDataSourceStore((s) => s.loadCatalog);
  const loadGraph   = useDataSourceStore((s) => s.loadGraph);

  const [catalog, setCatalog] = useState({ loading: true, connected: false, tables: [], procedures: [], error: null });
  const [viewMode, setViewMode] = useState('map');
  const [search, setSearch] = useState('');
  const [focusNode, setFocusNode] = useState(null);
  const [detailCache, setDetailCache] = useState({});
  const detailCacheRef = useRef({});

  const refreshCatalog = useCallback(() => {
    setCatalog((c) => ({ ...c, loading: true, error: null }));
    loadCatalog(targetCd).then((entry) => {
      setCatalog({
        loading: false,
        connected: !!entry.connected,
        tables: entry.tables || [],
        procedures: entry.procedures || [],
        error: entry.error || null,
      });
    });
  }, [loadCatalog, targetCd]);

  useEffect(() => { refreshCatalog(); }, [refreshCatalog]);

  // ── 도메인(은하) 목록 ──
  const domains = useMemo(() => {
    const m = {};
    (catalog.tables || []).forEach((t) => {
      const d = m[t.domain] || (m[t.domain] = { domain: t.domain, label: t.domain, tableCount: 0, spCount: 0 });
      d.tableCount += 1;
    });
    (catalog.procedures || []).forEach((p) => {
      const d = m[p.domain] || (m[p.domain] = { domain: p.domain, label: p.domain, tableCount: 0, spCount: 0 });
      d.spCount += 1;
    });
    return Object.values(m).sort((a, b) => (b.tableCount + b.spCount) - (a.tableCount + a.spCount));
  }, [catalog.tables, catalog.procedures]);

  // ── 별자리 맵: 도메인 그래프 lazy load ──
  const loadDomain = useCallback((domain) => loadGraph(targetCd, domain), [loadGraph, targetCd]);

  // ── 바스켓 ──
  const isIn = useCallback(
    (kind, key) => (basket || []).some((b) => b.kind === kind && b.key === key),
    [basket],
  );
  const selectedIds = useMemo(
    () => new Set((basket || [])
      .filter((b) => b.kind === 'TABLE' || b.kind === 'SP')
      .map((b) => String(b.key).toUpperCase())),
    [basket],
  );

  // ── 상세 메타 fetch (캐시) ──
  const ensureDetail = useCallback(async (node) => {
    const id = String(node.id || node.name).toUpperCase();
    if (detailCacheRef.current[id]) return detailCacheRef.current[id];
    let detail;
    try {
      if (kindOfType(node.type) === 'TABLE') {
        const r = await getTableInfo(node.name, targetCd);
        const d = r?.data || {};
        detail = {
          kind: 'TABLE', tableSchema: d.tableSchema,
          columns: d.columns || [], primaryKeyColumns: d.primaryKeyColumns || [],
        };
      } else {
        const r = await lookupProcedures([node.name], targetCd);
        const info = (r?.data?.results || {})[node.name.toUpperCase()] || {};
        detail = {
          kind: 'SP', procedureSchema: info.procedureSchema,
          parameters: info.parameters || [],
        };
      }
    } catch (e) {
      detail = { kind: kindOfType(node.type), error: e?.message || '상세 조회 실패' };
    }
    detailCacheRef.current[id] = detail;
    setDetailCache((c) => ({ ...c, [id]: detail }));
    return detail;
  }, [targetCd]);

  // ── 노드 토글 (별자리/목록 공용) ──
  const handleToggleNode = useCallback(async (node) => {
    const kind = kindOfType(node.type);
    const key = node.name;
    if (isIn(kind, key)) {
      removeFromBasket(kind, key);
      return;
    }
    setFocusNode(node);
    const meta = await ensureDetail(node);
    addToBasket({ kind, key, label: key, meta: { ...meta, domain: node.domain } });
  }, [isIn, removeFromBasket, addToBasket, ensureDetail]);

  const handleHover = useCallback((node) => {
    setFocusNode(node);
    if (node) ensureDetail(node);
  }, [ensureDetail]);

  // ── 목록 보기 items ──
  const listItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    const all = [
      ...(catalog.tables || []).map((t) => ({
        category: 'TABLE', key: t.tableName, title: t.tableName,
        subtitle: `${t.domain} · ${t.tableType}`, type: t.tableType === 'VIEW' ? 'VIEW' : 'TABLE',
        domain: t.domain,
      })),
      ...(catalog.procedures || []).map((p) => ({
        category: 'SP', key: p.procedureName, title: p.procedureName,
        subtitle: `${p.domain} · ${p.objectType}`, type: p.objectType === 'P' ? 'SP' : 'FN',
        domain: p.domain,
      })),
    ];
    const filtered = q
      ? all.filter((it) => it.key.toLowerCase().includes(q) || it.domain.toLowerCase().includes(q))
      : all;
    return { items: filtered.slice(0, LIST_CAP), total: filtered.length };
  }, [catalog.tables, catalog.procedures, search]);

  // ── 미연결 / 로딩 ──
  if (catalog.loading) {
    return (
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: HOLO }} />
      </Box>
    );
  }
  if (!catalog.connected) {
    return (
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                 justifyContent: 'center', gap: 1.5, p: 4 }}>
        <StorageIcon sx={{ fontSize: 46, color: 'rgba(56,189,248,0.4)' }} />
        <Typography sx={{ color: '#dffaff', fontWeight: 700 }}>
          Target DB 미연결 {targetCd ? `(${targetCd})` : ''}
        </Typography>
        <Typography sx={{ color: '#5b7a92', fontSize: 12.5, textAlign: 'center', maxWidth: 460 }}>
          헤더의 Target 선택 → 💾 Storage 에서 운영 DB(JDBC URL · 계정) 를 입력하고 연결 테스트를 통과시키면
          테이블/SP 를 별자리 맵으로 탐색할 수 있습니다.
        </Typography>
        {catalog.error && (
          <Alert severity="warning" sx={{ mt: 1 }}>{catalog.error}</Alert>
        )}
        <Button startIcon={<RefreshIcon />} onClick={refreshCatalog}
                sx={{ color: HOLO, border: `1px solid ${HOLO}55`, mt: 1 }}>
          다시 시도
        </Button>
      </Box>
    );
  }

  const focusDetail = focusNode ? detailCache[String(focusNode.id || focusNode.name).toUpperCase()] : null;
  const focusKind   = focusNode ? kindOfType(focusNode.type) : null;
  const focusInBasket = focusNode ? isIn(focusKind, focusNode.name) : false;

  return (
    <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      {/* 툴바 */}
      <Stack direction="row" alignItems="center" spacing={1.5}
             sx={{ px: 1.5, py: 1, borderBottom: '1px solid rgba(56,189,248,0.2)' }}>
        <TextField
          size="small" placeholder="테이블 · SP · 도메인 검색"
          value={search} onChange={(e) => setSearch(e.target.value)}
          sx={{
            width: 280,
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
        <Typography sx={{ fontSize: 11.5, color: '#5b7a92' }}>
          {(catalog.tables || []).length} 테이블 · {(catalog.procedures || []).length} SP · {domains.length} 도메인
        </Typography>
        <Box sx={{ flex: 1 }} />
        <ToggleButtonGroup
          size="small" exclusive value={viewMode}
          onChange={(_, v) => v && setViewMode(v)}
        >
          <ToggleButton value="map" sx={{ color: '#9fc7d8', '&.Mui-selected': { color: HOLO, bgcolor: 'rgba(56,189,248,0.18)' } }}>
            <BubbleChartIcon fontSize="small" sx={{ mr: 0.5 }} /> 별자리 맵
          </ToggleButton>
          <ToggleButton value="list" sx={{ color: '#9fc7d8', '&.Mui-selected': { color: HOLO, bgcolor: 'rgba(56,189,248,0.18)' } }}>
            <ViewListIcon fontSize="small" sx={{ mr: 0.5 }} /> 목록 보기
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {/* 본문 — 좌: 맵/목록 · 우: 상세 패널 */}
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex' }}>
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {viewMode === 'map' ? (
            <DataConstellation
              domains={domains}
              loadDomain={loadDomain}
              selectedIds={selectedIds}
              onToggleNode={handleToggleNode}
              onHoverNode={handleHover}
              search={search}
            />
          ) : (
            <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', p: 1.5 }}>
              <OntologyList
                dark
                items={listItems.items}
                totalCount={listItems.total}
                isSelected={(it) => isIn(it.category, it.key)}
                onToggle={(it) => handleToggleNode({
                  id: it.key.toUpperCase(), name: it.key, type: it.type, domain: it.domain,
                })}
                emptyText="테이블/SP 가 없습니다."
              />
              {listItems.total > listItems.items.length && (
                <Typography sx={{ fontSize: 11, color: '#5b7a92', mt: 0.8 }}>
                  {listItems.total.toLocaleString()}개 중 {listItems.items.length}개 표시 — 검색으로 좁히세요.
                </Typography>
              )}
            </Box>
          )}
        </Box>

        {/* 우측 상세 패널 */}
        <Box sx={{
          width: 300, flexShrink: 0, borderLeft: '1px solid rgba(56,189,248,0.2)',
          display: 'flex', flexDirection: 'column', bgcolor: 'rgba(9,20,38,0.5)',
        }}>
          {!focusNode && (
            <Box sx={{ p: 2.5, color: '#5b7a92', fontSize: 12.5 }}>
              별자리 맵에서 별에 마우스를 올리거나 목록에서 항목을 선택하면 여기에 실제 컬럼/파라미터가 표시됩니다.
            </Box>
          )}
          {focusNode && (
            <>
              <Box sx={{ p: 1.5, borderBottom: '1px solid rgba(56,189,248,0.18)' }}>
                <Stack direction="row" alignItems="center" spacing={0.8}>
                  {focusKind === 'TABLE'
                    ? <TableChartIcon fontSize="small" sx={{ color: HOLO }} />
                    : <FunctionsIcon fontSize="small" sx={{ color: '#f59e0b' }} />}
                  <Typography sx={{ fontWeight: 700, fontSize: 13, color: '#dffaff',
                                    fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {focusNode.name}
                  </Typography>
                </Stack>
                <Typography sx={{ fontSize: 10.5, color: '#5b7a92', mt: 0.3 }}>
                  {focusNode.domain} · {focusNode.type}
                </Typography>
                <Button
                  size="small" fullWidth
                  startIcon={focusInBasket ? <CheckCircleIcon /> : <AddCircleIcon />}
                  onClick={() => handleToggleNode(focusNode)}
                  sx={{
                    mt: 1, fontWeight: 700,
                    color: focusInBasket ? '#04141f' : HOLO,
                    bgcolor: focusInBasket ? HOLO : 'transparent',
                    border: `1px solid ${HOLO}`,
                    '&:hover': { bgcolor: focusInBasket ? '#7dd3fc' : 'rgba(56,189,248,0.15)' },
                  }}
                >
                  {focusInBasket ? '데이터 소스에 담김 — 제거' : '데이터 소스에 추가'}
                </Button>
              </Box>
              <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', p: 1.5 }}>
                {!focusDetail && (
                  <Stack alignItems="center" sx={{ pt: 2 }}>
                    <CircularProgress size={18} sx={{ color: HOLO }} />
                  </Stack>
                )}
                {focusDetail && focusDetail.error && (
                  <Alert severity="warning">{focusDetail.error}</Alert>
                )}
                {focusDetail && focusDetail.kind === 'TABLE' && !focusDetail.error && (
                  <>
                    <Typography sx={{ fontSize: 11, color: '#9fc7d8', fontWeight: 700, mb: 0.6 }}>
                      컬럼 {focusDetail.columns.length}개
                    </Typography>
                    <Stack spacing={0.3}>
                      {focusDetail.columns.map((c) => (
                        <Stack key={c.name} direction="row" spacing={0.6} alignItems="center">
                          {c.primaryKey && (
                            <Chip label="PK" size="small"
                                  sx={{ height: 14, fontSize: 8, bgcolor: '#1e40af', color: '#fff' }} />
                          )}
                          <Typography sx={{ fontSize: 11, fontFamily: 'monospace', color: '#dffaff' }}>
                            {c.name}
                          </Typography>
                          <Typography sx={{ fontSize: 10, color: '#5b7a92' }}>
                            {c.dataType}
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </>
                )}
                {focusDetail && focusDetail.kind === 'SP' && !focusDetail.error && (
                  <>
                    <Typography sx={{ fontSize: 11, color: '#9fc7d8', fontWeight: 700, mb: 0.6 }}>
                      파라미터 {focusDetail.parameters.length}개
                    </Typography>
                    <Stack spacing={0.3}>
                      {focusDetail.parameters.length === 0 && (
                        <Typography sx={{ fontSize: 11, color: '#5b7a92' }}>(파라미터 없음)</Typography>
                      )}
                      {focusDetail.parameters.map((p) => (
                        <Stack key={p.name} direction="row" spacing={0.6} alignItems="center">
                          <Typography sx={{ fontSize: 11, fontFamily: 'monospace', color: '#dffaff' }}>
                            {p.name}
                          </Typography>
                          <Typography sx={{ fontSize: 10, color: '#5b7a92' }}>
                            {p.dataType}{p.output ? ' OUT' : ''}
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </>
                )}
              </Box>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default DbEntityTab;
