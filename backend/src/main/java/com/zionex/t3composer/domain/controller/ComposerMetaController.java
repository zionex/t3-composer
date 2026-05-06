package com.zionex.t3composer.domain.controller;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.zionex.t3composer.domain.service.ComposerMetaService;

import lombok.RequiredArgsConstructor;

/**
 * T3Composer Wizard 입력 보조 메타 조회.
 *
 * 모든 엔드포인트는 읽기 전용 (SELECT).
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/composer/meta")
public class ComposerMetaController {

    private final ComposerMetaService metaService;

    // ---- 메뉴 ----

    @GetMapping("/menus")
    public List<Map<String, Object>> listMenus(
            @RequestParam(value = "lang", required = false) String langCd) {
        return metaService.listMenus(langCd);
    }

    // ---- 사용자 그룹 (권한 부여 대상) ----

    @GetMapping("/groups")
    public List<Map<String, Object>> listGroups() {
        return metaService.listGroups();
    }

    // ---- DB 테이블 ----

    @GetMapping("/tables")
    public List<Map<String, Object>> listTables(
            @RequestParam(value = "q", required = false) String q,
            @RequestParam(value = "limit", required = false, defaultValue = "500") int limit) {
        return metaService.listTables(q, limit);
    }

    @GetMapping("/tables/{name}/columns")
    public List<Map<String, Object>> listColumns(@PathVariable String name) {
        return metaService.listColumns(name);
    }

    // ---- 온톨로지 ----

    @GetMapping("/ontology/view")
    public List<Map<String, Object>> listOntologyViews(
            @RequestParam(value = "q", required = false) String q,
            @RequestParam(value = "limit", required = false, defaultValue = "500") int limit) {
        return metaService.listOntologyViews(q, limit);
    }

    @GetMapping("/ontology/qa")
    public List<Map<String, Object>> listOntologyQa(
            @RequestParam(value = "q", required = false) String q,
            @RequestParam(value = "limit", required = false, defaultValue = "500") int limit) {
        return metaService.listOntologyQa(q, limit);
    }

    @GetMapping("/ontology/process")
    public List<Map<String, Object>> listOntologyProcess(
            @RequestParam(value = "q", required = false) String q,
            @RequestParam(value = "limit", required = false, defaultValue = "500") int limit) {
        return metaService.listOntologyProcess(q, limit);
    }

    @GetMapping("/ontology/entity")
    public List<Map<String, Object>> listOntologyEntity(
            @RequestParam(value = "q", required = false) String q,
            @RequestParam(value = "limit", required = false, defaultValue = "500") int limit) {
        return metaService.listOntologyEntity(q, limit);
    }
}
