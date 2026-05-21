-- 32_preview_mockup_cache.sql
--
-- [화면 실행 LIVE] 의 AI mockup 변환 결과 캐시.
--
-- 배경:
--   원본 JSX (PLANNEL · T3SERIES · 기타 Target) 를 preview sandbox 에서 직접 실행하면
--   ambient 글로벌·@plannel/@wingui 표면·외부 npm 의존 등이 끝없이 사고 유발.
--   매번 stub 추가하는 사이클을 끊기 위해 AI 가 한 번 변환해서 의존성 minimal 한 mockup
--   JSX 를 생성. 변환 결과는 원본 hash + targetCd 별로 캐시 → 같은 화면 다시 [화면 실행]
--   누르면 캐시 hit 으로 즉시.
--
-- 캐시 키:
--   PK (original_hash, target_cd) — 같은 원본이라도 Target 별로 다르게 변환될 수 있음
--   (PLANNEL = MUI Table + sample · T3SERIES = BaseGrid shim 호환).
--
-- 무효화:
--   원본 jsx 가 바뀌면 hash 가 달라져 자동으로 cache miss. 수동 갱신은 force endpoint 또는
--   row 삭제로 처리.

CREATE TABLE IF NOT EXISTS dbo.tb_cmp_preview_mockup (
    original_hash   char(64)    NOT NULL,        -- sha256(originalJsx)
    target_cd       varchar(50) NOT NULL,
    original_path   varchar(500),                -- 디버깅용 (어떤 화면이었는지)
    original_bytes  integer,
    mockup_jsx      text        NOT NULL,
    mockup_bytes    integer,
    model_name      varchar(100),
    elapsed_ms      integer,                     -- 변환 소요 시간 (모니터링)
    create_dttm     timestamp DEFAULT now(),
    PRIMARY KEY (original_hash, target_cd)
);

COMMENT ON TABLE dbo.tb_cmp_preview_mockup IS 'AI mockup 변환 결과 캐시 — original_hash + target_cd 기준 lookup, miss 시 Anthropic 호출 후 저장';
COMMENT ON COLUMN dbo.tb_cmp_preview_mockup.original_hash IS 'sha256(originalJsx) — 같은 원본은 한 번만 변환';
COMMENT ON COLUMN dbo.tb_cmp_preview_mockup.target_cd IS 'PLANNEL/T3SERIES 등 — Target 별 prompt 분기 결과를 별도 캐시';
