import React from 'react';
import MockShell from '../../_shared/MockShell';
import MockGridScaffold from '../_shared/MockGridScaffold';

// ORON — MP MRP/PSI (6개 화면)
//  - UI_MP_ORN_MRP_TOT     원부자재 발주요청 (통합)        — BOH + 동적 DATE 컬럼
//  - UI_MP_ORN_MRP_LOC     원부자재 발주요청 (내자)        — VENDOR_NM 노출 + OLD_MAT_CD
//  - UI_MP_ORN_MRP_TOT_VN  원부자재 발주요청 (외자)        — 베트남 서버 분기
//  - UI_MP_ORN_MAT_PSI     원부자재 PSI 조회               — PLANT_NM × BOH + 동적 DATE
//  - UI_MP_ORN_FERT_PSI    완제품 PSI 조회                  — BRAND × BOH_FAC/BOH_ALL × DIM_1_NM/DIM_2 + 동적 DATE
//  - UI_MP_ORN_STOCK_MGMT  자재별 재고 조회/수정 (MpStockMgmt — wingui-core 폴더, ORON 도 ITEM_CD action 버튼)

const DATE_COLS = ['2026-W23','2026-W24','2026-W25','2026-W26','2026-W27'];

const TABS = [
  {
    key: 'mrpTot', label: '원자재 발주요청 (통합)', menu: 'UI_MP_ORN_MRP_TOT', cnt: 2147,
    src: 'view/oron/factoryplan/matmgmt/ornmpmrptot/OrnMpMrpTot.jsx',
    search: [
      { key: 'planScope', label: 'PLAN_SCOPE', type: 'select',      width: 130, options: ['ORN_MP'] },
      { key: 'verCd',     label: 'VERSION',    type: 'select',      width: 150, options: ['MAIN_V0006'] },
      { key: 'plantCd',   label: 'FP_PLANT',   type: 'multiSelect', width: 150 },
      { key: 'matLv1',    label: 'MAT_LV_1',   type: 'select',      width: 130, options: ['RAW','PACK'] },
      { key: 'matLv2',    label: 'MAT_LV_2',   type: 'multiSelect', width: 150 },
      { key: 'matLv3',    label: 'MAT_LV_3',   type: 'multiSelect', width: 150 },
      { key: 'matVal',    label: 'MAT_VAL',    type: 'text',        width: 170 },
    ],
    buttons: ['save', 'excel'],
    cols: [
      { name: 'MAT_LV_03_NM',     h: 'MAT_LV_03_NM', w: 110, a: 'center' },
      { name: 'MAT_CD',           h: 'PK_MAT_CD',    w:  90, a: 'center' },
      { name: 'MAT_NM',           h: 'PK_MAT_NM',    w: 250, a: 'left'   },
      { name: 'PURC_LT',          h: 'PURC_LT',      w:  80, a: 'right'  },
      { name: 'SAFETY_STOCK_QTY', h: 'SFST_VAL',     w:  90, a: 'right'  },
      { name: 'MIN_ORD_QTY',      h: 'MIN_ORD_QTY',  w:  90, a: 'right'  },
      { name: 'BOH',              h: 'ORN_PLANT_BOH',w:  90, a: 'right'  },
      ...DATE_COLS.map((d) => ({ name: d, h: d, w: 90, a: 'right', edit: true })),
    ],
    rows: [
      { MAT_LV_03_NM:'당류',    MAT_CD:'M00010', MAT_NM:'원자재-RAW 설탕',         PURC_LT: 7, SAFETY_STOCK_QTY:5000.00, MIN_ORD_QTY:1000.00, BOH: 8200, '2026-W23':1000, '2026-W24':1000, '2026-W25':1500, '2026-W26':1500, '2026-W27':2000 },
      { MAT_LV_03_NM:'첨가제',  MAT_CD:'M00011', MAT_NM:'원자재-RAW 시트레이트',   PURC_LT:10, SAFETY_STOCK_QTY: 800.00, MIN_ORD_QTY: 200.00, BOH: 1200, '2026-W23': 200, '2026-W24': 200, '2026-W25': 200, '2026-W26': 200, '2026-W27': 200 },
      { MAT_LV_03_NM:'캔',      MAT_CD:'M00020', MAT_NM:'포장재-PACK 캔 355ml',    PURC_LT: 5, SAFETY_STOCK_QTY:20000.00,MIN_ORD_QTY:5000.00, BOH:32000, '2026-W23':5000, '2026-W24':5000, '2026-W25':5500, '2026-W26':5500, '2026-W27':6000 },
      { MAT_LV_03_NM:'캔',      MAT_CD:'M00021', MAT_NM:'포장재-PACK 캔 500ml',    PURC_LT: 5, SAFETY_STOCK_QTY:12000.00,MIN_ORD_QTY:3000.00, BOH:18000, '2026-W23':3000, '2026-W24':3000, '2026-W25':3300, '2026-W26':3300, '2026-W27':3500 },
      { MAT_LV_03_NM:'라벨',    MAT_CD:'M00030', MAT_NM:'포장재-PACK 라벨',         PURC_LT:21, SAFETY_STOCK_QTY:100000.00,MIN_ORD_QTY:50000.00,BOH:180000,'2026-W23':50000,'2026-W24':50000,'2026-W25':50000,'2026-W26':50000,'2026-W27':50000 },
    ],
  },
  {
    key: 'mrpLoc', label: '원자재 발주요청 (내자)', menu: 'UI_MP_ORN_MRP_LOC', cnt: 1532,
    src: 'view/oron/factoryplan/matmgmt/ornmpmrploc/OrnMpMrpLoc.jsx',
    search: [
      { key: 'planScope', label: 'PLAN_SCOPE', type: 'select',      width: 130, options: ['ORN_MP'] },
      { key: 'verCd',     label: 'VERSION',    type: 'select',      width: 150, options: ['MAIN_V0006'] },
      { key: 'plantCd',   label: 'FP_PLANT',   type: 'multiSelect', width: 150 },
      { key: 'vendorCd',  label: 'VENDOR',     type: 'multiSelect', width: 150 },
      { key: 'matLv1',    label: 'MAT_LV_1',   type: 'select',      width: 130, options: ['RAW','PACK'] },
      { key: 'matLv2',    label: 'MAT_LV_2',   type: 'multiSelect', width: 150 },
      { key: 'matLv3',    label: 'MAT_LV_3',   type: 'multiSelect', width: 150 },
      { key: 'matVal',    label: 'MAT_VAL',    type: 'text',        width: 170 },
    ],
    buttons: ['save', 'excel'],
    cols: [
      { name: 'MAT_LV_03_NM',     h: 'VENDOR_NM',      w: 130, a: 'center' },
      { name: 'MAT_CD',           h: 'PK_MAT_CD',      w:  90, a: 'center' },
      { name: 'MAT_NM',           h: 'PK_MAT_NM',      w: 200, a: 'left'   },
      { name: 'OLD_MAT_CD',       h: 'OLD_MAT_CD',     w:  90, a: 'center' },
      { name: 'PURC_LT',          h: 'PURC_LT',        w:  70, a: 'right'  },
      { name: 'SAFETY_STOCK_QTY', h: 'SFST_VAL',       w:  80, a: 'right'  },
      { name: 'MIN_ORD_QTY',      h: 'MIN_ORD_QTY',    w:  80, a: 'right'  },
      { name: 'BOH',              h: 'ORN_PLANT_BOH',  w:  90, a: 'right'  },
      { name: 'TODAY_IN_QTY',     h: 'TODAY_IN_QTY',   w:  90, a: 'right'  },
      ...DATE_COLS.map((d) => ({ name: d, h: d, w: 90, a: 'right', edit: true })),
    ],
    rows: [
      { MAT_LV_03_NM:'(주)국내A', MAT_CD:'M00010', MAT_NM:'원자재-RAW 설탕',        OLD_MAT_CD:'OLD_010', PURC_LT: 7, SAFETY_STOCK_QTY:5000,  MIN_ORD_QTY:1000, BOH: 8200.0, TODAY_IN_QTY:1000.0, '2026-W23':1000, '2026-W24':1000, '2026-W25':1500, '2026-W26':1500, '2026-W27':2000 },
      { MAT_LV_03_NM:'(주)국내A', MAT_CD:'M00011', MAT_NM:'원자재-RAW 시트레이트',  OLD_MAT_CD:'OLD_011', PURC_LT:10, SAFETY_STOCK_QTY: 800,  MIN_ORD_QTY: 200, BOH: 1200.0, TODAY_IN_QTY: 200.0, '2026-W23': 200, '2026-W24': 200, '2026-W25': 200, '2026-W26': 200, '2026-W27': 200 },
      { MAT_LV_03_NM:'(주)국내B', MAT_CD:'M00020', MAT_NM:'포장재-PACK 캔 355ml',   OLD_MAT_CD:'OLD_020', PURC_LT: 5, SAFETY_STOCK_QTY:20000, MIN_ORD_QTY:5000, BOH:32000.0, TODAY_IN_QTY:5000.0, '2026-W23':5000, '2026-W24':5000, '2026-W25':5500, '2026-W26':5500, '2026-W27':6000 },
    ],
  },
  {
    key: 'mrpTotVn', label: '원자재 발주요청 (외자/VN)', menu: 'UI_MP_ORN_MRP_TOT_VN', cnt: 615,
    src: 'view/oron/factoryplan/matmgmt/ornmpmrptotvn/OrnMpMrpTotVn.jsx',
    search: [
      { key: 'planScope', label: 'PLAN_SCOPE', type: 'select',      width: 130, options: ['ORN_MP'] },
      { key: 'verCd',     label: 'VERSION',    type: 'select',      width: 150, options: ['MAIN_V0006'] },
      { key: 'plantCd',   label: 'FP_PLANT',   type: 'multiSelect', width: 150 },
      { key: 'matLv1',    label: 'MAT_LV_1',   type: 'select',      width: 130 },
      { key: 'matLv2',    label: 'MAT_LV_2',   type: 'multiSelect', width: 150 },
      { key: 'matLv3',    label: 'MAT_LV_3',   type: 'multiSelect', width: 150 },
      { key: 'matVal',    label: 'MAT_VAL',    type: 'text',        width: 170 },
    ],
    buttons: ['save', 'excel'],
    cols: [
      { name: 'MAT_LV_03_NM',     h: 'MAT_LV_03_NM',  w: 120, a: 'center' },
      { name: 'MAT_CD',           h: 'PK_MAT_CD',     w:  90, a: 'center' },
      { name: 'MAT_NM',           h: 'PK_MAT_NM',     w: 220, a: 'left'   },
      { name: 'PURC_LT',          h: 'PURC_LT',       w:  70, a: 'right'  },
      { name: 'SAFETY_STOCK_QTY', h: 'SFST_VAL',      w:  90, a: 'right'  },
      { name: 'MIN_ORD_QTY',      h: 'MIN_ORD_QTY',   w:  90, a: 'right'  },
      { name: 'BOH',              h: 'ORN_PLANT_BOH', w:  90, a: 'right'  },
      { name: 'TODAY_IN_QTY',     h: 'TODAY_IN_QTY',  w:  90, a: 'right'  },
      ...DATE_COLS.map((d) => ({ name: d, h: d, w: 90, a: 'right', edit: true })),
    ],
    rows: [
      { MAT_LV_03_NM:'캔',   MAT_CD:'M00030', MAT_NM:'포장재-PACK 라벨', PURC_LT:21, SAFETY_STOCK_QTY:100000.00, MIN_ORD_QTY:50000.00, BOH:180000, TODAY_IN_QTY:50000, '2026-W23':50000, '2026-W24':50000, '2026-W25':50000, '2026-W26':50000, '2026-W27':50000 },
    ],
  },
  {
    key: 'matPsi', label: '원자재 PSI 조회', menu: 'UI_MP_ORN_MAT_PSI', cnt: 2147,
    src: 'view/oron/factoryplan/matmgmt/ornmpmatpsi/OrnMpMatPsi.jsx',
    search: [
      { key: 'planScope', label: 'PLAN_SCOPE', type: 'select',      width: 130, options: ['ORN_MP'] },
      { key: 'verCd',     label: 'VERSION',    type: 'select',      width: 150, options: ['MAIN_V0006'] },
      { key: 'plantCd',   label: 'FP_PLANT',   type: 'multiSelect', width: 150 },
      { key: 'matLv1',    label: 'MAT_LV_1',   type: 'select',      width: 130 },
      { key: 'matLv2',    label: 'MAT_LV_2',   type: 'multiSelect', width: 150 },
      { key: 'matLv3',    label: 'MAT_LV_3',   type: 'multiSelect', width: 150 },
      { key: 'matVal',    label: 'MAT_VAL',    type: 'text',        width: 170 },
      { key: 'bucket',    label: 'BUCKET',     type: 'select',      width: 100, options: ['W','M'] },
      { key: 'fromDt',    label: 'FROM_DT',    type: 'date',        width: 140 },
      { key: 'toDt',      label: 'TO_DT',      type: 'date',        width: 140 },
    ],
    buttons: ['excel'],
    cols: [
      { name: 'MAT_LV_03_NM', h: 'MAT_LV_03_NM', w: 110, a: 'center' },
      { name: 'MAT_CD',       h: 'PK_MAT_CD',    w:  90, a: 'center' },
      { name: 'MAT_NM',       h: 'PK_MAT_NM',    w: 250, a: 'left'   },
      { name: 'UOM_CD',       h: 'UOM_CD',       w:  60, a: 'center' },
      { name: 'PLANT_NM',     h: 'PLANT_NM',     w:  90, a: 'center' },
      { name: 'MEASURE',      h: 'MEASURE',      w:  90, a: 'center' },
      { name: 'BOH',          h: 'BOH',          w:  90, a: 'right'  },
      ...DATE_COLS.map((d) => ({ name: d, h: d, w: 90, a: 'right' })),
    ],
    rows: [
      { MAT_LV_03_NM:'당류', MAT_CD:'M00010', MAT_NM:'원자재-RAW 설탕',    UOM_CD:'KG', PLANT_NM:'P1 공장', MEASURE:'IN',  BOH: 8200.00, '2026-W23':1000, '2026-W24':1000, '2026-W25':1500, '2026-W26':1500, '2026-W27':2000 },
      { MAT_LV_03_NM:'당류', MAT_CD:'M00010', MAT_NM:'원자재-RAW 설탕',    UOM_CD:'KG', PLANT_NM:'P1 공장', MEASURE:'OUT', BOH: 8200.00, '2026-W23': 800, '2026-W24': 800, '2026-W25':1200, '2026-W26':1200, '2026-W27':1600 },
      { MAT_LV_03_NM:'당류', MAT_CD:'M00010', MAT_NM:'원자재-RAW 설탕',    UOM_CD:'KG', PLANT_NM:'P1 공장', MEASURE:'EOH', BOH: 8200.00, '2026-W23':8400, '2026-W24':8600, '2026-W25':8900, '2026-W26':9200, '2026-W27':9600 },
      { MAT_LV_03_NM:'캔',   MAT_CD:'M00020', MAT_NM:'포장재-PACK 캔 355ml',UOM_CD:'EA', PLANT_NM:'P1 공장', MEASURE:'IN',  BOH:32000.00, '2026-W23':5000, '2026-W24':5000, '2026-W25':5500, '2026-W26':5500, '2026-W27':6000 },
      { MAT_LV_03_NM:'캔',   MAT_CD:'M00020', MAT_NM:'포장재-PACK 캔 355ml',UOM_CD:'EA', PLANT_NM:'P1 공장', MEASURE:'OUT', BOH:32000.00, '2026-W23':4200, '2026-W24':4200, '2026-W25':4800, '2026-W26':4800, '2026-W27':5300 },
    ],
  },
  {
    key: 'fertPsi', label: '완제품 PSI 조회', menu: 'UI_MP_ORN_FERT_PSI', cnt: 1284,
    src: 'view/oron/factoryplan/planresult/ornmpfertpsi/OrnMpFertPsi.jsx',
    search: [
      { key: 'planScope', label: 'PLAN_SCOPE', type: 'select',      width: 130, options: ['ORN_MP'] },
      { key: 'verCd',     label: 'VERSION',    type: 'select',      width: 150, options: ['MAIN_V0006'] },
      { key: 'plantCd',   label: 'FP_PLANT',   type: 'multiSelect', width: 150 },
      { key: 'category',  label: 'CATEGORY',   type: 'multiSelect', width: 150, options: ['음료','과자'] },
      { key: 'brandCd',   label: 'BRAND',      type: 'multiSelect', width: 150 },
      { key: 'itemVal',   label: 'ITEM_VAL',   type: 'text',        width: 170 },
      { key: 'bucket',    label: 'BUCKET',     type: 'select',      width: 100, options: ['W','M'] },
      { key: 'fromDt',    label: 'FROM_DT',    type: 'date',        width: 140 },
      { key: 'toDt',      label: 'TO_DT',      type: 'date',        width: 140 },
    ],
    buttons: ['excel'],
    cols: [
      { name: 'ITEM_CD',          h: 'BRAND_CD',  w:  90, a: 'center' },
      { name: 'ITEM_NM',          h: 'BRAND_NM',  w: 180, a: 'left'   },
      { name: 'DIM_1_NM',         h: 'DIM_1_NM',  w: 100, a: 'center' },
      { name: 'DIM_2',            h: 'DIM_2',     w: 110, a: 'center' },
      { name: 'BOH_FAC_STK_QTY',  h: 'BOH_FAC',   w:  90, a: 'right'  },
      { name: 'BOH_ALL_STK_QTY',  h: 'BOH_ALL',   w:  90, a: 'right'  },
      ...DATE_COLS.map((d) => ({ name: d, h: d, w: 90, a: 'right' })),
    ],
    rows: [
      { ITEM_CD:'BR01', ITEM_NM:'ORN_A', DIM_1_NM:'CATEGORY', DIM_2:'음료',    BOH_FAC_STK_QTY:12000, BOH_ALL_STK_QTY:18000, '2026-W23':5000, '2026-W24':5000, '2026-W25':5200, '2026-W26':5500, '2026-W27':5500 },
      { ITEM_CD:'BR01', ITEM_NM:'ORN_A', DIM_1_NM:'CATEGORY', DIM_2:'음료',    BOH_FAC_STK_QTY:12000, BOH_ALL_STK_QTY:18000, '2026-W23':4800, '2026-W24':4800, '2026-W25':5000, '2026-W26':5200, '2026-W27':5300 },
      { ITEM_CD:'BR02', ITEM_NM:'ORN_B', DIM_1_NM:'CATEGORY', DIM_2:'음료',    BOH_FAC_STK_QTY: 6500, BOH_ALL_STK_QTY:10000, '2026-W23':2500, '2026-W24':2500, '2026-W25':2700, '2026-W26':2700, '2026-W27':2700 },
      { ITEM_CD:'BR03', ITEM_NM:'ORN_C', DIM_1_NM:'CATEGORY', DIM_2:'과자',    BOH_FAC_STK_QTY: 4500, BOH_ALL_STK_QTY: 6800, '2026-W23':2000, '2026-W24':2000, '2026-W25':2200, '2026-W26':2200, '2026-W27':2400 },
    ],
  },
  {
    key: 'stockMgmt', label: '자재별 재고 조회/수정', menu: 'UI_MP_ORN_STOCK_MGMT', cnt: 8472,
    src: 'view/oron/factoryplan/planningsimulation/mpstockmgmt/MpStockMgmt.jsx',
    search: [
      { key: 'planScope', label: 'PLAN_SCOPE', type: 'select',      width: 130, options: ['ORN_MP'] },
      { key: 'plantCd',   label: 'MP_PLANT',   type: 'multiSelect', width: 150 },
      { key: 'slCd',      label: 'ORN_RP_SL_CD',type: 'multiSelect',width: 150 },
      { key: 'itemVal',   label: 'ITEM_VAL',   type: 'text',        width: 170 },
    ],
    buttons: ['save', 'excel'],
    cols: [
      { name: 'ITEM_CD',     h: 'ITEM_CD',          w:  90, a: 'center', action: true },
      { name: 'ITEM_NM',     h: 'ITEM_NM',          w: 200, a: 'left'   },
      { name: 'UOM_CD',      h: 'UOM_CD',           w:  60, a: 'center' },
      { name: 'PLANT_CD',    h: 'MP_PLANT_CD',      w:  70, a: 'center' },
      { name: 'PLANT_NM',    h: 'MP_PLANT_NM',      w:  90, a: 'center' },
      { name: 'SL_CD',       h: 'ORN_RP_SL_CD',     w:  70, a: 'center' },
      { name: 'SL_NM',       h: 'ORN_RP_SL_NM',     w: 100, a: 'left'   },
      { name: 'USABLE_DATE', h: 'USABLE_DATE',      w: 100, a: 'center' },
      { name: 'INV_ID',      h: 'INV_ID',           w: 100, a: 'center' },
      { name: 'ORG_QTY',     h: 'ORN_USABLE_STK_QTY',w:  90, a: 'right' },
      { name: 'QI_QTY',      h: 'ORN_QI_STK_QTY',   w:  90, a: 'right'  },
      { name: 'UNCLEAR_QTY', h: 'ORN_UNCLEAR_STK_QTY',w: 90, a: 'right' },
    ],
    rows: [
      { ITEM_CD:'M00010', ITEM_NM:'원자재-RAW 설탕',         UOM_CD:'KG', PLANT_CD:'P1', PLANT_NM:'P1 공장', SL_CD:'SL01', SL_NM:'자재창고 A', USABLE_DATE:'2026-09-30', INV_ID:'INV-001', ORG_QTY: 7200.00, QI_QTY: 800.00, UNCLEAR_QTY: 200.00 },
      { ITEM_CD:'M00011', ITEM_NM:'원자재-RAW 시트레이트',   UOM_CD:'KG', PLANT_CD:'P1', PLANT_NM:'P1 공장', SL_CD:'SL01', SL_NM:'자재창고 A', USABLE_DATE:'2026-08-31', INV_ID:'INV-002', ORG_QTY: 1000.00, QI_QTY: 150.00, UNCLEAR_QTY:  50.00 },
      { ITEM_CD:'M00020', ITEM_NM:'포장재-PACK 캔 355ml',    UOM_CD:'EA', PLANT_CD:'P1', PLANT_NM:'P1 공장', SL_CD:'SL02', SL_NM:'포장창고',    USABLE_DATE:'9999-12-31', INV_ID:'INV-003', ORG_QTY:30000.00, QI_QTY:1500.00, UNCLEAR_QTY: 500.00 },
      { ITEM_CD:'M00021', ITEM_NM:'포장재-PACK 캔 500ml',    UOM_CD:'EA', PLANT_CD:'P1', PLANT_NM:'P1 공장', SL_CD:'SL02', SL_NM:'포장창고',    USABLE_DATE:'9999-12-31', INV_ID:'INV-004', ORG_QTY:17000.00, QI_QTY: 800.00, UNCLEAR_QTY: 200.00 },
    ],
  },
];

export default function OronMpMrpPsiMockup() {
  return (
    <MockShell
      patternCode="oron_mp_mrp_psi"
      patternLabel="ORON — MP MRP/PSI (발주요청 통합/내자/외자 + PSI 조회 + 재고)"
      layoutCategory="LAYOUT_SINGLE"
      description="6개 운영 화면 통합. MRP_TOT/LOC/TOT_VN 3종은 자재 발주요청 (BOH + 동적 DATE × 수량, MRP_LOC 만 VENDOR_NM+OLD_MAT_CD+TODAY_IN_QTY 노출). MAT_PSI / FERT_PSI 는 자재/완제품 PSI 크로스탭 (IN/OUT/EOH × 동적 DATE). STOCK_MGMT 는 자재별 재고 조회 (USABLE_STK / QI_STK / UNCLEAR_STK 3구분 + USABLE_DATE 유효기한)."
    >
      <MockGridScaffold tabs={TABS} footer="MEASURE IN/OUT/EOH = 입고/소요/마감재고 · QI = 검수 대기, UNCLEAR = 미정리" />
    </MockShell>
  );
}
