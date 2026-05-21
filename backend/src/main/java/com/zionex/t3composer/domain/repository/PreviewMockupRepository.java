package com.zionex.t3composer.domain.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.zionex.t3composer.domain.entity.PreviewMockup;

public interface PreviewMockupRepository
        extends JpaRepository<PreviewMockup, PreviewMockup.Pk> {
}
