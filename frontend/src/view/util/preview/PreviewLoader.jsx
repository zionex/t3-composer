// =============================================================================
// PreviewLoader — 산출물 화면을 새 브라우저 탭(/preview/<sessionId>/<viewSub>)
// 에서 단독 표시. PreviewEmbed 와 동일한 runtime 사용 — webpack dependency graph
// 와 격리되어 산출물 syntax error 가 main bundle 에 영향 0.
//
// URL 형식: /preview/:sessionId/:viewSub  (viewSub 은 슬래시 포함 가능)
// 예) /preview/019e1ae4abcd.../pk/ornmatmst/OrnMatMst
// =============================================================================
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box, Paper, Stack, Typography, Alert, AlertTitle, Chip, CircularProgress,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';

import { loadPreviewComponent } from '../../../preview/runtime';

function PreviewLoader() {
  const location = useLocation();
  const [phase, setPhase] = useState('loading');   // 'loading' | 'ready' | 'error'
  const [Comp, setComp]   = useState(null);
  const [error, setError] = useState(null);
  const [meta, setMeta]   = useState({ sessionId: null, viewSub: null });

  useEffect(() => {
    const m = /^\/preview\/([a-zA-Z0-9_-]+)\/(.+)$/.exec(location.pathname);
    if (!m) {
      setPhase('error');
      setError('잘못된 preview URL: ' + location.pathname);
      return;
    }
    const sessionId = m[1];
    const viewSub = m[2].replace(/\/$/, '').replace(/\.jsx$/i, '');
    setMeta({ sessionId, viewSub });
    setPhase('loading');
    setError(null);
    setComp(null);

    loadPreviewComponent({ sessionId, viewSub })
      .then((C) => {
        setComp(() => C);
        setPhase('ready');
      })
      .catch((e) => {
        setError(e?.message || String(e));
        setPhase('error');
      });
  }, [location.pathname]);

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Paper variant="outlined" sx={{ borderRadius: 0, borderLeft: 0, borderRight: 0, borderTop: 0,
                                     bgcolor: 'rgba(6,182,212,0.06)' }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 2, py: 0.8 }}>
          <VisibilityIcon fontSize="small" color="info" />
          <Typography variant="body2" sx={{ fontWeight: 700 }}>미리보기 (단독 창)</Typography>
          {meta.sessionId && (
            <Chip size="small" color="info"
                  label={'sid ' + String(meta.sessionId).slice(0, 8)}
                  sx={{ height: 20, fontSize: 10 }} />
          )}
          {meta.viewSub && (
            <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>
              {meta.viewSub}
            </Typography>
          )}
        </Stack>
      </Paper>

      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', p: 1 }}>
        {phase === 'loading' && (
          <Stack alignItems="center" justifyContent="center" sx={{ height: '100%', gap: 1 }}>
            <CircularProgress />
            <Typography variant="caption" color="text.secondary">preview 모듈 로드 중...</Typography>
          </Stack>
        )}
        {phase === 'error' && (
          <Alert severity="error" sx={{ m: 2 }}>
            <AlertTitle>preview 로드 실패</AlertTitle>
            <Typography variant="caption" sx={{ display: 'block', whiteSpace: 'pre-wrap' }}>
              {error}
            </Typography>
          </Alert>
        )}
        {phase === 'ready' && Comp && <Comp />}
      </Box>
    </Box>
  );
}

export default PreviewLoader;
