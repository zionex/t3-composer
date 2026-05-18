import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography, Chip,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Paper,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SaveIcon from '@mui/icons-material/Save';

import MockShell from '../_shared/MockShell';
import { SALES_ORDERS, ACCOUNTS, ITEMS, PURCHASE_ORDERS } from '../_data/mockData';

function MiniGrid({ title, columns, rows, height }) {
  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 1, py: 0.5, backgroundColor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle2">{title}</Typography>
        <Typography variant="caption" color="text.secondary">{rows.length}건</Typography>
      </Stack>
      <TableContainer component={Paper} variant="outlined" square sx={{ flex: 1, overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 700, backgroundColor: 'grey.100', py: 0.75 } }}>
              {columns.map((c) => <TableCell key={c.name} align={c.align}>{c.label}</TableCell>)}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={i} hover>
                {columns.map((c) => (
                  <TableCell key={c.name} align={c.align} sx={{ fontFamily: c.mono ? 'monospace' : 'inherit', fontSize: 13 }}>
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

export default function V2DualGridMockup() {
  const enrichedSO = SALES_ORDERS.map((o) => ({
    ...o,
    accountNm: ACCOUNTS.find((a) => a.accountCd === o.accountCd)?.accountNm || '',
    itemNm:    ITEMS.find((it) => it.itemCd === o.itemCd)?.itemNm || '',
  }));
  const enrichedPO = PURCHASE_ORDERS.map((o) => ({
    ...o,
    accountNm: ACCOUNTS.find((a) => a.accountCd === o.accountCd)?.accountNm || '',
    itemNm:    ITEMS.find((it) => it.itemCd === o.itemCd)?.itemNm || '',
  }));

  return (
    <MockShell
      patternCode="v2_dual_grid"
      patternLabel="v2 — 듀얼 그리드 2-stack"
      layoutCategory="LAYOUT_V2"
      description="상관 없는 두 그리드를 동일 검색조건 아래 수직 스택. 일괄 검토용."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="조회 기간" size="small" value="2026-04-01 ~ 2026-04-30" sx={{ width: 220 }} />
          <TextField label="거래처" size="small" select value="" sx={{ width: 200 }}>
            <MenuItem value="">전체</MenuItem>
            {ACCOUNTS.slice(0, 5).map((a) => <MenuItem key={a.accountCd} value={a.accountCd}>{a.accountNm}</MenuItem>)}
          </TextField>
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
          <Button variant="outlined" size="small" startIcon={<SaveIcon />}>저장</Button>
        </Stack>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1, p: 1, minHeight: 0 }}>
        <MiniGrid
          title="📦 판매 주문 (SO)"
          columns={[
            { name: 'soNo',      label: '주문번호', align: 'center', mono: true },
            { name: 'accountNm', label: '거래처',   align: 'left' },
            { name: 'itemNm',    label: '품목',      align: 'left' },
            { name: 'qty',       label: '수량',      align: 'right',
              render: (r) => r.qty.toLocaleString() },
            { name: 'amount',    label: '금액',      align: 'right',
              render: (r) => `₩ ${r.amount.toLocaleString()}` },
            { name: 'dueDt',     label: '납기일',    align: 'center', mono: true },
            { name: 'status',    label: '상태',      align: 'center',
              render: (r) => <Chip size="small" label={r.status} color={r.status === '진행중' ? 'info' : (r.status === '출하완료' ? 'success' : 'default')} /> },
          ]}
          rows={enrichedSO}
        />

        <MiniGrid
          title="🛒 구매 주문 (PO)"
          columns={[
            { name: 'poNo',      label: '주문번호', align: 'center', mono: true },
            { name: 'accountNm', label: '공급처',   align: 'left' },
            { name: 'itemNm',    label: '품목',      align: 'left' },
            { name: 'qty',       label: '수량',      align: 'right',
              render: (r) => r.qty.toLocaleString() },
            { name: 'amount',    label: '금액',      align: 'right',
              render: (r) => `₩ ${r.amount.toLocaleString()}` },
            { name: 'dueDt',     label: '입고예정',  align: 'center', mono: true },
            { name: 'status',    label: '상태',      align: 'center',
              render: (r) => <Chip size="small" label={r.status} color={r.status === '입고완료' ? 'success' : (r.status === '지연' ? 'error' : 'info')} /> },
          ]}
          rows={enrichedPO}
        />
      </Box>
    </MockShell>
  );
}
