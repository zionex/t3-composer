package com.zionex.t3composer.domain.schema;

/**
 * 테이블 / SP 이름에서 도메인 키를 도출한다 — 별자리 맵의 "은하" 그룹핑 단일 기준.
 *
 *   TB_FP_WO            → FP    (TB_ 다음 토큰)
 *   TB_IS_QAPATTERN     → IS
 *   SP_UI_CM_ITEM_MST_Q → CM    (SP_UI_ 다음 토큰)
 *   SP_COMM_RAISE_ERR   → COMM  (SP_ 다음 토큰)
 *   FN_G_ACCT_FILTER    → G     (FN_ 다음 토큰)
 *   QRTZ_LOCKS          → QRTZ  (접두어 규약 없음 → 첫 토큰)
 *   VW_DEMAND_PLAN      → VW
 *
 * 테이블(TB_FP_*)과 SP(SP_UI_FP_*)가 같은 도메인 키 "FP" 로 매핑되어
 * 동일 은하에 모인다.
 */
public final class SchemaNaming {

    public static final String UNKNOWN = "ETC";

    private SchemaNaming() {}

    /** 객체명 → 도메인 키 (대문자). */
    public static String domainOf(String name) {
        if (name == null || name.isBlank()) return UNKNOWN;
        String[] p = name.toUpperCase().split("_");
        if (p.length >= 3 && "TB".equals(p[0])) return p[1];
        if (p.length >= 4 && "SP".equals(p[0]) && "UI".equals(p[1])) return p[2];
        if (p.length >= 3 && "SP".equals(p[0])) return p[1];
        if (p.length >= 3 && "FN".equals(p[0])) return p[1];
        if (p.length >= 2) return p[0];
        return p.length == 1 ? p[0] : UNKNOWN;
    }
}
