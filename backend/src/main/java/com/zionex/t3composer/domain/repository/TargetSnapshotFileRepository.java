package com.zionex.t3composer.domain.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.zionex.t3composer.domain.entity.TargetSnapshotFile;

public interface TargetSnapshotFileRepository extends JpaRepository<TargetSnapshotFile, String> {

    List<TargetSnapshotFile> findBySnapshotId(String snapshotId);

    void deleteBySnapshotId(String snapshotId);

    long countBySnapshotId(String snapshotId);
}
