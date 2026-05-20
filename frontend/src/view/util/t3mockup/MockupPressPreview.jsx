import React, { Suspense, useEffect, useRef, useState } from 'react';

import { Box, CircularProgress, Paper, Popper } from '@mui/material';

/**
 * Long-press 시 SCM UI Mockup entry 의 lazy 컴포넌트를 작은 popper 로 미리보기.
 *
 * UI Pattern 의 PressPreview 와 같은 흐름이지만 콘텐츠가 iframe 이 아닌 React lazy 컴포넌트.
 *
 * 동작:
 *  - 마우스 짧게 누르고 떼면 → `onClick` 발화 (기존 클릭 흐름 보존)
 *  - {@link PRESS_DELAY_MS} 이상 누르고 있으면 → 우측에 미리보기 popper 노출
 *  - 마우스 떼거나 영역 이탈 → popper 즉시 닫힘. long-press 였으면 click 도 발화 안 함.
 *
 * 가상 화면 1400x900 안에 mockup 을 mount 한 뒤 transform scale 로 ~770x495 영역에 표시.
 *
 * props:
 *  - entry    MOCKUP_ENTRIES 의 한 entry — `entry.component` 가 React.lazy().
 *  - onClick  짧은 클릭(long-press 아님) 시 호출.
 *  - children 카드 본문.
 *  - sx       wrapper Box 의 sx (hover 등 카드 스타일).
 */
const PRESS_DELAY_MS = 250;
const PV_NATIVE_W = 1400;
const PV_NATIVE_H = 900;
const PV_SCALE = 0.55;

function MockupPressPreview({ entry, onClick, children, sx }) {
  const wrapRef = useRef(null);
  const timerRef = useRef(null);
  const activatedRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [renderNonce, setRenderNonce] = useState(0);

  const Comp = entry?.component || null;

  const cancelTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    if (!Comp) return;
    activatedRef.current = false;
    setAnchorEl(wrapRef.current);
    cancelTimer();
    timerRef.current = setTimeout(() => {
      activatedRef.current = true;
      setRenderNonce((n) => n + 1);
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

  // popper 열린 동안 카드 밖에서 떼도 닫음
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
      {Comp && (
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
              width:  PV_NATIVE_W * PV_SCALE,
              height: PV_NATIVE_H * PV_SCALE,
              overflow: 'hidden',
              border: '1px solid #cbd5e1',
              borderRadius: 1.5,
              bgcolor: '#fff',
              pointerEvents: 'none',
            }}
          >
            <Box sx={{
              width: PV_NATIVE_W,
              height: PV_NATIVE_H,
              transform: `scale(${PV_SCALE})`,
              transformOrigin: 'top left',
              bgcolor: '#fff',
            }}>
              <Suspense fallback={
                <Box sx={{
                  width: '100%', height: '100%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <CircularProgress size={32} />
                </Box>
              }>
                {/* renderNonce 로 매 open 마다 컴포넌트를 깨끗하게 재마운트 */}
                <Comp key={renderNonce} />
              </Suspense>
            </Box>
          </Paper>
        </Popper>
      )}
    </>
  );
}

export default MockupPressPreview;
