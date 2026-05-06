package com.zionex.t3composer.domain.dictionary.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.zionex.t3composer.domain.dictionary.entity.ComposerKpiDict;

@Repository
public interface ComposerKpiDictRepository extends JpaRepository<ComposerKpiDict, String> {

    List<ComposerKpiDict> findAllByOrderBySortOrderAsc();

    List<ComposerKpiDict> findByUseYnOrderBySortOrderAsc(String useYn);
}
