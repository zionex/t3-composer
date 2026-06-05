import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography, Paper, Chip,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SaveIcon from '@mui/icons-material/Save';
import LockIcon from '@mui/icons-material/Lock';
import DownloadIcon from '@mui/icons-material/Download';
import MockShell from '../../_shared/MockShell';
import { cellSx } from '../../_shared/styleCallback';

// OronDp01 — 판매계획 PSI 입력 (크로스탭)
// UI_DP_95, UI_DP_93, UI_DP_94

const FIXED = [
  { name: 'BRAND',   label: '브랜드',    width: 110 },
  { name: 'CHANNEL', label: '채널',      width: 110 },
  { name: 'ITEM_LV3',label: 'Lvl3',     width: 90 },
  { name: 'ITEM_NM', label: '품목',      width: 200 },
  { name: 'MEASURE', label: 'MEASURE',  width: 130 },
];

const MONTHS = ['2026-06','2026-07','2026-08','2026-09','2026-10','2026-11','2026-12'];

const ROWS = [
  // 오론 마스크
  { BRAND: 'ORON',     CHANNEL: '온라인',    ITEM_LV3: 'MASK',  ITEM_NM: '오론 비건마스크 5매',  MEASURE: '판매계획',  vals: [12000, 13500, 14000, 13500, 13000, 13500, 14500], locked: false },
  { BRAND: 'ORON',     CHANNEL: '온라인',    ITEM_LV3: 'MASK',  ITEM_NM: '오론 비건마스크 5매',  MEASURE: '판매실적',  vals: [11500, 12800, 13200, null, null, null, null],     locked: true  },
  { BRAND: 'ORON',     CHANNEL: '온라인',    ITEM_LV3: 'MASK',  ITEM_NM: '오론 비건마스크 5매',  MEASURE: '재고계획',  vals: [3500,  4200,  4500,  4500,  4200,  4500,  5000],   locked: false },
  // 오론 세럼
  { BRAND: 'ORON',     CHANNEL: '오프라인',  ITEM_LV3: 'SERUM', ITEM_NM: '오론 세럼 30ml',       MEASURE: '판매계획',  vals: [4500,  5000,  5500,  5800,  6000,  6500,  7000],   locked: false },
  { BRAND: 'ORON',     CHANNEL: '오프라인',  ITEM_LV3: 'SERUM', ITEM_NM: '오론 세럼 30ml',       MEASURE: '판매실적',  vals: [4400,  4800,  null,  null,  null,  null,  null],   locked: true  },
  // OEM
  { BRAND: 'CLIENT-A', CHANNEL: 'OEM',       ITEM_LV3: 'SUN',   ITEM_NM: 'OEM 선크림 SPF50+',    MEASURE: '판매계획',  vals: [8500,  9000,  9500,  9500,  9000,  8500,  9000],   locked: false },
  { BRAND: 'CLIENT-A', CHANNEL: 'OEM',       ITEM_LV3: 'SUN',   ITEM_NM: 'OEM 선크림 SPF50+',    MEASURE: '판매실적',  vals: [8200,  8800,  null,  null,  null,  null,  null],   locked: true  },
];

const fmtN = (n) => (n == null ? '-' : n.toLocaleString());

