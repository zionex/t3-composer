import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography, Paper, Chip, Tabs, Tab,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MockShell from '../../_shared/MockShell';
import { cellSx } from '../../_shared/styleCallback';

// OronRp01 — 분배요청 입력/조회 (물류센터/영업소/추가의뢰)
// UI_RP_ORN_01, 05, 06, 07, 08, 09, 10, 11

const TABS = [
  { key: 'order',     label: '주문 입력' },
  { key: 'order_view',label: '주문 조회' },
  { key: 'special',   label: '특정 분배 요청' },
  { key: 'special_cnf',label: '특정 요청 확정' },
  { key: 'transfer',  label: '추가의뢰' },
  { key: 'master',    label: '거점 기준정보' },
];

const ORDERS = [
  { ORD_NO: 'OR-2026-1024', CENTER: '대전물류센터',  ITEM_CD: 'F01001', ITEM_NM: '오론 비건마스크 5매',  REQ_QTY: 2500, REQ_DT: '2026-06-03', PRIO: 1, STATUS: 'PENDING',  REQ_BY: '권민호' },
  { ORD_NO: 'OR-2026-1025', CENTER: '광주영업소',    ITEM_CD: 'F01002', ITEM_NM: '오론 세럼 30ml',       REQ_QTY:  800, REQ_DT: '2026-06-03', PRIO: 2, STATUS: 'APPROVED', REQ_BY: '신해리' },
  { ORD_NO: 'OR-2026-1026', CENTER: '부산영업소',    ITEM_CD: 'F01001', ITEM_NM: '오론 비건마스크 5매',  REQ_QTY: 1500, REQ_DT: '2026-06-04', PRIO: 1, STATUS: 'APPROVED', REQ_BY: '강성진' },
  { ORD_NO: 'OR-2026-1027', CENTER: '제주영업소',    ITEM_CD: 'F02001', ITEM_NM: '오론 클렌징폼 150g',   REQ_QTY:  500, REQ_DT: '2026-06-05', PRIO: 3, STATUS: 'PENDING',  REQ_BY: '오지연' },
  { ORD_NO: 'OR-2026-1028', CENTER: '익산물류',      ITEM_CD: 'F03001', ITEM_NM: 'OEM 선크림 SPF50+',    REQ_QTY: 3000, REQ_DT: '2026-06-04', PRIO: 1, STATUS: 'URGENT',   REQ_BY: '백성호' },
  { ORD_NO: 'OR-2026-1029', CENTER: '대전물류센터',  ITEM_CD: 'F01003', ITEM_NM: '오론 토너 200ml',      REQ_QTY: 1200, REQ_DT: '2026-06-06', PRIO: 2, STATUS: 'PENDING',  REQ_BY: '권민호' },
  { ORD_NO: 'OR-2026-1030', CENTER: '부산영업소',    ITEM_CD: 'F04002', ITEM_NM: '오론 슬리핑팩 50ml',   REQ_QTY:  600, REQ_DT: '2026-06-07', PRIO: 4, STATUS: 'PENDING',  REQ_BY: '강성진' },
];

const STATUS_COLOR = {
  PENDING:  'default',
  APPROVED: 'primary',
  URGENT:   'error',
  REJECTED: 'warning',
};

const PRIO_COLOR = (p) => p === 1 ? 'error' : p === 2 ? 'warning' : p === 3 ? 'info' : 'default';

export default function OronRpRequestMockup() {
  const [tab, setTab] = React.useState(0);
  return (
    <MockShell
      patternCode="oron_rp_request"
      patternLabel="ORON — 분배요청/주문 입력·조회·확정"
      layoutCategory="LAYOUT_SINGLE"
      description="물류센터·영업소 주문 입력 → 조회 → 특정 분배 요청/확정 → 추가의뢰 → 거점 기준정보. 6개 탭 통합. UI_RP_ORN_01, 05, 06, 07, 08, 09, 10, 11."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="물류센터" size="small" select value="ALL" sx={{ width: 150 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="DJ">대전물류센터</MenuItem>
            <MenuItem value="IS">익산물류</MenuItem>
          </TextField>
          <TextField label="품목" size="small" placeholder="F01001" sx={{ width: 130 }} />
          <TextField label="우선순위" size="small" select value="ALL" sx={{ width: 110 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="1">긴급</MenuItem>
          </TextField>
          <TextField label="상태" size="small" select value="ALL" sx={{ width: 110 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="PENDING">대기</MenuItem>
            <MenuItem value="APPROVED">승인</MenuItem>
          </TextField>
          <TextField label="기간" size="small" value="2026-06-03 ~ 06-07" sx={{ width: 200 }} />
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="outlined" size="small" startIcon={<AddIcon />}>주문 등록</Button>
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
        </Stack>
      </Box>

      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 1.5 }}>
        <Tabs value={tab} onChange={(_e, v) => setTab(v)} variant="scrollable">
          {TABS.map((t) => <Tab key={t.key} label={t.label} />)}
        </Tabs>
      </Box>

      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1, height: '100%' }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{TABS[tab].label} — 7건</Typography>
          <Chip label="대기 4" size="small" variant="outlined" />
          <Chip label="승인 2" size="small" color="primary" variant="outlined" />
          <Chip label="긴급 1" size="small" color="error" />
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" color="success" startIcon={<CheckCircleIcon />}>일괄 승인</Button>
          <Button variant="contained" size="small" startIcon={<SaveIcon />}>저장</Button>
        </Stack>

        <Paper variant="outlined" sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" sx={{ backgroundColor: 'grey.100' }}> </TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 140, textAlign: 'center' }}>주문번호</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 140, textAlign: 'center' }}>요청 거점</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 100, textAlign: 'center' }}>품목</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 200 }}>품목명</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 100, textAlign: 'right' }}>요청수량</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 110, textAlign: 'center' }}>요청일</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 80, textAlign: 'center' }}>우선순위</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 110, textAlign: 'center' }}>상태</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 90, textAlign: 'center' }}>요청자</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ORDERS.map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell padding="checkbox"> </TableCell>
                    <TableCell sx={cellSx('info', { align: 'center', mono: true })}>{r.ORD_NO}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontSize: 12 }}>{r.CENTER}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace' }}>{r.ITEM_CD}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{r.ITEM_NM}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>{r.REQ_QTY.toLocaleString()}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace' }}>{r.REQ_DT}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}><Chip label={`P${r.PRIO}`} size="small" color={PRIO_COLOR(r.PRIO)} variant="outlined" /></TableCell>
                    <TableCell sx={{ textAlign: 'center' }}><Chip label={r.STATUS} size="small" color={STATUS_COLOR[r.STATUS] || 'default'} /></TableCell>
                    <TableCell sx={{ textAlign: 'center', fontSize: 12 }}>{r.REQ_BY}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </MockShell>
  );
}
