import React, { useState } from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, IconButton, Typography, Paper, Chip, Tabs, Tab,
  Card, CardHeader, CardContent, Stepper, Step, StepButton, StepContent, StepLabel,
  Avatar, Switch, FormControlLabel, Drawer, Checkbox,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteForeverIcon from '@mui/icons-material/DeleteForeverOutlined';
import CopyAllIcon from '@mui/icons-material/CopyAllOutlined';
import PlayCircleIcon from '@mui/icons-material/PlayCircleOutline';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import SaveIcon from '@mui/icons-material/Save';
import SendIcon from '@mui/icons-material/Send';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import PersonIcon from '@mui/icons-material/Person';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import EventNoteIcon from '@mui/icons-material/EventNote';
import WbSunnyOutlinedIcon from '@mui/icons-material/WbSunnyOutlined';
import MockShell from '../../_shared/MockShell';

// CJBO — 계획 워크플로 공용 뷰 (BaseControlBoard + BaseProcessStatus + BaseEntry)
// 소스 기반. planTypeCode 별로 OP/TP/BP 변형됨.
//
// path:
//   ControlBoard:  view/demandplan/version/controlboard/BaseControlBoard.jsx (~1700줄)
//   ProcessStatus: view/demandplan/version/processstatus/BaseProcessStatus.jsx
//   Entry:         view/demandplan/entry/entry/BaseEntry.jsx
//
// 모든 OP/TP/BP ControlBoard·ProcessStatus·Entry는 동일 Base 컴포넌트 사용 (thin wrapper, planTypeCode 만 다름).
//
// BaseControlBoard 구조:
//   ContentInner > WorkArea > Grid container (no SearchArea — setViewInfo NO_SEARCHAREA:true)
//     Top row: stepAndVersionHistoryArea
//       Left  Card xs=4: 수직 Stepper (orientation='vertical') — versionHistory + Add NEW_VERSION 버튼 → SwipeableDrawer
//       Right Card xs=8: approvalSteps Table (#, WORK_CD/WORK_NM, LV_NM, STATUS chip, DESCRIP)
//     Bottom row (height 395px): versionInfoArea
//       Card xs=4: VER_INFO (Table of FROM_DATE/TO_DATE/BUCKET/PARTIAL_BUCKET/DTF/EXCHANGE_RATE_TP/...)
//       Card xs=4: CLOSE_SETTING (closeCutoffSettings + DP_BTN_DMND_TRANSMISSION + VERSION_CLOSE)
//       Card xs=4: STEP_DETAIL (Tabs INIT_SETTING + APPV_SETTING)
//
// BaseProcessStatus 구조:
//   ContentInner > SearchArea+SearchRow + WorkArea > ResultArea sizes={[10,90]} direction='vertical'
//     Top  10%: 가로 Stepper (alternativeLabel) — steps from GetApprovalSteps (WORK_TP_ID==='DP')
//     Body 90%: TreeGrid id='processGrid'
//
// BaseEntry 구조:
//   ContentInner > SearchArea (2 rows toggle) + WorkArea > ResultArea sizes={hasChart?[30,70]:[100]} direction='vertical'
//     [Chart 30%] (hasChart=true 만)
//     [ButtonArea + BaseGrid id='grid1' 70%]
//       Grid: 40 DIMENSION_NN hidden + BUCK_TP/DTF_DATE/ITEM/ACCOUNT/SALES hidden + CATEGORY (Measure) + DATE (iteration prefix='DATE_') + COMMENT (iteration parallel)

// ────────────── ControlBoard 더미 데이터 ──────────────
const VERSION_HISTORY = [
  { idx: 0, LABEL: 'V2026-06 (MAIN)',   DESCRIP: '월간 OP 계획 V6 — 본 버전',     CREATED: '2026-06-01 10:00', isMain: true,  isClosed: false, isCopied: false },
  { idx: 1, LABEL: 'V2026-06-SIM-01',   DESCRIP: '시뮬: AN 수요 +10% 가정',       CREATED: '2026-06-02 09:30', isMain: false, isClosed: false, isCopied: true  },
  { idx: 2, LABEL: 'V2026-06-SIM-02',   DESCRIP: '시뮬: 메티오닌 단가 -5%',       CREATED: '2026-06-03 14:15', isMain: false, isClosed: false, isCopied: true  },
  { idx: 3, LABEL: 'V2026-05 (CLOSED)', DESCRIP: '월간 OP 계획 V5 — 종료',         CREATED: '2026-05-01 10:00', isMain: false, isClosed: true,  isCopied: false },
];

