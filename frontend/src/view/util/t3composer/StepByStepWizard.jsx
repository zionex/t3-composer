import React, { useMemo, useState } from 'react';
import {
  Box, Stepper, Step, StepLabel, StepContent, Button, Typography, Stack, Chip, Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

import { getModule, getPattern } from './constants';
import ModuleSelector from './ModuleSelector';
import ComposerWorkspace from './ComposerWorkspace';
import { createSession } from './api';

import {
  WIZARD_STEPS, createInitialSpec, canProceedStep, invalidateDownstream, toLlmPayload,
  formatSourceBundleForPrompt, formatDesignDocForPrompt,
} from './wizardState';

import Step1Layout        from './steps/Step1Layout';
import Step2Overview      from './steps/Step2Overview';
import Step3Components    from './steps/Step3Components';
import Step4DataBinding   from './steps/Step4DataBinding';
import Step5Columns       from './steps/Step5Columns';
import Step6Cascade       from './steps/Step6Cascade';
import Step7FilterBar     from './steps/Step7FilterBar';
import Step8FilterCascade from './steps/Step8FilterCascade';
import Step9Generate      from './steps/Step9Generate';

/**
 * 단계별 생성 Wizard — 신규 화면 생성의 단일 진입점.
 *
 * 세 가지 진입 시나리오 (모두 9단계 동일 흐름. 차이는 prefill 출처 뿐):
 *   ① NEW_STEP        — 모듈 선택 → 빈 spec 으로 시작 (사용자 직접 입력)
 *   ② NEW_FROM_COPY   — 원본 메뉴 선택 → sourceBundle 추출 → `createInitialSpecFromSource()`
 *                       호출자: ModeNewFromCopy
 *   ③ NEW_FROM_DESIGN — 설계서 업로드 → 엑셀 파싱 → `createInitialSpecFromDesign()`
 *                       호출자: ModeNewFromDesign
 *
 * 모드와 무관하게 9단계 (Layout / Overview / Components / DataBinding / Columns / Cascade
 * / Filter / FilterCascade / Generate) 동일. Step9 의 "생성 시작" 버튼이 createSession
 * + LLM 호출 수행.
 */
function StepByStepWizard({
  initialModuleCode,
  onBack,
  // NEW_FROM_COPY / NEW_FROM_DESIGN 진입 시 호출자가 채워서 전달
  mode = 'NEW_STEP',
  prefilledSpec = null,
  sourceBundle = null,
}) {
  const initialSpec = prefilledSpec || createInitialSpec(initialModuleCode);
  // prefill 모드는 모듈을 자동 추론해 prefilledSpec.moduleCode 로 들어옴 → 모듈선택 단계 skip
  const startsWithModule = !!(prefilledSpec?.moduleCode || initialModuleCode);
  // 진입 시점 정합화 — prefilledSpec 의 step1.areas[].id 와 step3~6 의 키가 mismatch 면
  // (LayoutDesigner mount-time normalize 등 어느 경로든) 한 번 reconcile 해 데이터 보존.
  // 이미 일치하면 no-op. NEW_FROM_COPY 데이터 연결이 빈 칸으로 나오는 회귀 방지.
  const reconciledInitialSpec = invalidateDownstream(initialSpec, 0);

  const [moduleSelected, setModuleSelected] = useState(startsWithModule);
  const [moduleCode, setModuleCode] = useState(initialSpec.moduleCode || null);

  const [spec, setSpec] = useState(() => reconciledInitialSpec);
  const [active, setActive] = useState(0);

  const [session, setSession] = useState(null);
  const [initialPrompt, setInitialPrompt] = useState(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);

  const isCopyMode   = mode === 'NEW_FROM_COPY';
  const isDesignMode = mode === 'NEW_FROM_DESIGN';
  const isModifyMode = mode === 'EXISTING_MODIFY';

  const module  = useMemo(() => getModule(moduleCode), [moduleCode]);
  const pattern = useMemo(() => getPattern(spec.step1_layout.patternCode), [spec.step1_layout.patternCode]);

  const canNext = WIZARD_STEPS.map((_, idx) => canProceedStep(idx, spec));
  const next    = () => setActive((a) => Math.min(a + 1, WIZARD_STEPS.length - 1));
  const prev    = () => setActive((a) => Math.max(a - 1, 0));

  // 단계별 데이터 update helper — 변경 시 하위 단계 invalidate
  const updateStep = (stepIndex, patch) => {
    setSpec((prev) => {
      const keyMap = {
        0: 'step1_layout',
        1: 'step2_overview',
        2: 'step3_components',
        3: 'step4_dataBinding',
        4: 'step5_columns',
        5: 'step6_cascade',
        6: 'step7_filter',
        7: 'step8_filterCascade',
      };
      const key = keyMap[stepIndex];
      if (!key) return prev;
      const merged = { ...prev, [key]: typeof patch === 'function' ? patch(prev[key]) : patch };
      return invalidateDownstream(merged, stepIndex);
    });
  };

  // NEW_FROM_COPY · Step9 의 자유 텍스트 변경 요청 update
  const updateChangeReq = (text) => {
    setSpec((prev) => ({ ...prev, changeReq: text }));
  };

  const startGeneration = async () => {
    setStarting(true);
    setError(null);
    try {
      const screenLabel = spec.step2_overview.screenName || spec.step2_overview.screenId || 'New Screen';
      let titlePrefix;
      if (isCopyMode)        titlePrefix = `[복사] ${spec.sourceMenu?.menuCd || '?'} → `;
      else if (isDesignMode) titlePrefix = `[설계서] ${spec.designDoc?.fileName || '?'} → `;
      else if (isModifyMode) titlePrefix = `[수정] ${spec.sourceMenu?.menuCd || '?'} `;
      else                   titlePrefix = `[${module?.code || '?'}] `;
      const sessRes = await createSession({
        mode,
        targetMenuCd: spec.step2_overview.menuCd || undefined,
        title: `${titlePrefix}${screenLabel}`,
      });
      setInitialPrompt(buildStepPrompt(spec, module, pattern, { isCopyMode, isDesignMode, isModifyMode, sourceBundle }));
      setSession(sessRes.data);
    } catch (e) {
      setError(e?.response?.data?.message || e?.response?.data?.error || e?.message || '세션 생성 실패');
    } finally {
      setStarting(false);
    }
  };

  // 세션 생성되면 Workspace 로 전환
  if (session) {
    return (
      <ComposerWorkspace
        session={session}
        initialPrompt={initialPrompt}
        extraHeader={
          <Button size="small" startIcon={<ArrowBackIcon fontSize="small" />} onClick={onBack} sx={{ mr: 1 }}>
            종료
          </Button>
        }
      />
    );
  }

  // 사전 단계: 모듈 미선택 시 모듈 선택 UI
  if (!moduleSelected) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        <Stack direction="row" alignItems="center" sx={{ px: 2, py: 1, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
          <Button startIcon={<ArrowBackIcon fontSize="small" />} onClick={onBack} size="small">모드 선택</Button>
          <Typography variant="subtitle1" sx={{ ml: 2, fontWeight: 600 }}>단계별 생성 — 모듈 선택</Typography>
        </Stack>
        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          <ModuleSelector
            value={moduleCode}
            onChange={(code) => {
              setModuleCode(code);
              setSpec(createInitialSpec(code));
            }}
          />
          <Button
            variant="contained"
            disabled={!moduleCode}
            sx={{ mt: 2 }}
            onClick={() => setModuleSelected(true)}
            endIcon={<ArrowForwardIcon fontSize="small" />}
          >
            다음 — Layout 구성
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <Stack direction="row" alignItems="center" sx={{ px: 2, py: 1, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
        <Button startIcon={<ArrowBackIcon fontSize="small" />} onClick={onBack} size="small">
          {isCopyMode ? '원본 선택' : isDesignMode ? '설계서 검토' : '모드 선택'}
        </Button>
        <Typography variant="subtitle1" sx={{ ml: 2, fontWeight: 600 }}>
          {isCopyMode ? '기존 화면 복사 — 9 Steps'
            : isDesignMode ? '설계서 기반 — 9 Steps'
            : '단계별 생성 — 9 Steps'}
        </Typography>
        {isCopyMode && spec.sourceMenu?.menuCd && (
          <Chip
            label={`원본: ${spec.sourceMenu.menuCd}`}
            size="small"
            sx={{ ml: 1, bgcolor: '#10b98122', color: '#10b981', fontWeight: 500 }}
          />
        )}
        {isDesignMode && spec.designDoc?.fileName && (
          <Chip
            label={`설계서: ${spec.designDoc.fileName}`}
            size="small"
            sx={{ ml: 1, bgcolor: '#2563eb22', color: '#2563eb', fontWeight: 500, fontFamily: 'monospace' }}
          />
        )}
        {module && (
          <Chip
            label={`${module.code} · ${module.nameKo || module.name}`}
            size="small"
            sx={{ ml: 1, bgcolor: `${module.color}22`, color: module.color, fontWeight: 500 }}
          />
        )}
        {pattern && (
          <Chip label={`${pattern.code} · ${pattern.name}`} size="small" sx={{ ml: 0.5 }} variant="outlined" />
        )}
      </Stack>

      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        <Stepper activeStep={active} orientation="vertical">
          {WIZARD_STEPS.map((step, idx) => (
            <Step key={step.key}>
              <StepLabel optional={
                <Typography variant="caption" color="text.secondary">{step.sub}</Typography>
              }>
                {step.label}
              </StepLabel>
              <StepContent>
                {renderStep({ idx, spec, module, pattern, updateStep, updateChangeReq, startGeneration, starting, error })}
                {idx < 8 && (
                  <StepActions
                    onNext={next}
                    onPrev={idx > 0 ? prev : null}
                    canNext={canNext[idx]}
                  />
                )}
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </Box>
    </Box>
  );
}

function renderStep({ idx, spec, module, pattern, updateStep, updateChangeReq, startGeneration, starting, error }) {
  switch (idx) {
    case 0:
      return (
        <Step1Layout
          value={spec.step1_layout}
          recommendedPatterns={module?.commonPatterns || []}
          onChange={(v) => updateStep(0, v)}
        />
      );
    case 1:
      return (
        <Step2Overview
          value={spec.step2_overview}
          moduleCode={module?.code}
          onChange={(v) => updateStep(1, v)}
        />
      );
    case 2:
      return (
        <Step3Components
          areas={spec.step1_layout.areas}
          value={spec.step3_components}
          onChange={(v) => updateStep(2, v)}
        />
      );
    case 3:
      return (
        <Step4DataBinding
          areas={spec.step1_layout.areas}
          moduleCode={module?.code}
          value={spec.step4_dataBinding}
          onChange={(v) => updateStep(3, v)}
        />
      );
    case 4:
      return (
        <Step5Columns
          areas={spec.step1_layout.areas}
          dataBinding={spec.step4_dataBinding}
          value={spec.step5_columns}
          onChange={(v) => updateStep(4, v)}
        />
      );
    case 5:
      return (
        <Step6Cascade
          areas={spec.step1_layout.areas}
          columns={spec.step5_columns}
          value={spec.step6_cascade}
          onChange={(v) => updateStep(5, v)}
        />
      );
    case 6:
      return (
        <Step7FilterBar
          value={spec.step7_filter}
          onChange={(v) => updateStep(6, v)}
        />
      );
    case 7:
      return (
        <Step8FilterCascade
          filterFields={spec.step7_filter.fields}
          value={spec.step8_filterCascade}
          onChange={(v) => updateStep(7, v)}
        />
      );
    case 8:
      return (
        <Step9Generate
          spec={spec}
          module={module}
          pattern={pattern}
          onChangeReqUpdate={updateChangeReq}
          onStart={startGeneration}
          starting={starting}
          error={error}
        />
      );
    default:
      return null;
  }
}

function StepActions({ onNext, onPrev, canNext }) {
  return (
    <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
      {onPrev && <Button onClick={onPrev}>이전</Button>}
      <Button
        variant="contained"
        onClick={onNext}
        disabled={!canNext}
        endIcon={<ArrowForwardIcon fontSize="small" />}
      >
        다음
      </Button>
    </Stack>
  );
}

/**
 * 9단계 spec 을 Claude 에 전달할 prompt 로 직렬화.
 * `ComposerPromptBuilder.newStepGuide` 가 이 JSON 구조를 이해하고 구조화된 산출물을 생성한다.
 *
 * 모드별 컨텍스트:
 *   - isCopyMode   : sourceBundle (원본 JSX/Entity/SP 텍스트) 을 첨부 + 복제 절차 명시
 *   - isDesignMode : 설계서 parsed (시트별 텍스트) 를 첨부 + 설계서 충실 원칙 명시
 *   - 그 외        : Users.jsx 정답지 참조로 새로 생성
 */
function buildStepPrompt(spec, module, pattern, {
  isCopyMode = false,
  isDesignMode = false,
  isModifyMode = false,
  sourceBundle = null,
} = {}) {
  const payload = toLlmPayload(spec, module, pattern);
  const lines = [];

  if (isModifyMode) {
    lines.push(
      '다음은 **기존 화면 수정(EXISTING_MODIFY) + 9단계 Wizard** 결과입니다.',
      '대상 메뉴는 이미 운영 중인 화면이며, 사용자가 9단계 Spec 의 일부 항목만 변경한 후 호출했습니다.',
      'Spec 의 모든 항목이 새로 작성되는 게 아니라, 사용자가 변경한 부분만 원본에 반영되어야 합니다.',
      '',
      `대상 메뉴: ${spec.sourceMenu?.menuCd || spec.step2_overview?.menuCd || '?'} (${spec.sourceMenu?.filePath || ''})`,
      `파일경로: ${spec.step2_overview?.menuFilePath || ''}`,
      '',
    );
  } else if (isCopyMode) {
    lines.push(
      '다음은 **기존 화면 복사(NEW_FROM_COPY) + 9단계 Wizard** 결과입니다.',
      '원본 화면을 기계적으로 복제하되, 9단계 Spec 에 명시된 신규 도메인 값(menuCd / 파일경로 / 컬럼 / 검색조건)으로 치환하세요.',
      '',
      `원본 메뉴: ${spec.sourceMenu?.menuCd || '?'} (${spec.sourceMenu?.filePath || ''})`,
      `신규 메뉴: ${spec.step2_overview?.menuCd || '?'} · 파일경로: ${spec.step2_overview?.menuFilePath || ''}`,
      '',
    );
  } else if (isDesignMode) {
    lines.push(
      '다음은 **설계서 기반(NEW_FROM_DESIGN) + 9단계 Wizard** 결과입니다.',
      '엑셀 설계서를 자동 파싱한 결과를 9단계 Spec 으로 prefill 한 뒤 사용자가 검토했습니다.',
      'Spec 의 모든 항목은 설계서를 신뢰의 원천으로 삼되, 사용자가 명시적으로 수정한 부분은 그 우선순위를 따릅니다.',
      '',
      `설계서: ${spec.designDoc?.fileName || '?'}`,
      `대상 메뉴: ${spec.step2_overview?.menuCd || '?'} · 파일경로: ${spec.step2_overview?.menuFilePath || ''}`,
      '',
    );
  } else {
    lines.push(
      '다음 9단계 wizard 수집 스펙에 맞춰 화면을 생성해주세요.',
      '각 단계는 독립 JSON 섹션으로 이미 검증됐으므로 그대로 신뢰하세요.',
      '',
    );
  }

  lines.push(
    '=== 9단계 Spec (JSON) ===',
    '```json',
    JSON.stringify(payload, null, 2),
    '```',
    '',
  );

  if (isCopyMode && sourceBundle) {
    lines.push(
      '=== 원본 소스 번들 (참조 원본) ===',
      '아래 파일들을 그대로 복제 후 9단계 Spec 의 신규 값으로 네이밍·필드만 치환합니다.',
      '원본에 없는 wrapper/컴포넌트/import 추가 금지.',
      '',
      formatSourceBundleForPrompt(sourceBundle),
      '',
    );

    if (spec.changeReq && spec.changeReq.trim()) {
      lines.push(
        '=== 사용자 추가 변경 요청 ===',
        spec.changeReq,
        '',
      );
    }

    lines.push(
      '=== 산출물 원칙 (NEW_FROM_COPY) ===',
      '1. 원본 JSX 의 import·gridItems·useFieldCascade·CommonCodeSelect·Pop\\* 사용 패턴을 그대로 유지.',
      '2. 원본 Entity 가 있으면 재사용 — 신규 Entity/Repository/Service/Controller 생성 금지.',
      '3. 9단계 Spec 의 layoutAreas / areaColumns / filterBar 변경분만 원본에 반영.',
      '4. 산출물: JSX 1개 + MENU_SQL 1개. DDL · SP · 엔진 XML 절대 금지.',
    );
  } else if (isDesignMode && spec.parsedDesign) {
    lines.push(
      '=== 설계서 본문 (참조 원본) ===',
      '아래는 설계서 엑셀 시트별 파싱 텍스트. 9단계 Spec 과 동일한 정보가 더 풍부하게 들어있을 수 있습니다.',
      '설계서와 9단계 Spec 이 다르면 9단계 Spec(사용자 보강 결과) 우선.',
      '',
      formatDesignDocForPrompt({
        fileName: spec.designDoc?.fileName,
        parsed: spec.parsedDesign,
        layoutSizes: spec.layoutSizes,
        mainLayoutConfig: spec.mainLayoutConfig,
      }),
      '',
    );

    if (spec.changeReq && spec.changeReq.trim()) {
      lines.push('=== 사용자 추가 변경 요청 ===', spec.changeReq, '');
    }

    lines.push(
      '=== 산출물 원칙 (NEW_FROM_DESIGN) ===',
      '1. 화면 ID/명칭/메뉴 위치는 설계서 개요 시트 값 그대로 사용 (Spec 의 screen 객체에 이미 반영).',
      '2. Grid 시트의 컬럼 정의를 BaseGrid items 로 변환 (Spec 의 areaColumns 가 prefill 되어 있음).',
      '3. Query 시트의 SP 매핑이 명시되어 있으면 dataBinding source=SP, 없으면 JPA_ENTITY.',
      '4. ★ 새 테이블 DDL 생성 금지 — Table 시트는 매핑 참조용. 새 도메인이 필요하면 [가정] 태그로 안내.',
      '5. 산출물: JSX 1개 + MENU_SQL 1개 (+ 필요 시 Pop\\*). DDL · 신규 SP · 엔진 XML 금지.',
    );
  } else if (isModifyMode) {
    if (sourceBundle) {
      lines.push(
        '=== 현재 운영 중인 소스 (수정 베이스) ===',
        '아래는 대상 메뉴의 현재 소스 번들입니다. 변경되지 않은 부분은 그대로 유지하세요.',
        '',
        formatSourceBundleForPrompt(sourceBundle),
        '',
      );
    }

    if (spec.changeReq && spec.changeReq.trim()) {
      lines.push('=== 사용자 추가 변경 요청 ===', spec.changeReq, '');
    }

    lines.push(
      '=== 산출물 원칙 (EXISTING_MODIFY) ===',
      '1. 사용자가 9단계 Spec 에서 명시적으로 변경한 항목만 반영 — 나머지는 원본 소스 그대로 유지.',
      '2. 변경 대상 단계 식별 가이드: step1(레이아웃) · step3(컴포넌트) · step4(데이터바인딩) · step5(컬럼) · step6(cascade) · step7(FilterBar) · step8(필드 의존성) 중 원본과 다른 부분.',
      '3. 영향 범위 안의 파일을 전체 내용으로 재작성. 영향 없는 파일은 응답에 포함하지 마세요 (토큰 절감).',
      '4. menuCd · 파일경로는 변경하지 마세요. step2_overview.menuCd 는 그대로 = sourceMenu.menuCd.',
      '5. 새 테이블 DDL · 신규 SP 생성 금지 (기존 Table/Entity/SP 재사용). 단 SP 가 ALTER 가 필요하면 그것만 수정.',
    );
  } else {
    lines.push(
      '=== 참조 원본 (정답지) ===',
      'packages/wingui/src/view/system/usermgmt/users/Users.jsx — 단순 CRUD 원본',
      'web/domain/admin/user/UserController.java — 백엔드 원본',
      '',
      '위 원본의 구조·import·네이밍 패턴을 그대로 따르되, Spec 에 명시된 도메인으로 치환하세요.',
      'SQL_DDL · SP · 엔진 XML 은 생성 금지 (기존 Table/Entity 재사용 원칙).',
    );
  }

  return lines.join('\n');
}

export default StepByStepWizard;
