import React from 'react';
import {
  Box, Stack, Button, Chip, Typography, Switch, FormControlLabel,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Paper, TextField,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import RestoreIcon from '@mui/icons-material/Restore';
import EditIcon from '@mui/icons-material/Edit';

import MockShell from '../_shared/MockShell';
import { SALES_ORDERS, ACCOUNTS, ITEMS } from '../_data/mockData';

export default function PeGridEditMockup() {
  const rows = SALES_ORDERS.map((o) => ({
    ...o,
    accountNm: ACCOUNTS.find((a) => a.accountCd === o.accountCd)?.accountNm || '',
    itemNm:    ITEMS.find((it) => it.itemCd === o.itemCd)?.itemNm || '',
  }));

  return (
    <MockShell
      patternCode="pe_grid_edit"
      patternLabel="PE — 그리드 편집 (일반)"
      layoutCategory="LAYOUT_PLANEDIT"
      description="일반 그리드 셀 편집. 변경 행 하이라이트 + 일괄 저장/되돌리기."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Typography variant="subtitle2">판매 주문 — 납기 조정</Typography>
          <FormControlLabel control={<Switch defaultChecked size="small" />} label={<Typography variant="caption">편집 모드</Typography>} />
          <Box sx={{ flex: 1 }} />
          <Chip size="small" label="2개 변경" color="warning" icon={<EditIcon />} />
          <Button variant="outlined" size="small" startIcon={<RestoreIcon />}>되돌리기</Button>
          <Button variant="contained" size="small" startIcon={<SaveIcon />}>저장</Button>
        </Stack>
      </Box>

      <TableContainer component={Paper} variant="outlined" square sx={{ flex: 1, m: 1 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 700, backgroundColor: 'grey.100' } }}>
              <TableCell>주문번호</TableCell>
              <TableCell>거래처</TableCell>
              <TableCell>품목</TableCell>
              <TableCell align="right">수량</TableCell>
              <TableCell align="center" sx={{ width: 140 }}>납기일</TableCell>
              <TableCell align="center">긴급</TableCell>
              <TableCell align="center">우선순위</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r, i) => {
              const isEdited = i === 1 || i === 3;
              return (
                <TableRow key={r.soNo} sx={{ backgroundColor: isEdited ? '#fff8f0' : 'transparent', '&:hover': { backgroundColor: isEdited ? '#ffeacf' : 'action.hover' } }}>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{r.soNo}</TableCell>
                  <TableCell>{r.accountNm}</TableCell>
                  <TableCell>{r.itemNm}</TableCell>
                  <TableCell align="right">{r.qty.toLocaleString()}</TableCell>
                  <TableCell align="center" sx={{ p: 0.5 }}>
                    <TextField size="small" defaultValue={r.dueDt}
                      inputProps={{ style: { fontFamily: 'monospace', textAlign: 'center', fontSize: 12, padding: '4px 6px' } }}
                      sx={{ width: 120, backgroundColor: isEdited ? '#fffefa' : 'transparent' }}
                    />
                  </TableCell>
                  <TableCell align="center"><Switch size="small" defaultChecked={i === 0} /></TableCell>
                  <TableCell align="center">
                    <TextField size="small" defaultValue={isEdited ? '1' : '3'} type="number"
                      inputProps={{ style: { textAlign: 'center', fontSize: 12, padding: '4px 6px', width: 40 } }}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </MockShell>
  );
}
