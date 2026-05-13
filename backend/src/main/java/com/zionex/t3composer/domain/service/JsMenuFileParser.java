package com.zionex.t3composer.domain.service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;

import lombok.extern.slf4j.Slf4j;

/**
 * PlanNEL 류 React SPA 의 메뉴 정의 파일 (예: <sourceRoot>/src/pages/TabMenuList.js) 을 파싱해
 * Composer 의 통합 메뉴 트리 포맷 (TargetMenuController.buildTree 출력 형식) 으로 변환.
 *
 * 파일 구조 가정:
 *   - 상단에 `import <ComponentName> from "./<relative-path>";` 라인들
 *   - `const lv1MenuList = { ... };`  — 최상위 메뉴 그룹
 *   - `const lv2MenuList = { ... };`  — 중간 카테고리 (선택)
 *   - `const lv3MenuList = { ... };`  — 실제 화면 (component: <X /> 포함)
 *
 * 파서는 lv3MenuList 만 사용. 각 그룹 키 → 부모 노드 / 배열 entry → leaf 노드.
 * `component: <ComponentName viewName={"..."} title="..." />` 패턴으로 컴포넌트 이름을 추출하고,
 * import map 에서 그 컴포넌트의 상대 path 를 찾아 menuFilePath 로 사용.
 *
 * 이 파서는 의도적으로 단순한 정규식 기반 — 완전한 JS AST 가 아니라 PlanNEL 같은
 * "hand-coded, 일관된 포맷" 의 파일을 다룰 때만 안정적이다. 다른 프로젝트라면 별도 매퍼 필요.
 */
@Slf4j
@Service
public class JsMenuFileParser {

    private static final Pattern IMPORT_PATTERN = Pattern.compile(
            "^\\s*import\\s+([A-Za-z_][A-Za-z0-9_]*)\\s+from\\s+[\"']\\.{1,2}/([^\"']+)[\"']\\s*;?",
            Pattern.MULTILINE);

    private static final Pattern LV3_BLOCK_PATTERN = Pattern.compile(
            "const\\s+lv3MenuList\\s*=\\s*\\{",
            Pattern.MULTILINE);

    /** lv3MenuList 안의 group key: `KEY: [` */
    private static final Pattern GROUP_KEY_PATTERN = Pattern.compile(
            "(?:^|\\n)\\s*([A-Z][A-Z0-9_]*)\\s*:\\s*\\[",
            Pattern.MULTILINE);

    private static final Pattern REDUX_KEY = Pattern.compile(
            "reduxKey\\s*:\\s*\"([^\"]+)\"");

    private static final Pattern MENU_CD = Pattern.compile(
            "menuCd\\s*:\\s*\"([^\"]+)\"");

    private static final Pattern TITLE = Pattern.compile(
            "(?:title|menuTitle)\\s*:\\s*\"([^\"]+)\"");

    private static final Pattern COMPONENT_NAME = Pattern.compile(
            "component\\s*:\\s*<\\s*([A-Za-z_][A-Za-z0-9_]*)");

    /** TabMenuList.js 등 JS 메뉴 파일을 읽어 통합 메뉴 트리 Map 반환. */
    public Map<String, Object> parse(Path file) throws IOException {
        String content = Files.readString(file, StandardCharsets.UTF_8);
        return parseContent(content);
    }

