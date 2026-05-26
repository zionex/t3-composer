import React from 'react';
import { Box, Stack, TextField, Button, Chip, Typography, Paper, Divider, IconButton } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import EmailIcon from '@mui/icons-material/Email';
import GoogleIcon from '@mui/icons-material/Google';
import GitHubIcon from '@mui/icons-material/GitHub';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import MockShell from '../../_shared/MockShell';

// PLANNEL 인증 — Signin / Signup / ForgotPassword / ResetPassword / HelpSignin /
//   MailAuthentication / TwoFactorAuthentication / SignInPolicy / Authentication 9개
// LAYOUT_SINGLE — 중앙 인증 카드 + 좌측 sign-in policy

export default function AuthSigninMockup() {
  return (
    <MockShell
      patternCode="plannel_auth_signin"
      patternLabel="PlaNEL — 인증 (Sign In / Sign Up / Forgot Password / Reset / 2FA / Mail Auth / Sign-in Policy 9종)"
      layoutCategory="LAYOUT_SINGLE"
      description="중앙 인증 카드 + Sign-in Policy 패널. 인증 관련 9개 화면 통합 layout."
    >
      <Box sx={{ flex: 1, display: 'flex', overflow: 'auto', backgroundColor: 'grey.50' }}>
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
          <Paper elevation={6} sx={{ p: 4, width: '100%', maxWidth: 380 }}>
            <Stack alignItems="center" sx={{ mb: 3 }}>
              <Box sx={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: 'primary.main',
                display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5 }}>
                <LockIcon sx={{ color: 'white', fontSize: 28 }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>Welcome to PlaNEL</Typography>
              <Typography variant="caption" color="text.secondary">Sign in to your account</Typography>
            </Stack>

            <Stack spacing={2}>
              <TextField label="이메일" size="small" placeholder="user@plannel.com" fullWidth
                InputProps={{ startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 18 }} /> }} />
              <TextField label="비밀번호" size="small" type="password" fullWidth
                InputProps={{ startAdornment: <LockIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 18 }} /> }} />
              <Button variant="contained" fullWidth size="large">Sign In</Button>

              <Divider>또는</Divider>

              <Stack direction="row" spacing={1}>
                <Button variant="outlined" startIcon={<GoogleIcon />} fullWidth size="small">Google</Button>
                <Button variant="outlined" startIcon={<GitHubIcon />} fullWidth size="small">GitHub</Button>
              </Stack>

              <Stack direction="row" justifyContent="space-between" sx={{ pt: 1 }}>
                <Typography variant="caption" sx={{ cursor: 'pointer', color: 'primary.main' }}>비밀번호 찾기</Typography>
                <Typography variant="caption" sx={{ cursor: 'pointer', color: 'primary.main' }}>회원가입</Typography>
              </Stack>
            </Stack>
          </Paper>
        </Box>

        <Box sx={{ width: 320, borderLeft: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper', p: 3, overflow: 'auto' }}>
          <Stack direction="row" alignItems="center" sx={{ mb: 2 }}>
            <VpnKeyIcon color="primary" />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, ml: 1 }}>Sign-In Policy</Typography>
          </Stack>

          <Stack spacing={1.5}>
            <Box>
              <Typography variant="caption" color="text.secondary">암호 정책</Typography>
              <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }} flexWrap="wrap">
                <Chip label="최소 12자" size="small" variant="outlined" />
                <Chip label="대소문자 + 숫자 + 특수" size="small" variant="outlined" />
                <Chip label="만료 90일" size="small" variant="outlined" />
              </Stack>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">2FA</Typography>
              <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
                <Chip label="ENABLED · TOTP" size="small" color="success" />
              </Stack>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">로그인 시도 제한</Typography>
              <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
                <Chip label="5회 실패 → 15분 lock" size="small" variant="outlined" />
              </Stack>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">IP Whitelist</Typography>
              <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }} flexWrap="wrap">
                <Chip label="10.0.0.0/8" size="small" variant="outlined" />
                <Chip label="VPN only" size="small" color="info" />
              </Stack>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Active Sessions</Typography>
              <Typography variant="h6" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>247 users</Typography>
            </Box>
          </Stack>
        </Box>
      </Box>
    </MockShell>
  );
}
