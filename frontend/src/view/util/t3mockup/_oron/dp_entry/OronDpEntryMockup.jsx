import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography, Paper, Chip, Tabs, Tab,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Card, CardHeader, CardContent, IconButton,
} from '@mui/material';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import StepButton from '@mui/material/StepButton';
import StepContent from '@mui/material/StepContent';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import AddIcon from '@mui/icons-material/Add';
import PlayCircleOutline from '@mui/icons-material/PlayCircleOutline';
import StopCircle from '@mui/icons-material/StopCircle';
import LinkIcon from '@mui/icons-material/Link';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import MockShell from '../../_shared/MockShell';

// ORON — DP 판매계획 입력 / 관리 / 입력현황
// 컬럼·필드·레이아웃 = wingui-core 의 Base*.jsx 1:1 (BaseEntry / BaseControlBoard / BaseProcessStatus)
// 셀 데이터 = ORON 도메인 예시값 (mockup 시각화용)

// ======================================================================
// Tab 1 — Entry (BaseEntry.jsx)
//   SearchArea: USER_ID, AUTH_TP_ID(bg #f7ffff), VERSION_ID, ITEM, ACCOUNT, BUCKET
//               + PLAN_TP / CURCY_CD (display:none)
//   Grid: ...dimensionItems(60 풀, personalize 로 visible) + CATEGORY + DATE(iteration prefix=DATE_)
//   useSummaryTab=true → 2탭 (RST_CPT_01 UI_DP_95 / RST_CPT_02 SUMMARY)
// ======================================================================
const ENTRY_DATE_COLS = ['2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11', '2026-12'];

// 60개 DIMENSION 풀 중 사용자 personalize 로 4개 visible (예시): BRAND / CHANNEL / ITEM_LV3 / ITEM_NM
const ENTRY_DIM_HEADERS = [
  { name: 'DIMENSION_01', shown: 'BRAND',    width: 110 },
  { name: 'DIMENSION_02', shown: 'CHANNEL',  width: 110 },
  { name: 'DIMENSION_03', shown: 'ITEM_LV3', width: 90 },
  { name: 'DIMENSION_04', shown: 'ITEM_NM',  width: 200 },
];

const ENTRY_ROWS = [
  // ORON 비건마스크 5매
  { dims: ['ORON', '온라인', 'MASK', '오론 비건마스크 5매'], cat: 'DP_QTY', vals: [12000, 13500, 14000, 13500, 13000, 13500, 14500] },
  { dims: ['ORON', '온라인', 'MASK', '오론 비건마스크 5매'], cat: 'ACT_QTY', vals: [11500, 12800, 13200, null, null, null, null], locked: true },
  { dims: ['ORON', '온라인', 'MASK', '오론 비건마스크 5매'], cat: 'DP_AMT', vals: [60000, 67500, 70000, 67500, 65000, 67500, 72500] },
  // ORON 세럼 30ml
  { dims: ['ORON', '오프라인', 'SERUM', '오론 세럼 30ml'], cat: 'DP_QTY', vals: [4500, 5000, 5500, 5800, 6000, 6500, 7000] },
  { dims: ['ORON', '오프라인', 'SERUM', '오론 세럼 30ml'], cat: 'ACT_QTY', vals: [4400, 4800, null, null, null, null, null], locked: true },
  { dims: ['ORON', '오프라인', 'SERUM', '오론 세럼 30ml'], cat: 'DP_AMT', vals: [36000, 40000, 44000, 46400, 48000, 52000, 56000] },
  // OEM 선크림
  { dims: ['OEM-CLIENT-A', 'OEM', 'SUN', 'OEM 선크림 SPF50+'], cat: 'DP_QTY', vals: [8500, 9000, 9500, 9500, 9000, 8500, 9000] },
  { dims: ['OEM-CLIENT-A', 'OEM', 'SUN', 'OEM 선크림 SPF50+'], cat: 'ACT_QTY', vals: [8200, 8800, null, null, null, null, null], locked: true },
];

const fmtN = (n) => (n == null ? '-' : n.toLocaleString());

