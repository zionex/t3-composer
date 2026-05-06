package com.zionex.t3composer.domain.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.HashSet;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.VerticalAlignment;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.ss.util.WorkbookUtil;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import com.zionex.t3composer.config.ApplicationProperties;
import com.zionex.t3composer.domain.entity.ComposerArtifact;
import com.zionex.t3composer.domain.entity.ComposerSession;
import com.zionex.t3composer.domain.repository.ComposerArtifactRepository;
import com.zionex.t3composer.domain.repository.ComposerSessionRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Composer 세션 아티팩트로부터 화면설계서 Excel(.xlsx) 을 생성한다.
 *
 * 시트 구성 (역파서 ModeNewFromDesign.parseGridColumnsFromRows 호환):
 *   1. 개정이력
 *   2. 개요          — 화면 메타 + 분할 형태 + BaseGrid/Tab 개수
 *   3. 레이아웃      — 분할 방향 / BaseGrid 위치 / Tab 구성 / 영역 트리
 *   4. 조회조건      — InputField + CommonCodeSelect + Pop* + 도메인 컴포넌트
 *   5. 그리드 목록   — 화면의 모든 BaseGrid 요약
 *   6. <그리드별>    — 각 BaseGrid 의 컬럼 상세 + 버튼 (다중 시트)
 *   7. table         — 모든 CREATE TABLE 통합
 *   8. query         — SP_UI_* + zAxios REST + callService + Controller 매핑 통합
 *
 * 출력 설계 원칙:
 *   - 설계서를 NEW_FROM_DESIGN 모드에 다시 입력해 같은 화면을 재현 가능한 정밀도
 *   - 역파서가 인식 가능한 시트명/헤더 키워드 사용 (grid|그리드, 좌측|우측|상단|하단, name|header|type|width|editable|format|align)
 *   - 각 시트는 단독으로도 의미가 통하도록 헤더/섹션 라벨 명시
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DesignDocExportService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private static final Set<String> LAYOUT_TAGS = Set.of(
            "ContentInner", "SearchArea", "SearchRow", "WorkArea", "ResultArea",
            "ButtonArea", "LeftButtonArea", "RightButtonArea",
            "SplitPanel", "VLayoutBox", "HLayoutBox",
            "TabContainer", "Tab", "PopupDialog",
            "BaseGrid", "TreeGrid"
    );
    private static final Set<String> SPLIT_TAGS = Set.of("SplitPanel", "VLayoutBox", "HLayoutBox");

    private static final Set<String> SEARCH_COMPONENTS = Set.of(
            "InputField", "CommonCodeSelect", "PlanScope",
            "ItemSearchInput", "AccountSearchInput", "UserInputField",
            "ItemMultiSearchBox", "LocationMultiSearchBox", "ResourceMultiSearchBox"
    );

    private final ComposerSessionRepository  sessionRepo;
    private final ComposerArtifactRepository artifactRepo;
    private final ApplicationProperties      props;

    public byte[] export(String sessionId) throws IOException {
        ComposerSession session = sessionRepo.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));

        List<ComposerArtifact> artifacts = artifactRepo
                .findBySessionIdAndStatusNotOrderByCreateDttmDesc(sessionId, ComposerArtifact.STATUS_DISCARDED);

        String jsx = firstContentByType(artifacts, ComposerArtifact.TYPE_SCREEN_JSX);

        LayoutInfo layout      = parseLayout(jsx);
        List<GridSpec> grids   = parseAllGrids(jsx, layout);
        List<FieldSpec> fields = parseSearchFields(jsx);

        // NEW_FROM_COPY 등에서 신규 세션 아티팩트만으로는 SP·Table 정보가 비어있다.
        // JSX 의 zAxios URL 을 기준으로 프로젝트 트리를 스캔해 Controller→Service→SP→Table 을 추적.
        SourceTrace trace = traceFromProjectRoot(jsx);

        List<CallSpec> calls   = parseCommunication(jsx, artifacts, trace);
        List<ProcedureSpec> procs = parseProcedures(artifacts, trace);
        List<TableSpec> tables = parseAllTables(artifacts, trace);

        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            Styles styles = new Styles(wb);

            buildRevisionHistorySheet(wb, styles, session);
            buildOverviewSheet(wb, styles, session, artifacts, layout,
                    grids, fields, calls, procs, tables);
            buildLayoutSheet(wb, styles, layout);
            buildSearchConditionSheet(wb, styles, fields);
            buildGridListSheet(wb, styles, grids);
            for (GridSpec g : grids) {
                buildGridDetailSheet(wb, styles, g);
            }
            buildTableSheet(wb, styles, tables);
            buildQuerySheet(wb, styles, procs, calls);

            try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
                wb.write(out);
                return out.toByteArray();
            }
        }
    }

    // ============================================================
    // Sheet builders
    // ============================================================

    private void buildRevisionHistorySheet(Workbook wb, Styles s, ComposerSession session) {
        XSSFSheet sh = (XSSFSheet) wb.createSheet("개정이력");
        sh.setColumnWidth(0, 3500);
        sh.setColumnWidth(1, 2500);
        sh.setColumnWidth(2, 10000);
        sh.setColumnWidth(3, 3500);
        sh.setColumnWidth(4, 3500);
        writeHeaderRow(sh, 0, s.headerStyle, "날짜", "Ver.", "내용", "작성자", "승인자");
        Row r = sh.createRow(1);
        setCell(r, 0, s.cellStyle, session.getCreateDttm() == null ? "" : session.getCreateDttm().format(DATE_FMT));
        setCell(r, 1, s.cellStyle, "1.0");
        setCell(r, 2, s.cellStyle, "T3Composer 자동 생성");
        setCell(r, 3, s.cellStyle, nvl(session.getCreateBy()));
        setCell(r, 4, s.cellStyle, "");
    }

    private void buildOverviewSheet(Workbook wb, Styles s, ComposerSession session,
                                    List<ComposerArtifact> artifacts, LayoutInfo layout,
                                    List<GridSpec> grids, List<FieldSpec> fields,
                                    List<CallSpec> calls, List<ProcedureSpec> procs,
                                    List<TableSpec> tables) {
        XSSFSheet sh = (XSSFSheet) wb.createSheet("개요");
        sh.setColumnWidth(0, 6500);
        sh.setColumnWidth(1, 24000);

        String screenId   = extractScreenId(session, artifacts);
        String screenName = extractScreenName(session, artifacts);
        String menuParent = extractMenuParent(artifacts);
        String menuPath   = extractMenuPath(artifacts);
        String jsxPath    = screenJsxPath(artifacts);
        String langKey    = isBlank(screenId) ? "" : screenId;

        int totalCols = totalColumns(grids);
        int spDdl     = procs.size();
        int spRef     = (int) calls.stream()
                .filter(c -> c.kind != null && c.kind.startsWith("SP via")).count();
        int spTotal   = Math.max(spDdl, spRef);

        List<String> crudFns = inferCrudFunctions(grids, calls, procs);
        String description   = generateScreenDescription(screenName, crudFns, layout, grids,
                                                         totalCols, fields.size(), spTotal);
        String dataFlow      = formatDataFlow(calls);
        String artifactSum   = summarizeArtifacts(artifacts);
        String tableSummary  = formatTableSummary(tables);

        int rowIdx = 0;
        rowIdx = writeKeyValue(sh, s, rowIdx, "화면명",         screenName);
        rowIdx = writeKeyValue(sh, s, rowIdx, "화면 ID",        screenId);
        rowIdx = writeKeyValue(sh, s, rowIdx, "메뉴 위치 (부모 코드)", menuParent);
        rowIdx = writeKeyValue(sh, s, rowIdx, "메뉴 경로",      menuPath);
        rowIdx = writeKeyValue(sh, s, rowIdx, "다국어 키",       langKey);
        rowIdx = writeKeyValue(sh, s, rowIdx, "JSX 파일 경로",   jsxPath);
        rowIdx = writeKeyValue(sh, s, rowIdx, "화면 설명",       description);
        rowIdx = writeKeyValue(sh, s, rowIdx, "주요 기능",       crudFns.isEmpty() ? "(미상)"
                : String.join(" / ", crudFns));
        rowIdx = writeKeyValue(sh, s, rowIdx, "데이터 호출 방식", dataFlow);
        rowIdx = writeKeyValue(sh, s, rowIdx, "분할 형태",       nvl(layout.orientationLabel));
        rowIdx = writeKeyValue(sh, s, rowIdx, "BaseGrid 개수",   String.valueOf(layout.grids.size()));
        rowIdx = writeKeyValue(sh, s, rowIdx, "그리드 컬럼 합계", String.valueOf(totalCols));
        rowIdx = writeKeyValue(sh, s, rowIdx, "검색 조건 수",    String.valueOf(fields.size()));
        rowIdx = writeKeyValue(sh, s, rowIdx, "TabContainer",   layout.tabs.isEmpty() ? "사용 안함"
                : "사용 (" + layout.tabs.size() + "개 탭)");
        rowIdx = writeKeyValue(sh, s, rowIdx, "사용 테이블 수",  tableSummary);
        rowIdx = writeKeyValue(sh, s, rowIdx, "SP 개수",         String.valueOf(spTotal));
        rowIdx = writeKeyValue(sh, s, rowIdx, "생성 산출물",     artifactSum);
        rowIdx = writeKeyValue(sh, s, rowIdx, "모듈 / 세션 ID",  session.getId());
        writeKeyValue(sh, s, rowIdx, "생성일시", formatDateTime(session.getCreateDttm()));
    }

    // ---- 개요 보조 헬퍼 ----

    private static final DateTimeFormatter DATETIME_FMT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private String formatDateTime(LocalDateTime dt) {
        return dt == null ? "" : dt.format(DATETIME_FMT);
    }

    private String screenJsxPath(List<ComposerArtifact> artifacts) {
        return artifacts.stream()
                .filter(a -> ComposerArtifact.TYPE_SCREEN_JSX.equals(a.getArtifactType()))
                .map(ComposerArtifact::getFilePath)
                .filter(p -> p != null && !p.isBlank())
                .findFirst().orElse("");
    }

    private int totalColumns(List<GridSpec> grids) {
        int sum = 0;
        for (GridSpec g : grids) sum += g.columns.size();
        return sum;
    }

    /**
     * 그리드 버튼 + SP 접미어 + zAxios 메서드를 종합해 CRUD 기능 추론.
     * 결과 순서: 조회 → 등록 → 수정 → 삭제 → 엑셀 다운/업로드.
     */
    private List<String> inferCrudFunctions(List<GridSpec> grids,
                                            List<CallSpec> calls, List<ProcedureSpec> procs) {
        Set<String> fns = new LinkedHashSet<>();

        for (GridSpec g : grids) {
            for (String b : g.buttonsHint) {
                if (b.contains("Add")) fns.add("등록");
                else if (b.contains("Delete") || b.contains("Del")) fns.add("삭제");
                else if (b.contains("Save")) fns.add("수정");
                else if (b.contains("ExcelExport")) fns.add("엑셀 다운로드");
                else if (b.contains("ExcelImport")) fns.add("엑셀 업로드");
            }
        }
        for (ProcedureSpec p : procs) {
            String t = p.type == null ? "" : p.type;
            if ("Query".equals(t)) fns.add("조회");
            else if ("Save".equals(t)) { fns.add("등록"); fns.add("수정"); }
            else if ("Delete".equals(t)) fns.add("삭제");
        }
        for (CallSpec c : calls) {
            String k = c.kind == null ? "" : c.kind;
            if ("GET".equals(k)) fns.add("조회");
            else if ("POST".equals(k) || "PUT".equals(k)) {
                if (c.url != null && c.url.endsWith("/delete")) fns.add("삭제");
                else { fns.add("등록"); fns.add("수정"); }
            } else if ("DELETE".equals(k)) fns.add("삭제");
        }

        List<String> ordered = new ArrayList<>();
        for (String fn : List.of("조회", "등록", "수정", "삭제", "엑셀 다운로드", "엑셀 업로드")) {
            if (fns.contains(fn)) ordered.add(fn);
        }
        return ordered;
    }

    /** 사람이 읽기 좋은 화면 설명 생성. */
    private String generateScreenDescription(String screenName, List<String> crudFns,
                                             LayoutInfo layout, List<GridSpec> grids,
                                             int totalCols, int searchFields, int spCount) {
        // 화면명에서 도메인 추출 (예: "사용자정보 관리" → "사용자정보")
        String entity = screenName == null ? "" : screenName
                .replaceAll("(?i)\\s*(관리|화면|MGMT|Mgmt|Management|Screen).*$", "")
                .trim();
        if (entity.isBlank()) entity = "데이터";

        StringBuilder sb = new StringBuilder();
        sb.append(entity).append("를 ");
        if (crudFns.isEmpty()) {
            sb.append("표시·분석");
        } else {
            sb.append(String.join("·", crudFns));
        }
        sb.append("하는 ");

        if (crudFns.contains("등록") && crudFns.contains("수정") && crudFns.contains("삭제")) {
            sb.append("마스터 관리 화면");
        } else if (grids.size() >= 2) {
            sb.append("마스터-디테일 화면");
        } else if (!layout.tabs.isEmpty()) {
            sb.append("탭 기반 분석 화면");
        } else if (crudFns.size() == 1 && crudFns.contains("조회")) {
            sb.append("조회 전용 화면");
        } else {
            sb.append("기능 화면");
        }
        sb.append(". ");

        if (searchFields > 0) sb.append("검색 조건 ").append(searchFields).append("개, ");
        sb.append("그리드 ").append(grids.size()).append("개");
        if (totalCols > 0) sb.append(" (총 ").append(totalCols).append("컬럼)");
        if (spCount > 0) sb.append(", SP ").append(spCount).append("개");
        sb.append(" 사용.");

        return sb.toString();
    }

    private String formatDataFlow(List<CallSpec> calls) {
        boolean hasZAxios = false, hasController = false, hasCallService = false, hasSpRef = false;
        for (CallSpec c : calls) {
            if (c.kind == null) continue;
            if ("callService".equals(c.kind)) hasCallService = true;
            else if (c.kind.startsWith("SP via")) hasSpRef = true;
            else if ("Controller (Java)".equals(c.target)) hasController = true;
            else if (c.kind.matches("GET|POST|PUT|DELETE|PATCH")) hasZAxios = true;
        }

        List<String> parts = new ArrayList<>();
        if (hasZAxios)      parts.add("JSX zAxios → RestController");
        else if (hasController) parts.add("RestController");
        if (hasSpRef)       parts.add("JdbcTemplate → SP_UI_*");
        if (hasCallService) parts.add("callService → 엔진 서버 (mp/dp/bf/fp)");

        return parts.isEmpty() ? "(통신 호출 미발견)" : String.join(" / ", parts);
    }

    private String summarizeArtifacts(List<ComposerArtifact> artifacts) {
        Map<String, Integer> counts = new LinkedHashMap<>();
        for (ComposerArtifact a : artifacts) {
            String t = a.getArtifactType();
            if (t == null) continue;
            counts.merge(t, 1, Integer::sum);
        }
        if (counts.isEmpty()) return "(없음)";
        StringBuilder sb = new StringBuilder();
        boolean first = true;
        for (Map.Entry<String, Integer> e : counts.entrySet()) {
            if (!first) sb.append(", ");
            first = false;
            sb.append(e.getKey()).append(" ").append(e.getValue());
        }
        return sb.toString();
    }

    private String formatTableSummary(List<TableSpec> tables) {
        if (tables.isEmpty()) return "0";
        StringBuilder sb = new StringBuilder();
        sb.append(tables.size()).append(" (");
        int max = Math.min(tables.size(), 5);
        for (int i = 0; i < max; i++) {
            if (i > 0) sb.append(", ");
            sb.append(tables.get(i).name);
        }
        if (tables.size() > 5) sb.append(" 외 ").append(tables.size() - 5).append("개");
        sb.append(")");
        return sb.toString();
    }

    private void buildLayoutSheet(Workbook wb, Styles s, LayoutInfo layout) {
        XSSFSheet sh = (XSSFSheet) wb.createSheet("레이아웃");
        // col 0 — Lv / 순번 (좁아도 됨) / KeyValue 키
        sh.setColumnWidth(0, 4500);
        sh.setColumnWidth(1, 7000);
        sh.setColumnWidth(2, 4500);
        sh.setColumnWidth(3, 5000);
        sh.setColumnWidth(4, 14000);
        final int span = 5;

        int rowIdx = 0;
        rowIdx = writeSectionTitle(sh, rowIdx, s, "1. 화면 분할 방향", span);
        rowIdx = writeKeyValue(sh, s, rowIdx, "Orientation", nvl(layout.orientation));
        rowIdx = writeKeyValue(sh, s, rowIdx, "분할 형태",   nvl(layout.orientationLabel));
        rowIdx = writeKeyValue(sh, s, rowIdx, "BaseGrid 수", String.valueOf(layout.grids.size()));
        rowIdx = writeKeyValue(sh, s, rowIdx, "TabContainer", layout.tabs.isEmpty() ? "사용 안함" : "사용");
        rowIdx++;

        rowIdx = writeSectionTitle(sh, rowIdx, s, "2. BaseGrid 위치 매핑", span);
        writeHeaderRow(sh, rowIdx++, s.headerStyle, "순번", "Grid ID", "위치", "items 변수", "부모 컨테이너");
        if (layout.grids.isEmpty()) {
            Row r = sh.createRow(rowIdx++);
            setCell(r, 0, s.cellStyle, "(BaseGrid 없음)");
        } else {
            for (GridLocation g : layout.grids) {
                Row r = sh.createRow(rowIdx++);
                setCell(r, 0, s.cellStyle, String.valueOf(g.n));
                setCell(r, 1, s.cellStyle, nvl(g.id));
                setCell(r, 2, s.cellStyle, nvl(g.position));
                setCell(r, 3, s.cellStyle, nvl(g.itemsVar));
                setCell(r, 4, s.cellStyle, nvl(g.parent));
            }
        }
        rowIdx++;

        if (!layout.tabs.isEmpty()) {
            rowIdx = writeSectionTitle(sh, rowIdx, s, "3. Tab 정의", span);
            writeHeaderRow(sh, rowIdx++, s.headerStyle, "순번", "Tab Value", "Tab Label");
            for (int i = 0; i < layout.tabs.size(); i++) {
                TabSpec t = layout.tabs.get(i);
                Row r = sh.createRow(rowIdx++);
                setCell(r, 0, s.cellStyle, String.valueOf(i + 1));
                setCell(r, 1, s.cellStyle, nvl(t.value));
                setCell(r, 2, s.cellStyle, nvl(t.label));
            }
            rowIdx++;
        }

        rowIdx = writeSectionTitle(sh, rowIdx, s, "4. 영역 트리 (JSX 구조)", span);
        writeHeaderRow(sh, rowIdx++, s.headerStyle, "Lv", "구성요소", "역할", "ID/Var", "주요 속성");
        if (layout.tree.isEmpty()) {
            Row r = sh.createRow(rowIdx++);
            setCell(r, 1, s.cellStyle, "(JSX 파싱 결과 없음)");
        } else {
            for (LayoutNode n : layout.tree) {
                Row r = sh.createRow(rowIdx++);
                setCell(r, 0, s.cellStyle, String.valueOf(n.level));
                setCell(r, 1, s.cellStyle, indent(n.level) + n.tag);
                setCell(r, 2, s.cellStyle, nvl(n.role));
                setCell(r, 3, s.cellStyle, nvl(n.idOrVar));
                setCell(r, 4, s.cellStyle, nvl(n.props));
            }
        }
        rowIdx++;

        if (!layout.notes.isEmpty()) {
            rowIdx = writeSectionTitle(sh, rowIdx, s, "5. 분석 노트", span);
            for (String note : layout.notes) {
                Row r = sh.createRow(rowIdx++);
                setCell(r, 1, s.cellStyle, "· " + note);
            }
        }
    }

    private void buildSearchConditionSheet(Workbook wb, Styles s, List<FieldSpec> fields) {
        XSSFSheet sh = (XSSFSheet) wb.createSheet("조회조건");
        int[] widths = {1500, 4000, 5000, 4500, 5500, 3000, 4000, 9000, 4500};
        for (int i = 0; i < widths.length; i++) sh.setColumnWidth(i, widths[i]);

        writeHeaderRow(sh, 0, s.headerStyle,
                "번호", "name", "label", "다국어", "type", "필수", "default", "옵션 / 그룹코드", "의존성");

        for (int i = 0; i < fields.size(); i++) {
            FieldSpec f = fields.get(i);
            Row r = sh.createRow(i + 1);
            setCell(r, 0, s.cellStyle, String.valueOf(i + 1));
            setCell(r, 1, s.cellStyle, nvl(f.name));
            setCell(r, 2, s.cellStyle, nvl(f.label));
            setCell(r, 3, s.cellStyle, nvl(f.langKey));
            String typeWidget = f.component + (isBlank(f.type) ? "" : " (" + f.type + ")");
            setCell(r, 4, s.cellStyle, typeWidget);
            setCell(r, 5, s.cellStyle, nvl(f.required));
            setCell(r, 6, s.cellStyle, nvl(f.defaultValue));
            setCell(r, 7, s.cellStyle, optionsSummary(f));
            setCell(r, 8, s.cellStyle, nvl(f.dependency));
        }
        if (fields.isEmpty()) {
            Row r = sh.createRow(1);
            setCell(r, 0, s.cellStyle, "(검색 영역 미사용 — InputField/CommonCodeSelect/Pop* 미발견)");
        }
    }

    private void buildGridListSheet(Workbook wb, Styles s, List<GridSpec> grids) {
        XSSFSheet sh = (XSSFSheet) wb.createSheet("그리드 목록");
        int[] widths = {1500, 4000, 4500, 4000, 6000, 3000, 9000};
        for (int i = 0; i < widths.length; i++) sh.setColumnWidth(i, widths[i]);

        writeHeaderRow(sh, 0, s.headerStyle,
                "순번", "Grid ID", "items 변수", "위치", "상세 시트", "컬럼 수", "버튼");

        for (int i = 0; i < grids.size(); i++) {
            GridSpec g = grids.get(i);
            Row r = sh.createRow(i + 1);
            setCell(r, 0, s.cellStyle, String.valueOf(i + 1));
            setCell(r, 1, s.cellStyle, nvl(g.id));
            setCell(r, 2, s.cellStyle, nvl(g.varName));
            setCell(r, 3, s.cellStyle, nvl(g.position));
            setCell(r, 4, s.cellStyle, nvl(g.sheetName));
            setCell(r, 5, s.cellStyle, String.valueOf(g.columns.size()));
            setCell(r, 6, s.cellStyle, String.join(", ", g.buttonsHint));
        }
        if (grids.isEmpty()) {
            Row r = sh.createRow(1);
            setCell(r, 0, s.cellStyle,
                    "(BaseGrid 미발견 — 표시용 컴포넌트가 없는 화면이거나 JSX 파싱 실패)");
        }
    }

    private void buildGridDetailSheet(Workbook wb, Styles s, GridSpec g) {
        String safe = WorkbookUtil.createSafeSheetName(g.sheetName, '-');
        String unique = safe;
        int sfx = 2;
        while (wb.getSheet(unique) != null) {
            unique = safe + "-" + sfx++;
        }
        XSSFSheet sh = (XSSFSheet) wb.createSheet(unique);

        // col 0 — 번호(짧음) / 메타키(items 변수 등) 혼용. 4000 으로 고정해서 키도 잘 보이게.
        int[] widths = {4000, 5000, 4500, 5000, 3500, 3000, 3000, 3000, 5500, 8500, 8500, 5500};
        for (int i = 0; i < widths.length; i++) sh.setColumnWidth(i, widths[i]);
        final int span = 12;

        // 메타 헤더 — 시트 상단에 위치/변수명 명시
        int rowIdx = 0;
        rowIdx = writeKeyValue(sh, s, rowIdx, "Grid ID",     nvl(g.id));
        rowIdx = writeKeyValue(sh, s, rowIdx, "items 변수",  nvl(g.varName));
        rowIdx = writeKeyValue(sh, s, rowIdx, "위치",        nvl(g.position));
        rowIdx++;

        rowIdx = writeSectionTitle(sh, rowIdx, s, "컬럼 상세", span);
        // 헤더 키워드 — 역파서(parseGridColumnsFromRows) 가 인식할 수 있도록
        // name / header / type / width / editable / align / format 모두 포함
        writeHeaderRow(sh, rowIdx++, s.headerStyle,
                "번호", "name", "fieldName", "header", "type",
                "width", "editable", "align",
                "format (displayType / datetimeFormat / numberFormat)",
                "Dropdown values / labels",
                "validRules / editor / button",
                "default / visible / 비고");

        if (g.columns.isEmpty()) {
            Row r = sh.createRow(rowIdx);
            setCell(r, 1, s.cellStyle,
                    "(컬럼 파싱 실패 — items 변수 정의를 찾지 못함: " + nvl(g.varName) + ")");
        } else {
            int colN = 1;
            for (ColumnSpec c : g.columns) {
                Row r = sh.createRow(rowIdx++);
                setCell(r, 0, s.cellStyle, String.valueOf(colN++));
                setCell(r, 1, s.cellStyle, nvl(c.name));
                setCell(r, 2, s.cellStyle, nvl(c.fieldName));
                setCell(r, 3, s.cellStyle, nvl(c.headerText));
                setCell(r, 4, s.cellStyle, nvl(c.dataType));
                setCell(r, 5, s.cellStyle, nvl(c.width));
                setCell(r, 6, s.cellStyle, nvl(c.editable));
                setCell(r, 7, s.cellStyle, nvl(c.textAlignment));
                setCell(r, 8, s.cellStyle, formatSummary(c));
                setCell(r, 9, s.cellStyle, dropdownSummary(c));
                setCell(r, 10, s.cellStyle, validatorSummary(c));
                setCell(r, 11, s.cellStyle, columnExtras(c));
            }
        }

        rowIdx++;
        rowIdx = writeSectionTitle(sh, rowIdx, s, "그리드 버튼", span);
        writeHeaderRow(sh, rowIdx++, s.headerStyle, "버튼 컴포넌트", "역할");
        if (g.buttonsHint.isEmpty()) {
            Row r = sh.createRow(rowIdx);
            setCell(r, 0, s.cellStyle, "(없음)");
        } else {
            for (String b : g.buttonsHint) {
                Row r = sh.createRow(rowIdx++);
                setCell(r, 0, s.cellStyle, b);
                setCell(r, 1, s.cellStyle, buttonRole(b));
            }
        }
    }

    /**
     * 화면에서 사용하는 모든 테이블 (신규 + 참조). 출처 컬럼 추가.
     *  - DDL : SQL_DDL 아티팩트의 CREATE TABLE
     *  - Entity : Java Entity @Table(name=...) + @Column 매핑
     *  - SP 참조 : SQL_SP 아티팩트 본문의 TB_* / tb_is_* 패턴
     *  - JSX 참조 : 드물지만 JSX 본문에 TB_* 가 있는 경우
     */
    private void buildTableSheet(Workbook wb, Styles s, List<TableSpec> tables) {
        XSSFSheet sh = (XSSFSheet) wb.createSheet("table");
        int[] widths = {5500, 5500, 4500, 4500, 4500, 2000, 2500, 4000, 7000};
        for (int i = 0; i < widths.length; i++) sh.setColumnWidth(i, widths[i]);

        writeHeaderRow(sh, 0, s.headerStyle,
                "Table Name", "출처", "Column ID", "Column Name", "Type/Length",
                "Key", "Not Null", "Default", "Comment");

        int rowIdx = 1;
        if (tables.isEmpty()) {
            Row r = sh.createRow(1);
            setCell(r, 0, s.cellStyle,
                    "(테이블 참조 없음 — DDL/Entity/SP/JSX 모두에서 TB_* 패턴 미발견)");
            return;
        }

        for (TableSpec t : tables) {
            String src = t.sourceLabel();
            if (t.columns.isEmpty()) {
                Row r = sh.createRow(rowIdx++);
                setCell(r, 0, s.cellStyle, t.name);
                setCell(r, 1, s.cellStyle, src);
                setCell(r, 2, s.cellStyle, "");
                setCell(r, 3, s.cellStyle, "");
                setCell(r, 4, s.cellStyle, "");
                setCell(r, 5, s.cellStyle, "");
                setCell(r, 6, s.cellStyle, "");
                setCell(r, 7, s.cellStyle, "");
                setCell(r, 8, s.cellStyle, "(스키마 정보 없음 — 기존 테이블 재사용)");
            } else {
                for (TableColumn c : t.columns) {
                    Row r = sh.createRow(rowIdx++);
                    setCell(r, 0, s.cellStyle, t.name);
                    setCell(r, 1, s.cellStyle, src);
                    setCell(r, 2, s.cellStyle, nvl(c.colId));
                    setCell(r, 3, s.cellStyle, nvl(c.colName));
                    setCell(r, 4, s.cellStyle, nvl(c.typeLen));
                    setCell(r, 5, s.cellStyle, nvl(c.key));
                    setCell(r, 6, s.cellStyle, nvl(c.notNull));
                    setCell(r, 7, s.cellStyle, nvl(c.defaultValue));
                    setCell(r, 8, s.cellStyle, nvl(c.comment));
                }
            }
        }
    }

    private static final Pattern TABLE_REF_RE = Pattern.compile(
            "\\b(TB_[A-Z][A-Z0-9_]+|tb_is_[a-z][a-z0-9_]+|VW_[A-Z][A-Z0-9_]+)\\b");
    private static final Pattern TABLE_ANN_RE = Pattern.compile(
            "@Table\\s*\\([^)]*name\\s*=\\s*\"([A-Za-z_][A-Za-z0-9_]*)\"", Pattern.DOTALL);
    private static final Pattern COL_ANN_RE = Pattern.compile(
            "@Column\\s*\\([^)]*name\\s*=\\s*\"([A-Za-z_][A-Za-z0-9_]*)\"", Pattern.DOTALL);

    private List<TableSpec> parseAllTables(List<ComposerArtifact> artifacts, SourceTrace trace) {
        Map<String, TableSpec> map = new LinkedHashMap<>();

        // 1) DDL CREATE TABLE — 가장 풍부한 컬럼 정보
        for (ComposerArtifact a : artifactsByType(artifacts, ComposerArtifact.TYPE_SQL_DDL)) {
            String ddl = a.getContent();
            if (ddl == null) continue;
            Matcher m = CREATE_TABLE_RE.matcher(ddl);
            while (m.find()) {
                String name = m.group(1).replaceAll("[\\[\\]]", "");
                TableSpec t = map.computeIfAbsent(name, TableSpec::new);
                t.fromDdl = true;
                String body = m.group(2);
                String[] lines = body.split(",\\s*\\n");
                for (String line : lines) {
                    if (line.toUpperCase().contains("CONSTRAINT ")) continue;
                    Matcher cm = COLUMN_RE.matcher(line.trim());
                    if (!cm.find()) continue;
                    String colId = cm.group(1).replaceAll("[\\[\\]]", "");
                    String typeLen = cm.group(2);
                    String nn = cm.group(3) == null ? ""
                            : (cm.group(3).toUpperCase().contains("NOT") ? "Y" : "");
                    if (t.columns.stream().noneMatch(c -> c.colId.equalsIgnoreCase(colId))) {
                        TableColumn tc = new TableColumn();
                        tc.colId = colId;
                        tc.colName = colId;
                        tc.typeLen = typeLen;
                        tc.notNull = nn;
                        t.columns.add(tc);
                    }
                }
            }
        }

        // 2) Java Entity — @Table + @Column
        for (ComposerArtifact a : artifactsByType(artifacts, ComposerArtifact.TYPE_JAVA_ENTITY)) {
            String src = a.getContent();
            if (src == null) continue;
            Matcher tm = TABLE_ANN_RE.matcher(src);
            while (tm.find()) {
                String name = tm.group(1);
                TableSpec t = map.computeIfAbsent(name, TableSpec::new);
                t.fromEntity = true;
                Matcher cm = COL_ANN_RE.matcher(src);
                while (cm.find()) {
                    String colId = cm.group(1);
                    if (t.columns.stream().noneMatch(c -> c.colId.equalsIgnoreCase(colId))) {
                        TableColumn tc = new TableColumn();
                        tc.colId = colId;
                        tc.colName = colId;
                        t.columns.add(tc);
                    }
                }
            }
        }

        // 3) SQL_SP 본문 — TB_*/tb_is_*/VW_* 패턴
        for (ComposerArtifact a : artifactsByType(artifacts, ComposerArtifact.TYPE_SQL_SP)) {
            String src = a.getContent();
            if (src == null) continue;
            String spName = extractProcedureName(src);
            Matcher m = TABLE_REF_RE.matcher(src);
            Set<String> seen = new HashSet<>();
            while (m.find()) {
                String name = m.group(1);
                if (!seen.add(name)) continue;
                TableSpec t = map.computeIfAbsent(name, TableSpec::new);
                t.spReferences.add(isBlank(spName) ? "?" : spName);
            }
        }

        // 4) JSX (드문 케이스) — 임베디드 SQL 또는 hard-coded 테이블명
        String jsx = artifacts.stream()
                .filter(a -> ComposerArtifact.TYPE_SCREEN_JSX.equals(a.getArtifactType()))
                .map(ComposerArtifact::getContent)
                .filter(c -> c != null && !c.isBlank())
                .findFirst().orElse("");
        if (!jsx.isBlank()) {
            Matcher m = TABLE_REF_RE.matcher(jsx);
            Set<String> seen = new HashSet<>();
            while (m.find()) {
                String name = m.group(1);
                if (!seen.add(name)) continue;
                TableSpec t = map.computeIfAbsent(name, TableSpec::new);
                t.fromJsx = true;
            }
        }

        // 5) 프로젝트 트레이스 — Controller / Service / SP 본문에서 추출한 테이블/뷰
        if (trace != null) {
            for (String name : trace.tableNames) {
                TableSpec t = map.computeIfAbsent(name, TableSpec::new);
                t.fromProjectScan = true;
            }
            // SP 본문에서 컬럼 정보가 추출 가능한 테이블 — 별도 처리 안함 (정보 부족)
        }

        return new ArrayList<>(map.values());
    }

    private void buildQuerySheet(Workbook wb, Styles s,
                                 List<ProcedureSpec> procs, List<CallSpec> calls) {
        XSSFSheet sh = (XSSFSheet) wb.createSheet("query");
        int[] widths = {7000, 4500, 7000, 18000};
        for (int i = 0; i < widths.length; i++) sh.setColumnWidth(i, widths[i]);

        writeHeaderRow(sh, 0, s.headerStyle, "이름", "Type", "호출 위치", "파라미터 / 설명");

        int rowIdx = 1;
        for (ProcedureSpec p : procs) {
            Row r = sh.createRow(rowIdx++);
            setCell(r, 0, s.cellStyle, nvl(p.name));
            setCell(r, 1, s.cellStyle, nvl(p.type));
            setCell(r, 2, s.cellStyle, "SQL_SP 아티팩트");
            setCell(r, 3, s.cellStyle, nvl(p.params));
        }
        for (CallSpec c : calls) {
            Row r = sh.createRow(rowIdx++);
            setCell(r, 0, s.cellStyle, nvl(c.url));
            setCell(r, 1, s.cellStyle, c.kind + (isBlank(c.target) ? "" : " (" + c.target + ")"));
            setCell(r, 2, s.cellStyle, nvl(c.location));
            setCell(r, 3, s.cellStyle, nvl(c.params));
        }
        if (rowIdx == 1) {
            Row r = sh.createRow(1);
            setCell(r, 0, s.cellStyle, "(SP/통신 호출 미발견)");
        }
    }

    // ============================================================
    // Parsers — Layout / Grids / Search / Communication / Procedures
    // ============================================================

    private LayoutInfo parseLayout(String jsx) {
        LayoutInfo info = new LayoutInfo();
        if (jsx == null || jsx.isBlank()) {
            info.notes.add("JSX 아티팩트 없음 — 레이아웃 추정 불가");
            info.orientationLabel = "단일 또는 미상";
            return info;
        }

        List<TagOccurrence> tags = findTagOccurrences(jsx);

        Deque<StackEntry> stack = new ArrayDeque<>();
        stack.push(new StackEntry("ROOT", "", 0));
        int gridSeq = 0;

        for (TagOccurrence t : tags) {
            if (t.isClose) {
                if (stack.size() > 1 && stack.peek().tag.equals(t.tag)) stack.pop();
                continue;
            }
            int childIdx = stack.peek().nextChildIdx++;
            StackEntry entry = new StackEntry(t.tag, t.attrs, childIdx);

            int level = stack.size() - 1;
            String role = roleOf(t.tag);
            String idAttr = matchAttr(t.attrs, "id");
            String propsSummary = summarizeAttrs(t.tag, t.attrs);
            info.tree.add(new LayoutNode(level, t.tag, role, idAttr, propsSummary));

            if ("BaseGrid".equals(t.tag) || "TreeGrid".equals(t.tag)) {
                gridSeq++;
                String position = computePosition(stack, childIdx);
                String itemsVar = matchAttrExpr(t.attrs, "items");
                String gid = isBlank(idAttr) ? "grid" + gridSeq : idAttr;
                String parent = parentLabel(stack);
                info.grids.add(new GridLocation(gridSeq, gid, position, itemsVar, parent));
            }

            if ("Tab".equals(t.tag)) {
                TabSpec ts = new TabSpec();
                ts.value = matchAttr(t.attrs, "value");
                ts.label = matchAttr(t.attrs, "label");
                info.tabs.add(ts);
            }

            if (!t.selfClosing) {
                stack.push(entry);
            }
        }

        info.orientation = inferOrientationFromGrids(info.grids);
        info.orientationLabel = orientationLabel(info.orientation, info.grids.size(), !info.tabs.isEmpty());

        if (info.grids.isEmpty()) info.notes.add("BaseGrid 미발견");
        return info;
    }

    /** JSX 텍스트에서 LAYOUT_TAGS 의 open / close / self-closing 태그를 모두 검출. */
    private List<TagOccurrence> findTagOccurrences(String jsx) {
        List<TagOccurrence> out = new ArrayList<>();
        int n = jsx.length();
        int i = 0;
        while (i < n) {
            char c = jsx.charAt(i);
            if (c == '<' && i + 1 < n) {
                char next = jsx.charAt(i + 1);
                if (next == '/') {
                    int end = jsx.indexOf('>', i + 2);
                    if (end < 0) break;
                    String tag = jsx.substring(i + 2, end).trim();
                    if (LAYOUT_TAGS.contains(tag)) {
                        out.add(new TagOccurrence(tag, true, false, ""));
                    }
                    i = end + 1;
                    continue;
                }
                if (Character.isLetter(next) || next == '_') {
                    int j = i + 1;
                    while (j < n && (Character.isLetterOrDigit(jsx.charAt(j)) || jsx.charAt(j) == '_')) j++;
                    String tag = jsx.substring(i + 1, j);
                    if (!LAYOUT_TAGS.contains(tag)) {
                        i++;
                        continue;
                    }
                    int k = j;
                    int depthBrace = 0;
                    while (k < n) {
                        char ch = jsx.charAt(k);
                        if (ch == '{') {
                            depthBrace++;
                        } else if (ch == '}') {
                            depthBrace--;
                        } else if (ch == '\'' || ch == '"' || ch == '`') {
                            char quote = ch;
                            k++;
                            while (k < n && jsx.charAt(k) != quote) {
                                if (jsx.charAt(k) == '\\' && k + 1 < n) k++;
                                k++;
                            }
                            if (k >= n) break;
                        } else if (ch == '>' && depthBrace == 0) {
                            break;
                        }
                        k++;
                    }
                    if (k >= n) break;

                    String attrs = jsx.substring(j, k).trim();
                    boolean selfClosing = attrs.endsWith("/");
                    if (selfClosing) attrs = attrs.substring(0, attrs.length() - 1).trim();

                    out.add(new TagOccurrence(tag, false, selfClosing, attrs));
                    i = k + 1;
                    continue;
                }
            }
            i++;
        }
        return out;
    }

    /**
     * BaseGrid 의 화면 내 위치(좌/우/상/하 또는 좌상/우상/좌하/우하) 를
     * stack 의 SplitPanel 경로 + 각 단계 childIdx 로 결정.
     */
    private String computePosition(Deque<StackEntry> stack, int leafChildIdx) {
        // 역파서(ModeNewFromDesign.inferPosition) 가 인식하는 형식 "좌상/우상/좌하/우하" 와
        // 일치시키기 위해 horizontal 라벨을 먼저, vertical 라벨을 뒤에 둔다.
        StringBuilder h = new StringBuilder();
        StringBuilder v = new StringBuilder();
        Iterator<StackEntry> it = stack.descendingIterator();
        StackEntry parent = it.hasNext() ? it.next() : null;
        while (it.hasNext()) {
            StackEntry child = it.next();
            if (parent != null && SPLIT_TAGS.contains(parent.tag)) {
                String dir = inferDirection(parent.tag, parent.attrs);
                String l = positionLabel(dir, child.childIdx);
                if ("horizontal".equals(dir)) h.append(l); else v.append(l);
            }
            parent = child;
        }
        if (parent != null && SPLIT_TAGS.contains(parent.tag)) {
            String dir = inferDirection(parent.tag, parent.attrs);
            String l = positionLabel(dir, leafChildIdx);
            if ("horizontal".equals(dir)) h.append(l); else v.append(l);
        }
        return h.toString() + v.toString();
    }

    private String inferDirection(String tag, String attrs) {
        if ("HLayoutBox".equals(tag)) return "horizontal";
        if ("VLayoutBox".equals(tag)) return "vertical";
        String d = matchAttr(attrs, "direction");
        if (d != null) return d.toLowerCase();
        return "horizontal";
    }

    private String positionLabel(String dir, int idx) {
        if ("horizontal".equals(dir)) {
            return idx == 0 ? "좌" : idx == 1 ? "우" : idx == 2 ? "중" : "";
        }
        if ("vertical".equals(dir)) {
            return idx == 0 ? "상" : idx == 1 ? "하" : "";
        }
        return "";
    }

    private String parentLabel(Deque<StackEntry> stack) {
        if (stack.size() <= 1) return "ContentInner";
        return stack.peek().tag;
    }

    private String roleOf(String tag) {
        if (tag.equals("SearchArea") || tag.equals("SearchRow")) return "검색";
        if (tag.equals("WorkArea") || tag.equals("ResultArea")) return "메인";
        if (tag.equals("ButtonArea") || tag.equals("LeftButtonArea") || tag.equals("RightButtonArea")) return "버튼영역";
        if (tag.equals("SplitPanel") || tag.equals("VLayoutBox") || tag.equals("HLayoutBox")) return "분할";
        if (tag.equals("TabContainer") || tag.equals("Tab")) return "탭";
        if (tag.equals("BaseGrid") || tag.equals("TreeGrid")) return "그리드";
        if (tag.equals("PopupDialog")) return "팝업";
        if (tag.equals("ContentInner")) return "최상위";
        return "";
    }

    private String summarizeAttrs(String tag, String attrs) {
        if (attrs == null || attrs.isBlank()) return "";
        StringBuilder sb = new StringBuilder();
        if (SPLIT_TAGS.contains(tag)) {
            sb.append("direction=").append(inferDirection(tag, attrs));
            String sizes = matchAttrExpr(attrs, "sizes");
            if (sizes != null) sb.append(", sizes=").append(sizes);
            String minSize = firstNonNull(matchAttr(attrs, "minSize"), matchAttrExpr(attrs, "minSize"));
            if (minSize != null) sb.append(", minSize=").append(minSize);
        } else if ("Tab".equals(tag)) {
            String v = matchAttr(attrs, "value");
            String l = matchAttr(attrs, "label");
            if (v != null) sb.append("value=").append(v);
            if (l != null) { if (sb.length() > 0) sb.append(", "); sb.append("label=").append(l); }
        } else if ("BaseGrid".equals(tag) || "TreeGrid".equals(tag)) {
            String items = matchAttrExpr(attrs, "items");
            if (items != null) sb.append("items={").append(items).append("}");
        }
        return sb.toString();
    }

    private String inferOrientationFromGrids(List<GridLocation> grids) {
        if (grids.isEmpty()) return null;
        boolean hasV = false, hasH = false, hasQuad = false;
        for (GridLocation g : grids) {
            if (g.position == null) continue;
            String p = g.position;
            if (p.contains("좌상") || p.contains("우상") || p.contains("좌하") || p.contains("우하")) hasQuad = true;
            else if (p.contains("좌") || p.contains("우")) hasH = true;
            else if (p.contains("상") || p.contains("하")) hasV = true;
        }
        if (hasQuad) return "G";
        if (hasH) return "H";
        if (hasV) return "V";
        return null;
    }

    private String orientationLabel(String orientation, int gridCount, boolean hasTabs) {
        if (gridCount == 0) return hasTabs ? "탭 컨테이너" : "단일 영역";
        if (gridCount == 1) return "단일 그리드";
        if ("H".equals(orientation)) return "좌우 2분할";
        if ("V".equals(orientation)) return "상하 2분할";
        if ("G".equals(orientation)) return "4분할 (사분면)";
        return gridCount + "개 그리드";
    }

    // ---- Grid columns ----

    private List<GridSpec> parseAllGrids(String jsx, LayoutInfo layout) {
        List<GridSpec> out = new ArrayList<>();
        if (jsx == null || jsx.isBlank() || layout.grids.isEmpty()) return out;

        Set<String> usedNames = new HashSet<>();
        for (int i = 0; i < layout.grids.size(); i++) {
            GridLocation loc = layout.grids.get(i);
            GridSpec g = new GridSpec();
            g.id = loc.id;
            g.varName = loc.itemsVar == null ? "" : loc.itemsVar;
            g.position = loc.position;

            String baseName = chooseGridSheetName(loc, i);
            String unique = baseName;
            int n = 2;
            while (usedNames.contains(unique)) {
                unique = baseName + "-" + n++;
            }
            usedNames.add(unique);
            g.sheetName = unique;

            g.columns = extractColumnsFromVar(jsx, g.varName);
            g.buttonsHint = extractButtonsForGrid(jsx, loc.id);
            out.add(g);
        }
        return out;
    }

    /**
     * 그리드 시트명. 역파서(ModeNewFromDesign.parseLayoutFromGrids) 가
     *  - "grid" 또는 "그리드" 키워드 → 그리드 시트로 인식
     *  - "좌"/"우"/"상"/"하"/"좌상"/"우상"/"좌하"/"우하" 키워드 → 위치로 인식
     * 이 두 가지를 모두 만족하도록 네이밍.
     */
    private String chooseGridSheetName(GridLocation g, int idx) {
        if (g.position != null && !g.position.isBlank()) {
            return g.position + "그리드";
        }
        return "grid-" + (idx + 1);
    }

    private List<ColumnSpec> extractColumnsFromVar(String jsx, String varName) {
        List<ColumnSpec> out = new ArrayList<>();
        if (varName == null) return out;
        String var = varName.trim();
        if (var.startsWith("{") && var.endsWith("}")) var = var.substring(1, var.length() - 1).trim();
        if (!var.matches("[A-Za-z_][A-Za-z0-9_]*")) return out;

        Pattern declRe = Pattern.compile("(?:let|const|var)\\s+" + Pattern.quote(var) + "\\s*=\\s*\\[");
        Matcher m = declRe.matcher(jsx);
        if (!m.find()) return out;
        int lbracket = m.end() - 1;
        int end = findMatching(jsx, lbracket, '[', ']');
        if (end < 0) return out;
        String body = jsx.substring(lbracket + 1, end);

        for (String obj : splitTopLevelObjects(body)) {
            ColumnSpec c = parseColumnObject(obj);
            if (c != null) out.add(c);
        }
        return out;
    }

    private List<String> splitTopLevelObjects(String body) {
        List<String> out = new ArrayList<>();
        int n = body.length();
        int i = 0;
        while (i < n) {
            while (i < n && (Character.isWhitespace(body.charAt(i)) || body.charAt(i) == ',')) i++;
            if (i >= n) break;
            if (body.charAt(i) != '{') { i++; continue; }
            int end = findMatching(body, i, '{', '}');
            if (end < 0) break;
            out.add(body.substring(i + 1, end));
            i = end + 1;
        }
        return out;
    }

    private ColumnSpec parseColumnObject(String body) {
        Map<String, String> kv = parseObjectKVs(body);
        if (kv.isEmpty()) return null;
        ColumnSpec c = new ColumnSpec();
        c.name             = unquote(kv.get("name"));
        c.fieldName        = unquote(kv.get("fieldName"));
        c.headerText       = unquote(firstNonNull(kv.get("headerText"), kv.get("header")));
        c.dataType         = unquote(kv.get("dataType"));
        c.displayType      = unquote(kv.get("displayType"));
        c.width            = unquote(kv.get("width"));
        c.editable         = unquote(kv.get("editable"));
        c.visible          = unquote(kv.get("visible"));
        c.textAlignment    = unquote(kv.get("textAlignment"));
        c.useDropdown      = unquote(kv.get("useDropdown"));
        c.lookupDisplay    = unquote(kv.get("lookupDisplay"));
        c.values           = kv.get("values");
        c.labels           = kv.get("labels");
        c.datetimeFormat   = unquote(kv.get("datetimeFormat"));
        c.numberFormat     = unquote(kv.get("numberFormat"));
        c.validRules       = kv.get("validRules");
        c.editor           = kv.get("editor");
        c.defaultValue     = unquote(kv.get("defaultValue"));
        c.button           = unquote(kv.get("button"));
        c.buttonVisibility = unquote(kv.get("buttonVisibility"));
        return c;
    }

    /** key:value 페어를 brace/bracket-aware 로 추출. */
    private Map<String, String> parseObjectKVs(String body) {
        Map<String, String> out = new LinkedHashMap<>();
        int n = body.length();
        int i = 0;
        while (i < n) {
            while (i < n && (Character.isWhitespace(body.charAt(i)) || body.charAt(i) == ',')) i++;
            if (i >= n) break;
            int keyStart = i;
            while (i < n && (Character.isLetterOrDigit(body.charAt(i)) || body.charAt(i) == '_'
                    || body.charAt(i) == '\'' || body.charAt(i) == '"')) i++;
            String key = body.substring(keyStart, i).trim()
                    .replace("'", "").replace("\"", "");
            while (i < n && Character.isWhitespace(body.charAt(i))) i++;
            if (i >= n || body.charAt(i) != ':') {
                while (i < n && body.charAt(i) != ',') i++;
                continue;
            }
            i++;
            while (i < n && Character.isWhitespace(body.charAt(i))) i++;
            if (i >= n) break;
            int valStart = i;
            char ch = body.charAt(i);
            if (ch == '[' || ch == '{') {
                int end = findMatching(body, i, ch, ch == '[' ? ']' : '}');
                if (end < 0) break;
                out.put(key, body.substring(valStart, end + 1).trim());
                i = end + 1;
            } else if (ch == '\'' || ch == '"') {
                char quote = ch;
                i++;
                int strStart = i;
                while (i < n && body.charAt(i) != quote) {
                    if (body.charAt(i) == '\\' && i + 1 < n) i++;
                    i++;
                }
                out.put(key, body.substring(strStart, Math.min(i, n)).trim());
                if (i < n) i++;
            } else if (ch == '`') {
                i++;
                while (i < n && body.charAt(i) != '`') i++;
                if (i < n) i++;
            } else {
                int depth = 0;
                int valEnd = i;
                while (valEnd < n) {
                    char vc = body.charAt(valEnd);
                    if (vc == '(' || vc == '[' || vc == '{') depth++;
                    else if (vc == ')' || vc == ']' || vc == '}') {
                        if (depth == 0) break;
                        depth--;
                    } else if (vc == ',' && depth == 0) break;
                    valEnd++;
                }
                out.put(key, body.substring(valStart, valEnd).trim());
                i = valEnd;
            }
        }
        return out;
    }

    private List<String> extractButtonsForGrid(String jsx, String gridId) {
        List<String> out = new ArrayList<>();
        if (jsx == null || gridId == null) return out;
        String[] kinds = {
                "GridAddRowButton", "GridDeleteRowButton", "GridDelRowButton",
                "GridSaveButton", "GridExcelExportButton", "GridExcelImportButton",
                "LargeExcelDownload", "GridCnt"
        };
        for (String k : kinds) {
            Pattern p = Pattern.compile(
                    "<" + k + "\\b[^>]*?grid\\s*=\\s*[\"']" + Pattern.quote(gridId) + "[\"']");
            if (p.matcher(jsx).find()) out.add(k);
        }
        return out;
    }

    // ---- Search fields ----

    private List<FieldSpec> parseSearchFields(String jsx) {
        List<FieldSpec> out = new ArrayList<>();
        if (jsx == null || jsx.isBlank()) return out;

        // SearchArea 안만 대상으로 (없으면 전체)
        int saStart = jsx.indexOf("<SearchArea");
        int saEnd   = jsx.indexOf("</SearchArea>");
        String body = (saStart >= 0 && saEnd > saStart) ? jsx.substring(saStart, saEnd) : jsx;

        for (String comp : SEARCH_COMPONENTS) {
            Pattern p = Pattern.compile("<" + comp + "\\b([^>]*?)/?>", Pattern.DOTALL);
            Matcher m = p.matcher(body);
            while (m.find()) {
                String attrs = m.group(1);
                FieldSpec f = new FieldSpec();
                f.component = comp;
                f.name = matchAttr(attrs, "name");
                f.label = matchAttr(attrs, "label");
                f.langKey = firstNonNull(matchAttr(attrs, "langKey"),
                        matchAttr(attrs, "label_i18n_key"));
                f.type = matchAttr(attrs, "type");
                f.defaultValue = firstNonNull(
                        matchAttr(attrs, "defaultValue"),
                        matchAttrExpr(attrs, "defaultValue"));
                f.required = firstNonNull(
                        matchAttr(attrs, "required"),
                        matchAttrExpr(attrs, "required"));
                f.groupCd = matchAttr(attrs, "groupCd");
                f.options = matchAttrExpr(attrs, "options");
                out.add(f);
            }
        }

        // PopXxx 컴포넌트
        Pattern popRe = Pattern.compile("<(Pop[A-Z][A-Za-z0-9]+)\\b([^>]*?)/?>", Pattern.DOTALL);
        Matcher pm = popRe.matcher(body);
        while (pm.find()) {
            String comp = pm.group(1);
            String attrs = pm.group(2);
            FieldSpec f = new FieldSpec();
            f.component = comp;
            f.name = matchAttr(attrs, "name");
            f.label = firstNonNull(matchAttr(attrs, "title"), matchAttr(attrs, "label"));
            f.type = "popup";
            f.dependency = matchAttr(attrs, "parent");
            out.add(f);
        }

        return out;
    }

    // ---- Communication (callService + zAxios + Controller mapping) ----

    private List<CallSpec> parseCommunication(String jsx, List<ComposerArtifact> artifacts, SourceTrace trace) {
        List<CallSpec> out = new ArrayList<>();
        if (jsx != null && !jsx.isBlank()) {
            // callService('SRV_FOO', params, 'target')
            Pattern callSrv = Pattern.compile(
                    "callService\\s*\\(\\s*['\"]([A-Za-z_][A-Za-z0-9_]*)['\"]\\s*,\\s*([^,)]*)(?:,\\s*['\"](\\w+)['\"])?");
            Matcher m = callSrv.matcher(jsx);
            while (m.find()) {
                CallSpec c = new CallSpec();
                c.kind = "callService";
                c.url = m.group(1);
                c.params = truncate(m.group(2).trim(), 300);
                c.target = m.group(3);
                c.location = locateContaining(jsx, m.start());
                out.add(c);
            }

            // zAxios.get/post/delete/put/patch('url', ...)
            Pattern zAxiosMethod = Pattern.compile(
                    "zAxios\\.(get|post|delete|put|patch)\\s*\\(\\s*['\"`]([^'\"`]+)['\"`]");
            Matcher mm = zAxiosMethod.matcher(jsx);
            while (mm.find()) {
                CallSpec c = new CallSpec();
                c.kind = mm.group(1).toUpperCase();
                c.url = mm.group(2);
                c.target = "wingui REST";
                c.location = locateContaining(jsx, mm.start());
                out.add(c);
            }

            // zAxios({ method: 'post', url: '...' })
            Pattern zAxiosObj = Pattern.compile(
                    "zAxios\\s*\\(\\s*\\{[^}]*method\\s*:\\s*['\"](\\w+)['\"][^}]*url\\s*:\\s*['\"]([^'\"]+)['\"]",
                    Pattern.DOTALL);
            Matcher mo = zAxiosObj.matcher(jsx);
            while (mo.find()) {
                CallSpec c = new CallSpec();
                c.kind = mo.group(1).toUpperCase();
                c.url = mo.group(2);
                c.target = "wingui REST";
                c.location = locateContaining(jsx, mo.start());
                out.add(c);
            }
        }

        // Java RestController @*Mapping
        for (ComposerArtifact a : artifacts) {
            if (!ComposerArtifact.TYPE_JAVA_CONTROLLER.equals(a.getArtifactType())) continue;
            String src = a.getContent();
            if (src == null) continue;
            Pattern mapping = Pattern.compile(
                    "@(GetMapping|PostMapping|PutMapping|DeleteMapping|RequestMapping)\\s*\\(\\s*(?:value\\s*=\\s*)?['\"]([^'\"]+)['\"]");
            Matcher mm = mapping.matcher(src);
            while (mm.find()) {
                CallSpec c = new CallSpec();
                c.kind = mm.group(1).replace("Mapping", "").toUpperCase();
                c.url = mm.group(2);
                c.target = "Controller (Java)";
                c.location = nvl(a.getFilePath());
                out.add(c);
            }
        }

        // Java Service/Controller/Repository 본문의 실제 SP 호출 — JSX URL 만으로는
        // 안 보였던 SP_UI_* / SP_COMM_* / FN_* 명을 직접 노출시킨다.
        for (ComposerArtifact a : artifacts) {
            String type = a.getArtifactType();
            if (!ComposerArtifact.TYPE_JAVA_SERVICE.equals(type)
                    && !ComposerArtifact.TYPE_JAVA_CONTROLLER.equals(type)
                    && !ComposerArtifact.TYPE_JAVA_REPOSITORY.equals(type)) continue;
            String src = a.getContent();
            if (src == null) continue;
            String fileLabel = nvl(a.getFilePath());
            String layer = type.replace("JAVA_", "");
            Matcher m = SP_REF_RE.matcher(src);
            Set<String> seen = new HashSet<>();
            while (m.find()) {
                String name = m.group(1);
                if (!seen.add(name)) continue;
                CallSpec c = new CallSpec();
                c.kind = "SP via " + layer;
                c.url = name;
                c.target = "Java " + layer.toLowerCase();
                c.location = fileLabel;
                c.params = locateExecLine(src, name);
                out.add(c);
            }
        }

        // 프로젝트 트레이스 — 세션 아티팩트가 부족할 때 (NEW_FROM_COPY 등) 채움
        // controllerFiles 의 @*Mapping 과 serviceFiles 의 SP_UI_* 호출을 추가.
        if (trace != null) {
            Pattern mapping = Pattern.compile(
                    "@(GetMapping|PostMapping|PutMapping|DeleteMapping|RequestMapping)\\s*\\(\\s*(?:value\\s*=\\s*)?['\"]([^'\"]+)['\"]");
            Set<String> existingUrls = new HashSet<>();
            for (CallSpec c : out) if (c.url != null) existingUrls.add(c.kind + "|" + c.url);

            for (String relPath : trace.controllerFiles) {
                String src = trace.javaFiles.get(relPath);
                if (src == null) continue;
                Matcher mm = mapping.matcher(src);
                while (mm.find()) {
                    String kind = mm.group(1).replace("Mapping", "").toUpperCase();
                    String url = mm.group(2);
                    String key = kind + "|" + url;
                    if (existingUrls.add(key)) {
                        CallSpec c = new CallSpec();
                        c.kind = kind;
                        c.url = url;
                        c.target = "Controller (Java · 프로젝트 스캔)";
                        c.location = relPath;
                        out.add(c);
                    }
                }
            }
            for (String relPath : trace.serviceFiles) {
                String src = trace.javaFiles.get(relPath);
                if (src == null) continue;
                Matcher m = SP_REF_RE.matcher(src);
                Set<String> seen = new HashSet<>();
                while (m.find()) {
                    String name = m.group(1);
                    if (!seen.add(name)) continue;
                    CallSpec c = new CallSpec();
                    c.kind = "SP via SERVICE (스캔)";
                    c.url = name;
                    c.target = "Java service";
                    c.location = relPath;
                    c.params = locateExecLine(src, name);
                    out.add(c);
                }
            }
        }
        return out;
    }

    /** Java 본문에서 SP 이름이 등장한 위치 주변의 한 줄 (EXEC SP_X ?, ?) 추출. */
    private String locateExecLine(String src, String spName) {
        int idx = src.indexOf(spName);
        if (idx < 0) return "";
        int qStart = src.lastIndexOf('"', idx);
        int qEnd   = src.indexOf('"', idx + spName.length());
        if (qStart >= 0 && qEnd > qStart) {
            String slice = src.substring(qStart + 1, qEnd).replaceAll("\\s+", " ").trim();
            return truncate(slice, 250);
        }
        // 따옴표 밖 — 호출되는 형태(ctx) 한 줄
        int lineStart = Math.max(0, src.lastIndexOf('\n', idx));
        int lineEnd = src.indexOf('\n', idx);
        if (lineEnd < 0) lineEnd = src.length();
        return truncate(src.substring(lineStart, lineEnd).trim(), 250);
    }

    private String locateContaining(String src, int idx) {
        int back = Math.max(0, idx - 400);
        String window = src.substring(back, idx);
        Matcher fn = Pattern.compile(
                "(?:const|let|function)\\s+(\\w+)\\s*=?\\s*(?:\\([^)]*\\))?\\s*(?:=>)?",
                Pattern.DOTALL).matcher(window);
        String last = null;
        while (fn.find()) last = fn.group(1);
        return last == null ? "" : last;
    }

    // ---- Procedures ----

    private List<ProcedureSpec> parseProcedures(List<ComposerArtifact> artifacts, SourceTrace trace) {
        List<ProcedureSpec> out = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        for (ComposerArtifact a : artifacts) {
            if (!ComposerArtifact.TYPE_SQL_SP.equals(a.getArtifactType())) continue;
            ProcedureSpec p = new ProcedureSpec();
            String content = a.getContent();
            p.name = extractProcedureName(content);
            p.type = suffixFromName(p.name);
            p.params = extractProcedureParams(content);
            out.add(p);
            if (!isBlank(p.name)) seen.add(p.name);
        }
        // 프로젝트 트레이스에서 발견된 SP DDL 도 함께 추가
        if (trace != null) {
            for (Map.Entry<String, String> e : trace.spSources.entrySet()) {
                if (!seen.add(e.getKey())) continue;
                ProcedureSpec p = new ProcedureSpec();
                p.name = e.getKey();
                p.type = suffixFromName(e.getKey());
                p.params = extractProcedureParams(e.getValue());
                out.add(p);
            }
        }
        return out;
    }

    // ============================================================
    // Project source trace — JSX 의 zAxios URL → Controller → Service → SP → Table
    // NEW_FROM_COPY 등 세션 아티팩트가 JSX·MENU_SQL 만일 때 프로젝트 파일을 스캔.
    // ============================================================

    private static final int MAX_JAVA_FILES = 4000;
    private static final Pattern SP_REF_RE = Pattern.compile(
            "\\b(SP_UI_[A-Z][A-Z0-9_]+|SP_COMM_[A-Z][A-Z0-9_]+|FN_[A-Z][A-Z0-9_]+)\\b");
    private static final Pattern TABLE_VIEW_REF_RE = Pattern.compile(
            "\\b(TB_[A-Z][A-Z0-9_]+|tb_is_[a-z][a-z0-9_]+|VW_[A-Z][A-Z0-9_]+)\\b");
    private static final Pattern ZAXIOS_RE = Pattern.compile(
            "zAxios\\.(?:get|post|delete|put|patch)\\s*\\(\\s*['\"`]([^'\"`]+)['\"`]");
    private static final Pattern ZAXIOS_OBJ_RE = Pattern.compile(
            "zAxios\\s*\\(\\s*\\{[^}]*url\\s*:\\s*['\"]([^'\"]+)['\"]", Pattern.DOTALL);
    private static final Pattern SERVICE_FIELD_RE = Pattern.compile(
            "private\\s+(?:final\\s+)?(\\w+(?:Service|Repository))\\b");

    private SourceTrace traceFromProjectRoot(String jsx) {
        SourceTrace trace = new SourceTrace();
        if (jsx == null || jsx.isBlank()) return trace;

        String root = props == null || props.getComposer() == null
                ? null : props.getComposer().getProjectRoot();
        if (isBlank(root)) {
            trace.note = "(app.composer.project-root 미설정 — 프로젝트 스캔 생략)";
            return trace;
        }

        Path javaRoot = Paths.get(root, "t3series-wingui", "src", "main", "java");
        if (!Files.isDirectory(javaRoot)) {
            trace.note = "(Java 소스 루트 미존재: " + javaRoot + ")";
            return trace;
        }

        // 1) JSX 에서 zAxios URL 추출
        Set<String> urls = new LinkedHashSet<>();
        Matcher m1 = ZAXIOS_RE.matcher(jsx);
        while (m1.find()) urls.add(m1.group(1));
        Matcher m2 = ZAXIOS_OBJ_RE.matcher(jsx);
        while (m2.find()) urls.add(m2.group(1));

        if (urls.isEmpty()) {
            trace.note = "(JSX 에 zAxios URL 없음 — 트레이스 생략)";
            return trace;
        }

        // 2) Java Controller 파일 스캔 — 매칭되는 @*Mapping 가진 컨트롤러 수집
        List<Path> javaFiles = listJavaFiles(javaRoot);
        Set<String> serviceClasses = new LinkedHashSet<>();
        for (Path f : javaFiles) {
            String name = f.getFileName().toString();
            if (!name.endsWith("Controller.java")) continue;
            String src = readFileSafe(f);
            if (src == null) continue;
            boolean matched = false;
            for (String url : urls) {
                if (containsMappingForUrl(src, url)) { matched = true; break; }
            }
            if (!matched) continue;
            String relPath = relativize(root, f);
            trace.javaFiles.put(relPath, src);
            trace.controllerFiles.add(relPath);
            // Service 필드 수집
            Matcher fm = SERVICE_FIELD_RE.matcher(src);
            while (fm.find()) serviceClasses.add(fm.group(1));
            // SP / Table 패턴 수집
            extractSpAndTables(src, trace);
        }

        // 3) Service / Repository 파일 — Controller 가 참조하는 클래스
        if (!serviceClasses.isEmpty()) {
            for (Path f : javaFiles) {
                String fileName = f.getFileName().toString().replace(".java", "");
                if (!serviceClasses.contains(fileName)) continue;
                String src = readFileSafe(f);
                if (src == null) continue;
                String relPath = relativize(root, f);
                trace.javaFiles.put(relPath, src);
                trace.serviceFiles.add(relPath);
                extractSpAndTables(src, trace);
            }
        }

        // 4) 발견된 SP 들의 DDL 파일 — t3series-database 트리 검색
        if (!trace.spNames.isEmpty()) {
            Path sqlRoot = Paths.get(root, "t3series-database");
            if (Files.isDirectory(sqlRoot)) {
                List<Path> sqlFiles = listSqlFiles(sqlRoot);
                for (Path f : sqlFiles) {
                    String fileName = f.getFileName().toString();
                    String fnNoExt = fileName.replace(".sql", "");
                    if (!trace.spNames.contains(fnNoExt)) continue;
                    String src = readFileSafe(f);
                    if (src == null) continue;
                    trace.spSources.put(fnNoExt, src);
                    // SP 본문에서 추가 SP/Table 패턴
                    extractSpAndTables(src, trace);
                }
            }
        }
        return trace;
    }

    /** Controller 의 @*Mapping path 가 url 과 일치하는지 확인. */
    private boolean containsMappingForUrl(String controllerSrc, String url) {
        if (controllerSrc == null || url == null) return false;
        // path 는 leading slash 있을 수도 없을 수도. 양쪽 모두 매칭.
        String norm = url.startsWith("/") ? url.substring(1) : url;
        return controllerSrc.contains("\"" + norm + "\"")
                || controllerSrc.contains("\"/" + norm + "\"");
    }

    private void extractSpAndTables(String src, SourceTrace trace) {
        Matcher sm = SP_REF_RE.matcher(src);
        while (sm.find()) trace.spNames.add(sm.group(1));
        Matcher tm = TABLE_VIEW_REF_RE.matcher(src);
        while (tm.find()) trace.tableNames.add(tm.group(1));
    }

    private List<Path> listJavaFiles(Path root) {
        List<Path> out = new ArrayList<>();
        try (Stream<Path> walk = Files.walk(root)) {
            walk.filter(p -> p.toString().endsWith(".java"))
                .limit(MAX_JAVA_FILES)
                .forEach(out::add);
        } catch (IOException e) {
            log.warn("Java 트리 스캔 실패: {}", e.getMessage());
        }
        return out;
    }

    private List<Path> listSqlFiles(Path root) {
        List<Path> out = new ArrayList<>();
        try (Stream<Path> walk = Files.walk(root)) {
            walk.filter(p -> p.toString().endsWith(".sql"))
                .limit(MAX_JAVA_FILES)
                .forEach(out::add);
        } catch (IOException e) {
            log.warn("SQL 트리 스캔 실패: {}", e.getMessage());
        }
        return out;
    }

    private String readFileSafe(Path p) {
        try { return Files.readString(p, StandardCharsets.UTF_8); }
        catch (Exception e) { return null; }
    }

    private String relativize(String root, Path f) {
        try { return Paths.get(root).relativize(f).toString().replace('\\', '/'); }
        catch (Exception e) { return f.toString(); }
    }

    private static class SourceTrace {
        final Set<String> spNames    = new LinkedHashSet<>();
        final Set<String> tableNames = new LinkedHashSet<>();
        final Map<String, String> spSources = new LinkedHashMap<>();   // SP 명 → DDL 본문
        final Map<String, String> javaFiles = new LinkedHashMap<>();   // 상대 경로 → 본문
        final List<String> controllerFiles = new ArrayList<>();
        final List<String> serviceFiles    = new ArrayList<>();
        String note;
    }

    // ============================================================
    // Helpers — text / cell / regex
    // ============================================================

    private static int findMatching(String s, int start, char open, char close) {
        int depth = 0;
        boolean inStr = false;
        char quote = 0;
        for (int i = start; i < s.length(); i++) {
            char c = s.charAt(i);
            if (inStr) {
                if (c == '\\' && i + 1 < s.length()) { i++; continue; }
                if (c == quote) inStr = false;
                continue;
            }
            if (c == '\'' || c == '"' || c == '`') { inStr = true; quote = c; continue; }
            if (c == open) depth++;
            else if (c == close) {
                depth--;
                if (depth == 0) return i;
            }
        }
        return -1;
    }

    private String matchAttr(String attrs, String name) {
        if (attrs == null) return null;
        Pattern p = Pattern.compile("\\b" + Pattern.quote(name) + "\\s*=\\s*([\"'])([^\"']*)\\1");
        Matcher m = p.matcher(attrs);
        return m.find() ? m.group(2) : null;
    }

    private String matchAttrExpr(String attrs, String name) {
        if (attrs == null) return null;
        Pattern p = Pattern.compile("\\b" + Pattern.quote(name) + "\\s*=\\s*\\{");
        Matcher m = p.matcher(attrs);
        if (!m.find()) return null;
        int start = m.end();
        int depth = 1;
        for (int j = start; j < attrs.length(); j++) {
            char c = attrs.charAt(j);
            if (c == '{') depth++;
            else if (c == '}') {
                depth--;
                if (depth == 0) return attrs.substring(start, j).trim();
            }
        }
        return null;
    }

    private static String unquote(String v) {
        if (v == null) return null;
        v = v.trim();
        if (v.length() >= 2) {
            char a = v.charAt(0), b = v.charAt(v.length() - 1);
            if ((a == '\'' && b == '\'') || (a == '"' && b == '"')) {
                return v.substring(1, v.length() - 1);
            }
        }
        return v;
    }

    private static boolean isBlank(String v) { return v == null || v.isBlank(); }

    private static String firstNonNull(String a, String b) {
        return (a != null && !a.isBlank()) ? a : b;
    }

    private static String optionsSummary(FieldSpec f) {
        StringBuilder sb = new StringBuilder();
        if (!isBlank(f.groupCd)) sb.append("groupCd=").append(f.groupCd);
        if (!isBlank(f.options)) {
            if (sb.length() > 0) sb.append("; ");
            sb.append("options=").append(truncate(f.options, 200));
        }
        return sb.toString();
    }

    private static String formatSummary(ColumnSpec c) {
        StringBuilder sb = new StringBuilder();
        if (!isBlank(c.displayType))    sb.append("displayType=").append(c.displayType);
        if (!isBlank(c.datetimeFormat)) {
            if (sb.length() > 0) sb.append("; ");
            sb.append("datetimeFormat=").append(c.datetimeFormat);
        }
        if (!isBlank(c.numberFormat)) {
            if (sb.length() > 0) sb.append("; ");
            sb.append("numberFormat=").append(c.numberFormat);
        }
        return sb.toString();
    }

    private static String dropdownSummary(ColumnSpec c) {
        if (!"true".equalsIgnoreCase(c.useDropdown)
                && isBlank(c.values) && isBlank(c.labels)) return "";
        StringBuilder sb = new StringBuilder();
        if ("true".equalsIgnoreCase(c.useDropdown)) sb.append("useDropdown=true");
        if ("true".equalsIgnoreCase(c.lookupDisplay)) {
            if (sb.length() > 0) sb.append("; ");
            sb.append("lookupDisplay=true");
        }
        if (!isBlank(c.values)) {
            if (sb.length() > 0) sb.append("; ");
            sb.append("values=").append(truncate(c.values, 200));
        }
        if (!isBlank(c.labels)) {
            if (sb.length() > 0) sb.append("; ");
            sb.append("labels=").append(truncate(c.labels, 200));
        }
        return sb.toString();
    }

    private static String columnExtras(ColumnSpec c) {
        StringBuilder sb = new StringBuilder();
        if (!isBlank(c.defaultValue)) sb.append("default=").append(c.defaultValue);
        if (!isBlank(c.visible) && !"true".equalsIgnoreCase(c.visible)) {
            if (sb.length() > 0) sb.append("; ");
            sb.append("visible=").append(c.visible);
        }
        if (!isBlank(c.comment)) {
            if (sb.length() > 0) sb.append("; ");
            sb.append(c.comment);
        }
        return sb.toString();
    }

    private static String validatorSummary(ColumnSpec c) {
        StringBuilder sb = new StringBuilder();
        if (!isBlank(c.validRules)) sb.append("validRules=").append(truncate(c.validRules, 200));
        if (!isBlank(c.editor)) {
            if (sb.length() > 0) sb.append("; ");
            sb.append("editor=").append(truncate(c.editor, 200));
        }
        if (!isBlank(c.button)) {
            if (sb.length() > 0) sb.append("; ");
            sb.append("button=").append(c.button);
            if (!isBlank(c.buttonVisibility)) sb.append(" (").append(c.buttonVisibility).append(")");
        }
        return sb.toString();
    }

    private static String truncate(String s, int max) {
        if (s == null) return "";
        if (s.length() <= max) return s;
        return s.substring(0, max - 3) + "...";
    }

    private static String buttonRole(String name) {
        if (name == null) return "";
        if (name.contains("Add")) return "행 추가";
        if (name.contains("Delete") || name.contains("Del")) return "행 삭제";
        if (name.contains("Save")) return "저장";
        if (name.contains("ExcelExport")) return "엑셀 다운로드";
        if (name.contains("ExcelImport")) return "엑셀 업로드";
        if (name.contains("LargeExcel")) return "대용량 엑셀";
        if (name.contains("Cnt")) return "행 수 카운터";
        return "";
    }

    private static String indent(int level) {
        if (level <= 0) return "";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < level; i++) sb.append("  ");
        return sb.toString();
    }

    // ---- Sheet primitive helpers ----

    private void writeHeaderRow(XSSFSheet sh, int rowIdx, CellStyle style, String... headers) {
        Row r = sh.createRow(rowIdx);
        for (int i = 0; i < headers.length; i++) setCell(r, i, style, headers[i]);
    }

    private int writeKeyValue(XSSFSheet sh, Styles s, int rowIdx, String key, String value) {
        Row r = sh.createRow(rowIdx);
        setCell(r, 0, s.headerStyle, key);
        setCell(r, 1, s.cellStyle, value);
        return rowIdx + 1;
    }

    private int writeSectionTitle(XSSFSheet sh, int rowIdx, Styles s, String title) {
        Row r = sh.createRow(rowIdx);
        setCell(r, 0, s.sectionStyle, title);
        return rowIdx + 1;
    }

    /** Section 제목 — col 0 폭이 좁아 잘리는 문제를 피하기 위해 cols 0..(spanCols-1) 를 머지. */
    private int writeSectionTitle(XSSFSheet sh, int rowIdx, Styles s, String title, int spanCols) {
        Row r = sh.createRow(rowIdx);
        setCell(r, 0, s.sectionStyle, title);
        if (spanCols > 1) {
            for (int i = 1; i < spanCols; i++) setCell(r, i, s.sectionStyle, "");
            sh.addMergedRegion(new CellRangeAddress(rowIdx, rowIdx, 0, spanCols - 1));
        }
        return rowIdx + 1;
    }

    private void setCell(Row row, int col, CellStyle style, String value) {
        Cell c = row.createCell(col);
        c.setCellValue(value == null ? "" : value);
        if (style != null) c.setCellStyle(style);
    }

    private String firstContentByType(List<ComposerArtifact> list, String type) {
        return list.stream()
                .filter(a -> type.equals(a.getArtifactType()))
                .map(ComposerArtifact::getContent)
                .filter(c -> c != null && !c.isBlank())
                .findFirst().orElse("");
    }

    private List<ComposerArtifact> artifactsByType(List<ComposerArtifact> list, String type) {
        return list.stream().filter(a -> type.equals(a.getArtifactType())).toList();
    }

    // ---- CREATE TABLE / SP parsers (kept) ----

    private static final Pattern CREATE_TABLE_RE = Pattern.compile(
            "CREATE\\s+TABLE\\s+(?:\\[?\\w+\\]?\\.)*(\\[?\\w+\\]?)\\s*\\(([^;]+?)\\)\\s*;",
            Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
    private static final Pattern COLUMN_RE = Pattern.compile(
            "^\\s*(\\[?\\w+\\]?)\\s+([A-Z0-9_]+(?:\\s*\\([^)]+\\))?)\\s*(NOT\\s+NULL|NULL)?(.*)$",
            Pattern.CASE_INSENSITIVE);

    private static final Pattern PROC_NAME_RE = Pattern.compile(
            "CREATE\\s+(?:OR\\s+ALTER\\s+)?PROCEDURE\\s+(?:\\[?\\w+\\]?\\.)*(\\[?[A-Z0-9_]+\\]?)",
            Pattern.CASE_INSENSITIVE);
    /**
     * SP 파라미터 추출 — 두 가지 SQL 스타일 모두 지원:
     *   (A) CREATE PROCEDURE name ( @P TYPE = NULL, @Q TYPE ) AS  ← 괄호 감싸기
     *   (B) CREATE PROCEDURE name @P TYPE = NULL, @Q TYPE AS       ← T-SQL 표준
     * AS 키워드까지 전체를 캡처한 뒤 좌우 괄호 제거.
     */
    private static final Pattern PROC_PARAMS_RE = Pattern.compile(
            "CREATE\\s+(?:OR\\s+ALTER\\s+)?PROCEDURE\\s+(?:\\[?\\w+\\]?\\.)*\\[?[A-Z0-9_]+\\]?\\s*([\\s\\S]*?)\\bAS\\b",
            Pattern.CASE_INSENSITIVE);

    private String extractProcedureName(String sp) {
        if (sp == null) return "";
        Matcher m = PROC_NAME_RE.matcher(sp);
        return m.find() ? m.group(1).replaceAll("[\\[\\]]", "") : "";
    }

    private String extractProcedureParams(String sp) {
        if (sp == null) return "";
        Matcher m = PROC_PARAMS_RE.matcher(sp);
        if (!m.find()) return "";
        String body = m.group(1).trim();
        if (body.startsWith("(") && body.endsWith(")")) {
            body = body.substring(1, body.length() - 1).trim();
        }
        return truncate(body.replaceAll("\\s+", " ").trim(), 500);
    }

    private String suffixFromName(String name) {
        if (name == null) return "";
        if (name.contains("POP"))   return "Popup";
        if (name.contains("CHART")) return "Chart";
        if (name.contains("BATCH")) return "Batch";
        if (name.matches(".*_Q\\d*$")) return "Query";
        if (name.matches(".*_S\\d*$")) return "Save";
        if (name.matches(".*_D\\d*$")) return "Delete";
        return "SP";
    }

    // ---- Session 필드 추출 (kept) ----

    private String extractScreenId(ComposerSession s, List<ComposerArtifact> artifacts) {
        if (s.getTargetMenuCd() != null && !s.getTargetMenuCd().isBlank()) return s.getTargetMenuCd();
        String path = artifacts.stream()
                .filter(a -> ComposerArtifact.TYPE_SCREEN_JSX.equals(a.getArtifactType()))
                .map(ComposerArtifact::getFilePath)
                .filter(p -> p != null && !p.isBlank())
                .findFirst().orElse("");
        if (!path.isBlank()) {
            int idx = path.lastIndexOf('/');
            if (idx >= 0) {
                String name = path.substring(idx + 1).replace(".jsx", "");
                return "UI_" + name.toUpperCase();
            }
        }
        return "";
    }

    private String extractScreenName(ComposerSession s, List<ComposerArtifact> artifacts) {
        return nvl(s.getTitle());
    }

    private static final Pattern MENU_PARENT_RE = Pattern.compile(
            "MENU_CD\\s*=\\s*N?'([A-Z0-9_]+)'", Pattern.CASE_INSENSITIVE);

    private String extractMenuParent(List<ComposerArtifact> artifacts) {
        String sql = firstContentByType(artifacts, ComposerArtifact.TYPE_MENU_SQL);
        if (sql.isBlank()) return "";
        Matcher m = MENU_PARENT_RE.matcher(sql);
        return m.find() ? m.group(1) : "";
    }

    private String extractMenuPath(List<ComposerArtifact> artifacts) {
        String sql = firstContentByType(artifacts, ComposerArtifact.TYPE_MENU_SQL);
        if (sql.isBlank()) return "";
        Matcher m = Pattern.compile("'(/[a-zA-Z0-9_/-]+)'").matcher(sql);
        return m.find() ? m.group(1) : "";
    }

    private String nvl(String v) { return v == null ? "" : v; }

    // ============================================================
    // DTOs (private static)
    // ============================================================

    private static class TagOccurrence {
        final String tag;
        final boolean isClose;
        final boolean selfClosing;
        final String attrs;
        TagOccurrence(String tag, boolean isClose, boolean selfClosing, String attrs) {
            this.tag = tag; this.isClose = isClose; this.selfClosing = selfClosing;
            this.attrs = attrs;
        }
    }

    private static class StackEntry {
        final String tag;
        final String attrs;
        final int childIdx;
        int nextChildIdx;
        StackEntry(String tag, String attrs, int childIdx) {
            this.tag = tag; this.attrs = attrs; this.childIdx = childIdx; this.nextChildIdx = 0;
        }
    }

    private static class LayoutInfo {
        String orientation;
        String orientationLabel;
        List<GridLocation> grids = new ArrayList<>();
        List<TabSpec> tabs = new ArrayList<>();
        List<LayoutNode> tree = new ArrayList<>();
        List<String> notes = new ArrayList<>();
    }

    private static class GridLocation {
        final int n;
        final String id;
        final String position;
        final String itemsVar;
        final String parent;
        GridLocation(int n, String id, String position, String itemsVar, String parent) {
            this.n = n; this.id = id; this.position = position;
            this.itemsVar = itemsVar; this.parent = parent;
        }
    }

    private static class TabSpec {
        String value, label;
    }

    private static class LayoutNode {
        final int level;
        final String tag, role, idOrVar, props;
        LayoutNode(int level, String tag, String role, String idOrVar, String props) {
            this.level = level; this.tag = tag; this.role = role;
            this.idOrVar = idOrVar; this.props = props;
        }
    }

    private static class GridSpec {
        String id;
        String varName;
        String position;
        String sheetName;
        List<ColumnSpec> columns = new ArrayList<>();
        List<String> buttonsHint = new ArrayList<>();
    }

    private static class ColumnSpec {
        String name, fieldName, headerText;
        String dataType, displayType;
        String width, editable, visible, textAlignment;
        String useDropdown, lookupDisplay;
        String values, labels;
        String datetimeFormat, numberFormat;
        String validRules, editor;
        String defaultValue;
        String comment;
        String button, buttonVisibility;
    }

    private static class FieldSpec {
        String name, label, type, langKey, defaultValue;
        String component;
        String groupCd;
        String options;
        String required;
        String dependency;
    }

    private static class CallSpec {
        String kind;
        String url;
        String params;
        String target;
        String location;
    }

    private static class ProcedureSpec {
        String name, type, params;
    }

    private static class TableSpec {
        final String name;
        boolean fromDdl;
        boolean fromEntity;
        boolean fromJsx;
        boolean fromProjectScan;
        final Set<String> spReferences = new LinkedHashSet<>();
        final List<TableColumn> columns = new ArrayList<>();
        TableSpec(String name) { this.name = name; }
        String sourceLabel() {
            List<String> parts = new ArrayList<>();
            if (fromDdl) parts.add("DDL (신규)");
            if (fromEntity) parts.add("Entity 매핑");
            if (!spReferences.isEmpty()) parts.add("SP 참조: " + String.join(",", spReferences));
            if (fromJsx) parts.add("JSX 참조");
            if (fromProjectScan) parts.add("프로젝트 스캔");
            return parts.isEmpty() ? "(미상)" : String.join(" / ", parts);
        }
    }

    private static class TableColumn {
        String colId;
        String colName;
        String typeLen;
        String key;
        String notNull;
        String defaultValue;
        String comment;
    }

    // ============================================================
    // Styles
    // ============================================================

    private static class Styles {
        final CellStyle headerStyle;
        final CellStyle cellStyle;
        final CellStyle sectionStyle;

        Styles(Workbook wb) {
            Font headerFont = wb.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());

            headerStyle = wb.createCellStyle();
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            setAllBorders(headerStyle);

            cellStyle = wb.createCellStyle();
            cellStyle.setAlignment(HorizontalAlignment.LEFT);
            cellStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            cellStyle.setWrapText(true);
            setAllBorders(cellStyle);

            Font sectionFont = wb.createFont();
            sectionFont.setBold(true);
            sectionStyle = wb.createCellStyle();
            sectionStyle.setFont(sectionFont);
            sectionStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            sectionStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            sectionStyle.setAlignment(HorizontalAlignment.LEFT);
            sectionStyle.setVerticalAlignment(VerticalAlignment.CENTER);
        }

        private void setAllBorders(CellStyle s) {
            s.setBorderTop(BorderStyle.THIN);
            s.setBorderBottom(BorderStyle.THIN);
            s.setBorderLeft(BorderStyle.THIN);
            s.setBorderRight(BorderStyle.THIN);
        }
    }
}
