# PlanNEL Validators

> `pre-tool-use-validator.sh` 가 source 하는 PreToolUse 검증 모듈 8개. 각 모듈은 자체 가드 (확장자/경로/TOOL_NAME) 로 비대상 호출 즉시 패스.

## 모듈 목록

| # | 파일 | 검증 대상 | 차단 (block) | 경고 (warn) |
|---|---|---|---|---|
| 1 | `import-convention.sh` | `.java`/`.jsx`/`.js`/`.ts`/`.tsx` | `jakarta.persistence/validation/servlet/annotation` · `Jwts.parserBuilder()` · `from "@wingui/*"` · `from "@zionex/wingui-core"` · `from "realgrid"` · `<BaseGrid>` · `useViewStore`/`useContentStore` · `showMessage` · `setViewInfo` · `zAxios` · `useFieldCascade`/`applyGridCascade`/`buildPopupFilterProps` · `axios` 직접 import | 상대경로 import (`../../`) · `SecurityFilterChain` bean 패턴 |
| 2 | `package-convention.sh` | `.java` | `package com.zionex.t3series.*` · `import com.zionex.t3series.*` · `web.util.audit.BaseEntity` 경로 | saas-application 의 root package 가 `t3series.saas.*` 가 아닌 경우 |
| 3 | `url-convention.sh` | `.java`/`.jsx`/`.js`/`.ts`/`.tsx` | `@RequestMapping("/composer/...")` · `"/util/..."` · `restApi.X("/composer/...")` · `axios.X("/util/...")` | 클래스 레벨 `@RequestMapping("/api/<resource>")` (resource path 포함) |
| 4 | `entity-conventions.sh` | `.java` (`@Entity` 포함) + `SP_UI_*.sql` | `@Table(name="TB_*")` · `SP_UI_*.sql` 파일 생성 | `@Table` 의 name 이 `z_` prefix 없음 · BaseEntity 미상속 · boolean 필드의 `@Convert(BooleanToYNConverter)` 누락 · `@ManyToOne` 의 `@JsonIgnore` 누락 · id 의 `@GeneratedValue(IDENTITY)` 누락 |
| 5 | `controller-security.sh` | `.java` | `@PreAuthorize("hasRole('ROLE_*')")` (prefix 포함) · `@PreAuthorize("hasAnyRole('ROLE_*')")` · `WebSecurityConfig` 의 화이트리스트에 비즈니스 endpoint · `log.{info,error,warn,debug}(...password / jwtToken / accessToken / refreshToken...)` · JWT secret 하드코딩 (`@Value` 없이) | `@RestController` 에 `@PreAuthorize` 누락 (AuthController 등 시스템 예외) · DTO 에 password / accessToken 필드 (인증 응답 DTO 예외) |
| 6 | `aggrid-columns.sh` | `.jsx`/`.js`/`.ts`/`.tsx` (`AgGridReact` 또는 `columnDefs` 포함) | `headerText:` · `textAlignment:` · `dataType:'text/number/...'` · `editor:{type:...}` · `dataProvider.fillJsonData` · `dataProvider.getAllStateRows`/`getJsonRow` · `afterGridCreate` · `<Pop*>` · `<CommonCodeSelect groupCd=...>` | `useDropdown` · `lookupDisplay` |
| 7 | `jsx-page.sh` | `saas-web/src/pages/*.js`/`*.jsx` (화면 컴포넌트) | (없음) | `withTranslation()` HOC / `useTranslation()` 둘 다 없음 · `DataState.initialize` 누락 · `DataState` import 없음 · `DefaultGridSetting` 미사용 · 모든 컬럼에 `filterType` 누락 · 한글 라벨 (`headerName`/`label`/`placeholder`) 하드코딩 · `viewName` prop 미사용 · `react-hook-form` 사용 |
| 8 | `sql-table-naming.sh` | `.sql` + Liquibase changelog (`.yaml`/`.yml`) | `CREATE TABLE TB_*` · Liquibase `tableName: TB_*` · 테이블명 대문자 포함 · `CREATE TABLE public.z_*` (비즈니스 테이블 public 추가) | 테이블명 `z_` prefix 없음 (시스템 테이블 예외) · boolean 컬럼 `BOOLEAN` 타입 · ID 컬럼 `SERIAL`/`BIGSERIAL` · `CREATE TABLE z_*` 에 audit 6컬럼 누락 |

## 헬퍼 (`_lib.sh`)

```bash
block "<message>" "<rule reference>"   # exit 2 → Tool 실행 중단
warn "<message>" "<rule reference>"    # stderr 만 출력 + 계속 진행
```

`$FILE_PATH` 는 dispatcher 가 자동 주입.

## 추가 작성 가이드

새 validator 작성 시 다음 패턴:

```bash
# my-validator.sh
# Sourced by pre-tool-use-validator.sh — uses $FILE_PATH $CONTENT

# 1. 가드 — 비대상 파일은 즉시 return 0
case "$FILE_PATH" in
  *.java) ;;
  *) return 0 ;;
esac
[ -z "$CONTENT" ] && return 0

# 2. 검증 로직
if grep -qE 'pattern_to_block' <<<"$CONTENT"; then
  block "차단 사유" "참조 rule"
fi

if grep -qE 'pattern_to_warn' <<<"$CONTENT"; then
  warn "경고 사유" "참조 rule"
fi
```

작성 후 `pre-tool-use-validator.sh` 의 source 목록에 추가.

## 디버깅 팁

- `bash -x ./<validator>.sh` 로 실행 추적
- `block` / `warn` 호출 시 `$FILE_PATH` 가 자동 표시
- `grep -qE` 가 false 인지 확인 — `<<<"$CONTENT"` 가 비어있을 수 있음 (Edit 시 stdin 에 content 없음)
