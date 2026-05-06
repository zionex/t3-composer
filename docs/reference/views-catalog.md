# T3Series View 카탈로그

> 총 **18개 View**. 스냅샷: `T3Series_20260422_View_DDL.sql` (40KB).

## 목차 요약

| # | View | 카테고리 | 주 소스 테이블 | 설명 |
|---|------|---------|---------------|------|
| 1 | `VW_BOR_INFO` | MP | TB_MP_ITEM_RES_PREFER_MST · TB_MP_ITEM_RES_CAPA_MST | 품목-자원 선호도 + 용량 마스터 조인 |
| 2 | `VW_DEMAND_PLAN` | DP | TB_DP_ENTRY_HISTORY · TB_CM_ITEM_MST · TB_DP_ACCOUNT_MST | 수요 계획(월별) + 계정/품목 계층 |
| 3 | `VW_EXCHANGE_RATE` | DP | TB_DP_EXCHANGE_RATE · TB_CM_CALENDAR | 환율의 기간별 구간(LEAD 활용) |
| 4 | `VW_FP_BOM_TREE` | FP | TB_FP_BOM_ROUTING · TB_FP_INVENTORY · TB_FP_ITEM · TB_FP_ROUTE | 재귀 CTE 로 BOM 트리 평탄화 (루트→리프 경로) |
| 5 | `VW_FP_RES_PROD_PLAN` | FP | TB_FP_ACTIVITY · TB_FP_WO_PLAN | 자원별 생산 계획 + 지연 여부 |
| 6 | `VW_INTRANSIT_STOCK` | CM/IM | TB_CM_INTRANSIT_STOCK_MST/_QTY · TB_IM_STOCK_QTY_TYPE | 최신 Cutoff 기준 이동 중 재고 |
| 7 | `VW_INVENTORY_PLAN_CONFIRMED` | IM | TB_IM_TARGET_INV_POLICY · TB_IM_TARGET_INV_VERSION · TB_CM_SITE_ITEM | 확정 재고 정책: 안전재고·목표재고·ROP·EOQ + 결품/과잉 리스크 |
| 8 | `VW_LOCAT_INFO` | CM | TB_CM_LOC_MGMT/_DTL/_MST · TB_AD_COMN_CODE | 위치(Location) 3-Level 조인 |
| 9 | `VW_LOCAT_ITEM_INFO` | CM | TB_CM_SITE_ITEM + Loc 3-Level + Item + UOM | **코드 내 가장 재사용 높은 뷰**: Plan Scope × 위치 × 품목 결합 |
| 10 | `VW_MASTER_PLAN_ORD_TRACKING_LATEST` | MP/RT | TB_RT_DMND_ORD_TRACKING_MST · TB_CM_CONBD_MAIN_VER_* | 최신 MP 시뮬레이션 버전의 수요-공급 충족률(RTF) |
| 11 | `[dbo].[VW_PEGGING_TYPE]` | CM | TB_AD_COMN_GRP · TB_AD_COMN_CODE · TB_CM_CHANNEL_TYPE | Pegging 유형 코드(수요유형/수요분류/채널) 통합 |
| 12 | `VW_OBSOLETE_STOCK` | IM | TB_CM_WAREHOUSE_STOCK_MST/_QTY · TB_CM_ITEM_MST(EOS 컬럼) | **단종(EOS) 기한 지난 창고 재고** 식별 |
| 13 | `VW_REPLENISHMENT_PLAN_CONFIRMED` | RP | TB_RT_REPLSH_ORDER · TB_CM_CONBD_MAIN_VER_* · TB_CM_VEHICLE · TB_CM_SHIP_LT_MST | 확정 RP 시뮬레이션의 보충 주문 + 출발/도착 위치 + 운송비 |
| 14 | `[dbo].[VW_RESULT_DATA_SIZE]` | 모니터링 | sys.tables · sys.partitions · sys.columns | **TB_RT_* 테이블 크기 추정 (행수 × 평균 행 사이즈)** — 운영 모니터링용 |
| 15 | `VW_SALES_PERFORMANCE` | SA | TB_CM_ACTUAL_SALES · TB_CM_ITEM_MST · TB_DP_ACCOUNT_MST | 실적 판매(수량+금액) + 판매 팀/채널 |
| 16 | `VW_SHIPMENT_PERFORMANCE` | CM | TB_CM_ACTUAL_SHIPMENT · Loc(From/To) · TB_DP_ACCOUNT_MST · TB_CM_VEHICLE | 실제 출하 실적 + 출발/도착 위치 + 운송 방식 |
| 17 | `VW_SLOWMOVING_STOCK` | IM | TB_CM_SITE_ITEM · TB_CM_WAREHOUSE_STOCK_MST/_QTY | **Slow Moving 재고** — 입고일부터 경과일(DATEDIFF) 기반 |
| 18 | `VW_WAREHOUSE_STOCK` | CM | TB_CM_WAREHOUSE_STOCK_MST/_QTY · TB_IM_STOCK_QTY_TYPE | 창고 재고 (최신 Cutoff) + 상태/사용 가능 여부 |