const APPROVAL_STEPS = [
  { idx: 0, WORK_CD: 'S1',  WORK_NM: '담당자 입력 마감',     LV_NM: 'L1', STATUS: 'APPROVAL', CNT: '5/5', DESCRIP: '담당자 5명 모두 입력 완료' },
  { idx: 1, WORK_CD: 'S2',  WORK_NM: '팀장 1차 검토',         LV_NM: 'L2', STATUS: 'APPROVAL', CNT: '3/3', DESCRIP: '팀장 3명 승인 완료' },
  { idx: 2, WORK_CD: 'S3',  WORK_NM: '본부장 최종 승인',     LV_NM: 'L3', STATUS: 'READY',    CNT: '0/2', DESCRIP: '대기 중 (2명)' },
  { idx: 3, WORK_CD: 'S4',  WORK_NM: '버전 종료',             LV_NM: '-',  STATUS: 'READY',    CNT: '-',   DESCRIP: '미실행' },
];

const VERSION_INFO = [
  { key: 'FROM_DATE', val: '2026-06-01' },
  { key: 'TO_DATE',   val: '2026-12-31' },
  { key: 'BUCKET',    val: 'MONTH' },
  { key: 'PARTIAL_BUCKET', val: 'WEEK' },
  { key: 'PARTIAL_DATE',   val: '2026-06-30' },
  { key: 'DTF',       val: '2026-06-30' },
  { key: 'DTF_DATE',  val: '2026-06-30' },
  { key: 'REF_VERSION_ID',  val: 'V2026-05' },
  { key: 'REF_VERSION_ID3', val: 'V2026-04' },
  { key: 'EXCHANGE_RATE_TP',val: 'Monthly' },
  { key: 'DESCRIP',  val: '월간 OP 계획 V6' },
  { key: 'STD_WEEK', val: '2026-W23' },
];

const TP_EXTRA = [
  { key: 'DP_YEARPLAN_YN', val: true,  type: 'check' },
  { key: 'RATIO_COPY_YN',  val: true,  type: 'check' },
  { key: 'SIMUL_YN',       val: false, type: 'check' },
];

// ────────────── ProcessStatus TreeGrid ──────────────
const PROCESS_STATUS_STEPS = ['L1 (READY)', 'L2 (APPROVAL)', 'L3 (APPROVAL)', 'L4 (READY)'];
const PROCESS_STATUS_ROWS = [
  { depth: 0, SALES_LV_CD: 'AN',    SALES_LV_NM: 'Animal Nutrition',  LV_CD: 'L1', LV_NM: '담당자', USERNAME: '김민수', STATUS: 'APPROVAL', STATUS_DATE: '2026-06-03 10:20', AUTO_APPV_YN: false },
  { depth: 1, SALES_LV_CD: 'AN-KR', SALES_LV_NM: 'AN 한국',             LV_CD: 'L2', LV_NM: '팀장',   USERNAME: '이정훈', STATUS: 'APPROVAL', STATUS_DATE: '2026-06-03 14:15', AUTO_APPV_YN: false },
  { depth: 2, SALES_LV_CD: 'AN-KR-D',SALES_LV_NM:'AN 한국 내수',         LV_CD: 'L3', LV_NM: '본부장', USERNAME: '박서연', STATUS: 'READY',    STATUS_DATE: '-',                  AUTO_APPV_YN: true  },
  { depth: 0, SALES_LV_CD: 'TN',    SALES_LV_NM: 'Total Nutrition',    LV_CD: 'L1', LV_NM: '담당자', USERNAME: '정재현', STATUS: 'APPROVAL', STATUS_DATE: '2026-06-03 11:30', AUTO_APPV_YN: false },
  { depth: 1, SALES_LV_CD: 'TN-1',  SALES_LV_NM: 'TN 영업1',             LV_CD: 'L2', LV_NM: '팀장',   USERNAME: '송하늘', STATUS: 'READY',    STATUS_DATE: '-',                  AUTO_APPV_YN: false },
  { depth: 0, SALES_LV_CD: 'BMS',   SALES_LV_NM: 'Bio Material',        LV_CD: 'L1', LV_NM: '담당자', USERNAME: '박글로벌',STATUS: 'APPROVAL', STATUS_DATE: '2026-06-04 09:15', AUTO_APPV_YN: false },
];

