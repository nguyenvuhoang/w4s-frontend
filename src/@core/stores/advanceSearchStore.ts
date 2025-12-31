// stores/advanceSearchStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { produce } from 'immer';

type AdvanceSearchState = {
  expandedMap: Record<string, boolean>;
  toggleExpand: (formId: string) => void;
  setExpand: (formId: string, value: boolean) => void;
  isExpanded: (formId: string) => boolean;
};

export const useAdvanceSearchStore = create<AdvanceSearchState>()(
  devtools(
    (set, get) => ({
      expandedMap: {},
      toggleExpand: (formId: string) =>
        set(
          produce((state: AdvanceSearchState) => {
            state.expandedMap[formId] = !state.expandedMap[formId];
          }),
          false,
          'toggleExpand'
        ),
      setExpand: (formId: string, value: boolean) =>
        set(
          produce((state: AdvanceSearchState) => {
            state.expandedMap[formId] = value;
          }),
          false,
          'setExpand'
        ),
      isExpanded: (formId: string) => get().expandedMap[formId] ?? false,
    }),
    { name: 'AdvanceSearchStore' }
  )
);

// Optimized selector to prevent unnecessary re-renders
export const useIsExpanded = (formId: string) =>
  useAdvanceSearchStore((state) => state.expandedMap[formId] ?? false);
