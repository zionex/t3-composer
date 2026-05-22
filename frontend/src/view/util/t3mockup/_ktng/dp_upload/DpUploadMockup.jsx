import React from 'react';
import { Box, Stack, Button, Typography, Paper, Chip, LinearProgress,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import MockShell from '../../_shared/MockShell';

// DpKtng01 — 판매 실적 / 재고 Upload. Excel/CSV 업로드 + 진행 + 결과 로그.

const HISTORY = [
  { ts: '2026-05-22 09:14:22', user: 'admin', file: '20260521_sales_actual.xlsx',  rows: 12450, status: 'success', msg: '정상 적재' },
  { ts: '2026-05-21 18:02:11', user: 'admin', file: '20260521_inventory.xlsx',    rows:  8200, status: 'success', msg: '정상 적재' },
  { ts: '2026-05-21 09:30:55', user: 'parky', file: '20260520_sales_actual.xlsx', rows: 12480, status: 'success', msg: '정상 적재' },
  { ts: '2026-05-20 13:22:08', user: 'parky', file: '20260520_inventory.xlsx',    rows:  8195, status: 'warning', msg: '5건 ITEM 매핑 실패 (무시)' },
  { ts: '2026-05-20 09:18:42', user: 'admin', file: '20260519_sales_actual.xlsx', rows: 12410, status: 'success', msg: '정상 적재' },
  { ts: '2026-05-19 11:05:19', user: 'parky', file: 'broken_format.xlsx',          rows:     0, status: 'error',   msg: '시트명 불일치 — Sheet1 필요' },
];

const STATUS_COLOR = { success: 'success', warning: 'warning', error: 'error' };

export default function DpUploadMockup() {
  return (
    <MockShell patternCode="ktng_dp_upload" patternLabel="KTNG — 판매 실적 / 재고 Upload (DpKtng01)"
      layoutCategory="LAYOUT_SINGLE" description="Excel/CSV 일괄 업로드 + 진행 상태 + 결과 로그.">
      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5, height: '100%', overflow: 'auto' }}>
        {/* Upload zone */}
        <Paper variant="outlined" sx={{ p: 3, border: '2px dashed', borderColor: 'primary.light', backgroundColor: 'primary.50', textAlign: 'center' }}>
          <CloudUploadIcon sx={{ fontSize: 56, color: 'primary.main' }} />
          <Typography variant="h6" sx={{ fontWeight: 700, mt: 1 }}>파일을 드래그하거나 선택</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>지원 형식: .xlsx, .csv (최대 50MB)</Typography>
          <Stack direction="row" spacing={1} justifyContent="center">
            <Button variant="contained" startIcon={<CloudUploadIcon />}>파일 선택</Button>
            <Button variant="outlined" startIcon={<DownloadIcon />}>템플릿 다운로드 (판매실적)</Button>
            <Button variant="outlined" startIcon={<DownloadIcon />}>템플릿 다운로드 (재고)</Button>
          </Stack>
        </Paper>

        {/* In-progress upload */}
        <Paper variant="outlined" sx={{ p: 1.5 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{ flex: 1 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>20260522_sales_actual.xlsx</Typography>
                <Chip size="small" label="처리 중" color="info" />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>8,420 / 12,500 rows</Typography>
              </Stack>
              <LinearProgress variant="determinate" value={67} sx={{ mt: 0.5, height: 6, borderRadius: 3 }} />
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>67%</Typography>
          </Stack>
        </Paper>

        {/* History */}
        <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 220 }}>
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>업로드 이력</Typography>
          </Box>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ backgroundColor: 'grey.100', width: 160, fontWeight: 700 }}>일시</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', width: 80, fontWeight: 700 }}>사용자</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700 }}>파일명</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', width: 100, fontWeight: 700, textAlign: 'right' }}>적재 건수</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', width: 100, fontWeight: 700, textAlign: 'center' }}>상태</TableCell>
                  <TableCell sx={{ backgroundColor: 'grey.100', width: 260, fontWeight: 700 }}>메시지</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {HISTORY.map((h, i) => {
                  const Icon = h.status === 'success' ? CheckCircleIcon : ErrorOutlineIcon;
                  return (
                    <TableRow key={i} hover>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{h.ts}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{h.user}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{h.file}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{h.rows.toLocaleString()}</TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Chip size="small" icon={<Icon fontSize="small" />} label={h.status.toUpperCase()} color={STATUS_COLOR[h.status]} />
                      </TableCell>
                      <TableCell sx={{ fontSize: 12, color: h.status === 'error' ? 'error.main' : 'text.secondary' }}>{h.msg}</TableCell>
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
