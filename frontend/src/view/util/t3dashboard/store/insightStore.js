import { create } from 'zustand';

/**
 * insight 시스템 상태 스토어 (경량화 버전).
 * 원본(379줄)에서 dashboardstudio가 실제 사용하는 상태만 유지.
 *
 * 제거된 것: ViewDataComposer, AI 함수 맵, ViewDataProvider, WebSocket 설정
 */
const useInsightSystemStore = create(() => ({
  apiPrefix: '',
  baseURL: '',
  menuList: null,
  widgetList: null,
  userId: '',
  languageCode: (typeof localStorage !== 'undefined' && localStorage.getItem('languageCode')) || 'ko',
}));

export { useInsightSystemStore };

/**
 * selector 함수를 받아 현재 상태의 일부를 반환.
 * 원본: getInsightSystemStore(s => s.apiPrefix)
 */
export function getInsightSystemStore(selector) {
  const state = useInsightSystemStore.getState();
  return selector ? selector(state) : state;
}

export const insightSystemStoreApi = {
  getState: useInsightSystemStore.getState,
  setState: useInsightSystemStore.setState,
  subscribe: useInsightSystemStore.subscribe,
};
