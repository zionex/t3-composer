# T3Series Stored Procedure · Function 카탈로그

> 총 **965개** (Stored Procedure + Function). 스냅샷: `T3Series_20260422_SP_DDL.sql` (4.7MB).

## 목차

- [1. 요약](#1-요약)
- [2. 네이밍 패턴](#2-네이밍-패턴)
- [3. 공통 유틸 (SP_COMM · FN_G · FN_SPLIT)](#3-공통-유틸-sp_comm--fn_g--fn_split)
- [4. 도메인 SP/FN (비UI)](#4-도메인-spfn-비ui)
  - [BF (Baseline Forecasting)](#bf-baseline-forecasting)
  - [CM (Common)](#cm-common)
  - [DP (Demand Planning)](#dp-demand-planning)
  - [FO (Forecast)](#fo-forecast)
  - [FP (Factory Planning)](#fp-factory-planning)
  - [IM (Inventory Management)](#im-inventory-management)
  - [MP (Master Planning)](#mp-master-planning)
  - [RP (Replenishment)](#rp-replenishment)
  - [SA (Sales Aggregation)](#sa-sales-aggregation)
  - [UT (Utility)](#ut-utility)
  - [기타](#기타)
- [5. UI 전용 SP (SP_UI_*)](#5-ui-전용-sp-sp_ui_)
- [6. MSSQL 시스템 / 다이어그램 SP](#6-mssql-시스템--다이어그램-sp)

---

## 1. 요약

| 카테고리 | 개수 | 비고 |
|----------|------|------|
| **SP_UI_*** | 829 | 화면별 조회/저장/삭제. 네이밍 `SP_UI_<DOMAIN>_<SCREEN#>_<ACTION>` |
| **SP_COMM_*** | 28 | 공통 유틸 (ID/버전 생성, 날짜 리스트, 위치/아이템 검색, 에러 처리) |
| **SP_<DOMAIN>_*** | ~70 | 도메인 배치/로직 (CM/DP/BF/SA/MP/FP/RP/IM/UT/FO) |
| **FN_G_*** | 9 | Global 함수 (필터, 집계, LPAD, 버킷) |
| **FN_<DOMAIN>_*** | 20+ | 도메인 함수 (DP/MP/BF/CM/RP 버전 생성, BOM 전개, CDF) |
| **FN_SPLIT_*** | 3 | 문자열 Split 테이블 함수 |
| **SP_MSSQL_*** | 3 | MSSQL → PostgreSQL DDL 변환 유틸 |
| **DynamicPivot** | 1 | 동적 피벗 범용 유틸 |
| **MSSQL 시스템** | 4 | sp_helpdiagrams, sp_renamediagram 등 (시스템 기본) |

### SP_UI 하위 도메인

| 접두어 | 개수 | 모듈 매핑 |
|--------|------|----------|
| SP_UI_MP | 197 | Master Planning |
| SP_UI_CM | 181 | Common Master (품목/사이트/창고/비용 화면) |
| SP_UI_DP | 155 | Demand Planning |
| SP_UI_IM | 90 | Inventory Management |
| SP_UI_BF | 51 | Baseline Forecasting |
| SP_UI_SA | 48 | Sales Aggregation |
| SP_UI_SO | 15 | Sales/Stock Order |
| SP_UI_RP | 11 | Replenishment Planning |
| SP_UI_SALES | 4 | Sales RT report |
| SP_UI_DPD | 3 | DP Dimension hierarchy |
| SP_UI_FP | 1 | FP 테스트 |
| SP_UI_FO | 1 | Forecast 변환 |
| SP_UI_TEST | 1 | 테스트 |
| SP_UI_AD / COMM / SAMPLE / UI | 각 1 | 기타 |

## 2. 네이밍 패턴

### 2.1 UI SP 규약
```
SP_UI_<DOMAIN>_<SCREEN_NUMBER>_<ACTION_TYPE>[번호]
SP_UI_<DOMAIN>_<SCREEN_NUMBER>_POP_<ACTION_TYPE>    (팝업)
SP_UI_<DOMAIN>_<SCREEN_NUMBER>_CHART_<ACTION_TYPE>  (차트 데이터)
SP_UI_<DOMAIN>_<SCREEN_NUMBER>_BATCH                (배치)
SP_UI_<DOMAIN>_<FEATURE_NAME>                       (기능 기반)
```

**Action Type**:
| 접미어 | 의미 |
|--------|------|
| `Q1`, `Q2`, ... | Query (SELECT) — 여러 그리드가 있을 때 번호로 구분 |
| `S1`, `S2`, ... | Save (INSERT/UPDATE) |
| `D1`, `D2`, ... | Delete |
| `J`, `J1` | Join / 보조 프로시저 |
| `M1` | Misc / 추가 |
| `BATCH` | 배치 처리 |
| `POP_Q1` · `POP_S1` | 팝업 대화상자용 |
| `CHART_Q1` | 차트 데이터 조회 |

### 2.2 예시 해석

- `SP_UI_MP_08_Q1` — MP 모듈의 8번 화면의 첫 번째 조회 SP
- `SP_UI_DP_17_MEASURE_TP_COMBO` — DP 17번 화면의 측정 유형 콤보박스용 데이터
- `SP_UI_BF_14_CHART_Q2` — BF 14번 화면의 두 번째 차트 데이터
- `SP_UI_IM_SLOW_MOVING_STATE_Q1` — IM Slow Moving 상태 조회 1

## 3. 공통 유틸 (SP_COMM · FN_G · FN_SPLIT)

### SP_COMM_* (28개)

**자동 생성 / 복사**
- `SP_COMM_AUTO_CONDITION`
- `SP_COMM_AUTO_GEN_ID`
- `SP_COMM_AUTO_GEN_MAIN_VER`
- `SP_COMM_AUTO_GEN_SIMUL_VER`
- `SP_COMM_PREFER_COPY`

**기본값 / 초기화**
- `SP_COMM_DEFAULT_DATE`
- `SP_COMM_DEFAULT_VER`
- `SP_COMM_RST_INIT` (결과 초기화)
- `SP_COMM_RST_PRE_SETTING`
- `SP_COMM_RST_POST_SETTING`

**검색 (Search)**
- `SP_COMM_SRH_ACCOUNT_Q` — 계정 검색
- `SP_COMM_SRH_BUCKET` — 버킷 검색
- `SP_COMM_SRH_COMBO_LIST_Q` — 콤보 목록
- `SP_COMM_SRH_DMND_VER` — 수요 버전
- `SP_COMM_SRH_ITEM_Q` — 품목
- `SP_COMM_SRH_LOCAT_Q` · `SP_COMM_SRH_LOCAT_ITEM_Q` · `SP_COMM_SRH_LOCAT_MST_Q` — 위치
- `SP_COMM_SRH_MAIN_VER_Q` — 메인 버전
- `SP_COMM_SRH_PO_VER` — PO 버전
- `SP_COMM_SRH_PROCESS_STEP_Q` — 프로세스 단계
- `SP_COMM_SRH_RES_Q` — 자원
- `SP_COMM_SRH_VER_Q` — 버전

**정보 조회**
- `SP_COMM_ITEM_INFO`
- `SP_COMM_LOCAT_INFO`
- `SP_COMM_DATE_LIST_Q`

**기타**
- `SP_COMM_PEGGING_TYPE`
- `SP_COMM_RAISE_ERR` — 에러 발생 유틸

### FN_G_* (Global Functions, 9개)
- `FN_G_ACCT_FILTER`, `FN_G_ACCT_FILTER_EXTENDS` — 계정 필터
- `FN_G_ITEM_FILTER`, `FN_G_ITEM_FILTER_EXTENDS` — 품목 필터
- `FN_G_AGGR_SQL` — 집계 SQL 조립
- `FN_G_LPAD` — 문자열 LPAD
- `FN_G_BUCKET_CNT` — 버킷 수 계산
- `FN_G_TARGET_DAT` · `FN_G_TARGET_PERIOD` — 대상 날짜/기간

### FN_SPLIT_* (3개)
- `FN_SPLIT` — 기본 문자열 split
- `FN_SPLIT_NSTR_TO_TABLE` — N-String → 테이블 반환
- `FN_SPLIT_NVARCHAR_TO_TABLE` — NVARCHAR → 테이블 반환

### DynamicPivot
- 동적 컬럼 피벗 범용 프로시저. 테이블명, 행/열/값 컬럼 목록, 집계 함수를 받아 런타임 피벗 SQL 생성. 디버깅 플래그 지원.

## 4. 도메인 SP/FN (비UI)

### BF (Baseline Forecasting)
**SP**
- `SP_BF_FORECAST_MODEL_ENSEMBLE` — 모델 앙상블
- `SP_BF_REPLACE_OUTLIER` — 이상치 대체
- `SP_BF_REVERT_REPLACE_OUTLIER` — 이상치 대체 롤백
- `SP_BF_MAKE_DASHBOARD` — 대시보드 생성
- `SP_BF_FACTOR_DEMAND_PLAN_Q1`
- `SP_BF_FACTOR_STOCK_Q1`
- `SP_BF_FACTOR_TARGET_PLAN_Q1`
- `SP_BF_FACTOR_UNIT_PRICE_Q1`

**FN**
- `FN_BF_ACCT_FILTER` · `FN_BF_ITEM_FILTER` — BF 전용 필터
- `FN_BF_NEW_VERSION` · `FN_BF_NEW_VERSION2` — 신규 버전 ID 생성

### CM (Common)
**배치/생성**
- `SP_CM_LOG`
- `SP_CM_MAKE_ACTUAL_BATCH`
- `SP_CM_MAKE_ACTUAL_SHIPMENT`
- `SP_CM_MAKE_ACTUAL_WHSE_STOCK`
- `SP_CM_MAKE_CALENDAR_DATA`
- `SP_CM_MAKE_DASHBOARD_BATCH`

**테스트**
- `SP_CM_SETTING_KYR_TEST` · `SP_CM_SETTING_KYR_TEST_S`

**FN**
- `FN_CM_EXCHANGE_RATE` — 환율 함수

### DP (Demand Planning)
**분석 (Q1)**
- `SP_DP_ANALYSIS_GAP_Q1`
- `SP_DP_ANALYSIS_RATE_Q1`
- `SP_DP_ANALYSIS_SALES_Q1`

**생성**
- `SP_DP_MAKE_ACTUAL_SALES` (및 `_BACKUP` 변형)
- `SP_DP_MAKE_DASHBOARD`
- `SP_DP_MAKE_EX_MEASURE`
- `SP_DP_MAKE_EX_UNIT_PRICE`
- `SP_DP_MAKE_MONTHLY`
- `SP_DP_SET_DEMO_DATE`

**FN**
- `FN_DP_NEW_VERSION`
- `FN_DP_TEMP_ACCT_TREE`
- `FN_DP_TEMP_FIND_ACCOUNT`
- `FN_DP_TEMP_FIND_ITEM`
- `FN_DP_TEMP_ITEM_ACCOUNT_DATE`
- `FN_DP_TEMP_ITEM_TREE`
- `FN_DP_TEMP_THREE_CAL`
- `FN_DP_TEMP_USER_ITEM_ACCOUNT`

### FO (Forecast)
- `SP_FO_TO_FP_DEMAND` — FO → FP 수요 변환
- `SP_FO_MAKE_DEMAND`

### FP (Factory Planning)
- `SP_FP_KEEP_RESULT` — 결과 보관
- `SP_FP_HANDLING_RESULT` — 결과 처리

### IM (Inventory Management)
- `SP_IM_DATA_BATCH`
- `SP_IM_MAKE_DASHBOARD`
- `SP_IM_MAKE_MONTHLY`

**FN**
- `FN_IM_TEMP_FIND_ITEM`

### MP (Master Planning)
- `SP_MP_ADJ_VER_DATA_CREATE` — 조정 버전 데이터 생성
- `SP_MP_DATA_BATCH`
- `SP_MP_HANDLING_RESULT`
- `SP_MP_KEEP_RESULT`

**FN**
- `FN_MP_BOM_BY_DMND_VER` · `FN_MP_BOM_BY_SIMUL_VER` · `FN_MP_BOM_TREE_BY_ITEM` — BOM 전개 함수
- `FN_MP_DEMAND_INFO`
- `FN_MP_NEW_VERSION`
- `FN_MP_VER_INFO`

### RP (Replenishment)
- `SP_RP_ADJ_VER_DATA_CREATE`
- `SP_RP_HANDLING_RESULT`
- `SP_RP_KEEP_RESULT`

**FN**
- `FN_RP_NEW_VERSION`

### SA (Sales Aggregation)
- `SP_SA_DASHBOARD_FIELD_Q`
- `SP_SA_DASHBOARD_STD_Q`
- `SP_SA_MAKE_DASHBOARD`
- `SP_SA_PSI` — PSI (Production Sales Inventory)
- `SP_SA_SALES_EXEC_CONTROL`
- `SP_SA_VER_CREATE`
- `SP_SA_VER_Q1`

### UT (Utility)
- `SP_UT_TABLE_COL_SUBMIT_CHECK`
- `SP_UT_TABLE_COMMENT`
- `SP_UT_TABLE_SPEC_2_MD` — 테이블 스펙 → Markdown 변환

### 기타

**날짜**
- `SP_DATE_TEST_Q` · `SP_DATE_TEST_S`

**GET 함수형**
- `SP_GET_PLAN_SCOPE_LIST`
- `SP_GET_SALES_FACTOR_DATA`

**PostgreSQL 변환**
- `SP_MSSQL_TO_POSTGRESQL_DDL` · `_ALL` · `_FP_ALL` — MSSQL DDL → PostgreSQL 문법 변환 유틸

**테스트/샘플/시뮬레이션**
- `SP_TEST_ERROR`
- `SP_SIMULATE_ITEM_DEMAND`
- `SP_SOME_PROCESS` — 임시/실험 프로시저
- `SP_SYFD_AUTO_GEN_SIMUL_VER`
- `SP_MAKE_SALES_SHIPMENT_ACTUAL_SYNC`
- `SP_PROD_BOM_BATCH`
- `SP_DELETE_NETWORK_DATA`

**기타 FN**
- `FN_BUCKET_END_DATE` — 버킷 종료일
- `FN_NORMAL_CDF` — 정규분포 누적 (통계)
- `fn_diagramobjects` — MSSQL 다이어그램(시스템)

## 5. UI 전용 SP (SP_UI_*)

화면별 CRUD/조회 프로시저. 화면 번호(Screen #)와 액션 유형(Q/S/D/POP/CHART/BATCH) 조합으로 명명됨. 전체 829개로 상세 목록은 원본 DDL 파일에서 확인.

### 5.1 SP_UI_MP (197) — 화면 번호 범위

MP 화면은 번호 **01 ~ 41** 범위에서 구성되며, 각 화면당 평균 4-6개 SP (Q1/Q2/S1/S2/POP_Q1/POP_S1/BATCH 조합).

**대표 화면 예시**:
- `SP_UI_MP_06_*` — 화면 06 (Q1~Q6, S1~S7, POP_Q1~Q5, POP_S1~S2, BATCH)
- `SP_UI_MP_08_*` — 화면 08 (Q1~Q2, S1/S3/S4, POP_Q1~Q5, POP_S1~S2, BATCH)
- `SP_UI_MP_14_*`, `SP_UI_MP_20_*`, `SP_UI_MP_26_*` 등

### 5.2 SP_UI_CM (181)

Common Master 화면: 품목 · 사이트 · 창고 · 위치 · 비용 · BOM · 캘린더 · 출하 LT.

**대표 기능별**:
- `SP_UI_CM_04_BATCH_UPDATE` — 배치 업데이트
- `SP_UI_CM_LOG` — 로그 조회
- 화면 번호 범위: 00 ~ 50+

### 5.3 SP_UI_DP (155)

Demand Planning 화면.

**특수 기능 SP**:
- `SP_UI_DP_AUTO_CREATE_VERSION` — 버전 자동 생성
- `SP_UI_DP_CONBD_MASTER_DEL_GRID` — Control Board 마스터 삭제
- `SP_UI_DP_CONTROLBOARD_VER_INFO` — 버전 정보
- `SP_UI_DP_ENTRY_ARCHIVE` — 수요 입력 아카이브
- `SP_UI_DP_MAKE_HISTORY` — 이력 생성
- `SP_UI_DP_TRANS_TO_SALES_FACTOR` — Sales Factor 변환
- `SP_UI_DP_USER_LEVEL_MAP_D1/D2/D3` — 사용자 레벨 매핑 3-depth 삭제
- `SP_UI_DP_ENTRY_LOG` — 입력 로그
- 화면 번호 범위: 00 ~ 60+

### 5.4 SP_UI_IM (90)

Inventory Management 화면.

**기능 SP 예시**:
- `SP_UI_IM_CLASS_ANLYS_Q3` · `SP_UI_IM_CLASS_ANLYS_S1` — ABC/XYZ 분석
- `SP_UI_IM_OBSOLETE_STATE_Q1~Q3` — 단종 재고 상태
- `SP_UI_IM_SLOW_MOVING_STATE` · `_Q1~Q3` — Slow Moving 상태
- `SP_UI_IM_SALES_HISTORY_CHECK` — 판매 이력 체크
- `SP_UI_IM_TARGET_INV_UPDATE` — 목표 재고 업데이트

### 5.5 SP_UI_BF (51)

Baseline Forecasting 화면.

**기능 SP 예시**:
- `SP_UI_BF_00_POPUP_ACCT_Q1` · `SP_UI_BF_00_POPUP_ITEM_Q1` — 공용 팝업
- `SP_UI_BF_00_VERSION_INFO_Q1` · `SP_UI_BF_00_VERSION_Q1` — 버전 정보
- `SP_UI_BF_CONTROLBOARD_CLOSE` — 컨트롤보드 마감
- `SP_UI_BF_CONTROLBOARD_NEW_VER_INFO` — 신규 버전 정보
- `SP_UI_BF_DATA_VALIDATION` — 데이터 검증
- `SP_UI_BF_SALES_REPORT_Q1/Q2` — 판매 리포트
- 화면 번호: 05, 06, 07, 13, 14 (CHART 포함), 51-58

### 5.6 SP_UI_SA (48)

Sales Aggregation / Analysis.

**기능 SP 예시**:
- `SP_UI_SA_BF_BEST_MODEL` — BF 베스트 모델 비교
- `SP_UI_SA_DP_ITEMGRP` — DP 품목 그룹
- `SP_UI_SA_INV_POTENTIAL_LOSS` — 잠재 손실 재고
- `SP_UI_SA_ITEMGRP_MEET_TARGET` — 품목 그룹 타겟 달성 여부
- `SP_UI_SA_SALES_DP` — Sales DP 연계
- `SP_UI_SALES_RT_01 ~ 04` — 판매 RT 리포트 4종

### 5.7 SP_UI_SO (15) — Stock/Sales Order

- `SP_UI_SO_ADJUST_CONFIG` · `SP_UI_SO_ADJUST_D1` · `SP_UI_SO_ADJUST_DMD_TP`
- `SP_UI_SO_DEMAND_CLASS`
- `SP_UI_SO_TRANS_CONFIG`
- `SP_UI_SO_URGENT_TP`

### 5.8 SP_UI_RP (11)

Replenishment Planning 화면.

### 5.9 SP_UI_DPD (3)

DP 차원 계층 빌드:
- `SP_UI_DPD_MAKE_HIER_ITEM` — 품목 계층 생성
- `SP_UI_DPD_MAKE_HIER_SALES` — 판매 계층 생성
- `SP_UI_DPD_MAKE_HIER_USER` — 사용자 계층 생성

### 5.10 기타 단일 SP

- `SP_UI_AD_GRID_DEFAULT_PREF_COPY` — Admin 그리드 기본 설정 복사
- `SP_UI_COMM_DATA_Q` — 공통 데이터
- `SP_UI_FO_CONVERT_CUSTOM` — Forecast 커스텀 변환
- `SP_UI_FP_STEP_TEST` — FP 스텝 테스트
- `SP_UI_SAMPLE_PROC_Q` — 샘플
- `SP_UI_TEST` · `SP_UI_TEST_S1` — 테스트
- `SP_UI_UI_LINK_S1` — UI Link 저장

## 6. MSSQL 시스템 / 다이어그램 SP

MSSQL 이 SSMS 다이어그램 기능을 위해 자동 생성하는 시스템 SP — **수정 금지** (MS 제공).

- `sp_alterdiagram`
- `sp_creatediagram`
- `sp_dropdiagram`
- `sp_helpdiagrams`
- `sp_helpdiagramdefinition`
- `sp_renamediagram`
- `sp_upgraddiagrams`
- `fn_diagramobjects`

---

## 부록: 활용 가이드

### SP 호출 찾는 법
1. 화면 ID 확인 (예: MP 화면 06)
2. `SP_UI_MP_06_` 로 시작하는 SP 검색
3. 그리드 번호 또는 팝업 여부로 `_Q1`, `_POP_Q1`, `_BATCH` 선택

### 버전 관리 패턴
버전 관련 SP/FN 은 도메인별로 유사한 구조:
- `FN_<DOMAIN>_NEW_VERSION` — 신규 버전 ID 생성
- `SP_<DOMAIN>_ADJ_VER_DATA_CREATE` — 조정 버전 데이터 생성
- `SP_<DOMAIN>_KEEP_RESULT` — 결과 보관
- `SP_<DOMAIN>_HANDLING_RESULT` — 결과 처리
- `SP_COMM_AUTO_GEN_SIMUL_VER` — 공통 시뮬레이션 버전 생성

### 결과 생명주기 (버전 관리 관점)

```
1. SP_COMM_AUTO_GEN_SIMUL_VER  → 새 버전 ID 생성
2. SP_<DOMAIN>_ADJ_VER_DATA_CREATE  → 조정 버전용 데이터 복사
3. 엔진 실행 (TB_EN_* 에 결과 기록)
4. SP_<DOMAIN>_HANDLING_RESULT  → 결과 가공/검증
5. SP_<DOMAIN>_KEEP_RESULT  → TB_RT_* 에 결과 아카이브
6. SP_<DOMAIN>_MAKE_DASHBOARD  → 대시보드 집계 생성
```

### 대시보드 빌드 SP
- `SP_CM_MAKE_DASHBOARD_BATCH`
- `SP_BF_MAKE_DASHBOARD`
- `SP_DP_MAKE_DASHBOARD`
- `SP_IM_MAKE_DASHBOARD`
- `SP_SA_MAKE_DASHBOARD`

### 오류 처리 공통 패턴
`SP_COMM_RAISE_ERR` 가 모든 모듈에서 일관된 에러 메시지 발생에 사용됨.

---

## 참고 — 원본 파일

| 항목 | 경로 |
|------|------|
| SP DDL 원본 | `d:\D_Dev\T3Composer\T3Series_20260422_SP_DDL.sql` (4.7MB) |
| 전체 SP/FN 이름 | `./_tmp_sps.txt` (분석 임시, 작업 완료 후 삭제 가능) |
| SP_UI_* 화면 매핑 | **검증 필요** — wingui 프론트엔드 코드의 화면 ID 와 SP 번호 대조 분석 권장 |
