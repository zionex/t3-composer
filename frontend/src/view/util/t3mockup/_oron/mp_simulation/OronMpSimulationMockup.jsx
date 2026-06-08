import React from 'react';
import MockShell from '../../_shared/MockShell';
import MockGridScaffold from '../_shared/MockGridScaffold';

// ORON — MP 시뮬레이션 (공급계획 시뮬레이션 + 기준정보 점검 + 점검 결과)
//  - UI_MP_ORN_PLAN_DMND      view/oron/masterplan/planningsimulation/ornmpplandmnd/OrnMpPlanDmnd
//                             (CATEGORY×BRAND×ITEM PSI 크로스탭 — BOH + 동적 DATE 컬럼)
//  - UI_MP_ORN_DATA_VALID     view/oron/factoryplan/planningsimulation/ornmpdatavalid/OrnMpDataValid
//                             (VALID_TP_CD × VALID_CD × ERR_TP_CD × ERR_CNT + 링크 메뉴)
//  - UI_MP_ORN_DATA_VALID_INQ view/oron/factoryplan/planningsimulation/ornmpdatavalidinq/OrnMpDataValidInq
//                             (품목별 BOM_CHECK/BOR_CHECK/PRIORITY_CHECK O/X 매트릭스)

const DATE_COLS = ['2026-W23','2026-W24','2026-W25','2026-W26','2026-W27'];

