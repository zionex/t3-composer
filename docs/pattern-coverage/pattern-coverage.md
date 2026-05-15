# T3Series UI Pattern Coverage — Phase 3 결과

> 3-way cross-check: **DB 시드 ↔ PatternPreview 렌더러 ↔ Phase 1 자동 분류 결과**
> 생성: `node t3series-wingui/packages/wingui/scripts/pattern-coverage.cjs`

## 1. 요약

| 항목 | 값 |
|---|---:|
| DB 시드 파일 | 8개 |
| DB 시드 INSERT 행 | 255 |
| DB 시드 유니크 CODE | 255 |
| DB 시드 유니크 LAYOUT (= 렌더러 키) | 255 |
| DB 시드 중복 CODE | 0  |
| PatternPreview 렌더러 | 255 |
| Phase 1 사용된 patternCode | 25 |
| Phase 1 분류된 화면 | 992 |

## 2. 교집합 / 차집합

| 분류 | 개수 | 의미 |
|---|---:|---|
| DB ∩ Preview | 255 | DB 시드 + 미리보기 모두 존재 (정상) |
| DB only | 0 | DB 시드는 있는데 미리보기 렌더러 없음 — **렌더러 보강 필요** |
| Preview only | 0 | 미리보기는 있는데 DB 시드 없음 — **시드 추가 검토** |
| Phase 1 ∈ Preview | 9 | 분류기 코드 중 PatternPreview 에 렌더러 있는 것 |
| Phase 1 ∉ Preview | 16 | 분류기 코드 중 PatternPreview 에 렌더러 없는 것 |
| Phase 1 신규 코드 (DB·Preview 모두 X) | 16 | 분류기가 새로 도입한 코드 — DB·Preview 양쪽에 추가 검토 |

### 2.1 Phase 1 분류기가 도입한 신규 코드 (DB·Preview 양쪽에 없음)

| patternCode | Phase 1 사용 화면 수 | 권장 조치 |
|---|---:|---|
| `P02b_grid_only` | 47 | ✅ DB 시드 + 렌더러 추가 권장 |
| `P09_chart_view` | 23 | ✅ DB 시드 + 렌더러 추가 권장 |
| `base_wrapper` | 7 | 🟡 빈도 보통 — 렌더러 추가 검토 |
| `free_form` | 209 | ⭐ DB 시드 + 렌더러 즉시 추가 |
| `gantt_view` | 2 | 🔹 빈도 낮음 — 분류기 정규화 검토 |
| `mix_split` | 6 | 🟡 빈도 보통 — 렌더러 추가 검토 |
| `mn_grid_alert` | 1 | 🔹 빈도 낮음 — 분류기 정규화 검토 |
| `popup` | 223 | ⭐ DB 시드 + 렌더러 즉시 추가 |
| `subcomponent` | 16 | 🟡 빈도 보통 — 렌더러 추가 검토 |
| `v2_dual_grid` | 28 | ✅ DB 시드 + 렌더러 추가 권장 |
| `v3_multi_grid` | 2 | 🔹 빈도 낮음 — 분류기 정규화 검토 |
| `v4_multi_grid` | 1 | 🔹 빈도 낮음 — 분류기 정규화 검토 |
| `widget_chart` | 94 | ⭐ DB 시드 + 렌더러 즉시 추가 |
| `widget_grid` | 27 | ✅ DB 시드 + 렌더러 추가 권장 |
| `widget_misc` | 49 | ✅ DB 시드 + 렌더러 추가 권장 |
| `widget_pivot` | 13 | 🟡 빈도 보통 — 렌더러 추가 검토 |

## 3. 미사용 패턴 — `USE_YN='N'` 후보

### 3.1 미사용 PatternPreview 렌더러

Phase 1 분류 결과에서 단 한 번도 매칭되지 않은 렌더러 (총 246개)

<details><summary>전체 보기</summary>

