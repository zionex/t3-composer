package com.zionex.t3composer.domain.schema;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Composer NEW_NL 흐름의 테이블 / SP 자동 lookup REST 엔드포인트.
 *
 *   GET  /composer/schema/tables/{tableName}/exists           — 테이블 존재 여부만
 *   GET  /composer/schema/tables/{tableName}                  — 테이블 컬럼 + PK + 행수
 *   POST /composer/schema/tables/lookup       body: {names:[...]}
 *   POST /composer/schema/tables/extract      body: {text: "..."}
 *   POST /composer/schema/procedures/lookup   body: {names:[...], targetCd: "T3SERIES"}
 *   POST /composer/schema/procedures/extract  body: {text: "...",  targetCd: "T3SERIES"}
 *
 * 테이블 조회: 메인 DataSource (T3SMARTSCM.dbo) 의 INFORMATION_SCHEMA.
 * SP 조회   : targetCd 의 Target Operational DB(MSSQL) 의 sys.procedures.
 */
@Slf4j
@RestController
@RequestMapping("/composer/schema")
@RequiredArgsConstructor
public class SchemaInspectionController {

    private final SchemaInspectionService schemaInspectionService;
    private final ProcedureInspectionService procedureInspectionService;

    @GetMapping("/tables/{tableName}/exists")
    public Map<String, Object> tableExists(@PathVariable String tableName) {
        boolean exists = schemaInspectionService.tableExists(tableName);
        Map<String, Object> out = new HashMap<>();
        out.put("tableName", tableName);
        out.put("exists", exists);
        return out;
    }

    @GetMapping("/tables/{tableName}")
    public TableInfo getTableInfo(@PathVariable String tableName) {
        return schemaInspectionService.getTableInfo(tableName);
    }

    /**
     * 배치 lookup. body: { "names": ["TB_AD_USER", "TB_FP_DEMAND", ...] }
     */
    @PostMapping("/tables/lookup")
    public Map<String, Object> lookupBatch(@RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<String> names = (List<String>) body.getOrDefault("names", List.of());
        Map<String, TableInfo> results = schemaInspectionService.getMultipleTables(names);
        Map<String, Object> out = new HashMap<>();
        out.put("results", results);
        out.put("formattedForPrompt", schemaInspectionService.formatLookupResultForPrompt(results));
        return out;
    }

    /**
     * 자연어 prompt 텍스트에서 TB_* 패턴 테이블명 자동 추출 + lookup.
     * body: { "text": "TB_FP_DEMAND 와 TB_CM_ITEM_MST 사용하는 화면 만들어줘" }
     */
    @PostMapping("/tables/extract")
    public Map<String, Object> extractAndLookup(@RequestBody Map<String, Object> body) {
        String text = (String) body.getOrDefault("text", "");
        List<String> extracted = schemaInspectionService.extractTableNamesFromText(text);
        Map<String, TableInfo> results = schemaInspectionService.getMultipleTables(extracted);
        Map<String, Object> out = new HashMap<>();
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
