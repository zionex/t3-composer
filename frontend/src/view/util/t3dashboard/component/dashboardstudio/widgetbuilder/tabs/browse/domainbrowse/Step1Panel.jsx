import React from 'react';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PieChartIcon from '@mui/icons-material/PieChart';
import RefreshIcon from '@mui/icons-material/Refresh';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import SpeedIcon from '@mui/icons-material/Speed';
import TableChartIcon from '@mui/icons-material/TableChart';

import { getVisualTypeLabel } from '../../../dialogs/WidgetInfoDialog';
import WidgetThumbnail from '../../../../core/WidgetThumbnail';
import { CategoryTooltipContent } from './DomainBrowseShared';

const TABLE_ROLE_LABELS = {
  FACT:    { label: 'FACT',    friendlyLabel: '핵심 데이터',   color: '#1e40af', bg: '#dbeafe' },
  MASTER:  { label: 'MASTER',  friendlyLabel: '보조 데이터',   color: '#166534', bg: '#dcfce7' },
  VIEW:    { label: 'VIEW',    friendlyLabel: '조회용 데이터', color: '#7c3aed', bg: '#ede9fe' },
  MAPPING: { label: 'MAPPING', friendlyLabel: '연결 데이터',   color: '#9a3412', bg: '#ffedd5' },
  CONFIG:  { label: 'CONFIG',  friendlyLabel: '확인 필요',     color: '#374151', bg: '#f3f4f6' },
  LOG:     { label: 'LOG',     friendlyLabel: '확인 필요',     color: '#6b7280', bg: '#f9fafb' },
  CALENDAR:{ label: 'CAL',     friendlyLabel: '기간 데이터',   color: '#0369a1', bg: '#e0f2fe' },
};

const WIDGET_TYPE_ICONS = {
  bar: BarChartIcon, bar_stacked: BarChartIcon, bar_h: BarChartIcon,
  line: ShowChartIcon, area: ShowChartIcon, bar_line: ShowChartIcon,
  pie: PieChartIcon, doughnut: PieChartIcon,
  table: TableChartIcon,
  kpi: SpeedIcon,
};

function SelectedCategoryTooltipContent({ label, module, description }) {
  return (
    <Box sx={{ maxWidth: 640 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 900, lineHeight: 1.35, color: '#fff' }}>
          {label}
        </Typography>
        {module && (
          <Chip
            size="small"
            label={module}
            sx={{ height: 20, fontSize: 11, fontWeight: 900, bgcolor: '#dbeafe', color: '#1d4ed8' }}
          />
        )}
      </Stack>
      <Divider sx={{ my: 0.75, borderColor: 'rgba(255,255,255,0.24)' }} />
      <Typography sx={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.72)', mb: 0.45 }}>
        설명
      </Typography>
      <Typography sx={{ fontSize: 12.5, lineHeight: 1.65, color: '#fff', whiteSpace: 'normal', wordBreak: 'keep-all' }}>
        {description || '등록된 설명이 없습니다.'}
      </Typography>
    </Box>
  );
}

