package com.zionex.t3composer.domain.ontology.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.zionex.t3composer.domain.ontology.dto.TreeNodeDto;
import com.zionex.t3composer.domain.ontology.service.OntologyService;
import com.zionex.t3composer.shared.auth.AuthenticationProvider;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/composer/ontology")
public class OntologyController {

    private final OntologyService service;
    private final com.zionex.t3composer.domain.ontology.service.OntologySuggestService suggestService;
    private final AuthenticationProvider authenticationProvider;

    /** 현재 로그인 사용자 id — Anthropic API key 조회/감사용. dev fallback. */
    private String currentUserId() {
        try {
            var info = authenticationProvider.getAuthenticationInfo();
            String uid = info == null ? null : info.getUserId();
            return (uid == null || uid.isBlank()) ? "composer-dev" : uid;
        } catch (Exception e) {
            return "composer-dev";
        }
    }

    @GetMapping("/tree")
    public List<TreeNodeDto> tree(
            @RequestParam(value = "targetCd", required = false) String targetCd,
            @RequestParam(value = "q", required = false) String q) {
        return service.tree(targetCd, q);
    }

    // ─────────────────────────── Q&A ───────────────────────────

    @GetMapping("/qa/{id}")
    public com.zionex.t3composer.domain.ontology.dto.QaDto getQa(
            @PathVariable String id,
            @RequestParam(value = "targetCd", required = false) String targetCd) {
        return service.getQa(targetCd, id);
    }

    @GetMapping("/qa/bulk")
    public List<com.zionex.t3composer.domain.ontology.dto.QaDto> getQaBulk(
            @RequestParam(value = "ids") String idsCsv,
            @RequestParam(value = "targetCd", required = false) String targetCd) {
        if (idsCsv == null || idsCsv.isBlank()) return List.of();
        return service.getQaBulk(targetCd,
            java.util.Arrays.stream(idsCsv.split(",")).map(String::trim)
                .filter(s -> !s.isEmpty()).toList());
    }

    @org.springframework.web.bind.annotation.PostMapping("/qa")
    public com.zionex.t3composer.domain.ontology.dto.QaDto createQa(
            @org.springframework.web.bind.annotation.RequestBody
                com.zionex.t3composer.domain.ontology.dto.QaDto dto,
            @RequestParam(value = "targetCd", required = false) String targetCd) {
        return service.createQa(targetCd, dto, currentUserId());
    }

    @org.springframework.web.bind.annotation.PutMapping("/qa/{id}")
    public org.springframework.http.ResponseEntity<com.zionex.t3composer.domain.ontology.dto.QaDto> updateQa(
            @PathVariable String id,
            @org.springframework.web.bind.annotation.RequestBody
                com.zionex.t3composer.domain.ontology.dto.QaDto dto,
            @org.springframework.web.bind.annotation.RequestHeader(value = "If-Match", required = false) String ifMatch,
            @RequestParam(value = "targetCd", required = false) String targetCd) {
        java.time.LocalDateTime ifMatchDt = null;
        if (ifMatch != null && !ifMatch.isBlank()) {
            try { ifMatchDt = java.time.LocalDateTime.parse(ifMatch); }
            catch (Exception ignore) { /* 헤더 무효 — 충돌 검사 skip */ }
        }
        try {
            var saved = service.updateQa(targetCd, id, dto, ifMatchDt, currentUserId());
            return org.springframework.http.ResponseEntity.ok(saved);
        } catch (com.zionex.t3composer.domain.ontology.service.OntologyService.OptimisticLockException ex) {
            return org.springframework.http.ResponseEntity
                .status(org.springframework.http.HttpStatus.PRECONDITION_FAILED).build();
        }
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/qa/{id}")
    public void deleteQa(
            @PathVariable String id,
            @RequestParam(value = "targetCd", required = false) String targetCd) {
        service.deleteQa(targetCd, id, currentUserId());
    }

    // ─────────────────────────── Entity ───────────────────────────

    @GetMapping("/entity/{id}")
    public com.zionex.t3composer.domain.ontology.dto.EntityDto getEntity(
            @PathVariable String id,
            @RequestParam(value = "targetCd", required = false) String targetCd) {
        return service.getEntity(targetCd, id);
    }

    @GetMapping("/entity/bulk")
    public List<com.zionex.t3composer.domain.ontology.dto.EntityDto> getEntityBulk(
            @RequestParam("ids") String idsCsv,
            @RequestParam(value = "targetCd", required = false) String targetCd) {
        if (idsCsv == null || idsCsv.isBlank()) return List.of();
        return service.getEntityBulk(targetCd,
            java.util.Arrays.stream(idsCsv.split(",")).map(String::trim)
                .filter(s -> !s.isEmpty()).toList());
    }

    @org.springframework.web.bind.annotation.PostMapping("/entity")
    public com.zionex.t3composer.domain.ontology.dto.EntityDto createEntity(
            @org.springframework.web.bind.annotation.RequestBody
                com.zionex.t3composer.domain.ontology.dto.EntityDto dto,
            @RequestParam(value = "targetCd", required = false) String targetCd) {
        return service.createEntity(targetCd, dto, currentUserId());
    }

    @org.springframework.web.bind.annotation.PutMapping("/entity/{id}")
    public com.zionex.t3composer.domain.ontology.dto.EntityDto updateEntity(
            @PathVariable String id,
            @org.springframework.web.bind.annotation.RequestBody
                com.zionex.t3composer.domain.ontology.dto.EntityDto dto,
            @RequestParam(value = "targetCd", required = false) String targetCd) {
        return service.updateEntity(targetCd, id, dto, currentUserId());
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/entity/{id}")
    public void deleteEntity(
            @PathVariable String id,
            @RequestParam(value = "targetCd", required = false) String targetCd) {
        service.deleteEntity(targetCd, id, currentUserId());
    }

    // ─────────────────────────── View / Process ───────────────────────────

    @GetMapping("/view/{menuCd}")
    public com.zionex.t3composer.domain.ontology.dto.ViewMetaDto getView(
            @PathVariable String menuCd,
            @RequestParam(value = "targetCd", required = false) String targetCd) {
        return service.getView(targetCd, menuCd);
    }

    @GetMapping("/process/{processCd}")
    public com.zionex.t3composer.domain.ontology.dto.ProcessMetaDto getProcess(
            @PathVariable String processCd,
            @RequestParam(value = "targetCd", required = false) String targetCd) {
        return service.getProcess(targetCd, processCd);
    }

    // ─────────────────────────── Suggest ───────────────────────────

    @org.springframework.web.bind.annotation.PostMapping("/suggest")
    public com.zionex.t3composer.domain.ontology.dto.SuggestResponse suggest(
            @org.springframework.web.bind.annotation.RequestBody
                com.zionex.t3composer.domain.ontology.dto.SuggestRequest req) {
        return suggestService.suggest(currentUserId(), req);
    }
}
