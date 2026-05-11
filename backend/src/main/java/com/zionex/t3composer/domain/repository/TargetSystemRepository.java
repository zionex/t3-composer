package com.zionex.t3composer.domain.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.zionex.t3composer.domain.entity.TargetSystem;

public interface TargetSystemRepository extends JpaRepository<TargetSystem, String> {

    List<TargetSystem> findByIsActiveOrderBySortOrderAsc(String isActive);
}
