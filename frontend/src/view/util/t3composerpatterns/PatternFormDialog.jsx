import React, { useEffect, useState } from 'react';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  MenuItem,
  Alert,
  Box,
  Typography,
  Rating,
  Paper,
  Chip,
} from '@mui/material';

import { createPattern, updatePattern } from '../t3composer/api';
import PatternPreview from '../t3composer/PatternPreview';

const CATEGORIES = [
  { value: 'LAYOUT_SINGLE',       label: '01 미분할 (단일) (LAYOUT_SINGLE)' },
  { value: 'LAYOUT_V2',           label: '11 상하 2분할 (LAYOUT_V2)' },
  { value: 'LAYOUT_V3',           label: '12 상하 3분할 (LAYOUT_V3)' },
  { value: 'LAYOUT_V4',           label: '13 상하 4분할 (LAYOUT_V4)' },
  { value: 'LAYOUT_V5',           label: '14 상하 5+분할 (LAYOUT_V5)' },
  { value: 'LAYOUT_H2',           label: '21 좌우 2분할 (LAYOUT_H2)' },
  { value: 'LAYOUT_H3',           label: '22 좌우 3분할 (LAYOUT_H3)' },
  { value: 'LAYOUT_H4',           label: '23 좌우 4분할 (LAYOUT_H4)' },
  { value: 'LAYOUT_H5',           label: '24 좌우 5+분할 (LAYOUT_H5)' },
  { value: 'LAYOUT_MIXED',        label: '31 혼합·격자·특수 (LAYOUT_MIXED)' },
  { value: 'LAYOUT_CONTROLBOARD', label: '91 ControlBoard (LAYOUT_CONTROLBOARD)' },
  { value: 'LAYOUT_PLANEDIT',     label: '92 PlanEdit (LAYOUT_PLANEDIT)' },
  { value: 'LAYOUT_MONITORING',   label: '93 Monitoring (LAYOUT_MONITORING)' },
  { value: 'LAYOUT_ROUTELAYOUT',  label: '95 RouteLayout (LAYOUT_ROUTELAYOUT)' },
];

const EMPTY = {
  code:           '',
  layout:         '',
  category:       'LAYOUT_SINGLE',
  name:           '',
  nameEn:         '',
  description:    '',
  visual:         '',
  exampleFile:    '',
  frequency:      1,
  recommendedFor: '',
  componentStack: '',
  whenToUse:      '',
  sortOrder:      0,
  useYn:          'Y',
};

/**
 * 패턴 신규/수정 다이얼로그.
 *
 * props:
 *   open
 *   pattern   null 이면 신규, 객체면 수정
 *   onClose
 *   onSaved   저장 성공 시 호출
 */
