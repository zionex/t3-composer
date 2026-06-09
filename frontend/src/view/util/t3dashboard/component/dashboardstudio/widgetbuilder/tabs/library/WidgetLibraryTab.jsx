import React, { useMemo, useState } from 'react';
import {
  Alert, Box, Button, Card, CardActions, CardContent, Chip, CircularProgress,
  Grid, IconButton, InputAdornment, TextField, Tooltip, Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SearchIcon from '@mui/icons-material/Search';
import { MODULE_COLORS } from '../direct/steps/wizardConstants';
import { parseWidgetSpec } from '../../../generic/widgetSpecAdapter';
import WidgetInfoDialog from '../../dialogs/WidgetInfoDialog';
import WidgetThumbnail from '../../../core/WidgetThumbnail';

function getWidgetType(widget) {
  if (widget?.widget_type) return widget.widget_type;
  return parseWidgetSpec(widget?.spec_json).visualConfig?.type;
}

export default function WidgetLibraryTab({
  library,
  libraryLoading,
  isAdmin = false,
  onSelect,
  onDelete,
  onSaveEdit,
  saveMsg,
  showSearch = true,
  canDelete,
  emptyActionLabel,
  onEmptyAction,
  thumbnailHeight = 80,
  thumbnailScale = 1.75,
  showTypeLabel = false,
  cardSx,
  sx,
}) {
  const [search, setSearch] = useState('');
  const [infoWidget, setInfoWidget] = useState(null);
  const showDelete = canDelete ?? (isAdmin && Boolean(onDelete));

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return library || [];
    return (library || []).filter(w => (w.title || '').toLowerCase().includes(term));
  }, [library, search]);

  const handleSaveEdit = onSaveEdit
    ? (payload) => onSaveEdit(infoWidget, payload)
    : undefined;

  if (libraryLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', overflow: 'auto', ...sx }}>
      {saveMsg && (
        <Alert severity={saveMsg.startsWith('저장 실패') ? 'error' : 'success'} sx={{ mb: 1.5 }}>
          {saveMsg}
        </Alert>
      )}

      {showSearch && (
        <Box sx={{ mb: 2 }}>
          <TextField
            size="small"
            fullWidth
            placeholder="위젯 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      )}

      {filtered.length === 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 6, gap: 2 }}>
          <Typography color="text.secondary">
            {search ? '검색 결과가 없습니다.' : '저장된 위젯이 없습니다.'}
          </Typography>
          {!search && onEmptyAction && (
            <Button variant="outlined" onClick={onEmptyAction}>
              {emptyActionLabel || '위젯 생성하기'}
            </Button>
          )}
        </Box>
      ) : (
        <Grid container spacing={1.5}>
          {filtered.map(widget => {
            const widgetType = getWidgetType(widget);
            return (
              <Grid item xs={12} sm={6} md={4} key={widget.id}>
                <Card
                  variant="outlined"
                  sx={{
                    height: '100%',
                    borderColor: '#e5eaf2',
                    borderRadius: '8px',
                    bgcolor: '#fff',
                    ...cardSx,
                  }}
                >
                  <CardContent sx={{ pb: 1 }}>
                    <WidgetThumbnail
                      type={widgetType}
                      height={thumbnailHeight}
                      scale={thumbnailScale}
                      marginBottom={1.25}
                      showTypeLabel={showTypeLabel}
                    />
                    <Typography sx={{ fontSize: 13, fontWeight: 800, color: '#1e293b' }} noWrap>
                      {widget.title}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                      {widgetType && (
                        <Chip size="small" label={widgetType}
                          sx={{ height: 22, bgcolor: '#eff6ff', color: '#2563eb', fontWeight: 800 }} />
                      )}
                      {widget.module && (
                        <Chip size="small" label={widget.module}
                          sx={{
                            height: 22,
                            bgcolor: MODULE_COLORS[widget.module] || '#f1f5f9',
                            color: MODULE_COLORS[widget.module] ? 'white' : '#475569',
                            fontWeight: 800,
                          }} />
                      )}
                    </Box>
                    {widget.description && (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }} noWrap>
                        {widget.description}
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions sx={{ pt: 0, justifyContent: 'flex-end', gap: 0.5 }}>
                    <Tooltip title="위젯 정보">
                      <IconButton size="small" onClick={() => setInfoWidget(widget)}>
                        <InfoOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {showDelete && onDelete && (
                      <Tooltip title="삭제">
                        <IconButton size="small" color="error" onClick={() => onDelete(widget.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <WidgetInfoDialog
        widget={infoWidget}
        onClose={() => setInfoWidget(null)}
        onSaveEdit={handleSaveEdit}
        onSelect={onSelect ? (w) => { onSelect(w); setInfoWidget(null); } : undefined}
      />
    </Box>
  );
}
