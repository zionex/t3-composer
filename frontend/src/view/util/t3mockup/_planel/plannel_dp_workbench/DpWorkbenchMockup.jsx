import React from 'react';
import { Box, Stack, TextField, MenuItem, Button, Chip, Typography,
  Table, TableHead, TableBody, TableRow, TableCell, List, ListItem, ListItemText } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import EditIcon from '@mui/icons-material/Edit';
import MockShell from '../../_shared/MockShell';

// PLANNEL DP 워크벤치 — Workbench / WorkbenchEditable / DpVersionSelect / ScenarioComDashboard 4개
// LAYOUT_H2 — 좌측 버전/시나리오 list + 우측 편집 매트릭스

const VERSIONS = [
  { v: 'V2026.05.01', tag: 'Baseline',   date: '2026-05-15', active: true },
  { v: 'V2026.05.02', tag: 'Scenario A', date: '2026-05-22', active: false },
  { v: 'V2026.05.03', tag: 'Scenario B', date: '2026-05-24', active: false },
  { v: 'V2026.05.04', tag: 'Scenario C', date: '2026-05-26', active: false },
];

const MONTHS = ['2026-06', '2026-07', '2026-08', '2026-09', '2026-10'];
const ROWS = [
  { ITEM: 'LED Module 60W', vals: [5000, 5200, 5500, 5800, 6000], pct: '+3.2%' },
  { ITEM: 'LED Module 80W', vals: [3000, 3100, 3300, 3500, 3600], pct: '+2.8%' },
  { ITEM: 'PCB Board v3',   vals: [1200, 1250, 1300, 1350, 1400], pct: '+4.1%' },
  { ITEM: 'Aluminum HS',    vals: [4500, 4600, 4700, 4800, 4900], pct: '+1.9%' },
];

export default function DpWorkbenchMockup() {
  return (
    <MockShell
      patternCode="plannel_dp_workbench"
      patternLabel="PlaNEL — DP 워크벤치 (Workbench / Editable / Version Select / Scenario Comparison)"
      layoutCategory="LAYOUT_H2"
      description="좌측 버전/시나리오 list + 우측 편집 매트릭스. DP 검토/편집/시나리오 비교 통합."
    >
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Box sx={{ width: '28%', borderRight: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 1.5, backgroundColor: 'primary.50', borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>버전 / 시나리오</Typography>
          </Box>
          <List dense disablePadding sx={{ flex: 1, overflow: 'auto' }}>
            {VERSIONS.map((v) => (
              <ListItem key={v.v} sx={{
                py: 1,
                backgroundColor: v.active ? 'primary.50' : 'transparent',
                borderLeft: v.active ? '3px solid' : '3px solid transparent',
                borderLeftColor: v.active ? 'primary.main' : 'transparent',
              }}>
                <Stack sx={{ flex: 1 }}>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{v.v}</Typography>
                    {v.active && <Chip label="ACTIVE" size="small" color="success" sx={{ height: 16, fontSize: 9 }} />}
                  </Stack>
                  <Typography variant="caption" color="text.secondary">{v.tag} · {v.date}</Typography>
                </Stack>
              </ListItem>
            ))}
          </List>
          <Box sx={{ p: 1, borderTop: '1px solid', borderColor: 'divider' }}>
            <Button size="small" fullWidth startIcon={<CompareArrowsIcon />}>시나리오 비교</Button>
          </Box>
        </Box>

        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Stack direction="row" alignItems="center" sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
            <Chip label="V2026.05.01 · Baseline" color="primary" size="small" sx={{ fontFamily: 'monospace' }} />
            <Chip label="편집 모드" color="warning" size="small" icon={<EditIcon sx={{ fontSize: 12 }} />} sx={{ ml: 1 }} />
            <Box sx={{ flexGrow: 1 }} />
            <Button size="small" startIcon={<SaveIcon />} variant="contained">저장</Button>
          </Stack>
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'grey.100' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
                  {MONTHS.map((m) => (
                    <TableCell key={m} sx={{ fontWeight: 700, textAlign: 'right', fontFamily: 'monospace' }}>{m}</TableCell>
                  ))}
                  <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>YoY</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ROWS.map((r) => (
                  <TableRow key={r.ITEM} hover>
                    <TableCell>{r.ITEM}</TableCell>
                    {r.vals.map((v, i) => (
                      <TableCell key={i} sx={{ textAlign: 'right', fontFamily: 'monospace', backgroundColor: 'warning.50' }}>
                        {v.toLocaleString()}
                      </TableCell>
                    ))}
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', color: 'success.main', fontWeight: 700 }}>{r.pct}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Box>
      </Box>
    </MockShell>
  );
}
