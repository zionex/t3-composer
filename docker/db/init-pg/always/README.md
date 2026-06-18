# `always/` — 매 docker compose up 마다 실행되는 멱등 ALTER 마이그레이션

## 목적

`composer-db-init` 의 Phase 1 (baseline) 은 멱등 마커(`t3composer_init_done`) 로 보호되어
**1회만** 실행된다 — `04_…sql` 의 `DROP TABLE`, `22_…sql` 의 데이터 재구성 등 재실행 시
파괴적인 SQL 이 포함되어 있기 때문.

문제: 새 마이그레이션이 추가돼도 기존 볼륨(마커 보유) 에는 영원히 적용 안 됨.
→ `column "..." does not exist` 류 오류로 backend 가 매번 깨짐. 사용자는 수동 psql 실행.

해결: `always/*.sql` 는 **마커와 무관하게 매 up 마다 실행** — 신규 install · 기존 볼륨
양쪽 모두에서 자동으로 컬럼/제약/시드를 흡수.

## 필수 규칙

1. **모두 멱등** — 같은 파일을 100회 실행해도 결과 동일해야 함:
   - `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...`
   - `CREATE INDEX IF NOT EXISTS ...`
   - `INSERT ... ON CONFLICT (...) DO NOTHING / DO UPDATE SET ...`
   - `INSERT ... WHERE NOT EXISTS (SELECT 1 FROM ...)`
   - `UPDATE ... WHERE <조건이 1회 실행 후엔 매치 안 됨>`
   - `DROP ... IF EXISTS` (또는 `DO $$ ... IF EXISTS ... END $$` 가드)

2. **파괴적 SQL 금지** — `DROP TABLE`, 데이터 wipe, PK rename 등은 `always/` 에 절대 금지.
   1회만 필요한 마이그레이션은 baseline (`00-99_*.sql`) 에 둘 것.

3. **파일명** — 실행 순서 결정용 숫자 prefix + 의미있는 이름. 예: `01_composer_session_rule_scope.sql`.

4. **자기 검증** — 본인이 만든 마이그레이션이 두 번 실행돼도 안전한지 테스트:
   ```bash
   docker compose run --rm composer-db-init   # 1차
   docker compose run --rm composer-db-init   # 2차 — 같은 결과여야
   ```

## 흔한 패턴

```sql
-- ✅ 컬럼 추가
ALTER TABLE dbo.tb_xxx ADD COLUMN IF NOT EXISTS new_col varchar(40);

-- ✅ 시드 데이터 추가 (PK 충돌 보호)
INSERT INTO dbo.tb_xxx (id, name) VALUES ('FOO', 'Foo')
ON CONFLICT (id) DO NOTHING;

-- ✅ 컬럼 rename (양쪽 상태 가드)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema='dbo' AND table_name='tb_xxx' AND column_name='old_name')
    AND NOT EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_schema='dbo' AND table_name='tb_xxx' AND column_name='new_name') THEN
        ALTER TABLE dbo.tb_xxx RENAME COLUMN old_name TO new_name;
    END IF;
END $$;

-- ❌ 절대 금지
DROP TABLE dbo.tb_xxx;                          -- 데이터 wipe
INSERT INTO dbo.tb_xxx VALUES (...);             -- ON CONFLICT 없음
UPDATE dbo.tb_xxx SET pk_col = '...' WHERE ...;  -- PK rename
```

## 흐름 (docker-compose.yml composer-db-init)

```
Phase 1 (baseline, 마커 보호)
   └─ 00-12, 20-99 *.sql → 마커 set
Phase 2 (always, 마커 무관)
   └─ always/*.sql → 매 up 마다
```
