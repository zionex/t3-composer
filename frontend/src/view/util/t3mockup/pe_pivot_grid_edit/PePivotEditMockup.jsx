import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Chip, Typography, Switch, FormControlLabel,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Paper, IconButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SaveIcon from '@mui/icons-material/Save';
import RestoreIcon from '@mui/icons-material/Restore';
import EditIcon from '@mui/icons-material/Edit';

import MockShell from '../_shared/MockShell';
import { FORECAST_TS, WEEK_BUCKETS } from '../_data/mockData';

export default function PePivotEditMockup() {
  return (
    <MockShell
      patternCode="pe_pivot_grid_edit"
      patternLabel="PE — 피벗 편집 (계획 조정)"
      layoutCategory="LAYOUT_PLANEDIT"
      description="시계열 크로스탭에 직접 셀 편집. 수정값 하이라이트 + 합계 자동 재계산."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="PlanScope" size="small" select value="PS01" sx={{ width: 150 }}>
            <MenuItem value="PS01">PS01 — Global</MenuItem>
          </TextField>
          <TextField label="버전" size="small" value="SIM_V_002" sx={{ width: 160 }} />
          <FormControlLabel control={<Switch defaultChecked size="small" />} label={<Typography variant="caption">편집 모드</Typography>} />
          <Box sx={{ flex: 1 }} />
          <Chip size="small" label="3개 변경" color="warning" icon={<EditIcon />} />
          <Button variant="outlined" size="small" startIcon={<RestoreIcon />}>되돌리기</Button>
          <Button variant="contained" size="small" startIcon={<SaveIcon />}>저장</Button>
        </Stack>
      </Box>

      <TableContainer component={Paper} variant="outlined" square sx={{ flex: 1, m: 1 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 700, backgroundColor: 'grey.100' } }}>
              <TableCell sx={{ position: 'sticky', left: 0, zIndex: 3, backgroundColor: 'grey.100' }}>품목</TableCell>
              {WEEK_BUCKETS.map((w) => <TableCell key={w} align="right" sx={{ minWidth: 80 }}>{w}</TableCell>)}
              <TableCell align="right" sx={{ backgroundColor: 'grey.200', fontWeight: 700 }}>합계</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {FORECAST_TS.map((row, ri) => {
              const sum = WEEK_BUCKETS.reduce((s, w) => s + row[w], 0);
              return (
                <TableRow key={row.itemCd} hover>
                  <TableCell sx={{ position: 'sticky', left: 0, backgroundColor: 'background.paper', whiteSpace: 'nowrap' }}>
                    <Stack>
                      <Typography sx={{ fontFamily: 'monospace', fontSize: 12 }}>{row.itemCd}</Typography>
                      <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{row.itemNm}</Typography>
                    </Stack>
                  </TableCell>
                  {WEEK_BUCKETS.map((w, wi) => {
                    // 더미: 몇 개 셀은 "수정됨" 으로 표시
                    const isEdited = (ri === 0 && wi === 5) || (ri === 1 && wi === 3) || (ri === 3 && wi === 7);
                    return (
                      <TableCell key={w} align="right" sx={{
                        fontFamily: 'monospace', position: 'relative',
                        backgroundColor: isEdited ? '#fff4e0' : 'transparent',
                        color: isEdited ? 'warning.dark' : 'inherit',
                        fontWeight: isEdited ? 700 : 400,
                        border: isEdited ? '2px solid' : '1px solid',
                        borderColor: isEdited ? 'warning.main' : 'grey.200',
                      }}>
                        {row[w].toLocaleString()}
                        {isEdited && <Box sx={{ position: 'absolute', top: 0, right: 2, fontSize: 8, color: 'warning.main' }}>•</Box>}
                      </TableCell>
                    );
                  })}
                  <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 700, backgroundColor: 'grey.50' }}>{sum.toLocaleString()}</TableCell>
                </TableRow>
              );
            })}
            <TableRow sx={{ '& td': { fontWeight: 700, backgroundColor: 'grey.100' } }}>
              <TableCell sx={{ position: 'sticky', left: 0, backgroundColor: 'grey.100' }}>합계</TableCell>
              {WEEK_BUCKETS.map((w) => {
                const sum = FORECAST_TS.reduce((s, row) => s + row[w], 0);
                return <TableCell key={w} align="right" sx={{ fontFamily: 'monospace' }}>{sum.toLocaleString()}</TableCell>;
              })}
              <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                {FORECAST_TS.reduce((s, row) => s + WEEK_BUCKETS.reduce((a, w) => a + row[w], 0), 0).toLocaleString()}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </MockShell>
  );
}
