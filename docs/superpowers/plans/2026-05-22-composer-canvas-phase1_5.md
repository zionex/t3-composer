# Composer Canvas (Phase 1.5 — Layer 자유 편집) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ComposerCanvas 의 정적 CSS Grid 를 **react-grid-layout (RGL)** 로 교체해 사용자가 layer 를 **drag 로 이동 + resize + 추가 + 삭제** 할 수 있게 한다. 패턴이 만든 layer 골격을 그대로 둘 수도, 자유롭게 변형할 수도 있는 hybrid 편집기.

**Architecture:** ComposerCanvas 의 `<Box display="grid">` → `<ReactGridLayout>` 으로 교체. `layer.position {x,y,w,h}` → RGL `layout` 배열 양방향 동기 (`onLayoutChange` 콜백으로 spec 갱신). drag handle 은 카드 좌측 4px stripe 만 (`.cnv-layer-drag-handle` 클래스). 카드 본문 클릭은 mini dialog 열기 그대로. RGL 의 SE corner resize handle 자동 활성. 헤더 우측에 `[+ Layer]` dropdown (type 별 5종), 카드 호버 시 우상단 X 버튼.

**Tech Stack:** React 18 + MUI 5 + **react-grid-layout 1.3.4** (이미 frontend/package.json 에 있음, LayoutDesigner.jsx 가 사용 중). 테스트 환경 없음 — webpack 빌드 + dev server 시각 검증.

**Spec:** `docs/superpowers/specs/2026-05-22-pattern-driven-composer-redesign-design.md`
**전제:** Phase 2C (commit 29611f3) 머지된 상태. composer-frontend hot-reload 동작.

**Dev 환경**: composer-frontend port 5173. 로그: `docker compose logs --tail=50 composer-frontend`.

**참조 코드:** `frontend/src/view/util/t3composer/LayoutDesigner.jsx:22-23, 2438-2454` — RGL import + 사용 패턴.

---

## File Structure

| 파일 | 변경 종류 | 책임 |
|---|---|---|
| `frontend/src/view/util/t3composer/ComposerCanvas.jsx` | **본문 교체** | CSS Grid → `<ReactGridLayout>` (drag + resize). 헤더에 `[+ Layer]` 메뉴. 카드에 drag handle (좌측 stripe) + 삭제 X 버튼. position 변경 → onChange 콜백으로 spec.layers 갱신 |
| `frontend/src/view/util/t3composer/wizardState.js` | **export 추가** | `addLayer(spec, layerInit?)` + `removeLayer(spec, key)` helper — layer 추가/삭제 immutable 갱신. spec 객체 책임 분리 |

**기존 활용:**
- `react-grid-layout 1.3.4` (frontend/package.json:30) — 추가 의존성 0
- `LayoutDesigner.jsx` 의 RGL 사용 패턴 (cols=12 · margin · containerPadding · width measurement · rowHeight 동적 계산)
- `createComposerLayer({key, title, type, subtype, position})` (wizardState.js) — 이미 정의됨, layer 1건 골격 생성
- `LAYER_TYPES`, `LAYER_TYPE_ACCENT`, `TYPE_ICON` (ComposerCanvas.jsx) — type 별 색·아이콘

**Phase 1.5 범위 외:**
- **layer 분할** (한 layer 를 2개로 split) — 의미 모호 + "추가 + 위치 조정" 으로 대체 가능
- **자동 collision 회피** — RGL 의 `compactType` + `preventCollision={false}` 기본 동작에 맡김
- **layer 복제** — 후속

---

## Task 1: wizardState.js — `addLayer` / `removeLayer` helper

**Files:**
- Modify: `frontend/src/view/util/t3composer/wizardState.js` (기존 `specToInitialPrompt` 함수 위/아래)

**배경:** ComposerCanvas 에서 layer 추가/삭제 시 spec 의 immutable 갱신 + position 충돌 회피 + filterBar.affects 정리를 한 함수로 캡슐화. ComposerCanvas 가 직접 spec 조작 안 함.

- [ ] **Step 1: 기존 `createComposerLayer` 함수 위치 확인**

```bash
grep -n "^export function createComposerLayer" frontend/src/view/util/t3composer/wizardState.js
```

