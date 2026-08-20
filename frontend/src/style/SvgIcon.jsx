// =============================================================================
// SvgIcon — 정적 SVG 자산을 렌더링하는 primitive.
//
// wingui-core `component/SvgIcon.jsx` 의 `renderMode='mask'` 흐름을 정적 자산 전용으로 단순화한 버전.
//
// 두 가지 렌더 모드 (color prop 유무로 자동 결정):
//   1. color 없음  → <img> 원본 색상 그대로 (예: 사이드바 흰색 fill)
//   2. color 있음  → CSS mask-image + backgroundColor 로 지정 색상 tint
//                     (예: 탭 헤더 위 회색/aqua tint)
//
// 사용 예:
//   import SvgIcon from '../../style/SvgIcon';
//   import iconHistory from '../../assets/icons/history.svg';
//
//   <SvgIcon src={iconHistory} size={20} />                                 // 사이드바 (원본 흰색)
//   <SvgIcon src={iconHistory} size={14} color={PALETTE.primary} />         // 탭 헤더 활성
//   <SvgIcon src={iconHistory} size={14} color={PALETTE.headerIconMuted} /> // 탭 헤더 비활성
// =============================================================================

import React from 'react';

export default function SvgIcon({
  src,
  size = 20,
  color,
  alt = '',
  style,
  ...rest
}) {
  if (!src) return null;

  if (!color) {
    return (
      <img
        src={src}
        width={size}
        height={size}
        alt={alt}
        style={{ display: 'block', ...(style || {}) }}
        {...rest}
      />
    );
  }

  return (
    <span
      role="img"
      aria-label={alt}
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        flexShrink: 0,
        backgroundColor: color,
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        ...(style || {}),
      }}
      {...rest}
    />
  );
}
