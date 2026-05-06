# T3Series 테이블 카탈로그

> 총 **674개 테이블**. 도메인(접두어)별 그룹핑. 스냅샷: `T3Series_20260422_Table_DDL.sql`.
> 접두어 설명은 [README.md](./README.md#4-도메인접두어-사전) 참조.

## 목차

- [TB_FP (135) — Factory Planning](#tb_fp-135--factory-planning)
- [TB_CM (106) — Common Master](#tb_cm-106--common-master)
- [TB_IS (60) — Insight (uppercase)](#tb_is-60--insight-uppercase)
- [TB_MP (58) — Master Planning](#tb_mp-58--master-planning)
- [TB_EN (45) — Engine (FP 실행 결과)](#tb_en-45--engine-fp-실행-결과)
- [tb_is (36) — insight (lowercase, 신규)](#tb_is-36--insight-lowercase-신규)
- [TB_RT (34) — Result (SCM 계획 결과)](#tb_rt-34--result-scm-계획-결과)
- [TB_BF (31) — Baseline Forecasting](#tb_bf-31--baseline-forecasting)
- [TB_DP (29) — Demand Planning](#tb_dp-29--demand-planning)
- [TB_AD (27) — Admin](#tb_ad-27--admin)
- [TB_UT (24) — Utility](#tb_ut-24--utility)
- [TB_SA (21) — Sales Aggregation](#tb_sa-21--sales-aggregation)
- [TB_IF (20) — Interface](#tb_if-20--interface)
- [TB_IM (17) — Inventory Management](#tb_im-17--inventory-management)
- [QRTZ (11) — Quartz Native](#qrtz-11--quartz-native)
- [TB_DPD (5) — DP Dimension Closure](#tb_dpd-5--dp-dimension-closure)
- [TB_RP (4) — Replenishment/Purchase](#tb_rp-4--replenishmentpurchase)
- [TB_FO (4) — Forecast](#tb_fo-4--forecast)
- [TB_SO (2) — Stock/Sales Order](#tb_so-2--stocksales-order)
- [TB_QZ (2) — Quartz Job 메타](#tb_qz-2--quartz-job-메타)
- [TB_EX (1) — External](#tb_ex-1--external)
- [기타 시스템](#기타-시스템)

---

## TB_FP (135) — Factory Planning

공장 계획 전체 스키마. BOR(Bill Of Routing)·WO(Work Order)·WIP·Route·Stock·Resource 등 FP 엔진이 사용하는 운영 데이터.

### Activity / Batch
- `TB_FP_ACTIVITY` · `TB_FP_ACTIVITY_RELATION` · `TB_FP_ACTIVITY_SPLIT`
- `TB_FP_BATCH_ACTIVITY` · `TB_FP_BATCH_RESRC` · `TB_FP_BATCH_RESRC_INV`

### BOM / BOD / BOR
- `TB_FP_BOD` · `TB_FP_BOD_CALENDAR`
- `TB_FP_BOM_ROUTING`
- `TB_FP_BOR` · `TB_FP_BOR_AVAIL_TIME` · `TB_FP_BOR_CALENDAR` · `TB_FP_BOR_DIVIDE_CALENDAR`
- `TB_FP_BOR_SET_DTL` · `TB_FP_BOR_SET_MST` · `TB_FP_BOR_SET_TOOL`
- `TB_FP_BOR_TIME_CONSTRAINT`

### Bundle
- `TB_FP_BUNDLE` · `TB_FP_BUNDLE_BOR` · `TB_FP_BUNDLE_BOR_SET`
- `TB_FP_BYPRODUCT`

### Calendar
- `TB_FP_CALENDAR_DTL` · `TB_FP_CALENDAR_MST`

### Confirmed (CFM)
- `TB_FP_CFM_ACTIVITY` · `TB_FP_CFM_RESRC` · `TB_FP_CFM_STOCK_ASSIGN`
- `TB_FP_CONFIRMED_PLAN`

### Container / Master Data
- `TB_FP_CONTAINER` · `TB_FP_CORPORATION` · `TB_FP_CUSTOMER`
- `TB_FP_DELIVERY_PATTERN`

### Demand (DMND)
- `TB_FP_DEMAND`
- `TB_FP_DMND_ALT_RESRC_POLICY` · `TB_FP_DMND_BATCH_GRP`
- `TB_FP_DMND_BOM_ROUTING` · `TB_FP_DMND_BOR` · `TB_FP_DMND_BOR_EFFICIENCY` · `TB_FP_DMND_BOR_PRIORITY`
- `TB_FP_DMND_INTER_BOR_TIME` · `TB_FP_DMND_INV_USAGE_RULE`
- `TB_FP_DMND_ORDER_CONNECTION` · `TB_FP_DMND_PRODTN_RULE`
- `TB_FP_DMND_RESRC_ASSIGN` · `TB_FP_DMND_ROUTE_ASSIGN` · `TB_FP_DMND_ROUTE_GRP` · `TB_FP_DMND_ROUTE_PST`
- `TB_FP_DMND_STOCK_ASSIGN` · `TB_FP_DMND_STOCK_POLICY`
- `TB_FP_DMND_TAT` · `TB_FP_DMND_TERMINAL_INV`

### Inventory / Item
- `TB_FP_INVENTORY`
- `TB_FP_ITEM` · `TB_FP_ITEM_GRP` · `TB_FP_ITEM_PARENT_GRP`

### JC (Job Change)
- `TB_FP_JC_TIME` · `TB_FP_JC_TIME_GRP` · `TB_FP_JC_TIME_ITEM` · `TB_FP_JC_TIME_ITEM_GRP`

### MRP / Line / Model
- `TB_FP_LINE_CAPA` · `TB_FP_MAIN_VERSION`
- `TB_FP_MODEL_PROPERTY` · `TB_FP_MOVABLE_ROUTE`
- `TB_FP_MRP` · `TB_FP_MRP_SPLIT`

### Order / Period / Plan
- `TB_FP_ORDER_TYPE` · `TB_FP_PERIOD`
- `TB_FP_PLAN_HISTORY` · `TB_FP_PLAN_POLICY` · `TB_FP_PLAN_POLICY_DTL`
- `TB_FP_PLAN_PROBLEM` · `TB_FP_PLAN_STATUS` · `TB_FP_PLAN_STEP` · `TB_FP_PLAN_STEP_SEQ`
- `TB_FP_PLAN_VERSION`
- `TB_FP_PLANT` · `TB_FP_PLANT_ALLOC_PRIORITY`

### Production
- `TB_FP_PRODTN_LIMIT` · `TB_FP_PRODTN_ORDER` · `TB_FP_PRODTN_SEQ_MAP`

### Resource
- `TB_FP_RESOURCE` · `TB_FP_RESOURCE_CALENDAR`
- `TB_FP_RESRC_DOWNTIME` · `TB_FP_RESRC_SELECT_RULE` · `TB_FP_RESRC_UTILIZATION` · `TB_FP_RESRC_VIRTL_CNT`

### Route
- `TB_FP_ROUTE` · `TB_FP_ROUTE_CONTAINER_USE` · `TB_FP_ROUTE_GRP`
- `TB_FP_ROUTE_IN_OUT` · `TB_FP_ROUTE_SYNC` · `TB_FP_ROUTE_TIME_CONSTS`

### Simulation / Site / Stage / Stock
- `TB_FP_SIMUL_OPTION` · `TB_FP_SITE` · `TB_FP_STAGE`
- `TB_FP_STOCK` · `TB_FP_STOCK_INPUT_PLAN` · `TB_FP_STOCK_OUTPUT_PLAN`
- `TB_FP_STORAGE` · `TB_FP_STORAGE_INV_ASSIGN` · `TB_FP_STORAGE_MIXABLE_ITEM`

### Target / Time / Transfer
- `TB_FP_TARGET_IO_PLAN` · `TB_FP_TARGET_RESRC_PLAN`
- `TB_FP_TIME_WINDOW` · `TB_FP_TOOL_SUPPLY` · `TB_FP_TRANSFER_PLAN`
- `TB_FP_VERSION_PLANT` · `TB_FP_WINDOW_TIME`

### WIP (Work In Progress)
- `TB_FP_WIP` · `TB_FP_WIP_BATCH` · `TB_FP_WIP_CONTAINER`
- `TB_FP_WIP_INV` · `TB_FP_WIP_RELATION` · `TB_FP_WIP_RESRC`

### WO (Work Order) — Planning workspace
- `TB_FP_WO_ALT_RESRC_POLICY` · `TB_FP_WO_BATCH_GRP`
- `TB_FP_WO_BOM_ROUTING` · `TB_FP_WO_BOR` · `TB_FP_WO_BOR_EFFICIENCY` · `TB_FP_WO_BOR_PRIORITY`
- `TB_FP_WO_INTER_BOR_TIME` · `TB_FP_WO_INV_USAGE_RULE`
- `TB_FP_WO_ORDER_CONNECTION` · `TB_FP_WO_PLAN` · `TB_FP_WO_PRODTN_RULE`
- `TB_FP_WO_RESRC_ASSIGN` · `TB_FP_WO_ROUTE_ASSIGN` · `TB_FP_WO_ROUTE_GRP` · `TB_FP_WO_ROUTE_PST`
- `TB_FP_WO_STOCK_ASSIGN` · `TB_FP_WO_STOCK_POLICY`
- `TB_FP_WO_TAT` · `TB_FP_WO_TERMINAL_INV`
- `TB_FP_WORK_ORDER`

### 기타
- `TB_FP_ADJUSTMENTS` · `TB_FP_ALT_MAT_GRP`

---

## TB_CM (106) — Common Master

전역 마스터 · 공통 데이터. 품목·사이트·창고·비용·출하 등 전 모듈이 공유.

### Actual (실적)
- `TB_CM_ACTUAL_PERIOD` · `TB_CM_ACTUAL_PRODTN` · `TB_CM_ACTUAL_PRODTN_ISSUE`
- `TB_CM_ACTUAL_SALES` · `TB_CM_ACTUAL_SHIPMENT`

### Attribute / Alternate
- `TB_CM_ALTERNATE_SUPPLY`
- `TB_CM_ATTRIBUTE` · `TB_CM_ATTRIBUTE_DESC` · `TB_CM_ITEM_ATTRIBUTE`

### Base / BOD
- `TB_CM_BASE_ORDER` · `TB_CM_BASE_ROUTE`
- `TB_CM_BOD_LT` · `TB_CM_BOD_MAP_PRIOD_PRIOR`

### Calendar / Channel / Config
- `TB_CM_CALENDAR` · `TB_CM_HOLIDAY`
- `TB_CM_CHANNEL_TYPE`
- `TB_CM_COMM_CONFIG` · `TB_CM_CONFIGURATION` · `TB_CM_SETTING`

### Control Board (Main Version)
- `TB_CM_CONBD_MAIN_VER_DTL` · `TB_CM_CONBD_MAIN_VER_MST`

### Corporation / Customer / Vendor
- `TB_CM_CORPORATION` · `TB_CM_CUSTOMER`
- `TB_CM_VENDOR_MST`

### Cost
- `TB_CM_COST_GRP_DTL` · `TB_CM_COST_GRP_MST`
- `TB_CM_COST_ITEM` · `TB_CM_COST_ITEM_EST` · `TB_CM_COST_ITEM_SPECIFIC`
- `TB_CM_COST_MST`

### Demand
- `TB_CM_DEMAND_CUTOFF` · `TB_CM_DEMAND_OVERVIEW`
- `TB_CM_DMND_SHPP_MAP_MST`

### Engine
- `TB_CM_ENGINE_LOG` · `TB_CM_ENGINE_SAVE_OPTION`

### Global BOM
- `TB_CM_GLB_BOM_PRIOD_ACTV` · `TB_CM_GLB_BOM_PRIOD_RATE`
- `TB_CM_GLB_PBOM_PRIOD_PRIOR`
- `TB_CM_GLOBAL_BOM_DTL` · `TB_CM_GLOBAL_BOM_MST`
- `TB_CM_GLOBAL_PLAN_BOM`

### Grid / Incoterms
- `TB_CM_GRID_VALUE` · `TB_CM_INCOTERMS`

### In-Transit Stock
- `TB_CM_INTRANSIT_STOCK_DTL` · `TB_CM_INTRANSIT_STOCK_MST` · `TB_CM_INTRANSIT_STOCK_QTY`

### Item
- `TB_CM_ITEM_CLASS_DTL` · `TB_CM_ITEM_CLASS_MAP` · `TB_CM_ITEM_CLASS_MST`
- `TB_CM_ITEM_LEVEL_MGMT` · `TB_CM_ITEM_MST`
- `TB_CM_ITEM_SHIP_LT_SCH` · `TB_CM_ITEM_TYPE`
- `TB_CM_LEVEL_MGMT`

### Location
- `TB_CM_LOC_BOD_MAP` · `TB_CM_LOC_DTL` · `TB_CM_LOC_MGMT` · `TB_CM_LOC_MST`
- `TB_CM_STORAGE_LOCATION`

### Log
- `TB_CM_LOG`

### Lot / Material / Multi
- `TB_CM_LOT_SIZE_GROUP`
- `TB_CM_MAT_CONST_CHG_PERIOD`
- `TB_CM_MULTI_LV_ALLOC_RULE`

### Packing / Pallet
- `TB_CM_PACKING` · `TB_CM_PALLET`
- `TB_CM_PERIOD_BOD_LEADTIME`

### Plan
- `TB_CM_PLAN_HORIZON`
- `TB_CM_PLAN_POLICY_DTL` · `TB_CM_PLAN_POLICY_MGMT` · `TB_CM_PLAN_POLICY_MST` · `TB_CM_PLAN_POLICY_VALUE`
- `TB_CM_PLAN_SCOPE` · `TB_CM_PLAN_SCOPE_LINK` · `TB_CM_PLAN_SCOPE_MODULE`
- `TB_CM_PLAN_SCOPE_USER` · `TB_CM_PLAN_SCOPE_USER_GRP`
- `TB_CM_PLAN_SNRIO_MGMT_DTL` · `TB_CM_PLAN_SNRIO_MGMT_MST`

### Resource / Search / Ship / Site / Sub
- `TB_CM_RES_GROUP` · `TB_CM_SEARCH_OPTION`
- `TB_CM_SHIP_LT_DAILY_SCH` · `TB_CM_SHIP_LT_DTL` · `TB_CM_SHIP_LT_EXCEPTION_SCH`
- `TB_CM_SHIP_LT_MONTHLY_SCH` · `TB_CM_SHIP_LT_MST`
- `TB_CM_SITE_ITEM` · `TB_CM_SITE_PACKING`
- `TB_CM_SITE_WAREHOUSE_MGMT` · `TB_CM_SITE_WH_MGMT_DTL`
- `TB_CM_SUB_PRIORITY` · `TB_CM_TIME_BUCKET`

### Transfer
- `TB_CM_TRANSFER_MGMT_DTL` · `TB_CM_TRANSFER_MGMT_MST` · `TB_CM_TRANSFER_VER`

### UOM / Vehicle / Volume
- `TB_CM_UOM`
- `TB_CM_VEHICLE` · `TB_CM_VEHICLE_LOAD` · `TB_CM_VEHICLE_MST` · `TB_CM_VEHICLE_RES`
- `TB_CM_VOLUME_LIMIT`

### Warehouse
- `TB_CM_WAREHOUSE_STOCK_DEST` · `TB_CM_WAREHOUSE_STOCK_DTL`
- `TB_CM_WAREHOUSE_STOCK_MST` · `TB_CM_WAREHOUSE_STOCK_QTY`
- `TB_CM_WAREHOUSE_TYPE` · `TB_CM_WAREHOUSING_CALENDAR`

---

## TB_IS (60) — Insight (uppercase)

AI/LLM 기반 인사이트 모듈. GraphRAG · Chat · Metadata · Ontology · OAuth2.

### API / Chart / Chat (Legacy)
- `TB_IS_APIKEY` · `TB_IS_EXTRNLAPIKEY`
- `TB_IS_CHART_TEMPLATE`
- `TB_IS_CHAT_MENUAL_REFER` · `TB_IS_CHAT_MESSAGES` · `TB_IS_CHAT_SESSIONS` · `TB_IS_CHAT_SQL_QUERY_REFER`

### Document / Embedding
- `TB_IS_DOC_CHUNK` · `TB_IS_EMBEDDING_CACHE`
- `TB_IS_INDEXED_DOC` · `TB_IS_INDEXED_DOC_METADATA`

### Exclude / File / Job
- `TB_IS_EXCLUDE_TABLE`
- `TB_IS_FILEINFO` · `TB_IS_JOBINFO`

### Graph (Base)
- `TB_IS_GRAPH_EDGE` · `TB_IS_GRAPH_NODE_TYPE` · `TB_IS_GRAPH_REL_TYPE`
- `TB_IS_NODE_CLASS`

### GraphRAG (Legacy)
- `TB_IS_GRAPHRAG_EDGE` · `TB_IS_GRAPHRAG_NODE`
- `TB_IS_GRAPHRAG_NODE_EMBEDDING` · `TB_IS_GRAPHRAG_VERSION`

### Key-Value / Metadata
- `TB_IS_KV_STORAGE`
- `TB_IS_META_COLUMN` · `TB_IS_META_COLUMN_LJJ` · `TB_IS_META_COLUMN_STAT`
- `TB_IS_META_FRKEY` · `TB_IS_META_GLOSSARY`
- `TB_IS_META_INFER_LOG` · `TB_IS_META_INFER_SNAPSHOT` · `TB_IS_META_JOIN_RULE`
- `TB_IS_META_PROC_SQL` · `TB_IS_META_PROCEDURE`
- `TB_IS_META_QA` · `TB_IS_META_SQL_FEEDBACK`
- `TB_IS_META_TABLE` · `TB_IS_META_TABLE_LJJ` · `TB_IS_META_TABLE_STAT`

### Network (Legacy)
- `TB_IS_NETWORK` · `TB_IS_NETWORK_EDGE` · `TB_IS_NETWORK_NODE`

### OAuth2
- `TB_IS_OAUTH2CLIENT` · `TB_IS_OAUTH2CODE` · `TB_IS_OAUTH2TOKEN`

### Ontology
- `TB_IS_ONTLGY_ARTIFACT` · `TB_IS_ONTLGY_ENTITY_TABLE`
- `TB_IS_ONTLGY_PROCESS` · `TB_IS_ONTLGY_PROCESS_ENTITY`
- `TB_IS_ONTLGY_STAGE` · `TB_IS_ONTLGY_VERSION`

### Prompt / QA / Query / RAG / Runnable
- `TB_IS_PROMPTTPL` · `TB_IS_QAPATTERN`
- `TB_IS_QUERY_CATEGORY` · `TB_IS_QUERY_WEIGHT`
- `TB_IS_RAGCACHE`
- `TB_IS_RUNNABLE_NODE`

### Schema / Service / Tool
- `TB_IS_SCHEMA_VERSION`
- `TB_IS_SERVICE` · `TB_IS_STREAMLIT` · `TB_IS_TOOLINFO`

---

## tb_is (36) — insight (lowercase, 신규)

신규 insight 모듈 테이블 — GraphRAG 파이프라인 · LLM 관찰 · Skill Agent · Business Ontology.

### Artifact
- `tb_is_artifact` · `tb_is_artifact_file`
- `tb_is_docker_artifact` · `tb_is_docker_artifact_files`

### Chat (신규 스키마)
- `tb_is_chat_graph_state`
- `tb_is_chat_message_attch` · `tb_is_chat_metadata`
- `tb_is_chat_run_step` · `tb_is_chat_summary`
- `tb_is_chat_turns` · `tb_is_chat_turns_attch`

### Business Ontology / Contract
- `tb_is_business_ontology`
- `tb_is_ontlgy_entity` · `tb_is_ontlgy_entity_relation`
- `tb_is_prcss_ontlgy` · `tb_is_prcss_ontlgy_hist`
- `tb_is_vwbusnss_ontlgy` · `tb_is_vwbusnss_ontlgy_hist`
- `tb_is_vw_cntrct` · `tb_is_infrrd_vw_cntrct`

### GraphRAG (staging)
- `tb_is_graphrag_edge_embedding` · `tb_is_graphrag_edge_embedding_staging`
- `tb_is_graphrag_edge_staging`
- `tb_is_graphrag_node_embedding_staging` · `tb_is_graphrag_node_staging`

### LLM Observability
- `tb_is_llm_cache` · `tb_is_llm_call_log` · `tb_is_llm_feedback`

### Menu / Network / Skill
- `tb_is_menu_func_map`
- `tb_is_network_history`
- `tb_is_skill_agent_def` · `tb_is_skill_agent_def_hist`

### SQL Pattern / User / View Manual
- `tb_is_sqlpattern`
- `tb_is_user_memos`
- `tb_is_view_manual` · `tb_is_view_manual_bak`

---

## TB_MP (58) — Master Planning

마스터 플래닝 도메인 (MP 엔진용 BOR · Bundle · Demand · Route · Resource).

### BOR / Bundle
- `TB_MP_BOR_CAPACITY`
- `TB_MP_BUNDLE_BOR` · `TB_MP_BUNDLE_BOR_SET` · `TB_MP_BUNDLE_MST`

### Demand
- `TB_MP_DEMAND_BOR`
- `TB_MP_DEMAND_INV_ASSIGN` · `TB_MP_DEMAND_INVENTORY_ASSIGN`
- `TB_MP_DEMAND_ROUTE_PST` · `TB_MP_DEMAND_WIP_ASSIGN`
- `TB_MP_DMND_BOM_RATE`
- `TB_MP_DMND_OVW_RES_ASIGN` · `TB_MP_DMND_OVW_ROUTE_ASSIGN` · `TB_MP_DMND_OVW_SITE_ASIGN`

### Item / Grade / Calendar
- `TB_MP_GRADE_BYPRODUCT`
- `TB_MP_ITEM_MFG_OPERT_CALDR`
- `TB_MP_ITEM_RES_CAPA_DTL` · `TB_MP_ITEM_RES_CAPA_MST`
- `TB_MP_ITEM_RES_INFO`
- `TB_MP_ITEM_RES_PREFER_DTL` · `TB_MP_ITEM_RES_PREFER_MST`

### JCT / Location / Material Supply
- `TB_MP_JCT` · `TB_MP_JCT_GRP`
- `TB_MP_LOC_HOLIDAY`
- `TB_MP_MAT_SUPPLY_CALENDAR`

### Max Op / Order Connection
- `TB_MP_MAX_OP_RES` · `TB_MP_MAX_OP_RES_GRP`
- `TB_MP_ORDER_CONNECTION`

### Period / Planned Order / PO
- `TB_MP_PERIOD_RES_MGMT`
- `TB_MP_PLANNEDORDER`
- `TB_MP_PO_BOM_RATE` · `TB_MP_PO_BOR`
- `TB_MP_PO_INV_ASSIGN` · `TB_MP_PO_INVENTORY_ASSIGN`
- `TB_MP_PO_RES_ASIGN` · `TB_MP_PO_ROUTE_ASSIGN` · `TB_MP_PO_ROUTE_PST`
- `TB_MP_PO_SITE_ASSIGN` · `TB_MP_PO_WIP_ASSIGN`

### Production Cycle / Limit / Alloc
- `TB_MP_PRDUCT_CYCL_CONTINU` · `TB_MP_PRE_BUILD`
- `TB_MP_PROD_LIMIT_DTL` · `TB_MP_PROD_LIMIT_MST`
- `TB_MP_PROD_MIN_ALLOC_DTL` · `TB_MP_PROD_MIN_ALLOC_MST`

### Resource / Route / Simulation
- `TB_MP_RES_ACTUAL` · `TB_MP_RES_HOLIDAY`
- `TB_MP_RES_MGMT_DTL` · `TB_MP_RES_MGMT_MST`
- `TB_MP_ROUTE` · `TB_MP_ROUTING`
- `TB_MP_ROUTE_CLASS_DTL` · `TB_MP_ROUTE_CLASS_MAP` · `TB_MP_ROUTE_CLASS_MST`
- `TB_MP_SIMLT_GRP` · `TB_MP_SIMLT_RES`

### Validation / WIP
- `TB_MP_VALIDATION`
- `TB_MP_WIP_DTL` · `TB_MP_WIP_MST`

---

## TB_EN (45) — Engine (FP 실행 결과)

FP 엔진 실행 결과 테이블 (작업 공간). 엔진이 계산 후 쓰고, UI/API 가 조회.

### Demand Order Tracking
- `TB_EN_DMND_ORD_TRACKING_DTL` · `TB_EN_DMND_ORD_TRACKING_MST`
- `TB_EN_DMND_RESULT`
- `TB_EN_DMND_TRACK_FIX_CNSMP` · `TB_EN_DMND_TRACK_INV_CNSMP`
- `TB_EN_DMND_TRACK_RES_ASIGN` · `TB_EN_DMND_TRACK_SITE_ASIGN`

### FP 결과
- `TB_EN_FP_ACTIVITY` · `TB_EN_FP_ACTIVITY_RELATION` · `TB_EN_FP_ACTIVITY_SPLIT`
- `TB_EN_FP_ADJUSTMENTS`
- `TB_EN_FP_BATCH_ACTIVITY`
- `TB_EN_FP_MRP` · `TB_EN_FP_MRP_SPLIT`
- `TB_EN_FP_PLAN_PROBLEM`
- `TB_EN_FP_RESRC_DOWNTIME` · `TB_EN_FP_RESRC_UTILIZATION`
- `TB_EN_FP_STOCK_INPUT_PLAN` · `TB_EN_FP_STOCK_OUTPUT_PLAN`
- `TB_EN_FP_TRANSFER_PLAN` · `TB_EN_FP_WO_PLAN`

### Inventory / Operation Info
- `TB_EN_INV_OPERATION_INFO` · `TB_EN_INV_STATUS`
- `TB_EN_INVENTORY_ACTIVITY` · `TB_EN_ITEM_STATUS`
- `TB_EN_MAT_CONSUME_PLAN` · `TB_EN_MAT_CONSUME_PLAN_PROD` · `TB_EN_MAT_CONSUME_PLAN_RES`

### MP / RP Analysis
- `TB_EN_MP_COMPARE_ANALYSIS` · `TB_EN_MP_DMND_ANLYS`
- `TB_EN_MP_RESOURCE_GANTT` · `TB_EN_MP_RESOURCE_HOLIDAYS` · `TB_EN_MP_RESOURCE_PLAN`
- `TB_EN_MP_RESULT`
- `TB_EN_RP_COMPARE_ANLYS` · `TB_EN_RP_RESULT` · `TB_EN_RP_RETURN`

### Resource / Shipment / Short-Late
- `TB_EN_REPLSH_ORDER`
- `TB_EN_RES_OPERATION_INFO` · `TB_EN_RES_PRODUCT_PLAN`
- `TB_EN_RES_STATUS` · `TB_EN_RES_UTILIZATION`
- `TB_EN_SHIPMENT_PLAN`
- `TB_EN_SHORT_LATE_RSN_ANLYS` · `TB_EN_SHORT_LATE_RSN_SUMM`

---

## TB_RT (34) — Result (SCM 계획 결과)

SCM 실행 결과 아카이브. `TB_EN_*` 스키마와 유사하나 보관(Result) 용도.

### Demand Order Tracking (EN 과 동일 세트)
- `TB_RT_DMND_ORD_TRACKING_DTL` · `TB_RT_DMND_ORD_TRACKING_MST`
- `TB_RT_DMND_RESULT`
- `TB_RT_DMND_TRACK_FIX_CNSMP` · `TB_RT_DMND_TRACK_INV_CNSMP`
- `TB_RT_DMND_TRACK_RES_ASIGN` · `TB_RT_DMND_TRACK_SITE_ASIGN`

### Inventory
- `TB_RT_INV_OPERATION_INFO` · `TB_RT_INV_STATUS`
- `TB_RT_INVENTORY_ACTIVITY`
- `TB_RT_ITEM_STATUS`
- `TB_RT_MAT_CONSUME_PLAN` · `TB_RT_MAT_CONSUME_PLAN_PROD` · `TB_RT_MAT_CONSUME_PLAN_RES`

### MP
- `TB_RT_MP_COMPARE_ANALYSIS` · `TB_RT_MP_DMND_ANLYS`
- `TB_RT_MP_RESOURCE_GANTT` · `TB_RT_MP_RESOURCE_HOLIDAYS` · `TB_RT_MP_RESOURCE_PLAN`
- `TB_RT_MP_RESULT`

### Order Connection / Replsh / Resource
- `TB_RT_ORDER_CONNECTION`
- `TB_RT_REPLSH_ORDER`
- `TB_RT_RES_OPERATION_INFO` · `TB_RT_RES_PRODUCT_PLAN`
- `TB_RT_RES_STATUS` · `TB_RT_RES_UTILIZATION`

### RP Analysis
- `TB_RT_RP_COMPARE_ANLYS` · `TB_RT_RP_RESULT` · `TB_RT_RP_RETURN`

### Shipment / Short-Late / Stock / WIP
- `TB_RT_SHIPMENT_PLAN`
- `TB_RT_SHORT_LATE_RSN_ANLYS` · `TB_RT_SHORT_LATE_RSN_SUMM`
- `TB_RT_STOCK_PLAN`
- `TB_RT_WIP_PLAN`

> **TB_EN ↔ TB_RT 차이**: `TB_RT_*` 에는 `TB_RT_FP_*` 계열이 없음 → FP 엔진 raw 결과는 TB_EN 에만 존재. TB_RT 는 통합 Result 저장소.

---

## TB_BF (31) — Baseline Forecasting

베이스라인 예측. Python `bfserver` 가 주 작성자. 모델/팩터/하이퍼파라미터/결과/통계 저장.

### Control Board / Factor
- `TB_BF_CONTROL_BOARD_VER_MST` · `TB_BF_CONTROL_BOARD_VER_OPT` · `TB_BF_CONTROL_BOARD_VER_STEP`
- `TB_BF_DATE_FACTOR` · `TB_BF_FACTOR_MGMT` · `TB_BF_FACTOR_SET`
- `TB_BF_SALES_FACTOR`

### Hyperparameter / Item Account / Log
- `TB_BF_HYPER_PARAM`
- `TB_BF_ITEM_ACCOUNT_MODEL_MAP`
- `TB_BF_LOG`

### Model / LV Output / New Item
- `TB_BF_LV_OUTPUT`
- `TB_BF_MODEL_EVAL_HISTORY` · `TB_BF_MODEL_FACTOR_MGMT`
- `TB_BF_MODEL_LOG_SUCCESS`
- `TB_BF_MODEL_RT` · `TB_BF_MODEL_RT_FINAL` · `TB_BF_MODEL_SAVE_HISTORY`
- `TB_BF_NEW_ITEM_ACCOUNT_MAP` · `TB_BF_NLP_NEW_ITEM_MAP`

### RT (Forecast Results)
- `TB_BF_RT` · `TB_BF_RT_ACCRCY`
- `TB_BF_RT_FINAL` · `TB_BF_RT_HISTORY` · `TB_BF_RT_LOG_SUCCESS`
- `TB_BF_RT_POST` · `TB_BF_RT_RATIO` · `TB_BF_RT_RATIO_PRED`
- `TB_BF_RT_SUMMARY` · `TB_BF_RT_W`

### Stats
- `TB_BF_SABC_STATS` · `TB_BF_SALES_STATS`

---

## TB_DP (29) — Demand Planning

수요계획. Account · Control Board · Dimension · Entry · Measure.

### Account
- `TB_DP_ACCOUNT_ASSORTMENT` · `TB_DP_ACCOUNT_MST`

### Control Board
- `TB_DP_CONTROL_BOARD_MST` · `TB_DP_CONTROL_BOARD_MST_INIT`
- `TB_DP_CONTROL_BOARD_VER_DTL` · `TB_DP_CONTROL_BOARD_VER_INIT` · `TB_DP_CONTROL_BOARD_VER_MST`

### Dimension
- `TB_DP_DIM_SETTING` · `TB_DP_DIMENSION_DATA`

### Entry (수요 입력)
- `TB_DP_ENTRY` · `TB_DP_ENTRY_ARCHIVE` · `TB_DP_ENTRY_CUTOFF`
- `TB_DP_ENTRY_HISTORY` · `TB_DP_ENTRY_LOG` · `TB_DP_ENTRY_REP`

### Exchange / Measure / Plan Policy / Status
- `TB_DP_EXCHANGE_RATE`
- `TB_DP_MEASURE_DATA` · `TB_DP_MEASURE_MST` · `TB_DP_MEASURE_SETTING`
- `TB_DP_PLAN_POLICY`
- `TB_DP_PROCESS_STATUS_LOG`

### Sales / Unit Price / User Mapping
- `TB_DP_SALES_AUTH_MAP` · `TB_DP_SALES_LEVEL_MGMT`
- `TB_DP_UNIT_PRICE`
- `TB_DP_USER_ACCOUNT_MAP`
- `TB_DP_USER_ITEM_ACCOUNT_EXCLUD` · `TB_DP_USER_ITEM_ACCOUNT_MAP`
- `TB_DP_USER_ITEM_MAP` · `TB_DP_USER_SALES_MAP`

---

## TB_AD (27) — Admin

관리자 · 사용자 · 권한 · 메뉴 · 테마.

### Admin / Authority / Common Code
- `TB_AD_ADMIN_ACTION_LOG` · `TB_AD_AUTHORITY`
- `TB_AD_COMN_CODE` · `TB_AD_COMN_GRP`
- `TB_AD_DELEGATION`

### Group / Language / Manual
- `TB_AD_GROUP` · `TB_AD_LANG_PACK` · `TB_AD_MANUAL`

### Menu
- `TB_AD_MENU` · `TB_AD_MENU_BADGE` · `TB_AD_MENU_BOOKMARK`

### Password / Permission
- `TB_AD_PASSWORD_HISTORY`
- `TB_AD_PERMISSION` · `TB_AD_PERMISSION_GROUP` · `TB_AD_SERVICE_PERMISSION`

### System Log / Theme / UI Setting
- `TB_AD_SYSTEM_ACCESS_LOG`
- `TB_AD_THEME_DTL` · `TB_AD_THEME_MST`
- `TB_AD_UI_SETTING`

### User
- `TB_AD_USER` · `TB_AD_USER_GROUP` · `TB_AD_USER_LAYOUT`
- `TB_AD_USER_PREF` · `TB_AD_USER_PREF_DTL` · `TB_AD_USER_PREF_MST` · `TB_AD_USER_PREF_OPT`
- `TB_AD_VIEW_EXECUTION_LOG`

---

## TB_UT (24) — Utility

공통 UX 유틸 (Calendar, Dashboard, Issue, Mail, Memo, Noticeboard, Task, Workflow).

### Calendar
- `TB_UT_CALENDAR` · `TB_UT_CALENDAR_CATEGORY` · `TB_UT_CALENDAR_FILE`

### Dashboard / Excel Import / File Storage
- `TB_UT_DASHBOARD`
- `TB_UT_EXCEL_IMPORT_FILE` · `TB_UT_EXCEL_IMPORT_JOB`
- `TB_UT_FILE_STORAGE`

### Issue
- `TB_UT_ISSUE` · `TB_UT_ISSUE_ASSIGN` · `TB_UT_ISSUE_COMMENT` · `TB_UT_ISSUE_FILE`

### Mail / Memo / Message
- `TB_UT_MAIL` · `TB_UT_MAIL_FILE` · `TB_UT_MAIL_RECIEVER`
- `TB_UT_MEMO` · `TB_UT_MESSAGE`

### Noticeboard / Short URL / Task / Widget
- `TB_UT_NOTICEBOARD` · `TB_UT_NOTICEBOARD_FILE`
- `TB_UT_SHORT_URL` · `TB_UT_TASK` · `TB_UT_WIDGET`

### Workflow
- `TB_UT_WORKFLOW` · `TB_UT_WORKFLOW_DTL` · `TB_UT_WORKFLOW_MST`

---

## TB_SA (21) — Sales Aggregation

집계 · Fact · Demand Adjust · Meeting(회의) · 유연 리포트.

### Aggregation
- `TB_SA_AGGR` · `TB_SA_AGGR_FIELD_DESC` · `TB_SA_AGGR_MST`

### Demand Adjust
- `TB_SA_DEMAND_ADJUST` · `TB_SA_DEMAND_ADJUST_LOG`

### Fact (현재/신규)
- `TB_SA_FACT` · `TB_SA_FACT_DESC` · `TB_SA_FACT_FIELD_DESC`
- `TB_SA_FACT_FIELD_DESC_NEW` · `TB_SA_FACT_NEW`
- `TB_SA_FACT_VIEW_MST`

### Flex Report
- `TB_SA_FLX_RPT_MST`

### Meeting
- `TB_SA_MEET_AGENDA` · `TB_SA_MEET_ATTENDEE`
- `TB_SA_MEET_FILE` · `TB_SA_MEET_ISSUE` · `TB_SA_MEET_MENU`
- `TB_SA_MEET_MINUTES` · `TB_SA_MEET_MST`

### Version
- `TB_SA_VER_DTL` · `TB_SA_VER_MST`

---

## TB_IF (20) — Interface

외부 시스템 연계 staging 테이블. ERP/MES 등에서 raw 데이터를 적재.

- `TB_IF_ACTUAL_SHIPMENT`
- `TB_IF_BOD` · `TB_IF_BOM` · `TB_IF_BOR`
- `TB_IF_CLASS_VERSION`
- `TB_IF_DEMAND` · `TB_IF_DMND_SHPP_MAP`
- `TB_IF_INTRANSIT_STOCK`
- `TB_IF_MAT_SUPPLY_CALENDAR` · `TB_IF_MTRL_CONST`
- `TB_IF_REPLSH_STRATEGY`
- `TB_IF_RESOURCE` · `TB_IF_ROUTING`
- `TB_IF_SHIP_LT`
- `TB_IF_SITE` · `TB_IF_SITE_BOM` · `TB_IF_SITE_ITEM`
- `TB_IF_STORAGE_LOCATION`
- `TB_IF_TARGET_INV_VERSION`
- `TB_IF_WAREHOUSE_STOCK`

---

## TB_IM (17) — Inventory Management

재고 관리: ABC/XYZ · 안전재고 · PO 스케줄 · 목표 재고 정책.

### ABC-XYZ 분석 / 버전
- `TB_IM_ABCXYZ_ANLYS`
- `TB_IM_CLASS_VERSION`
- `TB_IM_TARGET_INV_VERSION`

### Inventory Cost / Period
- `TB_IM_INV_COST` · `TB_IM_INV_KEPPING_COST_RATE`
- `TB_IM_INV_PERIOD`

### Item / Location Setting
- `TB_IM_ITEM_SETTING` · `TB_IM_LOC_SETTING`

### PO Schedule
- `TB_IM_PO_CALENDAR`
- `TB_IM_PO_DAILY_SCH` · `TB_IM_PO_EXCEPTION_SCH` · `TB_IM_PO_MONTHLY_SCH`

### Stock / Safety Factor / Target Policy / Variability
- `TB_IM_STOCK_QTY_TYPE`
- `TB_IM_SVC_SAFTFCT_BASE`
- `TB_IM_TARGET_INV_POLICY` · `TB_IM_TARGET_INV_POLICY_PERIOD`
- `TB_IM_VARIABILITY_ACT_PRIOD`

---

## QRTZ (11) — Quartz Native

Spring Boot Quartz JDBC JobStore 기본 스키마. `wingui` application.yaml 에서 `job-store-type: jdbc` 로 활성화.

- `QRTZ_BLOB_TRIGGERS`
- `QRTZ_CALENDARS`
- `QRTZ_CRON_TRIGGERS`
- `QRTZ_FIRED_TRIGGERS`
- `QRTZ_JOB_DETAILS`
- `QRTZ_LOCKS`
- `QRTZ_PAUSED_TRIGGER_GRPS`
- `QRTZ_SCHEDULER_STATE`
- `QRTZ_SIMPLE_TRIGGERS`
- `QRTZ_SIMPROP_TRIGGERS`
- `QRTZ_TRIGGERS`

---

## TB_DPD (5) — DP Dimension Closure

Demand Planning 차원 계층 (Closure Table 패턴 — 조상/자손 경로 평탄화).

- `TB_DPD_ACCOUNT_HIERACHY2`
- `TB_DPD_ITEM_HIER_CLOSURE` · `TB_DPD_ITEM_HIERACHY2`
- `TB_DPD_SALES_HIER_CLOSURE`
- `TB_DPD_USER_HIER_CLOSURE`

---

## TB_RP (4) — Replenishment/Purchase

- `TB_RP_IN_RESERVATION` · `TB_RP_OUT_RESERVATION`
- `TB_RP_PURCHASE_ORDER`
- `TB_RP_REPLSH_STRATEGY`

---

## TB_FO (4) — Forecast

- `TB_FO_DEMAND`
- `TB_FO_DEMAND_ADJUSTMENTS`
- `TB_FO_REQ_VERSION`
- `TB_FO_STATUS`

---

## TB_SO (2) — Stock/Sales Order

- `TB_SO_DEMAND`
- `TB_SO_LOG`

---

## TB_QZ (2) — Quartz Job 메타

Quartz 네이티브(QRTZ_) 위에 쌓는 프로젝트 자체 Job 메타 테이블.

- `TB_QZ_JOB`
- `TB_QZ_JOB_HISTORY`

---

## TB_EX (1) — External

- `TB_EX_GITHUB_ISSUE`

---

## 기타 시스템

- `file_metadata` — 파일 메타데이터 (비표준 네이밍)
- `sysdiagrams` — SSMS 다이어그램용 시스템 테이블