Expected: 한 라인 매칭.

- [ ] **Step 2: `createComposerLayer` 함수 아래에 신규 helper 2개 추가**

`frontend/src/view/util/t3composer/wizardState.js` 의 `createComposerLayer` 함수 닫는 `}` 아래에 다음 추가:

```js
/**
 * spec 의 layers 끝에 새 layer 1개 추가 (immutable).
 *   - key 가 비어 있으면 'layer_<rand>' 자동 부여 (기존 key 와 충돌 회피)
 *   - position 이 비어 있으면 빈 슬롯 자동 탐색 (Y 좌표 = 기존 layers 의 최하단 + 1, X=0, w=12, h=4)
 *   - filterBar.affects 에 새 layer key 의 빈 배열 entry 추가
 */
export function addLayer(spec, layerInit = {}) {
  if (!spec) throw new Error('addLayer: spec required');
  const existing = Array.isArray(spec.layers) ? spec.layers : [];
  const keys = new Set(existing.map((l) => l.key));

  // key 유일성
  let key = layerInit.key;
  if (!key || keys.has(key)) {
    let i = existing.length + 1;
    while (keys.has(`layer${i}`)) i += 1;
    key = `layer${i}`;
  }

  // position 자동 — 기존 layer 들의 최하단 + 1 부터 빈 공간
  let pos = layerInit.position;
  if (!pos) {
    const maxBottom = existing.reduce((acc, l) => {
      const p = l.position || {};
      return Math.max(acc, (p.y || 0) + (p.h || 0));
    }, 0);
    pos = { x: 0, y: maxBottom, w: 12, h: 4 };
  }

  const newLayer = createComposerLayer({
    key,
    title: layerInit.title || `위젯 ${existing.length + 1}`,
    type: layerInit.type || LAYER_TYPES.GRID,
    subtype: layerInit.subtype || 'GRID_BASE',
    position: pos,
  });

  const nextFilterBar = {
    ...(spec.filterBar || { items: [], affects: {} }),
    affects: { ...(spec.filterBar?.affects || {}), [key]: [] },
  };

  return {
    ...spec,
    layers: [...existing, newLayer],
    filterBar: nextFilterBar,
  };
}

/**
 * spec 에서 key 에 해당하는 layer 1건 제거 (immutable).
 *   - filterBar.affects 에서 해당 key entry 도 제거
 *   - 마지막 layer 1개일 때는 제거하지 않고 그대로 반환 (UX 안전망: 빈 캔버스 방지)
 */
export function removeLayer(spec, key) {
  if (!spec || !key) return spec;
  const existing = Array.isArray(spec.layers) ? spec.layers : [];
  if (existing.length <= 1) return spec;  // 마지막 layer 보호
  const nextLayers = existing.filter((l) => l.key !== key);
  if (nextLayers.length === existing.length) return spec;  // 매칭 없음

  const { [key]: _removed, ...restAffects } = spec.filterBar?.affects || {};
  return {
    ...spec,
    layers: nextLayers,
    filterBar: { ...(spec.filterBar || { items: [] }), affects: restAffects },
  };
}
```

- [ ] **Step 3: 컴파일 확인**

Run: `docker compose logs --tail=20 composer-frontend 2>&1 | grep -iE "ERROR in|SyntaxError" | head -5`
Expected: 0건.

- [ ] **Step 4: commit**

```bash
git add frontend/src/view/util/t3composer/wizardState.js
git commit -m "$(cat <<'EOF'
feat(composer): addLayer / removeLayer helpers — Phase 1.5

ComposerSpec.layers 의 immutable 추가/제거 캡슐화.

addLayer(spec, init?):
- key 자동 부여 (기존 key 와 충돌 회피, 'layer<N>')
- position 자동 (기존 layers 의 최하단 + 1, w=12 h=4)
- filterBar.affects 에 빈 배열 entry 추가

removeLayer(spec, key):
- 해당 key layer 제거
- filterBar.affects 의 해당 entry 도 정리
- 마지막 layer 1개일 때는 보호 (빈 캔버스 방지)

Plan: docs/superpowers/plans/2026-05-22-composer-canvas-phase1_5.md (Task 1)
EOF
)"
```

---

