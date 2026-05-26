/**
 * 단계별 생성 Wizard (NEW_STEP 모드) 의 9단계 데이터 모델.
 *
 * 사용자 관점 9단계:
 *   Step1. Layout 구성 (PATTERN 선택 + Area 구조 확정)
 *   Step2. 화면 전체 기본 속성 (screenId · menuCd · parent · langKey)
 *   Step3. 각 Area 컴포넌트 설정
 *   Step4. 각 Area 데이터 연결 (JPA_ENTITY · SP · 온톨로지 · 직접입력)
 *   Step5. 각 Area 의 Column 상세 정보
 *   Step6. 각 Area 의 Column 주종관계
 *   Step7. FilterBar 항목 추가 + 각 항목의 데이터 연결 · Column 설정
 *   Step8. FilterBar 주종관계 (cascade dependencies)
 *   Step9. 산출물 생성 + 메뉴 등록 (Claude 호출)
 *
 * 용어: 사용자가 'Layer' 라고 부른 것을 React 관례와 맞추기 위해 'Area' 로 통일.
 * 생성 대상 JSON 은 `toLlmPayload(spec)` 로 직렬화하여 `newStepGuide` 프롬프트에 주입.
 */

/**
 * 사전 준비: 모듈은 wizard 진입 전 선택되어 있다 (initialModuleCode 로 주입).
 * 9단계 spec 의 초기 구조. 각 단계에서 해당 필드만 채움.
 *
 * sourceMenu/sourceBundle 은 NEW_FROM_COPY 모드에서 prefill 결과를 보존하기 위한
 * 비-단계 필드 (Step 으로 노출되지 않음). LLM payload 직렬화 시 sourceMenu 만 포함.
 */
/**
 * AI 가 반환한 spec(부분) 을 정규식 기반 baseSpec 에 깊게 병합.
 *   · AI 의 값이 truthy 이면 우선 적용 (CUD SP · FilterBar · entity 등 더 정확)
 *   · AI 의 값이 비었거나 누락이면 baseSpec 의 정규식 prefill 결과 유지
 *   · areas 는 AI 결과 우선 (정확도 높음). layoutConfig.layers/filterBar 도 동일.
 *   · step3~step8 는 객체이므로 키별로 깊은 병합 (AI 우선)
 * baseSpec 은 createInitialSpecFromSource 결과. AI 호출 실패 시 그대로 사용.
 */
/**
 * 두 배열의 합집합 — 첫 배열의 순서 유지, 두 번째 배열에서 새로 추가된 항목은 뒤에 append.
 * mergeAiSpecIntoBaseSpec 의 step4 deep-merge 에서 allSpNames 합치는 데 사용.
 */
function unionPreserveOrder(a, b) {
  const seen = new Set();
  const out = [];
  const push = (arr) => {
    if (!Array.isArray(arr)) return;
    for (const x of arr) {
      if (typeof x !== 'string' || !x) continue;
      if (seen.has(x)) continue;
      seen.add(x);
      out.push(x);
    }
  };
  push(a);
  push(b);
  return out;
}

export function mergeAiSpecIntoBaseSpec(baseSpec, aiSpec) {
  if (!aiSpec || typeof aiSpec !== 'object') return baseSpec;
  const out = { ...baseSpec };

  // baseline 이 실제 JSX 에서 BaseGrid id 를 추출했는지 — defaultLayoutConfigForPattern 의 폴백
  // 키들('mainGrid'/'master'/'detail'/'mainTabs'/'mainDashboard'/'pivotGrid') 만 있으면 false.
  // 추가로 baseline step4 에 의미있는 entry (SP/JPA_ENTITY 알맹이 채워짐) 가 있어도 권위 인정.
  const baseLayers = baseSpec?.step1_layout?.layoutConfig?.layers || [];
  const FALLBACK_KEYS = new Set(['mainGrid', 'master', 'detail', 'mainTabs', 'mainDashboard', 'pivotGrid']);
  const layerHasRealKey = Array.isArray(baseLayers) && baseLayers.length > 0
    && baseLayers.some((l) => l?.key && !FALLBACK_KEYS.has(l.key));
  const baselineStep4HasContent = Object.values(baseSpec?.step4_dataBinding || {}).some((v) =>
    v && (
      (v.source === 'SP' && (v.spName
                             || (v.crudSp && (v.crudSp.read || v.crudSp.create || v.crudSp.update || v.crudSp.delete))
                             || (Array.isArray(v.allSpNames) && v.allSpNames.length > 0)))
      || (v.source === 'JPA_ENTITY' && (v.baseUrl || v.entity))
    )
  );
  const baselineHasRealGridIds = layerHasRealKey || baselineStep4HasContent;

  // step1_layout — baseline 이 실제 BaseGrid id 를 추출했으면 그것을 권위로 보고 AI 가 못 덮어쓰게.
  // 그렇지 않으면 AI 의 areas/layoutConfig 우선 (기존 동작).
  if (aiSpec.step1_layout && typeof aiSpec.step1_layout === 'object') {
    const aiL = aiSpec.step1_layout;
    const baseL = baseSpec.step1_layout || {};
    const merged = { ...baseL };
    if (!baselineHasRealGridIds) {
      if (Array.isArray(aiL.areas) && aiL.areas.length > 0) merged.areas = aiL.areas;
      if (aiL.layoutConfig && Array.isArray(aiL.layoutConfig.layers) && aiL.layoutConfig.layers.length > 0) {
        merged.layoutConfig = {
          ...(baseL.layoutConfig || {}),
          ...aiL.layoutConfig,
          filterBar: aiL.layoutConfig.filterBar
            || (baseL.layoutConfig && baseL.layoutConfig.filterBar)
            || { h: 2, items: [] },
        };
      }
    }
    // patternCode 는 AI 우선 (BaseGrid id 와 무관)
    if (typeof aiL.patternCode === 'string' && aiL.patternCode) merged.patternCode = aiL.patternCode;
    out.step1_layout = merged;
  }

  // step2_overview — AI 우선, 빈 문자열은 base 유지
  if (aiSpec.step2_overview && typeof aiSpec.step2_overview === 'object') {
    const aiO  = aiSpec.step2_overview;
    const baseO = baseSpec.step2_overview || {};
    const merged = { ...baseO };
    for (const k of Object.keys(aiO)) {
      const v = aiO[k];
      if (v != null && v !== '') merged[k] = v;
    }
    out.step2_overview = merged;
  }

  // step3~step6 (객체 of 객체) — areaId 별 병합
  for (const stepKey of ['step3_components', 'step4_dataBinding', 'step5_columns', 'step6_cascade']) {
    const aiS  = aiSpec[stepKey];
    if (!aiS || typeof aiS !== 'object') continue;
    const baseS = baseSpec[stepKey] || {};
    const merged = { ...baseS };

    if (stepKey === 'step4_dataBinding') {
      // 특수 처리 — AI 가 source 만 채우고 spName/baseUrl/crudSp 모두 비어있으면 baseline 우선
      // (LLM 이 SP 라고 답했지만 실제로는 zAxios 만 쓰는 화면 등의 케이스)
      // 그리고 crudSp 와 allSpNames 는 deep-merge — AI 의 부분 응답이 baseline 의 추가 SP 를
      // 덮어 사라지게 만들지 않도록 한다 (예: AI 가 read 만 찾고 baseline 에 D/S 가 있을 때)
      for (const areaId of Object.keys(aiS)) {
        const aiVal = aiS[areaId];
        const baseVal = baseS[areaId];
        if (!aiVal || typeof aiVal !== 'object') continue;

        const hasNonEmptyCrud = (cs) => cs && typeof cs === 'object'
          && (cs.read || cs.create || cs.update || cs.delete);
        const aiHasContent =
          (aiVal.source === 'SP' && (aiVal.spName || hasNonEmptyCrud(aiVal.crudSp)
                                     || (Array.isArray(aiVal.allSpNames) && aiVal.allSpNames.length > 0)))
          || (aiVal.source === 'JPA_ENTITY' && (aiVal.baseUrl || aiVal.entity))
          || (aiVal.source === 'ONTOLOGY' && aiVal.ontologyRef)
          || (aiVal.source === 'DIRECT'   && aiVal.directUrl);

        if (aiHasContent) {
          if (baseVal && typeof baseVal === 'object') {
            // 1) crudSp 항목별 머지 — AI 가 채운 항목은 AI 우선, AI 가 비운 항목은 baseline 유지
            const baseCrud = baseVal.crudSp || {};
            const aiCrud   = aiVal.crudSp   || {};
            const mergedCrud = {
              read:   aiCrud.read   || baseCrud.read   || '',
              create: aiCrud.create || baseCrud.create || '',
              update: aiCrud.update || baseCrud.update || '',
              delete: aiCrud.delete || baseCrud.delete || '',
            };
            // 2) allSpNames / serviceIds union (정렬 보존)
            const mergedAllSp     = unionPreserveOrder(baseVal.allSpNames, aiVal.allSpNames);
            const mergedServiceIds = unionPreserveOrder(baseVal.serviceIds, aiVal.serviceIds);
            const mergedServiceIdToSp = { ...(baseVal.serviceIdToSp || {}), ...(aiVal.serviceIdToSp || {}) };
            // 3) source='SP' 면 spName 누락 시 baseline 또는 mergedCrud.read 로 폴백
            const mergedSpName = aiVal.spName || baseVal.spName || mergedCrud.read || '';
            // 4) target 도 AI 우선, 없으면 baseline 또는 SP 이름으로 추정
            const mergedTarget = aiVal.target || baseVal.target
              || (mergedSpName ? guessTargetFromSpName(mergedSpName) : undefined);

            merged[areaId] = {
              ...baseVal,
              ...aiVal,
              ...(aiVal.source === 'SP' || baseVal.source === 'SP' ? {
                source: aiVal.source || baseVal.source,
                crudSp: mergedCrud,
                allSpNames: mergedAllSp,
                serviceIds: mergedServiceIds,
                serviceIdToSp: mergedServiceIdToSp,
                spName: mergedSpName,
                target: mergedTarget,
              } : {}),
            };
          } else {
            merged[areaId] = aiVal;
          }
        } else if (baseVal && typeof baseVal === 'object') {
          // AI 의 알맹이가 없음 — baseline 의 정규식 결과 그대로 유지
          merged[areaId] = baseVal;
        } else {
          merged[areaId] = aiVal;
        }
      }
      // ─ baseline 에만 있고 AI 가 응답하지 않은 areaId 는 자연스럽게 보존 (`out = { ...baseS }`)

      // ★ 사후 정합화 — source='SP' 인데 어떤 SP 도 못 채운 경우, baseUrl 이 있으면 JPA_ENTITY 로 강제 변환.
      // AI 가 'SP' 라고 라벨링했지만 실제로는 Java/JSX 에 SP 호출이 0건인 화면 (예: UI_AD_02 Users) 대응.
      for (const areaId of Object.keys(merged)) {
        const v = merged[areaId];
        if (!v || v.source !== 'SP') continue;
        const hasSpName  = !!v.spName;
        const hasCrud    = v.crudSp && (v.crudSp.read || v.crudSp.create || v.crudSp.update || v.crudSp.delete);
        const hasAllSp   = Array.isArray(v.allSpNames) && v.allSpNames.length > 0;
        const hasSvcIds  = Array.isArray(v.serviceIds) && v.serviceIds.length > 0;
        if (hasSpName || hasCrud || hasAllSp || hasSvcIds) continue;
        if (v.baseUrl || v.entity) {
          // 빈 SP 필드 정리 후 JPA_ENTITY 로 전환
          const corrected = { ...v, source: 'JPA_ENTITY' };
          delete corrected.spName;
          delete corrected.crudSp;
          delete corrected.allSpNames;
          delete corrected.serviceIds;
          delete corrected.serviceIdToSp;
          delete corrected.target;
          merged[areaId] = corrected;
        }
      }
    } else {
      // step3 / step5 / step6 — 일반 병합 (AI 우선)
      for (const areaId of Object.keys(aiS)) {
        const aiVal = aiS[areaId];
        const baseVal = baseS[areaId];
        if (aiVal && typeof aiVal === 'object') {
          merged[areaId] = baseVal && typeof baseVal === 'object'
            ? { ...baseVal, ...aiVal }
            : aiVal;
        }
      }
    }
    out[stepKey] = merged;
  }

  // step7_filter — fields 가 length>0 이면 AI 우선
  if (aiSpec.step7_filter && typeof aiSpec.step7_filter === 'object') {
    const aiF = aiSpec.step7_filter;
    const baseF = baseSpec.step7_filter || { blockId: 'filter_main', fields: [] };
    out.step7_filter = {
      blockId: aiF.blockId || baseF.blockId || 'filter_main',
      fields: Array.isArray(aiF.fields) && aiF.fields.length > 0 ? aiF.fields : baseF.fields,
    };
  }

  // step8_filterCascade — AI 우선
  if (aiSpec.step8_filterCascade && typeof aiSpec.step8_filterCascade === 'object') {
    out.step8_filterCascade = {
      dependencies: Array.isArray(aiSpec.step8_filterCascade.dependencies)
        ? aiSpec.step8_filterCascade.dependencies
        : (baseSpec.step8_filterCascade?.dependencies || []),
      crossFieldRules: Array.isArray(aiSpec.step8_filterCascade.crossFieldRules)
        ? aiSpec.step8_filterCascade.crossFieldRules
        : (baseSpec.step8_filterCascade?.crossFieldRules || []),
    };
  }

  // ── ★ 머지 후 정합화 (SP / JPA_ENTITY 양쪽 보강) ──
  // AI 가 step1.areas 를 새 키로 잡거나(이제 baseline 이 권위면 차단됨) AI 응답이 비어 있을 때,
  // baseline 정규식이 추출한 SP 또는 JPA_ENTITY 정보가 사라지지 않도록 첫 grid area 에 보충.
  if (out.step1_layout && Array.isArray(out.step1_layout.areas) && out.step4_dataBinding) {
    const reconciled = reconcileStep4WithAreas(out.step4_dataBinding, out.step1_layout.areas);

    const baseStep4 = baseSpec.step4_dataBinding || {};

    // baseline 의 의미 있는 entry (SP 든 JPA_ENTITY 든) 중 첫 번째
    const isBaselineSpEntry = (v) => v && v.source === 'SP'
      && (v.spName
          || (v.crudSp && (v.crudSp.read || v.crudSp.create || v.crudSp.update || v.crudSp.delete))
          || (Array.isArray(v.allSpNames) && v.allSpNames.length > 0));
    const isBaselineJpaEntry = (v) => v && v.source === 'JPA_ENTITY' && (v.baseUrl || v.entity);

    const baselineSpEntry  = Object.values(baseStep4).find(isBaselineSpEntry);
    const baselineJpaEntry = Object.values(baseStep4).find(isBaselineJpaEntry);

    const firstGridArea = out.step1_layout.areas
      .find((a) => a && a.kind !== 'search' && a.kind !== 'dashboard');

    if (firstGridArea) {
      const target = reconciled[firstGridArea.id] || {};
      const targetCrud = target.crudSp || {};

      // SP 모드 (baseline SP 우선)
      if (baselineSpEntry) {
        const baseCrud = baselineSpEntry.crudSp || {};
        const targetSpEmpty = (target.source === 'SP' || !target.source)
          && !target.spName
          && !(targetCrud.read || targetCrud.create || targetCrud.update || targetCrud.delete)
          && !(Array.isArray(target.allSpNames) && target.allSpNames.length > 0);

        if (targetSpEmpty) {
          reconciled[firstGridArea.id] = {
            ...target,
            source: 'SP',
            spName: target.spName || baselineSpEntry.spName || baseCrud.read || '',
            crudSp: {
              read:   targetCrud.read   || baseCrud.read   || '',
              create: targetCrud.create || baseCrud.create || '',
              update: targetCrud.update || baseCrud.update || '',
              delete: targetCrud.delete || baseCrud.delete || '',
            },
            allSpNames: unionPreserveOrder(baselineSpEntry.allSpNames, target.allSpNames),
            target: target.target || baselineSpEntry.target,
          };
        } else if (target.source === 'SP') {
          reconciled[firstGridArea.id] = {
            ...target,
            crudSp: {
              read:   targetCrud.read   || baseCrud.read   || '',
              create: targetCrud.create || baseCrud.create || '',
              update: targetCrud.update || baseCrud.update || '',
              delete: targetCrud.delete || baseCrud.delete || '',
            },
            allSpNames: unionPreserveOrder(baselineSpEntry.allSpNames, target.allSpNames),
          };
        }
      }
      // JPA_ENTITY 모드 (baseline JPA 우선) — SP fallback 이 적용되지 않았을 때만
      else if (baselineJpaEntry) {
        const targetJpaEmpty = (target.source === 'JPA_ENTITY' || !target.source)
          && !target.baseUrl && !target.entity;

        if (targetJpaEmpty) {
          reconciled[firstGridArea.id] = {
            ...target,
            source: 'JPA_ENTITY',
            entity:  target.entity  || baselineJpaEntry.entity  || '',
            baseUrl: target.baseUrl || baselineJpaEntry.baseUrl || '',
            methods: target.methods || baselineJpaEntry.methods,
          };
        } else if (target.source === 'JPA_ENTITY') {
          reconciled[firstGridArea.id] = {
            ...target,
            entity:  target.entity  || baselineJpaEntry.entity  || '',
            baseUrl: target.baseUrl || baselineJpaEntry.baseUrl || '',
            methods: target.methods || baselineJpaEntry.methods,
          };
        }
      }
    }

    out.step4_dataBinding = reconciled;
  }

  return out;
}

/**
 * step1_layout 의 초기 구조 헬퍼.
 *   · layoutConfig: LayoutDesigner SoT — 빈 spec 기본 = P02 (검색+그리드 1개)
 *   · areas: layoutConfig.layers 에서 자동 derive
 *   · patternCode: layers 에서 자동 추론
 * createInitialSpecFromSource / FromDesign 에서 prefill 시 이 값을 덮어쓴다.
 */
function makeInitialStep1Layout() {
  const layoutConfig = defaultLayoutConfigForPattern('P02');
  return {
    patternCode: 'P02',
    areas: layersToAreas(layoutConfig),
    layoutConfig,
  };
}

export function createInitialSpec(moduleCode = null) {
  return {
    moduleCode,
    sourceMenu: null,           // { menuCd, filePath, path } — 복사 모드 진입 시 채움
    sourceBundle: null,         // collectSourceForLlm() 응답 전체 (LLM 컨텍스트로 그대로 전달)
    designDoc: null,            // { fileName, overview, layoutSummary, sheetNames } — 설계서 모드 진입 시 채움
    parsedDesign: null,         // 설계서 파서 raw 결과 (sheets 포함, prompt 첨부용)
    layoutSizes: null,          // 설계서의 layer 사이즈 비율 (사용자 조정값 또는 Excel 추출)
    mainLayoutConfig: null,     // 설계서 검토 단계에서 사용자가 보강한 layoutConfig (선택)
    changeReq: '',              // 자유 텍스트 변경 요청 (Step9 에서 입력)
    step1_layout: makeInitialStep1Layout(),
    step2_overview: {
      screenId: '',
      screenName: '',
      menuCd: '',                 // UI_<DOMAIN>_<NAME>
      parentMenuCd: '',           // MENU_UTIL / MENU_DP / ...
      menuFilePath: '',           // /<module>[/<category>]/<PascalComponentName>
      langKey: '',                // 기본값 = menuCd
      description: '',
    },
    step3_components: {
      // { [areaId]: { components: [{ kind, id, title, props? }] } }
    },
    step4_dataBinding: {
      // { [areaId]: {
      //     source: 'JPA_ENTITY' | 'SP' | 'ONTOLOGY' | 'DIRECT' | 'ENGINE',
      //     entity?: string,           // JPA_ENTITY (예: 'User')
      //     baseUrl?: string,          // 'system/users'
      //     methods?: { search?, save?, delete? },
      //     spName?: string,           // SP (예: 'SP_UI_AD_USER_Q1')
      //     ontologyRef?: string,      // 온톨로지 menu_cd/entity id
      //     directUrl?: string,        // 직접입력 URL
      //   }
      // }
    },
    step5_columns: {
      // { [areaId]: {
      //     columns: [{ name, fieldName, dataType, headerText, width, editable, widget, validRules[], defaultValue }]
      //   }
      // }
    },
    step6_cascade: {
      // { [areaId]: {
      //     rules: [{ child: 'positionCd', parent: 'deptCd', filterParam: 'deptCd', popup: 'PopPosition' }]
      //   }
      // }
    },
    step7_filter: {
      blockId: 'filter_main',
      fields: [
        // { fieldId: 'USER_ID', type: 'TEXT', label, varName, dataType, nullWhenEmpty, required }
      ],
    },
    step8_filterCascade: {
      dependencies: [
        // { whenField, whenEvent, affectField, action, passParams, alsoClear }
      ],
      crossFieldRules: [
        // { ruleId, severity, expression, message }
      ],
    },
  };
}

