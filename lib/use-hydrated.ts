import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * False during server rendering and hydration, true once JavaScript is running. Lets a
 * Client Component render a no-JavaScript fallback first without a hydration mismatch.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
