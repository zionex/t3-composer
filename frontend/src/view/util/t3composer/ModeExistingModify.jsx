import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Box,
  Button,
  Typography,
  Stack,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Card,
  CardActionArea,
  CardContent,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BorderColorIcon from '@mui/icons-material/BorderColor';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ChatIcon from '@mui/icons-material/Chat';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';

import MenuTreeBrowser from './MenuTreeBrowser';
import ComposerWorkspace from './ComposerWorkspace';
import ComposerWizard from './ComposerWizard';
import { SourceBundleAnalysisPanel, SourceBundlePreview } from './SourceBundleSection';
import { createSession, collectSourceForLlm, importSourceArtifacts } from './api';
import { createInitialSpecFromSource, convertStep9SpecToWizardSpec } from './wizardState';
import { useTargetStore } from './targetStore';

/**
 * 기존 화면 수정 모드.
 *
 * 2-단계 진입 (2026-04-30):
 *   ⓪ 서브모드 선택 — 자연어 수정 / 단계별 수정
 *   ① 메뉴 트리에서 화면 선택
 *   ② [NL]   소스 번들 프리뷰 → [시작] → ComposerWorkspace 자연어 대화
 *      [STEP] 소스 번들 수집 → ComposerWizard (4-step) 에 prefilledSpec + mode='EXISTING_MODIFY' 위임
 *               (createInitialSpecFromSource → convertStep9SpecToWizardSpec 변환)
 */
