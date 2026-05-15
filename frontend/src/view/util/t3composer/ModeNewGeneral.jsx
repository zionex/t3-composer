import React, { useState, useMemo, useEffect, useRef } from 'react';

import {
  Box,
  Button,
  TextField,
  Typography,
  Stack,
  Paper,
  Chip,
  Alert,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChatIcon from '@mui/icons-material/Chat';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import StorageIcon from '@mui/icons-material/Storage';
import ViewQuiltIcon from '@mui/icons-material/ViewQuilt';
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsightsIcon from '@mui/icons-material/Insights';
import BoltIcon from '@mui/icons-material/Bolt';
import DiamondIcon from '@mui/icons-material/Diamond';

import { createSession, extractAndLookupTables } from './api';
import { getModule } from './constants';
import ModuleSelector from './ModuleSelector';
import ComposerWorkspace from './ComposerWorkspace';
import StepByStepWizard from './StepByStepWizard';
import MockupPickerDialog    from './MockupPickerDialog';
import UiPatternPickerDialog from './UiPatternPickerDialog';
import KpiChartPickerDialog  from './KpiChartPickerDialog';
import { useTargetStore } from './targetStore';

/**
 * AI 엔진(모델) 선택지 — Anthropic Claude.
 * id 는 백엔드 ComposerService 가 createSession.modelName 으로 받아 그대로 Anthropic API 에 전달.
 *
 * 정책 (CLAUDE.md / ComposerService.DEFAULT_MODEL):
 *   - Opus 4.7  = 기본값. 고품질 — 복잡 로직·고난이도 화면에 적합 (출력 많으면 다소 느림)
 *   - Sonnet 4.6 = 빠름. 속도·비용 우선
 */
const MODEL_OPTIONS = [
  {
    id:    'claude-sonnet-4-6',
    label: 'Sonnet',
    sub:   'Sonnet 4.6 — 빠름',
    desc:  '속도·비용·품질 균형. 빠른 생성이 필요할 때.',
    Icon:  BoltIcon,
    color: '#7CA7E0',
  },
  {
    id:    'claude-opus-4-7',
    label: 'Opus',
    sub:   'Opus 4.7 — 기본값 (고품질)',
    desc:  '복잡 로직·고난이도 화면에 적합. 출력이 매우 많으면(16K+) 응답에 3~5분+ 소요될 수 있음.',
    Icon:  DiamondIcon,
    color: '#9D8FD4',
  },
];

const DEFAULT_MODEL_ID = 'claude-opus-4-7';

/**
 * 선택된 SCM UI Mockup 이 Chart/Dashboard 류인지 판별 — KPI/Chart 사전 선택 트리거 노출 여부.
 * layoutCategory(LAYOUT_*) 또는 patternCode 에 chart/dashboard/widget/kpi 포함 시 true.
 */
function isChartLikeMockup(m) {
  if (!m) return false;
  const cat  = (m.layoutCategory || '').toUpperCase();
  const code = (m.patternCode    || '').toLowerCase();
  if (cat === 'LAYOUT_MONITORING' || cat === 'LAYOUT_CONTROLBOARD') return true;
  return /(chart|dashboard|widget|kpi)/.test(code);
}

/**
 * 선택된 UI Pattern (T3MES 카탈로그) 이 Chart/Dashboard 류인지 판별.
 * 파일/그룹/라벨에 monitoring·dashboard·controlboard·chart·kpi 포함 시 true.
 */
function isChartLikeUiPattern(p) {
  if (!p) return false;
  const hay = `${p.file || ''} ${p.group || ''} ${p.tabLabel || ''}`.toLowerCase();
  return /(monitoring|dashboard|controlboard|chart|kpi|대시보드|모니터링|차트)/.test(hay);
}

const EXAMPLE_PROMPTS = {
  DP: [
    '거래처별 월별 수요 계획 입력 화면 — 크로스탭 피벗. P06 패턴',
    '수요 계획 실적 분석 — 상단 그리드 + 하단 트렌드 차트. P05 패턴',
  ],
  MP: [
    '자원 가동 현황 간트 차트 — 시간 단위 조정 가능. P09 패턴',
    'MP 시뮬레이션 결과 요약 · 상세 탭. P03 패턴',
  ],
  FP: [
    'FP 작업 지시 모니터링 대시보드 — KPI + 차트. P01 패턴',
    '자원별 생산 계획 간트. P09 패턴',
  ],
  RP: [
    '보충 주문 확정 조회 — 검색 + 단일 그리드. P02 패턴',
    '보충 계획 피벗 입력. P06 패턴',
  ],
  BF: [
    '예측 정확도 분석 — 그리드 + 트렌드 차트. P05 패턴',
    'BF 컨트롤보드 · 버전 관리. P07 패턴',
  ],
  IM: [
    '안전재고 · 목표재고 정책 관리 — 검색 + 그리드. P02 패턴',
    'ABC/XYZ 분석 차트 + 리스트. P05 패턴',
  ],
  SA: [
    'S&OP 회의 안건 관리. P01 패턴',
    '판매 실적 집계 대시보드. P01 패턴',
  ],
  SO: [
    '판매 주문 조회. P02 패턴',
  ],
  CM: [
    '품목 마스터 관리 — 검색 + 단일 그리드. P02 패턴',
    '거점/창고 계층 — 수평 스플릿. P04 패턴',
  ],
  AD: [
    '사용자 관리 — 검색 + 그리드 + 역할 할당. P04 패턴',
    '메뉴 관리 — 트리 + 상세. P04 패턴',
  ],
  UT: [
    '공지사항 관리 — 검색 + 그리드. P02 패턴',
    '이슈 관리 대시보드. P01 패턴',
  ],
};

/**
 * 신규 개발 — 일반 생성.
 *
 * 3단계 진입:
 *   ① 서브모드 선택 (자연어 vs 단계별)
 *   ② 모듈 선택 (대그룹)
 *   ③ 경로별 진행
 *      - 자연어: NL 입력 → 세션 생성 → Workspace
 *      - 단계별: StepByStepWizard 로 위임 (내부에서 module 재사용)
 */
function ModeNewGeneral({ onBack, startWith = null }) {
  // startWith === 'NL'   → 자연어 모드로 바로 진입 (서브모드 선택 스킵)
  // startWith === 'STEP' → 단계별 Wizard 로 바로 진입
  // startWith === null   → 서브모드 선택 화면 표시 (구 동작)
  const [subMode, setSubMode] = useState(startWith);
  const [moduleCode, setModuleCode] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [session, setSession] = useState(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);
  // D&D 첨부 — 텍스트 파일은 prompt 에 inline 추가, binary 는 attachments state.
  //   binary 는 Phase 2 에서 backend AnthropicClient 의 content blocks 로 진짜 multi-modal 전송 예정.
  const [attachments, setAttachments] = useState([]);   // [{ name, mediaType, base64, sizeKb }]
  const [dragOver, setDragOver]       = useState(false);

  // 테이블 자동 lookup 상태 — prompt 안의 TB_* 패턴을 디바운스 후 백엔드 INFORMATION_SCHEMA 조회
  const [tableLookup, setTableLookup] = useState({ extracted: [], results: {}, formattedForPrompt: '' });
  const [tableLookupLoading, setTableLookupLoading] = useState(false);
  const lookupDebounceRef = useRef(null);

  // 선택사항 (1) — SCM UI Mockup 참조 ([SCM UI Mockup] 메뉴의 MOCKUP_ENTRIES)
  const [selectedMockup, setSelectedMockup] = useState(null);
  const [mockupDlgOpen,  setMockupDlgOpen]  = useState(false);

  // 선택사항 (2) — UI Pattern 참조 ([UI Pattern] 메뉴의 T3MES 카탈로그 entry)
  // selectedUiPatternSource: 선택 시 fetch 한 경량 HTML(lite) 마크업 — Claude 레이아웃 참조용
  const [selectedUiPattern,       setSelectedUiPattern]       = useState(null);
  const [selectedUiPatternSource, setSelectedUiPatternSource] = useState('');
  const [uiPatternDlgOpen,        setUiPatternDlgOpen]        = useState(false);

  // KPI / Chart 사전 다중 선택 — 선택한 Mockup/UI Pattern 이 Chart/Dashboard 류일 때만 트리거 노출
  // selectedKpis / selectedCharts: [{ code, name, category }]
  const [selectedKpis,    setSelectedKpis]    = useState([]);
  const [selectedCharts,  setSelectedCharts]  = useState([]);
  const [kpiDlgOpen,      setKpiDlgOpen]      = useState(false);

  // AI 엔진(모델) 선택 — 기본 Sonnet 4.6, 사용자가 Opus 4.7 로 전환 가능
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL_ID);

  // 하단 전용 D&D 영역 — 클릭 시 파일 탐색기, drop 시 첨부
  const fileInputRef = useRef(null);
  const [bottomDragOver, setBottomDragOver] = useState(false);

  const showKpiTrigger = isChartLikeMockup(selectedMockup) || isChartLikeUiPattern(selectedUiPattern);

  const module = useMemo(() => getModule(moduleCode), [moduleCode]);

  const examples = moduleCode ? (EXAMPLE_PROMPTS[moduleCode] || []) : [];

  // prompt 변경 시 600ms 디바운스 후 자동 테이블 lookup (NEW_NL 모드 진입 단계)
  useEffect(() => {
    if (subMode !== 'NL' || !prompt || !prompt.trim()) {
      setTableLookup({ extracted: [], results: {}, formattedForPrompt: '' });
      return undefined;
    }
    if (lookupDebounceRef.current) clearTimeout(lookupDebounceRef.current);
    lookupDebounceRef.current = setTimeout(async () => {
      setTableLookupLoading(true);
      try {
        const res = await extractAndLookupTables(prompt);
        setTableLookup({
          extracted: res?.data?.extractedNames || [],
          results: res?.data?.results || {},
          formattedForPrompt: res?.data?.formattedForPrompt || '',
        });
      } catch (e) {
        // lookup 실패해도 세션 생성 자체는 진행 가능 — 콘솔 로그만
        // eslint-disable-next-line no-console
        console.warn('[Composer] 테이블 자동 lookup 실패:', e?.message || e);
      } finally {
        setTableLookupLoading(false);
      }
    }, 600);
    return () => {
      if (lookupDebounceRef.current) clearTimeout(lookupDebounceRef.current);
    };
  }, [prompt, subMode]);

  const reset = () => {
    // startWith 로 고정 진입한 경우엔 서브모드는 유지 (모듈·프롬프트만 초기화)
    if (!startWith) setSubMode(null);
    setModuleCode(null);
    setPrompt('');
    setSession(null);
    setError(null);
    setSelectedMockup(null);
    setSelectedUiPattern(null);
    setSelectedUiPatternSource('');
    setSelectedKpis([]);
    setSelectedCharts([]);
    setSelectedModel(DEFAULT_MODEL_ID);
  };

  // ─── D&D 파일 첨부 ──────────────────────────────────────────────
  const TEXT_EXTS = React.useMemo(() => new Set([
    'txt','md','markdown','jsx','tsx','js','ts','mjs','java','kt','scala',
    'sql','json','yaml','yml','xml','html','htm','css','scss','less',
    'csv','tsv','sh','ps1','bat','conf','properties','toml','ini','env',
    'log','gradle','dockerfile','py','rb','go','rs','c','cpp','h','hpp','svg',
  ]), []);

  const isTextFile = (file) => {
    if (file.type && file.type.startsWith('text/')) return true;
    if (file.type && /(json|xml|yaml|x-sh|x-shellscript|svg\+xml)/.test(file.type)) return true;
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    return TEXT_EXTS.has(ext);
  };

  const readAsText = (file) => new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsText(file);
  });

  const readAsBase64 = (file) => new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const url = String(r.result || '');
      const m = /^data:([^;]+);base64,(.+)$/.exec(url);
      if (m) resolve({ mediaType: m[1], base64: m[2] });
      else reject(new Error('invalid data url'));
    };
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });

  const handleFilesPicked = async (files) => {
    const arr = Array.from(files || []);
    if (arr.length === 0) return;
    // ★ 3개 기능 단독 적용 — 파일 첨부 시 Mockup·UI Pattern 선택 해제
    setSelectedMockup(null);
    setSelectedUiPattern(null);
    setSelectedUiPatternSource('');
    for (const file of arr) {
      try {
        const sizeKb = Math.round(file.size / 1024);
        if (file.size > 5 * 1024 * 1024) {     // 5MB 한 파일당
          setError(`파일이 너무 큽니다 (${sizeKb}KB > 5MB): ${file.name}`);
          continue;
        }
        if (isTextFile(file)) {
          // 텍스트는 chip 으로만 노출 — 전송 직전 prompt 본문에 inline 합쳐서 보냄
          const text = await readAsText(file);
          const lang = (file.name.split('.').pop() || '').toLowerCase();
          setAttachments((prev) => [...prev, {
            kind: 'text', name: file.name, mediaType: file.type || 'text/plain',
            sizeKb, lang, text,
          }]);
        } else {
          const { mediaType, base64 } = await readAsBase64(file);
          setAttachments((prev) => [...prev, {
            kind: 'binary', name: file.name, mediaType, base64, sizeKb,
          }]);
        }
      } catch (err) {
        setError(`파일 읽기 실패: ${file?.name || ''}: ${err?.message || err}`);
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragOver(false);
    handleFilesPicked(e.dataTransfer?.files);
  };
  const handleDragOver  = (e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); };
  const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); };
  const removeAttachment = (idx) => setAttachments((prev) => prev.filter((_, i) => i !== idx));

  const startNlSession = async () => {
    if (!prompt.trim()) {
      setError('요구사항을 입력해주세요.');
      return;
    }
    setStarting(true);
    setError(null);
    try {
      const res = await createSession({
        mode: 'NEW_NL',
        title: `[${module.code}] ${prompt.slice(0, 60)}`,
        modelName: selectedModel,
        targetCd: useTargetStore.getState().currentTargetCd,
      });
      setSession(res.data);
    } catch (e) {
      setError(e?.response?.data?.message || e?.response?.data?.error || e?.message || '세션 생성 실패');
    } finally {
      setStarting(false);
    }
  };

  // 자연어 모드 진입 완료 → Workspace
  if (session) {
    let systemContext = `[모듈: ${module.code} (${module.nameKo})]\n`
      + `공통 테이블 접두어: TB_${module.code}_  /  SP 접두어: SP_UI_${module.code}_\n`
      + `이 모듈에 자주 쓰이는 공통 테이블: ${module.commonTables.join(', ')}\n`;

    // 사용자가 선택한 SCM UI Mockup — Claude 가 레이아웃 골격으로 참조
    if (selectedMockup) {
      systemContext += '\n=== 참조 SCM UI Mockup (레이아웃 골격) ===\n';
      systemContext += `- Mockup 코드: ${selectedMockup.patternCode}\n`;
      systemContext += `- 라벨: ${selectedMockup.patternLabel}\n`;
      systemContext += `- 레이아웃 카테고리: ${selectedMockup.layoutCategory}\n`;
      if (selectedMockup.category)    systemContext += `- 분류: ${selectedMockup.category}\n`;
      if (selectedMockup.description) systemContext += `- 설명: ${selectedMockup.description}\n`;
      systemContext += '⚠ 이 Mockup 의 레이아웃 골격(분할 구조·영역 구성)을 화면 기본 틀로 사용하세요.\n';
    }

    // 사용자가 선택한 UI Pattern — T3MES 카탈로그의 경량 HTML 마크업을 레이아웃 참조로 첨부
    if (selectedUiPattern) {
      systemContext += '\n=== 참조 UI Pattern (T3MES 카탈로그) ===\n';
      systemContext += `- 분류: ${selectedUiPattern.section} > ${selectedUiPattern.group} > ${selectedUiPattern.fileLabel}\n`;
      if (selectedUiPattern.tabLabel) systemContext += `- 패턴: ${selectedUiPattern.tabLabel}\n`;
      if (selectedUiPatternSource) {
        const src = selectedUiPatternSource.length > 20000
          ? selectedUiPatternSource.slice(0, 20000) + '\n<!-- (이하 생략) -->'
          : selectedUiPatternSource;
        systemContext += '아래는 이 UI Pattern 의 경량 마크업 구조입니다 (영역 배치·표/카드 구성 참고용):\n';
        systemContext += '```html\n' + src + '\n```\n';
      }
      systemContext += '⚠ 위 UI Pattern 의 화면 구성을 참고하되, 실제 산출물은 wingui 표준 컴포넌트(BaseGrid 등)로 구현하세요.\n';
    }

    // KPI / Chart 사전 선택 — Chart/Dashboard 패턴일 때 위젯 구성에 반영
    if (selectedKpis.length > 0 || selectedCharts.length > 0) {
      systemContext += '\n=== 사용자 선택 KPI / Chart 사전 항목 (위젯·차트 구성에 반영) ===\n';
      if (selectedKpis.length > 0) {
        systemContext += `[KPI ${selectedKpis.length}개]\n`;
        selectedKpis.forEach((k) => {
          systemContext += `  · ${k.code}${k.category ? ` (${k.category})` : ''} — ${k.name || k.code}\n`;
        });
      }
      if (selectedCharts.length > 0) {
        systemContext += `[Chart Type ${selectedCharts.length}개]\n`;
        selectedCharts.forEach((c) => {
          systemContext += `  · ${c.code}${c.category ? ` (${c.category})` : ''} — ${c.name || c.code}\n`;
        });
      }
      systemContext += '⚠ 위 항목을 화면의 위젯·차트로 배치하세요. 없는 KPI/Chart 를 임의로 추가하지 말 것.\n';
    }

    // 테이블 자동 lookup 결과를 prompt 컨텍스트에 첨부 — LLM 이 어떤 테이블이 이미
    // 존재하는지 + 컬럼 명세를 알고 SP_UI_*.sql DDL 작성 시 정확한 컬럼명 사용
    if (tableLookup.formattedForPrompt) {
      systemContext += '\n' + tableLookup.formattedForPrompt + '\n';
    }

    // D&D 첨부 분리 — 텍스트는 prompt 본문에 inline, binary 만 attachments 로 전송
    const textAttachs   = attachments.filter((a) => a && a.kind === 'text');
    const binaryAttachs = attachments.filter((a) => a && a.kind === 'binary');
    let textInline = '';
    for (const t of textAttachs) {
      textInline += `\n\n=== 첨부 파일: ${t.name} ===\n\`\`\`${t.lang || ''}\n${t.text}\n\`\`\`\n`;
    }

    return (
      <ComposerWorkspace
        session={session}
        initialPrompt={systemContext + '\n' + prompt + textInline}
        initialAttachments={binaryAttachs}
        extraHeader={
          <Button size="small" startIcon={<ArrowBackIcon fontSize="small" />} onClick={onBack} sx={{ mr: 1 }}>
            종료
          </Button>
        }
      />
    );
  }

  // 단계별 Wizard 로 위임
  if (subMode === 'STEP') {
    return (
      <StepByStepWizard
        initialModuleCode={moduleCode}
        onBack={() => {
          if (startWith === 'STEP') {
            // 고정 진입한 경우 메인 모드 선택으로 복귀
            onBack?.();
          } else {
            setSubMode(null);
            setModuleCode(null);
          }
        }}
      />
    );
  }

  // ----- 공용 헤더 -----
  const Header = (
    <Stack direction="row" alignItems="center" sx={{ px: 2, py: 1, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
      <Button startIcon={<ArrowBackIcon fontSize="small" />} onClick={onBack} size="small">
        모드 선택
      </Button>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ ml: 2 }}>
        <AutoAwesomeIcon sx={{ color: startWith === 'STEP' ? '#7c3aed' : '#059669' }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {startWith === 'NL'   ? '자연어 기반 신규 생성'
           : startWith === 'STEP' ? '단계별 생성'
           : '신규 개발 — 일반 생성'}
        </Typography>
      </Stack>
      {subMode && module && (
        <Chip
          label={`${module.code} · ${module.nameKo}`}
          size="small"
          sx={{ ml: 2, bgcolor: `${module.color}22`, color: module.color, fontWeight: 500 }}
        />
      )}
      {subMode === 'NL' && (
        <Button size="small" onClick={reset} sx={{ ml: 'auto' }}>
          처음부터 다시
        </Button>
      )}
    </Stack>
  );

  // ----- Phase 1: 서브모드 선택 -----
  if (!subMode) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        {Header}
        <Box sx={{ p: 4, maxWidth: 1100, mx: 'auto', flex: 1, overflow: 'auto' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            생성 방식을 선택하세요.
          </Typography>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
            <SubModeCard
              title="자연어 기반 생성"
              subtitle="Natural Language"
              icon={ChatIcon}
              color="#2a9d8f"
              description="요구사항을 자연어로 설명하면 Claude 가 패턴·스펙·코드를 한 번에 결정해 생성합니다. 빠르고 유연하지만 토큰 사용량이 많습니다."
              pros={['빠른 시작', '유연한 표현', '설계 미확정 시 적합']}
              cons={['토큰 사용량 많음', '결과 해석 비용', '반복 수정 시 비용 누적']}
              onClick={() => setSubMode('NL')}
            />
            <SubModeCard
              title="Step 별 선택 생성"
              subtitle="Step-by-step Wizard"
              icon={PlaylistAddCheckIcon}
              color="#5281b3"
              description="모듈 → 패턴 → 개요 → Layer별 SP 를 단계별로 구체화한 후 구조화된 스펙으로 Claude 를 호출합니다. 토큰 사용이 크게 절약됩니다."
              pros={['토큰 절약 (50%+)', '일관된 결과', 'SP 별 미세조정 가능']}
              cons={['입력 단계 많음', '완전히 새로운 패턴엔 제약']}
              onClick={() => setSubMode('STEP')}
            />
          </Stack>
        </Box>
      </Box>
    );
  }

  // ----- Phase 2 (NL): 모듈 선택 -----
  if (subMode === 'NL' && !moduleCode) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        {Header}
        <Box sx={{ p: 4, maxWidth: 1100, mx: 'auto', flex: 1, overflow: 'auto' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            모듈 선택
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            생성할 화면이 속한 모듈을 선택하세요. 모듈별 네이밍 규약과 공통 테이블을 Claude 에 자동 주입합니다.
          </Typography>
          <ModuleSelector value={moduleCode} onChange={setModuleCode} />
        </Box>
      </Box>
    );
  }

  // ----- Phase 3 (NL): 자연어 입력 -----
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {Header}
      <Box sx={{ p: 4, maxWidth: 1000, mx: 'auto', flex: 1, overflow: 'auto' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            요구사항 입력
          </Typography>
          <Button size="small" onClick={() => setModuleCode(null)}>
            모듈 변경
          </Button>
        </Stack>

        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, mb: 3 }}>
          {/* D&D wrapper — drop 시 텍스트 파일은 prompt inline, 그 외는 attachments chip */}
          <Box
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            sx={{
              position: 'relative',
              borderRadius: 1,
              ...(dragOver && {
                outline: '2px dashed #7CA7E0',
                outlineOffset: 2,
                bgcolor: 'rgba(124,167,224,0.06)',
              }),
              mb: 2,
            }}
          >
            <TextField
              fullWidth
              multiline
              minRows={6}
              placeholder={`예: ${examples[0] || '원하는 화면 설명을 입력... (TB_AD_USER 등 테이블명을 언급하면 자동으로 존재 여부를 확인합니다)'}\n\n💡 참조 파일은 아래 "참조 파일 첨부" 영역에 끌어다 놓으세요`}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              autoFocus
            />
            {dragOver && (
              <Box sx={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700, color: '#5683C0',
                bgcolor: 'rgba(124,167,224,0.12)', borderRadius: 1,
              }}>
                파일을 여기에 놓으세요
              </Box>
            )}
          </Box>

          {/* 첨부된 파일 chip 은 하단 "참조 파일 첨부" 영역에 표시 */}

          {/* AI 엔진(모델) 선택 — Sonnet(기본) / Opus */}
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap"
                 sx={{ mb: 2, p: 1.5, bgcolor: 'rgba(124,167,224,0.06)', borderRadius: 1.5,
                       border: '1px solid rgba(124,167,224,0.25)' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              AI 엔진:
            </Typography>
            <ToggleButtonGroup
              value={selectedModel}
              exclusive
              onChange={(_, v) => v && setSelectedModel(v)}
              size="small"
            >
              {MODEL_OPTIONS.map((m) => {
                const sel = selectedModel === m.id;
                return (
                  <Tooltip key={m.id} title={m.desc} arrow placement="top">
                    <ToggleButton
                      value={m.id}
                      sx={{
                        textTransform: 'none', px: 2, py: 0.7,
                        border: '1.5px solid rgba(124,167,224,0.35)',
                        color: '#9aa7bd',          // 미선택 — 흐린 회색
                        bgcolor: '#fff',
                        transition: 'all .15s ease',
                        '&:hover': { bgcolor: '#f2f6fc' },
                        // 선택 엔진 — 진한 단색 배경 + 흰 글자 + 그림자 로 한눈에 구분
                        '&.Mui-selected, &.Mui-selected:hover': {
                          bgcolor: m.color,
                          color: '#fff',
                          borderColor: m.color,
                          fontWeight: 800,
                          boxShadow: `0 4px 12px -2px ${m.color}aa`,
                        },
                        '&.Mui-selected .MuiTypography-root': { color: 'rgba(255,255,255,0.95)' },
                      }}
                    >
                      {sel
                        ? <CheckCircleIcon fontSize="small" sx={{ mr: 0.7 }} />
                        : <m.Icon fontSize="small" sx={{ mr: 0.7 }} />}
                      <Stack alignItems="flex-start" spacing={0} sx={{ lineHeight: 1.15 }}>
                        <span style={{ fontWeight: 700 }}>{m.label}</span>
                        <Typography variant="caption" sx={{ fontSize: 10, opacity: 0.9 }}>
                          {sel ? '✓ 현재 선택' : m.sub}
                        </Typography>
                      </Stack>
                    </ToggleButton>
                  </Tooltip>
                );
              })}
            </ToggleButtonGroup>
            {/* 선택 확인 — 텍스트 칩으로도 명시 */}
            {(() => {
              const cur = MODEL_OPTIONS.find((m) => m.id === selectedModel);
              if (!cur) return null;
              return (
                <Chip
                  size="small"
                  icon={<cur.Icon sx={{ fontSize: 14, color: cur.color + ' !important' }} />}
                  label={`선택됨 · ${cur.label}`}
                  sx={{
                    height: 24, fontWeight: 700, fontSize: 11.5,
                    color: cur.color,
                    bgcolor: `${cur.color}1f`,
                    border: `1.5px solid ${cur.color}`,
                  }}
                />
              );
            })()}
          </Stack>

          {/* SCM UI Mockup / UI Pattern / KPI / Chart 사전 선택 (선택사항) */}
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap"
                 sx={{ mb: 2, p: 1.5, bgcolor: 'rgba(124,167,224,0.06)', borderRadius: 1.5,
                       border: '1px dashed rgba(124,167,224,0.35)', gap: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              선택사항:
            </Typography>

            {/* (1) SCM UI Mockup 선택 트리거 — [SCM UI Mockup] 메뉴 카탈로그 */}
            <Button
              size="small"
              variant={selectedMockup ? 'contained' : 'outlined'}
              startIcon={<DashboardCustomizeIcon fontSize="small" />}
              onClick={() => setMockupDlgOpen(true)}
              color="primary"
            >
              {selectedMockup ? `Mockup: ${selectedMockup.patternCode}` : 'SCM UI Mockup 선택'}
            </Button>
            {selectedMockup && (
              <Chip
                size="small" label="해제"
                onClick={() => setSelectedMockup(null)}
                sx={{ height: 22 }}
              />
            )}

            {/* (2) UI Pattern 선택 트리거 — [UI Pattern] 메뉴 T3MES 카탈로그 */}
            <Button
              size="small"
              variant={selectedUiPattern ? 'contained' : 'outlined'}
              startIcon={<ViewQuiltIcon fontSize="small" />}
              onClick={() => setUiPatternDlgOpen(true)}
              color="secondary"
            >
              {selectedUiPattern
                ? `Pattern: ${(selectedUiPattern.tabLabel || selectedUiPattern.fileLabel || '').slice(0, 22)}`
                : 'UI Pattern 선택'}
            </Button>
            {selectedUiPattern && (
              <Chip
                size="small" label="해제"
                onClick={() => { setSelectedUiPattern(null); setSelectedUiPatternSource(''); }}
                sx={{ height: 22 }}
              />
            )}

            {/* Chart/Dashboard 패턴일 때만 KPI/Chart 사전 선택 트리거 노출 */}
            {showKpiTrigger && (() => {
              const totalSel = selectedKpis.length + selectedCharts.length;
              const needsAttention = totalSel === 0;  // chart 패턴 + 미선택 → 강조
              return (
                <>
                  <Box sx={{ width: 1, height: 24, bgcolor: 'rgba(0,0,0,0.12)' }} />
                  <Button
                    size="small"
                    variant={totalSel > 0 ? 'contained' : 'outlined'}
                    startIcon={<InsightsIcon fontSize="small" />}
                    onClick={() => setKpiDlgOpen(true)}
                    color="secondary"
                    sx={needsAttention ? {
                      // 미선택 상태에서 미세한 pulse — 사용자에게 핵심 항목임을 시각적 안내.
                      // boxShadow 가 0 ~ 8px 사이를 1.6초 주기로 호흡하듯 변화.
                      borderColor: '#9333ea',
                      borderWidth: 1.5,
                      animation: 'kpiPulse 1.6s ease-in-out infinite',
                      '@keyframes kpiPulse': {
                        '0%, 100%': { boxShadow: '0 0 0 0 rgba(147,51,234,0)' },
                        '50%':      { boxShadow: '0 0 0 6px rgba(147,51,234,0.18)' },
                      },
                    } : undefined}
                  >
                    {totalSel > 0
                      ? `KPI ${selectedKpis.length} · Chart ${selectedCharts.length}`
                      : 'KPI / Chart 사전 항목 선택'}
                  </Button>
                </>
              );
            })()}

            <Typography variant="caption" color="text.disabled" sx={{ ml: 'auto' }}>
              SCM UI Mockup · UI Pattern · 파일 첨부는 1개만 적용됩니다 (단독)
            </Typography>
          </Stack>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" color="text.secondary">
              Claude 는 모듈 규약(TB_{module.code}_ / SP_UI_{module.code}_)에 맞춰 생성합니다.
            </Typography>
            <Button
              variant="contained"
              onClick={startNlSession}
              disabled={starting || !prompt.trim()}
              startIcon={<AutoAwesomeIcon />}
            >
              {starting ? '세션 생성 중...' : 'Claude 에게 생성 요청'}
            </Button>
          </Stack>
        </Paper>

        {/* ── 하단 전용 참조 파일 첨부 (D&D) 영역 ──
            prompt 창과 분리된 명확한 drop zone. drop 또는 클릭(파일 탐색기) 으로 첨부. */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => { handleFilesPicked(e.target.files); e.target.value = ''; }}
        />
        <Paper
          variant="outlined"
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setBottomDragOver(true); }}
          onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setBottomDragOver(false); }}
          onDrop={(e) => {
            e.preventDefault(); e.stopPropagation();
            setBottomDragOver(false);
            handleFilesPicked(e.dataTransfer?.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          sx={{
            mb: 3, p: 2.5, borderRadius: 2, cursor: 'pointer',
            border: '2px dashed',
            borderColor: bottomDragOver ? '#7CA7E0' : 'rgba(124,167,224,0.35)',
            bgcolor: bottomDragOver ? 'rgba(124,167,224,0.10)' : 'rgba(255,255,255,0.45)',
            transition: 'all 0.15s',
            '&:hover': { borderColor: '#7CA7E0', bgcolor: 'rgba(124,167,224,0.06)' },
          }}
        >
          <Stack alignItems="center" spacing={0.5}>
            <CloudUploadIcon sx={{ fontSize: 32, color: bottomDragOver ? '#7CA7E0' : '#A6B2C4' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
              참조 파일 첨부 — 끌어다 놓거나 클릭
            </Typography>
            <Tooltip title="설계서·캡처·소스 등 참조 파일. 텍스트 파일은 prompt 에 inline, 이미지/PDF/binary 는 첨부로 전송 (파일당 최대 5MB)">
              <Typography variant="caption" color="text.secondary"
                          sx={{ textAlign: 'center', cursor: 'help',
                                borderBottom: '1px dotted', borderColor: 'divider' }}>
                드래그 또는 클릭 · 파일당 최대 5MB
              </Typography>
            </Tooltip>
          </Stack>

          {/* 첨부된 파일 chip — 텍스트/binary 모두 동일 UX, 아이콘만 다름 */}
          {attachments.length > 0 && (
            <Stack
              direction="row" spacing={0.8} flexWrap="wrap" justifyContent="center"
              sx={{ mt: 1.5, gap: 0.8 }}
              onClick={(e) => e.stopPropagation()}
            >
              {attachments.map((a, i) => {
                const icon = a.kind === 'text' ? '📄' : (/^image\//.test(a.mediaType) ? '🖼️' : '📎');
                return (
                  <Chip
                    key={`${a.name}-${i}`}
                    label={`${icon} ${a.name} (${a.sizeKb}KB)`}
                    size="small"
                    onDelete={() => removeAttachment(i)}
                    sx={{
                      bgcolor: a.kind === 'text' ? 'rgba(37,99,235,0.08)' : 'rgba(124,58,237,0.08)',
                      fontSize: 11,
                    }}
                  />
                );
              })}
            </Stack>
          )}
        </Paper>

        {/* SCM UI Mockup POPUP — [SCM UI Mockup] 메뉴 카탈로그에서 선택 */}
        <MockupPickerDialog
          open={mockupDlgOpen}
          onClose={() => setMockupDlgOpen(false)}
          currentValue={selectedMockup?.patternCode || null}
          onConfirm={(m) => {
            setSelectedMockup(m);
            setMockupDlgOpen(false);
            if (m) {
              // ★ 3개 기능 단독 적용 — Mockup 선택 시 UI Pattern·파일 첨부 해제
              setSelectedUiPattern(null);
              setSelectedUiPatternSource('');
              setAttachments([]);
            }
            const chartLike = isChartLikeMockup(m);
            // Chart/Dashboard 류가 아니면 이전 KPI/Chart 정리
            if (!chartLike) {
              setSelectedKpis([]);
              setSelectedCharts([]);
            }
            // 자동 chain — Chart/Dashboard 류 Mockup 확인 시 KPI/Chart POPUP 곧바로 띄움
            if (chartLike && selectedKpis.length === 0 && selectedCharts.length === 0) {
              setTimeout(() => setKpiDlgOpen(true), 160);
            }
          }}
        />

        {/* UI Pattern POPUP — [UI Pattern] 메뉴 T3MES 카탈로그에서 선택.
            확인 시 lite HTML 마크업을 fetch 해 systemContext 참조 소스로 사용 */}
        <UiPatternPickerDialog
          open={uiPatternDlgOpen}
          onClose={() => setUiPatternDlgOpen(false)}
          currentValue={selectedUiPattern ? `${selectedUiPattern.file}#${selectedUiPattern.tabIndex}` : null}
          onConfirm={async (p) => {
            setSelectedUiPattern(p);
            setUiPatternDlgOpen(false);
            if (p) {
              // ★ 3개 기능 단독 적용 — UI Pattern 선택 시 Mockup·파일 첨부 해제
              setSelectedMockup(null);
              setAttachments([]);
            }
            if (!isChartLikeUiPattern(p)) {
              setSelectedKpis([]);
              setSelectedCharts([]);
            }
            if (p && p.liteUrl) {
              try {
                const r = await fetch(p.liteUrl);
                setSelectedUiPatternSource(r.ok ? await r.text() : '');
              } catch {
                setSelectedUiPatternSource('');
              }
            } else {
              setSelectedUiPatternSource('');
            }
          }}
        />

        {/* KPI / Chart 사전 POPUP */}
        <KpiChartPickerDialog
          open={kpiDlgOpen}
          onClose={() => setKpiDlgOpen(false)}
          initialKpiCodes={selectedKpis.map((k) => k.code)}
          initialChartCodes={selectedCharts.map((c) => c.code)}
          onConfirm={({ kpis, charts }) => {
            setSelectedKpis(kpis);
            setSelectedCharts(charts);
            setKpiDlgOpen(false);
          }}
        />

        {/* 테이블 자동 lookup 결과 — prompt 안의 TB_* 패턴을 백엔드 INFORMATION_SCHEMA 조회 */}
        {(tableLookupLoading || tableLookup.extracted.length > 0) && (
          <Paper variant="outlined" sx={{
            p: 2, mb: 3, borderRadius: 2,
            borderColor: 'rgba(143,196,212,0.60)', bgcolor: 'rgba(143,196,212,0.08)',
          }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <StorageIcon fontSize="small" sx={{ color: '#6BA0B0' }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#5683C0' }}>
                자동 테이블 존재 여부 확인 (T3SMARTSCM.dbo)
              </Typography>
              {tableLookupLoading && <CircularProgress size={14} sx={{ color: '#6BA0B0' }} />}
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              prompt 안의 <code>TB_*</code> 테이블명을 백엔드 DB 에서 직접 조회 — 존재하면 기존 컬럼으로 Entity 매핑,
              없으면 새 SQL_DDL 산출물로 생성. 결과는 Claude prompt 컨텍스트에 자동 첨부됩니다.
            </Typography>
            {tableLookup.extracted.length === 0 && !tableLookupLoading && (
              <Typography variant="caption" color="text.secondary">
                (prompt 에서 <code>TB_*</code> 패턴 미발견 — 사용할 테이블명이 있으면 입력하세요)
              </Typography>
            )}
            {tableLookup.extracted.length > 0 && (
              <Stack spacing={0.5}>
                {tableLookup.extracted.map((name) => {
                  const info = tableLookup.results[name.toUpperCase()];
                  const exists = info?.exists;
                  const cols = info?.columns || [];
                  const pkCols = info?.primaryKeyColumns || [];
                  return (
                    <Box key={name} sx={{
                      p: 1, borderRadius: 1,
                      bgcolor: exists ? '#dcfce7' : '#fef3c7',
                      border: `1px solid ${exists ? '#16a34a' : '#d97706'}33`,
                    }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        {exists
                          ? <CheckCircleIcon fontSize="small" sx={{ color: '#16a34a' }} />
                          : <HighlightOffIcon fontSize="small" sx={{ color: '#d97706' }} />}
                        <Typography variant="body2" sx={{
                          fontFamily: 'monospace', fontWeight: 700,
                          color: exists ? '#166534' : '#92400e',
                        }}>
                          {name}
                        </Typography>
                        {exists && (
                          <>
                            <Chip size="small" label={`${cols.length} cols`}
                              sx={{ height: 18, fontSize: 10, bgcolor: '#bbf7d0', color: '#166534' }} />
                            {pkCols.length > 0 && (
                              <Chip size="small" label={`PK: ${pkCols.join(', ')}`}
                                sx={{ height: 18, fontSize: 10, fontFamily: 'monospace',
                                      bgcolor: '#dbeafe', color: '#1e40af' }} />
                            )}
                            {info?.approximateRowCount != null && (
                              <Typography variant="caption" color="text.secondary">
                                ~{info.approximateRowCount.toLocaleString()} rows
                              </Typography>
                            )}
                          </>
                        )}
                        {!exists && (
                          <Typography variant="caption" sx={{ color: '#92400e' }}>
                            존재하지 않음 — 새 SQL_DDL 산출물로 생성됩니다 (NEW_NL 모드 허용)
                          </Typography>
                        )}
                      </Stack>
                      {exists && cols.length > 0 && (
                        <Box sx={{ mt: 0.5, pl: 3 }}>
                          <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: 10.5, color: '#475569' }}>
                            {cols.slice(0, 12).map((c) => c.name).join(' · ')}
                            {cols.length > 12 && ` · 외 ${cols.length - 12}개`}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Paper>
        )}

        {examples.length > 0 && (
          <>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              {module.code} 모듈 예시
            </Typography>
            <Stack spacing={1}>
              {examples.map((p, i) => (
                <Chip
                  key={i}
                  label={p}
                  onClick={() => setPrompt(p)}
                  variant="outlined"
                  sx={{
                    height: 'auto',
                    whiteSpace: 'normal',
                    py: 1,
                    px: 1.5,
                    justifyContent: 'flex-start',
                    '& .MuiChip-label': { whiteSpace: 'normal', textAlign: 'left' },
                  }}
                />
              ))}
            </Stack>
          </>
        )}
      </Box>
    </Box>
  );
}

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
                width: 44,
                height: 44,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: `${color}22`,
                color: color,
              }}
            >
              <Icon />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                {title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            </Box>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
            {description}
          </Typography>
          <Tooltip
            placement="bottom"
            title={
              <Box>
                {pros.map((p, i) => (
                  <Box key={`p${i}`} sx={{ color: '#B5DEC8' }}>+ {p}</Box>
                ))}
                {cons.map((p, i) => (
                  <Box key={`c${i}`} sx={{ color: '#EDBEBF' }}>− {p}</Box>
                ))}
              </Box>
            }
          >
            <Typography
              variant="caption"
              sx={{ color: 'primary.dark', fontWeight: 600, cursor: 'help',
                    borderBottom: '1px dotted', borderColor: 'divider', width: 'fit-content' }}
            >
              장단점 보기
            </Typography>
          </Tooltip>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

export default ModeNewGeneral;
