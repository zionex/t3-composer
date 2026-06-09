import React, { useState } from 'react';
import {
  Box, Grid, Card, CardContent, CardActions, Typography, Chip,
  IconButton, Button, TextField, InputAdornment, CircularProgress, Tooltip, Stack,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import { MODULE_COLORS } from '../../popup/steps/wizardConstants';
import { parseWidgetSpec } from '../../generic/widgetSpecAdapter';

function WidgetThumbnail({ type }) {
  const normalized = type || 'widget';
  const isLine = ['line', 'area', 'bar_line'].includes(normalized);
  const isPie = ['pie', 'doughnut'].includes(normalized);
  const isTable = normalized === 'table';

  return (
    <Box sx={{ height: 80, borderRadius: '8px', border: '1px solid #e5eaf2', bgcolor: '#f8fafc', overflow: 'hidden', position: 'relative', mb: 1 }}>
      {isPie ? (
        <Box sx={{ width: 44, height: 44, borderRadius: '50%', bgcolor: '#dbeafe', border: '10px solid #3b82f6', position: 'absolute', left: 18, top: 14 }} />
      ) : isTable ? (
        <Box sx={{ p: 1 }}>
          {[0, 1, 2].map((r) => (
            <Box key={r} sx={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr 0.8fr', gap: 0.5, mb: 0.5 }}>
              {[0, 1, 2].map((c) => (
                <Box key={c} sx={{ height: 9, borderRadius: 1, bgcolor: r === 0 ? '#cbd5e1' : '#e2e8f0' }} />
              ))}
            </Box>
          ))}
        </Box>
      ) : isLine ? (
        <>
          <Box sx={{ position: 'absolute', inset: 10, borderLeft: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }} />
          <Box sx={{ position: 'absolute', left: 18, right: 16, top: 34, height: 3, bgcolor: '#3b82f6', transform: 'rotate(-10deg)', transformOrigin: 'left center', borderRadius: 2 }} />
        </>
      ) : (
        <Stack direction="row" alignItems="flex-end" spacing={0.5} sx={{ position: 'absolute', left: 14, right: 14, bottom: 10, height: 52 }}>
          {[38, 22, 48, 28, 42].map((h, i) => (
            <Box key={i} sx={{ flex: 1, height: h, borderRadius: '4px 4px 0 0', bgcolor: i === 0 ? '#3b82f6' : '#93c5fd' }} />
          ))}
        </Stack>
      )}
    </Box>
  );
}

export default function WidgetSelectTab({ library, libraryLoading, isAdmin, onSelect, onDelete }) {
  const [search, setSearch] = useState('');

  const filtered = (library || []).filter(w =>
    !search.trim() || (w.title || '').toLowerCase().includes(search.trim().toLowerCase())
  );

  if (libraryLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <TextField
          size="small"
          fullWidth
          placeholder="위젯 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
        />
      </Box>

      {filtered.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          {search ? '검색 결과가 없습니다.' : '저장된 위젯이 없습니다.'}
        </Typography>
      ) : (
        <Grid container spacing={1.5}>
          {filtered.map(widget => (
            <Grid item xs={12} sm={6} md={4} key={widget.id}>
              <Card variant="outlined" sx={{ borderColor: '#e5eaf2', borderRadius: '8px', height: '100%' }}>
                <CardContent sx={{ pb: 1 }}>
                  <WidgetThumbnail type={widget.widget_type || parseWidgetSpec(widget.spec_json).visualConfig?.type} />
                  <Typography sx={{ fontSize: 13, fontWeight: 800, color: '#1e293b' }} noWrap>
                    {widget.title}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                    {widget.widget_type && (
                      <Chip size="small" label={widget.widget_type}
                        sx={{ height: 20, bgcolor: '#eff6ff', color: '#2563eb', fontWeight: 700 }} />
                    )}
                    {widget.module && (
                      <Chip size="small" label={widget.module}
                        sx={{ height: 20,
                          bgcolor: MODULE_COLORS[widget.module] || '#f1f5f9',
                          color: MODULE_COLORS[widget.module] ? 'white' : '#475569',
                          fontWeight: 700 }} />
                    )}
                  </Box>
                  {widget.description && (
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }} noWrap>
                      {widget.description}
                    </Typography>
                  )}
                </CardContent>
                <CardActions sx={{ pt: 0, justifyContent: 'flex-end', gap: 0.5 }}>
                  {isAdmin && onDelete && (
                    <Tooltip title="삭제">
                      <IconButton size="small" color="error" onClick={() => onDelete(widget.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {onSelect && (
                    <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => onSelect(widget)}>
                      선택
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
