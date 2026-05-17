-- __migration_target_cd_backfill.sql
-- 2026-05-15 변경 (Target Rule/Hook DB 주입) 후 기존 세션 호환용.
-- TARGET_CD 가 NULL 인 ComposerSession 을 'T3SERIES' 로 backfill.
-- 멱등 — 이미 채워진 세션은 변경 안 함.
--
-- 실행 시점: backend 배포 후 1회. init-pg 폴더에 두지만 첫 컨테이너 부팅 시에는
--           대상 row 가 없어 no-op. 운영 환경에서는 docker exec 으로 수동 실행.

UPDATE TB_IS_COMPOSER_SESSION
   SET TARGET_CD   = 'T3SERIES',
       MODIFY_BY   = 'migration',
       MODIFY_DTTM = NOW()
 WHERE TARGET_CD IS NULL;

-- 검증
SELECT COUNT(*) AS remaining_null
  FROM TB_IS_COMPOSER_SESSION
 WHERE TARGET_CD IS NULL;
-- → 0 이면 OK
