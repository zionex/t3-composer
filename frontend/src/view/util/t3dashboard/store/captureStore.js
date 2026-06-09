import { create } from 'zustand';

/**
 * 이미지 캡처 상태 스토어 (stub).
 * t3-composer에서 대시보드 캡처 기능은 미사용이므로 빈 상태만 제공.
 */
export const useCaptureStore = create(() => ({
  contentRef: null,
  capturedImage: null,
}));

export const captureStoreApi = {
  getState: useCaptureStore.getState,
  setState: useCaptureStore.setState,
  subscribe: useCaptureStore.subscribe,
};
