import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Typography, Alert } from '@mui/material';
import { ContentInner } from '@wingui/common/imports';

import { useTargetStore } from '../targetStore';
import { fetchOntologyTree } from '../api';
import OntologyTree from './OntologyTree';
import OntologyImportDialog from './OntologyImportDialog';
import QaEditor from './editors/QaEditor';
import EntityEditor from './editors/EntityEditor';
import ViewReadOnly from './editors/ViewReadOnly';
import ProcessReadOnly from './editors/ProcessReadOnly';

const MIN_TREE_W = 180;
const MAX_TREE_W = 640;
const STORAGE_KEY = 'composer.ontology.treeWidth';

/**
 * Composer 상단 Tab [Ontology] 진입점.
 * 좌 트리 + Drag splitter + 우 디테일.
 * 좌 트리 너비는 사용자가 드래그로 조절 (localStorage 영속).
 */
function OntologyPage() {
  const targetCd = useTargetStore((s) => s.currentTargetCd);
  const [tree, setTree] = useState([]);
  const [selected, setSelected] = useState(null);
  const [newKind, setNewKind] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const [treeWidth, setTreeWidth] = useState(() => {
    const saved = Number(localStorage.getItem(STORAGE_KEY));
    return Number.isFinite(saved) && saved >= MIN_TREE_W && saved <= MAX_TREE_W ? saved : 280;
  });
  const splitContainerRef = useRef(null);
  const draggingRef = useRef(false);

  const loadTree = useCallback(async (q) => {
    if (!targetCd) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetchOntologyTree(targetCd, q);
      setTree(Array.isArray(r.data) ? r.data : []);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || '트리 조회 실패');
      setTree([]);
    } finally {
      setLoading(false);
    }
  }, [targetCd]);

  useEffect(() => { loadTree(''); }, [loadTree]);

  const handleNewClick = useCallback((kind) => {
    setSelected(null);
    setNewKind(kind);
  }, []);

  // ─────── Splitter drag handlers ───────
  const onSplitterDown = useCallback((e) => {
    e.preventDefault();
    draggingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const onMove = (e) => {
      if (!draggingRef.current || !splitContainerRef.current) return;
      const rect = splitContainerRef.current.getBoundingClientRect();
      const next = e.clientX - rect.left;
      const clamped = Math.max(MIN_TREE_W, Math.min(MAX_TREE_W, next));
      setTreeWidth(clamped);
    };
    const onUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      // 마지막 값만 영속화 (mousemove 마다 쓰지 않음)
      setTreeWidth((w) => {
        localStorage.setItem(STORAGE_KEY, String(w));
        return w;
      });
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  return (
    <ContentInner>
      <Box ref={splitContainerRef} sx={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <OntologyTree
          width={treeWidth}
          tree={tree}
          selectedKey={selected?.key}
          onSelect={(node) => { setNewKind(null); setSelected(node); }}
          onSearch={loadTree}
          onNewClick={handleNewClick}
          onImportClick={() => setImportOpen(true)}
        />
        <OntologyImportDialog
          open={importOpen}
          targetCd={targetCd}
          onClose={() => setImportOpen(false)}
          onImported={() => { loadTree(''); }}
        />
        {/* Drag splitter — 좌 트리 너비 조절 */}
        <Box
          onMouseDown={onSplitterDown}
          sx={{
            width: 6,
            flexShrink: 0,
            cursor: 'col-resize',
            bgcolor: 'rgba(124,167,224,0.20)',
            transition: 'background-color 120ms',
            '&:hover, &:active': { bgcolor: 'rgba(124,167,224,0.45)' },
          }}
          title="드래그로 너비 조절"
        />
        <Box sx={{ flex: 1, minHeight: 0, minWidth: 0, overflow: 'auto', p: 2 }}>
          {!targetCd && (
            <Alert severity="warning">Target System 을 먼저 선택하세요.</Alert>
          )}
          {error && <Alert severity="error">{error}</Alert>}
          {loading && <Typography>로딩…</Typography>}
          {!selected && !newKind && targetCd && !loading && !error && (
            <Typography sx={{ color: '#6E7E96' }}>좌측에서 항목을 선택하세요.</Typography>
          )}
          {newKind === 'QA' && (
            <QaEditor id={null} targetCd={targetCd}
              onSaved={() => { setNewKind(null); loadTree(''); }}
              onCancelNew={() => setNewKind(null)} />
          )}
          {newKind === 'ENTITY' && (
            <EntityEditor id={null} targetCd={targetCd}
              onSaved={() => { setNewKind(null); loadTree(''); }}
              onCancelNew={() => setNewKind(null)} />
          )}
          {selected && !newKind && selected.category === 'QA' && selected.refId && (
            <QaEditor id={selected.refId} targetCd={targetCd}
              onSaved={() => loadTree('')}
              onDeleted={() => { setSelected(null); loadTree(''); }} />
          )}
          {selected && !newKind && selected.category === 'ENTITY' && selected.refId && (
            <EntityEditor id={selected.refId} targetCd={targetCd}
              onSaved={() => loadTree('')}
              onDeleted={() => { setSelected(null); loadTree(''); }} />
          )}
          {selected && !newKind && selected.category === 'VIEW' && (
            <ViewReadOnly menuCd={selected.refId} targetCd={targetCd} />
          )}
          {selected && !newKind && selected.category === 'PROCESS' && (
            <ProcessReadOnly processCd={selected.refId} targetCd={targetCd} />
          )}
        </Box>
      </Box>
    </ContentInner>
  );
}

export default OntologyPage;
