import React from 'react';
import { Box, Stack, Chip, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell, LinearProgress } from '@mui/material';
import MockShell from '../../_shared/MockShell';

// PLANNEL IP 평가 — TargetInventoryEvaluation / TargetInventoryEvaluationResult 2개
// LAYOUT_DASHBOARD — 평가 점수 KPI + 카테고리별 점수 매트릭스

const SCORE_KPIS = [
  { label: '전체 평가 점수', value: '82.4',  sub: '/ 100',     color: 'primary' },
  { label: 'A등급 품목',     value: '142',   sub: '23%',       color: 'success' },
  { label: 'B등급 품목',     value: '486',   sub: '54%',       color: 'info' },
  { label: 'C등급 품목',     value: '205',   sub: '23%',       color: 'warning' },
];

const CATEGORY_SCORES = [
  { cat: '서비스 레벨 달성', target: 95, actual: 92.4, score: 89, color: 'warning' },
  { cat: '재고 회전율',      target: 10, actual:  8.4, score: 82, color: 'warning' },
  { cat: '안전재고 정확도',  target: 90, actual: 91.5, score: 95, color: 'success' },
  { cat: 'Slow Moving 비율', target:  5, actual:  5.8, score: 78, color: 'warning' },
  { cat: 'Obsolete 처리',   target:  2, actual:  0.7, score: 96, color: 'success' },
  { cat: '결품 발생율',     target:  3, actual:  3.4, score: 81, color: 'warning' },
];

const ITEM_GRADES = [
  { item: 'LED Module 60W',  grade: 'A', score: 94, issues: 0 },
  { item: 'LED Module 80W',  grade: 'A', score: 91, issues: 1 },
  { item: 'PCB Board v3',    grade: 'B', score: 84, issues: 2 },
  { item: 'Aluminum HS',     grade: 'B', score: 81, issues: 1 },
  { item: 'PCB Board v4',    grade: 'C', score: 67, issues: 4 },
];

export default function IpEvaluationMockup() {
  return (
    <MockShell
      patternCode="plannel_ip_evaluation"
      patternLabel="PlaNEL — IP 평가 (Target Inventory Evaluation / Result)"
      layoutCategory="LAYOUT_DASHBOARD"
      description="목표 재고 정책 평가 점수 + 카테고리별 비교 + 품목별 등급. IP 운영 성과 평가."
    >
      <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          {SCORE_KPIS.map((k) => (
            <Paper key={k.label} elevation={1} sx={{ flex: 1, p: 2, borderTop: '3px solid', borderTopColor: `${k.color}.main` }}>
              <Typography variant="caption" color="text.secondary">{k.label}</Typography>
              <Typography variant="h3" sx={{ fontWeight: 700, color: `${k.color}.main` }}>{k.value}</Typography>
              <Typography variant="caption" color="text.secondary">{k.sub}</Typography>
            </Paper>
          ))}
        </Stack>

        <Stack direction="row" spacing={2}>
          <Paper sx={{ p: 2, flex: 1.4 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>카테고리별 점수</Typography>
            <Stack spacing={1.5}>
              {CATEGORY_SCORES.map((c) => (
                <Box key={c.cat}>
                  <Stack direction="row" alignItems="center" sx={{ mb: 0.3 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{c.cat}</Typography>
                    <Box sx={{ flexGrow: 1 }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', mr: 1 }}>
                      target {c.target} / actual {c.actual}
                    </Typography>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, minWidth: 30 }}>{c.score}</Typography>
                  </Stack>
                  <LinearProgress variant="determinate" value={c.score} color={c.color}
                    sx={{ height: 8, borderRadius: 1 }} />
                </Box>
              ))}
            </Stack>
          </Paper>

          <Paper sx={{ p: 0, flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
              품목 등급 (Top 5)
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'grey.100' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>등급</TableCell>
                  <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>점수</TableCell>
                  <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>이슈</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ITEM_GRADES.map((g) => (
                  <TableRow key={g.item} hover>
                    <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>{g.item}</TableCell>
                    <TableCell><Chip label={g.grade} size="small" color={g.grade === 'A' ? 'success' : g.grade === 'B' ? 'info' : 'warning'}
                      sx={{ fontWeight: 700 }} /></TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{g.score}</TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>
                      <Chip label={g.issues} size="small"
                        color={g.issues === 0 ? 'success' : g.issues <= 2 ? 'warning' : 'error'} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Stack>
      </Box>
    </MockShell>
  );
}
