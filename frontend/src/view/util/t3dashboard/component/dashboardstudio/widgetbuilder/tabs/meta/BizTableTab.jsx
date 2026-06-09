import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TableCell,
  TableRow,
  TextField,
  Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

import { MODULE_LIST } from '../direct/steps/wizardConstants';
import { getBizTables } from '../../../../../restapi/widgetBuilder';
import BizGrid from './BizGrid';

export default function BizTableTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    getBizTables().then((data) => setRows(Array.isArray(data) ? data : [])).finally(() => setLoading(false));
  }, []);

  const moduleOptions = useMemo(() => {
    const s = new Set(rows.map((r) => r.module).filter(Boolean));
    return MODULE_LIST.filter((m) => s.has(m));
  }, [rows]);

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (moduleFilter && r.module !== moduleFilter) return false;
      if (!kw) return true;
      return [r.name, r.category, r.description, r.table_role].filter(Boolean).join(' ').toLowerCase().includes(kw);
    });
  }, [rows, search, moduleFilter]);

  const cols = [
    { key: 'module', label: '모듈' },
    { key: 'name', label: '테이블명' },
    { key: 'category', label: '카테고리' },
    { key: 'table_role', label: 'Role' },
    { key: 'confidence', label: 'Confidence' },
    { key: 'description', label: '설명' },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1, minHeight: 0 }}>
      <Stack direction="row" spacing={0.75}>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel>모듈</InputLabel>
          <Select value={moduleFilter} label="모듈" onChange={(e) => setModuleFilter(e.target.value)}>
            <MenuItem value="">전체</MenuItem>
            {moduleOptions.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField size="small" fullWidth value={search} onChange={(e) => setSearch(e.target.value)} placeholder="테이블명, 카테고리, 설명 검색"
          InputProps={{ startAdornment: <SearchIcon sx={{ fontSize: 18, color: '#94a3b8', mr: 0.75 }} /> }} />
      </Stack>
      <BizGrid
        rows={filtered} loading={loading} columns={cols}
        emptyText="biz_table이 없습니다. 데이터 관리에서 분석을 실행하세요"
        renderRow={(row) => (
          <TableRow key={row.id} hover>
            <TableCell sx={{ fontSize: 11 }}>{row.module || '-'}</TableCell>
            <TableCell sx={{ fontSize: 11, fontWeight: 700 }}>{row.name}</TableCell>
            <TableCell sx={{ fontSize: 11 }}>{row.category || '-'}</TableCell>
            <TableCell sx={{ fontSize: 11 }}>
              {row.table_role ? <Chip size="small" label={row.table_role} sx={{ height: 18, fontSize: 10 }} /> : '-'}
            </TableCell>
            <TableCell sx={{ fontSize: 11 }}>{row.confidence != null ? (row.confidence * 100).toFixed(0) + '%' : '-'}</TableCell>
            <TableCell sx={{ fontSize: 11, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <Tooltip title={row.description || ''} placement="top-start">
                <span>{row.description || '-'}</span>
              </Tooltip>
            </TableCell>
          </TableRow>
        )}
      />
    </Box>
  );
}
