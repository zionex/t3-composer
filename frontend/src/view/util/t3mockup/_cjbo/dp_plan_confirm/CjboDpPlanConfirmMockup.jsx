import React, { useState } from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography, Paper, Tabs, Tab, Chip, LinearProgress, RadioGroup, Radio, FormControlLabel,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import SettingsIcon from '@mui/icons-material/Settings';
import SaveIcon from '@mui/icons-material/Save';
import MockShell from '../../_shared/MockShell';

// CJBO — 계획 점검 + 로그 (EntryNotify + EntryLog)
// 소스 기반 재작성. DpEntryConf / DpEntryTPConf 파일은 CJBO 소스에 존재하지 않음 → 제외.
// path: view/demandplan/entry/entrynotify/EntryNotify.jsx
//       view/demandplan/version/entrylog/EntryLog.jsx
//
// ─── EntryNotify ─────────────────────────────────────────────────────
// Upper Grid: left MUI <Table> (NotifyTable, sorted by ACHIEV_RATE_QTY/_AMT, palette 색상 from DP_ALERT_RANGE)
//             right <Chart type="bar"> (react-chartjs-2) - "ANNUAL" → line, 나머지 → bar
// Lower:      <BaseGrid id="grid1"> with iteration DATE_<bucket> 동적 컬럼 (편집 가능)
// callService 대상 'dp': SRV_GET_SP_UI_DP_00_CONF_Q1 (DP_ALERT_RANGE / DP_PLAN_TYPE), GetEntryNotifyGrid, GetEntryNotifyChart, GetEntryVersions, SRV_GET_DP_BUKT
// zAxios POST engine/dp/GetDemand, engine/dp/SetDemand
//
// ─── EntryLog ───────────────────────────────────────────────────────
// SearchArea: version select (GetAllDPVersion) + dateRange (default [yesterday, today]) + USER_ID text
// BaseGrid: 15 cols — PLAN_TP, VER_ID, USERNAME (USER_ID), CREATE_DTTM (SAVE_DTTM), AUTH_TP (hidden), TRANSACTION_ID, ITEM_CD/NM, ACCOUNT_CD/NM, BASE_DATE, QTY, QTY_1..3, AMT (hidden), AMT_1..3, PRC1/PRC2 (hidden)
// engine/dp/GetEntryLog (URLSearchParams) — read-only

const NOTIFY_PALETTE = [
  { range: '0~50%',   bgColor: '#ffcdd2', textColor: '#b71c1c', label: 'CRITICAL' },
  { range: '50~80%',  bgColor: '#fff9c4', textColor: '#f57f17', label: 'WARNING' },
  { range: '80~120%', bgColor: '#c8e6c9', textColor: '#1b5e20', label: 'NORMAL' },
  { range: '120%+',   bgColor: '#bbdefb', textColor: '#0d47a1', label: 'OVER' },
];

const NOTIFY_ROWS = [
  { CATEGORY: 'L-Methionine 99%',  ACHIEV_RATE_QTY:  42.5, palette: NOTIFY_PALETTE[0] },
  { CATEGORY: 'L-Tryptophan 98%',  ACHIEV_RATE_QTY:  68.0, palette: NOTIFY_PALETTE[1] },
  { CATEGORY: 'L-Threonine 98.5%', ACHIEV_RATE_QTY:  75.5, palette: NOTIFY_PALETTE[1] },
  { CATEGORY: 'L-Valine 96.5%',    ACHIEV_RATE_QTY:  82.0, palette: NOTIFY_PALETTE[2] },
  { CATEGORY: 'L-Lysine 78% (액상)',ACHIEV_RATE_QTY:  95.0, palette: NOTIFY_PALETTE[2] },
  { CATEGORY: 'L-Lysine HCl 98%',  ACHIEV_RATE_QTY: 102.5, palette: NOTIFY_PALETTE[2] },
  { CATEGORY: 'L-Arginine 99%',    ACHIEV_RATE_QTY: 128.0, palette: NOTIFY_PALETTE[3] },
];

