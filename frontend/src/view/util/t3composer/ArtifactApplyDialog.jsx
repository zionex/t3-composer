// ContentInner: Dialog sub-component 이므로 ContentInner 래퍼 불필요 (Workspace 안에서 호출)
import React, { useEffect, useRef, useState } from 'react';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Chip,
  Paper,
  Alert,
  AlertTitle,
  CircularProgress,
  Box,
  FormControlLabel,
  Checkbox,
  Snackbar,
} from '@mui/material';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import StorageIcon from '@mui/icons-material/Storage';
import CodeIcon from '@mui/icons-material/Code';
import DescriptionIcon from '@mui/icons-material/Description';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

import {
  listArtifacts, applyArtifacts, preflightArtifacts,
  applyPreview, confirmPreview, cancelPreview,
} from './api';

// 미리보기(=화면 실행) UI 표시 여부. ComposerWorkspace 의 동명 상수와 동기.
//   2026-05-27 사용자 요청 — 산출물 실행 다이얼로그 안의 "미리보기 (docker 안에서 검증)" Paper
//   블록 통째 숨김. backend `applyPreview`/`confirmPreview`/`cancelPreview` 는 그대로 보존.
const SHOW_PREVIEW_UI = true;

/**
 * 산출물 실행 다이얼로그 — MenuRegistrationDialog 와 분리.
 * MENU_SQL 은 메뉴 등록 다이얼로그 전용이므로 여기선 제외.
 *
 * 적용 대상:
 *   · SCREEN_JSX / JAVA_ENTITY / JAVA_SERVICE / JAVA_CONTROLLER / JAVA_REPOSITORY → 파일 저장
 *   · FRONTEND_JS_MODULE (PlanNEL services/redux/utils/hooks 등) → 파일 저장
 *   · MENU_JS (PlanNEL TabMenuList 항목) → 파일 저장
 *   · MYBATIS_MAPPER_XML (PlanNEL Mapper XML) → 파일 저장
 *   · SQL_DDL → CREATE TABLE 실행 (옵션)
 *   · SQL_SP → CREATE OR ALTER PROCEDURE 실행 (옵션)
 *   · MENUS_JS_PATCH → menus.js 패치 (선택)
 */
