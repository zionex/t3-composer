# 31. Multi-tenancy 아키텍처 (PlanNEL)

> 모든 PlanNEL 요청은 **`x-tenant-id` 헤더 → ThreadLocal `TenantContext` → PostgreSQL schema 라우팅** 으로 테넌트 격리. 신규 화면 작성 시 raw SQL / native query 를 직접 만지지 않는 한 자동 적용됨. **공유 테이블 (Quartz scheduler 등) 은 별도 마스터 DB**.

## 1. 핵심 개념

| 개념 | 위치 | 설명 |
|---|---|---|
| `TenantContext` | `t3series.saas.common.tenant.TenantContext` (saas-common) | ThreadLocal<String> 로 요청별 tenantId 저장 |
| `Tenant` entity | `public.tenant` 테이블 (마스터 DB) | tenantId → schema 매핑 |
| `MultiTenancyInterceptor` | `multi_tenancy/` 패키지 | HTTP 요청 진입 시 `x-tenant-id` 헤더 → `TenantContext.setTenantId()` 호출 |
| `TenantPersistenceConfig` | `multi_tenancy/config/tenant/` | DataSource 라우팅 (Hibernate `MultiTenantConnectionProvider`) |
| `TenantAwareTaskDecorator` | `multi_tenancy/async/` | `@Async` 비동기 작업 시 부모 thread 의 TenantContext 를 자식 thread 에 전파 |
| `QuartzConfig` (마스터) | `multi_tenancy/config/master/` | Quartz scheduler 는 마스터 DB 를 사용 (테넌트 무관 시스템 잡) |

## 2. TenantContext 구현 (`saas-common`)

```java
package t3series.saas.common.tenant;

import org.apache.commons.lang3.StringUtils;
import java.sql.Connection;
import java.util.HashMap;
import java.util.Map;

public class TenantContext {
    private static final ThreadLocal<String> CONTEXT = new ThreadLocal<>();
    private static final Map<String, Tenant> TENANTS = new HashMap<>();

    public static void setTenantId(String tenantId) {
        CONTEXT.set(tenantId);
    }

    public static String getTenantId() {
        return CONTEXT.get();
    }

    public static void clear() {
        CONTEXT.remove();
    }

    public static String getSchema(Connection conn) {
        String tenantId = TenantContext.getTenantId();
        if (StringUtils.isEmpty(tenantId)) return null;

        Tenant tenant = TENANTS.get(tenantId);
        if (tenant == null) {
            loadTenants(conn);                                           // Lazy 로딩
            tenant = TENANTS.get(tenantId);
        }
        return tenant != null ? tenant.getSchema() : null;
    }

    private static void loadTenants(Connection conn) {
        // SELECT t.tenant_id, t.schema FROM public.tenant t
        // → TENANTS Map 채우기
    }
}
```

**핵심 포인트**:
- **ThreadLocal** 기반 — 요청별로 독립된 컨텍스트
- **TENANTS Map 캐싱** — 첫 요청 시 `public.tenant` 에서 lazy 로딩, 이후 in-memory hit
- **Connection 인자** — Hibernate 의 `CurrentTenantIdentifierResolver` 가 `getSchema(conn)` 호출

## 3. 요청 흐름

```
Frontend 요청 (axios)
   ↓ Authorization: Bearer <JWT>
   ↓ x-tenant-id: <tenant>
   ↓ x-module-name: DP|IP|RP|MP
   ↓
Spring Security Filter Chain
   ├─ AuthTokenFilter → JWT 검증 → SecurityContext 에 Authentication 주입
   └─ MultiTenancyInterceptor → x-tenant-id → TenantContext.setTenantId()
   ↓
Controller (@PreAuthorize 통과)
   ↓
Service → Repository
   ↓
Hibernate / QueryDSL 쿼리 실행
   ↓ Connection 획득
   ↓ TenantContext.getSchema(conn) 호출
   ↓ SET search_path TO <tenant_schema>, public
   ↓
PostgreSQL 테이블 조회 (해당 schema 의 z_* 테이블)
   ↓
응답 반환
   ↓
TenantContext.clear() (요청 종료 시)
```

## 4. Schema 구조

PostgreSQL 데이터베이스 = **단일 인스턴스, 다수 schema**.

