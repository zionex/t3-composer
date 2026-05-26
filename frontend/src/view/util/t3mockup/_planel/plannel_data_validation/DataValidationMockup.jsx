import React from 'react';
import { Box, Stack, Button, Chip, Typography, Paper, LinearProgress,
  Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import MockShell from '../../_shared/MockShell';

// PLANNEL Data Validation — DataValidation / DataLoadValidation 2개
// LAYOUT_DASHBOARD — 업로드 진행 + 검증 결과 (성공/실패/경고)

const VALIDATION_KPIS = [
  { label: '총 레코드',   value: '24,847', sub: '8 files',     color: 'primary' },
  { label: '검증 통과',   value: '24,512', sub: '98.7%',       color: 'success' },
  { label: '검증 실패',   value: '128',    sub: '0.5%',        color: 'error' },
  { label: '경고',       value: '207',    sub: '0.8%',        color: 'warning' },
];

const FILE_PROGRESS = [
  { file: 'sales_2026Q2.csv',     rows: 8420,  status: 'success', progress: 100, errors: 0 },
  { file: 'inventory_05.xlsx',    rows: 5230,  status: 'success', progress: 100, errors: 0 },
  { file: 'customer_master.csv',  rows: 1247,  status: 'warning', progress: 100, errors: 8 },
  { file: 'shipment_log.json',    rows: 6850,  status: 'success', progress: 100, errors: 0 },
  { file: 'bom_v2026.xlsx',       rows: 3100,  status: 'running', progress: 67,  errors: 0 },
];

const VALIDATION_ERRORS = [
  { file: 'customer_master.csv',  row: 142,  field: 'customer_cd', err: 'Duplicate CUST-K001' },
  { file: 'customer_master.csv',  row: 358,  field: 'email',       err: 'Invalid format' },
  { file: 'customer_master.csv',  row: 421,  field: 'site_cd',     err: 'FK reference not found' },
];

const statusIcon = (s) => s === 'success' ? <CheckCircleIcon color="success" sx={{ fontSize: 16 }} /> :
  s === 'warning' ? <WarningIcon color="warning" sx={{ fontSize: 16 }} /> :
  s === 'error' ? <ErrorIcon color="error" sx={{ fontSize: 16 }} /> : null;

export default function DataValidationMockup() {
  return (
    <MockShell
      patternCode="plannel_data_validation"
      patternLabel="PlaNEL — 데이터 검증 (Data Validation / Data Load Validation)"
      layoutCategory="LAYOUT_DASHBOARD"
      description="업로드 진행 + 검증 결과 + 오류 상세. 데이터 로드 / 검증 통합 대시보드."
    >
      <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
        <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
          {VALIDATION_KPIS.map((k) => (
            <Paper key={k.label} elevation={1} sx={{ flex: 1, p: 1.5, borderLeft: '4px solid', borderLeftColor: `${k.color}.main` }}>
              <Typography variant="caption" color="text.secondary">{k.label}</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: `${k.color}.main`, my: 0.3 }}>{k.value}</Typography>
              <Typography variant="caption" color="text.secondary">{k.sub}</Typography>
            </Paper>
          ))}
        </Stack>

        <Stack direction="row" spacing={2}>
          <Paper sx={{ p: 0, flex: 1.4 }}>
            <Stack direction="row" alignItems="center" sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
              <CloudUploadIcon color="primary" />
              <Typography variant="subtitle1" sx={{ fontWeight: 700, ml: 1 }}>파일 처리 현황</Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Button size="small" startIcon={<CloudUploadIcon />} variant="contained">파일 추가</Button>
            </Stack>
            <Box sx={{ p: 2 }}>
              <Stack spacing={1.5}>
                {FILE_PROGRESS.map((f) => (
                  <Box key={f.file}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.3 }}>
                      {statusIcon(f.status)}
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 12, fontFamily: 'monospace' }}>{f.file}</Typography>
                      <Box sx={{ flexGrow: 1 }} />
                      <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                        {f.rows.toLocaleString()} rows
                        {f.errors > 0 && <span style={{ color: 'red', marginLeft: 6 }}>· {f.errors} errors</span>}
                      </Typography>
                    </Stack>
                    <LinearProgress variant="determinate" value={f.progress}
                      color={f.status === 'warning' ? 'warning' : f.status === 'error' ? 'error' : 'success'}
                      sx={{ height: 6, borderRadius: 1 }} />
                  </Box>
                ))}
              </Stack>
            </Box>
          </Paper>

          <Paper sx={{ p: 0, flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
              검증 오류 상세
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'grey.100' }}>
                  <TableCell sx={{ fontWeight: 700 }}>행</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>필드</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>오류</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {VALIDATION_ERRORS.map((e, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{e.row}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 11 }}>{e.field}</TableCell>
                    <TableCell sx={{ fontSize: 12, color: 'error.main' }}>{e.err}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Stack>
      </Box>
    </MockShell>
  );
}
