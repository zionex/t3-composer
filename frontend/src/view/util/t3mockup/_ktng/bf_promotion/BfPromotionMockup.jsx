import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography, Chip,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Paper, Checkbox,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SaveIcon from '@mui/icons-material/Save';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import MockShell from '../../_shared/MockShell';
import { cellSx } from '../../_shared/styleCallback';

// BfKtng01 (한국 프로모션 계획), BfKtng02 (해외 프로모션 계획) 공통 패턴
// SALES_ORG · ACCOUNT · ITEM_LV3 · START_DT · END_DT · PROMOTION_TYPE · DISCOUNT_RATE · DESCRIPTION

const COLUMNS = [
  { name: 'SALES_ORG',      label: 'SALES_ORG',      width: 100, align: 'center', group: 'ORG' },
  { name: 'CHANNEL',        label: 'CHANNEL',        width: 100, align: 'left',   group: 'ACCOUNT' },
  { name: 'ACCOUNT_CD',     label: 'ACCOUNT_CD',     width: 110, align: 'center', group: 'ACCOUNT' },
  { name: 'ACCOUNT_NM',     label: 'ACCOUNT_NM',     width: 130, align: 'left',   group: 'ACCOUNT' },
  { name: 'ITEM_LV3_CD',    label: 'ITEM_LV3_CD',    width: 110, align: 'center', group: 'ITEM_LV' },
  { name: 'ITEM_LV3_NM',    label: 'ITEM_LV3_NM',    width: 130, align: 'left',   group: 'ITEM_LV' },
  { name: 'START_DT',       label: 'START_DT',       width: 95,  align: 'center' },
  { name: 'END_DT',         label: 'END_DT',         width: 95,  align: 'center' },
  { name: 'PROMOTION_TYPE', label: 'PROMOTION_TYPE', width: 130, align: 'center' },
  { name: 'DISCOUNT_RATE',  label: 'DISCOUNT_RATE',  width: 100, align: 'right' },
  { name: 'DESCRIPTION',    label: 'DESCRIPTION',    width: 180, align: 'left' },
];

const ROWS = [
  { SALES_ORG: 'KT&G',  CHANNEL: '편의점', ACCOUNT_CD: 'CU',     ACCOUNT_NM: 'CU',         ITEM_LV3_CD: 'KING-RED', ITEM_LV3_NM: '레드 시리즈', START_DT: '2026-05-01', END_DT: '2026-05-31', PROMOTION_TYPE: '1+1 행사',    DISCOUNT_RATE: 50.0, DESCRIPTION: '레드 클래식 1+1 프로모션' },
  { SALES_ORG: 'KT&G',  CHANNEL: '편의점', ACCOUNT_CD: 'GS25',   ACCOUNT_NM: 'GS25',       ITEM_LV3_CD: 'KING-BLU', ITEM_LV3_NM: '블루 시리즈', START_DT: '2026-05-15', END_DT: '2026-06-14', PROMOTION_TYPE: '가격 할인',    DISCOUNT_RATE: 10.0, DESCRIPTION: '신제품 출시 기념 10% 할인' },
  { SALES_ORG: 'KT&G',  CHANNEL: '편의점', ACCOUNT_CD: 'SEVEN',  ACCOUNT_NM: '세븐일레븐',  ITEM_LV3_CD: 'NGP-DEV',  ITEM_LV3_NM: 'illuvia',     START_DT: '2026-06-01', END_DT: '2026-06-30', PROMOTION_TYPE: '디바이스 무료', DISCOUNT_RATE: 100.0, DESCRIPTION: 'illuvia 디바이스 무료 증정 (스틱 구매 시)' },
  { SALES_ORG: 'KT&G',  CHANNEL: '슈퍼',   ACCOUNT_CD: 'EMART',  ACCOUNT_NM: '이마트',     ITEM_LV3_CD: 'KING-RED', ITEM_LV3_NM: '레드 시리즈', START_DT: '2026-06-15', END_DT: '2026-07-15', PROMOTION_TYPE: '가격 할인',    DISCOUNT_RATE:  5.0, DESCRIPTION: '대형마트 한정 5% 할인' },
  { SALES_ORG: 'KT&G',  CHANNEL: '편의점', ACCOUNT_CD: 'MINISTOP',ACCOUNT_NM: '미니스톱',  ITEM_LV3_CD: 'KING-BLU', ITEM_LV3_NM: '블루 시리즈', START_DT: '2026-07-01', END_DT: '2026-07-31', PROMOTION_TYPE: '쿠폰 발급',    DISCOUNT_RATE: 15.0, DESCRIPTION: '여름 시즌 15% 쿠폰' },
  { SALES_ORG: 'KT&G',  CHANNEL: '온라인', ACCOUNT_CD: 'COUPANG',ACCOUNT_NM: '쿠팡',      ITEM_LV3_CD: 'NGP-STICK',ITEM_LV3_NM: 'illuvia 스틱',START_DT: '2026-07-15', END_DT: '2026-08-15', PROMOTION_TYPE: '묶음 할인',    DISCOUNT_RATE: 20.0, DESCRIPTION: '20개입 묶음 20% 할인' },
];