---

## 상세

### 1. VW_BOR_INFO
- **카테고리**: Master Planning
- **목적**: 품목-자원 선호도(`TB_MP_ITEM_RES_PREFER_MST`)와 용량 마스터(`TB_MP_ITEM_RES_CAPA_MST`)를 조인해 **품목별 자원 BOR 정보** 제공
- **주요 컬럼**: TACT/QUEUE/SETUP/PROCESS/WAIT/MOVE TIME, MIN/MAX/MULTP LOTSIZE, ALTERNATE_RESOURCE_POLICY, BASE_ALLOC_PRIORT
- **필터**: `ACTV_YN = 'Y'`
- **NOLOCK 힌트** 사용 (대부분 뷰에 공통)

### 2. VW_DEMAND_PLAN
- **카테고리**: Demand Planning
- **목적**: DP 월별 계획(`TB_DP_ENTRY_HISTORY`)과 품목·계정·판매 계층·담당자를 결합
- **특이점**: `TB_DPD_ACCOUNT_HIERACHY2` (LV_TP_CD='S')와 `TB_DPD_ITEM_HIERACHY2` (LV_TP_CD='I') 를 활용해 **LVL01~04 계정 계층 + LVL01~03 품목 계층** 을 컬럼 펼침
- **하드코딩 필터**: `PLAN_SCOPE = 'DEFAULT'`, 계획 타입은 `DP_PLAN_MONTHLY` 코드로 조회

### 3. VW_EXCHANGE_RATE
- **카테고리**: DP
- **목적**: 환율 이력을 **시작일/종료일 구간** 형태로 변환 (LEAD 함수 활용)
- **범위**: 현재 연도 ±3년의 일별 캘린더(`TB_CM_CALENDAR`) 범위에서 환율 매핑
- **알고리즘**: `DP_EXCHANGE` CTE에서 다음 변경일자 바로 전까지를 한 구간으로 만들고, Calendar 와 BETWEEN 조인

### 4. VW_FP_BOM_TREE
- **카테고리**: FP
- **목적**: BOM 다단계 전개 (재귀 CTE)
- **루트**: 완제품(`ITEM_CLASS_CD = 'P'`) 에서 시작
- **출력**:
  - LVL (레벨)
  - PARENT/CHILD의 INVENTORY_CD · ITEM_CD · ITEM_CLASS_CD
  - PRODUCING_RATE, CONSUMPTION_RATE, TOTAL_CONSUMPTION_RATE (누적)
  - **BOM_PATH** — 트리 경로를 문자열로 연결 (`A<-(rate)B<-(rate)C`)
- **ID 생성**: `REPLACE(NEWID(), '-', '')` 로 매 행 고유 ID 부여

### 5. VW_FP_RES_PROD_PLAN
- **카테고리**: FP
- **목적**: FP 활동(`TB_FP_ACTIVITY`)과 작업 지시 계획(`TB_FP_WO_PLAN`)을 조인하여 **자원별 생산 계획** 출력
- **핵심 컬럼**: VERSION_CD, PLANT_CD, STAGE_CD, RESOURCE_CD, ROUTE_CD, ITEM_CD, COMPLETED_TS, **LATE_YN**
- **조인 키**: PLAN_SCOPE + VERSION + PLANT + STAGE + WO_CD + 완료일시

### 6. VW_INTRANSIT_STOCK
- **카테고리**: CM/IM
- **목적**: 이동 중 재고(In-Transit) 조회
- **특징**:
  - `TB_CM_INTRANSIT_STOCK_MST` + QTY 조인
  - From/To 위치 정보를 `TB_CM_SITE_ITEM` + Loc 계층 **서브쿼리로 2회** 조인
  - **최신 CUTOFF_DATE** 레코드만 표시
