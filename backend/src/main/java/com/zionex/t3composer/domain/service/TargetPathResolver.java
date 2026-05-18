package com.zionex.t3composer.domain.service;

import java.nio.file.Files;
import java.nio.file.Path;

import org.springframework.stereotype.Service;

import com.zionex.t3composer.config.ApplicationProperties;
import com.zionex.t3composer.domain.entity.TargetSystem;
import com.zionex.t3composer.domain.repository.TargetSystemRepository;

import lombok.RequiredArgsConstructor;

/**
 * Target System 별 source / database 폴더 경로 해석.
 *
 * 우선순위:
 *  1. Target.sourceRefPath / databaseRefPath (Target 별 명시 설정)
 *  2. Per-Target 마운트 convention — /workspace/targets/&lt;CD&gt;/{wingui|database}
 *     (docker-compose 에서 TARGET_&lt;CD&gt;_WINGUI_PATH 가 .env 에 설정된 경우 활성 —
 *     mount path 의 'wingui' 토큰은 호환을 위한 내부 이름이며 의미는 'source')
 *  3. app.composer.wingui-ref-path / database-ref-path (글로벌 fallback — application.yaml)
 *  4. 컨테이너 안 default (/workspace/wingui · /workspace/database)
 *
 * 각 후보는 단순 디렉토리 존재가 아니라 <b>구조 마커</b> 보유 여부로 채택한다.
 * docker-compose 는 per-Target slot 미설정 시 빈 './empty' (.gitkeep 만 든) 디렉토리를
 * 마운트하므로, isDirectory 검사만으로는 빈 슬롯을 실제 소스로 오인해 다음 우선순위
 * (실제 소스가 있는 글로벌 마운트) 로 fallback 하지 못한다. → SOURCE_MARKER /
 * DATABASE_MARKER 하위 구조까지 확인해야 빈 placeholder 를 건너뛴다.
 *
 * 모든 경로는 컨테이너 안 절대경로. host 와의 매핑은 docker-compose 의 마운트가 책임.
 * 호스트 path 가 드라이브 단위로 달라도 docker-compose 가 슬롯별로 독립 마운트하므로 OK.
 */
@Service
@RequiredArgsConstructor
public class TargetPathResolver {

    private static final String DEFAULT_WINGUI_PATH   = "/workspace/wingui";
    private static final String DEFAULT_DATABASE_PATH = "/workspace/database";
    private static final String TARGETS_BASE          = "/workspace/targets";

    // 후보 디렉토리가 "실제 소스/DB 루트" 인지 가리는 하위 구조 마커.
    // 빈 './empty' placeholder 슬롯 (.gitkeep 만 보유) 은 이 마커가 없어 자동 탈락한다.
    private static final String SOURCE_MARKER   = "packages/wingui/src";  // wingui 소스 루트
    private static final String DATABASE_MARKER = "mssql";                // DB 스크립트 루트

    private final TargetSystemRepository targetRepo;
    private final ApplicationProperties  props;

    public String resolveSourcePath(String targetCd) {
        // 각 단계의 path 는 컨테이너 안에서 wingui 소스 구조(SOURCE_MARKER)를 가질 때만 채택.
        // 빈 placeholder 슬롯이나 잘못된 host path 는 자동으로 다음 우선순위로 fallback.
        String byTarget = targetCd == null ? null
                : targetRepo.findById(targetCd).map(TargetSystem::getSourceRefPath).orElse(null);
        if (looksLikeSourceRoot(byTarget)) return byTarget;
        if (targetCd != null && !targetCd.isBlank()) {
            String convention = TARGETS_BASE + "/" + targetCd + "/wingui";
            if (looksLikeSourceRoot(convention)) return convention;
        }
        String global = props.getComposer().getWinguiRefPath();
        if (looksLikeSourceRoot(global)) return global;
        return DEFAULT_WINGUI_PATH;
    }

    /** @deprecated 이전 이름 호환 — {@link #resolveSourcePath(String)} 사용. */
    @Deprecated
    public String resolveWinguiPath(String targetCd) {
        return resolveSourcePath(targetCd);
    }

    public String resolveDatabasePath(String targetCd) {
        String byTarget = targetCd == null ? null
                : targetRepo.findById(targetCd).map(TargetSystem::getDatabaseRefPath).orElse(null);
        if (looksLikeDatabaseRoot(byTarget)) return byTarget;
        if (targetCd != null && !targetCd.isBlank()) {
            String convention = TARGETS_BASE + "/" + targetCd + "/database";
            if (looksLikeDatabaseRoot(convention)) return convention;
        }
        String global = props.getComposer().getDatabaseRefPath();
        if (looksLikeDatabaseRoot(global)) return global;
        return DEFAULT_DATABASE_PATH;
    }

    /** wingui 소스 루트 여부 — 디렉토리 존재 + 'packages/wingui/src' 하위 구조 보유. */
    private static boolean looksLikeSourceRoot(String pathStr) {
        return hasMarker(pathStr, SOURCE_MARKER);
    }

    /** DB 스크립트 루트 여부 — 디렉토리 존재 + 'mssql' 하위 구조 보유. */
    private static boolean looksLikeDatabaseRoot(String pathStr) {
        return hasMarker(pathStr, DATABASE_MARKER);
    }

    /**
     * pathStr 가 디렉토리이고 그 아래에 markerRel 하위 구조가 있으면 true.
     * 단순 isDirectory 가 아니라 마커까지 봐야 빈 './empty' placeholder 슬롯을 걸러낸다.
     */
    private static boolean hasMarker(String pathStr, String markerRel) {
        if (pathStr == null || pathStr.isBlank()) return false;
        try {
            Path root = Path.of(pathStr);
            return Files.isDirectory(root) && Files.isDirectory(root.resolve(markerRel));
        } catch (Exception e) {
            return false;
        }
    }
}
