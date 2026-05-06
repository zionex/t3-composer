-- =============================================================================
-- 12. TB_IS_EXTRNLAPIKEY — Anthropic API Key 보관 (AnthropicApiKeyService 가 사용)
-- =============================================================================

USE T3SMARTSCM;
GO

IF OBJECT_ID('dbo.TB_IS_EXTRNLAPIKEY', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TB_IS_EXTRNLAPIKEY (
        id                          VARCHAR(32)    NOT NULL,
        user_id                     CHAR(32)       NOT NULL,
        provider                    NVARCHAR(50)   NOT NULL,
        description                 NVARCHAR(500)  NULL,
        api_key_encrypted           NVARCHAR(MAX)  NULL,
        credentials_json_encrypted  NVARCHAR(MAX)  NULL,
        created_at                  DATETIME       DEFAULT GETDATE() NULL,
        expires_at                  DATETIME       NULL,
        is_active                   INT            DEFAULT 1 NULL,
        scope                       NVARCHAR(200)  NULL,
        CONSTRAINT PK_TB_IS_EXTRNLAPIKEY PRIMARY KEY (id),
        CONSTRAINT UQ_TB_IS_EXTRNLAPIKEY_USER_PROV UNIQUE (user_id, provider)
    );
    CREATE NONCLUSTERED INDEX IX_TB_IS_EXTRNLAPIKEY_USER ON dbo.TB_IS_EXTRNLAPIKEY (user_id);
END
GO

PRINT '[12] TB_IS_EXTRNLAPIKEY ready.';
GO
