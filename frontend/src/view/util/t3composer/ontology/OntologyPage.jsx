import React, { useCallback, useEffect, useState } from 'react';
import { Box, Typography, Alert } from '@mui/material';
import { ContentInner } from '@wingui/common/imports';

import { useTargetStore } from '../targetStore';
import { fetchOntologyTree } from '../api';
import OntologyTree from './OntologyTree';
import QaEditor from './editors/QaEditor';
import EntityEditor from './editors/EntityEditor';
import ViewReadOnly from './editors/ViewReadOnly';
import ProcessReadOnly from './editors/ProcessReadOnly';

/**
 * Composer 상단 Tab [Ontology] 진입점.
 * 좌 트리 (240px) + 우 디테일. 우 디테일은 다음 task 에서 editors 가 채운다.
 */
function OntologyPage() {
  const targetCd = useTargetStore((s) => s.currentTargetCd);
  const [tree, setTree] = useState([]);
  const [selected, setSelected] = useState(null);
  const [newKind, setNewKind] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

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

  return (
    <ContentInner>
      <Box sx={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <OntologyTree
          tree={tree}
          selectedKey={selected?.key}
          onSelect={(node) => { setNewKind(null); setSelected(node); }}
          onSearch={loadTree}
          onNewClick={handleNewClick}
        />
        <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', p: 2 }}>
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
