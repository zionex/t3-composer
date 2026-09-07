// =============================================================================
// API Key store — Anthropic API Key 등록 여부 + LLM backend(api|cli) 를 앱 전역 공유.
//   · 여러 화면에서 동일한 등록 상태를 참조 (Composer / Home / 헤더 chip 등)
//   · 저장 후 refresh 로 모든 소비자 자동 갱신
//   · loading gate 값은 `apiKeyRegistered === null` (초기 미확인) 규약을 유지
//     — T3Composer 진입 게이팅과 동일하게 판정하도록 하기 위함
// =============================================================================
import { create } from 'zustand';
import { getApiKeyStatus } from '../util/t3composer/api';

export const useApiKeyStore = create((set, get) => ({
  apiKeyRegistered: null,   // null=미확인, true=등록, false=미등록
  llmBackend: 'api',        // 'api' | 'cli'
  loading: false,

  /** 앱 mount 시 1회 호출 — 서버에서 등록 여부 조회 */
  refresh: async () => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const res = await getApiKeyStatus();
      set({
        apiKeyRegistered: !!res?.data?.registered,
        llmBackend: res?.data?.llmBackend === 'cli' ? 'cli' : 'api',
        loading: false,
      });
    } catch {
      set({ apiKeyRegistered: false, loading: false });
    }
  },
}));

/** 현재 등록 여부 스냅샷 (컴포넌트 밖에서 조회 시) */
export const getApiKeyRegistered = () => useApiKeyStore.getState().apiKeyRegistered;
