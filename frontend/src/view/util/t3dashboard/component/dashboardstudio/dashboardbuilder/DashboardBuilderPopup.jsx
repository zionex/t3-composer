import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Button, Divider, TextField, Typography, IconButton,
  Grid, CircularProgress, Chip,
  Tooltip, Snackbar, Alert,
  ToggleButton, ToggleButtonGroup, Autocomplete,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import LayoutIcon from '@mui/icons-material/Dashboard';
import PublicIcon from '@mui/icons-material/Public';
import GroupIcon from '@mui/icons-material/Group';
import LockIcon from '@mui/icons-material/Lock';

import { useDashboardBuilderStore } from './store/dashboardBuilderStore';
import DashboardCanvas from './components/DashboardCanvas';
import WidgetPalette from './components/WidgetPalette';
import WidgetBuilderPopup from '../widgetbuilder/WidgetBuilderPopup';
import {
  DASHBOARD_GRID_DEFAULT_H,
  DASHBOARD_GRID_DEFAULT_W,
} from '../core/dashboardGridRules';
import { saveDashboard } from '../../../restapi/widgetBuilder';
import { getGroups } from '../../../restapi/user';
import { useCurrentUser } from '../../../auth/currentUser';

const BUILDER_DIALOG_SX = {
  width: 'min(1640px, calc(100vw - 40px))',
  height: '92vh',
  display: 'flex',
  flexDirection: 'column',
};

