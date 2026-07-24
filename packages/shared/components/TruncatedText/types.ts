import type { ReactNode } from "react";

export interface Props {
  children: string;
  maxLines?: number;
  suffix?: ReactNode;
}
