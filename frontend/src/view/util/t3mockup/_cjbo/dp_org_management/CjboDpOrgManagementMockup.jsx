import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography, Paper, Chip,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import FolderIcon from '@mui/icons-material/Folder';
import GroupsIcon from '@mui/icons-material/Groups';
import MockShell from '../../_shared/MockShell';

// CJBO — 조직 매핑·변경 관리
// UI_DP_ORG_MAP (DpOrgMap), UI_DP_ORG_CHG (DpOrgChg), UI_DP_ENTRY_TP_ORG (DpEntryTpOrg)

const TREE = [
  { depth: 0, name: 'CJ Group',           type: 'group',  cnt: 152, expanded: true,  icon: FolderOpenIcon },
  { depth: 1, name: '국내영업본부',        type: 'div',    cnt:  85, expanded: true,  icon: FolderOpenIcon },
  { depth: 2, name: '영업1팀',             type: 'team',   cnt:  18, expanded: true,  icon: FolderOpenIcon, selected: true },
  { depth: 3, name: '영업1-1팀 (수도권)',  type: 'sub',    cnt:   9, expanded: false, icon: GroupsIcon },
  { depth: 3, name: '영업1-2팀 (지방)',    type: 'sub',    cnt:   9, expanded: false, icon: GroupsIcon },
  { depth: 2, name: '영업2팀',             type: 'team',   cnt:  22, expanded: false, icon: FolderIcon },
  { depth: 2, name: '영업3팀',             type: 'team',   cnt:  15, expanded: false, icon: FolderIcon },
  { depth: 2, name: 'NGP팀',               type: 'team',   cnt:  18, expanded: false, icon: FolderIcon },
  { depth: 1, name: '해외영업본부',        type: 'div',    cnt:  52, expanded: false, icon: FolderIcon },
  { depth: 1, name: 'SCM본부',             type: 'div',    cnt:  15, expanded: false, icon: FolderIcon },
];

const MEMBERS = [
  { EMP_NO: '20180042', EMP_NM: '김민수',   POSITION: '팀장',    JOIN_DT: '2018-03-01', SALES_AREA: '수도권', ITEMS: 32, STATUS: '정상' },
  { EMP_NO: '20190018', EMP_NM: '이정훈',   POSITION: '책임',    JOIN_DT: '2019-07-01', SALES_AREA: '수도권', ITEMS: 28, STATUS: '정상' },
  { EMP_NO: '20200105', EMP_NM: '박서연',   POSITION: '선임',    JOIN_DT: '2020-09-01', SALES_AREA: '경기북부', ITEMS: 24, STATUS: '정상' },
  { EMP_NO: '20210067', EMP_NM: '정재현',   POSITION: '선임',    JOIN_DT: '2021-03-01', SALES_AREA: '인천', ITEMS: 22, STATUS: '정상' },
  { EMP_NO: '20220034', EMP_NM: '송하늘',   POSITION: '주임',    JOIN_DT: '2022-01-01', SALES_AREA: '서울 강남', ITEMS: 18, STATUS: '정상' },
  { EMP_NO: '20230091', EMP_NM: '최가람',   POSITION: '사원',    JOIN_DT: '2023-09-01', SALES_AREA: '서울 강북', ITEMS: 12, STATUS: '신규' },
  { EMP_NO: '20240015', EMP_NM: '박글로벌', POSITION: '사원',    JOIN_DT: '2024-03-01', SALES_AREA: '경기남부', ITEMS:  8, STATUS: '신규' },
];

export default function CjboDpOrgManagementMockup() {
  return (
    <MockShell patternCode="cjbo_dp_org_management" patternLabel="CJBO — 조직 매핑·변경·TP 조직 (DpOrgMap/Chg/TpOrg)"
      layoutCategory="LAYOUT_H2"
      description="좌측 조직 트리 (본부→팀→하위팀) + 우측 팀원·담당 영역·품목 매핑. UI_DP_ORG_MAP, UI_DP_ORG_CHG, UI_DP_ENTRY_TP_ORG.">
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <TextField label="조직 검색" size="small" value="" placeholder="조직명 또는 담당자명" sx={{ width: 240 }} />
          <TextField label="유효일" size="small" value="2026-06-04" sx={{ width: 160 }} />
          <TextField label="상태" size="small" select value="ALL" sx={{ width: 130 }}>
            <MenuItem value="ALL">전체</MenuItem><MenuItem value="ACTIVE">활성</MenuItem><MenuItem value="CHG">변경 예정</MenuItem>
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
          <Button variant="contained" size="small" color="success" startIcon={<SaveIcon />}>변경 저장</Button>
        </Stack>
      </Box>

      <Box sx={{ p: 1.5, display: 'flex', gap: 1.5, flexGrow: 1, overflow: 'hidden' }}>
        <Paper variant="outlined" sx={{ width: 320, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>조직 트리</Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Button size="small" startIcon={<AddIcon />} variant="outlined">팀 추가</Button>
          </Box>
          <Box sx={{ flex: 1, overflow: 'auto', p: 0.5 }}>
            {TREE.map((n, i) => {
              const Icon = n.icon;
              const color = n.type === 'group' ? '#0277bd' : n.type === 'div' ? '#1565c0' : n.type === 'team' ? '#6a1b9a' : '#616161';
              return (
                <Box key={i} sx={{
                  display: 'flex', alignItems: 'center', gap: 0.75, py: 0.5, px: 0.5,
                  pl: 0.5 + n.depth * 1.5, borderRadius: 1, cursor: 'pointer',
                  backgroundColor: n.selected ? '#e3f2fd' : 'transparent',
                  '&:hover': { backgroundColor: '#f5f5f5' },
                }}>
                  <Icon sx={{ fontSize: 16, color }} />
                  <Typography variant="body2" sx={{ fontWeight: n.selected ? 700 : 500, flex: 1 }}>{n.name}</Typography>
                  <Chip size="small" label={n.cnt} variant="outlined" sx={{ height: 18, fontSize: 10 }} />
                </Box>
              );
            })}
          </Box>
        </Paper>

        <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>국내영업본부 / 영업1팀 — 팀원 {MEMBERS.length}명</Typography>
            <Chip size="small" label="변경 검토 중" color="warning" />
            <Box sx={{ flexGrow: 1 }} />
            <Button size="small" startIcon={<AddIcon />} variant="outlined">인원 추가</Button>
          </Box>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {['사번','성명','직급','입사일','담당 영역','담당 품목수','상태'].map((c) => (
                    <TableCell key={c} sx={{ backgroundColor: 'grey.100', fontWeight: 700,
                      textAlign: ['입사일','담당 품목수','상태','직급'].includes(c) ? 'center' : 'left' }}>{c}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {MEMBERS.map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{r.EMP_NO}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{r.EMP_NM}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Chip size="small" label={r.POSITION} variant="outlined"
                        color={r.POSITION === '팀장' ? 'primary' : r.POSITION === '책임' ? 'info' : 'default'} />
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 12 }}>{r.JOIN_DT}</TableCell>
                    <TableCell>{r.SALES_AREA}</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontFamily: 'monospace' }}>{r.ITEMS}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Chip size="small" label={r.STATUS} color={r.STATUS === '신규' ? 'success' : 'default'} variant={r.STATUS === '신규' ? 'filled' : 'outlined'} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </MockShell>
  );
}
