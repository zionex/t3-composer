/**
 * T3Mockup raw jsx source 모음 — Composer 의 LLM prompt 에 mockup 의 시각적 디자인을
 * 정확히 전달하기 위한 모듈. 각 mockup 의 .jsx 파일 내용을 ?raw query 로 가져와
 * patternCode → source 문자열 매핑으로 export.
 *
 * webpack.config.js 의 `{ resourceQuery: /raw/, type: 'asset/source' }` 룰이 필요.
 *
 * 새 mockup 추가 시: 본 파일과 index.js 의 MOCKUP_ENTRIES 둘 다 한 줄씩 추가.
 * import path 는 이 파일이 _data/ 안에 있으므로 부모(`../`) 기준.
 */

/* eslint-disable import/no-webpack-loader-syntax */

import src_search_grid from '../search_grid/SearchGridMockup.jsx?raw';
import src_widget_dashboard from '../widget_dashboard/WidgetDashboardMockup.jsx?raw';
import src_grid_chart_stacked from '../grid_chart_stacked/GridChartStackedMockup.jsx?raw';
import src_v2_dual_grid from '../v2_dual_grid/V2DualGridMockup.jsx?raw';
import src_search_tab from '../search_tab/SearchTabMockup.jsx?raw';
import src_P02b_grid_only from '../P02b_grid_only/GridOnlyMockup.jsx?raw';
import src_P09_chart_view from '../P09_chart_view/ChartViewMockup.jsx?raw';
import src_h2_tree_grid from '../h2_tree_grid/TreeGridMockup.jsx?raw';
import src_rl_layout_design from '../rl_layout_design/RouteLayoutMockup.jsx?raw';
import src_cb_master_dashboard from '../cb_master_dashboard/ControlBoardMockup.jsx?raw';
import src_pivot_table from '../pivot_table/PivotTableMockup.jsx?raw';
import src_split_master_detail from '../split_master_detail/MasterDetailMockup.jsx?raw';
import src_cb_gantt_master from '../cb_gantt_master/CbGanttMockup.jsx?raw';
import src_cb_chart_master from '../cb_chart_master/CbChartMockup.jsx?raw';
import src_pe_pivot_grid_edit from '../pe_pivot_grid_edit/PePivotEditMockup.jsx?raw';
import src_pe_grid_edit from '../pe_grid_edit/PeGridEditMockup.jsx?raw';
import src_pe_gantt_edit from '../pe_gantt_edit/PeGanttEditMockup.jsx?raw';
import src_mn_kpi_dashboard from '../mn_kpi_dashboard/MnKpiMockup.jsx?raw';
import src_mn_grid_alert from '../mn_grid_alert/MnGridAlertMockup.jsx?raw';
import src_mn_simple from '../mn_simple/MnSimpleMockup.jsx?raw';
import src_gantt_view from '../gantt_view/GanttViewMockup.jsx?raw';
import src_v3_multi_grid from '../v3_multi_grid/V3MultiGridMockup.jsx?raw';
import src_v4_multi_grid from '../v4_multi_grid/V4MultiGridMockup.jsx?raw';
import src_h2_master_detail from '../h2_master_detail/H2MasterDetailMockup.jsx?raw';
import src_mix_split from '../mix_split/MixSplitMockup.jsx?raw';
import src_log_viewer from '../log_viewer/LogViewerMockup.jsx?raw';
import src_sim_compare from '../sim_compare/SimCompareMockup.jsx?raw';
import src_analysis_report from '../analysis_report/AnalysisReportMockup.jsx?raw';
import src_fp_simulation_edit from '../fp_simulation_edit/FpSimulationEditMockup.jsx?raw';
import src_dev_tool from '../dev_tool/DevToolMockup.jsx?raw';
import src_dash_executive from '../dash_executive/DashExecutiveMockup.jsx?raw';
import src_dash_overview from '../dash_overview/DashOverviewMockup.jsx?raw';
import src_dash_kpi_board from '../dash_kpi_board/DashKpiBoardMockup.jsx?raw';
import src_dash_supply_kpi from '../dash_supply_kpi/DashSupplyKpiMockup.jsx?raw';
import src_dash_ontime_sales from '../dash_ontime_sales/DashOntimeSalesMockup.jsx?raw';
import src_dash_sales_growth from '../dash_sales_growth/DashSalesGrowthMockup.jsx?raw';
import src_dash_production_perf from '../dash_production_perf/DashProductionPerfMockup.jsx?raw';
import src_dash_simulation_kpi from '../dash_simulation_kpi/DashSimulationKpiMockup.jsx?raw';
import src_dash_inout_status from '../dash_inout_status/DashInOutStatusMockup.jsx?raw';
import src_dash_plan_problem from '../dash_plan_problem/DashPlanProblemMockup.jsx?raw';
import src_dash_wip_eoh from '../dash_wip_eoh/DashWipEohMockup.jsx?raw';
import src_dash_sales_board from '../dash_sales_board/DashSalesBoardMockup.jsx?raw';
import src_dash_demand_board from '../dash_demand_board/DashDemandBoardMockup.jsx?raw';
import src_dash_supply_board from '../dash_supply_board/DashSupplyBoardMockup.jsx?raw';
import src_dash_psi_board from '../dash_psi_board/DashPsiBoardMockup.jsx?raw';
import src_dash_inven_board from '../dash_inven_board/DashInvenBoardMockup.jsx?raw';
import src_cb_bf_forecast from '../cb_bf_forecast/CbBfForecastMockup.jsx?raw';
import src_cb_insight_prediction from '../cb_insight_prediction/CbInsightPredictionMockup.jsx?raw';
import src_cb_dp_demand from '../cb_dp_demand/CbDpDemandMockup.jsx?raw';
import src_cb_bp_yearly from '../cb_bp_yearly/CbBpYearlyMockup.jsx?raw';
import src_popup from '../popup/PopupMockup.jsx?raw';
import src_widget_chart from '../widget_chart/WidgetChartMockup.jsx?raw';
import src_widget_grid from '../widget_grid/WidgetGridMockup.jsx?raw';
import src_widget_pivot from '../widget_pivot/WidgetPivotMockup.jsx?raw';
import src_widget_panel from '../widget_panel/WidgetPanelMockup.jsx?raw';
import src_widget_misc from '../widget_misc/WidgetMiscMockup.jsx?raw';
import src_subcomponent from '../subcomponent/SubcomponentMockup.jsx?raw';
import src_base_wrapper from '../base_wrapper/BaseWrapperMockup.jsx?raw';
import src_free_form from '../free_form/FreeFormMockup.jsx?raw';

