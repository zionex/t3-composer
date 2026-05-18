import React from 'react';
import { Box, Card, CardContent, Typography, Stack, Chip, Alert, Grid, TextField, Button } from '@mui/material';
import MockShell from '../_shared/MockShell';

export default function FreeFormMockup() {
  return (
    <MockShell
      patternCode="free_form"
      patternLabel="비표준 / 자유 폼"
      layoutCategory="LAYOUT_SINGLE"
      description="분류기 휴리스틱이 매칭한 표준 컴포넌트가 없는 화면. 일반적으로 설정 폼·로그인·404 등."
    >
      <Box sx={{ p: 2 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          <strong>free_form</strong> 은 Phase 1 분류기의 catch-all 카테고리입니다.
          BaseGrid·SearchArea·SplitPanel·DashboardPanel 등 표준 골격이 없을 때 분류됩니다.
          전체 화면의 18.3% (175개) 가 여기에 해당하며, 대부분 사용자 정의 폼 / 설정 / 사이드 패널입니다.
        </Alert>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1.5 }}>예시 1: 사용자 설정 폼</Typography>
                <Stack spacing={1.5}>
                  <TextField label="알림 이메일" defaultValue="user@zionex.com" size="small" fullWidth />
                  <TextField label="기본 PlanScope" defaultValue="PS01 — Global" size="small" fullWidth />
                  <TextField label="기본 거점" defaultValue="LC-KR-01 — KR-Suwon Plant" size="small" fullWidth />
                  <TextField label="화면 새로고침 간격(초)" defaultValue="60" size="small" fullWidth type="number" />
                  <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 1 }}>
                    <Button size="small" variant="outlined">초기화</Button>
                    <Button size="small" variant="contained">저장</Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1.5 }}>예시 2: 안내·도움말 영역</Typography>
                <Stack spacing={1}>
                  <Typography variant="body2">
                    이 화면 분류 카테고리에 속하는 대표적인 화면 유형:
                  </Typography>
                  {[
                    { tag: '설정 폼',  desc: '시스템·사용자 환경 설정', count: 38 },
                    { tag: '로그인·인증', desc: '로그인 / 비밀번호 변경 / 권한 거절', count: 5 },
                    { tag: '404·오류', desc: '에러 페이지', count: 4 },
                    { tag: 'Sub 패널',  desc: '메인 화면의 보조 drawer / accordion', count: 62 },
                    { tag: '내부 부품',  desc: '사용자 정의 컴포넌트', count: 28 },
                    { tag: '기타',  desc: '비분류', count: 38 },
                  ].map((row) => (
                    <Stack key={row.tag} direction="row" spacing={1.5} alignItems="center">
                      <Chip size="small" label={row.tag} sx={{ minWidth: 90 }} />
                      <Typography sx={{ flex: 1, fontSize: 13 }}>{row.desc}</Typography>
                      <Typography sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'text.secondary' }}>{row.count}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </MockShell>
  );
}
