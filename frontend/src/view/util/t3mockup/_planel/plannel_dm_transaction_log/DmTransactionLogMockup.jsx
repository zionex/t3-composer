import React from 'react';
import { Box, Stack, TextField, MenuItem, Button, Chip, Pagination,
  Table, TableHead, TableBody, TableRow, TableCell, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import MockShell from '../../_shared/MockShell';

// PLANNEL DM 거래 로그 — SalesTransaction / InventoryTransaction / ShipmentTransaction /
//   ProdOrder / PurchaseOrder / IntransitInventory / BfFeatureDate / BfFeatureSales 8개
// LAYOUT_SINGLE — 대량 거래 로그 그리드 + 필터 다중 + 페이지네이션 + 엑셀 익스포트

const TX_ROWS = [
  { DT: '2026-05-26 14:23', TYPE: 'SALES',     REF: 'SO-2026-04829', CUST: 'Samsung Display', ITEM: 'ITM-A100', QTY:   500, UOM: 'EA',  AMT: 12500000, STATUS: 'CONFIRMED' },
  { DT: '2026-05-26 13:55', TYPE: 'SHIPMENT',  REF: 'SH-2026-08412', CUST: 'Samsung Display', ITEM: 'ITM-A101', QTY:   300, UOM: 'EA',  AMT:  9000000, STATUS: 'SHIPPED' },
  { DT: '2026-05-26 12:40', TYPE: 'INVENTORY', REF: 'IV-2026-22841', CUST: '—',               ITEM: 'ITM-B205', QTY: 12000, UOM: 'EA',  AMT:        0, STATUS: 'IN_STOCK' },
  { DT: '2026-05-26 11:15', TYPE: 'PROD',      REF: 'PO-2026-05172', CUST: '—',               ITEM: 'ITM-A100', QTY:  1000, UOM: 'EA',  AMT:        0, STATUS: 'RELEASED' },
  { DT: '2026-05-26 10:08', TYPE: 'PURCHASE',  REF: 'PR-2026-03291', CUST: 'Supplier-K012',   ITEM: 'ITM-C310', QTY:  5000, UOM: 'KG',  AMT:  7500000, STATUS: 'OPEN' },
  { DT: '2026-05-25 18:42', TYPE: 'INTRANSIT', REF: 'IT-2026-01158', CUST: 'Supplier-J005',   ITEM: 'ITM-D420', QTY:  8000, UOM: 'EA',  AMT:  3200000, STATUS: 'IN_TRANSIT' },
  { DT: '2026-05-25 16:30', TYPE: 'BF_FEAT',   REF: 'BF-2026-09934', CUST: '—',               ITEM: 'ITM-A102', QTY:     0, UOM: '—',   AMT:        0, STATUS: 'CALC' },
  { DT: '2026-05-25 15:12', TYPE: 'SALES',     REF: 'SO-2026-04825', CUST: 'LG Innotek',      ITEM: 'ITM-B205', QTY:   200, UOM: 'EA',  AMT:  6000000, STATUS: 'CONFIRMED' },
  { DT: '2026-05-25 14:48', TYPE: 'SHIPMENT',  REF: 'SH-2026-08410', CUST: 'Apple Inc.',      ITEM: 'ITM-A101', QTY:  1500, UOM: 'EA',  AMT: 45000000, STATUS: 'SHIPPED' },
  { DT: '2026-05-25 13:25', TYPE: 'SALES',     REF: 'SO-2026-04820', CUST: 'Tesla Motors',    ITEM: 'ITM-C310', QTY:  3000, UOM: 'KG',  AMT:  4500000, STATUS: 'PENDING' },
];

const statusColor = (s) => {
  if (['CONFIRMED', 'SHIPPED', 'IN_STOCK', 'RELEASED'].includes(s)) return 'success';
  if (['IN_TRANSIT', 'OPEN', 'CALC'].includes(s)) return 'info';
  if (s === 'PENDING') return 'warning';
  return 'default';
};

export default function DmTransactionLogMockup() {
  return (
    <MockShell
      patternCode="plannel_dm_transaction_log"
      patternLabel="PlaNEL — DM 거래 로그 (Sales / Inventory / Shipment / Prod Order / Purchase / Intransit / BF Feature 8종)"
      layoutCategory="LAYOUT_SINGLE"
      description="대량 거래 로그 그리드 — 필터 다중 + 페이지네이션 + 엑셀 익스포트. 8개 거래 유형 통합 뷰."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <TextField label="거래 유형" size="small" select value="ALL" sx={{ width: 150 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="SALES">Sales</MenuItem>
            <MenuItem value="INVENTORY">Inventory</MenuItem>
            <MenuItem value="SHIPMENT">Shipment</MenuItem>
            <MenuItem value="PROD">Prod Order</MenuItem>
            <MenuItem value="PURCHASE">Purchase</MenuItem>
            <MenuItem value="INTRANSIT">Intransit</MenuItem>
            <MenuItem value="BF_FEAT">BF Feature</MenuItem>
          </TextField>
          <TextField label="기간" size="small" value="2026-05-19 ~ 2026-05-26" sx={{ width: 220 }} />
          <TextField label="Customer/Item" size="small" placeholder="CD/NM 검색" sx={{ width: 180 }} />
          <TextField label="Status" size="small" select value="ALL" sx={{ width: 120 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="CONFIRMED">Confirmed</MenuItem>
            <MenuItem value="PENDING">Pending</MenuItem>
            <MenuItem value="SHIPPED">Shipped</MenuItem>
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          <Button size="small" startIcon={<FileDownloadIcon />}>Excel</Button>
          <Button size="small" startIcon={<SearchIcon />} variant="contained">조회</Button>
        </Stack>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.100' }}>
              <TableCell sx={{ fontWeight: 700, minWidth: 140 }}>일시</TableCell>
              <TableCell sx={{ fontWeight: 700, minWidth: 100 }}>유형</TableCell>
              <TableCell sx={{ fontWeight: 700, minWidth: 140 }}>참조 번호</TableCell>
              <TableCell sx={{ fontWeight: 700, minWidth: 160 }}>Customer / Supplier</TableCell>
              <TableCell sx={{ fontWeight: 700, minWidth: 100 }}>Item</TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: 'right', minWidth: 90 }}>수량</TableCell>
              <TableCell sx={{ fontWeight: 700, minWidth: 60 }}>UOM</TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: 'right', minWidth: 120 }}>금액 (KRW)</TableCell>
              <TableCell sx={{ fontWeight: 700, minWidth: 110 }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {TX_ROWS.map((r) => (
              <TableRow key={r.REF} hover>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{r.DT}</TableCell>
                <TableCell><Chip label={r.TYPE} size="small" variant="outlined" /></TableCell>
                <TableCell sx={{ fontFamily: 'monospace' }}>{r.REF}</TableCell>
                <TableCell>{r.CUST}</TableCell>
                <TableCell sx={{ fontFamily: 'monospace' }}>{r.ITEM}</TableCell>
                <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.QTY.toLocaleString()}</TableCell>
                <TableCell>{r.UOM}</TableCell>
                <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', color: r.AMT > 0 ? 'inherit' : 'text.disabled' }}>
                  {r.AMT > 0 ? r.AMT.toLocaleString() : '—'}
                </TableCell>
                <TableCell><Chip label={r.STATUS} size="small" color={statusColor(r.STATUS)} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      <Box sx={{ p: 1, borderTop: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', backgroundColor: 'grey.50' }}>
        <Typography variant="caption" color="text.secondary">총 12,484건 · 페이지당 10건</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Pagination count={1249} page={1} size="small" />
      </Box>
    </MockShell>
  );
}
