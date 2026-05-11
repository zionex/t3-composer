package com.zionex.t3composer.domain.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import org.hibernate.annotations.GenericGenerator;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Composer 세션 내 사용자·Claude 채팅 메시지 이력.
 * TURN_SEQ 로 세션 내 대화 순서를 보장 (SESSION_ID + TURN_SEQ unique).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "TB_IS_COMPOSER_MESSAGE")
public class ComposerMessage {

    public static final String ROLE_USER      = "user";
    public static final String ROLE_ASSISTANT = "assistant";
    public static final String ROLE_SYSTEM    = "system";
    public static final String ROLE_TOOL      = "tool";

    @Id
    @GeneratedValue(generator = "uuid-v7")
    @GenericGenerator(name = "uuid-v7", strategy = "com.zionex.t3composer.shared.util.UUIdV7Generator")
    @Column(name = "ID", length = 32)
    private String id;

    @Column(name = "SESSION_ID", length = 32, nullable = false)
    private String sessionId;

    @Column(name = "TURN_SEQ", nullable = false)
    private Integer turnSeq;

    @Column(name = "ROLE", length = 16, nullable = false)
    private String role;

    @Column(name = "CONTENT", columnDefinition = "text")
    private String content;

    @Column(name = "STOP_REASON", length = 32)
    private String stopReason;

    @Column(name = "INPUT_TOKENS")
    private Integer inputTokens;

    @Column(name = "OUTPUT_TOKENS")
    private Integer outputTokens;

    @Column(name = "MODEL_NAME", length = 100)
    private String modelName;

    @Column(name = "METADATA", columnDefinition = "text")
    private String metadata;

    @Column(name = "CREATE_DTTM", updatable = false)
    private LocalDateTime createDttm;
}