    public Map<String, Object> parseContent(String content) {
        Map<String, String> importMap = extractImports(content);
        String lv3Body = extractLv3Body(content);

        List<Map<String, Object>> roots = new ArrayList<>();
        if (lv3Body == null) {
            log.warn("JsMenuFileParser: lv3MenuList 블록을 찾지 못함");
        } else {
            // group 단위 슬라이스 — 다음 group key 또는 lv3 종료(`};`) 까지
            List<int[]> groupBounds = findGroupBounds(lv3Body);
            for (int[] bounds : groupBounds) {
                String groupKey = lv3Body.substring(bounds[0], bounds[1]).trim();
                int arrayStart = bounds[2]; // `[` 다음 위치
                int arrayEnd = findMatchingBracket(lv3Body, arrayStart - 1);
                if (arrayEnd <= arrayStart) continue;
                String arrayBody = lv3Body.substring(arrayStart, arrayEnd);

                List<Map<String, Object>> leafs = extractLeafs(arrayBody, importMap);
                if (leafs.isEmpty()) continue;

                Map<String, Object> rootNode = new LinkedHashMap<>();
                rootNode.put("id", groupKey);
                rootNode.put("dbId", "GROUP_" + groupKey);
                rootNode.put("parentDbId", null);
                rootNode.put("path", null);
                rootNode.put("filePath", null);
                rootNode.put("seq", roots.size() + 1);
                rootNode.put("displayName", groupKey);
                rootNode.put("hasLangPack", false);
                rootNode.put("items", leafs);
                roots.add(rootNode);
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("items", roots);
        return result;
    }

    private Map<String, String> extractImports(String content) {
        Map<String, String> map = new LinkedHashMap<>();
        Matcher m = IMPORT_PATTERN.matcher(content);
        while (m.find()) {
            map.put(m.group(1), m.group(2));   // ComponentName → relative path (e.g. data-management/HrchyConfig)
        }
        return map;
    }

    private String extractLv3Body(String content) {
        Matcher m = LV3_BLOCK_PATTERN.matcher(content);
        if (!m.find()) return null;
        int openIdx = m.end() - 1;  // position of `{`
        int closeIdx = findMatchingBracket(content, openIdx);
        if (closeIdx <= openIdx) return null;
        return content.substring(openIdx + 1, closeIdx);
    }

    /** Returns [groupKeyStart, groupKeyEnd, arrayBodyStart] tuples within lv3Body. */
    private List<int[]> findGroupBounds(String lv3Body) {
        List<int[]> bounds = new ArrayList<>();
        Matcher m = GROUP_KEY_PATTERN.matcher(lv3Body);
        while (m.find()) {
            bounds.add(new int[]{ m.start(1), m.end(1), m.end() });
        }
        return bounds;
    }

    /** Given index of `{` or `[` or `(`, find matching close. -1 on failure. */
    private int findMatchingBracket(String s, int openIdx) {
        char open = s.charAt(openIdx);
        char close = switch (open) {
            case '{' -> '}';
            case '[' -> ']';
            case '(' -> ')';
            default -> open;
        };
        int depth = 0;
        boolean inStr = false;
        char strQuote = 0;
        boolean inLineComment = false;
        boolean inBlockComment = false;
        for (int i = openIdx; i < s.length(); i++) {
            char c = s.charAt(i);
            char next = i + 1 < s.length() ? s.charAt(i + 1) : 0;
            if (inLineComment) {
                if (c == '\n') inLineComment = false;
                continue;
            }
            if (inBlockComment) {
                if (c == '*' && next == '/') { inBlockComment = false; i++; }
                continue;
            }
            if (inStr) {
                if (c == '\\') { i++; continue; }
                if (c == strQuote) inStr = false;
                continue;
            }
            if (c == '/' && next == '/') { inLineComment = true; i++; continue; }
            if (c == '/' && next == '*') { inBlockComment = true; i++; continue; }
            if (c == '"' || c == '\'' || c == '`') { inStr = true; strQuote = c; continue; }
            if (c == open) depth++;
            else if (c == close) {
                depth--;
                if (depth == 0) return i;
            }
        }
        return -1;
    }

    /** lv3 array body 안에서 leaf 엔트리들을 추출. */
    private List<Map<String, Object>> extractLeafs(String arrayBody, Map<String, String> importMap) {
        List<Map<String, Object>> leafs = new ArrayList<>();
        // 객체 단위 슬라이스 — 깊이 추적으로 top-level `{...}` 만 잡음
        List<String> objects = sliceTopLevelObjects(arrayBody);
        int seq = 0;
        for (String obj : objects) {
            String reduxKey = firstGroup(REDUX_KEY, obj);
            String menuCd = firstGroup(MENU_CD, obj);
            String title = firstGroup(TITLE, obj);
            String compName = firstGroup(COMPONENT_NAME, obj);

            String menuId = menuCd != null ? menuCd : reduxKey;
            if (menuId == null) continue;   // 식별자 없으면 무시

            Map<String, Object> node = new LinkedHashMap<>();
            node.put("id", menuId);
            node.put("dbId", menuId);
            node.put("parentDbId", null);
            node.put("path", null);
            String filePath = null;
            if (compName != null) {
                String rel = importMap.get(compName);
                if (rel != null) {
                    filePath = "/" + rel;   // 통일된 표기 — leading slash
                }
            }
            node.put("filePath", filePath);
            node.put("seq", ++seq);
            node.put("displayName", title != null ? title : menuId);
            node.put("hasLangPack", false);
            node.put("items", new ArrayList<>());
            leafs.add(node);
        }
        return leafs;
    }

    /** array body 에서 top-level `{...}` 객체들을 슬라이스. */
    private List<String> sliceTopLevelObjects(String body) {
        List<String> out = new ArrayList<>();
        int i = 0;
        while (i < body.length()) {
            char c = body.charAt(i);
            if (c == '{') {
                int end = findMatchingBracket(body, i);
                if (end < 0) break;
                out.add(body.substring(i + 1, end));
                i = end + 1;
            } else {
                i++;
            }
        }
        return out;
    }

    private static String firstGroup(Pattern p, String s) {
        Matcher m = p.matcher(s);
        return m.find() ? m.group(1) : null;
    }
}
