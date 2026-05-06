package com.zionex.t3composer.domain.dictionary.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.zionex.t3composer.domain.dictionary.entity.ComposerChartType;
import com.zionex.t3composer.domain.dictionary.entity.ComposerGridType;
import com.zionex.t3composer.domain.dictionary.entity.ComposerKpiDict;
import com.zionex.t3composer.domain.dictionary.repository.ComposerChartTypeRepository;
import com.zionex.t3composer.domain.dictionary.repository.ComposerGridTypeRepository;
import com.zionex.t3composer.domain.dictionary.repository.ComposerKpiDictRepository;

import lombok.RequiredArgsConstructor;

/**
 * Composer Dictionary 통합 서비스 — Grid / Chart / KPI 3 종 관리.
 * (Layout 갤러리는 2026-04-30 제거됨 — TB_IS_COMPOSER_LAYOUT 테이블/엔티티/UI 모두 삭제)
 */
@Service
@RequiredArgsConstructor
public class DictionaryService {

    private final ComposerGridTypeRepository  gridRepo;
    private final ComposerChartTypeRepository chartRepo;
    private final ComposerKpiDictRepository   kpiRepo;

    // ==================== GRID ====================

    public List<ComposerGridType> listGrids(boolean activeOnly) {
        return activeOnly
            ? gridRepo.findByUseYnOrderBySortOrderAsc("Y")
            : gridRepo.findAllByOrderBySortOrderAsc();
    }

    @Transactional
    public ComposerGridType saveGrid(ComposerGridType g) {
        if (g.getUseYn() == null) g.setUseYn("Y");
        return gridRepo.save(g);
    }

    @Transactional
    public void deleteGrid(String id) {
        gridRepo.deleteById(id);
    }

    // ==================== CHART ====================

    public List<ComposerChartType> listCharts(boolean activeOnly) {
        return activeOnly
            ? chartRepo.findByUseYnOrderBySortOrderAsc("Y")
            : chartRepo.findAllByOrderBySortOrderAsc();
    }

    @Transactional
    public ComposerChartType saveChart(ComposerChartType c) {
        if (c.getUseYn() == null) c.setUseYn("Y");
        return chartRepo.save(c);
    }

    @Transactional
    public void deleteChart(String id) {
        chartRepo.deleteById(id);
    }

    // ==================== KPI ====================

    public List<ComposerKpiDict> listKpis(boolean activeOnly) {
        return activeOnly
            ? kpiRepo.findByUseYnOrderBySortOrderAsc("Y")
            : kpiRepo.findAllByOrderBySortOrderAsc();
    }

    @Transactional
    public ComposerKpiDict saveKpi(ComposerKpiDict k) {
        if (k.getUseYn() == null) k.setUseYn("Y");
        return kpiRepo.save(k);
    }

    @Transactional
    public void deleteKpi(String id) {
        kpiRepo.deleteById(id);
    }
}
