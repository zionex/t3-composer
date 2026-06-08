import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Typography, Paper, Chip, ButtonGroup, IconButton,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Checkbox,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import MockShell from '../../_shared/MockShell';

// ORON — DP 마스터/검토
// 대표 화면: UI_DP_ORN_USER_DP_ACC_MAP "판매계획 입력 담당자 관리"
//   소스: demandplan/master/useritemaccountmap/UserItemAccountMap.jsx (489 lines)
//   SearchArea: USER, AUTH_TP_NM, ACTV_YN(ALL/Y/N), ITEM, ACCOUNT
//   ButtonArea (Right): GridAddRow / GridDeleteRow / GridSave (모두 type=icon)
//   Grid columns (visible): USER_ID, AUTH_TP_ID, ITEM_CD(action btn), ITEM_NM, UOM_NM,
//                           ACCOUNT_CD(action btn), ACCOUNT_NM, ACTV_YN(editable boolean),
//                           CREATE_BY/DTTM, MODIFY_BY/DTTM
//
// 같이 묶인 메뉴 (mockup 본문은 대표 1개만 표시):
//   - UI_DP_ORN_SHPP_PRICE              출고가
//   - UI_DP_ORN_STRAT_BRAND_MGMT        전략브랜드 관리
//   - UI_DP_ORN_DMND_ACC_ITEM_MAP_PFRSTLT 거래처-품목-Mapping 실적 조회
//   - UI_DP_ORN_DP_ENTRY_SUMMARY        판매계획 검토
//   - UI_DP_ORN_SALES_PLAN_REPORT_01    판매계획 적중률

const GRID_HEADERS = [
  { name: 'USER_ID',     width: 110, align: 'center' },
  { name: 'AUTH_TP_ID',  width: 110, align: 'center' },
  { name: 'ITEM_CD',     width: 130, align: 'center', actionBtn: true },
  { name: 'ITEM_NM',     width: 200, align: 'left' },
  { name: 'UOM_NM',      width: 70,  align: 'center' },
  { name: 'ACCOUNT_CD',  width: 110, align: 'center', actionBtn: true },
  { name: 'ACCOUNT_NM',  width: 150, align: 'left' },
  { name: 'ACTV_YN',     width: 70,  align: 'center', editable: true },
  { name: 'CREATE_BY',   width: 90,  align: 'center' },
  { name: 'CREATE_DTTM', width: 150, align: 'center' },
  { name: 'MODIFY_BY',   width: 90,  align: 'center' },
  { name: 'MODIFY_DTTM', width: 150, align: 'center' },
];

const ROWS = [
  { USER_ID: 'kim.youngsu', AUTH_TP_ID: 'DP', ITEM_CD: 'ORN-MK-001', ITEM_NM: '오론 비건마스크 5매',   UOM_NM: 'EA', ACCOUNT_CD: 'ACC-ON-01', ACCOUNT_NM: '온라인 채널',   ACTV_YN: true,  CREATE_BY: 'admin',       CREATE_DTTM: '2026-01-15 10:22', MODIFY_BY: 'kim.youngsu', MODIFY_DTTM: '2026-05-30 14:11' },
  { USER_ID: 'kim.youngsu', AUTH_TP_ID: 'DP', ITEM_CD: 'ORN-MK-002', ITEM_NM: '오론 비건마스크 10매',  UOM_NM: 'EA', ACCOUNT_CD: 'ACC-ON-01', ACCOUNT_NM: '온라인 채널',   ACTV_YN: true,  CREATE_BY: 'admin',       CREATE_DTTM: '2026-01-15 10:24', MODIFY_BY: 'kim.youngsu', MODIFY_DTTM: '2026-05-30 14:12' },
  { USER_ID: 'lee.jihoon',  AUTH_TP_ID: 'DP', ITEM_CD: 'ORN-SR-101', ITEM_NM: '오론 세럼 30ml',         UOM_NM: 'EA', ACCOUNT_CD: 'ACC-OFF-01', ACCOUNT_NM: '오프라인 채널', ACTV_YN: true,  CREATE_BY: 'admin',       CREATE_DTTM: '2026-02-01 09:11', MODIFY_BY: 'lee.jihoon',  MODIFY_DTTM: '2026-05-28 16:50' },
  { USER_ID: 'lee.jihoon',  AUTH_TP_ID: 'DP', ITEM_CD: 'ORN-SR-102', ITEM_NM: '오론 세럼 50ml',         UOM_NM: 'EA', ACCOUNT_CD: 'ACC-OFF-01', ACCOUNT_NM: '오프라인 채널', ACTV_YN: false, CREATE_BY: 'admin',       CREATE_DTTM: '2026-02-01 09:13', MODIFY_BY: 'lee.jihoon',  MODIFY_DTTM: '2026-04-15 11:22' },
  { USER_ID: 'park.sumin',  AUTH_TP_ID: 'DP', ITEM_CD: 'OEM-SUN-50', ITEM_NM: 'OEM 선크림 SPF50+',     UOM_NM: 'EA', ACCOUNT_CD: 'ACC-OEM-A',  ACCOUNT_NM: 'OEM CLIENT-A',  ACTV_YN: true,  CREATE_BY: 'park.sumin', CREATE_DTTM: '2026-03-10 13:45', MODIFY_BY: 'park.sumin', MODIFY_DTTM: '2026-06-01 09:30' },
];

