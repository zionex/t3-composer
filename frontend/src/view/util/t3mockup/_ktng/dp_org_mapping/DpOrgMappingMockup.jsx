import React from 'react';
import { Box, Stack, TextField, MenuItem, Button, Chip, Typography, Tabs, Tab, Paper,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import MockShell from '../../_shared/MockShell';
import { cellSx } from '../../_shared/styleCallback';

// DpKtng11 (영업조직-제품레벨), DpKtng12 (영업조직-담당자) 매핑

const PROD_MAP = [
  { SALES_ORG: '영업1팀', SALES_ORG_NM: '국내영업1팀', ITEM_LV1: 'TC',  ITEM_LV1_NM: '담배',  ITEM_LV2: 'KING-RED', ITEM_LV2_NM: '레드 시리즈', USE_YN: 'Y' },
  { SALES_ORG: '영업1팀', SALES_ORG_NM: '국내영업1팀', ITEM_LV1: 'TC',  ITEM_LV1_NM: '담배',  ITEM_LV2: 'KING-BLU', ITEM_LV2_NM: '블루 시리즈', USE_YN: 'Y' },
  { SALES_ORG: '영업2팀', SALES_ORG_NM: '국내영업2팀', ITEM_LV1: 'TC',  ITEM_LV1_NM: '담배',  ITEM_LV2: 'SLIM',     ITEM_LV2_NM: '슬림 시리즈', USE_YN: 'Y' },
  { SALES_ORG: '영업2팀', SALES_ORG_NM: '국내영업2팀', ITEM_LV1: 'NGP', ITEM_LV1_NM: 'NGP',   ITEM_LV2: 'NGP-DEV',  ITEM_LV2_NM: 'illuvia DEV', USE_YN: 'Y' },
  { SALES_ORG: 'NGP팀',   SALES_ORG_NM: 'NGP사업팀',   ITEM_LV1: 'NGP', ITEM_LV1_NM: 'NGP',   ITEM_LV2: 'NGP-DEV',  ITEM_LV2_NM: 'illuvia DEV', USE_YN: 'Y' },
  { SALES_ORG: 'NGP팀',   SALES_ORG_NM: 'NGP사업팀',   ITEM_LV1: 'NGP', ITEM_LV1_NM: 'NGP',   ITEM_LV2: 'NGP-STICK',ITEM_LV2_NM: 'illuvia 스틱',USE_YN: 'Y' },
  { SALES_ORG: '수출팀',  SALES_ORG_NM: '글로벌영업팀',ITEM_LV1: 'TC',  ITEM_LV1_NM: '담배',  ITEM_LV2: 'EXPORT-K', ITEM_LV2_NM: '수출 KING',   USE_YN: 'Y' },
];

const USER_MAP = [
  { SALES_ORG: '영업1팀', USER_ID: 'kim.smith',  USER_NM: '김민수', ROLE: '팀장',    USE_YN: 'Y' },
  { SALES_ORG: '영업1팀', USER_ID: 'lee.park',   USER_NM: '이정훈', ROLE: '담당자',  USE_YN: 'Y' },
  { SALES_ORG: '영업2팀', USER_ID: 'choi.young', USER_NM: '최영미', ROLE: '팀장',    USE_YN: 'Y' },
  { SALES_ORG: 'NGP팀',   USER_ID: 'jung.ngp',   USER_NM: '정재현', ROLE: '담당자',  USE_YN: 'Y' },
  { SALES_ORG: 'NGP팀',   USER_ID: 'song.ngp',   USER_NM: '송하늘', ROLE: '담당자',  USE_YN: 'Y' },
  { SALES_ORG: '수출팀',  USER_ID: 'park.global','USER_NM': '박글로벌', ROLE: '팀장', USE_YN: 'Y' },
];

export default function DpOrgMappingMockup() {
  return (
    <MockShell patternCode="ktng_dp_org_mapping" patternLabel="KTNG — 영업조직 매핑 (DpKtng11/12)"
      layoutCategory="LAYOUT_V2" description="영업조직-제품레벨 + 영업조직-담당자 매핑을 상하 2분할로 동시 관리.">
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <TextField label="SALES_ORG" size="small" select value="ALL" sx={{ width: 160 }}>
            <MenuItem value="ALL">전체</MenuItem><MenuItem value="국내영업1팀">국내영업1팀</MenuItem>
            <MenuItem value="국내영업2팀">국내영업2팀</MenuItem><MenuItem value="NGP사업팀">NGP사업팀</MenuItem>
          </TextField>
          <TextField label="ITEM_LV1" size="small" select value="ALL" sx={{ width: 130 }}>
            <MenuItem value="ALL">전체</MenuItem><MenuItem value="TC">담배</MenuItem><MenuItem value="NGP">NGP</MenuItem>
          </TextField>
          <TextField label="USE_YN" size="small" select value="Y" sx={{ width: 100 }}>
            <MenuItem value="">전체</MenuItem><MenuItem value="Y">Y</MenuItem><MenuItem value="N">N</MenuItem>
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
        </Stack>
      </Box>

      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5, flexGrow: 1, overflow: 'auto' }}>
        {/* 상단: 영업조직-제품레벨 */}
        <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 220 }}>
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>① 영업조직 ↔ 제품레벨 매핑 (DpKtng11)</Typography>
            <Chip size="small" label={`${PROD_MAP.length}건`} sx={{ ml: 1 }} />
            <Box sx={{ flexGrow: 1 }} />
            <Stack direction="row" spacing={0.75}>
              <Button size="small" startIcon={<AddIcon />}>추가</Button>
              <Button size="small" startIcon={<SaveIcon />} variant="contained">저장</Button>
            </Stack>
          </Box>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {['SALES_ORG','조직명','ITEM_LV1','LV1명','ITEM_LV2','LV2명','USE_YN'].map((c) => (
                    <TableCell key={c} sx={{ backgroundColor: 'grey.100', fontWeight: 700 }}>{c}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {PROD_MAP.map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{r.SALES_ORG}</TableCell>
                    <TableCell sx={cellSx('info')}>{r.SALES_ORG_NM}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}><Chip size="small" label={r.ITEM_LV1} variant="outlined" /></TableCell>
                    <TableCell>{r.ITEM_LV1_NM}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{r.ITEM_LV2}</TableCell>
                    <TableCell>{r.ITEM_LV2_NM}</TableCell>
                    <TableCell>{r.USE_YN === 'Y' ? <Chip size="small" label="Y" color="success" /> : <Chip size="small" label="N" />}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* 하단: 영업조직-담당자 */}
        <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 200 }}>
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>② 영업조직 ↔ 담당자 매핑 (DpKtng12)</Typography>
            <Chip size="small" label={`${USER_MAP.length}명`} sx={{ ml: 1 }} />
            <Box sx={{ flexGrow: 1 }} />
            <Stack direction="row" spacing={0.75}>
              <Button size="small" startIcon={<AddIcon />}>추가</Button>
              <Button size="small" startIcon={<DeleteOutlineIcon />} color="error">삭제</Button>
              <Button size="small" startIcon={<SaveIcon />} variant="contained">저장</Button>
            </Stack>
          </Box>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {['SALES_ORG','USER_ID','담당자명','역할','USE_YN'].map((c) => (
                    <TableCell key={c} sx={{ backgroundColor: 'grey.100', fontWeight: 700 }}>{c}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {USER_MAP.map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{r.SALES_ORG}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{r.USER_ID}</TableCell>
                    <TableCell sx={cellSx('info')}>{r.USER_NM}</TableCell>
                    <TableCell><Chip size="small" label={r.ROLE} color={r.ROLE === '팀장' ? 'primary' : 'default'} variant="outlined" /></TableCell>
                    <TableCell>{r.USE_YN === 'Y' ? <Chip size="small" label="Y" color="success" /> : <Chip size="small" label="N" />}</TableCell>
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