const CHART_LABELS = ['2026-01','2026-02','2026-03','2026-04','2026-05'];
const CHART_DATASETS = [
  { name: 'ACT_QTY',       type: 'bar',  color: '#1976d2', data: [1200, 1450, 1380, 1600, 1520] },
  { name: 'PLAN_QTY',      type: 'bar',  color: '#fbbf24', data: [1300, 1400, 1500, 1550, 1600] },
  { name: 'ANNUAL_TARGET', type: 'line', color: '#1768b4', data: [1500, 1500, 1500, 1500, 1500] },
];

// NotifyChart SVG
function NotifyChart() {
  const W = 600, H = 240, P = 35;
  const xStep = (W - P * 2) / CHART_LABELS.length;
  const allMax = Math.max(...CHART_DATASETS.flatMap((d) => d.data));
  const yMax = Math.ceil(allMax / 200) * 200;
  const yScale = (v) => H - P - (v / yMax) * (H - P * 2);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%' }}>
      {[0, yMax / 2, yMax].map((y) => (
        <g key={y}>
          <line x1={P} y1={yScale(y)} x2={W - P} y2={yScale(y)} stroke="#e5e7eb" strokeWidth="0.5" />
          <text x={P - 5} y={yScale(y)} fill="#9ca3af" fontSize="10" textAnchor="end" dy="3">{y}</text>
        </g>
      ))}
      {CHART_LABELS.map((m, i) => (
        <text key={m} x={P + xStep * i + xStep / 2} y={H - 8} fill="#6b7280" fontSize="10" textAnchor="middle">{m.slice(5)}월</text>
      ))}
      {CHART_DATASETS.filter((d) => d.type === 'bar').map((d, di) => (
        d.data.map((v, i) => {
          const offset = di === 0 ? 4 : 22;
          return (
            <rect key={`${d.name}-${i}`}
              x={P + xStep * i + offset} y={yScale(v)} width={16} height={yScale(0) - yScale(v)}
              fill={d.color} />
          );
        })
      ))}
      {CHART_DATASETS.filter((d) => d.type === 'line').map((d) => {
        const pts = d.data.map((v, i) => `${P + xStep * i + xStep / 2} ${yScale(v)}`).join(' L ');
        return (
          <g key={d.name}>
            <path d={`M ${pts}`} fill="none" stroke={d.color} strokeWidth="2" strokeDasharray="4 2" />
          </g>
        );
      })}
    </svg>
  );
}

// EntryNotify lower grid columns + sample
const ENTRY_PERIODS = ['2026-06','2026-07','2026-08','2026-09'];
const ENTRY_ROWS = [
  { CATEGORY: 'PLAN_QTY',  ITEM: 'L-Lysine 78%', ACCOUNT: 'Jakarta Corp.',     vals: [1500, 1620, 1700, 1650] },
  { CATEGORY: 'PRC',       ITEM: 'L-Lysine 78%', ACCOUNT: 'Jakarta Corp.',     vals: [1.25, 1.25, 1.30, 1.30] },
  { CATEGORY: 'AMT',       ITEM: 'L-Lysine 78%', ACCOUNT: 'Jakarta Corp.',     vals: [1875, 2025, 2210, 2145] },
  { CATEGORY: 'PLAN_QTY',  ITEM: 'L-Methionine 99%', ACCOUNT: 'New York Corp.',vals: [2200, 2150, 2180, 2100] },
  { CATEGORY: 'PRC',       ITEM: 'L-Methionine 99%', ACCOUNT: 'New York Corp.',vals: [2.00, 2.00, 2.05, 2.05] },
  { CATEGORY: 'AMT',       ITEM: 'L-Methionine 99%', ACCOUNT: 'New York Corp.',vals: [4400, 4300, 4469, 4305] },
];

