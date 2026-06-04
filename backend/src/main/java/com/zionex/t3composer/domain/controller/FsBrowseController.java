package com.zionex.t3composer.domain.controller;

import java.io.IOException;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Workspace 내 폴더 한 단계 탐색 API.
 *
 * UI 의 FolderPickerDialog (Project Repo 등록 다이얼로그) 가 호출하는 백엔드.
 * docker-compose 가 호스트 {@code COMPOSER_WORKSPACE_ROOT} 를
 * {@code /workspace/projects} 로 마운트하므로, 그 안쪽 디렉토리만 탐색 허용.
 *
 * 응답 contract — Insight-Neo 의 {@code GET /ontology-v2/data/fs-tree} 와 동일:
 * <pre>
 *   { ok, path, parent (null=root), initial_cwd, is_root,
 *     items: [ {name, type:'dir', child_count} ],
 *     message? }
 * </pre>
 *
 * 보안 boundary — workspace root 밖 path 는 거부 (path traversal 차단).
 */
@Slf4j
@RestController
@RequestMapping("/composer/fs")
@RequiredArgsConstructor
public class FsBrowseController {

    /** docker-compose 가 마운트하는 workspace 컨테이너 path — 모든 탐색의 root */
    private static final Path WORKSPACE_ROOT = Paths.get("/workspace/projects");

    /** 디렉토리 listing 시 숨길 폴더 — 대용량/무의미. node_modules 는 child_count 계산도 비용 큼 */
    private static final Set<String> HIDDEN_DIRS = Set.of(
        ".git", "node_modules", ".gradle", ".idea", ".vscode", "target", "build",
        "dist", ".next", "__pycache__", ".pytest_cache", ".mvn"
    );

    @GetMapping("/browse")
    public ResponseEntity<Map<String, Object>> browse(
            @RequestParam(value = "path", required = false) String pathParam) {

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("initial_cwd", WORKSPACE_ROOT.toString());

        // 1) path 비면 root 로 시작
        Path target;
        if (pathParam == null || pathParam.isBlank()) {
            target = WORKSPACE_ROOT;
        } else {
            try {
                target = Paths.get(pathParam).toAbsolutePath().normalize();
            } catch (Exception e) {
                resp.put("ok", false);
                resp.put("path", pathParam);
                resp.put("parent", null);
                resp.put("is_root", false);
                resp.put("items", Collections.emptyList());
                resp.put("message", "잘못된 path 형식: " + e.getMessage());
                return ResponseEntity.ok(resp);
            }
        }

        // 2) workspace boundary 검증 — symlink 우회 차단 위해 realPath 비교
        Path realRoot;
        try {
            realRoot = WORKSPACE_ROOT.toRealPath();
        } catch (IOException e) {
            log.error("workspace root resolve 실패 — {}", WORKSPACE_ROOT, e);
            resp.put("ok", false);
            resp.put("path", target.toString());
            resp.put("parent", null);
            resp.put("is_root", true);
            resp.put("items", Collections.emptyList());
            resp.put("message", "workspace root 가 마운트되지 않았습니다 (COMPOSER_WORKSPACE_ROOT 확인)");
            return ResponseEntity.ok(resp);
        }

        Path realTarget;
        try {
            // target 이 존재하지 않을 수 있음 — 그 땐 toRealPath 가 실패하므로 normalize 만으로 검증
            realTarget = Files.exists(target) ? target.toRealPath() : target;
        } catch (IOException e) {
            resp.put("ok", false);
            resp.put("path", target.toString());
            resp.put("parent", null);
            resp.put("is_root", false);
            resp.put("items", Collections.emptyList());
            resp.put("message", "path resolve 실패: " + e.getMessage());
            return ResponseEntity.ok(resp);
        }

        if (!realTarget.startsWith(realRoot)) {
            resp.put("ok", false);
            resp.put("path", target.toString());
            resp.put("parent", null);
            resp.put("is_root", false);
            resp.put("items", Collections.emptyList());
            resp.put("message", "workspace 밖 경로 — " + realRoot + " 하위만 탐색 가능");
            return ResponseEntity.ok(resp);
        }

        // 3) parent — root 이면 null (위로 못 올라감)
        boolean isRoot = realTarget.equals(realRoot);
        String parent = isRoot ? null : realTarget.getParent().toString();

        // 4) 존재 여부 및 디렉토리 여부
        if (!Files.exists(realTarget)) {
            resp.put("ok", false);
            resp.put("path", realTarget.toString());
            resp.put("parent", parent);
            resp.put("is_root", isRoot);
            resp.put("items", Collections.emptyList());
            resp.put("message", "존재하지 않는 경로입니다");
            return ResponseEntity.ok(resp);
        }
        if (!Files.isDirectory(realTarget)) {
            resp.put("ok", false);
            resp.put("path", realTarget.toString());
            resp.put("parent", parent);
            resp.put("is_root", isRoot);
            resp.put("items", Collections.emptyList());
            resp.put("message", "디렉토리가 아닙니다");
            return ResponseEntity.ok(resp);
        }

        // 5) listing — 디렉토리만, 숨김 제외, 알파벳 정렬
        List<Map<String, Object>> items = new ArrayList<>();
        try (DirectoryStream<Path> stream = Files.newDirectoryStream(realTarget,
                p -> Files.isDirectory(p) && !HIDDEN_DIRS.contains(p.getFileName().toString()))) {
            for (Path entry : stream) {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("name", entry.getFileName().toString());
                item.put("type", "dir");
                item.put("child_count", countChildDirs(entry));
                items.add(item);
            }
        } catch (IOException e) {
            log.warn("listing 실패 {} — {}", realTarget, e.getMessage());
            resp.put("ok", false);
            resp.put("path", realTarget.toString());
            resp.put("parent", parent);
            resp.put("is_root", isRoot);
            resp.put("items", Collections.emptyList());
            resp.put("message", "listing 실패: " + e.getMessage());
            return ResponseEntity.ok(resp);
        }

        items.sort(Comparator.comparing(m -> ((String) m.get("name")).toLowerCase()));

        resp.put("ok", true);
        resp.put("path", realTarget.toString());
        resp.put("parent", parent);
        resp.put("is_root", isRoot);
        resp.put("items", items);
        return ResponseEntity.ok(resp);
    }

    /** child 디렉토리 개수 (UX 힌트). I/O 실패 시 -1 반환. node_modules 등 large dir 은 0 으로 fallback. */
    private static int countChildDirs(Path dir) {
        // node_modules 등은 이미 HIDDEN_DIRS 로 제외됨
        try (DirectoryStream<Path> stream = Files.newDirectoryStream(dir,
                p -> Files.isDirectory(p) && !HIDDEN_DIRS.contains(p.getFileName().toString()))) {
            int n = 0;
            for (Path ignored : stream) {
                n++;
                if (n >= 999) return 999;   // cap for huge dirs
            }
            return n;
        } catch (IOException e) {
            return -1;
        }
    }
}
