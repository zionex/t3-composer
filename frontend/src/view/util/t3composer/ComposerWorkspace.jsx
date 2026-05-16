import React, { useState, useEffect } from 'react';

import { Box, IconButton, Tooltip, Stack, Typography, Chip, Button, Menu, MenuItem, ListItemIcon, ListItemText, CircularProgress, Snackbar, Alert, AlertTitle, Tabs, Tab, FormControlLabel, Checkbox } from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import DownloadIcon from '@mui/icons-material/Download';
import AppRegistrationIcon from '@mui/icons-material/AppRegistration';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LaunchIcon from '@mui/icons-material/Launch';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import BoltIcon from '@mui/icons-material/Bolt';
import DiamondIcon from '@mui/icons-material/Diamond';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckIcon from '@mui/icons-material/Check';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import DnsIcon from '@mui/icons-material/Dns';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';

import { zAxios } from '@wingui/common/imports';

import ChatPanel from './ChatPanel';
import { ArtifactTreeView, ArtifactCodeView } from './ArtifactPanel';
import MenuRegistrationDialog from './MenuRegistrationDialog';
import ArtifactApplyDialog from './ArtifactApplyDialog';
import SplitPane from './SplitPane';
import PreviewEmbed from './PreviewEmbed';
import { downloadDesignDoc, updateSessionModel, applyPreview, cancelPreview } from './api';

/**
 * AI 엔진(모델) 선택지 — Anthropic Claude.
 * 산출물 생성 후 추가 채팅이나 History 이어하기 시점에도 동일한 픽커로 전환 가능.
 * (ModeNewGeneral 의 MODEL_OPTIONS 와 동기화 — 신규 생성 시점과 동일한 두 모델 노출)
 */
const MODEL_OPTIONS = [
  {
    id:    'claude-sonnet-4-6',
    label: 'Sonnet',
    sub:   'Sonnet 4.6 — 기본값',
    desc:  '속도·비용·품질 균형. 일반 화면 생성·수정에 권장.',
    Icon:  BoltIcon,
    color: '#2563eb',
  },
  {
    id:    'claude-opus-4-7',
    label: 'Opus',
    sub:   'Opus 4.7 — 고품질 (느림)',
    desc:  '복잡 로직·고난이도 화면. 16K+ 출력 시 3~5분+ 소요 가능.',
    Icon:  DiamondIcon,
    color: '#7c3aed',
  },
];

const DEFAULT_MODEL_ID = 'claude-sonnet-4-6';

// 화면 실행 후 AI 자동보완 — 한 번의 [화면 실행] 당 최대 보완 시도 횟수.
// 이 상한을 넘으면 자동보완을 멈춰 무한루프(오류 → 보완 → 재실행 → 오류 …)를 차단한다.
// 2026-05-16 사용자 요청 — 1회만 자동보완. 1회 보완 후에도 오류면 즉시 멈추고 사용자에게 위임.
const MAX_AUTOFIX = 1;

function modelMeta(id) {
  return MODEL_OPTIONS.find((m) => m.id === id)
      || { id, label: id, sub: id, desc: '', Icon: BoltIcon, color: '#64748b' };
}

/**
 * 화면 실행 오류 → AI 자동보완 요청 프롬프트 생성.
 * 포착한 오류(apply / runtime / render)를 같은 세션 Composer 채팅으로 보내 산출물을 수정.
 */
