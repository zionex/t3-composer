import React from 'react';

import {
  Box,
  Paper,
  Typography,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  Chip,
  Divider,
} from '@mui/material';

import { LAYERS, SP_STRATEGY } from './constants';

/**
 * Step 4 — Layer 별 SP 전략 선택.
 *
 * 각 레이어(조회/저장/삭제/팝업/차트/배치)마다:
 *   - SKIP: 해당 레이어 SP 없음
 *   - EXISTING: 기존 SP 재사용 (SP 이름 입력)
 *   - MANUAL: 직접 작성 예정 (스펙 자유 입력)
 *   - AI_GEN: Claude 로 생성 (요청 사항 자유 입력)
 *
 * 각 레이어별 AI_GEN 선택은 최종 생성 단계에서 해당 SP 만 타겟팅되어 토큰을 절약.
 */
function LayerSpStep({ module, screenId, value, onChange }) {
  const updateLayer = (layerKey, patch) => {
    onChange({
      ...value,
      [layerKey]: { ...(value[layerKey] || {}), ...patch },
    });
  };

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        화면 구성 레이어별로 SP 처리 방식을 선택하세요. <b>AI 생성</b> 은 해당 레이어에만 타겟팅되어
        큰 자연어 덤프보다 토큰을 훨씬 적게 사용합니다.
      </Typography>

      {LAYERS.map((layer) => {
        const v = value[layer.key] || { strategy: SP_STRATEGY.SKIP.key, spName: '', notes: '' };
        const strategy = v.strategy || SP_STRATEGY.SKIP.key;
        const recommendedSpName = screenId
          ? `SP_${screenId.replace(/^UI_/, 'UI_')}_${layer.spSuffix}`
          : `SP_UI_${module?.code || 'XX'}_NN_${layer.spSuffix}`;

        return (
          <Paper key={layer.key} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'flex-start' }}>
              {/* 좌측: 레이어 정보 */}
              <Box sx={{ minWidth: { md: 180 } }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {layer.name}
                  </Typography>
                  <Chip label={layer.spSuffix} size="small" sx={{ height: 18, fontSize: 10 }} />
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {layer.description}
                </Typography>
              </Box>

              {/* 우측: 전략 + 입력 */}
              <Box sx={{ flex: 1 }}>
                <ToggleButtonGroup
                  value={strategy}
                  exclusive
                  onChange={(_, val) => val && updateLayer(layer.key, { strategy: val })}
                  size="small"
                  sx={{ mb: 1.5 }}
                >
                  {Object.values(SP_STRATEGY).map((s) => (
                    <ToggleButton key={s.key} value={s.key} sx={{ textTransform: 'none', fontSize: 12, px: 1.5 }}>
                      {s.label}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>

                {strategy === SP_STRATEGY.SKIP.key && (
                  <Typography variant="caption" color="text.disabled">
                    이 레이어는 생성하지 않습니다.
                  </Typography>
                )}

                {strategy === SP_STRATEGY.EXISTING.key && (
                  <Stack spacing={1}>
                    <TextField
                      fullWidth
                      size="small"
                      label="재사용할 SP 이름"
                      placeholder="예: SP_UI_CM_03_Q1"
                      value={v.spName || ''}
                      onChange={(e) => updateLayer(layer.key, { spName: e.target.value })}
                      helperText="이 SP 를 호출하도록 화면 코드가 작성됩니다."
                    />
                  </Stack>
                )}

                {strategy === SP_STRATEGY.MANUAL.key && (
                  <Stack spacing={1}>
                    <TextField
                      fullWidth
                      size="small"
                      label="SP 이름 (작성 예정)"
                      placeholder={recommendedSpName}
                      value={v.spName || ''}
                      onChange={(e) => updateLayer(layer.key, { spName: e.target.value })}
                    />
                    <TextField
                      fullWidth
                      multiline
                      minRows={2}
                      size="small"
                      label="SP 설계 메모"
                      placeholder="파라미터 · 반환 컬럼 · 비즈니스 로직을 요약"
                      value={v.notes || ''}
                      onChange={(e) => updateLayer(layer.key, { notes: e.target.value })}
                    />
                    <Typography variant="caption" color="text.disabled">
                      화면 코드는 이 이름의 SP 가 있다고 가정하고 작성됩니다. 실제 SP 는 별도 작성.
                    </Typography>
                  </Stack>
                )}

                {strategy === SP_STRATEGY.AI_GEN.key && (
                  <Stack spacing={1}>
                    <TextField
                      fullWidth
                      size="small"
                      label="SP 이름"
                      placeholder={recommendedSpName}
                      value={v.spName || ''}
                      onChange={(e) => updateLayer(layer.key, { spName: e.target.value })}
                    />
                    <TextField
                      fullWidth
                      multiline
                      minRows={3}
                      size="small"
                      label="Claude 에 전달할 요청"
                      placeholder="예: 수요 계획 실적을 월별로 집계하여 반환. 파라미터: @PlanScope, @ItemCd, @StartDate, @EndDate. 반환: ITEM_CD, MONTH, QTY, AMT"
                      value={v.notes || ''}
                      onChange={(e) => updateLayer(layer.key, { notes: e.target.value })}
                      helperText="이 요청만으로 이 SP 가 생성됩니다. 간결하게 입력하세요."
                    />
                  </Stack>
                )}
              </Box>
            </Stack>
          </Paper>
        );
      })}

      <Divider />
      <Typography variant="caption" color="text.secondary">
        <b>토큰 절약 팁</b>: AI 생성은 필수적인 레이어(보통 조회·저장)에만 사용하고, 단순 삭제/팝업은
        MANUAL 이나 EXISTING 으로 설정하세요. Claude 호출 시 SKIP/MANUAL/EXISTING 레이어는 SP 본문
        생성을 요청하지 않아 응답 토큰이 절반 이하로 감소합니다.
      </Typography>
    </Stack>
  );
}

export default LayerSpStep;
