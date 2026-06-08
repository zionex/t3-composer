import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, CircularProgress, Alert, Divider,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';

import { importOntologyFromFs, refreshOntologyCache } from '../api';

/**
 * 카테고리 카운트를 통일된 숫자로 환산.
 *  - refresh endpoint 응답: c 는 숫자 (예: 100)
 *  - import-from-fs 응답: c 는 { added, skipped, available, skippedReason } 객체
 * 두 케이스를 모두 지원해 같은 헬퍼로 sum / disabled 가드에 사용.
 */
const countOf = (c) => (typeof c === 'number' ? c : (c?.available ?? 0));

/**
 * Ontology Tab — [📥 파일에서 Import] 다이얼로그.
 *
 * 진입 시 refresh 호출 → ontology_v2 폴더의 카운트 미리보기.
 * [Import 실행] 클릭 → import-from-fs endpoint 호출 → 결과 카운트 표시.
 *
 * Props:
 *  - open       : boolean — 다이얼로그 표시 여부
 *  - targetCd   : string  — 활성 Target System
 *  - onClose    : ()=>void — 다이얼로그 닫힘
 *  - onImported : (result)=>void — Import 성공 시 호출 (트리 reload 트리거용)
 */
function OntologyImportDialog({ open, targetCd, onClose, onImported }) {
  const [stage, setStage] = useState('idle');    // idle | preview | importing | done | error
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !targetCd) return;
    setStage('preview');
    setPreview(null);
    setResult(null);
    setError(null);
    refreshOntologyCache(targetCd)
      .then((r) => setPreview(r.data))
      .catch((e) => {
        setError(e?.response?.data?.message || e?.message || 'preview 로드 실패');
        setStage('error');
      });
  }, [open, targetCd]);

  const handleImport = () => {
    setStage('importing');
    setError(null);
    importOntologyFromFs(targetCd)
      .then((r) => {
        setResult(r.data);
        setStage('done');
        if (onImported) onImported(r.data);
      })
      .catch((e) => {
        setError(e?.response?.data?.message || e?.message || 'Import 실패');
        setStage('error');
      });
  };

  const renderCategoryRow = (label, key, source) => {
    const c = source ? source[key] : null;
    if (!c) return null;
    return (
      <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
        <Typography sx={{ fontSize: 13, color: '#3A4A63' }}>{label}</Typography>
        <Typography sx={{ fontSize: 13, fontFamily: 'monospace', color: '#3A4A63' }}>
          {stage === 'done'
            ? `신규 ${c.added} · skip ${c.skipped}${c.skippedReason ? ` (${c.skippedReason})` : ''}`
            : (typeof c === 'number' ? c.toLocaleString() : (c.available ?? 0).toLocaleString())}
        </Typography>
      </Box>
    );
  };

  const previewOrResult = stage === 'done' ? result : preview;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <DownloadIcon fontSize="small" />
        파일에서 Ontology Import
      </DialogTitle>
      <DialogContent>
        {stage === 'preview' && !preview && !error && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        )}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {previewOrResult && !previewOrResult.hasFolder && stage !== 'done' && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography sx={{ fontSize: 13 }}>
              ontology_v2 폴더가 마운트되어 있지 않습니다.<br />
              <code>.env</code> 의 <code>TARGET_{targetCd}_PROJECT_PATH</code> 를 프로젝트 루트로 설정하고
              backend 를 재기동 (<code>docker compose up -d --force-recreate composer-backend</code>) 하세요.
            </Typography>
          </Alert>
        )}

        {previewOrResult && (previewOrResult.hasFolder || stage === 'done') && (
          <Box>
            {previewOrResult.ontologyRoot && (
              <Box sx={{ mb: 2 }}>
                <Typography sx={{ fontSize: 11, color: '#6E7E96' }}>폴더</Typography>
                <Typography sx={{ fontSize: 12, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {previewOrResult.ontologyRoot}
                </Typography>
              </Box>
            )}
            <Divider sx={{ mb: 1 }} />
            <Typography sx={{ fontSize: 12, color: '#6E7E96', mb: 0.5 }}>
              {stage === 'done' ? 'Import 결과' : '발견된 데이터'}
            </Typography>
            {renderCategoryRow('Q&A',     'qa',      previewOrResult)}
            {renderCategoryRow('Entity',  'entity',  previewOrResult)}
            {renderCategoryRow('View',    'view',    previewOrResult)}
            {renderCategoryRow('Process', 'process', previewOrResult)}
            {stage !== 'done' && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography sx={{ fontSize: 12 }}>
                  이미 DB 에 있는 id 는 skip 합니다 — 운영 데이터는 보호됩니다.
                </Typography>
              </Alert>
            )}
            {stage === 'done' && (
              <Alert severity="success" sx={{ mt: 2 }}>
                <Typography sx={{ fontSize: 12 }}>Import 완료. 좌측 트리가 곧 갱신됩니다.</Typography>
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={stage === 'importing'}>
          {stage === 'done' ? '닫기' : '취소'}
        </Button>
        {stage !== 'done' && (
          <Button
            onClick={handleImport}
            variant="contained"
            disabled={
              stage === 'importing'
              || !preview
              || !preview.hasFolder
              || ((countOf(preview.qa) + countOf(preview.entity) + countOf(preview.view) + countOf(preview.process)) === 0)
            }
            startIcon={stage === 'importing' ? <CircularProgress size={14} color="inherit" /> : <DownloadIcon fontSize="small" />}
          >
            {stage === 'importing' ? 'Import 중…' : 'Import 실행'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default OntologyImportDialog;