```
postgres
├── public (마스터)
│   ├── tenant            ← 테넌트 메타 (tenant_id, schema, ...)
│   ├── QRTZ_*            ← Quartz scheduler 테이블 (시스템 공유)
│   └── ...
├── zionex                ← Tenant1 schema
│   ├── z_customer
│   ├── z_item
│   └── ... (z_* 비즈니스 테이블)
├── tenant2_schema        ← Tenant2 schema
│   ├── z_customer
│   └── ...
└── ...
```

각 테넌트 schema 가 **z_* 테이블 전체 set** 을 보유. 마이그레이션 (Liquibase) 도 schema 별 실행.

## 5. 비동기 작업 (Quartz, @Async)

테넌트 컨텍스트는 ThreadLocal 이라 **자식 thread 로 자동 전파 안 됨**. `TenantAwareTaskDecorator` 가 명시적 전파:

```java
package t3series.saas.multi_tenancy.async;

@Component
public class TenantAwareTaskDecorator implements TaskDecorator {
    @Override
    public Runnable decorate(Runnable runnable) {
        String tenantId = TenantContext.getTenantId();
        return () -> {
            try {
                if (tenantId != null) TenantContext.setTenantId(tenantId);
                runnable.run();
            } finally {
                TenantContext.clear();
            }
        };
    }
}

@Configuration
public class AsyncConfig implements AsyncConfigurer {
    @Override
    public Executor getAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setTaskDecorator(new TenantAwareTaskDecorator());     // ★ 적용
        executor.initialize();
        return executor;
    }
}
```

### 5.1 Quartz 잡

Quartz 의 JobStoreTX 는 마스터 DB 의 `QRTZ_*` 테이블 사용. Job 실행 시 다음 두 가지 케이스:

| 케이스 | 처리 |
|---|---|
| 테넌트 무관 시스템 잡 (예: 로그 청소) | TenantContext 비어있는 상태로 실행 |
| 특정 테넌트의 잡 (예: tenant1 의 야간 배치) | Job data map 에 `tenantId` 저장 → `JobExecutionContext` 에서 꺼내 `TenantContext.setTenantId()` 호출 후 비즈니스 로직 |

## 6. Multi-tenancy 패키지 구조 (`t3series.saas.multi_tenancy`)

```
multi_tenancy/
├── async/
│   ├── AsyncConfig.java                    @EnableAsync + TenantAwareTaskDecorator
│   └── TenantAwareTaskDecorator.java
├── config/
│   ├── master/                             마스터 DB 라우팅
│   │   └── QuartzConfig.java
│   └── tenant/                             테넌트 DB 라우팅
│       └── TenantPersistenceConfig.java    Hibernate MultiTenantConnectionProvider
├── repository/
│   ├── TenantRepository.java               public.tenant CRUD
│   ├── QuartzScheduleRepository.java
│   └── QuartzScheduleQueryRepository.java
└── model/
    ├── BaseEntity.java                     모든 entity 의 audit 필드
    ├── Tenant.java                         tenant_id, schema, name, ...
    └── QuartzSchedule.java                 테넌트별 스케줄 메타
```

## 7. 신규 화면 작성 시 주의

### 7.1 자동 적용 (코드 작성 불필요)

- JpaRepository 의 `findAll()`, `findById()` 등 모든 호출
- QueryDSL `JPAQueryFactory` 사용 시
- MyBatis `@Mapper` 인터페이스 호출 시

→ 이들은 모두 Hibernate / MyBatis 의 Connection 획득 단계에서 `TenantContext.getSchema(conn)` 가 적용됨.

### 7.2 수동 처리가 필요한 경우

| 케이스 | 처리 |
|---|---|
| 마스터 DB 의 `public.*` 테이블에 직접 접근 (예: 신규 테넌트 등록) | 별도 `MasterDataSource` 빈 사용 + TenantContext 비우기 |
| 다른 테넌트의 데이터 참조 (관리자 콘솔에서 cross-tenant 조회) | `TenantContext.setTenantId(otherTenantId)` 임시 변경 + `try/finally` 로 원복 |
| `@Async` 비동기 작업 안에서 DB 호출 | `TenantAwareTaskDecorator` 가 자동 처리 (이미 AsyncConfig 에 등록됨) |
| Quartz Job 안에서 테넌트별 작업 | `JobDataMap.put("tenantId", ...)` + `JobExecutionContext.getMergedJobDataMap().getString("tenantId")` 로 복원 후 `TenantContext.setTenantId(tid)` |
| Native SQL 쿼리 (`@Query(nativeQuery = true)`) | 가능한 피하고 QueryDSL 사용. 불가피하면 schema 가 SET 되어 있는지 확인 |

