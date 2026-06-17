package com.zionex.t3composer.domain.util;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.zionex.t3composer.domain.dto.Attachment;

/**
 * 텍스트 + binary 첨부 → Anthropic Messages API content block 배열 변환.
 *   image  → { type:"image",    source:{ type:"base64", media_type, data } }
 *   pdf    → { type:"document", source:{ type:"base64", media_type, data } }
 *
 * ComposerService 와 AI 추천 흐름의 RecommendMockupService / PrefillFromMockupService /
 * PrefillFromSynthesizedService 가 공통 사용 — content block shape 단일 진실 저장소.
 */
public final class MultimodalContentBuilder {
    private MultimodalContentBuilder() {}

    /**
     * @param text         user prompt 본문
     * @param attachments  binary 첨부 (null/empty 가능)
     * @return text block 1개 + 첨부별 image/document block 의 List
     */
    public static List<Object> build(String text, List<Attachment> attachments) {
        List<Object> blocks = new ArrayList<>();
        Map<String, Object> textBlock = new LinkedHashMap<>();
        textBlock.put("type", "text");
        textBlock.put("text", text == null ? "" : text);
        blocks.add(textBlock);

        if (attachments == null) return blocks;
        for (Attachment a : attachments) {
            if (a == null || a.getBase64() == null || a.getBase64().isEmpty()) continue;
            String mediaType = a.getMediaType() == null ? "application/octet-stream" : a.getMediaType();
            String blockType = inferBlockType(mediaType);

            Map<String, Object> source = new LinkedHashMap<>();
            source.put("type", "base64");
            source.put("media_type", mediaType);
            source.put("data", a.getBase64());

            Map<String, Object> block = new LinkedHashMap<>();
            block.put("type", blockType);
            block.put("source", source);
            blocks.add(block);
        }
        return blocks;
    }

    public static String inferBlockType(String mediaType) {
        if (mediaType == null) return "document";
        String mt = mediaType.toLowerCase();
        if (mt.startsWith("image/")) return "image";
        if (mt.equals("application/pdf")) return "document";
        // 그 외 (xlsx/docx/etc) — document block 으로 시도 (Anthropic 가 거부할 수도 있음)
        return "document";
    }
}
