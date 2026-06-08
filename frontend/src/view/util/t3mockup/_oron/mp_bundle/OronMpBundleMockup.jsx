import React from 'react';
import MockShell from '../../_shared/MockShell';
import MockGridScaffold from '../_shared/MockGridScaffold';

// ORON — MP Bundle/OEM (4개 화면)
//  - UI_MP_ORN_BUNDLE_REQ    번들작업관리      — 좌(라인 능력 BOX/KG_CAPA) + 우(GIFT_SET × LINE × ITEM 번들 구성)
//  - UI_MP_ORN_BUNDLE_PLAN   번들 반제품 계획   — 번들용 반제품 계획 (요청량/공정량/잔량)
//  - UI_MP_ORN_OEM_PROD_REQ  OEM 제품 생산 요청 — BRAND × ITEM × DIVS (요청량/생산능력) × 동적 DATE
//  - UI_MP_ORN_PLAN_ACT_INQ  생산계획 대비 실적 — PLANT/PART/LINE × ITEM × SHIFT_DIVS × MEASURE × DATE
//
// 번들 = 여러 제품 1개 포장세트로 (gift set, 프로모션). OEM = 자사 외 brand 제품 위탁생산.

const DATE_COLS = ['2026-W23','2026-W24','2026-W25','2026-W26','2026-W27'];

