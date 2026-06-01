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

    // ===FILE: <path>===  /  ===FILE: <path>  (트레일링 === 없음) 모두 인식.
    //
    // ── 인식 포맷 3종 (LLM 이 비결정적으로 사용 — 2026-05-16 사고: (C) 미인식으로 산출물 0개) ──
    //   (A) ===FILE:<path>===     (B) ```                  (C) ```sql            ← 마커가 펜스 안쪽
    //       ```lang                   ===FILE:<path>===        ===FILE:<path>===
    //       content                   ```                      content
    //       ```                       ```lang                  ```
    //                                 content
    //                                 ```
    // 핵심: 마커 줄 다음에 오는 '빈 줄' 또는 '펜스-열기 줄'(``` 또는 ```lang) 을 0~N 개 선택 소비한다.
    //   (A)=1 개 · (B)=2 개(고립 ``` + ```lang) · (C)=0 개(마커가 이미 ```sql 펜스 안쪽).
    //   content 는 그 다음부터 닫는 ``` 까지. — 이 0~N 매칭이 핵심 (이전엔 1 개 고정 → (C) 실패).
    //   빈 줄 허용 (2026-05-18 사고): 마커와 펜스 사이에 빈 줄이 들어가면 lazy capture 가
    //   펜스-열기의 ``` 와 매칭되어 content=""  로 캡처되던 문제 → 빈/공백-only 줄도 skip.
    // language 는 캡처하지 않고 파일 확장자로 추론 (inferLanguageFromPath).
    private static final Pattern FILE_BLOCK = Pattern.compile(
            "===\\s*FILE:\\s*([^\\n]+?)(?:\\s*===)?[ \\t]*\\r?\\n"
          + "(?:[ \\t]*\\r?\\n|```[a-zA-Z0-9+#_-]*[ \\t]*\\r?\\n)*"
          + "([\\s\\S]*?)"
          + "\\r?\\n?```",
            Pattern.MULTILINE);

    public List<ComposerArtifact> extract(String sessionId, String messageId, String userId, String assistantText) {
        List<ComposerArtifact> artifacts = new ArrayList<>();
        if (assistantText == null || assistantText.isBlank()) {
            return artifacts;
        }

        Matcher m = FILE_BLOCK.matcher(assistantText);
        while (m.find()) {
            String filePath = m.group(1).trim();
            String content  = m.group(2);

            String fileName = extractFileName(filePath);
            String language = inferLanguageFromPath(filePath);
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

        // LLM 환각 보정: 확장자를 underscore 로 쓰는 경우 (예: `_sql`, `_jsx`, `_java`) 도 동일 취급.
        // PlanNEL 호환: `.js` 인데 `/pages/` 경로 안에 있는 React 화면 컴포넌트도 JSX 로 분류.
        //   (PlanNEL 의 saas-web 은 jsx 가 아닌 .js 확장자로 React 컴포넌트를 작성)
        boolean isJsx  = lower.endsWith(".jsx")  || lower.endsWith(".tsx")
                      || lower.endsWith("_jsx")  || lower.endsWith("_tsx")
                      || (lower.endsWith(".js") && lower.contains("/pages/"));
        boolean isJava = lower.endsWith(".java") || lower.endsWith("_java");
        boolean isSql  = lower.endsWith(".sql")  || lower.endsWith("_sql");

        // PLANEL 류 (menu_source='JS_FILE') 의 메뉴 등록 entry JSON.
        //   `tabmenulist` 단어가 path 에 들어가면 MENU_JS — JSX 분류기보다 먼저 매치되어야 함
        //   (PlanNEL 의 saas-web 은 .js 확장자라 `.js in /pages/` JSX 분류와 충돌 회피).
        if (lower.contains("tabmenulist"))                             return ComposerArtifact.TYPE_MENU_JS;
        if (lower.endsWith("menus.js") || lower.contains("/menus.js")) return ComposerArtifact.TYPE_MENUS_JS_PATCH;
        if (isJsx)                                                     return ComposerArtifact.TYPE_SCREEN_JSX;

        // PlanNEL frontend 비-페이지 모듈 — services / redux / utils / hooks / components
        // (TabMenuList 와 menus.js 는 위에서 이미 분류됨)
        if (lower.endsWith(".js") || lower.endsWith(".ts")) {
            if (lower.contains("/services/")
             || lower.contains("/redux/")
             || lower.contains("/slices/")
             || lower.contains("/utils/")
             || lower.contains("/hooks/")
             || lower.contains("/components/")) {
                return ComposerArtifact.TYPE_FRONTEND_JS_MODULE;
            }
        }

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
