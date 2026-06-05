import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography, Paper, Chip, Avatar, LinearProgress,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RefreshIcon from '@mui/icons-material/Refresh';
import AssessmentIcon from '@mui/icons-material/Assessment';
import FlagIcon from '@mui/icons-material/Flag';
import MockShell from '../../_shared/MockShell';
import CbStepper from '../../_shared/CbStepper';

// CJBO — TP (Target Plan) 워크플로 통합
// UI_DT_93 TP Control Board · UI_DT_94 TP 진행상태 · UI_DT_95 TP 계획입력

const STEPS = [
  { label: 'TP 버전 오픈',     status: 'done',    detail: '06-01' },
  { label: '기준정보 적재',    status: 'done',    detail: '06-01' },
  { label: '경영계획 연계',    status: 'done',    detail: '06-02' },
  { label: 'BF 베이스라인',    status: 'done',    detail: '06-02' },
  { label: '담당자 입력',      status: 'done',    detail: '06-03' },
  { label: '본부장 검토',      status: 'running', detail: '진행' },
  { label: 'SCM 최종 확정',    status: 'pending', detail: '-' },
];

const KPIS = [
  { label: 'TP 입력 완료', value: '100%',    sub: '182 / 182명', color: 'success' },
  { label: '검토 진척',     value: '62%',     sub: '21 / 34팀',  color: 'info'    },
  { label: '버전',          value: 'V2026-06', sub: 'TP 6개월',  color: 'primary' },
  { label: '마감 D-day',    value: 'D-5',     sub: '06-09 18:00', color: 'warning' },
];

const TEAMS = [
  { TEAM: '영업1본부 - 영업1팀',  HEAD: '김민수 팀장',    TY: 32850, REVIEW_RATIO: 100, STATUS: 'approved' },
  { TEAM: '영업1본부 - 영업2팀',  HEAD: '이정훈 팀장',    TY: 28500, REVIEW_RATIO: 100, STATUS: 'approved' },
  { TEAM: '영업1본부 - 영업3팀',  HEAD: '박서연 팀장',    TY: 21200, REVIEW_RATIO:  85, STATUS: 'in_review' },
  { TEAM: 'NGP본부 - NGP1팀',     HEAD: '정재현 팀장',    TY: 18800, REVIEW_RATIO:  72, STATUS: 'in_review' },
  { TEAM: 'NGP본부 - NGP2팀',     HEAD: '송하늘 팀장',    TY: 15500, REVIEW_RATIO:  60, STATUS: 'in_review' },
  { TEAM: '해외영업본부 - 동남아', HEAD: '박글로벌 팀장', TY: 42500, REVIEW_RATIO:  40, STATUS: 'returned' },
  { TEAM: '해외영업본부 - 미주',   HEAD: '최가람 팀장',   TY: 28800, REVIEW_RATIO:   0, STATUS: 'pending' },
];

const STATUS_INFO = {
  approved:  { label: '승인',     color: 'success' },
  in_review: { label: '검토중',   color: 'info' },
  returned:  { label: '반려',     color: 'error' },
  pending:   { label: '대기',     color: 'default' },
};

