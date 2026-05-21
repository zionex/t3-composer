-- 31_target_system_backend_ref_path.sql
--
-- TB_CMP_TARGET_SYSTEM 에 backend_ref_path 컬럼 추가.
--
-- 배경:
--   T3SERIES 같이 monorepo 구조 (frontend + backend 가 같은 wingui 트리 아래) 인 Target 은
--   source_ref_path 한 곳으로 frontend(`packages/wingui/src/view`) 와 backend
--   (`src/main/java`) 둘 다 찾을 수 있었다.
--
--   PLANNEL 같이 backend 와 frontend 가 **별도 디렉토리** (saas-web/ + saas-application/) 인
--   Target 은 source_ref_path 하나로는 backend 위치를 알 수 없다 → EXISTING_MODIFY 모드에서
--   InsightSourceController 가 Controller/Service/Repository .java 를 못 찾음.
--
--   backend_ref_path 가 명시되면 그 경로를 backend root 로 사용. 비어있으면 기존처럼
--   source_ref_path 기준 monorepo 가정 (`<source>/src/main/java`) 으로 fallback.

ALTER TABLE dbo.tb_cmp_target_system
    ADD COLUMN IF NOT EXISTS backend_ref_path varchar(500);

COMMENT ON COLUMN dbo.tb_cmp_target_system.backend_ref_path IS 'backend 소스 루트 컨테이너 경로 (monorepo 가 아닌 Target 용). 비어있으면 source_ref_path 기준 monorepo 가정으로 fallback. 예: PLANNEL = /workspace/targets/PLANNEL/backend (= host 의 saas-application).';

-- PLANNEL seed — backend 마운트는 별도 호스트 폴더 (saas-application).
-- 컨테이너 경로는 docker-compose 의 TARGET_PLANNEL_BACKEND_PATH 마운트 위치와 일치.
UPDATE dbo.tb_cmp_target_system
   SET backend_ref_path = '/workspace/targets/PLANNEL/backend'
 WHERE target_cd = 'PLANNEL'
   AND (backend_ref_path IS NULL OR backend_ref_path = '');
