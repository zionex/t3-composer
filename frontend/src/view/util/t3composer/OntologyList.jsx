import React from 'react';

import {
  Box,
  List,
  ListItemButton,
  ListItemText,
  Checkbox,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';

/**
 * 온톨로지 항목 다중선택 리스트 — presentational(상태 비보유).
 * OntologyPickerDialog · DataSourcePickerDialog 의 Ontology 탭이 공유한다.
 *
 * props:
 *   items        — 표시할(필터링된) 항목 [{ category, key, title, subtitle }]
 *   totalCount   — 필터 전 전체 수 (null 이면 items.length) — "검색 결과 없음" vs "항목 없음" 분기
 *   loading, error
 *   isSelected(item) → boolean
 *   onToggle(item)
 *   onHover(item)  — 행 hover 시 호출 (우측 미리보기 패널 미리 로드용)
 *   emptyText    — 전체가 비었을 때 문구
 *   itemKey(item) → string (React key) — 기본 `${category}_${key}`
 *   dark         — JARVIS 다크 테마 (기본 false = 라이트)
 */
function OntologyList({
  items = [],
  totalCount = null,
  loading = false,
  error = null,
  isSelected,
  onToggle,
  onHover,
  emptyText = '항목이 없습니다.',
  itemKey,
  dark = false,
}) {
  const keyOf = itemKey || ((it) => `${it.category}_${it.key}`);
  const total = totalCount == null ? items.length : totalCount;

  const cbSx = dark
    ? { p: 0.5, mr: 1, color: 'rgba(56,189,248,0.55)', '&.Mui-checked': { color: '#38bdf8' } }
    : { p: 0.5, mr: 1 };

  return (
    <Box sx={{
      flex: 1, overflowY: 'auto', minHeight: 0,
      border: dark ? '1px solid rgba(56,189,248,0.28)' : '1px solid rgba(0,0,0,0.12)',
      borderRadius: 1,
      bgcolor: dark ? 'rgba(9,20,38,0.55)' : 'transparent',
    }}>
      {loading && (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <CircularProgress size={22} sx={dark ? { color: '#38bdf8' } : undefined} />
        </Box>
      )}
      {error && <Alert severity="error" sx={{ m: 1 }}>{String(error)}</Alert>}

      {!loading && items.length === 0 && (
        <Box sx={{ p: 3 }}>
          <Typography variant="body2" align="center"
                      sx={{ color: dark ? '#5b7a92' : 'text.secondary' }}>
            {total === 0 ? emptyText : '검색 결과가 없습니다.'}
          </Typography>
        </Box>
      )}

      <List dense disablePadding>
        {items.map((it) => {
          const sel = isSelected ? isSelected(it) : false;
          return (
            <ListItemButton
              key={keyOf(it)}
              onClick={() => onToggle && onToggle(it)}
              onMouseEnter={() => onHover && onHover(it)}
              sx={{
                py: 0.5,
                ...(dark && { '&:hover': { bgcolor: 'rgba(56,189,248,0.10)' } }),
              }}
            >
              <Checkbox edge="start" checked={sel} tabIndex={-1} disableRipple size="small" sx={cbSx} />
              <ListItemText
                primary={
                  <Typography variant="body2"
                              sx={{ fontSize: 12, fontWeight: 500, color: dark ? '#dffaff' : 'inherit' }}>
                    {it.title}
                  </Typography>
                }
                secondary={it.subtitle ? (
                  <Typography variant="caption" noWrap
                              sx={{ fontSize: 10, color: dark ? '#5b7a92' : 'text.disabled' }}>
                    {it.subtitle}
                  </Typography>
                ) : null}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );
}

export default OntologyList;
