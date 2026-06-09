import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import {
  Box, Typography, IconButton,
  Paper, CircularProgress, Alert, Chip, Button,
  List, ListItemButton, ListItemText,
  TextField, InputAdornment, Divider, Stack, Tooltip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { GridLayout, useContainerWidth, noCompactor } from '../core/GridLayoutCompat';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import GenericWidget from '../generic/GenericWidget';
import { toWidgetDataConfig, toWidgetVisualConfig } from '../generic/widgetSpecAdapter';
import DashboardBuilderPopup from '../dashboardbuilder/DashboardBuilderPopup';
import { useDashboardBuilderStore } from '../dashboardbuilder/store/dashboardBuilderStore';
import { DASHBOARD_LIST_CHANGED_EVENT, notifyDashboardListChanged } from '../core/dashboardEvents';
import {
  DASHBOARD_GRID_COLS,
  DASHBOARD_GRID_DEFAULT_H,
  DASHBOARD_GRID_DEFAULT_W,
  DASHBOARD_GRID_MARGIN,
  DASHBOARD_GRID_PADDING,
  DASHBOARD_MAX_GRID_ROWS,
  calculateDashboardRowHeight,
} from '../core/dashboardGridRules';
import { getDashboard, deleteDashboard, listDashboards } from '../../../restapi/widgetBuilder';

function normalizeLayoutItem(item, fallbackIndex = 0) {
  const minW = item?.minW ?? 2;
  const minH = item?.minH ?? 3;
  const rawW = Number.isFinite(item?.w) ? item.w : DASHBOARD_GRID_DEFAULT_W;
  const rawH = Number.isFinite(item?.h) ? item.h : DASHBOARD_GRID_DEFAULT_H;
  let x = Math.max(0, Math.min(Number.isFinite(item?.x) ? item.x : 0, DASHBOARD_GRID_COLS - 1));
  const y = Math.max(0, Number.isFinite(item?.y) ? item.y : fallbackIndex * 2);
  let w = Math.min(DASHBOARD_GRID_COLS - x, Math.max(minW, rawW));
  const h = Math.max(minH, rawH);

  if (w < minW) {
    w = minW;
    x = Math.max(0, DASHBOARD_GRID_COLS - w);
  }

  return {
    ...item,
    x,
    y,
    w,
    h,
    minW,
    minH,
    maxW: DASHBOARD_GRID_COLS,
    maxH: item?.maxH ?? DASHBOARD_MAX_GRID_ROWS,
    static: true,
    isDraggable: false,
    isResizable: false,
  };
}

function ViewerWidget({ item }) {
  const dataConfig = useMemo(() => toWidgetDataConfig(item.spec_json), [item.spec_json]);
  const visualConfig   = useMemo(() => toWidgetVisualConfig(item.spec_json, item.widget_type), [item.spec_json, item.widget_type]);

  return (
    <Paper
      variant="outlined"
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderColor: '#e5eaf2',
        borderRadius: '8px',
        bgcolor: '#fff',
        boxShadow: '0 10px 28px rgba(15, 23, 42, 0.05)',
      }}
    >
      <Box
        sx={{
          minHeight: 36,
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          px: 1.25,
          py: 0.75,
          borderBottom: '1px solid #edf2f7',
          bgcolor: '#fff',
        }}
      >
        <Box sx={{ width: 3, height: 15, borderRadius: 1, bgcolor: '#3b82f6', flexShrink: 0 }} />
        <Typography sx={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 800, color: '#1e293b' }} noWrap>
          {item.title}
        </Typography>
      </Box>
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', p: 1.25, bgcolor: '#fbfcfe' }}>
        <GenericWidget dataConfig={dataConfig} visualConfig={visualConfig} />
      </Box>
    </Paper>
  );
}

