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
import ComposerWizard from './ComposerWizard';
import { SourceBundleAnalysisPanel, SourceBundlePreview } from './SourceBundleSection';
import { collectSourceForLlm, checkMenuExists, prefillFromSource } from './api';
import {
  createInitialSpecFromSource,
  mergeAiSpecIntoBaseSpec,
  convertStep9SpecToWizardSpec,
} from './wizardState';
import { useTargetStore } from './targetStore';

/**
 * 기존 화면 복사 모드 (NEW_FROM_COPY).
 *
 * 변경된 흐름 (2026-04 통합):
 *   ① 메뉴 트리에서 **복사할 원본 화면** 선택
 *   ② 원본 소스 번들 수집 (collectSourceForLlm)
 *   ③ **신규 메뉴코드 / 제목** 입력 (1줄짜리 필수 정보만)
 *   ④ "4단계 Wizard 시작" 버튼 → ComposerWizard 진입 (mode='NEW_FROM_COPY')
 *      - sourceBundle 로부터 spec 자동 prefill (CANVAS / DATA / META 단계 데이터)
 *      - 사용자가 4단계 (CANVAS → DATA → META → GENERATE) 에서 검토·수정
 *      - GENERATE 단계의 생성 버튼 → 세션 생성 + LLM 호출
 *      - prefilledSpec 은 9-step 형식이지만 ComposerWizard 진입 직전 convertStep9SpecToWizardSpec 로 변환
 *
 * 변경 전과의 차이:
 *   - 변경 요청 텍스트는 Step9 에서 입력 (또는 Workspace 진입 후 ChatPanel 에서)
 *   - 단일 LLM 호출 → 4단계 구조화 Spec 기반 호출 (토큰 절감 + 단계별 검토 가능)
 */
function ModeNewFromCopy({ onBack }) {
  // 활성 Target System (운영 DB 직접 조회용)
  const activeTargetCd = useTargetStore((s) => s.currentTargetCd);

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
    // 1단계 — sync 즉시 표시 (UI 가 비어있지 않게)
    setNewMenuCd(suggestNewMenuCd(menuNode.id));
    setNewTitle(`${menuNode.id} 복사본`);
    setMenuCdCheck(null);
    if (!menuNode.id) return;
    // 2단계 — async 로 운영 DB collision 회피한 next available 코드 검색 (parallel with source)
    //         activeTargetCd 전달 — checkMenuExists 가 운영 wingui DB (MSSQL) 검사 (composer-db 폴백 X)
    findNextAvailableMenuCd(menuNode.id, activeTargetCd).then((avail) => {
      if (avail) setNewMenuCd(avail);
    }).catch(() => {});
    setLoadingSource(true);
    try {
      const res = await collectSourceForLlm(menuNode.id, activeTargetCd);
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
      const res = await checkMenuExists(newMenuCd, activeTargetCd);
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

  // Wizard 진입 — ComposerWizard (4-step) 에 NEW_FROM_COPY 모드로 위임.
  //   prefilledSpec (9-step) 을 convertStep9SpecToWizardSpec 로 4-step 변환.
  //   _originStep9 가 sourceBundle/sourceMenu 등 mode 메타 보존하므로 별도 prop 불필요 —
  //   specToInitialPrompt 가 spec._originStep9 에서 직접 가져와 prompt prepend.
  if (wizardEntered && prefilledSpec) {
    return (
      <ComposerWizard
        initialSpec={convertStep9SpecToWizardSpec(prefilledSpec)}
        mode="NEW_FROM_COPY"
        targetCd={activeTargetCd}
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
              기존 화면 복사 — 4단계 Wizard
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
          <MenuTreeBrowser onSelect={handleSelect} selectedMenuCd={selectedMenu?.id} activeTargetCd={activeTargetCd} />
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
                    수집된 원본 소스 번들 — Wizard 4단계에 자동 prefill 됩니다
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
              상세한 변경 사항(컬럼 추가·검색조건 변경 등)은 4단계 Wizard
              (① Canvas / ② 데이터·검색조건 / ③ 메타·메뉴 / ④ 화면 생성) 의 각 단계에서 입력합니다.
              자유 텍스트 형태의 추가 요청은 마지막 단계(④ 화면 생성) 에서 입력 가능합니다.
            </Alert>

            {/* AI 자동 분석 옵션 — sourceBundle 을 LLM 으로 분석해 4단계 spec 정확히 prefill */}
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
                        AI 자동 분석으로 4단계 prefill (권장)
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
                {aiPrefilling ? 'AI 분석 중...' : (useAiPrefill ? 'AI 분석 + 4단계 Wizard' : '다음 — 4단계 Wizard')}
              </Button>
            </Stack>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

/**
 * 원본 메뉴 코드에서 신규 메뉴 코드를 추천 생성 (동기 — 즉시 표시용).
 * 규칙: 끝이 숫자면 +1, 아니면 _COPY 접미사.
 *
 * ★ 운영 DB 에 이미 그 코드가 있을 수 있음 (예: UI_AD_01 → UI_AD_02 인데 02 도
 *   기존 화면) — async 로 next available 찾는 건 findNextAvailableMenuCd 별도.
 */
function suggestNewMenuCd(origCd) {
  if (!origCd) return '';
  const m = /^(.*?)(\d+)$/.exec(origCd);
  if (m) {
    const next = (parseInt(m[2], 10) + 1).toString().padStart(m[2].length, '0');
    return `${m[1]}${next}`;
  }
  return `${origCd}_COPY`;
}

/**
 * 원본 메뉴 코드 → 운영 DB 에서 collision 안 나는 첫 번째 빈 코드 검색 (async).
 * 끝이 숫자면 +1, +2, ... 최대 100회 시도. 그래도 못 찾으면 _COPY suffix.
 * 끝이 숫자가 아니면 _COPY 후 collision 시 _COPY2, _COPY3 ...
 */
async function findNextAvailableMenuCd(origCd, targetCd) {
  if (!origCd) return '';
  const m = /^(.*?)(\d+)$/.exec(origCd);
  const tryCheck = async (candidate) => {
    try {
      const r = await checkMenuExists(candidate, targetCd);
      return !r?.data?.exists;
    } catch (_e) {
      return true;  // 검사 실패해도 후보 사용 — Wizard 에서 사용자 검증
    }
  };
  if (m) {
    const prefix = m[1];
    const width  = m[2].length;
    const start  = parseInt(m[2], 10);
    for (let i = 1; i <= 100; i++) {
      const candidate = `${prefix}${(start + i).toString().padStart(width, '0')}`;
      // eslint-disable-next-line no-await-in-loop
      if (await tryCheck(candidate)) return candidate;
    }
  } else {
    for (let i = 1; i <= 10; i++) {
      const candidate = i === 1 ? `${origCd}_COPY` : `${origCd}_COPY${i}`;
      // eslint-disable-next-line no-await-in-loop
      if (await tryCheck(candidate)) return candidate;
    }
  }
  return `${origCd}_COPY_${Date.now().toString(36).slice(-4).toUpperCase()}`;
}
export default ModeNewFromCopy;