export default function OronDpMasterReviewMockup() {
  return (
    <MockShell
      patternCode="oron_dp_master_review"
      patternLabel="ORON — DP 마스터/검토 (담당자/출고가/전략브랜드/매핑/검토/적중률)"
      layoutCategory="LAYOUT_SINGLE"
      description="대표 화면 = 판매계획 입력 담당자 관리 (UI_DP_ORN_USER_DP_ACC_MAP). 표준 마스터 CRUD — SearchArea (USER/AUTH_TP_NM/ACTV_YN/ITEM/ACCOUNT) + 우측 ButtonArea (Add/Delete/Save icon) + 단일 그리드 + GridCnt. 같이 묶인 메뉴 5개 (출고가/전략브랜드/매핑실적/검토/적중률) 도 같은 마스터 CRUD 패턴."
    >
      {/* SearchArea */}
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="USER" size="small" value="kim.youngsu (김영수)" sx={{ width: 220 }}
            InputProps={{ startAdornment: <PersonIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} /> }} />
          <TextField label="AUTH_TP_NM" size="small" select value="DP" sx={{ width: 140 }}>
            <MenuItem value="DP">DP (수요계획)</MenuItem>
          </TextField>
          <TextField label="ACTV_YN" size="small" select value="ALL" sx={{ width: 110 }}>
            <MenuItem value="ALL">ALL</MenuItem>
            <MenuItem value="Y">Y</MenuItem>
            <MenuItem value="N">N</MenuItem>
          </TextField>
          <TextField label="ITEM" size="small" value="" sx={{ width: 200 }}
            placeholder="(level + attr + name)"
            InputProps={{ endAdornment: <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} /> }} />
          <TextField label="ACCOUNT" size="small" value="" sx={{ width: 200 }}
            placeholder="(level + attr + name)"
            InputProps={{ endAdornment: <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} /> }} />
        </Stack>
      </Box>

      {/* ButtonArea (Right) + Grid + GridCnt */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <Box sx={{ px: 1.5, py: 0.7, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'flex-end' }}>
          <ButtonGroup variant="outlined" size="small">
            <IconButton size="small" title="GridAddRowButton"><AddIcon fontSize="small" /></IconButton>
            <IconButton size="small" title="GridDeleteRowButton"><DeleteIcon fontSize="small" /></IconButton>
            <IconButton size="small" title="GridSaveButton" color="primary"><SaveIcon fontSize="small" /></IconButton>
          </ButtonGroup>
        </Box>

        <Box sx={{ p: 1.5, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <Paper variant="outlined" sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <TableContainer sx={{ flex: 1 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {GRID_HEADERS.map((c) => (
                      <TableCell key={c.name} sx={{ bgcolor: 'grey.100', fontWeight: 700, width: c.width, textAlign: c.align, fontSize: 12, fontFamily: c.name.endsWith('_CD') || c.name.endsWith('_ID') ? 'monospace' : 'inherit' }}>{c.name}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ROWS.map((r, i) => (
                    <TableRow key={i} hover>
                      {GRID_HEADERS.map((c) => {
                        const v = r[c.name];
                        if (c.name === 'ACTV_YN') {
                          return (
                            <TableCell key={c.name} sx={{ textAlign: 'center' }}>
                              <Checkbox size="small" checked={v} disabled sx={{ p: 0.25 }} />
                            </TableCell>
                          );
                        }
                        return (
                          <TableCell key={c.name} sx={{ fontSize: 12, textAlign: c.align, fontFamily: c.name.endsWith('_CD') || c.name.endsWith('_ID') || c.name.endsWith('DTTM') ? 'monospace' : 'inherit' }}>
                            {v}
                            {c.actionBtn && (
                              <IconButton size="small" sx={{ ml: 0.3, p: 0.2 }} title="popup">
                                <SearchIcon sx={{ fontSize: 12 }} />
                              </IconButton>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ borderTop: '1px solid', borderColor: 'divider', px: 1.5, py: 0.5, bgcolor: 'grey.50' }}>
              <Typography sx={{ fontSize: 11, fontFamily: 'monospace', color: 'text.secondary' }}>
                GridCnt grid="grid1" — {ROWS.length} CASES MSG_0010
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Box>
    </MockShell>
  );
}
