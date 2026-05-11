package com.zionex.t3composer.domain.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import org.hibernate.annotations.GenericGenerator;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Target 별 hook 스크립트. .claude/hooks/**.sh 의 본문이 row 로 들어감.
 * Composer 가 검증 hook 으로 직접 실행 또는 export 모드 시 파일로 출력.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "TB_CMP_TARGET_HOOK")
public class TargetHook {

    @Id
    @GeneratedValue(generator = "uuid-v7")
    @GenericGenerator(name = "uuid-v7", strategy = "com.zionex.t3composer.shared.util.UUIdV7Generator")
    @Column(name = "id", length = 32)
    private String id;

    @Column(name = "target_cd", length = 50, nullable = false)
    private String targetCd;

    /** 'PreToolUse' | 'PostToolUse' | 'UserPromptSubmit' | 'Stop' | 'SessionStart' */
    @Column(name = "hook_event", length = 50, nullable = false)
    private String hookEvent;

    @Column(name = "script_name", length = 200, nullable = false)
    private String scriptName;

    @Column(name = "script_path", length = 500)
    private String scriptPath;

    @Column(name = "script_content", columnDefinition = "text", nullable = false)
    private String scriptContent;

    @Column(name = "language", length = 20, nullable = false)
    private String language;

    @Column(name = "matcher", length = 500)
    private String matcher;

    @Column(name = "sort_order")
    private Integer sortOrder;

    @Column(name = "enabled", length = 1)
    private String enabled;

    @Column(name = "content_hash", length = 64)
    private String contentHash;

    @CreatedBy
    @Column(name = "create_by", length = 100)
    private String createBy;

    @CreatedDate
    @Column(name = "create_dttm")
    private LocalDateTime createDttm;

    @LastModifiedBy
    @Column(name = "modify_by", length = 100)
    private String modifyBy;

    @LastModifiedDate
    @Column(name = "modify_dttm")
    private LocalDateTime modifyDttm;
}
