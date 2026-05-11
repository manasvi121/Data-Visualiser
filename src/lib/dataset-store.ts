import { useSyncExternalStore } from "react";
import type { Dataset } from "./dataset";

let current: Dataset | null = null;
const listeners = new Set<() => void>();

export const datasetStore = {
  get: () => current,
  set: (ds: Dataset | null) => {
    current = ds;
    listeners.forEach((l) => l());
  },
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useDataset() {
  return useSyncExternalStore(
    datasetStore.subscribe,
    () => current,
    () => null,
  );
}
