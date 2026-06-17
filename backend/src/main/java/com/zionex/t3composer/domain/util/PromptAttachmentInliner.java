package com.zionex.t3composer.domain.util;

import java.util.List;

import com.zionex.t3composer.domain.dto.TextAttachmentDto;

/**
 * 텍스트 첨부 (SQL/JSON/MD 등) 를 user prompt 본문 끝에 markdown fence 로 합치는 헬퍼.
 * 파일당 본문 12K자 cap — 그 이상은 잘라서 "... (이하 생략 — 전체 N자)" 표기.
 *
 * AI 추천 흐름의 RecommendMockup/PrefillFromMockup/PrefillFromSynthesized service 가 공통 사용.
 */
public final class PromptAttachmentInliner {
    private PromptAttachmentInliner() {}

    private static final int INLINE_CAP = 12000;

    /** baseUserPrompt 끝에 텍스트 첨부 fence block 들을 이어 붙여 반환. atts 가 null/empty 면 원본 반환. */
    public static String inline(String baseUserPrompt, List<TextAttachmentDto> atts) {
        if (atts == null || atts.isEmpty()) return baseUserPrompt == null ? "" : baseUserPrompt;
        StringBuilder sb = new StringBuilder(baseUserPrompt == null ? "" : baseUserPrompt);
        for (TextAttachmentDto t : atts) {
            if (t == null) continue;
            String full = t.getText() == null ? "" : t.getText();
            String body = full.length() > INLINE_CAP
                    ? full.substring(0, INLINE_CAP) + "\n... (이하 생략 — 전체 " + full.length() + "자)"
                    : full;
            String lang = t.getLang() == null ? "" : t.getLang();
            sb.append("\n\n=== 첨부 파일: ").append(t.getName() == null ? "(unnamed)" : t.getName())
              .append(" ===\n```").append(lang).append('\n')
              .append(body).append("\n```\n");
        }
        return sb.toString();
    }
}
