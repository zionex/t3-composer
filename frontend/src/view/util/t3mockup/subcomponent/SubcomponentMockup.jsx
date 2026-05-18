import React from 'react';
import { Box, Card, CardContent, Typography, Stack, Chip, Alert } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import MockShell from '../_shared/MockShell';

export default function SubcomponentMockup() {
  return (
    <MockShell
      patternCode="subcomponent"
      patternLabel="서브 컴포넌트 (메인 화면의 내부 부품)"
      layoutCategory="SUBCOMPONENT"
      description="메인 화면(예: AbcAnalysis.jsx)의 `components/` 폴더에 들어있는 내부 컴포넌트. 라우팅 진입점 아님."
    >
      <Box sx={{ p: 2 }}>
        <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 2 }}>
          이 카테고리는 화면 패턴이 아니라 <strong>메인 화면의 내부 부품</strong>을 가리킵니다.
          예: <code>view/baselineforecast/master/abcanalysis/components/AbcXyzBox.jsx</code> 처럼 메인 화면(AbcAnalysis) 안에서만 사용되는 컴포넌트.
        </Alert>

        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 1 }}>특징</Typography>
            <Stack spacing={1}>
              {[
                ['라우팅', 'menus.js / TB_AD_MENU 에 등록되지 않음'],
                ['경로', "view/<module>/<category>/<screen>/<strong>components/</strong><PartName>.jsx"],
                ['용도', '복잡한 화면을 작은 부품으로 분해 (가독성·재사용성)'],
                ['예시', 'AbcXyzBox · heatmap · ValidationAccordion · ForecastresultDrawer'],
                ['Phase 1 검출 수', '16개 (전체 화면의 1.7%)'],
              ].map(([k, v]) => (
                <Stack key={k} direction="row" spacing={2}>
                  <Typography sx={{ width: 80, fontWeight: 700 }}>{k}</Typography>
                  <Typography sx={{ flex: 1 }} dangerouslySetInnerHTML={{ __html: v }} />
                </Stack>
              ))}
            </Stack>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" sx={{ mb: 1 }}>서브 컴포넌트 예시 (정적 표현)</Typography>
            <Box sx={{ p: 2, border: '2px dashed', borderColor: 'primary.light', borderRadius: 1, backgroundColor: 'primary.lighter' }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                <Typography variant="subtitle2">AbcXyzBox (sub-component)</Typography>
                <Chip size="small" label="<AbcXyzBox />" sx={{ fontFamily: 'monospace' }} />
              </Stack>
              <Stack direction="row" spacing={2}>
                {['A', 'B', 'C'].map((c, i) => (
                  <Box key={c} sx={{ flex: 1, p: 1.5, backgroundColor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="caption" color="text.secondary">Class {c}</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>{[12, 8, 4][i]}</Typography>
                    <Typography variant="caption" color="text.secondary">{[60, 25, 15][i]}%</Typography>
                  </Box>
                ))}
              </Stack>
              <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
                ↑ 메인 화면 (AbcAnalysis.jsx) 의 화면 일부분만 담당
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </MockShell>
  );
}
