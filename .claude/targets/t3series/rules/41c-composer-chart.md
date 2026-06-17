# 41c. T3SERIES — 차트 라이브러리 표준 (overlay)

> **Target 한정**: T3SERIES (wingui-core stack). 다른 Target (PLANNEL/LGES_NEXTSCM)
> 은 자체 chart stack 정의에 따라 별도 overlay 운영. 공용 `rules/21-components.md §5`
> 의 표가 positive 진술 (Chart.js 표준) 이라면, 이 overlay 는 negative 강제
> (recharts 등 절대 금지) 를 담는다.

## 1. 표준 stack (단일 진실 저장소)

T3SERIES 산출물 (JSX) 의 차트는 **반드시 다음 중 하나**:

| 컴포넌트 | 경로 | 용도 |
|---|---|---|
| `ChartComponent` | `@zionex/wingui-core/component/chart/ChartComponent` | 공용 Chart.js wrapper — 가장 일반적 |
| `Line` / `Bar` / `Chart` / `PolarArea` | `react-chartjs-2` | wrapper 가 불충분할 때 직접 사용 |
| `GanttChart` | `@zionex/wingui-core/component/gantt/GanttChart` | 간트 |

이외의 chart 라이브러리는 **wingui 본 환경에 미설치**. 산출물에 import 하면
[화면 실행] preview 는 graceful-degradation mock 으로 통과해도, **wingui sync
후 webpack `Module not found` 컴파일 실패** → 전체 startup down.

## 2. 절대 금지 (hook block)

다음 import 는 hook (`.claude/targets/t3series/hooks/validators/jsx-chart-libs.sh`)
이 Write/Edit 시점에 차단:

```jsx
// ❌ 모두 block — wingui 본 환경 미설치
import { ... } from 'recharts';
import { ... } from 'victory';
import { ... } from '@visx/...';
import { ... } from '@nivo/...';
import { ... } from 'echarts';
import 'echarts-for-react';
import { ... } from 'apexcharts';
import { ... } from 'react-apexcharts';
import { ... } from 'plotly.js';
import { ... } from 'react-plotly.js';
import { ... } from 'highcharts';
import { ... } from 'highcharts-react-official';
import { ... } from 'd3';                    // ★ react-chartjs-2 와 혼용 금지
import { ... } from 'react-d3-library';
import { ... } from 'chartist';
import { ... } from 'react-vis';
```

## 3. 변환 가이드 — recharts 산출물 → Chart.js

LLM 이 환각으로 recharts 를 만든 경우 다음 매핑으로 교정:

| recharts | Chart.js + react-chartjs-2 (또는 ChartComponent) |
|---|---|
| `<LineChart>` + `<Line>` + `<XAxis>` + `<YAxis>` + `<CartesianGrid>` | `<Line data={chartData} options={chartOptions} />` (react-chartjs-2) 또는 `<ChartComponent type="line" data={...} options={...} />` |
| `<BarChart>` + `<Bar>` | `<Bar ...>` 또는 `<ChartComponent type="bar" ...>` |
| `<PieChart>` + `<Pie>` + `<Cell>` | `<ChartComponent type="pie" data={{labels, datasets:[{data, backgroundColor:[...]}]}} />` |
| `<AreaChart>` + `<Area>` | `<Line ... options={{ ..., fill: true }}>` |
| `<ResponsiveContainer width="100%" height="100%">` | 부모 wrapper 에 `flex:1 + minHeight:0` (rules/41a §4.2.1) — Chart.js 가 부모 채움 |
| `<Tooltip>` (recharts) | `options.plugins.tooltip` |
| `<Legend>` (recharts) | `options.plugins.legend` |

### data shape 변환
```js
// recharts data (row-oriented)
const data = [
  { month: '1월', sales: 100, cost: 60 },
  { month: '2월', sales: 130, cost: 70 },
];

// Chart.js data (column-oriented, datasets 별)
const chartData = {
  labels: data.map((d) => d.month),
  datasets: [
    { label: '매출', data: data.map((d) => d.sales), borderColor: '#7CA7E0', backgroundColor: 'rgba(124,167,224,0.2)' },
    { label: '비용', data: data.map((d) => d.cost),  borderColor: '#E0989A', backgroundColor: 'rgba(224,152,154,0.2)' },
  ],
};
```

## 4. 표준 옵션 패턴

```js
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,             // 부모 flex 채움 — rules/41a §4.2.1
  plugins: {
    legend: { position: 'bottom', labels: { font: { size: 12 } } },
    tooltip: { enabled: true },
  },
  scales: {                                // bar / line 만
    x: { ticks: { font: { size: 11 } } },
    y: { ticks: { font: { size: 11 } }, beginAtZero: true },
  },
};
```

## 5. ChartComponent vs react-chartjs-2 — 선택 기준

- **`ChartComponent`**: 표준 옵션·테마·반응형이 미리 설정됨. KPI/Dashboard 위젯의 단순 line/bar/pie 차트는 이게 1차 선택.
- **`react-chartjs-2`**: ChartComponent 가 노출 안 한 prop (예: `chart.ref` 로 update / chartKey 강제 리마운트 / 커스텀 plugin) 이 필요할 때.

`rules/21-components.md §5` 의 "ChartComponent · `chart.current.data.datasets` 갱신 후 `chart.current.update()`" 패턴이 표준 update 방식.

## 6. 자기 검증 (출력 직전)

LLM 산출물 자기 점검 체크리스트 — JSX 첫 import 블록 검사:
- [ ] `from 'recharts'` 등장 → 0건
- [ ] chart 라이브러리는 `@zionex/wingui-core/component/chart/ChartComponent` 또는 `react-chartjs-2` 만
- [ ] `<LineChart>`/`<BarChart>`/`<PieChart>` (recharts JSX 태그) 등장 → 0건. `<Line>`/`<Bar>`/`<Chart>` 만 (react-chartjs-2 의 component 이름)

## 7. Anti-patterns

| ❌ | ✅ | 검증 |
|---|---|---|
| `import { LineChart, Line, XAxis, YAxis, ... } from 'recharts'` | `import { Line } from 'react-chartjs-2'` 또는 `import { ChartComponent } from '@zionex/wingui-core/component/chart/ChartComponent'` | hook block |
| `import ApexCharts from 'apexcharts'` 등 비표준 라이브러리 | 위 표준 stack | hook block |
| recharts 의 row-oriented data 를 Chart.js 컴포넌트에 그대로 전달 | `labels` + `datasets[]` shape 로 변환 (§3 매핑표) | LLM |
| `<ResponsiveContainer>` (recharts wrapper) | 부모 flex 컨테이너에 `flex:1 + minHeight:0` (rules/41a §4.2.1) | LLM |
| preview 에서 동작한다고 그대로 ship | wingui sync 후 webpack 컴파일 실패. preview runtime 의 mock 은 graceful-degradation 안전망일 뿐 표준 아님 | LLM |

## 관련 파일
- `rules/21-components.md §5` — 공용 차트 컴포넌트 목록 (positive)
- `.claude/targets/t3series/hooks/validators/jsx-chart-libs.sh` — 본 룰의 hook 강제
- `frontend/src/preview/runtime.js` (line 462+) — recharts mock (preview 안전망, 산출물 의존 금지)
