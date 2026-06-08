import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography, Chip, Tabs, Tab,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Paper, IconButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import MockShell from '../../_shared/MockShell';
import { cellSx } from '../../_shared/styleCallback';

// ORON — MP 기준정보 마스터 (5개 화면 통합 표시)
// 운영 화면 1:1 (ORON repo view/oron/masterplan/master 기준)
//  - UI_MP_ITEM           ornmpitem/OrnMpItem.jsx       완제품 (FERT)
//  - UI_MP_ORN_HALB_ITEM  ornmphalbitem/OrnMpHalbItem   반제품 (HALB)
//  - UI_MP_ORN_MRP_ITEM   ornmrpitem/OrnMrpItem         원부자재 (ROH)
//  - UI_MP_ORN_RESOURCE   ornmpresource/OrnMpResource   생산라인 (PLANT/PART/LINE × 교대구분 × 요일별 가동시간)
//  - UI_MP_ORN_ITEM_GRP   ornmpitemgrp/OrnMpItemGrp     제품그룹 (PopOrnPlantPartLine + PopOrnMpItemGrp)
// 패턴: SearchArea + (각 화면 독립) BaseGrid. 본 mockup 은 5개 화면을 탭으로 한 자리에 나열.
// 도메인 정정: 화장품 아님 — ORON 의 공장 생산 계획 마스터 (PLANT/PART/LINE · ITEM_LV_01~03 · BRAND).
//             브랜드/플레이버 컬럼은 OrnMpItem 만 존재. 반제품·원부자재·자원·그룹 화면엔 없음.

// ───── 각 탭의 검색조건 (SearchArea 1:1 반영) ─────
const SEARCH = {
  fert: [
    { key: 'itemVal',  label: 'ITEM_VAL',     type: 'text',         width: 160, ph: 'F01001 / 완제품명' },
    { key: 'plantCd',  label: 'FP_PLANT',     type: 'multiSelect',  width: 160, options: ['P1', 'P2', 'P3'] },
  ],
  halb: [
    { key: 'itemVal',  label: 'PK_HALB',      type: 'text',         width: 160, ph: 'HALB_CD / HALB_NM' },
    { key: 'plantCd',  label: 'FP_PLANT',     type: 'multiSelect',  width: 160, options: ['P1', 'P2', 'P3'] },
    { key: 'minLot',   label: 'MIN_LOT_SIZE', type: 'text',         width: 110 },
    { key: 'mulLot',   label: 'MUL_LOT_SIZE', type: 'text',         width: 110 },
    { key: '_btn',     label: 'OVERALL_APPY (전체적용)', type: 'button', width: 'auto' },
  ],
  mat: [
    { key: 'matLv1',   label: 'MAT_LV_1',     type: 'select',       width: 130, options: ['RAW', 'PACK', 'SUB'] },
    { key: 'matLv2',   label: 'MAT_LV_2',     type: 'multiSelect',  width: 150 },
    { key: 'matLv3',   label: 'MAT_LV_3',     type: 'multiSelect',  width: 150 },
    { key: 'matVal',   label: 'MAT_VAL',      type: 'text',         width: 160, ph: 'M0001 / 자재명' },
    { key: 'plantCd',  label: 'FP_PLANT',     type: 'multiSelect',  width: 160 },
  ],
  res: [
    { key: 'plantCd',  label: 'FP_PLANT',     type: 'multiSelect',  width: 160 },
    { key: 'partCd',   label: 'FP_PART',      type: 'multiSelect',  width: 160 },
    { key: 'lineCd',   label: 'FP_LINE',      type: 'multiSelect',  width: 160 },
  ],
  grp: [
    { key: 'plantCd',  label: 'FP_PLANT',     type: 'multiSelect',  width: 160 },
    { key: 'partCd',   label: 'FP_PART',      type: 'multiSelect',  width: 160 },
    { key: 'lineCd',   label: 'FP_LINE',      type: 'multiSelect',  width: 160 },
  ],
};

