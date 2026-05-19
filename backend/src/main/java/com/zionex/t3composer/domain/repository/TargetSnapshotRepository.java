package com.zionex.t3composer.domain.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.zionex.t3composer.domain.entity.TargetSnapshot;

public interface TargetSnapshotRepository extends JpaRepository<TargetSnapshot, String> {

    /** Target 의 스냅샷 목록 — 최신 번호 우선 */
    List<TargetSnapshot> findByTargetCdOrderBySnapshotNoDesc(String targetCd);

    /** Target 의 현재 기준 스냅샷 (is_current='Y') */
    Optional<TargetSnapshot> findByTargetCdAndIsCurrent(String targetCd, String isCurrent);

    /** snapshot_no 자동 채번용 — 직전 최대 번호 행 */
    Optional<TargetSnapshot> findFirstByTargetCdOrderBySnapshotNoDesc(String targetCd);

    long countByTargetCd(String targetCd);
}
