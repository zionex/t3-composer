// =============================================================================
// Target System store — 현재 선택된 Target 을 모든 페이지/요청에 공유.
//   · localStorage 에 영속화 (브라우저 재진입 시 복원)
//   · Phase 3 에서 chat / wizard 호출에 targetCd 가 함께 전달되도록 확장
// =============================================================================
import { create } from 'zustand';
import { listTargets } from './api';

const STORAGE_KEY = 't3composer.targetCd';

const readPersisted = () => {
  try { return localStorage.getItem(STORAGE_KEY) || null; }
  catch { return null; }
};

const writePersisted = (cd) => {
  try {
    if (cd) localStorage.setItem(STORAGE_KEY, cd);
    else    localStorage.removeItem(STORAGE_KEY);
  } catch { /* ignore */ }
};

export const useTargetStore = create((set, get) => ({
  targets: [],
  loading: false,
  loaded: false,
  error: null,
  currentTargetCd: readPersisted(),

  /** mount 시 한 번 호출 — Target 목록 + 마지막 선택 복원 */
  loadTargets: async () => {
    if (get().loading) return;
    set({ loading: true, error: null });
    try {
      const res = await listTargets();
      const list = Array.isArray(res?.data) ? res.data : [];
      let current = get().currentTargetCd;
      if (!current && list.length > 0) {
        // 첫 진입 — sort_order 가장 낮은 첫 Target (T3SERIES) default
        current = list[0].targetCd;
        writePersisted(current);
      } else if (current && !list.find((t) => t.targetCd === current)) {
        // 저장된 Target 이 더 이상 활성 목록에 없음 → 첫 활성으로 fallback
        current = list[0]?.targetCd || null;
        writePersisted(current);
      }
      set({ targets: list, currentTargetCd: current, loaded: true, loading: false });
    } catch (e) {
      set({
        error: e?.response?.data?.message || e?.message || 'Target 목록 로드 실패',
        loading: false,
      });
    }
  },

  setCurrentTarget: (targetCd) => {
    writePersisted(targetCd);
    set({ currentTargetCd: targetCd });
  },
}));

/** 현재 Target 객체 (없으면 null) */
export const getCurrentTarget = () => {
  const { targets, currentTargetCd } = useTargetStore.getState();
  return targets.find((t) => t.targetCd === currentTargetCd) || null;
};