/**
 * 단계별 canNext 검증. 각 단계 완료 기준을 최소한으로 유지 (엄격하게 막지 말고 경고는 UI 가).
 */
export function canProceedStep(stepIndex, spec) {
  switch (stepIndex) {
    case 0: {
      // 기존: patternCode 필수 → 변경: LayoutDesigner 의 layers 가 1개 이상 존재
      const layers = spec.step1_layout?.layoutConfig?.layers || [];
      if (layers.length > 0) return true;
      // 폴백 — legacy 데이터 (patternCode + areas) 만 있는 경우도 허용
      return !!spec.step1_layout?.patternCode;
    }
    case 1: {
      const o = spec.step2_overview;
      return !!(o.screenId && o.menuCd && o.menuFilePath && o.parentMenuCd);
    }
    case 2: return Object.keys(spec.step3_components).length > 0;
    case 3: return Object.keys(spec.step4_dataBinding).length > 0;
    case 4: {
      const cols = Object.values(spec.step5_columns);
      return cols.length > 0 && cols.some((c) => (c.columns || []).length > 0);
    }
    case 5: return true;   // cascade 는 선택
    case 6: return true;   // filter 는 선택 (검색 없는 대시보드형 가능)
    case 7: return true;   // filter cascade 는 선택
    case 8: return true;
    default: return true;
  }
}

/**
 * 이전 단계 변경 시 하위 단계의 관련 데이터 초기화.
 *
 * (2026-04 수정) 종전 case 1 이 stepIndex=1 (Step2 Overview) 에 매칭되어 있어,
 * Step2 진입 시 useEffect 의 자동 동기화 (langKey / menuFilePath) 가 onChange 를
 * 호출하면 step3~6 prefill 데이터가 모조리 사라지는 버그 존재.
 * → 올바른 매핑 (case 0 = Step1 Layout) 으로 정정.
 * → 또한 전체 리셋이 아니라 'areaId 가 사라진 키만 제거' 로 변경해
 *   NEW_FROM_COPY 의 step3~6 prefill 이 Layout 미변경 시 보존되도록 함.
 */
export function invalidateDownstream(spec, changedStep) {
  const next = { ...spec };
  switch (changedStep) {
    case 0: { // Step1 Layout 변경 → 단순 drop 대신 reconcile 로 데이터 보존
      // (NEW_FROM_COPY: BaseGrid id='userInfoGrid' baseline → P02 default 'mainGrid' 리셋 시
      //  step4_dataBinding 이 통째 버려지던 회귀 방지)
      const areas = (next.step1_layout && next.step1_layout.areas) || [];
      next.step3_components  = reconcileStep3WithAreas(next.step3_components,  areas);
      next.step4_dataBinding = reconcileStep4WithAreas(next.step4_dataBinding, areas);
      next.step5_columns     = reconcileGridStepWithAreas(next.step5_columns,  areas);
      next.step6_cascade     = reconcileGridStepWithAreas(next.step6_cascade,  areas);
      break;
    }
    // Step2 (overview) 변경은 다른 단계와 독립이므로 invalidate 없음
    case 3: // DataBinding 변경 → columns/cascade 리셋 (areaId 별로 리셋해도 되지만 안전하게 전체)
      next.step5_columns      = {};
      next.step6_cascade      = {};
      break;
    case 4: // Columns 변경 → cascade 리셋 (컬럼이 사라졌을 수 있음)
      next.step6_cascade      = {};
      break;
    case 6: // Filter 필드 변경 → filter cascade 리셋
      next.step8_filterCascade = { dependencies: [], crossFieldRules: [] };
      break;
    default:
      break;
  }
  return next;
}

/**
 * 단계별 수집 JSON 을 LLM prompt 용 payload 로 직렬화.
 * `ComposerPromptBuilder.newStepGuide` 가 이 JSON 을 받아 구조화된 지시를 생성한다.
 *
 * sourceMenu 가 있으면 NEW_FROM_COPY 모드 (복사 기반 9단계) 임을 알리는 메타.
 * LLM 은 sourceMenu.menuCd 를 참조 원본으로 삼아 복제하되, screen.menuCd 등 신규
 * 값으로 치환해야 한다. (sourceBundle 자체는 별도 텍스트 블록으로 prompt 에 첨부)
 */
export function toLlmPayload(spec, module, pattern) {
  return {
    module: module ? {
      code: module.code,
      nameEn: module.nameEn || module.name,
      nameKo: module.nameKo,
      tablePrefix: `TB_${module.code}_`,
    } : null,
    pattern: pattern ? {
      code: pattern.code,
      name: pattern.name,
      layout: pattern.layout,
      example: pattern.example,
    } : null,
    sourceMenu: spec.sourceMenu || null,
    designDoc: spec.designDoc || null,
    layoutAreas: spec.step1_layout.areas,
    // LayoutDesigner SoT — LLM 이 좌표·크기·컴포넌트타입을 직접 참고하도록 첨부
    layoutConfig: spec.step1_layout.layoutConfig || null,
    screen: spec.step2_overview,
    areaComponents: spec.step3_components,
    areaDataBinding: spec.step4_dataBinding,
    areaColumns: spec.step5_columns,
    areaCascade: spec.step6_cascade,
    filterBar: {
      blockId: spec.step7_filter.blockId,
      fields: spec.step7_filter.fields,
      dependencies: spec.step8_filterCascade.dependencies,
      crossFieldRules: spec.step8_filterCascade.crossFieldRules,
    },
  };
}

// ============================================================================
// 원본 화면 → 9단계 Spec Prefill (NEW_FROM_COPY 진입용)
// ============================================================================

/**
 * collectSourceForLlm() 응답 (`sourceBundle`) 과 사용자 입력 (newMenuCd / newTitle)
 * 으로부터 9단계 spec 의 초기값을 생성한다.
 *
 * 자동 추출 가능한 단계만 채우고, 나머지는 비워둔다 (사용자가 wizard 에서 채우거나
 * LLM 이 생성 시 sourceBundle 을 참조해 복제). 추출이 부정확할 수 있으므로 사용자가
 * 각 Step 에서 검토·수정하도록 한다.
 *
 * @param {Object}   args
 * @param {Object}   args.sourceMenu    { id (=menuCd), filePath, path }
 * @param {Object}   args.sourceBundle  collectSourceForLlm() 응답 전체
 * @param {string}  [args.moduleCode]   사용자가 선택한 모듈 (없으면 sourceMenu 에서 추론)
 * @param {string}  [args.newMenuCd]    신규 메뉴코드
 * @param {string}  [args.newTitle]     신규 제목
 * @param {string}  [args.changeReq]    추가 변경 요청 (Step9 prompt 에 첨부)
 * @returns {Object} createInitialSpec() 와 동일 shape · 일부 필드 prefill
 */
export function createInitialSpecFromSource({
  sourceMenu,
  sourceBundle,
  moduleCode,
  newMenuCd,
  newTitle,
  changeReq,
}) {
  const inferredModule = moduleCode || inferModuleFromMenuCd(sourceMenu?.id);
  const spec = createInitialSpec(inferredModule);

  // 디버깅: sourceBundle 의 핵심 필드 요약 — 사용자 환경에서 prefill 부족 진단
  if (typeof console !== 'undefined' && console.info) {
    const screen = sourceBundle?.screen;
    const screenLen = (screen && (screen.source || screen.content || screen.body) || '').length;
    const fp = (sourceBundle?.frontendProcedures || []).length;
    const bp = (sourceBundle?.backend?.procedures || []).length;
    const bc = (sourceBundle?.backend?.controllers || []).length;
    const be = (sourceBundle?.backend?.entities || []).length;
    const ac = (sourceBundle?.apiCalls || []).length;
    console.info('[Composer prefill] sourceBundle 요약:',
      { sourceMenu: sourceMenu?.id, screenLen, frontendProcedures: fp,
        'backend.procedures': bp, 'backend.controllers': bc, 'backend.entities': be, apiCalls: ac });
  }

  spec.sourceMenu = sourceMenu
    ? { menuCd: sourceMenu.id, filePath: sourceMenu.filePath, path: sourceMenu.path }
    : null;
  spec.sourceBundle = sourceBundle || null;
  spec.changeReq = changeReq || '';

  // Step1 Layout — 원본 JSX 에서 SplitPanel/TabContainer 사용 여부로 패턴 추론
  const screenSrc = pickScreenSource(sourceBundle);
  spec.step1_layout = inferLayoutFromJsx(screenSrc);

  // Step1 보강 — FilterBar 항목을 layoutConfig.filterBar.items 에 prefill (시각용 칩)
  if (spec.step1_layout?.layoutConfig) {
    const filterItems = parseFilterBarItemsFromJsx(screenSrc);
    if (filterItems.length > 0) {
      spec.step1_layout.layoutConfig = {
        ...spec.step1_layout.layoutConfig,
        filterBar: {
          h: spec.step1_layout.layoutConfig.filterBar?.h || 2,
          items: filterItems,
        },
      };
    }
  }

  // Step1 보강 — 원본 JSX 의 BaseGrid id 들을 layers 의 key 로 사용해
  // 이후 Step3~5 가 동일 id 로 prefill 데이터를 참조할 수 있도록 정합성 보장
  const baseGrids = pickScreenSource(sourceBundle)
    ? extractBaseGridsForLayers(screenSrc)
    : [];
  if (baseGrids.length > 0 && spec.step1_layout?.layoutConfig) {
    const layoutConfig = spec.step1_layout.layoutConfig;
    const COLS = layoutConfig.cols || 12;
    const ROWS = 12;
    let newLayers;
    if (baseGrids.length === 1) {
      newLayers = [{
        key: baseGrids[0], x: 0, y: 0, w: COLS, h: ROWS,
        title: baseGrids[0], componentType: 'GRID_BASE',
      }];
    } else if (baseGrids.length === 2) {
      newLayers = [
        { key: baseGrids[0], x: 0,        y: 0, w: COLS / 2, h: ROWS,
          title: baseGrids[0], componentType: 'GRID_BASE' },
        { key: baseGrids[1], x: COLS / 2, y: 0, w: COLS / 2, h: ROWS,
          title: baseGrids[1], componentType: 'GRID_BASE' },
      ];
    } else {
      // 3개 이상 — 좌우/상하 분할 단순 매핑
      newLayers = baseGrids.slice(0, 4).map((id, i) => ({
        key: id,
        x: (i % 2) * (COLS / 2), y: Math.floor(i / 2) * (ROWS / 2),
        w: COLS / 2, h: ROWS / 2,
        title: id, componentType: 'GRID_BASE',
      }));
    }
    spec.step1_layout.layoutConfig = { ...layoutConfig, layers: newLayers };
    spec.step1_layout.areas = layersToAreas(spec.step1_layout.layoutConfig);
  }

  // Step2 Overview — 신규 메뉴코드 / 제목 / 파일경로
  spec.step2_overview = inferOverviewFromMenuCd({
    sourceMenu,
    newMenuCd,
    newTitle,
    moduleCode: inferredModule,
  });

  // Step3 Components — 원본 JSX 의 SearchArea + BaseGrid + 버튼들 매핑
  // areas 와 강제 정합화 → 추출 실패/부분 실패 케이스에서도 모든 areaId 에 entry 보장
  const components = parseAreaComponentsFromJsx(screenSrc);
  spec.step3_components = reconcileStep3WithAreas(components, spec.step1_layout.areas);

  // Step4 DataBinding — 원본 JSX 의 zAxios URL · callService SP 추출
  // sourceBundle 의 frontendProcedures + backend.procedures · apiCalls 도 함께 분석
  // 정합화 (reconcileStep4WithAreas) — areas 의 grid 류 area 마다 entry 보장
  const dataBinding = parseDataBindingFromJsx(screenSrc, sourceBundle);
  const entityClassNames = extractEntityClassNamesFromBundle(sourceBundle);
  for (const gridId of Object.keys(dataBinding || {})) {
    const bind = dataBinding[gridId];
    if (bind.source === 'JPA_ENTITY' && !bind.entity) {
      bind.entity = entityClassNames[0] || guessEntityFromBaseUrl(bind.baseUrl);
    }
  }
  spec.step4_dataBinding = reconcileStep4WithAreas(dataBinding, spec.step1_layout.areas);
  // reconcile 후 entity 보강을 한 번 더 (분배된 entry 도 entity 채움)
  for (const gridId of Object.keys(spec.step4_dataBinding)) {
    const bind = spec.step4_dataBinding[gridId];
    if (bind.source === 'JPA_ENTITY' && !bind.entity) {
      bind.entity = entityClassNames[0] || guessEntityFromBaseUrl(bind.baseUrl);
    }
  }

  // Step5 Columns — 원본 gridItems 배열 추출 (정확도 비보장 — 사용자가 Step5 에서 검토)
  const columnsByGrid = parseColumnsFromJsx(screenSrc);
  if (columnsByGrid && Object.keys(columnsByGrid).length > 0) {
    const step5 = {};
    for (const gridId of Object.keys(columnsByGrid)) {
      step5[gridId] = { columns: columnsByGrid[gridId] };
    }
    spec.step5_columns = step5;
  }

  // Step7 FilterBar fields — SearchArea InputField 들로부터 풍부 메타 prefill
  const filterFields = parseStep7FilterFromJsx(screenSrc);
  if (filterFields.length > 0) {
    spec.step7_filter = {
      blockId: 'filter_main',
      fields: filterFields,
    };
  }

  // 마지막 정합화 — baseline 단계에서도 step1.areas 와 step3~6 의 키를 한 번 더 reconcile.
  // (createInitialSpecFromSource 안에서 이미 reconcileStep3/4WithAreas 를 부르지만,
  //  step5_columns 등 다른 단계의 키 누락도 방어 — invalidateDownstream 한 번이 가장 안전)
  return invalidateDownstream(spec, 0);
}

/**
 * sourceBundle.backend.entities 에서 className 들을 순서대로 추출.
 * 첫 entity 가 보통 그 화면의 주 Entity (예: UserInfo / Issue / User).
 */
function extractEntityClassNamesFromBundle(sourceBundle) {
  if (!sourceBundle || typeof sourceBundle !== 'object') return [];
  const backend = sourceBundle.backend;
  if (!backend || typeof backend !== 'object') return [];
  const entities = Array.isArray(backend.entities) ? backend.entities : [];
  return entities
    .map((e) => (e && (e.className || e.name)) || null)
    .filter((n) => typeof n === 'string' && n.length > 0);
}

/**
 * baseUrl 의 마지막 세그먼트로부터 Entity 클래스명 추정.
 *   · 'system/users'    → 'User'
 *   · 'util/user-infos' → 'UserInfo'
 *   · 'issue'           → 'Issue'
 *   · 'util/issues'     → 'Issue'
 * 단수형 변환 + kebab-case → PascalCase.
 */
function guessEntityFromBaseUrl(baseUrl) {
  if (!baseUrl || typeof baseUrl !== 'string') return '';
  const segs = baseUrl.split('/').filter(Boolean);
  if (segs.length === 0) return '';
  let last = segs[segs.length - 1];
  // 단수형 — es 또는 s 접미어 단순 제거 (영어 위주)
  if (/ies$/.test(last))      last = last.replace(/ies$/, 'y');
  else if (/ses$/.test(last)) last = last.replace(/ses$/, 's');
  else if (/s$/.test(last))   last = last.replace(/s$/, '');
  // kebab → PascalCase
  return last
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');
}

/**
 * extractBaseGridsFromJsx 의 id 만 뽑아 배열 반환 (createInitialSpecFromSource 내부용).
 * BaseGrid + TreeGrid 모두 인식.
 */
function extractBaseGridsForLayers(jsx) {
  if (!jsx) return [];
  const text = jsx.toString();
  const re = /<(BaseGrid|TreeGrid)\b([^>]*?)(?:\/>|>[\s\S]*?<\/\1>)/g;
  const out = [];
  const seen = new Set();
  let m;
  while ((m = re.exec(text)) !== null) {
    const idMatch = /\bid\s*=\s*['"]([^'"]+)['"]/.exec(m[2] || '');
    if (idMatch && !seen.has(idMatch[1])) {
      out.push(idMatch[1]);
      seen.add(idMatch[1]);
    }
  }
  return out;
}

/**
 * Step3 의 키가 areas[].id 와 정확히 일치하도록 정합화.
 *   · parsed[areaId] 가 있으면 그대로 사용
 *   · parsed['mainSearch'] 가 있고 area.kind=='search' 이면 매핑
 *   · 그 외에는 inferComponentsFromAreas([a]) 의 단일 area fallback 사용
 *
 * 결과적으로 모든 areaId 에 대해 entry 가 보장 → Step3Components 화면에 빈 칸 없음.
 */
function reconcileStep3WithAreas(parsed, areas) {
  const out = {};
  if (!Array.isArray(areas) || areas.length === 0) return parsed || {};
  const parsedKeys = Object.keys(parsed || {});
  for (const a of areas) {
    if (parsed && parsed[a.id]) {
      out[a.id] = parsed[a.id];
      continue;
    }
    if (a.kind === 'search' && parsed && parsed.mainSearch) {
      out[a.id] = parsed.mainSearch;
      continue;
    }
    // grid 류 — parsed 에 areas 와 무관한 grid id 가 있으면 첫 매치를 사용
    if (a.kind !== 'search' && parsedKeys.length > 0) {
      const candidate = parsedKeys.find((k) => k !== 'mainSearch' && !areas.some((x) => x.id === k && x.id !== a.id));
      if (candidate && parsed[candidate]) {
        out[a.id] = parsed[candidate];
        continue;
      }
    }
    // 최종 fallback — kind 기반 기본 컴포넌트 (BaseGrid + 표준 버튼 또는 SearchArea)
    const single = inferComponentsFromAreas([a]);
    out[a.id] = single[a.id];
  }
  return out;
}

/**
 * sourceBundle 안에서 화면(JSX) 텍스트를 가장 그럴듯하게 골라 반환.
 * collectSourceForLlm 응답은 { screen, components, controllers, ... } 구조.
 */
function pickScreenSource(bundle) {
  if (!bundle || typeof bundle !== 'object') return '';
  const screen = bundle.screen;
  if (screen) {
    if (typeof screen === 'string') return screen;
    if (Array.isArray(screen)) {
      return screen.map((it) => it?.content || it?.source || '').join('\n');
    }
    const direct = screen.content || screen.source || screen.body || '';
    if (direct) return direct;
  }
  // ── Fallback: legacy ViewManualController 응답 형식 (sources[].type='SCREEN') ──
  if (Array.isArray(bundle.sources)) {
    const screenSrc = bundle.sources.find((s) => s && s.type === 'SCREEN');
    if (screenSrc) return screenSrc.content || screenSrc.source || '';
  }
  return '';
}

/**
 * sourceBundle.frontendSources 가 누락된 응답 형식(legacy)에서도
 * sources[].type='COMPONENT' 를 frontendSources 처럼 사용할 수 있도록 정규화.
 */
function pickFrontendSources(bundle) {
  if (!bundle || typeof bundle !== 'object') return [];
  if (Array.isArray(bundle.frontendSources) && bundle.frontendSources.length > 0) {
    return bundle.frontendSources;
  }
  if (Array.isArray(bundle.sources)) {
    return bundle.sources
      .filter((s) => s && s.type === 'COMPONENT')
      .map((s) => ({ path: s.path, source: s.content || s.source }));
  }
  return [];
}

