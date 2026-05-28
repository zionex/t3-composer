import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography, Paper, Chip, Tabs, Tab,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SaveIcon from '@mui/icons-material/Save';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import MockShell from '../../_shared/MockShell';
import { cellSx } from '../../_shared/styleCallback';

// OronPk03 — 인쇄/가공/분단 생산계획 관리·점검 (LAYOUT_V2 상하)
// UI_PK_ORN_PACK_PRINT_MGMT, PROC_MGMT, CUT_MGMT + PRINT_NOTIFY, PROC_NOTIFY, CUT_NOTIFY

const PROCS = [
  { key: 'print', label: '인쇄', color: '#0ea5e9' },
  { key: 'proc',  label: '가공', color: '#8b5cf6' },
  { key: 'cut',   label: '분단', color: '#f59e0b' },
];

const PLAN_ROWS = [
  { LINE_CD: 'L-PRINT-01', ITEM_CD: 'PK10001', ITEM_NM: '오론 마스크 단상자',     SETUP_DT: '2026-06-03 08:00', END_DT: '2026-06-03 17:30', QTY: 25000,  ALT: false, COLOR: '#0ea5e9' },
  { LINE_CD: 'L-PRINT-01', ITEM_CD: 'PK10002', ITEM_NM: '오론 세럼 단상자',       SETUP_DT: '2026-06-03 18:00', END_DT: '2026-06-04 06:00', QTY: 18000,  ALT: false, COLOR: '#0ea5e9' },
  { LINE_CD: 'L-PRINT-02', ITEM_CD: 'PK20001', ITEM_NM: '알루미늄 파우치 5매용',  SETUP_DT: '2026-06-03 09:00', END_DT: '2026-06-03 21:00', QTY: 50000,  ALT: true,  COLOR: '#0ea5e9' },
  { LINE_CD: 'L-PROC-01', ITEM_CD: 'PK20001', ITEM_NM: '알루미늄 파우치 가공',    SETUP_DT: '2026-06-04 08:00', END_DT: '2026-06-04 18:00', QTY: 48000,  ALT: false, COLOR: '#8b5cf6' },
  { LINE_CD: 'L-PROC-02', ITEM_CD: 'PK30001', ITEM_NM: '튜브 50ml 압출',          SETUP_DT: '2026-06-04 09:00', END_DT: '2026-06-05 02:00', QTY: 12000,  ALT: false, COLOR: '#8b5cf6' },
  { LINE_CD: 'L-CUT-01', ITEM_CD: 'PK10001', ITEM_NM: '오론 마스크 단상자 분단', SETUP_DT: '2026-06-04 08:00', END_DT: '2026-06-04 14:00', QTY: 24500,  ALT: false, COLOR: '#f59e0b' },
  { LINE_CD: 'L-CUT-01', ITEM_CD: 'PK10002', ITEM_NM: '오론 세럼 단상자 분단',   SETUP_DT: '2026-06-04 14:30', END_DT: '2026-06-04 22:00', QTY: 17800,  ALT: false, COLOR: '#f59e0b' },
];

const NOTIFY_ROWS = [
  { LINE_CD: 'L-PRINT-02', ITEM_CD: 'PK20001', LEVEL: 'WARN',  CHECK: '잉크 보유량 부족 (5월 28일 기준 -15%)', BY: 'AUTO', DT: '2026-05-28 14:35' },
  { LINE_CD: 'L-PROC-02',  ITEM_CD: 'PK30001', LEVEL: 'WARN',  CHECK: '튜브 압출 라인 능력 초과 (102%)',         BY: 'AUTO', DT: '2026-05-28 14:36' },
  { LINE_CD: 'L-PRINT-01', ITEM_CD: 'PK10001', LEVEL: 'INFO',  CHECK: '단상자 인쇄 색상 검수 통과',              BY: '김기자', DT: '2026-05-28 14:42' },
  { LINE_CD: 'L-CUT-01',   ITEM_CD: 'PK10002', LEVEL: 'PASS',  CHECK: '분단 라인 가동률 정상 (78%)',             BY: 'AUTO', DT: '2026-05-28 14:50' },
];

