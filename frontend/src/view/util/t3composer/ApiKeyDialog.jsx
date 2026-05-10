import React, { useState } from 'react';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  Box,
  Link,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VpnKeyIcon from '@mui/icons-material/VpnKey';

import { saveApiKey } from './api';

/**
 * Anthropic API Key 등록 다이얼로그.
 *
 * - 최초 진입 시 키가 없으면 open
 * - 입력값 검증 (sk-ant- 로 시작)
 * - 저장 성공 시 onSaved 콜백
 */
function ApiKeyDialog({ open, onClose, onSaved }) {
  const [apiKey, setApiKey] = useState('');
  const [description, setDescription] = useState('Personal key');
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      setError('API 키를 입력해주세요.');
      return;
    }
    if (!trimmed.startsWith('sk-ant-')) {
      setError('Anthropic API 키는 sk-ant- 로 시작해야 합니다.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await saveApiKey(trimmed, description);
      setApiKey('');
      if (onSaved) onSaved();
    } catch (e) {
      const data = e?.response?.data || {};
      setError(data.message || data.error || e?.message || '저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <VpnKeyIcon color="primary" />
        Anthropic API 키 등록
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          T3Composer 는 Claude API 로 화면·SP·테이블을 생성합니다. 개인 Anthropic API 키를 등록해 주세요.
          키는 서버에서 암호화되어 저장됩니다 (TB_IS_EXTRNLAPIKEY, Jasypt PBE).
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Link
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noopener noreferrer"
            variant="body2"
          >
            → Anthropic Console 에서 키 발급
          </Link>
        </Box>

        <TextField
          autoFocus
          fullWidth
          label="API Key"
          placeholder="sk-ant-..."
          type={showKey ? 'text' : 'password'}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          sx={{ mb: 2 }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowKey((v) => !v)} edge="end" size="small">
                  {showKey ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <TextField
          fullWidth
          label="설명 (옵션)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          sx={{ mb: 1 }}
          size="small"
        />
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>취소</Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}>
          {saving ? '저장 중...' : '저장'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ApiKeyDialog;