function PatternFormDialog({ open, pattern, onClose, onSaved }) {
  const [form, setForm]     = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState(null);

  useEffect(() => {
    if (!open) return;
    if (pattern) {
      setForm({
        ...EMPTY,
        ...pattern,
        frequency: pattern.frequency ?? 1,
        sortOrder: pattern.sortOrder ?? 0,
      });
    } else {
      setForm(EMPTY);
    }
    setError(null);
  }, [open, pattern]);

  const update = (patch) => setForm((f) => ({ ...f, ...patch }));

  const handleSave = async () => {
    // 유효성 검증
    if (!form.code.trim())   return setError('CODE 는 필수입니다.');
    if (!form.layout.trim()) return setError('Layout 키는 필수입니다.');
    if (!form.name.trim())   return setError('이름은 필수입니다.');

    setSaving(true);
    setError(null);
    try {
      if (pattern && pattern.id) {
        await updatePattern(pattern.id, form);
      } else {
        await createPattern(form);
      }
      onSaved();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {pattern ? `패턴 편집 · ${pattern.code}` : '신규 패턴 등록'}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="CODE"
              size="small"
              placeholder="P40"
              value={form.code}
              onChange={(e) => update({ code: e.target.value.toUpperCase().trim() })}
              helperText="예: P01, P40. 고유값"
              required
              sx={{ width: 160 }}
            />
            <TextField
              label="Layout 키"
              size="small"
              placeholder="tree_grid"
              value={form.layout}
              onChange={(e) => update({ layout: e.target.value.trim() })}
              helperText="snake_case · JSON 프로퍼티 값으로 사용"
              required
              sx={{ flex: 1 }}
            />
            <TextField
              select
              label="카테고리"
              size="small"
              value={form.category}
              onChange={(e) => update({ category: e.target.value })}
              sx={{ minWidth: 220 }}
            >
              {CATEGORIES.map((c) => (
                <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
              ))}
            </TextField>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="이름 (한글)"
              size="small"
              value={form.name}
              onChange={(e) => update({ name: e.target.value })}
              required
              sx={{ flex: 1 }}
            />
            <TextField
              label="이름 (영문)"
              size="small"
              value={form.nameEn}
              onChange={(e) => update({ nameEn: e.target.value })}
              sx={{ flex: 1 }}
            />
          </Stack>

          <TextField
            label="설명"
            size="small"
            multiline
            minRows={2}
            value={form.description}
            onChange={(e) => update({ description: e.target.value })}
          />

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                ASCII 미니 다이어그램 (카드에 표시)
              </Typography>
              <TextField
                size="small"
                multiline
                minRows={7}
                value={form.visual}
                onChange={(e) => update({ visual: e.target.value })}
                placeholder={'┌──────────────────────┐\n│   컨텐츠             │\n└──────────────────────┘'}
                InputProps={{ sx: { fontFamily: 'Consolas, monospace', fontSize: 11 } }}
                fullWidth
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                Layout 미리보기 (HTML)
              </Typography>
              {form.layout ? (
                <PatternPreview layout={form.layout} />
              ) : (
                <Paper variant="outlined" sx={{ p: 2, minHeight: 168, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    Layout 키 입력 시 HTML 미리보기 표시
                  </Typography>
                </Paper>
              )}
              <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1 }}>
                ASCII 미리보기 (DB 저장용):
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  p: 1,
                  mt: 0.5,
                  minHeight: 80,
                  bgcolor: '#1e1e1e',
                  color: '#9cdcfe',
                  fontFamily: 'Consolas, monospace',
                  fontSize: 10,
                  whiteSpace: 'pre',
                  overflow: 'auto',
                }}
              >
                {form.visual || '(선택적 — ASCII 백업)'}
              </Paper>
            </Box>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="대표 JSX 파일"
              size="small"
              placeholder="view/dashboard/kpiboard/KpiBoard.jsx"
              value={form.exampleFile}
              onChange={(e) => update({ exampleFile: e.target.value })}
              helperText="선택적 · 참조 파일 경로"
              sx={{ flex: 1 }}
            />
            <TextField
              label="추천 키워드"
              size="small"
              placeholder="마스터, CRUD, 일반 조회"
              value={form.recommendedFor}
              onChange={(e) => update({ recommendedFor: e.target.value })}
              helperText="쉼표 구분"
              sx={{ flex: 1 }}
            />
          </Stack>

          <Stack direction="row" spacing={2} alignItems="center">
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                빈도 / 추천도
              </Typography>
              <Rating
                value={form.frequency ?? 1}
                max={3}
                onChange={(_, v) => update({ frequency: v ?? 1 })}
              />
            </Box>
            <TextField
              label="정렬 순서"
              type="number"
              size="small"
              value={form.sortOrder}
              onChange={(e) => update({ sortOrder: Number(e.target.value) || 0 })}
              sx={{ width: 130 }}
            />
            <TextField
              select
              label="활성"
              size="small"
              value={form.useYn}
              onChange={(e) => update({ useYn: e.target.value })}
              sx={{ width: 130 }}
            >
              <MenuItem value="Y">활성 (Y)</MenuItem>
              <MenuItem value="N">비활성 (N)</MenuItem>
            </TextField>
          </Stack>

          <TextField
            label="컴포넌트 스택 (선택)"
            size="small"
            multiline
            minRows={2}
            placeholder="ContentInner > SearchArea + BaseGrid"
            value={form.componentStack}
            onChange={(e) => update({ componentStack: e.target.value })}
          />

          <TextField
            label="언제 사용 (선택)"
            size="small"
            multiline
            minRows={2}
            placeholder="마스터 데이터 유지보수 · 사용자·메뉴·공통코드 관리"
            value={form.whenToUse}
            onChange={(e) => update({ whenToUse: e.target.value })}
          />

          {pattern && (
            <Stack direction="row" spacing={1}>
              <Chip
                label={`ID: ${pattern.id}`}
                size="small"
                variant="outlined"
                sx={{ fontFamily: 'monospace', fontSize: 10 }}
              />
              <Chip
                label={`생성: ${pattern.createBy || '-'} · ${pattern.createDttm || '-'}`}
                size="small"
                variant="outlined"
                sx={{ fontSize: 10 }}
              />
            </Stack>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>취소</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? '저장 중...' : (pattern ? '수정' : '등록')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default PatternFormDialog;
