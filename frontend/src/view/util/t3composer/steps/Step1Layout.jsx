import React, { useCallback, useMemo } from 'react';
import { Box, Typography, Stack, Paper, Chip, Alert } from '@mui/material';

import LayoutDesigner from '../LayoutDesigner';
import StepDataInspector from '../StepDataInspector';
import {
  defaultLayoutConfigForPattern,
  layersToAreas,
  inferPatternFromLayers,
  FALLBACK_LAYER_KEYS,
} from '../wizardState';

/**
 * Step1 — Layout 구성.
 *
 * (2026-04 보완) UI 패턴 카탈로그 노출을 제거하고 LayoutDesigner 한 화면으로 통일.
 * Layer 추가 / 삭제 / 위치 D&D / 4방향 drop / SplitBar 간격 조절 / 우클릭 컨텍스트 메뉴
 * 모두 LayoutDesigner 가 처리한다 (NEW_FROM_DESIGN 의 StepLayout 과 동일 컴포넌트 재사용).
 *
 * value 구조:
 *   { patternCode, areas, layoutConfig }
 *     · layoutConfig 가 SoT — LayoutDesigner 가 직접 편집
 *     · areas / patternCode 는 layers 에서 자동 derive (Step3+ 의 areaId 참조 호환)
 */
// eslint-disable-next-line no-unused-vars
function Step1Layout({ value, recommendedPatterns, onChange }) {
  // value.layoutConfig 가 비어 있으면 P02 기본값 (defensive — prefill 함수가 이미 채워야 정상).
  // 비정상 경로에서도 areas[].id 에 들어있던 BaseGrid id 를 layers[].key 로 보존해
  // step3~6 prefill 키와의 정합성 유지.
  const layoutConfig = useMemo(() => {
    if (value?.layoutConfig && Array.isArray(value.layoutConfig.layers)) {
      return value.layoutConfig;
    }
    const baseLayers = Array.isArray(value?.areas)
      ? value.areas
          .filter((a) => a && a.kind !== 'search')
          .map((a) => ({ key: a.id, title: a.title }))
      : null;
    return defaultLayoutConfigForPattern(value?.patternCode || 'P02', { baseLayers });
  }, [value]);

  // LayoutDesigner 의 onChange — layers 변경분을 받아 areas / patternCode 도 자동 sync.
  // (NEW_FROM_COPY 회귀 방지) LayoutDesigner 의 자체 정상화 emit 으로 baseline 의
  // 실제 BaseGrid id (예: 'userInfoGrid') 가 generic fallback ('mainGrid' 등) 로 리셋되면
  // invalidateDownstream 단계에서 step3~6 prefill 데이터가 함께 손실됨 → 같은 인덱스의
  // 직전 layer.key 가 real key 였다면 보존.
  const handleLayoutChange = useCallback((nextConfig) => {
    if (!nextConfig) return;
    const prevLayers = (value?.layoutConfig?.layers) || [];
    let layers = Array.isArray(nextConfig.layers) ? nextConfig.layers : [];
    if (layers.length === prevLayers.length && layers.length > 0) {
      layers = layers.map((l, i) => {
        const prev = prevLayers[i];
        if (prev && prev.key
            && !FALLBACK_LAYER_KEYS.has(prev.key)
            && FALLBACK_LAYER_KEYS.has(l.key)) {
          return { ...l, key: prev.key, title: prev.title || l.title };
        }
        return l;
      });
    }
    const merged = { ...nextConfig, layers };
    const areas = layersToAreas(merged);
    const patternCode = inferPatternFromLayers(merged.layers);
    onChange({
      ...value,
      patternCode,
      areas,
      layoutConfig: merged,
    });
  }, [onChange, value]);

  const layerCount = layoutConfig.layers?.length || 0;
  const filterVisible = !!(layoutConfig.filterBar
    && ((layoutConfig.filterBar.items?.length || 0) > 0
        || (layoutConfig.filterBar.h || 0) > 0));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <StepDataInspector
        title="Step 1 — Layout 전체 데이터 (AI 분석 결과)"
        data={value}
        summary={[
          { label: `Layer ${layerCount}` },
          { label: `FilterBar ${layoutConfig.filterBar?.items?.length || 0}` },
          ...(value?.patternCode ? [{ label: value.patternCode }] : []),
        ]}
      />
      <Typography variant="body2" color="text.secondary">
        화면 레이아웃을 직접 구성하세요. 우상단의 <b>Layer 추가</b> 버튼 또는 Layer
        위에서 <b>마우스 우클릭</b> 으로 분할/삭제할 수 있고, Layer 사이 경계는
        <b> Split Bar 로 드래그</b> 해서 비율을 조정합니다.
        Layer Head 를 다른 Layer 위로 끌어 놓으면 <b>상·하·좌·우</b> 4방향에 배치할 수 있고,
        이동 후 잔여 공간은 자동으로 정리됩니다.
      </Typography>

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Chip
          size="small"
          color={layerCount > 0 ? 'success' : 'default'}
          variant={layerCount > 0 ? 'filled' : 'outlined'}
          label={`Layer ${layerCount}개`}
        />
        <Chip
          size="small"
          color={filterVisible ? 'primary' : 'default'}
          variant={filterVisible ? 'filled' : 'outlined'}
          label={filterVisible
            ? `FilterBar · 항목 ${layoutConfig.filterBar.items?.length || 0}개`
            : 'FilterBar · 비활성'}
        />
        {value?.patternCode && (
          <Chip size="small" variant="outlined"
                label={`자동 추론: ${value.patternCode}`} />
        )}
      </Stack>

      {layerCount === 0 && (
        <Alert severity="info" sx={{ py: 0.5 }}>
          아직 Layer 가 없습니다. 우상단 <b>"Layer 추가"</b> 버튼을 눌러 첫 Layer 를 만드세요.
        </Alert>
      )}

      <Paper variant="outlined" sx={{
        p: 1.2, borderRadius: 2,
        minHeight: 520, height: 'calc(100vh - 360px)',
        display: 'flex', flexDirection: 'column',
      }}>
        <LayoutDesigner
          value={layoutConfig}
          onChange={handleLayoutChange}
          readOnly={false}
        />
      </Paper>
    </Box>
  );
}

export default Step1Layout;
