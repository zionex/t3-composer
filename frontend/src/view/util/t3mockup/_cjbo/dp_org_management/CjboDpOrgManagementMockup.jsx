import React, { useState } from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography, Paper, Chip, Checkbox, ToggleButton, ToggleButtonGroup,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import MockShell from '../../_shared/MockShell';

// CJBO — 조직 관리 3종
// 소스 기반 재작성 (3개 완전 다른 화면, 사용자가 선택)
// path: view/demandplan/service/{dporgmap,dporgchg,dpentrytporg}/*.jsx
//
//  • DpOrgMap   — UI_DP_ORG_MAP        매핑 마스터 + 17 popups + ATTR_01~20 (20+ 컬럼)
//  • DpOrgChg   — UI_DP_ORG_CHG        간단한 PRE/CUR level CD-NM 4컬럼 변경 이력
//  • DpEntryTpOrg — UI_DP_ENTRY_TP_ORG TreeGrid 계층 (SearchArea 없음, addChildRow)

// ────────────── DpOrgMap rows (ATTR_01~20 attribute popups) ──────────────
const ORGMAP_ROWS = [
  { LEVEL1_CD: 'KR',     LEVEL1_NM: '한국',     LEVEL2_CD: 'D',  LEVEL2_NM: '내수',  LEVEL3_CD: 'PLT-KR1',  LEVEL3_NM: '한국 사업장',          APS_LEVEL_CD: 'L1',  APS_LEVEL_NM: 'Level 1', ACTV_YN: true,  ATTR_01: 'Y', ATTR_02: 'AN',  ATTR_03: 'BMS',  ATTR_04: 'GSO-001', ATTR_05: 'KRW' },
  { LEVEL1_CD: 'VN',     LEVEL1_NM: '베트남',   LEVEL2_CD: 'E',  LEVEL2_NM: '수출',  LEVEL3_CD: 'PLT-VN1',  LEVEL3_NM: 'Bio-VN 사업장',         APS_LEVEL_CD: 'L1',  APS_LEVEL_NM: 'Level 1', ACTV_YN: true,  ATTR_01: 'Y', ATTR_02: 'AN',  ATTR_03: 'BMS',  ATTR_04: 'GSO-002', ATTR_05: 'USD' },
  { LEVEL1_CD: 'ID',     LEVEL1_NM: '인도네시아',LEVEL2_CD: 'E', LEVEL2_NM: '수출',  LEVEL3_CD: 'PLT-ID1',  LEVEL3_NM: 'Bio-ID 사업장',         APS_LEVEL_CD: 'L1',  APS_LEVEL_NM: 'Level 1', ACTV_YN: true,  ATTR_01: 'Y', ATTR_02: 'AN',  ATTR_03: '-',    ATTR_04: 'GSO-003', ATTR_05: 'USD' },
  { LEVEL1_CD: 'US',     LEVEL1_NM: '미국',     LEVEL2_CD: 'E',  LEVEL2_NM: '수출',  LEVEL3_CD: 'PLT-US1',  LEVEL3_NM: 'CJ-US 영업법인',        APS_LEVEL_CD: 'L2',  APS_LEVEL_NM: 'Level 2', ACTV_YN: true,  ATTR_01: 'Y', ATTR_02: 'AN',  ATTR_03: 'BMS',  ATTR_04: 'GSO-004', ATTR_05: 'USD' },
  { LEVEL1_CD: 'BR',     LEVEL1_NM: '브라질',   LEVEL2_CD: 'E',  LEVEL2_NM: '수출',  LEVEL3_CD: 'PLT-BR1',  LEVEL3_NM: 'CJ-BR 영업법인',        APS_LEVEL_CD: 'L2',  APS_LEVEL_NM: 'Level 2', ACTV_YN: true,  ATTR_01: 'Y', ATTR_02: 'AN',  ATTR_03: '-',    ATTR_04: 'GSO-005', ATTR_05: 'USD' },
  { LEVEL1_CD: 'CN',     LEVEL1_NM: '중국',     LEVEL2_CD: 'E',  LEVEL2_NM: '수출',  LEVEL3_CD: 'PLT-CN1',  LEVEL3_NM: '중국 영업법인',         APS_LEVEL_CD: 'L2',  APS_LEVEL_NM: 'Level 2', ACTV_YN: false, ATTR_01: 'N', ATTR_02: '-',   ATTR_03: '-',    ATTR_04: '-',       ATTR_05: 'CNY' },
];

