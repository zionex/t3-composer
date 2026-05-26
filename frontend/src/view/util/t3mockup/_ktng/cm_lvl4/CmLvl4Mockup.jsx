import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography, Chip,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Paper, Tabs, Tab, Checkbox,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import SaveIcon from '@mui/icons-material/Save';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import MockShell from '../../_shared/MockShell';

// CmKtng09 (Lvl4 코드&속성 관리), CmKtng10 (Lvl4 생산지별 공헌이익), CmKtng11 (Lvl4 Unmapping 리스트)
// 3개 화면을 좌측 트리(Lvl4 생산지 코드) + 우측 탭 (속성/공헌이익/Unmapping) 으로 통합

const LVL4_TREE = [
  { code: 'L4-KR-SH', name: '신탄진 공장',     cnt: 28, status: 'normal' },
  { code: 'L4-KR-DJ', name: '대전 공장',        cnt: 22, status: 'normal' },
  { code: 'L4-KR-GJ', name: '광주 공장',        cnt: 18, status: 'normal' },
  { code: 'L4-GL-ID', name: '인도네시아',       cnt: 14, status: 'normal' },
  { code: 'L4-GL-MN', name: '몽골',             cnt: 8,  status: 'warning' },
  { code: 'L4-GL-IN', name: '인도',             cnt: 12, status: 'normal' },
  { code: 'L4-??-??', name: '미매핑 (UNMAPPED)', cnt: 5,  status: 'error' },
];

// 우측 탭 1 — 코드&속성
const ATTR_COLS = [
  { name: 'attr',  label: '속성',        width: 160, align: 'left' },
  { name: 'value', label: '값',          width: 200, align: 'left' },
  { name: 'editable', label: '편집 가능', width: 100, align: 'center' },
];
const ATTRS = [
  { attr: 'Lvl 4 코드',         value: 'L4-KR-SH',         editable: 'N' },
  { attr: '생산지 명',           value: '신탄진 공장',       editable: 'N' },
  { attr: '국가',                value: '대한민국 (KR)',     editable: 'N' },
  { attr: '법인',                value: 'KT&G 국내',         editable: 'Y' },
  { attr: '통화',                value: 'KRW',              editable: 'Y' },
  { attr: '재료비 표준 단가',    value: '3.21원/본',         editable: 'Y' },
  { attr: '마킹비 표준 단가',    value: '0.68원/본',         editable: 'Y' },
  { attr: '관세 적용 여부',      value: 'N',                editable: 'Y' },
  { attr: '하이퍼 인플레이션',   value: 'N',                editable: 'Y' },
  { attr: '활성 여부',           value: 'Y',                editable: 'Y' },
];

// 우측 탭 2 — Unmapping 리스트
const UNMAPPED_COLS = [
  { name: 'ITEM_CD',    label: 'ITEM_CD',    width: 130, align: 'center' },
  { name: 'ITEM_NM',    label: 'ITEM_NM',    width: 200, align: 'left' },
  { name: 'PROD_SITE',  label: '발견 생산지',width: 130, align: 'left' },
  { name: 'PROD_QTY',   label: '생산수량',   width: 110, align: 'right' },
  { name: 'PROD_AMT',   label: '추정 금액',   width: 110, align: 'right' },
  { name: 'DAYS_OPEN',  label: '미매핑일수', width: 100, align: 'right' },
  { name: 'SUGG_LVL4',  label: '추천 Lvl4',  width: 120, align: 'left' },
];
const UNMAPPED = [
  { ITEM_CD: 'TL-RD-077', ITEM_NM: '레드 한정판 골드 20pcs', PROD_SITE: '신탄진 공장',   PROD_QTY:  85000, PROD_AMT: 272.9, DAYS_OPEN: 12, SUGG_LVL4: 'L4-KR-SH' },
  { ITEM_CD: 'EQ-IL-208', ITEM_NM: 'illuvia 디바이스 V4 한정', PROD_SITE: '대전 공장',     PROD_QTY:  42000, PROD_AMT: 168.0, DAYS_OPEN:  8, SUGG_LVL4: 'L4-KR-DJ' },
  { ITEM_CD: 'TL-EX-512', ITEM_NM: '수출 KING-SIZE 100mm 신규', PROD_SITE: '인도네시아', PROD_QTY: 320000, PROD_AMT: 944.0, DAYS_OPEN: 25, SUGG_LVL4: 'L4-GL-ID' },
  { ITEM_CD: 'TL-MN-901', ITEM_NM: '몽골 한정 라이트',         PROD_SITE: '몽골',          PROD_QTY:  18500, PROD_AMT:  44.4, DAYS_OPEN: 35, SUGG_LVL4: 'L4-GL-MN' },
  { ITEM_CD: 'NEW-001',   ITEM_NM: '신제품 코드 미정',         PROD_SITE: '미확인',         PROD_QTY:   5200, PROD_AMT:  18.7, DAYS_OPEN: 45, SUGG_LVL4: '?'        },
];

