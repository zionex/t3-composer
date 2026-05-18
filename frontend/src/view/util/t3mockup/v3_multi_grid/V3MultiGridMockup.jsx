import React from 'react';
import {
  Box, Stack, Typography, Chip, Button, TextField, MenuItem,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Paper,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

import MockShell from '../_shared/MockShell';
import { SALES_ORDERS, PURCHASE_ORDERS, WORK_ORDERS, ACCOUNTS, ITEMS } from '../_data/mockData';

function GridSection({ title, color, columns, rows }) {
  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 1.5, py: 0.5, borderTop: '3px solid', borderColor: color, backgroundColor: 'grey.50' }}>
        <Typography variant="subtitle2">{title}</Typography>
        <Chip size="small" label={`${rows.length}건`} sx={{ height: 18 }} />
      </Stack>
      <TableContainer component={Paper} variant="outlined" square sx={{ flex: 1, overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 700, backgroundColor: 'grey.100' } }}>
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

export default function V3MultiGridMockup() {
  const so = SALES_ORDERS.map((o) => ({ ...o, accountNm: ACCOUNTS.find((a) => a.accountCd === o.accountCd)?.accountNm || '', itemNm: ITEMS.find((it) => it.itemCd === o.itemCd)?.itemNm || '' }));
  const po = PURCHASE_ORDERS.map((o) => ({ ...o, accountNm: ACCOUNTS.find((a) => a.accountCd === o.accountCd)?.accountNm || '', itemNm: ITEMS.find((it) => it.itemCd === o.itemCd)?.itemNm || '' }));
  const wo = WORK_ORDERS.map((w) => ({ ...w, itemNm: ITEMS.find((it) => it.itemCd === w.itemCd)?.itemNm || '' }));

  return (
    <MockShell
      patternCode="v3_multi_grid"
      patternLabel="v3 — 멀티 그리드 3-stack"
      layoutCategory="LAYOUT_V3"
      description="3개 그리드를 수직 스택. PO/SO/WO 통합 검토용. 동일 검색 조건 공유."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <TextField label="기간" size="small" value="2026-04-01 ~ 2026-04-30" sx={{ width: 220 }} />
          <TextField label="품목" size="small" select value="IT-A001" sx={{ width: 200 }}>
            {ITEMS.slice(0, 5).map((it) => <MenuItem key={it.itemCd} value={it.itemCd}>{it.itemNm}</MenuItem>)}
          </TextField>
          <Button size="small" variant="contained" startIcon={<SearchIcon />}>조회</Button>
        </Stack>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5, p: 0.5, minHeight: 0 }}>
        <GridSection
          title="🛒 구매 주문 (PO)"
          color="#5281b3"
          columns={[
            { name: 'poNo', label: '번호', align: 'center', mono: true },
            { name: 'accountNm', label: '공급처', align: 'left' },
            { name: 'itemNm', label: '품목', align: 'left' },
            { name: 'qty', label: '수량', align: 'right', render: (r) => r.qty.toLocaleString() },
            { name: 'dueDt', label: '입고예정', align: 'center', mono: true },
            { name: 'status', label: '상태', align: 'center' },
          ]}
          rows={po}
        />
        <GridSection
          title="📦 판매 주문 (SO)"
          color="#2a9d8f"
          columns={[
            { name: 'soNo', label: '번호', align: 'center', mono: true },
            { name: 'accountNm', label: '거래처', align: 'left' },
            { name: 'itemNm', label: '품목', align: 'left' },
            { name: 'qty', label: '수량', align: 'right', render: (r) => r.qty.toLocaleString() },
            { name: 'dueDt', label: '납기', align: 'center', mono: true },
            { name: 'status', label: '상태', align: 'center' },
          ]}
          rows={so}
        />
        <GridSection
          title="🏭 작업지시 (WO)"
          color="#fa7d5b"
          columns={[
            { name: 'woNo', label: '번호', align: 'center', mono: true },
            { name: 'locatCd', label: '거점', align: 'center', mono: true },
            { name: 'itemNm', label: '품목', align: 'left' },
            { name: 'qty', label: '수량', align: 'right', render: (r) => r.qty.toLocaleString() },
            { name: 'startDt', label: '시작', align: 'center', mono: true },
            { name: 'endDt', label: '종료', align: 'center', mono: true },
            { name: 'status', label: '상태', align: 'center' },
          ]}
          rows={wo}
        />
      </Box>
    </MockShell>
  );
}
