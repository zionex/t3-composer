import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useGenericData } from './useGenericData';
import KpiRenderer from './renderers/KpiRenderer';
import ChartRenderer from './renderers/ChartRenderer';
import TableRenderer from './renderers/TableRenderer';

function GenericWidget({ dataConfig, visualConfig }) {
  const { data, loading, error } = useGenericData(dataConfig);

  if (loading) {
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#fff', borderRadius: '6px' }}>
        <CircularProgress size={22} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#fff', borderRadius: '6px', px: 2 }}>
        <Typography sx={{ fontSize: 12, color: '#dc2626', textAlign: 'center' }}>{error}</Typography>
      </Box>
    );
  }

  if (!data?.length) {
    return <Box sx={{ height: '100%', bgcolor: '#fff', borderRadius: '6px' }} />;
  }

  const type = visualConfig?.type;

  switch (type) {
    case 'kpi':
      return <KpiRenderer data={data} config={visualConfig} />;
    case 'bar':
    case 'bar_stacked':
    case 'bar_h':
    case 'line':
    case 'area':
    case 'bar_line':
    case 'pie':
    case 'doughnut':
      return <ChartRenderer data={data} config={visualConfig} />;
    case 'table':
      return <TableRenderer data={data} config={visualConfig} />;
    default:
      return <Box sx={{ height: '100%', bgcolor: '#fff', borderRadius: '6px' }} />;
  }
}

export default GenericWidget;
