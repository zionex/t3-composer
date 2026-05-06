package com.zionex.t3composer.domain.dictionary.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.zionex.t3composer.domain.dictionary.entity.ComposerChartType;

@Repository
public interface ComposerChartTypeRepository extends JpaRepository<ComposerChartType, String> {

    List<ComposerChartType> findAllByOrderBySortOrderAsc();

    List<ComposerChartType> findByUseYnOrderBySortOrderAsc(String useYn);
}
