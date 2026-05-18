package com.zionex.t3composer.domain.dto;

import java.time.LocalDateTime;

import com.zionex.t3composer.domain.entity.ComposerSession;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Composer 세션 응답 DTO.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionDto {

    private String id;
    private String userId;
    private String mode;
    private String targetCd;          // 대상 Target System 코드 (T3SERIES/PLANNEL/...)
    private String targetMenuCd;
    private String title;
    private String modelName;
    private String status;
    private Integer totalInTokens;
    private Integer totalOutTokens;
    private String designDocName;
    private LocalDateTime createDttm;
    private LocalDateTime modifyDttm;

    public static SessionDto from(ComposerSession s) {
        return SessionDto.builder()
                .id(s.getId())
                .userId(s.getUserId())
                .mode(s.getMode())
                .targetCd(s.getTargetCd())
                .targetMenuCd(s.getTargetMenuCd())
                .title(s.getTitle())
                .modelName(s.getModelName())
                .status(s.getStatus())
                .totalInTokens(s.getTotalInTokens())
                .totalOutTokens(s.getTotalOutTokens())
                .designDocName(s.getDesignDocName())
                .createDttm(s.getCreateDttm())
                .modifyDttm(s.getModifyDttm())
                .build();
    }
}
