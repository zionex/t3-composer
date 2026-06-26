import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize';
import EditIcon from '@mui/icons-material/Edit';
import GroupIcon from '@mui/icons-material/Group';
import LockIcon from '@mui/icons-material/Lock';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PublicIcon from '@mui/icons-material/Public';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';

import { ContentInner, WorkArea } from '@wingui/common/imports';
import { transLangKey } from '@zionex/wingui-core';

import DashboardPanel from '@zionex/wingui-core/component/dashboard/DashboardPanel';
import { getDashboard, listDashboards, updateDashboardAccess } from '../../restapi/widgetBuilder';
import { getGroups } from '../../restapi/user';
import { useCurrentUser, useCanEditUser, canEditDashboardAccess } from '../../auth/currentUser';
import DashboardBuilderPopup from './dashboardbuilder/DashboardBuilderPopup';
import { useDashboardBuilderStore } from './dashboardbuilder/store/dashboardBuilderStore';
import WidgetBuilderPopup from './widgetbuilder/WidgetBuilderPopup';
import {
  DASHBOARD_LIST_CHANGED_EVENT,
  notifyDashboardListChanged,
} from './core/dashboardEvents';
import DashboardViewer, { ViewerWidget } from './viewer/DashboardViewer';
import { normalizeDashboardWidgets, getWidgetGrid } from './viewer/widgetNormalize';
import {
  DASHBOARD_GRID_DEFAULT_H,
  DASHBOARD_GRID_DEFAULT_W,
} from './core/dashboardGridRules';

const MENU_CD = 'USR_DASHBOARD';

function getDashboardDescription(dashboard) {
  return dashboard?.descrip || dashboard?.description || '';
}

function AccessEditDialog({ open, onClose, dashboard, onSaved, availableGroups }) {
  const { userId } = useCurrentUser();
  const [type, setType] = useState('public');
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !dashboard) return;
    getDashboard(dashboard.id)
      .then((detail) => {
        setType(detail?.type || dashboard.type || 'public');
        setSelectedGroupIds(detail?.group_ids || []);
      }).catch(() => {});
  }, [open, dashboard]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDashboardAccess(dashboard.id, {
        type,
        group_ids: type === 'group' ? selectedGroupIds : [],
        created_by: userId,
      });
      onSaved();
      onClose();
    } catch (e) {
      alert('저장 실패: ' + (e?.message || String(e)));
    } finally {
      setSaving(false);
    }
  };

  const canSave = type !== 'group' || selectedGroupIds.length > 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>공개 범위 수정</DialogTitle>
      <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <ToggleButtonGroup
          value={type}
          exclusive
          onChange={(_, v) => { if (v) { setType(v); if (v !== 'group') setSelectedGroupIds([]); } }}
          size="small"
        >
          <ToggleButton value="public" sx={{ gap: 0.5, px: 1.5, fontSize: 12 }}>
            <PublicIcon sx={{ fontSize: 15 }} />전체공개
          </ToggleButton>
          <ToggleButton value="group" sx={{ gap: 0.5, px: 1.5, fontSize: 12 }}>
            <GroupIcon sx={{ fontSize: 15 }} />그룹
          </ToggleButton>
          <ToggleButton value="private" sx={{ gap: 0.5, px: 1.5, fontSize: 12 }}>
            <LockIcon sx={{ fontSize: 15 }} />비공개
          </ToggleButton>
        </ToggleButtonGroup>
        {type === 'group' && (
          <Autocomplete
            multiple
            size="small"
            options={availableGroups}
            getOptionLabel={(option) => option.grpNm}
            value={availableGroups.filter(g => selectedGroupIds.includes(g.id))}
            onChange={(_, newValue) => setSelectedGroupIds(newValue.map(g => g.id))}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={(params) => <TextField {...params} placeholder="그룹 선택" size="small" />}
            disableCloseOnSelect
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} size="small">취소</Button>
        <Button variant="contained" size="small" disabled={!canSave || saving} onClick={handleSave}>
          {saving ? <CircularProgress size={14} color="inherit" /> : '저장'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// LocationMultiSearchBox와 동일한 패턴: 라벨 + 읽기전용 input + 검색 아이콘 → 클릭 시 팝업
const ACCESS_TYPE_CONFIG = {
  public:  { icon: PublicIcon,  color: '#3b82f6', label: '전체 공개' },
  group:   { icon: GroupIcon,   color: '#f59e0b', label: '그룹 공개' },
  private: { icon: LockIcon,    color: '#9ca3af', label: '비공개' },
};

function AccessTypeBadge({ type }) {
  const config = ACCESS_TYPE_CONFIG[type] || ACCESS_TYPE_CONFIG.public;
  return (
    <Box sx={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 0.5,
      px: 1,
      py: 0.5,
      borderRadius: '999px',
      border: '1px solid',
      borderColor: `${config.color}55`,
      bgcolor: `${config.color}12`,
    }}>
      <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: config.color, flexShrink: 0 }} />
      <Typography sx={{ fontSize: 12, color: config.color, lineHeight: 1, fontWeight: 500 }}>
        {config.label}
      </Typography>
    </Box>
  );
}