export default function OronDpEntryMockup() {
  return (
    <MockShell
      patternCode="oron_dp_entry"
      patternLabel="ORON — 판매계획 입력 (PSI 크로스탭)"
      layoutCategory="LAYOUT_SINGLE"
      description="좌측 고정 5컬럼 (브랜드·채널·Lvl3·품목·MEASURE) + 우측 동적 월 버킷 (7개월). 판매계획 vs 실적 vs 재고계획 — 실적은 잠금(회색)."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="PLAN_SCOPE" size="small" select value="ORN_DP" sx={{ width: 130 }}>
            <MenuItem value="ORN_DP">ORN_DP</MenuItem>
          </TextField>
          <TextField label="MAIN_VER" size="small" select value="V2026-05" sx={{ width: 140 }}>
            <MenuItem value="V2026-05">V2026-05</MenuItem>
          </TextField>
          <TextField label="브랜드" size="small" select value="ALL" sx={{ width: 130 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="ORON">ORON</MenuItem>
            <MenuItem value="OEM">OEM</MenuItem>
          </TextField>
          <TextField label="채널" size="small" select value="ALL" sx={{ width: 130 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="ON">온라인</MenuItem>
            <MenuItem value="OFF">오프라인</MenuItem>
            <MenuItem value="OEM">OEM</MenuItem>
          </TextField>
          <TextField label="기간" size="small" value="2026-06 ~ 12" sx={{ width: 150 }} />
          <TextField label="BUCKET" size="small" select value="MONTH" sx={{ width: 100 }}>
            <MenuItem value="WEEK">WEEK</MenuItem>
            <MenuItem value="MONTH">MONTH</MenuItem>
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
          <Button variant="contained" size="small" color="success" startIcon={<SaveIcon />}>저장</Button>
          <Button variant="outlined" size="small" startIcon={<DownloadIcon />}>Excel</Button>
        </Stack>
      </Box>

      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5, height: '100%' }}>
        <Stack direction="row" spacing={1.5}>
          {[
            { label: '판매계획 (7M)',  value: '197,500', detail: '단위: EA', color: 'primary' },
            { label: '실적 누적 (3M)', value: '47,500',  detail: '계획대비 +1.2%', color: 'success' },
            { label: '입력 진행률',    value: '85%',     detail: '5/7 카테고리',   color: 'info' },
            { label: '미입력 SKU',     value: '12건',    detail: '검토 필요',      color: 'warning' },
          ].map((k) => (
            <Paper key={k.label} variant="outlined" sx={{ p: 1.5, flex: 1 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>{k.label}</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: `${k.color}.main`, mt: 0.5 }}>{k.value}</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>{k.detail}</Typography>
            </Paper>
          ))}
        </Stack>

        <Paper variant="outlined" sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>판매계획 PSI 입력 — 7개월</Typography>
              <Chip label="V2026-05 (현재)" size="small" color="primary" variant="outlined" />
              <Chip icon={<LockIcon sx={{ fontSize: 12 }} />} label="실적 = 잠금" size="small" variant="outlined" />
            </Stack>
          </Box>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {FIXED.map((c) => (
                    <TableCell key={c.name} sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: c.width, textAlign: c.name === 'ITEM_NM' ? 'left' : 'center' }}>{c.label}</TableCell>
                  ))}
                  {MONTHS.map((m) => (
                    <TableCell key={m} sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 95, textAlign: 'right' }}>{m.slice(2)}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {ROWS.map((r, i) => (
                  <TableRow key={i} hover sx={{ bgcolor: r.locked ? '#fafafa' : 'transparent' }}>
                    <TableCell sx={{ textAlign: 'center', fontSize: 12 }}>{r.BRAND}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontSize: 12 }}>{r.CHANNEL}</TableCell>
                    <TableCell sx={cellSx('info', { align: 'center', mono: true })}>{r.ITEM_LV3}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{r.ITEM_NM}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontWeight: 600, color: r.MEASURE === '판매계획' ? '#1565c0' : r.MEASURE === '판매실적' ? '#6b7280' : '#10b981' }}>
                      {r.locked && <LockIcon sx={{ fontSize: 11, verticalAlign: 'middle', mr: 0.3, color: '#9ca3af' }} />}
                      {r.MEASURE}
                    </TableCell>
                    {r.vals.map((v, j) => (
                      <TableCell key={j} sx={{
                        textAlign: 'right', fontFamily: 'monospace',
                        color: v == null ? '#d1d5db' : r.locked ? '#6b7280' : '#374151',
                        fontWeight: r.MEASURE === '판매계획' ? 600 : 400,
                        bgcolor: r.locked ? '#f3f4f6' : 'transparent',
                      }}>
                        {fmtN(v)}
                      </TableCell>
                    ))}
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
