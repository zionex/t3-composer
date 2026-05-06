package com.zionex.t3composer.domain.service;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.zionex.t3composer.domain.entity.ComposerArtifact;
import com.zionex.t3composer.domain.repository.ComposerArtifactRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Composer 아티팩트 저장 + 이전 버전 supersede 를 트랜잭션 단위로 묶는 전용 빈.
 *
 * 분리 이유 (2026-04-27):
 *  - ComposerService 의 chat 흐름이 Mono.fromCallable() 안에서 persistAssistantResponse 를
 *    self-invocation 으로 호출 → Spring AOP proxy 우회 → @Transactional 미적용
 *  - @Modifying UPDATE 쿼리(markSupersededByPath/markSupersededByTypeNullPath) 는 명시적
 *    트랜잭션 컨텍스트 필수. proxy 우회 시 TransactionRequiredException 발생 (500)
 *  - 별도 @Component 로 분리하면 외부 빈 호출이라 proxy 가 정상 적용됨
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ArtifactPersistService {

    private final ComposerArtifactRepository artifactRepo;

    /**
     * SP 이름에서 ACTION suffix (Q1/S1/D1/POP_Q1/CHART_Q1 등) 추출 — NN 기반 이름변경 감지용.
     * 매칭 그룹: 1=DOMAIN, 2=NN(숫자), 3=ACTION.
     *
     * 참고: SCREEN_NAME 기반 (예: SP_UI_UT_USER_INFO_MGMT_Q1) 은 이 정규식에 의도적으로 매칭되지 않음.
     *  · SCREEN_NAME 케이스는 동일 도메인+동일 ACTION 이어도 다른 화면일 가능성이 높아
     *    auto-discard 휴리스틱이 false positive 위험.
     *  · 사용자가 SCREEN_NAME 변경 시에는 cleanup-orphans API 로 명시적 정리 필요.
     */
    private static final Pattern SP_NAME_NN_FORM = Pattern.compile(
            "^SP_UI_([A-Z]+)_(\\d{1,3})_(POP_[A-Z][A-Z0-9_]*|CHART_[A-Z][A-Z0-9_]*|BATCH|Q[0-9]+|S[0-9]+|D[0-9]+|J[0-9]*|M[0-9]+)$",
            Pattern.CASE_INSENSITIVE);
    /** SP 본문에서 CREATE [OR ALTER] PROCEDURE 의 SP 이름 추출 */
    private static final Pattern SP_HEADER = Pattern.compile(
            "\\bCREATE\\s+(?:OR\\s+ALTER\\s+)?(?:PROCEDURE|PROC|FUNCTION)" +
            "\\s+(?:\\[?dbo\\]?\\s*\\.\\s*)?\\[?(SP_[A-Z][A-Z0-9_]+|FN_[A-Z][A-Z0-9_]+)\\]?",
            Pattern.CASE_INSENSITIVE);

    /**
     * 새 아티팩트 리스트를 저장하면서 다음 두 가지 supersede 를 수행:
     *   1) 같은 (sessionId, artifactType, filePath) 의 기존 비-DISCARDED 아티팩트 → STATUS_DISCARDED
     *   2) [SP 전용] 같은 (sessionId, ACTION suffix) 인데 filePath 가 다른 기존 SQL_SP 아티팩트 → STATUS_DISCARDED
     *      (예: SP_UI_UT_01_Q1.sql → SP_UI_UT_05_Q1.sql 로 이름 변경된 경우 이전 _Q1 아티팩트 정리)
     *
     * versionNo 도 자동 채번 (직전 최대값 + 1).
     *
     * @return supersede 된 이전 아티팩트 수
     */
    @Transactional
    public int saveWithSupersede(List<ComposerArtifact> artifacts) {
        if (artifacts == null || artifacts.isEmpty()) return 0;

        int totalSuperseded = 0;
        for (ComposerArtifact a : artifacts) {
            int n;
            if (a.getFilePath() == null || a.getFilePath().isBlank()) {
                n = artifactRepo.markSupersededByTypeNullPath(
                        a.getSessionId(), a.getArtifactType(),
                        ComposerArtifact.STATUS_DISCARDED);
            } else {
                n = artifactRepo.markSupersededByPath(
                        a.getSessionId(), a.getArtifactType(), a.getFilePath(),
                        ComposerArtifact.STATUS_DISCARDED);
            }
            totalSuperseded += n;

            // [SP 이름 변경 감지] — SQL_SP 일 때만, ACTION suffix 가 같으나 filePath 가 다른
            // 기존 DRAFT SP 가 있으면 함께 DISCARDED 처리.
            // 사고 사례 (2026-04-29): 사용자가 "SP 이름을 SP_UI_UT_05_Q1 로 바꿔줘" 요청 시
            // 새 _05_Q1 만 생성되고 기존 _01_Q1 아티팩트는 zombie 로 잔존 → apply 시 둘 다 실행되어
            // 다른 화면이 쓰는 _01_Q1 까지 덮어씀.
            if (ComposerArtifact.TYPE_SQL_SP.equals(a.getArtifactType())) {
                int renamed = supersedeSpRenameOrphans(a);
                totalSuperseded += renamed;
            }

            Integer prev;
            if (a.getFilePath() == null || a.getFilePath().isBlank()) {
                prev = artifactRepo.findMaxVersionNoForNullPath(
                        a.getSessionId(), a.getArtifactType());
            } else {
                prev = artifactRepo.findMaxVersionNoByPath(
                        a.getSessionId(), a.getArtifactType(), a.getFilePath());
            }
            a.setVersionNo((prev == null ? 0 : prev) + 1);
        }
        artifactRepo.saveAll(artifacts);
        return totalSuperseded;
    }

    /**
     * NN 기반 SP 이름변경 자동 감지 — 같은 (DOMAIN, NN-form, ACTION suffix) 인데 NN 만 다른 SP 가 있으면
     * 이전 것을 DISCARDED 처리. 단 filePath 가 동일하면 이미 markSupersededByPath 로 처리됨.
     *
     * 매칭 시나리오:
     *   - SP_UI_UT_01_Q1 ↔ SP_UI_UT_05_Q1 : 둘 다 NN 형식 + 같은 _Q1 → 이전 것 DISCARD (rename)
     *   - SP_UI_UT_01_Q1 ↔ SP_UI_UT_01_Q2 : 다른 ACTION → 별개 SP, 둘 다 유지
     *
     * 비-매칭 (의도적):
     *   - SCREEN_NAME 기반 (SP_UI_UT_USER_INFO_MGMT_Q1) 은 SP_NAME_NN_FORM 매칭 실패 → 처리 안 함.
     *     → 다른 SCREEN_NAME 일 수 있어 false positive 위험. cleanup-orphans API 로 명시적 정리.
     *   - NN ↔ SCREEN_NAME 혼합 (SP_UI_UT_05_Q1 ↔ SP_UI_UT_USERINFO_Q1) 도 처리 안 함.
     */
    private int supersedeSpRenameOrphans(ComposerArtifact newArtifact) {
        String newSpName = extractSpName(newArtifact.getContent());
        if (newSpName == null) return 0;

        Matcher m = SP_NAME_NN_FORM.matcher(newSpName.toUpperCase());
        if (!m.find()) return 0;  // SCREEN_NAME 기반은 자동 처리 대상 아님
        String newDomain = m.group(1);
        String newAction = m.group(3);

        int discarded = 0;
        try {
            List<ComposerArtifact> existing = artifactRepo
                    .findBySessionIdAndArtifactTypeOrderByCreateDttmDesc(
                            newArtifact.getSessionId(), ComposerArtifact.TYPE_SQL_SP);
            for (ComposerArtifact old : existing) {
                if (old.getId() == null) continue;
                if (ComposerArtifact.STATUS_DISCARDED.equals(old.getStatus())) continue;
                if (newArtifact.getFilePath() != null
                        && newArtifact.getFilePath().equals(old.getFilePath())) continue;

                String oldSpName = extractSpName(old.getContent());
                if (oldSpName == null) continue;
                Matcher om = SP_NAME_NN_FORM.matcher(oldSpName.toUpperCase());
                if (!om.find()) continue;  // 한 쪽이라도 SCREEN_NAME 형식이면 skip

                String oldDomain = om.group(1);
                String oldAction = om.group(3);
                if (newDomain.equals(oldDomain) && newAction.equals(oldAction)
                        && !oldSpName.equalsIgnoreCase(newSpName)) {
                    old.setStatus(ComposerArtifact.STATUS_DISCARDED);
                    artifactRepo.save(old);
                    discarded++;
                    log.info("Composer SP rename auto-discard (NN 기반): session={} oldSp={} → newSp={}",
                             newArtifact.getSessionId(), oldSpName, newSpName);
                }
            }
        } catch (Exception e) {
            log.warn("SP rename orphan supersede 실패 (영향 없음 — 새 SP 저장은 진행): {}", e.getMessage());
        }
        return discarded;
    }

    private static String extractSpName(String sql) {
        if (sql == null || sql.isBlank()) return null;
        Matcher m = SP_HEADER.matcher(sql);
        if (!m.find()) return null;
        return m.group(1);
    }
}
