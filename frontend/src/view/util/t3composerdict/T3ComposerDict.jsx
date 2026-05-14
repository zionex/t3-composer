import React, { useState } from 'react';

import {
  Box,
  Typography,
  Stack,
  Paper,
  Avatar,
} from '@mui/material';
import TableChartIcon from '@mui/icons-material/TableChart';
import BarChartIcon from '@mui/icons-material/BarChart';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import MenuBookIcon from '@mui/icons-material/MenuBook';

import { ContentInner, WorkArea } from '@wingui/common/imports';

import GridTypeTab  from './GridTypeTab';
import ChartTypeTab from './ChartTypeTab';
import KpiDictTab   from './KpiDictTab';

const TAB_META = [
  { label: 'Grid 갤러리',   sub: 'RealGrid2 · TreeGrid · Pivot',  icon: <TableChartIcon sx={{ fontSize: 20 }} />, color: '#059669' },
  { label: 'Chart 갤러리',  sub: 'Chart.js 60+ 변형',             icon: <BarChartIcon   sx={{ fontSize: 20 }} />, color: '#0ea5e9' },
  { label: 'KPI 갤러리',    sub: 'S&OP + SCM 모듈별 152 KPI',      icon: <AutoGraphIcon  sx={{ fontSize: 20 }} />, color: '#8b5cf6' },
];

function T3ComposerDict() {
  const [tab, setTab] = useState(0);

  return (
    <ContentInner>
      <WorkArea>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0,
                   bgcolor: '#eef2f7', p: 1.2, gap: 1.2 }}>

          {/* Top Hero */}
          <Paper elevation={0} sx={{
            p: 2, borderRadius: 2.5, flexShrink: 0,
            background: 'linear-gradient(135deg, #1e3a8a 0%, #4c1d95 60%, #831843 100%)',
            color: '#fff', position: 'relative', overflow: 'hidden',
          }}>
            {/* Decorative shapes */}
            <Box sx={{ position: 'absolute', top: -40, right: -20, width: 200, height: 200,
                       borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)' }} />
            <Box sx={{ position: 'absolute', top: 30, right: 140, width: 100, height: 100,
                       borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)' }} />
            <Box sx={{ position: 'absolute', bottom: -50, left: 100, width: 180, height: 180,
                       borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.04)' }} />

            <Stack direction="row" alignItems="center" spacing={2} sx={{ position: 'relative' }}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.22)', color: '#fff',
                            width: 56, height: 56, fontSize: 28,
                            border: '2px solid rgba(255,255,255,0.3)' }}>
                <MenuBookIcon sx={{ fontSize: 32 }} />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.1,
                                                 textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                  Composer 갤러리
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.3 }}>
                  Composer 화면 생성기가 사용할 <b>Grid</b>·<b>Chart</b>·<b>KPI</b> 갤러리.
                  각 항목의 라이브 미리보기와 샘플 데이터를 확인하고 선택하세요.
                </Typography>
              </Box>

              {/* Quick stats */}
              <Stack direction="row" spacing={1}>
                {TAB_META.map((m, i) => (
                  <Box key={i} onClick={() => setTab(i)}
                       sx={{ cursor: 'pointer', minWidth: 130,
                             bgcolor: tab === i ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.1)',
                             backdropFilter: 'blur(8px)',
                             border: `1px solid ${tab === i ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)'}`,
                             borderRadius: 2, p: 1,
                             transition: 'all 0.2s',
                             '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' } }}>
                    <Stack direction="row" alignItems="center" spacing={0.7}>
                      {m.icon}
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>{m.label}</Typography>
                    </Stack>
                    <Typography variant="caption" sx={{ display: 'block', opacity: 0.8, fontSize: 10, mt: 0.3 }}>
                      {m.sub}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Stack>
          </Paper>

          {/* Body — 하단 Tab 행은 헤더 우측 카드(quick stats)와 기능이 중복되어 제거 */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {tab === 0 && <GridTypeTab />}
            {tab === 1 && <ChartTypeTab />}
            {tab === 2 && <KpiDictTab />}
          </Box>
        </Box>
      </WorkArea>
    </ContentInner>
  );
}

export default T3ComposerDict;
