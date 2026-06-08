import React from 'react';
import MockShell from '../../_shared/MockShell';
import MockGridScaffold from '../_shared/MockGridScaffold';

// ORON — MP BOM/공정 (BOM관리 + 생산순서 정의)
// 운영 화면 1:1 (ORON repo)
//  - UI_MP_ORN_BOM       view/oron/masterplan/master/ornmpbom/OrnMpBom.jsx         (BOM 관리)
//  - UI_MP_ORN_PROD_SEQ  view/oron/factoryplan/master/ornmpprodseq/OrnMpProdSeq    (생산순서 정의, TabContainer×2)
// OrnMpBom: 좌(ITEM) + 우(BOM) 마스터-디테일. BOM 행에 ITEM_LV_03/BRAND/ITEM_TP/UOM_CD/BOM_LV/BASE_QTY/BASE_UOM/
//           COMP_BASE_QTY/COMP_BASE_UOM/VALID_FROM~TO/CREATE_BY+DTTM 컬럼.
// OrnMpProdSeq: 2탭 (item_prod_seq / item_grp_prod_seq) — 품목 단위/품목그룹 단위 생산순서.
// (생산순서 컬럼은 운영 jsx 의 columns def 가 다른 들여쓰기로 정규식 미매치였음 — Pop 으로 행 추가하는
//  표준 마스터 CRUD 구조 기준으로 대표 컬럼 반영)

