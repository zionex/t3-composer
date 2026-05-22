/**
 * ComposerCanvas — 9-Step Wizard 의 대체. 시각 직접 조작 + Mini Dialog.
 *
 *   props:
 *     spec        : ComposerSpec
 *     onChange    : (nextSpec) => void
 *     readOnly?   : boolean
 *
 *   레이아웃:
 *     ┌─────────────────────────────────────────┐
 *     │ 🔍 FilterBar (노란 띠, 클릭 → FBMD)      │
 *     ├─────────────────────────────────────────┤
 *     │ 📐 Body Layers (단순 flex, 클릭 → DMD)   │
 *     └─────────────────────────────────────────┘
 *
 *   Phase 1: 미세조정(layer 추가/이동/삭제) OFF — 패턴이 만든 layer 그대로.
 *   Phase 3 에서 LayoutDesigner 의 RGL 미세조정 토글 흡수 예정.
 *
 *   디자인: docs/superpowers/specs/2026-05-22-pattern-driven-composer-redesign-design.md
 *           "FilterBar 시각 분리" + "Mini Dialog 디자인" 섹션
 *   Plan: docs/superpowers/plans/2026-05-22-composer-canvas-phase1.md (Task 5)
 */
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Box, Typography, Button, Chip, Menu, MenuItem, IconButton, Tooltip } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

import ReactGridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// ── Layer 아이콘 ──
import TableViewIcon        from '@mui/icons-material/TableView';
import AccountTreeIcon      from '@mui/icons-material/AccountTree';
import PivotTableChartIcon  from '@mui/icons-material/PivotTableChart';
import ViewListIcon         from '@mui/icons-material/ViewList';
import CalendarMonthIcon    from '@mui/icons-material/CalendarMonth';
import ScheduleIcon         from '@mui/icons-material/Schedule';
import ViewKanbanIcon       from '@mui/icons-material/ViewKanban';
import BarChartIcon         from '@mui/icons-material/BarChart';
import StackedBarChartIcon  from '@mui/icons-material/StackedBarChart';
import ShowChartIcon        from '@mui/icons-material/ShowChart';
// AreaChart 는 MUI 5.11 에 없음 → ShowChart 로 폴백 (이미 import 됨)
import PieChartIcon         from '@mui/icons-material/PieChart';
import DonutLargeIcon       from '@mui/icons-material/DonutLarge';
import ScatterPlotIcon      from '@mui/icons-material/ScatterPlot';
import SpeedIcon            from '@mui/icons-material/Speed';
import TimelineIcon         from '@mui/icons-material/Timeline';
import SchemaIcon           from '@mui/icons-material/Schema';
import MapIcon              from '@mui/icons-material/Map';
import TabIcon              from '@mui/icons-material/Tab';
import CreditCardIcon       from '@mui/icons-material/CreditCard';
import DashboardIcon        from '@mui/icons-material/Dashboard';
import ViewQuiltIcon        from '@mui/icons-material/ViewQuilt';
import PictureAsPdfIcon     from '@mui/icons-material/PictureAsPdf';
import ArticleIcon          from '@mui/icons-material/Article';
import ImageIcon            from '@mui/icons-material/Image';
import CompareIcon          from '@mui/icons-material/Compare';
import CloudUploadIcon      from '@mui/icons-material/CloudUpload';
import DescriptionIcon      from '@mui/icons-material/Description';
import SmartToyIcon         from '@mui/icons-material/SmartToy';
import InsightsIcon         from '@mui/icons-material/Insights';
import PsychologyIcon       from '@mui/icons-material/Psychology';
import AutoAwesomeIcon      from '@mui/icons-material/AutoAwesome';
import GridOnIcon           from '@mui/icons-material/GridOn';

import DataMiniDialog from './DataMiniDialog';
import FilterBarMiniDialog from './FilterBarMiniDialog';
import ScreenMetaDialog from './ScreenMetaDialog';
import { addLayer, removeLayer, getTopLevelLayers, getChildLayers } from './wizardState';

// EditNoteOutlined 가 MUI 5.11 에 없을 수 있어 MenuBookOutlined 로 fallback
import EditNoteOutlinedIcon from '@mui/icons-material/MenuBookOutlined';

