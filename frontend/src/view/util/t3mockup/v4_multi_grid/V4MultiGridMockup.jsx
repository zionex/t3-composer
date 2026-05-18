import React from 'react';
import {
  Box, Stack, Typography, Chip, Button, Grid,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Paper,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

import MockShell from '../_shared/MockShell';
import { SALES_ORDERS, PURCHASE_ORDERS, WORK_ORDERS, KPI_CARDS, ITEMS, ACCOUNTS } from '../_data/mockData';

function MiniGrid({ title, color, rows, columns }) {
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 1, py: 0.5, backgroundColor: color, color: 'white' }}>
        <Typography variant="caption" sx={{ fontWeight: 700 }}>{title}</Typography>
        <Chip size="small" label={`${rows.length}`} sx={{ height: 18, fontSize: 10, backgroundColor: 'rgba(255,255,255,0.3)', color: 'white' }} />
      </Stack>
      <TableContainer component={Paper} variant="outlined" square sx={{ flex: 1, overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 700, backgroundColor: 'grey.100', py: 0.5, fontSize: 11 } }}>
              {columns.map((c) => <TableCell key={c.name} align={c.align} sx={{ py: 0.5 }}>{c.label}</TableCell>)}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={i} hover>
                {columns.map((c) => (
                  <TableCell key={c.name} align={c.align} sx={{ fontFamily: c.mono ? 'monospace' : 'inherit', fontSize: 11, py: 0.5 }}>
                    {c.render ? c.render(r) : r[c.name]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default function V4MultiGridMockup() {
  const so = SALES_ORDERS.map((o) => ({ ...o, itemNm: ITEMS.find((it) => it.itemCd === o.itemCd)?.itemNm || '' }));
  const po = PURCHASE_ORDERS.map((o) => ({ ...o, itemNm: ITEMS.find((it) => it.itemCd === o.itemCd)?.itemNm || '' }));
  const wo = WORK_ORDERS.map((w) => ({ ...w, itemNm: ITEMS.find((it) => it.itemCd === w.itemCd)?.itemNm || '' }));
  const items = ITEMS.slice(0, 6);

  return (
    <MockShell
      patternCode="v4_multi_grid"
      patternLabel="v4 — 멀티 그리드 4-stack"
      layoutCategory="LAYOUT_V4"
      description="2×2 그리드 매트릭스. 4개 영역을 동시에 보고 비교. KPI Dashboard 의 그리드 변형."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Typography variant="subtitle2">SCM 4-View Dashboard — 2026-04</Typography>
          <Box sx={{ flex: 1 }} />
          <Button size="small" variant="contained" startIcon={<SearchIcon />}>새로고침</Button>
        </Stack>
      </Box>

      <Grid container sx={{ flex: 1, minHeight: 0 }}>
        <Grid item xs={6} sx={{ borderRight: '1px solid', borderBottom: '1px solid', borderColor: 'divider', minHeight: 0 }}>
          <MiniGrid
            title="📦 SO — 판매주문"
            color="#5281b3"
            columns={[
              { name: 'soNo', label: '번호', align: 'center', mono: true },
              { name: 'itemNm', label: '품목', align: 'left' },
              { name: 'qty', label: '수량', align: 'right', render: (r) => r.qty.toLocaleString() },
              { name: 'status', label: '상태', align: 'center' },
            ]}
            rows={so}
          />
        </Grid>
        <Grid item xs={6} sx={{ borderBottom: '1px solid', borderColor: 'divider', minHeight: 0 }}>
          <MiniGrid
            title="🛒 PO — 구매주문"
            color="#2a9d8f"
            columns={[
              { name: 'poNo', label: '번호', align: 'center', mono: true },
              { name: 'itemNm', label: '품목', align: 'left' },
              { name: 'qty', label: '수량', align: 'right', render: (r) => r.qty.toLocaleString() },
              { name: 'status', label: '상태', align: 'center' },
            ]}
            rows={po}
          />
        </Grid>
        <Grid item xs={6} sx={{ borderRight: '1px solid', borderColor: 'divider', minHeight: 0 }}>
          <MiniGrid
            title="🏭 WO — 작업지시"
            color="#fa7d5b"
            columns={[
              { name: 'woNo', label: '번호', align: 'center', mono: true },
              { name: 'itemNm', label: '품목', align: 'left' },
              { name: 'qty', label: '수량', align: 'right', render: (r) => r.qty.toLocaleString() },
              { name: 'status', label: '상태', align: 'center' },
            ]}
            rows={wo}
          />
        </Grid>
        <Grid item xs={6} sx={{ minHeight: 0 }}>
          <MiniGrid
            title="🏷 Item — 활성 품목 (Top 6)"
            color="#8b5cf6"
            columns={[
              { name: 'itemCd', label: '코드', align: 'center', mono: true },
              { name: 'itemNm', label: '품목명', align: 'left' },
              { name: 'unitPrice', label: '단가', align: 'right', render: (r) => `₩ ${r.unitPrice.toLocaleString()}` },
              { name: 'leadTime', label: 'LT', align: 'right', render: (r) => `${r.leadTime}d` },
            ]}
            rows={items}
          />
        </Grid>
      </Grid>
    </MockShell>
  );
}
