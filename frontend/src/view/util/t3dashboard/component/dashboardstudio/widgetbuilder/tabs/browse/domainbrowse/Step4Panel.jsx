import React from 'react';
import { Alert, Box } from '@mui/material';

import Step4_VisualAndPreview from '../../direct/steps/Step4_VisualAndPreview';

export default function Step4Panel({
  visualDataSources,
  selectedMetrics,
  visualDraft,
  setVisualConfigs,
  visualTestResults,
}) {
  const measureMissingTables = visualDataSources
    .filter((ds) => selectedMetrics.size > 0 && !(ds.columnMeta || []).some((c) => c.role === 'measure'))
    .map((ds) => ds.sourceName);

  return (
    <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', p: 2 }}>
      {visualDataSources.length === 0 ? (
        <Alert severity="info">선택된 데이터 테이블이 없습니다. 이전 단계에서 테이블을 선택하세요.</Alert>
      ) : (
        <>
          {measureMissingTables.length > 0 && (
            <Alert severity="warning" sx={{ mb: 1.5 }}>
              다음 테이블에는 선택한 지표({[...selectedMetrics].join(', ')}) 컬럼이 없어
              차트 미리보기가 정확하지 않을 수 있습니다: <strong>{measureMissingTables.join(', ')}</strong>
            </Alert>
          )}
          <Step4_VisualAndPreview
            draft={visualDraft}
            onDraftChange={(patch) => {
              if (patch.visualConfigs) setVisualConfigs(patch.visualConfigs);
            }}
            testResults={visualTestResults}
          />
        </>
      )}
    </Box>
  );
}