export default function DashboardBuilderPopup({ open, onClose, onSaved, embedded = false }) {
  const { userId } = useCurrentUser();

  const {
    dashboardId, title, setTitle,
    type, setType,
    selectedGroupIds, setSelectedGroupIds,
    availableGroups, setAvailableGroups,
    canvasWidgets,
    addWidget,
    saving, setSaving, setSaveResult,
    reset,
  } = useDashboardBuilderStore();

  const [widgetBuilderOpen, setWidgetBuilderOpen] = useState(false);
  const [saveSnack, setSaveSnack] = useState({ open: false, severity: 'success', message: '' });

  useEffect(() => {
    if (open && availableGroups.length === 0) {
      getGroups()
        .then((data) => setAvailableGroups(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }, [open, availableGroups.length, setAvailableGroups]);

  const canSave =
    title.trim() &&
    canvasWidgets.length > 0 &&
    (type !== 'group' || selectedGroupIds.length > 0);

  const handleSave = async () => {
    if (!canSave) return;

    setSaving(true);
    try {
      const widgets = canvasWidgets.map(w => ({
        key: w.key,
        title: w.title,
        widget_type: w.widget_type,
        spec_json: w.spec_json,
        data_grid: {
          x: w.layout?.x ?? 0,
          y: w.layout?.y ?? 0,
          w: w.layout?.w ?? DASHBOARD_GRID_DEFAULT_W,
          h: w.layout?.h ?? DASHBOARD_GRID_DEFAULT_H,
        },
      }));

      const res = await saveDashboard({
        title,
        widgets,
        created_by: userId,
        dashboard_id: dashboardId || undefined,
        type,
        group_ids: type === 'group' ? selectedGroupIds : [],
      });

      setSaveResult(res);
      setSaveSnack({ open: true, severity: 'success', message: `저장 완료! (대시보드 ID: ${res.dashboard_id})` });
      if (onSaved) onSaved(res);
    } catch (e) {
      setSaveSnack({ open: true, severity: 'error', message: '저장 실패: ' + (e?.message || String(e)) });
    } finally {
      setSaving(false);
    }
  };

  const disabledReason = !title.trim()
    ? '대시보드 제목을 입력하세요'
    : canvasWidgets.length === 0
    ? '위젯을 하나 이상 추가하세요'
    : type === 'group' && selectedGroupIds.length === 0
    ? '공개할 그룹을 선택하세요'
    : '';

  const handleClose = () => {
    reset();
    setSaveSnack({ open: false, severity: 'success', message: '' });
    onClose();
  };

  const handleDialogClose = (event, reason) => {
    if (reason === 'backdropClick') return;
    handleClose();
  };

  const Shell = embedded ? Box : Dialog;
  const ContentFrame = embedded ? Box : DialogContent;
  const ActionsFrame = embedded ? Box : DialogActions;
  const shellProps = embedded
    ? {
        sx: {
          height: '100%',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.paper',
          overflow: 'hidden',
        },
      }
    : {
        open,
        onClose: handleDialogClose,
        maxWidth: 'xl',
        fullWidth: true,
        PaperProps: { sx: BUILDER_DIALOG_SX },
      };
  const actionsSx = {
    px: 2,
    py: 1.5,
    borderTop: 1,
    borderColor: 'divider',
    ...(embedded ? { display: 'flex', justifyContent: 'flex-end', gap: 1, flexShrink: 0 } : null),
  };

  return (
    <>
      <Shell {...shellProps}>
        {!embedded && (
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LayoutIcon color="primary" />
            <Typography variant="h6">Dashboard Builder</Typography>
            {canvasWidgets.length > 0 && (
              <Chip size="small" label={`${canvasWidgets.length}개 위젯`} color="primary" />
            )}
          </Box>
          <IconButton size="small" onClick={handleClose}><CloseIcon /></IconButton>
        </DialogTitle>
        )}

        <Box sx={{
          px: 2,
          py: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          borderBottom: 1,
          borderColor: 'divider',
          flexShrink: 0,
          flexWrap: 'wrap',
        }}>
          <TextField
            size="small"
            label="대시보드 제목"
            value={title}
            onChange={e => setTitle(e.target.value)}
            sx={{ width: 260 }}
            required
          />
          <Box sx={{
            position: 'relative',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '4px',
            px: 1,
            display: 'inline-flex',
            alignItems: 'center',
            height: 36,
            gap: 0,
          }}>
            <Typography component="span" sx={{
              position: 'absolute',
              top: -8,
              left: 8,
              bgcolor: 'background.paper',
              px: 0.5,
              color: 'text.secondary',
              fontSize: 11,
              lineHeight: 1,
              pointerEvents: 'none',
              userSelect: 'none',
            }}>
              공개 범위
            </Typography>
            <ToggleButtonGroup
              value={type}
              exclusive
              onChange={(_, v) => { if (v) setType(v); }}
              size="small"
              color="primary"
              sx={{
                '& .MuiToggleButton-root': {
                  border: 'none',
                  fontSize: 12,
                  py: 0.5,
                  gap: 0.5,
                  px: 1.5,
                },
                '& .MuiToggleButton-root + .MuiToggleButton-root': {
                  borderLeft: '1px solid',
                  borderLeftColor: 'divider',
                  marginLeft: 0,
                },
              }}
            >
              <ToggleButton value="public">
                <PublicIcon sx={{ fontSize: 15 }} />전체공개
              </ToggleButton>
              <ToggleButton value="group">
                <GroupIcon sx={{ fontSize: 15 }} />그룹
              </ToggleButton>
              <ToggleButton value="private">
                <LockIcon sx={{ fontSize: 15 }} />비공개
              </ToggleButton>
            </ToggleButtonGroup>
            {type === 'group' && (
              <>
                <Divider orientation="vertical" flexItem sx={{ mx: 1, my: 0.25 }} />
                <Autocomplete
                  multiple
                  size="small"
                  options={availableGroups}
                  getOptionLabel={(option) => option.grpNm}
                  value={availableGroups.filter(g => selectedGroupIds.includes(g.id))}
                  onChange={(_, newValue) => setSelectedGroupIds(newValue.map(g => g.id))}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        {...getTagProps({ index })}
                        key={option.id}
                        label={option.grpNm}
                        size="small"
                        sx={{ height: 20, fontSize: 11, my: 0 }}
                      />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder={selectedGroupIds.length === 0 ? '그룹 선택...' : ''}
                      size="small"
                      error={selectedGroupIds.length === 0}
                      sx={{
                        '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                        '& .MuiOutlinedInput-root': {
                          p: '0 36px 0 4px !important',
                          flexWrap: 'nowrap',
                          overflow: 'hidden',
                          height: 32,
                        },
                      }}
                    />
                  )}
                  sx={{ minWidth: 220 }}
                  disableCloseOnSelect
                />
              </>
            )}
          </Box>
        </Box>

        <ContentFrame sx={{ flex: 1, minHeight: 0, overflow: 'hidden', p: 0 }}>
          <Grid container sx={{ height: '100%', minHeight: 0 }}>
            <Grid item sx={{ width: 240, borderRight: 1, borderColor: 'divider', height: '100%', minHeight: 0, boxSizing: 'border-box' }}>
              <WidgetPalette onOpenWidgetBuilder={() => setWidgetBuilderOpen(true)} />
            </Grid>

            <Grid item xs sx={{ height: '100%', minHeight: 0, minWidth: 0, p: 1, overflow: 'hidden', boxSizing: 'border-box' }}>
              <DashboardCanvas />
            </Grid>
          </Grid>
        </ContentFrame>

        <ActionsFrame sx={actionsSx}>
          <Button onClick={handleClose} size="small">취소</Button>
          <Tooltip title={disabledReason}>
            <span>
              <Button
                variant="contained"
                size="small"
                startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <SaveIcon />}
                onClick={handleSave}
                disabled={saving || !canSave}
              >
                저장
              </Button>
            </span>
          </Tooltip>
        </ActionsFrame>
      </Shell>
      <WidgetBuilderPopup open={widgetBuilderOpen} onClose={() => setWidgetBuilderOpen(false)} />

      {/* <WidgetBuilderPopup
        open={widgetBuilderOpen}
        onClose={() => setWidgetBuilderOpen(false)}
        onSelect={handleWidgetBuilderSelect}
      /> */}
      <Snackbar
        open={saveSnack.open}
        autoHideDuration={3000}
        onClose={() => setSaveSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={saveSnack.severity}
          onClose={() => setSaveSnack(s => ({ ...s, open: false }))}
          sx={{ fontSize: 12 }}
        >
          {saveSnack.message}
        </Alert>
      </Snackbar>
    </>
  );
}
