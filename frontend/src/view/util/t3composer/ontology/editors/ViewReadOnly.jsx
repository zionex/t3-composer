import React, { useEffect, useState } from 'react';
import { Box, Typography, Alert, Chip } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

import { fetchViewMeta } from '../../api';

function ViewReadOnly({ menuCd, targetCd }) {
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!menuCd) return;
    fetchViewMeta(menuCd, targetCd)
      .then((r) => setMeta(r.data))
      .catch((e) => setError(e?.message || '조회 실패'));
  }, [menuCd, targetCd]);

  return (
    <Box>
      <Typography sx={{ fontSize: 14, fontWeight: 700, mb: 1 }}>
        <LockOutlinedIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
        View Manual · {menuCd}
      </Typography>
      <Alert severity="info" sx={{ mb: 2 }}>읽기 전용. 편집은 v2 또는 wingui 별도 화면에서.</Alert>
      {error && <Alert severity="error">{error}</Alert>}
      {meta && (
        <Box sx={{ fontSize: 13 }}>
          <Typography>menuCd: <code>{meta.menuCd}</code></Typography>
          <Typography sx={{ mt: 0.5 }}>id: <code>{meta.id}</code></Typography>
          <Typography sx={{ mt: 0.5 }}>
            status: <Chip size="small" label={meta.status || '-'} />
          </Typography>
          <Typography sx={{ mt: 0.5 }}>
            published_version: {meta.publishedVersion || '(none)'}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default ViewReadOnly;
