import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Typography, Paper, Chip, Tabs, Tab, Button, ButtonGroup, IconButton, Checkbox,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import DownloadIcon from '@mui/icons-material/Download';
import MockShell from '../../_shared/MockShell';

// KTNG — DP 영업조직 매핑
//  Tab 1: UI_DP_KTNG_11 영업조직-제품레벨 매핑 → DpKtng11.jsx
//  Tab 2: UI_DP_KTNG_12 영업조직-담당자 매핑   → DpKtng12.jsx

const ORG_ITEM_ROWS = [
  { SALES_ORG_CD: 'SO-KR-CVS', SALES_ORG_NM: '국내영업본부 - 편의점',  ITEM_LV1: '담배',  ITEM_LV3: '에쎄', ITEM_LV4: '스페셜 골드',  USE_YN: true,  CREATE_BY: 'admin' },
  { SALES_ORG_CD: 'SO-KR-CVS', SALES_ORG_NM: '국내영업본부 - 편의점',  ITEM_LV1: '담배',  ITEM_LV3: '에쎄', ITEM_LV4: '라이트',       USE_YN: true,  CREATE_BY: 'admin' },
  { SALES_ORG_CD: 'SO-KR-SUP', SALES_ORG_NM: '국내영업본부 - 슈퍼',    ITEM_LV1: '담배',  ITEM_LV3: '디스', ITEM_LV4: '플러스',       USE_YN: true,  CREATE_BY: 'admin' },
  { SALES_ORG_CD: 'SO-KR-SUP', SALES_ORG_NM: '국내영업본부 - 슈퍼',    ITEM_LV1: '담배',  ITEM_LV3: '더원', ITEM_LV4: '오렌지',       USE_YN: true,  CREATE_BY: 'admin' },
  { SALES_ORG_CD: 'SO-EXP-ASIA', SALES_ORG_NM: '수출본부 - 아시아',     ITEM_LV1: 'CIGAR', ITEM_LV3: 'ESSE', ITEM_LV4: 'Asian',        USE_YN: true,  CREATE_BY: 'kim.youngsu' },
  { SALES_ORG_CD: 'SO-EXP-CIS',  SALES_ORG_NM: '수출본부 - CIS',        ITEM_LV1: 'CIGAR', ITEM_LV3: 'TIME', ITEM_LV4: 'Original',     USE_YN: true,  CREATE_BY: 'kim.youngsu' },
];

const ORG_USER_ROWS = [
  { SALES_ORG_CD: 'SO-KR-CVS',   SALES_ORG_NM: '국내영업본부 - 편의점', USER_ID: 'kim.youngsu', USER_NM: '김영수', ROLE: '담당자',     ACTV_YN: true,  ASSIGN_DT: '2026-01-15' },
  { SALES_ORG_CD: 'SO-KR-CVS',   SALES_ORG_NM: '국내영업본부 - 편의점', USER_ID: 'lee.jihoon',  USER_NM: '이지훈', ROLE: '부담당자',   ACTV_YN: true,  ASSIGN_DT: '2026-02-01' },
  { SALES_ORG_CD: 'SO-KR-SUP',   SALES_ORG_NM: '국내영업본부 - 슈퍼',   USER_ID: 'park.sumin',  USER_NM: '박수민', ROLE: '담당자',     ACTV_YN: true,  ASSIGN_DT: '2026-01-20' },
  { SALES_ORG_CD: 'SO-EXP-ASIA', SALES_ORG_NM: '수출본부 - 아시아',     USER_ID: 'choi.minji',  USER_NM: '최민지', ROLE: '담당자',     ACTV_YN: true,  ASSIGN_DT: '2026-01-10' },
  { SALES_ORG_CD: 'SO-EXP-CIS',  SALES_ORG_NM: '수출본부 - CIS',        USER_ID: 'jang.minho',  USER_NM: '장민호', ROLE: '담당자',     ACTV_YN: true,  ASSIGN_DT: '2026-01-05' },
  { SALES_ORG_CD: 'SO-EXP-CIS',  SALES_ORG_NM: '수출본부 - CIS',        USER_ID: 'kim.dahye',   USER_NM: '김다혜', ROLE: '부담당자',   ACTV_YN: false, ASSIGN_DT: '2025-12-01' },
];