// ───── 각 탭의 BaseGrid 컬럼 (실 운영 jsx 1:1 반영, mockup 가독을 위해 visible:true 컬럼만) ─────
// FERT (완제품) — ITEM_LV_01~03/BRAND 그룹 헤더 + 단일 컬럼들 + EDIT(audit) 그룹
const COLS_FERT = [
  { name: 'ITEM_CD',          h: 'ITEM_CD',          w: 80,  a: 'center' },
  { name: 'ITEM_NM',          h: 'ITEM_NM',          w: 220, a: 'left'   },
  { name: 'ITEM_TP_NM',       h: 'MAT_TP',           w: 70,  a: 'center' },
  { name: 'ITEM_LV_01',       h: 'ITEM_LV_01',       w: 110, a: 'center', group: ['CD','NM'] },
  { name: 'ITEM_LV_02',       h: 'ITEM_LV_02',       w: 110, a: 'center', group: ['CD','NM'] },
  { name: 'ITEM_LV_03',       h: 'ITEM_LV_03',       w: 110, a: 'center', group: ['CD','NM'] },
  { name: 'BRAND',            h: 'BRAND_NM',         w: 110, a: 'center', group: ['CD','NM'] },
  { name: 'FLAV_NM',          h: 'FLAV_NM',          w: 70,  a: 'center' },
  { name: 'ITEM_STATUS',      h: 'MP_ITEM_STATUS',   w: 80,  a: 'center' },
  { name: 'LIFE_CYCL_NM',     h: 'LIFE_CYCL_NM',     w: 80,  a: 'center' },
  { name: 'ITEM_ACTV_DT',     h: 'ITEM_ACTV_DT',     w: 100, a: 'center' },
  { name: 'UOM_CD',           h: 'UOM_CD',           w: 60,  a: 'center' },
  { name: 'GIFT_YN',          h: 'GIFT_YN',          w: 60,  a: 'center' },
  { name: 'EA_BOX',           h: 'EA_BOX',           w: 70,  a: 'right'  },
  { name: 'EA_WEIGHT',        h: 'EA_WEIGHT',        w: 80,  a: 'right'  },
  { name: 'BOX_WEIGHT',       h: 'BOX_WEIGHT',       w: 80,  a: 'right'  },
  { name: 'BOX_PLT',          h: 'BOX_PLT',          w: 70,  a: 'right'  },
  { name: 'SHIPMENT_PRICE',   h: 'SHPP_PRICE',       w: 90,  a: 'right'  },
  { name: 'EDIT',             h: 'FP_COL_AUDIT',     w: 110, a: 'center', group: ['MOD_BY','MOD_DTTM'] },
];
const ROWS_FERT = [
  { ITEM_CD:'F01001', ITEM_NM:'완제품-FERT 샘플 1', ITEM_TP_NM:'FERT', ITEM_LV_01:['10','음료'], ITEM_LV_02:['1010','캔'],  ITEM_LV_03:['101001','355ml'], BRAND:['BR01','ORN_A'], FLAV_NM:'기본',   ITEM_STATUS:'ACTV', LIFE_CYCL_NM:'GROWTH', ITEM_ACTV_DT:'2024-03-01', UOM_CD:'EA', GIFT_YN:'N', EA_BOX:24,  EA_WEIGHT:0.355, BOX_WEIGHT:8.52, BOX_PLT:64,  SHIPMENT_PRICE:1280, EDIT:['mp_user','2025-12-04 09:12'] },
  { ITEM_CD:'F01002', ITEM_NM:'완제품-FERT 샘플 2', ITEM_TP_NM:'FERT', ITEM_LV_01:['10','음료'], ITEM_LV_02:['1010','캔'],  ITEM_LV_03:['101002','500ml'], BRAND:['BR01','ORN_A'], FLAV_NM:'레몬',   ITEM_STATUS:'ACTV', LIFE_CYCL_NM:'MATURE', ITEM_ACTV_DT:'2023-09-15', UOM_CD:'EA', GIFT_YN:'N', EA_BOX:24,  EA_WEIGHT:0.500, BOX_WEIGHT:12.00, BOX_PLT:48,  SHIPMENT_PRICE:1450, EDIT:['mp_user','2025-12-03 17:40'] },
  { ITEM_CD:'F01003', ITEM_NM:'완제품-FERT 샘플 3', ITEM_TP_NM:'FERT', ITEM_LV_01:['10','음료'], ITEM_LV_02:['1020','PET'], ITEM_LV_03:['102001','500ml'], BRAND:['BR02','ORN_B'], FLAV_NM:'기본',   ITEM_STATUS:'ACTV', LIFE_CYCL_NM:'GROWTH', ITEM_ACTV_DT:'2024-06-20', UOM_CD:'EA', GIFT_YN:'Y', EA_BOX:12,  EA_WEIGHT:0.500, BOX_WEIGHT:6.00,  BOX_PLT:80,  SHIPMENT_PRICE:980,  EDIT:['planner1','2025-11-29 11:05'] },
  { ITEM_CD:'F02001', ITEM_NM:'완제품-FERT 샘플 4', ITEM_TP_NM:'FERT', ITEM_LV_01:['20','과자'], ITEM_LV_02:['2010','쿠키'],ITEM_LV_03:['201001','120g'],  BRAND:['BR03','ORN_C'], FLAV_NM:'카카오', ITEM_STATUS:'ACTV', LIFE_CYCL_NM:'MATURE', ITEM_ACTV_DT:'2022-11-01', UOM_CD:'EA', GIFT_YN:'N', EA_BOX:36,  EA_WEIGHT:0.120, BOX_WEIGHT:4.32,  BOX_PLT:96,  SHIPMENT_PRICE:1850, EDIT:['mp_user','2025-12-02 08:50'] },
  { ITEM_CD:'F02002', ITEM_NM:'완제품-FERT 샘플 5', ITEM_TP_NM:'FERT', ITEM_LV_01:['20','과자'], ITEM_LV_02:['2020','크래커'],ITEM_LV_03:['202001','100g'],BRAND:['BR03','ORN_C'], FLAV_NM:'치즈',   ITEM_STATUS:'EOP',  LIFE_CYCL_NM:'DECLINE',ITEM_ACTV_DT:'2021-05-12', UOM_CD:'EA', GIFT_YN:'N', EA_BOX:48,  EA_WEIGHT:0.100, BOX_WEIGHT:4.80,  BOX_PLT:120, SHIPMENT_PRICE:1200, EDIT:['planner2','2025-10-15 14:22'] },
];

