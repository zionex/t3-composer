import React from 'react';
import { Box, Stack, TextField, MenuItem, Button, Chip, Typography, Paper,
  Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material';
import TransformIcon from '@mui/icons-material/Transform';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AddIcon from '@mui/icons-material/Add';
import MockShell from '../../_shared/MockShell';

// PLANNEL Data Transform — DataTransform 1개
// LAYOUT_SINGLE — ETL/변환 룰 정의 + Source → Target

const TRANSFORM_RULES = [
  { id: 'R001', source: 'sales_raw.transaction_dt', target: 'sales_clean.tx_date', type: 'DATE_FORMAT', expr: 'yyyy-MM-dd', enabled: true },
  { id: 'R002', source: 'sales_raw.amount',         target: 'sales_clean.amt_krw', type: 'CURRENCY_CONV',expr: '* exchange_rate', enabled: true },
  { id: 'R003', source: 'customer_raw.tier',        target: 'customer_clean.tier_cd', type: 'LOOKUP',  expr: 'tier_mapping_table', enabled: true },
  { id: 'R004', source: 'inventory_raw.qty',        target: 'inventory_clean.qty_ea', type: 'UNIT_CONV', expr: 'kg → ea (1:100)', enabled: true },
  { id: 'R005', source: 'item_raw.description',     target: 'item_clean.name_normalized', type: 'TEXT_NORMALIZE', expr: 'lower+trim', enabled: false },
];

const PIPELINE = [
  { step: 'Extract',   source: '8 files / 24,847 rows', status: 'done' },
  { step: 'Transform', source: '5 rules applied',       status: 'done' },
  { step: 'Validate',  source: '128 errors / 207 warn', status: 'done' },
  { step: 'Load',      source: '24,512 rows → DB',      status: 'running' },
];

export default function DataTransformMockup() {
  return (
    <MockShell
      patternCode="plannel_data_transform"
      patternLabel="PlaNEL — 데이터 변환 (Data Transform)"
      layoutCategory="LAYOUT_SINGLE"
      description="ETL 변환 룰 정의 + 파이프라인 진행. Source → Transform → Validate → Load."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <TransformIcon color="primary" />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Data Transform Pipeline</Typography>
          <Chip label="5 룰 활성 / 1 비활성" size="small" />
          <Box sx={{ flexGrow: 1 }} />
          <Button size="small" startIcon={<AddIcon />}>룰 추가</Button>
          <Button size="small" startIcon={<PlayArrowIcon />} variant="contained">실행</Button>
        </Stack>
      </Box>

      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" spacing={1.5}>
          {PIPELINE.map((p, i) => (
            <Paper key={p.step} elevation={p.status === 'running' ? 4 : 1} sx={{
              flex: 1, p: 1.5,
              border: p.status === 'running' ? '2px solid' : '1px solid',
              borderColor: p.status === 'running' ? 'warning.main' : 'divider',
            }}>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Chip label={i + 1} size="small" sx={{ fontFamily: 'monospace', fontWeight: 700, height: 18 }}
                  color={p.status === 'done' ? 'success' : 'warning'} />
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{p.step}</Typography>
                {p.status === 'running' && <Chip label="RUNNING" size="small" color="warning" sx={{ ml: 'auto', height: 16, fontSize: 10 }} />}
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>{p.source}</Typography>
            </Paper>
          ))}
        </Stack>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>변환 룰 정의</Typography>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.100' }}>
              <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Source</TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>→</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Target</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>변환 유형</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>표현식</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>활성</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {TRANSFORM_RULES.map((r) => (
              <TableRow key={r.id} hover sx={{ opacity: r.enabled ? 1 : 0.5 }}>
                <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{r.id}</TableCell>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{r.source}</TableCell>
                <TableCell sx={{ textAlign: 'center', color: 'primary.main', fontWeight: 700 }}>→</TableCell>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{r.target}</TableCell>
                <TableCell><Chip label={r.type} size="small" variant="outlined" /></TableCell>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: 11, color: 'text.secondary' }}>{r.expr}</TableCell>
                <TableCell><Chip label={r.enabled ? 'ON' : 'OFF'} size="small" color={r.enabled ? 'success' : 'default'} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </MockShell>
  );
}