// 컬럼 그룹 헤더 (BfKtng01.jsx 의 dataType:'group' 패턴 모사)
const GROUPS = [
  { label: 'ORG',     span: 1, color: '#e3f2fd' },
  { label: 'ACCOUNT', span: 3, color: '#fff3e0' },
  { label: 'ITEM_LV', span: 2, color: '#f3e5f5' },
  { label: '기간',     span: 2, color: '#e8f5e9' },
  { label: '프로모션', span: 3, color: '#fce4ec' },
];

export default function BfPromotionMockup() {
  return (
    <MockShell
      patternCode="ktng_bf_promotion"
      patternLabel="KTNG — BF 프로모션 계획 (BfKtng01/02)"
      layoutCategory="LAYOUT_SINGLE"
      description="한국/해외 프로모션 계획 — 거래처-품목 LV3 단위로 기간·프로모션 유형·할인율 등록. 컬럼 그룹 헤더 (ORG/ACCOUNT/ITEM_LV/기간/프로모션) 패턴."
    >
      {/* SearchArea */}
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="SALES_ORG" size="small" select value="KT&G" sx={{ width: 140 }}>
            <MenuItem value="KT&G">KT&G 국내</MenuItem>
            <MenuItem value="GLOBAL">KT&G GLOBAL</MenuItem>
          </TextField>
          <TextField label="ACCOUNT" size="small" select value="ALL" sx={{ width: 140 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="CU">CU</MenuItem>
            <MenuItem value="GS25">GS25</MenuItem>
          </TextField>
          <TextField label="ITEM_LV3" size="small" value="" sx={{ width: 150 }} placeholder="품목 LV3 검색" />
          <TextField label="START_DT" size="small" type="date" value="2026-05-01" InputLabelProps={{ shrink: true }} sx={{ width: 160 }} />
          <TextField label="END_DT"   size="small" type="date" value="2026-08-31" InputLabelProps={{ shrink: true }} sx={{ width: 160 }} />
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
        </Stack>
      </Box>

      {/* ButtonArea */}
      <Box sx={{ px: 1.5, py: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <LocalOfferIcon fontSize="small" color="warning" />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{ROWS.length} 건 등록</Typography>
        </Stack>
        <Box sx={{ flexGrow: 1 }} />
        <Stack direction="row" spacing={0.75}>
          <Button variant="outlined" size="small" startIcon={<AddIcon />}>추가</Button>
          <Button variant="outlined" size="small" startIcon={<DeleteOutlineIcon />} color="error">삭제</Button>
          <Button variant="outlined" size="small" startIcon={<SaveIcon />} color="primary">저장</Button>
          <Button variant="outlined" size="small" color="secondary">수요예측 인자 반영</Button>
        </Stack>
      </Box>

      {/* Grid with group headers */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 1 }}>
        <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: '100%' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              {/* Group header row */}
              <TableRow>
                <TableCell padding="checkbox" sx={{ backgroundColor: 'grey.200', borderBottom: '2px solid', borderColor: 'divider' }} rowSpan={2}><Checkbox size="small" disabled /></TableCell>
                <TableCell sx={{ backgroundColor: 'grey.200', textAlign: 'center', fontWeight: 700, borderBottom: '2px solid', borderColor: 'divider' }} rowSpan={2}>#</TableCell>
                {GROUPS.map((g) => (
                  <TableCell key={g.label} colSpan={g.span} sx={{ backgroundColor: g.color, textAlign: 'center', fontWeight: 700, borderRight: '1px solid', borderColor: 'divider' }}>
                    {g.label}
                  </TableCell>
                ))}
              </TableRow>
              {/* Detail header row */}
              <TableRow>
                {COLUMNS.map((c) => (
                  <TableCell key={c.name} sx={{ backgroundColor: 'grey.100', width: c.width, fontWeight: 600, textAlign: c.align, fontSize: 12 }}>
                    {c.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {ROWS.map((r, i) => {
                // 운영 BfKtng01/02 styleCallback editable 셀:
                //   SALES_ORG, PROMOTION_TYPE, ITEM_LV3_CD/ITEM_CD, ITEM_LV3_NM/ITEM_NM, END_DT → cellSx('info')
                //   DISCOUNT_RATE → cellSx('warning')  (할인율 의미 강조)
                const EDITABLE_INFO = new Set(['SALES_ORG', 'PROMOTION_TYPE', 'ITEM_LV3_CD', 'ITEM_LV3_NM', 'END_DT']);
                return (
                  <TableRow key={i} hover>
                    <TableCell padding="checkbox"><Checkbox size="small" disabled /></TableCell>
                    <TableCell sx={{ textAlign: 'center', color: 'text.secondary' }}>{i + 1}</TableCell>
                    {COLUMNS.map((c) => {
                      const v = r[c.name] ?? '-';
                      const isNum = c.name === 'DISCOUNT_RATE';
                      const isCode = c.name.endsWith('_CD') || c.name.endsWith('_DT');
                      if (isNum) {
                        return (
                          <TableCell key={c.name} sx={cellSx('warning', { mono: true, align: c.align })}>
                            {`${v.toFixed(1)}%`}
                          </TableCell>
                        );
                      }
                      if (EDITABLE_INFO.has(c.name)) {
                        return (
                          <TableCell key={c.name}
                            sx={cellSx('info', { mono: isCode, align: c.align })}>
                            {v}
                          </TableCell>
                        );
                      }
                      return (
                        <TableCell key={c.name}
                          sx={{ textAlign: c.align,
                                fontFamily: isCode ? 'monospace' : 'inherit' }}>
                          {v}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </MockShell>
  );
}
