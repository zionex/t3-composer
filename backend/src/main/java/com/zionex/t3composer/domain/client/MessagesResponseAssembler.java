package com.zionex.t3composer.domain.client;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.zionex.t3composer.domain.client.AnthropicModels.MessagesResponse;
import com.zionex.t3composer.domain.client.AnthropicModels.Usage;

/**
 * Streaming SSE 이벤트들을 단일 {@link MessagesResponse} 로 누적.
 * non-streaming 호출 ({@link CliLlmClient#sendMessages}) 경로에서 사용.
 */
class MessagesResponseAssembler {

    private static final Pattern TEXT_DELTA = Pattern.compile("\"text\":\"([^\"]*)\"");
    private static final Pattern INPUT_TOK  = Pattern.compile("\"input_tokens\":(\\d+)");
    private static final Pattern OUTPUT_TOK = Pattern.compile("\"output_tokens\":(\\d+)");
    private static final Pattern ID         = Pattern.compile("\"id\":\"([^\"]+)\"");
    private static final Pattern MODEL      = Pattern.compile("\"model\":\"([^\"]+)\"");

    private final StringBuilder text = new StringBuilder();
    private String id;
    private String model;
    private int    inputTokens;
    private int    outputTokens;

    MessagesResponseAssembler feed(String event, String data) {
        if (data == null) return this;
        switch (event == null ? "" : event) {
            case "message_start":
                id    = firstGroup(ID,    data);
                model = firstGroup(MODEL, data);
                break;
            case "content_block_delta": {
                String chunk = firstGroup(TEXT_DELTA, data);
                if (chunk != null) text.append(chunk);
                break;
            }
            case "message_delta": {
                String in  = firstGroup(INPUT_TOK,  data);
                String out = firstGroup(OUTPUT_TOK, data);
                if (in  != null) inputTokens  = Integer.parseInt(in);
                if (out != null) outputTokens = Integer.parseInt(out);
                break;
            }
            default:
                break;
        }
        return this;
    }

    MessagesResponse build() {
        MessagesResponse r = new MessagesResponse();
        r.setId(id);
        r.setModel(model);
        r.setStopReason("end_turn");
        Usage u = new Usage();
        u.setInputTokens(inputTokens);
        u.setOutputTokens(outputTokens);
        r.setUsage(u);
        // MessagesResponse.content is List<Map<String, Object>> — assemble one text block
        r.setContent(java.util.List.of(Map.of(
                "type", "text",
                "text", text.toString()
        )));
        return r;
    }

    private static String firstGroup(Pattern p, String data) {
        Matcher m = p.matcher(data);
        return m.find() ? m.group(1) : null;
    }
}
