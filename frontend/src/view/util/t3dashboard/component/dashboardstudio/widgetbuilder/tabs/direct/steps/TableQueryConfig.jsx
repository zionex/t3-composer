import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Button, Checkbox, CircularProgress, Divider,
  FormControlLabel, IconButton, MenuItem, Paper,
  Stack, TextField, Typography,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { FIELD_SX } from './wizardConstants';
import { fetchTableColumns } from './dataSourceApi';

const DIRECTION_OPTIONS = ['ASC', 'DESC'];

function WhereRow({ cond, columns, onChange, onDelete }) {
  return (
    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0 }}>
      <TextField
        select
        size="small"
        label="컬럼"
        value={cond.column ?? ''}
        onChange={(event) => onChange({ ...cond, column: event.target.value })}
        sx={{ ...FIELD_SX, flex: '1 1 180px' }}
      >
        {columns.map((column) => (
          <MenuItem key={column.columnName} value={column.columnName} sx={{ fontSize: 11 }}>
            {column.columnName}
          </MenuItem>
        ))}
      </TextField>

      <Typography sx={{ fontSize: 11, color: '#64748b', flexShrink: 0 }}>=</Typography>

      <TextField
        size="small"
        label="값"
        value={cond.fixedValue ?? cond.value ?? ''}
        onChange={(event) => onChange({
          ...cond,
          mappingType: 'FIXED_VALUE',
          paramName: '',
          fixedValue: event.target.value,
        })}
        sx={{ ...FIELD_SX, flex: '1 1 220px' }}
      />

      <IconButton size="small" onClick={onDelete} sx={{ opacity: 0.55, '&:hover': { opacity: 1 } }}>
        <DeleteOutlineIcon sx={{ width: 14, height: 14 }} />
      </IconButton>
    </Stack>
  );
}

