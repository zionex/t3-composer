package com.zionex.t3composer.domain.service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;

import lombok.Builder;
import lombok.Getter;
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

    private static final Pattern LV1_BLOCK_PATTERN = Pattern.compile(
            "const\\s+lv1MenuList\\s*=\\s*\\{",
            Pattern.MULTILINE);

    private static final Pattern LV2_BLOCK_PATTERN = Pattern.compile(
            "const\\s+lv2MenuList\\s*=\\s*\\{",
            Pattern.MULTILINE);

    private static final Pattern LV3_BLOCK_PATTERN = Pattern.compile(
            "const\\s+lv3MenuList\\s*=\\s*\\{",
            Pattern.MULTILINE);

    /** lv3MenuList 안의 group key: `KEY: [` */
    private static final Pattern GROUP_KEY_PATTERN = Pattern.compile(
            "(?:^|\\n)\\s*([A-Z][A-Z0-9_]*)\\s*:\\s*\\[",
            Pattern.MULTILINE);

    /** lv1 객체 entry: `KEY: { title: "...", ... }` 의 title 캡처용 */
    private static final Pattern LV1_ENTRY_PATTERN = Pattern.compile(
            "(?:^|\\n)\\s*([A-Z][A-Z0-9_]*)\\s*:\\s*\\{",
            Pattern.MULTILINE);

    /** lv2 array entry: `KEY: [{ menuCd|reduxKey: "...", menuTitle: "..." }, ...]` */
    private static final Pattern LV2_GROUP_PATTERN = Pattern.compile(
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
        return parse(file, Collections.emptyMap());
    }

    /**
     * i18n translation map 적용 버전 — title 이 i18n key (예: "menuDemandPlan") 이면
     * translations.get(title) 으로 lookup 해 displayName 으로 노출.
     * 매핑 없으면 i18n key 그대로 표시.
     */
    public Map<String, Object> parse(Path file, Map<String, String> translations) throws IOException {
        String content = Files.readString(file, StandardCharsets.UTF_8);
        return parseContent(content, translations);
    }

    public Map<String, Object> parseContent(String content) {
        return parseContent(content, Collections.emptyMap());
    }

    public Map<String, Object> parseContent(String content, Map<String, String> translations) {
        Map<String, String> importMap = extractImports(content);
        String lv3Body = extractLv3Body(content);
        Map<String, String> i18n = translations == null ? Collections.emptyMap() : translations;

        // 그룹 displayName lookup 용 — lv1 의 title 과 lv2 의 menuTitle 을 group key 별로 모음.
        // 예: { "AI": "menuAiPlanningIntelligence", "SUBMENU_DP_SETTINGS": "menuSettings" }
        Map<String, String> groupTitleKeys = extractGroupTitleKeys(content);

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

                List<Map<String, Object>> leafs = extractLeafs(arrayBody, importMap, i18n);
                if (leafs.isEmpty()) continue;

                // displayName lookup 4단계:
                //   1) lv1/lv2 group title key (예: "menuSettings") → i18n translation
                //   2) group key 자체를 i18n 으로 (예: "DASHBOARD" → 직접 lookup)
                //   3) group key 의 camelCase 변환 (예: "DATA_MGMT" → "dataMgmt") → i18n
                //   4) fallback — group key 그대로
                String groupTitleKey = groupTitleKeys.get(groupKey);
                String displayName = groupKey;
                String i18nKeyUsed = null;
                boolean hasLangPack = false;
                if (groupTitleKey != null && i18n.containsKey(groupTitleKey)) {
                    displayName = i18n.get(groupTitleKey);
                    i18nKeyUsed = groupTitleKey;
                    hasLangPack = true;
                } else if (i18n.containsKey(groupKey)) {
                    displayName = i18n.get(groupKey);
                    i18nKeyUsed = groupKey;
                    hasLangPack = true;
                } else {
                    String camel = toCamelCase(groupKey);
                    if (i18n.containsKey(camel)) {
                        displayName = i18n.get(camel);
                        i18nKeyUsed = camel;
                        hasLangPack = true;
                    } else if (groupTitleKey != null) {
                        // lv1/lv2 의 title 은 있는데 translation 매칭 안 됨 — title 그대로
                        displayName = groupTitleKey;
                        i18nKeyUsed = groupTitleKey;
                    }
                }

                Map<String, Object> rootNode = new LinkedHashMap<>();
                rootNode.put("id", groupKey);
                rootNode.put("dbId", "GROUP_" + groupKey);
                rootNode.put("parentDbId", null);
                rootNode.put("path", null);
                rootNode.put("filePath", null);
                rootNode.put("seq", roots.size() + 1);
                rootNode.put("displayName", displayName);
                rootNode.put("i18nKey", i18nKeyUsed);
                rootNode.put("hasLangPack", hasLangPack);
                rootNode.put("items", leafs);
                roots.add(rootNode);
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("items", roots);
        return result;
    }

    /**
     * lv1MenuList 와 lv2MenuList 에서 group key 별 i18n title 키를 수집.
     *
     * lv1: `KEY: { title: "menuXxx", ... }` 형식 — group key = lv1 entry key
     * lv2: `KEY: [{ reduxKey: "SUBMENU_X", menuCd: "SUBMENU_X", menuTitle: "menuXxx", ... }]`
     *      — 배열 안 각 entry 의 reduxKey/menuCd 가 lv3 group key 와 매칭됨
     *
     * lv2 의 entry 가 가진 menuTitle 이 lv3 의 group key 와 더 자주 매칭되므로
     * 같은 key 가 두 곳에 있으면 lv2 우선.
     */
    private Map<String, String> extractGroupTitleKeys(String content) {
        Map<String, String> map = new LinkedHashMap<>();

        // 1) lv1 — 각 entry 의 title 추출
        String lv1Body = extractBlockBody(content, LV1_BLOCK_PATTERN);
        if (lv1Body != null) {
            Matcher m = LV1_ENTRY_PATTERN.matcher(lv1Body);
            while (m.find()) {
                String key = m.group(1);
                int objOpen = m.end() - 1; // `{` 위치
                int objClose = findMatchingBracket(lv1Body, objOpen);
                if (objClose <= objOpen) continue;
                String objBody = lv1Body.substring(objOpen + 1, objClose);
                String title = firstGroup(TITLE, objBody);
                if (title != null) map.put(key, title);
            }
        }

        // 2) lv2 — 각 그룹 배열 안 entry 의 menuTitle 추출 (lv1 보다 우선)
        String lv2Body = extractBlockBody(content, LV2_BLOCK_PATTERN);
        if (lv2Body != null) {
            Matcher m = LV2_GROUP_PATTERN.matcher(lv2Body);
            while (m.find()) {
                int arrOpen = m.end() - 1; // `[` 위치
                int arrClose = findMatchingBracket(lv2Body, arrOpen);
                if (arrClose <= arrOpen) continue;
                String arrBody = lv2Body.substring(arrOpen + 1, arrClose);
                // 각 sub-entry 객체에서 reduxKey/menuCd → menuTitle 매핑
                for (String obj : sliceTopLevelObjects(arrBody)) {
                    String reduxKey = firstGroup(REDUX_KEY, obj);
                    String menuCd = firstGroup(MENU_CD, obj);
                    String title = firstGroup(TITLE, obj);
                    String entryKey = (menuCd != null) ? menuCd : reduxKey;
                    if (entryKey != null && title != null) {
                        map.put(entryKey, title);   // lv2 가 lv1 덮어씀
                    }
                }
            }
        }

        return map;
    }

    /** 공용 블록 body 추출 — `const X = { ... };` 형태의 `{` 다음 ~ matching `}` 직전. */
    private String extractBlockBody(String content, Pattern blockPattern) {
        Matcher m = blockPattern.matcher(content);
        if (!m.find()) return null;
        int openIdx = m.end() - 1;
        int closeIdx = findMatchingBracket(content, openIdx);
        if (closeIdx <= openIdx) return null;
        return content.substring(openIdx + 1, closeIdx);
    }

    /** UPPER_SNAKE_CASE → camelCase. 예: "DATA_MGMT" → "dataMgmt", "AI" → "ai". */
    private static String toCamelCase(String key) {
        if (key == null || key.isEmpty()) return key;
        String[] parts = key.toLowerCase().split("_");
        StringBuilder sb = new StringBuilder(parts[0]);
        for (int i = 1; i < parts.length; i++) {
            if (parts[i].isEmpty()) continue;
            sb.append(Character.toUpperCase(parts[i].charAt(0)));
            if (parts[i].length() > 1) sb.append(parts[i].substring(1));
        }
        return sb.toString();
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
    private List<Map<String, Object>> extractLeafs(String arrayBody, Map<String, String> importMap,
                                                    Map<String, String> i18n) {
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
            // i18n key (title) lookup — 매핑 없으면 key 그대로 표시.
            //   translation.<lang>-<region>.json 의 "menu" 객체에서 받아온 map 사용.
            String displayName = menuId;
            if (title != null) {
                String translated = i18n.get(title);
                displayName = (translated != null && !translated.isBlank()) ? translated : title;
            }
            node.put("displayName", displayName);
            node.put("i18nKey", title);
            node.put("hasLangPack", title != null && i18n.containsKey(title));
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

    // ==========================================================================
    // Append-only writer — PLANEL TabMenuList.js 에 새 메뉴 entry 추가.
    //
    // ⚠️ 정규식 파서와 같은 보수적 텍스트 조작. 완전한 JS AST 재직렬화가 아니라
    // 다음 두 가지만 수행:
    //   (1) 상단 `import <Comp> from "./<path>";` 라인 추가 (이미 있으면 skip)
    //   (2) lv3MenuList[<groupKey>] 배열의 마지막 `]` 직전에 entry 객체 삽입
    //       그룹이 존재하지 않으면 lv3MenuList 의 마지막 `}` 직전에 새 group 삽입.
    //
    // 멱등: 동일 reduxKey 가 lv3MenuList 안 어디에든 이미 존재하면 INSERT 하지 않고
    // 결과에 `skipped=true` 로 반환 — 중복 등록 안전.
    // ==========================================================================

    /** TabMenuList.js append 결과 — caller (MenuRegistrationService) 가 응답으로 노출. */
    @Getter
    @Builder
    public static class AppendResult {
        private final boolean added;             // false = 멱등 skip 또는 실패
        private final boolean importAdded;       // import 라인 새로 추가됐는지
        private final boolean groupCreated;      // 새 그룹 생성됐는지
        private final String message;            // 사람이 읽는 결과 메시지
        private final String resolvedGroupKey;   // 실제 사용된 group key (요청과 다를 수 있음)
    }

    /** 신규 메뉴 entry 스펙 — Composer 가 JSON 으로 직렬화해 보내는 데이터. */
    @Getter
    @Builder
    public static class AppendSpec {
        private final String reduxKey;       // 필수 — entry 식별자, 중복 검사 대상
        private final String title;          // 필수 — i18n key (예: "menuMyScreen")
        private final String componentName;  // 필수 — React 컴포넌트명 (PascalCase)
        private final String componentPath;  // 선택 — "data-management/MyScreen" 같은 import path (".js" 없이)
        private final String groupKey;       // 선택 — lv3MenuList 의 그룹 키 (예: "DATA_MGMT"). null 이면 "GENERATED" 그룹 생성
        private final Integer key;           // 선택 — 숫자 키. null 이면 그룹 내 max+1 자동 할당
        private final String iconName;       // 선택 — `<X />` 형태 아이콘. null 이면 "LeafIcon"
    }

    /**
     * TabMenuList.js 에 신규 entry 를 append.
     *
     * 멱등: spec.reduxKey 가 이미 lv3MenuList 어디에든 존재하면 변경 없이 added=false 반환.
     *
     * @throws IOException 파일 IO 실패
     * @throws IllegalStateException 파일 포맷이 예상과 달라 안전한 INSERT 위치를 찾지 못함
     */
    public AppendResult appendEntry(Path file, AppendSpec spec) throws IOException {
        if (spec == null || spec.reduxKey == null || spec.reduxKey.isBlank()) {
            throw new IllegalArgumentException("AppendSpec.reduxKey 가 비어 있습니다.");
        }
        if (spec.title == null || spec.title.isBlank()) {
            throw new IllegalArgumentException("AppendSpec.title 가 비어 있습니다.");
        }
        if (spec.componentName == null || spec.componentName.isBlank()) {
            throw new IllegalArgumentException("AppendSpec.componentName 이 비어 있습니다.");
        }

        String content = Files.readString(file, StandardCharsets.UTF_8);

        // 1. 멱등성 — reduxKey 중복이면 즉시 반환
        if (existsReduxKey(content, spec.reduxKey)) {
            log.info("appendEntry: reduxKey={} 이미 존재 — skip ({})", spec.reduxKey, file);
            return AppendResult.builder()
                    .added(false)
                    .message("이미 등록된 reduxKey 입니다: " + spec.reduxKey)
                    .build();
        }

        // 2. import 라인 — componentPath 가 있고 미존재면 추가
        Map<String, String> importMap = extractImports(content);
        boolean importAdded = false;
        if (spec.componentPath != null && !spec.componentPath.isBlank()
                && !importMap.containsKey(spec.componentName)) {
            content = insertImportLine(content, spec.componentName, spec.componentPath);
            importAdded = true;
        }

        // 3. 그룹 결정 + entry 텍스트 조립 후 삽입
        String resolvedGroupKey = (spec.groupKey != null && !spec.groupKey.isBlank())
                ? spec.groupKey : "GENERATED";

        InsertContext ctx = locateLv3Group(content, resolvedGroupKey);
        if (ctx == null) {
            throw new IllegalStateException(
                    "TabMenuList.js 에서 `const lv3MenuList = { ... };` 블록을 찾지 못함");
        }

        int keyValue = (spec.key != null) ? spec.key
                : nextKeyInGroup(content, ctx, resolvedGroupKey);
        String iconName = (spec.iconName != null && !spec.iconName.isBlank())
                ? spec.iconName : "LeafIcon";
        String entryText = buildEntryText(spec, keyValue, iconName);

        boolean groupCreated;
        if (ctx.groupArrayOpenIdx >= 0) {
            // 기존 그룹 배열에 추가 — 마지막 `]` 직전에 entry 삽입
            int arrayCloseIdx = findMatchingBracket(content, ctx.groupArrayOpenIdx);
            if (arrayCloseIdx < 0) {
                throw new IllegalStateException(
                        "lv3MenuList[" + resolvedGroupKey + "] 배열의 닫는 `]` 를 찾지 못함");
            }
            content = insertBeforeArrayClose(content, arrayCloseIdx, entryText);
            groupCreated = false;
        } else {
            // 새 그룹 — lv3MenuList 의 닫는 `}` 직전에 `<KEY>: [ entry ],` 삽입
            content = insertNewGroup(content, ctx.lv3BodyCloseIdx, resolvedGroupKey, entryText);
            groupCreated = true;
        }

        Files.writeString(file, content, StandardCharsets.UTF_8);
        log.info("appendEntry: reduxKey={} group={} importAdded={} groupCreated={} ({})",
                spec.reduxKey, resolvedGroupKey, importAdded, groupCreated, file);

        return AppendResult.builder()
                .added(true)
                .importAdded(importAdded)
                .groupCreated(groupCreated)
                .resolvedGroupKey(resolvedGroupKey)
                .message("entry 추가 완료 (key=" + keyValue + ", group=" + resolvedGroupKey + ")")
                .build();
    }

    // -------- helpers --------

    /** reduxKey: "X" 또는 reduxKey:"X" 형태가 어디든 있으면 true. */
    private boolean existsReduxKey(String content, String reduxKey) {
        Pattern p = Pattern.compile(
                "reduxKey\\s*:\\s*\"" + Pattern.quote(reduxKey) + "\"");
        return p.matcher(content).find();
    }

    /**
     * 마지막 `import ... from "./...";` 라인 다음에 새 import 라인을 삽입.
     * 기존 import 가 0건이면 파일 맨 앞에 추가.
     */
    private String insertImportLine(String content, String componentName, String componentPath) {
        // .js 확장자는 제거 (관례)
        String path = componentPath.replaceAll("\\.jsx?$", "");
        // leading "./" 정규화
        if (!path.startsWith(".")) path = "./" + path;
        String line = "import " + componentName + " from \"" + path + "\";\n";

        Matcher m = IMPORT_PATTERN.matcher(content);
        int lastImportEnd = -1;
        while (m.find()) {
            lastImportEnd = m.end();
        }
        if (lastImportEnd < 0) {
            return line + content;
        }
        // 라인 끝 (개행 다음 위치) 까지 진행
        int nl = content.indexOf('\n', lastImportEnd);
        int insertAt = (nl < 0) ? content.length() : nl + 1;
        return content.substring(0, insertAt) + line + content.substring(insertAt);
    }

    /** lv3MenuList 블록의 위치 정보. */
    private static class InsertContext {
        int lv3BodyCloseIdx;     // `lv3MenuList = { ... }` 의 닫는 `}` 위치
        int groupArrayOpenIdx;   // 요청한 group key 의 `[` 위치, 없으면 -1
    }

    /**
     * lv3MenuList 블록 위치 + 요청한 그룹 키의 array open `[` 위치 lookup.
     * 그룹이 없으면 groupArrayOpenIdx = -1 (caller 가 새 그룹 생성).
     */
    private InsertContext locateLv3Group(String content, String groupKey) {
        Matcher m = LV3_BLOCK_PATTERN.matcher(content);
        if (!m.find()) return null;
        int openIdx = m.end() - 1;
        int closeIdx = findMatchingBracket(content, openIdx);
        if (closeIdx < 0) return null;

        InsertContext ctx = new InsertContext();
        ctx.lv3BodyCloseIdx = closeIdx;
        ctx.groupArrayOpenIdx = -1;

        // lv3 body 안에서만 group key 검색 — 우연한 매칭(주석/문자열) 회피
        String body = content.substring(openIdx + 1, closeIdx);
        Pattern groupPattern = Pattern.compile(
                "(?:^|\\n)\\s*" + Pattern.quote(groupKey) + "\\s*:\\s*\\[",
                Pattern.MULTILINE);
        Matcher gm = groupPattern.matcher(body);
        if (gm.find()) {
            // `[` 의 절대 위치 = openIdx+1 + gm.end()-1
            ctx.groupArrayOpenIdx = openIdx + 1 + gm.end() - 1;
        }
        return ctx;
    }

    /** 그룹 배열 안에서 최대 `key: N` 값 + 1 반환. 없으면 9000 (예약 영역). */
    private int nextKeyInGroup(String content, InsertContext ctx, String groupKey) {
        if (ctx.groupArrayOpenIdx < 0) return 9000;
        int arrayClose = findMatchingBracket(content, ctx.groupArrayOpenIdx);
        if (arrayClose < 0) return 9000;
        String body = content.substring(ctx.groupArrayOpenIdx + 1, arrayClose);
        Pattern keyPattern = Pattern.compile("\\bkey\\s*:\\s*(\\d+)");
        Matcher km = keyPattern.matcher(body);
        int max = 0;
        while (km.find()) {
            try {
                int v = Integer.parseInt(km.group(1));
                if (v > max) max = v;
            } catch (NumberFormatException ignore) { /* skip */ }
        }
        return (max == 0) ? 9000 : max + 1;
    }

    /** 신규 entry 객체 텍스트 — PLANEL 의 기존 entry 포맷 모사. */
    private String buildEntryText(AppendSpec spec, int keyValue, String iconName) {
        StringBuilder sb = new StringBuilder();
        sb.append("    {\n");
        sb.append("      key: ").append(keyValue).append(", reduxKey: \"").append(spec.reduxKey)
          .append("\", title: \"").append(spec.title).append("\",\n");
        sb.append("      icon: <").append(iconName).append(" />,\n");
        sb.append("      component: <").append(spec.componentName)
          .append(" viewName={\"").append(spec.reduxKey).append("\"} title=\"")
          .append(spec.title).append("\" />\n");
        sb.append("    },\n");
        return sb.toString();
    }

    /**
     * 기존 그룹 배열의 닫는 `]` 직전에 entry 를 삽입.
     * 직전 entry 의 후행 `,` 가 누락된 경우 (배열이 비어있지 않은데 마지막 entry 가 `}` 로 끝남) 도 처리.
     */
    private String insertBeforeArrayClose(String content, int arrayCloseIdx, String entryText) {
        // 닫는 `]` 직전을 뒤로 거슬러 보며 직전 비공백 문자가 `}` 면 후행 `,` 가 필요할 수 있음
        int i = arrayCloseIdx - 1;
        while (i >= 0 && Character.isWhitespace(content.charAt(i))) i--;
        boolean prevIsCloseBrace = (i >= 0 && content.charAt(i) == '}');
        boolean prevIsComma = (i >= 0 && content.charAt(i) == ',');
        boolean prevIsOpenBracket = (i >= 0 && content.charAt(i) == '[');

        StringBuilder prefix = new StringBuilder();
        if (prevIsCloseBrace) {
            // 직전 entry 가 `}` 로 끝나고 `,` 없음 → 콤마 보강
            prefix.append(",\n");
        } else if (prevIsComma || prevIsOpenBracket) {
            prefix.append("\n");
        } else {
            prefix.append("\n");
        }

        return content.substring(0, arrayCloseIdx)
                + prefix.toString()
                + entryText
                + "  "  // 닫는 ] 앞 들여쓰기
                + content.substring(arrayCloseIdx);
    }

    /**
     * 새 그룹을 lv3MenuList 의 닫는 `}` 직전에 삽입.
     *   <GROUP_KEY>: [
     *       <entry>
     *   ],
     */
    private String insertNewGroup(String content, int lv3CloseIdx, String groupKey, String entryText) {
        int i = lv3CloseIdx - 1;
        while (i >= 0 && Character.isWhitespace(content.charAt(i))) i--;
        boolean prevIsCloseBracket = (i >= 0 && content.charAt(i) == ']');
        boolean prevIsComma = (i >= 0 && content.charAt(i) == ',');

        StringBuilder prefix = new StringBuilder();
        if (prevIsCloseBracket) {
            prefix.append(",\n");
        } else if (prevIsComma) {
            prefix.append("\n");
        } else {
            // lv3MenuList 가 비어있을 가능성 — 첫 entry
            prefix.append("\n");
        }
        prefix.append("  ").append(groupKey).append(": [\n");

        StringBuilder suffix = new StringBuilder();
        suffix.append("  ],\n");

        return content.substring(0, lv3CloseIdx)
                + prefix.toString()
                + entryText
                + suffix.toString()
                + content.substring(lv3CloseIdx);
    }
}