export default function KtngDpOrgMappingMockup() {
  const [tab, setTab] = React.useState(0);
  return (
    <MockShell
      patternCode="ktng_dp_org_mapping"
      patternLabel="KTNG — DP 영업조직 매핑 (제품레벨/담당자)"
      layoutCategory="LAYOUT_SINGLE"
      description="UI_DP_KTNG_11 영업조직-제품레벨 매핑 + UI_DP_KTNG_12 영업조직-담당자 매핑. 표준 마스터 CRUD — SearchArea + 우측 ButtonArea (Add/Delete/Save) + 단일 그리드."
    >
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 1.5 }}>
        <Tabs value={tab} onChange={(_e, v) => setTab(v)}>
          <Tab label={<Stack direction="row" spacing={1} alignItems="center"><span>영업조직-제품레벨</span><Chip label="UI_DP_KTNG_11" size="small" variant="outlined" sx={{ height: 18, fontSize: 10, fontFamily: 'monospace' }} /></Stack>} />
          <Tab label={<Stack direction="row" spacing={1} alignItems="center"><span>영업조직-담당자</span><Chip label="UI_DP_KTNG_12" size="small" variant="outlined" sx={{ height: 18, fontSize: 10, fontFamily: 'monospace' }} /></Stack>} />
        </Tabs>
      </Box>

      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="SALES_ORG" size="small" select value="ALL" sx={{ width: 200 }}>
            <MenuItem value="ALL">전체</MenuItem>
          </TextField>
          {tab === 0 ? (
            <TextField label="ITEM_LV3" size="small" value="" placeholder="브랜드 검색"
              InputProps={{ endAdornment: <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} /> }}
              sx={{ width: 200 }} />
          ) : (
            <TextField label="USER" size="small" value="" placeholder="사용자 검색"
              InputProps={{ endAdornment: <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} /> }}
              sx={{ width: 200 }} />
          )}
          <TextField label="ACTV_YN" size="small" select value="Y" sx={{ width: 110 }}>
            <MenuItem value="ALL">ALL</MenuItem>
            <MenuItem value="Y">Y</MenuItem>
            <MenuItem value="N">N</MenuItem>
          </TextField>
        </Stack>
      </Box>

      <Box sx={{ px: 1.5, py: 0.7, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        <Button size="small" variant="outlined" startIcon={<DownloadIcon />}>Excel</Button>
        <ButtonGroup variant="outlined" size="small">
          <IconButton size="small"><AddIcon fontSize="small" /></IconButton>
          <IconButton size="small"><DeleteIcon fontSize="small" /></IconButton>
          <IconButton size="small" color="primary"><SaveIcon fontSize="small" /></IconButton>
        </ButtonGroup>
      </Box>

      <Box sx={{ p: 1.5, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Paper variant="outlined" sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              {tab === 0 ? (
                <>
                  <TableHead><TableRow>
                    <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, fontFamily: 'monospace' }}>SALES_ORG_CD</TableCell>
                    <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12 }}>SALES_ORG_NM</TableCell>
                    <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12 }}>ITEM_LV1</TableCell>
                    <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12 }}>ITEM_LV3</TableCell>
                    <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12 }}>ITEM_LV4</TableCell>
                    <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, textAlign: 'center' }}>USE_YN</TableCell>
                    <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12 }}>CREATE_BY</TableCell>
                  </TableRow></TableHead>
                  <TableBody>
                    {ORG_ITEM_ROWS.map((r, i) => (
                      <TableRow key={i} hover>
                        <TableCell sx={{ fontSize: 11, fontFamily: 'monospace' }}>{r.SALES_ORG_CD}</TableCell>
                        <TableCell sx={{ fontSize: 11 }}>{r.SALES_ORG_NM}</TableCell>
                        <TableCell sx={{ fontSize: 11 }}>{r.ITEM_LV1}</TableCell>
                        <TableCell sx={{ fontSize: 11 }}>{r.ITEM_LV3}</TableCell>
                        <TableCell sx={{ fontSize: 11 }}>{r.ITEM_LV4}</TableCell>
                        <TableCell sx={{ textAlign: 'center' }}><Checkbox size="small" checked={r.USE_YN} disabled sx={{ p: 0.25 }} /></TableCell>
                        <TableCell sx={{ fontSize: 11, fontFamily: 'monospace' }}>{r.CREATE_BY}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </>
              ) : (
                <>
                  <TableHead><TableRow>
                    <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, fontFamily: 'monospace' }}>SALES_ORG_CD</TableCell>
                    <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12 }}>SALES_ORG_NM</TableCell>
                    <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, fontFamily: 'monospace' }}>USER_ID</TableCell>
                    <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12 }}>USER_NM</TableCell>
                    <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, textAlign: 'center' }}>ROLE</TableCell>
                    <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, textAlign: 'center' }}>ACTV_YN</TableCell>
                    <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 700, fontSize: 12, fontFamily: 'monospace', textAlign: 'center' }}>ASSIGN_DT</TableCell>
                  </TableRow></TableHead>
                  <TableBody>
                    {ORG_USER_ROWS.map((r, i) => (
                      <TableRow key={i} hover>
                        <TableCell sx={{ fontSize: 11, fontFamily: 'monospace' }}>{r.SALES_ORG_CD}</TableCell>
                        <TableCell sx={{ fontSize: 11 }}>{r.SALES_ORG_NM}</TableCell>
                        <TableCell sx={{ fontSize: 11, fontFamily: 'monospace' }}>{r.USER_ID}</TableCell>
                        <TableCell sx={{ fontSize: 11 }}>{r.USER_NM}</TableCell>
                        <TableCell sx={{ fontSize: 11, textAlign: 'center' }}><Chip label={r.ROLE} size="small" variant="outlined" sx={{ height: 18, fontSize: 10, color: r.ROLE === '담당자' ? '#1565c0' : '#9ca3af' }} /></TableCell>
                        <TableCell sx={{ textAlign: 'center' }}><Checkbox size="small" checked={r.ACTV_YN} disabled sx={{ p: 0.25 }} /></TableCell>
                        <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'center' }}>{r.ASSIGN_DT}</TableCell>
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