function buildFixPrompt(errInfo, previewMeta, opts) {
  const e = errInfo || {};
  const escalate = !!(opts && opts.escalate);
  const msg = String(e.message || '');
  // SQL 컬럼/객체 오류 — 산출물 SP 가 실제 테이블에 없는 컬럼을 사용한 케이스
  const isSqlColErr = /invalid column|column name|invalid object name|컬럼/i.test(msg);
  const lines = [
    '[자동 오류 보완 요청]',
    '방금 생성한 화면을 [화면 실행] 했을 때 아래 오류가 발생했습니다.',
    '산출물(JSX/Java/SP/SQL)에서 원인을 찾아 수정하고, 수정한 파일 전체를 ===FILE: 형식으로 다시 출력해주세요.',
    '',
  ];
  if (escalate) {
    // 직전 보완으로도 같은 오류가 재발 — 표면적 수정 대신 근본 재검토를 강하게 요구.
    lines.push(
      '⚠️ 직전 수정으로도 동일한 오류가 다시 발생했습니다. 표면적 수정으로는 해결되지 않습니다.',
      '   - 오류와 관련된 import 경로 · 컴포넌트 사용처 · SP 컬럼명을 처음부터 다시 점검하세요.',
      '   - 확실하지 않은 외부 모듈/컴포넌트/컬럼은 사용을 제거하고 가장 단순한 표준 패턴으로 교체하세요.',
      '   - 부분 수정이 아니라 문제 파일을 통째로 재작성해도 좋습니다.',
      '',
    );
  }
  if (previewMeta?.viewSub) lines.push('화면 경로: ' + previewMeta.viewSub);
  lines.push('오류 종류: ' + (e.type || 'runtime'));
  lines.push('오류 메시지:');
  lines.push(e.message || '(메시지 없음)');
  if (e.componentStack) {
    lines.push('', '컴포넌트 스택:',
               String(e.componentStack).split('\n').slice(0, 8).join('\n'));
  }
  if (e.stack) {
    lines.push('', '스택:',
               String(e.stack).split('\n').slice(0, 6).join('\n'));
  }
  lines.push('', '수정 지침:');
  if (isSqlColErr) {
    lines.push(
      '★ SQL 컬럼/객체 오류 — 산출물 SP/SQL 이 실제 테이블에 없는 컬럼명을 사용했습니다.',
      '- ❌ 컬럼명을 추측하지 마세요. 기존 테이블(TB_*)을 사용하는 화면이면 그 테이블의 실제 컬럼명만 사용.',
      '- ❌ 기존 테이블에 대한 CREATE TABLE 을 새로 만들지 마세요 — 이미 존재하는 테이블입니다.',
      '- 참고: TB_AD_USER 의 실제 컬럼은 ID · USERNAME · PASSWORD · DISPLAY_NAME · ENABLED 등이며 USER_ID/USER_NM 이 아닙니다.',
      '- 오류 메시지의 잘못된 컬럼명을 실제 컬럼으로 교체하고, SP 의 SELECT/INSERT/UPDATE/WHERE 절을 모두 정합화하세요.',
      '- JSX 의 gridItems name/fieldName 도 SP 결과 컬럼명과 일치하도록 함께 수정하세요.',
    );
  }
  lines.push(
    '- @wingui/common/imports 에서 shim 미보유 컴포넌트 import 금지 ("Element type is invalid: got undefined" 원인).',
    '- 리스트 state 는 useState([]) 초기값 + 렌더 직전 Array.isArray 가드 적용.',
    '- 수정이 필요한 파일만 ===FILE: <경로>=== 블록으로 전체 다시 출력하세요.',
  );
  return lines.join('\n');
}

/**
 * 세션 생성 이후 공통 작업 영역.
 * 좌: ChatPanel  |  우: ArtifactPanel  (리사이저 없이 고정 비율, 토글 가능)
 *
 * 헤더 버튼 (2026-04-27 정책 분리):
 *  - 레이아웃 토글 (chat-only / split / artifact-only)
 *  - 설계서 다운로드 (.xlsx)
 *  - 메뉴 등록  (MENU_SQL 만 실행 — TB_AD_MENU + TB_AD_LANG_PACK + TB_AD_PERMISSION_GROUP)
 *  - 산출물 실행 (그 외 — JSX/Java 파일 저장 + SQL_DDL/SQL_SP DB 실행)
 */
