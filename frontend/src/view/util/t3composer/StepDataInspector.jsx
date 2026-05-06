import React, { useState } from 'react';
import { Box, Stack, Typography, Chip, IconButton, Collapse, Tooltip } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DataObjectIcon from '@mui/icons-material/DataObject';

/**
 * Composer 9단계 Wizard 공용 — 현재 Step 의 prefill 데이터를 raw JSON 으로 보여주는 inspector.
 *
 * 각 Step 컴포넌트가 받은 value 가 누락 없이 표시되었는지 사용자가 직접 확인할 수 있다.
 * UI 가 표시하지 않는 필드(props/methods/options_source/groupCd/displayType 등) 도
 * 펼치면 보이므로 "AI 가 분석했지만 화면에 안 나오는 항목" 우려를 해소.
 *
 * Props:
 *   title         : 패널 제목
 *   data          : 표시할 객체 (Step 의 value 또는 부분 객체)
 *   summary       : 헤더에 표시할 칩 배열 [{label, color}]
 *   defaultOpen   : 기본 펼침 여부
 */
function StepDataInspector({ title = 'AI 분석 데이터 (전체)', data, summary = [], defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const [copied, setCopied] = useState(false);

  const json = data == null ? '' : JSON.stringify(data, null, 2);
  const isEmpty = !data || (typeof data === 'object' && Object.keys(data).length === 0);

  const handleCopy = (e) => {
    e.stopPropagation();
    if (!json) return;
    try {
      navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <Box sx={{ mb: 2, border: '1px dashed #c084fc', borderRadius: 1.5, bgcolor: '#faf5ff' }}>
      <Stack
        direction="row" alignItems="center" spacing={1}
        sx={{ px: 1.2, py: 0.6, cursor: 'pointer' }}
        onClick={() => setOpen((v) => !v)}
      >
        <DataObjectIcon fontSize="small" sx={{ color: '#9333ea' }} />
        <Typography variant="caption" sx={{ fontWeight: 700, color: '#7e22ce' }}>
          {title}
        </Typography>
        {summary.map((s, i) => (
          <Chip key={i} size="small" label={s.label}
                sx={{ height: 18, fontSize: 10, bgcolor: s.color || '#e9d5ff', color: '#581c87' }} />
        ))}
        {isEmpty && (
          <Chip size="small" label="비어있음" color="warning"
                sx={{ height: 18, fontSize: 10 }} />
        )}
        <Box sx={{ flex: 1 }} />
        {!isEmpty && (
          <Tooltip title={copied ? '복사됨!' : 'JSON 복사'}>
            <IconButton size="small" onClick={handleCopy} sx={{ p: 0.3 }}>
              <ContentCopyIcon sx={{ fontSize: 14, color: copied ? '#16a34a' : '#9333ea' }} />
            </IconButton>
          </Tooltip>
        )}
        <IconButton size="small" sx={{ p: 0.3 }}>
          {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </IconButton>
      </Stack>
      <Collapse in={open} unmountOnExit>
        <Box
          component="pre"
          sx={{
            m: 0, px: 1.5, py: 1,
            bgcolor: '#1e1b4b', color: '#e0e7ff',
            fontSize: 11, fontFamily: 'Consolas, Monaco, monospace',
            maxHeight: 360, overflow: 'auto',
            borderTop: '1px dashed #c084fc',
          }}
        >
          {isEmpty ? '(데이터 없음 — AI 분석에서 이 단계가 prefill 되지 않았거나 빈 객체)' : json}
        </Box>
      </Collapse>
    </Box>
  );
}

export default StepDataInspector;
