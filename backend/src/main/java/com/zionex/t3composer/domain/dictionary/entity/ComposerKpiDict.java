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
 * Composer Dictionary — S&OP KPI 사전 (40 KPI / 5 카테고리).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "TB_IS_COMPOSER_KPI_DICT")
public class ComposerKpiDict {

    @Id
    @GeneratedValue(generator = "uuid-v7")
    @GenericGenerator(name = "uuid-v7", strategy = "com.zionex.t3composer.shared.util.UUIdV7Generator")
    @Column(name = "ID", length = 32)
    private String id;

    @Column(name = "CODE", length = 30, nullable = false, unique = true)
    private String code;

    @Column(name = "CATEGORY_CD", length = 40)
    private String categoryCd;

    @Column(name = "CATEGORY_NAME", length = 100)
    private String categoryName;

    @Column(name = "NAME", nullable = false)
    private String name;

    @Column(name = "NAME_EN")
    private String nameEn;

    @Column(name = "IS_MAIN", length = 1)
    private String isMain;

    @Column(name = "DEPARTMENT", length = 100)
    private String department;

    @Column(name = "FREQUENCY", length = 50)
    private String frequency;

    @Column(name = "DESCRIPTION", columnDefinition = "text")
    private String description;

    @Column(name = "FORMULA", columnDefinition = "text")
    private String formula;

    @Column(name = "CHART1_TYPE", length = 30)
    private String chart1Type;

    @Column(name = "CHART1_LABEL")
    private String chart1Label;

    @Column(name = "CHART1_DATA", columnDefinition = "text")
    private String chart1Data;

    @Column(name = "CHART2_TYPE", length = 30)
    private String chart2Type;

    @Column(name = "CHART2_LABEL")
    private String chart2Label;

    @Column(name = "CHART2_DATA", columnDefinition = "text")
    private String chart2Data;

    @Column(name = "CHART2_UNIT", length = 20)
    private String chart2Unit;

    @Column(name = "TARGET_VALUE", length = 100)
    private String targetValue;

    @Column(name = "IS_REVERSE_GAP", length = 1)
    private String isReverseGap;

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
