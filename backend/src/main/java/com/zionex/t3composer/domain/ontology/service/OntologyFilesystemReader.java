package com.zionex.t3composer.domain.ontology.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Stream;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zionex.t3composer.domain.ontology.dto.EntityDto;
import com.zionex.t3composer.domain.ontology.dto.ProcessMetaDto;
import com.zionex.t3composer.domain.ontology.dto.QaDto;
import com.zionex.t3composer.domain.ontology.dto.ViewMetaDto;
import com.zionex.t3composer.domain.service.TargetPathResolver;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Ontology base 데이터 (Q&A · Entity · View · Process) 를
 * Target 소스 트리의 <code>.insight_code/ontology_v2/</code> JSON 폴더에서 읽어 캐시한다.
 *
 * <p>경로: {@link TargetPathResolver#resolveSourcePath(String)} + <code>/.insight_code/ontology_v2</code>.
 * Target 마다 다른 경로일 수 있으나 상대 위치는 항상 동일.
 *
 * <p>전략:
 * <ul>
 *   <li><b>Lazy</b> — Target 별 첫 요청 시 1회 스캔.</li>
 *   <li><b>영속 캐시</b> — JVM 생존 동안 유지. 무효화는 {@link #invalidate(String)} 또는
 *       {@link #invalidateAll()} 로만.</li>
 *   <li><b>Per-Target 격리</b> — Target 별 root 가 다른 마운트라 캐시 키도 Target 별.</li>
 * </ul>
 *
 * <p>파일 매핑:
 * <ul>
 *   <li>QA       — L1/qa_patterns/<code>&lt;id&gt;.json</code></li>
 *   <li>ENTITY   — L2/ontology_entity/<code>&lt;entity_type&gt;/&lt;id&gt;.json</code>
 *                  (단, <code>OntologyProcess</code> 폴더 제외 — Process 로 분리)</li>
 *   <li>VIEW     — L2/screen_contracts/<code>&lt;menu_cd&gt;.json</code></li>
 *   <li>PROCESS  — L2/ontology_entity/OntologyProcess/<code>&lt;id&gt;.json</code></li>
 * </ul>
 *
 * <p>모든 JSON 파일은 공통 envelope: <code>{ id, doc_type, title, summary, keywords, body, provenance }</code>.
 * 실제 도메인 데이터는 <code>body</code> 안에 있다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OntologyFilesystemReader {

    /** Target 소스 루트 기준 ontology 폴더의 상대 경로. */
    public static final String ONTOLOGY_REL_PATH = ".insight_code/ontology_v2";

    /** entity_type 이 OntologyProcess 인 폴더 — Entity 가 아닌 Process 로 분류. */
    private static final String PROCESS_ENTITY_TYPE = "OntologyProcess";

    private final TargetPathResolver pathResolver;
    private final ObjectMapper mapper = new ObjectMapper();

    private final Map<String, TargetCache> cacheByTarget = new ConcurrentHashMap<>();

    // ─────────────────────────── 외부 API ───────────────────────────

    public QaDto getQa(String targetCd, String id) {
        return cache(targetCd).qaById.get(id);
    }

    public List<QaDto> listAllQa(String targetCd) {
        return List.copyOf(cache(targetCd).qaById.values());
    }

    public EntityDto getEntity(String targetCd, String id) {
        return cache(targetCd).entityById.get(id);
    }

    public List<EntityDto> listAllEntity(String targetCd) {
        return List.copyOf(cache(targetCd).entityById.values());
    }

    public ViewMetaDto getView(String targetCd, String menuCd) {
        return cache(targetCd).viewByMenuCd.get(menuCd);
    }

    public List<ViewMetaDto> listAllView(String targetCd) {
        return List.copyOf(cache(targetCd).viewByMenuCd.values());
    }

    public ProcessMetaDto getProcess(String targetCd, String processCd) {
        return cache(targetCd).processByCd.get(processCd);
    }

    public List<ProcessMetaDto> listAllProcess(String targetCd) {
        return List.copyOf(cache(targetCd).processByCd.values());
    }

    /** Target 캐시 폐기 — 다음 요청 시 재스캔. 파일 수동 갱신 후 호출. */
    public void invalidate(String targetCd) {
        if (targetCd == null) return;
        TargetCache removed = cacheByTarget.remove(safeTarget(targetCd));
        if (removed != null) {
            log.info("OntologyFilesystemReader: target {} 캐시 폐기", targetCd);
        }
    }

    public void invalidateAll() {
        int n = cacheByTarget.size();
        cacheByTarget.clear();
        log.info("OntologyFilesystemReader: 전체 캐시 폐기 ({}개 Target)", n);
    }

    /**
     * Target 의 ontology 폴더가 실제로 존재하는지. 진단/UI 표시용.
     * 캐시 빌드를 강제하지는 않음.
     */
    public boolean hasOntologyFolder(String targetCd) {
        Path root = resolveRoot(targetCd);
        return root != null && Files.isDirectory(root);
    }

    public String resolvedRootPath(String targetCd) {
        Path root = resolveRoot(targetCd);
        return root == null ? null : root.toString();
    }

    // ─────────────────────────── 캐시 빌드 ───────────────────────────

    private TargetCache cache(String targetCd) {
        return cacheByTarget.computeIfAbsent(safeTarget(targetCd), this::scan);
    }

    private TargetCache scan(String targetCd) {
        long t0 = System.currentTimeMillis();
        TargetCache c = new TargetCache();
        Path root = resolveRoot(targetCd);
        if (root == null || !Files.isDirectory(root)) {
            log.warn("OntologyFilesystemReader: target {} 의 ontology 폴더 부재 — 빈 캐시", targetCd);
            return c;
        }

        scanQa(root.resolve("L1/qa_patterns"), c);
        scanEntities(root.resolve("L2/ontology_entity"), c);
        scanViews(root.resolve("L2/screen_contracts"), c);

        long ms = System.currentTimeMillis() - t0;
        log.info("OntologyFilesystemReader: target {} 스캔 완료 — QA={} · Entity={} · View={} · Process={} ({} ms)",
            targetCd, c.qaById.size(), c.entityById.size(), c.viewByMenuCd.size(), c.processByCd.size(), ms);
        return c;
    }

    /** Target 별 raw mount slot — docker-compose 의 /workspace/targets/&lt;CD&gt;/wingui 컨벤션. */
    private static final String TARGETS_BASE = "/workspace/targets";

    /**
     * Target 의 ontology root 해석.
     *
     * <p>{@code .insight_code/ontology_v2} 는 보통 <b>프로젝트 루트</b> (소스 디렉토리와 같거나 상위) 에
     * 위치한다. Target 구조에 따라 위치가 다르므로 여러 후보를 차례로 시도:
     * <ol>
     *   <li>{@code /workspace/targets/&lt;CD&gt;/project} — docker-compose 의 Per-Target
     *       프로젝트 루트 슬롯 ({@code TARGET_&lt;CD&gt;_PROJECT_PATH}).
     *       <b>권장 설정</b> — T3SERIES 처럼 nested monorepo 일 때 wingui 와 분리해 명확.</li>
     *   <li>{@link TargetPathResolver#resolveSourcePath(String)} 결과부터 최대 5단계 위로 walk-up</li>
     *   <li>{@code /workspace/targets/&lt;CD&gt;/wingui} 마운트 slot 자체 (sourceMarker 미통과여도) —
     *       wingui = project root 인 평탄 구조 Target 호환.</li>
     * </ol>
     */
    private Path resolveRoot(String targetCd) {
        try {
            List<Path> candidates = new ArrayList<>();

            if (targetCd != null && !targetCd.isBlank()) {
                Path projectSlot = Path.of(TARGETS_BASE, targetCd, "project");
                if (Files.isDirectory(projectSlot)) candidates.add(projectSlot);
            }

            String src = pathResolver.resolveSourcePath(targetCd);
            if (src != null && !src.isBlank()) {
                Path c = Path.of(src);
                for (int i = 0; i < 5 && c != null; i++) {
                    candidates.add(c);
                    c = c.getParent();
                }
            }

            if (targetCd != null && !targetCd.isBlank()) {
                Path winguiSlot = Path.of(TARGETS_BASE, targetCd, "wingui");
                if (Files.isDirectory(winguiSlot)) candidates.add(winguiSlot);
            }

            for (Path c : candidates) {
                Path probe = c.resolve(ONTOLOGY_REL_PATH);
                if (Files.isDirectory(probe)) return probe;
            }
            return null;
        } catch (Exception e) {
            log.warn("OntologyFilesystemReader: resolveRoot 실패 ({}): {}", targetCd, e.getMessage());
            return null;
        }
    }

    // ─────────────────────────── 카테고리별 스캔 ───────────────────────────

    private void scanQa(Path qaDir, TargetCache c) {
        if (!Files.isDirectory(qaDir)) return;
        forEachJson(qaDir, false, file -> {
            try {
                JsonNode doc = mapper.readTree(file.toFile());
                JsonNode body = doc.path("body");
                String id = asString(doc, "id", asString(body, "qa_id", null));
                if (id == null) return;
                QaDto dto = QaDto.builder()
                    .id(id)
                    .question(asString(body, "question", null))
                    .answer(asString(body, "answer_sql", null))
                    .dbType(asString(body, "db_type", null))
                    .domain(asString(body, "business_domain", null))
                    .paraphrases(new ArrayList<>())
                    .relatedEntityIds(new ArrayList<>())
                    .notes(null)
                    .modifyDttm(null)
                    .build();
                c.qaById.put(id, dto);
            } catch (Exception e) {
                log.debug("QA file parse 실패 {}: {}", file, e.getMessage());
            }
        });
    }

    private void scanEntities(Path entityRoot, TargetCache c) {
        if (!Files.isDirectory(entityRoot)) return;
        try (Stream<Path> subdirs = Files.list(entityRoot)) {
            subdirs.filter(Files::isDirectory).forEach(sub -> {
                String typeFolder = sub.getFileName().toString();
                boolean isProcess = PROCESS_ENTITY_TYPE.equals(typeFolder);
                forEachJson(sub, false, file -> {
                    try {
                        JsonNode doc = mapper.readTree(file.toFile());
                        JsonNode body = doc.path("body");
                        String id = asString(doc, "id", null);
                        if (id == null) return;
                        if (isProcess) {
                            ProcessMetaDto dto = ProcessMetaDto.builder()
                                .id(id)
                                .processCd(id)
                                .processName(asString(body, "name", id))
                                .processOverview(asString(body, "description", null))
                                .module(asString(body, "business_domain", null))
                                .status("CONFIRMED")
                                .version(asString(body, "version", "1.0"))
                                .build();
                            c.processByCd.put(id, dto);
                        } else {
                            EntityDto dto = EntityDto.builder()
                                .id(id)
                                .version(asString(body, "version", "1.0"))
                                .name(asString(body, "name", id))
                                .entityType(asString(body, "entity_type", typeFolder))
                                .description(asString(body, "description", null))
                                .terms(asStringList(doc, "keywords"))
                                .status("CONFIRMED")
                                .importanceScore(null)
                                .relatedTableNames(new ArrayList<>())
                                .notes(null)
                                .modifyDttm(null)
                                .build();
                            c.entityById.put(id, dto);
                        }
                    } catch (Exception e) {
                        log.debug("Entity file parse 실패 {}: {}", file, e.getMessage());
                    }
                });
            });
        } catch (IOException e) {
            log.warn("Entity 폴더 스캔 실패 {}: {}", entityRoot, e.getMessage());
        }
    }

    private void scanViews(Path viewDir, TargetCache c) {
        if (!Files.isDirectory(viewDir)) return;
        forEachJson(viewDir, false, file -> {
            try {
                JsonNode doc = mapper.readTree(file.toFile());
                JsonNode body = doc.path("body");
                String id = asString(doc, "id", null);
                String menuCd = asString(body, "menu_cd", id);
                if (menuCd == null) return;
                ViewMetaDto dto = ViewMetaDto.builder()
                    .id(id == null ? menuCd : id)
                    .menuCd(menuCd)
                    .status("CONFIRMED")
                    .publishedVersion(asString(body, "version", null))
                    .build();
                c.viewByMenuCd.put(menuCd, dto);
            } catch (Exception e) {
                log.debug("View file parse 실패 {}: {}", file, e.getMessage());
            }
        });
    }

    // ─────────────────────────── helpers ───────────────────────────

    private void forEachJson(Path dir, boolean recurse, java.util.function.Consumer<Path> action) {
        try (Stream<Path> stream = recurse ? Files.walk(dir) : Files.list(dir)) {
            stream.filter(Files::isRegularFile)
                  .filter(p -> {
                      String n = p.getFileName().toString();
                      // _INDEX.jsonl · MANIFEST.json 등 메타 파일 제외
                      return n.endsWith(".json") && !n.startsWith("_") && !"MANIFEST.json".equals(n);
                  })
                  .forEach(action);
        } catch (IOException e) {
            log.warn("폴더 스캔 실패 {}: {}", dir, e.getMessage());
        }
    }

    private static String asString(JsonNode node, String field, String fallback) {
        if (node == null) return fallback;
        JsonNode v = node.get(field);
        if (v == null || v.isNull()) return fallback;
        String s = v.asText();
        return (s == null || s.isEmpty()) ? fallback : s;
    }

    private static List<String> asStringList(JsonNode node, String field) {
        if (node == null) return new ArrayList<>();
        JsonNode arr = node.get(field);
        if (arr == null || !arr.isArray()) return new ArrayList<>();
        List<String> out = new ArrayList<>(arr.size());
        for (JsonNode el : arr) {
            if (el != null && !el.isNull()) {
                String s = el.asText();
                if (s != null && !s.isEmpty()) out.add(s);
            }
        }
        return out;
    }

    private static String safeTarget(String c) {
        return (c == null || c.isBlank()) ? "T3SERIES" : c;
    }

    /** Target 별 in-memory index. */
    private static final class TargetCache {
        final Map<String, QaDto> qaById = new LinkedHashMap<>();
        final Map<String, EntityDto> entityById = new LinkedHashMap<>();
        final Map<String, ViewMetaDto> viewByMenuCd = new LinkedHashMap<>();
        final Map<String, ProcessMetaDto> processByCd = new LinkedHashMap<>();
    }

    // 사용 안 함 — 컴파일러 경고 회피용 (Collections import 유지).
    @SuppressWarnings("unused")
    private static <T> List<T> emptyImmutable() { return Collections.emptyList(); }
}
