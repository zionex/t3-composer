import React from 'react';
import { Box, Typography, Paper, Stack, Chip, Divider, Alert, Button, TextField } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

import StepDataInspector from '../StepDataInspector';
import { toLlmPayload } from '../wizardState';

/**
 * Step9 — 최종 요약 + LLM 호출.
 * 수집된 모든 9단계 JSON 을 표시하고, "생성 시작" 버튼이 외부(StepByStepWizard) 에서 호출한다.
 *
 * NEW_FROM_COPY 모드일 때 (`spec.sourceMenu` 가 있는 경우):
 *   - 원본 메뉴 정보 카드 표시
 *   - "추가 변경 요청" 자유 텍스트 입력란 (spec.changeReq) 표시
 *     → buildStepPrompt 가 prompt 끝에 첨부
 */
function Step9Generate({ spec, module, pattern, onStart, starting, error, onChangeReqUpdate }) {
  const payload = toLlmPayload(spec, module, pattern);
  const areaCount       = spec.step1_layout.areas.length;
  const componentCount  = Object.values(spec.step3_components).reduce((n, a) => n + (a.components?.length || 0), 0);
  const columnTotal     = Object.values(spec.step5_columns).reduce((n, a) => n + (a.columns?.length || 0), 0);
  const filterFieldCount = spec.step7_filter.fields.length;

  const isCopyMode   = !!spec.sourceMenu;
  const isDesignMode = !!spec.designDoc;

  return (
    <Box>
      <StepDataInspector
        title="Step 9 — LLM 에 전송될 전체 Payload (모든 9단계 통합)"
        data={payload}
        summary={[
          { label: `${areaCount} areas` },
          { label: `${componentCount} components` },
          { label: `${columnTotal} columns` },
          { label: `${filterFieldCount} filter fields` },
        ]}
      />
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        아래 요약을 확인한 후 <b>생성 시작</b> 을 클릭하면 Claude 세션이 생성되고, 수집된 9단계 스펙이
        LLM 에 전달되어 JSX · MENU_SQL 산출물이 생성됩니다.
      </Typography>

      {isCopyMode && (
        <Paper variant="outlined" sx={{
          p: 2, borderRadius: 2, mb: 2, bgcolor: '#f0fdf4', borderColor: '#bbf7d0',
        }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: '#15803d' }}>
            🗐 복사 기반 생성 (NEW_FROM_COPY)
          </Typography>
          <Stack spacing={0.5}>
            <Row label="원본 메뉴" value={spec.sourceMenu.menuCd || '-'} mono />
            <Row label="원본 경로" value={spec.sourceMenu.filePath || '-'} mono />
            <Row label="신규 메뉴" value={spec.step2_overview.menuCd || '-'} mono />
            <Row label="신규 경로" value={spec.step2_overview.menuFilePath || '-'} mono />
          </Stack>
        </Paper>
      )}

      {isDesignMode && (
        <Paper variant="outlined" sx={{
          p: 2, borderRadius: 2, mb: 2, bgcolor: '#eff6ff', borderColor: '#bfdbfe',
        }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: '#1d4ed8' }}>
            📋 설계서 기반 생성 (NEW_FROM_DESIGN)
          </Typography>
          <Stack spacing={0.5}>
            <Row label="설계서 파일" value={spec.designDoc.fileName || '-'} mono />
            <Row label="레이아웃" value={
              spec.designDoc.layoutSummary
                ? `${spec.designDoc.layoutSummary.typeLabel || '-'} · grid ${spec.designDoc.layoutSummary.gridCount || 0}개`
                : '-'
            } />
            <Row label="시트 수" value={`${(spec.designDoc.sheetNames || []).length}개`} />
            <Row label="대상 메뉴" value={spec.step2_overview.menuCd || '-'} mono />
          </Stack>
        </Paper>
      )}

      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, mb: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700 }}>생성 요약</Typography>
        <Stack spacing={1}>
          <Row label="모듈"            value={module ? `${module.code} · ${module.nameKo || module.name}` : '-'} />
          <Row label="패턴"            value={pattern ? `${pattern.code} · ${pattern.name}` : '-'} />
          <Row label="화면 ID"         value={spec.step2_overview.screenId || '-'} />
          <Row label="화면명"          value={spec.step2_overview.screenName || '-'} />
          <Row label="MENU_CD"         value={spec.step2_overview.menuCd || '-'} />
          <Row label="MENU_FILE_PATH"  value={spec.step2_overview.menuFilePath || '-'} />
          <Row label="Parent Menu"     value={spec.step2_overview.parentMenuCd || '-'} />
          <Divider />
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip size="small" label={`Areas: ${areaCount}`} color="primary" />
            <Chip size="small" label={`Components: ${componentCount}`} color="primary" variant="outlined" />
            <Chip size="small" label={`Columns: ${columnTotal}`} color="primary" variant="outlined" />
            <Chip size="small" label={`FilterBar fields: ${filterFieldCount}`} color="primary" variant="outlined" />
            <Chip size="small" label={`Cascade rules: ${Object.values(spec.step6_cascade).reduce((n, a) => n + (a.rules?.length || 0), 0)}`} variant="outlined" />
            <Chip size="small" label={`Filter deps: ${spec.step8_filterCascade.dependencies.length}`} variant="outlined" />
          </Stack>
        </Stack>
      </Paper>

      {/* NEW_FROM_COPY / NEW_FROM_DESIGN · 추가 변경 요청 */}
      {(isCopyMode || isDesignMode) && (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.8, color: '#0f172a' }}>
            추가 변경 요청 (자유 텍스트, 선택)
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', mb: 1, color: '#64748b' }}>
            9단계에서 이미 입력한 변경 사항 외에 LLM 에 전달할 추가 지시가 있으면 입력하세요.
            예) "저장 버튼 클릭 시 이메일 발송 로직 추가", "그리드 컬럼 색상 강조" 등.
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={3}
            maxRows={8}
            placeholder="필요 시 자유롭게 입력 (없으면 비워두기)"
            value={spec.changeReq || ''}
            onChange={(e) => onChangeReqUpdate?.(e.target.value)}
          />
        </Paper>
      )}

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2, bgcolor: '#fafafa' }}>
        <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
          LLM 전달 payload (미리보기)
        </Typography>
        <Box component="pre" sx={{
          m: 0, fontSize: 11, fontFamily: 'Consolas, monospace',
          maxHeight: 280, overflow: 'auto', whiteSpace: 'pre-wrap',
        }}>
          {JSON.stringify(payload, null, 2)}
        </Box>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Button
        variant="contained"
        startIcon={<PlayArrowIcon />}
        onClick={onStart}
        disabled={starting}
        size="large"
      >
        {starting ? '세션 생성 중...' : 'AI Support 로 생성 시작(Claude)'}
      </Button>
    </Box>
  );
}

function Row({ label, value, mono }) {
  return (
    <Stack direction="row" spacing={2}>
      <Typography variant="caption" color="text.secondary" sx={{ width: 140, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          fontWeight: 500, wordBreak: 'break-all',
          fontFamily: mono ? 'Consolas, monospace' : undefined,
        }}
      >
        {value}
      </Typography>
    </Stack>
  );
}

export default Step9Generate;
