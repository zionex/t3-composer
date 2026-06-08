import React from 'react';
import MockShell from '../../_shared/MockShell';
import MockGridScaffold from '../_shared/MockGridScaffold';

// ORON — MP 생산능력 (5개 화면)
//  - UI_MP_ORN_BOR        view/oron/masterplan/master/ornmpbor/OrnMpBor             (생산능력정의 — Line×Item Capa)
//  - UI_MP_ORN_BOR_SET    view/oron/factoryplan/master/ornmpborset/OrnMpBorSet     (공용설비제약 — Pop 으로 ITEM 추가)
//  - UI_MP_ORN_CALENDAR   view/oron/masterplan/master/ornmpcalendar/OrnMpCalendar   (생산라인 캘린더 — 주별 가동시간 매트릭스, mergeRule)
//  - UI_MP_JC_TIME        view/oron/masterplan/master/ornmpjctime/OrnMpJcTime      (작업교체시간 — 2탭: 품목간 / 브랜드·그룹간)
//  - UI_MP_ORN_BY_PRODUCT view/oron/factoryplan/master/ornmpbyproduct/OrnMpByProduct (동시생산제약 — Pop 으로 추가)

const TABS = [
  {
    key: 'bor', label: '생산능력정의 (BOR)', menu: 'UI_MP_ORN_BOR', cnt: 1842,
    src: 'view/oron/masterplan/master/ornmpbor/OrnMpBor.jsx',
    search: [
      { key: 'plantCd', label: 'FP_PLANT', type: 'multiSelect', width: 150 },
      { key: 'partCd',  label: 'FP_PART',  type: 'multiSelect', width: 150 },
      { key: 'lineCd',  label: 'FP_LINE',  type: 'multiSelect', width: 150 },
      { key: 'itemVal', label: 'PK_ITEM_VAL', type: 'text',     width: 170, ph: 'F01001 / 품목명' },
    ],
    buttons: ['save', 'excel'],
    cols: [
      { name: 'PLANT_CD',    h: 'PLANT_CD',    w:  60, a: 'center' },
      { name: 'PLANT_NM',    h: 'PLANT_NM',    w:  80, a: 'center' },
      { name: 'PART_CD',     h: 'MP_PART_CD',  w:  70, a: 'center' },
      { name: 'PART_NM',     h: 'MP_PART_NM',  w: 100, a: 'left'   },
      { name: 'LINE_CD',     h: 'FP_LINE',     w:  60, a: 'center' },
      { name: 'LINE_NM',     h: 'LINE_NM',     w:  90, a: 'left'   },
      { name: 'ITEM_CD',     h: 'ITEM_CD',     w:  90, a: 'center' },
      { name: 'ITEM_NM',     h: 'ITEM_NM',     w: 220, a: 'left'   },
      { name: 'PROD_UOM',    h: 'PROD_UOM',    w:  60, a: 'center' },
      { name: 'BRAND_NM',    h: 'BRAND_NM',    w:  70, a: 'center' },
      { name: 'BOX_WEIGHT',  h: 'BOX_WEIGHT',  w:  80, a: 'right'  },
      { name: 'PRIORITY',    h: 'PRIORITY',    w:  70, a: 'right', edit: true },
      { name: 'ORG_CAPA',    h: 'ORG_CAPA',    w:  90, a: 'right'  },
      { name: 'ORG_CAPA_UOM',h: 'ORG_CAPA_UOM',w:  70, a: 'center' },
      { name: 'BOX_CAPA',    h: 'BOX_CAPA',    w:  80, a: 'right'  },
      { name: 'KG_CAPA',     h: 'KG_CAPA',     w:  80, a: 'right', edit: true },
      { name: 'VALID_FROM_DT',h:'ORN_VALID_FROM_DT',w:100,a:'center' },
      { name: 'VALID_TO_DT', h:'ORN_VALID_TO_DT', w: 100, a:'center' },
      { name: 'USE_YN',      h: 'USE_YN',      w:  60, a: 'center', bool: true },
    ],
    rows: [
      { PLANT_CD:'P1', PLANT_NM:'P1 공장', PART_CD:'A1', PART_NM:'A1 동', LINE_CD:'L01', LINE_NM:'L01 충전 라인 1', ITEM_CD:'F01001', ITEM_NM:'완제품-FERT 샘플 1', PROD_UOM:'EA', BRAND_NM:'ORN_A', BOX_WEIGHT:8.52,  PRIORITY:1, ORG_CAPA:5000,  ORG_CAPA_UOM:'EA/HR', BOX_CAPA:208.33, KG_CAPA:1775, VALID_FROM_DT:'2024-01-01', VALID_TO_DT:'9999-12-31', USE_YN:true  },
      { PLANT_CD:'P1', PLANT_NM:'P1 공장', PART_CD:'A1', PART_NM:'A1 동', LINE_CD:'L01', LINE_NM:'L01 충전 라인 1', ITEM_CD:'F01002', ITEM_NM:'완제품-FERT 샘플 2', PROD_UOM:'EA', BRAND_NM:'ORN_A', BOX_WEIGHT:12.00, PRIORITY:2, ORG_CAPA:4200,  ORG_CAPA_UOM:'EA/HR', BOX_CAPA:175.00, KG_CAPA:2100, VALID_FROM_DT:'2024-01-01', VALID_TO_DT:'9999-12-31', USE_YN:true  },
      { PLANT_CD:'P1', PLANT_NM:'P1 공장', PART_CD:'A1', PART_NM:'A1 동', LINE_CD:'L02', LINE_NM:'L02 충전 라인 2', ITEM_CD:'F01003', ITEM_NM:'완제품-FERT 샘플 3', PROD_UOM:'EA', BRAND_NM:'ORN_B', BOX_WEIGHT:6.00,  PRIORITY:1, ORG_CAPA:6000,  ORG_CAPA_UOM:'EA/HR', BOX_CAPA:500.00, KG_CAPA:3000, VALID_FROM_DT:'2024-01-01', VALID_TO_DT:'9999-12-31', USE_YN:true  },
      { PLANT_CD:'P2', PLANT_NM:'P2 공장', PART_CD:'A2', PART_NM:'A2 동', LINE_CD:'L21', LINE_NM:'L21 압출 라인',  ITEM_CD:'F02001', ITEM_NM:'완제품-FERT 샘플 4', PROD_UOM:'EA', BRAND_NM:'ORN_C', BOX_WEIGHT:4.32,  PRIORITY:1, ORG_CAPA:8000,  ORG_CAPA_UOM:'EA/HR', BOX_CAPA:222.22, KG_CAPA: 960, VALID_FROM_DT:'2024-01-01', VALID_TO_DT:'9999-12-31', USE_YN:true  },
      { PLANT_CD:'P3', PLANT_NM:'P3 공장', PART_CD:'A3', PART_NM:'A3 동', LINE_CD:'L31', LINE_NM:'L31 OEM 라인',   ITEM_CD:'F02002', ITEM_NM:'완제품-FERT 샘플 5', PROD_UOM:'EA', BRAND_NM:'ORN_C', BOX_WEIGHT:4.80,  PRIORITY:3, ORG_CAPA:3000,  ORG_CAPA_UOM:'EA/HR', BOX_CAPA: 62.50, KG_CAPA: 300, VALID_FROM_DT:'2024-01-01', VALID_TO_DT:'9999-12-31', USE_YN:false },
    ],
  },
  {
    key: 'borSet', label: '공용설비제약', menu: 'UI_MP_ORN_BOR_SET', cnt: 96,
    src: 'view/oron/factoryplan/master/ornmpborset/OrnMpBorSet.jsx',
    search: [
      { key: 'plantCd', label: 'FP_PLANT', type: 'multiSelect', width: 150 },
    ],
    buttons: ['add', 'del', 'save', 'excel'],
    cols: [
      { name: 'CONST_SEQ', h: 'CONST_SEQ',  w:  80, a: 'center', edit: true },
      { name: 'PLANT_CD',  h: 'PLANT_CD',   w:  70, a: 'center' },
      { name: 'PLANT_NM',  h: 'PLANT_NM',   w:  90, a: 'left'   },
      { name: 'PART_CD',   h: 'MP_PART_CD', w:  70, a: 'center' },
      { name: 'PART_NM',   h: 'MP_PART_NM', w:  90, a: 'left'   },
      { name: 'LINE_CD',   h: 'LINE_CD',    w:  70, a: 'center' },
      { name: 'LINE_NM',   h: 'LINE_NM',    w: 100, a: 'left'   },
      { name: 'ITEM_CD',   h: 'ITEM_CD',    w:  90, a: 'center', action: true },  // PopItem 호출
      { name: 'ITEM_NM',   h: 'ITEM_NM',    w: 200, a: 'left'   },
      { name: 'USE_YN',    h: 'USE_YN',     w:  60, a: 'center', bool: true, edit: true },
      { name: 'ASYN_RMK',  h: 'ASYN_RMK',   w: 200, a: 'left',   edit: true },
    ],
    rows: [
      { CONST_SEQ:'001', PLANT_CD:'P1', PLANT_NM:'P1 공장', PART_CD:'A1', PART_NM:'A1 동', LINE_CD:'L01', LINE_NM:'L01 충전 라인 1', ITEM_CD:'F01001', ITEM_NM:'완제품-FERT 샘플 1', USE_YN:true, ASYN_RMK:'L01·L02 동시 사용 금지' },
      { CONST_SEQ:'001', PLANT_CD:'P1', PLANT_NM:'P1 공장', PART_CD:'A1', PART_NM:'A1 동', LINE_CD:'L02', LINE_NM:'L02 충전 라인 2', ITEM_CD:'F01001', ITEM_NM:'완제품-FERT 샘플 1', USE_YN:true, ASYN_RMK:'L01·L02 동시 사용 금지' },
      { CONST_SEQ:'002', PLANT_CD:'P2', PLANT_NM:'P2 공장', PART_CD:'A2', PART_NM:'A2 동', LINE_CD:'L21', LINE_NM:'L21 압출 라인',   ITEM_CD:'F02001', ITEM_NM:'완제품-FERT 샘플 4', USE_YN:true, ASYN_RMK:'CIP 시간 공유' },
    ],
  },
  {
    key: 'calendar', label: '생산라인 캘린더', menu: 'UI_MP_ORN_CALENDAR', cnt: 5256,
    src: 'view/oron/masterplan/master/ornmpcalendar/OrnMpCalendar.jsx',
    search: [
      { key: 'plantCd', label: 'ON_MP_PLANT', type: 'multiSelect', width: 150 },
      { key: 'partCd',  label: 'ON_MP_PART',  type: 'multiSelect', width: 150 },
      { key: 'lineCd',  label: 'ON_MP_LINE',  type: 'multiSelect', width: 150 },
      { key: 'fromDt',  label: 'FROM_DT',     type: 'date',        width: 140 },
    ],
    buttons: ['save', 'excel'],
    cols: [
      { name: 'PLANT_CD',         h: 'ON_MP_PLANT_CD', w: 60, a: 'center' },
      { name: 'PLANT_NM',         h: 'ON_MP_PLANT_NM', w: 80, a: 'center' },
      { name: 'LINE_CD',          h: 'ON_MP_LINE_CD',  w: 60, a: 'center' },
      { name: 'LINE_NM',          h: 'ON_MP_LINE_NM',  w: 100, a: 'left'  },
      { name: 'CAL_WEEK',         h: 'CAL_WEEK',       w: 80, a: 'center' },
      { name: 'CTG_NM',           h: 'CTG_NM',         w: 90, a: 'center' },
      { name: 'MON',              h: 'MON',            w: 70, a: 'right', edit: true },
      { name: 'TUE',              h: 'TUE',            w: 70, a: 'right', edit: true },
      { name: 'WED',              h: 'WED',            w: 70, a: 'right', edit: true },
      { name: 'THU',              h: 'THU',            w: 70, a: 'right', edit: true },
      { name: 'FRI',              h: 'FRI',            w: 70, a: 'right', edit: true },
      { name: 'SAT',              h: 'SAT',            w: 70, a: 'right', edit: true },
      { name: 'SUN',              h: 'SUN',            w: 70, a: 'right', edit: true },
    ],
    rows: [
      { PLANT_CD:'P1', PLANT_NM:'P1 공장', LINE_CD:'L01', LINE_NM:'L01 충전 라인 1', CAL_WEEK:'2026-W23', CTG_NM:'기본가동', MON:16, TUE:16, WED:16, THU:16, FRI:16, SAT: 8, SUN: 0 },
      { PLANT_CD:'P1', PLANT_NM:'P1 공장', LINE_CD:'L01', LINE_NM:'L01 충전 라인 1', CAL_WEEK:'2026-W23', CTG_NM:'CIP',     MON: 2, TUE: 0, WED: 0, THU: 0, FRI: 2, SAT: 0, SUN: 0 },
      { PLANT_CD:'P1', PLANT_NM:'P1 공장', LINE_CD:'L02', LINE_NM:'L02 충전 라인 2', CAL_WEEK:'2026-W23', CTG_NM:'기본가동', MON:16, TUE:16, WED:16, THU:16, FRI:16, SAT: 8, SUN: 0 },
      { PLANT_CD:'P2', PLANT_NM:'P2 공장', LINE_CD:'L21', LINE_NM:'L21 압출 라인',   CAL_WEEK:'2026-W23', CTG_NM:'기본가동', MON:24, TUE:24, WED:24, THU:24, FRI:24, SAT:24, SUN: 0 },
      { PLANT_CD:'P3', PLANT_NM:'P3 공장', LINE_CD:'L31', LINE_NM:'L31 OEM 라인',   CAL_WEEK:'2026-W23', CTG_NM:'기본가동', MON: 8, TUE: 8, WED: 8, THU: 8, FRI: 8, SAT: 0, SUN: 0 },
    ],
  },
  {
    key: 'jcItem', label: '작업교체 (품목간)', menu: 'UI_MP_JC_TIME', cnt: 142,
    src: 'view/oron/masterplan/master/ornmpjctime/OrnMpJcTime.jsx (jc_change_btw_item)',
    search: [
      { key: 'plantCd', label: 'FP_PLANT', type: 'multiSelect', width: 150 },
      { key: 'partCd',  label: 'FP_PART',  type: 'multiSelect', width: 150 },
      { key: 'lineCd',  label: 'FP_LINE',  type: 'multiSelect', width: 150 },
    ],
    buttons: ['add', 'del', 'save', 'excel'],
    cols: [
      { name: 'PLANT_CD',     h: 'PLANT_CD',     w:  60, a: 'center' },
      { name: 'PLANT_NM',     h: 'PLANT_NM',     w:  80, a: 'center' },
      { name: 'LINE_CD',      h: 'LINE_CD',      w:  60, a: 'center' },
      { name: 'LINE_NM',      h: 'LINE_NM',      w:  90, a: 'left'   },
      { name: 'FROM_ITEM_CD', h: 'FROM_ITEM_CD', w: 100, a: 'center', action: true },
      { name: 'FROM_ITEM_NM', h: 'FROM_ITEM_NM', w: 180, a: 'left'   },
      { name: 'TO_ITEM_CD',   h: 'TO_ITEM_CD',   w: 100, a: 'center', action: true },
      { name: 'TO_ITEM_NM',   h: 'TO_ITEM_NM',   w: 180, a: 'left'   },
      { name: 'JC_TIME',      h: 'JC_TIME (분)', w:  90, a: 'right',  edit: true },
      { name: 'USE_YN',       h: 'USE_YN',       w:  60, a: 'center', bool: true, edit: true },
    ],
    rows: [
      { PLANT_CD:'P1', PLANT_NM:'P1 공장', LINE_CD:'L01', LINE_NM:'L01 충전 라인 1', FROM_ITEM_CD:'F01001', FROM_ITEM_NM:'완제품-FERT 샘플 1', TO_ITEM_CD:'F01002', TO_ITEM_NM:'완제품-FERT 샘플 2', JC_TIME:30, USE_YN:true },
      { PLANT_CD:'P1', PLANT_NM:'P1 공장', LINE_CD:'L01', LINE_NM:'L01 충전 라인 1', FROM_ITEM_CD:'F01002', FROM_ITEM_NM:'완제품-FERT 샘플 2', TO_ITEM_CD:'F01003', TO_ITEM_NM:'완제품-FERT 샘플 3', JC_TIME:45, USE_YN:true },
      { PLANT_CD:'P1', PLANT_NM:'P1 공장', LINE_CD:'L02', LINE_NM:'L02 충전 라인 2', FROM_ITEM_CD:'F01003', FROM_ITEM_NM:'완제품-FERT 샘플 3', TO_ITEM_CD:'F01001', TO_ITEM_NM:'완제품-FERT 샘플 1', JC_TIME:20, USE_YN:true },
      { PLANT_CD:'P2', PLANT_NM:'P2 공장', LINE_CD:'L21', LINE_NM:'L21 압출 라인',   FROM_ITEM_CD:'F02001', FROM_ITEM_NM:'완제품-FERT 샘플 4', TO_ITEM_CD:'F02002', TO_ITEM_NM:'완제품-FERT 샘플 5', JC_TIME:60, USE_YN:false },
    ],
  },
  {
    key: 'byProduct', label: '동시생산제약', menu: 'UI_MP_ORN_BY_PRODUCT', cnt: 28,
    src: 'view/oron/factoryplan/master/ornmpbyproduct/OrnMpByProduct.jsx',
    search: [
      { key: 'plantCd', label: 'FP_PLANT', type: 'multiSelect', width: 150 },
      { key: 'partCd',  label: 'FP_PART',  type: 'multiSelect', width: 150 },
      { key: 'lineCd',  label: 'FP_LINE',  type: 'multiSelect', width: 150 },
    ],
    buttons: ['add', 'del', 'save', 'excel'],
    cols: [
      { name: 'CONST_SEQ',      h: 'CONST_SEQ',      w:  80, a: 'center', edit: true },
      { name: 'PLANT_CD',       h: 'PLANT_CD',       w:  60, a: 'center' },
      { name: 'PLANT_NM',       h: 'PLANT_NM',       w:  80, a: 'center' },
      { name: 'LINE_CD',        h: 'LINE_CD',        w:  60, a: 'center' },
      { name: 'LINE_NM',        h: 'LINE_NM',        w:  90, a: 'left'   },
      { name: 'ITEM_CD',        h: 'ITEM_CD',        w:  90, a: 'center', action: true },
      { name: 'ITEM_NM',        h: 'ITEM_NM',        w: 220, a: 'left'   },
      { name: 'PROD_RATE',      h: 'PROD_RATE',      w:  90, a: 'right',  edit: true },
      { name: 'RATE_UOM_CD',    h: 'RATE_UOM_CD',    w:  80, a: 'center', edit: true },
      { name: 'SINGLE_PROD_YN', h: 'SINGLE_PROD_YN', w:  80, a: 'center', bool: true, edit: true },
      { name: 'USE_YN',         h: 'USE_YN',         w:  60, a: 'center', bool: true, edit: true },
      { name: 'DESCRIP',        h: 'DESCRIP',        w: 220, a: 'left',   edit: true },
    ],
    rows: [
      { CONST_SEQ:'001', PLANT_CD:'P1', PLANT_NM:'P1 공장', LINE_CD:'L01', LINE_NM:'L01 충전 라인 1', ITEM_CD:'F01001', ITEM_NM:'완제품-FERT 샘플 1', PROD_RATE:1.0,  RATE_UOM_CD:'EA/HR', SINGLE_PROD_YN:false, USE_YN:true, DESCRIP:'음료 1 + 부산물 동시 생산' },
      { CONST_SEQ:'001', PLANT_CD:'P1', PLANT_NM:'P1 공장', LINE_CD:'L01', LINE_NM:'L01 충전 라인 1', ITEM_CD:'F01002', ITEM_NM:'완제품-FERT 샘플 2', PROD_RATE:0.25, RATE_UOM_CD:'EA/HR', SINGLE_PROD_YN:false, USE_YN:true, DESCRIP:'음료 1 + 부산물 동시 생산' },
      { CONST_SEQ:'002', PLANT_CD:'P2', PLANT_NM:'P2 공장', LINE_CD:'L21', LINE_NM:'L21 압출 라인',   ITEM_CD:'F02001', ITEM_NM:'완제품-FERT 샘플 4', PROD_RATE:1.0,  RATE_UOM_CD:'EA/HR', SINGLE_PROD_YN:true,  USE_YN:true, DESCRIP:'단독 생산' },
    ],
  },
];

export default function OronMpCapacityMockup() {
  return (
    <MockShell
      patternCode="oron_mp_capacity"
      patternLabel="ORON — MP 생산능력 (BOR / 공용설비제약 / 캘린더 / 작업교체시간 / 동시생산제약)"
      layoutCategory="LAYOUT_SINGLE"
      description="5개 운영 화면 (UI_MP_ORN_BOR / UI_MP_ORN_BOR_SET / UI_MP_ORN_CALENDAR / UI_MP_JC_TIME / UI_MP_ORN_BY_PRODUCT) 통합. BOR 는 Line×Item 의 생산 능력 (ORG_CAPA / BOX_CAPA / KG_CAPA, 다중 UOM), CALENDAR 는 주별 가동시간 매트릭스 (mergeRule 로 PLANT/LINE 병합), JC_TIME 은 품목간 교체시간 (action 버튼 → PopItem)."
    >
      <MockGridScaffold tabs={TABS} footer="CONST_SEQ 동일 행 = 동일 제약 그룹 · ASYN_RMK = 비동기 사용 메모" />
    </MockShell>
  );
}
