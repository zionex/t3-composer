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
 * Composer 가 생성한 코드 아티팩트.
 * 화면 JSX, Java 컨트롤러·서비스, SP, DDL 등을 타입별로 저장.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "TB_IS_COMPOSER_ARTIFACT")
public class ComposerArtifact {

    public static final String TYPE_SCREEN_JSX        = "SCREEN_JSX";
    public static final String TYPE_JAVA_CONTROLLER   = "JAVA_CONTROLLER";
    public static final String TYPE_JAVA_SERVICE      = "JAVA_SERVICE";
    public static final String TYPE_JAVA_REPOSITORY   = "JAVA_REPOSITORY";
    public static final String TYPE_JAVA_ENTITY       = "JAVA_ENTITY";
    public static final String TYPE_SQL_DDL           = "SQL_DDL";
    public static final String TYPE_SQL_SP            = "SQL_SP";
    public static final String TYPE_MENU_SQL          = "MENU_SQL";
    public static final String TYPE_MENUS_JS_PATCH    = "MENUS_JS_PATCH";
    /** PLANEL 류 (menu_source='JS_FILE') Target 의 메뉴 등록 — TabMenuList.js 에 직접 append 될 entry JSON. */
    public static final String TYPE_MENU_JS           = "MENU_JS";
    /** PlanNEL 류 frontend 의 비-페이지 모듈 (.js/.ts) — services / redux slices / utils / hooks / components. */
    public static final String TYPE_FRONTEND_JS_MODULE = "FRONTEND_JS_MODULE";
    /** MyBatis Mapper XML (saas-application/src/main/resources/mapper/<subdomain>/<Feature>Mapper.xml). */
    public static final String TYPE_MYBATIS_MAPPER_XML = "MYBATIS_MAPPER_XML";
    public static final String TYPE_DESIGN_DOC_UPLOAD = "DESIGN_DOC_UPLOAD";
    public static final String TYPE_SOURCE_SNAPSHOT   = "SOURCE_SNAPSHOT";
    public static final String TYPE_OTHER             = "OTHER";

    public static final String STATUS_DRAFT     = "DRAFT";
    public static final String STATUS_FINAL     = "FINAL";
    public static final String STATUS_DISCARDED = "DISCARDED";

    @Id
    @GeneratedValue(generator = "uuid-v7")
    @GenericGenerator(name = "uuid-v7", strategy = "com.zionex.t3composer.shared.util.UUIdV7Generator")
    @Column(name = "ID", length = 32)
    private String id;

    @Column(name = "SESSION_ID", length = 32, nullable = false)
    private String sessionId;

    @Column(name = "MESSAGE_ID", length = 32)
    private String messageId;

    @Column(name = "ARTIFACT_TYPE", length = 40, nullable = false)
    private String artifactType;

    @Column(name = "FILE_PATH", length = 500)
    private String filePath;

    @Column(name = "FILE_NAME")
    private String fileName;

    @Column(name = "LANGUAGE", length = 32)
    private String language;

    @Column(name = "CONTENT", columnDefinition = "text")
    private String content;

    @Column(name = "CONTENT_BIN")
    private byte[] contentBin;

    @Column(name = "VERSION_NO")
    private Integer versionNo;

    @Column(name = "STATUS", length = 20)
    private String status;

    @Column(name = "CREATE_BY", updatable = false, length = 100)
    private String createBy;

    @Column(name = "CREATE_DTTM", updatable = false)
    private LocalDateTime createDttm;
}