export default function Step1Panel({
  modulePanelOpen,
  setModulePanelOpen,
  keywordPanelOpen,
  setKeywordPanelOpen,
  dataPanelOpen,
  setDataPanelOpen,
  isAdmin,
  selectedKeyword,
  setSelectedKeyword,
  moduleOptions,
  selectedModule,
  loading,
  error,
  keywords,
  keywordNames,
  keywordDescriptions,
  tables,
  tablesByRole,
  visibleSuggestions,
  canRefreshSuggestions,
  setSuggestionRefreshSeed,
  handleModuleChange,
  handleOpenSuggestedWidgetDetail,
  primaryKeywords,
}) {
  const moduleColWidth = modulePanelOpen ? 104 : 44;
  const keywordColWidth = keywordPanelOpen ? 288 : 44;
  const sidebarWidth = moduleColWidth + keywordColWidth;
  const selectedDescription = keywordDescriptions[selectedKeyword];
  const selectedCategoryLabel = keywordNames?.[selectedKeyword] || selectedKeyword;
  const tableRows = Object.entries(tablesByRole).flatMap(([role, roleTables]) =>
    roleTables.map((table) => ({ role, table })),
  );

  return (
    <Box sx={{ display: 'flex', flex: 1, height: '100%', minHeight: 0, overflow: 'hidden' }}>
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: `${moduleColWidth}px ${keywordColWidth}px`,
        width: sidebarWidth,
        flex: `0 0 ${sidebarWidth}px`,
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
        transition: 'width 160ms ease, flex-basis 160ms ease, grid-template-columns 160ms ease',
      }}>
        {/* Module list */}
        <Box sx={{ borderRight: '1px solid #e5eaf2', overflow: 'hidden', py: modulePanelOpen ? 1 : 0.5, display: 'flex', flexDirection: 'column', bgcolor: 'white' }}>
          {modulePanelOpen ? (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', px: 1, mb: 0.75, minHeight: 32 }}>
                <Typography sx={{ flex: 1, fontSize: 12, fontWeight: 800, color: '#64748b', textAlign: 'center' }}>
                  모듈
                </Typography>
                <Tooltip title="모듈 접기" arrow>
                  <IconButton size="small" onClick={() => setModulePanelOpen(false)}
                    sx={{ width: 28, height: 28, color: '#64748b', '&:hover': { bgcolor: '#eff6ff', color: 'primary.main' } }}>
                    <ChevronLeftIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                {moduleOptions.map((mod) => (
                  <Box key={mod} onClick={() => handleModuleChange(mod)}
                    sx={{
                      px: 1, py: 1, cursor: 'pointer', fontSize: 15,
                      textAlign: 'center',
                      fontWeight: selectedModule === mod ? 900 : 700,
                      color: selectedModule === mod ? 'primary.main' : 'text.primary',
                      bgcolor: selectedModule === mod ? '#eff6ff' : 'transparent',
                      borderRight: selectedModule === mod ? '3px solid' : '3px solid transparent',
                      borderColor: selectedModule === mod ? 'primary.main' : 'transparent',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}>
                    {mod}
                  </Box>
                ))}
              </Box>
            </>
          ) : (
            <Stack direction="column" alignItems="center" justifyContent="center" sx={{ height: '100%', minHeight: '100%' }}>
              <Tooltip title="모듈 펼치기" placement="right" arrow>
                <Typography sx={{ writingMode: 'vertical-rl', fontSize: 12, fontWeight: 900, color: '#64748b', whiteSpace: 'nowrap', mb: 1, cursor: 'default' }}>
                  모듈
                </Typography>
              </Tooltip>
              <IconButton size="small" onClick={() => setModulePanelOpen(true)}
                sx={{ width: 28, height: 28, color: '#64748b', '&:hover': { bgcolor: '#eff6ff', color: 'primary.main' } }}>
                <ChevronRightIcon fontSize="small" />
              </IconButton>
            </Stack>
          )}
        </Box>

        {/* Keyword list */}
        <Box sx={{ borderRight: '1px solid #e5eaf2', overflow: 'hidden', py: keywordPanelOpen ? 1 : 0.5, display: 'flex', flexDirection: 'column', bgcolor: 'white' }}>
          {keywordPanelOpen ? (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', px: 1.5, mb: 0.75, minHeight: 32 }}>
                <Typography sx={{ flex: 1, fontSize: 12, fontWeight: 800, color: '#64748b' }}>
                  카테고리
                </Typography>
                <Tooltip title="카테고리 접기" arrow>
                  <IconButton size="small" onClick={() => setKeywordPanelOpen(false)}
                    sx={{ width: 28, height: 28, color: '#64748b', '&:hover': { bgcolor: '#eff6ff', color: 'primary.main' } }}>
                    <ChevronLeftIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                {keywords.length === 0 && (
                  <Typography sx={{ px: 1.5, color: 'text.disabled', fontSize: 13 }}>
                    {loading ? '불러오는 중...' : '카테고리 없음'}
                  </Typography>
                )}
                {keywords.map((kw) => {
                  const desc = keywordDescriptions[kw];
                  const label = keywordNames?.[kw] || kw;
                  return (
                    <Tooltip
                      key={kw}
                      title={<CategoryTooltipContent label={label} description={desc} />}
                      placement="right"
                      arrow
                    >
                      <Box onClick={() => setSelectedKeyword(kw)}
                        sx={{
                          px: 1.5, py: 0.85, cursor: 'pointer',
                          bgcolor: selectedKeyword === kw ? '#eff6ff' : 'transparent',
                          borderRight: selectedKeyword === kw ? '3px solid' : '3px solid transparent',
                          borderColor: selectedKeyword === kw ? 'primary.main' : 'transparent',
                          '&:hover': { bgcolor: 'action.hover' },
                        }}>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <Typography sx={{
                            flex: 1, minWidth: 0,
                            fontSize: 14, lineHeight: 1.35,
                            fontWeight: selectedKeyword === kw ? 900 : 700,
                            color: selectedKeyword === kw ? 'primary.main' : 'text.primary',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {label}
                          </Typography>
                          {primaryKeywords?.has(kw) && (
                            <Chip size="small" label="주요"
                              sx={{ height: 16, fontSize: 10, fontWeight: 800, bgcolor: '#fef3c7', color: '#92400e', flexShrink: 0, '& .MuiChip-label': { px: 0.75 } }} />
                          )}
                        </Stack>
                        {desc && (
                          <Typography sx={{
                            fontSize: 12, color: '#64748b', lineHeight: 1.35, mt: 0.15,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {desc}
                          </Typography>
                        )}
                      </Box>
                    </Tooltip>
                  );
                })}
              </Box>
            </>
          ) : (
            <Stack
              direction="column"
              alignItems="center"
              justifyContent="center"
              sx={{ height: '100%', minHeight: '100%' }}
            >
              <Tooltip title="카테고리 펼치기" placement="right" arrow>
                <Typography
                  sx={{
                    writingMode: 'vertical-rl',
                    fontSize: 12,
                    fontWeight: 900,
                    color: '#64748b',
                    whiteSpace: 'nowrap',
                    mb: 1,
                    cursor: 'default',
                  }}
                >
                  카테고리
                </Typography>
              </Tooltip>
              <IconButton
                size="small"
                onClick={() => setKeywordPanelOpen(true)}
                sx={{ width: 28, height: 28, color: '#64748b', '&:hover': { bgcolor: '#eff6ff', color: 'primary.main' } }}
              >
                <ChevronRightIcon fontSize="small" />
              </IconButton>
            </Stack>
          )}
        </Box>
      </Box>

      {/* Right panel */}
      <Box sx={{ flex: '1 1 0%', height: '100%', minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ flex: 1, height: '100%', minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress size={28} />
          </Box>
        ) : error ? (
          <Box sx={{ p: 2 }}><Alert severity="error">{error}</Alert></Box>
        ) : !selectedKeyword ? (
          <Box sx={{ flex: 1, height: '100%', minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
            <Typography sx={{ fontSize: 18, fontWeight: 800, color: '#94a3b8', textAlign: 'center', lineHeight: 1.6 }}>
              카테고리를 선택하세요.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ flex: 1, height: '100%', minHeight: 0, overflow: 'hidden', p: 1.5, display: 'flex', flexDirection: 'column' }}>
            <Box
              sx={{
                px: 1.75,
                py: 1.25,
                mb: 1,
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                bgcolor: '#f0f7ff',
                flexShrink: 0,
              }}
            >
              <Tooltip
                arrow
                placement="bottom-start"
                enterDelay={250}
                title={(
                  <SelectedCategoryTooltipContent
                    label={selectedCategoryLabel}
                    module={selectedModule}
                    description={selectedDescription}
                  />
                )}
                componentsProps={{
                  tooltip: {
                    sx: {
                      bgcolor: '#0f172a',
                      borderRadius: '8px',
                      p: 1.25,
                      boxShadow: '0 14px 32px rgba(15, 23, 42, 0.28)',
                      maxWidth: 680,
                    },
                  },
                  arrow: { sx: { color: '#0f172a' } },
                }}
              >
                <Box sx={{ minWidth: 0, cursor: 'help' }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: selectedDescription ? 0.5 : 0, minWidth: 0 }}>
                    <Typography sx={{ fontSize: 20, lineHeight: 1.2, fontWeight: 900, color: '#0f172a', minWidth: 0 }} noWrap>
                      {selectedCategoryLabel}
                    </Typography>
                    <Chip size="small" label={selectedModule}
                      sx={{ height: 24, fontSize: 12, fontWeight: 800, bgcolor: '#dbeafe', color: '#1d4ed8', flexShrink: 0 }} />
                  </Stack>
                  {selectedDescription && (
                    <Typography
                      sx={{
                        fontSize: 14,
                        color: '#475569',
                        lineHeight: 1.4,
                        maxWidth: 1120,
                        display: '-webkit-box',
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {selectedDescription}
                    </Typography>
                  )}
                </Box>
              </Tooltip>
            </Box>

            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  lg: isAdmin
                    ? (dataPanelOpen ? 'minmax(0, 1fr) minmax(260px, 0.5fr)' : 'minmax(0, 1fr) 44px')
                    : '1fr',
                },
                gridTemplateRows: {
                  xs: isAdmin
                    ? (dataPanelOpen ? 'minmax(0, 1fr) minmax(0, 1fr)' : 'minmax(0, 1fr) 44px')
                    : 'minmax(0, 1fr)',
                  lg: 'minmax(0, 1fr)',
                },
                gap: 1,
                transition: 'grid-template-columns 160ms ease, grid-template-rows 160ms ease',
              }}
            >
              <Box sx={{ p: 1.25, border: '1px solid #e5eaf2', borderRadius: '8px', bgcolor: 'white', minWidth: 0, height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ mb: 1.25 }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: 15, fontWeight: 800, color: '#1e293b' }}>
                      위젯 예시
                    </Typography>
                  </Stack>
                  <Tooltip title={canRefreshSuggestions ? '다른 위젯 예시 보기' : '추가 예시 없음'} arrow>
                    <span>
                      <IconButton
                        size="small"
                        disabled={!canRefreshSuggestions}
                        onClick={() => setSuggestionRefreshSeed((seed) => seed + 1)}
                        sx={{ width: 28, height: 28, color: '#2563eb' }}
                      >
                        <RefreshIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>
                {visibleSuggestions.length === 0 ? (
                  <Box sx={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography sx={{ fontSize: 14, color: '#94a3b8' }}>추천 가능한 예시가 없습니다.</Typography>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      flex: 1,
                      minHeight: 0,
                      overflow: 'auto',
                      pr: 0.5,
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                      gridAutoRows: 'minmax(150px, max-content)',
                      gap: 1,
                      alignContent: 'start',
                    }}
                  >
                    {visibleSuggestions.map((s) => {
                        const ChartIcon = WIDGET_TYPE_ICONS[s.type] || BarChartIcon;
                        const typeLabel = getVisualTypeLabel(s.type) || s.type;
                        return (
                          <Box
                            key={`${s.id}-${s.tableName}`}
                            role="button"
                            tabIndex={0}
                            onClick={() => handleOpenSuggestedWidgetDetail(s)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleOpenSuggestedWidgetDetail(s);
                              }
                            }}
                            sx={{
                              minHeight: 150,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 0.75,
                              p: 1,
                              border: '1px solid #e5eaf2',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              bgcolor: '#fff',
                              '&:hover': { bgcolor: '#f8fbff', borderColor: '#93c5fd' },
                              '&:focus-visible': { outline: '2px solid #60a5fa', outlineOffset: 1 },
                            }}
                          >
                            <WidgetThumbnail type={s.type} height={70} scale={1.25} marginBottom={0} showTypeLabel={false} />
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Stack direction="row" alignItems="center" spacing={0.75} sx={{ minWidth: 0 }}>
                                <ChartIcon sx={{ fontSize: 18, color: '#2563eb', flexShrink: 0 }} />
                                <Tooltip title={s.name || ''} arrow>
                                  <Typography sx={{ fontSize: 13, lineHeight: 1.25, fontWeight: 900, color: '#1e293b', minWidth: 0 }} noWrap>
                                    {s.name}
                                  </Typography>
                                </Tooltip>
                              </Stack>
                              <Tooltip title={s.tableName || ''} arrow>
                                <Typography sx={{ mt: 0.35, fontSize: 11, fontWeight: 700, color: '#94a3b8' }} noWrap>
                                  {s.tableName}
                                </Typography>
                              </Tooltip>
                            </Box>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                              <Chip size="small" label={typeLabel}
                                sx={{ height: 20, fontSize: 10, fontWeight: 800, bgcolor: '#eff6ff', color: '#2563eb' }} />
                              <Typography sx={{ fontSize: 11, fontWeight: 800, color: '#2563eb' }}>
                                상세 보기
                              </Typography>
                            </Stack>
                          </Box>
                        );
                      })}
                  </Box>
                )}
              </Box>

              {isAdmin && <Box sx={{
                p: dataPanelOpen ? 1.25 : 0.5,
                border: '1px solid #e5eaf2',
                borderRadius: '8px',
                bgcolor: 'white',
                minWidth: 0,
                height: '100%',
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}>
                <Stack
                  direction={dataPanelOpen ? 'row' : { xs: 'row', lg: 'column' }}
                  alignItems="center"
                  justifyContent={dataPanelOpen ? 'space-between' : 'center'}
                  spacing={0.5}
                  sx={{ mb: dataPanelOpen ? 1.25 : 0, minHeight: dataPanelOpen ? 24 : '100%' }}
                >
                  {dataPanelOpen ? (
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontSize: 15, fontWeight: 800, color: '#1e293b' }}>
                        사용 데이터
                      </Typography>
                      <Chip
                        size="small"
                        label={`${tables.length}개`}
                        sx={{ height: 22, fontSize: 12, fontWeight: 800, bgcolor: '#eff6ff', color: '#2563eb' }}
                      />
                    </Stack>
                  ) : (
                    <Tooltip title="사용 데이터 펼치기" placement="left" arrow>
                      <Typography
                        sx={{
                          display: { xs: 'none', lg: 'block' },
                          writingMode: 'vertical-rl',
                          fontSize: 12,
                          fontWeight: 900,
                          color: '#64748b',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        사용 데이터
                      </Typography>
                    </Tooltip>
                  )}
                  <Tooltip title={dataPanelOpen ? '사용 데이터 접기' : '사용 데이터 펼치기'} arrow>
                    <IconButton
                      size="small"
                      onClick={() => setDataPanelOpen((open) => !open)}
                      sx={{ width: 28, height: 28, color: '#64748b', '&:hover': { bgcolor: '#eff6ff', color: 'primary.main' } }}
                    >
                      {dataPanelOpen ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                </Stack>
                {dataPanelOpen && (
                  tables.length === 0 ? (
                    <Typography sx={{ fontSize: 14, color: '#94a3b8' }}>연결된 테이블이 없습니다.</Typography>
                  ) : (
                    <Stack spacing={0.75} sx={{ flex: 1, minHeight: 0, overflow: 'auto', pr: 0.5 }}>
                      {tableRows.map(({ role, table }) => {
                        const roleInfo = TABLE_ROLE_LABELS[role] || { label: role, color: '#374151', bg: '#f3f4f6' };
                        return (
                          <Box
                            key={`${role}-${table.name}`}
                            sx={{
                              display: 'grid',
                              gridTemplateColumns: '96px minmax(0, 1fr)',
                              gap: 1,
                              alignItems: 'center',
                              py: 0.75,
                              borderBottom: '1px solid #f1f5f9',
                              minHeight: 58,
                            }}
                          >
                            <Chip size="small" label={roleInfo.friendlyLabel || roleInfo.label}
                              sx={{ height: 24, fontSize: 11, fontWeight: 800, bgcolor: roleInfo.bg, color: roleInfo.color }} />
                            <Box sx={{ minWidth: 0 }}>
                              <Stack direction="row" alignItems="center" spacing={0.75} sx={{ minWidth: 0 }}>
                                <Typography sx={{ fontSize: 14, fontWeight: 800, color: '#1e293b', minWidth: 0 }} noWrap>
                                  {table.name}
                                </Typography>
                                {typeof table.confidence === 'number' && (
                                  <Tooltip title={table.rationale || `LLM 분류 신뢰도 ${(table.confidence * 100).toFixed(0)}%`} arrow>
                                    <Chip size="small" label={`${(table.confidence * 100).toFixed(0)}%`}
                                      sx={{
                                        height: 18, fontSize: 10, fontWeight: 800, flexShrink: 0,
                                        bgcolor: table.confidence >= 0.8 ? '#dcfce7' : table.confidence >= 0.6 ? '#fef3c7' : '#fee2e2',
                                        color: table.confidence >= 0.8 ? '#166534' : table.confidence >= 0.6 ? '#92400e' : '#991b1b',
                                        '& .MuiChip-label': { px: 0.75 },
                                      }} />
                                  </Tooltip>
                                )}
                              </Stack>
                              <Typography sx={{ fontSize: 13, color: '#64748b' }} noWrap>
                                {table.description || '-'}
                              </Typography>
                            </Box>
                          </Box>
                        );
                      })}
                    </Stack>
                  )
                )}
              </Box>}

            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}
