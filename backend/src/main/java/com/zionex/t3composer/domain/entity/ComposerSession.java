package com.zionex.t3composer.domain.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
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

    /**
     * 화면 생성 시 system prompt rule 선별 scope — 활성 플래그를 콤마로 직렬화.
     * 예: "backend,filter" / "backend" / "" (core only). null = 전체 rule.
     */
    @Column(name = "RULE_SCOPE", length = 40)
    private String ruleScope;

    /**
     * Composer 세션의 UI 언어 (Claude 응답 언어용 — Phase 6 i18n).
     * 'ko' (한국어, 기본) | 'en' (English). 산출물 코드는 system prompt 강제로
     * 한국어 라벨/문자열/주석 보존.
     */
    @Column(name = "UI_LANGUAGE", length = 8)
    private String uiLanguage;

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

    @PrePersist
    void onPrePersist() {
        if (this.uiLanguage == null || this.uiLanguage.isBlank()) {
            this.uiLanguage = "ko";
        }
    }
}
