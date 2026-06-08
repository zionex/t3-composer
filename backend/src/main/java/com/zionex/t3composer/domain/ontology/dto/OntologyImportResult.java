package com.zionex.t3composer.domain.ontology.dto;

import java.util.LinkedHashMap;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * /composer/ontology/import-from-fs 응답.
 *
 * <p>카테고리별로 {@link CategoryCount} (added · skipped · available) 를 담는다.
 * 폴더 부재 시 {@code hasFolder=false} + 각 카운트는 0.
 * 카테고리별로 Target DB 테이블이 부재한 경우 (Invalid object name) 그 카테고리만
 * {@link CategoryCount#skippedReason} 에 'table absent' 가 설정되고 다른 카테고리는 계속.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OntologyImportResult {

    private String targetCd;
    private String ontologyRoot;          // resolved 절대 경로 또는 null
    private boolean hasFolder;
    private CategoryCount qa;
    private CategoryCount entity;
    private CategoryCount view;
    private CategoryCount process;

    /** 빈 응답 (폴더 부재 시). */
    public static OntologyImportResult empty(String targetCd, String ontologyRoot) {
        return OntologyImportResult.builder()
            .targetCd(targetCd).ontologyRoot(ontologyRoot).hasFolder(false)
            .qa(CategoryCount.zero())
            .entity(CategoryCount.zero())
            .view(CategoryCount.zero())
            .process(CategoryCount.zero())
            .build();
    }

    public Map<String, Object> toMap() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("targetCd", targetCd);
        m.put("ontologyRoot", ontologyRoot);
        m.put("hasFolder", hasFolder);
        m.put("qa", qa);
        m.put("entity", entity);
        m.put("view", view);
        m.put("process", process);
        return m;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CategoryCount {
        private int added;
        private int skipped;
        private int available;
        private String skippedReason;   // 'table absent' / 'json parse error' 등 — 정상 시 null

        public static CategoryCount zero() {
            return CategoryCount.builder().added(0).skipped(0).available(0).build();
        }
    }
}
