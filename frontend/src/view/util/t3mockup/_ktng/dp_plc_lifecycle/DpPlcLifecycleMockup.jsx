import React, { useState } from 'react';
import { Box, Stack, TextField, MenuItem, Button, Chip, Tabs, Tab, Paper, Typography,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SaveIcon from '@mui/icons-material/Save';
import MockShell from '../../_shared/MockShell';

// DpKtng04 (신/구품 PLC 현황), DpKtng14 (EOP 생산수량), DpKtng16 (제품 생명주기 조건)
// 3개를 PLC stage timeline + 그리드 + EOP 정보로 통합

const STAGES = [
  { key: 'INTRO',    label: 'INTRODUCTION', cnt: 12, color: '#06b6d4' },
  { key: 'GROWTH',   label: 'GROWTH',       cnt: 28, color: '#10b981' },
  { key: 'MATURITY', label: 'MATURITY',     cnt: 42, color: '#3b82f6' },
  { key: 'DECLINE',  label: 'DECLINE',      cnt: 18, color: '#f59e0b' },
  { key: 'EOP',      label: 'EOP / 단종',    cnt:  9, color: '#ef4444' },
];

const ROWS = [
  { ITEM_CD: 'NEW-001', ITEM_NM: '신제품 한정판 V1',  OLD_CD: '-',          OLD_NM: '-',         STAGE: 'INTRO',    LAUNCH_DT: '2026-05-01', EOP_DT: '-',           EOP_QTY: '-',       LIFE: 0,   STATUS: 'launching' },
  { ITEM_CD: 'TL-RD-001', ITEM_NM: '레드 클래식 20pcs', OLD_CD: '-',        OLD_NM: '-',         STAGE: 'GROWTH',   LAUNCH_DT: '2025-08-01', EOP_DT: '-',           EOP_QTY: '-',       LIFE: 10,  STATUS: 'normal' },
  { ITEM_CD: 'TL-BL-005', ITEM_NM: '블루 멘솔 20pcs',   OLD_CD: '-',        OLD_NM: '-',         STAGE: 'MATURITY', LAUNCH_DT: '2024-03-15', EOP_DT: '-',           EOP_QTY: '-',       LIFE: 26,  STATUS: 'normal' },
  { ITEM_CD: 'TL-RD-002', ITEM_NM: '레드 라이트 20pcs', OLD_CD: 'OLD-RD-901', OLD_NM: '레드 슈퍼슬림', STAGE: 'GROWTH', LAUNCH_DT: '2025-12-01', EOP_DT: '-',           EOP_QTY: '-',       LIFE:  5,  STATUS: 'replacement' },
  { ITEM_CD: 'OLD-RD-901',ITEM_NM: '레드 슈퍼슬림 (단종 예정)', OLD_CD: '-',  OLD_NM: '-',         STAGE: 'DECLINE',  LAUNCH_DT: '2018-06-01', EOP_DT: '2026-08-31', EOP_QTY: '450K',    LIFE: 95,  STATUS: 'declining' },
  { ITEM_CD: 'OLD-BL-880',ITEM_NM: '블루 100mm (구버전)', OLD_CD: '-',      OLD_NM: '-',         STAGE: 'EOP',      LAUNCH_DT: '2015-03-01', EOP_DT: '2026-04-30', EOP_QTY: '180K',    LIFE: 134, STATUS: 'eop' },
];

const STATUS_COLOR = { launching: 'info', normal: 'success', replacement: 'warning', declining: 'warning', eop: 'error' };

const PLC_TAB_LABELS = ['PLC 현황 (DpKtng04)', 'EOP 생산수량 (DpKtng14)', '생명주기 조건 (DpKtng16)'];

export default function DpPlcLifecycleMockup() {
  const [tab, setTab] = useState(0);
  return (
    <MockShell patternCode="ktng_dp_plc_lifecycle" patternLabel="KTNG — PLC / EOP / 생명주기 (DpKtng04/14/16)"
      layoutCategory="LAYOUT_SINGLE" description="제품 생명주기 단계별 현황 + 신/구품 매핑 + EOP 생산수량 관리.">
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <TextField label="STAGE" size="small" select value="ALL" sx={{ width: 140 }}>
            <MenuItem value="ALL">전체</MenuItem>
            {STAGES.map((s) => <MenuItem key={s.key} value={s.key}>{s.label}</MenuItem>)}
          </TextField>
          <TextField label="ITEM" size="small" value="" placeholder="품목 검색" sx={{ width: 180 }} />
          <TextField label="EOP 임박" size="small" select value="ALL" sx={{ width: 130 }}>
            <MenuItem value="ALL">전체</MenuItem><MenuItem value="3M">3개월 이내</MenuItem><MenuItem value="6M">6개월 이내</MenuItem>
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
        </Stack>
      </Box>

      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          {PLC_TAB_LABELS.map((l) => <Tab key={l} label={l} />)}
        </Tabs>
      </Box>

      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5, flexGrow: 1, overflow: 'auto' }}>
        {/* Stage stepper */}
        <Stack direction="row" spacing={0}>
          {STAGES.map((s, i) => (
            <Box key={s.key} sx={{ flex: 1, p: 1.5, backgroundColor: s.color, color: '#fff', textAlign: 'center', position: 'relative',
                                   borderRight: i < STAGES.length - 1 ? '4px solid #fff' : 'none' }}>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>{s.label}</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>{s.cnt}</Typography>
            </Box>
          ))}
        </Stack>

        {/* Item list */}
        <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 240 }}>
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>품목별 생명주기 현황 — {PLC_TAB_LABELS[tab]}</Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Button size="small" startIcon={<SaveIcon />}>저장</Button>
          </Box>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {['ITEM_CD','ITEM_NM','신/구 매핑','STAGE','LAUNCH_DT','EOP_DT','EOP 수량','경과 (개월)','상태'].map((c) => (
                    <TableCell key={c} sx={{ backgroundColor: 'grey.100', fontWeight: 700, textAlign: c.includes('수량') || c.includes('경과') ? 'right' : (['STAGE','상태'].includes(c) ? 'center' : 'left') }}>{c}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {ROWS.map((r, i) => {
                  const stage = STAGES.find((s) => s.key === r.STAGE);
                  return (
                    <TableRow key={i} hover sx={{ backgroundColor: r.STATUS === 'eop' ? 'error.light' : (r.STATUS === 'declining' ? 'warning.light' : 'transparent') }}>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{r.ITEM_CD}</TableCell>
                      <TableCell>{r.ITEM_NM}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{r.OLD_CD !== '-' ? `→ ${r.OLD_CD}` : '-'}</TableCell>
                      <TableCell sx={{ textAlign: 'center' }}><Chip size="small" label={r.STAGE} sx={{ backgroundColor: stage.color, color: '#fff' }} /></TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{r.LAUNCH_DT}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', color: r.EOP_DT !== '-' ? 'error.main' : 'inherit' }}>{r.EOP_DT}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.EOP_QTY}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.LIFE}</TableCell>
                      <TableCell sx={{ textAlign: 'center' }}><Chip size="small" label={r.STATUS} color={STATUS_COLOR[r.STATUS]} /></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </MockShell>
  );
}
