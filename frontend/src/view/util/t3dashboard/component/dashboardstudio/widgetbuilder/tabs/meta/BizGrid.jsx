import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Typography,
} from '@mui/material';

import { compareValues, getSortValue } from './metaUtils';

export default function BizGrid({ rows, loading, columns, renderRow, emptyText = '데이터 없음' }) {
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState({ key: '', direction: 'asc' });
  const rowsPerPage = 30;
  const sortedRows = useMemo(() => {
    if (!sort.key) return rows;
    const column = columns.find((col) => col.key === sort.key);
    if (!column || column.sortable === false) return rows;
    const direction = sort.direction === 'desc' ? -1 : 1;
    return [...rows].sort((a, b) => compareValues(getSortValue(a, column), getSortValue(b, column)) * direction);
  }, [columns, rows, sort]);
  const paged = sortedRows.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  useEffect(() => {
    setPage(0);
  }, [rows, sort.key, sort.direction]);

  const handleSort = (column) => {
    if (column.sortable === false) return;
    setSort((current) => ({
      key: column.key,
      direction: current.key === column.key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {loading ? (
        <Box sx={{ display: 'grid', placeItems: 'center', flex: 1 }}><CircularProgress size={24} /></Box>
      ) : rows.length === 0 ? (
        <Box sx={{ p: 2 }}><Typography sx={{ fontSize: 13, color: '#64748b' }}>{emptyText}</Typography></Box>
      ) : (
        <>
          <TableContainer component={Paper} variant="outlined" sx={{ flex: 1, overflow: 'auto' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {columns.map((col) => (
                    <TableCell key={col.key} sx={{ fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap', bgcolor: '#f8fafc' }}>
                      {col.sortable === false ? col.label : (
                        <TableSortLabel
                          active={sort.key === col.key}
                          direction={sort.key === col.key ? sort.direction : 'asc'}
                          onClick={() => handleSort(col)}
                          sx={{ '& .MuiTableSortLabel-icon': { fontSize: 16 } }}
                        >
                          {col.label}
                        </TableSortLabel>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {paged.map((row, idx) => renderRow(row, idx))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div" count={sortedRows.length} page={page}
            onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[rowsPerPage]} sx={{ flexShrink: 0 }}
          />
        </>
      )}
    </Box>
  );
}
