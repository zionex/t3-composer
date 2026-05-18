import React, { useState } from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Tabs, Tab, Typography, Chip, Card, CardContent,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Paper,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

import MockShell from '../_shared/MockShell';
import { ITEMS, FORECAST_TS, WEEK_BUCKETS, ACTUAL_TS } from '../_data/mockData';

export default function SearchTabMockup() {
  const [tab, setTab] = useState(0);
  return (
    <MockShell
      patternCode="search_tab"
      patternLabel="P03 — 검색 + 탭 그리드"
      layoutCategory="LAYOUT_SINGLE"
      description="검색조건은 공유하고 탭으로 요약/상세/트렌드 보기를 전환. DP/MP 리포트에 자주 사용."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="PlanScope" size="small" select value="PS01" sx={{ width: 150 }}>
            <MenuItem value="PS01">PS01 — Global</MenuItem>
          </TextField>
          <TextField label="기간" size="small" value="2026-W14 ~ W25" sx={{ width: 180 }} />
          <TextField label="품목 그룹" size="small" select value="LED" sx={{ width: 130 }}>
            <MenuItem value="">전체</MenuItem>
            <MenuItem value="LED">LED</MenuItem>
            <MenuItem value="CAMERA">CAMERA</MenuItem>
          </TextField>
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
        </Stack>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 1 }}>
        <Tab label="요약 (Summary)" />
        <Tab label="상세 (Detail)" />
        <Tab label="트렌드 (Trend)" />
      </Tabs>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {tab === 0 && (
          <Stack spacing={1.5}>
            {[
              { label: '총 품목 수',  value: ITEMS.filter((i) => i.useYn === 'Y').length, suffix: '' },
              { label: '평균 LT',     value: 11.7, suffix: 'days' },
              { label: '예측 MAPE',   value: 8.7,  suffix: '%' },
              { label: '계획 충족률', value: 96.4, suffix: '%' },
            ].map((s) => (
              <Card key={s.label} variant="outlined">
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography>{s.label}</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      {s.value.toLocaleString()} <Typography component="span" variant="caption">{s.suffix}</Typography>
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
        {tab === 1 && (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, backgroundColor: 'grey.100' } }}>
                  <TableCell>품목코드</TableCell>
                  <TableCell>품목명</TableCell>
                  <TableCell align="center">유형</TableCell>
                  <TableCell align="center">그룹</TableCell>
                  <TableCell align="right">단가</TableCell>
                  <TableCell align="right">LT</TableCell>
                  <TableCell align="center">상태</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ITEMS.map((it) => (
                  <TableRow key={it.itemCd} hover>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{it.itemCd}</TableCell>
                    <TableCell>{it.itemNm}</TableCell>
                    <TableCell align="center">{it.itemTp}</TableCell>
                    <TableCell align="center">{it.itemGrp}</TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace' }}>₩ {it.unitPrice.toLocaleString()}</TableCell>
                    <TableCell align="right">{it.leadTime} d</TableCell>
                    <TableCell align="center"><Chip size="small" label={it.useYn} color={it.useYn === 'Y' ? 'success' : 'default'} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {tab === 2 && (
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>주차별 예측 트렌드</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ '& th': { fontWeight: 700, backgroundColor: 'grey.100' } }}>
                      <TableCell>품목</TableCell>
                      {WEEK_BUCKETS.map((w) => <TableCell key={w} align="right">{w}</TableCell>)}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {FORECAST_TS.map((row) => (
                      <TableRow key={row.itemCd}>
                        <TableCell>{row.itemNm}</TableCell>
                        {WEEK_BUCKETS.map((w) => <TableCell key={w} align="right" sx={{ fontFamily: 'monospace' }}>{row[w].toLocaleString()}</TableCell>)}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}
      </Box>
    </MockShell>
  );
}
