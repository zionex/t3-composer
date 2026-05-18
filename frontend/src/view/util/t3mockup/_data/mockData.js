/**
 * T3Mockup — 공통 더미 SCM 도메인 데이터
 *
 * 모든 목업 화면이 이 데이터를 import 해서 사용한다.
 * 도메인 일관성: LED Module / Camera Sensor / Battery Cell + Samsung Display / LG Innotek / Sony +
 *                KR-Suwon Plant / VN-Hanoi DC / CN-Wuxi Hub + PO-2026-XXXX / SO-2026-XXXX / WO-2026-XXXX
 */

// ─────────────────────────────────────────────
// 품목 마스터
// ─────────────────────────────────────────────
export const ITEMS = [
  { itemCd: 'IT-A001', itemNm: 'LED Module 60W',            itemTp: 'FG', itemGrp: 'LED',     unitPrice: 12500, leadTime: 7,  uom: 'EA',  useYn: 'Y' },
  { itemCd: 'IT-A002', itemNm: 'LED Module 80W',            itemTp: 'FG', itemGrp: 'LED',     unitPrice: 14800, leadTime: 7,  uom: 'EA',  useYn: 'Y' },
  { itemCd: 'IT-A003', itemNm: 'LED Module 100W',           itemTp: 'FG', itemGrp: 'LED',     unitPrice: 18500, leadTime: 10, uom: 'EA',  useYn: 'Y' },
  { itemCd: 'IT-B001', itemNm: 'Camera Sensor IMX-700',     itemTp: 'FG', itemGrp: 'CAMERA',  unitPrice: 32000, leadTime: 14, uom: 'EA',  useYn: 'Y' },
  { itemCd: 'IT-B002', itemNm: 'Camera Sensor IMX-800',     itemTp: 'FG', itemGrp: 'CAMERA',  unitPrice: 38500, leadTime: 14, uom: 'EA',  useYn: 'Y' },
  { itemCd: 'IT-C001', itemNm: 'Battery Cell 18650',        itemTp: 'FG', itemGrp: 'BATTERY', unitPrice: 4200,  leadTime: 21, uom: 'EA',  useYn: 'Y' },
  { itemCd: 'IT-C002', itemNm: 'Battery Cell 21700',        itemTp: 'FG', itemGrp: 'BATTERY', unitPrice: 5800,  leadTime: 21, uom: 'EA',  useYn: 'Y' },
  { itemCd: 'IT-C003', itemNm: 'Battery Pack 48V',          itemTp: 'FG', itemGrp: 'BATTERY', unitPrice: 285000, leadTime: 30, uom: 'EA', useYn: 'Y' },
  { itemCd: 'IT-D001', itemNm: 'Display Panel 32"',         itemTp: 'FG', itemGrp: 'DISPLAY', unitPrice: 215000, leadTime: 14, uom: 'EA', useYn: 'Y' },
  { itemCd: 'IT-D002', itemNm: 'Display Panel 55"',         itemTp: 'FG', itemGrp: 'DISPLAY', unitPrice: 480000, leadTime: 21, uom: 'EA', useYn: 'Y' },
  { itemCd: 'IT-M001', itemNm: 'PCB Substrate FR4',         itemTp: 'RM', itemGrp: 'PCB',     unitPrice: 850,    leadTime: 5,  uom: 'EA', useYn: 'Y' },
  { itemCd: 'IT-M002', itemNm: 'Resistor 10kΩ',              itemTp: 'RM', itemGrp: 'RESIST',  unitPrice: 8,      leadTime: 3,  uom: 'EA', useYn: 'Y' },
  { itemCd: 'IT-M003', itemNm: 'Capacitor 100µF',            itemTp: 'RM', itemGrp: 'CAP',     unitPrice: 45,     leadTime: 3,  uom: 'EA', useYn: 'Y' },
  { itemCd: 'IT-Z001', itemNm: 'Adhesive Tape 50mm',         itemTp: 'PK', itemGrp: 'PKG',     unitPrice: 320,    leadTime: 2,  uom: 'ROL', useYn: 'N' },
];

