import React, { useState } from 'react';
import { Box, Stack, TextField, MenuItem, Button, Chip, Typography, Tabs, Tab, Switch, FormControlLabel,
  Table, TableHead, TableBody, TableRow, TableCell, Divider } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import MockShell from '../../_shared/MockShell';

// PLANNEL MP 설정 — MpSettings / MaterialConstraints / DemandPriority 3개
// LAYOUT_SINGLE — 정책 폼 + 자재 제약 + 수요 우선순위

const MATERIAL_CONSTRAINTS = [
  { mat: 'PCB Board v3',      cap: 12000, locked: false, source: 'Internal' },
  { mat: 'PCB Board v4',      cap:  8000, locked: true,  source: 'Internal' },
  { mat: 'Aluminum Heatsink', cap: 25000, locked: false, source: 'Supplier-J005' },
  { mat: 'LED Chip 0.5W',     cap: 80000, locked: false, source: 'Supplier-U003' },
  { mat: 'Tobacco Blend A',   cap:  6000, locked: true,  source: 'Supplier-K012' },
];

const DEMAND_PRIORITY = [
  { cust: 'Apple Inc.',      pri: 1, tier: 'GOLD',   sla: '99%' },
  { cust: 'Samsung Display', pri: 2, tier: 'GOLD',   sla: '98%' },
  { cust: 'LG Innotek',      pri: 3, tier: 'SILVER', sla: '95%' },
  { cust: 'Tesla Motors',    pri: 4, tier: 'SILVER', sla: '95%' },
  { cust: 'Sony Corp.',      pri: 5, tier: 'BRONZE', sla: '90%' },
];

export default function MpSettingsMockup() {
  const [tab, setTab] = useState(0);
  return (
    <MockShell
      patternCode="plannel_mp_settings"
      patternLabel="PlaNEL — MP 설정 (Settings / Material Constraints / Demand Priority)"
      layoutCategory="LAYOUT_SINGLE"
      description="MP 정책 + 자재 capacity 제약 + 거래처 우선순위. 3개 MP 설정 통합."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" alignItems="center">
          <Tabs value={tab} onChange={(_, v) => setTab(v)}>
            <Tab label="MP 정책" />
            <Tab label="자재 제약" />
            <Tab label="수요 우선순위" />
          </Tabs>
          <Box sx={{ flexGrow: 1 }} />
          <Button size="small" startIcon={<SaveIcon />} variant="contained">저장</Button>
        </Stack>
      </Box>

      {tab === 0 && (
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: 'primary.main' }}>MP 엔진 파라미터</Typography>
        <Stack direction="row" spacing={2} sx={{ mb: 1.5 }}>
          <TextField label="최적화 목표" select size="small" value="MAX_FILL" sx={{ flex: 1 }}>
            <MenuItem value="MAX_FILL">Fill Rate 최대화</MenuItem>
            <MenuItem value="MIN_COST">비용 최소화</MenuItem>
            <MenuItem value="BALANCED">균형</MenuItem>
          </TextField>
          <TextField label="Planning Horizon (개월)" type="number" size="small" value={12} sx={{ flex: 1 }} />
          <TextField label="Frozen Period (주)" type="number" size="small" value={4} sx={{ flex: 1 }} />
        </Stack>
        <Stack direction="row" spacing={3}>
          <FormControlLabel control={<Switch defaultChecked />} label="우선순위 강제 적용" />
          <FormControlLabel control={<Switch defaultChecked />} label="자재 제약 strict" />
          <FormControlLabel control={<Switch />} label="다단계 BOM 자동 전개" />
        </Stack>
      </Box>
      )}

      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {tab === 1 && (
        <Box sx={{ flex: 1, p: 2, borderRight: '1px solid', borderColor: 'divider', overflow: 'auto' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'primary.main' }}>자재 Capacity 제약</Typography>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 700 }}>자재</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>Capacity</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>고정</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {MATERIAL_CONSTRAINTS.map((r) => (
                <TableRow key={r.mat} hover>
                  <TableCell>{r.mat}</TableCell>
                  <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.cap.toLocaleString()}</TableCell>
                  <TableCell><Switch size="small" checked={r.locked} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
        )}

        {tab === 2 && (
        <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'primary.main' }}>수요 우선순위 (Customer Tier)</Typography>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 700 }}>순위</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>거래처</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tier</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>SLA</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {DEMAND_PRIORITY.map((r) => (
                <TableRow key={r.cust} hover>
                  <TableCell><Chip label={`#${r.pri}`} size="small" color={r.pri <= 2 ? 'primary' : 'default'} sx={{ fontFamily: 'monospace' }} /></TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{r.cust}</TableCell>
                  <TableCell><Chip label={r.tier} size="small" sx={{
                    backgroundColor: r.tier === 'GOLD' ? '#fbbf24' : r.tier === 'SILVER' ? '#94a3b8' : '#a78bfa',
                    color: 'white' }} /></TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{r.sla}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
        )}
      </Box>
    </MockShell>
  );
}