/** Layer type 별 accent 색 — 좌측 4px stripe + 호버 효과. 파스텔 톤. */
const LAYER_TYPE_ACCENT = {
  GRID:      '#7CA7E0',  // 파랑
  CHART:     '#E6C079',  // 호박
  CONTAINER: '#9D8FD4',  // 보라
  DOCUMENT:  '#8FC4D4',  // 청록
  AI:        '#C99FD4',  // 마젠타
};

/** type 별 대표 아이콘 — 같은 type 카드들의 그룹 정체성 강조용 (큰 아이콘 + watermark 공통). */
const TYPE_ICON = {
  GRID:      TableViewIcon,
  CHART:     InsightsIcon,
  CONTAINER: ViewQuiltIcon,
  DOCUMENT:  DescriptionIcon,
  AI:        AutoAwesomeIcon,
};

/** subtype → 작은 보조 아이콘 (선택적 표시용). 자주 쓰는 것만. type 단위 인상 보존하면서 미세 식별. */
const SUBTYPE_HINT_ICON = {
  GRID_TREE:         AccountTreeIcon,
  GRID_CROSSTAB:     PivotTableChartIcon,
  GRID_PIVOT:        PivotTableChartIcon,
  TREE_VIEW:         AccountTreeIcon,
  FILE_TREE:         AccountTreeIcon,
  CARD_LIST:         ViewListIcon,
  TIMELINE:          TimelineIcon,
  CALENDAR_MONTH:    CalendarMonthIcon,
  CALENDAR_WEEK:     CalendarMonthIcon,
  SCHEDULER:         ScheduleIcon,
  KANBAN_BOARD:      ViewKanbanIcon,
  CHART_LINE:        ShowChartIcon,
  CHART_PIE:         PieChartIcon,
  CHART_DONUT:       DonutLargeIcon,
  CHART_SCATTER:     ScatterPlotIcon,
  CHART_BOXPLOT:     ScatterPlotIcon,
  CHART_HEATMAP:     GridOnIcon,
  CHART_GAUGE:       SpeedIcon,
  CHART_STACKED_BAR: StackedBarChartIcon,
  CHART_GANTT:       TimelineIcon,
  KPI_CARD:          SpeedIcon,
  DIAGRAM_FLO:       SchemaIcon,
  DIAGRAM_NETWORK:   SchemaIcon,
  MAP_GOOGLE:        MapIcon,
  MAP_VECTOR:        MapIcon,
  CONTAINER_TAB:             TabIcon,
  CONTAINER_CARD:            CreditCardIcon,
  CONTAINER_DASHBOARD_PANEL: DashboardIcon,
  DOC_PDF_VIEWER:      PictureAsPdfIcon,
  DOC_MARKDOWN_VIEWER: ArticleIcon,
  DOC_IMAGE_VIEWER:    ImageIcon,
  DOC_DIFF_VIEWER:     CompareIcon,
  DOC_FILE_DROPZONE:   CloudUploadIcon,
  AI_CHAT_PANEL:       SmartToyIcon,
  AI_INSIGHT_CARD:     InsightsIcon,
  AI_SIMULATION_PANEL: AutoAwesomeIcon,
  AI_ONTOLOGY_EDITOR:  PsychologyIcon,
};

function typeIconFor(layer) {
  return TYPE_ICON[layer?.type] || ViewQuiltIcon;
}
function subtypeHintFor(layer) {
  return SUBTYPE_HINT_ICON[layer?.subtype] || null;
}

// ── RGL 상수 ──
const COLS = 12;
const RGL_MARGIN = [8, 8];
const RGL_PADDING = [4, 4];

