// =============================================================================
// InferredSqlPanel — JPA Repository 의 method-name 으로부터 추론된 SQL 표시.
//
// 입력: queryMethods 배열 — backend 의 JpaMethodSqlMapper 가 생성.
//   [{ methodName, returnType?, parameters?, inferredSql, source }]
//   source ∈ 'method-name' | '@Query(JPQL)' | '@Query(nativeQuery=true)' | 'JpaRepository-stock'
//
// 사용처:
//   · SourceBundlePreview — 각 Repository 파일 아래 펼침
//   · Step4DataBinding (JPA_ENTITY) — Entity 의 실제 컬럼 / 추론 SQL 참고
// =============================================================================
import React, { useState } from 'react';

import { Box, Chip, Paper, Stack, Typography, Collapse } from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

const SOURCE_COLOR = {
  'method-name':              { bg: '#dbeafe', fg: '#1e40af', label: 'method-name' },
  '@Query(JPQL)':             { bg: '#dcfce7', fg: '#15803d', label: '@Query JPQL' },
  '@Query(nativeQuery=true)': { bg: '#fef3c7', fg: '#92400e', label: '@Query native' },
  'JpaRepository-stock':      { bg: '#f1f5f9', fg: '#475569', label: 'Jpa stock' },
};

function InferredSqlPanel({ queryMethods, title, defaultExpanded = false, compact = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const count = Array.isArray(queryMethods) ? queryMethods.length : 0;
  if (count === 0) return null;

  const copyToClipboard = (txt) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).catch(() => {});
    }
  };

  return (
    <Paper variant="outlined" sx={{
      mt: compact ? 0.5 : 1, p: compact ? 0.8 : 1, borderRadius: 1,
      bgcolor: '#fafafa', borderColor: '#cbd5e1',
    }}>
      <Stack
        direction="row" alignItems="center" spacing={0.7}
        onClick={() => setExpanded((v) => !v)}
        sx={{ cursor: 'pointer', userSelect: 'none' }}
      >
        <CodeIcon fontSize="small" sx={{ color: '#0ea5e9' }} />
        <Typography variant="caption" sx={{ fontWeight: 700, color: '#0f172a' }}>
          {title || 'JPA 추론 SQL'}
        </Typography>
        <Chip
          label={`${count}건`} size="small"
          sx={{ height: 16, fontSize: 10, fontWeight: 700, bgcolor: '#e0f2fe', color: '#0369a1' }}
        />
        <Box sx={{ flex: 1 }} />
        {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
      </Stack>

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Stack spacing={0.7} sx={{ mt: 1 }}>
          {queryMethods.map((qm, i) => {
            const sc = SOURCE_COLOR[qm.source] || SOURCE_COLOR['method-name'];
            return (
              <Box key={i} sx={{ borderRadius: 1, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                {/* header */}
                <Stack
                  direction="row" alignItems="center" spacing={0.7}
                  sx={{ px: 1, py: 0.5, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}
                >
                  <Typography variant="caption" sx={{
                    fontWeight: 700, color: '#0f172a',
                    fontFamily: 'monospace', fontSize: 11,
                  }}>
                    {qm.methodName}
                  </Typography>
                  {qm.parameters && (
                    <Typography variant="caption" sx={{
                      fontFamily: 'monospace', fontSize: 10, color: '#64748b',
                    }}>
                      ({qm.parameters})
                    </Typography>
                  )}
                  <Box sx={{ flex: 1 }} />
                  <Chip
                    label={sc.label} size="small"
                    sx={{ height: 14, fontSize: 9, fontWeight: 600, bgcolor: sc.bg, color: sc.fg }}
                  />
                  <Box
                    onClick={() => copyToClipboard(qm.inferredSql || '')}
                    title="SQL 복사"
                    sx={{
                      cursor: 'pointer', p: 0.2, borderRadius: 0.5,
                      '&:hover': { bgcolor: '#e2e8f0' },
                    }}
                  >
                    <ContentCopyIcon sx={{ fontSize: 12, color: '#64748b' }} />
                  </Box>
                </Stack>
                {/* SQL */}
                <Box
                  component="pre"
                  sx={{
                    m: 0, p: 1, bgcolor: '#0f172a', color: '#e2e8f0',
                    fontFamily: 'monospace', fontSize: 11,
                    lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                    overflow: 'auto', maxHeight: 200,
                  }}
                >
                  {qm.inferredSql}
                </Box>
              </Box>
            );
          })}
        </Stack>
      </Collapse>
    </Paper>
  );
}

export default InferredSqlPanel;
