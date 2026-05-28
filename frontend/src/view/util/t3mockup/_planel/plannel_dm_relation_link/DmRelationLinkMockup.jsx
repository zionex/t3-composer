import React, { useState } from 'react';
import { Box, Stack, TextField, MenuItem, Button, Chip, Tabs, Tab,
  Table, TableHead, TableBody, TableRow, TableCell, Checkbox, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SaveIcon from '@mui/icons-material/Save';
import LinkIcon from '@mui/icons-material/Link';
import MockShell from '../../_shared/MockShell';

// PLANNEL DM 관계 마스터 — CustomerItem / LocationItem / CustomerLocation / SupplierItem / HrchyPermission
// 좌측 부모 마스터 + 우측 연결 자식 cross. 좌측 선택 → 우측 적용 (체크박스)

const PARENT_ROWS = [
  { CD: 'CUST-K001', NM: 'Samsung Display', linked: 12, region: 'KR' },
  { CD: 'CUST-K002', NM: 'LG Innotek',      linked:  8, region: 'KR' },
  { CD: 'CUST-K003', NM: 'SK Hynix',        linked: 15, region: 'KR' },
  { CD: 'CUST-U001', NM: 'Apple Inc.',      linked: 22, region: 'US' },
  { CD: 'CUST-U002', NM: 'Tesla Motors',    linked:  6, region: 'US' },
  { CD: 'CUST-J001', NM: 'Sony Corp.',      linked:  9, region: 'JP' },
];

const CHILD_ROWS = [
  { CD: 'ITM-A100', NM: 'LED Module 60W',    linked: true,  alloc: 5000 },
  { CD: 'ITM-A101', NM: 'LED Module 80W',    linked: true,  alloc: 3000 },
  { CD: 'ITM-A102', NM: 'LED Module 100W',   linked: false, alloc: 0 },
  { CD: 'ITM-B205', NM: 'PCB Board Rev.3',   linked: true,  alloc: 1200 },
  { CD: 'ITM-B206', NM: 'PCB Board Rev.4',   linked: false, alloc: 0 },
  { CD: 'ITM-C310', NM: 'Aluminum Heatsink', linked: true,  alloc: 8000 },
  { CD: 'ITM-D420', NM: 'Plastic Housing',   linked: false, alloc: 0 },
  { CD: 'ITM-D421', NM: 'Glass Cover',       linked: true,  alloc: 4500 },
];

export default function DmRelationLinkMockup() {
  const [selectedCD, setSelectedCD] = useState('CUST-K001');
  const current = PARENT_ROWS.find((r) => r.CD === selectedCD) || PARENT_ROWS[0];
  return (
    <MockShell
      patternCode="plannel_dm_relation_link"
      patternLabel="PlaNEL — DM 관계 마스터 (Customer-Item / Location-Item / Customer-Location / Supplier-Item / Hrchy Permission)"
      layoutCategory="LAYOUT_H2"
      description="좌측 부모 마스터 + 우측 연결 자식 cross. 좌측 선택 → 우측 체크박스로 연결 정의."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <TextField label="관계 유형" size="small" select value="CUSTOMER_ITEM" sx={{ width: 200 }}>
            <MenuItem value="CUSTOMER_ITEM">Customer ↔ Item</MenuItem>
            <MenuItem value="LOCATION_ITEM">Location ↔ Item</MenuItem>
            <MenuItem value="CUSTOMER_LOCATION">Customer ↔ Location</MenuItem>
            <MenuItem value="SUPPLIER_ITEM">Supplier ↔ Item</MenuItem>
            <MenuItem value="HRCHY_PERM">Hrchy Permission</MenuItem>
          </TextField>
          <TextField label="검색" size="small" value="" placeholder="CD/NM" sx={{ width: 180 }} />
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
        </Stack>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* 좌측 H2 첫번째 — Parent (Customer) */}
        <Box sx={{ width: '38%', borderRight: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'primary.50' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Customer (부모)</Typography>
          </Box>
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'grey.100' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Customer CD</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>명칭</TableCell>
                  <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>연결</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {PARENT_ROWS.map((r) => (
                  <TableRow key={r.CD} hover selected={r.CD === selectedCD}
                    onClick={() => setSelectedCD(r.CD)}
                    sx={{ cursor: 'pointer', '&.Mui-selected': { backgroundColor: 'primary.100' } }}>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{r.CD}</TableCell>
                    <TableCell>
                      {r.NM} <Chip label={r.region} size="small" sx={{ ml: 0.5, fontSize: 10 }} />
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>
                      <Chip label={`${r.linked}개`} size="small" color={r.linked > 10 ? 'primary' : 'default'} icon={<LinkIcon sx={{ fontSize: 12 }} />} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Box>

        {/* 우측 H2 두번째 — Child (Item) */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Stack direction="row" alignItems="center" sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'success.50' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Item (자식) — {current.NM} 의 {current.linked}개 연결
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Button size="small" startIcon={<SaveIcon />} variant="contained">관계 저장</Button>
          </Stack>
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'grey.100' }}>
                  <TableCell padding="checkbox"><Checkbox size="small" indeterminate /></TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Item CD</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>명칭</TableCell>
                  <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>할당량</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {CHILD_ROWS.map((r) => (
                  <TableRow key={r.CD} hover>
                    <TableCell padding="checkbox"><Checkbox size="small" checked={r.linked} /></TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{r.CD}</TableCell>
                    <TableCell>{r.NM}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', color: r.linked ? 'inherit' : 'text.disabled' }}>
                      {r.linked ? r.alloc.toLocaleString() : '—'}
                    </TableCell>
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
