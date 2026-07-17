import { DragEvent, ReactNode } from "react";

export interface Props {
  children: ReactNode;
  onDrop: (event: DragEvent<HTMLElement>) => void;
}
