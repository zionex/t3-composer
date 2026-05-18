import React, { useRef, useEffect, useCallback, useState } from 'react';

import { Box, Chip, CircularProgress } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

/**
 * Data Source — 뉴럴 별자리 맵 (Canvas 2D · JARVIS 홀로그램 테마).
 *
 * 2-레벨:
 *   L1  도메인(TB_FP·SP_UI_CM…) = 빛나는 "은하" 노드 (테이블 수에 비례한 크기) 링 배치
 *   L2  은하 클릭 → 카메라 줌인 + 그 도메인의 테이블/SP 가 "별" 노드로 동심 링 전개,
 *       FK·SP사용 엣지 표시
 *
 * 노드/엣지/카메라는 ref 에 보관 — rAF 루프가 React re-render 를 일으키지 않음.
 *
 * props:
 *   domains        [{ domain, label, tableCount, spCount }]
 *   loadDomain     (domain) => Promise<{ nodes:[{id,name,type,domain}], edges:[{from,to,kind}] }>
 *   selectedIds    Set<string> | string[]  — 바스켓에 담긴 노드 id (대문자)
 *   onToggleNode   (node) => void          — 별 클릭
 *   onHoverNode    (node|null) => void      — 우측 상세 패널 갱신용
 *   search         string                  — 매칭 노드 하이라이트
 */

const RING_R       = 900;
const GAL_MIN      = 26;
const GAL_MAX      = 66;
const RING_GAP     = 46;
const NODE_SPACING = 40;
const GOLDEN       = 2.399963;
const STAR_R       = 7;

const TYPE_RGB = {
  TABLE:  [56, 189, 248],
  VIEW:   [45, 212, 191],
  SP:     [245, 158, 11],
  FN:     [167, 139, 250],
  GALAXY: [56, 189, 248],
};
const cssRgb = (t, a) => {
  const c = TYPE_RGB[t] || TYPE_RGB.TABLE;
  return `rgba(${c[0]},${c[1]},${c[2]},${a})`;
};

function makeGlowSprite(size, rgb) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.95)`);
  g.addColorStop(0.28, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.45)`);
  g.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return cv;
}

function hashPhase(s) {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
  return (Math.abs(h) % 1000) / 1000 * Math.PI * 2;
}

/** 도메인 멤버 노드를 은하 중심 둘레 동심 링에 배치 (결정론적). */
function computeStarLayout(nodes, cx, cy) {
  const ordered = [...nodes].sort((a, b) => {
    const rank = (t) => (t === 'TABLE' || t === 'VIEW' ? 0 : 1);
    if (rank(a.type) !== rank(b.type)) return rank(a.type) - rank(b.type);
    return (a.name || '').localeCompare(b.name || '');
  });
  const out = [];
  let placed = 0;
  let k = 1;
  while (placed < ordered.length && k < 60) {
    const circ = 2 * Math.PI * k * RING_GAP;
    const cap = Math.max(6, Math.floor(circ / NODE_SPACING));
    const m = Math.min(cap, ordered.length - placed);
    for (let j = 0; j < m; j += 1) {
      const a = (j * 2 * Math.PI) / m + k * GOLDEN;
      const n = ordered[placed + j];
      out.push({
        ...n,
        x: cx + Math.cos(a) * k * RING_GAP,
        y: cy + Math.sin(a) * k * RING_GAP,
        phase: hashPhase(n.id || n.name || ''),
      });
    }
    placed += m;
    k += 1;
  }
  return out;
}