// HALB (반제품) — Collapse 토글 가능한 SearchArea + 단순 컬럼셋
const COLS_HALB = [
  { name: 'ITEM_CD',       h: 'HALB_CD',         w: 90,  a: 'center' },
  { name: 'ITEM_NM',       h: 'HALB_NM',         w: 240, a: 'left'   },
  { name: 'UOM_CD',        h: 'UOM_CD',          w: 60,  a: 'center' },
  { name: 'MAX_LOT_SIZE',  h: 'MAX_LOT_SIZE',    w: 110, a: 'right',  edit: true },
  { name: 'ITEM_STATUS',   h: 'MP_ITEM_STATUS',  w: 80,  a: 'center' },
  { name: 'USE_YN',        h: 'USE_YN',          w: 60,  a: 'center', bool: true },
  { name: 'PLANT_NM',      h: 'PLANT_NM',        w: 100, a: 'center' },
  { name: 'PRODUCT_LOT',   h: 'PRODUCT_LOT',     w: 100, a: 'right'  },
  { name: 'TRANS_SIZE',    h: 'TRANS_SIZE',      w: 100, a: 'right',  edit: true },
  { name: 'MIN_LOT_SIZE',  h: 'MIN_LOT_SIZE',    w: 100, a: 'right',  edit: true },
  { name: 'MUL_LOT_SIZE',  h: 'MUL_LOT_SIZE',    w: 100, a: 'right',  edit: true },
  { name: 'PLAN_YN',       h: 'PLAN_YN',         w: 60,  a: 'center', bool: true },
  { name: 'CAPA_MAMT_TP',  h: 'CAPA_MAMT_TP',    w: 110, a: 'center', edit: true },
  { name: 'PROD_LT',       h: 'MP_PROD_LT',      w: 80,  a: 'right',  edit: true },
];
const ROWS_HALB = [
  { ITEM_CD:'H10001', ITEM_NM:'반제품-HALB 시럽 베이스 1', UOM_CD:'KG', MAX_LOT_SIZE:5000, ITEM_STATUS:'ACTV', USE_YN:true,  PLANT_NM:'P1 공장', PRODUCT_LOT:1000, TRANS_SIZE:500, MIN_LOT_SIZE:500,  MUL_LOT_SIZE:500,  PLAN_YN:true,  CAPA_MAMT_TP:'KG/HR', PROD_LT:1 },
  { ITEM_CD:'H10002', ITEM_NM:'반제품-HALB 시럽 베이스 2', UOM_CD:'KG', MAX_LOT_SIZE:3000, ITEM_STATUS:'ACTV', USE_YN:true,  PLANT_NM:'P1 공장', PRODUCT_LOT: 800, TRANS_SIZE:400, MIN_LOT_SIZE:400,  MUL_LOT_SIZE:400,  PLAN_YN:true,  CAPA_MAMT_TP:'KG/HR', PROD_LT:1 },
  { ITEM_CD:'H20001', ITEM_NM:'반제품-HALB 반죽 1',        UOM_CD:'KG', MAX_LOT_SIZE:2000, ITEM_STATUS:'ACTV', USE_YN:true,  PLANT_NM:'P2 공장', PRODUCT_LOT: 500, TRANS_SIZE:250, MIN_LOT_SIZE:250,  MUL_LOT_SIZE:250,  PLAN_YN:true,  CAPA_MAMT_TP:'KG/HR', PROD_LT:2 },
  { ITEM_CD:'H20002', ITEM_NM:'반제품-HALB 반죽 2',        UOM_CD:'KG', MAX_LOT_SIZE:1500, ITEM_STATUS:'ACTV', USE_YN:true,  PLANT_NM:'P2 공장', PRODUCT_LOT: 400, TRANS_SIZE:200, MIN_LOT_SIZE:200,  MUL_LOT_SIZE:200,  PLAN_YN:false, CAPA_MAMT_TP:'KG/HR', PROD_LT:2 },
  { ITEM_CD:'H30001', ITEM_NM:'반제품-HALB 충전물 1',      UOM_CD:'KG', MAX_LOT_SIZE: 800, ITEM_STATUS:'STOP', USE_YN:false, PLANT_NM:'P3 공장', PRODUCT_LOT: 200, TRANS_SIZE:100, MIN_LOT_SIZE:100,  MUL_LOT_SIZE:100,  PLAN_YN:false, CAPA_MAMT_TP:'KG/HR', PROD_LT:3 },
];

