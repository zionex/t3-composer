/**
 * t3dashboard 의 현재 사용자/그룹 정보 단일 진입점.
 *
 * 현재: 인증 없음 — 모두 'composer-dev' 한 명으로 동작.
 *   - 백엔드 AuthenticationProvider mock 사용자(composer-dev) 와 일치
 *   - 프런트 shim useUserStore default (composer-dev) 와 일치
 *
 * 나중에 실제 인증 붙일 때:
 *   1. ENABLE_AUTH = true
 *   2. resolveCurrentUser() / useCurrentUser() 가 실제 사용자 store/세션에서 조회
 *   3. 호출부는 손대지 않음
 */

export const ENABLE_AUTH = false;

export const DEFAULT_USER = Object.freeze({
  userId: 'composer-dev',
  userName: 'Composer Dev',
  groupId: 'DEFAULT',
  groupName: 'DEFAULT',
});

export function resolveCurrentUser() {
  if (!ENABLE_AUTH) return DEFAULT_USER;
  // TODO: ENABLE_AUTH=true 시 useUserStore.getState().userInfo 등 실값으로 교체
  return DEFAULT_USER;
}

export function useCurrentUser() {
  // ENABLE_AUTH=true 가 되면 zustand selector 로 교체
  return DEFAULT_USER;
}

/** 대시보드 공개범위 수정 가능 여부 — 오픈 환경은 항상 true */
export function canEditDashboardAccess(dashboard) {
  if (!ENABLE_AUTH) return true;
  const me = resolveCurrentUser();
  return String(dashboard?.created_by) === String(me.userId);
}

/** "내 것" 인지 확인 — 오픈 환경은 항상 true */
export function isMyResource(resource) {
  if (!ENABLE_AUTH) return true;
  const me = resolveCurrentUser();
  return String(resource?.created_by) === String(me.userId);
}

/**
 * 편집 액션(위젯/대시보드 생성, 모드 토글) 수행 권한.
 *
 * - 대시보드 단위가 아닌 **사용자 단위 전역** 판정.
 * - 오픈 환경(ENABLE_AUTH=false)에서는 항상 true → 모든 컨설턴트가 편집자.
 * - 인증 켜지면 role/permission flag 체크로 교체 (TODO).
 *
 * (destructive 액션인 권한 편집 ✎ 은 canEditDashboardAccess 로 별도 보호 — 본 함수 사용 X)
 */
export function canEditUser() {
  if (!ENABLE_AUTH) return true;
  // TODO: ENABLE_AUTH=true 시 resolveCurrentUser().role/permissions 등으로 판정.
  return false;
}

/** canEditUser 의 React hook 버전. zustand selector 형태로 교체될 자리. */
export function useCanEditUser() {
  return canEditUser();
}
