import React, { Suspense } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import InsertChartOutlinedIcon from '@mui/icons-material/InsertChartOutlined';
import UserDashboardPage from './component/dashboardstudio/UserDashboardPage';
import PageHeader from '../t3composer/PageHeader';

/**
 * t3-composer Dashboard 메뉴 진입점.
 *
 * insight-front의 UserDashboardPage를 t3-composer 탭 레이아웃 안에서 렌더링한다.
 * - API: insight-neo (포트 9160), INSIGHT_API_BASE 환경변수로 구성
 * - 사용자: auth/currentUser.js (composer-dev 고정).
 *   x-user-id 헤더 자동 주입 (serviceCall.js). ENABLE_AUTH=true 시 access_token 도 주입.
 * - 레이아웃: 공용 PageHeader + 콘텐츠 영역 (다른 페이지들과 동일 골격)
 */
export default function T3Dashboard({ onUseAsScreen } = {}) {
  const { t } = useTranslation();
  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <PageHeader
        title={t('common:app.menu.dashboard')}
        icon={InsertChartOutlinedIcon}
        caption={t('common:app.menuHint.dashboard')}
      />
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
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
    </Box>
  );
}
