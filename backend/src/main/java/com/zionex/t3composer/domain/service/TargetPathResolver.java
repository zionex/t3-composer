package com.zionex.t3composer.domain.service;

import java.nio.file.Files;
import java.nio.file.Path;

import org.springframework.stereotype.Service;

import com.zionex.t3composer.config.ApplicationProperties;
import com.zionex.t3composer.domain.entity.TargetSystem;
import com.zionex.t3composer.domain.repository.TargetSystemRepository;

import lombok.RequiredArgsConstructor;

/**
 * Target System 별 wingui / database 폴더 경로 해석.
 *
 * 우선순위:
 *  1. Target.winguiRefPath / databaseRefPath (Target 별 명시 설정)
 *  2. Per-Target 마운트 convention — /workspace/targets/&lt;CD&gt;/{wingui|database}
 *     (docker-compose 에서 TARGET_&lt;CD&gt;_WINGUI_PATH 가 .env 에 설정된 경우 활성)
 *  3. app.composer.wingui-ref-path / database-ref-path (글로벌 fallback — application.yaml)
 *  4. 컨테이너 안 default (/workspace/wingui · /workspace/database)
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

    private final TargetSystemRepository targetRepo;
    private final ApplicationProperties  props;

    public String resolveWinguiPath(String targetCd) {
        // 각 단계의 path 는 컨테이너 안에서 실제 디렉토리일 때만 채택.
        // (사용자가 host path 를 입력해 컨테이너 안에서 valid 하지 않은 경우 자동 fallback)
        String byTarget = targetCd == null ? null
                : targetRepo.findById(targetCd).map(TargetSystem::getWinguiRefPath).orElse(null);
        if (validDir(byTarget)) return byTarget;
        if (targetCd != null && !targetCd.isBlank()) {
            String convention = TARGETS_BASE + "/" + targetCd + "/wingui";
            if (validDir(convention)) return convention;
        }
        String global = props.getComposer().getWinguiRefPath();
        if (validDir(global)) return global;
        return DEFAULT_WINGUI_PATH;
    }

    public String resolveDatabasePath(String targetCd) {
        String byTarget = targetCd == null ? null
                : targetRepo.findById(targetCd).map(TargetSystem::getDatabaseRefPath).orElse(null);
        if (validDir(byTarget)) return byTarget;
        if (targetCd != null && !targetCd.isBlank()) {
            String convention = TARGETS_BASE + "/" + targetCd + "/database";
            if (validDir(convention)) return convention;
        }
        String global = props.getComposer().getDatabaseRefPath();
        if (validDir(global)) return global;
        return DEFAULT_DATABASE_PATH;
    }

    private static boolean validDir(String pathStr) {
        if (pathStr == null || pathStr.isBlank()) return false;
        try { return Files.isDirectory(Path.of(pathStr)); }
        catch (Exception e) { return false; }
    }
}
