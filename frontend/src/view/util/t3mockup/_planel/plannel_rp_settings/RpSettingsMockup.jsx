import React from 'react';
import { Box, Stack, TextField, MenuItem, Button, Chip, Typography, Tabs, Tab, Switch, FormControlLabel,
  Table, TableHead, TableBody, TableRow, TableCell, Divider } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import MockShell from '../../_shared/MockShell';

// PLANNEL RP 설정 — RpSettings / RpPolicy / RpDistributionNetwork 3개
// LAYOUT_SINGLE — 정책 폼 + 네트워크 노드 테이블

const NETWORK_ROWS = [
  { CD: 'WH-K01', NM: 'Korea Central WH', tier: 'L1', children: 5, leadTime: 0, policy: 'MIN/MAX' },
  { CD: 'WH-K02', NM: 'Korea Regional WH (Seoul)', tier: 'L2', children: 12, leadTime: 1, policy: 'MIN/MAX' },
  { CD: 'WH-K03', NM: 'Korea Regional WH (Busan)', tier: 'L2', children: 8, leadTime: 2, policy: 'MIN/MAX' },
  { CD: 'WH-U01', NM: 'US Central WH',  tier: 'L1', children: 4, leadTime: 0, policy: 'ROP' },
  { CD: 'WH-J01', NM: 'Japan Central WH', tier: 'L1', children: 3, leadTime: 0, policy: 'EOQ' },
];

export default function RpSettingsMockup() {
  return (
    <MockShell
      patternCode="plannel_rp_settings"
      patternLabel="PlaNEL — RP 설정 (Settings / Policy / Distribution Network)"
      layoutCategory="LAYOUT_SINGLE"
      description="RP 정책 폼 (MIN/MAX·ROP·EOQ) + 분배 네트워크 노드 테이블. 3개 RP 설정 통합."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Tabs value={0}>
            <Tab label="RP 정책" />
            <Tab label="분배 네트워크" />
            <Tab label="고급 설정" disabled />
          </Tabs>
          <Box sx={{ flexGrow: 1 }} />
          <Button size="small" startIcon={<SaveIcon />} variant="contained">저장</Button>
        </Stack>
      </Box>

      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: 'primary.main' }}>정책 파라미터</Typography>
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <TextField label="기본 정책" select size="small" value="MIN_MAX" sx={{ flex: 1 }}>
            <MenuItem value="MIN_MAX">MIN/MAX</MenuItem>
            <MenuItem value="ROP">ROP (재주문점)</MenuItem>
            <MenuItem value="EOQ">EOQ (경제적 주문량)</MenuItem>
            <MenuItem value="DDMRP">DDMRP</MenuItem>
          </TextField>
          <TextField label="안전재고 일수" type="number" size="small" value={14} sx={{ flex: 1 }} />
          <TextField label="리드타임 (일)" type="number" size="small" value={7} sx={{ flex: 1 }} />
          <TextField label="발주 주기 (일)" type="number" size="small" value={7} sx={{ flex: 1 }} />
        </Stack>
        <Stack direction="row" spacing={3}>
          <FormControlLabel control={<Switch defaultChecked />} label="자동 발주" />
          <FormControlLabel control={<Switch defaultChecked />} label="안전재고 동적 조정" />
          <FormControlLabel control={<Switch />} label="공급 우선순위 적용" />
        </Stack>
      </Box>

      <Divider />

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: 'primary.main' }}>분배 네트워크</Typography>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.100' }}>
              <TableCell sx={{ fontWeight: 700 }}>창고 코드</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>명칭</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>계층</TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>하위 노드</TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>L/T (일)</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>정책</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {NETWORK_ROWS.map((r) => (
              <TableRow key={r.CD} hover>
                <TableCell sx={{ fontFamily: 'monospace' }}>{r.CD}</TableCell>
                <TableCell>{r.NM}</TableCell>
                <TableCell><Chip label={r.tier} size="small" color={r.tier === 'L1' ? 'primary' : 'default'} /></TableCell>
                <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.children}</TableCell>
                <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.leadTime}</TableCell>
                <TableCell><Chip label={r.policy} size="small" variant="outlined" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </MockShell>
  );
}