```
approval_list, calendar, card_list, cb_ai_chatbot, cb_alert_threshold, cb_approval
cb_batch_schedule, cb_bottleneck, cb_composite_process, cb_custom_widget, cb_data_imputation
cb_erp_publish, cb_error_log, cb_geo_map, cb_io_interface, cb_job_queue, cb_kpi_compare
cb_late_orders, cb_live_log, cb_manual_override, cb_mdm_check, cb_node_recovery, cb_node_status
cb_parallel_scenario, cb_param_tuning, cb_pipeline_progress, cb_rca_analysis, cb_resource_monitor
cb_safety_alert, cb_supply_demand, cb_ticket_assign, cb_topology, cb_version_diff
chart_grid_horizontal, chart_grid_vertical, chat, code_editor, control_board, diff_view, doc_viewer
drilldown, flo_diagram, form_detail_grid, gantt, grid_2x2, h2_category_items, h2_channel_chat
h2_chart_grid, h2_filetree_editor, h2_filter_cards, h2_form_grid, h2_form_preview, h2_grid_chart
h2_list_editform, h2_list_preview, h2_menu_content, h2_nav_main, h2_searchcond_result
h2_tree_detail_form, h3_category_grid_chart, h3_filter_list_detail, h3_folder_editor_output
h3_folder_file_preview, h3_left_main_right, h3_menu_list_editor, h3_source_diff_target
h3_step_form_result, h3_tree_chart_grid, h3_tree_grid_detail, h4_drill_drill_drill_detail
h4_filter_category_list_chart, h4_menu_center_center_tool, h4_menu_tree_grid_detail
h4_nav_tree_editor_output, h5_menu_category_list_detail_action, h5_nav_tree_grid_detail_toolbar
heatmap, infinite_list, kanban, kpi_chart, map, mix_accordion_main, mix_drawer_main, mix_explorer_3
mix_explorer_5, mix_grid_2x2, mix_grid_2x3, mix_grid_3x2, mix_grid_3x3, mix_h2_right_v2
mix_h2_right_v3, mix_h2_right_v3b, mix_h3_mid_v2, mix_h3_mid_v3, mix_header_nav_content_status
mix_master_tabbed_detail, mix_master_v2_detail, mix_master_v_tabbed_detail, mix_notice_drawer_main
mix_report_v3, mix_ribbon_h2, mix_ribbon_main, mix_side_v3, mix_sidetab_main, mix_stepper_tab
mix_strip_horizontal, mix_strip_vertical, mix_tab_h2, mix_tab_h3, mix_tab_v2, mix_v2_accordion_grid
mix_v2_form_tab, mix_v2_h2_master_detail, mix_v2_h2_search_tree_grid
mix_v2_h2v2_toolbar_tree_chart_grid, mix_v2_h2v2_tree_chart_grid, mix_v2_h3_filter_grid_detail
mix_v2_kpi_tab, mix_v2_tab_bottom, mix_v3_kpi_mid_detail, mix_v3_mid_h2, mn_bottleneck
mn_compliance_trend, mn_customer_sla, mn_daily_work_order, mn_delay_risk, mn_energy_carbon
mn_exec_summary, mn_expected_cost, mn_forecast_vs_plan, mn_gantt_progress, mn_hot_orders
mn_labor_input, mn_line_switching, mn_line_utilization, mn_logistics_sync, mn_material_shortage
mn_part_explosion, mn_pivot_plan, mn_plan_vs_actual, mn_po_tracking, mn_rework_status
mn_safety_stock_alert, mn_setup_loss, mn_subcontracting, mn_tooling_mgmt, mn_unplanned_orders
mn_version_diff, mn_wip_flow, mn_yield_impact, network_graph, pe_ai_copilot, pe_altpart_swap
pe_bulk_inline_edit, pe_calendar_drag, pe_capacity_slider, pe_constraint_guide, pe_diff_viewer
pe_excel_upload_edit, pe_gantt_drag_edit, pe_heijunka_matrix, pe_history_rollback, pe_kpi_summary
pe_lock_based_edit, pe_multi_plant_transfer, pe_pivot_grid_edit, pe_rank_reschedule, pe_ratio_slider
pe_ripple_effect, pe_scenario_compare, pe_setup_batching, pivot_entry, pivot_table, process_status
report_tabs, rl_layout_simulation, rl_layout_wip, scheduler, settings_form, sidebar_main
split_master_detail, tab_chart, timeline, tree_grid, tree_grid_detail, v2_breadcrumb_content
v2_chart_grid, v2_filter_list, v2_form_chart, v2_form_grid, v2_grid_chart, v2_header_tab
v2_header_timeline, v2_info_grid, v2_kpi_chart, v2_kpi_grid, v2_master_master, v2_notice_main
v2_progress_content, v2_search_calendar, v2_search_cards, v2_search_chart, v2_search_flo
v2_search_gantt, v2_search_grid, v2_search_map, v2_search_pivot, v2_search_tree, v2_title_canvas
v2_toolbar_grid, v3_condition_preview_result, v3_filter_cards_pagination, v3_header_lines_summary
v3_header_main_action, v3_kpi_chart_grid, v3_kpi_grid_chart, v3_notice_kpi_grid
v3_progress_grid_action, v3_search_chart_grid, v3_search_gantt_grid, v3_search_grid_chart
v3_search_grid_log, v3_search_kpi_grid, v3_search_map_grid, v3_search_master_detail_v
v3_search_network_grid, v3_search_pivot_chart, v3_search_tab_detail, v3_stepper_form_button
v3_toolbar_grid_status, v4_filter_cards_grid_chart, v4_header_kpi_tab_detail
v4_header_tab_grid_action, v4_notice_filter_list_pagination, v4_search_kpi_chart_grid
v4_search_kpi_grid_chart, v4_search_pivot_grid_chart, v4_search_toolbar_grid_detail
v4_stepper_search_grid_detail, v4_toolbar_search_grid_footer, v5_header_stepper_tab_content_action
v5_header_toolbar_tree_grid_log, v5_nav_search_kpi_grid_status, v5_notice_filter_kpi_grid_pagination
v5_search_kpi_chart_grid_detail, wizard_stepper
```

</details>

### 3.2 미사용 DB 시드 (USE_YN='N' 후보)

Phase 1 분류 결과에서 단 한 번도 매칭되지 않은 시드 CODE (총 246개)

