import React from 'react';
import {
  Box, Stack, TextField, Button, Chip, Typography, Paper, Checkbox,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer, DialogTitle, DialogActions, IconButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';

import MockShell from '../_shared/MockShell';
import { ITEMS } from '../_data/mockData';

export default function PopupMockup() {
  return (
    <MockShell
      patternCode="popup"
      patternLabel="팝업 다이얼로그 (PopSelectItem 양식)"
      layoutCategory="POPUP"
      description="Master 검색 팝업의 표준 양식. 검색 + 그리드 + Confirm/Cancel. PopSelectItem.jsx 가 기준."
    >
      <Box sx={{ flex: 1, position: 'relative', backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflow: 'auto' }}>
        {/* Backdrop UI 시뮬 (배경 영역) */}
        <Box sx={{ position: 'absolute', top: 16, left: 16, right: 16, bottom: 16, border: '1px dashed', borderColor: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>호출 화면 (modal 뒤)</Typography>
        </Box>

        {/* Dialog */}
        <Paper elevation={6} sx={{ mt: 4, width: 720, maxWidth: '90%', display: 'flex', flexDirection: 'column', maxHeight: 'calc(100% - 64px)', overflow: 'hidden' }}>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="h6">품목 선택</Typography>
              <Chip size="small" label="PopSelectItem" sx={{ fontFamily: 'monospace' }} />
            </Stack>
            <IconButton size="small"><CloseIcon /></IconButton>
          </DialogTitle>

          <Box sx={{ p: 1.5, backgroundColor: 'grey.50', borderTop: '1px solid', borderBottom: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" spacing={1.5}>
              <TextField label="품목코드" size="small" sx={{ flex: 1 }} />
              <TextField label="품목명" size="small" sx={{ flex: 1 }} />
              <Button size="small" variant="contained" startIcon={<SearchIcon />}>검색</Button>
            </Stack>
          </Box>

          <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, backgroundColor: 'grey.100' } }}>
                  <TableCell padding="checkbox"><Checkbox size="small" /></TableCell>
                  <TableCell>품목코드</TableCell>
                  <TableCell>품목명</TableCell>
                  <TableCell align="center">유형</TableCell>
                  <TableCell align="center">그룹</TableCell>
                  <TableCell align="right">단가</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ITEMS.slice(0, 8).map((it, i) => (
                  <TableRow key={it.itemCd} hover selected={i === 1}>
                    <TableCell padding="checkbox"><Checkbox size="small" checked={i === 1} readOnly /></TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{it.itemCd}</TableCell>
                    <TableCell>{it.itemNm}</TableCell>
                    <TableCell align="center"><Chip size="small" label={it.itemTp} /></TableCell>
                    <TableCell align="center">{it.itemGrp}</TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace' }}>₩ {it.unitPrice.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <DialogActions sx={{ borderTop: '1px solid', borderColor: 'divider', px: 2, py: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>선택된 행을 Confirm 시 호출 화면에 배열로 반환</Typography>
            <Button size="small" variant="outlined">취소</Button>
            <Button size="small" variant="contained">확인</Button>
          </DialogActions>
        </Paper>
      </Box>
    </MockShell>
  );
}
