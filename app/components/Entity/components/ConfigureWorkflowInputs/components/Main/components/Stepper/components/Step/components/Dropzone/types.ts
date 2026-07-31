import { type DragEvent, type ReactNode } from "react";

export interface Props {
  children: ReactNode;
  onDrop: (event: DragEvent<HTMLElement>) => void;
}
