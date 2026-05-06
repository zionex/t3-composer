import React, { useState } from 'react';

import {
  Box,
  Button,
  TextField,
  Typography,
  Stack,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  InputAdornment,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import ArrowBackIcon  from '@mui/icons-material/ArrowBack';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SourceIcon     from '@mui/icons-material/Source';
import RefreshIcon    from '@mui/icons-material/Refresh';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

import MenuTreeBrowser from './MenuTreeBrowser';
import StepByStepWizard from './StepByStepWizard';
import { collectSourceForLlm, checkMenuExists, prefillFromSource } from './api';
import { createInitialSpecFromSource, mergeAiSpecIntoBaseSpec, analyzeSourceBundle } from './wizardState';

/**
 * 기존 화면 복사 모드 (NEW_FROM_COPY).
 *
 * 변경된 흐름 (2026-04 통합):
 *   ① 메뉴 트리에서 **복사할 원본 화면** 선택
 *   ② 원본 소스 번들 수집 (collectSourceForLlm)
 *   ③ **신규 메뉴코드 / 제목** 입력 (1줄짜리 필수 정보만)
 *   ④ "9단계 Wizard 시작" 버튼 → StepByStepWizard 진입 (mode='NEW_FROM_COPY')
 *      - sourceBundle 로부터 spec 자동 prefill (Layout / Overview)
 *      - 사용자가 9단계에서 검토·수정
 *      - Step9 Generate 버튼 → 세션 생성 + LLM 호출
 *
 * 변경 전과의 차이:
 *   - 변경 요청 텍스트는 Step9 에서 입력 (또는 Workspace 진입 후 ChatPanel 에서)
 *   - 단일 LLM 호출 → 9단계 구조화 Spec 기반 호출 (토큰 절감 + 단계별 검토 가능)
 */
function ModeNewFromCopy({ onBack }) {
  // 원본 선택 및 소스 수집
  const [selectedMenu, setSelectedMenu]   = useState(null);
  const [sourceBundle, setSourceBundle]   = useState(null);
  const [loadingSource, setLoadingSource] = useState(false);

  // 신규 화면 입력 파라미터 (필수 최소)
  const [newMenuCd, setNewMenuCd]   = useState('');
  const [newTitle, setNewTitle]     = useState('');
  const [menuCdCheck, setMenuCdCheck] = useState(null); // { ok: bool, exists: bool, msg }

  // 진입 상태
  const [error, setError]               = useState(null);
  const [wizardEntered, setWizardEntered] = useState(false);
  const [prefilledSpec, setPrefilledSpec] = useState(null);
  const [aiPrefilling, setAiPrefilling]   = useState(false);
  const [useAiPrefill, setUseAiPrefill]   = useState(true);   // 기본 ON — 사용자가 끌 수 있음
  const [aiInfo, setAiInfo]               = useState(null);   // { modelName, mergedFields[] }

  const handleSelect = async (menuNode) => {
    setSelectedMenu(menuNode);
    setSourceBundle(null);
    setError(null);
    setNewMenuCd(suggestNewMenuCd(menuNode.id));
    setNewTitle(`${menuNode.id} 복사본`);
    setMenuCdCheck(null);
    if (!menuNode.id) return;
    setLoadingSource(true);
    try {
      const res = await collectSourceForLlm(menuNode.id);
      setSourceBundle(res.data);
    } catch (e) {
      setError('소스 수집 실패: ' + (e?.response?.data?.error || e?.message || ''));
    } finally {
      setLoadingSource(false);
    }
  };

  const validateMenuCd = async () => {
    if (!newMenuCd.trim()) {
      setMenuCdCheck({ ok: false, msg: '메뉴 코드를 입력하세요' });
      return false;
    }
    if (newMenuCd === selectedMenu?.id) {
      setMenuCdCheck({ ok: false, msg: '원본과 동일한 메뉴 코드는 사용할 수 없습니다' });
      return false;
    }
    try {
      const res = await checkMenuExists(newMenuCd);
      const exists = !!res?.data?.exists;
      if (exists) {
        setMenuCdCheck({ ok: false, exists: true, msg: '이미 존재하는 메뉴 코드입니다' });
        return false;
      }
      setMenuCdCheck({ ok: true, msg: '✓ 사용 가능한 메뉴 코드입니다' });
      return true;
    } catch {
      // checkMenuExists 실패해도 Wizard 진입 후 사용자가 수정 가능하므로 진행
      setMenuCdCheck({ ok: true, msg: '(사용 가능 여부 확인 건너뜀)' });
      return true;
    }
  };

  const handleStartWizard = async () => {
    if (!selectedMenu) return;
    if (!newMenuCd.trim()) {
      setError('신규 메뉴 코드를 입력해주세요.');
      return;
    }
    setError(null);
    const valid = await validateMenuCd();
    if (!valid) return;

    // 1) 정규식 기반 baseline prefill — 항상 실행 (안전망)
    const baseSpec = createInitialSpecFromSource({
      sourceMenu: selectedMenu,
      sourceBundle,
      newMenuCd: newMenuCd.trim(),
      newTitle: newTitle.trim(),
    });
    console.info('[Composer] baseline step1.areas JSON:',
      JSON.stringify((baseSpec.step1_layout?.areas || []).map((a) => ({ id: a?.id, kind: a?.kind, title: a?.title }))));
    console.info('[Composer] baseline step4 entries JSON:',
      JSON.stringify(Object.fromEntries(Object.entries(baseSpec.step4_dataBinding || {}).map(([k, v]) => [
        k, { source: v?.source, entity: v?.entity, baseUrl: v?.baseUrl,
             spName: v?.spName, allSpNamesCount: Array.isArray(v?.allSpNames) ? v.allSpNames.length : 0 }
      ]))));

    // 2) AI prefill (선택) — sourceBundle 분석으로 더 정확한 spec 받아 깊게 병합
    let finalSpec = baseSpec;
    if (useAiPrefill) {
      setAiPrefilling(true);
      setAiInfo(null);
      try {
        const res = await prefillFromSource({
          sourceBundle,
          newMenuCd: newMenuCd.trim(),
          newTitle: newTitle.trim(),
          moduleCode: baseSpec.moduleCode,
          sourceMenuCd: selectedMenu.id,
        });
        const aiSpec = res?.data?.spec;
        if (aiSpec && typeof aiSpec === 'object') {
          console.info('[Composer] AI step1.areas JSON:',
            JSON.stringify((aiSpec.step1_layout?.areas || []).map((a) => ({ id: a?.id, kind: a?.kind, title: a?.title }))));
          console.info('[Composer] AI step4 entries JSON:',
            JSON.stringify(Object.fromEntries(Object.entries(aiSpec.step4_dataBinding || {}).map(([k, v]) => [
              k, { source: v?.source, entity: v?.entity, baseUrl: v?.baseUrl,
                   spName: v?.spName, allSpNamesCount: Array.isArray(v?.allSpNames) ? v.allSpNames.length : 0 }
            ]))));
          finalSpec = mergeAiSpecIntoBaseSpec(baseSpec, aiSpec);
          console.info('[Composer] merged step1.areas JSON:',
            JSON.stringify((finalSpec.step1_layout?.areas || []).map((a) => ({ id: a?.id, kind: a?.kind, title: a?.title }))));
          console.info('[Composer] merged step4 entries JSON:',
            JSON.stringify(Object.fromEntries(Object.entries(finalSpec.step4_dataBinding || {}).map(([k, v]) => [
              k, { source: v?.source, entity: v?.entity, baseUrl: v?.baseUrl,
                   spName: v?.spName, allSpNamesCount: Array.isArray(v?.allSpNames) ? v.allSpNames.length : 0 }
            ]))));
          setAiInfo({
            modelName: res?.data?.modelName,
            // 사용자에게 보여줄 보강된 필드 목록
            stepCount: ['step1_layout','step2_overview','step3_components','step4_dataBinding',
                        'step5_columns','step6_cascade','step7_filter','step8_filterCascade']
                       .filter((k) => aiSpec[k] && Object.keys(aiSpec[k]).length > 0).length,
          });
        }
      } catch (e) {
        // AI 실패해도 baseSpec 으로 진행 — 사용자에게 경고만
        const msg = e?.response?.data?.message || e?.message || 'AI 분석 실패';
        console.warn('[Composer] AI prefill 실패 — 정규식 결과로 진행:', msg);
        setError(`AI 분석 실패 (정규식 결과로 진행): ${msg}`);
      } finally {
        setAiPrefilling(false);
      }
    }

    setPrefilledSpec(finalSpec);
    setWizardEntered(true);
  };

  // Wizard 진입 — StepByStepWizard 에 NEW_FROM_COPY 모드로 위임
  if (wizardEntered && prefilledSpec) {
    return (
      <StepByStepWizard
        mode="NEW_FROM_COPY"
        prefilledSpec={prefilledSpec}
        sourceBundle={sourceBundle}
        initialModuleCode={prefilledSpec.moduleCode}
        onBack={() => setWizardEntered(false)}
      />
    );
  }

  const canStart = !!selectedMenu && !!sourceBundle && !loadingSource && newMenuCd.trim() && !aiPrefilling;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, bgcolor: '#eef2f7' }}>
      {/* ===== Header bar ===== */}
      <Stack direction="row" alignItems="center" sx={{
        px: 2, py: 1.2, bgcolor: '#fff', borderBottom: '1px solid #e2e8f0',
      }}>
        <Button startIcon={<ArrowBackIcon fontSize="small" />} onClick={onBack} size="small">
          모드 선택
        </Button>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ ml: 2 }}>
          <Box sx={{
            width: 32, height: 32, borderRadius: 1.5,
            bgcolor: '#10b98122', color: '#10b981',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ContentCopyIcon />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2, color: '#0f172a' }}>
              기존 화면 복사 — 9단계 Wizard
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Copy from Existing · 원본 선택 후 단계별 검토·생성
            </Typography>
          </Box>
        </Stack>
      </Stack>

      {/* ===== Body: 3 columns ===== */}
      <Box sx={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Left: menu tree */}
        <Box sx={{ width: 320, borderRight: '1px solid #e2e8f0', bgcolor: '#fff',
                   display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ px: 1.5, py: 1, borderBottom: '1px solid #e2e8f0' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#0f172a' }}>
              1. 복사할 원본 화면 선택
            </Typography>
            {selectedMenu && (
              <Chip label="선택됨" size="small" sx={{ height: 18, fontSize: 10, bgcolor: '#dcfce7', color: '#15803d' }} />
            )}
          </Stack>
          <MenuTreeBrowser onSelect={handleSelect} selectedMenuCd={selectedMenu?.id} />
        </Box>

        {/* Middle: source bundle preview */}
        <Box sx={{ flex: 1.1, borderRight: '1px solid #e2e8f0', bgcolor: '#f8fafc',
                   display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {!selectedMenu ? (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
              <Stack alignItems="center" spacing={1.5}>
                <SourceIcon sx={{ fontSize: 48, color: '#cbd5e1' }} />
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  좌측에서 복사할 원본 화면을 선택하세요.
                </Typography>
              </Stack>
            </Box>
          ) : (
            <>
              <Stack direction="row" alignItems="center" justifyContent="space-between"
                     sx={{ px: 2, py: 1.2, bgcolor: '#fff', borderBottom: '1px solid #e2e8f0' }}>
                <Box sx={{ minWidth: 0 }}>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }} noWrap>
                      {selectedMenu.id}
                    </Typography>
                    <Chip label={selectedMenu.filePath} size="small" variant="outlined"
                          sx={{ height: 18, fontSize: 10, fontFamily: 'monospace' }} />
                  </Stack>
                  <Typography variant="caption" sx={{ color: '#64748b' }} noWrap>
                    {selectedMenu.path}
                  </Typography>
                </Box>
              </Stack>

              {loadingSource && (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <CircularProgress size={28} />
                  <Typography variant="body2" sx={{ color: '#64748b', mt: 2 }}>
                    원본 소스 수집 중...
                  </Typography>
                </Box>
              )}

              {sourceBundle && !loadingSource && (
                <Box sx={{ flex: 1, overflow: 'auto', p: 2, minHeight: 0 }}>
                  {/* ── 추출 미리보기 — wizard 진입 전 사용자가 즉시 진단 ── */}
                  <SourceBundleAnalysisPanel bundle={sourceBundle} />
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    수집된 원본 소스 번들 — Wizard 9단계에 자동 prefill 됩니다
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <SourceBundlePreview bundle={sourceBundle} />
                </Box>
              )}
            </>
          )}
        </Box>

        {/* Right: new screen parameters */}
        <Box sx={{ width: 420, bgcolor: '#fff', display: 'flex', flexDirection: 'column',
                   minHeight: 0, overflow: 'auto' }}>
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{
            px: 1.8, py: 1, borderBottom: '1px solid #e2e8f0',
          }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#0f172a' }}>
              2. 신규 화면 기본 정보
            </Typography>
          </Stack>

          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {/* Original ref card */}
            {selectedMenu && (
              <Paper elevation={0} sx={{
                p: 1.2, borderRadius: 1.5, bgcolor: '#f1f5f9',
                border: '1px solid #e2e8f0',
              }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>원본</Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f172a', mt: 0.2 }}>
                  {selectedMenu.id}
                </Typography>
              </Paper>
            )}

            {/* New menu code */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', display: 'block', mb: 0.5 }}>
                신규 메뉴 코드 <span style={{ color: '#ef4444' }}>*</span>
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="예: UI_DP_MONTHLY_PLAN_V2"
                value={newMenuCd}
                onChange={(e) => { setNewMenuCd(e.target.value.toUpperCase()); setMenuCdCheck(null); }}
                InputProps={{
                  sx: { fontFamily: 'monospace', fontSize: 13, fontWeight: 600 },
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button size="small" onClick={validateMenuCd} disabled={!newMenuCd.trim()}>
                        확인
                      </Button>
                    </InputAdornment>
                  ),
                }}
              />
              {menuCdCheck && (
                <Typography variant="caption" sx={{
                  display: 'block', mt: 0.3,
                  color: menuCdCheck.ok ? '#15803d' : '#dc2626', fontWeight: 600,
                }}>
                  {menuCdCheck.msg}
                </Typography>
              )}
            </Box>

            {/* Title */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', display: 'block', mb: 0.5 }}>
                신규 화면 제목
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="예: DP 월간 계획 V2"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </Box>

            <Alert severity="info" sx={{ bgcolor: '#f0f9ff' }}>
              상세한 변경 사항(컬럼 추가·검색조건 변경 등)은 9단계 Wizard 의 각 Step 에서 입력합니다.
              자유 텍스트 형태의 추가 요청은 마지막 단계(Step 9 — 생성) 에서 입력 가능합니다.
            </Alert>

            {/* AI 자동 분석 옵션 — sourceBundle 을 LLM 으로 분석해 9단계 spec 정확히 prefill */}
            <Paper variant="outlined" sx={{ p: 1.5, bgcolor: '#fdf4ff', borderColor: '#a855f7' }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <AutoAwesomeIcon fontSize="small" sx={{ color: '#a855f7' }} />
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={useAiPrefill}
                      onChange={(e) => setUseAiPrefill(e.target.checked)}
                      disabled={aiPrefilling}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#7e22ce' }}>
                        AI 자동 분석으로 9단계 prefill (권장)
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Layer 별 SP (조회/CUD), FilterBar, 컴포넌트, Entity 까지 정확히 추출.
                        OFF 면 정규식 분석만 사용.
                      </Typography>
                    </Box>
                  }
                  sx={{ flex: 1, mr: 0 }}
                />
              </Stack>
              {aiPrefilling && (
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                  <CircularProgress size={16} sx={{ color: '#a855f7' }} />
                  <Typography variant="caption" color="text.secondary">
                    Claude 가 sourceBundle 을 분석 중입니다 (5~15초)...
                  </Typography>
                </Stack>
              )}
              {aiInfo && !aiPrefilling && (
                <Typography variant="caption" sx={{ color: '#16a34a', mt: 0.5, display: 'block' }}>
                  ✓ AI 분석 완료 — {aiInfo.modelName} · {aiInfo.stepCount}/8 단계 보강됨
                </Typography>
              )}
            </Paper>

            {error && <Alert severity="error">{error}</Alert>}
            {!selectedMenu && (
              <Alert severity="warning" sx={{ bgcolor: '#fefce8' }}>
                먼저 좌측에서 복사할 원본 화면을 선택하세요.
              </Alert>
            )}

            <Divider />

            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => {
                  setNewMenuCd(selectedMenu ? suggestNewMenuCd(selectedMenu.id) : '');
                  setNewTitle(selectedMenu ? `${selectedMenu.id} 복사본` : '');
                  setMenuCdCheck(null);
                }}
                disabled={!selectedMenu}
              >
                초기화
              </Button>
              <Button
                variant="contained"
                endIcon={aiPrefilling ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <ArrowForwardIcon />}
                onClick={handleStartWizard}
                disabled={!canStart}
                sx={{
                  flex: 1,
                  bgcolor: '#10b981',
                  fontWeight: 700,
                  '&:hover': { bgcolor: '#059669' },
                }}
              >
                {aiPrefilling ? 'AI 분석 중...' : (useAiPrefill ? 'AI 분석 + 9단계 Wizard' : '다음 — 9단계 Wizard')}
              </Button>
            </Stack>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

/**
 * 원본 메뉴 코드에서 신규 메뉴 코드를 추천 생성.
 * 규칙: 끝이 숫자면 +1, 아니면 _V2 접미사.
 */
function suggestNewMenuCd(origCd) {
  if (!origCd) return '';
  const m = /^(.*?)(\d+)$/.exec(origCd);
  if (m) {
    const next = (parseInt(m[2], 10) + 1).toString().padStart(m[2].length, '0');
    return `${m[1]}${next}`;
  }
  return `${origCd}_V2`;
}

function SourceBundlePreview({ bundle }) {
  if (!bundle || typeof bundle !== 'object') return null;
  const sections = [
    { key: 'screen',       title: 'SCREEN',       color: '#2563eb' },
    { key: 'components',   title: 'COMPONENTS',   color: '#0891b2' },
    { key: 'controllers',  title: 'CONTROLLERS',  color: '#7c3aed' },
    { key: 'services',     title: 'SERVICES',     color: '#c026d3' },
    { key: 'repositories', title: 'REPOSITORIES', color: '#db2777' },
    { key: 'entities',     title: 'ENTITIES',     color: '#ea580c' },
    { key: 'procedures',   title: 'PROCEDURES',   color: '#ca8a04' },
  ];
  return (
    <Stack spacing={1}>
      {sections.map(({ key, title, color }) => {
        const data = bundle[key];
        if (!data) return null;
        const count = Array.isArray(data) ? data.length : 1;
        return (
          <Paper key={key} elevation={0}
                 sx={{ p: 1.2, border: `1px solid ${color}33`, borderLeft: `3px solid ${color}`,
                       borderRadius: 1, bgcolor: '#fff' }}>
            <Stack direction="row" alignItems="center" spacing={0.6} sx={{ mb: 0.3 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color, fontFamily: 'monospace' }}>
                {title}
              </Typography>
              <Chip label={count} size="small"
                    sx={{ height: 16, fontSize: 10, bgcolor: `${color}22`, color, fontWeight: 700 }} />
            </Stack>
            {Array.isArray(data) ? (
              <Stack spacing={0.2}>
                {data.slice(0, 8).map((item, i) => (
                  <Typography key={i} variant="caption"
                              sx={{ fontFamily: 'monospace', fontSize: 10, color: '#475569' }}>
                    {item.path || item.name || item.fileName || JSON.stringify(item).slice(0, 90)}
                  </Typography>
                ))}
                {data.length > 8 && (
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                    ... 외 {data.length - 8}건
                  </Typography>
                )}
              </Stack>
            ) : (
              <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: 10 }}>
                {typeof data === 'string' ? data.slice(0, 180) : JSON.stringify(data).slice(0, 180)}
              </Typography>
            )}
          </Paper>
        );
      })}
    </Stack>
  );
}

/**
 * sourceBundle 분석 미리보기 — wizard 진입 전 사용자가 즉시 무엇이 잡혔는지 확인.
 *   · 발견된 SP (CRUD 분류 포함) chip
 *   · 발견된 zAxios URL chip
 *   · 발견된 Entity / BaseGrid id chip
 *   · 아무것도 안 잡혔으면 sourceBundle 의 각 섹션 항목수/길이 dump (디버깅)
 */
function SourceBundleAnalysisPanel({ bundle }) {
  const analysis = React.useMemo(() => analyzeSourceBundle(bundle), [bundle]);
  const { sps, spsCrud, urls, entities, gridIds, serviceIds, serviceIdToSp, sections, hasAny } = analysis;

  return (
    <Paper variant="outlined" sx={{
      p: 1.5, mb: 1, borderRadius: 2,
      borderColor: hasAny ? '#10b981' : '#f59e0b',
      bgcolor: hasAny ? '#f0fdf4' : '#fffbeb',
    }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <SourceIcon fontSize="small" sx={{ color: hasAny ? '#16a34a' : '#d97706' }} />
        <Typography variant="caption" sx={{ fontWeight: 700, color: hasAny ? '#15803d' : '#92400e' }}>
          {hasAny ? '✓ sourceBundle 분석 완료 — wizard 에 자동 prefill 됩니다'
                  : '⚠ sourceBundle 에서 SP/URL 을 못 찾았습니다 — 아래 섹션 정보 확인'}
        </Typography>
      </Stack>

      {sps.length > 0 && (
        <Box sx={{ mb: 1 }}>
          <Typography variant="caption" sx={{ display: 'block', color: '#15803d', fontWeight: 600 }}>
            🔧 발견된 SP ({sps.length}) — CRUD 자동 분류:
          </Typography>
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.3 }}>
            {spsCrud.read   && <Chip size="small" label={`R: ${spsCrud.read}`}   sx={{ fontFamily: 'monospace', fontSize: 11, bgcolor: '#dbeafe', color: '#1e40af' }} />}
            {spsCrud.create && <Chip size="small" label={`C: ${spsCrud.create}`} sx={{ fontFamily: 'monospace', fontSize: 11, bgcolor: '#dcfce7', color: '#166534' }} />}
            {spsCrud.update && <Chip size="small" label={`U: ${spsCrud.update}`} sx={{ fontFamily: 'monospace', fontSize: 11, bgcolor: '#fef3c7', color: '#92400e' }} />}
            {spsCrud.delete && <Chip size="small" label={`D: ${spsCrud.delete}`} sx={{ fontFamily: 'monospace', fontSize: 11, bgcolor: '#fee2e2', color: '#991b1b' }} />}
          </Stack>
          {sps.length > Object.values(spsCrud).filter(Boolean).length && (
            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#64748b' }}>
              전체 SP: {sps.join(', ')}
            </Typography>
          )}
        </Box>
      )}

      {Array.isArray(serviceIds) && serviceIds.length > 0 && (
        <Box sx={{ mb: 1 }}>
          <Typography variant="caption" sx={{ display: 'block', color: '#15803d', fontWeight: 600 }}>
            ⚙️ 발견된 callService SERVICE ID ({serviceIds.length}) — service.xml 의 &lt;service id&gt;:
          </Typography>
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.3 }}>
            {serviceIds.map((sid) => {
              const sp = serviceIdToSp && serviceIdToSp[sid];
              return (
                <Chip
                  key={sid} size="small"
                  label={sp ? `${sid} → ${sp}` : `${sid} (SP 매핑 ↻ service.xml 필요)`}
                  sx={{ fontFamily: 'monospace', fontSize: 11,
                        bgcolor: sp ? '#dbeafe' : '#fef3c7',
                        color: sp ? '#1e40af' : '#92400e' }}
                />
              );
            })}
          </Stack>
        </Box>
      )}

      {urls.length > 0 && (
        <Box sx={{ mb: 1 }}>
          <Typography variant="caption" sx={{ display: 'block', color: '#15803d', fontWeight: 600 }}>
            🌐 발견된 zAxios URL ({urls.length}):
          </Typography>
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.3 }}>
            {urls.map((u) => (
              <Chip key={u} size="small" label={u}
                    sx={{ fontFamily: 'monospace', fontSize: 11, bgcolor: '#e0e7ff', color: '#3730a3' }} />
            ))}
          </Stack>
        </Box>
      )}

      {entities.length > 0 && (
        <Box sx={{ mb: 1 }}>
          <Typography variant="caption" sx={{ color: '#475569' }}>
            📦 Entity: <b>{entities.join(', ')}</b>
            {gridIds.length > 0 && <> · 🔲 BaseGrid id: <b>{gridIds.join(', ')}</b></>}
          </Typography>
        </Box>
      )}

      {/* 발견 안 됐을 때 — sourceBundle 의 각 섹션 정보 표시 (진단 도움) */}
      {!hasAny && (
        <Box sx={{ mt: 1, p: 1, bgcolor: '#fef9c3', borderRadius: 1 }}>
          <Typography variant="caption" sx={{ display: 'block', color: '#92400e', fontWeight: 600, mb: 0.5 }}>
            sourceBundle 섹션 별 데이터:
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', fontFamily: 'monospace', fontSize: 10.5, color: '#713f12' }}>
            screen.source     : {sections.screenLen.toLocaleString()} chars{sections.screenLen === 0 && '  ⚠ 비어있음'}<br/>
            frontendSources   : {sections.frontendSources} files<br/>
            backend.controllers : {sections.controllers} · services: {sections.services} · repositories: {sections.repositories}<br/>
            backend.entities    : {sections.entities} · procedures: {sections.procedures}<br/>
            frontendProcedures: {sections.frontendProcedures} · apiCalls: {sections.apiCalls}
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', mt: 0.8, color: '#92400e' }}>
            💡 위 값이 모두 0 이면 백엔드 sourceBundle 수집 실패. 메뉴를 다시 선택하거나 wingui 재시작 후 시도하세요.
            <br/>screen.source 만 있고 다른 항목이 0 이면 화면이 SP 를 직접 호출하지 않거나 callService 가 다른 모듈에서 import 됨.
          </Typography>
        </Box>
      )}
    </Paper>
  );
}

export default ModeNewFromCopy;