// MAT (원부자재) — MAT_LV_02/03 + 구매 관련 컬럼 다수
const COLS_MAT = [
  { name: 'MAT_CD',           h: 'MAT_CD',           w: 90,  a: 'center' },
  { name: 'MAT_NM',           h: 'MAT_NM',           w: 220, a: 'left'   },
  { name: 'MAT_LV_02',        h: 'MAT_LV_02',        w: 90,  a: 'center' },
  { name: 'MAT_LV_02_NM',     h: 'MAT_LV_02_NM',     w: 130, a: 'center' },
  { name: 'MAT_LV_03',        h: 'MAT_LV_03',        w: 90,  a: 'center' },
  { name: 'MAT_LV_03_NM',     h: 'MAT_LV_03_NM',     w: 110, a: 'center' },
  { name: 'UOM_CD',           h: 'UOM_CD',           w: 60,  a: 'center' },
  { name: 'EA_KG',            h: 'EA_KG',            w: 80,  a: 'right',  edit: true },
  { name: 'PLT_QTY',          h: 'PLT_QTY',          w: 80,  a: 'right',  edit: true },
  { name: 'MAT_STATUS',       h: 'MP_MAT_STATUS',    w: 80,  a: 'center' },
  { name: 'PURC_YN',          h: 'PURC_YN',          w: 70,  a: 'center', bool: true },
  { name: 'AUTO_PURC_YN',     h: 'AUTO_PURC_YN',     w: 80,  a: 'center', bool: true, edit: true },
  { name: 'PURC_DIVS',        h: 'PURC_DIVS',        w: 80,  a: 'center' },
  { name: 'PURC_LT',          h: 'PURC_LT',          w: 70,  a: 'right',  edit: true },
  { name: 'SAFETY_STOCK_QTY', h: 'SAFETY_STOCK_QTY', w: 100, a: 'right',  edit: true },
  { name: 'MIN_ORD_QTY',      h: 'MIN_ORD_QTY',      w: 90,  a: 'right',  edit: true },
  { name: 'MUL_ORD_QTY',      h: 'MUL_ORD_QTY',      w: 90,  a: 'right',  edit: true },
  { name: 'PURC_CYC_TIME',    h: 'PURC_CYC_TIME',    w: 100, a: 'right',  edit: true },
];
const ROWS_MAT = [
  { MAT_CD:'M00010', MAT_NM:'원자재-RAW 설탕',     MAT_LV_02:'RAW', MAT_LV_02_NM:'원료',     MAT_LV_03:'SUGAR',  MAT_LV_03_NM:'당류',    UOM_CD:'KG', EA_KG:1.0,   PLT_QTY:1000, MAT_STATUS:'ACTV', PURC_YN:true,  AUTO_PURC_YN:true,  PURC_DIVS:'내자', PURC_LT:7,  SAFETY_STOCK_QTY:5000, MIN_ORD_QTY:1000, MUL_ORD_QTY:500, PURC_CYC_TIME:7 },
  { MAT_CD:'M00011', MAT_NM:'원자재-RAW 시트레이트', MAT_LV_02:'RAW', MAT_LV_02_NM:'원료',     MAT_LV_03:'ADD',    MAT_LV_03_NM:'첨가제',  UOM_CD:'KG', EA_KG:1.0,   PLT_QTY: 500, MAT_STATUS:'ACTV', PURC_YN:true,  AUTO_PURC_YN:true,  PURC_DIVS:'내자', PURC_LT:10, SAFETY_STOCK_QTY:800,  MIN_ORD_QTY: 200, MUL_ORD_QTY:100, PURC_CYC_TIME:14 },
  { MAT_CD:'M00020', MAT_NM:'포장재-PACK 캔 355ml',  MAT_LV_02:'PACK',MAT_LV_02_NM:'포장재',   MAT_LV_03:'CAN',    MAT_LV_03_NM:'캔',      UOM_CD:'EA', EA_KG:0.012, PLT_QTY:5000, MAT_STATUS:'ACTV', PURC_YN:true,  AUTO_PURC_YN:false, PURC_DIVS:'내자', PURC_LT:5,  SAFETY_STOCK_QTY:20000,MIN_ORD_QTY:5000, MUL_ORD_QTY:1000,PURC_CYC_TIME:5 },
  { MAT_CD:'M00021', MAT_NM:'포장재-PACK 캔 500ml',  MAT_LV_02:'PACK',MAT_LV_02_NM:'포장재',   MAT_LV_03:'CAN',    MAT_LV_03_NM:'캔',      UOM_CD:'EA', EA_KG:0.018, PLT_QTY:3000, MAT_STATUS:'ACTV', PURC_YN:true,  AUTO_PURC_YN:false, PURC_DIVS:'내자', PURC_LT:5,  SAFETY_STOCK_QTY:12000,MIN_ORD_QTY:3000, MUL_ORD_QTY:1000,PURC_CYC_TIME:5 },
  { MAT_CD:'M00030', MAT_NM:'포장재-PACK 라벨',      MAT_LV_02:'PACK',MAT_LV_02_NM:'포장재',   MAT_LV_03:'LABEL',  MAT_LV_03_NM:'라벨',    UOM_CD:'EA', EA_KG:0.001, PLT_QTY:50000,MAT_STATUS:'ACTV', PURC_YN:true,  AUTO_PURC_YN:true,  PURC_DIVS:'외자', PURC_LT:21, SAFETY_STOCK_QTY:100000,MIN_ORD_QTY:50000,MUL_ORD_QTY:5000,PURC_CYC_TIME:30 },
];

