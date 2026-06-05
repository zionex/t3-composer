import React, { useState } from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography, Paper, Tabs, Tab, Chip, Avatar,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import MockShell from '../../_shared/MockShell';
import { cellSx, percentStatus } from '../../_shared/styleCallback';

// CJBO — 수요계획 정확도 / 계획대비 실적 / RTF 리포트
// UI_DP_PLAN_ACCURACY — M_1/M_2/M_3 × ACT_QTY/PLAN_QTY/ACCURACY (그룹 헤더)
// UI_DP_PLAN_REPORT   — 동적 시간 버킷 (월별 PLAN 만)
// UI_DP_RTF_REPORT    — RTF 충족률 + rtfQryGbn (ALL/D 차이/A 대체) + qtyamtOption

const KPIS_ACC = [
  { label: 'OP 정확도',    value: '94.2%', delta: '+2.1%p', color: 'success', icon: TrendingUpIcon },
  { label: 'TP 정확도',    value: '88.5%', delta: '-1.3%p', color: 'warning', icon: TrendingDownIcon },
  { label: 'RTF 충족률',   value: '91.8%', delta: '+0.5%p', color: 'info',    icon: AssessmentIcon },
  { label: '평균 편차',    value: '4.7%',  delta: '-0.8%p', color: 'success', icon: ShowChartIcon },
];
const KPIS_PLAN = [
  { label: '계획 합계',    value: '188.0K', delta: '7월 ~ 12월', color: 'primary', icon: AssessmentIcon },
  { label: '실적 누계',    value: '142.3K', delta: '~6월 마감',  color: 'info',    icon: TrendingUpIcon },
  { label: '진척률',       value: '75.7%',  delta: '+1.2%p',     color: 'success', icon: TrendingUpIcon },
  { label: '남은 분',      value: '45.7K',  delta: '6개월',      color: 'warning', icon: AssessmentIcon },
];
const KPIS_RTF = [
  { label: 'RTF (전체)',   value: '91.8%', delta: '+0.5%p',  color: 'info',     icon: AssessmentIcon },
  { label: 'RTF (수출)',   value: '88.3%', delta: '-1.2%p',  color: 'warning',  icon: TrendingDownIcon },
  { label: 'Short 거래',   value: '12건',  delta: '+3 vs 전월', color: 'error',  icon: TrendingDownIcon },
  { label: '대체 발생',    value: '8건',   delta: 'A 옵션',  color: 'highlight',icon: TrendingUpIcon },
];

const TREND_ACC = [85, 88, 91, 89, 92, 94, 93, 95, 94, 92, 94, 95];
const TREND_PLAN = [125, 132, 138, 142, 145, 148, 152, 158, 162, 168, 172, 175];
const TREND_RTF = [82, 85, 88, 87, 90, 91, 89, 92, 91, 88, 90, 92];

