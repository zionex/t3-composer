import React from 'react';
import { Box, Stack, TextField, MenuItem, Button, Chip, Typography, Paper,
  Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import MockShell from '../../_shared/MockShell';

// PLANNEL IP ABC-XYZ — AbcXyzAnalysisScenarios / AbcXyzAnalysisResults 2개
// LAYOUT_V2 — 상단 시나리오 헤더 + 하단 결과 매트릭스 (3×3 ABC × XYZ)

const ABC_XYZ_MATRIX = [
  { abc: 'A', x: 142, y: 38,  z: 12 },
  { abc: 'B', x: 285, y: 421, z: 156 },
  { abc: 'C', x: 88,  y: 312, z: 245 },
];

const TOP_ITEMS = [
  { item: 'LED Module 60W',  rev: 18.5, vol: 12500, abcxyz: 'AX', service: 99 },
  { item: 'LED Module 80W',  rev: 14.2, vol:  8500, abcxyz: 'AX', service: 99 },
  { item: 'PCB Board v3',    rev:  8.6, vol:  6200, abcxyz: 'AY', service: 99 },
  { item: 'Aluminum HS',     rev:  5.4, vol: 11000, abcxyz: 'BX', service: 95 },
  { item: 'Plastic Housing', rev:  3.8, vol:  7500, abcxyz: 'BY', service: 95 },
];

const cellColor = (abc, xyz) => {
  if (abc === 'A' && xyz === 'X') return '#22c55e';
  if (abc === 'A' || xyz === 'X') return '#86efac';
  if (abc === 'C' && xyz === 'Z') return '#ef4444';
  if (abc === 'C' || xyz === 'Z') return '#fca5a5';
  return '#fde047';
};

export default function IpAbcXyzMockup() {
  return (
    <MockShell
      patternCode="plannel_ip_abc_xyz"
      patternLabel="PlaNEL — IP ABC-XYZ 분석 (Scenarios / Results)"
      layoutCategory="LAYOUT_V2"
      description="상단 분석 시나리오 입력 + 하단 ABC-XYZ 매트릭스 + 상위 품목 결과."
    >
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <TextField label="시나리오" size="small" value="2026 Q2 분석" sx={{ width: 200 }} />
          <TextField label="기간" size="small" value="2025-06 ~ 2026-05" sx={{ width: 200 }} />
          <TextField label="ABC 기준" select size="small" value="REVENUE" sx={{ width: 130 }}>
            <MenuItem value="REVENUE">매출</MenuItem>
            <MenuItem value="VOLUME">수량</MenuItem>
            <MenuItem value="MARGIN">마진</MenuItem>
          </TextField>
          <TextField label="XYZ 기준" select size="small" value="CV" sx={{ width: 150 }}>
            <MenuItem value="CV">CV (변동계수)</MenuItem>
            <MenuItem value="STD_DEV">표준편차</MenuItem>
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          <Button size="small" startIcon={<PlayArrowIcon />} variant="contained">분석 실행</Button>
        </Stack>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', overflow: 'auto', p: 2, gap: 2 }}>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>ABC × XYZ 매트릭스</Typography>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 700 }}>분류</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>X (안정)</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Y (보통)</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Z (변동)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ABC_XYZ_MATRIX.map((r) => (
                <TableRow key={r.abc} hover>
                  <TableCell><Chip label={r.abc} size="small" sx={{ fontWeight: 700, fontFamily: 'monospace' }}
                    color={r.abc === 'A' ? 'success' : r.abc === 'B' ? 'warning' : 'error'} /></TableCell>
                  <TableCell sx={{ textAlign: 'center', backgroundColor: cellColor(r.abc, 'X'), fontFamily: 'monospace', fontWeight: 700, color: 'white' }}>{r.x}</TableCell>
                  <TableCell sx={{ textAlign: 'center', backgroundColor: cellColor(r.abc, 'Y'), fontFamily: 'monospace', fontWeight: 700, color: 'white' }}>{r.y}</TableCell>
                  <TableCell sx={{ textAlign: 'center', backgroundColor: cellColor(r.abc, 'Z'), fontFamily: 'monospace', fontWeight: 700, color: 'white' }}>{r.z}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
            <Chip label="AX = 최적 관리 (자동화)" size="small" sx={{ backgroundColor: '#22c55e', color: 'white' }} />
            <Chip label="CZ = 검토 대상 (단종/정리)" size="small" sx={{ backgroundColor: '#ef4444', color: 'white' }} />
          </Stack>
        </Paper>

        <Paper sx={{ p: 0, flex: 1.4 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
            상위 매출 품목 (Top 5)
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>매출 (B)</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>수량</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>분류</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>SL</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {TOP_ITEMS.map((r) => (
                <TableRow key={r.item} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{r.item}</TableCell>
                  <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.rev}</TableCell>
                  <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.vol.toLocaleString()}</TableCell>
                  <TableCell><Chip label={r.abcxyz} size="small"
                    sx={{ fontFamily: 'monospace', fontWeight: 700, backgroundColor: cellColor(r.abcxyz[0], r.abcxyz[1]), color: 'white' }} /></TableCell>
                  <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{r.service}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Box>
    </MockShell>
  );
}