function TpTrendChart() {
  const W = 800, H = 180, P = 35;
  const months = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
  const tp =     [12.0, 12.5, 13.0, 13.2, 13.5, 13.8, 14.0, 14.2, 14.5, 14.8, 15.0, 15.5];
  const actual = [11.8, 12.4, 13.1, 13.0, 13.6, null, null, null, null, null, null, null];
  const xStep = (W - P * 2) / (months.length - 1);
  const yScale = (v) => H - P - ((v - 10) / 10) * (H - P * 2);
  const dTp = tp.map((v, i) => `${i === 0 ? 'M' : 'L'} ${P + xStep * i} ${yScale(v)}`).join(' ');
  const dAct = actual.filter((v) => v != null).map((v, i) => `${i === 0 ? 'M' : 'L'} ${P + xStep * i} ${yScale(v)}`).join(' ');
  return (
    <Paper variant="outlined" sx={{ p: 1.5, height: 200 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>TP 월별 추이 — 단위: 억 KRW (목표 vs 실적)</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Stack direction="row" spacing={1}>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Box sx={{ width: 12, height: 3, backgroundColor: '#3b82f6', borderRadius: 1 }} />
            <Typography variant="caption">TP 목표</Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Box sx={{ width: 12, height: 3, backgroundColor: '#10b981', borderRadius: 1 }} />
            <Typography variant="caption">실적</Typography>
          </Stack>
        </Stack>
      </Stack>
      <Box sx={{ height: 140 }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%' }}>
          {[10, 13, 16, 20].map((y) => (
            <g key={y}>
              <line x1={P} y1={yScale(y)} x2={W - P} y2={yScale(y)} stroke="#e5e7eb" strokeWidth="0.5" />
              <text x={P - 5} y={yScale(y)} fill="#9ca3af" fontSize="10" textAnchor="end" dy="3">{y}</text>
            </g>
          ))}
          {months.map((m, i) => (
            <text key={m} x={P + xStep * i} y={H - 8} fill="#6b7280" fontSize="10" textAnchor="middle">{m}</text>
          ))}
          <path d={dTp} fill="none" stroke="#3b82f6" strokeWidth="2.5" />
          {tp.map((v, i) => (
            <circle key={i} cx={P + xStep * i} cy={yScale(v)} r="3" fill="#3b82f6" />
          ))}
          <path d={dAct} fill="none" stroke="#10b981" strokeWidth="2.5" />
          {actual.map((v, i) => v != null && (
            <circle key={i} cx={P + xStep * i} cy={yScale(v)} r="3.5" fill="#10b981" />
          ))}
        </svg>
      </Box>
    </Paper>
  );
}

export default function CjboTpWorkflowMockup() {
  return (
    <MockShell patternCode="cjbo_tp_workflow" patternLabel="CJBO — TP 계획 워크플로 (Controlboard·Status·Entry)"
      layoutCategory="LAYOUT_CONTROLBOARD"
      description="TP (Target Plan) — 7단계 워크플로 + KPI + 본부/팀별 검토 진척 + 월별 추이. UI_DT_93/94/95.">
      <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField label="버전" size="small" value="V2026-06" sx={{ width: 130 }} />
          <TextField label="단계" size="small" select value="REVIEW" sx={{ width: 160 }}>
            <MenuItem value="REVIEW">본부장 검토</MenuItem>
            <MenuItem value="CONFIRM">SCM 확정</MenuItem>
          </TextField>
          <TextField label="범위" size="small" select value="6M" sx={{ width: 130 }}>
            <MenuItem value="6M">6개월</MenuItem><MenuItem value="12M">12개월</MenuItem>
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" color="success" startIcon={<PlayArrowIcon />}>실행</Button>
          <Button variant="outlined" size="small" startIcon={<RefreshIcon />}>새로고침</Button>
        </Stack>
      </Box>

      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5, flexGrow: 1, overflow: 'auto' }}>
        <Paper variant="outlined" sx={{ p: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>TP 7단계 워크플로</Typography>
          <CbStepper steps={STEPS} />
        </Paper>

        <Stack direction="row" spacing={1.5}>
          {KPIS.map((k, i) => (
            <Paper key={k.label} variant="outlined" sx={{ p: 1.5, flex: 1 }}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Avatar sx={{ backgroundColor: `${k.color}.light`, color: `${k.color}.dark`, width: 40, height: 40 }}>
                  {i === 0 ? <AssessmentIcon /> : i === 3 ? <FlagIcon /> : <AssessmentIcon />}
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary">{k.label}</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: `${k.color}.main` }}>{k.value}</Typography>
                  <Typography variant="caption" color="text.secondary">{k.sub}</Typography>
                </Box>
              </Stack>
            </Paper>
          ))}
        </Stack>

        <TpTrendChart />

        <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 220 }}>
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>본부/팀별 검토 진척</Typography>
          </Box>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {['본부 / 팀','팀장','연 TP 계획 (백만)','검토 진척','상태','액션'].map((c) => (
                    <TableCell key={c} sx={{ backgroundColor: 'grey.100', fontWeight: 700,
                      textAlign: ['연 TP 계획 (백만)','검토 진척','상태','액션'].includes(c) ? 'center' : 'left' }}>{c}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {TEAMS.map((t, i) => {
                  const s = STATUS_INFO[t.STATUS];
                  return (
                    <TableRow key={i} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{t.TEAM}</TableCell>
                      <TableCell>{t.HEAD}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>{t.TY.toLocaleString()}</TableCell>
                      <TableCell sx={{ textAlign: 'center', minWidth: 140 }}>
                        <Stack direction="row" alignItems="center" spacing={0.75}>
                          <LinearProgress variant="determinate" value={t.REVIEW_RATIO} color={s.color}
                            sx={{ flex: 1, height: 8, borderRadius: 1 }} />
                          <Typography variant="caption" sx={{ fontFamily: 'monospace', minWidth: 32 }}>{t.REVIEW_RATIO}%</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Chip size="small" label={s.label} color={s.color} />
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          {t.STATUS === 'in_review' && <Button size="small" variant="contained" color="success">승인</Button>}
                          {t.STATUS === 'in_review' && <Button size="small" variant="outlined" color="error">반려</Button>}
                          {t.STATUS === 'pending' && <Button size="small" variant="outlined">알림</Button>}
                          {t.STATUS === 'approved' && <Button size="small" variant="text">상세</Button>}
                          {t.STATUS === 'returned' && <Button size="small" variant="outlined" color="warning">재요청</Button>}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </MockShell>
  );
}