function DashboardListPanel({
  dashboards,
  activeId,
  loading,
  error,
  search,
  onSearchChange,
  onSelect,
  onCreate,
  onRefresh,
  collapsed,
  onToggleCollapsed,
}) {
  const filteredDashboards = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return dashboards;
    return dashboards.filter((db) => {
      const title = String(db.title || '').toLowerCase();
      const desc = String(db.description || '').toLowerCase();
      return title.includes(keyword) || desc.includes(keyword);
    });
  }, [dashboards, search]);

  if (collapsed) {
    return (
      <Box sx={{
        width: 48,
        flexShrink: 0,
        borderRight: '1px solid #e2e8f0',
        bgcolor: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        py: 1,
        gap: 0.75,
        minHeight: 0,
      }}>
        <Tooltip title="대시보드 목록 펼치기" placement="right">
          <IconButton size="small" onClick={onToggleCollapsed}>
            <ChevronRightIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Divider flexItem />
        <Tooltip title="새 대시보드" placement="right">
          <IconButton size="small" color="primary" onClick={onCreate}>
            <AddIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="목록 새로고침" placement="right">
          <span>
            <IconButton size="small" onClick={onRefresh} disabled={loading}>
              {loading ? <CircularProgress size={16} /> : <RefreshIcon fontSize="small" />}
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    );
  }

  return (
    <Box sx={{
      width: 304,
      flexShrink: 0,
      borderRight: '1px solid #e2e8f0',
      bgcolor: '#fff',
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0,
    }}>
      <Box sx={{ px: 1.5, py: 1.25, display: 'flex', alignItems: 'center', gap: 1 }}>
        <DashboardIcon color="primary" fontSize="small" />
        <Typography sx={{ fontSize: 14, fontWeight: 800, flex: 1, color: '#1e293b' }}>
          대시보드
        </Typography>
        <IconButton size="small" onClick={onRefresh} disabled={loading}>
          {loading ? <CircularProgress size={16} /> : <RefreshIcon fontSize="small" />}
        </IconButton>
        <Tooltip title="대시보드 목록 접기">
          <IconButton size="small" onClick={onToggleCollapsed}>
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ px: 1.5, pb: 1 }}>
        <Button
          fullWidth
          size="small"
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onCreate}
          sx={{ mb: 1, justifyContent: 'flex-start', borderRadius: '6px', fontWeight: 700 }}
        >
          새 대시보드
        </Button>
        <TextField
          size="small"
          fullWidth
          placeholder="대시보드 검색"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Divider />

      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', py: 0.5 }}>
        {error && <Alert severity="error" sx={{ mx: 1, my: 1 }}>{error}</Alert>}
        {!loading && !error && dashboards.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 2 }}>
            저장된 대시보드가 없습니다.
          </Typography>
        )}
        {!loading && !error && dashboards.length > 0 && filteredDashboards.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 2 }}>
            검색 결과가 없습니다.
          </Typography>
        )}
        <List dense disablePadding>
          {filteredDashboards.map((db) => {
            const selected = String(db.id) === String(activeId);
            return (
              <ListItemButton
                key={db.id}
                selected={selected}
                onClick={() => onSelect(db.id)}
                sx={{
                  mx: 0.75,
                  my: 0.25,
                  borderRadius: '6px',
                  alignItems: 'flex-start',
                  border: '1px solid transparent',
                  '&.Mui-selected': {
                    bgcolor: '#eff6ff',
                    borderColor: '#bfdbfe',
                  },
                  '&.Mui-selected:hover': {
                    bgcolor: '#e0f2fe',
                  },
                }}
              >
                <ListItemText
                  primary={db.title || 'Untitled'}
                  secondary={db.description || ''}
                  primaryTypographyProps={{ noWrap: true, fontWeight: selected ? 700 : 500 }}
                  secondaryTypographyProps={{ noWrap: true }}
                />
              </ListItemButton>
            );
          })}
        </List>
      </Box>
    </Box>
  );
}

