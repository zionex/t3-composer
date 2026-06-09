import React, { useEffect, useState } from 'react';
import {
  Box, Typography, CircularProgress, Chip, IconButton, Divider, Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import BarChartIcon from '@mui/icons-material/BarChart';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import PieChartIcon from '@mui/icons-material/PieChart';
import TableChartIcon from '@mui/icons-material/TableChart';
import SpeedIcon from '@mui/icons-material/Speed';

import WidgetInfoDialog, { getSpecSourceDisplayName, getVisualTypeLabel } from '../../widgetbuilder/dialogs/WidgetInfoDialog';
import { parseWidgetSpec } from '../../generic/widgetSpecAdapter';

import { useWidgetBuilderStore } from '../../widgetbuilder/store/widgetBuilderStore';
import { useDashboardBuilderStore } from '../store/dashboardBuilderStore';
import { getWidgetLibrary, updateWidgetInLibrary } from '../../../../restapi/widgetBuilder';
import { MODULE_COLORS } from '../../widgetbuilder/tabs/direct/steps/wizardConstants';
import { useCurrentUser } from '../../../../auth/currentUser';

const WIDGET_TYPE_ICONS = {
  bar: BarChartIcon, bar_stacked: BarChartIcon, bar_h: BarChartIcon,
  line: ShowChartIcon, area: ShowChartIcon, bar_line: ShowChartIcon,
  pie: PieChartIcon, doughnut: PieChartIcon,
  table: TableChartIcon, kpi: SpeedIcon,
};

export default function WidgetPalette({ onOpenWidgetBuilder }) {
  const { userId } = useCurrentUser();
  const { library, setLibrary, libraryLoading, setLibraryLoading } = useWidgetBuilderStore();
  const { addWidget, canAddWidget, canvasWidgets, selectedWidgetKey } = useDashboardBuilderStore();
  const [infoWidget, setInfoWidget] = useState(null);

  useEffect(() => {
    loadLibrary();
  }, []);

  const loadLibrary = async () => {
    setLibraryLoading(true);
    try {
      const data = await getWidgetLibrary();
      setLibrary(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLibraryLoading(false);
    }
  };

  const handleAddWidget = (widget) => {
    return addWidget({
      libraryWidgetId: widget.id,
      title: widget.title,
      widget_type: widget.widget_type,
      spec_json: widget.spec_json,
    });
  };

  const handleInfoSaveEdit = async (payload) => {
    if (!infoWidget?.id) return;
    await updateWidgetInLibrary(infoWidget.id, { ...payload, created_by: userId });
    await loadLibrary();
    setInfoWidget(null);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, pb: 1 }}>
        <Typography variant="subtitle2">위젯 팔레트</Typography>
        <Tooltip title="새 위젯 생성">
          <IconButton size="small" onClick={onOpenWidgetBuilder}><AddIcon /></IconButton>
        </Tooltip>
      </Box>
      <Divider />

      <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
        {libraryLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : library.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              저장된 위젯이 없습니다.
            </Typography>
            <br />
            <Typography variant="caption" color="primary" sx={{ cursor: 'pointer' }}
              onClick={onOpenWidgetBuilder}>
              Widget Builder에서 생성하세요
            </Typography>
          </Box>
        ) : (
          library.map(widget => {
            const spec = parseWidgetSpec(widget.spec_json);
            const visualType = widget.widget_type || spec.visualConfig?.type || spec.widgetType;
            const Icon = WIDGET_TYPE_ICONS[visualType] || BarChartIcon;
            const sourceSummary = getSpecSourceDisplayName(spec);
            const visualLabel = getVisualTypeLabel(visualType);
            const widgetSpecKey = JSON.stringify(widget.spec_json ?? {});
            const matchedCanvasWidgets = canvasWidgets.filter((canvasWidget) => {
              const canvasLibraryId = canvasWidget.libraryWidgetId ?? canvasWidget.library_widget_id;
              if (canvasLibraryId != null && widget.id != null) {
                return String(canvasLibraryId) === String(widget.id);
              }
              return (
                canvasWidget.title === widget.title &&
                JSON.stringify(canvasWidget.spec_json ?? {}) === widgetSpecKey
              );
            });
            const addedToCanvas = matchedCanvasWidgets.length > 0;
            const activeInCanvas = matchedCanvasWidgets.some((canvasWidget) => canvasWidget.key === selectedWidgetKey);
            const canAddToCanvas = canAddWidget(widget);
            return (
              <Box key={widget.id}
                onClick={() => {
                  if (canAddToCanvas) handleAddWidget(widget);
                }}
                sx={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  p: 1,
                  pl: addedToCanvas ? 1.35 : 1,
                  border: 1,
                  borderColor: activeInCanvas ? '#2563eb' : addedToCanvas ? '#93c5fd' : 'divider',
                  borderRadius: 1,
                  mb: 0.75,
                  cursor: canAddToCanvas ? 'pointer' : 'not-allowed',
                  bgcolor: activeInCanvas ? '#eff6ff' : addedToCanvas ? '#f0f7ff' : 'background.paper',
                  boxShadow: activeInCanvas ? '0 0 0 2px rgba(37, 99, 235, 0.16)' : 'none',
                  transition: 'border-color 120ms ease, box-shadow 120ms ease, background-color 120ms ease',
                  '&::before': addedToCanvas ? {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: 6,
                    bottom: 6,
                    width: 4,
                    borderRadius: '0 4px 4px 0',
                    bgcolor: activeInCanvas ? '#2563eb' : '#60a5fa',
                  } : undefined,
                  '&:hover': {
                    bgcolor: activeInCanvas ? '#eff6ff' : addedToCanvas ? '#e0f2fe' : 'action.hover',
                    borderColor: addedToCanvas ? '#60a5fa' : 'divider',
                  },
                }}>
                <Icon sx={{ fontSize: 18, color: addedToCanvas ? '#2563eb' : MODULE_COLORS[widget.module] || 'text.secondary', flexShrink: 0 }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="caption"
                    display="block"
                    noWrap
                    fontWeight={activeInCanvas ? 800 : addedToCanvas ? 700 : 600}
                    color={addedToCanvas ? '#1e3a8a' : 'text.primary'}
                  >
                    {widget.title}
                  </Typography>
                  {sourceSummary && (
                    <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', lineHeight: 1.4 }} noWrap>
                      {sourceSummary}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', gap: 0.5, mt: 0.25 }}>
                    <Chip size="small" label={visualLabel || visualType}
                      title={visualType}
                      sx={{ height: 14, fontSize: '0.6rem' }} />
                    {widget.module && (
                      <Chip size="small" label={widget.module}
                        sx={{ height: 14, fontSize: '0.6rem',
                          bgcolor: MODULE_COLORS[widget.module] || undefined, color: 'white' }} />
                    )}
                  </Box>
                </Box>
                <Tooltip title="위젯 정보">
                  <IconButton
                    size="small"
                    onClick={(event) => {
                      event.stopPropagation();
                      setInfoWidget(widget);
                    }}
                  >
                    <InfoOutlinedIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title={canAddToCanvas ? '캔버스에 추가' : '배치 영역이 꽉 찼습니다'}>
                  <span>
                    <IconButton
                      size="small"
                      disabled={!canAddToCanvas}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleAddWidget(widget);
                      }}
                    >
                      <AddIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            );
          })
        )}
      </Box>
      <WidgetInfoDialog
        widget={infoWidget}
        onClose={() => setInfoWidget(null)}
        onSaveEdit={handleInfoSaveEdit}
      />
    </Box>
  );
}
