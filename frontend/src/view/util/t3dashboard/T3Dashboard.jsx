import React, { Suspense } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import UserDashboardPage from './component/dashboardstudio/UserDashboardPage';

/**
 * t3-composer Dashboard 메뉴 진입점.
 *
 * insight-front의 UserDashboardPage를 t3-composer 탭 레이아웃 안에서 렌더링한다.
 * - API: insight-neo (포트 9160), INSIGHT_API_BASE 환경변수로 구성
 * - 사용자: auth/currentUser.js (composer-dev 고정).
 *   x-user-id 헤더 자동 주입 (serviceCall.js). ENABLE_AUTH=true 시 access_token 도 주입.
 * - 레이아웃: 탭 전체 높이를 채우는 Box
 */
export default function T3Dashboard({ onUseAsScreen } = {}) {
  return (
    <Box sx={{ width: '100%', height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
      <Suspense
        fallback={
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 2 }}>
            <CircularProgress size={24} />
            <Typography variant="body2" color="text.secondary">Dashboard 로딩 중...</Typography>
          </Box>
        }
      >
        <UserDashboardPage onUseAsScreen={onUseAsScreen} />
      </Suspense>
    </Box>
  );
}