const TABS = [
  {
    key: 'bundleReq', label: '번들 작업관리', menu: 'UI_MP_ORN_BUNDLE_REQ', cnt: 124,
    src: 'view/oron/factoryplan/planresult/ornmpbundlereq/OrnMpBundleReq.jsx',
    search: [
      { key: 'planScope', label: 'PLAN_SCOPE', type: 'select',      width: 130, options: ['ORN_MP'] },
      { key: 'verCd',     label: 'VERSION',    type: 'select',      width: 150, options: ['MAIN_V0006'] },
      { key: 'plantCd',   label: 'FP_PLANT',   type: 'multiSelect', width: 150 },
      { key: 'lineCd',    label: 'FP_LINE',    type: 'multiSelect', width: 150 },
    ],
    buttons: ['save', 'excel'],
    cols: [
      { name: 'LINE_CD',     h: 'LINE_CD',     w:  80, a: 'center' },
      { name: 'LINE_NM',     h: 'LINE_NM',     w: 130, a: 'left'   },
      { name: 'GIFT_SET_NM', h: 'GIFT_SET_NM', w: 180, a: 'left'   },
      { name: 'ITEM_CD',     h: 'MP_ITEM_CD',  w:  90, a: 'center' },
      { name: 'ITEM_NM',     h: 'MP_ITEM_NM',  w: 220, a: 'left'   },
      { name: 'FLAV_NM',     h: 'FLAV_NM',     w:  80, a: 'center' },
      { name: 'KG_CAPA',     h: 'KG_CAPA',     w:  90, a: 'right'  },
      { name: 'BOX_CAPA',    h: 'BOX_CAPA',    w:  90, a: 'right'  },
      ...DATE_COLS.map((d) => ({ name: d, h: d, w: 90, a: 'right', edit: true })),
    ],
    rows: [
      { LINE_CD:'L11', LINE_NM:'L11 포장 라인 1', GIFT_SET_NM:'여름 한정 SET A', ITEM_CD:'F01001', ITEM_NM:'완제품-FERT 샘플 1', FLAV_NM:'기본', KG_CAPA:1775, BOX_CAPA:208.33, '2026-W23':100, '2026-W24':100, '2026-W25':120, '2026-W26':120, '2026-W27':150 },
      { LINE_CD:'L11', LINE_NM:'L11 포장 라인 1', GIFT_SET_NM:'여름 한정 SET A', ITEM_CD:'F01002', ITEM_NM:'완제품-FERT 샘플 2', FLAV_NM:'레몬', KG_CAPA:2100, BOX_CAPA:175.00, '2026-W23':100, '2026-W24':100, '2026-W25':120, '2026-W26':120, '2026-W27':150 },
      { LINE_CD:'L11', LINE_NM:'L11 포장 라인 1', GIFT_SET_NM:'여름 한정 SET A', ITEM_CD:'F01003', ITEM_NM:'완제품-FERT 샘플 3', FLAV_NM:'기본', KG_CAPA:3000, BOX_CAPA:500.00, '2026-W23':100, '2026-W24':100, '2026-W25':120, '2026-W26':120, '2026-W27':150 },
      { LINE_CD:'L12', LINE_NM:'L12 포장 라인 2', GIFT_SET_NM:'추석 SET B',     ITEM_CD:'F02001', ITEM_NM:'완제품-FERT 샘플 4', FLAV_NM:'카카오',KG_CAPA: 960, BOX_CAPA:222.22, '2026-W23': 50, '2026-W24': 50, '2026-W25': 80, '2026-W26': 80, '2026-W27':100 },
      { LINE_CD:'L12', LINE_NM:'L12 포장 라인 2', GIFT_SET_NM:'추석 SET B',     ITEM_CD:'F02002', ITEM_NM:'완제품-FERT 샘플 5', FLAV_NM:'치즈', KG_CAPA: 300, BOX_CAPA: 62.50, '2026-W23': 50, '2026-W24': 50, '2026-W25': 80, '2026-W26': 80, '2026-W27':100 },
    ],
  },
  {
    key: 'bundlePlan', label: '번들 반제품 계획', menu: 'UI_MP_ORN_BUNDLE_PLAN', cnt: 92,
    src: 'view/oron/factoryplan/planresult/ornmpbundleplan/OrnMpBundlePlan.jsx',
    search: [
      { key: 'planScope', label: 'PLAN_SCOPE', type: 'select',      width: 130, options: ['ORN_MP'] },
      { key: 'verCd',     label: 'VERSION',    type: 'select',      width: 150, options: ['MAIN_V0006'] },
      { key: 'plantCd',   label: 'FP_PLANT',   type: 'multiSelect', width: 150 },
      { key: 'lineCd',    label: 'FP_LINE',    type: 'multiSelect', width: 150 },
      { key: 'itemVal',   label: 'PK_HALB',    type: 'text',        width: 170 },
    ],
    buttons: ['save', 'excel'],
    cols: [
      { name: 'PLANT_NM',  h: 'PLANT_NM',  w: 100, a: 'center' },
      { name: 'LINE_NM',   h: 'LINE_NM',   w: 130, a: 'left'   },
      { name: 'ITEM_CD',   h: 'HALB_CD',   w:  90, a: 'center' },
      { name: 'ITEM_NM',   h: 'HALB_NM',   w: 200, a: 'left'   },
      { name: 'MEASURE',   h: 'MEASURE',   w: 100, a: 'center' },
      ...DATE_COLS.map((d) => ({ name: d, h: d, w: 90, a: 'right', edit: true })),
    ],
    rows: [
      { PLANT_NM:'P1 공장', LINE_NM:'L01 충전 라인 1', ITEM_CD:'H10001', ITEM_NM:'반제품-HALB 시럽 베이스 1', MEASURE:'요청량',  '2026-W23':500, '2026-W24':500, '2026-W25':600, '2026-W26':600, '2026-W27':750 },
      { PLANT_NM:'P1 공장', LINE_NM:'L01 충전 라인 1', ITEM_CD:'H10001', ITEM_NM:'반제품-HALB 시럽 베이스 1', MEASURE:'공정량',  '2026-W23':500, '2026-W24':500, '2026-W25':600, '2026-W26':600, '2026-W27':750 },
      { PLANT_NM:'P1 공장', LINE_NM:'L01 충전 라인 1', ITEM_CD:'H10001', ITEM_NM:'반제품-HALB 시럽 베이스 1', MEASURE:'잔량',    '2026-W23':  0, '2026-W24':  0, '2026-W25':  0, '2026-W26':  0, '2026-W27':  0 },
      { PLANT_NM:'P1 공장', LINE_NM:'L01 충전 라인 1', ITEM_CD:'H10002', ITEM_NM:'반제품-HALB 시럽 베이스 2', MEASURE:'요청량',  '2026-W23':400, '2026-W24':400, '2026-W25':480, '2026-W26':480, '2026-W27':600 },
      { PLANT_NM:'P1 공장', LINE_NM:'L01 충전 라인 1', ITEM_CD:'H10002', ITEM_NM:'반제품-HALB 시럽 베이스 2', MEASURE:'공정량',  '2026-W23':400, '2026-W24':400, '2026-W25':400, '2026-W26':480, '2026-W27':600 },
      { PLANT_NM:'P1 공장', LINE_NM:'L01 충전 라인 1', ITEM_CD:'H10002', ITEM_NM:'반제품-HALB 시럽 베이스 2', MEASURE:'잔량',    '2026-W23':  0, '2026-W24':  0, '2026-W25': 80, '2026-W26':  0, '2026-W27':  0 },
    ],
  },
  {
    key: 'oemReq', label: 'OEM 제품 생산 요청', menu: 'UI_MP_ORN_OEM_PROD_REQ', cnt: 48,
    src: 'view/oron/masterplan/planningsimulation/ornmpoemprodreq/OrnMpOemProdReq.jsx',
    search: [
      { key: 'planScope', label: 'PLAN_SCOPE', type: 'select',      width: 130, options: ['ORN_MP'] },
      { key: 'verCd',     label: 'VERSION',    type: 'select',      width: 150, options: ['MAIN_V0006'] },
      { key: 'brandCd',   label: 'BRAND',      type: 'multiSelect', width: 150, options: ['OEM_X','OEM_Y'] },
    ],
    buttons: ['save', 'excel'],
    cols: [
      { name: 'BRAND_NM', h: 'BRAND_NM', w: 130, a: 'center' },
      { name: 'ITEM_CD',  h: 'ITEM_CD',  w:  90, a: 'center' },
      { name: 'ITEM_NM',  h: 'ITEM_NM',  w: 240, a: 'left'   },
      { name: 'DIVS_NM',  h: 'DIVS_NM',  w: 100, a: 'center' },
      { name: 'BOX_CAPA', h: 'BOX_CAPA', w:  90, a: 'right'  },
      { name: 'KG_CAPA',  h: 'KG_CAPA',  w:  90, a: 'right'  },
      ...DATE_COLS.map((d) => ({ name: d, h: d, w: 90, a: 'right', edit: true })),
    ],
    rows: [
      { BRAND_NM:'OEM_X 위탁브랜드', ITEM_CD:'F03001', ITEM_NM:'OEM-X 위탁 제품 1', DIVS_NM:'요청량', BOX_CAPA: 222.22, KG_CAPA: 960, '2026-W23': 200, '2026-W24': 200, '2026-W25': 220, '2026-W26': 220, '2026-W27': 240 },
      { BRAND_NM:'OEM_X 위탁브랜드', ITEM_CD:'F03001', ITEM_NM:'OEM-X 위탁 제품 1', DIVS_NM:'확정량', BOX_CAPA: 222.22, KG_CAPA: 960, '2026-W23': 200, '2026-W24': 200, '2026-W25': 220, '2026-W26': 220, '2026-W27': 240 },
      { BRAND_NM:'OEM_X 위탁브랜드', ITEM_CD:'F03002', ITEM_NM:'OEM-X 위탁 제품 2', DIVS_NM:'요청량', BOX_CAPA:  62.50, KG_CAPA: 300, '2026-W23': 100, '2026-W24': 100, '2026-W25': 120, '2026-W26': 120, '2026-W27': 130 },
      { BRAND_NM:'OEM_X 위탁브랜드', ITEM_CD:'F03002', ITEM_NM:'OEM-X 위탁 제품 2', DIVS_NM:'확정량', BOX_CAPA:  62.50, KG_CAPA: 300, '2026-W23': 100, '2026-W24': 100, '2026-W25': 120, '2026-W26': 120, '2026-W27': 130 },
      { BRAND_NM:'OEM_Y 위탁브랜드', ITEM_CD:'F03010', ITEM_NM:'OEM-Y 위탁 제품 A', DIVS_NM:'요청량', BOX_CAPA: 175.00, KG_CAPA:2100, '2026-W23': 150, '2026-W24': 150, '2026-W25': 180, '2026-W26': 180, '2026-W27': 200 },
    ],
  },
  {
    key: 'planActInq', label: '생산계획 대비 실적', menu: 'UI_MP_ORN_PLAN_ACT_INQ', cnt: 5284,
    src: 'view/oron/factoryplan/planresult/ornmpplanactinq/OrnMpPlanActInq.jsx',
    search: [
      { key: 'planScope', label: 'PLAN_SCOPE', type: 'select',      width: 130, options: ['ORN_MP'] },
      { key: 'verCd',     label: 'VERSION',    type: 'select',      width: 150, options: ['MAIN_V0006'] },
      { key: 'plantCd',   label: 'FP_PLANT',   type: 'multiSelect', width: 150 },
      { key: 'partCd',    label: 'FP_PART',    type: 'multiSelect', width: 150 },
      { key: 'lineCd',    label: 'FP_LINE',    type: 'multiSelect', width: 150 },
      { key: 'shift',     label: 'SHIFT_DIVS', type: 'multiSelect', width: 130, options: ['DAY','NIGHT'] },
      { key: 'fromDt',    label: 'FROM_DT',    type: 'date',        width: 140 },
    ],
    buttons: ['excel'],
    cols: [
      { name: 'PLANT_NM',      h: 'PLANT_NM',     w: 100, a: 'center' },
      { name: 'PART_NM',       h: 'MP_PART_NM',   w: 150, a: 'left'   },
      { name: 'LINE_NM',       h: 'LINE_NM',      w: 130, a: 'left'   },
      { name: 'ITEM_CD',       h: 'MP_ITEM_CD',   w:  90, a: 'center' },
      { name: 'ITEM_NM',       h: 'MP_ITEM_NM',   w: 220, a: 'left'   },
      { name: 'SHIFT_DIVS_NM', h: 'SHIFT_DIVS',   w:  80, a: 'center' },
      { name: 'MEASURE',       h: 'MEASURE',      w: 100, a: 'center' },
      ...DATE_COLS.map((d) => ({ name: d, h: d, w: 90, a: 'right' })),
    ],
    rows: [
      { PLANT_NM:'P1 공장', PART_NM:'A1 동', LINE_NM:'L01 충전 라인 1', ITEM_CD:'F01001', ITEM_NM:'완제품-FERT 샘플 1', SHIFT_DIVS_NM:'DAY',   MEASURE:'PLAN', '2026-W23':210, '2026-W24':210, '2026-W25':210, '2026-W26':230, '2026-W27':240 },
      { PLANT_NM:'P1 공장', PART_NM:'A1 동', LINE_NM:'L01 충전 라인 1', ITEM_CD:'F01001', ITEM_NM:'완제품-FERT 샘플 1', SHIFT_DIVS_NM:'DAY',   MEASURE:'ACT',  '2026-W23':205, '2026-W24':208, '2026-W25':215, '2026-W26':225, '2026-W27': 0 },
      { PLANT_NM:'P1 공장', PART_NM:'A1 동', LINE_NM:'L01 충전 라인 1', ITEM_CD:'F01001', ITEM_NM:'완제품-FERT 샘플 1', SHIFT_DIVS_NM:'NIGHT', MEASURE:'PLAN', '2026-W23':210, '2026-W24':210, '2026-W25':210, '2026-W26':230, '2026-W27':240 },
      { PLANT_NM:'P1 공장', PART_NM:'A1 동', LINE_NM:'L01 충전 라인 1', ITEM_CD:'F01001', ITEM_NM:'완제품-FERT 샘플 1', SHIFT_DIVS_NM:'NIGHT', MEASURE:'ACT',  '2026-W23':215, '2026-W24':210, '2026-W25':208, '2026-W26':230, '2026-W27': 0 },
      { PLANT_NM:'P2 공장', PART_NM:'A2 동', LINE_NM:'L21 압출 라인',   ITEM_CD:'F02001', ITEM_NM:'완제품-FERT 샘플 4', SHIFT_DIVS_NM:'DAY',   MEASURE:'PLAN', '2026-W23':500, '2026-W24':500, '2026-W25':500, '2026-W26':550, '2026-W27':550 },
      { PLANT_NM:'P2 공장', PART_NM:'A2 동', LINE_NM:'L21 압출 라인',   ITEM_CD:'F02001', ITEM_NM:'완제품-FERT 샘플 4', SHIFT_DIVS_NM:'DAY',   MEASURE:'ACT',  '2026-W23':495, '2026-W24':480, '2026-W25':510, '2026-W26':555, '2026-W27': 0 },
    ],
  },
];

export default function OronMpBundleMockup() {
  return (
    <MockShell
      patternCode="oron_mp_bundle"
      patternLabel="ORON — MP Bundle/OEM (4개 화면)"
      layoutCategory="LAYOUT_SINGLE"
      description="4개 운영 화면 통합. BUNDLE_REQ 는 GIFT_SET 단위 (여러 제품 1세트로 묶기) — LINE × ITEM × CAPA + DATE. BUNDLE_PLAN 은 번들용 반제품 계획 (요청량/공정량/잔량). OEM_PROD_REQ 는 위탁 brand 제품 생산 요청 (BRAND × ITEM × DIVS_NM). PLAN_ACT_INQ 는 계획 대비 실적 조회 — SHIFT_DIVS × MEASURE PLAN/ACT × DATE."
    >
      <MockGridScaffold tabs={TABS} footer="번들 = gift set / 프로모션용 1포장 다제품 · OEM = 위탁생산 · MEASURE PLAN vs ACT 차이 = 달성률" />
    </MockShell>
  );
}
