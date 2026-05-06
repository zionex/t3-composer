package com.zionex.t3composer.domain.dto;

import java.time.LocalDateTime;

import com.zionex.t3composer.domain.entity.ComposerArtifact;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 아티팩트 응답 DTO. 기본 조회 시 content 는 제외, 상세 조회 시 포함.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ArtifactDto {

    private String id;
    private String sessionId;
    private String messageId;
    private String artifactType;
    private String filePath;
    private String fileName;
    private String language;
    private String content;
    private Integer versionNo;
    private String status;
    private LocalDateTime createDttm;

    /** 목록용 (content 제외) */
    public static ArtifactDto summary(ComposerArtifact a) {
        return ArtifactDto.builder()
                .id(a.getId())
                .sessionId(a.getSessionId())
                .messageId(a.getMessageId())
                .artifactType(a.getArtifactType())
                .filePath(a.getFilePath())
                .fileName(a.getFileName())
                .language(a.getLanguage())
                .versionNo(a.getVersionNo())
                .status(a.getStatus())
                .createDttm(a.getCreateDttm())
                .build();
    }

    /** 상세용 (content 포함) */
    public static ArtifactDto full(ComposerArtifact a) {
        return ArtifactDto.builder()
                .id(a.getId())
                .sessionId(a.getSessionId())
                .messageId(a.getMessageId())
                .artifactType(a.getArtifactType())
                .filePath(a.getFilePath())
                .fileName(a.getFileName())
                .language(a.getLanguage())
                .content(a.getContent())
                .versionNo(a.getVersionNo())
                .status(a.getStatus())
                .createDttm(a.getCreateDttm())
                .build();
    }
}
