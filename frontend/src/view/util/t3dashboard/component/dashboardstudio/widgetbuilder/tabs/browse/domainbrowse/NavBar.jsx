import React from 'react';
import { Box, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function NavBar({ canNext = true, nextLabel = '다음', onNext, showCreate = false, onBack, onCreateWidget }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.25, borderTop: '1px solid #f1f5f9', bgcolor: '#fafafa', flexShrink: 0 }}>
      <Button size="medium" startIcon={<ArrowBackIcon />} onClick={onBack}>
        이전
      </Button>
      {showCreate ? (
        <Button size="medium" variant="contained" startIcon={<AddIcon />} onClick={onCreateWidget} disabled={!canNext}>
          위젯 추가
        </Button>
      ) : (
        <Button size="medium" variant="contained" onClick={onNext} disabled={!canNext}>
          {nextLabel}
        </Button>
      )}
    </Box>
  );
}
