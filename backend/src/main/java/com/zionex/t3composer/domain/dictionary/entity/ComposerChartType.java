package com.zionex.t3composer.domain.dictionary.entity;

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
 * Composer Dictionary — Chart 유형 카탈로그 (Chart.js 기반 60+ 변형).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "TB_IS_COMPOSER_CHART_TYPE")
public class ComposerChartType {

    @Id
    @GeneratedValue(generator = "uuid-v7")
    @GenericGenerator(name = "uuid-v7", strategy = "com.zionex.t3composer.shared.util.UUIdV7Generator")
    @Column(name = "ID", length = 32)
    private String id;

    @Column(name = "CODE", length = 30, nullable = false, unique = true)
    private String code;

    @Column(name = "CATEGORY", length = 40)
    private String category;

    @Column(name = "NAME", nullable = false)
    private String name;

    @Column(name = "NAME_EN")
    private String nameEn;

    @Column(name = "DESCRIPTION", columnDefinition = "text")
    private String description;

    @Column(name = "CHART_TYPE", length = 30, nullable = false)
    private String chartType;

    @Column(name = "OPTIONS_JSON", columnDefinition = "text")
    private String optionsJson;

    @Column(name = "SAMPLE_DATA", columnDefinition = "text")
    private String sampleData;

    @Column(name = "PREVIEW_COLOR", length = 20)
    private String previewColor;

    @Column(name = "COMPONENT_STACK")
    private String componentStack;

    @Column(name = "RECOMMENDED_FOR")
    private String recommendedFor;

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
