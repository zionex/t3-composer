package com.zionex.t3composer.domain.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.zionex.t3composer.domain.entity.ComposerArtifact;

public interface ComposerArtifactRepository extends JpaRepository<ComposerArtifact, String> {

    List<ComposerArtifact> findBySessionIdOrderByCreateDttmDesc(String sessionId);

    List<ComposerArtifact> findBySessionIdAndArtifactTypeOrderByCreateDttmDesc(String sessionId, String artifactType);

    List<ComposerArtifact> findBySessionIdAndStatusOrderByCreateDttmDesc(String sessionId, String status);

    /** 특정 status 만 제외하고 시간순 — UI 의 기본 listArtifacts 가 DISCARDED 제외용 */
    List<ComposerArtifact> findBySessionIdAndStatusNotOrderByCreateDttmDesc(String sessionId, String status);

    boolean existsBySessionIdAndArtifactTypeAndStatus(String sessionId, String artifactType, String status);

    boolean existsBySessionIdAndArtifactTypeNotAndStatus(String sessionId, String artifactType, String status);

    /**
     * 메뉴등록 아티팩트(MENU_SQL · MENU_JS) 를 제외한 STATUS_FINAL 아티팩트 존재 여부.
     * 세션 COMPLETED 전이 조건의 "그 외 아티팩트 적용 완료" 판정에 사용 — Target.menu_source
     * 가 DB/JS_FILE 어느 쪽이든 동일 로직으로 처리하기 위해 두 메뉴 타입 모두 IN 으로 제외.
     */
    @Query("SELECT (COUNT(a) > 0) FROM ComposerArtifact a" +
           " WHERE a.sessionId = :sessionId" +
           "   AND a.artifactType NOT IN :menuTypes" +
           "   AND a.status = :status")
    boolean existsNonMenuArtifactFinal(@Param("sessionId") String sessionId,
                                       @Param("menuTypes") List<String> menuTypes,
                                       @Param("status") String status);

    /**
     * 같은 (session, artifactType, filePath) 의 기존 아티팩트 조회 — supersede 대상.
     * 새 아티팩트 저장 직전에 호출해 이 결과를 STATUS_DISCARDED 로 마킹한다.
     */
    List<ComposerArtifact> findBySessionIdAndArtifactTypeAndFilePathAndStatusNot(
            String sessionId, String artifactType, String filePath, String status);

    /** filePath 가 null 인 아티팩트(예: MESSAGE_TEXT 마커 없는 출력) 의 같은 type 조회 */
    List<ComposerArtifact> findBySessionIdAndArtifactTypeAndFilePathIsNullAndStatusNot(
            String sessionId, String artifactType, String status);

    /**
     * 같은 (session, artifactType, filePath) 의 직전 아티팩트들을 일괄 STATUS_DISCARDED 로 변경.
     * 새 아티팩트 saveAll 전에 호출 — 이전 버전을 history 로 보존하되 listArtifacts 기본 출력에서 제외.
     */
    @Modifying
    @Query("UPDATE ComposerArtifact a SET a.status = :newStatus" +
           " WHERE a.sessionId = :sessionId" +
           "   AND a.artifactType = :artifactType" +
           "   AND a.filePath = :filePath" +
           "   AND a.status <> :newStatus")
    int markSupersededByPath(@Param("sessionId") String sessionId,
                             @Param("artifactType") String artifactType,
                             @Param("filePath") String filePath,
                             @Param("newStatus") String newStatus);

    /** filePath 가 null 인 케이스 supersede */
    @Modifying
    @Query("UPDATE ComposerArtifact a SET a.status = :newStatus" +
           " WHERE a.sessionId = :sessionId" +
           "   AND a.artifactType = :artifactType" +
           "   AND a.filePath IS NULL" +
           "   AND a.status <> :newStatus")
    int markSupersededByTypeNullPath(@Param("sessionId") String sessionId,
                                     @Param("artifactType") String artifactType,
                                     @Param("newStatus") String newStatus);

    /**
     * 세션의 같은 (type, filePath) 직전 최대 versionNo 조회 — null 이면 0.
     * (filePath 가 null 인 경우는 별도 메서드 — JPQL 의 :filePath IS NULL 비교는 Hibernate
     *  타입 추론 실패로 TransactionRequiredException 또는 IllegalArgumentException 유발)
     */
    @Query("SELECT COALESCE(MAX(a.versionNo), 0) FROM ComposerArtifact a" +
           " WHERE a.sessionId = :sessionId" +
           "   AND a.artifactType = :artifactType" +
           "   AND a.filePath = :filePath")
    Integer findMaxVersionNoByPath(@Param("sessionId") String sessionId,
                                   @Param("artifactType") String artifactType,
                                   @Param("filePath") String filePath);

    /** filePath 가 null 인 케이스 max versionNo */
    @Query("SELECT COALESCE(MAX(a.versionNo), 0) FROM ComposerArtifact a" +
           " WHERE a.sessionId = :sessionId" +
           "   AND a.artifactType = :artifactType" +
           "   AND a.filePath IS NULL")
    Integer findMaxVersionNoForNullPath(@Param("sessionId") String sessionId,
                                        @Param("artifactType") String artifactType);

    /** DISCARDED 아티팩트 hard delete — 사용자 명시적 cleanup 액션 */
    @Modifying
    @Query("DELETE FROM ComposerArtifact a" +
           " WHERE a.sessionId = :sessionId AND a.status = :status")
    int deleteBySessionIdAndStatus(@Param("sessionId") String sessionId,
                                   @Param("status") String status);

    void deleteBySessionId(String sessionId);
}