// RES (생산라인) — PLANT × PART × LINE × 교대구분 × 요일별 가동시간 행렬
const COLS_RES = [
  { name: 'PLANT_CD',         h: 'PLANT_CD',        w: 80,  a: 'center' },
  { name: 'PLANT_NM',         h: 'PLANT_NM',        w: 100, a: 'center' },
  { name: 'PART_CD',          h: 'MP_PART_CD',      w: 80,  a: 'center' },
  { name: 'PART_NM',          h: 'MP_PART_NM',      w: 110, a: 'center' },
  { name: 'LINE_CD',          h: 'FP_LINE',         w: 80,  a: 'center' },
  { name: 'LINE_NM',          h: 'LINE_NM',         w: 140, a: 'left'   },
  { name: 'SHIFT_DIVS',       h: 'SHIFT_DIVS',      w: 80,  a: 'center', edit: true },
  { name: 'BASE_WORK_HOURS',  h: 'BASE_WORK_HOURS', w: 90,  a: 'right',  edit: true },
  { name: 'BASE_OVER_HOURS',  h: 'BASE_OVER_HOURS', w: 90,  a: 'right',  edit: true },
  { name: 'SAT_DAY_HOURS',    h: 'SAT_DAY_HOURS',   w: 90,  a: 'right',  edit: true },
  { name: 'SAT_NIGHT_HOURS',  h: 'SAT_NIGHT_HOURS', w: 90,  a: 'right',  edit: true },
  { name: 'SUN_DAY_HOURS',    h: 'SUN_DAY_HOURS',   w: 90,  a: 'right',  edit: true },
  { name: 'SUN_NIGHT_HOURS',  h: 'SUN_NIGHT_HOURS', w: 90,  a: 'right',  edit: true },
  { name: 'CLEAN_WKN_HOURS',  h: 'CLEAN_WKN_HOURS', w: 100, a: 'right',  edit: true },
  { name: 'USE_YN',           h: 'USE_YN',          w: 60,  a: 'center', bool: true, edit: true },
];
const ROWS_RES = [
  { PLANT_CD:'P1', PLANT_NM:'P1 공장', PART_CD:'A1', PART_NM:'A1 동', LINE_CD:'L01', LINE_NM:'L01 충전 라인 1', SHIFT_DIVS:'2조2교대', BASE_WORK_HOURS:16, BASE_OVER_HOURS:2, SAT_DAY_HOURS:8, SAT_NIGHT_HOURS:0, SUN_DAY_HOURS:0, SUN_NIGHT_HOURS:0, CLEAN_WKN_HOURS:4, USE_YN:true  },
  { PLANT_CD:'P1', PLANT_NM:'P1 공장', PART_CD:'A1', PART_NM:'A1 동', LINE_CD:'L02', LINE_NM:'L02 충전 라인 2', SHIFT_DIVS:'2조2교대', BASE_WORK_HOURS:16, BASE_OVER_HOURS:2, SAT_DAY_HOURS:8, SAT_NIGHT_HOURS:0, SUN_DAY_HOURS:0, SUN_NIGHT_HOURS:0, CLEAN_WKN_HOURS:4, USE_YN:true  },
  { PLANT_CD:'P1', PLANT_NM:'P1 공장', PART_CD:'B1', PART_NM:'B1 동', LINE_CD:'L11', LINE_NM:'L11 포장 라인 1', SHIFT_DIVS:'2조2교대', BASE_WORK_HOURS:16, BASE_OVER_HOURS:0, SAT_DAY_HOURS:8, SAT_NIGHT_HOURS:0, SUN_DAY_HOURS:0, SUN_NIGHT_HOURS:0, CLEAN_WKN_HOURS:2, USE_YN:true  },
  { PLANT_CD:'P2', PLANT_NM:'P2 공장', PART_CD:'A2', PART_NM:'A2 동', LINE_CD:'L21', LINE_NM:'L21 압출 라인',  SHIFT_DIVS:'3조3교대', BASE_WORK_HOURS:24, BASE_OVER_HOURS:0, SAT_DAY_HOURS:8, SAT_NIGHT_HOURS:8, SUN_DAY_HOURS:8, SUN_NIGHT_HOURS:0, CLEAN_WKN_HOURS:6, USE_YN:true  },
  { PLANT_CD:'P3', PLANT_NM:'P3 공장', PART_CD:'A3', PART_NM:'A3 동', LINE_CD:'L31', LINE_NM:'L31 OEM 라인',   SHIFT_DIVS:'1조1교대', BASE_WORK_HOURS: 8, BASE_OVER_HOURS:2, SAT_DAY_HOURS:0, SAT_NIGHT_HOURS:0, SUN_DAY_HOURS:0, SUN_NIGHT_HOURS:0, CLEAN_WKN_HOURS:2, USE_YN:false },
];