export default function DashboardPage({ embedded = false, onClose }) {
  const { dashboardId: routeDashboardId } = useParams();
  const history = useHistory();
  const [embeddedDashboardId, setEmbeddedDashboardId] = useState(null);
  const dashboardId = embedded ? embeddedDashboardId : routeDashboardId;
  const { containerRef, width, mounted, measureWidth } = useContainerWidth({
    initialWidth: 1200,
    measureBeforeMount: true,
  });
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardList, setDashboardList] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [containerHeight, setContainerHeight] = useState(0);
  const [listCollapsed, setListCollapsed] = useState(false);

  const {
    setDashboardId: setStoreDashboardId,
    setTitle: setStoreTitle,
    setCanvasWidgets,
    reset,
  } = useDashboardBuilderStore();

  const loadDashboardList = useCallback(() => {
    setListLoading(true);
    setListError('');
    listDashboards()
      .then(res => setDashboardList(Array.isArray(res) ? res : (res?.dashboards || [])))
      .catch(e => setListError('대시보드 목록 로드 실패: ' + (e?.message || String(e))))
      .finally(() => setListLoading(false));
  }, []);

  useEffect(() => {
    loadDashboardList();
    const handleDashboardListChanged = () => loadDashboardList();
    window.addEventListener(DASHBOARD_LIST_CHANGED_EVENT, handleDashboardListChanged);
    return () => window.removeEventListener(DASHBOARD_LIST_CHANGED_EVENT, handleDashboardListChanged);
  }, [loadDashboardList]);

  const loadDashboard = useCallback(() => {
    if (!dashboardId) {
      setDashboard(null);
      setLoading(false);
      setError('');
      return;
    }
    setLoading(true);
    setError('');
    getDashboard(dashboardId)
      .then(data => setDashboard(data))
      .catch(e => setError('대시보드 로드 실패: ' + (e?.message || String(e))))
      .finally(() => setLoading(false));
  }, [dashboardId]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleSelectDashboard = (id) => {
    if (!id) return;
    if (embedded) {
      setEmbeddedDashboardId(id);
      return;
    }
    history.push(`/user-dashboard/${id}`);
  };

  const handleCreate = () => {
    reset();
    setEditOpen(true);
  };

  const handleEdit = () => {
    if (!dashboard) return;
    reset();
    setStoreDashboardId(dashboard.id);
    setStoreTitle(dashboard.title);
    const widgets = (dashboard.layout_json || []).map(w => ({
      key: w.key,
      title: w.title,
      widget_type: w.widget_type,
      spec_json: w.spec_json,
      layout: {
        i: w.key,
        x: w['data-grid']?.x ?? 0,
        y: w['data-grid']?.y ?? 0,
        w: w['data-grid']?.w ?? DASHBOARD_GRID_DEFAULT_W,
        h: w['data-grid']?.h ?? DASHBOARD_GRID_DEFAULT_H,
      },
    }));
    setCanvasWidgets(widgets);
    setEditOpen(true);
  };

  const handleEditClose = () => {
    setEditOpen(false);
    reset();
  };

  const handleEditSaved = (res) => {
    setEditOpen(false);
    reset();
    notifyDashboardListChanged();
    loadDashboardList();
    const savedId = res?.dashboard_id || dashboardId;
    if (savedId && String(savedId) !== String(dashboardId)) {
      if (embedded) {
        setEmbeddedDashboardId(savedId);
        return;
      }
      history.push(`/user-dashboard/${savedId}`);
      return;
    }
    loadDashboard();
  };

  const handleDelete = async () => {
    if (!window.confirm('대시보드를 삭제하시겠습니까?')) return;
    setDeleting(true);
    try {
      await deleteDashboard(dashboardId);
      notifyDashboardListChanged();
      loadDashboardList();
      setDeleting(false);
      if (embedded) {
        setEmbeddedDashboardId(null);
        return;
      }
      history.push('/user-dashboard');
    } catch (e) {
      setError('삭제 실패: ' + (e?.message || String(e)));
      setDeleting(false);
    }
  };

  const widgets = dashboard?.layout_json || [];
  const layout = useMemo(() => widgets.map((w, index) => normalizeLayoutItem({
      i: w.key,
      x: w['data-grid']?.x ?? 0,
      y: w['data-grid']?.y ?? 0,
      w: w['data-grid']?.w ?? DASHBOARD_GRID_DEFAULT_W,
      h: w['data-grid']?.h ?? DASHBOARD_GRID_DEFAULT_H,
    }, index)), [widgets]);

  useEffect(() => {
    const rafId = requestAnimationFrame(measureWidth);
    const timerId = setTimeout(measureWidth, 150);
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timerId);
    };
  }, [measureWidth, widgets.length, dashboardId, listCollapsed]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || typeof ResizeObserver === 'undefined') return undefined;

    const updateSize = () => {
      setContainerHeight(element.clientHeight || 0);
      measureWidth();
    };
    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    updateSize();
    return () => observer.disconnect();
  }, [containerRef, measureWidth]);

  const rowHeight = useMemo(() => calculateDashboardRowHeight(containerHeight), [containerHeight]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: embedded ? '100%' : '100vh', bgcolor: '#f8fafc' }}>
      <Box
        sx={{
          height: 56,
          px: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          borderBottom: '1px solid #e2e8f0',
          bgcolor: '#fff',
          flexShrink: 0,
        }}
      >
        <IconButton size="small" onClick={() => embedded ? onClose?.() : history.push('/')} sx={{ color: '#64748b' }}>
          <ArrowBackIcon />
        </IconButton>
        <DashboardIcon color="primary" sx={{ width: 22, height: 22 }} />
        <Typography sx={{ flex: 1, minWidth: 0, fontSize: 18, fontWeight: 800, color: '#111827' }} noWrap>
          {dashboard?.title || '대시보드'}
        </Typography>
        {widgets.length > 0 && (
          <Chip
            size="small"
            label={`${widgets.length}개 위젯`}
            sx={{ height: 24, borderRadius: '12px', bgcolor: '#eff6ff', color: '#2563eb', fontWeight: 700 }}
          />
        )}
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="편집">
            <span>
              <IconButton
                size="small"
                onClick={handleEdit}
                disabled={loading || !dashboard}
                sx={{ color: '#2563eb' }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="삭제">
            <span>
              <IconButton
                size="small"
                color="error"
                onClick={handleDelete}
                disabled={deleting || loading || !dashboard}
              >
                {deleting ? <CircularProgress size={14} /> : <DeleteIcon fontSize="small" />}
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, display: 'flex' }}>
        <DashboardListPanel
          dashboards={dashboardList}
          activeId={dashboardId}
          loading={listLoading}
          error={listError}
          search={search}
          onSearchChange={setSearch}
          onSelect={handleSelectDashboard}
          onCreate={handleCreate}
          onRefresh={loadDashboardList}
          collapsed={listCollapsed}
          onToggleCollapsed={() => setListCollapsed((prev) => !prev)}
        />

        <Box sx={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <Box ref={containerRef} sx={{
            flex: 1,
            minHeight: 0,
            minWidth: 0,
            overflow: 'auto',
            p: 2,
            '& .react-grid-layout': {
              minHeight: '100%',
            },
            '& .react-grid-item': {
              overflow: 'hidden',
            },
          }}>
            {!dashboardId && !loading && !error && (
              <Box sx={{ height: '100%', border: '1px dashed #d8e0ea', borderRadius: '8px', bgcolor: '#fff' }} />
            )}
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
              </Box>
            )}
            {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
            {dashboardId && !loading && !error && widgets.length === 0 && (
              <Box sx={{ height: '100%', border: '1px dashed #d8e0ea', borderRadius: '8px', bgcolor: '#fff' }} />
            )}
            {!loading && widgets.length > 0 && mounted && (
              <GridLayout
                className="layout"
                layout={layout}
                width={Math.max(320, width)}
                gridConfig={{
                  cols: DASHBOARD_GRID_COLS,
                  rowHeight,
                  margin: DASHBOARD_GRID_MARGIN,
                  containerPadding: DASHBOARD_GRID_PADDING,
                }}
                dragConfig={{ enabled: false }}
                resizeConfig={{ enabled: false }}
                compactor={noCompactor}
                autoSize>
                {widgets.map((item, index) => (
                  <div key={item.key} data-grid={normalizeLayoutItem(layout[index], index)}>
                    <ViewerWidget item={item} />
                  </div>
                ))}
              </GridLayout>
            )}
          </Box>
        </Box>
      </Box>

      <DashboardBuilderPopup
        open={editOpen}
        onClose={handleEditClose}
        onSaved={handleEditSaved}
      />
    </Box>
  );
}