function ArtifactApplyDialog({ open, sessionId, onClose }) {
  const [artifacts, setArtifacts] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [applying, setApplying]   = useState(false);
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState(null);
  // 사전 검증 (preflight) — dialog open 시 자동 호출. 자동 보정된 항목 목록.
  const [preflighting, setPreflighting] = useState(false);
  const [preflight, setPreflight]       = useState(null);
  // 즉시 피드백 — 적용 직후 사용자가 결과를 놓치지 않도록 화면 상단 중앙에 토스트.
  const [snackbar, setSnackbar] = useState({ open: false, severity: 'success', title: '', message: '' });
  // 결과 패널로 자동 스크롤하기 위한 ref
  const resultRef = useRef(null);
  const [opts, setOpts] = useState({
    // ★ 자동적용 — 다이얼로그 상단 체크박스. default false (안전장치).
    //   비개발자(컨설턴트) 사용자가 실수로 파일/DB 가 변경되지 않도록 명시적 opt-in 필요.
    autoApply: false,
    applyFiles: true, executeDdl: true, executeSp: true, overwrite: false,
  });
  // Phase 2a — Preview (docker 검증) 상태
  const [previewBusy, setPreviewBusy] = useState(null);   // 'apply' | 'confirm' | 'cancel' | null
  const [previewResult, setPreviewResult] = useState(null);
  // 진행 단계: { phase: 'compiling' | 'restarting' | 'ready' | 'failed', message, elapsedMs }
  const [autoOpen, setAutoOpen] = useState(null);
  const autoOpenAbortRef = useRef(false);

  useEffect(() => {
    if (!open || !sessionId) return;
    reset();
    loadArtifactsAndPreflight();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sessionId]);

  const reset = () => {
    setArtifacts([]);
    setApplying(false);
    setResult(null);
    setError(null);
    setPreflight(null);
    setOpts({ autoApply: false, applyFiles: true, executeDdl: true, executeSp: true, overwrite: false });
    setPreviewResult(null);
    setPreviewBusy(null);
    setAutoOpen(null);
    autoOpenAbortRef.current = false;
  };

  const loadArtifactsAndPreflight = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1) 사전 검증 — 자동 보정 (DB 까지 갱신) 후 보정 결과 받음
      setPreflighting(true);
      try {
        const pf = await preflightArtifacts(sessionId);
        setPreflight(pf?.data || null);
      } catch (e) {
        // preflight 실패해도 apply 자체는 가능 (apply 도 내부적으로 normalize 수행)
        console.warn('[Composer] preflight 실패 — apply 시 자동 보정에 의존:', e?.message);
      } finally {
        setPreflighting(false);
      }

      // 2) 산출물 목록 — preflight 가 content 를 갱신했으므로 목록 조회는 그 후
      const res = await listArtifacts(sessionId);
      const all = Array.isArray(res.data) ? res.data : [];
      setArtifacts(all.filter((a) => a.artifactType !== 'MENU_SQL'));
    } catch (e) {
      setError('산출물 목록 조회 실패: ' + (e?.message || ''));
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------
  // Phase 2a — Preview handlers (docker 컨테이너 안에서 검증)
  // -------------------------------------------------------------------

  const handlePreviewApply = async () => {
    setPreviewBusy('apply');
    setAutoOpen(null);
    autoOpenAbortRef.current = false;
    try {
      const res = await applyPreview(sessionId);
      const r = res?.data || {};
      setPreviewResult(r);
      const sid8 = r.sid8 || '????????';
      if (!r.success) {
        setSnackbar({
          open: true, severity: 'error',
          title: '미리보기 적용 실패',
          message: `❌ ${r.error || 'JSX/SQL/MENU 처리 중 오류 — 결과 패널 확인'}`,
        });
        return;
      }
      const skipped = r.skipped || 0;
      setSnackbar({
        open: true, severity: 'success',
        title: '화면 실행 준비 완료',
        message: skipped > 0
          ? `✅ JSX ${r.jsxOk}건 적용 · 나머지 ${skipped}건 (Java/SQL/MENU 등) 은 [화면 실행] 대상 외. PV ${sid8}`
          : `✅ JSX ${r.jsxOk}건 적용. PV ${sid8}`,
      });
      // 자동 진입 — preview 첫 jsx 화면을 새 창으로 (mvn compile 없음 → 즉시)
      const targetUrl = Array.isArray(r.previewLinks) && r.previewLinks.length > 0 ? r.previewLinks[0].url : null;
      if (targetUrl) {
        await runAutoOpen(targetUrl, false);
      }
    } catch (e) {
      const data = e?.response?.data || {};
      setPreviewResult({ success: false, error: data.error || data.message || e?.message });
      setSnackbar({
        open: true, severity: 'error',
        title: '미리보기 통신 오류',
        message: `❌ ${data.error || data.message || e?.message || '서버 응답 없음'}`,
      });
    } finally {
      setPreviewBusy(null);
    }
  };

  /**
   * 진행 단계:
   *   - hasJava=false: 즉시 화면 진입
   *   - hasJava=true:
   *       1) compiling — mvn compile 진행 (약 30~60초). backend health 는 200 유지
   *       2) restarting — DevTools 가 trigger-file 감지해 backend 재기동 (10~20초). health 503/error
   *       3) ready — health 회복 → window.open
   *       4) failed — 120초 timeout
   */
  const runAutoOpen = async (targetUrl, hasJava) => {
    if (!hasJava) {
      setAutoOpen({ phase: 'ready', message: '화면 진입', targetUrl, elapsedMs: 0 });
      setTimeout(() => {
        if (!autoOpenAbortRef.current) window.open(targetUrl, '_blank', 'noopener');
      }, 600);
      return;
    }

    const start = Date.now();
    setAutoOpen({ phase: 'compiling', message: 'Java 산출물 mvn compile 진행 중...', targetUrl, elapsedMs: 0 });

    let sawDown = false;
    const maxWait = 120000;
    while (!autoOpenAbortRef.current && (Date.now() - start) < maxWait) {
      await new Promise((resolve) => setTimeout(resolve, 2500));
      if (autoOpenAbortRef.current) return;
      const elapsed = Date.now() - start;
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 2000);
        const resp = await fetch('/actuator/health', { method: 'GET', signal: ctrl.signal });
        clearTimeout(timer);
        if (resp.ok) {
          if (sawDown) {
            // 재기동 후 회복
            setAutoOpen({ phase: 'ready', message: 'backend 재기동 완료 — 화면 진입', targetUrl, elapsedMs: elapsed });
            setTimeout(() => {
              if (!autoOpenAbortRef.current) window.open(targetUrl, '_blank', 'noopener');
            }, 800);
            return;
          }
          // 아직 mvn 진행 중 (또는 시작 직후)
          setAutoOpen({ phase: 'compiling', message: 'Java 산출물 mvn compile 진행 중... DevTools 트리거 대기', targetUrl, elapsedMs: elapsed });
        } else {
          sawDown = true;
          setAutoOpen({ phase: 'restarting', message: 'mvn 완료 — DevTools 가 backend 재기동 중...', targetUrl, elapsedMs: elapsed });
        }
      } catch {
        sawDown = true;
        setAutoOpen({ phase: 'restarting', message: 'mvn 완료 — DevTools 가 backend 재기동 중 (connection refused)...', targetUrl, elapsedMs: elapsed });
      }
    }
    if (!autoOpenAbortRef.current) {
      setAutoOpen({ phase: 'failed', message: '대기 시간 초과(120초). 위 [▶ 화면명] 버튼으로 직접 진입하세요.', targetUrl, elapsedMs: Date.now() - start });
    }
  };

  const handlePreviewCancel = async () => {
    autoOpenAbortRef.current = true;
    setAutoOpen(null);
    setPreviewBusy('cancel');
    try {
      const res = await cancelPreview(sessionId);
      const r = res?.data || {};
      setPreviewResult(null);
      setSnackbar({
        open: true, severity: 'info',
        title: '미리보기 취소',
        message: `🗑 preview 폴더 삭제 + DB ${r.dbRowsDeleted ?? 0}건 정리`,
      });
    } catch (e) {
      const data = e?.response?.data || {};
      setSnackbar({
        open: true, severity: 'error',
        title: '미리보기 취소 실패',
        message: `❌ ${data.error || data.message || e?.message}`,
      });
    } finally {
      setPreviewBusy(null);
    }
  };

  const handleApply = async () => {
    setApplying(true);
    setResult(null);
    try {
      const res = await applyArtifacts(sessionId, opts);
      const r = res?.data || {};
      setResult(r);
      setSnackbar(buildSnackbarFromResult(r));
    } catch (e) {
      const data = e?.response?.data;
      const fallback = { success: false, error: e?.message || '적용 실패' };
      const r = data || fallback;
      setResult(r);
      setSnackbar({
        open: true,
        severity: 'error',
        title: '실행 실패',
        message: `❌ ${e?.response?.status ? '[HTTP ' + e.response.status + '] ' : ''}${r.error || e?.message || '통신 오류'}`,
      });
    } finally {
      setApplying(false);
    }
  };

  // result 가 set 되면 결과 패널로 부드럽게 자동 스크롤
  useEffect(() => {
    if (result && resultRef.current) {
      try {
        resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch (_) { /* no-op */ }
    }
  }, [result]);

  // 응답을 사용자 친화적 Snackbar 메시지로 변환
  const buildSnackbarFromResult = (r) => {
    if (!r) return { open: true, severity: 'warning', title: '결과 없음', message: '서버 응답이 비어있습니다.' };
    if (r.policyBlocked) {
      return {
        open: true, severity: 'error',
        title: '정책 차단',
        message: `⚠️ wingui 네이티브 정책 위반 (${(r.policyViolations || []).length}건). 다이얼로그 상단 안내 확인.`,
      };
    }
    if (r.autoApplyDisabled) {
      return {
        open: true, severity: 'info',
        title: '자동 적용 비활성 (서버 정책)',
        message: 'ℹ️ 서버에서 자동 적용이 비활성화되어 있어 파일/DB 변경이 일어나지 않았습니다. 관리자에게 활성화를 요청하세요.',
      };
    }
    // control-plane (재빌드/재컴파일) 안내 문구 합성
    const cp = r.controlPlane;
    let cpSuffix = '';
    if (cp) {
      if (cp.triggered) {
        cpSuffix = ' · 재빌드/재컴파일 백그라운드 실행 (log 확인)';
      } else {
        cpSuffix = ' · 재빌드/재기동은 수동 수행 필요';
      }
    }
    if (r.success) {
      const fileOk = r.fileOk || 0;
      const ddlOk  = r.ddlOk  || 0;
      const spOk   = r.spOk   || 0;
      const fixCount = r.preflight?.totalFixCount || 0;
      const parts = [];
      if (fileOk > 0) parts.push(`파일 ${fileOk}건`);
      if (ddlOk  > 0) parts.push(`DDL ${ddlOk}건`);
      if (spOk   > 0) parts.push(`SP ${spOk}건`);
      const summary = parts.length > 0 ? parts.join(' · ') + ' 적용' : '적용 항목 없음';
      const fixSuffix = fixCount > 0 ? ` (사전 보정 ${fixCount}건)` : '';
      return {
        open: true, severity: 'success',
        title: '실행 완료',
        message: `✅ ${summary}${fixSuffix}${cpSuffix}`,
      };
    }
    // 일부 실패
    const reasons = [];
    if (r.fileFail > 0) reasons.push(`파일 ${r.fileFail}건 실패`);
    if (r.ddlFail  > 0) reasons.push(`DDL ${r.ddlFail}건 실패`);
    if (r.spFail   > 0) reasons.push(`SP ${r.spFail}건 실패`);
    const summary = reasons.length > 0 ? reasons.join(' · ')
                  : (r.error || '원인 불명 — 상세는 결과 패널 확인');
    return {
      open: true, severity: 'error',
      title: '실행 실패',
      message: `❌ ${summary}${cpSuffix}`,
    };
  };

  const fileItems = artifacts.filter((a) =>
    [
      'SCREEN_JSX', 'JAVA_ENTITY', 'JAVA_SERVICE', 'JAVA_CONTROLLER', 'JAVA_REPOSITORY', 'MENUS_JS_PATCH',
      // PlanNEL 추가 산출물 타입
      'FRONTEND_JS_MODULE', 'MENU_JS', 'MYBATIS_MAPPER_XML',
    ].includes(a.artifactType));
  const ddlItems = artifacts.filter((a) => a.artifactType === 'SQL_DDL');
  const spItems  = artifacts.filter((a) => a.artifactType === 'SQL_SP');

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <RocketLaunchIcon color="secondary" />
          <Typography variant="h6" component="span">산출물 실행</Typography>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        {/* ===== 상단: 자동적용 체크박스 (default OFF · 비개발자 안전장치) ===== */}
        <Paper variant="outlined"
               sx={{ p: 1.5, mb: 2, borderRadius: 2,
                     borderColor: opts.autoApply ? 'warning.main' : 'divider',
                     bgcolor: opts.autoApply ? 'warning.lighter' : 'grey.50' }}>
          <FormControlLabel
            control={
              <Checkbox
                size="medium"
                checked={opts.autoApply}
                onChange={(e) => setOpts((o) => ({ ...o, autoApply: e.target.checked }))}
                color="warning"
              />
            }
            label={
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700,
                            color: opts.autoApply ? 'warning.dark' : 'text.primary' }}>
                  자동적용 (재빌드 / 재컴파일 · npm run build + mvn compile)
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  파일 저장 / DDL / SP 실행은 항상 수행됩니다. 이 옵션은 그 다음 단계인
                  <b> wingui 재빌드 (npm run build)</b>와 <b>백엔드 재컴파일 (mvn compile)</b>을
                  서버가 자동으로 트리거할지 결정합니다. 체크 안 하면 사용자가 수동으로 재빌드/재기동해야 합니다.
                </Typography>
              </Box>
            }
          />
        </Paper>

        {/* ===== Phase 2a — Preview (docker 컨테이너에서 검증) =====
            SHOW_PREVIEW_UI=false 면 Paper 블록 통째 렌더 안 함 (2026-05-27 사용자 요청). */}
        {SHOW_PREVIEW_UI && (
        <Paper variant="outlined" sx={{
          p: 1.8, mb: 2, borderRadius: 2,
          borderColor: previewResult?.success ? 'info.main' : 'divider',
          bgcolor: previewResult?.success ? 'info.lighter' : 'grey.50',
        }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.8 }}>
            <VisibilityIcon fontSize="small" color="info" />
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              미리보기 (docker 안에서 검증)
            </Typography>
            {previewResult?.success && (
              <Chip size="small" color="info" label={`PV ${previewResult.sid8}`} sx={{ fontSize: 10, height: 18 }} />
            )}
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.2 }}>
            산출물 frontend 파일을 _preview/ 폴더에 복사해 webpack-dev-server 가 곧바로 렌더합니다.
            API 호출은 mock 응답으로 처리되어 Grid/Chart 가 sample 데이터로 표시됩니다.
            Backend (Java/SQL/MENU) 는 [화면 실행] 시 반영되지 않으며 [정식 적용] 시점에만 처리됩니다.
          </Typography>
          {previewResult && (
            <Alert
              severity={previewResult.success ? 'success' : 'error'}
              sx={{ mb: 1, py: 0.5 }}
            >
              {previewResult.success ? (
                <Typography variant="caption" component="div">
                  ✓ frontend 파일 {previewResult.jsxOk}건 적용
                  {previewResult.skipped > 0 && (
                    <Box component="span" sx={{ ml: 1, color: 'text.secondary' }}>
                      · 그 외 {previewResult.skipped}건 (Java/SQL/MENU) 은 화면 실행 대상 외
                    </Box>
                  )}
                  <Box component="span" sx={{ display: 'block', mt: 0.3 }}>
                    {previewResult.note}
                  </Box>

                  {/* 자동 진입 진행 단계 */}
                  {autoOpen && (
                    <Box sx={{
                      mt: 1, p: 1, borderRadius: 1,
                      bgcolor: autoOpen.phase === 'ready' ? 'rgba(16,185,129,0.10)'
                              : autoOpen.phase === 'failed' ? 'rgba(239,68,68,0.10)'
                              : 'rgba(245,158,11,0.10)',
                      border: '1px solid',
                      borderColor: autoOpen.phase === 'ready' ? 'success.light'
                                  : autoOpen.phase === 'failed' ? 'error.light'
                                  : 'warning.light',
                    }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        {autoOpen.phase === 'ready' ? (
                          <CheckCircleIcon fontSize="small" color="success" />
                        ) : autoOpen.phase === 'failed' ? (
                          <ErrorIcon fontSize="small" color="error" />
                        ) : (
                          <>
                            <HourglassTopIcon fontSize="small" color="warning" sx={{
                              animation: 'composerHourglass 1.5s linear infinite',
                              '@keyframes composerHourglass': {
                                '0%':   { transform: 'rotate(0deg)' },
                                '50%':  { transform: 'rotate(180deg)' },
                                '100%': { transform: 'rotate(360deg)' },
                              },
                            }} />
                            <CircularProgress size={14} thickness={6} />
                          </>
                        )}
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>
                            {autoOpen.phase === 'compiling'  && '⏳ 1/2 mvn compile (Java 산출물)'}
                            {autoOpen.phase === 'restarting' && '🔄 2/2 backend 자동 재기동'}
                            {autoOpen.phase === 'ready'      && '✅ 준비 완료 — 새 창에서 화면 진입'}
                            {autoOpen.phase === 'failed'     && '⚠ 자동 진입 실패'}
                          </Typography>
                          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                            {autoOpen.message}
                            {autoOpen.elapsedMs > 0 && (
                              <Box component="span" sx={{ ml: 1, fontFamily: 'monospace' }}>
                                ({Math.round(autoOpen.elapsedMs / 1000)}s)
                              </Box>
                            )}
                          </Typography>
                        </Box>
                        {autoOpen.phase === 'failed' && previewResult?.previewLinks?.[0]?.url && (
                          <Button
                            size="small" variant="outlined" color="info"
                            startIcon={<RestartAltIcon />}
                            href={previewResult.previewLinks[0].url}
                            target="_blank" rel="noopener noreferrer"
                          >직접 진입</Button>
                        )}
                      </Stack>
                    </Box>
                  )}

                  {/* 화면 진입 — preview 가 적용된 JSX 들 */}
                  {Array.isArray(previewResult.previewLinks) && previewResult.previewLinks.length > 0 && (
                    <Box sx={{ mt: 1, p: 0.8, borderRadius: 1, bgcolor: 'rgba(6,182,212,0.10)', border: '1px solid', borderColor: 'info.light' }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'info.dark', display: 'block', mb: 0.4 }}>
                        🔗 화면 진입 (새 창에서 열기)
                      </Typography>
                      <Stack direction="row" spacing={0.6} flexWrap="wrap" sx={{ rowGap: 0.6 }}>
                        {previewResult.previewLinks.map((lk, i) => (
                          <Button
                            key={i}
                            size="small"
                            variant="contained"
                            color="info"
                            href={lk.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ textTransform: 'none', fontSize: 11, py: 0.3 }}
                          >
                            ▶ {lk.label}
                          </Button>
                        ))}
                      </Stack>
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontSize: 10, color: 'text.secondary' }}>
                        Backend 컴파일 없이 즉시 진입 가능 — 클릭하면 새 탭에서 mock 데이터로 화면이 떠요.
                      </Typography>
                    </Box>
                  )}
                </Typography>
              ) : (
                <Typography variant="caption">
                  ❌ {previewResult.error || '실패 — 서버 로그 확인'}
                </Typography>
              )}
            </Alert>
          )}
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="contained"
              color="info"
              onClick={handlePreviewApply}
              disabled={previewBusy !== null || applying}
              startIcon={previewBusy === 'apply' ? <CircularProgress size={12} color="inherit" /> : <VisibilityIcon />}
            >
              {previewBusy === 'apply' ? '적용 중...' : '미리보기 적용'}
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="warning"
              onClick={handlePreviewCancel}
              disabled={previewBusy !== null || applying}
              startIcon={previewBusy === 'cancel' ? <CircularProgress size={12} color="inherit" /> : <CancelIcon />}
            >
              {previewBusy === 'cancel' ? '정리 중...' : '미리보기 취소'}
            </Button>
          </Stack>
        </Paper>
        )}

        {result?.policyBlocked && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
              wingui 네이티브 정책 위반 — 적용 차단
            </Typography>
            {Array.isArray(result.policyViolations) && result.policyViolations.map((v, i) => (
              <Typography key={i} variant="caption" sx={{ display: 'block', mt: 0.3 }}>
                · {v}
              </Typography>
            ))}
            {result.hint && (
              <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
                {result.hint}
              </Typography>
            )}
          </Alert>
        )}
        {result?.autoApplyDisabled && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
              자동 적용 비활성 — 수동 적용 안내
            </Typography>
            {result.info && (
              <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                {result.info}
              </Typography>
            )}
            {Array.isArray(result.manualSteps) && result.manualSteps.map((s, i) => (
              <Typography key={i} variant="caption" sx={{ display: 'block', mt: 0.3 }}>
                · {s}
              </Typography>
            ))}
            {result.hint && (
              <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
                {result.hint}
              </Typography>
            )}
          </Alert>
        )}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* 사전 검증 결과 — 자동 보정 항목이 있을 때만 표시 */}
        {preflight && preflight.totalFixCount > 0 && (
          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
              사전 검증 — {preflight.totalFixCount}건 자동 보정 ({preflight.fileCount}개 파일)
            </Typography>
            {Array.isArray(preflight.files) && preflight.files.map((f, fi) => (
              <Box key={fi} sx={{ mt: 0.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  · {f.filePath || f.artifactType}
                </Typography>
                {Array.isArray(f.fixes) && f.fixes.map((fx, xi) => (
                  <Typography key={xi} variant="caption" sx={{ display: 'block', pl: 2, color: 'text.secondary' }}>
                    ✓ [{fx.rule}] {fx.description}
                  </Typography>
                ))}
              </Box>
            ))}
          </Alert>
        )}
        {preflight && preflight.totalFixCount === 0 && !preflighting && (
          <Alert severity="info" sx={{ mb: 2, py: 0.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              사전 검증 완료 — 자동 보정 대상 없음 ✓
            </Typography>
          </Alert>
        )}
        {preflighting && (
          <Alert severity="info" sx={{ mb: 2, py: 0.5 }}
                 icon={<CircularProgress size={14} />}>
            <Typography variant="caption">사전 검증 중... (textAlignment / javax import / Excel 컬럼명 자동 보정)</Typography>
          </Alert>
        )}

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              적용 대상 산출물 ({artifacts.length}개)
            </Typography>
            {loading && <CircularProgress size={14} />}
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
            메뉴 SQL(MENU_SQL) 은 별도 <b>메뉴 등록</b> 다이얼로그에서 처리합니다. 여기선 그 외 산출물만 다룹니다.
          </Typography>

          <Stack spacing={1.2}>
            <ArtifactGroup
              icon={<CodeIcon fontSize="small" sx={{ color: '#5281b3' }} />}
              title="파일 저장"
              count={fileItems.length}
              items={fileItems}
              emptyText="저장할 파일 없음"
            />
            <ArtifactGroup
              icon={<StorageIcon fontSize="small" sx={{ color: '#fa7d5b' }} />}
              title="SQL_DDL 실행 (CREATE TABLE)"
              count={ddlItems.length}
              items={ddlItems}
              emptyText="DDL 없음"
            />
            <ArtifactGroup
              icon={<DescriptionIcon fontSize="small" sx={{ color: '#fa7d5b' }} />}
              title="SQL_SP 실행 (CREATE OR ALTER PROCEDURE)"
              count={spItems.length}
              items={spItems}
              emptyText="SP 없음"
            />
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            실행 옵션 (항상 적용 — 자동적용 체크박스와 무관)
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
            서버가 JSX · Java · DDL · SP 파일을 프로젝트 폴더에 저장하고, DDL/SP 는 선택적으로 DB 에 직접 실행합니다.
            개발 환경 전용 기능이며, 서버의 <code>app.composer.project-root</code> 설정이 필요합니다.
          </Typography>
          <Stack spacing={0.5} sx={{ pl: 1, mb: 1.5 }}>
            <FormControlLabel
              control={
                <Checkbox size="small"
                  checked={opts.applyFiles}
                  onChange={(e) => setOpts((o) => ({ ...o, applyFiles: e.target.checked }))} />
              }
              label={<Typography variant="body2">파일 저장 (JSX · Java · menus.js · DDL · SP 원본)</Typography>}
            />
            <FormControlLabel
              control={
                <Checkbox size="small"
                  checked={opts.executeDdl}
                  onChange={(e) => setOpts((o) => ({ ...o, executeDdl: e.target.checked }))} />
              }
              label={<Typography variant="body2">SQL_DDL 실행 (CREATE TABLE TB_*)</Typography>}
            />
            <FormControlLabel
              control={
                <Checkbox size="small"
                  checked={opts.executeSp}
                  onChange={(e) => setOpts((o) => ({ ...o, executeSp: e.target.checked }))} />
              }
              label={<Typography variant="body2">SQL_SP 실행 (CREATE OR ALTER PROCEDURE SP_UI_*)</Typography>}
            />
            <FormControlLabel
              control={
                <Checkbox size="small"
                  checked={opts.overwrite}
                  onChange={(e) => setOpts((o) => ({ ...o, overwrite: e.target.checked }))} />
              }
              label={<Typography variant="body2" color="warning.main">기존 파일 덮어쓰기 허용</Typography>}
            />
          </Stack>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleApply}
            disabled={
              applying
              || artifacts.length === 0
              || (!opts.applyFiles && !opts.executeDdl && !opts.executeSp)
            }
            startIcon={applying ? <CircularProgress size={14} color="inherit" /> : <RocketLaunchIcon />}
          >
            {applying
              ? '적용 중...'
              : opts.autoApply
                ? '검증 + 적용 + 재빌드/재컴파일'
                : '검증 + 적용 (재빌드 수동)'}
          </Button>
        </Paper>

        {result && !result.policyBlocked && !result.autoApplyDisabled && (
          <Paper
            ref={resultRef}
            variant="outlined"
            sx={{
              mt: 2, p: 2.5, borderRadius: 2,
              borderColor: result.success ? 'success.main' : 'error.main',
              borderWidth: 2,
              bgcolor: result.success ? 'success.lighter' : 'error.lighter',
              scrollMarginTop: 8,
            }}
          >
            <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 1 }}>
              {result.success
                ? <CheckCircleIcon color="success" sx={{ fontSize: 28 }} />
                : <ErrorIcon color="error" sx={{ fontSize: 28 }} />}
              <Typography variant="h6" sx={{ fontWeight: 700,
                          color: result.success ? 'success.dark' : 'error.dark' }}>
                {result.success ? '✅ 산출물 적용 완료' : '❌ 산출물 적용 실패'}
              </Typography>
            </Stack>
            {result.error && (
              <Alert severity="error" sx={{ mb: 1.5 }}>
                <AlertTitle sx={{ fontWeight: 600 }}>실패 사유</AlertTitle>
                <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>{result.error}</Typography>
              </Alert>
            )}
            {!result.success && !result.error && (
              <Alert severity="warning" sx={{ mb: 1.5 }}>
                <AlertTitle sx={{ fontWeight: 600 }}>실패 항목 요약</AlertTitle>
                <Typography variant="body2">
                  {(() => {
                    const reasons = [];
                    if (result.fileFail > 0) reasons.push(`파일 ${result.fileFail}건`);
                    if (result.ddlFail  > 0) reasons.push(`DDL ${result.ddlFail}건`);
                    if (result.spFail   > 0) reasons.push(`SP ${result.spFail}건`);
                    return reasons.length > 0
                      ? `${reasons.join(' · ')} 적용에 실패했습니다. 아래 상세 항목에서 ❌ 표시된 행의 사유를 확인하세요.`
                      : '실패 사유를 결정할 수 없습니다 — 서버 로그 확인 필요.';
                  })()}
                </Typography>
              </Alert>
            )}
            {result.items && (
              <>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  파일 성공 <b>{result.fileOk ?? 0}</b> / 실패 <b>{result.fileFail ?? 0}</b>
                  &nbsp;· DDL 성공 <b>{result.ddlOk ?? 0}</b> / 실패 <b>{result.ddlFail ?? 0}</b>
                  &nbsp;· SP 성공 <b>{result.spOk ?? 0}</b> / 실패 <b>{result.spFail ?? 0}</b>
                </Typography>
                <Box sx={{ maxHeight: 260, overflow: 'auto', mt: 1 }}>
                  {result.items.map((it, i) => {
                    const ok = it.fileOk === true || it.execOk === true;
                    return (
                      <Stack key={i} direction="row" spacing={1} alignItems="flex-start"
                             sx={{ py: 0.3, borderBottom: '1px dashed #e2e8f0' }}>
                        <Chip size="small" label={it.type} sx={{ fontSize: 10, height: 18 }} />
                        {ok
                          ? <CheckCircleIcon sx={{ fontSize: 14, color: 'success.main', mt: 0.3 }} />
                          : <ErrorIcon sx={{ fontSize: 14, color: 'error.main', mt: 0.3 }} />}
                        <Stack sx={{ minWidth: 0, flex: 1 }}>
                          <Typography variant="caption" sx={{
                            fontFamily: 'monospace', fontSize: 10.5,
                            wordBreak: 'break-all',
                            color: it.remapped ? 'primary.main' : 'inherit',
                          }}>
                            {it.filePath || it.fileName || it.id}
                          </Typography>
                          {it.remapped && it.originalFilePath && (
                            <Typography variant="caption" sx={{
                              fontSize: 9.5, color: '#64748b',
                              fontFamily: 'monospace', wordBreak: 'break-all',
                            }}>
                              ↳ 원본: {it.originalFilePath}
                            </Typography>
                          )}
                          {(it.fileErr || (Array.isArray(it.errors) && it.errors.length > 0)) && (
                            <Typography variant="caption" color="error" sx={{ fontSize: 10 }}>
                              {it.fileErr || it.errors.join(' / ')}
                            </Typography>
                          )}
                        </Stack>
                      </Stack>
                    );
                  })}
                </Box>
              </>
            )}

            {/* 재빌드 / 재컴파일 (control plane) — autoApply 가 ON 이었으면 백그라운드 작업 정보 노출 */}
            {result.controlPlane && (
              <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px dashed #cbd5e1' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  재빌드 / 재컴파일 (control plane)
                </Typography>
                {result.controlPlane.triggered ? (
                  <>
                    <Typography variant="caption" sx={{ color: 'success.dark', display: 'block', mb: 0.5 }}>
                      ✓ 백그라운드에서 실행 중 — 진행 상황은 project-root 의 log 파일 확인
                    </Typography>
                    {Array.isArray(result.controlPlane.jobs) && result.controlPlane.jobs.map((j, ji) => (
                      <Typography key={ji} variant="caption" sx={{
                        display: 'block', fontFamily: 'monospace', fontSize: 11,
                        color: j.started ? 'text.secondary' : 'error.main', pl: 1.5,
                      }}>
                        {j.started ? `· [${j.name}] pid=${j.pid} → ${j.logFile}` : `· [${j.name}] 시작 실패: ${j.error}`}
                      </Typography>
                    ))}
                  </>
                ) : (
                  <>
                    <Typography variant="caption" color="warning.main" sx={{ display: 'block', mb: 0.5 }}>
                      ⚠ 자동적용 OFF — 다음을 수동으로 수행하세요:
                    </Typography>
                    {Array.isArray(result.controlPlane.manualSteps) && result.controlPlane.manualSteps.map((s, si) => (
                      <Typography key={si} variant="caption" sx={{
                        display: 'block', fontFamily: 'monospace', fontSize: 11,
                        color: 'text.secondary', pl: 1.5,
                      }}>
                        · {s}
                      </Typography>
                    ))}
                  </>
                )}
                {result.controlPlane.note && (
                  <Typography variant="caption" sx={{ display: 'block', mt: 0.8, color: 'text.secondary', fontStyle: 'italic' }}>
                    {result.controlPlane.note}
                  </Typography>
                )}
              </Box>
            )}
          </Paper>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>닫기</Button>
      </DialogActions>

      {/* 즉시 피드백 — 사용자가 결과 패널을 놓치지 않도록 화면 상단에 토스트 (성공: 6초 자동 닫힘, 실패/안내: 수동 닫기) */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.severity === 'success' ? 6000 : null}
        onClose={(_, reason) => {
          // 클릭아웃으로 자동 닫힘 방지 — 실패 메시지는 사용자가 명시적으로 닫게
          if (reason === 'clickaway' && snackbar.severity !== 'success') return;
          setSnackbar((s) => ({ ...s, open: false }));
        }}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ mt: 2 }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          sx={{ minWidth: 480, maxWidth: 720, fontSize: 14, alignItems: 'flex-start' }}
        >
          {snackbar.title && <AlertTitle sx={{ fontWeight: 700 }}>{snackbar.title}</AlertTitle>}
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
}

function ArtifactGroup({ icon, title, count, items, emptyText }) {
  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={0.8} sx={{ mb: 0.5 }}>
        {icon}
        <Typography variant="body2" sx={{ fontWeight: 600 }}>{title}</Typography>
        <Chip size="small" label={count} sx={{ height: 18, fontSize: 10 }} />
      </Stack>
      {count === 0 ? (
        <Typography variant="caption" color="text.secondary" sx={{ pl: 3 }}>
          {emptyText}
        </Typography>
      ) : (
        <Stack spacing={0.2} sx={{ pl: 3 }}>
          {items.slice(0, 8).map((a) => (
            <Typography key={a.id} variant="caption" sx={{
              fontFamily: 'monospace', fontSize: 10.5, color: '#475569', wordBreak: 'break-all',
            }}>
              {a.filePath || a.fileName || a.artifactType}
              {a.versionNo > 1 && (
                <Box component="span" sx={{ ml: 0.5, color: '#15803d', fontWeight: 600 }}>
                  v{a.versionNo}
                </Box>
              )}
            </Typography>
          ))}
          {items.length > 8 && (
            <Typography variant="caption" color="text.secondary">
              ... 외 {items.length - 8}건
            </Typography>
          )}
        </Stack>
      )}
    </Box>
  );
}

export default ArtifactApplyDialog;
