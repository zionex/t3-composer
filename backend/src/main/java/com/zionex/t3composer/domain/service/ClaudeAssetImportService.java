package com.zionex.t3composer.domain.service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Stream;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.zionex.t3composer.domain.entity.TargetHook;
import com.zionex.t3composer.domain.entity.TargetRule;
import com.zionex.t3composer.domain.repository.TargetHookRepository;
import com.zionex.t3composer.domain.repository.TargetRuleRepository;
import com.zionex.t3composer.domain.repository.TargetSystemRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * .claude/rules/*.md + hooks/**.sh 를 Target Rule/Hook 테이블로 import.
 *
 * 동작:
 *  · {claudeRoot}/rules/*.md           → TB_CMP_TARGET_RULE upsert
 *  · {claudeRoot}/hooks/&#42;&#42;/&#42;.sh        → TB_CMP_TARGET_HOOK upsert (event 는 폴더로 추정)
 *  · CLAUDE.md (있으면)                → TB_CMP_TARGET_RULE rule_code='00-claude-md' 로 추가
 *
 * upsert 규칙:
 *  · target_cd + rule_code 매칭하여 content_hash 가 다르면 rule_version+1 로 새 row 생성, 이전은 use_yn='N'
 *  · target_cd + script_name 매칭하여 content_hash 가 다르면 UPDATE
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ClaudeAssetImportService {

    private final TargetSystemRepository targetRepo;
    private final TargetRuleRepository   ruleRepo;
    private final TargetHookRepository   hookRepo;

    /** 수집 단계의 rule 파일 정보 (ruleCode 단위 dedupe 대상). */
    private record RuleFile(String ruleCode, String title, Path file, int priority, String appliesTo) {}
    /** 수집 단계의 hook 파일 정보 (scriptName 단위 dedupe 대상). */
    private record HookFile(String scriptName, Path file, Path hooksRoot) {}

    /**
     * 지정 Target 의 claude assets 를 여러 폴더에서 import (공용 + Target overlay).
     *
     * ★ collect-then-upsert (2026-06):
     *  1) 폴더를 순서대로 walk 하며 ruleCode / scriptName 단위로 수집 — **뒤 폴더가 앞 폴더를 덮음**.
     *     따라서 [공용, T3] 순서면 같은 ruleCode 는 T3 overlay 파일만 살아남음 (1개).
     *  2) dedupe 된 유니크 항목만 각 1회 upsert.
     *
     * 이전(폴더별 순차 upsert)의 버그: 같은 ruleCode 가 공용+overlay 양쪽에 있으면 매 import 마다
     * 두 파일이 서로 rule_version+1 로 덮어써 **버전 폭증 + 멱등성 깨짐**. 수집 단계 dedupe 로 해결.
     */
    @Transactional
    public Map<String, Object> importFromClaudeFolders(String targetCd, List<String> claudeRoots) {
        // Target 존재 검증
        targetRepo.findById(targetCd)
                .orElseThrow(() -> new IllegalArgumentException("Unknown target: " + targetCd));

        // 1) 수집 — LinkedHashMap, 뒤 폴더가 같은 key 를 덮어씀 (overlay 승)
        LinkedHashMap<String, RuleFile> rules = new LinkedHashMap<>();
        LinkedHashMap<String, HookFile> hooks = new LinkedHashMap<>();
        for (String rootStr : claudeRoots) {
            if (rootStr == null || rootStr.isBlank()) continue;
            Path root = Paths.get(rootStr).toAbsolutePath().normalize();
            if (!Files.isDirectory(root)) {
                log.warn("Claude root 건너뜀 (디렉토리 아님): {}", root);
                continue;
            }
            collectRules(root, rules);
            collectHooks(root, hooks);
        }

        // 2) dedupe 된 유니크 항목만 upsert
        ImportCounters rc = new ImportCounters();
        for (RuleFile rf : rules.values()) {
            upsertRule(targetCd, rf.ruleCode(), rf.title(), rf.file(), rf.priority(), rf.appliesTo(), rc);
        }
        ImportCounters hc = new ImportCounters();
        for (HookFile hf : hooks.values()) {
            upsertHook(targetCd, hf.file(), hf.hooksRoot(), hc);
        }

        Map<String, Object> agg = new HashMap<>();
        agg.put("targetCd", targetCd);
        agg.put("claudeRoots", claudeRoots);
        agg.put("ruleImported", rc.imported);
        agg.put("ruleUpdated",  rc.updated);
        agg.put("ruleSkipped",  rc.skipped);
        agg.put("hookImported", hc.imported);
        agg.put("hookUpdated",  hc.updated);
        agg.put("hookSkipped",  hc.skipped);
        agg.put("totalRuleRows", ruleRepo.countByTargetCd(targetCd));
        agg.put("totalHookRows", hookRepo.countByTargetCd(targetCd));
        log.info("Claude assets multi-import 완료: target={} roots={} 유니크(rules={}, hooks={}) "
                + "rules(+{}/~{}/={}) hooks(+{}/~{}/={})",
                targetCd, claudeRoots, rules.size(), hooks.size(),
                rc.imported, rc.updated, rc.skipped, hc.imported, hc.updated, hc.skipped);
        return agg;
    }

    /** root 의 CLAUDE.md + rules/*.md 를 ruleCode 키로 수집 (기존 key 덮어씀). */
    private void collectRules(Path root, Map<String, RuleFile> out) {
        Path claudeMd = root.resolveSibling("CLAUDE.md");
        if (Files.isRegularFile(claudeMd)) {
            out.put("00-claude-md", new RuleFile("00-claude-md", "CLAUDE.md (헌법)", claudeMd, 5, "invariant"));
        }
        Path rulesDir = root.resolve("rules");
        if (!Files.isDirectory(rulesDir)) {
            log.warn("rules 폴더 없음: {}", rulesDir);
            return;
        }
        try (Stream<Path> walk = Files.list(rulesDir)) {
            walk.filter(p -> p.toString().toLowerCase().endsWith(".md"))
                .sorted()
                .forEach(p -> {
                    String fileName = p.getFileName().toString();
                    String ruleCode = fileName.replaceFirst("\\.md$", "");
                    int priority = extractPriorityFromFilename(fileName);
                    out.put(ruleCode, new RuleFile(ruleCode, fileName, p, priority, "all"));
                });
        } catch (IOException e) {
            log.error("rules 폴더 walk 실패: {}", e.getMessage(), e);
        }
    }

    /** root 의 hooks/** 의 .sh/.py/.js 를 scriptName 키로 수집 (기존 key 덮어씀). */
    private void collectHooks(Path root, Map<String, HookFile> out) {
        Path hooksDir = root.resolve("hooks");
        if (!Files.isDirectory(hooksDir)) {
            log.warn("hooks 폴더 없음: {}", hooksDir);
            return;
        }
        try (Stream<Path> walk = Files.walk(hooksDir)) {
            walk.filter(Files::isRegularFile)
                .filter(p -> p.toString().toLowerCase().endsWith(".sh")
                          || p.toString().toLowerCase().endsWith(".py")
                          || p.toString().toLowerCase().endsWith(".js"))
                .sorted()
                .forEach(p -> {
                    String scriptName = p.getFileName().toString();
                    out.put(scriptName, new HookFile(scriptName, p, hooksDir));
                });
        } catch (IOException e) {
            log.error("hooks 폴더 walk 실패: {}", e.getMessage(), e);
        }
    }

    /**
     * 단일 폴더 import (legacy 호환) — collect-then-upsert 경로로 위임.
     *
     * @param targetCd   대상 Target
     * @param claudeRoot .claude 폴더 절대 경로
     */
    @Transactional
    public Map<String, Object> importFromClaudeFolder(String targetCd, String claudeRoot) {
        return importFromClaudeFolders(targetCd, List.of(claudeRoot));
    }

    /** '41-composer-generation.md' → priority 41 (시스템 프롬프트 조립 순서) */
    private int extractPriorityFromFilename(String fileName) {
        try {
            int dash = fileName.indexOf('-');
            if (dash > 0) {
                return Integer.parseInt(fileName.substring(0, dash));
            }
        } catch (NumberFormatException ignored) {
        }
        return 100;
    }

    private void upsertRule(String targetCd, String ruleCode, String title, Path file,
                            int priority, String appliesTo, ImportCounters c) {
        try {
            String content = Files.readString(file, StandardCharsets.UTF_8);
            String hash = sha256(content);

            Optional<TargetRule> existing =
                    ruleRepo.findFirstByTargetCdAndRuleCodeOrderByRuleVersionDesc(targetCd, ruleCode);

            if (existing.isPresent() && hash.equals(existing.get().getContentHash())) {
                // 같은 hash. 내용 동일이지만 provenance(source_path) 가 바뀌었을 수 있음
                // (구조 개편으로 같은 ruleCode 가 다른 폴더로 이동한 경우) → 라벨 갱신.
                TargetRule row = existing.get();
                boolean pathChanged = !file.toString().equals(row.getSourcePath());
                if ("Y".equals(row.getUseYn()) && !pathChanged) {
                    c.skipped++;
                } else {
                    // 비활성이었으면 reactivate, source_path 변경이면 라벨 정정.
                    row.setUseYn("Y");
                    row.setSourcePath(file.toString());
                    row.setModifyBy("import");
                    row.setModifyDttm(LocalDateTime.now());
                    ruleRepo.save(row);
                    c.updated++;
                }
                return;
            }

            int nextVersion = existing.map(r -> r.getRuleVersion() + 1).orElse(1);

            // 이전 버전 use_yn='N' 처리
            existing.ifPresent(prev -> {
                prev.setUseYn("N");
                prev.setModifyBy("import");
                prev.setModifyDttm(LocalDateTime.now());
                ruleRepo.save(prev);
            });

            TargetRule row = TargetRule.builder()
                    .targetCd(targetCd)
                    .ruleCode(ruleCode)
                    .title(title)
                    .content(content)
                    .appliesTo(appliesTo)
                    .priority(priority)
                    .ruleVersion(nextVersion)
                    .sourcePath(file.toString())
                    .contentHash(hash)
                    .useYn("Y")
                    .build();
            ruleRepo.save(row);

            if (existing.isPresent()) c.updated++; else c.imported++;
        } catch (IOException e) {
            log.warn("rule 파일 읽기 실패 ({}): {}", file, e.getMessage());
        }
    }

    // ============== Hooks ==============

    private void upsertHook(String targetCd, Path file, Path hooksRoot, ImportCounters c) {
        try {
            String content = Files.readString(file, StandardCharsets.UTF_8);
            String hash = sha256(content);
            String scriptName = file.getFileName().toString();
            String relPath    = hooksRoot.relativize(file).toString().replace('\\', '/');
            String hookEvent  = inferHookEventFromPath(relPath);
            String language   = inferLanguageFromExtension(scriptName);

            Optional<TargetHook> existing = hookRepo.findByTargetCdAndScriptName(targetCd, scriptName);
            if (existing.isPresent() && hash.equals(existing.get().getContentHash())) {
                // 같은 hash. 내용 동일이지만 enabled / script_path 가 바뀌었을 수 있음 → 정정.
                TargetHook row = existing.get();
                boolean pathChanged = !relPath.equals(row.getScriptPath());
                if ("Y".equals(row.getEnabled()) && !pathChanged) {
                    c.skipped++;
                } else {
                    row.setEnabled("Y");
                    row.setScriptPath(relPath);
                    hookRepo.save(row);
                    c.updated++;
                }
                return;
            }
            TargetHook row = existing.orElseGet(() -> TargetHook.builder()
                    .targetCd(targetCd)
                    .scriptName(scriptName)
                    .enabled("Y")
                    .sortOrder(100)
                    .build());
            row.setHookEvent(hookEvent);
            row.setScriptPath(relPath);
            row.setScriptContent(content);
            row.setContentHash(hash);
            row.setLanguage(language);
            hookRepo.save(row);

            if (existing.isPresent()) c.updated++; else c.imported++;
        } catch (IOException e) {
            log.warn("hook 파일 읽기 실패 ({}): {}", file, e.getMessage());
        }
    }

    /** validators/ → PreToolUse, post/ → PostToolUse, prompt/ → UserPromptSubmit, stop/ → Stop, session/ → SessionStart */
    private String inferHookEventFromPath(String relPath) {
        String lower = relPath.toLowerCase();
        if (lower.startsWith("validators/") || lower.contains("/pre"))    return "PreToolUse";
        if (lower.startsWith("post/")        || lower.contains("/post"))  return "PostToolUse";
        if (lower.startsWith("prompt/")      || lower.contains("prompt")) return "UserPromptSubmit";
        if (lower.contains("session"))                                     return "SessionStart";
        if (lower.contains("stop"))                                        return "Stop";
        return "PreToolUse";
    }

    private String inferLanguageFromExtension(String name) {
        String lower = name.toLowerCase();
        if (lower.endsWith(".py")) return "python";
        if (lower.endsWith(".js")) return "node";
        return "bash";
    }

    // ============== Util ==============

    private static String sha256(String content) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(content.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(hash.length * 2);
            for (byte b : hash) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            return "";
        }
    }

    private static class ImportCounters {
        int imported = 0;
        int updated  = 0;
        int skipped  = 0;
    }
}