// ─────────────────────────────────────────────
// 거래처 마스터
// ─────────────────────────────────────────────
export const ACCOUNTS = [
  { accountCd: 'AC-001', accountNm: 'Samsung Display',       accountTp: 'CUST',  region: 'KR', creditLimit: 5000000000 },
  { accountCd: 'AC-002', accountNm: 'LG Innotek',            accountTp: 'CUST',  region: 'KR', creditLimit: 3500000000 },
  { accountCd: 'AC-003', accountNm: 'Sony Corporation',      accountTp: 'CUST',  region: 'JP', creditLimit: 4200000000 },
  { accountCd: 'AC-004', accountNm: 'BOE Technology',        accountTp: 'CUST',  region: 'CN', creditLimit: 2800000000 },
  { accountCd: 'AC-005', accountNm: 'Apple Inc.',            accountTp: 'CUST',  region: 'US', creditLimit: 9000000000 },
  { accountCd: 'AC-006', accountNm: 'Foxconn (HHP)',         accountTp: 'CUST',  region: 'TW', creditLimit: 2100000000 },
  { accountCd: 'AC-101', accountNm: 'TSMC',                  accountTp: 'SUPP',  region: 'TW', creditLimit: 0 },
  { accountCd: 'AC-102', accountNm: 'Murata',                accountTp: 'SUPP',  region: 'JP', creditLimit: 0 },
  { accountCd: 'AC-103', accountNm: 'AVX Components',        accountTp: 'SUPP',  region: 'US', creditLimit: 0 },
];

// ─────────────────────────────────────────────
// 거점 마스터 (Plant / DC / Hub)
// ─────────────────────────────────────────────
export const LOCATIONS = [
  { locatCd: 'LC-KR-01', locatNm: 'KR-Suwon Plant',       locatTp: 'PLANT', region: 'KR', capacityKD: 12000 },
  { locatCd: 'LC-KR-02', locatNm: 'KR-Asan Plant',        locatTp: 'PLANT', region: 'KR', capacityKD: 8500 },
  { locatCd: 'LC-VN-01', locatNm: 'VN-Hanoi DC',          locatTp: 'DC',    region: 'VN', capacityKD: 4500 },
  { locatCd: 'LC-VN-02', locatNm: 'VN-HCMC Plant',        locatTp: 'PLANT', region: 'VN', capacityKD: 6800 },
  { locatCd: 'LC-CN-01', locatNm: 'CN-Wuxi Hub',          locatTp: 'HUB',   region: 'CN', capacityKD: 9200 },
  { locatCd: 'LC-CN-02', locatNm: 'CN-Suzhou Plant',      locatTp: 'PLANT', region: 'CN', capacityKD: 11000 },
  { locatCd: 'LC-US-01', locatNm: 'US-Austin DC',         locatTp: 'DC',    region: 'US', capacityKD: 3200 },
  { locatCd: 'LC-MX-01', locatNm: 'MX-Tijuana Plant',     locatTp: 'PLANT', region: 'MX', capacityKD: 5400 },
];

// ─────────────────────────────────────────────
// 부서·직위
// ─────────────────────────────────────────────
export const DEPARTMENTS = [
  { deptCd: 'D-001', deptNm: '생산계획팀', headcount: 12 },
  { deptCd: 'D-002', deptNm: '구매팀',     headcount: 8 },
  { deptCd: 'D-003', deptNm: '품질관리팀', headcount: 15 },
  { deptCd: 'D-004', deptNm: '영업기획팀', headcount: 10 },
  { deptCd: 'D-005', deptNm: 'IT/SCM팀',  headcount: 18 },
];

export const POSITIONS = [
  { positionCd: 'P-M01', positionNm: '부장', level: 5 },
  { positionCd: 'P-M02', positionNm: '차장', level: 4 },
  { positionCd: 'P-M03', positionNm: '과장', level: 3 },
  { positionCd: 'P-M04', positionNm: '대리', level: 2 },
  { positionCd: 'P-M05', positionNm: '사원', level: 1 },
];

// ─────────────────────────────────────────────
// 주문 (PO / SO / WO)
// ─────────────────────────────────────────────
export const PURCHASE_ORDERS = [
  { poNo: 'PO-2026-0042', accountCd: 'AC-101', itemCd: 'IT-M001', qty: 50000,  orderDt: '2026-04-01', dueDt: '2026-04-08', status: '진행중',  amount: 42500000 },
  { poNo: 'PO-2026-0043', accountCd: 'AC-102', itemCd: 'IT-M003', qty: 120000, orderDt: '2026-04-02', dueDt: '2026-04-09', status: '입고완료', amount: 5400000 },
  { poNo: 'PO-2026-0044', accountCd: 'AC-101', itemCd: 'IT-M002', qty: 200000, orderDt: '2026-04-03', dueDt: '2026-04-06', status: '입고완료', amount: 1600000 },
  { poNo: 'PO-2026-0045', accountCd: 'AC-103', itemCd: 'IT-M003', qty: 80000,  orderDt: '2026-04-05', dueDt: '2026-04-12', status: '지연',     amount: 3600000 },
];