// 정확도 — M-1/M-2/M-3 × ACT/PLAN/ACCURACY 그룹 헤더
const ROWS_ACC = [
  { CUST: '롯데마트',    ITEM: 'illuvia 비건마스크 5매', EMP: '김민수', m1: { act: 4900, plan: 5050, acc:  97.0 }, m2: { act: 4700, plan: 4900, acc:  95.9 }, m3: { act: 5100, plan: 5200, acc:  98.1 } },
  { CUST: '쿠팡',        ITEM: 'illuvia 비건마스크 5매', EMP: '이정훈', m1: { act: 4050, plan: 4150, acc:  97.6 }, m2: { act: 3900, plan: 4100, acc:  95.1 }, m3: { act: 4150, plan: 4200, acc:  98.8 } },
  { CUST: '올리브영',    ITEM: 'illuvia 토너 200ml',     EMP: '박서연', m1: { act: 2620, plan: 2600, acc: 100.8 }, m2: { act: 2580, plan: 2650, acc:  97.4 }, m3: { act: 2750, plan: 2700, acc: 101.9 } },
  { CUST: '베트남 KGS',  ITEM: 'CJ Brand Korea KING-RED',EMP: '박글로벌',m1: { act: 5400, plan: 5950, acc:  90.8 }, m2: { act: 5100, plan: 5900, acc:  86.4 }, m3: { act: 5500, plan: 5950, acc:  92.4 } },
  { CUST: '인니 INDOMA', ITEM: 'illuvia MASK',           EMP: '박글로벌',m1: { act: 4950, plan: 5100, acc:  97.1 }, m2: { act: 4700, plan: 5000, acc:  94.0 }, m3: { act: 5090, plan: 5100, acc:  99.8 } },
  { CUST: '말레이 SCH',  ITEM: 'NGP Device #01',          EMP: '정재현', m1: { act: 1450, plan: 1750, acc:  82.9 }, m2: { act: 1280, plan: 1700, acc:  75.3 }, m3: { act: 1370, plan: 1750, acc:  78.3 } },
  { CUST: 'GS25',        ITEM: 'illuvia 크림 50g',         EMP: '송하늘', m1: { act: 2400, plan: 2200, acc: 109.1 }, m2: { act: 2350, plan: 2100, acc: 111.9 }, m3: { act: 2530, plan: 2200, acc: 115.0 } },
];

// 계획 — 동적 시간 버킷 (월별 PLAN 만)
const PLAN_MONTHS = ['07월','08월','09월','10월','11월','12월'];
const ROWS_PLAN = [
  { CUST: '롯데마트',    ITEM: 'illuvia 비건마스크 5매', m: [5100, 5300, 5000, 4900, 5050, 5050] },
  { CUST: '쿠팡',        ITEM: 'illuvia 비건마스크 5매', m: [4200, 4300, 4100, 4100, 4150, 4150] },
  { CUST: '올리브영',    ITEM: 'illuvia 토너 200ml',      m: [2700, 2800, 2700, 2600, 2600, 2600] },
  { CUST: '베트남 KGS',  ITEM: 'CJ Brand Korea KING-RED',m: [6100, 6300, 6000, 5900, 5950, 5950] },
  { CUST: '인니 INDOMA', ITEM: 'illuvia MASK',            m: [5200, 5400, 5100, 5000, 5100, 5100] },
  { CUST: '말레이 SCH',  ITEM: 'NGP Device #01',          m: [1900, 1900, 1800, 1700, 1750, 1750] },
  { CUST: 'GS25',        ITEM: 'illuvia 크림 50g',        m: [2200, 2300, 2200, 2100, 2200, 2200] },
];

// RTF — RTF 충족률 + 대체 / Short 표시
const ROWS_RTF = [
  { CUST: '롯데마트',    ITEM: 'illuvia 비건마스크 5매', DMD: 5300, SUP: 5300, RTF:100.0, SHORT:    0, ALT_QTY:    0, ALT_ITEM: '-', GBN: 'A' },
  { CUST: '쿠팡',        ITEM: 'illuvia 비건마스크 5매', DMD: 4300, SUP: 4300, RTF:100.0, SHORT:    0, ALT_QTY:    0, ALT_ITEM: '-', GBN: 'A' },
  { CUST: '올리브영',    ITEM: 'illuvia 토너 200ml',     DMD: 2800, SUP: 2800, RTF:100.0, SHORT:    0, ALT_QTY:    0, ALT_ITEM: '-', GBN: 'A' },
  { CUST: '베트남 KGS',  ITEM: 'CJ Brand Korea KING-RED',DMD: 6300, SUP: 5500, RTF: 87.3, SHORT:  800, ALT_QTY:    0, ALT_ITEM: '-', GBN: 'D' },
  { CUST: '인니 INDOMA', ITEM: 'illuvia MASK',           DMD: 5400, SUP: 5090, RTF: 94.3, SHORT:  310, ALT_QTY:  310, ALT_ITEM: 'illuvia 토너 200ml', GBN: 'D' },
  { CUST: '말레이 SCH',  ITEM: 'NGP Device #01',          DMD: 1900, SUP: 1370, RTF: 72.1, SHORT:  530, ALT_QTY:    0, ALT_ITEM: '-', GBN: 'D' },
  { CUST: 'GS25',        ITEM: 'illuvia 크림 50g',         DMD: 2300, SUP: 2530, RTF:100.0, SHORT:    0, ALT_QTY:    0, ALT_ITEM: '-', GBN: 'A' },
];

