package com.zionex.t3composer.domain.entity;

import java.io.Serializable;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * [화면 실행 LIVE] 의 AI mockup 변환 결과 캐시.
 * PK = (original_hash, target_cd) — 같은 원본을 두 Target 에서 다르게 변환 가능.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "tb_cmp_preview_mockup", schema = "dbo")
@IdClass(PreviewMockup.Pk.class)
public class PreviewMockup {

    @Id
    @Column(name = "original_hash", length = 64, nullable = false)
    private String originalHash;

    @Id
    @Column(name = "target_cd", length = 50, nullable = false)
    private String targetCd;

    @Column(name = "original_path", length = 500)
    private String originalPath;

    @Column(name = "original_bytes")
    private Integer originalBytes;

    @Column(name = "mockup_jsx", columnDefinition = "text", nullable = false)
    private String mockupJsx;

    @Column(name = "mockup_bytes")
    private Integer mockupBytes;

    @Column(name = "model_name", length = 100)
    private String modelName;

    @Column(name = "elapsed_ms")
    private Integer elapsedMs;

    @Column(name = "create_dttm")
    private LocalDateTime createDttm;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @EqualsAndHashCode
    public static class Pk implements Serializable {
        private String originalHash;
        private String targetCd;
    }
}
