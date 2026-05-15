import React from 'react';
import { Box, Card, CardContent, Typography, Stack, Chip, Grid, Button, LinearProgress, FormControl, InputLabel, Select, MenuItem, Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';

import MockShell from '../_shared/MockShell';
import CbLogPane from '../_shared/CbLogPane';

const JOB_LOGS = [
  { time: '14:31:08', level: 'INFO',  message: '[Insight] Job ID = INS-J-20260413-014 submitted' },
  { time: '14:31:09', level: 'INFO',  message: 'Polling /api/insight/jobs/INS-J-20260413-014 (interval=2s)' },
  { time: '14:31:11', level: 'INFO',  message: 'Job status: QUEUED → STARTING' },
  { time: '14:31:14', level: 'INFO',  message: 'Job status: STARTING → RUNNING' },
  { time: '14:31:18', level: 'DEBUG', message: 'Phase 1/3: Graph build (entities=4218, edges=15640)' },
  { time: '14:32:42', level: 'INFO',  message: 'Phase 1 complete (84s)' },
  { time: '14:32:43', level: 'DEBUG', message: 'Phase 2/3: Insight extraction (LLM_PHASE1)' },
  { time: '14:34:55', level: 'WARN',  message: 'Slow node detected — entity_id=ENT-2089 (12.4s)' },
  { time: '14:35:18', level: 'INFO',  message: 'Phase 2 complete (155s)' },
  { time: '14:35:19', level: 'DEBUG', message: 'Phase 3/3: Predict + close network' },
];

const PREDICT_RESULT = [
  { entity: 'IT-A001 LED Module 60W', insight: '4월 수요 +18% — KR-Suwon 라인 증설 권고', conf: 0.91 },
  { entity: 'IT-D002 Display Panel 55"', insight: '결품 위험 — 2주 내 안전재고 미달 예상', conf: 0.87 },
  { entity: 'AC-001 Samsung Display', insight: '발주 패턴 변경 감지 — 월 2회 → 주 1회', conf: 0.82 },
  { entity: 'LC-CN-02 CN-Suzhou Plant', insight: '용량 부족 시그널 — Q3 +12% 보강 검토', conf: 0.79 },
];

export default function CbInsightPredictionMockup() {
  return (
    <MockShell
      patternCode="cb_insight_prediction"
      patternLabel="CB — Insight 예측 (Job 폴링)"
      layoutCategory="LAYOUT_CONTROLBOARD"
      description="PlanScope + 엔진 실행 + Job progress + 결과 그리드 (UI_BF_IS_CONTROLBOARD)"
    >
      <Box sx={{ p: 2 }}>
        {/* PlanScope 입력 */}
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent sx={{ '&:last-child': { pb: 1.5 } }}>
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>PlanScope</InputLabel>
                <Select label="PlanScope" value="M3" onChange={() => {}}>
                  <MenuItem value="M3">M+3 (3개월)</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>대상 도메인</InputLabel>
                <Select label="대상 도메인" value="DP+MP" onChange={() => {}}>
                  <MenuItem value="DP+MP">DP + MP</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Model</InputLabel>
                <Select label="Model" value="GraphRAG-v2" onChange={() => {}}>
                  <MenuItem value="GraphRAG-v2">GraphRAG v2</MenuItem>
                </Select>
              </FormControl>
              <Box sx={{ flex: 1 }} />
              <Button size="small" variant="outlined" color="error" startIcon={<StopIcon />}>중단</Button>
              <Button size="small" variant="contained" startIcon={<PlayArrowIcon />}>예측 시작</Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Job 상태 */}
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Job 진행</Typography>
              <Chip size="small" label="INS-J-20260413-014" sx={{ fontFamily: 'monospace' }} />
              <Chip size="small" label="RUNNING" color="primary" />
              <Box sx={{ flex: 1 }} />
              <Typography variant="caption" color="text.secondary">경과 4m 12s · 예상 완료 1m 30s</Typography>
            </Stack>
            <Grid container spacing={2}>
              {[
                { phase: 'Phase 1 — Graph Build',       percent: 100, status: 'done' },
                { phase: 'Phase 2 — Insight Extract',   percent: 100, status: 'done' },
                { phase: 'Phase 3 — Predict + Close',   percent: 68,  status: 'running' },
              ].map((p) => (
                <Grid item xs={12} md={4} key={p.phase}>
                  <Stack spacing={0.5}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="caption" sx={{ fontWeight: 500 }}>{p.phase}</Typography>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{p.percent}%</Typography>
                    </Stack>
                    <LinearProgress variant="determinate" value={p.percent} sx={{ height: 8, borderRadius: 0.5 }} color={p.status === 'done' ? 'success' : 'primary'} />
                  </Stack>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        {/* Log + Result */}
        <Grid container spacing={1.5}>
          <Grid item xs={12} md={6}>
            <CbLogPane lines={JOB_LOGS} title="Job 실행 로그 (INS-J-20260413-014)" height={300} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Insight 결과 (Phase 2 완료분)</Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Entity</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Insight</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>신뢰</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {PREDICT_RESULT.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell sx={{ fontSize: 11, fontFamily: 'monospace' }}>{r.entity}</TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{r.insight}</TableCell>
                        <TableCell align="right">
                          <Chip size="small" label={`${(r.conf * 100).toFixed(0)}%`}
                                color={r.conf > 0.9 ? 'success' : r.conf > 0.8 ? 'warning' : 'default'}
                                sx={{ height: 18, fontSize: 10 }} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </MockShell>
  );
}
