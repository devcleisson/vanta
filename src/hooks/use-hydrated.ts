"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** True after the first client render — avoids hydration mismatches with localStorage state. */
export function useHydrated() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
