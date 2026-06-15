import { useCallback, useSyncExternalStore } from "react";

/**
 * Tracks a CSS media query via useSyncExternalStore — SSR-safe (returns `false`
 * on the server / first client render so hydration matches) and free of
 * setState-in-effect cascades.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
