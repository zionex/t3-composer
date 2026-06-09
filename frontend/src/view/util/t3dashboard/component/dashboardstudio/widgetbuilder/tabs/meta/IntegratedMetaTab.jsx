import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SearchIcon from '@mui/icons-material/Search';

import { MODULE_LIST } from '../direct/steps/wizardConstants';
import {
  getBizColumns,
  getBizKeywords,
  patchBizColumn,
} from '../../../../../restapi/widgetBuilder';
import { compactColumnType } from './metaUtils';

const COL_ROLE_OPTIONS = ['time', 'id', 'dimension', 'measure', 'no_use'];

export default function IntegratedMetaTab({ bizTables, bizCategories }) {
  const [categoryFilter, setCategoryFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [categoryPanelOpen, setCategoryPanelOpen] = useState(true);
  const [selectedTableId, setSelectedTableId] = useState('');
  const [search, setSearch] = useState('');
  const [columns, setColumns] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [activeColumnRole, setActiveColumnRole] = useState('');
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [savingColumnId, setSavingColumnId] = useState(null);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  const categoryNameMap = useMemo(() => {
    const map = {};
    (bizCategories || []).forEach((c) => { if (c.category && c.category_name) map[c.category] = c.category_name; });
    return map;
  }, [bizCategories]);

  const moduleOptions = useMemo(() => {
    const modules = new Set((bizTables || []).map((table) => table.module).filter(Boolean));
    return MODULE_LIST.filter((module) => modules.has(module));
  }, [bizTables]);

  const moduleTables = useMemo(
    () => (bizTables || []).filter((table) => !moduleFilter || table.module === moduleFilter),
    [bizTables, moduleFilter],
  );

  const categories = useMemo(() => {
    const counts = new Map();
    moduleTables.forEach((table) => {
      const category = table.category || table.sub_category || '_uncategorized';
      counts.set(category, (counts.get(category) || 0) + 1);
    });
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [moduleTables]);

  const filteredTables = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return moduleTables.filter((table) => {
      const category = table.category || table.sub_category || '_uncategorized';
      if (categoryFilter && category !== categoryFilter) return false;
      if (!keyword) return true;
      return [table.name, table.module, table.category, table.sub_category, table.description, table.table_role]
        .filter(Boolean)
        .join(' ')
      .toLowerCase()
      .includes(keyword);
    }).sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
  }, [moduleTables, categoryFilter, search]);

  const selectedTable = useMemo(
    () => filteredTables.find((table) => table.id === selectedTableId) || filteredTables[0] || null,
    [filteredTables, selectedTableId],
  );

  useEffect(() => {
    if (!selectedTable) {
      setSelectedTableId('');
      setColumns([]);
      setKeywords([]);
      return;
    }
    if (selectedTable.id !== selectedTableId) setSelectedTableId(selectedTable.id);
  }, [selectedTable, selectedTableId]);

  useEffect(() => {
    if (!selectedTable?.id) return undefined;
    let cancelled = false;
    setLoadingDetail(true);
    Promise.all([
      getBizColumns(selectedTable.id),
      getBizKeywords(selectedTable.id),
    ])
      .then(([columnData, keywordData]) => {
        if (cancelled) return;
        setColumns(Array.isArray(columnData) ? columnData : []);
        setKeywords(Array.isArray(keywordData) ? keywordData : []);
      })
      .catch(() => {
        if (cancelled) return;
        setColumns([]);
        setKeywords([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingDetail(false);
      });
    return () => { cancelled = true; };
  }, [selectedTable?.id]);

  useEffect(() => {
    setCategoryFilter('');
    setSelectedTableId('');
  }, [moduleFilter]);

  const groupedColumns = useMemo(() => {
    const groups = {};
    columns.forEach((column) => {
      const role = column.col_role || 'unknown';
      if (!groups[role]) groups[role] = [];
      groups[role].push(column);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [columns]);

  useEffect(() => {
    if (groupedColumns.length === 0) {
      if (activeColumnRole) setActiveColumnRole('');
      return;
    }

    if (!groupedColumns.some(([role]) => role === activeColumnRole)) {
      setActiveColumnRole(groupedColumns[0][0]);
    }
  }, [activeColumnRole, groupedColumns]);

  const activeColumnGroup = useMemo(
    () => groupedColumns.find(([role]) => role === activeColumnRole) || groupedColumns[0] || null,
    [activeColumnRole, groupedColumns]
  );

  const handleColumnRoleChange = async (column, nextRole) => {
    if (!column?.id || !nextRole || column.col_role === nextRole) return;
    setSavingColumnId(column.id);
    try {
      const updated = await patchBizColumn(column.id, { col_role: nextRole });
      setColumns((prev) => prev.map((item) => (
        item.id === column.id ? { ...item, ...updated, col_role: updated?.col_role || nextRole } : item
      )));
      setSnack({ open: true, msg: `${column.name} role 수정 완료`, severity: 'success' });
    } catch (err) {
      setSnack({ open: true, msg: 'role 수정 실패: ' + (err?.message || String(err)), severity: 'error' });
    } finally {
      setSavingColumnId(null);
    }
  };

  return (
    <Box sx={{ flex: '1 1 0%', height: '100%', minHeight: 0, display: 'grid', gridTemplateColumns: categoryPanelOpen ? '220px 360px minmax(0, 1fr)' : '44px 420px minmax(0, 1fr)', gap: 1, overflow: 'hidden' }}>
      <Box sx={{ height: '100%', minHeight: 0, border: '1px solid #e5eaf2', borderRadius: '8px', bgcolor: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ px: categoryPanelOpen ? 1.25 : 0.5, py: 0.75, borderBottom: '1px solid #eef2f7' }}>
          <Stack direction="row" alignItems="center" justifyContent={categoryPanelOpen ? 'space-between' : 'center'} spacing={0.5}>
            {categoryPanelOpen && <Typography sx={{ fontSize: 14, fontWeight: 900, color: '#1e293b' }}>카테고리</Typography>}
            <IconButton size="small" onClick={() => setCategoryPanelOpen((open) => !open)}>
              {categoryPanelOpen ? <ChevronLeftIcon sx={{ fontSize: 18 }} /> : <ChevronRightIcon sx={{ fontSize: 18 }} />}
            </IconButton>
          </Stack>
          {categoryPanelOpen && (
            <FormControl size="small" fullWidth sx={{ mt: 0.75 }}>
              <InputLabel>모듈</InputLabel>
              <Select value={moduleFilter} label="모듈" onChange={(event) => setModuleFilter(event.target.value)}>
                <MenuItem value="">전체</MenuItem>
                {moduleOptions.map((module) => <MenuItem key={module} value={module}>{module}</MenuItem>)}
              </Select>
            </FormControl>
          )}
        </Box>
        {categoryPanelOpen ? (
        <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', py: 0.75 }}>
          <Box
            role="button"
            tabIndex={0}
            onClick={() => setCategoryFilter('')}
            sx={{
              mx: 0.75, mb: 0.25, px: 1, py: 0.8, borderRadius: '6px', cursor: 'pointer',
              bgcolor: categoryFilter === '' ? '#eff6ff' : 'transparent',
              color: categoryFilter === '' ? '#0b84ff' : '#334155',
              fontSize: 13, fontWeight: 800,
            }}
          >
            전체 <Typography component="span" sx={{ ml: 0.5, fontSize: 12, color: '#94a3b8' }}>{moduleTables.length}</Typography>
          </Box>
          {categories.map((category) => (
            <Box
              key={category.name}
              role="button"
              tabIndex={0}
              onClick={() => setCategoryFilter(category.name)}
              sx={{
                mx: 0.75, mb: 0.25, px: 1, py: 0.8, borderRadius: '6px', cursor: 'pointer',
                bgcolor: categoryFilter === category.name ? '#eff6ff' : 'transparent',
                color: categoryFilter === category.name ? '#0b84ff' : '#334155',
                '&:hover': { bgcolor: '#f8fafc' },
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                <Tooltip title={category.name} placement="right">
                  <Typography sx={{ fontSize: 13, fontWeight: 800 }} noWrap>
                    {categoryNameMap[category.name] || category.name}
                  </Typography>
                </Tooltip>
                <Chip size="small" label={category.count} sx={{ height: 18, fontSize: 10, bgcolor: '#f1f5f9' }} />
              </Stack>
            </Box>
          ))}
        </Box>
        ) : (
          <Box sx={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography sx={{ writingMode: 'vertical-rl', fontSize: 12, fontWeight: 900, color: '#64748b', letterSpacing: 1 }}>
              카테고리
            </Typography>
          </Box>
        )}
      </Box>

      <Box sx={{ height: '100%', minHeight: 0, border: '1px solid #e5eaf2', borderRadius: '8px', bgcolor: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ p: 1, borderBottom: '1px solid #eef2f7' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.75 }}>
            <Stack direction="row" alignItems="center" spacing={0.75} sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 900, color: '#1e293b' }}>테이블</Typography>
              {moduleFilter && <Chip size="small" label={moduleFilter} sx={{ height: 20, fontSize: 11, fontWeight: 800 }} />}
            </Stack>
            <Chip size="small" label={`${filteredTables.length}개`} sx={{ height: 20, fontSize: 11, bgcolor: '#eff6ff', color: '#2563eb', fontWeight: 800 }} />
          </Stack>
          {!categoryPanelOpen && (
            <Stack direction="row" spacing={0.75} sx={{ mb: 0.75 }}>
              <FormControl size="small" sx={{ minWidth: 110 }}>
                <InputLabel>모듈</InputLabel>
                <Select value={moduleFilter} label="모듈" onChange={(event) => setModuleFilter(event.target.value)}>
                  <MenuItem value="">전체</MenuItem>
                  {moduleOptions.map((module) => <MenuItem key={module} value={module}>{module}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 180, flex: 1 }}>
                <InputLabel>카테고리</InputLabel>
                <Select value={categoryFilter} label="카테고리" onChange={(event) => setCategoryFilter(event.target.value)}>
                  <MenuItem value="">전체</MenuItem>
                  {categories.map((category) => <MenuItem key={category.name} value={category.name}>{categoryNameMap[category.name] || category.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Stack>
          )}
          <TextField
            size="small"
            fullWidth
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="테이블, 설명 검색"
            InputProps={{ startAdornment: <SearchIcon sx={{ fontSize: 18, color: '#94a3b8', mr: 0.75 }} /> }}
          />
        </Box>
        <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', p: 0.75 }}>
          {filteredTables.map((table) => (
            <Box
              key={table.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedTableId(table.id)}
              sx={{
                p: 1,
                mb: 0.75,
                border: '1px solid',
                borderColor: selectedTable?.id === table.id ? '#0b84ff' : '#e5eaf2',
                borderRadius: '8px',
                bgcolor: selectedTable?.id === table.id ? '#eff6ff' : '#fff',
                cursor: 'pointer',
                '&:hover': { borderColor: '#93c5fd', bgcolor: '#f8fbff' },
              }}
            >
              <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.35 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 900, color: '#0f172a', minWidth: 0 }} noWrap>{table.name}</Typography>
                {table.module && <Chip size="small" label={table.module} sx={{ height: 18, fontSize: 10, fontWeight: 800 }} />}
              </Stack>
              <Typography sx={{ fontSize: 11, color: '#64748b' }} noWrap>{table.description || '-'}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      <Box sx={{ height: '100%', minHeight: 0, border: '1px solid #e5eaf2', borderRadius: '8px', bgcolor: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!selectedTable ? (
          <Box sx={{ flex: 1, display: 'grid', placeItems: 'center' }}>
            <Typography sx={{ fontSize: 13, color: '#94a3b8' }}>테이블을 선택하세요</Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ p: 1.25, borderBottom: '1px solid #eef2f7' }}>
              <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.5 }}>
                <Typography sx={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }} noWrap>{selectedTable.name}</Typography>
                {selectedTable.table_role && <Chip size="small" label={selectedTable.table_role} sx={{ height: 20, fontSize: 10, fontWeight: 800 }} />}
              </Stack>
              <Typography sx={{ fontSize: 12, color: '#64748b' }} noWrap>{selectedTable.description || '-'}</Typography>
            </Box>
            {loadingDetail ? (
              <Box sx={{ flex: 1, display: 'grid', placeItems: 'center' }}><CircularProgress size={24} /></Box>
            ) : (
            <Box sx={{ flex: '1 1 0%', minHeight: 0, overflow: 'auto', p: 1 }}>
                {/* <Box sx={{ mb: 1.25 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 900, color: '#1e293b', mb: 0.75 }}>키워드</Typography>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                    {keywords.length === 0 ? (
                      <Typography sx={{ fontSize: 12, color: '#94a3b8' }}>키워드 없음</Typography>
                    ) : keywords.map((keyword) => (
                      <Chip
                        key={`${keyword.module}-${keyword.keyword}`}
                        size="small"
                        label={`${keyword.keyword}${keyword.is_primary ? ' · 주요' : ''}`}
                        color={keyword.is_primary ? 'primary' : 'default'}
                        sx={{ height: 22, fontSize: 11, fontWeight: 800 }}
                      />
                    ))}
                  </Stack>
                </Box>

                <Divider sx={{ my: 1 }} /> */}

                <Typography sx={{ fontSize: 13, fontWeight: 900, color: '#1e293b', mb: 0.75 }}>컬럼 정보</Typography>
                {groupedColumns.length === 0 ? (
                  <Typography sx={{ fontSize: 12, color: '#94a3b8' }}>컬럼 정보 없음</Typography>
                ) : (
                  <Box sx={{ minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                    <Tabs
                      value={activeColumnGroup?.[0] || false}
                      onChange={(_, nextRole) => setActiveColumnRole(nextRole)}
                      variant="scrollable"
                      scrollButtons="auto"
                      sx={{
                        minHeight: 32,
                        mb: 0.75,
                        borderBottom: '1px solid #e5eaf2',
                        '& .MuiTab-root': {
                          minHeight: 32,
                          px: 1.25,
                          py: 0.5,
                          fontSize: 11,
                          fontWeight: 900,
                          textTransform: 'none',
                        },
                      }}
                    >
                      {groupedColumns.map(([role, roleColumns]) => (
                        <Tab
                          key={role}
                          value={role}
                          label={`${role}`}
                        />
                      ))}
                    </Tabs>

                    {activeColumnGroup && (
                    <TableContainer component={Paper} variant="outlined" sx={{ maxWidth: '100%', overflowX: 'auto' }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontSize: 11, fontWeight: 800, bgcolor: '#f8fafc' }}>컬럼</TableCell>
                            <TableCell sx={{ fontSize: 11, fontWeight: 800, bgcolor: '#f8fafc' }}>타입</TableCell>
                            <TableCell sx={{ fontSize: 11, fontWeight: 800, bgcolor: '#f8fafc' }}>Role</TableCell>
                            <TableCell sx={{ fontSize: 11, fontWeight: 800, bgcolor: '#f8fafc' }}>설명</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {activeColumnGroup[1].map((column) => (
                            <TableRow key={column.id || column.name} hover>
                              <TableCell sx={{ fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap' }}>{column.name}</TableCell>
                              <TableCell sx={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap' }}>{compactColumnType(column.col_type)}</TableCell>
                              <TableCell sx={{ fontSize: 11, minWidth: 128 }}>
                                <Select
                                  size="small"
                                  value={column.col_role || ''}
                                  disabled={savingColumnId === column.id}
                                  onChange={(event) => handleColumnRoleChange(column, event.target.value)}
                                  sx={{ fontSize: 11, minWidth: 112, height: 28 }}
                                >
                                  {COL_ROLE_OPTIONS.map((option) => (
                                    <MenuItem key={option} value={option}>{option}</MenuItem>
                                  ))}
                                </Select>
                              </TableCell>
                              <TableCell sx={{ fontSize: 11, minWidth: 180 }}>{column.col_comment || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    )}
                  </Box>
                )}
              </Box>
            )}
          </>
        )}
      </Box>
      <Snackbar open={snack.open} autoHideDuration={2500} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
