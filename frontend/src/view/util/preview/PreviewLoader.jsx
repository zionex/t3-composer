import React, { Suspense, useMemo } from 'react';
import { useLocation, useHistory } from 'react-router-dom';

import {
  Box, Paper, Stack, Typography, Alert, AlertTitle, Chip, Button, CircularProgress,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ArrowBackIcon  from '@mui/icons-material/ArrowBack';

/**
 * Phase 2 — preview 화면 직접 진입 라우터.
 *
 * URL 형식: /preview/:sid8/:viewSub  (viewSub 에 슬래시 포함, 예: util/userinfomgmt/UserInfoMgmt)
 *
 * webpack 의 dynamic import 는 prefix 가 명확해야 chunk split 가능.
 * → `../../_preview/${sid8}/${viewSub}.jsx` 형태로 build time 에 _preview/** 모든 jsx 를 chunk 화.
 */
function PreviewLoader() {
  const location = useLocation();
  const history  = useHistory();

  const m = /^\/preview\/([a-zA-Z0-9]+)\/(.+)$/.exec(location.pathname);
  if (!m) {
    return <Box sx={{ p: 3 }}><Alert severity="error">잘못된 preview URL: {location.pathname}</Alert></Box>;
  }
  const sid8 = m[1];
  const viewSub = m[2].replace(/\/$/, '');

  // useMemo 로 sid8/viewSub 가 같으면 같은 lazy 컴포넌트 사용 — 무한 재마운트 방지
  const Comp = useMemo(() => React.lazy(
    () => import(
      /* webpackInclude: /\.jsx$/ */
      /* webpackChunkName: "preview-[request]" */
      `../../_preview/${sid8}/${viewSub}.jsx`
    ).catch((err) => ({
      default: () => (
        <Box sx={{ p: 3 }}>
          <Alert severity="error">
            <AlertTitle>preview 모듈 로드 실패</AlertTitle>
            <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
              경로: <code>view/_preview/{sid8}/{viewSub}.jsx</code>
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'text.secondary' }}>
              {err?.message || String(err)}
            </Typography>
          </Alert>
        </Box>
      ),
    })),
  ), [sid8, viewSub]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* preview 표시 헤더 */}
      <Paper variant="outlined" sx={{ borderRadius: 0, borderLeft: 0, borderRight: 0, borderTop: 0,
                                       bgcolor: 'rgba(6,182,212,0.06)' }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 2, py: 0.8 }}>
          <VisibilityIcon fontSize="small" color="info" />
          <Typography variant="body2" sx={{ fontWeight: 700 }}>미리보기 모드</Typography>
          <Chip size="small" color="info" label={`PV ${sid8}`} sx={{ height: 20, fontSize: 10 }} />
          <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>
            view/_preview/{sid8}/{viewSub}.jsx
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Button size="small" startIcon={<ArrowBackIcon />} onClick={() => history.push('/composer')}>
            Composer 로 돌아가기
          </Button>
        </Stack>
      </Paper>

      {/* 실제 preview 컴포넌트 */}
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        <Suspense fallback={
          <Stack alignItems="center" justifyContent="center" sx={{ height: '100%', gap: 1 }}>
            <CircularProgress />
            <Typography variant="caption" color="text.secondary">preview 모듈 로드 중...</Typography>
          </Stack>
        }>
          <Comp />
        </Suspense>
      </Box>
    </Box>
  );
}

export default PreviewLoader;
