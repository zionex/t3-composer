-- 33_ontology_extension.sql
--
-- Composer Ontology Tab v1 — Target DB 의 tb_is_* (Q&A · Entity) 에 V1 schema 가
-- 가지지 않은 확장 필드 (paraphrases · relatedEntityIds · notes) 를 보관하는 side-table.
-- Target DB 는 운영 wingui 와 공유하므로 무손상 — composer-db (PG) 에 격리.
--
-- 조회: (target_cd, kind, ref_id) 로 base row 와 1:1 JOIN.
-- target_cd 까지 키에 포함시켜 다중 Target 환경(T3SERIES, B사 SCM 등)에서 격리.

CREATE TABLE IF NOT EXISTS dbo.tb_cmp_ontology_ext (
    id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    target_cd     varchar(50)   NOT NULL,        -- 'T3SERIES' 등
    kind          varchar(20)   NOT NULL,        -- 'QA' | 'ENTITY'
    ref_id        varchar(64)   NOT NULL,        -- Target DB row PK (TB_IS_QAPATTERN.id 등)
    extension     jsonb         NOT NULL DEFAULT '{}'::jsonb,
    -- { paraphrases: [string], relatedEntityIds: [string], notes: string }
    create_by     varchar(50),
    create_dttm   timestamp     DEFAULT now(),
    modify_by     varchar(50),
    modify_dttm   timestamp     DEFAULT now(),
    CONSTRAINT uk_ontology_ext UNIQUE (target_cd, kind, ref_id)
);

CREATE INDEX IF NOT EXISTS ix_ontology_ext_lookup
    ON dbo.tb_cmp_ontology_ext (target_cd, kind, ref_id);