export const SALES_ORDERS = [
  { soNo: 'SO-2026-1102', accountCd: 'AC-001', itemCd: 'IT-A001', qty: 2000, orderDt: '2026-04-01', dueDt: '2026-04-15', status: '진행중',  amount: 25000000 },
  { soNo: 'SO-2026-1103', accountCd: 'AC-002', itemCd: 'IT-B001', qty: 800,  orderDt: '2026-04-02', dueDt: '2026-04-16', status: '진행중',  amount: 25600000 },
  { soNo: 'SO-2026-1104', accountCd: 'AC-005', itemCd: 'IT-D002', qty: 150,  orderDt: '2026-04-03', dueDt: '2026-04-24', status: '계획수립', amount: 72000000 },
  { soNo: 'SO-2026-1105', accountCd: 'AC-006', itemCd: 'IT-C002', qty: 5000, orderDt: '2026-04-04', dueDt: '2026-04-25', status: '진행중',  amount: 29000000 },
  { soNo: 'SO-2026-1106', accountCd: 'AC-003', itemCd: 'IT-A003', qty: 1200, orderDt: '2026-04-05', dueDt: '2026-04-15', status: '출하완료', amount: 22200000 },
];

export const WORK_ORDERS = [
  { woNo: 'WO-2026-7771', itemCd: 'IT-A001', locatCd: 'LC-KR-01', qty: 2500, startDt: '2026-04-08', endDt: '2026-04-12', status: 'INPROG' },
  { woNo: 'WO-2026-7772', itemCd: 'IT-B001', locatCd: 'LC-KR-02', qty: 900,  startDt: '2026-04-08', endDt: '2026-04-14', status: 'PLAN'   },
  { woNo: 'WO-2026-7773', itemCd: 'IT-D002', locatCd: 'LC-VN-02', qty: 200,  startDt: '2026-04-10', endDt: '2026-04-22', status: 'INPROG' },
  { woNo: 'WO-2026-7774', itemCd: 'IT-C002', locatCd: 'LC-CN-02', qty: 5500, startDt: '2026-04-12', endDt: '2026-04-18', status: 'PLAN'   },
  { woNo: 'WO-2026-7775', itemCd: 'IT-A003', locatCd: 'LC-KR-01', qty: 1300, startDt: '2026-04-09', endDt: '2026-04-13', status: 'DONE'   },
];

// ─────────────────────────────────────────────
// 시계열 (수요/공급 — 12 weeks)
// ─────────────────────────────────────────────
export const WEEK_BUCKETS = ['W14', 'W15', 'W16', 'W17', 'W18', 'W19', 'W20', 'W21', 'W22', 'W23', 'W24', 'W25'];

export const FORECAST_TS = [
  { itemCd: 'IT-A001', itemNm: 'LED Module 60W',  W14: 1800, W15: 2200, W16: 2400, W17: 2100, W18: 2300, W19: 2600, W20: 2800, W21: 2700, W22: 2500, W23: 2900, W24: 3100, W25: 3000 },
  { itemCd: 'IT-A002', itemNm: 'LED Module 80W',  W14: 1100, W15: 1300, W16: 1500, W17: 1400, W18: 1600, W19: 1700, W20: 1800, W21: 1900, W22: 1700, W23: 2000, W24: 2200, W25: 2100 },
  { itemCd: 'IT-B001', itemNm: 'Camera IMX-700',  W14:  700, W15:  850, W16:  900, W17:  920, W18: 1000, W19: 1100, W20: 1050, W21: 1080, W22: 1150, W23: 1200, W24: 1180, W25: 1220 },
  { itemCd: 'IT-C001', itemNm: 'Battery 18650',   W14: 4000, W15: 4500, W16: 4700, W17: 4900, W18: 5200, W19: 5400, W20: 5500, W21: 5800, W22: 5700, W23: 6000, W24: 6200, W25: 6500 },
  { itemCd: 'IT-D002', itemNm: 'Display 55"',     W14:   80, W15:   90, W16:  110, W17:  130, W18:  150, W19:  140, W20:  160, W21:  180, W22:  170, W23:  190, W24:  200, W25:  210 },
];

export const ACTUAL_TS = [
  { itemCd: 'IT-A001', W14: 1750, W15: 2100, W16: 2350, W17: 2050, W18: 2280, W19: 2580, W20: null, W21: null, W22: null, W23: null, W24: null, W25: null },
  { itemCd: 'IT-A002', W14: 1080, W15: 1280, W16: 1480, W17: 1380, W18: 1580, W19: 1680, W20: null, W21: null, W22: null, W23: null, W24: null, W25: null },
  { itemCd: 'IT-B001', W14:  680, W15:  830, W16:  890, W17:  910, W18:  990, W19: 1090, W20: null, W21: null, W22: null, W23: null, W24: null, W25: null },
];