function EntryTab() {
  const [gridTab, setGridTab] = React.useState('RST_CPT_01');

  return (
    <>
      {/* SearchArea — BaseEntry line 3205~3217 */}
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="USER_ID" size="small" value="kim.youngsu" sx={{ width: 160 }}
            InputProps={{ startAdornment: <PersonIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} /> }} />
          <TextField label="AUTH_TP_ID" size="small" select value="SALES" sx={{ width: 140, '& .MuiOutlinedInput-root': { backgroundColor: '#f7ffff' } }}>
            <MenuItem value="SALES">영업</MenuItem>
            <MenuItem value="PM">PM</MenuItem>
            <MenuItem value="SOP">S&OP</MenuItem>
          </TextField>
          <TextField label="VERSION_ID" size="small" select value="V2026-06_SIM" sx={{ width: 170 }}>
            <MenuItem value="V2026-06_SIM">V2026-06_SIM</MenuItem>
            <MenuItem value="V2026-05">V2026-05</MenuItem>
          </TextField>
          <TextField label="ITEM" size="small" value="MASK / 비건마스크 5매" sx={{ width: 220 }}
            InputProps={{ endAdornment: <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} /> }} />
          <TextField label="ACCOUNT" size="small" value="온라인 채널" sx={{ width: 180 }}
            InputProps={{ endAdornment: <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} /> }} />
          <TextField label="BUCKET" size="small" select value="MONTH" sx={{ width: 100 }}>
            <MenuItem value="MONTH">MONTH</MenuItem>
            <MenuItem value="WEEK">WEEK</MenuItem>
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          <Typography sx={{ fontSize: 10, color: 'text.disabled', fontStyle: 'italic' }}>
            (PLAN_TP, CURCY_CD = hidden)
          </Typography>
        </Stack>
      </Box>

      {/* useSummaryTab Tabs */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 1.5 }}>
          <Tabs value={gridTab} onChange={(_e, v) => setGridTab(v)} indicatorColor="primary">
            <Tab value="RST_CPT_01" label="UI_DP_95" sx={{ minHeight: 36, py: 0.5 }} />
            <Tab value="RST_CPT_02" label="SUMMARY"  sx={{ minHeight: 36, py: 0.5 }} />
          </Tabs>
        </Box>

        <Box sx={{ p: 1.5, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <Paper variant="outlined" sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <TableContainer sx={{ flex: 1 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {ENTRY_DIM_HEADERS.map((d) => (
                      <TableCell key={d.name} sx={{ bgcolor: 'grey.100', fontWeight: 700, width: d.width, textAlign: d.shown === 'ITEM_NM' ? 'left' : 'center', fontSize: 12 }}>
                        {d.shown}
                        <Typography component="span" sx={{ ml: 0.5, fontSize: 9, color: 'text.disabled', fontFamily: 'monospace' }}>({d.name})</Typography>
                      </TableCell>
                    ))}
                    <TableCell sx={{ bgcolor: '#fffbe6', fontWeight: 700, width: 110, textAlign: 'center', fontSize: 12 }}>CATEGORY</TableCell>
                    {ENTRY_DATE_COLS.map((d) => (
                      <TableCell key={d} sx={{ bgcolor: 'grey.100', fontWeight: 700, width: 90, textAlign: 'right', fontSize: 12, fontFamily: 'monospace' }}>{d.slice(2)}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ENTRY_ROWS.map((r, i) => (
                    <TableRow key={i} hover sx={{ bgcolor: r.locked ? '#fafafa' : 'transparent' }}>
                      {r.dims.map((v, j) => (
                        <TableCell key={j} sx={{ fontSize: 12, textAlign: j === 3 ? 'left' : 'center' }}>{v}</TableCell>
                      ))}
                      <TableCell sx={{
                        textAlign: 'center', fontWeight: 600, fontFamily: 'monospace', fontSize: 12,
                        color: r.cat === 'DP_QTY' ? '#1565c0' : r.cat === 'ACT_QTY' ? '#6b7280' : '#10b981',
                      }}>{r.cat}</TableCell>
                      {r.vals.map((v, j) => (
                        <TableCell key={j} sx={{
                          textAlign: 'right', fontFamily: 'monospace', fontSize: 12,
                          color: v == null ? '#d1d5db' : r.locked ? '#6b7280' : '#374151',
                          fontWeight: r.cat === 'DP_QTY' ? 600 : 400,
                          bgcolor: r.locked ? '#f3f4f6' : 'transparent',
                        }}>{fmtN(v)}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ borderTop: '1px solid', borderColor: 'divider', px: 1.5, py: 0.5, bgcolor: 'grey.50' }}>
              <Typography sx={{ fontSize: 11, fontFamily: 'monospace', color: 'text.secondary' }}>
                GridCnt grid="grid1" — {ENTRY_ROWS.length} CASES MSG_0010
              </Typography>
            </Box>
          </Paper>
          <Typography sx={{ mt: 0.7, fontSize: 10, color: 'text.disabled' }}>
            BaseEntry grid1Items = ...dimensionItems(60 풀) + BUCK_TP/DTF_DATE/ITEM/ACCOUNT/SALES(hidden) + CATEGORY + DATE(iteration prefix=DATE_) + COMMENT. visible DIMENSION 은 사용자 personalize — 예시는 4개.
          </Typography>
        </Box>
      </Box>
    </>
  );
}

// ======================================================================
// Tab 2 — ControlBoard (BaseControlBoard.jsx)
//   좌(xs=4) Card: PLAN_TP 칩 + [+ NEW_VERSION] + Vertical Stepper(versionHistory)
//   우(xs=8) Card: Table — STEP_NM / LV_NM / STATUS / DESCRIP
// ======================================================================
const CB_VERSIONS = [
  { label: 'V2026-06_SIM', descrip: '2026-06 월 시뮬레이션', created: '2026-06-08', status: 'OPEN', active: true },
  { label: 'V2026-05',     descrip: '2026-05 메인 확정',     created: '2026-05-01', status: 'OPEN' },
  { label: 'V2026-04',     descrip: '2026-04 마감',          created: '2026-04-01', status: 'CLOSE' },
];

const CB_APPROVAL = [
  { step: 'SALES_INPUT', lv: '영업팀', status: { done: 5, total: 5 }, descrip: '영업 담당자 입력' },
  { step: 'PM_REVIEW',   lv: 'PM',     status: { done: 3, total: 3 }, descrip: 'PM 검토' },
  { step: 'SOP_FINAL',   lv: 'S&OP',   status: { done: 1, total: 3 }, descrip: 'S&OP 확정' },
  { step: 'APPROVAL',    lv: '임원',   status: { done: 0, total: 1 }, descrip: '최종 승인' },
];

function StatusIcon({ done, total }) {
  if (total === 0) return <RadioButtonUncheckedIcon sx={{ fontSize: 16, color: '#d1d5db' }} />;
  if (done === total) return <CheckCircleIcon sx={{ fontSize: 16, color: '#10b981' }} />;
  if (done === 0) return <RadioButtonUncheckedIcon sx={{ fontSize: 16, color: '#d1d5db' }} />;
  return <HourglassEmptyIcon sx={{ fontSize: 16, color: '#f59e0b' }} />;
}

function ControlBoardTab() {
  return (
    <Box sx={{ p: 1.5, flex: 1, display: 'flex', flexDirection: 'row', gap: 1.5, minHeight: 0, overflow: 'hidden' }}>
      {/* 좌측 — Version History */}
      <Card variant="outlined" sx={{ width: '36%', display: 'flex', flexDirection: 'column' }}>
        <CardHeader
          sx={{ pb: 0.5 }}
          avatar={<Chip label="DP_PLAN_MONTHLY" size="small" variant="outlined" />}
          action={<Button size="small" variant="outlined" startIcon={<AddIcon />}>NEW_VERSION</Button>}
        />
        <CardContent sx={{ flex: 1, overflow: 'auto', pt: 1 }}>
          <Stepper nonLinear activeStep={0} orientation="vertical">
            {CB_VERSIONS.map((v, i) => (
              <Step key={v.label} active={v.active}>
                <StepButton icon={v.status === 'CLOSE' ? <StopCircle color="action" /> : <PlayCircleOutline sx={{ color: v.active ? '#1565c0' : '#9ca3af' }} />}>
                  <Typography variant="body1" sx={{ fontSize: 12, fontWeight: v.active ? 700 : 400 }}>{v.label}</Typography>
                </StepButton>
                <StepContent>
                  <Typography variant="caption" sx={{ display: 'block', fontSize: 10, color: 'text.secondary' }}>{v.descrip}</Typography>
                  <Typography variant="caption" sx={{ display: 'block', fontSize: 10, color: 'text.disabled' }}>CREATED : {v.created}</Typography>
                  {v.status === 'CLOSE' && <Chip label="CLOSE" size="small" sx={{ mt: 0.5, height: 16, fontSize: 9 }} />}
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      {/* 우측 — Approval Steps */}
      <Card variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ flex: 1, overflow: 'auto', p: 0 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12 }}>#</TableCell>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12 }}>STEP_NM</TableCell>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12 }}>LV_NM</TableCell>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12 }}>
                  STATUS
                  <IconButton size="small" sx={{ ml: 0.5, p: 0.25 }} title="Go to Process Status">
                    <LinkIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </TableCell>
                <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12 }}>DESCRIP</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {CB_APPROVAL.map((row, i) => (
                <TableRow key={row.step} hover selected={i === 2}>
                  <TableCell sx={{ fontSize: 12 }}>#{i + 1}</TableCell>
                  <TableCell sx={{ fontSize: 12, fontFamily: 'monospace' }}>{row.step}</TableCell>
                  <TableCell sx={{ fontSize: 12 }}>{row.lv}</TableCell>
                  <TableCell sx={{ fontSize: 12 }}>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <StatusIcon done={row.status.done} total={row.status.total} />
                      <Typography sx={{ fontSize: 11, fontFamily: 'monospace' }}>{row.status.done}/{row.status.total}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ fontSize: 12, color: 'text.secondary' }}>{row.descrip}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
}

// ======================================================================
// Tab 3 — ProcessStatus (BaseProcessStatus.jsx)
//   SearchArea: UserInputField, VERSION_ID, AUTH_TP_NM (+ PLAN_TP hidden)
//   ResultArea sizes=[10,90] vertical — 상단 가로 Stepper + 하단 TreeGrid id="processGrid"
//   grid1Items = SALES_LV_CD / SALES_LV_NM / LV_CD / LV_NM / USERNAME / STATUS / STATUS_DATE / AUTO_APPV_YN
// ======================================================================
const PS_STEPS = [
  { label: '영업팀', progress: '5/5' },
  { label: 'PM',     progress: '3/3' },
  { label: 'S&OP',   progress: '1/3' },
  { label: '임원',   progress: '0/1' },
];

const PS_GRID_ITEMS = [
  { name: 'SALES_LV_CD',  header: 'SALES_LV_CD', width: 130 },
  { name: 'SALES_LV_NM',  header: 'SALES_LV_NM', width: 130 },
  { name: 'LV_CD',        header: 'LV_CD',       width: 110 },
  { name: 'LV_NM',        header: 'LV_NM',       width: 130 },
  { name: 'USERNAME',     header: 'USER_NAME',   width: 110 },
  { name: 'STATUS',       header: 'STATUS',      width: 110 },
  { name: 'STATUS_DATE',  header: 'STATUS_DATE', width: 150 },
  { name: 'AUTO_APPV_YN', header: 'AUTO_APPV_YN', width: 110 },
];

const PS_ROWS = [
  { SALES_LV_CD: 'S01', SALES_LV_NM: '영업1팀', LV_CD: 'PT01', LV_NM: '마스크파트',   USERNAME: 'kim.youngsu',  STATUS: 'COMPLETE',    STATUS_DATE: '2026-06-05 14:22', AUTO_APPV_YN: true  },
  { SALES_LV_CD: 'S01', SALES_LV_NM: '영업1팀', LV_CD: 'PT02', LV_NM: '세럼파트',     USERNAME: 'lee.jihoon',   STATUS: 'COMPLETE',    STATUS_DATE: '2026-06-05 15:48', AUTO_APPV_YN: true  },
  { SALES_LV_CD: 'S02', SALES_LV_NM: 'OEM팀',   LV_CD: 'PT03', LV_NM: '선케어파트',   USERNAME: 'park.sumin',   STATUS: 'IN_PROGRESS', STATUS_DATE: '2026-06-06 09:11', AUTO_APPV_YN: false },
  { SALES_LV_CD: 'S03', SALES_LV_NM: 'PM팀',    LV_CD: 'PT04', LV_NM: 'PM (전사)',    USERNAME: 'choi.minji',   STATUS: 'WAITING',     STATUS_DATE: '',                  AUTO_APPV_YN: false },
];

const PS_STATUS_COLOR = {
  COMPLETE:    '#10b981',
  IN_PROGRESS: '#f59e0b',
  WAITING:     '#9ca3af',
};

function ProcessStatusTab() {
  return (
    <>
      {/* SearchArea — BaseProcessStatus line 287~295 */}
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="USER" size="small" value="kim.youngsu (김영수)" sx={{ width: 230 }}
            InputProps={{ endAdornment: <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} /> }} />
          <TextField label="VERSION_ID" size="small" select value="V2026-06_SIM" sx={{ width: 170 }}>
            <MenuItem value="V2026-06_SIM">V2026-06_SIM</MenuItem>
          </TextField>
          <TextField label="AUTH_TP_NM" size="small" select value="SALES" sx={{ width: 150 }}>
            <MenuItem value="SALES">영업</MenuItem>
          </TextField>
          <Typography sx={{ fontSize: 10, color: 'text.disabled', fontStyle: 'italic' }}>
            (PLAN_TP = hidden)
          </Typography>
        </Stack>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* 상단 Stepper (가로, alternativeLabel) — activeStep = 2 (S&OP 진행 중) */}
        <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Stepper activeStep={2} alternativeLabel>
            {PS_STEPS.map((s) => (
              <Step key={s.label}>
                <StepLabel sx={{ '& .MuiStepLabel-label': { fontSize: 11 } }}>
                  {s.label}({s.progress})
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {/* 하단 TreeGrid id="processGrid" */}
        <Box sx={{ p: 1.5, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <Paper variant="outlined" sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <TableContainer sx={{ flex: 1 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {PS_GRID_ITEMS.map((c) => (
                      <TableCell key={c.name} sx={{ bgcolor: 'grey.100', fontWeight: 700, width: c.width, textAlign: 'center', fontSize: 12 }}>{c.header}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {PS_ROWS.map((r, i) => (
                    <TableRow key={i} hover>
                      <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', textAlign: 'center' }}>{r.SALES_LV_CD}</TableCell>
                      <TableCell sx={{ fontSize: 12, textAlign: 'center' }}>{r.SALES_LV_NM}</TableCell>
                      <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', textAlign: 'center' }}>{r.LV_CD}</TableCell>
                      <TableCell sx={{ fontSize: 12, textAlign: 'center' }}>{r.LV_NM}</TableCell>
                      <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', textAlign: 'center' }}>{r.USERNAME}</TableCell>
                      <TableCell sx={{ fontSize: 12, textAlign: 'center', fontWeight: 600, color: PS_STATUS_COLOR[r.STATUS] }}>{r.STATUS}</TableCell>
                      <TableCell sx={{ fontSize: 12, fontFamily: 'monospace', textAlign: 'center', color: r.STATUS_DATE ? 'text.primary' : 'text.disabled' }}>
                        {r.STATUS_DATE || '-'}
                      </TableCell>
                      <TableCell sx={{ fontSize: 12, textAlign: 'center' }}>
                        {r.AUTO_APPV_YN ? <CheckCircleIcon sx={{ fontSize: 14, color: '#10b981' }} /> : <RadioButtonUncheckedIcon sx={{ fontSize: 14, color: '#d1d5db' }} />}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ borderTop: '1px solid', borderColor: 'divider', px: 1.5, py: 0.5, bgcolor: 'grey.50' }}>
              <Typography sx={{ fontSize: 11, fontFamily: 'monospace', color: 'text.secondary' }}>
                GridCnt grid="processGrid" — {PS_ROWS.length} CASES MSG_0010
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Box>
    </>
  );
}

// ======================================================================
export default function OronDpEntryMockup() {
  const [tab, setTab] = React.useState(0);
  const TABS_META = [
    { label: '판매계획 입력',     menu: 'UI_DP_95' },
    { label: '판매계획 관리',     menu: 'UI_DP_93' },
    { label: '판매계획 입력현황', menu: 'UI_DP_94' },
  ];

  return (
    <MockShell
      patternCode="oron_dp_entry"
      patternLabel="ORON — DP 판매계획 입력 + 관리 + 입력현황"
      layoutCategory="LAYOUT_SINGLE"
      description="3개 메뉴 (UI_DP_95 / UI_DP_93 / UI_DP_94) 가 모두 wingui-core 의 Base* (BaseEntry / BaseControlBoard / BaseProcessStatus) thin wrapper. ORON 의 Entry.jsx 등은 planTypeCode='DP_PLAN_MONTHLY' prop 만 전달. 컬럼·필드·레이아웃은 Base*.jsx 1:1, 셀 데이터는 ORON 도메인 예시 (마스크/세럼/OEM 선크림 · 영업1팀·PM·S&OP)."
    >
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 1.5 }}>
        <Tabs value={tab} onChange={(_e, v) => setTab(v)}>
          {TABS_META.map((t) => (
            <Tab key={t.menu} label={
              <Stack direction="row" spacing={1} alignItems="center">
                <span>{t.label}</span>
                <Chip label={t.menu} size="small" variant="outlined" sx={{ height: 18, fontSize: 10, fontFamily: 'monospace' }} />
              </Stack>
            } />
          ))}
        </Tabs>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {tab === 0 && <EntryTab />}
        {tab === 1 && <ControlBoardTab />}
        {tab === 2 && <ProcessStatusTab />}
      </Box>
    </MockShell>
  );
}
