import type { Dispatch, SetStateAction } from "react";

export interface UseUserResourceReturn<T> {
  error: Error | null;
  isLoading: boolean;
  items: T[];
  reload: () => Promise<void>;
  setItems: Dispatch<SetStateAction<T[]>>;
}