// ────────────── DpOrgChg rows (간단 PRE/CUR 변경) ──────────────
const ORGCHG_ROWS = [
  { PRE_LEVEL_CD: 'KR-1', PRE_LEVEL_NM: '한국 영업1팀',     CUR_LEVEL_CD: 'KR-A',  CUR_LEVEL_NM: '한국 AN본부',       REMARKS: '2026 조직개편: AN/BMS 사업부 통합', ACTV_YN: true  },
  { PRE_LEVEL_CD: 'KR-2', PRE_LEVEL_NM: '한국 영업2팀',     CUR_LEVEL_CD: 'KR-B',  CUR_LEVEL_NM: '한국 BMS본부',      REMARKS: '2026 조직개편',                  ACTV_YN: true  },
  { PRE_LEVEL_CD: 'VN-1', PRE_LEVEL_NM: '베트남 영업팀',    CUR_LEVEL_CD: 'VN-A',  CUR_LEVEL_NM: '베트남 AN해외영업',  REMARKS: '해외법인 직속 이관',              ACTV_YN: true  },
  { PRE_LEVEL_CD: 'OLD',  PRE_LEVEL_NM: '구 글로벌 운영팀', CUR_LEVEL_CD: 'NEW-G', CUR_LEVEL_NM: 'Global Operations', REMARKS: '글로벌 통합 (영문 명칭)',         ACTV_YN: false },
];

// ────────────── DpEntryTpOrg TreeGrid 노드 (계층) ──────────────
const TPORG_NODES = [
  { depth: 0, SALES_ORG_CD: 'ROOT',    SALES_ORG_NM: 'CJ Bio Global',       SALES_ORG_SEQ:  1, CJ_ID: '',          CJ_NAME: '',         ACTV_YN: true, LAST_ORG_YN: false, expanded: true },
  { depth: 1, SALES_ORG_CD: 'AN',      SALES_ORG_NM: 'Animal Nutrition',    SALES_ORG_SEQ:  1, CJ_ID: 'an_head',   CJ_NAME: '본부장A',  ACTV_YN: true, LAST_ORG_YN: false, expanded: true },
  { depth: 2, SALES_ORG_CD: 'AN-KR',   SALES_ORG_NM: 'AN 한국',             SALES_ORG_SEQ:  1, CJ_ID: 'an_kr',     CJ_NAME: '팀장A1',   ACTV_YN: true, LAST_ORG_YN: false, expanded: true },
  { depth: 3, SALES_ORG_CD: 'AN-KR-D', SALES_ORG_NM: 'AN 한국 내수담당',    SALES_ORG_SEQ:  1, CJ_ID: 'an_kr_d',   CJ_NAME: '담당자A',  ACTV_YN: true, LAST_ORG_YN: true,  expanded: false },
  { depth: 3, SALES_ORG_CD: 'AN-KR-E', SALES_ORG_NM: 'AN 한국 수출담당',    SALES_ORG_SEQ:  2, CJ_ID: 'an_kr_e',   CJ_NAME: '담당자B',  ACTV_YN: true, LAST_ORG_YN: true,  expanded: false },
  { depth: 2, SALES_ORG_CD: 'AN-VN',   SALES_ORG_NM: 'AN 베트남',           SALES_ORG_SEQ:  2, CJ_ID: 'an_vn',     CJ_NAME: '팀장A2',   ACTV_YN: true, LAST_ORG_YN: false, expanded: true },
  { depth: 3, SALES_ORG_CD: 'AN-VN-E', SALES_ORG_NM: 'AN 베트남 영업',      SALES_ORG_SEQ:  1, CJ_ID: 'an_vn_e',   CJ_NAME: '담당자C',  ACTV_YN: true, LAST_ORG_YN: true,  expanded: false },
  { depth: 2, SALES_ORG_CD: 'AN-US',   SALES_ORG_NM: 'AN 미국',             SALES_ORG_SEQ:  3, CJ_ID: 'an_us',     CJ_NAME: '팀장A3',   ACTV_YN: true, LAST_ORG_YN: true,  expanded: false },
  { depth: 1, SALES_ORG_CD: 'TN',      SALES_ORG_NM: 'Total Nutrition',     SALES_ORG_SEQ:  2, CJ_ID: 'tn_head',   CJ_NAME: '본부장B',  ACTV_YN: true, LAST_ORG_YN: false, expanded: false },
  { depth: 1, SALES_ORG_CD: 'BMS',     SALES_ORG_NM: 'Bio Material Solution',SALES_ORG_SEQ: 3, CJ_ID: 'bms_head',  CJ_NAME: '본부장C',  ACTV_YN: true, LAST_ORG_YN: false, expanded: false },
];