// GRP (제품그룹) — PLANT/PART/LINE × GRP_CD × ITEM_CD (action 버튼 → PopOrnMpItemGrp)
const COLS_GRP = [
  { name: 'PLANT_CD',  h: 'PLANT_CD', w:  80, a: 'center' },
  { name: 'PLANT_NM',  h: 'PLANT_NM', w: 100, a: 'center' },
  { name: 'LINE_CD',   h: 'LINE_CD',  w:  80, a: 'center' },
  { name: 'LINE_NM',   h: 'LINE_NM',  w: 140, a: 'left'   },
  { name: 'GRP_CD',    h: 'GRP_CD',   w: 110, a: 'center', edit: true },
  { name: 'ITEM_CD',   h: 'ITEM_CD',  w: 110, a: 'center', action: true },  // ← PopOrnMpItemGrp 호출
  { name: 'ITEM_NM',   h: 'ITEM_NM',  w: 240, a: 'left'   },
];
const ROWS_GRP = [
  { PLANT_CD:'P1', PLANT_NM:'P1 공장', LINE_CD:'L01', LINE_NM:'L01 충전 라인 1', GRP_CD:'GRP_A', ITEM_CD:'F01001', ITEM_NM:'완제품-FERT 샘플 1' },
  { PLANT_CD:'P1', PLANT_NM:'P1 공장', LINE_CD:'L01', LINE_NM:'L01 충전 라인 1', GRP_CD:'GRP_A', ITEM_CD:'F01002', ITEM_NM:'완제품-FERT 샘플 2' },
  { PLANT_CD:'P1', PLANT_NM:'P1 공장', LINE_CD:'L02', LINE_NM:'L02 충전 라인 2', GRP_CD:'GRP_B', ITEM_CD:'F01003', ITEM_NM:'완제품-FERT 샘플 3' },
  { PLANT_CD:'P2', PLANT_NM:'P2 공장', LINE_CD:'L21', LINE_NM:'L21 압출 라인',  GRP_CD:'GRP_C', ITEM_CD:'F02001', ITEM_NM:'완제품-FERT 샘플 4' },
  { PLANT_CD:'P3', PLANT_NM:'P3 공장', LINE_CD:'L31', LINE_NM:'L31 OEM 라인',   GRP_CD:'GRP_D', ITEM_CD:'F02002', ITEM_NM:'완제품-FERT 샘플 5' },
];

const TABS = [
  { key: 'fert', label: '완제품 (FERT)',     menu: 'UI_MP_ITEM',          cnt: 1284,
    src: 'view/oron/masterplan/master/ornmpitem/OrnMpItem.jsx', cols: COLS_FERT, rows: ROWS_FERT, search: SEARCH.fert, buttons: ['save','excel'] },
  { key: 'halb', label: '반제품 (HALB)',     menu: 'UI_MP_ORN_HALB_ITEM', cnt:  532,
    src: 'view/oron/masterplan/master/ornmphalbitem/OrnMpHalbItem.jsx', cols: COLS_HALB, rows: ROWS_HALB, search: SEARCH.halb, buttons: ['save','excel'] },
  { key: 'mat',  label: '원부자재 (ROH)',    menu: 'UI_MP_ORN_MRP_ITEM',  cnt: 2147,
    src: 'view/oron/masterplan/master/ornmrpitem/OrnMrpItem.jsx', cols: COLS_MAT,  rows: ROWS_MAT,  search: SEARCH.mat,  buttons: ['save','excel'] },
  { key: 'res',  label: '생산라인',           menu: 'UI_MP_ORN_RESOURCE',  cnt:   24,
    src: 'view/oron/masterplan/master/ornmpresource/OrnMpResource.jsx', cols: COLS_RES,  rows: ROWS_RES,  search: SEARCH.res,  buttons: ['add','del','save','excel'] },
  { key: 'grp',  label: '제품그룹',           menu: 'UI_MP_ORN_ITEM_GRP',  cnt:   68,
    src: 'view/oron/masterplan/master/ornmpitemgrp/OrnMpItemGrp.jsx', cols: COLS_GRP,  rows: ROWS_GRP,  search: SEARCH.grp,  buttons: ['add','del','save','excel'] },
];

