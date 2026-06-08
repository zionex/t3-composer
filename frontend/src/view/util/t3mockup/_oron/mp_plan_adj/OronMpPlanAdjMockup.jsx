import React from 'react';
import MockShell from '../../_shared/MockShell';
import MockGridScaffold from '../_shared/MockGridScaffold';

// ORON — MP 생산계획 편성/수정/조회/비교 (6개 화면)
//  - UI_MP_ORN_PLAN_RST_ADJ    완제품 생산계획 편성/수정 (LINE×ITEM × SCM/FAC/DIFF_BOX × 동적 DATE 크로스탭)
//  - UI_MP_ORN_HALB_RST_ADJ    반제품 생산계획 편성/수정 (BATCH_QTY/PLT_QTY/MIN/MUL_LOT_SIZE/BOH_KG)
//  - UI_MP_ORN_PLAN_RST_SRC    완제품 생산계획 조회 (read-only)
//  - UI_MP_ORN_HALB_RST_SRC    반제품 생산계획 조회 (read-only — MON/TUE/.../SUN DAY_KG/NIGHT_KG)
//  - UI_MP_ORN_PROD_AVAIL      공급가용결과 (PROD_REQ_QTY / SHORT_QTY / SHORT_HOURS / WK52)
//  - UI_MP_ORN_SIMUL_COMPARE   버전별 생산계획 비교 (3-tier merge: PLANT/LINE/ITEM × MEASURE × DATE)

const DATE_COLS = ['2026-W23','2026-W24','2026-W25','2026-W26','2026-W27'];

