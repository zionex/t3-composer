// Stub — fieldCascade 레지스트리. 단독 환경에서는 자동 cascade 미구현.
export const FIELD_CASCADE_REGISTRY = {};

/** Stub — wingui 의 grid 자동 cascade. 단독 환경에서는 no-op. */
export function applyGridCascade(/* gridObj, gridItems, opts */) {
  // no-op: preview 환경에서 cascade 동작 없음
}

/** Stub — wingui 의 form cascade. 단독 환경에서는 no-op. */
export function useFieldCascade(/* args */) {
  // no-op
}

/** Stub — popup filter prop 빌더. 빈 객체 반환. */
export function buildPopupFilterProps(/* childKey, getValues */) {
  return {};
}

export default FIELD_CASCADE_REGISTRY;