function ComposerWorkspace({ session, initialPrompt, initialAttachments, extraHeader }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [menuDialogOpen, setMenuDialogOpen]   = useState(false);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  // 산출물 선택 상태 — Tree(좌) ↔ CodeView(우 Tab) 동기화
  const [selectedArtifactId, setSelectedArtifactId] = useState(null);
  // 우측 Tab — 0: 미리보기, 1: 산출물 소스. 초기값 0 (미리보기)
  const [rightTab, setRightTab] = useState(0);
  // 미리보기 메타 (PreviewEmbed 가 이걸 보고 lazy import)
  const [previewMeta, setPreviewMeta] = useState(null);  // { sid8, viewSub }
  // Preview 진행 상태 (헤더 [미리보기] 버튼 흐름용)
  const [previewBusy, setPreviewBusy] = useState(false);
  const [previewStage, setPreviewStage] = useState(null);  // { phase, message, elapsedMs, targetUrl }
  const previewAbortRef = React.useRef(false);
  // [Sample 데이터] — 항상 ON (UI 체크박스 제거). 화면 실행 시 빈 응답에 휴리스틱 sample
  //   자동 주입 + Java 적용·mvn compile·DevTools 재기동 SKIP. shim BaseGrid /
  //   sample interceptor 가 window.__composerSampleData 를 lookup.
  const useSampleData = true;
  useEffect(() => {
    window.__composerSampleData = true;
    try { localStorage.setItem('composer.sampleData', '1'); } catch (_) { /* no-op */ }
  }, []);

  // [오류 시 자동보완] — default ON. [화면 실행] 후 런타임 오류 발생 시 AI 가 오류를
  //   분석해 산출물을 수정 → 자동으로 화면 재실행 (최대 MAX_AUTOFIX 회).
  const [autoFixOnError, setAutoFixOnError] = useState(true);
  const [previewNonce, setPreviewNonce] = useState(0);   // PreviewEmbed 강제 reload 트리거
  const [autoFixActive, setAutoFixActive] = useState(false); // 자동보완 진행 중 — PreviewEmbed UI 표시용
  const [autoFixLabel, setAutoFixLabel]   = useState('');    // 자동보완 진행 라벨 (예: "AI 자동보완 중 (1/1)")
  const autoFixAttemptRef = React.useRef(0);             // 현재 화면실행 사이클의 보완 시도 횟수
  const autoFixingRef = React.useRef(false);             // 자동보완 진행 중 재진입 가드
  const lastAutoFixErrorRef = React.useRef('');          // 직전 보완 시점의 오류 메시지 (동일오류 반복 감지)
  const chatRef = React.useRef(null);                    // ChatPanel — 프로그램적 채팅 전송용
  const [snackbar, setSnackbar] = useState({ open: false, severity: 'success', title: '', message: '' });

  // AI 엔진(모델) 전환 — 세션 생성 후/이어하기 진입 후에도 변경 가능
  const [currentModel, setCurrentModel] = useState(session?.modelName || DEFAULT_MODEL_ID);
  const [modelMenuAnchor, setModelMenuAnchor] = useState(null);
  const [modelSwitching, setModelSwitching] = useState(false);

  // session prop 이 갱신될 때 현재 모델 동기화 (이어하기 케이스)
  useEffect(() => {
    if (session?.modelName) setCurrentModel(session.modelName);
  }, [session?.modelName]);

  const triggerRefresh = () => setRefreshKey((k) => k + 1);

  const handlePickModel = async (modelId) => {
    setModelMenuAnchor(null);
    if (!session?.id || modelId === currentModel) return;
    setModelSwitching(true);
    try {
      const res = await updateSessionModel(session.id, modelId);
      setCurrentModel(res?.data?.modelName || modelId);
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert('AI 엔진 전환 실패: ' + (e?.response?.data?.message || e?.message || ''));
    } finally {
      setModelSwitching(false);
    }
  };

  // 세션 heartbeat — Composer 작업은 Claude 호출 대기 중 idle 시간이 길어
  // 서버의 sessionExpiredDttm (기본 2시간) 이 끊길 수 있다.
  // 5분 주기로 /auth/validate 를 호출해 JwtAuthenticationFilter 가
  // sessionExpiredDttm 을 연장하도록 한다. (에러는 무시 — focus listener 가 처리)
  useEffect(() => {
    if (!session) return undefined;
    const HEARTBEAT_MS = 5 * 60 * 1000;  // 5분
    const tick = () => {
      // skip401Dialog 로 전역 "세션 만료" 다이얼로그 차단. 401 이어도 silent.
      // 실제 세션 상실은 사용자가 명시적으로 무언가 조작할 때 자연스럽게 감지됨.
      zAxios.get('auth/validate', {
        waitOn: false,
        errorMessage: false,
        skip401Dialog: true,
      }).catch(() => { /* no-op */ });
    };
    const id = window.setInterval(tick, HEARTBEAT_MS);
    return () => window.clearInterval(id);
  }, [session?.id]);

  // ───────────────────────────────────────────────────────────────────
  // Preview — 헤더 [미리보기] 버튼: applyPreview → 진행 단계 → 자동 진입
  // ───────────────────────────────────────────────────────────────────
  const handlePreview = async () => {
    if (!session?.id || previewBusy) return;
    setPreviewBusy(true);
    previewAbortRef.current = false;
    // Sample 모드 ON 이면 backend 가 Java 적용·mvn compile·재기동 모두 skip → 즉시 ready.
    // axios 요청은 frontend shim 의 sample interceptor 가 합성 응답으로 가로챔.
    const sampleMode = useSampleData;
    setPreviewStage({ phase: 'applying',
      message: sampleMode ? '산출물 적용 중 (Sample 모드 — 재기동 생략)...' : '산출물 적용 중...',
      elapsedMs: 0 });
    try {
      const res = await applyPreview(session.id, { skipJava: sampleMode });
      const r = res?.data || {};
      if (!r.success) {
        setPreviewStage(null);
        const errMsg = r.error || 'JSX/SQL/MENU 처리 오류';
        if (autoFixOnError) {
          // 자동보완 ON — 오류 스낵바(차단창) 없이 곧바로 보완 흐름 진입.
          //   SP/SQL/JSX apply 단계 오류도 AI 자동 수정 → 재실행 대상.
          handlePreviewError({ type: 'apply', message: errMsg });
        } else {
          setSnackbar({ open: true, severity: 'error', title: '화면 실행 준비 실패',
                        message: errMsg });
        }
        return;
      }
      setAutoFixActive(false);   // 산출물 적용 성공 — apply 오류 자동보완 중이었다면 해소
      setSnackbar({ open: true, severity: 'success', title: '화면 실행 준비 완료',
                    message: `JSX ${r.jsxOk} · DDL ${r.ddlOk} · SP ${r.spOk} · MENU ${r.menuOk} · Java ${r.javaOk || 0}`
                             + (sampleMode ? ' (Sample 모드)' : '') });

      // 첫 미리보기 링크 + 메타 (Tab embed 용) 저장
      const link = r.previewLinks?.[0];
      const targetUrl = link?.url;
      if (link?.viewSub && r.sid8) {
        setPreviewMeta({ sid8: r.sid8, viewSub: link.viewSub });
        setPreviewNonce((n) => n + 1);  // viewSub 동일해도 PreviewEmbed 강제 reload
        setRightTab(0);  // [실행 화면] 탭 자동 활성
      }
      if (!targetUrl) {
        setPreviewStage(null);
        return;
      }
      // Sample 모드 또는 Java 0건 — 재기동 없음. 즉시 ready 처리.
      const hasJava = (r.javaOk || 0) > 0;
      if (sampleMode || !hasJava) {
        setPreviewStage({ phase: 'ready',
          message: sampleMode ? 'Sample 모드 — 실행 준비 완료 (재기동 생략)' : '실행 준비 완료',
          elapsedMs: 0, targetUrl });
        // 'ready' 일 때만 자동 닫기 — 그 사이 자동보완(autofixing)/실패 단계로 바뀌었으면 유지.
        setTimeout(() => {
          setPreviewStage((s) =>
            (!previewAbortRef.current && s && s.phase === 'ready') ? null : s);
        }, 1500);
        return;
      }
      // Java 있으면 health 폴링 → backend restart 감지 후 자동으로 ready
      const start = Date.now();
      let sawDown = false;
      setPreviewStage({ phase: 'compiling', message: '백엔드 컴파일 진행 중...', elapsedMs: 0, targetUrl });
      while (!previewAbortRef.current && (Date.now() - start) < 120000) {
        await new Promise((res2) => setTimeout(res2, 2500));
        if (previewAbortRef.current) return;
        const elapsed = Date.now() - start;
        try {
          const ctrl = new AbortController();
          const tmr = setTimeout(() => ctrl.abort(), 2000);
          const h = await fetch('/actuator/health', { method: 'GET', signal: ctrl.signal });
          clearTimeout(tmr);
          if (h.ok && sawDown) {
            // 회복 완료 — 자동으로 화면 노출 (우측 Tab 0 에 이미 embed 됨)
            setPreviewStage({ phase: 'ready', message: '준비 완료 — 우측 [실행 화면] 탭에서 확인', elapsedMs: elapsed, targetUrl });
            setTimeout(() => {
              setPreviewStage((s) =>
                (!previewAbortRef.current && s && s.phase === 'ready') ? null : s);
            }, 2000);
            return;
          }
          if (h.ok) {
            setPreviewStage({ phase: 'compiling', message: '백엔드 컴파일 진행 중...', elapsedMs: elapsed, targetUrl });
          } else {
            sawDown = true;
            setPreviewStage({ phase: 'restarting', message: '백엔드 재기동 중...', elapsedMs: elapsed, targetUrl });
          }
        } catch {
          sawDown = true;
          setPreviewStage({ phase: 'restarting', message: '백엔드 재기동 중...', elapsedMs: Date.now() - start, targetUrl });
        }
      }
      if (!previewAbortRef.current) {
        setPreviewStage({ phase: 'failed', message: '대기 시간 초과(120초)', elapsedMs: Date.now() - start, targetUrl });
      }
    } catch (e) {
      const data = e?.response?.data || {};
      setPreviewStage(null);
      setSnackbar({ open: true, severity: 'error', title: '미리보기 통신 오류',
                    message: data.message || data.error || e?.message || '네트워크 오류' });
    } finally {
      setPreviewBusy(false);
    }
  };

  const handlePreviewCancel = async () => {
    previewAbortRef.current = true;
    setPreviewStage(null);
    setPreviewMeta(null);
    if (!session?.id) return;
    try {
      await cancelPreview(session.id);
      setSnackbar({ open: true, severity: 'info', title: '실행 화면 정리', message: '실행 산출물 + DB row 정리됨' });
    } catch (e) {
      setSnackbar({ open: true, severity: 'error', title: '정리 실패',
                    message: e?.response?.data?.message || e?.message });
    }
  };

  // ───────────────────────────────────────────────────────────────────
  // 화면 실행 오류 → AI 자동보완 (autoFixOnError ON 시) — apply 오류 + 런타임 오류 공통
  //   · apply 단계 오류 : handlePreview 의 !r.success 분기가 직접 호출
  //   · 렌더/런타임 오류 : PreviewEmbed 의 onError(ErrorBoundary·window 리스너)가 호출
  //   → AI 채팅으로 산출물 수정 → handlePreview 재실행. 또 오류면 attempt+1 로 반복.
  //
  //   ★ 원칙 — 오류가 나도 멈추지 않는다. 단, 무한루프/비용 폭주는 막아야 하므로
  //     횟수 상한(MAX_AUTOFIX) 안에서 "멈춤 없이 계속 시도" 한다:
  //     [1] 횟수 상한: autoFixAttemptRef 가 MAX_AUTOFIX(1) 에 도달하면 비로소 중단.
  //         카운터는 사용자가 [화면 실행] 버튼을 직접 누를 때만 0 으로 리셋되고,
  //         자동 재실행 경로(handlePreviewError → handlePreview)에서는 리셋되지 않는다.
  //     [2] 동일오류 escalation: 직전 보완 후에도 같은 오류가 재발하면 — 멈추지 않고
  //         더 강한(escalate) 지침의 프롬프트로 재시도 (buildFixPrompt escalate=true).
  //         매 재시도 프롬프트가 더 근본적 재검토를 요구 → 단순 반복이 아님.
  //     [3] 재진입 가드: autoFixingRef — 단, 재실행 호출 '전'에 해제하여
  //         재실행의 동기 apply 오류도 보완 루프로 재진입 가능 (가드에 막히지 않음).
  // ───────────────────────────────────────────────────────────────────
  const handlePreviewError = async (errInfo) => {
    if (!autoFixOnError) return;          // 자동보완 OFF — 오류 UI 만 표시
    if (autoFixingRef.current) return;    // [3] 이미 보완 진행 중 — 재진입 방지

    const errMsg = String(errInfo?.message || '').trim();
    // [2] 직전 보완 후에도 동일 오류 → 같은 프롬프트 재시도는 무의미.
    //     하지만 멈추지 않는다 — 더 강한(escalated) 지침으로 재시도한다.
    //     ([1] 횟수 상한 안에서 반복되며, 매 시도 프롬프트가 더 근본적 재검토를 요구)
    const sameError = !!errMsg && errMsg === lastAutoFixErrorRef.current
                      && autoFixAttemptRef.current > 0;
    // [1] 한 번의 [화면 실행] 당 최대 MAX_AUTOFIX 회.
    if (autoFixAttemptRef.current >= MAX_AUTOFIX) {
      setAutoFixActive(false);
      setPreviewStage({ phase: 'failed', elapsedMs: 0,
        message: `AI 자동보완을 ${MAX_AUTOFIX}회 시도했으나 오류가 계속됩니다. `
               + '우측 [산출물 소스] 탭에서 직접 확인하거나 채팅으로 수정을 요청하세요.' });
      return;
    }
    autoFixingRef.current = true;
    autoFixAttemptRef.current += 1;
    lastAutoFixErrorRef.current = errMsg;
    const attempt = autoFixAttemptRef.current;
    // PreviewEmbed 가 오류 화면 대신 '자동보완 중' 화면을 표시하도록 state ON.
    setAutoFixActive(true);
    setAutoFixLabel(`AI 자동보완 중 (${attempt}/${MAX_AUTOFIX})`);
    let ok = false;
    try {
      setPreviewStage({ phase: 'autofixing', elapsedMs: 0,
        message: `AI 가 오류를 분석해 산출물을 수정 중입니다 (${attempt}/${MAX_AUTOFIX})...` });
      ok = await chatRef.current?.sendMessage(
        buildFixPrompt(errInfo, previewMeta, { escalate: sameError }));
      triggerRefresh();
    } catch (e) {
      ok = false;
      setPreviewStage({ phase: 'failed', elapsedMs: 0,
        message: '자동보완 처리 오류: ' + (e?.message || '') });
    } finally {
      // ★ 재실행 전에 lock 해제 — 재실행의 apply 단계 '동기' 오류도 자동보완 재진입 가능.
      //   (lock 을 재실행 await 동안 잡고 있으면 동기 오류가 [3] 가드에 막혀 루프가 끊김)
      autoFixingRef.current = false;
    }
    if (!ok) {
      setAutoFixActive(false);
      setPreviewStage((s) => (s && s.phase === 'failed') ? s : ({
        phase: 'failed', elapsedMs: 0,
        message: 'AI 자동보완 요청이 실패했습니다. 좌측 작업 내역의 오류를 확인하세요.' }));
      return;
    }
    setSnackbar({ open: true, severity: 'info', title: `AI 자동보완 (${attempt}/${MAX_AUTOFIX})`,
      message: '산출물을 수정했습니다. 화면을 다시 실행합니다.' });
    setPreviewStage({ phase: 'autofixing', elapsedMs: 0,
      message: `보완 완료 — 화면을 다시 실행합니다 (${attempt}/${MAX_AUTOFIX})...` });
    // 재실행 — lock 해제 후 호출(await 안 함). 재실행이 또 실패하면 apply 오류(동기)·
    //   런타임 오류(비동기) 모두 handlePreviewError 로 재진입 (attempt+1, 최대 MAX).
    handlePreview();
  };

  const handleDownloadDesignDoc = async () => {
    setDownloading(true);
    try {
      const res = await downloadDesignDoc(session.id);
      const blob = res.data instanceof Blob
        ? res.data
        : new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `design-doc-${(session.title || session.id).replace(/[^a-zA-Z0-9가-힣_-]/g, '_')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert('설계서 다운로드 실패: ' + (e?.message || ''));
    } finally {
      setDownloading(false);
    }
  };

  if (!session) return null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1}
        sx={{
          px: 2,
          py: 0.8,
          borderBottom: '1px solid rgba(0,0,0,0.08)',
          bgcolor: 'grey.50',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}
               sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <Typography variant="body2" noWrap title={session.title}
                      sx={{ fontWeight: 500, flex: 1, minWidth: 0,
                            overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {session.title}
          </Typography>
          <Chip label={session.mode} size="small" variant="outlined"
                sx={{ height: 20, fontSize: 10, flexShrink: 0 }} />
          {session.targetMenuCd && (
            <Chip label={session.targetMenuCd} size="small"
                  sx={{ height: 20, fontSize: 10, flexShrink: 0,
                        maxWidth: 200,
                        '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' } }} />
          )}
          {/* AI 엔진(모델) 선택 — 클릭 시 Sonnet ↔ Opus 전환 메뉴 노출 */}
          {(() => {
            const meta = modelMeta(currentModel);
            const ModelIcon = meta.Icon;
            return (
              <Tooltip title={`AI 엔진: ${meta.sub} — 클릭하여 변경`}>
                <Chip
                  size="small"
                  variant="outlined"
                  clickable
                  disabled={modelSwitching}
                  onClick={(e) => setModelMenuAnchor(e.currentTarget)}
                  icon={modelSwitching
                    ? <CircularProgress size={12} sx={{ ml: 0.6 }} />
                    : <ModelIcon sx={{ fontSize: 14, color: meta.color + '!important' }} />}
                  label={meta.label}
                  deleteIcon={<ExpandMoreIcon sx={{ fontSize: 14 }} />}
                  onDelete={(e) => setModelMenuAnchor(e.currentTarget)}
                  sx={{
                    height: 22,
                    fontSize: 11,
                    fontWeight: 700,
                    flexShrink: 0,
                    display: { xs: 'none', md: 'inline-flex' },
                    borderColor: `${meta.color}55`,
                    color: meta.color,
                    bgcolor: `${meta.color}08`,
                    '& .MuiChip-deleteIcon': { color: meta.color, mr: 0.3 },
                    '&:hover': { bgcolor: `${meta.color}14`, borderColor: meta.color },
                  }}
                />
              </Tooltip>
            );
          })()}
          <Menu
            anchorEl={modelMenuAnchor}
            open={Boolean(modelMenuAnchor)}
            onClose={() => setModelMenuAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            PaperProps={{ sx: { minWidth: 280, mt: 0.5 } }}
          >
            <Box sx={{ px: 2, pt: 1, pb: 0.5 }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, letterSpacing: 1 }}>
                AI 엔진 선택
              </Typography>
            </Box>
            {MODEL_OPTIONS.map((m) => {
              const ModelIcon = m.Icon;
              const active = m.id === currentModel;
              return (
                <MenuItem
                  key={m.id}
                  onClick={() => handlePickModel(m.id)}
                  selected={active}
                  sx={{ alignItems: 'flex-start', py: 1 }}
                >
                  <ListItemIcon sx={{ minWidth: 32, mt: 0.3 }}>
                    <ModelIcon sx={{ color: m.color, fontSize: 22 }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Stack direction="row" alignItems="center" spacing={0.8}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: m.color }}>
                          {m.label}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          {m.sub}
                        </Typography>
                        {active && <CheckIcon sx={{ fontSize: 16, color: m.color, ml: 0.5 }} />}
                      </Stack>
                    }
                    secondary={
                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mt: 0.3 }}>
                        {m.desc}
                      </Typography>
                    }
                  />
                </MenuItem>
              );
            })}
          </Menu>
        </Stack>
        {/* 우측 액션 영역 — 항상 고정 너비로 노출 (긴 title 에 의해 클리핑되지 않도록 flexShrink:0) */}
        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
          {extraHeader}

          {/* 기능 버튼 */}
          <Tooltip title="화면설계서 Excel 다운로드">
            <span>
              <Button
                size="small"
                startIcon={<DownloadIcon fontSize="small" />}
                onClick={handleDownloadDesignDoc}
                disabled={downloading}
                variant="outlined"
                sx={{ mr: 0.5 }}
              >
                {downloading ? '생성 중...' : '설계서'}
              </Button>
            </span>
          </Tooltip>
          {/* [화면 실행] — 산출물을 docker 안에 적용해 우측 Tab 에서 실제 운영 화면처럼 노출 */}
          <Tooltip title="산출물을 적용해 우측 [실행 화면] 탭에서 실제 운영 형태로 띄우기. JSX/SQL/Java 모두 실제 동작 (CRUD round-trip).">
            <span>
              <Button
                size="small"
                startIcon={previewBusy
                  ? <CircularProgress size={14} color="inherit" />
                  : <LaunchIcon fontSize="small" />}
                onClick={() => {
                  // 수동 [화면 실행] — 자동보완 카운터/동일오류 기록 리셋 (새 사이클 시작)
                  autoFixAttemptRef.current = 0;
                  lastAutoFixErrorRef.current = '';
                  handlePreview();
                }}
                disabled={previewBusy || !!previewStage}
                variant="contained"
                color="info"
                sx={{ mr: 0.5 }}
              >
                {previewBusy ? '실행 중...' : '화면 실행'}
              </Button>
            </span>
          </Tooltip>
          {/* [오류 시 자동보완] — 체크 시 화면 실행 후 런타임 오류를 AI 가 자동 수정·재실행 */}
          <Tooltip title={
              "오류 시 자동보완 — 체크 시:\n"
            + "[화면 실행] 후 런타임 오류가 발생하면 AI 가 오류 메시지를 분석해\n"
            + "산출물(JSX/Java/SP)을 자동 수정한 뒤 화면을 다시 실행합니다.\n"
            + "최대 3회까지 자동 반복하며, 해결되지 않으면 안내 후 멈춥니다."
          }>
            <FormControlLabel
              sx={{ ml: 0, mr: 0.5,
                    '& .MuiFormControlLabel-label': { fontSize: 12, lineHeight: 1, whiteSpace: 'nowrap' } }}
              control={
                <Checkbox
                  size="small"
                  checked={autoFixOnError}
                  onChange={(e) => setAutoFixOnError(e.target.checked)}
                  sx={{ p: 0.5 }}
                />
              }
              label={
                <Stack direction="row" alignItems="center" spacing={0.3}>
                  <AutoFixHighIcon sx={{ fontSize: 14 }} />
                  <span>오류 시 자동보완</span>
                </Stack>
              }
            />
          </Tooltip>
          {/* ── [Target System 적용] 그룹 — 메뉴 등록 + 산출물 실행 두 기능 묶음 ── */}
          <Box
            sx={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              pl: 0.8, pr: 0.8, pt: 0.7, pb: 0.5,
              mr: 1,
              border: '1px solid',
              borderColor: 'primary.light',
              borderRadius: 1.5,
              bgcolor: 'rgba(124,167,224,0.07)',
            }}
          >
            {/* fieldset legend — 그룹명 */}
            <Typography
              component="span"
              sx={{
                position: 'absolute', top: -7, left: 8,
                px: 0.5,
                fontSize: 9.5, fontWeight: 800, letterSpacing: 0.2, lineHeight: 1.3,
                color: 'primary.dark',
                bgcolor: 'grey.50',
                borderRadius: 0.5,
                display: 'flex', alignItems: 'center', gap: 0.3,
                whiteSpace: 'nowrap',
              }}
            >
              <DnsIcon sx={{ fontSize: 11 }} />
              Target System 적용
            </Typography>
            <Tooltip title="① 메뉴 등록 — MENU_SQL 만 실제 DB 에 적용 (TB_AD_MENU + TB_AD_LANG_PACK + TB_AD_PERMISSION_GROUP)">
              <span>
                <Button
                  size="small"
                  startIcon={<AppRegistrationIcon fontSize="small" />}
                  onClick={() => setMenuDialogOpen(true)}
                  variant="outlined"
                  color="warning"
                >
                  메뉴 등록
                </Button>
              </span>
            </Tooltip>
            <Tooltip title="② 산출물 실행 — JSX/Java 파일 저장 + SQL_DDL/SQL_SP DB 실행 (메뉴 등록 후 권장)">
              <span>
                <Button
                  size="small"
                  startIcon={<RocketLaunchIcon fontSize="small" />}
                  onClick={() => setApplyDialogOpen(true)}
                  variant="outlined"
                  color="secondary"
                >
                  산출물 실행
                </Button>
              </span>
            </Tooltip>
          </Box>

        </Stack>
      </Stack>

      {/* Preview 진행 단계 토스트 — 화면 상단 sticky */}
      {previewStage && (
        <Box sx={{
          px: 2, py: 1,
          borderBottom: '1px solid',
          borderColor: previewStage.phase === 'ready' ? 'success.light'
                      : previewStage.phase === 'failed' ? 'error.light'
                      : 'warning.light',
          bgcolor: previewStage.phase === 'ready' ? 'rgba(16,185,129,0.08)'
                  : previewStage.phase === 'failed' ? 'rgba(239,68,68,0.08)'
                  : 'rgba(245,158,11,0.08)',
        }}>
          <Stack direction="row" alignItems="center" spacing={1.2}>
            {previewStage.phase === 'ready' ? (
              <CheckIcon fontSize="small" color="success" />
            ) : previewStage.phase === 'failed' ? (
              <RestartAltIcon fontSize="small" color="error" />
            ) : (
              <>
                <HourglassTopIcon fontSize="small" color="warning" sx={{
                  animation: 'composerHourglassRotate 1.5s linear infinite',
                  '@keyframes composerHourglassRotate': {
                    '0%':   { transform: 'rotate(0deg)' },
                    '50%':  { transform: 'rotate(180deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                  },
                }} />
                <CircularProgress size={14} thickness={6} />
              </>
            )}
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', color: '#0f172a' }}>
                {previewStage.phase === 'applying'   && '⏳ 산출물 적용'}
                {previewStage.phase === 'compiling'  && '⏳ 백엔드 컴파일'}
                {previewStage.phase === 'restarting' && '🔄 백엔드 재기동'}
                {previewStage.phase === 'autofixing' && '🤖 AI 자동보완'}
                {previewStage.phase === 'ready'      && '✅ 실행 준비 완료'}
                {previewStage.phase === 'failed'     && '⚠ 실행 준비 실패'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                {previewStage.message}
                {previewStage.elapsedMs > 0 && (
                  <Box component="span" sx={{ ml: 1, fontFamily: 'monospace' }}>
                    ({Math.round(previewStage.elapsedMs / 1000)}s)
                  </Box>
                )}
              </Typography>
            </Box>
            {previewStage.phase === 'failed' && previewStage.targetUrl && (
              <Button size="small" variant="outlined" color="info"
                      href={previewStage.targetUrl} target="_blank" rel="noopener noreferrer">
                새 창에서 열기
              </Button>
            )}
            <Button size="small" color="inherit" onClick={handlePreviewCancel}>
              닫기
            </Button>
          </Stack>
        </Box>
      )}

      {/* ───── 본문 — 좌측 (작업내역 ↔ 산출물 트리) | 우측 (Tab: 미리보기 / 소스) ───── */}
      <SplitPane
        direction="horizontal"
        initial={32}  /* 좌측 32%, 우측 68% (요청대로 우측이 큰 영역) */
        min={20} max={55}
        first={
          <SplitPane
            direction="vertical"
            initial={55}  /* 위 (산출물 트리) 55%, 아래 (작업내역) 45% */
            min={20} max={75}
            first={
              <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', bgcolor: '#fcfcfd' }}>
                <ArtifactTreeView
                  sessionId={session.id}
                  refreshKey={refreshKey}
                  selectedId={selectedArtifactId}
                  onSelect={(id) => {
                    setSelectedArtifactId(id);
                    setRightTab(1);  /* 산출물 클릭 시 자동으로 소스 탭 이동 */
                  }}
                />
              </Box>
            }
            second={
              <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', bgcolor: '#fff', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                <ChatPanel
                  ref={chatRef}
                  sessionId={session.id}
                  onNewAssistantMsg={triggerRefresh}
                  initialPrompt={initialPrompt}
                  initialAttachments={initialAttachments}
                />
              </Box>
            }
          />
        }
        second={
          <Box sx={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', bgcolor: '#fff', borderLeft: '1px solid rgba(0,0,0,0.06)' }}>
            <Box sx={{ borderBottom: '1px solid rgba(0,0,0,0.08)', bgcolor: '#fff',
                       display: 'flex', alignItems: 'center' }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Tabs
                  value={rightTab}
                  onChange={(_, v) => setRightTab(v)}
                  variant="standard"
                  sx={{
                    minHeight: 36,
                    '& .MuiTab-root': { minHeight: 36, py: 0.5, textTransform: 'none', fontWeight: 600 },
                  }}
                >
                  <Tab
                    icon={<LaunchIcon fontSize="small" />}
                    iconPosition="start"
                    label={
                      <Stack direction="row" alignItems="center" spacing={0.6}>
                        <span>실행 화면</span>
                        {previewMeta && (
                          <Chip size="small" color="success" label="LIVE"
                                sx={{ height: 16, fontSize: 9, fontWeight: 700 }} />
                        )}
                      </Stack>
                    }
                  />
                  <Tab
                    icon={<CodeIcon fontSize="small" />}
                    iconPosition="start"
                    label="산출물 소스"
                  />
                </Tabs>
              </Box>
              {/* 새창열기 — 실행 화면이 떠 있을 때만 활성. 클릭 시 preview URL 을 새 브라우저 탭으로 */}
              <Tooltip title={previewMeta
                  ? '실행 화면을 새 창으로 열기 (전체화면 보기)'
                  : '먼저 [화면 실행] 버튼을 눌러 실행 화면을 띄우세요'}>
                <span>
                  <IconButton
                    size="small"
                    disabled={!previewMeta}
                    onClick={() => {
                      if (!session?.id || !previewMeta?.viewSub) return;
                      // PreviewLoader 는 /preview/<sessionId>/<viewSub> URL 을 받아
                      // preview/runtime.js 로 산출물 격리 로드. viewSub 의 `.jsx` 는 자동 제거됨.
                      const vs = String(previewMeta.viewSub).replace(/\.jsx$/i, '');
                      window.open(`/preview/${session.id}/${vs}`,
                                  '_blank', 'noopener,noreferrer');
                    }}
                    sx={{ mx: 0.5, color: '#475569',
                          '&:hover': { bgcolor: 'rgba(0,0,0,0.06)' } }}
                  >
                    <OpenInNewIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
            <Box sx={{ flex: 1, minHeight: 0, display: rightTab === 0 ? 'flex' : 'none', flexDirection: 'column' }}>
              <PreviewEmbed
                sessionId={session?.id}
                sid8={previewMeta?.sid8}
                viewSub={previewMeta?.viewSub}
                reloadNonce={previewNonce}
                onError={handlePreviewError}
                autoFixing={autoFixActive}
                autoFixLabel={autoFixLabel}
              />
            </Box>
            <Box sx={{ flex: 1, minHeight: 0, display: rightTab === 1 ? 'flex' : 'none', flexDirection: 'column' }}>
              <ArtifactCodeView selectedId={selectedArtifactId} />
            </Box>
          </Box>
        }
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.severity === 'success' ? 5000 : null}
        onClose={(_, reason) => {
          if (reason === 'clickaway' && snackbar.severity !== 'success') return;
          setSnackbar((s) => ({ ...s, open: false }));
        }}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled"
               onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
               sx={{ minWidth: 380 }}>
          {snackbar.title && <AlertTitle sx={{ fontWeight: 700 }}>{snackbar.title}</AlertTitle>}
          {snackbar.message}
        </Alert>
      </Snackbar>

      <MenuRegistrationDialog
        open={menuDialogOpen}
        sessionId={session.id}
        onClose={() => setMenuDialogOpen(false)}
      />
      <ArtifactApplyDialog
        open={applyDialogOpen}
        sessionId={session.id}
        onClose={() => setApplyDialogOpen(false)}
      />
    </Box>
  );
}

export default ComposerWorkspace;
