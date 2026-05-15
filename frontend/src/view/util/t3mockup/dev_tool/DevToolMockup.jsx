import React from 'react';
import {
  Box, Card, CardContent, Stack, Typography, Chip, Grid, Button, TextField, FormControl,
  InputLabel, Select, MenuItem, Switch, FormControlLabel, Divider,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import TerminalIcon from '@mui/icons-material/Terminal';
import SettingsIcon from '@mui/icons-material/Settings';

import MockShell from '../_shared/MockShell';

const LOGS = [
  { time: '17:42:18', level: 'INFO',  message: '[DevMakeData] 시작 — items=14, accounts=9, locations=8' },
  { time: '17:42:19', level: 'DEBUG', message: 'Inserted 14 rows into TB_CM_ITEM_MST' },
  { time: '17:42:20', level: 'DEBUG', message: 'Inserted 9 rows into TB_CM_ACCOUNT_MST' },
  { time: '17:42:21', level: 'DEBUG', message: 'Inserted 8 rows into TB_CM_LOCAT_MST' },
  { time: '17:42:22', level: 'INFO',  message: 'Generating 187 SKU forecast data (12 months)' },
  { time: '17:42:34', level: 'INFO',  message: 'Forecast data generation done (12.2s)' },
  { time: '17:42:35', level: 'INFO',  message: '✓ DevMakeData 완료 — 총 2,244 rows · 16.7s' },
];

export default function DevToolMockup() {
  return (
    <MockShell
      patternCode="dev_tool"
      patternLabel="Developer Tool — 개발자/시스템 설정"
      layoutCategory="LAYOUT_SINGLE"
      description="Form + Action 버튼 + 결과 log. DevMakeData · MenuBadge 등 시스템 도구"
    >
      <Box sx={{ p: 2 }}>
        <Grid container spacing={1.5}>
          {/* Form 영역 */}
          <Grid item xs={12} md={5}>
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                  <SettingsIcon color="action" fontSize="small" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>실행 옵션</Typography>
                </Stack>

                <Stack spacing={1.5}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>대상 환경</InputLabel>
                    <Select label="대상 환경" value="dev" onChange={() => {}}>
                      <MenuItem value="dev">dev (composer-db)</MenuItem>
                      <MenuItem value="local">local (target-mssql)</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl size="small" fullWidth>
                    <InputLabel>시나리오</InputLabel>
                    <Select label="시나리오" value="BASIC" onChange={() => {}}>
                      <MenuItem value="BASIC">BASIC — 14 items, 9 accounts</MenuItem>
                      <MenuItem value="FULL">FULL — 187 SKUs, 8 plants</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField size="small" label="생성 행 수 (max)" defaultValue={1000} type="number" fullWidth />

                  <Stack spacing={0.5}>
                    <FormControlLabel control={<Switch defaultChecked size="small" />} label="기존 데이터 truncate" />
                    <FormControlLabel control={<Switch defaultChecked size="small" />} label="외래키 검증 skip" />
                    <FormControlLabel control={<Switch size="small" />} label="dry-run (실제 INSERT 안 함)" />
                  </Stack>

                  <Divider />

                  <Stack direction="row" spacing={1}>
                    <Button variant="contained" startIcon={<PlayArrowIcon />} disableElevation fullWidth>
                      실행
                    </Button>
                    <Button variant="outlined" disabled>
                      취소
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            {/* 환경 정보 */}
            <Card variant="outlined" sx={{ mt: 1.5 }}>
              <CardContent sx={{ '&:last-child': { pb: 1.5 } }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Environment
                </Typography>
                <Stack spacing={0.5}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption">DB</Typography>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>composer-db (PG 17)</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption">Backend</Typography>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>composer-backend :8090</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption">User</Typography>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>composer-dev</Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* 결과 로그 */}
          <Grid item xs={12} md={7}>
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                  <TerminalIcon color="action" fontSize="small" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>실행 결과</Typography>
                  <Box sx={{ flex: 1 }} />
                  <Chip size="small" color="success" label="DONE 16.7s" />
                </Stack>

                <Box sx={{ bgcolor: '#0f1219', color: '#ebedf2', borderRadius: 1, p: 1.5, maxHeight: 420, overflow: 'auto', fontFamily: 'monospace' }}>
                  {LOGS.map((l, i) => {
                    const color =
                      l.level === 'ERROR' ? '#ef4444' :
                      l.level === 'WARN'  ? '#f59e0b' :
                      l.level === 'DEBUG' ? '#94a3b8' :
                      '#10b981';
                    return (
                      <Stack key={i} direction="row" spacing={1} sx={{ fontSize: 11.5, mb: 0.25 }}>
                        <Typography sx={{ color: '#626f8d', fontSize: 11, minWidth: 64, fontFamily: 'inherit' }}>{l.time}</Typography>
                        <Typography sx={{ color, fontSize: 10, fontWeight: 700, minWidth: 44, fontFamily: 'inherit' }}>[{l.level}]</Typography>
                        <Typography sx={{ color: '#ebedf2', fontSize: 11, flex: 1, fontFamily: 'inherit', whiteSpace: 'pre-wrap' }}>{l.message}</Typography>
                      </Stack>
                    );
                  })}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </MockShell>
  );
}
