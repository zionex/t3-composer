/**
 * LayoutStep — ① Layout 단계. ComposerCanvas 단순 wrap.
 *   Phase 2E-3 이후 ComposerCanvas 는 layout 편집 전용 — FilterBar/메타/생성 분기 제거됨.
 *
 *   props:
 *     spec       ComposerSpec
 *     onChange(nextSpec)
 *     targetCd
 *
 *   Plan: docs/superpowers/plans/2026-05-22-composer-canvas-phase2e3.md (Task 2)
 */
import React from 'react';
import ComposerCanvas from './ComposerCanvas';

function LayoutStep({ spec, onChange, targetCd }) {
  return (
    <ComposerCanvas
      spec={spec}
      onChange={onChange}
      targetCd={targetCd}
    />
  );
}

export default LayoutStep;
