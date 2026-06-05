import React, { useState } from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography, Paper, Chip, Tabs, Tab, Avatar,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import MockShell from '../../_shared/MockShell';
import { cellSx, rowSx, percentStatus } from '../../_shared/styleCallback';

// CJBO — 계획 확인·점검·로그
// UI_DP_ENTRY_CONF      — OP 계획 확인 (담당자별 확정 상태)
// UI_DP_ENTRY_TP_CONF   — TP 계획 확인 (TP 호라이즌 12개월)
// UI_DP_ENTRY_NOTIFY    — 알림/점검 (GetEntryNotifyGrid + Chart + DP_ALERT_RANGE config + VAR_BUKT)
// UI_DP_ENTRY_LOG       — 입력 로그 (USERNAME + CREATE_DTTM, engine/dp/GetEntryLog read-only)

// 계획 확인 (OP/TP 공통 구조, TP는 12개월/EMP 없음)
const CONFIRM_ROWS_OP = [
  { EMP: '김민수',     TEAM: '영업1팀', ITEMS: 32, COMPLETED:100, SAVED: '2026-06-04 15:25', STATUS: 'confirmed' },
  { EMP: '이정훈',     TEAM: '영업1팀', ITEMS: 28, COMPLETED:100, SAVED: '2026-06-04 15:18', STATUS: 'confirmed' },
  { EMP: '박서연',     TEAM: '영업1팀', ITEMS: 24, COMPLETED:100, SAVED: '2026-06-04 14:55', STATUS: 'confirmed' },
  { EMP: '정재현',     TEAM: 'NGP팀',   ITEMS: 22, COMPLETED: 95, SAVED: '2026-06-04 14:42', STATUS: 'in_review' },
  { EMP: '송하늘',     TEAM: 'NGP팀',   ITEMS: 18, COMPLETED: 78, SAVED: '2026-06-04 14:30', STATUS: 'in_review' },
  { EMP: '박글로벌',   TEAM: '수출팀',  ITEMS: 35, COMPLETED: 45, SAVED: '2026-06-04 14:15', STATUS: 'pending' },
  { EMP: '최가람',     TEAM: '영업3팀', ITEMS: 18, COMPLETED:  0, SAVED: '-',                  STATUS: 'unsubmitted' },
];

const CONFIRM_ROWS_TP = [
  { TEAM: '영업1본부 - 영업1팀',  HEAD: '김민수',    PLAN: 38500, REVIEW:100, SAVED: '2026-06-01 17:30', STATUS: 'confirmed' },
  { TEAM: '영업1본부 - 영업2팀',  HEAD: '이정훈',    PLAN: 31500, REVIEW:100, SAVED: '2026-06-01 16:45', STATUS: 'confirmed' },
  { TEAM: '영업1본부 - 영업3팀',  HEAD: '박서연',    PLAN: 22300, REVIEW: 85, SAVED: '2026-06-02 11:20', STATUS: 'in_review' },
  { TEAM: 'NGP본부 - NGP1팀',     HEAD: '정재현',    PLAN: 19800, REVIEW: 72, SAVED: '2026-06-02 14:10', STATUS: 'in_review' },
  { TEAM: '해외영업본부 - 동남아', HEAD: '박글로벌', PLAN: 48500, REVIEW: 40, SAVED: '2026-06-03 09:15', STATUS: 'pending' },
  { TEAM: '해외영업본부 - 미주',   HEAD: '최가람',   PLAN: 28800, REVIEW:  0, SAVED: '-',                  STATUS: 'unsubmitted' },
];

const NOTIFY = [
  { TYPE: 'error',   RULE: '월별 합계 불일치',     CUST: '쿠팡',         ITEM: 'illuvia 토너 200ml',    DETAIL: '월별 합계 18,500 vs 입력 합계 18,200 (차이 300)', EMP: '이정훈' },
  { TYPE: 'error',   RULE: 'PSI 부정합',           CUST: '베트남 KGS',   ITEM: 'CJ Brand KING-RED',     DETAIL: '판매계획(5,500) > 가용재고(4,200) — Short 1,300', EMP: '박글로벌' },
  { TYPE: 'warning', RULE: '전년동기 ±30% 초과',  CUST: '말레이 SCH',   ITEM: 'NGP Device #01',         DETAIL: '전년 1,900 → 입력 1,370 (-27.9%)', EMP: '정재현' },
  { TYPE: 'warning', RULE: 'BF 베이스라인 이탈',  CUST: '인니 INDOMA',  ITEM: 'illuvia MASK',           DETAIL: 'BF 5,200 → 입력 5,090 (-2.1%) · 임계값 ±5%', EMP: '박글로벌' },
  { TYPE: 'info',    RULE: '신규 거래처',         CUST: '필리핀 SCM',   ITEM: 'illuvia 비건마스크 5매', DETAIL: '신규 거래처 — 마스터 등록 확인 필요', EMP: '박글로벌' },
];