/**
 * JSX 텍스트에서 SplitPanel / TabContainer / 검색·그리드 사용 패턴을 검출해
 * step1_layout (patternCode + areas) 추론.
 *
 * 정확도가 100% 가 아니므로 사용자가 Step1 에서 검토 가능. 추론 실패 시 P02 기본.
 */
export function inferLayoutFromJsx(jsx) {
  const text = (jsx || '').toString();
  if (!text) {
    const layoutConfig = defaultLayoutConfigForPattern('P02');
    return { patternCode: 'P02', areas: layersToAreas(layoutConfig), layoutConfig };
  }
  const hasSplit = /<SplitPanel\b/.test(text);
  const hasTabs  = /<TabContainer\b/.test(text);
  const hasPivot = /\bPivotTable\b|\bcrossTab\b|iteration\s*:\s*{/.test(text);
  const hasDashboard = /<DashboardPanel\b/.test(text);

  let patternCode = 'P02';
  if (hasDashboard) patternCode = 'P01';
  else if (hasSplit) patternCode = 'P04';
  else if (hasTabs)  patternCode = 'P03';
  else if (hasPivot) patternCode = 'P06';

  const layoutConfig = defaultLayoutConfigForPattern(patternCode);
  return {
    patternCode,
    areas: layersToAreas(layoutConfig),
    layoutConfig,
  };
}

// ============================================================================
// JSX 파싱 헬퍼 — NEW_FROM_COPY 시 원본 JSX 에서 다음을 정규식으로 추출
//   · SearchArea 의 InputField/SearchMenuInput/CommonCodeSelect/Pop* → FilterBar items + Step7 fields
//   · BaseGrid id + items 변수명 → step3_components + step5_columns 매핑
//   · zAxios.get/post · callService 호출 → step4_dataBinding (URL/SP)
//   · 그리드 버튼 컴포넌트 (GridSaveButton/GridDeleteRowButton/GridExcelExportButton) → step3 buttons
// 정확도 100% 가 아니므로 사용자가 wizard 에서 수정 가능.
// ============================================================================

/**
 * SearchArea 블록 안의 InputField·SearchMenuInput·CommonCodeSelect·Pop* 추출.
 * 반환: [{ name, type, label, options? }, ...]
 */
function extractSearchFieldsFromJsx(jsx) {
  if (!jsx) return [];
  const text = jsx.toString();
  // SearchArea 블록 (가장 첫 번째만)
  const sa = text.match(/<SearchArea[\s\S]*?<\/SearchArea>/);
  if (!sa) return [];
  const block = sa[0];

  const items = [];
  const seen = new Set();

  // <InputField ... /> · <InputField ...></InputField>
  const inputRe = /<InputField\b([^>]*?)(?:\/>|>[\s\S]*?<\/InputField>)/g;
  let m;
  while ((m = inputRe.exec(block)) !== null) {
    const attrs = m[1];
    const name  = pickAttr(attrs, 'name');
    if (!name || seen.has(name)) continue;
    items.push({
      name,
      type: pickAttr(attrs, 'type') || 'text',
      label: pickI18nOrText(attrs, 'label'),
      placeholder: pickI18nOrText(attrs, 'placeholder'),
      kind: 'InputField',
    });
    seen.add(name);
  }

  // <SearchMenuInput ... /> · <CommonCodeSelect ... /> · <Pop* />
  const otherRe = /<(SearchMenuInput|CommonCodeSelect|UserInputField|PlanScope|Pop[A-Za-z]+)\b([^>]*?)(?:\/>|>[\s\S]*?<\/\1>)/g;
  while ((m = otherRe.exec(block)) !== null) {
    const tag   = m[1];
    const attrs = m[2];
    const name  = pickAttr(attrs, 'name') || (`field${items.length + 1}`);
    if (seen.has(name)) continue;
    items.push({
      name,
      type: tagToFieldType(tag),
      label: pickI18nOrText(attrs, 'label'),
      kind: tag,
      groupCd: pickAttr(attrs, 'groupCd') || pickAttr(attrs, 'group-cd'),
    });
    seen.add(name);
  }
  return items;
}

function tagToFieldType(tag) {
  if (tag === 'SearchMenuInput')  return 'menu';
  if (tag === 'CommonCodeSelect') return 'select';
  if (tag === 'UserInputField')   return 'user';
  if (tag === 'PlanScope')        return 'planScope';
  if (tag.startsWith('Pop'))      return 'popup';
  return 'text';
}

/** attrs 문자열에서 attrName 의 값을 추출. "..." · '...' · {expr} · {true} · {false} 지원. */
function pickAttr(attrs, attrName) {
  if (!attrs) return null;
  // attrName="value" 또는 attrName='value' 또는 attrName={value}
  const re = new RegExp(`\\b${attrName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|\\{([^{}]*)\\})`);
  const m = re.exec(attrs);
  if (!m) return null;
  return m[1] ?? m[2] ?? (m[3] || '').trim();
}

/** label·placeholder 같은 i18n 가능 속성 — transLangKey('XXX') / "XXX" / 'XXX' / {text} 모두 처리. */
function pickI18nOrText(attrs, attrName) {
  const raw = pickAttr(attrs, attrName);
  if (!raw) return '';
  // transLangKey('KEY') 또는 transLangKey("KEY") 패턴
  const m = /transLangKey\(\s*['"]([^'"]+)['"]\s*\)/.exec(raw);
  if (m) return m[1];
  // 단순 따옴표 내 문자열
  const m2 = /^['"]([^'"]+)['"]$/.exec(raw.trim());
  if (m2) return m2[1];
  return raw;
}

/**
 * SearchArea 의 검색 필드 → FilterBar.items (LayoutDesigner 의 시각용 칩 목록).
 */
export function parseFilterBarItemsFromJsx(jsx) {
  const fields = extractSearchFieldsFromJsx(jsx);
  return fields.map((f, i) => ({
    key: f.name || `f${i + 1}`,
    label: f.label || f.name || `Field${i + 1}`,
  }));
}

/**
 * SearchArea 의 검색 필드 → Step7 filterBar.fields (LLM 가이드용 풍부 메타).
 */
export function parseStep7FilterFromJsx(jsx) {
  const fields = extractSearchFieldsFromJsx(jsx);
  return fields.map((f, i) => {
    const fieldId = (f.name || `field${i + 1}`).replace(/([A-Z])/g, '_$1').toUpperCase();
    return {
      fieldId,
      varName: f.name || `field${i + 1}`,
      type: jsxTypeToFilterType(f.type, f.kind),
      label: f.label || f.name || `Field${i + 1}`,
      dataType: 'string',
      nullWhenEmpty: true,
      required: false,
      groupCd: f.groupCd || undefined,
    };
  });
}

/**
 * JSX 의 InputField type · 컴포넌트 종류 → Step7 의 FIELD_TYPES (filter-bar.schema.json) 값으로 매핑.
 * Step7FilterBar 의 FIELD_TYPES 에 존재하는 값만 사용 (TEXT/NUMBER/DATE/DATE_RANGE/DROPDOWN/CHECKBOX/RADIO/POPUP/AUTOCOMPLETE/DOMAIN_*).
 */
function jsxTypeToFilterType(type, kind) {
  if (kind === 'CommonCodeSelect') return 'DROPDOWN';   // 공통코드는 DROPDOWN 으로
  if (kind && kind.startsWith('Pop')) return 'POPUP';
  if (kind === 'SearchMenuInput')  return 'AUTOCOMPLETE'; // 메뉴 검색은 AUTOCOMPLETE
  if (kind === 'UserInputField')   return 'DOMAIN_USER';
  if (kind === 'PlanScope')        return 'DOMAIN_PLAN_SCOPE';
  switch ((type || '').toLowerCase()) {
    case 'select':       return 'DROPDOWN';
    case 'multiselect':  return 'MULTISELECT';
    case 'check':        return 'CHECKBOX';
    case 'radio':        return 'RADIO';
    case 'number':       return 'NUMBER';
    case 'datetime':     return 'DATETIME';
    case 'daterange':    return 'DATE_RANGE';
    case 'autocomplete': return 'AUTOCOMPLETE';
    default:             return 'TEXT';
  }
}

/**
 * <BaseGrid id="..." items={xxxItems}> · <TreeGrid ...> 들을 추출.
 * 반환: [{ id, itemsVarName, kind }]
 */
function extractBaseGridsFromJsx(jsx) {
  if (!jsx) return [];
  const text = jsx.toString();
  const re = /<(BaseGrid|TreeGrid)\b([^>]*?)(?:\/>|>[\s\S]*?<\/\1>)/g;
  const out = [];
  const seen = new Set();
  let m;
  while ((m = re.exec(text)) !== null) {
    const tag   = m[1];
    const attrs = m[2];
    const id    = pickAttr(attrs, 'id');
    if (!id || seen.has(id)) continue;
    const items = pickAttr(attrs, 'items');
    out.push({ id, itemsVarName: items || '', kind: tag });
    seen.add(id);
  }
  return out;
}

/**
 * 변수명 (예: 'gridItems', 'issueMgmtItems') 의 배열 정의를 jsx 텍스트에서 찾아 컬럼 객체 배열로 파싱.
 *   대상 패턴:
 *     let|const|var <name> = [ ... ];
 *     useState([ ... ])  (변수 선언 옆에 useState 있으면)
 *
 * 컬럼 객체는 단순 정규식으로 한 객체 = `{ key: value, ... }` 매칭. 실패 시 빈 배열.
 */
function extractGridItemsArray(jsx, varName) {
  if (!jsx || !varName) return [];
  const text = jsx.toString();
  // 1) let/const/var <name> = [ ... ];
  let arrText = null;
  const decl = new RegExp(`(?:let|const|var)\\s+${varName}\\s*=\\s*(\\[[\\s\\S]*?\\]);`);
  const dm = decl.exec(text);
  if (dm) arrText = dm[1];
  // 2) useState 안 — `const [<varName>, set<...>] = useState([...])`
  if (!arrText) {
    const us = new RegExp(`useState\\(\\s*(\\[[\\s\\S]*?\\])\\s*\\)`);
    // 같은 파일에 여러 useState 가 있으면 첫 매치만. 보수적으로 varName 이 useState 호출 직전 선언에 있는 경우만.
    const mu = new RegExp(`\\[\\s*${varName}\\s*,[^\\]]*\\]\\s*=\\s*useState\\(\\s*(\\[[\\s\\S]*?\\])\\s*\\)`);
    const mm = mu.exec(text) || us.exec(text);
    if (mm) arrText = mm[1];
  }
  if (!arrText) return [];
  return parseColumnObjectsFromArrayText(arrText);
}

/**
 * `[ {a:1,b:'x'}, {...} ]` 배열 텍스트에서 객체들을 추출해 BaseGrid 컬럼 형태로 변환.
 * 객체 내부에 함수/콜백이 있을 수 있으므로 중괄호 깊이 카운팅으로 분리.
 */
function parseColumnObjectsFromArrayText(arrText) {
  const out = [];
  let depth = 0;
  let inString = null;
  let objStart = -1;
  for (let i = 0; i < arrText.length; i += 1) {
    const ch = arrText[i];
    const prev = i > 0 ? arrText[i - 1] : '';
    if (inString) {
      if (ch === inString && prev !== '\\') inString = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { inString = ch; continue; }
    if (ch === '{') { if (depth === 0) objStart = i; depth += 1; continue; }
    if (ch === '}') {
      depth -= 1;
      if (depth === 0 && objStart >= 0) {
        const objText = arrText.slice(objStart, i + 1);
        const col = parseSingleColumnObject(objText);
        if (col) out.push(col);
        objStart = -1;
      }
    }
  }
  return out;
}

function parseSingleColumnObject(objText) {
  // 단순 key: value 추출 — 함수·콜백 무시
  const pick = (k) => {
    const re = new RegExp(`\\b${k}\\s*:\\s*(?:"([^"]*)"|'([^']*)'|([0-9]+(?:\\.[0-9]+)?)|(true|false))`);
    const m = re.exec(objText);
    if (!m) return undefined;
    if (m[1] !== undefined) return m[1];
    if (m[2] !== undefined) return m[2];
    if (m[3] !== undefined) return Number(m[3]);
    if (m[4] !== undefined) return m[4] === 'true';
    return undefined;
  };
  const name       = pick('name');
  const fieldName  = pick('fieldName') || name;
  if (!name) return null;
  const dataType   = pick('dataType') || 'text';
  const headerText = pick('headerText') || pick('header') || name;
  const widthRaw   = pick('width');
  const width      = typeof widthRaw === 'number' ? widthRaw
                   : (widthRaw && /^\d+$/.test(String(widthRaw)) ? parseInt(widthRaw, 10) : undefined);
  const editable   = pick('editable');
  const visible    = pick('visible');
  const textAlignment = pick('textAlignment') || pick('textAlign');
  return {
    name,
    fieldName,
    dataType,
    headerText,
    width: width !== undefined ? width : 120,
    editable: editable === true,
    visible: visible === false ? false : true,
    textAlignment: textAlignment || (dataType === 'number' ? 'far'
                                  : dataType === 'datetime' || dataType === 'boolean' ? 'center'
                                  : 'left'),
  };
}

/**
 * BaseGrid id 별 컬럼 배열 매핑.
 * 반환: { [gridId]: [{ name, fieldName, dataType, headerText, width, editable, ... }, ...] }
 */
export function parseColumnsFromJsx(jsx) {
  const grids = extractBaseGridsFromJsx(jsx);
  const out = {};
  for (const g of grids) {
    const cols = g.itemsVarName ? extractGridItemsArray(jsx, g.itemsVarName) : [];
    if (cols.length > 0) out[g.id] = cols;
  }
  return out;
}

/**
 * Step3 components prefill — BaseGrid id + 같은 영역 내 버튼들 매핑.
 * 반환: { [gridId]: { components: [{kind:'BaseGrid', id, title}], buttons: [{kind, grid}] } }
 *      + 검색이 있으면 추가로 `mainSearch` area 에 SearchArea 컴포넌트.
 */
export function parseAreaComponentsFromJsx(jsx) {
  const out = {};
  if (!jsx) return out;
  const text = jsx.toString();

  // 검색 영역
  const hasSearch = /<SearchArea\b/.test(text);
  if (hasSearch) {
    out.mainSearch = {
      components: [{ kind: 'SearchArea', id: 'mainSearch', title: '검색 조건' }],
      buttons: [],
    };
  }

  // 그리드들 + 그리드별 버튼
  const grids = extractBaseGridsFromJsx(text);
  // 버튼 추출 (전체 jsx 에서 어떤 버튼 태그가 있는지)
  const btnRe = /<(GridAddRowButton|GridDeleteRowButton|GridSaveButton|GridExcelExportButton|GridExcelImportButton)\b([^>]*?)(?:\/>|>[\s\S]*?<\/\1>)/g;
  const buttonsByGrid = {};
  let bm;
  while ((bm = btnRe.exec(text)) !== null) {
    const kind = bm[1];
    const attrs = bm[2];
    const gridId = pickAttr(attrs, 'grid') || (grids[0]?.id || 'mainGrid');
    if (!buttonsByGrid[gridId]) buttonsByGrid[gridId] = [];
    buttonsByGrid[gridId].push({ kind, grid: gridId });
  }

  grids.forEach((g, i) => {
    out[g.id] = {
      components: [{ kind: 'BaseGrid', id: g.id, title: `Grid ${i + 1}` }],
      buttons: buttonsByGrid[g.id] || [],
    };
  });

  return out;
}

/**
 * SERVICE_ID 에서 SP 이름 추론.
 *   · SRV_GET_SP_UI_DP_00_CONF_Q1  → SP_UI_DP_00_CONF_Q1     (dpserver SELECT 관례)
 *   · SRV_SET_SP_UI_DP_00_CONF_S1  → SP_UI_DP_00_CONF_S1     (dpserver INSERT/UPDATE 관례)
 *   · SP_UI_DP_00_CONF_Q1           → 자기 자신 (이미 SP 이름)
 *   · SRV_UI_<DOMAIN>_*             → mpserver native — SP 이름은 service.xml 매핑 필요
 *                                     (추론 불가 시 null 반환, 백엔드 procedures 가 채워야 함)
 *   · GetEntryNotifyChart 등 임의   → null (service.xml 의 <procedure id> 매핑 필요)
 *
 * 반환: 추론된 SP 이름 (string) 또는 null
 */
function inferSpNameFromServiceId(serviceId) {
  if (!serviceId || typeof serviceId !== 'string') return null;
  const id = serviceId.trim();
  if (/^SP_/i.test(id)) return id; // 이미 SP 이름
  // dpserver: SRV_GET_SP_UI_* / SRV_SET_SP_UI_* → SP_UI_* (prefix 만 제거)
  const m = /^SRV_(?:GET|SET)_(SP_(?:UI|COMM|UT)_[A-Z][A-Z0-9_]+)$/i.exec(id);
  if (m) return m[1];
  // 그 외 SRV_* 는 service.xml 매핑이 있어야만 SP 이름 확인 가능 — 추론 불가
  return null;
}

/**
 * Step4 dataBinding prefill — JSX 의 zAxios / callService 호출 + sourceBundle 의
 * procedures(frontend/backend) 에서 SP / URL 추출.
 *
 * 반환: { [areaIdOrGridId]: { source, baseUrl?, spName?, target?, methods?, allSpNames? } }
 *
 * 매핑 우선순위:
 *   1. SP 가 발견되면 (callService 또는 sourceBundle.frontendProcedures · backend.procedures)
 *      → source='SP' · spName=첫 SP · target=SP 이름 prefix 로 추정 · allSpNames=모든 SP 목록
 *   2. SP 가 없고 zAxios URL 만 있으면 → source='JPA_ENTITY' · baseUrl
 *
 * SP 우선 — NEW_FROM_COPY 의 사용자가 "기존 SP 그대로" 보고 싶어하는 경우를 위해.
 */
export function parseDataBindingFromJsx(jsx, sourceBundle) {
  const out = {};
  const text = (jsx || '').toString();
  const grids = extractBaseGridsFromJsx(text);

  // ── zAxios URL 수집 ──────────────────────────────────────────────────
  const urls = new Set();
  const getRe = /zAxios\.get\(\s*(?:baseURI\(\)\s*\+\s*)?['"`]([^'"`]+)['"`]/g;
  let m;
  while ((m = getRe.exec(text)) !== null) urls.add(m[1]);
  const objRe = /zAxios\(\s*\{[^{}]*?url\s*:\s*(?:baseURI\(\)\s*\+\s*)?['"`]([^'"`]+)['"`][^{}]*?\}\s*\)/g;
  while ((m = objRe.exec(text)) !== null) urls.add(m[1]);

  // sourceBundle.apiCalls 의 urlPattern 도 흡수 (백엔드가 추출한 호출 정보 — JSX 정규식 누락 보완)
  if (sourceBundle && Array.isArray(sourceBundle.apiCalls)) {
    for (const a of sourceBundle.apiCalls) {
      const url = a && (a.urlPattern || a.rawUrl || a.url);
      if (url && typeof url === 'string' && !url.startsWith('http')) urls.add(url);
    }
  }

  // ── SP 수집: jsx 의 callService + sourceBundle 의 procedures ─────────
  // 핵심 규칙: callService 의 **첫 인자는 SERVICE_ID** (engine service.xml 의 <service id>) 이지
  //          SP 이름이 아니다. SP 이름은 service.xml 의 <procedure id> 에 있다.
  //          따라서 백엔드가 trace 한 procedures 의 procedure 필드를 1차 진실로 본다.
  //          그 외에는 SERVICE_ID 에서 SP 이름을 추론(SRV_GET_SP_UI_X → SP_UI_X 등)하되,
  //          서비스ID 자체도 별도 보관해 사용자가 검증 가능하게 한다.
  const spSet = new Set();        // SP 이름 (SP_UI_*) 만
  const serviceIdSet = new Set(); // SERVICE ID (SRV_*, custom names like 'GetEntryNotifyChart')
  const csTargetMap = {};         // {spName | serviceId} → 'mp'/'dp'/'bf'/'fp'
  const serviceIdToSp = {};       // serviceId → 추론된 SP 이름 (있을 때만)

  const csRe = /callService\(\s*['"]([^'"]+)['"]\s*,[^,]*(?:,\s*['"](mp|dp|bf|fp)['"])?\s*\)/g;
  while ((m = csRe.exec(text)) !== null) {
    const serviceId = m[1];
    const target    = m[2];
    serviceIdSet.add(serviceId);
    if (target) csTargetMap[serviceId] = target;

    // SERVICE_ID 에서 SP 이름 추론
    const inferredSp = inferSpNameFromServiceId(serviceId);
    if (inferredSp) {
      spSet.add(inferredSp);
      if (target) csTargetMap[inferredSp] = target;
      serviceIdToSp[serviceId] = inferredSp;
    }
  }

  // 백엔드가 trace 한 procedures (service.xml 매핑 결과 — 1차 진실)
  if (sourceBundle && typeof sourceBundle === 'object') {
    const frontProc = Array.isArray(sourceBundle.frontendProcedures) ? sourceBundle.frontendProcedures : [];
    const backProc  = sourceBundle.backend && Array.isArray(sourceBundle.backend.procedures)
                        ? sourceBundle.backend.procedures : [];
    for (const p of [...frontProc, ...backProc]) {
      const name = p && (p.procedure || p.name);
      if (name && typeof name === 'string' && /^SP_/i.test(name)) {
        spSet.add(name.trim());
        // serviceId 가 메타에 있으면 매핑 기록
        if (p.serviceId) serviceIdToSp[p.serviceId] = name.trim();
      }
    }
  }

  // ── ★ Last-resort: sourceBundle 의 **모든 텍스트** 에서 SP_UI_* 패턴 grep ─────
  const allSpFromText = grepSpNamesFromBundle(sourceBundle, text);
  for (const sp of allSpFromText) {
    if (/^SP_/i.test(sp)) spSet.add(sp);
    else if (/^SRV_/i.test(sp)) {
      serviceIdSet.add(sp);
      const inferred = inferSpNameFromServiceId(sp);
      if (inferred) {
        spSet.add(inferred);
        serviceIdToSp[sp] = inferred;
      }
    }
  }

  const spList        = Array.from(spSet).filter(Boolean);
  const serviceIdList = Array.from(serviceIdSet).filter(Boolean);

  // ── 1차 키: BaseGrid id (정규식 매칭됐을 때) · 없으면 fallback 'mainGrid' ────
  const primaryGridId = grids.length > 0 ? grids[0].id : 'mainGrid';

  // SP 또는 SERVICE_ID 가 1개라도 있으면 SP 모드 — service.xml 의 indirection 때문에
  // SERVICE_ID 만 있고 SP 명을 추론 못한 경우(mpserver native 'SRV_UI_*' 등) 도 SP 모드 유지
  if (spList.length > 0 || serviceIdList.length > 0) {
    const crudSp = classifySpListByCrud(spList.length > 0 ? spList : serviceIdList);
    const primarySp = crudSp.read || spList[0] || serviceIdList[0];
    out[primaryGridId] = {
      source: 'SP',
      spName: primarySp,
      crudSp,
      target: csTargetMap[primarySp] || guessTargetFromSpName(primarySp),
      allSpNames: spList,
      serviceIds: serviceIdList,            // SERVICE ID 도 함께 노출 (사용자 검증용)
      serviceIdToSp,                         // serviceId → SP 매핑 dict (검증용)
    };
    return out;
  }

  const stripDelete = (u) => u.replace(/\/delete$/, '');
  const primaryUrl = Array.from(urls).map(stripDelete).find((u) => u && !u.startsWith('http')) || null;
  if (primaryUrl) {
    out[primaryGridId] = {
      source: 'JPA_ENTITY',
      baseUrl: primaryUrl,
      methods: {
        search: `GET ${primaryUrl}`,
        save:   `POST ${primaryUrl}`,
        delete: `POST ${primaryUrl}/delete`,
      },
    };
  }
  return out;
}

/**
 * sourceBundle 의 모든 텍스트 필드에서 SP_UI_<DOMAIN>_* / SRV_GET_SP_UI_* / SRV_SET_SP_UI_*
 * 패턴을 정규식으로 grep. 다음 경로 모두 검사:
 *   · screen.source                       — 화면 JSX
 *   · frontendSources[].source             — 같이 import 된 JS/JSX (store/hook/utils)
 *   · backend.controllers[].source         — Controller Java
 *   · backend.services[].source            — Service Java
 *   · backend.repositories[].source        — Repository Java
 *   · backend.entities[].source            — Entity Java
 *   · backend.procedures[].source          — SP DDL 본문
 *   · service XML 내용 (있으면)
 *
 * 변수 경유 호출 / XML 매핑 / JdbcTemplate / @Procedure / Native query 등 다양한 패턴 포착.
 */
export function grepSpNamesFromBundle(sourceBundle, screenJsx) {
  const out = new Set();
  const SP_PATTERN = /\b(SP_UI_[A-Z][A-Z0-9_]+|SRV_(?:GET|SET)_SP_UI_[A-Z][A-Z0-9_]+|SP_(?:UI|COMM|UT)_[A-Z][A-Z0-9_]+)\b/g;

  const scanText = (text) => {
    if (!text || typeof text !== 'string') return;
    let m;
    while ((m = SP_PATTERN.exec(text)) !== null) {
      const name = m[1];
      // 명백히 SP 가 아닌 prefix 제외 (false positive 방지)
      if (name.length < 5) continue;
      out.add(name);
    }
  };

  scanText(screenJsx);

  if (sourceBundle && typeof sourceBundle === 'object') {
    // screen — legacy fallback 포함
    const screenText = pickScreenSource(sourceBundle);
    if (screenText) scanText(screenText);

    // frontendSources — legacy 'sources[].type=COMPONENT' fallback 포함
    const frontSrcs = pickFrontendSources(sourceBundle);
    for (const s of frontSrcs) scanText(s && (s.source || s.content));

    // backend.{controllers,services,repositories,entities,procedures}
    const backend = sourceBundle.backend;
    if (backend && typeof backend === 'object') {
      for (const key of ['controllers', 'services', 'repositories', 'entities', 'procedures']) {
        if (Array.isArray(backend[key])) {
          for (const item of backend[key]) {
            if (!item || typeof item !== 'object') continue;
            scanText(item.source || item.content || item.body);
            // procedures 의 경우 procedure/name 필드 자체가 SP 이름
            if (key === 'procedures') {
              const n = item.procedure || item.name;
              if (n && typeof n === 'string' && SP_PATTERN.test(n)) {
                SP_PATTERN.lastIndex = 0;
                out.add(n.trim());
              }
            }
          }
        }
      }
    }

    // frontendProcedures (이미 procedure 이름만 있을 수도)
    if (Array.isArray(sourceBundle.frontendProcedures)) {
      for (const p of sourceBundle.frontendProcedures) {
        const n = p && (p.procedure || p.name);
        if (n && typeof n === 'string') {
          SP_PATTERN.lastIndex = 0;
          if (SP_PATTERN.test(n)) out.add(n.trim());
        }
        SP_PATTERN.lastIndex = 0;
        scanText(p && (p.source || p.content));
      }
    }
  }
  return Array.from(out);
}

/**
 * sourceBundle 진단 — wizard 진입 전 사용자에게 발견된 SP/URL/Entity 를 한눈에 보여주기 위함.
 *
 * 반환:
 *   {
 *     sps: ['SP_UI_DP_07_Q1', ...],               // grepSpNamesFromBundle 결과
 *     spsCrud: { read, create, update, delete },  // suffix 기반 분류
 *     urls: ['util/user-infos', ...],             // zAxios + apiCalls
 *     entities: ['UserInfo', ...],                // backend.entities[].className
 *     gridIds: ['userInfoGrid', ...],             // BaseGrid id
 *     sections: { screenLen, frontendSources, controllers, services, repositories, entities, procedures, frontendProcedures, apiCalls },
 *     hasAny: boolean                              // SP/URL 중 하나라도 발견됐는지
 *   }
 */
export function analyzeSourceBundle(sourceBundle) {
  // legacy 응답 형식(sources[].type='SCREEN') fallback 포함
  const screenSrc = pickScreenSource(sourceBundle);
  const sps = grepSpNamesFromBundle(sourceBundle, screenSrc);
  const spsCrud = classifySpListByCrud(sps);

  // URLs
  const urls = new Set();
  const text = String(screenSrc || '');
  const getRe = /zAxios\.get\(\s*(?:baseURI\(\)\s*\+\s*)?['"`]([^'"`]+)['"`]/g;
  let m;
  while ((m = getRe.exec(text)) !== null) urls.add(m[1].replace(/\/delete$/, ''));
  const objRe = /zAxios\(\s*\{[^{}]*?url\s*:\s*(?:baseURI\(\)\s*\+\s*)?['"`]([^'"`]+)['"`][^{}]*?\}\s*\)/g;
  while ((m = objRe.exec(text)) !== null) urls.add(m[1].replace(/\/delete$/, ''));
  if (Array.isArray(sourceBundle?.apiCalls)) {
    for (const a of sourceBundle.apiCalls) {
      const u = a && (a.urlPattern || a.rawUrl || a.url);
      if (u && typeof u === 'string' && !u.startsWith('http')) urls.add(u.replace(/\/delete$/, ''));
    }
  }

  // Entities
  const entities = (sourceBundle?.backend?.entities || [])
    .map((e) => e?.className || e?.name)
    .filter(Boolean);

  // Grid IDs
  const gridRe = /<(BaseGrid|TreeGrid)\b([^>]*?)(?:\/>|>[\s\S]*?<\/\1>)/g;
  const gridIds = [];
  while ((m = gridRe.exec(text)) !== null) {
    const idMatch = /\bid\s*=\s*['"]([^'"]+)['"]/.exec(m[2] || '');
    if (idMatch) gridIds.push(idMatch[1]);
  }

  // SERVICE IDs — callService("...", ...) 의 첫 인자 (SP 와는 다름)
  const serviceIds = [];
  const serviceIdToSp = {};
  const csRe2 = /callService\(\s*['"]([^'"]+)['"]/g;
  while ((m = csRe2.exec(text)) !== null) {
    const sid = m[1];
    if (!serviceIds.includes(sid)) serviceIds.push(sid);
    const inferred = inferSpNameFromServiceId(sid);
    if (inferred) serviceIdToSp[sid] = inferred;
  }

  // Sections summary — 어떤 데이터가 들어왔는지 전체 가시화 (legacy fallback 반영)
  const backend = sourceBundle?.backend || {};
  const frontSrcs = pickFrontendSources(sourceBundle);
  const sections = {
    screenLen: (screenSrc || '').length,
    frontendSources: frontSrcs.length,
    controllers: (backend.controllers || []).length,
    services: (backend.services || []).length,
    repositories: (backend.repositories || []).length,
    entities: (backend.entities || []).length,
    procedures: (backend.procedures || []).length,
    frontendProcedures: (sourceBundle?.frontendProcedures || []).length,
    apiCalls: (sourceBundle?.apiCalls || []).length,
  };

  return {
    sps,
    spsCrud,
    urls: Array.from(urls),
    entities,
    gridIds,
    serviceIds,
    serviceIdToSp,
    sections,
    hasAny: sps.length > 0 || urls.size > 0 || serviceIds.length > 0,
  };
}

/**
 * SP 목록을 suffix 로 CRUD 분류.
 *   · _Q\d* / _SEARCH / _LIST / _GET 으로 끝남 → read
 *   · _S\d* / _SAVE / _INSERT / _CREATE       → create
 *   · _U\d* / _UPDATE / _MODIFY                → update
 *   · _D\d* / _DELETE / _REMOVE                → delete
 *   · 분류 안 되는 SP 는 read 가 비었으면 read 에 첫번째 매칭, 그 외엔 무시
 */
export function classifySpListByCrud(spList) {
  const crud = { read: '', create: '', update: '', delete: '' };
  if (!Array.isArray(spList) || spList.length === 0) return crud;

  const isRead   = (s) => /(_Q\d*|_SEARCH|_LIST|_GET|_FIND|_SELECT)$/i.test(s)
                       || /SRV_GET_SP_UI_/i.test(s);
  const isCreate = (s) => /(_S\d*|_SAVE|_INSERT|_CREATE|_ADD)$/i.test(s)
                       || /SRV_SET_SP_UI_/i.test(s);
  const isUpdate = (s) => /(_U\d*|_UPDATE|_MODIFY|_EDIT)$/i.test(s);
  const isDelete = (s) => /(_D\d*|_DELETE|_REMOVE|_DEL)$/i.test(s);

  for (const sp of spList) {
    if (!crud.read   && isRead(sp))   crud.read   = sp;
    if (!crud.create && isCreate(sp)) crud.create = sp;
    if (!crud.update && isUpdate(sp)) crud.update = sp;
    if (!crud.delete && isDelete(sp)) crud.delete = sp;
  }
  // 분류 실패 (모두 unknown) 시 첫 SP 를 read 로
  if (!crud.read && spList.length > 0) {
    const unknown = spList.find((s) => !isCreate(s) && !isUpdate(s) && !isDelete(s));
    if (unknown) crud.read = unknown;
    else crud.read = spList[0];
  }
  return crud;
}

/**
 * Step4 의 키를 areas[].id (grid 류만) 와 정합화.
 *   · parsed[areaId] 가 있으면 그대로
 *   · parsed 의 어떤 entry 가 grid 류 area 에 매핑 안 됐으면 첫 grid area 에 분배
 *     (BaseGrid 추출 실패로 'mainGrid' 키에 잡힌 경우 → 실제 areas 의 첫 grid area 로 매핑)
 *   · 그 외 grid area 는 source='JPA_ENTITY' default
 */
function reconcileStep4WithAreas(parsed, areas) {
  const out = {};
  const gridAreas = (areas || []).filter((a) => a && a.kind !== 'search' && a.kind !== 'dashboard');
  if (gridAreas.length === 0) return parsed || {};
  const parsedKeys = Object.keys(parsed || {});
  const usedSourceKeys = new Set();

  // 1) 정확히 매칭되는 키부터 채움
  for (const a of gridAreas) {
    if (parsed && parsed[a.id]) {
      out[a.id] = parsed[a.id];
      usedSourceKeys.add(a.id);
    }
  }
  // 2) 매칭 안 된 grid area 에 대해 — parsed 의 미사용 entry 를 순서대로 매핑
  const leftoverParsedKeys = parsedKeys.filter((k) => !usedSourceKeys.has(k));
  for (const a of gridAreas) {
    if (out[a.id]) continue;
    if (leftoverParsedKeys.length > 0) {
      const k = leftoverParsedKeys.shift();
      out[a.id] = parsed[k];
    } else {
      out[a.id] = { source: 'JPA_ENTITY' };
    }
  }
  return out;
}

/**
 * step5_columns / step6_cascade 처럼 grid area 에만 적용되는 단계의 키를
 * areas[].id 와 정합화. 미매칭 leftover 는 빈 grid area 에 순서대로 재할당해
 * 사용자/AI prefill 데이터가 단순 drop 되는 것을 방지.
 *
 *   · areas 가 비어있으면 parsed 그대로 반환 (불필요한 손실 방지)
 *   · grid area 에 매칭 안 된 leftover 가 있으면 해당 grid area 키로 이전
 *   · grid area 보다 leftover 가 많으면 잉여만 drop
 */
function reconcileGridStepWithAreas(parsed, areas) {
  if (!parsed || typeof parsed !== 'object') return parsed || {};
  if (!Array.isArray(areas) || areas.length === 0) return parsed;
  const gridAreas = areas.filter((a) => a && a.kind !== 'search' && a.kind !== 'dashboard');
  if (gridAreas.length === 0) return parsed;
  const out = {};
  const usedSourceKeys = new Set();
  // 1) 정확 매칭
  for (const a of gridAreas) {
    if (parsed[a.id]) {
      out[a.id] = parsed[a.id];
      usedSourceKeys.add(a.id);
    }
  }
  // 2) leftover 를 매칭 안 된 grid area 에 순서대로 재할당
  const leftover = Object.keys(parsed).filter((k) => !usedSourceKeys.has(k));
  for (const a of gridAreas) {
    if (out[a.id]) continue;
    if (leftover.length > 0) {
      out[a.id] = parsed[leftover.shift()];
    }
  }
  return out;
}

/**
 * SP 이름 prefix 에서 target 엔진 추정.
 *   · SP_UI_BF_*  · SRV_GET_SP_UI_BF_*  · SRV_SET_SP_UI_BF_*  → 'bf'
 *   · SP_UI_DP_*                                              → 'dp'
 *   · SP_UI_FP_*                                              → 'fp'
 *   · 그 외 (SP_UI_MP/CM/IM/RP/SO/UT/AD/SA/...)                → 'mp' (mpserver 가 폭넓게 처리)
 */
function guessTargetFromSpName(spName) {
  const s = String(spName || '').toUpperCase();
  if (/(?:^|_)BF(?:_|$)/.test(s) || /SP_UI_BF_/.test(s) || /SRV_(?:GET|SET)_SP_UI_BF_/.test(s)) return 'bf';
  if (/SP_UI_DP_/.test(s) || /SRV_(?:GET|SET)_SP_UI_DP_/.test(s)) return 'dp';
  if (/SP_UI_FP_/.test(s)) return 'fp';
  return 'mp';
}

/**
 * MENU_CD ('UI_<DOMAIN>_<NAME>') 에서 모듈 코드 추출. 실패 시 null.
 */
export function inferModuleFromMenuCd(menuCd) {
  if (!menuCd) return null;
  const m = /^UI_([A-Z]+)_/.exec(menuCd);
  return m ? m[1] : null;
}

/**
 * 신규 메뉴코드·제목과 원본 메뉴 정보로 step2_overview 채우기.
 * 사용자가 Step2 에서 자유 수정 가능.
 */
function inferOverviewFromMenuCd({ sourceMenu, newMenuCd, newTitle, moduleCode }) {
  const safeMenuCd = (newMenuCd || '').trim();
  const screenName = (newTitle || '').trim();

  // MENU_FILE_PATH 추론: 원본 filePath 의 부모 경로 + 신규 PascalName
  // 원본 '/util/userinfomgmt/UserInfoMgmt' 에서 마지막 세그먼트만 신규로 치환
  let menuFilePath = '';
  const srcFp = sourceMenu?.filePath || '';
  if (srcFp && safeMenuCd) {
    const segments = srcFp.split('/').filter(Boolean);
    if (segments.length >= 1) {
      // 자동 추가 폴더 (lowercase 마지막 세그먼트의 직전) 는 skip — 단일/카테고리 + PascalName 형태로 정리
      // 가장 흔한 구조 '/util/userinfomgmt/UserInfoMgmt' → '/util/<NewPascal>'
      const moduleSeg = segments[0]; // util/system/demandplan ...
      menuFilePath = `/${moduleSeg}/${menuCdToPascal(safeMenuCd)}`;
    }
  } else if (safeMenuCd && moduleCode) {
    menuFilePath = `/${moduleToPathSeg(moduleCode)}/${menuCdToPascal(safeMenuCd)}`;
  }

  return {
    screenId: safeMenuCd,
    screenName,
    menuCd: safeMenuCd,
    parentMenuCd: parentMenuCdFor(moduleCode),
    menuFilePath,
    langKey: safeMenuCd,
    description: '',
  };
}

/**
 * 'UI_UT_USER_INFO_MGMT_V2' → 'UserInfoMgmtV2'
 */
function menuCdToPascal(menuCd) {
  if (!menuCd) return '';
  const m = /^UI_[A-Z]+_(.+)$/.exec(menuCd);
  const tail = m ? m[1] : menuCd.replace(/^UI_/, '');
  return tail
    .split('_')
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
    .join('');
}

/**
 * 모듈코드 → MENU_FILE_PATH 의 첫 세그먼트.
 * (대략적인 매핑 — 사용자가 Step2 에서 수정 가능)
 */
function moduleToPathSeg(moduleCode) {
  switch ((moduleCode || '').toUpperCase()) {
    case 'UT': return 'util';
    case 'AD': return 'system';
    case 'DP': return 'demandplan';
    case 'MP': return 'masterplan';
    case 'FP': return 'factoryplan';
    case 'BF': return 'baselineforecast';
    case 'IM': return 'inventory';
    case 'RP': return 'replenishmentplan';
    case 'SA': return 'sales';
    default:   return (moduleCode || 'misc').toLowerCase();
  }
}

/**
 * 모듈코드 → 부모 메뉴 코드. (CLAUDE.md §3 부모 메뉴 사전)
 */
function parentMenuCdFor(moduleCode) {
  switch ((moduleCode || '').toUpperCase()) {
    case 'UT': return 'MENU_UTIL';
    case 'AD': return 'MENU_AD';
    case 'DP': return 'MENU_DP';
    case 'MP': return 'MENU_MP';
    case 'FP': return 'MENU_FP';
    case 'BF': return 'MENU_BF';
    case 'IM': return 'MENU_IM';
    case 'RP': return 'MENU_RP';
    case 'SA': return 'MENU_SA';
    default:   return '';
  }
}

// ============================================================================
// 설계서 → 9단계 Spec Prefill (NEW_FROM_DESIGN 진입용)
// ============================================================================

/**
 * 설계서(엑셀) 파싱 결과로부터 9단계 spec 의 초기값을 생성한다.
 *
 * 입력 `parsed` 는 ModeNewFromDesign 의 엑셀 파서 결과 (구조 고정):
 *   - parsed.overview : { screenId, screenName, menuPath, category, ... }
 *   - parsed.layout   : { orientation: 'H'|'V'|'G', grids: [{id, position, sheetName, tabs}], screenTabs }
 *   - parsed.sheets   : [{ name, rawRows, preview, rowCount }, ...]
 *
 * 자동 추출 가능한 단계만 채우고, 나머지는 비워둔다 (사용자가 wizard 에서 채우거나
 * LLM 이 생성 시 designText 를 참조해 보충). 추출이 부정확할 수 있으므로 사용자가
 * 각 Step 에서 검토·수정하도록 한다.
 *
 * @param {Object}  args
 * @param {Object}  args.parsed       엑셀 파싱 결과 (overview/layout/sheets)
 * @param {string} [args.fileName]    원본 파일명 (제목·prompt 용)
 * @param {Array|Object} [args.layoutSizes]  H/V 의 [size,...] 배열 또는 G 의 {rows,cols}
 * @param {Object} [args.mainLayoutConfig]   사용자가 설계서 검토 후 보강한 layoutConfig (선택)
 * @param {string} [args.changeReq]   추가 변경 요청 (Step9 prompt 에 첨부)
 * @returns {Object} createInitialSpec() 와 동일 shape · 일부 필드 prefill
 */
export function createInitialSpecFromDesign({
  parsed,
  fileName,
  layoutSizes,
  mainLayoutConfig,
  changeReq,
}) {
  const moduleCode = inferModuleFromMenuCd(parsed?.overview?.screenId)
                  || inferModuleFromCategory(parsed?.overview?.category);
  const spec = createInitialSpec(moduleCode);

  // designDoc 메타 — Step9 / LLM prompt 에서 활용
  spec.designDoc = {
    fileName: fileName || '',
    overview: parsed?.overview || null,
    layoutSummary: summarizeLayout(parsed?.layout, layoutSizes),
    sheetNames: parsed?.sheets?.map((s) => s.name) || [],
  };
  spec.parsedDesign = parsed || null;
  spec.layoutSizes = layoutSizes || null;
  spec.mainLayoutConfig = mainLayoutConfig || null;
  spec.changeReq = changeReq || '';

  // Step1 Layout — 사용자가 설계서 검토 단계(StepLayout)에서 보강한 mainLayoutConfig 가
  // 있으면 그대로 layoutConfig 로 채택. 없으면 parsed.layout 으로부터 자동 추론.
  if (mainLayoutConfig && Array.isArray(mainLayoutConfig.layers) && mainLayoutConfig.layers.length > 0) {
    const inferredCode = inferPatternFromLayers(mainLayoutConfig.layers);
    spec.step1_layout = {
      patternCode: inferredCode,
      areas: layersToAreas(mainLayoutConfig),
      layoutConfig: mainLayoutConfig,
    };
  } else {
    spec.step1_layout = inferLayoutFromDesign(parsed?.layout);
  }

  // Step2 Overview — overview 에서 screenId·screenName·menuPath 추출
  spec.step2_overview = inferOverviewFromDesign({
    overview: parsed?.overview,
    moduleCode,
  });

  // Step5 Columns — Grid 시트에서 컬럼 자동 추출
  spec.step5_columns = inferColumnsFromDesign(parsed, spec.step1_layout.areas);

  // Step3 Components — area 별 기본 BaseGrid + 버튼 (LLM 이 보강)
  spec.step3_components = inferComponentsFromAreas(spec.step1_layout.areas);

  return spec;
}

/**
 * parsed.layout 의 orientation/grids → patternCode + areas[].
 *   - H + grids=2  → P04 (수평 스플릿 M-D)
 *   - V + grids=2  → P02 (검색+그리드, 검색이 위, 그리드가 아래)
 *   - G            → P03 (탭 레이아웃 으로 fallback — 4분할은 Wizard 가 직접 미지원)
 *   - 그 외 / 없음 → P02 기본
 *
 * areas[] 는 정확한 좌/우/상/하 매핑 보존:
 *   - H: parent='split-left' / 'split-right' (3개 이상이면 split-left, split-mid, split-right)
 *   - V: parent='split-top'  / 'split-bottom' (Wizard 의 patternSelector 와 호환되도록 split-* 접두 통일)
 *   - G: parent='tabs'  (간단화 — 사용자가 Step1 에서 정밀 조정)
 */
export function inferLayoutFromDesign(layout) {
  if (!layout || !Array.isArray(layout.grids) || layout.grids.length === 0) {
    const layoutConfig = defaultLayoutConfigForPattern('P02');
    return { patternCode: 'P02', areas: layersToAreas(layoutConfig), layoutConfig };
  }
  const orientation = layout.orientation;
  const grids = layout.grids;
  const COLS = 12, ROWS = 12;
  const filterBar = { h: 2, items: [] };
  let layers = [];
  let patternCode = 'P02';
  const areas = [{ id: 'mainSearch', kind: 'search', parent: null, title: '검색 조건' }];

  if (orientation === 'H' && grids.length === 2) {
    layers = [
      { key: gridAreaId(grids[0]), x: 0,        y: 0, w: COLS / 2, h: ROWS,
        title: gridAreaTitle(grids[0], '좌측'), componentType: 'GRID_BASE' },
      { key: gridAreaId(grids[1]), x: COLS / 2, y: 0, w: COLS / 2, h: ROWS,
        title: gridAreaTitle(grids[1], '우측'), componentType: 'GRID_BASE' },
    ];
    patternCode = 'P04';
    areas.push({ id: gridAreaId(grids[0]), kind: 'grid', parent: 'split-left',
                 title: gridAreaTitle(grids[0], '좌측') });
    areas.push({ id: gridAreaId(grids[1]), kind: 'grid', parent: 'split-right',
                 title: gridAreaTitle(grids[1], '우측') });
  } else if (orientation === 'V' && grids.length === 2) {
    layers = [
      { key: gridAreaId(grids[0]), x: 0, y: 0,        w: COLS, h: ROWS / 2,
        title: gridAreaTitle(grids[0], '상단'), componentType: 'GRID_BASE' },
      { key: gridAreaId(grids[1]), x: 0, y: ROWS / 2, w: COLS, h: ROWS / 2,
        title: gridAreaTitle(grids[1], '하단'), componentType: 'GRID_BASE' },
    ];
    patternCode = 'P02';
    areas.push({ id: gridAreaId(grids[0]), kind: 'grid', parent: null,
                 title: gridAreaTitle(grids[0], '상단') });
    areas.push({ id: gridAreaId(grids[1]), kind: 'grid', parent: null,
                 title: gridAreaTitle(grids[1], '하단') });
  } else if (orientation === 'G') {
    // 격자 4분할
    const cells = grids.slice(0, 4);
    const positions = [
      { x: 0,        y: 0 },
      { x: COLS / 2, y: 0 },
      { x: 0,        y: ROWS / 2 },
      { x: COLS / 2, y: ROWS / 2 },
    ];
    layers = cells.map((g, i) => ({
      key: gridAreaId(g),
      x: positions[i].x, y: positions[i].y, w: COLS / 2, h: ROWS / 2,
      title: gridAreaTitle(g, `Layer ${i + 1}`),
      componentType: 'GRID_BASE',
    }));
    patternCode = 'P03';
    cells.forEach((g) => {
      areas.push({ id: gridAreaId(g), kind: 'grid', parent: 'tabs',
                   title: gridAreaTitle(g, '') });
    });
  } else {
    // 단일 또는 기타
    layers = [
      { key: gridAreaId(grids[0]), x: 0, y: 0, w: COLS, h: ROWS,
        title: gridAreaTitle(grids[0], '메인'), componentType: 'GRID_BASE' },
    ];
    patternCode = 'P02';
    areas.push({ id: gridAreaId(grids[0]), kind: 'grid', parent: null,
                 title: gridAreaTitle(grids[0], '메인') });
  }

  const layoutConfig = { cols: COLS, rowHeight: 30, layers, filterBar };
  return { patternCode, areas, layoutConfig };
}

function gridAreaId(grid) {
  if (!grid) return 'mainGrid';
  // grid.id 예: 'grid-1', 'grid-2' → 'grid1', 'grid2'
  const id = String(grid.id || '').replace(/[^A-Za-z0-9]/g, '');
  return id || 'mainGrid';
}

function gridAreaTitle(grid, fallback) {
  if (!grid) return fallback || '메인 그리드';
  const pos = grid.position ? ` (${grid.position})` : '';
  const tabsCnt = grid.tabs?.length || 0;
  const base = (grid.sheetName || grid.id || fallback || '그리드') + pos;
  return tabsCnt >= 2 ? `${base} · TAB ${tabsCnt}` : base;
}

/**
 * 설계서 overview 정보 + 모듈코드 → step2_overview.
 * - screenId 가 'UI_<DOMAIN>_*' 형식이면 그대로 menuCd 로 사용
 * - 아니면 'UI_<MODULE>_<SLUG>' 으로 변환
 */
function inferOverviewFromDesign({ overview, moduleCode }) {
  if (!overview) {
    return {
      screenId: '', screenName: '', menuCd: '',
      parentMenuCd: parentMenuCdFor(moduleCode),
      menuFilePath: '', langKey: '', description: '',
    };
  }
  const rawScreenId = (overview.screenId || '').trim().toUpperCase().replace(/\s+/g, '_');
  const menuCd = /^UI_/.test(rawScreenId) ? rawScreenId
               : rawScreenId ? `UI_${(moduleCode || 'UT')}_${rawScreenId}`
               : '';
  const pascal = menuCd ? menuCdToPascal(menuCd) : '';
  const menuFilePath = (menuCd && moduleCode)
    ? `/${moduleToPathSeg(moduleCode)}/${pascal}` : '';

  return {
    screenId: menuCd || rawScreenId,
    screenName: (overview.screenName || '').trim(),
    menuCd,
    parentMenuCd: parentMenuCdFor(moduleCode),
    menuFilePath,
    langKey: menuCd,
    description: overview.description || '',
  };
}

/**
 * Grid 시트에서 컬럼을 추출 → step5_columns 의 각 area 에 prefill.
 * parseGridColumnsFromRows 는 ModeNewFromDesign 의 parseGridColumns 와 동일한 알고리즘.
 */
export function inferColumnsFromDesign(parsed, areas) {
  const out = {};
  if (!parsed || !Array.isArray(parsed?.layout?.grids)) return out;
  const grids = parsed.layout.grids;
  const sheets = parsed.sheets || [];

  // 각 grid 의 sheetName → area.id 매핑
  grids.forEach((g) => {
    const sheet = sheets.find((s) => s.name === g.sheetName);
    if (!sheet) return;
    const cols = parseGridColumnsFromRows(sheet.rawRows || sheet.preview);
    if (!cols || cols.length === 0) return;
    const areaId = gridAreaId(g);
    out[areaId] = { columns: cols };
  });

  // 매핑 안된 area 는 빈 columns 으로 두기보다 그냥 누락 — 사용자가 Step5 에서 추가
  return out;
}

/**
 * Grid 시트 rawRows → BaseGrid 컬럼 객체 배열.
 * 헤더 행 자동 탐지 + 데이터 행 추출 + 컬럼 type 분류.
 * 알고리즘은 ModeNewFromDesign.parseGridColumns 의 축약·재구현.
 */
function parseGridColumnsFromRows(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  const headerKeywordsRe = /^(번호|no|순번|컬럼\s*id|column|필드|field|name|한글|한글명|영문|영문명|컬럼\s*명|header|title|type|타입|데이터\s*타입|width|너비|길이|편집|editable|정렬|align|필수|required|format|포맷|merge|visible|표시|default|기본값)$/i;

  let headerIdx = -1;
  let headerCols = null;
  for (let i = 0; i < Math.min(rows.length, 80); i++) {
    const row = rows[i];
    if (!Array.isArray(row)) continue;
    const cells = row.map((c) => String(c ?? '').trim());
    const hits = cells.filter((c) => c && headerKeywordsRe.test(c)).length;
    if (hits >= 3) { headerIdx = i; headerCols = cells; break; }
  }
  if (headerIdx === -1) return [];

  // 헤더 → 컬럼 인덱스 매핑
  const findCol = (re) => headerCols.findIndex((h) => h && re.test(h));
  const idxId      = findCol(/컬럼\s*id|column\s*id|필드|field|^name$/i);
  const idxNameKo  = findCol(/한글|kr|korean|컬럼\s*명|^name$|header|title/i);
  const idxNameEn  = findCol(/영문|en|english/i);
  const idxType    = findCol(/타입|type|데이터.*타입/i);
  const idxWidth   = findCol(/너비|width|길이|length/i);
  const idxEdit    = findCol(/편집|editable/i);
  const idxAlign   = findCol(/정렬|align/i);
  const idxRequired= findCol(/필수|required|not.null/i);
  const idxVisible = findCol(/visible|표시|숨김|hidden/i);
  const idxDefault = findCol(/default|기본값/i);

  const cols = [];
  let blank = 0;
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!Array.isArray(row)) { blank++; if (blank >= 3) break; continue; }
    const cells = row.map((c) => String(c ?? '').trim());
    const nonEmpty = cells.filter((c) => c).length;
    if (nonEmpty === 0) { blank++; if (blank >= 3 && cols.length > 0) break; continue; }
    blank = 0;
    if (nonEmpty < 2) continue;

    const id   = idxId      >= 0 ? cells[idxId]      : '';
    const name = idxNameKo  >= 0 ? cells[idxNameKo]  : '';
    if (!id && !name) continue;

    const fieldName = id || toCamelCase(name) || `col${cols.length + 1}`;
    const dataType = mapDataType(idxType >= 0 ? cells[idxType] : '');
    const w = parseInt(idxWidth >= 0 ? cells[idxWidth] : '', 10);
    const editable  = idxEdit     >= 0 ? truthy(cells[idxEdit])     : false;
    const required  = idxRequired >= 0 ? truthy(cells[idxRequired]) : false;
    const visible   = idxVisible  >= 0 ? !falsy(cells[idxVisible])  : true;
    const align     = mapAlign(idxAlign >= 0 ? cells[idxAlign] : dataType);
    const dflt      = idxDefault  >= 0 ? cells[idxDefault] : '';

    cols.push({
      name: fieldName,
      fieldName,
      dataType,
      headerText: name || fieldName,
      width: Number.isFinite(w) && w > 0 ? w : 120,
      editable,
      visible,
      textAlignment: align,
      validRules: required ? [{ criteria: 'required' }] : [],
      defaultValue: dflt || undefined,
    });
  }
  return cols;
}

function toCamelCase(s) {
  if (!s) return '';
  return s
    .replace(/[^A-Za-z0-9가-힣]+/g, '_')
    .split('_')
    .filter(Boolean)
    .map((w, i) => i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');
}

function mapDataType(raw) {
  const s = (raw || '').toLowerCase();
  if (/날짜|일자|date/.test(s)) return 'datetime';
  if (/숫자|수량|금액|number|int|decimal|float|double/.test(s)) return 'number';
  if (/y\/n|boolean|체크|check/.test(s)) return 'boolean';
  return 'text';
}

function mapAlign(raw) {
  const s = (raw || '').toLowerCase();
  if (/right|far|숫자|수량|금액|number/.test(s)) return 'far';
  if (/center|center|중앙|코드|날짜|일자|date|boolean|체크/.test(s)) return 'center';
  if (s === 'datetime' || s === 'number' || s === 'boolean') {
    return s === 'number' ? 'far' : 'center';
  }
  // 기본 텍스트 정렬 — wizard Step5 Select 옵션 ('', 'left', 'center', 'far') 과 일치시키기 위해 'left'.
  // RealGrid2 는 'near'/'left' 모두 좌측 정렬로 처리하므로 동작 영향 없음.
  return 'left';
}

function truthy(s) {
  return /^(y|yes|true|1|o|편집|가능|허용)$/i.test((s || '').trim());
}
function falsy(s) {
  return /^(n|no|false|0|x|숨김|hidden|불가)$/i.test((s || '').trim());
}

/**
 * 각 area 마다 기본 BaseGrid 컴포넌트 1개씩 추가 (Step3 prefill).
 * SearchArea 는 area.kind === 'search' 만 SearchArea 컴포넌트 1개.
 * 사용자가 Step3 에서 보강.
 */
function inferComponentsFromAreas(areas) {
  const out = {};
  (areas || []).forEach((a) => {
    if (a.kind === 'search') {
      out[a.id] = { components: [{ kind: 'SearchArea', id: a.id, title: a.title }], buttons: [] };
    } else if (a.kind === 'grid') {
      out[a.id] = {
        components: [{ kind: 'BaseGrid', id: `${a.id}Grid`, title: a.title }],
        buttons: [
          { kind: 'GridSaveButton', grid: `${a.id}Grid` },
          { kind: 'GridExcelExportButton', grid: `${a.id}Grid` },
        ],
      };
    } else {
      out[a.id] = { components: [], buttons: [] };
    }
  });
  return out;
}

/**
 * parsed.layout + layoutSizes 를 한 줄짜리 요약으로.
 */
function summarizeLayout(layout, sizes) {
  if (!layout) return null;
  const sizesStr = Array.isArray(sizes) ? `[${sizes.map((v) => v.toFixed(0)).join(',')}]`
                : sizes?.rows && sizes?.cols ? `rows[${sizes.rows.join(',')}] cols[${sizes.cols.join(',')}]`
                : '';
  return {
    typeLabel: layout.typeLabel,
    orientation: layout.orientation,
    gridCount: layout.gridCount,
    sizes: sizesStr,
  };
}

/**
 * overview.category ('demandplan', 'masterplan', '재고' 등) → 모듈코드 추정.
 */
function inferModuleFromCategory(category) {
  if (!category) return null;
  const s = String(category).toLowerCase();
  if (/dp|demand|수요|월간계획/.test(s))     return 'DP';
  if (/mp|master|마스터플랜/.test(s))        return 'MP';
  if (/fp|factory|생산/.test(s))             return 'FP';
  if (/bf|baseline|forecast|예측/.test(s))   return 'BF';
  if (/im|inventory|재고/.test(s))           return 'IM';
  if (/rp|replenish|보충/.test(s))           return 'RP';
  if (/sa|sales|판매/.test(s))               return 'SA';
  if (/ut|util|유틸/.test(s))                return 'UT';
  if (/ad|admin|시스템|관리/.test(s))         return 'AD';
  return null;
}

/**
 * 설계서 parsed 객체 + layoutSizes 를 LLM prompt 에 첨부할 텍스트 블록으로 직렬화.
 * 기존 ModeNewFromDesign.formatParsedDocForPrompt 와 동일한 출력 (Wizard 통합 후에도
 * 설계서 컨텍스트를 LLM 에 동일하게 전달).
 */
export function formatDesignDocForPrompt({ fileName, parsed, layoutSizes, mainLayoutConfig }) {
  if (!parsed) return '(파싱 결과 없음)';
  const out = [`[파일명] ${fileName || '(unknown)'}`];

  if (parsed.overview) {
    out.push('', '=== [화면 메타 정보] ===');
    if (parsed.overview.screenId)   out.push(`- 화면 ID: ${parsed.overview.screenId}`);
    if (parsed.overview.screenName) out.push(`- 화면명: ${parsed.overview.screenName}`);
    if (parsed.overview.menuPath)   out.push(`- 메뉴 위치: ${parsed.overview.menuPath}`);
    if (parsed.overview.category)   out.push(`- 분류: ${parsed.overview.category}`);
    if (parsed.overview.author)     out.push(`- 작성자: ${parsed.overview.author}`);
    if (parsed.overview.version)    out.push(`- 버전: ${parsed.overview.version}`);
  }

  if (parsed.layout) {
    const L = parsed.layout;
    out.push('', '=== [레이아웃 분석 결과] ===');
    out.push(`- 분할 타입: ${L.typeLabel}`);
    out.push(`- 방향: ${L.orientation === 'H' ? '수평(좌우)' : L.orientation === 'V' ? '수직(상하)' : '격자'}`);
    out.push(`- Grid 개수: ${L.gridCount}`);
    for (const g of L.grids || []) {
      out.push(`  · ${g.id} (${g.position})${g.sheetName ? ' → 시트: ' + g.sheetName : ''}`);
      if (g.tabs && g.tabs.length >= 2) {
        out.push(`     └─ TAB ${g.tabs.length}개:`);
        for (const t of g.tabs) {
          out.push(`        · ${t.label}${t.sheetName ? ' (시트: ' + t.sheetName + ')' : ''}`);
        }
      }
    }
    if (layoutSizes) {
      if (L.orientation === 'G' && layoutSizes.rows && layoutSizes.cols) {
        out.push(`- 행 분할: [${layoutSizes.rows.map((v) => v.toFixed(1)).join(', ')}] %`);
        out.push(`- 열 분할: [${layoutSizes.cols.map((v) => v.toFixed(1)).join(', ')}] %`);
      } else if (Array.isArray(layoutSizes)) {
        out.push(`- 사이즈: [${layoutSizes.map((v) => v.toFixed(1)).join(', ')}] %`);
      }
    }
  }

  // 시트 본문 (LLM 에 그대로 전달 — 토큰이 클 수 있음)
  for (const s of parsed.sheets || []) {
    out.push(`\n=== 시트: ${s.name} (${s.rowCount}행) ===`);
    for (const row of (s.rawRows || s.preview || [])) {
      const line = (Array.isArray(row) ? row : []).map((c) => String(c ?? '').trim()).join(' | ');
      if (line) out.push(line);
    }
  }

  if (mainLayoutConfig) {
    out.push('', '=== [사용자 정리한 Layout 결과] ===');
    out.push(JSON.stringify(mainLayoutConfig, null, 2));
  }

  return out.join('\n');
}

/**
 * 원본 sourceBundle 을 LLM prompt 에 첨부할 텍스트 블록으로 직렬화.
 * NEW_FROM_COPY 모드에서 Wizard payload JSON 과 함께 전달된다.
 */
export function formatSourceBundleForPrompt(bundle) {
  if (!bundle || typeof bundle !== 'object') return '(원본 소스 번들 없음)';
  const sections = [
    ['SCREEN',       bundle.screen       ],
    ['COMPONENTS',   bundle.components   ],
    ['CONTROLLERS',  bundle.controllers  ],
    ['SERVICES',     bundle.services     ],
    ['REPOSITORIES', bundle.repositories ],
    ['ENTITIES',     bundle.entities     ],
    ['PROCEDURES',   bundle.procedures   ],
  ];
  const out = [];
  for (const [title, data] of sections) {
    if (!data) continue;
    out.push(`\n=== ${title} ===`);
    if (Array.isArray(data)) {
      for (const item of data) {
        const path = item.path || item.fileName || item.name || 'unknown';
        const content = item.content || item.source || item.body || '';
        out.push(`\n---FILE: ${path}---\n${content}`);
      }
    } else if (typeof data === 'object') {
      const path = data.path || data.fileName || 'unknown';
      out.push(`\n---FILE: ${path}---\n${data.content || JSON.stringify(data, null, 2)}`);
    } else if (typeof data === 'string') {
      out.push(data);
    }
  }
  return out.join('\n');
}

/**
 * 9단계 Step 메타데이터.
 * 각 Step 컴포넌트는 `Step{N}_xxx.jsx` 로 배치되어 index-based 로 렌더된다.
 */
export const WIZARD_STEPS = [
  { idx: 0, key: 'layout',        label: '① Layout 구성',             sub: 'Pattern + Areas' },
  { idx: 1, key: 'overview',      label: '② 기본 속성',                sub: 'Screen meta' },
  { idx: 2, key: 'components',    label: '③ Area 컴포넌트',            sub: 'Grid · Input · Buttons' },
  { idx: 3, key: 'dataBinding',   label: '④ 데이터 연결',              sub: 'Entity · SP · 온톨로지' },
  { idx: 4, key: 'columns',       label: '⑤ Column 상세',              sub: 'dataType · widget · valid' },
  { idx: 5, key: 'cascade',       label: '⑥ Column 주종관계',          sub: 'Field cascade' },
  { idx: 6, key: 'filter',        label: '⑦ FilterBar 항목',           sub: 'Search fields' },
  { idx: 7, key: 'filterCascade', label: '⑧ FilterBar 주종관계',       sub: 'Dependencies' },
  { idx: 8, key: 'generate',      label: '⑨ 생성',                      sub: 'Artifacts + Menu' },
];

// ============================================================================
// LayoutDesigner 데이터 모델 헬퍼 (layoutConfig ↔ areas/patternCode 양방향)
// ============================================================================

/**
 * componentType (LayoutDesigner 카탈로그 코드) → area.kind (단계별 Wizard 의 단순 분류).
 * 단계별 prefill (step3~step5) 가 area.kind 로 분기하므로 매핑 보존.
 */
function componentTypeToKind(componentType) {
  const ct = String(componentType || '').toUpperCase();
  if (ct.includes('SEARCH') || ct.includes('FILTER'))           return 'search';
  if (ct.includes('TREE'))                                       return 'tree';
  if (ct.includes('PIVOT') || ct.includes('CROSS'))              return 'pivot';
  if (ct.includes('CHART'))                                      return 'chart';
  if (ct.includes('FORM') || ct.includes('INPUT'))               return 'form';
  if (ct.includes('DASHBOARD') || ct.includes('WIDGET'))         return 'dashboard';
  if (ct.includes('TAB') || ct.includes('CONTAINER'))            return 'grid';   // 탭 안의 grid 가 일반적
  return 'grid'; // 기본 — Grid 류로 간주
}

/**
 * layers 의 (x,y,w,h) 분포에서 가장 자연스러운 patternCode 를 추론.
 *   - layers === 1                                  → P02
 *   - 모든 layer 가 좌우(x) 분할 (y 동일)            → P04 (수평 스플릿)
 *   - 모든 layer 가 상하(y) 분할 (x 동일)            → P02
 *   - 격자 형태 (양축 분할)                          → P03 (탭 fallback) 또는 P04
 *   - 단일 layer 가 화면 전체 + dashboard 컴포넌트    → P01
 */
export function inferPatternFromLayers(layers) {
  if (!Array.isArray(layers) || layers.length === 0) return 'P02';
  if (layers.length === 1) {
    const l0 = layers[0];
    const ct = String(l0.componentType || '').toUpperCase();
    if (ct.includes('DASHBOARD') || ct.includes('WIDGET')) return 'P01';
    if (ct.includes('PIVOT') || ct.includes('CROSS'))      return 'P06';
    if (ct.includes('TAB'))                                return 'P03';
    return 'P02';
  }
  // 다중 layer — 좌우/상하/격자 판별
  const xs = new Set(layers.map(l => l.x || 0));
  const ys = new Set(layers.map(l => l.y || 0));
  const hasTab = layers.some(l => String(l.componentType || '').toUpperCase().includes('TAB'));
  if (hasTab) return 'P03';
  if (xs.size > 1 && ys.size === 1) return 'P04';   // 좌우 분할만
  if (xs.size === 1 && ys.size > 1) return 'P02';   // 상하 분할만 (검색+그리드 등)
  if (xs.size > 1 && ys.size > 1)   return 'P04';   // 격자도 P04 의 변형으로 매핑
  return 'P02';
}

/**
 * layoutConfig (LayoutDesigner SoT) → areas[] (단계별 Wizard 가 areaId 로 참조).
 * filterBar 가 visible 이면 첫 area 로 'mainSearch' 자동 추가.
 * 각 layer.key 가 곧 areaId — 이후 단계의 step3~step6 가 같은 키를 사용한다.
 */
export function layersToAreas(layoutConfig) {
  if (!layoutConfig || !Array.isArray(layoutConfig.layers)) return [];
  const out = [];
  const fb = layoutConfig.filterBar;
  const filterVisible = !!(fb && ((fb.items && fb.items.length > 0) || (fb.h && fb.h > 0)));
  if (filterVisible) {
    out.push({ id: 'mainSearch', kind: 'search', parent: null, title: '검색 조건' });
  }
  // layers 는 y, x 오름차순으로 정렬해 자연스러운 순서 보장
  const sorted = [...layoutConfig.layers].sort((a, b) => {
    if ((a.y || 0) !== (b.y || 0)) return (a.y || 0) - (b.y || 0);
    return (a.x || 0) - (b.x || 0);
  });
  sorted.forEach((l, idx) => {
    out.push({
      id: l.key || `area${idx + 1}`,
      kind: componentTypeToKind(l.componentType),
      parent: null,                       // LayoutDesigner 가 좌표로 표현 — parent 는 미사용
      title: l.title || `Layer ${idx + 1}`,
    });
  });
  return out;
}

/** Pattern 별 기본 layoutConfig 의 layer.key — 사용자/원본 명명이 아닌 generic 키 카탈로그. */
export const FALLBACK_LAYER_KEYS = new Set([
  'mainGrid', 'mainSearch', 'mainTabs', 'mainDashboard',
  'master', 'detail', 'pivotGrid',
]);

/**
 * patternCode → 기본 layoutConfig (LayoutDesigner 형식).
 * Step1 진입 시점에 layoutConfig 가 비어있으면 patternCode 를 보고 기본 배치를 생성한다.
 *   · 12 cols × 12 rows 좌표계 (LayoutDesigner 기본값)
 *   · filterBar.h = 2 (2 행 높이) · 검색이 필요 없는 패턴(P01)은 0
 *
 * @param {string} patternCode
 * @param {object} [opts]
 * @param {Array}  [opts.baseLayers]   같은 길이의 layers 가 있으면 layer.key/title 을 보존
 *   (NEW_FROM_COPY 의 BaseGrid id 'userInfoGrid' 가 generic 'mainGrid' 로 리셋되는 것 방지)
 */
export function defaultLayoutConfigForPattern(patternCode, opts) {
  const COLS = 12;
  const ROWS = 12;
  const base = { cols: COLS, rowHeight: 30, layers: [], filterBar: { h: 0, items: [] } };
  switch (patternCode) {
    case 'P01': // 위젯 대시보드
      base.filterBar = { h: 0, items: [] };
      base.layers = [
        { key: 'mainDashboard', x: 0, y: 0, w: COLS, h: ROWS,
          title: '대시보드', componentType: 'DASHBOARD_PANEL' },
      ];
      break;
    case 'P03': // 검색+탭
      base.filterBar = { h: 2, items: [] };
      base.layers = [
        { key: 'mainTabs', x: 0, y: 0, w: COLS, h: ROWS,
          title: '탭 영역', componentType: 'CONTAINER_TAB' },
      ];
      break;
    case 'P04': // 수평 스플릿 M-D
      base.filterBar = { h: 2, items: [] };
      base.layers = [
        { key: 'master', x: 0,         y: 0, w: COLS / 2, h: ROWS,
          title: '마스터', componentType: 'GRID_BASE' },
        { key: 'detail', x: COLS / 2,  y: 0, w: COLS / 2, h: ROWS,
          title: '디테일', componentType: 'GRID_BASE' },
      ];
      break;
    case 'P06': // 크로스탭 피벗
      base.filterBar = { h: 2, items: [] };
      base.layers = [
        { key: 'pivotGrid', x: 0, y: 0, w: COLS, h: ROWS,
          title: '피벗 그리드', componentType: 'PIVOT_TABLE' },
      ];
      break;
    case 'P02': // 검색+단일 그리드
    default:
      base.filterBar = { h: 2, items: [] };
      base.layers = [
        { key: 'mainGrid', x: 0, y: 0, w: COLS, h: ROWS,
          title: '메인 그리드', componentType: 'GRID_BASE' },
      ];
      break;
  }
  // baseLayers 가 같은 길이로 주어졌고, 그 key 가 generic fallback 이 아니면(=원본/사용자
  // 명명) layer.key/title 을 보존. NEW_FROM_COPY 에서 BaseGrid id ('userInfoGrid' 등) 가
  // P02 default ('mainGrid') 로 리셋되는 회귀를 방지한다.
  const baseLayers = opts && Array.isArray(opts.baseLayers) ? opts.baseLayers : null;
  if (baseLayers && baseLayers.length === base.layers.length) {
    base.layers = base.layers.map((l, i) => {
      const prev = baseLayers[i];
      if (prev && prev.key && !FALLBACK_LAYER_KEYS.has(prev.key)) {
        return { ...l, key: prev.key, title: prev.title || l.title };
      }
      return l;
    });
  }
  return base;
}

/**
 * Layout Pattern 별 기본 area 구조 — Step1 에서 pattern 선택 시 초기 areas[] 를 제안.
 * 사용자는 이 제안을 그대로 쓰거나 수정할 수 있다.
 */
export function defaultAreasForPattern(patternCode) {
  switch (patternCode) {
    case 'P01': // 위젯 대시보드
      return [
        { id: 'dashboard', kind: 'dashboard', parent: null, title: '대시보드' },
      ];
    case 'P02': // 검색+단일 그리드 (가장 일반적)
      return [
        { id: 'mainSearch', kind: 'search', parent: null, title: '검색 조건' },
        { id: 'mainGrid',   kind: 'grid',   parent: null, title: '메인 그리드' },
      ];
    case 'P03': // 검색+탭
      return [
        { id: 'mainSearch', kind: 'search', parent: null, title: '검색 조건' },
        { id: 'tabSummary', kind: 'grid',   parent: 'tabs', title: '요약' },
        { id: 'tabDetail',  kind: 'grid',   parent: 'tabs', title: '상세' },
      ];
    case 'P04': // 수평 스플릿 M-D
      return [
        { id: 'mainSearch', kind: 'search', parent: null,  title: '검색 조건' },
        { id: 'master',     kind: 'grid',   parent: 'split-left',  title: '마스터' },
        { id: 'detail',     kind: 'grid',   parent: 'split-right', title: '디테일' },
      ];
    case 'P06': // 크로스탭 피벗
      return [
        { id: 'mainSearch', kind: 'search', parent: null, title: '검색 조건' },
        { id: 'pivotGrid',  kind: 'pivot',  parent: null, title: '피벗 그리드' },
      ];
    default:
      return [
        { id: 'mainSearch', kind: 'search', parent: null, title: '검색 조건' },
        { id: 'mainGrid',   kind: 'grid',   parent: null, title: '메인 그리드' },
      ];
  }
}

// ============================================================================
// ComposerSpec — Phase 1 새 모델 (9-Step 의 대체).
//   spec: docs/superpowers/specs/2026-05-22-pattern-driven-composer-redesign-design.md
//   plan: docs/superpowers/plans/2026-05-22-composer-canvas-phase1.md (Task 2)
// ============================================================================

export const LAYER_TYPES = Object.freeze({
  GRID:      'GRID',       // DATA_DISPLAY 그룹의 layer (BaseGrid/TreeGrid/Pivot 등)
  CHART:     'CHART',      // CHART 그룹
  CONTAINER: 'CONTAINER',  // 탭/카드/대시보드 패널
  DOCUMENT:  'DOCUMENT',   // PDF/Markdown/이미지
  AI:        'AI',         // AI 채팅/인사이트
});

/**
 * 새 모델의 spec 객체를 빈 골격으로 생성.
 *   { menuCd, title, parentMenuCd, menuFilePath, pattern } 중 일부만 채워도 됨.
 * pattern: 'BLANK' | 'P02' | 'MOCKUP_<code>' | 'UIPATTERN_<id>' ...
 */
export function createComposerSpec({
  menuCd       = '',
  title        = '',
  parentMenuCd = '',
  menuFilePath = '',
  pattern      = 'BLANK',
} = {}) {
  return {
    meta: { menuCd, title, parentMenuCd, menuFilePath, pattern },
    filterBar: {
      items: [],   // [{ key, label, type, cascade? }]
      affects: {}, // layerKey -> [filterBar item keys]
    },
    layers: [
      // Phase 1 의 빈 스펙은 mainGrid 단일 layer 로 시작 (BLANK 패턴 기본)
      {
        key: 'mainGrid',
        title: '메인 그리드',
        type: LAYER_TYPES.GRID,
        subtype: 'GRID_BASE',
        position: { x: 0, y: 0, w: 12, h: 8 },  // RGL 12-col grid
        dataSource: {
          mode: 'NL',            // 'NL' | 'TABLE' | 'SP' | 'ENTITY' | 'SQL' | 'MIXED'
          naturalText: '',
          references: [],        // [{ kind: 'TABLE'|'SP'|'ENTITY', name }]
          sqlBlocks: [],         // [string]  — raw SQL 직접 입력
        },
        columns: [],
        cascade: {},
      },
    ],
    relations: [],   // Phase 2D-2a — Layer 간 관계 (master→detail 등). spec.layers[].key 참조.
  };
}

/**
 * 새 layer 1건의 기본 골격 — ComposerCanvas 에서 layer 추가 시 사용.
 */
export function createComposerLayer({
  key,
  title = '',
  type = LAYER_TYPES.GRID,
  subtype = 'GRID_BASE',
  position = { x: 0, y: 0, w: 6, h: 6 },
  parentKey = null,   // Container 의 자식 layer 식별용 (top-level = null)
} = {}) {
  if (!key) throw new Error('createComposerLayer: key required');
  const layer = {
    key, title, type, subtype, position,
    dataSource: { mode: 'NL', naturalText: '', references: [], sqlBlocks: [] },
    columns: [],
    cascade: {},
  };
  if (parentKey) layer.parentKey = parentKey;
  return layer;
}

/** spec 의 top-level layer 들 (parentKey 없음) — RGL 렌더 대상. */
export function getTopLevelLayers(spec) {
  return (spec?.layers || []).filter((l) => !l.parentKey);
}

/** spec 에서 특정 Container 의 자식 layer 들. */
export function getChildLayers(spec, parentKey) {
  if (!parentKey) return [];
  return (spec?.layers || []).filter((l) => l.parentKey === parentKey);
}

/**
 * spec 의 layers 끝에 새 layer 1개 추가 (immutable).
 *   - key 가 비어 있으면 'layerN' 자동 부여 (기존 key 와 충돌 회피)
 *   - position 이 비어 있으면 빈 슬롯 자동 (Y = 기존 layers 최하단, X=0, w=12, h=4)
 *   - filterBar.affects 에 새 layer key 의 빈 배열 entry 추가
 *   plan: docs/superpowers/plans/2026-05-22-composer-canvas-phase1_5.md (Task 1)
 */
export function addLayer(spec, layerInit = {}) {
  if (!spec) throw new Error('addLayer: spec required');
  const existing = Array.isArray(spec.layers) ? spec.layers : [];
  const keys = new Set(existing.map((l) => l.key));

  let key = layerInit.key;
  if (!key || keys.has(key)) {
    let i = existing.length + 1;
    while (keys.has(`layer${i}`)) i += 1;
    key = `layer${i}`;
  }

  let pos = layerInit.position;
  if (!pos) {
    const maxBottom = existing.reduce((acc, l) => {
      const p = l.position || {};
      return Math.max(acc, (p.y || 0) + (p.h || 0));
    }, 0);
    pos = { x: 0, y: maxBottom, w: 12, h: 4 };
  }

  // type 별 default title — subtype 은 강제하지 않음 (Claude 가 자연어 보고 결정)
  const TYPE_DEFAULT_TITLE = {
    GRID:      '그리드',
    CHART:     '차트',
    CONTAINER: '컨테이너',
    DOCUMENT:  '문서',
    AI:        'AI 패널',
  };
  const resolvedType = layerInit.type || LAYER_TYPES.GRID;
  const baseTitle = layerInit.title
                 || TYPE_DEFAULT_TITLE[resolvedType]
                 || `위젯 ${existing.length + 1}`;

  const newLayer = createComposerLayer({
    key,
    title: baseTitle,
    type: resolvedType,
    // subtype 빈 string 허용 (generic) — 사용자가 mini dialog 자연어로 의도 표현
    subtype: layerInit.subtype !== undefined ? layerInit.subtype : '',
    position: pos,
    parentKey: layerInit.parentKey || null,
  });

  const nextFilterBar = {
    ...(spec.filterBar || { items: [], affects: {} }),
    affects: { ...(spec.filterBar?.affects || {}), [key]: [] },
  };

  return {
    ...spec,
    layers: [...existing, newLayer],
    filterBar: nextFilterBar,
  };
}

/**
 * spec 에서 key 에 해당하는 layer 1건 제거 (immutable).
 *   - filterBar.affects 에서 해당 key entry 도 제거
 *   - 마지막 layer 1개일 때는 제거하지 않고 그대로 반환 (UX 안전망: 빈 캔버스 방지)
 */
export function removeLayer(spec, key) {
  if (!spec || !key) return spec;
  const existing = Array.isArray(spec.layers) ? spec.layers : [];
  if (existing.length <= 1) return spec;
  // Container 삭제 시 그 자식들도 함께 제거
  const removeKeys = new Set([key]);
  existing.forEach((l) => { if (l.parentKey === key) removeKeys.add(l.key); });
  const nextLayers = existing.filter((l) => !removeKeys.has(l.key));
  if (nextLayers.length === existing.length) return spec;
  // 마지막 top-level layer 보호 (자식만 남으면 안 됨)
  if (nextLayers.filter((l) => !l.parentKey).length === 0) return spec;

  const nextAffects = { ...(spec.filterBar?.affects || {}) };
  removeKeys.forEach((k) => { delete nextAffects[k]; });

  // Phase 2D-2a — relations 중 source/target.layerKey 가 삭제 대상이면 제거 (orphan 방지)
  const existingRelations = Array.isArray(spec.relations) ? spec.relations : [];
  const nextRelations = existingRelations.filter((r) =>
    !removeKeys.has(r?.source?.layerKey) && !removeKeys.has(r?.target?.layerKey)
  );

  return {
    ...spec,
    layers: nextLayers,
    filterBar: { ...(spec.filterBar || { items: [] }), affects: nextAffects },
    relations: nextRelations,
  };
}

// ============================================================================
// Phase 2D-2a — Layer 관계 helpers
//   spec.relations[] 의 add/remove/update. UI (LayerRelationsPanel) 가 사용.
// ============================================================================

/**
 * 새 관계 추가. id 자동, source/target 기본은 첫 두 layer, 빈 mapping.
 */
export function addRelation(spec, init = {}) {
  if (!spec) throw new Error('addRelation: spec required');
  const layers = Array.isArray(spec.layers) ? spec.layers : [];
  const relations = Array.isArray(spec.relations) ? spec.relations : [];
  const newId = `rel_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const defaultSource = layers[0]?.key || '';
  const defaultTarget = layers[1]?.key || layers[0]?.key || '';
  const relation = {
    id:     init.id     || newId,
    source: init.source || { layerKey: defaultSource, event: 'cellClick' },
    target: init.target || { layerKey: defaultTarget, action: 'refetch' },
    mapping: init.mapping && typeof init.mapping === 'object' ? { ...init.mapping } : {},
  };
  return { ...spec, relations: [...relations, relation] };
}

/**
 * 관계 id 로 제거.
 */
export function removeRelation(spec, id) {
  if (!spec || !id) return spec;
  const relations = Array.isArray(spec.relations) ? spec.relations : [];
  return { ...spec, relations: relations.filter((r) => r.id !== id) };
}

/**
 * 관계 부분 갱신 — patch 가 mapping 이면 통째 교체.
 */
export function updateRelation(spec, id, patch) {
  if (!spec || !id || !patch) return spec;
  const relations = Array.isArray(spec.relations) ? spec.relations : [];
  return {
    ...spec,
    relations: relations.map((r) => (r.id === id ? { ...r, ...patch } : r)),
  };
}

/**
 * Pattern 코드 → 초기 ComposerSpec 매핑. Phase 1 은 'BLANK' / 'P02' 둘만 지원.
 * 나머지 (MOCKUP_*, UIPATTERN_*) 는 Phase 2 에서 패턴 카탈로그 메타에서 가져옴.
 */
export function specFromPattern(patternCode, baseMeta = {}) {
  const base = createComposerSpec({ ...baseMeta, pattern: patternCode });
  if (patternCode === 'P02') {
    // 검색 + 단일 그리드 — FilterBar 자리 + 메인 그리드 1개
    base.filterBar.items = [];  // 사용자가 FilterBarInlinePanel (DataAndFilterStep 우측) 에서 채움
    base.filterBar.affects = { mainGrid: [] };
    // layers 는 createComposerSpec 의 mainGrid 그대로
  }
  // 'BLANK' = createComposerSpec 의 기본 단일 layer 그대로
  return base;
}

// ============================================================================
// Phase 2A — Mockup / UI Pattern picker entry → ComposerSpec 변환
//   spec: docs/superpowers/specs/2026-05-22-pattern-driven-composer-redesign-design.md
//   plan: docs/superpowers/plans/2026-05-22-composer-canvas-phase2a.md (Task 1)
// ============================================================================

/**
 * layoutCategory 코드 → layer 골격 정의.
 *   각 항목: [{ key, title, type, subtype, position:{x,y,w,h} }, ...]
 *   RGL 12-column grid 기준. Phase 1 ComposerCanvas 는 RGL 미사용이지만
 *   position 은 미리 RGL 호환 형식으로 저장 (Phase 1.5/3 에서 그대로 사용).
 *   상세: .claude/rules/40-composer-patterns.md §2.1
 */
export const LAYOUT_CATEGORY_TO_LAYERS = {
  // ─── 정형 패턴 ───
  // key 는 코드 식별자 (역할 hint 포함 가능). title 은 사용자 표시용 — 위치 단어 금지
  // (드래그로 이동 가능해질 때 의미 잃음). 역할 기반(KPI/차트/그리드) 또는 generic 번호("패널 N").
  LAYOUT_SINGLE: () => [
    { key: 'panel1', title: '메인', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 0, y: 0, w: 12, h: 12 } },
  ],
  LAYOUT_V2: () => [
    { key: 'panel1', title: '패널 1', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 0, y: 0, w: 12, h: 6 } },
    { key: 'panel2', title: '패널 2', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 0, y: 6, w: 12, h: 6 } },
  ],
  LAYOUT_V3: () => [
    { key: 'panel1', title: '패널 1', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 0, y: 0, w: 12, h: 4 } },
    { key: 'panel2', title: '패널 2', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 0, y: 4, w: 12, h: 4 } },
    { key: 'panel3', title: '패널 3', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 0, y: 8, w: 12, h: 4 } },
  ],
  LAYOUT_H2: () => [
    { key: 'panel1', title: '패널 1', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 0, y: 0, w: 6,  h: 12 } },
    { key: 'panel2', title: '패널 2', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 6, y: 0, w: 6,  h: 12 } },
  ],
  LAYOUT_H3: () => [
    { key: 'panel1', title: '패널 1', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 0, y: 0, w: 4,  h: 12 } },
    { key: 'panel2', title: '패널 2', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 4, y: 0, w: 4,  h: 12 } },
    { key: 'panel3', title: '패널 3', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 8, y: 0, w: 4,  h: 12 } },
  ],
  LAYOUT_MIXED: () => [
    { key: 'panel1', title: '패널 1', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 0, y: 0, w: 6,  h: 6 } },
    { key: 'panel2', title: '패널 2', type: LAYER_TYPES.CHART,
      subtype: 'CHART_BAR', position: { x: 6, y: 0, w: 6,  h: 6 } },
    { key: 'panel3', title: '패널 3', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 0, y: 6, w: 12, h: 6 } },
  ],
  LAYOUT_CONTROLBOARD: () => [
    { key: 'kpi',    title: 'KPI',         type: LAYER_TYPES.CHART,
      subtype: 'KPI_CARD',  position: { x: 0, y: 0, w: 12, h: 3 } },
    { key: 'chart',  title: '차트',        type: LAYER_TYPES.CHART,
      subtype: 'CHART_BAR', position: { x: 0, y: 3, w: 12, h: 5 } },
    { key: 'detail', title: '상세 그리드', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 0, y: 8, w: 12, h: 4 } },
  ],

  // ─── Phase 2B-1 신규: 실제 사용 카테고리 5종 ───

  /** DASHBOARD (16건, 최다) — KPI + 다중 위젯 격자 */
  LAYOUT_DASHBOARD: () => [
    { key: 'kpi',     title: 'KPI',     type: LAYER_TYPES.CHART,
      subtype: 'KPI_CARD',  position: { x: 0, y: 0, w: 12, h: 3 } },
    { key: 'widget1', title: '위젯 1', type: LAYER_TYPES.CHART,
      subtype: 'CHART_BAR', position: { x: 0, y: 3, w: 6,  h: 4 } },
    { key: 'widget2', title: '위젯 2', type: LAYER_TYPES.CHART,
      subtype: 'CHART_LINE',position: { x: 6, y: 3, w: 6,  h: 4 } },
    { key: 'widget3', title: '위젯 3', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 0, y: 7, w: 6,  h: 5 } },
    { key: 'widget4', title: '위젯 4', type: LAYER_TYPES.CHART,
      subtype: 'CHART_DONUT', position: { x: 6, y: 7, w: 6, h: 5 } },
  ],

  /** WIDGET (5건) — 다른 화면에 임베드되는 단일 위젯 */
  WIDGET: () => [
    { key: 'widget1', title: '위젯', type: LAYER_TYPES.CHART,
      subtype: 'CHART_BAR', position: { x: 0, y: 0, w: 12, h: 12 } },
  ],

  /** PLANEDIT (4건) — 크로스탭 피벗 그리드 (계획 보정) */
  LAYOUT_PLANEDIT: () => [
    { key: 'pivot', title: '피벗 그리드', type: LAYER_TYPES.GRID,
      subtype: 'GRID_CROSSTAB', position: { x: 0, y: 0, w: 12, h: 12 } },
  ],

  /** MONITORING (3건) — KPI + 실시간 차트 + 알람 + 이벤트 로그 */
  LAYOUT_MONITORING: () => [
    { key: 'kpi',      title: 'KPI',        type: LAYER_TYPES.CHART,
      subtype: 'KPI_CARD',  position: { x: 0, y: 0, w: 12, h: 3 } },
    { key: 'liveChart',title: '실시간 차트',type: LAYER_TYPES.CHART,
      subtype: 'CHART_LINE', position: { x: 0, y: 3, w: 8, h: 6 } },
    { key: 'alerts',   title: '알람',       type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 8, y: 3, w: 4, h: 6 } },
    { key: 'eventLog', title: '이벤트 로그',type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 0, y: 9, w: 12, h: 3 } },
  ],

  /** ROUTELAYOUT (1건) — 공정 라우트 다이어그램 단일 */
  LAYOUT_ROUTELAYOUT: () => [
    { key: 'route', title: '공정 라우트', type: LAYER_TYPES.CHART,
      subtype: 'DIAGRAM_FLO', position: { x: 0, y: 0, w: 12, h: 12 } },
  ],

  // ─── Phase 2B-1 신규: 다른 Target (PlaNEL/LGES_NEXTSCM) mockup 추가 대비 ───

  /** V4 — 수직 4분할 */
  LAYOUT_V4: () => [
    { key: 'panel1', title: '패널 1', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 0, y: 0, w: 12, h: 3 } },
    { key: 'panel2', title: '패널 2', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 0, y: 3, w: 12, h: 3 } },
    { key: 'panel3', title: '패널 3', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 0, y: 6, w: 12, h: 3 } },
    { key: 'panel4', title: '패널 4', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 0, y: 9, w: 12, h: 3 } },
  ],

  /** V5 — 수직 5분할 */
  LAYOUT_V5: () => [
    { key: 'panel1', title: '패널 1', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 0, y: 0,  w: 12, h: 3 } },
    { key: 'panel2', title: '패널 2', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 0, y: 3,  w: 12, h: 2 } },
    { key: 'panel3', title: '패널 3', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 0, y: 5,  w: 12, h: 2 } },
    { key: 'panel4', title: '패널 4', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 0, y: 7,  w: 12, h: 2 } },
    { key: 'panel5', title: '패널 5', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 0, y: 9,  w: 12, h: 3 } },
  ],

  /** H4 — 수평 4분할 */
  LAYOUT_H4: () => [
    { key: 'panel1', title: '패널 1', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 0, y: 0, w: 3, h: 12 } },
    { key: 'panel2', title: '패널 2', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 3, y: 0, w: 3, h: 12 } },
    { key: 'panel3', title: '패널 3', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 6, y: 0, w: 3, h: 12 } },
    { key: 'panel4', title: '패널 4', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 9, y: 0, w: 3, h: 12 } },
  ],

  /** H5 — 수평 5분할 */
  LAYOUT_H5: () => [
    { key: 'panel1', title: '패널 1', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 0, y: 0, w: 2, h: 12 } },
    { key: 'panel2', title: '패널 2', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 2, y: 0, w: 2, h: 12 } },
    { key: 'panel3', title: '패널 3', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 4, y: 0, w: 2, h: 12 } },
    { key: 'panel4', title: '패널 4', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 6, y: 0, w: 3, h: 12 } },
    { key: 'panel5', title: '패널 5', type: LAYER_TYPES.GRID,
      subtype: 'GRID_BASE', position: { x: 9, y: 0, w: 3, h: 12 } },
  ],
};

/** layoutCategory 미매칭 시 SINGLE 폴백. 추상 카테고리(SUBCOMPONENT/POPUP/BASE) 도 SINGLE.
 *  미정의 카테고리는 console.warn 으로 알림 (신규 mockup 추가 시 매핑 보강 시그널). */
const ABSTRACT_CATEGORIES = new Set(['SUBCOMPONENT', 'POPUP', 'BASE']);

export function layersForLayoutCategory(layoutCategory) {
  const builder = LAYOUT_CATEGORY_TO_LAYERS[layoutCategory];
  if (builder) return builder();
  if (!ABSTRACT_CATEGORIES.has(layoutCategory)) {
    // 추상이 아닌데 매핑 없음 → 매핑 보강 신호
    // eslint-disable-next-line no-console
    console.warn(`[ComposerSpec] LAYOUT_CATEGORY_TO_LAYERS 에 '${layoutCategory}' 매핑 없음 → SINGLE 폴백. LAYOUT_CATEGORY_TO_LAYERS 에 추가 권장.`);
  }
  return LAYOUT_CATEGORY_TO_LAYERS.LAYOUT_SINGLE();
}

/**
 * MockupPickerDialog 의 onConfirm(entry) 결과 → ComposerSpec.
 *   entry: MOCKUP_ENTRIES 항목 (patternCode, patternLabel, layoutCategory, category, description, ...)
 */
/**
 * Mockup entry 의 메타를 layer.dataSource.naturalText 로 변환.
 *   Claude 가 화면 의도를 파악할 단서로 활용.
 *   각 layer 마다 동일한 컨텍스트 + layer 별 [역할] 한 줄 차이.
 *   사용자가 DataMiniDialog 에서 자유 수정 가능.
 */
function mockupContextText(entry, layerTitle) {
  const lines = [
    `[참조 패턴] ${entry.patternLabel || entry.patternCode}`,
  ];
  if (entry.description) lines.push(`[설명] ${entry.description}`);
  if (entry.category)    lines.push(`[카테고리] ${entry.category}`);
  if (layerTitle)        lines.push(`[이 영역의 역할] ${layerTitle}`);
  lines.push('');
  lines.push('이 영역에서 보여줄 데이터를 자유롭게 보완하세요 — 또는 Data Source 탐색에서 Table/SP 를 직접 참조 추가.');
  return lines.join('\n');
}

export function specFromMockup(entry, baseMeta = {}) {
  if (!entry) return createComposerSpec({ ...baseMeta, pattern: 'BLANK' });
  // entry.layers 가 선언되어 있으면 mockup 의 실제 구조를 따름 (mockup 작성자가 선언).
  // 미선언 시 layoutCategory 의 고정 템플릿으로 폴백 — dashboard 처럼 mockup 별 구조가
  // 다른 카테고리는 entry.layers 선언 권장 (CLAUDE.md "신규 mockup 추가 절차" §5).
  const layersDef = (Array.isArray(entry.layers) && entry.layers.length > 0)
    ? entry.layers
    : layersForLayoutCategory(entry.layoutCategory);
  const base = createComposerSpec({
    ...baseMeta,
    pattern: `MOCKUP_${entry.patternCode}`,
    title: baseMeta.title || entry.patternLabel || '새 화면',
  });
  base.layers = layersDef.map((d) => ({
    ...d,
    dataSource: {
      mode: 'NL',
      naturalText: mockupContextText(entry, d.title),
      references: [],
      sqlBlocks: [],
    },
    columns: [],
    cascade: {},
  }));
  base.filterBar.affects = Object.fromEntries(base.layers.map((l) => [l.key, []]));
  return base;
}

/**
 * UiPatternPickerDialog 의 onConfirm(entry) 결과 → ComposerSpec.
 *   entry: ALL_ENTRIES 항목 (file, tabIndex, label, sectionCode, ...)
 *
 *   UI Pattern 은 layer 구조 메타가 없으므로 단일 mainGrid + 패턴 식별자만 보존.
 *   실제 mockup 의 HTML 콘텐츠를 자연어 컨텍스트로 변환하는 작업은 Phase 2B.
 */
export function specFromUiPattern(entry, baseMeta = {}) {
  if (!entry) return createComposerSpec({ ...baseMeta, pattern: 'BLANK' });
  const patternId = `${entry.file || ''}#${entry.tabIndex ?? 0}`;
  return createComposerSpec({
    ...baseMeta,
    pattern: `UIPATTERN_${patternId}`,
    title: baseMeta.title || entry.label || '새 화면',
  });
}

// ============================================================================
// Phase 2C — ComposerSpec → ChatPanel initialPrompt 자연어 직렬화
//   spec: docs/superpowers/specs/2026-05-22-pattern-driven-composer-redesign-design.md
//   plan: docs/superpowers/plans/2026-05-22-composer-canvas-phase2c.md (Task 1)
// ============================================================================

/**
 * ComposerSpec 을 ChatPanel 의 initialPrompt 로 쓸 수 있는 자연어 문자열로 직렬화.
 *   ComposerWorkspace 가 이 문자열을 ChatPanel 첫 메시지로 Claude 에 전달 →
 *   .claude/rules/* + ComposerPromptBuilder 의 system prompt 와 합쳐져
 *   화면 생성 (JSX/Java/SP/MENU_SQL) 산출.
 *
 *   ⚠️ Backend ComposerPromptBuilder 의 NEW_STEP 가이드는 Phase 2B-3 에서 갱신 예정.
 *      현재는 NEW_NL 의 system prompt 가 적용되지만, 이 자연어 내용 자체가 충분히
 *      구조화되어 있어 Claude 가 화면 의도 파악 가능.
 */
export function specToInitialPrompt(spec) {
  if (!spec) return '';
  const lines = [];
  const meta = spec.meta || {};

  lines.push('[Composer 신규 화면 생성 — 패턴 기반 시각 편집 모델 (NEW_STEP)]');
  lines.push('');

  // ── 1) 패턴 + 메타 ──
  if (meta.pattern)       lines.push(`[참조 패턴] ${meta.pattern}`);
  if (meta.title)         lines.push(`[화면 제목] ${meta.title}`);
  if (meta.menuCd)        lines.push(`[메뉴 코드] ${meta.menuCd}`);
  if (meta.parentMenuCd)  lines.push(`[부모 메뉴] ${meta.parentMenuCd}`);
  if (meta.menuFilePath)  lines.push(`[메뉴 경로] ${meta.menuFilePath}`);
  lines.push('');

  // ── 2) Body Layers (top-level + children nested) ──
  const allLayers = Array.isArray(spec.layers) ? spec.layers : [];
  const tops = allLayers.filter((l) => !l.parentKey);
  lines.push(`[Body Layers (top-level ${tops.length} · 전체 ${allLayers.length})]`);

  // ★ 사용자 의도 레이아웃 — RGL position (x/y) 으로 SplitPanel direction 강제 추론.
  //   같은 y · 다른 x → horizontal (좌우 분할).
  //   같은 x · 다른 y → vertical (상하 분할).
  //   2x2 격자 → 혼합 (사용자가 명시한 격자 그대로 — 단일 SplitPanel 부적합 케이스).
  //   1개 → 그냥 직접 mount.
  if (tops.length >= 2) {
    const withPos = tops.filter((l) => l.position).map((l) => ({
      key: l.key, title: l.title || l.key,
      x: l.position.x, y: l.position.y, w: l.position.w, h: l.position.h,
    }));
    if (withPos.length === tops.length) {
      const allSameY = withPos.every((p) => p.y === withPos[0].y);
      const allSameX = withPos.every((p) => p.x === withPos[0].x);
      lines.push('');
      lines.push('[★ 사용자 의도 레이아웃 — RGL position 기반 (반드시 이 방향 준수)]');
      if (allSameY && !allSameX) {
        const sortedX = [...withPos].sort((a, b) => a.x - b.x);
        const sizes = sortedX.map((p) => Math.round((p.w / 12) * 100));
        lines.push(`- 방향: 좌우 분할 (horizontal)`);
        lines.push(`- 순서: ${sortedX.map((p) => `${p.title}(x=${p.x},w=${p.w})`).join(' | ')}`);
        lines.push(`- JSX: <SplitPanel direction="horizontal" sizes={[${sizes.join(',')}]} minSize={290}>`);
      } else if (allSameX && !allSameY) {
        const sortedY = [...withPos].sort((a, b) => a.y - b.y);
        const totalH = sortedY.reduce((s, p) => s + (p.h || 0), 0) || 1;
        const sizes = sortedY.map((p) => Math.round((p.h / totalH) * 100));
        lines.push(`- 방향: 상하 분할 (vertical)`);
        lines.push(`- 순서: ${sortedY.map((p) => `${p.title}(y=${p.y},h=${p.h})`).join(' → ')}`);
        lines.push(`- JSX: <SplitPanel direction="vertical" sizes={[${sizes.join(',')}]} minSize={200}>`);
      } else {
        lines.push(`- 방향: 격자/혼합 — 단순 SplitPanel 부적합. 외곽 vertical SplitPanel + 내부 horizontal SplitPanel 중첩 또는 격자 grid 로 직접 구성.`);
        lines.push(`- 좌표: ${withPos.map((p) => `${p.title}(x=${p.x},y=${p.y},w=${p.w},h=${p.h})`).join(' / ')}`);
      }
      lines.push('- 위 방향과 순서는 사용자가 Layout 단계에서 명시한 의도이며, 임의로 좌우↔상하 변경 금지.');
    }
  }

  const renderLayer = (l, idx, indent = 0) => {
    const pad = '  '.repeat(indent);
    lines.push('');
    lines.push(`${pad}${indent === 0 ? `${idx + 1}.` : '- 자식:'} layer '${l.key}' — title:"${l.title || ''}"`);
    lines.push(`${pad}   type: ${l.type}${l.subtype ? ` · subtype: ${l.subtype}` : ''}`);
    if (l.position && indent === 0) {
      const { x, y, w, h } = l.position;
      lines.push(`${pad}   position: x=${x} y=${y} w=${w} h=${h}  (RGL 12-col grid)`);
    }
    const ds = l.dataSource || {};
    const nl = (ds.naturalText || '').trim();
    if (nl) {
      lines.push(`${pad}   데이터 의도:`);
      nl.split(/\r?\n/).forEach((row) => lines.push(`${pad}     ${row}`));
    }
    const refs = ds.references || [];
    if (refs.length > 0) {
      lines.push(`${pad}   참조 데이터 객체:`);
      refs.forEach((r) => lines.push(`${pad}     - ${r.kind}: ${r.name}`));
    }
    const sqls = ds.sqlBlocks || [];
    if (sqls.length > 0) {
      lines.push(`${pad}   Inline SQL:`);
      sqls.forEach((sql, i) => {
        lines.push(`${pad}     [SQL ${i + 1}]`);
        sql.split(/\r?\n/).forEach((row) => lines.push(`${pad}     ${row}`));
      });
    }
    if (Array.isArray(l.columns) && l.columns.length > 0) {
      lines.push(`${pad}   컬럼: ${l.columns.map((c) => c.name || c.field || JSON.stringify(c)).join(', ')}`);
    }

    // Container 의 자식들도 nested 출력
    if (l.type === 'CONTAINER') {
      const children = allLayers.filter((c) => c.parentKey === l.key);
      if (children.length > 0) {
        lines.push(`${pad}   ★ 이 Container 안에 ${children.length}개 자식 layer 포함 — wrapper(예: <TabContainer>) 안에 자식들을 모두 배치:`);
        children.forEach((c, ci) => renderLayer(c, ci, indent + 1));
      } else {
        lines.push(`${pad}   (자식 layer 없음 — 사용자가 wrapper 자체만 의도)`);
      }
    }
  };
  tops.forEach((l, idx) => renderLayer(l, idx, 0));
  lines.push('');

  // ── 3) FilterBar ──
  const fb = spec.filterBar || {};
  const items = Array.isArray(fb.items) ? fb.items : [];
  const affects = fb.affects || {};
  lines.push(`[FilterBar 필드 (${items.length})]`);
  if (items.length === 0) {
    lines.push('  (필드 없음 — FilterBar 미사용)');
  } else {
    items.forEach((it, idx) => {
      lines.push(`${idx + 1}. ${it.key} (${it.type})${it.label ? ` — label: "${it.label}"` : ''}`);
      // 옵션 source — select-like type 에 한해 사용자가 지정한 options 가 있으면 직렬화.
      //   inline:      [{value, label}, ...] → "Y=사용, N=미사용" 형식으로 표기
      //   common_code: { groupCd } → TB_AD_COMN_CODE 의 GRP_CD 표기 + onMount fetch 가이드
      const opt = it.options;
      if (opt && opt.source) {
        if (opt.source === 'inline' && Array.isArray(opt.inline) && opt.inline.length > 0) {
          const pairs = opt.inline.map((o) => `${o.value}=${o.label}`).join(', ');
          lines.push(`   옵션 (inline): ${pairs}`);
          lines.push(`   → <InputField type="select" options={[${opt.inline.map((o) => `{value:'${o.value}',label:'${o.label}'}`).join(',')}]} ...>`);
        } else if (opt.source === 'common_code' && opt.commonCode?.groupCd) {
          const gc = opt.commonCode.groupCd;
          lines.push(`   옵션 (common_code): GRP_CD=${gc}`);
          lines.push(`   → 화면 onMount 에 zAxios.get('/system/common/codes',{params:{'group-cd':'${gc}'}}) 로 옵션 fetch (rules/21 §3.3)`);
        } else if (opt.source === 'sp' && opt.sp?.name) {
          // sp source — 산출 백엔드 Controller 에 옵션 endpoint 자동 생성하도록 LLM 지시.
          //   ★ 정책: 신규 화면은 wingui 단독 구동 + RestController + JdbcTemplate (rules/41 §1.1).
          //         별도 callService 사용 안 함.
          const spName = opt.sp.name;
          const params = (opt.sp.paramsJson || '').trim();
          lines.push(`   옵션 (sp): ${spName}${params ? ` · params=${params}` : ''}`);
          lines.push(`   → 산출 백엔드 Controller 에 옵션 endpoint 추가:`);
          lines.push(`        GET /<m>/<feat>/options/${it.key.toLowerCase()}`);
          lines.push(`        → JdbcTemplate.query("EXEC ${spName} ${params ? '?, ?, ...' : ''}", (rs,i) -> Map.of("value", rs.getString(1), "label", rs.getString(2)))`);
          lines.push(`   → 화면 onMount 에 zAxios.get('<m>/<feat>/options/${it.key.toLowerCase()}').then(r => setOptions(r.data))`);
          lines.push(`   → 결과 첫 컬럼=value, 두번째=label 가정 (SELECT 절 순서 준수)`);
        } else if (opt.source === 'sql' && opt.sql?.query) {
          // sql source — 산출 백엔드 Controller 에 endpoint + JdbcTemplate.query 직접 실행.
          const sql = opt.sql.query.trim();
          lines.push(`   옵션 (sql): 다음 SQL 실행 (MSSQL)`);
          sql.split(/\r?\n/).forEach((row) => lines.push(`        ${row}`));
          lines.push(`   → 산출 백엔드 Controller 에 옵션 endpoint 추가:`);
          lines.push(`        GET /<m>/<feat>/options/${it.key.toLowerCase()}`);
          lines.push(`        → JdbcTemplate.query("<위 SQL>", (rs,i) -> Map.of("value", rs.getString(1), "label", rs.getString(2)))`);
          lines.push(`   → 화면 onMount 에 zAxios.get('<m>/<feat>/options/${it.key.toLowerCase()}').then(r => setOptions(r.data))`);
          lines.push(`   → 결과 첫 컬럼=value, 두번째=label 가정 (SELECT 절 순서 준수)`);
        }
      }
    });
  }
  if (Object.keys(affects).length > 0) {
    lines.push('');
    lines.push('[FilterBar 영향 매핑]');
    Object.entries(affects).forEach(([layerKey, fieldKeys]) => {
      if (!Array.isArray(fieldKeys) || fieldKeys.length === 0) return;
      lines.push(`  - ${layerKey} ← ${fieldKeys.join(', ')}`);
    });
  }
  lines.push('');

  // ── 3.5) Layer 관계 (Phase 2D-2a — informal; Phase 2D-2b 에서 정식 가이드 통합) ──
  const rels = Array.isArray(spec.relations) ? spec.relations : [];
  if (rels.length > 0) {
    lines.push(`[Layer 관계 (${rels.length}개)]`);
    rels.forEach((r) => {
      const map = r.mapping || {};
      const mapStr = Object.keys(map).length > 0
        ? ` | mapping: ${Object.entries(map).map(([k, v]) => `${k}→${v}`).join(', ')}`
        : '';
      lines.push(`- ${r.source?.layerKey} (${r.source?.event}) → ${r.target?.layerKey} (${r.target?.action})${mapStr}`);
    });
    lines.push('');
  }

  // ── 4) 지시사항 ──
  lines.push('[지시사항]');
  lines.push('위 spec 을 바탕으로 화면을 생성하세요.');
  lines.push('- JSX 화면 컴포넌트 (각 layer 의 type/subtype 에 맞는 wingui 컴포넌트)');
  lines.push('- 필요 시 Java Entity / Service / RestController');
  lines.push('- SP_UI_*.sql (CRUD 액션마다 1개 · MSSQL 방언)');
  lines.push('- MENU_SQL (TB_AD_MENU + TB_AD_LANG_PACK 4언어 + TB_AD_PERMISSION_GROUP)');
  lines.push('- `.claude/rules/41-composer-generation.md` 및 sub rules 의 규약 준수.');
  lines.push('- 위 layer 의 "데이터 의도" 와 "참조 데이터 객체" / "Inline SQL" 를 우선 활용.');
  lines.push('- FilterBar 필드는 화면 전체 검색조건 (SearchArea) 로 구현.');
  lines.push('');

  // ── 5) ★ 산출물 출력 포맷 (강제) ──
  // ArtifactExtractor 는 정확히 다음 패턴만 인식:
  //   ===FILE: <path>===
  //   ```<lang>
  //   <본문>
  //   ```
  // <write_file> · <code_block> 등 XML/agent-framework 포맷은 추출되지 않아 산출물 0건.
  lines.push('[★ 산출물 출력 포맷 (반드시 준수)]');
  lines.push('각 파일은 정확히 다음 4줄 패턴으로 출력하세요. <write_file> XML · markdown 헤딩 · 코드펜스 단독 사용 모두 금지:');
  lines.push('');
  lines.push('===FILE: <전체경로/파일명.확장자>===');
  lines.push('```<jsx|java|sql|json>');
  lines.push('<파일 본문>');
  lines.push('```');
  lines.push('');
  lines.push('예시:');
  lines.push('');
  lines.push('===FILE: packages/wingui/src/view/util/userinfomgmt/UserInfoMgmt.jsx===');
  lines.push('```jsx');
  lines.push('import React from \'react\';');
  lines.push('// ...');
  lines.push('export default UserInfoMgmt;');
  lines.push('```');
  lines.push('');
  lines.push('===FILE: t3series-database/mssql/upgrade/v26.0.0-YYYYMMDD/procedures/SP_UI_UT_99_Q1.sql===');
  lines.push('```sql');
  lines.push('CREATE PROCEDURE [dbo].[SP_UI_UT_99_Q1] AS BEGIN ... END');
  lines.push('```');
  lines.push('');
  lines.push('- 확장자는 dot (`.sql`/`.jsx`/`.java`) — underscore (`_sql`) 금지.');
  lines.push('- MENU_SQL 파일은 path 에 `/menus/` 디렉토리 또는 파일명에 `menu` 단어를 포함 (분류 보강).');
  lines.push('- 설명·요약 텍스트는 ===FILE: 블록 사이에 자유롭게 작성 가능.');

  return lines.join('\n');
}

// ============================================================================
// Phase 3a — 9-step Wizard spec → 4-step ComposerWizard spec converter
//   Phase 3b~3e 의 4개 모드 마이그레이션 시 prefill 데이터를 새 wizard 에 주입할 때 사용.
//   Spec: docs/superpowers/specs/2026-05-22-composer-canvas-phase3a-spec-converter-design.md
// ============================================================================

/**
 * step4_dataBinding 의 source 토큰을 4-step dataSource 객체로 변환.
 *
 * @param {object} db4  step4_dataBinding[areaId] entry — 없으면 빈 NL.
 * @returns {object}    { mode, naturalText, references, sqlBlocks }
 */
function mapStep4ToDataSource(db4) {
  if (!db4 || typeof db4 !== 'object') {
    return { mode: 'NL', naturalText: '', references: [], sqlBlocks: [] };
  }
  const src = String(db4.source || '').toUpperCase();
  if (src === 'SP') {
    return {
      mode: 'SP',
      naturalText: '',
      references: db4.spName ? [{ kind: 'SP', name: db4.spName }] : [],
      sqlBlocks: [],
    };
  }
  if (src === 'JPA_ENTITY') {
    return {
      mode: 'ENTITY',
      naturalText: db4.baseUrl || '',
      references: db4.entity ? [{ kind: 'ENTITY', name: db4.entity }] : [],
      sqlBlocks: [],
    };
  }
  if (src === 'ONTOLOGY') {
    return {
      mode: 'TABLE',
      naturalText: '',
      references: db4.ontologyRef ? [{ kind: 'TABLE', name: db4.ontologyRef }] : [],
      sqlBlocks: [],
    };
  }
  if (src === 'DIRECT') {
    return {
      mode: 'NL',
      naturalText: db4.directUrl || '',
      references: [],
      sqlBlocks: [],
    };
  }
  if (src === 'ENGINE') {
    return {
      mode: 'SP',
      naturalText: '',
      references: db4.spName ? [{ kind: 'SP', name: db4.spName }] : [],
      sqlBlocks: [],
    };
  }
  return { mode: 'NL', naturalText: '', references: [], sqlBlocks: [] };
}

/**
 * 9-step layoutConfig.layers[].componentType → 4-step LAYER_TYPES.
 *
 * @param {string} componentType
 * @returns {object} { type, subtype }
 */
function mapComponentTypeToLayerType(componentType) {
  const ct = String(componentType || '').toUpperCase();
  if (ct.includes('CONTAINER') || ct.includes('TAB')) {
    return { type: LAYER_TYPES.CONTAINER, subtype: ct || 'CONTAINER_TAB' };
  }
  if (ct.includes('DASHBOARD') || ct.includes('WIDGET')) {
    return { type: LAYER_TYPES.CHART, subtype: 'CHART_DASHBOARD' };
  }
  if (ct.includes('CHART')) {
    return { type: LAYER_TYPES.CHART, subtype: ct };
  }
  if (ct.includes('DOCUMENT') || ct.includes('PDF') || ct.includes('IMAGE')) {
    return { type: LAYER_TYPES.DOCUMENT, subtype: ct };
  }
  if (ct.includes('AI') || ct.includes('INSIGHT')) {
    return { type: LAYER_TYPES.AI, subtype: ct };
  }
  return { type: LAYER_TYPES.GRID, subtype: ct || 'GRID_BASE' };
}

/**
 * 9-step Wizard spec → 4-step ComposerWizard spec 변환.
 *
 * Phase 3a 의 핵심 — 4개 모드 (NEW_FROM_COPY/EXISTING_MODIFY/NEW_FROM_DESIGN/NEW_GENERAL)
 * 마이그레이션 시 prefill 데이터를 새 ComposerWizard 에 주입할 때 사용.
 *
 * @param {object} spec9   9-step Wizard spec (createInitialSpec/FromSource/FromDesign 출력)
 * @returns {object}       4-step ComposerWizard spec (createComposerSpec 호환)
 */
export function convertStep9SpecToWizardSpec(spec9) {
  if (!spec9 || typeof spec9 !== 'object') {
    return createComposerSpec();
  }

  const step2 = spec9.step2_overview || {};
  const step1 = spec9.step1_layout   || {};
  const meta = {
    menuCd:       step2.menuCd       || '',
    title:        step2.screenName   || '',
    parentMenuCd: step2.parentMenuCd || '',
    menuFilePath: step2.menuFilePath || '',
    pattern:      step1.patternCode  || 'BLANK',
  };

  const lc = step1.layoutConfig || {};
  const lcLayers = Array.isArray(lc.layers) ? lc.layers : [];
  const step4 = spec9.step4_dataBinding || {};
  const step5 = spec9.step5_columns     || {};
  const step6 = spec9.step6_cascade     || {};

  const layers = lcLayers.map((l, idx) => {
    const key = l.key || `layer${idx + 1}`;
    const { type, subtype } = mapComponentTypeToLayerType(l.componentType);
    const layer = {
      key,
      title: l.title || key,
      type,
      subtype,
      position: {
        x: typeof l.x === 'number' ? l.x : 0,
        y: typeof l.y === 'number' ? l.y : 0,
        w: typeof l.w === 'number' ? l.w : 12,
        h: typeof l.h === 'number' ? l.h : 6,
      },
      dataSource: mapStep4ToDataSource(step4[key]),
      columns: (step5[key] && Array.isArray(step5[key].columns)) ? step5[key].columns : [],
      cascade: (step6[key] && Array.isArray(step6[key].rules))
        ? { rules: step6[key].rules }
        : {},
    };
    if (l.parentKey) layer.parentKey = l.parentKey;
    return layer;
  });

  // filterBar: step7_filter.fields 우선 (label/type 메타 풍부),
  //            없으면 step1.layoutConfig.filterBar.items 폴백.
  const step7 = spec9.step7_filter || {};
  const fbStep1 = lc.filterBar || {};
  let items = [];
  if (Array.isArray(step7.fields) && step7.fields.length > 0) {
    items = step7.fields.map((f) => ({
      key:   f.fieldId || f.varName || `field_${Math.random().toString(36).slice(2, 8)}`,
      label: f.label || '',
      type:  f.type  || 'TEXT',
      ...(f.options ? { options: f.options } : {}),
    }));
  } else if (Array.isArray(fbStep1.items) && fbStep1.items.length > 0) {
    items = fbStep1.items.map((it) => ({
      key:   it.key,
      label: it.label || '',
      type:  it.type  || 'TEXT',
      ...(it.options ? { options: it.options } : {}),
    }));
  }
  const affects = (fbStep1.affects && typeof fbStep1.affects === 'object')
    ? fbStep1.affects
    : {};

  return {
    meta,
    filterBar: { items, affects },
    layers,
    _originStep9: spec9,
  };
}
