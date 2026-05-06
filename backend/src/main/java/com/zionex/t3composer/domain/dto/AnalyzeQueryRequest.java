package com.zionex.t3composer.domain.dto;

import java.util.List;
import java.util.Map;

import lombok.Data;

/**
 * Excel 설계서 Query TAB 텍스트를 AI (Claude) 에 보내 grid 별 CRUD SP 매핑을 요청.
 * 응답은 { mapping: { "1": { read, create, update, delete }, "2": {...} } } 형태.
 */
@Data
public class AnalyzeQueryRequest {

    /** Query 시트의 원본 텍스트 (탭 구분, 줄바꿈 포함). 너무 크면 클라이언트에서 자름 (60KB 제한). */
    private String queryText;

    /** 감지된 grid 메타 (n, id, position, sheetName). Claude 가 매핑에 참고. */
    private List<Map<String, Object>> grids;

    /** Layout orientation ('H' | 'V' | 'G'). 위치 라벨(좌/우/상/하) 해석에 사용. */
    private String orientation;

    /** 추가 instruction (선택). 없으면 서버 기본 프롬프트 사용. */
    private String instruction;
}