## Task 2: ComposerCanvas — RGL 도입 (drag + resize + position 동기화)

**Files:**
- Modify: `frontend/src/view/util/t3composer/ComposerCanvas.jsx`

**배경:** 가장 큰 변경 — CSS Grid → `<ReactGridLayout>`. layer 박스의 좌측 4px stripe 만 drag handle 로 (본문 click 은 mini dialog). resize handle 은 RGL 의 SE corner 자동.

- [ ] **Step 1: import + 동적 측정용 ref/state 추가**

`ComposerCanvas.jsx` 상단 import 블록의 React import 옆에 `useRef, useEffect` 추가:

```jsx
import React, { useState, useMemo, useRef, useEffect } from 'react';
```

기존 `import { Box, Typography, Button, Chip } from '@mui/material';` 아래에 RGL import 추가:

```jsx
import ReactGridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
```

- [ ] **Step 2: RGL 상수 + 동적 width/height 측정 추가**

`ComposerCanvas` 함수 본문 시작 부분 (기존 useState 들 옆) 에 ref + 측정 state + useEffect:

```jsx
  const COLS = 12;
  const RGL_MARGIN = [8, 8];
  const RGL_PADDING = [4, 4];

  // canvas 본문 컨테이너 크기 측정 — RGL width / rowHeight 동적 계산용
  const gridBoxRef = useRef(null);
  const [containerW, setContainerW] = useState(800);
  const [containerH, setContainerH] = useState(480);

  useEffect(() => {
    const el = gridBoxRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const r = e.contentRect;
        setContainerW(r.width);
        setContainerH(r.height);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // RGL 의 rowHeight = (가용높이 - padding*2 - margin*(rows-1)) / 총rows.
  // 총rows 는 모든 layer 의 max(y+h) — 최소 12.
  const totalRows = useMemo(() => {
    const layers = spec?.layers || [];
    const maxBottom = layers.reduce((acc, l) => {
      const p = l.position || {};
      return Math.max(acc, (p.y || 0) + (p.h || 0));
    }, 0);
    return Math.max(12, maxBottom);
  }, [spec?.layers]);

  const rowHeight = useMemo(() => {
    const usable = containerH - RGL_PADDING[1] * 2 - RGL_MARGIN[1] * Math.max(0, totalRows - 1);
    return Math.max(24, Math.floor(usable / totalRows));
  }, [containerH, totalRows]);
```

- [ ] **Step 3: addLayer / removeLayer / specToInitialPrompt import (이미 일부 있음) + state 추가**

기존 `import { ... } from './wizardState';` 에 추가 (이미 다른 항목 import 중일 가능성):

```jsx
import { addLayer, removeLayer } from './wizardState';
```

`ComposerCanvas` 함수 안 useState 들 옆에 layer 타입 picker dropdown 용 anchor state:

```jsx
const [addAnchor, setAddAnchor] = useState(null);  // [+ Layer] dropdown anchor
```

- [ ] **Step 4: layer 추가/삭제 핸들러 추가**

`ComposerCanvas` 함수 안 (handleApplyLayer 옆) 에 다음 추가:

```jsx
const handleAddLayer = (type, subtype) => {
  setAddAnchor(null);
  onChange(addLayer(spec, { type, subtype }));
};

const handleRemoveLayer = (key) => {
  if ((spec?.layers || []).length <= 1) return;  // 마지막 layer 보호
  onChange(removeLayer(spec, key));
};

// RGL onLayoutChange — 새 position 으로 spec.layers 갱신
const handleLayoutChange = (layout) => {
  if (!layout || layout.length === 0) return;
  const byKey = new Map(layout.map((it) => [it.i, it]));
  const layers = spec?.layers || [];
  const changed = layers.some((l) => {
    const it = byKey.get(l.key);
    if (!it) return false;
    const p = l.position || {};
    return it.x !== p.x || it.y !== p.y || it.w !== p.w || it.h !== p.h;
  });
  if (!changed) return;  // 무한 루프 방지 (RGL 이 마운트 시 한 번 호출)
  onChange({
    ...spec,
    layers: layers.map((l) => {
      const it = byKey.get(l.key);
      if (!it) return l;
      return { ...l, position: { x: it.x, y: it.y, w: it.w, h: it.h } };
    }),
  });
};

// RGL layout 배열 (spec.layers 에서 derive)
const rglLayout = useMemo(
  () => (spec?.layers || []).map((l) => ({
    i: l.key,
    x: l.position?.x ?? 0,
    y: l.position?.y ?? 0,
    w: l.position?.w ?? 12,
    h: l.position?.h ?? 4,
    minW: 2, minH: 2,
  })),
  [spec?.layers]
);
```