const STATUS_COLOR = { ACTV:'success', EOP:'warning', STOP:'error' };
const LC_COLOR     = { INTRO:'info', GROWTH:'success', MATURE:'primary', DECLINE:'warning', EOL:'default' };

function renderSearchField(f) {
  if (f.type === 'button') {
    return (
      <Button key={f.key} variant="outlined" size="small" sx={{ height: 36 }}>
        {f.label}
      </Button>
    );
  }
  return (
    <TextField
      key={f.key}
      label={f.label}
      size="small"
      placeholder={f.ph || ''}
      sx={{ width: f.width }}
      select={f.type === 'select' || f.type === 'multiSelect'}
      SelectProps={f.type === 'multiSelect' ? { multiple: true, value: [] } : undefined}
      value={f.type === 'select' ? '' : f.type === 'multiSelect' ? [] : ''}
    >
      {(f.options || []).map((o) => (
        <MenuItem key={o} value={o}>{o}</MenuItem>
      ))}
    </TextField>
  );
}

function renderCell(col, val) {
  if (col.group && Array.isArray(val)) {
    // 그룹 컬럼 (예: [CD, NM]) — 2개 셀로 펼침
    return val.map((sub, i) => (
      <TableCell key={col.name + ':' + i} sx={{ textAlign: 'center', fontSize: 12, fontFamily: i === 0 ? 'monospace' : undefined, color: i === 0 ? '#2563eb' : undefined }}>
        {sub}
      </TableCell>
    ));
  }
  if (col.bool) {
    return (
      <TableCell key={col.name} sx={{ textAlign: 'center' }}>
        <Chip label={val ? 'Y' : 'N'} size="small" color={val ? 'success' : 'default'} variant={val ? 'filled' : 'outlined'} sx={{ height: 18, fontSize: 10 }} />
      </TableCell>
    );
  }
  if (col.name === 'ITEM_STATUS' || col.name === 'MAT_STATUS') {
    return (
      <TableCell key={col.name} sx={{ textAlign: 'center' }}>
        <Chip label={val} size="small" color={STATUS_COLOR[val] || 'default'} variant="outlined" sx={{ height: 18, fontSize: 10 }} />
      </TableCell>
    );
  }
  if (col.name === 'LIFE_CYCL_NM') {
    return (
      <TableCell key={col.name} sx={{ textAlign: 'center' }}>
        <Chip label={val} size="small" color={LC_COLOR[val] || 'default'} variant="outlined" sx={{ height: 18, fontSize: 10 }} />
      </TableCell>
    );
  }
  if (col.action) {
    return (
      <TableCell key={col.name} sx={{ textAlign: 'center' }}>
        <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
          <Typography sx={{ fontSize: 12, fontFamily: 'monospace', color: '#2563eb' }}>{val}</Typography>
          <IconButton size="small" sx={{ p: 0.2 }} title="Pop 검색"><OpenInNewIcon sx={{ fontSize: 14 }} /></IconButton>
        </Stack>
      </TableCell>
    );
  }
  if (col.name === 'EDIT' && Array.isArray(val)) {
    return (
      <TableCell key={col.name} sx={{ textAlign: 'center', fontSize: 11, color: '#6b7280' }}>
        <div>{val[0]}</div><div>{val[1]}</div>
      </TableCell>
    );
  }
  const isNum = col.a === 'right' && typeof val === 'number';
  return (
    <TableCell
      key={col.name}
      sx={{
        textAlign: col.a,
        fontSize: 12,
        fontFamily: isNum || col.name.endsWith('_CD') ? 'monospace' : undefined,
        color: col.name === 'ITEM_CD' || col.name === 'MAT_CD' ? '#2563eb' : undefined,
        backgroundColor: col.edit ? '#fffbeb' : undefined,
      }}
    >
      {isNum ? val.toLocaleString(undefined, { maximumFractionDigits: 3 }) : val}
    </TableCell>
  );
}

