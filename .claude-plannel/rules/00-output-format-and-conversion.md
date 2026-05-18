# ★★★ PLANNEL 절대 규칙 (priority 0 — 최우선) ★★★

이 규칙은 다른 모든 PLANNEL rule 보다 우선합니다.

## 1. T3Series 변환 강제 (사용자 prompt 신호 무시)

이 세션은 PLANNEL target 입니다. 사용자 prompt 안에 아래 T3Series 신호가 있어도 **무조건 PlanNEL 컨벤션으로 변환** 하세요. T3Series 컨벤션 출력은 **절대 금지**.

| T3Series 신호 | PlanNEL 변환 |
|---|---|
| `TB_CM_<X>`, `TB_<domain>_<X>` | `z_<x>` (lowercase + snake_case) |
| `SP_UI_<X>`, Stored Procedure | 사용 안 함 — JPA Repository + QueryDSL/JPQL |
| `[CM]`, `[DP]`, `[MP]` 도메인 prefix | 무시 (PlanNEL 은 도메인 prefix 없음) |
| `wingui`, `BaseGrid`, `useViewStore` | `AG-Grid` (`<AgGridReact>`), `useState + useRef` |
| `zAxios`, `setViewInfo`, `showMessage` | `restApi`, `<FilterContainer>`, `<Dialog>+<Snackbar>` |
| `callService`, `Spring Boot 3`, `jakarta.*` | `restApi`, `Spring Boot 2.4`, `javax.*` |
| `@wingui/common/imports` | `@plannel/components/*` |
| 자동 분석의 "TB_* 미존재 → DDL 필요" | **모두 무시**. PlanNEL 은 z_* + Liquibase changeset. |

응답 첫 줄에 "T3Series 패턴으로 작성", "wingui 컨벤션으로" 같은 말이 절대 나오면 안 됩니다.
사용자가 T3Series 단어를 써도 산출물은 **항상 PlanNEL**.

## 2. 산출물 출력 형식 (필수)

모든 산출물 파일은 **반드시 `===FILE: <path>===` 헤더로 시작**하고 그 뒤에 코드 블록을 둡니다.
**헤더 없는 코드 블록은 산출물로 추출되지 않습니다** (Composer 의 ArtifactExtractor 가 인식 못함 → 사용자가 사용 못 함).

### ✅ 올바른 형식 (필수)

다음과 같이 각 파일을 `===FILE: <경로>===` 헤더 + 코드 블록 쌍으로 출력하세요:

    ===FILE: saas-application/src/main/java/t3series/saas/model/Material.java===
    ```java
    package t3series.saas.model;

    import javax.persistence.*;
    // (Entity 본문)
    ```

    ===FILE: saas-application/src/main/java/t3series/saas/repository/MaterialRepository.java===
    ```java
    package t3series.saas.repository;
    // (Repository 본문)
    ```

    ===FILE: saas-web/src/services/data/material-service.js===
    ```js
    import restApi from "@plannel/services/utils/rest-api";
    // (service 본문)
    ```

    ===FILE: saas-web/src/pages/data-management/MaterialMaster.js===
    ```jsx
    import { useState, useRef, useMemo } from "react";
    // (화면 본문)
    ```

    ===FILE: saas-application/src/main/resources/db/changelog/2026-05-18-add-z-material.yaml===
    ```yaml
    - changeSet:
        id: 2026-05-18-add-z-material
        author: composer
        changes:
          - createTable:
              tableName: z_material
              # (컬럼)
    ```

### ❌ 잘못된 형식 (절대 사용 금지)

`===FILE:` 헤더 없이 코드 블록만 출력하면 ArtifactExtractor 가 추출 못해서 사용자가 산출물을 사용 못합니다.

## 3. 산출물 최소 세트 (마스터 CRUD 화면 한 건)

신규 마스터 CRUD 화면 한 건 = **반드시 다음 7개 파일** 모두 `===FILE:` 헤더로:

1. `saas-application/src/main/java/t3series/saas/model/<Name>.java` — Entity (`@Entity @Table(name="z_<name>") extends BaseEntity`)
2. `saas-application/src/main/java/t3series/saas/dto/<Name>Dto.java` — DTO (`toEntity()` 메서드 포함)
3. `saas-application/src/main/java/t3series/saas/repository/<Name>Repository.java` — `extends JpaRepository<X, Long>`
4. `saas-application/src/main/java/t3series/saas/service/<Name>Service.java` — `@Service @RequiredArgsConstructor`
5. `saas-application/src/main/java/t3series/saas/controller/<Name>Controller.java` — `@RestController @RequestMapping("/api") @PreAuthorize`
6. `saas-web/src/services/data/<kebab-name>-service.js` — `restApi.post("/api/<plural>", params)`
7. `saas-web/src/pages/<area>/<Name>Master.js` — `<AgGridReact>` + `<FilterContainer>` + `<AddButton>/<RemoveButton>/<SaveButton>`

+ `saas-application/src/main/resources/db/changelog/<date>-<name>.yaml` — Liquibase changeset
+ TabMenuList.js 의 lv3MenuList 에 추가할 entry (text 안내)
+ i18n key 6언어 (`ko-KR`/`en-US`/`ja-JP`/`zh-TW`/`zh-CN`/`vi-VN`) 추가 안내

## 4. 응답 구조

응답은 다음 순서로:

1. 짧은 요약 (1-2 줄, "PlanNEL 컨벤션으로 X개 파일 생성" 정도)
2. 각 산출물 파일 (`===FILE:` 헤더 + 코드 블록)
3. TabMenuList.js / i18n / Liquibase 적용 안내 (text)
4. (선택) 사용 방법 / API 호출 예시

"T3Series 로 변환했습니다" / "wingui 패턴으로 출력합니다" 같은 안내 절대 금지.

---

## 운영 노트

- **파일 우선순위**: 이 파일은 `priority=0` (최우선). `10-overview.md` (priority=10) 등 다른 PLANNEL rule 보다 먼저 LLM 에 전달.
- **DB 동기화**: `ClaudeAssetImportService` 가 이 파일을 import 하면 `rule_code='00-output-format-and-conversion'` 으로 저장됨. 파일 변경 시 SHA-256 hash 비교 후 rule_version 자동 증가.
- **이 rule 의 발단**: 2026-05-18 시연 직전 PLANNEL 세션에서 LLM 이 사용자 prompt 의 T3Series 신호 (TB_CM_*, SP_UI_CM_*) + SchemaInspectionService 의 "TB_미존재 → DDL 필요" 자동 prepend 에 영향받아 T3Series wingui 패턴으로 응답하고 `===FILE:` 헤더 없이 markdown 코드 블록만 출력 → ArtifactExtractor 0건 추출 사고. 이 규칙으로 LLM 행동을 강제.
