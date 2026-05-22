# 32. KTNG 보안 / 권한

## 1. 인증 (Spring Security)

KTNG 는 `t3series-wingui` 의 표준 Spring Security 사용. 로그인 후 세션 기반.

## 2. 권한 — `@ExecPermission` 어노테이션 (KTNG 필수 패턴)

KTNG 모든 Controller 엔드포인트는 이 어노테이션으로 권한 체크:

```java
@ExecPermission(menuCd = "UI_BF_KTNG_01", type = ServiceConstants.PERMISSION_TYPE_READ)
@PostMapping("/baselineforecast/master/bfktng01/q1")
public List<Map<String, Object>> getData1(...) {...}
```

### 2.1 권한 type 매트릭스

| type 상수 | TB_AD_PERMISSION_GROUP.PERMISSION_TP | 의미 | 적용 |
|---|---|---|---|
| `PERMISSION_TYPE_READ` | `READ` | 조회 | `/q1`, `/q2`, `/popq1`, `/codeq1`, `/chartq1` |
| `PERMISSION_TYPE_UPDATE` | `UPDATE` | 저장/추가 + 보통 삭제도 포함 | `/s1`, `/s2`, `/d1` (KTNG 관례) |
| `PERMISSION_TYPE_DELETE` | `DELETE` | 삭제 전용 | (필요 시 — KTNG 는 거의 UPDATE 로 통합) |
| `PERMISSION_TYPE_EXECUTE` | `EXECUTE` | 실행 (배치/시뮬레이션) | `/run`, `/execute`, batch endpoint |

> KTNG 실제 코드는 `/d1` 삭제 엔드포인트도 `PERMISSION_TYPE_UPDATE` 로 처리하는 경우가 흔함 (단순화).

### 2.2 menuCd 값
- KTNG 화면: `UI_<DOMAIN>_KTNG_<NN>`
- AD/공통: `UI_AD_FILEUPLOAD`, `UI_AD_MANUAL_BATCH`, `UI_AD_SCHEDULER_JOB_CUSTOM`

### 2.3 권한 DB 등록
화면별 권한은 `TB_AD_PERMISSION_GROUP` 에 등록:

```sql
DECLARE @MID CHAR(32) = (SELECT ID FROM TB_AD_MENU WHERE MENU_CD = 'UI_BF_KTNG_04');

-- DEFAULT 그룹에 READ + UPDATE 권한 부여
INSERT INTO TB_AD_PERMISSION_GROUP (ID, GRP_ID, MENU_ID, PERMISSION_TP, USABILITY, CREATE_BY, CREATE_DTTM)
SELECT REPLACE(NEWID(),'-',''), 'DEFAULT', @MID, 'READ', 'Y', 'admin', GETDATE()
WHERE NOT EXISTS (
    SELECT 1 FROM TB_AD_PERMISSION_GROUP
     WHERE MENU_ID = @MID AND GRP_ID = 'DEFAULT' AND PERMISSION_TP = 'READ'
);
INSERT INTO TB_AD_PERMISSION_GROUP (ID, GRP_ID, MENU_ID, PERMISSION_TP, USABILITY, CREATE_BY, CREATE_DTTM)
SELECT REPLACE(NEWID(),'-',''), 'DEFAULT', @MID, 'UPDATE', 'Y', 'admin', GETDATE()
WHERE NOT EXISTS (
    SELECT 1 FROM TB_AD_PERMISSION_GROUP
     WHERE MENU_ID = @MID AND GRP_ID = 'DEFAULT' AND PERMISSION_TP = 'UPDATE'
);
```

### 2.4 형제 메뉴에서 권한 복사 (권장)

```sql
DECLARE @SRC CHAR(32) = (SELECT ID FROM TB_AD_MENU WHERE MENU_CD = 'UI_BF_KTNG_03');
DECLARE @NEW CHAR(32) = (SELECT ID FROM TB_AD_MENU WHERE MENU_CD = 'UI_BF_KTNG_04');

INSERT INTO TB_AD_PERMISSION_GROUP (ID, GRP_ID, MENU_ID, PERMISSION_TP, USABILITY, CREATE_BY, CREATE_DTTM)
SELECT REPLACE(NEWID(),'-',''), p.GRP_ID, @NEW, p.PERMISSION_TP, p.USABILITY, 'admin', GETDATE()
FROM TB_AD_PERMISSION_GROUP p
WHERE p.MENU_ID = @SRC
  AND NOT EXISTS (
        SELECT 1 FROM TB_AD_PERMISSION_GROUP x
         WHERE x.MENU_ID = @NEW AND x.GRP_ID = p.GRP_ID AND x.PERMISSION_TP = p.PERMISSION_TP
  );
```

## 3. 비밀번호 / 비밀값 관리

- 평문 password 를 `application.yaml` 에 두지 말 것
- KTNG 는 Jasypt (`jasypt-spring-boot-starter`) 사용 가능 — 암호화된 값을 `ENC(...)` 로 감쌈
- JWT 시크릿 / API 키는 환경변수 또는 외부 vault

## 4. 사용자 정보 조회 (Controller 안)

```java
@Autowired
private UserService userService;

String username = userService.getUserDetails().getUsername();
// ...
param.put("P_USER_ID", new Object[] { username, String.class, ParameterMode.IN });
```

저장 SP 호출 시 `P_USER_ID` 로 현재 사용자 ID 전달 — SP 안에서 `MODIFY_BY`/`CREATE_BY` 로 사용.

## 5. CSRF / CORS

- 현 KTNG 는 폼 기반 세션 인증 → CSRF 토큰 활성화 권장
- 같은 origin 에서 호출하므로 CORS 설정 일반적으로 불필요

## 6. 체크리스트

- [ ] 모든 Controller 엔드포인트에 `@ExecPermission(menuCd, type)`?
- [ ] menuCd 값이 실제 TB_AD_MENU 의 MENU_CD 와 일치?
- [ ] type 이 READ/UPDATE/DELETE/EXECUTE 중?
- [ ] 메뉴 추가 시 `TB_AD_PERMISSION_GROUP` INSERT 함께?
- [ ] 평문 password / API key 가 소스에 없음?
- [ ] 저장 SP 에 `P_USER_ID` 파라미터 전달 (감사 추적)?

## 7. Anti-patterns

| ❌ | ✅ |
|---|---|
| `@PreAuthorize` 사용 | `@ExecPermission` (KTNG 표준) |
| 권한 없이 엔드포인트 노출 | 반드시 `@ExecPermission` 명시 |
| 평문 비밀번호 yaml 하드코딩 | Jasypt 또는 환경변수 |
| 메뉴는 추가했는데 PERMISSION_GROUP 미등록 | 형제 메뉴 권한 복사 |
| menuCd 환각 (실재하지 않는 코드) | TB_AD_MENU 에 실제 등록된 MENU_CD 만 |
