-- =============================================================================
-- 12. TB_IS_EXTRNLAPIKEY — Anthropic API Key 보관 (AnthropicApiKeyService 가 사용)
-- =============================================================================




    CREATE TABLE IF NOT EXISTS dbo.TB_IS_EXTRNLAPIKEY (
        id                          VARCHAR(32)    NOT NULL,
        user_id                     CHAR(32)       NOT NULL,
        provider                    varchar(50)   NOT NULL,
        description                 varchar(500)  NULL,
        api_key_encrypted           text  NULL,
        credentials_json_encrypted  text  NULL,
        created_at                  timestamp       DEFAULT now() NULL,
        expires_at                  timestamp       NULL,
        is_active                   INT            DEFAULT 1 NULL,
        scope                       varchar(200)  NULL,
        CONSTRAINT PK_TB_IS_EXTRNLAPIKEY PRIMARY KEY (id),
        CONSTRAINT UQ_TB_IS_EXTRNLAPIKEY_USER_PROV UNIQUE (user_id, provider)
    );
    CREATE INDEX IF NOT EXISTS IX_TB_IS_EXTRNLAPIKEY_USER ON dbo.TB_IS_EXTRNLAPIKEY (user_id);


\echo '[12] TB_IS_EXTRNLAPIKEY ready.'

