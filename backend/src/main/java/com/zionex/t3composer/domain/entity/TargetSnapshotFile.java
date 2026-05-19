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
 * Target 스냅샷의 개별 파일 행 — 거버넌스 루트 기준 상대경로 1개당 1행.
 *
 * content_hash 는 항상 <b>평문/원본</b> 기준 SHA-256 (시크릿 암호화 전) — diff 안정성 확보.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "TB_CMP_TARGET_SNAPSHOT_FILE")
public class TargetSnapshotFile {

    public static final String KIND_TEXT   = "TEXT";
    public static final String KIND_BINARY = "BINARY";
    public static final String KIND_SECRET = "SECRET";

    @Id
    @GeneratedValue(generator = "uuid-v7")
    @GenericGenerator(name = "uuid-v7", strategy = "com.zionex.t3composer.shared.util.UUIdV7Generator")
    @Column(name = "id", length = 32)
    private String id;

    @Column(name = "snapshot_id", length = 32, nullable = false)
    private String snapshotId;

    /** 거버넌스 루트 기준 상대경로 (항상 '/') */
    @Column(name = "rel_path", length = 1000, nullable = false)
    private String relPath;

    /** 소속 tracked root — 복원 삭제 범위 판정 */
    @Column(name = "tracked_root", length = 200, nullable = false)
    private String trackedRoot;

    /** TEXT | BINARY | SECRET */
    @Column(name = "file_kind", length = 20, nullable = false)
    private String fileKind;

    @Column(name = "is_binary", length = 1, nullable = false)
    private String isBinary;

    @Column(name = "is_encrypted", length = 1, nullable = false)
    private String isEncrypted;

    @Column(name = "executable", length = 1, nullable = false)
    private String executable;

    /** 텍스트 본문 / 시크릿 암호문 (바이너리면 NULL) */
    @Column(name = "content", columnDefinition = "text")
    private String content;

    /** 바이너리 원본 (텍스트면 NULL) */
    @Column(name = "content_bin")
    private byte[] contentBin;

    /** 평문/원본 기준 SHA-256 */
    @Column(name = "content_hash", length = 64, nullable = false)
    private String contentHash;

    @Column(name = "size_bytes")
    private Long sizeBytes;

    @Column(name = "create_dttm")
    private LocalDateTime createDttm;
}
