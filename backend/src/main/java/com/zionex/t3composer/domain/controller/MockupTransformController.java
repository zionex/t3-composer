package com.zionex.t3composer.domain.controller;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.zionex.t3composer.domain.service.MockupTransformService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * [화면 실행 LIVE] 의 AI mockup 변환 디버깅·재생성용 endpoint.
 *
 * 정상 흐름에서는 ArtifactPreviewService.applyPreview 가 자동 호출하므로 이 endpoint 는
 * 거의 쓰이지 않는다. 캐시가 잘못된 결과를 가지고 있을 때 force=true 로 재생성하거나,
 * 단일 화면 jsx 를 즉석으로 변환해 보고 싶을 때 사용.
 *
 * 요청:
 *   POST /composer/preview/mockup-transform
 *   { "originalJsx": "...", "targetCd": "PLANNEL", "originalPath": "X.js", "force": true }
 *
 * 응답:
 *   { "mockupJsx": "...", "cached": false, "elapsedMs": 8230 }
 */
@Slf4j
@RestController
@RequestMapping("/composer/preview")
@RequiredArgsConstructor
public class MockupTransformController {

    private final MockupTransformService transformService;

    @PostMapping("/mockup-transform")
    public ResponseEntity<Map<String, Object>> transform(@RequestBody Map<String, Object> req) {
        String originalJsx  = stringOf(req.get("originalJsx"));
        String targetCd     = stringOf(req.get("targetCd"));
        String originalPath = stringOf(req.get("originalPath"));
        boolean force       = Boolean.TRUE.equals(req.get("force"));
        String userId       = stringOf(req.get("userId"));
        if (userId == null || userId.isBlank()) userId = "composer-dev";

        if (originalJsx == null || originalJsx.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "success", false,
                    "error", "originalJsx 가 비어있습니다."));
        }

        long t0 = System.currentTimeMillis();
        String mockup = transformService.transformOrCached(originalJsx, targetCd, originalPath, userId, force);
        long elapsed = System.currentTimeMillis() - t0;

        Map<String, Object> out = new LinkedHashMap<>();
        if (mockup == null) {
            out.put("success", false);
            out.put("error", "변환 실패 — Anthropic 호출 실패 또는 API key 미등록. 서버 로그 확인.");
            out.put("elapsedMs", elapsed);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(out);
        }
        out.put("success", true);
        out.put("mockupJsx", mockup);
        out.put("mockupBytes", mockup.length());
        out.put("elapsedMs", elapsed);
        return ResponseEntity.ok(out);
    }

    private static String stringOf(Object v) { return v == null ? null : v.toString(); }
}
