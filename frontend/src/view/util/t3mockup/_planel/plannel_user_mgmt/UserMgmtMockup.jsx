import React from 'react';
import { Box, Stack, TextField, Button, Chip, Typography, Paper, Avatar,
  Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SearchIcon from '@mui/icons-material/Search';
import MockShell from '../../_shared/MockShell';

// PLANNEL User & Org — UserMgmt / PersonalSettings / ChangePassword / CompanyProfile 4개
// LAYOUT_DASHBOARD — Company info KPI + 사용자 목록

const COMPANY_KPIS = [
  { label: 'Total Users',  value: '247',  sub: 'active 234',     color: 'primary' },
  { label: 'Admin',        value: '8',    sub: '3.2%',          color: 'warning' },
  { label: 'Departments',  value: '12',   sub: 'Korea + JP + US', color: 'info' },
  { label: 'Last 30d 가입', value: '+18',  sub: 'mgmt 활성',     color: 'success' },
];

const USERS = [
  { name: '김계획', email: 'kim.plan@plannel.com', dept: 'Planning', role: 'Admin',  status: 'ACTIVE',   joined: '2024-01-15' },
  { name: '이수요', email: 'lee.dp@plannel.com',    dept: 'DP Team',  role: 'Editor', status: 'ACTIVE',   joined: '2024-03-22' },
  { name: '박재고', email: 'park.ip@plannel.com',   dept: 'IP Team',  role: 'Editor', status: 'ACTIVE',   joined: '2024-05-08' },
  { name: '최보충', email: 'choi.rp@plannel.com',   dept: 'RP Team',  role: 'Viewer', status: 'ACTIVE',   joined: '2024-09-11' },
  { name: '정생산', email: 'jung.mp@plannel.com',   dept: 'MP Team',  role: 'Editor', status: 'INACTIVE', joined: '2024-02-03' },
  { name: 'J. Smith', email: 'jsmith@plannel.com',  dept: 'US Office', role: 'Viewer', status: 'ACTIVE',   joined: '2025-08-14' },
];

const roleColor = (r) => r === 'Admin' ? 'error' : r === 'Editor' ? 'primary' : 'default';

export default function UserMgmtMockup() {
  return (
    <MockShell
      patternCode="plannel_user_mgmt"
      patternLabel="PlaNEL — 사용자 & 조직 (User Mgmt / Personal Settings / Change Password / Company Profile)"
      layoutCategory="LAYOUT_DASHBOARD"
      description="조직 KPI + 사용자 목록. 사용자 관리 + 개인 설정 + 조직 프로필 통합."
    >
      <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main', fontWeight: 700 }}>PN</Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>PlanNEL Solutions Inc.</Typography>
              <Typography variant="caption" color="text.secondary">SCM 통합 플래닝 솔루션 · est. 2018 · KR · US · JP</Typography>
            </Box>
          </Stack>
        </Paper>

        <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
          {COMPANY_KPIS.map((k) => (
            <Paper key={k.label} elevation={1} sx={{ flex: 1, p: 1.5, borderTop: '3px solid', borderTopColor: `${k.color}.main` }}>
              <Typography variant="caption" color="text.secondary">{k.label}</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: `${k.color}.main`, my: 0.5 }}>{k.value}</Typography>
              <Typography variant="caption" color="text.secondary">{k.sub}</Typography>
            </Paper>
          ))}
        </Stack>

        <Paper sx={{ p: 0 }}>
          <Stack direction="row" alignItems="center" sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Users</Typography>
            <Box sx={{ flexGrow: 1 }} />
            <TextField size="small" placeholder="이름/이메일 검색" InputProps={{ startAdornment: <SearchIcon sx={{ fontSize: 18, color: 'text.secondary', mr: 0.5 }} /> }} sx={{ width: 220, mr: 1 }} />
            <Button size="small" startIcon={<PersonAddIcon />} variant="contained">사용자 추가</Button>
          </Stack>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 700 }}>사용자</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>이메일</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>부서</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>권한</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>상태</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>가입일</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {USERS.map((u) => (
                <TableRow key={u.email} hover>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: 'secondary.main' }}>{u.name.charAt(0)}</Avatar>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{u.name}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{u.email}</TableCell>
                  <TableCell>{u.dept}</TableCell>
                  <TableCell><Chip label={u.role} size="small" color={roleColor(u.role)} /></TableCell>
                  <TableCell><Chip label={u.status} size="small" color={u.status === 'ACTIVE' ? 'success' : 'default'} /></TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{u.joined}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Box>
    </MockShell>
  );
}