export default function OronMpMasterMockup() {
  const [tab, setTab] = React.useState(0);
  const cur = TABS[tab];

  return (
    <MockShell
      patternCode="oron_mp_master"
      patternLabel="ORON — MP 기준정보 마스터 (완제품/반제품/원부자재/생산라인/제품그룹)"
      layoutCategory="LAYOUT_SINGLE"
      description="5개 별도 화면 (UI_MP_ITEM / UI_MP_ORN_HALB_ITEM / UI_MP_ORN_MRP_ITEM / UI_MP_ORN_RESOURCE / UI_MP_ORN_ITEM_GRP) 을 한 자리에 탭으로 나열한 mockup. 각 탭의 검색조건·컬럼은 ORON repo view/oron/masterplan/master 의 실제 jsx 와 1:1. 도메인 정정 (화장품 아님): 공장 생산 계획 마스터 (PLANT/PART/LINE · ITEM_LV_01~03 · BRAND)."
    >
      {/* SearchArea — 탭별 가변 */}
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          {cur.search.map(renderSearchField)}
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
        </Stack>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 1.5 }}>
        <Tabs value={tab} onChange={(_e, v) => setTab(v)} variant="scrollable">
          {TABS.map((t) => (
            <Tab
              key={t.key}
              label={
                <Stack direction="row" alignItems="center" spacing={0.8}>
                  <span>{t.label}</span>
                  <Chip size="small" label={t.cnt.toLocaleString()} variant="outlined" sx={{ height: 18, fontSize: 10 }} />
                </Stack>
              }
            />
          ))}
        </Tabs>
      </Box>

      {/* WorkArea */}
      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', height: '100%', gap: 1, minHeight: 0 }}>
        {/* ButtonArea */}
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {cur.label}
            <Typography component="span" sx={{ ml: 1, fontSize: 11, color: 'text.secondary', fontFamily: 'monospace' }}>
              {cur.menu}
            </Typography>
            <Typography component="span" sx={{ ml: 1.5, fontSize: 11, color: 'text.secondary' }}>
              — {cur.rows.length}건 (총 {cur.cnt.toLocaleString()}건 중)
            </Typography>
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          {cur.buttons.includes('add') && <Button variant="outlined" size="small" startIcon={<AddIcon />}>행 추가</Button>}
          {cur.buttons.includes('del') && <Button variant="outlined" size="small" startIcon={<DeleteIcon />} color="error">행 삭제</Button>}
          {cur.buttons.includes('save') && <Button variant="contained" size="small" startIcon={<SaveIcon />}>저장</Button>}
          {cur.buttons.includes('excel') && <Button variant="outlined" size="small" startIcon={<DownloadIcon />}>Excel</Button>}
        </Stack>

        {/* Grid */}
        <Paper variant="outlined" sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              {/* 그룹 헤더 행 + 단일 헤더 행 (그룹 컬럼이 있을 때만 2-tier) */}
              {cur.cols.some((c) => c.group) ? (
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox" rowSpan={2} sx={{ backgroundColor: 'grey.100' }}> </TableCell>
                    {cur.cols.map((c) => (
                      c.group
                        ? <TableCell key={c.name} colSpan={c.group.length} sx={{ backgroundColor: 'grey.200', fontWeight: 700, textAlign: 'center', borderBottom: '1px solid', borderColor: 'divider', fontSize: 12 }}>{c.h}</TableCell>
                        : <TableCell key={c.name} rowSpan={2} sx={{ backgroundColor: 'grey.100', width: c.w, fontWeight: 700, textAlign: c.a, fontSize: 12 }}>{c.h}{c.edit ? <Typography component="span" sx={{ ml: 0.4, fontSize: 9, color: '#d97706' }}>✎</Typography> : null}</TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    {cur.cols.filter((c) => c.group).flatMap((c) =>
                      c.group.map((sub) => (
                        <TableCell key={c.name + ':' + sub} sx={{ backgroundColor: 'grey.100', fontWeight: 600, textAlign: 'center', fontSize: 11 }}>{sub}</TableCell>
                      ))
                    )}
                  </TableRow>
                </TableHead>
              ) : (
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox" sx={{ backgroundColor: 'grey.100' }}> </TableCell>
                    {cur.cols.map((c) => (
                      <TableCell key={c.name} sx={{ backgroundColor: 'grey.100', width: c.w, fontWeight: 700, textAlign: c.a, fontSize: 12 }}>
                        {c.h}{c.edit ? <Typography component="span" sx={{ ml: 0.4, fontSize: 9, color: '#d97706' }}>✎</Typography> : null}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
              )}
              <TableBody>
                {cur.rows.map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell padding="checkbox"> </TableCell>
                    {cur.cols.flatMap((c) => {
                      const cell = renderCell(c, r[c.name]);
                      return Array.isArray(cell) ? cell : [cell];
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ p: 0.7, borderTop: '1px solid', borderColor: 'divider', fontSize: 10, color: 'text.secondary', backgroundColor: 'grey.50' }}>
            <span style={{ color: '#d97706', marginRight: 4 }}>✎</span> = editable · 노란 셀 = 수정 대상 · 파란 코드 = PK 식별자 · ITEM_LV_01~03 / BRAND_CD 는 그룹 헤더 (CD+NM)
          </Box>
        </Paper>
      </Box>
    </MockShell>
  );
}
