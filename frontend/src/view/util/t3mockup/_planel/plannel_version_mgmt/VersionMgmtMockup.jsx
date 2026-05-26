import React from 'react';
import { Box, Stack, Button, Chip, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import DeleteIcon from '@mui/icons-material/Delete';
import MockShell from '../../_shared/MockShell';

// PLANNEL Version Management — VersionMgmt 1개
// LAYOUT_SINGLE — 데이터 버전 목록 + 작업 (복원/비교/삭제)

const VERSIONS = [
  { v: 'V2026.05.26.01', tag: 'Latest',     created: '2026-05-26 14:23', author: '김계획', items: 1247, size: '2.4 GB', active: true },
  { v: 'V2026.05.22.01', tag: 'Approved',   created: '2026-05-22 16:45', author: '관리자', items: 1241, size: '2.3 GB', active: false },
  { v: 'V2026.05.15.02', tag: 'Baseline',   created: '2026-05-15 09:12', author: '이수요', items: 1235, size: '2.3 GB', active: false },
  { v: 'V2026.05.15.01', tag: 'Draft',      created: '2026-05-15 08:30', author: '이수요', items: 1235, size: '2.3 GB', active: false },
  { v: 'V2026.05.08.01', tag: 'Archived',   created: '2026-05-08 11:20', author: '김계획', items: 1228, size: '2.2 GB', active: false },
  { v: 'V2026.05.01.01', tag: 'Archived',   created: '2026-05-01 10:05', author: '관리자', items: 1220, size: '2.2 GB', active: false },
];

const tagColor = (t) => t === 'Latest' ? 'success' : t === 'Approved' ? 'primary' : t === 'Draft' ? 'warning' : 'default';

export default function VersionMgmtMockup() {
  return (
    <MockShell
      patternCode="plannel_version_mgmt"
      patternLabel="PlaNEL — 버전 관리 (Version Management)"
      layoutCategory="LAYOUT_SINGLE"
      description="데이터 버전 스냅샷 목록 + 복원/비교/삭제. PlaNEL 전체 데이터 시점 관리."
    >
      <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Paper sx={{ p: 2, flex: 1, borderTop: '3px solid', borderTopColor: 'primary.main' }}>
            <Typography variant="caption" color="text.secondary">총 버전 수</Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>247</Typography>
            <Typography variant="caption" color="text.secondary">최근 90일</Typography>
          </Paper>
          <Paper sx={{ p: 2, flex: 1, borderTop: '3px solid', borderTopColor: 'success.main' }}>
            <Typography variant="caption" color="text.secondary">활성 버전</Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>V2026.05.26.01</Typography>
            <Typography variant="caption" color="text.secondary">created 14:23</Typography>
          </Paper>
          <Paper sx={{ p: 2, flex: 1, borderTop: '3px solid', borderTopColor: 'warning.main' }}>
            <Typography variant="caption" color="text.secondary">스냅샷 총 용량</Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>542 GB</Typography>
            <Typography variant="caption" color="text.secondary">평균 2.3 GB/버전</Typography>
          </Paper>
          <Paper sx={{ p: 2, flex: 1, borderTop: '3px solid', borderTopColor: 'info.main' }}>
            <Typography variant="caption" color="text.secondary">자동 정리 정책</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'info.main', mt: 0.5 }}>90일 후 삭제</Typography>
            <Typography variant="caption" color="text.secondary">Archived 제외</Typography>
          </Paper>
        </Stack>

        <Paper sx={{ p: 0 }}>
          <Stack direction="row" alignItems="center" sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>버전 목록</Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Button size="small" startIcon={<CompareArrowsIcon />}>버전 비교</Button>
            <Button size="small" startIcon={<RestoreIcon />} variant="outlined">선택 복원</Button>
          </Stack>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 700 }}>버전</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>태그</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>생성 시각</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>작성자</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>품목 수</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>크기</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>작업</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {VERSIONS.map((v) => (
                <TableRow key={v.v} hover selected={v.active}
                  sx={{ '&.Mui-selected': { backgroundColor: 'success.50' } }}>
                  <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{v.v}</TableCell>
                  <TableCell><Chip label={v.tag} size="small" color={tagColor(v.tag)} /></TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{v.created}</TableCell>
                  <TableCell>{v.author}</TableCell>
                  <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{v.items.toLocaleString()}</TableCell>
                  <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{v.size}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      {!v.active && <Button size="small" startIcon={<RestoreIcon sx={{ fontSize: 14 }} />}>복원</Button>}
                      {v.tag !== 'Archived' && v.tag !== 'Latest' && (
                        <Button size="small" color="error" startIcon={<DeleteIcon sx={{ fontSize: 14 }} />}>삭제</Button>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Box>
    </MockShell>
  );
}
