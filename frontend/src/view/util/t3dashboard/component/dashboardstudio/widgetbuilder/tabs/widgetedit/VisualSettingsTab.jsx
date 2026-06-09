import React from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PreviewIcon from '@mui/icons-material/Preview';
import TuneIcon from '@mui/icons-material/Tune';

import { FIELD_SX, Section, SmallCountChip } from './WidgetEditShared';
import { PreviewWidget, VisualMapping } from './VisualComponents';
import {
  ChartTypePicker,
  DEFAULT_PALETTE,
  PalettePicker,
} from '../../../dashboardbuilder/dialogs/WidgetSettingsDialog';
import { getVisualTargetTitle } from '../direct/steps/wizardConstants';

export default function VisualSettingsTab({
  visualTargets,
  safeVisualTab,
  setVisualTab,
  visualConfigs,
  activeVisualTarget,
  activeVisualId,
  activeVisualConfig,
  activeVisualType,
  activeVisualColumns,
  activeValueColumns,
  activePreviewConfig,
  activePreviewData,
  activePreviewResult,
  handleRunPreview,
  handleVisualTypeChange,
  handlePaletteChange,
  updateVisualConfig,
}) {
  return (
    <Stack spacing={1.5}>
      {visualTargets.length > 1 && (
        <Box sx={{ border: '1px solid #e5eaf2', borderRadius: '8px', overflow: 'hidden', bgcolor: '#fff' }}>
          <Tabs
            value={safeVisualTab}
            onChange={(_, value) => setVisualTab(value)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 38,
              bgcolor: '#f8fafc',
              '& .MuiTab-root': { minHeight: 38, fontSize: 12, fontWeight: 800, textTransform: 'none' },
            }}
          >
            {visualTargets.map((target) => (
              <Tab key={target.id} label={getVisualTargetTitle(target, visualConfigs)} />
            ))}
          </Tabs>
        </Box>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) minmax(360px, 34%)' },
          gap: 1.5,
          alignItems: 'start',
        }}
      >
        <Stack spacing={1.5} sx={{ minWidth: 0 }}>
          <Section
            icon={<BarChartIcon sx={{ width: 15, height: 15, color: '#2563eb' }} />}
            title="시각화 설정"
          >
            <Stack spacing={1.5}>
              <TextField
                size="small"
                label="위젯명"
                value={getVisualTargetTitle(activeVisualTarget, visualConfigs)}
                onChange={(event) => updateVisualConfig(activeVisualId, { ...activeVisualConfig, widgetTitle: event.target.value })}
                sx={FIELD_SX}
              />

              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 800, color: '#475569', mb: 0.75 }}>모양</Typography>
                <ChartTypePicker
                  value={activeVisualType}
                  palette={activeVisualConfig.palette ?? DEFAULT_PALETTE}
                  onChange={handleVisualTypeChange}
                  compact
                />
              </Box>

              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 800, color: '#475569', mb: 0.75 }}>색상</Typography>
                <PalettePicker
                  value={activeVisualConfig.palette ?? DEFAULT_PALETTE}
                  onChange={handlePaletteChange}
                  compact
                />
              </Box>
            </Stack>
          </Section>

          <Section
            icon={<TuneIcon sx={{ width: 15, height: 15, color: '#0284c7' }} />}
            title="컬럼 매핑"
            right={<SmallCountChip label={activeVisualColumns.length + ' columns'} />}
          >
            <VisualMapping
              vc={activeVisualConfig}
              columns={activeVisualColumns}
              valueColumns={activeValueColumns}
              onChange={(nextConfig) => updateVisualConfig(activeVisualId, nextConfig)}
            />
          </Section>
        </Stack>

        <Box sx={{ position: { lg: 'sticky' }, top: { lg: 12 } }}>
          <Section
            icon={<PreviewIcon sx={{ width: 15, height: 15, color: '#059669' }} />}
            title="시각화 미리보기"
            right={
              <Stack direction="row" spacing={0.75} alignItems="center">
                <SmallCountChip label={activePreviewData.length + ' rows'} color="#059669" />
                <Button
                  size="small"
                  variant="contained"
                  startIcon={activePreviewResult?.loading ? <CircularProgress size={12} color="inherit" /> : <PlayArrowIcon sx={{ width: 14, height: 14 }} />}
                  disabled={!activeVisualTarget || !!activePreviewResult?.loading}
                  onClick={() => handleRunPreview(activeVisualTarget)}
                  sx={{ height: 26, fontSize: 11, fontWeight: 800, textTransform: 'none', borderRadius: '6px' }}
                >
                  {activePreviewResult?.loading ? '조회 중...' : '미리보기'}
                </Button>
              </Stack>
            }
          >
            {activePreviewResult?.error && (
              <Box sx={{ mb: 1, border: '1px solid #fecaca', borderRadius: '8px', bgcolor: '#fef2f2', p: 1 }}>
                <Typography sx={{ fontSize: 12, color: '#dc2626' }}>{activePreviewResult.error}</Typography>
              </Box>
            )}
            <Box
              sx={{
                height: { xs: activeVisualType === 'table' ? 280 : 240, lg: 'calc(100vh - 390px)' },
                minHeight: { xs: activeVisualType === 'table' ? 260 : 220, lg: 360 },
                maxHeight: { lg: 520 },
                border: '1px solid #e5eaf2',
                borderRadius: '8px',
                bgcolor: '#fbfcfe',
                overflow: 'hidden',
                p: 1,
              }}
            >
              {activePreviewData.length > 0 ? (
                <PreviewWidget visualConfig={activePreviewConfig} data={activePreviewData} />
              ) : (
                <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography sx={{ fontSize: 12, color: '#94a3b8' }}>미리보기 데이터가 없습니다.</Typography>
                </Box>
              )}
            </Box>
          </Section>
        </Box>
      </Box>
    </Stack>
  );
}
