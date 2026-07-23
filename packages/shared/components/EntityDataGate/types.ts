import type { ReactNode } from "react";

export interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}
