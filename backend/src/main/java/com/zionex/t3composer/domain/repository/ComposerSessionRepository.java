package com.zionex.t3composer.domain.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.zionex.t3composer.domain.entity.ComposerSession;

public interface ComposerSessionRepository extends JpaRepository<ComposerSession, String> {

    List<ComposerSession> findByUserIdOrderByCreateDttmDesc(String userId);

    List<ComposerSession> findByUserIdAndStatusOrderByCreateDttmDesc(String userId, String status);

    List<ComposerSession> findByUserIdAndModeOrderByCreateDttmDesc(String userId, String mode);
}
