import React from 'react';
import { useLocation, useHistory } from 'react-router-dom';

import {
    Box, Paper, Stack, Typography, Alert, AlertTitle, Chip, Button,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ArrowBackIcon  from '@mui/icons-material/ArrowBack';

/**
 * /preview/:sid8/:viewSub 라우트 진입점.
 *
 * Phase 2 격리 (옵션 A) 이전: webpack dynamic import 로 _preview 전체를 build time
 * chunk 화 → 어떤 산출물 JSX 의 오류라도 main bundle 컴파일 실패로 시스템 마비.
 *
 * 격리 이후: standalone page 진입 흐름은 사용 빈도가 낮고, 정상 흐름은 Composer
 * 워크스페이스의 우측 [실행 화면 LIVE] 탭에 inline 으로 표시되는 PreviewEmbed.
 * 따라서 이 라우트는 안내 화면으로 단순화하고, dynamic import 는 완전히 제거.
 */
function PreviewLoader() {
    const location = useLocation();
    const history  = useHistory();

    const m = /^\/preview\/([a-zA-Z0-9]+)\/(.+)$/.exec(location.pathname);
    const sid8    = m ? m[1] : null;
    const viewSub = m ? m[2].replace(/\/$/, '') : null;

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Paper variant="outlined" sx={{ borderRadius: 0, borderLeft: 0, borderRight: 0, borderTop: 0,
                                            bgcolor: 'rgba(6,182,212,0.06)' }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 2, py: 0.8 }}>
                    <VisibilityIcon fontSize="small" color="info" />
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>미리보기 모드 (standalone)</Typography>
                    {sid8 && (
                        <Chip size="small" color="info" label={`PV ${sid8}`}
                              sx={{ height: 20, fontSize: 10 }} />
                    )}
                    <Box sx={{ flex: 1 }} />
                    <Button size="small" startIcon={<ArrowBackIcon />}
                            onClick={() => history.push('/composer')}>
                        Composer 로 돌아가기
                    </Button>
                </Stack>
            </Paper>

            <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', p: 3 }}>
                <Alert severity="info">
                    <AlertTitle>standalone 진입은 지원하지 않습니다</AlertTitle>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                        화면 미리보기는 <b>Composer 워크스페이스의 우측 [실행 화면 LIVE] 탭</b>에서
                        inline 으로 표시됩니다.
                    </Typography>
                    {viewSub && (
                        <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary',
                                                            fontFamily: 'monospace' }}>
                            요청 경로: view/_preview/{sid8}/{viewSub}.jsx
                        </Typography>
                    )}
                </Alert>
            </Box>
        </Box>
    );
}

export default PreviewLoader;
