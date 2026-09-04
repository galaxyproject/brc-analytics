import type { ReactNode } from "react";

export interface Props {
  action?: ReactNode;
  children?: ReactNode;
  count?: number;
  emptyState: ReactNode;
  error?: Error | null;
  id: string;
  isLoading: boolean;
  title: string;
}
