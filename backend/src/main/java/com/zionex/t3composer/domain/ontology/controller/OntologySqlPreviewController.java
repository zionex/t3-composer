package com.zionex.t3composer.domain.ontology.controller;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.zionex.t3composer.domain.ontology.service.OntologySqlPreviewService;
import com.zionex.t3composer.domain.ontology.service.OntologySqlPreviewService.PreviewException;
import com.zionex.t3composer.domain.ontology.service.OntologySqlPreviewService.PreviewResult;
import com.zionex.t3composer.shared.auth.AuthenticationProvider;

import lombok.RequiredArgsConstructor;

/**
 * Q&A Answer SQL 의 안전한 미리보기 실행.
 * POST /composer/ontology/sql/preview
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/composer/ontology/sql")
public class OntologySqlPreviewController {

    private final OntologySqlPreviewService service;
    private final AuthenticationProvider authenticationProvider;

    private String currentUserId() {
        try {
            var info = authenticationProvider.getAuthenticationInfo();
            String uid = info == null ? null : info.getUserId();
            return (uid == null || uid.isBlank()) ? "composer-dev" : uid;
        } catch (Exception e) {
            return "composer-dev";
        }
    }

    public static class PreviewRequest {
        public String sql;
        public String targetCd;
        public String dbType;
    }

    @PostMapping("/preview")
    public ResponseEntity<?> preview(@RequestBody PreviewRequest req) {
        try {
            PreviewResult r = service.preview(req.sql, req.targetCd, req.dbType, currentUserId());
            return ResponseEntity.ok(r);
        } catch (PreviewException e) {
            Map<String, Object> body = new LinkedHashMap<>();
            Map<String, Object> err = new LinkedHashMap<>();
            err.put("code", e.code);
            err.put("message", e.getMessage());
            if (e.sqlState != null) err.put("sqlState", e.sqlState);
            body.put("error", err);
            HttpStatus status = switch (e.code) {
                case "TARGET_NOT_CONFIGURED" -> HttpStatus.BAD_REQUEST;
                case "QUERY_TIMEOUT" -> HttpStatus.GATEWAY_TIMEOUT;
                case "RUNTIME_ERROR" -> HttpStatus.INTERNAL_SERVER_ERROR;
                default -> HttpStatus.BAD_REQUEST;
            };
            return ResponseEntity.status(status).body(body);
        }
    }
}