const LVL_COLOR = { WARN: 'warning', INFO: 'info', PASS: 'success', FAIL: 'error' };

export default function OronPkProcessPlanMockup() {
  const [proc, setProc] = React.useState(0);
  return (
    <MockShell
      patternCode="oron_pk_process_plan"
      patternLabel="ORON — 인쇄/가공/분단 생산계획 관리·점검"
      layoutCategory="LAYOUT_V2"
      description="상단: 공정별 생산계획 (라인×품목, Setup/End 시간), 하단: 자동/수동 점검 결과. 3개 공정 (인쇄→가공→분단). UI_PK_ORN_PACK_PRINT/PROC/CUT_MGMT + _NOTIFY."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="시나리오" size="small" value="SCN_0023" sx={{ width: 160 }} />
          <TextField label="라인" size="small" select value="ALL" sx={{ width: 130 }}>
            <MenuItem value="ALL">전체</MenuItem>
          </TextField>
          <TextField label="기간" size="small" value="2026-06-03 ~ 06-09" sx={{ width: 180 }} />
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
          <Button variant="contained" size="small" startIcon={<SaveIcon />}>편성 저장</Button>
        </Stack>
      </Box>

      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 1.5 }}>
        <Tabs value={proc} onChange={(_e, v) => setProc(v)}>
          {PROCS.map((p) => <Tab key={p.key} label={p.label} />)}
          <Tab label="통합 조회" />
        </Tabs>
      </Box>

      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5, height: '100%' }}>
        {/* 상단: 계획 */}
        <Paper variant="outlined" sx={{ flex: 1.4, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box sx={{ width: 12, height: 12, bgcolor: PROCS[proc]?.color || '#94a3b8', borderRadius: '50%' }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{(PROCS[proc]?.label || '통합')} 생산계획 — 시간순 편성</Typography>
              <Chip label="ALT 변경 가능" size="small" color="info" variant="outlined" />
            </Stack>
          </Box>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 120, textAlign: 'center' }}>라인</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 110, textAlign: 'center' }}>품목</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700 }}>품목명</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 150, textAlign: 'center' }}>시작</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 150, textAlign: 'center' }}>완료</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 100, textAlign: 'right' }}>수량</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 80, textAlign: 'center' }}>대체</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {PLAN_ROWS.map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace', borderLeft: `4px solid ${r.COLOR}`, fontWeight: 600 }}>{r.LINE_CD}</TableCell>
                    <TableCell sx={cellSx('info', { align: 'center', mono: true })}>{r.ITEM_CD}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{r.ITEM_NM}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 11 }}>{r.SETUP_DT}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 11 }}>{r.END_DT}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{r.QTY.toLocaleString()}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{r.ALT ? <Chip label="ALT" size="small" color="warning" /> : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* 하단: 점검 결과 */}
        <Paper variant="outlined" sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <WarningAmberIcon fontSize="small" color="warning" />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>계획 점검 결과 (자동/수동)</Typography>
              <Chip label="WARN 2" size="small" color="warning" variant="outlined" />
              <Chip label="PASS 1" size="small" color="success" variant="outlined" />
              <Chip label="INFO 1" size="small" color="info" variant="outlined" />
            </Stack>
          </Box>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 130, textAlign: 'center' }}>라인</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 110, textAlign: 'center' }}>품목</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 80, textAlign: 'center' }}>레벨</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700 }}>점검 내용</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 100, textAlign: 'center' }}>점검자</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, width: 150, textAlign: 'center' }}>일시</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {NOTIFY_ROWS.map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace' }}>{r.LINE_CD}</TableCell>
                    <TableCell sx={cellSx('info', { align: 'center', mono: true })}>{r.ITEM_CD}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}><Chip label={r.LEVEL} size="small" color={LVL_COLOR[r.LEVEL] || 'default'} variant="outlined" /></TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{r.CHECK}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontSize: 12 }}>{r.BY}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 11 }}>{r.DT}</TableCell>
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
