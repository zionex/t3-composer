// =============================================================================
// Target System store — 현재 선택된 Target 을 모든 페이지/요청에 공유.
//   · localStorage 에 영속화 (브라우저 재진입 시 복원)
//   · Phase 3 에서 chat / wizard 호출에 targetCd 가 함께 전달되도록 확장
// =============================================================================
import { create } from 'zustand';
import { listTargets, getTargetSnapshotStatus, restoreCurrentTargetSnapshot } from './api';

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

  // ── 거버넌스 스냅샷 복원 (Target 전환 시 자동 + 확인) ───────────────────────
  // 다른 Target 으로 전환 시, 그 Target 의 스냅샷과 현재 디스크가 다르면
  // pendingRestore 를 세팅 → UI 가 확인 다이얼로그를 띄움.
  pendingRestore: null,   // { targetCd, status }
  restoreBusy: false,

  /** Target 선택 — 스냅샷 불일치 감지 시 복원 확인을 거친다. */
  switchTarget: async (targetCd) => {
    if (!targetCd || targetCd === get().currentTargetCd) return;
    let status = null;
    try {
      const res = await getTargetSnapshotStatus(targetCd);
      status = res?.data || null;
    } catch { status = null; }
    if (status && status.hasSnapshot && status.inSync === false) {
      // 디스크가 이 Target 의 스냅샷과 다름 — 사용자 확인 후 복원
      set({ pendingRestore: { targetCd, status } });
    } else {
      // 일치하거나 스냅샷 없음 — 즉시 전환
      get().setCurrentTarget(targetCd);
    }
  },

  /** 확인 다이얼로그에서 [복원] — is_current 스냅샷을 디스크로 복원 후 전환. */
  confirmPendingRestore: async () => {
    const pr = get().pendingRestore;
    if (!pr) return { ok: false };
    set({ restoreBusy: true });
    try {
      const res = await restoreCurrentTargetSnapshot(pr.targetCd);
      const data = res?.data || {};
      if (data.ok !== false) get().setCurrentTarget(pr.targetCd);
      set({ pendingRestore: null, restoreBusy: false });
      return data;
    } catch (e) {
      set({ restoreBusy: false });
      return { ok: false, error: e?.response?.data?.error || e?.message || '복원 실패' };
    }
  },

  /** 확인 다이얼로그 닫기. switchAnyway=true 면 복원 없이 전환만. */
  dismissPendingRestore: ({ switchAnyway = false } = {}) => {
    const pr = get().pendingRestore;
    if (pr && switchAnyway) get().setCurrentTarget(pr.targetCd);
    set({ pendingRestore: null });
  },
}));

/** 현재 Target 객체 (없으면 null) */
export const getCurrentTarget = () => {
  const { targets, currentTargetCd } = useTargetStore.getState();
  return targets.find((t) => t.targetCd === currentTargetCd) || null;
};
