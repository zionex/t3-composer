package com.zionex.t3composer.domain.dto;

import java.util.Map;

import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Phase 2D-3 — AI 추천 (FilterBar + Layer 관계) 요청 DTO.
 *
 * spec 은 4-step ComposerWizard 의 ComposerSpec 통째 — 백엔드가 필요 필드 (meta/layers/dataSource) 추출.
 *
 * Spec: docs/superpowers/specs/2026-05-25-composer-canvas-phase2d3-ai-suggest-design.md
 */
@Data
@NoArgsConstructor
public class AutoSuggestRequest {
    private Map<String, Object> spec;
}
