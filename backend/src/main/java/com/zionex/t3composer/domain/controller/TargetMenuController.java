package com.zionex.t3composer.domain.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zionex.t3composer.config.TargetDataSourceRegistry;
import com.zionex.t3composer.domain.entity.TargetSystem;
import com.zionex.t3composer.domain.repository.TargetSystemRepository;
import com.zionex.t3composer.domain.service.JsMenuFileParser;
import com.zionex.t3composer.domain.service.TargetPathResolver;
import com.zionex.t3composer.shared.data.ResponseMessage;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Target DB (예: target-mssql T3SMARTSCM) 의 메뉴 트리를 조회.
 *
 * 사용처: Composer 의 "기존화면복사 (NEW_FROM_COPY)" 모드에서 원본 메뉴 선택용
 * MenuTreeBrowser 가 호출. 평탄 SELECT 후 PARENT_ID 기반 트리로 조립해 반환.
 *
 * NOTE: composer 자체 메타(PG) 가 아닌 target operational DB 를 본다 — qualifier 명시.
 */
@Slf4j
@RestController
@RequestMapping("/composer/target/menus")
@RequiredArgsConstructor
public class TargetMenuController {

    @Qualifier("targetJdbcTemplate")
    private final JdbcTemplate targetJdbcTemplate;

    private final TargetDataSourceRegistry dsRegistry;
    private final TargetPathResolver       pathResolver;
    private final TargetSystemRepository   targetRepo;
    private final JsMenuFileParser         jsMenuFileParser;

    /**
     * 활성 Target 의 운영 DB JdbcTemplate 반환. db_url 미설정/연결실패 시
     * synced 로컬 target-mssql JdbcTemplate 으로 폴백.
     */
    private JdbcTemplate pickJdbc(String targetCd) {
        if (targetCd != null && !targetCd.isBlank()) {
            JdbcTemplate live = dsRegistry.getJdbcTemplate(targetCd);
            if (live != null) return live;
            log.debug("Target {} 운영 DB 미연결 — 로컬 폴백 사용", targetCd);
        }
        return targetJdbcTemplate;
    }

    /**
     * TB_AD_MENU + TB_AD_LANG_PACK 조인. preview 임시 메뉴(__PV<sid8> 접미어) 제외.
     * BaseEntity audit 컬럼이 있을 수도 있어 명시 컬럼만 SELECT.
     */
    private static final String SQL =
        "SELECT m.ID, m.PARENT_ID, m.MENU_CD, m.MENU_PATH, m.MENU_SEQ, m.MENU_FILE_PATH, " +
        "       lp.LANG_VALUE AS DISPLAY_NAME " +
        "  FROM TB_AD_MENU m " +
        "  LEFT JOIN TB_AD_LANG_PACK lp " +
        "    ON lp.LANG_KEY = m.MENU_CD AND lp.LANG_CD = ? " +
        " WHERE m.USE_YN = 'Y' " +
        "   AND m.MENU_CD NOT LIKE '%\\_\\_PV%' ESCAPE '\\' " +
        " ORDER BY m.MENU_SEQ, m.MENU_CD";