- [ ] **Step 5: 액션 헤더에 [+ Layer] 버튼 추가**

기존 `{!readOnly && onCreate && (...)}` 헤더 블록 안의 우측 Button (화면 생성) 옆에 [+ Layer] 추가. **MenuItem / Menu import** 도 필요:

상단 import:
```jsx
import { Box, Typography, Button, Chip, Menu, MenuItem, IconButton, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
```

헤더 Button 옆 (`<Button>화면 생성</Button>` 직전) 에 `[+ Layer]` 버튼 + Menu 추가:

기존:
```jsx
{!readOnly && onCreate && (
  <Box sx={{ ... }}>
    <Typography variant="caption" sx={{ color: '#64748b', mr: 'auto' }}>
      각 영역에 데이터를 채운 뒤 우측 [화면 생성] 버튼을 누르면 Claude 가 산출물을 만들고 미리보기까지 진행합니다.
    </Typography>
    <Button variant="contained" size="small" startIcon={<AutoAwesomeIcon fontSize="small" />}
            onClick={() => onCreate(spec)}
            sx={{ ... }}>
      화면 생성
    </Button>
  </Box>
)}
```

→ 다음으로 교체:
```jsx
{!readOnly && (
  <Box sx={{
    flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1,
    pb: 0.5,
  }}>
    <Typography variant="caption" sx={{ color: '#64748b', mr: 'auto' }}>
      각 영역에 데이터를 채운 뒤 [화면 생성] 클릭 → Claude 가 산출물 + 미리보기 진행.
      Layer 는 드래그/리사이즈/추가/삭제 가능.
    </Typography>

    <Button
      variant="outlined"
      size="small"
      startIcon={<AddIcon fontSize="small" />}
      onClick={(e) => setAddAnchor(e.currentTarget)}
      sx={{
        color: '#475569', borderColor: '#cbd5e1', fontWeight: 600,
        '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' },
      }}
    >
      Layer
    </Button>
    <Menu
      anchorEl={addAnchor}
      open={!!addAnchor}
      onClose={() => setAddAnchor(null)}
      slotProps={{ paper: { sx: { minWidth: 200 } } }}
    >
      <MenuItem onClick={() => handleAddLayer('GRID',      'GRID_BASE')}>
        <TableViewIcon sx={{ fontSize: 18, mr: 1, color: LAYER_TYPE_ACCENT.GRID }} /> Grid (그리드)
      </MenuItem>
      <MenuItem onClick={() => handleAddLayer('CHART',     'CHART_BAR')}>
        <InsightsIcon sx={{ fontSize: 18, mr: 1, color: LAYER_TYPE_ACCENT.CHART }} /> Chart (차트)
      </MenuItem>
      <MenuItem onClick={() => handleAddLayer('CONTAINER', 'CONTAINER_CARD')}>
        <ViewQuiltIcon sx={{ fontSize: 18, mr: 1, color: LAYER_TYPE_ACCENT.CONTAINER }} /> Container (컨테이너)
      </MenuItem>
      <MenuItem onClick={() => handleAddLayer('DOCUMENT',  'DOC_MARKDOWN_VIEWER')}>
        <DescriptionIcon sx={{ fontSize: 18, mr: 1, color: LAYER_TYPE_ACCENT.DOCUMENT }} /> Document (문서)
      </MenuItem>
      <MenuItem onClick={() => handleAddLayer('AI',        'AI_INSIGHT_CARD')}>
        <AutoAwesomeIcon sx={{ fontSize: 18, mr: 1, color: LAYER_TYPE_ACCENT.AI }} /> AI (AI 패널)
      </MenuItem>
    </Menu>

    {onCreate && (
      <Button
        variant="contained"
        size="small"
        startIcon={<AutoAwesomeIcon fontSize="small" />}
        onClick={() => onCreate(spec)}
        sx={{
          bgcolor: '#9D8FD4', color: '#fff', fontWeight: 700, letterSpacing: '0.02em',
          '&:hover': { bgcolor: '#8b7dca' },
          boxShadow: '0 2px 8px rgba(157,143,212,0.35)',
        }}
      >
        화면 생성
      </Button>
    )}
  </Box>
)}
```

