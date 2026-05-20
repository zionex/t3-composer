import React, { useMemo, useState, useEffect, useRef, useCallback, Suspense } from 'react';

import {
  Dialog, Box, Typography, Stack, Chip, IconButton, Button, Tooltip, CircularProgress, Slider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import { MOCKUP_ENTRIES, CATEGORY_LABEL } from '../t3mockup';

/**
 * SCM UI Mockup — 3D 갤러리 (JARVIS 스타일 원통형 홀로그래픽 브라우저).
 *
 * 2-pane 구조:
 *   - 좌측 40% — 큰 원통(cylinder) 3D 선택. 좌우 드래그 = 회전 · 휠 = 확대/축소.
 *   - 우측 60% — 정면에서 선택한 mockup 의 실제 화면 미리보기.
 *
 * props (MockupPickerDialog 와 동일 인터페이스):
 *   open · onClose() · currentValue(patternCode|null) · onConfirm(entry|null)
 */

const HOLO = '#38bdf8';                 // 메인 시안
const RGBA = (a) => `rgba(56,189,248,${a})`;

const PANEL_W = 420;                    // 카테고리 패널 폭
const PANEL_H = 540;                    // 카테고리 패널 높이 (고정 — 원통 정렬용)
const RADIUS  = 660;                    // 원통 반지름 (큰 원통)
const ROT_SPEED = 0.26;                 // 드래그 px → 회전 deg
const PV_W = 1400, PV_H = 900;          // 우측 미리보기 가상 화면 크기

const CAT_ORDER = ['core', 'domain', 'dashboard', 'controlboard', 'meta'];

function buildGroups() {
  const map = {};
  MOCKUP_ENTRIES.forEach((e) => {
    (map[e.category] = map[e.category] || []).push(e);
  });
  const cats = [
    ...CAT_ORDER.filter((c) => map[c]),
    ...Object.keys(map).filter((c) => !CAT_ORDER.includes(c)),
  ];
  return cats.map((c) => ({ category: c, label: CATEGORY_LABEL[c] || c, items: map[c] }));
}

/** 패널 4-코너 브래킷 — 홀로 패널 모서리 강조 */
function Corners() {
  const base = { position: 'absolute', width: 14, height: 14, pointerEvents: 'none' };
  const b = `1.5px solid ${RGBA(0.85)}`;
  return (
    <>
      <Box sx={{ ...base, top: -1, left: -1, borderTop: b, borderLeft: b }} />
      <Box sx={{ ...base, top: -1, right: -1, borderTop: b, borderRight: b }} />
      <Box sx={{ ...base, bottom: -1, left: -1, borderBottom: b, borderLeft: b }} />
      <Box sx={{ ...base, bottom: -1, right: -1, borderBottom: b, borderRight: b }} />
    </>
  );
}

function Mockup3DGallery({ open, onClose, currentValue, onConfirm }) {
  const groups = useMemo(buildGroups, []);
  const count  = groups.length;
  const step   = count > 0 ? 360 / count : 360;        // 패널 간 각도

  const [selected, setSelected] = useState(currentValue || null);
  const [rotation, setRotation] = useState(0);         // 원통 Y축 회전 (deg)
  const [panY,     setPanY]     = useState(0);         // 수직 이동 (px)
  // 기본 줌 — 좌측 pane 에서 [확대]를 한 번 누른 상태(0.66 + 0.2)로 시작
  const [zoom,     setZoom]     = useState(0.86);
  const [dragging, setDragging] = useState(false);
  // 우측 미리보기 불투명도 — 하단 슬라이더로 조절 (1=불투명, 낮을수록 투명/홀로그램)
  const [previewOpacity, setPreviewOpacity] = useState(0.5);
  const dragRef  = useRef(null);
  const wheelCleanupRef = useRef(null);

  useEffect(() => {
    if (open) {
      setSelected(currentValue || null);
      setRotation(0); setPanY(0); setZoom(0.86);
    }
  }, [open, currentValue]);

  const selectedEntry = useMemo(
    () => MOCKUP_ENTRIES.find((e) => e.patternCode === selected) || null,
    [selected],
  );
  const PreviewComp = selectedEntry?.component || null;

  // 우측 미리보기 — 패널 실제 폭 측정 → mockup(1400px) 을 폭에 맞춰 scale.
  //
  // ResizeObserver loop 차단:
  //  1) Math.round 로 sub-pixel 변동 (scrollbar 등장/소실로 인한 17px 진동) 제거
  //  2) requestAnimationFrame 으로 한 frame 에 한 번만 처리
  //  3) 함수형 setState 로 같은 값이면 skip
  // 이 셋을 같이 해야 떨림이 완전히 멈춤 — 하나라도 빠지면 scale → paint → scrollbar 변동
  // → ResizeObserver → scale 의 무한 루프가 다시 발생.
  const previewPaneRef = useRef(null);
  const [previewW, setPreviewW] = useState(0);
  useEffect(() => {
    const el = previewPaneRef.current;
    if (!open || !el) return undefined;
    let rafId = null;
    const upd = () => {
      const w = Math.round(el.clientWidth);
      setPreviewW((prev) => (prev === w ? prev : w));
      rafId = null;
    };
    const onResize = () => {
      if (rafId != null) return; // 이미 다음 frame 에 예약됨
      rafId = requestAnimationFrame(upd);
    };
    upd(); // 첫 측정은 즉시
    const ro = new ResizeObserver(onResize);
    ro.observe(el);
    return () => {
      ro.disconnect();
      if (rafId != null) cancelAnimationFrame(rafId);
    };
  }, [open, selectedEntry]);
  const pvScale = previewW > 0 ? previewW / PV_W : 0.4;

  // ── 드래그 — 좌우=회전, 상하=수직 이동 ──
  const onMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    dragRef.current = { sx: e.clientX, sy: e.clientY, rot: rotation, py: panY };
    setDragging(true);
  }, [rotation, panY]);

  useEffect(() => {
    if (!open) return undefined;
    const move = (e) => {
      const d = dragRef.current;
      if (!d) return;
      setRotation(d.rot + (e.clientX - d.sx) * ROT_SPEED);
      setPanY(d.py + (e.clientY - d.sy));
    };
    const up = () => {
      if (dragRef.current) {
        // 회전 멈춤 → 가장 가까운 카테고리 패널이 정면으로 스냅
        setRotation((r) => Math.round(r / step) * step);
      }
      dragRef.current = null;
      setDragging(false);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
  }, [open, step]);

  // ── 좌측 스테이지 마우스 휠 = 확대/축소 ──
  //   React onWheel 은 passive 라 preventDefault 불가 → native non-passive 리스너를
  //   callback ref 로 element mount 시점에 직접 부착 (open/렌더 타이밍 무관하게 항상 동작).
  const stageRefCb = useCallback((el) => {
    if (wheelCleanupRef.current) { wheelCleanupRef.current(); wheelCleanupRef.current = null; }
    if (el) {
      const onWheel = (e) => {
        e.preventDefault();
        // 휠 위로 = 확대, 아래로 = 축소
        setZoom((z) => Math.min(2.2, Math.max(0.4, z - e.deltaY * 0.0014)));
      };
      el.addEventListener('wheel', onWheel, { passive: false });
      wheelCleanupRef.current = () => el.removeEventListener('wheel', onWheel);
    }
  }, []);

  const rotateBy  = (dir) => setRotation((r) => Math.round(r / step) * step + dir * step);
  const resetView = () => { setRotation(0); setPanY(0); setZoom(0.86); };
  const stop = (e) => e.stopPropagation();

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { bgcolor: '#05080f', backgroundImage: 'none', overflow: 'hidden' } }}
    >
      {/* 배경 — 시안 글로우 + 홀로 그리드 */}
      <Box sx={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 22% 46%, rgba(56,189,248,0.18) 0%, rgba(5,8,15,0) 58%)',
      }} />
      <Box sx={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.5,
        backgroundImage: `linear-gradient(${RGBA(0.07)} 1px, transparent 1px),`
                       + `linear-gradient(90deg, ${RGBA(0.07)} 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
      }} />

      {/* ── 헤더 ── */}
      <Box sx={{
        position: 'relative', zIndex: 5, flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.2,
        borderBottom: `1px solid ${RGBA(0.3)}`,
      }}>
        <ViewInArIcon sx={{ color: HOLO, filter: `drop-shadow(0 0 6px ${RGBA(0.8)})` }} />
        <Typography sx={{
          fontWeight: 800, color: '#dffaff', letterSpacing: 1,
          textShadow: `0 0 12px ${RGBA(0.7)}`,
        }}>
          SCM UI Mockup — 3D 갤러리
        </Typography>
        <Chip
          size="small"
          label={`${MOCKUP_ENTRIES.length} mockups · ${count} categories`}
          sx={{ height: 20, fontSize: 10, color: HOLO, bgcolor: RGBA(0.10),
                border: `1px solid ${RGBA(0.4)}` }}
        />
        <Typography variant="caption" sx={{ color: '#5b7a92', ml: 1 }}>
          좌우 드래그 = 원통 회전 · 휠 = 확대/축소 · 클릭 = 선택
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Tooltip title="닫기">
          <IconButton size="small" onClick={onClose} sx={{ color: '#9fc7d8' }}>
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* ── 본문 — 좌 40% 3D 원통 · 우 60% 선택 mockup 미리보기 ── */}
      <Box sx={{ position: 'relative', zIndex: 2, flex: 1, minHeight: 0, display: 'flex' }}>

        {/* ───── 좌측 40% — 3D 원통 스테이지 ───── */}
        <Box
          ref={stageRefCb}
          onMouseDown={onMouseDown}
          sx={{
            flex: '0 0 40%', minWidth: 0, position: 'relative', overflow: 'hidden',
            cursor: dragging ? 'grabbing' : 'grab',
            perspective: '2200px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRight: `1px solid ${RGBA(0.3)}`,
          }}
        >
          {/* 원통 world — translateY(panY) · scale(zoom) · rotateY(rotation) */}
          <Box sx={{
            position: 'relative', width: PANEL_W, height: PANEL_H,
            transformStyle: 'preserve-3d',
            transform: `translateY(${panY}px) scale(${zoom}) rotateY(${rotation}deg)`,
            transition: dragging ? 'none' : 'transform .42s cubic-bezier(.22,.61,.36,1)',
          }}>
            {groups.map((g, gi) => {
              const angle = gi * step;
              // 정면 기준 facing — 1(정면) ~ 0(측면) ~ -1(후면)
              const eff = (((angle + rotation) % 360) + 540) % 360 - 180;
              const facing = Math.cos((eff * Math.PI) / 180);
              const isFront = facing > 0.55;
              return (
                <Box key={g.category} sx={{
                  position: 'absolute', inset: 0,
                  transformStyle: 'preserve-3d',
                  backfaceVisibility: 'hidden',
                  transform: `rotateY(${angle}deg) translateZ(${RADIUS}px)`,
                  opacity: facing > 0 ? 0.32 + 0.68 * facing : 0.12,
                  pointerEvents: isFront ? 'auto' : 'none',
                  transition: dragging ? 'none' : 'opacity .42s ease',
                }}>
                  {/* 카테고리 패널 */}
                  <Box sx={{
                    position: 'relative', width: '100%', height: '100%',
                    display: 'flex', flexDirection: 'column', p: 1.7,
                    bgcolor: 'rgba(9,20,38,0.84)', borderRadius: 1.5,
                    border: `1px solid ${isFront ? RGBA(0.7) : RGBA(0.4)}`,
                    boxShadow: isFront
                      ? `0 0 48px ${RGBA(0.30)}, inset 0 0 56px ${RGBA(0.07)}`
                      : `0 0 24px ${RGBA(0.14)}`,
                  }}>
                    <Corners />
                    {/* 패널 헤더 */}
                    <Stack direction="row" alignItems="center" spacing={1}
                           sx={{ mb: 1.2, flexShrink: 0 }}>
                      <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: HOLO,
                                 boxShadow: `0 0 12px ${HOLO}` }} />
                      <Typography sx={{
                        fontWeight: 800, fontSize: 14, color: '#dffaff', letterSpacing: 1,
                        textShadow: `0 0 8px ${RGBA(0.6)}`,
                      }}>
                        {String(g.label).toUpperCase()}
                      </Typography>
                      <Box sx={{ flex: 1, height: 1, bgcolor: RGBA(0.3) }} />
                      <Typography sx={{ fontSize: 12, fontFamily: 'monospace', color: HOLO }}>
                        {String(g.items.length).padStart(2, '0')}
                      </Typography>
                    </Stack>
                    {/* mockup 타일 그리드 (3-column) */}
                    <Box sx={{
                      flex: 1, minHeight: 0, overflowY: 'auto', pr: 0.5,
                      display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '8px', alignContent: 'start',
                    }}>
                      {g.items.map((e) => {
                        const sel = selected === e.patternCode;
                        return (
                          <Box
                            key={e.patternCode}
                            onMouseDown={stop}
                            onClick={(ev) => { ev.stopPropagation(); setSelected(e.patternCode); }}
                            sx={{
                              position: 'relative', p: 0.9, borderRadius: 1, cursor: 'pointer',
                              minHeight: 58,
                              bgcolor: sel ? RGBA(0.22) : 'rgba(20,38,62,0.9)',
                              border: `1px solid ${sel ? HOLO : RGBA(0.28)}`,
                              boxShadow: sel ? `0 0 18px ${RGBA(0.6)}` : 'none',
                              transition: 'all .14s ease',
                              '&:hover': {
                                borderColor: HOLO, bgcolor: RGBA(0.14),
                                boxShadow: `0 0 14px ${RGBA(0.45)}`,
                              },
                            }}
                          >
                            {sel && (
                              <CheckCircleIcon sx={{
                                position: 'absolute', top: 3, right: 3, fontSize: 14, color: HOLO,
                              }} />
                            )}
                            <Typography sx={{
                              fontSize: 10, fontWeight: 700, color: '#e6f7ff', lineHeight: 1.25,
                              mb: 0.4, pr: sel ? 1.4 : 0,
                              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}>
                              {e.patternLabel}
                            </Typography>
                            <Typography sx={{
                              fontSize: 8, fontFamily: 'monospace', color: HOLO, opacity: 0.85,
                              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            }}>
                              {e.patternCode}
                            </Typography>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>

          {/* 좌우 회전 버튼 */}
          <IconButton
            onMouseDown={stop}
            onClick={() => rotateBy(+1)}
            sx={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                  color: HOLO, bgcolor: 'rgba(9,20,38,0.9)', border: `1px solid ${RGBA(0.45)}`,
                  width: 42, height: 42, '&:hover': { bgcolor: RGBA(0.2) } }}
          >
            <ChevronLeftIcon />
          </IconButton>
          <IconButton
            onMouseDown={stop}
            onClick={() => rotateBy(-1)}
            sx={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  color: HOLO, bgcolor: 'rgba(9,20,38,0.9)', border: `1px solid ${RGBA(0.45)}`,
                  width: 42, height: 42, '&:hover': { bgcolor: RGBA(0.2) } }}
          >
            <ChevronRightIcon />
          </IconButton>

          {/* 줌 컨트롤 — 좌측 pane 기준 */}
          <Stack spacing={0.6} sx={{ position: 'absolute', right: 14, bottom: 14 }}>
            {[
              { t: '확대',        ic: <AddIcon fontSize="small" />,               fn: () => setZoom((z) => Math.min(2.2, z + 0.2)) },
              { t: '축소',        ic: <RemoveIcon fontSize="small" />,            fn: () => setZoom((z) => Math.max(0.4, z - 0.2)) },
              { t: '시점 초기화', ic: <CenterFocusStrongIcon fontSize="small" />, fn: resetView },
            ].map((b) => (
              <Tooltip key={b.t} title={b.t} placement="left">
                <IconButton
                  size="small" onMouseDown={stop} onClick={b.fn}
                  sx={{ color: HOLO, bgcolor: 'rgba(9,20,38,0.92)',
                        border: `1px solid ${RGBA(0.4)}`,
                        '&:hover': { bgcolor: RGBA(0.18) } }}
                >
                  {b.ic}
                </IconButton>
              </Tooltip>
            ))}
          </Stack>
        </Box>

        {/* ───── 우측 60% — 선택 mockup 실제 화면 미리보기 ───── */}
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {/* 미리보기 헤더 strip */}
          <Box sx={{
            flexShrink: 0, display: 'flex', alignItems: 'center', gap: 1, px: 1.6, py: 0.9,
            borderBottom: `1px solid ${RGBA(0.25)}`, bgcolor: 'rgba(9,20,38,0.5)',
          }}>
            <Box sx={{ width: 7, height: 7, borderRadius: '50%',
                       bgcolor: selectedEntry ? HOLO : '#33485e',
                       boxShadow: selectedEntry ? `0 0 9px ${HOLO}` : 'none' }} />
            <Typography sx={{ fontSize: 12.5, fontWeight: 700, letterSpacing: 0.4,
                              color: selectedEntry ? '#dffaff' : '#5b7a92' }}>
              {selectedEntry ? selectedEntry.patternLabel : '미리보기 — mockup 미선택'}
            </Typography>
            {selectedEntry && (
              <Chip size="small" label={selectedEntry.patternCode}
                    sx={{ height: 18, fontSize: 9.5, fontFamily: 'monospace',
                          color: HOLO, bgcolor: RGBA(0.12), border: `1px solid ${RGBA(0.4)}` }} />
            )}
            {selectedEntry?.layoutCategory && (
              <Chip size="small" label={selectedEntry.layoutCategory}
                    sx={{ height: 18, fontSize: 9.5, color: '#bce6f4', bgcolor: RGBA(0.07),
                          border: `1px solid ${RGBA(0.25)}` }} />
            )}
          </Box>

          {/* 미리보기 본문 — mockup 을 폭에 맞춰 scale */}
          {/*
            scrollbarGutter:'stable' — vertical scrollbar 가 등장/소실해도 clientWidth 가
            바뀌지 않도록 scrollbar 영역을 항상 예약. 이게 빠지면 scale → preview 크기 변경
            → scrollbar 등장/소실 → clientWidth 변동 → scale 의 무한 loop (떨림).
          */}
          <Box ref={previewPaneRef} sx={{
            flex: 1, minHeight: 0, position: 'relative',
            overflowX: 'hidden', overflowY: 'auto', bgcolor: '#0b0f18',
            scrollbarGutter: 'stable',
          }}>
            {!selectedEntry && (
              <Box sx={{
                position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 1.5, color: '#5b7a92',
              }}>
                <ViewInArIcon sx={{ fontSize: 52, color: RGBA(0.35) }} />
                <Typography variant="body2" align="center">
                  왼쪽 3D 원통을 회전해 카테고리를 정면에 두고<br />
                  mockup 타일을 클릭하면 이 영역에 실제 화면이 표시됩니다.
                </Typography>
              </Box>
            )}
            {selectedEntry && PreviewComp && (
              <Box sx={{ width: PV_W * pvScale, height: PV_H * pvScale }}>
                <Box sx={{
                  width: PV_W, height: PV_H,
                  transform: `scale(${pvScale})`, transformOrigin: 'top left',
                  bgcolor: '#fff',
                  // 홀로그래픽 투영 느낌 — 하단 슬라이더로 조절되는 불투명도
                  opacity: previewOpacity,
                }}>
                  <Suspense fallback={
                    <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}>
                      <CircularProgress sx={{ color: HOLO }} />
                    </Box>
                  }>
                    <PreviewComp />
                  </Suspense>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* ── 하단 액션 바 ── */}
      <Box sx={{
        position: 'relative', zIndex: 6, flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 2, px: 2, py: 1.2,
        borderTop: `1px solid ${RGBA(0.3)}`, bgcolor: 'rgba(5,8,15,0.88)',
      }}>
        {selectedEntry ? (
          <Stack direction="row" alignItems="center" spacing={1}>
            <CheckCircleIcon sx={{ color: HOLO, fontSize: 18 }} />
            <Typography sx={{ color: '#dffaff', fontWeight: 700 }}>
              {selectedEntry.patternLabel}
            </Typography>
            <Chip
              size="small" label={selectedEntry.patternCode}
              sx={{ height: 18, fontSize: 9.5, fontFamily: 'monospace',
                    color: HOLO, bgcolor: RGBA(0.12), border: `1px solid ${RGBA(0.4)}` }}
            />
          </Stack>
        ) : (
          <Typography sx={{ color: '#5b7a92' }}>
            원통을 회전해 카테고리를 정면으로 두고, mockup 타일을 클릭해 선택하세요.
          </Typography>
        )}
        <Box sx={{ flex: 1 }} />
        {/* 우측 미리보기 화면 투명도 조절 */}
        <Stack direction="row" alignItems="center" spacing={1}
               sx={{ mr: 1.5, opacity: selectedEntry ? 1 : 0.45 }}>
          <Tooltip title="우측 미리보기 화면의 투명도 — 오른쪽으로 갈수록 더 투명(홀로그램 느낌)">
            <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: '#9fc7d8',
                              whiteSpace: 'nowrap' }}>
              화면 투명도
            </Typography>
          </Tooltip>
          <Slider
            size="small"
            value={Math.round((1 - previewOpacity) * 100)}
            min={0} max={85} step={5}
            disabled={!selectedEntry}
            onChange={(_, v) => setPreviewOpacity(1 - (Array.isArray(v) ? v[0] : v) / 100)}
            sx={{
              width: 150, color: HOLO,
              '& .MuiSlider-rail':  { backgroundColor: RGBA(0.25), opacity: 1 },
              '& .MuiSlider-track': { backgroundColor: HOLO, border: 'none' },
              '& .MuiSlider-thumb': {
                backgroundColor: HOLO,
                boxShadow: `0 0 10px ${RGBA(0.9)}`,
                '&:hover, &.Mui-focusVisible': { boxShadow: `0 0 0 6px ${RGBA(0.18)}` },
              },
            }}
          />
          <Typography sx={{ fontSize: 11.5, fontFamily: 'monospace', color: HOLO,
                            width: 38, textAlign: 'right' }}>
            {Math.round((1 - previewOpacity) * 100)}%
          </Typography>
        </Stack>
        {currentValue && (
          <Button onClick={() => onConfirm(null)} sx={{ color: '#9fc7d8' }}>선택 해제</Button>
        )}
        <Button onClick={onClose} sx={{ color: '#9fc7d8' }}>취소</Button>
        <Button
          variant="contained" disabled={!selectedEntry}
          onClick={() => onConfirm(selectedEntry || null)}
          sx={{ bgcolor: HOLO, color: '#04141f', fontWeight: 800,
                '&:hover': { bgcolor: '#7dd3fc' } }}
        >
          이 Mockup 적용
        </Button>
      </Box>
    </Dialog>
  );
}

export default Mockup3DGallery;
