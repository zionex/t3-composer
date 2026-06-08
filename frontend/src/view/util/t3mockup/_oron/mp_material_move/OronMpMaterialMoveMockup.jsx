import React from 'react';
import MockShell from '../../_shared/MockShell';
import MockGridScaffold from '../_shared/MockGridScaffold';

// ORON — MP 자재/반제품 이동 (4개 화면)
//  - UI_MP_ORN_HALB_MOVE    반제품 공장이동 요청 — KEY_PLANT/KEY_ITEM (수급기준) + MEASURE × 동적 DATE
//  - UI_MP_ORN_MAT_MOVE     원부자재 공장이동 요청 (내자)  — MAT_CD/NM × PLANT_NM × STOCK_QTY × MEASURE × DATE
//  - UI_MP_ORN_MAT_MOVE_VN  외자 이동요청 (공장/VN)        — SL_NM × SL_STK_TOT/SL_STK_QTY/UNCLEARED_QTY + EA_KG/PLT_QTY
//  - UI_MP_ORN_MAT_MOVE_HQ  외자 이동확정 (본사)           — VN 화면과 유사, 본사 확정 추가
// 공통 패턴: mergeRule 로 PLANT/MAT 행 병합, MEASURE_NM 으로 IN/OUT/EOH 분리, 동적 DATE 컬럼

const DATE_COLS = ['2026-W23','2026-W24','2026-W25','2026-W26','2026-W27'];

