package com.zionex.t3composer.domain.service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Stream;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.zionex.t3composer.domain.entity.TargetHook;
import com.zionex.t3composer.domain.entity.TargetRule;
import com.zionex.t3composer.domain.entity.TargetSystem;
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

    /**
     * 지정 Target 의 claude assets 를 import.
     *
     * @param targetCd   대상 Target (예: 'T3SERIES_MSSQL')
     * @param claudeRoot .claude 폴더 절대 경로 (예: /workspace/wingui/.claude)
     * @return {ruleImported:N, ruleSkipped:N, hookImported:N, hookSkipped:N, errors:[...]}
     */
    @Transactional
    public Map<String, Object> importFromClaudeFolder(String targetCd, String claudeRoot) {
        Map<String, Object> result = new HashMap<>();
        result.put("targetCd", targetCd);
        result.put("claudeRoot", claudeRoot);

        TargetSystem target = targetRepo.findById(targetCd)
                .orElseThrow(() -> new IllegalArgumentException("Unknown target: " + targetCd));

        Path root = Paths.get(claudeRoot).toAbsolutePath().normalize();
        if (!Files.isDirectory(root)) {
            throw new IllegalArgumentException("claudeRoot 가 디렉토리가 아닙니다: " + root);
        }

        ImportCounters rc = importRules(target, root);
        ImportCounters hc = importHooks(target, root);

        result.put("ruleImported", rc.imported);
        result.put("ruleUpdated",  rc.updated);
        result.put("ruleSkipped",  rc.skipped);
        result.put("hookImported", hc.imported);
        result.put("hookUpdated",  hc.updated);
        result.put("hookSkipped",  hc.skipped);
        result.put("totalRuleRows", ruleRepo.countByTargetCd(targetCd));
        result.put("totalHookRows", hookRepo.countByTargetCd(targetCd));

        log.info("Claude assets import 완료: target={} rules(+{}/~{}/={}) hooks(+{}/~{}/={})",
                targetCd, rc.imported, rc.updated, rc.skipped, hc.imported, hc.updated, hc.skipped);
        return result;
    }

    // ============== Rules ==============

    private ImportCounters importRules(TargetSystem target, Path root) {
        ImportCounters c = new ImportCounters();

        // 1) CLAUDE.md 상위
        Path claudeMd = root.resolveSibling("CLAUDE.md");
        if (Files.isRegularFile(claudeMd)) {
            upsertRule(target.getTargetCd(), "00-claude-md", "CLAUDE.md (헌법)",
                    claudeMd, 5, "invariant", c);
        }

        // 2) rules/*.md
        Path rulesDir = root.resolve("rules");
        if (!Files.isDirectory(rulesDir)) {
            log.warn("rules 폴더 없음: {}", rulesDir);
            return c;
        }
        try (Stream<Path> walk = Files.list(rulesDir)) {
            walk.filter(p -> p.toString().toLowerCase().endsWith(".md"))
                .sorted()
                .forEach(p -> {
                    String fileName = p.getFileName().toString();
                    String ruleCode = fileName.replaceFirst("\\.md$", "");
                    int priority = extractPriorityFromFilename(fileName);
                    upsertRule(target.getTargetCd(), ruleCode, fileName, p, priority, "all", c);
                });
        } catch (IOException e) {
            log.error("rules 폴더 walk 실패: {}", e.getMessage(), e);
        }
        return c;
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
                c.skipped++;
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

    private ImportCounters importHooks(TargetSystem target, Path root) {
        ImportCounters c = new ImportCounters();
        Path hooksDir = root.resolve("hooks");
        if (!Files.isDirectory(hooksDir)) {
            log.warn("hooks 폴더 없음: {}", hooksDir);
            return c;
        }
        try (Stream<Path> walk = Files.walk(hooksDir)) {
            walk.filter(Files::isRegularFile)
                .filter(p -> p.toString().toLowerCase().endsWith(".sh")
                          || p.toString().toLowerCase().endsWith(".py")
                          || p.toString().toLowerCase().endsWith(".js"))
                .sorted()
                .forEach(p -> upsertHook(target.getTargetCd(), p, hooksDir, c));
        } catch (IOException e) {
            log.error("hooks 폴더 walk 실패: {}", e.getMessage(), e);
        }
        return c;
    }

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
                c.skipped++;
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
