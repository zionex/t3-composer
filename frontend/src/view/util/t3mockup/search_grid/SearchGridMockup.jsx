import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Paper, Checkbox,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SaveIcon from '@mui/icons-material/Save';
import DownloadIcon from '@mui/icons-material/Download';

import MockShell from '../_shared/MockShell';
import { USERS } from '../_data/mockData';

const COLUMNS = [
  { name: 'userId',     label: '사용자ID',   width: 110, align: 'center' },
  { name: 'userNm',     label: '사용자명',   width: 100, align: 'left'   },
  { name: 'userEmail',  label: '이메일',     width: 200, align: 'left'   },
  { name: 'userTel',    label: '연락처',     width: 130, align: 'center' },
  { name: 'deptNm',     label: '부서',       width: 130, align: 'left'   },
  { name: 'positionNm', label: '직책',       width: 80,  align: 'center' },
  { name: 'userTp',     label: '사용자유형', width: 100, align: 'center' },
  { name: 'useYnBool',  label: '사용여부',   width: 80,  align: 'center' },
  { name: 'joinDt',     label: '입사일',     width: 110, align: 'center' },
  { name: 'createBy',   label: '등록자',     width: 90,  align: 'center' },
  { name: 'createDttm', label: '등록일시',   width: 150, align: 'center' },
];

export default function SearchGridMockup() {
  return (
    <MockShell
      patternCode="search_grid"
      patternLabel="P02 — 검색 + 단일 그리드 (마스터 CRUD)"
      layoutCategory="LAYOUT_SINGLE"
      description="가장 흔한 마스터 CRUD 화면. 상단 SearchArea + 단일 BaseGrid. 신규 화면의 80% 가 이 패턴."
    >
      {/* SearchArea */}
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          <TextField label="사용자ID" size="small" value="" sx={{ width: 160 }} />
          <TextField label="사용자명" size="small" value="" sx={{ width: 140 }} />
          <TextField label="부서"     size="small" select value="" sx={{ width: 150 }}>
            <MenuItem value="">전체</MenuItem>
            <MenuItem value="D-001">생산계획팀</MenuItem>
            <MenuItem value="D-002">구매팀</MenuItem>
            <MenuItem value="D-005">IT/SCM팀</MenuItem>
          </TextField>
          <TextField label="사용여부" size="small" select value="Y" sx={{ width: 110 }}>
            <MenuItem value="">전체</MenuItem>
            <MenuItem value="Y">Y</MenuItem>
            <MenuItem value="N">N</MenuItem>
          </TextField>
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
        </Stack>
      </Box>

      {/* ButtonArea */}
      <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="body2" sx={{ alignSelf: 'center', color: 'text.secondary' }}>
          총 {USERS.length} 건 조회되었습니다
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="outlined" startIcon={<AddIcon />}>추가</Button>
          <Button size="small" variant="outlined" color="error" startIcon={<DeleteOutlineIcon />}>삭제</Button>
          <Button size="small" variant="contained" startIcon={<SaveIcon />}>저장</Button>
          <Button size="small" variant="outlined" startIcon={<DownloadIcon />}>엑셀</Button>
        </Stack>
      </Box>

      {/* BaseGrid (실제는 RealGrid2, 여기서는 MUI Table 로 정적 표현) */}
      <TableContainer component={Paper} square sx={{ flex: 1, m: 1, mt: 0 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 700, backgroundColor: 'grey.100' } }}>
              <TableCell padding="checkbox"><Checkbox size="small" /></TableCell>
              {COLUMNS.map((c) => (
                <TableCell key={c.name} align={c.align} sx={{ minWidth: c.width }}>{c.label}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {USERS.map((row) => (
              <TableRow key={row.userId} hover>
                <TableCell padding="checkbox"><Checkbox size="small" /></TableCell>
                <TableCell align="center" sx={{ fontFamily: 'monospace' }}>{row.userId}</TableCell>
                <TableCell>{row.userNm}</TableCell>
                <TableCell>{row.userEmail}</TableCell>
                <TableCell align="center" sx={{ fontFamily: 'monospace' }}>{row.userTel}</TableCell>
                <TableCell>{row.deptNm}</TableCell>
                <TableCell align="center">{row.positionNm}</TableCell>
                <TableCell align="center">{row.userTp}</TableCell>
                <TableCell align="center"><Checkbox size="small" checked={row.useYn === 'Y'} readOnly /></TableCell>
                <TableCell align="center" sx={{ fontFamily: 'monospace' }}>{row.joinDt}</TableCell>
                <TableCell align="center">{row.createBy}</TableCell>
                <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: 12 }}>{row.createDttm}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </MockShell>
  );
}
