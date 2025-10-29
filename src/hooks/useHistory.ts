import { useState, useCallback, useRef } from 'react';

export interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

interface UseHistoryReturn<T> {
  state: T;
  setState: (newState: T, skipHistory?: boolean) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  reset: (initialState: T) => void;
  clearHistory: () => void;
}

const MAX_HISTORY_LENGTH = 100;

export function useHistory<T>(initialState: T): UseHistoryReturn<T> {
  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: [],
  });

  const setState = useCallback((newState: T, skipHistory = false) => {
    setHistory((current) => {
      if (skipHistory) {
        return {
          ...current,
          present: newState,
        };
      }

      // Add current present to past, trim if needed
      const newPast = [...current.past, current.present];
      if (newPast.length > MAX_HISTORY_LENGTH) {
        newPast.shift(); // Remove oldest entry
      }

      return {
        past: newPast,
        present: newState,
        future: [], // Clear future when new action is taken
      };
    });
  }, []);

  const undo = useCallback(() => {
    setHistory((current) => {
      if (current.past.length === 0) return current;

      const newPast = [...current.past];
      const newPresent = newPast.pop()!;

      return {
        past: newPast,
        present: newPresent,
        future: [current.present, ...current.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((current) => {
      if (current.future.length === 0) return current;

      const newFuture = [...current.future];
      const newPresent = newFuture.shift()!;

      return {
        past: [...current.past, current.present],
        present: newPresent,
        future: newFuture,
      };
    });
  }, []);

  const reset = useCallback((newInitialState: T) => {
    setHistory({
      past: [],
      present: newInitialState,
      future: [],
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory((current) => ({
      past: [],
      present: current.present,
      future: [],
    }));
  }, []);

  return {
    state: history.present,
    setState,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    reset,
    clearHistory,
  };
}

