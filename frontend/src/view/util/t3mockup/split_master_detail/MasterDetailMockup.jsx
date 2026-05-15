import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Chip, Typography,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Paper,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

import MockShell from '../_shared/MockShell';
import { SALES_ORDERS, ACCOUNTS, ITEMS, WORK_ORDERS } from '../_data/mockData';

export default function MasterDetailMockup() {
  const [selectedSo, setSelectedSo] = React.useState(SALES_ORDERS[0].soNo);
  const masterRows = SALES_ORDERS.map((o) => ({
    ...o,
    accountNm: ACCOUNTS.find((a) => a.accountCd === o.accountCd)?.accountNm || '',
    itemNm:    ITEMS.find((it) => it.itemCd === o.itemCd)?.itemNm || '',
  }));
  const selectedSO = masterRows.find((r) => r.soNo === selectedSo);
  // 더미 detail: 동일 itemCd 의 WO 와 연관 행
  const detailRows = selectedSO ? WORK_ORDERS.filter((wo) => wo.itemCd === selectedSO.itemCd) : [];

  return (
    <MockShell
      patternCode="split_master_detail"
      patternLabel="v2 — 마스터·디테일 (분할)"
      layoutCategory="LAYOUT_V2"
      description="상단 마스터 그리드에서 행 선택 시 하단 디테일 그리드 갱신. SplitPanel 또는 단순 stack 으로 구현."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="조회 기간" size="small" value="2026-04-01 ~ 2026-04-30" sx={{ width: 220 }} />
          <TextField label="상태" size="small" select value="" sx={{ width: 130 }}>
            <MenuItem value="">전체</MenuItem>
            <MenuItem value="진행중">진행중</MenuItem>
            <MenuItem value="출하완료">출하완료</MenuItem>
          </TextField>
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
        </Stack>
      </Box>

      {/* Master (상단 45%) */}
      <Box sx={{ flex: '0 0 45%', display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', borderBottom: '2px solid', borderColor: 'divider' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2, py: 0.75, backgroundColor: 'grey.50' }}>
          <Typography variant="subtitle2">📦 마스터 — 판매 주문 (SO)</Typography>
          <Typography variant="caption" color="text.secondary">{masterRows.length}건</Typography>
        </Stack>
        <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, backgroundColor: 'grey.100' } }}>
                <TableCell>주문번호</TableCell>
                <TableCell>거래처</TableCell>
                <TableCell>품목</TableCell>
                <TableCell align="right">수량</TableCell>
                <TableCell align="right">금액</TableCell>
                <TableCell align="center">납기일</TableCell>
                <TableCell align="center">상태</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {masterRows.map((r) => (
                <TableRow
                  key={r.soNo}
                  hover
                  onClick={() => setSelectedSo(r.soNo)}
                  selected={r.soNo === selectedSo}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell sx={{ fontFamily: 'monospace' }}>{r.soNo}</TableCell>
                  <TableCell>{r.accountNm}</TableCell>
                  <TableCell>{r.itemNm}</TableCell>
                  <TableCell align="right">{r.qty.toLocaleString()}</TableCell>
                  <TableCell align="right">₩ {r.amount.toLocaleString()}</TableCell>
                  <TableCell align="center" sx={{ fontFamily: 'monospace' }}>{r.dueDt}</TableCell>
                  <TableCell align="center">
                    <Chip size="small" label={r.status} color={r.status === '진행중' ? 'info' : (r.status === '출하완료' ? 'success' : 'default')} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Detail (하단 55%) */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ px: 2, py: 0.75, backgroundColor: 'grey.50' }}>
          <Typography variant="subtitle2">🔍 디테일 — 연관 작업지시 (WO)</Typography>
          {selectedSO && (
            <Stack direction="row" spacing={1}>
              <Chip size="small" label={`SO: ${selectedSO.soNo}`} sx={{ fontFamily: 'monospace' }} />
              <Chip size="small" label={selectedSO.itemNm} color="primary" />
              <Typography variant="caption" color="text.secondary">관련 WO {detailRows.length}건</Typography>
            </Stack>
          )}
        </Stack>
        <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, backgroundColor: 'grey.100' } }}>
                <TableCell>WO 번호</TableCell>
                <TableCell>거점</TableCell>
                <TableCell align="right">수량</TableCell>
                <TableCell align="center">시작일</TableCell>
                <TableCell align="center">종료일</TableCell>
                <TableCell align="center">상태</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {detailRows.length === 0 && (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.disabled' }}>관련 WO 가 없습니다</TableCell></TableRow>
              )}
              {detailRows.map((wo) => (
                <TableRow key={wo.woNo} hover>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{wo.woNo}</TableCell>
                  <TableCell>{wo.locatCd}</TableCell>
                  <TableCell align="right">{wo.qty.toLocaleString()}</TableCell>
                  <TableCell align="center" sx={{ fontFamily: 'monospace' }}>{wo.startDt}</TableCell>
                  <TableCell align="center" sx={{ fontFamily: 'monospace' }}>{wo.endDt}</TableCell>
                  <TableCell align="center">
                    <Chip size="small" label={wo.status}
                          color={wo.status === 'DONE' ? 'success' : (wo.status === 'INPROG' ? 'warning' : 'default')} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </MockShell>
  );
}
