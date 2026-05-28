import React, { useState } from 'react';
import { Box, Stack, TextField, MenuItem, Button, Chip, Typography, Paper,
  Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import HistoryIcon from '@mui/icons-material/History';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import MockShell from '../../_shared/MockShell';

// PLANNEL Audit — AuditTrail / AuditDifference 2개
// LAYOUT_V2 — 상단 검색 + 하단 변경 이력 + diff

const AUDIT_ROWS = [
  { dt: '2026-05-26 14:23', user: '김계획', table: 'DpSettings', action: 'UPDATE', field: 'planHorizon', oldVal: '12',  newVal: '18' },
  { dt: '2026-05-26 13:55', user: '이수요', table: 'BfSettings', action: 'UPDATE', field: 'algorithm',   oldVal: 'ARIMA', newVal: 'LSTM+Prophet' },
  { dt: '2026-05-26 11:08', user: '박재고', table: 'IpSettings', action: 'UPDATE', field: 'tierA_sl',    oldVal: '98',  newVal: '99' },
  { dt: '2026-05-26 10:23', user: '관리자', table: 'UserMgmt',    action: 'CREATE', field: 'user',        oldVal: '-',    newVal: 'jsmith@plannel.com' },
  { dt: '2026-05-25 18:42', user: '정생산', table: 'MpSettings', action: 'UPDATE', field: 'optGoal',     oldVal: 'COST', newVal: 'FILL' },
];

const actionColor = (a) => a === 'CREATE' ? 'success' : a === 'DELETE' ? 'error' : 'info';

export default function AuditMockup() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const current = AUDIT_ROWS[selectedIdx] || AUDIT_ROWS[0];
  return (
    <MockShell
      patternCode="plannel_audit"
      patternLabel="PlaNEL — 감사 (Audit Trail / Audit Difference)"
      layoutCategory="LAYOUT_V2"
      description="상단 감사 검색 + 하단 변경 이력 + Diff. 모든 설정/마스터 변경 추적."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <HistoryIcon color="primary" />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Audit Log</Typography>
          <TextField label="대상 테이블" select size="small" value="ALL" sx={{ width: 150 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="DP">DP 관련</MenuItem>
            <MenuItem value="IP">IP 관련</MenuItem>
            <MenuItem value="USER">사용자</MenuItem>
          </TextField>
          <TextField label="액션" select size="small" value="ALL" sx={{ width: 130 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="CREATE">CREATE</MenuItem>
            <MenuItem value="UPDATE">UPDATE</MenuItem>
            <MenuItem value="DELETE">DELETE</MenuItem>
          </TextField>
          <TextField label="기간" size="small" value="2026-05-19 ~ 2026-05-26" sx={{ width: 220 }} />
          <Box sx={{ flexGrow: 1 }} />
          <Button size="small" startIcon={<SearchIcon />} variant="contained">조회</Button>
        </Stack>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Box sx={{ flex: 1.4, overflow: 'auto', borderRight: '1px solid', borderColor: 'divider' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 700 }}>시각</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>사용자</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>테이블</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>액션</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>필드</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {AUDIT_ROWS.map((r, i) => (
                <TableRow key={i} hover selected={i === selectedIdx}
                  onClick={() => setSelectedIdx(i)}
                  sx={{ cursor: 'pointer', '&.Mui-selected': { backgroundColor: 'primary.50' } }}>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 11 }}>{r.dt}</TableCell>
                  <TableCell>{r.user}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{r.table}</TableCell>
                  <TableCell><Chip label={r.action} size="small" color={actionColor(r.action)} /></TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{r.field}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>

        <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
          <Stack direction="row" alignItems="center" sx={{ mb: 2 }}>
            <CompareArrowsIcon color="primary" />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, ml: 1 }}>Diff — 선택된 변경</Typography>
          </Stack>

          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
              <Chip label={current.table} size="small" sx={{ fontFamily: 'monospace' }} />
              <Chip label={current.action} size="small" color={actionColor(current.action)} />
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{current.field}</Typography>
            </Stack>

            <Paper elevation={0} sx={{ p: 1.5, backgroundColor: 'error.50', borderLeft: '4px solid', borderLeftColor: 'error.main' }}>
              <Typography variant="caption" color="error.dark" sx={{ fontWeight: 700 }}>BEFORE (old)</Typography>
              <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'error.dark', mt: 0.5 }}>
                {current.field} = {current.oldVal}
              </Typography>
            </Paper>
            <Paper elevation={0} sx={{ p: 1.5, backgroundColor: 'success.50', borderLeft: '4px solid', borderLeftColor: 'success.main' }}>
              <Typography variant="caption" color="success.dark" sx={{ fontWeight: 700 }}>AFTER (new)</Typography>
              <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'success.dark', mt: 0.5 }}>
                {current.field} = {current.newVal}
              </Typography>
            </Paper>

            <Stack direction="row" spacing={1} sx={{ pt: 1 }}>
              <Chip label={`By: ${current.user}`} size="small" variant="outlined" />
              <Chip label={current.dt} size="small" variant="outlined" sx={{ fontFamily: 'monospace', fontSize: 10 }} />
              <Chip label="IP: 10.0.42.12" size="small" variant="outlined" sx={{ fontFamily: 'monospace', fontSize: 10 }} />
            </Stack>

            <Button size="small" variant="outlined">전체 변경 보기</Button>
          </Stack>
        </Box>
      </Box>
    </MockShell>
  );
}
