package com.zionex.t3composer.domain.schema;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 한 도메인(은하)의 서브 그래프 — Data Source 별자리 맵이 도메인 확장 시 받는 nodes/edges.
 *
 *   nodes : 해당 도메인의 테이블/뷰 + SP/Function
 *   edges : 도메인 내부(intra-domain) FK + SP→테이블 사용 관계
 *
 * SP→테이블 의존(SP_USES)은 sys.sql_expression_dependencies 기반 best-effort —
 * 동적 SQL(EXEC(@sql))은 잡지 못한다. 조회 실패 시 dependencyGraphAvailable=false,
 * edges 는 FK 만 반환.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SchemaGraph {

    private String targetCd;
    private String domain;

    /** Target DB 연결 여부 */
    private boolean connected;

    private List<Node> nodes;
    private List<Edge> edges;

    /** SP→테이블 의존 그래프 조회 성공 여부 (false 면 edges 는 FK 만) */
    private boolean dependencyGraphAvailable;

    /** edges 가 상한(cap)에 걸려 잘렸는지 */
    private boolean truncated;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Node {
        /** 고유 id = 객체명 (대문자) */
        private String id;
        /** 표시 이름 (원본 대소문자) */
        private String name;
        /** 'TABLE' | 'VIEW' | 'SP' | 'FN' */
        private String type;
        private String domain;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Edge {
        /** 출발 노드 id */
        private String from;
        /** 도착 노드 id */
        private String to;
        /** 'FK' | 'SP_USES' */
        private String kind;
    }
}