    @GetMapping
    public ResponseEntity<?> tree(@RequestParam(defaultValue = "ko") String lang,
                                   @RequestParam(required = false) String target) {
        try {
            // 1) Target 의 menu_source 기반 분기
            String menuSource = "DB";
            if (target != null && !target.isBlank()) {
                TargetSystem t = targetRepo.findById(target).orElse(null);
                if (t != null && t.getMenuSource() != null && !t.getMenuSource().isBlank()) {
                    menuSource = t.getMenuSource();
                }
            }

            if ("JS_FILE".equalsIgnoreCase(menuSource)) {
                return ResponseEntity.ok(loadJsFileMenus(target, lang));
            }

            // 2) 기본 DB 경로
            JdbcTemplate jdbc = pickJdbc(target);
            List<Map<String, Object>> flat = jdbc.queryForList(SQL, lang);
            Map<String, Object> tree = buildTree(flat);
            tree.put("source", (jdbc != targetJdbcTemplate) ? ("target:" + target) : "local");
            tree.put("menuSource", "DB");
            return ResponseEntity.ok(tree);
        } catch (Exception e) {
            log.error("Target menu tree 조회 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ResponseMessage.error(e.getMessage()));
        }
    }

    /**
     * Target.sourceRefPath 아래의 JS 파일에서 메뉴 트리 추출.
     * 기본 후보: src/pages/TabMenuList.js (PlanNEL 컨벤션)
     * @param lang 사용자 언어 (ko/en/ja/zh/vi) — translation.<lang>-<region>.json 로 매핑되어
     *             메뉴 i18n key 를 한국어 등 표시명으로 변환.
     */
    private Map<String, Object> loadJsFileMenus(String targetCd, String lang) throws IOException {
        String root = pathResolver.resolveSourcePath(targetCd);
        if (root == null) {
            throw new IOException("Target " + targetCd + " 의 source 경로를 찾을 수 없음 "
                    + "(.env 의 TARGET_" + targetCd + "_PATH 확인)");
        }
        Path[] candidates = new Path[]{
            Path.of(root, "src", "pages", "TabMenuList.js"),
            Path.of(root, "src", "pages", "TabMenuList.jsx"),
            Path.of(root, "src", "TabMenuList.js"),
        };
        Path found = null;
        for (Path p : candidates) {
            if (Files.isRegularFile(p)) { found = p; break; }
        }
        if (found == null) {
            Map<String, Object> empty = new LinkedHashMap<>();
            empty.put("items", List.of());
            empty.put("source", "target:" + targetCd);
            empty.put("menuSource", "JS_FILE");
            empty.put("error", "TabMenuList.js 파일을 찾지 못했습니다. " +
                    "sourceRefPath 와 src/pages/TabMenuList.js 존재 여부를 확인하세요. " +
                    "검색한 경로: " + Arrays.toString(candidates));
            return empty;
        }
        // src/assets/data/l10n/translation.<lang>-<region>.json 의 "menu" 객체를 i18n map 으로.
        Map<String, String> translations = loadMenuTranslations(root, lang);
        Map<String, Object> tree = jsMenuFileParser.parse(found, translations);
        tree.put("source", "target:" + targetCd);
        tree.put("menuSource", "JS_FILE");
        tree.put("sourceFile", found.toString());
        tree.put("i18nKeyCount", translations.size());
        return tree;
    }

    /**
     * src/assets/data/l10n/translation.&lt;lang&gt;-&lt;region&gt;.json 의 최상위 "menu" 객체를
     * Map&lt;i18nKey, 표시명&gt; 으로 평탄화. PlanNEL 컨벤션:
     *   { "menu": { "menuDemandPlan": "수요 계획", "inventoryPlan": "재고 계획", ... } }
     * 파일 미발견·파싱 실패 시 빈 Map 반환 (parser 는 i18n key 그대로 표시).
     */
    private Map<String, String> loadMenuTranslations(String sourceRoot, String lang) {
        String region = regionForLang(lang);
        if (region == null) return Map.of();
        Path file = Path.of(sourceRoot, "src", "assets", "data", "l10n",
                "translation." + region + ".json");
        if (!Files.isRegularFile(file)) {
            log.debug("translation 파일 없음: {}", file);
            return Map.of();
        }
        try {
            ObjectMapper mapper = new ObjectMapper();
            mapper.configure(JsonParser.Feature.ALLOW_COMMENTS, true);
            JsonNode tree = mapper.readTree(file.toFile());
            JsonNode menu = tree.get("menu");
            if (menu == null || !menu.isObject()) return Map.of();
            Map<String, String> out = new HashMap<>();
            menu.fields().forEachRemaining(e -> {
                JsonNode v = e.getValue();
                if (v != null && v.isTextual()) out.put(e.getKey(), v.asText());
            });
            return out;
        } catch (IOException e) {
            log.warn("translation 파일 파싱 실패: {} — {}", file, e.getMessage());
            return Map.of();
        }
    }

    /** ko → "ko-kr" 등 PlanNEL translation 파일 region 토큰 매핑. */
    private String regionForLang(String lang) {
        if (lang == null) return null;
        switch (lang.toLowerCase()) {
            case "ko": return "ko-kr";
            case "en": return "en-us";
            case "ja": return "ja-jp";
            case "zh": return "zh-cn";
            case "vi": return "vi-vn";
            default:   return null;
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> buildTree(List<Map<String, Object>> flat) {
        // 1) 평탄 → 노드 객체 변환
        Map<String, Map<String, Object>> byDbId = new HashMap<>();
        for (Map<String, Object> row : flat) {
            String dbId = stringOf(row.get("ID"));
            String menuCd = stringOf(row.get("MENU_CD"));
            String filePath = stringOf(row.get("MENU_FILE_PATH"));
            String dispRaw = stringOf(row.get("DISPLAY_NAME"));

            Map<String, Object> node = new LinkedHashMap<>();
            node.put("id",          menuCd);                            // ★ 식별자 = MENU_CD
            node.put("dbId",        dbId);
            node.put("parentDbId",  stringOf(row.get("PARENT_ID")));
            node.put("path",        stringOf(row.get("MENU_PATH")));
            node.put("filePath",    filePath);
            node.put("seq",         row.get("MENU_SEQ"));
            // displayName 우선순위: TB_AD_LANG_PACK → file-path basename → menuCd
            String displayName = (dispRaw != null && !dispRaw.isBlank())
                ? dispRaw
                : deriveFallbackName(menuCd, filePath);
            node.put("displayName", displayName);
            node.put("hasLangPack", dispRaw != null && !dispRaw.isBlank());
            node.put("items", new ArrayList<Map<String, Object>>());
            byDbId.put(dbId, node);
        }

        // 2) 부모-자식 연결
        List<Map<String, Object>> roots = new ArrayList<>();
        for (Map<String, Object> row : flat) {
            String dbId = stringOf(row.get("ID"));
            String parentDbId = stringOf(row.get("PARENT_ID"));
            Map<String, Object> node = byDbId.get(dbId);
            if (parentDbId == null || parentDbId.isEmpty() || !byDbId.containsKey(parentDbId)) {
                roots.add(node);
            } else {
                List<Map<String, Object>> children =
                    (List<Map<String, Object>>) byDbId.get(parentDbId).get("items");
                children.add(node);
            }
        }

        // 3) 두번째 패스 — root 그룹이 langpack 없고 filePath 도 빈 경우,
        //    자식의 첫 filePath 첫 segment 로 영문 그룹명 추정.
        //    예) MENU_09 children 의 filePath="/snop/..." → "SNOP"
        for (Map<String, Object> node : byDbId.values()) {
            backfillGroupNameFromChildren(node);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("items", roots);
        return result;
    }

    /** group 도 폴백 derivation 제거 — 다국어 없으면 MENU_CD 그대로 유지 */
    private void backfillGroupNameFromChildren(Map<String, Object> node) {
        // no-op: deriveFallbackName 이 이미 MENU_CD 반환하므로 추가 보강 불필요
    }

    private static String stringOf(Object v) {
        return v == null ? null : v.toString();
    }

    /**
     * displayName 폴백 — TB_AD_LANG_PACK 미등록 메뉴용.
     * wingui 동작과 동일하게 — 다국어가 없으면 메뉴 명칭으로 MENU_CD 자체 사용.
     * (transLangKey(key) 가 매핑 못 찾으면 key 그대로 반환하는 정책과 일치)
     */
    private static String deriveFallbackName(String menuCd, String filePath) {
        return menuCd == null ? "" : menuCd;
    }

}