const LOG = [
  { DTTM: '2026-06-04 15:25:18', EMP: '김민수',   TYPE: 'SAVE',   ITEM: 'illuvia 비건마스크 5매',  CUST: '롯데마트',     OLD_VAL: 5100,  NEW_VAL: 5300, CHG: +200 },
  { DTTM: '2026-06-04 15:18:42', EMP: '이정훈',   TYPE: 'SAVE',   ITEM: 'illuvia 비건마스크 5매',  CUST: '쿠팡',         OLD_VAL: 4200,  NEW_VAL: 4150, CHG: -50  },
  { DTTM: '2026-06-04 14:55:33', EMP: '박서연',   TYPE: 'SAVE',   ITEM: 'illuvia 토너 200ml',       CUST: '올리브영',     OLD_VAL: 2700,  NEW_VAL: 2800, CHG: +100 },
  { DTTM: '2026-06-04 14:42:18', EMP: '정재현',   TYPE: 'SAVE',   ITEM: 'NGP Device #01',           CUST: '말레이 SCH',  OLD_VAL: 1900,  NEW_VAL: 1370, CHG: -530 },
  { DTTM: '2026-06-04 14:30:42', EMP: '박글로벌', TYPE: 'SAVE',   ITEM: 'illuvia MASK',             CUST: '인니 INDOMA', OLD_VAL: 5200,  NEW_VAL: 5090, CHG: -110 },
  { DTTM: '2026-06-04 14:15:18', EMP: '김민수',   TYPE: 'DELETE', ITEM: 'illuvia 클렌저 150ml',     CUST: '롯데마트',     OLD_VAL:   90,  NEW_VAL:   0, CHG:  -90 },
  { DTTM: '2026-06-04 13:55:08', EMP: '송하늘',   TYPE: 'INSERT', ITEM: 'illuvia 선크림 50ml',      CUST: '쿠팡',         OLD_VAL:    0,  NEW_VAL: 1200, CHG:+1200 },
];

const TYPE_INFO = {
  error:   { label: '오류',  color: 'error',    Icon: ErrorIcon,        tone: 'danger'  },
  warning: { label: '경고',  color: 'warning',  Icon: WarningIcon,      tone: 'warning' },
  info:    { label: '정보',  color: 'info',     Icon: CheckCircleIcon,  tone: 'info'    },
};
const CONFIRM_STATUS = {
  confirmed:   { label: '확인 완료', color: 'success' },
  in_review:   { label: '검토 중',   color: 'info' },
  pending:     { label: '진행 중',   color: 'warning' },
  unsubmitted: { label: '미제출',    color: 'error' },
};
const LOG_TYPE_COLOR = { SAVE: 'info', INSERT: 'success', DELETE: 'error' };

