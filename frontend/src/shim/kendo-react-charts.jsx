/**
 * @progress/kendo-react-charts shim — 산출물 JSX 가 Kendo Chart API 를 환각으로 import 할 때
 * frontend 가 빌드 깨지지 않도록 react-chartjs-2 / chart.js 로 wrapping.
 *
 * 지원 API (실사용 기반 최소 셋):
 *   <Chart> (style)
 *     <ChartTitle text="..." />
 *     <ChartLegend position="bottom|top|left|right" visible={true} />
 *     <ChartCategoryAxis>
 *       <ChartCategoryAxisItem categories={[...]} />
 *     </ChartCategoryAxis>
 *     <ChartValueAxis>
 *       <ChartValueAxisItem min max />
 *     </ChartValueAxis>
 *     <ChartSeries>
 *       <ChartSeriesItem type="line|bar|column|area" name data={[...]} color />
 *     </ChartSeries>
 *   </Chart>
 */
import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale,
  PointElement, LineElement, BarElement,
  Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Chart as Chart2 } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement,
                 Title, Tooltip, Legend, Filler);

// 명시적 displayName 으로 부모 Chart 가 children walk 시 식별
function tagged(name) {
  const C = () => null;
  C.displayName = name;
  return C;
}

export const ChartTitle             = tagged('KendoChartTitle');
export const ChartLegend            = tagged('KendoChartLegend');
export const ChartCategoryAxis      = tagged('KendoChartCategoryAxis');
export const ChartCategoryAxisItem  = tagged('KendoChartCategoryAxisItem');
export const ChartValueAxis         = tagged('KendoChartValueAxis');
export const ChartValueAxisItem     = tagged('KendoChartValueAxisItem');
export const ChartSeries            = tagged('KendoChartSeries');
export const ChartSeriesItem        = tagged('KendoChartSeriesItem');

function flattenChildren(children) {
  const out = [];
  React.Children.forEach(children, (c) => {
    if (!c) return;
    if (c.type && c.type.displayName) {
      out.push(c);
      // sub-collections (axis/series) 의 children 도 한 단계 더 풀기
      const inner = c.props?.children;
      if (inner) {
        React.Children.forEach(inner, (g) => {
          if (g && g.type && g.type.displayName) out.push(g);
        });
      }
    }
  });
  return out;
}

const SERIES_TYPE_MAP = {
  line: 'line',
  area: 'line',     // area = line + fill
  bar: 'bar',
  column: 'bar',
};

export function Chart({ style, children }) {
  const nodes = flattenChildren(children);

  const titleNode = nodes.find((n) => n.type.displayName === 'KendoChartTitle');
  const legendNode = nodes.find((n) => n.type.displayName === 'KendoChartLegend');
  const categoryAxisItem = nodes.find((n) => n.type.displayName === 'KendoChartCategoryAxisItem');
  const valueAxisItem = nodes.find((n) => n.type.displayName === 'KendoChartValueAxisItem');
  const seriesItems = nodes.filter((n) => n.type.displayName === 'KendoChartSeriesItem');

  const labels = categoryAxisItem?.props?.categories || [];
  const types = new Set();

  const datasets = seriesItems.map((s) => {
    const t = SERIES_TYPE_MAP[s.props?.type] || 'line';
    types.add(t);
    const isArea = s.props?.type === 'area';
    return {
      type: t,
      label: s.props?.name ?? '',
      data: s.props?.data ?? [],
      backgroundColor: isArea ? (s.props?.color || '#1976d2') + '33' : (s.props?.color || '#1976d2'),
      borderColor: s.props?.color || '#1976d2',
      borderWidth: 2,
      fill: isArea,
      tension: 0.2,
      pointRadius: t === 'line' ? 2 : 0,
    };
  });

  // 혼합 type 이면 chart.js 의 'bar' 베이스 + dataset.type 으로 overlay
  const chartType = types.size === 1 ? Array.from(types)[0] : 'bar';

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: titleNode?.props?.text
        ? { display: true, text: titleNode.props.text, font: { size: 13, weight: 600 } }
        : { display: false },
      legend: legendNode
        ? {
            display: legendNode.props?.visible !== false,
            position: legendNode.props?.position || 'bottom',
          }
        : { display: true, position: 'bottom' },
      tooltip: { enabled: true },
    },
    scales: {
      x: { ticks: { font: { size: 11 } } },
      y: {
        beginAtZero: true,
        min: valueAxisItem?.props?.min,
        max: valueAxisItem?.props?.max,
        ticks: { font: { size: 11 } },
      },
    },
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', ...style }}>
      <Chart2 type={chartType} data={{ labels, datasets }} options={options} />
    </div>
  );
}

export default {
  Chart, ChartTitle, ChartLegend,
  ChartCategoryAxis, ChartCategoryAxisItem,
  ChartValueAxis, ChartValueAxisItem,
  ChartSeries, ChartSeriesItem,
};
