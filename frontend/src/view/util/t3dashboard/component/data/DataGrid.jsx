import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Box,
  TableSortLabel,
  TextField,
  Typography,
  Button,
  Pagination,
  Select,
  MenuItem,
  FormControl,
} from '@mui/material';
import * as XLSX from 'xlsx';
import { generateId } from '../../utils/utils';
import { transLangKey } from '@zionex/wingui-core';
import { apiConfig } from "../../restapi/apiconfig";
import { useTheme } from '@mui/material/styles';
import { useDataGridStyle } from "@insight/style/AppCommonStyle";

const DataGrid = ({ 
  title, 
  rowData, 
  columnDefs, 
  usePagination = false,
  defaultPageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  pageSizeMenuProps,
  defaultHeight = 400,
  rowHeight = 35,  // 추가
  maxHeight = 380, // 추가: 최대 높이 제한
  ...props 
}) => {

  // 동적 높이 계산
  const calculatedHeight = useMemo(() => {
    const headerHeight = 40; // 헤더 높이
    const contentHeight = (rowData?.length || 0) * rowHeight + headerHeight;
    return Math.min(contentHeight, maxHeight);
  }, [rowData, rowHeight, maxHeight]);
  
  const [height, setHeight] = useState(calculatedHeight);
  
  useEffect(() => {
    setHeight(calculatedHeight);
  }, [calculatedHeight]);

  const classes = useDataGridStyle();
  
  const theme = useTheme();
  const themeMode = theme.palette.mode;
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: defaultPageSize,
  });
  // const [height, setHeight] = useState(defaultHeight);
  const [isDragging, setIsDragging] = useState(false);

  const uuid = useRef(null);
  const tableContainerRef = useRef(null);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);

  const maxResizeHeightRef = useRef(0);
  const gridOuterRef = useRef(null);

  if (uuid.current == null) {
    uuid.current = 'grid-div-cont-' + generateId();
  }

  // 드래그 핸들러
  const handleMouseDown = (e) => {
    setIsDragging(true);
    startYRef.current = e.clientY;
    startHeightRef.current = height;

    // ✅ 무한 확장 방지: 화면 기준으로 최대 높이 계산
    const rect = gridOuterRef.current?.getBoundingClientRect();
    const viewportH = window.innerHeight || 800;
    // 아래 여유(footer/입력창/여백 등) 감안해서 180~240px 정도 빼기
    const safeBottomGap = 220;
    const maxByViewport = rect
      ? Math.max(240, Math.floor(viewportH - rect.top - safeBottomGap))
      : Math.floor(viewportH * 0.7);
 
    // props.maxHeight(기존)는 “자동 계산용 상한”이므로 드래그 상한은 별도로 적용
    maxResizeHeightRef.current = Math.max(240, maxByViewport);

    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      
      const deltaY = e.clientY - startYRef.current;
      // const newHeight = Math.max(200, startHeightRef.current + deltaY); // 최소 높이 200px
      const minH = 200;
      const maxH = maxResizeHeightRef.current || 600;
      const raw = startHeightRef.current + deltaY;
      const newHeight = Math.min(maxH, Math.max(minH, raw));

      setHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // AG Grid columnDefs를 TanStack Table 형식으로 변환
  const columns = useMemo(() => {
    return columnDefs?.map((colDef) => ({
      id: colDef.field || colDef.headerName,
      accessorKey: colDef.field,
      header: colDef.headerName || colDef.field,
      cell: (info) => {
        if (colDef.cellRenderer) {
          return colDef.cellRenderer({ value: info.getValue() });
        }
        return info.getValue();
      },
      enableSorting: colDef.sortable !== false,
      enableColumnFilter: colDef.filter !== false,
      size: colDef.width || 150,
      minSize: colDef.minWidth || 50,
      maxSize: colDef.maxWidth || 500,
    })) || [];
  }, [columnDefs]);

  const table = useReactTable({
    data: rowData || [],
    columns,
    state: {
      sorting,
      globalFilter,
      ...(usePagination && { pagination }),
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    ...(usePagination && { onPaginationChange: setPagination }),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    ...(usePagination && { getPaginationRowModel: getPaginationRowModel() }),
    debugTable: false,
  });

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 35,
    overscan: 10,
    enabled: !usePagination,
  });

  const virtualRows = usePagination ? [] : rowVirtualizer.getVirtualItems();
  const totalSize = usePagination ? 0 : rowVirtualizer.getTotalSize();

  const paddingTop = virtualRows.length > 0 ? virtualRows?.[0]?.start || 0 : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? totalSize - (virtualRows?.[virtualRows.length - 1]?.end || 0)
      : 0;

  const measureElementRef = useCallback((node, virtualRow) => {
    if (node && !usePagination) {
      requestAnimationFrame(() => {
        rowVirtualizer.measureElement(node);
      });
    }
  }, [rowVirtualizer, usePagination]);

  const handleExcelDownload = useCallback(() => {
    if (isDownloading) {
      return;
    }
    setIsDownloading(true);
    try {
      const headers = columnDefs?.map(col => col.headerName || col.field) || [];

      const allRows = table.getFilteredRowModel().rows;
      const excelData = allRows.map(row => {
        const rowObj = {};
        columnDefs?.forEach(colDef => {
          const field = colDef.field;
          rowObj[colDef.headerName || field] = row.original[field];
        });
        return rowObj;
      });
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, title || 'Data');

      const maxWidth = 50;
      const colWidths = headers.map((header) => {
        const maxLength = Math.max(
          String(header || '').length,
          ...excelData.map(row => {
            const value = row[header];
            return value === null || value === undefined ? 0 : String(value).length;
          })
        );
        return { wch: Math.min(maxLength + 2, maxWidth) };
      });
      worksheet['!cols'] = colWidths;

      const fileName = `${title || 'data'}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      console.error('Excel 다운로드 중 오류 발생:', error);
      alert(transLangKey('Excel 다운로드 중 오류가 발생했습니다.'));
    } finally {
      setIsDownloading(false);
    }
  }, [table, columnDefs, title, isDownloading]);

  const handlePageChange = (event, newPage) => {
    setPagination(prev => ({ ...prev, pageIndex: newPage - 1 }));
  };

  const handlePageSizeChange = (event) => {
    setPagination(prev => ({ 
      pageIndex: 0, 
      pageSize: Number(event.target.value) 
    }));
  };

  const pageCount = usePagination ? table.getPageCount() : 0;
  const currentPage = usePagination ? pagination.pageIndex + 1 : 0;
  const totalRows = table.getFilteredRowModel().rows.length;

  return (
    <Box 
      id={uuid.current} 
      className={classes.container}
      ref={gridOuterRef}
      sx={{ 
        position: 'relative',
        userSelect: isDragging ? 'none' : 'auto',
        // width: '100%', 
        maxWidth: '100%',  // 추가
        overflow: 'hidden', // 추가
        p: 0,              // 컨테이너 기본 padding 제거
        py: 0.5,           // 상하만 최소 여백(가독성 유지)
      }}
    >
      {/* 헤더 툴바 */}
      <Box className={classes.toolbar}>
        <Tooltip title={transLangKey("Download")}>
          <Button
            className={classes.downloadBtn}
            size="small"
            disabled={isDownloading}
            sx={{ py: 0.25, minHeight: 0 }}
            startIcon={<apiConfig.SvgIcon filePath={apiConfig.getImagePath("/images/icons/insight")} name={"Download"} size={15} color={themeMode === 'dark' ? "#FFFFFF" : '#555555'}/>}
            onClick={handleExcelDownload}
          >
            {transLangKey("Download")}
          </Button>
        </Tooltip>

        {/* <Typography variant="body2" className={classes.totalText}>
          {transLangKey("Total")} {totalRows.toLocaleString()} {transLangKey("rows")}
        </Typography> */}

        {usePagination && (
          <FormControl size="small" className={classes.selectControl}>
            <Select
              value={pagination.pageSize}
              onChange={handlePageSizeChange}
              MenuProps={pageSizeMenuProps}
            >
              {pageSizeOptions.map(size => (
                <MenuItem key={size} value={size}>
                  {size} {transLangKey("rows")}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        <TextField
          size="small"
          placeholder={transLangKey("Search...")}
          value={globalFilter ?? ''}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className={classes.searchField}
        />
      </Box>

      {/* 테이블 컨테이너 */}
      <Box sx={{ position: 'relative' }}>
        <TableContainer 
          component={Paper} 
          ref={tableContainerRef}
          className={classes.tableContainer}
          sx={{ 
            height: `${height}px`,
            pointerEvents: isDragging ? 'none' : 'auto',
            overflowX: 'auto',
            overflowY: 'auto',
          }}
        >
          <Table size="small" className={classes.table}
            sx={{ width: 'max-content' }}  // ✅ 컬럼 합만큼 테이블은 커져도
          >
            <TableHead className={classes.tableHead}>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className={classes.tableHeaderRow}>
                  {headerGroup.headers.map((header) => (
                    <TableCell
                      key={header.id}
                      className={classes.tableHeaderCell}
                      sx={{ 
                        width: header.getSize(),
                        minWidth: header.column.columnDef.minSize,
                        maxWidth: header.column.columnDef.maxSize,
                      }}
                    >
                      {header.isPlaceholder ? null : (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {header.column.getCanSort() ? (
                            <TableSortLabel
                              active={!!header.column.getIsSorted()}
                              direction={header.column.getIsSorted() || 'asc'}
                              onClick={header.column.getToggleSortingHandler()}
                              className={classes.tableSortLabel}
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                            </TableSortLabel>
                          ) : (
                            flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )
                          )}
                        </Box>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableHead>

            <TableBody>
              {usePagination ? (
                <>
                  {rows.map((row, index) => (
                    <TableRow key={row.id} className={classes.tableBodyRow}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell 
                          key={cell.id}
                          className={classes.tableBodyCell}
                          sx={{
                            width: cell.column.getSize(),
                            minWidth: cell.column.columnDef.minSize,
                            maxWidth: cell.column.columnDef.maxSize,
                          }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </>
              ) : (
                <>
                  {paddingTop > 0 && (
                    <TableRow>
                      <TableCell sx={{ height: paddingTop }} colSpan={columns.length} />
                    </TableRow>
                  )}
                  {virtualRows.map((virtualRow) => {
                    const row = rows[virtualRow.index];
                    return (
                      <TableRow 
                        key={row.id}
                        data-index={virtualRow.index}
                        ref={(node) => measureElementRef(node, virtualRow)}
                        className={classes.tableBodyRow}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell 
                            key={cell.id}
                            className={classes.tableBodyCell}
                            sx={{
                              width: cell.column.getSize(),
                              minWidth: cell.column.columnDef.minSize,
                              maxWidth: cell.column.columnDef.maxSize,
                            }}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                  {paddingBottom > 0 && (
                    <TableRow>
                      <TableCell sx={{ height: paddingBottom }} colSpan={columns.length} />
                    </TableRow>
                  )}
                </>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Resize Handle */}
        <Box
          onMouseDown={handleMouseDown}
          sx={{
            height: '10px',
            cursor: 'ns-resize',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            userSelect: 'none',
            touchAction: 'none',
            mt: '2px', // ✅ 너무 벌어지지 않게 최소만
            borderRadius: '6px',
            backgroundColor: isDragging ? 'rgba(0, 0, 0, 0.06)' : 'transparent',
            '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
          }}
          // sx={{
          //   position: 'absolute',
          //   bottom: 0,
          //   left: 0,
          //   right: 0,
          //   height: '8px',
          //   cursor: 'ns-resize',
          //   backgroundColor: isDragging ? 'rgba(0, 0, 0, 0.1)' : 'transparent',
          //   transition: isDragging ? 'none' : 'background-color 0.2s',
          //   display: 'flex',
          //   alignItems: 'center',
          //   justifyContent: 'center',
          //   zIndex: 10,
          //   '&:hover': {
          //     backgroundColor: 'rgba(0, 0, 0, 0.05)',
          //   }
          // }}
        >
          <Box
            sx={{
              width: '40px',
              height: '4px',
              borderRadius: '2px',
              backgroundColor: isDragging ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.2)',
              transition: isDragging ? 'none' : 'background-color 0.2s'
            }}
          />
        </Box>
      </Box>

      {/* 하단 정보 표시 */}
      <Box className={classes.footer}
        sx={{
          py: 0.25,      // ✅ 상하 최소
          px: 0,
          mt: 0.25,      // ✅ 테이블과 너무 붙지 않게만
          minHeight: 0,
        }}
      >
        <Typography variant="caption" className={classes.footerText}>
          {globalFilter ? 
            `${transLangKey("Filtered")}: ${totalRows.toLocaleString()} ${transLangKey("items")} (${transLangKey("Total")}: ${(rowData?.length || 0).toLocaleString()} ${transLangKey("items")})` : 
            `${transLangKey("Total")}: ${totalRows.toLocaleString()} ${transLangKey("items")}`
          }
        </Typography>
        
        {usePagination ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="caption" className={classes.footerText}>
              {transLangKey("Page")} {currentPage} / {pageCount} ({pagination.pageSize * (currentPage - 1) + 1}-{Math.min(pagination.pageSize * currentPage, totalRows)} {transLangKey("of")} {totalRows})
            </Typography>
            <Pagination 
              count={pageCount} 
              page={currentPage} 
              onChange={handlePageChange}
              size="small"
              showFirstButton
              showLastButton
              className={classes.pagination}
            />
          </Box>
        ) : null}
      </Box>
    </Box>
  );
};

export default DataGrid;
