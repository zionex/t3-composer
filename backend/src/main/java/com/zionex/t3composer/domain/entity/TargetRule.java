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
 * Target 별 규약 문서. .claude/rules/*.md 의 본문이 row 로 들어감.
 * PromptBuilder 가 Target 선택 시 동적 load → 시스템 프롬프트 조립.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "TB_CMP_TARGET_RULE")
public class TargetRule {

    @Id
    @GeneratedValue(generator = "uuid-v7")
    @GenericGenerator(name = "uuid-v7", strategy = "com.zionex.t3composer.shared.util.UUIdV7Generator")
    @Column(name = "id", length = 32)
    private String id;

    @Column(name = "target_cd", length = 50, nullable = false)
    private String targetCd;

    /** '10-ontology-first', '41-composer-generation' 등 */
    @Column(name = "rule_code", length = 100, nullable = false)
    private String ruleCode;

    @Column(name = "title", length = 500)
    private String title;

    @Column(name = "content", columnDefinition = "text", nullable = false)
    private String content;

    /** 'all' | 'invariant' | 'NEW_GENERAL,NEW_NL' | ... */
    @Column(name = "applies_to", length = 200)
    private String appliesTo;

    @Column(name = "priority")
    private Integer priority;

    @Column(name = "rule_version", nullable = false)
    private Integer ruleVersion;

    @Column(name = "source_path", length = 500)
    private String sourcePath;

    /** SHA-256 hex (64자) — 변경 감지 */
    @Column(name = "content_hash", length = 64)
    private String contentHash;

    @Column(name = "use_yn", length = 1)
    private String useYn;

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
