package com.zionex.t3composer.domain.dictionary.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.zionex.t3composer.domain.dictionary.entity.ComposerChartType;
import com.zionex.t3composer.domain.dictionary.entity.ComposerGridType;
import com.zionex.t3composer.domain.dictionary.entity.ComposerKpiDict;
import com.zionex.t3composer.domain.dictionary.service.DictionaryService;

import lombok.RequiredArgsConstructor;

/**
 * T3Composer Dictionary — Grid / Chart / KPI 통합 REST API.
 * (Layout 갤러리는 2026-04-30 제거됨 — /composer/dictionary/layouts 엔드포인트 폐기)
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/composer/dictionary")
public class DictionaryController {

    private final DictionaryService service;

    // ========== GRID ==========
    @GetMapping("/grid-types")
    public List<ComposerGridType> listGrids(
            @RequestParam(value = "activeOnly", required = false, defaultValue = "false") boolean activeOnly) {
        return service.listGrids(activeOnly);
    }

    @PostMapping("/grid-types")
    public ComposerGridType saveGrid(@RequestBody ComposerGridType g) {
        return service.saveGrid(g);
    }

    @DeleteMapping("/grid-types/{id}")
    public ResponseEntity<Map<String, String>> deleteGrid(@PathVariable String id) {
        service.deleteGrid(id);
        return ResponseEntity.ok(Map.of("message", "deleted"));
    }

    // ========== CHART ==========
    @GetMapping("/chart-types")
    public List<ComposerChartType> listCharts(
            @RequestParam(value = "activeOnly", required = false, defaultValue = "false") boolean activeOnly) {
        return service.listCharts(activeOnly);
    }

    @PostMapping("/chart-types")
    public ComposerChartType saveChart(@RequestBody ComposerChartType c) {
        return service.saveChart(c);
    }

    @DeleteMapping("/chart-types/{id}")
    public ResponseEntity<Map<String, String>> deleteChart(@PathVariable String id) {
        service.deleteChart(id);
        return ResponseEntity.ok(Map.of("message", "deleted"));
    }

    // ========== KPI ==========
    @GetMapping("/kpis")
    public List<ComposerKpiDict> listKpis(
            @RequestParam(value = "activeOnly", required = false, defaultValue = "false") boolean activeOnly) {
        return service.listKpis(activeOnly);
    }

    @PostMapping("/kpis")
    public ComposerKpiDict saveKpi(@RequestBody ComposerKpiDict k) {
        return service.saveKpi(k);
    }

    @DeleteMapping("/kpis/{id}")
    public ResponseEntity<Map<String, String>> deleteKpi(@PathVariable String id) {
        service.deleteKpi(id);
        return ResponseEntity.ok(Map.of("message", "deleted"));
    }
}