- [ ] **Step 6: Body Layers 영역을 CSS Grid → ReactGridLayout 교체**

기존:
```jsx
<Box sx={{
  flex: 1, minHeight: 0, overflow: 'auto', p: 0.5,
  display: 'grid',
  gridTemplateColumns: 'repeat(12, 1fr)',
  gridAutoRows: 'minmax(28px, auto)',
  gap: 1,
}}>
  {layers.length === 0 && (
    <Box sx={{ gridColumn: '1 / -1', p: 4, textAlign: 'center', color: '#94a3b8' }}>
      Layer 가 없습니다. ComposerSpec.layers 가 비어있는지 확인하세요.
    </Box>
  )}
  {layers.map(l => {
    /* ... 기존 카드 렌더 ... */
  })}
</Box>
```

→ 다음으로 교체 (RGL + 카드 렌더는 동일 카드 본문이지만 외곽 wrap 변경):
```jsx
<Box ref={gridBoxRef} sx={{
  flex: 1, minHeight: 0, overflow: 'auto', position: 'relative',
}}>
  {layers.length === 0 && (
    <Box sx={{ p: 4, textAlign: 'center', color: '#94a3b8' }}>
      Layer 가 없습니다. 우측 상단 [+ Layer] 로 추가하세요.
    </Box>
  )}
  {layers.length > 0 && containerW > 0 && (
    <ReactGridLayout
      className="composer-canvas-grid"
      cols={COLS}
      width={containerW}
      rowHeight={rowHeight}
      margin={RGL_MARGIN}
      containerPadding={RGL_PADDING}
      layout={rglLayout}
      onLayoutChange={handleLayoutChange}
      isDraggable={!readOnly}
      isResizable={!readOnly}
      draggableHandle=".cnv-layer-drag-handle"
      compactType={null}
      preventCollision={false}
      resizeHandles={['se']}
    >
      {layers.map((l) => {
        const hasData = !!(l.dataSource?.naturalText) || (l.dataSource?.references || []).length > 0;
        const accent = LAYER_TYPE_ACCENT[l.type] || '#94a3b8';
        const TypeIcon = typeIconFor(l);
        const SubHintIcon = subtypeHintFor(l);
        const subLabel = l.subtype
          ? l.subtype.replace(/^(CHART_|GRID_|DOC_|AI_|CONTAINER_)/, '').replace(/_/g, ' ')
          : '';
        const canDelete = layers.length > 1;
        return (
          <Box key={l.key} sx={{
            position: 'relative',
            background: `
              radial-gradient(circle at 90% 70%, ${accent}2e 0%, transparent 55%),
              linear-gradient(135deg, ${accent}33 0%, ${accent}12 30%, #ffffff 70%)
            `,
            border: `1px solid ${accent}55`,
            borderRadius: 2.5,
            boxShadow: '0 1px 3px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.7)',
            overflow: 'hidden',
            transition: 'box-shadow 0.18s ease, border-color 0.18s ease',
            '&:hover': readOnly ? {} : {
              boxShadow: `0 8px 20px rgba(15,23,42,0.10), 0 0 0 1.5px ${accent}aa, inset 0 1px 0 rgba(255,255,255,0.7)`,
              borderColor: `${accent}cc`,
            },
            '&:hover .cnv-layer-remove': { opacity: 1 },
            display: 'flex',
          }}>
            {/* 좌측 drag handle stripe (5px) */}
            <Box className="cnv-layer-drag-handle" sx={{
              width: 5, flexShrink: 0,
              bgcolor: accent,
              cursor: readOnly ? 'default' : 'grab',
              '&:active': { cursor: 'grabbing' },
            }} />

            {/* 본문 — click → mini dialog */}
            <Box
              onClick={readOnly ? undefined : () => setEditingLayerKey(l.key)}
              sx={{
                flex: 1, minWidth: 0,
                cursor: readOnly ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
                gap: 2, p: 2,
                color: '#1e293b',
              }}
            >
              {/* type 아이콘 (좌측 원형) */}
              <Box sx={{
                flexShrink: 0,
                width: 56, height: 56,
                borderRadius: '50%',
                bgcolor: '#ffffff',
                border: `2px solid ${accent}55`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 4px 12px ${accent}3a`,
              }}>
                <TypeIcon sx={{ fontSize: 32, color: accent }} />
              </Box>

              {/* 텍스트 */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4, minWidth: 0, zIndex: 1 }}>
                <Typography sx={{ fontSize: 16, fontWeight: 800, color: '#1e293b',
                                   lineHeight: 1.2, letterSpacing: '-0.01em' }}>
                  {l.title || l.key}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7, flexWrap: 'wrap' }}>
                  <Box sx={{ px: 0.9, py: 0.15, borderRadius: 0.8,
                              bgcolor: `${accent}26`, color: accent,
                              fontSize: 10, fontWeight: 800, letterSpacing: '0.05em',
                              textTransform: 'uppercase' }}>
                    {l.type}
                  </Box>
                  {subLabel && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3,
                                px: 0.7, py: 0.15, borderRadius: 0.8,
                                bgcolor: '#f1f5f9', color: '#475569',
                                fontSize: 10, fontWeight: 600, letterSpacing: '0.04em' }}>
                      {SubHintIcon && <SubHintIcon sx={{ fontSize: 11 }} />}
                      {subLabel}
                    </Box>
                  )}
                </Box>
                <Typography sx={{ fontSize: 11, fontWeight: hasData ? 700 : 500,
                                   color: hasData ? '#16a34a' : '#94a3b8',
                                   lineHeight: 1.3, mt: 0.3 }}>
                  {hasData ? '✓ 데이터 설정됨' : '클릭하여 데이터 입력'}
                </Typography>
              </Box>

              {/* 우측 watermark */}
              <Box sx={{
                position: 'absolute', right: -8, bottom: -16,
                opacity: 0.12, pointerEvents: 'none', color: accent,
              }}>
                <TypeIcon sx={{ fontSize: 140 }} />
              </Box>
            </Box>

            {/* 호버 시 우상단 X 삭제 버튼 */}
            {!readOnly && canDelete && (
              <Tooltip title="Layer 삭제" placement="left">
                <IconButton
                  className="cnv-layer-remove"
                  size="small"
                  onClick={(e) => { e.stopPropagation(); handleRemoveLayer(l.key); }}
                  sx={{
                    position: 'absolute', top: 4, right: 4,
                    opacity: 0, transition: 'opacity 0.15s ease',
                    bgcolor: 'rgba(255,255,255,0.9)',
                    color: '#ef4444',
                    '&:hover': { bgcolor: '#fee2e2' },
                    width: 24, height: 24,
                  }}
                >
                  <CloseIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        );
      })}
    </ReactGridLayout>
  )}