### 7.3 Frontend 책임

- localStorage 의 `user.tenantId` 가 비어있으면 `restApi` 가 `x-tenant-id` 헤더를 안 붙임 → backend 가 401 또는 schema 미설정 오류
- 로그인 응답이 항상 `{ accessToken, type, tenantId, ... }` 형태인지 확인
- 사용자 관리에서 tenantId 변경 (테넌트 switch) 후에는 페이지 새로고침 (axios 인스턴스가 localStorage 를 매 요청마다 다시 읽지 않을 수 있음)

## 8. saas-admin (관리자 콘솔) 의 cross-tenant 접근

`saas-admin` (Next.js 15) 은 모든 테넌트의 KPI / 사용량을 조회. 백엔드의 `saas-application` 에 다음 패턴으로 접근:

```
saas-admin → /api/admin/tenants/{tenantId}/usage
   → MultiTenancyInterceptor 가 path variable 에서 tenantId 추출 → TenantContext.setTenantId(tenantId)
   → Service 가 해당 테넌트 schema 로 조회
```

또는 마스터 DB 직접 접근:
```
saas-admin → /api/admin/tenants
   → public.tenant 직접 조회 (TenantContext 비움)
```

## 9. 테넌트 신규 프로비저닝

```
1. saas-admin 에서 테넌트 생성 요청 (이름 + 관리자 정보)
   ↓
2. saas-application 의 ProvisioningService:
   ├─ INSERT public.tenant (tenant_id, schema, ...)
   ├─ CREATE SCHEMA <new_schema>
   ├─ src/main/sql/postgres-ddl-tenant.sql 의 모든 DDL 을 새 schema 에 실행
   ├─ src/main/sql/postgres-seed-data.sql 의 초기 데이터 INSERT
   └─ Liquibase changelog 적용 (TenantContext.setTenantId 으로 새 schema 지정)
   ↓
3. 첫 관리자 계정 생성 + 비밀번호 메일 (SES)
```

DDL 파일:
- `saas-application/src/main/sql/postgres-ddl-public.sql` — 마스터 schema (`public`) 의 시스템 테이블
- `saas-application/src/main/sql/postgres-ddl-tenant.sql` — 테넌트별 schema 의 z_* 테이블
- `saas-application/src/main/sql/postgres-ddl-provisioning.sql` — 프로비저닝 스크립트
- `saas-application/src/main/sql/postgres-seed-data.sql` — 신규 테넌트 초기 데이터

Liquibase changelog: `saas-application/src/main/resources/db/changelog/db.changelog-tenant.yaml`

## 10. Anti-patterns

| ❌ | ✅ |
|---|---|
| Frontend 로그인 후 `user.tenantId` 저장 안 함 | 로그인 응답에서 `tenantId` 추출 → localStorage 의 `user` 객체에 포함 |
| `restApi` 에서 `x-tenant-id` 헤더 누락 | `authHeader()` 가 자동 부착 (rest-api.js) |
| Backend 에서 `MultiTenancyInterceptor` 우회한 경로 (예: filter 직전 endpoint) | 모든 `/api/**` 경로가 interceptor 통과해야 함 |
| `@Async` 메서드 안에서 DB 호출 시 TenantContext 비어있음 | `AsyncConfig.getAsyncExecutor()` 에 `TenantAwareTaskDecorator` 등록 |
| Quartz Job 안에서 테넌트 컨텍스트 누락 | `JobDataMap` 에 `tenantId` 저장 + Job 실행 시 복원 |
| Native SQL 안에 schema 하드코딩 (`zionex.z_customer`) | schema 미지정 (`z_customer`) — Hibernate 가 search_path 자동 설정 |
| 마스터 DB 의 `public.tenant` 를 일반 JpaRepository 로 조회 | `TenantRepository` (별도 DataSource 라우팅) 사용 |
| 다른 테넌트 조회 후 `TenantContext.clear()` 누락 → 후속 요청 영향 | `try/finally` 로 반드시 원복 |
| 테넌트별 Liquibase 적용 누락 → 새 컬럼이 일부 schema 에만 존재 | 모든 active tenant schema 에 changelog 일관 적용 |
| `tenantId` 를 frontend URL path 에 노출 (보안) | header 로만 전달. URL 에는 노출 금지 |
