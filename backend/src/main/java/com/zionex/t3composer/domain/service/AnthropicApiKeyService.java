package com.zionex.t3composer.domain.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.zionex.t3composer.shared.util.SecurityUtils;

import lombok.extern.slf4j.Slf4j;

/**
 * TB_IS_EXTRNLAPIKEY 테이블의 provider='anthropic' 레코드를 사용해
 * Anthropic API 키를 저장·조회한다.
 *
 * - 저장 시 SecurityUtils.encrypt() 로 암호화
 * - 조회 시 SecurityUtils.decrypt() 로 복호화하여 반환
 * - 동일 user_id + provider 조합은 1건만 유지 (기존 레코드 갱신)
 */
@Slf4j
@Service
public class AnthropicApiKeyService {

    public static final String PROVIDER = "anthropic";

    @PersistenceContext
    private EntityManager em;

    /**
     * 현재 사용자의 Anthropic API 키 저장 또는 갱신.
     */
    @Transactional
    public void saveApiKey(String userId, String apiKey, String description) {
        String encrypted = SecurityUtils.encrypt(apiKey);

        boolean exists = hasApiKey(userId);
        if (exists) {
            em.createNativeQuery(
                            "UPDATE TB_IS_EXTRNLAPIKEY "
                          + "   SET api_key_encrypted = :enc, "
                          + "       description = :desc, "
                          + "       is_active = 1, "
                          + "       created_at = :now "
                          + " WHERE user_id = :userId AND provider = :provider")
                    .setParameter("enc", encrypted)
                    .setParameter("desc", description)
                    .setParameter("now", LocalDateTime.now())
                    .setParameter("userId", userId)
                    .setParameter("provider", PROVIDER)
                    .executeUpdate();
            log.info("Anthropic API key updated for userId={}", userId);
        } else {
            String newId = UUID.randomUUID().toString().replace("-", "");
            em.createNativeQuery(
                            "INSERT INTO TB_IS_EXTRNLAPIKEY "
                          + "(id, user_id, provider, description, api_key_encrypted, "
                          + " credentials_json_encrypted, created_at, expires_at, is_active, scope) "
                          + "VALUES (:id, :userId, :provider, :desc, :enc, NULL, :now, NULL, 1, NULL)")
                    .setParameter("id", newId)
                    .setParameter("userId", userId)
                    .setParameter("provider", PROVIDER)
                    .setParameter("desc", description)
                    .setParameter("enc", encrypted)
                    .setParameter("now", LocalDateTime.now())
                    .executeUpdate();
            log.info("Anthropic API key inserted for userId={}", userId);
        }
    }

    /**
     * 현재 사용자의 Anthropic API 키 조회 (복호화).
     */
    @Transactional(readOnly = true)
    public Optional<String> getApiKey(String userId) {
        @SuppressWarnings("unchecked")
        List<Object> rows = em.createNativeQuery(
                        "SELECT api_key_encrypted "
                      + "  FROM TB_IS_EXTRNLAPIKEY "
                      + " WHERE user_id = :userId "
                      + "   AND provider = :provider "
                      + "   AND is_active = 1")
                .setParameter("userId", userId)
                .setParameter("provider", PROVIDER)
                .getResultList();

        if (rows == null || rows.isEmpty() || rows.get(0) == null) {
            return Optional.empty();
        }
        String encrypted = rows.get(0).toString();
        try {
            return Optional.ofNullable(SecurityUtils.decrypt(encrypted));
        } catch (Exception e) {
            log.error("Failed to decrypt Anthropic API key for userId={}: {}", userId, e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * 키 등록 여부 확인 (UI 의 '키 미등록' 안내용).
     */
    @Transactional(readOnly = true)
    public boolean hasApiKey(String userId) {
        Object cnt = em.createNativeQuery(
                        "SELECT COUNT(*) FROM TB_IS_EXTRNLAPIKEY "
                      + " WHERE user_id = :userId "
                      + "   AND provider = :provider "
                      + "   AND is_active = 1")
                .setParameter("userId", userId)
                .setParameter("provider", PROVIDER)
                .getSingleResult();
        return cnt != null && ((Number) cnt).intValue() > 0;
    }

    /**
     * 키 삭제.
     */
    @Transactional
    public void deleteApiKey(String userId) {
        em.createNativeQuery(
                        "DELETE FROM TB_IS_EXTRNLAPIKEY "
                      + " WHERE user_id = :userId AND provider = :provider")
                .setParameter("userId", userId)
                .setParameter("provider", PROVIDER)
                .executeUpdate();
        log.info("Anthropic API key deleted for userId={}", userId);
    }
}
