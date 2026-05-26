import React from 'react';
import { Box, Stack, TextField, MenuItem, Button, Chip,
  Table, TableHead, TableBody, TableRow, TableCell, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SaveIcon from '@mui/icons-material/Save';
import UploadIcon from '@mui/icons-material/Upload';
import MockShell from '../../_shared/MockShell';

// PLANNEL DM 시계열 계획 입력 — SalesPlan / FinancePlan / PurchaseBudget / MaterialReceiptPlan 4개
// 좌측 고정 (Item/Account) + 시간 버킷 피벗 + 직접 편집 (편집 가능 셀)

const MONTHS = ['2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11', '2026-12'];

const PLAN_ROWS = [
  { CUST: 'Samsung Display', ITEM: 'ITM-A100', NM: 'LED Module 60W', vals: [5000, 5200, 5500, 5800, 6000, 5500, 5000] },
  { CUST: 'Samsung Display', ITEM: 'ITM-A101', NM: 'LED Module 80W', vals: [3000, 3100, 3300, 3500, 3600, 3300, 3000] },
  { CUST: 'LG Innotek',      ITEM: 'ITM-A100', NM: 'LED Module 60W', vals: [2500, 2600, 2800, 3000, 3100, 2800, 2500] },
  { CUST: 'LG Innotek',      ITEM: 'ITM-B205', NM: 'PCB Board Rev.3', vals: [1200, 1250, 1300, 1350, 1400, 1300, 1200] },
  { CUST: 'Apple Inc.',      ITEM: 'ITM-A101', NM: 'LED Module 80W', vals: [8000, 8200, 8500, 8800, 9000, 8500, 8000] },
  { CUST: 'Tesla Motors',    ITEM: 'ITM-C310', NM: 'Aluminum Heatsink', vals: [4500, 4600, 4700, 4800, 4900, 4700, 4500] },
];

export default function DmPlanningGridMockup() {
  return (
    <MockShell
      patternCode="plannel_dm_planning_grid"
      patternLabel="PlaNEL — DM 시계열 계획 입력 (Sales Plan / Finance Plan / Purchase Budget / Material Receipt Plan)"
      layoutCategory="LAYOUT_SINGLE"
      description="시계열 매트릭스 입력 — 좌측 고정 (Customer/Item) + 시간 버킷 피벗 + 직접 편집 가능 셀."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <TextField label="계획 유형" size="small" select value="SALES_PLAN" sx={{ width: 180 }}>
            <MenuItem value="SALES_PLAN">Sales Plan</MenuItem>
            <MenuItem value="FINANCE_PLAN">Finance Plan</MenuItem>
            <MenuItem value="PURCHASE_BUDGET">Purchase Budget</MenuItem>
            <MenuItem value="MATERIAL_RECEIPT">Material Receipt</MenuItem>
          </TextField>
          <TextField label="기간" size="small" select value="MONTH_7" sx={{ width: 130 }}>
            <MenuItem value="MONTH_3">3개월</MenuItem>
            <MenuItem value="MONTH_6">6개월</MenuItem>
            <MenuItem value="MONTH_7">7개월</MenuItem>
            <MenuItem value="MONTH_12">12개월</MenuItem>
          </TextField>
          <TextField label="버전" size="small" select value="V2026.06" sx={{ width: 130 }}>
            <MenuItem value="V2026.05">V2026.05</MenuItem>
            <MenuItem value="V2026.06">V2026.06</MenuItem>
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          <Chip label="편집 모드: ON" color="warning" size="small" />
          <Button size="small" startIcon={<UploadIcon />}>Excel 업로드</Button>
          <Button size="small" startIcon={<SearchIcon />}>조회</Button>
          <Button size="small" startIcon={<SaveIcon />} variant="contained">저장</Button>
        </Stack>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.100' }}>
              <TableCell sx={{ fontWeight: 700, position: 'sticky', left: 0, backgroundColor: 'grey.100', minWidth: 150, zIndex: 2 }}>
                Customer
              </TableCell>
              <TableCell sx={{ fontWeight: 700, position: 'sticky', left: 150, backgroundColor: 'grey.100', minWidth: 110, zIndex: 2 }}>
                Item CD
              </TableCell>
              <TableCell sx={{ fontWeight: 700, position: 'sticky', left: 260, backgroundColor: 'grey.100', minWidth: 160, zIndex: 2 }}>
                Item NM
              </TableCell>
              {MONTHS.map((m) => (
                <TableCell key={m} sx={{ fontWeight: 700, textAlign: 'right', minWidth: 100, fontFamily: 'monospace' }}>{m}</TableCell>
              ))}
              <TableCell sx={{ fontWeight: 700, textAlign: 'right', minWidth: 100, backgroundColor: 'primary.50', fontFamily: 'monospace' }}>합계</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {PLAN_ROWS.map((r) => {
              const sum = r.vals.reduce((a, b) => a + b, 0);
              return (
                <TableRow key={r.CUST + r.ITEM} hover>
                  <TableCell sx={{ position: 'sticky', left: 0, backgroundColor: 'background.paper' }}>{r.CUST}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', position: 'sticky', left: 150, backgroundColor: 'background.paper' }}>{r.ITEM}</TableCell>
                  <TableCell sx={{ position: 'sticky', left: 260, backgroundColor: 'background.paper' }}>{r.NM}</TableCell>
                  {r.vals.map((v, i) => (
                    <TableCell key={i} sx={{
                      textAlign: 'right',
                      fontFamily: 'monospace',
                      backgroundColor: 'warning.50',
                      borderRight: '1px dashed',
                      borderColor: 'warning.200',
                    }}>
                      {v.toLocaleString()}
                    </TableCell>
                  ))}
                  <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, backgroundColor: 'primary.50' }}>
                    {sum.toLocaleString()}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>
    </MockShell>
  );
}
