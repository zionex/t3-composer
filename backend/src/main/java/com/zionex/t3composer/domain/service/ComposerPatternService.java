package com.zionex.t3composer.domain.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.zionex.t3composer.domain.entity.ComposerPattern;
import com.zionex.t3composer.domain.repository.ComposerPatternRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ComposerPatternService {

    private final ComposerPatternRepository repo;

    @Transactional(readOnly = true)
    public List<ComposerPattern> listAll(boolean activeOnly) {
        return activeOnly
                ? repo.findByUseYnOrderBySortOrderAscCodeAsc("Y")
                : repo.findAllByOrderBySortOrderAscCodeAsc();
    }

    @Transactional(readOnly = true)
    public ComposerPattern get(String id) {
        return repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Pattern not found: " + id));
    }

    @Transactional(readOnly = true)
    public ComposerPattern getByCode(String code) {
        return repo.findByCode(code)
                .orElseThrow(() -> new IllegalArgumentException("Pattern not found (code): " + code));
    }

    @Transactional
    public ComposerPattern create(ComposerPattern p) {
        if (p.getCode() == null || p.getCode().isBlank()) {
            throw new IllegalArgumentException("code 는 필수입니다");
        }
        if (repo.existsByCode(p.getCode())) {
            throw new IllegalArgumentException("이미 존재하는 code 입니다: " + p.getCode());
        }
        if (p.getUseYn() == null) p.setUseYn("Y");
        if (p.getFrequency() == null) p.setFrequency(1);
        if (p.getSortOrder() == null) p.setSortOrder(0);
        return repo.save(p);
    }

    @Transactional
    public ComposerPattern update(String id, ComposerPattern patch) {
        ComposerPattern cur = get(id);
        if (patch.getCode() != null && !patch.getCode().equals(cur.getCode())) {
            if (repo.existsByCode(patch.getCode())) {
                throw new IllegalArgumentException("이미 존재하는 code 입니다: " + patch.getCode());
            }
            cur.setCode(patch.getCode());
        }
        if (patch.getLayout()         != null) cur.setLayout(patch.getLayout());
        if (patch.getCategory()       != null) cur.setCategory(patch.getCategory());
        if (patch.getName()           != null) cur.setName(patch.getName());
        if (patch.getNameEn()         != null) cur.setNameEn(patch.getNameEn());
        if (patch.getDescription()    != null) cur.setDescription(patch.getDescription());
        if (patch.getVisual()         != null) cur.setVisual(patch.getVisual());
        if (patch.getExampleFile()    != null) cur.setExampleFile(patch.getExampleFile());
        if (patch.getFrequency()      != null) cur.setFrequency(patch.getFrequency());
        if (patch.getRecommendedFor() != null) cur.setRecommendedFor(patch.getRecommendedFor());
        if (patch.getComponentStack() != null) cur.setComponentStack(patch.getComponentStack());
        if (patch.getWhenToUse()      != null) cur.setWhenToUse(patch.getWhenToUse());
        if (patch.getSortOrder()      != null) cur.setSortOrder(patch.getSortOrder());
        if (patch.getUseYn()          != null) cur.setUseYn(patch.getUseYn());
        return repo.save(cur);
    }

    @Transactional
    public void delete(String id) {
        repo.deleteById(id);
    }

    @Transactional
    public void toggleActive(String id) {
        ComposerPattern p = get(id);
        p.setUseYn("Y".equals(p.getUseYn()) ? "N" : "Y");
        repo.save(p);
    }
}