export default function CjboDpPlanConfirmMockup() {
  const [tab, setTab] = useState(0);
  // 0=OP 확인 · 1=TP 확인 · 2=알림/점검 · 3=입력 로그

  return (
    <MockShell patternCode="cjbo_dp_plan_confirm" patternLabel="CJBO — 계획 확인·점검·로그 (EntryConf/TPConf/Notify/Log)"
      layoutCategory="LAYOUT_SINGLE"
      description="OP/TP 확인 (담당자별 확정 상태) · 점검 (DP_ALERT_RANGE 룰) · 입력 로그 (engine/dp/GetEntryLog read-only).">
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <TextField label="계획구분" size="small" value={tab === 1 ? 'TP' : 'OP'} sx={{ width: 130 }} />
          <TextField label="버전" size="small" value="V2026-06" sx={{ width: 130 }} />
          <TextField label="조회월" size="small" value="2026-06" sx={{ width: 130 }} />
          {tab < 2 && <TextField label="확정 상태" size="small" select value="ALL" sx={{ width: 140 }}>
            <MenuItem value="ALL">전체</MenuItem>
            <MenuItem value="confirmed">확인 완료</MenuItem>
            <MenuItem value="pending">진행 중</MenuItem>
          </TextField>}
          {tab === 2 && <TextField label="알림 범위" size="small" select value="DP_ALERT_RANGE" sx={{ width: 160 }}>
            <MenuItem value="DP_ALERT_RANGE">DP_ALERT_RANGE</MenuItem>
          </TextField>}
          {tab === 3 && <TextField label="구분" size="small" select value="ALL" sx={{ width: 130 }}>
            <MenuItem value="ALL">전체</MenuItem><MenuItem value="SAVE">SAVE</MenuItem>
            <MenuItem value="INSERT">INSERT</MenuItem><MenuItem value="DELETE">DELETE</MenuItem>
          </TextField>}
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
          {tab < 2 && <Button variant="contained" size="small" color="success" startIcon={<AssignmentTurnedInIcon />}>일괄 확인</Button>}
        </Stack>
      </Box>

      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" sx={{ minHeight: 38 }}>
          <Tab label="OP 계획 확인 (DpEntryConf)" sx={{ minHeight: 38 }} />
          <Tab label="TP 계획 확인 (DpEntryTPConf)" sx={{ minHeight: 38 }} />
          <Tab label="알림 / 점검 (EntryNotify)" sx={{ minHeight: 38 }} />
          <Tab label="입력 로그 (EntryLog)" sx={{ minHeight: 38 }} />
        </Tabs>
      </Box>

      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5, flexGrow: 1, overflow: 'auto' }}>
        {tab === 0 && (
          <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 280 }}>
            <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>OP 담당자별 확정 상태 — V2026-06</Typography>
              <Chip size="small" label={`완료 ${CONFIRM_ROWS_OP.filter(r => r.STATUS === 'confirmed').length} / ${CONFIRM_ROWS_OP.length}`} color="success" />
            </Box>
            <TableContainer sx={{ flex: 1 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {['담당자','팀','담당 품목수','입력 완료율','저장 일시','상태','액션'].map((c) => (
                      <TableCell key={c} sx={{ backgroundColor: 'grey.100', fontWeight: 700,
                        textAlign: ['담당 품목수','입력 완료율','저장 일시','상태','액션'].includes(c) ? 'center' : 'left' }}>{c}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {CONFIRM_ROWS_OP.map((r, i) => {
                    const s = CONFIRM_STATUS[r.STATUS];
                    const tone = percentStatus(r.COMPLETED);
                    return (
                      <TableRow key={i} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{r.EMP}</TableCell>
                        <TableCell>{r.TEAM}</TableCell>
                        <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace' }}>{r.ITEMS}</TableCell>
                        <TableCell sx={cellSx(tone, { align: 'center', mono: true })}>{r.COMPLETED}%</TableCell>
                        <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 12 }}>{r.SAVED}</TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Chip size="small" label={s.label} color={s.color} />
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          {r.STATUS === 'in_review' ? <Button size="small" variant="contained" color="success">확인</Button> :
                            r.STATUS === 'pending' ? <Button size="small" variant="outlined" color="warning">독촉</Button> :
                              r.STATUS === 'unsubmitted' ? <Button size="small" variant="outlined" color="error">알림</Button> :
                                <Button size="small" variant="text">상세</Button>}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {tab === 1 && (
          <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 280 }}>
            <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>TP 본부/팀별 검토 상태 — V2026-06 (12개월)</Typography>
              <Chip size="small" label={`완료 ${CONFIRM_ROWS_TP.filter(r => r.STATUS === 'confirmed').length} / ${CONFIRM_ROWS_TP.length}`} color="success" />
            </Box>
            <TableContainer sx={{ flex: 1 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {['본부 / 팀','팀장','연 TP 계획','검토 진척','저장 일시','상태','액션'].map((c) => (
                      <TableCell key={c} sx={{ backgroundColor: 'grey.100', fontWeight: 700,
                        textAlign: ['연 TP 계획','검토 진척','저장 일시','상태','액션'].includes(c) ? (c === '연 TP 계획' ? 'right' : 'center') : 'left' }}>{c}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {CONFIRM_ROWS_TP.map((r, i) => {
                    const s = CONFIRM_STATUS[r.STATUS];
                    const tone = percentStatus(r.REVIEW);
                    return (
                      <TableRow key={i} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{r.TEAM}</TableCell>
                        <TableCell>{r.HEAD}</TableCell>
                        <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>{r.PLAN.toLocaleString()}</TableCell>
                        <TableCell sx={cellSx(tone, { align: 'center', mono: true })}>{r.REVIEW}%</TableCell>
                        <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 12 }}>{r.SAVED}</TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Chip size="small" label={s.label} color={s.color} />
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          {r.STATUS === 'in_review' ? <Button size="small" variant="contained" color="success">승인</Button> :
                            r.STATUS === 'pending' ? <Button size="small" variant="outlined" color="warning">독촉</Button> :
                              r.STATUS === 'unsubmitted' ? <Button size="small" variant="outlined" color="error">알림</Button> :
                                <Button size="small" variant="text">상세</Button>}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {tab === 2 && (
          <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 280 }}>
            <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>계획 점검 알림 (GetEntryNotifyGrid + Chart)</Typography>
              <Chip size="small" icon={<ErrorIcon />} label={`오류 ${NOTIFY.filter(n => n.TYPE === 'error').length}`} color="error" />
              <Chip size="small" icon={<WarningIcon />} label={`경고 ${NOTIFY.filter(n => n.TYPE === 'warning').length}`} color="warning" />
              <Chip size="small" icon={<CheckCircleIcon />} label={`정보 ${NOTIFY.filter(n => n.TYPE === 'info').length}`} color="info" />
              <Box sx={{ flexGrow: 1 }} />
              <Button size="small" variant="outlined">전체 알림 발송</Button>
            </Box>
            <TableContainer sx={{ flex: 1 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {['구분','검증 룰','거래처','품목','상세 메시지','담당자'].map((c) => (
                      <TableCell key={c} sx={{ backgroundColor: 'grey.100', fontWeight: 700,
                        textAlign: c === '구분' ? 'center' : 'left' }}>{c}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {NOTIFY.map((n, i) => {
                    const info = TYPE_INFO[n.TYPE];
                    return (
                      <TableRow key={i} hover sx={rowSx(info.tone)}>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Chip size="small" icon={<info.Icon />} label={info.label} color={info.color} />
                        </TableCell>
                        <TableCell sx={cellSx(info.tone)}>{n.RULE}</TableCell>
                        <TableCell>{n.CUST}</TableCell>
                        <TableCell>{n.ITEM}</TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{n.DETAIL}</TableCell>
                        <TableCell>{n.EMP}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {tab === 3 && (
          <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 280 }}>
            <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>입력 변경 로그 — engine/dp/GetEntryLog (read-only)</Typography>
              <Chip size="small" label={`최근 ${LOG.length}건`} variant="outlined" />
            </Box>
            <TableContainer sx={{ flex: 1 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {['일시 (CREATE_DTTM)','담당자 (USER_ID)','구분','품목','거래처','이전값','신규값','변경량'].map((c) => (
                      <TableCell key={c} sx={{ backgroundColor: 'grey.100', fontWeight: 700,
                        textAlign: ['이전값','신규값','변경량'].includes(c) ? 'right' : (['일시 (CREATE_DTTM)','구분'].includes(c) ? 'center' : 'left') }}>{c}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {LOG.map((r, i) => (
                    <TableRow key={i} hover>
                      <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 11 }}>{r.DTTM}</TableCell>
                      <TableCell>{r.EMP}</TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Chip size="small" label={r.TYPE} color={LOG_TYPE_COLOR[r.TYPE]} variant="outlined" />
                      </TableCell>
                      <TableCell>{r.ITEM}</TableCell>
                      <TableCell>{r.CUST}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 12, color: 'text.secondary' }}>{r.OLD_VAL.toLocaleString()}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>{r.NEW_VAL.toLocaleString()}</TableCell>
                      <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: r.CHG > 0 ? 'success.main' : r.CHG < 0 ? 'error.main' : undefined }}>
                        {r.CHG > 0 ? '+' : ''}{r.CHG.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
      </Box>
    </MockShell>
  );
}
