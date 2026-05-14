// =============================================================================
// TargetDbConnectionDialog — Target System 별 운영 DB 접속 정보 편집 + 테스트.
// MenuTreeBrowser / InsightSourceController 가 이 정보로 직접 운영 DB 조회.
// =============================================================================
import React, { useEffect, useState } from 'react';

import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Stack, Typography, Box, Alert, CircularProgress, Chip,
} from '@mui/material';
import StorageIcon from '@mui/icons-material/Storage';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SaveIcon from '@mui/icons-material/Save';
import FolderIcon from '@mui/icons-material/Folder';

import {
  getTarget, updateTargetDbConnection, testTargetDbConnection,
} from './api';

const DRIVER_BY_DBTYPE = {
  MSSQL:      'com.microsoft.sqlserver.jdbc.SQLServerDriver',
  ORACLE:     'oracle.jdbc.OracleDriver',
  POSTGRESQL: 'org.postgresql.Driver',
  DB2:        'com.ibm.db2.jcc.DB2Driver',
};

const PLACEHOLDER_BY_DBTYPE = {
  MSSQL:      'jdbc:sqlserver://host:1433;databaseName=T3SMARTSCM;encrypt=true;trustServerCertificate=true',
  ORACLE:     'jdbc:oracle:thin:@host:1521:ORCL',
  POSTGRESQL: 'jdbc:postgresql://host:5432/database',
  DB2:        'jdbc:db2://host:50000/database',
};

export default function TargetDbConnectionDialog({ open, targetCd, onClose, onSaved }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [testing, setTesting] = useState(false);
  const [target, setTarget]   = useState(null);
  const [form, setForm]       = useState({
    dbUrl: '', dbUsername: '', dbPassword: '', dbDriverClass: '',
  });
  const [testResult, setTestResult] = useState(null);
  const [savedMsg, setSavedMsg]     = useState(null);

  useEffect(() => {
    if (!open || !targetCd) return;
    setLoading(true);
    setTestResult(null);
    setSavedMsg(null);
    getTarget(targetCd)
      .then((res) => {
        const t = res.data;
        setTarget(t);
        setForm({
          dbUrl:         t.dbUrl || '',
          dbUsername:    t.dbUsername || '',
          dbPassword:    t.dbPassword || '',
          dbDriverClass: t.dbDriverClass || DRIVER_BY_DBTYPE[t.dbType] || '',
        });
      })
      .catch((e) => setTestResult({ success: false, error: '대상 로딩 실패: ' + (e?.message || '') }))
      .finally(() => setLoading(false));
  }, [open, targetCd]);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testTargetDbConnection(targetCd, form);
      setTestResult(res.data);
    } catch (e) {
      setTestResult({ success: false, error: e?.response?.data?.error || e?.message || 'test failed' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSavedMsg(null);
    try {
      await updateTargetDbConnection(targetCd, form);
      setSavedMsg({ kind: 'success', text: '저장됨 — 다음 메뉴 트리/소스 조회부터 적용됩니다' });
      if (onSaved) onSaved();
    } catch (e) {
      setSavedMsg({ kind: 'error', text: '저장 실패: ' + (e?.response?.data?.message || e?.message || '') });
    } finally {
      setSaving(false);
    }
  };

  const placeholder = target ? (PLACEHOLDER_BY_DBTYPE[target.dbType] || 'jdbc:...') : '';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <StorageIcon fontSize="small" />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Target DB 접속 정보 — {target?.targetName || targetCd}
          </Typography>
          {target && <Chip size="small" label={target.dbType} sx={{ fontSize: 10, fontWeight: 600 }} />}
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        )}
        {!loading && target && (
          <Stack spacing={2}>
            <Alert severity="info" sx={{ bgcolor: '#eff6ff' }}>
              운영 wingui DB 에 직접 연결하면 NEW_FROM_COPY / EXISTING_MODIFY 가 실시간 메뉴·LangPack·SP 데이터를 가져옵니다.
              비워두면 로컬 target-mssql synced 데이터를 폴백 사용합니다.
            </Alert>

            <TextField
              label="JDBC URL" fullWidth size="small"
              value={form.dbUrl}
              onChange={(e) => setForm({ ...form, dbUrl: e.target.value })}
              placeholder={placeholder}
              InputProps={{ sx: { fontFamily: 'monospace', fontSize: 13 } }}
            />
            <Stack direction="row" spacing={1}>
              <TextField
                label="Username" size="small" sx={{ flex: 1 }}
                value={form.dbUsername}
                onChange={(e) => setForm({ ...form, dbUsername: e.target.value })}
              />
              <TextField
                label="Password" size="small" type="password" sx={{ flex: 1 }}
                value={form.dbPassword}
                onChange={(e) => setForm({ ...form, dbPassword: e.target.value })}
              />
            </Stack>
            <TextField
              label="Driver Class (선택)" size="small" fullWidth
              value={form.dbDriverClass}
              onChange={(e) => setForm({ ...form, dbDriverClass: e.target.value })}
              InputProps={{ sx: { fontFamily: 'monospace', fontSize: 12 } }}
            />

            {testResult && (
              <Alert severity={testResult.success ? 'success' : 'error'}>
                {testResult.success
                  ? `연결 성공 — ${testResult.databaseProduct} ${testResult.databaseVersion} (${testResult.elapsedMs}ms)`
                  : `연결 실패 — ${testResult.error}`}
              </Alert>
            )}

            {/* Target source/database 경로 — readonly. 마운트 변경은 .env 의
                TARGET_<CD>_WINGUI_PATH / DATABASE_PATH 로만 가능. */}
            <Stack direction="row" alignItems="center" spacing={1}
                   sx={{ pt: 1, mt: 1, borderTop: '1px solid #e2e8f0' }}>
              <FolderIcon fontSize="small" sx={{ color: '#64748b' }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155' }}>
                Target source path (readonly)
              </Typography>
            </Stack>
            <Alert severity="info" sx={{ bgcolor: '#f1f5f9', '& .MuiAlert-icon': { color: '#64748b' } }}>
              마운트 경로는 <code>.env</code> 의 <code>TARGET_{targetCd}_WINGUI_PATH</code> /
              <code> TARGET_{targetCd}_DATABASE_PATH</code> 로만 변경할 수 있습니다.
              변경 후 <code>docker compose up -d --force-recreate composer-backend</code> 필요.
            </Alert>
            <TextField
              label="source 폴더 경로" fullWidth size="small"
              value={target.sourceRefPath || '(미설정 — 컨테이너 안 /workspace/targets/' + targetCd + '/wingui 자동 사용)'}
              InputProps={{
                readOnly: true,
                sx: { fontFamily: 'monospace', fontSize: 12, bgcolor: '#f8fafc' },
              }}
            />
            <TextField
              label="database 폴더 경로" fullWidth size="small"
              value={target.databaseRefPath || '(미설정 — 컨테이너 안 /workspace/targets/' + targetCd + '/database 자동 사용)'}
              InputProps={{
                readOnly: true,
                sx: { fontFamily: 'monospace', fontSize: 12, bgcolor: '#f8fafc' },
              }}
            />

            {savedMsg && <Alert severity={savedMsg.kind}>{savedMsg.text}</Alert>}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>닫기</Button>
        <Button
          startIcon={testing ? <CircularProgress size={14} /> : <PlayArrowIcon />}
          onClick={handleTest}
          disabled={!form.dbUrl || testing || saving}
        >
          연결 테스트
        </Button>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : <SaveIcon />}
          onClick={handleSave}
          disabled={!form.dbUrl || saving}
        >
          저장
        </Button>
      </DialogActions>
    </Dialog>
  );
}
