import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography, Paper, Chip, Tabs, Tab,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import VerifiedIcon from '@mui/icons-material/Verified';
import MockShell from '../../_shared/MockShell';
import { cellSx } from '../../_shared/styleCallback';

// OronPk01 — 포장재 제품/반제품/자재/자원 기준정보
// UI_PK_ORN_PACK_MGMT, HALB_MGMT, MAT_MGMT, RES_MGMT, BOR, BOM, CALENDAR, WORK_HOUR, DATA_VALID, STOCK

const TABS = [
  { key: 'pack', label: '포장재 제품',  count: 524 },
  { key: 'halb', label: '포장재 반제품', count: 312 },
  { key: 'mat',  label: '원/부자재',    count: 1085 },
  { key: 'res',  label: '공정/라인',    count: 36 },
  { key: 'bor',  label: '라인 생산능력', count: 280 },
  { key: 'cal',  label: '자원 캘린더',  count: '-' },
  { key: 'stock',label: '제품별 재고',  count: '-' },
];

const PACK_ROWS = [
  { ITEM_CD: 'PK10001', ITEM_NM: '오론 마스크 단상자',          PROC: '인쇄+분단', SIZE: '150x90x8',  MAT: '백상지 250g', VENDOR: '동양인쇄',  USE: 'Y', PRICE: 280 },
  { ITEM_CD: 'PK10002', ITEM_NM: '오론 세럼 30ml 단상자',       PROC: '인쇄+분단', SIZE: '60x40x100', MAT: '백상지 300g', VENDOR: '동양인쇄',  USE: 'Y', PRICE: 320 },
  { ITEM_CD: 'PK20001', ITEM_NM: '오론 알루미늄 파우치 5매용',   PROC: '인쇄+가공', SIZE: '110x150',   MAT: 'AL/PE 복합',  VENDOR: '대성포장',  USE: 'Y', PRICE: 180 },
  { ITEM_CD: 'PK20002', ITEM_NM: '오론 토너 200ml 라벨',         PROC: '인쇄',     SIZE: '180x55',    MAT: '아트지 80g',  VENDOR: '삼성라벨',  USE: 'Y', PRICE:  45 },
  { ITEM_CD: 'PK30001', ITEM_NM: '튜브 50ml (선크림)',           PROC: '가공',     SIZE: 'Φ30x120',   MAT: 'PE/EVOH',     VENDOR: 'KS튜브',    USE: 'Y', PRICE: 320 },
  { ITEM_CD: 'PK30002', ITEM_NM: '튜브 100ml (클렌징)',          PROC: '가공',     SIZE: 'Φ35x150',   MAT: 'PE/EVOH',     VENDOR: 'KS튜브',    USE: 'N', PRICE: 380 },
  { ITEM_CD: 'PK40001', ITEM_NM: '운반상자 BOX (24EA)',          PROC: '분단',     SIZE: '450x300x250', MAT: '골판지 5중', VENDOR: '한국포장', USE: 'Y', PRICE: 850 },
  { ITEM_CD: 'PK40002', ITEM_NM: '운반상자 BOX (12EA)',          PROC: '분단',     SIZE: '300x250x200', MAT: '골판지 5중', VENDOR: '한국포장', USE: 'Y', PRICE: 620 },
];

const STATUS_COLOR = { Y: 'success', N: 'default' };

export default function OronPkMasterMockup() {
  const [tab, setTab] = React.useState(0);
  return (
    <MockShell
      patternCode="oron_pk_master"
      patternLabel="ORON — 포장재 기준정보 (제품/반제품/자재/자원/재고)"
      layoutCategory="LAYOUT_SINGLE"
      description="포장재 계획 기준정보 7개 탭 통합 CRUD. 인쇄→가공→분단 공정 체인. UI_PK_ORN_PACK_MGMT, HALB_MGMT, MAT_MGMT, RES_MGMT, BOR, CALENDAR, WORK_HOUR, DATA_VALID, STOCK."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="공정" size="small" select value="ALL" sx={{ width: 130 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="PRINT">인쇄</MenuItem>
            <MenuItem value="PROC">가공</MenuItem>
            <MenuItem value="CUT">분단</MenuItem>
          </TextField>
          <TextField label="거래처" size="small" select value="ALL" sx={{ width: 150 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="DY">동양인쇄</MenuItem>
            <MenuItem value="DS">대성포장</MenuItem>
          </TextField>
          <TextField label="품목명" size="small" placeholder="검색어" sx={{ width: 200 }} />
          <TextField label="사용여부" size="small" select value="Y" sx={{ width: 110 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="Y">사용</MenuItem>
            <MenuItem value="N">미사용</MenuItem>
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="outlined" size="small" startIcon={<VerifiedIcon />}>기준정보 검증</Button>
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
        </Stack>
      </Box>

      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 1.5 }}>
        <Tabs value={tab} onChange={(_e, v) => setTab(v)} variant="scrollable">
          {TABS.map((t) => (
            <Tab key={t.key} label={<Stack direction="row" alignItems="center" spacing={0.8}><span>{t.label}</span><Chip size="small" label={typeof t.count === 'number' ? t.count.toLocaleString() : t.count} variant="outlined" /></Stack>} />
          ))}
        </Tabs>
      </Box>

      <Box sx={{ p: 1.5, height: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{TABS[tab].label}</Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Button size="small" variant="outlined" startIcon={<AddIcon />}>행 추가</Button>
          <Button size="small" variant="contained" startIcon={<SaveIcon />}>저장</Button>
        </Stack>
        <Paper variant="outlined" sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" sx={{ backgroundColor: 'grey.100' }}> </TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 110, textAlign: 'center' }}>품목코드</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 260 }}>품목명</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 110, textAlign: 'center' }}>공정</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 130, textAlign: 'center' }}>규격</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 130 }}>재질</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 110 }}>거래처</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 80, textAlign: 'right' }}>단가</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 80, textAlign: 'center' }}>사용</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {PACK_ROWS.map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell padding="checkbox"> </TableCell>
                    <TableCell sx={cellSx('info', { align: 'center', mono: true })}>{r.ITEM_CD}</TableCell>
                    <TableCell>{r.ITEM_NM}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{r.PROC}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 11 }}>{r.SIZE}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{r.MAT}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{r.VENDOR}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>₩{r.PRICE.toLocaleString()}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Chip label={r.USE} size="small" color={STATUS_COLOR[r.USE]} variant="outlined" />
                    </TableCell>
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
