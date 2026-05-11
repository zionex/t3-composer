package com.zionex.t3composer.domain.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.zionex.t3composer.domain.entity.TargetHook;

public interface TargetHookRepository extends JpaRepository<TargetHook, String> {

    List<TargetHook> findByTargetCdAndEnabledOrderByHookEventAscSortOrderAsc(String targetCd, String enabled);

    Optional<TargetHook> findByTargetCdAndScriptName(String targetCd, String scriptName);

    long countByTargetCd(String targetCd);
}
