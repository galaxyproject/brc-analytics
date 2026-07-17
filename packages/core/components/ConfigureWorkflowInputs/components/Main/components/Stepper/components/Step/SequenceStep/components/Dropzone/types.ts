import { DragEvent } from "react";

export interface Props {
  onClick: () => void;
  onDrop: (event: DragEvent<HTMLElement>) => void;
}
