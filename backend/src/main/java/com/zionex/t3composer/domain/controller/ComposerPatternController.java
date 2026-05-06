package com.zionex.t3composer.domain.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.zionex.t3composer.domain.entity.ComposerPattern;
import com.zionex.t3composer.domain.service.ComposerPatternService;

import lombok.RequiredArgsConstructor;

/**
 * T3Composer 화면 패턴 카탈로그 CRUD.
 *  - Wizard 의 PatternSelector 가 활성 패턴 목록을 조회
 *  - 관리 화면(T3ComposerPatterns) 에서 CRUD
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/composer/patterns")
public class ComposerPatternController {

    private final ComposerPatternService service;

    @GetMapping
    public List<ComposerPattern> list(
            @RequestParam(value = "activeOnly", required = false, defaultValue = "false") boolean activeOnly) {
        return service.listAll(activeOnly);
    }

    @GetMapping("/{id}")
    public ComposerPattern get(@PathVariable String id) {
        return service.get(id);
    }

    @PostMapping
    public ComposerPattern create(@RequestBody ComposerPattern p) {
        return service.create(p);
    }

    @PutMapping("/{id}")
    public ComposerPattern update(@PathVariable String id, @RequestBody ComposerPattern p) {
        return service.update(id, p);
    }

    @PostMapping("/{id}/toggle-active")
    public ResponseEntity<Map<String, String>> toggleActive(@PathVariable String id) {
        service.toggleActive(id);
        return ResponseEntity.ok(Map.of("message", "toggled"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.ok(Map.of("message", "deleted"));
    }
}
