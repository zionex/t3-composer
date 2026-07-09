// =============================================================================
// glass — 파스텔 글래스모피즘 토큰 + AI Gradient + 공용 헬퍼
//
// - GLASS: 반투명 배경 · blur · 보더 · 그림자 (aqua-30 RGB 10,136,168 tint)
// - AI_GRADIENT: Figma "AI Gradient · 포인트 전용" 정본 — Composer 자체 UI 의
//   AI 표면 강조 (뱃지·버튼·그라디언트 박스) 전용.
// - glassPanel(): embossedPaper() 대체용 sx 생성.
// - InfoDot: 짧은 라벨 옆에 두는 도움말 점 — Tooltip 으로 장문 설명 노출.
// =============================================================================

import React from 'react';
import Tooltip from '@mui/material/Tooltip';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { atomicColors } from './atomicColors';
import { PALETTE } from './semanticTokens';

const A = atomicColors.color.aqua;

// AI Gradient — Figma "AI Gradient · 포인트 전용" 정본. 135° 방향, aqua ladder 기반.
export const AI_GRADIENT = `linear-gradient(135deg, ${A[70]} 0%, ${A[50]} 50%, ${A[30]} 100%)`;

// 글래스모피즘 토큰 (aqua-30 RGB 10,136,168 tint — primaryDark 유지로 진한 depth 확보)
export const GLASS = {
  bg:          'rgba(255,255,255,0.72)',
  bgStrong:    'rgba(255,255,255,0.90)',   // 드롭다운 등 가독성 필요한 표면
  border:      '1px solid rgba(255,255,255,0.55)',
  blur:        'blur(14px)',
  shadow:      '0 1px 0 rgba(255,255,255,0.85) inset, 0 -1px 0 rgba(10,136,168,0.10) inset, ' +
               '0 6px 16px -6px rgba(26,35,48,0.10), 0 14px 36px -18px rgba(26,35,48,0.16)',
  shadowHover: '0 0 0 4px rgba(10,136,168,0.16), 0 18px 44px -14px rgba(10,136,168,0.40), ' +
               '0 1px 0 rgba(255,255,255,0.9) inset',
};

/**
 * 글래스 패널 sx 생성 — accent 강조 + 3D 깊이 그림자.
 * 기존 화면의 embossedPaper() 대체용. hovered=true 시 강조 그림자.
 */
export function glassPanel(accent = PALETTE.primary, hovered = false) {
  return {
    borderRadius: 3,
    bgcolor: GLASS.bg,
    backdropFilter: GLASS.blur,
    WebkitBackdropFilter: GLASS.blur,
    border: GLASS.border,
    boxShadow: hovered
      ? `0 0 0 4px ${accent}24, ${GLASS.shadowHover}`
      : GLASS.shadow,
    transition: 'box-shadow .18s ease, transform .18s ease',
  };
}

/**
 * 짧은 라벨 옆에 두는 도움말 점 — 호버 시 Tooltip 으로 설명 노출.
 * 장문 설명 텍스트를 화면에서 빼고 이 컴포넌트로 대체한다.
 */
export function InfoDot({ title, sx }) {
  return (
    <Tooltip title={title}>
      <HelpOutlineIcon
        sx={{
          fontSize: 14,
          color: PALETTE.textSecondary,
          cursor: 'help',
          verticalAlign: 'middle',
          opacity: 0.7,
          '&:hover': { opacity: 1 },
          ...sx,
        }}
      />
    </Tooltip>
  );
}