const MOCKUP_SOURCES = {
  'search_grid': src_search_grid,
  'widget_dashboard': src_widget_dashboard,
  'grid_chart_stacked': src_grid_chart_stacked,
  'v2_dual_grid': src_v2_dual_grid,
  'search_tab': src_search_tab,
  'P02b_grid_only': src_P02b_grid_only,
  'P09_chart_view': src_P09_chart_view,
  'h2_tree_grid': src_h2_tree_grid,
  'rl_layout_design': src_rl_layout_design,
  'cb_master_dashboard': src_cb_master_dashboard,
  'pivot_table': src_pivot_table,
  'split_master_detail': src_split_master_detail,
  'cb_gantt_master': src_cb_gantt_master,
  'cb_chart_master': src_cb_chart_master,
  'pe_pivot_grid_edit': src_pe_pivot_grid_edit,
  'pe_grid_edit': src_pe_grid_edit,
  'pe_gantt_edit': src_pe_gantt_edit,
  'mn_kpi_dashboard': src_mn_kpi_dashboard,
  'mn_grid_alert': src_mn_grid_alert,
  'mn_simple': src_mn_simple,
  'gantt_view': src_gantt_view,
  'v3_multi_grid': src_v3_multi_grid,
  'v4_multi_grid': src_v4_multi_grid,
  'h2_master_detail': src_h2_master_detail,
  'mix_split': src_mix_split,
  'log_viewer': src_log_viewer,
  'sim_compare': src_sim_compare,
  'analysis_report': src_analysis_report,
  'fp_simulation_edit': src_fp_simulation_edit,
  'dev_tool': src_dev_tool,
  'dash_executive': src_dash_executive,
  'dash_overview': src_dash_overview,
  'dash_kpi_board': src_dash_kpi_board,
  'dash_supply_kpi': src_dash_supply_kpi,
  'dash_ontime_sales': src_dash_ontime_sales,
  'dash_sales_growth': src_dash_sales_growth,
  'dash_production_perf': src_dash_production_perf,
  'dash_simulation_kpi': src_dash_simulation_kpi,
  'dash_inout_status': src_dash_inout_status,
  'dash_plan_problem': src_dash_plan_problem,
  'dash_wip_eoh': src_dash_wip_eoh,
  'dash_sales_board': src_dash_sales_board,
  'dash_demand_board': src_dash_demand_board,
  'dash_supply_board': src_dash_supply_board,
  'dash_psi_board': src_dash_psi_board,
  'dash_inven_board': src_dash_inven_board,
  'cb_bf_forecast': src_cb_bf_forecast,
  'cb_insight_prediction': src_cb_insight_prediction,
  'cb_dp_demand': src_cb_dp_demand,
  'cb_bp_yearly': src_cb_bp_yearly,
  'popup': src_popup,
  'widget_chart': src_widget_chart,
  'widget_grid': src_widget_grid,
  'widget_pivot': src_widget_pivot,
  'widget_panel': src_widget_panel,
  'widget_misc': src_widget_misc,
  'subcomponent': src_subcomponent,
  'base_wrapper': src_base_wrapper,
  'free_form': src_free_form,
};

export default MOCKUP_SOURCES;

/** patternCode → raw jsx source. 없으면 null. */
export function getMockupSource(patternCode) {
  if (!patternCode) return null;
  return MOCKUP_SOURCES[patternCode] || null;
}