| CODE | LAYOUT | CATEGORY | 시드 파일 |
|---|---|---|---|
| `CB_02` | `cb_composite_process` | LAYOUT_CONTROLBOARD | ..._controlboard.sql |
| `CB_03` | `cb_parallel_scenario` | LAYOUT_CONTROLBOARD | ..._controlboard.sql |
| `CB_04` | `cb_param_tuning` | LAYOUT_CONTROLBOARD | ..._controlboard.sql |
| `CB_05` | `cb_batch_schedule` | LAYOUT_CONTROLBOARD | ..._controlboard.sql |
| `CB_06` | `cb_mdm_check` | LAYOUT_CONTROLBOARD | ..._controlboard.sql |
| `CB_07` | `cb_approval` | LAYOUT_CONTROLBOARD | ..._controlboard.sql |
| `CB_08` | `cb_node_status` | LAYOUT_CONTROLBOARD | ..._controlboard.sql |
| `CB_09` | `cb_pipeline_progress` | LAYOUT_CONTROLBOARD | ..._controlboard.sql |
| `CB_10` | `cb_live_log` | LAYOUT_CONTROLBOARD | ..._controlboard.sql |
| `CB_11` | `cb_resource_monitor` | LAYOUT_CONTROLBOARD | ..._controlboard.sql |
| `CB_12` | `cb_io_interface` | LAYOUT_CONTROLBOARD | ..._controlboard.sql |
| `CB_13` | `cb_job_queue` | LAYOUT_CONTROLBOARD | ..._controlboard.sql |
| `CB_14` | `cb_error_log` | LAYOUT_CONTROLBOARD | ..._controlboard.sql |
| `CB_15` | `cb_alert_threshold` | LAYOUT_CONTROLBOARD | ..._controlboard.sql |
| `CB_16` | `cb_node_recovery` | LAYOUT_CONTROLBOARD | ..._controlboard.sql |
| `CB_17` | `cb_data_imputation` | LAYOUT_CONTROLBOARD | ..._controlboard.sql |
| `CB_18` | `cb_ticket_assign` | LAYOUT_CONTROLBOARD | ..._controlboard.sql |
| `CB_19` | `cb_rca_analysis` | LAYOUT_CONTROLBOARD | ..._controlboard.sql |
| `CB_20` | `cb_supply_demand` | LAYOUT_CONTROLBOARD | ..._controlboard.sql |
| `CB_21` | `cb_kpi_compare` | LAYOUT_CONTROLBOARD | ..._controlboard.sql |
| `CB_22` | `cb_safety_alert` | LAYOUT_CONTROLBOARD | ..._controlboard.sql |
| `CB_23` | `cb_late_orders` | LAYOUT_CONTROLBOARD | ..._controlboard.sql |
| `CB_24` | `cb_bottleneck` | LAYOUT_CONTROLBOARD | ..._controlboard.sql |
| `CB_25` | `cb_version_diff` | LAYOUT_CONTROLBOARD | ..._controlboard.sql |
| `CB_26` | `cb_erp_publish` | LAYOUT_CONTROLBOARD | ..._controlboard.sql |
| `CB_27` | `cb_manual_override` | LAYOUT_CONTROLBOARD | ..._controlboard.sql |
| `CB_28` | `cb_ai_chatbot` | LAYOUT_CONTROLBOARD | ..._controlboard.sql |
| `CB_29` | `cb_geo_map` | LAYOUT_CONTROLBOARD | ..._controlboard.sql |
| `CB_30` | `cb_topology` | LAYOUT_CONTROLBOARD | ..._controlboard.sql |
| `CB_31` | `cb_custom_widget` | LAYOUT_CONTROLBOARD | ..._controlboard.sql |
| `H2_03` | `h2_form_grid` | LAYOUT_H2 | ..._seed_ext.sql |
| `H2_04` | `h2_chart_grid` | LAYOUT_H2 | ..._seed_ext.sql |
| `H2_05` | `h2_menu_content` | LAYOUT_H2 | ..._seed_ext.sql |
| `H2_06` | `h2_list_editform` | LAYOUT_H2 | ..._seed_ext.sql |
| `H2_07` | `h2_nav_main` | LAYOUT_H2 | ..._seed_ext.sql |
| `H2_08` | `h2_filetree_editor` | LAYOUT_H2 | ..._seed_ext.sql |
| `H2_09` | `h2_category_items` | LAYOUT_H2 | ..._seed_ext.sql |
| `H2_10` | `h2_searchcond_result` | LAYOUT_H2 | ..._seed_ext.sql |
| `H2_11` | `h2_grid_chart` | LAYOUT_H2 | ..._seed_ext.sql |
| `H2_12` | `h2_tree_detail_form` | LAYOUT_H2 | ..._seed_ext.sql |
| `H2_13` | `h2_list_preview` | LAYOUT_H2 | ..._seed_ext.sql |
| `H2_14` | `h2_form_preview` | LAYOUT_H2 | ..._seed_ext.sql |
| `H2_15` | `h2_filter_cards` | LAYOUT_H2 | ..._seed_ext.sql |
| `H2_16` | `h2_channel_chat` | LAYOUT_H2 | ..._seed_ext.sql |
| `H3_01` | `h3_tree_grid_detail` | LAYOUT_H3 | ..._seed_ext.sql |
| `H3_02` | `h3_menu_list_editor` | LAYOUT_H3 | ..._seed_ext.sql |
| `H3_03` | `h3_category_grid_chart` | LAYOUT_H3 | ..._seed_ext.sql |
| `H3_04` | `h3_tree_chart_grid` | LAYOUT_H3 | ..._seed_ext.sql |
| `H3_05` | `h3_left_main_right` | LAYOUT_H3 | ..._seed_ext.sql |
| `H3_06` | `h3_folder_editor_output` | LAYOUT_H3 | ..._seed_ext.sql |
| `H3_07` | `h3_filter_list_detail` | LAYOUT_H3 | ..._seed_ext.sql |
| `H3_08` | `h3_folder_file_preview` | LAYOUT_H3 | ..._seed_ext.sql |
| `H3_09` | `h3_step_form_result` | LAYOUT_H3 | ..._seed_ext.sql |
| `H3_10` | `h3_source_diff_target` | LAYOUT_H3 | ..._seed_ext.sql |
| `H4_01` | `h4_menu_tree_grid_detail` | LAYOUT_H4 | ..._seed_ext.sql |
| `H4_02` | `h4_filter_category_list_chart` | LAYOUT_H4 | ..._seed_ext.sql |
| `H4_03` | `h4_nav_tree_editor_output` | LAYOUT_H4 | ..._seed_ext.sql |
| `H4_04` | `h4_drill_drill_drill_detail` | LAYOUT_H4 | ..._seed_ext.sql |
| `H4_05` | `h4_menu_center_center_tool` | LAYOUT_H4 | ..._seed_ext.sql |
| `H5_01` | `h5_nav_tree_grid_detail_toolbar` | LAYOUT_H5 | ..._seed_ext.sql |
| `H5_02` | `h5_menu_category_list_detail_action` | LAYOUT_H5 | ..._seed_ext.sql |
| `MIX_01` | `mix_v2_h2_search_tree_grid` | LAYOUT_MIXED | ..._seed_ext.sql |
| `MIX_02` | `mix_v2_h2v2_tree_chart_grid` | LAYOUT_MIXED | ..._seed_ext.sql |
| `MIX_03` | `mix_v2_h3_filter_grid_detail` | LAYOUT_MIXED | ..._seed_ext.sql |
| `MIX_04` | `mix_v2_h2_master_detail` | LAYOUT_MIXED | ..._seed_ext.sql |
| `MIX_05` | `mix_v2_h2v2_toolbar_tree_chart_grid` | LAYOUT_MIXED | ..._seed_ext.sql |
| `MIX_06` | `mix_v2_tab_bottom` | LAYOUT_MIXED | ..._seed_ext.sql |
| `MIX_07` | `mix_v2_kpi_tab` | LAYOUT_MIXED | ..._seed_ext.sql |
| `MIX_08` | `mix_v2_form_tab` | LAYOUT_MIXED | ..._seed_ext.sql |
| `MIX_09` | `mix_v3_mid_h2` | LAYOUT_MIXED | ..._seed_ext.sql |
| `MIX_10` | `mix_v3_kpi_mid_detail` | LAYOUT_MIXED | ..._seed_ext.sql |
| `MIX_11` | `mix_h2_right_v2` | LAYOUT_MIXED | ..._seed_ext.sql |
| `MIX_12` | `mix_h2_right_v3` | LAYOUT_MIXED | ..._seed_ext.sql |
| `MIX_13` | `mix_h2_right_v3b` | LAYOUT_MIXED | ..._seed_ext.sql |
| `MIX_14` | `mix_h3_mid_v2` | LAYOUT_MIXED | ..._seed_ext.sql |
| `MIX_15` | `mix_h3_mid_v3` | LAYOUT_MIXED | ..._seed_ext.sql |
| `MIX_16` | `mix_tab_h2` | LAYOUT_MIXED | ..._seed_ext.sql |
| `MIX_17` | `mix_tab_v2` | LAYOUT_MIXED | ..._seed_ext.sql |
| `MIX_18` | `mix_tab_h3` | LAYOUT_MIXED | ..._seed_ext.sql |
| `MIX_19` | `mix_stepper_tab` | LAYOUT_MIXED | ..._seed_ext.sql |
| `MIX_20` | `mix_sidetab_main` | LAYOUT_MIXED | ..._seed_ext.sql |
| `MIX_21` | `mix_accordion_main` | LAYOUT_MIXED | ..._seed_ext.sql |
| `MIX_22` | `mix_v2_accordion_grid` | LAYOUT_MIXED | ..._seed_ext.sql |
| `MIX_23` | `mix_drawer_main` | LAYOUT_MIXED | ..._seed_ext.sql |
| `MIX_24` | `mix_notice_drawer_main` | LAYOUT_MIXED | ..._seed_ext.sql |
| `MIX_25` | `mix_grid_2x2` | LAYOUT_MIXED | ..._seed_ext.sql |
| `MIX_26` | `mix_grid_2x3` | LAYOUT_MIXED | ..._seed_ext.sql |
| `MIX_27` | `mix_grid_3x2` | LAYOUT_MIXED | ..._seed_ext.sql |
| `MIX_28` | `mix_grid_3x3` | LAYOUT_MIXED | ..._seed_ext.sql |
| `MIX_29` | `mix_strip_horizontal` | LAYOUT_MIXED | ..._seed_ext.sql |
| `MIX_30` | `mix_strip_vertical` | LAYOUT_MIXED | ..._seed_ext.sql |
| `MIX_31` | `mix_explorer_5` | LAYOUT_MIXED | ..._seed_ext.sql |
| `MIX_32` | `mix_explorer_3` | LAYOUT_MIXED | ..._seed_ext.sql |
| `MIX_33` | `mix_header_nav_content_status` | LAYOUT_MIXED | ..._seed_ext.sql |
| `MIX_34` | `mix_ribbon_main` | LAYOUT_MIXED | ..._seed_ext.sql |
| `MIX_35` | `mix_ribbon_h2` | LAYOUT_MIXED | ..._seed_ext.sql |
| `MIX_36` | `mix_master_tabbed_detail` | LAYOUT_MIXED | ..._seed_ext.sql |
| `MIX_37` | `mix_master_v_tabbed_detail` | LAYOUT_MIXED | ..._seed_ext.sql |
| `MIX_38` | `mix_master_v2_detail` | LAYOUT_MIXED | ..._seed_ext.sql |
| `MIX_39` | `mix_report_v3` | LAYOUT_MIXED | ..._seed_ext.sql |
| `MIX_40` | `mix_side_v3` | LAYOUT_MIXED | ..._seed_ext.sql |
| `MN_02` | `mn_daily_work_order` | LAYOUT_MONITORING | ..._monitoring.sql |
| `MN_03` | `mn_pivot_plan` | LAYOUT_MONITORING | ..._monitoring.sql |
| `MN_04` | `mn_wip_flow` | LAYOUT_MONITORING | ..._monitoring.sql |
| `MN_05` | `mn_delay_risk` | LAYOUT_MONITORING | ..._monitoring.sql |
| `MN_06` | `mn_unplanned_orders` | LAYOUT_MONITORING | ..._monitoring.sql |
| `MN_07` | `mn_material_shortage` | LAYOUT_MONITORING | ..._monitoring.sql |
| `MN_08` | `mn_bottleneck` | LAYOUT_MONITORING | ..._monitoring.sql |
| `MN_09` | `mn_plan_vs_actual` | LAYOUT_MONITORING | ..._monitoring.sql |
| `MN_10` | `mn_compliance_trend` | LAYOUT_MONITORING | ..._monitoring.sql |
| `MN_11` | `mn_line_utilization` | LAYOUT_MONITORING | ..._monitoring.sql |
| `MN_12` | `mn_setup_loss` | LAYOUT_MONITORING | ..._monitoring.sql |
| `MN_13` | `mn_po_tracking` | LAYOUT_MONITORING | ..._monitoring.sql |
| `MN_14` | `mn_gantt_progress` | LAYOUT_MONITORING | ..._monitoring.sql |
| `MN_15` | `mn_part_explosion` | LAYOUT_MONITORING | ..._monitoring.sql |
| `MN_16` | `mn_customer_sla` | LAYOUT_MONITORING | ..._monitoring.sql |
| `MN_17` | `mn_subcontracting` | LAYOUT_MONITORING | ..._monitoring.sql |
| `MN_18` | `mn_expected_cost` | LAYOUT_MONITORING | ..._monitoring.sql |
| `MN_19` | `mn_energy_carbon` | LAYOUT_MONITORING | ..._monitoring.sql |
| `MN_20` | `mn_labor_input` | LAYOUT_MONITORING | ..._monitoring.sql |
| `MN_21` | `mn_forecast_vs_plan` | LAYOUT_MONITORING | ..._monitoring.sql |
| `MN_22` | `mn_line_switching` | LAYOUT_MONITORING | ..._monitoring.sql |
| `MN_23` | `mn_yield_impact` | LAYOUT_MONITORING | ..._monitoring.sql |
| `MN_24` | `mn_logistics_sync` | LAYOUT_MONITORING | ..._monitoring.sql |
| `MN_25` | `mn_hot_orders` | LAYOUT_MONITORING | ..._monitoring.sql |
| `MN_26` | `mn_rework_status` | LAYOUT_MONITORING | ..._monitoring.sql |
| `MN_27` | `mn_safety_stock_alert` | LAYOUT_MONITORING | ..._monitoring.sql |
| `MN_28` | `mn_tooling_mgmt` | LAYOUT_MONITORING | ..._monitoring.sql |
| `MN_29` | `mn_version_diff` | LAYOUT_MONITORING | ..._monitoring.sql |
| `MN_30` | `mn_exec_summary` | LAYOUT_MONITORING | ..._monitoring.sql |
| `P04` | `split_master_detail` | GRID | ....sql |
| `P06` | `pivot_entry` | ENTRY | ....sql |
| `P07` | `control_board` | WORKFLOW | ....sql |
| `P08` | `process_status` | WORKFLOW | ....sql |
| `P09` | `gantt` | VISUALIZATION | ....sql |
| `P10` | `flo_diagram` | VISUALIZATION | ....sql |
| `P11` | `map` | VISUALIZATION | ....sql |
| `P12` | `pivot_table` | ANALYSIS | ....sql |
| `P13` | `kpi_chart` | DASHBOARD | ....sql |
| `P14` | `chart_grid_horizontal` | ANALYSIS | ....sql |
| `P15` | `chart_grid_vertical` | ANALYSIS | ....sql |
| `P16` | `grid_2x2` | DASHBOARD | ....sql |
| `P17` | `tab_chart` | ANALYSIS | ....sql |
| `P18` | `drilldown` | DASHBOARD | ....sql |
| `P19` | `tree_grid` | GRID | ....sql |
| `P20` | `card_list` | GRID | ....sql |
| `P21` | `form_detail_grid` | ENTRY | ....sql |
| `P22` | `wizard_stepper` | ENTRY | ....sql |
| `P23` | `timeline` | VISUALIZATION | ....sql |
| `P24` | `tree_grid_detail` | GRID | ....sql |
| `P25` | `calendar` | VISUALIZATION | ....sql |
| `P26` | `report_tabs` | ANALYSIS | ....sql |
| `P27` | `scheduler` | VISUALIZATION | ....sql |
| `P28` | `network_graph` | VISUALIZATION | ....sql |
| `P29` | `heatmap` | ANALYSIS | ....sql |
| `P30` | `approval_list` | WORKFLOW | ....sql |
| `P31` | `kanban` | WORKFLOW | ....sql |
| `P32` | `code_editor` | SPECIAL | ....sql |
| `P33` | `doc_viewer` | SPECIAL | ....sql |
| `P34` | `settings_form` | ENTRY | ....sql |
| `P35` | `infinite_list` | GRID | ....sql |
| `P36` | `sidebar_main` | NAVIGATION | ....sql |
| `P37` | `diff_view` | SPECIAL | ....sql |
| `P38` | `chat` | SPECIAL | ....sql |
| `PE_01` | `pe_pivot_grid_edit` | LAYOUT_PLANEDIT | ..._planedit.sql |
| `PE_02` | `pe_gantt_drag_edit` | LAYOUT_PLANEDIT | ..._planedit.sql |
| `PE_03` | `pe_excel_upload_edit` | LAYOUT_PLANEDIT | ..._planedit.sql |
| `PE_04` | `pe_diff_viewer` | LAYOUT_PLANEDIT | ..._planedit.sql |
| `PE_05` | `pe_scenario_compare` | LAYOUT_PLANEDIT | ..._planedit.sql |
| `PE_06` | `pe_calendar_drag` | LAYOUT_PLANEDIT | ..._planedit.sql |
| `PE_07` | `pe_constraint_guide` | LAYOUT_PLANEDIT | ..._planedit.sql |
| `PE_08` | `pe_capacity_slider` | LAYOUT_PLANEDIT | ..._planedit.sql |
| `PE_09` | `pe_ripple_effect` | LAYOUT_PLANEDIT | ..._planedit.sql |
| `PE_10` | `pe_ratio_slider` | LAYOUT_PLANEDIT | ..._planedit.sql |
| `PE_11` | `pe_bulk_inline_edit` | LAYOUT_PLANEDIT | ..._planedit.sql |
| `PE_12` | `pe_lock_based_edit` | LAYOUT_PLANEDIT | ..._planedit.sql |
| `PE_13` | `pe_ai_copilot` | LAYOUT_PLANEDIT | ..._planedit.sql |
| `PE_14` | `pe_history_rollback` | LAYOUT_PLANEDIT | ..._planedit.sql |
| `PE_15` | `pe_kpi_summary` | LAYOUT_PLANEDIT | ..._planedit.sql |
| `PE_16` | `pe_rank_reschedule` | LAYOUT_PLANEDIT | ..._planedit.sql |
| `PE_17` | `pe_altpart_swap` | LAYOUT_PLANEDIT | ..._planedit.sql |
| `PE_18` | `pe_heijunka_matrix` | LAYOUT_PLANEDIT | ..._planedit.sql |
| `PE_19` | `pe_setup_batching` | LAYOUT_PLANEDIT | ..._planedit.sql |
| `PE_20` | `pe_multi_plant_transfer` | LAYOUT_PLANEDIT | ..._planedit.sql |
| `RL_02` | `rl_layout_wip` | LAYOUT_ROUTELAYOUT | ..._routelayout.sql |
| `RL_03` | `rl_layout_simulation` | LAYOUT_ROUTELAYOUT | ..._routelayout.sql |
| `V2_01` | `v2_search_grid` | LAYOUT_V2 | ..._seed_ext.sql |
| `V2_02` | `v2_search_chart` | LAYOUT_V2 | ..._seed_ext.sql |
| `V2_03` | `v2_search_cards` | LAYOUT_V2 | ..._seed_ext.sql |
| `V2_04` | `v2_search_tree` | LAYOUT_V2 | ..._seed_ext.sql |
| `V2_05` | `v2_search_pivot` | LAYOUT_V2 | ..._seed_ext.sql |
| `V2_06` | `v2_filter_list` | LAYOUT_V2 | ..._seed_ext.sql |
| `V2_07` | `v2_toolbar_grid` | LAYOUT_V2 | ..._seed_ext.sql |
| `V2_08` | `v2_kpi_grid` | LAYOUT_V2 | ..._seed_ext.sql |
| `V2_09` | `v2_kpi_chart` | LAYOUT_V2 | ..._seed_ext.sql |
| `V2_10` | `v2_grid_chart` | LAYOUT_V2 | ..._seed_ext.sql |
| `V2_11` | `v2_chart_grid` | LAYOUT_V2 | ..._seed_ext.sql |
| `V2_12` | `v2_form_grid` | LAYOUT_V2 | ..._seed_ext.sql |
| `V2_13` | `v2_form_chart` | LAYOUT_V2 | ..._seed_ext.sql |
| `V2_14` | `v2_header_tab` | LAYOUT_V2 | ..._seed_ext.sql |
| `V2_15` | `v2_master_master` | LAYOUT_V2 | ..._seed_ext.sql |
| `V2_16` | `v2_info_grid` | LAYOUT_V2 | ..._seed_ext.sql |
| `V2_17` | `v2_search_gantt` | LAYOUT_V2 | ..._seed_ext.sql |
| `V2_18` | `v2_search_map` | LAYOUT_V2 | ..._seed_ext.sql |
| `V2_19` | `v2_search_flo` | LAYOUT_V2 | ..._seed_ext.sql |
| `V2_20` | `v2_title_canvas` | LAYOUT_V2 | ..._seed_ext.sql |
| `V2_21` | `v2_notice_main` | LAYOUT_V2 | ..._seed_ext.sql |
| `V2_22` | `v2_progress_content` | LAYOUT_V2 | ..._seed_ext.sql |
| `V2_23` | `v2_header_timeline` | LAYOUT_V2 | ..._seed_ext.sql |
| `V2_24` | `v2_search_calendar` | LAYOUT_V2 | ..._seed_ext.sql |
| `V2_25` | `v2_breadcrumb_content` | LAYOUT_V2 | ..._seed_ext.sql |
| `V3_01` | `v3_search_grid_chart` | LAYOUT_V3 | ..._seed_ext.sql |
| `V3_02` | `v3_search_chart_grid` | LAYOUT_V3 | ..._seed_ext.sql |
| `V3_03` | `v3_search_kpi_grid` | LAYOUT_V3 | ..._seed_ext.sql |
| `V3_04` | `v3_header_main_action` | LAYOUT_V3 | ..._seed_ext.sql |
| `V3_05` | `v3_toolbar_grid_status` | LAYOUT_V3 | ..._seed_ext.sql |
| `V3_06` | `v3_search_tab_detail` | LAYOUT_V3 | ..._seed_ext.sql |
| `V3_07` | `v3_kpi_grid_chart` | LAYOUT_V3 | ..._seed_ext.sql |
| `V3_08` | `v3_search_master_detail_v` | LAYOUT_V3 | ..._seed_ext.sql |
| `V3_09` | `v3_search_grid_log` | LAYOUT_V3 | ..._seed_ext.sql |
| `V3_10` | `v3_stepper_form_button` | LAYOUT_V3 | ..._seed_ext.sql |
| `V3_11` | `v3_filter_cards_pagination` | LAYOUT_V3 | ..._seed_ext.sql |
| `V3_12` | `v3_search_gantt_grid` | LAYOUT_V3 | ..._seed_ext.sql |
| `V3_13` | `v3_search_pivot_chart` | LAYOUT_V3 | ..._seed_ext.sql |
| `V3_14` | `v3_header_lines_summary` | LAYOUT_V3 | ..._seed_ext.sql |
| `V3_15` | `v3_kpi_chart_grid` | LAYOUT_V3 | ..._seed_ext.sql |
| `V3_16` | `v3_search_map_grid` | LAYOUT_V3 | ..._seed_ext.sql |
| `V3_17` | `v3_search_network_grid` | LAYOUT_V3 | ..._seed_ext.sql |
| `V3_18` | `v3_progress_grid_action` | LAYOUT_V3 | ..._seed_ext.sql |
| `V3_19` | `v3_condition_preview_result` | LAYOUT_V3 | ..._seed_ext.sql |
| `V3_20` | `v3_notice_kpi_grid` | LAYOUT_V3 | ..._seed_ext.sql |
| `V4_01` | `v4_search_kpi_grid_chart` | LAYOUT_V4 | ..._seed_ext.sql |
| `V4_02` | `v4_search_toolbar_grid_detail` | LAYOUT_V4 | ..._seed_ext.sql |
| `V4_03` | `v4_header_tab_grid_action` | LAYOUT_V4 | ..._seed_ext.sql |
| `V4_04` | `v4_stepper_search_grid_detail` | LAYOUT_V4 | ..._seed_ext.sql |
| `V4_05` | `v4_filter_cards_grid_chart` | LAYOUT_V4 | ..._seed_ext.sql |
| `V4_06` | `v4_search_kpi_chart_grid` | LAYOUT_V4 | ..._seed_ext.sql |
| `V4_07` | `v4_toolbar_search_grid_footer` | LAYOUT_V4 | ..._seed_ext.sql |
| `V4_08` | `v4_header_kpi_tab_detail` | LAYOUT_V4 | ..._seed_ext.sql |
| `V4_09` | `v4_search_pivot_grid_chart` | LAYOUT_V4 | ..._seed_ext.sql |
| `V4_10` | `v4_notice_filter_list_pagination` | LAYOUT_V4 | ..._seed_ext.sql |
| `V5_01` | `v5_search_kpi_chart_grid_detail` | LAYOUT_V5 | ..._seed_ext.sql |
| `V5_02` | `v5_header_toolbar_tree_grid_log` | LAYOUT_V5 | ..._seed_ext.sql |
| `V5_03` | `v5_nav_search_kpi_grid_status` | LAYOUT_V5 | ..._seed_ext.sql |
| `V5_04` | `v5_header_stepper_tab_content_action` | LAYOUT_V5 | ..._seed_ext.sql |
| `V5_05` | `v5_notice_filter_kpi_grid_pagination` | LAYOUT_V5 | ..._seed_ext.sql |

