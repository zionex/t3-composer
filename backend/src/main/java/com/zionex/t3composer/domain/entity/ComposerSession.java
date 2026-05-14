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
 * T3Composer 작업 세션.
 * 신규개발(일반/설계서기반)·기존수정 모드별 Claude 대화 컨테이너.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "TB_IS_COMPOSER_SESSION")
public class ComposerSession {

    public static final String MODE_NEW_GENERAL     = "NEW_GENERAL";
    public static final String MODE_NEW_FROM_DESIGN = "NEW_FROM_DESIGN";
    public static final String MODE_NEW_FROM_COPY   = "NEW_FROM_COPY";
    public static final String MODE_NEW_STEP        = "NEW_STEP";
    public static final String MODE_NEW_NL          = "NEW_NL";
    public static final String MODE_EXISTING_MODIFY = "EXISTING_MODIFY";

    public static final String STATUS_ACTIVE    = "ACTIVE";
    public static final String STATUS_COMPLETED = "COMPLETED";
    public static final String STATUS_ARCHIVED  = "ARCHIVED";

    @Id
    @GeneratedValue(generator = "uuid-v7")
    @GenericGenerator(name = "uuid-v7", strategy = "com.zionex.t3composer.shared.util.UUIdV7Generator")
    @Column(name = "ID", length = 32)
    private String id;

    @Column(name = "USER_ID", length = 32, nullable = false)
    private String userId;

    @Column(name = "MODE", length = 32, nullable = false)
    private String mode;

    @Column(name = "TARGET_MENU_CD")
    private String targetMenuCd;

    /** 대상 Target System 코드 (T3SERIES / PLANNEL / ...). NULL = wingui 글로벌 fallback. */
    @Column(name = "TARGET_CD", length = 50)
    private String targetCd;

    @Column(name = "TITLE")
    private String title;

    @Column(name = "MODEL_NAME", length = 100)
    private String modelName;

    @Column(name = "STATUS", length = 20)
    private String status;

    @Column(name = "TOTAL_IN_TOKENS")
    private Integer totalInTokens;

    @Column(name = "TOTAL_OUT_TOKENS")
    private Integer totalOutTokens;

    @Column(name = "DESIGN_DOC_NAME")
    private String designDocName;

    @Column(name = "DESIGN_DOC_JSON", columnDefinition = "text")
    private String designDocJson;

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
