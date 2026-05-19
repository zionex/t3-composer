package com.zionex.t3composer.config;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Data;

/**
 * Target 별 거버넌스 설정 스냅샷/복원 대상 정의.
 *
 * 스냅샷 범위 = repoRoot 하위의 trackedRoots(디렉토리) + trackedFiles(개별 파일).
 * excludeGlobs 는 capture/restore 양쪽에서 제외 — 복원 삭제 단계에서도 절대 건드리지 않는다.
 *
 * 'app.governance-snapshot' prefix 로 application.yaml override 가능. 리스트는 기본값으로 충분.
 */
@Data
@Component
@ConfigurationProperties(prefix = "app.governance-snapshot")
public class GovernanceSnapshotProperties {

    /** 거버넌스 루트 — 컨테이너 안 절대경로. docker-compose 의 `./:/workspace/repo:rw` 마운트와 매칭. */
    private String repoRoot = "/workspace/repo";

    /** 스냅샷 대상 디렉토리 (repoRoot 기준 상대). 통째 walk. */
    private List<String> trackedRoots = List.of(".claude", "docs");

    /** 스냅샷 대상 개별 파일 (repoRoot 기준 상대). 각 파일이 자체 tracked_root 가 됨. */
    private List<String> trackedFiles = List.of("CLAUDE.md", "README.md", "TROUBLESHOOTING.md", ".env");

    /** capture/restore 양쪽에서 제외 (glob). 복원 삭제 단계도 이 패턴은 절대 touch 안 함. */
    private List<String> excludeGlobs = List.of(
            ".claude/settings.local.json",
            ".claude/scheduled_tasks/**",
            ".claude/scheduled_tasks.lock",
            "staging/**",
            "**/node_modules/**",
            "**/.git/**",
            "backend/**",
            "frontend/**"
    );

    /** 시크릿 값 암호화 대상 파일 (repoRoot 기준 상대). */
    private List<String> secretFiles = List.of(".env");

    /** 이 확장자/파일명은 실행권한(+x) 복원 대상. */
    private List<String> executableExtensions = List.of(".sh");
}
