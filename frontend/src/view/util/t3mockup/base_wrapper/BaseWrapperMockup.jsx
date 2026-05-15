import React from 'react';
import { Box, Card, CardContent, Typography, Stack, Chip, Alert } from '@mui/material';
import MockShell from '../_shared/MockShell';

export default function BaseWrapperMockup() {
  return (
    <MockShell
      patternCode="base_wrapper"
      patternLabel="Base*.jsx 래퍼 (BaseEntry / BaseControlBoard 등)"
      layoutCategory="BASE"
      description="공통 로직·prop 처리만 담당하는 래퍼. 화면 진입점은 별도 (Entry.jsx 등)."
    >
      <Box sx={{ p: 2 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          <code>Base&lt;Name&gt;.jsx</code> 패턴은 화면 진입점이 아닌 <strong>공통 래퍼</strong>입니다.
          실제 라우팅 진입은 <code>&lt;Name&gt;.jsx</code> 가 담당.
        </Alert>

        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6">전형적인 구조</Typography>
            <Box sx={{ p: 2, mt: 1.5, fontFamily: 'monospace', fontSize: 13, backgroundColor: 'grey.100', borderRadius: 1 }}>
              <div>view/demandplan/entry/entry/</div>
              <div>├─ <strong>BaseEntry.jsx</strong>  &nbsp;&nbsp;← 공통 prop 정의 / 데이터 fetch / 컨텍스트 wrapping</div>
              <div>└─ <strong>Entry.jsx</strong>      &nbsp;&nbsp;← 화면 진입점. BaseEntry 를 사용하여 렌더</div>
            </Box>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" sx={{ mb: 1 }}>Phase 1 검출된 Base 래퍼 (6개)</Typography>
            <Stack spacing={1}>
              {[
                { name: 'BaseEntry',         path: 'demandplan/entry/entry/' },
                { name: 'BaseControlBoard',  path: 'demandplan/version/controlboard/' },
                { name: 'BaseControlBoardMaster', path: 'demandplan/setting/controlboardmaster/' },
                { name: 'BaseDpReport',      path: 'demandplan/report/' },
                { name: 'BaseSetting',       path: 'demandplan/setting/' },
                { name: 'BaseEntryRevise',   path: 'demandplan/entry/entryrevise/' },
              ].map((b) => (
                <Stack key={b.name} direction="row" spacing={2} alignItems="center">
                  <Chip size="small" label={b.name + '.jsx'} sx={{ fontFamily: 'monospace', minWidth: 200 }} />
                  <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>view/{b.path}</Typography>
                </Stack>
              ))}
            </Stack>
            <Alert severity="warning" sx={{ mt: 2 }}>
              <strong>주의</strong>: Base 래퍼는 라우팅 진입점이 아니므로 <code>TB_AD_MENU</code> 에 직접 등록되지 않습니다.
              메뉴 진입은 항상 동일 폴더의 <code>&lt;Name&gt;.jsx</code> (Base prefix 없는 파일) 을 가리킵니다.
            </Alert>
          </CardContent>
        </Card>
      </Box>
    </MockShell>
  );
}