// EntryLog rows
const LOG_ROWS = [
  { PLAN_TP: 'DP_PLAN_MONTHLY', VER_ID: 'V2026-06', USERNAME: 'admin',  CREATE_DTTM: '2026-06-04 15:25:18', TRANSACTION_ID: 'TXN-2026-15025', ITEM_CD: 'L-LYS-78L',  ITEM_NM: 'L-Lysine 78%',     ACCOUNT_CD: 'C-0042', ACCOUNT_NM: 'Jakarta Corp.',   BASE_DATE: '2026-07-01', QTY: 1620, QTY_1: 1620, QTY_2: 540,  QTY_3: 540,  AMT_1: 2025, AMT_2: 675, AMT_3: 675 },
  { PLAN_TP: 'DP_PLAN_MONTHLY', VER_ID: 'V2026-06', USERNAME: 'admin',  CREATE_DTTM: '2026-06-04 15:18:42', TRANSACTION_ID: 'TXN-2026-15018', ITEM_CD: 'L-MET-99',   ITEM_NM: 'L-Methionine 99%', ACCOUNT_CD: 'C-0015', ACCOUNT_NM: 'New York Corp.',  BASE_DATE: '2026-07-01', QTY: 2150, QTY_1: 2150, QTY_2: 716,  QTY_3: 716,  AMT_1: 4300, AMT_2:1432, AMT_3:1432 },
  { PLAN_TP: 'DP_PLAN_MONTHLY', VER_ID: 'V2026-06', USERNAME: 'pm_user',CREATE_DTTM: '2026-06-04 14:55:33', TRANSACTION_ID: 'TXN-2026-14955', ITEM_CD: 'L-TRP-98',   ITEM_NM: 'L-Tryptophan 98%', ACCOUNT_CD: 'C-0028', ACCOUNT_NM: 'Sao Paulo Corp.', BASE_DATE: '2026-07-01', QTY:  870, QTY_1:  870, QTY_2: 290,  QTY_3: 290,  AMT_1: 1740, AMT_2: 580, AMT_3: 580 },
  { PLAN_TP: 'DP_PLAN_MONTHLY', VER_ID: 'V2026-06', USERNAME: 'pm_user',CREATE_DTTM: '2026-06-04 14:42:18', TRANSACTION_ID: 'TXN-2026-14942', ITEM_CD: 'L-VAL-96',   ITEM_NM: 'L-Valine 96.5%',  ACCOUNT_CD: 'C-0033', ACCOUNT_NM: 'Mexico City Corp.',BASE_DATE: '2026-07-01', QTY:  340, QTY_1:  340, QTY_2: 113,  QTY_3: 113,  AMT_1:  680, AMT_2: 226, AMT_3: 226 },
  { PLAN_TP: 'DP_PLAN_MONTHLY', VER_ID: 'V2026-06', USERNAME: 'admin',  CREATE_DTTM: '2026-06-04 14:30:42', TRANSACTION_ID: 'TXN-2026-14930', ITEM_CD: 'L-THR-985',  ITEM_NM: 'L-Threonine 98.5%',ACCOUNT_CD: 'C-0019', ACCOUNT_NM: 'Vancouver Corp.', BASE_DATE: '2026-07-01', QTY:  540, QTY_1:  540, QTY_2: 180,  QTY_3: 180,  AMT_1:  864, AMT_2: 288, AMT_3: 288 },
];