const TABS = [
  {
    key: 'fertAdj', label: '완제품 편성/수정', menu: 'UI_MP_ORN_PLAN_RST_ADJ', cnt: 2841,
    src: 'view/oron/factoryplan/planresult/ornmpplanrstadj/OrnMpPlanRstAdj.jsx',
    search: [
      { key: 'planScope', label: 'PLAN_SCOPE', type: 'select',      width: 130, options: ['ORN_MP'] },
      { key: 'verCd',     label: 'VERSION',    type: 'select',      width: 150, options: ['MAIN_V0006','SIM_2026Q3'] },
      { key: 'plantCd',   label: 'FP_PLANT',   type: 'multiSelect', width: 150 },
      { key: 'lineCd',    label: 'FP_LINE',    type: 'multiSelect', width: 150 },
      { key: 'itemVal',   label: 'PK_ITEM_VAL',type: 'text',        width: 170 },
    ],
    buttons: ['save', 'excel'],
    cols: [
      { name: 'LINE_CD',  h: 'LINE_CD',  w:  70, a: 'center' },
      { name: 'LINE_NM',  h: 'LINE_NM',  w: 130, a: 'left'   },
      { name: 'ITEM_CD',  h: 'PK_ITEM_CD',w: 90, a: 'center' },
      { name: 'ITEM_NM',  h: 'PK_ITEM_NM',w: 220, a: 'left'  },
      { name: 'FLAV_NM',  h: 'FLAV_NM',  w:  80, a: 'center' },
      { name: 'MEASURE',  h: 'MEASURE',  w:  90, a: 'center' },
      ...DATE_COLS.map((d) => ({ name: d, h: d, w: 90, a: 'right', edit: true })),
    ],
    rows: [
      { LINE_CD:'L01', LINE_NM:'L01 충전 라인 1', ITEM_CD:'F01001', ITEM_NM:'완제품-FERT 샘플 1', FLAV_NM:'기본',   MEASURE:'SCM_BOX',  '2026-W23':  200, '2026-W24':  200, '2026-W25':  220, '2026-W26':  220, '2026-W27':  240 },
      { LINE_CD:'L01', LINE_NM:'L01 충전 라인 1', ITEM_CD:'F01001', ITEM_NM:'완제품-FERT 샘플 1', FLAV_NM:'기본',   MEASURE:'FAC_BOX',  '2026-W23':  210, '2026-W24':  210, '2026-W25':  210, '2026-W26':  230, '2026-W27':  240 },
      { LINE_CD:'L01', LINE_NM:'L01 충전 라인 1', ITEM_CD:'F01001', ITEM_NM:'완제품-FERT 샘플 1', FLAV_NM:'기본',   MEASURE:'DIFF_BOX', '2026-W23':   10, '2026-W24':   10, '2026-W25':  -10, '2026-W26':   10, '2026-W27':    0 },
      { LINE_CD:'L01', LINE_NM:'L01 충전 라인 1', ITEM_CD:'F01002', ITEM_NM:'완제품-FERT 샘플 2', FLAV_NM:'레몬',   MEASURE:'SCM_BOX',  '2026-W23':  130, '2026-W24':  130, '2026-W25':  140, '2026-W26':  140, '2026-W27':  150 },
      { LINE_CD:'L01', LINE_NM:'L01 충전 라인 1', ITEM_CD:'F01002', ITEM_NM:'완제품-FERT 샘플 2', FLAV_NM:'레몬',   MEASURE:'FAC_BOX',  '2026-W23':  135, '2026-W24':  135, '2026-W25':  135, '2026-W26':  155, '2026-W27':  150 },
      { LINE_CD:'L02', LINE_NM:'L02 충전 라인 2', ITEM_CD:'F01003', ITEM_NM:'완제품-FERT 샘플 3', FLAV_NM:'기본',   MEASURE:'SCM_BOX',  '2026-W23':  500, '2026-W24':  500, '2026-W25':  500, '2026-W26':  550, '2026-W27':  550 },
      { LINE_CD:'L02', LINE_NM:'L02 충전 라인 2', ITEM_CD:'F01003', ITEM_NM:'완제품-FERT 샘플 3', FLAV_NM:'기본',   MEASURE:'FAC_BOX',  '2026-W23':  500, '2026-W24':  500, '2026-W25':  490, '2026-W26':  550, '2026-W27':  550 },
    ],
  },
  {
    key: 'halbAdj', label: '반제품 편성/수정', menu: 'UI_MP_ORN_HALB_RST_ADJ', cnt: 412,
    src: 'view/oron/factoryplan/planresult/ornmphalbrstadj/OrnMpHalbRstAdj.jsx',
    search: [
      { key: 'planScope', label: 'PLAN_SCOPE', type: 'select',      width: 130, options: ['ORN_MP'] },
      { key: 'verCd',     label: 'VERSION',    type: 'select',      width: 150, options: ['MAIN_V0006'] },
      { key: 'plantCd',   label: 'FP_PLANT',   type: 'multiSelect', width: 150 },
      { key: 'lineCd',    label: 'FP_LINE',    type: 'multiSelect', width: 150 },
      { key: 'itemVal',   label: 'PK_HALB',    type: 'text',        width: 170 },
    ],
    buttons: ['save', 'excel'],
    cols: [
      { name: 'PLANT_NM',     h: 'PLANT_NM',     w: 100, a: 'center' },
      { name: 'LINE_NM',      h: 'LINE_NM',      w: 130, a: 'left'   },
      { name: 'ITEM_CD',      h: 'HALB_CD',      w:  90, a: 'center' },
      { name: 'ITEM_NM',      h: 'HALB_NM',      w: 200, a: 'left'   },
      { name: 'BATCH_QTY',    h: 'BATCH_QTY',    w:  90, a: 'right'  },
      { name: 'PLT_QTY',      h: 'PLT_QTY',      w:  80, a: 'right'  },
      { name: 'PROD_LT',      h: 'PROD_LT',      w:  70, a: 'right'  },
      { name: 'MIN_LOT_SIZE', h: 'MIN_LOT_SIZE', w:  90, a: 'right'  },
      { name: 'MUL_LOT_SIZE', h: 'MUL_LOT_SIZE', w:  90, a: 'right'  },
      { name: 'BOH_KG',       h: 'BOH (KG)',     w:  90, a: 'right'  },
      ...DATE_COLS.map((d) => ({ name: d, h: d, w: 90, a: 'right', edit: true })),
    ],
    rows: [
      { PLANT_NM:'P1 공장', LINE_NM:'L01 충전 라인 1', ITEM_CD:'H10001', ITEM_NM:'반제품-HALB 시럽 베이스 1', BATCH_QTY:500.000, PLT_QTY:1000.0, PROD_LT:1, MIN_LOT_SIZE:500.0,  MUL_LOT_SIZE:500.0,  BOH_KG: 2000.00, '2026-W23':1500.0, '2026-W24':1500.0, '2026-W25':1500.0, '2026-W26':2000.0, '2026-W27':2000.0 },
      { PLANT_NM:'P1 공장', LINE_NM:'L01 충전 라인 1', ITEM_CD:'H10002', ITEM_NM:'반제품-HALB 시럽 베이스 2', BATCH_QTY:400.000, PLT_QTY: 800.0, PROD_LT:1, MIN_LOT_SIZE:400.0,  MUL_LOT_SIZE:400.0,  BOH_KG: 1200.00, '2026-W23':1200.0, '2026-W24':1200.0, '2026-W25':1200.0, '2026-W26':1600.0, '2026-W27':1600.0 },
      { PLANT_NM:'P2 공장', LINE_NM:'L21 압출 라인',   ITEM_CD:'H20001', ITEM_NM:'반제품-HALB 반죽 1',        BATCH_QTY:250.000, PLT_QTY: 500.0, PROD_LT:2, MIN_LOT_SIZE:250.0,  MUL_LOT_SIZE:250.0,  BOH_KG:  500.00, '2026-W23': 750.0, '2026-W24': 750.0, '2026-W25': 750.0, '2026-W26':1000.0, '2026-W27':1000.0 },
      { PLANT_NM:'P2 공장', LINE_NM:'L21 압출 라인',   ITEM_CD:'H20002', ITEM_NM:'반제품-HALB 반죽 2',        BATCH_QTY:200.000, PLT_QTY: 400.0, PROD_LT:2, MIN_LOT_SIZE:200.0,  MUL_LOT_SIZE:200.0,  BOH_KG:  400.00, '2026-W23': 600.0, '2026-W24': 600.0, '2026-W25': 600.0, '2026-W26': 800.0, '2026-W27': 800.0 },
    ],
  },
  {
    key: 'fertSrc', label: '완제품 조회', menu: 'UI_MP_ORN_PLAN_RST_SRC', cnt: 2841,
    src: 'view/oron/factoryplan/planresult/ornmpplanrstsrc/OrnMpPlanRstSrc.jsx',
    search: [
      { key: 'planScope', label: 'PLAN_SCOPE', type: 'select',      width: 130, options: ['ORN_MP'] },
      { key: 'verCd',     label: 'VERSION',    type: 'select',      width: 150, options: ['MAIN_V0006'] },
      { key: 'plantCd',   label: 'FP_PLANT',   type: 'multiSelect', width: 150 },
      { key: 'lineCd',    label: 'FP_LINE',    type: 'multiSelect', width: 150 },
      { key: 'itemVal',   label: 'PK_ITEM_VAL',type: 'text',        width: 170 },
    ],
    buttons: ['excel'],
    cols: [
      { name: 'LINE_NM', h: 'LINE_NM', w: 130, a: 'left'   },
      { name: 'ITEM_CD', h: 'ITEM_CD', w:  90, a: 'center' },
      { name: 'ITEM_NM', h: 'ITEM_NM', w: 220, a: 'left'   },
      { name: 'FLAV',    h: 'FLAV_NM', w:  80, a: 'center' },
      ...DATE_COLS.map((d) => ({ name: d, h: d, w: 90, a: 'right' })),
    ],
    rows: [
      { LINE_NM:'L01 충전 라인 1', ITEM_CD:'F01001', ITEM_NM:'완제품-FERT 샘플 1', FLAV:'기본',  '2026-W23':210, '2026-W24':210, '2026-W25':210, '2026-W26':230, '2026-W27':240 },
      { LINE_NM:'L01 충전 라인 1', ITEM_CD:'F01002', ITEM_NM:'완제품-FERT 샘플 2', FLAV:'레몬',  '2026-W23':135, '2026-W24':135, '2026-W25':135, '2026-W26':155, '2026-W27':150 },
      { LINE_NM:'L02 충전 라인 2', ITEM_CD:'F01003', ITEM_NM:'완제품-FERT 샘플 3', FLAV:'기본',  '2026-W23':500, '2026-W24':500, '2026-W25':490, '2026-W26':550, '2026-W27':550 },
    ],
  },
  {
    key: 'halbSrc', label: '반제품 조회', menu: 'UI_MP_ORN_HALB_RST_SRC', cnt: 412,
    src: 'view/oron/factoryplan/planresult/ornmphalbrstsrc/OrnMpHalbRstSrc.jsx',
    search: [
      { key: 'planScope', label: 'PLAN_SCOPE', type: 'select',      width: 130, options: ['ORN_MP'] },
      { key: 'verCd',     label: 'VERSION',    type: 'select',      width: 150, options: ['MAIN_V0006'] },
      { key: 'plantCd',   label: 'FP_PLANT',   type: 'multiSelect', width: 150 },
      { key: 'lineCd',    label: 'FP_LINE',    type: 'multiSelect', width: 150 },
      { key: 'fromDt',    label: 'FROM_DT',    type: 'date',        width: 140 },
    ],
    buttons: ['excel'],
    cols: [
      { name: 'PART_CD',  h: 'MP_PART_CD',w:  70, a: 'center' },
      { name: 'PART_NM',  h: 'MP_PART_NM',w: 100, a: 'left'   },
      { name: 'LINE_CD',  h: 'FP_LINE',   w:  70, a: 'center' },
      { name: 'LINE_NM',  h: 'LINE_NM',   w: 100, a: 'left'   },
      { name: 'ITEM_CD',  h: 'HALB_CD',   w:  90, a: 'center' },
      { name: 'ITEM_NM',  h: 'HALB_NM',   w: 180, a: 'left'   },
      { name: 'PLAN_FLAG',h: 'PLAN_FLAG', w:  80, a: 'center' },
      { name: 'BATCH_KG', h: 'BATCH_KG',  w:  90, a: 'right'  },
      { name: 'PLT_QTY',  h: 'PLT_QTY',   w:  80, a: 'right'  },
      { name: 'MON_DAY',  h: 'MON DAY',   w:  80, a: 'right'  },
      { name: 'MON_NGT',  h: 'MON NGT',   w:  80, a: 'right'  },
      { name: 'TUE_DAY',  h: 'TUE DAY',   w:  80, a: 'right'  },
      { name: 'TUE_NGT',  h: 'TUE NGT',   w:  80, a: 'right'  },
    ],
    rows: [
      { PART_CD:'A1', PART_NM:'A1 동', LINE_CD:'L01', LINE_NM:'L01', ITEM_CD:'H10001', ITEM_NM:'반제품-HALB 시럽 베이스 1', PLAN_FLAG:'ADJ', BATCH_KG:500.0, PLT_QTY:1000.0, MON_DAY:500.0, MON_NGT:500.0, TUE_DAY:500.0, TUE_NGT:0.0 },
      { PART_CD:'A1', PART_NM:'A1 동', LINE_CD:'L01', LINE_NM:'L01', ITEM_CD:'H10002', ITEM_NM:'반제품-HALB 시럽 베이스 2', PLAN_FLAG:'ADJ', BATCH_KG:400.0, PLT_QTY: 800.0, MON_DAY:400.0, MON_NGT:400.0, TUE_DAY:400.0, TUE_NGT:0.0 },
      { PART_CD:'A2', PART_NM:'A2 동', LINE_CD:'L21', LINE_NM:'L21', ITEM_CD:'H20001', ITEM_NM:'반제품-HALB 반죽 1',        PLAN_FLAG:'NEW', BATCH_KG:250.0, PLT_QTY: 500.0, MON_DAY:250.0, MON_NGT:250.0, TUE_DAY:250.0, TUE_NGT:0.0 },
    ],
  },
  {
    key: 'prodAvail', label: '공급가용결과', menu: 'UI_MP_ORN_PROD_AVAIL', cnt: 1842,
    src: 'view/oron/masterplan/planresult/ornmpprodavail/OrnMpProdAvail.jsx',
    search: [
      { key: 'planScope', label: 'PLAN_SCOPE', type: 'select', width: 130, options: ['ORN_MP'] },
      { key: 'verCd',     label: 'VERSION',    type: 'select', width: 150, options: ['MAIN_V0006'] },
      { key: 'wk52',      label: 'WK52',       type: 'select', width: 110, options: ['2026-W23','2026-W24'] },
    ],
    buttons: ['excel'],
    cols: [
      { name: 'WK52',         h: 'WK52',          w:  90, a: 'center' },
      { name: 'ITEM_CD',      h: 'MP_ITEM_CD',    w:  90, a: 'center' },
      { name: 'ITEM_NM',      h: 'MP_ITEM_NM',    w: 220, a: 'left'   },
      { name: 'PLANT_NM',     h: 'FP_PLANT_NM',   w: 100, a: 'left'   },
      { name: 'PART_NM',      h: 'MP_PART_NM',    w: 100, a: 'left'   },
      { name: 'LINE_CD',      h: 'LINE_CD',       w:  70, a: 'center' },
      { name: 'LINE_NM',      h: 'LINE_NM',       w: 100, a: 'left'   },
      { name: 'PROD_REQ_QTY', h: 'PROD_REQ_QTY',  w: 100, a: 'right'  },
      { name: 'SHORT_QTY',    h: 'MP_SHORT_QTY',  w: 100, a: 'right', warn: true },
      { name: 'SHORT_HOURS',  h: 'MP_SHORT_HOURS',w: 100, a: 'right', warn: true },
    ],
    rows: [
      { WK52:'2026-W23', ITEM_CD:'F01001', ITEM_NM:'완제품-FERT 샘플 1', PLANT_NM:'P1 공장', PART_NM:'A1 동', LINE_CD:'L01', LINE_NM:'L01 충전 라인 1', PROD_REQ_QTY:5000, SHORT_QTY:200.0, SHORT_HOURS:0.4 },
      { WK52:'2026-W23', ITEM_CD:'F01002', ITEM_NM:'완제품-FERT 샘플 2', PLANT_NM:'P1 공장', PART_NM:'A1 동', LINE_CD:'L01', LINE_NM:'L01 충전 라인 1', PROD_REQ_QTY:3000, SHORT_QTY:  0.0, SHORT_HOURS:0.0 },
      { WK52:'2026-W23', ITEM_CD:'F02001', ITEM_NM:'완제품-FERT 샘플 4', PLANT_NM:'P2 공장', PART_NM:'A2 동', LINE_CD:'L21', LINE_NM:'L21 압출 라인',   PROD_REQ_QTY:8000, SHORT_QTY:500.0, SHORT_HOURS:1.2 },
      { WK52:'2026-W24', ITEM_CD:'F01001', ITEM_NM:'완제품-FERT 샘플 1', PLANT_NM:'P1 공장', PART_NM:'A1 동', LINE_CD:'L01', LINE_NM:'L01 충전 라인 1', PROD_REQ_QTY:5200, SHORT_QTY:  0.0, SHORT_HOURS:0.0 },
      { WK52:'2026-W24', ITEM_CD:'F02002', ITEM_NM:'완제품-FERT 샘플 5', PLANT_NM:'P3 공장', PART_NM:'A3 동', LINE_CD:'L31', LINE_NM:'L31 OEM 라인',   PROD_REQ_QTY:1500, SHORT_QTY: 50.0, SHORT_HOURS:0.1 },
    ],
  },
  {
    key: 'simulCmp', label: '버전별 비교', menu: 'UI_MP_ORN_SIMUL_COMPARE', cnt: 1842,
    src: 'view/oron/factoryplan/planresult/ornmpsimulcompare/OrnMpSimulCompare.jsx',
    search: [
      { key: 'planScope', label: 'PLAN_SCOPE',type: 'select', width: 130, options: ['ORN_MP'] },
      { key: 'ver1',      label: 'VER_1',     type: 'select', width: 150, options: ['MAIN_V0006'] },
      { key: 'ver2',      label: 'VER_2',     type: 'select', width: 150, options: ['SIM_2026Q3'] },
      { key: 'plantCd',   label: 'FP_PLANT',  type: 'multiSelect', width: 150 },
    ],
    buttons: ['excel'],
    cols: [
      { name: 'PLANT_NM',   h: 'PLANT_NM',  w: 100, a: 'center' },
      { name: 'LINE_CD',    h: 'LINE_CD',   w:  70, a: 'center' },
      { name: 'LINE_NM',    h: 'LINE_NM',   w: 100, a: 'left'   },
      { name: 'ITEM_CD',    h: 'ITEM_CD',   w:  90, a: 'center' },
      { name: 'ITEM_NM',    h: 'ITEM_NM',   w: 220, a: 'left'   },
      { name: 'MEASURE_NM', h: 'CTG_NM',    w: 120, a: 'center' },
      ...DATE_COLS.map((d) => ({ name: d, h: d, w: 90, a: 'right' })),
    ],
    rows: [
      { PLANT_NM:'P1 공장', LINE_CD:'L01', LINE_NM:'L01 충전 라인 1', ITEM_CD:'F01001', ITEM_NM:'완제품-FERT 샘플 1', MEASURE_NM:'VER_1', '2026-W23':210, '2026-W24':210, '2026-W25':210, '2026-W26':230, '2026-W27':240 },
      { PLANT_NM:'P1 공장', LINE_CD:'L01', LINE_NM:'L01 충전 라인 1', ITEM_CD:'F01001', ITEM_NM:'완제품-FERT 샘플 1', MEASURE_NM:'VER_2', '2026-W23':220, '2026-W24':215, '2026-W25':210, '2026-W26':240, '2026-W27':250 },
      { PLANT_NM:'P1 공장', LINE_CD:'L01', LINE_NM:'L01 충전 라인 1', ITEM_CD:'F01001', ITEM_NM:'완제품-FERT 샘플 1', MEASURE_NM:'DIFF',  '2026-W23': 10, '2026-W24':  5, '2026-W25':  0, '2026-W26': 10, '2026-W27': 10 },
      { PLANT_NM:'P1 공장', LINE_CD:'L02', LINE_NM:'L02 충전 라인 2', ITEM_CD:'F01003', ITEM_NM:'완제품-FERT 샘플 3', MEASURE_NM:'VER_1', '2026-W23':500, '2026-W24':500, '2026-W25':490, '2026-W26':550, '2026-W27':550 },
      { PLANT_NM:'P1 공장', LINE_CD:'L02', LINE_NM:'L02 충전 라인 2', ITEM_CD:'F01003', ITEM_NM:'완제품-FERT 샘플 3', MEASURE_NM:'VER_2', '2026-W23':520, '2026-W24':510, '2026-W25':500, '2026-W26':560, '2026-W27':560 },
      { PLANT_NM:'P1 공장', LINE_CD:'L02', LINE_NM:'L02 충전 라인 2', ITEM_CD:'F01003', ITEM_NM:'완제품-FERT 샘플 3', MEASURE_NM:'DIFF',  '2026-W23': 20, '2026-W24': 10, '2026-W25': 10, '2026-W26': 10, '2026-W27': 10 },
    ],
  },
];

export default function OronMpPlanAdjMockup() {
  return (
    <MockShell
      patternCode="oron_mp_plan_adj"
      patternLabel="ORON — MP 생산계획 (편성/수정 + 조회 + 공급가용 + 버전비교)"
      layoutCategory="LAYOUT_SINGLE"
      description="6개 운영 화면 통합. ADJ 2종 = 편성/수정 (LINE×ITEM 또는 PLANT/LINE/HALB × MEASURE × 동적 DATE 크로스탭, SCM/FAC/DIFF_BOX). SRC 2종 = read-only 조회. PROD_AVAIL = SHORT_QTY/SHORT_HOURS 부족 분석. SIMUL_COMPARE = VER_1/VER_2/DIFF 행으로 두 버전 차이 비교."
    >
      <MockGridScaffold tabs={TABS} footer="MEASURE SCM_BOX=SCM 목표 · FAC_BOX=공장 가용 · DIFF_BOX=차이 (음수=부족, 빨강) · PROD_AVAIL SHORT_* 0 이상 = 결품 위험" />
    </MockShell>
  );
}