function KpiCard({ kpi }) {
  const Icon = kpi.icon;
  return (
    <Paper variant="outlined" sx={{ p: 1.5, flex: 1 }}>
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Avatar sx={{ backgroundColor: `${kpi.color}.light`, color: `${kpi.color}.dark`, width: 40, height: 40 }}>
          <Icon />
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" color="text.secondary">{kpi.label}</Typography>
          <Stack direction="row" alignItems="baseline" spacing={0.5}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: `${kpi.color}.main` }}>{kpi.value}</Typography>
            <Typography variant="caption" sx={{ color: kpi.delta.startsWith('+') ? 'success.main' : kpi.delta.startsWith('-') ? 'error.main' : 'text.secondary', fontWeight: 600 }}>
              {kpi.delta}
            </Typography>
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
}

function TrendChart({ data, color, label, target }) {
  const W = 800, H = 200, P = 30;
  const xStep = (W - P * 2) / (data.length - 1);
  const yMin = Math.min(...data) - 5;
  const yMax = Math.max(...data) + 5;
  const yScale = (v) => H - P - ((v - yMin) / (yMax - yMin)) * (H - P * 2);
  const d = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${P + xStep * i} ${yScale(v)}`).join(' ');
  const targetY = target != null ? yScale(target) : null;
  return (
    <Paper variant="outlined" sx={{ p: 1.5, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 240 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <ShowChartIcon fontSize="small" color="primary" />
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{label}</Typography>
      </Stack>
      <Box sx={{ flexGrow: 1, minHeight: 0 }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%' }}>
          {[Math.floor(yMin/10)*10, Math.floor((yMin+yMax)/20)*10, Math.ceil(yMax/10)*10].map((y) => (
            <g key={y}>
              <line x1={P} y1={yScale(y)} x2={W - P} y2={yScale(y)} stroke="#e5e7eb" strokeWidth="0.5" />
              <text x={P - 5} y={yScale(y)} fill="#9ca3af" fontSize="10" textAnchor="end" dy="3">{y}</text>
            </g>
          ))}
          {targetY != null && <line x1={P} y1={targetY} x2={W - P} y2={targetY} stroke="#ef4444" strokeWidth="1.5" strokeDasharray="5 3" />}
          {data.map((v, i) => (
            <text key={i} x={P + xStep * i} y={H - 8} fill="#6b7280" fontSize="10" textAnchor="middle">{i + 1}월</text>
          ))}
          <path d={d} fill="none" stroke={color} strokeWidth="2.5" />
          {data.map((v, i) => (
            <circle key={i} cx={P + xStep * i} cy={yScale(v)} r="4" fill={color} />
          ))}
        </svg>
      </Box>
    </Paper>
  );
}

export default function CjboDpPlanAccuracyMockup() {
  const [tab, setTab] = useState(0);
  // 0=정확도 · 1=계획대비 실적 · 2=RTF

  return (
    <MockShell patternCode="cjbo_dp_plan_accuracy" patternLabel="CJBO — 정확도/실적/RTF (DpPlanAccuracy/Report/RtfReport)"
      layoutCategory="LAYOUT_SINGLE"
      description="정확도(M_1/2/3 그룹헤더) · 실적(동적 시간 버킷) · RTF(충족률+rtfQryGbn). UI_DP_PLAN_ACCURACY/PLAN_REPORT/RTF_REPORT 3종.">
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="리포트"
            value={tab === 0 ? '수요계획 정확도' : tab === 1 ? '계획대비 실적' : 'RTF 리포트'} size="small" sx={{ width: 170 }} />
          <TextField label="계획구분" size="small" select value="OP" sx={{ width: 130 }}>
            <MenuItem value="OP">OP</MenuItem><MenuItem value="TP">TP</MenuItem>
          </TextField>
          <TextField label="버전" size="small" value="V2026-05" sx={{ width: 130 }} />
          <TextField label="대분류" size="small" select value="ALL" sx={{ width: 130 }}>
            <MenuItem value="ALL">전체</MenuItem>
          </TextField>
          <TextField label="조회월" size="small" value="2026-05" sx={{ width: 140 }} />
          {tab === 2 && (
            <>
              <TextField label="RTF 구분" size="small" select value="ALL" sx={{ width: 150 }}>
                <MenuItem value="ALL">전체</MenuItem>
                <MenuItem value="D">D 차이 발생분</MenuItem>
                <MenuItem value="A">A 대체 있음</MenuItem>
              </TextField>
              <TextField label="단위" size="small" select value="QTY" sx={{ width: 100 }}>
                <MenuItem value="ALL">ALL</MenuItem>
                <MenuItem value="QTY">QTY</MenuItem>
                <MenuItem value="AMT">AMT</MenuItem>
              </TextField>
            </>
          )}
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
        </Stack>
      </Box>

      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" sx={{ minHeight: 38 }}>
          <Tab label="정확도 (DpPlanAccuracy)" sx={{ minHeight: 38 }} />
          <Tab label="계획대비 실적 (DpPlanReport)" sx={{ minHeight: 38 }} />
          <Tab label="RTF (DpRtfReport)" sx={{ minHeight: 38 }} />
        </Tabs>
      </Box>

      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5, flexGrow: 1, overflow: 'auto' }}>
        <Stack direction="row" spacing={1.5}>
          {(tab === 0 ? KPIS_ACC : tab === 1 ? KPIS_PLAN : KPIS_RTF).map((k) => <KpiCard key={k.label} kpi={k} />)}
        </Stack>

        <TrendChart
          data={tab === 0 ? TREND_ACC : tab === 1 ? TREND_PLAN : TREND_RTF}
          color={tab === 0 ? '#1976d2' : tab === 1 ? '#10b981' : '#9c27b0'}
          label={tab === 0 ? '월별 OP 정확도 (%) — 2026 (목표 90%)' : tab === 1 ? '월별 계획 추이 (단위: K) — 2026' : '월별 RTF 충족률 (%) — 2026 (목표 90%)'}
          target={tab === 0 || tab === 2 ? 90 : null}
        />

        {tab === 0 && (
          <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 240 }}>
            <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>정확도 (M_1/M_2/M_3) × ACT/PLAN/ACCURACY — 그룹 헤더</Typography>
            </Box>
            <TableContainer sx={{ flex: 1 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell rowSpan={2} sx={{ backgroundColor: 'grey.100', fontWeight: 700 }}>거래처</TableCell>
                    <TableCell rowSpan={2} sx={{ backgroundColor: 'grey.100', fontWeight: 700 }}>품목</TableCell>
                    <TableCell rowSpan={2} sx={{ backgroundColor: 'grey.100', fontWeight: 700 }}>담당</TableCell>
                    {['M-1 (2026-05)','M-2 (2026-04)','M-3 (2026-03)'].map((m) => (
                      <TableCell key={m} colSpan={3} sx={{ backgroundColor: '#e3f2fd', fontWeight: 700, textAlign: 'center' }}>{m}</TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    {[0,1,2].flatMap(() => ['ACT','PLAN','정확도'].map((c, i) => (
                      <TableCell key={`${c}-${i}-${Math.random()}`} sx={{ backgroundColor: '#e3f2fd', fontWeight: 700, textAlign: 'right', fontSize: 11 }}>{c}</TableCell>
                    )))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ROWS_ACC.map((r, i) => (
                    <TableRow key={i} hover>
                      <TableCell>{r.CUST}</TableCell>
                      <TableCell>{r.ITEM}</TableCell>
                      <TableCell>{r.EMP}</TableCell>
                      {['m1','m2','m3'].map((k) => {
                        const tone = percentStatus(r[k].acc);
                        return [
                          <TableCell key={`${k}-act`} sx={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 12 }}>{r[k].act.toLocaleString()}</TableCell>,
                          <TableCell key={`${k}-plan`} sx={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 12, color: 'text.secondary' }}>{r[k].plan.toLocaleString()}</TableCell>,
                          <TableCell key={`${k}-acc`} sx={cellSx(tone, { align: 'right', mono: true })}>{r[k].acc.toFixed(1)}</TableCell>,
                        ];
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {tab === 1 && (
          <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 240 }}>
            <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>계획 (동적 시간 버킷) — 거래처·품목 × 월별 PLAN</Typography>
            </Box>
            <TableContainer sx={{ flex: 1 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700 }}>거래처</TableCell>
                    <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700 }}>품목</TableCell>
                    {PLAN_MONTHS.map((m) => (
                      <TableCell key={m} sx={{ backgroundColor: '#e3f2fd', fontWeight: 700, textAlign: 'right' }}>{m}</TableCell>
                    ))}
                    <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, textAlign: 'right' }}>합계</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ROWS_PLAN.map((r, i) => {
                    const total = r.m.reduce((a, b) => a + b, 0);
                    return (
                      <TableRow key={i} hover>
                        <TableCell>{r.CUST}</TableCell>
                        <TableCell>{r.ITEM}</TableCell>
                        {r.m.map((v, j) => (
                          <TableCell key={j} sx={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 12 }}>{v.toLocaleString()}</TableCell>
                        ))}
                        <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{total.toLocaleString()}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {tab === 2 && (
          <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 240 }}>
            <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>RTF 충족률 — DMD vs SUP + 대체/Short</Typography>
              <Chip size="small" label="A: 대체 발생" color="warning" variant="outlined" />
              <Chip size="small" label="D: 차이 발생" color="error" variant="outlined" />
            </Box>
            <TableContainer sx={{ flex: 1 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {['거래처','품목','DMD','SUP','RTF (%)','Short','대체 수량','대체 품목','구분'].map((c) => (
                      <TableCell key={c} sx={{ backgroundColor: 'grey.100', fontWeight: 700,
                        textAlign: ['DMD','SUP','RTF (%)','Short','대체 수량','구분'].includes(c) ? 'right' : 'left' }}>{c}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ROWS_RTF.map((r, i) => {
                    const tone = percentStatus(r.RTF, { danger: 80, warning: 95, success: 100 });
                    return (
                      <TableRow key={i} hover>
                        <TableCell>{r.CUST}</TableCell>
                        <TableCell>{r.ITEM}</TableCell>
                        <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.DMD.toLocaleString()}</TableCell>
                        <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.SUP.toLocaleString()}</TableCell>
                        <TableCell sx={cellSx(tone, { align: 'right', mono: true })}>{r.RTF.toFixed(1)}</TableCell>
                        <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', color: r.SHORT > 0 ? 'error.main' : 'text.secondary', fontWeight: r.SHORT > 0 ? 700 : undefined }}>
                          {r.SHORT > 0 ? r.SHORT.toLocaleString() : '-'}
                        </TableCell>
                        <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', color: r.ALT_QTY > 0 ? 'warning.main' : 'text.secondary', fontWeight: r.ALT_QTY > 0 ? 700 : undefined }}>
                          {r.ALT_QTY > 0 ? r.ALT_QTY.toLocaleString() : '-'}
                        </TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{r.ALT_ITEM}</TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Chip size="small" label={r.GBN} color={r.GBN === 'D' ? 'error' : 'success'} sx={{ height: 18, fontWeight: 700 }} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
      </Box>
    </MockShell>
  );
}