- **재고 상태**: `TB_IM_STOCK_QTY_TYPE` + `TB_AD_LANG_PACK(lang_cd='ko')` 로 한글 상태명 변환

### 7. VW_INVENTORY_PLAN_CONFIRMED
- **카테고리**: Inventory Management
- **목적**: 확정된 목표 재고 정책의 실행 상태 + **리스크 플래그**
- **출력**:
  - 기본 재고: WAREHOUSE_QTY, INTRANSIT_QTY
  - 안전재고(SFST), 목표재고, 목표일수, 실재일수, 재고회전율
  - **STOCK_OUT_RISK_FLAG** (결품 리스크) — `(TARGET_DAYS - INV_DAYS) > 기준값`
  - **SURPLUS_RISK_FLAG** (과잉 리스크) — `(INV_DAYS - TARGET_DAYS) > 기준값`
  - 운영재고/순환재고 (수량 + 금액)
  - 수요율, 수요/공급 변동성(STDDEV), SUPPLY_LEADTIME
  - **ROP** (재주문점), **EOQ** (경제적 주문량)
- **기준값 소스**: `TB_IM_INV_PERIOD` (CATAGY_VAL = 'STOCK_OUT' / 'SURPLUS')
- **필터**: 최신 **확정** 버전 (`SNRIO_VER_CD = MAX WHERE CONFRM_YN='Y'`)

### 8. VW_LOCAT_INFO
- **카테고리**: CM
- **목적**: 위치 3-Level(MGMT/DTL/MST) 기본 조인
- **간단한 유틸리티 뷰**

### 9. VW_LOCAT_ITEM_INFO
- **카테고리**: CM
- **중요도**: ⭐ 프로젝트에서 가장 재사용도가 높은 뷰 중 하나
- **목적**: Site Item(`TB_CM_SITE_ITEM`) + 위치 3-Level + Item 마스터 + Item Type + Level 관리 + UOM 을 한 번에 평탄화
- **사용처**: 다른 여러 뷰에서 직접 조인하거나 유사 서브쿼리를 중복 사용

### 10. VW_MASTER_PLAN_ORD_TRACKING_LATEST
- **카테고리**: MP / Result Tracking
- **주석**: `/* 공급 계획의 수요 공급 충족률(RTF)을 보여줘 */`
- **목적**: 최신 확정된 MP 시뮬레이션 버전의 수요-주문 추적
- **RTF 계산**: `ROUND((DELIVY_QTY / DMND_QTY) * 100, 1)`
- **주요 컬럼**: CHANNEL · SALES_LV · ACCOUNT · DEMAND_TYPE · DEMAND_ID · DUE_DATE · ON_TIME_QTY · DELIVERY_QTY · LATE_QTY · SHORTAGE_QTY · NETTING_QTY · PROBLEM_DESCRIP
- **최신 버전 선택**: `TB_CM_CONBD_MAIN_VER_MST` 의 MODULE_ID='MP' + 최신 CREATE_DTTM TOP 1

### 11. [dbo].[VW_PEGGING_TYPE]
- **카테고리**: CM (코드 통합)
- **목적**: Pegging(수요-공급 연결) 분류 코드 통합 뷰
- **소스**:
  - `TB_AD_COMN_GRP` + `TB_AD_COMN_CODE` 에서 `DEMAND_TYPE`, `DEMAND_CLASS` 그룹
  - `TB_CM_CHANNEL_TYPE` 에서 'Channel Type' 추가
- **UNION ALL** 로 3가지 분류를 한 뷰에 노출

### 12. VW_OBSOLETE_STOCK
- **카테고리**: Inventory Management
- **목적**: **단종(End Of Service) 기한이 지난 창고 재고** 식별
- **필터**: `GETDATE() > ISNULL(D.EOS, GETDATE())` — EOS 미지정이면 제외
- **최신 CUTOFF** 기준
- **출력**: 위치, 품목, RTS(단종시작일), EOS(단종일), 수령일, 사용가능일, 만료일, LOT_NO, 수량, 금액

### 13. VW_REPLENISHMENT_PLAN_CONFIRMED
- **카테고리**: Replenishment Planning
- **주석**: `/* 보충 예정 정보를 알려줘 */`
- **목적**: 확정된 RP(Replenishment Plan) 시뮬레이션의 보충 주문 정보
- **출력**: RP_VERSION, 출발/도착 위치, 품목, 운송 유형(VEHICLE), 운송 리드타임, 운송비 UTPIC + CURRENCY, 주문일, 요청 도착일
- **버전 선택**: `CONFRM_YN='Y'` + MODULE='RP' 인 최대 SIMUL_VER_ID

