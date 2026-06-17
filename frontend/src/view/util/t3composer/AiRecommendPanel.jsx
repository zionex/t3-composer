import React, { useState, useMemo, useRef, useEffect, Suspense } from 'react';
import {
  Box, Typography, Button, Stack, TextField, Chip, CircularProgress, Paper, Tooltip,
} from '@mui/material';
import ArrowBackIcon    from '@mui/icons-material/ArrowBack';
import AutoAwesomeIcon  from '@mui/icons-material/AutoAwesome';
import CloudUploadIcon  from '@mui/icons-material/CloudUpload';

import { MOCKUP_ENTRIES } from '../t3mockup';
import { buildMockupCandidates, scoreMockupCandidates, mergeAiPrefillIntoSpec } from './mockupRecommend';
import { specFromMockup, specFromSynthesized } from './wizardState';
import { recommendMockups, prefillFromMockup, prefillFromSynthesized } from './api';
import SynthesizedMockupPreview from './SynthesizedMockupPreview';

// 앰버 팔레트 — 패턴 선택 화면의 "AI 추천" 카드와 통일 (빈 캔버스 보라와 구분)
const ACCENT        = '#f59e0b'; // amber-500 (메인 accent)
const ACCENT_DARK   = '#b45309'; // amber-700 (제목·hover)
const ACCENT_HOVER  = '#d97706'; // amber-600 (버튼 hover)
const ACCENT_BG     = '#fffbeb'; // amber-50  (옅은 배경)
const ACCENT_BG2    = '#fff7ed'; // orange-50 (그라데이션 끝)
const ACCENT_BORDER = '#fde68a'; // amber-200 (보더)
const ACCENT_CHIP   = '#fef3c7'; // amber-100 (chip 배경)
const ACCENT_TEXT   = '#92400e'; // amber-800 (요약 텍스트)
const ACCENT_SOFT   = '#fcd34d'; // amber-300 — card border

const SYNTH_ACCENT       = '#8b5cf6';  // purple-500
const SYNTH_ACCENT_DARK  = '#6d28d9';  // purple-700
const SYNTH_ACCENT_HOVER = '#7c3aed';  // purple-600
const SYNTH_ACCENT_BG    = '#f5f3ff';  // purple-50
const SYNTH_ACCENT_CHIP  = '#ede9fe';  // purple-100
const SYNTH_ACCENT_TEXT  = '#5b21b6';  // purple-800
const SYNTH_ACCENT_SOFT  = '#c4b5fd'; // purple-300 — card border

const THUMB_W = 1400;   // mockup 컴포넌트 가상 폭
const THUMB_H = 900;

const EXAMPLES = ['거래처별 단가 관리', '공급계획 시뮬레이션', '재고 현황 조회'];

/**
 * AI 추천 진입 화면 (B 레이아웃).
 * props:
 *   onBack()          패턴 선택 화면으로 복귀
 *   onStart(spec)     선택 + prefill 완료된 ComposerSpec 으로 Wizard 진입
 *   targetCd          활성 Target
 */
// ─── 참조 파일 첨부 (D&D) — ModeNewGeneral 와 동일 패턴 ───
const TEXT_EXTS = new Set([
  'txt','md','markdown','jsx','tsx','js','ts','mjs','java','kt','scala',
  'sql','json','yaml','yml','xml','html','htm','css','scss','less',
  'csv','tsv','sh','ps1','bat','conf','properties','toml','ini','env',
  'log','gradle','dockerfile','py','rb','go','rs','c','cpp','h','hpp','svg',
]);
const MAX_ATTACH = 5;
const MAX_FILE_BYTES = 5 * 1024 * 1024;

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

/** Split attachments into Anthropic-shaped payload — text inline 용 + binary content blocks 용. */
const buildAttachPayload = (atts) => ({
  textAttachments: (atts || []).filter((a) => a && a.kind === 'text')
    .map(({ name, lang, text, sizeKb }) => ({ name, lang, text, sizeKb })),
  binaryAttachments: (atts || []).filter((a) => a && a.kind === 'binary')
    .map(({ name, mediaType, base64 }) => ({ name, mediaType, base64 })),
});

