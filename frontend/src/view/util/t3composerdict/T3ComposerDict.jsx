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
  { label: 'Grid 갤러리',   sub: 'RealGrid2 · TreeGrid · Pivot',  icon: <TableChartIcon sx={{ fontSize: 20 }} />, color: '#86C7A8' },
  { label: 'Chart 갤러리',  sub: 'Chart.js 60+ 변형',             icon: <BarChartIcon   sx={{ fontSize: 20 }} />, color: '#8FC4D4' },
  { label: 'KPI 갤러리',    sub: 'S&OP + SCM 모듈별 152 KPI',      icon: <AutoGraphIcon  sx={{ fontSize: 20 }} />, color: '#9D8FD4' },
];

function T3ComposerDict() {
  const [tab, setTab] = useState(0);

  return (
    <ContentInner>
      <WorkArea>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0,
                   bgcolor: 'transparent', p: 1.2, gap: 1.2 }}>

          {/* Top Hero — 파스텔 글래스 */}
          <Paper elevation={0} sx={{
            p: 2, borderRadius: 3, flexShrink: 0, position: 'relative', overflow: 'hidden',
            background: 'linear-gradient(135deg, rgba(169,199,238,0.62) 0%, '
                      + 'rgba(143,196,212,0.42) 52%, rgba(157,143,212,0.42) 100%)',
            backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
            border: '1px solid rgba(255,255,255,0.65)',
            boxShadow: '0 1px 0 rgba(255,255,255,0.85) inset, 0 8px 24px -10px rgba(58,74,99,0.26)',
            color: '#3A4A63',
          }}>
            {/* 장식 — 글래스 하이라이트 */}
            <Box sx={{ position: 'absolute', top: -40, right: -20, width: 200, height: 200,
                       borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.30)' }} />
            <Box sx={{ position: 'absolute', top: 30, right: 140, width: 100, height: 100,
                       borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.22)' }} />
            <Box sx={{ position: 'absolute', bottom: -50, left: 100, width: 180, height: 180,
                       borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.16)' }} />

            <Stack direction="row" alignItems="center" spacing={2} sx={{ position: 'relative' }}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.78)', color: '#5683C0',
                            width: 56, height: 56,
                            border: '1px solid rgba(255,255,255,0.85)',
                            boxShadow: '0 4px 12px -4px rgba(58,74,99,0.30)' }}>
                <MenuBookIcon sx={{ fontSize: 32 }} />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.1, color: '#3A4A63',
                                                 textShadow: '0 1px 2px rgba(255,255,255,0.6)' }}>
                  Composer 갤러리
                </Typography>
                <Typography variant="body2" sx={{ color: '#5A6B85', mt: 0.3 }}>
                  Composer 화면 생성기가 사용할 <b>Grid</b>·<b>Chart</b>·<b>KPI</b> 갤러리.
                  각 항목의 라이브 미리보기와 샘플 데이터를 확인하고 선택하세요.
                </Typography>
              </Box>

              {/* Quick stats — 파스텔 글래스 타일 */}
              <Stack direction="row" spacing={1}>
                {TAB_META.map((m, i) => (
                  <Box key={i} onClick={() => setTab(i)}
                       sx={{ cursor: 'pointer', minWidth: 130,
                             bgcolor: tab === i ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.50)',
                             backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                             border: `1.5px solid ${tab === i ? m.color : 'rgba(255,255,255,0.70)'}`,
                             borderRadius: 2, p: 1,
                             boxShadow: tab === i
                               ? `0 4px 14px -6px ${m.color}aa`
                               : '0 2px 8px -5px rgba(58,74,99,0.22)',
                             transition: 'all 0.18s ease',
                             '&:hover': { bgcolor: 'rgba(255,255,255,0.92)' } }}>
                    <Stack direction="row" alignItems="center" spacing={0.7}
                           sx={{ color: tab === i ? m.color : '#5A6B85' }}>
                      {m.icon}
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>{m.label}</Typography>
                    </Stack>
                    <Typography variant="caption" sx={{ display: 'block', color: '#8190a8',
                                                         fontSize: 10, mt: 0.3 }}>
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