export default function CjboDpPlanConfirmMockup() {
  const [tab, setTab] = useState(0);

  return (
    <MockShell patternCode="cjbo_dp_plan_confirm"
      patternLabel="CJBO — 계획 점검 + 입력 로그 (EntryNotify + EntryLog)"
      layoutCategory="LAYOUT_SINGLE"
      description="DpEntryConf/DpEntryTPConf 파일은 CJBO 소스에 없음 → 제외. EntryNotify (Notify Table + Chart + 동적 BaseGrid) · EntryLog (15-col read-only).">

      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" sx={{ minHeight: 38 }}>
          <Tab label="입력 알림" sx={{ minHeight: 38 }} />
          <Tab label="입력 이력" sx={{ minHeight: 38 }} />
        </Tabs>
      </Box>

      {/* ───── EntryNotify ───── */}
      {tab === 0 && (
        <>
          <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
              <TextField label="버전" size="small" select value="V2026-06" sx={{ width: 250 }}>
                <MenuItem value="V2026-06">V2026-06</MenuItem>
              </TextField>
              <RadioGroup row defaultValue="QTY">
                <FormControlLabel value="QTY" control={<Radio size="small" />} label={<Typography variant="caption">수량</Typography>} />
                <FormControlLabel value="AMT" control={<Radio size="small" />} label={<Typography variant="caption">금액</Typography>} />
              </RadioGroup>
              <Box sx={{ flexGrow: 1 }} />
              <Button variant="outlined" size="small" startIcon={<RefreshIcon />}>새로고침</Button>
              <Button variant="outlined" size="small" startIcon={<SettingsIcon />}>개인화</Button>
            </Stack>
          </Box>

          <Box sx={{ p: 1.5, flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5, overflow: 'hidden' }}>
            {/* Upper: NotifyTable + Chart */}
            <Box sx={{ display: 'flex', gap: 1.5, height: 280, minWidth: 0 }}>
              <Paper variant="outlined" sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>NotifyTable (MUI Table, sorted by ACHIEV_RATE_QTY)</Typography>
                </Box>
                <TableContainer sx={{ flex: 1 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, fontSize: 11 }}>CATEGORY (Measure)</TableCell>
                        <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, fontSize: 11 }}>ACHIEV_RATE / Progress</TableCell>
                        <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, fontSize: 11, textAlign: 'center' }}>CRITICALITY (Chip)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {NOTIFY_ROWS.map((r, i) => (
                        <TableRow key={i} hover>
                          <TableCell>{r.CATEGORY}</TableCell>
                          <TableCell sx={{ minWidth: 150 }}>
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <LinearProgress variant="determinate" value={Math.min(r.ACHIEV_RATE_QTY, 100)}
                                sx={{ flex: 1, height: 8, borderRadius: 1,
                                  '& .MuiLinearProgress-bar': { backgroundColor: r.palette.bgColor === '#ffcdd2' ? '#c62828' : r.palette.bgColor === '#fff9c4' ? '#f57f17' : r.palette.bgColor === '#c8e6c9' ? '#2e7d32' : '#1565c0' } }} />
                              <Typography variant="caption" sx={{ fontFamily: 'monospace', minWidth: 40 }}>{r.ACHIEV_RATE_QTY.toFixed(1)}%</Typography>
                            </Stack>
                          </TableCell>
                          <TableCell sx={{ textAlign: 'center' }}>
                            <Chip size="small" label={r.palette.label}
                              sx={{ height: 20, fontSize: 10, fontWeight: 700, backgroundColor: r.palette.bgColor, color: r.palette.textColor }} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>

              <Paper variant="outlined" sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', rowGap: 0.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>차트</Typography>
                  <Box sx={{ flexGrow: 1 }} />
                  {CHART_DATASETS.map((d) => (
                    <Stack key={d.name} direction="row" alignItems="center" spacing={0.3}>
                      <Box sx={{ width: 12, height: d.type === 'line' ? 2 : 8, backgroundColor: d.color, borderRadius: 0.5, flexShrink: 0 }} />
                      <Typography variant="caption" sx={{ fontSize: 10, whiteSpace: 'nowrap' }}>{d.name}</Typography>
                    </Stack>
                  ))}
                  <Button size="small" startIcon={<SaveIcon />} variant="outlined" sx={{ ml: 1, flexShrink: 0 }}>SaveOption</Button>
                </Box>
                <Box sx={{ flex: 1, p: 1, minWidth: 0, minHeight: 0, overflow: 'hidden' }}><NotifyChart /></Box>
              </Paper>
            </Box>

            {/* Lower: BaseGrid */}
            <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <TableContainer sx={{ flex: 1 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, fontSize: 11 }}>CATEGORY (Measure)</TableCell>
                      <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, fontSize: 11 }}>ITEM</TableCell>
                      <TableCell sx={{ backgroundColor: 'grey.100', fontWeight: 700, fontSize: 11 }}>ACCOUNT</TableCell>
                      {ENTRY_PERIODS.map((p) => (
                        <TableCell key={p} sx={{ backgroundColor: '#e3f2fd', fontWeight: 700, textAlign: 'right', fontSize: 11 }}>{p}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ENTRY_ROWS.map((r, i) => (
                      <TableRow key={i} hover>
                        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{r.CATEGORY}</TableCell>
                        <TableCell>{r.ITEM}</TableCell>
                        <TableCell>{r.ACCOUNT}</TableCell>
                        {r.vals.map((v, j) => (
                          <TableCell key={j} sx={{ textAlign: 'right', fontFamily: 'monospace',
                            backgroundColor: r.CATEGORY === 'PLAN_QTY' ? '#fffde7' : undefined,
                            fontWeight: r.CATEGORY === 'AMT' ? 700 : undefined }}>
                            {r.CATEGORY === 'PRC' ? v.toFixed(2) : v.toLocaleString()}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>
        </>
      )}

      {/* ───── EntryLog ───── */}
      {tab === 1 && (
        <>
          <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <TextField label="VERSION_ID (GetAllDPVersion)" size="small" select value="V2026-06" sx={{ width: 200 }}>
                <MenuItem value="V2026-06">V2026-06</MenuItem>
              </TextField>
              <TextField label="APPY_SCPE (dateRange)" size="small" value="2026-06-03 ~ 2026-06-04" sx={{ width: 240 }} />
              <TextField label="USER_ID" size="small" placeholder="text" sx={{ width: 150 }} />
              <Box sx={{ flexGrow: 1 }} />
              <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
            </Stack>
          </Box>

          <Box sx={{ p: 1.5, flex: 1, overflow: 'hidden' }}>
            <Paper variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <TableContainer sx={{ flex: 1 }}>
                <Table size="small" stickyHeader sx={{ '& th, & td': { whiteSpace: 'nowrap', fontSize: 11, py: 0.5 } }}>
                  <TableHead>
                    <TableRow>
                      {['PLAN_TP','VER_ID','USERNAME (USER_ID)','CREATE_DTTM (SAVE_DTTM)','TRANSACTION_ID','ITEM_CD','ITEM_NM','ACCOUNT_CD','ACCOUNT_NM','BASE_DATE','QTY','QTY_1','QTY_2','QTY_3','AMT_1','AMT_2','AMT_3'].map((c) => (
                        <TableCell key={c} sx={{ backgroundColor: 'grey.100', fontWeight: 700,
                          textAlign: ['QTY','QTY_1','QTY_2','QTY_3','AMT_1','AMT_2','AMT_3'].includes(c) ? 'right' : 'left' }}>{c}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {LOG_ROWS.map((r, i) => (
                      <TableRow key={i} hover>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: 10 }}>{r.PLAN_TP}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{r.VER_ID}</TableCell>
                        <TableCell>{r.USERNAME}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: 10 }}>{r.CREATE_DTTM}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: 10 }}>{r.TRANSACTION_ID}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{r.ITEM_CD}</TableCell>
                        <TableCell>{r.ITEM_NM}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{r.ACCOUNT_CD}</TableCell>
                        <TableCell>{r.ACCOUNT_NM}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: 10 }}>{r.BASE_DATE}</TableCell>
                        <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{r.QTY.toLocaleString()}</TableCell>
                        <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.QTY_1.toLocaleString()}</TableCell>
                        <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.QTY_2.toLocaleString()}</TableCell>
                        <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.QTY_3.toLocaleString()}</TableCell>
                        <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', color: 'text.secondary' }}>{r.AMT_1.toLocaleString()}</TableCell>
                        <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', color: 'text.secondary' }}>{r.AMT_2.toLocaleString()}</TableCell>
                        <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', color: 'text.secondary' }}>{r.AMT_3.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>
        </>
      )}
    </MockShell>
  );
}
