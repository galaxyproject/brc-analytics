import type { ReactNode } from "react";

export interface Props {
  actions?: ReactNode;
  children?: ReactNode;
  subtitle?: ReactNode;
  title: ReactNode;
}