function DashboardListDialog({ open, onClose, dashboards, activeId, loading, error, onSelect, onRefresh, onEditAccess, availableGroups, accessFilter, onAccessFilterChange, selectedGroupId, onGroupChange, editMode = true }) {
  const [search, setSearch] = useState('');

  const isGroupMode = accessFilter === 'group';

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return dashboards;
    return dashboards.filter(dashboard =>
      String(dashboard.title || '').toLowerCase().includes(keyword) ||
      String(getDashboardDescription(dashboard)).toLowerCase().includes(keyword)
    );
  }, [dashboards, search]);

  const handleSelect = (id) => {
    onSelect(id);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullWidth
      PaperProps={{ sx: { width: editMode ? 900 : 600, maxWidth: '95vw' } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
        <DashboardIcon color="primary" fontSize="small" />
        <Typography sx={{ flex: 1, fontSize: 15, fontWeight: 800, color: '#1e293b' }}>
          대시보드 선택
        </Typography>
        {dashboards.length > 0 && (
          <Chip
            size="small"
            label={`${dashboards.length}`}
            sx={{ height: 20, borderRadius: '6px', bgcolor: '#eff6ff', color: '#2563eb', fontWeight: 700 }}
          />
        )}
        <IconButton size="small" onClick={onRefresh} disabled={loading} aria-label="새로고침">
          {loading ? <CircularProgress size={16} /> : <RefreshIcon fontSize="small" />}
        </IconButton>
        <IconButton size="small" onClick={onClose} aria-label="닫기">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <Box sx={{ px: 2, pb: 1, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'nowrap' }}>
        <TextField
          size="small"
          placeholder="대시보드 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{
            flex: 1,
            minWidth: 150,
            '& .MuiInputBase-root': { height: 32 },
            '& .MuiInputBase-input': { fontSize: 12, py: 0.5 },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        {/* 공개 범위 필터 — editMode 일 때만 노출 (viewer 는 "내가 볼 수 있는 것만" 단일 흐름) */}
        {editMode && (
          <>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#1e293b', flexShrink: 0 }}>
              공개 범위
            </Typography>
            <RadioGroup
              row
              value={accessFilter}
              onChange={(e) => onAccessFilterChange(e.target.value)}
              sx={{ flexWrap: 'nowrap', flexShrink: 0 }}
            >
              {[
                { v: 'all',     l: '전체' },
                { v: 'public',  l: '전체공개' },
                { v: 'group',   l: '그룹공개' },
                { v: 'private', l: '비공개' },
              ].map(({ v, l }) => (
                <FormControlLabel
                  key={v}
                  value={v}
                  control={<Radio size="small" sx={{ p: 0.5 }} />}
                  label={<Typography sx={{ fontSize: 12, whiteSpace: 'nowrap' }}>{l}</Typography>}
                  sx={{ mr: 1, ml: 0 }}
                />
              ))}
            </RadioGroup>
            {/* 그룹 select — 자리는 항상 reserve, group 모드일 때만 표시 */}
            <FormControl
              size="small"
              sx={{ width: 180, flexShrink: 0, visibility: isGroupMode ? 'visible' : 'hidden' }}
            >
              <Select
                displayEmpty
                value={selectedGroupId ?? ''}
                onChange={(e) => onGroupChange(e.target.value || null)}
                renderValue={(v) => {
                  if (!v) return <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>그룹 선택</Typography>;
                  const g = availableGroups.find(g => String(g.id) === String(v));
                  return <Typography sx={{ fontSize: 12 }}>{g?.grpNm || ''}</Typography>;
                }}
                sx={{
                  height: 32,
                  '& .MuiSelect-select': { py: 0.5, fontSize: 12 },
                }}
              >
                <MenuItem value=""><em>(선택)</em></MenuItem>
                {availableGroups.map((g) => (
                  <MenuItem key={g.id} value={g.id} sx={{ fontSize: 12 }}>{g.grpNm}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </>
        )}
      </Box>

      <Divider />

      <DialogContent sx={{ p: 0, minHeight: 200, maxHeight: 420 }}>
        {error && <Alert severity="error" sx={{ m: 1 }}>{error}</Alert>}
        {!loading && !error && dashboards.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 2 }}>
            저장된 대시보드가 없습니다.
          </Typography>
        )}
        {!loading && !error && dashboards.length > 0 && filtered.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 2 }}>
            검색 결과가 없습니다.
          </Typography>
        )}
        <List dense disablePadding>
          {filtered.map((dashboard) => {
            const selected = String(dashboard.id) === String(activeId);
            return (
              <ListItemButton
                key={dashboard.id}
                selected={selected}
                onClick={() => handleSelect(dashboard.id)}
                sx={{
                  mx: 0.75,
                  my: 0.25,
                  borderRadius: '6px',
                  alignItems: 'center',
                  border: '1px solid transparent',
                  '&.Mui-selected': { bgcolor: '#eff6ff', borderColor: '#bfdbfe' },
                  '&.Mui-selected:hover': { bgcolor: '#e0f2fe' },
                  '& .edit-btn': { opacity: 0 },
                  '&:hover .edit-btn': { opacity: 1 },
                }}
              >
                <ListItemIcon sx={{ minWidth: 34 }}>
                  <DashboardIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={dashboard.title || 'Untitled'}
                  secondary={getDashboardDescription(dashboard)}
                  primaryTypographyProps={{ noWrap: true, fontWeight: selected ? 700 : 500 }}
                  secondaryTypographyProps={{ noWrap: true }}
                />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                  {editMode && canEditDashboardAccess(dashboard) && (
                    <Tooltip title="공개 범위 수정">
                      <IconButton
                        className="edit-btn"
                        size="small"
                        onClick={(e) => { e.stopPropagation(); onEditAccess(dashboard); }}
                        sx={{ p: 0.25, transition: 'opacity 0.15s' }}
                      >
                        <EditIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                  {editMode && <AccessTypeBadge type={dashboard.type} />}
                </Box>
              </ListItemButton>
            );
          })}
        </List>
      </DialogContent>
    </Dialog>
  );
}

