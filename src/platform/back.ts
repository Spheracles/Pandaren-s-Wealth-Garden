/**
 * Back-navigation stack shared by the Android back button and the browser.
 * Components that can "go back" (a modal, a detail view) register a handler while
 * mounted; the most recently registered one wins.
 */
import { useEffect, useRef } from 'react';

const stack: { id: number; fn: () => void }[] = [];
let seq = 0;

export function useBackHandler(fn: (() => void) | null | undefined, active = true) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    if (!active || !ref.current) return;
    const id = ++seq;
    stack.push({ id, fn: () => ref.current && ref.current() });
    return () => { const i = stack.findIndex(x => x.id === id); if (i >= 0) stack.splice(i, 1); };
  }, [active]);
}

/** Returns true when a registered handler consumed the back action. */
export function runBack(): boolean {
  const top = stack[stack.length - 1];
  if (!top) return false;
  top.fn();
  return true;
}