function ModeExistingModify({ onBack, startWith = null }) {
  const { t } = useTranslation('composer');
  // 활성 Target System (운영 DB 직접 조회용)
  const activeTargetCd = useTargetStore((s) => s.currentTargetCd);

  // 서브모드 — 'NL' (자연어, 기존 흐름) | 'STEP' (단계별 Wizard)
  //   startWith 이 주어지면(랜딩에서 직접 선택) 내부 서브모드 선택 화면을 건너뜀
  const [subMode, setSubMode] = useState(startWith);

  const [selectedMenu, setSelectedMenu]   = useState(null);
  const [sourceBundle, setSourceBundle]   = useState(null);
  const [loadingSource, setLoadingSource] = useState(false);
  const [starting, setStarting]           = useState(false);
  const [error, setError]                 = useState(null);

  // NL 흐름
  const [session, setSession]             = useState(null);
  const [initialPrompt, setInitialPrompt] = useState(null);

  // STEP 흐름
  const [wizardEntered, setWizardEntered] = useState(false);
  const [prefilledSpec, setPrefilledSpec] = useState(null);

  const reset = () => {
    setSelectedMenu(null);
    setSourceBundle(null);
    setError(null);
    setSession(null);
    setInitialPrompt(null);
    setWizardEntered(false);
    setPrefilledSpec(null);
  };

  const handleSelect = async (menuNode) => {
    setSelectedMenu(menuNode);
    setSourceBundle(null);
    setError(null);
    if (!menuNode.id) return;
    setLoadingSource(true);
    try {
      const res = await collectSourceForLlm(menuNode.id, activeTargetCd);
      setSourceBundle(res.data);
    } catch (e) {
      setError(t('modeExistingModify.errors.sourceFailed', { detail: e?.response?.data?.error || e?.message || '' }));
    } finally {
      setLoadingSource(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // [NL] 자연어 수정 — 기존 흐름
  // ─────────────────────────────────────────────────────────────────
  const handleStartNl = async () => {
    if (!selectedMenu) return;
    setStarting(true);
    setError(null);
    try {
      const sessRes = await createSession({
        mode: 'EXISTING_MODIFY',
        targetMenuCd: selectedMenu.id,
        title: t('modeExistingModify.prompt.sessionTitleSuffix', { id: selectedMenu.id }),
        targetCd: activeTargetCd,
      });

      // 선택 메뉴의 현재 소스 전체를 세션 아티팩트(DRAFT 원본)로 import →
      // 사용자가 아티팩트 트리에서 현재 기준을 보고 필요한 파일만 수정. 수정 산출물이
      // 같은 경로면 자동 supersede. import 실패해도 세션은 진행 (콘솔 경고만).
      try {
        await importSourceArtifacts(sessRes.data.id, sourceBundle);
      } catch (impErr) {
        // eslint-disable-next-line no-console
        console.warn('[Composer] 소스 아티팩트 import 실패:', impErr?.message || impErr);
      }

      const bundleText = formatBundleForPrompt(sourceBundle);
      const prompt = [
        `대상 메뉴: ${selectedMenu.id} (${selectedMenu.filePath})`,
        '',
        '이 화면의 현재 소스 전체를 아래에 제공합니다. 각 파일은 이 세션의 아티팩트',
        '(현재 기준 baseline)로도 등록되어 있습니다. 소스를 숙지한 후 다음 지시를 기다려주세요.',
        '변경 요청이 오면 영향 범위의 파일만 전체 내용으로 재작성하세요.',
        '★ ===FILE: 경로는 아래 ---FILE: 의 원본 경로와 100% 동일하게 출력하세요',
        '  (그래야 기존 아티팩트가 갱신됨). 변경되지 않는 파일은 다시 출력하지 마세요.',
        '',
        bundleText,
      ].join('\n');

      setInitialPrompt(prompt);
      setSession(sessRes.data);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || t('modeExistingModify.errors.sessionFailed'));
    } finally {
      setStarting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // [STEP] 단계별 수정 — sourceBundle 로 prefill 한 후 ComposerWizard (4-step) 위임
  // ─────────────────────────────────────────────────────────────────
  const handleStartStep = () => {
    if (!selectedMenu || !sourceBundle) return;
    setStarting(true);
    setError(null);
    try {
      // 신규 메뉴가 아닌 기존 메뉴 그대로 — newMenuCd 자리에 selectedMenu.id 사용.
      // wizard 의 step2_overview.menuCd 가 자동으로 createSession.targetMenuCd 로 들어가
      // 백엔드는 EXISTING_MODIFY 모드 + 동일 menuCd 로 인식.
      //   ★ title: TargetMenuController 가 채우는 필드는 `displayName` (다국어 표시명) 이며
      //     `title` 은 없다. 이전엔 fallback 으로 `selectedMenu.id` (= MENU_CD) 가 화면 제목으로 들어가
      //     "UI_AD_01" 처럼 표시됨 (2026-05-28).
      const baseSpec = createInitialSpecFromSource({
        sourceMenu:  selectedMenu,
        sourceBundle,
        newMenuCd:   selectedMenu.id,
        newTitle:    selectedMenu.displayName || selectedMenu.title || selectedMenu.id,
      });
      setPrefilledSpec(baseSpec);
      setWizardEntered(true);
    } catch (e) {
      setError(t('modeExistingModify.errors.specFailed', { detail: e?.message || '' }));
    } finally {
      setStarting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // 분기 렌더
  // ─────────────────────────────────────────────────────────────────

  // NL 세션 시작 후 Workspace
  if (session) {
    return (
      <ComposerWorkspace
        session={session}
        initialPrompt={initialPrompt}
        extraHeader={
          <Button size="small" startIcon={<ArrowBackIcon fontSize="small" />} onClick={onBack} sx={{ mr: 1 }}>
            {t('modeExistingModify.buttons.exit')}
          </Button>
        }
      />
    );
  }

  // STEP — Wizard 위임 (ComposerWizard 4-step + 9-step prefill 변환)
  //   prefilledSpec 은 createInitialSpecFromSource 의 9-step 형식 → convertStep9SpecToWizardSpec 로 4-step 변환.
  //   _originStep9 가 sourceBundle/sourceMenu 등 mode 메타 보존 — specToInitialPrompt 가 거기서 가져옴.
  //   (이전 StepByStepWizard 9-step 사용 → ComposerWizard 4-step 으로 이전, NEW_FROM_COPY 와 동일 패턴)
  if (wizardEntered && prefilledSpec) {
    return (
      <ComposerWizard
        initialSpec={convertStep9SpecToWizardSpec(prefilledSpec)}
        mode="EXISTING_MODIFY"
        targetCd={activeTargetCd}
        onBack={() => setWizardEntered(false)}
      />
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // 공통 헤더
  // ─────────────────────────────────────────────────────────────────
  const Header = (
    <Stack direction="row" alignItems="center" sx={{ px: 2, py: 1, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
      <Button
        startIcon={<ArrowBackIcon fontSize="small" />}
        onClick={() => {
          // startWith 으로 진입한 경우 내부 서브모드 선택을 건너뛰었으므로 바로 onBack
          if (subMode && !startWith) { reset(); setSubMode(null); } else { onBack?.(); }
        }}
        size="small"
      >
        {(subMode && !startWith) ? t('modeExistingModify.header.backToSub') : t('modeExistingModify.header.backToMode')}
      </Button>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ ml: 2 }}>
        <BorderColorIcon sx={{ color: '#fa7d5b' }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {t('modeExistingModify.header.title')}
          {subMode && (
            <Chip
              label={subMode === 'NL' ? t('modeExistingModify.header.subModeNl') : t('modeExistingModify.header.subModeStep')}
              size="small"
              sx={{ ml: 1, bgcolor: subMode === 'NL' ? '#fef3c7' : '#dbeafe',
                    color:   subMode === 'NL' ? '#92400e' : '#1e40af', fontWeight: 600 }}
            />
          )}
        </Typography>
      </Stack>
    </Stack>
  );

  // ─────────────────────────────────────────────────────────────────
  // Phase 0 — 서브모드 선택
  // ─────────────────────────────────────────────────────────────────
  if (!subMode) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        {Header}
        <Box sx={{ p: 4, maxWidth: 1100, mx: 'auto', flex: 1, overflow: 'auto' }}>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            {t('modeExistingModify.submode.intro')}
          </Typography>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
            <SubModeCard
              title={t('modeExistingModify.submode.nl.title')}
              subtitle={t('modeExistingModify.submode.nl.subtitle')}
              icon={ChatIcon}
              color="#f59e0b"
              description={t('modeExistingModify.submode.nl.description')}
              pros={t('modeExistingModify.submode.nl.pros', { returnObjects: true })}
              cons={t('modeExistingModify.submode.nl.cons', { returnObjects: true })}
              onClick={() => setSubMode('NL')}
            />
            <SubModeCard
              title={t('modeExistingModify.submode.step.title')}
              subtitle={t('modeExistingModify.submode.step.subtitle')}
              icon={PlaylistAddCheckIcon}
              color="#5281b3"
              description={t('modeExistingModify.submode.step.description')}
              pros={t('modeExistingModify.submode.step.pros', { returnObjects: true })}
              cons={t('modeExistingModify.submode.step.cons', { returnObjects: true })}
              onClick={() => setSubMode('STEP')}
            />
          </Stack>
        </Box>
      </Box>
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // Phase 1 — 메뉴 선택 + 소스 번들 (NL/STEP 공통)
  // ─────────────────────────────────────────────────────────────────
  const startBtnLabel = subMode === 'NL' ? t('modeExistingModify.buttons.startNl') : t('modeExistingModify.buttons.startStep');
  const startHandler  = subMode === 'NL' ? handleStartNl  : handleStartStep;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {Header}

      <Box sx={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* 좌측 메뉴 트리 */}
        <Box sx={{ width: 360, borderRight: '1px solid rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <MenuTreeBrowser onSelect={handleSelect} selectedMenuCd={selectedMenu?.id} activeTargetCd={activeTargetCd} />
        </Box>

        {/* 우측 소스 번들 프리뷰 */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {!selectedMenu ? (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
              <Box
                component="img"
                src="/t3composer-nl-modify.png"
                alt={t('modeExistingModify.rightPanel.placeholderAlt')}
                sx={{ width: '100%', maxWidth: 720, height: 'auto', opacity: 0.5, userSelect: 'none', pointerEvents: 'none' }}
              />
            </Box>
          ) : (
            <>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(0,0,0,0.08)' }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600 }}>
                      {selectedMenu.id}
                    </Typography>
                    <Chip label={selectedMenu.filePath} size="small" variant="outlined" sx={{ height: 20, fontSize: 10 }} />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    {selectedMenu.path}
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<PlayArrowIcon />}
                  onClick={startHandler}
                  disabled={starting || loadingSource || !sourceBundle}
                >
                  {starting ? t('modeExistingModify.buttons.starting') : startBtnLabel}
                </Button>
              </Stack>

              {loadingSource && (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <CircularProgress size={28} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    {t('modeExistingModify.rightPanel.loading')}
                  </Typography>
                </Box>
              )}

              {error && (
                <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
              )}

              {sourceBundle && !loadingSource && (
                <Box sx={{ flex: 1, overflow: 'auto', p: 2, minHeight: 0 }}>
                  {/* 분석 패널 — 발견된 SP/URL/Entity/GridId 빠른 진단 */}
                  <SourceBundleAnalysisPanel bundle={sourceBundle} />
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="caption" color="text.secondary">
                    {subMode === 'NL'
                      ? t('modeExistingModify.rightPanel.hintNl')
                      : t('modeExistingModify.rightPanel.hintStep')}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  {/* 섹션별 파일 목록 + Repository 의 JPA 추론 SQL 펼침 */}
                  <SourceBundlePreview bundle={sourceBundle} />
                </Box>
              )}
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────
// 서브모드 카드 (자연어 / 단계별)
// ─────────────────────────────────────────────────────────────────
function SubModeCard({ title, subtitle, icon: Icon, color, description, pros, cons, onClick }) {
  return (
    <Card
      variant="outlined"
      sx={{
        flex: 1,
        borderRadius: 3,
        borderColor: 'rgba(0,0,0,0.08)',
        transition: 'all 0.2s',
        '&:hover': {
          borderColor: color,
          boxShadow: `0 8px 24px -10px ${color}55`,
          transform: 'translateY(-4px)',
        },
      }}
    >
      <CardActionArea onClick={onClick} sx={{ height: '100%' }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
            <Box
              sx={{
                width: 44, height: 44, borderRadius: 2,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: `${color}22`, color,
              }}
            >
              <Icon />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.2 }}>{title}</Typography>
              <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
            </Box>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
            {description}
          </Typography>
          <Stack spacing={0.5} sx={{ mb: 1 }}>
            {pros.map((p, i) => (
              <Typography key={i} variant="caption" sx={{ color: 'success.main' }}>+ {p}</Typography>
            ))}
          </Stack>
          <Stack spacing={0.5}>
            {cons.map((p, i) => (
              <Typography key={i} variant="caption" sx={{ color: 'text.secondary' }}>− {p}</Typography>
            ))}
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
/**
 * 번들을 Claude 에 보낼 긴 텍스트로 직렬화.
 * 각 파일을 마커로 감싸 Claude 가 파일 경계를 인식하도록 한다.
 *
 * ★ 토큰 가드 (2026-05-27) — PLANNEL 같은 분리형 Target 은 controllers/services/repositories
 *   가 많아 통째로 넣으면 200K 토큰 한도를 쉽게 넘김 (Anthropic 400 'prompt is too long').
 *   파일당 + 전체 두 단계 cap. wizardState.js 의 formatSourceBundleForPrompt 와 동일 정책.
 */
const PER_FILE_CHAR_LIMIT_EM     = 8000;        // 파일 1개당 (≈2000 tokens)
const TOTAL_BUNDLE_CHAR_LIMIT_EM = 80000;       // 번들 전체 (≈20000 tokens)
const TRUNCATE_NOTICE_EM         = '\n\n[... 토큰 절감 위해 잘림 ...]';

function clipFileEM(content) {
  if (!content) return '';
  if (content.length <= PER_FILE_CHAR_LIMIT_EM) return content;
  return content.substring(0, PER_FILE_CHAR_LIMIT_EM) + TRUNCATE_NOTICE_EM;
}

function formatBundleForPrompt(bundle) {
  if (!bundle || typeof bundle !== 'object') return '(소스 번들 없음)';

  // collectSourceForLlm 응답은 backend.* 중첩 구조 — flat 형식도 함께 지원.
  const be = (bundle.backend && typeof bundle.backend === 'object') ? bundle.backend : bundle;
  const sections = [
    ['SCREEN',       bundle.screen                     ],
    ['COMPONENTS',   bundle.components || be.components ],
    ['CONTROLLERS',  be.controllers                    ],
    ['SERVICES',     be.services                       ],
    ['REPOSITORIES', be.repositories                   ],
    ['ENTITIES',     be.entities                       ],
    ['PROCEDURES',   be.procedures                     ],
  ];

  const out = [];
  let totalSize = 0;
  let bundleTruncated = false;
  const pushChunk = (s) => {
    if (bundleTruncated) return;
    if (totalSize + s.length > TOTAL_BUNDLE_CHAR_LIMIT_EM) {
      const remain = TOTAL_BUNDLE_CHAR_LIMIT_EM - totalSize;
      if (remain > 0) out.push(s.substring(0, remain));
      out.push(`\n\n[... sourceBundle 총량이 ${TOTAL_BUNDLE_CHAR_LIMIT_EM.toLocaleString()}자 한도 초과로 절단됨 — Claude 에 일부만 전달 ...]`);
      bundleTruncated = true;
      totalSize = TOTAL_BUNDLE_CHAR_LIMIT_EM;
      return;
    }
    out.push(s);
    totalSize += s.length;
  };

  for (const [title, data] of sections) {
    if (!data || bundleTruncated) continue;
    pushChunk(`\n=== ${title} ===`);
    if (Array.isArray(data)) {
      for (const item of data) {
        if (bundleTruncated) break;
        const path = item.path || item.fileName || item.name || 'unknown';
        const content = clipFileEM(item.content || item.source || item.body || '');
        pushChunk(`\n---FILE: ${path}---\n${content}`);
      }
    } else if (typeof data === 'object') {
      const path = data.path || data.fileName || 'unknown';
      const raw  = data.content || JSON.stringify(data, null, 2);
      pushChunk(`\n---FILE: ${path}---\n${clipFileEM(raw)}`);
    }
  }
  return out.join('\n');
}

export default ModeExistingModify;
