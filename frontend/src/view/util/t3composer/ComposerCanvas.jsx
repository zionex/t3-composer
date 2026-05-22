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
import React, { useState, useMemo } from 'react';
import { Box, Typography, Button } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';

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

function ComposerCanvas({ spec, onChange, readOnly = false, targetCd, onOpenDataSourcePicker, onCreate }) {
  const [editingLayerKey, setEditingLayerKey] = useState(null);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

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

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, height: '100%', minHeight: 0 }}>

      {/* ───── 액션 헤더 — [✨ 화면 생성] 버튼 ───── */}
      {!readOnly && onCreate && (
        <Box sx={{
          flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1,
          pb: 0.5,
        }}>
          <Typography variant="caption" sx={{ color: '#64748b', mr: 'auto' }}>
            각 영역에 데이터를 채운 뒤 우측 [화면 생성] 버튼을 누르면 Claude 가 산출물을 만들고 미리보기까지 진행합니다.
          </Typography>
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
        </Box>
      )}

      {/* ───── FilterBar 노란 띠 ───── */}
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

      {/* ───── Body Layers 라벨 ───── */}
      <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 0.7 }}>
        <Typography variant="caption" sx={{ fontWeight: 800, color: '#1e40af' }}>
          📐 본문 (Body Layers)
        </Typography>
        <Typography variant="caption" sx={{ color: '#64748b' }}>
          — 각 layer 박스를 클릭하면 데이터 편집 다이얼로그가 열립니다.
        </Typography>
      </Box>

      {/* ───── Body Layers ─────
          Phase 2B-1 polish: CSS Grid 12-col × 12-row 로 position 활용 (정적 배치).
          drag/resize 는 Phase 1.5 의 RGL 통합에서. */}
      <Box sx={{
        flex: 1, minHeight: 0, overflow: 'auto', p: 0.5,
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gridAutoRows: 'minmax(28px, auto)',
        gap: 1,
      }}>
        {layers.length === 0 && (
          <Box sx={{ gridColumn: '1 / -1', p: 4, textAlign: 'center', color: '#94a3b8' }}>
            Layer 가 없습니다. ComposerSpec.layers 가 비어있는지 확인하세요.
          </Box>
        )}
        {layers.map(l => {
          const hasData = !!(l.dataSource?.naturalText) || (l.dataSource?.references || []).length > 0;
          const accent = LAYER_TYPE_ACCENT[l.type] || '#94a3b8';
          const TypeIcon = typeIconFor(l);
          const SubHintIcon = subtypeHintFor(l);
          // position { x, y, w, h } → CSS grid 좌표 (1-base, 끝은 +1)
          const x = l.position?.x ?? 0;
          const y = l.position?.y ?? 0;
          const w = l.position?.w ?? 12;
          const h = l.position?.h ?? 4;
          const subLabel = l.subtype
            ? l.subtype.replace(/^(CHART_|GRID_|DOC_|AI_|CONTAINER_)/, '').replace(/_/g, ' ')
            : '';
          return (
            <Box
              key={l.key}
              onClick={readOnly ? undefined : () => setEditingLayerKey(l.key)}
              sx={{
                gridColumn: `${x + 1} / ${x + w + 1}`,
                gridRow:    `${y + 1} / ${y + h + 1}`,
                cursor: readOnly ? 'default' : 'pointer',
                position: 'relative',
                overflow: 'hidden',
                /* 1) 진한 좌상 → 흰 우하 gradient (type 색 강조) +
                   2) 우측 큰 radial blob (일러스트 느낌) */
                background: `
                  radial-gradient(circle at 90% 70%, ${accent}2e 0%, transparent 55%),
                  linear-gradient(135deg, ${accent}33 0%, ${accent}12 30%, #ffffff 70%)
                `,
                border: `1px solid ${accent}55`,
                borderLeft: `5px solid ${accent}`,
                borderRadius: 2.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: 2,
                p: 2.5,
                color: '#1e293b',
                transition: 'box-shadow 0.18s ease, transform 0.18s ease, border-color 0.18s ease',
                boxShadow: '0 1px 3px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.7)',
                '&:hover': readOnly ? {} : {
                  boxShadow: `0 10px 24px rgba(15,23,42,0.12), 0 0 0 1.5px ${accent}aa, inset 0 1px 0 rgba(255,255,255,0.7)`,
                  borderColor: `${accent}cc`,
                  transform: 'translateY(-2px)',
                },
              }}
            >
              {/* 큰 type 아이콘 — 둥근 흰 원 안 (왼쪽) */}
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

              {/* 텍스트 영역 */}
              <Box sx={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 0.4, minWidth: 0, zIndex: 1,
              }}>
                <Typography sx={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: '#1e293b',
                  lineHeight: 1.2,
                  letterSpacing: '-0.01em',
                }}>
                  {l.title || l.key}
                </Typography>

                {/* type 칩 + subtype 칩 (작은 라벨) */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7, flexWrap: 'wrap' }}>
                  <Box sx={{
                    px: 0.9, py: 0.15, borderRadius: 0.8,
                    bgcolor: `${accent}26`, color: accent,
                    fontSize: 10, fontWeight: 800, letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                  }}>
                    {l.type}
                  </Box>
                  {subLabel && (
                    <Box sx={{
                      display: 'flex', alignItems: 'center', gap: 0.3,
                      px: 0.7, py: 0.15, borderRadius: 0.8,
                      bgcolor: '#f1f5f9', color: '#475569',
                      fontSize: 10, fontWeight: 600, letterSpacing: '0.04em',
                    }}>
                      {SubHintIcon && <SubHintIcon sx={{ fontSize: 11 }} />}
                      {subLabel}
                    </Box>
                  )}
                </Box>

                <Typography sx={{
                  fontSize: 11,
                  fontWeight: hasData ? 700 : 500,
                  color: hasData ? '#16a34a' : '#94a3b8',
                  lineHeight: 1.3,
                  mt: 0.3,
                }}>
                  {hasData ? '✓ 데이터 설정됨' : '클릭하여 데이터 입력'}
                </Typography>
              </Box>

              {/* 우측 큰 watermark 아이콘 — 일러스트 느낌 (반투명, 배경에 떠 있음) */}
              <Box sx={{
                position: 'absolute',
                right: -8,
                bottom: -16,
                opacity: 0.12,
                pointerEvents: 'none',
                color: accent,
              }}>
                <TypeIcon sx={{ fontSize: 140 }} />
              </Box>
            </Box>
          );
        })}
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
    </Box>
  );
}

export default ComposerCanvas;
