package com.zionex.t3composer.domain.ontology.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 좌 트리 1개 노드. 카테고리(루트) → 도메인(중간) → row(리프).
 * - category: 'QA' | 'ENTITY' | 'VIEW' | 'PROCESS'
 * - readOnly: true 면 우 패널이 ViewReadOnly/ProcessReadOnly 로 swap
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TreeNodeDto {
    private String key;          // 'QA' / 'QA:BF' / 'QA:BF:7c3a-...'
    private String category;     // 'QA' | 'ENTITY' | 'VIEW' | 'PROCESS'
    private String label;        // 사용자가 보는 라벨
    private String refId;        // 리프만 (Target DB row id)
    private boolean readOnly;
    private Integer count;       // 중간 노드의 자식 수
    private List<TreeNodeDto> children;
}