function AiRecommendPanel({ onBack, onStart, targetCd }) {
  const [nl, setNl] = useState('');
  const [loading, setLoading] = useState(false);      // 추천 검색 중
  const [fillingIdx, setFillingIdx] = useState(null); // 선택 후 prefill 중 (카드 인덱스)
  const [results, setResults] = useState(null);        // Array<existing | synthesized | placeholder>
  const [mode, setMode] = useState(null);              // 'ai' | 'fallback'
  const [zoomEntry, setZoomEntry] = useState(null);
  const zoomStopRef = useRef(null);

  // 참조 파일 첨부 — 자연어 생성과 동일 UX. 모든 AI 호출 (추천·prefill·최종 생성) 에 동봉.
  const [attachments, setAttachments] = useState([]);
  const [dragOver, setDragOver]       = useState(false);
  const [attachError, setAttachError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFilesPicked = async (files) => {
    const arr = Array.from(files || []);
    if (arr.length === 0) return;
    setAttachError(null);
    const room = MAX_ATTACH - attachments.length;
    if (room <= 0) {
      setAttachError(`참조 파일은 최대 ${MAX_ATTACH}개까지 첨부할 수 있습니다.`);
      return;
    }
    const take = arr.slice(0, room);
    if (arr.length > room) {
      setAttachError(`최대 ${MAX_ATTACH}개 — ${take.length}개만 추가했습니다.`);
    }
    for (const file of take) {
      try {
        const sizeKb = Math.round(file.size / 1024);
        if (file.size > MAX_FILE_BYTES) {
          setAttachError(`파일이 너무 큽니다 (${sizeKb}KB > 5MB): ${file.name}`);
          continue;
        }
        if (isTextFile(file)) {
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
        setAttachError(`파일 읽기 실패: ${file?.name || ''}: ${err?.message || err}`);
      }
    }
  };
  const removeAttachment = (idx) => setAttachments((prev) => prev.filter((_, i) => i !== idx));

  const codeToEntry = useMemo(() => {
    const m = new Map();
    for (const e of MOCKUP_ENTRIES) m.set(e.patternCode, e);
    return m;
  }, []);

  // 꾹 누르는 동안 확대 유지 — 오버레이가 커서를 덮어 썸네일 onMouseLeave 가 즉시 발화하던
  // 문제를 피하려고, 닫기는 window 의 mouseup 으로 처리(버튼을 떼는 순간 어디서든 닫힘).
  const startZoom = (entry) => {
    setZoomEntry(entry);
    // Track the listener so we can clean it up on unmount if the user is still holding the button.
    if (zoomStopRef.current) {
      window.removeEventListener('mouseup', zoomStopRef.current);
    }
    const stop = () => {
      setZoomEntry(null);
      window.removeEventListener('mouseup', stop);
      if (zoomStopRef.current === stop) zoomStopRef.current = null;
    };
    zoomStopRef.current = stop;
    window.addEventListener('mouseup', stop);
  };

  useEffect(() => () => {
    if (zoomStopRef.current) {
      window.removeEventListener('mouseup', zoomStopRef.current);
      zoomStopRef.current = null;
    }
  }, []);

  const onSearch = async () => {
    if (!nl.trim() || loading) return;
    setLoading(true);
    setResults(null);

    const TARGET_SLOTS       = 6;
    const TARGET_EXISTING    = 4;
    const TARGET_SYNTHESIZED = 2;

    // 1) Front-side keyword score as fallback ordering
    const keywordTop = scoreMockupCandidates(nl, MOCKUP_ENTRIES);
    const candidates = buildMockupCandidates(nl, MOCKUP_ENTRIES, 12);

    let cards = [];
    let resolvedMode = 'fallback';
    try {
      const res = await recommendMockups({ nl, candidates, ...buildAttachPayload(attachments) });
      const data = res?.data || {};
      if (data.mode === 'ai') {
        resolvedMode = 'ai';
        const existingAll = (data.items || [])
          .map((it) => ({
            kind: 'existing',
            entry: codeToEntry.get(it.patternCode),
            relevance: it.relevance,
            reason: it.reason,
          }))
          .filter((x) => x.entry);
        const synthAll = (Array.isArray(data.synthesized) ? data.synthesized : [])
          .map((s) => ({ kind: 'synthesized', synth: s }));

        const eUse = existingAll.slice(0, TARGET_EXISTING);
        const sUse = synthAll.slice(0, TARGET_SYNTHESIZED);
        cards = [...eUse, ...sUse];

        if (cards.length < TARGET_SLOTS) {
          const eExtra = existingAll.slice(TARGET_EXISTING);
          const sExtra = synthAll.slice(TARGET_SYNTHESIZED);
          for (const c of eExtra) { if (cards.length >= TARGET_SLOTS) break; cards.push(c); }
          for (const c of sExtra) { if (cards.length >= TARGET_SLOTS) break; cards.push(c); }
        }
      } else {
        cards = keywordTop.slice(0, TARGET_SLOTS).map((s) => ({ kind: 'existing', entry: s.entry }));
      }
    } catch {
      cards = keywordTop.slice(0, TARGET_SLOTS).map((s) => ({ kind: 'existing', entry: s.entry }));
    } finally {
      setLoading(false);
    }

    while (cards.length < TARGET_SLOTS) {
      cards.push({
        kind: 'placeholder',
        message: cards.length === 0
          ? '관련 템플릿을 찾지 못했습니다. 다른 표현으로 다시 시도해보세요.'
          : 'AI 가 적절한 추가 템플릿을 찾지 못했습니다.',
      });
    }

    setMode(resolvedMode);
    setResults(cards);
  };

  const onPick = async (item, idx) => {
    if (!item || item.kind === 'placeholder' || fillingIdx !== null) return;
    setFillingIdx(idx);

    const attachPayload = buildAttachPayload(attachments);

    if (item.kind === 'existing') {
      const entry = item.entry;
      const base = specFromMockup(entry, { title: entry.patternLabel || '새 화면', menuCd: '' });
      try {
        const res = await prefillFromMockup({
          nl,
          mockupPatternCode: entry.patternCode,
          mockupMeta: {
            patternLabel: entry.patternLabel,
            description: entry.description,
            layers: entry.layers,
            menus: entry.menus,
          },
          moduleCode: '',
          targetCd,
          ...attachPayload,
        });
        const aiSpec = res?.data?.spec || null;
        onStart(mergeAiPrefillIntoSpec(base, aiSpec), attachments);
      } catch {
        onStart(base, attachments);
      } finally {
        setFillingIdx(null);
      }
      return;
    }

    if (item.kind === 'synthesized') {
      const synth = item.synth;
      const base = specFromSynthesized(synth, { title: synth.label || '새 화면', menuCd: '' });
      try {
        const res = await prefillFromSynthesized({
          nl,
          synthesized: synth,
          moduleCode: '',
          targetCd,
          ...attachPayload,
        });
        const aiSpec = res?.data?.spec || null;
        onStart(mergeAiPrefillIntoSpec(base, aiSpec), attachments);
      } catch {
        onStart(base, attachments);
      } finally {
        setFillingIdx(null);
      }
      return;
    }
  };

  const renderCard = (item, idx) => {
    if (item.kind === 'placeholder') {
      return (
        <Box key={`ph-${idx}`} sx={{
          bgcolor: '#fff', borderRadius: 2,
          border: '1.5px dashed #cbd5e1',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          p: 2, color: '#94a3b8',
        }}>
          <Typography variant="body2" sx={{ textAlign: 'center', fontSize: 11 }}>
            {item.message}
          </Typography>
        </Box>
      );
    }

    if (item.kind === 'existing') {
      const entry = item.entry;
      const Thumb = entry.component;
      return (
        <Box key={`ex-${entry.patternCode}`} sx={{
          display: 'flex', flexDirection: 'column', minWidth: 0,
          bgcolor: '#fff', borderRadius: 2, overflow: 'hidden',
          border: `2px solid ${ACCENT_SOFT}`,
          boxShadow: '0 2px 8px rgba(245,158,11,0.10)',
        }}>
          <Box
            onMouseDown={(e) => { e.preventDefault(); startZoom(entry); }}
            sx={{ position: 'relative', flex: 1, minHeight: 0, overflow: 'hidden',
                  borderBottom: '1px solid #f1f5f9', cursor: 'zoom-in', bgcolor: '#fff',
                  userSelect: 'none' }}
          >
            <Box sx={{ width: THUMB_W, height: THUMB_H,
                       transform: 'scale(0.18)', transformOrigin: 'top left', pointerEvents: 'none' }}>
              <Suspense fallback={<Box sx={{ p: 4 }}><CircularProgress size={20} /></Box>}>
                {Thumb ? <Thumb /> : null}
              </Suspense>
            </Box>
          </Box>
          <Box sx={{ p: 1.2, display: 'flex', flexDirection: 'column', gap: 0.4, minHeight: 130 }}>
            {item.relevance != null && (
              <Chip label={`관련도 ${item.relevance}%`} size="small"
                    sx={{ alignSelf: 'flex-start', height: 18, fontSize: 10, fontWeight: 700,
                          bgcolor: ACCENT_CHIP, color: ACCENT_DARK }} />
            )}
            <Typography sx={{ fontWeight: 700, fontSize: 12.5, lineHeight: 1.3 }}>{entry.patternLabel}</Typography>
            <Typography sx={{ fontSize: 11, color: '#64748b', lineHeight: 1.4 }}>{entry.description}</Typography>
            {item.reason && (
              <Typography sx={{ fontSize: 10.5, color: ACCENT_DARK, fontStyle: 'italic' }}>"{item.reason}"</Typography>
            )}
            {(entry.menus || []).length > 0 && (
              <Typography sx={{ fontSize: 9.5, color: '#94a3b8' }}>
                📋 {(entry.menus || []).slice(0, 2).map((m) => m.menuNm).join(' · ')}
              </Typography>
            )}
            <Button variant="contained" size="small" onClick={() => onPick(item, idx)}
                    disabled={fillingIdx !== null}
                    sx={{ mt: 'auto', fontWeight: 700, fontSize: 11,
                          bgcolor: ACCENT, '&:hover': { bgcolor: ACCENT_HOVER } }}>
              {fillingIdx === idx ? '분석 중…' : '이 템플릿으로 시작 →'}
            </Button>
          </Box>
        </Box>
      );
    }

    if (item.kind === 'synthesized') {
      const synth = item.synth;
      const sourceCodes = Array.from(new Set(
        (synth.layers || []).map((l) => l.sourceMockupCode).filter(Boolean)
      ));
      return (
        <Box key={`syn-${idx}`} sx={{
          display: 'flex', flexDirection: 'column', minWidth: 0,
          bgcolor: '#fff', borderRadius: 2, overflow: 'hidden',
          border: `2px solid ${SYNTH_ACCENT_SOFT}`,
          boxShadow: '0 2px 8px rgba(139,92,246,0.10)',
        }}>
          <Box sx={{ position: 'relative', flex: 1, minHeight: 0, overflow: 'hidden',
                     borderBottom: '1px solid #f1f5f9', bgcolor: '#fff' }}>
            <SynthesizedMockupPreview layers={synth.layers} />
          </Box>
          <Box sx={{ p: 1.2, display: 'flex', flexDirection: 'column', gap: 0.4, minHeight: 130 }}>
            <Chip label="🪄 AI 재조합" size="small"
                  sx={{ alignSelf: 'flex-start', height: 18, fontSize: 10, fontWeight: 700,
                        bgcolor: SYNTH_ACCENT_CHIP, color: SYNTH_ACCENT_DARK }} />
            <Typography sx={{ fontWeight: 700, fontSize: 12.5, lineHeight: 1.3 }}>{synth.label}</Typography>
            {synth.description && (
              <Typography sx={{ fontSize: 11, color: '#64748b', lineHeight: 1.4 }}>{synth.description}</Typography>
            )}
            {synth.reason && (
              <Typography sx={{ fontSize: 10.5, color: SYNTH_ACCENT_DARK, fontStyle: 'italic' }}>"{synth.reason}"</Typography>
            )}
            {sourceCodes.length > 0 && (
              <Stack direction="row" flexWrap="wrap" sx={{ gap: 0.3 }}>
                {sourceCodes.slice(0, 3).map((code) => {
                  const src = codeToEntry.get(code);
                  return (
                    <Chip key={code} size="small" label={src ? (src.patternLabel || code) : code}
                          sx={{ height: 16, fontSize: 9, bgcolor: SYNTH_ACCENT_BG, color: SYNTH_ACCENT_TEXT,
                                border: `1px solid ${SYNTH_ACCENT_CHIP}` }} />
                  );
                })}
              </Stack>
            )}
            <Button variant="contained" size="small" onClick={() => onPick(item, idx)}
                    disabled={fillingIdx !== null}
                    sx={{ mt: 'auto', fontWeight: 700, fontSize: 11,
                          bgcolor: SYNTH_ACCENT, '&:hover': { bgcolor: SYNTH_ACCENT_HOVER } }}>
              {fillingIdx === idx ? '분석 중…' : '이 재조합으로 시작 →'}
            </Button>
          </Box>
        </Box>
      );
    }

    return null;
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* 상단 바 */}
      <Stack direction="row" alignItems="center" spacing={1}
             sx={{ p: 1.2, borderBottom: `1px solid ${ACCENT_BORDER}`,
                   background: `linear-gradient(135deg,${ACCENT_BG},${ACCENT_BG2})`, flexShrink: 0 }}>
        <Button size="small" startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ color: ACCENT_DARK }}>뒤로</Button>
        <Typography sx={{ fontWeight: 800, color: ACCENT_DARK }}>✨ AI 추천으로 화면 시작</Typography>
        <Chip label="Beta" size="small" sx={{ height: 18, fontSize: 10, bgcolor: ACCENT_CHIP, color: ACCENT_DARK }} />
        <Box sx={{ flexGrow: 1 }} />
        {targetCd && <Typography variant="caption" sx={{ color: '#94a3b8' }}>Target: <b>{targetCd}</b></Typography>}
      </Stack>

      {/* 본문 */}
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', gap: 1.5, p: 1.5, bgcolor: '#f8fafc', overflow: 'auto' }}>
        {/* 좌측 입력 */}
        <Box sx={{ flex: '0 0 32%', display: 'flex', flexDirection: 'column', gap: 1.2,
                   bgcolor: '#fff', border: '1px solid #e2e8f0', borderRadius: 2, p: 1.8 }}>
          <Typography sx={{ fontWeight: 700, color: ACCENT_DARK, fontSize: 13 }}>무엇을 만들까요?</Typography>
          <TextField
            multiline minRows={5} value={nl} onChange={(e) => setNl(e.target.value)}
            placeholder="예: 수요계획 입력 화면을 만들고 싶어. 월별로 판매계획을 입력하고 실적과 비교했으면 좋겠어."
            sx={{ '& textarea': { fontSize: 13 } }}
          />
          <Stack direction="row" flexWrap="wrap" sx={{ gap: 0.5 }}>
            {EXAMPLES.map((ex) => (
              <Chip key={ex} label={ex} size="small" variant="outlined"
                    onClick={() => setNl(ex)} sx={{ fontSize: 11 }} />
            ))}
          </Stack>

          {/* ── 참조 파일 첨부 (D&D) — 설계서 이미지·SQL 등 ── */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => { handleFilesPicked(e.target.files); e.target.value = ''; }}
          />
          <Paper
            variant="outlined"
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); }}
            onDrop={(e) => {
              e.preventDefault(); e.stopPropagation();
              setDragOver(false);
              handleFilesPicked(e.dataTransfer?.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            sx={{
              p: 1.5, borderRadius: 1.5, cursor: 'pointer',
              border: '2px dashed',
              borderColor: dragOver ? ACCENT : ACCENT_BORDER,
              bgcolor: dragOver ? ACCENT_BG : '#fffdf5',
              transition: 'all 0.15s',
              '&:hover': { borderColor: ACCENT, bgcolor: ACCENT_BG },
            }}
          >
            <Stack alignItems="center" spacing={0.3}>
              <CloudUploadIcon sx={{ fontSize: 24, color: dragOver ? ACCENT : ACCENT_SOFT }} />
              <Typography sx={{ fontWeight: 700, color: ACCENT_DARK, fontSize: 11.5 }}>
                참조 파일 첨부 — 설계서 이미지 · SQL 등
              </Typography>
              <Tooltip title="설계서 이미지·캡처·SQL 등을 최대 5개(파일당 5MB) 첨부. 텍스트는 prompt 에 inline, 이미지/PDF 는 multimodal 로 전송. AI 추천·prefill·최종 화면 생성 단계 모두에 활용됩니다.">
                <Typography sx={{ fontSize: 10, color: '#94a3b8', cursor: 'help',
                                    borderBottom: '1px dotted', borderColor: 'divider' }}>
                  끌어다 놓거나 클릭 · 최대 {MAX_ATTACH}개
                  {attachments.length > 0 && `  (${attachments.length}/${MAX_ATTACH})`}
                </Typography>
              </Tooltip>
            </Stack>
            {attachments.length > 0 && (
              <Stack
                direction="row" flexWrap="wrap" sx={{ mt: 1, gap: 0.5, justifyContent: 'center' }}
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
                        bgcolor: a.kind === 'text' ? 'rgba(245,158,11,0.10)' : 'rgba(245,158,11,0.18)',
                        fontSize: 10, height: 22,
                      }}
                    />
                  );
                })}
              </Stack>
            )}
          </Paper>
          {attachError && (
            <Typography sx={{ fontSize: 11, color: '#b45309', bgcolor: '#fef3c7',
                              border: '1px solid #fcd34d', borderRadius: 1, p: 0.8 }}>
              ⚠ {attachError}
            </Typography>
          )}

          <Button variant="contained" onClick={onSearch} disabled={!nl.trim() || loading}
                  startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon />}
                  sx={{ bgcolor: ACCENT, '&:hover': { bgcolor: ACCENT_HOVER }, fontWeight: 700 }}>
            {loading ? '추천 찾는 중…' : '추천 템플릿 찾기'}
          </Button>
          {results && (
            <Box sx={{ p: 1.2, bgcolor: ACCENT_BG, border: `1px solid ${ACCENT_BORDER}`, borderRadius: 1.5,
                       fontSize: 11, color: ACCENT_TEXT }}>
              🔎 관련 mockup {results.filter((c) => c.kind !== 'placeholder').length}개 추천
              {mode === 'fallback' && <Chip label="키워드 매칭" size="small"
                sx={{ ml: 0.6, height: 16, fontSize: 9, bgcolor: '#e2e8f0' }} />}
            </Box>
          )}
        </Box>

        {/* 우측 결과 */}
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {!results && (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
              <Typography variant="body2">자연어로 만들고 싶은 화면을 적고 "추천 템플릿 찾기" 를 누르세요.</Typography>
            </Box>
          )}
          {results && (
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gridTemplateRows: 'repeat(2, 1fr)',
              gap: 1.2,
              flex: 1,
              minHeight: 0,
            }}>
              {results.map((item, idx) => renderCard(item, idx))}
            </Box>
          )}
          {results && results.some((c) => c.kind !== 'placeholder') && (
            <Typography sx={{ fontSize: 10.5, color: '#94a3b8', textAlign: 'center' }}>
              선택 후 → ① Layout ② 데이터·검색조건 ③ 메타·메뉴 ④ 생성 <b style={{ color: ACCENT_DARK }}>(AI 자동 prefill)</b>
            </Typography>
          )}
        </Box>
      </Box>

      {/* 꾹눌러 확대 오버레이 — pointerEvents:none 으로 커서 이벤트를 가로채지 않음(window mouseup 으로 닫힘) */}
      {zoomEntry && zoomEntry.component && (
        <Box sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(15,23,42,0.78)', zIndex: 1400,
                   display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4,
                   pointerEvents: 'none' }}>
          <Box sx={{ bgcolor: '#fff', borderRadius: 2, p: 2, width: '78%', maxWidth: 1000, boxShadow: 24 }}>
            <Typography sx={{ fontWeight: 800, mb: 1 }}>{zoomEntry.patternLabel}</Typography>
            <Box sx={{ height: 480, overflow: 'hidden', border: '1px solid #e2e8f0', borderRadius: 1 }}>
              <Box sx={{ width: THUMB_W, height: THUMB_H, transform: 'scale(0.66)', transformOrigin: 'top left', pointerEvents: 'none' }}>
                <Suspense fallback={<Box sx={{ p: 6 }}><CircularProgress /></Box>}>
                  {(() => { const Z = zoomEntry.component; return <Z />; })()}
                </Suspense>
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default AiRecommendPanel;
