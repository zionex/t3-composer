import React, { useRef, useState, useCallback } from 'react';
import { Box } from '@mui/material';

/**
 * 드래그 가능한 split bar 가 들어간 2분할 컨테이너.
 *
 * props:
 *   direction = 'horizontal' (좌우) | 'vertical' (상하)
 *   initial   = 첫 번째 패널 크기 (%) — 기본 50
 *   min, max  = 첫 번째 패널 크기 한계 (%) — 기본 15 / 85
 *   first     = 첫 번째 패널 (좌/위)
 *   second    = 두 번째 패널 (우/아래)
 *
 * 마우스로 가운데 bar 를 드래그하면 비율 조정. flex 컨테이너 안에서 동작.
 */
function SplitPane({
  direction = 'horizontal',
  initial = 50,
  min = 15,
  max = 85,
  first,
  second,
  sx,
}) {
  const [pct, setPct] = useState(initial);
  const containerRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    const start = direction === 'horizontal' ? e.clientX : e.clientY;
    const startPct = pct;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const total = direction === 'horizontal' ? rect.width : rect.height;
    if (total <= 0) return;

    setDragging(true);
    document.body.style.userSelect = 'none';
    document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';

    const onMove = (ev) => {
      const cur = direction === 'horizontal' ? ev.clientX : ev.clientY;
      const delta = cur - start;
      const next = Math.max(min, Math.min(max, startPct + (delta / total) * 100));
      setPct(next);
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      setDragging(false);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [direction, pct, min, max]);

  const isH = direction === 'horizontal';

  return (
    <Box
      ref={containerRef}
      sx={{
        display: 'flex',
        flexDirection: isH ? 'row' : 'column',
        flex: 1,
        minWidth: 0,
        minHeight: 0,
        overflow: 'hidden',
        ...sx,
      }}
    >
      <Box sx={{
        flex: `0 0 ${pct}%`,
        minWidth: 0, minHeight: 0,
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>
        {first}
      </Box>
      <Box
        onMouseDown={handleMouseDown}
        sx={{
          flex: `0 0 ${isH ? '6px' : '6px'}`,
          cursor: isH ? 'col-resize' : 'row-resize',
          bgcolor: dragging ? '#3b82f6' : '#e2e8f0',
          transition: dragging ? 'none' : 'background-color 0.15s',
          position: 'relative',
          '&:hover': { bgcolor: '#3b82f6' },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: isH ? '50%' : 0,
            left: isH ? 0 : '50%',
            width: isH ? '100%' : 24,
            height: isH ? 24 : '100%',
            transform: isH ? 'translateY(-50%)' : 'translateX(-50%)',
            backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1.2px)',
            backgroundSize: isH ? '4px 4px' : '4px 4px',
            opacity: dragging ? 0 : 0.7,
            pointerEvents: 'none',
          },
        }}
      />
      <Box sx={{
        flex: 1, minWidth: 0, minHeight: 0,
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>
        {second}
      </Box>
    </Box>
  );
}

export default SplitPane;
