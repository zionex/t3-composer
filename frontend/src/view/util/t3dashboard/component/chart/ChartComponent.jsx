import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import {
  Box,
  Button,
  Popover,
} from '@mui/material';
import {
  Settings as SettingsIcon,
} from '@mui/icons-material';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';

import ChartPropSetting, { detectColumnTypes, createInitialDataset, createChartOptions } from './ChartPropSetting';

function withDefaultReadOnlyChartPlugins(config) {
  if (!config) return config;
  return {
    ...config,
    options: {
      ...(config.options || {}),
      plugins: {
        ...(config.options?.plugins || {}),
        dragData: config.options?.plugins?.dragData ?? false,
      },
    },
  };
}

function ChartComponent({ columnDefs, rowData, chartConfig, showToolbar = true, ...props }) {
  const [chartOption, setChartOption] = useState(null);
  const [dataSet, setDataSet] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);

  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartConfig) {
      setChartOption(withDefaultReadOnlyChartPlugins(chartConfig));
      setDataSet([]);
      return;
    }

    if (!columnDefs?.length || !rowData?.length) {
      setChartOption(null);
      setDataSet([]);
      return;
    }

    detectColumnTypes(columnDefs, rowData)
      .then(([dateColumns, numericColumns, nonNumericColumns]) => createInitialDataset(dateColumns, numericColumns, nonNumericColumns)
        .then((dsOptions) => {
          if (!dsOptions?.length) {
            setChartOption(null);
            setDataSet([]);
            return;
          }

          const activeDataset = [dsOptions[0]];
          setDataSet(dsOptions);
          setChartOption(createChartOptions(activeDataset, dateColumns, rowData));
        }))
      .catch(() => {
        setChartOption(null);
        setDataSet([]);
      });
  }, [chartConfig, columnDefs, rowData]);

  useEffect(() => {
    if (!chartRef.current || !chartOption) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
      return undefined;
    }

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    chartInstance.current = new Chart(chartRef.current, chartOption);

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [chartOption]);

  useEffect(() => {
    const canvas = chartRef.current;
    const container = canvas?.parentElement;
    if (!container || typeof ResizeObserver === 'undefined') return undefined;

    let rafId = null;
    const resizeChart = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        chartInstance.current?.resize();
      });
    };

    const observer = new ResizeObserver(resizeChart);
    observer.observe(container);
    resizeChart();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [chartOption]);

  const handleZoomReset = () => {
    chartInstance.current?.resetZoom?.();
  };

  const openConfigDialog = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeConfigDialog = () => {
    setAnchorEl(null);
  };

  const getChartBoxHeight = () => props.height || (showToolbar ? 'calc(100% - 24px)' : '100%');

  const { chartBoxStyle, popoverProps } = props;
  const open = Boolean(anchorEl);

  return (
    <Box
      style={{
        display: 'flex',
        alignItems: 'stretch',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        flex: 1,
        minWidth: 0,
        ...chartBoxStyle,
      }}
    >
      {showToolbar && !chartConfig && (
        <Box data-role="chartappbar" sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', height: '24px', gap: 1 }}>
          <Box sx={{ display: 'flex' }}>
            <Button
              variant="outlined"
              startIcon={<SettingsIcon />}
              onClick={openConfigDialog}
            >
              Dataset
            </Button>
          </Box>
          <Box sx={{ display: 'flex' }}>
            <Button
              variant="outlined"
              startIcon={<CenterFocusStrongIcon />}
              onClick={handleZoomReset}
            >
              Reset Zoom
            </Button>
          </Box>
        </Box>
      )}
      <Box
        data-role="chartContainer"
        style={{
          height: `${getChartBoxHeight()}`,
          width: '100%',
          flex: 1,
          minHeight: 0,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <canvas ref={chartRef} style={{ display: 'block', width: '100%', height: '100%' }} />
      </Box>
      {showToolbar && !chartConfig && (
        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={closeConfigDialog}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          {...popoverProps}
        >
          <ChartPropSetting
            chartOption={chartOption}
            dataSet={dataSet}
            handleDataSetUpdate={setDataSet}
            columnDefs={columnDefs}
            rowData={rowData}
            handleChartUpdate={setChartOption}
          />
        </Popover>
      )}
    </Box>
  );
}

export default ChartComponent;
