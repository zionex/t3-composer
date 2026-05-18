import React from 'react';
import {
  Box, Stack, Typography, Chip, Button, TextField,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Paper,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

import MockShell from '../_shared/MockShell';
import { ACCOUNTS, SALES_ORDERS, ITEMS } from '../_data/mockData';

export default function H2MasterDetailMockup() {
  const [selected, setSelected] = React.useState(ACCOUNTS[0].accountCd);
  const detailRows = SALES_ORDERS.filter((o) => o.accountCd === selected).map((o) => ({
    ...o,
    itemNm: ITEMS.find((it) => it.itemCd === o.itemCd)?.itemNm || '',
  }));
  const selectedAcct = ACCOUNTS.find((a) => a.accountCd === selected);

  return (
    <MockShell
      patternCode="h2_master_detail"
      patternLabel="h2 — 좌측 마스터 + 우측 디테일 (수평 분할)"
      layoutCategory="LAYOUT_H2"
      description="좌측 마스터 리스트에서 선택 → 우측 디테일 표시. 검색 영역은 좌측 상단에. CRM/사용자 관리."
    >
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {/* Left master */}
        <Box sx={{ width: 360, borderRight: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <Box sx={{ p: 1, backgroundColor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" spacing={1}>
              <TextField size="small" placeholder="거래처 검색..." sx={{ flex: 1 }} />
              <Button size="small" variant="contained"><SearchIcon fontSize="small" /></Button>
            </Stack>
          </Box>
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {ACCOUNTS.map((a) => (
              <Box
                key={a.accountCd}
                onClick={() => setSelected(a.accountCd)}
                sx={{
                  p: 1.5, borderBottom: '1px solid', borderColor: 'grey.100', cursor: 'pointer',
                  backgroundColor: selected === a.accountCd ? 'primary.light' : 'transparent',
                  color: selected === a.accountCd ? 'primary.contrastText' : 'inherit',
                  '&:hover': { backgroundColor: selected === a.accountCd ? 'primary.light' : 'action.hover' },
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography sx={{ fontWeight: 600 }}>{a.accountNm}</Typography>
                  <Chip size="small" label={a.region} variant={selected === a.accountCd ? 'filled' : 'outlined'} />
                </Stack>
                <Typography variant="caption" sx={{ display: 'block', mt: 0.25, fontFamily: 'monospace', opacity: 0.8 }}>
                  {a.accountCd} · {a.accountTp}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Right detail */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
          {selectedAcct && (
            <>
              <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h6">{selectedAcct.accountNm}</Typography>
                <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                  <Chip size="small" label={selectedAcct.accountCd} sx={{ fontFamily: 'monospace' }} />
                  <Chip size="small" label={selectedAcct.accountTp} color="primary" />
                  <Chip size="small" label={`지역 ${selectedAcct.region}`} />
                  <Typography variant="body2" color="text.secondary">
                    여신 한도: ₩ {selectedAcct.creditLimit.toLocaleString()}
                  </Typography>
                </Stack>
              </Box>
              <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, mt: 1 }}>관련 판매 주문 ({detailRows.length})</Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ '& th': { fontWeight: 700, backgroundColor: 'grey.100' } }}>
                        <TableCell>주문번호</TableCell>
                        <TableCell>품목</TableCell>
                        <TableCell align="right">수량</TableCell>
                        <TableCell align="right">금액</TableCell>
                        <TableCell align="center">납기</TableCell>
                        <TableCell align="center">상태</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {detailRows.length === 0 && (
                        <TableRow><TableCell colSpan={6} align="center" sx={{ color: 'text.disabled', py: 4 }}>관련 주문이 없습니다</TableCell></TableRow>
                      )}
                      {detailRows.map((r) => (
                        <TableRow key={r.soNo} hover>
                          <TableCell sx={{ fontFamily: 'monospace' }}>{r.soNo}</TableCell>
                          <TableCell>{r.itemNm}</TableCell>
                          <TableCell align="right">{r.qty.toLocaleString()}</TableCell>
                          <TableCell align="right">₩ {r.amount.toLocaleString()}</TableCell>
                          <TableCell align="center" sx={{ fontFamily: 'monospace' }}>{r.dueDt}</TableCell>
                          <TableCell align="center"><Chip size="small" label={r.status} color={r.status === '진행중' ? 'info' : (r.status === '출하완료' ? 'success' : 'default')} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </>
          )}
        </Box>
      </Box>
    </MockShell>
  );
}