export default function CmLvl4Mockup() {
  return (
    <MockShell
      patternCode="ktng_cm_lvl4"
      patternLabel="KTNG — Lvl 4 코드 / 공헌이익 / Unmapping (CmKtng09/10/11)"
      layoutCategory="LAYOUT_H2"
      description="좌측 Lvl 4 생산지 트리 + 우측 탭 (속성 관리 · 생산지별 공헌이익 · Unmapping 리스트). 3개 KTNG CM 화면을 트리 + 탭 패턴으로 통합."
    >
      {/* SearchArea */}
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="회계 연월" size="small" value="2026-05" sx={{ width: 130 }} />
          <TextField label="활성 여부" size="small" select value="Y" sx={{ width: 100 }}>
            <MenuItem value="">전체</MenuItem>
            <MenuItem value="Y">Y</MenuItem>
            <MenuItem value="N">N</MenuItem>
          </TextField>
          <TextField label="국가" size="small" select value="ALL" sx={{ width: 110 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="KR">대한민국</MenuItem>
            <MenuItem value="GLOBAL">해외</MenuItem>
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
        </Stack>
      </Box>

      {/* H2 split */}
      <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left tree */}
        <Paper variant="outlined" sx={{ width: 240, m: 1.5, mr: 0.75, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Lvl 4 생산지</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{LVL4_TREE.length}개</Typography>
          </Box>
          <Box sx={{ flexGrow: 1, overflow: 'auto', p: 0.5 }}>
            {LVL4_TREE.map((n, i) => {
              const sel = i === 0;
              return (
                <Box key={n.code}
                  sx={{
                    p: 1, mb: 0.5, borderRadius: 1,
                    backgroundColor: sel ? 'primary.light' : 'transparent',
                    color: sel ? 'primary.contrastText' : 'inherit',
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: sel ? 'primary.main' : 'transparent',
                  }}>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    {n.status === 'warning' && <WarningAmberIcon fontSize="small" color="warning" />}
                    {n.status === 'error' && <WarningAmberIcon fontSize="small" color="error" />}
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: 11 }}>{n.code}</Typography>
                    <Box sx={{ flexGrow: 1 }} />
                    <Chip size="small" label={n.cnt} sx={{ height: 18, fontSize: 10 }} />
                  </Stack>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13, mt: 0.3 }}>{n.name}</Typography>
                </Box>
              );
            })}
          </Box>
        </Paper>

        {/* Right content with tabs */}
        <Box sx={{ flexGrow: 1, m: 1.5, ml: 0.75, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
            <Tabs value={2} variant="standard">
              <Tab label="속성 관리 (CmKtng09)" />
              <Tab label="생산지별 공헌이익 (CmKtng10)" />
              <Tab label="Unmapping 리스트 (CmKtng11)" />
            </Tabs>
            <Box sx={{ flexGrow: 1 }} />
            <Stack direction="row" spacing={0.5} sx={{ pr: 1 }}>
              <Button size="small" startIcon={<SaveIcon />}>저장</Button>
              <Button size="small" startIcon={<DownloadIcon />}>Excel</Button>
            </Stack>
          </Box>

          {/* Active tab — Unmapping list */}
          <Box sx={{ flexGrow: 1, overflow: 'auto', mt: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <WarningAmberIcon color="error" fontSize="small" />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>미매핑 품목 — {UNMAPPED.length}건 / 추정 금액 합계 1,447.0K원</Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Button size="small" variant="outlined" color="warning">추천 Lvl4 일괄 적용</Button>
            </Stack>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox" sx={{ backgroundColor: 'grey.100' }}><Checkbox size="small" disabled /></TableCell>
                    {UNMAPPED_COLS.map((c) => (
                      <TableCell key={c.name} sx={{ backgroundColor: 'grey.100', width: c.width, fontWeight: 700, textAlign: c.align }}>
                        {c.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {UNMAPPED.map((r, i) => (
                    <TableRow key={i} hover sx={{ backgroundColor: r.DAYS_OPEN > 30 ? 'error.light' : 'transparent' }}>
                      <TableCell padding="checkbox"><Checkbox size="small" disabled /></TableCell>
                      {UNMAPPED_COLS.map((c) => {
                        const v = r[c.name];
                        const isMono = ['ITEM_CD', 'PROD_QTY', 'PROD_AMT', 'DAYS_OPEN', 'SUGG_LVL4'].includes(c.name);
                        let display = v;
                        if (c.name === 'PROD_QTY') display = v.toLocaleString() + ' 본';
                        else if (c.name === 'PROD_AMT') display = v.toFixed(1) + 'K원';
                        else if (c.name === 'DAYS_OPEN') display = v + ' 일';
                        const color = c.name === 'DAYS_OPEN' ? (v > 30 ? 'error.dark' : v > 14 ? 'warning.main' : 'inherit')
                                  : c.name === 'SUGG_LVL4' && v === '?' ? 'error.main' : 'inherit';
                        const fontWeight = c.name === 'DAYS_OPEN' || c.name === 'SUGG_LVL4' ? 600 : 400;
                        return (
                          <TableCell key={c.name} sx={{ textAlign: c.align, fontFamily: isMono ? 'monospace' : 'inherit', color, fontWeight }}>
                            {display}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* 속성 관리 미리보기 (작게) */}
            <Box sx={{ mt: 1.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>참고 — 속성 관리 탭 (CmKtng09):</Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mt: 0.5 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {ATTR_COLS.map((c) => (
                        <TableCell key={c.name} sx={{ backgroundColor: 'grey.100', width: c.width, fontWeight: 700, textAlign: c.align, fontSize: 12 }}>
                          {c.label}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ATTRS.slice(0, 5).map((r) => (
                      <TableRow key={r.attr} hover>
                        {ATTR_COLS.map((c) => (
                          <TableCell key={c.name} sx={{ textAlign: c.align, fontSize: 12, fontFamily: c.name === 'value' && r.attr.includes('코드') ? 'monospace' : 'inherit' }}>
                            {r[c.name]}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Box>
        </Box>
      </Box>
    </MockShell>
  );
}
