import React from 'react';
import { Box, Typography } from '@mui/material';

function parseBold(text) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) => i % 2 === 1
    ? <strong key={i} style={{ fontWeight: 700, color: '#1e293b' }}>{part}</strong>
    : part
  );
}

/**
 * LLM 마크다운 텍스트 렌더러
 * 지원 패턴: ### 섹션 헤더 / 1. 번호 목록 / (a) 라벨 목록 / - 불릿 / 들여쓰기 하위 불릿 / 일반 텍스트
 * 인라인 **bold** 지원
 */
function LlmMarkdown({ content }) {
  if (!content) return null;

  const lines = content.split('\n');
  const nodes = [];

  lines.forEach((raw, i) => {
    const line = raw.trimEnd();
    if (!line.trim()) {
      nodes.push(<Box key={i} style={{ height: 8 }} />);

    } else if (line.startsWith('### ')) {
      nodes.push(
        <Box
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            borderLeft: '3px solid #137fec',
            background: 'rgba(19,127,236,0.04)',
            borderRadius: '0 6px 6px 0',
            padding: '6px 12px',
            marginTop: nodes.length > 0 ? 18 : 0,
            marginBottom: 10,
          }}
        >
          <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {line.slice(4)}
          </Typography>
        </Box>
      );

    } else if (/^\d+\.\s/.test(line)) {
      const num = line.match(/^(\d+)\./)[1];
      const body = line.replace(/^\d+\.\s*/, '');
      nodes.push(
        <Box key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            minWidth: 22, height: 22, background: '#137fec', color: '#fff',
            borderRadius: '50%', fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 1,
          }}>{num}</span>
          <span style={{ fontSize: 14, color: '#1e293b', lineHeight: 1.7, fontWeight: 500 }}>{parseBold(body)}</span>
        </Box>
      );

    } else if (/^\([a-zA-Z]\)\s/.test(line)) {
      const label = line.slice(1, 2).toUpperCase();
      const body = line.slice(4);
      nodes.push(
        <Box key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 5, paddingLeft: 32 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            minWidth: 20, height: 20, background: '#f1f5f9', color: '#64748b',
            borderRadius: 4, fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 1,
            border: '1px solid #e2e8f0',
          }}>{label}</span>
          <span style={{ fontSize: 14, color: '#334155', lineHeight: 1.7 }}>{parseBold(body)}</span>
        </Box>
      );

    } else if (line.startsWith('  - ') || line.startsWith('   - ')) {
      const body = line.replace(/^\s*-\s/, '');
      nodes.push(
        <Box key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 4, paddingLeft: 52 }}>
          <Box style={{ width: 4, height: 4, borderRadius: '50%', background: '#cbd5e1', flexShrink: 0, marginTop: 8 }} />
          <span style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>{parseBold(body)}</span>
        </Box>
      );

    } else if (line.startsWith('- ')) {
      nodes.push(
        <Box key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 5, paddingLeft: 32 }}>
          <Box style={{ width: 6, height: 6, borderRadius: '50%', background: '#137fec', opacity: 0.6, flexShrink: 0, marginTop: 7 }} />
          <span style={{ fontSize: 14, color: '#475569', lineHeight: 1.6 }}>{parseBold(line.slice(2))}</span>
        </Box>
      );

    } else {
      nodes.push(
        <p key={i} style={{ fontSize: 14, color: '#64748b', lineHeight: 1.8, margin: '2px 0' }}>
          {parseBold(line)}
        </p>
      );
    }
  });

  return <Box>{nodes}</Box>;
}

export default LlmMarkdown;
