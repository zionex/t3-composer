package com.zionex.t3composer.domain.dto;

import java.time.LocalDateTime;

import com.zionex.t3composer.domain.entity.ComposerMessage;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 메시지 응답 DTO.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageDto {

    private String id;
    private String sessionId;
    private Integer turnSeq;
    private String role;
    private String content;
    private String stopReason;
    private Integer inputTokens;
    private Integer outputTokens;
    private String modelName;
    private LocalDateTime createDttm;

    public static MessageDto from(ComposerMessage m) {
        return MessageDto.builder()
                .id(m.getId())
                .sessionId(m.getSessionId())
                .turnSeq(m.getTurnSeq())
                .role(m.getRole())
                .content(m.getContent())
                .stopReason(m.getStopReason())
                .inputTokens(m.getInputTokens())
                .outputTokens(m.getOutputTokens())
                .modelName(m.getModelName())
                .createDttm(m.getCreateDttm())
                .build();
    }
}
