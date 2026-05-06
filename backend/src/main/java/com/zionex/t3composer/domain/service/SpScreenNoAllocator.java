package com.zionex.t3composer.domain.service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Composer 가 신규 화면을 생성할 때 SP 이름이 기존 SP 와 충돌하지 않도록
 * 도메인별로 다음으로 사용 가능한 SCREEN_NO 를 DB 에서 미리 조회해 LLM prompt 에 주입.
 *
 * 사용처:
 *  1) ComposerPromptBuilder — system prompt 에 "도메인별 권장 SCREEN_NO" 섹션 추가
 *  2) ArtifactApplyService — apply 직전 SP 이름 충돌 검증 (sys.procedures 존재 여부)
 *
 * 사고 사례 (2026-04-29):
 *  - LLM 이 SCREEN_NO 를 "01" 로 무작정 결정 → 기존 SP_UI_UT_01_Q1 등이 CREATE OR ALTER 로 덮어써짐
 *  - 다른 화면(사용자정보 관리)이 사용 중인 SP 가 비즈니스 로직째 교체되어 동작 불능
 *
 * 정책:
 *  - DOMAIN ∈ {AD, BF, CM, COMM, DP, DPD, FO, FP, IM, MP, RP, SA, SALES, SO, UT}
 *  - 각 DOMAIN 의 기존 SP_UI_<DOMAIN>_<NN>_* 패턴에서 NN(2~3자리 숫자) 을 추출,
 *    max(NN)+1 을 다음 권장값으로 반환. 빈 도메인은 1.
 *  - sys.procedures 조회 실패 시 도메인별 99 번대 후반 (예: 99) 권장으로 fallback —
 *    충돌 위험은 있으나 system prompt 미생성보다는 낫다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SpScreenNoAllocator {

    private final JdbcTemplate jdbcTemplate;

    /** 표준 도메인 코드 — rules/31-stored-procedures.md §1.2 의 분포 + Composer 가 사용하는 도메인 전체 */
    private static final List<String> KNOWN_DOMAINS = List.of(
            "AD", "BF", "CM", "DP", "DPD", "FO", "FP",
            "IM", "MP", "RP", "SA", "SO", "UT"
    );

    /** SP 이름에서 SCREEN_NO 추출 — 숫자 SCREEN_NO 만 대상 (POP_/CHART_/BATCH 등 분류 ACTION 은 제외) */
    private static final Pattern SCREEN_NO_PATTERN =
            Pattern.compile("^SP_UI_([A-Z]+)_(\\d{1,3})_[A-Z]", Pattern.CASE_INSENSITIVE);

    /**
     * 도메인별로 다음 사용 가능한 SCREEN_NO 를 조회.
     * 결과 순서는 KNOWN_DOMAINS 순서 유지 (LLM prompt 에서 가독성 보장).
     */
    public Map<String, Integer> nextAvailableScreenNoByDomain() {
        Map<String, Integer> result = new LinkedHashMap<>();
        Map<String, Integer> currentMax = new LinkedHashMap<>();
        for (String d : KNOWN_DOMAINS) currentMax.put(d, 0);

        try {
            // sys.procedures 또는 INFORMATION_SCHEMA.ROUTINES 둘 다 가능. INFORMATION_SCHEMA 가 표준.
            List<String> spNames = jdbcTemplate.queryForList(
                    "SELECT ROUTINE_NAME FROM INFORMATION_SCHEMA.ROUTINES" +
                    " WHERE ROUTINE_TYPE = 'PROCEDURE'" +
                    "   AND ROUTINE_NAME LIKE 'SP_UI_%'",
                    String.class);
            for (String name : spNames) {
                if (name == null) continue;
                Matcher m = SCREEN_NO_PATTERN.matcher(name.toUpperCase());
                if (!m.find()) continue;
                String dom = m.group(1).toUpperCase();
                if (!currentMax.containsKey(dom)) continue;
                int no;
                try { no = Integer.parseInt(m.group(2)); }
                catch (NumberFormatException e) { continue; }
                if (no > currentMax.get(dom)) currentMax.put(dom, no);
            }
            for (String d : KNOWN_DOMAINS) {
                int nextNo = currentMax.get(d) + 1;
                // SCREEN_NO 는 최소 2자리 — Composer 관례상 1, 2 보다 01, 02 가 자연스러움
                result.put(d, nextNo);
            }
            return result;
        } catch (DataAccessException e) {
            log.warn("SpScreenNoAllocator: INFORMATION_SCHEMA.ROUTINES 조회 실패 — fallback 99 반환. err={}",
                    e.getMessage());
            for (String d : KNOWN_DOMAINS) result.put(d, 99);
            return result;
        }
    }

    /**
     * 단일 SP 이름이 DB 에 이미 존재하는지 조회.
     * apply 직전 충돌 검증용.
     *
     * @param spName 예: SP_UI_UT_01_Q1
     * @return true = 이미 존재 (충돌 위험)
     */
    public boolean spNameExists(String spName) {
        if (spName == null || spName.isBlank()) return false;
        if (!spName.toUpperCase().startsWith("SP_") && !spName.toUpperCase().startsWith("FN_")) {
            return false;
        }
        try {
            Integer cnt = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM INFORMATION_SCHEMA.ROUTINES" +
                    " WHERE ROUTINE_TYPE IN ('PROCEDURE', 'FUNCTION')" +
                    "   AND ROUTINE_NAME = ?",
                    Integer.class, spName);
            return cnt != null && cnt > 0;
        } catch (DataAccessException e) {
            log.warn("SpScreenNoAllocator: SP 존재 여부 조회 실패 spName={} err={}", spName, e.getMessage());
            return false;
        }
    }

    /**
     * Prompt 에 삽입할 가독성 좋은 텍스트 블록.
     *
     * 정책 (2026-04-29 변경): 신규 SP 는 **SCREEN_NAME 기반 네이밍을 우선**으로 추천.
     *  · 1순위: SP_UI_<DOMAIN>_<SCREEN_NAME>_<ACTION>  (예: SP_UI_UT_USERINFO_Q1)
     *  · 2순위: SP_UI_<DOMAIN>_<NN>_<ACTION>           (예: SP_UI_UT_05_Q1)  — 레거시 화면과 짝 맞춤이 필요할 때만
     *
     * 이유:
     *  · SCREEN_NAME 은 화면 단위로 unique → 충돌 본질적으로 방지
     *  · 가독성 ('USERINFO' 가 '05' 보다 의미 즉시 식별)
     *  · 신규 화면 추가 시 다른 화면의 SCREEN_NO 를 고려할 필요 없음
     *
     * NN 표는 레거시 호환 + collision 회피용 fallback 으로 유지.
     */
    public String buildPromptHint() {
        Map<String, Integer> next = nextAvailableScreenNoByDomain();
        StringBuilder sb = new StringBuilder();
        sb.append("=== SP 네이밍 가이드 (충돌 방지 · 2026-04-29 정책) ===\n");
        sb.append("\n");
        sb.append("★ 1순위 — SCREEN_NAME 기반 네이밍 (강력 권장):\n");
        sb.append("  형식 : SP_UI_<DOMAIN>_<SCREEN_NAME>_<ACTION>\n");
        sb.append("  SCREEN_NAME = MENU_CD 의 도메인 prefix 제외한 본체 (예: UI_UT_USER_INFO_MGMT → USER_INFO_MGMT 또는 USERINFO)\n");
        sb.append("  예시:\n");
        sb.append("    · UI_UT_USER_INFO_MGMT      → SP_UI_UT_USER_INFO_MGMT_Q1 / _S1 / _D1\n");
        sb.append("    · UI_UT_ISSUE_MGMT          → SP_UI_UT_ISSUE_MGMT_Q1 / _S1 / _D1\n");
        sb.append("    · UI_AD_USERS               → SP_UI_AD_USERS_Q1 / _S1 / _D1\n");
        sb.append("    · UI_BF_FORECAST_ACCURACY   → SP_UI_BF_FORECAST_ACCURACY_Q1 / _CHART_Q1\n");
        sb.append("\n");
        sb.append("  이유:\n");
        sb.append("    1) SCREEN_NAME 은 화면 단위로 unique → 다른 화면 SP 와 충돌 본질적으로 불가\n");
        sb.append("    2) SP 이름만 봐도 어느 화면 소속인지 즉시 식별\n");
        sb.append("    3) 신규 화면 추가 시 다른 도메인의 SCREEN_NO 를 고려할 필요 없음\n");
        sb.append("\n");
        sb.append("  rules/31-stored-procedures.md §1.1 의 'SP_UI_<DOMAIN>_<FEATURE_NAME>' 패턴을 적극 활용.\n");
        sb.append("\n");
        sb.append("─────────────────────────────────────────────────────────────────\n");
        sb.append("\n");
        sb.append("△ 2순위 — 숫자 SCREEN_NO 기반 (레거시 호환 시에만):\n");
        sb.append("  형식: SP_UI_<DOMAIN>_<NN>_<ACTION>\n");
        sb.append("  사용 시점: 기존 화면의 SP 를 ALTER 하거나, 같은 도메인의 형제 화면들이 NN 체계를 쓰고 있을 때\n");
        sb.append("\n");
        sb.append("  도메인별 권장 NN (DB 의 INFORMATION_SCHEMA.ROUTINES 의 max(NN)+1):\n");
        for (Map.Entry<String, Integer> e : next.entrySet()) {
            sb.append(String.format("    · %-5s → %02d (또는 그 이후 미사용)%n",
                    e.getKey(), e.getValue()));
        }
        sb.append("\n");
        sb.append("─────────────────────────────────────────────────────────────────\n");
        sb.append("\n");
        sb.append("공통 규약:\n");
        sb.append("  · ACTION: Q1 (조회) · S1 (저장) · D1 (삭제) — CRUD 액션마다 1개씩 (read-only 면 _Q1 만 OK)\n");
        sb.append("  · POPUP: SP_UI_<DOMAIN>_<SCREEN_NAME>_POP_Q1 · CHART: _CHART_Q1\n");
        sb.append("  · 한 화면의 모든 SP 는 동일한 SCREEN_NAME(또는 NN) 을 공유\n");
        sb.append("    예: SP_UI_UT_USER_INFO_MGMT_Q1 / _S1 / _D1 / _POP_DEPT_Q1\n");
        sb.append("  · ❌ 절대 금지: 다른 화면이 쓰는 기존 SP 이름 재사용 (CREATE OR ALTER 로 덮어쓰기 위험)\n");
        sb.append("    · 의심되면 SCREEN_NAME 에 _V2 등 suffix 를 붙여 unique 보장\n");
        sb.append("    · apply 시 DB 에 동일 SP 가 이미 존재하면 자동 차단됨\n");
        return sb.toString();
    }
}