// ─────────────────────────────────────────────
// KPI 카드
// ─────────────────────────────────────────────
export const KPI_CARDS = [
  { kpiCd: 'K01', kpiNm: '계획 충족률(RTF)',      value: 96.4,  unit: '%',   target: 95.0,  trend: 'up'   },
  { kpiCd: 'K02', kpiNm: '재고 정확도',           value: 98.7,  unit: '%',   target: 98.0,  trend: 'up'   },
  { kpiCd: 'K03', kpiNm: '결품률',                value: 1.2,   unit: '%',   target: 2.0,   trend: 'down' },
  { kpiCd: 'K04', kpiNm: '회전일수(DOH)',         value: 28.4,  unit: 'days', target: 30.0, trend: 'down' },
  { kpiCd: 'K05', kpiNm: '주간 출하량',           value: 12500, unit: 'EA',  target: 12000, trend: 'up'   },
  { kpiCd: 'K06', kpiNm: 'MAPE (예측 정확도)',    value: 8.7,   unit: '%',   target: 10.0,  trend: 'down' },
];

// ─────────────────────────────────────────────
// 알람 / 이벤트
// ─────────────────────────────────────────────
export const ALERTS = [
  { id: 'AL-001', severity: 'CRITICAL', message: 'IT-D002 결품 위험 — 안전재고 30% 미달',           dttm: '2026-04-12 09:14:22', locatCd: 'LC-KR-01' },
  { id: 'AL-002', severity: 'WARNING',  message: 'PO-2026-0045 입고 지연 (예정 4/12, 현재 4/13)',  dttm: '2026-04-13 08:01:05', locatCd: 'LC-KR-01' },
  { id: 'AL-003', severity: 'INFO',     message: 'WO-2026-7775 완료',                                dttm: '2026-04-13 16:42:18', locatCd: 'LC-KR-01' },
  { id: 'AL-004', severity: 'WARNING',  message: 'IT-B001 수요 급증 (전주 대비 +18%)',              dttm: '2026-04-13 17:30:00', locatCd: 'LC-KR-02' },
];

// ─────────────────────────────────────────────
// 사용자 정보 (P02 마스터 CRUD 샘플 — 부서/직책 cascade)
// ─────────────────────────────────────────────
export const USERS = [
  { userId: 'admin',     userNm: '관리자',     userEmail: 'admin@zionex.com',       userTel: '02-1234-5670', deptCd: 'D-005', deptNm: 'IT/SCM팀',   positionCd: 'P-M01', positionNm: '부장', userTp: 'ADMIN',  useYn: 'Y', joinDt: '2018/03/02', createBy: 'system',  createDttm: '2018-03-02 09:00:00' },
  { userId: 'kim.smk',   userNm: '김수민',     userEmail: 'kim.smk@zionex.com',     userTel: '02-1234-5671', deptCd: 'D-001', deptNm: '생산계획팀', positionCd: 'P-M03', positionNm: '과장', userTp: 'NORMAL', useYn: 'Y', joinDt: '2020/06/15', createBy: 'admin',   createDttm: '2020-06-15 09:00:00' },
  { userId: 'lee.jih',   userNm: '이지훈',     userEmail: 'lee.jih@zionex.com',     userTel: '02-1234-5672', deptCd: 'D-002', deptNm: '구매팀',     positionCd: 'P-M04', positionNm: '대리', userTp: 'NORMAL', useYn: 'Y', joinDt: '2021/09/01', createBy: 'admin',   createDttm: '2021-09-01 09:00:00' },
  { userId: 'park.jh',   userNm: '박지혜',     userEmail: 'park.jh@zionex.com',     userTel: '02-1234-5673', deptCd: 'D-003', deptNm: '품질관리팀', positionCd: 'P-M02', positionNm: '차장', userTp: 'NORMAL', useYn: 'Y', joinDt: '2019/01/20', createBy: 'admin',   createDttm: '2019-01-20 09:00:00' },
  { userId: 'choi.ms',   userNm: '최민수',     userEmail: 'choi.ms@zionex.com',     userTel: '02-1234-5674', deptCd: 'D-004', deptNm: '영업기획팀', positionCd: 'P-M05', positionNm: '사원', userTp: 'GUEST',  useYn: 'N', joinDt: '2023/04/10', createBy: 'admin',   createDttm: '2023-04-10 09:00:00' },
];

// ─────────────────────────────────────────────
// 메타 정보 (mockup 인덱스 화면에서 사용)
// ─────────────────────────────────────────────
export const MOCK_DOMAIN_LABEL = 'T3Series Mock — Battery / LED / Camera / Display SCM';
