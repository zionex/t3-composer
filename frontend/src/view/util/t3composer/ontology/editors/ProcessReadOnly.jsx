import React, { useEffect, useState } from 'react';
import { Box, Typography, Alert, Chip } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

import { fetchProcessMeta } from '../../api';

function ProcessReadOnly({ processCd, targetCd }) {
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!processCd) return;
    fetchProcessMeta(processCd, targetCd)
      .then((r) => setMeta(r.data))
      .catch((e) => setError(e?.message || '조회 실패'));
  }, [processCd, targetCd]);

  return (
    <Box>
      <Typography sx={{ fontSize: 14, fontWeight: 700, mb: 1 }}>
        <LockOutlinedIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
        Process · {processCd}
      </Typography>
      <Alert severity="info" sx={{ mb: 2 }}>읽기 전용.</Alert>
      {error && <Alert severity="error">{error}</Alert>}
      {meta && (
        <Box sx={{ fontSize: 13 }}>
          <Typography sx={{ fontWeight: 700 }}>{meta.processName}</Typography>
          <Typography sx={{ mt: 0.5 }}>processCd: <code>{meta.processCd}</code></Typography>
          <Typography sx={{ mt: 0.5 }}>module: <Chip size="small" label={meta.module || '-'} /></Typography>
          <Typography sx={{ mt: 0.5 }}>status: <Chip size="small" label={meta.status || '-'} /></Typography>
          <Typography sx={{ mt: 0.5 }}>version: {meta.version || '(none)'}</Typography>
          <Typography sx={{ mt: 1 }}>{meta.processOverview}</Typography>
        </Box>
      )}
    </Box>
  );
}

export default ProcessReadOnly;