### 14. [dbo].[VW_RESULT_DATA_SIZE]
- **카테고리**: 운영 모니터링
- **목적**: `TB_RT_*` 테이블의 **용량 추정**
- **계산**:
  - `row_count` CTE: `sys.partitions` 에서 행 수
  - `row_size` CTE: `sys.columns.max_length` 합
  - `table_size`: 행수 × 행 사이즈 = 바이트(KB/MB)
  - 비율 및 누적 DB 크기
- **활용**: SCM 결과 데이터 볼륨 모니터링 대시보드용

### 15. VW_SALES_PERFORMANCE
- **카테고리**: Sales (Performance)
- **목적**: 실적 판매 + 품목 그룹/판매 팀/채널 결합
- **필터**: `QTY > 0 AND AMT > 0`

### 16. VW_SHIPMENT_PERFORMANCE
- **카테고리**: CM (Performance)
- **목적**: 실제 출하(`TB_CM_ACTUAL_SHIPMENT`) 결과
- **주요 컬럼**: FROM/TO 위치, 계정, 운송 방식, BOD_LEADTIME, ETD/ETA/**ATD**/**ATA** (계획 vs 실제), 출하 수량/금액

### 17. VW_SLOWMOVING_STOCK
- **카테고리**: Inventory Management
- **목적**: Slow Moving 재고 식별 (수령일부터의 경과일)
- **핵심 계산**: `DATEDIFF(DAY, A.RECEIPT_DATE, GETDATE()) AS SLOW_MOVING_DAYS`
- **필터**: `CUTOFF_DATE = MAX(CUTOFF_DATE)` (최신)

### 18. VW_WAREHOUSE_STOCK
- **카테고리**: CM
- **목적**: 창고 재고 현황 + 상태 + 액션 내역
- **출력**: 위치, 품목, 수령/사용/만료일, LOT_NO, 상태 코드+한글명, 사용가능 여부, 수량·금액, **ACTION_DATE/REASON**(창고 이동 사유)

---

## 관찰 사항

### 공통 패턴
1. **WITH (NOLOCK)** 을 모든 테이블 참조에 명시 — 대시보드 조회 시 lock escalation 회피 목적
2. **CUTOFF_DATE 패턴** — 재고 관련 뷰는 일관적으로 `MAX(CUTOFF_DATE)` 기반 최신 스냅샷만 조회
3. **Location × SiteItem × Item × UOM 평탄화** — 6개 뷰가 동일한 서브쿼리를 중복 내포 → 성능/유지보수 관점에서 **`VW_LOCAT_ITEM_INFO` 를 재사용**할 수 있도록 리팩토링 여지 있음
4. **CREATE OR ALTER** 문법 사용 — SQL Server 2016+ 에서 뷰 재배포 간소화
5. **대부분 PLAN_SCOPE = 'DEFAULT'** 하드코딩 존재 — 멀티 스코프 확장 시 주의

### 네이밍
- 대부분 `VW_<UPPER_SNAKE>` 규약
- 2개만 `[dbo].[VW_*]` 스키마 접두어 포함 — `VW_PEGGING_TYPE`, `VW_RESULT_DATA_SIZE`

### 모듈별 뷰 사용처 예상

| 모듈 | 조회 대상 뷰 |
|------|-------------|
| wingui 대시보드 | VW_SALES_PERFORMANCE, VW_SHIPMENT_PERFORMANCE, VW_WAREHOUSE_STOCK, VW_INTRANSIT_STOCK, VW_SLOWMOVING_STOCK, VW_OBSOLETE_STOCK, VW_INVENTORY_PLAN_CONFIRMED |
| FP (UI/엔진) | VW_FP_BOM_TREE, VW_FP_RES_PROD_PLAN |
| MP (UI) | VW_BOR_INFO, VW_MASTER_PLAN_ORD_TRACKING_LATEST |
| DP (UI) | VW_DEMAND_PLAN, VW_EXCHANGE_RATE |
| RP (UI) | VW_REPLENISHMENT_PLAN_CONFIRMED |
| 공통/마스터 | VW_LOCAT_INFO, VW_LOCAT_ITEM_INFO, VW_PEGGING_TYPE |
| 운영 모니터링 | VW_RESULT_DATA_SIZE |