const TABS = [
  {
    key: 'halbMove', label: '반제품 공장이동', menu: 'UI_MP_ORN_HALB_MOVE', cnt: 217,
    src: 'view/oron/factoryplan/planresult/ornmphalbmove/OrnMpHalbMove.jsx',
    search: [
      { key: 'planScope', label: 'PLAN_SCOPE', type: 'select',      width: 130, options: ['ORN_MP'] },
      { key: 'verCd',     label: 'VERSION',    type: 'select',      width: 150, options: ['MAIN_V0006'] },
      { key: 'keyPlant',  label: 'MP_SUPPLY_PLANT', type: 'multiSelect', width: 170 },
      { key: 'plantCd',   label: 'FP_PLANT',   type: 'multiSelect', width: 150 },
      { key: 'itemVal',   label: 'KEY_ITEM',   type: 'text',        width: 170 },
    ],
    buttons: ['save', 'excel'],
    cols: [
      { name: 'KEY_PLANT_NM',h: 'MP_SUPPLY_PLANT', w: 100, a: 'center' },
      { name: 'KEY_ITEM',    h: 'KEY_ITEM',        w:  90, a: 'center' },
      { name: 'KEY_ITEM_NM', h: 'KEY_ITEM_NM',     w: 180, a: 'left'   },
      { name: 'ITEM_GUBUN',  h: 'ITEM_GUBUN',      w:  80, a: 'center' },
      { name: 'ITEM_CD',     h: 'MP_ITEM_CD',      w:  90, a: 'center' },
      { name: 'ITEM_NM',     h: 'MP_ITEM_NM',      w: 180, a: 'left'   },
      { name: 'PLANT_NM',    h: 'PLANT_NM',        w:  90, a: 'center' },
      { name: 'LINE_NM',     h: 'LINE_NM',         w: 130, a: 'left'   },
      { name: 'STOCK_QTY',   h: 'ORN_PLANT_BOH',   w:  90, a: 'right'  },
      { name: 'MEASURE_NM',  h: 'CTG_NM',          w: 100, a: 'center' },
      ...DATE_COLS.map((d) => ({ name: d, h: d, w: 90, a: 'right', edit: true })),
    ],
    rows: [
      { KEY_PLANT_NM:'P1 본사', KEY_ITEM:'H10001', KEY_ITEM_NM:'반제품-HALB 시럽 베이스 1', ITEM_GUBUN:'요청', ITEM_CD:'H10001', ITEM_NM:'반제품-HALB 시럽 베이스 1', PLANT_NM:'P2 공장', LINE_NM:'L21 압출 라인', STOCK_QTY:500.00, MEASURE_NM:'요청량', '2026-W23':100, '2026-W24':100, '2026-W25':150, '2026-W26':150, '2026-W27':200 },
      { KEY_PLANT_NM:'P1 본사', KEY_ITEM:'H10001', KEY_ITEM_NM:'반제품-HALB 시럽 베이스 1', ITEM_GUBUN:'요청', ITEM_CD:'H10001', ITEM_NM:'반제품-HALB 시럽 베이스 1', PLANT_NM:'P2 공장', LINE_NM:'L21 압출 라인', STOCK_QTY:500.00, MEASURE_NM:'확정량', '2026-W23':100, '2026-W24': 80, '2026-W25':100, '2026-W26':150, '2026-W27':200 },
      { KEY_PLANT_NM:'P1 본사', KEY_ITEM:'H10002', KEY_ITEM_NM:'반제품-HALB 시럽 베이스 2', ITEM_GUBUN:'요청', ITEM_CD:'H10002', ITEM_NM:'반제품-HALB 시럽 베이스 2', PLANT_NM:'P3 공장', LINE_NM:'L31 OEM 라인',  STOCK_QTY:300.00, MEASURE_NM:'요청량', '2026-W23': 50, '2026-W24': 50, '2026-W25':100, '2026-W26':100, '2026-W27':100 },
      { KEY_PLANT_NM:'P1 본사', KEY_ITEM:'H10002', KEY_ITEM_NM:'반제품-HALB 시럽 베이스 2', ITEM_GUBUN:'요청', ITEM_CD:'H10002', ITEM_NM:'반제품-HALB 시럽 베이스 2', PLANT_NM:'P3 공장', LINE_NM:'L31 OEM 라인',  STOCK_QTY:300.00, MEASURE_NM:'확정량', '2026-W23': 50, '2026-W24': 50, '2026-W25':100, '2026-W26':100, '2026-W27':100 },
    ],
  },
  {
    key: 'matMove', label: '원부자재 공장이동 (내자)', menu: 'UI_MP_ORN_MAT_MOVE', cnt: 142,
    src: 'view/oron/factoryplan/matmgmt/ornmpmatmove/OrnMpMatMove.jsx',
    search: [
      { key: 'planScope', label: 'PLAN_SCOPE', type: 'select',      width: 130, options: ['ORN_MP'] },
      { key: 'verCd',     label: 'VERSION',    type: 'select',      width: 150, options: ['MAIN_V0006'] },
      { key: 'plantCd',   label: 'FP_PLANT',   type: 'multiSelect', width: 150 },
    ],
    buttons: ['save', 'excel'],
    cols: [
      { name: 'MAT_CD',     h: 'MAT_CD',        w:  90, a: 'center' },
      { name: 'MAT_NM',     h: 'MAT_NM',        w: 220, a: 'left'   },
      { name: 'PLANT_NM',   h: 'PLANT_NM',      w:  90, a: 'center' },
      { name: 'STOCK_QTY',  h: 'ORN_PLANT_BOH', w:  90, a: 'right'  },
      { name: 'MEASURE_NM', h: 'CTG_NM',        w: 100, a: 'center' },
      ...DATE_COLS.map((d) => ({ name: d, h: d, w: 90, a: 'right', edit: true })),
    ],
    rows: [
      { MAT_CD:'M00010', MAT_NM:'원자재-RAW 설탕',        PLANT_NM:'P1 공장', STOCK_QTY:8200.00, MEASURE_NM:'요청량', '2026-W23':1000, '2026-W24':1000, '2026-W25':1500, '2026-W26':1500, '2026-W27':2000 },
      { MAT_CD:'M00010', MAT_NM:'원자재-RAW 설탕',        PLANT_NM:'P1 공장', STOCK_QTY:8200.00, MEASURE_NM:'확정량', '2026-W23':1000, '2026-W24':1000, '2026-W25':1500, '2026-W26':1500, '2026-W27':2000 },
      { MAT_CD:'M00020', MAT_NM:'포장재-PACK 캔 355ml',   PLANT_NM:'P1 공장', STOCK_QTY:32000.00,MEASURE_NM:'요청량', '2026-W23':5000, '2026-W24':5000, '2026-W25':5500, '2026-W26':5500, '2026-W27':6000 },
      { MAT_CD:'M00020', MAT_NM:'포장재-PACK 캔 355ml',   PLANT_NM:'P1 공장', STOCK_QTY:32000.00,MEASURE_NM:'확정량', '2026-W23':5000, '2026-W24':4800, '2026-W25':5500, '2026-W26':5500, '2026-W27':6000 },
    ],
  },
  {
    key: 'matMoveVn', label: '외자 이동요청 (VN)', menu: 'UI_MP_ORN_MAT_MOVE_VN', cnt: 86,
    src: 'view/oron/factoryplan/matmgmt/ornmpmatmovevn/OrnMpMatMoveVn.jsx',
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
      { name: 'MOVE_MEMO',     h: 'MOVE_MEMO',     w: 130, a: 'left',   edit: true },
      { name: 'MAT_CD',        h: 'PK_MAT_CD',     w:  90, a: 'center' },
      { name: 'MAT_NM',        h: 'PK_MAT_NM',     w: 220, a: 'left'   },
      { name: 'SL_NM',         h: 'SL_NM',         w: 110, a: 'left'   },
      { name: 'SL_STK_TOT',    h: 'SL_STK_TOT',    w:  90, a: 'right'  },
      { name: 'SL_STK_QTY',    h: 'SL_STK_QTY',    w:  90, a: 'right'  },
      { name: 'UNCLEARED_QTY', h: 'UNCLEARED_QTY', w:  90, a: 'right'  },
      { name: 'STOCK_QTY',     h: 'ORN_PLANT_BOH', w:  90, a: 'right'  },
      { name: 'EA_KG',         h: 'EA_KG',         w:  80, a: 'right'  },
      { name: 'PLT_QTY',       h: 'PLT_QTY',       w:  80, a: 'right'  },
    ],
    rows: [
      { MOVE_MEMO:'다음 주 출하 예정', MAT_CD:'M00010', MAT_NM:'원자재-RAW 설탕',        SL_NM:'VN-SL01 자재창고', SL_STK_TOT:5000.000, SL_STK_QTY:4500.000, UNCLEARED_QTY:500.000, STOCK_QTY:4500.000, EA_KG:1.000,  PLT_QTY:1000.000 },
      { MOVE_MEMO:'',                  MAT_CD:'M00011', MAT_NM:'원자재-RAW 시트레이트',  SL_NM:'VN-SL01 자재창고', SL_STK_TOT: 800.000, SL_STK_QTY: 750.000, UNCLEARED_QTY: 50.000, STOCK_QTY: 750.000, EA_KG:1.000,  PLT_QTY: 500.000 },
      { MOVE_MEMO:'긴급',              MAT_CD:'M00020', MAT_NM:'포장재-PACK 캔 355ml',   SL_NM:'VN-SL02 포장창고', SL_STK_TOT:20000.000,SL_STK_QTY:18500.000,UNCLEARED_QTY:1500.000,STOCK_QTY:18500.000,EA_KG:0.012, PLT_QTY:5000.000 },
    ],
  },
  {
    key: 'matMoveHq', label: '외자 이동확정 (본사)', menu: 'UI_MP_ORN_MAT_MOVE_HQ', cnt: 86,
    src: 'view/oron/factoryplan/matmgmt/ornmpmatmovehq/OrnMpMatMoveHq.jsx',
    search: [
      { key: 'planScope', label: 'PLAN_SCOPE', type: 'select',      width: 130, options: ['ORN_MP'] },
      { key: 'verCd',     label: 'VERSION',    type: 'select',      width: 150, options: ['MAIN_V0006'] },
      { key: 'plantCd',   label: 'FP_PLANT',   type: 'multiSelect', width: 150 },
      { key: 'matLv1',    label: 'MAT_LV_1',   type: 'select',      width: 130 },
      { key: 'matLv2',    label: 'MAT_LV_2',   type: 'multiSelect', width: 150 },
      { key: 'matLv3',    label: 'MAT_LV_3',   type: 'multiSelect', width: 150 },
      { key: 'matVal',    label: 'MAT_VAL',    type: 'text',        width: 170 },
      { key: 'status',    label: 'STATUS',     type: 'select',      width: 130, options: ['DRAFT','CONFIRMED'] },
      { key: 'fromDt',    label: 'FROM_DT',    type: 'date',        width: 140 },
    ],
    buttons: ['save', 'excel'],
    cols: [
      { name: 'MAT_CD',        h: 'PK_MAT_CD',     w:  90, a: 'center' },
      { name: 'MAT_NM',        h: 'PK_MAT_NM',     w: 220, a: 'left'   },
      { name: 'SL_NM',         h: 'SL_NM',         w: 130, a: 'left'   },
      { name: 'SL_STK_TOT',    h: 'SL_STK_TOT',    w:  90, a: 'right'  },
      { name: 'SL_STK_QTY',    h: 'SL_STK_QTY',    w:  90, a: 'right'  },
      { name: 'UNCLEARED_QTY', h: 'UNCLEARED_QTY', w:  90, a: 'right'  },
      { name: 'PLANT_NM',      h: 'FP_PLANT',      w: 100, a: 'center' },
      { name: 'STOCK_QTY',     h: 'ORN_PLANT_BOH', w:  90, a: 'right'  },
      { name: 'EA_KG',         h: 'EA_KG',         w:  70, a: 'right'  },
      { name: 'PLT_QTY',       h: 'PLT_QTY',       w:  70, a: 'right'  },
      { name: 'STATUS',        h: 'STATUS',        w: 100, a: 'center', status: true, edit: true },
    ],
    rows: [
      { MAT_CD:'M00010', MAT_NM:'원자재-RAW 설탕',         SL_NM:'VN-SL01 자재창고', SL_STK_TOT:5000.000, SL_STK_QTY:4500.000, UNCLEARED_QTY:500.000, PLANT_NM:'P1 공장', STOCK_QTY:8200.000, EA_KG:1.000, PLT_QTY:1000.000, STATUS:'CONFIRMED' },
      { MAT_CD:'M00010', MAT_NM:'원자재-RAW 설탕',         SL_NM:'VN-SL01 자재창고', SL_STK_TOT:5000.000, SL_STK_QTY:4500.000, UNCLEARED_QTY:500.000, PLANT_NM:'P2 공장', STOCK_QTY: 800.000, EA_KG:1.000, PLT_QTY:1000.000, STATUS:'DRAFT' },
      { MAT_CD:'M00020', MAT_NM:'포장재-PACK 캔 355ml',    SL_NM:'VN-SL02 포장창고', SL_STK_TOT:20000.000,SL_STK_QTY:18500.000,UNCLEARED_QTY:1500.000,PLANT_NM:'P1 공장', STOCK_QTY:32000.000,EA_KG:0.012, PLT_QTY:5000.000, STATUS:'CONFIRMED' },
    ],
  },
];

export default function OronMpMaterialMoveMockup() {
  return (
    <MockShell
      patternCode="oron_mp_material_move"
      patternLabel="ORON — MP 자재/반제품 공장이동 (4개 화면)"
      layoutCategory="LAYOUT_SINGLE"
      description="4개 운영 화면 통합. HALB_MOVE 는 반제품 (KEY_PLANT/KEY_ITEM 수급기준 + MEASURE_NM 요청량/확정량 × DATE). MAT_MOVE 는 원자재 내자 이동. MAT_MOVE_VN 은 외자 (베트남) — SL_NM 별 SL_STK_TOT/SL_STK_QTY/UNCLEARED 표시. MAT_MOVE_HQ 는 본사 확정 — STATUS DRAFT/CONFIRMED 토글."
    >
      <MockGridScaffold tabs={TABS} footer="MEASURE 요청량 vs 확정량 비교 · SL_STK_QTY = 가용재고 (UNCLEARED 제외) · HQ 확정 → VN 출하" />
    </MockShell>
  );
}