const TABS = [
  {
    key: 'planDmnd', label: '공급계획 시뮬레이션 (PSI 크로스탭)', menu: 'UI_MP_ORN_PLAN_DMND', cnt: 1284,
    src: 'view/oron/masterplan/planningsimulation/ornmpplandmnd/OrnMpPlanDmnd.jsx',
    search: [
      { key: 'planScope', label: 'PLAN_SCOPE',     type: 'select', width: 130, options: ['ORN_MP'] },
      { key: 'verCd',     label: 'VERSION',        type: 'select', width: 150, options: ['MAIN_V0006', 'SIM_2026Q3'] },
      { key: 'bucket',    label: 'BUCKET',         type: 'select', width: 100, options: ['W','M','D'] },
      { key: 'fromDt',    label: 'FROM_DT',        type: 'date',   width: 140 },
      { key: 'toDt',      label: 'TO_DT',          type: 'date',   width: 140 },
    ],
    buttons: ['save', 'excel'],
    cols: [
      { name: 'CATEGORY_NM', h: 'CATEGORY_NM', w: 90,  a: 'center' },
      { name: 'BRAND_NM',    h: 'BRAND_NM',    w: 80,  a: 'center' },
      { name: 'ITEM_NM',     h: 'ITEM_NM',     w: 220, a: 'left'   },
      { name: 'MEASURE',     h: 'MEASURE',     w: 100, a: 'center' },
      { name: 'UOM',         h: 'UOM',         w:  60, a: 'center' },
      { name: 'BOH',         h: 'BOH',         w:  80, a: 'right'  },
      ...DATE_COLS.map((d) => ({ name: d, h: d, w: 90, a: 'right', edit: true })),
    ],
    rows: [
      { CATEGORY_NM:'음료', BRAND_NM:'ORN_A', ITEM_NM:'완제품-FERT 샘플 1', MEASURE:'DEMAND',  UOM:'EA', BOH: 12000, '2026-W23': 4800, '2026-W24': 4800, '2026-W25': 5200, '2026-W26': 5200, '2026-W27': 5500 },
      { CATEGORY_NM:'음료', BRAND_NM:'ORN_A', ITEM_NM:'완제품-FERT 샘플 1', MEASURE:'SUPPLY',  UOM:'EA', BOH: 12000, '2026-W23': 5000, '2026-W24': 5000, '2026-W25': 5000, '2026-W26': 5500, '2026-W27': 5500 },
      { CATEGORY_NM:'음료', BRAND_NM:'ORN_A', ITEM_NM:'완제품-FERT 샘플 1', MEASURE:'INV(EOH)',UOM:'EA', BOH: 12000, '2026-W23':12200, '2026-W24':12400, '2026-W25':12200, '2026-W26':12500, '2026-W27':12500 },
      { CATEGORY_NM:'음료', BRAND_NM:'ORN_A', ITEM_NM:'완제품-FERT 샘플 2', MEASURE:'DEMAND',  UOM:'EA', BOH:  8000, '2026-W23': 3200, '2026-W24': 3200, '2026-W25': 3500, '2026-W26': 3500, '2026-W27': 3800 },
      { CATEGORY_NM:'음료', BRAND_NM:'ORN_A', ITEM_NM:'완제품-FERT 샘플 2', MEASURE:'SUPPLY',  UOM:'EA', BOH:  8000, '2026-W23': 3300, '2026-W24': 3300, '2026-W25': 3300, '2026-W26': 3800, '2026-W27': 3800 },
      { CATEGORY_NM:'과자', BRAND_NM:'ORN_C', ITEM_NM:'완제품-FERT 샘플 4', MEASURE:'DEMAND',  UOM:'EA', BOH:  4500, '2026-W23': 1800, '2026-W24': 1800, '2026-W25': 2000, '2026-W26': 2000, '2026-W27': 2200 },
      { CATEGORY_NM:'과자', BRAND_NM:'ORN_C', ITEM_NM:'완제품-FERT 샘플 4', MEASURE:'SUPPLY',  UOM:'EA', BOH:  4500, '2026-W23': 1900, '2026-W24': 1900, '2026-W25': 1900, '2026-W26': 2200, '2026-W27': 2200 },
    ],
  },
  {
    key: 'dataValid', label: '기준정보 점검', menu: 'UI_MP_ORN_DATA_VALID', cnt: 17,
    src: 'view/oron/factoryplan/planningsimulation/ornmpdatavalid/OrnMpDataValid.jsx',
    search: [
      { key: 'planScope', label: 'PLAN_SCOPE', type: 'select', width: 130, options: ['ORN_MP'] },
    ],
    buttons: ['excel'],
    cols: [
      { name: 'VALID_TP_CD', h: 'VALID_TP_CD', w: 120, a: 'center' },
      { name: 'VALID_CD',    h: 'VALID_CD',    w: 260, a: 'left'   },
      { name: 'ERR_TP_CD',   h: 'ERR_TP_CD',   w: 100, a: 'center', status: true },
      { name: 'ERR_CNT',     h: 'ERR_CNT',     w:  80, a: 'right'  },
      { name: 'MENU_NM',     h: 'LINK_MENU_CD',w: 200, a: 'center', action: true },
    ],
    rows: [
      { VALID_TP_CD:'ITEM',     VALID_CD:'완제품 LIFE_CYCLE 미지정',           ERR_TP_CD:'FAIL', ERR_CNT:12,  MENU_NM:'UI_MP_ITEM' },
      { VALID_TP_CD:'ITEM',     VALID_CD:'반제품 PROD_LT 음수',               ERR_TP_CD:'FAIL', ERR_CNT: 2,  MENU_NM:'UI_MP_ORN_HALB_ITEM' },
      { VALID_TP_CD:'BOM',      VALID_CD:'BOM 미존재 완제품',                 ERR_TP_CD:'FAIL', ERR_CNT: 4,  MENU_NM:'UI_MP_ORN_BOM' },
      { VALID_TP_CD:'BOM',      VALID_CD:'BOM 합 ≠ 100%',                    ERR_TP_CD:'FAIL', ERR_CNT: 1,  MENU_NM:'UI_MP_ORN_BOM' },
      { VALID_TP_CD:'BOR',      VALID_CD:'생산능력 미정의 (Line×Item)',       ERR_TP_CD:'FAIL', ERR_CNT: 8,  MENU_NM:'UI_MP_ORN_BOR' },
      { VALID_TP_CD:'BOR',      VALID_CD:'BOX_CAPA 0',                         ERR_TP_CD:'FAIL', ERR_CNT: 3,  MENU_NM:'UI_MP_ORN_BOR' },
      { VALID_TP_CD:'CALENDAR', VALID_CD:'미래 4주 캘린더 미정의 라인',         ERR_TP_CD:'FAIL', ERR_CNT: 1,  MENU_NM:'UI_MP_ORN_CALENDAR' },
      { VALID_TP_CD:'PRIORITY', VALID_CD:'PRIORITY 중복 (동일 LINE×ITEM)',     ERR_TP_CD:'FAIL', ERR_CNT: 6,  MENU_NM:'UI_MP_ORN_BOR' },
    ],
  },
  {
    key: 'dataValidInq', label: '점검결과 조회 (품목별)', menu: 'UI_MP_ORN_DATA_VALID_INQ', cnt: 1284,
    src: 'view/oron/factoryplan/planningsimulation/ornmpdatavalidinq/OrnMpDataValidInq.jsx',
    search: [
      { key: 'planScope', label: 'PLAN_SCOPE', type: 'select',      width: 130, options: ['ORN_MP'] },
      { key: 'plantCd',   label: 'FP_PLANT',   type: 'multiSelect', width: 150 },
      { key: 'itemVal',   label: 'ITEM_VAL',   type: 'text',        width: 170, ph: 'F01001 / 품목명' },
    ],
    buttons: ['excel'],
    cols: [
      { name: 'ITEM_CD',        h: 'ITEM_CD',        w: 100, a: 'center' },
      { name: 'ITEM_NM',        h: 'ITEM_NM',        w: 220, a: 'left'   },
      { name: 'ITEM_TP_NM',     h: 'ITEM_TP_NM',     w:  70, a: 'center' },
      { name: 'FERT_LINE_USE',  h: 'FERT_LINE_USE',  w: 120, a: 'center' },
      { name: 'ITEM_UOM',       h: 'ITEM_UOM',       w:  80, a: 'center' },
      { name: 'MDM_DT',         h: 'MDM_DT',         w: 100, a: 'center' },
      { name: 'SALES_DUE_DT',   h: 'SALES_DUE_DT',   w: 100, a: 'center' },
      { name: 'PROD_DUE_DT',    h: 'PROD_DUE_DT',    w: 100, a: 'center' },
      { name: 'PROD_UOM',       h: 'PROD_UOM',       w:  80, a: 'center' },
      { name: 'BOM_CHECK',      h: 'BOM_CHECK',      w:  90, a: 'center', status: true },
      { name: 'BOR_CHECK',      h: 'BOR_CHECK',      w:  90, a: 'center', status: true },
      { name: 'PRIORITY_CHECK', h: 'PRIORITY_CHECK', w: 110, a: 'center', status: true },
    ],
    rows: [
      { ITEM_CD:'F01001', ITEM_NM:'완제품-FERT 샘플 1', ITEM_TP_NM:'FERT', FERT_LINE_USE:'L01/L02',   ITEM_UOM:'EA', MDM_DT:'2024-01-01', SALES_DUE_DT:'9999-12-31', PROD_DUE_DT:'9999-12-31', PROD_UOM:'EA', BOM_CHECK:'ACTV', BOR_CHECK:'ACTV', PRIORITY_CHECK:'ACTV' },
      { ITEM_CD:'F01002', ITEM_NM:'완제품-FERT 샘플 2', ITEM_TP_NM:'FERT', FERT_LINE_USE:'L01',       ITEM_UOM:'EA', MDM_DT:'2024-01-01', SALES_DUE_DT:'9999-12-31', PROD_DUE_DT:'9999-12-31', PROD_UOM:'EA', BOM_CHECK:'ACTV', BOR_CHECK:'ACTV', PRIORITY_CHECK:'FAIL' },
      { ITEM_CD:'F01003', ITEM_NM:'완제품-FERT 샘플 3', ITEM_TP_NM:'FERT', FERT_LINE_USE:'L02',       ITEM_UOM:'EA', MDM_DT:'2024-01-01', SALES_DUE_DT:'9999-12-31', PROD_DUE_DT:'9999-12-31', PROD_UOM:'EA', BOM_CHECK:'ACTV', BOR_CHECK:'FAIL', PRIORITY_CHECK:'ACTV' },
      { ITEM_CD:'F02001', ITEM_NM:'완제품-FERT 샘플 4', ITEM_TP_NM:'FERT', FERT_LINE_USE:'L21',       ITEM_UOM:'EA', MDM_DT:'2024-01-01', SALES_DUE_DT:'9999-12-31', PROD_DUE_DT:'9999-12-31', PROD_UOM:'EA', BOM_CHECK:'FAIL', BOR_CHECK:'ACTV', PRIORITY_CHECK:'ACTV' },
      { ITEM_CD:'F02002', ITEM_NM:'완제품-FERT 샘플 5', ITEM_TP_NM:'FERT', FERT_LINE_USE:'L31',       ITEM_UOM:'EA', MDM_DT:'2024-01-01', SALES_DUE_DT:'9999-12-31', PROD_DUE_DT:'9999-12-31', PROD_UOM:'EA', BOM_CHECK:'ACTV', BOR_CHECK:'ACTV', PRIORITY_CHECK:'ACTV' },
    ],
  },
];

export default function OronMpSimulationMockup() {
  return (
    <MockShell
      patternCode="oron_mp_simulation"
      patternLabel="ORON — MP 시뮬레이션 (공급계획 + 기준정보 점검)"
      layoutCategory="LAYOUT_SINGLE"
      description="3개 운영 화면 통합. PLAN_DMND 는 CATEGORY×BRAND×ITEM × DEMAND/SUPPLY/INV(EOH) 측정값 × 동적 DATE 버킷 PSI 크로스탭. DATA_VALID 는 17개 유형 점검 (ERR_CNT + LINK_MENU 로 원본 화면 이동). DATA_VALID_INQ 는 품목별 BOM/BOR/PRIORITY O/X 매트릭스."
    >
      <MockGridScaffold tabs={TABS} footer="MEASURE: DEMAND/SUPPLY/INV(EOH) · LINK_MENU 클릭 → 원본 화면 이동" />
    </MockShell>
  );
}
