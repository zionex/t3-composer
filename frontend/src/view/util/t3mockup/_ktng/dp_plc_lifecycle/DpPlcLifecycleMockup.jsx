import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Typography, Paper, Chip, Tabs, Tab, Button, ButtonGroup, IconButton,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SaveIcon from '@mui/icons-material/Save';
import DownloadIcon from '@mui/icons-material/Download';
import MockShell from '../../_shared/MockShell';

// KTNG — DP 제품 생명주기 (PLC)
//  Tab 1: UI_DP_KTNG_04 신/구품 PLC 현황       → DpKtng04.jsx
//  Tab 2: UI_DP_KTNG_14 EOP 생산 수량 관리     → DpKtng14.jsx
//  Tab 3: UI_DP_KTNG_16 제품 생명주기 조건 관리 → DpKtng16.jsx

const PLC_ROWS = [
  { OLD_CD: 'ITM-ESSE-OLD', OLD_NM: '에쎄 (구형 BOX)',  NEW_CD: 'ITM-ESSE-001', NEW_NM: '에쎄 스페셜 골드 1mg', SHIFT_DT: '2026-04-01', RTS_DT: '2026-04-15', EOD_DT: '2026-06-30', EOP_DT: '2026-09-30', STATUS: 'IN_TRANSITION' },
  { OLD_CD: 'ITM-DIS-OLD',  OLD_NM: '디스 (구형)',     NEW_CD: 'ITM-DIS-001',  NEW_NM: '디스 플러스',          SHIFT_DT: '2026-03-15', RTS_DT: '2026-04-01', EOD_DT: '2026-05-31', EOP_DT: '2026-08-31', STATUS: 'COMPLETED'     },
  { OLD_CD: 'ITM-LSN-OLD',  OLD_NM: '레종 (단종 예정)', NEW_CD: '-',            NEW_NM: '-',                    SHIFT_DT: '-',          RTS_DT: '-',           EOD_DT: '2025-12-31', EOP_DT: '2026-03-31', STATUS: 'EOL'           },
  { OLD_CD: '-',            OLD_NM: '-',               NEW_CD: 'ITM-LIL-001',  NEW_NM: '릴 에이스 NGP',         SHIFT_DT: '-',          RTS_DT: '2026-06-01', EOD_DT: '-',           EOP_DT: '-',           STATUS: 'NEW_LAUNCH'    },
];

const EOP_ROWS = [
  { ITEM_CD: 'ITM-ESSE-OLD', ITEM_NM: '에쎄 구형 BOX',  EOP_DT: '2026-09-30', PROD_CNTRY: '한국',      EOP_PLAN_QTY: 250000, ACT_PROD_QTY: 180000, REMAIN_QTY: 70000, ACHV_RATE: 72.0 },
  { ITEM_CD: 'ITM-DIS-OLD',  ITEM_NM: '디스 구형',      EOP_DT: '2026-08-31', PROD_CNTRY: '한국',      EOP_PLAN_QTY: 150000, ACT_PROD_QTY: 150000, REMAIN_QTY: 0,     ACHV_RATE: 100.0 },
  { ITEM_CD: 'ITM-LSN-OLD',  ITEM_NM: '레종 단종',      EOP_DT: '2026-03-31', PROD_CNTRY: '한국',      EOP_PLAN_QTY: 80000,  ACT_PROD_QTY: 75000,  REMAIN_QTY: 5000,  ACHV_RATE: 93.8 },
  { ITEM_CD: 'ITM-TIME-OLD', ITEM_NM: 'TIME 구형',      EOP_DT: '2026-12-31', PROD_CNTRY: '카자흐스탄', EOP_PLAN_QTY: 320000, ACT_PROD_QTY: 95000,  REMAIN_QTY: 225000,ACHV_RATE: 29.7 },
];

const LIFECYCLE_RULES = [
  { LV4_CD: 'L4-NEW-PROD',  LV4_NM: '신제품',      MIN_DAYS_BEFORE_RTS: 60,  EOD_DEFAULT_OFFSET: -180, EOP_DEFAULT_OFFSET: -90,  AUTO_TRANSITION: 'N', USE_YN: 'Y' },
  { LV4_CD: 'L4-RENEWAL',   LV4_NM: '리뉴얼',     MIN_DAYS_BEFORE_RTS: 30,  EOD_DEFAULT_OFFSET: -60,  EOP_DEFAULT_OFFSET: -30,  AUTO_TRANSITION: 'Y', USE_YN: 'Y' },
  { LV4_CD: 'L4-EOS',       LV4_NM: '단종 예정',   MIN_DAYS_BEFORE_RTS: 0,   EOD_DEFAULT_OFFSET: 0,    EOP_DEFAULT_OFFSET: 90,   AUTO_TRANSITION: 'N', USE_YN: 'Y' },
  { LV4_CD: 'L4-SEASONAL',  LV4_NM: '계절성 제품', MIN_DAYS_BEFORE_RTS: 45,  EOD_DEFAULT_OFFSET: -120, EOP_DEFAULT_OFFSET: -60,  AUTO_TRANSITION: 'Y', USE_YN: 'Y' },
];

