import React, { useEffect, useRef, useState } from 'react';

import { Box, Paper, Popper } from '@mui/material';

/**
 * Long-press 시 자식 영역의 srcUrl 을 작은 iframe 으로 미리보기.
 *
 * 동작:
 *  - 마우스 짧게 누르고 떼면 → `onClick` 발화 (기존 클릭 흐름 보존)
 *  - {@link PRESS_DELAY_MS} 이상 누르고 있으면 → 우측에 미리보기 popper 노출
 *  - 마우스 떼거나 영역 이탈 → popper 즉시 닫힘. 이 경우 click 은 발화하지 않음.
 *
 * 분리본 부트스트랩의 default 탭 깜빡임 완화:
 *  - Paper bgcolor 어두운 회색 (#1e293b) — iframe 로드 전/중 빈 화면이 그대로 비치는 것 차단.
 *  - iframe 의 opacity 를 onLoad + rAF×2 후에 0 → 1 으로 fade-in (120ms).
 *  - 매 mouseDown 마다 iframe 강제 remount (key 증가) — 캐시된 default 잔상 제거.
 *
 * props:
 *  - srcUrl   미리보기 iframe 의 src — 없으면 popper 없이 일반 클릭만 동작.
 *  - onClick  짧은 클릭(long-press 아님) 시 호출. event 인자 전달.
 *  - children 카드 본문.
 *  - sx       wrapper Box 의 sx. (기존 카드 hover 등 스타일 그대로 적용).
 */
const PRESS_DELAY_MS = 250;
const PREVIEW_NATIVE_WIDTH = 1280;
const PREVIEW_NATIVE_HEIGHT = 800;
const PREVIEW_SCALE = 0.55;

function PressPreview({ srcUrl, onClick, children, sx }) {
  const wrapRef = useRef(null);
  const timerRef = useRef(null);
  // long-press 활성화 여부 — true 면 mouseup 시 click 도 발화하지 않음 (의도적 미리보기였으므로)
  const activatedRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [iframeReady, setIframeReady] = useState(false);
  const [iframeNonce, setIframeNonce] = useState(0);

  const cancelTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // 좌클릭만
    if (!srcUrl) return;        // src 없으면 미리보기 비활성
    activatedRef.current = false;
    setAnchorEl(wrapRef.current);
    cancelTimer();
    timerRef.current = setTimeout(() => {
      activatedRef.current = true;
      setIframeReady(false);
      setIframeNonce((n) => n + 1);
      setOpen(true);
      timerRef.current = null;
    }, PRESS_DELAY_MS);
  };

  const handleMouseUp = () => {
    cancelTimer();
    if (open) setOpen(false);
  };

  const handleMouseLeave = () => {
    cancelTimer();
    setOpen(false);
  };

  const handleClick = (e) => {
    if (activatedRef.current) {
      activatedRef.current = false;
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (onClick) onClick(e);
  };

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener('mouseup', close);
    window.addEventListener('blur', close);
    return () => {
      window.removeEventListener('mouseup', close);
      window.removeEventListener('blur', close);
    };
  }, [open]);

  useEffect(() => () => cancelTimer(), []);

  return (
    <>
      <Box
        ref={wrapRef}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        sx={sx}
      >
        {children}
      </Box>
      {srcUrl && (
        <Popper
          open={open}
          anchorEl={anchorEl}
          placement="right-start"
          modifiers={[
            { name: 'offset',          options: { offset: [0, 12] } },
            { name: 'flip',            options: { fallbackPlacements: ['left-start', 'top', 'bottom'] } },
            { name: 'preventOverflow', options: { boundary: 'viewport', padding: 8, altAxis: true } },
          ]}
          sx={{ zIndex: 1500, pointerEvents: 'none' }}
        >
          <Paper
            elevation={10}
            sx={{
              position: 'relative',
              width:  PREVIEW_NATIVE_WIDTH  * PREVIEW_SCALE,
              height: PREVIEW_NATIVE_HEIGHT * PREVIEW_SCALE,
              overflow: 'hidden',
              border: '1px solid #cbd5e1',
              borderRadius: 1.5,
              bgcolor: '#1e293b',   // 로드 중 default 탭이 비치는 것을 가리는 어두운 placeholder
              pointerEvents: 'none',
            }}
          >
            {!iframeReady && (
              <Box sx={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#94a3b8', fontSize: 12, fontFamily: 'monospace',
                letterSpacing: 0.4,
                userSelect: 'none',
              }}>
                미리보기 로딩 중…
              </Box>
            )}
            <iframe
              key={iframeNonce}
              src={srcUrl}
              title="ui-pattern-preview"
              onLoad={() => {
                // 분리본 부트스트랩 setTimeout(go, 120ms) 직후로 단축 — 30ms 여유.
                setTimeout(() => setIframeReady(true), 150);
              }}
              style={{
                width:  PREVIEW_NATIVE_WIDTH,
                height: PREVIEW_NATIVE_HEIGHT,
                transform: `scale(${PREVIEW_SCALE})`,
                transformOrigin: 'top left',
                border: 'none',
                display: 'block',
                pointerEvents: 'none',
                opacity: iframeReady ? 1 : 0,
                transition: 'opacity 50ms ease',
                backgroundColor: '#fff',
              }}
            />
          </Paper>
        </Popper>
      )}
    </>
  );
}

export default PressPreview;