function DataConstellation({ domains, loadDomain, selectedIds, onToggleNode, onHoverNode, search }) {
  const wrapRef = useRef(null);
  const cvsRef  = useRef(null);
  const rafRef  = useRef(null);
  const stRef   = useRef(null);
  const spritesRef = useRef(null);

  // 최신 prop/callback 을 이벤트 핸들러가 항상 참조하도록 ref 미러
  const loadDomainRef  = useRef(loadDomain);
  const onToggleRef    = useRef(onToggleNode);
  const onHoverRef     = useRef(onHoverNode);
  useEffect(() => { loadDomainRef.current = loadDomain; }, [loadDomain]);
  useEffect(() => { onToggleRef.current = onToggleNode; }, [onToggleNode]);
  useEffect(() => { onHoverRef.current = onHoverNode; }, [onHoverNode]);

  const [expandedDomain, setExpandedDomain] = useState(null);
  const [loadingDomain, setLoadingDomain]   = useState(false);

  // 한 번만 만드는 상태 객체
  if (!stRef.current) {
    stRef.current = {
      W: 0, H: 0, dpr: 1,
      cam: { x: 0, y: 0, scale: 0.4, tx: 0, ty: 0, ts: 0.4 },
      galaxies: [], stars: [], starMap: new Map(), edges: [],
      expanded: null, hover: null, drag: null, selSet: new Set(), search: '',
    };
  }
  if (!spritesRef.current) {
    spritesRef.current = {
      GALAXY: makeGlowSprite(128, TYPE_RGB.GALAXY),
      TABLE:  makeGlowSprite(96,  TYPE_RGB.TABLE),
      VIEW:   makeGlowSprite(96,  TYPE_RGB.VIEW),
      SP:     makeGlowSprite(96,  TYPE_RGB.SP),
      FN:     makeGlowSprite(96,  TYPE_RGB.FN),
    };
  }

  const overviewScale = useCallback(() => {
    const st = stRef.current;
    if (!st.W || !st.H) return 0.4;
    return Math.min(st.W, st.H) / 2300;
  }, []);

  // ── 은하 레이아웃 (domains 변경 시) ──
  useEffect(() => {
    const st = stRef.current;
    const list = Array.isArray(domains) ? domains : [];
    const maxCount = Math.max(1, ...list.map((d) => (d.tableCount || 0) + (d.spCount || 0)));
    const n = list.length || 1;
    st.galaxies = list.map((d, i) => {
      const ang = -Math.PI / 2 + (i * 2 * Math.PI) / n;
      const cnt = (d.tableCount || 0) + (d.spCount || 0);
      return {
        ...d,
        x: Math.cos(ang) * RING_R,
        y: Math.sin(ang) * RING_R,
        r: GAL_MIN + (GAL_MAX - GAL_MIN) * Math.sqrt(cnt / maxCount),
        phase: hashPhase(d.domain || String(i)),
      };
    });
    // 첫 로드 시 overview 로 맞춤
    if (st.expanded == null) {
      const os = overviewScale();
      st.cam.ts = os;
      if (!st.cam.scale || st.cam.scale < 0.05) st.cam.scale = os;
    }
  }, [domains, overviewScale]);

  // ── selectedIds → Set ──
  useEffect(() => {
    stRef.current.selSet = selectedIds instanceof Set
      ? selectedIds
      : new Set(selectedIds || []);
  }, [selectedIds]);

  // ── search ──
  useEffect(() => {
    stRef.current.search = (search || '').trim().toLowerCase();
  }, [search]);

  // ── 도메인 확장 ──
  const expand = useCallback(async (galaxy) => {
    const st = stRef.current;
    setLoadingDomain(true);
    try {
      const res = await (loadDomainRef.current ? loadDomainRef.current(galaxy.domain) : null);
      const nodes = (res && Array.isArray(res.nodes)) ? res.nodes : [];
      const edges = (res && Array.isArray(res.edges)) ? res.edges : [];
      const stars = computeStarLayout(nodes, galaxy.x, galaxy.y);
      const map = new Map();
      stars.forEach((s) => map.set(String(s.id).toUpperCase(), s));
      st.stars = stars;
      st.starMap = map;
      st.edges = edges.filter((e) => map.has(String(e.from).toUpperCase())
                                  && map.has(String(e.to).toUpperCase()));
      st.expanded = galaxy.domain;
      // 카메라 fit
      let maxR = RING_GAP;
      stars.forEach((s) => {
        const d = Math.hypot(s.x - galaxy.x, s.y - galaxy.y);
        if (d > maxR) maxR = d;
      });
      const fit = Math.min(st.W, st.H) / (2 * (maxR + 120));
      st.cam.tx = galaxy.x;
      st.cam.ty = galaxy.y;
      st.cam.ts = Math.max(0.18, Math.min(2.4, fit));
      setExpandedDomain(galaxy.domain);
    } finally {
      setLoadingDomain(false);
    }
  }, []);

  const collapse = useCallback(() => {
    const st = stRef.current;
    st.stars = [];
    st.starMap = new Map();
    st.edges = [];
    st.expanded = null;
    st.hover = null;
    st.cam.tx = 0;
    st.cam.ty = 0;
    st.cam.ts = overviewScale();
    setExpandedDomain(null);
    if (onHoverRef.current) onHoverRef.current(null);
  }, [overviewScale]);

  // ── 캔버스 셋업 + rAF 루프 ──
  useEffect(() => {
    const cvs = cvsRef.current;
    const wrap = wrapRef.current;
    if (!cvs || !wrap) return undefined;
    const ctx = cvs.getContext('2d');
    const st = stRef.current;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = wrap.clientWidth || 1;
      const h = wrap.clientHeight || 1;
      st.W = w; st.H = h; st.dpr = dpr;
      cvs.width = w * dpr;
      cvs.height = h * dpr;
      cvs.style.width = `${w}px`;
      cvs.style.height = `${h}px`;
      if (st.expanded == null && (!st.cam.scale || st.cam.scale < 0.05)) {
        st.cam.scale = overviewScale();
        st.cam.ts = st.cam.scale;
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const toScreen = (wx, wy) => {
      const c = st.cam;
      return [(wx - c.x) * c.scale + st.W / 2, (wy - c.y) * c.scale + st.H / 2];
    };

    const draw = (t) => {
      const c = st.cam;
      ctx.setTransform(st.dpr, 0, 0, st.dpr, 0, 0);
      ctx.clearRect(0, 0, st.W, st.H);
      const hasSearch = st.search.length > 0;

      // ── 엣지 (확장된 도메인) ──
      if (st.expanded != null && st.edges.length > 0) {
        const groups = { FK: [], SP_USES: [] };
        st.edges.forEach((e) => (groups[e.kind] || groups.FK).push(e));
        [['FK', 'rgba(56,189,248,0.22)'], ['SP_USES', 'rgba(245,158,11,0.20)']].forEach(([kind, col]) => {
          const arr = groups[kind];
          if (!arr || !arr.length) return;
          ctx.strokeStyle = col;
          ctx.lineWidth = 1;
          ctx.beginPath();
          arr.forEach((e) => {
            const a = st.starMap.get(String(e.from).toUpperCase());
            const b = st.starMap.get(String(e.to).toUpperCase());
            if (!a || !b) return;
            const [ax, ay] = toScreen(a.x, a.y);
            const [bx, by] = toScreen(b.x, b.y);
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
          });
          ctx.stroke();
        });
      }

      // ── 은하 ──
      st.galaxies.forEach((g) => {
        const [sx, sy] = toScreen(g.x, g.y);
        const r = Math.max(6, g.r * c.scale);
        if (sx < -200 || sx > st.W + 200 || sy < -200 || sy > st.H + 200) return;
        const tw = 0.82 + 0.18 * Math.sin(t / 700 + g.phase);
        const isExp = st.expanded === g.domain;
        const match = hasSearch && (g.domain.toLowerCase().includes(st.search)
                       || (g.label || '').toLowerCase().includes(st.search));
        const dim = hasSearch && !match ? 0.3 : 1;
        ctx.globalAlpha = tw * dim;
        const spr = spritesRef.current.GALAXY;
        ctx.drawImage(spr, sx - r * 1.9, sy - r * 1.9, r * 3.8, r * 3.8);
        ctx.globalAlpha = dim;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fillStyle = isExp ? 'rgba(125,211,252,0.95)' : 'rgba(9,30,52,0.95)';
        ctx.fill();
        ctx.lineWidth = isExp ? 2.4 : 1.4;
        ctx.strokeStyle = (isExp || match) ? '#7dd3fc' : 'rgba(56,189,248,0.7)';
        ctx.stroke();
        // 라벨 — 확대 배율에 비례해 글자 크기도 키움 (이름 가독성)
        const gLabelPx = Math.min(30, Math.max(12, Math.round(11 * c.scale)));
        const gCountPx = Math.min(22, Math.max(10, Math.round(9 * c.scale)));
        ctx.globalAlpha = dim;
        ctx.fillStyle = '#dffaff';
        ctx.font = `700 ${gLabelPx}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(g.domain, sx, sy - r - Math.round(gLabelPx * 0.6));
        ctx.fillStyle = 'rgba(56,189,248,0.85)';
        ctx.font = `600 ${gCountPx}px monospace`;
        ctx.fillText(`${(g.tableCount || 0)}T·${(g.spCount || 0)}SP`, sx, sy + r + Math.round(gCountPx * 1.3));
      });
      ctx.globalAlpha = 1;

      // ── 별 (확장된 도메인) ──
      if (st.expanded != null) {
        const showLabel = c.scale > 0.55;
        st.stars.forEach((s) => {
          const [sx, sy] = toScreen(s.x, s.y);
          if (sx < -60 || sx > st.W + 60 || sy < -60 || sy > st.H + 60) return;
          const r = Math.max(3.2, Math.min(STAR_R * c.scale, 24));
          const sel = st.selSet.has(String(s.id).toUpperCase());
          const hov = st.hover && st.hover.id === s.id;
          const match = hasSearch && (s.name || '').toLowerCase().includes(st.search);
          const dim = hasSearch && !match ? 0.22 : 1;
          const tw = 0.8 + 0.2 * Math.sin(t / 600 + s.phase);
          ctx.globalAlpha = tw * dim;
          const spr = spritesRef.current[s.type] || spritesRef.current.TABLE;
          ctx.drawImage(spr, sx - r * 2.4, sy - r * 2.4, r * 4.8, r * 4.8);
          ctx.globalAlpha = dim;
          ctx.beginPath();
          ctx.arc(sx, sy, r, 0, Math.PI * 2);
          ctx.fillStyle = cssRgb(s.type, 0.95);
          ctx.fill();
          if (sel || hov || match) {
            ctx.beginPath();
            ctx.arc(sx, sy, r + 4, 0, Math.PI * 2);
            ctx.lineWidth = 2;
            ctx.strokeStyle = sel ? '#ffffff' : (match ? '#fde68a' : '#7dd3fc');
            ctx.stroke();
          }
          if (sel) {
            const checkPx = Math.max(9, Math.min(Math.round(r * 0.95), 18));
            ctx.fillStyle = '#fff';
            ctx.font = `700 ${checkPx}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText('✓', sx, sy + Math.round(checkPx * 0.34));
          }
          if (showLabel || hov || sel || match) {
            // 확대 배율에 비례해 라벨 글자를 키워 객체 이름을 정확히 인지 가능하게.
            const labelPx = Math.min(34, Math.max(10, Math.round(7.5 * c.scale)));
            ctx.globalAlpha = dim;
            ctx.fillStyle = '#cfe9f5';
            ctx.font = `600 ${labelPx}px monospace`;
            ctx.textAlign = 'center';
            ctx.fillText(s.name, sx, sy - r - Math.round(labelPx * 0.5));
          }
        });
        ctx.globalAlpha = 1;
      }
    };

    const tick = (t) => {
      const c = st.cam;
      c.x += (c.tx - c.x) * 0.14;
      c.y += (c.ty - c.y) * 0.14;
      c.scale += (c.ts - c.scale) * 0.14;
      draw(t);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      ro.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [overviewScale]);

  // ── 휠 줌 (커서 고정) — non-passive ──
  useEffect(() => {
    const cvs = cvsRef.current;
    if (!cvs) return undefined;
    const st = stRef.current;
    const onWheel = (e) => {
      e.preventDefault();
      const rect = cvs.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const c = st.cam;
      const wx = (mx - st.W / 2) / c.scale + c.x;
      const wy = (my - st.H / 2) / c.scale + c.y;
      const next = Math.max(0.12, Math.min(9.0, c.scale * Math.exp(-e.deltaY * 0.0014)));
      c.scale = next; c.ts = next;
      c.x = wx - (mx - st.W / 2) / next; c.tx = c.x;
      c.y = wy - (my - st.H / 2) / next; c.ty = c.y;
    };
    cvs.addEventListener('wheel', onWheel, { passive: false });
    return () => cvs.removeEventListener('wheel', onWheel);
  }, []);

  // ── 히트 테스트 (스크린 좌표 기준 최근접) ──
  const hitTest = useCallback((mx, my) => {
    const st = stRef.current;
    const c = st.cam;
    const toS = (wx, wy) => [(wx - c.x) * c.scale + st.W / 2, (wy - c.y) * c.scale + st.H / 2];
    if (st.expanded != null) {
      const r = Math.max(5, Math.min(STAR_R * c.scale, 24)) + 6;
      let best = null; let bestD = r * r;
      st.stars.forEach((s) => {
        const [sx, sy] = toS(s.x, s.y);
        const d = (sx - mx) ** 2 + (sy - my) ** 2;
        if (d < bestD) { bestD = d; best = { kind: 'star', node: s }; }
      });
      if (best) return best;
    }
    let bestG = null; let bestGD = Infinity;
    st.galaxies.forEach((g) => {
      const [sx, sy] = toS(g.x, g.y);
      const rr = Math.max(8, g.r * c.scale) + 6;
      const d = (sx - mx) ** 2 + (sy - my) ** 2;
      if (d < rr * rr && d < bestGD) { bestGD = d; bestG = { kind: 'galaxy', node: g }; }
    });
    return bestG;
  }, []);

  // ── 마우스 (드래그 pan / hover / click) ──
  const onMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    const st = stRef.current;
    st.drag = { sx: e.clientX, sy: e.clientY, camX: st.cam.x, camY: st.cam.y, moved: 0 };
  }, []);

  useEffect(() => {
    const cvs = cvsRef.current;
    if (!cvs) return undefined;
    const st = stRef.current;

    const localXY = (e) => {
      const rect = cvs.getBoundingClientRect();
      return [e.clientX - rect.left, e.clientY - rect.top];
    };

    const onMove = (e) => {
      const d = st.drag;
      if (d) {
        const dx = e.clientX - d.sx;
        const dy = e.clientY - d.sy;
        d.moved = Math.max(d.moved, Math.abs(dx) + Math.abs(dy));
        st.cam.x = d.camX - dx / st.cam.scale; st.cam.tx = st.cam.x;
        st.cam.y = d.camY - dy / st.cam.scale; st.cam.ty = st.cam.y;
        return;
      }
      const [mx, my] = localXY(e);
      const hit = hitTest(mx, my);
      const node = hit && hit.kind === 'star' ? hit.node : null;
      const prev = st.hover;
      st.hover = node;
      cvs.style.cursor = hit ? 'pointer' : 'grab';
      if ((prev && prev.id) !== (node && node.id) && onHoverRef.current) {
        onHoverRef.current(node || null);
      }
    };

    const onUp = (e) => {
      const d = st.drag;
      st.drag = null;
      if (!d) return;
      if (d.moved > 6) return;     // 드래그 → 클릭 아님
      const [mx, my] = localXY(e);
      const hit = hitTest(mx, my);
      if (!hit) return;
      if (hit.kind === 'galaxy') {
        if (st.expanded === hit.node.domain) collapse();
        else expand(hit.node);
      } else if (hit.kind === 'star' && onToggleRef.current) {
        onToggleRef.current(hit.node);
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [hitTest, expand, collapse]);

  return (
    <Box ref={wrapRef} sx={{ position: 'relative', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      <canvas ref={cvsRef} onMouseDown={onMouseDown} style={{ display: 'block', cursor: 'grab' }} />

      {expandedDomain && (
        <Chip
          icon={<ArrowBackIcon sx={{ fontSize: 15 }} />}
          label="전체 보기"
          onClick={collapse}
          size="small"
          sx={{
            position: 'absolute', top: 12, left: 12, cursor: 'pointer',
            color: '#dffaff', bgcolor: 'rgba(9,20,38,0.92)',
            border: '1px solid rgba(56,189,248,0.5)',
            '& .MuiChip-icon': { color: '#38bdf8' },
            '&:hover': { bgcolor: 'rgba(56,189,248,0.2)' },
          }}
        />
      )}
      {loadingDomain && (
        <Box sx={{ position: 'absolute', top: 12, right: 12, display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircularProgress size={16} sx={{ color: '#38bdf8' }} />
        </Box>
      )}
      <Box sx={{
        position: 'absolute', bottom: 10, left: 12, pointerEvents: 'none',
        fontSize: 10.5, color: '#5b7a92', lineHeight: 1.5,
      }}>
        은하 클릭 = 도메인 펼치기 · 별 클릭 = 선택 · 드래그 = 이동 · 휠 = 확대/축소
      </Box>
    </Box>
  );
}

export default DataConstellation;