</Box>
```

⚠️ **주의**: RGL 의 `compactType={null}` + `preventCollision={false}` 로 사용자가 원하는 위치 그대로 두기 (자동 압축 X, 충돌 시 다른 layer 가 옆으로 밀려남). LayoutDesigner 는 `compactType="vertical"` 인데 ComposerCanvas 는 자유배치 우선이라 `null`.

- [ ] **Step 7: 컴파일 확인**

Run: `docker compose logs --tail=30 composer-frontend 2>&1 | grep -iE "ERROR in|Module not found|SyntaxError" | head -5`
Expected: 0건.

⚠️ `react-resizable/css/styles.css` import 가 미존재 시 → `npm install react-resizable` 또는 import 제거 (RGL 이 이미 dep 으로 들고 있음).

- [ ] **Step 8: commit (시각 검증은 Task 4 통합 후)**

```bash
git add frontend/src/view/util/t3composer/ComposerCanvas.jsx
git commit -m "feat(composer): ComposerCanvas — RGL drag + resize + layer 추가/삭제

Phase 1.5 — 정적 CSS Grid → react-grid-layout 으로 교체.

[Drag + Resize]
- ReactGridLayout (12 cols, 동적 rowHeight)
- draggableHandle='.cnv-layer-drag-handle' — 좌측 5px stripe 만 핸들
- 카드 본문 click 은 mini dialog (drag 와 충돌 없음)
- SE corner resize handle 자동 (resizeHandles=['se'])
- compactType=null, preventCollision=false — 자유 배치
- onLayoutChange → spec.layers[i].position 양방향 동기

