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
 * T3Composer 화면 구성 패턴 카탈로그.
 * Wizard 에서 선택 가능한 패턴 목록 — DB 에서 동적 관리.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "TB_IS_COMPOSER_PATTERN")
public class ComposerPattern {

    @Id
    @GeneratedValue(generator = "uuid-v7")
    @GenericGenerator(name = "uuid-v7", strategy = "com.zionex.t3composer.shared.util.UUIdV7Generator")
    @Column(name = "ID", length = 32)
    private String id;

    @Column(name = "CODE", length = 20, nullable = false, unique = true)
    private String code;

    @Column(name = "LAYOUT", length = 60, nullable = false)
    private String layout;

    @Column(name = "CATEGORY", length = 40)
    private String category;

    @Column(name = "NAME", nullable = false)
    private String name;

    @Column(name = "NAME_EN")
    private String nameEn;

    @Column(name = "DESCRIPTION", columnDefinition = "NVARCHAR(MAX)")
    private String description;

    @Column(name = "VISUAL", columnDefinition = "NVARCHAR(MAX)")
    private String visual;

    @Column(name = "EXAMPLE_FILE")
    private String exampleFile;

    @Column(name = "FREQUENCY")
    private Integer frequency;

    @Column(name = "RECOMMENDED_FOR")
    private String recommendedFor;

    @Column(name = "COMPONENT_STACK", columnDefinition = "NVARCHAR(MAX)")
    private String componentStack;

    @Column(name = "WHEN_TO_USE", columnDefinition = "NVARCHAR(MAX)")
    private String whenToUse;

    @Column(name = "SORT_ORDER")
    private Integer sortOrder;

    @Column(name = "USE_YN", length = 1)
    private String useYn;

    @CreatedBy
    @Column(name = "CREATE_BY", updatable = false, length = 100)
    private String createBy;

    @CreatedDate
    @Column(name = "CREATE_DTTM", updatable = false)
    private LocalDateTime createDttm;

    @LastModifiedBy
    @Column(name = "MODIFY_BY", insertable = false, length = 100)
    private String modifyBy;

    @LastModifiedDate
    @Column(name = "MODIFY_DTTM", insertable = false)
    private LocalDateTime modifyDttm;
}
