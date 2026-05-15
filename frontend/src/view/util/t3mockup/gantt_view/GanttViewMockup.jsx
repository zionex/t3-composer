import React from 'react';
import { Box, Stack, TextField, MenuItem, Button, Chip, Typography, Card, CardContent } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

import MockShell from '../_shared/MockShell';
import { WORK_ORDERS, ITEMS, LOCATIONS } from '../_data/mockData';

const DAYS = Array.from({ length: 23 }, (_, i) => i + 8);
const RESOURCES = ['Line A', 'Line B', 'Line C', 'Line D'];

export default function GanttViewMockup() {
  // 다중 작업 — 자원별 배치
  const expanded = WORK_ORDERS.flatMap((wo, i) => [
    { ...wo, resource: RESOURCES[i % RESOURCES.length], startDay: parseInt(wo.startDt.split('-')[2], 10), endDay: parseInt(wo.endDt.split('-')[2], 10), itemNm: ITEMS.find((it) => it.itemCd === wo.itemCd)?.itemNm || '' },
  ]);
  // 자원별로 작업 묶기
  const byResource = RESOURCES.map((r) => ({ resource: r, tasks: expanded.filter((t) => t.resource === r) }));

  return (
    <MockShell
      patternCode="gantt_view"
      patternLabel="간트 단독 보기 (읽기 전용)"
      layoutCategory="LAYOUT_SINGLE"
      description="자원별 작업 일정의 간트. 편집 없음, 보기 전용. 일정 충돌·여유 시각화."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <TextField label="기간" size="small" value="2026-04-08 ~ 2026-04-30" sx={{ width: 220 }} />
          <TextField label="거점" size="small" select value="" sx={{ width: 200 }}>
            <MenuItem value="">전체</MenuItem>
            {LOCATIONS.slice(0, 4).map((l) => <MenuItem key={l.locatCd} value={l.locatCd}>{l.locatNm}</MenuItem>)}
          </TextField>
          <Button size="small" variant="contained" startIcon={<SearchIcon />}>조회</Button>
        </Stack>
      </Box>
      <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
        <Card variant="outlined" sx={{ minWidth: 1100 }}>
          <CardContent>
            <Box sx={{ display: 'flex', borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ width: 140, p: 1, fontWeight: 700, fontSize: 13 }}>자원</Box>
              <Box sx={{ flex: 1, display: 'flex' }}>
                {DAYS.map((d) => (
                  <Box key={d} sx={{ flex: 1, textAlign: 'center', fontSize: 11, fontFamily: 'monospace', borderLeft: '1px solid', borderColor: 'grey.200', p: 0.5,
                    color: (d === 11 || d === 12 || d === 18 || d === 19 || d === 25 || d === 26) ? 'text.disabled' : 'inherit',
                  }}>{d}</Box>
                ))}
              </Box>
            </Box>
            {byResource.map((r) => (
              <Box key={r.resource} sx={{ display: 'flex', borderBottom: '1px solid', borderColor: 'grey.100', minHeight: 50, alignItems: 'center' }}>
                <Box sx={{ width: 140, p: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{r.resource}</Typography>
                  <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{r.tasks.length}개 작업</Typography>
                </Box>
                <Box sx={{ flex: 1, position: 'relative', display: 'flex', height: 50 }}>
                  {DAYS.map((d) => (
                    <Box key={d} sx={{ flex: 1, borderLeft: '1px solid', borderColor: 'grey.100',
                      backgroundColor: (d === 11 || d === 12 || d === 18 || d === 19 || d === 25 || d === 26) ? 'grey.50' : 'transparent' }} />
                  ))}
                  {r.tasks.map((t, ti) => (
                    <Box key={t.woNo} sx={{
                      position: 'absolute',
                      left: `${((t.startDay - 8) / DAYS.length) * 100}%`,
                      width: `${((t.endDay - t.startDay + 1) / DAYS.length) * 100}%`,
                      top: 14 + ti * 2, height: 22, borderRadius: 1,
                      backgroundColor: t.status === 'DONE' ? '#2a9d8f' : (t.status === 'INPROG' ? '#ffb100' : '#5281b3'),
                      border: '1px solid', borderColor: 'common.white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, color: 'white', fontWeight: 700, px: 0.5,
                      overflow: 'hidden',
                    }}>
                      {t.woNo} · {t.qty.toLocaleString()}
                    </Box>
                  ))}
                </Box>
              </Box>
            ))}
            <Stack direction="row" spacing={1.5} sx={{ p: 1, fontSize: 11 }}>
              <Stack direction="row" alignItems="center" spacing={0.5}><Box sx={{ width: 12, height: 12, backgroundColor: '#5281b3', borderRadius: 0.5 }} /><Typography sx={{ fontSize: 11 }}>계획</Typography></Stack>
              <Stack direction="row" alignItems="center" spacing={0.5}><Box sx={{ width: 12, height: 12, backgroundColor: '#ffb100', borderRadius: 0.5 }} /><Typography sx={{ fontSize: 11 }}>진행</Typography></Stack>
              <Stack direction="row" alignItems="center" spacing={0.5}><Box sx={{ width: 12, height: 12, backgroundColor: '#2a9d8f', borderRadius: 0.5 }} /><Typography sx={{ fontSize: 11 }}>완료</Typography></Stack>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </MockShell>
  );
}