[추가]
- 헤더에 [+ Layer] dropdown — type 5종 (Grid/Chart/Container/Document/AI)
- addLayer(spec, {type, subtype}) 호출 → 자동 위치 (최하단+1)

[삭제]
- 카드 호버 시 우상단 X 버튼 (opacity 0 → 1 transition)
- removeLayer(spec, key) — 마지막 layer 1개 보호

[container 측정]
- ResizeObserver → containerW / containerH
- rowHeight = (containerH - padding - margin) / totalRows

Plan: docs/superpowers/plans/2026-05-22-composer-canvas-phase1_5.md (Task 2)"
```

---

## Task 3: 통합 smoke + Phase 1.5 종료 마커

**Files:** (변경 없음, 검증만)

- [ ] **Step 1: 전체 컴파일 healthcheck**

Run: `docker compose logs --tail=100 composer-frontend 2>&1 | grep -iE "ERROR in|Module not found|SyntaxError|Failed to compile" | head -10`
Expected: 0건.

- [ ] **Step 2: smoke 시나리오**

브라우저 `http://localhost:5173`:

**A — 빈 캔버스 + Layer 자유 편집**:
1. ModeSelector → "단계별 생성" → "빈 캔버스 (P02)" ✓
2. ComposerCanvas 진입 — mainGrid 1개 카드 보임 ✓
3. **우상단 [+ Layer] 클릭** → dropdown (Grid/Chart/Container/Document/AI 5종) → "Chart" 선택 → 새 카드가 mainGrid 아래에 자동 추가 (호박 stripe) ✓
4. **새 Chart 카드의 좌측 호박 stripe 를 드래그** → 자유 위치 이동 ✓
5. **카드 SE 모서리 resize handle 드래그** → 크기 조정 ✓
6. **카드 본문 (아이콘/텍스트 영역) 클릭** → DataMiniDialog 정상 열림 (drag 와 충돌 없음) ✓
7. **카드 호버** → 우상단 X 버튼 노출 → 클릭 → 카드 사라짐 ✓
8. mainGrid 1개만 남았을 때 X 버튼 안 보임 (마지막 layer 보호) ✓

**B — DASHBOARD mockup + 추가/이동**:
1. "SCM UI Mockup" → DASHBOARD 카테고리 mockup 선택 → 5개 layer 자동 prefill (KPI + 위젯 4개) ✓
2. 위젯 1 을 드래그해서 다른 위치로 이동 → spec.layers[i].position 갱신 (하단 디버그 JSON 확인) ✓
3. 위젯 2 의 SE 모서리 드래그 → 크기 변경 ✓
4. [+ Layer] → "Grid" 추가 → 자동으로 빈 슬롯 (최하단) ✓
5. 추가된 layer 삭제 → 정상 ✓

**C — end-to-end 회귀**:
1. [+ Layer] 로 추가한 layer 에 데이터 입력 → [화면 생성] → ComposerWorkspace 진입 → 새 layer 도 spec 에 반영됐는지 ChatPanel 첫 메시지 확인 ✓
2. 다른 모드 (NEW_NL / NEW_FROM_COPY / NEW_FROM_DESIGN) 회귀 없음 ✓

- [ ] **Step 3: Phase 1.5 종료 commit**

