import React from 'react';
import {
  Box, Card, CardContent, Chip, Grid, Stack, Typography,
} from '@mui/material';
import StorageIcon from '@mui/icons-material/Storage';
import CodeIcon from '@mui/icons-material/Code';

import dashboardConfig from '../../../core/dashboardConfig';
import { MODULE_LIST } from './steps/wizardConstants';
import DirectConfigWizard from './DirectConfigWizard';
import SqlDirectWizard from './SqlDirectWizard';

export function createEmptyWidget() {
  return {
    key: `direct_${Date.now()}`,
    title: '',
    module: MODULE_LIST[0],
    widgetOptions: {
      dataSourceMode: 'MULTIPLE',
      dataSources: [],
      parameterMappings: [],
      columnMappings: {},
      mergeConfig: { enabled: false, type: dashboardConfig.defaultMergeType, conditions: [] },
      visualConfigs: {},
    },
  };
}

const CREATION_MODE_OPTIONS = [
  {
    key: 'source',
    icon: <StorageIcon sx={{ fontSize: 28, color: '#3b82f6' }} />,
    title: '소스 선택',
    description: '등록된 VIEW/TABLE 데이터 소스를 선택한 뒤 테스트 실행, 데이터 매핑, 시각화 설정을 거쳐 위젯을 생성합니다.',
    accent: '#3b82f6',
    steps: ['소스 & 기본 정보', '테스트 실행', '데이터/파라미터 매핑', '시각화', '최종 확인'],
  },
  {
    key: 'sql',
    icon: <CodeIcon sx={{ fontSize: 28, color: '#8b5cf6' }} />,
    title: 'SQL 작성',
    description: 'SQL을 직접 작성하고 실행 결과를 기준으로 데이터 매핑과 시각화 설정을 진행합니다.',
    accent: '#8b5cf6',
    steps: ['SQL 작성 및 데이터 설정', '시각화', '최종 확인'],
  },
];

function CreationModeSelector({ onSelect }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        p: 4,
        transform: 'translateY(-36px)',
      }}
    >
      <Typography variant="h6" fontWeight={800} sx={{ mb: 0.75, color: '#1e293b' }}>
        생성 방식 선택
      </Typography>
      <Grid container spacing={3} sx={{ maxWidth: 800 }}>
        {CREATION_MODE_OPTIONS.map((opt) => (
          <Grid item xs={12} md={6} key={opt.key}>
            <Card
              variant="outlined"
              onClick={() => onSelect(opt.key)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(opt.key);
                }
              }}
              sx={{
                cursor: 'pointer',
                height: '100%',
                borderWidth: 2,
                borderColor: '#e5eaf2',
                borderRadius: '12px',
                transition: 'all 0.18s ease',
                '&:hover': {
                  borderColor: opt.accent,
                  boxShadow: `0 6px 24px ${opt.accent}28`,
                  transform: 'translateY(-3px)',
                },
                '&:focus-visible': {
                  outline: `2px solid ${opt.accent}`,
                  outlineOffset: 2,
                },
              }}
            >
              <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', height: '100%' }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.25 }}>
                  {opt.icon}
                  <Typography variant="subtitle1" fontWeight={800} sx={{ color: '#1e293b' }}>
                    {opt.title}
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, lineHeight: 1.65 }}>
                  {opt.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default function DirectCreateTab({
  open,
  mode,
  widget,
  onModeChange,
  onWidgetChange,
  onFinish,
}) {
  if (mode === null) {
    return <CreationModeSelector onSelect={onModeChange} />;
  }

  if (mode === 'source') {
    return (
      <DirectConfigWizard
        key={widget.key}
        widget={widget}
        onChange={onWidgetChange}
        allModules={MODULE_LIST}
        skipSourceStep={false}
        finishButtonLabel="라이브러리에 저장"
        onFinish={onFinish}
        onBack={() => onModeChange(null)}
        backLabel="생성 방식 변경"
      />
    );
  }

  return (
    <SqlDirectWizard
      key={`sql_direct_${open}`}
      allModules={MODULE_LIST}
      finishButtonLabel="라이브러리에 저장"
      onFinish={onFinish}
      onBack={() => onModeChange(null)}
    />
  );
}
