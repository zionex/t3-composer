import React, { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';
import DataGrid from '../../../data/DataGrid';

const DEFAULT_COLUMN_WIDTH = 120;
const DEFAULT_COLUMN_ALIGN = 'left';
// DataGrid 가 TableContainer 외에 차지하는 영역:
//   - root py: 0.5 → 8px
//   - toolbar (Download/Search 행) — 아래 sx '& > div > div:first-of-type { display:none }'
//     로 숨겨져 있어 레이아웃 차지하지 않음. 토글이 생기면 56px 추가 필요.
//   - footer (Total: N items, mt + py + caption line) → ~22-24px
//   - 안전 마진 ~4px
// 합 ~36px.
const GRID_CHROME_HEIGHT = 36;

const DEFAULT_PALETTE = ['#3b82f6', '#60a5fa', '#1d4ed8', '#93c5fd'];

function hexToRgba(hex, alpha) {
  const normalized = String(hex || '').replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return `rgba(59, 130, 246, ${alpha})`;
  const value = Number.parseInt(normalized, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function TableRenderer({ data, config }) {
  const containerRef = useRef(null);
  const [containerHeight, setContainerHeight] = useState(0);
  const palette = config.palette?.length ? config.palette : DEFAULT_PALETTE;
  const primary = palette[0] ?? DEFAULT_PALETTE[0];
  const secondary = palette[1] ?? primary;
  const stripeBg = hexToRgba(primary, 0.055);
  const hoverBg = hexToRgba(primary, 0.1);
  const borderColor = hexToRgba(primary, 0.28);
  const fields = new Set(Object.keys(data?.[0] ?? {}));
  const columnDefs = (config.columns ?? []).filter((col) => fields.has(col.field)).map((col) => ({
    field: col.field,
    headerName: col.headerText ?? col.field,
    width: col.width ?? DEFAULT_COLUMN_WIDTH,
    align: col.align ?? DEFAULT_COLUMN_ALIGN,
  }));
  const maxGridBodyHeight = Math.max(96, containerHeight - GRID_CHROME_HEIGHT);

  useEffect(() => {
    if (!containerRef.current) return undefined;

    const updateHeight = () => {
      const nextHeight = containerRef.current?.getBoundingClientRect().height ?? 0;
      setContainerHeight(nextHeight);
    };

    updateHeight();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateHeight);
      return () => window.removeEventListener('resize', updateHeight);
    }

    const observer = new ResizeObserver(updateHeight);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  if (columnDefs.length === 0) {
    return <Box sx={{ height: '100%', width: '100%' }} />;
  }

  return (
    <Box
      ref={containerRef}
      sx={{
        height: '100%',
        width: '100%',
        minHeight: 0,
        overflow: 'hidden',
        boxSizing: 'border-box',
        bgcolor: '#fff',
        borderRadius: '6px',
        '& > div': {
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          boxSizing: 'border-box',
        },
        '& > div > div:first-of-type': {
          display: 'none !important',
        },
        '& .MuiTableContainer-root': {
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          boxSizing: 'border-box',
          overflowX: 'auto !important',
          overflowY: 'auto !important',
        },
        '& .MuiTable-root': {
          width: 'max-content !important',
          minWidth: '100%',
        },
        '& .MuiTableHead-root .MuiTableCell-root': {
          bgcolor: primary,
          color: '#fff',
          borderBottom: `1px solid ${primary}`,
          fontWeight: 800,
        },
        '& .MuiTableHead-root .MuiTableSortLabel-root': {
          color: '#fff',
          '&:hover': { color: '#fff' },
          '&.Mui-active': { color: '#fff' },
          '& .MuiTableSortLabel-icon': { color: '#fff !important' },
        },
        '& .MuiTableBody-root .MuiTableRow-root:nth-of-type(even) .MuiTableCell-root': {
          bgcolor: stripeBg,
        },
        '& .MuiTableBody-root .MuiTableRow-root:hover .MuiTableCell-root': {
          bgcolor: `${hoverBg} !important`,
        },
        '& .MuiTableBody-root .MuiTableCell-root': {
          borderBottomColor: hexToRgba(secondary, 0.18),
        },
        '& button': {
          borderColor,
        },
        '& button:hover': {
          borderColor: primary,
          bgcolor: hoverBg,
        },
      }}
    >
      <DataGrid
        columnDefs={columnDefs}
        rowData={data ?? []}
        maxHeight={maxGridBodyHeight}
        fitContainer
        showToolbar={false}
        showResizeHandle={false}
      />
    </Box>
  );
}

export default TableRenderer;
