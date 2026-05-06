package com.zionex.t3composer.domain.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.zionex.t3composer.domain.entity.ComposerMessage;

public interface ComposerMessageRepository extends JpaRepository<ComposerMessage, String> {

    List<ComposerMessage> findBySessionIdOrderByTurnSeqAsc(String sessionId);

    Optional<ComposerMessage> findBySessionIdAndTurnSeq(String sessionId, Integer turnSeq);

    @Query("SELECT COALESCE(MAX(m.turnSeq), 0) FROM ComposerMessage m WHERE m.sessionId = :sessionId")
    Integer findMaxTurnSeqBySessionId(String sessionId);

    void deleteBySessionId(String sessionId);
}