// ────────────── Entry pivot grid ──────────────
const ENTRY_DIMS = ['BIG_AREA','SALES_AREA','TRADE_TYPE','LOCATION','CUST','SALES_GRP','ITEM_GRP','ITEM_CD']; // 40 DIMENSION_NN 중 visible 일부
const ENTRY_PERIODS = ['DATE_2026-06','DATE_2026-07','DATE_2026-08','DATE_2026-09','DATE_2026-10','DATE_2026-11'];

const ENTRY_MEASURES = [
  { CATEGORY: 'BF_QTY',     editable: false, vals: [1480, 1620, 1700, 1650, 1620, 1550] },
  { CATEGORY: 'BF_REASON',  editable: false, vals: ['-','-','-','-','-','-'] },
  { CATEGORY: 'PLAN_QTY',   editable: true,  vals: [1500, 1620, 1700, 1620, 1580, 1550] },
  { CATEGORY: 'PLAN_REASON',editable: true,  vals: ['Promotion','-','New Order','-','-','-'] },
  { CATEGORY: 'PRC',        editable: true,  vals: [1.25, 1.25, 1.30, 1.30, 1.30, 1.30] },
  { CATEGORY: 'AMT',        editable: false, vals: [1875, 2025, 2210, 2106, 2054, 2015] },
];

// Mini Entry Chart (TP/BP only)
function EntryChart() {
  const W = 800, H = 180, P = 30;
  const xStep = (W - P * 2) / ENTRY_PERIODS.length;
  const yMax = 2500;
  const yScale = (v) => H - P - (v / yMax) * (H - P * 2);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%' }}>
      {[0, 1000, 2000].map((y) => (
        <line key={y} x1={P} y1={yScale(y)} x2={W - P} y2={yScale(y)} stroke="#e5e7eb" strokeWidth="0.5" />
      ))}
      {ENTRY_PERIODS.map((p, i) => (
        <text key={p} x={P + xStep * i + xStep / 2} y={H - 8} fill="#6b7280" fontSize="10" textAnchor="middle">{p.slice(5)}</text>
      ))}
      {ENTRY_MEASURES.filter((m) => ['BF_QTY','PLAN_QTY','AMT'].includes(m.CATEGORY)).map((m, mi) => {
        const color = m.CATEGORY === 'BF_QTY' ? '#fbbf24' : m.CATEGORY === 'PLAN_QTY' ? '#1976d2' : '#10b981';
        const pts = m.vals.map((v, i) => `${P + xStep * i + xStep / 2} ${yScale(v)}`).join(' L ');
        return (
          <g key={m.CATEGORY}>
            <path d={`M ${pts}`} fill="none" stroke={color} strokeWidth="2" />
            {m.vals.map((v, i) => (
              <circle key={i} cx={P + xStep * i + xStep / 2} cy={yScale(v)} r="3" fill={color} />
            ))}
          </g>
        );
      })}
    </svg>
  );
}

function StepperIcon({ status }) {
  if (status === 'APPROVAL') return <CheckIcon sx={{ fontSize: 22, color: 'success.main' }} />;
  if (status === 'READY') return <Avatar sx={{ width: 22, height: 22, fontSize: 11, backgroundColor: 'grey.400' }}>·</Avatar>;
  return null;
}

