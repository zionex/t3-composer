package com.zionex.t3composer.domain.dictionary.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.zionex.t3composer.domain.dictionary.entity.ComposerGridType;

@Repository
public interface ComposerGridTypeRepository extends JpaRepository<ComposerGridType, String> {

    List<ComposerGridType> findAllByOrderBySortOrderAsc();

    List<ComposerGridType> findByUseYnOrderBySortOrderAsc(String useYn);
}
