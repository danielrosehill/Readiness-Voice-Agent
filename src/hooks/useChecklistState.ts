import { useCallback, useRef, useState } from 'react';
import { ChecklistEntry, SessionState } from '../types';

export function useChecklistState(checklist: ChecklistEntry | null) {
  const [state, setState] = useState<SessionState>({
    checklistId: checklist?.id ?? '',
    currentIndex: 0,
    checkedItems: new Set(),
    skippedItems: new Set(),
    status: 'idle',
  });

  // Keep a ref for synchronous access in event handlers
  const stateRef = useRef(state);
  stateRef.current = state;

  const totalItems = checklist?.items.length ?? 0;

  const start = useCallback(() => {
    setState((s) => ({ ...s, status: 'active', currentIndex: 0, checkedItems: new Set(), skippedItems: new Set() }));
  }, []);

  const markDone = useCallback(
    (index: number) => {
      setState((s) => {
        if (!checklist) return s;
        const item = checklist.items[index];
        if (!item) return s;
        const checked = new Set(s.checkedItems);
        checked.add(item.id);
        const next = Math.min(index + 1, totalItems);
        const status = next >= totalItems ? 'complete' : s.status;
        return { ...s, checkedItems: checked, currentIndex: next, status };
      });
    },
    [checklist, totalItems]
  );

  const skip = useCallback(
    (index: number) => {
      setState((s) => {
        if (!checklist) return s;
        const item = checklist.items[index];
        if (!item) return s;
        const skipped = new Set(s.skippedItems);
        skipped.add(item.id);
        const next = Math.min(index + 1, totalItems);
        const status = next >= totalItems ? 'complete' : s.status;
        return { ...s, skippedItems: skipped, currentIndex: next, status };
      });
    },
    [checklist, totalItems]
  );

  const goBack = useCallback(() => {
    setState((s) => ({
      ...s,
      currentIndex: Math.max(0, s.currentIndex - 1),
    }));
  }, []);

  const restart = useCallback(() => {
    setState((s) => ({
      ...s,
      currentIndex: 0,
      checkedItems: new Set(),
      skippedItems: new Set(),
      status: 'active',
    }));
  }, []);

  const pause = useCallback(() => {
    setState((s) => ({ ...s, status: 'paused' }));
  }, []);

  const resume = useCallback(() => {
    setState((s) => ({ ...s, status: 'active' }));
  }, []);

  const complete = useCallback(() => {
    setState((s) => ({ ...s, status: 'complete' }));
  }, []);

  const getProgress = useCallback(() => {
    const s = stateRef.current;
    return {
      checked: s.checkedItems.size,
      skipped: s.skippedItems.size,
      remaining: totalItems - s.checkedItems.size - s.skippedItems.size,
      total: totalItems,
      currentIndex: s.currentIndex,
    };
  }, [totalItems]);

  return {
    state,
    stateRef,
    start,
    markDone,
    skip,
    goBack,
    restart,
    pause,
    resume,
    complete,
    getProgress,
    totalItems,
  };
}
