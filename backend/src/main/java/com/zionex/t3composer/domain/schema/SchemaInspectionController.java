package com.zionex.t3composer.domain.schema;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Composer NEW_NL 흐름의 테이블 / SP 자동 lookup REST 엔드포인트.
 *
 *   GET  /composer/schema/tables/{tableName}/exists?targetCd=T3SERIES
 *   GET  /composer/schema/tables/{tableName}?targetCd=T3SERIES
 *   POST /composer/schema/tables/lookup       body: {names:[...], targetCd: "T3SERIES"}
 *   POST /composer/schema/tables/extract      body: {text: "...",  targetCd: "T3SERIES"}
 *   POST /composer/schema/procedures/lookup   body: {names:[...], targetCd: "T3SERIES"}
 *   POST /composer/schema/procedures/extract  body: {text: "...",  targetCd: "T3SERIES"}
 *
 * 테이블/SP 모두 targetCd 의 Target Operational DB(MSSQL) 의 INFORMATION_SCHEMA / sys.procedures 조회.
 * targetCd 미지정 또는 연결 실패 시 빈 결과.
 */
@Slf4j
@RestController
@RequestMapping("/composer/schema")
@RequiredArgsConstructor
public class SchemaInspectionController {

    private final SchemaInspectionService schemaInspectionService;
    private final ProcedureInspectionService procedureInspectionService;

    @GetMapping("/tables/{tableName}/exists")
    public Map<String, Object> tableExists(@PathVariable String tableName,
                                           @RequestParam(value = "targetCd", required = false) String targetCd) {
        boolean exists = schemaInspectionService.tableExists(targetCd, tableName);
        Map<String, Object> out = new HashMap<>();
        out.put("tableName", tableName);
        out.put("targetCd", targetCd);
        out.put("exists", exists);
        return out;
    }

    @GetMapping("/tables/{tableName}")
    public TableInfo getTableInfo(@PathVariable String tableName,
                                  @RequestParam(value = "targetCd", required = false) String targetCd) {
        return schemaInspectionService.getTableInfo(targetCd, tableName);
    }

    /**
     * 배치 lookup. body: { "names": ["TB_AD_USER", "TB_FP_DEMAND", ...], "targetCd": "T3SERIES" }
     */
    @PostMapping("/tables/lookup")
    public Map<String, Object> lookupBatch(@RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<String> names = (List<String>) body.getOrDefault("names", List.of());
        String targetCd = (String) body.getOrDefault("targetCd", null);
        Map<String, TableInfo> results = schemaInspectionService.getMultipleTables(targetCd, names);
        Map<String, Object> out = new HashMap<>();
        out.put("targetCd", targetCd);
        out.put("results", results);
        out.put("formattedForPrompt", schemaInspectionService.formatLookupResultForPrompt(results));
        return out;
    }

    /**
     * 자연어 prompt 텍스트에서 TB_* 패턴 테이블명 자동 추출 + lookup.
     * body: { "text": "TB_FP_DEMAND 와 TB_CM_ITEM_MST 사용하는 화면 만들어줘", "targetCd": "T3SERIES" }
     */
    @PostMapping("/tables/extract")
    public Map<String, Object> extractAndLookup(@RequestBody Map<String, Object> body) {
        String text = (String) body.getOrDefault("text", "");
        String targetCd = (String) body.getOrDefault("targetCd", null);
        List<String> extracted = schemaInspectionService.extractTableNamesFromText(text);
        Map<String, TableInfo> results = schemaInspectionService.getMultipleTables(targetCd, extracted);
        Map<String, Object> out = new HashMap<>();
        out.put("targetCd", targetCd);
        out.put("extractedNames", extracted);
        out.put("results", results);
        out.put("formattedForPrompt", schemaInspectionService.formatLookupResultForPrompt(results));
        return out;
    }

    // ──────────────────────────────────────────────────────────────────
    // Stored Procedure lookup — Target Operational DB(MSSQL) 의 sys.procedures
    // ──────────────────────────────────────────────────────────────────

    /**
     * SP 명 배치 lookup.
     * body: { "names": ["SP_UI_CM_ITEM_MST_Q", ...], "targetCd": "T3SERIES" }
     */
    @PostMapping("/procedures/lookup")
    public Map<String, Object> lookupProceduresBatch(@RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<String> names = (List<String>) body.getOrDefault("names", List.of());
        String targetCd = (String) body.getOrDefault("targetCd", null);
        Map<String, ProcedureInfo> results = procedureInspectionService.getMultipleProcedures(targetCd, names);
        Map<String, Object> out = new HashMap<>();
        out.put("targetCd", targetCd);
        out.put("results", results);
        out.put("formattedForPrompt", procedureInspectionService.formatLookupResultForPrompt(results));
        return out;
    }

    /**
     * 자연어 prompt 텍스트에서 SP_* 패턴 자동 추출 + lookup.
     * body: { "text": "SP_UI_CM_ITEM_MST_Q 로 조회하고 SP_UI_CM_ITEM_MST_S 로 저장", "targetCd": "T3SERIES" }
     */
    @PostMapping("/procedures/extract")
    public Map<String, Object> extractAndLookupProcedures(@RequestBody Map<String, Object> body) {
        String text = (String) body.getOrDefault("text", "");
        String targetCd = (String) body.getOrDefault("targetCd", null);
        List<String> extracted = procedureInspectionService.extractProcedureNamesFromText(text);
        Map<String, ProcedureInfo> results = procedureInspectionService.getMultipleProcedures(targetCd, extracted);
        Map<String, Object> out = new HashMap<>();
        out.put("targetCd", targetCd);
        out.put("extractedNames", extracted);
        out.put("results", results);
        out.put("formattedForPrompt", procedureInspectionService.formatLookupResultForPrompt(results));
        return out;
    }
}
