import React from 'react';
import {
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import FilterListIcon from '@mui/icons-material/FilterList';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PreviewIcon from '@mui/icons-material/Preview';
import SchemaIcon from '@mui/icons-material/Schema';
import StorageIcon from '@mui/icons-material/Storage';
import TuneIcon from '@mui/icons-material/Tune';

import { FIELD_SX, Section, SmallCountChip } from './WidgetEditShared';
import {
  DataPreviewTable,
  ParameterAccordion,
  DataSourceList,
  MergeSettings,
  TableConditionSection,
} from './DataComponents';
import { MODULE_LIST, moduleColor, getVisualTargetTitle } from '../direct/steps/wizardConstants';

export default function DataSettingsTab({
  title,
  setTitle,
  module,
  setModule,
  dataSources,
  parameterMappings,
  setParameterMappings,
  mergeType,
  setMergeType,
  relationships,
  setRelationships,
  tableSources,
  tableColumnsById,
  tableLoadingById,
  columnsBySource,
  isMerged,
  visualTargets,
  safeVisualTab,
  setVisualTab,
  visualConfigs,
  activePreviewData,
  activePreviewColumns,
  activePreviewResult,
  activeVisualTarget,
  handleRunPreview,
  patchDataSource,
}) {
  return (
    <Stack spacing={1.5}>
      <Section
        icon={<EditIcon sx={{ width: 15, height: 15, color: '#ea580c' }} />}
        title="기본 정보"
      >
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 180px' }, gap: 1.25 }}>
          <TextField
            label="위젯 제목"
            size="small"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            sx={FIELD_SX}
          />
          <TextField
            select
            label="모듈"
            size="small"
            value={module}
            onChange={(event) => setModule(event.target.value)}
            sx={FIELD_SX}
          >
            {MODULE_LIST.map((item) => (
              <MenuItem key={item} value={item} sx={{ fontSize: 12 }}>
                <Stack direction="row" alignItems="center" spacing={0.75}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: moduleColor(item), flexShrink: 0 }} />
                  <span>{item}</span>
                </Stack>
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </Section>

      <Section
        icon={<StorageIcon sx={{ width: 15, height: 15, color: '#059669' }} />}
        title="데이터 소스"
        right={<SmallCountChip label={dataSources.length + '개'} />}
      >
        <DataSourceList dataSources={dataSources} />
      </Section>

      <Section
        icon={<PreviewIcon sx={{ width: 15, height: 15, color: '#059669' }} />}
        title="데이터 미리보기"
        right={
          <Stack direction="row" spacing={0.75} alignItems="center">
            <SmallCountChip label={activePreviewData.length + ' rows'} color="#059669" />
            <Button
              size="small"
              variant="outlined"
              startIcon={activePreviewResult?.loading ? <CircularProgress size={12} /> : <PlayArrowIcon sx={{ width: 14, height: 14 }} />}
              disabled={!activeVisualTarget || !!activePreviewResult?.loading}
              onClick={() => handleRunPreview(activeVisualTarget)}
              sx={{ height: 26, fontSize: 11, fontWeight: 800, textTransform: 'none', borderRadius: '6px' }}
            >
              {activePreviewResult?.loading ? '조회 중...' : '미리보기'}
            </Button>
          </Stack>
        }
      >
        <Stack spacing={1}>
          {visualTargets.length > 1 && (
            <Tabs
              value={safeVisualTab}
              onChange={(_, value) => setVisualTab(value)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                minHeight: 32,
                '& .MuiTab-root': { minHeight: 32, fontSize: 11, fontWeight: 800, textTransform: 'none' },
              }}
            >
              {visualTargets.map((target) => (
                <Tab key={target.id} label={getVisualTargetTitle(target, visualConfigs)} />
              ))}
            </Tabs>
          )}
          {activePreviewResult?.error && (
            <Box sx={{ border: '1px solid #fecaca', borderRadius: '8px', bgcolor: '#fef2f2', p: 1 }}>
              <Typography sx={{ fontSize: 12, color: '#dc2626' }}>{activePreviewResult.error}</Typography>
            </Box>
          )}
          <DataPreviewTable columns={activePreviewColumns} rows={activePreviewData} />
        </Stack>
      </Section>

      {isMerged && (
        <Section
          icon={<SchemaIcon sx={{ width: 15, height: 15, color: '#7c3aed' }} />}
          title="병합 설정"
        >
          <MergeSettings
            dataSources={dataSources}
            mergeType={mergeType}
            onMergeTypeChange={setMergeType}
            relationships={relationships}
            onRelationshipsChange={setRelationships}
            columnsBySource={columnsBySource}
          />
        </Section>
      )}

      <Section
        icon={<TuneIcon sx={{ width: 15, height: 15, color: '#475569' }} />}
        title="파라미터"
        right={<SmallCountChip label={parameterMappings.length + '개'} />}
      >
        <ParameterAccordion
          dataSources={dataSources}
          parameterMappings={parameterMappings}
          onChange={setParameterMappings}
        />
      </Section>

      <Section
        icon={<FilterListIcon sx={{ width: 15, height: 15, color: '#0891b2' }} />}
        title="테이블 조건"
        right={<SmallCountChip label={tableSources.length + '개'} color="#0891b2" />}
      >
        <TableConditionSection
          tableSources={tableSources}
          columnsBySource={columnsBySource}
          loadingBySource={tableLoadingById}
          onPatch={patchDataSource}
        />
      </Section>
    </Stack>
  );
}