## 5. 패턴 사용 빈도 Top 30 (Phase 1)

| patternCode | Phase 1 사용 | DB 시드 | PatternPreview |
|---|---:|:-:|:-:|
| `popup` | 223 | ❌ | ❌ |
| `free_form` | 209 | ❌ | ❌ |
| `search_grid` | 101 | ✅ | ✅ |
| `widget_chart` | 94 | ❌ | ❌ |
| `widget_misc` | 49 | ❌ | ❌ |
| `widget_dashboard` | 48 | ✅ | ✅ |
| `P02b_grid_only` | 47 | ❌ | ❌ |
| `grid_chart_stacked` | 32 | ✅ | ✅ |
| `v2_dual_grid` | 28 | ❌ | ❌ |
| `search_tab` | 27 | ✅ | ✅ |
| `widget_grid` | 27 | ❌ | ❌ |
| `P09_chart_view` | 23 | ❌ | ❌ |
| `rl_layout_design` | 22 | ✅ | ✅ |
| `subcomponent` | 16 | ❌ | ❌ |
| `widget_pivot` | 13 | ❌ | ❌ |
| `h2_tree_grid` | 8 | ✅ | ✅ |
| `base_wrapper` | 7 | ❌ | ❌ |
| `mix_split` | 6 | ❌ | ❌ |
| `cb_master_dashboard` | 4 | ✅ | ✅ |
| `v3_multi_grid` | 2 | ❌ | ❌ |
| `gantt_view` | 2 | ❌ | ❌ |
| `mn_grid_alert` | 1 | ❌ | ❌ |
| `mn_kpi_dashboard` | 1 | ✅ | ✅ |
| `v4_multi_grid` | 1 | ❌ | ❌ |
| `h2_master_detail` | 1 | ✅ | ✅ |

