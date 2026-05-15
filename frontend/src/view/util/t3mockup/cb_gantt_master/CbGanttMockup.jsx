import React from 'react';
import { Box, Stack, Chip, Typography, Button, Card, CardContent } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

import MockShell from '../_shared/MockShell';
import { WORK_ORDERS, ITEMS, LOCATIONS } from '../_data/mockData';

// 4월 8일 ~ 4월 30일 (23일) 일자 가로축
const DAYS = Array.from({ length: 23 }, (_, i) => i + 8);

export default function CbGanttMockup() {
  const tasks = WORK_ORDERS.map((wo) => ({
    ...wo,
    itemNm:  ITEMS.find((i) => i.itemCd === wo.itemCd)?.itemNm || '',
    locatNm: LOCATIONS.find((l) => l.locatCd === wo.locatCd)?.locatNm || '',
    startDay: parseInt(wo.startDt.split('-')[2], 10),
    endDay:   parseInt(wo.endDt.split('-')[2], 10),
  }));

  return (
    <MockShell
      patternCode="cb_gantt_master"
      patternLabel="CB — 간트형 컨트롤보드 (작업 일정 관제)"
      layoutCategory="LAYOUT_CONTROLBOARD"
      description="작업지시(WO)·생산 일정을 간트차트로. 일정 충돌·지연 시각화. FP 도메인 활용."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50', display: 'flex', justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Chip size="small" color="info" label="2026-04 (4/8 ~ 4/30)" />
          <Typography variant="body2">총 {tasks.length}개 WO</Typography>
        </Stack>
        <Button size="small" variant="contained" startIcon={<PlayArrowIcon />}>재실행</Button>
      </Box>

      <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
        <Card variant="outlined" sx={{ minWidth: 1200 }}>
          <CardContent>
            {/* Header */}
            <Box sx={{ display: 'flex', borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ width: 320, fontWeight: 700, p: 1 }}>작업 / 거점 / 품목</Box>
              <Box sx={{ flex: 1, display: 'flex' }}>
                {DAYS.map((d) => (
                  <Box key={d} sx={{
                    flex: 1, textAlign: 'center', fontSize: 11, fontFamily: 'monospace',
                    borderLeft: '1px solid', borderColor: 'grey.200', p: 0.5,
                    color: (d === 13) ? 'error.main' : (d === 11 || d === 12 || d === 18 || d === 19 || d === 25 || d === 26) ? 'text.disabled' : 'inherit',
                    backgroundColor: (d === 13) ? 'error.lighter' : 'transparent',
                    fontWeight: (d === 13) ? 700 : 400,
                  }}>
                    {d}
                  </Box>
                ))}
              </Box>
            </Box>
            {/* Rows */}
            {tasks.map((t) => (
              <Box key={t.woNo} sx={{ display: 'flex', borderBottom: '1px solid', borderColor: 'grey.100', minHeight: 36, alignItems: 'center' }}>
                <Box sx={{ width: 320, p: 1, fontSize: 12 }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: 12 }}>{t.woNo}</Typography>
                    <Chip size="small" label={t.status}
                          color={t.status === 'DONE' ? 'success' : (t.status === 'INPROG' ? 'warning' : 'default')}
                          sx={{ height: 18, fontSize: 10 }} />
                  </Stack>
                  <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.25 }}>{t.locatNm} · {t.itemNm}</Typography>
                </Box>
                <Box sx={{ flex: 1, position: 'relative', display: 'flex' }}>
                  {DAYS.map((d) => (
                    <Box key={d} sx={{ flex: 1, height: 36, borderLeft: '1px solid', borderColor: 'grey.100',
                      backgroundColor: (d === 11 || d === 12 || d === 18 || d === 19 || d === 25 || d === 26) ? 'grey.50' : 'transparent' }} />
                  ))}
                  {/* Bar */}
                  <Box sx={{
                    position: 'absolute',
                    left: `${((t.startDay - 8) / DAYS.length) * 100}%`,
                    width: `${((t.endDay - t.startDay + 1) / DAYS.length) * 100}%`,
                    top: 8, height: 20, borderRadius: 1,
                    backgroundColor: t.status === 'DONE' ? '#2a9d8f' : (t.status === 'INPROG' ? '#ffb100' : '#5281b3'),
                    border: '1px solid', borderColor: 'common.white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, color: 'white', fontWeight: 700,
                  }}>
                    {t.qty.toLocaleString()}
                  </Box>
                </Box>
              </Box>
            ))}
          </CardContent>
        </Card>
      </Box>
    </MockShell>
  );
}