export default function UserDashboardPage({ onUseAsScreen } = {}) {
  const [dashboardId, setDashboardId] = useState(null);
  const [selectedDashboard, setSelectedDashboard] = useState(null);
  const [dashboardList, setDashboardList] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState('');
  const [dashboardListOpen, setDashboardListOpen] = useState(false);
  const [widgetBuilderOpen, setWidgetBuilderOpen] = useState(false);
  const [dashboardBuilderOpen, setDashboardBuilderOpen] = useState(false);
  const [maximizedWidget, setMaximizedWidget] = useState(null);
  const [accessEditTarget, setAccessEditTarget] = useState(null);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [accessFilter, setAccessFilter] = useState('all'); // 'all' | 'public' | 'group' | 'private'
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [mode, setMode] = useState('edit'); // 'edit' | 'viewer' — Composer 내부는 기본 편집 모드
  const [dashboardReloadKey, setDashboardReloadKey] = useState(0);
  const canEditUser = useCanEditUser();
  const resetDashboardBuilder = useDashboardBuilderStore(state => state.reset);
  const addCanvasWidget = useDashboardBuilderStore(state => state.addWidget);
  const setBuilderDashboardId = useDashboardBuilderStore(state => state.setDashboardId);
  const setBuilderTitle = useDashboardBuilderStore(state => state.setTitle);
  const setBuilderType = useDashboardBuilderStore(state => state.setType);
  const setBuilderGroupIds = useDashboardBuilderStore(state => state.setSelectedGroupIds);
  const setBuilderCanvasWidgets = useDashboardBuilderStore(state => state.setCanvasWidgets);

  const hasSelectedDashboard = Boolean(
    dashboardId &&
    selectedDashboard &&
    String(selectedDashboard.id) === String(dashboardId)
  );
  const showDashboardLoading = dashboardLoading || (Boolean(dashboardId) && !hasSelectedDashboard && !dashboardError);

  const dashboardWidgets = useMemo(
    () => normalizeDashboardWidgets(selectedDashboard?.layout_json),
    [selectedDashboard]
  );
  const useStudioGridRenderer = dashboardWidgets.length > 0;

  const handleMaximizeWidget = useCallback((widget) => {
    setMaximizedWidget(widget);
  }, []);

  const handleRestoreWidget = useCallback(() => {
    setMaximizedWidget(null);
  }, []);

  const handleGetWidgets = useCallback((widgetConfigs) => {
    return normalizeDashboardWidgets(widgetConfigs).map((wconfig) => {
      if (!wconfig.spec_json && !wconfig.widget_type) return wconfig;
      return {
        ...wconfig,
        showTitleBar: false,
        onGetWidget: ({ wconfig: wc }) => (
          <ViewerWidget item={wc} onMaximize={handleMaximizeWidget} />
        ),
      };
    });
  }, [handleMaximizeWidget]);

  const loadDashboardList = useCallback((preferredDashboardId = null) => {
    const preferredId = ['string', 'number'].includes(typeof preferredDashboardId)
      ? preferredDashboardId
      : null;

    // accessFilter 별 API 호출 정책:
    //   group   — 그룹 선택 시에만 백엔드 group_id 필터로 호출
    //   그 외   — listDashboards(null, null) 로 사용자가 볼 수 있는 전부 + 클라 필터
    const useGroupBackend = accessFilter === 'group' && selectedGroupId;
    const apiGroupId = useGroupBackend ? selectedGroupId : null;

    setListLoading(true);
    setListError('');
    return listDashboards(null, apiGroupId)
      .then((result) => {
        const rows = Array.isArray(result) ? result : (result?.dashboards || []);
        // 클라이언트 필터 — type 으로 추가 좁힘 (group 모드는 백엔드가 이미 필터)
        const filtered = rows.filter((row) => {
          if (accessFilter === 'public')  return row.type === 'public';
          if (accessFilter === 'private') return row.type === 'private';
          return true;
        });
        setDashboardList(filtered);
        setDashboardId((prevId) => {
          const nextId = preferredId || prevId;
          if (nextId && filtered.some(row => String(row.id) === String(nextId))) return nextId;
          return filtered[0]?.id || null;
        });
        return filtered;
      })
      .catch((error) => {
        setListError(`목록 로드 실패: ${error?.message || String(error)}`);
      })
      .finally(() => setListLoading(false));
  }, [accessFilter, selectedGroupId]);

  useEffect(() => {
    getGroups()
      .then(data => setAvailableGroups(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadDashboardList();
  }, [loadDashboardList]);

  useEffect(() => {
    const handleDashboardListChanged = () => loadDashboardList();
    window.addEventListener(DASHBOARD_LIST_CHANGED_EVENT, handleDashboardListChanged);
    return () => window.removeEventListener(DASHBOARD_LIST_CHANGED_EVENT, handleDashboardListChanged);
  }, [loadDashboardList]);

  useEffect(() => {
    if (!dashboardId) {
      setSelectedDashboard(null);
      setDashboardError('');
      return;
    }

    let mounted = true;
    setDashboardLoading(true);
    setDashboardError('');

    getDashboard(dashboardId)
      .then((dashboard) => {
        if (mounted) setSelectedDashboard(dashboard);
      })
      .catch((error) => {
        if (mounted) {
          setSelectedDashboard(null);
          setDashboardError(`대시보드 로드 실패: ${error?.message || String(error)}`);
        }
      })
      .finally(() => {
        if (mounted) setDashboardLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [dashboardId, dashboardReloadKey]);

  useEffect(() => {
    setMaximizedWidget(null);
  }, [dashboardId]);

  // viewer 모드 진입 시 공개범위 필터를 'all' 로 리셋 — 그렇지 않으면 edit 모드에서 켜둔
  // group/private 필터가 viewer 다이얼로그까지 따라와 사용자가 볼 수 있는 목록이 부분만 표시됨.
  useEffect(() => {
    if (mode === 'viewer') {
      setAccessFilter('all');
      setSelectedGroupId(null);
    }
  }, [mode]);

  const handleSelect = useCallback((id) => {
    if (!id || String(id) === String(dashboardId)) return;
    setDashboardId(id);
  }, [dashboardId]);

  const handleOpenDashboardBuilder = () => {
    resetDashboardBuilder();
    setDashboardBuilderOpen(true);
  };

  const handleEditCurrentDashboard = useCallback(() => {
    if (!selectedDashboard) return;
    resetDashboardBuilder();
    setBuilderDashboardId(selectedDashboard.id);
    setBuilderTitle(selectedDashboard.title || '');
    setBuilderType(selectedDashboard.type || 'public');
    setBuilderGroupIds(Array.isArray(selectedDashboard.group_ids) ? selectedDashboard.group_ids : []);
    const builderWidgets = dashboardWidgets.map((w) => {
      const grid = getWidgetGrid(w);
      return {
        key: w.key,
        title: w.title,
        widget_type: w.widget_type,
        spec_json: w.spec_json,
        layout: {
          i: w.key,
          x: Number.isFinite(grid.x) ? grid.x : 0,
          y: Number.isFinite(grid.y) ? grid.y : 0,
          w: Number.isFinite(grid.w) ? grid.w : DASHBOARD_GRID_DEFAULT_W,
          h: Number.isFinite(grid.h) ? grid.h : DASHBOARD_GRID_DEFAULT_H,
          minW: Number.isFinite(grid.minW) ? grid.minW : 2,
          minH: Number.isFinite(grid.minH) ? grid.minH : 3,
        },
      };
    });
    setBuilderCanvasWidgets(builderWidgets);
    setDashboardBuilderOpen(true);
  }, [
    selectedDashboard,
    dashboardWidgets,
    resetDashboardBuilder,
    setBuilderDashboardId,
    setBuilderTitle,
    setBuilderType,
    setBuilderGroupIds,
    setBuilderCanvasWidgets,
  ]);

  const handleCloseDashboardBuilder = () => {
    setDashboardBuilderOpen(false);
    resetDashboardBuilder();
  };

  const handleDashboardSaved = (result) => {
    const savedId = result?.dashboard_id;
    setDashboardBuilderOpen(false);
    resetDashboardBuilder();
    notifyDashboardListChanged();
    loadDashboardList(savedId);
    if (savedId) setDashboardId(savedId);
    // 같은 dashboardId 로 덮어쓰기(편집)한 경우엔 useEffect deps 가 안 바뀌어
    // 재조회가 안 됨 — reload key 를 올려 강제 재조회 트리거.
    setDashboardReloadKey((k) => k + 1);
  };

  const handleWidgetBuilderClick = () => {
    setWidgetBuilderOpen(true);
  };

  const handleWidgetSelected = (widget) => {
    resetDashboardBuilder();
    addCanvasWidget(widget);
    setWidgetBuilderOpen(false);
    setDashboardBuilderOpen(true);
  };

  return (
    <>
      <ContentInner>
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 1,
          px: 1, py: 0.75,
          border: '1px solid rgba(124,167,224,0.30)',
          bgcolor: 'rgba(255,255,255,0.55)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderRadius: '8px',
          flex: '0 0 auto',
        }}>
          {/* 공통부 — 모드 무관, 양쪽 모드 모두에서 노출 */}
          {hasSelectedDashboard && (
            <Typography
              noWrap
              sx={{
                maxWidth: 320,
                px: 1,
                fontSize: 13,
                fontWeight: 700,
                color: '#1e293b',
              }}
              title={selectedDashboard.title}
            >
              {selectedDashboard.title}
            </Typography>
          )}
          <Button size="small" variant="outlined" startIcon={<DashboardIcon fontSize="small" />}
                  onClick={() => setDashboardListOpen(true)}>
            {transLangKey('대시보드 선택')}
          </Button>

          {/* 편집부 — edit 모드 + 편집 권한자만 노출 */}
          {mode === 'edit' && canEditUser && (
            <>
              <Button size="small" variant="outlined" startIcon={<EditIcon fontSize="small" />}
                      onClick={handleWidgetBuilderClick}>
                {transLangKey('위젯 생성')}
              </Button>
              <Button size="small" variant="outlined" startIcon={<DashboardIcon fontSize="small" />}
                      onClick={handleOpenDashboardBuilder}>
                {transLangKey('대시보드 생성')}
              </Button>
              <Tooltip title={hasSelectedDashboard ? '' : '먼저 대시보드를 선택하세요'}>
                <span>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<DashboardCustomizeIcon fontSize="small" />}
                    disabled={!hasSelectedDashboard || dashboardLoading || Boolean(dashboardError)}
                    onClick={handleEditCurrentDashboard}
                  >
                    {transLangKey('현재 대시보드 편집')}
                  </Button>
                </span>
              </Tooltip>
            </>
          )}

          {/* spacer */}
          <Box sx={{ flex: 1 }} />

          {/* Composer 진입용 — onUseAsScreen prop 주입된 경우에만 노출. 좌측 사이드바 진입 시 미렌더. */}
          {typeof onUseAsScreen === 'function' && (
            <Button
              size="small"
              variant="contained"
              startIcon={<OpenInNewIcon fontSize="small" />}
              disabled={!hasSelectedDashboard || dashboardLoading || Boolean(dashboardError)}
              onClick={() => onUseAsScreen(selectedDashboard)}
              sx={{
                fontWeight: 700,
                bgcolor: '#0ea5e9',
                '&:hover': { bgcolor: '#0284c7' },
              }}
            >
              {transLangKey('이 대시보드로 화면 생성')}
            </Button>
          )}

          {/* 모드 토글 — 편집 권한자만 노출 */}
          {canEditUser && (
            <ToggleButtonGroup
              value={mode}
              exclusive
              size="small"
              onChange={(_, next) => { if (next) setMode(next); }}
              sx={{
                '& .MuiToggleButton-root': {
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'none',
                  py: 0.25, px: 1,
                },
              }}
            >
              <ToggleButton value="edit">{transLangKey('편집')}</ToggleButton>
              <ToggleButton value="viewer">{transLangKey('뷰어')}</ToggleButton>
            </ToggleButtonGroup>
          )}
        </Box>
        <WorkArea style={{ position: 'relative' }}>
          {showDashboardLoading && (
            <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress />
            </Box>
          )}

          {!showDashboardLoading && dashboardError && (
            <Alert severity="error" sx={{ m: 2 }}>{dashboardError}</Alert>
          )}

          {!showDashboardLoading && !dashboardError && hasSelectedDashboard && useStudioGridRenderer && (
            <DashboardViewer
              widgets={dashboardWidgets}
              onMaximize={handleMaximizeWidget}
              maximizedWidget={maximizedWidget}
              onRestoreMaximize={handleRestoreWidget}
            />
          )}

          {!showDashboardLoading && !dashboardError && hasSelectedDashboard && !useStudioGridRenderer && (
            <DashboardPanel
              key={dashboardId}
              id={dashboardId}
              menuCd={MENU_CD}
              widgets={dashboardWidgets}
              actionBar={false}
              option={{
                store: 'PGM',
                closeBtn: false,
                maximizeBtn: true,
                fullScreenBtn: true,
                widgetConfigVisible: false,
              }}
              isDraggable={false}
              isResizable={false}
              fitHeight={true}
              autoSize={true}
              OnGetWidgets={handleGetWidgets}
            />
          )}

          {!showDashboardLoading && !dashboardError && !dashboardId && (
            <Box sx={{ height: '100%', m: 2, border: '1px dashed #d8e0ea', borderRadius: '8px', bgcolor: '#fff' }} />
          )}

          {maximizedWidget && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                zIndex: 20,
                width: '100%',
                height: '100%',
                minWidth: 0,
                minHeight: 0,
                bgcolor: '#fbfcfe',
              }}
            >
              <ViewerWidget
                key={maximizedWidget.key || maximizedWidget.widgetId || maximizedWidget.id}
                item={maximizedWidget}
                maximized
                onRestore={handleRestoreWidget}
              />
            </Box>
          )}

        </WorkArea>
      </ContentInner>

        {/* 팝업들 */}
        <DashboardListDialog
          open={dashboardListOpen}
          onClose={() => setDashboardListOpen(false)}
          dashboards={dashboardList}
          activeId={dashboardId}
          loading={listLoading}
          error={listError}
          onSelect={handleSelect}
          onRefresh={loadDashboardList}
          onEditAccess={(dashboard) => {
            setAccessEditTarget(dashboard);
          }}
          availableGroups={availableGroups}
          accessFilter={accessFilter}
          onAccessFilterChange={(next) => {
            setAccessFilter(next);
            // 그룹 모드 빠져나갈 때 그룹 선택 초기화 (다음번 group 진입 시 다시 명시 선택)
            if (next !== 'group') setSelectedGroupId(null);
          }}
          selectedGroupId={selectedGroupId}
          onGroupChange={(groupId) => setSelectedGroupId(groupId)}
          editMode={mode === 'edit' && canEditUser}
        />
        <AccessEditDialog
          open={Boolean(accessEditTarget)}
          onClose={() => setAccessEditTarget(null)}
          dashboard={accessEditTarget}
          onSaved={loadDashboardList}
          availableGroups={availableGroups}
        />
        <WidgetBuilderPopup
          open={widgetBuilderOpen}
          onClose={() => setWidgetBuilderOpen(false)}
          isAdmin={true}
          onSelect={handleWidgetSelected}
        />
        <DashboardBuilderPopup
          open={dashboardBuilderOpen}
          onClose={handleCloseDashboardBuilder}
          onSaved={handleDashboardSaved}
        />
    </>

  );
}
