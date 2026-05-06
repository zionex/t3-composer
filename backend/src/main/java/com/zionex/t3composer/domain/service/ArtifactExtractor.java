package com.zionex.t3composer.domain.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Component;

import com.zionex.t3composer.domain.entity.ComposerArtifact;

/**
 * Claude 응답 텍스트에서 아티팩트(파일별 코드 블록)를 추출한다.
 *
 * 인식 포맷:
 *   ===FILE: /path/to/File.ext===
 *   ```language
 *   ...content...
 *   ```
 *
 * 파일명 확장자로 artifact_type 과 language 를 자동 추론.
 */
@Component
public class ArtifactExtractor {

    private static final Pattern FILE_BLOCK = Pattern.compile(
            "===\\s*FILE:\\s*([^=\\n]+?)\\s*===\\s*\\r?\\n"
          + "```([a-zA-Z0-9+#_-]*)\\s*\\r?\\n"
          + "([\\s\\S]*?)"
          + "```",
            Pattern.MULTILINE);

    public List<ComposerArtifact> extract(String sessionId, String messageId, String userId, String assistantText) {
        List<ComposerArtifact> artifacts = new ArrayList<>();
        if (assistantText == null || assistantText.isBlank()) {
            return artifacts;
        }

        Matcher m = FILE_BLOCK.matcher(assistantText);
        while (m.find()) {
            String filePath = m.group(1).trim();
            String language = m.group(2).trim();
            String content  = m.group(3);

            String fileName = extractFileName(filePath);
            if (language == null || language.isBlank()) {
                language = inferLanguageFromPath(filePath);
            }
            String artifactType = classifyArtifact(filePath, language);

            artifacts.add(ComposerArtifact.builder()
                    .sessionId(sessionId)
                    .messageId(messageId)
                    .artifactType(artifactType)
                    .filePath(filePath)
                    .fileName(fileName)
                    .language(language)
                    .content(content)
                    .versionNo(1)
                    .status(ComposerArtifact.STATUS_DRAFT)
                    .createBy(userId)
                    .createDttm(LocalDateTime.now())
                    .build());
        }
        return artifacts;
    }

    private String extractFileName(String path) {
        if (path == null) return null;
        int idx = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
        return idx >= 0 ? path.substring(idx + 1) : path;
    }

    private String inferLanguageFromPath(String path) {
        if (path == null) return null;
        String lower = path.toLowerCase();
        if (lower.endsWith(".jsx") || lower.endsWith(".tsx")) return "jsx";
        if (lower.endsWith(".js"))    return "javascript";
        if (lower.endsWith(".java"))  return "java";
        if (lower.endsWith(".sql"))   return "sql";
        if (lower.endsWith(".json"))  return "json";
        if (lower.endsWith(".md"))    return "markdown";
        if (lower.endsWith(".yml") || lower.endsWith(".yaml")) return "yaml";
        return "text";
    }

    private String classifyArtifact(String path, String language) {
        if (path == null) return ComposerArtifact.TYPE_OTHER;
        String lower = path.toLowerCase();

        // LLM 환각 보정: 확장자를 underscore 로 쓰는 경우 (예: `_sql`, `_jsx`, `_java`) 도 동일 취급
        boolean isJsx  = lower.endsWith(".jsx")  || lower.endsWith(".tsx")
                      || lower.endsWith("_jsx")  || lower.endsWith("_tsx");
        boolean isJava = lower.endsWith(".java") || lower.endsWith("_java");
        boolean isSql  = lower.endsWith(".sql")  || lower.endsWith("_sql");

        if (lower.endsWith("menus.js") || lower.contains("/menus.js")) return ComposerArtifact.TYPE_MENUS_JS_PATCH;
        if (isJsx)                                                     return ComposerArtifact.TYPE_SCREEN_JSX;

        if (isJava) {
            if (lower.contains("controller")) return ComposerArtifact.TYPE_JAVA_CONTROLLER;
            if (lower.contains("service"))    return ComposerArtifact.TYPE_JAVA_SERVICE;
            if (lower.contains("repository") || lower.contains("repo")) return ComposerArtifact.TYPE_JAVA_REPOSITORY;
            if (lower.contains("entity"))     return ComposerArtifact.TYPE_JAVA_ENTITY;
            return ComposerArtifact.TYPE_JAVA_SERVICE;
        }

        if (isSql) {
            if (lower.contains("/menus/") || lower.contains("menu") || lower.contains("tb_ad_menu"))
                return ComposerArtifact.TYPE_MENU_SQL;
            if (lower.contains("/procedures/") || lower.contains("sp_"))
                return ComposerArtifact.TYPE_SQL_SP;
            return ComposerArtifact.TYPE_SQL_DDL;
        }

        return ComposerArtifact.TYPE_OTHER;
    }
}
