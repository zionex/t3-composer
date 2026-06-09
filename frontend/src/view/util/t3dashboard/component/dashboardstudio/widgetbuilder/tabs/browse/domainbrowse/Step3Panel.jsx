import React from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  Grid,
  Stack,
  Typography,
} from '@mui/material';

import { CandidateCard, LibraryWidgetCard, SectionTitle } from './DomainBrowseShared';

export default function Step3Panel({
  step4Tab,
  setStep4Tab,
  candidates,
  candidatesLoading,
  candidatesError,
  selectedTables,
  setSelectedTables,
  isAdmin,
  openCandidateSource,
  libraryLoading,
  relatedWidgets,
  onSelect,
  setInfoWidget,
}) {
  function handleToggleTable(name) {
    setSelectedTables((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  }

  return (
    <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Stack direction="row" spacing={0} sx={{ px: 2.5, pt: 1.5, borderBottom: '1px solid #f1f5f9', flexShrink: 0, bgcolor: 'white' }}>
        {[
          { key: 'candidates', label: `데이터 테이블 후보 (${candidates.length})` },
          { key: 'library', label: `라이브러리 위젯 (${relatedWidgets.length})` },
        ].map(({ key, label }) => (
          <Box key={key} onClick={() => setStep4Tab(key)}
            sx={{
              px: 1.5, pb: 1, cursor: 'pointer', fontSize: 14,
              fontWeight: step4Tab === key ? 900 : 700,
              color: step4Tab === key ? 'primary.main' : 'text.secondary',
              borderBottom: step4Tab === key ? '2px solid' : '2px solid transparent',
              borderColor: step4Tab === key ? 'primary.main' : 'transparent',
            }}>
            {label}
          </Box>
        ))}
      </Stack>

      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', p: 2.5 }}>
        {step4Tab === 'candidates' && (
          <>
            {candidatesLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}>
                <CircularProgress size={28} />
              </Box>
            )}
            {!candidatesLoading && candidatesError && <Alert severity="error">{candidatesError}</Alert>}
            {!candidatesLoading && !candidatesError && candidates.length === 0 && (
              <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center', fontSize: 14 }}>
                매칭되는 테이블 후보가 없습니다.
              </Typography>
            )}
            {!candidatesLoading && !candidatesError && candidates.length > 0 && (
              <>
                <SectionTitle title="사용할 테이블" count={`${selectedTables.size}개 선택`} />
                <Grid container spacing={2}>
                  {candidates.map((c) => (
                    <Grid item xs={12} sm={6} md={4} key={c.table_name}>
                      <CandidateCard candidate={c} selected={selectedTables.has(c.table_name)}
                        isAdmin={isAdmin}
                        onOpenSource={openCandidateSource}
                        onToggle={handleToggleTable} />
                    </Grid>
                  ))}
                </Grid>
              </>
            )}
          </>
        )}
        {step4Tab === 'library' && (
          libraryLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : relatedWidgets.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center', fontSize: 14 }}>
              관련 테이블로 매칭되는 라이브러리 위젯이 없습니다.
            </Typography>
          ) : (
            <Grid container spacing={2}>
              {relatedWidgets.map((widget) => (
                <Grid item xs={12} sm={6} md={4} key={widget.id ?? `${widget.title}-${widget.widget_type}`}>
                  <LibraryWidgetCard widget={widget} onAdd={(w) => onSelect?.(w)} onInfo={setInfoWidget} />
                </Grid>
              ))}
            </Grid>
          )
        )}
      </Box>
    </Box>
  );
}
