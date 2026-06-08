package com.zionex.t3composer.domain.ontology.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * composer-db 의 dbo.tb_cmp_ontology_ext — Target DB 의 tb_is_* 에 없는 확장 필드 보관.
 *
 * <p>Target DB schema (TB_IS_QAPATTERN / tb_is_ontlgy_entity) 에 정의되지 않은 사용자 정의
 * 필드 — paraphrases · relatedEntityIds · notes 등 — 만 보관한다. base 의 question/answer/name
 * 등은 Target DB 가 보유 — 본 테이블은 그 row 와 (target_cd, kind, ref_id) 키로 1:1 매칭.
 *
 * <p>extension JSON 구조:
 * {@code { paraphrases:[string], relatedEntityIds:[string], relatedTableNames:[string], notes:string }}
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "tb_cmp_ontology_ext", schema = "dbo")
public class OntologyExtension {

    @Id
    @Column(name = "id")
    private UUID id;

    @Column(name = "target_cd", nullable = false, length = 50)
    private String targetCd;

    @Column(name = "kind", nullable = false, length = 20)
    private String kind;   // 'QA' | 'ENTITY'

    @Column(name = "ref_id", nullable = false, length = 64)
    private String refId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "extension", nullable = false, columnDefinition = "jsonb")
    private String extensionJson;   // jsonb 직렬화 — Service 에서 ObjectMapper 로 변환

    @Column(name = "create_by", length = 50)
    private String createBy;

    @Column(name = "create_dttm")
    private LocalDateTime createDttm;

    @Column(name = "modify_by", length = 50)
    private String modifyBy;

    @Column(name = "modify_dttm")
    private LocalDateTime modifyDttm;
}
