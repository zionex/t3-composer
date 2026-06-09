/**
 * DB lookup 설정
 * - STRING: DISTINCT 값 목록 → Autocomplete
 * - DATE:   MIN/MAX 조회 → DatePicker 범위 제한
 *
 * @typedef {{ table: string, column: string, schema?: string }} ParamLookup
 */

/**
 * SP 단일 파라미터 메타데이터
 * @typedef {Object} SpParam
 * @property {string}       paramName     - SP 파라미터 이름 (예: 'P_PLANT_CD')
 * @property {'STRING'|'DATE'|'NUMBER'|'INTEGER'|'BOOLEAN'} dataType
 * @property {boolean}      required      - 필수 여부
 * @property {string}       [description] - 한글 설명
 * @property {string}       [defaultValue]
 * @property {boolean}      [isView]      - true면 P_VIEW 계열 파라미터 (UI 힌트용, API 처리와 무관)
 * @property {ParamLookup}  [lookup]        - DB lookup 설정 (있으면 Autocomplete/DatePicker 렌더링)
 * @property {string[]}    [staticOptions] - 고정 선택지 (DB 조회 없이 드롭다운, lookup보다 우선)
 */

/**
 * SP 카탈로그 항목
 * @typedef {Object} SpCatalogEntry
 * @property {string}   id           - 카탈로그 고유 ID (카멜케이스)
 * @property {'STORED_PROCEDURE'|'VIEW'} sourceType
 * @property {string}   sourceName   - 실제 SP/뷰 이름
 * @property {string}   description  - 한글 설명
 * @property {'SA'|'BF'|'DP'|'MP'|'IM'|'RP'|'SO'|'CM'|'FP'|'FO'|'SNOP'} module
 * @property {'SINGLE_KPI'|'LIST_DATA'|'TIME_SERIES'|'MIXED'} returnType
 * @property {SpParam[]} params      - 입력 파라미터 목록
 * @property {string[]}  [views]     - P_VIEW 값 목록 (P_VIEW 사용 SP 전용)
 * @property {Object[]}  [mockData]  - 개발/테스트용 샘플 데이터
 */

/**
 * 위젯 dataConfig.params 배열의 각 항목 (파라미터 바인딩 정의)
 * @typedef {Object} ParamBinding
 * @property {string} key            - SP 파라미터 이름 (예: 'P_PLANT_CD')
 * @property {'fixed'|'widget'|'context'} from
 * @property {string} [value]        - from=fixed/widget 시 고정값
 * @property {string} [contextKey]   - from=context 시 sessionStore 키
 */

// ─────────────────────────────────────────────────────────────────────────────
// SP 파라미터 이름 상수
// ─────────────────────────────────────────────────────────────────────────────

/** 공통 SP 파라미터 이름 상수. 직접 문자열 입력 대신 이 상수를 사용한다. */
export const SP_PARAM = Object.freeze({
  // 뷰 선택 파라미터 (P_VIEW* 계열)
  VIEW1: 'P_VIEW1',
  VIEW2: 'P_VIEW2',
  VIEW3: 'P_VIEW3',
  VIEW4: 'P_VIEW4',
  VIEW5: 'P_VIEW5',

  // 공통 조건 파라미터
  PLANT_CD:       'P_PLANT_CD',
  LANG_CD:        'P_LANG_CD',
  USER_ID:        'P_USER_ID',
  START_DATE:     'P_START_DATE',
  END_DATE:       'P_END_DATE',
  YEAR:           'P_YEAR',
  PERIOD_CD:      'P_PERIOD_CD',
  ITEM_CD:        'P_ITEM_CD',
  ACCOUNT_CD:     'P_ACCOUNT_CD',
  CUSTOMER_CD:    'P_CUSTOMER_CD',
  LOCATION_CD:    'P_LOCATION_CD',
  RESOURCE_GROUP: 'P_RESOURCE_GROUP',
  VERSION_CD:     'P_VERSION_CD',
});

// ─────────────────────────────────────────────────────────────────────────────
// 공통 파라미터 프리셋 — 카탈로그 작성 시 스프레드로 재사용
// 예: { ...COMMON_PARAMS.plantCd, required: true }
// ─────────────────────────────────────────────────────────────────────────────

export const COMMON_PARAMS = {
  view1:     { paramName: SP_PARAM.VIEW1,      dataType: 'STRING', required: false, description: '뷰명',                   defaultValue: '', isView: true },
  view2:     { paramName: SP_PARAM.VIEW2,      dataType: 'STRING', required: false, description: '뷰명2',                  defaultValue: '', isView: true },
  plantCd:   { paramName: SP_PARAM.PLANT_CD,   dataType: 'STRING', required: false, description: '공장 코드',   defaultValue: '' },
  year:      { paramName: SP_PARAM.YEAR,       dataType: 'STRING', required: false, description: '조회 연도',   defaultValue: String(new Date().getFullYear()) },
  startDate: { paramName: SP_PARAM.START_DATE, dataType: 'DATE',   required: false, description: '시작일',      defaultValue: '' },
  endDate:   { paramName: SP_PARAM.END_DATE,   dataType: 'DATE',   required: false, description: '종료일',      defaultValue: '' },
  periodCd:  { paramName: SP_PARAM.PERIOD_CD,  dataType: 'STRING', required: false, description: '계획 기간',   defaultValue: '' },
  itemCd:    { paramName: SP_PARAM.ITEM_CD,    dataType: 'STRING', required: false, description: '품목 코드',   defaultValue: '' },
  versionCd: { paramName: SP_PARAM.VERSION_CD, dataType: 'STRING', required: false, description: '버전 코드',   defaultValue: '' },
  langCd:    { paramName: SP_PARAM.LANG_CD,    dataType: 'STRING', required: false, description: '언어 코드',               defaultValue: 'KO', staticOptions: ['KO', 'EN'] },
  userId:    { paramName: SP_PARAM.USER_ID,    dataType: 'STRING', required: false, description: '사용자 ID (로그인 정보)', defaultValue: '' },
};