function ComposerCanvas({
  spec, onChange, readOnly = false, targetCd, onOpenDataSourcePicker, onCreate,
  mode = 'all',  // 'all' (기존) | 'layout' (LayoutStep 전용 — FilterBar/메타/생성 숨김)
}) {
  const [editingLayerKey, setEditingLayerKey] = useState(null);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [addAnchor, setAddAnchor] = useState(null);
  const [metaDialogOpen, setMetaDialogOpen] = useState(false);

  const filterItems = spec?.filterBar?.items || [];
  const layers      = spec?.layers || [];

  const editingLayer = useMemo(
    () => layers.find(l => l.key === editingLayerKey) || null,
    [layers, editingLayerKey]
  );

  const handleApplyLayer = (nextLayer) => {
    if (!nextLayer) return;
    onChange({
      ...spec,
      layers: layers.map(l => (l.key === nextLayer.key ? nextLayer : l)),
    });
  };

  // Container 자식 추가용 — 어느 Container 에 추가할지 anchor 별로 기억
  const [childAnchor, setChildAnchor] = useState(null);  // { el, parentKey }

  const handleAddLayer = (type) => {
    setAddAnchor(null);
    // subtype 강제하지 않음 — 사용자가 mini dialog 자연어로 의도 표현,
    // Claude 가 그 자연어를 보고 적절한 component subtype 결정.
    onChange(addLayer(spec, { type }));
  };

  const handleAddChildLayer = (type) => {
    if (!childAnchor) return;
    const parentKey = childAnchor.parentKey;
    setChildAnchor(null);
    onChange(addLayer(spec, { type, parentKey }));
  };

  const handleRemoveLayer = (key) => {
    if (layers.length <= 1) return;  // 마지막 layer 보호
    onChange(removeLayer(spec, key));
  };

  // RGL onLayoutChange — 새 position 으로 top-level layer position 갱신
  // (Container 자식은 RGL 대상 외 — position 무관)
  const handleLayoutChange = (layout) => {
    if (!layout || layout.length === 0) return;
    const byKey = new Map(layout.map((it) => [it.i, it]));
    const changed = layers.some((l) => {
      if (l.parentKey) return false;  // 자식 layer 는 RGL 무관
      const it = byKey.get(l.key);
      if (!it) return false;
      const p = l.position || {};
      return it.x !== p.x || it.y !== p.y || it.w !== p.w || it.h !== p.h;
    });
    if (!changed) return;
    onChange({
      ...spec,
      layers: layers.map((l) => {
        if (l.parentKey) return l;  // 자식 유지
        const it = byKey.get(l.key);
        if (!it) return l;
        return { ...l, position: { x: it.x, y: it.y, w: it.w, h: it.h } };
      }),
    });
  };

  // top-level layer 만 RGL 에 렌더 (Container 의 자식은 Container 카드 내부에 표시)
  const topLevelLayers = useMemo(() => getTopLevelLayers(spec), [spec]);

  // RGL layout 배열 (top-level 만)
  const rglLayout = useMemo(
    () => topLevelLayers.map((l) => ({
      i: l.key,
      x: l.position?.x ?? 0,
      y: l.position?.y ?? 0,
      w: l.position?.w ?? 12,
      h: l.position?.h ?? 4,
      minW: 2, minH: 2,
    })),
    [topLevelLayers]
  );

  // canvas 본문 컨테이너 크기 측정 — RGL width / rowHeight 동적 계산용
  const gridBoxRef = useRef(null);
  const [containerW, setContainerW] = useState(800);
  const [containerH, setContainerH] = useState(480);

  useEffect(() => {
    const el = gridBoxRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const r = e.contentRect;
        setContainerW(r.width);
        setContainerH(r.height);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // RGL 의 rowHeight = (가용높이 - padding*2 - margin*(rows-1)) / 총rows.
  // top-level layer 의 max(y+h) 기준 (자식은 RGL 무관).
  const totalRows = useMemo(() => {
    const maxBottom = topLevelLayers.reduce((acc, l) => {
      const p = l.position || {};
      return Math.max(acc, (p.y || 0) + (p.h || 0));
    }, 0);
    return Math.max(12, maxBottom);
  }, [topLevelLayers]);

  const rowHeight = useMemo(() => {
    const usable = containerH - RGL_PADDING[1] * 2 - RGL_MARGIN[1] * Math.max(0, totalRows - 1);
    return Math.max(24, Math.floor(usable / totalRows));
  }, [containerH, totalRows]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, height: '100%', minHeight: 0 }}>

      {/* ───── 액션 헤더 — [+ Layer] dropdown + [✨ 화면 생성] 버튼 ───── */}
      {!readOnly && (
        <Box sx={{
          flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1,
          pb: 0.5,
        }}>
          <Typography variant="caption" sx={{ color: '#64748b', mr: 'auto' }}>
            각 영역에 데이터를 채운 뒤 [화면 생성] 클릭 → Claude 가 산출물 + 미리보기 진행.
            Layer 는 드래그/리사이즈/추가/삭제 가능.
          </Typography>

          {/* ── 메타 chip + [메뉴/메타] 버튼 — mode='all' 에서만 (LayoutStep 은 MetaStep 별도) ── */}
          {mode === 'all' && spec?.meta && (
            <Chip
              label={
                spec.meta.menuCd
                  ? `${spec.meta.menuCd}${spec.meta.parentMenuCd ? ` · ⊂ ${spec.meta.parentMenuCd}` : ''}`
                  : '메뉴 미설정'
              }
              size="small"
              onClick={() => setMetaDialogOpen(true)}
              sx={{
                cursor: 'pointer',
                bgcolor: spec.meta.menuCd ? '#dbeafe' : '#fef3c7',
                color:   spec.meta.menuCd ? '#1e40af' : '#92400e',
                fontWeight: 700, fontFamily: 'monospace',
                '&:hover': { bgcolor: spec.meta.menuCd ? '#bfdbfe' : '#fde68a' },
              }}
            />
          )}
          {mode === 'all' && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<EditNoteOutlinedIcon fontSize="small" />}
              onClick={() => setMetaDialogOpen(true)}
              sx={{
                color: '#475569', borderColor: '#cbd5e1', fontWeight: 600,
                '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' },
              }}
            >
              메뉴/메타
            </Button>
          )}

          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon fontSize="small" />}
            onClick={(e) => setAddAnchor(e.currentTarget)}
            sx={{
              color: '#475569', borderColor: '#cbd5e1', fontWeight: 600,
              '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' },
            }}
          >
            Layer
          </Button>
          <Menu
            anchorEl={addAnchor}
            open={!!addAnchor}
            onClose={() => setAddAnchor(null)}
            slotProps={{ paper: { sx: { minWidth: 200 } } }}
          >
            <MenuItem onClick={() => handleAddLayer('GRID')}>
              <TableViewIcon sx={{ fontSize: 18, mr: 1, color: LAYER_TYPE_ACCENT.GRID }} /> Grid · 표 형태 데이터
            </MenuItem>
            <MenuItem onClick={() => handleAddLayer('CHART')}>
              <InsightsIcon sx={{ fontSize: 18, mr: 1, color: LAYER_TYPE_ACCENT.CHART }} /> Chart · 차트/KPI/지도
            </MenuItem>
            <MenuItem onClick={() => handleAddLayer('CONTAINER')}>
              <ViewQuiltIcon sx={{ fontSize: 18, mr: 1, color: LAYER_TYPE_ACCENT.CONTAINER }} /> Container · 탭/카드 wrapper
            </MenuItem>
            <MenuItem onClick={() => handleAddLayer('DOCUMENT')}>
              <DescriptionIcon sx={{ fontSize: 18, mr: 1, color: LAYER_TYPE_ACCENT.DOCUMENT }} /> Document · PDF/이미지/마크다운
            </MenuItem>
            <MenuItem onClick={() => handleAddLayer('AI')}>
              <AutoAwesomeIcon sx={{ fontSize: 18, mr: 1, color: LAYER_TYPE_ACCENT.AI }} /> AI · 채팅/인사이트 패널
            </MenuItem>
          </Menu>

          {/* Container 자식 추가 picker — Container 카드 안 [+ 자식 추가] 버튼이 띄움 */}
          <Menu
            anchorEl={childAnchor?.el || null}
            open={!!childAnchor}
            onClose={() => setChildAnchor(null)}
            slotProps={{ paper: { sx: { minWidth: 220 } } }}
          >
            <Box sx={{ px: 1.5, py: 0.5, fontSize: 11, color: '#64748b', fontWeight: 700 }}>
              Container 자식 추가
            </Box>
            <MenuItem onClick={() => handleAddChildLayer('GRID')}>
              <TableViewIcon sx={{ fontSize: 18, mr: 1, color: LAYER_TYPE_ACCENT.GRID }} /> Grid · 표 형태 데이터
            </MenuItem>
            <MenuItem onClick={() => handleAddChildLayer('CHART')}>
              <InsightsIcon sx={{ fontSize: 18, mr: 1, color: LAYER_TYPE_ACCENT.CHART }} /> Chart · 차트/KPI/지도
            </MenuItem>
            <MenuItem onClick={() => handleAddChildLayer('DOCUMENT')}>
              <DescriptionIcon sx={{ fontSize: 18, mr: 1, color: LAYER_TYPE_ACCENT.DOCUMENT }} /> Document · PDF/이미지/마크다운
            </MenuItem>
            <MenuItem onClick={() => handleAddChildLayer('AI')}>
              <AutoAwesomeIcon sx={{ fontSize: 18, mr: 1, color: LAYER_TYPE_ACCENT.AI }} /> AI · 채팅/인사이트 패널
            </MenuItem>
          </Menu>

          {mode === 'all' && onCreate && (
            <Button
              variant="contained"
              size="small"
              startIcon={<AutoAwesomeIcon fontSize="small" />}
              onClick={() => onCreate(spec)}
              sx={{
                bgcolor: '#9D8FD4', color: '#fff', fontWeight: 700, letterSpacing: '0.02em',
                '&:hover': { bgcolor: '#8b7dca' },
                boxShadow: '0 2px 8px rgba(157,143,212,0.35)',
              }}
            >
              화면 생성
            </Button>
          )}
        </Box>
      )}

      {/* ───── FilterBar 노란 띠 — mode='all' 에서만 (LayoutStep 은 DataAndFilterStep 으로 분리) ───── */}
      {mode === 'all' && (
      <Box
        onClick={readOnly ? undefined : () => setFilterDialogOpen(true)}
        sx={{
          flexShrink: 0,
          border: '2px solid #f59e0b',
          borderRadius: 1.5,
          background: 'linear-gradient(180deg, #fef3c7 0%, #fde68a 100%)',
          p: 1.2,
          cursor: readOnly ? 'default' : 'pointer',
          transition: 'box-shadow 0.15s ease',
          '&:hover': readOnly ? {} : { boxShadow: '0 0 0 3px rgba(245, 158, 11, 0.25)' },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
          <FilterListIcon sx={{ fontSize: 16, color: '#92400e' }} />
          <Typography variant="caption" sx={{ fontWeight: 800, color: '#92400e' }}>
            🔍 검색조건 (FilterBar) · 화면 전체 공용 · 클릭하여 편집
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.7 }}>
          {filterItems.length === 0 && (
            <Typography variant="caption" sx={{ color: '#92400e', fontStyle: 'italic' }}>
              필드 없음 — 클릭하여 검색조건을 추가하세요
            </Typography>
          )}
          {filterItems.map(it => (
            <Chip key={it.key}
                  label={it.label || it.key}
                  size="small"
                  sx={{ bgcolor: '#fff', border: '1px solid #fbbf24',
                        color: '#92400e', fontWeight: 700, fontSize: 11 }} />
          ))}
        </Box>
      </Box>
      )}

      {/* ───── Body Layers 라벨 ───── */}
      <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 0.7 }}>
        <Typography variant="caption" sx={{ fontWeight: 800, color: '#1e40af' }}>
          📐 본문 (Body Layers)
        </Typography>
        <Typography variant="caption" sx={{ color: '#64748b' }}>
          — 각 layer 박스를 클릭하면 데이터 편집 다이얼로그가 열립니다.
        </Typography>
      </Box>

      {/* ───── Body Layers — ReactGridLayout (drag + resize + position 동기화) ───── */}
      <Box ref={gridBoxRef} sx={{
        flex: 1, minHeight: 0, overflow: 'auto', position: 'relative',
      }}>
        {layers.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center', color: '#94a3b8' }}>
            Layer 가 없습니다. 우측 상단 [+ Layer] 로 추가하세요.
          </Box>
        )}
        {layers.length > 0 && containerW > 0 && (
          <ReactGridLayout
            className="composer-canvas-grid"
            cols={COLS}
            width={containerW}
            rowHeight={rowHeight}
            margin={RGL_MARGIN}
            containerPadding={RGL_PADDING}
            layout={rglLayout}
            onLayoutChange={handleLayoutChange}
            isDraggable={!readOnly}
            isResizable={!readOnly}
            draggableHandle=".cnv-layer-drag-handle"
            compactType="vertical"
            preventCollision={false}
            resizeHandles={['se']}
          >
            {topLevelLayers.map((l) => {
              const hasData = !!(l.dataSource?.naturalText) || (l.dataSource?.references || []).length > 0;
              const accent = LAYER_TYPE_ACCENT[l.type] || '#94a3b8';
              const TypeIcon = typeIconFor(l);
              const SubHintIcon = subtypeHintFor(l);
              const subLabel = l.subtype
                ? l.subtype.replace(/^(CHART_|GRID_|DOC_|AI_|CONTAINER_)/, '').replace(/_/g, ' ')
                : '';
              const canDelete = topLevelLayers.length > 1;
              const isContainer = l.type === 'CONTAINER';
              const children = isContainer ? getChildLayers(spec, l.key) : [];
              return (
                <Box key={l.key} sx={{
                  position: 'relative',
                  background: isContainer
                    ? `repeating-linear-gradient(45deg, ${accent}10, ${accent}10 8px, ${accent}1c 8px, ${accent}1c 16px)`
                    : `
                      radial-gradient(circle at 90% 70%, ${accent}2e 0%, transparent 55%),
                      linear-gradient(135deg, ${accent}33 0%, ${accent}12 30%, #ffffff 70%)
                    `,
                  border: isContainer ? `2px dashed ${accent}99` : `1px solid ${accent}55`,
                  borderRadius: 2.5,
                  boxShadow: '0 1px 3px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.7)',
                  overflow: 'hidden',
                  transition: 'box-shadow 0.18s ease, border-color 0.18s ease',
                  '&:hover': readOnly ? {} : {
                    boxShadow: `0 8px 20px rgba(15,23,42,0.10), 0 0 0 1.5px ${accent}aa, inset 0 1px 0 rgba(255,255,255,0.7)`,
                    borderColor: `${accent}cc`,
                  },
                  '&:hover .cnv-layer-remove': { opacity: 1 },
                  display: 'flex',
                }}>
                  {/* 좌측 drag handle stripe — 폭 14px + drag 아이콘 */}
                  <Box className="cnv-layer-drag-handle" sx={{
                    width: 14, flexShrink: 0,
                    bgcolor: accent,
                    cursor: readOnly ? 'default' : 'grab',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    '&:active': { cursor: 'grabbing' },
                    '&:hover': { bgcolor: readOnly ? accent : `${accent}` },
                  }}>
                    {!readOnly && (
                      <DragIndicatorIcon sx={{
                        fontSize: 14,
                        color: 'rgba(255,255,255,0.85)',
                        pointerEvents: 'none',
                      }} />
                    )}
                  </Box>

                  {/* 본문 — Container 와 일반 layer 가 다르게 렌더 */}
                  {isContainer ? (
                    /* Container: 헤더 (아이콘 + 타이틀) + 자식 영역 + [+ 자식] 버튼 */
                    <Box sx={{
                      flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column',
                      gap: 1, p: 1.5, color: '#1e293b',
                    }}>
                      {/* 작은 헤더 — 가로 (아이콘 + 타이틀 + 우측 끝 [+ 자식 추가]) */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{
                          flexShrink: 0, width: 36, height: 36, borderRadius: '50%',
                          bgcolor: '#ffffff', border: `2px solid ${accent}55`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: `0 2px 6px ${accent}3a`,
                        }}>
                          <TypeIcon sx={{ fontSize: 22, color: accent }} />
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.2, flex: 1, minWidth: 0 }}>
                          <Typography sx={{ fontSize: 14, fontWeight: 800, color: '#1e293b',
                                             lineHeight: 1.2 }}>
                            {l.title || l.key}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Box sx={{ px: 0.7, py: 0.1, borderRadius: 0.7,
                                        bgcolor: `${accent}26`, color: accent,
                                        fontSize: 9, fontWeight: 800, letterSpacing: '0.05em',
                                        textTransform: 'uppercase' }}>
                              CONTAINER
                            </Box>
                            <Typography sx={{ fontSize: 10, color: '#64748b' }}>
                              · 자식 {children.length}개
                            </Typography>
                          </Box>
                        </Box>
                        {!readOnly && (
                          <Button
                            size="small"
                            startIcon={<AddIcon fontSize="small" />}
                            onClick={(e) => {
                              e.stopPropagation();
                              setChildAnchor({ el: e.currentTarget, parentKey: l.key });
                            }}
                            sx={{
                              flexShrink: 0,
                              fontSize: 11, py: 0.3,
                              color: accent, borderColor: `${accent}88`,
                              '&:hover': { bgcolor: `${accent}10`, borderColor: accent },
                            }}
                            variant="outlined"
                          >
                            자식 추가
                          </Button>
                        )}
                      </Box>

                      {/* 자식 영역 — 자식 카드 stacked + [+ 자식] 버튼 */}
                      <Box sx={{
                        flex: 1, minHeight: 60,
                        bgcolor: 'rgba(255,255,255,0.55)',
                        border: `1px dashed ${accent}66`,
                        borderRadius: 1.5,
                        p: 1,
                        display: 'flex', flexDirection: 'column', gap: 0.7,
                        overflow: 'auto',
                      }}>
                        {children.length === 0 && (
                          <Typography sx={{ fontSize: 11, color: accent, fontStyle: 'italic',
                                              textAlign: 'center', py: 1.5 }}>
                            ↑ 우상단 [+ 자식 추가] 로 이 wrapper 안에 들어갈 layer 를 추가
                          </Typography>
                        )}
                        {children.map((c) => {
                          const cAccent = LAYER_TYPE_ACCENT[c.type] || '#94a3b8';
                          const CTypeIcon = typeIconFor(c);
                          const cHasData = !!(c.dataSource?.naturalText)
                                        || (c.dataSource?.references || []).length > 0;
                          return (
                            <Box key={c.key} sx={{
                              display: 'flex', alignItems: 'center', gap: 1,
                              bgcolor: '#fff',
                              border: `1px solid ${cAccent}55`,
                              borderLeft: `4px solid ${cAccent}`,
                              borderRadius: 1, p: 0.7, pl: 1,
                              position: 'relative',
                              cursor: 'pointer',
                              transition: 'box-shadow 0.15s ease',
                              '&:hover': {
                                boxShadow: `0 2px 8px rgba(0,0,0,0.08), 0 0 0 1px ${cAccent}88`,
                              },
                              '&:hover .cnv-child-remove': { opacity: 1 },
                            }}
                            onClick={(e) => { e.stopPropagation(); setEditingLayerKey(c.key); }}>
                              <Box sx={{ width: 24, height: 24, borderRadius: '50%',
                                          bgcolor: `${cAccent}1a`, display: 'flex',
                                          alignItems: 'center', justifyContent: 'center',
                                          flexShrink: 0 }}>
                                <CTypeIcon sx={{ fontSize: 14, color: cAccent }} />
                              </Box>
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#1e293b',
                                                   lineHeight: 1.2 }}>
                                  {c.title || c.key}
                                </Typography>
                                <Typography sx={{ fontSize: 9.5, color: cHasData ? '#16a34a' : '#94a3b8',
                                                   fontWeight: cHasData ? 700 : 500 }}>
                                  {c.type}{c.subtype ? ` · ${c.subtype.replace(/^(CHART_|GRID_|DOC_|AI_|CONTAINER_)/, '')}` : ''}
                                  {cHasData ? ' · ✓' : ''}
                                </Typography>
                              </Box>
                              {!readOnly && (
                                <IconButton
                                  className="cnv-child-remove"
                                  size="small"
                                  onClick={(e) => { e.stopPropagation(); handleRemoveLayer(c.key); }}
                                  sx={{
                                    opacity: 0, transition: 'opacity 0.15s ease',
                                    color: '#ef4444', width: 20, height: 20,
                                    '&:hover': { bgcolor: '#fee2e2' },
                                  }}
                                >
                                  <CloseIcon sx={{ fontSize: 12 }} />
                                </IconButton>
                              )}
                            </Box>
                          );
                        })}

                      </Box>
                    </Box>
                  ) : (
                    /* 일반 layer: 가로 flex (아이콘 + 텍스트) — 그대로 */
                    <Box
                      onClick={readOnly ? undefined : () => setEditingLayerKey(l.key)}
                      sx={{
                        flex: 1, minWidth: 0,
                        cursor: readOnly ? 'default' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
                        gap: 2, p: 2,
                        color: '#1e293b',
                      }}
                    >
                      {/* type 아이콘 (좌측 원형) */}
                      <Box sx={{
                        flexShrink: 0,
                        width: 56, height: 56,
                        borderRadius: '50%',
                        bgcolor: '#ffffff',
                        border: `2px solid ${accent}55`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: `0 4px 12px ${accent}3a`,
                      }}>
                        <TypeIcon sx={{ fontSize: 32, color: accent }} />
                      </Box>

                      {/* 텍스트 */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4, minWidth: 0, zIndex: 1 }}>
                        <Typography sx={{ fontSize: 16, fontWeight: 800, color: '#1e293b',
                                           lineHeight: 1.2, letterSpacing: '-0.01em' }}>
                          {l.title || l.key}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7, flexWrap: 'wrap' }}>
                          <Box sx={{ px: 0.9, py: 0.15, borderRadius: 0.8,
                                      bgcolor: `${accent}26`, color: accent,
                                      fontSize: 10, fontWeight: 800, letterSpacing: '0.05em',
                                      textTransform: 'uppercase' }}>
                            {l.type}
                          </Box>
                          {subLabel && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3,
                                        px: 0.7, py: 0.15, borderRadius: 0.8,
                                        bgcolor: '#f1f5f9', color: '#475569',
                                        fontSize: 10, fontWeight: 600, letterSpacing: '0.04em' }}>
                              {SubHintIcon && <SubHintIcon sx={{ fontSize: 11 }} />}
                              {subLabel}
                            </Box>
                          )}
                        </Box>
                        <Typography sx={{ fontSize: 11, fontWeight: hasData ? 700 : 500,
                                           color: hasData ? '#16a34a' : '#94a3b8',
                                           lineHeight: 1.3, mt: 0.3 }}>
                          {hasData ? '✓ 데이터 설정됨' : '클릭하여 데이터 입력'}
                        </Typography>
                      </Box>

                      {/* 우측 watermark */}
                      <Box sx={{
                        position: 'absolute', right: -8, bottom: -16,
                        opacity: 0.12, pointerEvents: 'none', color: accent,
                      }}>
                        <TypeIcon sx={{ fontSize: 140 }} />
                      </Box>
                    </Box>
                  )}

                  {/* 호버 시 우상단 X 삭제 버튼 */}
                  {!readOnly && canDelete && (
                    <Tooltip title="Layer 삭제" placement="left">
                      <IconButton
                        className="cnv-layer-remove"
                        size="small"
                        onClick={(e) => { e.stopPropagation(); handleRemoveLayer(l.key); }}
                        sx={{
                          position: 'absolute', top: 4, right: 4,
                          opacity: 0, transition: 'opacity 0.15s ease',
                          bgcolor: 'rgba(255,255,255,0.9)',
                          color: '#ef4444',
                          '&:hover': { bgcolor: '#fee2e2' },
                          width: 24, height: 24,
                        }}
                      >
                        <CloseIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              );
            })}
          </ReactGridLayout>
        )}
      </Box>

      {/* ───── Dialogs ───── */}
      <DataMiniDialog
        open={!!editingLayer}
        layer={editingLayer}
        targetCd={targetCd}
        onClose={() => setEditingLayerKey(null)}
        onApply={handleApplyLayer}
        /* Phase 2A: 외부에서 받은 콜백 그대로 전달. editingLayer 정보 함께. */
        onOpenDataSourcePicker={
          onOpenDataSourcePicker
            ? () => onOpenDataSourcePicker(editingLayer)
            : null
        }
      />
      <FilterBarMiniDialog
        open={filterDialogOpen}
        spec={spec}
        onClose={() => setFilterDialogOpen(false)}
        onApply={(nextSpec) => onChange(nextSpec)}
      />
      <ScreenMetaDialog
        open={metaDialogOpen}
        onClose={() => setMetaDialogOpen(false)}
        meta={spec?.meta}
        targetCd={targetCd}
        onApply={(nextMeta) => {
          onChange({ ...spec, meta: nextMeta });
        }}
      />
    </Box>
  );
}

export default ComposerCanvas;
