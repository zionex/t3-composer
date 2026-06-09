import React from 'react';
import {
  Alert,
  Box,
  Chip,
  Divider,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import { ColCheckItem, Step2SummaryPanel } from './DomainBrowseShared';
import { groupMeasures } from './domainBrowseUtils';

export default function Step2Panel({
  hasMeasures,
  measures,
  virtualMeasures,
  dimGroups,
  dimensions,
  allMeasureDisplayItems,
  allDimDisplayItems,
  selectedMetrics,
  setSelectedMetrics,
  selectedDimensions,
  step2Tab,
  setStep2Tab,
  step2AdvancedOpen,
  setStep2AdvancedOpen,
  step2RawColsOpen,
  setStep2RawColsOpen,
  chartType,
  handleSelectRecommendedChart,
  toggleSet,
  handleDimToggle,
}) {
  const measureGroups = hasMeasures ? groupMeasures(measures) : [];

  function renderGroupHeader(label) {
    return (
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 2, mb: 0.75 }}>
        <Typography sx={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', flexShrink: 0 }}>
          {label}
        </Typography>
        <Divider sx={{ flex: 1 }} />
      </Stack>
    );
  }

  function renderDimGroup(group) {
    if (group.isAdvanced) {
      return (
        <Box key={group.groupLabel}>
          {renderGroupHeader(group.groupLabel)}
          <Box
            onClick={() => setStep2AdvancedOpen((o) => !o)}
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', py: 0.5 }}
          >
            <ChevronRightIcon sx={{
              fontSize: 14, color: '#94a3b8',
              transform: step2AdvancedOpen ? 'rotate(90deg)' : 'none',
              transition: 'transform 0.2s',
            }} />
            <Typography sx={{ fontSize: 12, color: '#94a3b8', fontWeight: 700 }}>
              {step2AdvancedOpen ? '접기' : `${group.cols.length}개 항목 펼치기`}
            </Typography>
          </Box>
          {step2AdvancedOpen && (
            <Stack spacing={0.75} sx={{ mt: 0.5 }}>
              {group.cols.map((col) => (
                <ColCheckItem key={col.name} col={col}
                  selected={selectedDimensions.has(col.name)}
                  onToggle={() => handleDimToggle(col)} />
              ))}
            </Stack>
          )}
        </Box>
      );
    }
    return (
      <Box key={group.groupLabel}>
        {renderGroupHeader(group.groupLabel)}
        <Stack spacing={0.75}>
          {group.cols.map((col) => (
            <ColCheckItem key={col.name} col={col}
              selected={selectedDimensions.has(col.name) || (col.isMerged && selectedDimensions.has(col.pairedName))}
              onToggle={() => handleDimToggle(col)} />
          ))}
        </Stack>
      </Box>
    );
  }

  function renderMeasureTab() {
    if (!hasMeasures) {
      return (
        <>
          <Alert severity="info" sx={{ mb: 2 }}>
            이 카테고리에는 수치 컬럼이 없습니다. 건수 기반 지표를 선택해 위젯을 만들 수 있습니다.
          </Alert>
          <Stack spacing={0.75}>
            {virtualMeasures.map((vm) => (
              <ColCheckItem key={vm.name} col={vm} badge="추천"
                selected={selectedMetrics.has(vm.name)}
                onToggle={(name) => toggleSet(setSelectedMetrics, name)} />
            ))}
          </Stack>
        </>
      );
    }
    return (
      <>
        {measureGroups.map((group) => (
          <Box key={group.groupLabel}>
            {renderGroupHeader(group.groupLabel)}
            <Stack spacing={0.75}>
              {group.cols.map((col) => (
                <ColCheckItem key={col.name} col={col}
                  selected={selectedMetrics.has(col.name)}
                  onToggle={(name) => toggleSet(setSelectedMetrics, name)} />
              ))}
            </Stack>
          </Box>
        ))}
      </>
    );
  }

  function renderDimensionTab() {
    if (dimensions.length === 0) {
      return <Typography sx={{ fontSize: 14, color: '#94a3b8', px: 1.5 }}>없음</Typography>;
    }
    return dimGroups.map((g) => renderDimGroup(g));
  }

  const renderTabLabel = (label, count) => (
    <Stack direction="row" alignItems="center" spacing={0.75}>
      <span>{label}</span>
      <Chip
        size="small"
        label={`${count}개 선택`}
        sx={{
          height: 20,
          fontSize: 11,
          fontWeight: 700,
          bgcolor: count > 0 ? '#eff6ff' : '#f1f5f9',
          color: count > 0 ? '#2563eb' : '#94a3b8',
        }}
      />
    </Stack>
  );

  return (
    <Box sx={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      {/* Left: main content */}
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Tabs
          value={step2Tab}
          onChange={(_, v) => setStep2Tab(v)}
          sx={{
            borderBottom: '1px solid #e5eaf2',
            px: 2.5,
            pt: 1,
            gap: 1,
            flexShrink: 0,
            minHeight: 52,
            bgcolor: '#f8fafc',
            '& .MuiTabs-flexContainer': { gap: 1 },
            '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0' },
          }}
        >
          <Tab
            value="measure"
            label={renderTabLabel('지표 (MEASURE)', selectedMetrics.size)}
            sx={{
              textTransform: 'none',
              fontSize: 13,
              fontWeight: 800,
              minHeight: 40,
              px: 2,
              borderRadius: '8px 8px 0 0',
              bgcolor: '#eef2f7',
              color: '#475569',
              '&.Mui-selected': {
                bgcolor: '#e0f2fe',
                color: '#0284c7',
              },
            }}
          />
          <Tab
            value="dimension"
            label={renderTabLabel('기준 (DIMENSION)', selectedDimensions.size)}
            sx={{
              textTransform: 'none',
              fontSize: 13,
              fontWeight: 800,
              minHeight: 40,
              px: 2,
              borderRadius: '8px 8px 0 0',
              bgcolor: '#eef2f7',
              color: '#475569',
              '&.Mui-selected': {
                bgcolor: '#e0f2fe',
                color: '#0284c7',
              },
            }}
          />
        </Tabs>
        <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', p: 2.5 }}>
          {step2Tab === 'measure' ? renderMeasureTab() : renderDimensionTab()}
        </Box>
      </Box>

      {/* Right: summary panel */}
      <Box sx={{ width: 272, flexShrink: 0, borderLeft: '1px solid #e5eaf2', overflowY: 'auto', p: 2, bgcolor: '#fafafa' }}>
        <Step2SummaryPanel
          selectedMetrics={selectedMetrics}
          selectedDimensions={selectedDimensions}
          allMeasureDisplayItems={allMeasureDisplayItems}
          allDimDisplayItems={allDimDisplayItems}
          rawColsOpen={step2RawColsOpen}
          onRawColsToggle={() => setStep2RawColsOpen((o) => !o)}
          selectedChartType={chartType}
          onSelectChart={handleSelectRecommendedChart}
        />
      </Box>
    </Box>
  );
}
