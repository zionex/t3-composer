package com.zionex.t3composer.domain.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.zionex.t3composer.domain.entity.ComposerPattern;

public interface ComposerPatternRepository extends JpaRepository<ComposerPattern, String> {

    List<ComposerPattern> findAllByOrderBySortOrderAscCodeAsc();

    List<ComposerPattern> findByUseYnOrderBySortOrderAscCodeAsc(String useYn);

    Optional<ComposerPattern> findByCode(String code);

    boolean existsByCode(String code);
}
