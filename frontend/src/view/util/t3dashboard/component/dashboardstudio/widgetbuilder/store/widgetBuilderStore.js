import { create } from 'zustand';

export const useWidgetBuilderStore = create((set, get) => ({
  // 입력 상태
  prompt: '',
  setPrompt: (prompt) => set({ prompt }),
  moduleFilter: '',
  setModuleFilter: (moduleFilter) => set({ moduleFilter }),

  // LLM 추천 결과
  suggestLoading: false,
  suggestResult: null,
  suggestReason: '',
  suggestConfidence: null,   // 'high' | 'low' | null
  suggestError: null,
  setSuggestLoading: (v) => set({ suggestLoading: v }),
  setSuggestResult: (result, reason, confidence = null) => set({
    suggestResult: result,
    suggestReason: reason,
    suggestConfidence: confidence,
    suggestError: null,
  }),
  setSuggestError: (err) => set({ suggestError: err, suggestLoading: false }),

  // 위젯 라이브러리
  library: [],
  setLibrary: (library) => set({ library }),
  libraryLoading: false,
  setLibraryLoading: (v) => set({ libraryLoading: v }),

  // 현재 편집 중인 spec
  setEditingSpec: (spec) => set({ editingSpec: spec }),
  editingSpec: null,

  applyResult: () => {
    const { suggestResult } = get();
    if (suggestResult) set({ editingSpec: { ...suggestResult } });
  },

  reset: () => set({
    prompt: '',
    suggestResult: null,
    suggestReason: '',
    suggestConfidence: null,
    suggestError: null,
    editingSpec: null,
  }),
}));
