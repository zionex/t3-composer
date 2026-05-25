package com.zionex.t3composer.domain.dto;

import java.util.Map;

import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Phase 2D-3 — AI 추천 (FilterBar + Layer 관계) 요청 DTO.
 *
 * - spec: 4-step ComposerWizard 의 ComposerSpec 통째 (meta/layers/dataSource).
 * - instruction: 사용자 추가 지시 (선택). 비어있으면 spec 만으로 자동 유추.
 *                예: "기간 조건 추가", "master→detail 관계 만들어줘", "공통 코드 그룹 dropdown 도 같이"
 *
 * Spec: docs/superpowers/specs/2026-05-25-composer-canvas-phase2d3-ai-suggest-design.md
 */
@Data
@NoArgsConstructor
public class AutoSuggestRequest {
    private Map<String, Object> spec;
    private String instruction;
}
