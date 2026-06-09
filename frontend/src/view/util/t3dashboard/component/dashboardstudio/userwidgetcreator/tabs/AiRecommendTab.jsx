import React, { useState } from 'react';
import {
  Box, Button, Card, CardContent, CardActions, TextField, Typography,
  CircularProgress, Alert, Stack, Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import SaveIcon from '@mui/icons-material/Save';
import { useDbMetadataSource } from '../hooks/useDbMetadataSource';
import { suggestWidget, saveWidgetToLibrary } from '../../../../restapi/widgetBuilder';

const VIZ_TYPES = ['bar', 'line', 'pie', 'table', 'kpi'];

function buildCatalogSummary(sources) {
  return sources.map(s => ({
    id: s.id || s.name,
    name: s.name,
    sourceType: s.table_type || 'STORED_PROCEDURE',
    description: s.comment || s.description || s.name,
    business_domain: s.business_domain,
    category: s.category,
    returnType: 'MIXED',
    params: [],
  }));
}

export default function AiRecommendTab({ userId }) {
  const { sources, domains } = useDbMetadataSource();

  const [prompt, setPrompt] = useState('');
  const [domainFilter, setDomainFilter] = useState('');
  const [suggesting, setSuggesting] = useState(false);
  const [suggestResult, setSuggestResult] = useState(null);
  const [suggestReason, setSuggestReason] = useState('');
  const [suggestError, setSuggestError] = useState(null);
  const [title, setTitle] = useState('');
  const [vizType, setVizType] = useState('bar');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const handleSuggest = async () => {
    if (!prompt.trim()) return;
    setSuggesting(true);
    setSuggestError(null);
    setSuggestResult(null);
    try {
      const filteredSources = domainFilter
        ? sources.filter(s => s.business_domain === domainFilter)
        : sources;
      const catalog = buildCatalogSummary(filteredSources);
      const res = await suggestWidget({
        user_id: userId || 'guest',
        prompt,
        catalog_summary: catalog,
        module_filter: domainFilter || null,
      });
      setSuggestResult(res.widget_spec);
      setSuggestReason(res.suggest_reason || '');
      setTitle(prompt.slice(0, 60));
      setVizType(res.widget_spec?.visualConfig?.type || 'bar');
    } catch (e) {
      setSuggestError(e?.message || 'AI 분석 중 오류가 발생했습니다.');
    } finally {
      setSuggesting(false);
    }
  };

  const handleSave = async () => {
    if (!suggestResult || !title.trim()) return;
    setSaving(true);
    setSaveMsg('');
    try {
      const spec_json = {
        ...suggestResult,
        widgetTitle: title,
        widgetType: vizType,
        visualConfig: { ...(suggestResult.visualConfig || {}), type: vizType },
      };
      await saveWidgetToLibrary({
        title,
        description: suggestReason,
        widget_type: vizType,
        spec_json,
        created_by: userId,
      });
      setSaveMsg('라이브러리에 저장되었습니다.');
      setSuggestResult(null);
      setPrompt('');
      setTimeout(() => setSaveMsg(''), 2500);
    } catch (e) {
      setSaveMsg('저장 실패: ' + (e?.message || ''));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack spacing={2} sx={{ maxWidth: 700, mx: 'auto' }}>
      <Card variant="outlined">
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1} sx={{ mb: 1.5 }}>
            <Box>
              <Typography variant="subtitle2" fontWeight={700}>원하는 위젯을 설명해 주세요</Typography>
              <Typography variant="caption" color="text.secondary">
                보고 싶은 지표, 업무 영역, 차트 형태를 자유롭게 입력하세요.
              </Typography>
            </Box>
            {domains.length > 0 && (
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>업무 도메인</InputLabel>
                <Select value={domainFilter} label="업무 도메인" onChange={e => setDomainFilter(e.target.value)}>
                  <MenuItem value="">전체</MenuItem>
                  {domains.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                </Select>
              </FormControl>
            )}
          </Stack>
          <TextField
            fullWidth multiline minRows={2} maxRows={4} size="small"
            placeholder="예: 공장별 월간 매출 실적을 막대 차트로 보여줘"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => { if (e.ctrlKey && e.key === 'Enter') handleSuggest(); }}
          />
        </CardContent>
        <CardActions sx={{ px: 2, pt: 0, pb: 1.5, justifyContent: 'flex-end' }}>
          <Button
            variant="contained" size="small"
            onClick={handleSuggest}
            disabled={suggesting || !prompt.trim()}
            startIcon={suggesting ? <CircularProgress size={14} color="inherit" /> : <AutoFixHighIcon />}
          >
            AI 분석
          </Button>
        </CardActions>
      </Card>

      {suggestError && <Alert severity="error">{suggestError}</Alert>}
      {saveMsg && <Alert severity={saveMsg.startsWith('저장 실패') ? 'error' : 'success'}>{saveMsg}</Alert>}

      {suggestResult && (
        <Card variant="outlined" sx={{ borderColor: '#bfdbfe' }}>
          <CardContent>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>AI 추천 결과</Typography>
            {suggestReason && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>{suggestReason}</Typography>
            )}
            <Stack spacing={1.5}>
              <FormControl size="small" fullWidth>
                <InputLabel>차트 타입</InputLabel>
                <Select value={vizType} label="차트 타입" onChange={e => setVizType(e.target.value)}>
                  {VIZ_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField
                label="위젯 제목" size="small" fullWidth
                value={title} onChange={e => setTitle(e.target.value)}
              />
            </Stack>
          </CardContent>
          <CardActions sx={{ px: 2, pt: 0, pb: 1.5, justifyContent: 'flex-end' }}>
            <Button
              variant="contained" size="small"
              startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <SaveIcon />}
              disabled={saving || !title.trim()}
              onClick={handleSave}
            >
              라이브러리 저장
            </Button>
          </CardActions>
        </Card>
      )}
    </Stack>
  );
}