```bash
git commit --allow-empty -m "$(cat <<'EOF'
milestone(composer): Phase 1.5 complete — Layer 자유 편집

ComposerCanvas 에 react-grid-layout 도입 → drag + resize + 추가 + 삭제.

[Commits]
- (Task 1) addLayer / removeLayer helpers (wizardState.js)
- (Task 2) ComposerCanvas — RGL 교체 + [+ Layer] dropdown + 호버 X 삭제

[효과]
패턴이 만든 layer 골격을 그대로 둘 수도, 사용자가 자유롭게 변형할 수도 있는 hybrid.
- drag handle = 좌측 5px stripe (카드 본문 click 은 mini dialog 그대로)
- resize handle = SE corner (RGL 자동)
- [+ Layer] dropdown — type 5종 (Grid/Chart/Container/Document/AI)
- 호버 시 우상단 X 삭제 (마지막 layer 1개는 보호)
- position 양방향 동기 (onLayoutChange → spec.layers)

[유지]
DataMiniDialog / FilterBarMiniDialog / specToInitialPrompt / Mini dialog 흐름 그대로.
DASHBOARD 등 패턴이 만든 layer 도 동일하게 drag/resize 가능.

[다음 단계]
- Phase 2B-2 + 2B-3: 4모드 통합 + Backend prompt 갱신
- Phase 3: 9-Step Wizard 코드 제거 + rule 갱신

Spec: docs/superpowers/specs/2026-05-22-pattern-driven-composer-redesign-design.md
Plan: docs/superpowers/plans/2026-05-22-composer-canvas-phase1_5.md
EOF
)"
```

---

## Self-Review

**1. Spec coverage (Phase 1.5):**

| Spec/사용자 요구 | 구현 task |
|---|---|
| Layer 자유 추가 | Task 1 (addLayer) + Task 2 ([+ Layer] dropdown) |
| Layer 삭제 | Task 1 (removeLayer) + Task 2 (호버 X 버튼) |
| Layer drag 이동 | Task 2 (RGL `isDraggable` + draggableHandle) |
| Layer resize | Task 2 (RGL `isResizable` + resizeHandles=['se']) |
| 카드 click → mini dialog 유지 | Task 2 (drag handle 영역 분리: 좌측 stripe 만) |
| Layer 분할 | **제외 (Phase 1.5 범위 외 명시)** |
| position 양방향 동기 | Task 2 (handleLayoutChange) |
| 마지막 layer 보호 | Task 1 (removeLayer 가드) + Task 2 (canDelete 분기) |

**2. Placeholder scan:** "TBD" / "implement later" 패턴 0건. ✓

**3. Type consistency:**
- `addLayer(spec, init?)` / `removeLayer(spec, key)` 의 반환 = 새 spec (ComposerSpec 구조 보존) ✓
- `handleLayoutChange(layout)` — RGL 의 layout = `[{i, x, y, w, h, ...}]`, `i` 가 layer.key 와 일치 ✓
- `rglLayout` 의 각 항목이 `{i, x, y, w, h, minW, minH}` — RGL 표준 형식 ✓
- `LAYER_TYPE_ACCENT[type]` — Task 2 의 [+ Layer] menu 아이콘 색 적용에 type (`GRID`/`CHART`/...) 그대로 사용, ComposerCanvas 의 기존 LAYER_TYPE_ACCENT 와 일치 ✓
- `addLayer` 가 부여하는 default subtype (`GRID_BASE` / `CHART_BAR` / `CONTAINER_CARD` / `DOC_MARKDOWN_VIEWER` / `AI_INSIGHT_CARD`) — 모두 COMPONENT_CATALOG 5그룹 41개 안 (constants.js, Phase 1 정리본) ✓

**4. Ambiguity:**
- "compactType=null + preventCollision=false" — RGL 의 자동 압축/충돌 회피 OFF. 사용자가 자유 배치하다 겹치면 시각적으로 보이지만 RGL 이 알아서 swap. 의도된 동작.
- "resize handle = SE corner only" — 좌·상 모서리 resize 는 layer position 도 함께 변경해야 해서 복잡. SE 만으로도 width/height 조정 충분 (Phase 1.5 의도된 단순화).
- "최대 row 제한 없음" — totalRows 가 layers max(y+h) 로 동적. 사용자가 매우 큰 layer 만들면 rowHeight 가 작아짐 (최소 24px 보호). 정상.

---

## Execution Choice

**Plan complete and saved to `docs/superpowers/plans/2026-05-22-composer-canvas-phase1_5.md`.** 두 가지 실행 옵션:

**1. Subagent-Driven** — 매 task fresh subagent
**2. Inline Execution (recommended)** — 이 세션에서 직접 (3 task, RGL 도입이 핵심)

어느 쪽으로?
