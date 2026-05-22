/**
 * LayoutStep — ① Layout 단계. ComposerCanvas mode='layout' 단순 wrap.
 *   FilterBar 노란 띠 / [메뉴/메타] 버튼 / [화면 생성] 버튼은 ComposerCanvas 가 mode 분기로 숨김.
 *
 *   props:
 *     spec       ComposerSpec
 *     onChange(nextSpec)
 *     targetCd
 *
 *   Plan: docs/superpowers/plans/2026-05-22-composer-canvas-phase2e1.md (Task 3)
 */
import React from 'react';
import ComposerCanvas from './ComposerCanvas';

function LayoutStep({ spec, onChange, targetCd }) {
  return (
    <ComposerCanvas
      mode="layout"
      spec={spec}
      onChange={onChange}
      targetCd={targetCd}
    />
  );
}

export default LayoutStep;
