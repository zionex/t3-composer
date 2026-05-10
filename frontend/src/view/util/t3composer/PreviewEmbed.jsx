import React, { Suspense, useMemo } from 'react';
import { Box, Stack, Typography, CircularProgress, Alert, AlertTitle, Chip } from '@mui/material';
import LaunchIcon from '@mui/icons-material/Launch';

/**
 * 실행 화면 — 산출물 jsx 를 정식 화면처럼 inline 으로 띄움.
 *
 * 내부 구현은 docker 안 격리된 _preview 폴더에서 lazy import 하지만,
 * 사용자에게는 "미리보기" 라는 단어를 노출하지 않고 실제 운영 화면처럼 보이도록.
 *
 * props:
 *   sid8     : 격리 prefix (8자)
 *   viewSub  : view 하위 경로
 */
function PreviewEmbed({ sid8, viewSub }) {
  if (!sid8 || !viewSub) {
    return (
      <Box sx={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 2, p: 4, bgcolor: '#f8fafc',
      }}>
        <LaunchIcon sx={{ fontSize: 56, color: '#cbd5e1' }} />
        <Typography variant="body2" color="text.secondary" align="center">
          헤더의 <b>[화면 실행]</b> 버튼을 누르면<br />
          이 자리에 실제 운영되는 형태의 화면이 표시됩니다.
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Chip label="JSX" size="small" variant="outlined" />
          <Chip label="SQL" size="small" variant="outlined" />
          <Chip label="Java Controller / Service" size="small" variant="outlined" />
        </Stack>
      </Box>
    );
  }

  const cleanedViewSub = viewSub.replace(/\.jsx$/, '');

  const Comp = useMemo(() => React.lazy(
    () => import(
      /* webpackInclude: /\.jsx$/ */
      /* webpackChunkName: "preview-[request]" */
      `../../_preview/${sid8}/${cleanedViewSub}.jsx`
    ).catch((err) => ({
      default: () => (
        <Box sx={{ p: 3 }}>
          <Alert severity="error">
            <AlertTitle>화면 모듈 로드 실패</AlertTitle>
            <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
              경로: <code>{cleanedViewSub}.jsx</code>
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'text.secondary' }}>
              {err?.message || String(err)}
            </Typography>
          </Alert>
        </Box>
      ),
    }))
  ), [sid8, cleanedViewSub]);

  // 헤더 안내 박스 제거 — 실제 운영 화면처럼 깔끔하게 화면 본문만 노출
  return (
    <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', bgcolor: '#fff', display: 'flex', flexDirection: 'column' }}>
      <Suspense fallback={
        <Stack alignItems="center" justifyContent="center" sx={{ height: '100%', gap: 1 }}>
          <CircularProgress />
          <Typography variant="caption" color="text.secondary">화면 로드 중...</Typography>
        </Stack>
      }>
        <Comp />
      </Suspense>
    </Box>
  );
}

export default PreviewEmbed;