const TABS = [
  // ─── 탭 1: BOM 관리 (OrnMpBom 화면) ───
  {
    key: 'bom', label: 'BOM 관리', menu: 'UI_MP_ORN_BOM', cnt: 842,
    src: 'view/oron/masterplan/master/ornmpbom/OrnMpBom.jsx',
    search: [
      { key: 'plantCd', label: 'FP_PLANT',    type: 'select',      width: 130, options: ['P1', 'P2', 'P3'] },
      { key: 'itemVal', label: 'PK_ITEM_VAL', type: 'text',        width: 180, ph: 'F01001 / 품목명' },
    ],
    buttons: ['save', 'excel'],
    cols: [
      { name: 'ITEM_LV_03_NM',  h: 'ITEM_LV_03_NM',  w: 90,  a: 'center' },
      { name: 'BRAND_NM',       h: 'BRAND_NM',       w: 100, a: 'center' },
      { name: 'ITEM_CD',        h: 'ITEM_CD',        w: 90,  a: 'center' },
      { name: 'ITEM_NM',        h: 'ITEM_NM',        w: 220, a: 'left'   },
      { name: 'ITEM_TP_NM',     h: 'ITEM_TP_NM',     w: 70,  a: 'center' },
      { name: 'UOM_CD',         h: 'UOM_CD',         w: 60,  a: 'center' },
      { name: 'BOM_LV',         h: 'BOM_LV',         w: 70,  a: 'right'  },
      { name: 'BASE_QTY',       h: 'BASE_QTY',       w: 90,  a: 'right'  },
      { name: 'BASE_UOM',       h: 'BASE_UOM',       w: 60,  a: 'center' },
      { name: 'COMP_BASE_QTY',  h: 'COMP_BASE_QTY',  w: 90,  a: 'right'  },
      { name: 'COMP_BASE_UOM',  h: 'COMP_BASE_UOM',  w: 70,  a: 'center' },
      { name: 'VALID_FROM_DT',  h: 'VALID_FROM_DT',  w: 100, a: 'center' },
      { name: 'VALID_TO_DT',    h: 'VALID_TO_DT',    w: 100, a: 'center' },
      { name: 'CREATE_BY',      h: 'CREATE_BY',      w: 90,  a: 'center' },
      { name: 'CREATE_DTTM',    h: 'CREATE_DTTM',    w: 140, a: 'center' },
    ],
    rows: [
      { ITEM_LV_03_NM:'355ml', BRAND_NM:'ORN_A', ITEM_CD:'F01001', ITEM_NM:'완제품-FERT 샘플 1',    ITEM_TP_NM:'FERT', UOM_CD:'EA', BOM_LV:0, BASE_QTY:1.0000000, BASE_UOM:'EA', COMP_BASE_QTY:1.0000000, COMP_BASE_UOM:'EA', VALID_FROM_DT:'2024-01-01', VALID_TO_DT:'9999-12-31', CREATE_BY:'mp_user', CREATE_DTTM:'2024-01-05 10:12:00' },
      { ITEM_LV_03_NM:'355ml', BRAND_NM:'ORN_A', ITEM_CD:'H10001', ITEM_NM:'반제품-HALB 시럽 베이스 1', ITEM_TP_NM:'HALB', UOM_CD:'KG', BOM_LV:1, BASE_QTY:0.0800000, BASE_UOM:'KG', COMP_BASE_QTY:1.0000000, COMP_BASE_UOM:'EA', VALID_FROM_DT:'2024-01-01', VALID_TO_DT:'9999-12-31', CREATE_BY:'mp_user', CREATE_DTTM:'2024-01-05 10:13:00' },
      { ITEM_LV_03_NM:'355ml', BRAND_NM:'ORN_A', ITEM_CD:'M00010', ITEM_NM:'원자재-RAW 설탕',          ITEM_TP_NM:'ROH',  UOM_CD:'KG', BOM_LV:2, BASE_QTY:0.0150000, BASE_UOM:'KG', COMP_BASE_QTY:0.0800000, COMP_BASE_UOM:'KG', VALID_FROM_DT:'2024-01-01', VALID_TO_DT:'9999-12-31', CREATE_BY:'mp_user', CREATE_DTTM:'2024-01-05 10:14:00' },
      { ITEM_LV_03_NM:'355ml', BRAND_NM:'ORN_A', ITEM_CD:'M00011', ITEM_NM:'원자재-RAW 시트레이트',    ITEM_TP_NM:'ROH',  UOM_CD:'KG', BOM_LV:2, BASE_QTY:0.0030000, BASE_UOM:'KG', COMP_BASE_QTY:0.0800000, COMP_BASE_UOM:'KG', VALID_FROM_DT:'2024-01-01', VALID_TO_DT:'9999-12-31', CREATE_BY:'mp_user', CREATE_DTTM:'2024-01-05 10:15:00' },
      { ITEM_LV_03_NM:'355ml', BRAND_NM:'ORN_A', ITEM_CD:'M00020', ITEM_NM:'포장재-PACK 캔 355ml',      ITEM_TP_NM:'PACK', UOM_CD:'EA', BOM_LV:1, BASE_QTY:1.0000000, BASE_UOM:'EA', COMP_BASE_QTY:1.0000000, COMP_BASE_UOM:'EA', VALID_FROM_DT:'2024-01-01', VALID_TO_DT:'9999-12-31', CREATE_BY:'mp_user', CREATE_DTTM:'2024-01-05 10:16:00' },
      { ITEM_LV_03_NM:'355ml', BRAND_NM:'ORN_A', ITEM_CD:'M00030', ITEM_NM:'포장재-PACK 라벨',          ITEM_TP_NM:'PACK', UOM_CD:'EA', BOM_LV:1, BASE_QTY:1.0000000, BASE_UOM:'EA', COMP_BASE_QTY:1.0000000, COMP_BASE_UOM:'EA', VALID_FROM_DT:'2024-01-01', VALID_TO_DT:'9999-12-31', CREATE_BY:'mp_user', CREATE_DTTM:'2024-01-05 10:17:00' },
    ],
  },
  // ─── 탭 2: 생산순서 — 품목 단위 (OrnMpProdSeq item_prod_seq) ───
  {
    key: 'prodSeqItem', label: '생산순서 (품목)', menu: 'UI_MP_ORN_PROD_SEQ', cnt: 327,
    src: 'view/oron/factoryplan/master/ornmpprodseq/OrnMpProdSeq.jsx (item_prod_seq)',
    search: [
      { key: 'plantCd', label: 'FP_PLANT', type: 'multiSelect', width: 150 },
      { key: 'partCd',  label: 'FP_PART',  type: 'multiSelect', width: 150 },
      { key: 'lineCd',  label: 'FP_LINE',  type: 'multiSelect', width: 150 },
    ],
    buttons: ['add', 'del', 'save', 'excel'],
    cols: [
      { name: 'PLANT_CD',     h: 'PLANT_CD',     w:  80, a: 'center' },
      { name: 'LINE_CD',      h: 'LINE_CD',      w:  80, a: 'center' },
      { name: 'LINE_NM',      h: 'LINE_NM',      w: 150, a: 'left'   },
      { name: 'PRE_ITEM',     h: 'PRE_ITEM',     w: 110, a: 'center', edit: true },
      { name: 'PRE_ITEM_NM',  h: 'PRE_ITEM_NM',  w: 220, a: 'left'   },
      { name: 'POST_ITEM',    h: 'POST_ITEM',    w: 110, a: 'center', edit: true },
      { name: 'POST_ITEM_NM', h: 'POST_ITEM_NM', w: 220, a: 'left'   },
      { name: 'SEQ_PRIORITY', h: 'SEQ_PRIORITY', w:  90, a: 'right',  edit: true },
      { name: 'USE_YN',       h: 'USE_YN',       w:  60, a: 'center', bool: true, edit: true },
    ],
    rows: [
      { PLANT_CD:'P1', LINE_CD:'L01', LINE_NM:'L01 충전 라인 1', PRE_ITEM:'F01001', PRE_ITEM_NM:'완제품-FERT 샘플 1', POST_ITEM:'F01002', POST_ITEM_NM:'완제품-FERT 샘플 2', SEQ_PRIORITY:1, USE_YN:true },
      { PLANT_CD:'P1', LINE_CD:'L01', LINE_NM:'L01 충전 라인 1', PRE_ITEM:'F01002', PRE_ITEM_NM:'완제품-FERT 샘플 2', POST_ITEM:'F01003', POST_ITEM_NM:'완제품-FERT 샘플 3', SEQ_PRIORITY:2, USE_YN:true },
      { PLANT_CD:'P1', LINE_CD:'L02', LINE_NM:'L02 충전 라인 2', PRE_ITEM:'F02001', PRE_ITEM_NM:'완제품-FERT 샘플 4', POST_ITEM:'F02002', POST_ITEM_NM:'완제품-FERT 샘플 5', SEQ_PRIORITY:1, USE_YN:true },
      { PLANT_CD:'P2', LINE_CD:'L21', LINE_NM:'L21 압출 라인',   PRE_ITEM:'F02001', PRE_ITEM_NM:'완제품-FERT 샘플 4', POST_ITEM:'F02002', POST_ITEM_NM:'완제품-FERT 샘플 5', SEQ_PRIORITY:1, USE_YN:false },
    ],
  },
  // ─── 탭 3: 생산순서 — 품목그룹 단위 (OrnMpProdSeq item_grp_prod_seq) ───
  {
    key: 'prodSeqGrp', label: '생산순서 (품목그룹)', menu: 'UI_MP_ORN_PROD_SEQ', cnt: 56,
    src: 'view/oron/factoryplan/master/ornmpprodseq/OrnMpProdSeq.jsx (item_grp_prod_seq)',
    search: [
      { key: 'plantCd', label: 'FP_PLANT', type: 'multiSelect', width: 150 },
      { key: 'partCd',  label: 'FP_PART',  type: 'multiSelect', width: 150 },
      { key: 'lineCd',  label: 'FP_LINE',  type: 'multiSelect', width: 150 },
    ],
    buttons: ['add', 'del', 'save', 'excel'],
    cols: [
      { name: 'PLANT_CD',     h: 'PLANT_CD',     w:  80, a: 'center' },
      { name: 'LINE_CD',      h: 'LINE_CD',      w:  80, a: 'center' },
      { name: 'LINE_NM',      h: 'LINE_NM',      w: 150, a: 'left'   },
      { name: 'PRE_GRP',      h: 'PRE_GRP',      w: 110, a: 'center', edit: true },
      { name: 'POST_GRP',     h: 'POST_GRP',     w: 110, a: 'center', edit: true },
      { name: 'SEQ_PRIORITY', h: 'SEQ_PRIORITY', w:  90, a: 'right',  edit: true },
      { name: 'USE_YN',       h: 'USE_YN',       w:  60, a: 'center', bool: true, edit: true },
    ],
    rows: [
      { PLANT_CD:'P1', LINE_CD:'L01', LINE_NM:'L01 충전 라인 1', PRE_GRP:'GRP_A', POST_GRP:'GRP_B', SEQ_PRIORITY:1, USE_YN:true },
      { PLANT_CD:'P1', LINE_CD:'L02', LINE_NM:'L02 충전 라인 2', PRE_GRP:'GRP_B', POST_GRP:'GRP_C', SEQ_PRIORITY:1, USE_YN:true },
      { PLANT_CD:'P2', LINE_CD:'L21', LINE_NM:'L21 압출 라인',   PRE_GRP:'GRP_C', POST_GRP:'GRP_D', SEQ_PRIORITY:1, USE_YN:false },
    ],
  },
];

export default function OronMpBomRouteMockup() {
  return (
    <MockShell
      patternCode="oron_mp_bom_route"
      patternLabel="ORON — MP BOM/공정 (BOM 관리 + 생산순서 정의)"
      layoutCategory="LAYOUT_SINGLE"
      description="2개 운영 화면 (UI_MP_ORN_BOM 마스터-디테일 / UI_MP_ORN_PROD_SEQ 2탭) 을 한 자리에 탭으로 나열. OrnMpBom 은 좌(품목 검색) + 우(BOM 트리) 마스터-디테일. OrnMpProdSeq 는 품목 단위 + 품목그룹 단위 생산순서 2탭."
    >
      <MockGridScaffold tabs={TABS} footer="BOM_LV: 0=완제품, 1=반제품/PACK, 2=원자재 · COMP_BASE_QTY = 상위 단위 소요량" />
    </MockShell>
  );
}
