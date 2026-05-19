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
 * Target 거버넌스 설정 스냅샷 헤더 — 한 시점의 파일 번들.
 *
 * 파일 본문은 {@link TargetSnapshotFile} 행으로 분리 저장.
 * is_current='Y' 인 스냅샷이 "현재 디스크와 일치한다고 간주되는" 기준이다.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "TB_CMP_TARGET_SNAPSHOT")
public class TargetSnapshot {

    /** 사용자가 명시적으로 저장 */
    public static final String KIND_MANUAL      = "MANUAL";
    /** 복원 직전 자동 백업 */
    public static final String KIND_AUTO_BACKUP = "AUTO_BACKUP";
    /** 최초 등록 */
    public static final String KIND_SEED        = "SEED";

    @Id
    @GeneratedValue(generator = "uuid-v7")
    @GenericGenerator(name = "uuid-v7", strategy = "com.zionex.t3composer.shared.util.UUIdV7Generator")
    @Column(name = "id", length = 32)
    private String id;

    @Column(name = "target_cd", length = 50, nullable = false)
    private String targetCd;

    @Column(name = "snapshot_no", nullable = false)
    private Integer snapshotNo;

    @Column(name = "label", length = 200)
    private String label;

    @Column(name = "snapshot_kind", length = 20, nullable = false)
    private String snapshotKind;

    /** 'Y' = 현재 디스크 기준 스냅샷 (target 당 1개) */
    @Column(name = "is_current", length = 1, nullable = false)
    private String isCurrent;

    /** JSON 배열 — 복원 동기화(삭제) 대상 root 목록 */
    @Column(name = "tracked_roots", columnDefinition = "text", nullable = false)
    private String trackedRootsJson;

    @Column(name = "file_count")
    private Integer fileCount;

    @Column(name = "total_bytes")
    private Long totalBytes;

    /** TB_CMP_TARGET_SYSTEM 행 직렬화 (db_password 는 암호문) */
    @Column(name = "target_row_json", columnDefinition = "text")
    private String targetRowJson;

    @Column(name = "comment", columnDefinition = "text")
    private String comment;

    @Column(name = "create_by", length = 100)
    private String createBy;

    @Column(name = "create_dttm")
    private LocalDateTime createDttm;
}