function SortRow({ order, columns, onChange, onDelete }) {
  return (
    <Stack direction="row" spacing={0.75} alignItems="center">
      <TextField
        select
        size="small"
        label="정렬 컬럼"
        value={order.column ?? ''}
        onChange={(event) => onChange({ ...order, column: event.target.value })}
        sx={{ ...FIELD_SX, flex: '1 1 180px' }}
      >
        {columns.map((column) => (
          <MenuItem key={column.columnName} value={column.columnName} sx={{ fontSize: 11 }}>
            {column.columnName}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        size="small"
        label="방향"
        value={order.direction ?? 'DESC'}
        onChange={(event) => onChange({ ...order, direction: event.target.value })}
        sx={{ ...FIELD_SX, width: 92 }}
      >
        {DIRECTION_OPTIONS.map((direction) => (
          <MenuItem key={direction} value={direction} sx={{ fontSize: 11 }}>
            {direction}
          </MenuItem>
        ))}
      </TextField>
      <IconButton size="small" onClick={onDelete} sx={{ opacity: 0.55, '&:hover': { opacity: 1 } }}>
        <DeleteOutlineIcon sx={{ width: 14, height: 14 }} />
      </IconButton>
    </Stack>
  );
}

export default function TableQueryConfig({ ds, onPatch }) {
  const tableConfig = ds.tableConfig ?? {
    columns: [],
    whereConditions: [],
    orderBy: [],
  };
  const [allColumns, setAllColumns] = useState([]);
  const [colLoading, setColLoading] = useState(false);

  useEffect(() => {
    if (!ds.sourceName) return;
    setColLoading(true);
    fetchTableColumns(ds.sourceName, ds.schema ?? 'dbo')
      .then((cols) => setAllColumns(cols))
      .finally(() => setColLoading(false));
  }, [ds.sourceName, ds.schema]);

  function patch(nextConfig) {
    onPatch({ tableConfig: { ...tableConfig, ...nextConfig } });
  }

  function toggleColumn(colName) {
    const current = tableConfig.columns ?? [];
    const next = current.includes(colName)
      ? current.filter((column) => column !== colName)
      : [...current, colName];
    patch({ columns: next });
  }

  function selectAllColumns() {
    patch({ columns: allColumns.map((column) => column.columnName) });
  }

  function clearColumns() {
    patch({ columns: [] });
  }

  function addWhere() {
    patch({
      whereConditions: [
        ...(tableConfig.whereConditions ?? []),
        {
          id: `wc_${Date.now()}`,
          column: allColumns[0]?.columnName ?? '',
          operator: '=',
          mappingType: 'FIXED_VALUE',
          paramName: '',
          fixedValue: '',
        },
      ],
    });
  }

  function updateWhere(idx, updated) {
    const next = [...(tableConfig.whereConditions ?? [])];
    next[idx] = { ...updated, operator: '=', mappingType: 'FIXED_VALUE', paramName: '' };
    patch({ whereConditions: next });
  }

  function removeWhere(idx) {
    patch({ whereConditions: (tableConfig.whereConditions ?? []).filter((_, i) => i !== idx) });
  }

  function addOrderBy() {
    patch({
      orderBy: [
        ...(tableConfig.orderBy ?? []),
        { column: allColumns[0]?.columnName ?? '', direction: 'DESC' },
      ],
    });
  }

  function updateOrderBy(idx, updated) {
    const next = [...(tableConfig.orderBy ?? [])];
    next[idx] = updated;
    patch({ orderBy: next });
  }

  function removeOrderBy(idx) {
    patch({ orderBy: (tableConfig.orderBy ?? []).filter((_, i) => i !== idx) });
  }

  const selectedCols = tableConfig.columns ?? [];
  const selectedCountLabel = selectedCols.length === 0
    ? '미선택: SELECT *'
    : `${selectedCols.length}개 선택`;

  const columnRows = useMemo(() => allColumns.map((column) => ({
    name: column.columnName,
    selected: selectedCols.includes(column.columnName),
  })), [allColumns, selectedCols]);

  return (
    <Box sx={{ mt: 1, pt: 1, borderTop: '1px dashed #e5eaf2' }}>
      <Typography sx={{ fontSize: 11, fontWeight: 800, color: '#f59e0b', mb: 1 }}>
        TABLE 쿼리 설정
      </Typography>

      <Box sx={{ mb: 1.5 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.75 }}>
          <Typography sx={{ fontSize: 11, color: '#64748b' }}>
            컬럼 선택
            <Box component="span" sx={{ ml: 0.75, color: '#94a3b8' }}>{selectedCountLabel}</Box>
          </Typography>
          <Stack direction="row" spacing={0.5}>
            <Button size="small" variant="text" onClick={selectAllColumns} disabled={allColumns.length === 0} sx={{ minWidth: 0, px: 0.75, fontSize: 11 }}>
              전체
            </Button>
            <Button size="small" variant="text" onClick={clearColumns} disabled={selectedCols.length === 0} sx={{ minWidth: 0, px: 0.75, fontSize: 11 }}>
              해제
            </Button>
          </Stack>
        </Stack>

        {colLoading ? (
          <CircularProgress size={14} />
        ) : (
          <Paper
            variant="outlined"
            sx={{ maxHeight: 156, overflow: 'auto', p: 0.75, borderRadius: 1, bgcolor: '#fbfcfe' }}
          >
            {columnRows.length === 0 ? (
              <Box sx={{ py: 2 }} />
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 0.25 }}>
                {columnRows.map((column) => (
                  <FormControlLabel
                    key={column.name}
                    control={(
                      <Checkbox
                        size="small"
                        checked={column.selected}
                        onChange={() => toggleColumn(column.name)}
                        sx={{ p: 0.5 }}
                      />
                    )}
                    label={column.name}
                    sx={{
                      m: 0,
                      minWidth: 0,
                      '& .MuiFormControlLabel-label': {
                        fontSize: 11,
                        color: column.selected ? '#1e293b' : '#64748b',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      },
                    }}
                  />
                ))}
              </Box>
            )}
          </Paper>
        )}
      </Box>

      <Divider sx={{ my: 1 }} />

      <Box sx={{ mb: 1.5 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.75 }}>
          <Typography sx={{ fontSize: 11, color: '#64748b' }}>WHERE 조건</Typography>
          <Button
            size="small"
            variant="outlined"
            startIcon={<AddCircleOutlineIcon sx={{ width: 14, height: 14 }} />}
            onClick={addWhere}
            disabled={allColumns.length === 0}
            sx={{ height: 24, fontSize: 11, px: 1 }}
          >
            조건 추가
          </Button>
        </Stack>
        <Stack spacing={0.75}>
          {(tableConfig.whereConditions ?? []).map((cond, i) => (
            <WhereRow
              key={cond.id ?? i}
              cond={cond}
              columns={allColumns}
              onChange={(updated) => updateWhere(i, updated)}
              onDelete={() => removeWhere(i)}
            />
          ))}
        </Stack>
      </Box>

      <Divider sx={{ my: 1 }} />

      <Box sx={{ mb: 1.5 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.75 }}>
          <Typography sx={{ fontSize: 11, color: '#64748b' }}>정렬</Typography>
          <Button
            size="small"
            variant="outlined"
            startIcon={<AddCircleOutlineIcon sx={{ width: 14, height: 14 }} />}
            onClick={addOrderBy}
            disabled={allColumns.length === 0}
            sx={{ height: 24, fontSize: 11, px: 1 }}
          >
            정렬 추가
          </Button>
        </Stack>
        <Stack spacing={0.75}>
          {(tableConfig.orderBy ?? []).map((order, i) => (
            <SortRow
              key={`${order.column}_${i}`}
              order={order}
              columns={allColumns}
              onChange={(updated) => updateOrderBy(i, updated)}
              onDelete={() => removeOrderBy(i)}
            />
          ))}
        </Stack>
      </Box>

      <Divider sx={{ my: 1 }} />

      <TextField
        size="small"
        label="TOP N"
        type="number"
        placeholder="전체"
        value={tableConfig.topN ?? ''}
        onChange={(event) => {
          const raw = event.target.value;
          patch({ topN: raw === '' ? undefined : Math.max(1, parseInt(raw, 10) || 1) });
        }}
        helperText="비우면 전체 조회"
        FormHelperTextProps={{ sx: { fontSize: 10, mt: 0.35 } }}
        sx={{ ...FIELD_SX, width: 120 }}
        inputProps={{ min: 1, max: 100000 }}
      />
    </Box>
  );
}