export default function PlanWorkflowView({
  planTypeCode = 'DP_PLAN_MONTHLY',
  planTypeLabel = 'OP / 월간 계획',
  hasChart = false,
  menuCdControlBoard = 'UI_DP_93',
  menuCdProcessStatus = 'UI_DP_94',
  menuCdEntry = 'UI_DP_95',
  patternCode = 'cjbo_op_workflow',
}) {
  const [tab, setTab] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [stepTab, setStepTab] = useState(0);
  const isTP = planTypeCode === 'DP_PLAN_TARGET';
  const isBP = planTypeCode === 'DP_PLAN_YEARLY';

  return (
    <MockShell patternCode={patternCode}
      patternLabel={`CJBO — ${planTypeLabel} 워크플로 (BaseControlBoard/ProcessStatus/Entry · planTypeCode=${planTypeCode})`}
      layoutCategory="LAYOUT_SINGLE"
      description={`소스: view/demandplan/{version|targetplan|yearlyplan}/{controlboard,processstatus} · view/demandplan/entry/entry. 모두 동일 Base 컴포넌트 (thin wrapper). 3개 화면 통합 mockup.${hasChart ? ' hasChart=true (Entry).' : ''}`}>

      {/* Tab — 3 화면 */}
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" sx={{ minHeight: 38 }}>
          <Tab label="ControlBoard" sx={{ minHeight: 38 }} />
          <Tab label="ProcessStatus" sx={{ minHeight: 38 }} />
          <Tab label={`Entry${hasChart ? ' + Chart' : ''}`} sx={{ minHeight: 38 }} />
        </Tabs>
      </Box>

      {/* ───── ControlBoard ───── */}
      {tab === 0 && (
        <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5, flexGrow: 1, overflow: 'auto' }}>
          {/* setViewInfo NO_SEARCHAREA = true — SearchArea 없음 */}
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            {/* Top Left: Version History Stepper Card */}
            <Card variant="outlined" sx={{ flex: '0 0 33%', minWidth: 360, display: 'flex', flexDirection: 'column' }}>
              <CardHeader
                action={
                  <Stack direction="row" spacing={0.5}>
                    <Chip size="small" label={planTypeLabel} color="primary" sx={{ height: 22, fontSize: 10, fontWeight: 700 }} />
                    <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => setDrawerOpen(true)}>NEW_VERSION</Button>
                  </Stack>
                }
                title={<Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Version History</Typography>}
                sx={{ pb: 1 }}
              />
              <CardContent sx={{ flex: 1, pt: 0 }}>
                <Stepper nonLinear activeStep={activeStep} orientation="vertical">
                  {VERSION_HISTORY.map((v, i) => (
                    <Step key={v.LABEL} expanded={i === activeStep}>
                      <StepButton onClick={() => setActiveStep(i)} icon={
                        v.isClosed ? <StopCircleIcon color="action" /> :
                        v.isCopied ? <CopyAllIcon color="info" /> :
                        <PlayCircleIcon color={i === activeStep ? 'primary' : 'action'} />
                      }>
                        <Typography variant="body2" sx={{ fontWeight: i === activeStep ? 700 : 500 }}>{v.LABEL}</Typography>
                      </StepButton>
                      <StepContent>
                        <Typography variant="caption" color="text.secondary">{v.DESCRIP}</Typography>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                          {v.isMain ? <Chip size="small" label="MAIN" color="success" sx={{ height: 18, fontSize: 9 }} /> :
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>CREATED: {v.CREATED}</Typography>}
                          <Box sx={{ flexGrow: 1 }} />
                          <IconButton size="small"><DeleteForeverIcon fontSize="small" /></IconButton>
                          <IconButton size="small"><CopyAllIcon fontSize="small" /></IconButton>
                        </Stack>
                      </StepContent>
                    </Step>
                  ))}
                </Stepper>
              </CardContent>
            </Card>

            {/* Top Right: Approval Steps Table Card */}
            <Card variant="outlined" sx={{ flex: 1, minWidth: 480, display: 'flex', flexDirection: 'column' }}>
              <CardHeader title={<Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Approval Steps Table</Typography>} sx={{ pb: 1 }} />
              <CardContent sx={{ flex: 1, pt: 0, p: 0 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {['#','WORK_CD / WORK_NM','LV_NM','STATUS','DESCRIP'].map((c) => (
                        <TableCell key={c} sx={{ backgroundColor: 'grey.100', fontWeight: 700, fontSize: 11, py: 0.5 }}>{c}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {APPROVAL_STEPS.map((s, i) => (
                      <TableRow key={i} hover>
                        <TableCell sx={{ fontFamily: 'monospace' }}>#{i + 1}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{s.WORK_CD}</Typography>
                          <Typography variant="caption" color="text.secondary">{s.WORK_NM}</Typography>
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{s.LV_NM}</TableCell>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <StepperIcon status={s.STATUS} />
                            <Typography variant="caption" sx={{ fontWeight: 700 }}>{s.STATUS}</Typography>
                            <Avatar sx={{ width: 22, height: 22, fontSize: 9, backgroundColor: 'primary.main' }}>{s.CNT}</Avatar>
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ color: 'text.secondary' }}>{s.DESCRIP}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Box>

          {/* Bottom Row: 3 Cards */}
          <Box sx={{ display: 'flex', gap: 1.5, height: 395 }}>
            {/* VER_INFO Card */}
            <Card variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <CardHeader
                action={
                  <Stack direction="row" spacing={0.5}>
                    <IconButton size="small" title="createRefVerMeasure"><WbSunnyOutlinedIcon fontSize="small" /></IconButton>
                    <IconButton size="small" title="saveVerInfoSetting"><SaveIcon fontSize="small" /></IconButton>
                  </Stack>
                }
                title={<Typography variant="subtitle2" sx={{ fontWeight: 700 }}>VER_INFO (SET_CONTROLBOARD_VER_INFO)</Typography>}
                sx={{ pb: 0.5 }}
              />
              <CardContent sx={{ flex: 1, pt: 0, overflow: 'auto' }}>
                <Table size="small">
                  <TableBody>
                    {VERSION_INFO.map((r) => (
                      <TableRow key={r.key}>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: 10, color: 'text.secondary', py: 0.5, border: 0 }}>{r.key}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: 11, py: 0.5, border: 0 }}>{r.val}</TableCell>
                      </TableRow>
                    ))}
                    {isTP && TP_EXTRA.map((r) => (
                      <TableRow key={r.key} sx={{ backgroundColor: '#fffde7' }}>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: 10, color: 'text.secondary', py: 0.5, border: 0 }}>{r.key}</TableCell>
                        <TableCell sx={{ py: 0.5, border: 0 }}>
                          <Checkbox size="small" checked={r.val} disabled sx={{ p: 0 }} />
                          <Typography variant="caption" sx={{ ml: 0.5, fontFamily: 'monospace', fontSize: 10 }}>{r.val ? 'Y' : 'N'}</Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* CLOSE_SETTING Card */}
            <Card variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <CardHeader
                action={<IconButton size="small" title="saveCloseSetting"><SaveIcon fontSize="small" /></IconButton>}
                title={<Typography variant="subtitle2" sx={{ fontWeight: 700 }}>CLOSE_SETTING (SET_CONTROLBOARD_CLOSE_STEP)</Typography>}
                sx={{ pb: 0.5 }}
              />
              <CardContent sx={{ flex: 1, pt: 0 }}>
                <Stack spacing={1}>
                  <TextField label="CLOSE_TP (select)" size="small" select value="MANUAL" fullWidth>
                    <MenuItem value="MANUAL">수동 종료</MenuItem>
                    <MenuItem value="AUTO">자동 종료</MenuItem>
                  </TextField>
                  <TextField label="CLOSE_AUTH_TP (select)" size="small" select value="ADMIN" fullWidth>
                    <MenuItem value="ADMIN">관리자</MenuItem>
                  </TextField>
                  {isTP && <TextField label="MP_STD_DT (datetime, TP 전용)" size="small" type="date" value="2026-06-30" InputLabelProps={{ shrink: true }} fullWidth />}
                </Stack>
                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                  <Button size="small" variant="outlined" startIcon={<SendIcon />}>DP_BTN_DMND_TRANSMISSION</Button>
                  <Button size="small" variant="contained" color="warning">VERSION_CLOSE</Button>
                </Stack>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Chip size="small" label="VERSION_CLOSED" color="success" sx={{ display: 'none' }} />
                  <Typography variant="caption" color="text.secondary">현재 status: 진행중 (CLOSE 후 chip 활성)</Typography>
                </Stack>
              </CardContent>
            </Card>

            {/* STEP_DETAIL Card */}
            <Card variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <CardHeader
                action={<IconButton size="small" title="saveApproveSetting"><SaveIcon fontSize="small" /></IconButton>}
                title={
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>STEP_DETAIL</Typography>
                    <Chip size="small" label={APPROVAL_STEPS[activeStep]?.WORK_NM || '-'} variant="outlined" sx={{ height: 18, fontSize: 9 }} />
                  </Stack>
                }
                sx={{ pb: 0.5 }}
              />
              <CardContent sx={{ flex: 1, pt: 0 }}>
                <Tabs value={stepTab} onChange={(_, v) => setStepTab(v)} sx={{ minHeight: 32 }}>
                  <Tab label="INIT_SETTING" sx={{ minHeight: 32, fontSize: 11 }} />
                  <Tab label="APPV_SETTING" sx={{ minHeight: 32, fontSize: 11 }} />
                </Tabs>
                {stepTab === 0 && (
                  <Stack spacing={1} sx={{ mt: 1 }}>
                    <TextField label="MS_VAL_TP" size="small" select value="MEASURE" fullWidth>
                      <MenuItem value="MEASURE">MEASURE</MenuItem>
                    </TextField>
                    <TextField label="INIT_VAL_TP" size="small" select value="ZERO" fullWidth>
                      <MenuItem value="ZERO">ZERO</MenuItem>
                    </TextField>
                    <TextField label="INIT_VAL" size="small" type="number" value="0" fullWidth />
                  </Stack>
                )}
                {stepTab === 1 && (
                  <Stack spacing={1} sx={{ mt: 1 }}>
                    <TextField label="APPROVAL_CONST" size="small" select value="MAJORITY" fullWidth>
                      <MenuItem value="MAJORITY">과반 승인</MenuItem>
                    </TextField>
                    <TextField label="APPROVAL_EVENT" size="small" select value="EMAIL" fullWidth>
                      <MenuItem value="EMAIL">이메일 알림</MenuItem>
                    </TextField>
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Box>

          {/* New Version Drawer */}
          <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
            <Box sx={{ width: 320, p: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>NEW_VERSION (newVersionDrawer)</Typography>
              <Stack spacing={1.5}>
                <TextField label="VER_FROM_DATE" size="small" type="date" value="2026-07-01" InputLabelProps={{ shrink: true }} fullWidth />
                <TextField label="newEndDate" size="small" type="date" value="2026-12-31" InputLabelProps={{ shrink: true }} fullWidth />
                <TextField label="DTF_DATE" size="small" type="date" value="2026-07-31" InputLabelProps={{ shrink: true }} fullWidth />
                <TextField label="PAR_DATE" size="small" type="date" value="2026-07-31" InputLabelProps={{ shrink: true }} fullWidth />
                <TextField label="exchangeRateTp" size="small" select value="Monthly" fullWidth>
                  <MenuItem value="Monthly">Monthly</MenuItem>
                </TextField>
                <TextField label="refVersionId" size="small" select value="V2026-06" fullWidth>
                  <MenuItem value="V2026-06">V2026-06</MenuItem>
                </TextField>
                {isTP && (
                  <>
                    <FormControlLabel control={<Switch size="small" defaultChecked />} label={<Typography variant="caption">YEARPLAN_YN</Typography>} />
                    <FormControlLabel control={<Switch size="small" defaultChecked />} label={<Typography variant="caption">RATIO_COPY_YN</Typography>} />
                    <FormControlLabel control={<Switch size="small" />} label={<Typography variant="caption">SIMUL_YN</Typography>} />
                  </>
                )}
                <TextField label="newDescrip" size="small" multiline rows={2} fullWidth />
                <Button variant="contained" endIcon={<SendIcon />} fullWidth>GENERATE (GenerateDP)</Button>
              </Stack>
            </Box>
          </Drawer>
        </Box>
      )}

      {/* ───── ProcessStatus ───── */}
      {tab === 1 && (
        <>
          <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <TextField label="담당자" size="small" value="admin / 김민수" sx={{ width: 200 }}
                InputProps={{ startAdornment: <PersonIcon fontSize="small" sx={{ mr: 0.5 }} /> }} />
              <TextField label="버전" size="small" select value="V2026-06" sx={{ width: 200 }}>
                <MenuItem value="V2026-06">V2026-06</MenuItem>
              </TextField>
              <TextField label="권한" size="small" select value="ALL" sx={{ width: 130 }}>
                <MenuItem value="ALL">전체</MenuItem>
              </TextField>
              <Box sx={{ flexGrow: 1 }} />
              <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
              <Button variant="outlined" size="small" startIcon={<RefreshIcon />}>새로고침</Button>
            </Stack>
          </Box>

          {/* ResultArea sizes=[10,90] vertical */}
          <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5, flexGrow: 1, overflow: 'hidden' }}>
            {/* Top 10%: horizontal Stepper alternativeLabel */}
            <Paper variant="outlined" sx={{ p: 1.5 }}>
              <Stepper activeStep={1} alternativeLabel>
                {PROCESS_STATUS_STEPS.map((label) => (
                  <Step key={label}><StepLabel>{label}</StepLabel></Step>
                ))}
              </Stepper>
            </Paper>

            {/* Body 90%: TreeGrid */}
            <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <TableContainer sx={{ flex: 1 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      {['SALES_LV_CD','SALES_LV_NM','LV_CD','LV_NM','USERNAME','STATUS','STATUS_DATE','AUTO_APPV_YN'].map((c) => (
                        <TableCell key={c} sx={{ backgroundColor: 'grey.100', fontWeight: 700, fontSize: 11, py: 0.5, textAlign: 'center' }}>{c}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {PROCESS_STATUS_ROWS.map((r, i) => (
                      <TableRow key={i} hover>
                        <TableCell sx={{ fontFamily: 'monospace', pl: 1.5 + r.depth * 2 }}>
                          {r.depth > 0 && <span style={{ color: '#999', marginRight: 4 }}>└</span>}{r.SALES_LV_CD}
                        </TableCell>
                        <TableCell sx={{ pl: r.depth * 2 }}>{r.SALES_LV_NM}</TableCell>
                        <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace' }}>{r.LV_CD}</TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>{r.LV_NM}</TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>{r.USERNAME}</TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Chip size="small" label={r.STATUS}
                            color={r.STATUS === 'APPROVAL' ? 'success' : 'default'}
                            sx={{ height: 18, fontSize: 10, fontWeight: 700 }} />
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 11 }}>{r.STATUS_DATE}</TableCell>
                        <TableCell sx={{ textAlign: 'center' }}><Checkbox size="small" checked={r.AUTO_APPV_YN} disabled sx={{ p: 0 }} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box sx={{ p: 0.5, borderTop: '1px solid', borderColor: 'divider', textAlign: 'right' }}>
                <Typography variant="caption" color="text.secondary">{PROCESS_STATUS_ROWS.length}건</Typography>
              </Box>
            </Paper>
          </Box>
        </>
      )}

      {/* ───── Entry (BaseEntry) ───── */}
      {tab === 2 && (
        <>
          {/* SearchArea (2 rows toggle) */}
          <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
              <TextField label="ItemSearchInput forEntry hasAttr" size="small" value="전체" sx={{ width: 200 }}
                InputProps={{ endAdornment: <Box sx={{ width: 24, textAlign: 'center', color: 'text.secondary' }}>🔍</Box> }} />
              <TextField label="AccountSearchInput defaultLv=S2" size="small" value="전체" sx={{ width: 180 }}
                InputProps={{ endAdornment: <Box sx={{ width: 24, textAlign: 'center', color: 'text.secondary' }}>🔍</Box> }} />
              <TextField label="CURCY_CD" size="small" select value="USD" sx={{ width: 100 }}>
                <MenuItem value="USD">USD</MenuItem><MenuItem value="KRW">KRW</MenuItem>
              </TextField>
              <TextField label="BUCKET" size="small" select value="MONTH" sx={{ width: 110 }}>
                <MenuItem value="MONTH">월</MenuItem><MenuItem value="WEEK">주</MenuItem>
              </TextField>
              <TextField label="SALES_GRP_CD (multi)" size="small" select value="ALL" sx={{ width: 150 }}>
                <MenuItem value="ALL">전체</MenuItem>
              </TextField>
              <TextField label="SOLID_CONV" size="small" select value="ALL" sx={{ width: 130 }}>
                <MenuItem value="ALL">전체</MenuItem><MenuItem value="L">L 액상</MenuItem><MenuItem value="S">S 분말</MenuItem>
              </TextField>
              <TextField label="FROM_DATE" size="small" type="date" value="2026-06-01" sx={{ width: 140 }} InputLabelProps={{ shrink: true }} />
              <TextField label="TO_DATE" size="small" type="date" value="2026-11-30" sx={{ width: 140 }} InputLabelProps={{ shrink: true }} />
              <FormControlLabel control={<Switch size="small" />} label={<Typography variant="caption">DP_ENTRY_SWITCH_NUM_FORMAT</Typography>} sx={{ ml: 0 }} />
              <IconButton size="small" title="Show additional row">⇕</IconButton>
              <Box sx={{ flexGrow: 1 }} />
              <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
            </Stack>
          </Box>

          {/* ResultArea sizes=[30,70] (hasChart) or [100] */}
          <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5, flexGrow: 1, overflow: 'hidden' }}>
            {hasChart && (
              <Paper variant="outlined" sx={{ height: 180, p: 1 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>Chart (BF_QTY · PLAN_QTY · AMT) — TP/BP 전용</Typography>
                  <Box sx={{ flexGrow: 1 }} />
                  {[['BF_QTY','#fbbf24'],['PLAN_QTY','#1976d2'],['AMT','#10b981']].map(([n,c]) => (
                    <Stack key={n} direction="row" alignItems="center" spacing={0.3}>
                      <Box sx={{ width: 12, height: 2, backgroundColor: c, borderRadius: 0.5 }} />
                      <Typography variant="caption" sx={{ fontSize: 10 }}>{n}</Typography>
                    </Stack>
                  ))}
                </Stack>
                <Box sx={{ height: 140 }}><EntryChart /></Box>
              </Paper>
            )}

            <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              {/* ButtonArea */}
              <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Button size="small" startIcon={<ContentCopyIcon />} variant="outlined">Copy (PopMeasureCopy)</Button>
                <Button size="small" startIcon={<KeyboardIcon />} variant="outlined">Formula (PopMeasureFormula)</Button>
                <Button size="small" startIcon={<FileDownloadIcon />} variant="outlined">Excel Export</Button>
                <Button size="small" startIcon={<FileUploadIcon />} variant="outlined">Excel Import</Button>
                <Box sx={{ flexGrow: 1 }} />
                <Button size="small" startIcon={<SaveIcon />} variant="contained">Save (SetDemand)</Button>
                <Chip size="small" label="STATUS: OPEN" color="info" sx={{ height: 18, fontSize: 10 }} />
                <Button size="small" startIcon={<CheckIcon />} variant="contained" color="success">APPROVE</Button>
                <Button size="small" startIcon={<CloseIcon />} variant="outlined" color="warning">CANCELAPPROVE</Button>
                <Button size="small" startIcon={<EventNoteIcon />} variant="outlined">DP_MEMO</Button>
              </Box>

              <TableContainer sx={{ flex: 1 }}>
                <Table size="small" stickyHeader sx={{ '& th, & td': { whiteSpace: 'nowrap', fontSize: 11, py: 0.5 } }}>
                  <TableHead>
                    <TableRow>
                      {ENTRY_DIMS.map((d) => (
                        <TableCell key={d} sx={{ backgroundColor: 'grey.100', fontWeight: 700, fontSize: 10 }}>{d}</TableCell>
                      ))}
                      <TableCell sx={{ backgroundColor: 'grey.300', fontWeight: 700, fontSize: 10 }}>CATEGORY (Measure)</TableCell>
                      {ENTRY_PERIODS.map((p) => (
                        <TableCell key={p} sx={{ backgroundColor: '#e3f2fd', fontWeight: 700, textAlign: 'right', fontSize: 11 }}>{p}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {/* 같은 dimension 행 묶음 — CATEGORY (Measure) 별 펼침 */}
                    {ENTRY_MEASURES.map((m, mi) => (
                      <TableRow key={m.CATEGORY} hover sx={{ backgroundColor: m.editable ? '#fffde7' : undefined }}>
                        {mi === 0 ? (
                          <>
                            <TableCell rowSpan={ENTRY_MEASURES.length} sx={{ verticalAlign: 'top', position: 'sticky', left: 0, backgroundColor: 'background.paper' }}>Animal Nutrition</TableCell>
                            <TableCell rowSpan={ENTRY_MEASURES.length} sx={{ verticalAlign: 'top' }}>베트남</TableCell>
                            <TableCell rowSpan={ENTRY_MEASURES.length} sx={{ verticalAlign: 'top' }}>수출</TableCell>
                            <TableCell rowSpan={ENTRY_MEASURES.length} sx={{ verticalAlign: 'top', fontFamily: 'monospace' }}>VN-HCM</TableCell>
                            <TableCell rowSpan={ENTRY_MEASURES.length} sx={{ verticalAlign: 'top' }}>Jakarta Corp.</TableCell>
                            <TableCell rowSpan={ENTRY_MEASURES.length} sx={{ verticalAlign: 'top' }}>AN</TableCell>
                            <TableCell rowSpan={ENTRY_MEASURES.length} sx={{ verticalAlign: 'top' }}>Lysine / 78% 액상</TableCell>
                            <TableCell rowSpan={ENTRY_MEASURES.length} sx={{ verticalAlign: 'top', fontFamily: 'monospace' }}>L-LYS-78L</TableCell>
                          </>
                        ) : null}
                        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                          {m.CATEGORY}
                          {m.editable && <Chip size="small" label="editable" color="warning" sx={{ ml: 0.5, height: 14, fontSize: 8 }} />}
                        </TableCell>
                        {m.vals.map((v, i) => (
                          <TableCell key={i} sx={{ textAlign: 'right', fontFamily: 'monospace', backgroundColor: m.editable && typeof v === 'number' ? '#fff' : undefined, fontWeight: m.CATEGORY === 'AMT' ? 700 : undefined }}>
                            {typeof v === 'number' ? v.toLocaleString() : v}
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
    </MockShell>
  );
}