export default function CjboDpOrgManagementMockup() {
  const [view, setView] = useState('MAP');

  return (
    <MockShell patternCode="cjbo_dp_org_management"
      patternLabel="CJBO — 조직 관리 3종 (DpOrgMap / DpOrgChg / DpEntryTpOrg)"
      layoutCategory="LAYOUT_SINGLE"
      description="UI_DP_ORG_MAP (매핑+17 popups+ATTR_01~20) · UI_DP_ORG_CHG (PRE/CUR 변경) · UI_DP_ENTRY_TP_ORG (TreeGrid 계층). 3개 완전 다른 화면. POST demandplan/dporg{map,chg}/q1,s1,d1 · engine/dp/SRV_GET_SP_UI_DP_ENTRY_TP_ORG_Q1.">
      {/* View selector */}
      <Box sx={{ px: 1.5, py: 1, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: '#fffde7', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="caption" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>3개 화면 (사용자가 선택해서 미리보기):</Typography>
        <ToggleButtonGroup value={view} exclusive onChange={(_, v) => v && setView(v)} size="small">
          <ToggleButton value="MAP">UI_DP_ORG_MAP (조직-법인 매핑)</ToggleButton>
          <ToggleButton value="CHG">UI_DP_ORG_CHG (조직 변경 이력)</ToggleButton>
          <ToggleButton value="TPORG">UI_DP_ENTRY_TP_ORG (TreeGrid)</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* ──── DpOrgMap ──── */}
      {view === 'MAP' && (
        <>
          <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
              <TextField label="ACTV_YN (select)" size="small" select value="ALL" sx={{ width: 130 }}>
                <MenuItem value="ALL">전체</MenuItem><MenuItem value="Y">Y</MenuItem><MenuItem value="N">N</MenuItem>
              </TextField>
              <TextField label="SALES_AREA_CD (multi)" size="small" select value="ALL" sx={{ width: 170 }}>
                <MenuItem value="ALL">전체</MenuItem>
              </TextField>
              <TextField label="UI_DP_ORG_MAP_APS_LEVEL_CD" size="small" select value="ALL" sx={{ width: 200 }}>
                <MenuItem value="ALL">전체</MenuItem>
                <MenuItem value="L1">L1</MenuItem><MenuItem value="L2">L2</MenuItem>
              </TextField>
              <Box sx={{ flexGrow: 1 }} />
              <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
              <Button variant="outlined" size="small" startIcon={<RefreshIcon />}>새로고침</Button>
            </Stack>
          </Box>
          <Box sx={{ px: 1.5, py: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button size="small" startIcon={<FileDownloadIcon />} variant="outlined">엑셀 다운로드</Button>
            <Box sx={{ flexGrow: 1 }} />
            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>17 PopCommCode siblings: DP_SALES_AREA · CB_DP_TRADE_TYPE · DP_LOCAT_CD ×5 · DP_ORG_LEVEL · DP_GSO · DP_CURRENCY · DP_COUNTRY · DP_BIG_AREA_CD · DP_SALESMAN ×5</Typography>
            <Button size="small" startIcon={<AddIcon />} variant="outlined">행 추가</Button>
            <Button size="small" startIcon={<SaveIcon />} variant="contained">저장</Button>
          </Box>
          <Box sx={{ p: 1.5, flex: 1, overflow: 'hidden' }}>
            <Paper variant="outlined" sx={{ height: '100%' }}>
              <TableContainer sx={{ height: '100%' }}>
                <Table size="small" stickyHeader sx={{ '& th, & td': { whiteSpace: 'nowrap', fontSize: 11, py: 0.5 } }}>
                  <TableHead>
                    <TableRow>
                      {['LEVEL1_CD','LEVEL1_NM','LEVEL2_CD','LEVEL2_NM','LEVEL3_CD','LEVEL3_NM','APS_LEVEL_CD','APS_LEVEL_NM','ACTV_YN','ATTR_01','ATTR_02','ATTR_03','ATTR_04','ATTR_05','...(ATTR_06~20)'].map((c) => (
                        <TableCell key={c} sx={{ backgroundColor: 'grey.100', fontWeight: 700,
                          textAlign: c === 'ACTV_YN' || c.startsWith('ATTR') ? 'center' : 'left' }}>{c}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ORGMAP_ROWS.map((r, i) => (
                      <TableRow key={i} hover>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{r.LEVEL1_CD}</TableCell>
                        <TableCell>{r.LEVEL1_NM}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{r.LEVEL2_CD}</TableCell>
                        <TableCell>{r.LEVEL2_NM}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{r.LEVEL3_CD}</TableCell>
                        <TableCell>{r.LEVEL3_NM}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{r.APS_LEVEL_CD}</TableCell>
                        <TableCell>{r.APS_LEVEL_NM}</TableCell>
                        <TableCell sx={{ textAlign: 'center' }}><Checkbox size="small" checked={r.ACTV_YN} disabled sx={{ p: 0 }} /></TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>{r.ATTR_01}</TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>{r.ATTR_02}</TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>{r.ATTR_03}</TableCell>
                        <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 10 }}>{r.ATTR_04}</TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>{r.ATTR_05}</TableCell>
                        <TableCell sx={{ color: 'text.disabled', fontSize: 10 }}>...</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>
        </>
      )}

      {/* ──── DpOrgChg ──── */}
      {view === 'CHG' && (
        <>
          <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <TextField label="BASE_DT (select)" size="small" select value="2026-06-04" sx={{ width: 170 }}>
                <MenuItem value="2026-06-04">2026-06-04</MenuItem>
                <MenuItem value="2026-01-01">2026-01-01</MenuItem>
              </TextField>
              <Box sx={{ flexGrow: 1 }} />
              <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
              <Button variant="outlined" size="small" startIcon={<RefreshIcon />}>새로고침</Button>
            </Stack>
          </Box>
          <Box sx={{ px: 1.5, py: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button size="small" startIcon={<FileDownloadIcon />} variant="outlined">엑셀 다운로드</Button>
            <Box sx={{ flexGrow: 1 }} />
            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>btnVisibleYn 조건부 버튼</Typography>
            <Button size="small" startIcon={<AddIcon />} variant="outlined">행 추가</Button>
            <Button size="small" startIcon={<DeleteIcon />} variant="outlined" color="error">행 삭제</Button>
            <Button size="small" startIcon={<SaveIcon />} variant="contained">저장</Button>
          </Box>
          <Box sx={{ p: 1.5, flex: 1, overflow: 'hidden' }}>
            <Paper variant="outlined" sx={{ height: '100%' }}>
              <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>BaseGrid id=&quot;gridDpOrgChg&quot; — 4 visible cols + ACTV_YN + audit</Typography>
              </Box>
              <TableContainer sx={{ flex: 1 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      {['PRE_LEVEL_CD','PRE_LEVEL_NM (lookupDisplay)','CUR_LEVEL_CD','CUR_LEVEL_NM (lookupDisplay)','REMARKS','ACTV_YN','CREATE_BY','CREATE_DTTM','MODIFY_BY','MODIFY_DTTM'].map((c) => (
                        <TableCell key={c} sx={{ backgroundColor: 'grey.100', fontWeight: 700, fontSize: 11, py: 0.5,
                          textAlign: c === 'ACTV_YN' ? 'center' : 'left' }}>{c}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ORGCHG_ROWS.map((r, i) => (
                      <TableRow key={i} hover>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{r.PRE_LEVEL_CD}</TableCell>
                        <TableCell>{r.PRE_LEVEL_NM}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600, color: 'success.main' }}>{r.CUR_LEVEL_CD}</TableCell>
                        <TableCell sx={{ color: 'success.main', fontWeight: 600 }}>{r.CUR_LEVEL_NM}</TableCell>
                        <TableCell>{r.REMARKS}</TableCell>
                        <TableCell sx={{ textAlign: 'center' }}><Checkbox size="small" checked={r.ACTV_YN} disabled sx={{ p: 0 }} /></TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: 11, color: 'text.secondary' }}>admin</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: 11, color: 'text.secondary' }}>2026-05-30 14:20</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: 11, color: 'text.secondary' }}>admin</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: 11, color: 'text.secondary' }}>2026-06-01 09:15</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>
        </>
      )}

      {/* ──── DpEntryTpOrg — TreeGrid ──── */}
      {view === 'TPORG' && (
        <>
          {/* No SearchArea per source */}
          <Box sx={{ px: 1.5, py: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>SearchArea 없음 / engine/dp/SRV_GET_SP_UI_DP_ENTRY_TP_ORG_Q1</Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Button size="small" startIcon={<AddCircleIcon />} variant="outlined" disabled>Add Child Row (셀 클릭 시)</Button>
            <Button size="small" startIcon={<DeleteIcon />} variant="outlined" color="error">행 삭제</Button>
            <Button size="small" startIcon={<SaveIcon />} variant="contained">저장</Button>
          </Box>
          <Box sx={{ p: 1.5, flex: 1, overflow: 'hidden' }}>
            <Paper variant="outlined" sx={{ height: '100%' }}>
              <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccountTreeIcon fontSize="small" color="primary" />
                <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>TreeGrid id=&quot;gridDpEntryTpOrg&quot; — 영업조직 계층 (TidyTreeUtil 다이어그램)</Typography>
              </Box>
              <TableContainer sx={{ flex: 1 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      {['SALES_ORG_CD','SALES_ORG_NM','SALES_ORG_SEQ','CJ_ID (PopSelectUser)','CJ_NAME','ACTV_YN','LAST_ORG_YN'].map((c) => (
                        <TableCell key={c} sx={{ backgroundColor: 'grey.100', fontWeight: 700, fontSize: 11, py: 0.5,
                          textAlign: ['ACTV_YN','LAST_ORG_YN','SALES_ORG_SEQ'].includes(c) ? 'center' : 'left' }}>{c}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {TPORG_NODES.map((n, i) => (
                      <TableRow key={i} hover sx={{ backgroundColor: n.depth === 0 ? '#e3f2fd' : n.depth === 1 ? '#f3e5f5' : undefined }}>
                        <TableCell sx={{ fontFamily: 'monospace', pl: 1.5 + n.depth * 2 }}>
                          {n.depth > 0 && <span style={{ color: '#999', marginRight: 4 }}>{n.expanded ? '▾' : '▸'}</span>}
                          {n.SALES_ORG_CD}
                        </TableCell>
                        <TableCell sx={{ fontWeight: n.depth <= 1 ? 700 : undefined, pl: n.depth * 2 }}>{n.SALES_ORG_NM}</TableCell>
                        <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace' }}>{n.SALES_ORG_SEQ}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: 11 }}>{n.CJ_ID || '-'}</TableCell>
                        <TableCell>{n.CJ_NAME || '-'}</TableCell>
                        <TableCell sx={{ textAlign: 'center' }}><Checkbox size="small" checked={n.ACTV_YN} disabled sx={{ p: 0 }} /></TableCell>
                        <TableCell sx={{ textAlign: 'center' }}><Checkbox size="small" checked={n.LAST_ORG_YN} disabled sx={{ p: 0 }} /></TableCell>
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
