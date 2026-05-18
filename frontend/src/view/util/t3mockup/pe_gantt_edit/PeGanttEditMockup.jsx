import React from 'react';
import { Box, Stack, Button, Chip, Typography, Card, CardContent } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

import MockShell from '../_shared/MockShell';
import { WORK_ORDERS, ITEMS } from '../_data/mockData';

const DAYS = Array.from({ length: 23 }, (_, i) => i + 8);

export default function PeGanttEditMockup() {
  const tasks = WORK_ORDERS.map((wo) => ({
    ...wo,
    itemNm: ITEMS.find((i) => i.itemCd === wo.itemCd)?.itemNm || '',
    startDay: parseInt(wo.startDt.split('-')[2], 10),
    endDay:   parseInt(wo.endDt.split('-')[2], 10),
  }));

  return (
    <MockShell
      patternCode="pe_gantt_edit"
      patternLabel="PE — 간트 편집 (Drag & Drop)"
      layoutCategory="LAYOUT_PLANEDIT"
      description="간트 막대를 드래그해서 일정 조정. 변경된 작업은 강조. FP 계획 편집의 표준."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50', display: 'flex', justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Typography variant="subtitle2">2026-04 (4/8 ~ 4/30)</Typography>
          <Chip size="small" label="편집 가능" color="success" />
          <Typography variant="body2" color="text.secondary">막대를 좌우로 드래그하여 일정 조정</Typography>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Chip size="small" label="2개 변경됨" color="warning" />
          <Button size="small" variant="contained" startIcon={<SaveIcon />}>저장</Button>
        </Stack>
      </Box>

      <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
        <Card variant="outlined" sx={{ minWidth: 1200 }}>
          <CardContent>
            <Box sx={{ display: 'flex', borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ width: 260, p: 1, fontWeight: 700 }}>WO 번호 / 품목</Box>
              <Box sx={{ flex: 1, display: 'flex' }}>
                {DAYS.map((d) => (
                  <Box key={d} sx={{ flex: 1, textAlign: 'center', fontSize: 11, fontFamily: 'monospace', borderLeft: '1px solid', borderColor: 'grey.200', p: 0.5,
                    backgroundColor: (d === 13) ? 'warning.lighter' : 'transparent',
                    color: (d === 13) ? 'warning.dark' : (d === 11 || d === 12 || d === 18 || d === 19 || d === 25 || d === 26) ? 'text.disabled' : 'inherit',
                  }}>
                    {d}
                  </Box>
                ))}
              </Box>
            </Box>
            {tasks.map((t, i) => {
              const isEdited = i === 1 || i === 3;
              return (
                <Box key={t.woNo} sx={{ display: 'flex', borderBottom: '1px solid', borderColor: 'grey.100', minHeight: 48, alignItems: 'center', backgroundColor: isEdited ? '#fff8f0' : 'transparent' }}>
                  <Box sx={{ width: 260, p: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <DragIndicatorIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                      <Stack>
                        <Typography sx={{ fontFamily: 'monospace', fontSize: 12 }}>{t.woNo}</Typography>
                        <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{t.itemNm}</Typography>
                      </Stack>
                    </Stack>
                  </Box>
                  <Box sx={{ flex: 1, position: 'relative', display: 'flex', height: 48 }}>
                    {DAYS.map((d) => (
                      <Box key={d} sx={{ flex: 1, borderLeft: '1px solid', borderColor: 'grey.100',
                        backgroundColor: (d === 11 || d === 12 || d === 18 || d === 19 || d === 25 || d === 26) ? 'grey.50' : 'transparent',
                      }} />
                    ))}
                    {/* Original (ghost) */}
                    {isEdited && (
                      <Box sx={{
                        position: 'absolute',
                        left: `${((t.startDay - 8 - (i === 1 ? 2 : 1)) / DAYS.length) * 100}%`,
                        width: `${((t.endDay - t.startDay + 1) / DAYS.length) * 100}%`,
                        top: 14, height: 20, borderRadius: 1,
                        backgroundColor: 'grey.300', border: '1px dashed', borderColor: 'grey.500',
                        opacity: 0.6,
                      }} />
                    )}
                    {/* New (current) */}
                    <Box sx={{
                      position: 'absolute',
                      left: `${((t.startDay - 8) / DAYS.length) * 100}%`,
                      width: `${((t.endDay - t.startDay + 1) / DAYS.length) * 100}%`,
                      top: 14, height: 20, borderRadius: 1,
                      backgroundColor: isEdited ? '#f7a83b' : (t.status === 'DONE' ? '#2a9d8f' : '#5281b3'),
                      border: '1px solid', borderColor: 'common.white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, color: 'white', fontWeight: 700,
                      cursor: 'ew-resize',
                      boxShadow: isEdited ? '0 0 0 2px rgba(247,168,59,0.3)' : 'none',
                    }}>
                      {t.qty.toLocaleString()}
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </CardContent>
        </Card>
      </Box>
    </MockShell>
  );
}