## 6. 권장 조치

### 6.1 즉시 DB 시드 추가 권장 (Phase 1 사용 빈도 ≥ 20)

| patternCode | Phase 1 사용 | LAYOUT (제안) | CATEGORY (제안) |
|---|---:|---|---|
| `popup` | 223 | `popup` | SPECIAL |
| `free_form` | 209 | `free_form` | SPECIAL |
| `widget_chart` | 94 | `widget_chart` | WIDGET |
| `widget_misc` | 49 | `widget_misc` | WIDGET |
| `P02b_grid_only` | 47 | `P02b_grid_only` | GRID |
| `v2_dual_grid` | 28 | `v2_dual_grid` | GRID |
| `widget_grid` | 27 | `widget_grid` | WIDGET |
| `P09_chart_view` | 23 | `P09_chart_view` | GRID |

### 6.2 비활성화(USE_YN='N') 검토

미사용 DB 시드 246개 중 향후 활용 가능성이 낮은 것은 `USE_YN='N'` 으로 비활성화 후보. 단, T3Composer Wizard 의 패턴 선택 화면에서 사용자가 직접 고를 수 있는 항목이므로 도메인 담당자 검토 필요.

### 6.3 Phase 4 (Full mockup) 우선순위

Phase 4 에서 패턴별 1개 대표 목업 50~80개 생성 시 우선순위:

1. **Top 10 패턴 (Phase 1 사용 빈도 기준)** — 가장 흔한 화면 형식이므로 LLM 학습 효과 최대
2. **DB 시드 ∩ Preview ∩ Phase 1 사용 ≥ 5** — 3-way 매칭되는 검증된 패턴
3. **신규 분류기 코드 (§2.1)** — 분류기는 검출했으나 DB·Preview 둘 다 없음 — 우선 정규화 후 시드 추가

---

*JSON 산출물: `docs/reference/pattern-coverage.json`*
*Phase 1 입력: `docs/reference/ui-inventory.json`*