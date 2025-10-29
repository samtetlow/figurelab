import { useCallback, useRef, useState } from "react";

type Snapshot = any;

export function useUndoRedo(initial?: Snapshot) {
  const stackRef = useRef<Snapshot[]>(initial ? [initial] : []);
  const idxRef = useRef<number>(initial ? 0 : -1);
  const [, setTick] = useState(0);

  const pushSnapshot = useCallback((snap: Snapshot) => {
    // truncate future
    if (idxRef.current < stackRef.current.length - 1) {
      stackRef.current = stackRef.current.slice(0, idxRef.current + 1);
    }
    stackRef.current.push(JSON.parse(JSON.stringify(snap)));
    idxRef.current = stackRef.current.length - 1;
    setTick((t) => t + 1);
  }, []);

  const undo = useCallback(() => {
    if (idxRef.current > 0) {
      idxRef.current -= 1;
      setTick((t) => t + 1);
      return JSON.parse(JSON.stringify(stackRef.current[idxRef.current]));
    }
    return null;
  }, []);

  const redo = useCallback(() => {
    if (idxRef.current < stackRef.current.length - 1) {
      idxRef.current += 1;
      setTick((t) => t + 1);
      return JSON.parse(JSON.stringify(stackRef.current[idxRef.current]));
    }
    return null;
  }, []);

  const canUndo = useCallback(() => idxRef.current > 0, []);
  const canRedo = useCallback(() => idxRef.current < stackRef.current.length - 1, []);

  const reset = useCallback((snap: Snapshot) => {
    stackRef.current = [JSON.parse(JSON.stringify(snap))];
    idxRef.current = 0;
    setTick((t) => t + 1);
  }, []);

  const peek = useCallback(() => {
    if (idxRef.current >= 0) return JSON.parse(JSON.stringify(stackRef.current[idxRef.current]));
    return null;
  }, []);

  return { pushSnapshot, undo, redo, canUndo, canRedo, reset, peek };
}