const STATUS_COLOR = { IN_TRANSITION: '#f59e0b', COMPLETED: '#10b981', EOL: '#ef4444', NEW_LAUNCH: '#3b82f6' };

export default function KtngDpPlcLifecycleMockup() {
  const [tab, setTab] = React.useState(0);
  return (
    <MockShell
      patternCode="ktng_dp_plc_lifecycle"
      patternLabel="KTNG — DP 제품 생명주기 (PLC)"
      layoutCategory="LAYOUT_SINGLE"
      description="3개 PLC 관련 화면 묶음. Tab 1: 신/구품 PLC 현황 (구품 → 신품 전환 추적 + STATUS), Tab 2: EOP 생산 수량 (단종 잔여 생산 vs 실적 + 달성률), Tab 3: 제품 생명주기 조건 (Lvl4 카테고리별 RTS/EOD/EOP 기본 오프셋 + 자동 전환 여부)."
    >
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 1.5 }}>
        <Tabs value={tab} onChange={(_e, v) => setTab(v)}>
          <Tab label={<Stack direction="row" spacing={1} alignItems="center"><span>신/구품 PLC 현황</span><Chip label="UI_DP_KTNG_04" size="small" variant="outlined" sx={{ height: 18, fontSize: 10, fontFamily: 'monospace' }} /></Stack>} />
          <Tab label={<Stack direction="row" spacing={1} alignItems="center"><span>EOP 생산 수량</span><Chip label="UI_DP_KTNG_14" size="small" variant="outlined" sx={{ height: 18, fontSize: 10, fontFamily: 'monospace' }} /></Stack>} />
          <Tab label={<Stack direction="row" spacing={1} alignItems="center"><span>생명주기 조건</span><Chip label="UI_DP_KTNG_16" size="small" variant="outlined" sx={{ height: 18, fontSize: 10, fontFamily: 'monospace' }} /></Stack>} />
        </Tabs>
      </Box>

      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          {tab !== 2 && <TextField label="BASE_YM" size="small" select value="2026-06" sx={{ width: 130 }}><MenuItem value="2026-06">2026-06</MenuItem></TextField>}
          <TextField label="ITEM_LV3" size="small" value="" placeholder="브랜드 검색"
            InputProps={{ endAdornment: <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} /> }}
            sx={{ width: 200 }} />
          {tab === 0 && (
            <TextField label="STATUS" size="small" select value="ALL" sx={{ width: 160 }}>
              <MenuItem value="ALL">전체</MenuItem>
              <MenuItem value="IN_TRANSITION">전환중</MenuItem>
              <MenuItem value="EOL">단종</MenuItem>
            </TextField>
          )}
        </Stack>
      </Box>

      <Box sx={{ px: 1.5, py: 0.7, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        <Button size="small" variant="outlined" startIcon={<DownloadIcon />}>Excel</Button>
        {tab === 2 && <ButtonGroup variant="outlined" size="small"><IconButton size="small" color="primary"><SaveIcon fontSize="small" /></IconButton></ButtonGroup>}
      </Box>

      <Box sx={{ p: 1.5, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Paper variant="outlined" sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              {tab === 0 && (
                <>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ bgcolor: '#fee2e2', fontWeight: 700, fontSize: 11 }} colSpan={2}>구품 (Old)</TableCell>
                      <TableCell sx={{ bgcolor: '#dcfce7', fontWeight: 700, fontSize: 11 }} colSpan={2}>신품 (New)</TableCell>
                      <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11 }} colSpan={5}>전환 일자</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ bgcolor: 'grey.50', fontWeight: 700, fontSize: 10, fontFamily: 'monospace' }}>OLD_CD</TableCell>
                      <TableCell sx={{ bgcolor: 'grey.50', fontWeight: 700, fontSize: 10 }}>OLD_NM</TableCell>
                      <TableCell sx={{ bgcolor: 'grey.50', fontWeight: 700, fontSize: 10, fontFamily: 'monospace' }}>NEW_CD</TableCell>
                      <TableCell sx={{ bgcolor: 'grey.50', fontWeight: 700, fontSize: 10 }}>NEW_NM</TableCell>
                      <TableCell sx={{ bgcolor: 'grey.50', fontWeight: 700, fontSize: 10, textAlign: 'center' }}>SHIFT_DT</TableCell>
                      <TableCell sx={{ bgcolor: 'grey.50', fontWeight: 700, fontSize: 10, textAlign: 'center' }}>RTS_DT</TableCell>
                      <TableCell sx={{ bgcolor: 'grey.50', fontWeight: 700, fontSize: 10, textAlign: 'center' }}>EOD_DT</TableCell>
                      <TableCell sx={{ bgcolor: 'grey.50', fontWeight: 700, fontSize: 10, textAlign: 'center' }}>EOP_DT</TableCell>
                      <TableCell sx={{ bgcolor: 'grey.50', fontWeight: 700, fontSize: 10, textAlign: 'center' }}>STATUS</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {PLC_ROWS.map((r, i) => (
                      <TableRow key={i} hover>
                        <TableCell sx={{ fontSize: 11, fontFamily: 'monospace' }}>{r.OLD_CD}</TableCell>
                        <TableCell sx={{ fontSize: 11 }}>{r.OLD_NM}</TableCell>
                        <TableCell sx={{ fontSize: 11, fontFamily: 'monospace' }}>{r.NEW_CD}</TableCell>
                        <TableCell sx={{ fontSize: 11 }}>{r.NEW_NM}</TableCell>
                        <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'center' }}>{r.SHIFT_DT}</TableCell>
                        <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'center' }}>{r.RTS_DT}</TableCell>
                        <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'center' }}>{r.EOD_DT}</TableCell>
                        <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'center' }}>{r.EOP_DT}</TableCell>
                        <TableCell sx={{ fontSize: 11, textAlign: 'center', fontWeight: 600, color: STATUS_COLOR[r.STATUS] }}>{r.STATUS}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </>
              )}
              {tab === 1 && (
                <>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, fontFamily: 'monospace' }}>ITEM_CD</TableCell>
                      <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11 }}>ITEM_NM</TableCell>
                      <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, textAlign: 'center' }}>EOP_DT</TableCell>
                      <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11 }}>PROD_CNTRY</TableCell>
                      <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, textAlign: 'right' }}>EOP_PLAN_QTY</TableCell>
                      <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, textAlign: 'right' }}>ACT_PROD_QTY</TableCell>
                      <TableCell sx={{ bgcolor: '#fef3c7', fontWeight: 700, fontSize: 11, textAlign: 'right' }}>REMAIN_QTY</TableCell>
                      <TableCell sx={{ bgcolor: '#dcfce7', fontWeight: 700, fontSize: 11, textAlign: 'right' }}>ACHV_RATE</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {EOP_ROWS.map((r, i) => (
                      <TableRow key={i} hover>
                        <TableCell sx={{ fontSize: 11, fontFamily: 'monospace' }}>{r.ITEM_CD}</TableCell>
                        <TableCell sx={{ fontSize: 11 }}>{r.ITEM_NM}</TableCell>
                        <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'center', color: '#ef4444' }}>{r.EOP_DT}</TableCell>
                        <TableCell sx={{ fontSize: 11 }}>{r.PROD_CNTRY}</TableCell>
                        <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right' }}>{r.EOP_PLAN_QTY.toLocaleString()}</TableCell>
                        <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right' }}>{r.ACT_PROD_QTY.toLocaleString()}</TableCell>
                        <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right', fontWeight: 600, color: r.REMAIN_QTY > 100000 ? '#ef4444' : '#374151' }}>{r.REMAIN_QTY.toLocaleString()}</TableCell>
                        <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right', fontWeight: 700, color: r.ACHV_RATE >= 90 ? '#10b981' : r.ACHV_RATE >= 70 ? '#f59e0b' : '#ef4444' }}>{r.ACHV_RATE.toFixed(1)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </>
              )}
              {tab === 2 && (
                <>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, fontFamily: 'monospace' }}>LV4_CD</TableCell>
                      <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11 }}>LV4_NM</TableCell>
                      <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, textAlign: 'right' }}>MIN_DAYS_BEFORE_RTS</TableCell>
                      <TableCell sx={{ bgcolor: '#fee2e2', fontWeight: 700, fontSize: 11, textAlign: 'right' }}>EOD_OFFSET</TableCell>
                      <TableCell sx={{ bgcolor: '#fee2e2', fontWeight: 700, fontSize: 11, textAlign: 'right' }}>EOP_OFFSET</TableCell>
                      <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, textAlign: 'center' }}>AUTO_TRANSITION</TableCell>
                      <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 11, textAlign: 'center' }}>USE_YN</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {LIFECYCLE_RULES.map((r, i) => (
                      <TableRow key={i} hover>
                        <TableCell sx={{ fontSize: 11, fontFamily: 'monospace' }}>{r.LV4_CD}</TableCell>
                        <TableCell sx={{ fontSize: 11 }}>{r.LV4_NM}</TableCell>
                        <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right' }}>{r.MIN_DAYS_BEFORE_RTS}일</TableCell>
                        <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right' }}>{r.EOD_DEFAULT_OFFSET}일</TableCell>
                        <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right' }}>{r.EOP_DEFAULT_OFFSET}일</TableCell>
                        <TableCell sx={{ fontSize: 11, textAlign: 'center', fontWeight: 600, color: r.AUTO_TRANSITION === 'Y' ? '#10b981' : '#9ca3af' }}>{r.AUTO_TRANSITION}</TableCell>
                        <TableCell sx={{ fontSize: 11, textAlign: 'center', fontWeight: 600, color: '#10b981' }}>{r.USE_YN}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </>
              )}
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </MockShell>
  );
}
